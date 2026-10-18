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
import {armorHooks} from './armor3d.js';
import {toon,glow,G} from './materials3d.js';
const lerp=(a,b,u)=>a+(b-a)*u,sph=(r,x=1,y=1,z=1)=>new THREE.SphereGeometry(r,16,12).scale(x,y,z);
const shade=(c,k)=>'#'+new THREE.Color(c).multiplyScalar(k).getHexString(),mixc=(a,b,t)=>'#'+new THREE.Color(a).lerp(new THREE.Color(b),t).getHexString();
export const HERO_SCALE=.8;      // el mundo se ve ×1,25 más grande (zoom en game.js) con el héroe del mismo tamaño en pantalla: casas y terreno ganan proporción sin tocar la lógica
const HEIGHT=1.25*HERO_SCALE;

export function hairFn(style,c,helm){return(F,head,part)=>{if(helm)return;if(style==='bald')return;const P=(g,x,y,z,o={})=>part(g,c,x,y,z,Object.assign({p:head,ink:.016},o));
 const cap=(k=1,a=1.75)=>P(new THREE.SphereGeometry(.205*k,18,12,0,6.2832,0,a).scale(1,1.04,1.02),0,.03,-.03);
 switch(style){
  case'cut':cap(1,1.62);P(sph(.1,1.5,.5,.5),0,.15,.16,{ink:.01});break;
  case'spiky':cap(1,1.55);for(let i=0;i<7;i++){const a=i/7*Math.PI*2;P(new THREE.ConeGeometry(.045,.13,5),Math.cos(a)*.11,.21,Math.sin(a)*.1-.03,{ink:.01}).rotation.set(Math.sin(a)*.5,0,-Math.cos(a)*.5)}P(new THREE.ConeGeometry(.05,.15,5),0,.27,-.02,{ink:.01});break;
  case'side':cap(1,1.7);P(sph(.13,1.4,.55,.5),.05,.14,.15,{ink:.01}).rotation.z=-.35;break;
  case'curly':cap(1,1.5);for(let i=0;i<9;i++){const a=i/9*Math.PI*2;P(sph(.055),Math.cos(a)*.16,.12+(i%2)*.05,Math.sin(a)*.15-.03,{ink:.01})}P(sph(.07),0,.25,-.02,{ink:.01});break;
  case'mane':cap(1,1.8);P(new THREE.CapsuleGeometry(.15,.28,6,12).scale(1,1,.7),0,-.12,-.13,{ink:.016});break;
  case'long':cap(1,1.8);P(new THREE.CapsuleGeometry(.16,.36,6,12).scale(1,1,.6),0,-.16,-.12,{ink:.016});[-1,1].forEach(q=>P(new THREE.CapsuleGeometry(.04,.3,4,8),.17*q,-.07,.0,{ink:.01}));P(sph(.11,1.4,.5,.5),0,.15,.16,{ink:.01});break;
  case'bun':cap(1,1.7);P(sph(.085),0,.24,-.1,{ink:.012});P(sph(.1,1.4,.5,.5),0,.15,.16,{ink:.01});break;
  case'pony':cap(1,1.7);P(sph(.06),0,.17,-.2,{ink:.01});P(new THREE.CapsuleGeometry(.05,.3,4,8),0,-.02,-.26,{ink:.012}).rotation.x=.2;P(sph(.1,1.4,.5,.5),0,.15,.16,{ink:.01});break;
  case'bob':cap(1,1.8);P(new THREE.SphereGeometry(.23,16,10,0,6.2832,.9,1.2).scale(1,1,.95),0,-.02,-.04,{ink:.016});P(sph(.1,1.4,.5,.5),0,.15,.16,{ink:.01});break;
  case'twin':cap(1,1.7);[-1,1].forEach(q=>P(new THREE.CapsuleGeometry(.05,.26,4,8),.2*q,-.06,-.04,{ink:.012}));P(sph(.1,1.4,.5,.5),0,.15,.16,{ink:.01});break;
 }}}

export function lookToSpec(look){look=look||{};const a=Object.assign({g:'m',hair:'cut',hc:'#5a3a22',skin:'#e0b48a',col:'#8a3a34',eye:'#2a1a14',face:0},look.app||{}),O=look.outfit||{},GR=look.gear||{},fem=a.g==='f';
 const robe=a.col,trim=shade(robe,.62),skin=a.skin,AH=armorHooks(look.arm,{robe}),helm=look.helm||(AH&&AH.hasHelm?'#':null),arm=!AH&&(look.ar||GR.pl)?(look.ar||'#9a9aa8'):null,wide=O.build==='robusto'?1.14:O.build==='anciano'?.95:1;
 const scarfC=O.scarf===false?null:(typeof a.scarf==='string'?a.scarf:'#b8862e');
 const sp={id:'heroe',k:HERO_SCALE,pants:O.pantsC||mixc('#4a4338',robe,.18),robe,trim,belt:O.rope||shade(robe,.5),skin,w:wide*(fem?.94:1),irisC:mixc(a.eye,'#000000',.15),browT:[.12,.1,-.04,.26][a.face|0]??.12,freckles:a.face===1,boot:look.boot||'#3a2a20',blush:fem&&a.face===2,
  top(F,head,part){hairFn(a.hair,a.hc,helm)(F,head,part);
   if(helm&&!AH){const c=helm;part(new THREE.SphereGeometry(.215,16,10,0,6.2832,0,1.6).scale(1,1.05,1),c,0,.04,0,{p:head,ink:.018});part(new THREE.CylinderGeometry(.235,.235,.03,18),c,0,.045,0,{p:head,ink:.014});part(new THREE.BoxGeometry(.03,.14,.03),shade(c,.85),0,0,.22,{p:head,ink:.01})}
   if(O.hat==='panuelo'){const c=O.hatC||'#8a3a2a';part(new THREE.SphereGeometry(.21,16,10,0,6.2832,0,1.45).scale(1,1,1.02),c,0,.04,-.03,{p:head,ink:.016});part(sph(.05),c,0,.07,-.22,{p:head,ink:.01})}},
  acc(F,g,part){
   if(scarfC){part(new THREE.TorusGeometry(.135,.04,8,20).rotateX(Math.PI/2),scarfC,0,.8,.0,{p:g,ink:.014});part(new THREE.BoxGeometry(.085,.3,.03),shade(scarfC,.9),.08,.66,.14,{p:g,ink:.012}).rotation.z=.08}
   if(O.capelet)part(new THREE.CylinderGeometry(.15,.3,.26,18,1,true).translate(0,.8,0),O.capelet,0,0,0,{p:g,ink:.014,t:{side:THREE.DoubleSide}});
   if(O.bag||O.pouches){part(new THREE.BoxGeometry(.03,.44,.016),'#5a3e2c',0,.58,.2,{p:g,ink:.01}).rotation.z=.8;part(new THREE.BoxGeometry(.09,.1,.07),'#6a4a30',-.18,.34,.14,{p:g,ink:.012})}
   if(O.quiver){part(new THREE.CylinderGeometry(.05,.045,.4,8),'#5a3e2c',-.08,.62,-.22,{p:g,ink:.012}).rotation.z=.25;[0,1,2].forEach(i=>part(new THREE.CylinderGeometry(.006,.006,.15,4),'#e8e0c8',-.13+i*.02,.86,-.22,{p:g,ink:0}))}
   if(O.pauldron||O.fur){const c=O.pauldron||'#8a8a90';part(sph(.1,1.2,.8,1.1),c,-.22,.8,0,{p:g,ink:.016});if(O.fur)part(new THREE.TorusGeometry(.15,.05,8,18).rotateX(Math.PI/2),O.fur,0,.84,0,{p:g,ink:.014})}
   if(arm){part(new THREE.CylinderGeometry(.19,.25,.5,18,1,true).translate(0,.55,0).scale(1,1,1),arm,0,0,0,{p:g,ink:.014,t:{side:THREE.DoubleSide}});[-1,1].forEach(q=>part(sph(.09,1.2,.8,1.1),arm,.2*q,.8,0,{p:g,ink:.014}))}
   if(O.tabard)part(new THREE.BoxGeometry(.2,.62,.02),O.tabard,0,.45,.25,{p:g,ink:.012});
   /* armas y escudo: los crea HeroAnim (heroanim3d.js) en las manos / vaina */}};
 if(AH){Object.assign(sp,AH.spec);const t0=sp.top,a0=sp.acc;sp.top=(F,h,p)=>{t0(F,h,p);AH.top(F,h,p)};sp.acc=(F,g,p)=>{a0(F,g,p);AH.acc(F,g,p)}}   // Lote R3D-ARMADURAS: equipo estructurado look.arm → armor3d.js
 return sp}

export class MiniHero{
 constructor(){this.obj=new THREE.Group();this.obj.name='heroMini';this.cloth=[];this.rodTip=null;this.lookKey='';this.look=null;this.m=null;this.anim=null;this.last=null;this.face=0;this.faceT=0;this.t=0;this.HS=1}
 setLook(look){const key=JSON.stringify(look||{});if(key===this.lookKey)return;this.lookKey=key;this.look=look||{};
  if(this.m){this.obj.remove(this.m.obj);this.m.obj.traverse(o=>o.geometry&&o.geometry.dispose())}
  this.m=new Mini(lookToSpec(this.look));this.m.setInk(true);this.obj.add(this.m.obj);this.root=this.m.obj;this.anim=new HeroAnim(this.m,this.look)}
 update(st,dt){const m=this.m;if(!m)return;this.t=st.t||0;const pos=new THREE.Vector3(st.x,st.y,st.z);let dist=0;
  if(this.last){const dx=pos.x-this.last.x,dz=pos.z-this.last.z,d=Math.hypot(dx,dz);if(d<2.5)dist=d;if(d>1e-4&&st.mv&&!st.face)this.faceT=Math.atan2(dx,dz)}
  if(st.face)this.faceT=Math.atan2(st.face[0],st.face[1]);this.last=pos.clone();
  const df=((this.faceT-this.face+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;this.face+=df*(1-Math.exp(-dt*(st.mv?11:8)));
  m.obj.position.copy(pos);m.obj.rotation.y=this.face;G.uChrB.value.set(pos.y,HEIGHT);
  st.dist=dist;this.anim.update(st,dt,this.t);this.rodTip=this.anim.rodTip}
}
