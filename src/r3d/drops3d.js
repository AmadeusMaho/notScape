// NotScape · R3D · Lote R3D-DROPS-3D (20 oct 2026) · OBJETOS DEL SUELO (drops de enemigos, animales y jefes) EN 3D, con recogida MANUAL por LMB y ESTELA DE LUZ en los raros.
// ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// QUÉ HACE
//   · Dibuja en la escena 3D cada entrada de `GD` (lista global de game.js; se llena con `dropGround()`): el MODELO real del objeto (armas, armaduras, menas, comida, cuero, huesos…),
//     lanzado en arco desde el cadáver (520 ms, como el 2D), que cae, rebota un poco y queda en el suelo. Lo común queda quieto; lo POCO COMÚN o mejor gira despacio y flota.
//   · RAROS (rareza ≥ 2 = Raro/Épico/Legendario, y los «drop raro» de criatura): ESTELA DE LUZ vertical del color de la rareza (más alta y ancha cuanto mejor), halo en el suelo,
//     chispas que suben y un ANILLO + destello al caer. El SONIDO lo reproduce game.js (`dropUpd`): «rare» (raro) o «epic» (épico/legendario) al caer.
//     Poco común (rareza 1) = halo verde y chispas, sin estela. De noche el 2D de `light.js` ya ilumina el suelo con el color de la calidad.
//   · Ya NO se recogen solos: hay que hacer LMB (pickEnt/engage de game.js: el héroe camina hasta el objeto y `pickG` lo guarda). Al recoger, el modelo vuela al héroe y se encoge (380 ms).
//   · Hover: `HOV` (game.js) agranda el objeto, avivando la estela, y el tooltip del cursor dice el nombre con el color de su rareza (resTip).
// MODELOS (nada se duplica): `build()` de icons3d.js (armas por cultura, armaduras con Mini, GEN genéricos) + los modelos nuevos de itemgen3d.js (comida, botín, runas…) en POSE DE SUELO (`info.ground`).
//   Se construye UNA plantilla por id (caché) y cada drop es un clon barato (misma geometría y material; los contornos de casco van incluidos). Tamaño real por tipo en SIZE
//   (REGLA DE SENTIDO: 1 unidad ≈ 1,75 m → una espada ≈ .62 ≈ 1,1 m, una gema ≈ .2 ≈ 35 cm; ligeramente sobredimensionado a propósito para poder verlo y pulsarlo).
// COSTE: ≤ 80 drops (tope de game.js); estela = 1 cilindro con shader aditivo compartido por rareza; cero trabajo si GD está vacío; los lejanos se ocultan.
// API: R3D.drops = {on, count, stats(), tpl(id)};  R3D.dropsOn (getter) → game.js deja de pintar el drop en 2D.   `?drops3d=0` lo apaga (vuelve el 2D).
// AÑADIR: kind nuevo → modelo en itemgen3d.js (+ POSE2/DPOSE2) y una fila en SIZE si no mide el defecto (.3).
import * as THREE from 'three';
import {build} from './icons3d.js';
import {SIZE3} from './craftgen3d.js';

const PI=Math.PI,TAU=PI*2,clamp=(v,a,b)=>v<a?a:v>b?b:v;
// tamaño (dimensión mayor, en unidades; 1 unidad ≈ 1,75 m)
const SIZE={sword:.62,dagger:.4,greatsword:.8,staff:.9,scepter:.55,mace:.55,axe:.6,pick:.6,rod:.8,bow:.6,xbow:.5,shield:.42,chest:.46,legs:.4,gloves:.26,boots:.28,helm:.32,cape:.44,
 ore:.3,bar:.28,log:.55,potion:.26,gem:.2,ring:.16,amulet:.2,coins:.22,arrows:.4,bolts:.4,quiver:.4,
 hide:.5,wool:.3,cloth:.36,bone:.36,tooth:.24,skull:.28,club:.5,horn:.3,nest:.32,pearl:.14,feather:.34,butter:.22,steak:.3,drum:.32,egg:.16,mush:.24,rice:.26,salt:.2,bread:.34,burger:.28,
 fish:.4,shrimp:.28,squid:.4,plate:.36,bowl:.3,crown:.3,mask:.28,hat:.4,shuriken:.24,core:.22,rune:.26,scroll:.3,swirl:.24,bag:.32};
Object.assign(SIZE,SIZE3);   // OFICIOS-D4
const SZK=1.35;   // sobredimensión para que se vea y se pueda pulsar (a zoom normal 1 unidad ≈ 60 px)
const BEAM_H=[0,1.1,2.6,3.6,4.8],BEAM_W=[0,.05,.1,.13,.16],GLOW_R=[0,.5,.7,.85,1];   // por rareza (rr: 0 común … 4 legendario)

const radial=(a=1)=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,'+a+')');r.addColorStop(.35,'rgba(255,255,255,'+a*.45+')');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t};

// clon barato: misma geometría y material (Object3D.clone copiaría userData por JSON, y los contornos llevan referencias)
function cl(o){const n=o.isMesh?new THREE.Mesh(o.geometry,o.material):new THREE.Group();n.position.copy(o.position);n.quaternion.copy(o.quaternion);n.scale.copy(o.scale);n.visible=o.visible;n.renderOrder=o.renderOrder;
 n.castShadow=false;n.receiveShadow=false;if(o.userData.hull)n.userData.hull=true;for(const c of o.children)n.add(cl(c));return n}

export class Drops{
 constructor(scene,W3){this.scene=scene;this.W3=W3;this.on=!/[?&]drops3d=0/.test(location.search);this.map=new Map();this.fly=[];this.tpls=new Map();this.stats={vivos:0,plantillas:0,fallos:0};
  this.root=new THREE.Group();this.root.name='drops3d';scene.add(this.root);
  this.tex=radial(1);this.dot=radial(.95);
  this.gBlob=new THREE.CircleGeometry(.5,16).rotateX(-PI/2);this.mBlob=new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.3,depthWrite:false});
  this.gDisc=new THREE.CircleGeometry(1,24).rotateX(-PI/2);this.gRing=new THREE.RingGeometry(.82,1,32).rotateX(-PI/2);
  this.mGlow=[];this.mBeam=[];this.mSpark=[]}
 // ── materiales compartidos por rareza ──
 col(q){return new THREE.Color(typeof RAR!=='undefined'&&RAR[q]?RAR[q][1]:'#ffffff')}
 glowMat(q){return this.mGlow[q]||(this.mGlow[q]=new THREE.MeshBasicMaterial({map:this.tex,color:this.col(q).multiplyScalar(1.5),transparent:true,opacity:.75,depthWrite:false,blending:THREE.AdditiveBlending}))}
 sparkMat(q){return this.mSpark[q]||(this.mSpark[q]=new THREE.SpriteMaterial({map:this.dot,color:this.col(q).multiplyScalar(1.8),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}))}
 beamMat(q){if(this.mBeam[q])return this.mBeam[q];
  if(!this.beamTex){const c=document.createElement('canvas');c.width=32;c.height=128;const g=c.getContext('2d');for(let y=0;y<128;y++){const h=1-y/127,a=Math.pow(Math.max(0,1-h),1.5);for(let x=0;x<32;x++){const e=Math.pow(Math.max(.001,Math.sin(x/31*PI)),.6);g.fillStyle='rgba(255,255,255,'+(a*(.55+.45*e)).toFixed(3)+')';g.fillRect(x,127-y,1,1)}}
   // (fila 0 del lienzo = punta del cilindro = transparente; fila 127 = base = opaca)
   this.beamTex=new THREE.CanvasTexture(c);this.beamTex.colorSpace=THREE.SRGBColorSpace}
  // MeshBasicMaterial (no ShaderMaterial): el reflejo del agua renderiza la escena con planos de recorte globales y un shader propio sin `clipping` rompía esa pasada
  return this.mBeam[q]=new THREE.MeshBasicMaterial({map:this.beamTex,color:this.col(q).multiplyScalar(1.6),transparent:true,opacity:.7,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending})}
 // ── plantilla por id (modelo en pose de suelo, centrado, apoyado en y=0, a su tamaño real) ──
 tpl(id){let t=this.tpls.get(id);if(t!==undefined)return t;t=null;
  try{const inf=typeof ITEMICON!=='undefined'&&ITEMICON.info?ITEMICON.info(id):null;/* ITEMICON es un const global: no cuelga de window */if(inf){inf.ground=true;let b=build(inf.kind,inf);if(!b){inf.kind='bag';inf.c='#9a6a34';inf.o={};b=build('bag',inf)}
    if(b){b.root.updateMatrixWorld(true);const bx=new THREE.Box3(),tm=new THREE.Box3();b.keep.forEach(m=>{if(m.isMesh&&!m.userData.hull&&m.visible!==false){tm.setFromObject(m);if(isFinite(tm.min.x))bx.union(tm)}});
     if(!bx.isEmpty()){const sz=bx.getSize(new THREE.Vector3()),ct=bx.getCenter(new THREE.Vector3()),mx=Math.max(sz.x,sz.y,sz.z,.01),k=(SIZE[inf.kind]||.3)*SZK/mx,h=new THREE.Group(),inner=cl(b.root);
      inner.position.set(-ct.x,-bx.min.y,-ct.z);h.add(inner);h.scale.setScalar(k);t={h,hh:sz.y*k,rad:Math.max(sz.x,sz.z)*k/2,flat:sz.y*k<.12,kind:inf.kind};this.stats.plantillas++}}}}
  catch(e){this.stats.fallos++;console.warn('[DROPS3D]',id,e)}
  this.tpls.set(id,t);return t}
 // ── alta de un drop ──
 make(e){const T=this.tpl(e.it),W3=this.W3,q=clamp(e.q|0,0,4),g=new THREE.Group(),d={e,g,q,T,ph:e.ph||0,spin:null,hh:0,hs:1,land:false,ring:null,spk:[]};
  const p0=W3(e.ox,e.oy,TER.standZ(e.ox,e.oy)),p1=W3(e.x,e.y,TER.standZ(e.x,e.y));d.p0=p0;d.p1=p1;g.position.copy(p0);
  const blob=new THREE.Mesh(this.gBlob,this.mBlob);blob.renderOrder=1;const rd=T?Math.max(.14,T.rad):.2;blob.scale.setScalar(rd*2.1);blob.position.y=.015;g.add(blob);d.blob=blob;
  const spin=new THREE.Group();g.add(spin);d.spin=spin;
  if(T){const m=cl(T.h);spin.add(m);d.m=m;d.k=T.h.scale.x}else{const m=new THREE.Mesh(new THREE.OctahedronGeometry(.12),new THREE.MeshBasicMaterial({color:'#ffd890'}));m.position.y=.12;spin.add(m);d.m=m;d.k=1}
  if(q>=1){const gl=new THREE.Mesh(this.gDisc,this.glowMat(q));gl.scale.setScalar(GLOW_R[q]);gl.position.y=.02;gl.renderOrder=2;g.add(gl);d.gl=gl;
   const n=2+q*2;for(let i=0;i<n;i++){const s=new THREE.Sprite(this.sparkMat(q));s.renderOrder=4;g.add(s);d.spk.push({s,o:i/n,r:.08+(i%3)*.07,a:i*2.4+d.ph,v:.35+.15*(i%3)})}
   if(q>=2){const bm=new THREE.Mesh(new THREE.CylinderGeometry(BEAM_W[q]*.55,BEAM_W[q],BEAM_H[q],14,1,true).translate(0,BEAM_H[q]/2,0),this.beamMat(q));bm.renderOrder=3;bm.visible=false;g.add(bm);d.beam=bm}}
  this.root.add(g);return d}
 ringFx(d,t){const m=new THREE.MeshBasicMaterial({color:this.col(d.q).multiplyScalar(2),transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}),r=new THREE.Mesh(this.gRing,m);r.renderOrder=3;r.position.y=.03;d.g.add(r);d.ring={r,m,t0:t}}
 // ── fotograma ──
 update(now,t,dt,tgt,cullR,hov){for(let q=2;q<5;q++)if(this.mBeam[q])this.mBeam[q].opacity=.62+.1*q*.3+.12*Math.sin(t*2.6+q);if(!this.on||typeof GD==='undefined')return;const R2=cullR*cullR;let live=0;
  const seen=new Set();
  for(let i=0;i<GD.length;i++){const e=GD[i];seen.add(e);let d=this.map.get(e);if(!d){d=this.make(e);this.map.set(e,d)}
   const g=d.g,age=now-e.t0,u=clamp(age/520,0,1),dx=d.p1.x-tgt.x,dz=d.p1.z-tgt.z;
   if(dx*dx+dz*dz>R2){g.visible=false;continue}g.visible=true;live++;
   // posición: arco de lanzamiento → reposo
   const eu=u*u*(3-2*u);g.position.x=d.p0.x+(d.p1.x-d.p0.x)*eu;g.position.z=d.p0.z+(d.p1.z-d.p0.z)*eu;const gy=d.p0.y+(d.p1.y-d.p0.y)*eu;
   const hop=Math.sin(u*PI)*.9,rest=d.q>=1?.09+Math.sin(t*2.2+d.ph)*.03:0,bounce=u>=1&&age<760?Math.abs(Math.sin((age-520)/240*PI))*.07*(1-(age-520)/240):0;
   g.position.y=gy+hop;d.m.position.y=(u<1?0:rest+bounce);
   // giro: lanzado = vuelta y media; en reposo, los comunes quietos (rumbo fijo por hash) y los raros giran despacio
   d.spin.rotation.y=d.q>=1?d.ph+t*.7:d.ph;d.spin.rotation.x=u<1?(1-u)*TAU*1.5:0;
   const hv=hov===e,tk=hv?1.2:1;d.hs+=(tk-d.hs)*(1-Math.exp(-dt*14));d.m.scale.setScalar(d.k*d.hs);   // el modelo ya trae su escala en la plantilla: aquí solo el realce del hover
   d.blob.visible=u>=.5;d.blob.material.opacity=.3;
   if(d.gl){const pu=.85+.15*Math.sin(t*3+d.ph);d.gl.scale.setScalar(GLOW_R[d.q]*pu*(hv?1.25:1));d.gl.visible=u>=.6}
   if(d.beam){d.beam.visible=u>=.85;const sw=(hv?1.5:1)*(1+.06*Math.sin(t*5+d.ph)),sy=clamp((age-520)/380,0,1);d.beam.scale.set(sw,Math.max(.001,sy*(hv?1.12:1)),sw)}
   for(const s of d.spk){const f=(t*s.v+s.o)%1,a=s.a+t*.8;s.s.position.set(Math.cos(a)*s.r,.05+f*(d.beam?BEAM_H[d.q]*.55:.6),Math.sin(a)*s.r);const sc=.07*Math.sin(f*PI)+.01;s.s.scale.setScalar(sc*(d.q>=2?1.3:1));s.s.visible=u>=.85}
   // aterrizaje: anillo expansivo (raros)
   if(!d.land&&u>=1){d.land=true;if(d.q>=2)this.ringFx(d,t)}
   if(d.ring){const k=(t-d.ring.t0)/.8;if(k>=1){g.remove(d.ring.r);d.ring.m.dispose();d.ring=null}else{d.ring.r.scale.setScalar(.25+k*(1.1+.35*d.q));d.ring.m.opacity=.9*(1-k)*(1-k)}}}
  // los que ya no están en GD: recogidos (vuelan al héroe) o caducados / guardados al entrar a una sala (se encogen donde están)
  for(const [e,d] of this.map)if(!seen.has(e)){this.map.delete(e);const pk=typeof GA!=='undefined'&&GA.find(a=>a.it===e.it&&a.x===e.x&&a.y===e.y);d.fly={t0:now,pk:!!pk};this.fly.push(d)}
  for(let i=this.fly.length-1;i>=0;i--){const d=this.fly[i],k=clamp((now-d.fly.t0)/(d.fly.pk?380:260),0,1),g=d.g;
   if(d.fly.pk&&typeof P!=='undefined'){const hp=this.W3(P.x,P.y,TER.standZ(P.x,P.y)),ek=k*k*(3-2*k);g.position.x+= (hp.x-g.position.x)*ek*.35;g.position.z+=(hp.z-g.position.z)*ek*.35;g.position.y+=((hp.y+.9)-g.position.y)*ek*.35+Math.sin(k*PI)*.02}
   g.scale.setScalar(Math.max(.01,1-.8*k*k));if(d.beam)d.beam.visible=false;if(d.gl)d.gl.material.opacity=.75*(1-k);d.spk.forEach(s=>s.s.visible=false);d.blob.visible=false;
   if(k>=1){this.root.remove(g);if(d.ring)d.ring.m.dispose();this.fly.splice(i,1)}}
  this.stats.vivos=live}
 get count(){return this.map.size}
 clear(){for(const d of this.map.values())this.root.remove(d.g);for(const d of this.fly)this.root.remove(d.g);this.map.clear();this.fly.length=0}
}
