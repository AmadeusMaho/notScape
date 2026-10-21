// EFECTOS DE CINEMÁTICA (Lote CINE-3, 21 oct 2026): FRAGMENTO DEL TIEMPO, ESCOMBROS y LLUVIA DE BRASAS. Se crean con `R3D.fragment()`, `R3D.debris()` y `R3D.embers()` (r3d.js) y los mueve
// la escena de CINE (`sc.update`), con el dt ya descontado del «tiempo detenido». Todo determinista (hash, nunca Math.random); coordenadas = unidades three (x = px/32, y = altura, z = py/32).
// Sin PointLight nuevas (añadir luces en caliente recompila todos los materiales): el brillo es emisivo + halo aditivo (el bloom hace el resto).
import * as THREE from 'three';
import {hash,glow,toon} from './materials3d.js';

let DOT=null;const dot=()=>{if(DOT)return DOT;const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d'),g=x.createRadialGradient(16,16,0,16,16,16);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.4,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,32,32);DOT=new THREE.CanvasTexture(c);return DOT};
const cl=(v,a,b)=>v<a?a:v>b?b:v;
// cámara ORTOGRÁFICA: `sizeAttenuation` de three no escala los puntos, así que el tamaño se da en píxeles de pantalla = tamaño en unidades de mundo × px por unidad (ISO.scale()·36)
export const ppx=w=>Math.max(2,w*36*ISO.scale());

// ───────── FRAGMENTO DEL TIEMPO ─────────
// Cristal alargado (octaedro estirado) de oro pálido con corazón ámbar, 5 esquirlas en órbita lenta, halo aditivo y estela de chispas. Late ≈1 Hz (`beat`), se detiene con el tiempo.
export class Fragment{
 constructor(scene){this.scene=scene;this.g=new THREE.Group();this.g.visible=false;scene.add(this.g);
  const out=new THREE.Mesh(new THREE.OctahedronGeometry(.1,0).scale(.62,1.55,.62),new THREE.MeshBasicMaterial({color:new THREE.Color('#f6e2a6').multiplyScalar(1.5)}));
  const core=new THREE.Mesh(new THREE.OctahedronGeometry(.062,0).scale(.62,1.5,.62),new THREE.MeshBasicMaterial({color:new THREE.Color('#ff9a30').multiplyScalar(2.2)}));
  const ink=new THREE.Mesh(new THREE.OctahedronGeometry(.1,0).scale(.62,1.55,.62),new THREE.MeshBasicMaterial({color:0x4a3418,side:THREE.BackSide}));ink.scale.setScalar(1.12);   // contorno ámbar oscuro (la silueta se lee sobre fondo claro)
  this.crystal=new THREE.Group();this.crystal.add(ink,out,core);this.g.add(this.crystal);
  this.sh=[];for(let i=0;i<5;i++){const m=new THREE.Mesh(new THREE.TetrahedronGeometry(.028,0),new THREE.MeshBasicMaterial({color:new THREE.Color('#ffe9b0').multiplyScalar(1.6)}));this.g.add(m);this.sh.push(m)}
  this.halo=new THREE.Sprite(new THREE.SpriteMaterial({map:dot(),color:new THREE.Color('#ffc864'),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.9}));this.halo.scale.setScalar(.9);this.g.add(this.halo);
  const N=70;this.N=N;this.tp=new Float32Array(N*3).fill(-999);this.tc=new Float32Array(N*3);this.tl=new Float32Array(N);this.tn=0;const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(this.tp,3));pg.setAttribute('color',new THREE.BufferAttribute(this.tc,3));
  this.trail=new THREE.Points(pg,new THREE.PointsMaterial({size:6,sizeAttenuation:false,map:dot(),vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));this.trail.frustumCulled=false;scene.add(this.trail);
  this.beat=true;this.k=1;this.alpha=1;this.sx=0;this.pos=new THREE.Vector3();this.last=new THREE.Vector3();this.emit=true;this.sn=0}
 // posición en unidades three; `scale` multiplica el tamaño (para «hundirse» en la palma)
 set(p,scale){this.pos.copy(p);this.g.position.copy(p);this.k=scale==null?1:scale;this.g.visible=this.k>.01&&this.alpha>.01}
 update(t,dt){if(!this.g.visible&&this.k<=.01)return;const b=this.beat?Math.pow(Math.max(0,Math.sin(t*6.2832)),3):0,pu=1+.16*b;
  this.crystal.scale.setScalar(this.k*pu);this.crystal.rotation.y=t*.9;this.crystal.position.y=Math.sin(t*1.7)*.012;
  this.halo.scale.setScalar((.8+.45*b)*this.k*(.9+.1*Math.sin(t*3)));this.halo.material.opacity=(.55+.4*b)*this.alpha;
  this.sh.forEach((m,i)=>{const a=t*(.8+.15*i)+i*1.256,r=.17*this.k;m.position.set(Math.cos(a)*r,Math.sin(a*1.3+i)*.07*this.k,Math.sin(a)*r);m.rotation.set(t+i,t*.7,i);m.scale.setScalar(this.k)});
  // estela: chispas que se quedan atrás cuando se mueve
  const mv=this.pos.distanceTo(this.last);this.last.copy(this.pos);if(this.emit&&mv>1e-4&&dt>1e-4&&this.k>.1){this.sx+=mv*70;const n=this.sx|0;this.sx-=n;for(let j=0;j<Math.min(4,n);j++){const i=this.tn++%this.N,s=this.sn++;this.tp[i*3]=this.pos.x+(hash(s,1,2)-.5)*.07;this.tp[i*3+1]=this.pos.y+(hash(s,2,3)-.5)*.07;this.tp[i*3+2]=this.pos.z+(hash(s,3,4)-.5)*.07;this.tl[i]=.9+hash(s,4,5)*.6}}
  for(let i=0;i<this.N;i++){if(this.tl[i]<=0)continue;this.tl[i]-=dt;const L=cl(this.tl[i]/1.2,0,1);if(this.tl[i]<=0){this.tp[i*3+1]=-999;this.tc[i*3]=this.tc[i*3+1]=this.tc[i*3+2]=0;continue}this.tp[i*3+1]+=.05*dt;this.tc[i*3]=L;this.tc[i*3+1]=.78*L;this.tc[i*3+2]=.36*L}
  this.trail.material.size=ppx(.06);this.trail.geometry.attributes.position.needsUpdate=true;this.trail.geometry.attributes.color.needsUpdate=true}
 dispose(){this.scene.remove(this.g,this.trail);this.g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose()});this.trail.geometry.dispose();this.trail.material.dispose()}
}

// ───────── ESCOMBROS ─────────
// InstancedMesh de rocas facetadas (toon, plano) lanzadas hacia arriba y que caen con giro: `burst(cx,cz,gy,n,R)` las lanza desde un anillo; las que caen por debajo de `gy−6` se ocultan.
export class Debris{
 constructor(scene,N=90){this.scene=scene;this.N=N;this.m=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.2,0).scale(1,.75,.9),toon('#837b6f',{flat:1}),N);this.m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.m.frustumCulled=false;
  this.ink=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.2,0).scale(1,.75,.9),new THREE.MeshBasicMaterial({color:0x2a1c1a,side:THREE.BackSide}),N);this.ink.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.ink.frustumCulled=false;
  scene.add(this.m,this.ink);this.p=new Float32Array(N*3),this.v=new Float32Array(N*3),this.r=new Float32Array(N*3),this.w=new Float32Array(N*3),this.s=new Float32Array(N),this.on=new Uint8Array(N);this.gy=0;this.n=0;this.sn=0;this.o=new THREE.Object3D();
  for(let i=0;i<N;i++){this.o.scale.setScalar(0);this.o.updateMatrix();this.m.setMatrixAt(i,this.o.matrix);this.ink.setMatrixAt(i,this.o.matrix)}}
 burst(cx,cz,gy,n=24,R=2.5,up=5){this.gy=gy;for(let k=0;k<n;k++){const i=this.n++%this.N,s=this.sn++,a=hash(s,1,2)*6.283,r=R*(.2+.8*hash(s,2,3));
   this.p[i*3]=cx+Math.cos(a)*r;this.p[i*3+1]=gy+.05;this.p[i*3+2]=cz+Math.sin(a)*r;this.v[i*3]=Math.cos(a)*(.4+hash(s,3,4)*1.4);this.v[i*3+1]=up*(.5+hash(s,4,5)*.8);this.v[i*3+2]=Math.sin(a)*(.4+hash(s,5,6)*1.4);
   this.r[i*3]=hash(s,6,7)*6;this.r[i*3+1]=hash(s,7,8)*6;this.r[i*3+2]=hash(s,8,9)*6;this.w[i*3]=(hash(s,9,1)-.5)*5;this.w[i*3+1]=(hash(s,1,3)-.5)*5;this.w[i*3+2]=(hash(s,2,4)-.5)*5;this.s[i]=.35+hash(s,3,5)*.8;this.on[i]=1}}
 update(t,dt){const o=this.o;for(let i=0;i<this.N;i++){if(!this.on[i])continue;this.v[i*3+1]-=9*dt;for(let a=0;a<3;a++){this.p[i*3+a]+=this.v[i*3+a]*dt;this.r[i*3+a]+=this.w[i*3+a]*dt}
   if(this.p[i*3+1]<this.gy-6){this.on[i]=0;o.scale.setScalar(0)}else o.scale.setScalar(this.s[i]);o.position.set(this.p[i*3],this.p[i*3+1],this.p[i*3+2]);o.rotation.set(this.r[i*3],this.r[i*3+1],this.r[i*3+2]);o.updateMatrix();this.m.setMatrixAt(i,o.matrix);o.scale.multiplyScalar(1.1);o.updateMatrix();this.ink.setMatrixAt(i,o.matrix)}
  this.m.instanceMatrix.needsUpdate=true;this.ink.instanceMatrix.needsUpdate=true}
 dispose(){this.scene.remove(this.m,this.ink);this.m.geometry.dispose();this.m.material.dispose();this.ink.geometry.dispose();this.ink.material.dispose()}
}

// ───────── LLUVIA DE BRASAS Y CENIZA ─────────
// 280 puntos aditivos naranja/ceniza que caen con vaivén en una caja alrededor del centro; `level` 0..1 reparte cuántos se ven y cuánto brillan (se enciende con el cielo).
export class Embers{
 constructor(scene,N=280){this.scene=scene;this.N=N;this.p=new Float32Array(N*3),this.c=new Float32Array(N*3);this.level=0;this.cx=0;this.cz=0;this.gy=0;this.box=9;this.h=9;
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(this.p,3));g.setAttribute('color',new THREE.BufferAttribute(this.c,3));
  this.pts=new THREE.Points(g,new THREE.PointsMaterial({size:6,sizeAttenuation:false,map:dot(),vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));this.pts.frustumCulled=false;this.pts.visible=false;scene.add(this.pts);
  for(let i=0;i<N;i++){this.p[i*3]=(hash(i,1,2)-.5)*2*this.box;this.p[i*3+1]=hash(i,2,3)*this.h;this.p[i*3+2]=(hash(i,3,4)-.5)*2*this.box}}
 at(cx,cz,gy){this.cx=cx;this.cz=cz;this.gy=gy}
 update(t,dt){this.pts.visible=this.level>.01;if(!this.pts.visible)return;
  for(let i=0;i<this.N;i++){const on=hash(i,4,5)<this.level*1.05,sp=.35+hash(i,5,6)*.8;let y=this.p[i*3+1]-sp*dt;if(y<0)y+=this.h;this.p[i*3+1]=y;let x=this.p[i*3]+Math.sin(t*.8+i)*.18*dt+.12*dt;if(x>this.box)x-=2*this.box;this.p[i*3]=x;this.p[i*3+2]+=Math.cos(t*.7+i*1.3)*.18*dt;
   const f=on?1:0,ash=hash(i,6,7)<.45,e=.55+.45*Math.sin(t*3+i);                                   // 45 % ceniza gris, el resto brasas naranja que titilan
   this.c[i*3]=(ash?.55:1)*f*e;this.c[i*3+1]=(ash?.5:.42)*f*e;this.c[i*3+2]=(ash?.46:.16)*f*e}
  this.pts.material.size=ppx(.1);const g=this.pts.geometry,pa=g.attributes.position;this.pts.position.set(this.cx,this.gy,this.cz);pa.needsUpdate=true;g.attributes.color.needsUpdate=true}
 dispose(){this.scene.remove(this.pts);this.pts.geometry.dispose();this.pts.material.dispose()}
}
