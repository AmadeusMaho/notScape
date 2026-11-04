// NotScape · R3D · N0.5 · PUENTE DE NUBES QUE SE ROMPE + BARCA DE VIENTO DE REMIEL (4 nov 2026; el dueño: «haz 0.5»; pendientes del plan acordado de la Isla del Cielo §6.3/§6.6).
// PUENTE: una pasarela de ~16 losas de nube sobre la calzada del tramo «La Palestra» (de `R3D.skyBridge.a` a `.b`, px de mundo). Cada losa se DESMORONA cuando el frente de fuego (`R3D.skyFront`, el mismo
// que dibuja skyfire3d.js) pasa por su posición proyectada sobre la pasarela: cae girando y encogiéndose en ~1,3 s. Si el tramo se reinicia (el frente vuelve atrás) las losas reaparecen. SIN daño ni colisión
// (regla del dueño: lo ambiental nunca castiga); es solo la lectura visual de «el suelo se acaba detrás de ti». 1 InstancedMesh = 1 llamada.
// BARCA DE VIENTO: al empezar el último tramo `R3D.skyBoat={x,y,ang}` (px; el borde este, junto a Remiel) llega volando desde mar adentro en ~5 s y se queda mecida: casco de madera clara con
// contorno marrón, mástil, vela que se hincha (malla 7×5 animada por CPU, 70 vértices) y 2 aros de viento que giran bajo la quilla. ≈ 5 llamadas, ≈ 2 k triángulos; visible SOLO durante «Escapa».
// Contrato: new SkyBridge(scene,W3) · update(t,dt,bridge,boat,front) en cada fotograma (r3d.js burnFx). `W3(wx,wy,z)` = px de mundo → 3D (unidades = tiles).
import * as THREE from 'three';
import {toon,hull,inkFor} from './materials3d.js';

const N=16,hh=(a,b)=>{const s=Math.sin(a*127.1+b*311.7)*43758.5453;return s-Math.floor(s)};
const ease=u=>1-Math.pow(1-Math.min(1,Math.max(0,u)),3);

export class SkyBridge{
 constructor(scene,W3){this.scene=scene;this.W3=W3;this.t=0;this.bt=null;this.ft=new Float32Array(N);
  /* losas: caja achatada de cantos suaves (un icosaedro aplastado se lee como «piedra de nube») */
  const g=new THREE.IcosahedronGeometry(.5,1);g.scale(1.1,.26,.78);
  this.mesh=new THREE.InstancedMesh(g,new THREE.MeshLambertMaterial({color:'#f6edd6',emissive:'#7a6a44',flatShading:true}),N);this.mesh.visible=false;scene.add(this.mesh);
  const col=new THREE.Color();for(let i=0;i<N;i++){col.set(i%2?'#f2e9d4':'#e2d6b8').offsetHSL(0,0,(hh(i,2)-.5)*.05);this.mesh.setColorAt(i,col)}
  this.boat=null;this.M=new THREE.Matrix4();this.q=new THREE.Quaternion();this.p=new THREE.Vector3();this.s=new THREE.Vector3();this.e=new THREE.Euler()}
 buildBoat(){const B=new THREE.Group(),PI=Math.PI;
  /* casco: media elipse alargada con proa y popa levantadas (esfera aplastada + remate) */
  const hg=new THREE.SphereGeometry(1,16,10,0,PI*2,PI*.5,PI*.5);hg.scale(.62,.42,1.5);{const p=hg.attributes.position;for(let i=0;i<p.count;i++){const z=p.getZ(i);p.setY(i,p.getY(i)+Math.pow(Math.abs(z)/1.5,2.2)*.34)}hg.computeVertexNormals()}
  const hm=new THREE.Mesh(hg,toon('#d9c6a0',{}));hm.add(hull(hg,.02,inkFor('#6a4a30')));B.add(hm);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(1,.035,6,28),toon('#b8902c',{}));rim.scale.set(.62,1.5,1);rim.rotation.x=PI/2;rim.position.y=.28;B.add(rim);   /* borde dorado */
  const mast=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,2.1,8),toon('#7a5a38',{}));mast.position.set(0,1.15,.1);mast.add(hull(mast.geometry,.015,inkFor('#3a2a22')));B.add(mast);
  const bow=new THREE.Mesh(new THREE.ConeGeometry(.12,.5,6),toon('#e8cf94',{}));bow.rotation.x=PI/2;bow.position.set(0,.55,1.62);B.add(bow);   /* mascarón dorado */
  /* vela: rejilla 7×5 que se hincha con el viento */
  const sg=new THREE.PlaneGeometry(1.25,1.6,6,4);this.sg=sg;this.sg0=sg.attributes.position.array.slice();
  const sm=new THREE.Mesh(sg,new THREE.MeshLambertMaterial({color:'#f4efe0',side:THREE.DoubleSide,flatShading:true}));sm.position.set(0,1.3,.12);sm.rotation.y=PI/2;B.add(sm);this.sail=sm;
  const bar=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.4,6),toon('#7a5a38',{}));bar.rotation.x=PI/2;bar.position.set(0,2.05,.12);B.add(bar);   /* verga */
  /* 2 aros de viento bajo la quilla */
  this.rings=[0,1].map(i=>{const r=new THREE.Mesh(new THREE.TorusGeometry(.9+i*.35,.025,5,24),new THREE.MeshBasicMaterial({color:'#dff2ff',transparent:true,opacity:.5,depthWrite:false}));r.rotation.x=PI/2;r.position.y=-.35-i*.18;B.add(r);return r});
  B.visible=false;this.scene.add(B);this.boat=B}
 /* bridge={a:{x,y},b:{x,y}} px o null · boat={x,y,ang} px o null · front={x,y,dx,dy} px o null */
 update(t,dt,bridge,boat,front){this.t+=dt;const T=ISO.TILE;
  /* ── puente ── */
  const on=!!bridge;this.mesh.visible=on;
  if(on){const ax=bridge.a.x,ay=bridge.a.y,dx=bridge.b.x-ax,dy=bridge.b.y-ay,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L;
   let uf=-9;if(front){uf=((front.x-ax)*ux+(front.y-ay)*uy)/L}   /* progreso del frente a lo largo de la pasarela (0..1; <0 aún no llega, >1 ya pasó) */
   if(!this.bs){this.bs=new THREE.Sphere(new THREE.Vector3((ax+dx/2)/T,0,(ay+dy/2)/T),L/T*.5+30);this.mesh.boundingSphere=this.bs}   /* esfera fija: sin desactivar el recorte de vista (trinquete) y las losas que caen siguen contando */
   const yaw=Math.atan2(dx,dy)-Math.PI/2;this.e.set(0,yaw,0);
   for(let i=0;i<N;i++){const u=(i+.5)/N,gone=front&&uf>u;
    if(gone)this.ft[i]+=dt;else this.ft[i]=0;
    const f=this.ft[i],wx=ax+dx*u+(hh(i,5)-.5)*8,wy=ay+dy*u+(hh(i,6)-.5)*8;let gy=0;try{gy=this.W3(0,0,TER.standZ(wx,wy)).y}catch(er){}
    const fall=.5*14*f*f,sc=f>0?Math.max(0,1-f/1.3):1,spin=f*(2+hh(i,7)*3);
    this.p.set(wx/T,gy+.16-fall,wy/T);this.e.set(spin*.4,yaw+spin*.3,spin*.5);this.q.setFromEuler(this.e);const w=1.5*(.9+hh(i,8)*.25);this.s.set(w*sc,sc,1.5*sc);
    this.M.compose(this.p,this.q,this.s);this.mesh.setMatrixAt(i,this.M)}
   this.mesh.instanceMatrix.needsUpdate=true}
  /* ── barca ── */
  if(boat&&!this.boat)this.buildBoat();
  if(this.boat){const B=this.boat;B.visible=!!boat;
   if(boat){if(this.bt==null)this.bt=0;this.bt+=dt;const k=ease(this.bt/5),far=26*(1-k);   /* llega desde mar adentro: 26 tiles más lejos */
    const ang=boat.ang||0,bx=boat.x/T+Math.cos(ang)*far,bz=boat.y/T+Math.sin(ang)*far;let gy=0;try{gy=Math.max(0,this.W3(0,0,TER.standZ(boat.x,boat.y)).y)}catch(er){}
    const bob=Math.sin(this.t*1.7)*.12,arr=1-k;
    B.position.set(bx,gy+1.2+bob+arr*2.4,bz);B.rotation.set(Math.sin(this.t*1.3)*.05+arr*.12,Math.atan2(-Math.cos(ang),-Math.sin(ang)),Math.sin(this.t*1.1)*.06);   /* proa (+z) mirando a tierra */
    const p=this.sg.attributes.position,o=this.sg0;for(let i=0;i<p.count;i++){const x=o[i*3],y=o[i*3+1],edge=1-Math.abs(x)/.625,bil=Math.sin(this.t*2+y*2.1+x*1.5)*.04;p.setZ(i,(.22*edge*(.6+.4*(y+.8)/1.6)+bil)*(.7+.3*Math.sin(this.t*.9)))}p.needsUpdate=true;this.sg.computeVertexNormals();
    this.rings.forEach((r,i)=>{r.rotation.z=this.t*(2.4-i*1.1);const s=1+.08*Math.sin(this.t*3+i);r.scale.set(s,s,1);r.material.opacity=.38+.16*Math.sin(this.t*2.4+i)})}
   else this.bt=null}}
 dispose(){this.scene.remove(this.mesh);this.mesh.geometry.dispose();this.mesh.material.dispose();if(this.boat)this.scene.remove(this.boat)}
}
