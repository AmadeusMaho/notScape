// NotScape · R3D · EFECTOS DE HECHIZO (21 oct 2026) · BOLA DE FUEGO: orbe con núcleo caliente y halo aditivo, estela de brasas, orbe de CARGA en la mano e impacto (estallido + anillo). `R3D.spell`.
// ESTILO: el del juego («óleo oscuro»): fuego ámbar-anaranjado, con el amarillo-crema solo en el corazón y rojo ceniza en las puntas de la estela; sin colores puros ni degradados de neón. Todo con `MeshBasicMaterial` + sprites/puntos ADITIVOS (el bloom del pase de grado
// hace el brillo); NINGUNA PointLight (añadir luces en caliente recompila todos los materiales) y nada de `Math.random` (hash determinista por contador). Coordenadas del juego en px de mundo → `W3(x,y,z)` (unidades three).
// API: `fireball(x0,y0,x1,y1,ms,k)` (k = carga 0..1: más grande, más brasas), `charge(x,y,k)` (orbe en la mano mientras se carga; k<0 lo apaga), `ember(x,y,h)` (llama pequeña sobre un enemigo en llamas), `update(t,dt)`.
import * as THREE from 'three';
import {hash} from './materials3d.js';
import {ppx} from './cinefx3d.js';

const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,238,200,1)');r.addColorStop(.22,'rgba(255,170,70,.8)');r.addColorStop(.55,'rgba(205,70,22,.32)');r.addColorStop(1,'rgba(90,18,4,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
const dotTex=(()=>{const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d'),r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.5,'rgba(255,255,255,.45)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,32,32);return new THREE.CanvasTexture(c)})();
const HOT=new THREE.Color('#ffd89a'),MID=new THREE.Color('#ff8a2a'),COOL=new THREE.Color('#b8321a'),ASH=new THREE.Color('#3a1208');
const NP=520,TL=.034;   // partículas máximas · px de mundo → unidades (1/32)

export class SpellFX{
 constructor(scene,W3){this.scene=scene;this.W3=W3;this.n=0;this.balls=[];this.rings=[];this.t=0;
  this.p=new Float32Array(NP*3);this.c=new Float32Array(NP*3);this.v=new Float32Array(NP*3);this.l=new Float32Array(NP);this.l0=new Float32Array(NP);this.k=0;
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(this.p,3));g.setAttribute('color',new THREE.BufferAttribute(this.c,3));
  this.pts=new THREE.Points(g,new THREE.PointsMaterial({size:6,sizeAttenuation:false,map:dotTex,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));this.pts.frustumCulled=false;this.pts.renderOrder=6;scene.add(this.pts);
  // orbe de carga (en la mano del héroe)
  this.orb=this.makeBall(.6);this.orb.group.visible=false;scene.add(this.orb.group);this.orbOn=0}
 makeBall(s){const group=new THREE.Group(),core=new THREE.Mesh(new THREE.IcosahedronGeometry(.1,1),new THREE.MeshBasicMaterial({color:'#ffe2a8',toneMapped:false})),
   mid=new THREE.Mesh(new THREE.IcosahedronGeometry(.17,1),new THREE.MeshBasicMaterial({color:'#ff8426',transparent:true,opacity:.78,depthWrite:false,toneMapped:false})),
   halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:'#ffb060',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.9}));halo.scale.setScalar(1.1);
  group.add(core,mid,halo);group.scale.setScalar(s);return{group,core,mid,halo,s}}
 emit(x,y,z,vx,vy,vz,life){const i=this.n++%NP;this.p[i*3]=x;this.p[i*3+1]=y;this.p[i*3+2]=z;this.v[i*3]=vx;this.v[i*3+1]=vy;this.v[i*3+2]=vz;this.l[i]=this.l0[i]=life}
 h(a,b){return hash(this.k++,a,b)}
 // bola de fuego: de la mano (x0,y0) al punto (x1,y1) en `ms` ms; k = carga (0..1)
 fireball(x0,y0,x1,y1,ms,k=0){const a=this.W3(x0,y0,TER.standZ(x0,y0)),b=this.W3(x1,y1,TER.standZ(x1,y1)),s=.7+.55*k,ball=this.makeBall(s);ball.group.position.copy(a);this.scene.add(ball.group);
  this.balls.push({a,b,t0:this.t,dur:Math.max(.08,ms/1000),k,ball,s});this.burst(a.x,a.y+.8,a.z,6+Math.round(k*8),.8)}   // pequeño estallido al salir
 charge(x,y,k){if(k<0){this.orbOn=0;return}this.orbOn=1;this.ox=x;this.oy=y;this.ok=k}
 ember(x,y,hh=.5){const p=this.W3(x,y,TER.standZ(x,y));this.emit(p.x+(this.h(1,2)-.5)*.3,p.y+hh*.6,p.z+(this.h(2,3)-.5)*.3,(this.h(3,4)-.5)*.2,.5+this.h(4,5)*.5,(this.h(5,6)-.5)*.2,.5+this.h(6,7)*.4)}
 burst(x,y,z,n,sp=1){for(let j=0;j<n;j++){const a=this.h(j,1)*6.283,e=.3+this.h(j,2)*1.1,r=(.8+this.h(j,3)*1.6)*sp;this.emit(x,y,z,Math.cos(a)*r*e,.6+this.h(j,4)*1.8*sp,Math.sin(a)*r*e,.35+this.h(j,5)*.5)}}
 impact(p,k){this.burst(p.x,p.y+.5,p.z,26+Math.round(k*22),1+k*.6);const r=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:'#ff9a46',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.9}));r.position.set(p.x,p.y+.5,p.z);this.scene.add(r);this.rings.push({r,t0:this.t,s0:.9+k*.7})}
 update(t,dt){this.t=t;const H=this.W3;
  // bolas en vuelo
  for(let i=this.balls.length-1;i>=0;i--){const q=this.balls[i],u=Math.min(1,(t-q.t0)/q.dur),g=q.ball.group;g.position.lerpVectors(q.a,q.b,u);g.position.y+=.82-.12*u+Math.sin(u*Math.PI)*.22;
   const pul=1+.1*Math.sin(t*30+i);g.scale.setScalar(q.s*pul);g.rotation.y+=dt*6;q.ball.mid.scale.setScalar(1+.12*Math.sin(t*22));
   for(let j=0;j<2;j++)this.emit(g.position.x+(this.h(j,1)-.5)*.12,g.position.y+(this.h(j,2)-.5)*.12,g.position.z+(this.h(j,3)-.5)*.12,(this.h(j,4)-.5)*.35,.15+this.h(j,5)*.4,(this.h(j,6)-.5)*.35,.28+this.h(j,7)*.3+q.k*.2);
   if(u>=1){this.impact(g.position,q.k);this.scene.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose()});this.balls.splice(i,1)}}
  // anillos de impacto
  for(let i=this.rings.length-1;i>=0;i--){const q=this.rings[i],u=(t-q.t0)/.34;if(u>=1){this.scene.remove(q.r);q.r.material.dispose();this.rings.splice(i,1);continue}q.r.scale.setScalar(q.s0*(1+u*2.4));q.r.material.opacity=.9*(1-u)*(1-u)}
  // orbe de carga
  const O=this.orb,on=this.orbOn&&this.ox!=null;O.group.visible=!!on;if(on){const p=this.W3(this.ox,this.oy,TER.standZ(this.ox,this.oy));O.group.position.set(p.x,p.y+.95,p.z);const k=this.ok,pul=1+.12*Math.sin(t*26);O.group.scale.setScalar((.28+.75*k)*pul);O.group.rotation.y+=dt*5;
   if(this.h(1,9)<.45+k*.5)this.emit(p.x+(this.h(2,1)-.5)*.3,p.y+.95+(this.h(2,2)-.5)*.3,p.z+(this.h(2,3)-.5)*.3,(this.h(2,4)-.5)*.3,.3+this.h(2,5)*.5,(this.h(2,6)-.5)*.3,.3+this.h(2,7)*.3)}
  // partículas (brasas): suben, se enfrían de crema a naranja, rojo y ceniza
  let alive=0;for(let i=0;i<NP;i++){let l=this.l[i];if(l<=0){this.c[i*3]=this.c[i*3+1]=this.c[i*3+2]=0;continue}l-=dt;this.l[i]=l;alive++;const f=Math.max(0,l)/this.l0[i];
   this.p[i*3]+=this.v[i*3]*dt;this.p[i*3+1]+=this.v[i*3+1]*dt;this.p[i*3+2]+=this.v[i*3+2]*dt;this.v[i*3+1]-=.9*dt;this.v[i*3]*=1-dt*1.2;this.v[i*3+2]*=1-dt*1.2;
   const c=f>.66?HOT.clone().lerp(MID,(1-f)/.34):f>.33?MID.clone().lerp(COOL,(.66-f)/.33):COOL.clone().lerp(ASH,(.33-f)/.33),a=Math.min(1,f*1.6);this.c[i*3]=c.r*a;this.c[i*3+1]=c.g*a;this.c[i*3+2]=c.b*a}
  this.pts.visible=alive>0;if(alive>0){this.pts.material.size=ppx(.11);this.pts.geometry.attributes.position.needsUpdate=true;this.pts.geometry.attributes.color.needsUpdate=true}}
}
