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
  3:{
   id:3,name:'El jardín de los encuentros',chapter:'CAPÍTULO 03 · FINAL',start:{x:-.8,z:3},goal:{x:1,z:-5.7},
   floors:gardenFloors,gaps:[],obstacles:[],hazards:[],mobs:[],flowers:[],giftSpots:[{x:-2.8,z:4.8},{x:2.2,z:3.8},{x:4.7,z:-1.2}]
  }
 };
 // Floating stepping stones: no invisible walkable meadow under the route.
 const routes={1:[[-3,7],[-4,4.5],[-2,2],[0,-.5],[2,-3],[4,-5.5],[3,-8]],2:[[-3,7],[-1,4.5],[1,2],[-1,-.5],[1,-3],[3,-5.5],[3,-8]]};
 for(const id of [1,2]){
  const route=routes[id],dark=id===1;
  const platforms=route.map(([x,z],i)=>floor(`l${id}-island-${i}`,x,-.35+(i%2)*.12,z,i===0||i===6?3.4:(id===1?3:2.7),.5,i===0||i===6?2.1:1.65,dark?'#687788':'#8b9988'));
  LEVELS[id]={id,name:dark?'El valle de las cartas perdidas':'El bosque del primer amanecer',chapter:`CAPÍTULO 0${id}`,start:{x:route[0][0],z:route[0][1]},goal:{x:route[6][0],z:route[6][1]},floors:platforms,
   gaps:route.slice(0,-1).map(([x,z],i)=>({id:`abyss-${i}`,x:0,z:z-1.25,w:20,d:.6})),
   obstacles:[{id:`l${id}-fallen-log`,x:route[2][0]+.7,z:route[2][1],w:.5,d:1.1,y:.15,h:.65,color:dark?'#454659':'#6a645f',kind:'log'}],
   hazards:[{id:'brambles-a',x:route[3][0]-.95,z:route[3][1],w:.45,d:1.2},{id:'brambles-b',x:route[5][0]+.95,z:route[5][1],w:.45,d:1.2}],
   flowers:[1,3,5].map((i,k)=>({id:`l${id}-flower-${k}`,x:route[i][0],z:route[i][1]-.2})),
   mobs:[2,4,5].map((i,k)=>({id:`l${id}-warden-${k}`,x:route[i][0]-.5,z:route[i][1],axis:'x',range:.65,speed:dark?1.5:2,arena:platforms[i],windup:dark?.85:.6,recovery:dark?1.5:1.1})),route};
 }
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
