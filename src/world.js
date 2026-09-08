/* One source of truth for rendered floors, platform collisions and level data. */
const PaperWorld=(()=>{
 const gardenFloors=[];
 const add=(id,x,y,z,w,h,d,color)=>gardenFloors.push({id,x,y,z,w,h,d,color,top:y+h});
 // The original garden is level 3. Its exact support map stays intact.
 add('grass',0,-.12,0,20,.15,21.7,'#96b77a');
 for(let j=0;j<17;j++)add('path'+j,j%2?-.06:.06,.035,8.8-j*1.03,2.55,.07,.99,j%3===0?'#e7c895':'#efd8ac');
 add('terrace-base',0,0,-7.7,7.5,.38,4.3,'#d4b37c');
 add('terrace',0,.38,-7.7,7.65,.10,4.45,'#f3deb2');
 add('step-lower',0,0,-5.15,3.6,.14,.60,'#d3b384');
 add('step-upper',0,.14,-5.65,3.6,.16,.6,'#e5c995');
 for(let i=0;i<11;i++)add('bridge'+i,-5,.20+Math.sin(i/10*Math.PI)*.20,-2+i*.40,1.45,.16,.36,'#bc9669');
 for(const side of [-1,1])add('bridge-entry'+side,-5,.03,side*2.35,1.45,.15,.36,'#bc9669');

 const floor=(id,x,y,z,w,h,d,color)=>({id,x,y,z,w,h,d,color,top:y+h});
 const LEVELS={
  1:{
   id:1,name:'La pradera de papel',chapter:'CAPÍTULO 01',start:{x:-3.5,z:7},goal:{x:7,z:-7},
   floors:[
    floor('l1-ground',0,-.12,0,20,.15,21.7,'#9fbe83'),
    floor('l1-step-a',-5,.03,1.35,3.7,.12,.70,'#d7af80'),floor('l1-step-b',-5,.15,1.85,3.7,.12,.70,'#e8c999'),
    floor('l1-platform-a',-5,.27,2.8,4.1,.16,2.45,'#e8c895'),
    floor('l1-step-c',0,.03,-.3,3.0,.12,.70,'#d7af80'),floor('l1-step-d',0,.15,-.8,3.0,.12,.70,'#e8c999'),
    floor('l1-platform-b',0,.27,-1.45,3.7,.18,2.25,'#dcb783'),
    floor('l1-platform-c',5,.22,-5.0,3.7,.16,2.4,'#efd39f'),
    floor('l1-bridge-a',-1.0,.27,5.3,3.0,.16,.72,'#e7c895'),floor('l1-bridge-b',2.0,.30,.3,3.0,.16,.72,'#e7c895'),floor('l1-bridge-c',4.0,.27,-3.5,3.0,.16,.72,'#e7c895')
   ],
   gaps:[{id:'l1-gap-a',x:0,z:5.3,w:19,d:1.15},{id:'l1-gap-b',x:0,z:.3,w:19,d:1.15},{id:'l1-gap-c',x:0,z:-3.5,w:19,d:1.15}],
   obstacles:[
    {id:'l1-crate-a',x:-1.9,z:4.5,w:1.0,d:1.0,y:.03,h:.72,color:'#a86f4d',kind:'crate'},
    {id:'l1-crate-b',x:2.9,z:1.5,w:1.2,d:1.2,y:.03,h:.82,color:'#b47e53',kind:'crate'},
    {id:'l1-rock',x:6.3,z:1.7,w:1.1,d:.9,y:.03,h:.55,color:'#8f6b78',kind:'rock'}
   ],
   hazards:[{id:'l1-thorns',x:-2.8,z:-4.1,w:1.8,d:1.0},{id:'l1-thorns-b',x:3.0,z:-3.3,w:1.7,d:.9}],
   flowers:[{id:'l1-flower-a',x:-6.3,z:3.2},{id:'l1-flower-b',x:.1,z:-1.3},{id:'l1-flower-c',x:5.6,z:-5.0}],
   mobs:[{id:'l1-slime-a',x:-2.8,z:6,axis:'x',range:2.0,speed:1.1},{id:'l1-slime-b',x:4.4,z:-1.0,axis:'z',range:1.7,speed:1.35}]
  },
  2:{
   id:2,name:'El bosque de cartulina',chapter:'CAPÍTULO 02',start:{x:-3.5,z:7},goal:{x:7,z:-7},
   floors:[
    floor('l2-ground',0,-.12,0,20,.15,21.7,'#89ad83'),
    floor('l2-island-a',-5,.35,4.0,3.8,.18,2.4,'#cda97e'),floor('l2-island-b',-1,.70,1.0,3.0,.18,2.1,'#e4c08e'),
    floor('l2-island-c',3,.38,-2.0,3.5,.18,2.0,'#d3ad7c'),floor('l2-island-d',6,.72,-5.5,3.0,.18,2.2,'#efd49f'),
    floor('l2-step-a',-3,.03,2.7,1.0,.15,.65,'#d2aa78'),floor('l2-step-b',-2.2,.18,2.0,1.0,.15,.65,'#e4c28e'),
    floor('l2-step-c',1,.03,-.8,1.0,.15,.65,'#d2aa78'),floor('l2-step-d',1.8,.18,-1.4,1.0,.15,.65,'#e4c28e'),
    floor('l2-step-e',4.5,.03,-4.2,1.0,.15,.65,'#d2aa78'),floor('l2-step-f',5.3,.18,-4.8,1.0,.15,.65,'#e4c28e'),
    floor('l2-bridge-a',-3.5,.46,5.3,3.0,.18,.72,'#e4c08e'),floor('l2-bridge-b',-.2,.72,1.8,3.0,.18,.72,'#e4c08e'),floor('l2-bridge-c',2.7,.46,-1.4,3.0,.18,.72,'#e4c08e'),floor('l2-bridge-d',5.0,.72,-4.5,3.0,.18,.72,'#e4c08e')
   ],
   gaps:[{id:'l2-gap-a',x:0,z:5.3,w:19,d:1.15},{id:'l2-gap-b',x:0,z:1.8,w:19,d:1.15},{id:'l2-gap-c',x:0,z:-1.4,w:19,d:1.15},{id:'l2-gap-d',x:0,z:-4.5,w:19,d:1.15}],
   obstacles:[
    {id:'l2-log-a',x:-6.4,z:-1.8,w:2.2,d:.75,y:.03,h:.75,color:'#866048',kind:'log'},
    {id:'l2-crate-a',x:1.3,z:4.4,w:1.2,d:1.2,y:.03,h:.95,color:'#9c674a',kind:'crate'},
    {id:'l2-rock-a',x:-4.0,z:-4.0,w:1.4,d:1.2,y:.03,h:.65,color:'#766b7f',kind:'rock'}
   ],
   hazards:[{id:'l2-thorns-a',x:-.1,z:4.0,w:1.6,d:.9},{id:'l2-thorns-b',x:3.7,z:1.4,w:1.8,d:.8},{id:'l2-thorns-c',x:6.0,z:-1.7,w:1.4,d:.9}],
   flowers:[{id:'l2-flower-a',x:-5.0,z:4.0},{id:'l2-flower-b',x:-1.0,z:1.0},{id:'l2-flower-c',x:6.0,z:-5.5}],
   mobs:[{id:'l2-slime-a',x:-6.2,z:5.8,axis:'x',range:1.8,speed:1.45},{id:'l2-slime-b',x:2.2,z:-5.8,axis:'z',range:2.1,speed:1.7},{id:'l2-slime-c',x:5.2,z:2.5,axis:'x',range:1.5,speed:1.25}]
  },
  3:{
   id:3,name:'El jardín de los encuentros',chapter:'CAPÍTULO 03 · FINAL',start:{x:-.8,z:3},goal:{x:1,z:-5.7},
   floors:gardenFloors,gaps:[],obstacles:[],hazards:[],mobs:[],flowers:[],giftSpots:[{x:-2.8,z:4.8},{x:2.2,z:3.8},{x:4.7,z:-1.2}]
  }
 };
 let activeId=3,activeFloors=gardenFloors;
 const radius=.24,maxStep=.23;
 function setLevel(id){activeId=Number(id);if(!LEVELS[activeId])throw Error(`Nivel inexistente: ${id}`);activeFloors=LEVELS[activeId].floors;return LEVELS[activeId]}
 function level(id=activeId){return LEVELS[Number(id)]}
 function heightAt(x,z){
   let height=-Infinity;
   const inGap=activeId!==3&&(level().gaps||[]).some(g=>Math.abs(x-g.x)<=g.w/2&&Math.abs(z-g.z)<=g.d/2);
   for(const f of activeFloors)if(!(inGap&&f.id.endsWith('-ground'))&&Math.abs(x-f.x)<=f.w/2+1e-8&&Math.abs(z-f.z)<=f.d/2+1e-8)height=Math.max(height,f.top);
   if(activeId===3&&Math.abs(x+5)<=.725&&Math.abs(z)<=2.18){const i=Math.max(0,Math.min(10,Math.round((z+2)/.4)));height=Math.max(height,activeFloors.find(f=>f.id==='bridge'+i).top)}
   return height;
 }
 function supportAt(x,z){return Math.max(heightAt(x,z),heightAt(x-radius,z),heightAt(x+radius,z),heightAt(x,z-radius),heightAt(x,z+radius));}
 function rect(x,z,cx,cz,w,d){return Math.abs(x-cx)<w/2+radius&&Math.abs(z-cz)<d/2+radius;}
 function blocked(x,z){
   if(Math.abs(x)>8.5||z< -9.5||z>8.1)return true;
   if(activeId!==3){for(const o of level().obstacles)if(rect(x,z,o.x,o.z,o.w,o.d))return true;return false}
   if(((x+5)/2.85)**2+(z/2.15)**2<1&&Math.abs(x+5)>.48)return true;
   for(const tx of [-3.1,3.1])for(const tz of [-6.6,-9])if(rect(x,z,tx,tz,.60,.60))return true;
   if(rect(x,z,0,-8.4,4.3,1.0))return true;
   for(const side of [-1,1])if(rect(x,z,side*6.4,-4.1,4.2,.2))return true;
   for(const xRail of [-5.8,-4.2])if(rect(x,z,xRail,0,.14,4.2))return true;
   return false;
 }
 function hazardAt(x,z){return activeId===3?null:level().hazards.find(h=>rect(x,z,h.x,h.z,h.w,h.d))||null}
 function canMove(x,z,nx,nz,jumping=false){
   if(Math.abs(nx)>8.5||nz< -9.5||nz>8.1)return false;
   if(jumping){const from=supportAt(x,z),to=supportAt(nx,nz);if(from===-Infinity||to===-Infinity)return true;return Math.abs(to-from)<=1.25;}
   return !blocked(nx,nz)&&Math.abs(supportAt(nx,nz)-supportAt(x,z))<=maxStep+1e-8;
 }
 function move(position,nx,nz){
   let {x,z}=position;const count=Math.max(1,Math.ceil(Math.hypot(nx-x,nz-z)/.06)),dx=(nx-x)/count,dz=(nz-z)/count;
   const jumping=(position.jumpY||0)>.04;
   for(let i=0;i<count;i++){if(canMove(x,z,x+dx,z+dz,jumping)){x+=dx;z+=dz}else{if(canMove(x,z,x+dx,z,jumping))x+=dx;if(canMove(x,z,x,z+dz,jumping))z+=dz}}
   return {x,z,y:supportAt(x,z)};
 }
 return {get floors(){return activeFloors},get activeId(){return activeId},levels:LEVELS,level,setLevel,heightAt,supportAt,blocked,hazardAt,move,radius,maxStep};
})();
