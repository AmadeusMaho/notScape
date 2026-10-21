// NotScape · R3D · F2-B · NATURALEZA 3D: árboles por especie con follaje de LÁMINAS (técnica The Witness de la referencia, guía §4.5), árbol seco rehecho,
// tocones, y la capa de RECURSOS 3D (árboles talables y menas) con estado vivo/agotado, temblor al talar y resalte bajo el puntero.
// ── Especies = DATOS (tabla FOL; mismos ids que TREES/SPECIES). Paletas más serias que las pastel del 2D (dark fantasy): [dentro, medio, punta].
//    tipo: con = conífera (verticilos que cuelgan) · broad = frondoso (tronco con ramas + racimos de láminas «mata») · willow = sauce (racimos que caen)
//    · baobab = tronco grueso y copa plana. h = altura en tiles (el héroe mide 1,25), r = radio de copa.
// ── Un árbol = 2-3 geometrías (tronco con musgo + contorno, follaje con textura recortada) → se INSTANCIAN por especie/variante/zona (pocas llamadas).
import * as THREE from 'three';
import {toon,hull,inkFor,hash,jit} from './materials3d.js';
import {propGeo} from './props3d.js';

export const FOL={
 pino:{t:'con',h:2.9,r:.95,tr:'#3e2c22',pal:['#132a24','#2f573a','#86a845']},
 abedul:{t:'broad',h:2.6,r:.75,tr:'#cfc8b8',pal:['#22361a','#55772e','#bcc25a'],marks:1},
 roble:{t:'broad',h:2.5,r:1.05,tr:'#4a3626',pal:['#1c3016','#41642a','#96aa40']},
 fresno:{t:'broad',h:2.8,r:.82,tr:'#6a5c46',pal:['#22361a','#527630','#b2bc54']},
 sauce:{t:'willow',h:2.5,r:1.0,tr:'#4e4030',pal:['#1e3220','#4a6e36','#a0b25c']},
 arce:{t:'broad',h:2.5,r:1.0,tr:'#4e3626',pal:['#3e1810','#923e20','#e08a40']},
 tejo:{t:'con',h:2.3,r:.95,tr:'#3a2c2a',pal:['#121c20','#2a4040','#62806a']},
 ebano:{t:'broad',h:2.6,r:.95,tr:'#2a2230',pal:['#1a1224','#422c56','#9474b0']},
 caoba:{t:'broad',h:2.9,r:1.1,tr:'#42261a',pal:['#2c140c','#723020','#c47446']},
 baobab:{t:'baobab',h:2.8,r:1.25,tr:'#6e604a',pal:['#283016','#606a2c','#b2aa46']},
 mundo:{t:'broad',h:3.7,r:1.5,tr:'#8f9bb5',pal:['#1f45a0','#4585e0','#b4deff']},   // ÁRBOL DEL MUNDO (madera 11, nivel 94): HOJAS AZULES (decisión del dueño 21 oct 2026: vive en el CIELO / endgame, ya no en el Volcán)
 colgante:{t:'willow',h:1.5,r:.9,tr:'#6a5a46',pal:['#2f6a80','#5fa9b4','#b6e4dc']}};   // El Cielo (ISLA-2e): sauce bajo y colgante de hojas azul-verdosas; solo lo usa skyzone3d.js (no es recurso talable: no está en TREES)
// COLOR DE LOS ÁRBOLES POR BIOMA (decisión del dueño, 21 oct 2026: «en todos los biomas los árboles tienen que ser de un color distinto», a partir de la paleta azul del Cielo): la FORMA la sigue dando la especie (pino/roble/sauce…) y el COLOR el bioma
// donde crece. [dentro, medio, punta] + color del tronco. Índice = BIOMES.list (6 Páramo, 7 Desierto, 8 Costa son esqueletos). Un bioma nuevo = una fila. El abedul conserva su corteza blanca.
export const TREEPAL=[
 {pal:['#2c6a1e','#6cb02e','#d6ec62'],tr:'#6a4a2c'},   // 0 Pradera: verde primavera lima-dorado
 {pal:['#0c3a34','#1f8a6a','#7fe0b8'],tr:'#3a3a2c'},   // 1 Bosque: esmeralda profundo
 {pal:['#3a3a14','#8a8426','#d4c25a'],tr:'#3a3226'},   // 2 Pantano: oliva-mostaza enfermizo
 {pal:['#0e2420','#2a5a4a','#eef6f4'],tr:'#5a4a42'},   // 3 Cumbres: abeto casi negro con puntas nevadas
 {pal:['#8a2a52','#e0649a','#ffd2e4'],tr:'#4a2a24'},   // 4 Oriental: cerezo en flor
 {pal:['#2a0c08','#9a2a10','#ff9030'],tr:'#2a2020'},   // 5 Volcán: ceniza y brasa
 {pal:['#2a1650','#7440c8','#dcb4ff'],tr:'#3a2e52'},   // 6 Páramo Arcano: violeta
 {pal:['#58501c','#b8a238','#f4e28a'],tr:'#7a5a34'},   // 7 Desierto: oro seco
 {pal:['#0e4a5a','#2ab0b8','#b8f4ee'],tr:'#5a5046'},   // 8 Costa de las Tormentas: turquesa
 {pal:['#1f45a0','#4585e0','#b4deff'],tr:'#8f9bb5'}];  // 9 El Cielo: azul cobalto
const TREES=['pino','abedul','roble','fresno','sauce','arce','tejo','ebano','caoba','baobab','mundo'];

// ───────── texturas de lámina (generadas por código, como la referencia) ─────────
const LEAFTEX={};
function leafTex(kind){if(LEAFTEX[kind])return LEAFTEX[kind];const W=kind==='rama'?256:kind==='matafl'?384:128,H=128,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');g.fillStyle='#fff';g.strokeStyle='#fff';
 if(kind==='rama'){g.lineWidth=4;g.beginPath();g.moveTo(4,H/2);g.quadraticCurveTo(W*.5,H/2+6,W-6,H/2+2);g.stroke();
  for(let i=0;i<34;i++){const t=i/34,x=8+t*(W-22),y=H/2+Math.sin(t*3)*3,len=(1-t*.7)*H*.42*(.85+hash(i,1,5)*.3);
   [-1,1].forEach(sd=>{const a=sd*(1.05-t*.35)+(hash(i,sd,6)-.5)*.2;g.save();g.translate(x,y);g.rotate(a);g.beginPath();g.ellipse(len*.5,0,len*.5,3.2*(1-t*.4)+1.2,0,0,7);g.fill();
    for(let k=0;k<3;k++){const u=(k+1)/4*len;g.beginPath();g.ellipse(u,0,len*.16,2.2,sd*.7,0,7);g.fill()}g.restore()})}
  g.beginPath();g.ellipse(W-10,H/2+2,10,5,0,0,7);g.fill()}
 else if(kind==='cuelga'){for(let i=0;i<26;i++){const x=10+hash(i,1,8)*(W-20),len=H*(.45+hash(i,2,8)*.5);g.lineWidth=1.5;g.beginPath();g.moveTo(x,2);g.quadraticCurveTo(x+(hash(i,3,8)-.5)*14,len*.5,x+(hash(i,4,8)-.5)*10,len);g.stroke();
   for(let k=0;k<9;k++){const u=k/9;g.save();g.translate(x+(hash(i,3,8)-.5)*14*u,2+len*u);g.rotate((hash(i,k,9)-.5)*.8);g.beginPath();g.ellipse(0,0,2.4,6,0,0,7);g.fill();g.restore()}}}
 else if(kind==='matafl'){   // Fase 4c: atlas de 3 celdas de 128 px: [0] mata de hojas (igual que 'mata') · [1] racimo de flores de 5 pétalos (centro más oscuro) · [2] racimo de bayas con brillo. Todo blanco/gris: el color lo pone el vértice.
  for(let i=0;i<90;i++){const a=hash(i,1,7)*6.28,r=Math.sqrt(hash(i,2,7))*H*.4,x=64+Math.cos(a)*r,y=H/2+Math.sin(a)*r,s=5+hash(i,3,7)*5;g.save();g.translate(x,y);g.rotate(a+hash(i,4,7));g.beginPath();g.ellipse(0,0,s,s*.48,0,0,7);g.fill();g.restore()}
  [[150,44,17],[206,52,15],[176,96,18],[142,100,11]].forEach(([x,y,r],fi)=>{for(let p=0;p<5;p++){const a=p/5*6.283+fi*.7;g.save();g.translate(x+Math.cos(a)*r*.55,y+Math.sin(a)*r*.55);g.rotate(a);g.beginPath();g.ellipse(0,0,r*.6,r*.4,0,0,7);g.fill();g.restore()}
   g.fillStyle='#8c8c8c';g.beginPath();g.arc(x,y,r*.3,0,7);g.fill();g.fillStyle='#fff'});
  [[286,40,15],[326,58,16],[300,92,15],[352,96,13],[348,34,10]].forEach(([x,y,r])=>{const gr=g.createRadialGradient(x-r*.35,y-r*.35,r*.1,x,y,r);gr.addColorStop(0,'#fff');gr.addColorStop(1,'#9a9a9a');g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,7);g.fill();g.fillStyle='#fff'})}
 else{for(let i=0;i<90;i++){const a=hash(i,1,7)*6.28,r=Math.sqrt(hash(i,2,7))*H*.4,x=W/2+Math.cos(a)*r,y=H/2+Math.sin(a)*r,s=5+hash(i,3,7)*5;g.save();g.translate(x,y);g.rotate(a+hash(i,4,7));g.beginPath();g.ellipse(0,0,s,s*.48,0,0,7);g.fill();g.restore()}}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return LEAFTEX[kind]=t}
const FMAT={};
export function folMat(kind){if(FMAT[kind])return FMAT[kind];const base=toon('#ffffff',{vc:1,fol:1,side:THREE.DoubleSide}),m=base.clone();m.map=leafTex(kind);m.alphaTest=.5;m.onBeforeCompile=base.onBeforeCompile;m.customProgramCacheKey=()=>base.customProgramCacheKey()+kind;return FMAT[kind]=m}
// láminas → una geometría (de la referencia: cardMesh). cards = [{p0,d,s,L,H,droop}] · center(y) = eje para la normal «esferizada» (luz de nube) · R(y) = radio
export function cardGeo(cards,pal,center,R,opt){const P=[],N=[],C=[],UV=[],I=[],U0=opt&&opt.uv?opt.uv[0]:0,U1=opt&&opt.uv?opt.uv[1]:1,ca=new THREE.Color(pal[0]),cb=new THREE.Color(pal[1]),cc=new THREE.Color(pal[2]),tmp=new THREE.Color();let v0=0;const SEG=opt&&opt.seg||4;
 cards.forEach((cd,ci)=>{for(let i=0;i<=SEG;i++){const t=i/SEG,arc=cd.d.clone().multiplyScalar(cd.L*t).add(new THREE.Vector3(0,-cd.droop*t*t,0)).add(cd.p0);
   [-1,1].forEach(sd=>{const v=arc.clone().addScaledVector(cd.s,sd*cd.H*.5);P.push(v.x,v.y,v.z);const cn=center(v.y),n=v.clone().sub(cn).normalize();n.y=n.y*.8+.35;n.normalize();N.push(n.x,n.y,n.z);
    const out=Math.min(1,v.clone().sub(cn).setY(0).length()/R(v.y)),k=Math.min(1,out*.75+t*.25)*(.85+hash(ci,1,9)*.3);tmp.copy(ca).lerp(cb,Math.min(1,k*1.5));if(k>.62)tmp.lerp(cc,Math.min(1,(k-.62)/.38));C.push(tmp.r,tmp.g,tmp.b);UV.push(U0+(U1-U0)*t,sd<0?0:1)})}
  for(let i=0;i<SEG;i++){const a=v0+i*2;I.push(a,a+2,a+1,a+1,a+2,a+3)}v0+=(SEG+1)*2});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(UV,2));g.setIndex(I);g.computeBoundingSphere();return g}
// rama curva que se afina (tubo sobre una curva de 3-4 puntos) — también lo usa el árbol seco
function branch(pts,r0,r1,seg=8){const crv=new THREE.CatmullRomCurve3(pts),g=new THREE.TubeGeometry(crv,seg,1,5,false),p=g.attributes.position,c=crv.getPoints(seg);
 // afinar: cada anillo se escala hacia su centro según su posición en la curva
 for(let i=0;i<=seg;i++){const ce=crv.getPointAt(i/seg),r=r0+(r1-r0)*i/seg;for(let j=0;j<=5;j++){const k=i*6+j,v=new THREE.Vector3(p.getX(k),p.getY(k),p.getZ(k)).sub(ce).multiplyScalar(r).add(ce);p.setXYZ(k,v.x,v.y,v.z)}}
 g.computeVertexNormals();return g}
const merge=gs=>{let n=0;gs.forEach(g=>n+=(g.index?g.toNonIndexed():g).attributes.position.count);const P=new Float32Array(n*3);let o=0;gs.forEach(g=>{const a=(g.index?g.toNonIndexed():g).attributes.position.array;P.set(a,o);o+=a.length});
 const m=new THREE.BufferGeometry();m.setAttribute('position',new THREE.BufferAttribute(P,3));m.computeVertexNormals();m.computeBoundingSphere();return m};
// ───────── generadores ─────────
// devuelven {wood: BufferGeometry (tronco+ramas, con contorno y musgo), cards: BufferGeometry, tex: 'rama'|'mata'|'cuelga'}
export function treeGeo(sp,seed,bk){let F=FOL[sp]||FOL.roble;if(bk!=null&&TREEPAL[bk]&&sp!=='colgante'){const T=TREEPAL[bk];F=Object.assign({},F,{pal:T.pal,tr:sp==='abedul'?F.tr:T.tr})}const h=F.h,r0=F.r,V=THREE.Vector3,cards=[],woods=[];
 if(F.t==='con'){const th=h*.95;woods.push(jit(new THREE.CylinderGeometry(.05,.15,th,7).translate(0,th/2,0),.02));
  const y0=h*.3,y1=h,R=y=>Math.max(.12,r0*Math.pow(Math.max(0,(y1-y)/(y1-y0)),.85)),NW=Math.round((y1-y0)/.14);
  for(let k=0;k<NW;k++){const y=y0+k*(y1-y0)/NW,r=R(y),nb=Math.max(3,Math.round(4+r*7));
   for(let b=0;b<nb;b++){const a=b/nb*6.283+k*2.4+hash(k,b,seed)*.5,d=new V(Math.cos(a),-.12-(1-k/NW)*.18,Math.sin(a)).normalize(),s0=new V(-Math.sin(a),0,Math.cos(a));
    [-.35,.4].forEach((roll,ri)=>{const s=s0.clone().applyAxisAngle(d,roll).normalize();cards.push({p0:new V(Math.cos(a)*.04,y+ri*.03,Math.sin(a)*.04),d,s,L:r*(1.05+hash(k,b+ri,seed+1)*.2),H:r*.62+.08,droop:r*.28})})}}
  for(let b=0;b<5;b++){const a=b*1.26+.3;cards.push({p0:new V(0,y1-.2,0),d:new V(Math.cos(a),.9,Math.sin(a)).normalize(),s:new V(-Math.sin(a),0,Math.cos(a)),L:.24,H:.15,droop:.03})}
  return{wood:merge(woods),cards:cardGeo(cards,F.pal,y=>new V(0,y-.05,0),R),tex:'rama',tr:F.tr}}
 // frondoso / sauce / baobab: tronco + 3-5 ramas curvas + racimos de láminas en esferas al final de cada rama
 const thick=F.t==='baobab'?.34:.12,th=F.t==='baobab'?h*.62:h*.55;woods.push(jit(new THREE.CylinderGeometry(thick*.6,thick*1.35,th,8).translate(0,th/2,0),.03));
 const nbr=F.t==='baobab'?5:3+Math.floor(hash(seed,1,3)*2),clusters=[];
 for(let b=0;b<nbr;b++){const a=b/nbr*6.283+hash(b,seed,4),up=F.t==='baobab'?.35:.9,len=r0*(F.t==='baobab'?.7:.75)*(.8+hash(b,2,seed)*.4),y=th*(F.t==='baobab'?.97:.75+hash(b,3,seed)*.2);
  const p0=new V(0,y,0),p1=new V(Math.cos(a)*len*.45,y+len*up*.55,Math.sin(a)*len*.45),p2=new V(Math.cos(a)*len,y+len*up,Math.sin(a)*len);
  woods.push(branch([p0,p1,p2],thick*.55,thick*.18));clusters.push([p2,r0*(F.t==='baobab'?.48:.6)*(.85+hash(b,5,seed)*.3)])}
 clusters.push([new V(0,th+(h-th)*.55,0),r0*.72]);
 const tex=F.t==='willow'?'cuelga':'mata',cen=new V(0,th+(h-th)*.5,0);
 clusters.forEach(([c,rr],ci)=>{const n=F.t==='willow'?14:24;for(let i=0;i<n;i++){const u=hash(i,1,seed+ci*7),v=hash(i,2,seed+ci*7),thA=u*6.283,ph=Math.acos(1-v*(F.t==='willow'?1.3:1.6));
  const nn=new V(Math.sin(ph)*Math.cos(thA),Math.cos(ph),Math.sin(ph)*Math.sin(thA));let s=new V(0,1,0).cross(nn);if(s.lengthSq()<1e-3)s.set(1,0,0);s.normalize();const d=nn.clone().cross(s).normalize();
  const sz=rr*(.9+hash(i,3,seed)*.45);if(F.t==='willow'){const dd=new V(0,-1,0);cards.push({p0:c.clone().addScaledVector(nn,rr*.7),d:dd,s:new V(-Math.sin(thA),0,Math.cos(thA)),L:sz*1.6,H:sz*.9,droop:0})}
  else{nn.y*=.8;cards.push({p0:c.clone().addScaledVector(nn,rr*.62).addScaledVector(d,-sz*.5),d,s,L:sz,H:sz,droop:0})}}});
 return{wood:merge(woods),cards:cardGeo(cards,F.pal,()=>cen,()=>r0*1.2),tex,tr:F.tr}}
// ÁRBOL SECO rehecho (guía §4.5, pedido del dueño): misma silueta que el de la referencia, pero cada rama se afina hacia la punta, se curva (tubo sobre
// 3-4 puntos) y lleva ramitas secundarias más finas; musgo en la base y sombreado suave. Una sola geometría.
export function deadTreeGeo(seed=1,h=1.75){const V=THREE.Vector3,G=[];G.push(branch([new V(0,0,0),new V(.03,h*.35,.02),new V(-.02,h*.7,0),new V(.02,h,.01)],.2,.06,10));
 [[1.0,-.9,0,.95],[1.3,.8,.8,.85],[1.5,-.7,2.2,.75],[1.7,.55,3.5,.55],[.8,.9,4.6,.6]].forEach((b,i)=>{const y=b[0]*h/1.75,a=b[2]+hash(i,seed,2)*.4,tilt=Math.abs(b[1]),L=b[3]*h/1.75;
  const dir=new V(Math.cos(a)*Math.sin(tilt),Math.cos(tilt),Math.sin(a)*Math.sin(tilt)),p0=new V(0,y,0),p1=p0.clone().addScaledVector(dir,L*.45).add(new V(0,L*.12,0)),p2=p0.clone().addScaledVector(dir,L).add(new V(0,L*(.05+hash(i,3,seed)*.2),0));
  G.push(branch([p0,p1,p2],.065,.012,7));
  for(let k=0;k<2;k++){const q0=p1.clone().lerp(p2,.3+k*.35),a2=a+(k?.9:-.8),d2=new V(Math.cos(a2)*.6,.75,Math.sin(a2)*.6).normalize(),q2=q0.clone().addScaledVector(d2,L*.38);G.push(branch([q0,q0.clone().lerp(q2,.5).add(new V(0,.04,0)),q2],.022,.006,4))}});
 return merge(G)}
export function stumpGeo(){const g=jit(new THREE.CylinderGeometry(.13,.18,.2,8).translate(0,.1,0),.02);return g}

// ───────── capa de recursos 3D (árboles talables y menas) ─────────
const CELL=24,NVAR=3,CS=256;   // CS: celda (px de mundo) del índice de recursos para update()
// El Cielo (ISLA-4): todo lo que está en la columna de la zona (x ≥ BIOMES.zone.x0) usa ÁRBOLES DEL MUNDO (hojas azules) y menas en mármol claro
const inZone=x=>{try{const z=BIOMES.zone;return !!z&&x>=z.x0}catch(e){return false}};
export class Resources{
 constructor(scene,occScene,W3){this.scene=scene;this.occ=occScene;this.W3=W3;this.grp=new THREE.Group();this.grp.name='recursos3d';scene.add(this.grp);this.ogrp=new THREE.Group();occScene.add(this.ogrp);
  this.sig='';this.idx=new Map();this.cells=null;this.pend=new Set();this.geo={};this.wmat={};this.dmat=new THREE.MeshBasicMaterial({colorWrite:false});this.on=false;
  this.hlMat=new THREE.MeshBasicMaterial({color:'#fff0c8',transparent:true,opacity:.28,blending:THREE.AdditiveBlending,depthWrite:false});this.hlFol={};this.hl=new THREE.Group();scene.add(this.hl);this.hlE=null}
 kindOf(e,dead){if(e.t==='wc'){let sp=TREES[e.i]||'roble';if(inZone(e.x))sp='mundo';let bk=0;try{bk=inZone(e.x)?9:Math.max(0,BIOMES.at(e.x,e.y))}catch(x){}return dead?'tocon':sp+'@'+bk+'#'+(Math.floor(hash(Math.round(e.x),Math.round(e.y),5)*NVAR))}
  if(e.t==='mi')return 'mena'+e.i+(inZone(e.x)?'z':'')+(dead?'d':'');return null}
 parts(kind){if(this.geo[kind])return this.geo[kind];let P=[];
  if(kind==='tocon'){const g=stumpGeo();P=[{g,mat:toon('#4a3626',{moss:1,tex:'madera',texS:30}),ink:hull(g,.012,inkFor('#4a3626')).geometry,inkM:inkFor('#4a3626')}]}
  else if(kind.startsWith('mena')){const i=+kind.slice(4).replace(/[dz]/g,''),dead=kind.endsWith('d'),zm=kind.includes('z'),MBA=['#8a5a3a','#9a9aa8','#6a4a3a','#3a3a40','#8a9aa8','#3a4a6a','#2a4a3a','#2a4a52','#5a3a2a','#3a3a5a'],MOR=['#c8742a','#e8e8f8','#c0603a','#6a6a72','#f0f0f8','#4a7aff','#3adf6a','#3ad0d8','#e89a3a','#c8a0ff'];
   const G=propGeo('mena',{base:zm?'#d6cfbb':MBA[i]||MBA[0],ore:MOR[i]||MOR[0],crystal:i>=5,dead},null);if(G){const m=toon('#ffffff',{vc:1,moss:.6,mossUp:.35,tex:'piedra',texS:14});P=[{g:G.g,mat:m,ink:hull(G.g,.02).geometry,inkM:inkFor('#5a5560')}]}}
  else{const[spb,v]=kind.split('#'),[sp,bk]=spb.split('@'),T=treeGeo(sp,+v*17+3,+bk),wm=toon(T.tr,{moss:1,tex:'madera',texS:30,texB:.6});
   P=[{g:T.wood,mat:wm,ink:hull(T.wood,.016).geometry,inkM:inkFor(T.tr)},{g:T.cards,mat:folMat(T.tex),fol:T.tex}]}
  return this.geo[kind]=P}
 sign(){return N.length+'|'+(N[0]?N[0].x:0)+'|'+(N.length?N[N.length-1].x+N[N.length-1].y:0)}

 // Fase 49a (rendimiento): las mallas se reparten en SECTORES de 4×4 celdas; `cull` oculta los sectores lejanos (three salta el subárbol entero: sin cull de frustum ni sombras por malla).
 sec(parent,cx,cy){const M=parent.userData.sec||(parent.userData.sec=new Map()),sx=Math.floor(cx/4),sy=Math.floor(cy/4),k=sx*1000+sy;let g=M.get(k);if(!g){g=new THREE.Group();g.matrixAutoUpdate=false;g.matrixWorldAutoUpdate=false;const S=4*CELL*32;g.userData.c=this.W3((sx+.5)*S,(sy+.5)*S,0);parent.add(g);M.set(k,g)}return g}
 cull(tx,tz,r){const R=r+4*CELL*.72+14;for(const par of [this.grp,this.ogrp]){const M=par.userData.sec;if(!M)continue;M.forEach(g=>{const c=g.userData.c;g.visible=Math.hypot(c.x-tx,c.z-tz)<R})}}
 build(now){[this.grp,this.ogrp].forEach(g=>{while(g.children.length){const c=g.children.pop();c.dispose&&c.dispose()}g.userData.sec=null});this.idx.clear();
  const groups=new Map();
  for(const e of N){if(e.t!=='wc'&&e.t!=='mi')continue;[0,1].forEach(dead=>{const kind=this.kindOf(e,dead),ck=kind+'@'+Math.floor(e.x/(32*CELL))+','+Math.floor(e.y/(32*CELL));let a=groups.get(ck);if(!a)groups.set(ck,a={kind,list:[],cx:Math.floor(e.x/(32*CELL)),cy:Math.floor(e.y/(32*CELL))});a.list.push(e)})}
  const o3=new THREE.Object3D();
  groups.forEach(({kind,list,cx,cy})=>{const P=this.parts(kind);if(!P.length)return;const ms=[];
   P.forEach(pt=>{const m=new THREE.InstancedMesh(pt.g,pt.mat,list.length);m.castShadow=m.receiveShadow=true;ms.push(m);this.sec(this.grp,cx,cy).add(m);
    if(pt.ink){const h=new THREE.InstancedMesh(pt.ink,pt.inkM,list.length);ms.push(h);this.sec(this.grp,cx,cy).add(h)}
    const d=new THREE.InstancedMesh(pt.g,pt.fol?folDepth(pt.fol):this.dmat,list.length);d.layers.set(3);ms.push(d);this.sec(this.ogrp,cx,cy).add(d)});
   list.forEach((e,i)=>{const dead=kind==='tocon'||kind.endsWith('d');let r=this.idx.get(e);if(!r)this.idx.set(e,r={});r[dead?'d':'a']={ms,i};
    o3.position.copy(this.W3(e.x,e.y,TER.standZ(e.x,e.y)));o3.rotation.set(0,hash(e.x,e.y,9)*6.283,0);const sc=e.t==='wc'?.92+hash(e.x,e.y,3)*.16:1;o3.scale.setScalar(sc);o3.updateMatrix();
    r.base=r.base||{p:o3.position.clone(),q:o3.quaternion.clone(),s:sc};ms.forEach(m=>m.setMatrixAt(i,o3.matrix));r.state=null});
   ms.forEach(m=>{m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();m.matrixAutoUpdate=false;m.matrixWorldAutoUpdate=false})});   // estáticos: sin recalcular su matriz cada fotograma (F49a: ~8 700 mallas)
  this.cells=new Map();this.pend=new Set();this.idx.forEach((r,e)=>{const k=Math.floor(e.x/CS)*100003+Math.floor(e.y/CS);let a=this.cells.get(k);if(!a)this.cells.set(k,a=[]);a.push(e,r)});
  this.on=this.idx.size>0;console.info('[R3D recursos]',{grupos:groups.size,recursos:this.idx.size})}
 // cada fotograma: vivo/agotado (cambia de instancia), temblor del que se está talando, resalte bajo el puntero
 update(now,t,hov,act){const s=this.sign();if(s!==this.sig){this.sig=s;this.build(now)}
  const o3=new THREE.Object3D(),Z=new THREE.Matrix4().makeScale(0,0,0);
  // temblor SOLO al recibir el golpe (pedido del dueño): swPh() de game.js vale 0 en el impacto y crece hasta 1 en el siguiente golpe → amortiguado en el primer ~20 % del ciclo
  const hitK=e=>{if(act!==e||e.t!=='wc'||typeof swPh!=='function')return 0;try{const f=swPh(now);return f<.22?Math.pow(1-f/.22,2):0}catch(x){return 0}};
  // Fase 49a (rendimiento): con 9 biomas hay ~13 700 recursos; recorrerlos todos cada fotograma costaba ~+6 ms. Solo cambian de estado los que están cerca del héroe (talar/minar) o los ya agotados (`pend`, hasta que reviven).
  const proc=(r,e)=>{const dead=typeof alive==='function'?!alive(e,now):false,hk=dead?0:hitK(e),shake=hk>0,st=(dead?'d':'a')+(shake?'s':'');if(dead)this.pend.add(e);else this.pend.delete(e);if(st===r.state&&!shake)return;r.state=st;
   const show=dead?r.d:r.a,hide=dead?r.a:r.d;if(hide)hide.ms.forEach(m=>{m.setMatrixAt(hide.i,Z);m.instanceMatrix.needsUpdate=true});
   if(show){o3.position.copy(r.base.p);o3.quaternion.copy(r.base.q);o3.scale.setScalar(r.base.s);if(shake){o3.rotation.z+=Math.sin(t*42)*.05*hk;o3.rotation.x+=Math.cos(t*35)*.03*hk}o3.updateMatrix();show.ms.forEach(m=>{m.setMatrixAt(show.i,o3.matrix);m.instanceMatrix.needsUpdate=true})}};
  if(typeof P!=='undefined'&&this.cells){const ci=Math.floor(P.x/CS),cj=Math.floor(P.y/CS);for(let a=ci-3;a<=ci+3;a++)for(let b=cj-3;b<=cj+3;b++){const q=this.cells.get(a*100003+b);if(q)for(let n=0;n<q.length;n+=2)proc(q[n+1],q[n])}
   this.pend.forEach(e=>{const r=this.idx.get(e);if(r)proc(r,e)});if(act&&this.idx.has(act))proc(this.idx.get(act),act)}
  else this.idx.forEach((r,e)=>proc(r,e));
  // resalte: copia del modelo con luz aditiva (más clara) solo en la entidad bajo el puntero
  const he=hov&&this.idx.has(hov)?hov:null;if(he!==this.hlE){this.hlE=he;this.hl.clear();if(he){const dead=typeof alive==='function'&&!alive(he,now),P=this.parts(this.kindOf(he,dead)),r=this.idx.get(he);
    P.forEach(pt=>{const m=new THREE.Mesh(pt.g,pt.fol?(this.hlFol[pt.fol]||(this.hlFol[pt.fol]=Object.assign(this.hlMat.clone(),{map:leafTex(pt.fol),alphaTest:.5,side:THREE.DoubleSide}))):this.hlMat);m.renderOrder=3;this.hl.add(m);
     if(pt.ink){const h=new THREE.Mesh(pt.ink,new THREE.MeshBasicMaterial({color:'#ffe9b0',side:THREE.BackSide}));h.scale.setScalar(1.02);this.hl.add(h)}});
    this.hl.position.copy(r.base.p);this.hl.quaternion.copy(r.base.q);this.hl.scale.setScalar(r.base.s)}}}
}
const FD={};function folDepth(kind){return FD[kind]||(FD[kind]=new THREE.MeshBasicMaterial({colorWrite:false,map:leafTex(kind),alphaTest:.5,side:THREE.DoubleSide}))}
