const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('Entry page loads all project scripts locally in dependency order',()=>{
 const html=fs.readFileSync('index.html','utf8'),scripts=[...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1].split('?')[0]);
 assert.deepEqual(scripts,['src/characters.js','src/animation.js','src/world.js','src/engine.js','src/game.js']);
 scripts.forEach(file=>{assert(fs.existsSync(file));new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});});
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
 assert(html.includes('<canvas id="scene3d"'));assert(!html.includes('id="world"'));
});
test('Game no longer substitutes action animations with remote GIFs or photo overlays',()=>{
 const js=fs.readFileSync('src/game.js','utf8');assert(!js.includes('cinematicShow'));assert(!js.includes('media.tenor'));assert(!js.includes('pinimg'));
});
test('Mobile controls cannot select text or trigger browser zoom gestures',()=>{
 const html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('styles/main.css','utf8'),js=fs.readFileSync('src/game.js','utf8');
 assert(html.includes('maximum-scale=1')&&html.includes('user-scalable=no'));
 assert(css.includes('#app,#app *')&&css.includes('overscroll-behavior:none'));
 assert(css.includes('#cameraControls button{')&&css.includes('touch-action:none'));
 assert(css.includes('user-select:none')&&css.includes('-webkit-user-select:none'));
 assert(js.includes('selectstart')&&js.includes('contextmenu')&&js.includes('dblclick')&&js.includes('gesturestart'));
 assert(js.includes('function cameraButton')&&js.includes('pointerdown'));
});
test('Platform controls expose a separate jump action from the kiss action',()=>{
 const html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('styles/main.css','utf8'),js=fs.readFileSync('src/game.js','utf8');
 assert(html.includes('id="joystick"')&&html.includes('data-action="jump"')&&html.includes('data-action="kiss"'));
 assert(html.includes('styles/main.css?v=touch-joystick-2')&&html.includes('src/game.js?v=touch-joystick-2'));
 assert(js.includes('function jump')&&js.includes('k==="j"||k==="x"'));
 assert(js.includes('updateJoystick')&&js.includes('mobileAction')&&js.includes('touchstart')&&js.includes('touchmove')&&js.includes('touchJoystickId'));
 assert(css.includes('#joystick')&&css.includes('.acts{grid-template-columns:64px 64px 64px}')&&css.includes('@media(max-width:380px)'));
});
