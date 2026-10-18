// NotScape · R3D · F2-A · PROPS ESTÁTICOS EN 3D (casas, farolas, vallas, barriles, pozos, puestos… = PROPS.list de props.js).
// Las mallas salen del catálogo 2D ya existente: ORG.capture(() => ORG.U[n](ctxFalso,0,0,0,o)) con el tema de la aldea y el espejo (o.rot), igual que
// PROPS.bake → tools/r3d/org3d_adapter.mjs (orgGeometry). Se agrupan por modelo+opciones+tema y se dibujan INSTANCIADAS (una llamada por modelo
// distinto + su contorno), con sombras reales y musgo en la base. Contorno de escenario fino y del color del objeto oscurecido (guía §4.3).
// Para el héroe (que se dibuja aparte, ver r3d.js) se exporta una copia «solo profundidad» de todo (capa 3): así una casa delante lo tapa y se ve
// su silueta en rayos X. Si PROPS.list cambia (editor de aldea), se reconstruye solo.
import * as THREE from 'three';
import {toon,hull,inkFor} from './materials3d.js';
import {orgGeometry,EMIT} from '../../tools/r3d/org3d_adapter.mjs';
import {deadTreeGeo} from './nature3d.js';

const FAKE=new Proxy({},{get:(t,k)=>k in t?t[k]:(/^create(Linear|Radial)Gradient$/.test(k)?()=>({addColorStop(){}}):k==='measureText'?()=>({width:10}):k==='getImageData'?()=>({data:new Uint8ClampedArray(4)}):k==='canvas'?{width:1,height:1}:()=>{}),set:(t,k,v)=>{t[k]=v;return true}});
const GEO=new Map(),CELL=24;
export function propGeo(n,o,th){const key=n+'|'+JSON.stringify(o||{})+'|'+(th?JSON.stringify(th):'');if(GEO.has(key))return GEO.get(key);let g=null;
 if(n==='arbolSeco'){g=deadTreeGeo(o&&o.rot?2:1);const c=new THREE.Color('#3a2f2a'),C=new Float32Array(g.attributes.position.count*3);for(let i=0;i<C.length;i+=3){C[i]=c.r;C[i+1]=c.g;C[i+2]=c.b}g.setAttribute('color',new THREE.BufferAttribute(C,3));g.setAttribute('aEmit',new THREE.BufferAttribute(new Float32Array(C.length/3),1));GEO.set(key,{g,key});return GEO.get(key)}   // árbol seco rehecho (guía §4.5)
 try{const parts=ORG.capture(()=>{ORG.theme(th||null);ORG.rot(!!(o&&o.rot));try{ORG.U[n](FAKE,0,0,0,o||{})}finally{ORG.theme(null);ORG.rot(false)}});
  if(parts.length){g=orgGeometry(THREE,parts,n==='santuario'?{seed:n.length,emit:{...EMIT,'#7ad0ff':3}}:{seed:n.length});   // F3f·P6: la gema del santuario es aEmit=3 (brillo normal de fuego × uShrK, que baja cuando el héroe se acerca)
  g.computeBoundingBox();g.computeBoundingSphere()}}catch(e){console.warn('[R3D props]',n,e)}
 GEO.set(key,g?{g,key}:null);return GEO.get(key)}

export class Props{
 constructor(scene,occScene,W3){this.scene=scene;this.occ=occScene;this.W3=W3;this.grp=new THREE.Group();this.grp.name='props3d';scene.add(this.grp);this.ogrp=new THREE.Group();occScene.add(this.ogrp);
  this.mat=toon('#ffffff',{vc:1,moss:.7,emit:1,tex:'auto',texS:7,texB:.45});this.ink=inkFor('#6a5a52');this.dmat=new THREE.MeshBasicMaterial({colorWrite:false});this.sig='';this.on=false;this.boxes=[]}
 sign(){const L=PROPS.list;return L.length+'|'+(L[0]?L[0].x+','+L[0].y:'')+'|'+(L.length?L[L.length-1].n+L[L.length-1].x:'')}
 update(){const s=this.sign();if(s===this.sig)return;this.sig=s;this.build()}
 build(){this.fp=[];this.fpVer=(this.fpVer||0)+1;[this.grp,this.ogrp].forEach(g=>{while(g.children.length){const c=g.children.pop();c.dispose&&c.dispose()}});
  const groups=new Map(),o3=new THREE.Object3D();let ok=0,fail=0;
  for(const e of PROPS.list){const k=e.k!=null?e.k:Math.max(0,BIOMES.at(e.x,e.y)),th=BIOMES.list[k]&&BIOMES.list[k].village.theme||null,G=propGeo(e.n,e.o,th);if(!G){fail++;continue}
   const ck=G.key+'@'+Math.floor(e.x/(32*CELL))+','+Math.floor(e.y/(32*CELL));let a=groups.get(ck);if(!a)groups.set(ck,a={G,list:[]});a.list.push(e);ok++}   // por modelo Y por zona de CELL×CELL tiles: así se descartan las zonas fuera de cámara
  groups.forEach(({G,list})=>{const n=list.length,m=new THREE.InstancedMesh(G.g,this.mat,n);m.castShadow=m.receiveShadow=true;
   if(!G.hull)G.hull=hull(G.g,.022).geometry;const h=new THREE.InstancedMesh(G.hull,this.ink,n);const d=new THREE.InstancedMesh(G.g,this.dmat,n);d.layers.set(3);
   {const bb=G.g.boundingBox;if(bb&&bb.max.y>.25){const sx=Math.max(.3,(bb.max.x-bb.min.x)*.5*1.35),sz=Math.max(.3,(bb.max.z-bb.min.z)*.5*1.35),cx=(bb.max.x+bb.min.x)*.5,cz=(bb.max.z+bb.min.z)*.5;list.forEach(e=>this.fp.push({x:e.x,y:e.y,cx,cz,sx:Math.min(sx,4),sz:Math.min(sz,4)}))}}   // F3f·P3A: huella de la malla para la sombra de contacto (contact3d.js)
   list.forEach((e,i)=>{const p=this.W3(e.x,e.y,TER.standZ(e.x,e.y));o3.position.copy(p);o3.updateMatrix();m.setMatrixAt(i,o3.matrix);h.setMatrixAt(i,o3.matrix);d.setMatrixAt(i,o3.matrix)});
   [m,h,d].forEach(x=>{x.instanceMatrix.needsUpdate=true;x.computeBoundingSphere()});this.grp.add(m,h);this.ogrp.add(d)});
  this.on=ok>0;this.stats={grupos:groups.size,modelos:GEO.size,props:ok,sinMalla:fail};console.info('[R3D props]',this.stats)}
}
