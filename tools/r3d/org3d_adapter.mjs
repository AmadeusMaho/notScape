// NotScape · R3D · adaptador ORG → three.js (probado en la demo «Linterna» con 31 modelos reales y aquí con los 150).
// Convierte la salida de ORG.capture (style-organic.js) en UNA BufferGeometry por modelo: color por vértice, normales planas en piezas rígidas
// (cajas, tejados: facetas OSRS) y suaves en orgánicas (copas, rocas), atributo aEmit desde una tabla de colores emisivos (datos, nunca un if por modelo).
// Uso en el juego (F2):
//   import * as THREE from 'three'; import {orgGeometry} from './org3d_adapter.mjs';
//   const parts=ORG.capture(()=>{ORG.theme(tema);ORG.rot(rot);ORG.U[nombre](null,0,0,0,opciones)});   // ORG.theme/rot como en PROPS.bake
//   const geo=orgGeometry(THREE,parts,{seed:nombre.length});   // cachear por nombre+JSON(opciones)+tema; instanciar repetidos
// Unidades: modelo ORG → tiles dividiendo por ORG_PX (39.6); ejes ORG (x, y, z↑) → three (x, z, y). Ver docs/GUIA_3D_PORTEO.md §3.
export const ORG_PX=39.6;
// 1 = ventana/farol (se enciende de noche), 2 = fuego/lava/vela (brilla siempre)
export const EMIT={'#9fd6e8':1,'#6fa8d8':1,'#ffd98a':1,'#ffb84a':1,'#ffd070':2,'#ff8a2a':2,'#ff7a2a':2,'#ffb040':2,'#7ad0ff':2,'#ff4a2a':2};
const hash=(a,b,c)=>{const h=Math.sin(a*127.1+b*311.7+c*74.7)*43758.5453;return h-Math.floor(h)};
export function orgGeometry(THREE,parts,opt={}){const emit=opt.emit||EMIT,seed=opt.seed||0,litShare=opt.litShare??.8;
 const P=[],N=[],C=[],E=[],col=new THREE.Color(),ce=new THREE.Vector3(),tc=new THREE.Vector3(),n=new THREE.Vector3();
 parts.forEach((pt,pi)=>{const k=pt.k||1;col.set(pt.col);const em=emit[String(pt.col).toLowerCase()]||0,lit=em===1?(hash(pi,seed,3)<litShare?1:0):em;
  const VV=pt.V.map(v=>new THREE.Vector3(v[0]*k/ORG_PX,v[2]*k/ORG_PX,v[1]*k/ORG_PX));
  if(pt.c)ce.set(pt.c[0]*k/ORG_PX,pt.c[2]*k/ORG_PX,pt.c[1]*k/ORG_PX);else{ce.set(0,0,0);VV.forEach(v=>ce.add(v));ce.multiplyScalar(1/VV.length)}
  const tris=pt.T.map(([i0,i1,i2])=>{n.subVectors(VV[i1],VV[i0]).cross(tc.subVectors(VV[i2],VV[i0]));tc.copy(VV[i0]).add(VV[i1]).add(VV[i2]).multiplyScalar(1/3).sub(ce);return n.dot(tc)<0?[i0,i2,i1]:[i0,i1,i2]});
  const VN=VV.map(()=>new THREE.Vector3());const FN=tris.map(([i0,i1,i2])=>{const f=new THREE.Vector3().subVectors(VV[i1],VV[i0]).cross(new THREE.Vector3().subVectors(VV[i2],VV[i0]));VN[i0].add(f);VN[i1].add(f);VN[i2].add(f);return f.clone().normalize()});
  VN.forEach(v=>v.normalize());
  tris.forEach((t,ti)=>t.forEach(i=>{const v=VV[i],nn=pt.rig?FN[ti]:VN[i];P.push(v.x,v.y,v.z);N.push(nn.x,nn.y,nn.z);C.push(col.r,col.g,col.b);E.push(lit)}))});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));
 g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setAttribute('aEmit',new THREE.Float32BufferAttribute(E,1));g.computeBoundingSphere();return g}
