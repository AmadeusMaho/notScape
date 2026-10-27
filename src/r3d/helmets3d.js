// NotScape · R3D · CASCOS POR CULTURA (26 oct 2026, pedido del dueño: «cascos distintos por cultura, algunos que cubran por completo la cabeza»; el del Pantano «se veía mal»).
// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// `helmC(P,head,k,q,GLO)` dibuja el casco de la cultura k (0–10, índice de bioma; ver armorcult3d.js) con calidad q (1 simple · 2 reforzado · 3 completo). Devuelve true si lo dibujó.
// Marco de la cabeza (grupo `head`): cráneo = esfera r≈.212 centrada en (0,.04,−.005); rostro hacia +z; ojos ≈ y .10, z .19; boca ≈ y −.05; coronilla y ≈ .25; cuello y ≈ −.14.
// CUBREN POR COMPLETO LA CABEZA: Pradera q3 (yelmo cerrado) · Pantano q3 (cráneo tótem) · Cumbres q3 (cabeza de oso) · Oriental q3 (kabuto con menpō) · Volcán q2–3 (yelmo de forja) ·
// Páramo q3 (máscara de piedra) · Desierto q3 (máscara funeraria de oro) · Cielo q3 (corintio alado) · Infierno q3 (yelmo demoníaco). Resto: abiertos (cara visible).
import * as THREE from 'three';
const PI=Math.PI,TAU=PI*2,MET={t:{rim:2}};
const sph=(r,x=1,y=1,z=1,n=12)=>new THREE.SphereGeometry(r,n,Math.max(6,n*.7|0)).scale(x,y,z),cyl=(a,b,h,n=14)=>new THREE.CylinderGeometry(a,b,h,n),cone=(r,h,n=5)=>new THREE.ConeGeometry(r,h,n),box=(x,y,z)=>new THREE.BoxGeometry(x,y,z);
const tor=(R,r,n=20,s=6,arc)=>new THREE.TorusGeometry(R,r,s,n,arc||TAU);
const shade=(c,k)=>'#'+new THREE.Color(c).multiplyScalar(k).getHexString(),mixc=(a,b,t)=>'#'+new THREE.Color(a).lerp(new THREE.Color(b),t).getHexString();
const GOLD='#e0b84a',BONE='#e8e0c0',NIGHT='#14101a',EMBER='#ff3a1c',RUNE='#9a8ad8',MARB='#f2efe6',CELE='#9fd8ff';

export function helmC(P,head,k,q,GLO){const H={p:head,...MET};
 const cap=(c,th=1.62,y=.04)=>P(new THREE.SphereGeometry(.212,18,12,0,TAU,0,th).scale(1,1.05,1.02),c,0,y,-.005,H);                          // casquete sobre el cráneo
 const rim=(c,y=.06,r=.222,t=.012)=>P(tor(r,t,22,6).rotateX(PI/2),c,0,y,-.005,H);                                                                 // aro horizontal
 const shell=(c,h=.36,y=.04,r=.226)=>{P(cyl(r,r*.97,h,18),c,0,y,-.005,H);P(sph(r*.99,1,.55,1.02,16),c,0,y+h/2-.01,-.005,H)};                       // cubre TODA la cabeza
 const slit=(y=.1,w=.19,h=.026,c='#07050a')=>P(box(w,h,.03),c,0,y,.218,{p:head});                                                                    // ranura de visión
 const eyes=(c,y=.1,x=.05,z=.215)=>[-1,1].forEach(s=>P(sph(.022,1.3,.7,.6,8),c,x*s,y,z,Object.assign({p:head},GLO(c,2.2))));
 // 0 PRADERA (medieval): gorro de cuero → yelmo con nasal y carrilleras → yelmo cerrado con cimera
 if(k===0){if(q===1){cap('#7a4e28',1.5);P(box(.2,.024,.1),'#5a3418',0,.07,.2,{p:head});rim('#d8b050',.1,.2)}
  else if(q===2){cap('#8a8e96',1.55);rim('#6a6e76',.07);P(box(.03,.15,.025),'#8a8e96',0,.03,.215,H);[-1,1].forEach(s=>P(box(.03,.15,.15),'#8a8e96',.205*s,-.04,.04,H))}
  else{shell('#8a8e96',.33,.04);slit(.09,.2,.022);[-.04,.0,.04].forEach(y=>P(box(.2,.01,.02),'#07050a',0,y-.07,.222,{p:head}));P(box(.02,.3,.02),'#6a6e76',0,.0,.232,H);rim('#d8b050',.0,.228,.014);   // yelmo de barril con cruz
   P(cone(.05,.22,6),'#b8382a',0,.3,-.04,{p:head,rx:-.5,t:{rim:1}});P(sph(.05,1,.7,1,8),'#b8382a',0,.27,-.03,{p:head})}return true}
 // 1 BOSQUE (élfico): aro de hojas → casquete con alas de hoja → yelmo de hoja con gema (abiertos)
 if(k===1){const LF='#7ab04a',DL='#4a6a2a';if(q===1){rim('#9a7a40',.12,.2,.01);for(let i=0;i<7;i++){const a=(i/6-.5)*PI*1.3;P(sph(.03,1,.5,1.7,7),i%2?LF:DL,Math.sin(a)*.2,.14,Math.cos(a)*.15,{p:head,rx:.5,ry:a})}}
  else{cap('#8a9a60',1.3);rim('#9a7a40',.1,.214,.011);[-1,1].forEach(s=>{for(let i=0;i<3;i++)P(sph(.034,1,.4,2,8),i%2?LF:DL,.19*s,.14+i*.05,-.02-i*.03,{p:head,rz:-s*(.9-i*.2),ry:s*.3});});
   if(q>=3){P(cone(.014,.2,4),LF,0,.3,.05,{p:head,rx:.3});P(sph(.024,1,1,.8,8),'#8aff8a',0,.14,.205,Object.assign({p:head},GLO('#8aff8a',2)))}}return true}
 // 2 PANTANO (tribal): diadema de plumas → media máscara de cráneo → CRÁNEO TÓTEM que cubre toda la cabeza
 if(k===2){const FT=['#c8483a','#e8c040','#3a8a5a'];
  if(q===1){P(tor(.205,.014,20,5).rotateX(PI/2),'#6a5a3a',0,.1,-.005,H);for(let i=0;i<5;i++){const a=(i/4-.5)*PI*.9;P(box(.025,.2,.006),FT[i%3],Math.sin(a)*.2,.2,Math.cos(a)*.15-.0,{p:head,rz:-Math.sin(a)*.5,ry:a,t:{rim:1}})}for(let i=0;i<3;i++)P(sph(.014,1,1.2,1,6),BONE,(i-1)*.05,.08,.205,H)}
  else{cap(q>=3?BONE:'#7a6a4a',1.55,.045);P(sph(.19,1.05,.5,.75,12),BONE,0,.2,.07,H);                                                                    // frente del cráneo
   [-1,1].forEach(s=>{P(sph(.045,1,1.1,.55,10),'#14100a',.075*s,.1,.18,{p:head});P(sph(.022,1,1,.5,8),'#8aff8a',.075*s,.1,.2,Object.assign({p:head},GLO('#8aff8a',2.2)))});                       // cuencas con luz
   P(box(.03,.07,.03),'#14100a',0,.03,.21,{p:head});                                                                                                 // nariz
   if(q>=3){shell('#7a6a4a',.2,-.02,.222);P(box(.2,.09,.05),BONE,0,-.07,.19,H);for(let i=0;i<6;i++)P(box(.022,.05,.02),i%2?'#d8d0b0':BONE,(i-2.5)*.032,-.1,.215,{p:head});   // mandíbula con dientes
    [-1,1].forEach(s=>{P(cone(.034,.2,5),BONE,.17*s,.26,-.02,{p:head,rz:-s*.6,t:{rim:2}});P(cone(.02,.12,5),BONE,.23*s,.34,-.02,{p:head,rz:-s*.25,t:{rim:2}})});for(let i=0;i<5;i++)P(box(.025,.2,.006),FT[i%3],(i-2)*.06,.3,-.12,{p:head,rx:-.4,t:{rim:1}})}
   else{P(box(.17,.05,.04),BONE,0,-.075,.19,H);for(let i=0;i<5;i++)P(box(.02,.04,.02),BONE,(i-2)*.032,-.1,.2,{p:head})}}return true}
 // 3 CUMBRES (nórdico): gorro de piel → yelmo con nasal y piel → CABEZA DE OSO que lo cubre todo
 if(k===3){const FUR='#e6e0d2',FU2='#c9c2b0';
  if(q===1){cap('#a89878',1.45);for(let i=0;i<14;i++){const a=i/14*TAU;P(sph(.04,1,.8,1,7),i%2?FUR:FU2,Math.sin(a)*.2,.08,Math.cos(a)*.2,{p:head})}}
  else if(q===2){cap('#8a9aaa',1.55);rim('#6a7a8a',.07);P(box(.03,.16,.025),'#8a9aaa',0,.03,.215,H);for(let i=0;i<12;i++){const a=i/12*TAU;P(sph(.035,1,.8,1,7),i%2?FUR:FU2,Math.sin(a)*.215,.1,Math.cos(a)*.215,{p:head})}[-1,1].forEach(s=>P(cone(.03,.16,5),'#e8e2d2',.17*s,.24,0,{p:head,rz:-s*.7,t:{rim:2}}))}
  else{P(sph(.25,1,1.05,1.05,14),'#6a5848',0,.05,-.01,{p:head});P(sph(.2,1,.85,1.2,12),'#7a6858',0,-.03,.09,{p:head});P(sph(.07,1,.8,1.2,8),'#14100a',0,-.02,.28,{p:head});P(cone(.04,.06,5).rotateX(PI/2),'#14100a',0,-.07,.3,{p:head});   // cabeza de oso: cráneo, hocico y nariz
   [-1,1].forEach(s=>{P(sph(.065,1,1,.6,10),'#7a6858',.16*s,.26,-.03,{p:head});P(sph(.04,1,1,.5,8),'#c9a898',.16*s,.26,-.01,{p:head});P(sph(.02,1,1,.6,6),'#ffd070',.085*s,.09,.22,Object.assign({p:head},GLO('#ffd070',1.8)));P(cone(.012,.07,4),'#f4f0e0',.03*s,-.13,.27,{p:head,rx:PI})});
   P(box(.04,.14,.02),'#8a9aaa',0,.1,.24,H);rim('#8a9aaa',.12,.24,.016)}return true}
 // 4 ORIENTAL (samurái): jingasa → kabuto con shikoro y maedate → kabuto + menpō (máscara) cerrado
 if(k===4){const LAC='#201c20',RED='#b01f1c';
  if(q===1){P(cyl(.01,.3,.14,18),'#2a2024',0,.18,-.005,H);P(tor(.3,.012,22,5).rotateX(PI/2),RED,0,.115,-.005,H);P(sph(.025),'#e8c070',0,.26,-.005,H)}
  else{cap(LAC,1.62);rim(RED,.1,.218,.014);P(new THREE.CylinderGeometry(.235,.3,.12,20,1,true,PI-2,4),LAC,0,-.02,-.02,{p:head,t:{rim:2,side:THREE.DoubleSide}});for(let i=0;i<3;i++)P(tor(.27-i*.02,.008,22,4,PI*1.6).rotateX(PI/2).rotateZ(PI*.7),i%2?RED:'#e8c070',0,-.0-i*.03,-.02,{p:head});   // shikoro (guardanuca)
   [-1,1].forEach(s=>P(cone(.01,.22,4),'#e8c070',.07*s,.3,.1,{p:head,rz:-s*.5,rx:-.2,t:{rim:2}}));P(sph(.026),'#e8c070',0,.2,.2,H);
   if(q>=3){shell(LAC,.3,-.01,.224);P(sph(.19,1,.75,.55,12),'#8a1a1c',0,-.07,.14,H);P(box(.13,.05,.03),'#14100a',0,-.045,.225,{p:head});P(cone(.03,.08,4).rotateX(PI/2),'#14100a',.0,-.01,.25,{p:head});[-1,1].forEach(s=>{P(cone(.016,.11,4),'#e8e0d0',.06*s,-.1,.215,{p:head,rz:s*1.2});P(sph(.018,1.4,.6,.5,8),'#1a1418',.06*s,.05,.215,{p:head})})}}return true}
 // 5 VOLCÁN (forja): casquete con cresta de lava → yelmo cerrado redondo de hierro ennegrecido con rendija de fuego → con cuernos cortos (tamaño normal, sin cajas)
 if(k===5){const IR='#2a2024',FR='#ff7a2a';
  if(q===1){cap(IR,1.55);rim('#14101a',.08);P(box(.03,.12,.26),FR,0,.27,-.02,Object.assign({p:head},GLO(FR,1.4)))}
  else{shell(IR,.34,.03,.222);rim('#14101a',.17,.226,.014);rim('#14101a',-.06,.226,.012);slit(.1,.17,.032,FR);P(box(.17,.012,.025),FR,0,.1,.228,Object.assign({p:head},GLO(FR,2)));
   [-1,1].forEach(s=>{P(box(.012,.1,.012),FR,.06*s,-.04,.228,Object.assign({p:head},GLO(FR,1.5)))});P(box(.012,.09,.01),FR,0,-.05,.23,Object.assign({p:head},GLO(FR,1.5)));   // respiraderos de lava
   P(box(.02,.06,.3),'#14101a',0,.28,-.02,H);                                                                                                         // cresta baja
   if(q>=3)[-1,1].forEach(s=>P(cone(.03,.15,5),'#14101a',.17*s,.22,-.02,{p:head,rz:-s*.7,t:{rim:2}}))}return true}
 // 6 PÁRAMO (arcano): venda con piedra → media máscara agrietada → máscara de piedra completa con esquirlas flotantes
 if(k===6){const ST='#4a4258',DK='#2a2438';
  if(q===1){cap('#3a3448',1.3,.05);P(tor(.21,.016,20,5).rotateX(PI/2),ST,0,.12,-.005,H);P(box(.06,.07,.02),RUNE,0,.13,.215,Object.assign({p:head},GLO(RUNE,1.6)))}
  else{cap(DK,1.6);P(sph(.2,1,.78,.45,12),ST,0,-.01,.2,H);[-1,1].forEach(s=>P(sph(.026,1.2,.6,.5,8),'#9a8ad8',.065*s,.1,.235,Object.assign({p:head},GLO(RUNE,2.2))));P(box(.015,.2,.02),'#14101a',.04,.0,.25,{p:head,rz:.25});P(box(.012,.1,.02),'#14101a',-.05,.05,.25,{p:head,rz:-.3});
   if(q>=3){shell(DK,.3,.02,.226);P(sph(.2,1,1.1,.5,12),ST,0,.02,.14,H);slit(.1,.2,.03,RUNE);P(box(.2,.012,.02),RUNE,0,.1,.226,Object.assign({p:head},GLO(RUNE,2)));
    for(let i=0;i<5;i++){const a=i/5*TAU;P(box(.05,.09,.03),ST,Math.cos(a)*.26,.3+Math.sin(a*2)*.04,Math.sin(a)*.26,Object.assign({p:head,ry:a,rz:.3},{t:{rim:2}}));P(box(.02,.04,.032),RUNE,Math.cos(a)*.26,.3+Math.sin(a*2)*.04,Math.sin(a)*.26,Object.assign({p:head,ry:a,rz:.3},GLO(RUNE,1.6)))}}}return true}
 // 7 DESIERTO: pañuelo de lino → nemes con uraeus → máscara funeraria de oro completa
 if(k===7){const LN='#f0e8d0';
  if(q===1){cap(LN,1.5);rim(GOLD,.09,.214,.012);[-1,1].forEach(s=>P(box(.1,.2,.04),LN,.2*s,-.05,-.05,{p:head,rz:s*.1}))}
  else{cap(q>=3?GOLD:LN,1.6);[-1,1].forEach(s=>{P(box(.1,.3,.1),q>=3?'#2a5a9a':LN,.2*s,-.04,-.02,{p:head,rz:s*.05});for(let i=0;i<4;i++)P(box(.1,.012,.102),i%2?GOLD:'#2a5a9a',.2*s,.06-i*.07,-.02,{p:head,rz:s*.05})});   // nemes con bandas
   rim(GOLD,.1,.218,.014);P(cone(.03,.1,5),GOLD,0,.17,.2,{p:head,rx:-.3,t:{rim:2}});P(sph(.026,1,1.3,1,8),'#c8483a',0,.2,.2,Object.assign({p:head},GLO('#c8483a',1.6)));   // cobra
   if(q>=3){shell('#2a5a9a',.34,.03,.226);P(sph(.19,.95,1.05,.55,14),GOLD,0,.0,.12,H);P(sph(.03,1.5,.5,.5,8),'#14100a',.062,.1,.225,{p:head});P(sph(.03,1.5,.5,.5,8),'#14100a',-.062,.1,.225,{p:head});[-1,1].forEach(s=>P(box(.075,.014,.012),'#14100a',.062*s,.12,.228,{p:head,rz:s*.1}));P(box(.025,.08,.025),shade(GOLD,.85),0,.03,.25,H);P(box(.07,.012,.02),'#c8483a',0,-.04,.235,{p:head});P(box(.06,.14,.04),'#2a5a9a',0,-.2,.12,{p:head})}}return true}
 // 8 COSTA (piratas): pañuelo anudado → tricornio con pluma → tricornio de capitán con calavera
 if(k===8){const NV='#2a3a5a',LT='#3a2418';
  if(q===1){cap('#a02a2a',1.4);P(sph(.04,1,.8,1),'#a02a2a',-.17,.04,-.15,{p:head});P(box(.05,.12,.02),'#a02a2a',-.2,-.03,-.16,{p:head,rz:.4});P(tor(.206,.012,18,4).rotateX(PI/2),'#f0ece0',0,.08,-.005,H)}
  else{cap(LT,1.35,.06);[0,1,2].forEach(i=>{const a=i*TAU/3+PI;P(new THREE.CylinderGeometry(.2,.2,.02,3).rotateY(a),LT,0,.1,-.005,H)});P(cyl(.215,.215,.045,18),shade(LT,.7),0,.09,-.005,{p:head});   // tricornio
   [-1,1].forEach(s=>P(box(.012,.05,.4),'#c8a040',.27*s,.095,-.04,{p:head,rz:s*.05}));P(box(.5,.016,.012),'#c8a040',0,.095,.2,{p:head});P(cone(.012,.34,4),'#f0ece0',-.12,.24,-.1,{p:head,rz:.7,rx:-.5,t:{rim:1}});
   if(q>=3){P(sph(.034,1,1.1,.6,8),BONE,0,.12,.25,{p:head});[-1,1].forEach(s=>P(sph(.009,1,1,.6,6),'#14100a',.013*s,.125,.272,{p:head}));P(box(.1,.012,.012),BONE,0,.095,.262,{p:head});P(box(.01,.07,.012),'#c8483a',-.1,-.04,-.2,{p:head,rz:.3})}}return true}
 // 9 CIELO (griego): corona de laurel → casco corintio con cimera → corintio alado completo
 if(k===9){const GD=GOLD;
  if(q===1){for(let i=0;i<14;i++){const a=(i/13-.5)*PI*1.75;P(sph(.026,1,.5,1.6,7),i%2?'#8fb04a':GD,Math.sin(a)*.21,.1,Math.cos(a)*.19-.01,{p:head,rx:.4,ry:a})}}
  else{shell(MARB,q>=3?.4:.28,q>=3?.03:.07,.225);rim(GD,.18,.226,.014);if(q>=3){P(box(.05,.26,.04),GD,0,.0,.226,H);P(box(.2,.05,.04),GD,0,.0,.226,H);slit(.1,.07,.045,'#07050a');P(box(.12,.012,.02),'#07050a',0,.04,.226,{p:head})}   // T del corintio
   else{[-1,1].forEach(s=>P(box(.1,.26,.04),MARB,.2*s,-.02,.05,{p:head,rz:s*.1}));P(box(.08,.2,.03),GD,0,.0,.226,H)}
   P(box(.025,.1,.34),GD,0,.3,-.02,H);for(let i=0;i<9;i++)P(box(.03,.14-Math.abs(i-4)*.01,.03),i%2?'#9fd8ff':MARB,0,.36-Math.abs(i-4)*.005,.16-i*.045,{p:head,rx:-.15,t:{rim:1}});   // cimera de plumas celestes
   if(q>=3)[-1,1].forEach(s=>{for(let i=0;i<4;i++)P(box(.1-i*.01,.014,.024),i%2?GD:MARB,.26*s+s*i*.01,.08+i*.034,-.02,{p:head,rz:s*(.4+i*.18)});P(sph(.016),CELE,.2*s,.05,.18,Object.assign({p:head},GLO(CELE,1.8)))})}return true}
 // 10 INFIERNO: aro de púas → yelmo con cuernos → yelmo demoníaco completo con dientes y ojos de brasa
 if(k===10){const IR='#17121a';
  if(q===1){rim(IR,.1,.212,.016);for(let i=0;i<7;i++){const a=(i/6-.5)*PI*1.5;P(cone(.016,.11,4),NIGHT,Math.sin(a)*.2,.17,Math.cos(a)*.14,{p:head,rz:-Math.sin(a)*.4,t:{rim:2}})}}
  else{cap(IR,1.6);rim('#3a2e36',.08,.22,.014);[-1,1].forEach(s=>{P(tor(.15,.026,10,5,PI*.9).rotateZ(s>0?PI*.05:PI*.05).rotateY(0),NIGHT,.2*s,.22,-.02,{p:head,rz:s*.15,t:{rim:2}});P(cone(.032,.2,5),NIGHT,.26*s,.38,-.02,{p:head,rz:-s*.5,t:{rim:2}})});
   if(q>=3){shell(IR,.34,.03,.226);P(box(.2,.016,.03),EMBER,0,.1,.224,Object.assign({p:head},GLO(EMBER,2)));eyes(EMBER,.1,.06,.225);P(box(.2,.1,.05),'#0e0a0e',0,-.07,.215,H);for(let i=0;i<7;i++)P(cone(.014,.06,4),i%2?BONE:'#d8d0b0',(i-3)*.03,-.1,.236,{p:head,rx:PI,t:{rim:1}});[-1,1].forEach(s=>P(cone(.018,.1,4),NIGHT,.1*s,.0,.235,{p:head,rx:PI/2,rz:s*.2}))}}return true}
 return false}
