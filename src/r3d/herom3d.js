// NotScape · R3D · HÉROE «DIORAMA» (17 oct 2026, aprobado por el dueño: «me encanta, integralo»). Sustituye al héroe facetado de hero3d.js con la MISMA interfaz:
//   const h=new MiniHero(); scene.add(h.obj); h.setLook(look); cada fotograma h.update(st,dt) (st igual que Hero: x,y,z,mv,run,w,act,hurt,t,face,night,wind), h.lookKey, h.cloth=[], h.rodTip.
// El cuerpo lo construye mini3d.js (túnica en cono, cabeza redonda, cel shading, contorno). Aquí se traduce el `look` del juego (app + atuendo + equipo) a un diseño Mini:
//  · app: g (género → peinados), hair/hc, skin, col (= color de la túnica), eye (iris), face (0 clásica · 1 pecas · 2 dulce · 3 seria), scarf (bufanda de acento).
//  · outfit (outfits3d.js): scarf, bandolera, capelina, cuerda, hombrera/piel, carcaj, ancho (build robusto).  SIN capucha para el héroe (solo el Bandido la lleva).
//  · equipo: gear.wp (espada/mandoble/daga → hoja en la mano; bastón; arco en la mano izquierda), gear.sh (escudo en el antebrazo), look.ar/gear.pl (coraza), look.helm (yelmo), look.boot (botas).
// ANIMACIÓN (Lote R3D-ANIM, 17 oct 2026): src/r3d/heroanim3d.js (HeroAnim) — guardias de combate por arma, ataques con peso, trabajos, andar/correr por
// distancia, IK de brazos y piernas. Las armas, el escudo y las herramientas los construye HeroAnim (no lookToSpec) para poder animarlos y envainarlos.
// Extra en st (opcional): cb = en combate (guardia aunque no haya golpe en curso), speed = velocidad virtual (visores), dist = la calcula update().
import * as THREE from 'three';
import {Mini} from './mini3d.js';
import {HeroAnim} from './heroanim3d.js';
import './skillanim3d.js';   // N0-HABILIDADES-ANIM: clips de las habilidades del jugador (se registran en HeroAnim.skillClip)
import {armorHooks} from './armor3d.js';
import {toon,glow,G} from './materials3d.js';
const lerp=(a,b,u)=>a+(b-a)*u,sph=(r,x=1,y=1,z=1)=>new THREE.SphereGeometry(r,16,12).scale(x,y,z);
// Lote R3D-FASE2 (19 oct 2026, sugerencias héroe↔props aceptadas): `tame` baja saturación (s) y luminosidad (l) de un color conservando el tono que eligió el jugador.
// La túnica y la bufanda salían MÁS saturadas que cualquier cosa de la aldea oscura; la bufanda sigue siendo el acento (menos apagada que la túnica). `fct` = esfera de pocas caras con normales planas.
const tame=(c,s,l)=>{const q=new THREE.Color(c),h={};q.getHSL(h);return '#'+new THREE.Color().setHSL(h.h,h.s*s,h.l*l).getHexString()};
export const TAME={robe:[.85,.78],scarf:[.84,.97]};   // #c0392b → #a6453e (rojo/burdeos apagado) · #b8862e → #af8546 (el acento sigue siendo la bufanda)
const fsph=(r,sx,sy,sz)=>{const g=new THREE.SphereGeometry(r,8,5).scale(sx,sy,sz).toNonIndexed();g.computeVertexNormals();return g};
const shade=(c,k)=>'#'+new THREE.Color(c).multiplyScalar(k).getHexString(),mixc=(a,b,t)=>'#'+new THREE.Color(a).lerp(new THREE.Color(b),t).getHexString();
import {HK} from './scale3d.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {torsoWear,maskWear,penitentCross,strapsWear,mixc as mix2} from './outfitwear3d.js';
import {kitWear,TX} from './kits3d.js';   // atuendos iniciales rehechos (lote N0.5-ATUENDOS-2)
import {Mount3D,setMountTint,SEAT as MOUNT_SEAT} from './mount3d.js';   // Lote DOMAR-D1: la montura cuelga del héroe
export const HERO_SCALE=.8*HK;      // el mundo se ve ×1,25 más grande (zoom en game.js) con el héroe del mismo tamaño en pantalla: casas y terreno ganan proporción sin tocar la lógica
const HEIGHT=1.25*HERO_SCALE;

/* PEINADOS: rehechos en hair3d.js (lote N0.5-PELO-REWORK): casquete esculpido + mechones con física ligera. Se reexporta para actors3d.js. */
import {hairFn} from './hair3d.js';
export {hairFn};

// radio del torso (camisa) a la altura y (aprox. del lathe de mini3d.js: cintura .155 → pecho .19) y cinta CURVA de bandolera que lo abraza (lazo diagonal: alta en el hombro derecho x−, baja en la cadera izquierda x+)
const torsoR=y=>{const t=Math.max(0,Math.min(1,(y-.5)/.2));return .155+.04*t*t*(3-2*t)};
function bandolier(w=.05,off=0,lift=0){const N=48,P=[],I=[],V=THREE.Vector3;for(let i=0;i<=N;i++){const ph=i/N*Math.PI*2,y=.63-.17*Math.sin(ph),R=torsoR(y)+.016+off,rx=Math.sin(ph),rz=Math.cos(ph),t=new V(R*rz,-.17*Math.cos(ph),-R*rx).normalize(),n=new V(rx,0,rz),u=new V().crossVectors(t,n).normalize();
  for(const s of[-1,1]){const ww=w/2*s+lift*s;P.push(R*rx+u.x*ww,y+u.y*ww,R*rz+u.z*ww)}}
 for(let i=0;i<N;i++){const a=i*2;I.push(a,a+2,a+1,a+1,a+2,a+3)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setIndex(I);g.computeVertexNormals();return g}
export function lookToSpec(look){look=look||{};const a=Object.assign({g:'m',hair:'cut',hc:'#5a3a22',skin:'#e0b48a',col:'#8a3a34',eye:'#2a1a14',face:0},look.app||{}),O=a.under?{}:(look.outfit||{}),GR=look.gear||{},fem=a.g==='f';   /* sin ropa: NINGUNA pieza del atuendo (antes quedaban los tirantes y la bandolera del Errante: las «correas») */
 const robe=tame(a.col,TAME.robe[0],TAME.robe[1]),trim=shade(robe,.62),skin=a.skin,AH=armorHooks(look.arm,{robe}),helm=look.helm||(AH&&AH.hasHelm?'#':null),arm=!AH&&(look.ar||GR.pl)?(look.ar||'#9a9aa8'):null,wide=O.build==='robusto'?1.14:O.build==='anciano'?.95:1;
 const longRobe=O.skirt==='larga'&&O.cross!==false&&!AH&&!arm&&O.build!=='anciano';   // PENITENTE: túnica larga de tela fina hasta los pies (el Anciano PNJ usa otro camino)
 const scarfC=(O.scarf===false||a.under)?null:tame(typeof a.scarf==='string'?a.scarf:'#b8862e',TAME.scarf[0],TAME.scarf[1]);
 const sp={id:'heroe',k:HERO_SCALE,texOf:a.under?null:(c,isSkin)=>isSkin?null:c===sp.boot||c===sp.belt?TX('cuero').t:(c===sp.robe||c===sp.pants||c===sp.trim||c===sp.sleeve)?TX('tela').t:null,facet:true,inkK:.8,pants:O.pantsC||mixc('#4a4338',robe,.18),robe,trim,belt:O.rope||shade(robe,.5),skin,w:wide*(fem?.94:1),irisC:mixc(a.eye,'#000000',.15),browT:[.12,.1,-.04,.26][a.face|0]??.12,freckles:a.face===1,boot:look.boot||'#3a2a20',blush:fem&&a.face===2,
  top(F,head,part){hairFn(a.hair,a.hc,helm)(F,head,part);if(!helm)maskWear(O,part,head);
   if(helm&&!AH){const c=helm;part(new THREE.SphereGeometry(.215,16,10,0,6.2832,0,1.6).scale(1,1.05,1),c,0,.04,0,{p:head,ink:.018});part(new THREE.CylinderGeometry(.235,.235,.03,18),c,0,.045,0,{p:head,ink:.014});part(new THREE.BoxGeometry(.03,.14,.03),shade(c,.85),0,0,.22,{p:head,ink:.01})}
   if(O.hat==='panuelo'){const c=O.hatC||'#8a3a2a';part(new THREE.SphereGeometry(.21,16,10,0,6.2832,0,1.45).scale(1,1,1.02),c,0,.04,-.03,{p:head,ink:.016});part(sph(.05),c,0,.07,-.22,{p:head,ink:.01})}},
  acc(F,g,part){
   if(scarfC){part(new THREE.TorusGeometry(.135,.04,8,20).rotateX(Math.PI/2),scarfC,0,.8,.0,{p:g,ink:.014});part(new THREE.BoxGeometry(.085,.3,.03),shade(scarfC,.9),.08,.66,.14,{p:g,ink:.012}).rotation.z=.08}
   if(!AH&&!arm){const Wf=wide*(fem?.94:1),Rn=y=>torsoR(y)*Wf,DRf=yy=>{const PD=[[.3,0],[.31,.04],[.24,.3],[.19,.55],[.17,.74],[.12,.84],[0,.86]];for(let i=0;i<PD.length-1;i++){const p0=PD[i],p1=PD[i+1];if(yy>=p0[1]&&yy<=p1[1])return(p0[0]+(p1[0]-p0[0])*(yy-p0[1])/(p1[1]-p0[1]))*Wf}return .1};
    if(longRobe)penitentCross(part,g,DRf,O.cross||'#c9a95e');
    if(O.kit)kitWear(O.kit,F,g,part,{Rf:Rn,DRf,W:Wf,aw:Math.max(1,Math.min(Wf,1.5)),lw:Math.min(Wf,1.4),robe:longRobe?sp.robe:robe,sash:O.sash,cape:O.cape,lea:O.lea,fur:O.fur});
    else if(!longRobe){if(O.top)torsoWear(O,part,g,Rn);strapsWear(O,part,g,Rn)}}
   if(O.capelet&&!O.kit)part(new THREE.CylinderGeometry(.15,.3,.26,18,1,true).translate(0,.8,0),O.capelet,0,0,0,{p:g,ink:.014,t:{side:THREE.DoubleSide}});
   if(O.bag||O.pouches){   // R3D-HEROE-CORREA (20 oct 2026): la bandolera era una caja RECTA flotando sobre el pecho y la bolsa un cubo suelto fuera del cuerpo. Ahora: cinta CURVA que abraza el torso (hélice del hombro derecho a la cadera izquierda, pasando por la espalda) y una bolsa de cinturón COLGADA de la cintura con solapa, hebilla y dos correas.
    part(bandolier(.052),O.bagC||'#5a3e2c',0,0,0,{p:g,ink:0,t:{side:THREE.DoubleSide}});part(bandolier(.012,.0,.018),'#2a1c14',0,0,0,{p:g,ink:0,t:{side:THREE.DoubleSide}});   // cinta + canto oscuro
    {const ph=-1.0,R=torsoR(.4)+.05,pg=new THREE.Group();pg.position.set(R*Math.sin(ph),.4,R*Math.cos(ph));pg.rotation.y=ph;g.add(pg);
     part(sph(.062,1,1.12,.78),'#6a4a30',0,0,0,{p:pg,ink:.012});part(new THREE.SphereGeometry(.066,12,7,0,6.2832,0,1.25).scale(1,.85,.82),'#58381f',0,.016,.006,{p:pg,ink:.01});
     part(new THREE.BoxGeometry(.022,.03,.012),'#c8a050',0,-.008,.052,{p:pg,ink:0});[-1,1].forEach(q=>part(new THREE.BoxGeometry(.013,.11,.01),'#3a2616',q*.034,.085,-.008,{p:pg,ink:0}));   // correas a la cintura (y≈.5)
     part(new THREE.BoxGeometry(.2,.022,.012),'#3a2616',0,.145,-.012,{p:pg,ink:0}).rotation.y=0}}
   if(O.quiver){const qg=new THREE.Group();qg.position.set(-.07,.64,-.235);qg.rotation.z=.32;g.add(qg);const ql='#5a3e2c';   /* carcaj de cuero con aros, flechas emplumadas y correa curva (N0.5-ATUENDOS-2) */
    part(new THREE.LatheGeometry([[.0,-.2],[.04,-.2],[.05,-.17],[.052,.14],[.056,.17],[.05,.18]].map(p=>new THREE.Vector2(p[0],p[1])),14),ql,0,0,0,{p:qg,ink:.012,...TX('cuero',1)});[-.12,.1].forEach(y=>part(new THREE.TorusGeometry(.053,.007,6,16).rotateX(Math.PI/2),'#2e2018',0,y,0,{p:qg,ink:0,...TX('cuero')}));
    for(let i=0;i<5;i++){const x=(i-2)*.017,z=(i%2?.012:-.01);part(new THREE.CylinderGeometry(.004,.004,.14,4),'#8a6a40',x,.24,z,{p:qg,ink:0});part(new THREE.ConeGeometry(.013,.05,3),i%2?'#e8e0c8':'#a83a2a',x,.3,z,{p:qg,ink:.003,t:{side:THREE.DoubleSide}})}
    part(bandolier(.03,.002),ql,0,0,0,{p:g,ink:0,...TX('cuero',1)})}
   if(O.pauldron||O.fur){const c=O.pauldron||'#8a8a90';part(fsph(.1,1.2,.8,1.1),c,-.22,.8,0,{p:g,ink:.016});if(O.fur)part(new THREE.TorusGeometry(.15,.05,8,18).rotateX(Math.PI/2),O.fur,0,.84,0,{p:g,ink:.014})}
   if(arm){part(new THREE.CylinderGeometry(.19,.25,.5,18,1,true).translate(0,.55,0).scale(1,1,1),arm,0,0,0,{p:g,ink:.014,t:{side:THREE.DoubleSide}});[-1,1].forEach(q=>part(sph(.09,1.2,.8,1.1),arm,.2*q,.8,0,{p:g,ink:.014}))}
   if(O.tabard)part(new THREE.BoxGeometry(.2,.62,.02),O.tabard,0,.45,.25,{p:g,ink:.012});
   /* armas y escudo: los crea HeroAnim (heroanim3d.js) en las manos / vaina */}};
 if(longRobe){const rb=mix2(robe,O.skirtC||'#5a5450',.88);Object.assign(sp,{id:'heroe-mago',dress:true,hem:.04,flare:.84,robe:rb,sleeve:rb,trim:mix2(rb,'#e6dcc6',.42)})}   // `heroe-mago` está en Mini.DRESS_OK
 if(AH){Object.assign(sp,AH.spec);const t0=sp.top,a0=sp.acc;sp.top=(F,h,p)=>{t0(F,h,p);AH.top(F,h,p)};sp.acc=(F,g,p)=>{a0(F,g,p);AH.acc(F,g,p)}}   // Lote R3D-ARMADURAS: equipo estructurado look.arm → armor3d.js

 /* ROPA INTERIOR (22 oct 2026; despertar en la playa): `app.under` = el personaje solo lleva ropa interior (calzón corto de lino, y una banda en el pecho si es femenino); sin camisa, bufanda ni botas (todo del color de la piel). Se quita al vestirse (`S.app.under=0`). */
 if(a.under){const lin='#d9cdb0',sk=a.skin;Object.assign(sp,{robe:sk,trim:null,belt:null,sleeve:sk,pants:sk,boot:sk});const a1=sp.acc;sp.acc=(F,g,part)=>{a1&&a1(F,g,part);
  /* N0.5-ATUENDOS-2: calzón de lino de revolución (sin tapas planas) con cintura enrollada y cordón anudado, perneras que siguen a los muslos; banda de pecho con nudo a la espalda */
  const LT=(pts,n=24)=>new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),n),W1=sp.w,lw=Math.min(W1,1.4);
  part(LT([[.135*W1,.4],[.158*W1,.43],[.168*W1,.47],[.162*W1,.52],[.15*W1,.545]]),lin,0,0,0,{p:g,ink:.012,...TX('lino',1)});
  part(new THREE.TorusGeometry(.157*W1,.013,6,24).rotateX(Math.PI/2),shade(lin,.86),0,.54,0,{p:g,ink:.006,...TX('lino')});
  part(new THREE.SphereGeometry(.016,8,6).scale(1.3,.8,.7),shade(lin,.8),0,.535,.158*W1+.006,{p:g,ink:.004});[-1,1].forEach(q=>part(new THREE.CylinderGeometry(.004,.004,.07,4).rotateZ(.25*q),shade(lin,.75),.012*q,.5,.158*W1+.008,{p:g,ink:0}));
  F.legs.forEach(l=>{part(LT([[.074*lw,.01],[.082*lw,-.02],[.08*lw,-.075],[.072*lw,-.085]],14),lin,0,0,0,{p:l,ink:.01,...TX('lino',1)});part(new THREE.TorusGeometry(.079*lw,.007,5,14).rotateX(Math.PI/2),shade(lin,.88),0,-.078,0,{p:l,ink:0})});
  if(fem){part(LT([[.15*W1,.79],[.168*W1,.81],[.175*W1,.86],[.16*W1,.9],[.142*W1,.905]]),lin,0,0,0,{p:g,ink:.012,...TX('lino',1)});part(new THREE.SphereGeometry(.02,8,6).scale(1.2,.8,.7),shade(lin,.8),0,.85,-.172*W1,{p:g,ink:.004})}}}
 return sp}

export class MiniHero{
 constructor(){this.obj=new THREE.Group();this.obj.name='heroMini';this.cloth=[];this.rodTip=null;this.lookKey='';this.look=null;this.m=null;this.anim=null;this.last=null;this.face=0;this.faceT=0;this.t=0;this.HS=1;this.mounts={};this.mount=this.mountOf('caballo')}
 mountOf(sp,tk){tk=tk||'';const key=sp+'|'+tk;let m=this.mounts[key];if(!m){m=new Mount3D(sp,undefined,true,tk);m.key=key;/* una variante de aparejo por especie: se descarta la anterior */for(const k in this.mounts){if(this.mounts[k].sp===sp&&k!==key){const o=this.mounts[k];if(o!==this.mount){this.obj.remove(o.obj);o.dispose();delete this.mounts[k]}}}this.mounts[key]=m;this.obj.add(m.obj)}return m}   /* DOMAR-D3: una Mount3D por especie usada, cacheada (las demás invisibles) */
 setLook(look){const key=JSON.stringify(look||{});if(key===this.lookKey)return;this.lookKey=key;this.look=look||{};
  if(this.anim&&this.anim.ench){this.anim.ench.dispose();this.anim.ench=null}   // el aspecto del encantamiento cuelga de `obj` (que se conserva): sin esto se quedaban los del arma anterior
  if(this.m){this.obj.remove(this.m.obj);this.m.obj.traverse(o=>o.geometry&&o.geometry.dispose())}
  this.m=new Mini(lookToSpec(this.look));this.m.setInk(true);this.obj.add(this.m.obj);this.root=this.m.obj;this.anim=new HeroAnim(this.m,this.look)}
 update(st,dt){const m=this.m;if(!m)return;this.t=st.t||0;const pos=new THREE.Vector3(st.x,st.y,st.z);let dist=0;
  if(this.last){const dx=pos.x-this.last.x,dz=pos.z-this.last.z,d=Math.hypot(dx,dz);if(d<2.5)dist=d;if(d>1e-4&&st.mv&&!st.face)this.faceT=Math.atan2(dx,dz)}
  if(st.face)this.faceT=Math.atan2(st.face[0],st.face[1]);this.last=pos.clone();
  const df=((this.faceT-this.face+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;this.face+=df*(1-Math.exp(-dt*(st.mv?11:8)));
  if(st.msp&&(st.msp!==this.mount.sp||(st.mtk||'')!==this.mount.tk)){this.mount.update(0,0,0,dt,this.t,pos,this.face);this.mount=this.mountOf(st.msp,st.mtk)}setMountTint(st.mti);st.mfw=this.mount.fw;const rd=st.ride||0,rse=rd*rd*(3-2*rd);m.obj.position.copy(pos);m.obj.rotation.y=this.face;if(rd>0)m.obj.position.y+=this.mount.seat*rse+Math.sin(rd*Math.PI)*.08;   /* DOMAR-D1: el jinete sube a la silla (con un saltito al montar/desmontar) */G.uChrB.value.set(pos.y,HEIGHT);
  {const sl=st.sleep||0;m.obj.rotation.order='YXZ';if(sl>0){const r=1-sl,sm=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)},a2=sm(.4,.8,r),a3=sm(.8,1,r);   // DORMIDO / LEVANTÁNDOSE (22 oct 2026): `st.sleep` 1 = tumbado boca arriba; al bajar a 0: (r<.4) solo se incorpora el torso (heroanim3d.js), (.4–.8) el cuerpo se alza en cuclillas, (.8–1) se pone de pie
   m.obj.rotation.x=-Math.PI/2*(1-a2)+.14*a2*(1-a3);m.obj.position.y+=.17*(1-a2)}else m.obj.rotation.x=0}
  st.dist=dist;this.mount.update(rd,st.gait||0,dist,dt,this.t,pos,this.face);if(rd>.001){st.mv=false;st.run=false;st.w=0}   /* montado: el héroe no camina (lo hace el caballo) */
  this.anim.update(st,dt,this.t);m.tickSkirt(dt);this.rodTip=this.anim.rodTip;this.handR=this.anim.handR}
}
