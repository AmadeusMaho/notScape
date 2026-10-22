// NotScape · R3D · ISLA-3 (21 oct 2026) · EL CIELO: arquitectura GRIEGA de MÁRMOL (isla del tutorial / bioma Cielo). Plan: docs/PLAN_ISLA_CIELO.md §1–§2 y §3.4.
// Módulo hermano de `propsdark3d.js`, `propsdark_nat3d.js`, `propsdark_pradera3d.js`, `propsdark_estaciones3d.js` y `propsdark_bosque3d.js`: mismo colector `B`, misma firma (`cieloGeo` → {g,key}), mismo contrato.
//
// TÉCNICA DE LAS ROCAS (Lote R3D-TG-PROTO/TG-SUAVE, decisión del dueño 21 oct: «los props griegos tienen que ser de mármol con la técnica nueva de las rocas»):
//  · TODO el mármol son BLOQUES SUELTOS con las aristas REDONDEADAS (`B.bevel`/`B.course`, normales repartidas entre caras vecinas), cada uno con su tono propio (`marble()`): nunca una caja lisa con juntas pintadas.
//  · Las columnas son tambores ESTRIADOS (acanaladuras = radio alterno) apilados, cada tambor con su tono; capitel dórico (equino + ábaco de bloque).
//  · props3d.js los dibuja con el material `matRock` (sombreado continuo `soft`, SIN textura procedural de grietas/celdas) y contorno fino de roca (.012): `CI_ROCK` lista los nombres.
//  · Acentos: dorado `#e8cf94`-apagado (friso, braseros), terracota (tejados y ánforas); el mármol es cálido (`#ece6d6`…`#f6f2e8`) para leerse bajo la hora dorada y no ser un blanco plano.
//
// CONTRATO: 1 tile = 1 unidad, y arriba, origen = centro de la huella en el suelo, frente/puerta hacia +z (props3d.js lo escala ×PROP_K=1,5). `o.rot` (espejo x↔z) funciona en todos. DETERMINISTA (hash por modelo).
//  · Los edificios largos (templo, propíleos) se construyen con la cumbrera a lo largo de X y se espejan x↔z al final (`swapXZ`): así el frontón queda mirando a +z y el tejado usa `B.gable` (regla ANTICLIP, `clipReport`).
//  · aEmit 3/4 = brasas y llama del brasero (se ven de día y de noche); no hay ventanas.
//  · `o.ruins` (templo, propileos, estatuaAlada, columna): versión del Cielo en RUINAS (endgame, Fase 53). `o.lit` (braseroG, def. 1): 0 = apagado (el ritual del tutorial lo enciende).
import * as THREE from 'three';
import {B,hash,vary,mix,mul,col,swapXZ} from './propsdark3d.js';
import {tube} from './propsdark_pradera3d.js';

export const TOL=.22;
const TAU=Math.PI*2;
const MA=col('#d9d2c0'),MB=col('#e8e3d4'),GOLD=col('#c9a95e'),GOLDL=col('#e2c880'),TERRA=col('#b3664b'),DK=col('#352f28'),COAL=col('#d9661c'),FLAME=col('#ffb347');
const marble=(sd,i,v=.04)=>vary(mix(MA,MB,hash(sd,i,5)),v,sd,i);   // un tono propio por bloque (mármol real: unos más cálidos, otros más fríos)
// bloque de mármol con bisel redondeado (la pieza de las rocas/mampostería nueva)
const mblk=(b,cx,y0,cz,w,h,d,sd,o={})=>b.bevel(cx,y0,cz,w,h,d,marble(sd,b.n),{r:o.r??.022,g:o.g??.12,my:o.my||0,nb:o.nb,em:o.em});

// sólido de revolución facetado (columnas, capiteles, ánforas, cuerpo de la estatua, cuenco…). prof = [[radio,y],…] ascendente; `fl` = acanalado (radio alterno ·fl → 2n facetas); c = color o (i,k)=>color.
function lathe(b,cx,y0,cz,prof,n,c,o={}){const fl=o.fl,m=fl?2*n:n,sd=o.sd||b.seed,jag=o.jag||0,top=o.top!==false,last=prof.length-1;
 const Pt=(k,i)=>{const [r,y]=prof[i],a=k/m*TAU+(o.ph||0),rr=r*(fl&&k%2?fl:1),jy=jag&&i===last?jag*(hash(sd,k%m,3)-.5):0;return[cx+Math.cos(a)*rr,y0+y+jy,cz+Math.sin(a)*rr]};
 for(let i=0;i<last;i++){const ctr=[cx,y0+(prof[i][1]+prof[i+1][1])/2,cz];for(let k=0;k<m;k++){const cl=typeof c==='function'?c(i,k):vary(c,o.v??.03,sd,(fl?k>>1:k)+i*17);b.quad(Pt(k,i),Pt(k+1,i),Pt(k+1,i+1),Pt(k,i+1),fl&&k%2?mul(cl,.9):cl,o.em||0,ctr)}}
 if(top){const yc=y0+prof[last][1],ctr=[cx,yc-.02,cz],cc=typeof c==='function'?c(last-1,0):c;for(let k=0;k<m;k++)b.tri([cx,yc+(o.dome||0),cz],Pt(k,last),Pt(k+1,last),o.capEm?o.capCol:mul(cc,1.05),o.capEm||0,ctr)}}
// gradas: n escalones de bloques; el de arriba mide w×d y cada uno inferior crece `grow` por lado
function steps(b,cx,cz,w,d,n,sh,grow,sd,y0=0){for(let i=0;i<n;i++){const g=(n-1-i)*grow;mblk(b,cx,y0+i*sh,cz,w+2*g,sh+.002,d+2*g,sd+i,{r:.016,nb:i>0})}return y0+n*sh}
// columna dórica de tambores estriados (H = altura total, r = radio inferior). cut<1 = columna ROTA (se corta a esa fracción del fuste, borde irregular, sin capitel). Devuelve la altura del ábaco.
function column(b,x,z,y0,H,r,sd,cut=1){const Hs=H*.9,Ht=Hs*cut,nd=Math.max(1,Math.ceil(3*cut)),dh=Ht/nd,rad=t=>r*(1-.2*t);
 for(let i=0;i<nd;i++){const t0=i*dh/Hs,t1=(i+1)*dh/Hs,last=i===nd-1;lathe(b,x,y0+i*dh,z,[[rad(t0),0],[rad(t1),dh]],9,marble(sd,i),{fl:.88,sd:sd+i*3,jag:last&&cut<1?r*.9:0,top:last})}
 if(cut<1)return y0+Ht;const rt=rad(1),eh=H*.045;
 lathe(b,x,y0+Hs,z,[[rt,0],[rt*1.03,H*.012],[rt*1.38,eh]],9,marble(sd,9),{sd:sd+9});mblk(b,x,y0+Hs+eh,z,rt*3.1,H*.04,rt*3.1,sd+11,{r:.012,nb:1});
 return y0+Hs+eh+H*.04}
// pluma/hoja plana de mármol: contorno de 5 puntos (raíz estrecha, vientre ancho, punta) en el plano (dir, side), con grosor `th`, caras y canto; ctr orienta las normales hacia fuera
function leaf(b,root,dir,side,len,wid,th,c){const P=(u,w)=>[root[0]+dir[0]*len*u+side[0]*wid*w,root[1]+dir[1]*len*u+side[1]*wid*w,root[2]+dir[2]*len*u+side[2]*wid*w],
 nz=[dir[1]*side[2]-dir[2]*side[1],dir[2]*side[0]-dir[0]*side[2],dir[0]*side[1]-dir[1]*side[0]],nl=Math.hypot(...nz)||1,h=th/2,O=(p,k)=>[p[0]+nz[0]/nl*h*k,p[1]+nz[1]/nl*h*k,p[2]+nz[2]/nl*h*k],
 ring=[P(0,-.25),P(.5,-.5),P(.88,-.3),P(1,0),P(.88,.3),P(.5,.5),P(0,.25)],ctr=P(.5,0),cen=[ctr[0],ctr[1],ctr[2]],n=ring.length;
 for(let i=1;i<n-1;i++){b.tri(O(ring[0],1),O(ring[i],1),O(ring[i+1],1),c,0,[ctr[0]-nz[0],ctr[1]-nz[1],ctr[2]-nz[2]]);b.tri(O(ring[0],-1),O(ring[i],-1),O(ring[i+1],-1),mul(c,.9),0,[ctr[0]+nz[0],ctr[1]+nz[1],ctr[2]+nz[2]])}
 for(let i=0;i<n;i++){const k=(i+1)%n;b.quad(O(ring[i],1),O(ring[k],1),O(ring[k],-1),O(ring[i],-1),mul(c,.82),0,cen)}}
// tambor caído (columna tumbada) entre dos puntos
const fallen=(b,p,q,r,sd)=>tube(b,p,q,r,r*.94,10,marble(sd,3),{v:.03});
// entablamento en una dirección: arquitrabe + friso con triglifos DORADOS + cornisa. axis 'x' = barra a lo largo de X (centro cx,cz), len, grosor `dp` en el otro eje, base y. Devuelve la altura de la cornisa.
function ent(b,axis,cx,cz,len,dp,y,sd,gold=true){const X=axis==='x',put=(c,y0,l,w,h,s,o)=>X?mblk(b,cx,y0,cz,l,h,w,s,o):mblk(b,cx,y0,cz,w,h,l,s,o);
 put(0,y,len,dp,.1,sd,{r:.014});put(0,y+.1,len,dp*.9,.1,sd+1,{r:.012});put(0,y+.2,len+.1,dp+.14,.05,sd+2,{r:.012});
 if(gold){const n=Math.max(2,Math.round(len/.2));for(let i=0;i<n;i++){const u=-len/2+(i+.5)*len/n;if(i%2)continue;const tx=X?cx+u:cx,tz=X?cz:cz+u;
   [-1,1].forEach(s=>{if(X)b.box(tx,y+.115,cz+s*(dp*.45+.006),.055,.07,.012,GOLD,{nb:1,v:.08});else b.box(cx+s*(dp*.45+.006),y+.115,tz,.012,.07,.055,GOLD,{nb:1,v:.08})})}}
 return y+.25}
// tejas de terracota: reutiliza el `gable` (tejas individuales); devuelve el faldón registrado para la regla ANTICLIP
const roofG=(b,cx,y0,cz,w,d,h,ov,sd)=>b.gable(cx,y0,cz,w,d,h,ov,vary(TERRA,.06,sd,1),{rows:6,v:.12,th:.21});
// frontón de mármol en cada extremo X de un tejado a dos aguas (+ tímpano algo más oscuro); sin invadir el plano del faldón
function pediment(b,x,y0,d,h,sd){[-1,1].forEach(s=>{const xx=s*x,c=marble(sd,s+3),ctr=[0,y0+h*.3,0];
 b.tri([xx,y0,-d/2],[xx,y0,d/2],[xx,y0+h*.9,0],c,0,ctr);const o2=xx+s*.012;b.tri([o2,y0+.035,-d/2+.12],[o2,y0+.035,d/2-.12],[o2,y0+h*.9-.1,0],mul(c,.84),0,ctr)})}

const MODELS={
 // ── columna suelta (hito del camino); ruins → rota ──
 columnaG(o){const b=new B(901),ru=!!(o&&o.ruins),H=1.7,r=.14;
  mblk(b,0,0,0,r*3.1,.07,r*3.1,901,{r:.016,nb:1});column(b,0,0,.07,H,r,903,ru?.55:1);if(ru)fallen(b,[.45,.1,.1],[.95,.1,.42],.12,904);return b},
 // ── columna rota (ruinas): tocón estriado, tambores caídos y un capitel tirado ──
 columnaRota(o){const b=new B(911),v=(o&&o.v)||0,sd=911+v*7;
  mblk(b,0,0,0,.52,.08,.52,sd,{r:.016,nb:1});column(b,0,0,.08,1.5,.14,sd+1,.3+.18*hash(sd,1,1));
  fallen(b,[.42,.12,.08],[.95,.12,.2+.12*v],.125,sd+2);fallen(b,[.3,.12,-.5],[.7,.12,-.62],.12,sd+3);
  lathe(b,-.55,.02,.3,[[.15,0],[.17,.02],[.23,.07]],9,marble(sd,4),{sd:sd+4});mblk(b,-.55,.09,.3,.44,.06,.44,sd+5,{r:.012,nb:1,my:.4});return b},
 // ── templo períptero dórico (La Acrópolis): 3 gradas, 7×4 columnas, cella con puerta, friso dorado, tejado de terracota con frontones. Construido con la cumbrera en X y espejado (frente a +z). ──
 temploG(o){const b=new B(921),ru=!!(o&&o.ruins),sd=921,sp=.85,nx=7,nz=4,Lx=(nx-1)*sp,Lz=(nz-1)*sp,H=1.3,r=.12;
  const y0=steps(b,0,0,Lx+.62,Lz+.62,3,.07,.12,sd),top=y0+H*.985,cut=new Map();
  for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){if(!(i===0||i===nx-1||j===0||j===nz-1))continue;const x=-Lx/2+i*sp,z=-Lz/2+j*sp,h=hash(sd,i*9+j,2);
   if(ru&&h<.22){mblk(b,x,y0,z,r*2.7,.07,r*2.7,sd+i*5+j,{r:.014,nb:1});cut.set(i+','+j,0);continue}   // ruinas: falta la columna (solo queda su base)
   const c=ru?(h<.55?.28+.5*hash(sd,i,j):1):1;cut.set(i+','+j,c);column(b,x,z,y0,H,r,sd+i*13+j*3,c)}
  const full=(i,j)=>cut.get(i+','+j)===1;
  // cella (muros de bloques) y puerta en el frente (+x)
  const cx0=-Lx/2+.75,cx1=Lx/2-.8,cz0=-.78,cz1=.78,ch=top-y0+.1;
  [[[cx0,cz0],[cx1,cz0]],[[cx0,cz1],[cx1,cz1]],[[cx0,cz0],[cx0,cz1]]].forEach(([p,q],k)=>b.course(p,q,y0,ru&&k===2?ch*.6:ch,.1,marble(sd,k),{rh:.2,v:.03}));
  b.course([cx1,cz0],[cx1,-.28],y0,ch,.1,marble(sd,7),{rh:.2,v:.03});b.course([cx1,.28],[cx1,cz1],y0,ch,.1,marble(sd,8),{rh:.2,v:.03});
  b.box(cx1,y0,0,.05,.78,.56,DK,{nb:1});mblk(b,cx1,y0+.78,0,.12,.07,.7,sd+9,{r:.014});b.box(cx1+.07,y0+.7,0,.02,.04,.62,GOLD,{nb:1});
  // entablamento sobre las columnas llenas (en ruinas solo entre columnas enteras)
  const sides=[['x',-Lz/2,0],['x',Lz/2,nz-1]];
  if(!ru){sides.forEach(([,z])=>ent(b,'x',0,z,Lx+.3,.34,top,sd+20));[-1,1].forEach(s=>ent(b,'z',s*Lx/2,0,Lz-.38,.34,top,sd+30+s))}
  else{for(let i=0;i<nx-1;i++)[0,nz-1].forEach(j=>{if(full(i,j)&&full(i+1,j))ent(b,'x',-Lx/2+(i+.5)*sp,-Lz/2+j*sp,sp+.04,.34,top,sd+40+i+j)});
   for(let j=0;j<nz-1;j++)[0,nx-1].forEach(i=>{if(full(i,j)&&full(i,j+1))ent(b,'z',-Lx/2+i*sp,-Lz/2+(j+.5)*sp,sp+.04,.34,top,sd+50+i+j)})}
  if(!ru){const yr=top+.29,w=Lx+.35,d=Lz+.35,h=.55;roofG(b,0,yr,0,w,d,h,.14,sd);pediment(b,Lx/2+.26,yr,d,h,sd+60);mblk(b,0,yr-.04,0,Lx+.3,.05,Lz+.3,sd+61,{r:.01,nb:1})}
  else{for(let k=0;k<9;k++){const a=hash(sd,k,70)*TAU,rr=.6+hash(sd,k,71)*2.4;mblk(b,Math.cos(a)*rr*1.3,y0,Math.sin(a)*rr*.8,.2+.2*hash(sd,k,72),.1+.12*hash(sd,k,73),.2+.18*hash(sd,k,74),sd+80+k,{my:a,r:.02,nb:1})}}   // escombros
  b.geo=function(){return swapXZ(B.prototype.geo.call(this))};return b},
 // ── propíleos: pórtico de entrada (Los Propileos): 4 columnas delante y detrás, muros laterales y paso central; mira a +z y se atraviesa a lo largo de z ──
 propileos(o){const b=new B(931),ru=!!(o&&o.ruins),sd=931,Dp=1.8,H=1.2,r=.115,zs=[-1.05,-.5,.5,1.05];
  const y0=.12;mblk(b,0,0,0,Dp+.7,y0,3.5,sd,{r:.02,nb:1});[-1,1].forEach(s=>mblk(b,s*(Dp/2+.42),0,0,.3,.07,2.6,sd+1,{r:.012,nb:1}));
  [-1,1].forEach(sx=>zs.forEach((z,j)=>{const c=ru&&hash(sd,sx*9+j,2)<.4?.3+.4*hash(sd,sx+j,3):1;column(b,sx*Dp/2,z,y0,H,r,sd+j*7+(sx>0?3:0),c)}));
  [-1,1].forEach(s=>{b.course([-Dp/2+.05,s*1.5],[Dp/2-.05,s*1.5],y0,H*.985+.16,.3,marble(sd,s+4),{rh:.2,v:.03});mblk(b,0,y0+H*.985+.16,s*1.5,Dp-.05,.07,.34,sd+5,{r:.014})});
  const top=y0+H*.985;
  if(!ru){[-1,1].forEach(s=>ent(b,'z',s*Dp/2,0,2.7,.34,top,sd+10+s));ent(b,'x',0,-1.5,Dp+.1,.34,top,sd+14);ent(b,'x',0,1.5,Dp+.1,.34,top,sd+15);
   const yr=top+.29,w=Dp+.3,d=3.35,h=.5;roofG(b,0,yr,0,w,d,h,.12,sd);pediment(b,Dp/2+.2,yr,d,h,sd+16);mblk(b,0,yr-.04,0,Dp+.25,.05,3.0,sd+17,{r:.01,nb:1})}
  else{[-1,1].forEach(s=>{mblk(b,s*Dp/2,top+.0,-1.5+(s>0?.2:0),.3,.1,1.0,sd+18,{r:.012,my:.3*s})});}
  b.geo=function(){return swapXZ(B.prototype.geo.call(this))};return b},
 // ── ágora: lozas de mármol en anillos radiales, grada perimetral y columnata en arco al norte (-z) abierta al sur ──
 agora(o){const b=new B(941),sd=941,R=2.4;
  lathe(b,0,0,0,[[R+.2,0],[R+.2,.04]],24,marble(sd,0),{sd,v:.02});lathe(b,0,.04,0,[[R+.08,0],[R+.08,.035]],24,mul(marble(sd,1),.74),{sd:sd+1,v:.02});   // la capa baja más oscura = las juntas entre lajas
  [[.0,.7,1],[.7,1.5,12],[1.5,2.3,20]].forEach(([r0,r1,n],ri)=>{for(let k=0;k<n;k++){const a=(k+.5+ri*.3)/n*TAU,rm=(r0+r1)/2,w=Math.max(.2,TAU*rm/n*.96);
   if(ri===0&&k>0)break;if(ri===0){b.bevel(0,.075,0,1.0,.03,1.0,mul(marble(sd,9),.94),{r:.012,nb:1,my:.4});continue}
   b.bevel(Math.cos(a)*rm,.075,Math.sin(a)*rm,r1-r0-.03,.026,w*.94,mul(marble(sd,ri*40+k,.05),.94),{r:.012,nb:1,my:-a})}});   // `my` alinea el bloque con el radio
  const N=7,Rc=R-.12,H=1.0,r=.095,yb=.075;
  for(let i=0;i<N;i++){const a=Math.PI+(i+.0)/(N-1)*Math.PI,x=Math.cos(a)*Rc,z=Math.sin(a)*Rc;column(b,x,z,yb,H,r,sd+i*17,1)}
  for(let i=0;i<N-1;i++){const a0=Math.PI+i/(N-1)*Math.PI,a1=Math.PI+(i+1)/(N-1)*Math.PI,x0=Math.cos(a0)*Rc,z0=Math.sin(a0)*Rc,x1=Math.cos(a1)*Rc,z1=Math.sin(a1)*Rc,mx=(x0+x1)/2,mz=(z0+z1)/2,L=Math.hypot(x1-x0,z1-z0),ang=Math.atan2(-(z1-z0),x1-x0),y=yb+H*.985;
   mblk(b,mx,y,mz,L+.04,.1,.28,sd+100+i,{r:.014,my:ang});mblk(b,mx,y+.1,mz,L+.04,.08,.25,sd+120+i,{r:.012,my:ang});mblk(b,mx,y+.18,mz,L+.1,.05,.32,sd+140+i,{r:.012,my:ang});
   [-1,1].forEach(s=>{const ox=-Math.sin(ang)*.0,tx=mx,tz=mz;b.box(tx,y+.12,tz,.05,.05,.05,GOLD,{nb:1})})}
  return b},
 // ── Altar Quebrado: estatua alada de mármol con el ROSTRO BORRADO sobre pedestal escalonado (los 4 braseros del ritual son props aparte) ──
 estatuaAlada(o){const b=new B(951),ru=!!(o&&o.ruins),sd=951,s0=steps(b,0,0,.95,.95,3,.07,.14,sd);
  mblk(b,0,s0,0,.62,.6,.62,sd+4,{r:.024,nb:1});b.box(0,s0+.44,0,.675,.05,.675,GOLD,{nb:1,v:.05});mblk(b,0,s0+.6,0,.74,.07,.74,sd+5,{r:.018});
  const y=s0+.67,c=marble(sd,9);
  lathe(b,0,y,0,[[.2,0],[.215,.12],[.185,.3],[.16,.5],[.15,.6]],8,c,{fl:.86,sd:sd+1});               // túnica con pliegues
  lathe(b,0,y+.6,0,[[.15,0],[.162,.1],[.145,.24],[.12,.32]],8,c,{sd:sd+2,v:.02});                   // torso
  lathe(b,0,y+.92,0,[[.045,0],[.05,.07]],8,c,{sd:sd+3});                                           // cuello
  lathe(b,0,y+.98,0,[[.07,0],[.09,.05],[.088,.12],[.06,.18],[.02,.215]],10,c,{sd:sd+4,v:.01});      // cabeza lisa: sin rasgos (rostro borrado)
  tube(b,[.15,y+.86,0],[.22,y+.63,.15],.045,.038,6,c);tube(b,[.22,y+.63,.15],[.2,y+.55,.32],.038,.034,6,c);   // brazo derecho extendido (ofrenda)
  if(!ru){tube(b,[-.15,y+.86,0],[-.21,y+.62,.12],.045,.038,6,c);tube(b,[-.21,y+.62,.12],[-.19,y+.56,.3],.038,.034,6,c)}else tube(b,[-.15,y+.86,0],[-.2,y+.68,.06],.045,.04,6,c);
  // alas: abanico de plumas (prismas afilados) en tres filas; en ruinas faltan y están quebradas
  [-1,1].forEach(sg=>{const root=[sg*.1,y+.86,-.09],rows=[[8,.66,.0,.15],[7,.5,.1,.14],[6,.34,.2,.12]];
   rows.forEach(([n,len,lift,wd],ri)=>{for(let i=0;i<n;i++){const u=i/(n-1),ang=.18+u*1.2,key=hash(sd,sg*40+ri*9+i,7);if(ru&&(sg<0?key<.6:key<.28))continue;
    const L=len*(1.0-u*.16)*(ru?(sg<0?.55:1)*(.6+.4*hash(sd,i,ri)):1),d=[Math.sin(ang)*sg,Math.cos(ang)*.86+lift,-.3-.1*ri],l=Math.hypot(...d),dir=[d[0]/l,d[1]/l,d[2]/l],nz=[0,.25,1],sd2=[dir[1]*nz[2]-dir[2]*nz[1],dir[2]*nz[0]-dir[0]*nz[2],dir[0]*nz[1]-dir[1]*nz[0]],sl=Math.hypot(...sd2);
    leaf(b,[root[0],root[1],root[2]-ri*.03],dir,[sd2[0]/sl,sd2[1]/sl,sd2[2]/sl],L,wd,.035,marble(sd,sg*30+ri*8+i,.05))}})});
  return b},
 // ── brasero dorado de 3 patas (los 4 del ritual y los del ágora); llama y brasas con aEmit ──
 braseroG(o){const b=new B(961),lit=!o||o.lit!==0;
  for(let k=0;k<3;k++){const a=k/3*TAU+.4;tube(b,[Math.cos(a)*.2,0,Math.sin(a)*.2],[Math.cos(a)*.1,.44,Math.sin(a)*.1],.025,.02,4,vary(GOLD,.1,961,k),{v:.05})}
  lathe(b,0,.0,0,[[.21,0],[.21,.025]],10,mul(GOLD,.8),{sd:961});
  lathe(b,0,.42,0,[[.1,0],[.19,.07],[.24,.15],[.235,.17]],10,(i)=>i%2?GOLDL:GOLD,{sd:962,top:false});
  lathe(b,0,.585,0,[[.225,0],[.225,.03]],10,lit?COAL:mul(DK,1.2),{sd:963,em:lit?4:0,capEm:lit?4:0,capCol:COAL});
  if(lit){const F=(x,z,h,r,sd2)=>lathe(b,x,.6,z,[[r,0],[r*.72,h*.35],[r*.38,h*.7],[.008,h]],6,FLAME,{sd:sd2,em:3,capEm:3,capCol:FLAME,ph:sd2});F(0,0,.3,.085,964);F(.07,.03,.2,.05,965);F(-.05,-.05,.22,.05,966);lathe(b,0,.6,0,[[.04,0],[.025,.12],[.008,.2]],5,col('#fff0b0'),{sd:967,em:3,capEm:3,capCol:col('#fff0b0')})}
  return b},
 // ── ARENA DEL VIGÍA (21 oct 2026, combate de Gabriel): disco de mármol de ≈ 5,5 tiles de radio (R=3,7 ×PROP_K) con anillos de lajas, DOS aros de oro incrustados, un SOL dorado en el centro, grada perimetral y ocho columnas bajas con capitel alrededor (fuera del suelo).
 // Los 4 braseros del ritual son props aparte (braseroG) colocados dentro del disco. Sin tejado: nada que recortar. ──
 arenaG(o){const b=new B(1001),sd=1001,R=3.7;
  lathe(b,0,0,0,[[R+.25,0],[R+.25,.05]],36,marble(sd,0),{sd,v:.02});lathe(b,0,.05,0,[[R+.1,0],[R+.1,.04]],36,mul(marble(sd,1),.74),{sd:sd+1,v:.02});
  [[1.0,1.9,14],[1.9,2.8,22],[2.8,3.6,30]].forEach(([r0,r1,n],ri)=>{for(let k=0;k<n;k++){const a=(k+.5+ri*.3)/n*TAU,rm=(r0+r1)/2,w=Math.max(.2,TAU*rm/n*.96);
   b.bevel(Math.cos(a)*rm,.075,Math.sin(a)*rm,r1-r0-.03,.026,w*.94,mul(marble(sd,ri*60+k,.05),.94),{r:.012,nb:1,my:-a})}});
  b.bevel(0,.075,0,2.0,.03,2.0,mul(marble(sd,9),.94),{r:.012,nb:1,my:.4});
  // aros de oro incrustados y SOL central (ocho rayos)
  [[1.9,48],[3.55,64]].forEach(([r,n],ri)=>{for(let k=0;k<n;k++){const a=k/n*TAU;b.bevel(Math.cos(a)*r,.098,Math.sin(a)*r,.07,.012,TAU*r/n*1.04,mix(GOLD,GOLDL,hash(sd,k,ri+2)),{r:.004,nb:1,my:-a})}});
  for(let k=0;k<8;k++){const a=k/8*TAU+.2,l=k%2?.42:.7;b.bevel(Math.cos(a)*(.35+l/2),.098,Math.sin(a)*(.35+l/2),l,.012,.07,mix(GOLD,GOLDL,hash(sd,k,7)),{r:.004,nb:1,my:-a})}
  b.bevel(0,.098,0,.34,.014,.34,GOLDL,{r:.006,nb:1,my:.785});
  for(let i=0;i<8;i++){const a=i/8*TAU+.39,x=Math.cos(a)*(R+.55),z=Math.sin(a)*(R+.55);steps(b,x,z,.4,.4,1,.06,0,sd+i*7);column(b,x,z,.06,i%2?.95:1.25,.12,sd+i*17,i%3===0?.6:1)}
  return b},
 // ── ánfora de terracota con banda oscura (figuras negras) y dos asas ──
 anfora(o){const b=new B(971),sd=971,pr=[[.055,0],[.075,.02],[.115,.08],[.15,.2],[.155,.26],[.13,.34],[.078,.42],[.058,.46],[.07,.5],[.085,.52]],T=vary(TERRA,.08,sd,1);
  lathe(b,0,0,0,pr,10,(i,k)=>i===3||i===4?(i===3?mul(DK,1.3):mix(DK,T,.5)):vary(T,.05,sd,k+i),{sd,top:false});
  lathe(b,0,.52,0,[[.085,0],[.05,.0]],10,DK,{sd:sd+1,top:true});
  [-1,1].forEach(s=>{tube(b,[s*.07,.45,0],[s*.15,.4,0],.012,.012,4,T);tube(b,[s*.15,.4,0],[s*.145,.3,0],.012,.012,4,T)});return b},
 // ── estela de mármol con remate triangular e inscripción dorada (columna ruinosa si ruins) ──
 estelaG(o){const b=new B(981),ru=!!(o&&o.ruins),sd=981;
  mblk(b,0,0,0,.62,.1,.3,sd,{r:.02,nb:1});mblk(b,0,.1,0,.46,ru?.7:.9,.12,sd+1,{r:.02,nb:1,my:ru?.1:0});
  if(!ru){const y=1.0;b.tri([-.23,y,-.06],[.23,y,-.06],[0,y+.2,-.06],marble(sd,2),0,[0,y,0]);b.tri([-.23,y,.06],[.23,y,.06],[0,y+.2,.06],marble(sd,2),0,[0,y,0]);
   b.quad([-.23,y,-.06],[.23,y,-.06],[.23,y,.06],[-.23,y,.06],marble(sd,3),0,[0,y-.2,0]);b.quad([-.23,y,-.06],[0,y+.2,-.06],[0,y+.2,.06],[-.23,y,.06],marble(sd,4),0,[0,y,0]);b.quad([.23,y,-.06],[0,y+.2,-.06],[0,y+.2,.06],[.23,y,.06],marble(sd,5),0,[0,y,0]);
   b.box(0,y+.05,.062,.06,.06,.012,GOLD,{nb:1})}
  for(let i=0;i<5;i++)b.box(0,.22+i*.1,.062,.3-.04*(i%3),.016,.012,GOLD,{nb:1,v:.1});return b},
 // ── banco de mármol: losa sobre dos zancas macizas ──
 bancoG(o){const b=new B(991),sd=991;[-1,1].forEach(s=>{mblk(b,s*.37,0,0,.14,.28,.3,sd+s,{r:.02,nb:1});mblk(b,s*.37,.28,0,.2,.04,.34,sd+s+3,{r:.012})});
  mblk(b,0,.32,0,1.0,.07,.32,sd+8,{r:.022});return b}
};

const GEO=new Map();
// REGLA DE SENTIDO: el héroe mide ≈ 1 unidad (×PROP_K=1,5 → un modelo de 1 tile mide 1,5). Los objetos pequeños se redujeron a su tamaño real (brasero ceremonial ≈ 1 m, ánfora ≈ 70 cm, banco con asiento a 45 cm, estela ≈ 1,5 m); los edificios y columnas quedan a escala monumental.
export const CI_SCALE={braseroG:.5,anfora:.6,bancoG:.65,estelaG:.65,propileos:2.2};   // propileos ×2,2 (21 oct 2026, pedido del dueño: la puerta de la llegada debe ser IMPONENTE; sky-biome.js escala sus colisiones igual)
export function cieloGeo(n,o,th){if(!MODELS[n])return null;const key='dk:ci:'+n+'|'+JSON.stringify(o||{});if(GEO.has(key))return GEO.get(key);
 let g=MODELS[n](o||{}).geo();const K=CI_SCALE[n];if(K){g.scale(K,K,K);g.computeBoundingBox();g.computeBoundingSphere()}if(o&&(o.rot||o.dir==='y'))g=swapXZ(g);const r={g,key};GEO.set(key,r);return r}
export const CI_NAMES=Object.keys(MODELS);
// props de MÁRMOL: props3d.js los dibuja con el material de las rocas (sombreado continuo, sin textura procedural)
export const CI_ROCK=new Set(['columnaG','columnaRota','temploG','propileos','agora','estatuaAlada','estelaG','bancoG','arenaG']);
// huella y altura medidas (ancho x, alto y, fondo z; sin escalar ×PROP_K) → `python3 tools/r3d/props_sheet.py --medir` o `R3D.props.fp` en el juego. Medido el 21 oct 2026 con Node (`tools/r3d/cielo_check.py`); columna/templo/estatua con `ruins` varían (ver el script).
export const CI_FOOT={columnaG:[.43,1.73,.43],columnaRota:[1.81,.71,1.31],temploG:[3.65,2.39,6.20],propileos:[7.90,4.71,6.47],agora:[5.20,1.29,5.20],estatuaAlada:[1.51,2.36,1.51],braseroG:[.24,.455,.23],anfora:[.19,.31,.17],estelaG:[.40,.77,.195],bancoG:[.65,.24,.22],arenaG:[8.26,1.29,8.26]};
export function CI_CASES(){return [['columnaG',{},'columnaG'],['columnaG',{ruins:1},'columnaG'],['columnaRota',{v:0},'columnaRota'],['temploG',{},'temploG'],['temploG',{ruins:1},'temploG'],['propileos',{},'propileos'],['agora',{},'agora'],['estatuaAlada',{},'estatuaAlada'],['estatuaAlada',{ruins:1},'estatuaAlada'],['braseroG',{},'braseroG'],['braseroG',{lit:0},'braseroG'],['anfora',{},'anfora'],['estelaG',{},'estelaG'],['bancoG',{},'bancoG'],['arenaG',{},'arenaG']]}
// verificador anti-clipping de tejados (regla ANTICLIP; lo usa tools/r3d/roof_clip_check.py)
export function clipReport(n,o){const b=MODELS[n](o||{});return {clips:b.clips(),roofs:b.R.length}}
