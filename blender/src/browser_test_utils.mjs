// Verification uses an isolated Chrome profile, never a personal browser session.
import fs from 'node:fs/promises';
import path from 'node:path';
export async function connect(profile) {
 const [port,endpoint]=(await fs.readFile(path.join(profile,'DevToolsActivePort'),'utf8')).trim().split('\n');
 const ws=new WebSocket(`ws://127.0.0.1:${port}${endpoint}`);
 await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
 let id=0,session;const pending=new Map(),errors=[],requests=[];
 ws.onmessage=event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}}
  if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);
  if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m.params.args);
  if(m.method==='Network.requestWillBeSent')requests.push(m.params.request.url);
 };
 function send(method,params={},sid=session){return new Promise((resolve,reject)=>{const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(Error('Timed out: '+method));},30000);pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params,...(sid?{sessionId:sid}:{})}));});}
 const targets=await send('Target.getTargets',{},null);
 const target=targets.targetInfos.find(t=>t.type==='page');
 session=(await send('Target.attachToTarget',{targetId:target.targetId,flatten:true},null)).sessionId;
 for(const method of ['Page.enable','Runtime.enable','Network.enable'])await send(method);
 await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:-1,uploadThroughput:-1});
 async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
 const frames=()=>evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true))))');
 async function ready(){for(let n=0;n<200;n++){if(await evaluate("document.querySelector('canvas')?.dataset.ready==='true'")){await frames();return;}if(errors.length)throw Error(JSON.stringify(errors));await new Promise(r=>setTimeout(r,100));}throw Error('Viewer not ready');}
 async function screenshot(file,canvasOnly=false){let clip;if(canvasOnly)clip=await evaluate("(()=>{const b=document.querySelector('canvas').getBoundingClientRect();return {x:b.x+scrollX,y:b.y+scrollY,width:b.width,height:b.height,scale:1}})()");const r=await send('Page.captureScreenshot',{format:'png',...(clip?{clip}:{})});await fs.writeFile(file,Buffer.from(r.data,'base64'));}
 async function click(selector){const p=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'nearest'});const b=e.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...p});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...p});await frames();}
 return {send,evaluate,frames,ready,screenshot,click,errors,requests,close:()=>ws.close()};
}
