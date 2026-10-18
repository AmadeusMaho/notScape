// NotScape · R3D · F3f-P3A · SOMBRAS DE CONTACTO («blobs» de oclusión ambiental) — 18 oct 2026.
// UN solo InstancedMesh de quads planos con un degradado radial oscuro, pegados al suelo bajo props, recursos, estaciones, actores y héroe. Cuesta 1 draw call
// y nada de postproceso: da peso y «apoyo» a todo lo que antes parecía flotar sobre el terreno. NO es niebla ni grano; solo oscurece el suelo bajo la base.
// · Estático (props, recursos, estaciones): se reconstruye solo cuando cambia la firma (props.fpVer, res.sign(), ST.length).
// · Dinámico (actores vivos y héroe): se reescribe cada fotograma en la cola del buffer (solo ese rango sube a la GPU).
// · Opacidad según la hora (de noche más tenue: ya hay poca luz) y según la calidad (QL>=4 = apagado). Ajustable en vivo: R3D.contact (0–1,5).
import * as THREE from 'three';

const CAP=9000;
function blobTex(){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),r=g.createRadialGradient(64,64,0,64,64,64);
 r.addColorStop(0,'rgba(255,255,255,.95)');r.addColorStop(.42,'rgba(255,255,255,.62)');r.addColorStop(.72,'rgba(255,255,255,.2)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,128,128);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}

export class Contact{
 constructor(scene,W3){this.W3=W3;this.k=1;this.on=true;this.sig='';this.nS=0;this.stats={estaticas:0,dinamicas:0};
  const geo=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2);
  this.mat=new THREE.MeshBasicMaterial({map:blobTex(),color:'#07100f',transparent:true,opacity:.55,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
  this.mesh=new THREE.InstancedMesh(geo,this.mat,CAP);this.mesh.frustumCulled=false;this.mesh.count=0;this.mesh.renderOrder=-1;this.mesh.name='contact3d';this.mesh.raycast=()=>{};   // que no estorbe a los rayos de clic
  this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(this.mesh);this.o=new THREE.Object3D()}
 // escribe un blob: centro (x,z) en unidades 3D, altura y del suelo, semiejes (sx,sz) en tiles
 put(i,x,y,z,sx,sz){const o=this.o;o.position.set(x,y+.035,z);o.scale.set(sx*2,1,sz*2);o.updateMatrix();this.mesh.setMatrixAt(i,o.matrix)}
 buildStatic(props,N,ST){let n=0;const TW=ISO.TILE,W3=this.W3;
  // props (casas, vallas, barriles…): semiejes = media caja de la malla ×1,35; se saltan los planos bajitos (alfombras, adoquines sueltos)
  if(props.fp)for(const f of props.fp){if(n>=CAP-600)break;const p=W3(f.x,f.y,TER.standZ(f.x,f.y));this.put(n++,p.x+f.cx,p.y,p.z+f.cz,f.sx,f.sz)}
  // recursos: árboles (base del tronco) y menas
  for(const e of N){if(n>=CAP-600)break;if(e.t!=='wc'&&e.t!=='mi')continue;const p=W3(e.x,e.y,TER.standZ(e.x,e.y)),r=e.t==='wc'?.5:.72;this.put(n++,p.x,p.y,p.z,r,r)}
  // estaciones sueltas (fogata, hornos…) — sin Ru ni puertas
  for(const e of ST){if(n>=CAP-600)break;if(e.id==='ru'||e.id==='door'||e.exit||e.inroom)continue;const d=PROPS.ST&&PROPS.ST[e.id];if(!d||!d.n)continue;const p=W3(e.x,e.y,TER.standZ(e.x,e.y));this.put(n++,p.x,p.y,p.z,.8,.8)}
  this.nS=n;this._fullNext=true;this.mesh.instanceMatrix.needsUpdate=true;this.stats.estaticas=n}
 update(props,res,actors,P,night,ql){
  const on=this.on&&this.k>0&&(typeof ql==='number'?ql<4:true);this.mesh.visible=on;if(!on)return;
  const sig=(props.fpVer||0)+'|'+res.sign()+'|'+(typeof ST!=='undefined'?ST.length:0);if(sig!==this.sig){this.sig=sig;this.buildStatic(props,N,ST)}
  let n=this.nS;const W3=this.W3;
  // dinámicos: actores vivos visibles
  if(actors&&actors.map)for(const A of actors.map.values()){if(n>=CAP)break;if(!A.vis||A.state==='gone'||!A.grp.visible)continue;const p=A.grp.position,h=(A.tpl&&A.tpl.h||1)*(A.sc||1),r=Math.min(1.5,Math.max(.3,h*.3));const dy=A.state==='dying'?0:0;this.put(n++,p.x,p.y+dy,p.z,r*1.1,r)}
  // héroe
  if(P&&typeof TER!=='undefined'&&n<CAP){const p=W3(P.x,P.y,TER.standZ(P.x,P.y));this.put(n++,p.x,p.y,p.z,.42,.42)}
  this.mesh.count=n;this.stats.dinamicas=n-this.nS;
  const im=this.mesh.instanceMatrix;im.needsUpdate=true;   // dinámicos: solo el tramo de la cola sube a la GPU
  if(typeof im.clearUpdateRanges==='function'){im.clearUpdateRanges();if(this.nS>0&&!this._fullNext&&n>this.nS)im.addUpdateRange(this.nS*16,(n-this.nS)*16)}   // tras reconstruir lo estático se sube TODO una vez (sin rangos)
  this._fullNext=false;
  this.mat.opacity=.55*Math.min(1.5,this.k)*(1-.4*Math.max(0,Math.min(1,night||0)))}
}
