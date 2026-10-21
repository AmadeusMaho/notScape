// NotScape · R3D · FASE 7 (20 oct 2026) · BOSQUE: la aldea de los GUARDIANES (civilización élfica) en el lenguaje oscuro.
// Sustituye los modelos ORG pastel del Bosque (`troncos`, `casaArbol`, `lenera`) y da a la taberna del Bosque su propia silueta (`taberna` con bk 1 → sala de troncos de dos plantas).
// Módulo hermano de `propsdark3d.js`, `propsdark_nat3d.js`, `propsdark_pradera3d.js` y `propsdark_estaciones3d.js`: mismo colector `B`, misma paleta `PAL`, mismas piezas de ventana/farol.
//
// IDENTIDAD (decisión del dueño, 18 oct 2026, «Lote R3D-F2C-DECISION»: «Bosque (élfico/guardianes): madera viva, raíces, hongos y luz verdosa/ámbar suave; sin hierro pesado»):
//  · troncos enteros entrelazados en las esquinas, tejado de tablillas cubierto de musgo, cumbrera y vigas que asoman, cobertizo sobre la puerta, faroles de vaina con luz VERDOSA (aEmit 1);
//  · casa en el árbol: un roble vivo con raíces, plataforma circular, cabaña redonda de tablas con tejado cónico de tablillas, escalera de cuerda y copa de láminas (las mismas de los árboles del juego);
//  · nada de hierro pesado (cerrajería de madera, cuerdas), nada de saturación: el único acento es la luz.
//
// CONTRATO (igual que los otros módulos; lo mide `python3 -I tools/r3d/bosque_sheet.py --medir`):
//  · unidades y ejes de ORG: 1 tile = 1 unidad, y arriba, origen = centro de la huella en el suelo, frente/puerta hacia +z. `o.rot` (espejo x↔z) y `o.dir==='y'` funcionan en todos.
//  · HUELLA Y ALTURA dentro de BO_FOOT ±TOL de la malla ORG que sustituyen (medida el 20 oct 2026 con Chromium sobre `ORG.capture`, ×2,76 las casas y ×2,3 el resto): la colisión `fp` NO cambia.
//  · aEmit: 1 = ventana/farol que se enciende de noche · 4 = brasa de chimenea (casi apagada de día).
//  · `o.v` (0..4, lo inyecta layouts.js en las casas de troncos) = VARIANTE de forma: 0 base · 1 anexo trasero · 2 buhardilla + chimenea · 3 leñero lateral · 4 chimenea de piedra.
//  · `o.bk` (lo inyecta props3d.js solo en `lenera` y `taberna`) = bioma de la instancia: `lenera` usa la tabla ARQ (REGLA PERMANENTE: cada prop nuevo vale para los 9 biomas, una fila por bioma, nunca un `if`);
//    `taberna` solo se rehace aquí con bk 1 (los otros biomas siguen con la taberna de la Pradera hasta su fase).
//  · DETERMINISTA: todo el azar sale de `hash` con semillas por modelo.
import * as THREE from 'three';
import {B,hash,vary,mix,mul,col,dirty,PAL,windowAt,lanternAt,chimney,mossPatch,swapXZ} from './propsdark3d.js';
import {tube,stepCone,TAU,clamp,A} from './propsdark_pradera3d.js';

export const TOL=.22;
const LG=col('#d2e0a0');   // luz verdosa de las vainas (la «luz élfica»); el resto de ventanas sigue ámbar (PAL.glass)

// dependencias de nature3d.js inyectadas por props3d.js (cardGeo para la copa): así el módulo carga en Node para `--medir` (sin láminas)
let DEP=null;export function initBosque(d){DEP=d}

// ───────────────── piezas ─────────────────
// farol de vaina: un capullo de tablillas colgado de una cuerda, con luz verdosa (aEmit 1)
function podLamp(b,x,y,z,s=1){b.beam([x,y+.12*s,z],[x,y+.3*s,z],.014,PAL.rope);b.box(x,y,z,.075*s,.15*s,.075*s,LG,{em:1,nb:1,t:.5});b.box(x,y+.14*s,z,.06*s,.03*s,.06*s,PAL.timber,{t:.6});b.box(x,y-.025*s,z,.06*s,.03*s,.06*s,PAL.timber,{t:1.3})}
// cuatro paredes de troncos enteros entrelazados en las esquinas (la receta de la ermita, `CHURCH.troncos`)
function logWalls(b,x0,z0,Y0,rows,r,wc,sd){const pit=r*1.86;
 for(let i=0;i<rows;i++){const y=Y0+r+i*pit,top=i===rows-1,ex=i%2||top?0:.2,ez=i%2&&!top?.2:0;   // la última hilada no sobresale: sus puntas asomarían por el faldón (R3D-ANTICLIP)
 
  [-1,1].forEach((sg,k)=>{tube(b,[-x0-ex,y,sg*z0],[x0+ex,y,sg*z0],r,r,6,vary(wc,.14,sd,i*4+k),{v:.1});tube(b,[sg*x0,y,-z0-ez],[sg*x0,y,z0+ez],r,r,6,vary(wc,.14,sd,i*4+k+2),{v:.1})})}
 return pit}
// puerta de tablones entre dos jambas gruesas, tiras de madera (sin hierro), dintel y piedra de umbral; cobertizo de tablillas encima
function logDoor(b,dx,zf,Y0,dh,roof,sd){const w=.44;
 b.box(dx,Y0,zf-.02,w+.2,dh+.08,.11,PAL.timber,{nb:1});b.box(dx,Y0,zf+.035,w,dh,.04,PAL.door,{nb:1,v:.12});
 for(let i=1;i<4;i++)b.box(dx-w/2+i*w/4,Y0,zf+.06,.012,dh,.01,PAL.plankD,{nb:1});
 [.22,.66].forEach(f=>b.box(dx,Y0+dh*f,zf+.065,w*.94,.05,.014,PAL.timberL,{nb:1}));b.box(dx+w*.3,Y0+dh*.5,zf+.075,.05,.05,.02,PAL.rope,{nb:1});
 b.stone(dx,0,zf+.22,.74,.07,.34,PAL.stone,{s:sd});
 // cobertizo: dos ménsulas y un faldón inclinado de tablillas
 const hy=Y0+dh+.04,ctr=[dx,hy,zf+.2];[-1,1].forEach(s=>b.beam([dx+s*.32,hy-.2,zf+.05],[dx+s*.32,hy+.02,zf+.34],.05,PAL.timberL));
 b.quad([dx-.46,hy+.14,zf-.02],[dx+.46,hy+.14,zf-.02],[dx+.5,hy-.01,zf+.36],[dx-.5,hy-.01,zf+.36],mul(roof,1.05),0,[dx,hy-1,zf]);
 b.quad([dx-.5,hy-.04,zf+.36],[dx+.5,hy-.04,zf+.36],[dx+.46,hy+.11,zf-.02],[dx-.46,hy+.11,zf-.02],mul(roof,.4),0,[dx,hy+1,zf]);
 b.box(dx,hy-.02,zf+.36,1.0,.03,.04,mul(roof,.6),{nb:1})}
// tejado de tablillas con cumbrera de tronco que asoma y hastiales de troncos cortos
function logRoof(b,W,D,gh,GH,wc,roof,sd){
 b.gable(0,gh+.04,0,W+.1,D+.1,GH-.04,.22,roof,{rows:7,v:.26});   // +.04: el faldón arranca sobre la última hilada (el tronco redondo no debe asomar)
 [-1,1].forEach(s=>{const x=s*(W/2+.04);b.tri([x,gh,-D/2],[x,gh,D/2],[x,gh+GH*.92,0],mix(wc,PAL.timber,.35),0,[x*.9,gh+.2,0])});
 b.exempt(()=>{tube(b,[-W/2-.36,gh+GH,0],[W/2+.36,gh+GH,0],.06,.05,6,mix(wc,PAL.timberL,.3),{v:.1});});   // cumbrera: un tronco que asoma por los dos hastiales
 b.exempt(()=>{for(let i=0;i<6;i++){const x=-W/2+.18+i*(W-.36)/5;[-1,1].forEach(s=>tube(b,[x,gh-.02,s*(D/2+.12)],[x,gh-.06,s*(D/2+.3)],.032,.026,5,PAL.timber,{nb:1}))}})}   // colas de cabrios bajo el alero

// ───────────────── cabaña de troncos (también la base de la taberna) ─────────────────
// W×D = planta de los troncos; rows = hiladas; GH = altura del tejado; dx = x de la puerta; sd = semilla
function cabin(b,{W,D,rows,GH,dx,wc,roof,sd,wins}){const Y0=.1,r=.09,x0=W/2,z0=D/2,dark=mul(wc,.55);
 b.box(0,0,0,W+.14,Y0,D+.14,PAL.stoneD,{v:.12,g:.25,jit:.01});
 const pit=logWalls(b,x0,z0,Y0,rows,r,wc,sd),H=rows*pit;b.box(0,Y0,0,W-.08,H,D-.08,dark,{nb:1});
 const zf=z0+r;logDoor(b,dx,zf,Y0,Math.min(.74,H*.72),roof,sd+9);
 (wins||[]).forEach(([ax,u,fy,w,h,s,lit])=>{if(ax==='z')windowAt(b,'z',u,Y0+H*fy,zf+.005,w,h,s,lit??.85,1);else windowAt(b,'x',x0+r+.005,Y0+H*fy,u,w,h,s,lit??.85,1)});
 podLamp(b,dx+.46,Y0+H*.5,zf+.1,1);
 const gh=Y0+H;logRoof(b,W,D,gh,GH,wc,roof,sd);
 mossPatch(b,[[-.8,zf+.2,.4,.2],[.5,zf+.2,.32,.16],[-x0-.04,-.2,.1,.4]],Y0);
 return {Y0,H,gh,x0,z0,r,pit,zf}}

// techo de una sola agua a lo largo de x (anexo trasero / leñero): del muro (y alto) hacia fuera y abajo (y bajo)
function leanTo(b,x0,x1,zWall,zOut,yHi,yLo,c){const ctr=[(x0+x1)/2,(yHi+yLo)/2-1,(zWall+zOut)/2];
 b.quad([x0,yHi,zWall],[x1,yHi,zWall],[x1,yLo,zOut],[x0,yLo,zOut],mul(c,1.04),0,ctr);b.quad([x0,yLo-.04,zOut],[x1,yLo-.04,zOut],[x1,yLo-.03,zOut],[x0,yLo-.03,zOut],mul(c,.4),0);
 b.quad([x1,yHi-.05,zWall],[x0,yHi-.05,zWall],[x0,yLo-.05,zOut],[x1,yLo-.05,zOut],mul(c,.4),0,[(x0+x1)/2,yHi+1,(zWall+zOut)/2])}

// ═════════ MODELOS ═════════
const MODELS={
 // TRONCOS (≈2,68 × 2,10 × 2,15; fp 32×25 px; `v` 0..4 = variante): cabaña de troncos entrelazados con tejado de tablillas y musgo, cobertizo en la puerta y faroles de vaina.
 troncos(o){const v=(o.v|0)%5,b=new B(401+v),W=2.2,D=1.6,wc=dirty(o.wall||'#a8784a',.38,.5,.2),roof=dirty(o.roof||'#5f8a46',.3,.4,.14),dx=-.31;
  const k=cabin(b,{W,D,rows:v===2?7:6,GH:.85,dx,wc,roof,sd:401+v*7,wins:[['x',-.25,.6,.34,.4,3],['x',.42,.6,.34,.4,5,.8],['z',.5,.6,.34,.4,7]]}),{Y0,H,gh,x0,z0,r,zf}=k;
  if(v===1){   // anexo trasero de una agua (cobertizo de aperos)
   const aw=W*.62,ad=.66,ah=.72,cz=-z0-ad/2+.02,Z1=-z0-ad;b.box(0,Y0,cz,aw-.06,ah,ad-.06,mul(wc,.55),{nb:1});
   for(let i=0;i<4;i++){const y=Y0+r*.9+i*r*1.8;tube(b,[-aw/2,y,Z1],[aw/2,y,Z1],r*.9,r*.9,6,vary(wc,.14,402,i),{v:.1});[-1,1].forEach((sg,j)=>tube(b,[sg*aw/2,y,Z1-.04],[sg*aw/2,y,-z0+.02],r*.9,r*.9,6,vary(wc,.14,402,i*3+j+9),{v:.1}))}
   leanTo(b,-aw/2-.14,aw/2+.14,-z0+.0,Z1-.16,Y0+ah+.34,Y0+ah-.02,roof);b.box(0,Y0,Z1-.02,.5,.55,.05,PAL.door,{nb:1})}
  if(v===2){   // buhardilla con ventana y chimenea de piedra
   b.exempt(()=>{const cx=.5,zc=z0+.02,ye=gh+.35,yr=gh+.4+.34;b.box(cx,gh+.02,zc,.6,.36,.42,mul(wc,.8),{v:.06});
   [1,-1].forEach(sg=>{const a=[cx+sg*.4,ye,zc-.22],b2=[cx+sg*.4,ye,zc+.28],c=[cx,yr,zc+.28],d=[cx,yr,zc-.22];sg>0?b.quad(b2,a,d,c,mul(roof,.95),0):b.quad(a,b2,c,d,mul(roof,.8),0)});
   b.tri([cx-.31,gh+.38,zc+.2],[cx+.31,gh+.38,zc+.2],[cx,yr-.04,zc+.2],mix(wc,PAL.timber,.3),0);windowAt(b,'z',cx,gh+.32,zc+.215,.24,.26,12,.9,0);   // la buhardilla atraviesa el tejado a propósito
   chimney(b,-W*.32,gh+.3,-D*.18,.7,2)})}
  if(v===3){   // leñero lateral con montón de leña
   const lx=x0+.3;b.box(lx,0,0,.5,.04,1.0,PAL.plankD,{nb:1});[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,c])=>b.beam([lx+a*.21,.0,c*.45],[lx+a*.21,.82,c*.45],.06,PAL.timber));
   for(let rr=0;rr<4;rr++)for(let i=0;i<5-Math.min(rr,2);i++)tube(b,[lx-.17,.08+rr*.15,-.4+i*.17+rr*.02],[lx+.18,.08+rr*.15,-.4+i*.17+rr*.02],.065,.065,6,mix(PAL.timberL,PAL.stoneD,hash(403,i,rr)*.5),{ph:hash(403,rr,i)});
   {const xa=x0+.02,xb=lx+.3,ya=.98,yb=.8,ctr=[lx,.4,0];b.quad([xa,ya,-.52],[xa,ya,.52],[xb,yb,.52],[xb,yb,-.52],mul(roof,1.05),0,[lx,-1,0]);b.quad([xb,yb-.04,-.52],[xb,yb-.04,.52],[xa,ya-.04,.52],[xa,ya-.04,-.52],mul(roof,.4),0,[lx,2,0]);}}   // faldón de una agua: del muro hacia fuera
  if(v===4)b.exempt(()=>{chimney(b,-W*.34,gh+.28,-.05,.72,3);chimney(b,W*.36,gh+.2,.0,.5,4,false)})
  return b},

 // CASA EN EL ÁRBOL (≈3,09 × 4,66 × 2,84; fp 17×17 px): roble vivo con raíces que se abren, plataforma circular con barandilla de cuerda, cabaña redonda de tablas con tejado cónico
 // de tablillas, escalera de cuerda y copa de láminas (las de los árboles del juego, `cards`).
 casaArbol(o){const b=new B(411),bark=dirty('#6a4a30',.4,.55,.2),bark2=dirty('#4e3624',.4,.5,.15),wood=dirty('#a8784a',.38,.5,.2),roof=dirty('#5f8a46',.3,.4,.14),PY=1.72,PR=1.05;
  // tronco: cilindro rugoso que se afina, con 5 raíces que se abren al suelo
  b.cyl(0,0,0,.5,.34,3.55,9,bark,{seg:6,j:.1,v:.16,g:.25});
  for(let i=0;i<5;i++){const a=i/5*TAU+.4+hash(411,i,1)*.5,L=.78+hash(411,i,2)*.3;tube(b,[Math.cos(a)*.28,.55,Math.sin(a)*.28],[Math.cos(a)*L,-.02,Math.sin(a)*L],.2,.07,5,vary(bark2,.14,411,i),{v:.1,nb:1})}
  // ramas gruesas que salen sobre la plataforma
  const lim=[[1.3,3.55,.35],[-1.15,3.8,-.5],[.2,3.95,-1.25],[-1.2,3.45,.85]];lim.forEach((p,i)=>tube(b,[0,2.9+i*.14,0],p,.16,.06,6,vary(bark2,.14,411,i+9),{v:.1}));
  // plataforma: tablas radiales, aro de troncos y vigas que la sujetan al tronco
  const nP=14;b.cyl(0,PY-.02,0,PR,PR,.12,nP,wood,{seg:1,v:.2,j:.02});
  for(let i=0;i<nP;i++){const a=i/nP*TAU,a2=(i+1)/nP*TAU;tube(b,[Math.cos(a)*PR,PY-.04,Math.sin(a)*PR],[Math.cos(a2)*PR,PY-.04,Math.sin(a2)*PR],.055,.055,5,vary(PAL.timberL,.2,411,i+20),{v:.1,nb:1})}
  for(let i=0;i<5;i++){const a=i/5*TAU+.3;tube(b,[Math.cos(a)*.4,PY-.9,Math.sin(a)*.4],[Math.cos(a)*(PR*.86),PY-.05,Math.sin(a)*(PR*.86)],.05,.04,5,PAL.timber,{v:.1,nb:1})}
  // barandilla de postes y cuerda (hueco hacia +z para la escalera)
  const nR=12;for(let i=0;i<nR;i++){const a=i/nR*TAU+.26,ax=Math.cos(a)*(PR-.06),az=Math.sin(a)*(PR-.06),a2=(i+1)/nR*TAU+.26,bx=Math.cos(a2)*(PR-.06),bz=Math.sin(a2)*(PR-.06),gap=az>.78&&Math.abs(ax)<.42;
   tube(b,[ax,PY+.1,az],[ax,PY+.55,az],.028,.024,5,PAL.timber,{nb:1});if(!gap&&!(bz>.78&&Math.abs(bx)<.42))tube(b,[ax,PY+.46,az],[bx,PY+.46,bz],.014,.014,4,PAL.rope,{nb:1})}
  // cabaña redonda: paredes de tablas verticales (8 caras), puerta hacia +z, ventanas con luz, tejado cónico
  const R0=.64,HW=.82,y0=PY+.1,n=8,ph=Math.PI/8;b.cyl(0,y0,0,R0,R0-.04,HW,n,mul(wood,.7),{seg:1,v:.2,ph});
  for(let k=0;k<n;k++){const a0=ph+k/n*TAU,a1=ph+(k+1)/n*TAU,m=(a0+a1)/2,r=R0+.012;for(let j=0;j<3;j++){const aa=a0+(a1-a0)*(j+.5)/3,bb=(a1-a0)/3;b.box(Math.cos(aa)*r,y0,Math.sin(aa)*r,bb*r*.92,HW*(.95+hash(411,k*3+j,3)*.05),.03,vary(wood,.18,411,k*3+j),{nb:1,my:-aa+Math.PI/2,t:.97})}
   if(k!==2&&k!==6){const wx=Math.cos(m)*(R0+.03),wz=Math.sin(m)*(R0+.03),on=hash(411,k,9)<.8?1:0;b.box(wx,y0+.3,wz,.2,.22,.04,on?PAL.glass:mix(PAL.glass,col('#1c2326'),.97),{em:on,nb:1,my:-m+Math.PI/2});b.box(wx,y0+.27,wz,.26,.04,.06,PAL.timber,{nb:1,my:-m+Math.PI/2})}}
  b.box(0,y0,R0*.995,.34,.62,.07,PAL.timber,{nb:1});b.box(0,y0,R0+.04,.26,.56,.03,PAL.door,{nb:1,v:.1});podLamp(b,.3,y0+.52,R0+.1,.9);
  b.box(0,y0+HW-.03,0,R0*2+.2,.06,R0*2+.2,PAL.timber,{t:.9,nb:1});stepCone(b,0,y0+HW,0,R0+.3,.8,n,ph,7,roof,{lip:.03,v:.22,sag:.2});tube(b,[0,y0+HW+.76,0],[0,y0+HW+1.02,0],.03,.015,5,PAL.timberL,{nb:1});b.box(0,y0+HW+.98,0,.07,.09,.07,LG,{em:1,nb:1,t:.5});
  // escalera de cuerda: dos cuerdas y peldaños de madera, desde el borde hasta el suelo
  [-.17,.17].forEach(s=>tube(b,[s+.0,PY+.4,PR-.04],[s,.0,PR+.18],.014,.014,4,PAL.rope,{nb:1}));
  for(let i=0;i<8;i++){const t=(i+.5)/8,y=PY+.36-t*(PY+.34),z=PR-.04+(PR+.18-(PR-.04))*t;tube(b,[-.2,y,z],[.2,y,z],.022,.022,5,PAL.timberL,{nb:1})}
  mossPatch(b,[[.55,.55,.42,.18],[-.5,.4,.3,.2]],.0);
  // copa: láminas «mata» (en `cards`, ver bosqueGeo) sobre las puntas de las ramas
  const cl=lim.map(p=>[p[0],p[1]+.3,p[2],.78,13]);cl.push([0,4.3,-.1,1.0,18]);b.cl=cl;
  return b}
,
 // LEÑERA (≈0,92 × 0,53 × 0,67; fp 10×8 px; por bioma, tabla ARQ): pila de leños al abrigo de un cobertizo de tablillas.
 lenera(o){const b=new B(431),a=A(o);[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([s,c])=>b.beam([s*.36,0,c*.24],[s*.36,.46+(c>0?0:.07),c*.24],.045,a.wood));
  b.box(0,0,0,.76,.03,.5,mul(a.wood,.7),{nb:1});
  for(let r=0;r<3;r++)for(let i=0;i<4-r;i++)tube(b,[-.3+i*.17+r*.085,.07+r*.14,-.18],[-.3+i*.17+r*.085,.07+r*.14,.2],.065,.065,6,mix(a.wood2,mul(a.wood,.8),hash(431,i,r)*.6),{ph:hash(431,r,i)});
  b.quad([-.42,.55,-.3],[.42,.55,-.3],[.44,.46,.3],[-.44,.46,.3],mul(a.roof,1.1),0,[0,.2,0]);b.quad([-.44,.43,.3],[.44,.43,.3],[.42,.52,-.3],[-.42,.52,-.3],mul(a.roof,.4),0,[0,2,0]);
  return b},
 // TABERNA DEL BOSQUE (≈2,88 × 3,0 × 2,03; fp 41×31 px; solo bk 1): sala larga de troncos de dos plantas, la de arriba en voladizo, letrero de tablilla tallada y faroles de vaina.
 taberna(o){const b=new B(421),W=2.3,D=1.4,wc=dirty(o.wall||'#c9a878',.5,.36,.22),roof=dirty(o.roof||'#3f6a3a',.3,.4,.14),dx=.69,Y0=.12,r=.09,pit=r*1.86,x0=W/2,z0=D/2,J=.1;
  b.box(0,0,0,W+.16,Y0,D+.16,PAL.stoneD,{v:.12,g:.25,jit:.01});const rows1=6,H1=rows1*pit;b.box(0,Y0,0,W-.08,H1,D-.08,mul(wc,.55),{nb:1});logWalls(b,x0,z0,Y0,rows1,r,wc,421);
  const y1=Y0+H1;b.box(0,y1,0,W+J*2,.09,D+J*2,PAL.timber,{v:.1});for(let i=0;i<8;i++)tube(b,[-W/2+.1+i*(W-.2)/7,y1-.03,z0],[-W/2+.1+i*(W-.2)/7,y1+.02,z0+J],.035,.035,5,PAL.timberL,{nb:1});   // vigas del voladizo
  const x2=x0+J-.02,z2=z0+J-.02,rows2=5,H2=rows2*pit,Y2=y1+.09;b.box(0,Y2,0,W+J*2-.12,H2,D+J*2-.12,mul(wc,.55),{nb:1});
  for(let i=0;i<rows2;i++){const y=Y2+r+i*pit,top=i===rows2-1,ex=i%2||top?0:.18,ez=i%2&&!top?.18:0;[-1,1].forEach((sg,k)=>{tube(b,[-x2-ex,y,sg*z2],[x2+ex,y,sg*z2],r,r,6,vary(wc,.14,422,i*4+k),{v:.1});tube(b,[sg*x2,y,-z2-ez],[sg*x2,y,z2+ez],r,r,6,vary(wc,.14,422,i*4+k+2),{v:.1})})}
  const zf=z0+r;logDoor(b,dx,zf,Y0,.72,roof,5);
  windowAt(b,'z',-W*.28,Y0+H1*.62,zf+.005,.5,.46,31,1,1);windowAt(b,'x',x0+r+.005,Y0+H1*.62,-.45,.42,.44,32,.9,1);windowAt(b,'x',x0+r+.005,Y0+H1*.62,.42,.42,.44,33,.9,1);
  windowAt(b,'z',-W*.3,Y2+H2*.55,z2+r+.005,.42,.4,34,.9,1);windowAt(b,'z',W*.14,Y2+H2*.55,z2+r+.005,.42,.4,35,.9,1);windowAt(b,'x',x2+r+.005,Y2+H2*.55,0,.4,.4,36,.9,1);
  podLamp(b,dx+.46,Y0+H1*.72,zf+.1,1.1);
  // letrero: ménsula de madera, tablilla tallada y vaina de luz
  b.beam([-W*.02,Y2-.12,z2+r+.02],[-W*.02,Y2-.12,z2+r+.34],.05,PAL.timberL);b.box(-W*.02,Y2-.5,z2+r+.2,.05,.32,.3,PAL.plank,{v:.1});b.box(-W*.02,Y2-.49,z2+r+.2,.02,.22,.22,mix(PAL.thatch,LG,.18),{nb:1});podLamp(b,-W*.02,Y2-.2,z2+r+.34,.8);
  const gh=Y2+H2;logRoof(b,W+J*2-.1,D+J*2-.1,gh,.95,wc,roof,421);
  b.exempt(()=>chimney(b,-W*.3,gh+.3,-.2,.78,6));mossPatch(b,[[-.8,zf+.2,.4,.2],[.5,zf+.2,.3,.2]],Y0);return b}
};

// huella y altura de la malla ORG ACTUAL (ancho x, alto y, fondo z; ORG.capture ×2,76 en casas y ×2,3 en el resto, 20 oct 2026)
export const BO_FOOT={troncos:[2.68,2.10,2.15],'troncos:1':[2.68,2.10,2.73],'troncos:2':[2.68,2.51,2.15],'troncos:3':[2.68,2.10,2.79],'troncos:4':[2.68,2.21,2.21],casaArbol:[3.09,4.66,2.84],lenera:[.92,.53,.67],taberna:[2.88,3.0,2.03]};
// puertas: centro de la puerta en el marco local SIN rot (x a lo largo de la fachada, z = plano de la puerta), ancho y alto. troncos: x = -0,31 para coincidir con el punto de entrada de interiors.js (`DM`), como la ermita.
export const BO_DOOR={troncos:{x:-.31,z:.8+.09+.035,w:.44,h:.6},'taberna@1':{x:.69,z:.85+.09+.035,w:.44,h:.72}};
// espejo x↔z de las láminas de la copa (como `swapXZ`, pero sin exigir `aEmit` y con `uv`): se invierte el orden de los vértices de cada triángulo
function swapCards(g){const p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setX(i,z);p.setZ(i,x);if(n){const nx=n.getX(i),nz=n.getZ(i);n.setX(i,nz);n.setZ(i,nx)}}
 if(g.index){const I=g.index.array;for(let i=0;i<I.length;i+=3){const t=I[i+1];I[i+1]=I[i+2];I[i+2]=t}g.index.needsUpdate=true}
 else for(let i=0;i<p.count;i+=3)for(const k in g.attributes){const a=g.attributes[k],sz=a.itemSize;for(let c=0;c<sz;c++){const t=a.array[(i+1)*sz+c];a.array[(i+1)*sz+c]=a.array[(i+2)*sz+c];a.array[(i+2)*sz+c]=t}}
 g.computeBoundingBox();g.computeBoundingSphere();return g}
const GEO=new Map();
export function bosqueGeo(n,o,th){if(!MODELS[n])return null;if(n==='taberna'&&!(o&&o.bk===1))return null;const key='dk:bo:'+n+'|'+JSON.stringify(o||{});if(GEO.has(key))return GEO.get(key);
 const m=MODELS[n](o||{});let g=m.geo(),cards=null;
 if(m.cl&&DEP){const V=THREE.Vector3,cs=[],cen=new V(0,3.5,0),sd=411;m.cl.forEach(([x,y,z,rr,k],ci)=>{const c=new V(x,y,z);for(let i=0;i<k;i++){const u=hash(i,1,sd+ci*7),v=hash(i,2,sd+ci*7),th2=u*TAU,ph=Math.acos(1-v*1.6),nn=new V(Math.sin(ph)*Math.cos(th2),Math.cos(ph),Math.sin(ph)*Math.sin(th2));
    let s=new V(0,1,0).cross(nn);if(s.lengthSq()<1e-3)s.set(1,0,0);s.normalize();const d=nn.clone().cross(s).normalize(),sz=rr*(.95+hash(i,3,sd)*.5);nn.y*=.8;cs.push({p0:c.clone().addScaledVector(nn,rr*.6).addScaledVector(d,-sz*.5),d,s,L:sz,H:sz,droop:0})}});
  cards={g:DEP.cardGeo(cs,['#14301f','#2f5a34','#86a04a'],()=>cen,()=>1.9),tex:'mata'};if(o&&(o.rot||o.dir==='y'))swapCards(cards.g)}
 if(o&&(o.rot||o.dir==='y'))g=swapXZ(g);const r={g,key,cards};GEO.set(key,r);return r}
export const BO_NAMES=Object.keys(MODELS);
// nombres que reciben `bk` en props3d.js (la taberna solo se usa aquí con bk 1)
export const BO_BK=new Set(['lenera','taberna']);
// casos que mide `bosque_sheet.py --medir`: [nombre, opciones, clave de BO_FOOT]
export function BO_CASES(){const L=[];for(let v=0;v<5;v++)L.push(['troncos',{v,wall:'#a8784a',roof:'#5f8a46'},v?'troncos:'+v:'troncos']);L.push(['casaArbol',{},'casaArbol']);for(let k=0;k<9;k++)L.push(['lenera',{bk:k},'lenera']);L.push(['taberna',{bk:1,wall:'#c9a878',roof:'#3f6a3a'},'taberna']);return L}

// verificador anti-clipping de tejados (ver propsdark3d.js «ANTI-CLIPPING» y tools/r3d/roof_clip_check.py)
export function clipReport(n,o){const b=MODELS[n](o||{});return {clips:b.clips(),roofs:b.R.length}}
