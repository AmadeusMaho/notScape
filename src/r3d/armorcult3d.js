// NotScape · R3D · EQUIPO POR CULTURA (Lote R3D-CULTURAS, 18 oct 2026, idea del dueño) — todo por código.
// ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// REGLA DEL DUEÑO: cada bioma = una civilización y el equipo hecho con SUS minerales (el tier) es de ESA cultura: armaduras (metal, cuero, tela), escudos
// y TODAS las armas (espada, daga, mandoble, arco, ballesta, báculo, cetro…). Tabla tier → cultura (según dónde se mina cada mena, biomes.js `MI_ALL`):
//   0 PRADERA  (reino medieval)   cobre · estaño · bronce
//   1 BOSQUE   (guardianes élficos) hierro · acero
//   2 PANTANO  (tribal)            plata
//   3 CUMBRES  (nórdico)           mitril
//   4 ORIENTAL (samurái)           adamantita · runita
//   5 VOLCÁN   (forja infernal)    oricalco
//   6 INFIERNO (corte demoníaca: hierro negro, cadenas, cuernos, brasa)   infernita · ceniza infernal
//   7 CIELO    (griego: mármol, oro, alas, luz celeste)                    celestita · Árbol del Mundo
// El botín por bioma (casco/botas/capa/lt_*) ya usa el mismo índice k = cultura.
// CÓMO AÑADIR UNA CULTURA: añade su índice en CULT_OF, una rama en cada función (chestC, legsC, glovesC, shieldC) y en weapons3d.js (WCULT). Verifica de cerca
// con `python3 -I tools/r3d/armor_sheet.py <png> culturas …` (visor armaduras-3d.html ?set=culturas) y `weapons_sheet.py`.
// AJUSTE AL CUERPO: el peto es un casco liso que sigue el torso (mismo perfil que la camisa del Mini, +4,5 %), SIN pectorales abultados (los hacían parecer un pecho
// enorme en personajes femeninos y «futuristas»); el relieve va en láminas, cordones y remaches finos pegados a la superficie.
import * as THREE from 'three';

export const CULT_NAMES=['Pradera','Bosque','Pantano','Cumbres','Oriental','Volcán','Páramo','Desierto','Costa','Cielo','Infierno'];
export const CULT_OF={cobre:0,bronce:0,hierro:1,acero:1,plata:2,alba:3,mitril:3,adam:4,runita:4,oricalco:5,infernita:10,celestita:9,ceniza:10,
 madera:0,cuero:0,pino:0,abedul:0,roble:0,fresno:1,sauce:1,arce:2,tejo:3,ebano:4,caoba:4,baobab:5,mundo:9};   // + maderas de armas (arcos/báculos) y el cuero genérico
export const cultOf=t=>CULT_OF[t]??0;
export const CLOTH=['#9a7a52','#5f8048','#a08c52','#a9b8dc','#26222a','#2e242c','#3a3048','#d8c28a','#2a4a6a','#efeadf','#1a1016'];   // lana/seda de cada cultura (la túnica de tela se tiñe con el color del nivel un 30 %)
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
const ROPEC='#b89a62';
// CINTA que SIGUE la curvatura del torso (adiós a las «vigas» rectas; tools/r3d/beam_check.py). path = [[ángulo, y],…] (ángulo 0 = delante, + = lado derecho del personaje), w = ancho, off = separación de la piel.
export const ribbon=(R,path,w,off=.006,seg=12)=>{const pts=[];for(let i=0;i<=seg;i++){const t=i/seg*(path.length-1),j=Math.min(path.length-2,Math.floor(t)),u=t-j,th=path[j][0]*(1-u)+path[j+1][0]*u,y=path[j][1]*(1-u)+path[j+1][1]*u,r=R(y)+off;pts.push(new THREE.Vector3(Math.sin(th)*r,y,Math.cos(th)*r))}
 const pos=[],idx=[];for(let i=0;i<pts.length;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],tan=b.clone().sub(a).normalize(),n=new THREE.Vector3(pts[i].x,0,pts[i].z).normalize(),bi=new THREE.Vector3().crossVectors(tan,n).normalize();
  [-1,1].forEach(s=>{const q=pts[i].clone().addScaledVector(bi,s*w/2);pos.push(q.x,q.y,q.z)})}
 for(let i=0;i<pts.length-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2,a+2,a+1,a,a+2,a+3,a+1)}   // doble cara
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g};
const cloth=m=>{if(m&&m.userData)m.userData.cloth=1;return m};   // tela suelta que cuelga: se aparta del cuerpo a propósito (beam_check la ignora)
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
  else{for(let i=0;i<3;i++)[-1,1].forEach(s=>P(ribbon(R,[[s*.07*(i+.4)/R(.66),.76],[s*.07*(i+.4)/R(.66),.56]],.012,.003),shade(L,.78),0,0,0,{p:g}))}                                              // acolchado
  P(tor(R(.52)*1.02,.02,22,6).rotateX(PI/2),shade(L,.8),0,.515,0,{p:g});P(box(.05,.045,.016),A,0,.515,R(.52)*1.02+.006,{p:g,t:{rim:2}});               // cinturón
  P(tor(.105,.018,18,6).rotateX(PI/2),A,0,.845,0,{p:g,t:{rim:2}});
  side((a,q)=>{P(sph(.1,1.12,.78,1.05),B,.02*q,.03,0,Object.assign({p:a},MET));P(tor(.095,.012,16,6).rotateX(PI/2),A,.02*q,-.01,0,{p:a});
   if(r>=2)P(sph(.02,1,1,.8,6),A,.07*q,.07,.04,Object.assign({p:a},MET))});return}
 if(cu===1){                                                                   // BOSQUE: escamas de hoja solapadas, faja verde, hombreras de hojas
  shell(P,F,mixc(B,'#5a6a38',met?.3:.15));const LF=mixc(met?T.c:L,'#7ab04a',.4);
  [[.58,5],[.64,6],[.7,6],[.76,5]].forEach(([y,n],j)=>{for(let i=0;i<n;i++){const a=(i/(n-1)-.5)*(1.9-j*.12);const [x,yy,z]=onSurf(R,y,a,.004);
   P(sph(.034,1,.55,1.55,8),(i+j)%2?LF:B,x,yy,z,{p:g,t:{rim:2},ry:a,rx:.35})}});
  P(ribbon(R,[[-.75,.86],[0,.66],[.75,.46]],.05,.012),'#4a6a2a',0,0,0,{p:g,t:{rim:1}});                                                                                  // faja diagonal
  if(met)P(sph(.026,1,1,.8,8),T.g||'#9ad060',0,.53,R(.52)+.02,Object.assign({p:g},T.g?G(T.g,2):{t:{rim:2}}));
  P(tor(R(.52)*1.02,.018,22,6).rotateX(PI/2),'#4a3220',0,.515,0,{p:g});P(tor(.1,.02,18,6).rotateX(PI/2),'#5a7a3a',0,.845,0,{p:g});
  side((a,q)=>[[.03,.1,.8],[-.015,.088,.75],[-.05,.075,.7]].forEach(([y,s,h],i)=>P(sph(s,1.25,h*.5,1.1),i%2?LF:B,.02*q+(i-1)*.012*q,y,0,Object.assign({p:a,rz:-q*(.15+i*.18)},MET))));return}
 if(cu===2){                                                                   // PANTANO (rehecho): cuero de ciénaga con pintura de guerra, collar de colmillos, falda de juncos, musgo colgante, tótem tallado en un hombro
  const HIDE=met?mixc('#5a5a38',T.c,.2):mixc(L,'#5a5a38',.35),BONE='#e8e0c0',PN=['#c8483a','#e8c040','#3a8a5a'];shell(P,F,HIDE);
  PN.forEach((c,i)=>P(ribbon(R,[[-.62,.8-i*.045],[0,.67-i*.045],[.62,.54-i*.045]],.032,.008),c,0,0,0,{p:g,t:{rim:1}}));                                                               // franjas de pintura
  P(tor(R(.52)*1.02,.024,22,6).rotateX(PI/2),shade(HIDE,.55),0,.515,0,{p:g});
  for(let i=0;i<16;i++){const a=i/16*PI*2,h=.13+.05*((i*7)%3);cloth(P(box(.034,h,.006),i%2?'#6a8a3a':'#8a9a4a',Math.sin(a)*R(.52)*1.05,.5-h/2,Math.cos(a)*R(.52)*1.05,{p:g,ry:a,rx:.08,t:{rim:1}}))}   // falda de juncos
  for(let i=0;i<9;i++){const a=(i/8-.5)*PI*.9;P(cone(.014,.055,4),BONE,Math.sin(a)*.115,.835,Math.cos(a)*.115*.92,{p:g,rx:-.5,rz:-Math.sin(a)*.6,t:{rim:2}})}    // collar de colmillos
  if(met)P(sph(.028,1,1,.7,8),T.t,0,.72,R(.72)+.01,{p:g,t:{rim:2}});
  for(let i=0;i<5;i++)P(cone(.016,.14+.03*(i%2),4),i%2?'#4a6a2a':'#6a8a3a',(i-2)*.05,.62,-R(.62)-.02,{p:g,rx:PI+.15});                                         // musgo colgante a la espalda
  side((a,q)=>{if(q>0){P(box(.13,.15,.07),'#6a4a2a',.07*q,.07,0,Object.assign({p:a,rz:-.15},MET));P(box(.1,.12,.02),'#8a6a3a',.07*q,.07,.045,{p:a,rz:-.15});   // tótem tallado
    [-1,1].forEach(s=>{P(sph(.02,1.3,.8,.6,8),'#14100a',(.07+.025*s)*q,.1,.06,{p:a});P(sph(.01,1,1,.5,6),'#8aff8a',(.07+.025*s)*q,.1,.072,Object.assign({p:a},G('#8aff8a',2)))});P(box(.07,.015,.02),'#14100a',.07*q,.04,.058,{p:a});
    [-1,1].forEach(s=>P(cone(.014,.09,4),BONE,(.07+.05*s)*q,.02,.05,{p:a,rz:s*.3,rx:PI}));for(let i=0;i<3;i++)P(box(.02,.12,.006),PN[i],(.1+i*.012)*q,.12,-.03-i*.02,{p:a,rz:-q*(.4+i*.25),t:{rim:1}})}
   else{P(sph(.085,1,.7,1),HIDE,.02*q,.03,0,{p:a});for(let i=0;i<4;i++)P(sph(.034,1,.6,1,7),i%2?'#4a6a2a':'#6a8a3a',(i-1.5)*.03,.08,(i%2?.03:-.03),{p:a});P(tor(.07,.012,12,4).rotateX(PI/2),BONE,.02*q,-.04,0,{p:a})}});return}
 if(cu===3){                                                                   // CUMBRES: cota + correas, cuello y hombros de piel, discos
  const FUR='#e6e0d2',FUR2='#c9c2b0';shell(P,F,met?mixc(B,'#6a7078',.15):B);
  if(met)for(let y=.55;y<.8;y+=.036)P(tor(R(y)*1.004,.0055,24,4).rotateX(PI/2),T.d,0,y,0,{p:g});                                                         // anillas de cota
  [-1,1].forEach(s=>P(ribbon(R,[[s*Math.asin(.1/R(.68)),.86],[s*Math.asin(.1/R(.68)),.52]],.034,.006),shade(L,.7),0,0,0,{p:g}));                                      // tirantes
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
 if(cu===6){                                                                   // PÁRAMO: ruinas arcanas — túnica raída, tablilla rúnica en el pecho, collar alto, losas flotantes en los hombros
  const ST=met?mixc('#3a3448',T.c,.012):mixc('#3a3448',L,.2),RU='#9a8ad8',SL='#4a4258';shell(P,F,ST);
  P(box(.13,.17,.022),SL,0,.67,R(.67)+.014,{p:g,t:{rim:2}});[[0,.67,.016,.12],[0,.67,.08,.016],[.0,.74,.05,.014]].forEach(([x,y,w,h])=>P(box(w,h,.012),RU,x,y,R(.67)+.03,Object.assign({p:g},G(RU,1.8))));   // sigilo
  P(tor(.115,.02,18,6).rotateX(PI/2),SL,0,.86,0,{p:g,t:{rim:2}});for(let i=0;i<7;i++){const a=(i/6-.5)*PI*1.1;P(cone(.016,.09,4),SL,Math.sin(a)*.12,.9,-Math.cos(a)*.1,{p:g,rx:.25,t:{rim:2}})}       // gola alta con puntas
  for(let i=0;i<10;i++){const a=i/10*PI*2,h=.12+.07*((i*37)%5)/4;cloth(P(box(.055,h,.008),shade(ST,.7+.06*(i%3)),Math.sin(a)*R(.52)*1.05,.5-h/2,Math.cos(a)*R(.52)*1.05,{p:g,ry:a,rx:.06,t:{rim:1}}))}   // jirones colgantes
  P(tor(R(.52)*1.02,.018,22,6).rotateX(PI/2),SL,0,.515,0,{p:g});[-1,1].forEach(s=>P(ribbon(R,[[s*.5,.66],[s*.34,.5]],.014,.006),RU,0,0,0,Object.assign({p:g},G(RU,1.4))));
  side((a,q)=>{P(box(.15,.022,.12),SL,.07*q,.14+.01*q*q,0,{p:a,rz:-q*.12,t:{rim:2}});P(box(.08,.014,.07),RU,.07*q,.158,0,Object.assign({p:a,rz:-q*.12},G(RU,1.6)));   // losa flotante
   for(let i=0;i<3;i++)P(cone(.012,.06,4),RU,(.02+i*.035)*q,.06-i*.015,.07-i*.07,Object.assign({p:a,rz:-q*.5},G(RU,1.4)));P(sph(.07,1,.7,1),ST,.02*q,.03,0,{p:a})});return}
 if(cu===7){                                                                   // DESIERTO: lino y oro — gran collar usekh, faldellín envuelto, hombro único de disco solar, brazalete
  const LN=met?mixc('#d8c8a0',T.c,.08):mixc('#d8c8a0',L,.15),GD='#e0b84a',LP='#2a5a9a',RD='#c8483a';shell(P,F,LN);
  [[.1,.012,GD],[.125,.014,LP],[.15,.016,RD],[.175,.012,GD]].forEach(([r,t,c],i)=>frontArc(P,g,R(.78)*(1+i*.07)+.005,t,.78-i*.03,PI*(.95+i*.04),c,{t:{rim:2}}));    // collar ancho en semicírculos
  [.56,.62,.68].forEach(y=>P(tor(R(y)*1.008,.007,22,4).rotateX(PI/2),GD,0,y,0,{p:g}));P(cyl(.045,.045,.012,16).rotateX(PI/2),GD,0,.66,R(.66)+.012,{p:g,t:{rim:2}});P(sph(.02,1,1,.7,8),RD,0,.66,R(.66)+.022,{p:g});   // bandas + sol
  P(tor(R(.52)*1.025,.026,22,6).rotateX(PI/2),'#f0e8d0',0,.515,0,{p:g});for(let i=0;i<5;i++){const x=(i-2)*.05;cloth(P(box(.045,.18,.01),i%2?GD:'#f0e8d0',x,.4,R(.5)*1.06,{p:g,rx:.12,t:{rim:1}}))}   // faldellín
  side((a,q)=>{if(q>0){P(cyl(.1,.1,.02,18).rotateX(PI/2),GD,.03*q,.06,.0,{p:a,t:{rim:2}});P(cyl(.07,.07,.024,18).rotateX(PI/2),'#f0e8d0',.03*q,.06,.0,{p:a});for(let i=0;i<10;i++){const b=i/10*PI*2;P(cone(.012,.05,4),GD,.03*q+Math.cos(b)*.115,.06+Math.sin(b)*.115,0,{p:a,rz:b-PI/2})}P(sph(.022),RD,.03*q,.06,.02,{p:a})}   // disco solar
   else{P(sph(.085,1,.8,1.05),LN,.02*q,.03,0,{p:a});P(tor(.085,.012,14,5).rotateX(PI/2),GD,.02*q,-.02,0,{p:a});P(sph(.018),LP,.02*q,-.02,.085,{p:a})}});return}
 if(cu===8){                                                                   // COSTA: casaca de pirata — solapas, doble fila de botones, bandolera, ancho cinturón con hebilla, faja roja, hombro de cuerda
  const NV=met?mixc('#2a3a5a',T.c,.07):mixc('#2a3a5a',L,.2),BR='#c8a040',RD='#a02a2a',LT='#4a3020';shell(P,F,NV);
  [-1,1].forEach(s=>P(ribbon(R,[[s*.5,.85],[s*.3,.66],[s*.12,.5]],.065,.01),shade(NV,1.5),0,0,0,{p:g,t:{rim:1}}));    // solapas
  for(let i=0;i<5;i++)[-1,1].forEach(s=>P(sph(.012,1,1,.6,6),BR,.035*s,.74-i*.045,R(.7-i*.045)+.014,{p:g,t:{rim:2}}));   // botones
  P(ribbon(R,[[-.8,.86],[0,.66],[.8,.46]],.036,.016),LT,0,0,0,{p:g,t:{rim:1}});for(let i=0;i<4;i++){const th=(i-1.5)*.34,y=.66-(i-1.5)*.063;P(box(.02,.06,.016),'#8a8a92',Math.sin(th)*(R(y)+.03),y,Math.cos(th)*(R(y)+.03),{p:g,ry:th,rz:-.6,t:{rim:2}})}   // bandolera con dagas
  P(tor(R(.52)*1.04,.035,22,6).rotateX(PI/2),RD,0,.55,0,{p:g});P(tor(R(.5)*1.02,.026,22,6).rotateX(PI/2),LT,0,.5,0,{p:g});P(box(.07,.05,.016),BR,0,.5,R(.5)*1.02+.012,{p:g,t:{rim:2}});P(box(.04,.028,.018),LT,0,.5,R(.5)*1.02+.014,{p:g});   // faja + cinturón + hebilla
  P(tor(.11,.022,18,6).rotateX(PI/2),shade(NV,1.4),0,.85,0,{p:g});P(box(.16,.05,.03),'#f0ece0',0,.84,R(.84)+.012,{p:g,t:{rim:1}});   // cuello de camisa
  side((a,q)=>{if(q>0){P(sph(.092,1.12,.8,1.05),NV,.02*q,.03,0,{p:a});for(let i=0;i<4;i++)P(tor(.088,.01,14,5).rotateX(PI/2),ROPEC,.02*q,.07-i*.028,0,{p:a});for(let i=0;i<6;i++)P(cyl(.006,.006,.08,4),ROPEC,.02*q+(i-2.5)*.03,-.04,.09,{p:a,rx:.1})}   // hombrera de cuerda con flecos
   else{P(sph(.088,1.1,.8,1.05),NV,.02*q,.03,0,{p:a});P(tor(.085,.012,14,5).rotateX(PI/2),BR,.02*q,-.01,0,{p:a})}});return}
 if(cu===10){                                                                   // INFIERNO: placas negras apiladas, cadenas en aspa, ojo de brasa, cuernos curvos
  const IR=met?mixc('#17121a',T.c,.04):mixc('#1a1418',L,.35),EM=T.g||'#ff3a1c',CH='#5a4a52';shell(P,F,IR);
  [.58,.64,.7,.76].forEach((y,i)=>P(tor(R(y)*1.012,.016,24,5).rotateX(PI/2),i%2?'#0e0a0e':shade(IR,1.4),0,y,0,{p:g,t:{rim:2}}));
  [-1,1].forEach(s=>{for(let k=0;k<7;k++){const x=(k-3)*.034,y=.66+(k-3)*.034*s;P(tor(.014,.004,6,4),CH,x,y,R(y)+.012,{p:g,ry:k%2?PI/2:0})}});
  P(sph(.03,1.3,.8,.7,8),'#14101a',0,.7,R(.7)+.012,{p:g,t:{rim:2}});P(sph(.014,1.4,.8,.6,8),EM,0,.7,R(.7)+.026,Object.assign({p:g},G(EM,2.2)));
  [-1,1].forEach(s=>P(box(.01,.12,.006),EM,.09*s,.6,R(.6)+.006,Object.assign({p:g,rz:s*.4},G(EM,1.5))));
  for(let i=0;i<5;i++)P(cone(.016,.09,4),'#0e0a0e',0,.6+i*.05,-R(.7)-.012,{p:g,rx:-PI/2-.35,t:{rim:2}});
  P(tor(R(.52)*1.02,.022,22,6).rotateX(PI/2),'#0e0a0e',0,.515,0,{p:g});P(tor(.02,.006,8,5),CH,0,.5,R(.52)+.03,{p:g});
  for(let i=0;i<8;i++){const a=i/8*PI*2;P(cone(.014,.06,4),'#14101a',Math.sin(a)*.115,.87,Math.cos(a)*.115,{p:g,rx:Math.cos(a)*.1,t:{rim:2}})}
  side((a,q)=>{P(sph(.1,1.15,.8,1.05),IR,.02*q,.03,0,Object.assign({p:a},MET));P(cone(.032,.2,5),'#0e0a0e',.05*q,.13,0,{p:a,rz:-q*.5,t:{rim:2}});P(cone(.02,.13,5),'#0e0a0e',.1*q,.08,0,{p:a,rz:-q*1.1,t:{rim:2}});
   P(tor(.098,.01,16,5).rotateX(PI/2),EM,.02*q,0,0,Object.assign({p:a},G(EM,1.4)))});return}
 if(cu===9){                                                                   // CIELO: coraza de mármol con oro, pteruges, collar de laurel, hombreras aladas
  const MB=met?mixc('#efeadf',T.c,.1):mixc('#e8e2d4',L,.25),GD='#e0b84a',CE='#9fd8ff';shell(P,F,MB);
  P(box(.012,.24,.008),GD,0,.62,R(.62)+.006,{p:g,t:{rim:2}});[.58,.64].forEach(y=>[-1,1].forEach(s=>P(box(.06,.01,.008),GD,.04*s,y,R(y)+.006,{p:g,t:{rim:2}})));
  P(cyl(.04,.04,.014,14).rotateX(PI/2),GD,0,.74,R(.74)+.012,{p:g,t:{rim:2}});P(sph(.02,1,1,.7,8),CE,0,.74,R(.74)+.02,Object.assign({p:g},G(CE,2)));
  P(tor(R(.52)*1.02,.022,22,6).rotateX(PI/2),GD,0,.515,0,{p:g,t:{rim:2}});
  for(let i=0;i<12;i++){const a=i/12*PI*2;cloth(P(box(.05,.1,.012),i%2?GD:MB,Math.sin(a)*R(.52)*1.04,.46,Math.cos(a)*R(.52)*1.04,{p:g,ry:a,t:{rim:1}}))}
  for(let i=0;i<12;i++){const a=i/12*PI*2;P(sph(.022,1,.5,1.5,6),i%2?'#8fb04a':GD,Math.sin(a)*.115,.845,Math.cos(a)*.115,{p:g,rx:.3,ry:a})}
  side((a,q)=>{P(sph(.095,1.1,.75,1.05),MB,.02*q,.03,0,Object.assign({p:a},MET));for(let i=0;i<4;i++)P(box(.1-i*.012,.014,.026),i%2?GD:'#f2efe6',(.06+i*.008)*q,.09+i*.026,0,{p:a,rz:-q*(.35+i*.18),t:{rim:1}});P(tor(.092,.01,16,5).rotateX(PI/2),GD,.02*q,0,0,{p:a,t:{rim:2}})});return}
 // VOLCÁN: placa oscura con grietas de fuego, hombreras con cuernos, púas dorsales
 const DK=met?mixc('#241c20',T.c,.18):mixc('#2a2024',L,.4),GC=T.g||'#ff7a2a';shell(P,F,DK);
 [-1,1].forEach(s=>{P(box(.014,.2,.006),GC,.06*s,.66,R(.66)+.006,Object.assign({p:g,rz:-s*.35},G(GC,1.5)));P(box(.012,.1,.006),GC,.1*s,.6,R(.6)+.006,Object.assign({p:g,rz:s*.5},G(GC,1.5)))});
 P(box(.012,.14,.006),GC,0,.57,R(.57)+.006,Object.assign({p:g},G(GC,1.5)));P(sph(.022,1,1,.7,8),GC,0,.72,R(.72)+.01,Object.assign({p:g},G(GC,2.2)));
 [.58,.7].forEach(y=>P(tor(R(y)*1.008,.01,24,5).rotateX(PI/2),'#14101a',0,y,0,{p:g}));
 P(box(.13,.2,.06),'#241c20',0,.66,-R(.66)-.03,{p:g,t:{rim:2}});P(box(.08,.04,.02),GC,0,.7,-R(.7)-.062,Object.assign({p:g},G(GC,1.8)));[-1,1].forEach(s=>P(cyl(.014,.018,.12,6),'#14101a',.04*s,.8,-R(.78)-.03,{p:g,rx:-.15}));   // fogón a la espalda con chimeneas
 P(tor(R(.52)*1.02,.02,22,6).rotateX(PI/2),'#14101a',0,.515,0,{p:g});P(tor(.105,.02,18,6).rotateX(PI/2),'#14101a',0,.845,0,{p:g});
 side((a,q)=>{P(box(.16,.075,.13),DK,.07*q,.07,0,Object.assign({p:a,rz:-q*.22},MET));P(box(.13,.06,.11),shade(DK,1.3),.1*q,.02,0,Object.assign({p:a,rz:-q*.35},MET));
  P(box(.1,.01,.01),GC,.075*q,.113,.066,Object.assign({p:a,rz:-q*.22},G(GC,1.6)));P(box(.012,.05,.012),GC,.12*q,.03,.058,Object.assign({p:a,rz:-q*.3},G(GC,1.6)))})}

// ═══ TÚNICA (familia tela) por cultura: la base es chestRobe (armor3d.js); aquí solo el adorno del cuello/pecho/fajín ═══
export function robeC(F,g,P,T,cu,G){const R=torsoR(F),FUR='#e6e0d2';
 if(cu===0){P(box(.09,.34,.012),T.t,0,.62,R(.62)+.008,{p:g,t:{rim:1}});return}                                                                       // tabardo con franja
 if(cu===1){for(let i=0;i<7;i++){const a=(i/6-.5)*1.5;P(sph(.03,1,.5,1.5,7),i%2?'#7ab04a':'#5a8a3a',Math.sin(a)*.112,.835,Math.cos(a)*.112,{p:g,rx:.4,ry:a})}return}   // cuello de hojas
 if(cu===2){for(let i=0;i<7;i++){const a=(i/6-.5)*PI*.8;P(cone(.014,.05,4),'#e8e0c0',Math.sin(a)*.112,.83,Math.cos(a)*.112,{p:g,rx:-.5})}for(let i=0;i<3;i++)P(sph(.016,1,1,1,6),['#c8483a','#e8c040','#3a8a5a'][i],(i-1)*.04,.52,R(.52)+.04,{p:g});return}
 if(cu===3){for(let i=0;i<12;i++){const a=i/12*PI*2;P(sph(.034,1,.8,1,7),i%2?FUR:'#c9c2b0',Math.sin(a)*.115,.845,Math.cos(a)*.115,{p:g})}return}
 if(cu===4){[-1,1].forEach(s=>P(ribbon(R,[[s*.5,.86],[s*.08,.66]],.03,.006),T.t,0,0,0,{p:g}));P(box(.14,.04,.02),'#2a1c18',0,.512,R(.52)+.03,{p:g});return}                  // cuello cruzado (kimono) + nudo del obi
 if(cu===6){P(box(.1,.3,.01),'#4a4258',0,.62,R(.62)+.008,{p:g,t:{rim:1}});P(box(.012,.2,.012),'#9a8ad8',0,.62,R(.62)+.02,Object.assign({p:g},G('#9a8ad8',1.6)));return}
 if(cu===7){for(let i=0;i<4;i++)P(tor(.1+i*.012,.01,18,4,PI*1.1).rotateZ(PI/2-PI*.55).rotateX(PI/2),['#e0b84a','#2a5a9a','#c8483a','#e0b84a'][i],0,.8-i*.03,0,{p:g,t:{rim:1}});return}
 if(cu===8){P(box(.14,.045,.02),'#a02a2a',0,.51,R(.52)+.03,{p:g});for(let i=0;i<4;i++)P(sph(.012),'#c8a040',(i-1.5)*.03,.7,R(.7)+.012,{p:g});return}
 if(cu===10){[-1,1].forEach(s=>P(ribbon(R,[[s*.55,.76],[s*.38,.54]],.012,.008),T.g||'#ff3a1c',0,0,0,Object.assign({p:g},G(T.g||'#ff3a1c',1.5))));for(let i=0;i<6;i++){const a=(i/5-.5)*1.5;P(cone(.012,.05,4),'#14101a',Math.sin(a)*.112,.85,Math.cos(a)*.112,{p:g,rx:.2})}return}
 if(cu===9){P(box(.06,.36,.01),'#e0b84a',0,.62,R(.62)+.008,{p:g,t:{rim:1}});for(let i=0;i<9;i++){const a=(i/8-.5)*PI*.9;P(sph(.02,1,.5,1.5,6),i%2?'#8fb04a':'#e0b84a',Math.sin(a)*.112,.835,Math.cos(a)*.112,{p:g,rx:.4,ry:a})}return}
 [-1,1].forEach(s=>P(ribbon(R,[[s*.55,.76],[s*.38,.54]],.012,.008),T.g||'#ff7a2a',0,0,0,Object.assign({p:g},G(T.g||'#ff7a2a',1.5))))}

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
  else if(cu===2){const H=mixc('#5a5a38',B,.25),BN='#e8e0c0';P(cyl(.082,.074,.17,10),H,0,-.095,0,{p:l});for(let k=0;k<4;k++)P(tor(.08,.01,12,4).rotateX(PI/2),k%2?'#6a8a3a':'#8a9a4a',0,-.04-k*.035,0,{p:l});   // juncos atados
   P(cyl(.072,.064,.2,10),shade(H,.85),0,-.1,0,{p:kn});[-.05,-.1,-.15].forEach(y=>P(tor(.074,.01,14,5).rotateX(PI/2),'#3a2a1a',0,y,0,{p:kn}));P(sph(.045,1,1,.5,8),BN,0,0,.085,{p:kn,...MET});for(let k=0;k<3;k++)P(cone(.012,.05,4),BN,(k-1)*.03,-.04,.08,{p:kn,rx:PI})}
  else if(cu===3){P(cyl(.086,.078,.17,10),B,0,-.095,0,{p:l,...MET});P(tor(.085,.012,14,6).rotateX(PI/2),A,0,-.015,0,{p:l});P(sph(.075,1,.8,1.05,10),B,0,0,.02,{p:kn,...MET});P(cyl(.072,.064,.15,10),lo,0,-.115,.004,{p:kn,...MET});
   for(let k=0;k<9;k++){const a=k/9*PI*2;P(sph(.03,1,.8,1,6),k%2?'#e6e0d2':'#c9c2b0',Math.sin(a)*.075,-.17,Math.cos(a)*.075,{p:kn})}}
  else if(cu===4){const LAC=jLac(met,B,L);P(box(.15,.17,.13),LAC,0,-.095,0,{p:l,...MET});P(box(.152,.012,.132),JRED,0,-.17,0,{p:l});                // haidate (muslera de placas)
   P(cyl(.05,.05,.012,10).rotateX(PI/2),A,0,0,.095,{p:kn,...MET});P(cyl(.07,.062,.15,10),shade(LAC,.7),0,-.115,.0,{p:kn});P(box(.07,.14,.018),LAC,0,-.115,.062,{p:kn,...MET});    // suneate (greba)
   [-.07,-.12,-.16].forEach(y=>P(tor(.068,.006,14,4).rotateX(PI/2),JRED,0,y,0,{p:kn}))}
  else if(cu===6){const ST='#3a3448',RU='#9a8ad8';P(cyl(.086,.078,.17,10),ST,0,-.095,0,{p:l});for(let k=0;k<5;k++)cloth(P(box(.034,.1+(k%3)*.04,.008),shade(ST,.8+.08*(k%3)),(k-2)*.034,-.12,.082,{p:l,rx:.08}));   // PÁRAMO: jirones sobre el muslo
   P(sph(.076,1,.9,1.1,10),'#4a4258',0,0,.022,{p:kn});P(box(.05,.07,.014),'#e8e0c0',0,0,.1,{p:kn,t:{rim:2}});P(box(.012,.04,.01),RU,0,0,.112,Object.assign({p:kn},G(RU,1.6)));P(cyl(.07,.062,.15,10),ST,0,-.115,.004,{p:kn});P(tor(.066,.008,12,4).rotateX(PI/2),'#e8e0c0',0,-.17,0,{p:kn})}
  else if(cu===7){const LN='#d8c8a0',GD='#e0b84a';P(cyl(.086,.078,.17,10),LN,0,-.095,0,{p:l});for(let k=0;k<4;k++)P(tor(.084,.008,14,4).rotateX(PI/2),k%2?GD:'#f0e8d0',0,-.04-k*.035,0,{p:l});   // DESIERTO: vendas de lino y oro
   P(sph(.074,1,.9,1.1,10),LN,0,0,.02,{p:kn});P(cyl(.07,.062,.15,10),'#f0e8d0',0,-.115,.004,{p:kn});for(let k=0;k<5;k++)P(tor(.068,.007,12,4).rotateX(PI/2),k%2?GD:LN,0,-.07-k*.025,0,{p:kn});P(cyl(.025,.025,.012,10).rotateX(PI/2),'#2a5a9a',0,0,.095,{p:kn})}
  else if(cu===8){const NV='#2a3a5a',LT='#4a3020';P(cyl(.086,.078,.17,10),shade(NV,1.1),0,-.095,0,{p:l});P(tor(.085,.012,14,5).rotateX(PI/2),'#c8a040',0,-.015,0,{p:l});   // COSTA: calzón y bota con vuelta ancha
   P(sph(.076,1,.9,1.1,10),NV,0,0,.02,{p:kn});P(cyl(.065,.058,.12,10),LT,0,-.12,.004,{p:kn});P(cyl(.092,.07,.07,12),shade(LT,1.2),0,-.06,.006,{p:kn});P(tor(.09,.008,14,4).rotateX(PI/2),'#c8a040',0,-.025,0,{p:kn})}
  else if(cu===10){const EM=T.g||'#ff3a1c';P(cyl(.086,.078,.17,10),'#17121a',0,-.095,0,{p:l,...MET});[-.04,-.09,-.14].forEach(y=>P(tor(.082,.008,14,5).rotateX(PI/2),'#3a2e36',0,y,0,{p:l}));P(sph(.08,1,.9,1.1,10),'#17121a',0,0,.022,{p:kn,...MET});P(cone(.03,.1,5),'#0e0a0e',0,0,.1,{p:kn,rx:PI/2,...MET});
   P(cyl(.073,.065,.15,10),'#1c161e',0,-.115,.004,{p:kn,...MET});P(box(.012,.1,.008),EM,0,-.115,.072,Object.assign({p:kn},G(EM,1.6)))}
  else if(cu===9){P(cyl(.086,.078,.17,10),'#efeadf',0,-.095,0,{p:l,...MET});P(tor(.085,.012,14,6).rotateX(PI/2),'#e0b84a',0,-.015,0,{p:l});for(let k=0;k<8;k++){const a=k/8*PI*2;P(box(.034,.1,.01),k%2?'#e0b84a':'#f2efe6',Math.sin(a)*.09,-.06,Math.cos(a)*.09,{p:l,ry:a})}
   P(sph(.08,1,.9,1.1,10),'#efeadf',0,0,.022,{p:kn,...MET});P(cyl(.025,.025,.012,10).rotateX(PI/2),'#e0b84a',0,0,.1,{p:kn,...MET});P(cyl(.073,.065,.15,10),'#e0b84a',0,-.115,.004,{p:kn,...MET})}
  else{P(cyl(.086,.078,.17,10),'#241c20',0,-.095,0,{p:l,...MET});P(sph(.08,1,.9,1.1,10),'#241c20',0,0,.022,{p:kn,...MET});P(cone(.026,.08,5),'#14101a',0,.0,.1,{p:kn,rx:PI/2,...MET});
   P(cyl(.073,.065,.15,10),'#2a2024',0,-.115,.004,{p:kn,...MET});[-1,1].forEach(s=>P(box(.012,.11,.008),T.g||'#ff7a2a',.03*s,-.115,.07,Object.assign({p:kn},G(T.g||'#ff7a2a',1.6))))}})}

// ═══════════════════════════════ GUANTES POR CULTURA ═══════════════════════════════
export function glovesC(F,g,P,T,fam,cu,G){const L=mixc('#7a4c26',T.c,.07),met=fam==='m',tu=fam==='tu',B=met?T.c:tu?clothC(cu,T):L,lo=met?T.lo:shade(B,.8),A=met?T.t:cu===4?'#c9a24a':T.c;
 F.elbows.forEach((e,i)=>{const q=i?1:-1;
  P(sph(.06,1.05,.9,1.05,12),cu===4&&!tu?jLac(met,B,L):B,0,-.185,0,{p:e,...(met?MET:{})});                                                                                                        // puño
  if(cu===0){P(cyl(.066,.058,.1,12),lo,0,-.125,0,{p:e,...(met?MET:{})});P(tor(.063,.012,14,6).rotateX(PI/2),A,0,-.075,0,{p:e});if(met)[-.02,0,.02].forEach(x=>P(sph(.013,1,1,1,6),lo,x,-.2,.05,{p:e,...MET}))}
  else if(cu===1){P(cyl(.064,.058,.1,10),shade(B,.9),0,-.125,0,{p:e});[-.1,-.14].forEach(y=>P(tor(.062,.009,12,4).rotateX(PI/2),'#4a6a2a',0,y,0,{p:e}));P(sph(.026,1,.5,1.5,6),'#7ab04a',0,-.11,.06,{p:e,rx:.3})}
  else if(cu===2){P(cyl(.062,.056,.09,10),'#5a5a38',0,-.125,0,{p:e});for(let k=0;k<3;k++)P(tor(.062,.008,12,4).rotateX(PI/2),['#c8483a','#e8c040','#3a8a5a'][k],0,-.09-k*.025,0,{p:e});for(let k=0;k<3;k++)P(cone(.012,.05,4),'#e8e0c0',(k-1)*.03,-.205,.03,{p:e,rx:-.5,...MET})}
  else if(cu===3){P(cyl(.064,.058,.09,10),lo,0,-.13,0,{p:e,...(met?MET:{})});for(let k=0;k<8;k++){const a=k/8*PI*2;P(sph(.028,1,.8,1,6),k%2?'#e6e0d2':'#c9c2b0',Math.sin(a)*.065,-.085,Math.cos(a)*.065,{p:e})}}
  else if(cu===4){const LAC=jLac(met,B,L);P(box(.1,.12,.1),LAC,0,-.12,0,{p:e,...MET});P(box(.102,.012,.102),JRED,0,-.07,0,{p:e});P(box(.1,.02,.1),JRED,0,-.17,0,{p:e})}                // kote
  else if(cu===6){P(cyl(.064,.058,.09,10),'#3a3448',0,-.125,0,{p:e});for(let k=0;k<3;k++)P(box(.02,.04,.012),'#e8e0c0',(k-1)*.03,-.2,.05,{p:e,rx:-.3,t:{rim:2}});P(box(.03,.05,.012),'#9a8ad8',0,-.1,.065,Object.assign({p:e},G('#9a8ad8',1.6)))}
  else if(cu===7){P(cyl(.07,.058,.1,12),'#e0b84a',0,-.125,0,{p:e,...MET});P(tor(.066,.008,12,4).rotateX(PI/2),'#2a5a9a',0,-.1,0,{p:e});P(tor(.062,.008,12,4).rotateX(PI/2),'#c8483a',0,-.15,0,{p:e});P(cyl(.02,.02,.012,8).rotateX(PI/2),'#f0e8d0',0,-.12,.066,{p:e})}
  else if(cu===8){P(cyl(.06,.056,.08,10),'#4a3020',0,-.14,0,{p:e});P(cyl(.092,.062,.07,12),'#5a3a24',0,-.09,0,{p:e});P(tor(.09,.008,12,4).rotateX(PI/2),'#c8a040',0,-.06,0,{p:e});P(sph(.012,1,1,.6,6),'#c8a040',.07,-.09,0,{p:e})}
  else if(cu===10){P(cyl(.066,.058,.1,10),'#17121a',0,-.125,0,{p:e,...MET});[-1,0,1].forEach(x=>P(cone(.014,.07,4),'#0e0a0e',x*.026,-.225,.03,{p:e,rx:-.5,...MET}));P(tor(.064,.01,14,5).rotateX(PI/2),'#5a4a52',0,-.075,0,{p:e});P(sph(.014),T.g||'#ff3a1c',0,-.2,.05,Object.assign({p:e},G(T.g||'#ff3a1c',1.8)))}
  else if(cu===9){P(cyl(.066,.058,.1,10),'#efeadf',0,-.125,0,{p:e,...(met?MET:{})});P(tor(.063,.012,14,6).rotateX(PI/2),'#e0b84a',0,-.075,0,{p:e});[-1,1].forEach(s=>P(box(.012,.07,.03),'#f2efe6',.07*s,-.1,0,{p:e,rz:s*.5}))}
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
 if(cu===2){const WD=mixc('#6a4a2a',B,.2),BN='#e8e0c0';   // PANTANO: tablón-tótem tallado con cara y plumas
  const pn=[[-.14,-.27],[.14,-.27],[.18,.12],[.1,.27],[-.1,.27],[-.18,.12]];P(shp(pn,.045,.01),WD,0,0,.07,o);P(shp(pn.map(q=>[q[0]*.82,q[1]*.86]),.016,.006),shade(WD,.75),0,0,.1,o);
  [-1,1].forEach(s=>{P(sph(.04,1.2,.8,.6,10),'#14100a',.07*s,.1,.125,{p:h});P(sph(.02,1,1,.5,8),'#8aff8a',.07*s,.1,.14,Object.assign({p:h},G('#8aff8a',2.2)));P(cone(.016,.12,4),BN,.12*s,-.1,.12,{p:h,rz:s*.3,rx:PI})});
  P(box(.14,.03,.02),'#14100a',0,-.03,.125,{p:h});for(let k=0;k<5;k++)P(box(.016,.04,.014),BN,(k-2)*.026,-.03,.14,{p:h});[-1,0,1].forEach(k=>P(box(.012,.1,.012),['#c8483a','#e8c040','#3a8a5a'][k+1],k*.06,.2,.12,{p:h,ink:0}));
  for(let k=0;k<3;k++)P(cone(.014,.1,4),['#c8483a','#e8c040','#3a8a5a'][k],(k-1)*.06,.3,.06,{p:h,rz:(k-1)*-.3});return}
 if(cu===3){P(sph(.2,1,1,.26),B,0,.0,.07,o);P(tor(.2,.02,26,7),A,0,0,.075,o);for(let k=0;k<8;k++){const a=k/8*PI*2;P(box(.012,.17,.018).rotateZ(-a),D,Math.sin(a)*.1,Math.cos(a)*.1,.118,{p:h,ink:0})}   // tablones + rayos
  P(sph(.06,1,1,.7),T.lo||D,0,0,.13,o);if(r>=2)for(let k=0;k<10;k++){const a=k/10*PI*2;P(sph(.011,1,1,1,6),A,Math.sin(a)*.17,Math.cos(a)*.17,.108,o)}
  if(T.g)P(sph(.028,1,1,.7,8),T.g,0,0,.17,Object.assign({p:h},G(T.g,2.2)));return}
 if(cu===4){const RED=JRED,LAC=jLac(met,B,L),hx=[[-.12,.25],[.12,.25],[.19,.1],[.19,-.1],[.12,-.25],[-.12,-.25],[-.19,-.1],[-.19,.1]];                    // tate: tablón alto
  P(shp(hx,.04,.01),LAC,0,0,.07,o);P(shp(hx.map(p=>[p[0]*.8,p[1]*.84]),.02,.006),mixc(LAC,'#ffffff',.12),0,0,.1,o);P(box(.34,.014,.02),RED,0,.12,.118,{p:h,ink:0});P(box(.34,.014,.02),RED,0,-.12,.118,{p:h,ink:0});
  P(cyl(.06,.06,.016,16).rotateX(PI/2),A,0,0,.125,o);P(cyl(.03,.03,.012,3).rotateX(PI/2),shade(A,.5),0,0,.136,{p:h,ink:0});if(T.g)P(sph(.02,1,1,.6,8),T.g,0,0,.145,Object.assign({p:h},G(T.g,2)));return}
 if(cu===6){const RU='#9a8ad8',sl=[[-.15,-.26],[.15,-.26],[.17,.18],[.1,.27],[-.06,.3],[-.17,.2]];   // PÁRAMO: losa de piedra rúnica (sin borde, sin metal)
  P(shp(sl,.05,.012),met?mixc('#4a4258',T.c,.08):'#4a4258',0,0,.07,o);P(shp(sl.map(q=>[q[0]*.8,q[1]*.8]),.016,.006),'#3a3448',0,0,.105,o);
  [[0,.1,.03,.18],[0,-.06,.14,.03],[-.05,-.14,.025,.08],[.06,-.14,.025,.08]].forEach(([x,y,w,hh])=>P(box(w,hh,.012),RU,x,y,.125,Object.assign({p:h},G(RU,1.8))));
  for(let k=0;k<3;k++)P(cone(.016,.08,4),RU,(k-1)*.1,.34+Math.abs(k-1)*.03,.07,Object.assign({p:h,rz:(k-1)*-.3},G(RU,1.4)));return}
 if(cu===7){const GD='#e0b84a',RD='#c8483a',ar=[[-.16,-.27],[.16,-.27],[.17,.1],[.12,.22],[0,.29],[-.12,.22],[-.17,.1]];   // DESIERTO: escudo de arco con sol dorado
  P(shp(ar,.04,.01),met?mixc('#d8c8a0',T.c,.08):'#cdb888',0,0,.07,o);P(shp(ar.map(q=>[q[0]*.86,q[1]*.88]),.014,.006),'#f0e8d0',0,0,.1,o);
  P(cyl(.07,.07,.016,18).rotateX(PI/2),GD,0,.04,.122,o);for(let k=0;k<12;k++){const a=k/12*PI*2;P(cone(.012,.05,4),GD,Math.sin(a)*.095,.04+Math.cos(a)*.095,.12,{p:h,rz:-a})}P(sph(.03,1,1,.7),RD,0,.04,.14,o);
  [-.2,-.12].forEach(y=>P(box(.3,.014,.012),RD,0,y,.118,{p:h,ink:0}));return}
 if(cu===8){const WD='#6a4a2a',IR='#8a8a92',RP='#b89a62';   // COSTA: rodela de madera con tablones, borde de hierro, cuerda y ancla
  P(sph(.19,1,1,.24),WD,0,0,.07,o);P(tor(.19,.018,24,6),IR,0,0,.075,o);for(let k=0;k<5;k++)P(box(.012,.36,.014),shade(WD,.7),(k-2)*.07,0,.118,{p:h,ink:0});
  for(let k=0;k<12;k++){const a=k/12*PI*2;P(sph(.01,1,1,1,6),'#c8a040',Math.sin(a)*.17,Math.cos(a)*.17,.1,{p:h})}P(tor(.13,.008,18,4),RP,0,0,.12,{p:h,ink:0});
  P(sph(.05,1,1,.7),IR,0,0,.14,o);P(box(.014,.07,.012),'#c8a040',0,.0,.16,{p:h,ink:0});P(tor(.018,.005,8,4),'#c8a040',0,.04,.16,{p:h,ink:0});P(box(.05,.01,.012),'#c8a040',0,-.02,.16,{p:h,ink:0});return}
 if(cu===10){const IR=met?mixc('#17121a',T.c,.12):'#1a1418',EM=T.g||'#ff3a1c',kt=[[-.19,.22],[-.1,.28],[0,.24],[.1,.28],[.19,.22],[.17,-.05],[0,-.3],[-.17,-.05]];   // INFIERNO: escudo cometa con cuernos, ojos de brasa y cadena
  P(shp(kt,.045,.012),IR,0,0,.07,o);P(shp(kt.map(p=>[p[0]*.74,p[1]*.74]),.02,.006),'#0e0a0e',0,0,.105,o);
  [-1,1].forEach(s=>{P(cone(.03,.16,5),'#0e0a0e',.1*s,.3,.08,{p:h,rz:-s*.35,...MET});P(box(.07,.012,.012),EM,.06*s,.05,.124,Object.assign({p:h,rz:s*.35},G(EM,1.8)))});
  P(box(.012,.2,.01),EM,0,-.1,.124,Object.assign({p:h},G(EM,1.4)));for(let k=0;k<8;k++){const a=k/8*PI*2;P(tor(.012,.003,6,4),'#5a4a52',Math.sin(a)*.14,Math.cos(a)*.17,.1,{p:h})}return}
 if(cu===9){const MB='#efeadf',GD='#e0b84a',CE='#9fd8ff';   // CIELO: áspide de mármol con anillos de oro, laurel, alas y estrella celeste
  P(sph(.2,1,1,.26),met?mixc(MB,T.c,.08):MB,0,0,.07,o);[.2,.14,.08].forEach((rr,i)=>P(tor(rr,.012,26,6),GD,0,0,.08+i*.01,o));P(sph(.05,1,1,.7),CE,0,0,.14,Object.assign({p:h},G(CE,2.2)));
  for(let k=0;k<12;k++){const a=k/12*PI*2;P(sph(.016,1,1.4,1,6),k%2?'#8fb04a':GD,Math.sin(a)*.19,Math.cos(a)*.19,.1,{p:h})}
  [-1,1].forEach(s=>{for(let i=0;i<3;i++)P(box(.09-i*.014,.014,.02),'#f2efe6',.12*s,.06+i*.028,.12,{p:h,rz:s*(.3+i*.2)})});return}
 const DK=met?mixc('#241c20',T.c,.18):'#2a2024',GC=T.g||'#ff7a2a',pt=[[0,.3],[.14,.18],[.19,0],[.12,-.18],[0,-.27],[-.12,-.18],[-.19,0],[-.14,.18]];                      // infernal: escudo de púas
 P(shp(pt,.045,.012),DK,0,0,.07,o);P(shp(pt.map(p=>[p[0]*.72,p[1]*.72]),.02,.006),'#14101a',0,0,.105,o);
 pt.forEach((p,i)=>P(cone(.024,.09,4),'#14101a',p[0]*1.1,p[1]*1.1,.08,{p:h,rz:-Math.atan2(p[0],p[1]),...MET}));
 P(sph(.05,1,1.1,.6),GC,0,0,.13,Object.assign({p:h},G(GC,2.2)));[-1,1].forEach(s=>P(box(.012,.14,.008),GC,.09*s,0,.118,Object.assign({p:h,rz:s*.4},G(GC,1.5))))}
