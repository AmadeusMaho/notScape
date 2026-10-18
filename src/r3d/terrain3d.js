// NotScape · R3D · F1 · TERRENO 3D por chunks (guía 3D §4.4, §4.7) + pradera (§4.4).
// Lee las alturas de TER (las MISMAS que deciden la colisión: agua .75, suelo 1, montículos 1.3/1.6, acantilado 2, vacío 0) → nunca se ve pared donde se pisa.
// Unidades: 1 tile (32 px) = 1 unidad; x3 = wx/32, z3 = wy/32; y = (nivel − 1)·0.6415 (guía §3).
// Cada chunk = 16×16 tiles: (1) tapa con relieve suave (llano y montículos interpolados como TER.standZ, cuenca bajo el agua) y COLOR por vértice del
// campo de color GC compartido con el pasto + tierra en caminos, adoquines, arena y lecho; (2) bloques de acantilado con tapa de roca y musgo;
// (3) paredes por ESTRATOS irregulares (labio verde, tierra, roca, base) donde un tile da a otro más bajo y corte de diorama hacia el vacío;
// (4) lámina de agua simple (F1; la refracción es F3); (5) pradera instanciada (solo en los chunks cercanos, densidad por calidad).
// Todo determinista (hash). Se construye como mucho BUDGET chunks por fotograma y se liberan los lejanos (LRU).
import * as THREE from 'three';
import {toon,hash,vn2,fb2,G} from './materials3d.js';

const CS=16,SUB=4,SUBC=12,LVY=.6415,BED=-.44,WY=(.75-1)*LVY,BUDGET=2,MAXC=70;
// colores del campo por bioma (guía §4.4/§4.8: Pradera = la de la referencia; el resto, puntos de partida de F5)
const GCOLS=[['#41582c','#5e7a38','#8c9a46'],['#2c4426','#456a34','#6f8a3e'],['#3c4a2a','#5a6a32','#7e8440'],['#5a6a6e','#7e9094','#aab8b4'],['#4a5a2e','#6a8a3a','#9aa44a'],['#6a4a2a','#8a6430','#b08a46']];
const strat=(y,x,z,c)=>{const w=vn2(x*2.3+z*1.7,y*3.)-.5,w2=vn2(x*7.1+z*5.3+9,y*9.)-.5,d=-y+w*.22+w2*.06;
 c.set(d<.07?'#3c5229':d<.13?'#33402a':d<.4?'#3b2b2e':d<.66?'#4f4a56':d<.74?'#3a2a2c':'#2a1f24');return c.multiplyScalar(.9+(vn2(x*11+z*13,y*17)-.5)*.25)};
const STR_L=[0,-.04,-.1,-.18,-.27,-.36,-.45,-.55,-.65,-.75,-.88,-1.05];

export class Terrain{
 constructor(scene,o={}){this.scene=scene;this.grp=new THREE.Group();this.grp.name='terreno3d';scene.add(this.grp);this.ch=new Map();this.q=o.grass??1;this.tick=0;
  this.NX=TER.NX;this.NY=TER.NY;this.H=new Float32Array(this.NX*this.NY).fill(-1);this.F=TER.fields();
  this.matTop=toon('#ffffff',{vc:1,ground:1});this.matWall=toon('#ffffff',{vc:1,side:THREE.DoubleSide,tex:'piedra',texS:9,texB:.7});this.matRock=toon('#ffffff',{vc:1,mossUp:.5,tex:'piedra',texS:7,texB:.6});
  this.matGrass=toon('#ffffff',{meadow:1,gv:1,side:THREE.DoubleSide});this.tuft=tuftGeo(7,3,1);this.tuftLite=tuftGeo(4,2,1.4);this.lodR=9;this.water=waterMat()}
 h(tx,ty){if(tx<0||ty<0||tx>=this.NX||ty>=this.NY)return 0;const i=ty*this.NX+tx;let v=this.H[i];if(v<0)v=this.H[i]=TER.heightAt((tx+.5)*32,(ty+.5)*32);return v}
 land(h){return h>=1&&h<2}
 gc(x,z,k){const C=GCOLS[k]||GCOLS[0],n=Math.min(1,Math.max(0,(fb2(x*.42,z*.42)-.28)/.5)),c=new THREE.Color();
  return n<.5?c.set(C[0]).lerp(new THREE.Color(C[1]),n*2):c.set(C[1]).lerp(new THREE.Color(C[2]),(n-.5)*2)}
 // altura de la tapa en un punto continuo (coordenadas de tile): llano bilineal entre centros pisables + cuenca del agua
 // máscara de agua suavizada (5 muestras): la orilla deja de seguir la escalera de tiles
 field(x,z){const f0=this.field1(x,z),o=.42;let w=f0.w*2;for(const[dx,dz]of[[o,0],[-o,0],[0,o],[0,-o]])w+=this.field1(x+dx,z+dz).w;w/=6;
  const s=Math.min(1,Math.max(0,(w-.3)/.4)),e=s*s*(3-2*s);return{y:f0.yl+(BED-f0.yl)*e,w}}
 field1(x,z){const u=x-.5,v=z-.5,i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j;let hl=0,wl=0,ww=0,hw=0;
  for(const[di,dj,w]of[[0,0,(1-a)*(1-b)],[1,0,a*(1-b)],[0,1,(1-a)*b],[1,1,a*b]]){const h=this.h(i+di,j+dj);if(this.land(h)){hl+=h*w;wl+=w}else if(h===.75){ww+=w}}
  const yl=wl>1e-4?(hl/wl-1)*LVY:0;return{yl,w:ww}}
 pathAt(x,z){const F=this.F;if(!F||!F.PF)return[0,0];const SG=F.SG,FW=this.NX*SG,i=Math.floor(x*SG),j=Math.floor(z*SG);if(i<0||j<0||i>=FW||j>=this.NY*SG)return[0,0];return[F.PF[j*FW+i]||0,F.PC[j*FW+i]||0]}
 update(cx,cz,rTiles,force){const T0=performance.now(),c0=Math.floor((cx-rTiles)/CS),c1=Math.floor((cx+rTiles)/CS),r0=Math.floor((cz-rTiles)/CS),r1=Math.floor((cz+rTiles)/CS);this.tick++;let built=0;
  const want=[];for(let j=r0;j<=r1;j++)for(let i=c0;i<=c1;i++){if(i<0||j<0||i*CS>=this.NX||j*CS>=this.NY)continue;const d=Math.hypot((i+.5)*CS-cx,(j+.5)*CS-cz);want.push([d,i,j])}
  want.sort((a,b)=>a[0]-b[0]);
  // trabajo repartido: lo más cercano que falta (chunk de suelo o su pradera) se construye por trozos (generador) con ~2,5 ms por fotograma; `force` (precarga) lo hace todo de golpe
  const T1=performance.now(),needs=[];
  for(const[d,i,j]of want){const k=i+','+j;let c=this.ch.get(k);
   if(!c){if(force){c=this.build(i,j);this.ch.set(k,c);built++}else{needs.push({k,kind:0,i,j});continue}}
   c.seen=this.tick;
   if(d<CS*1.6&&!c.grass&&this.q>0){if(force){c.grass=this.meadow(i,j);if(c.grass)c.g.add(c.grass);built++}else needs.push({k,kind:1,i,j})}}
  if(!force&&needs.length){let jb=this.job&&needs.some(n=>n.k===this.job.k&&n.kind===this.job.kind)?this.job:null;
   if(!jb){const n=needs[0];jb=this.job={k:n.k,kind:n.kind,it:n.kind?this.meadowG(n.i,n.j):this.buildG(n.i,n.j)}}
   let r;do{r=jb.it.next()}while(!r.done&&performance.now()-T1<2.5);
   if(r.done){this.job=null;built++;if(jb.kind===0)this.ch.set(jb.k,Object.assign(r.value,{seen:this.tick}));else{const c=this.ch.get(jb.k);if(c&&r.value){c.grass=r.value;c.g.add(r.value)}}}}
  else if(!needs.length)this.job=null;
  if(this.ch.size>MAXC){[...this.ch.entries()].sort((a,b)=>a[1].seen-b[1].seen).slice(0,this.ch.size-MAXC).forEach(([k,c])=>{this.freeGrass(c);this.grp.remove(c.g);c.g.traverse(o=>{if(o.geometry)o.geometry.dispose()});this.ch.delete(k)})}
  return built}
 pending(cx,cz,r){let n=0;const c0=Math.floor((cx-r)/CS),c1=Math.floor((cx+r)/CS),r0=Math.floor((cz-r)/CS),r1=Math.floor((cz+r)/CS);for(let j=r0;j<=r1;j++)for(let i=c0;i<=c1;i++)if(i>=0&&j>=0&&i*CS<this.NX&&j*CS<this.NY&&!this.ch.has(i+','+j))n++;return n}
 // build es un GENERADOR: cede el control tras cada fila de tiles (16 por chunk) para que update() lo reparta en trocitos de ~2,5 ms por fotograma
 // (antes un chunk entero eran ~34 ms de golpe = tirón cada vez que se entraba en una zona nueva, lo que se sentía como «cargando» al correr).
 build(ci,cj){const it=this.buildG(ci,cj);let r;while(!(r=it.next()).done);return r.value}
 *buildG(ci,cj){const g=new THREE.Group(),x0=ci*CS,z0=cj*CS,x1=Math.min(this.NX,x0+CS),z1=Math.min(this.NY,z0+CS),col=new THREE.Color(),c2=new THREE.Color();
  // ── tapa ── rejilla SUB×SUB por tile; solo en tiles no vacíos y no acantilado
  const P=[],C=[],WP=[],WD=[],PA=[],PB=[];const VC=new Map();   // R3D-OPT: caché de vértices (cada esquina se calculaba 6 veces); rejilla común de 12 por tile (SUB=4 y SUBC=12 encajan)
  const top=(x,z)=>{const kk=Math.round(x*12)*4096+Math.round(z*12);let r=VC.get(kk);if(!r){r=top0(x,z);VC.set(kk,r)}return r};
  const top0=(x,z)=>{const f=this.field(x,z),tx=Math.min(this.NX-1,Math.floor(x)),tz=Math.min(this.NY-1,Math.floor(z)),k=TER.biomeOf?TER.biomeOf(tx,tz):0;
   col.copy(this.gc(x,z,k)).multiplyScalar(.82);
   const [pf,pc]=this.pathAt(x,z);if(pf>.25)col.lerp(c2.set('#5e4a32'),Math.min(.35,(pf-.25)*.6));   // la tierra y los adoquines los pinta el shader (GROUND_*); aquí solo se oscurece un poco el pasto bajo el camino
   if(TER.sandAt&&TER.sandAt(tx,tz))col.lerp(c2.set('#a8916a'),.62);
   if(f.w>0)col.lerp(c2.set(f.y<BED*.6?'#5a4430':'#4e3a2a'),Math.min(1,f.w*1.6));
   return[f.y,col.clone(),f.w>.15?0:pf,f.w>.15?0:pc]};
  for(let tz=z0;tz<z1;tz++){yield;for(let tx=x0;tx<x1;tx++){if((tx&3)===0)yield;const h=this.h(tx,tz);if(h<=0||h>=2)continue;
   let cob=0;for(const[u,v]of[[.5,.5],[.1,.1],[.9,.1],[.1,.9],[.9,.9]])cob=Math.max(cob,this.pathAt(tx+u,tz+v)[1]);const S=cob>.05&&this.q>.3?SUBC:SUB;   // adoquín: malla densa para el relieve real
   for(let b=0;b<S;b++)for(let a=0;a<S;a++){const xa=tx+a/S,xb=tx+(a+1)/S,za=tz+b/S,zb=tz+(b+1)/S,q=[[xa,za],[xa,zb],[xb,zb],[xb,za]].map(([x,z])=>{const[y,c,pf,pc]=top(x,z);return[x,y,z,c,pf,pc]});
    [0,1,2,0,2,3].forEach(k=>{const v=q[k];P.push(v[0],v[1],v[2]);C.push(v[3].r,v[3].g,v[3].b);PA.push(v[4]);PB.push(v[5])})}
   if(h===.75||this.near(tx,tz,.75)){[[tx,tz],[tx,tz+1],[tx+1,tz+1],[tx,tz],[tx+1,tz+1],[tx+1,tz]].forEach(([x,z])=>{WP.push(x,WY,z);WD.push(Math.max(0,WY-this.field(x,z).y))})}}}
  yield;  if(P.length){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(P,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(C,3));geo.setAttribute('aPath',new THREE.Float32BufferAttribute(PA,1));geo.setAttribute('aCob',new THREE.Float32BufferAttribute(PB,1));geo.computeVertexNormals();
   const m=new THREE.Mesh(geo,this.matTop);m.receiveShadow=true;m.castShadow=true;g.add(m)}
  // ── acantilados (bloques) y paredes por estratos ──
  const RP=[],RC=[],WLP=[],WLC=[];const yTop=h=>h>=2?LVY:h<=0?-99:null;
  const wall=(ax,az,bx,bz,ya0,ya1,yb,nx,nz)=>{ // pared vertical del borde (ax,az)-(bx,bz) desde arriba (ya0 en a, ya1 en b) hasta yb
   for(let s=0;s<STR_L.length-1;s++){const yt=(ya0+ya1)/2;const L0=yt+STR_L[s]*(yt-yb<1.2?(yt-yb)/1.05:1),L1=yt+STR_L[s+1]*(yt-yb<1.2?(yt-yb)/1.05:1);if(L0<=yb+1e-4)break;
    const lo=Math.max(L1,yb),q=[[ax,Math.min(ya0,L0),az],[ax,lo,az],[bx,lo,bz],[bx,Math.min(ya1,L0),bz]];
    [0,1,2,0,2,3].forEach(i=>{const p=q[i];WLP.push(p[0]+nx*.001,p[1],p[2]+nz*.001);const c=strat((i===1||i===2)?STR_L[s+1]+.001:STR_L[s]-.001,p[0],p[2],col);WLC.push(c.r,c.g,c.b)})}};
  for(let tz=z0;tz<z1;tz++){yield;for(let tx=x0;tx<x1;tx++){const h=this.h(tx,tz);if(h<=0)continue;
   if(h>=2){const yt=LVY+(hash(tx,tz,3)-.5)*.06;const q=[[tx,tz],[tx,tz+1],[tx+1,tz+1],[tx+1,tz]];
    [0,1,2,0,2,3].forEach(k=>{const[x,z]=q[k];RP.push(x,yt,z);const n=vn2(x*1.7,z*1.7);col.set('#5f5c68').lerp(c2.set('#3f5a2c'),Math.max(0,n-.35)*1.4).multiplyScalar(.9+hash(tx,tz,5)*.15);RC.push(col.r,col.g,col.b)})}
   // paredes hacia los 4 vecinos más bajos
   for(const[dx,dz,ax,az,bx,bz]of[[1,0,tx+1,tz,tx+1,tz+1],[-1,0,tx,tz+1,tx,tz],[0,1,tx+1,tz+1,tx,tz+1],[0,-1,tx,tz,tx+1,tz]]){const hn=this.h(tx+dx,tz+dz);
    const ya=h>=2?LVY:this.field(ax,az).y,yb2=h>=2?LVY:this.field(bx,bz).y;let yb;
    if(hn<=0)yb=Math.min(ya,yb2)-1.05;else if(h>=2&&hn<2)yb=Math.min(this.field(ax,az).y,this.field(bx,bz).y)-.02;else continue;
    wall(ax,az,bx,bz,ya,yb2,yb,dx,dz)}}}
  yield;  if(RP.length){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(RP,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(RC,3));geo.computeVertexNormals();const m=new THREE.Mesh(geo,this.matRock);m.receiveShadow=m.castShadow=true;g.add(m)}
  yield;  if(WLP.length){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(WLP,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(WLC,3));geo.computeVertexNormals();const m=new THREE.Mesh(geo,this.matWall);m.receiveShadow=m.castShadow=true;g.add(m)}
  yield;  if(WP.length){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(WP,3));geo.setAttribute('aDepth',new THREE.Float32BufferAttribute(WD,1));const m=new THREE.Mesh(geo,this.water);m.renderOrder=2;g.add(m)}
  this.grp.add(g);return{g,seen:this.tick,grass:null}}
 near(tx,tz,v){for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)if(this.h(tx+i,tz+j)===v)return true;return false}
 // pradera del chunk (guía §4.4): matas instanciadas del mismo color que el suelo, más bajas cerca de caminos/agua, nada en caminos, agua, arena ni roca
 // R3D-OPT: el pasto del chunk se parte en 4 cuadrantes de 8×8 tiles, cada uno con DOS mallas que COMPARTEN los buffers de instancias: «full» (7 briznas, 35 tris) y «lite» (4 briznas, 12 tris).
 // lod() enseña la completa cerca del héroe y la ligera lejos (allí el óleo/Kuwahara y la viñeta ya funden el detalle) y el recorte por cámara se hace por cuadrante.
 meadow(ci,cj){const it=this.meadowG(ci,cj);let r;while(!(r=it.next()).done);return r.value}
 *meadowG(ci,cj){const x0=ci*CS,z0=cj*CS,per=Math.round(26*this.q),N=CS*CS*per;if(!per)return null;const o=new THREE.Object3D(),B=[0,1,2,3].map(()=>({m:[],c:[]}));let n=0;
  for(let i=0;i<N*1.6&&n<N;i++){if((i&255)===0)yield;const x=x0+hash(i,1,ci*7+cj*131)*CS,z=z0+hash(i,2,ci*13+cj*71)*CS,tx=Math.floor(x),tz=Math.floor(z),h=this.h(tx,tz);if(!this.land(h))continue;
   const f=this.field(x,z);if(f.w>.22)continue;const[pf,pc]=this.pathAt(x,z);if(pf>.35||pc>.2)continue;if(TER.sandAt&&TER.sandAt(tx,tz))continue;
   const tall=(.65+.6*fb2(x*.6+20,z*.6+7))*(1-Math.min(1,pf*2))*(f.w>.05?.6:1),hg=(.17+hash(i,3,9)*.1)*tall;if(hg<.06)continue;
   o.position.set(x,f.y,z);o.rotation.set(0,hash(i,4,9)*6.28,0);o.scale.setScalar(hg);o.updateMatrix();
   const k=TER.biomeOf?TER.biomeOf(tx,tz):0,col=this.gc(x,z,k).offsetHSL(0,0,(hash(i,5,9)-.5)*.04),b=B[(x>=x0+8?1:0)+(z>=z0+8?2:0)];b.m.push(...o.matrix.elements);b.c.push(col.r,col.g,col.b);n++}
  if(!n)return null;yield;const grp=new THREE.Group();grp.userData.q=[];
  B.forEach((b,qi)=>{const cnt=b.c.length/3;if(!cnt)return;const cx=x0+4+(qi&1)*8,cz=z0+4+(qi>>1)*8,sph=new THREE.Sphere(new THREE.Vector3(cx,0,cz),CS*.3536+1.6);   // radio = media diagonal del cuadrante + alto de la mata + desnivel
   const full=new THREE.InstancedMesh(this.tuft,this.matGrass,cnt);full.instanceMatrix.array.set(b.m);full.instanceMatrix.needsUpdate=true;full.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(b.c),3);
   const lite=new THREE.InstancedMesh(this.tuftLite,this.matGrass,cnt);lite.instanceMatrix=full.instanceMatrix;lite.instanceColor=full.instanceColor;
   [full,lite].forEach(m=>{m.receiveShadow=true;m.boundingSphere=sph;m.frustumCulled=true;grp.add(m)});lite.visible=false;grp.userData.q.push({full,lite,cx,cz,far:false})});
  return grp}
 // distancia (tiles) a partir de la cual el cuadrante usa la brizna ligera; con histéresis de 1,5 tiles para que no parpadee al cruzar el umbral
 lod(cx,cz){const R=this.lodR;this.ch.forEach(c=>{if(!c.grass)return;c.grass.userData.q.forEach(q=>{const d=Math.hypot(q.cx-cx,q.cz-cz),far=q.far?d>R-1.5:d>R+1.5;if(far!==q.far||q.full.visible===q.lite.visible){q.far=far;q.full.visible=!far;q.lite.visible=far}})})}
 freeGrass(c){if(!c.grass)return;c.g.remove(c.grass);c.grass.userData.q.forEach(q=>{q.full.dispose();q.lite.dispose()});c.grass=null}   // dispose() libera los buffers de instancias en GPU (antes se quedaban para siempre al expulsar un chunk)
 setQuality(q){if(q===this.q)return;this.q=q;this.ch.forEach(c=>this.freeGrass(c))}
}
// mata de 7 briznas finas (4 tramos), idéntica a la referencia
function tuftGeo(NB,SEG,wk){const P=[],Nn=[],up=new THREE.Vector3(0,1,0);
 for(let b=0;b<NB;b++){const a=hash(b,1,71)*6.28,r0=hash(b,2,71)*.09,lean=.25+hash(b,3,71)*.25,hh=.7+hash(b,4,71)*.45,w=(.034+hash(b,5,71)*.014)*wk;
  const base=new THREE.Vector3(Math.cos(a)*r0,0,Math.sin(a)*r0),dir=new THREE.Vector3(Math.cos(a+1.3),0,Math.sin(a+1.3)),side=new THREE.Vector3(-dir.z,0,dir.x);
  const pt=t=>base.clone().addScaledVector(dir,lean*t*t).addScaledVector(up,hh*t),wd=t=>w*(1-t*.92);
  for(let s=0;s<SEG;s++){const t0=s/SEG,t1=(s+1)/SEG,a0=pt(t0),a1=pt(t1);   // R3D-OPT: 3 tramos (2 cuadriláteros + triángulo de punta) = 5 tris/brizna en vez de 8
   const q=[a0.clone().addScaledVector(side,-wd(t0)),a0.clone().addScaledVector(side,wd(t0)),a1.clone().addScaledVector(side,wd(t1)),a1.clone().addScaledVector(side,-wd(t1))];
   (s===SEG-1?[0,1,a1]:[0,1,2,0,2,3]).forEach(k=>{const v=k===a1?a1:q[k];P.push(v.x,v.y,v.z);Nn.push(0,1,0)})}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(Nn,3));return g}
// agua de F1: esmeralda por profundidad, ondas y destellos por ruido, orilla con espuma fina y alfa corto (la refracción real llega en F3)
export const WU={uDeep:{value:new THREE.Color('#0a6670')},uShal:{value:new THREE.Color('#48c8b4')},uNight:G.uNight,uTime:G.uTime};
function waterMat(){return new THREE.ShaderMaterial({uniforms:WU,transparent:true,depthWrite:false,
 vertexShader:`attribute float aDepth;varying float vD;varying vec3 vW;void main(){vD=aDepth;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
 fragmentShader:`uniform vec3 uDeep,uShal;uniform float uTime,uNight;varying float vD;varying vec3 vW;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  void main(){if(vD<.002)discard;float k=smoothstep(0.,.26,vD);vec3 c=mix(uShal,uDeep,k);
   float r=n(vW.xz*3.+vec2(uTime*.25,uTime*.12))*.6+n(vW.xz*7.-vec2(uTime*.3,0.))*.4;c*=.9+.2*r;
   vec2 pc=vW.xz*2.2;float c1=n(pc+vec2(uTime*.11,uTime*.07)+n(pc*1.7+uTime*.05)*1.6),c2=n(pc*1.13-vec2(uTime*.09,-uTime*.06)+n(pc*1.3+7.)*1.6);
   c+=pow(max(0.,1.-abs(c1-c2)*5.),9.)*vec3(.5,.9,.8)*(1.-k*.8)*(1.-uNight*.75)*.22;   // F3e: cáusticas (red de luz en el lecho, más fuertes en aguas someras): refracción «de mentira» sin pase extra
   float sp=pow(n(vW.xz*14.+vec2(uTime*.6,-uTime*.4)),18.)*1.6*(1.-uNight*.7);c+=sp;
   float foam=smoothstep(.04,.0,vD)*(.55+.45*n(vW.xz*9.+uTime*.5));c=mix(c,vec3(.92,.97,.95),foam*.7);
   gl_FragColor=vec4(c,mix(.55,.88,k)*smoothstep(0.,.02,vD)+foam*.3);
   #include <colorspace_fragment>
  }`})}
