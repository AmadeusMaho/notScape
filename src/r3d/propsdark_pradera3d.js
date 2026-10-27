// NotScape · R3D · FASE 5 (20 oct 2026) · EDIFICIOS Y PUESTOS DE LA ALDEA EN EL LENGUAJE OSCURO: molino, iglesia (4 estilos), puesto de mercado, banca, empalizada, portón orco,
// hoguera, estandarte, puestos de oficio (carbón, asador, olla, secadero, cesta de peces, pila de troncos, tablones, estantería, atril), carreta, muros, columnas…
// Módulo hermano de `propsdark3d.js` (mismo colector `B`, misma paleta `PAL`, mismas piezas de ventana/puerta/farol) y de `propsdark_nat3d.js`. Todo por código, sin UV ni assets.
//
// CONTRATO (igual que los otros dos; lo mide `python3 -I tools/r3d/pradera_sheet.py --medir`):
//  · unidades y ejes de ORG: 1 tile = 1 unidad, y arriba, origen = centro de la huella en el suelo, frente/puerta hacia +z. `o.rot` (espejo x↔z) y `o.dir==='y'` funcionan en todos.
//  · HUELLA Y ALTURA dentro de PR_FOOT ±TOL (22 %) de la malla ORG que sustituyen (medida con `tools/r3d/pradera_sheet.py --org`): la colisión `fp` no cambia y no hay que tocar layouts.
//    Excepción documentada: las aspas del molino sobresalen de la huella ORG (ORG no las dibuja: giraban en 2D); caben dentro de ±22 % de todos modos.
//  · aEmit: 1 = ventana/farol que se enciende de noche · 2 = fuego/lava siempre encendido · 4 = brasa de chimenea (casi apagada de día).
//  · VARIANTE POR BIOMA/CULTURA: `o.bk` (0..8; lo inyecta `props3d.js`) elige la paleta y los detalles de los props pequeños (tabla ARQ). La iglesia se elige por `o.style` (los 4 estilos del juego).
//    REGLA PERMANENTE DEL DUEÑO (20 oct 2026): todo prop nuevo se hace para los 9 biomas y por cultura; añadir un bioma = una fila en ARQ, nunca un `if` dentro de un modelo.
//  · DETERMINISTA: todo el azar sale de `hash` con semillas por modelo.
import * as THREE from 'three';
import {B,hash,vary,mix,mul,col,dirty,PAL,windowAt,doorZ,lanternAt,mossPatch,swapXZ,wallOf,roofOf,DK} from './propsdark3d.js';

export const TOL=.22;
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// ───────────────── ayudantes de forma ─────────────────
const polar=(cx,cz,r,y,a)=>[cx+Math.cos(a)*r,y,cz+Math.sin(a)*r];
// banda cónica entre dos aros poligonales (n lados, fase ph): aro A (ra, ya) → aro B (rb, yb). `cf(k)` = color de la cara k. `ctr` orienta las caras hacia fuera.
function band(b,cx,cz,ra,ya,rb,yb,n,ph,cf,ctr,em){for(let k=0;k<n;k++){const a0=ph+k/n*TAU,a1=ph+(k+1)/n*TAU;b.quad(polar(cx,cz,ra,ya,a0),polar(cx,cz,ra,ya,a1),polar(cx,cz,rb,yb,a1),polar(cx,cz,rb,yb,a0),cf(k),em||0,ctr)}}
// cubierta cónica o piramidal en hiladas escalonadas (pizarra, paja, tablilla). r = radio del alero (vértice), apex en y0+h. lip = cuánto sobresale cada hilada; sag = hundimiento (cóncava)
function stepCone(b,cx,y0,cz,r,h,n,ph,rows,c,o={}){const lip=o.lip??.03,v=o.v??.16,sag=o.sag||0,ctr=[cx,y0+h*.4,cz],below=[cx,y0-5,cz];
 for(let s=0;s<rows;s++){const f0=s/rows,f1=(s+1)/rows,rb=r*(1-f0)+(s?lip:0),rt=r*(1-f1),yb=y0+h*f0-(s?0:0),yt=y0+h*f1-sag*Math.sin(f1*Math.PI)*h*.2;
  band(b,cx,cz,rb,yb,rt,yt,n,ph,k=>mul(vary(c,v,b.seed*3+s,k),.84+.24*f1),ctr);
  if(s>0)band(b,cx,cz,r*(1-f0),yb,rb,yb-lip*.35,n,ph,k=>mul(c,.42),below)}   // contrahuella oscura = sombra entre hiladas
 band(b,cx,cz,r,y0-.05,r,y0,n,ph,()=>mul(c,.4),ctr)}   // canto del alero
// losa delgada en el plano XY (A→B, ancho w, grosor t en z, centrada en zc): bastidores y velas de las aspas, tablas…
function slab(b,A,Bp,w,t,zc,c,em){const dx=Bp[0]-A[0],dy=Bp[1]-A[1],L=Math.hypot(dx,dy);if(L<1e-6)return;const px=-dy/L*w/2,py=dx/L*w/2,z0=zc-t/2,z1=zc+t/2,
 V=[[A[0]-px,A[1]-py],[Bp[0]-px,Bp[1]-py],[Bp[0]+px,Bp[1]+py],[A[0]+px,A[1]+py]],ctr=[(A[0]+Bp[0])/2,(A[1]+Bp[1])/2,zc],f=(i,z)=>[V[i][0],V[i][1],z];
 b.quad(f(0,z1),f(1,z1),f(2,z1),f(3,z1),c,em||0,ctr);b.quad(f(0,z0),f(1,z0),f(2,z0),f(3,z0),c,em||0,ctr);
 for(let i=0;i<4;i++){const k=(i+1)%4;b.quad(f(i,z0),f(k,z0),f(k,z1),f(i,z1),c,em||0,ctr)}}
// caja sobre una de las 4 caras de un volumen centrado: F 0:+z 1:-z 2:+x 3:-x · c = distancia del plano al centro · a = posición a lo largo de la cara · dd = salida del centro de la caja respecto al plano
function fbox(b,F,c,a,y0,dd,wa,h,wd,color,o){const d=c+dd;if(F===0)b.box(a,y0,d,wa,h,wd,color,o);else if(F===1)b.box(-a,y0,-d,wa,h,wd,color,o);else if(F===2)b.box(d,y0,a,wd,h,wa,color,o);else b.box(-d,y0,-a,wd,h,wa,color,o)}
// ventana alta apuntada (iglesia): marco de piedra, cristal ámbar (aEmit 1 con probabilidad `lit`), parteluz y cruceta, alféizar y remate
function lancet(b,F,c,a,yc,w,h,sd,lit=.9,fc=PAL.stoneD){const on=hash(sd,a*9,F)<lit?1:0,g=on?PAL.glass:mix(PAL.glass,col('#1c2326'),.97),y0=yc-h/2;
 fbox(b,F,c,a,y0-.03,.025,w+.17,h+.05,.075,fc,{nb:1,v:.1});fbox(b,F,c,a,y0,.065,w,h,.02,g,{nb:1,em:on});
 fbox(b,F,c,a,y0,.085,.026,h,.02,PAL.timber,{nb:1});fbox(b,F,c,a,yc+h*.1,.085,w,.026,.02,PAL.timber,{nb:1});
 fbox(b,F,c,a,y0+h+.02,.025,w+.12,w*.55,.075,fc,{nb:1,t:.12});fbox(b,F,c,a,y0-.06,.06,w+.24,.05,.12,PAL.stone,{nb:1})}
// tronco / poste facetado entre dos puntos cualesquiera (prisma de n lados, radios r0 → r1, tapas opcionales). Troncos de las cabañas, pilotes, mástiles, cabezas de dragón…
function tube(b,p,q,r0,r1,n,c,o={}){const d=new THREE.Vector3(q[0]-p[0],q[1]-p[1],q[2]-p[2]),L=d.length();if(L<1e-6)return;d.normalize();
 const up=Math.abs(d.y)>.95?new THREE.Vector3(1,0,0):new THREE.Vector3(0,1,0),u=new THREE.Vector3().crossVectors(d,up).normalize(),w=new THREE.Vector3().crossVectors(d,u).normalize(),ph=o.ph||0,
 R=(pt,r,k)=>{const a=ph+k/n*TAU,cs=Math.cos(a)*r,sn=Math.sin(a)*r;return[pt[0]+u.x*cs+w.x*sn,pt[1]+u.y*cs+w.y*sn,pt[2]+u.z*cs+w.z*sn]},ctr=[(p[0]+q[0])/2,(p[1]+q[1])/2,(p[2]+q[2])/2],sd=b.seed*11+b.n;
 for(let k=0;k<n;k++){const cl=o.v?vary(c,o.v,sd,k):c;b.quad(R(p,r0,k),R(p,r0,k+1),R(q,r1,k+1),R(q,r1,k),cl,o.em||0,ctr)}
 if(!o.open){for(let k=1;k<n-1;k++){b.tri(R(q,r1,0),R(q,r1,k),R(q,r1,k+1),mul(c,1.05),o.em||0,ctr);if(!o.nb)b.tri(R(p,r0,0),R(p,r0,k),R(p,r0,k+1),mul(c,.8),o.em||0,ctr)}}}
// aspas (molino): 4 brazos en el plano XY a la profundidad zc, hub en (hx,hy), largo L, giro th. Bastidor de madera con peldaños y trozos de lona
function sails(b,hx,hy,zc,L,th,sd){const wood=PAL.timber,wl=PAL.timberL,cv=mix(PAL.hay,col('#cfc4a0'),.45);
 b.box(hx,hy-.08,zc,.17,.16,.13,PAL.timber,{nb:1});
 for(let k=0;k<4;k++){const a=th+k*Math.PI/2,dx=Math.sin(a),dy=Math.cos(a),px=Math.cos(a),py=-Math.sin(a),P=r=>[hx+dx*r,hy+dy*r],Q=(r,s)=>[hx+dx*r+px*s,hy+dy*r+py*s];
  slab(b,P(.06),P(L),.055,.045,zc,wood);   // larguero
  const W=.2,r0=.2,n=5;slab(b,Q(r0,W),Q(L,W),.03,.03,zc,wl);   // larguero exterior del bastidor
  for(let i=0;i<=n;i++){const r=r0+(L-r0)*i/n;slab(b,Q(r,0),Q(r,W),.028,.028,zc,wl)}   // peldaños
  for(let i=0;i<n;i+=2){const r1=r0+(L-r0)*i/n,r2=r0+(L-r0)*(i+1)/n;slab(b,Q(r1+.012,W/2),Q(r2-.012,W/2),W*.9,.014,zc+.012,vary(cv,.12,sd,k*9+i))}}}   // lona en celdas alternas

// ───────────────── paleta de ARQUITECTURA por bioma/cultura (DATOS) ─────────────────
// wood/wood2 = madera principal y clara · stone/stone2 = piedra · cloth/cloth2 = tela de toldos y estandartes (apagada; el único acento) · roof = cubierta · metal = herrajes · bone = hueso · acc = detalle
// 0 Pradera medieval · 1 Bosque (guardianes élficos) · 2 Pantano (tribal) · 3 Cumbres (nórdico) · 4 Oriental (samurái) · 5 Volcán (infernal) · 6 Páramo (arcano) · 7 Desierto · 8 Costa
const ARQ=[
 {id:'pradera', wood:'#4a3828',wood2:'#6a5238',stone:'#6a665c',stone2:'#8a8576',cloth:'#7a2e28',cloth2:'#b8a47a',roof:'#444a52',metal:'#25262a',acc:'#c8a24a'},
 {id:'bosque',  wood:'#4d4330',wood2:'#6e6140',stone:'#5f6355',stone2:'#7f8270',cloth:'#3f5a3a',cloth2:'#c4b98a',roof:'#3d5a2c',metal:'#3a3e34',acc:'#c6d4b2'},
 {id:'pantano', wood:'#2e2a1e',wood2:'#4a4228',stone:'#4f5148',stone2:'#6c6e5d',cloth:'#6a5a3a',cloth2:'#8a7a52',roof:'#5a5030',metal:'#2c2c28',acc:'#8f8a74'},
 {id:'cumbres', wood:'#4a3624',wood2:'#6a5036',stone:'#6b7078',stone2:'#929aa2',cloth:'#2f4a6a',cloth2:'#c8c4b4',roof:'#34302e',metal:'#2c2e34',acc:'#d4dce0'},
 {id:'oriental',wood:'#3a1f1c',wood2:'#5a3228',stone:'#78756c',stone2:'#9a968a',cloth:'#8a2e2a',cloth2:'#d8cdb0',roof:'#3a4048',metal:'#1c1c20',acc:'#b8302a'},
 {id:'volcan',  wood:'#2c2420',wood2:'#44362e',stone:'#3a3638',stone2:'#5c5352',cloth:'#6a2a1a',cloth2:'#4a3a34',roof:'#2a2628',metal:'#1c1a1c',acc:'#ff7a2a'},
 {id:'paramo',  wood:'#3a3248',wood2:'#54486a',stone:'#5f5a78',stone2:'#8a84aa',cloth:'#4a4488',cloth2:'#bcb4e0',roof:'#3c3674',metal:'#2a2838',acc:'#bcd0ff'},
 {id:'desierto',wood:'#6a5438',wood2:'#8a7452',stone:'#a08a64',stone2:'#c4ae84',cloth:'#8a5a3a',cloth2:'#d8c8a0',roof:'#8a7452',metal:'#3a3228',acc:'#c8a850'},
 {id:'costa',   wood:'#5a5046',wood2:'#7a6e5e',stone:'#7a8084',stone2:'#a2a8a8',cloth:'#3a5a6a',cloth2:'#d8d0b8',roof:'#6a5e50',metal:'#2e3236',acc:'#d8d0b8'},
 {id:'cielo',   wood:'#8a7456',wood2:'#a89472',stone:'#cfc8b4',stone2:'#e8e2d0',cloth:'#d8d0b8',cloth2:'#e8cf94',roof:'#b3664b',metal:'#8a8a92',acc:'#e8cf94'},
 {id:'infierno',wood:'#241816',wood2:'#3a2420',stone:'#2c2a2e',stone2:'#4a3a3c',cloth:'#5a1a16',cloth2:'#3a2a2a',roof:'#201c1e',metal:'#141214',acc:'#e8482a'},];   // El Cielo (ISLA-4): mármol, madera de olivo y dorado
const A=o=>{const p=ARQ[clamp((o&&o.bk)|0,0,ARQ.length-1)];if(!p.c){p.c={};['wood','wood2','stone','stone2','cloth','cloth2','roof','metal','acc'].forEach(k=>p.c[k]=col(p[k]))}return p.c};

// ═════════ MODELOS ═════════
const MODELS={
 // MOLINO (≈1,33 × 2,22 × 1,33; fp 14×14 px): torre octogonal de piedra con hiladas, puerta de tablones, ventana con luz, cubierta de paja en escalones y AS PAS de madera con lona (ORG no las traía).
 molino(o){const b=new B(301),n=8,ph=Math.PI/8,R0=.6,R1=.4,y0=.12,H=1.43,TY=y0+H,AP=Math.cos(Math.PI/8),ap=y=>AP*(R0+(R1-R0)*clamp((y-y0)/H,0,1)),
   wall=wallOf(o,mix(PAL.stone,PAL.plaster,.4)),thatch=o&&o.roof?mix(PAL.thatch,dirty(o.roof,.3,.55,.3),.25):PAL.thatch;
  b.box(0,0,0,1.26,y0,1.26,PAL.stoneD,{v:.12,g:.25,jit:.01});
  b.cyl(0,y0,0,R0,R1,H,n,wall,{seg:6,j:.03,v:.1,ph,g:.2});
  for(let i=0;i<7;i++){const f=(i+.5)/7,r=R0+(R1-R0)*f+.02,r2=r*(1+.0),ya=y0+H*i/7+.006;   // hiladas de sillares: bloques de piedra a lo largo de cada una de las 8 caras
   for(let k=0;k<8;k++){const a0=ph+k/8*TAU+(i%2?.12:0),a1=ph+(k+1)/8*TAU+(i%2?.12:0);b.course([Math.cos(a0)*r2,Math.sin(a0)*r2],[Math.cos(a1)*r2,Math.sin(a1)*r2],ya,H/7-.012,.085,wall,{v:.2})}}
  for(let k=0;k<8;k++){const a=ph+(k+.5)/8*TAU,r=.66;b.stone(Math.cos(a)*r,0,Math.sin(a)*r,.26,.14+.06*hash(301,k,1),.22,vary(PAL.stone,.2,301,k),{s:k,j:.16})}   // piedras del pie
  b.cyl(0,TY,0,R1+.05,R1+.05,.07,n,PAL.timber,{ph,v:.1});
  stepCone(b,0,TY+.07,0,R1+.21,.62,n,ph,6,thatch,{lip:.04,v:.2,sag:.2});
  b.cyl(0,TY+.69,0,.03,.012,.12,5,PAL.iron);
  // puerta (cara +z): marco hondo, hoja con tablas y herrajes, dintel y escalón
  const ZD=ap(y0+.4),dx=-.17;b.box(dx,y0,ZD,.5,.76,.26,PAL.timber,{nb:1,v:.08});b.box(dx,y0,ZD+.14,.34,.6,.03,PAL.door,{nb:1,v:.15});
  for(let i=1;i<3;i++)b.box(dx-.17+i*.113,y0,ZD+.16,.01,.6,.008,PAL.plankD,{nb:1});[.18,.46].forEach(f=>b.box(dx,y0+f,ZD+.165,.32,.045,.012,PAL.iron,{nb:1}));
  b.box(dx,y0+.78,ZD,.62,.1,.28,PAL.stoneD,{nb:1,v:.15});b.stone(dx,0,ZD+.2,.56,.07,.2,PAL.stone,{s:5});
  windowAt(b,'z',.28,y0+.9,ap(y0+.9)-.02,.2,.26,3,.95,0);
  lanternAt(b,dx+.36,y0+.58,ZD+.16,.9);
  // aspas: eje, hub y brazos delante de la cara +z (giro de reposo −30°: la punta más baja queda a la derecha de la puerta)
  const hy=TY-.2;b.beam([0,hy,ap(hy)-.05],[0,hy,.7],.09,PAL.timber);sails(b,0,hy,.72,.72,-Math.PI/6,301);
  mossPatch(b,[[-.5,.46,.3,.14],[.2,-.5,.4,.16]],.14);
  return b},
 // IGLESIA (4 estilos, uno por civilización; ORG 2,84 × 3,72 × 1,88): ver `church()` más abajo
 iglesia(o){return CHURCH[(o&&o.style)||'piedra']?CHURCH[(o&&o.style)||'piedra'](o||{}):CHURCH.piedra(o||{})}
};

// ───────────────── IGLESIAS ─────────────────
const CHURCH={
 // PIEDRA (Pradera/Costa/…, medieval): nave de piedra tosca con contrafuertes, tejado de pizarra, campanario en la esquina delantera derecha con aguja de pizarra y cruz de hierro, portón con dintel, vidrieras altas con luz.
 piedra(o){const b=new B(311),W=2.5,D=1.5,H=1.05,Y0=.14,wall=wallOf(o,mix(PAL.stone,PAL.plaster,.28)),roof=roofOf(o,PAL.slate),z0=D/2,x0=W/2;
  b.box(0,0,0,W+.16,Y0,D+.16,PAL.stoneD,{v:.12,g:.25,jit:.01});
  [[-x0-.04,-z0-.04,x0+.04,-z0-.04],[x0+.04,-z0-.04,x0+.04,z0+.04],[x0+.04,z0+.04,-x0-.04,z0+.04],[-x0-.04,z0+.04,-x0-.04,-z0-.04]].forEach(s=>b.course([s[0],s[1]],[s[2],s[3]],0,Y0,.13,PAL.stone,{v:.22}));
  // R3D-PROPS-SUAVES: muros de BLOQUES achaflanados a tresbolillo (`course`) sobre un núcleo, no una caja lisa con juntas pintadas (la «iglesia no se veía smooth»)
  b.box(0,Y0,0,W-.08,H,D-.08,wall,{v:.05,g:.18,t:.995});{const hx=x0-.065,hz=z0-.065;[[-hx,-hz,hx,-hz],[hx,-hz,hx,hz],[hx,hz,-hx,hz],[-hx,hz,-hx,-hz]].forEach(q=>b.course([q[0],q[1]],[q[2],q[3]],Y0,H,.13,wall,{v:.2}))}
  // contrafuertes (fondo y extremo oeste) y cornisa
  [-.85,0,.85].forEach(a=>fbox(b,1,z0,a,0,.1,.2,H*.8,.2,PAL.stone,{t:.62,v:.1,g:.2}));[-.4,.4].forEach(a=>fbox(b,3,x0,a,0,.1,.2,H*.8,.2,PAL.stone,{t:.62,v:.1,g:.2}));
  // frente (+z): portón con jambas y dintel de piedra, dos vidrieras altas y faroles
  const dx=-W/6;b.box(dx,Y0,z0+.03,.74,.94,.1,PAL.stoneD,{nb:1,v:.1});b.box(dx,Y0,z0+.075,.46,.8,.04,PAL.door,{nb:1,v:.12});
  for(let i=1;i<4;i++)b.box(dx-.23+i*.115,Y0,z0+.1,.012,.8,.01,PAL.plankD,{nb:1});[.2,.58].forEach(f=>b.box(dx,Y0+f,z0+.105,.44,.055,.014,PAL.iron,{nb:1}));
  b.box(dx,Y0+.78,z0+.04,.7,.12,.14,PAL.stoneL,{nb:1,v:.12});
  b.stone(dx,0,z0+.2,.7,.07,.3,PAL.stone,{s:5});b.stone(dx,0,z0+.4,.9,.04,.18,PAL.stoneD,{s:6});
  lanternAt(b,dx-.46,Y0+.72,z0+.1,1);lanternAt(b,dx+.46,Y0+.72,z0+.1,1);
  lancet(b,0,z0,-.95,Y0+H*.5,.2,.44,1,.95);lancet(b,0,z0,.02,Y0+H*.5,.2,.44,2,.95);lancet(b,2,x0,-.42,Y0+H*.5,.2,.46,3,.95);
  lancet(b,1,z0,-.7,Y0+H*.5,.2,.44,4,.8);lancet(b,1,z0,.5,Y0+H*.5,.2,.44,5,.8);lancet(b,3,x0,0,Y0+H*.5,.22,.48,6,.9);
  // tejado de pizarra y hastiales
  const gh=Y0+H;b.gable(0,gh,0,W,D,.85,.13,roof,{rows:7,v:.2});[-1,1].forEach(s=>{const x=s*x0;b.tri([x,gh,-z0],[x,gh,z0],[x,gh+.85,0],mix(wall,PAL.timber,.12),0,[x*.9,gh+.25,0])});
  // campanario cuadrado en la esquina delantera derecha, huecos de campana con luz, cornisa y aguja
  const tw=.82,tx=x0-tw/2+.17,tz=z0-tw/2+.17,TH=2.28;b.mode=2;   // (b.mode=2: el campanario atraviesa el tejado a propósito → exento del verificador anti-clipping; se restaura abajo)  la torre sobresale .17 de la nave: así cubre el vuelo (.13) del alero y del hastial del tejado, que antes asomaban por sus caras
  b.box(tx,0,tz,tw+.1,.18,tw+.1,PAL.stoneD,{v:.1,g:.2});b.box(tx,.18,tz,tw-.08,TH-.18,tw-.08,mix(wall,PAL.stone,.2),{v:.05,g:.15,t:.97});{const h=tw/2-.065,tc=mix(wall,PAL.stone,.2);[[-h,-h,h,-h],[h,-h,h,h],[h,h,-h,h],[-h,h,-h,-h]].forEach(q=>b.course([tx+q[0],tz+q[1]],[tx+q[2],tz+q[3]],.18,TH-.18,.13,tc,{v:.2}))}
  for(let F=0;F<4;F++){const c=tw/2;const put=(a,y,dd,wa,h,wd,cl,oo)=>{if(F===0)b.box(tx+a,y,tz+c+dd,wa,h,wd,cl,oo);else if(F===1)b.box(tx-a,y,tz-c-dd,wa,h,wd,cl,oo);else if(F===2)b.box(tx+c+dd,y,tz+a,wd,h,wa,cl,oo);else b.box(tx-c-dd,y,tz-a,wd,h,wa,cl,oo)};
   const by=1.62;put(0,by-.04,.02,.34,.64,.08,PAL.stoneD,{nb:1,v:.08});put(0,by,.06,.24,.54,.03,col('#14110e'),{nb:1});put(0,by+.34,.06,.24,.2,.03,col('#14110e'),{nb:1,t:.2});
   put(0,by+.06,.075,.14,.1,.02,PAL.glass,{nb:1,em:1});put(0,by+.54,0,.4,.06,.12,PAL.stone,{nb:1});[0,1,2,3].forEach(i=>put(-.09+i*.06,by,.085,.016,.44,.012,PAL.timber,{nb:1}));   // louvres + campana con luz tenue
   for(let i=0;i<2;i++)put(0,.7+i*.5,.04,.1,.3,.05,col('#14110e'),{nb:1});}   // saeteras
  b.box(tx,TH,tz,tw+.2,.07,tw+.2,PAL.stoneD,{v:.1});b.box(tx,TH+.07,tz,tw+.08,.05,tw+.08,PAL.stone,{nb:1});
  stepCone(b,tx,TH+.12,tz,(tw/2+.1)*Math.SQRT2,1.02,4,Math.PI/4,9,roof,{lip:.025,v:.18});
  b.beam([tx,TH+1.1,tz],[tx,TH+1.5,tz],.035,PAL.iron);b.beam([tx-.1,TH+1.37,tz],[tx+.1,TH+1.37,tz],.03,PAL.iron);
  b.box(tx,TH+.07+.02,tz,.2,.1,.2,PAL.iron,{t:.5,nb:1});b.mode=0;
  mossPatch(b,[[-.9,z0+.06,.4,.16],[.1,z0+.06,.3,.14],[-x0-.04,-.2,.1,.4]],.19);
  return b}
};
// TRONCOS (Bosque, ermita de los guardianes): cabaña de troncos entrelazados en las esquinas, cubierta de musgo y hojas, campanario abierto de madera con luz verdosa, raíces en el pie.
CHURCH.troncos=o=>{const b=new B(321),W=2.5,D=1.5,Y0=.1,r=.085,rows=6,pit=r*1.86,H=rows*pit,z0=D/2,x0=W/2,wc=dirty(o.wall||'#a8784a',.38,.5,.2),roof=dirty(o.roof||'#5f8a46',.3,.4,.2),dark=mul(wc,.55),LG=col('#d2e0a0');
 b.box(0,0,0,W+.14,Y0,D+.14,PAL.stoneD,{v:.12,g:.25,jit:.01});b.box(0,Y0,0,W-.08,H,D-.08,dark,{nb:1});
 for(let i=0;i<rows;i++){const y=Y0+r+i*pit,ex=i%2?0:.2,ez=i%2?.2:0;[-1,1].forEach((sg,k)=>{tube(b,[-x0-ex,y,sg*z0],[x0+ex,y,sg*z0],r,r,6,vary(wc,.14,321,i*4+k),{v:.1});tube(b,[sg*x0,y,-z0-ez],[sg*x0,y,z0+ez],r,r,6,vary(wc,.14,321,i*4+k+2),{v:.1})})}
 const zf=z0+r,dx=-W/6;   // puerta de tablones con marco grueso y farol verdoso
 b.box(dx,Y0,zf-.02,.64,.9,.1,PAL.timber,{nb:1});b.box(dx,Y0,zf+.03,.44,.78,.04,PAL.door,{nb:1,v:.12});for(let i=1;i<4;i++)b.box(dx-.22+i*.11,Y0,zf+.055,.01,.78,.01,PAL.plankD,{nb:1});[.2,.56].forEach(f=>b.box(dx,Y0+f,zf+.06,.42,.05,.012,PAL.iron,{nb:1}));
 b.stone(dx,0,zf+.2,.7,.07,.3,PAL.stone,{s:5});lanternAt(b,dx+.44,Y0+.62,zf+.06,1);
 lancet(b,0,zf,-.95,Y0+H*.52,.2,.4,1,.95,PAL.timber);lancet(b,0,zf,.02,Y0+H*.52,.2,.4,2,.95,PAL.timber);lancet(b,2,x0+r,-.42,Y0+H*.52,.2,.42,3,.95,PAL.timber);lancet(b,1,z0+r,.3,Y0+H*.52,.2,.4,4,.8,PAL.timber);
 const gh=Y0+H,GH=.8;b.gable(0,gh,0,W+.1,D+.1,GH,.2,roof,{rows:6,v:.24,sag:0});
 [-1,1].forEach(s=>{const x=s*(x0+.02);b.tri([x,gh,-z0],[x,gh,z0],[x,gh+GH*.92,0],mix(wc,PAL.timber,.3),0,[x*.9,gh+.2,0])});
 // campanario: base de troncos y cuerpo abierto de 4 postes con campana de bronce y luz verdosa
 const tw=.76,tx=x0-tw/2+.03,tz=z0-tw/2+.03,TB=Y0+8*pit,TH=2.3;
 for(let i=0;i<8;i++){const y=Y0+r+i*pit,ex=i%2?0:.12,ez=i%2?.12:0;[-1,1].forEach((sg,k)=>{tube(b,[tx-tw/2-ex,y,tz+sg*tw/2],[tx+tw/2+ex,y,tz+sg*tw/2],r*.9,r*.9,6,vary(wc,.14,322,i*4+k),{v:.1});tube(b,[tx+sg*tw/2,y,tz-tw/2-ez],[tx+sg*tw/2,y,tz+tw/2+ez],r*.9,r*.9,6,vary(wc,.14,322,i*4+k+2),{v:.1})})}
 b.box(tx,Y0,tz,tw-.1,TB-Y0,tw-.1,dark,{nb:1});[[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([sx,sz])=>tube(b,[tx+sx*tw/2,TB,tz+sz*tw/2],[tx+sx*tw/2,TH,tz+sz*tw/2],.045,.04,6,PAL.timberL,{v:.1}));
 [TB+.02,TH-.08].forEach(y=>b.box(tx,y,tz,tw+.04,.07,tw+.04,PAL.timber,{nb:1}));
 b.cyl(tx,TB+.3,tz,.04,.04,.1,6,PAL.iron);b.cyl(tx,TB+.12,tz,.14,.06,.2,8,mix(col('#7a5a30'),PAL.iron,.3),{seg:2});b.box(tx,TB+.5,tz,.1,.12,.1,LG,{em:1,nb:1});lancet(b,0,tw/2+tz,tx,Y0+.62,.14,.3,7,.9,PAL.timber);b.cyl(tx,TB+.02,tz,.01,.01,.001,4,PAL.iron);
 stepCone(b,tx,TH,tz,(tw/2+.12)*Math.SQRT2,.64,4,Math.PI/4,7,roof,{lip:.035,v:.22,sag:.25});b.beam([tx,TH+.6,tz],[tx,TH+.95,tz],.035,PAL.timberL);b.box(tx,TH+.9,tz,.08,.1,.08,LG,{em:1,nb:1,t:.5});
 [[1,1],[-1,1],[1,-1],[-1,-1]].forEach(([sx,sz],k)=>{if(sx>0&&sz>0)return;tube(b,[sx*(x0+.05),.0,sz*(z0+.05)],[sx*(x0+.35),0,sz*(z0+.22)],.06,.025,5,PAL.timber,{v:.1,nb:1});tube(b,[sx*(x0+.02),.22,sz*(z0+.02)],[sx*(x0+.22),0,sz*(z0+.14)],.05,.025,5,PAL.timberL,{nb:1})});   // raíces
 mossPatch(b,[[-.9,z0+.2,.4,.2],[.3,z0+.2,.34,.16]],Y0);return b};
// PALAFITO (Pantano, capilla tribal sobre pilotes): plataforma de tablones, muros de cañas y barro, cubierta de paja larga con flecos, escalera al suelo, torre de vigía con cráneos y luz de fuego fatuo.
CHURCH.palafito=o=>{const b=new B(331),W=2.5,D=1.5,Z=.62,H=1.0,z0=D/2,x0=W/2,wc=dirty(o.wall||'#b8996a',.35,.5,.25),th=mix(PAL.thatch,PAL.thatchD,.45),GL=col('#b6d0c4'),bone=col('#7a7260');
 for(const ax of[-1,0,1])for(const az of[-1,1])tube(b,[ax*(x0-.2),0,az*(z0-.1)],[ax*(x0-.2),Z,az*(z0-.1)],.075,.065,6,vary(PAL.timber,.15,331,ax*3+az),{v:.1,nb:1});   // pilotes
 b.box(0,Z,0,W+.3,.08,D+.3,PAL.plank,{v:.12,nb:1});for(let i=0;i<12;i++)b.box(-W/2-.1+i*(W+.2)/11,Z+.075,0,.2,.012,D+.3,vary(PAL.plankD,.2,331,i),{nb:1});
 [-1,1].forEach(sg=>{b.box(0,Z+.08,sg*(z0+.1),W+.3,.18,.04,PAL.timber,{nb:1});[-1,0,1].forEach(a=>tube(b,[a*(x0+.05),Z+.08,sg*(z0+.1)],[a*(x0+.05),Z+.4,sg*(z0+.1)],.03,.03,5,PAL.timber,{nb:1}))});
 const Y0=Z+.08;b.box(0,Y0,0,W,H,D,wc,{v:.06,g:.15,t:.99});for(let i=1;i<10;i++){fbox(b,0,z0,0,Y0+H*i/10,.004,W-.02,.012,.01,PAL.thatchD,{nb:1});fbox(b,2,x0,0,Y0+H*i/10,.004,D-.02,.012,.01,PAL.thatchD,{nb:1})}
 for(let i=0;i<=10;i++)[-1,1].forEach(sg=>b.box(-x0+i*W/10,Y0,sg*(z0+.005),.04,H,.025,PAL.timber,{nb:1}));
 const dx=-W/6;b.box(dx,Y0,z0+.03,.62,.82,.08,PAL.timber,{nb:1});b.box(dx,Y0,z0+.07,.44,.72,.03,PAL.door,{nb:1,v:.12});lanternAt(b,dx+.4,Y0+.6,z0+.1,1);
 lancet(b,0,z0,-.95,Y0+H*.55,.2,.38,1,.95,PAL.timber);lancet(b,0,z0,.02,Y0+H*.55,.2,.38,2,.95,PAL.timber);lancet(b,2,x0,-.42,Y0+H*.55,.2,.38,3,.95,PAL.timber);
 for(let i=0;i<5;i++){const z=z0+.18+i*.2;b.box(dx,Z-i*.13-.02,z,.7,.05,.22,vary(PAL.plank,.15,331,i),{nb:1});[-1,1].forEach(sg=>tube(b,[dx+sg*.34,Z-i*.13,z],[dx+sg*.34,Z-i*.13-.13,z+.1],.025,.025,4,PAL.timber,{nb:1}))}   // escalera
 const gh=Y0+H;   // cubierta de paja larga: dos faldones gruesos con flecos y caballete de haces
 b.gable(0,gh,0,W+.1,D+.1,.8,.26,th,{rows:6,v:.2,ledge:.03,sag:0});[-1,1].forEach(s=>{const x=s*(x0+.02);b.tri([x,gh,-z0],[x,gh,z0],[x,gh+.74,0],mix(wc,PAL.timber,.3),0,[x*.9,gh+.2,0])});
 {const hd=D/2+.26+.05,ye=gh-.8*(hd-z0)/z0;for(const sg of[-1,1])for(let i=0;i<20;i++){const x=-x0-.24+i*(W+.5)/20,dl=.1+hash(331,i,sg)*.14;b.tri([x,ye+.02,sg*hd],[x+(W+.5)/20,ye+.02,sg*hd],[x+(W+.5)/40,ye-dl,sg*(hd+.02)],mul(PAL.thatchD,.75+hash(331,i,2)*.3),0,[0,gh+.3,0])}}
 b.box(0,gh+.78,0,W+.5,.1,.22,PAL.thatchD,{v:.2,t:.8});
 // torre de vigía: 4 postes con riostras, plataforma, caseta de cañas con cubierta de paja cónica, cráneos y luz de fuego fatuo
 const tw=.7,tx=x0-tw/2+.03,tz=z0-tw/2+.03,TP=Z+.08+2.15,TT=TP+.55;
 [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([sx,sz],k)=>{tube(b,[tx+sx*tw/2,Z+.08,tz+sz*tw/2],[tx+sx*tw/2,TP,tz+sz*tw/2],.05,.04,5,vary(PAL.timber,.15,332,k),{v:.1,nb:1})});
 [.7,1.4].forEach((h,i)=>{[0,1,2,3].forEach(k=>{const a=[[1,1],[1,-1],[-1,-1],[-1,1]][k],c=[[1,-1],[-1,-1],[-1,1],[1,1]][k];tube(b,[tx+a[0]*tw/2,Z+.08+h,tz+a[1]*tw/2],[tx+c[0]*tw/2,Z+.08+h,tz+c[1]*tw/2],.025,.025,4,PAL.timberL,{nb:1})})});
 b.box(tx,TP,tz,tw+.3,.07,tw+.3,PAL.plank,{v:.12});b.box(tx,TP+.07,tz,tw*.8,.5,tw*.8,wc,{v:.06,g:.15});
 b.box(tx,TP+.2,tz+tw*.4+.01,.2,.2,.02,GL,{em:1,nb:1});b.box(tx+tw*.4+.01,TP+.2,tz,.02,.2,.2,GL,{em:1,nb:1});   // luz de fuego fatuo
 stepCone(b,tx,TT+.07,tz,(tw*.4+.22)*Math.SQRT2,.7,6,0,6,th,{lip:.04,v:.2});tube(b,[tx,TT+.7,tz],[tx,TT+1.05,tz],.025,.02,4,PAL.timber,{nb:1});b.box(tx,TT+1.0,tz,.14,.12,.12,bone,{v:.1,t:.7});   // cráneo en la punta
 [[1,1],[-1,1],[1,-1],[-1,-1]].forEach(([sx,sz],k)=>b.box(tx+sx*(tw/2+.15),TP-.18,tz+sz*(tw/2+.15),.1,.1,.09,bone,{v:.1,t:.75}));   // cráneos colgados de la plataforma
 for(let k=0;k<3;k++)b.box(-x0+.3+k*.1,gh+.82,0,.03,.14,.03,bone,{nb:1});
 return b};
// STAVE (Cumbres, iglesia de madera nórdica): tres cuerpos escalonados de tablones con tejados superpuestos de tablilla oscura, cabezas de dragón en las cumbreras, flecha con punta de hierro y nieve en los caballetes.
CHURCH.stave=o=>{const b=new B(341),W=2.5,D=1.5,Y0=.12,H=1.0,z0=D/2,x0=W/2,wood=dirty(o.wall||'#5a3e28',.35,.62,.2),roof=dirty(o.roof||'#3a3330',.3,.8,.1),snow=col('#bfc4c4'),DR=col('#1e1610'),red=col('#7a2a1a');
 b.box(0,0,0,W+.14,Y0,D+.14,PAL.stoneD,{v:.12,g:.25,jit:.01});b.box(0,Y0,0,W,H,D,mul(wood,.6),{nb:1});
 const planks=(cx,cz,w,d,y0,h,sd)=>{const pk=.11;for(let i=0;i<Math.round(w/pk);i++){const x=cx-w/2+pk*(i+.5),hh=h*(.97+hash(sd,i,1)*.05);b.box(x,y0,cz+d/2+.005,pk*.94,hh,.035,vary(wood,.18,sd,i),{nb:1,t:.97});b.box(x,y0,cz-d/2-.005,pk*.94,hh,.035,vary(wood,.18,sd+1,i),{nb:1})}
  for(let i=0;i<Math.round(d/pk);i++){const z=cz-d/2+pk*(i+.5),hh=h*(.97+hash(sd,i,3)*.05);b.box(cx+w/2+.005,y0,z,.035,hh,pk*.94,vary(wood,.18,sd+2,i),{nb:1,t:.97});b.box(cx-w/2-.005,y0,z,.035,hh,pk*.94,vary(wood,.18,sd+3,i),{nb:1})}};
 planks(0,0,W,D,Y0,H,341);
 [.18,.9].forEach(f=>{b.box(0,Y0+H*f,z0+.03,W+.07,.07,.05,PAL.timber,{nb:1});b.box(x0+.03,Y0+H*f,0,.05,.07,D+.07,PAL.timber,{nb:1})});[-1,1].forEach(sg=>tube(b,[sg*(x0+.02),Y0,z0+.03],[sg*(x0+.02),Y0+H,z0+.03],.05,.05,5,PAL.timber,{nb:1}));
 const dx=-W/6;b.box(dx,Y0,z0+.03,.7,.92,.1,PAL.timber,{nb:1});b.box(dx,Y0,z0+.075,.46,.8,.04,PAL.door,{nb:1,v:.12});b.box(dx,Y0+.8,z0+.06,.62,.1,.06,red,{nb:1});[-1,1].forEach(sg=>b.box(dx+sg*.3,Y0,z0+.06,.05,.84,.07,red,{nb:1}));
 [.2,.58].forEach(f=>b.box(dx,Y0+f,z0+.1,.44,.05,.012,PAL.iron,{nb:1}));b.stone(dx,0,z0+.2,.7,.07,.3,PAL.stone,{s:5});lanternAt(b,dx+.46,Y0+.66,z0+.1,1);lanternAt(b,dx-.46,Y0+.66,z0+.1,1);
 lancet(b,0,z0,-.95,Y0+H*.55,.16,.34,1,.95,PAL.timber);lancet(b,0,z0,.1,Y0+H*.55,.16,.34,2,.95,PAL.timber);lancet(b,2,x0,-.3,Y0+H*.55,.16,.34,3,.95,PAL.timber);lancet(b,2,x0,.3,Y0+H*.55,.16,.34,4,.9,PAL.timber);
 const g1=Y0+H,g1h=.4;b.gable(0,g1,0,W,D,g1h,.22,roof,{rows:5,v:.18,ledge:.03});[-1,1].forEach(s=>b.tri([s*x0,g1,-z0],[s*x0,g1,z0],[s*x0,g1+g1h*.9,0],mul(wood,.7),0,[s*x0*.9,g1+.1,0]));
 const t2w=1.64,t2d=1.0,t2y=g1+.16,t2h=.78,t2x=-.12;b.box(t2x,t2y,0,t2w,t2h,t2d,mul(wood,.6),{nb:1,t:.99});planks(t2x,0,t2w,t2d,t2y,t2h,342);
 lancet(b,0,t2d/2,t2x-.3,t2y+t2h*.55,.14,.3,5,.95,PAL.timber);lancet(b,0,t2d/2,t2x+.35,t2y+t2h*.55,.14,.3,6,.95,PAL.timber);lancet(b,2,t2x+t2w/2,0,t2y+t2h*.55,.14,.3,7,.9,PAL.timber);
 const g2=t2y+t2h,g2h=.44;b.gable(t2x,g2,0,t2w,t2d,g2h,.16,roof,{rows:4,v:.18,ledge:.025});[-1,1].forEach(s=>b.tri([t2x+s*t2w/2,g2,-t2d/2],[t2x+s*t2w/2,g2,t2d/2],[t2x+s*t2w/2,g2+g2h*.9,0],mul(wood,.7),0,[t2x+s*t2w/2*.9,g2+.1,0]));
 const t3w=.88,t3d=.64,t3y=g2+.12,t3h=.5;b.box(t2x,t3y,0,t3w,t3h,t3d,mul(wood,.6),{nb:1,t:.99});planks(t2x,0,t3w,t3d,t3y,t3h,343);lancet(b,0,t3d/2,t2x,t3y+t3h*.5,.14,.26,8,1,PAL.timber);lancet(b,2,t2x+t3w/2,0,t3y+t3h*.5,.14,.26,9,1,PAL.timber);
 const g3=t3y+t3h,g3h=.5;b.gable(t2x,g3,0,t3w,t3d,g3h,.12,roof,{rows:3,v:.18,ledge:.02});[-1,1].forEach(s=>b.tri([t2x+s*t3w/2,g3,-t3d/2],[t2x+s*t3w/2,g3,t3d/2],[t2x+s*t3w/2,g3+g3h*.9,0],mul(wood,.7),0,[t2x+s*t3w/2*.9,g3+.1,0]));
 stepCone(b,t2x,g3+g3h,0,.1*Math.SQRT2,.0,4,Math.PI/4,1,roof,{});tube(b,[t2x,g3+g3h-.02,0],[t2x,g3+g3h+.42,0],.04,.012,5,PAL.iron,{nb:1});b.box(t2x,g3+g3h+.38,0,.14,.04,.04,PAL.iron,{nb:1});
 // cabezas de dragón en los extremos de las cumbreras (curvas hacia arriba) y nieve en los caballetes
 const drag=(x,y,sg,sc)=>{tube(b,[x,y,0],[x+sg*.2*sc,y+.04*sc,0],.045*sc,.04*sc,5,DR,{nb:1});tube(b,[x+sg*.2*sc,y+.04*sc,0],[x+sg*.34*sc,y+.2*sc,0],.04*sc,.03*sc,5,DR,{nb:1});tube(b,[x+sg*.34*sc,y+.2*sc,0],[x+sg*.46*sc,y+.26*sc,0],.035*sc,.012*sc,5,DR);b.box(x+sg*.3*sc,y+.16*sc,0,.05*sc,.06*sc,.1*sc,DR,{nb:1})};
 [-1,1].forEach(sg=>{drag(sg*(x0+.2),g1+g1h-.02,sg,1.05);drag(t2x+sg*(t2w/2+.16),g2+g2h-.02,sg,.85);drag(t2x+sg*(t3w/2+.12),g3+g3h-.02,sg,.7)});
 mossPatch(b,[[-.9,z0+.06,.4,.14]],Y0-.0);return b};


// ═════════ PROPS PEQUEÑOS POR BIOMA/CULTURA ═════════ (cada uno lee su fila de ARQ vía `A(o)`; `o.bk` lo pone props3d.js)
const stk=(b,x,z,h,r,c,sd)=>{tube(b,[x,0,z],[x,h,z],r,r*.85,5,c,{v:.1,nb:1});tube(b,[x,h,z],[x,h+r*2.4,z],r*.85,.008,5,mul(c,1.1),{nb:1})};   // estaca con punta
const lump=(b,x,y,z,w,h,d,c,sd)=>b.stone(x,y,z,w,h,d,c,{s:sd,j:.22});
Object.assign(MODELS,{
 // PUESTO DE MERCADO (≈0,93 × 0,75 × 0,63; fp 20×12): 4 postes, mostrador, toldo de tela a dos aguas en tiras (colores del bioma, apagados) o cubierta propia de la cultura, mercancías y caja.
 puesto(o){const b=new B(401),a=A(o),k=(o.bk|0),c1=o.col?dirty(o.col,.4,.62,.15):a.cloth,c2=o.col2?dirty(o.col2,.35,.8,.15):a.cloth2,g1=dirty(o.g1||'#d9553a',.4,.7,.15),g2=dirty(o.g2||'#e0b83a',.4,.7,.15);
  [[-.4,-.22],[.4,-.22],[-.4,.24],[.4,.24]].forEach(([x,z],i)=>tube(b,[x,0,z],[x,.66+(z<0?.04:0),z],.035,.03,5,vary(a.wood,.12,401,i),{v:.1,nb:1}));
  b.box(0,0,.2,.78,.26,.3,mul(a.wood,.8),{v:.1,g:.2});b.box(0,.26,.2,.86,.04,.36,a.wood2,{v:.1});
  if(k===2||k===7||k===8){const th=k===2?mix(PAL.thatch,PAL.thatchD,.4):k===8?mix(c1,c2,.5):mix(c1,c2,.4);b.gable(0,.68,0,.8,.5,.14,.06,th,{rows:3,v:.18,ledge:.02})}
  else{const n=6;for(let i=0;i<n;i++)b.gable(-.4+.8/n*(i+.5),.7,0,.8/n,.58,.12,0,i%2?c2:c1,{rows:1,ridge:0,v:.04,led:0});for(let i=0;i<7;i++)b.box(-.4+i*.133,.62,.34,.1,.07,.012,i%2?c1:c2,{nb:1,t:.8})}   // faldón de tela
  [[-.22,g1],[.1,g2]].forEach(([x,c],i)=>lump(b,x,.3,.2,.2,.14,.16,c,i));b.box(.3,.3,.2,.16,.14,.16,a.wood2,{v:.15});mossPatch(b,[[-.3,.34,.2,.1]],.01);return b},
 // BANCA (≈0,86 × 0,29 × 0,24; `len` px): asiento sobre dos patas; material de la cultura (tablón, tronco, hueso, piedra…).
 banca(o){const b=new B(411),a=A(o),k=(o.bk|0),L=(o.len||20)*.043,leg=[0,3,5,6,7].includes(k)?a.stone:a.wood2,seat=[5,6,7].includes(k)?a.stone:a.wood;
  [-1,1].forEach(sg=>b.stone(sg*L*.38,0,0,.09,.2,.2,leg,{s:sg,j:.12}));b.box(0,.2,0,L,.06,.22,seat,{v:.14,jit:.01});
  if(k===1){b.box(0,.2,0,L+.02,.07,.2,mix(seat,col('#3f5a2c'),.25),{nb:1,t:.9})}if(k===4)b.box(0,.26,0,L,.015,.2,a.acc,{nb:1,t:.97});if(o.back)b.box(0,.26,-.1,L,.18,.04,mul(seat,.85),{v:.1});return b},
 // EMPALIZADA (≈0,16 × 1,06 × 1,82 a lo largo de z; `l` px): estacas con punta atadas con dos travesaños.
 empalizada(o){const b=new B(421),a=A(o),L=(o.l||48)*1.82/48,n=Math.max(3,Math.round((o.l||48)/6));
  [.22,.52].forEach(y=>b.box(0,y,0,.06,.06,L,mul(a.wood,.8),{nb:1}));
  for(let i=0;i<n;i++){const z=-L/2+.09+i*(L-.18)/(n-1);stk(b,0,z,.5+hash(421,i,1)*.18+(i%3)*.06,.065,vary(i%2?a.wood:a.wood2,.12,421,i),i)}
  if((o.bk|0)===5)for(let i=1;i<n;i+=3)b.box(0,.62+(i%3)*.06,-L/2+.09+i*(L-.18)/(n-1)+.0,.14,.1,.11,col('#8a8076'),{t:.7,nb:1});return b},
 // PORTÓN ORCO (≈0,72 × 2,08 × 1,58; `side` ±1 = hacia dónde sale el brazo): torre de troncos con techo de pieles y pinchos, brazo con tres lanzas colgantes y cráneo.
 portonOrco(o){const b=new B(431),a=A(o),sg=o.side||1,wd=mul(a.wood2,.8),tw=.5;
  b.box(0,0,0,tw+.04,1.58,tw+.04,wd,{v:.1,g:.2,t:.97});for(let i=0;i<5;i++)b.box(0,.12+i*.32,0,tw+.12,.06,tw+.12,a.wood,{nb:1});
  b.box(0,1.56,0,.74,.1,.74,a.wood);stepCone(b,0,1.66,0,.5,.42,4,Math.PI/4,5,mix(a.roof,col('#4a5a38'),.5),{lip:.03,v:.2});
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([x,z])=>tube(b,[x*.3,1.66,z*.3],[x*.3,2.02,z*.3],.03,.01,4,col('#8a8f98'),{nb:1}));
  b.box(0,1.2,-sg*.6,.16,.14,1.2,wd,{v:.12});b.box(0,1.34,-sg*.6,.18,.04,1.22,a.wood,{nb:1});
  for(let i=0;i<3;i++)tube(b,[0,1.2,-sg*(.35+i*.28)],[0,.84,-sg*(.35+i*.28)],.04,.008,4,col('#8a8f98'),{nb:1});
  b.box(0,.95,.27,.14,.14,.1,col('#a89f88'),{t:.8});stk(b,0,-sg*1.1,.5,.06,a.wood,3);return b},
 // HOGUERA (≈0,86 × 0,15 × 0,84): anillo de piedras, ceniza, leños cruzados y brasas (aEmit 2). La llama y la luz son partículas/luces del juego.
 hoguera(o){const b=new B(441),a=A(o);for(let k=0;k<7;k++){const an=k*TAU/7;lump(b,Math.cos(an)*.37,0,Math.sin(an)*.37,.2+hash(441,k,1)*.06,.13,.17,k%2?mul(a.stone,.8):mul(a.stone,.62),k)}
  b.box(0,0,0,.44,.03,.44,col('#2a2422'),{nb:1,t:.7,jit:.03});tube(b,[-.28,.06,-.05],[.22,.1,.05],.045,.04,5,a.wood,{v:.1});tube(b,[.05,.06,-.28],[-.04,.1,.24],.045,.04,5,a.wood2,{v:.1});
  b.box(0,.02,0,.2,.04,.2,col('#ff7a2a'),{em:2,nb:1,t:.6});return b},
 // ESTANDARTE (≈0,15 × 1,75 × 0,53): asta con travesaño y paño apagado del color de la cultura; remate de metal/hueso.
 estandarte(o){const b=new B(451),a=A(o),c=o.col?dirty(o.col,.42,.6,.15):a.cloth,mk=o.mark?dirty(o.mark,.3,.8,.2):a.cloth2;
  tube(b,[0,0,0],[0,1.6,0],.04,.03,5,a.wood,{v:.1,nb:1});b.box(0,1.46,-.2,.03,.05,.4,a.wood2,{nb:1});b.box(0,.86,-.2,.022,.6,.34,c,{v:.1,nb:1});
  for(let i=0;i<4;i++)b.tri([-.011,.86,-.37+i*.085],[-.011,.86,-.29+i*.085],[-.011,.78,-.33+i*.085],mul(c,.8),0,[.5,.9,-.33+i*.085]);
  b.box(0,1.12,-.2,.026,.14,.12,mk,{nb:1});b.box(0,1.6,0,.08,.1,.08,a.acc,{t:.5});return b},
 // OFICIOS ──────────────
 carbon(o){const b=new B(461),a=A(o);[[0,0,.55,.4,.34,'#2e2a28'],[-.37,.12,.34,.26,.2,'#3a3430'],[.34,.12,.34,.26,.2,'#241f1e'],[.1,-.26,.32,.24,.18,'#3a3430']].forEach(([x,z,w,d,h,c],i)=>lump(b,x,0,z,w,h,d,col(c),i));
  b.box(.04,.3,.03,.18,.02,.12,col('#c8501a'),{em:2,nb:1});return b},
 asador(o){const b=new B(471),a=A(o);[-1,1].forEach(sg=>tube(b,[sg*.5,0,0],[sg*.5,.58,0],.03,.025,5,a.wood,{v:.1,nb:1}));tube(b,[-.55,.52,0],[.58,.52,0],.015,.015,5,a.metal,{nb:1});
  lump(b,0,.44,0,.4,.16,.14,dirty('#b0583a',.5,.7,.2),2);b.box(0,0,0,.5,.03,.18,col('#3a2a22'),{nb:1});b.box(0,.03,0,.36,.02,.1,col('#ff7a2a'),{em:2,nb:1});tube(b,[.52,.52,0],[.52,.52,.14],.012,.012,4,a.metal,{nb:1});return b},
 olla(o){const b=new B(481),a=A(o);[[-.17,-.12],[.17,-.12],[0,.19]].forEach(([x,z],i)=>tube(b,[x,0,z],[x*.4,.62,z*.4],.025,.018,5,a.wood,{nb:1}));
  b.cyl(0,.12,0,.2,.2,.0,8,col('#2a2422'),{});b.cyl(0,.16,0,.22,.26,.2,8,mix(a.metal,col('#3a3430'),.5),{seg:2,bulge:.03,v:.1});b.cyl(0,.35,0,.22,.22,.02,8,dirty('#c8742a',.5,.5,.3),{nb:1});b.box(0,.04,0,.2,.02,.2,col('#ff7a2a'),{em:2,nb:1});return b},
 secadero(o){const b=new B(491),a=A(o);[-1,1].forEach(sg=>tube(b,[sg*.5,0,0],[sg*.5,.8,0],.035,.03,5,a.wood,{v:.1,nb:1}));b.box(0,.74,0,1.04,.04,.05,a.wood2,{nb:1});
  for(let i=0;i<4;i++)b.box(-.37+i*.25,.4,0,.07,.34,.025,i%2?col('#6a8a9a'):col('#8aa4b0'),{nb:1,t:.7});return b},
 cestaPeces(o){const b=new B(501),a=A(o);b.cyl(0,0,0,.22,.2,.2,8,mix(a.wood2,col('#8a6a3a'),.4),{seg:2,v:.15,j:.04});b.cyl(0,.2,0,.21,.19,.02,8,a.wood,{nb:1});
  [[-.08,0],[.08,.04],[0,-.08]].forEach(([x,z],i)=>b.box(x,.2,z,.16,.07,.05,i%2?col('#6a8a9a'):col('#8aa4b0'),{my:i,t:.8,nb:1}));return b},
 pilaTroncos(o){const b=new B(511),a=A(o),R=[[-.18,.09],[0,.09],[.18,.09],[-.09,.25],[.09,.25],[0,.41]];R.forEach(([z,y],i)=>{tube(b,[-.4,y,z*1.0],[.42,y,z*1.0],.085,.085,6,vary(i%2?a.wood:a.wood2,.12,511,i),{v:.1});b.box(.425,y-.06,z,.01,.12,.12,mix(a.wood2,col('#d2b080'),.4),{nb:1})});return b},
 tablones(o){const b=new B(521),a=A(o);for(let i=0;i<4;i++)b.box((i%2)*.05-.025,i*.065,0,.86-(i%2)*.06,.065,.34,vary(i%2?a.wood2:a.wood,.12,521,i),{v:.1,jit:.01});b.box(.17,0,0,.05,.3,.36,mul(a.wood,.8),{nb:1});return b},
 estanteria(o){const b=new B(531),a=A(o);b.box(0,0,0,.96,1.1,.28,mul(a.wood,.9),{v:.08,g:.1});[0,1,2].forEach(r=>{b.box(0,.1+r*.32,.11,.86,.24,.07,col('#1a1410'),{nb:1});for(let k=0;k<7;k++)b.box(-.36+k*.12,.1+r*.32,.14,.09,.18+(k%3)*.03,.07,k%2?dirty(['#6a3a30','#3a4a50','#6a5c36','#4a4258'][k%4],.5,.6,.15):mul(a.cloth,.62),{nb:1,v:.1})});b.box(0,1.1,0,1,.05,.32,a.wood2);return b},
 atril(o){const b=new B(541),a=A(o);b.box(0,0,0,.2,.52,.2,a.wood,{v:.1,t:.7,g:.2});b.box(0,.52,0,.5,.07,.34,a.wood2,{v:.1});b.box(0,.59,0,.44,.03,.28,a.cloth,{nb:1});b.box(0,.62,0,.38,.02,.22,col('#cfc8b0'),{nb:1,v:.05});return b},
 carreta(o){const b=new B(551),a=A(o);b.box(-.02,.17,0,.7,.1,.5,a.wood,{v:.1,jit:.01});b.box(-.02,.27,-.24,.7,.16,.03,a.wood2,{nb:1});b.box(-.02,.27,.24,.7,.16,.03,a.wood2,{nb:1});b.box(-.35,.27,0,.03,.16,.5,a.wood2,{nb:1});
  [-1,1].forEach(sg=>{tube(b,[-.02,.17,sg*.3],[-.02,.17,sg*.36],.17,.17,8,mul(a.wood,.8),{nb:1});tube(b,[-.02,.17,sg*.3],[-.02,.17,sg*.38],.035,.035,4,a.metal,{nb:1});tube(b,[-.02,.17,sg*.26],[-.02,.17,sg*.34],.05,.05,6,a.wood2,{nb:1})});
  tube(b,[.3,.2,-.16],[.6,.1,-.16],.02,.02,4,a.wood,{nb:1});tube(b,[.3,.2,.16],[.6,.1,.16],.02,.02,4,a.wood,{nb:1});lump(b,-.02,.27,0,.5,.22,.34,dirty(o.load||'#c9a070',.4,.6,.2),1);return b},
 comedero(o){const b=new B(561),a=A(o);b.box(0,.1,0,.8,.1,.2,a.wood,{v:.1});b.box(0,.2,0,.74,.04,.14,col('#2a2018'),{nb:1});b.box(0,.2,0,.7,.03,.12,mix(PAL.hay,a.wood2,.3),{nb:1,jit:.02});[-1,1].forEach(sg=>b.box(sg*.34,0,0,.06,.12,.2,a.wood2));return b},
 abrevadero(o){const b=new B(571),a=A(o);b.box(0,.08,0,.84,.18,.26,a.wood,{v:.1,g:.2});b.box(0,.26,0,.76,.02,.18,dirty(o.water||'#6aa0b0',.5,.45,.1),{nb:1});[-1,1].forEach(sg=>b.box(sg*.35,0,0,.06,.1,.26,a.wood2));return b},
 gallinero(o){const b=new B(581),a=A(o);[[-.3,-.2],[.3,-.2],[-.3,.1],[.3,.1]].forEach(([x,z])=>tube(b,[x,0,z],[x,.22,z],.03,.03,4,a.wood2,{nb:1}));b.box(0,.22,-.05,.7,.38,.5,a.wood,{v:.12});
  b.gable(0,.6,-.05,.7,.5,.2,.08,mix(a.roof,PAL.thatchD,.3),{rows:3,v:.2});b.box(.2,.3,.21,.14,.18,.02,col('#1a1410'),{nb:1});tube(b,[.2,.22,.2],[.2,0,.58],.02,.02,4,a.wood,{nb:1});b.box(.2,0,.4,.14,.02,.4,a.wood2,{nb:1,my:.0});return b},
 espantapajaros(o){const b=new B(591),a=A(o);tube(b,[0,0,0],[0,1.2,0],.025,.02,4,a.wood,{nb:1});tube(b,[-.4,1.0,0],[.4,1.0,0],.02,.02,4,a.wood,{nb:1});
  b.box(0,1.12,0,.16,.16,.16,dirty('#c9b080',.4,.7,.2),{t:.9});b.box(0,1.28,0,.28,.03,.28,a.wood2);b.box(0,1.3,0,.16,.12,.16,a.wood2,{t:.7});b.box(0,.62,0,.3,.4,.12,a.cloth,{v:.15,t:.8});[-1,1].forEach(sg=>b.box(sg*.34,.84,0,.1,.18,.02,mul(a.cloth,.8),{nb:1}));return b},
 huerto(o){const b=new B(601),a=A(o);b.box(0,0,0,1.1,.1,.78,col('#3a2a1e'),{g:.2});[[-1,'#4e6a34'],[0,'#8a5a26'],[1,'#445e34']].forEach(([r,c],i)=>[-.4,-.13,.13,.4].forEach((x,j)=>lump(b,x,.1,r*.22,.17,.14,.17,dirty(c,.5,.75,.1),i*4+j)));
  [-1,1].forEach(sg=>b.box(0,0,sg*.4,1.14,.18,.05,a.wood2,{nb:1,v:.1}));return b},
 rack(o){const b=new B(611),a=A(o);[-1,1].forEach(sg=>tube(b,[sg*.46,0,0],[sg*.46,.9,0],.04,.035,5,a.wood,{v:.1,nb:1}));[.82,.5].forEach(y=>b.box(0,y,0,.98,.05,.06,a.wood2,{nb:1}));
  for(let i=0;i<5;i++)b.box(-.34+i*.17,.2+(i%2)*.08,0.0,.04,.5,.04,i%2?col('#8a929c'):dirty('#a8784a',.4,.7,.2),{nb:1});return b},
 portillo(o){const b=new B(621),a=A(o);[-1,1].forEach(sg=>tube(b,[sg*.4,0,0],[sg*.4,.52,0],.04,.035,5,a.wood,{v:.1,nb:1}));tube(b,[-.36,.1,.0],[.0,.1,.4],.025,.025,4,a.wood2,{nb:1});tube(b,[-.36,.4,0],[0,.4,.4],.025,.025,4,a.wood2,{nb:1});tube(b,[-.36,.1,0],[0,.4,.4],.02,.02,4,a.wood,{nb:1});return b},
 // MURO EN RUINAS (`len`, `h` px; `dir:'y'` lo gira; `col/dark/moss` de los datos): sillares apilados con la cima rota y escombros.
 muroRuina(o){const b=new B(631),a=A(o),L=(o.len||34)*.0409,H=(o.h||13)*.07,c=o.col?dirty(o.col,.4,.7,.1):a.stone,cd=o.dark?dirty(o.dark,.4,.6,.1):mul(a.stone,.75);
  b.course([-L/2,0],[L/2,0],0,H*.45,.2,c,{v:.2});b.course([-L/2,0],[L*.1,0],H*.45,H*.35,.19,cd,{v:.2});b.course([-L*.1,0],[L*.34,0],H*.45,H*.6,.19,c,{v:.2});b.course([L*.12,0],[L*.42,0],H*.8,H*.2,.18,cd,{v:.25});
  lump(b,-L*.42,0,.16,.22,.12,.16,cd,1);lump(b,L*.3,0,-.18,.2,.1,.14,c,2);lump(b,-L*.1,0,.16,.16,.09,.14,cd,3);mossPatch(b,[[-L*.1,.02,L*.25,.12]],H*.45+.006);return b},
 // COLUMNA (`h` px; `broken` = fuste partido con un tambor caído): basa, fuste de 8 caras y capitel.
 columna(o){const b=new B(641),a=A(o),H=(o.h||26)*.0492,c=o.col?dirty(o.col,.4,.7,.1):a.stone2,cd=o.dark?dirty(o.dark,.4,.6,.1):a.stone;
  b.box(0,0,0,.4,.15,.4,cd,{v:.1,g:.2});
  if(o.broken){b.cyl(0,.15,0,.14,.12,H*.55,8,c,{seg:3,j:.04,v:.1});lump(b,0,.15+H*.55,0,.26,.1,.26,cd,2);tube(b,[.15,.14,.28],[.64,.14,.4],.12,.12,8,mix(c,cd,.3),{v:.1})}
  else{b.cyl(0,.15,0,.14,.11,H*.72,8,c,{seg:4,j:.03,v:.1});b.box(0,H-.2,0,.36,.18,.36,cd,{v:.1})}
  if(o.moss!==false)mossPatch(b,[[.04,.06,.2,.12]],.151);return b}
});

// huella y altura de la malla ORG ACTUAL (ancho x, alto y, fondo z; medida con `node scratch measure_org.js` / `pradera_sheet.py --org` el 20 oct 2026)
export const PR_FOOT={molino:[1.60,2.36,1.67],'iglesia:piedra':[2.84,3.72,1.88],'iglesia:troncos':[2.84,2.78,1.88],'iglesia:palafito':[2.86,4.60,2.59],'iglesia:stave':[3.72,4.04,2.02],
 puesto:[.93,.75,.63],banca:[.86,.29,.24],'banca:30':[1.29,.29,.24],empalizada:[.16,1.06,1.82],portonOrco:[.72,2.08,1.58],hoguera:[.86,.15,.84],estandarte:[.15,1.75,.53],carbon:[1.09,.42,.77],asador:[1.10,.69,.26],olla:[.57,.68,.57],
 secadero:[1.00,.82,.11],cestaPeces:[.46,.32,.46],pilaTroncos:[.84,.57,.60],tablones:[1.02,.35,.44],estanteria:[1.09,1.18,.32],atril:[.50,.67,.36],carreta:[.97,.57,.88],comedero:[.82,.35,.29],abrevadero:[.86,.34,.30],gallinero:[.81,.79,.91],
 espantapajaros:[.86,1.45,.39],huerto:[1.18,.28,.86],rack:[1.00,.98,.10],portillo:[.88,.52,.50],muroRuina:[1.39,.91,.50],'muroRuina:9':[1.39,.63,.50],columna:[.40,1.28,.43],'columna:broken':[.93,.94,.70]};
// puertas: centro de la puerta en el marco local SIN rot (x a lo largo de la fachada, z = plano de la puerta), ancho y alto en tiles. Las lee DoorGlow (stations3d.js) vía DOOR_AT.
export const PR_DOORY={palafito:.7};   // la puerta del palafito está elevada (tiles sin escalar)
export const PR_DOOR={molino:{x:-.17,z:.55,w:.34,h:.6},iglesia:{x:-2.5/6,z:.75+.075,w:.46,h:.8}};
const GEO=new Map();
export function praderaGeo(n,o,th){if(!MODELS[n])return null;const key='dk:pr:'+n+'|'+JSON.stringify(o||{});if(GEO.has(key))return GEO.get(key);
 let g=MODELS[n](o||{}).geo();if(o&&(o.rot||o.dir==='y'))g=swapXZ(g);const r={g,key};GEO.set(key,r);return r}
export const PR_NAMES=Object.keys(MODELS);
// casos que mide `pradera_sheet.py --medir`: [nombre, opciones, clave de PR_FOOT] (la iglesia tiene una huella por estilo; los demás, la del nombre)
const EXTRA={banca:[[{len:30},'banca:30']],muroRuina:[[{h:9},'muroRuina:9']],columna:[[{broken:1},'columna:broken']]};
export function PR_CASES(){const L=[],ST=['piedra','troncos','palafito','stave'];
 for(const n of PR_NAMES){if(n==='iglesia')ST.forEach(s=>L.push([n,{style:s},'iglesia:'+s]));else if(PR_BK.has(n)){for(let k=0;k<9;k++){L.push([n,{bk:k},n]);const X=EXTRA[n];if(X)X.forEach(([oo,fk])=>L.push([n,{...oo,bk:k},fk]))}}else L.push([n,{},n])}
 return L}
// nombres que reciben `bk` (bioma de la instancia) en props3d.js
export const PR_BK=new Set(['puesto','banca','empalizada','portonOrco','hoguera','estandarte','carbon','asador','olla','secadero','cestaPeces','pilaTroncos','tablones','estanteria','atril','carreta','comedero','abrevadero','gallinero','espantapajaros','huerto','rack','portillo','muroRuina','columna']);

// Fase 5b (20 oct 2026): ayudantes y paleta compartidos con `propsdark_estaciones3d.js` (estaciones, tablón, fogata, brasero, tótem, monumento…).
export {tube,lump,slab,stk,A,ARQ,stepCone,band,polar,TAU,clamp,fbox};
// verificador anti-clipping de tejados (ver propsdark3d.js «ANTI-CLIPPING» y tools/r3d/roof_clip_check.py)
export function clipReport(n,o){const b=MODELS[n](o||{});return {clips:b.clips(),roofs:b.R.length}}
