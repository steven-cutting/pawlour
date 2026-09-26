// Runs inside the viewer after its WebGL scene and camera are initialized.
const PM=BiscuitPoseMath, rig=source.rig;
let currentPose=PM.clone(source.presets.standing), customBase=null, values={...currentPose.controls};
let pendingPoseFrame=0;
const ranges=new Map(), poseStatus=document.querySelector('#pose-status');
function message(text,error=false){poseStatus.textContent=text;poseStatus.dataset.error=String(error);}
function deformBuffer(batch,matrices,correctives,stride){
 const {rest,data,joints,weights,morphs}=batch;
 for(let vi=0,o=0;o<rest.length;vi++,o+=stride){
  let x=rest[o],y=rest[o+1],z=rest[o+2];
  for(const [name,delta] of morphs){const v=correctives[name]||0;x+=delta[vi*3]*v;y+=delta[vi*3+1]*v;z+=delta[vi*3+2]*v;}
  let px=0,py=0,pz=0,nx=0,ny=0,nz=0,tx=0,ty=0,tz=0;
  for(let k=0;k<4;k++){const w=weights[vi*4+k];if(!w)continue;const m=matrices[joints[vi*4+k]];
   px+=w*(m[0]*x+m[4]*y+m[8]*z+m[12]);py+=w*(m[1]*x+m[5]*y+m[9]*z+m[13]);pz+=w*(m[2]*x+m[6]*y+m[10]*z+m[14]);
   if(stride===12){const a=rest[o+3],b=rest[o+4],c=rest[o+5];nx+=w*(m[0]*a+m[4]*b+m[8]*c);ny+=w*(m[1]*a+m[5]*b+m[9]*c);nz+=w*(m[2]*a+m[6]*b+m[10]*c);
    const d=rest[o+8],e=rest[o+9],f=rest[o+10];tx+=w*(m[0]*d+m[4]*e+m[8]*f);ty+=w*(m[1]*d+m[5]*e+m[9]*f);tz+=w*(m[2]*d+m[6]*e+m[10]*f);}
  }
  data[o]=px;data[o+1]=py;data[o+2]=pz;
  if(stride===12){const n=Math.hypot(nx,ny,nz)||1,t=Math.hypot(tx,ty,tz)||1;data[o+3]=nx/n;data[o+4]=ny/n;data[o+5]=nz/n;data[o+8]=tx/t;data[o+9]=ty/t;data[o+10]=tz/t;}
 }
 gl.bindBuffer(gl.ARRAY_BUFFER,batch.buffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,data);
}
function reframe(){
 const bounds=Object.fromEntries(['body','sweater','collar','forelegs'].map(k=>[k,{min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]}]));
 for(const p of parts)for(const b of p.batches)for(let i=0;i<b.data.length;i+=12){
  const keys=['body'];if(p.owner==='garment'){keys.push('sweater');if(b.rest[i+2]>1.7)keys.push('collar');if(b.rest[i+1]<-.22&&b.rest[i+2]<1.6)keys.push('forelegs');}
  else if(p.name.startsWith('Foreleg')||p.name.includes('.Front.'))keys.push('forelegs');
  for(const key of keys)for(let d=0;d<3;d++){bounds[key].min[d]=Math.min(bounds[key].min[d],b.data[i+d]);bounds[key].max[d]=Math.max(bounds[key].max[d],b.data[i+d]);}
 }
 for(const [key,b] of Object.entries(bounds)){source.frames[key]={target:b.min.map((x,i)=>(x+b.max[i])/2),scale:Math.max(...b.min.map((x,i)=>b.max[i]-x))*1.23};}
}
function syncSliders(){for(const c of rig.controls){const {input,output}=ranges.get(c.id);input.value=values[c.id]||0;output.value=Number(input.value).toFixed(c.step<1?2:0)+c.unit;}}
function updatePose(doc,fit=false){
 currentPose=doc;const matrices=PM.matrices(rig,doc);
 for(const p of parts){for(const b of p.batches)deformBuffer(b,matrices,doc.correctives,12);deformBuffer(p.edgeData,matrices,doc.correctives,3);}
 reframe();if(fit)zoom=source.frames[frame].scale;
 document.querySelector('#pose-name').textContent=doc.name;canvas.dataset.pose=doc.name;
}
function viewState(){return {yaw,pitch,zoom,frame,display,surface:mode,contours:contourInput.checked};}
function exportPose(){return {...PM.clone(currentPose),viewer:viewState()};}
function importPose(doc){
 const checked=PM.validate(rig,doc);cancelAnimationFrame(pendingPoseFrame);pendingPoseFrame=0;
 values=checked.controls?{...checked.controls}:Object.fromEntries(rig.controls.map(c=>[c.id,0]));customBase=checked.controls?null:PM.clone(checked.bones);
 updatePose(checked,true);syncSliders();stopSpin();
 const v=checked.viewer||{};yaw=v.yaw??yaw;pitch=v.pitch??pitch;frame=v.frame??frame;display=v.display??display;mode=v.surface??mode;zoom=v.zoom??source.frames[frame].scale;contourInput.checked=v.contours??contourInput.checked;
 for(const [attr,value] of [['display',display],['frame',frame],['mode',mode]])document.querySelectorAll('[data-'+attr+']').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset[attr]===value)));
 document.querySelectorAll('[data-pose]').forEach(b=>b.setAttribute('aria-pressed','false'));unselectView();label();
 message(customBase?'Pose opened. Sliders now adjust this pose.':'Pose opened.');
}
for(const c of rig.controls){
 let group=document.getElementById('group-'+c.group.replaceAll(' ','-'));
 if(!group){group=document.createElement('details');group.id='group-'+c.group.replaceAll(' ','-');group.className='pose-group';group.open=c.group==='Head';const summary=document.createElement('summary');summary.textContent=c.group;group.append(summary);document.querySelector('#pose-controls').append(group);}
 const row=document.createElement('div');row.className='slider-row';const label=document.createElement('label');label.htmlFor='control-'+c.id;label.textContent=c.label;
 const output=document.createElement('output');output.htmlFor='control-'+c.id;
 const input=document.createElement('input');Object.assign(input,{type:'range',id:'control-'+c.id,min:c.min,max:c.max,step:c.step,value:0});
 const reset=document.createElement('button');reset.textContent='↺';reset.title='Reset '+c.label;reset.setAttribute('aria-label','Reset '+c.label);
 function changed(){values[c.id]=Number(input.value);output.value=Number(input.value).toFixed(c.step<1?2:0)+c.unit;stopSpin();
  if(!pendingPoseFrame)pendingPoseFrame=requestAnimationFrame(()=>{pendingPoseFrame=0;updatePose(PM.fromControls(rig,values,'Custom pose',customBase));document.querySelectorAll('[data-pose]').forEach(b=>b.setAttribute('aria-pressed','false'));message('Custom pose');});}
 input.addEventListener('input',changed);reset.addEventListener('click',()=>{input.value=0;changed();});
 row.append(label,output,input,reset);group.append(row);ranges.set(c.id,{input,output});
}
function setPreset(key){importPose(source.presets[key]);document.querySelectorAll('[data-pose]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pose===key)));message(source.presets[key].name);}
document.querySelectorAll('[data-pose]').forEach(b=>b.addEventListener('click',()=>setPreset(b.dataset.pose)));
document.querySelector('#reset-pose').addEventListener('click',()=>setPreset('standing'));
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
document.querySelector('#save-pose').addEventListener('click',()=>{if(pendingPoseFrame){cancelAnimationFrame(pendingPoseFrame);pendingPoseFrame=0;updatePose(PM.fromControls(rig,values,'Custom pose',customBase));}download(new Blob([JSON.stringify(exportPose(),null,2)+'\n'],{type:'application/json'}),'biscuit-pose.json');message('Pose saved. Open it here or in Blender.');});
const fileInput=document.querySelector('#pose-file');document.querySelector('#open-pose').addEventListener('click',()=>fileInput.click());
fileInput.addEventListener('change',async()=>{try{const file=fileInput.files[0];if(!file)return;if(file.size>262144)throw Error('Pose file is too large.');importPose(JSON.parse(await file.text()));}catch(e){message(e.message,true);}finally{fileInput.value='';}});
document.querySelector('#save-png').addEventListener('click',()=>{stopSpin();requestAnimationFrame(()=>{
 const out=document.createElement('canvas');out.width=canvas.width;out.height=canvas.height;const ctx=out.getContext('2d');ctx.fillStyle='#eee2d4';ctx.fillRect(0,0,out.width,out.height);ctx.drawImage(canvas,0,0);out.toBlob(blob=>{if(blob){download(blob,'biscuit-pose.png');message('PNG saved.');}else message('Could not save the image.',true);},'image/png');});});
syncSliders();updatePose(currentPose);
window.biscuitPose={exportPose,importPose,setPreset,setControl:(id,value)=>{const row=ranges.get(id);if(!row)throw Error('Unknown control');row.input.value=value;row.input.dispatchEvent(new Event('input'));},matrices:()=>PM.matrices(rig,currentPose),sample:(name,count=8)=>{const p=parts.find(p=>p.name===name);if(!p)throw Error('Unknown part');return p.batches.flatMap(b=>{const result=[];for(let i=0;i<b.data.length;i+=12)result.push(Array.from(b.data.slice(i,i+3)));return result;}).slice(0,count);},sampleAt:(name,selections)=>{const p=parts.find(p=>p.name===name);if(!p)throw Error('Unknown part');return selections.map(s=>Array.from(p.batches[s.batch].data.slice(s.index*12,s.index*12+3)));},rig,parts:parts.map(p=>({name:p.name,vertices:p.batches.reduce((n,b)=>n+b.rest.length/12,0)}))};
