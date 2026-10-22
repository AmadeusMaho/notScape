// NotScape · R3D · ACTORES 3D (Lote R3D-ACTORES, 18 oct 2026) · enemigos, animales, jefes y PNJ (Ru) como figuras 3D en el MUNDO (escena principal).
// ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// POR QUÉ UN MÓDULO NUEVO: el héroe se dibuja en un renderer aparte (≈100 draw calls); con 20–40 criaturas a la vista eso no cabe. Aquí cada criatura se
// HORNEA (bake) en UN SkinnedMesh (+ un casco de contorno): 3 llamadas de dibujo por actor, 1 más en la sombra. Las plantillas (geometría fusionada con colores
// de vértice y pesos rígidos hueso-a-hueso) se comparten por tipo; cada actor solo crea sus huesos. Se construyen al primer uso (lazy) y se cachean.
// DOS FUENTES DE FORMAS, MISMO LENGUAJE (diorama + cel shading + contorno, ver mini3d.js y GUIA_PERSONAJES_3D.md):
//   · humanoides  → `Mini` (mini3d.js) con un spec por criatura (tabla HUM) y se hornea con bake();
//   · cuadrúpedos, ave y rana → `Proto` (abajo): mismos `part`/`hull`, esqueleto propio (QUAD / BIRD / FROG), se hornea con el mismo bake().
// ANIMACIÓN: procedural por huesos (andar por DISTANCIA recorrida, respiración, ataque con anticipación-golpe-recuperación, daño con destello y retroceso,
// muerte que cae y se hunde). Los datos del juego que lee: m.x/m.y, m.mv (último paso), m.at0 (inicio del ataque), m.fl (destello de daño), alive(m,now),
// m.d.boss. NO toca lógica, colisiones ni picking: el clic sigue yendo por las cajas de MD (w,h).
// CÓMO AÑADIR UNA CRIATURA: una fila en HUM (spec Mini + altura H en px de modelo = CRE.H de creatures.js) o QUADS/BIRD/FROG. Altura en el mundo = H/52 unidades
// (52 px = el héroe). Los ojos que brillan (aEmit=2) vienen de `glow()`; el resto se hornea con color de vértice.
// TRAMPAS: (1) el material `chr` lee G.uChrB (pies→cabeza del héroe): r3d.js lo pone a (0,0) antes del pase del mundo; (2) los SkinnedMesh no se recortan solos
// (frustumCulled=false): Actors.update() descarta por distancia; (3) el casco (hull) comparte esqueleto con el cuerpo: ambos deben vivir en el mismo grupo.
import * as THREE from 'three';
import {toon,hull,hash,glow,INK} from './materials3d.js';
import {Mini,MINI,sword,shieldMesh} from './mini3d.js';
import {hairFn} from './herom3d.js';
import {angelWings} from './wings3d.js';   // alas de ángel reutilizables (Lote CINE-2b)

const M4=THREE.Matrix4,V3=THREE.Vector3,QT=THREE.Quaternion;
import {HK} from './scale3d.js';
const U=HK/52;                                            // px de modelo → unidades de mundo (52 px = altura del héroe = 1 unidad)
const sph=(r,x=1,y=1,z=1,n=16)=>new THREE.SphereGeometry(r,n,Math.max(8,n*.75|0)).scale(x,y,z);
const cone=(r,h,n=8)=>new THREE.ConeGeometry(r,h,n),cyl=(a,b,h,n=10)=>new THREE.CylinderGeometry(a,b,h,n),box=(x,y,z)=>new THREE.BoxGeometry(x,y,z);
const shade=(c,k)=>'#'+new THREE.Color(c).multiplyScalar(k).getHexString(),mixc=(a,b,t)=>'#'+new THREE.Color(a).lerp(new THREE.Color(b),t).getHexString();
const cl=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,u)=>a+(b-a)*u,ss=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t)};

// ═══════════════════════════════ HORNEADO: árbol de mallas → SkinnedMesh ═══════════════════════════════
// boneObjs = [[Object3D, nombre], …] (el primero es la raíz). Cada malla se asigna al hueso más cercano hacia arriba en el árbol; su geometría se lleva al
// espacio del objeto raíz en la pose de reposo. 3 clases de material (grupos de la geometría): tela/piel/doble cara; skinHex = color que es «piel» (rim bajo).
function bake(obj,boneObjs,skinHex){
 obj.updateMatrixWorld(true);const inv0=new M4().copy(obj.matrixWorld).invert(),bl=boneObjs.map(b=>b[0]),idx=new Map(bl.map((o,i)=>[o,i]));
 const bw=bl.map(o=>new M4().multiplyMatrices(inv0,o.matrixWorld)),parent=bl.map(o=>{for(let p=o.parent;p;p=p.parent)if(idx.has(p))return idx.get(p);return -1});
 const local=bw.map((m,i)=>{const L=parent[i]>=0?new M4().multiplyMatrices(new M4().copy(bw[parent[i]]).invert(),m):m.clone(),p=new V3(),q=new QT(),s=new V3();L.decompose(p,q,s);return{p,q,s}});
 const inverses=bw.map(m=>new M4().copy(m).invert()),near=o=>{for(let p=o;p;p=p.parent)if(idx.has(p))return idx.get(p);return 0};
 const C=[{P:[],N:[],K:[],E:[],B:[],I:[]},{P:[],N:[],K:[],E:[],B:[],I:[]},{P:[],N:[],K:[],E:[],B:[],I:[]}],HP=[],HB=[],v=new V3(),n=new V3(),nm=new THREE.Matrix3();
 obj.traverse(o=>{if(!o.isMesh||!o.geometry)return;const mw=new M4().multiplyMatrices(inv0,o.matrixWorld),bi=near(o),g=o.geometry,pa=g.attributes.position;
  if(o.userData.hull){const ix=g.index;const put=i=>{v.fromBufferAttribute(pa,i).applyMatrix4(mw);HP.push(v.x,v.y,v.z);HB.push(bi)};if(ix)for(let i=0;i<ix.count;i++)put(ix.getX(i));else for(let i=0;i<pa.count;i++)put(i);return}
  const mat=o.material;if(Array.isArray(mat))return;const c=C[mat.side===THREE.DoubleSide?2:(skinHex!=null&&!mat.isMeshBasicMaterial&&mat.color.getHex()===skinHex)?1:0],na=g.attributes.normal,base=c.P.length/3,col=mat.color,em=mat.isMeshBasicMaterial?2:0;
  nm.getNormalMatrix(mw);for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(mw);c.P.push(v.x,v.y,v.z);if(na){n.fromBufferAttribute(na,i).applyMatrix3(nm).normalize();c.N.push(n.x,n.y,n.z)}else c.N.push(0,1,0);c.K.push(col.r,col.g,col.b);c.E.push(em);c.B.push(bi)}
  if(g.index)for(let i=0;i<g.index.count;i++)c.I.push(base+g.index.getX(i));else for(let i=0;i<pa.count;i++)c.I.push(base+i)});
 const geo=new THREE.BufferGeometry(),P=[],N=[],K=[],E=[],B=[],I=[];let off=0;
 C.forEach((c,gi)=>{const base=P.length/3,st=I.length;for(const x of c.P)P.push(x);for(const x of c.N)N.push(x);for(const x of c.K)K.push(x);for(const x of c.E)E.push(x);for(const x of c.B)B.push(x);for(const x of c.I)I.push(base+x);geo.addGroup(st,I.length-st,gi)});
 const nv=P.length/3,skI=new Uint8Array(nv*4),skW=new Uint8Array(nv*4);for(let i=0;i<nv;i++){skI[i*4]=B[i];skW[i*4]=255}
 geo.setAttribute('position',new THREE.Float32BufferAttribute(P,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(K,3));geo.setAttribute('aEmit',new THREE.Float32BufferAttribute(E,1));
 geo.setAttribute('skinIndex',new THREE.BufferAttribute(skI,4));geo.setAttribute('skinWeight',new THREE.BufferAttribute(skW,4,true));geo.setIndex(nv>65535?new THREE.Uint32BufferAttribute(I,1):new THREE.Uint16BufferAttribute(I,1));
 const hg=new THREE.BufferGeometry(),hn=HP.length/3,hI=new Uint8Array(hn*4),hW=new Uint8Array(hn*4);for(let i=0;i<hn;i++){hI[i*4]=HB[i];hW[i*4]=255}
 hg.setAttribute('position',new THREE.Float32BufferAttribute(HP,3));hg.setAttribute('skinIndex',new THREE.BufferAttribute(hI,4));hg.setAttribute('skinWeight',new THREE.BufferAttribute(hW,4,true));
 return{geo,hgeo:hg,local,parent,inv:inverses,names:boneObjs.map(b=>b[1]),tris:I.length/3|0}}

// materiales del actor: 0 tela · 1 piel (rim bajo) · 2 doble cara. FLASH = destello de daño. HOVER = contorno claro bajo el puntero.
const EYETEX=(()=>{const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d'),r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.3,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,32,32);return new THREE.CanvasTexture(c)})();
const VC={chr:1,vc:1,emit:1};
const MATS=[toon('#ffffff',Object.assign({rim:1.4},VC)),toon('#ffffff',Object.assign({rim:.3},VC)),toon('#ffffff',Object.assign({rim:1.4,side:THREE.DoubleSide},VC))];
// SILUETA DE PNJ TAPADOS (21 oct 2026): el PNJ del tutorial de talar quedaba oculto tras los olivos. La malla `xr` (misma piel y esqueleto, material XRAYM) se pinta solo donde el PNJ queda DETRÁS de algo (depthFunc Greater) con el adelanto XR_D. SIN stencil: el stencil en el render target MSAA del composer costaba ≈ 12 ms a 1080p en Máxima (46→20 fps).
const XRAYM=new THREE.MeshBasicMaterial({color:'#ffe6b8',transparent:true,opacity:.5,depthWrite:false,depthFunc:THREE.GreaterDepth});
// la silueta solo sale si lo que tapa está AL MENOS `XR_D` unidades (de vista) por delante: el vértice se adelanta hacia la cámara (la cámara es ortográfica → no mueve nada en pantalla). Evita que parezca «translúcido» un PNJ que no está detrás de nada (partes propias solapadas, relieve del suelo, adoquines).
const XR_D=.45;XRAYM.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nmvPosition.z+='+XR_D.toFixed(3)+';gl_Position=projectionMatrix*mvPosition;')};XRAYM.customProgramCacheKey=()=>'xray'+XR_D;
const FLASHM=new THREE.MeshBasicMaterial({color:'#fff2e0'}),FLASH=[FLASHM,FLASHM,FLASHM],DEPTHM=new THREE.MeshBasicMaterial({colorWrite:false}),HOVER=new THREE.MeshBasicMaterial({color:'#ffe7a0',side:THREE.BackSide});

// ═══════════════════════════════ PROTO: constructor mínimo para cuadrúpedos, ave y rana (mismo `part` que Mini) ═══════════════════════════════
class Proto{
 constructor(){this.obj=new THREE.Group();this.list=[];this.skinC=null}
 bone(name,parent,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);(parent||this.obj).add(g);this.list.push([g,name]);return g}
 part(geo,col,x,y,z,o={}){const m=new THREE.Mesh(geo,toon(col,{chr:1,rim:o.skin?.3:1.4,side:o.dbl?THREE.DoubleSide:THREE.FrontSide}));m.position.set(x,y,z);if(o.rot)m.rotation.set(...o.rot);(o.p||this.obj).add(m);
  if(o.ink!==0){const h=hull(geo,o.ink||.016);h.position.copy(m.position);h.rotation.copy(m.rotation);(o.p||this.obj).add(h)}return m}
 glow(geo,col,x,y,z,o={}){const m=new THREE.Mesh(geo,glow(col,o.k||1.6));m.position.set(x,y,z);(o.p||this.obj).add(m);return m}
 eyes(p,x,y,z,r,col,glowing){[-1,1].forEach(q=>{if(glowing)this.glow(sph(r,1,1.1,.7,10),col,x*q,y,z,{p});else{this.part(sph(r,1,1.1,.7,10),col||'#1c1410',x*q,y,z,{p,ink:0});this.part(sph(r*.32,1,1,1,6),'#fff6e0',x*q+r*.3*q*.0+r*.25,y+r*.35,z+r*.45,{p,ink:0})}})}
}
function bakeProto(P,skin){return bake(P.obj,P.list,skin?new THREE.Color(skin).getHex():null)}

// ═══════════════════════════════ CUADRÚPEDOS (parámetros = los de creatures.js quad(), en px de modelo) ═══════════════════════════════
// col/belly/leg/hoof/bx/by/len/lwid/hx/hy/hr/sn como en CRE (hx,hy relativos al centro del cuerpo, y hacia abajo). Extras: ear (point|round|none), eye (color brillante), s.
const QUADS={
 vaca:{col:'#f4efe4',belly:'#ece2d0',bx:19,by:9,len:10,lwid:4.2,leg:'#f4efe4',hoof:'#4a3c36',hx:19.5,hy:2.2,hr:[7.6,6.6],sn:{x:5.8,y:2.4,rx:4,ry:3.4,col:'#f0a8a4'},ear:'side',earC:'#3a2e2a',head:'#f4efe4',horn:'#efe4c4',spots:'#3a2e2a',spotL:[[.45,.1,1,.5,'f'],[-.4,.05,-1,.55,'f'],[-.05,.9,0,.5,'t'],[.7,.2,-1,.35,'f'],[-.75,.15,1,.4,'f']],udder:'#f0a8a4',tail:'tuft'},
 oveja:{col:'#f1ede2',belly:'#e4ddcc',bx:17,by:10,len:6.4,lwid:3.8,leg:'#4a403c',hoof:'#2e2622',hx:18,hy:0,hr:[5.6,5.2],sn:{x:4.2,y:1.8,rx:3,ry:2.6,col:'#5a4e48'},ear:'floppy',head:'#5a4e48',wool:'#f1ede2',tail:'puff'},
 jabali:{col:'#7a5440',belly:'#a07a5c',bx:15,by:9.4,len:6,lwid:4.4,hoof:'#3a2a22',hx:16,hy:2,hr:[7,6.4],sn:{x:6,y:2.4,rx:4.6,ry:3.4,col:'#9a6e58'},ear:'point',crest:'#4a3226',tusk:1,tail:'curl',eye:'#ffb040'},
 lobo:{col:'#8f93a4',belly:'#cdd0da',bx:16.6,by:7.6,len:9.4,lwid:3.8,hoof:'#4a4654',hx:17.6,hy:-2.6,hr:[6.8,5.6],sn:{x:6.8,y:1.8,rx:5.4,ry:2.8,col:'#a2a6b6'},ear:'point',tail:'bush',tailC:'#8f93a4',eye:'#ffcf50',fangs:1},
 yak:{col:'#55402e',belly:'#3a2a20',hump:'#4c3828',bx:20,by:11,len:7.5,lwid:5.6,leg:'#3e2e22',hoof:'#2a2018',hx:20.6,hy:2.6,hr:[8.2,7.4],sn:{x:6.4,y:2.8,rx:4.4,ry:3.6,col:'#6a5240'},ear:'round',horn:'#e6dcc0',hornBig:1,skirt:'#3e2e22',tail:'tuft'},
 zorro:{col:'#ef9a52',belly:'#fff0d8',bx:13.6,by:6.6,len:8.6,lwid:3.2,hoof:'#4a3a3a',leg:'#c8743a',hx:15,hy:-2.2,hr:[6,5.2],sn:{x:6.4,y:1.8,rx:5,ry:2.4,col:'#fff0d8'},ear:'point',tail:'bush',tailC:'#ef9a52',tailTip:'#dff6ff',eye:'#7fe8ff',tails:2},
 lagarto:{col:'#d8702a',belly:'#f2b25a',bx:15,by:5.6,len:4.4,lwid:3.8,hoof:'#7a3a1e',hx:19.6,hy:-.6,hr:[6.6,4.4],sn:{x:5.6,y:.8,rx:4.6,ry:2.6},ear:'none',tail:'long',tailC:'#d8702a',tailTip:'#ffd23a',eye:'#ffd23a',dorsal:'#ffd23a',wide:1.15,tilt:1},
 oso:{col:'#6b4a32',belly:'#86654a',bx:20,by:12.4,len:7,lwid:6.2,hoof:'#2e2018',hx:21.6,hy:.4,hr:[8.6,7.6],sn:{x:7,y:2.6,rx:4.6,ry:3.6,col:'#a88a62'},ear:'round',tail:'stub',hump:'#7e5a40',eye:'#2a1a10',fangs:1},
 k1:{s:1.42,col:'#3f2c1e',belly:'#5a4030',bx:20,by:12.4,len:7,lwid:6.2,hoof:'#2e2018',hx:21.6,hy:.4,hr:[8.6,7.6],sn:{x:7,y:2.6,rx:4.6,ry:3.6,col:'#8a6a48'},ear:'round',tail:'stub',hump:'#5a4030',eye:'#ff5a3a',fangs:1,crest:'#d8d0b8'},
 b1:{s:1.5,col:'#414355',belly:'#6a6d80',bx:17.6,by:8.6,len:10,lwid:4.4,hoof:'#26262e',hx:19,hy:-3,hr:[7.4,6.2],sn:{x:7.4,y:2,rx:5.8,ry:3.2,col:'#565868'},ear:'point',tail:'bush',tailC:'#414355',tailTip:'#9ab8ff',eye:'#9ad0ff',fangs:1,mane:'#2e3040'}};
function buildQuad(id){const c=QUADS[id],s=c.s||1,k=U*s,P=new Proto(),bx=c.bx*k,by=c.by*k,len=c.len*k,lw=c.lwid*k*.5,bz=by*(c.wide||.95),bodyY=len+by*.78,col=c.col,H=c.hoof||'#3a2a22',hrz=c.hr[0]*k,hry=c.hr[1]*k;
 const root=P.bone('root',null),body=P.bone('body',root,0,bodyY,0);
 // PB: forma del CUERPO escrita con el largo en X (como en creatures.js) y llevada al marco del actor (largo en Z, +z = delante). Corrige el bug «cuerpo ancho como largo» (18 oct 2026).
 const PB=(geo,c2,x,y,z,o={})=>{geo.rotateY(-Math.PI/2);if(o.rot){const[a,b,d]=o.rot;o=Object.assign({},o,{rot:[d,b,-a]})}return P.part(geo,c2,-z,y,x,o)};
 PB(sph(1,bx,by,bz,20),col,0,0,0,{p:body,ink:.018});
 if(c.belly)PB(sph(1,bx*.84,by*.6,bz*.86,16),c.belly,0,-by*.34,0,{p:body,ink:0});
 if(c.spots)c.spotL.forEach(([a,b,d,rr,kind])=>kind==='t'?PB(sph(by*rr,1,.32,1,10),c.spots,a*bx*.8,by*.93,d*bz*.3,{p:body,ink:0}):PB(sph(by*rr,1,1,.3,10),c.spots,a*bx*.8,b*by,d*bz*.95,{p:body,ink:0}));
 if(c.udder)P.part(sph(1,bz*.3,by*.34,bx*.2,10),c.udder,0,-by*.78,-bx*.38,{p:body,ink:.01});
 if(c.hump)PB(sph(1,bx*.55,by*.62,bz*.8,14),c.hump,bx*.28,by*.62,0,{p:body,ink:.012});
 if(c.wool)for(let i=0;i<14;i++){const a=i/14*6.283,r=1+hash(i,3,1)*.12;PB(sph(by*.34,1,1,1,8),c.wool,Math.cos(a)*bx*.62,by*(.3+(i%3)*.26)*Math.sign(Math.sin(a*1.7)||1)*.9,Math.sin(a)*bz*.7*r,{p:body,ink:.01})}
 if(c.crest)for(let i=0;i<6;i++)PB(cone(by*.16,by*.55,5),c.crest,-bx*.55+i*bx*.22,by*.95-Math.abs(i-2.5)*by*.06,0,{p:body,ink:.008});
 if(c.mane)for(let i=0;i<7;i++)PB(cone(by*.2,by*.8,5),c.mane,bx*.52-i*bx*.15,by*1.0-i*by*.03,0,{p:body,ink:.008,rot:[0,0,.3]});
 if(c.dorsal)for(let i=0;i<7;i++)PB(cone(by*.16,by*.5,4),c.dorsal,-bx*.6+i*bx*.2,by*.95,0,{p:body,ink:.008});
 if(c.skirt)PB(cyl(bx*.62,bx*.7,by*1.1,14).scale(1,1,bz/bx*1.1).rotateZ(Math.PI/2),c.skirt,0,-by*.55,0,{p:body,ink:0});
 // patas: 2 delanteras / 2 traseras; cada una = hueso en la cadera (dentro del cuerpo). Diagonales en fase al andar.
 const hipY=len+by*.2-bodyY,legL=len+by*.2;const legs={};
 [['FL',1,1],['FR',-1,1],['BL',1,-1],['BR',-1,-1]].forEach(([n,sx,sz])=>{const b=P.bone('leg'+n,body,sx*bz*.58,hipY,sz*bx*.5);legs[n]=b;
  P.part(cyl(lw*1.2,lw*.85,legL-lw*.8,9).translate(0,-(legL-lw*.8)/2,0),c.leg||col,0,0,0,{p:b,ink:.012});P.part(sph(lw*1.15,1.05,.7,1.35,8),H,0,-legL+lw*.5,lw*.55,{p:b,ink:.01})});
 // cabeza (pivote en el cuello) + hocico + ojos + orejas
 const hz=c.hx*k,hy=bodyY-c.hy*k,neck=P.bone('head',body,0,by*.15,hz*.5),dy=hy-bodyY-by*.15,dz=hz*.5,hc=c.head||col;
 if(dz>bx*.3||true)P.part(cyl(hry*.9,hry*1.15,hz*.9,9).rotateX(Math.PI/2).translate(0,dy*.5,dz*.1),col,0,0,-hz*.12,{p:neck,ink:0});
 P.part(sph(1,hry*.96,hry,hrz,18),hc,0,dy,dz,{p:neck,ink:.016});
 if(c.sn){const sn=c.sn;P.part(sph(1,sn.ry*k*.95,sn.ry*k,sn.rx*k,14),sn.col||hc,0,dy-sn.y*k,dz+sn.x*k*1.0,{p:neck,ink:.012});
  P.part(sph(sn.ry*k*.32,1,.8,.7,6),'#2c2224',0,dy-sn.y*k+sn.ry*k*.25,dz+sn.x*k+sn.rx*k*.82,{p:neck,ink:0});
  if(c.fangs)[-1,1].forEach(q=>P.part(cone(sn.ry*k*.16,sn.ry*k*.7,5),'#f4f0e0',q*sn.ry*k*.55,dy-sn.y*k-sn.ry*k*.8,dz+sn.x*k+sn.rx*k*.35,{p:neck,ink:0,rot:[Math.PI,0,0]}));
  if(c.tusk)[-1,1].forEach(q=>P.part(cone(sn.ry*k*.2,sn.ry*k*1.1,5),'#efe6cc',q*sn.ry*k*.8,dy-sn.y*k+sn.ry*k*.2,dz+sn.x*k+sn.rx*k*.2,{p:neck,ink:.006,rot:[-.5,0,q*.35]}))}
 P.eyes(neck,hry*.74,dy+hry*.28,dz+hrz*.34,hry*.17,c.eye||'#1c1410',!!c.eye);P.eyePos=[hry*.74,dy+hry*.28,dz+hrz*.34,hry*.17];   // posición de los ojos (hueso 'head'): el destello de aviso de golpe se cuelga de ahí
 const ek=c.ear;if(ek&&ek!=='none')[-1,1].forEach(q=>{if(ek==='point')P.part(cone(hry*.34,hry*.95,5),hc,q*hry*.62,dy+hry*.95,dz-hrz*.15,{p:neck,ink:.01,rot:[-.15,0,-q*.25]});
  else if(ek==='side')P.part(sph(hry*.42,1.7,.3,.8,8),c.earC||hc,q*hry*1.25,dy+hry*.5,dz-hrz*.25,{p:neck,ink:.01,rot:[0,0,q*.25]});
  else if(ek==='round')P.part(sph(hry*.3,1,1.1,.6,8),hc,q*hry*.95,dy+hry*.7,dz-hrz*.2,{p:neck,ink:.01});
  else P.part(sph(hry*.26,.6,1.5,.5,8),shade(hc,.85),q*hry*1.0,dy+hry*.2,dz-hrz*.2,{p:neck,ink:.01,rot:[0,0,q*.5]})});
 if(c.horn)[-1,1].forEach(q=>P.part(cone(hry*.2,hry*(c.hornBig?1.7:.9),6),c.horn,q*hry*.7,dy+hry*(c.hornBig?1.0:.95),dz-hrz*.1,{p:neck,ink:.008,rot:[0,0,-q*(c.hornBig?1.35:.5)]}));
 // cola (hueso propio: se mueve)
 const tail=P.bone('tail',body,0,by*.35,-bx*.92),tc=c.tailC||col,tk=c.tail;
 if(tk==='bush'){P.part(sph(1,by*.5,by*.55,bx*.55,12),tc,0,-by*.05,-bx*.4,{p:tail,ink:.014,rot:[.5,0,0]});if(c.tailTip)P.part(sph(1,by*.4,by*.42,bx*.22,10),c.tailTip,0,-by*.35,-bx*.72,{p:tail,ink:0,rot:[.5,0,0]});
  if(c.tails===2){const t2=P.bone('tail2',body,0,by*.45,-bx*.9);P.part(sph(1,by*.5,by*.55,bx*.55,12),tc,by*.5,0,-bx*.4,{p:t2,ink:.014,rot:[.5,0,-.4]})}}
 else if(tk==='long'){P.part(cone(by*.55,bx*1.5,8).rotateX(-Math.PI/2).translate(0,0,-bx*.7),tc,0,0,0,{p:tail,ink:.012});if(c.tailTip)P.part(sph(by*.2,1,1,1,6),c.tailTip,0,0,-bx*1.45,{p:tail,ink:0})}
 else if(tk==='tuft'){P.part(cyl(lw*.35,lw*.3,len*1.2,6).translate(0,-len*.6,-lw*.2),shade(col,.8),0,0,0,{p:tail,ink:.008});P.part(sph(lw*.8,1,1.3,1,6),shade(col,.45),0,-len*1.25,0,{p:tail,ink:.008})}
 else if(tk==='puff')P.part(sph(by*.38,1,1,1,8),c.wool||col,0,0,-by*.2,{p:tail,ink:.01});
 else if(tk==='curl')P.part(cyl(lw*.25,lw*.2,len*.8,5).translate(0,len*.35,-len*.15),shade(col,.7),0,0,0,{p:tail,ink:.006,rot:[-.8,0,0]});
 else if(tk==='stub')P.part(sph(by*.22,1,1,1,6),shade(col,.85),0,0,-by*.1,{p:tail,ink:.008});
 const t=bakeProto(P,null);t.kind='quad';t.k=s;t.h=len+by*1.8;t.rad=bx*1.3;t.tilt=c.tilt||0;t.cycle=bx*2*1.8;t.eye=P.eyePos;t.eyeCol=c.eye||'#ffd36a';return t}

// ═══════════════════════════════ AVE (gallina) y RANA ═══════════════════════════════
function buildBird(){const P=new Proto(),k=U,root=P.bone('root',null),body=P.bone('body',root,0,.17,0),W='#fff6dc',R='#d92a2a',Y='#f0a020';
 P.part(sph(1,.15,.15,.2,14),W,0,0,0,{p:body,ink:.012});P.part(sph(1,.07,.08,.1,8),'#efe0b8',0,.02,-.1,{p:body,ink:.008});
 const head=P.bone('head',body,0,.12,.13);P.part(sph(1,.07,.08,.075,12),W,0,.07,.03,{p:head,ink:.01});P.part(cone(.03,.07,5),Y,0,.06,.12,{p:head,ink:.006,rot:[Math.PI/2,0,0]});
 P.part(cone(.03,.07,5),R,0,.15,.03,{p:head,ink:.006});P.part(sph(1,.016,.035,.016,6),R,0,.01,.1,{p:head,ink:0});P.eyes(head,.055,.1,.07,.016,'#1c1410');
 [-1,1].forEach((q,i)=>{const w=P.bone(i?'wingR':'wingL',body,q*.14,.04,0);P.part(sph(1,.025,.07,.12,10),'#efe0b8',q*.01,-.02,-.02,{p:w,ink:.008});
  const l=P.bone(i?'legR':'legL',body,q*.06,-.1,0);P.part(cyl(.012,.012,.1,5).translate(0,-.05,0),Y,0,0,0,{p:l,ink:.005});P.part(sph(1,.04,.012,.05,6),Y,0,-.1,.02,{p:l,ink:.004})});
 const tail=P.bone('tail',body,0,.05,-.17);P.part(cone(.07,.15,5),'#e8dcc0',0,.04,-.04,{p:tail,ink:.008,rot:[-2.2,0,0]});
 const t=bakeProto(P,null);t.kind='bird';t.k=1;t.h=.36;t.rad=.3;t.cycle=.3;return t}
function buildFrog(){const P=new Proto(),root=P.bone('root',null),body=P.bone('body',root,0,.16,0),G1='#5d9a34',G2='#7ab94a';
 P.part(sph(1,.2,.14,.24,16),G1,0,0,0,{p:body,ink:.014});P.part(sph(1,.15,.07,.19,12),'#c8e090',0,-.07,.02,{p:body,ink:0});
 const head=P.bone('head',body,0,.04,.17);P.part(sph(1,.17,.1,.12,14),G1,0,.02,.02,{p:head,ink:.012});
 [-1,1].forEach(q=>{P.part(sph(.065,1,1,1,10),G2,q*.1,.1,.01,{p:head,ink:.01});P.part(sph(.032,1,1,.8,8),'#101010',q*.1,.11,.06,{p:head,ink:0});P.part(sph(.01,1,1,1,5),'#fff',q*.1+.01,.125,.085,{p:head,ink:0})});
 P.part(box(.2,.012,.02),'#3a5a22',0,-.025,.11,{p:head,ink:0});
 [['legBL',-1,-1],['legBR',1,-1],['legFL',-1,1],['legFR',1,1]].forEach(([n,sx,sz])=>{const b=P.bone(n,body,sx*.17,-.08,sz*.12),big=sz<0;P.part(sph(1,.05,big?.13:.08,big?.1:.06,8),G1,0,-.04,big?-.04:.03,{p:b,ink:.01});P.part(sph(1,.06,.02,.08,8),G2,0,-.13,.03,{p:b,ink:.006})});
 const t=bakeProto(P,null);t.kind='frog';t.k=1;t.h=.4;t.rad=.45;t.cycle=.55;return t}

// ═══════════════════════════════ HUMANOIDES (spec Mini por criatura) ═══════════════════════════════
const byId=id=>MINI.find(m=>m.id===id);
const horns=(c,r=.045,h=.16,sp=.15,tilt=.7)=>(F,head,part)=>[-1,1].forEach(q=>part(cone(r,h,6),c,sp*q,.2,0,{p:head,ink:.008}).rotation.z=-tilt*q);
const hat=(c,o={})=>(F,head,part)=>{part(cyl(.3,.3,.03,20),c,0,.15,0,{p:head,ink:.012});part(cone(.16,.5,10),c,0,.42,-.02,{p:head,ink:.014}).rotation.x=-.12;if(o.band)part(new THREE.TorusGeometry(.16,.018,6,16).rotateX(Math.PI/2),o.band,0,.2,0,{p:head,ink:0})};
const ears=(c,L=.12)=>(F,head,part)=>[-1,1].forEach(q=>{part(cone(.05,L,6),c,.21*q,.04,0,{p:head,ink:.01}).rotation.z=-1.35*q});
const mix=(...fs)=>(F,a,b)=>fs.forEach(f=>f&&f(F,a,b));
const club=(c='#5a3e2c',head='#7a5a40',L=.8,R=.11)=>(F,h,p)=>{p(cyl(.03,.036,L,7),c,0,L*.35,0,{p:h,ink:.012});p(sph(R,1,1.5,1,10),head,0,L*.82,0,{p:h,ink:.014});[[.07,.1],[-.07,-.02],[0,.05]].forEach(([a,b],i)=>p(cone(.02,.07,5),'#d8d0b8',a*1.2,L*.82+b,(i-1)*.05+.07,{p:h,ink:0}))};
const axeW=(blade='#aab0bc',L=.7,W=.2)=>(F,h,p)=>{p(cyl(.022,.026,L,6),'#6a4a32',0,L*.3,0,{p:h,ink:.01});p(box(.03,W,W*.8),blade,0,L*.72,W*.4,{p:h,ink:.012});p(box(.03,W*.7,W*.5),shade(blade,.8),0,L*.72,-W*.2,{p:h,ink:.01})};
const kanabo=(F,h,p)=>{p(cyl(.03,.03,.3,6),'#6a4a32',0,.1,0,{p:h,ink:.01});p(cyl(.08,.05,.7,8),'#4c4c56',0,.62,0,{p:h,ink:.014});for(let i=0;i<8;i++){const a=i*2.4,y=.4+(i%4)*.14;p(cone(.025,.06,5),'#c8c8d4',Math.cos(a)*.075,y,Math.sin(a)*.075,{p:h,ink:0})}};
const trident=(F,h,p)=>{p(cyl(.016,.018,1.5,6),'#5a4a52',0,.45,0,{p:h,ink:.01});[-1,0,1].forEach(q=>p(cone(.022,q?.18:.26,5),'#c8c8d4',q*.07,1.28+(q?0:.03),0,{p:h,ink:.008}));p(box(.16,.025,.025),'#c8c8d4',0,1.2,0,{p:h,ink:.006})};
const staffW=(orb,L=1.3)=>(F,h,p)=>{p(cyl(.02,.024,L,6),'#5a4030',0,L*.32,0,{p:h,ink:.012});p(new THREE.TorusGeometry(.06,.014,6,12),'#6a4a30',0,L*.67+.02,0,{p:h,ink:.006});p(sph(.06,1,1,1,10),orb,0,L*.67,0,{p:h,ink:0,mat:glow(orb,2)})};
const shiv=(blade='#a6a08c',L=.28)=>(F,h,p)=>{p(cyl(.016,.016,.1,5),'#4a3422',0,0,0,{p:h,ink:.008});p(box(.1,.02,.03),'#6a5a3a',0,.06,0,{p:h,ink:.006});p(box(.035,L,.012),blade,0,.06+L/2,0,{p:h,ink:.008})};
const cleaver=(F,h,p)=>{p(cyl(.02,.02,.2,5),'#6a4a32',0,0,0,{p:h,ink:.008});p(box(.03,.4,.2),'#9aa0ae',0,.34,.06,{p:h,ink:.012})};
const katana=(c='#d8dce8',L=.62)=>(F,h,p)=>{p(cyl(.017,.017,.2,6),'#2a2a32',0,0,0,{p:h,ink:.008});p(cyl(.05,.05,.015,10),'#b8302a',0,.11,0,{p:h,ink:.006});p(box(.025,L,.012),c,0,.11+L/2,0,{p:h,ink:.008})};
const flameSword=(F,h,p)=>{p(cyl(.022,.022,.18,6),'#3a2a2a',0,0,0,{p:h,ink:.008});p(box(.18,.03,.04),'#c0502a',0,.1,0,{p:h,ink:.008});p(box(.07,.8,.02),'#e8541c',0,.55,0,{p:h,ink:0,mat:glow('#e8541c',1.15)});p(box(.03,.7,.025),'#ff9a3a',0,.5,0,{p:h,ink:0,mat:glow('#ff9a3a',1.2)})};
const boneStaff=(F,h,p)=>{p(cyl(.022,.026,1.2,6),'#efe8d4',0,.35,0,{p:h,ink:.01});p(sph(.05,1,1,1,8),'#efe8d4',-.03,.97,0,{p:h,ink:.008});p(sph(.05,1,1,1,8),'#efe8d4',.03,.97,0,{p:h,ink:.008});p(sph(.04,1,1,1,8),'#9affc0',0,1.04,0,{p:h,ink:0,mat:glow('#7fffb0',2)})};
const fur=(c,r=.17,y=.84)=>(F,g,part)=>part(new THREE.TorusGeometry(r,.055,8,18).rotateX(Math.PI/2),c,0,y,0,{p:g,ink:.014});
const cape=(c,L=.8,w=.22)=>(F,g,part)=>part(cyl(w*.7,w*1.5,L,10,1).translate(0,L*.45,0),c,0,0,-.17,{p:g,ink:.012,t:{side:THREE.DoubleSide}});
const orbs=(c,n=3,r=.34)=>(F,g,part)=>{F.orbs=[];for(let i=0;i<n;i++){const a=i/n*6.283;F.orbs.push(part(sph(.045,1,1,1,8),c,Math.cos(a)*r,.95+Math.sin(i*2.1)*.1,Math.sin(a)*r,{p:g,ink:0,mat:glow(c,1.15)}))}};
const flame=(x,y,s=1,c='#e8541c')=>(F,g,part)=>{part(cone(.07*s,.26*s,6),c,x,y,0,{p:g,ink:0,mat:glow(c,1.15)});part(cone(.04*s,.16*s,6),'#ff9a3a',x,y-.015,0,{p:g,ink:0,mat:glow('#ff9a3a',1.15)})};
const cracks=(c='#ff7a2a',n=5)=>(F,g,part)=>{for(let i=0;i<n;i++)part(box(.012,.16,.012),c,-.12+i*.06,.45+(i%3)*.12,.2-Math.abs(i-2)*.02,{p:g,ink:0,mat:glow(c,1.15)}).rotation.z=(i%2?.5:-.4)};
const core=(c='#ff9a30',y=.56)=>(F,g,part)=>part(sph(.07,1,1,.6,8),c,0,y,.19,{p:g,ink:0,mat:glow(c,1.2)});
const wingsB=(c)=>(F,g,part)=>[-1,1].forEach(q=>{const w=part(new THREE.ConeGeometry(.2,.5,3).scale(1,1,.15),c,.2*q,.85,-.22,{p:g,ink:.01});w.rotation.z=-q*.9;w.rotation.x=-.2});
const nose=(c)=>(F,head,part)=>part(cone(.04,.12,6),c,0,-.015,.235,{p:head,ink:.008}).rotation.x=Math.PI/2;
const beard=(c,L=.12)=>(F,head,part)=>part(sph(.1,1.2,L/.1,.7,10),c,0,-.14,.12,{p:head,ink:.01});
const unit=(id,spec,H,extra)=>({id,H,spec:Object.assign({enemy:1,ph:(hash(id.length,id.charCodeAt(0),1)*6.28)},spec),extra});
// H = altura de la etiqueta en px de modelo (CRE.H de creatures.js). k de Mini se calcula como (H/52)/1.25.
const HUM={
 goblin:unit('goblin',{eye:'#e8d040',robe:'#6a4a30',trim:'#463628',belt:'#2a1c12',skin:'#5e8a38',pants:'#463628',boot:'#2c2016',w:.8,chestW:.95,waist:.9,armW:.85,legW:.9,headK:1.18,lean:.35,stance:1.12,strap:'#2a1c12',brow:'#1c140c',top:mix(ears('#5e8a38',.15),nose('#4e7a30')),acc:(F)=>F.hold(0,-1.2,shiv())},34),
 orco:unit('orco',{eye:'#ffcc30',robe:'#6f9a4c',trim:'#2a2018',belt:'#3a2a1e',skin:'#6f9a4c',sleeve:'#6f9a4c',w:1.25,chestW:1.15,waist:.84,armW:1.35,legW:1.2,stance:1.15,headK:.95,lean:.08,pauld:'#4a4e56',spikes:3,spikeC:'#cfcfc4',strap:'#3a2a1e',pants:'#5a4a38',boot:'#3e3026',brow:'#10100c',
  top:mix(ears('#6f9a4c',.12),(F,head,part)=>[-1,1].forEach(q=>part(cone(.028,.09,6),'#e8e0c0',.075*q,-.075,.19,{p:head,ink:.008}).rotation.x=-.3)),acc:(F)=>F.hold(0,-.9,axeW())},46),
 ogro:unit('ogro',{eye:'#ffe060',robe:'#c89a5e',trim:'#5a3a22',belt:'#5a3a22',skin:'#c89a5e',sleeve:'#c89a5e',w:1.45,belly:.09,armW:1.4,legW:1.25,headK:.8,lean:.14,stance:1.2,strap:'#5a3a22',pants:'#6a4a32',boot:'#4a3424',brow:'#2a1a10',
  top:mix((F,head,part)=>part(cone(.04,.11,6),'#efe6cc',0,.2,.02,{p:head,ink:.008}),(F,head,part)=>[-1,1].forEach(q=>part(cone(.035,.08,5),'#efe6cc',.08*q,-.09,.19,{p:head,ink:.006}).rotation.x=-.3)),acc:(F)=>F.hold(0,-.8,club())},54),
 oni:unit('oni',{eye:'#ffe040',robe:'#c8403a',trim:'#e8b62a',belt:'#e8b62a',skin:'#c8403a',sleeve:'#c8403a',w:1.3,chestW:1.12,waist:.8,armW:1.3,legW:1.15,stance:1.12,pauld:'#e8b62a',spikes:3,spikeC:'#18141a',strap:'#7a2a1c',pants:'#e8b62a',boot:'#5a2a2a',brow:'#1a0c0c',
  top:mix(horns('#efe0b8',.05,.2,.1,.35),(F,head,part)=>part(sph(.215,1,.8,1,10),'#18141a',0,.12,-.04,{p:head,ink:.012})),acc:(F)=>F.hold(0,-.8,kanabo)},66),
 demonio:unit('demonio',{eye:'#ffd030',robe:'#7a2236',trim:'#2a1218',belt:'#2a1218',skin:'#b02a3a',sleeve:'#b02a3a',w:1.1,chestW:1.1,waist:.76,pauld:'#2a1218',spikes:2,spikeC:'#e8b62a',pants:'#5a1c2e',boot:'#2e1620',brow:'#1a0808',
  top:horns('#2a1a1e',.05,.28,.13,.5),acc:mix((F)=>F.hold(0,-.2,trident),wingsB('#3a1220'))},64),
 esqueleto:unit('esqueleto',Object.assign({},byId('esqueleto')),48),
 bandido:unit('bandido',Object.assign({},byId('bandido')),52),
 b0:unit('b0',{eye:'#ffcc30',robe:'#2f5a2a',trim:'#1a1a14',belt:'#d8a24a',skin:'#3f7a38',sleeve:'#3f7a38',w:1.35,chestW:1.12,waist:.82,armW:1.4,legW:1.22,stance:1.15,plate:'#6a6e76',pauld:'#6a6e76',spikes:3,spikeC:'#d8d0b8',pants:'#3a2e22',boot:'#2a2218',brow:'#0c0c08',
  top:mix(ears('#3f7a38',.1),horns('#d8d0b8',.05,.22,.2,.7),(F,head,part)=>part(sph(.22,1,.75,1,12),'#6a6e76',0,.1,-.03,{p:head,ink:.014})),
  acc:mix((F)=>F.hold(0,-.9,axeW('#c0c6d0',.95,.3)))},77),
 bruja:unit('bruja',{eye:'#7fff7a',robe:'#4a2a6a',trim:'#e8c040',belt:'#e8c040',skin:'#8ab070',sleeve:'#4a2a6a',pants:'#3a2058',boot:'#2a1a3a',dress:true,hem:.06,flare:1.08,w:.95,
  top:mix(hat('#3a2058',{band:'#e8c040'}),(F,head,part)=>part(cone(.025,.1,5),'#6f9658',0,-.02,.23,{p:head,ink:0}).rotation.x=Math.PI/2+.5),acc:mix((F)=>F.hold(0,-.1,staffW('#7fffb0')),cracks('#7fffb0',0))},76),
 gigante:unit('gigante',{eye:'#cfe8ff',robe:'#6a5238',trim:'#8a7050',belt:'#d8b040',skin:'#a9c4e6',sleeve:'#a9c4e6',w:1.5,belly:.07,armW:1.35,legW:1.25,headK:.85,stance:1.2,strap:'#7a6040',pants:'#4a4038',boot:'#3a3028',brow:'#4a6a8a',
  top:mix(horns('#efe6cc',.05,.2,.17,.9),(F,head,part)=>part(sph(.22,1,.7,1,12),'#7a6040',0,.12,-.02,{p:head,ink:.014})),acc:mix((F)=>F.hold(0,-.8,club('#6a5238','#8a8a96',1,.13)),fur('#e8f0f8',.2,.84))},80),
 shinobi:unit('shinobi',{eye:'#ff4a3a',robe:'#24242e',trim:'#16161c',belt:'#b8302a',skin:'#d8b890',sleeve:'#24242e',pants:'#24242e',boot:'#16161c',w:.88,brow:'#0c0c10',
  top:mix((F,head,part)=>part(sph(.215,1,1.04,1.02,14),'#24242e',0,.02,-.03,{p:head,ink:.016}),(F,head,part)=>part(box(.4,.045,.4).scale(1,1,1),'#b8302a',0,.095,0,{p:head,ink:.006}),(F,head,part)=>part(sph(.19,1,.5,.6,10),'#24242e',0,-.07,.12,{p:head,ink:0})),
  acc:mix((F)=>F.hold(0,-1.1,katana()),(F,g,part)=>[-1,1].forEach(q=>part(new THREE.CylinderGeometry(.04,.04,.34,6),'#6a6a78',0,.7,.18,{p:g,ink:0}).rotation.z=q*.8))},52),
 golem:unit('golem',{eye:'#ffb040',robe:'#4a4044',trim:'#2a2226',belt:null,skin:'#5a4e52',sleeve:'#5a4e52',pants:'#3a3236',boot:'#2a2226',w:1.7,chestW:1.05,armW:1.5,legW:1.3,stance:1.2,pauld:'#6a5e62',headK:.85,brow:'#10100c',
  top:mix((F,head,part)=>part(box(.34,.3,.32),'#5a4e52',0,.04,0,{p:head,ink:.014}),(F,head,part)=>part(box(.28,.07,.04),'#6a5e62',0,.17,.14,{p:head,ink:0})),acc:mix(core(),cracks())},72),
 k0:unit('k0',{eye:'#e8b040',robe:'#8a2e2a',trim:'#2a2018',belt:'#e8c040',skin:'#c89868',sleeve:'#8a2e2a',w:1.15,chestW:1.1,waist:.88,armW:1.15,legW:1.1,strap:'#e8c040',pants:'#3a3a44',boot:'#2a2018',brow:'#2a1c12',
  top:mix(byId('bandido').top,(F,head,part)=>part(cone(.07,.22,5),'#c8302a',-.04,.2,-.1,{p:head,ink:.008}).rotation.z=.5),acc:mix((F)=>F.hold(0,-1.1,cleaver),cape('#8a1c1c',.85,.2))},62),
 b2:unit('b2',{eye:'#9affc0',robe:'#4a6a48',trim:'#2e4a30',belt:'#6a8a52',skin:'#e8e4cc',sleeve:'#e8e4cc',pants:'#3a5a3a',boot:'#2e4a30',dress:true,hem:.1,flare:1.05,w:.95,brow:'#3a4a30',
  top:mix((F,head,part)=>{for(let i=0;i<7;i++){const a=(i-3)*.38;part(cone(.02,.2+hash(i,1,1)*.14,4),'#6a8a52',Math.sin(a)*.2,.2,Math.cos(a)*.1-.02,{p:head,ink:.006}).rotation.z=-a*.6}}),acc:mix((F)=>F.hold(0,-.15,boneStaff),cape('#33503a',.8,.2))},70),
 b3:unit('b3',{eye:'#a8d8ff',robe:'#eef4ff',trim:'#c8d6ea',belt:'#c8d6ea',skin:'#dfe8f6',sleeve:'#eef4ff',pants:'#dfe8f6',boot:'#c8d6ea',w:1.5,belly:.06,armW:1.35,legW:1.25,headK:.88,stance:1.2,pauld:'#dfe8f6',brow:'#8aa0c0',
  top:mix(horns('#c8d8ee',.05,.2,.16,.6),(F,head,part)=>part(sph(.215,1,.8,1.05,12),'#f2f8ff',0,.07,-.03,{p:head,ink:.014})),acc:fur('#ffffff',.22,.84)},77),
 b4:unit('b4',{eye:'#ffe040',robe:'#a82a2a',trim:'#e8b62a',belt:'#e8b62a',skin:'#a82a2a',sleeve:'#a82a2a',w:1.35,chestW:1.12,waist:.8,armW:1.35,legW:1.2,stance:1.15,pauld:'#e8b62a',spikes:3,spikeC:'#18141a',strap:'#7a2a1c',pants:'#e8b62a',boot:'#4a1c1c',brow:'#1a0808',
  top:mix(horns('#efe0b8',.06,.3,.12,.3),(F,head,part)=>part(sph(.215,1,.8,1,10),'#18141a',0,.12,-.04,{p:head,ink:.012})),acc:(F)=>F.hold(0,-.8,kanabo)},89),
 b5:unit('b5',{eye:'#ffe27a',robe:'#3a2630',trim:'#1a1216',belt:'#ffb030',skin:'#e0482a',sleeve:'#e0482a',w:1.3,chestW:1.1,waist:.8,armW:1.25,legW:1.15,pauld:'#3a2630',spikes:2,spikeC:'#ffb030',pants:'#2a1c22',boot:'#1a1216',brow:'#1a0808',
  top:mix(horns('#2a1a1e',.06,.32,.13,.45),flame(0,.22,1.1)),acc:mix((F)=>F.hold(0,-.9,flameSword),flame(-.2,.95,.9),flame(.2,.95,.9))},94),
 k2:unit('k2',{eye:'#7fff7a',robe:'#2e1a48',trim:'#e8c040',belt:'#e8c040',skin:'#78a05e',sleeve:'#2e1a48',pants:'#3a2058',boot:'#2a1a3a',dress:true,hem:.06,flare:1.12,w:1.0,
  top:hat('#2e1a48',{band:'#e8c040'}),acc:mix((F)=>F.hold(0,-.1,staffW('#7fffb0',1.5)),orbs('#7fff7a',3,.36))},96),
 k3:unit('k3',{eye:'#cfe8ff',robe:'#3a4a68',trim:'#c8d8f0',belt:'#c8d8f0',skin:'#8ab0dc',sleeve:'#8ab0dc',w:1.5,belly:.06,armW:1.35,legW:1.25,headK:.85,stance:1.2,pauld:'#3a4a68',pants:'#4a4038',boot:'#3a3028',brow:'#4a6a8a',
  top:mix(horns('#efe6cc',.05,.2,.17,.9),(F,head,part)=>[-1,0,1].forEach(i=>part(cone(.035,.17+(i?0:.07),5),'#bfe8ff',i*.07,.23,.0,{p:head,ink:.006}))),acc:mix((F)=>F.hold(0,-.8,club('#4a5a78','#bfe8ff',1.05,.14)),fur('#e8f4ff',.21,.84),cape('#3a5a8a',.9,.24))},98),
 k4:unit('k4',{eye:'#ff4a3a',robe:'#3a1a24',trim:'#16161c',belt:'#e8e8f0',skin:'#d8b890',sleeve:'#3a1a24',pants:'#2a1a22',boot:'#16161c',w:.95,brow:'#0c0c10',
  top:HUM_shinobiTop(),acc:mix((F)=>{F.hold(0,-1.1,katana());F.hold(1,-1.1,katana('#c8b8c8'))},cape('#b8302a',.85,.2))},62),
 k5:unit('k5',{eye:'#ffb040',robe:'#3a3034',trim:'#2a2226',belt:null,skin:'#4a3e42',sleeve:'#4a3e42',pants:'#3a3236',boot:'#2a2226',w:1.8,armW:1.5,legW:1.3,stance:1.2,pauld:'#5a4e52',headK:.85,brow:'#10100c',
  top:mix((F,head,part)=>part(box(.36,.32,.34),'#4a3e42',0,.04,0,{p:head,ink:.014}),flame(0,.26,1.2),horns('#2a2226',.05,.2,.14,.4)),acc:mix(core('#ffb43a'),cracks('#ffb43a',6),flame(-.26,.92,1.3),flame(.26,.92,1.3))},108)};
function HUM_shinobiTop(){return(F,head,part)=>{part(sph(.215,1,1.04,1.02,14),'#3a1a24',0,.02,-.03,{p:head,ink:.016});part(box(.4,.045,.4),'#e8e8f0',0,.095,0,{p:head,ink:.006});part(sph(.19,1,.5,.6,10),'#24242e',0,-.07,.12,{p:head,ink:0})}}

// Ru (tendera): MUJER, con vestido largo y delantal (el vestido es la excepción permitida: `dress:true`), pelo recogido en moño con cinta, mejillas rosadas y sonrisa. Altura del héroe.
const RU={id:'ru',H:52,spec:{ph:2,dress:true,hem:.17,flare:1.1,robe:'#8a5a4a',trim:'#d8ccb0',belt:'#5a4a38',skin:'#e6bc98',sleeve:'#8a5a4a',w:.98,pants:'#4a4038',boot:'#3a2c20',blush:1,smile:1,
 top:mix(hairFn('bun','#5a3a28'),(F,head,part)=>{part(sph(.045,1.3,.8,.8,8),'#d8b050',.13,.15,.08,{p:head,ink:.008});part(sph(.04,1,1,1,8),'#d8b050',0,.2,-.12,{p:head,ink:.008})}),
 acc:(F,g,part)=>{part(box(.34,.5,.02).translate(0,.3,0),'#e6dcc0',0,.1,.2,{p:g,ink:.01});part(box(.2,.1,.025),'#c8bca0',0,.24,.215,{p:g,ink:0})}}};

// ── PNJ DE ALDEA (Fase 6, 20 oct 2026): Guardia, Herrera y Anciano. Diseños APROBADOS de `outfits3d.js` NPCS traducidos al spec de Mini (colores y piezas de ahí; el equipo va como `acc`,
//    porque estos actores se hornean y no pasan por HeroAnim). Datos de juego (nombre, sitio, diálogo) en `src/npcs.js` (VNPC, misma clave). Reglas de estilo: contorno negro, UN acento
//    (Guardia: emblema dorado · Herrera: pañuelo rojo · Anciano: orbe del bastón), pantalones en todos salvo la túnica larga del Anciano (id en Mini.DRESS_OK), sin capucha, sin mejillas rosadas.
//    `wave:false` = no saluda con el brazo al acercarse (lleva algo en esa mano): solo gira la cabeza hacia el héroe. H = altura de etiqueta en px de modelo (52 = héroe).
const spearW=(L=1.7)=>(F,h,p)=>{p(cyl(.017,.017,L,6),'#6a4a2e',0,L*.3,0,{p:h,ink:.012});p(cone(.045,.22,6),'#cfd4dc',0,L*.3+L/2+.08,0,{p:h,ink:.01});p(cyl(.03,.03,.03,8),'#8a8e96',0,L*.3+L/2-.02,0,{p:h,ink:.008})};
const hammerW=(F,h,p)=>{p(cyl(.022,.026,.42,6),'#5a3e2c',0,.1,0,{p:h,ink:.012});p(box(.2,.1,.1),'#6a6e76',0,.34,0,{p:h,ink:.012});p(box(.06,.07,.08),'#4a4e56',.13,.34,0,{p:h,ink:.01})};
const elderBeard=(c,L=.3,R=.12)=>(F,head,part)=>{part(cone(R,L,8).rotateX(Math.PI),c,0,-.2-L*.1,.13,{p:head,ink:.01});part(sph(.1,1.15,.7,.7,10),c,0,-.1,.17,{p:head,ink:.008})};
const elderStaff=(F,h,p)=>{const L=1.75;p(cyl(.02,.026,L,6),'#5a4030',0,L*.3,0,{p:h,ink:.012});p(new THREE.TorusGeometry(.07,.016,6,12),'#6a4a30',0,L*.3+L/2-.02,0,{p:h,ink:.008});p(sph(.065,1,1,1,10),'#8ec6ff',0,L*.3+L/2+.01,0,{p:h,ink:0,mat:glow('#6aaef0',1.15)})};
// ── ALDEANOS GENERADOS (Fase 25 · B2, 20 oct 2026): `src/villagers.js` (global NPCLK) describe CADA PNJ de aldea de los 9 biomas (cultura, oficio, colores, peinado, sombrero, herramienta); aquí se traduce al spec de Mini.
//    Clave de plantilla = id del PNJ (`v:<bioma>:<oficio><n>`). Herramientas de oficio en la mano (F.hold) y sombreros de cultura: tablas de datos, nada de ifs por personaje.
const vAxeW=(F,h,p)=>{p(cyl(.02,.024,.7,6),'#6a4a2e',0,.1,0,{p:h,ink:.012});p(box(.2,.16,.035),'#9aa0a8',.1,.4,0,{p:h,ink:.012});p(box(.04,.07,.05),'#5a5e66',-.01,.4,0,{p:h,ink:.01})};
const hoeW=(F,h,p)=>{p(cyl(.02,.024,1.15,6),'#7a5a36',0,.2,0,{p:h,ink:.012});p(box(.2,.08,.03),'#7a7e86',0,.78,.07,{p:h,ink:.012})};
const rodW=(F,h,p)=>{p(cyl(.008,.016,1.55,5),'#8a6a3a',0,.55,.08,{p:h,ink:.01}).rotation.x=.35;p(cyl(.004,.004,.55,3),'#d8d8d0',0,1.35,.32,{p:h,ink:0})};
const broomW=(F,h,p)=>{p(cyl(.016,.02,1.1,6),'#8a6a3a',0,.3,0,{p:h,ink:.012});p(cone(.1,.34,8).rotateX(Math.PI),'#c8a860',0,-.18,0,{p:h,ink:.012})};
const ladleW=(F,h,p)=>{p(cyl(.012,.014,.42,5),'#6a4a30',0,.1,0,{p:h,ink:.01});p(sph(.06,1,.6,1,8),'#9a9aa2',0,.33,0,{p:h,ink:.01})};
const luteW=(F,h,p)=>{p(sph(.13,1,.55,1.2,12),'#a8743c',0,.1,.1,{p:h,ink:.012});p(cyl(.015,.018,.5,5),'#6a4a2e',0,.42,.1,{p:h,ink:.01});p(box(.07,.07,.03),'#4a3426',0,.7,.1,{p:h,ink:.008})};
const basketW=(F,h,p)=>{p(cyl(.17,.13,.16,10),'#b88a4a',0,.02,.04,{p:h,ink:.012});p(new THREE.TorusGeometry(.17,.015,6,14).rotateX(Math.PI/2),'#8a6a3a',0,.1,.04,{p:h,ink:.008});p(sph(.1,1.4,.7,1,6),'#c84a3a',.03,.12,.04,{p:h,ink:0})};
const bucketW=(F,h,p)=>{p(cyl(.11,.09,.2,10),'#7a5a36',0,0,.04,{p:h,ink:.012});p(new THREE.TorusGeometry(.11,.01,5,12,Math.PI),'#8a8e96',0,.1,.04,{p:h,ink:.006})};
const bookW=(F,h,p)=>{p(box(.2,.05,.27),'#7a2a2a',0,.05,.1,{p:h,ink:.01});p(box(.18,.03,.25),'#e8dcc0',0,.05,.105,{p:h,ink:0})};
const scrollW=(F,h,p)=>{p(cyl(.03,.03,.3,8).rotateZ(Math.PI/2),'#e8dcb8',0,.05,.1,{p:h,ink:.008});p(cyl(.034,.034,.03,8).rotateZ(Math.PI/2),'#8a4a2a',-.09,.05,.1,{p:h,ink:.006})};
const swordW=(F,h,p)=>{p(box(.05,.62,.015),'#cfd4dc',0,.42,0,{p:h,ink:.01});p(box(.16,.03,.03),'#8a6a30',0,.1,0,{p:h,ink:.008});p(cyl(.015,.015,.12,5),'#4a3426',0,.03,0,{p:h,ink:.008})};
const TOOLW={hammer:hammerW,axe:vAxeW,hoe:hoeW,rod:rodW,broom:broomW,ladle:ladleW,lute:luteW,basket:basketW,bucket:bucketW,book:bookW,scroll:scrollW,staff:elderStaff,spear:spearW(),sword:swordW};
const HATW={
 cap:(c)=>(F,head,part)=>{part(new THREE.SphereGeometry(.215,16,10,0,6.3,0,1.2).scale(1,.9,1.03),c,0,.07,-.02,{p:head,ink:.014});part(box(.28,.025,.14),c,0,.07,.18,{p:head,ink:.01})},
 straw:(c,c2)=>(F,head,part)=>{part(cyl(.36,.36,.025,20),c,0,.16,0,{p:head,ink:.012});part(cone(.2,.2,10),c,0,.27,0,{p:head,ink:.012});if(c2)part(cyl(.205,.205,.04,12),c2,0,.19,0,{p:head,ink:.006})},
 turban:(c,c2)=>(F,head,part)=>{part(sph(.25,1,.85,1,14),c,0,.12,0,{p:head,ink:.014});part(new THREE.TorusGeometry(.22,.05,7,16).rotateX(Math.PI/2),c2||c,0,.08,0,{p:head,ink:.01})},
 wizard:(c,c2)=>hat(c,{band:c2||'#e8c040'}),
 fur:(c)=>(F,head,part)=>{part(new THREE.SphereGeometry(.23,16,10,0,6.3,0,1.35).scale(1,.9,1.05),c,0,.08,-.01,{p:head,ink:.016});part(new THREE.TorusGeometry(.2,.06,7,16).rotateX(Math.PI/2),'#efe6cc',0,.05,0,{p:head,ink:.012})},
 band:(c)=>(F,head,part)=>{part(new THREE.TorusGeometry(.205,.03,6,18).rotateX(Math.PI/2),c,0,.1,-.01,{p:head,ink:.008})},
 sailor:(c,c2)=>(F,head,part)=>{part(new THREE.SphereGeometry(.215,16,10,0,6.3,0,1.15).scale(1,.85,1.03),c,0,.07,-.02,{p:head,ink:.014});part(new THREE.TorusGeometry(.2,.025,6,16).rotateX(Math.PI/2),c2||'#2a3a5a',0,.1,-.01,{p:head,ink:.006})},
 horn:(c)=>horns(c,.04,.16,.14,.5),
 feather:(c,c2)=>(F,head,part)=>{part(new THREE.TorusGeometry(.205,.03,6,18).rotateX(Math.PI/2),c,0,.1,-.01,{p:head,ink:.008});part(cone(.025,.3,5),c2||'#d8d0b0',.17,.26,0,{p:head,ink:.008}).rotation.z=-.35}};
function vdef(key){const L=NPCLK[key],sp={ph:L.ph,robe:L.robe,trim:L.trim,belt:L.belt,skin:L.skin,sleeve:L.sleeve||L.robe,pants:L.pants,boot:L.boot,w:L.w,chestW:L.chestW,brow:L.hair,k0:L.k0,id:key};
 if(L.dress){sp.dress=true;sp.hem=.12;sp.flare=1.08;if(!Mini.DRESS_OK.includes(key))Mini.DRESS_OK.push(key)}
 if(L.blush){sp.blush=1;sp.smile=1}if(L.lean)sp.lean=L.lean;
 const hair=hairFn(L.hs,L.hair),hatF=L.hat&&HATW[L.hat]?HATW[L.hat](L.hatC||L.trim,L.hatC2):null,beardF=L.beard?elderBeard(L.hair,L.beard,.1):null;sp.top=mix(hair,hatF,beardF);
 const tool=TOOLW[L.tool],hand=L.hand==null?0:L.hand;
 sp.acc=(F,g,part)=>{if(L.apron)part(box(.32,.44,.025).translate(0,-.22,0),L.apron,0,.58,.2,{p:g,ink:.012});if(L.scarf)part(new THREE.TorusGeometry(.16,.035,6,14).rotateX(Math.PI/2),L.scarf,0,.86,.01,{p:g,ink:.01});
  if(L.pauld)part(box(.4,.07,.2),L.pauld,0,.84,0,{p:g,ink:.012});if(L.sash)part(box(.34,.06,.24),L.sash,0,.46,0,{p:g,ink:.01});if(tool)F.hold(hand,L.rx==null?-.9:L.rx,tool)};
 return{id:key,H:L.H,wave:!!L.wave,spec:sp}}
const NPC_DEF={
 guardia:{id:'guardia',H:55,wave:false,spec:{ph:3,robe:'#5a5a62',trim:'#8a8e96',belt:'#3a2a20',skin:'#d0a07a',sleeve:'#8a8e96',pants:'#4a4a5a',boot:'#3a3a44',w:1.06,chestW:1.05,plate:'#8a8a92',pauld:'#8a8a90',brow:'#2a1a12',
  top:mix(hairFn('cut','#3a2a20',true),(F,head,part)=>{part(new THREE.SphereGeometry(.215,16,10,0,6.3,0,1.65).scale(1,1.05,1),'#8a8a90',0,.04,0,{p:head,ink:.018});part(box(.03,.14,.03),'#7a7a82',0,0,.22,{p:head,ink:.01});part(cyl(.235,.235,.03,18),'#7a7a82',0,.045,0,{p:head,ink:.014})}),
  acc:(F,g,part)=>{part(box(.2,.6,.02),'#6a2a2a',0,.46,.215,{p:g,ink:.012});part(box(.2,.6,.02),'#5a2222',0,.46,-.215,{p:g,ink:.012});part(sph(.04,1,1.3,.4,6),'#d8b050',0,.6,.23,{p:g,ink:0});F.hold(0,0,spearW())}}},
 herrera:{id:'herrera',H:50,wave:true,spec:{ph:1.1,robe:'#7a5a46',trim:'#4a3426',belt:'#3a2a20',skin:'#b5764a',sleeve:'#7a5a46',pants:'#4a3a32',boot:'#2e2218',w:.98,chestW:1.02,brow:'#2a1a12',
  top:(F,head,part)=>{part(new THREE.SphereGeometry(.21,16,10,0,6.3,0,1.45).scale(1,1,1.02),'#8a3a2a',0,.04,-.03,{p:head,ink:.016});part(sph(.085),'#2a1a12',0,.17,-.17,{p:head,ink:.012});part(sph(.05),'#8a3a2a',0,.08,-.22,{p:head,ink:.01})},
  acc:(F,g,part)=>{part(box(.34,.44,.025).translate(0,-.22,0),'#4a3426',0,.58,.2,{p:g,ink:.012}).rotation.x=.1;part(box(.2,.22,.025),'#4a3426',0,.62,.2,{p:g,ink:.01});part(box(.09,.07,.06),'#6a4a30',-.19,.34,.14,{p:g,ink:.012});F.hold(1,-.9,hammerW)}}},
 anciano:{id:'anciano',H:47,wave:false,spec:{ph:4.2,dress:true,hem:.06,flare:1.08,robe:'#33335a',trim:'#8a7a5a',belt:'#8a7a5a',skin:'#e0bc9a',sleeve:'#33335a',w:.95,lean:.22,brow:'#c8c4bc',
  top:mix(hairFn('mane','#d8d4cc'),elderBeard('#d8d4cc',.32,.12)),
  acc:(F,g,part)=>{part(new THREE.CylinderGeometry(.15,.3,.26,18,1,true).translate(0,.8,0),'#2a2a44',0,0,0,{p:g,ink:.014,t:{side:THREE.DoubleSide}});F.hold(0,0,elderStaff)}}}};
// ── CAJEROS y TENDEROS de los interiores (Lote R3D-F15b-PULIDO, 20 oct 2026): 2 oficios × 6 civilizaciones (`cajero@k`, `tendero@k`; k = índice de PALS 0..5). Solo los usa `interiors3d.js` (makeActor): no son PNJ con diálogo todavía (Fase 25).
//    Ropa de la cultura (ROBE), delantal o chaleco de oficio; pelo corto (cajero) o moño (tendera). Sin capucha, con pantalones, sin mejillas rosadas (reglas de PNJ).
const ROBE=['#4f7a4a','#3f7a46','#8a7a3a','#3a5a8a','#b8302a','#8a2a1a'],HAIR=['#6a4a2a','#3a2a1a','#2a1a12','#d8c8a0','#1a1410','#2a1a14'],SKINS=['#e0b690','#d8a878','#b5764a','#f0d0b8','#e8c8a0','#c08a60'];
for(let k=0;k<6;k++){const rb=ROBE[k];
 NPC_DEF['cajero@'+k]={id:'cajero@'+k,H:50,wave:false,spec:{ph:k*1.3,robe:rb,trim:'#f1e4c4',belt:'#3a2a20',skin:SKINS[k],sleeve:rb,pants:'#4a3a32',boot:'#2e2218',w:1,chestW:1.02,brow:'#2a1a12',top:hairFn('cut',HAIR[k]),
  acc:(F,g,part)=>{part(box(.3,.36,.025).translate(0,-.18,0),'#e8dcc0',0,.6,.2,{p:g,ink:.012});part(box(.09,.07,.04),'#d8b050',.12,.5,.215,{p:g,ink:0})}}};
 NPC_DEF['tendero@'+k]={id:'tendero@'+k,H:48,wave:false,spec:{ph:k*1.7+1,robe:'#7a5a46',trim:rb,belt:rb,skin:SKINS[(k+2)%6],sleeve:'#7a5a46',pants:'#4a3a32',boot:'#2e2218',w:.98,chestW:1.04,brow:'#2a1a12',top:hairFn('bun',HAIR[(k+3)%6]),
  acc:(F,g,part)=>{part(box(.34,.46,.025).translate(0,-.23,0),rb,0,.6,.2,{p:g,ink:.012});part(box(.2,.2,.025),mix2(rb),0,.62,.2,{p:g,ink:.01})}}}}
const mix2=c=>c;
// ── GABRIEL (Lote CINE-2, 21 oct 2026): ángel caído, jefe del tutorial y protagonista de la cinemática «La caída de Gabriel» (docs/GUION_TUTORIAL.md, docs/PROMPT_INVIDEO_CINEMATICA_GABRIEL.md).
//    ≈1,2× el héroe (H=64). Túnica blanca-gris rasgada (con pantalones: regla de PNJ), faja y hombrera dorada gastadas, pelo largo blanco-dorado, ALAS ROTAS horneadas (`angelWings`, wings3d.js: ala derecha alzada y la izquierda caída, con plumas que faltan y puntas quemadas). El HALO agrietado NO se hornea: es una malla emisiva aparte colgada del hueso de la cabeza (`gabriel3d.js`) para poder apagarlo.
NPC_DEF.gabriel={id:'gabriel',H:64,wave:false,spec:{ph:2.2,browT:-.4,robe:'#b6b1a2',trim:'#a58d55',belt:'#7a6840',skin:'#dcc3a4',sleeve:'#aaa595',pants:'#7c776a',boot:'#51483c',w:1.04,chestW:1.08,lean:.08,brow:'#d9d6cc',
 top:mix(hairFn('mane','#d6cfb2'),elderBeard('#d6cfb2',.2,.1)),
 acc:mix(angelWings({q:1,span:1.1,hole:.12,burnt:.2,seed:3}),angelWings({q:-1,span:1.05,droop:.82,hole:.22,burnt:.3,seed:7}),
  (F,g,part)=>{part(box(.2,.5,.02).translate(0,-.25,0),'#b3ae9e',0,.5,.2,{p:g,ink:.01}).rotation.x=.08;part(box(.2,.62,.02).translate(0,-.31,0),'#a49f90',.04,.5,-.2,{p:g,ink:.01}).rotation.x=-.08;   // jirones de túnica delante y detrás
   part(box(.4,.07,.22),'#b79f66',0,.84,0,{p:g,ink:.012});part(sph(.1,1.2,.6,.9,10),'#b79f66',-.2,.83,0,{p:g,ink:0})}) }};   // hombreras doradas gastadas
HUM.gabriel=unit('gabriel',NPC_DEF.gabriel.spec,64);   // ISLA-6: Gabriel como ENEMIGO (jefe del tutorial); el modelo es el mismo del PNJ/cinemática
export const NPC_IDS=['ru',...Object.keys(NPC_DEF)];

// plantilla de un humanoide: Mini → bake. La escala k se deja FUERA (grupo del actor) para poder cambiarla sin reconstruir.
function buildHuman(def){const s=Object.assign({},def.spec);s.k=1;s.id=def.id;Mini.detail=.62;let m;try{m=new Mini(s)}finally{Mini.detail=0}m.setInk(true);m.root.scale.setScalar(1);
 const bn=[[m.root,'root'],[m.pelvis,'pelvis'],[m.chest,'chest'],[m.body,'body'],[m.head,'head'],[m.legs[0],'legR'],[m.legs[1],'legL'],[m.knees[0],'kneeR'],[m.knees[1],'kneeL'],[m.ankles[0],'ankR'],[m.ankles[1],'ankL'],
  [m.arms[0],'armR'],[m.arms[1],'armL'],[m.elbows[0],'elbR'],[m.elbows[1],'elbL'],[m.grips[0],'gripR'],[m.grips[1],'gripL']];
 const t=bake(m.obj,bn,new THREE.Color(m.skinC).getHex());t.kind='human';t.k=(def.H/52)*HK/1.25*(s.k0||1);t.mini={W:m.W};t.lean=m.lean||0;t.dress=!!m.dress;t.rad=.9;t.h=def.H/52*HK;t.cycle=.85*def.H/52*HK;t.eye=[.07,.012,.212,.04];t.eyeCol=s.eye||'#ffd36a';
 // las órbitas (Morgana) y otros objetos independientes no se hornean: quedan en m; no se usan (se animan sólo con huesos)
 m.obj.traverse(o=>{if(o.geometry)o.geometry.dispose()});return t}

const TPL=new Map();
function tplFor(key){if(TPL.has(key))return TPL.get(key);let t=null;try{
  if(key==='ru')t=buildHuman(RU);else if(key.startsWith('v:')&&typeof NPCLK!=='undefined'&&NPCLK[key]){t=buildHuman(vdef(key));t.nowave=!NPCLK[key].wave}else if(NPC_DEF[key]){t=buildHuman(NPC_DEF[key]);t.nowave=NPC_DEF[key].wave===false}else if(HUM[key]){const d=HUM[key];const sp=Object.assign({},d.spec);t=buildHuman({id:key,H:d.H,spec:Object.assign(sp,{top:d.spec.top,acc:d.spec.acc})})}
  else if(QUADS[key])t=buildQuad(key);else if(key==='gallina')t=buildBird();else if(key==='rana')t=buildFrog()}catch(e){console.warn('[R3D actors]',key,e);t=null}
 if(t)console.info('[R3D actors]',key,t.kind,t.tris+' tris');TPL.set(key,t);return t}
export const ACTOR_IDS=[...Object.keys(HUM),...Object.keys(QUADS),'gallina','rana'];

// ═══════════════════════════════ ACTOR (instancia) ═══════════════════════════════
const AX=new THREE.Vector3(1,0,0);
export class Actor{
 constructor(tpl,key,e,W3){this.tpl=tpl;this.key=key;this.e=e;this.W3=W3;this.grp=new THREE.Group();this.grp.name='actor:'+key;
  const bones=tpl.local.map(l=>{const b=new THREE.Bone();b.position.copy(l.p);b.quaternion.copy(l.q);b.scale.copy(l.s);return b});tpl.parent.forEach((p,i)=>p>=0&&bones[p].add(bones[i]));this.grp.add(bones[0]);
  this.b={};tpl.names.forEach((n,i)=>this.b[n]=bones[i]);this.rest={};tpl.names.forEach((n,i)=>this.rest[n]=bones[i].quaternion.clone());this.restP={};tpl.names.forEach((n,i)=>this.restP[n]=bones[i].position.clone());
  const sk=new THREE.Skeleton(bones,tpl.inv);this.mesh=new THREE.SkinnedMesh(tpl.geo,MATS);this.mesh.bind(sk,new M4());this.hull=new THREE.SkinnedMesh(tpl.hgeo,INK);this.hull.bind(sk,new M4());
  this.mesh.frustumCulled=this.hull.frustumCulled=false;this.mesh.castShadow=true;this.mesh.receiveShadow=true;this.hull.castShadow=false;this.grp.add(this.mesh,this.hull);
  this.sc=tpl.k;this.grp.scale.setScalar(this.sc);this.face=0;this.faceT=0;this.ph=hash(e.x,e.y,3)*6.28;this.mv=0;this.last=null;this.state='live';this.td=0;this.hov=false;this.fl=false;this.vis=true;
  this.E=new Euler0();this.aw=0;this.seed=hash(e.x*.01,e.y*.01,7)*6.28;this.breath=0;this.peck=0}
 // DESTELLO DE OJOS (aviso de golpe de enemigos normales, 21 oct 2026): dos halos aditivos colgados del hueso 'head'; i = 0..1 (intensidad); >.85 = fogonazo blanco
 eyeFx(i){const T=this.tpl;if(!T.eye||!this.b.head)return;
  if(i<=.01){if(this.eg)this.eg.visible=false;return}
  if(!this.eg){const g=this.eg=new THREE.Group(),r=T.eye[3];[-1,1].forEach(q=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:EYETEX,color:T.eyeCol,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));s.position.set(T.eye[0]*q,T.eye[1],T.eye[2]+r*1.2);g.add(s)});g.userData.r=r;this.b.head.add(g)}
  const g=this.eg,r=g.userData.r,f=i>.85;g.visible=true;g.children.forEach(s=>{s.scale.setScalar(r*(3+i*3.5+(f?2.5:0)));s.material.color.set(f?'#fff4d0':T.eyeCol);s.material.opacity=Math.min(1,.35+i*.75)})}
 addXray(){if(this.xr)return;this.xr=new THREE.SkinnedMesh(this.tpl.geo,XRAYM);this.xr.bind(this.mesh.skeleton,new M4());this.xr.frustumCulled=false;this.xr.renderOrder=6;this.grp.add(this.xr)}
 setHover(on){if(on===this.hov)return;this.hov=on;this.hull.material=on?HOVER:INK}
 setFlash(on){if(on===this.fl)return;this.fl=on;this.mesh.material=on?FLASH:MATS}
 dispose(){this.grp.removeFromParent();if(this.proxy)this.proxy.removeFromParent();this.mesh.skeleton&&this.mesh.skeleton.dispose()}
 // helpers de pose: rotación = reposo · euler(x,y,z)
 rot(n,x=0,y=0,z=0){const b=this.b[n];if(!b)return;this.E.set(x,y,z);b.quaternion.copy(this.rest[n]).multiply(this.E.q())}
}
class Euler0{constructor(){this.e=new THREE.Euler(0,0,0,'YXZ');this._q=new QT()}set(x,y,z){this.e.set(x,y,z,'YXZ');this._q.setFromEuler(this.e)}q(){return this._q}}

const JOBF={hammer:5.2,chop:2.4,hoe:2.2,fish:1,knead:3,sweep:2.4,lute:2.4,read:1,carry:1,sweat:2,pose:1};   // rad/s de cada oficio (ver animHuman)
// ── animación humanoide: andar por distancia, respiración, ataque (anticipación → golpe → recuperación), saludo (Ru) ──
function animHuman(A,s){const {t,mv,at,wave,look,job}=s,ph=A.ph,sn=Math.sin(ph),cs=Math.cos(ph),a=mv,br=Math.sin(t*1.9+A.seed)*.5+.5;
 const lean=A.tpl.lean||0;
 // piernas: oscilan en oposición; la rodilla se dobla cuando la pierna pasa hacia delante
 A.rot('legR',-sn*.62*a,0,0);A.rot('legL',sn*.62*a,0,0);A.rot('kneeR',Math.max(0,cs)*.9*a+.04,0,0);A.rot('kneeL',Math.max(0,-cs)*.9*a+.04,0,0);A.rot('ankR',-.2*Math.max(0,-sn)*a,0,0);A.rot('ankL',-.2*Math.max(0,sn)*a,0,0);
 A.b.pelvis.position.y=A.restP.pelvis.y-Math.abs(cs)*.018*a-br*.006*(1-a);
 // torso: torsión contraria a las caderas, respiración; brazos en oposición a las piernas
 let cx=lean+br*.012,cy=sn*.14*a,ar=-sn*.5*a,al=sn*.5*a,er=.15+Math.max(0,cs)*.3*a,el=.15+Math.max(0,-cs)*.3*a,arz=0,hx=0,lunge=0;
 if(at>=0){ // ataque (at=0 es el instante del golpe del juego): anticipación rápida 0–.18, tajo .18–.30, recuperación .30–.85
  const w=ss(0,.18,at),k=ss(.18,.3,at),r=ss(.3,.85,at),up=w*(1-k),dn=k;
  ar=lerp(-2.6*up+.5*dn,ar,r);er=lerp(.2+.7*up,er,r);arz=lerp(-.25*w,0,r);al=lerp(al,-.9*w*(1-k)+.3*k,1-r);
  cx+=(-.15*w*(1-k)+.3*k)*(1-r);cy+=(.3*w*(1-k)-.45*k)*(1-r);hx=(-.2*w*(1-k)+.2*k)*(1-r);lunge=k*(1-r)*.12}
 A.b.root.position.z=A.restP.root.z+lunge;
 if(job&&a<.3&&at<0){const ph2=t*(JOBF[job]||3)+A.seed;   // OFICIOS (Fase 25): bucles de brazo/torso mientras el PNJ esta parado trabajando
  if(job==='hammer'){ar=-1.1-Math.max(0,Math.sin(ph2*1.6))*1.3;er=.9;al=-.7;el=.9;cx+=.05*Math.sin(ph2*1.6)}
  else if(job==='chop'){const w=Math.max(0,Math.sin(ph2));ar=-.4-w*2.3;er=.3+w*.5;al=-.5-w*1.2;el=.4;cx+=.14*(1-w)-.1*w}
  else if(job==='hoe'){const w=Math.max(0,Math.sin(ph2));ar=-.7-w*1.2;al=-.7-w*1.2;er=.3;el=.3;cx+=.3*(1-w)*.6+.1}
  else if(job==='fish'){ar=-1.05+Math.sin(t*.9+A.seed)*.04;al=-.85;er=.5;el=.5;cy+=.12}
  else if(job==='knead'){ar=-.9+Math.sin(ph2)*.25;al=-.9-Math.sin(ph2)*.25;er=.7;el=.7;cx+=.12}
  else if(job==='sweep'){ar=-.8+Math.sin(ph2)*.22;al=-.7+Math.sin(ph2)*.22;er=.3;el=.3;cx+=.18;cy+=Math.sin(ph2)*.22}
  else if(job==='lute'){ar=-1.0+Math.sin(ph2*2)*.1;al=-.9;er=.9;el=1.0;cy+=.1}
  else if(job==='read'){ar=-.9;al=-.9;er=.9;el=.9;cx+=.12;hx=.25}
  else if(job==='carry'){ar=-.8;al=-.8;er=1.0;el=1.0}
  else if(job==='sweat'){ar=-.5+Math.sin(ph2)*.1;er=.2}
  else if(job==='pose'){ar=-.25;al=-.25;er=.15;el=.15}}
 if(wave>0){ar=-2.7+Math.sin(t*9)*.25;arz=-.5;er=.5+Math.sin(t*9)*.3}
 A.rot('chest',cx,cy,0);A.rot('armR',ar,0,arz);A.rot('armL',al,0,0);A.rot('elbR',-er,0,0);A.rot('elbL',-el,0,0);
 // cabeza: sigue al objetivo (look = giro relativo al cuerpo, rad) y respira
 A.rot('head',hx-lean*.7+Math.sin(t*.6+A.seed)*.03,cl(look||0,-.9,.9)+Math.sin(t*.4+A.seed)*.1*(look?0:1),0)}

// ── cuadrúpedos: marcha diagonal, cuello/cabeza, cola, mordisco ──
function animQuad(A,s){const {t,mv,at}=s,ph=A.ph,sn=Math.sin(ph),a=mv,br=Math.sin(t*1.7+A.seed)*.5+.5,til=A.tpl.tilt;
 const sw=.7*a;A.rot('legFL',sn*sw,0,0);A.rot('legBR',sn*sw,0,0);A.rot('legFR',-sn*sw,0,0);A.rot('legBL',-sn*sw,0,0);
 A.b.body.position.y=A.restP.body.y+Math.abs(Math.cos(ph))*.025*a*A.sc*0+br*.006*(1-a);
 A.rot('body',Math.sin(ph*2)*.03*a+(til?Math.sin(ph)*.0:0),til?Math.sin(ph)*.12*a:0,0);
 let hp=Math.sin(ph*2)*.05*a+br*.03*(1-a)+Math.sin(t*.5+A.seed)*.04,hy=Math.sin(t*.7+A.seed)*.18*(1-a),lunge=0;
 if(at>=0){const w=ss(0,.18,at),k=ss(.18,.3,at),r=ss(.3,.85,at);hp=lerp(-.55*w*(1-k)+.95*k,hp,r);lunge=k*(1-r)*.22;A.rot('body',(-.15*w*(1-k)+.1*k)*(1-r),0,0);A.b.root.position.z=A.restP.root.z+lunge*A.tpl.rad*.5}
 else A.b.root.position.z=A.restP.root.z;
 A.rot('head',hp,hy,0);A.rot('tail',-.2+Math.sin(t*(mv>.2?9:2.4)+A.seed)*.3*(0.4+a),Math.sin(t*(mv>.2?7:2)+A.seed)*.35,0);if(A.b.tail2)A.rot('tail2',Math.sin(t*3+1)*.3,Math.sin(t*2.5+2)*.35,0)}

function animBird(A,s){const {t,mv,at}=s,ph=A.ph,sn=Math.sin(ph);A.rot('legL',sn*.8*mv,0,0);A.rot('legR',-sn*.8*mv,0,0);A.b.body.position.y=A.restP.body.y+Math.abs(Math.cos(ph))*.012*mv;
 A.peck=Math.max(0,A.peck-s.dt*2.5);if(!mv&&A.peck<=0&&hash(Math.floor(t*.7),A.seed,1)>.82&&Math.sin(t*.7)>.2)A.peck=1;const pk=Math.sin(Math.min(1,A.peck)*Math.PI);
 A.rot('head',.15*Math.sin(ph*2)*mv+pk*1.0+Math.sin(t*.9+A.seed)*.08,Math.sin(t*.5+A.seed)*.3*(1-mv),0);A.rot('body',pk*.35,0,0);
 const fl=at>=0?Math.sin(at*Math.PI*5)*.9*(1-at):0;A.rot('wingL',0,0,-.25-fl);A.rot('wingR',0,0,.25+fl);A.rot('tail',-.15+Math.sin(t*3+A.seed)*.05,0,0)}
function animFrog(A,s){const {t,mv,at}=s,ph=A.ph,h=Math.max(0,Math.sin(ph)),sq=1-h;A.b.root.position.y=A.restP.root.y+h*.22*mv;A.rot('body',-.25*h*mv+.12*sq*mv,0,0);
 A.rot('legBL',.9*sq*mv-h*.9*mv,0,0);A.rot('legBR',.9*sq*mv-h*.9*mv,0,0);A.rot('legFL',-h*.7*mv,0,0);A.rot('legFR',-h*.7*mv,0,0);
 const br=Math.sin(t*2.2+A.seed)*.5+.5;A.b.body.scale.set(1,1+br*.04*(1-mv),1+br*.03*(1-mv));let hd=Math.sin(t*.6+A.seed)*.1;if(at>=0)hd=(-.5*ss(0,.18,at)*(1-ss(.18,.3,at))+.9*ss(.18,.3,at))*(1-ss(.3,.85,at));A.rot('head',hd,0,0)}
export const ANIM={human:animHuman,quad:animQuad,bird:animBird,frog:animFrog};
// Para visores y pruebas (sin el juego): un actor suelto de un tipo. Pose = ANIM[A.tpl.kind](A,{t,dt,mv,at,wave,look}); A.ph avanza con la distancia (ver step()).
export function makeActor(key,W3){const tpl=tplFor(key);return tpl?new Actor(tpl,key,{x:0,y:0},W3||((x,y,z)=>new THREE.Vector3(x,z,y))):null}
export {tplFor};

// ═══════════════════════════════ GESTOR ═══════════════════════════════
export class Actors{
 constructor(scene,W3,occ){this.scene=scene;this.W3=W3;this.occ=occ;this.grp=new THREE.Group();this.grp.name='actors3d';scene.add(this.grp);this.map=new Map();this.on=true;this.stats={vivos:0,total:0,plantillas:0};
  // aro de jefe bajo los pies (rojo = jefe, azul = capitán): sustituye al óvalo del sprite 2D
  this.ringG=new THREE.RingGeometry(.55,.7,32).rotateX(-Math.PI/2);this.ringM={1:new THREE.MeshBasicMaterial({color:'#ff3030',transparent:true,opacity:.35,depthWrite:false}),2:new THREE.MeshBasicMaterial({color:'#40b0ff',transparent:true,opacity:.35,depthWrite:false})}}
 keyOf(e,isNpc){if(isNpc)return e.id==='ru'||(e.npc&&(NPC_DEF[e.id]||(typeof NPCLK!=='undefined'&&NPCLK[e.id])))?e.id:null;return e.d&&e.d.id}
 // ¿hay un actor 3D dibujándose para esta entidad? (game.js: si sí, omite el sprite 2D y dibuja solo barra de vida y etiqueta)
 // PRECARGA (21 oct 2026): hornea TODAS las plantillas durante la carga (antes se horneaba la 1.ª vez que aparecía cada criatura = tirón)
 bake(){try{ACTOR_IDS.concat(['ru'],Object.keys(NPC_DEF)).forEach(k=>tplFor(k))}catch(e){console.warn('[R3D actors bake]',e)}}
 // objetos desechables para precompilar el programa de la silueta (R3D.warmShaders): un PNJ con su malla de rayos X
 warmObjs(){try{const A=makeActor('ru');if(!A)return[];A.addXray();if(!this.lockM)this.lockM=new THREE.MeshBasicMaterial({color:'#ffd98a',transparent:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending});A.grp.add(new THREE.Mesh(this.ringG,this.lockM));return[A.grp]}catch(e){return[]}}
 lock(e){this.lockE=e||null}   // objetivo fijado (Tab): anillo dorado bajo sus pies
 has(e){const a=this.map.get(e);return !!(a&&a.vis&&a.state!=='gone')}
 // Altura de la cabeza en «px de mundo» del sprite (1 unidad 3D = 34,3 px de pantalla a escala 1 = 22,9 px de mundo con SPR=1,5): game.js cuelga de ahí la barra de vida y la etiqueta
 topPx(e){const A=this.map.get(e);if(!A)return 0;return A.tpl.h*(ISO.HW*2/Math.SQRT2)*Math.cos(Math.PI/6)/(typeof SPR!=='undefined'?SPR:1.5)+4}
 // Ru: su etiqueta usa «lh» (px de pantalla a escala 1; game.js divide por SPR)
 labelH(e){return this.topPx(e)*(typeof SPR!=='undefined'?SPR:1.5)}
 update(now,t,dt,tgt,R,hov,P_){if(!this.on)return;const TW=ISO.TILE,R2=R*R;let live=0;const seen=new Set();this.nw=0;   /* nw: actores nuevos este fotograma (tope 3: cada plantilla se hornea la 1.ª vez y un pueblo entero de golpe daba un tirón) */
  const consider=(e,isNpc)=>{const key=this.keyOf(e,isNpc);if(!key)return;const px=e.x/TW,pz=e.y/TW,dx=px-tgt.x,dz=pz-tgt.z;if(dx*dx+dz*dz>R2)return;seen.add(e);let A=this.map.get(e);
   const alive_=isNpc||alive(e,now);
   if(!A){if(!alive_)return;if(this.nw>=3)return;const tpl=tplFor(key);if(!tpl)return;this.nw++;A=new Actor(tpl,key,e,this.W3);A.isNpc=isNpc;if(isNpc&&A.tpl.kind==='human')A.addXray();this.map.set(e,A);this.grp.add(A.grp);A.last=null;
    if(this.occ){A.proxy=new THREE.SkinnedMesh(tpl.geo,DEPTHM);A.proxy.bind(A.mesh.skeleton,new M4());A.proxy.layers.set(3);A.proxy.frustumCulled=false;this.occ.add(A.proxy)}}   // copia de solo profundidad para el renderer del héroe (capa 3)
   this.step(A,e,isNpc,alive_,now,t,dt,hov,P_);if(A.vis)live++};
  for(let i=0;i<M.length;i++)consider(M[i],false);for(let i=0;i<ST.length;i++)if(ST[i].id==='ru'||ST[i].npc)consider(ST[i],true);
  // fuera de rango → fuera
  for(const [e,A] of this.map)if(!seen.has(e)){A.dispose();this.map.delete(e)}
  this.stats={vivos:live,total:this.map.size,plantillas:TPL.size}}
 step(A,e,isNpc,alive_,now,t,dt,hov,P_){
  // vida / muerte
  if(!alive_&&A.state==='live'){A.state='dying';A.td=now}
  if(alive_&&A.state!=='live'){A.state='live';A.vis=true;A.last=null;A.grp.visible=true;A.grp.scale.setScalar(A.sc);A.b.root.rotation.set(0,0,0);A.b.root.position.copy(A.restP.root)}
  if(A.state==='gone'){A.vis=false;A.grp.visible=false;if(A.proxy)A.proxy.visible=false;return}
  const z=TER.standZ(e.x,e.y),p=this.W3(e.x,e.y,z);let dist=0;
  if(A.last){const dx=p.x-A.last.x,dz=p.z-A.last.z,d=Math.hypot(dx,dz);if(d<3)dist=d;if(d>1e-4&&(!isNpc||e.mvr))A.faceT=Math.atan2(dx,dz)}A.last=p.clone();A.grp.position.copy(p);
  const rn=performance.now(),d=e.d,atkP=!isNpc?(rn-(e.at0||-1e9))/(d&&d.boss?760:640):2,atk=(!isNpc&&e.wind&&rn<e.wind.t1)?.17:(atkP>=0&&atkP<1?atkP:-1);   // aviso de golpe: se mantiene la pose de anticipación (≈ .17) hasta el tajo
  // mirar: al atacar o al hablar, hacia el jugador (suave)
  let look=0;const px=P_.x-e.x,py=P_.y-e.y,dp=Math.hypot(px,py);
  if(!isNpc){if(atk>=0||(e.hunt&&dp<120&&dist<1e-4))A.faceT=Math.atan2(px,py)}else if(!(e.mvr&&dist>1e-4)){if(A.baseFace==null)A.baseFace=e.face!=null?e.face:Math.atan2(px,py);A.faceT=(dp<260&&e.face==null)?Math.atan2(px,py):A.baseFace}   /* Fase 25: los que TRABAJAN (e.face) miran a su tajo; los que caminan, hacia donde van */
  const df=((A.faceT-A.face+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;A.face+=df*(1-Math.exp(-dt*(dist>0?10:7)));A.grp.rotation.y=A.face;
  // andar: la fase avanza por DISTANCIA recorrida (el pie no patina); la amplitud sigue la velocidad real (1 u/s ≈ trote suave de una criatura de 1 u de alto)
  const spd=dt>0?dist/dt:0;A.mv+=(cl(spd/1.1,0,1.2)-A.mv)*(1-Math.exp(-dt*12));if(A.mv<.03)A.mv=0;
  A.ph+=dist/(A.tpl.cycle*(A.tpl.kind==='human'?1:1))*6.283;
  const wave=isNpc&&!A.tpl.nowave&&dp<110&&Math.sin(t*.35)>.3?1:0;if(isNpc){look=cl(Math.atan2(px,py)-A.face,-1,1)}
  A.b.root.position.z-=A.pz||0;A.pz=0;   // deshace el retroceso del fotograma anterior (antes se ACUMULABA: el modelo se iba lejos del enemigo lógico)
  ANIM[A.tpl.kind](A,{t,dt,mv:A.mv,at:atk,wave:(isNpc&&e.job)?0:wave,look,job:isNpc?e.job:null});
  // daño: destello 120 ms (m.fl = hasta cuándo) y retroceso breve; hover
  const fl=!isNpc&&rn<e.fl;A.setFlash(fl);A.setHover(e===hov);
  // aviso de golpe: los ojos se encienden (rampa con parpadeo) y en el último tramo estallan en un fogonazo; tras el tajo se apagan en ~160 ms
  let ei=0;if(!isNpc&&A.state==='live'){if(e.wind&&rn<e.wind.t1){const u=(rn-e.wind.t0)/(e.wind.t1-e.wind.t0);ei=Math.min(.55,u*4)+(u>.72?(u-.72)/.28*.45:0)+.06*Math.sin(now*.045)}else if(e.flare&&rn-e.flare<160)ei=.9*(1-(rn-e.flare)/160)}
  A.eyeFx(Math.max(0,Math.min(1,ei)));
  if(!isNpc&&fl){const u=Math.min(1,(e.fl-rn)/120);A.pz=-.05*u;A.b.root.position.z+=A.pz}
  // muerte: cae hacia atrás y se hunde/encoge ~0,9 s
  if(A.state==='dying'){const u=(now-A.td)/900;if(u>=1){A.state='gone';A.vis=false;A.grp.visible=false;if(A.proxy)A.proxy.visible=false;return}const f=ss(0,.45,u),h=ss(.45,1,u);A.b.root.rotation.x=-1.45*f;A.b.root.position.y=A.restP.root.y-.1*f*A.sc;A.grp.scale.setScalar(A.sc*(1-h*.85));A.grp.position.y-=.25*h*A.sc}
  // copia de profundidad: solo si el héroe está cerca (no se dibuja el resto)
  if(A.proxy){const near=Math.hypot(P_.x-e.x,P_.y-e.y)<ISO.TILE*3.5&&A.vis;A.proxy.visible=near;if(near){A.proxy.position.copy(A.grp.position);A.proxy.quaternion.copy(A.grp.quaternion);A.proxy.scale.copy(A.grp.scale)}}
  // aro de jefe
  if(A.state==='live'&&this.lockE===e){if(!A.lring){if(!this.lockM)this.lockM=new THREE.MeshBasicMaterial({color:'#ffd98a',transparent:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending});A.lring=new THREE.Mesh(this.ringG,this.lockM);A.lring.renderOrder=3;A.grp.add(A.lring);A.lring.scale.setScalar((.55+.5*A.sc)/(.625*A.sc));A.lring.position.y=.05/A.sc}A.lring.visible=true;A.lring.rotation.y=t*.8;this.lockM.opacity=.55+.25*Math.sin(t*4)}else if(A.lring)A.lring.visible=false;
  if(d&&d.boss&&A.state==='live'){if(!A.ring){A.ring=new THREE.Mesh(this.ringG,this.ringM[d.boss]||this.ringM[1]);A.ring.renderOrder=2;A.grp.add(A.ring);A.ring.scale.setScalar((.45+.5*A.sc)/(.625*A.sc));A.ring.position.y=.03/A.sc}A.ring.material.opacity=.22+.14*Math.sin(t*3)}
 }
 clear(){for(const [e,A] of this.map)A.dispose();this.map.clear()}
}
