const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
 try{
 const page=await browser.newPage({viewport:{width:430,height:860},isMobile:true,hasTouch:true});
 await page.goto((process.env.GAME_URL||'http://127.0.0.1:8766/index.html')+'?test=1');
 await page.waitForFunction(()=>document.querySelector('#scene3d').dataset.ready==='true');await page.click('#chooseDudu');
 const box=await page.locator('#joystick').boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
 const cdp=await page.context().newCDPSession(page);
 const touch=(type,touchPoints)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints});
 const neutral=async(label)=>assert.match(await page.locator('#joystickKnob').getAttribute('style'),/translate\(0px, 0px\)/,label);
 const held=async(label)=>assert.match(await page.locator('#joystickKnob').getAttribute('style'),/translate\(30px, 0px\)/,label);
 const begin=async()=>{await touch('touchStart',[{x,y,id:1}]);await touch('touchMove',[{x:x+30,y,id:1}]);};
 await begin();await page.waitForTimeout(1000);await held('A stationary held finger must keep moving; no timeout');
 await touch('touchCancel',[]);await neutral('OS cancellation clears movement');
 await begin();await held('Works again after cancellation');
 await page.evaluate(()=>{
  const j=document.querySelector('#joystick');
  j.addEventListener('pointermove',e=>{if(j.hasPointerCapture(e.pointerId))j.releasePointerCapture(e.pointerId)},{once:true});
 });
 await touch('touchMove',[{x:x+31,y,id:1}]);await touch('touchMove',[{x:x+32,y,id:1}]);await page.waitForTimeout(80);await neutral('Lost pointer capture clears movement');
 await touch('touchEnd',[]);
 await begin();await held('Works again after lost capture');
 await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await neutral('Leaving the page clears input');await touch('touchEnd',[]);
 await begin();await page.evaluate(()=>window.dispatchEvent(new Event('resize')));await neutral('Viewport changes clear input');await touch('touchEnd',[]);
 await begin();await page.evaluate(()=>window.__BUBU_DUDU_PAPER_DATE__.loadLevel(2));await neutral('Level transitions clear input');await touch('touchEnd',[]);
 // Reproduce a missing pointerup, then a later touchend with no contacts.
 await page.evaluate(({x,y})=>document.querySelector('#joystick').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:701,pointerType:'touch',clientX:x+30,clientY:y})),{x,y});
 await held('Synthetic missing release reproduces held state');
 await page.evaluate(()=>window.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[],bubbles:true})));await neutral('Touch list repairs a missed pointerup');
 await page.evaluate(({x,y})=>{const j=document.querySelector('#joystick');for(const id of [702,703])j.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:id,pointerType:'touch',clientX:x+(id===702?30:-30),clientY:y}));},{x,y});
 assert.match(await page.locator('#joystickKnob').getAttribute('style'),/translate\(-30px/,'New gesture recovers from a stale pointer');
 await page.evaluate(()=>window.dispatchEvent(new PointerEvent('pointerup',{pointerId:703,pointerType:'touch'})));await neutral('Window release clears recovered gesture');
 await begin();await held('Joystick remains usable after all interruptions');await touch('touchEnd',[]);await neutral('Final release');
 console.log('PASS: hold, touch cancellation, lost capture, page exit, resize, level transition, missing pointerup recovery, stale pointer takeover, and reuse.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

