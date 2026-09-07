/* Native WebGL scene: polygonal architecture, perspective camera and animated 2D actors. */
function createPaperEngine(canvas, symbols, reducedMotion) {
  const gl = canvas.getContext('webgl', {alpha:true,antialias:true,preserveDrawingBuffer:true});
  if (!gl) throw new Error('Este navegador no pudo iniciar WebGL. Activá la aceleración gráfica para jugar.');
  const vertex = `attribute vec3 aPosition;attribute vec2 aUV;attribute vec4 aColor;
    uniform mat4 uVP;varying vec2 vUV;varying vec4 vColor;
    void main(){vUV=aUV;vColor=aColor;gl_Position=uVP*vec4(aPosition,1.0);}`;
  const fragment = `precision mediump float;uniform sampler2D uTexture;varying vec2 vUV;varying vec4 vColor;
    void main(){vec4 c=texture2D(uTexture,vUV)*vColor;if(c.a<0.08)discard;gl_FragColor=c;}`;
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
  const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  const locations={p:gl.getAttribLocation(program,'aPosition'),uv:gl.getAttribLocation(program,'aUV'),c:gl.getAttribLocation(program,'aColor'),vp:gl.getUniformLocation(program,'uVP')};
  const white=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,white);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
  function color(hex,shade=1,alpha=1){return [parseInt(hex.slice(1,3),16)/255*shade,parseInt(hex.slice(3,5),16)/255*shade,parseInt(hex.slice(5,7),16)/255*shade,alpha];}
  function tri(out,a,b,c,col,uv=[[0,0],[1,0],[1,1]]){[a,b,c].forEach((v,i)=>out.push(...v,...uv[i],...col));}
  function quad(out,a,b,c,d,col){tri(out,a,b,c,col);tri(out,a,c,d,col,[[0,0],[1,1],[0,1]]);}
  function box(out,x,y,z,w,h,d,hex){let x0=x-w/2,x1=x+w/2,y0=y,y1=y+h,z0=z-d/2,z1=z+d/2;
    quad(out,[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1],color(hex,1));
    quad(out,[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],color(hex,.80));
    quad(out,[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],color(hex,.70));
    quad(out,[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],color(hex,.64));
    quad(out,[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],color(hex,.87));
  }
  function disk(out,x,y,z,rx,rz,col,n=40){for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2;tri(out,[x,y,z],[x+Math.cos(a)*rx,y,z+Math.sin(a)*rz],[x+Math.cos(b)*rx,y,z+Math.sin(b)*rz],col);}}
  function makeBuffer(data){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return {buffer:b,count:data.length/9};}
  const dynamic=gl.createBuffer();
  function drawBuffer(b,texture=white){gl.bindBuffer(gl.ARRAY_BUFFER,b.buffer);gl.vertexAttribPointer(locations.p,3,gl.FLOAT,false,36,0);gl.vertexAttribPointer(locations.uv,2,gl.FLOAT,false,36,12);gl.vertexAttribPointer(locations.c,4,gl.FLOAT,false,36,20);[locations.p,locations.uv,locations.c].forEach(i=>gl.enableVertexAttribArray(i));gl.bindTexture(gl.TEXTURE_2D,texture);gl.drawArrays(gl.TRIANGLES,0,b.count);}
  function draw(data,texture=white){gl.bindBuffer(gl.ARRAY_BUFFER,dynamic);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.DYNAMIC_DRAW);drawBuffer({buffer:dynamic,count:data.length/9},texture);}
  function multiply(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;}
  function norm(a){let l=Math.hypot(...a);return a.map(v=>v/l);}
  function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
  function lookAt(eye,target){const z=norm(eye.map((v,i)=>v-target[i])),x=norm(cross([0,1,0],z)),y=cross(z,x),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}
  function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);}

  // Geometry has real height, depth and differently lit faces. No CSS projection.
  const geometry=[];
  box(geometry,0,-1.0,0,19.8,.9,21.5,'#b98c60');
  for(let i=0;i<4;i++)box(geometry,0,-.91+i*.19,0,19.87,.04,21.57,'#e8c491');
  for(const f of PaperWorld.floors)box(geometry,f.x,f.y,f.z,f.w,f.h,f.d,f.color);
  // Sunken lake surrounded by a bank.
  disk(geometry,-5,.055,0,3.0,2.3,color('#e0ce97'));
  disk(geometry,-5,.07,0,2.7,2.02,color('#6faeb5'));
  disk(geometry,-5,.075,0,2.43,1.8,color('#99d3cf'));
  // Stone path and volumetric raised terrace.
  // Pergola: four posts, rails with depth, and an open slatted roof.
  for(const x of [-3.1,3.1])for(const z of [-6.6,-9.0]){box(geometry,x,.48,z,.36,4.35,.36,'#f4e2bb');box(geometry,x,.48,z,.6,.2,.6,'#d8ba86');box(geometry,x,4.55,z,.6,.25,.6,'#e3cba0');}
  for(const x of [-3.1,3.1])box(geometry,x,4.78,-7.8,.30,.28,3.25,'#ecd7ae');
  for(const z of [-6.35,-9.25])box(geometry,0,4.78,z,7.0,.28,.3,'#ecd7ae');
  for(let x=-2.8;x<=2.9;x+=.7)box(geometry,x,5.03,-7.8,.18,.14,3.45,'#f4dfb5');
  // A bench with seat, legs and backrest; visible from multiple angles.
  for(const x of [-1.8,1.8])for(const z of [-8.7,-8.0])box(geometry,x,.48,z,.18,.75,.18,'#806344');
  for(let z=-8.8;z<-7.85;z+=.23)box(geometry,0,1.16,z,4.3,.16,.19,'#bc8c60');
  for(const x of [-1.8,1.8])box(geometry,x,.9,-8.8,.16,1.2,.18,'#8a6241');
  for(const y of [1.55,1.9])box(geometry,0,y,-8.8,4.3,.24,.16,'#c3966d');
  // Bridge across the lake, with individual planks and rails.

  for(const x of [-5.8,-4.2]){for(const z of [-2,0,2])box(geometry,x,.12,z,.14,.88,.14,'#866548');box(geometry,x,.83,0,.12,.16,4.2,'#d0aa79');}
  // Low fences are solid polygonal objects.
  for(const side of [-1,1]){for(let i=0;i<5;i++)box(geometry,side*(4.4+i),0,-4.1,.18,1.15,.20,'#e5d6b5');for(const y of [.40,.85])box(geometry,side*6.4,y,-4.1,4.2,.13,.13,'#ccb890');}
  // Paving flecks and paper tufts, deterministic between loads.
  let seed=42;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
  for(let i=0;i<180;i++){const x=rand()*18-9,z=rand()*19-9.5;if(Math.abs(x)<1.7||z<-5.4||((x+5)**2/10+z*z/6<1))continue;disk(geometry,x,.041,z,.04+rand()*.08,.05,color(i%4===0?'#ecd89a':'#bfd092'),5);}
  const scene=makeBuffer(geometry);

  const textures=new Map(), jobs=[];
  function svgTexture(key,body,view='0 0 260 300',outline=true){
    const tex=gl.createTexture();textures.set(key,tex);gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));
    const size=view.split(' ').map(Number),w=384,h=Math.round(384*size[3]/size[2]);
    const filter=outline?'<defs><filter id="edge" x="-15%" y="-15%" width="130%" height="130%"><feMorphology in="SourceAlpha" operator="dilate" radius="3" result="outline"/><feFlood flood-color="#fff8e5"/><feComposite in2="outline" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>':'';
    const source=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${view}">${filter}<g ${outline?'filter="url(#edge)"':''}>${body}</g></svg>`;
    jobs.push(new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);resolve();};image.onerror=()=>reject(Error('No se pudo cargar el dibujo '+key));image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(source);}));
  }
  for(const id of ['treeCut','blossomCut','bushCut','tulipsCut','buntingCut','butterflyCut','bouquetCut','signCut']){const symbol=symbols.querySelector('#'+id);svgTexture(id,symbol.innerHTML,symbol.getAttribute('viewBox'));}

  // Distinct front/profile/back drawings, not a mirrored front. Limb positions are
  // authored per frame; the identity palette and facial proportions remain fixed.
  const actorArt=PaperCharacters.svg;
  for(const name of ['Bubu','Dudu']){
    for(const view of ['front','side','back']){svgTexture(`${name}:${view}:idle:0`,actorArt(name,view));for(let f=0;f<8;f++)svgTexture(`${name}:${view}:walk:${f}`,actorArt(name,view,'walk',f));}
    for(const action of ['give','receive','kiss'])for(let f=0;f<4;f++)svgTexture(`${name}:side:${action}:${f}`,actorArt(name,'side',action,f));
    svgTexture(`${name}:front:happy:0`,actorArt(name,'front','happy'));
  }
  svgTexture('heart','<path d="M50 85C-18 38 15 0 50 29C85 0 118 38 50 85Z" fill="#dd7388" stroke="#914e60" stroke-width="4"/>','-5 -5 110 105');

  const decorations=[];
  function prop(id,x,z,w,h,y=0){decorations.push({id,x,z,w,h,y});}
  [[-8,-7],[8,-7],[-8,0],[8,0],[-8,7],[8,7],[-5,-10],[5,-10]].forEach((p,i)=>prop(i%3===0?'blossomCut':'treeCut',...p,3.3,4.8));
  [[-6,-3],[6,-3],[-7,5],[7,5],[-5,-8],[5,-8]].forEach(p=>prop('bushCut',...p,2.0,1.2));
  [[-2.5,3],[3,2],[-3,-4],[3.3,-4],[-6,7],[5,7]].forEach(p=>prop('tulipsCut',...p,1.0,1.1));
  prop('signCut',-4,5,1.8,1.32);prop('buntingCut',0,-6.34,6.2,1.44,3.7);
  let yaw=.08,targetYaw=.08,focus=[0,1.25,-2],vp=null,ready=false,cameraZoom=1,drag=null;
  const loaded=Promise.all(jobs).then(()=>{ready=true;canvas.dataset.ready='true';});
  canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,yaw:targetYaw};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(drag)targetYaw=drag.yaw+(e.clientX-drag.x)*.006;});
  canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
  function rotate(amount){targetYaw+=amount;}
  const heightAt=PaperWorld.supportAt,blocked=PaperWorld.blocked;
  function billboard(texture,x,y,z,w,h,flip=false,angle=yaw,tilt=0,squash=1){
    const right=[Math.cos(angle),0,-Math.sin(angle)],verts=[];
    const transform=(u,v)=>{const xx=(u-.5)*w*squash,yy=v*h,rx=xx*Math.cos(tilt)-yy*Math.sin(tilt),ry=xx*Math.sin(tilt)+yy*Math.cos(tilt);return [x+right[0]*rx,y+ry,z+right[2]*rx];};
    const a=transform(0,0),b=transform(1,0),c=transform(1,1),d=transform(0,1),col=[1,1,1,1];
    const u0=flip?1:0,u1=flip?0:1;tri(verts,a,b,c,col,[[u0,0],[u1,0],[u1,1]]);tri(verts,a,c,d,col,[[u0,0],[u1,1],[u0,1]]);draw(verts,texture);
  }
  function project(x,y,z){if(!vp)return {x:0,y:0};const p=[x,y,z,1],clip=[0,0,0,0];for(let r=0;r<4;r++)for(let k=0;k<4;k++)clip[r]+=vp[k*4+r]*p[k];return {x:(clip[0]/clip[3]*.5+.5)*canvas.clientWidth,y:(.5-clip[1]/clip[3]*.5)*canvas.clientHeight};}
  let stats={};
  function render(dt,t,state,positions,player,partner){
    if(!ready)return;
    const width=canvas.clientWidth,height=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);
    if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);gl.viewport(0,0,canvas.width,canvas.height);}
    const pair=state.mode==='flowers'||state.mode==='kiss',p=player?positions[player]:{x:0,z:-2};
    const wanted=pair?[(positions.Bubu.x+positions.Dudu.x)/2,1.5,(positions.Bubu.z+positions.Dudu.z)/2]:[p.x*.40,1.25,p.z*.50-1.7];
    const blend=1-Math.exp(-dt*3);focus=focus.map((v,i)=>v+(wanted[i]-v)*blend);yaw+=(targetYaw-yaw)*blend;
    cameraZoom+=((pair?0.72:1)-cameraZoom)*blend;
    const distance=(width<600?19:21)*cameraZoom,vertical=distance*.32;
    const eye=[focus[0]+Math.sin(yaw)*distance,focus[1]+vertical,focus[2]+Math.cos(yaw)*distance];
    vp=multiply(perspective(Math.PI/4.7,width/height,.1,120),lookAt(eye,focus));gl.uniformMatrix4fv(locations.vp,false,vp);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    drawBuffer(scene);
    // Contact shadows remain on the geometry, independent of sprite orientation.
    const shadow=[];for(const name of ['Bubu','Dudu']){const p=positions[name];disk(shadow,p.x,heightAt(p.x,p.z)+.012,p.z,.70,.30,color('#574532',1,.23));}
    gl.depthMask(false);draw(shadow);gl.depthMask(true);
    for(const o of decorations)billboard(textures.get(o.id),o.x,o.y,o.z,o.w,o.h,false,0);
    billboard(textures.get('butterflyCut'),-3,1.8+(reducedMotion?0:Math.sin(t*2)*.25),1,.6,.53,false,yaw,reducedMotion?0:Math.sin(t*4)*.12);
    stats={};
    for(const name of ['Bubu','Dudu']){
      const p=positions[name];
      const {view,flip,action,frame,key}=PaperAnimation.pose(name,p,positions,state,player,partner,yaw);
      const texture=textures.get(key),bounce=reducedMotion?0:p.moving?Math.abs(Math.sin((p.walkTime||0)*11*Math.PI/4))*.075:Math.sin(t*2)*.018;
      const turn=p.turnT>0?Math.max(.15,Math.abs(Math.cos(p.turnT/.18*Math.PI))):1;
      billboard(texture,p.x,heightAt(p.x,p.z)+bounce-.10,p.z,2.35,2.72,flip,yaw,0,turn);
      stats[name]={view,action,frame,flip,x:+p.x.toFixed(2),z:+p.z.toFixed(2)};
    }
    if(['flowers','ready','kiss','done'].includes(state.mode)&&player){
      const a=positions[player],b=positions[partner];let x=b.x+(a.x<b.x?-.61:.61),z=b.z+.13,y=heightAt(b.x,b.z)+.7;
      if(state.mode==='flowers'){const k=Math.min(1,state.eventT/2.0),smooth=k*k*(3-2*k);x=a.x+(b.x-a.x)*smooth;z=a.z+(b.z-a.z)*smooth+.13;y=heightAt(x,z)+.65+Math.sin(k*Math.PI)*.4;}
      billboard(textures.get('bouquetCut'),x,y,z,.86,1.08,false,yaw,-.1);
    }
    if(state.mode==='kiss'&&player&&!reducedMotion){const a=positions[player],b=positions[partner];for(let i=0;i<5;i++){const k=(state.eventT*.75+i*.19)%1;billboard(textures.get('heart'),(a.x+b.x)/2+Math.sin(i*4)*k*.9,2.3+k*1.5,(a.z+b.z)/2,.28+k*.2,.28+k*.2,false,yaw);}}
    canvas.dataset.poses=JSON.stringify(stats);canvas.dataset.camera=yaw.toFixed(3);
  }
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;canvas.dataset.ready='lost';document.querySelector('#renderStatus').textContent='Se interrumpió la imagen. Recargá para volver al jardín.';document.querySelector('#renderStatus').hidden=false;});
  return {render,loaded,rotate,project,heightAt,blocked,move:PaperWorld.move,get yaw(){return yaw},get stats(){return stats},actorArt};
}
