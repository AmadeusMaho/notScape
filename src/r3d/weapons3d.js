// NotScape · R3D · ARMAS POR CULTURA (Lote R3D-CULTURAS, 18 oct 2026) — todo por código. Ver la tabla tier → cultura en armorcult3d.js.
// ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// `cultWeapon(kind, p, g, o)` devuelve lo MISMO que el constructor de BUILD (heroanim3d.js) para ese tipo, o null si esa cultura usa el arma base
// (Pradera = espada/mandoble/báculo/arco clásicos). o.cu = cultura 0-5 (gear.wp.cu), o.col = color del metal/madera del tier.
// MARCO (igual que BUILD): +y = hoja/mango desde el agarre, +x = filo, la guarda en y≈.075-.1; arco: palas a ±y, panza a +z, puntas (0,±.37,−.09);
// ballesta: +y hacia el objetivo, +z arriba. No cambies los puntos `tip/tipA/tipB/rest/nutY/relY/orb`: los usan las animaciones (cuerda, flecha, orbe).
// Tipos: sword · dagger · great · staff · scepter · bow · xbow · mace · hatchet · greataxe.
import * as THREE from 'three';
import {glow} from './materials3d.js';
import {shp} from './armorcult3d.js';

const V3=THREE.Vector3,PI=Math.PI,TAU=PI*2;
const sph=(r,x=1,y=1,z=1)=>new THREE.SphereGeometry(r,12,9).scale(x,y,z),cyl=(a,b,h,n=8)=>new THREE.CylinderGeometry(a,b,h,n),box=(x,y,z)=>new THREE.BoxGeometry(x,y,z),cone=(r,h,n=5)=>new THREE.ConeGeometry(r,h,n);
const tor=(R,r,n=18,s=6)=>new THREE.TorusGeometry(R,r,s,n);
const shade=(c,k)=>'#'+new THREE.Color(c).multiplyScalar(k).getHexString(),mixc=(a,b,t)=>'#'+new THREE.Color(a).lerp(new THREE.Color(b),t).getHexString();
const tube=(pts,r,n=16)=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new V3(...p))),n,r,6,false);
const LEATH='#4a3424',WOOD='#5a3e2c',DWOOD='#3e2a1e',GOLD='#d8a24a',BONE='#e8e0c0',RED='#9a1c1c',LEAF='#7ab04a',FUR='#e6e0d2',ICE='#bfe8ff',FIRE='#ff7a2a',DARK='#14101a';
const RIM={t:{rim:2}};

// hoja extruida: wf(t) = medio ancho a lo largo (t 0→1), off(t) = curvatura lateral. Empieza en y=.09.
function blade(L,wf,off=()=>0,d=.018,y0=.09,n=16){const l=[],r=[];for(let i=0;i<=n;i++){const t=i/n,y=y0+t*L,w=wf(t),o=off(t);l.push([-w+o,y]);r.push([w+o,y])}
 return shp([...l,...r.reverse().slice(1)],d,.002)}
const taper=(w,t0=.82)=>t=>t<t0?w:w*(1-(t-t0)/(1-t0)*.97);

// ── ESPADA / DAGA ── (o.len, o.wid, o.gw del mango; dagger = len .24)
function sword(p,g,o,cu){const L=o.len||.5,w=(o.wid||.05)/2,col=o.col||'#cfd4dc',gw=o.gw||1,small=L<.35;let tip;
 const grip=(c,len=.13,y=-.005)=>p(cyl(.021,.019,len,6),c,0,y,0,{p:g,ink:.009});
 if(cu===1){grip('#4a6a2a');p(sph(.03,1,1.2,1),'#7ab04a',0,-.08,0,{p:g,ink:.008});                                                      // hoja de laurel
  p(blade(L,t=>w*1.25*Math.pow(Math.sin(PI*(.1+t*.9)),.6)*(t>.9?(1-t)*10:1)+.001,()=>0),col,0,0,0,{p:g,ink:.01,...RIM});p(box(.01,L*.8,.024).translate(0,.1+L*.42,0),shade(col,.7),0,0,0,{p:g,ink:0});
  [-1,1].forEach(s=>{p(cone(.026,.1*gw+.03,4).rotateZ(-s*(PI/2+.5)),GOLD,s*.07*gw,.085,0,{p:g,ink:.008});p(sph(.02,1,.6,1.4),LEAF,s*.12*gw,.06,0,{p:g,ink:.006})});
  tip=.09+L+w*1.5}
 else if(cu===2){grip('#6a5a3a');p(box(.03,.05,.012),BONE,.03,-.04,0,{p:g,ink:0});p(box(.012,.1,.04),'#c8483a',-.03,-.07,0,{p:g,ink:0,rz:.2});                // machete de hueso/obsidiana
  const zz=t=>w*(.9+(Math.round(t*14)%2?.45:0))*(t<.9?1:(1-t)*10);p(blade(L*.95,zz,t=>t*.02),mixc(col,'#2a2a30',.4),0,0,0,{p:g,ink:.01,...RIM});
  p(sph(.03,1.1,.9,1),BONE,0,.085,0,{p:g,ink:.008});tip=.09+L*.95+.03}
 else if(cu===3){grip(LEATH,.14);p(sph(.034),col,0,-.085,0,{p:g,ink:.009});p(box(.14*gw,.026,.05),shade(col,.7),0,.08,0,{p:g,ink:.009});                                  // espada ancha nórdica
  p(blade(L,taper(w*1.35,.85),()=>0),col,0,0,0,{p:g,ink:.01,...RIM});p(box(w*.5,L*.7,.024).translate(0,.1+L*.4,0),shade(col,.65),0,0,0,{p:g,ink:0});
  for(let i=0;i<3;i++)p(tor(.021,.005,8,4).rotateX(PI/2),'#e6e0d2',0,-.04-i*.03,0,{p:g,ink:0});tip=.09+L+w*1.2}
 else if(cu===4){const kl=L*1.18;                                                                                                                                        // katana / tantō
  p(cyl(.019,.019,.17,6),'#1a1418',0,-.02,0,{p:g,ink:.009});for(let i=0;i<5;i++)[-1,1].forEach(s=>p(box(.016,.02,.016),i%2?'#e8e0d0':'#1a1418',s*.012,-.09+i*.031,.013,{p:g,ink:0,rz:s*.7}));
  p(cyl(.024,.024,.022,8),GOLD,0,-.108,0,{p:g,ink:.007});p(cyl(.056*(small?.8:1),.056*(small?.8:1),.012,18),'#2a2024',0,.085,0,{p:g,ink:.009});p(tor(.056*(small?.8:1),.006,18,4).rotateX(PI/2),GOLD,0,.085,0,{p:g,ink:0});
  p(blade(kl,taper(w*.7,.9),t=>-.07*t*t*(small?.4:1),.014),col,0,0,0,{p:g,ink:.009,...RIM});
  tip=.09+kl+.02}
 else{grip('#2a2024');p(sph(.03),'#14101a',0,-.08,0,{p:g,ink:.008});[-1,1].forEach(s=>{p(cone(.022,.09,4).rotateZ(-s*PI/2).rotateX(0),'#14101a',s*.08*gw,.085,0,{p:g,ink:.007});p(cone(.015,.07,4),'#14101a',s*.11*gw,.1,0,{p:g,ink:.006,rz:-s*.3})});   // hoja de llamas
  const zz=t=>w*(1.1+(Math.round(t*12)%2?.55:0)*(1-t))*(t<.9?1:(1-t)*10);p(blade(L,zz),mixc(col,'#2a2024',.35),0,0,0,{p:g,ink:.01,...RIM});
  p(box(.012,L*.85,.026).translate(0,.1+L*.45,0),FIRE,0,0,0,{p:g,ink:0,mat:glow(FIRE,1.8)});tip=.09+L+w*1.5}
 return{tip:new V3(0,tip,0)}}

// ── MANDOBLE ── (L=.86)
function great(p,g,o,cu){const L=.86,w=.075/2,col=o.col||'#cfd4dc';let tip=1.05;
 const handle=(c,r=.022)=>p(cyl(r,r*.93,.28,6),c,0,-.06,0,{p:g,ink:.01});
 if(cu===1){handle('#4a6a2a');p(sph(.04,1,1.3,1),'#7ab04a',0,-.21,0,{p:g,ink:.009});p(box(.3,.03,.05),GOLD,0,.1,0,{p:g,ink:.01});[-1,1].forEach(s=>p(sph(.032,1,.6,1.5),LEAF,.15*s,.1,0,{p:g,ink:.007,rz:s*.4}));
  p(blade(L,t=>w*1.3*Math.pow(Math.sin(PI*(.06+t*.94)),.55)*(t>.92?(1-t)*12:1)+.001,t=>0,.02,.12),col,0,0,0,{p:g,ink:.012,...RIM});p(box(.014,L*.8,.028).translate(0,.13+L*.4,0),shade(col,.65),0,0,0,{p:g,ink:0})}
 else if(cu===2){p(cyl(.026,.024,.9,6).translate(0,.2,0),mixc('#6a4a2a',col,.15),0,0,0,{p:g,ink:.011});p(box(.15,.62,.03).translate(0,.5,0),mixc('#6a4a2a',col,.15),0,0,0,{p:g,ink:.012});     // macuahuitl: maza con dientes de obsidiana
  for(let i=0;i<8;i++)[-1,1].forEach(s=>p(cone(.024,.07,4).rotateZ(-s*PI/2),'#1a1620',s*.1,.28+i*.075,0,{p:g,ink:.007,...RIM}));p(box(.02,.5,.034).translate(0,.5,0),BONE,0,0,0,{p:g,ink:0});
  for(let i=0;i<3;i++)p(box(.04,.014,.04),'#c8483a',0,-.1+i*.03,0,{p:g,ink:0});tip=.9}
 else if(cu===3){handle(LEATH);p(sph(.05),col,0,-.21,0,{p:g,ink:.01});p(box(.3,.04,.06),shade(col,.7),0,.1,0,{p:g,ink:.01});[-1,1].forEach(s=>p(sph(.03),col,.15*s,.1,0,{p:g,ink:.008}));
  p(blade(L,taper(w*1.5,.88),()=>0,.024,.12),col,0,0,0,{p:g,ink:.012,...RIM});p(box(w*.55,L*.8,.03).translate(0,.13+L*.42,0),shade(col,.62),0,0,0,{p:g,ink:0});for(let i=0;i<4;i++)p(tor(.026,.006,8,4).rotateX(PI/2),FUR,0,-.15+i*.04,0,{p:g,ink:0})}
 else if(cu===4){const kl=L*1.2;p(cyl(.022,.022,.4,6),'#1a1418',0,-.08,0,{p:g,ink:.01});for(let i=0;i<8;i++)[-1,1].forEach(s=>p(box(.018,.024,.018),i%2?'#e8e0d0':'#1a1418',s*.014,-.25+i*.042,.016,{p:g,ink:0,rz:s*.7}));          // nodachi
  p(cyl(.07,.07,.014,18),'#2a2024',0,.12,0,{p:g,ink:.01});p(tor(.07,.007,18,4).rotateX(PI/2),GOLD,0,.12,0,{p:g,ink:0});p(blade(kl,taper(w*.85,.92),t=>-.1*t*t,.016,.14),col,0,0,0,{p:g,ink:.01,...RIM});tip=.14+kl}
 else{handle('#2a2024');p(sph(.045),DARK,0,-.21,0,{p:g,ink:.009});p(box(.34,.04,.06),DARK,0,.1,0,{p:g,ink:.01});[-1,1].forEach(s=>p(cone(.03,.14,4),DARK,.19*s,.14,0,{p:g,ink:.008,rz:-s*.5}));                      // flamberge
  const zz=t=>w*(1.15+.32*Math.sin(t*TAU*3.2))*(t<.92?1:(1-t)*12);p(blade(L,zz,()=>0,.026,.12,26),mixc(col,'#2a2024',.35),0,0,0,{p:g,ink:.012,...RIM});p(box(.016,L*.85,.03).translate(0,.13+L*.45,0),FIRE,0,0,0,{p:g,ink:0,mat:glow(FIRE,1.8)})}
 return{tip:new V3(0,tip,0)}}

// ── BÁCULO ── (orbe en y=1.04; devuelve {tip,orb})
function staff(p,g,o,cu){const col=o.col||'#9cf',shaft=(c,r=.019)=>p(cyl(r,r*1.25,1.42,6).translate(0,.25,0),c,0,0,0,{p:g,ink:.011});let orb;
 const mkOrb=(c,r=.065,y=1.04)=>p(sph(r),c,0,y,0,{p:g,ink:0,mat:glow(c,2)});
 p(cyl(.026,.026,.12,8),LEATH,0,0,0,{p:g,ink:.009});
 if(cu===1){shaft('#5a4a2a');for(let i=0;i<4;i++){const a=i/4*TAU;p(tube([[Math.cos(a)*.02,.86,Math.sin(a)*.02],[Math.cos(a)*.075,.95,Math.sin(a)*.075],[Math.cos(a)*.06,1.06,Math.sin(a)*.06],[Math.cos(a)*.02,1.12,Math.sin(a)*.02]],.011,8),'#5a4a2a',0,0,0,{p:g,ink:.006})}
  [0,1,2].forEach(i=>p(sph(.03,1,.5,1.5),LEAF,Math.cos(i*2.1)*.07,.9+i*.06,Math.sin(i*2.1)*.07,{p:g,ink:.005}));orb=mkOrb(col)}
 else if(cu===2){shaft('#4a3a22');p(sph(.045,1,1.1,.95),BONE,0,.88,0,{p:g,ink:.008});[-1,1].forEach(s=>p(sph(.011,1,1,.6),'#1a1410',.016*s,.89,.036,{p:g,ink:0}));    // tótem con calavera
  for(let i=0;i<5;i++)p(box(.022,.1,.006),['#c8483a','#e8c040','#3a8a5a','#c8483a','#e8c040'][i],Math.cos(i*1.3)*.055,.78+i*.01,Math.sin(i*1.3)*.055,{p:g,ink:0,rz:Math.cos(i*1.3)*.4});
  for(let i=0;i<5;i++)p(sph(.014),BONE,0,.5+i*.07,.03,{p:g,ink:0});orb=mkOrb(col,.055,1.0)}
 else if(cu===3){shaft('#8a9aaa');for(let i=0;i<9;i++){const a=i/9*TAU;p(sph(.03,1,.8,1),i%2?FUR:'#c9c2b0',Math.cos(a)*.035,.2,Math.sin(a)*.035,{p:g,ink:0})}                                    // cristal de hielo
  for(let i=0;i<6;i++){const a=i/6*TAU;p(cone(.022,.16+(i%2)*.06,4),ICE,Math.cos(a)*.065,1.0,Math.sin(a)*.065,{p:g,ink:.007,rz:-Math.cos(a)*.5,rx:Math.sin(a)*.5,...RIM,mat:glow(ICE,1.2)})}orb=mkOrb(col,.06)}
 else if(cu===4){p(cyl(.017,.02,1.42,6).translate(0,.25,0),'#3a2a1c',0,0,0,{p:g,ink:.011});p(tor(.085,.012,8,5),'#c8c8d0',0,1.0,0,{p:g,ink:.008});                                           // shakujō: aro con anillas
  for(let i=0;i<6;i++){const a=PI/2+(i/5-.5)*2.4;p(tor(.022,.005,8,4),GOLD,Math.cos(a)*.085,1.0+Math.sin(a)*.085-.01,0,{p:g,ink:0})}p(cyl(.03,.03,.04,8),GOLD,0,.88,0,{p:g,ink:.007});orb=mkOrb(col,.05,1.0)}
 else{shaft('#241c20');for(let i=0;i<3;i++){const a=i/3*TAU;p(cone(.02,.2,4),DARK,Math.cos(a)*.06,1.0,Math.sin(a)*.06,{p:g,ink:.007,rz:-Math.cos(a)*.45,rx:Math.sin(a)*.45})}p(tor(.07,.012,8,5).rotateX(PI/2),FIRE,0,.9,0,{p:g,ink:0,mat:glow(FIRE,1.6)});orb=mkOrb(FIRE,.06,1.02)}   // hierro negro con brasas
 return{tip:new V3(0,1.04,0),orb}}

// ── CETRO (varita corta; orbe en y=.47) ──
function scepter(p,g,o,cu){const col=o.col||'#9cf';let wd='#3e2a1e';
 const orb=(c,y=.47,r=.045)=>p(sph(r),c,0,y,0,{p:g,ink:0,mat:glow(c,1.8)});let ob;
 if(cu===1){wd='#4a6a2a';p(cyl(.018,.022,.57,6).translate(0,.155,0),wd,0,0,0,{p:g,ink:.009});for(let i=0;i<3;i++){const a=i/3*TAU;p(sph(.028,1,.4,1.6),LEAF,Math.cos(a)*.04,.42,Math.sin(a)*.04,{p:g,ink:.005,rz:-Math.cos(a)*.7,rx:Math.sin(a)*.7})}ob=orb(col)}
 else if(cu===2){p(cyl(.018,.022,.57,6).translate(0,.155,0),'#4a3a22',0,0,0,{p:g,ink:.009});p(sph(.032,1,1.1,.95),BONE,0,.4,0,{p:g,ink:.007});for(let i=0;i<3;i++)p(box(.016,.07,.005),['#c8483a','#e8c040','#3a8a5a'][i],(i-1)*.02,.34,.03,{p:g,ink:0,rz:(i-1)*.3});ob=orb(col,.5,.036)}
 else if(cu===3){p(cyl(.018,.022,.57,6).translate(0,.155,0),'#8a9aaa',0,0,0,{p:g,ink:.009});for(let i=0;i<5;i++){const a=i/5*TAU;p(cone(.015,.1,4),ICE,Math.cos(a)*.035,.45,Math.sin(a)*.035,{p:g,ink:.005,rz:-Math.cos(a)*.5,rx:Math.sin(a)*.5,mat:glow(ICE,1.2)})}ob=orb(col)}
 else if(cu===4){p(cyl(.017,.02,.57,6).translate(0,.155,0),'#e8e0d0',0,0,0,{p:g,ink:.008});for(let i=0;i<4;i++)p(box(.04,.07,.004),'#f4f0e8',(i%2?.03:-.03),.33-i*.03,0,{p:g,ink:0,rz:(i%2?-.5:.5)});p(box(.012,.1,.01),RED,0,.2,.02,{p:g,ink:0});ob=orb(col,.5,.04)}   // gohei
 else{p(cyl(.018,.022,.57,6).translate(0,.155,0),'#241c20',0,0,0,{p:g,ink:.009});[-1,1].forEach(s=>p(cone(.016,.14,4),DARK,.04*s,.44,0,{p:g,ink:.006,rz:-s*.5}));ob=orb(FIRE)}
 return{tip:new V3(0,.47,0),orb:ob}}

// ── ARCO ── (misma curva y puntas que BUILD.bow; cambia el material y los adornos) ──
function bow(p,g,o,cu){const col=o.col||'#7a5030',T=[[0,-.37,-.09],[0,-.24,-.01],[0,0,.035],[0,.24,-.01],[0,.37,-.09]];let c=col,r=.016;
 if(cu===3){c=mixc(col,'#f4f0e0',.5);r=.02}else if(cu===4)c=mixc(col,'#8a7a3a',.4);else if(cu===5)c=mixc(col,'#241c20',.6);else if(cu===2)c=mixc(col,'#6a4a2a',.4);else if(cu===1)c=mixc(col,'#8a6a40',.3);
 p(tube(T,r,18),c,0,0,0,{p:g,ink:.008});p(cyl(.024,.024,.1,8),cu===4?'#1a1418':LEATH,0,0,.03,{p:g,ink:.008});
 if(cu===1){[-1,1].forEach(s=>{p(cone(.02,.09,4).rotateX(-PI/2),LEAF,0,.37*s,-.12,{p:g,ink:.006});p(sph(.02,1,.5,1.5),LEAF,0,.3*s,-.045,{p:g,ink:.005})});[-.14,.14].forEach(y=>p(tor(.02,.005,8,4).rotateX(PI/2),'#4a6a2a',0,y,.012,{p:g,ink:0}))}
 if(cu===2){[-1,1].forEach(s=>{for(let i=0;i<3;i++)p(box(.02,.08,.005),['#c8483a','#e8c040','#3a8a5a'][i],(i-1)*.014,.36*s-s*.03,-.1,{p:g,ink:0,rz:(i-1)*.4});p(sph(.014),BONE,0,.28*s,-.03,{p:g,ink:0})})}
 if(cu===3)[-1,1].forEach(s=>{for(let i=0;i<4;i++)p(sph(.016,1,1.4,1),FUR,0,s*(.02+i*.012),.055,{p:g,ink:0})});
 if(cu===4){[-.3,-.2,-.1,.1,.2,.3].forEach(y=>p(tor(.019,.005,8,4).rotateX(PI/2),'#3a2a1a',0,y,.0+Math.max(0,.035-Math.abs(y)*.18),{p:g,ink:0}));[-.2,.2].forEach(y=>p(tor(.021,.006,8,4).rotateX(PI/2),RED,0,y,.01,{p:g,ink:0}))}        // yumi: nudos de bambú + atados
 if(cu===5){[-1,1].forEach(s=>{p(cone(.014,.1,4).rotateX(-PI/2),DARK,0,.38*s,-.12,{p:g,ink:.006});p(sph(.013),FIRE,0,.37*s,-.09,{p:g,ink:0,mat:glow(FIRE,1.8)})});p(box(.012,.07,.03),DARK,0,.0,.07,{p:g,ink:.006})}
 return{tipA:new V3(0,.37,-.09),tipB:new V3(0,-.37,-.09),rest:new V3(0,0,-.09)}}

// ── BALLESTA ──
function xbow(p,g,o,cu){const col=o.col||'#8a8e96';let st=WOOD,dk=DWOOD,lim=col;
 if(cu===1){st='#5a6a38';dk='#3a4a22';lim=mixc(col,'#6a4a2a',.5)}else if(cu===2){st='#6a5a3a';dk='#3a2a1a';lim='#5a4a2a'}else if(cu===3){st='#9aa8b4';dk='#6a7884';lim=mixc(col,'#f4f0e0',.4)}else if(cu===4){st='#2a1c20';dk='#1a1014';lim=mixc(col,'#8a7a3a',.4)}else if(cu===5){st='#241c20';dk=DARK;lim=mixc(col,'#241c20',.6)}
 p(box(.045,.5,.055).translate(0,.11,.05),st,0,0,0,{p:g,ink:.01});p(box(.06,.08,.09).translate(0,-.14,.03),dk,0,0,0,{p:g,ink:.008});
 p(tube([[-.24,.29,.06],[-.12,.335,.06],[0,.35,.06],[.12,.335,.06],[.24,.29,.06]],.014,12),lim,0,0,0,{p:g,ink:.008});
 if(cu===1)[-1,1].forEach(s=>p(sph(.024,1,.5,1.5),LEAF,s*.08,.2,.085,{p:g,ink:.005,rz:s*.5}));
 if(cu===2){for(let i=0;i<3;i++)p(sph(.014),BONE,0,.0+i*.07,.082,{p:g,ink:0});[-1,1].forEach(s=>p(box(.012,.07,.005),'#c8483a',s*.23,.28,.05,{p:g,ink:0,rz:s*.4}))}
 if(cu===3)for(let i=0;i<4;i++)p(sph(.018,1,1.3,1),FUR,0,-.1+i*.03,.075,{p:g,ink:0});
 if(cu===4){[0,.1,.2].forEach(y=>p(box(.05,.012,.06),RED,0,y,.05,{p:g,ink:0}));p(cyl(.022,.022,.012,10).rotateX(PI/2),GOLD,0,.28,.08,{p:g,ink:0})}
 if(cu===5){[-1,1].forEach(s=>p(box(.01,.18,.012),FIRE,s*.017,.14,.082,{p:g,ink:0,mat:glow(FIRE,1.6)}));p(cone(.02,.06,4).rotateX(PI/2),DARK,0,.4,.05,{p:g,ink:.006})}
 return{tipA:new V3(-.24,.29,.06),tipB:new V3(.24,.29,.06),nutY:.12,relY:.32}}

// ── MAZA · HACHA DE MANO · HACHA A DOS MANOS (recicladas de otras armas; solo cambia el aspecto) ──
function mace(p,g,o,cu){const col=o.col||'#8a8e96';const h=cu===1?'#5a4a2a':cu===3?'#8a9aaa':cu===4?'#2a1c20':cu===5?'#241c20':WOOD;
 p(cyl(.019,.022,.36,6).translate(0,.1,0),h,0,0,0,{p:g,ink:.009});
 if(cu===2){p(sph(.07,1,1.15,1),'#6a5a3a',0,.3,0,{p:g,ink:.01});for(let i=0;i<6;i++){const a=i/6*TAU;p(cone(.016,.05,4).rotateZ(-PI/2).rotateY(-a),'#1a1620',Math.cos(a)*.07,.3,Math.sin(a)*.07,{p:g,ink:.005})}}
 else if(cu===4){p(cyl(.045,.04,.2,8).translate(0,.28,0),col,0,0,0,{p:g,ink:.01,...RIM});[.2,.3,.38].forEach(y=>p(tor(.046,.006,10,4).rotateX(PI/2),GOLD,0,y,0,{p:g,ink:0}))}     // kanabō
 else if(cu===5){p(sph(.06),DARK,0,.3,0,{p:g,ink:.01});for(let i=0;i<8;i++){const a=i/8*TAU;p(cone(.022,.09,4).rotateZ(-PI/2).rotateY(-a),DARK,Math.cos(a)*.08,.3,Math.sin(a)*.08,{p:g,ink:.006})}p(sph(.026),FIRE,0,.3,.0,{p:g,ink:0,mat:glow(FIRE,1.8)})}
 else{p(sph(.065),col,0,.3,0,{p:g,ink:.011,...RIM});for(let i=0;i<(cu===1?4:6);i++){const a=i/6*TAU;p(cone(.025,.06,4).rotateZ(-PI/2).rotateY(-a),cu===1?LEAF:col,Math.cos(a)*.07,.3,Math.sin(a)*.07,{p:g,ink:.006})}if(cu===3)p(tor(.07,.012,10,4).rotateX(PI/2),FUR,0,.3,0,{p:g,ink:0})}
 return{tip:new V3(0,.34,0)}}
function axeHead(p,g,o,cu,big){const col=o.col||'#8a8e96',s=big?1.4:1,y=big?.58:.26,x=big?.12:.07;
 const geo=cu===4?new THREE.CylinderGeometry(.06,.035,.025,3,1):cu===1?new THREE.CylinderGeometry(.055,.03,.022,5,1):new THREE.CylinderGeometry(.06,.035,.025,3,1);
 p(geo.rotateX(PI/2).rotateZ(-PI/2).scale(1.3*s,1.6*s,1),cu===5?mixc(col,'#241c20',.6):col,x,y,0,{p:g,ink:.01,...RIM});
 if(cu===5)p(cone(.025*s,.1*s,4).rotateZ(-PI/2),DARK,x+.1*s,y,0,{p:g,ink:.006});if(cu===3)p(cone(.02*s,.09*s,4),col,x*.2,y+.1*s,0,{p:g,ink:.006});
 if(cu===2)for(let i=0;i<3;i++)p(box(.02,.05,.006),['#c8483a','#e8c040','#3a8a5a'][i],-.02,y-.06-i*.015,i*.014-.014,{p:g,ink:0});
 return new V3(x*1.4+.03,y,0)}
function hatchet(p,g,o,cu){const h=cu===1?'#5a4a2a':cu===3?'#8a9aaa':cu===4?'#2a1c20':cu===5?'#241c20':WOOD;p(cyl(.019,.022,.4,6).translate(0,.08,0),h,0,0,0,{p:g,ink:.009});return{tip:axeHead(p,g,o,cu,false)}}
function greataxe(p,g,o,cu){const h=cu===1?'#5a4a2a':cu===3?'#8a9aaa':cu===4?'#2a1c20':cu===5?'#241c20':WOOD;p(cyl(.022,.025,.9,6).translate(0,.2,0),h,0,0,0,{p:g,ink:.011});const t=axeHead(p,g,o,cu,true);
 if(cu===3||cu===5)[1,-1].forEach(s=>p(cone(.02,.1,4),o.col||'#8a8e96',-.04,.58+s*.15,0,{p:g,ink:.006,rz:s*PI}));return{tip:new V3(t.x+.06,t.y,0)}}

const FN={sword,great,staff,scepter,bow,xbow,mace,hatchet,greataxe,dagger:(p,g,o,cu)=>sword(p,g,Object.assign({},o,{len:.24,wid:.038,gw:.55}),cu)};
// null = esta cultura usa el arma base de BUILD (Pradera)
export function cultWeapon(kind,p,g,o){const cu=o&&o.cu;if(cu==null||!FN[kind])return null;
 if(cu===0)return null;return FN[kind](p,g,o,cu)}
// vaina (colores por cultura): [cuerpo, herrajes]
export const SCAB_COL=[['#4a3424',GOLD],['#4a6a2a','#7ab04a'],['#6a5a3a',BONE],['#6a5a48','#c8c8d0'],['#1a1418','#9a1c1c'],['#241c20',FIRE]];
