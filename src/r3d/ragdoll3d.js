// NotScape · R3D · RAGDOLL PROCEDURAL (4 nov 2026; el dueño: «la animación de muerte con ragdolls, también la de los enemigos»).
// NO es un motor de físicas con colisiones entre piezas: es un ragdoll ARTICULADO y barato (≈ 40 operaciones de vector por fotograma y criatura) que sí hace lo que se nota:
//   · CUERPO RÍGIDO que se TUMBA como un péndulo invertido alrededor de los pies, en la dirección del último golpe (gravedad ∝ sen θ), con impulso inicial según la potencia del golpe,
//     REBOTE al tocar el suelo (restitución ≈ .2) y deslizamiento con rozamiento; la altura sube con el grosor del cuerpo al tumbarse (no se hunde en el suelo);
//   · MIEMBROS como vectores de dirección con inercia: cada brazo/pierna/cabeza es una dirección `d` (en el marco del cuerpo) que la GRAVEDAD arrastra hacia el suelo (ya con el cuerpo inclinado),
//     con amortiguación, LÍMITE de ángulo respecto a su reposo, PATADAS de inercia al empezar y al golpear el suelo, y SUELO: una dirección nunca apunta por debajo del suelo (los brazos quedan
//     tendidos a los lados, no atraviesan el torso); codos/rodillas son resortes cuyo objetivo depende de si el miembro está levantado contra la gravedad (se doblan hacia abajo);
//   · COLA y orejas: osciladores amortiguados con el impulso de la caída.
// Uso (actors3d.js): `A.rag=new Ragdoll({kind:'hum'|'quad'|'tip',seed,fall:[x,z] (dirección de caída en el marco del modelo),power,hgt,rad})`; cada fotograma `A.rag.step(dt)` y `A.rag.apply(A)`.
// Nombres de hueso: humanoides rig2 (armR/elbR/legR/kneeR/neck/head) y cuadrúpedos autoRig (legFL/kneeFL/pawFL…, neck, head, tail*). Los demás solo se tumban (`tip`).
// El héroe usa `Ragdoll` con `kind:'pose'` (ver `corpse3d.js`): en vez de huesos escribe objetivos de IK de la pose de HeroAnim.
import * as THREE from 'three';
const V=THREE.Vector3,Q=THREE.Quaternion,DOWN=new V(0,-1,0),UP=new V(0,1,0);
const hh=(a,b)=>{const s=Math.sin(a*127.1+b*311.7)*43758.5453;return s-Math.floor(s)};
const cl=(v,a,b)=>v<a?a:v>b?b:v;
const _q=new Q(),_q2=new Q(),_v=new V(),_g=new V(),_a=new V();

class Limb{
 constructor(o,seed){this.b=o.b;this.f=o.f||null;this.fs=o.fs||1;this.lim=o.lim;this.gk=o.gk;this.c=o.c;this.fk=o.fk||0;this.fb=o.fb||.25;this.fm=o.fm==null?2.2:o.fm;
  const sp=o.sp[0]+(o.sp[1]-o.sp[0])*hh(seed,o.id);this.rest=new V(o.side*Math.sin(sp),-Math.cos(sp),o.fz?o.fz*Math.sin(sp*.6):0).normalize();   // reposo con un poco de abertura (cada cuerpo cae distinto)
  this.d=this.rest.clone();this.v=new V();this.flex=o.f?o.f0||.3:0;this.fv=0}
 /* g: gravedad en el marco del cuerpo; Qb: orientación del cuerpo (para el suelo); dt */
 step(dt,g,Qb,floor){const d=this.d,v=this.v;
  _a.copy(g).addScaledVector(d,-d.dot(g)).multiplyScalar(this.gk);v.addScaledVector(_a,dt);v.multiplyScalar(Math.exp(-this.c*dt));v.addScaledVector(d,-d.dot(v));
  d.addScaledVector(v,dt).normalize();
  // SUELO: ningún miembro apunta por debajo del suelo (en el mundo); si lo hace se sube al plano horizontal más cercano
  if(floor){_v.copy(d).applyQuaternion(Qb);if(_v.y<-.02){_v.y=-.02;_v.normalize();d.copy(_v).applyQuaternion(_q2.copy(Qb).invert());v.multiplyScalar(.35)}}
  // LÍMITE respecto al reposo
  const c=cl(d.dot(this.rest),-1,1),ang=Math.acos(c);if(ang>this.lim){_a.copy(d).addScaledVector(this.rest,-c);const l=_a.length();if(l>1e-5){_a.multiplyScalar(1/l);d.copy(this.rest).multiplyScalar(Math.cos(this.lim)).addScaledVector(_a,Math.sin(this.lim));v.multiplyScalar(.3)}}
  if(this.f){const up=-g.dot(d),t=this.fb+this.fk*Math.max(0,up)*1.6;this.fv+=(-34*(this.flex-t)-5.5*this.fv)*dt;this.flex=cl(this.flex+this.fv*dt,0,this.fm)}}
 kick(s,r){_a.set(r(),r(),r()).multiplyScalar(s);_a.addScaledVector(this.d,-this.d.dot(_a));this.v.add(_a)}
}
const HUM_L=[{id:1,b:'armR',f:'elbR',fs:-1,side:1,lim:2.7,gk:8,c:2.6,fk:.7,fb:.35,sp:[.25,.7],fz:0},{id:2,b:'armL',f:'elbL',fs:-1,side:-1,lim:2.7,gk:8,c:2.6,fk:.7,fb:.35,sp:[.25,.7]},
 {id:3,b:'legR',f:'kneeR',fs:1,side:1,lim:1.45,gk:9,c:3.8,fk:.9,fb:.25,fm:2.0,sp:[.1,.4]},{id:4,b:'legL',f:'kneeL',fs:1,side:-1,lim:1.45,gk:9,c:3.8,fk:.9,fb:.25,fm:2.0,sp:[.1,.4]}];
const QUAD_L=[['FL',1,1],['FR',2,-1],['BL',3,1],['BR',4,-1]].map(([n,id,s])=>({id,b:'leg'+n,f:'knee'+n,fs:1,side:s,lim:1.5,gk:8,c:3.6,fk:.6,fb:.3,fm:1.6,sp:[.05,.4],fz:0}));

export class Ragdoll{
 static ts=1;   /* escala de tiempo (solo PRUEBAS: 0 congela para capturar) */
 static last=null;   /* pruebas: último ragdoll creado */
 /* o: {kind:'hum'|'quad'|'tip', seed, fall:[x,z], power (0..1.5), hgt, rad, bones:{…}} */
 constructor(o){this.kind=o.kind;this.seed=o.seed||1;const r=()=>hh(this.seed,++this.n0)*2-1;this.n0=0;this.r=r;this.hgt=cl(o.hgt||1,.35,3.2);this.rad=cl(o.rad||.14,.06,.45);
  let fx=o.fall?o.fall[0]:0,fz=o.fall?o.fall[1]:-1;const fl=Math.hypot(fx,fz)||1;fx/=fl;fz/=fl;
  if(this.kind==='quad'){const s=(this.seed>3.1?-1:1);fx=s;fz=0}   // los cuadrúpedos caen de COSTADO
  this.f=new V(fx,0,fz);this.axis=new V(fz,0,-fx);   // eje de giro = arriba × dirección de caída
  const pw=cl(o.power==null?.8:o.power,.2,1.6);this.th=.05;this.w=(1.5+2.2*pw)/Math.sqrt(this.hgt);this.thMax=this.kind==='quad'?1.42:1.5+.05*r();this.L=.55*this.hgt;this.lying=false;this.t=0;this.hit=0;
  this.off=new V();this.vs=.7*pw*(this.kind==='quad'?.5:1);this.twist=0;this.tw=0;this.qb=new Q();this.lift=0;
  this.limbs=(this.kind==='hum'?HUM_L:this.kind==='quad'?QUAD_L:[]).map(l=>new Limb(l,this.seed));
  this.limbs.forEach(l=>l.kick(2.4*pw,r));
  this.head=new V(0,1,0);this.hv=new V();this.hlim=.85;this.tail=[0,0,0].map(()=>({a:0,w:r()*2*pw,b:0,wb:r()*1.5*pw}));this.ear=[0,0];Ragdoll.last=this;this.ew=[r()*3,r()*3];this.tw0=r()*.4}
 step(dt){dt=Math.min(.05,dt)*Ragdoll.ts;this.t+=dt;
  // ── cuerpo rígido: péndulo invertido que se tumba sobre su eje ──
  if(!this.lying){const acc=(9.8/this.L)*Math.sin(this.th)*(this.kind==='quad'?.5:1.1)+.9;this.w+=acc*dt;this.th+=this.w*dt;
   if(this.th>=this.thMax){this.th=this.thMax;const imp=this.w;if(imp>.9){this.w=-imp*.2;this.hit++;this.limbs.forEach(l=>l.kick(imp*.55,this.r));this.hv.add(_a.set(this.r(),this.r(),this.r()).multiplyScalar(imp*.2))}else{this.w=0;this.lying=true}}
   this.tw+=((this.tw0)-this.tw)*Math.min(1,dt*3)}
  this.qb.setFromAxisAngle(this.axis,this.th);if(this.tw)this.qb.multiply(_q.setFromAxisAngle(UP,this.tw*Math.min(1,this.th)));
  this.lift=this.rad*Math.sin(Math.min(1.6,this.th));
  // deslizamiento por el empujón (rozamiento) mientras cae y un poco después
  this.vs*=Math.exp(-(this.lying?5:1.4)*dt);this.off.addScaledVector(this.f,this.vs*dt*(this.kind==='quad'?.4:1));
  // ── miembros ──
  _g.copy(DOWN).applyQuaternion(_q.copy(this.qb).invert());
  const floor=this.th>.5;this.limbs.forEach(l=>l.step(dt,_g,this.qb,floor));
  // cabeza: sigue la gravedad con límite
  {const h=this.head,v=this.hv;_a.copy(_g).addScaledVector(h,-h.dot(_g)).multiplyScalar(this.kind==='quad'?3.5:5);v.addScaledVector(_a,dt);v.multiplyScalar(Math.exp(-4*dt));v.addScaledVector(h,-h.dot(v));h.addScaledVector(v,dt).normalize();
   const c=cl(h.dot(UP),-1,1),an=Math.acos(c);if(an>this.hlim){_a.copy(h).addScaledVector(UP,-c).normalize();h.copy(UP).multiplyScalar(Math.cos(this.hlim)).addScaledVector(_a,Math.sin(this.hlim));v.multiplyScalar(.3)}}
  // cola y orejas: osciladores con el impulso de la caída
  const kk=this.w*.15;this.tail.forEach((s,i)=>{s.w+=(-26*s.a-3.2*s.w)*dt;s.a+=s.w*dt;s.wb+=(-22*s.b-3*s.wb)*dt;s.b+=s.wb*dt;if(i===0&&!this.lying){s.w+=kk*dt*20}});
  this.ear[0]+=this.ew[0]*dt;this.ear[1]+=this.ew[1]*dt;this.ew[0]+=(-30*this.ear[0]-4*this.ew[0])*dt;this.ew[1]+=(-30*this.ear[1]-4*this.ew[1])*dt}
 /* escribe huesos de un Actor (actors3d.js) */
 apply(A){const b=A.b,rest=A.rest;if(!b||!b.root)return;
  b.root.quaternion.copy(this.qb);b.root.position.set(A.restP.root.x+this.off.x,A.restP.root.y+this.lift,A.restP.root.z+this.off.z);
  const set=(n,q)=>{const bn=b[n];if(bn&&rest[n])bn.quaternion.copy(rest[n]).multiply(q)};
  for(const l of this.limbs){set(l.b,_q.setFromUnitVectors(DOWN,l.d));   /* de «colgando» (reposo del hueso) a la dirección actual del miembro */
   if(l.f&&b[l.f]&&rest[l.f])b[l.f].quaternion.copy(rest[l.f]).multiply(_q.setFromEuler(new THREE.Euler(l.fs*l.flex,0,0)))}
  if(this.kind==='hum'){const h=this.head;_q.setFromUnitVectors(UP,h);if(b.neck&&rest.neck)b.neck.quaternion.copy(rest.neck).multiply(_q);if(b.head&&rest.head)b.head.quaternion.copy(rest.head)
   ;for(const n of['chest','ribs'])if(b[n]&&rest[n])b[n].quaternion.copy(rest[n]);if(b.pelvis&&rest.pelvis)b.pelvis.quaternion.copy(rest.pelvis)}
  else if(this.kind==='quad'){const h=this.head;_q.setFromUnitVectors(UP,h);if(b.neck&&rest.neck)b.neck.quaternion.copy(rest.neck).multiply(_q);if(b.head&&rest.head)b.head.quaternion.copy(rest.head);
   ;['body','hind'].forEach(n=>{if(b[n]&&rest[n])b[n].quaternion.copy(rest[n])});
   [['tail',0],['tailA',1],['tailB',2]].forEach(([n,i])=>{const s=this.tail[i];if(b[n]&&rest[n])b[n].quaternion.copy(rest[n]).multiply(_q.setFromEuler(new THREE.Euler(-s.a*.6,s.b*.6,0)))});
   if(b.earL&&rest.earL)b.earL.quaternion.copy(rest.earL).multiply(_q.setFromEuler(new THREE.Euler(.4+this.ear[0]*.3,0,.3)));if(b.earR&&rest.earR)b.earR.quaternion.copy(rest.earR).multiply(_q.setFromEuler(new THREE.Euler(.4+this.ear[1]*.3,0,-.3)));
   if(b.jaw&&rest.jaw)b.jaw.quaternion.copy(rest.jaw).multiply(_q.setFromEuler(new THREE.Euler(.25,0,0)))}}
}
