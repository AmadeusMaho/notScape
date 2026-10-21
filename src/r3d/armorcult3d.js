// NotScape · R3D · EQUIPO POR CULTURA (Lote R3D-CULTURAS, 18 oct 2026, idea del dueño) — todo por código.
// ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// REGLA DEL DUEÑO: cada bioma = una civilización y el equipo hecho con SUS minerales (el tier) es de ESA cultura: armaduras (metal, cuero, tela), escudos
// y TODAS las armas (espada, daga, mandoble, arco, ballesta, báculo, cetro…). Tabla tier → cultura (según dónde se mina cada mena, biomes.js `MI_ALL`):
//   0 PRADERA  (reino medieval)   cobre · estaño · bronce
//   1 BOSQUE   (guardianes élficos) hierro · acero
//   2 PANTANO  (tribal)            plata
//   3 CUMBRES  (nórdico)           mitril
//   4 ORIENTAL (samurái)           adamantita · runita
//   5 VOLCÁN   (infernal)          oricalco · celestita
// El botín por bioma (casco/botas/capa/lt_*) ya usa el mismo índice k = cultura.
// CÓMO AÑADIR UNA CULTURA: añade su índice en CULT_OF, una rama en cada función (chestC, legsC, glovesC, shieldC) y en weapons3d.js (WCULT). Verifica de cerca
// con `python3 -I tools/r3d/armor_sheet.py <png> culturas …` (visor armaduras-3d.html ?set=culturas) y `weapons_sheet.py`.
// AJUSTE AL CUERPO: el peto es un casco liso que sigue el torso (mismo perfil que la camisa del Mini, +4,5 %), SIN pectorales abultados (los hacían parecer un pecho
// enorme en personajes femeninos y «futuristas»); el relieve va en láminas, cordones y remaches finos pegados a la superficie.
import * as THREE from 'three';

export const CULT_NAMES=['Pradera','Bosque','Pantano','Cumbres','Oriental','Volcán'];
export const CULT_OF={cobre:0,estano:0,bronce:0,hierro:1,acero:1,plata:2,mitril:3,adam:4,runita:4,oricalco:5,celestita:5,
 madera:0,cuero:0,pino:0,abedul:0,roble:0,fresno:1,sauce:1,arce:2,tejo:3,ebano:4,caoba:4,baobab:5,mundo:5};   // + maderas de armas (arcos/báculos) y el cuero genérico
export const cultOf=t=>CULT_OF[t]??0;
export const CLOTH=['#9a7a52','#5f8048','#a08c52','#a9b8dc','#26222a','#2e242c'];   // lana/seda de cada cultura (la túnica de tela se tiñe con el color del nivel un 30 %)
export const clothC=(cu,T)=>mixc(CLOTH[cu],T.c,cu===4?.006:.3);

const sph=(r,x=1,y=1,z=1,n=12)=>new THREE.SphereGeometry(r,n,Math.max(6,n*.7|0)).scale(x,y,z);
const cyl=(a,b,h,n=10)=>new THREE.CylinderGeometry(a,b,h,n),cone=(r,h,n=5)=>new THREE.ConeGeometry(r,h,n),box=(x,y,z)=>new THREE.BoxGeometry(x,y,z);
const tor=(R,r,n=22,s=6,arc)=>new THREE.TorusGeometry(R,r,s,n,arc||Math.PI*2);
const lathe=(pts,n=24)=>new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),n);
const shade=(c,k)=>'#'+new THREE.Color(c).multiplyScalar(k).getHexString(),mixc=(a,b,t)=>'#'+new THREE.Color(a).lerp(new THREE.Color(b),t).getHexString();
const PI=Math.PI,MET={t:{rim:2}};
// ORIENTAL (samurái, 18 oct 2026, pedido del dueño): laca NEGRA con cordones ROJOS (antes el metal salía verde/cian chillón del tier). El tier solo tiñe un 0,6 % la laca (la mezcla es en lineal).
export const JBLK='#1c181c',JRED='#b01f1c';
const jLac=(met,B,L)=>met?mixc(JBLK,B,.006):mixc(L,'#14100f',.55);   // OJO: mixc (THREE.Color.lerp) mezcla en lineal → un 2 % ya tiñe; 10 % salía verde chillón
// extrusión de un contorno (x,y) con relieve suave: escudos y hojas
export const shp=(pts,d=.03,bev=.008)=>{const s=new THREE.Shape();pts.forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1]));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelThickness:bev,bevelSize:bev,bevelSegments:1,curveSegments:8});g.translate(0,0,-d/2);return g};
const GLOF=(glow)=>(c,k=1.8)=>({ink:0,mat:glow(c,k)});

// radio del torso a la altura y (mismo perfil que la camisa del Mini; ver mini3d.js)
export function torsoR(F){const W=F.W,rw=(F.rw||.15*W)*1.045,rc=.19*W*(F.cw||1)*1.045;
 const pts=[[.5,rw],[.56,rw*1.03],[.68,rc],[.76,rc],[.83,rc*.68]];
 return y=>{if(y<=pts[0][0])return pts[0][1];for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];if(y<=b[0])return a[1]+(b[1]-a[1])*(y-a[0])/(b[0]-a[0])}return pts[pts.length-1][1]}}
const shell=(P,F,col,o={})=>{const W=F.W,rw=(F.rw||.15*W)*1.045,rc=.19*W*(F.cw||1)*1.045;
 P(lathe([[rw,.5],[rw*1.03,.56],[rc,.68],[rc,.76],[rc*.68,.83],[.07,.86],[0,.865]]),col,0,0,0,o.t?o:Object.assign({t:{rim:2}},o))};

// ── ayudas de decoración ──
// arco de toro centrado delante (+z) en el plano horizontal a altura y
const frontArc=(P,g,R,r,y,arc,col,o={})=>P(tor(R,r,18,6,arc).rotateZ(PI/2-arc/2).rotateX(PI/2),col,0,y,0,Object.assign({p:g},o));
// elemento pegado a la superficie del torso en el ángulo a (0 = delante) y altura y
const onSurf=(R,y,a,off=0)=>[Math.sin(a)*(R(y)+off),y,Math.cos(a)*(R(y)+off)];

// ═══════════════════════════════ PETOS POR CULTURA ═══════════════════════════════
// fam: 'm' metal · 'cu' cuero (tachas/cordones del metal del nivel). T = tierPal. G = glow helper. L = color del cuero.
export function chestC(F,g,P,T,fam,cu,G){const R=torsoR(F),met=fam==='m',L=mixc('#7a4c26',T.c,.07),B=met?T.c:L,D=met?T.d:shade(L,.6),A=met?T.t:cu===4?'#c9a24a':T.c,r=T.r,arms=F.arms;
 const side=a=>arms.forEach((m,i)=>a(m,i?1:-1));
 if(cu===0){                                                                   // PRADERA: coraza medieval sencilla, cinturón, emblema
  shell(P,F,B);P(box(.022,.2,.014),D,0,.67,R(.67)+.004,{p:g,t:{rim:2}});         // cresta central
  if(met){[.6,.7].forEach(y=>P(tor(R(y)*1.005,.008,22,5).rotateX(PI/2),D,0,y,0,{p:g}));P(cyl(.045,.045,.012,6).rotateX(PI/2),A,0,.72,R(.72)+.012,{p:g,t:{rim:2}})}   // emblema
  else{for(let i=0;i<3;i++)[-1,1].forEach(s=>P(box(.008,.2,.006),shade(L,.78),.07*(i+.4)*s,.66,R(.66)+.003,{p:g}))}                                              // acolchado
  P(tor(R(.52)*1.02,.02,22,6).rotateX(PI/2),shade(L,.8),0,.515,0,{p:g});P(box(.05,.045,.016),A,0,.515,R(.52)*1.02+.006,{p:g,t:{rim:2}});               // cinturón
  P(tor(.105,.018,18,6).rotateX(PI/2),A,0,.845,0,{p:g,t:{rim:2}});
  side((a,q)=>{P(sph(.1,1.12,.78,1.05),B,.02*q,.03,0,Object.assign({p:a},MET));P(tor(.095,.012,16,6).rotateX(PI/2),A,.02*q,-.01,0,{p:a});
   if(r>=2)P(sph(.02,1,1,.8,6),A,.07*q,.07,.04,Object.assign({p:a},MET))});return}
 if(cu===1){                                                                   // BOSQUE: escamas de hoja solapadas, faja verde, hombreras de hojas
  shell(P,F,mixc(B,'#5a6a38',met?.3:.15));const LF=mixc(met?T.c:L,'#7ab04a',.4);
  [[.58,5],[.64,6],[.7,6],[.76,5]].forEach(([y,n],j)=>{for(let i=0;i<n;i++){const a=(i/(n-1)-.5)*(1.9-j*.12);const [x,yy,z]=onSurf(R,y,a,.004);
   P(sph(.034,1,.55,1.55,8),(i+j)%2?LF:B,x,yy,z,{p:g,t:{rim:2},ry:a,rx:.35})}});
  P(box(.05,.5,.012),'#4a6a2a',0,.66,R(.66)+.012,{p:g,rz:.7,t:{rim:1}});                                                                                  // faja diagonal
  if(met)P(sph(.026,1,1,.8,8),T.g||'#9ad060',0,.53,R(.52)+.02,Object.assign({p:g},T.g?G(T.g,2):{t:{rim:2}}));
  P(tor(R(.52)*1.02,.018,22,6).rotateX(PI/2),'#4a3220',0,.515,0,{p:g});P(tor(.1,.02,18,6).rotateX(PI/2),'#5a7a3a',0,.845,0,{p:g});
  side((a,q)=>[[.03,.1,.8],[-.015,.088,.75],[-.05,.075,.7]].forEach(([y,s,h],i)=>P(sph(s,1.25,h*.5,1.1),i%2?LF:B,.02*q+(i-1)*.012*q,y,0,Object.assign({p:a,rz:-q*(.15+i*.18)},MET))));return}
 if(cu===2){                                                                   // PANTANO: piel + costillas de hueso, calavera en el hombro, plumas, collar
  const HIDE=met?mixc('#6a5a3a',T.c,.25):mixc(L,'#6a5a3a',.3),BONE='#e8e0c0';shell(P,F,HIDE);
  [.6,.66,.72].forEach((y,i)=>frontArc(P,g,R(y)*1.012,.011,y,PI*(1-i*.06),BONE,{t:{rim:2}}));P(box(.012,.17,.01),BONE,0,.66,R(.66)+.004,{p:g,t:{rim:2}});     // costillas + esternón
  P(box(.04,.52,.012),shade(HIDE,.6),0,.64,R(.64)+.01,{p:g,rz:-.62});                                                                                     // correa en diagonal
  P(tor(R(.52)*1.02,.022,22,6).rotateX(PI/2),shade(HIDE,.55),0,.515,0,{p:g});for(let i=0;i<5;i++)P(sph(.018,1,1.2,1,6),BONE,(i-2)*.035,.5,R(.52)+.012,{p:g});     // cinto de colmillos
  if(met)P(sph(.028,1,1,.7,8),T.t,0,.72,R(.72)+.01,{p:g,t:{rim:2}});
  for(let i=0;i<9;i++){const a=(i/8-.5)*PI*.9;P(cone(.014,.05,4),BONE,Math.sin(a)*.115,.835,Math.cos(a)*.115*.92,{p:g,rx:-.5,rz:-Math.sin(a)*.6,t:{rim:2}})}   // collar de colmillos
  side((a,q)=>{if(q>0){P(sph(.05,1,1.05,.95,10),BONE,.07*q,.07,0,Object.assign({p:a},MET));[-1,1].forEach(s=>P(sph(.012,1,1,.6,6),'#1a1410',.07*q+s*.02,.085,.04,{p:a,ink:0}));      // calavera
    for(let i=0;i<3;i++)P(box(.026,.1,.006),['#c8483a','#e8c040','#3a8a5a'][i],(.04+i*.012)*q,.1,-.01-i*.02,{p:a,rz:-q*(.4+i*.25),t:{rim:1}})}
   else{P(sph(.09,1.1,.7,1.05),HIDE,.02*q,.03,0,{p:a});for(let i=0;i<3;i++)P(cone(.016,.07,4),BONE,(.04-i*.03)*q,.075,0,{p:a,rz:-q*.2})}});return}
 if(cu===3){                                                                   // CUMBRES: cota + correas, cuello y hombros de piel, discos
  const FUR='#e6e0d2',FUR2='#c9c2b0';shell(P,F,met?mixc(B,'#6a7078',.15):B);
  if(met)for(let y=.55;y<.8;y+=.036)P(tor(R(y)*1.004,.0055,24,4).rotateX(PI/2),T.d,0,y,0,{p:g});                                                         // anillas de cota
  [-1,1].forEach(s=>P(box(.034,.34,.01),shade(L,.7),.1*s,.68,R(.68)*Math.cos(Math.asin(.1/R(.68)))+.006,{p:g,rz:.0}));                                      // tirantes
  P(tor(R(.52)*1.02,.024,22,6).rotateX(PI/2),shade(L,.7),0,.515,0,{p:g});P(cyl(.04,.04,.016,10).rotateX(PI/2),A,0,.515,R(.52)*1.02+.01,{p:g,t:{rim:2}});
  for(let i=0;i<3;i++)P(sph(.014,1,1,.6,6),A,(i-1)*.06,.72,R(.72)+.006,{p:g,t:{rim:2}});
  for(let i=0;i<12;i++){const a=i/12*PI*2;P(sph(.034,1,.8,1,7),i%2?FUR:FUR2,Math.sin(a)*.115,.845,Math.cos(a)*.115,{p:g})}                                    // cuello de piel
  side((a,q)=>{P(sph(.092,1.15,.8,1.05),B,.02*q,.025,0,Object.assign({p:a},MET));for(let i=0;i<8;i++){const b=i/8*PI*2;P(sph(.028,1,.8,1,6),i%2?FUR:FUR2,.02*q+Math.cos(b)*.098,.012,Math.sin(b)*.088,{p:a})}
   if(r>=7)P(cone(.02,.07,5),T.t,.02*q,.1,0,{p:a,t:{rim:2}})});return}
 if(cu===4){                                                                   // ORIENTAL: dō de láminas con cordones, sode (hombreras rectangulares), obi
  const RED=JRED,LAC=jLac(met,B,L);shell(P,F,LAC);
  [.545,.585,.625,.665,.705,.745].forEach((y,i)=>{P(tor(R(y)*1.012,.0185,24,5).rotateX(PI/2),i%2?LAC:mixc(LAC,'#ffffff',.2),0,y,0,{p:g,t:{rim:2}});P(tor(R(y+.02)*1.008,.006,24,4).rotateX(PI/2),RED,0,y+.02,0,{p:g})});
  [-1,1].forEach(s=>P(box(.01,.24,.008),RED,.045*s,.65,R(.65)+.016,{p:g}));P(box(.008,.24,.008),RED,0,.65,R(.65)+.016,{p:g});                         // cordones verticales
  P(tor(R(.52)*1.025,.026,22,6).rotateX(PI/2),'#2a1c18',0,.512,0,{p:g});P(cyl(.036,.036,.014,14).rotateX(PI/2),A,0,.512,R(.52)*1.025+.012,{p:g,t:{rim:2}});     // obi + mon
  P(cyl(.036,.036,.01,8).rotateX(PI/2),shade(A,.6),0,.74,R(.74)+.01,{p:g,t:{rim:2}});                                                                       // mon
  P(box(.15,.025,.1),RED,0,.84,.0,{p:g,ry:0});P(tor(.1,.018,18,6).rotateX(PI/2),shade(LAC,.7),0,.845,0,{p:g});                                                // gola
  side((a,q)=>{for(let i=0;i<3;i++){P(box(.14,.045,.05),i%2?mixc(LAC,'#ffffff',.14):LAC,.085*q,.015-i*.048,0,Object.assign({p:a,rz:-q*(.18+i*.07)},MET));P(box(.14,.008,.052),RED,.085*q,-.006-i*.048,0,{p:a,rz:-q*(.18+i*.07)})}   // sode
   P(sph(.07,1,.6,1),LAC,.0,.045,0,{p:a})});return}
 // VOLCÁN: placa oscura con grietas de fuego, hombreras con cuernos, púas dorsales
 const DK=met?mixc('#241c20',T.c,.18):mixc('#2a2024',L,.4),GC=T.g||'#ff7a2a';shell(P,F,DK);
 [-1,1].forEach(s=>{P(box(.014,.2,.006),GC,.06*s,.66,R(.66)+.006,Object.assign({p:g,rz:-s*.35},G(GC,1.5)));P(box(.012,.1,.006),GC,.1*s,.6,R(.6)+.006,Object.assign({p:g,rz:s*.5},G(GC,1.5)))});
 P(box(.012,.14,.006),GC,0,.57,R(.57)+.006,Object.assign({p:g},G(GC,1.5)));P(sph(.022,1,1,.7,8),GC,0,.72,R(.72)+.01,Object.assign({p:g},G(GC,2.2)));
 [.58,.7].forEach(y=>P(tor(R(y)*1.008,.01,24,5).rotateX(PI/2),'#14101a',0,y,0,{p:g}));
 for(let i=0;i<4;i++)P(cone(.018,.07+.02*(i%2),4),'#14101a',0,.62+i*.055,-R(.7)-.012,{p:g,rx:-PI/2-.3,t:{rim:2}});                                                  // púas dorsales
 P(tor(R(.52)*1.02,.02,22,6).rotateX(PI/2),'#14101a',0,.515,0,{p:g});P(tor(.105,.02,18,6).rotateX(PI/2),'#14101a',0,.845,0,{p:g});
 side((a,q)=>{P(sph(.1,1.12,.78,1.05),DK,.02*q,.03,0,Object.assign({p:a},MET));P(cone(.034,.17,5),'#14101a',.06*q,.1,0,{p:a,rz:-q*.6,t:{rim:2}});P(cone(.022,.11,5),'#14101a',.0*q,.12,-.02,{p:a,rz:-q*.1,rx:-.2,t:{rim:2}});
  P(tor(.098,.01,16,5).rotateX(PI/2),GC,.02*q,.0,0,Object.assign({p:a},G(GC,1.4)))})}

// ═══ TÚNICA (familia tela) por cultura: la base es chestRobe (armor3d.js); aquí solo el adorno del cuello/pecho/fajín ═══
export function robeC(F,g,P,T,cu,G){const R=torsoR(F),FUR='#e6e0d2';
 if(cu===0){P(box(.09,.34,.012),T.t,0,.62,R(.62)+.008,{p:g,t:{rim:1}});return}                                                                       // tabardo con franja
 if(cu===1){for(let i=0;i<7;i++){const a=(i/6-.5)*1.5;P(sph(.03,1,.5,1.5,7),i%2?'#7ab04a':'#5a8a3a',Math.sin(a)*.112,.835,Math.cos(a)*.112,{p:g,rx:.4,ry:a})}return}   // cuello de hojas
 if(cu===2){for(let i=0;i<7;i++){const a=(i/6-.5)*PI*.8;P(cone(.014,.05,4),'#e8e0c0',Math.sin(a)*.112,.83,Math.cos(a)*.112,{p:g,rx:-.5})}for(let i=0;i<3;i++)P(sph(.016,1,1,1,6),['#c8483a','#e8c040','#3a8a5a'][i],(i-1)*.04,.52,R(.52)+.04,{p:g});return}
 if(cu===3){for(let i=0;i<12;i++){const a=i/12*PI*2;P(sph(.034,1,.8,1,7),i%2?FUR:'#c9c2b0',Math.sin(a)*.115,.845,Math.cos(a)*.115,{p:g})}return}
 if(cu===4){[-1,1].forEach(s=>P(box(.03,.22,.01),T.t,.03*s,.77,R(.77)+.006,{p:g,rz:s*.55}));P(box(.14,.04,.02),'#2a1c18',0,.512,R(.52)+.03,{p:g});return}                  // cuello cruzado (kimono) + nudo del obi
 [-1,1].forEach(s=>P(box(.012,.2,.006),T.g||'#ff7a2a',.06*s,.64,R(.64)+.008,Object.assign({p:g,rz:-s*.3},G(T.g||'#ff7a2a',1.5))))}

// ═══════════════════════════════ PIERNAS POR CULTURA ═══════════════════════════════
export function legsC(F,g,P,T,fam,cu,G){const L=mixc('#7a4c26',T.c,.07),met=fam==='m',tu=fam==='tu',B=met?T.c:tu?clothC(cu,T):L,lo=met?T.lo:shade(B,.8),A=met?T.t:cu===4?'#c9a24a':T.c;
 F.legs.forEach((l,i)=>{const kn=F.knees[i],q=i?1:-1;
  if(tu){P(tor(.07,.016,14,6).rotateX(PI/2),T.t,0,-.1,0,{p:kn});P(tor(.085,.012,14,6).rotateX(PI/2),T.t,0,-.02,0,{p:l});
   if(cu===3)P(sph(.075,1,.55,1),'#e6e0d2',0,-.04,0,{p:kn});if(cu===4)P(box(.02,.12,.008),JRED,0,-.1,.07,{p:kn});return}
  if(cu===0){P(cyl(.086,.078,.17,12),B,0,-.095,0,{p:l,...MET});P(tor(.085,.012,14,6).rotateX(PI/2),A,0,-.015,0,{p:l});
   P(sph(.08,1,.9,1.1,12),B,0,0,.022,{p:kn,...MET});P(cyl(.073,.065,.15,12),lo,0,-.115,.004,{p:kn,...MET});P(tor(.07,.012,14,6).rotateX(PI/2),A,0,-.04,0,{p:kn})}
  else if(cu===1){P(cyl(.082,.074,.17,10),B,0,-.095,0,{p:l});[-.03,-.07,-.11,-.15].forEach(y=>P(tor(.082,.01,14,5).rotateX(PI/2),'#4a6a2a',0,y,0,{p:l}));
   P(sph(.074,1,.9,1.1,10),mixc(B,'#5a8a3a',.3),0,0,.02,{p:kn});P(sph(.03,1,.5,1.5,6),'#7ab04a',0,-.0,.085,{p:kn,rx:.3});P(cyl(.07,.062,.15,10),lo,0,-.115,.004,{p:kn});
   for(let k=0;k<3;k++)P(sph(.028,1,.5,1.4,6),'#7ab04a',(k-1)*.035,-.17+k%2*.02,.058,{p:kn,rx:.4})}
  else if(cu===2){const H=mixc('#6a5a3a',B,.3);P(cyl(.082,.074,.17,10),H,0,-.095,0,{p:l});P(cyl(.072,.064,.2,10),shade(H,.8),0,-.1,.0,{p:kn});
   [-.05,-.09,-.13].forEach(y=>P(tor(.074,.01,14,5).rotateX(PI/2),'#3a2a1a',0,y,0,{p:kn}));for(let k=0;k<4;k++)P(sph(.014,1,1.2,1,6),'#e8e0c0',(k-1.5)*.035,-.07-k%2*.04,.07,{p:kn,...MET})}
  else if(cu===3){P(cyl(.086,.078,.17,10),B,0,-.095,0,{p:l,...MET});P(tor(.085,.012,14,6).rotateX(PI/2),A,0,-.015,0,{p:l});P(sph(.075,1,.8,1.05,10),B,0,0,.02,{p:kn,...MET});P(cyl(.072,.064,.15,10),lo,0,-.115,.004,{p:kn,...MET});
   for(let k=0;k<9;k++){const a=k/9*PI*2;P(sph(.03,1,.8,1,6),k%2?'#e6e0d2':'#c9c2b0',Math.sin(a)*.075,-.17,Math.cos(a)*.075,{p:kn})}}
  else if(cu===4){const LAC=jLac(met,B,L);P(box(.15,.17,.13),LAC,0,-.095,0,{p:l,...MET});P(box(.152,.012,.132),JRED,0,-.17,0,{p:l});                // haidate (muslera de placas)
   P(cyl(.05,.05,.012,10).rotateX(PI/2),A,0,0,.095,{p:kn,...MET});P(cyl(.07,.062,.15,10),shade(LAC,.7),0,-.115,.0,{p:kn});P(box(.07,.14,.018),LAC,0,-.115,.062,{p:kn,...MET});    // suneate (greba)
   [-.07,-.12,-.16].forEach(y=>P(tor(.068,.006,14,4).rotateX(PI/2),JRED,0,y,0,{p:kn}))}
  else{P(cyl(.086,.078,.17,10),'#241c20',0,-.095,0,{p:l,...MET});P(sph(.08,1,.9,1.1,10),'#241c20',0,0,.022,{p:kn,...MET});P(cone(.026,.08,5),'#14101a',0,.0,.1,{p:kn,rx:PI/2,...MET});
   P(cyl(.073,.065,.15,10),'#2a2024',0,-.115,.004,{p:kn,...MET});[-1,1].forEach(s=>P(box(.012,.11,.008),T.g||'#ff7a2a',.03*s,-.115,.07,Object.assign({p:kn},G(T.g||'#ff7a2a',1.6))))}})}

// ═══════════════════════════════ GUANTES POR CULTURA ═══════════════════════════════
export function glovesC(F,g,P,T,fam,cu,G){const L=mixc('#7a4c26',T.c,.07),met=fam==='m',tu=fam==='tu',B=met?T.c:tu?clothC(cu,T):L,lo=met?T.lo:shade(B,.8),A=met?T.t:cu===4?'#c9a24a':T.c;
 F.elbows.forEach((e,i)=>{const q=i?1:-1;
  P(sph(.06,1.05,.9,1.05,12),cu===4&&!tu?jLac(met,B,L):B,0,-.185,0,{p:e,...(met?MET:{})});                                                                                                        // puño
  if(cu===0){P(cyl(.066,.058,.1,12),lo,0,-.125,0,{p:e,...(met?MET:{})});P(tor(.063,.012,14,6).rotateX(PI/2),A,0,-.075,0,{p:e});if(met)[-.02,0,.02].forEach(x=>P(sph(.013,1,1,1,6),lo,x,-.2,.05,{p:e,...MET}))}
  else if(cu===1){P(cyl(.064,.058,.1,10),shade(B,.9),0,-.125,0,{p:e});[-.1,-.14].forEach(y=>P(tor(.062,.009,12,4).rotateX(PI/2),'#4a6a2a',0,y,0,{p:e}));P(sph(.026,1,.5,1.5,6),'#7ab04a',0,-.11,.06,{p:e,rx:.3})}
  else if(cu===2){P(cyl(.062,.056,.09,10),'#6a5a3a',0,-.125,0,{p:e});for(let k=0;k<4;k++)P(sph(.014,1,1.2,1,6),'#e8e0c0',(k-1.5)*.03,-.1,.058,{p:e,...MET})}
  else if(cu===3){P(cyl(.064,.058,.09,10),lo,0,-.13,0,{p:e,...(met?MET:{})});for(let k=0;k<8;k++){const a=k/8*PI*2;P(sph(.028,1,.8,1,6),k%2?'#e6e0d2':'#c9c2b0',Math.sin(a)*.065,-.085,Math.cos(a)*.065,{p:e})}}
  else if(cu===4){const LAC=jLac(met,B,L);P(box(.1,.12,.1),LAC,0,-.12,0,{p:e,...MET});P(box(.102,.012,.102),JRED,0,-.07,0,{p:e});P(box(.1,.02,.1),JRED,0,-.17,0,{p:e})}                // kote
  else{P(cyl(.066,.058,.1,10),'#241c20',0,-.125,0,{p:e,...MET});[-1,0,1].forEach(x=>P(cone(.014,.06,4),'#14101a',x*.026,-.225,.03,{p:e,rx:-.5,...MET}));P(tor(.064,.01,14,5).rotateX(PI/2),T.g||'#ff7a2a',0,-.075,0,Object.assign({p:e},G(T.g||'#ff7a2a',1.5)))}})}

// ═══════════════════════════════ ESCUDOS POR CULTURA ═══════════════════════════════
// el escudo mira a +z; centro (0,.02,.07); tamaño ≈ 0.4 × 0.46
export function shieldC(P,h,T,fam,cu,G){const met=fam==='m',tu=fam==='tu',L=mixc('#7a4c26',T.c,.2),B=met?T.c:L,D=met?T.d:shade(L,.55),A=met?T.t:cu===4?'#c9a24a':T.c,r=T.r,o={p:h,...MET};
 if(tu){const c=T.g||T.t;P(sph(.075,1,1,1,14),c,0,.06,.12,Object.assign({p:h},G(c,2.2)));[[.9,0],[-.5,.3]].forEach(([rx,ry],i)=>P(tor(.12,.014,24,6).rotateX(rx).rotateY(ry),i?T.t:T.c,0,.06,.12,o));
  if(cu===3)for(let k=0;k<8;k++){const a=k/8*PI*2;P(sph(.03,1,.8,1,6),'#e6e0d2',Math.cos(a)*.1,.06+Math.sin(a)*.1,.1,{p:h})}
  if(cu===4)P(box(.012,.3,.012),JRED,0,.06,.1,{p:h});return}
 if(cu===0){const hs=[[-.18,.2],[.18,.2],[.18,.0],[.12,-.14],[0,-.26],[-.12,-.14],[-.18,.0]];                                        // heater/cometa
  P(shp(hs,.04,.01),B,0,.0,.07,o);P(box(.012,.4,.02),D,0,-.01,.115,{p:h,ink:0});P(box(.3,.012,.02),D,0,.1,.115,{p:h,ink:0});if(met)P(sph(.045,1,1,.55),A,0,.1,.13,o);else for(let k=0;k<6;k++)P(sph(.01,1,1,1,6),T.c,-.15+k*.06,.2,.1,o);
  if(r>=2)P(tor(.06,.012,16,5).rotateX(0),A,0,.1,.13,o);return}
 if(cu===1){const lf=[[0,.27],[.15,.12],[.17,-.02],[.09,-.17],[0,-.26],[-.09,-.17],[-.17,-.02],[-.15,.12]];                           // hoja
  P(shp(lf,.04,.01),mixc(B,'#5a8a3a',.3),0,.0,.07,o);P(box(.014,.5,.02),'#3a5a22',0,0,.115,{p:h,ink:0});for(let k=0;k<4;k++)[-1,1].forEach(s=>P(box(.1,.01,.014),'#3a5a22',.05*s,.1-k*.06,.113,{p:h,rz:s*.6,ink:0}));
  if(met)P(sph(.035,1,1,.6),T.g||A,0,.0,.13,Object.assign({p:h},T.g?G(T.g,2):MET));return}
 if(cu===2){P(sph(.17,1,1.45,.2),mixc('#6a5a3a',B,.3),0,.0,.075,o);P(tor(.17,.016,24,6).scale(1,1.45,1),'#3a2a1a',0,0,.078,o);                                // óvalo de piel
  [-1,0,1].forEach(k=>P(box(.03,.4,.012),['#c8483a','#e8e0c0','#3a8a5a'][k+1],k*.075,0,.108,{p:h,ink:0}));
  for(let k=0;k<6;k++)P(sph(.016,1,1.3,1,6),'#e8e0c0',0,.2-k*.075,.115,{p:h});P(sph(.03,1,1.1,.6),T.t,0,0,.125,o);
  for(let k=0;k<3;k++)P(cone(.014,.08,4),['#c8483a','#e8c040','#3a8a5a'][k],(k-1)*.06,.3,.06,{p:h,rz:(k-1)*-.3});return}
 if(cu===3){P(sph(.2,1,1,.26),B,0,.0,.07,o);P(tor(.2,.02,26,7),A,0,0,.075,o);for(let k=0;k<8;k++){const a=k/8*PI*2;P(box(.012,.17,.018).rotateZ(-a),D,Math.sin(a)*.1,Math.cos(a)*.1,.118,{p:h,ink:0})}   // tablones + rayos
  P(sph(.06,1,1,.7),T.lo||D,0,0,.13,o);if(r>=2)for(let k=0;k<10;k++){const a=k/10*PI*2;P(sph(.011,1,1,1,6),A,Math.sin(a)*.17,Math.cos(a)*.17,.108,o)}
  if(T.g)P(sph(.028,1,1,.7,8),T.g,0,0,.17,Object.assign({p:h},G(T.g,2.2)));return}
 if(cu===4){const RED=JRED,LAC=jLac(met,B,L),hx=[[-.12,.25],[.12,.25],[.19,.1],[.19,-.1],[.12,-.25],[-.12,-.25],[-.19,-.1],[-.19,.1]];                    // tate: tablón alto
  P(shp(hx,.04,.01),LAC,0,0,.07,o);P(shp(hx.map(p=>[p[0]*.8,p[1]*.84]),.02,.006),mixc(LAC,'#ffffff',.12),0,0,.1,o);P(box(.34,.014,.02),RED,0,.12,.118,{p:h,ink:0});P(box(.34,.014,.02),RED,0,-.12,.118,{p:h,ink:0});
  P(cyl(.06,.06,.016,16).rotateX(PI/2),A,0,0,.125,o);P(cyl(.03,.03,.012,3).rotateX(PI/2),shade(A,.5),0,0,.136,{p:h,ink:0});if(T.g)P(sph(.02,1,1,.6,8),T.g,0,0,.145,Object.assign({p:h},G(T.g,2)));return}
 const DK=met?mixc('#241c20',T.c,.18):'#2a2024',GC=T.g||'#ff7a2a',pt=[[0,.3],[.14,.18],[.19,0],[.12,-.18],[0,-.27],[-.12,-.18],[-.19,0],[-.14,.18]];                      // infernal: escudo de púas
 P(shp(pt,.045,.012),DK,0,0,.07,o);P(shp(pt.map(p=>[p[0]*.72,p[1]*.72]),.02,.006),'#14101a',0,0,.105,o);
 pt.forEach((p,i)=>P(cone(.024,.09,4),'#14101a',p[0]*1.1,p[1]*1.1,.08,{p:h,rz:-Math.atan2(p[0],p[1]),...MET}));
 P(sph(.05,1,1.1,.6),GC,0,0,.13,Object.assign({p:h},G(GC,2.2)));[-1,1].forEach(s=>P(box(.012,.14,.008),GC,.09*s,0,.118,Object.assign({p:h,rz:s*.4},G(GC,1.5))))}
