// NotScape · R3D · ARMADURAS DEL JUGADOR (Lote R3D-ARMADURAS, 18 oct 2026) — todo por código, estilo diorama + cel shading + contorno (ver mini3d.js).
// ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// QUÉ ES: piezas 3D de equipo para el héroe `Mini` (herom3d.js). El juego (game.js `armorInfo()`) describe el equipo puesto en `look.arm`:
//   look.arm = { a:{f,t}, l:{f,t}, g:{f,t}, s:{f,t}, h:{k,q,leg}, f:{k,q,leg}, c:{k,q,leg} }
//     · a/l/g/s  = peto / pantalones / guantes / escudo CRAFTEADOS: f = familia ('m' metal · 'cu' cuero tachonado · 'tu' tela/túnica), t = id de nivel (cobre…celestita).
//     · h/f/c    = casco / botas / capa de BOTÍN: k = bioma 0-5 (Pradera, Bosque, Pantano, Nieve, Japón, Volcán), q = rareza 1-3, leg = 1 si es legendario.
// DISEÑO (reglas del dueño: legible, sin «vestidito», diseños con carácter pero dentro del artstyle diorama):
//   · METAL (11 niveles): el nivel sube el «rango» 0-10 → más capas en hombreras, gola, cresta, emblema y por fin runas/gemas que BRILLAN (mitril+).
//   · CUERO: chaleco con cordones, correas y TACHAS del metal del nivel (más tachas y hebilla con gema al subir).
//   · TELA: TÚNICA LARGA de mago (excepción permitida: id `heroe-mago` en Mini.DRESS_OK), ribete y puños del nivel; brillo en el bajo en niveles altos.
//   · CASCO / BOTAS / CAPA: un diseño por BIOMA, y la rareza añade piezas (rareza 3 = la «corona»/pieza estrella), los legendarios llevan brillo.
// CÓMO AÑADIR / CAMBIAR UNA PIEZA: edita la función de su ranura (chestMetal, chestLeather, chestRobe, legs, gloves, boots, helm, cape, shield) — cada una recibe
// el Mini (F), el grupo donde colgar piezas y la paleta del nivel (T). Verifica SIEMPRE de cerca: `python3 -I tools/r3d/armor_sheet.py <salida.png> <set>`.
// TRAMPAS: (1) Mini.part crea el casco de contorno al instante y NO copia rotaciones posteriores → aquí las rotaciones se hornean en la geometría (helper P con rx/ry/rz);
// (2) las piezas de una extremidad cuelgan del GRUPO de esa extremidad (F.arms/elbows/legs/knees/ankles) para que se muevan con las animaciones;
// (3) nada de faldones: el peto termina en la cintura; solo la tela (túnica) y los magos llevan vestido.
import * as THREE from 'three';
import {glow} from './materials3d.js';
import {cultOf,clothC,chestC,robeC,legsC,glovesC,shieldC,JBLK,JRED} from './armorcult3d.js';

const sph=(r,x=1,y=1,z=1,n=14)=>new THREE.SphereGeometry(r,n,Math.max(7,n*.7|0)).scale(x,y,z);
const cyl=(a,b,h,n=12)=>new THREE.CylinderGeometry(a,b,h,n),cone=(r,h,n=6)=>new THREE.ConeGeometry(r,h,n),box=(x,y,z)=>new THREE.BoxGeometry(x,y,z);
const tor=(R,r,n=20,s=7,arc)=>new THREE.TorusGeometry(R,r,s,n,arc||Math.PI*2);
const lathe=(pts,n=22)=>new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),n);
const shade=(c,k)=>'#'+new THREE.Color(c).multiplyScalar(k).getHexString(),mixc=(a,b,t)=>'#'+new THREE.Color(a).lerp(new THREE.Color(b),t).getHexString();
const PI=Math.PI;

// ── paleta por nivel (c = color del metal, d = sombra, t = acento, g = brillo mágico o null) ──
export const TIER_IDS=['cobre','estano','bronce','hierro','acero','plata','mitril','adam','runita','oricalco','celestita'];
const TC={cobre:'#b8623a',estano:'#cfd4dc',bronce:'#c8742a',hierro:'#9a9aa8',acero:'#cfd8e0',plata:'#e8e8f0',mitril:'#4a7aff',adam:'#3adf6a',runita:'#3ad0d8',oricalco:'#e89a3a',celestita:'#c8a0ff'};
const GL={mitril:'#7fb0ff',adam:'#8dffae',runita:'#8ffaff',oricalco:'#ffd070',celestita:'#ead2ff'};
export function tierPal(id){const r=Math.max(0,TIER_IDS.indexOf(id)),c=TC[id]||'#9a9aa8';
 return{id,r,c:r>=3&&r<=5?mixc(c,'#8a90a0',.15):c,d:shade(c,.55),t:r>=5?'#e0b84a':mixc(c,'#ffffff',.35),g:GL[id]||null,lo:shade(c,.78)}}

// helper de piezas: rotaciones horneadas en la geometría (ver TRAMPAS 1)
const mkP=part=>(geo,col,x,y,z,o={})=>{if(o.rx)geo.rotateX(o.rx);if(o.ry)geo.rotateY(o.ry);if(o.rz)geo.rotateZ(o.rz);return part(geo,col,x,y,z,o)};
const MET={t:{rim:2}};      // metal: más luz de borde
const GLO=(c,k=1.8)=>({ink:0,mat:glow(c,k)});

// ═══ PETO: los petos de metal y cuero por cultura están en armorcult3d.js (chestC); aquí solo la túnica base (familia tela) ═══
export function chestRobe(F,g,P,T,cloth){const r=T.r;
 P(tor(.112,.022,18,6).rotateX(PI/2),T.t,0,.845,0,{p:g});                                                                   // cuello alto con ribete
 P(tor(.2*F.W*1.02,.02,22,6).rotateX(PI/2),T.c,0,.52,0,Object.assign({p:g},r>=6?{}:{t:{rim:1.5}}));                      // fajín
 P(box(.05,.26,.016),T.c,.06,.4,.2*F.W+.006,{p:g,rx:-.05,t:{rim:1.5}});   // extremo del fajín
 F.elbows.forEach((e,i)=>{const q=i?1:-1;P(cone(.095,.2,12).rotateX(PI),cloth,0,-.12,0,{p:e,ink:.014});P(tor(.07,.016,14,6).rotateX(PI/2),T.t,0,-.02,0,{p:e})});   // mangas anchas
 F.arms.forEach((a,i)=>P(sph(.085,1.15,.7,1.05),cloth,.02*(i?1:-1),.03,0,{p:a}));
 if(T.g){P(tor(.262*F.W,.012,26,5).rotateX(PI/2),T.g,0,.07,0,Object.assign({p:g},GLO(T.g,1.8)));P(sph(.025,1,1,.7,8),T.g,0,.835,.11,Object.assign({p:g},GLO(T.g,2.2)))}}   // brillo en el bajo y en el cuello

// ═══════════════════════════════ BOTAS (por bioma) ═══════════════════════════════
const BOOT=[{c:'#8a5a30',a:'#d8b050'},{c:'#5a6a38',a:'#8ac060'},{c:'#5a6240',a:'#9ab05a'},{c:'#c8d6e0',a:'#9fe0ff'},{c:'#2a1e22',a:'#e8c070'},{c:'#2a2024',a:'#ff7a2a'}];
export function bootsPal(b){const k=Math.max(0,Math.min(5,b.k|0));return BOOT[k]}
export function boots(F,g,P,b){const k=Math.max(0,Math.min(5,b.k|0)),q=b.leg?4:b.q||1,B=BOOT[k],hi=q>=3;
 F.knees.forEach((kn,i)=>{const an=F.ankles[i];
  if(k===0){P(tor(.066,.016,14,6).rotateX(PI/2),shade(B.c,1.2),0,-.0,0,{p:kn});[0,1,2].forEach(j=>P(box(.012,.014,.01),B.a,0,-.04-j*.025,.066,{p:kn}));
   if(q>=2)P(box(.03,.03,.012),B.a,0,-.07,.068,{p:kn,t:{rim:2}});if(hi)[-1,1].forEach(s=>P(cone(.02,.1,4).scale(.5,1,1),B.a,.07*s,-.12,-.01,Object.assign({p:kn,rz:s*1.0},GLO('#fff0b0',1.5))))}
  else if(k===1){P(cyl(.07,.074,.16,10),B.c,0,-.1,0,{p:kn});[[.04,-.06],[-.04,-.13],[.0,-.15]].forEach(([x,y],j)=>P(sph(.026,1,.8,1,7),'#6aa040',x,y,.052,{p:kn}));if(q>=2)[-1,1].forEach(s=>P(cone(.018,.07,4),B.a,.07*s,-.03,0,{p:kn,rz:-s*.5}))}
  else if(k===2){P(cyl(.07,.08,.22,10),B.c,0,-.085,0,{p:kn});P(tor(.078,.014,14,6).rotateX(PI/2),shade(B.c,.7),0,.02,0,{p:kn});[0,1,2].forEach(j=>P(sph(.022,1,.8,1,6),'#3a3a26',(j-1)*.04,-.14-j*.01,.065,{p:kn}));if(hi)P(sph(.02,1,1,.7,8),'#ffe56a',0,.0,.075,Object.assign({p:kn},GLO('#ffe56a',2)))}
  else if(k===3){P(cyl(.07,.076,.14,10),'#a8b8c4',0,-.1,0,{p:kn});P(sph(.082,1.1,.55,1.1,10),'#f4f8fc',0,-.02,0,{p:kn});[0,1,2,3].forEach(j=>P(sph(.026,1,1,1,7),'#f4f8fc',(j-1.5)*.04,-.02,.06,{p:kn}));if(hi)[-1,1].forEach(s=>P(cone(.016,.08,4),B.a,.07*s,-.07,0,Object.assign({p:kn,rz:-s*.3},GLO(B.a,1.6))))}
  else if(k===4){P(box(.14,.05,.17),'#6a4a2a',0,-.04,.03,{p:an});[-1,1].forEach(s=>P(box(.14,.03,.03),'#6a4a2a',0,-.075,.03+s*.06,{p:an}));P(sph(.064,1.05,.7,1.4),'#f2ead8',0,.0,.02,{p:an});P(tor(.07,.012,14,6).rotateX(PI/2),B.c,0,-.04,0,{p:kn});if(hi)P(tor(.075,.014,14,6).rotateX(PI/2),B.a,0,-.1,0,Object.assign({p:kn},GLO(B.a,1.4)))}
  else{P(cyl(.07,.076,.15,10),B.c,0,-.1,0,{p:kn});[-1,1].forEach(s=>P(box(.012,.08,.008),B.a,.03*s,-.1,.07,Object.assign({p:kn},GLO(B.a,1.7))));P(cone(.03,.09,5),'#14101a',0,-.01,.07,{p:kn,rx:PI/2});if(hi)P(sph(.022,1,1,.7,8),B.a,0,-.04,.082,Object.assign({p:kn},GLO(B.a,2.4)))}})}

// ═══════════════════════════════ CASCOS (por bioma) ═══════════════════════════════
function dome(P,head,c,o={}){P(new THREE.SphereGeometry(.212,18,12,0,6.2832,0,o.th||1.62).scale(1,1.05,1.02),c,0,.04,-.005,Object.assign({p:head},MET));
 if(!o.nobrim)P(cyl(.226,.226,.026,20),o.brim||c,0,.047,-.005,Object.assign({p:head},MET));
 if(o.neck)P(new THREE.SphereGeometry(.214,16,8,PI*1.2,PI*.6,1.3,1.1).scale(1,1.05,1.02),o.neck,0,.04,-.005,Object.assign({p:head,t:{side:THREE.DoubleSide}},MET))}
export function helm(F,head,P,h){const k=Math.max(0,Math.min(5,h.k|0)),q=h.leg?4:h.q||1,B=BOOT[k],G=h.leg?'#e0b84a':null;
 if(h.leg){dome(P,head,'#2a2430',{neck:'#2a2430'});P(tor(.215,.02,22,7).rotateX(PI/2),'#e0b84a',0,.12,-.005,{p:head,t:{rim:2}});for(let i=0;i<7;i++){const a=(i/7-.5)*PI*1.7;P(cone(.026,.14+(i===3?.07:0),5),'#e0b84a',Math.sin(a)*.2,.2,Math.cos(a)*.14-.005,Object.assign({p:head,t:{rim:2}}))}P(sph(.03,1,1,.8,8),'#c07aff',0,.14,.2,Object.assign({p:head},GLO('#c07aff',2.2)));return}
 if(k===0){if(q===1){dome(P,head,'#7a4e28',{nobrim:1,th:1.55});P(box(.2,.024,.1),'#5a3418',0,.07,.2,{p:head});P(tor(.2,.012,22,6).rotateX(PI/2),'#d8b050',0,.1,-.005,{p:head,t:{rim:2}})}
  else{P(new THREE.SphereGeometry(.226,18,12,0,6.2832,0,1.75).scale(1,1.06,1.05),'#4a6a3a',0,.035,-.02,{p:head});P(cone(.1,.2,10),'#4a6a3a',0,.25,-.16,{p:head,rx:-.9});P(box(.01,.2,.05),'#e8e0c0',.1,.2,-.12,{p:head,rz:-.4,rx:-.3});
   if(q>=3){dome(P,head,'#6a4a28',{th:1.2,brim:'#e0b84a'});P(tor(.2,.02,22,7).rotateX(PI/2),'#e0b84a',0,.12,0,{p:head,t:{rim:2}});for(let i=0;i<7;i++){const a=(i/6-.5)*PI*1.3;P(cone(.018,.11,4),'#ffe27a',Math.sin(a)*.2,.2,Math.cos(a)*.15,Object.assign({p:head,rz:-Math.sin(a)*.5},GLO('#ffe27a',1.6)))}}}}
 else if(k===1){dome(P,head,'#8a6a40',{brim:'#6a4a28'});P(tor(.213,.012,22,6).rotateX(PI/2),'#4a3220',0,.09,-.005,{p:head});
  if(q>=2)[-1,1].forEach(s=>{P(cone(.016,.17,5),'#d8c8a0',.16*s,.24,-.02,{p:head,rz:-s*.5,t:{rim:2}});P(cone(.012,.1,5),'#d8c8a0',.2*s,.33,-.02,{p:head,rz:s*.1,t:{rim:2}});P(cone(.012,.1,5),'#d8c8a0',.26*s,.29,.0,{p:head,rz:-s*.8,t:{rim:2}})});
  if(q>=3)[-1,1].forEach(s=>{P(cone(.02,.2,5),'#d8c8a0',.22*s,.4,-.02,{p:head,rz:-s*.3,t:{rim:2}});P(sph(.022,1,1,.8,8),'#8aff8a',.12*s,.07,.19,Object.assign({p:head},GLO('#8aff8a',2)))})}
 else if(k===2){dome(P,head,'#6a6a5a',{brim:'#4a4a3c'});[[.1,.2,.0],[-.12,.19,.06],[.0,.24,-.1]].forEach(([x,y,z])=>P(sph(.04,1,.7,1,7),'#5a8a3a',x,y,z,{p:head}));
  if(q>=2){P(sph(.125,1.25,.55,.55,12),'#6a6a5a',0,-.085,.17,{p:head,t:{rim:2}});[-1,1].forEach(s=>{P(sph(.03,1,1.1,.7,8),'#e8ff8a',.085*s,.115,.19,Object.assign({p:head},GLO('#e8ff8a',2)));P(cone(.02,.07,5),'#4a4a3c',.12*s,.14,.15,{p:head,rz:-s*.8})})}
  if(q>=3)[-1,1].forEach(s=>P(cone(.028,.17,5),'#e8e0c0',.16*s,.2,.0,{p:head,rz:-s*.6,t:{rim:2}}))}
 else if(k===3){dome(P,head,'#a8b8c8',{brim:'#8a9aaa'});P(tor(.224,.028,18,7).rotateX(PI/2),'#f4f8fc',0,.06,-.005,{p:head});
  if(q>=2)for(let i=0;i<5;i++){const a=(i/4-.5)*1.6;P(cone(.025,.1+(i===2?.08:0),4),'#bfe8ff',Math.sin(a)*.15,.22,Math.cos(a)*.12-.03,Object.assign({p:head,rz:-Math.sin(a)*.4},GLO('#bfe8ff',1.4)))}
  if(q>=3){P(tor(.2,.016,22,6).rotateX(PI/2),'#dff6ff',0,.15,-.005,Object.assign({p:head},GLO('#dff6ff',1.4)));P(cone(.03,.2,4),'#9fe0ff',0,.38,-.02,Object.assign({p:head},GLO('#9fe0ff',1.8)))}}
 else if(k===4){dome(P,head,'#201c20',{brim:'#b01f1c',neck:'#2a1c20'});P(tor(.214,.014,22,6).rotateX(PI/2),'#e8c070',0,.1,-.005,{p:head,t:{rim:2}});
  if(q>=2)P(new THREE.TorusGeometry(.09,.016,6,16,PI).rotateZ(0),'#e8c070',0,.19,.17,{p:head,t:{rim:2}});
  if(q>=3)[-1,1].forEach(s=>P(cone(.03,.22,6),'#f0e4c0',.1*s,.22,.02,Object.assign({p:head,rz:-s*.5},{t:{rim:2}})))}
 else{dome(P,head,'#2a2024',{brim:'#14101a'});for(let i=0;i<3;i++)P(cone(.022,.11,5),'#14101a',(i-1)*.07,.25,-.02,{p:head,rz:(i-1)*-.3});
  if(q>=2)P(box(.02,.16,.18),'#ff7a2a',0,.22,-.02,Object.assign({p:head},GLO('#ff7a2a',1.5)));
  if(q>=3)for(let i=0;i<3;i++)P(cone(.03,.16,4),'#ffb03a',(i-1)*.08,.32,-.03,Object.assign({p:head},GLO('#ffb03a',1.7)))}}

// ═══════════════════════════════ CAPA (por bioma) ═══════════════════════════════
const CAPE=[{c:'#a8946a',e:'#d8b050'},{c:'#4a6a3a',e:'#8ac060'},{c:'#8a8a4a',e:'#c0c070'},{c:'#e8eef4',e:'#9fe0ff'},{c:'#241a1e',e:'#b01f1c'},{c:'#241a1e',e:'#ff7a2a'}];
export function cape(F,g,P,c){const k=Math.max(0,Math.min(5,c.k|0)),q=c.leg?4:c.q||1,C=CAPE[k],W=F.W,rc=.19*W*(F.cw||1),n=10,m=12;
 const geo=new THREE.PlaneGeometry(1,1,n,m);const pos=geo.attributes.position;
 for(let i=0;i<pos.count;i++){const u=pos.getX(i)+.5,v=pos.getY(i)+.5;      // v=1 hombros, v=0 bajo
  const w=(.2+(1-v)*.22)*W,ang=(u-.5)*(.9+(1-v)*.5);const x=Math.sin(ang)*(w*1.1),z=-rc*1.02-(1-Math.cos(ang))*w*.4-(1-v)*(1-v)*.16-(.0+Math.sin(u*PI)*.015);
  pos.setXYZ(i,x,.84-(1-v)*.64+(k===5?-(Math.sin(u*14)*.02)*(1-v):0),z)}
 geo.computeVertexNormals();
 const mesh=P(geo,C.c,0,0,0,{p:g,t:{side:THREE.DoubleSide},ink:.012});
 P(tor(.13,.022,18,6).rotateX(PI/2),k===3?'#ffffff':shade(C.c,1.25),0,.835,-.015,{p:g});                         // cuello de la capa
 const e=C.e;P(box(.34*W*.9,.02,.01),shade(C.c,.6),0,.25,-rc*1.02-.145,{p:g});if(q>=2)P(box(.3,.018,.008),e,0,.3,-rc*1.02-.14,Object.assign({p:g},k===5?GLO(e,1.5):{}));
 if(k===1)for(let i=0;i<9;i++)P(cone(.03,.07,4),'#8ac060',Math.sin(i*2.4)*.22,.76-i*.065,-rc*1.02-.05-i*.008,{p:g,rx:-PI/2*.8});
 if(q>=3||c.leg)P(sph(.026,1,1,.8,8),e,0,.82,-rc*1.02+.0,Object.assign({p:g},GLO(e,2)))}

// ═══════════════════════════════ ESCUDO (se construye desde heroanim3d BUILD.shield) ═══════════════════════════════
export function shield(part,h,s){const T=tierPal(s.t),P=mkP(part);return shieldC(P,h,T,s.f||'m',s.cu!=null?s.cu:cultOf(s.t),GLO)}

// ═══════════════════════════════ ENSAMBLE ═══════════════════════════════
// armorHooks(arm, base): devuelve {spec(sp)→parche del spec, top, acc, helm}. `base` = spec ya calculado por lookToSpec (colores del jugador).
export function armorHooks(arm,base){if(!arm)return null;const keys=['a','l','g','s','h','f','c'];if(!keys.some(k=>arm[k]))return null;
 const sp={},pal=o=>tierPal(o&&o.t);let robeDress=false,T0=null;
 if(arm.a){const T=pal(arm.a);T0=T;if(arm.a.f==='m'){const jp=(arm.a.cu!=null?arm.a.cu:cultOf(arm.a.t))===4;sp.sleeve=jp?JBLK:mixc(base.robe,T.d,.45);sp.robe=jp?JBLK:mixc(base.robe,T.d,.6)}
  else if(arm.a.f==='cu'){const jp=(arm.a.cu!=null?arm.a.cu:cultOf(arm.a.t))===4;sp.sleeve=jp?'#241a18':mixc('#5a3a22',T.c,.06);sp.robe=jp?'#2a1e1a':mixc('#7a4c26',T.c,.07)}
  else{robeDress=true;const cl=clothC(arm.a.cu!=null?arm.a.cu:cultOf(arm.a.t),T);sp.robe=cl;sp.sleeve=cl;sp.trim=T.t;sp.dress=true;sp.hem=.05;sp.flare=.78;sp.id='heroe-mago'}}
 if(arm.l){const T=pal(arm.l);const jp=(arm.l.cu!=null?arm.l.cu:cultOf(arm.l.t))===4;sp.pants=jp?(arm.l.f==='tu'?clothC(4,T):JBLK):arm.l.f==='m'?T.d:arm.l.f==='cu'?shade(mixc('#7a4c26',T.c,.07),.8):clothC(arm.l.cu!=null?arm.l.cu:cultOf(arm.l.t),T)}
 if(arm.f)sp.boot=shade(BOOT[Math.max(0,Math.min(5,arm.f.k|0))].c,arm.f.leg?.85:1);
 return{spec:sp,hasHelm:!!arm.h,dress:robeDress,
  top(F,head,part){if(!arm.h)return;helm(F,head,mkP(part),arm.h)},
  acc(F,g,part){const P=mkP(part);
   const cuo=o=>o.cu!=null?o.cu:cultOf(o.t);
   if(arm.a){const T=pal(arm.a),cu=cuo(arm.a);if(arm.a.f==='tu'){const TT=cu===4?Object.assign({},T,{c:JRED,g:null}):T;chestRobe(F,g,P,TT,sp.robe);robeC(F,g,P,TT,cu,GLO)}else chestC(F,g,P,T,arm.a.f||'m',cu,GLO)}
   if(arm.l)legsC(F,g,P,pal(arm.l),arm.l.f||'m',cuo(arm.l),GLO);
   if(arm.g)glovesC(F,g,P,pal(arm.g),arm.g.f||'m',cuo(arm.g),GLO);
   if(arm.f)boots(F,g,P,arm.f);
   if(arm.c)cape(F,g,P,arm.c)}}}
