// ALAS DE ÁNGEL REUTILIZABLES (Lote CINE-2b, 21 oct 2026): `angelWings(opts)` devuelve una función de accesorio `(F,g,part)` para `Mini`/`buildHuman` (se hornea con el cuerpo).
// Forma: un BRAZO curvo (hombro→codo→muñeca, Bézier) con TRES filas de plumas redondeadas (cápsulas aplanadas, de punta suave) que se solapan como en un ala real:
//   coberteras (cortas, anchas, a lo largo del brazo) · secundarias (medias, antebrazo) · primarias (largas, abanico desde la muñeca).
// Opciones (todas opcionales):  q 1|-1 lado (derecha|izquierda del personaje) · span tamaño (1 = alas de ≈1,2× el torso) · droop 0 alzada … 1 colgando ·
//   primaries/secondaries/coverts nº de plumas por fila · hole fracción de plumas que faltan · burnt fracción quemada (oscura y más corta) ·
//   light/shade/tip colores (pluma clara, sombra, ceniza) · seed semilla del azar determinista (hash, nunca Math.random) · lean inclinación hacia atrás.
// Uso:  acc: mix(angelWings({q:1}), angelWings({q:-1,droop:.8,burnt:.25,hole:.2}))   // un ala por lado (ver `NPC_DEF.gabriel` en actors3d.js)
// Contrato de «regla de sentido»: nacen en el hombro (y=.84, z=−.2 del cuerpo), nunca flotan; con droop 1 llegan al suelo del modelo a span≈1.
import * as THREE from 'three';
import {hash} from './materials3d.js';

const lerp=(a,b,t)=>a+(b-a)*t;
// pluma = HOJA: perfil de revolución (base estrecha, vientre ancho hacia el 40 %, punta suave) aplastada en z; base en el origen y punta en +y
const LEAF=[[0,0],[.45,.1],[.85,.32],[1,.5],[.82,.76],[.42,.94],[0,1]];
const leaf=(L,w)=>new THREE.LatheGeometry(LEAF.map(([x,y])=>new THREE.Vector2(x*w,y*L)),8).scale(1,1,.13);
export const angelWings=(o={})=>(F,g,part)=>{
 const q=o.q||1,sp=o.span||1,dp=o.droop||0,n1=o.primaries||7,n2=o.secondaries||6,n3=o.coverts||8,hole=o.hole||0,burnt=o.burnt||0,seed=o.seed||1;
 const cA=o.light||'#f1ecdf',cB=o.shade||'#d6d0be',cT=o.tip||'#4a4036';
 const w=new THREE.Group();w.position.set(q*.11,.84,-.2);w.rotation.x=-(o.lean==null?.12:o.lean);g.add(w);
 // brazo: muñeca W (alzada: arriba y afuera · colgando: abajo y un poco afuera) y codo E (abultado hacia fuera/arriba si está alzada)
 const W=[lerp(.62,.34,dp)*sp,lerp(.95,-.55,dp)*sp],E=[W[0]*.5+.16*sp*(1-dp),W[1]*.45+.18*sp*(1-dp)];
 const bez=t=>[2*(1-t)*t*E[0]+t*t*W[0],2*(1-t)*t*E[1]+t*t*W[1]];
 // hueso del ala (dos tramos: hombro→codo, codo→muñeca)
 const bone=(a,b)=>{const L=Math.hypot(b[0]-a[0],b[1]-a[1]);const m=new THREE.Group();m.position.set(q*a[0],a[1],0);m.rotation.z=-q*Math.atan2(b[0]-a[0],b[1]-a[1]);w.add(m);
  part(new THREE.CylinderGeometry(.02,.026,L,6).translate(0,L/2,0),'#a39a85',0,0,0,{p:m,ink:.006})};
 const mid=bez(.5);bone([0,0],mid);bone(mid,W);
 // una pluma: cápsula aplanada con punta redondeada, base en el punto del brazo y apuntando a `ang` (desde la vertical, hacia fuera)
 const feather=(row,i,t,ang,L,wd,col,zo)=>{
  if(hash(i*1.7+q*3.1+row*9.3,seed,5)<hole)return;                                         // falta (ala rota)
  const burn=hash(i*2.3+row*5.1,seed,6)<burnt,sh=hash(i,q+row+3,seed)<hole*.7?.55:1,LL=L*sh*(burn?.78:1);   // quebrada a medias / chamuscada
  const p=bez(t),f=new THREE.Group();f.position.set(q*p[0],p[1],zo);f.rotation.z=-q*ang;f.rotation.y=q*.05*(i%3-1);w.add(f);
  const c=burn?cT:(i+row)%2?cB:cA;
  part(leaf(LL,wd),c,0,0,0,{p:f,ink:.006});
  if(!burn&&row===2&&burnt>0)part(leaf(LL*.3,wd*.55).translate(0,LL*.74,0),cT,0,0,.002,{p:f,ink:0})};   // primarias: punta de ceniza si hay fuego
 const D=(a0,a1,i,n)=>dp>0?lerp(lerp(a0,a1,i/(n-1)),2.95+(i%3-1)*.07,dp*.92):lerp(a0,a1,i/(n-1));   // el ángulo tiende a «colgando» con droop
 for(let i=0;i<n3;i++)feather(0,i,.1+.85*i/(n3-1),D(1.55,2.5,i,n3),.30*sp,.085*sp,cA,.03);          // coberteras (delante)
 for(let i=0;i<n2;i++)feather(1,i,.3+.6*i/(n2-1),D(1.85,2.7,i,n2),(.5+.12*(1-i/(n2-1)))*sp,.1*sp,cA,.0);   // secundarias
 for(let i=0;i<n1;i++)feather(2,i,.78+.22*i/(n1-1),D(.95,2.35,i,n1),(1.0-.34*i/(n1-1))*sp,.085*sp,cB,-.03);   // primarias (detrás, abanico desde la muñeca)
};
// Presupuesto: cada ala completa ≈ 4–5 k triángulos con contornos (7+6+8 plumas). Un personaje con DOS alas completas supera el tope de 14 000 de `actors_lint.py`: Gabriel (único) tiene tope propio 22 000 (CAP en el lint). Para ángeles en masa: `primaries:5,secondaries:4,coverts:5`.
