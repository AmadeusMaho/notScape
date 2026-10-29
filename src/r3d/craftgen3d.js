// NotScape · R3D · Lote OFICIOS-D4 (25 oct 2026) · ICONOS 3D PARAMÉTRICOS de los objetos de OFICIO (herramientas, ropa de oficio, intermedios), por categoría y color de tier.
// Misma firma que GEN/GEN2: fn(p, g, c, o) con p = pieza (geo,col,x,y,z,{p,ink,t,mat}), g = grupo, c = color del TIER (o del material), o = opciones.
// Tamaño ≈ .5 unidades. REGLA: gira la GEOMETRÍA (geo.rotateZ…), nunca el mesh, o el contorno (hull) no la sigue. Se mezclan en GEN2/POSE2/DPOSE2 (itemgen3d.js), así que
// valen para los iconos de inventario (icons3d.js) y para los objetos del suelo (drops3d.js). Mapeo id → kind en item-icons.js (`CRAFT`). Convenciones de ids: REGLAS_CREACION §13.
// AÑADIR una categoría: función aquí + POSE3/DPOSE3 + SIZE3 (tamaño en el suelo) + su prefijo en `CRAFT` de item-icons.js + una fila en `tools/r3d/icons_craft_ids.txt`.
import * as THREE from 'three';
import {glow,jit} from './materials3d.js';

const PI=Math.PI;
const shade=(c,k)=>'#'+new THREE.Color(c).multiplyScalar(k).getHexString(),mixc=(a,b,t)=>'#'+new THREE.Color(a).lerp(new THREE.Color(b),t).getHexString();
const sph=(r,x=1,y=1,z=1,n=12)=>new THREE.SphereGeometry(r,n,Math.max(6,n-4)).scale(x,y,z),cyl=(a,b,h,n=10)=>new THREE.CylinderGeometry(a,b,h,n),box=(x,y,z)=>new THREE.BoxGeometry(x,y,z);
const flat=g=>{const n=g.index?g.toNonIndexed():g;n.computeVertexNormals();return n};
const cc=(c,d)=>(typeof c==='string'&&c[0]==='#')?c:d;
const WOOD='#6a4a30',LEATH='#5a4030',IRON='#7a7a84';

export const GEN3={
 // ── herramientas de oficio (la cabeza lleva el color del tier; el mango, madera) ──
 hammer(p,g,c){c=cc(c,IRON);p(cyl(.026,.032,.5,8),WOOD,0,-.02,0,{p:g,ink:.012});p(cyl(.036,.036,.07,8),shade(WOOD,.7),0,-.24,0,{p:g,ink:.008});
  p(box(.25,.13,.13),c,0,.2,0,{p:g,ink:.014,t:{rim:2}});p(flat(new THREE.ConeGeometry(.065,.1,4).rotateZ(-PI/2).translate(.175,.2,0)),shade(c,.85),0,0,0,{p:g,ink:.01});
  p(box(.02,.134,.134),mixc(c,'#ffffff',.3),-.115,.2,0,{p:g,ink:0})},
 tongs(p,g,c){c=cc(c,IRON);for(const s of[-1,1]){p(box(.035,.5,.03).rotateZ(s*.07).translate(s*.04,-.02,0),c,0,0,0,{p:g,ink:.01});
   p(box(.035,.2,.03).rotateZ(-s*.28).translate(s*.012,.3,0),shade(c,.85),0,0,0,{p:g,ink:.01});p(sph(.03,1,1.6,1),WOOD,s*.075,-.26,0,{p:g,ink:.008})}
  p(cyl(.032,.032,.05,8).rotateX(PI/2),shade(c,.6),0,.02,0,{p:g,ink:.008})},
 knife(p,g,c){c=cc(c,'#cfd8e0');p(flat(new THREE.CylinderGeometry(.0,.05,.34,4,1).scale(1,1,.2).translate(0,.2,0)),c,0,0,0,{p:g,ink:.012,t:{rim:2}});
  p(box(.012,.3,.02),mixc(c,'#ffffff',.5),.0,.2,.012,{p:g,ink:0});p(box(.13,.025,.04),shade(c,.7),0,.02,0,{p:g,ink:.008});p(cyl(.026,.03,.2,8),WOOD,0,-.1,0,{p:g,ink:.012});p(sph(.034),shade(c,.7),0,-.21,0,{p:g,ink:.008})},
 chisel(p,g,c){c=cc(c,IRON);p(cyl(.022,.022,.34,6),c,0,.12,0,{p:g,ink:.01,t:{rim:2}});p(flat(new THREE.CylinderGeometry(.03,.012,.1,4).scale(1,1,.35).translate(0,.34,0)),mixc(c,'#ffffff',.3),0,0,0,{p:g,ink:.008});
  p(cyl(.045,.032,.22,8),WOOD,0,-.16,0,{p:g,ink:.012});p(cyl(.048,.048,.025,8),shade(c,.6),0,-.05,0,{p:g,ink:0})},
 saw(p,g,c){c=cc(c,IRON);const sh=new THREE.Shape();sh.moveTo(-.26,.05);for(let i=0;i<10;i++){sh.lineTo(-.26+i*.052+.026,.0);sh.lineTo(-.26+(i+1)*.052,.05)}sh.lineTo(.26,.13);sh.lineTo(-.26,.13);
  p(new THREE.ExtrudeGeometry(sh,{depth:.012,bevelEnabled:false}).translate(0,-.02,-.006),c,0,0,0,{p:g,ink:.01,t:{rim:2}});
  p(box(.07,.14,.04),WOOD,.3,.04,0,{p:g,ink:.012});p(box(.025,.05,.045),shade(c,.6),.26,.075,0,{p:g,ink:0})},
 needle(p,g,c){c=cc(c,'#cfd8e0');p(cyl(.012,.004,.5,5),c,0,0,0,{p:g,ink:.008,t:{rim:2}});p(new THREE.TorusGeometry(.03,.007,5,10).translate(0,.22,0),shade(c,.7),0,0,0,{p:g,ink:0});
  p(new THREE.TorusGeometry(.18,.006,4,18,PI*1.4).rotateZ(.4).translate(-.04,.05,0),'#d8c8a0',0,0,0,{p:g,ink:0})},
 // ── ropa de oficio (cuero teñido con un toque del tier) ──
 cap(p,g,c){const k=mixc(LEATH,cc(c,IRON),.3);p(sph(.21,1,.8,1).translate(0,.06,0),k,0,0,0,{p:g,ink:.014,t:{rim:1.6}});
  p(new THREE.TorusGeometry(.21,.035,6,18).rotateX(PI/2).translate(0,-.06,0),shade(k,.75),0,0,0,{p:g,ink:.01});p(box(.14,.05,.12).translate(0,-.05,.2),shade(k,.7),0,0,0,{p:g,ink:.008});
  p(cyl(.012,.012,.12,5),cc(c,IRON),0,.28,0,{p:g,ink:0})},
 apron(p,g,c){const k=mixc(LEATH,cc(c,IRON),.25);p(box(.38,.42,.03).translate(0,-.1,0),k,0,0,0,{p:g,ink:.014,t:{rim:1.6}});p(box(.22,.2,.03).translate(0,.2,0),shade(k,1.08),0,0,0,{p:g,ink:.012});
  p(new THREE.TorusGeometry(.14,.012,5,14,PI).translate(0,.28,0),shade(k,.6),0,0,0,{p:g,ink:0});p(box(.16,.12,.02),shade(k,.8),0,-.18,.025,{p:g,ink:.008});
  [-1,1].forEach(s=>p(cyl(.012,.012,.026,6).rotateX(PI/2),cc(c,IRON),s*.07,-.12,.04,{p:g,ink:0}))},
 oglove(p,g,c){const k=mixc(LEATH,cc(c,IRON),.25);p(box(.2,.2,.07).translate(0,.02,0),k,0,0,0,{p:g,ink:.014,t:{rim:1.6}});
  for(let i=0;i<4;i++)p(cyl(.026,.022,.17,6).translate(-.075+i*.05,.21,0),shade(k,1.05),0,0,0,{p:g,ink:.01});
  p(cyl(.026,.024,.14,6).rotateZ(-.9).translate(.15,.04,0),shade(k,1.05),0,0,0,{p:g,ink:.01});p(cyl(.13,.115,.14,10).scale(1,1,.55).translate(0,-.13,0),shade(k,.8),0,0,0,{p:g,ink:.012})},
 // ── intermedios ──
 plank(p,g,c){c=cc(c,'#a0703a');for(let i=0;i<3;i++){p(box(.46,.05,.14).rotateY((i-1)*.05).translate(0,i*.052,(i-1)*.02),shade(c,.92+i*.07),0,0,0,{p:g,ink:.012});
   p(box(.4,.006,.01).translate(.02,i*.052+.027,(i-1)*.02),shade(c,.7),0,0,0,{p:g,ink:0});p(box(.4,.006,.01).translate(-.02,i*.052+.027,(i-1)*.02+.04),shade(c,.7),0,0,0,{p:g,ink:0})}},
 leather(p,g,c){c=cc(c,'#9a6a34');p(box(.42,.05,.34).translate(0,0,0),c,0,0,0,{p:g,ink:.013});p(new THREE.TorusGeometry(.12,.04,5,10).rotateY(PI/2).translate(-.22,.07,0),shade(c,.82),0,0,0,{p:g,ink:.01});
  for(let i=0;i<6;i++)p(box(.02,.008,.012),'#e8d8b0',-.18+i*.07,.03,.15,{p:g,ink:0})},
 thread(p,g,c){c=cc(c,'#cdbfe8');for(let i=0;i<4;i++)p(new THREE.TorusGeometry(.15-i*.002,.045,6,18).rotateX(PI/2).rotateY(i*.35).translate(0,i*.03-.04,0),mixc(c,'#ffffff',i*.05),0,0,0,{p:g,ink:.01});
  p(new THREE.TorusGeometry(.17,.015,5,14).rotateX(PI/2).translate(0,.04,0),shade(c,.6),0,0,0,{p:g,ink:0})},
 fiber(p,g,c){c=cc(c,'#b8c878');for(let i=0;i<7;i++){const a=i*.9;p(new THREE.CylinderGeometry(.012,.01,.5,5).rotateZ((i-3)*.05).rotateY(a).translate(Math.cos(a)*.04,0,Math.sin(a)*.04),mixc(c,'#ffffff',(i%3)*.1),0,0,0,{p:g,ink:.006})}
  p(cyl(.07,.07,.04,8),'#c8a060',0,0,0,{p:g,ink:.008})},
 column(p,g,c){c=cc(c,'#d8d0c0');p(box(.2,.04,.2),shade(c,.85),0,-.2,0,{p:g,ink:.012});p(cyl(.06,.065,.36,10),c,0,-.01,0,{p:g,ink:.012});p(box(.19,.04,.19),shade(c,1.1),0,.19,0,{p:g,ink:.012})},   // ESC-JOY: columna
 statue(p,g,c){c=cc(c,'#d8d0c0');p(box(.2,.05,.16),shade(c,.85),0,-.2,0,{p:g,ink:.012});p(jit(cyl(.06,.085,.24,8),.01),c,0,-.05,0,{p:g,ink:.012});p(jit(new THREE.IcosahedronGeometry(.06,0),.006),shade(c,1.08),0,.13,0,{p:g,ink:.012})},   // ESC-JOY: estatuilla
 stoneblk(p,g,c){c=cc(c,'#9a958d');p(jit(box(.36,.26,.28),.02),c,0,0,0,{p:g,ink:.014});p(box(.2,.01,.14),mixc(c,'#ffffff',.25),-.05,.135,.03,{p:g,ink:0})},
 brick(p,g,c){c=cc(c,'#a8583a');[[0,0,0],[.015,.075,0],[-.1,.075,.0]].forEach(([x,y,z],i)=>{if(i===2)return;p(jit(box(.3,.07,.14),.008),shade(c,.9+i*.1),x,y,z,{p:g,ink:.012})});p(jit(box(.3,.07,.14),.008),shade(c,1.05),-.04,.15,0,{p:g,ink:.012})},
 blade(p,g,c){c=cc(c,'#cfd8e0');const sh=new THREE.Shape();sh.moveTo(-.06,-.25);sh.lineTo(.06,-.25);sh.lineTo(.06,.18);sh.lineTo(0,.3);sh.lineTo(-.06,.18);
  p(new THREE.ExtrudeGeometry(sh,{depth:.02,bevelEnabled:false}).translate(0,0,-.01),c,0,0,0,{p:g,ink:.013,t:{rim:2}});p(box(.014,.4,.024),mixc(c,'#ffffff',.5),0,-.02,0,{p:g,ink:0})},
 fitting(p,g,c){c=cc(c,IRON);p(box(.34,.06,.05).translate(0,.09,0),c,0,0,0,{p:g,ink:.012,t:{rim:2}});p(box(.06,.3,.05).translate(-.14,-.06,0),c,0,0,0,{p:g,ink:.012});
  [[-.14,-.14],[-.14,.09],[.12,.09]].forEach(([x,y])=>p(cyl(.022,.022,.02,8).rotateX(PI/2),shade(c,.6),x,y,.03,{p:g,ink:0}))},
 handle(p,g,c){c=cc(c,'#8a5a30');const pr=[[0,0],[.045,0],[.05,.05],[.032,.14],[.032,.3],[.045,.36],[.05,.44],[0,.46]].map(a=>new THREE.Vector2(a[0],a[1]));
  p(new THREE.LatheGeometry(pr,10).translate(0,-.23,0),c,0,0,0,{p:g,ink:.012});p(cyl(.052,.052,.025,10),shade(c,.5),0,-.15,0,{p:g,ink:0})},

 // ── INGENIERÍA (29 oct 2026) ──
 spring(p,g,c){c=cc(c,IRON);for(let i=0;i<6;i++){p(new THREE.TorusGeometry(.115,.026,6,14).rotateX(PI/2),i%2?shade(c,.8):c,0,-.2+i*.075,0,{p:g,ink:.01,t:{rim:2}})}p(cyl(.1,.1,.03,12),shade(c,.7),0,-.235,0,{p:g,ink:.008});p(cyl(.1,.1,.03,12),shade(c,.7),0,.26,0,{p:g,ink:.008})},
 bomb(p,g,c,o){c=cc(c,'#ffcf6a');const k=1+.1*((o&&o.g)||0);p(sph(.2*k,1,1,1,14),'#2a2a30',0,-.02,0,{p:g,ink:.014,t:{rim:2}});p(new THREE.TorusGeometry(.2*k,.025,6,16).rotateX(PI/2),c,0,-.02,0,{p:g,ink:.008});
  p(cyl(.05,.065,.07,8),'#8a7a5a',0,.2*k,0,{p:g,ink:.01});p(cyl(.012,.012,.14,5).rotateZ(.5).translate(.04,.3*k,0),'#d8c8a0',0,0,0,{p:g,ink:.006});p(sph(.035),'#ffd890',.1,.37*k,0,{p:g,ink:0,mat:glow('#ffb040',1.8)});p(sph(.05,1,.6,.6),'#ffffff',-.08,.06,.15,{p:g,ink:0})},
 trap(p,g,c,o){c=cc(c,IRON);const k=1+.1*((o&&o.g)||0);p(cyl(.24*k,.26*k,.05,16),shade(c,.6),0,-.1,0,{p:g,ink:.012});p(new THREE.TorusGeometry(.2*k,.03,6,16).rotateX(PI/2),c,0,-.06,0,{p:g,ink:.01,t:{rim:2}});
  for(let i=0;i<8;i++){const a=i/8*PI*2;p(flat(new THREE.ConeGeometry(.03,.14,4).translate(Math.cos(a)*.2*k,.03,Math.sin(a)*.2*k)),'#dcd6c8',0,0,0,{p:g,ink:.006})}p(cyl(.05,.05,.04,8),'#2a2420',0,-.04,0,{p:g,ink:.006})},
 rig(p,g,c){c=cc(c,IRON);p(box(.34,.24,.24),c,0,-.04,0,{p:g,ink:.014,t:{rim:2}});for(let i=0;i<3;i++)p(cyl(.055,.055,.03,10).rotateX(PI/2),shade(c,.55),-.1+i*.1,-.03,.13,{p:g,ink:.007});p(cyl(.015,.015,.22,5).rotateZ(-.9).translate(.26,.12,0),'#4a4038',0,0,0,{p:g,ink:.007});p(sph(.04),c,.34,.2,0,{p:g,ink:.008})},
 lens(p,g,c,o){c=cc(c,'#b8873a');const gl=cc(o&&o.c,'#bfe8ff');p(new THREE.TorusGeometry(.26,.018,5,14,PI).rotateZ(PI).translate(0,.04,0),'#5a4030',0,0,0,{p:g,ink:.008});
  for(const sx of[-1,1]){p(cyl(.11,.11,.06,14).rotateX(PI/2),c,sx*.13,-.04,.04,{p:g,ink:.012,t:{rim:2}});p(cyl(.082,.082,.05,14).rotateX(PI/2),gl,sx*.13,-.04,.075,{p:g,ink:0,mat:glow(gl,.8)});p(cyl(.126,.126,.03,12).rotateX(PI/2),shade(c,.7),sx*.13,-.04,.02,{p:g,ink:0})}p(box(.07,.04,.04),c,0,-.03,.04,{p:g,ink:.007})},
 scope(p,g,c){c=cc(c,IRON);p(cyl(.045,.045,.46,10).rotateZ(PI/2),c,0,0,0,{p:g,ink:.012,t:{rim:2}});p(cyl(.06,.06,.08,10).rotateZ(PI/2),shade(c,.65),-.24,0,0,{p:g,ink:.01});p(cyl(.07,.07,.1,10).rotateZ(PI/2),shade(c,.65),.24,0,0,{p:g,ink:.01});
  p(sph(.04,.4,1,1),'#bfe8ff',-.285,0,0,{p:g,ink:0,mat:glow('#bfe8ff',.9)});p(sph(.05,.4,1,1),'#bfe8ff',.295,0,0,{p:g,ink:0,mat:glow('#bfe8ff',.9)});p(box(.14,.1,.05),shade(c,.5),0,-.08,0,{p:g,ink:.008})},
 gear(p,g,c){c=cc(c,IRON);p(cyl(.17,.17,.06,16).rotateX(PI/2),c,0,0,0,{p:g,ink:.013,t:{rim:2}});for(let i=0;i<10;i++){const a=i/10*PI*2;p(box(.07,.07,.06).rotateZ(a).translate(Math.cos(a)*.2,Math.sin(a)*.2,0),shade(c,.9),0,0,0,{p:g,ink:.008})}
  p(cyl(.05,.05,.07,10).rotateX(PI/2),shade(c,.4),0,0,0,{p:g,ink:0})},
 herb(p,g,c){c=cc(c,'#5aa048');for(let i=0;i<5;i++){const a=(i-2)*.28;p(new THREE.CylinderGeometry(.008,.012,.4,4).rotateZ(a).translate(Math.sin(a)*-.2,0,0),shade(c,.6),0,0,0,{p:g,ink:.006});
   p(flat(new THREE.IcosahedronGeometry(.07,0).scale(.6,1.5,.25)).rotateZ(a).translate(-Math.sin(a)*.4,.2+Math.cos(a)*.03,0),mixc(c,'#d8f08a',i*.08),0,0,0,{p:g,ink:.008})}}
};

export const POSE3={hammer:[0,-.5,-.7],tongs:[0,-.5,-.6],knife:[0,-.5,-.7],chisel:[0,-.5,-.7],saw:[0,-.4,-.35],needle:[0,-.3,-.7],cap:[.2,-.4,0],apron:[0,-.35,0],oglove:[0,-.4,0],
 plank:[.5,-.5,0],leather:[.5,-.4,0],thread:[.45,-.3,0],fiber:[0,-.4,.5],stoneblk:[.2,-.5,0],brick:[.25,-.5,0],column:[.1,-.4,0],statue:[.1,-.4,0],blade:[0,-.5,-.7],fitting:[0,-.4,0],handle:[0,-.4,-.7],gear:[.15,-.5,0],herb:[0,-.4,.25],spring:[.1,-.4,0],bomb:[.1,-.5,0],trap:[.5,-.5,0],rig:[.1,-.4,0],lens:[.5,-.4,0],scope:[0,-.4,0]};
export const DPOSE3={hammer:[0,0,PI/2],tongs:[0,0,PI/2],knife:[0,0,PI/2],chisel:[0,0,PI/2],saw:[PI/2,0,0],needle:[0,0,PI/2],cap:[0,0,0],apron:[PI/2,0,0],oglove:[PI/2,0,0],
 plank:[0,0,0],leather:[0,0,0],thread:[0,0,0],fiber:[0,0,PI/2],stoneblk:[0,0,0],brick:[0,0,0],column:[PI/2,0,0],statue:[PI/2,0,0],blade:[PI/2,0,0],fitting:[PI/2,0,0],handle:[0,0,PI/2],gear:[PI/2,0,0],herb:[0,0,PI/2],spring:[0,0,PI/2],bomb:[0,0,0],trap:[0,0,0],rig:[0,0,0],lens:[PI/2,0,0],scope:[0,0,0]};
// tamaño real en el suelo (drops3d.js, SIZE)
export const SIZE3={hammer:.4,tongs:.4,knife:.3,chisel:.3,saw:.45,needle:.25,cap:.28,apron:.34,oglove:.2,plank:.4,leather:.34,thread:.22,fiber:.3,stoneblk:.3,brick:.26,column:.34,statue:.3,blade:.36,fitting:.22,handle:.32,gear:.22,herb:.26,spring:.22,bomb:.24,trap:.3,rig:.3,lens:.3,scope:.34};
