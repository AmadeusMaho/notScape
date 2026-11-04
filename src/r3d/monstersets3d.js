// NotScape · R3D · MODELOS DE LOS SETS DE MONSTRUO (lote N0.9-SETS-S1S2, 3 nov 2026). Datos: src/monstersets.js (MSET). Plan: docs/PLAN_SETS_MONSTRUO.md.
// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Cada set es TODO nuevo (modelos y colores propios, nada recoloreado de otra plantilla). Aquí vive un generador por set: SET3D[id] = {helm, chest, boots}.
// armor3d.js los llama cuando la pieza lleva `set` (look.arm.<ranura>.set, lo pone armorInfo() de game.js) y icons3d.js los usa para el icono 3D del objeto.
// Firma (la misma que el resto de armor3d.js): P(geo,color,x,y,z,{p:grupo,t:{rim},ink,mat,rx,ry,rz}) con las rotaciones HORNEADAS (mkP); F = Mini (F.arms/elbows/legs/knees/ankles, F.W).
//   · helm(F,hg,P,GLO): hg = grupo del casco (centro del cráneo (0,.04,-.005), r≈.212, cara hacia +z, coronilla y≈.25).
//   · chest(F,g,P,GLO): g = grupo del torso (cuello y≈.845, fajín y≈.52, bajo y≈.07); F.W = ancho.
//   · boots(F,g,P,GLO): una pieza por pierna sobre F.knees[i] (caña) y F.ankles[i] (pie).
// CÓMO AÑADIR UN SET: una entrada en SET3D con sus tres funciones y su color en SETCOL (item-icons.js); respeta el presupuesto: ≤ 20 mallas por pieza, formas facetadas, sin cajas para lo orgánico.
import * as THREE from 'three';
import {glow} from './materials3d.js';
import {torsoR,ribbon} from './armorcult3d.js';   // perfil del torso del Mini: las pecheras se envuelven con ÉL (nada se clipea con la piel)
const PI=Math.PI,TAU=PI*2;
const sph=(r,x=1,y=1,z=1,n=12)=>new THREE.SphereGeometry(r,n,Math.max(6,n*.7|0)).scale(x,y,z);
const shade=(c,k)=>'#'+new THREE.Color(c).multiplyScalar(k).getHexString(),mixc=(a,b,t)=>'#'+new THREE.Color(a).lerp(new THREE.Color(b),t).getHexString();
/** Deforma una geometría con ruido determinista (sin Math.random) para que la gelatina no parezca una esfera perfecta. */
function lump(geo,a=.012,f=9,seed=1){const p=geo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=Math.sin(x*f+seed)*Math.cos(y*f*1.3+seed*2)+Math.sin(z*f*.9+seed*3)*.8;
  const l=Math.hypot(x,y,z)||1,d=n*a/l;p.setXYZ(i,x+x*d,y+y*d,z+z*d)}geo.computeVertexNormals();return geo}
const drop=(r,len=1.7)=>sph(r,.85,len,.85,8);   // gota alargada que cuelga

// ═══════════════════════════ GELATINOSO (verde slime: casco, peto, botas) ═══════════════════════════
const GEL={body:'#58c864',hi:'#a6f59a',dk:'#2c8a48',core:'#d8ff9a',deep:'#3aa656'};
const gel={
  helm(F,hg,P,GLO){const C=GEL,pc=(geo,col,x,y,z,o)=>P(geo,col,x,y,z,Object.assign({p:hg,t:{rim:2.2}},o));
    pc(lump(new THREE.SphereGeometry(.228,20,13,0,TAU,0,1.8).scale(1,1.05,1.05),.02,8,1),C.body,0,.04,-.005);                  // cúpula de gelatina
    for(let i=0;i<9;i++){const a=(i/8-.5)*PI*1.75+(i%2?.06:0),r=.226,len=1.5+((i*7)%5)*.28;                                       // gotas colgando del borde (delante y laterales)
      pc(drop(.03+((i*3)%3)*.006,len),i%3?C.body:C.deep,Math.sin(a)*r,.0-(len-1.5)*.02,Math.cos(a)*r*.92+.01,{ink:.008})}
    for(let i=0;i<4;i++){const a=PI+(i/3-.5)*1.5;pc(drop(.034,1.9+i%2*.5),C.deep,Math.sin(a)*.215,-.03,Math.cos(a)*.2-.01,{ink:.008})}   // y por detrás (cortina sobre la nuca)
    pc(lump(sph(.085,1,1.2,1,10),.02,10,2),C.hi,0,.285,-.01);pc(sph(.045,1,1.2,1,8),C.hi,.02,.36,0,{ink:.008});                    // gota que se alza en la coronilla
    [[-.13,.2,.1,.022],[.15,.17,.08,.018],[.04,.21,.16,.016]].forEach(([x,y,z,r])=>pc(sph(r,1,1,1,7),mixc(C.hi,'#ffffff',.5),x,y,z,{ink:0,t:{rim:3}}));   // burbujas
    pc(sph(.034,1,1.1,.7,9),C.core,0,.155,.205,GLO(C.core,2.1));                             // núcleo brillante en la frente
    return true},
  chest(F,g,P,GLO){const C=GEL,W=F.W||1,pc=(geo,col,x,y,z,o)=>P(geo,col,x,y,z,Object.assign({p:g,t:{rim:2}},o));
    {const R=torsoR(F);pc(shell(F,1.19,.37,.82,.014,3),C.body,0,0,0);
     }
    {const zc=torsoR(F)(.62)*1.19+.03;pc(sph(.04,1,1.1,.7,9),C.core,0,.62,zc,GLO(C.core,2.2));pc(new THREE.TorusGeometry(.058,.013,6,16),C.hi,0,.62,zc-.006,{ink:0})} // núcleo del pecho con aro
    pc(lump(new THREE.TorusGeometry(.205*W,.034,8,24).rotateX(PI/2),.012,10,5),C.hi,0,.5,0.005);                                   // cinturón de baba
    for(let i=0;i<5;i++){const a=(i/4-.5)*2.1;pc(drop(.032,1.9+(i%3)*.4),i%2?C.body:C.deep,Math.sin(a)*.2*W,.44,Math.cos(a)*.2*W*.9,{ink:.008})}   // goteo bajo el cinturón
    pc(lump(sph(.1,1.2,.5,1.1,8),.015,9,6),C.hi,0,.84,.0,{ink:.01});                                                              // cuello viscoso
    F.arms.forEach((a,i)=>{const s=i?1:-1;
      pc(lump(sph(.098,1.12,.8,1.1,12),.016,8,7+i),C.body,.015*s,.045,0,{p:a});                                                      // hombrera de gelatina
      pc(sph(.05,1,1,1,8),mixc(C.hi,'#ffffff',.4),.05*s,.09,.06,{p:a,ink:0,t:{rim:3}});pc(drop(.04,2.1),C.deep,.1*s,-.07,.02,{p:a,ink:.008})});   // brillo y chorreón
    F.elbows&&F.elbows.forEach((e,i)=>pc(lump(sph(.062,1.1,1,1.1,9),.015,9,9+i),C.deep,0,-.015,0,{p:e,ink:.01}));                 // codos
    return true},
  boots(F,g,P,GLO){const C=GEL;
    F.knees.forEach((kn,i)=>{const an=F.ankles[i],s=i?1:-1,pc=(geo,col,x,y,z,o,gr)=>P(geo,col,x,y,z,Object.assign({p:gr||kn,t:{rim:2}},o));
      pc(lump(sph(.088,1.08,1.45,1.08,12),.015,9,11+i),C.body,0,-.105,0);                                                           // caña
      pc(lump(new THREE.TorusGeometry(.082,.022,7,18).rotateX(PI/2),.01,9,12),C.hi,0,-.012,0,{ink:.01});                           // borde alto, viscoso
      pc(lump(sph(.094,1.08,.62,1.55,12),.014,8,13+i),C.body,0,-.03,.036,{},an);                                                    // pie hinchado
      pc(sph(.034,1,1,.9,8),mixc(C.hi,'#ffffff',.35),.03*s,-.01,.1,{ink:0,t:{rim:3}},an);                                           // burbuja en el empeine
      pc(drop(.026,1.8),C.deep,.058*s,-.14,.04);pc(drop(.022,1.6),C.deep,-.05*s,-.15,-.03)})                                        // gotas por la caña
    return true}
};
// ═══════════════════════════ ayudas comunes ═══════════════════════════
const cone=(r,h,n=6)=>new THREE.ConeGeometry(r,h,n),cyl=(a,b,h,n=10)=>new THREE.CylinderGeometry(a,b,h,n),box=(x,y,z)=>new THREE.BoxGeometry(x,y,z),tor=(R,r,n=18,sg=6,arc)=>new THREE.TorusGeometry(R,r,sg,n,arc||TAU);
/** Cáscara que envuelve TODO el torso (perfil del Mini ×k): ninguna pieza deja ver la piel ni se clipea. */
function shell(F,k=1.14,y0=.5,y1=.83,amp=.006,seed=1){const R=torsoR(F),r0=R(.5),pts=[];
  const rad=y=>y>=.5?R(y):y<.42?r0*(.9+.2*(y-.37)/.05):r0*(1.1-.1*(y-.42)/.08);   // el abdomen del Mini (y .37–.5) es MÁS ancho que la cintura: la cáscara lo cubre (si no, la barriga asoma bajo el cinturón)
  for(let y=.37;y<=y1+.001;y+=y<.5?.045:.04)pts.push(new THREE.Vector2(rad(y)*k+.004,y));pts.push(new THREE.Vector2(.085,.855),new THREE.Vector2(0,.862));
  return lump(new THREE.LatheGeometry(pts,26),amp,9,seed)}
const PAL={gel:{robe:'#58c864',pants:'#58c864',boot:'#2c8a48'},caz:{robe:'#8a5a30',pants:'#6a4426',boot:'#5a3a20'},gob:{robe:'#5a6a30',pants:'#5a4028',boot:'#4a3624'},esp:{robe:'#a8895a',pants:'#8f7448',boot:'#8a6a3a'},
 ban:{robe:'#2e2428',pants:'#2a2024',boot:'#241a1e'},orc:{robe:'#6a7468',pants:'#5a5448',boot:'#4a4640'},gru:{robe:'#4a4e44',pants:'#4a4a40',boot:'#3a3a34'}};
// cada generador recibe (F, grupo, P, GLO) y dibuja con pc(geo,col,x,y,z,opts)
const mkpc=(P,g,rim=1.6)=>(geo,col,x,y,z,o)=>P(geo,col,x,y,z,Object.assign({p:g,t:{rim}},o));
const arms=(F,fn)=>F.arms.forEach((a,i)=>fn(a,i?1:-1));
const legs=(F,fn)=>F.legs.forEach((l,i)=>fn(l,F.knees[i],F.ankles[i],i?1:-1));
const fists=(F,fn)=>F.elbows.forEach((e,i)=>fn(e,i?1:-1));

// ═══════════════════════════ CAZADOR DE LA PRADERA (cuero pardo, piel de zorro, hueso) ═══════════════════════════
const CZ={lea:'#8a5a30',dk:'#5a3a20',fox:'#d8742a',cream:'#efe2c0',bone:'#e8e0c0'};
const caz={
 helm(F,hg,P){const C=CZ,pc=mkpc(P,hg);
  pc(lump(new THREE.SphereGeometry(.226,18,12,0,TAU,0,1.45).scale(1,1.05,1.04),.008,8,2),C.lea,0,.05,-.01);pc(tor(.222,.014,22,6).rotateX(PI/2),C.dk,0,.105,-.01,{ink:.008});   // gorro de cuero con banda
  pc(box(.34,.02,.12),C.dk,0,.095,.2,{ink:.008});                                                                            // visera corta
  [[.2,.03,-.04],[.19,-.05,-.04],[.175,-.12,-.03]].forEach(([x,y,z],j)=>pc(sph(.055-j*.011,.85,1.2,.85,8),j===2?C.cream:C.fox,x,y,z,{ink:.008}));   // cola de zorro colgando de la oreja
  pc(cone(.02,.17,5),C.bone,-.14,.27,.02,{rz:.5,ink:.006});pc(cone(.014,.12,5),C.cream,-.1,.3,-.02,{rz:.25,ink:0});             // cuerno de cabra y pluma
  return true},
 chest(F,g,P){const C=CZ,pc=mkpc(P,g),R=torsoR(F);
  pc(shell(F,1.1,.5,.82,.005,5),C.lea,0,0,0);
  for(let j=0;j<4;j++){const y=.76-j*.055,z=R(y)*1.1+.012;pc(box(.1,.012,.01),C.cream,0,y,z,{rz:.55*(j%2?1:-1),ink:0});pc(box(.1,.012,.01),C.cream,0,y,z+.001,{rz:-.55*(j%2?1:-1),ink:0})}   // cordones cruzados
  pc(lump(new THREE.TorusGeometry(R(.82)*1.16,.045,8,22).rotateX(PI/2),.02,9,6),C.cream,0,.83,0,{ink:.012});                                  // cuello de piel
  pc(tor(R(.52)*1.12,.02,22,6).rotateX(PI/2),C.dk,0,.515,0,{ink:.008});pc(box(.05,.045,.016),'#d8b050',0,.515,R(.52)*1.12+.008,{ink:.006});
  pc(box(.06,.4,.012),C.dk,.07,.66,R(.66)*1.1+.01,{rz:.62,ink:.008});pc(sph(.06,1,1.1,.6,8),C.dk,-.15,.5,R(.5)*1.1,{ink:.01});    // bandolera y bolsa
  arms(F,(a,s)=>{pc(sph(.095,1.1,.75,1.1,10),C.lea,.015*s,.04,0,{p:a});pc(tor(.085,.022,14,6).rotateX(PI/2),C.cream,.015*s,-.01,0,{p:a,ink:.008})});return true},
 gloves(F,g,P){const C=CZ;fists(F,(e,s)=>{const pc=mkpc(P,e);pc(sph(.068,1.05,.9,1.05,10),C.lea,0,-.185,0);pc(cyl(.072,.064,.11,10),C.dk,0,-.125,0);pc(tor(.07,.02,12,6).rotateX(PI/2),C.cream,0,-.07,0,{ink:.008})});return true},
 boots(F,g,P){const C=CZ;legs(F,(l,kn,an,s)=>{const pc=mkpc(P,kn);pc(cyl(.083,.088,.17,10),C.lea,0,-.1,0);pc(lump(new THREE.TorusGeometry(.086,.024,7,16).rotateX(PI/2),.01,9,3),C.cream,0,-.012,0,{ink:.008});
  pc(sph(.092,1.05,.56,1.5,10),C.dk,0,-.03,.036,{p:an});pc(box(.016,.05,.01),C.cream,0,-.06,.074,{ink:0})});return true}};

// ═══════════════════════════ GOBLIN (cuero verdoso, hueso, botones) ═══════════════════════════
const GB={lea:'#5a6a30',dk:'#4a3624',bone:'#e8e0c0',gr:'#78923c'};
const gob={
 helm(F,hg,P){const C=GB,pc=mkpc(P,hg);
  pc(new THREE.SphereGeometry(.226,16,11,0,TAU,0,1.5).scale(1,1.04,1.04),C.lea,0,.05,-.01);pc(tor(.222,.016,20,6).rotateX(PI/2),C.dk,0,.11,-.01,{ink:.008});
  [-1,1].forEach(s=>{pc(cone(.05,.2,4).scale(1,1,.35),C.gr,.22*s,.12,-.03,{rz:-s*1.25,ink:.01});pc(cone(.02,.13,5),C.bone,.1*s,.26,.1,{rz:-s*.35,rx:.3,ink:.006})});   // orejas puntiagudas y cuernitos de hueso
  for(let i=0;i<5;i++){const a=(i/4-.5)*1.3;pc(sph(.017,1,1,.7,6),C.bone,Math.sin(a)*.214,.11,Math.cos(a)*.2-.01,{ink:0})}                                    // botones de hueso en la banda
  return true},
 chest(F,g,P){const C=GB,pc=mkpc(P,g),R=torsoR(F);
  pc(shell(F,1.1,.5,.82,.01,7),C.lea,0,0,0);
  for(let i=0;i<5;i++){const y=.77-i*.05,z=R(y)*1.1+.01;pc(box(.17-i*.012,.016,.012),C.bone,0,y,z,{ink:.006})}pc(box(.014,.26,.012),C.bone,0,.66,R(.66)*1.1+.01,{ink:.006});   // costillas de hueso
  for(let i=0;i<4;i++)pc(sph(.016,1,1,.7,6),C.bone,(i<2?-1:1)*.1,.7-(i%2)*.1,R(.7)*1.1+.016,{ink:0});
  pc(tor(R(.52)*1.12,.02,22,6).rotateX(PI/2),C.dk,0,.515,0,{ink:.008});
  arms(F,(a,s)=>{pc(sph(.09,1.12,.75,1.1,9),C.dk,.015*s,.04,0,{p:a});for(let k=0;k<3;k++)pc(cone(.02,.1,5),C.bone,(.04+k*.03)*s,.1,(k-1)*.04,{p:a,rz:-s*(.5+k*.2),ink:.006})});return true},
 legs(F,g,P){const C=GB;legs(F,(l,kn,an,s)=>{const pc=mkpc(P,l);pc(cyl(.097,.088,.17,9),C.dk,0,-.095,0);pc(tor(.092,.014,12,5).rotateX(PI/2),C.bone,0,-.02,0,{ink:.006});
  const pk=mkpc(P,kn);pk(sph(.085,1,.9,1.1,9),C.lea,0,0,.022);pk(cone(.026,.08,4),C.bone,0,-.01,.1,{rx:1.3,ink:.006});pk(cyl(.078,.07,.15,9),C.dk,0,-.115,.004)});return true},
 gloves(F,g,P){const C=GB;fists(F,(e,s)=>{const pc=mkpc(P,e);pc(sph(.068,1.05,.9,1.05,9),C.lea,0,-.185,0);pc(cyl(.072,.064,.1,9),C.dk,0,-.125,0);for(let k=0;k<3;k++)pc(cone(.014,.07,4),C.bone,(k-1)*.03,-.235,.04,{rx:-.5,ink:.005})});return true},   // garras de hueso
 boots(F,g,P){const C=GB;legs(F,(l,kn,an,s)=>{const pc=mkpc(P,kn);pc(cyl(.083,.088,.17,9),C.dk,0,-.1,0);pc(tor(.086,.016,12,5).rotateX(PI/2),C.bone,0,-.014,0,{ink:.006});
  pc(sph(.092,1.05,.56,1.5,9),C.lea,0,-.03,.036,{p:an});pc(cone(.03,.09,4),C.bone,0,-.02,.13,{p:an,rx:1.35,ink:.006})});return true}};

// ═══════════════════════════ ESPANTAPÁJAROS (arpillera, paja, remiendos) ═══════════════════════════
const EP={sack:'#a8895a',straw:'#d8b85a',rope:'#6a4a2a',red:'#a04a3a',blue:'#4a6a8a'};
const esp={
 helm(F,hg,P){const C=EP,pc=mkpc(P,hg,1.2);
  pc(new THREE.SphereGeometry(.222,16,11,0,TAU,0,1.45).scale(1,1.05,1.04),C.sack,0,.06,-.01);pc(cyl(.34,.34,.022,22),C.straw,0,.115,.0,{ink:.01});pc(tor(.23,.014,20,6).rotateX(PI/2),C.rope,0,.13,-.01,{ink:.006});   // sombrero de ala ancha y cuerda
  for(let i=0;i<14;i++){const a=i/14*TAU;pc(cone(.014,.06,4),C.straw,Math.sin(a)*.335,.1,Math.cos(a)*.335,{rz:Math.sin(a)*.8,rx:Math.cos(a)*.8,ink:0})}   // pajas del borde
  pc(box(.07,.07,.012),C.red,.1,.2,.19,{rz:.2,ink:.006});for(let k=0;k<4;k++)pc(cone(.016,.1,4),C.straw,(k-1.5)*.025,.3,0,{rz:(k-1.5)*.3,ink:0});return true},
 chest(F,g,P){const C=EP,pc=mkpc(P,g,1.1),R=torsoR(F);
  pc(shell(F,1.11,.5,.82,.01,9),C.sack,0,0,0);
  pc(box(.1,.1,.012),C.red,-.07,.68,R(.68)*1.11+.01,{rz:.1,ink:.006});pc(box(.09,.08,.012),C.blue,.08,.6,R(.6)*1.11+.01,{rz:-.12,ink:.006});   // remiendos
  for(let k=0;k<2;k++)[[-.07,.68],[.08,.6]].forEach(([x,y])=>pc(box(.07,.008,.006),C.rope,x,y,R(y)*1.11+.018,{rz:k?.8:-.8,ink:0}));
  for(let i=0;i<9;i++){const a=(i/8-.5)*2.2;pc(cone(.016,.09,4),C.straw,Math.sin(a)*R(.83)*1.12,.86,Math.cos(a)*R(.83)*1.12,{rx:-.2,ink:0})}   // paja asomando del cuello
  for(let i=0;i<9;i++){const a=(i/8-.5)*2.4;pc(cone(.016,.08,4),C.straw,Math.sin(a)*R(.5)*1.12,.45,Math.cos(a)*R(.5)*1.12,{rx:PI,ink:0})}     // y del bajo
  pc(tor(R(.52)*1.12,.02,22,6).rotateX(PI/2),C.rope,0,.515,0,{ink:.006});
  arms(F,(a,s)=>{pc(sph(.09,1.1,.75,1.1,9),C.sack,.015*s,.04,0,{p:a});pc(box(.05,.05,.01),C.red,.06*s,.07,.07,{p:a,ink:0})});return true},
 legs(F,g,P){const C=EP;legs(F,(l,kn,an,s)=>{const pc=mkpc(P,l);pc(cyl(.096,.088,.17,9),C.sack,0,-.095,0);pc(box(.06,.06,.01),s>0?C.blue:C.red,.03*s,-.08,.09,{ink:0});
  const pk=mkpc(P,kn);pk(sph(.084,1,.9,1.1,9),C.sack,0,0,.022);pk(cyl(.078,.072,.15,9),C.sack,0,-.115,.004);for(let k=0;k<5;k++)pk(cone(.012,.06,4),C.straw,(k-2)*.032,-.2,.02,{rx:PI,ink:0})});return true},
 gloves(F,g,P){const C=EP;fists(F,(e,s)=>{const pc=mkpc(P,e,1.1);pc(sph(.07,1.1,.95,1.1,9),C.sack,0,-.185,0);pc(cyl(.073,.066,.1,9),C.sack,0,-.125,0);for(let k=0;k<4;k++)pc(cone(.013,.08,4),C.straw,(k-1.5)*.026,-.25,.025,{rx:-.2,ink:0})});return true},
 boots(F,g,P){const C=EP;legs(F,(l,kn,an,s)=>{const pc=mkpc(P,kn,1.1);pc(cyl(.084,.09,.17,9),C.sack,0,-.1,0);pc(tor(.088,.014,12,5).rotateX(PI/2),C.rope,0,-.05,0,{ink:.006});for(let k=0;k<5;k++)pc(cone(.013,.07,4),C.straw,(k-2)*.03,.0,0,{rz:(k-2)*.25,ink:0});
  pc(sph(.092,1.05,.56,1.5,9),C.sack,0,-.03,.036,{p:an})});return true}};

// ═══════════════════════════ BANDIDO (cuero negro, carmesí, hebillas) ═══════════════════════════
const BN={blk:'#2e2428',lea:'#4a3426',red:'#8a1c22',gold:'#d8b050'};
/** Pañuelo triangular que cubre nariz y boca: rejilla sobre el cráneo (elipsoide), ancha arriba (puente de la nariz) y en V hasta la barbilla; la nariz levanta la tela y lleva pliegues suaves. */
function maskGeo(){const N=16,M=10,pos=[],idx=[];
 for(let j=0;j<=M;j++){const v=j/M,y=.045-v*.195,a=1.85*(1-v*v)+.08,rb=.214*Math.sqrt(Math.max(.06,1-Math.pow((y-.04)/.222,2)))+.01;
  for(let i=0;i<=N;i++){const u=i/N*2-1,ph=u*a,bump=.05*Math.exp(-Math.pow(ph/.3,2))*Math.exp(-Math.pow((y+.005)/.07,2)),fold=Math.sin(u*6+v*4)*.0035*(1-v*.5),r=rb+bump+fold;pos.push(Math.sin(ph)*r,y,Math.cos(ph)*r-.005)}}
 for(let j=0;j<M;j++)for(let i=0;i<N;i++){const k=j*(N+1)+i;idx.push(k,k+N+1,k+1,k+1,k+N+1,k+N+2)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g}
const ban={
 helm(F,hg,P){const C=BN,dk='#5e0f16',D2=THREE.DoubleSide,TILT=-.5;
  const bg=new THREE.Group();bg.position.set(0,.04,-.008);bg.rotation.x=TILT;hg.add(bg);const pb=mkpc(P,bg);   // el paño va INCLINADO: borde alto en la frente, baja hacia la nuca (como una bandana atada de verdad)
  pb(lump(new THREE.SphereGeometry(.221,24,14,0,TAU,0,1.62).scale(1,1.02,1.03),.011,8,4),C.red,0,0,0,{t:{rim:1.6,side:D2}});                                    // gorro de tela ceñido al cráneo, con arrugas
  pb(new THREE.CylinderGeometry(.226,.23,.05,28,1,true).translate(0,-.012,0),dk,0,0,0,{t:{rim:1.4,side:D2},ink:.008});                                                       // banda plana del borde (sin tubo)
  for(let k=0;k<5;k++){const a=(k-2)*.34;pb(cone(.014,.1,4).scale(1,1,.5),shade(C.red,.8),Math.sin(a)*.2,.07,Math.cos(a)*.2,{rx:.9,rz:-a*.5,ink:0})}                   // pliegues cosidos que salen de la banda
  pb(sph(.048,1,.85,.9,9),C.red,.015,-.02,-.222,{ink:.01});                                                                                                      // nudo a la nuca
  [-1,1].forEach(s=>pb(cone(.032,.25,4).scale(1,1,.3).rotateX(PI),C.red,.042*s,-.13,-.235,{rx:.2,rz:s*.16,ink:.008}));                                              // dos colas que cuelgan
  const pc=mkpc(P,hg);pc(maskGeo(),dk,0,0,0,{t:{rim:1.4,side:D2},ink:.008});                                                                                  // pañuelo triangular sobre nariz y boca: sigue la cara, cubre la nariz y acaba en punta bajo la barbilla
  pc(new THREE.CylinderGeometry(.224,.224,.032,26,1,true,1.2,TAU-2.4),dk,0,.035,-.005,{t:{rim:1.4,side:D2},ink:.008});
  return true},
 chest(F,g,P){const C=BN,pc=mkpc(P,g),R=torsoR(F);
  pc(shell(F,1.1,.5,.82,.005,11),C.blk,0,0,0);
  pc(ribbon(y=>R(y)*1.1,[[-1.15,.8],[-.3,.7],[.5,.6],[1.2,.5]],.035,.01),C.red,0,0,0,{ink:.008,t:{rim:1.6,side:THREE.DoubleSide}});                                                                                    // banda carmesí en diagonal
  pc(tor(R(.52)*1.12,.024,22,6).rotateX(PI/2),C.lea,0,.515,0,{ink:.008});pc(box(.06,.05,.016),C.gold,0,.515,R(.52)*1.12+.01,{ink:.006});
  for(let k=0;k<3;k++)pc(cone(.011,.07,4),'#b8bcc4',-.12+k*.045,.58,R(.6)*1.1+.022,{rx:PI,ink:0});                                                          // cuchillos arrojadizos
  pc(tor(R(.82)*1.15,.022,18,6).rotateX(PI/2),C.blk,0,.83,0,{ink:.008});
  arms(F,(a,s)=>{pc(sph(.09,1.1,.75,1.1,10),C.lea,.015*s,.04,0,{p:a});pc(tor(.085,.016,14,6).rotateX(PI/2),C.red,.015*s,-.01,0,{p:a,ink:.006})});return true},
 legs(F,g,P){const C=BN;legs(F,(l,kn,an,s)=>{const pc=mkpc(P,l);pc(cyl(.096,.086,.17,10),C.blk,0,-.095,0);pc(tor(.092,.012,14,6).rotateX(PI/2),C.red,0,-.03,0,{ink:.006});
  const pk=mkpc(P,kn);pk(sph(.084,1,.9,1.1,10),C.lea,0,0,.022);pk(cyl(.076,.068,.15,10),C.blk,0,-.115,.004)});return true},
 gloves(F,g,P){const C=BN;fists(F,(e,s)=>{const pc=mkpc(P,e);pc(sph(.068,1.05,.9,1.05,10),C.blk,0,-.185,0);pc(cyl(.072,.064,.11,10),C.blk,0,-.125,0);pc(tor(.07,.018,12,6).rotateX(PI/2),C.red,0,-.07,0,{ink:.006})});return true},
 boots(F,g,P){const C=BN;legs(F,(l,kn,an,s)=>{const pc=mkpc(P,kn);pc(cyl(.083,.088,.17,10),C.blk,0,-.1,0);pc(tor(.086,.016,12,6).rotateX(PI/2),C.lea,0,-.012,0,{ink:.006});pc(box(.1,.018,.012),C.red,0,-.07,.088,{ink:0});pc(box(.02,.025,.012),C.gold,0,-.07,.095,{ink:0});
  pc(sph(.092,1.05,.56,1.5,10),C.blk,0,-.03,.036,{p:an})});return true}};

// ═══════════════════════════ ORCO (hierro tosco, tachas, colmillos) ═══════════════════════════
const OR={iron:'#7a7468',dk:'#4a4640',lea:'#5a4028',rust:'#8a5a3a',bone:'#e8e0c0'};
const orc={
 helm(F,hg,P){const C=OR,pc=mkpc(P,hg,2);
  pc(new THREE.SphereGeometry(.232,18,12,0,TAU,0,1.75).scale(1,1.05,1.05),C.iron,0,.04,-.005);pc(tor(.23,.022,22,6).rotateX(PI/2),C.dk,0,.095,-.005,{ink:.01});
  pc(box(.035,.17,.03),C.dk,0,.04,.225,{ink:.008});[-1,1].forEach(s=>{pc(box(.03,.15,.1),C.iron,.2*s,-.02,.06,{ink:.008});pc(cone(.022,.16,5),C.bone,.075*s,-.12,.2,{rx:-.25,rz:s*.12,ink:.006})});   // nasal, carrilleras y colmillos
  for(let i=0;i<3;i++)pc(cone(.026,.12,5),C.dk,(i-1)*.08,.27,-.03,{rz:(i-1)*-.25,ink:.008});for(let i=0;i<6;i++){const a=(i/5-.5)*1.5;pc(sph(.014,1,1,.8,6),C.rust,Math.sin(a)*.228,.095,Math.cos(a)*.215,{ink:0})}return true},
 chest(F,g,P){const C=OR,pc=mkpc(P,g,2),R=torsoR(F);
  pc(shell(F,1.16,.5,.83,.008,13),C.iron,0,0,0);
  [.6,.7,.78].forEach(y=>pc(tor(R(y)*1.17,.012,22,5).rotateX(PI/2),C.dk,0,y,0,{ink:.006}));pc(box(.03,.3,.014),C.dk,0,.66,R(.66)*1.16+.012,{ink:.006});
  for(let i=0;i<6;i++){const a=(i/5-.5)*1.7;pc(sph(.014,1,1,.8,6),C.rust,Math.sin(a)*R(.73)*1.17,.73,Math.cos(a)*R(.73)*1.17+.004,{ink:0})}
  pc(tor(R(.52)*1.2,.03,22,6).rotateX(PI/2),C.lea,0,.515,0,{ink:.008});pc(box(.06,.055,.018),C.bone,0,.515,R(.52)*1.2+.012,{ink:.006});
  arms(F,(a,s)=>{pc(sph(.12,1.15,.8,1.15,10),C.iron,.02*s,.04,0,{p:a});[0,1,2].forEach(k=>pc(cone(.026,.12,5),C.dk,(.06+k*.045)*s,.1+k*.01,(k-1)*.05,{p:a,rz:-s*(.5+k*.25),ink:.008}))});return true},
 legs(F,g,P){const C=OR;legs(F,(l,kn,an,s)=>{const pc=mkpc(P,l,2);pc(cyl(.1,.09,.17,10),C.iron,0,-.095,0);pc(tor(.095,.014,14,5).rotateX(PI/2),C.dk,0,-.02,0,{ink:.006});
  const pk=mkpc(P,kn,2);pk(sph(.088,1,.95,1.1,10),C.dk,0,0,.024);pk(cone(.026,.08,5),C.rust,0,-.01,.105,{rx:1.3,ink:.006});pk(cyl(.08,.072,.15,10),C.iron,0,-.115,.004)});return true},
 gloves(F,g,P){const C=OR;fists(F,(e,s)=>{const pc=mkpc(P,e,2);pc(sph(.074,1.1,.95,1.1,10),C.iron,0,-.185,0);pc(cyl(.078,.068,.12,10),C.dk,0,-.125,0);pc(tor(.076,.016,12,5).rotateX(PI/2),C.rust,0,-.075,0,{ink:.006});[-1,0,1].forEach(x=>pc(cone(.012,.04,4),C.bone,x*.03,-.215,.06,{rx:-1.2,ink:0}))});return true},
 boots(F,g,P){const C=OR;legs(F,(l,kn,an,s)=>{const pc=mkpc(P,kn,2);pc(cyl(.086,.092,.17,10),C.dk,0,-.1,0);pc(tor(.09,.018,12,6).rotateX(PI/2),C.iron,0,-.012,0,{ink:.006});
  pc(sph(.1,1.05,.6,1.55,10),C.iron,0,-.03,.036,{p:an});pc(box(.09,.03,.06),C.dk,0,-.015,.12,{p:an,ink:.006})});return true}};

// ═══════════════════════════ GRUK (hierro oscuro, oro viejo, piel de bestia, cuernos) ═══════════════════════════
const GK={iron:'#4a4e44',dk:'#2c2e28',gold:'#c8a24a',fur:'#6a4a2a',red:'#8a2a22',bone:'#e8e0c0',grn:'#5a6a3a'};
const gru={
 helm(F,hg,P,GLO){const C=GK,pc=mkpc(P,hg,2);
  const D2=THREE.DoubleSide,sc=(g)=>g.scale(1,1.08,1.08);
  pc(sc(new THREE.SphereGeometry(.242,24,12,0,TAU,0,1.12)),C.iron,0,.03,-.005);pc(tor(.222,.024,26,6).rotateX(PI/2),C.gold,0,.143,-.005,{ink:.01});                          // casquete superior con corona de oro
  pc(sc(new THREE.SphereGeometry(.238,24,10,0,TAU,1.33,.74)),C.iron,0,.03,-.005,{t:{rim:2,side:D2}});                       // mandíbula y carrilleras (cubre mejillas y barbilla)
  pc(new THREE.CylinderGeometry(.226,.226,.056,26,1,true,.62,TAU-1.24),C.dk,0,.1165,-.005,{t:{rim:1.5,side:D2},ink:.008});                                                         // banda que cierra sienes y nuca: SOLO queda libre la ranura frontal de los ojos
  [-1,1].forEach(s=>pc(box(.02,.06,.02),C.gold,.13*s,.1165,.215,{ink:.006,rz:0}));                                                                                                  // remaches a cada lado de la ranura
  [-1,1].forEach(s=>{pc(cone(.05,.3,6),C.bone,.2*s,.2,-.02,{rz:-s*.9,ink:.01});pc(cone(.03,.13,5),C.gold,.31*s,.37,-.02,{rz:-s*.5,ink:.006});pc(cone(.026,.14,5),C.gold,.08*s,-.12,.21,{rx:-.2,ink:.006})});   // cuernos y colmillos de oro
  pc(cone(.04,.2,5),C.red,0,.34,-.06,{rx:-.3,ink:.006});return true},
 chest(F,g,P){const C=GK,pc=mkpc(P,g,2),R=torsoR(F);
  pc(shell(F,1.17,.5,.83,.008,15),C.iron,0,0,0);
  [.58,.68,.78].forEach(y=>pc(tor(R(y)*1.18,.012,22,5).rotateX(PI/2),C.gold,0,y,0,{ink:.006}));pc(cone(.05,.2,5).rotateX(PI),C.gold,0,.64,R(.64)*1.17+.02,{ink:.008});          // aros de oro y colmillo de emblema
  pc(lump(new THREE.TorusGeometry(R(.82)*1.22,.06,8,22).rotateX(PI/2),.03,8,3),C.fur,0,.84,0,{ink:.012});                                                                    // manto de piel
  pc(tor(R(.52)*1.2,.03,22,6).rotateX(PI/2),C.dk,0,.515,0,{ink:.008});pc(cyl(.04,.04,.016,6).rotateX(PI/2),C.gold,0,.515,R(.52)*1.2+.01,{ink:.006});
  arms(F,(a,s)=>{pc(sph(.135,1.18,.85,1.15,10),C.iron,.02*s,.04,0,{p:a});pc(tor(.13,.02,14,6).rotateX(PI/2),C.gold,.02*s,-.02,0,{p:a,ink:.008});[0,1,2].forEach(k=>pc(cone(.03,.15,5),C.bone,(.07+k*.05)*s,.11+k*.01,(k-1)*.055,{p:a,rz:-s*(.5+k*.25),ink:.008}))});return true},
 legs(F,g,P){const C=GK;legs(F,(l,kn,an,s)=>{const pc=mkpc(P,l,2);pc(cyl(.104,.094,.17,10),C.iron,0,-.095,0);pc(tor(.098,.016,14,5).rotateX(PI/2),C.gold,0,-.02,0,{ink:.006});
  const pk=mkpc(P,kn,2);pk(sph(.092,1,.95,1.1,10),C.dk,0,0,.024);pk(cone(.03,.1,5),C.gold,0,-.01,.11,{rx:1.3,ink:.006});pk(cyl(.084,.076,.15,10),C.iron,0,-.115,.004)});return true},
 gloves(F,g,P){const C=GK;fists(F,(e,s)=>{const pc=mkpc(P,e,2);pc(sph(.078,1.1,.95,1.1,10),C.iron,0,-.185,0);pc(cyl(.082,.07,.12,10),C.dk,0,-.125,0);pc(tor(.08,.018,12,5).rotateX(PI/2),C.gold,0,-.075,0,{ink:.006});[-1,0,1].forEach(x=>pc(cone(.014,.05,4),C.gold,x*.032,-.22,.065,{rx:-1.2,ink:0}))});return true},
 boots(F,g,P){const C=GK;legs(F,(l,kn,an,s)=>{const pc=mkpc(P,kn,2);pc(cyl(.09,.096,.17,10),C.dk,0,-.1,0);pc(tor(.094,.02,12,6).rotateX(PI/2),C.gold,0,-.012,0,{ink:.006});
  pc(sph(.105,1.05,.62,1.55,10),C.iron,0,-.03,.036,{p:an});pc(box(.1,.03,.06),C.gold,0,-.015,.125,{p:an,ink:.006})});return true},
 cape(F,g,P){const C=GK,W=F.W||1,rc=.19*W*(F.cw||1),n=7,m=10,geo=new THREE.PlaneGeometry(1,1,n,m),pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++){const u=pos.getX(i)+.5,v=.5-pos.getY(i),w=(.2+v*.2)*W,jag=v>.9?Math.sin(u*n*2.2)*.035:0;pos.setXYZ(i,(u-.5)*2*w,.84-v*.66+jag,-rc*1.04-v*v*.14-Math.sin(u*PI)*.02)}geo.computeVertexNormals();
  const pc=mkpc(P,g,1.2);pc(geo,C.grn,0,0,0,{t:{rim:1.2,side:THREE.DoubleSide},ink:.012});pc(box(.34*W,.03,.012),C.gold,0,.2,-rc*1.04-.145,{ink:0});
  pc(lump(new THREE.TorusGeometry(.14*W,.05,8,18,PI).rotateX(PI/2).rotateY(PI),.03,8,5),C.fur,0,.83,-.02,{ink:.01});pc(sph(.03,1,1,.7,8),C.red,0,.82,.1,{ink:0});return true}};

// ═══════════════════════════ ARMAS DE SET (modelo propio por arma; firma de BUILD en heroanim3d.js: (p,g,o) con el agarre en el origen, +y = hoja, +x = filo, caras planas ±z) ═══════════════════════════
const V3=THREE.Vector3,LEA='#4a3424';
const tubeG=(pts,r,seg=18)=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(a=>new V3(a[0],a[1],a[2]))),seg,r,6,false);
const SETW={
 /* Arco goblin: madera retorcida con puntas de hueso, ataduras de cuero, tachuelas y una pluma colgando. Devuelve las puntas/reposo igual que BUILD.bow (la cuerda la pone heroanim3d). */
 'ms:gob':(p,g)=>{const wood='#7a5a30',bone='#e8e0c0';
  p(tubeG([[0,-.4,-.1],[0,-.27,-.02],[0,-.1,.03],[0,0,.045],[0,.1,.03],[0,.27,-.02],[0,.4,-.1]],.021,22),wood,0,0,0,{p:g,ink:.009});
  [-1,1].forEach(s=>{p(cone(.026,.08,5).translate(0,s*.04,0).scale(1,1,.8),bone,0,s*.405,-.105,{p:g,ink:.007,rz:0});[.1,.2,.3].forEach((y,k)=>p(tor(.03-k*.002,.008,10,5).rotateX(PI/2),k===1?bone:LEA,0,s*y,.03-k*.045,{p:g,ink:.005}))});
  p(cyl(.027,.027,.13,8),LEA,0,0,.045,{p:g,ink:.009});[-.04,0,.04].forEach(y=>p(sph(.012,1,1,1,5),bone,.026,y,.048,{p:g,ink:0}));
  p(cone(.012,.17,4).scale(1,1,.3).rotateX(PI),'#b8584a',.02,-.34,-.075,{p:g,ink:.005});
  return{tipA:new V3(0,.4,-.1),tipB:new V3(0,-.4,-.1),rest:new V3(0,0,-.1)}},
 /* Hoz del espantapájaros: mango de madera con paja atada y hoja en creciente (el filo es el lado cóncavo). */
 'ms:esp':(p,g)=>{const steel='#b8b8a8',wood='#8a6a3a',straw='#d8b85a';
  p(cyl(.022,.02,.24,7),wood,0,-.02,0,{p:g,ink:.009});p(sph(.028,1,1,1,7),wood,0,-.15,0,{p:g,ink:.008});
  [-.07,-.02,.03].forEach(y=>p(tor(.026,.007,9,5).rotateX(PI/2),straw,0,y,0,{p:g,ink:.005}));for(let k=0;k<4;k++)p(cone(.008,.07,4).rotateX(PI).rotateZ((k-1.5)*.3),straw,(k-1.5)*.01,-.11,.02,{p:g,ink:0});
  p(cyl(.012,.012,.07,6),'#5a4a3a',0,.12,0,{p:g,ink:.006});
  p(new THREE.TorusGeometry(.17,.03,5,22,PI*.78).rotateZ(PI*.22).scale(1,1,.4).translate(.17,.17,0),steel,0,0,0,{p:g,ink:.01,t:{rim:2}});p(sph(.02,1,1,.5,5),steel,.275,.3,0,{p:g,ink:.006});
  p(new THREE.TorusGeometry(.17,.012,4,22,PI*.78).rotateZ(PI*.22).scale(1,1,.5).translate(.17,.17,0),'#e8e8dc',0,0,0,{p:g,ink:0});
  return{tip:new V3(.275,.3,0)}},
 /* Daga del cabecilla: hoja oscura con dientes de sierra en el filo, guarda curva, empuñadura carmesí y pomo dorado. */
 'ms:ban':(p,g)=>{const blade='#6a6e78',red='#8a1c22',gold='#d8b050';
  p(cyl(.021,.019,.11,7),red,0,-.005,0,{p:g,ink:.009});[-.03,.01].forEach(y=>p(tor(.023,.006,9,5).rotateX(PI/2),'#2e2428',0,y,0,{p:g,ink:.004}));p(sph(.028,1,1,1,7),gold,0,-.075,0,{p:g,ink:.008});
  p(new THREE.TorusGeometry(.1,.016,5,12,PI).rotateZ(PI).scale(1,.45,.7),gold,0,.058,0,{p:g,ink:.008});
  p(box(.046,.27,.016).translate(0,.2,0),blade,0,0,0,{p:g,ink:.01,t:{rim:2}});p(cone(.033,.1,4).rotateY(PI/4).scale(1,1,.34),blade,0,.38,0,{p:g,ink:.009});
  for(let k=0;k<4;k++)p(cone(.011,.032,3).rotateZ(-PI/2),blade,.032,.12+k*.05,0,{p:g,ink:.005});
  p(box(.014,.2,.018).translate(0,.2,0),'#9a9ea8',0,0,0,{p:g,ink:0});return{tip:new V3(0,.44,0)}},
 /* Mandoble orco: cuchilla ancha y tosca de hierro, con muescas, remaches y mango envuelto en cuero con pomo de pincho. */
 'ms:orc':(p,g)=>{const iron='#7a7468',dk='#4a4640',rust='#8a5a3a';const L=.8;
  p(cyl(.026,.023,.3,7),LEA,0,-.07,0,{p:g,ink:.01});[-.16,-.09,-.02].forEach(y=>p(tor(.03,.008,9,5).rotateX(PI/2),'#2a1c14',0,y,0,{p:g,ink:.004}));p(cone(.04,.1,5).rotateX(PI),dk,0,-.25,0,{p:g,ink:.008});
  p(box(.3,.045,.07),dk,0,.1,0,{p:g,ink:.01});[-1,1].forEach(s=>p(cone(.03,.07,5).rotateZ(-s*PI/2),dk,.17*s,.1,0,{p:g,ink:.008}));
  p(box(.13,L,.024).translate(.012,.13+L/2,0),iron,0,0,0,{p:g,ink:.012,t:{rim:2}});p(box(.03,L*.9,.028).translate(-.03,.14+L*.45,0),dk,0,0,0,{p:g,ink:0});
  p(new THREE.ConeGeometry(.075,.16,4).rotateY(PI/4).scale(1,1,.3),iron,.012,.13+L+.08,0,{p:g,ink:.01});
  [.3,.5,.68].forEach((y,k)=>{p(box(.03,.04,.03),dk,.07,y,0,{p:g,ink:.005,rz:.6});p(sph(.014,1,1,.8,5),rust,-.02,.2+k*.22,.014,{p:g,ink:0})});   // muescas de batalla y remaches
  return{tip:new V3(0,1.05,0)}},
 /* Maza de guerra de Gruk: mango largo con anillos de oro y cabeza de hierro con pinchos y colmillo. */
 'ms:gru':(p,g)=>{const iron='#4a4e44',dk='#2c2e28',gold='#c8a24a',bone='#e8e0c0';
  p(cyl(.026,.024,.8,8),'#4a3424',0,.12,0,{p:g,ink:.01});[-.1,.1,.32,.46].forEach(y=>p(tor(.03,.01,10,5).rotateX(PI/2),gold,0,y,0,{p:g,ink:.006}));
  p(cone(.045,.12,6).rotateX(PI),gold,0,-.33,0,{p:g,ink:.008});
  p(new THREE.OctahedronGeometry(.15,0).scale(.9,1.15,.9),iron,0,.66,0,{p:g,ink:.012,t:{rim:2}});p(tor(.13,.02,12,6).rotateX(PI/2),gold,0,.66,0,{p:g,ink:.008});
  for(let k=0;k<6;k++){const a=k/6*TAU;p(cone(.028,.11,5).rotateZ(-Math.sin(a)*PI/2).rotateX(Math.cos(a)*PI/2),bone,Math.sin(a)*.17,.66,Math.cos(a)*.17,{p:g,ink:.007})}
  p(cone(.045,.17,6),dk,0,.86,0,{p:g,ink:.01});p(cone(.018,.08,5),gold,0,.98,0,{p:g,ink:.006});
  return{tip:new V3(0,.8,0)}}
};
const GL=(c,k=1.6)=>({ink:0,mat:glow(c,k)});
Object.assign(SETW,{
 /* Espada del Héroe Dormido: hoja clara con canal, guarda larga de alas doradas con gema azul, empuñadura azul oscuro. */
 'ms:un_espada_heroe':(p,g)=>{const steel='#d8e4f0',gold='#d8b050',blue='#2a3a7a';
  p(cyl(.022,.02,.15,7),blue,0,-.01,0,{p:g,ink:.009});p(sph(.032,1,1,1,8),gold,0,-.1,0,{p:g,ink:.008});[-.04,.0].forEach(y=>p(tor(.025,.006,9,5).rotateX(PI/2),gold,0,y,0,{p:g,ink:.004}));
  p(box(.27,.032,.05),gold,0,.075,0,{p:g,ink:.01});[-1,1].forEach(s=>{p(cone(.032,.1,4).rotateZ(-s*PI/2.6),gold,.15*s,.1,0,{p:g,ink:.008});p(cone(.02,.06,4).rotateZ(s*PI),gold,.1*s,.05,0,{p:g,ink:.006})});
  p(sph(.026,1,1.2,.6,8),'#6ab0ff',0,.078,.026,Object.assign({p:g},GL('#6ab0ff',1.8)));
  const L=.56,w=.062;p(box(w,L,.018).translate(0,.1+L/2,0),steel,0,0,0,{p:g,ink:.01,t:{rim:2}});p(new THREE.ConeGeometry(w*.72,w*1.5,4).rotateY(PI/4).scale(1,1,.36),steel,0,.1+L+w*.75,0,{p:g,ink:.009});
  p(box(w*.22,L*.85,.022).translate(0,.11+L*.45,0),'#9fb4cc',0,0,0,{p:g,ink:0});return{tip:new V3(0,.1+L+w*1.4,0)}},
 /* Arco de la Hada Cazadora: madera clara con hojas en las puntas y una lucecita que revolotea cerca de la cuerda. */
 'ms:un_arco_hada':(p,g)=>{const wood='#cfe8c8',leaf='#6ac078';
  p(tubeG([[0,-.42,-.12],[0,-.28,-.025],[0,-.1,.03],[0,0,.05],[0,.1,.03],[0,.28,-.025],[0,.42,-.12]],.02,24),wood,0,0,0,{p:g,ink:.009});
  [-1,1].forEach(s=>{[0,1].forEach(k=>p(sph(.03,.5,1.5,.25,6),leaf,(k?1:-1)*.035,s*(.37+k*.03),-.08-k*.02,{p:g,ink:.006}));p(sph(.022,1,1,1,6),'#e8d8a0',0,s*.435,-.125,{p:g,ink:.006})});
  p(cyl(.026,.026,.12,8),'#3a6a4a',0,0,.05,{p:g,ink:.009});p(tor(.028,.007,9,5).rotateX(PI/2),'#e8d8a0',0,.07,.05,{p:g,ink:.004});
  p(sph(.022,1,1,1,8),'#fff6c0',.07,.2,.0,Object.assign({p:g},GL('#fff6c0',2.2)));p(sph(.045,1,1,1,8),'#fff6c0',.07,.2,.0,Object.assign({p:g},GL('#ffe890',.7)));
  return{tipA:new V3(0,.42,-.12),tipB:new V3(0,-.42,-.12),rest:new V3(0,0,-.12)}},
 /* Hoja Oculta: hoja larga y finísima, empuñadura blanca con lazo rojo y un anillo en el pomo (la hoja asoma de una muñequera). */
 'ms:un_hoja_oculta':(p,g)=>{const steel='#c8ccd4',red='#b02a2a';
  p(cyl(.019,.017,.11,7),'#e8e4dc',0,-.005,0,{p:g,ink:.009});p(tor(.024,.006,9,5).rotateX(PI/2),red,0,-.03,0,{p:g,ink:.004});p(tor(.03,.008,10,5),'#d8b050',0,-.085,0,{p:g,ink:.006});
  p(box(.1,.02,.034),'#4a4e58',0,.055,0,{p:g,ink:.008});
  p(box(.03,.34,.012).translate(0,.22,0),steel,0,0,0,{p:g,ink:.009,t:{rim:2}});p(cone(.022,.09,4).rotateY(PI/4).scale(1,1,.34),steel,0,.44,0,{p:g,ink:.008});
  p(box(.008,.3,.014).translate(0,.22,0),'#8a8e98',0,0,0,{p:g,ink:0});return{tip:new V3(0,.49,0)}},
 /* Hoja Huérfana de Escarcha: mandoble de hielo con runas brillantes, dientes de cristal y guarda de pinchos negros. */
 'ms:un_hoja_escarcha':(p,g)=>{const ice='#bfe6ff',dk='#1e2430',L=.84;
  p(cyl(.025,.022,.3,7),dk,0,-.06,0,{p:g,ink:.01});[-.14,-.06,.02].forEach(y=>p(tor(.03,.008,9,5).rotateX(PI/2),'#6a7a9a',0,y,0,{p:g,ink:.004}));p(cone(.04,.1,5).rotateX(PI),dk,0,-.25,0,{p:g,ink:.008});
  p(box(.34,.045,.06),dk,0,.1,0,{p:g,ink:.01});[-1,1].forEach(s=>{p(cone(.03,.12,5).rotateZ(-s*PI/2.4),dk,.19*s,.12,0,{p:g,ink:.008});p(cone(.022,.08,5).rotateZ(s*PI),dk,.12*s,.06,0,{p:g,ink:.006})});
  p(box(.085,L,.022).translate(0,.12+L/2,0),ice,0,0,0,{p:g,ink:.01,t:{rim:2.5}});p(new THREE.ConeGeometry(.062,.2,4).rotateY(PI/4).scale(1,1,.3),ice,0,.12+L+.1,0,{p:g,ink:.01});
  for(let k=0;k<5;k++){p(cone(.022,.07,3).rotateZ(-PI/2),'#e8f6ff',.05,.28+k*.13,0,{p:g,ink:.005});p(cone(.016,.05,3).rotateZ(PI/2),'#e8f6ff',-.05,.34+k*.13,0,{p:g,ink:.004})}
  p(box(.02,L*.8,.026).translate(0,.14+L*.4,0),'#4ab0ff',0,0,0,Object.assign({p:g},GL('#4ab0ff',1.6)));
  [.35,.55].forEach(y=>p(box(.03,.03,.03),'#4ab0ff',0,y,.014,Object.assign({p:g},GL('#4ab0ff',2))));return{tip:new V3(0,1.1,0)}}
});
export const SET3D={gel,caz,gob,esp,ban,orc,gru};
export {SETW};
export const setHelm=(set,F,hg,P,GLO)=>!!(SET3D[set]&&SET3D[set].helm&&SET3D[set].helm(F,hg,P,GLO));
export const setChest=(set,F,g,P,GLO)=>!!(SET3D[set]&&SET3D[set].chest&&SET3D[set].chest(F,g,P,GLO));
export const setBoots=(set,F,g,P,GLO)=>!!(SET3D[set]&&SET3D[set].boots&&SET3D[set].boots(F,g,P,GLO));
export const setLegs=(set,F,g,P,GLO)=>!!(SET3D[set]&&SET3D[set].legs&&SET3D[set].legs(F,g,P,GLO));
export const setGloves=(set,F,g,P,GLO)=>!!(SET3D[set]&&SET3D[set].gloves&&SET3D[set].gloves(F,g,P,GLO));
export const setCape=(set,F,g,P,GLO)=>!!(SET3D[set]&&SET3D[set].cape&&SET3D[set].cape(F,g,P,GLO));
/** Colores del cuerpo base bajo la pieza (camisa, pantalón, botas) para que no asome otro color. */
export const setPal=set=>PAL[set]||PAL.gel;
export const setRobe=(set,base)=>PAL[set]?PAL[set].robe:base;
