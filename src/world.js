/* One source of truth for rendered floors and walkable support heights. */
const PaperWorld=(()=>{
 const floors=[];
 const add=(id,x,y,z,w,h,d,color)=>floors.push({id,x,y,z,w,h,d,color,top:y+h});
 add('grass',0,-.12,0,20,.15,21.7,'#96b77a');
 for(let j=0;j<17;j++)add('path'+j,j%2?-.06:.06,.035,8.8-j*1.03,2.55,.07,.99,j%3===0?'#e7c895':'#efd8ac');
 add('terrace-base',0,0,-7.7,7.5,.38,4.3,'#d4b37c');
 add('terrace',0,.38,-7.7,7.65,.10,4.45,'#f3deb2');
 add('step-lower',0,0,-5.15,3.6,.14,.60,'#d3b384');
 add('step-upper',0,.14,-5.65,3.6,.16,.6,'#e5c995');
 for(let i=0;i<11;i++)add('bridge'+i,-5,.20+Math.sin(i/10*Math.PI)*.20,-2+i*.40,1.45,.16,.36,'#bc9669');
 for(const side of [-1,1])add('bridge-entry'+side,-5,.03,side*2.35,1.45,.15,.36,'#bc9669');
 const radius=.24,maxStep=.23;
 function heightAt(x,z){
   let height=-Infinity;
   for(const f of floors)if(Math.abs(x-f.x)<=f.w/2+1e-8&&Math.abs(z-f.z)<=f.d/2+1e-8)height=Math.max(height,f.top);
   // Tiny spaces between bridge planks are traversable, but their support stays
   // at the adjacent plank height, never on an unrelated sinusoidal surface.
   if(Math.abs(x+5)<=.725&&Math.abs(z)<=2.18){const i=Math.max(0,Math.min(10,Math.round((z+2)/.4)));height=Math.max(height,floors.find(f=>f.id==='bridge'+i).top);}
   return height;
 }
 function supportAt(x,z){return Math.max(heightAt(x,z),heightAt(x-radius,z),heightAt(x+radius,z),heightAt(x,z-radius),heightAt(x,z+radius));}
 function rect(x,z,cx,cz,w,d){return Math.abs(x-cx)<w/2+radius&&Math.abs(z-cz)<d/2+radius;}
 function blocked(x,z){
   if(Math.abs(x)>8.5||z< -9.5||z>8.1)return true;
   if(((x+5)/2.85)**2+(z/2.15)**2<1&&Math.abs(x+5)>.48)return true;
   for(const tx of [-3.1,3.1])for(const tz of [-6.6,-9])if(rect(x,z,tx,tz,.60,.60))return true;
   if(rect(x,z,0,-8.4,4.3,1.0))return true;
   for(const side of [-1,1])if(rect(x,z,side*6.4,-4.1,4.2,.2))return true;
   for(const xRail of [-5.8,-4.2])if(rect(x,z,xRail,0,.14,4.2))return true;
   return false;
 }
 function canMove(x,z,nx,nz){return !blocked(nx,nz)&&Math.abs(supportAt(nx,nz)-supportAt(x,z))<=maxStep+1e-8;}
 function move(position,nx,nz){
   let {x,z}=position;const count=Math.max(1,Math.ceil(Math.hypot(nx-x,nz-z)/.06)),dx=(nx-x)/count,dz=(nz-z)/count;
   for(let i=0;i<count;i++){
     if(canMove(x,z,x+dx,z+dz)){x+=dx;z+=dz;}
     else {if(canMove(x,z,x+dx,z))x+=dx;if(canMove(x,z,x,z+dz))z+=dz;}
   }
   return {x,z,y:supportAt(x,z)};
 }
 return {floors,heightAt,supportAt,blocked,move,radius,maxStep};
})();
