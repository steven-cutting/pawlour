/* Shared, dependency-free pose math. Matrices: column major. Quaternions: w,x,y,z. */
globalThis.BiscuitPoseMath = (() => {
  const clone = x => JSON.parse(JSON.stringify(x));
  const identity = () => ({location:[0,0,0],rotation:[1,0,0,0],scale:[1,1,1]});
  const unit = q => {const n=Math.hypot(...q);return q.map(x=>x/n);};
  function quaternion(a,b){const [w,x,y,z]=a,[W,X,Y,Z]=b;return [w*W-x*X-y*Y-z*Z,w*X+x*W+y*Z-z*Y,w*Y-x*Z+y*W+z*X,w*Z+x*Y-y*X+z*W];}
  function rotate(q,v){return quaternion(quaternion(q,[0,...v]),[q[0],-q[1],-q[2],-q[3]]).slice(1);}
  function matrix(t){const [w,x,y,z]=unit(t.rotation),[a,b,c]=t.scale;return [(1-2*y*y-2*z*z)*a,(2*x*y+2*w*z)*a,(2*x*z-2*w*y)*a,0,(2*x*y-2*w*z)*b,(1-2*x*x-2*z*z)*b,(2*y*z+2*w*x)*b,0,(2*x*z+2*w*y)*c,(2*y*z-2*w*x)*c,(1-2*x*x-2*y*y)*c,0,...t.location,1];}
  function multiply(a,b){const out=new Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out;}
  function corrections(spec,bones){return Object.fromEntries(spec.correctives.map(r=>{const [w,x,y,z]=unit(bones[r.bone].rotation);const angle=Math.atan2(2*(w*x+y*z),1-2*(x*x+y*y));return [r.name,Math.min(1,Math.max(0,(Math.abs(angle)-r.threshold)/r.range))];}));}
  function fromControls(spec,values={},name='Custom pose',base=null){
    const bones=base?clone(base):Object.fromEntries(spec.bones.map(b=>[b.name,identity()]));
    const lookup=Object.fromEntries(spec.bones.map(b=>[b.name,b])),complete={};
    for(const c of spec.controls){const v=values[c.id]??0;complete[c.id]=v;if(!Number.isFinite(v)||v<c.min||v>c.max)throw Error('Control outside its range: '+c.label);
      for(const target of c.targets){const t=bones[target.bone];if(c.id==='height')t.location[1]+=v;
        else {const rest=unit(lookup[target.bone].restRotation),axis=rotate([rest[0],-rest[1],-rest[2],-rest[3]],target.axis),angle=v*target.factor*Math.PI/360;t.rotation=unit(quaternion(t.rotation,[Math.cos(angle),...axis.map(x=>x*Math.sin(angle))]));}}
    }
    return {format:'biscuit-pose',version:1,modelId:spec.modelId,rigVersion:spec.rigVersion,name,bones,controls:base?null:complete,correctives:corrections(spec,bones),viewer:{}};
  }
  const keysEqual=(a,b)=>a&&typeof a==='object'&&!Array.isArray(a)&&Object.keys(a).sort().join('\0')===b.slice().sort().join('\0');
  function validate(spec,doc){
    if(!doc||doc.format!=='biscuit-pose'||doc.version!==1)throw Error('This is not a supported Biscuit pose file.');
    if(doc.modelId!==spec.modelId||doc.rigVersion!==spec.rigVersion)throw Error('This pose belongs to a different model or rig version.');
    if(typeof doc.name!=='string'||doc.name.length>120)throw Error('Invalid pose name.');
    if(!keysEqual(doc.bones,spec.bones.map(b=>b.name)))throw Error('Pose must contain each rig bone exactly once.');
    const numbers=(v,n)=>Array.isArray(v)&&v.length===n&&v.every(Number.isFinite);
    for(const [name,t] of Object.entries(doc.bones)){
      if(!t||!numbers(t.location,3)||Math.max(...t.location.map(Math.abs))>5)throw Error('Invalid location: '+name);
      if(!numbers(t.scale,3)||!t.scale.every(x=>x>=.25&&x<=4))throw Error('Invalid scale: '+name);
      if(!numbers(t.rotation,4)||Math.abs(t.rotation.reduce((a,x)=>a+x*x,0)-1)>.002)throw Error('Invalid quaternion: '+name);
    }
    const expected=corrections(spec,doc.bones);
    if(!keysEqual(doc.correctives,Object.keys(expected)))throw Error('Missing garment corrections.');
    for(const k in expected)if(!Number.isFinite(doc.correctives[k])||Math.abs(doc.correctives[k]-expected[k])>.002)throw Error('Garment corrections do not match the pose.');
    if(doc.controls!=null){
      if(!keysEqual(doc.controls,spec.controls.map(c=>c.id)))throw Error('Invalid slider values.');
      for(const c of spec.controls)if(!Number.isFinite(doc.controls[c.id])||doc.controls[c.id]<c.min||doc.controls[c.id]>c.max)throw Error('Invalid slider: '+c.label);
      // Metadata must agree with canonical transforms, or reopening would jump on the next edit.
      const canonical=fromControls(spec,doc.controls);
      for(const name in doc.bones){const a=matrix(doc.bones[name]),b=matrix(canonical.bones[name]);if(a.some((x,i)=>Math.abs(x-b[i])>.002))throw Error('Slider values do not match the pose transforms.');}
    }
    const v=doc.viewer??{};if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Invalid camera settings.');
    for(const k of ['yaw','pitch','zoom'])if(k in v&&!Number.isFinite(v[k]))throw Error('Invalid camera setting: '+k);
    if('pitch' in v&&(v.pitch< -1.56||v.pitch>1.57))throw Error('Camera pitch is out of range.');
    if('zoom' in v&&(v.zoom<.3||v.zoom>12))throw Error('Camera zoom is out of range.');
    for(const [k,allowed] of [['frame',['body','sweater','collar','forelegs']],['display',['dressed','sweater','biscuit']],['surface',['color','clay','wire']]])if(k in v&&!allowed.includes(v[k]))throw Error('Invalid viewer setting: '+k);
    if('contours' in v&&typeof v.contours!=='boolean')throw Error('Invalid contour setting.');
    return clone(doc);
  }
  function matrices(spec,doc){const world={};return spec.bones.map(b=>{const local=multiply(b.restLocal,matrix(doc.bones[b.name]));world[b.name]=b.parent?multiply(world[b.parent],local):local;return multiply(world[b.name],b.inverseBind);});}
  return {clone,identity,quaternion,matrix,multiply,corrections,fromControls,validate,matrices};
})();
