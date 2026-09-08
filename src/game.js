
(() => {
"use strict";
const $=s=>document.querySelector(s), fx=$("#fx"), hud=$("#hud"), prompt=$("#prompt"), quest=$("#quest"), menu=$("#menu"), toast=$("#toast"), chapter=$("#chapter");
const U=58, X_LIMIT=8.5, Z_MIN=-8.5, Z_MAX=8.1;
const stageState={mode:"menu",chosen:"",kisses:0,eventT:0,dedication:"",music:true,level:1,flowers:0,collected:[],gifted:0,giftSpots:[],mobs:[],hitCooldown:0};
const key=new Set();
const joystick={x:0,y:0};
let autoWalk=false;
const reducedMotion=matchMedia("(prefers-reduced-motion: reduce)").matches;
const pos={
  Bubu:{x:-1.3,z:-5.8,flip:false,bob:0,heading:0,walkTime:0,turnT:0,moving:false,jumpY:0,jumpV:0},
  Dudu:{x:1.3,z:-5.8,flip:true,bob:0,heading:0,walkTime:0,turnT:0,moving:false,jumpY:0,jumpV:0}
};
let player=null, partner=null;
// All character artwork is embedded: consistent online and offline.

function escapeHtml(v){return v.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function el(tag,cls=""){const e=document.createElement(tag);if(cls)e.className=cls;return e}
const canvas=$("#scene3d");
let engine=null,rendererReady=false;
try {
 engine=createPaperEngine(canvas,$("#defs"),reducedMotion);
 engine.loaded.then(()=>{rendererReady=true;$("#renderStatus").hidden=true;$("#chooseBubu").disabled=false;$("#chooseDudu").disabled=false;}).catch(showRenderError);
}catch(error){showRenderError(error)}
function showRenderError(error){$("#renderStatus").hidden=false;$("#renderStatus").textContent=error.message;console.error(error);}
function setHeading(p,angle){
 const previous=Math.sin(p.heading||0),next=Math.sin(angle);
 if(previous*next<-.20)p.turnT=.18;
 p.heading=angle;
}
function face(){
  if(!player||!partner)return;
  setHeading(pos[player],Math.atan2(pos[partner].x-pos[player].x,pos[partner].z-pos[player].z));
  setHeading(pos[partner],Math.atan2(pos[player].x-pos[partner].x,pos[player].z-pos[partner].z));
}
function dist(){return Math.hypot(pos[player].x-pos[partner].x,pos[player].z-pos[partner].z)}
function setPrompt(txt,pop=false){prompt.textContent=txt;if(pop){prompt.classList.add("pop");setTimeout(()=>prompt.classList.remove("pop"),180)}}
function setQuest(active){
  const order={approach:0,flowers:1,kiss:2};
  quest.querySelectorAll(".q").forEach(q=>{q.className="q";const k=q.dataset.q;if(order[k]<order[active])q.classList.add("done");else if(k===active)q.classList.add("on")});
}
function currentChapter(){return PaperWorld.level(stageState.level)}
function currentCollected(){const ids=currentChapter().flowers||[];return ids.filter(f=>stageState.collected.includes(f.id)).length}
function updateChapterUi(){const c=currentChapter();chapter.innerHTML=`${c.chapter}<b>${c.name}</b>`;const count=stageState.level<3?`${currentCollected()}/3`:`${stageState.flowers-stageState.gifted}/${stageState.flowers}`;hud.innerHTML=`<strong>Nivel ${stageState.level}/3</strong> · Ramos: ${count}<br><strong>${stageState.chosen||"Bubu"}</strong> · ${escapeHtml(stageState.dedication||"Para Bettina, con todo mi amor 💗")}`}
function resetActorState(p){p.moving=false;p.walkTime=0;p.turnT=0;p.heading=0;p.jumpY=0;p.jumpV=0}
function loadLevel(levelNumber){
  releaseJoystick();
  document.body.dataset.chapter=String(levelNumber);stageState.checkpoint=null;const c=PaperWorld.setLevel(levelNumber);stageState.level=levelNumber;stageState.eventT=0;stageState.hitCooldown=0;stageState.giftSpots=c.giftSpots||[];joystick.x=joystick.y=0;document.querySelector("#joystickKnob")?.style.setProperty("transform","translate(0,0)");
  stageState.mobs=(c.mobs||[]).map((m,i)=>({...m,baseX:m.x,baseZ:m.z,phase:i*.9,flip:false}));
  const start=c.start;Object.assign(pos[player],{x:start.x,z:start.z,flip:false,heading:Math.PI});
  Object.assign(pos[partner],{x:c.goal.x,z:c.goal.z,flip:true,heading:0});
  for(const p of Object.values(pos))resetActorState(p);
  pos[player].heading=0;pos[partner].heading=0;
  updateChapterUi();
  say(player,levelNumber===1?`${partner}… está oscuro, pero voy a encontrarte.`:levelNumber===2?'Ya entra un poquito de luz. Estoy más cerca.':`¡${partner}! Por fin estamos juntos.`);
  if(levelNumber===3){stageState.mode="approach";quest.innerHTML='<span class="q on" data-q="approach">1 · ACERCATE</span><span class="q" data-q="flowers">2 · FLORES</span><span class="q" data-q="kiss">3 · BESO</span>';quest.style.display="flex";setQuest("approach");setPrompt(stageState.flowers>stageState.gifted?`Acercate a ${partner} · elegí un ramo 🌷`:`Acercate a ${partner} · ya no quedan ramos`);$("#travel").style.display="block";$("#travel").textContent="Seguir el caminito →"}
  else {stageState.mode="platform";quest.innerHTML=`<span class="q on">NIVEL ${levelNumber}/3</span><span class="q">RAMOS ${currentCollected()}/3</span><span class="q">META</span>`;quest.style.display="flex";setPrompt(`Nivel ${levelNumber}: juntá los 3 ramos y llegá a la bandera 🌷`);$("#travel").style.display="none";$("#travel").textContent=`Entrar al nivel ${levelNumber+1} →`}
}
function start(name){
  if(!rendererReady)return;
  key.clear();autoWalk=false;document.body.classList.add("playing");$("#travel").style.display="block";document.activeElement?.blur();
  stageState.chosen=name;stageState.kisses=0;stageState.flowers=0;stageState.collected=[];stageState.gifted=0;stageState.mode="platform";stageState.eventT=0;stageState.dedication=$("#dedication").value.trim()||"Para Bettina, con todo mi amor 💗";
  player=name;partner=name==="Bubu"?"Dudu":"Bubu";
  loadLevel(1);menu.style.display="none";hud.style.display="block";quest.style.display="flex";prompt.style.display="block";startMusic();
}
$("#chooseBubu").onclick=()=>start("Bubu");$("#chooseDudu").onclick=()=>start("Dudu");

function reset(){ if(!stageState.chosen){menu.style.display="flex";return} start(stageState.chosen) }
function menuBack(){releaseJoystick();key.clear();joystick.x=joystick.y=0;autoWalk=false;PaperWorld.setLevel(3);delete document.body.dataset.chapter;document.body.classList.remove("playing");$("#travel").style.display="none";stageState.mode="menu";player=partner=null;menu.style.display="flex";hud.style.display=quest.style.display=prompt.style.display="none";Object.values(pos).forEach(resetActorState);Object.assign(pos.Bubu,{x:-1.3,z:-5.8,flip:false});Object.assign(pos.Dudu,{x:1.3,z:-5.8,flip:true})}

function hearts(n=18){
  if(reducedMotion)return;
  const p=projectScreen((pos[player].x+pos[partner].x)/2,(pos[player].z+pos[partner].z)/2,2.1);
  for(let i=0;i<n;i++){const h=el("div","heart");h.style.left=p.x+"px";h.style.top=p.y+"px";h.style.setProperty("--x",`${(Math.random()-.5)*240}px`);h.style.setProperty("--y",`${-80-Math.random()*210}px`);h.style.setProperty("--r",`${(Math.random()-.5)*80}deg`);h.style.setProperty("--s",`${.55+Math.random()*.85}`);h.style.setProperty("--d",`${1+Math.random()*.7}s`);fx.appendChild(h);setTimeout(()=>h.remove(),1900)}
}
function petals(){
  if(reducedMotion)return;
  const p=el("div","petal");p.style.left=Math.random()*innerWidth+"px";p.style.top="-20px";p.style.setProperty("--x",`${(Math.random()-.5)*180}px`);p.style.setProperty("--d",`${4+Math.random()*3}s`);fx.appendChild(p);setTimeout(()=>p.remove(),7500)
}
const dialogue=el('div','dialogue');dialogue.setAttribute('role','status');dialogue.setAttribute('aria-live','polite');$('#app').appendChild(dialogue);let speaking=null;
function say(name,text,kind='talk'){
 speaking={name,text,until:performance.now()+3100};dialogue.replaceChildren();const label=el('strong');label.textContent=name;const words=el('span');words.textContent=text;dialogue.append(label,words);dialogue.classList.add('show');
 babble(name,kind);
}
function updateDialogue(){if(!speaking||performance.now()>speaking.until||!player){dialogue.classList.remove('show');return}const a=pos[speaking.name],point=projectScreen(a.x,a.z,3.4);dialogue.style.left=Math.max(125,Math.min(innerWidth-125,point.x))+'px';dialogue.style.top=Math.max(innerWidth<600?220:150,Math.min(innerHeight-270,point.y-45))+'px';}
function projectScreen(x,z,y=0){return engine?engine.project(x,y,z):{x:innerWidth/2,y:innerHeight/2};}
function giveFlowers(){
  if(stageState.level!==3||!player||dist()>2.35||!["approach","ready","done"].includes(stageState.mode))return;
  if(pos[player].jumpY>0)return;
  if(stageState.flowers<=stageState.gifted){setPrompt("Primero juntá ramos en los niveles anteriores 🌷",true);return}
  autoWalk=false;releaseJoystick();say(player,"Estas flores son para vos.");stageState.gifted++;stageState.mode="flowers";stageState.eventT=0;face();setQuest("flowers");setPrompt("Entregando el ramo… 🌷",true);hearts(10);flowerChime();
}
function kiss(){
  if(!player||!["ready","done"].includes(stageState.mode)||dist()>2.35)return;
  if(pos[player].jumpY>0)return;
  autoWalk=false;releaseJoystick();say(partner,"Vení… te extrañé mucho.");stageState.mode="kiss";stageState.eventT=0;stageState.kisses++;face();setQuest("kiss");setPrompt("💋 ¡Mwah!",true);hearts(30);kissChime();

  toast.textContent=stageState.kisses===1?"💗 PRIMER BESO 💗":`💗 ${stageState.kisses} BESOS 💗`;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),900);
}

/* audio */
let ac=null,musicTimer=null,note=0;const melody=[523.25,659.25,783.99,659.25,587.33,698.46,783.99,880,783.99,659.25,587.33,523.25];
function audio(){try{ac||=new (window.AudioContext||window.webkitAudioContext)();ac.resume?.();return ac}catch{return null}}
function tone(f,d=.18,v=.025,delay=0,type="sine"){if(!stageState.music)return;const a=audio();if(!a)return;const o=a.createOscillator(),g=a.createGain(),t=a.currentTime+delay;o.type=type;o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.03)}
// Original procedural babble: short consonant attacks and changing vowel formants.
function babble(name,kind='talk'){
 if(!stageState.music)return;const a=audio();if(!a)return;
 // The reference uses tiny repeated syllables: Bubu stays round and low,
 // Dudu answers with a brighter rising "du-du" cadence.
 const pitch=name==='Bubu'?238:352,syllables=name==='Bubu'?'atata':'dadada';
 const pattern=kind==='kiss'?(name==='Bubu'?[1.08,1.24]:[1.02,1.18]):syllables==='atata'?[1,.88,1.02,.9]:[1,1.15,1.04,1.2,1.08];
 pattern.forEach((p,i)=>{
  const t=a.currentTime+i*.135,source=a.createOscillator(),envelope=a.createGain();
  source.type='triangle';source.frequency.setValueAtTime(pitch*p,t);source.frequency.exponentialRampToValueAtTime(pitch*p*(name==='Bubu'?.82:.9),t+.12);
  envelope.gain.setValueAtTime(0,t);envelope.gain.linearRampToValueAtTime(.13,t+.012);envelope.gain.exponentialRampToValueAtTime(.001,t+.12);envelope.connect(a.destination);
  const vowels=(i%2===0) ? (name==='Bubu'?[420,920,2200]:[520,1250,2700]) : (name==='Bubu'?[330,760,1900]:[700,1500,3100]);
  const filters=vowels.map((f,j)=>{const filter=a.createBiquadFilter(),gain=a.createGain();filter.type='bandpass';filter.frequency.value=f;filter.Q.value=5;gain.gain.value=[1,.5,.18][j];source.connect(filter);filter.connect(gain);gain.connect(envelope);return [filter,gain]});
  source.start(t);source.stop(t+.14);source.onended=()=>{source.disconnect();envelope.disconnect();for(const [f,g] of filters){f.disconnect();g.disconnect()}};
 });
}
function startMusic(){audio();if(musicTimer)return;musicTimer=setInterval(()=>{if(!stageState.music||stageState.mode==="menu")return;const tune=stageState.level===1?[220,261.63,293.66,261.63,196,233.08,220,174.61]:stageState.level===2?[293.66,349.23,440,392,349.23,329.63,293.66,261.63]:melody;const n=tune[note++%tune.length];tone(n,.3,.012);tone(n/2,.38,.006,.02,"triangle")},440)}
function flowerChime(){tone(659,.17,.045);tone(784,.2,.042,.1);tone(988,.3,.038,.2)}
function kissChime(){tone(784,.14,.045);tone(1047,.18,.04,.08);tone(1319,.25,.035,.16)}
$("#music").onclick=()=>{stageState.music=!stageState.music;$("#music").textContent=`♫ Música: ${stageState.music?"sí":"no"}`;if(stageState.music){audio();startMusic()}};

/* input */
addEventListener("keydown",e=>{
  if(e.target.matches?.("input,textarea,[contenteditable=true]"))return;
  const k=e.key.toLowerCase();if(["arrowup","arrowdown","arrowleft","arrowright"," ","e","r","j","x","escape"].includes(k))e.preventDefault();
  if(stageState.mode==="menu" && k!=="escape")return;
  if(k==="q"){engine?.rotate(-.28);return}if(k==="c"){engine?.rotate(.28);return}
  if(k==="escape"){menuBack();return} if(k==="r"){reset();return}
  key.add(k);if(e.repeat)return;if(k==="e")giveFlowers();if(k===" ")kiss();if(k==="j"||k==="x")jump()
},{passive:false});
addEventListener("keyup",e=>key.delete(e.key.toLowerCase()));
addEventListener("blur",()=>{key.clear();releaseJoystick?.();autoWalk=false});
document.addEventListener("visibilitychange",()=>{if(document.hidden){key.clear();releaseJoystick?.();autoWalk=false}});
document.addEventListener("selectstart",e=>{if(!e.target.matches?.("input,textarea,[contenteditable=true]"))e.preventDefault()},{passive:false});
document.addEventListener("dragstart",e=>{if(!e.target.matches?.("input,textarea,[contenteditable=true]"))e.preventDefault()},{passive:false});
document.addEventListener("contextmenu",e=>{if(e.target.closest?.("#mobile,#cameraControls,#scene3d"))e.preventDefault()},{passive:false});
document.addEventListener("dblclick",e=>{if(e.target.closest?.("#mobile,#cameraControls,#scene3d"))e.preventDefault()},{passive:false});
["gesturestart","gesturechange","gestureend"].forEach(type=>document.addEventListener(type,e=>e.preventDefault(),{passive:false}));
$("#menuButton").onclick=menuBack;
function advanceLevel(){if(stageState.level>=3)return;if(currentCollected()<3){setPrompt(`Todavía faltan ${3-currentCollected()} ramos en este nivel 🌷`,true);return}loadLevel(stageState.level+1);hearts(12);}
function jump(){
  if(!player||!["platform","approach","ready","done"].includes(stageState.mode)||(pos[player].jumpY||0)>0.02)return;
  pos[player].jumpBase=PaperWorld.supportAt(pos[player].x,pos[player].z);pos[player].jumpV=5.0;pos[player].jumpY=.03;
}
$("#travel").onclick=()=>{if(stageState.level<3&&stageState.mode==="exit")advanceLevel();else if(stageState.level===3)autoWalk=true};
prompt.onclick=()=>{if(stageState.level<3&&stageState.mode==="exit")advanceLevel();else if(stageState.mode==="approach"||stageState.mode==="ready"||stageState.mode==="done")giveFlowers();else kiss()};
const joystickEl=$("#joystick"),joystickKnob=$("#joystickKnob");let joystickPointer=null,touchJoystickId=null;
function updateJoystick(e){
  const r=joystickEl.getBoundingClientRect(),max=r.width*.34,cx=r.left+r.width/2,cy=r.top+r.height/2;
  let x=e.clientX-cx,y=e.clientY-cy,l=Math.hypot(x,y);if(l>max){x=x/l*max;y=y/l*max}joystick.x=x/max;joystick.y=y/max;joystickKnob.style.transform=`translate(${x}px,${y}px)`;
}
function releaseJoystick(){
 const captured=joystickPointer;joystickPointer=null;touchJoystick=false;touchJoystickId=null;
 joystick.x=joystick.y=0;joystickKnob.style.transform="translate(0,0)";
 try{if(captured!==null&&joystickEl.hasPointerCapture?.(captured))joystickEl.releasePointerCapture(captured)}catch(_){}
}
let touchJoystick=false;
joystickEl.addEventListener("pointerdown",e=>{e.preventDefault();releaseJoystick();joystickPointer=e.pointerId;updateJoystick(e);try{joystickEl.setPointerCapture?.(e.pointerId)}catch(_){}},{passive:false});
document.addEventListener("pointermove",e=>{if(e.pointerId===joystickPointer){if(e.pointerType!=="touch"&&e.buttons===0){releaseJoystick();return}e.preventDefault();updateJoystick(e)}},{capture:true,passive:false});
window.addEventListener("pointerup",e=>{if(e.pointerId===joystickPointer)releaseJoystick()},{capture:true});
window.addEventListener("pointercancel",e=>{if(e.pointerId===joystickPointer)releaseJoystick()},{capture:true});
joystickEl.addEventListener("lostpointercapture",e=>{if(e.pointerId===joystickPointer)releaseJoystick()});
for(const event of ["pagehide","pageshow","resize","orientationchange"])window.addEventListener(event,releaseJoystick);
// Touch lists reconcile missing pointer releases without driving the joystick twice.
if(window.PointerEvent){
 document.addEventListener("touchstart",e=>{
  if(joystickPointer!==null&&e.target.closest?.("#joystick"))touchJoystickId=e.changedTouches[0]?.identifier??null;
 },{capture:true,passive:true});
 const reconcile=e=>{
  if(joystickPointer===null)return;
  if(!e.touches.length||(touchJoystickId!==null&&!findTouch(e.touches,touchJoystickId)))releaseJoystick();
 };
 for(const event of ["touchmove","touchend","touchcancel"])window.addEventListener(event,reconcile,{capture:true,passive:true});
}
function findTouch(list,id){if(!list)return null;for(let i=0;i<list.length;i++){const p=list[i];if(id===undefined||p.identifier===id)return p}return null}
function touchPoint(e,id){const p=findTouch(e.changedTouches,id)||findTouch(e.touches,id);return p?{clientX:p.clientX,clientY:p.clientY}:null}
if(!window.PointerEvent){
document.addEventListener("touchstart",e=>{if(joystickPointer!==null){e.preventDefault();return}if(!e.target.closest?.("#joystick"))return;const p=e.changedTouches?.[0];if(!p)return;e.preventDefault();touchJoystick=true;touchJoystickId=p.identifier;updateJoystick({clientX:p.clientX,clientY:p.clientY})},{capture:true,passive:false});
document.addEventListener("touchmove",e=>{if(joystickPointer!==null){e.preventDefault();return}if(!touchJoystick)return;const p=touchPoint(e,touchJoystickId);if(!p)return;e.preventDefault();updateJoystick(p)},{capture:true,passive:false});
document.addEventListener("touchend",e=>{if(!touchJoystick||!findTouch(e.changedTouches,touchJoystickId))return;e.preventDefault();touchJoystick=false;touchJoystickId=null;releaseJoystick()},{capture:true,passive:false});
document.addEventListener("touchcancel",e=>{if(joystickPointer!==null){e.preventDefault();return}releaseJoystick()},{capture:true,passive:false});
}
function mobileAction(selector,action){const b=$(selector);if(!b)return;let touchedAt=0;b.addEventListener("pointerdown",e=>{if(e.pointerType!=="touch"&&e.pointerType!=="pen")return;e.preventDefault();b.setPointerCapture?.(e.pointerId);touchedAt=performance.now();action()},{passive:false});b.addEventListener("click",e=>{if(performance.now()-touchedAt<600){e.preventDefault();return}action()},{passive:false});}
mobileAction('[data-action="flowers"]',giveFlowers);mobileAction('[data-action="kiss"]',kiss);mobileAction('[data-action="jump"]',jump);

let last=performance.now(),petalT=0;
function updateMobs(dt,t){
 for(const m of stageState.mobs){
  m.timer=Math.max(0,(m.timer||0)-dt);const a=m.arena,p=pos[player];
  if(m.mode==='stunned'){if(!m.timer)m.mode='patrol';continue}
  if(m.mode==='windup'&&!m.timer){m.mode='charge';m.timer=.38;const d=Math.hypot(p.x-m.x,p.z-m.z)||1;m.vx=(p.x-m.x)/d;m.vz=(p.z-m.z)/d;}
  else if(m.mode==='charge'){m.x+=m.vx*5.4*dt;m.z+=m.vz*5.4*dt;if(!m.timer){m.mode='recover';m.timer=m.recovery}}
  else if(m.mode==='recover'){if(!m.timer)m.mode='patrol'}
  else if(m.mode!=='windup'){
   m.mode='patrol';m.x=m.baseX+Math.sin(t*m.speed+m.phase)*m.range;
   if(Math.hypot(p.x-m.x,p.z-m.z)<3.4){m.mode='windup';m.timer=m.windup}
  }
  m.x=Math.max(a.x-a.w/2+.35,Math.min(a.x+a.w/2-.35,m.x));m.z=Math.max(a.z-a.d/2+.3,Math.min(a.z+a.d/2-.3,m.z));m.flip=p.x<m.x;
 }
}
function respawn(){const c=currentChapter(),checkpoint=stageState.checkpoint||c.start;Object.assign(pos[player],{x:checkpoint.x,z:checkpoint.z,jumpY:0,jumpV:0});pos[player].moving=false;stageState.hitCooldown=1.4;toast.textContent=stageState.checkpoint?'De vuelta al último ramo':'Intentá de nuevo · esperá el momento';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1300);}
function collectNearbyFlowers(){
  const c=currentChapter();for(const f of c.flowers){if(stageState.collected.includes(f.id))continue;if(Math.hypot(pos[player].x-f.x,pos[player].z-f.z)<.85){say(player,stageState.flowers<2?"Una flor para vos… me siento un poquito mejor.":"Otro ramo. ¡Ya falta menos!");stageState.checkpoint={x:f.x,z:f.z};stageState.collected.push(f.id);stageState.flowers=stageState.collected.length;toast.textContent=`🌷 RAMO ${stageState.flowers}`;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),800);flowerChime();}}
}
function updatePlatform(dt,t){
  stageState.hitCooldown=Math.max(0,stageState.hitCooldown-dt);updateMobs(dt,t);
  const actor=pos[player];if(actor.jumpY>0||actor.jumpV>0){actor.jumpY+=actor.jumpV*dt;actor.jumpV-=13.5*dt;if(actor.jumpY<=0){actor.jumpY=0;actor.jumpV=0;}}
  const keyboardX=(key.has("d")||key.has("arrowright")?1:0)-(key.has("a")||key.has("arrowleft")?1:0),keyboardZ=(key.has("s")||key.has("arrowdown")?1:0)-(key.has("w")||key.has("arrowup")?1:0),analog=Math.hypot(joystick.x,joystick.y)>.04;
  let dx=analog?joystick.x:keyboardX,dz=analog?joystick.y:keyboardZ,moving=false;
  const l=Math.hypot(dx,dz);if(l){if(!analog){dx/=l;dz/=l}moving=true;const yaw=engine.yaw,wx=dx*Math.cos(yaw)+dz*Math.sin(yaw);dz=-dx*Math.sin(yaw)+dz*Math.cos(yaw);dx=wx;}
  const previous={x:pos[player].x,z:pos[player].z},nx=Math.max(-X_LIMIT,Math.min(X_LIMIT,pos[player].x+dx*3.7*dt)),nz=Math.max(Z_MIN,Math.min(Z_MAX,pos[player].z+dz*3.7*dt));Object.assign(pos[player],engine.move(pos[player],nx,nz));
  moving=Math.hypot(pos[player].x-previous.x,pos[player].z-previous.z)>.0001;pos[player].moving=moving;pos[partner].moving=false;if(moving){pos[player].walkTime+=dt;setHeading(pos[player],Math.atan2(dx,dz));}
  if(actor.jumpY<=0&&PaperWorld.supportAt(pos[player].x,pos[player].z)<-100){respawn();return}
  if(stageState.hitCooldown<=0&&((PaperWorld.hazardAt(pos[player].x,pos[player].z)&&actor.jumpY<.22)|| (actor.jumpY<.4&&stageState.mobs.some(m=>m.mode!=="stunned"&&Math.hypot(m.x-pos[player].x,m.z-pos[player].z)<.88)))){respawn();return}
  for(const m of stageState.mobs)if(m.mode!=='stunned'&&actor.jumpV<0&&actor.jumpY>.4&&actor.jumpY<.85&&Math.hypot(m.x-actor.x,m.z-actor.z)<.8){m.mode='stunned';m.timer=2.5;actor.jumpV=3.2;flowerChime();}
  collectNearbyFlowers();const goal=currentChapter().goal,goalDistance=Math.hypot(pos[player].x-goal.x,pos[player].z-goal.z);
  if(goalDistance<1.35&&currentCollected()===3){stageState.mode="exit";setPrompt(`¡Nivel ${stageState.level} superado! Presioná para entrar al siguiente →`,true);$("#travel").style.display="block"}
  else {stageState.mode="platform";$("#travel").style.display="none";setPrompt(`Nivel ${stageState.level} · Ramos ${currentCollected()}/3 · Saltá entre islas · esquivá la embestida`)}
  hud.innerHTML=`<strong>Nivel ${stageState.level}/3</strong> · Ramos: ${currentCollected()}/3 · Total: ${stageState.flowers}<br><strong>${stageState.chosen}</strong> · ${escapeHtml(stageState.dedication)}`;
}
function update(dt,t){
  petalT+=dt;if(petalT>.23){petalT=0;if(stageState.mode!=="menu"&&Math.random()<.4)petals()}
  if(!player)return;
  stageState.eventT+=dt;
  if(stageState.level<3){updatePlatform(dt,t);return;}
  const locked=["flowers","kiss"].includes(stageState.mode);
  const actor=pos[player];if(actor.jumpY>0||actor.jumpV>0){actor.jumpY+=actor.jumpV*dt;actor.jumpV-=13.5*dt;if(actor.jumpY<=0){actor.jumpY=0;actor.jumpV=0;}}
  if(locked){
    // Both paper profiles share a stage and stay side by side relative to the camera.
    const right={x:Math.cos(engine.yaw),z:-Math.sin(engine.yaw)},half=stageState.mode==='kiss'?1.025:1.1;
    const q=stageState.eventT>.55?1:1-Math.exp(-dt*10);
    for(const [name,side] of [[player,-1],[partner,1]]){
      const a=pos[name],x=side*half*right.x,z=-6.55+side*half*right.z;
      a.x+=(x-a.x)*q;a.z+=(z-a.z)*q;a.jumpY=0;a.jumpV=0;a.moving=false;
    }
  }
  let dx=0,dz=0,moving=false;
  if(!locked){
    dx=(key.has("d")||key.has("arrowright")?1:0)-(key.has("a")||key.has("arrowleft")?1:0);
    dz=(key.has("s")||key.has("arrowdown")?1:0)-(key.has("w")||key.has("arrowup")?1:0);
    if(Math.hypot(joystick.x,joystick.y)>.04){dx=joystick.x;dz=joystick.y;}if(dx||dz)autoWalk=false;
    if(autoWalk){const tx=pos[partner].x-1.65,tz=pos[partner].z;dx=tx-pos[player].x;dz=tz-pos[player].z;if(Math.hypot(dx,dz)<.09){autoWalk=false;dx=dz=0}}
    const l=Math.hypot(dx,dz);if(l){if(l>1||autoWalk){dx/=l;dz/=l}moving=true}
    // Keyboard directions are relative to the camera; scripted travel is in world space.
    if(!autoWalk){const yaw=engine.yaw,wx=dx*Math.cos(yaw)+dz*Math.sin(yaw);dz=-dx*Math.sin(yaw)+dz*Math.cos(yaw);dx=wx;}
    const nx=Math.max(-X_LIMIT,Math.min(X_LIMIT,pos[player].x+dx*3.7*dt));
    const nz=Math.max(Z_MIN,Math.min(Z_MAX,pos[player].z+dz*3.7*dt));
    const previous={x:pos[player].x,z:pos[player].z};
    Object.assign(pos[player],engine.move(pos[player],nx,nz));
    moving=Math.hypot(pos[player].x-previous.x,pos[player].z-previous.z)>.0001;
    if(Math.abs(dx)>.05)pos[player].flip=dx<0;
  }
  for(const name of ["Bubu","Dudu"]){const p=pos[name];p.moving=moving&&name===player;p.turnT=Math.max(0,(p.turnT||0)-dt);if(p.moving)p.walkTime+=dt;}
  if(moving)setHeading(pos[player],Math.atan2(dx,dz));

  if(stageState.mode==="approach"){
    if(dist()<2.35){if(!moving)face();setPrompt(stageState.flowers>stageState.gifted?"Presioná E para regalar un ramo 🌷":"Ya no quedan ramos; volvé a los niveles anteriores 🌷")}else setPrompt(`Acercate a ${partner} · ${dist().toFixed(1)} m 💕`);
  }
  if(stageState.mode==="flowers"){
    if(stageState.eventT>1.4&&stageState.eventT-dt<=1.4)say(partner,"¡Son hermosas! Gracias, mi amor.");
    face();
    if(stageState.eventT>3.1){
      stageState.mode="ready";stageState.eventT=0;setQuest("kiss");
      setPrompt("Ahora acercate un poquito y presioná Espacio 💋",true);
    }
  }
  if(stageState.mode==="ready"||stageState.mode==="done"){
    if(!moving)face();
    if(dist()<2.35)setPrompt(stageState.mode==="done"?`${stageState.dedication} · Espacio = otro beso 💋`:"Presioná Espacio para besar 💋");
    else setPrompt(`Acercate un poquito más · ${dist().toFixed(1)} m`);
  }
  if(stageState.mode==="kiss"){
    if(stageState.eventT>1.5&&stageState.eventT-dt<=1.5)say(player,"¡Muá! Te quiero mucho.","kiss");
    face();
    if(stageState.eventT>2.8){quest.querySelectorAll(".q").forEach(q=>q.className="q done");stageState.mode="done";stageState.eventT=0;setPrompt(`${stageState.dedication} · ${stageState.kisses} ${stageState.kisses===1?"beso":"besos"} 💗`,true)}
  }
  $("#travel").style.display=dist()>2.35&&!locked?"block":"none";

  hud.innerHTML=`<strong>Nivel 3/3 · ${stageState.chosen}</strong> · Ramos ${stageState.flowers-stageState.gifted}/${stageState.flowers}<br>${escapeHtml(stageState.dedication)}<br>WASD/flechas · E ramo · Espacio beso · Besos: <strong>${stageState.kisses}</strong> 💋`;
}
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(rendererReady){update(dt,now/1000);engine.render(dt,now/1000,stageState,pos,player,partner);updateDialogue()}requestAnimationFrame(loop)}
window.__BUBU_DUDU_PAPER_DATE__={start,reset,menu:menuBack,giveFlowers,kiss,state:stageState,debugNear(){if(player&&partner){pos[player].x=pos[partner].x-1.55;pos[player].z=pos[partner].z+.18;face();}}};
if(new URLSearchParams(location.search).has('test'))Object.assign(window.__BUBU_DUDU_PAPER_DATE__,{loadLevel,positions:pos,jump});
function cameraButton(button,amount){
  if(!button)return;
  button.style.touchAction="none";button.style.userSelect="none";
  button.addEventListener("pointerdown",e=>{
    if(e.pointerType!=="touch"&&e.pointerType!=="pen")return;
    e.preventDefault();button.setPointerCapture?.(e.pointerId);engine?.rotate(amount);button.dataset.touchRotateAt=String(performance.now());
  },{passive:false});
  button.addEventListener("click",e=>{
    const at=Number(button.dataset.touchRotateAt||0);
    if(performance.now()-at<500){e.preventDefault();return}
    engine?.rotate(amount);
  },{passive:false});
}
cameraButton($("#cameraLeft"),-.28);cameraButton($("#cameraRight"),.28);
requestAnimationFrame(loop);
})();
