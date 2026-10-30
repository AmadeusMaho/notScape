// NotScape · R3D · MUNDO-HITOS (30 oct 2026) · HITOS GRANDES del continente (plan: docs/PLAN_CONTINENTE.md §2). Primer lote: los de la PRADERA.
// Módulo hermano de `propsdark3d.js`, `propsdark_pradera3d.js`, `propsdark_bosque3d.js` y `propsdark_cielo3d.js`: mismo colector `B`, misma firma (`hitosGeo` → {g,key}), mismo contrato.
// Un HITO es una estructura singular, ALTA y de silueta reconocible desde lejos (sirve para orientarse). Aquí:
//  · torreVigia      — Torre del Vigía: atalaya de piedra con plataforma almenada, brasero de señales (llama aEmit 3/4: se ve de día y de noche) y estandarte. ~3×8×3 tiles.
//  · robleCentenario — Roble del Pacto: roble enorme de copa facetada con mesa de piedra y taburetes a su sombra, cintas rojas en las ramas y un farol ámbar. ~6×7×6 tiles.
//  · torreRuina      — torre derruida (esquina del Fortín de los Bandidos); el fortín se compone con ella + `muroRuina`/`estandarte`/`hoguera` de la Pradera (poi-gen.js, plantilla `lm_fortin`).
//
// CONTRATO (igual que los otros módulos): 1 tile = 1 unidad, y arriba, origen = centro de la huella en el suelo, frente hacia +z (props3d.js lo escala ×PROP_K=1,5). `o.rot` (espejo x↔z) funciona en todos.
//  · `o.bk` (bioma de la instancia, lo inyecta props3d.js si el nombre está en HI_BK) elige la fila de la paleta `ARQ` (una fila por bioma, nunca un `if`): cada bioma tendrá sus hitos con su civilización.
//  · aEmit: 1 = farol/ventana · 3/4 = brasero (llama y brasa). DETERMINISTA: todo el azar sale de `hash` con semilla por modelo. Sin tejados a dos aguas (no hay nada que `clipReport` deba vigilar, pero se exporta igual).
import * as THREE from 'three';
import {B,hash,vary,mix,mul,col,swapXZ} from './propsdark3d.js';
import {tube,A,band,TAU} from './propsdark_pradera3d.js';

export const TOL=.22;
const DK=col('#17130f'),AMB=col('#ffb347'),FIRE=col('#ff8a2a'),EMB=col('#ff5a1a');

// blob facetado (copa de roble, matorral): elipsoide de `L` anillos × `n` lados, radio perturbado por hash (aspecto de masa de hojas, no una bola lisa)
function blob(b,cx,cy,cz,r,ry,c,sd,n=9,L=5){const ring=i=>{const t=-Math.PI/2+i/L*Math.PI,s=Math.cos(t),y=cy+Math.sin(t)*ry;return[s,y]},ctr=[cx,cy,cz];
 for(let i=0;i<L;i++){const[s0,y0]=ring(i),[s1,y1]=ring(i+1),f0=i/L,j0=.86+.28*hash(sd,i,3),j1=.86+.28*hash(sd,i+1,3);
  band(b,cx,cz,Math.max(.001,r*s0*j0),y0,Math.max(.001,r*s1*j1),y1,n,hash(sd,i,9)*.6,k=>mul(vary(c,.2,sd,k+i*13),.78+.4*(f0+.5/L)),ctr)}}
// tambor de piedra (bloque con jitter) para almenas y muros
const stoneBox=(b,x,y,z,w,h,d,c,i)=>b.box(x,y,z,w,h,d,vary(c,.1,b.seed,i),{v:.12,jit:.02});

const MODELS={
 // ───────── TORRE DEL VIGÍA ─────────
 torreVigia(o){const b=new B(701),a=A(o);
  b.box(0,0,0,3.05,.3,3.05,mul(a.stone,.8),{v:.1,jit:.02});                                              // zócalo
  const S=[[2.5,2.1,.3],[2.32,2.1,2.4],[2.14,1.95,4.5]];                                                 // fuste en 3 tramos que se estrechan [ancho, alto, y0]
  S.forEach(([w,h,y0],i)=>{stoneBox(b,0,y0,0,w,h,w,a.stone,i);
   for(let j=1;j<4;j++)b.box(0,y0+j*h/4,0,w+.025,.028,w+.025,mul(a.stone,.68),{nb:1});                   // hiladas de sillería
   [-1,1].forEach(sx=>[-1,1].forEach(sz=>b.box(sx*(w/2-.02),y0,sz*(w/2-.02),.16,h,.16,vary(a.stone2,.08,701,i*5+sx+sz),{nb:1})))});   // esquinas de sillares claros
  b.box(0,.3,1.27,.78,1.1,.16,a.stone2,{nb:1});b.box(0,.3,1.29,.6,.96,.16,mul(a.wood,.8),{nb:1});b.box(0,1.34,1.3,.9,.12,.2,a.stone2,{nb:1});   // puerta de madera con dintel
  [[0,3.0],[0,5.3]].forEach(([x,y],i)=>[[0,1],[1,0],[0,-1],[-1,0]].forEach(([dx,dz],q)=>{const w=i?2.14:2.32,e=w/2+.01;b.box(dx*e+(dz?0:0),y,dz*e,dz?.12:.07,.52,dz?.07:.12,DK,{nb:1,em:i&&q===0?1:0})}));  // saeteras (la alta del frente, con luz de vigía)
  b.box(0,6.45,0,2.95,.24,2.95,mul(a.stone2,.9),{v:.1,jit:.02});                                         // plataforma volada
  for(let i=0;i<4;i++)b.box(0,6.45,0,3.05-i*.04,.04,3.05-i*.04,mul(a.stone,.55),{nb:1});               // sombra bajo el vuelo
  [-1,1].forEach((s,i)=>{for(let k=0;k<3;k++){stoneBox(b,-1.1+k*1.1,6.69,s*1.35,.5,.5,.3,a.stone2,10+i*3+k);stoneBox(b,s*1.35,6.69,-1.1+k*1.1,.3,.5,.5,a.stone2,20+i*3+k)}});   // 12 almenas
  [[1.2,1.2],[-1.2,1.2],[1.2,-1.2],[-1.2,-1.2]].forEach(([x,z],i)=>b.box(x,6.69,z,.34,.6,.34,vary(a.stone2,.08,701,30+i),{nb:1}));
  b.cyl(0,6.69,0,.34,.24,.22,8,a.metal,{v:.1,nb:1});[0,1,2,3].forEach(i=>tube(b,[Math.cos(i*1.57)*.3,6.88,Math.sin(i*1.57)*.3],[Math.cos(i*1.57)*.12,7.2,Math.sin(i*1.57)*.12],.025,.02,4,a.metal,{nb:1}));   // brasero de señales
  b.cyl(0,6.9,0,.22,.05,.46,6,FIRE,{em:3,nb:1});b.cyl(0,6.9,0,.1,.02,.62,5,AMB,{em:4,nb:1});
  tube(b,[1.2,6.69,-1.2],[1.2,8.4,-1.2],.04,.03,5,a.wood,{nb:1});b.box(1.2,7.55,-1.2+.32,.02,.52,.62,a.cloth,{nb:1,my:0});b.box(1.2,7.55,-1.2+.32,.026,.06,.62,a.acc,{nb:1});return b},   // mástil con estandarte
 // ───────── ROBLE DEL PACTO ─────────
 robleCentenario(o){const b=new B(702),a=A(o),G=['#2f5a2c','#3c6c30','#4b7a38','#355f2e'].map(h=>mix(col(h),col('#3a3a28'),.18));
  tube(b,[0,0,0],[.02,3.3,0],.66,.44,9,a.wood,{v:.14});
  for(let i=0;i<7;i++){const t=i/7*TAU+.3,c=Math.cos(t),s=Math.sin(t);tube(b,[c*.25,.55,s*.25],[c*1.25,0,s*1.25],.25,.1,5,vary(a.wood,.12,702,i),{v:.1,nb:1})}          // raíces que se abren
  for(let i=0;i<5;i++){const t=i/5*TAU+.7,c=Math.cos(t),s=Math.sin(t),y=2.7+(i%3)*.3;tube(b,[c*.1,y,s*.1],[c*1.9,y+1.45,s*1.9],.2,.08,5,vary(a.wood,.1,702,10+i),{v:.1})}   // ramas maestras
  blob(b,0,5.5,0,2.3,1.7,G[0],1,10,5);
  for(let i=0;i<7;i++){const t=i/7*TAU+.4,r=1.95+hash(702,i,1)*.5,y=4.45+hash(702,i,2)*1.3;blob(b,Math.cos(t)*r,y,Math.sin(t)*r,1.25+hash(702,i,3)*.5,.95,G[(i+1)%4],10+i,8,4)}
  blob(b,.3,6.7,-.2,1.5,1.0,G[2],30,8,4);
  [[2.1,4.25,.3],[-1.6,4.5,1.5],[.4,4.3,-2.1]].forEach(([x,y,z],i)=>{tube(b,[x,y,z],[x+.03,y-.7-.15*i,z],.018,.015,4,a.cloth,{nb:1});b.box(x+.03,y-.95-.15*i,z,.07,.5,.02,a.cloth,{nb:1,my:i})});   // cintas del pacto
  tube(b,[1.5,4.9,.9],[1.5,4.55,.9],.01,.01,3,a.metal,{nb:1});b.box(1.5,4.3,.9,.14,.2,.14,AMB,{em:1,nb:1});                                                                    // farol ámbar
  const tx=2.7,tz=1.9;b.box(tx,.56,tz,1.5,.15,.9,a.stone2,{v:.1,jit:.02});[-.5,.5].forEach(s=>b.box(tx+s,0,tz,.3,.56,.5,a.stone,{v:.1,jit:.02}));                                // mesa de piedra
  for(let i=0;i<6;i++){const t=i/6*TAU+.2,c=tx+Math.cos(t)*1.25,s=tz+Math.sin(t)*.95;b.cyl(c,0,s,.22,.2,.34,6,vary(a.stone,.1,702,40+i),{nb:1})}                             // taburetes
  return b},
 // ───────── TORRE EN RUINAS (esquina del Fortín de los Bandidos) ─────────
 torreRuina(o){const b=new B(703),a=A(o);
  b.cyl(0,0,0,1.15,1.05,.4,8,mul(a.stone,.8),{v:.1,jit:.02});
  for(let i=0;i<8;i++){const t=i/8*TAU+.2,h=.9+hash(703,i,1)*1.7;b.box(Math.cos(t)*.86,.4,Math.sin(t)*.86,.56,h,.5,vary(a.stone,.12,703,i),{v:.14,jit:.03,my:-t})}   // muro circular que se rompe a distintas alturas
  for(let i=0;i<5;i++){const t=hash(703,i,5)*TAU;b.box(Math.cos(t)*(1.2+hash(703,i,6)*.5),0,Math.sin(t)*(1.2+hash(703,i,6)*.5),.3+hash(703,i,7)*.2,.2,.26,vary(a.stone,.14,703,20+i),{nb:1,my:t})}   // escombros
  tube(b,[-.5,.4,.2],[.55,1.1,.5],.07,.06,5,mul(a.wood,.7),{nb:1});tube(b,[.1,.4,-.6],[.8,.75,.3],.06,.05,5,mul(a.wood,.6),{nb:1});                                                 // vigas quemadas caídas
  b.box(0,.4,0,1.4,.1,1.4,DK,{nb:1});return b},
 // ───────── MENHIR (círculo de piedras de pie; `o.v` 0 alto · 1 medio · 2 inclinado · 3 partido) ─────────
 menhir(o){const b=new B(704),a=A(o),v=((o&&o.v)|0)%4,H=[2.3,1.75,2.05,1.0][v],W=[.62,.6,.56,.7][v],sd=704+v*7,lean=v===2?.34:.07,c=mix(a.stone,col('#5a5f4a'),.16),mo=mix(col('#3a5a2c'),col('#2a3a20'),.4),n=7,RN=6;
  // monolito tosco: 6 anillos de 7 lados que se estrechan hacia la punta, con el radio perturbado por hash, la columna algo inclinada y la cima rota en cuña (nada de cajas)
  const ring=(i)=>{const t=i/RN,y=.05+Math.pow(t,.92)*H,r=W*(1-.42*t)*(i===RN?.55:1),cx=lean*t*t*H*.5+(hash(sd,i,2)-.5)*.07,cz=(hash(sd,i,4)-.5)*.07;
   return Array.from({length:n},(_,k)=>{const aa=k/n*TAU+.35,rr=r*(.82+.36*hash(sd,i*9+k,1));return[cx+Math.cos(aa)*rr*(1+.12*(k%2)),y+(i===RN?(k%3)*.1:0)+(hash(sd,i*9+k,6)-.5)*.05,cz+Math.sin(aa)*rr*.86]})};
  const R=Array.from({length:RN+1},(_,i)=>ring(i)),ctr=[lean*H*.25,H*.5,0];
  for(let i=0;i<RN;i++)for(let k=0;k<n;k++){const k2=(k+1)%n,f=(i+.5)/RN,cl=mix(vary(c,.12,sd,i*9+k),mo,Math.max(0,.5-f)*.7*hash(sd,i*9+k,3)*2);b.quad(R[i][k],R[i][k2],R[i+1][k2],R[i+1][k],cl,0,ctr)}
  for(let k=0;k<n;k++)b.tri(R[RN][k],R[RN][(k+1)%n],[R[RN][0][0],R[RN][0][1]+.12,R[RN][0][2]],mul(c,1.08),0,[ctr[0],H,0]);
  b.stone(0,0,0,W*2.0,.2,W*1.8,mul(c,.8),{s:sd,j:.22});                                                   // base hundida
  if(v===3){b.stone(.9,0,.5,.6,.34,.5,vary(c,.1,sd,9),{s:sd+9,j:.28});b.stone(-.7,0,.7,.5,.26,.44,vary(c,.1,sd,10),{s:sd+10,j:.28})}   // fragmentos caídos
  const rn=mix(a.stone2,col('#9ad8c0'),.5),zf=W*.78;[.8,1.15,1.5].slice(0,v===3?1:3).forEach((yy,i)=>b.box(lean*(yy/H)*(yy/H)*H*.5,yy,zf*(1-.42*yy/H)+.01,.24-i*.04,.045,.03,rn,{nb:1,em:i===1?1:0}));   // runas talladas (la del medio brilla muy suave)
  return b},
 // ───────── PUENTE DE PIEDRA ANTIGUO (arco de sillares sobre un río; corre a lo largo de X, `o.rot` lo gira a Z) ─────────
 puenteAntiguo(o){const b=new B(705),a=A(o),L=5.8,HW=1.0,N=9,hy=x=>.5+.5*(1-(x/(L/2))**2);
  for(let i=0;i<N;i++){const x=-L/2+(i+.5)*L/N,w=L/N+.02,h=hy(x);b.box(x,h-.24,0,w,.24,HW*2.1,vary(a.stone2,.08,705,i),{v:.1,jit:.015});                            // tablero escalonado
   [-1,1].forEach((s,j)=>{b.box(x,h,s*(HW-.1),w,.4,.2,vary(a.stone,.1,705,20+i*2+j),{v:.12,jit:.02});b.box(x,h+.4,s*(HW-.1),w+.01,.07,.26,mul(a.stone2,.95),{nb:1})})}      // parapetos con albardilla
  [-1,1].forEach(s=>{b.box(s*(L/2-.55),0,0,1.1,hy(s*(L/2-.55))-.24,HW*2,mul(a.stone,.85),{v:.12,jit:.02});                                                                    // estribos
   b.box(s*(L/2+.2),0,0,.5,.7,HW*1.7,mul(a.stone,.75),{nb:1});[-1,1].forEach(z=>{b.box(s*(L/2+.15),.2,z*(HW+.05),.25,.7,.25,a.stone2,{nb:1})})});                          // rampas y pilares de remate
  const K=10,R=1.55,cy=-.62;for(let k=0;k<K;k++){const t0=Math.PI*(k/K),t1=Math.PI*((k+1)/K);[-1,1].forEach(z=>b.beam([Math.cos(t0)*R*1.0,Math.sin(t0)*R*.78+cy+.55,z*(HW-.05)],[Math.cos(t1)*R*1.0,Math.sin(t1)*R*.78+cy+.55,z*(HW-.05)],.13,vary(a.stone,.1,705,60+k+(z>0?20:0)),{nb:1}))}   // arco de dovelas
  b.box(0,hy(0)-.46,HW-.02,.34,.26,.1,a.acc?mix(a.stone2,col('#c8b078'),.3):a.stone2,{nb:1});b.box(0,hy(0)-.46,-HW+.02,.34,.26,.1,mix(a.stone2,col('#c8b078'),.3),{nb:1});          // clave del arco
  [-1,1].forEach(s=>tube(b,[s*(L/2+.15),.9,HW+.05],[s*(L/2+.15),1.5,HW+.05],.03,.025,4,a.wood,{nb:1}));b.box(L/2+.15,1.35,HW+.05,.1,.14,.1,AMB,{em:1,nb:1});                       // farol del extremo
  b.box(0,.04,0,L*.7,.04,HW*2.4,mix(col('#2f4a3a'),col('#1a2a24'),.5),{nb:1});return b}};
const GEO=new Map();
export function hitosGeo(n,o,th){if(!MODELS[n])return null;const key='dk:hi:'+n+'|'+JSON.stringify(o||{});if(GEO.has(key))return GEO.get(key);
 let g=MODELS[n](o||{}).geo();if(o&&(o.rot||o.dir==='y'))g=swapXZ(g);const r={g,key};GEO.set(key,r);return r}
export const HI_NAMES=Object.keys(MODELS);
export const HI_BK=new Set(HI_NAMES);                 // todos reciben `bk` (props3d.js) para elegir su fila de paleta
export const HI_ROCK=new Set(['torreVigia','torreRuina','menhir','puenteAntiguo']);   // se dibujan con el material de roca
// huella aproximada (ancho x, alto y, fondo z; sin escalar ×PROP_K); la colisión `fp` de poi-gen.js sale de aquí: torre 3,05×3,05 → ±50 px, roble: solo tronco y mesa
export const HI_FOOT={torreVigia:[3.05,8.4,3.05],robleCentenario:[7.6,7.8,6.9],torreRuina:[2.9,2.6,3.5],menhir:[1.4,2.4,1.1],puenteAntiguo:[6.8,2.0,2.5]};
export function HI_CASES(){const L=[];for(const n of HI_NAMES)for(let k=0;k<9;k++)L.push([n,{bk:k},n]);return L}
export function clipReport(n,o){const b=MODELS[n](o||{});return {clips:b.clips(),roofs:b.R.length}}
