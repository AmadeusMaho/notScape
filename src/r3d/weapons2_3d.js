// NotScape · R3D · ARMAS POR CULTURA, TANDA 2 (26 oct 2026, pedido del dueño: «las hachas son un triángulo pegado, los arcos solo cambian de color, falta Páramo, Desierto y Costa»).
// ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Culturas = índice de bioma: 0 Pradera · 1 Bosque · 2 Pantano · 3 Cumbres · 4 Oriental · 5 Volcán · 6 PÁRAMO (hueso y runas violeta) · 7 DESIERTO (cimitarra, oro, sol) · 8 COSTA (piratas)
// · 9 CIELO (griego) · 10 INFIERNO. `ext(kind,p,g,o,cu)` devuelve el MISMO objeto que las funciones de weapons3d.js o null si esta tanda no define ese caso.
// Cubre: hachas (hatchet/greataxe) de TODAS las culturas con cabeza extruida propia, arcos de las culturas 1–10 con silueta propia, y el resto de armas de 6, 7 y 8.
// Contrato (no cambiar): arco = tipA (0,.37,-.09) · tipB (0,-.37,-.09) · rest (0,0,-.09); ballesta = tipA/tipB (±.24,.29,.06), nutY .12, relY .32; báculo orbe en y 1.04 (cetro .47).
import * as THREE from 'three';
import {glow} from './materials3d.js';
import {shp} from './armorcult3d.js';

const V3=THREE.Vector3,PI=Math.PI,TAU=PI*2;
const sph=(r,x=1,y=1,z=1)=>new THREE.SphereGeometry(r,12,9).scale(x,y,z),cyl=(a,b,h,n=8)=>new THREE.CylinderGeometry(a,b,h,n),box=(x,y,z)=>new THREE.BoxGeometry(x,y,z),cone=(r,h,n=5)=>new THREE.ConeGeometry(r,h,n);
const tor=(R,r,n=18,s=6)=>new THREE.TorusGeometry(R,r,s,n);
const shade=(c,k)=>'#'+new THREE.Color(c).multiplyScalar(k).getHexString(),mixc=(a,b,t)=>'#'+new THREE.Color(a).lerp(new THREE.Color(b),t).getHexString();
const tube=(pts,r,n=16)=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new V3(...p))),n,r,6,false);
const RIM={t:{rim:2}};
const WOOD='#5a3e2c',DWOOD='#3e2a1e',LEATH='#4a3424',GOLD='#d8a24a',GILD='#e0b84a',BONE='#e8e0c0',MARB='#f2efe6',CELE='#9fd8ff',EMBER='#ff3a1c',NIGHT='#0e0a0e',DARK='#14101a',CHAIN='#5a4a52',FIRE='#ff7a2a',RUNE='#9a8ad8',SAND='#c8a060',SEA='#3a6a8a',ROPE='#b89a62';
function blade(L,wf,off=()=>0,d=.018,y0=.09,n=16){const l=[],r=[];for(let i=0;i<=n;i++){const t=i/n,y=y0+t*L,w=wf(t),o=off(t);l.push([-w+o,y]);r.push([w+o,y])}return shp([...l,...r.reverse().slice(1)],d,.002)}
// filo/veta central que SIGUE la curvatura de la hoja (antes era una caja recta que se salía de la silueta: la «línea vertical» de la hoja curva). off(t) = desvío de la hoja principal en t=0..1 de su largo LL (arranca en yM0).
const fuller=(p,g,LL,off,yM0,yS0,len,wd,col,d=.024)=>p(blade(len,()=>wd,u=>off((yS0-yM0+u*len)/LL),d,yS0,16),col,0,0,0,{p:g,ink:0});
const taper=(w,t0=.82)=>t=>t<t0?w:w*(1-(t-t0)/(1-t0)*.97);

// ───────────── HACHAS: cabeza extruida (x = hacia el filo, y = a lo largo del mango) ─────────────
// pts = contorno de la cabeza de UN lado; dbl = cabeza doble (se espeja). Cada cultura tiene silueta propia.
const AX={
 0:{pts:[[0,.07],[.06,.1],[.13,.13],[.18,.1],[.19,.02],[.16,-.06],[.11,-.13],[.07,-.17],[.03,-.12],[0,-.06]]},                       // hacha barbada medieval
 1:{pts:[[0,.035],[.05,.1],[.12,.11],[.19,.04],[.21,0],[.19,-.04],[.12,-.11],[.05,-.1],[0,-.035]]},                                    // hoja de laurel élfica
 2:{pts:[[0,.05],[.07,.09],[.13,.05],[.14,-.03],[.09,-.08],[.03,-.06],[0,-.03]]},                                                      // tomahawk de piedra
 3:{pts:[[0,.05],[.03,.13],[.1,.21],[.18,.17],[.21,.07],[.2,-.07],[.18,-.17],[.1,-.21],[.03,-.13],[0,-.05]]},                           // gran media luna nórdica
 4:{pts:[[0,.05],[.05,.09],[.12,.1],[.16,.06],[.16,-.06],[.12,-.1],[.05,-.09],[0,-.05]]},                                              // masakari
 5:{pts:[[0,.08],[.1,.1],[.17,.08],[.19,0],[.17,-.1],[.1,-.12],[0,-.1]],d:.045},                                                       // tajadera de forja
 6:{pts:[[0,.05],[.04,.1],[.1,.15],[.14,.1],[.12,.04],[.13,-.04],[.14,-.1],[.1,-.15],[.04,-.1],[0,-.05]]},                              // media luna de hueso
 7:{pts:[[0,.03],[.06,.08],[.14,.1],[.21,.06],[.25,-.02],[.22,-.1],[.18,-.04],[.12,-.01],[.05,-.02],[0,-.03]]},                        // hoz-hacha del desierto
 8:{pts:[[0,.06],[.06,.08],[.13,.08],[.17,.03],[.16,-.04],[.19,-.12],[.13,-.13],[.07,-.1],[0,-.06]]},                                  // hacha de abordaje con garfio
 9:{pts:[[0,.04],[.05,.11],[.12,.17],[.19,.14],[.2,.05],[.19,-.05],[.19,-.14],[.12,-.17],[.05,-.11],[0,-.04]],dbl:1},                   // labrys
 10:{pts:[[0,.05],[.05,.13],[.08,.08],[.13,.17],[.16,.09],[.22,.13],[.2,.02],[.24,-.04],[.19,-.08],[.21,-.16],[.14,-.12],[.1,-.18],[.07,-.1],[.03,-.12],[0,-.05]]}   // dentada infernal
};
const AXC=['#8a8e96','#9aa8a0','#6a6458','#a8b0b8','#9aa0a8','#4a4044','#e0d8c0','#d8c890','#8a8e96','#f0ece0','#3a3038'];
function axeHead(p,g,o,cu,big){const col=o.col||'#8a8e96',s=big?1.45:1,y=big?.58:.26,A=AX[cu]||AX[0],c=mixc(col,AXC[cu]||col,.55),th=(A.d||.026)*s;
 const mk=(pts,m)=>shp((m?pts.map(q=>[-q[0]*s,q[1]*s]).reverse():pts.map(q=>[q[0]*s,q[1]*s])),th,.005);
 p(mk(A.pts,0),c,0,y,0,{p:g,ink:.011,...RIM});if(A.dbl)p(mk(A.pts,1),c,0,y,0,{p:g,ink:.011,...RIM});
 const mx=Math.max(...A.pts.map(q=>q[0]))*s;
 // detalles propios: remates, ataduras y brillos
 if(cu===0){p(cone(.022*s,.08*s,4).rotateZ(PI/2),shade(c,.8),-.05*s,y,0,{p:g,ink:.007});[.04,.07].forEach(d=>p(tor(.024,.005,8,4).rotateX(PI/2),'#3e2a1e',0,y-d,0,{p:g,ink:0}))}
 if(cu===1){p(tor(.03*s,.006,8,4).rotateX(PI/2),'#4a6a2a',0,y-.07*s,0,{p:g,ink:0});[-1,1].forEach(q=>p(sph(.02*s,1,.5,1.5),'#7ab04a',.04*s,y+q*.04*s,.02,{p:g,ink:.004,rz:q*.5}))}
 if(cu===2){[0,1,2].forEach(i=>p(tor(.026,.006,8,4).rotateX(PI/2),'#c8483a',0,y-.04-i*.022,0,{p:g,ink:0}));p(box(.014,.09*s,.006),'#e8c040',-.03,y+.05,.02,{p:g,ink:0,rz:.3});p(cone(.014,.07,4).rotateZ(PI/2),BONE,-.05*s,y,0,{p:g,ink:.005})}
 if(cu===3){for(let i=0;i<8;i++){const a=i/8*TAU;p(sph(.016,1,.8,1),i%2?'#e6e0d2':'#c9c2b0',Math.cos(a)*.03,y-.1*s+Math.sin(a)*.006,Math.sin(a)*.03,{p:g,ink:0})}p(box(.012,.3*s,.012),shade(c,.6),mx*.55,y,.018,{p:g,ink:0})}
 if(cu===4){p(cone(.024*s,.12*s,4),c,0,y+.14*s,0,{p:g,ink:.007});p(tor(.026,.006,8,4).rotateX(PI/2),GILD,0,y-.07,0,{p:g,ink:0});p(box(.012,.1,.012),'#b01f1c',.02,y-.15,0,{p:g,ink:0})}
 if(cu===5){[.07,.13].forEach(x=>p(box(.012,.1*s,.012),FIRE,x*s,y+.01,th*.55,{p:g,ink:0,mat:glow(FIRE,1.8),rz:.3}));p(box(.06,.05,.05),'#241c20',-.03,y,0,{p:g,ink:.008})}
 if(cu===6){p(sph(.026*s),RUNE,mx*.6,y,th*.7,{p:g,ink:0,mat:glow(RUNE,1.8)});[-1,1].forEach(q=>p(cone(.012,.06,4),BONE,-.03,y+q*.07,0,{p:g,ink:.004,rz:q*PI}));p(tor(.028,.006,8,4).rotateX(PI/2),'#3a3048',0,y-.07,0,{p:g,ink:0})}
 if(cu===7){[.1,.17].forEach(x=>p(box(.012,.07*s,th*1.3),GILD,x*s,y+.02*s,0,{p:g,ink:0}));p(sph(.026),GILD,0,y-.08,0,{p:g,ink:.006});p(box(.012,.1,.012),'#c8483a',0,y-.15,0,{p:g,ink:0})}
 if(cu===8){[0,1,2,3].forEach(i=>p(tor(.025,.005,8,4).rotateX(PI/2),ROPE,0,y-.05-i*.02,0,{p:g,ink:0}));p(cone(.016*s,.09*s,4).rotateZ(PI/2),shade(c,.8),-.05*s,y+.02,0,{p:g,ink:.006})}
 if(cu===9){p(tor(.028,.007,10,4).rotateY(PI/2),GILD,0,y,0,{p:g,ink:0});[-1,1].forEach(q=>p(box(.07,.012,.02),MARB,0,y+q*.12*s,0,{p:g,ink:.004,rz:q*.4}))}
 if(cu===10){p(cone(.024*s,.12*s,4).rotateZ(PI/2),NIGHT,-.05*s,y,0,{p:g,ink:.007});p(sph(.016*s),EMBER,mx*.5,y,th*.7,{p:g,ink:0,mat:glow(EMBER,2)});[.12,.18].forEach(x=>p(box(.012,.05*s,.01),EMBER,x*s,y-.01*s,th*.6,{p:g,ink:0,mat:glow(EMBER,1.6)}))}
 return new V3(mx+.03,y,0)}
const SHAFT=['#5a3e2c','#5a4a2a','#4a3a22','#8a9aaa','#2a1c20','#241c20','#b8b090','#5a3a22','#6a4a2a','#f2efe6','#0e0a0e'];
function hatchet(p,g,o,cu){p(cyl(.019,.022,.4,6).translate(0,.08,0),SHAFT[cu]||WOOD,0,0,0,{p:g,ink:.009});if(cu===10)[0,1,2].forEach(i=>p(tor(.022,.004,8,4).rotateX(PI/2),CHAIN,0,-.04+i*.05,0,{p:g,ink:0}));if(cu===7||cu===9)p(sph(.026),GILD,0,-.12,0,{p:g,ink:.007});return{tip:axeHead(p,g,o,cu,false)}}
function greataxe(p,g,o,cu){p(cyl(.022,.025,.9,6).translate(0,.2,0),SHAFT[cu]||WOOD,0,0,0,{p:g,ink:.011});if(cu===10)[0,1,2,3,4].forEach(i=>p(tor(.027,.005,8,4).rotateX(PI/2),CHAIN,0,-.1+i*.07,0,{p:g,ink:0}));if(cu===7||cu===9)p(sph(.03),GILD,0,-.25,0,{p:g,ink:.008});
 const t=axeHead(p,g,o,cu,true);if(cu===3||cu===10||cu===5)[1,-1].forEach(s=>p(cone(.02,.1,4),o.col||'#8a8e96',-.04,.58+s*.2,0,{p:g,ink:.006,rz:s*PI}));return{tip:new V3(t.x+.06,t.y,0)}}

// ───────────── ARCOS: silueta, grosor, remates y empuñadura propios por cultura ─────────────
// T = puntos del cuerpo (extremos fijos en (0,±.37,-.09) por contrato de animación). El resto cambia: curva (recurvo/longbow/compuesto), grosor, remates, ataduras.
const BT={
 1:[[0,-.37,-.09],[0,-.32,-.16],[0,-.19,-.05],[0,-.07,.035],[0,0,.04],[0,.07,.035],[0,.19,-.05],[0,.32,-.16],[0,.37,-.09]],        // recurvo élfico (S)
 2:[[0,-.37,-.12],[0,-.28,.0],[0,-.12,.05],[0,0,.04],[0,.12,.05],[0,.28,.0],[0,.37,-.12]],                                          // costillar tosco
 3:[[0,-.37,-.07],[0,-.26,.03],[0,-.1,.07],[0,0,.065],[0,.1,.07],[0,.26,.03],[0,.37,-.07]],                                         // compuesto de asta grueso
 4:[[0,-.37,-.07],[0,-.25,-.01],[0,0,.03],[0,.25,-.01],[0,.37,-.07]],                                                               // yumi recto y fino
 5:[[0,-.37,-.1],[0,-.26,-.0],[0,-.1,.05],[0,0,.04],[0,.1,.05],[0,.26,-.0],[0,.37,-.1]],                                            // forjado de hierro
 6:[[0,-.37,-.11],[0,-.3,-.03],[0,-.14,.05],[0,0,.03],[0,.14,.05],[0,.3,-.03],[0,.37,-.11]],                                        // columna de hueso
 7:[[0,-.37,-.17],[0,-.3,-.07],[0,-.14,.05],[0,-.05,.06],[0,.05,.06],[0,.14,.05],[0,.3,-.07],[0,.37,-.17]],                         // compuesto escita (doble curva)
 8:[[0,-.37,-.08],[0,-.25,-.0],[0,0,.04],[0,.25,-.0],[0,.37,-.08]],                                                                 // arco corto de marinero
 9:[[0,-.37,-.1],[0,-.26,-.02],[0,-.1,.04],[0,0,.04],[0,.1,.04],[0,.26,-.02],[0,.37,-.1]],                                          // marfil con alas
 10:[[0,-.37,-.13],[0,-.3,-.06],[0,-.16,.03],[0,0,.05],[0,.16,.03],[0,.3,-.06],[0,.37,-.13]]};                                      // cuernos
const BR={1:.012,2:.022,3:.027,4:.012,5:.02,6:.016,7:.017,8:.019,9:.015,10:.022};
const BC={1:'#9a7a40',2:'#8a7a5a',3:'#e8e2d2',4:'#8a7a3a',5:'#3a3a40',6:'#e8e0c0',7:'#7a4a24',8:'#7a5030',9:'#f2efe6',10:'#14101a'};
function bow(p,g,o,cu){const col=o.col||'#7a5030',T=BT[cu];if(!T)return null;const c=mixc(col,BC[cu],.62);p(tube(T,BR[cu],24),c,0,0,0,{p:g,ink:.008});
 const grip=(col2,h=.1,r=.024)=>p(cyl(r,r,h,8),col2,0,0,.03,{p:g,ink:.008});
 if(cu===1){grip('#4a6a2a');[-1,1].forEach(s=>{p(sph(.022,1,.5,1.8),'#7ab04a',0,.34*s,-.13,{p:g,ink:.005,rx:s*.6});p(cone(.012,.07,4).rotateX(-PI/2),'#7ab04a',0,.375*s,-.15,{p:g,ink:.004});p(sph(.016,1,.5,1.4),'#5a8a3a',0,.22*s,-.04,{p:g,ink:.004});p(tor(.016,.004,8,4).rotateX(PI/2),'#4a6a2a',0,.12*s,.02,{p:g,ink:0})})}
 if(cu===2){grip('#6a5a3a',.12,.026);[-1,1].forEach(s=>{for(let i=0;i<4;i++)p(tor(.024,.004,8,4).rotateX(PI/2),'#c8483a',0,s*(.16+i*.045),.035-Math.abs(.16+i*.045)*.06,{p:g,ink:0});p(sph(.022,1,1.1,.95),BONE,0,.33*s,-.07,{p:g,ink:.006});p(cone(.01,.05,4),BONE,0,.35*s,-.09,{p:g,ink:.004,rx:s*1.2})});p(sph(.026,1,1.1,.95),BONE,.0,0,.06,{p:g,ink:.007})}
 if(cu===3){grip('#8a7a5a',.12,.028);[-1,1].forEach(s=>{p(tube([[0,.31*s,-.04],[.02,.35*s,-.11],[.045,.34*s,-.17],[.05,.3*s,-.2]],.016,10),'#f4f0e0',0,0,0,{p:g,ink:.007});for(let i=0;i<5;i++)p(sph(.017,1,1.3,1),'#e6e0d2',0,s*(.03+i*.014),.085,{p:g,ink:0})});p(tor(.03,.008,8,4).rotateX(PI/2),'#c9c2b0',0,.14,.06,{p:g,ink:0});p(tor(.03,.008,8,4).rotateX(PI/2),'#c9c2b0',0,-.14,.06,{p:g,ink:0})}
 if(cu===4){grip('#1a1418',.16,.02);[-.3,-.22,-.14,.14,.22,.3].forEach(y=>p(tor(.015,.0045,8,4).rotateX(PI/2),'#3a2a1a',0,y,Math.max(0,.03-Math.abs(y)*.14),{p:g,ink:0}));[-.18,.18].forEach(y=>p(tor(.017,.006,8,4).rotateX(PI/2),'#b01f1c',0,y,.015,{p:g,ink:0}));[-1,1].forEach(s=>p(cyl(.008,.008,.045,6),'#1a1418',0,.375*s,-.09,{p:g,ink:.004}))}
 if(cu===5){grip('#241c20',.12,.03);[-1,1].forEach(s=>{[.12,.2,.28].forEach((y,i)=>p(box(.05,.03,.045),'#241c20',0,y*s,.04-y*.1,{p:g,ink:.007}));[.16,.24,.32].forEach(y=>p(sph(.011),FIRE,0,y*s,.045-y*.1,{p:g,ink:0,mat:glow(FIRE,1.8)}));p(cone(.014,.08,4).rotateX(-PI/2),'#241c20',0,.385*s,-.12,{p:g,ink:.006})})}
 if(cu===6){grip('#3a3048',.12,.024);[-1,1].forEach(s=>{for(let i=0;i<3;i++){const y=(.1+i*.09)*s,z=.045-i*.025;p(tor(.04-i*.006,.006,12,4,PI).rotateZ(i%2?PI:0).rotateY(PI/2),BONE,0,y,z,{p:g,ink:.004})}p(cone(.012,.08,4).rotateX(-PI/2),BONE,0,.38*s,-.14,{p:g,ink:.005});p(sph(.014),RUNE,0,.3*s,-.02,{p:g,ink:0,mat:glow(RUNE,1.8)})})}
 if(cu===7){grip('#2a1c10',.11,.022);[-1,1].forEach(s=>{p(cone(.016,.07,6).rotateX(-PI/2),GILD,0,.385*s,-.19,{p:g,ink:.005});p(tor(.02,.006,8,4).rotateX(PI/2),GILD,0,.3*s,-.1,{p:g,ink:0});p(tor(.018,.005,8,4).rotateX(PI/2),GILD,0,.12*s,.06,{p:g,ink:0});p(cyl(.004,.004,.1,4),'#c8483a',.0,.33*s,-.2,{p:g,ink:0,rx:.3})})}
 if(cu===8){grip('#3a2a1e',.11,.022);[-1,1].forEach(s=>{for(let i=0;i<3;i++)p(tor(.017,.0045,8,4).rotateX(PI/2),ROPE,0,s*(.1+i*.035),.034,{p:g,ink:0});p(sph(.018,1,1.2,.8),'#b8a070',0,.35*s,-.095,{p:g,ink:.004});p(tor(.014,.004,8,4),'#c8a040',0,.3*s,-.03,{p:g,ink:0})});p(tor(.02,.006,8,4).rotateX(PI/2),'#c8a040',0,0,.05,{p:g,ink:0})}
 if(cu===9){grip(GILD,.1,.022);[-1,1].forEach(s=>{for(let i=0;i<5;i++)p(box(.012,.07-i*.008,.004),MARB,(i-2)*.01,.14*s+i*.045*s,.06-i*.012,{p:g,ink:0,rz:(i-2)*.14,rx:s*.2});p(tor(.018,.005,8,4).rotateX(PI/2),GILD,0,.34*s,-.07,{p:g,ink:0});p(sph(.014),CELE,0,.38*s,-.1,{p:g,ink:0,mat:glow(CELE,1.6)})})}
 if(cu===10){grip(NIGHT,.12,.026);[-1,1].forEach(s=>{p(cone(.02,.14,5).rotateX(-PI/2),NIGHT,0,.4*s,-.17,{p:g,ink:.006});for(let i=0;i<3;i++)p(cone(.011,.05,4).rotateZ(-s*PI/2),NIGHT,.02,(.14+i*.08)*s,.03-i*.012,{p:g,ink:.004});p(sph(.012),EMBER,0,.33*s,-.05,{p:g,ink:0,mat:glow(EMBER,2)})});p(tor(.03,.006,10,4).rotateX(PI/2),CHAIN,0,.1,.05,{p:g,ink:0})}
 return{tipA:new V3(0,.37,-.09),tipB:new V3(0,-.37,-.09),rest:new V3(0,0,-.09)}}

// ───────────── PÁRAMO (6) · DESIERTO (7) · COSTA (8): el resto de armas ─────────────
function sword(p,g,o,cu){const L=o.len||.5,w=(o.wid||.05)/2,col=o.col||'#cfd4dc',gw=o.gw||1;let tip;
 const grip=(c,len=.13,y=-.005,r=.021)=>p(cyl(r,r*.9,len,6),c,0,y,0,{p:g,ink:.009});
 if(cu===6){grip('#3a3048');p(sph(.03),BONE,0,-.08,0,{p:g,ink:.008});p(box(.14*gw,.024,.04),BONE,0,.08,0,{p:g,ink:.008});[-1,1].forEach(s=>{p(cone(.016,.07,4),BONE,s*.08*gw,.115,0,{p:g,ink:.005,rz:-s*.3});p(sph(.014),RUNE,s*.05*gw,.08,.03,{p:g,ink:0,mat:glow(RUNE,1.6)})});   // PÁRAMO: hoja de hueso rota con runas
  p(blade(L*.95,t=>w*(1.15+.35*Math.sin(t*14)*(1-t))*(t<.9?1:(1-t)*10),t=>.012*Math.sin(t*5)),mixc(col,BONE,.7),0,0,0,{p:g,ink:.01,...RIM});[.2,.4,.6].forEach(t=>p(box(w*.9,.014,.026),RUNE,0,.09+L*t,0,{p:g,ink:0,mat:glow(RUNE,1.6)}));tip=.09+L*.95+w}
 else if(cu===7){grip('#2a1c10',.14);p(sph(.03),GILD,0,-.085,0,{p:g,ink:.008});p(box(.12*gw,.02,.03),GILD,0,.085,0,{p:g,ink:.007});[-1,1].forEach(s=>p(sph(.016),'#c8483a',s*.065*gw,.085,0,{p:g,ink:0}));   // DESIERTO: cimitarra curva, filo dorado
  p(blade(L*1.05,t=>w*(1.2+.45*Math.sin(PI*t*.9))*(t<.88?1:(1-t)*8),t=>.12*t*t,.016),mixc(col,'#f4ecd0',.35),0,0,0,{p:g,ink:.01,...RIM});fuller(p,g,L*1.05,t=>.12*t*t,.09,.12,L*.8,w*.14,GILD);tip=.09+L*1.05+.1}
 else{grip('#3a2a1e');p(sph(.026),'#c8c8d0',0,-.08,0,{p:g,ink:.007});   // COSTA: sable de abordaje con guardamano de concha
  p(cyl(.07,.07,.016,14).rotateX(PI/2).scale(1,1,1),'#8a8a92',0,.082,0,{p:g,ink:.008});p(tor(.07,.008,14,4).rotateX(PI/2),'#c8a040',0,.082,0,{p:g,ink:0});p(box(.012,.02,.14),'#8a8a92',-.05,.06,0,{p:g,ink:.006});p(tor(.045,.007,10,4,PI).rotateZ(-PI/2),'#8a8a92',-.01,.0,0,{p:g,ink:.005});
  p(blade(L*1.02,t=>w*1.15*(t<.55?1:1-(t-.55)*.6)*(t<.9?1:(1-t)*10)+.001,t=>.07*t*t,.014),col,0,0,0,{p:g,ink:.01,...RIM});fuller(p,g,L*1.02,t=>.07*t*t,.09,.1,L*.7,w*.12,shade(col,.7),.02);tip=.09+L*1.02+.06}
 return{tip:new V3(0,tip,0)}}
function great(p,g,o,cu){const L=.86,w=.075/2,col=o.col||'#cfd4dc';let tip=1.05;
 const handle=(c,r=.022)=>p(cyl(r,r*.93,.28,6),c,0,-.06,0,{p:g,ink:.01});
 if(cu===6){handle('#3a3048');p(sph(.045),BONE,0,-.21,0,{p:g,ink:.009});p(box(.3,.035,.055),BONE,0,.1,0,{p:g,ink:.01});   // PÁRAMO: espadón de ruina con esquirlas flotantes
  p(blade(L,t=>w*(1.3+.4*Math.sin(t*10))*(t<.9?1:(1-t)*10),t=>.02*Math.sin(t*4),.022,.12,28),mixc(col,'#6a6478',.55),0,0,0,{p:g,ink:.012,...RIM});[.25,.5,.75].forEach(t=>p(box(w*1.1,.016,.03),RUNE,0,.12+L*t,0,{p:g,ink:0,mat:glow(RUNE,1.8)}));
  [[.12,.55],[-.13,.7],[.1,.88]].forEach(([x,y],i)=>p(cone(.018,.07,4),RUNE,x,y,.02,{p:g,ink:0,rz:i*1.1,mat:glow(RUNE,1.4)}))}
 else if(cu===7){handle('#2a1c10');p(sph(.045),GILD,0,-.21,0,{p:g,ink:.009});p(box(.26,.03,.05),GILD,0,.1,0,{p:g,ink:.01});   // DESIERTO: jopesh (espada curva en hoz)
  p(blade(L,t=>w*(1.1+.5*Math.sin(PI*t*.8))*(t<.9?1:(1-t)*10),t=>.26*t*t*t,.022,.12,28),mixc(col,'#f4ecd0',.35),0,0,0,{p:g,ink:.012,...RIM});fuller(p,g,L,t=>.26*t*t*t,.12,.13,L*.7,w*.14,GILD,.03);tip=.9}
 else{handle('#3a2a1e');p(tor(.05,.01,12,5).rotateX(PI/2),'#c8a040',0,-.21,0,{p:g,ink:.008});p(box(.2,.036,.05),'#8a8a92',0,.1,0,{p:g,ink:.01});[-1,1].forEach(s=>p(cone(.03,.12,4),'#8a8a92',.12*s,.08,0,{p:g,ink:.007,rz:s*PI*.8}));   // COSTA: sable largo con ancla en el pomo
  p(blade(L,t=>w*1.2*(t<.6?1:1-(t-.6)*.6)*(t<.92?1:(1-t)*12)+.001,t=>.1*t*t,.02,.12,24),col,0,0,0,{p:g,ink:.012,...RIM});fuller(p,g,L,t=>.1*t*t,.12,.13,L*.75,w*.12,shade(col,.65),.028)}
 return{tip:new V3(0,tip,0)}}
function staff(p,g,o,cu){const col=o.col||'#9cf';const shaft=(c,r=.019)=>p(cyl(r,r*1.25,1.42,6).translate(0,.25,0),c,0,0,0,{p:g,ink:.011});let orb;
 const mkOrb=(c,r=.065,y=1.04)=>p(sph(r),c,0,y,0,{p:g,ink:0,mat:glow(c,2)});p(cyl(.026,.026,.12,8),LEATH,0,0,0,{p:g,ink:.009});
 if(cu===6){shaft('#e8e0c0');for(let i=0;i<5;i++)p(sph(.026,1,.7,1),BONE,0,.2+i*.12,0,{p:g,ink:.005});   // PÁRAMO: columna de huesos con piedras-runa en órbita
  for(let i=0;i<3;i++){const a=i/3*TAU;p(box(.04,.07,.02),'#3a3048',Math.cos(a)*.1,.98+Math.sin(a*2)*.04,Math.sin(a)*.1,{p:g,ink:.005,ry:a});p(box(.014,.04,.024),RUNE,Math.cos(a)*.1,.98+Math.sin(a*2)*.04,Math.sin(a)*.1,{p:g,ink:0,ry:a,mat:glow(RUNE,1.6)})}orb=mkOrb(RUNE,.06,1.02)}
 else if(cu===7){shaft('#7a4a24');p(tor(.075,.012,12,5),GILD,0,1.0,0,{p:g,ink:.008});p(tor(.05,.01,10,5),GILD,0,.9,0,{p:g,ink:.007});p(box(.014,.14,.014),GILD,0,.84,0,{p:g,ink:.006});p(cyl(.04,.04,.01,12).rotateX(PI/2),GILD,0,1.0,-.03,{p:g,ink:.005});   // DESIERTO: anj con disco solar
  for(let i=0;i<8;i++){const a=i/8*TAU;p(cone(.012,.06,4),GILD,Math.cos(a)*.1,1.0+Math.sin(a)*.1,0,{p:g,ink:.004,rz:a-PI/2})}orb=mkOrb(FIRE,.05,1.0)}
 else{shaft('#6a5a4a');for(let i=0;i<7;i++)p(tor(.028,.005,8,4).rotateX(PI/2),ROPE,0,.3+i*.05,0,{p:g,ink:0});p(cone(.03,.16,4),'#5a6a7a',-.07,.95,0,{p:g,ink:.007,rz:.7});p(cone(.03,.16,4),'#5a6a7a',.07,.95,0,{p:g,ink:.007,rz:-.7});p(tor(.075,.012,12,5).rotateX(PI/2),'#8a8a92',0,.9,0,{p:g,ink:.007});orb=mkOrb(CELE,.06,1.04)}   // COSTA: madera de deriva con anclas y orbe de vidrio marino
 return{tip:new V3(0,1.04,0),orb}}
function scepter(p,g,o,cu){const orb=(c,y=.47,r=.045)=>p(sph(r),c,0,y,0,{p:g,ink:0,mat:glow(c,1.8)});let ob;
 if(cu===6){p(cyl(.018,.022,.57,6).translate(0,.155,0),BONE,0,0,0,{p:g,ink:.009});p(sph(.04,1,1.1,.95),BONE,0,.42,0,{p:g,ink:.007});[-1,1].forEach(s=>p(sph(.011,1,1,.6),RUNE,.015*s,.425,.034,{p:g,ink:0,mat:glow(RUNE,1.8)}));ob=orb(RUNE,.5,.03)}
 else if(cu===7){p(cyl(.018,.022,.57,6).translate(0,.155,0),GILD,0,0,0,{p:g,ink:.009});p(tor(.04,.01,10,4),GILD,0,.45,0,{p:g,ink:.007});p(box(.012,.1,.012),GILD,0,.37,0,{p:g,ink:.005});ob=orb(FIRE,.45,.03)}
 else{p(cyl(.018,.022,.57,6).translate(0,.155,0),'#6a5a4a',0,0,0,{p:g,ink:.009});for(let i=0;i<5;i++){const a=i/5*TAU;p(cone(.012,.1,4),'#e0786a',Math.cos(a)*.03,.44,Math.sin(a)*.03,{p:g,ink:.005,rz:-Math.cos(a)*.5,rx:Math.sin(a)*.5})}ob=orb(CELE)}
 return{tip:new V3(0,.47,0),orb:ob}}
function xbow(p,g,o,cu){const col=o.col||'#8a8e96';let st=WOOD,dk=DWOOD,lim=col;
 if(cu===6){st='#3a3048';dk='#241c30';lim=mixc(col,BONE,.6)}else if(cu===7){st='#7a4a24';dk='#4a2a14';lim=mixc(col,GILD,.5)}else{st='#6a4a2a';dk='#3a2a1a';lim=mixc(col,'#8a8a92',.5)}
 p(box(.045,.5,.055).translate(0,.11,.05),st,0,0,0,{p:g,ink:.01});p(box(.06,.08,.09).translate(0,-.14,.03),dk,0,0,0,{p:g,ink:.008});p(tube([[-.24,.29,.06],[-.12,.335,.06],[0,.35,.06],[.12,.335,.06],[.24,.29,.06]],.014,12),lim,0,0,0,{p:g,ink:.008});
 if(cu===6)[-1,1].forEach(s=>{p(cone(.014,.08,4),BONE,s*.24,.3,.06,{p:g,ink:.005,rz:-s*.5});p(sph(.014),RUNE,0,.12+.05*s,.085,{p:g,ink:0,mat:glow(RUNE,1.6)})});
 if(cu===7)[-1,1].forEach(s=>{p(cone(.016,.06,5),GILD,s*.25,.28,.06,{p:g,ink:.005,rz:-s*PI/2});p(tor(.026,.006,8,4).rotateX(PI/2),GILD,0,.1+.1*(s+1)/2,.05,{p:g,ink:0})});
 if(cu===8){[0,1,2].forEach(i=>p(tor(.03,.005,8,4).rotateY(PI/2),ROPE,0,.0+i*.06,.05,{p:g,ink:0}));p(cyl(.02,.02,.012,10).rotateX(PI/2),'#c8a040',0,.28,.085,{p:g,ink:0})}
 return{tipA:new V3(-.24,.29,.06),tipB:new V3(.24,.29,.06),nutY:.12,relY:.32}}
function mace(p,g,o,cu){const col=o.col||'#8a8e96';p(cyl(.019,.022,.36,6).translate(0,.1,0),cu===6?'#e8e0c0':cu===7?'#7a4a24':'#5a3e2c',0,0,0,{p:g,ink:.009});
 if(cu===6){p(sph(.06,1,1.1,.95),BONE,0,.3,0,{p:g,ink:.01});[-1,1].forEach(s=>p(sph(.012,1,1,.6),'#1a1410',.022*s,.315,.05,{p:g,ink:0}));for(let i=0;i<6;i++){const a=i/6*TAU;p(cone(.014,.06,4).rotateZ(-PI/2).rotateY(-a),BONE,Math.cos(a)*.065,.28,Math.sin(a)*.065,{p:g,ink:.005})}p(sph(.014),RUNE,0,.3,.06,{p:g,ink:0,mat:glow(RUNE,1.8)})}   // calavera con púas
 else if(cu===7){p(sph(.055,1,1.5,1),GILD,0,.3,0,{p:g,ink:.01,...RIM});p(tor(.052,.007,12,4).rotateX(PI/2),'#7a4a24',0,.3,0,{p:g,ink:0});p(sph(.014),'#c8483a',0,.38,0,{p:g,ink:0})}   // maza piriforme
 else{p(cyl(.034,.03,.2,8).translate(0,.28,0),'#6a4a2a',0,0,0,{p:g,ink:.01});[.2,.3,.38].forEach(y=>p(tor(.036,.006,10,4).rotateX(PI/2),'#8a8a92',0,y,0,{p:g,ink:0}));p(sph(.032),'#c8a040',0,.4,0,{p:g,ink:.007});for(let i=0;i<3;i++)p(tor(.04,.005,8,4).rotateX(PI/2),ROPE,0,.02+i*.02,0,{p:g,ink:0})}   // cabo de maniobra
 return{tip:new V3(0,.34,0)}}

const K={sword,dagger:(p,g,o,cu)=>sword(p,g,Object.assign({},o,{len:.24,wid:.038,gw:.55}),cu),great,staff,scepter,xbow,mace,bow,hatchet,greataxe};
// cultura 6–8: todo el set; hachas: 0–10; arcos: 1–10
export function ext(kind,p,g,o,cu){const f=K[kind];if(!f)return null;
 if(kind==='hatchet'||kind==='greataxe')return f(p,g,o,cu);
 if(kind==='bow')return BT[cu]?f(p,g,o,cu):null;
 if(cu>=6&&cu<=8)return f(p,g,o,cu);return null}
