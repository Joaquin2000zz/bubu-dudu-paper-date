const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});try{
const page=await browser.newPage({viewport:{width:1100,height:820}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto((process.env.GAME_URL||'http://127.0.0.1:8766/index.html')+'?test=1');await page.waitForFunction(()=>document.querySelector('#scene3d').dataset.ready==='true');await page.click('#chooseDudu');
await page.evaluate(()=>{const a=window.__BUBU_DUDU_PAPER_DATE__;for(let i=0;i<6;i++)a.state.inventory.collect('test-'+i);a.loadLevel(3)});
await page.keyboard.press('j');await page.waitForTimeout(170);assert((await page.evaluate(()=>window.__BUBU_DUDU_PAPER_DATE__.positions.Dudu.jumpY))>.1,'Jump works in the final garden');await page.waitForTimeout(750);assert.equal(await page.evaluate(()=>window.__BUBU_DUDU_PAPER_DATE__.positions.Dudu.jumpY),0);
for(let i=0;i<5;i++)await page.click('#cameraRight');await page.waitForTimeout(600);
await page.evaluate(()=>{const a=window.__BUBU_DUDU_PAPER_DATE__;a.debugNear();a.giveFlowers()});await page.waitForTimeout(1700);
const check=async()=>{const result=await page.evaluate(()=>{const a=window.__BUBU_DUDU_PAPER_DATE__,yaw=Number(document.querySelector('#scene3d').dataset.camera),p=a.positions.Dudu,b=a.positions.Bubu;return {side:(b.x-p.x)*Math.cos(yaw)-(b.z-p.z)*Math.sin(yaw),depth:(b.x-p.x)*Math.sin(yaw)+(b.z-p.z)*Math.cos(yaw),poses:JSON.parse(document.querySelector('#scene3d').dataset.poses)}});assert(result.side>1.9,'Both faces have their own horizontal space');assert(Math.abs(result.depth)<.15,'Neither face is behind the other');assert(Math.abs(result.poses.Dudu.y-result.poses.Bubu.y)<.08,'Feet share the same stage height');};
await check();fs.mkdirSync('tests/artifacts',{recursive:true});await page.screenshot({path:'tests/artifacts/flowers-profile.png'});assert.match(await page.locator('.dialogue').textContent(),/Bubu|Dudu/);
await page.waitForTimeout(1550);await page.evaluate(()=>window.__BUBU_DUDU_PAPER_DATE__.kiss());await page.waitForTimeout(1300);await check();await page.screenshot({path:'tests/artifacts/kiss-profile.png'});
await page.evaluate(()=>{for(let i=0;i<5;i++)document.querySelector('#cameraLeft').click()});await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>window.__BUBU_DUDU_PAPER_DATE__.state.mode),'kiss');await check();
await page.waitForTimeout(1500);assert.equal(await page.evaluate(()=>window.__BUBU_DUDU_PAPER_DATE__.state.kisses),1);assert.deepEqual(errors,[]);console.log('PASS: final garden jump/landing, gift and kiss at rotated camera angles, face spacing, shared floor height, dialogue, and completed kiss.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
