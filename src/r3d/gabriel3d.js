// GABRIEL 3D (Lote CINE-2, 21 oct 2026): el ángel caído de la cinemática «La caída de Gabriel» y futuro jefe del tutorial (docs/GUION_TUTORIAL.md).
// Modelo = plantilla `NPC_DEF.gabriel` de actors3d.js (humanoide horneado con ALAS rotas). Este módulo añade lo que NO se hornea:
//   · HALO agrietado (malla emisiva colgada del hueso de la cabeza: se atenúa, se agrieta y se apaga),
//   · POSES de cinemática (arrodillado, cabeza que se alza, susurro) encima de `ANIM.human`, con amortiguación,
//   · DISOLUCIÓN (material clon del toon con descarte por ruido + barrido de arriba abajo y borde dorado incandescente) + polvo dorado y plumas que caen.
// Uso: `R3D.gabriel(x,y)` (px de mundo) → {g.to(pose), g.setHalo(nivel,grieta), g.setDissolve(0..1), g.update(t,dt), g.face(rad), g.dispose()}. Todo determinista (hash, sin Math.random).
import * as THREE from 'three';
import {makeActor,ANIM} from './actors3d.js';
import {hash} from './materials3d.js';
import {ppx} from './cinefx3d.js';

const GOLD='#e8cf94',cl=(v,a,b)=>v<a?a:v>b?b:v;
let DOT=null;const dot=()=>{if(DOT)return DOT;const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d'),g=x.createRadialGradient(16,16,0,16,16,16);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.4,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,32,32);DOT=new THREE.CanvasTexture(c);return DOT};

// material de disolución: clon del toon con el MISMO onBeforeCompile (toon3d: vWP = posición de mundo) + descarte por ruido/altura + borde dorado
function disMat(base,U){const d=base.clone();d.defines=Object.assign({},base.defines);
 d.onBeforeCompile=(s,r)=>{base.onBeforeCompile(s,r);Object.assign(s.uniforms,U);
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform float uDis,uDB,uDH;float dh3(vec3 p){return fract(sin(dot(floor(p),vec3(12.9898,78.233,37.719)))*43758.5453);}')
   .replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\n float dk=dh3(vWP*16.)*.58+(1.-clamp((vWP.y-uDB)/uDH,0.,1.))*.42;\n if(dk<uDis)discard;')
   .replace('#include <dithering_fragment>','float ed=smoothstep(uDis+.09,uDis,dk)*step(.0005,uDis);gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(1.,.72,.25)*2.2,ed);\n#include <dithering_fragment>')};
 const k=base.customProgramCacheKey?base.customProgramCacheKey():'';d.customProgramCacheKey=()=>'dis'+k;return d}

export class Gabriel{
 constructor(scene,W3,x,y,z){this.scene=scene;this.A=makeActor('gabriel',W3);if(!this.A)throw new Error('plantilla gabriel no disponible');
  const A=this.A,tpl=A.tpl;this.grp=A.grp;this.base=W3(x,y,z);this.grp.position.copy(this.base);scene.add(this.grp);
  this.H=tpl.h*1.2;this.U={uDis:{value:0},uDB:{value:this.base.y-.02},uDH:{value:this.H}};
  this.mats=[...A.mesh.material].map(m=>disMat(m,this.U));this.mat0=A.mesh.material;
  // halo: anillo emisivo con un hueco (grieta) colgado del hueso de la cabeza, detrás de la nuca
  this.haloM=new THREE.MeshBasicMaterial({color:GOLD});this.halo=new THREE.Mesh(new THREE.TorusGeometry(.27,.014,8,48,5.6),this.haloM);this.halo.position.set(0,.1,-.2);this.halo.rotation.set(-.15,0,.5);A.b.head.add(this.halo);
  this.level=1;this.crack=0;this._crackBuilt=-1;this.setHalo(1,0);
  // pose objetivo/actual (valores amortiguados)
  this.T={kneel:0,head:0,chest:0,armR:0,armL:0,look:0};this.C=Object.assign({},this.T);this.rate=3;
  // polvo dorado (Points aditivo) y plumas que caen
  const N=240;this.N=N;this.dp=new Float32Array(N*3).fill(-999);this.dc=new Float32Array(N*3);this.dv=new Float32Array(N*3);this.dl=new Float32Array(N);this.dm=new Float32Array(N);this.dn=0;
  const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(this.dp,3));pg.setAttribute('color',new THREE.BufferAttribute(this.dc,3));
  this.pts=new THREE.Points(pg,new THREE.PointsMaterial({size:7,map:dot(),vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:false}));this.pts.frustumCulled=false;scene.add(this.pts);
  const FM=new THREE.MeshBasicMaterial({color:'#f2ead2',side:THREE.DoubleSide}),FG=new THREE.PlaneGeometry(.055,.24);this.fe=[];
  for(let i=0;i<16;i++){const m=new THREE.Mesh(FG,FM);m.visible=false;scene.add(m);this.fe.push({m,l:0,v:new THREE.Vector3(),s:i*1.37})}
  // columna de LUZ (intro del jefe): cilindro abierto aditivo, brillante abajo y desvanecido arriba; `lift` = altura sobre el suelo (descenso)
  const bg=new THREE.CylinderGeometry(.55,1.05,18,28,6,true),bp=bg.attributes.position,bc=new Float32Array(bp.count*3);
  for(let i=0;i<bp.count;i++){const u=1-(bp.getY(i)+9)/18,f=Math.pow(1-u,1.6);bc[i*3]=1*f;bc[i*3+1]=.82*f;bc[i*3+2]=.45*f}
  bg.setAttribute('color',new THREE.BufferAttribute(bc,3));this.beamM=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
  this.beam=new THREE.Mesh(bg,this.beamM);this.beam.position.set(this.base.x,this.base.y+9,this.base.z);this.beam.visible=false;this.beam.frustumCulled=false;scene.add(this.beam);this.lift=0;
  this.acc=0;this.sn=0;this.face(0)}
 setBeam(op,rad){this.beam.visible=op>.01;this.beamM.opacity=op;this.beam.scale.set(rad,1,rad)}
 face(r){this.grp.rotation.y=r}
 faceTo(wx,wz){this.face(Math.atan2(wx-this.base.x,wz-this.base.z))}   // (coordenadas three)
 to(p,rate){Object.assign(this.T,p);if(rate)this.rate=rate}
 setHalo(level,crack){this.level=level;this.halo.visible=level>.01;this.haloM.color.set(GOLD).multiplyScalar(1.7*level);
  if(crack!=null&&Math.abs(crack-this._crackBuilt)>.04){this._crackBuilt=crack;this.crack=crack;this.halo.geometry.dispose();this.halo.geometry=new THREE.TorusGeometry(.27,.014*(1-.3*crack),8,48,5.6-1.9*crack)}}
 setDissolve(u){this.U.uDis.value=u;const on=u>.0005;this.A.mesh.material=on?this.mats:this.mat0;this.A.hull.visible=u<.12;this.dis=u}
 // chispas de polvo: n partículas ahora, repartidas por el cuerpo (y alas)
 _spawn(n){for(let k=0;k<n;k++){const i=this.dn%this.N;this.dn++;const s=this.sn++,hy=hash(s,1.3,2)*this.H,wx=(hash(s,2.1,3)-.5)*(hy>.5*this.H?1.5:.6),wz=(hash(s,3.7,4)-.5)*.5,c=Math.cos(this.grp.rotation.y),sn=Math.sin(this.grp.rotation.y);
   this.dp[i*3]=this.base.x+wx*c+wz*sn;this.dp[i*3+1]=this.base.y+hy;this.dp[i*3+2]=this.base.z-wx*sn+wz*c;
   this.dv[i*3]=(hash(s,5.1,6)-.5)*.25;this.dv[i*3+1]=.18+hash(s,6.6,7)*.45;this.dv[i*3+2]=(hash(s,7.2,8)-.5)*.25;this.dm[i]=this.dl[i]=1.5+hash(s,8.3,9)*1.6}}
 _feather(){for(const f of this.fe)if(f.l<=0){const s=this.sn++,hy=this.H*(.35+hash(s,1,2)*.55),wx=(hash(s,2,3)-.5)*1.4;f.m.visible=true;f.l=3.5+hash(s,3,4)*2;f.s=s;
   f.m.position.set(this.base.x+wx,this.base.y+hy,this.base.z+(hash(s,4,5)-.5)*.5);f.v.set((hash(s,5,6)-.5)*.2,-.14-hash(s,6,7)*.12,(hash(s,7,8)-.5)*.2);return}}
 update(t,dt){const A=this.A,k=1-Math.exp(-dt*this.rate);this.grp.position.y=this.base.y+this.lift;for(const n in this.T)this.C[n]+=(this.T[n]-this.C[n])*k;
  ANIM.human(A,{t,dt,mv:0,at:-1,wave:0,look:this.C.look});
  const q=this.C.kneel;                                              // arrodillado sobre una rodilla (pierna R delante), cabeza/torso/brazos a mano
  if(q>.001){A.b.pelvis.position.y=A.restP.pelvis.y-q*.31;A.rot('legR',-1.35*q,0,0);A.rot('kneeR',1.4*q,0,0);A.rot('ankR',.2*q,0,0);A.rot('legL',.12*q,0,0);A.rot('kneeL',1.75*q,0,0);A.rot('ankL',.5*q,0,0)}
  const br=Math.sin(t*1.3)*.015;A.rot('chest',.2*q+this.C.chest+br,0,0);A.rot('head',this.C.head,this.C.look,0);
  if(q>.001||this.C.armR||this.C.armL){A.rot('armR',-.75*q+this.C.armR,0,0);A.rot('elbR',-.9*q,0,0);A.rot('armL',.3*q+this.C.armL,0,0);A.rot('elbL',-.25*q,0,0)}
  // polvo y plumas
  const d=this.dis||0;if(d>.0005&&d<1){this.acc+=dt*(40+260*Math.sin(Math.min(1,d)*Math.PI));const n=this.acc|0;this.acc-=n;this._spawn(n);if(hash(this.sn,9,9)<dt*7)this._feather()}
  else if(d<=.0005&&hash(Math.floor(t*4),1,1)<dt*.9)this._feather();
  for(let i=0;i<this.N;i++){if(this.dl[i]<=0)continue;this.dl[i]-=dt;if(this.dl[i]<=0){this.dp[i*3+1]=-999;this.dc[i*3]=this.dc[i*3+1]=this.dc[i*3+2]=0;continue}
   const L=this.dl[i]/this.dm[i],sw=Math.sin(t*2+i)*.12;this.dp[i*3]+=(this.dv[i*3]+sw)*dt;this.dp[i*3+1]+=this.dv[i*3+1]*dt;this.dp[i*3+2]+=this.dv[i*3+2]*dt;
   const f=Math.min(1,L*2.2)*Math.min(1,(1-L)*8+.2);this.dc[i*3]=1*f;this.dc[i*3+1]=.74*f;this.dc[i*3+2]=.3*f}
  this.pts.material.size=ppx(.085);this.pts.geometry.attributes.position.needsUpdate=true;this.pts.geometry.attributes.color.needsUpdate=true;
  for(const f of this.fe){if(f.l<=0)continue;f.l-=dt;if(f.l<=0||f.m.position.y<=this.base.y+.02){f.l=0;f.m.visible=false;continue}
   f.m.position.x+=(f.v.x+Math.sin(t*1.7+f.s)*.1)*dt;f.m.position.y+=f.v.y*dt;f.m.position.z+=(f.v.z+Math.cos(t*1.3+f.s)*.1)*dt;f.m.rotation.set(Math.sin(t*1.1+f.s)*1.1,t*.8+f.s,Math.cos(t*.9+f.s)*.9)}}
 dispose(){this.scene.remove(this.grp,this.pts,this.beam);this.beam.geometry.dispose();this.beamM.dispose();this.halo.geometry.dispose();this.haloM.dispose();this.pts.geometry.dispose();this.pts.material.dispose();for(const f of this.fe){this.scene.remove(f.m)}this.mats.forEach(m=>m.dispose());this.A.dispose&&this.A.dispose()}
}
