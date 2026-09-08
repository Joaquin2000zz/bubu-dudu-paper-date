const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const scope=vm.createContext({});vm.runInContext(fs.readFileSync('src/world.js','utf8')+';this.world=PaperWorld;',scope);
const w=scope.world,close=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('Platform support matches the rendered top at the reported clipping location',()=>{
 close(w.heightAt(1,-5.7),.48);close(w.supportAt(1,-5.7),.48);
 close(w.heightAt(3,-5.5),.48);close(w.heightAt(4,-6),.03);
 close(w.heightAt(0,-10),.03);
});
test('Every solid floor is supported at least at its rendered top',()=>{
 for(const f of w.floors)assert(w.heightAt(f.x,f.z)>=f.top-1e-8,f.id);
});
test('Stair route allows ascent and descent without passing through the terrace',()=>{
 let p={x:0,z:-4};
 for(let i=0;i<70;i++)p=w.move(p,0,p.z-.03);
 assert(p.z< -6);close(p.y,.48);
 for(let i=0;i<70;i++)p=w.move(p,0,p.z+.03);
 assert(p.z> -4.1);assert(p.y<.15);
});
test('A high terrace side cannot be traversed in either direction',()=>{
 const incoming=w.move({x:4.5,z:-7},2.8,-7);assert(incoming.x>3.8);
 const outgoing=w.move({x:3.4,z:-7},4.5,-7);assert(outgoing.x<4.1);
});
test('Bridge stays supported across plank gaps and is accessible through its ends',()=>{
 let p={x:-5,z:3};
 for(let i=0;i<200;i++){p=w.move(p,-5,p.z-.03);if(Math.abs(p.z)<2)assert(p.y>=.36);}
 assert(p.z< -2.7,`Blocked bridge at ${p.z}`);
});
test('Movement cannot tunnel through the pond, rails, bench or posts',()=>{
 assert(w.blocked(-6,0));assert(w.blocked(-5.8,0));assert(w.blocked(0,-8.4));assert(w.blocked(3.1,-6.6));
 const p=w.move({x:-5,z:0},-7,0);assert(p.x> -5.5);
});
test('The campaign has two hostile flower-gathering levels and the original garden finale',()=>{
 assert.deepEqual(Object.keys(w.levels),['1','2','3']);
 for(const id of [1,2]){
 const level=w.level(id);assert.equal(level.flowers.length,3);assert(level.obstacles.length>0);assert(level.mobs.length>0);assert(level.goal);
  assert(level.gaps.length>=3);
  w.setLevel(id);assert.equal(w.levels[id].id,id);assert(w.hazardAt(level.hazards[0].x,level.hazards[0].z));
 }
 w.setLevel(3);assert.equal(w.level(3).name,'El jardín de los encuentros');assert.equal(w.level(3).giftSpots.length,3);
});
test('The fallen log blocks walking but allows a jump across its top',()=>{
 w.setLevel(1);const o=w.level().obstacles[0],start={x:o.x-.8,z:o.z};
 const grounded=w.move(start,o.x+.8,o.z),airborne=w.move({...start,jumpY:.8},o.x+.8,o.z);
 assert(grounded.x<o.x-.4);assert(airborne.x>o.x+.7);w.setLevel(3);
});
test('Every route requires jumps, has reachable landings and keeps flowers on safe floors',()=>{
 for(const id of [1,2]){w.setLevel(id);const c=w.level();
  assert.equal(w.supportAt(7,3),-Infinity,'No meadow shortcut');
  for(const f of c.flowers)assert(Number.isFinite(w.supportAt(f.x,f.z))&&!w.hazardAt(f.x,f.z));
  for(let i=1;i<c.floors.length;i++){
   const a=c.floors[i-1],b=c.floors[i];
   const dx=Math.max(0,Math.abs(a.x-b.x)-(a.w+b.w)/2),dz=Math.max(0,Math.abs(a.z-b.z)-(a.d+b.d)/2);
   assert(dz>.5,'Each crossing has a real gap');assert(Math.hypot(dx,dz)<1.5,'Landing is inside jump range');
   const x=Math.max(a.x-a.w/2+.3,Math.min(a.x+a.w/2-.3,b.x));
   const walk=w.move({x,z:a.z},x,b.z);assert(walk.z>b.z+.6,'Cannot walk across the abyss');
  }
 }w.setLevel(3);
});
test('Each crossing can be completed using the actual jump speed and gravity',()=>{
 for(const id of [1,2]){w.setLevel(id);const floors=w.floors;
  for(let i=1;i<floors.length;i++){
   const a=floors[i-1],b=floors[i],lo=Math.max(a.x-a.w/2+.3,b.x-b.w/2+.3),hi=Math.min(a.x+a.w/2-.3,b.x+b.w/2-.3);
   assert(lo<=hi,'There is a usable landing corridor');
   let p={x:(lo+hi)/2,z:a.z-a.d/2+.15,jumpY:.03},v=5;
   for(let frame=0;frame<100;frame++){
    p.jumpY+=v/120;v-=13.5/120;
    if(p.jumpY<=0){p.jumpY=0;break}
    p={...p,...w.move(p,p.x,Math.max(b.z,p.z-3.7/120))};
   }
   assert(Math.abs(p.z-b.z)<.2,`Level ${id}, crossing ${i} reaches its destination`);
   assert(Number.isFinite(w.supportAt(p.x,p.z)),`Level ${id}, crossing ${i} has a safe landing`);
  }
 }w.setLevel(3);
});
