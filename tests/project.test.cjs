const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('Entry page loads all project scripts locally in dependency order',()=>{
 const html=fs.readFileSync('index.html','utf8'),scripts=[...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(scripts,['src/characters.js','src/animation.js','src/world.js','src/engine.js','src/game.js']);
 scripts.forEach(file=>{assert(fs.existsSync(file));new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});});
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
 assert(html.includes('<canvas id="scene3d"'));assert(!html.includes('id="world"'));
});
test('Game no longer substitutes action animations with remote GIFs or photo overlays',()=>{
 const js=fs.readFileSync('src/game.js','utf8');assert(!js.includes('cinematicShow'));assert(!js.includes('media.tenor'));assert(!js.includes('pinimg'));
});
test('Mobile controls cannot select text or trigger browser zoom gestures',()=>{
 const css=fs.readFileSync('styles/main.css','utf8'),js=fs.readFileSync('src/game.js','utf8');
 assert(css.includes('#cameraControls button{')&&css.includes('touch-action:none'));
 assert(css.includes('user-select:none')&&css.includes('-webkit-user-select:none'));
 assert(js.includes('selectstart')&&js.includes('contextmenu'));
});
