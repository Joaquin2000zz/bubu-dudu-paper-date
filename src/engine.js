import { PaperCharacters } from './characters.js';
import { PaperAnimation } from './animation.js';
/* Native WebGL scene: polygonal architecture, perspective camera and animated 2D actors. */
export function createPaperEngine(canvas, symbols, reducedMotion, PaperWorld) {
  const events = new AbortController(); let disposed=false; const buffers=[]; const shaders=[];
  const gl = canvas.getContext('webgl', {alpha:true,antialias:true,preserveDrawingBuffer:true});
  if (!gl) throw new Error('Este navegador no pudo iniciar WebGL. Activá la aceleración gráfica para jugar.');
  const vertex = `attribute vec3 aPosition;attribute vec2 aUV;attribute vec4 aColor;
    uniform mat4 uVP;varying vec2 vUV;varying vec4 vColor;
    void main(){vUV=aUV;vColor=aColor;gl_Position=uVP*vec4(aPosition,1.0);}`;
  const fragment = `precision mediump float;uniform sampler2D uTexture;varying vec2 vUV;varying vec4 vColor;
    void main(){vec4 c=texture2D(uTexture,vUV)*vColor;if(c.a<0.08)discard;gl_FragColor=c;}`;
  function shader(type,source){const s=gl.createShader(type);shaders.push(s);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
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
  function makeBuffer(data){const b=gl.createBuffer();buffers.push(b);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return {buffer:b,count:data.length/9};}
  const dynamic=gl.createBuffer();buffers.push(dynamic);
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
  const gardenScene=makeBuffer(geometry);
  // The first two chapters use raised paper platforms. They share the same
  // 3D camera and billboard actors as the garden, but have their own geometry.
  const levelScenes=new Map();
  for(const chapter of Object.values(PaperWorld.levels).filter(level=>level.kind==='platform')){
    const id=chapter.id,dark=chapter.theme==='night';
    const levelGeometry=[];
    for(const f of chapter.floors)box(levelGeometry,f.x,f.y,f.z,f.w,f.h,f.d,f.color);
    // Deep water is scenery only; the stepping stones are the only collision floors.
    box(levelGeometry,0,-2.2,0,22,.12,24,dark?'#17273c':'#4f6974');
    for(const f of chapter.floors){
      box(levelGeometry,f.x,-1.65,f.z,f.w*.83,1.5,f.d*.85,dark?'#354258':'#626f73');
      box(levelGeometry,f.x,f.top+.006,f.z,f.w-.15,.025,.10,dark?'#a2b0b9':'#ccd0b2');
      for(let n=0;n<5;n++)box(levelGeometry,f.x-f.w/2+.2+n*.5,f.top+.01,f.z+.3,.23,.015,.05,dark?'#83909c':'#b2b99d');
      for(let n=0;n<9;n++){
        const xx=f.x-f.w/2+.22+(n*1.73%1)*(f.w-.44),zz=f.z-f.d/2+.15+(n*.37%1)*(f.d-.3);
        disk(levelGeometry,xx,f.top+.032,zz,.06,.09,color(dark?'#8b9aa7':'#bec29c'),5);
      }
      for(let n=0;n<3;n++)box(levelGeometry,f.x,-.25-n*.34,f.z,f.w-.06,.035,f.d-.06,dark?'#536076':'#7a867f');
      const lx=f.x-f.w/2+.12,lz=f.z-.5;
      box(levelGeometry,lx,f.top,lz,.08,.85,.08,'#454453');
      box(levelGeometry,lx,f.top+.72,lz,.24,.26,.24,dark?'#d2bf86':'#f4d39a');
      box(levelGeometry,lx,f.top+1,lz,.34,.08,.34,'#424654');
    }
    for(const o of chapter.obstacles){box(levelGeometry,o.x,o.y,o.z,o.w,o.h,o.d,o.color);box(levelGeometry,o.x,o.y+o.h,o.z,o.w+.1,.06,o.d+.1,'#a3a09a');}
    for(const h of chapter.hazards){for(let i=0;i<5;i++){const z=h.z-h.d/2+i*h.d/4;const x=h.x,y=.17;for(const [a,b] of [[[-.14,-.12],[.14,-.12]],[[.14,-.12],[.14,.12]],[[.14,.12],[-.14,.12]],[[-.14,.12],[-.14,-.12]]])tri(levelGeometry,[x+a[0],y,z+a[1]],[x+b[0],y,z+b[1]],[x,y+.48,z],color('#958399'));}}
    // Broken stone arches and layered cliffs surround, rather than hide, the route.
    for(const side of [-1,1])for(let i=0;i<7;i++){
      const x=side*(7.3+(i%2)*.8),z=8-i*2.8;
      box(levelGeometry,x,-1.8,z,1.4,1.6+(i%3)*.4,2,dark?'#29364c':'#596771');
      if(i%3===0){box(levelGeometry,x,.1,z,.35,2.1,.38,dark?'#566075':'#929391');box(levelGeometry,x+side*.4,2,z,.95,.25,.5,dark?'#626d80':'#a5a293');}
    }
    const g=chapter.goal;
    for(const side of [-1,1])box(levelGeometry,g.x+side*1.1,.15,g.z,.23,2.8,.3,dark?'#8b9f9e':'#c6baa0');
    box(levelGeometry,g.x,2.95,g.z,2.5,.23,.4,dark?'#a6b6ac':'#e5cda5');
    levelScenes.set(id,makeBuffer(levelGeometry));
  }

  const textures=new Map(), jobs=[];
  function svgTexture(key,body,view='0 0 260 300',outline=true){
    const tex=gl.createTexture();textures.set(key,tex);gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));
    const size=view.split(' ').map(Number),w=384,h=Math.round(384*size[3]/size[2]);
    const filter=outline?'<defs><filter id="edge" x="-15%" y="-15%" width="130%" height="130%"><feMorphology in="SourceAlpha" operator="dilate" radius="3" result="outline"/><feFlood flood-color="#fff8e5"/><feComposite in2="outline" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>':'';
    const source=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${view}">${filter}<g ${outline?'filter="url(#edge)"':''}>${body}</g></svg>`;
    jobs.push(new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{if(disposed){resolve();return;}gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);resolve();};image.onerror=()=>reject(Error('No se pudo cargar el dibujo '+key));image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(source);}));
  }
  for(const id of ['treeCut','blossomCut','bushCut','tulipsCut','buntingCut','butterflyCut','bouquetCut','signCut','hostileCut']){const symbol=symbols.querySelector('#'+id);svgTexture(id,symbol.innerHTML,symbol.getAttribute('viewBox'));}

  // Distinct front/profile/back drawings, not a mirrored front. Limb positions are
  // authored per frame; the identity palette and facial proportions remain fixed.
  const actorArt=PaperCharacters.svg;
  for(const name of ['Bubu','Dudu']){
    for(const view of ['front','side','back']){svgTexture(`${name}:${view}:idle:0`,actorArt(name,view));for(let f=0;f<8;f++)svgTexture(`${name}:${view}:walk:${f}`,actorArt(name,view,'walk',f));}
    for(const mood of ['crying','sad','happy'])for(const view of ['front','side','back']){
      for(let f=0;f<4;f++)svgTexture(`${name}:${view}:idle:${f}:${mood}`,actorArt(name,view,'idle',f,mood));
      for(let f=0;f<8;f++)svgTexture(`${name}:${view}:walk:${f}:${mood}`,actorArt(name,view,'walk',f,mood));
    }
    for(const action of ['give','receive','kiss'])for(let f=0;f<4;f++)svgTexture(`${name}:side:${action}:${f}`,actorArt(name,'side',action,f));
    svgTexture(`${name}:front:happy:0`,actorArt(name,'front','happy'));
  }
  svgTexture('heart','<path d="M50 85C-18 38 15 0 50 29C85 0 118 38 50 85Z" fill="#dd7388" stroke="#914e60" stroke-width="4"/>','-5 -5 110 105');

  svgTexture('warden','<path d="M24 77L12 22 43 38Q70 17 96 38L125 19 113 74Q137 115 115 137Q67 161 22 135Q4 112 24 77Z" fill="#686079" stroke="#d5bac5" stroke-width="4"/><path d="M36 67L57 77M99 67L78 77" stroke="#261f39" stroke-width="7"/><path d="M51 111Q69 94 87 111" fill="none" stroke="#29283f" stroke-width="5"/><ellipse cx="42" cy="87" rx="6" ry="8" fill="#f0bf89"/><ellipse cx="93" cy="87" rx="6" ry="8" fill="#f0bf89"/>','0 0 140 165',false);
  svgTexture('deadTree','<path d="M112 290L126 175 76 131 38 61 54 52 96 110 126 123 116 36 133 10 147 97 184 57 213 48 193 78 148 133 155 190 202 150 230 144 204 175 154 222 152 290Z" fill="#414659" stroke="#8894a3" stroke-width="4"/><path d="M130 276L139 159M137 139L128 61" stroke="#a2a3a5" stroke-width="3"/>','0 0 260 300',false);
  svgTexture('dawnTree','<path d="M112 290L126 175 76 131 38 61 54 52 96 110 126 123 116 36 133 10 147 97 184 57 213 48 193 78 148 133 155 190 202 150 230 144 204 175 154 222 152 290Z" fill="#686477" stroke="#aaa1a7" stroke-width="4"/><path d="M65 97Q15 44 65 43Q96 57 65 97M175 96Q159 38 207 35Q231 63 175 96M192 178Q177 126 230 124Q248 156 192 178" fill="#8b9c92" stroke="#bbc5ac" stroke-width="4"/>','0 0 260 300',false);
  const decorations=[];
  function prop(id,x,z,w,h,y=0){decorations.push({id,x,z,w,h,y});}
  [[-8,-7],[8,-7],[-8,0],[8,0],[-8,7],[8,7],[-5,-10],[5,-10]].forEach((p,i)=>prop(i%3===0?'blossomCut':'treeCut',...p,3.3,4.8));
  [[-6,-3],[6,-3],[-7,5],[7,5],[-5,-8],[5,-8]].forEach(p=>prop('bushCut',...p,2.0,1.2));
  [[-2.5,3],[3,2],[-3,-4],[3.3,-4],[-6,7],[5,7]].forEach(p=>prop('tulipsCut',...p,1.0,1.1));
  prop('signCut',-4,5,1.8,1.32);prop('buntingCut',0,-6.34,6.2,1.44,3.7);
  let yaw=.08,targetYaw=.08,focus=[0,1.25,-2],vp=null,ready=false,cameraZoom=1,drag=null;
  const loaded=Promise.all(jobs).then(()=>{if(!disposed){ready=true;canvas.dataset.ready='true';}});
  canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,yaw:targetYaw};canvas.setPointerCapture(e.pointerId);},{signal:events.signal});
  canvas.addEventListener('pointermove',e=>{if(drag)targetYaw=drag.yaw+(e.clientX-drag.x)*.006;},{signal:events.signal});
  canvas.addEventListener('pointerup',()=>drag=null,{signal:events.signal});canvas.addEventListener('pointercancel',()=>drag=null,{signal:events.signal});
  function rotate(amount){targetYaw+=amount;}
  const heightAt=(x,z)=>PaperWorld.supportAt(x,z),blocked=(x,z)=>PaperWorld.blocked(x,z);
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
    const chapter=PaperWorld.level(),garden=state.mode==='menu'||chapter.kind==='garden',platformChapter=!garden;
    const wanted=platformChapter?[p.x*.65,.6,p.z*.6-1.5]:pair?[(positions.Bubu.x+positions.Dudu.x)/2,1.5,(positions.Bubu.z+positions.Dudu.z)/2]:[p.x*.40,1.25,p.z*.50-1.7];
    const blend=1-Math.exp(-dt*3);focus=focus.map((v,i)=>v+(wanted[i]-v)*blend);yaw+=(targetYaw-yaw)*blend;
    cameraZoom+=((pair?0.72:1)-cameraZoom)*blend;
    const distance=(platformChapter?(width<600?23:22):(width<600?19:21))*cameraZoom,vertical=distance*(platformChapter?.43:.32);
    const eye=[focus[0]+Math.sin(yaw)*distance,focus[1]+vertical,focus[2]+Math.cos(yaw)*distance];
    vp=multiply(perspective(Math.PI/4.7,width/height,.1,120),lookAt(eye,focus));gl.uniformMatrix4fv(locations.vp,false,vp);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const level=chapter.id,scene=garden?gardenScene:levelScenes.get(level);
    drawBuffer(scene);
    // Contact shadows remain on the geometry, independent of sprite orientation.
    const actorNames=garden?['Bubu','Dudu']:(player?[player]:[]);
    const shadow=[];for(const name of actorNames){const p=positions[name];if(!Number.isFinite(heightAt(p.x,p.z)))continue;disk(shadow,p.x,heightAt(p.x,p.z)+.012,p.z,.70,.30,color('#574532',1,.23));}
    gl.depthMask(false);draw(shadow);gl.depthMask(true);
    if(garden){for(const o of decorations)billboard(textures.get(o.id),o.x,o.y,o.z,o.w,o.h,false,0);billboard(textures.get('butterflyCut'),-3,1.8+(reducedMotion?0:Math.sin(t*2)*.25),1,.6,.53,false,yaw,reducedMotion?0:Math.sin(t*4)*.12);}
    else {
      const chapter=PaperWorld.level(level),goal=chapter.goal;
      for(const side of [-1,1])for(let i=0;i<8;i++)billboard(textures.get(chapter.theme==='night'?'deadTree':'dawnTree'),side*(6.8+(i%2)*1.2),-.1,8-i*2.6,2.5,3.2+(i%3)*.5,false,yaw);
      billboard(textures.get('signCut'),goal.x,1.05,goal.z,1.45,1.05,false,yaw);
      for(const m of (state.mobs||[])){const bob=reducedMotion?0:Math.sin(t*(m.mode==='windup'?22:5)+m.phase)*.07;const warning=[];if(m.mode==='windup'||m.mode==='stunned'){disk(warning,m.x,heightAt(m.x,m.z)+.03,m.z,m.mode==='windup'?1.1:.55,.45,color(m.mode==='windup'?'#ef8972':'#e8cf8c',1,.7));draw(warning);}billboard(textures.get('warden'),m.x,heightAt(m.x,m.z)+.06+bob,m.z,1.08,m.mode==='stunned'?.38:1.02,m.flip,yaw);}
      for(const flower of chapter.flowers)if(!(state.collected||[]).includes(flower.id))billboard(textures.get('bouquetCut'),flower.x,heightAt(flower.x,flower.z)+.08,flower.z,.62,.82,false,yaw,-.08);
    }
    stats={};
    if(pair)gl.disable(gl.DEPTH_TEST);
    for(const name of actorNames){
      const p=positions[name];
      const {view,flip,action,frame,key}=PaperAnimation.pose(name,p,positions,state,player,partner,yaw);
      const mood=state.mode==='menu'?'calm':PaperCharacters.emotion(chapter.theme==='joy'?3:chapter.theme==='dawn'?2:1,state.flowers||0);const emotionalKey=action==='idle'&&mood!=='calm'?`${name}:${view}:idle:${reducedMotion?0:Math.floor(t*5)%4}:${mood}`:action==='walk'&&mood!=='calm'?`${key}:${mood}`:key;
      const texture=textures.get(emotionalKey)||textures.get(key),bounce=reducedMotion?0:p.moving?Math.abs(Math.sin((p.walkTime||0)*11*Math.PI/4))*.075:Math.sin(t*2)*.018;
      const turn=p.turnT>0?Math.max(.15,Math.abs(Math.cos(p.turnT/.18*Math.PI))):1;
      const renderedY=((p.jumpY||0)>0?(p.jumpBase??.15):heightAt(p.x,p.z))+(p.jumpY||0)+bounce-.10;
      billboard(texture,p.x,renderedY,p.z,2.35,2.72,flip,yaw,0,turn);
      stats[name]={view,action,frame,flip,emotion:mood,y:renderedY,x:+p.x.toFixed(2),z:+p.z.toFixed(2)};
    }
    if(pair)gl.enable(gl.DEPTH_TEST);
    if(['flowers','ready','kiss','done'].includes(state.mode)&&player){
      const a=positions[player],b=positions[partner],right={x:Math.cos(yaw),z:-Math.sin(yaw)};
      const k=state.mode==='flowers'?Math.max(0,Math.min(1,(state.eventT-.55)/1.6)):1,smooth=k*k*(3-2*k);
      const ax=a.x+right.x*.77,az=a.z+right.z*.77,bx=b.x+right.x*(state.mode==='kiss'?.25:-.72),bz=b.z+right.z*(state.mode==='kiss'?.25:-.72);
      const x=ax+(bx-ax)*smooth,z=az+(bz-az)*smooth;
      const y=heightAt(x,z)+.35+Math.sin(k*Math.PI)*.10;
      // Hands and bouquet remain in the foreground of the profiles.
      gl.disable(gl.DEPTH_TEST);billboard(textures.get('bouquetCut'),x,y,z,.60,.72,false,yaw,-.1);gl.enable(gl.DEPTH_TEST);
    }
    if(garden&&state.flowers>state.gifted){
      const spots=state.giftSpots||[];for(let i=state.gifted;i<Math.min(spots.length,state.flowers);i++){const spot=spots[i];billboard(textures.get('bouquetCut'),spot.x,heightAt(spot.x,spot.z)+.08,spot.z,.62,.82,false,yaw,-.08);}
    }
    if(state.mode==='kiss'&&player&&!reducedMotion){const a=positions[player],b=positions[partner];for(let i=0;i<5;i++){const k=(state.eventT*.75+i*.19)%1;billboard(textures.get('heart'),(a.x+b.x)/2+Math.sin(i*4)*k*.9,2.3+k*1.5,(a.z+b.z)/2,.28+k*.2,.28+k*.2,false,yaw);}}
    canvas.dataset.poses=JSON.stringify(stats);canvas.dataset.camera=yaw.toFixed(3);
  }
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;canvas.dataset.ready='lost';document.querySelector('#renderStatus').textContent='Se interrumpió la imagen. Recargá para volver al jardín.';document.querySelector('#renderStatus').hidden=false;},{signal:events.signal});
  function dispose(){disposed=true;ready=false;events.abort();for(const buffer of buffers)gl.deleteBuffer(buffer);for(const texture of textures.values())gl.deleteTexture(texture);gl.deleteTexture(white);for(const shader of shaders)gl.deleteShader(shader);gl.deleteProgram(program);}
  return {render,loaded,rotate,project,dispose,get yaw(){return yaw},get stats(){return stats},actorArt};
}
