const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
 try{
 const page=await browser.newPage({viewport:{width:430,height:860},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto((process.env.GAME_URL||'http://127.0.0.1:8765/index.html')+'?test=1');
 await page.waitForFunction(()=>document.querySelector('#scene3d').dataset.ready==='true');await page.click('#chooseDudu');await page.waitForTimeout(300);
 assert.equal(await page.evaluate(()=>JSON.parse(document.querySelector('#scene3d').dataset.poses).Dudu.emotion),'crying');
 const r=await page.locator('#joystick').boundingBox(),cx=r.x+r.width/2,cy=r.y+r.height/2;
 assert.equal(await page.evaluate(({x,y})=>document.elementFromPoint(x,y).id,{x:cx,y:cy}),'joystick','Joystick receives touch hit testing');
 const cdp=await page.context().newCDPSession(page),touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
 await touch('touchStart',[{x:cx,y:cy,id:1}]);await touch('touchMove',[{x:cx+32,y:cy,id:1}]);await page.waitForTimeout(150);
 assert.match(await page.locator('#joystickKnob').getAttribute('style'),/translate\(32px/);
 assert((await page.evaluate(()=>window.__BUBU_DUDU_PAPER_DATE__.positions.Dudu.x))>-2.9,'Touch moves the character');
 const jump=await page.locator('[data-action="jump"]').boundingBox();
 await touch('touchStart',[{x:cx+32,y:cy,id:1},{x:jump.x+25,y:jump.y+25,id:2}]);await page.waitForTimeout(120);
 assert((await page.evaluate(()=>window.__BUBU_DUDU_PAPER_DATE__.positions.Dudu.jumpY))>.1,'Second finger jumps while holding joystick');
 await touch('touchEnd',[{x:jump.x+25,y:jump.y+25,id:2}]);await page.waitForTimeout(60);
 assert.match(await page.locator('#joystickKnob').getAttribute('style'),/translate\(32px/,'Releasing jump keeps joystick active');
 await touch('touchEnd',[]);assert.match(await page.locator('#joystickKnob').getAttribute('style'),/translate\(0px, 0px\)/);
 await page.waitForTimeout(700);
 await page.evaluate(()=>{const api=window.__BUBU_DUDU_PAPER_DATE__;api.loadLevel(1);const m=api.state.mobs[0];Object.assign(api.positions.Dudu,{x:m.x-1,z:m.z});});
 await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.__BUBU_DUDU_PAPER_DATE__.state.mobs[0].mode),'windup','Enemy signals its attack');
 await page.waitForTimeout(850);assert.equal(await page.evaluate(()=>window.__BUBU_DUDU_PAPER_DATE__.state.mobs[0].mode),'charge','Enemy commits to a charge');
 await page.waitForTimeout(450);assert.equal(await page.evaluate(()=>window.__BUBU_DUDU_PAPER_DATE__.state.mobs[0].mode),'recover','Charge has a recovery window');
 await page.evaluate(()=>{const api=window.__BUBU_DUDU_PAPER_DATE__;api.loadLevel(1);Object.assign(api.positions.Dudu,{x:-4,z:4.3});});await page.waitForTimeout(100);
 assert.equal(await page.evaluate(()=>window.__BUBU_DUDU_PAPER_DATE__.state.flowers),1,'Bouquet collected');
 assert.equal(await page.evaluate(()=>window.__BUBU_DUDU_PAPER_DATE__.state.checkpoint.x),-4,'Bouquet saves a checkpoint');
 await page.evaluate(()=>{const api=window.__BUBU_DUDU_PAPER_DATE__;Object.assign(api.positions.Dudu,{x:7,z:3,jumpY:0,jumpV:0});});await page.waitForTimeout(100);
 assert.equal(await page.evaluate(()=>window.__BUBU_DUDU_PAPER_DATE__.positions.Dudu.x),-4,'Fall returns to checkpoint');
 await page.evaluate(()=>{const api=window.__BUBU_DUDU_PAPER_DATE__;api.loadLevel(1);Object.assign(api.positions.Dudu,{x:-3.5,z:5.64,jumpBase:.15,jumpY:.7,jumpV:0});});
 await page.waitForTimeout(60);
 const airborne=await page.evaluate(()=>JSON.parse(document.querySelector('#scene3d').dataset.poses).Dudu);
 assert(Number.isFinite(airborne.y)&&airborne.y>.2,'Sprite stays at a finite visible height over the abyss');
 fs.mkdirSync('tests/artifacts',{recursive:true});
 for(const id of [1,2,3]){await page.evaluate(id=>window.__BUBU_DUDU_PAPER_DATE__.loadLevel(id),id);await page.waitForTimeout(500);await page.screenshot({path:`tests/artifacts/chapter-${id}.png`});}
 const before=await page.evaluate(()=>window.__BUBU_DUDU_PAPER_DATE__.positions.Dudu.x);
 await touch('touchStart',[{x:cx,y:cy,id:1}]);await touch('touchMove',[{x:cx+32,y:cy,id:1}]);await page.waitForTimeout(180);await touch('touchEnd',[]);
 assert((await page.evaluate(()=>window.__BUBU_DUDU_PAPER_DATE__.positions.Dudu.x))>before+.15,'Joystick also works in the final garden');
 assert.equal(await page.evaluate(()=>window.__BUBU_DUDU_PAPER_DATE__.state.flowers),1,'Final garden retains collected bouquet');
 assert.deepEqual(errors,[]);console.log('PASS: mobile hit testing, analog movement, simultaneous jump, release, enemy windup/charge/recovery, bouquet checkpoint, falling, final garden movement and flower inventory.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
