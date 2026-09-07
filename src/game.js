
(() => {
"use strict";
const $=s=>document.querySelector(s), fx=$("#fx"), hud=$("#hud"), prompt=$("#prompt"), quest=$("#quest"), menu=$("#menu"), toast=$("#toast");
const U=58, X_LIMIT=8.5, Z_MIN=-8.5, Z_MAX=8.1;
const stageState={mode:"menu",chosen:"",kisses:0,eventT:0,dedication:"",music:true};
const key=new Set();
let autoWalk=false;
const reducedMotion=matchMedia("(prefers-reduced-motion: reduce)").matches;
const pos={
  Bubu:{x:-1.3,z:-5.8,flip:false,bob:0,heading:0,walkTime:0,turnT:0,moving:false},
  Dudu:{x:1.3,z:-5.8,flip:true,bob:0,heading:0,walkTime:0,turnT:0,moving:false}
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
function start(name){
  if(!rendererReady)return;
  key.clear();autoWalk=false;document.body.classList.add("playing");$("#travel").style.display="block";document.activeElement?.blur();
  stageState.chosen=name;stageState.kisses=0;stageState.mode="approach";stageState.eventT=0;stageState.dedication=$("#dedication").value.trim()||"Para vos, con todo mi amor 💗";
  player=name;partner=name==="Bubu"?"Dudu":"Bubu";
  Object.assign(pos[player],{x:-.8,z:3.0,flip:false});Object.assign(pos[partner],{x:1.0,z:-5.7,flip:true});
  for(const p of Object.values(pos)){p.moving=false;p.walkTime=0;p.turnT=0;}
  pos[player].heading=Math.PI;pos[partner].heading=0;
  menu.style.display="none";hud.style.display="block";quest.style.display="flex";prompt.style.display="block";
  setQuest("approach");setPrompt(`Acercate a ${partner} 💕`);startMusic();
}
$("#chooseBubu").onclick=()=>start("Bubu");$("#chooseDudu").onclick=()=>start("Dudu");

function reset(){ if(!stageState.chosen){menu.style.display="flex";return} start(stageState.chosen) }
function menuBack(){key.clear();autoWalk=false;document.body.classList.remove("playing");$("#travel").style.display="none";stageState.mode="menu";player=partner=null;menu.style.display="flex";hud.style.display=quest.style.display=prompt.style.display="none";Object.values(pos).forEach(p=>{p.moving=false;p.heading=0;p.turnT=0;});Object.assign(pos.Bubu,{x:-1.3,z:-5.8,flip:false});Object.assign(pos.Dudu,{x:1.3,z:-5.8,flip:true})}

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
  if(stageState.mode!=="approach"||!player||dist()>2.35)return;
  stageState.mode="flowers";stageState.eventT=0;face();setQuest("flowers");setPrompt("Entregando el ramo… 🌷",true);hearts(10);flowerChime();
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
  const k=e.key.toLowerCase();if(["arrowup","arrowdown","arrowleft","arrowright"," ","e","r","escape"].includes(k))e.preventDefault();
  if(stageState.mode==="menu" && k!=="escape")return;
  if(k==="q"){engine?.rotate(-.28);return}if(k==="c"){engine?.rotate(.28);return}
  if(k==="escape"){menuBack();return} if(k==="r"){reset();return}
  key.add(k);if(e.repeat)return;if(k==="e")giveFlowers();if(k===" ")kiss()
},{passive:false});
addEventListener("keyup",e=>key.delete(e.key.toLowerCase()));
addEventListener("blur",()=>{key.clear();autoWalk=false});
document.addEventListener("visibilitychange",()=>{if(document.hidden){key.clear();autoWalk=false}});
$("#menuButton").onclick=menuBack;
$("#travel").onclick=()=>{autoWalk=true};
prompt.onclick=()=>{if(stageState.mode==="approach")giveFlowers();else kiss()};
document.querySelectorAll("[data-key]").forEach(b=>{const k=b.dataset.key;const d=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);key.add(k)},u=e=>{e.preventDefault();key.delete(k)};b.onpointerdown=d;b.onpointerup=u;b.onpointercancel=u;b.onpointerleave=u});
document.querySelector('[data-action="flowers"]').onclick=giveFlowers;document.querySelector('[data-action="kiss"]').onclick=kiss;

let last=performance.now(),petalT=0;
function update(dt,t){
  petalT+=dt;if(petalT>.23){petalT=0;if(stageState.mode!=="menu"&&Math.random()<.4)petals()}
  if(!player)return;
  stageState.eventT+=dt;
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
    if(dist()<2.35){if(!moving)face();setPrompt("Presioná E para darle las flores 🌷")}else setPrompt(`Acercate a ${partner} · ${dist().toFixed(1)} m 💕`);
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

  hud.innerHTML=`<strong>${stageState.chosen}</strong> · ${escapeHtml(stageState.dedication)}<br>WASD/flechas · E flores · Espacio beso<br>Besos: <strong>${stageState.kisses}</strong> 💋`;
}
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(rendererReady){update(dt,now/1000);engine.render(dt,now/1000,stageState,pos,player,partner)}requestAnimationFrame(loop)}
window.__BUBU_DUDU_PAPER_DATE__={start,reset,menu:menuBack,giveFlowers,kiss,state:stageState,debugNear(){if(player&&partner){pos[player].x=pos[partner].x-1.55;pos[player].z=pos[partner].z+.18;face();}}};
$("#cameraLeft").onclick=()=>engine?.rotate(-.28);
$("#cameraRight").onclick=()=>engine?.rotate(.28);
requestAnimationFrame(loop);
})();
