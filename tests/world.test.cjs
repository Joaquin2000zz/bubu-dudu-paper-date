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
