// Run against a separate headless Chrome profile with --remote-debugging-port=0.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { connect } from './browser_test_utils.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const profile=process.argv[2];
if(!profile)throw Error('Usage: node verify_browser.mjs ISOLATED_CHROME_PROFILE');
const browser=await connect(profile),downloads=await fs.mkdtemp('/private/tmp/biscuit-downloads-');
const read=async name=>JSON.parse(await fs.readFile(path.join(root,name),'utf8'));
const report={offline:true,poses:{},invalidPosesRejected:0};
const loadPose=doc=>browser.evaluate(`biscuitPose.importPose(${JSON.stringify(doc)})`);
const exported=()=>browser.evaluate('biscuitPose.exportPose()');
async function downloaded(name){
 for(let i=0;i<100;i++){try{return await fs.readFile(path.join(downloads,name));}catch{await new Promise(r=>setTimeout(r,100));}}
 throw Error('Download did not finish: '+name);
}
try{
 await browser.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads},null);
 await browser.send('Emulation.setDeviceMetricsOverride',{width:1250,height:900,deviceScaleFactor:1,mobile:false});
 await browser.send('Page.navigate',{url:pathToFileURL(path.join(root,'viewer.html')).href});
 await browser.ready();
 const samples=await read('qa/native-samples.json');
 for(const [key,sample] of Object.entries(samples)){
  await loadPose(sample.pose);
  const selections=Object.fromEntries(Object.entries(sample.parts).map(([name,rows])=>[name,rows.map(({batch,index})=>({batch,index}))]));
  const points=await browser.evaluate(`Object.fromEntries(Object.entries(${JSON.stringify(selections)}).map(([name,rows])=>[name,biscuitPose.sampleAt(name,rows)]))`);
  let error=0,count=0;
  for(const [name,rows] of Object.entries(sample.parts))for(let i=0;i<rows.length;i++){
   error=Math.max(error,Math.hypot(...rows[i].position.map((x,d)=>x-points[name][i][d])));count++;
  }
  assert.ok(error<2e-5,`${key}: native/browser difference ${error}`);
  const before=await exported();await browser.evaluate("biscuitPose.setPreset('standing')");await loadPose(before);
  assert.deepEqual(await exported(),before);
  report.poses[key]={sampledVertices:count,maxNativeDifference:error};
 }
 const ik=await read('qa/blender-ik-pose.json');await loadPose(ik);
 assert.deepEqual((await exported()).bones,ik.bones);
 report.blenderIkImport=true;
 for(const invalid of await read('qa/invalid-poses.json')){
  const before=await exported();let rejected=false;
  try{await loadPose(invalid);}catch{rejected=true;}
  assert.ok(rejected);assert.deepEqual(await exported(),before);report.invalidPosesRejected++;
 }
 const rejectedNaN=await browser.evaluate(`(()=>{const d=biscuitPose.exportPose();d.bones.head.location[0]=NaN;try{biscuitPose.importPose(d);return false}catch{return true}})()`);
 assert.ok(rejectedNaN);report.invalidPosesRejected++;

 // Use real controls, keyboard input, downloads and file upload, in addition to the math API.
 await browser.click('[data-pose="sitting"]');
 assert.equal((await exported()).name,'Sitting');
 await browser.evaluate("document.querySelector('#control-head_turn').focus()");
 await browser.send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
 await browser.send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
 await browser.frames();assert.equal((await exported()).controls.head_turn,1);
 await browser.click('#save-pose');
 const saved=JSON.parse(await downloaded('biscuit-pose.json'));
 assert.equal(saved.controls.head_turn,1);
 await fs.writeFile(path.join(root,'qa/browser-saved-pose.json'),JSON.stringify(saved,null,2)+'\n');
 await browser.click('#reset-pose');
 const dom=await browser.send('DOM.getDocument');
 const input=await browser.send('DOM.querySelector',{nodeId:dom.root.nodeId,selector:'#pose-file'});
 await browser.send('DOM.setFileInputFiles',{nodeId:input.nodeId,files:[path.join(downloads,'biscuit-pose.json')]});
 for(let i=0;i<50;i++){if((await exported()).controls?.head_turn===1)break;await new Promise(r=>setTimeout(r,50));}
 assert.deepEqual(await exported(),saved);report.fileRoundtrip=true;
 await browser.click('#save-png');const png=await downloaded('biscuit-pose.png');
 assert.equal(png.subarray(1,4).toString(),'PNG');
 report.png={width:png.readUInt32BE(16),height:png.readUInt32BE(20),bytes:png.length};
 assert.ok(report.png.width>500&&report.png.height>500&&report.png.bytes>30000);

 for(const pose of ['standing','sitting','lying','paw-raised']){
  await browser.evaluate(`biscuitPose.setPreset('${pose}')`);
  for(const angle of ['hero','left','front']){
   await browser.evaluate(`document.querySelector('[data-view="${angle}"]').click()`);await browser.frames();
   await browser.screenshot(path.join(root,`previews/${pose}-${angle}.png`),true);
  }
  await browser.evaluate("document.querySelector('[data-display=\"biscuit\"]').click()");await browser.frames();
  await browser.screenshot(path.join(root,`previews/${pose}-undressed.png`),true);
 }
 await browser.evaluate("biscuitPose.setPreset('standing');document.querySelector('aside').scrollTop=0");await browser.frames();
 await browser.screenshot(path.join(root,'previews/studio-desktop.png'));
 await browser.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
 await browser.evaluate('scrollTo(0,0)');await browser.frames();
 assert.ok(await browser.evaluate('document.documentElement.scrollWidth<=innerWidth'));
 await browser.screenshot(path.join(root,'previews/studio-mobile.png'));
 await browser.click('[data-pose="paw-raised"]');
 assert.equal((await exported()).name,'Paw raised');report.mobileControls=true;
 assert.equal(browser.errors.length,0,JSON.stringify(browser.errors));
 const network=browser.requests.filter(url=>/^https?:/.test(url));assert.deepEqual(network,[]);
 report.externalRequests=network.length;report.consoleErrors=browser.errors.length;
 await fs.writeFile(path.join(root,'qa/browser-verification.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}finally{browser.close();}
