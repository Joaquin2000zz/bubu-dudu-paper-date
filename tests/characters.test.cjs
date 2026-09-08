const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const scope=vm.createContext({});
vm.runInContext(fs.readFileSync('src/characters.js','utf8')+'\nthis.characters=PaperCharacters;',scope);
vm.runInContext(fs.readFileSync('src/animation.js','utf8')+'\nthis.animation=PaperAnimation;',scope);
const positions={Bubu:{x:-1,z:0,heading:0},Dudu:{x:1,z:0,heading:0}};
const pose=(p,state={mode:'approach'})=>scope.animation.pose('Bubu',p,positions,state,'Bubu','Dudu',0);
test('Movement shows front, back and both directions of the three-quarter drawing',()=>{
  assert.equal(pose({heading:0}).view,'front');assert.equal(pose({heading:Math.PI}).view,'back');
  assert.equal(pose({heading:Math.PI/2}).view,'side');assert.equal(pose({heading:-Math.PI/2}).flip,true);
  assert.equal(pose({heading:Math.PI/2,moving:true,walkTime:.2}).action,'walk');
});
test('Walk animation advances frames and stops in an idle pose',()=>{
  const frames=Array.from({length:8},(_,i)=>pose({heading:0,moving:true,walkTime:(i+.1)/11}).frame);
  assert.equal(new Set(frames).size,8);assert.equal(pose({heading:0,moving:false,walkTime:99}).frame,0);
});
test('Giver, receiver, kiss and post-kiss expression select different art',()=>{
  assert.equal(pose(positions.Bubu,{mode:'flowers',eventT:1}).action,'give');
  assert.equal(scope.animation.pose('Dudu',positions.Dudu,positions,{mode:'flowers',eventT:1},'Bubu','Dudu',0).action,'receive');
  assert.equal(pose(positions.Bubu,{mode:'kiss',eventT:1}).action,'kiss');
  assert.equal(pose(positions.Bubu,{mode:'done',eventT:1}).action,'happy');
});
test('Turning the camera behind the couple preserves facing toward each other',()=>{
  const state={mode:'kiss',eventT:1};
  const front=scope.animation.pose('Bubu',positions.Bubu,positions,state,'Bubu','Dudu',0);
  const behind=scope.animation.pose('Bubu',positions.Bubu,positions,state,'Bubu','Dudu',Math.PI);
  assert.equal(front.flip,false);assert.equal(behind.flip,true);
  assert.equal(scope.animation.pose('Dudu',positions.Dudu,positions,state,'Bubu','Dudu',Math.PI).flip,false);
});
test('Front, three-quarter and rear are distinct drawings; rear has no eyes or blush',()=>{
  for(const name of ['Bubu','Dudu']){
    const front=scope.characters.svg(name,'front'),side=scope.characters.svg(name,'side'),back=scope.characters.svg(name,'back');
    assert.notEqual(front,side);assert.notEqual(side,back);assert(!back.includes('cy="154"'));
    assert(!back.includes(name==='Bubu'?'#f4b0ae':'#f5ca80'));
    assert(side.includes('cx="122"'));assert(side.includes('cx="188"'));
    assert.notEqual(scope.characters.svg(name,'side','give',0),scope.characters.svg(name,'side','give',3));
    assert.notEqual(scope.characters.svg(name,'side','idle'),scope.characters.svg(name,'side','kiss',3));
  }
});
test('Every renderable pose has a complete SVG shape and preserves the identity palette',()=>{
  for(const name of ['Bubu','Dudu'])for(const view of ['front','side','back'])for(const action of ['idle','walk','give','receive','kiss','happy']){
    const svg=scope.characters.svg(name,view,action,3);assert(svg.startsWith('<g'));assert(svg.endsWith('</g>'));
    assert(svg.includes(name==='Bubu'?'#fffdf9':'#d9a181'));
  }
});
test('Walking and idle drawings show two arms in front, one on the side, none on the back',()=>{
  for(const name of ['Bubu','Dudu'])for(const action of ['idle','walk'])for(let frame=0;frame<8;frame++){
    for(const [view,count] of [['front',2],['side',1],['back',0]]){
      const svg=scope.characters.svg(name,view,action,frame);
      assert.equal((svg.match(/data-part="arm"/g)||[]).length,count,`${name} ${view} ${action} frame ${frame}`);
    }
  }
});

test('Emotions recover with bouquets and chapters without changing character identity',()=>{
 const c=scope.characters;
 assert.equal(c.emotion(1,0),'crying');assert.equal(c.emotion(1,1),'sad');assert.equal(c.emotion(1,3),'calm');assert.equal(c.emotion(2,3),'calm');assert.equal(c.emotion(2,5),'happy');assert.equal(c.emotion(3,6),'happy');
 for(const name of ['Bubu','Dudu'])for(const mood of ['crying','sad','calm','happy']){
 const svg=c.svg(name,'front','walk',2,mood);assert(svg.includes(name==='Bubu'?'#fffdf9':'#d9a181'));
 assert.equal(svg.includes('data-emotion='),mood==='crying'||mood==='sad');
 assert(!c.svg(name,'back','walk',2,mood).includes('data-emotion='));
 }
});
