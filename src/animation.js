/* Pure state-to-pose mapping. Facing is relative to the perspective camera. */
const PaperAnimation = {
  pose(name,p,positions,state,player,partner,yaw){
    const heading=p.heading??Math.PI,relative=heading-yaw,side=Math.abs(Math.sin(relative))>.55;
    let view=side?'side':Math.cos(relative)<0?'back':'front';
    let flip=side&&Math.sin(relative)<0,action=p.moving?'walk':'idle';
    let frame=p.moving?Math.floor((p.walkTime||0)*11)%8:0;
    const other=positions[name==='Bubu'?'Dudu':'Bubu'];
    const faceLeft=(other.x-p.x)*Math.cos(yaw)-(other.z-p.z)*Math.sin(yaw)<0;
    if(state.mode==='flowers'){
      view='side';flip=faceLeft;action=name===player?'give':'receive';frame=Math.min(3,Math.floor(Math.max(0,state.eventT-.55)/.5));
    }else if(state.mode==='kiss'){
      view='side';flip=faceLeft;action='kiss';frame=Math.min(3,Math.floor(Math.max(0,state.eventT-.55)/.4));
    }else if(state.mode==='done'&&!p.moving&&state.eventT<2){
      view='front';action='happy';frame=0;
    }else if((state.mode==='ready'||state.mode==='done')&&name===partner&&!p.moving){
      view='side';action='receive';frame=3;flip=faceLeft;
    }
    return {view,flip,action,frame,key:`${name}:${view}:${action}:${frame}`};
  }
};

export { PaperAnimation };
