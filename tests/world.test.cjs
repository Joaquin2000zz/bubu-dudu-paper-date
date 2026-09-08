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
test('A jumping actor can clear a solid obstacle while a grounded actor cannot',()=>{
 w.setLevel(1);const grounded=w.move({x:-3.5,z:4.5},-.5,4.5);const airborne=w.move({x:-3.5,z:4.5,jumpY:.8},-.5,4.5);
 assert(grounded.x< -2.5);assert(airborne.x>-.7);w.setLevel(3);
});
test('A gap blocks grounded travel and can be crossed in the air',()=>{
 w.setLevel(1);const grounded=w.move({x:-1,z:6.2},-1,4.2);const airborne=w.move({x:-1,z:6.2,jumpY:.8},-1,4.2);
 assert(grounded.z>5.8);assert(airborne.z<4.5);w.setLevel(3);
});
