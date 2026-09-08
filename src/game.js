
(() => {
"use strict";
const $=s=>document.querySelector(s), fx=$("#fx"), hud=$("#hud"), prompt=$("#prompt"), quest=$("#quest"), menu=$("#menu"), toast=$("#toast"), chapter=$("#chapter");
const U=58, X_LIMIT=8.5, Z_MIN=-8.5, Z_MAX=8.1;
const stageState={mode:"menu",chosen:"",kisses:0,eventT:0,dedication:"",music:true,level:1,flowers:0,collected:[],gifted:0,giftSpots:[],mobs:[],hitCooldown:0};
const key=new Set();
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
  const c=PaperWorld.setLevel(levelNumber);stageState.level=levelNumber;stageState.eventT=0;stageState.hitCooldown=0;stageState.giftSpots=c.giftSpots||[];
  stageState.mobs=(c.mobs||[]).map((m,i)=>({...m,baseX:m.x,baseZ:m.z,phase:i*.9,flip:false}));
  const start=c.start;Object.assign(pos[player],{x:start.x,z:start.z,flip:false,heading:Math.PI});
  Object.assign(pos[partner],{x:c.goal.x,z:c.goal.z,flip:true,heading:0});
  for(const p of Object.values(pos))resetActorState(p);
  pos[player].heading=Math.PI;pos[partner].heading=0;
  updateChapterUi();
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
function menuBack(){key.clear();autoWalk=false;PaperWorld.setLevel(3);document.body.classList.remove("playing");$("#travel").style.display="none";stageState.mode="menu";player=partner=null;menu.style.display="flex";hud.style.display=quest.style.display=prompt.style.display="none";Object.values(pos).forEach(resetActorState);Object.assign(pos.Bubu,{x:-1.3,z:-5.8,flip:false});Object.assign(pos.Dudu,{x:1.3,z:-5.8,flip:true})}

function hearts(n=18){
  if(reducedMotion)return;
  const p=projectScreen((pos[player].x+pos[partner].x)/2,(pos[player].z+pos[partner].z)/2,2.1);
  for(let i=0;i<n;i++){const h=el("div","heart");h.style.left=p.x+"px";h.style.top=p.y+"px";h.style.setProperty("--x",`${(Math.random()-.5)*240}px`);h.style.setProperty("--y",`${-80-Math.random()*210}px`);h.style.setProperty("--r",`${(Math.random()-.5)*80}deg`);h.style.setProperty("--s",`${.55+Math.random()*.85}`);h.style.setProperty("--d",`${1+Math.random()*.7}s`);fx.appendChild(h);setTimeout(()=>h.remove(),1900)}
}
function petals(){
  if(reducedMotion)return;
  const p=el("div","petal");p.style.left=Math.random()*innerWidth+"px";p.style.top="-20px";p.style.setProperty("--x",`${(Math.random()-.5)*180}px`);p.style.setProperty("--d",`${4+Math.random()*3}s`);fx.appendChild(p);setTimeout(()=>p.remove(),7500)
}
function projectScreen(x,z,y=0){return engine?engine.project(x,y,z):{x:innerWidth/2,y:innerHeight/2};}
function giveFlowers(){
  if(stageState.level!==3||!player||dist()>2.35||!["approach","ready","done"].includes(stageState.mode))return;
  if(stageState.flowers<=stageState.gifted){setPrompt("Primero juntá ramos en los niveles anteriores 🌷",true);return}
  stageState.gifted++;stageState.mode="flowers";stageState.eventT=0;face();setQuest("flowers");setPrompt("Entregando el ramo… 🌷",true);hearts(10);flowerChime();
}
function kiss(){
  if(!player||!["ready","done"].includes(stageState.mode)||dist()>1.9)return;
  stageState.mode="kiss";stageState.eventT=0;stageState.kisses++;face();setQuest("kiss");setPrompt("💋 ¡Mwah!",true);hearts(30);kissChime();

  toast.textContent=stageState.kisses===1?"💗 PRIMER BESO 💗":`💗 ${stageState.kisses} BESOS 💗`;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),900);
}

/* audio */
let ac=null,musicTimer=null,note=0;const melody=[523.25,659.25,783.99,659.25,587.33,698.46,783.99,880,783.99,659.25,587.33,523.25];
function audio(){try{ac||=new (window.AudioContext||window.webkitAudioContext)();ac.resume?.();return ac}catch{return null}}
function tone(f,d=.18,v=.025,delay=0,type="sine"){if(!stageState.music)return;const a=audio();if(!a)return;const o=a.createOscillator(),g=a.createGain(),t=a.currentTime+delay;o.type=type;o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.03)}
function startMusic(){audio();if(musicTimer)return;musicTimer=setInterval(()=>{if(!stageState.music||stageState.mode==="menu")return;const n=melody[note++%melody.length];tone(n,.3,.012);tone(n/2,.38,.006,.02,"triangle")},440)}
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
addEventListener("blur",()=>{key.clear();autoWalk=false});
document.addEventListener("visibilitychange",()=>{if(document.hidden){key.clear();autoWalk=false}});
document.addEventListener("selectstart",e=>{if(!e.target.matches?.("input,textarea,[contenteditable=true]"))e.preventDefault()},{passive:false});
document.addEventListener("dragstart",e=>{if(!e.target.matches?.("input,textarea,[contenteditable=true]"))e.preventDefault()},{passive:false});
document.addEventListener("contextmenu",e=>{if(e.target.closest?.("#mobile,#cameraControls,#scene3d"))e.preventDefault()},{passive:false});
document.addEventListener("dblclick",e=>{if(e.target.closest?.("#mobile,#cameraControls,#scene3d"))e.preventDefault()},{passive:false});
["gesturestart","gesturechange","gestureend"].forEach(type=>document.addEventListener(type,e=>e.preventDefault(),{passive:false}));
$("#menuButton").onclick=menuBack;
function advanceLevel(){if(stageState.level>=3)return;if(currentCollected()<3){setPrompt(`Todavía faltan ${3-currentCollected()} ramos en este nivel 🌷`,true);return}loadLevel(stageState.level+1);hearts(12);}
function jump(){
  if(stageState.level>=3||!player||stageState.mode!=="platform"||(pos[player].jumpY||0)>0.02)return;
  pos[player].jumpV=5.0;pos[player].jumpY=.03;setPrompt("¡Saltá para pasar los obstáculos!",true);
}
$("#travel").onclick=()=>{if(stageState.level<3&&stageState.mode==="exit")advanceLevel();else if(stageState.level===3)autoWalk=true};
prompt.onclick=()=>{if(stageState.level<3&&stageState.mode==="exit")advanceLevel();else if(stageState.mode==="approach"||stageState.mode==="ready"||stageState.mode==="done")giveFlowers();else kiss()};
document.querySelectorAll("[data-key]").forEach(b=>{const k=b.dataset.key;b.style.touchAction="none";b.style.userSelect="none";const d=e=>{e.preventDefault();b.setPointerCapture?.(e.pointerId);key.add(k)},u=e=>{e.preventDefault();key.delete(k)};b.onpointerdown=d;b.onpointerup=u;b.onpointercancel=u;b.onpointerleave=u});
document.querySelector('[data-action="flowers"]').onclick=giveFlowers;document.querySelector('[data-action="kiss"]').onclick=kiss;document.querySelector('[data-action="jump"]').onclick=jump;

let last=performance.now(),petalT=0;
function updateMobs(t){
  for(const m of stageState.mobs){const previous=m.axis==="x"?m.x:m.z,offset=Math.sin(t*m.speed+m.phase)*m.range;if(m.axis==="x")m.x=m.baseX+offset;else m.z=m.baseZ+offset;m.flip=previous>(m.axis==="x"?m.x:m.z)}
}
function respawn(){const c=currentChapter();Object.assign(pos[player],{x:c.start.x,z:c.start.z});pos[player].moving=false;stageState.hitCooldown=.8;setPrompt("¡Cuidado con los enemigos y las espinas! Volviste al inicio.",true);hearts(8)}
function collectNearbyFlowers(){
  const c=currentChapter();for(const f of c.flowers){if(stageState.collected.includes(f.id))continue;if(Math.hypot(pos[player].x-f.x,pos[player].z-f.z)<.85){stageState.collected.push(f.id);stageState.flowers=stageState.collected.length;toast.textContent=`🌷 RAMO ${stageState.flowers}`;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),800);flowerChime();}}
}
function updatePlatform(dt,t){
  stageState.hitCooldown=Math.max(0,stageState.hitCooldown-dt);updateMobs(t);
  const actor=pos[player];if(actor.jumpY>0||actor.jumpV>0){actor.jumpY+=actor.jumpV*dt;actor.jumpV-=13.5*dt;if(actor.jumpY<=0){actor.jumpY=0;actor.jumpV=0;}}
  let dx=(key.has("d")||key.has("arrowright")?1:0)-(key.has("a")||key.has("arrowleft")?1:0),dz=(key.has("s")||key.has("arrowdown")?1:0)-(key.has("w")||key.has("arrowup")?1:0),moving=false;
  const l=Math.hypot(dx,dz);if(l){dx/=l;dz/=l;moving=true;const yaw=engine.yaw,wx=dx*Math.cos(yaw)+dz*Math.sin(yaw);dz=-dx*Math.sin(yaw)+dz*Math.cos(yaw);dx=wx;}
  const previous={x:pos[player].x,z:pos[player].z},nx=Math.max(-X_LIMIT,Math.min(X_LIMIT,pos[player].x+dx*3.7*dt)),nz=Math.max(Z_MIN,Math.min(Z_MAX,pos[player].z+dz*3.7*dt));Object.assign(pos[player],engine.move(pos[player],nx,nz));
  moving=Math.hypot(pos[player].x-previous.x,pos[player].z-previous.z)>.0001;pos[player].moving=moving;pos[partner].moving=false;if(moving){pos[player].walkTime+=dt;setHeading(pos[player],Math.atan2(dx,dz));}
  if(stageState.hitCooldown<=0&&((PaperWorld.hazardAt(pos[player].x,pos[player].z)&&actor.jumpY<.22)|| (actor.jumpY<.65&&stageState.mobs.some(m=>Math.hypot(m.x-pos[player].x,m.z-pos[player].z)<.88)))){respawn();return}
  collectNearbyFlowers();const goal=currentChapter().goal,goalDistance=Math.hypot(pos[player].x-goal.x,pos[player].z-goal.z);
  if(goalDistance<1.35&&currentCollected()===3){stageState.mode="exit";setPrompt(`¡Nivel ${stageState.level} superado! Presioná para entrar al siguiente →`,true);$("#travel").style.display="block"}
  else {stageState.mode="platform";$("#travel").style.display="none";setPrompt(`Nivel ${stageState.level} · Ramos ${currentCollected()}/3 · Meta: ${goalDistance.toFixed(1)} m`)}
  hud.innerHTML=`<strong>Nivel ${stageState.level}/3</strong> · Ramos: ${currentCollected()}/3 · Total: ${stageState.flowers}<br><strong>${stageState.chosen}</strong> · ${escapeHtml(stageState.dedication)}`;
}
function update(dt,t){
  petalT+=dt;if(petalT>.23){petalT=0;if(stageState.mode!=="menu"&&Math.random()<.4)petals()}
  if(!player)return;
  stageState.eventT+=dt;
  if(stageState.level<3){updatePlatform(dt,t);return;}
  const locked=["flowers","kiss"].includes(stageState.mode);
  let dx=0,dz=0,moving=false;
  if(!locked){
    dx=(key.has("d")||key.has("arrowright")?1:0)-(key.has("a")||key.has("arrowleft")?1:0);
    dz=(key.has("s")||key.has("arrowdown")?1:0)-(key.has("w")||key.has("arrowup")?1:0);
    if(dx||dz)autoWalk=false;
    if(autoWalk){const tx=pos[partner].x-1.65,tz=pos[partner].z;dx=tx-pos[player].x;dz=tz-pos[player].z;if(Math.hypot(dx,dz)<.09){autoWalk=false;dx=dz=0}}
    const l=Math.hypot(dx,dz);if(l){dx/=l;dz/=l;moving=true}
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
    face();
    if(stageState.eventT>2.25){
      stageState.mode="ready";stageState.eventT=0;setQuest("kiss");
      setPrompt("Ahora acercate un poquito y presioná Espacio 💋",true);
    }
  }
  if(stageState.mode==="ready"||stageState.mode==="done"){
    if(!moving)face();
    if(dist()<1.9)setPrompt(stageState.mode==="done"?`${stageState.dedication} · Espacio = otro beso 💋`:"Presioná Espacio para besar 💋");
    else setPrompt(`Acercate un poquito más · ${dist().toFixed(1)} m`);
  }
  if(stageState.mode==="kiss"){
    face();let vx=pos[partner].x-pos[player].x,vz=pos[partner].z-pos[player].z,l=Math.hypot(vx,vz)||1;vx/=l;vz/=l;
    const mx=(pos[player].x+pos[partner].x)/2,mz=(pos[player].z+pos[partner].z)/2,q=Math.min(1,dt*5);
    Object.assign(pos[player],engine.move(pos[player],pos[player].x+(mx-vx*.64-pos[player].x)*q,pos[player].z+(mz-vz*.64-pos[player].z)*q));
    Object.assign(pos[partner],engine.move(pos[partner],pos[partner].x+(mx+vx*.64-pos[partner].x)*q,pos[partner].z+(mz+vz*.64-pos[partner].z)*q));
    if(stageState.eventT>2.0){quest.querySelectorAll(".q").forEach(q=>q.className="q done");stageState.mode="done";stageState.eventT=0;setPrompt(`${stageState.dedication} · ${stageState.kisses} ${stageState.kisses===1?"beso":"besos"} 💗`,true)}
  }
  $("#travel").style.display=dist()>2.35&&!locked?"block":"none";

  hud.innerHTML=`<strong>Nivel 3/3 · ${stageState.chosen}</strong> · Ramos ${stageState.flowers-stageState.gifted}/${stageState.flowers}<br>${escapeHtml(stageState.dedication)}<br>WASD/flechas · E ramo · Espacio beso · Besos: <strong>${stageState.kisses}</strong> 💋`;
}
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(rendererReady){update(dt,now/1000);engine.render(dt,now/1000,stageState,pos,player,partner)}requestAnimationFrame(loop)}
window.__BUBU_DUDU_PAPER_DATE__={start,reset,menu:menuBack,giveFlowers,kiss,state:stageState,debugNear(){if(player&&partner){pos[player].x=pos[partner].x-1.55;pos[player].z=pos[partner].z+.18;face();}}};
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
