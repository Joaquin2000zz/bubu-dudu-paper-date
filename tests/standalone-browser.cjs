const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:820}}),errors=[],network=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
  await page.goto(pathToFileURL(path.resolve('dist/bubu-dudu.html')).href+'?test=1');
  await page.waitForFunction(()=>document.querySelector('#scene3d').dataset.ready==='true');await page.click('#chooseBubu');
  await page.evaluate(()=>window.__BUBU_DUDU_PAPER_DATE__.loadLevel(3));await page.keyboard.press('j');await page.waitForTimeout(150);
  assert((await page.evaluate(()=>window.__BUBU_DUDU_PAPER_DATE__.positions.Bubu.jumpY))>.1);
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
  console.log('PASS: standalone HTML loads art, starts, switches chapter and jumps without network.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
