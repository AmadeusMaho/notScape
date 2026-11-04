// NotScape · R3D · N1 · CUERPO CAÍDO DEL JUGADOR con el MODELO REAL + RAGDOLL (4 nov 2026; el dueño: «pon el modelo real, ligero (sin física del pelo ni faldas) y la muerte con ragdoll»).
// Al morir (fuera de cuevas/tutorial/jefes) el héroe reaparece como ESPÍRITU (estado `ghost` de status.js) y su CUERPO queda donde cayó (`S.corpse` en game.js → `R3D.corpse={x,y,rot,fresh}`).
// Este módulo crea (la primera vez que hace falta) una SEGUNDA instancia de `MiniHero` con el MISMO aspecto, armadura, peinado y arma que el héroe (`hero.look`) y la mueve con un RAGDOLL
// (ragdoll3d.js, `kind:'hum'`): cuerpo rígido que se tumba hacia atrás y rebota, y brazos/piernas/cabeza que la gravedad deja caer (se escriben sobre los huesos de IK de HeroAnim:
// `m.arms/elbows/legs/knees/head`, después de `anim.update`). LIGERO: `st.noPhys` evita `tickSkirt` (ni física del pelo ni de las faldas), no hay sombras propias ni vaina animada; se oculta al recuperar
// el cuerpo. Coste ≈ el de un héroe (65–140 llamadas) solo mientras esté a la vista. Encima, la funda de FANTASMA de bodyfx3d.js (llamitas) y el filtro espectral del mundo (r3d.js `ghostMix`).
// Si el modelo real falla, cae a un cuerpo de primitivas traslúcidas (build()).
// Contrato: new Corpse(scene,W3) · update(t,dt,c,hero) → {base,c,h,rad} (medidas para la funda) o null · c={x,y,rot,fresh}.
import * as THREE from 'three';
import {MiniHero} from './herom3d.js';
import {Ragdoll} from './ragdoll3d.js';

const PI=Math.PI,V=THREE.Vector3,Q=THREE.Quaternion,DOWN=new V(0,-1,0),UP=new V(0,1,0),_q=new Q(),_q2=new Q(),_e=new THREE.Euler();
export class Corpse{
 constructor(scene,W3){this.scene=scene;this.W3=W3;this.h=null;this.g=null;this.rag=null;this.cid=null;this.bad=false}
 /* fallback: cuerpo de primitivas con los colores del spec del héroe */
 build(spec){const mix=(c,k)=>new THREE.Color(c).lerp(new THREE.Color('#8fe8dc'),k),mat=(c,k=.28)=>new THREE.MeshLambertMaterial({color:mix(c,k),emissive:mix(c,.65).multiplyScalar(.22),transparent:true,opacity:.82,depthWrite:false,flatShading:true}),
  sk=spec.skin||'#e0b48a',top=spec.top||sk,pants=spec.pants||'#5a4a3a',boot=spec.boot||'#4a3a2a',g=new THREE.Group(),P=(geo,m,x,y,z,rx=0,ry=0,rz=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);g.add(o)},CS=(r,l)=>new THREE.CapsuleGeometry(r,l,3,8);
  P(CS(.15,.3),mat(top),0,.15,0,0,0,PI/2);P(new THREE.SphereGeometry(.15,10,8),mat(sk),.43,.15,0);for(const s of[1,-1]){P(CS(.055,.34),mat(top),.1,.1,s*.22,0,s*.35,PI/2);P(CS(.075,.4),mat(pants),-.5,.08,s*.1,0,s*.15,PI/2);P(new THREE.SphereGeometry(.09,7,6).scale(1.5,.8,1),mat(boot),-.83,.08,s*.12)}
  g.visible=false;this.scene.add(g);this.g=g}
 /* crea la segunda instancia del héroe (una vez) y le pone el aspecto actual */
 ensure(hero){if(!this.h){this.h=new MiniHero();this.scene.add(this.h.obj);this.h.obj.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false}})}
  this.h.setLook(hero.look);return this.h}
 update(t,dt,c,hero){if(!c||!hero||!hero.look){if(this.h)this.h.obj.visible=false;if(this.g)this.g.visible=false;this.cid=null;return null}
  let z=1;try{z=TER.standZ(c.x,c.y)}catch(e){}const b=this.W3(c.x,c.y,z);
  if(this.cid!==c){this.cid=c;const yaw=c.rot||0;this.yaw=yaw;   /* cae hacia ATRÁS respecto a donde miraba */
   this.rag=new Ragdoll({kind:'hum',seed:Math.abs(Math.sin((c.x*.013+c.y*.007)))*6+1,fall:[0,-1],power:.8,hgt:1,rad:.13});
   if(!c.fresh){for(let i=0;i<150;i++)this.rag.step(.02)}}   /* partida cargada: ya está tumbado */
  const R=this.rag;R.step(dt);if(R.lying&&c.fresh&&R.t>1.5)c.fresh=0;
  let m=null;if(!this.bad){try{this.ensure(hero);m=this.h.m}catch(e){console.warn('[corpse] modelo real:',e);this.bad=true;if(this.h){this.scene.remove(this.h.obj);this.h=null}}}
  if(m){const H=this.h;H.obj.visible=true;
   H.update({x:b.x,y:b.y,z:b.z,t,face:[Math.sin(this.yaw),Math.cos(this.yaw)],mv:false,run:false,w:0,hurt:0,act:null,night:0,wind:[0,0],noPhys:1},dt);
   const o=m.obj;_q.setFromAxisAngle(UP,this.yaw);_q2.copy(_q).multiply(R.qb);o.quaternion.copy(_q2);
   _e.set(0,0,0);const off=new V(R.off.x,R.lift,R.off.z).applyQuaternion(_q);o.position.add(off).y+=0;
   // miembros del ragdoll sobre los huesos de IK (limbs: 0 brazoR · 1 brazoL · 2 piernaR · 3 piernaL del ragdoll; el héroe tiene la derecha en x−, así que se cruzan)
   const L=R.limbs,A=m.arms,E=m.elbows,Lg=m.legs,K=m.knees;
   if(A&&E&&Lg&&K&&L.length===4){[[A[0],E[0],L[1],-1],[A[1],E[1],L[0],-1],[Lg[0],K[0],L[3],1],[Lg[1],K[1],L[2],1]].forEach(([a,e,l,fs])=>{a.quaternion.setFromUnitVectors(DOWN,l.d);e.quaternion.setFromEuler(_e.set(fs*l.flex,0,0))});
    if(m.ankles)m.ankles.forEach(k=>k.quaternion.identity());m.head.quaternion.setFromUnitVectors(UP,R.head)}
   if(this.g)this.g.visible=false}
  else{if(!this.g)this.build(hero.m&&hero.m.spec||{});const g=this.g;g.visible=true;g.position.set(b.x,b.y+.02,b.z);g.rotation.y=this.yaw}
  return{base:b.clone(),c:new V(b.x,b.y+.3,b.z),h:.6,rad:.5}}
}
