// NotScape · R3D · PARTÍCULAS DE JUEGO (21 oct 2026; pedido del dueño: «cambia las partículas de todo el juego, la de correr que sea humito bonito (ahora son píxeles), las de trocear un árbol, etc.; que todas queden agradables y satisfactorias»).
// Sustituye al sistema 2D `sp()` de game.js (píxeles cuadrados en el lienzo): ahora son partículas 3D suaves que reciben el óleo/bloom del mundo.
//  · SOFT  = humo/polvo/bruma: puntos con borde irregular y suave, mezcla normal, crecen y se desvanecen, suben y se frenan (humo al correr, polvo del golpe, humo de la forja).
//  · GLOW  = chispas/brasas/destellos: puntos aditivos que brillan (el bloom del grado hace el resto), con gravedad o ascenso (magia, chispas del yunque, gotas de agua).
//  · CHIPS = astillas, esquirlas de roca y hojas: mallas pequeñas INSTANCIADAS que giran, caen, rebotan una vez y se encogen (tala y minería).
// API (`R3D.fx`): `sp(x,y,col,n,vx,vy,g)` = compatibilidad con el `sp()` antiguo (clasifica por color/gravedad); `dust(x,y,col,n)`, `smoke(x,y,h,...)`, `chips(kind,x,y,h,n,col)`, `spark(x,y,h,col,n)`; x,y en px de mundo, h = altura en px (1 unidad 3D ≈ 22,9 px de altura).
// Sin Math.random (hash por contador); colores en LINEAL (THREE.Color); sin PointLight; nada de pow() con base negativa.
import * as THREE from 'three';
import {hash} from './materials3d.js';
import {ppx} from './cinefx3d.js';

const TAU=Math.PI*2,HPX=1/22.9,PXU=1/32;   // px de altura → unidades · px de mundo → unidades
const VS='attribute vec4 aCol;attribute float aSize;attribute float aPh;uniform float uPx;varying vec4 vC;varying float vPh;void main(){vC=aCol;vPh=aPh;gl_PointSize=max(1.,aSize*uPx);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const FS_SOFT='varying vec4 vC;varying float vPh;void main(){vec2 d=gl_PointCoord-.5;float r=length(d)*2.;float a=atan(d.y,d.x);float edge=.92+.07*sin(a*3.+vPh)+.04*sin(a*5.-vPh*1.7);if(r>edge)discard;float f=1.-smoothstep(.3,edge,r);f=f*(1.4-.4*f);gl_FragColor=vec4(vC.rgb,vC.a*f);}';
const FS_GLOW='varying vec4 vC;varying float vPh;void main(){vec2 d=gl_PointCoord-.5;float r=length(d)*2.;if(r>1.)discard;float f=1.-r;f=f*f;float core=1.-smoothstep(0.,.35,r);gl_FragColor=vec4(vC.rgb*(1.+core*1.4),vC.a*(f+core*.6));}';

class Pts{
 constructor(scene,N,additive,order){this.N=N;this.n=0;this.add=additive;
  this.p=new Float32Array(N*3);this.v=new Float32Array(N*3);this.c=new Float32Array(N*4);this.sz=new Float32Array(N);this.ph=new Float32Array(N);
  this.l=new Float32Array(N);this.l0=new Float32Array(N);this.s0=new Float32Array(N);this.s1=new Float32Array(N);this.a0=new Float32Array(N);this.g=new Float32Array(N);this.dr=new Float32Array(N);this.rgb=new Float32Array(N*3);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.p,3));geo.setAttribute('aCol',new THREE.BufferAttribute(this.c,4));geo.setAttribute('aSize',new THREE.BufferAttribute(this.sz,1));geo.setAttribute('aPh',new THREE.BufferAttribute(this.ph,1));
  this.mat=new THREE.ShaderMaterial({vertexShader:VS,fragmentShader:additive?FS_GLOW:FS_SOFT,uniforms:{uPx:{value:10}},transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending});
  this.pts=new THREE.Points(geo,this.mat);this.pts.frustumCulled=false;this.pts.renderOrder=order;scene.add(this.pts)}
 emit(x,y,z,vx,vy,vz,s0,s1,life,col,a0,g,drag,ph){const i=this.n++%this.N;this.p[i*3]=x;this.p[i*3+1]=y;this.p[i*3+2]=z;this.v[i*3]=vx;this.v[i*3+1]=vy;this.v[i*3+2]=vz;this.s0[i]=s0;this.s1[i]=s1;this.l[i]=this.l0[i]=life;this.a0[i]=a0;this.g[i]=g;this.dr[i]=drag;this.ph[i]=ph;this.rgb[i*3]=col.r;this.rgb[i*3+1]=col.g;this.rgb[i*3+2]=col.b}
 update(dt,dim,px){let alive=0;this.mat.uniforms.uPx.value=px;
  for(let i=0;i<this.N;i++){let l=this.l[i];if(l<=0){this.c[i*4+3]=0;this.sz[i]=0;continue}l-=dt;this.l[i]=l;const f=Math.max(0,l)/this.l0[i],u=1-f;alive++;
   const k=Math.max(0,1-this.dr[i]*dt);this.v[i*3]*=k;this.v[i*3+2]*=k;this.v[i*3+1]=this.v[i*3+1]*k-this.g[i]*dt;
   this.p[i*3]+=this.v[i*3]*dt;this.p[i*3+1]+=this.v[i*3+1]*dt;this.p[i*3+2]+=this.v[i*3+2]*dt;
   const e=1-(1-u)*(1-u);this.sz[i]=this.s0[i]+(this.s1[i]-this.s0[i])*e;
   const fade=this.add?f*f:Math.min(1,u*9)*f;   // el humo entra rápido y sale despacio; las chispas se apagan cuadráticamente
   const d=this.add?1:dim;this.c[i*4]=this.rgb[i*3]*d;this.c[i*4+1]=this.rgb[i*3+1]*d;this.c[i*4+2]=this.rgb[i*3+2]*d;this.c[i*4+3]=this.a0[i]*fade}
  this.pts.visible=alive>0;if(alive){const G=this.pts.geometry;G.attributes.position.needsUpdate=G.attributes.aCol.needsUpdate=G.attributes.aSize.needsUpdate=true}}
}

class Chips{
 constructor(scene,N){this.N=N;this.n=0;this.d=new Array(N).fill(null);
  const box=new THREE.BoxGeometry(1,.34,.6),tet=new THREE.TetrahedronGeometry(.8),m=()=>new THREE.MeshBasicMaterial({color:'#ffffff'});
  this.box=new THREE.InstancedMesh(box,m(),N);this.tet=new THREE.InstancedMesh(tet,m(),N);
  [this.box,this.tet].forEach(o=>{o.frustumCulled=false;o.renderOrder=5;o.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(o);for(let i=0;i<N;i++){o.setMatrixAt(i,Z);o.setColorAt(i,new THREE.Color('#fff'))}o.instanceColor.needsUpdate=true})}
 emit(rock,x,y,z,vx,vy,vz,size,life,col,gy,leaf){const i=this.n++%this.N;this.d[i]={rock,x,y,z,vx,vy,vz,s:size,l:life,l0:life,gy,leaf,rx:hash(i,7,1)*TAU,ry:hash(i,8,2)*TAU,rz:hash(i,9,3)*TAU,wx:(hash(i,1,5)-.5)*14,wy:(hash(i,2,6)-.5)*14,wz:(hash(i,3,7)-.5)*14,b:0};const o=rock?this.tet:this.box;o.setColorAt(i,col);o.instanceColor.needsUpdate=true;(rock?this.box:this.tet).setMatrixAt(i,Z)}
 update(dt,dim){const o3=new THREE.Object3D();let any=false;this.box.material.color.setScalar(dim);this.tet.material.color.setScalar(dim);
  for(let i=0;i<this.N;i++){const c=this.d[i];if(!c)continue;c.l-=dt;const M=c.rock?this.tet:this.box;if(c.l<=0){M.setMatrixAt(i,Z);M.instanceMatrix.needsUpdate=true;this.d[i]=null;continue}any=true;
   c.vy-=(c.leaf?2.2:9)*dt;const dr=c.leaf?Math.max(0,1-2.4*dt):1;c.vx*=dr;c.vz*=dr;if(c.leaf)c.vy=Math.max(c.vy,-1.1);c.x+=c.vx*dt;c.y+=c.vy*dt;c.z+=c.vz*dt;
   if(c.y<c.gy+c.s*.3){c.y=c.gy+c.s*.3;if(c.b<1&&!c.leaf){c.vy=-c.vy*.32;c.vx*=.55;c.vz*=.55;c.b++}else{c.vy=0;c.vx*=.6;c.vz*=.6;c.wx*=.7;c.wy*=.7;c.wz*=.7}}
   c.rx+=c.wx*dt;c.ry+=c.wy*dt;c.rz+=c.wz*dt;const f=c.l/c.l0,sc=c.s*Math.min(1,f*4);
   o3.position.set(c.x,c.y,c.z);o3.rotation.set(c.rx,c.ry,c.rz);o3.scale.setScalar(sc);o3.updateMatrix();M.setMatrixAt(i,o3.matrix);M.instanceMatrix.needsUpdate=true}
  this.box.visible=this.tet.visible=any}
}
const Z=new THREE.Matrix4().makeScale(0,0,0);

class Prints{
 constructor(scene,N){this.N=N;this.n=0;this.d=new Array(N).fill(null);const g=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2);
  this.m=new THREE.InstancedMesh(g,new THREE.MeshBasicMaterial({transparent:true,opacity:.55,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),N);this.m.frustumCulled=false;this.m.renderOrder=2;
  this.m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(this.m);for(let i=0;i<N;i++){this.m.setMatrixAt(i,Z);this.m.setColorAt(i,new THREE.Color('#fff'))}this.m.instanceColor.needsUpdate=true}
 add(x,y,z,ry,col){const i=this.n++%this.N;this.d[i]={x,y,z,ry,l:9,l0:9};this.m.setColorAt(i,col);this.m.instanceColor.needsUpdate=true}
 update(dt,dim){const o=new THREE.Object3D();let any=false;this.m.material.color.setScalar(dim);
  for(let i=0;i<this.N;i++){const c=this.d[i];if(!c)continue;c.l-=dt;if(c.l<=0){this.m.setMatrixAt(i,Z);this.d[i]=null;this.m.instanceMatrix.needsUpdate=true;continue}any=true;
   const k=Math.min(1,c.l/2.2);o.position.set(c.x,c.y+.02,c.z);o.rotation.set(0,c.ry,0);o.scale.set(.1*k,1,.2*k);o.updateMatrix();this.m.setMatrixAt(i,o.matrix);this.m.instanceMatrix.needsUpdate=true}
  this.m.visible=any}
}
export class FX{
 constructor(scene,W3){this.W3=W3;this.k=0;this.soft=new Pts(scene,640,false,4);this.glow=new Pts(scene,640,true,6);this.chip=new Chips(scene,260);this.prints=new Prints(scene,140);this.night=0;this.at=0}
 h(a,b){return hash(this.k++,a,b)}
 pos(x,y,hpx){return this.W3(x,y,TER.standZ(x,y)).setY(this.W3(x,y,TER.standZ(x,y)).y+(hpx||0)*HPX)}
 // humo/polvo: n bocanadas que suben, crecen y se desvanecen. `col` = color base (se aclara un poco al envejecer)
 smoke(x,y,hpx,col,n=1,o={}){const p=this.pos(x,y,hpx),c=new THREE.Color(col),sz=(o.size||.2)*1.9,gr=o.grow||2.4,life=o.life||.8,up=o.up==null?.45:o.up,sp=o.spread==null?.25:o.spread,al=o.alpha==null?.6:o.alpha;
  for(let i=0;i<n;i++){const a=this.h(1,2)*TAU,r=this.h(2,3)*sp;this.soft.emit(p.x+Math.cos(a)*r*.3,p.y,p.z+Math.sin(a)*r*.3,Math.cos(a)*r,up*(.7+this.h(3,4)*.6),Math.sin(a)*r,sz*(.7+this.h(4,5)*.5),sz*gr*(.8+this.h(5,6)*.5),life*(.75+this.h(6,7)*.5),c,al,0,1.4,this.h(7,8)*TAU)}}
 // polvo de los pies (correr/andar): bocanadas bajas y pardas que se quedan atrás
 dust(x,y,col,n=1,run=0){this.smoke(x,y,2,col,n,{size:run?.17:.12,grow:run?3.2:2.4,life:run?.7:.5,up:.28,spread:run?.5:.28,alpha:run?.75:.55})}
 // chispas/brasas/destellos aditivos
 spark(x,y,hpx,col,n=6,o={}){const p=this.pos(x,y,hpx),c=new THREE.Color(col),sp=o.spread||1.6,up=o.up==null?1.4:o.up,g=o.g==null?4.5:o.g,sz=o.size||.1,life=o.life||.55;
  for(let i=0;i<n;i++){const a=this.h(8,9)*TAU,r=sp*(.3+this.h(9,10)*.7);this.glow.emit(p.x,p.y,p.z,Math.cos(a)*r,up*(.4+this.h(10,11)*.9),Math.sin(a)*r,sz*(.7+this.h(11,12)*.6),sz*.25,life*(.7+this.h(12,13)*.6),c,.95,g,.6,this.h(13,14)*TAU)}}
 // astillas / esquirlas / hojas: mallas pequeñas que saltan, giran, rebotan y se encogen
 chips(kind,x,y,hpx,n,col,o={}){const p=this.pos(x,y,hpx),gy=this.W3(x,y,TER.standZ(x,y)).y,c0=new THREE.Color(col),rock=kind==='rock',leaf=kind==='leaf',sp=o.spread||(leaf?1:1.7),up=o.up==null?(leaf?1.3:2.6):o.up;
  for(let i=0;i<n;i++){const a=this.h(14,15)*TAU,r=sp*(.25+this.h(15,16)*.75),c=c0.clone().multiplyScalar(.75+this.h(16,17)*.5);
   this.chip.emit(rock,p.x,p.y,p.z,Math.cos(a)*r,up*(.45+this.h(17,18)*.8),Math.sin(a)*r,(leaf?.11:rock?.09:.08)*(.7+this.h(18,19)*.7)*(o.size||1),(leaf?1.9:1.1)*(.8+this.h(19,20)*.5),c,gy,leaf)}}
 // compatibilidad con el sp() 2D de game.js: sp(x,y,color,n,vx,vy,g). Clasifica por color y por signo de la gravedad (g<0 = sube).
 sp(x,y,col,n,vx,vy,g){const yg=y+14,c=String(col).toLowerCase(),rise=g<0,cnt=Math.min(40,n||1),spread=Math.max(.3,(vx||60)/60);
  if(c==='#5ab04a'){this.chips('leaf',x,yg,26,cnt*3,'#6fb24a',{spread:1.1});this.chips('wood',x,yg,14,cnt,'#8a6a42',{spread:1.4});return}
  if(c==='#ffd27a'){this.chips('rock',x,yg,12,cnt*2,'#8a8478');this.spark(x,yg,12,'#ffd27a',cnt,{spread:1.3,g:6});this.smoke(x,yg,8,'#a89a80',1,{size:.2,life:.7,alpha:.3});return}
  if(c==='#ff9a2a'){this.spark(x,yg,10,'#ff9a2a',cnt*2,{spread:1.9,up:2,g:6.5,size:.09});return}
  if(c==='#cfe8ff'){this.spark(x,yg,4,'#cfe8ff',cnt*2,{spread:.9,up:2.2,g:7,size:.07,life:.5});return}
  if(c==='#aaa'||c==='#9a9a9a'||c==='#aaaaaa'){this.smoke(x,yg,rise?14:6,'#9a968e',cnt,{size:.16,grow:3,life:1.1,up:.5,alpha:.34});return}
  if(c==='#d8c9a3'){this.smoke(x,yg,8,'#d8c9a3',cnt*2,{size:.13,life:.6,up:.3,alpha:.35});this.chips('wood',x,yg,10,cnt,'#c9b48a');return}
  if(rise){this.spark(x,yg,10,col,cnt,{spread:spread*.5,up:.9,g:-.5,size:.1,life:.9});return}
  this.spark(x,yg,14,col,cnt,{spread:spread*1.2,up:Math.max(.8,(vy||60)/45),g:5,size:.1,life:.6})}
 // huella en nieve/arena/barro: óvalo oscuro que se desvanece (encoge) en ~9 s; pies alternos (left = 0/1)
 print(x,y,dx,dy,left,kind){const p=this.W3(x,y,TER.standZ(x,y)),l=Math.hypot(dx,dy)||1,nx=-dy/l,nz=dx/l,s=left?.1:-.1,col=new THREE.Color(kind==='snow'?'#8ea4bb':kind==='sand'?'#a08858':'#43362a');
  this.prints.add(p.x+nx*s,p.y,p.z+nz*s,Math.atan2(dx,dy),col)}
 // viento de arena (Desierto) y brisa marina (Costa): bocanadas bajas que cruzan la pantalla
 ambient(x,y,biome,dt){this.at-=dt;if(this.at>0)return;
  if(biome===7){this.at=.14;const p=this.W3(x,y,TER.standZ(x,y)),a=this.h(30,31)*TAU,r=2+this.h(31,32)*6;this.soft.emit(p.x+Math.cos(a)*r-3,p.y+.15+this.h(32,33)*.5,p.z+Math.sin(a)*r,3.2+this.h(33,34)*1.5,.05,.4,.3,1.1,1.6,new THREE.Color('#d8c090'),.22,0,.2,this.h(34,35)*TAU)}
  else if(biome===3){this.at=.25;const p=this.W3(x,y,TER.standZ(x,y)),a=this.h(36,37)*TAU,r=2+this.h(37,38)*6;this.soft.emit(p.x+Math.cos(a)*r-3,p.y+.2+this.h(38,39)*.8,p.z+Math.sin(a)*r,2.4,.02,.2,.25,.8,1.8,new THREE.Color('#e8f0f8'),.2,0,.2,this.h(39,40)*TAU)}
  else this.at=.5}
 update(t,dt,night,pr){const dim=1-.6*(night||0),px=ppx(1)*(pr||1);this.night=night||0;this.soft.update(dt,dim,px);this.glow.update(dt,1,px);this.chip.update(dt,dim);this.prints.update(dt,dim)}
}
