// NotScape · R3D · FASE 5b (20 oct 2026) · ESTACIONES DE OFICIO Y PROPS SUELTOS EN EL LENGUAJE OSCURO: banco, tienda, tablón de anuncios, fogata, horno (encendido/apagado), yunque,
// armero, banco de curtidor, taller, escritorio, altar de rezo, lanzas, tótem, arco en ruinas, brasero, tinajas y monumento.
// Módulo hermano de `propsdark_pradera3d.js` (Fase 5): mismo colector `B`, misma paleta `PAL`/`ARQ` (una fila por bioma), mismos ayudantes. Todo por código, sin UV ni assets.
//
// POR QUÉ EXISTE: las estaciones (banco, tienda, horno, yunque, taller, escritorio, armero, curtidor, altar) solo se ven DENTRO de los interiores, que siguen siendo 2D hasta la Fase 15
// (interiores en 3D). Aquí quedan hechas y medidas para que esa fase solo tenga que usarlas: `stations3d.js` ya pide `propGeo(PROPS.ST[id].n,{arch:k})`. FUERA de los interiores se ven hoy:
// `tablon`, `fogata` (estaciones de la plaza) y `lanzas`, `totem`, `arcoRuina`, `brasero` (props sueltos de varios biomas). `tinaja` y `monumento` no se colocan en ningún layout actual.
// NO se hace `herreria`: era una FACHADA 3D (facades.js) que se eliminó en R3D-F2C-PUERTAS; la herrería de la aldea es una `casa` con su puerta.
//
// CONTRATO (igual que Fase 5; lo mide `python3 -I tools/r3d/pradera_sheet.py --medir`):
//  · unidades y ejes de ORG: 1 tile = 1 unidad, y arriba, origen = centro de la huella en el suelo, frente hacia +z. `o.rot` (espejo x↔z) funciona en todos.
//  · HUELLA Y ALTURA dentro de OF_FOOT ±22 % de la malla ORG que sustituyen (las estaciones no escalan con PROP_K; los props sueltos sí, como todos los `dk:`).
//  · aEmit: 1 = vela/farol/símbolo que se enciende de noche · 2 = fuego/brasas · 4 = brasa de chimenea (casi apagada de día).
//  · VARIANTE POR BIOMA: `o.bk` (props de PROPS.list) u `o.arch` (estaciones) elige la paleta (ARQ) y el toldo (tabla CU). REGLA PERMANENTE: un bioma nuevo = una fila en ARQ y en CU.
//  · DETERMINISTA: todo el azar sale de `hash`.
import * as THREE from 'three';
import {B,hash,vary,mix,mul,col,dirty,PAL,lanternAt,mossPatch,swapXZ} from './propsdark3d.js';
import {tube,lump,A,clamp,TAU} from './propsdark_pradera3d.js';

// toldo por cultura: cloth = tiras de tela del color del bioma · thatch = paja · hide = pieles oscuras
const CU=[{awn:'cloth'},{awn:'cloth'},{awn:'thatch'},{awn:'cloth'},{awn:'cloth'},{awn:'hide'},{awn:'cloth'},{awn:'thatch'},{awn:'cloth'}];
const K=o=>clamp(((o&&(o.bk!=null?o.bk:o.arch))|0),0,8);
const PL=()=>mix(col('#8a929c'),col('#5a5e66'),.3);          // placa de armadura / hierro pulido apagado
const CLAY=()=>dirty('#b0703c',.55,.7,.2);
const HIDE=()=>dirty('#a8794a',.5,.72,.15);
const WATER=()=>dirty('#5a8aa0',.5,.5,.1);
const FL=()=>col('#ffcf6a');

// lámina fina con cara superior y subcara oscura (el material solo dibuja la cara delantera)
function sheet(b,p0,p1,p2,p3,c,t=.02){const cx=(p0[0]+p2[0])/2,cy=(p0[1]+p2[1])/2,cz=(p0[2]+p2[2])/2,d=q=>[q[0],q[1]-t,q[2]];
 b.quad(p0,p1,p2,p3,c,0,[cx,cy-5,cz]);b.quad(d(p0),d(p1),d(p2),d(p3),mul(c,.55),0,[cx,cy+5,cz])}
// toldo inclinado de x0 a x1, de (zb,yb) atrás a (zf,yf) delante; sigue la cultura (tela en tiras con faldón, paja en hiladas, pieles)
function awning(b,a,k,x0,x1,zb,yb,zf,yf,sd){const aw=CU[k].awn;
 if(aw==='thatch'){const R=4;for(let r=0;r<R;r++){const f0=r/R,f1=(r+1)/R,za=zb+(zf-zb)*f0,ya=yb+(yf-yb)*f0,zc=zb+(zf-zb)*f1,yc=yb+(yf-yb)*f1,c=vary(mix(PAL.thatch,PAL.thatchD,.3),.18,sd,r),l=.025*(R-r);
   sheet(b,[x0-l,ya+.012*r,za],[x1+l,ya+.012*r,za],[x1+l,yc+.012*r,zc],[x0-l,yc+.012*r,zc],c,.05)}
  for(let i=0;i<8;i++){const x=x0+(x1-x0)*(i+.5)/8;b.box(x,yf-.09,zf+.015,(x1-x0)/8*.9,.1+hash(sd,i,3)*.06,.03,vary(PAL.thatchD,.2,sd,i),{nb:1})}return}
 const n=8,c1=aw==='hide'?mul(a.cloth,.7):a.cloth,c2=aw==='hide'?mul(a.cloth2,.45):a.cloth2;
 for(let i=0;i<n;i++){const xa=x0+(x1-x0)*i/n,xb=x0+(x1-x0)*(i+1)/n,c=vary(i%2?c2:c1,.06,sd,i);
  sheet(b,[xa,yb,zb],[xb,yb,zb],[xb,yf,zf],[xa,yf,zf],c,.03);
  if(aw==='hide')b.box((xa+xb)/2,yf-.07,zf+.01,(xb-xa)*.95,.09+hash(sd,i,5)*.07,.025,mul(c,.8),{nb:1});
  else b.tri([xa,yf,zf+.01],[(xa+xb)/2,yf-.1,zf+.01],[xb,yf,zf+.01],mul(c,.9),0,[(xa+xb)/2,yf-.1,zf-1])}}
// voussoir (dovela) de un arco en el plano XY: sector entre radios r0..r1 y ángulos a0..a1, centrado en (cx,cy), de fondo zd
function vous(b,cx,cy,r0,r1,a0,a1,zd,c){const P=(r,a,z)=>[cx+Math.cos(a)*r,cy+Math.sin(a)*r,z],h=zd/2,m=[cx+Math.cos((a0+a1)/2)*(r0+r1)/2,cy+Math.sin((a0+a1)/2)*(r0+r1)/2,0];
 [[P(r0,a0,h),P(r1,a0,h),P(r1,a1,h),P(r0,a1,h)],[P(r0,a0,-h),P(r1,a0,-h),P(r1,a1,-h),P(r0,a1,-h)],[P(r1,a0,h),P(r1,a1,h),P(r1,a1,-h),P(r1,a0,-h)],[P(r0,a0,h),P(r0,a1,h),P(r0,a1,-h),P(r0,a0,-h)],
  [P(r0,a0,h),P(r1,a0,h),P(r1,a0,-h),P(r0,a0,-h)],[P(r0,a1,h),P(r1,a1,h),P(r1,a1,-h),P(r0,a1,-h)]].forEach((q,i)=>b.quad(q[0],q[1],q[2],q[3],i===0?c:mul(c,i===2?1.08:.82),0,m))}
const coin=(b,x,y,z,n,c)=>{for(let i=0;i<n;i++)tube(b,[x,y+i*.03,z],[x,y+i*.03+.026,z],.045,.045,7,vary(c,.1,x*9+z,i),{nb:1})};
const sack=(b,x,z,w,h,c,s)=>{lump(b,x,0,z,w,h,w*.85,c,s);lump(b,x,h*.75,z,w*.5,h*.3,w*.45,mul(c,.8),s+1)};

// ═════════ MODELOS ═════════
const MODELS={
 // BANCO (≈1,92 × 1,36 × 1,42): mostrador de piedra y madera con reja de hierro y ventanilla, rótulo dorado, cámara acorazada con rueda, cajas fuertes, balanza, libro de cuentas y monedas.
 banco(o){const b=new B(701),a=A({bk:K(o)});
  b.box(0,0,0,1.9,.1,1.4,PAL.stoneD,{v:.1,g:.25,jit:.01});
  b.box(0,.1,-.5,1.84,1.06,.34,mix(a.stone,PAL.plaster,.25),{v:.06,g:.15});for(let i=1;i<6;i++)b.box(0,.1+i*.17,-.325,1.82,.012,.012,PAL.stoneD,{nb:1});   // muro del fondo con hiladas
  const vx=-.5,vy=.62;tube(b,[vx,vy,-.33],[vx,vy,-.29],.32,.32,12,PAL.iron,{nb:1});tube(b,[vx,vy,-.29],[vx,vy,-.26],.25,.25,12,PAL.ironL,{nb:1});tube(b,[vx,vy,-.26],[vx,vy,-.23],.07,.07,8,a.acc,{nb:1});   // puerta de la cámara
  for(let i=0;i<3;i++){const an=i*TAU/3+.3;tube(b,[vx,vy,-.235],[vx+Math.cos(an)*.2,vy+Math.sin(an)*.2,-.235],.016,.016,4,PAL.iron,{nb:1});b.box(vx+Math.cos(an)*.2-.025,vy+Math.sin(an)*.2-.025,-.24,.05,.05,.05,a.acc,{nb:1})}
  for(let r=0;r<3;r++){b.box(.5,.16+r*.3,-.31,.62,.26,.05,mul(a.wood,.8),{nb:1,v:.1});b.box(.5,.16+r*.3+.1,-.275,.2,.05,.025,a.acc,{nb:1});b.box(.28,.16+r*.3,-.285,.03,.26,.02,PAL.iron,{nb:1});b.box(.72,.16+r*.3,-.285,.03,.26,.02,PAL.iron,{nb:1})}   // cajas fuertes
  b.box(0,.1,.34,1.86,.58,.46,a.wood,{v:.1,g:.2});b.box(0,.68,.33,1.92,.07,.58,a.stone2,{v:.1,jit:.01});
  [-.6,0,.6].forEach((x,i)=>{b.box(x,.2,.575,.5,.38,.03,mul(a.wood,.7),{nb:1,v:.1});b.box(x,.3,.592,.18,.18,.012,i===1?a.acc:mul(a.acc,.7),{nb:1,t:.4})});   // paneles del mostrador con emblema
  const gy=.75;for(let i=0;i<=10;i++){const x=-.86+i*.172;if(Math.abs(x)<.2)continue;b.box(x-.015,gy,.18,.03,.43,.03,PAL.iron,{nb:1})}b.box(0,1.14,.18,1.84,.05,.06,PAL.iron,{nb:1});   // reja con ventanilla central
  [-.2,.2].forEach(x=>b.box(x-.02,gy,.18,.04,.43,.05,PAL.ironL,{nb:1}));b.box(0,.77,.2,.4,.025,.12,mul(a.wood,.8),{nb:1});
  b.box(0,1.19,.14,1.9,.17,.16,a.wood,{v:.08});b.box(0,1.215,.225,.8,.11,.02,a.acc,{nb:1,v:.05});b.box(0,1.19,.2,1.96,.025,.2,mul(a.wood,.7),{nb:1});   // rótulo dorado
  coin(b,.6,.75,.45,4,a.acc);coin(b,.7,.75,.38,2,a.acc);coin(b,.5,.75,.36,3,mix(a.acc,PAL.iron,.3));
  tube(b,[-.72,.75,.42],[-.72,.98,.42],.02,.02,4,PAL.iron,{nb:1});tube(b,[-.9,.96,.42],[-.54,.96,.42],.015,.015,4,PAL.iron,{nb:1});[-.9,-.54].forEach(x=>{tube(b,[x,.9,.42],[x,.96,.42],.004,.004,3,PAL.iron,{nb:1});tube(b,[x,.89,.42],[x,.9,.42],.06,.06,6,a.acc,{nb:1})});   // balanza
  b.box(-.15,.75,.46,.3,.03,.22,mul(a.wood,.7),{nb:1});b.box(-.15,.78,.46,.27,.012,.19,col('#cfc8b0'),{nb:1});b.box(-.15,.79,.46,.012,.005,.19,PAL.timber,{nb:1});   // libro de cuentas
  lanternAt(b,.85,.75,.42,1.4);mossPatch(b,[[-.8,.62,.3,.12],[.7,-.58,.4,.12]],.1);return b},

 // TIENDA = MOSTRADOR DEL TENDERO (≈2,1 × 1,3 × 1,2; Fase 28b, 20 oct 2026: antes era un puesto de mercado con toldo, que no pintaba nada DENTRO de una tienda).
 // Mostrador de madera con tablero, balanza, monedas, hogazas y fruta; estantería trasera con tarros, botellas y cajas contra la pared; hueco libre detrás (z −.4…−.05) donde se pone el tendero (`tendero@k`, interiors3d.js);
 // rótulo con una moneda a un lado y farol. Frente = +z.
 tienda(o){const b=new B(711),k=K(o),a=A({bk:k});
  // estantería trasera (contra la pared, z≈−.55): dos montantes, cuatro baldas y mercancía distinta en cada una
  [-.98,.98].forEach((x,i)=>b.box(x,0,-.56,.07,1.4,.12,vary(a.wood,.1,711,i),{v:.1,nb:1}));b.box(0,1.36,-.58,2.08,.06,.16,a.wood2,{v:.08,nb:1});
  for(let r=0;r<4;r++){const y=.18+r*.34;b.box(0,y,-.56,1.96,.035,.2,a.wood2,{nb:1,v:.06});
   for(let i=0;i<8;i++){const x=-.84+i*.24+(hash(711,r,i)-.5)*.05,t=(i+r*3)%5,h=.1+hash(711,r,i+9)*.1;
    if(t===0)b.cyl(x,y+.035,-.56,.05,.045,h+.04,7,dirty(['#5a8aa0','#8a5a3a','#6a7a4a','#a0804a'][(i+r)%4],.5,.7,.15),{nb:1});
    else if(t===1)b.box(x,y+.035,-.56,.15,h,.12,dirty(['#7a5a34','#5a6a5a','#7a3a30'][(i+r)%3],.5,.7,.15),{nb:1,v:.1});
    else if(t===2){b.cyl(x,y+.035,-.56,.035,.03,h+.07,6,dirty('#3a6a4a',.5,.6,.2),{nb:1});b.cyl(x,y+.035+h+.07,-.56,.016,.016,.04,5,col('#a88a5a'),{nb:1})}
    else lump(b,x,y+.035,-.56,.11,h*.8,.09,dirty(['#c9a070','#b08a5a','#8a6a44'][(i+r)%3],.5,.8,.1),i+r*7)}}
  b.box(0,.04,-.56,1.96,.14,.2,mul(a.wood,.75),{v:.08,nb:1});
  // mostrador: cuerpo con tres paneles al frente, tablero con borde y zócalo
  b.box(0,0,.26,2.02,.64,.5,a.wood,{v:.1,g:.15});for(let i=0;i<3;i++){b.box(-.66+i*.66,.1,.515,.58,.44,.025,mul(a.wood,.72),{nb:1,v:.1});b.box(-.66+i*.66,.31,.53,.46,.02,.012,mix(a.wood2,a.acc,.35),{nb:1})}
  b.box(0,.64,.28,2.12,.07,.64,a.wood2,{v:.08,g:.2});b.box(0,.7,.58,2.12,.03,.05,mul(a.wood2,.8),{nb:1});b.box(0,0,.55,2.0,.06,.1,mul(a.wood,.6),{nb:1});
  // sobre el tablero: balanza, monedas, hogazas, caja de fruta, libro de cuentas y campanilla
  const Y=.71;b.cyl(-.62,Y,.2,.07,.06,.03,7,PAL.iron,{nb:1});tube(b,[-.62,Y,.2],[-.62,Y+.3,.2],.012,.012,5,PAL.iron,{nb:1});b.box(-.62,Y+.3,.2,.4,.014,.014,PAL.iron,{nb:1});
  [-.2,.2].forEach(dx=>{tube(b,[-.62+dx,Y+.3,.2],[-.62+dx,Y+.16,.2],.004,.004,3,PAL.rope,{nb:1});b.cyl(-.62+dx,Y+.14,.2,.075,.07,.012,8,mix(a.acc,PAL.iron,.3),{nb:1})});
  coin(b,.18,Y,.36,5,a.acc);coin(b,.28,Y,.3,3,mix(a.acc,PAL.iron,.3));coin(b,.12,Y,.26,2,a.acc);
  b.box(.64,Y,.28,.4,.1,.3,mul(a.wood,.85),{v:.1});for(let i=0;i<6;i++)lump(b,.52+(i%3)*.1,Y+.1,.2+(i>2?.12:0),.08,.07,.08,dirty(['#a04a30','#c89a3a','#6a8a4a'][i%3],.5,.75,.1),i);
  lump(b,-.1,Y,.4,.16,.07,.1,dirty('#c9a070',.5,.8,.1),4);lump(b,.0,Y,.34,.14,.06,.1,dirty('#c9a070',.5,.75,.1),5);
  b.box(.92,Y,.4,.2,.025,.15,mul(a.wood,.7),{nb:1});b.box(.92,Y+.03,.4,.18,.012,.13,col('#cfc8b0'),{nb:1});b.cyl(.78,Y,.18,.035,.05,.06,6,mix(a.acc,PAL.iron,.3),{nb:1});   // libro y campanilla
  // rótulo con moneda sobre el lado izquierdo (poste + tablilla) y farol
  tube(b,[-1.08,0,.1],[-1.08,1.18,.1],.035,.03,5,a.wood,{v:.1,nb:1});b.box(-1.08,.92,.2,.05,.34,.34,a.wood2,{v:.08});b.cyl(-1.045,1.09,.2,.1,.1,.02,10,a.acc,{nb:1,t:.4});tube(b,[-1.07,.88,.1],[-1.07,.84,.1],.006,.006,3,PAL.rope,{nb:1});
  lanternAt(b,1.12,.74,.4,1.2);mossPatch(b,[[.9,-.5,.3,.1]],.06);return b},

 // TABLÓN DE ANUNCIOS (≈0,34 × 1,41 × 1,64 a lo largo de z): dos postes, tablero con avisos clavados, tejadillo a dos aguas y farol.
 tablon(o){const b=new B(721),a=A({bk:K(o)}),Z=.72;
  [-Z,Z].forEach((z,i)=>{tube(b,[0,0,z],[0,1.2,z],.05,.042,6,vary(a.wood,.12,721,i),{v:.1,nb:1});b.stone(0,0,z,.2,.07,.2,PAL.stoneD,{s:i,j:.2})});
  b.box(0,.42,0,.1,.7,1.5,a.wood2,{v:.08});b.box(.04,.4,0,.06,.04,1.56,mul(a.wood,.8),{nb:1});b.box(.04,1.08,0,.06,.04,1.56,mul(a.wood,.8),{nb:1});[-.75,.75].forEach(z=>b.box(.04,.4,z,.06,.72,.04,mul(a.wood,.8),{nb:1}));
  const N=[[-.55,.78,.2,.28],[-.2,.62,.16,.22],[.15,.82,.22,.24],[.5,.66,.15,.26],[-.35,.58,.12,.12],[.35,.52,.14,.1]];
  N.forEach(([z,y,w,h],i)=>{b.box(.055,y,z,.014,h,w,vary(i%3===1?col('#c4b48a'):col('#d4c8a4'),.12,721,i),{nb:1});b.box(.065,y+h-.03,z,.012,.025,.025,PAL.iron,{nb:1});b.box(.063,y+h*.4,z,.006,.012,w*.7,mul(PAL.timber,1.2),{nb:1,t:.8})});   // avisos con chinchetas y líneas de texto
  b.box(.057,.93,-.08,.016,.1,.18,dirty('#8a3a2a',.6,.7,.1),{nb:1});   // cartel de «se busca» con sello rojo
  const rf=1.2,rt=1.36,hz=Z+.12;sheet(b,[-.2,rf,-hz],[0,rt,-hz],[0,rt,hz],[-.2,rf,hz],mul(a.roof,1.05),.04);sheet(b,[.2,rf,-hz],[0,rt,-hz],[0,rt,hz],[.2,rf,hz],a.roof,.04);   // tejadillo
  b.tri([-.18,rf-.015,hz-.01],[0,rt-.01,hz-.01],[.18,rf-.015,hz-.01],mul(a.wood,.8),0,[0,rf-.1,hz-1]);b.tri([-.18,rf-.015,-hz+.01],[.18,rf-.015,-hz+.01],[0,rt-.01,-hz+.01],mul(a.wood,.8),0,[0,rf-.1,-hz+1]);
  lanternAt(b,.12,.92,Z+.02,1.1);mossPatch(b,[[0,Z-.1,.2,.14]],.07);return b},

 // MERCADO · TABLÓN DE SUBASTAS (≈1,7 × 1,5 × 0,9; Fase 28b): un tablón grande con muchas ofertas clavadas, un atril inclinado con el libro mayor, una balanza, un arcón con monedas,
 // una campanilla colgada y un rótulo de latón. Es el terminal del mercado entre jugadores (src/shop.js `TRADE.openMkt`). Frente = +z.
 subastas(o){const b=new B(741),a=A({bk:K(o)});
  // tablón trasero (dos postes + tablero) con 14 notas de distinto tamaño y color y un tejadillo
  [-.78,.78].forEach((x,i)=>{tube(b,[x,0,-.3],[x,1.5,-.3],.05,.045,6,vary(a.wood,.12,741,i),{v:.1,nb:1});b.stone(x,0,-.3,.2,.07,.2,PAL.stoneD,{s:i,j:.2})});
  b.box(0,.5,-.3,1.7,.9,.08,a.wood2,{v:.08});b.box(0,.5,-.255,1.76,.05,.03,mul(a.wood,.8),{nb:1});b.box(0,1.36,-.255,1.76,.05,.03,mul(a.wood,.8),{nb:1});
  for(let i=0;i<14;i++){const x=-.7+(i%7)*.23+(hash(741,i,1)-.5)*.05,y=.62+(i>6?.46:0)+(hash(741,i,2)-.5)*.06,w=.13+hash(741,i,3)*.08,h=.16+hash(741,i,4)*.1;
   b.box(x,y,-.25,w,h,.012,vary(i%3===1?col('#c4b48a'):col('#d8cca8'),.1,741,i),{nb:1});b.box(x,y+h-.03,-.24,.025,.025,.012,PAL.iron,{nb:1});b.box(x,y+h*.4,-.24,w*.7,.012,.006,mul(PAL.timber,1.2),{nb:1,t:.8});
   if(i%4===0)b.cyl(x+w*.3,y+.04,-.24,.025,.025,.008,8,a.acc,{nb:1,t:.5})}   // alguna con un sello dorado
  sheet(b,[-.95,1.5,-.45],[0,1.66,-.45],[0,1.66,.12],[-.95,1.5,.12],mul(a.roof,1.05),.04);sheet(b,[.95,1.5,-.45],[0,1.66,-.45],[0,1.66,.12],[.95,1.5,.12],a.roof,.04);
  // rótulo de latón colgado del tejadillo
  b.box(0,1.3,.1,.7,.14,.03,a.acc,{nb:1,t:.4});[-.28,.28].forEach(x=>tube(b,[x,1.5,.1],[x,1.44,.1],.006,.006,3,PAL.rope,{nb:1}));
  // atril inclinado delante con el libro mayor, balanza y arcón
  [-.5,.5].forEach(x=>{tube(b,[x,0,.18],[x,.72,.18],.045,.04,5,a.wood,{v:.1,nb:1});tube(b,[x,0,.46],[x,.6,.46],.045,.04,5,a.wood,{v:.1,nb:1})});
  b.quad([-.7,.72,.12],[.7,.72,.12],[.7,.6,.54],[-.7,.6,.54],a.wood2,0,[0,.7,.3]);b.box(0,.58,.3,1.5,.03,.5,mul(a.wood,.7),{nb:1});
  b.box(-.2,.66,.3,.46,.025,.34,col('#cfc8b0'),{nb:1,t:.9});b.box(-.2,.69,.3,.01,.012,.32,PAL.timber,{nb:1});b.box(-.2,.68,.3,.4,.01,.28,mul(col('#cfc8b0'),.9),{nb:1});   // libro abierto
  b.box(.28,.66,.26,.16,.012,.2,col('#d8cca8'),{nb:1});tube(b,[.5,.62,.4],[.62,.7,.36],.008,.005,3,PAL.iron,{nb:1});   // hoja suelta y pluma
  b.cyl(.55,.6,.22,.07,.06,.03,7,PAL.iron,{nb:1});tube(b,[.55,.6,.22],[.55,.86,.22],.011,.011,5,PAL.iron,{nb:1});b.box(.55,.86,.22,.36,.013,.013,PAL.iron,{nb:1});[.37,.73].forEach(x=>b.cyl(x,.74,.22,.07,.065,.012,8,mix(a.acc,PAL.iron,.3),{nb:1}));
  b.box(-.62,0,.55,.4,.26,.3,PAL.iron,{t:.9});b.box(-.62,.26,.55,.42,.04,.32,a.acc,{nb:1,t:.9});coin(b,-.62,.3,.55,4,a.acc);   // arcón con monedas
  tube(b,[.82,1.2,.18],[.82,.96,.18],.006,.006,3,PAL.rope,{nb:1});b.cyl(.82,.9,.18,.06,.04,.1,7,mix(a.acc,PAL.iron,.3),{nb:1});   // campanilla
  lanternAt(b,-.88,.9,.1,1.2);mossPatch(b,[[.7,.1,.3,.1]],.06);return b},

 // FOGATA (≈1,19 × 0,32 × 1,19): anillo de piedras, ceniza, leños cruzados bajos y brasas. Las llamas animadas las pone `stations3d.js` (conos 3D) y la luz, light.js.
 fogata(o){const b=new B(731),a=A({bk:K(o)});
  for(let k=0;k<10;k++){const an=k*TAU/10+.2,r=.5+hash(731,k,2)*.05;lump(b,Math.cos(an)*r,0,Math.sin(an)*r,.26+hash(731,k,1)*.08,.14+hash(731,k,3)*.06,.2,vary(k%2?mul(a.stone,.8):mul(a.stone,.62),.12,731,k),k)}
  b.cyl(0,0,0,.42,.4,.035,9,col('#262120'),{nb:1,j:.1});tube(b,[-.3,.05,-.1],[.26,.11,.08],.05,.045,6,a.wood,{v:.1});tube(b,[.12,.05,-.3],[-.1,.11,.26],.05,.045,6,a.wood2,{v:.1});tube(b,[-.2,.05,.2],[.22,.1,-.2],.04,.035,6,mul(a.wood,.8),{v:.1});
  b.box(0,.03,0,.3,.04,.3,col('#ff7a2a'),{em:2,nb:1,t:.6,jit:.03});b.box(.08,.05,-.06,.14,.03,.14,col('#ffb040'),{em:2,nb:1,t:.6});return b},

 // HORNO / FRAGUA (≈1,03 × 1,17 × 0,91; `on` = encendido): horno de piedra con boca arqueada, campana y chimenea, fuelle de cuero y carbón. Encendido: boca incandescente (aEmit 2) y brasa en la chimenea (aEmit 4).
 horno(o){const b=new B(741),a=A({bk:K(o)}),on=!!o.on;
  b.box(0,0,0,.96,.16,.84,PAL.stoneD,{v:.1,g:.25,jit:.01});b.box(0,.16,0,.88,.62,.72,mix(a.stone,PAL.stoneD,.3),{v:.08,g:.18,t:.93});
  for(let i=1;i<4;i++)b.box(0,.16+i*.15,.33,.84,.012,.04,PAL.stoneD,{nb:1,t:.97});
  b.box(0,.2,.33,.42,.34,.1,col('#0b0908'),{nb:1});b.box(0,.54,.34,.54,.1,.14,a.stone2,{v:.1,nb:1});[-.25,.25].forEach(x=>b.box(x,.18,.34,.08,.38,.12,a.stone2,{v:.1,nb:1}));   // boca con jambas y dintel
  if(on){b.box(0,.2,.3,.34,.2,.06,col('#ff7a2a'),{em:2,nb:1});b.box(0,.22,.33,.2,.14,.04,col('#ffc060'),{em:2,nb:1});b.box(0,.2,.36,.38,.03,.1,col('#ff9a3a'),{em:2,nb:1,t:.7})}else{b.box(0,.2,.3,.34,.04,.06,col('#2a2422'),{nb:1});b.box(0,.22,.36,.3,.025,.08,col('#3a3432'),{nb:1,t:.7})}
  b.box(0,.78,-.04,.64,.2,.52,a.stone,{v:.1,t:.82,g:.15});b.box(0,.98,-.1,.32,.19,.32,mul(a.stone,.9),{v:.1,t:.85,g:.2});b.box(0,1.17-.04,-.1,.4,.04,.4,PAL.stoneD,{nb:1,v:.1});
  if(on)b.box(0,1.14,-.1,.16,.025,.16,col('#ff7a2a'),{em:4,nb:1});
  b.box(.42,.12,.1,.16,.16,.4,dirty('#6a4a30',.6,.6,.1),{v:.1,t:.55});tube(b,[.4,.2,.32],[.5,.3,.46],.025,.015,4,PAL.iron,{nb:1});b.box(.4,.08,.36,.12,.05,.16,a.wood2,{nb:1});b.box(.48,.26,.44,.05,.05,.05,PAL.iron,{nb:1});   // fuelle
  [[-.4,.42,.2],[-.3,.46,.16],[-.41,.5,.18],[-.28,.38,.16]].forEach(([x,z,w],i)=>lump(b,x,0,z,w,.16+(i%2)*.06,.18,col(['#2e2a28','#3a3430','#241f1e','#2e2a28'][i]),i));   // carbón
  tube(b,[-.4,.62,.24],[-.4,.9,.24],.012,.012,4,PAL.iron,{nb:1});mossPatch(b,[[-.2,.38,.3,.1]],.16);return b},

 // YUNQUE (≈1,12 × 0,65 × 0,42): yunque de hierro con cuerno sobre un tocón, martillo, cubo de temple con agua y herraduras.
 yunque(o){const b=new B(751),a=A({bk:K(o)}),X=-.1;
  b.cyl(X,0,0,.26,.22,.34,9,a.wood,{seg:2,j:.07,v:.14});b.cyl(X,.34,0,.22,.22,.015,9,mix(a.wood2,col('#c8a070'),.3),{nb:1});
  b.box(X,.35,0,.34,.06,.2,PAL.iron,{t:.8});b.box(X,.41,0,.17,.08,.14,PAL.ironL,{t:.85});b.box(X,.49,0,.46,.07,.21,PAL.ironL,{v:.06});b.box(X+.04,.56,0,.4,.012,.19,mul(PL(),1.1),{nb:1});
  tube(b,[X+.23,.525,0],[X+.46,.51,0],.075,.012,6,PAL.ironL,{nb:1});b.box(X-.12,.49,.04,.04,.075,.04,col('#16171a'),{nb:1});   // cuerno y agujero
  tube(b,[X-.2,.58,.05],[X+.0,.58,.12],.016,.016,5,a.wood2,{nb:1});b.box(X-.04,.56,.1,.14,.07,.07,PL(),{nb:1,v:.1});   // martillo sobre el yunque
  b.cyl(.6,0,.02,.17,.2,.24,8,a.wood2,{seg:2,v:.1,bulge:.02});b.cyl(.6,.16,.02,.2,.2,.02,8,PAL.iron,{nb:1});b.cyl(.6,.2,.02,.17,.17,.02,8,WATER(),{nb:1});b.cyl(.6,.07,.02,.2,.2,.02,8,PAL.iron,{nb:1});
  [[.55,.17,.9],[.35,-.17,.2]].forEach(([x,z,r],i)=>tube(b,[x,.01,z],[x+.04,.014,z+.03],.05,.05,8,PAL.ironL,{nb:1}));lump(b,-.36,0,.14,.16,.05,.12,col('#2a2422'),3);return b},

 // ARMERO (≈0,8 × 1,24 × 0,78): maniquí de armadura sobre pie de madera (coraza, hombreras, yelmo con cimera), escudo y espada apoyados.
 armero(o){const b=new B(761),a=A({bk:K(o)}),pl=PL();
  b.box(0,0,0,.7,.05,.1,a.wood,{v:.1});b.box(0,0,0,.1,.05,.7,a.wood,{v:.1});tube(b,[0,.05,0],[0,.9,0],.03,.028,5,a.wood2,{nb:1});
  b.box(0,.46,0,.36,.4,.22,pl,{v:.06,t:.8});b.box(0,.7,0,.4,.07,.24,mul(pl,1.1),{nb:1});b.box(0,.5,.115,.2,.18,.012,mul(pl,1.18),{nb:1});b.box(0,.32,0,.38,.1,.24,mix(pl,a.cloth,.4),{nb:1,v:.1});   // coraza, hombrera central, placa y falda
  tube(b,[-.3,.74,0],[.3,.74,0],.02,.02,5,a.wood,{nb:1});[-1,1].forEach(sg=>{b.box(sg*.25,.5,0,.09,.26,.09,mix(pl,col('#6a6e74'),.5),{nb:1,v:.1});b.cyl(sg*.23,.7,0,.08,.065,.1,6,mul(pl,1.1),{nb:1})});   // brazos de malla y hombreras
  b.cyl(0,.84,0,.11,.095,.2,8,mul(pl,1.12),{seg:2,v:.05});b.box(0,.95,0,.2,.04,.2,pl,{nb:1,t:.7});b.box(0,.88,.11,.16,.025,.01,col('#0b0b0d'),{nb:1});b.box(0,1.0,0,.04,.2,.22,a.cloth,{nb:1,t:.6,v:.1});   // yelmo con visera y cimera
  tube(b,[.26,.2,.22],[.26,.2,.25],.17,.17,10,mix(a.wood,a.cloth,.5),{nb:1});tube(b,[.26,.2,.25],[.26,.2,.265],.16,.16,10,pl,{nb:1});tube(b,[.26,.2,.265],[.26,.2,.285],.045,.045,6,a.acc,{nb:1});   // escudo
  b.beam([-.26,.04,.24],[-.2,.62,.26],.035,PL());b.box(-.29,.3,.235,.14,.035,.04,PAL.iron,{nb:1});tube(b,[-.2,.62,.26],[-.19,.76,.26],.025,.02,5,a.wood,{nb:1});return b},

 // BANCO DE CURTIDOR (≈0,63 × 0,91 × 1,02 a lo largo de z): bastidor con piel tensada, cuba de curtido con líquido, raspador y tiras de cuero colgando.
 // ALAMBIQUE (Alquimia, 27 oct 2026): hornilla de piedra con su fuego, caldero de cobre con cabeza, tubo a un serpentín y un frasco que gotea. Provisional en el Taller hasta la Botica. ≈ 1,1 × 0,85 × 0,6.
 alambique(o){const b=new B(772),a=A({bk:K(o)}),cu=dirty('#9a6a3a',.75,.5,.1),cu2=mul(cu,.8);
  b.box(-.2,0,0,.62,.34,.5,a.stone2,{v:.08,g:.1,t:.62});b.box(-.2,.34,0,.66,.04,.54,a.stone,{nb:1});b.box(-.2,.08,.255,.3,.16,.02,PAL.lamp,{em:1,nb:1});b.box(-.2,.06,.262,.34,.2,.02,PAL.stoneD,{nb:1,t:.97});   // hornilla con la boca encendida
  b.cyl(-.2,.38,0,.22,.22,.26,10,cu,{seg:2,bulge:.04,v:.1});b.cyl(-.2,.64,0,.17,.17,.07,10,cu2,{nb:1});b.cyl(-.2,.71,0,.09,.09,.1,8,cu,{nb:1});b.cyl(-.2,.81,0,.05,.05,.05,6,cu2,{nb:1});   // caldero y cabeza
  tube(b,[-.2,.84,0],[.2,.72,0],.03,.028,5,cu,{nb:1});tube(b,[.2,.72,0],[.34,.6,0],.028,.022,5,cu,{nb:1});   // tubo hacia el serpentín
  b.cyl(.36,.28,0,.1,.1,.34,8,cu2,{nb:1,v:.08});[.34,.48].forEach(y=>b.cyl(.36,y,0,.11,.11,.02,8,PAL.iron,{nb:1}));tube(b,[.36,.3,.1],[.36,.1,.1],.012,.012,4,cu,{nb:1});
  b.cyl(.36,0,.14,.07,.07,.1,8,dirty('#8ab0b8',.5,.5,.2),{nb:1,t:.9});b.cyl(.36,.1,.14,.03,.03,.06,6,dirty('#8ab0b8',.5,.5,.2),{nb:1});   // frasco
  b.box(-.62,0,.12,.14,.18,.14,a.wood,{v:.1});b.cyl(-.62,.18,.12,.045,.045,.07,6,dirty('#5f9a4a',.6,.5,.2),{nb:1});return b},
 curtidor(o){const b=new B(771),a=A({bk:K(o)}),Z=.4,hd=HIDE();
  [-Z,Z].forEach((z,i)=>tube(b,[-.1,0,z+.1],[-.1,.88,z+.1],.04,.035,5,vary(a.wood,.12,771,i),{v:.1,nb:1}));[.1,.8].forEach(y=>b.box(-.1,y,.1,.06,.05,.9,a.wood2,{nb:1}));
  b.box(-.1,.14,.1,.03,.64,.76,hd,{v:.1,t:.97});for(let i=0;i<7;i++){b.box(-.075,.78,-.24+i*.12+.1,.012,.03,.02,PAL.rope,{nb:1});b.box(-.075,.15,-.24+i*.12+.1,.012,.03,.02,PAL.rope,{nb:1})}   // piel con cordeles
  b.box(-.085,.4,.1,.01,.3,.5,mul(hd,.8),{nb:1,v:.1});
  b.cyl(.3,0,-.3,.2,.2,.3,9,a.wood,{seg:2,bulge:.02,v:.12});b.cyl(.3,.3,-.3,.2,.2,.012,9,PAL.iron,{nb:1});b.cyl(.3,.26,-.3,.18,.18,.02,9,dirty('#4a3a22',.7,.5,.1),{nb:1});[.08,.22].forEach(y=>b.cyl(.3,y,-.3,.205,.205,.025,9,PAL.iron,{nb:1}));
  b.beam([.1,.02,.18],[.0,.62,.15],.04,a.wood2);b.box(.12,.12,.14,.1,.04,.04,PL(),{nb:1});for(let i=0;i<3;i++)b.box(.3,.5-i*.13,.38,.03,.2,.05,mul(hd,.9-i*.1),{nb:1,v:.12});tube(b,[.3,.58,.3],[.3,.58,.5],.01,.01,4,a.wood,{nb:1});return b},

 // TALLER (≈1,46 × 0,83 × 0,68): banco de carpintero con tornillo de banco, tablones, sierra, garlopa, mazo, formones y virutas.
 taller(o){const b=new B(781),a=A({bk:K(o)});
  [[-.62,-.24],[.62,-.24],[-.62,.24],[.62,.24]].forEach(([x,z],i)=>b.box(x,0,z,.1,.62,.1,vary(a.wood,.12,781,i),{v:.1}));b.box(0,.18,0,1.3,.05,.5,mul(a.wood,.85),{v:.1});b.box(0,.62,0,1.44,.1,.62,a.wood2,{v:.1,jit:.01});
  [-.3,.3].forEach(x=>b.beam([x,.2,-.22],[x,.6,-.22],.05,mul(a.wood,.8)));b.box(0,.23,0,1.0,.07,.34,vary(a.wood2,.1,781,5),{v:.12});b.box(-.1,.3,.05,.9,.06,.3,vary(a.wood,.1,781,6),{v:.12});   // tablones en la repisa
  b.box(.62,.65,.3,.2,.1,.1,PAL.iron,{nb:1});b.box(.62,.72,.3,.16,.1,.06,a.wood,{nb:1});tube(b,[.62,.8,.3],[.82,.8,.3],.015,.015,5,PAL.iron,{nb:1});   // tornillo de banco
  b.box(-.48,.72,.08,.4,.045,.14,vary(a.wood2,.1,781,2),{v:.1});b.box(-.38,.765,.08,.1,.045,.07,a.wood,{nb:1});   // garlopa
  tube(b,[-.1,.72,-.1],[.2,.72,-.1],.02,.02,5,a.wood,{nb:1});b.box(.22,.72,-.1,.12,.08,.07,a.wood2,{nb:1});   // mazo
  b.box(.1,.72,.15,.5,.012,.06,PL(),{nb:1});b.box(.4,.72,.15,.1,.05,.07,a.wood,{nb:1});for(let i=0;i<8;i++)b.box(.12+i*.06,.725,.12,.02,.025,.02,PL(),{nb:1});   // sierra con dientes
  for(let i=0;i<3;i++){b.box(-.2+i*.05,.72,.28,.025,.012,.14,PL(),{nb:1});b.box(-.2+i*.05,.72,.2,.03,.04,.05,a.wood,{nb:1})}   // formones
  [[-.7,.2],[-.55,.3],[.4,.27]].forEach(([x,z],i)=>lump(b,x,.72,z,.08,.015,.05,mix(a.wood2,col('#d2b080'),.5),i));[[-.66,.3],[-.5,.25]].forEach(([x,z],i)=>lump(b,x,0,z,.1,.015,.06,mix(a.wood2,col('#d2b080'),.5),i+4));mossPatch(b,[[.5,-.2,.2,.1]],.01);return b},

 // ESCRITORIO (≈1,2 × 1,07 × 0,68): mesa de escriba con cajones, casillero de rollos, libro abierto, tintero con pluma, pila de libros y una vela encendida (aEmit 1).
 escritorio(o){const b=new B(791),a=A({bk:K(o)});
  [-.52,.52].forEach(x=>[-.24,.24].forEach(z=>b.box(x,0,z,.08,.54,.08,mul(a.wood,.9),{v:.1})));b.box(.4,.04,0,.34,.5,.52,a.wood,{v:.1});[0,1].forEach(i=>{b.box(.4,.08+i*.22,.265,.3,.2,.02,mul(a.wood2,.9),{nb:1});b.box(.4,.17+i*.22,.28,.08,.025,.02,a.acc,{nb:1})});
  b.box(0,.54,0,1.18,.07,.64,a.wood2,{v:.1,jit:.008});b.box(0,.61,-.26,1.14,.34,.12,mul(a.wood,.9),{v:.08});
  for(let i=0;i<7;i++){const x=-.48+i*.16;b.box(x,.7,-.19,.12,.2,.025,col('#15110e'),{nb:1});if(i%2===0)tube(b,[x-.04,.8,-.19],[x+.04,.8,-.19],.04,.04,6,vary(col('#cfc4a0'),.1,791,i),{nb:1})}   // casillero con rollos
  b.box(0,.95,-.26,1.16,.04,.14,a.wood2,{nb:1});
  b.box(-.1,.6,.1,.4,.015,.3,mul(a.cloth,.8),{nb:1,v:.1});b.box(-.1,.615,.1,.36,.02,.26,col('#cfc8a8'),{nb:1,v:.05});b.box(-.1,.63,.1,.012,.012,.26,mul(PAL.timber,1.3),{nb:1});[-.2,.0].forEach(x=>b.box(x,.63,.1,.12,.004,.02,PAL.timber,{nb:1}));   // libro abierto con renglones
  b.cyl(-.42,.6,.18,.04,.045,.06,6,PAL.iron,{nb:1});tube(b,[-.42,.65,.18],[-.34,.8,.14],.006,.003,3,col('#d8d0b8'),{nb:1});   // tintero y pluma
  b.box(.1,.6,.14,.2,.05,.14,dirty('#6a3a30',.6,.6,.1),{v:.1});b.box(.1,.65,.14,.19,.045,.13,dirty('#3a4a50',.6,.6,.1),{v:.1});b.box(.1,.695,.14,.17,.04,.12,dirty('#6a5c36',.6,.6,.1),{v:.1});
  b.cyl(.5,.98,-.26,.03,.03,.1,6,col('#d8d0b0'),{nb:1});b.box(.5,1.07-.02,-.26,.014,.025,.014,FL(),{em:1,nb:1});b.cyl(.5,.95,-.26,.07,.07,.03,6,PAL.iron,{nb:1});
  return b},

 // ALTAR DE REZO (≈1,18 × 1,32 × 0,82): altar de piedra sobre peldaños con mantel de la cultura, estela con símbolo luminoso (aEmit 1), dos velas, cuenco de ofrendas e incienso.
 altarRezo(o){const b=new B(801),a=A({bk:K(o)});
  b.box(0,0,.05,1.14,.1,.7,PAL.stoneD,{v:.1,g:.2,jit:.01});b.box(0,.1,.02,1.0,.06,.6,a.stone,{v:.1,g:.15});b.box(0,.16,0,.9,.4,.4,a.stone,{v:.1,g:.15,jit:.008});b.box(0,.56,0,1.0,.07,.46,a.stone2,{v:.1});
  b.box(0,.63,.0,.46,.014,.46,a.cloth,{nb:1,v:.08});b.box(0,.5,.205,.5,.14,.014,a.cloth,{nb:1,v:.08});b.box(0,.5,.218,.5,.02,.01,a.acc,{nb:1});   // mantel y paño frontal con galón
  b.box(0,.1,-.3,.74,.96,.14,mix(a.stone2,PAL.plaster,.2),{v:.08,g:.15});b.box(0,1.06,-.3,.52,.16,.14,mix(a.stone2,PAL.plaster,.2),{t:.8,v:.1});b.box(0,1.22,-.3,.3,.1,.14,a.stone2,{t:.6,v:.1});   // estela escalonada
  const sym=a.acc;b.box(0,.7,-.225,.06,.4,.02,sym,{em:1,nb:1});b.box(0,.82,-.225,.26,.06,.02,sym,{em:1,nb:1});b.box(0,.95,-.225,.1,.1,.02,mix(sym,col('#ffffff'),.2),{em:1,nb:1,t:.5});   // símbolo luminoso
  [-.38,.38].forEach(x=>{b.cyl(x,.63,.0,.03,.03,.18,6,col('#d8d0b0'),{nb:1});b.cyl(x,.63,.0,.06,.06,.02,6,PAL.iron,{nb:1});b.box(x,.81,.0,.014,.03,.014,FL(),{em:1,nb:1})});
  b.cyl(.0,.63,.1,.1,.06,.06,8,dirty('#8a6a3a',.6,.6,.1),{nb:1});[0,1,2].forEach(i=>lump(b,-.04+i*.04,.68,.1,.04,.03,.04,dirty(['#a04a30','#c8a040','#6a8a4a'][i],.5,.75,.1),i));
  tube(b,[.22,.63,.08],[.22,.7,.08],.025,.025,6,PAL.iron,{nb:1});b.box(.22,.7,.08,.03,.02,.03,col('#ff7a2a'),{em:2,nb:1});mossPatch(b,[[-.35,.3,.3,.1]],.0);return b},

 // LANZAS (≈0,5 × 1,49 × 0,31): soporte de armas con cuatro lanzas apoyadas, puntas de hierro y borlas de tela.
 lanzas(o){const b=new B(811),a=A({bk:K(o)});
  b.box(0,0,0,.5,.05,.26,mul(a.wood,.8),{v:.1});[-.2,.2].forEach(x=>tube(b,[x,.05,-.02],[x,.62,-.02],.025,.022,5,a.wood2,{nb:1}));b.box(0,.5,-.02,.46,.04,.06,a.wood,{nb:1});b.box(0,.26,-.02,.46,.035,.05,a.wood,{nb:1});
  [-.17,-.06,.06,.17].forEach((x,i)=>{const lean=(i-1.5)*.025,top=[x+lean,1.32+(i%2)*.06,.04+(i%2)*.04];tube(b,[x,.03,.08],top,.016,.013,5,vary(a.wood2,.12,811,i),{nb:1});tube(b,top,[top[0]+lean*.1,top[1]+.17,top[2]],.03,.004,4,PL(),{nb:1});
   b.box(top[0]-.02,top[1]-.1,top[2]+.012,.04,.09,.02,mul(a.cloth,.9),{nb:1,t:.6,v:.1})});return b},

 // TÓTEM (≈0,57 × 1,93 × 0,31): poste tallado en tres cuerpos con rostros y alas abiertas, cráneo en lo alto y cintas.
 totem(o){const b=new B(821),a=A({bk:K(o)}),cs=[dirty('#8a3a2a',.55,.55,.15),dirty('#c8a860',.5,.6,.15),dirty('#4a6a7a',.5,.55,.15),mix(a.wood,col('#2a1c14'),.3)];
  b.box(0,0,0,.42,.16,.3,PAL.stoneD,{v:.12,g:.2,jit:.01});
  [[.16,.46,.34,0],[.62,.5,.32,1],[1.12,.4,.3,2]].forEach(([y,h,w,ci],i)=>{b.box(0,y,0,w,h,.26,vary(mul(a.wood,.9),.1,821,i),{v:.1,g:.1,t:.96});const c=cs[ci],cy=y+h*.55;
   b.box(0,cy-.02,.135,w*.8,h*.5,.03,mul(c,.85),{nb:1,v:.1});[-1,1].forEach(sg=>{b.box(sg*w*.2,cy+.02,.158,w*.2,.06,.018,col('#14100e'),{nb:1});b.box(sg*w*.2,cy+.04,.166,.04,.025,.012,mix(c,col('#ffffff'),.3),{nb:1})});   // ojos
   b.box(0,cy-.1,.158,w*.34,.08,.02,col('#14100e'),{nb:1});b.box(0,cy-.05,.162,w*.2,.03,.015,mix(c,col('#ffffff'),.5),{nb:1});b.box(0,cy+.14,.15,w*.7,.05,.02,mul(c,.7),{nb:1})});   // boca, dientes y ceja
  [-1,1].forEach(sg=>{b.box(sg*.2,1.42,0,.2,.03,.16,mul(cs[0],.8),{t:.5,jit:.01,my:sg*.1});b.box(sg*.21,1.5,0,.16,.03,.14,mul(cs[1],.8),{t:.5,my:sg*.1})});   // alas
  b.box(0,1.52,0,.3,.28,.24,cs[3],{v:.1,t:.9});b.box(0,1.66,.125,.22,.14,.02,col('#d8d0b8'),{nb:1,v:.05});b.cyl(0,1.8,0,.12,.1,.12,6,col('#d8d0b8'),{nb:1,v:.08});[-1,1].forEach(sg=>b.box(sg*.045,1.84,.1,.05,.04,.02,col('#14100e'),{nb:1}));   // cráneo
  for(let i=0;i<3;i++)tube(b,[.0,1.46,.14],[(i-1)*.1,1.12-i*.04,.18],.008,.008,3,a.cloth,{nb:1});mossPatch(b,[[0,.16,.3,.1]],.16);return b},

 // ARCO EN RUINAS (≈1,49 × 1,14 × 0,5): dos pilares de sillería, medio arco de dovelas, un bloque caído y escombros cubiertos de musgo.
 arcoRuina(o){const b=new B(831),a=A({bk:K(o)}),c=a.stone,cd=mul(a.stone,.75),PX=.58;
  [[-PX,.62],[PX,.5]].forEach(([x,h],i)=>{b.box(x,0,0,.3,.12,.38,PAL.stoneD,{v:.1,g:.2});for(let j=0;j*.2<h-.1;j++)b.box(x+(j%2?.01:-.01),.12+j*.2,0,.26+(j%2)*.02,Math.min(.2,h-.12-j*.2)-.01,.32,vary(i?cd:c,.2,831,j+i*9),{nb:1,v:.1,g:.1,jit:.01})});
  const cx=0,cy=.62,r0=.46,r1=.64;for(let j=0;j<3;j++){const a0=Math.PI-j*.34,a1=a0-.34;vous(b,cx,cy,r0,r1,a1,a0,.3,vary(j%2?c:cd,.18,831,j))}   // medio arco roto desde el pilar izquierdo
  b.box(-PX,cy-.02,0,.32,.06,.36,PAL.stoneD,{nb:1,v:.1});b.stone(.5,0,.16,.3,.18,.2,cd,{s:1,j:.2});b.stone(.15,0,.14,.2,.12,.16,c,{s:2,j:.2});b.stone(-.2,0,-.14,.24,.1,.18,cd,{s:3,j:.2});lump(b,.3,0,-.12,.16,.08,.14,c,4);lump(b,.7,.5,0,.2,.07,.2,cd,5);
  mossPatch(b,[[-PX,.16,.26,.18],[.5,.16,.3,.14],[0,-.16,.34,.12]],.12);return b},

 // BRASERO (≈0,51 × 0,84 × 0,52): trípode de hierro con cuenco de brasas (aEmit 2). La llama y la luz las pone el juego.
 brasero(o){const b=new B(841),a=A({bk:K(o)});
  for(let i=0;i<3;i++){const an=i*TAU/3+.5;tube(b,[Math.cos(an)*.24,0,Math.sin(an)*.24],[Math.cos(an)*.13,.58,Math.sin(an)*.13],.022,.018,5,PAL.iron,{nb:1})}
  b.cyl(0,.54,0,.15,.22,.14,10,mix(PAL.iron,a.metal,.5),{seg:2,v:.08});b.cyl(0,.68,0,.22,.22,.015,10,PAL.ironL,{nb:1});b.cyl(0,.66,0,.2,.2,.02,10,col('#262120'),{nb:1});
  b.box(0,.67,0,.26,.04,.26,col('#ff7a2a'),{em:2,nb:1,t:.6,jit:.03});b.box(.04,.7,-.03,.14,.03,.14,col('#ffb040'),{em:2,nb:1,t:.6});[-1,1].forEach(sg=>b.box(sg*.26,.64,0,.05,.03,.04,PAL.iron,{nb:1}));return b},

 // TINAJAS (≈1,1 × 0,37 × 0,48): tres vasijas de barro bajas sobre una estera de paja, la central más grande, con tapas de tela.
 tinaja(o){const b=new B(851),a=A({bk:K(o)});
  b.box(0,0,0,1.1,.025,.46,mix(PAL.hay,a.wood2,.3),{v:.1,jit:.01});
  [[-.36,0,.16,.28],[0,.02,.2,.37],[.36,-.02,.15,.26]].forEach(([x,z,r,h],i)=>{const c=vary(CLAY(),.12,851,i);b.cyl(x,.025,z,r*.7,r*.6,h,8,c,{seg:3,bulge:r*.45,j:.03,v:.1});b.cyl(x,.025+h*.86,z,r*.55,r*.55,.03,8,mul(c,.8),{nb:1});b.cyl(x,.025+h,z,r*.5,r*.5,.012,8,i===1?a.cloth:mul(a.cloth2,.8),{nb:1});b.cyl(x,.025+h*.5,z,r*1.02,r*1.02,.025,8,mul(c,.7),{nb:1,bulge:0})});return b},

 // MONUMENTO (≈1,64 × 2,34 × 1,64): base octogonal escalonada, pedestal con placa del bioma, obelisco rematado en esfera de metal y cuatro faroles bajos en las esquinas.
 monumento(o){const b=new B(861),a=A({bk:K(o)}),ph=Math.PI/8;
  b.cyl(0,0,0,.82,.78,.14,8,PAL.stoneD,{ph,v:.1,g:.2,j:.01});b.cyl(0,.14,0,.7,.66,.13,8,a.stone,{ph,v:.1,j:.01});b.cyl(0,.27,0,.5,.46,.12,8,a.stone2,{ph,v:.1});
  b.box(0,.39,0,.56,.5,.56,mix(a.stone,PAL.plaster,.2),{v:.08,g:.15,t:.95});b.box(0,.38,0,.64,.06,.64,a.stone2,{v:.1});b.box(0,.86,0,.62,.07,.62,a.stone2,{v:.1});
  [0,1,2,3].forEach(f=>{const put=(a2,y,dd,wa,h,wd,cl,oo)=>{if(f===0)b.box(a2,y,.28+dd,wa,h,wd,cl,oo);else if(f===1)b.box(-a2,y,-.28-dd,wa,h,wd,cl,oo);else if(f===2)b.box(.28+dd,y,a2,wd,h,wa,cl,oo);else b.box(-.28-dd,y,-a2,wd,h,wa,cl,oo)};
   put(0,.5,.01,.36,.26,.02,mul(a.stone,.55),{nb:1});put(0,.58,.02,.22,.04,.012,a.acc,{nb:1});put(0,.5,.02,.28,.012,.012,mul(a.acc,.8),{nb:1})});   // placas con inscripción
  b.box(0,.93,0,.46,1.2,.46,mix(a.stone2,PAL.plaster,.25),{v:.06,g:.1,t:.62});for(let i=1;i<9;i++)b.box(0,.93+i*.13,0,.47-i*.032,.012,.47-i*.032,PAL.stoneD,{nb:1,t:.99});
  b.box(0,2.13,0,.18,.1,.18,a.stone2,{t:.01,nb:1,v:.08});b.cyl(0,2.1,0,.06,.05,.1,6,a.acc,{nb:1});b.cyl(0,2.2,0,.055,.035,.11,6,mix(a.acc,col('#ffffff'),.15),{nb:1});tube(b,[0,2.31,0],[0,2.34,0],.025,.001,5,a.acc,{nb:1});   // remate
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz],i)=>{tube(b,[sx*.6,.14,sz*.6],[sx*.6,.62,sz*.6],.025,.02,5,PAL.iron,{nb:1});b.box(sx*.6-.04,.62,sz*.6-.04,.08,.02,.08,PAL.iron,{nb:1});b.box(sx*.6-.03,.64,sz*.6-.03,.06,.09,.06,PAL.lamp,{em:1,nb:1});b.box(sx*.6-.045,.73,sz*.6-.045,.09,.02,.09,PAL.iron,{nb:1,t:.5})});
  mossPatch(b,[[.3,.7,.3,.12],[-.6,-.2,.3,.16]],.14);return b}
};

// huella y altura de la malla ORG ACTUAL (ancho x, alto y, fondo z; medida con `node tools/r3d/org_capture.js` el 20 oct 2026; ejes ORG x,z↑,y → three x,y↑,z)
export const OF_FOOT={banco:[1.92,1.36,1.42],tienda:[2.32,1.48,1.27],subastas:[1.90,1.66,1.16],tablon:[.34,1.41,1.64],fogata:[1.34,.20,1.31],horno:[1.03,1.17,.91],yunque:[1.12,.65,.42],armero:[.80,1.24,.78],curtidor:[.63,.91,1.02],alambique:[1.1,.85,.6],
 taller:[1.46,.83,.68],escritorio:[1.20,1.07,.68],altarRezo:[1.18,1.32,.82],lanzas:[.50,1.49,.31],totem:[.57,1.93,.31],arcoRuina:[1.49,1.14,.50],brasero:[.51,.84,.52],tinaja:[1.10,.37,.48],monumento:[1.64,2.34,1.64]};
const GEO=new Map();
export function ofGeo(n,o,th){if(!MODELS[n])return null;const key='dk:of:'+n+'|'+JSON.stringify(o||{});if(GEO.has(key))return GEO.get(key);
 let g=MODELS[n](o||{}).geo();if(o&&(o.rot||o.dir==='y'))g=swapXZ(g);const r={g,key};GEO.set(key,r);return r}
export const OF_NAMES=Object.keys(MODELS);
// casos que mide `pradera_sheet.py --medir`: [nombre, opciones, clave de OF_FOOT]
export function OF_CASES(){const L=[];for(const n of OF_NAMES)for(let k=0;k<9;k++){L.push([n,{bk:k},n]);if(n==='horno')L.push([n,{bk:k,on:1},n])}return L}
// props de PROPS.list que reciben `bk` (bioma de la instancia) en props3d.js (las estaciones llevan `arch`, que ofGeo trata igual)
export const OF_BK=new Set(['lanzas','totem','arcoRuina','brasero','tinaja','monumento']);
// verificador anti-clipping de tejados (ver propsdark3d.js «ANTI-CLIPPING» y tools/r3d/roof_clip_check.py)
export function clipReport(n,o){const b=MODELS[n](o||{});return {clips:b.clips(),roofs:b.R.length}}
