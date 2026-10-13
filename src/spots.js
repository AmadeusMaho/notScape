// NotScape · MODELOS PARA LAS GUARIDAS Y LA AMPLIACIÓN DE LAS ALDEAS (oct 2026). Se registran en ORG.U con ORG.add (mismas utilidades y lenguaje de formas que style-organic.js).
// Cada modelo se hornea una vez (PROPS.bake), así que aquí no hay coste por fotograma. Opciones por prop (`o`): col/stone/moss… para variar el material según el bioma; dir:'y' gira el modelo largo (muros, vallas) 90°.
// Colocación y datos: src/biome-spots.js. Luces y animaciones en vivo (llamas, humo, brillo de lava): src/props.js (FXN/propFx) y src/light.js (LAMPK/LIGHTN).
(()=>{
 const {add,M,soft,RG,box,lathe,blob,cone,gable,tilt}=ORG,STY_mix=(a,b,t)=>PAINT.mix(a,b,t);
 // caja con orientación: dir:'y' intercambia ejes para que el modelo largo corra por y
 const Bx=(o,w,d,h,p)=>o&&o.dir==='y'?box(d,w,h,[p[1],p[0],p[2]]):box(w,d,h,p);
 const wood='#9a6a3a',woodL='#b9803f',woodD='#5a3e28',stone='#a8a496',stoneD='#8f8a80',stoneL='#c2bdae',moss='#6fb048',bone='#e8e0c8',hide='#a8794a';

 // tronco caído (con cara cortada y musgo)
 add('tronco',(g,x,y,sm,o)=>{o=o||{};const L=o.len||24,c=o.col||'#8f6238';soft(g,x,y,L*.55);
  M(g,x,y,tilt(lathe({n:7,at:[0,0,0],r:[3.6,3.6],h:L,top:.92,seed:901}),[-L/2,0,3.6],'x',1),c,sm,901,RG);
  M(g,x,y,tilt(lathe({n:7,at:[0,0,0],r:[3.1,3.1],h:.6,top:1,seed:902}),[L/2,0,3.6],'x',1),'#d6a566',0,902,{crease:0,paint:false});
  M(g,x,y,blob({at:[-L*.18,0,7],r:[5,2.4,1.2],amp:.1,flat:true,seed:903}),moss,sm,903)},1.7);
 // montón de huesos con calavera
 add('huesos',(g,x,y,sm)=>{soft(g,x,y,9);
  M(g,x,y,box(11,1.7,1.7,[-1,-2,0]),bone,0,911,{crease:0,paint:false,ij:.4});M(g,x,y,box(1.7,9,1.7,[1,0,0]),bone,0,912,{crease:0,paint:false,ij:.4});M(g,x,y,box(9,1.7,1.7,[-2,3,1.7]),'#d8d0b4',0,913,{crease:0,paint:false,ij:.4});
  [[-6.5,-2,.8],[4.5,-2,.8],[1,-4.5,.8],[1,4.5,.8]].forEach((q,i)=>M(g,x,y,blob({at:[q[0],q[1],q[2]],r:[1.5,1.5,1.3],amp:.1,seed:914+i}),bone,0,914+i,{paint:false}));
  M(g,x,y,blob({at:[4,3.5,3.4],r:[3.4,3,3],amp:.08,seed:918}),'#f0e9d2',sm,918);M(g,x,y,blob({at:[5.6,5,3.6],r:[.9,.7,.9],amp:.05,seed:919}),'#3a2a22',0,919,{paint:false,ink:false});M(g,x,y,blob({at:[3.2,5.4,3.6],r:[.9,.7,.9],amp:.05,seed:920}),'#3a2a22',0,920,{paint:false,ink:false})},1.7);
 // tienda de pieles (goblins, orcos, ogros): cono irregular con puerta y mástil
 add('carpa',(g,x,y,sm,o)=>{o=o||{};const c=o.col||hide,t=o.trim||woodD;soft(g,x,y,19);
  M(g,x,y,cone({at:[0,0,0],r:[15,13],h:25,n:5,seed:931,amp:.06}),c,sm,931,RG);
  M(g,x,y,box(5.5,1,10,[4.4,4.6,0]),'#3a2a22',0,932,{crease:0,paint:false,ij:.3});
  M(g,x,y,lathe({n:4,at:[0,0,23],r:[.7,.7],h:10,top:.7,seed:933}),t,0,933,{crease:0,paint:false});
  M(g,x,y,box(7,6,1.4,[-5,-2,5]),o.patch||'#c9a070',0,934,{crease:0,paint:false,ij:.4});M(g,x,y,box(1.2,9,1.2,[5,-5,0]),t,0,935,{crease:0,paint:false,ij:.3})},1.5);
 // estandarte: asta con tela colgando y adorno
 add('estandarte',(g,x,y,sm,o)=>{o=o||{};const c=o.col||'#a83a3a';soft(g,x,y,6);
  M(g,x,y,lathe({n:5,at:[0,0,0],r:[1.1,1.1],h:34,top:.8,seed:941}),woodD,sm,941,RG);M(g,x,y,box(1,11,2,[0,-3.5,31]),woodD,0,942,{crease:0,paint:false});
  M(g,x,y,box(1,10,14,[0,-3.5,17]),c,0,943,{crease:0,paint:false,ij:.5});M(g,x,y,box(1,5,2,[0,-3.5,22]),o.mark||'#e8d9a0',0,944,{crease:0,paint:false,ij:.3});
  M(g,x,y,blob({at:[0,0,35],r:[1.8,1.8,2],amp:.1,seed:945}),o.top||'#d9b24a',0,945,{paint:false})},1.7);
 // hoguera de campamento: piedras, leña en cruz y brasas (las llamas y la luz son en vivo: props.js / light.js)
 add('hoguera',(g,x,y,sm,o)=>{soft(g,x,y,13);
  for(let k=0;k<7;k++){const a=k*Math.PI*2/7;M(g,x,y,blob({at:[Math.cos(a)*7.5,Math.sin(a)*7.5,1.4],r:[2.5,2.5,2],amp:.2,flat:true,seed:951+k}),k%2?stoneD:stone,sm,951+k)}
  M(g,x,y,blob({at:[0,0,.6],r:[5.5,5.5,1.2],amp:.1,flat:true,seed:958}),'#2a2222',0,958,{paint:false});
  M(g,x,y,tilt(lathe({n:5,at:[0,0,0],r:[1.3,1.3],h:11,seed:959}),[-5.5,-1,2.2],'x',1),woodD,sm,959,RG);M(g,x,y,tilt(lathe({n:5,at:[0,0,0],r:[1.3,1.3],h:11,seed:960}),[1,-5.5,2.2],'y',1),wood,sm,960,RG);
  M(g,x,y,blob({at:[0,0,2],r:[3,3,1.2],amp:.1,flat:true,seed:961}),'#ff8a2a',0,961,{paint:false,ij:.3})},1.8);
 // antorcha sobre poste (luz y llama en vivo)
 add('antorcha',(g,x,y,sm)=>{soft(g,x,y,4);M(g,x,y,lathe({n:5,at:[0,0,0],r:[1.2,1.2],h:22,top:.8,seed:971}),woodD,sm,971,RG);M(g,x,y,lathe({n:6,at:[0,0,20],r:[2.4,2.4],h:3.4,top:1.3,seed:972}),'#4a3a30',0,972,{crease:0});M(g,x,y,blob({at:[0,0,24],r:[1.6,1.6,1.2],amp:.1,seed:973}),'#ff8a2a',0,973,{paint:false})},1.8);
 // muro derruido: tramo largo con la cima rota, escombros y musgo (o.len, o.h, o.col, o.dir)
 add('muroRuina',(g,x,y,sm,o)=>{o=o||{};const L=o.len||34,H=o.h||13,c=o.col||stone,cd=o.dark||stoneD;soft(g,x,y,L*.5);
  M(g,x,y,Bx(o,L,5,H,[0,0,0]),c,0,981,RG);
  M(g,x,y,Bx(o,L*.34,4.6,H*.55,[-L*.3,0,H]),cd,0,982,RG);M(g,x,y,Bx(o,L*.2,4.6,H*.85,[L*.18,0,H]),c,0,983,RG);M(g,x,y,Bx(o,L*.16,4.6,H*.3,[L*.38,0,H]),cd,0,984,RG);
  const sw=(a,b,z)=>o.dir==='y'?[b,a,z]:[a,b,z];
  [[-L*.5,4,1.4],[L*.08,-4.6,1.2],[L*.42,4.4,1.1]].forEach((q,i)=>M(g,x,y,blob({at:sw(q[0],q[1],q[2]),r:[2.8,2.4,2],amp:.2,flat:true,seed:985+i}),i%2?stoneL:cd,sm,985+i));
  M(g,x,y,blob({at:sw(-L*.1,1.5,H+.8),r:[L*.14,2.2,1],amp:.14,flat:true,seed:988}),o.moss||moss,sm,988)},1.5);
 // columna (entera o rota con el fuste caído al lado)
 add('columna',(g,x,y,sm,o)=>{o=o||{};const H=o.h||26,c=o.col||stoneL,cd=o.dark||stone;soft(g,x,y,9);
  M(g,x,y,box(8,8,3,[0,0,0]),cd,0,991,RG);
  if(o.broken){M(g,x,y,lathe({n:8,at:[0,0,3],r:[3,3],h:H*.55,top:.92,seed:992,amp:.05}),c,sm,992,RG);M(g,x,y,blob({at:[0,0,3+H*.55],r:[3,3,1.3],amp:.25,flat:true,seed:993}),cd,sm,993);
   M(g,x,y,tilt(lathe({n:8,at:[0,0,0],r:[2.8,2.8],h:H*.4,seed:994}),[4,7,2.8],'x',1),c,sm,994,RG)}
  else{M(g,x,y,lathe({n:8,at:[0,0,3],r:[3,3],h:H-7,top:.9,seed:992}),c,sm,992,RG);M(g,x,y,box(8,8,3.4,[0,0,H-4]),cd,0,995,RG)}
  if(o.moss!==false)M(g,x,y,blob({at:[1,2,3.4],r:[3.4,2.4,1.2],amp:.2,flat:true,seed:996}),o.moss||moss,sm,996)},1.6);
 // arco derruido (dos pilares y un dintel partido): o.dir 'y' para cruzar caminos en el otro sentido
 add('arcoRuina',(g,x,y,sm,o)=>{o=o||{};const c=o.col||stone,cd=o.dark||stoneD,sw=(a,b,z)=>o.dir==='y'?[b,a,z]:[a,b,z],S=o.span||13;soft(g,x,y,S+9);
  M(g,x,y,Bx(o,5,5,26,[-S,0,0]),c,0,1001,RG);M(g,x,y,Bx(o,5,5,19,[S,0,0]),cd,0,1002,RG);
  M(g,x,y,Bx(o,S+2,4.6,4,[-S*.6,0,26]),c,0,1003,RG);M(g,x,y,Bx(o,S*.7,4.6,3.4,[S*.75,0,19]),cd,0,1004,RG);
  [[0,5,1.3],[S+4,-4,1.2],[-S-4,4,1.2]].forEach((q,i)=>M(g,x,y,blob({at:sw(q[0],q[1],q[2]),r:[3,2.6,2],amp:.2,flat:true,seed:1005+i}),i?stoneL:cd,sm,1005+i));
  M(g,x,y,blob({at:sw(-S,0,26.2),r:[3.4,2.4,1],amp:.14,flat:true,seed:1008}),o.moss||moss,sm,1008)},1.5);
 // lápida (variante o.v 0/1/2) y cruz de tumba, con montículo de tierra
 add('lapida',(g,x,y,sm,o)=>{o=o||{};const v=o.v|0,c=o.col||'#b9b5a8';soft(g,x,y,8);
  M(g,x,y,blob({at:[0,6,.8],r:[6,3.4,1.6],amp:.15,flat:true,seed:1011}),o.soil||'#6a5238',sm,1011);
  M(g,x,y,box(7,2.2,[10,13,8][v%3],[0,0,0]),c,0,1012,RG);M(g,x,y,blob({at:[0,0,[10,13,8][v%3]],r:[3.5,1.3,1.8],amp:.1,flat:true,seed:1013}),c,sm,1013);
  M(g,x,y,box(3,.8,.8,[0,1.1,6]),'#8a867a',0,1014,{crease:0,paint:false});M(g,x,y,blob({at:[-2,.4,1],r:[2,1.4,1],amp:.2,flat:true,seed:1015}),moss,sm,1015)},1.7);
 add('cruz',(g,x,y,sm,o)=>{o=o||{};const c=o.col||'#c9c4b6';soft(g,x,y,8);
  M(g,x,y,blob({at:[0,5,.8],r:[6,3.4,1.6],amp:.15,flat:true,seed:1021}),o.soil||'#6a5238',sm,1021);
  M(g,x,y,box(2,2,16,[0,0,0]),c,0,1022,RG);M(g,x,y,box(9,2,2.2,[0,0,10]),c,0,1023,RG)},1.7);
 // tumba (sarcófago de piedra con la tapa corrida)
 add('tumba',(g,x,y,sm,o)=>{o=o||{};const c=o.col||stone;soft(g,x,y,14);
  M(g,x,y,box(18,9,6,[0,0,0]),c,0,1031,RG);M(g,x,y,box(16,8,2.4,[2.4,-1.2,6]),stoneL,0,1032,RG);M(g,x,y,box(7,2,.8,[-4,3.6,6.1]),'#7a766a',0,1033,{crease:0,paint:false});
  M(g,x,y,blob({at:[-6,-1,6.2],r:[2.4,2,1],amp:.2,flat:true,seed:1034}),moss,sm,1034)},1.6);
 // verja de hierro (cementerio): o.len, o.dir
 add('verja',(g,x,y,sm,o)=>{o=o||{};const L=o.len||18,n=Math.max(3,Math.round(L/4.5)),c=o.col||'#3a3638';soft(g,x,y,L*.55);
  for(let i=0;i<n;i++){const px=-L/2+L*i/(n-1);M(g,x,y,o.dir==='y'?box(1,1,12,[0,px,0]):box(1,1,12,[px,0,0]),c,0,1041+i,{crease:0,paint:false,ij:.2});M(g,x,y,o.dir==='y'?blob({at:[0,px,12.6],r:[1.1,1.1,1.5],amp:.1,seed:1051+i}):blob({at:[px,0,12.6],r:[1.1,1.1,1.5],amp:.1,seed:1051+i}),c,0,1051+i,{paint:false})}
  M(g,x,y,Bx(o,L,1,1.2,[0,0,3]),c,0,1061,{crease:0,paint:false});M(g,x,y,Bx(o,L,1,1.2,[0,0,9]),c,0,1062,{crease:0,paint:false})},1.7);
 // tótem de ogro: poste con calaveras, cuernos y cuerdas
 add('totem',(g,x,y,sm,o)=>{o=o||{};soft(g,x,y,8);M(g,x,y,lathe({n:6,at:[0,0,0],r:[3.4,3.4],h:42,top:.85,seed:1071}),'#6a4a30',sm,1071,RG);
  [[8,3.8],[19,3.2],[30,2.8]].forEach((q,i)=>{M(g,x,y,blob({at:[0,0,q[0]+2],r:[q[1]+.6,q[1]+.6,q[1]],amp:.08,seed:1072+i}),i%2?'#f0e9d2':bone,sm,1072+i);
   M(g,x,y,blob({at:[q[1]*.62,q[1]*.62,q[0]+2.4],r:[.8,.6,.9],amp:.05,seed:1075+i}),'#3a2a22',0,1075+i,{paint:false,ink:false});M(g,x,y,blob({at:[q[1]*.9,-q[1]*.2,q[0]+2.4],r:[.8,.6,.9],amp:.05,seed:1078+i}),'#3a2a22',0,1078+i,{paint:false,ink:false})});
  M(g,x,y,cone({at:[0,0,38],r:[2.4,2.4],h:7,n:4,seed:1081}),o.col||'#a83a3a',0,1081,{paint:false});M(g,x,y,box(11,1.3,1.3,[0,0,25]),woodD,0,1082,{crease:0,paint:false});[-5.5,5.5].forEach((px,i)=>M(g,x,y,blob({at:[px,0,24],r:[1.4,1.2,2.2],amp:.1,seed:1083+i}),'#c9a070',0,1083+i,{paint:false}))},1.5);
 // guarida (arco de rocas con hueco oscuro, huesos y musgo)
 add('guarida',(g,x,y,sm,o)=>{o=o||{};const c=o.col||'#8f8a80';soft(g,x,y,24);
  M(g,x,y,blob({at:[0,2,4],r:[10,7,5],amp:.1,seed:1091}),'#241c1c',0,1091,{paint:false,ink:false});
  [[-12,-2,8,9,9],[-9,6,7,7,6],[12,-1,8,9,9],[9,6,7,7,6],[-3,-8,10,10,8],[4,-7,9,9,8]].forEach((q,i)=>M(g,x,y,blob({at:[q[0],q[1],q[4]*.6],r:[q[2],q[3]*.8,q[4]],amp:.2,flat:true,seed:1092+i}),i%3===0?'#a29d93':i%3===1?c:'#7c776d',sm,1092+i));
  M(g,x,y,blob({at:[-2,-6,13],r:[10,6,3],amp:.2,flat:true,seed:1099}),'#7c776d',sm,1099);M(g,x,y,blob({at:[2,-5,16],r:[6,4,2],amp:.2,flat:true,seed:1100}),moss,sm,1100)},1.5);
 // árbol seco (sin hojas: tronco retorcido y ramas)
 add('arbolSeco',(g,x,y,sm,o)=>{o=o||{};const c=o.col||'#5e4a3c';soft(g,x,y,12);
  M(g,x,y,lathe({n:6,at:[0,0,0],r:[3.4,3.4],h:26,top:.55,seed:1111}),c,sm,1111,RG);
  [[-1,0,14,11,.6],[1,0,20,10,-.6],[0,1,24,8,.2]].forEach((q,i)=>M(g,x,y,tilt(lathe({n:5,at:[0,0,0],r:[1.1,1.1],h:q[3],top:.4,seed:1112+i}),[0,0,q[2]],i===1?'y':'x',i===0?-1:1),c,0,1112+i,{crease:0,paint:false,ij:.3}))},1.5);
 // abrevadero y comedero (rancho)
 add('abrevadero',(g,x,y,sm,o)=>{o=o||{};soft(g,x,y,13);
  M(g,x,y,Bx(o,20,7,5,[0,0,0]),wood,0,1121,RG);M(g,x,y,Bx(o,17.5,4.6,.8,[0,0,4.6]),o.water||'#52b6d8',0,1122,{crease:0,paint:false,ij:.3});
  [-8,8].forEach((p,i)=>M(g,x,y,o.dir==='y'?box(1.6,1.6,8,[0,p,0]):box(1.6,1.6,8,[p,0,0]),woodD,0,1123+i,RG))},1.7);
 add('comedero',(g,x,y,sm,o)=>{o=o||{};soft(g,x,y,12);
  M(g,x,y,Bx(o,18,6,3,[0,0,0]),wood,0,1131,RG);M(g,x,y,blob({at:o.dir==='y'?[0,0,5]:[0,0,5],r:o.dir==='y'?[3,8,3.4]:[8,3,3.4],amp:.14,flat:true,seed:1132}),'#e0c25a',sm,1132);
  M(g,x,y,Bx(o,19,1,6,[0,3.2,0]),woodL,0,1133,RG)},1.7);
 // gallinero: casita sobre patas con rampa y tejado
 add('gallinero',(g,x,y,sm,o)=>{o=o||{};soft(g,x,y,14);
  [[-5,-3],[5,-3],[-5,3],[5,3]].forEach((q,i)=>M(g,x,y,box(1.4,1.4,3,[q[0],q[1],0]),woodD,0,1141+i,RG));
  M(g,x,y,box(14,10,8,[0,0,3]),o.wall||'#c9a070',0,1145,RG);M(g,x,y,gable({at:[0,0,11],w:14,d:10,h:5.5,ov:1.4}),o.roof||'#b8482a',0,1146,RG);
  M(g,x,y,box(3.2,1,4.4,[2.8,5.2,3.4]),'#3a2a22',0,1147,{crease:0,paint:false});M(g,x,y,box(3,7,.8,[2.8,9,1.2]),wood,0,1148,{crease:0,paint:false})},1.9);
 // carreta de mano
 add('carreta',(g,x,y,sm,o)=>{o=o||{};soft(g,x,y,16);
  M(g,x,y,box(18,10,5,[0,0,5]),wood,0,1151,RG);M(g,x,y,box(18,1,4,[0,-4.6,10]),woodL,0,1152,RG);M(g,x,y,box(1,10,4,[-8.6,0,10]),woodL,0,1153,RG);
  [-5.5,5.5].forEach((s,i)=>M(g,x,y,tilt(lathe({n:8,at:[0,0,0],r:[5.2,5.2],h:1.4,seed:1154+i}),[0,s+(s>0?4:-5.4),5.2],'y',1),woodD,0,1154+i,{crease:0,paint:false}));
  M(g,x,y,box(14,1.4,1.4,[8,4.6,5]),woodD,0,1157,{crease:0,paint:false});M(g,x,y,blob({at:[0,0,11],r:[7,3.6,2.4],amp:.2,flat:true,seed:1158}),o.load||'#e0c25a',sm,1158)},1.6);
 // espantapájaros
 add('espantapajaros',(g,x,y,sm)=>{soft(g,x,y,6);
  M(g,x,y,lathe({n:4,at:[0,0,0],r:[.9,.9],h:28,top:.9,seed:1161}),woodD,0,1161,{crease:0,paint:false});M(g,x,y,box(15,1.2,1.2,[0,0,19]),woodD,0,1162,{crease:0,paint:false});
  M(g,x,y,box(7,3,8,[0,0,12]),'#8aa4c8',sm,1163,RG);M(g,x,y,blob({at:[0,0,26],r:[3,3,3],amp:.08,seed:1164}),'#e0c8a0',sm,1164);
  M(g,x,y,cone({at:[0,0,28],r:[4.8,4.8],h:4,n:6,seed:1165}),'#7a5a30',0,1165,{paint:false});M(g,x,y,blob({at:[8,0,19],r:[1.8,1,2.2],amp:.2,seed:1166}),'#e0c25a',0,1166,{paint:false});M(g,x,y,blob({at:[-8,0,19],r:[1.8,1,2.2],amp:.2,seed:1167}),'#e0c25a',0,1167,{paint:false})},1.6);
 // portillo de corral: dos postes y una hoja abierta en diagonal
 add('portillo',(g,x,y,sm,o)=>{o=o||{};soft(g,x,y,12);
  [-9,9].forEach((p,i)=>M(g,x,y,box(2.6,2.6,12,[p,0,0]),'#9a6a3a',sm,1171+i,RG));
  M(g,x,y,box(2.2,9,1.6,[-9,5,3]),woodL,0,1173,RG);M(g,x,y,box(2.2,9,1.6,[-9,5,8]),woodL,0,1174,RG);M(g,x,y,box(2.2,10.8,1.4,[-9,5,5.6]),'#8a5a2a',0,1175,{crease:0,paint:false})},1.7);
 // estatua de zorro (kitsune) de piedra con babero rojo
 add('estatuaZorro',(g,x,y,sm,o)=>{o=o||{};const c=o.col||'#bdb8ac';soft(g,x,y,10);
  M(g,x,y,box(9,8,3,[0,0,0]),stoneD,0,1181,RG);
  M(g,x,y,blob({at:[0,0,8],r:[3.6,3.2,5],amp:.08,seed:1182}),c,sm,1182);M(g,x,y,blob({at:[1.8,1.6,14],r:[3,3,2.8],amp:.08,seed:1183}),c,sm,1183);
  M(g,x,y,cone({at:[.4,-.4,15.6],r:[1.1,1.1],h:4.2,n:4,seed:1184}),c,0,1184,{paint:false});M(g,x,y,cone({at:[3.6,.6,15.6],r:[1.1,1.1],h:4.2,n:4,seed:1185}),c,0,1185,{paint:false});
  M(g,x,y,box(5,1,2.4,[1.4,1.8,9]),'#b8302a',0,1186,{crease:0,paint:false});M(g,x,y,blob({at:[-3.6,-2.4,3.8],r:[3.8,1.8,1.8],amp:.14,seed:1187}),c,sm,1187)},1.7);
 // fumarola de lava (anillo de roca oscura con brasa; humo y brillo en vivo)
 add('fumarola',(g,x,y,sm,o)=>{o=o||{};soft(g,x,y,13);
  for(let k=0;k<7;k++){const a=k*Math.PI*2/7;M(g,x,y,blob({at:[Math.cos(a)*7,Math.sin(a)*6,2.2],r:[3.2,3,3],amp:.22,flat:true,seed:1191+k}),k%2?'#4a4044':'#5a4a4c',sm,1191+k)}
  M(g,x,y,blob({at:[0,0,1.2],r:[5.8,5.2,1.6],amp:.1,flat:true,seed:1199}),'#ff7a2a',0,1199,{paint:false,ij:.3});M(g,x,y,blob({at:[.6,0,2.2],r:[3,2.6,1],amp:.1,flat:true,seed:1200}),'#ffd060',0,1200,{paint:false,ij:.3})},1.7);
 // altar demoníaco: escalones de basalto, obelisco y runa brillante
 add('altarDemon',(g,x,y,sm,o)=>{o=o||{};soft(g,x,y,18);
  M(g,x,y,box(24,24,3,[0,0,0]),'#3a3034',0,1211,RG);M(g,x,y,box(16,16,3,[0,0,3]),'#4a4044',0,1212,RG);
  M(g,x,y,lathe({n:4,rot:Math.PI/4,at:[0,0,6],r:[3.6,3.6],h:26,top:.5,seed:1213}),'#2a2226',0,1213,RG);
  M(g,x,y,blob({at:[0,0,30],r:[2.2,2.2,3.2],amp:.1,seed:1214}),'#ff4a2a',0,1214,{paint:false,ij:.3});
  [[-6,5],[6,-5],[5,6],[-5,-6]].forEach((q,i)=>M(g,x,y,blob({at:[q[0],q[1],6.8],r:[1.7,1.7,1],amp:.1,flat:true,seed:1215+i}),'#c8401a',0,1215+i,{paint:false,ij:.3}))},1.3);
 // charco de barro/agua (plano en el suelo)
 add('charco',(g,x,y,sm,o)=>{o=o||{};const c=o.col||'#5a4a38',w=o.water||'#6aa0b0';
  M(g,x,y,blob({at:[0,0,0],r:[15,10,.8],amp:.2,flat:true,seed:1221}),c,0,1221,{paint:false,ink:true});M(g,x,y,blob({at:[.5,0,.5],r:[11.5,7.5,.6],amp:.16,flat:true,seed:1222}),w,0,1222,{paint:false,ink:false});
  M(g,x,y,blob({at:[-3,-1,.9],r:[4,2,.3],amp:.1,flat:true,seed:1223}),'#cfe8ee',0,1223,{paint:false,ink:false})},1.5);
 // puesto de mercado (toldo de rayas, mostrador y cajas)
 add('puesto',(g,x,y,sm,o)=>{o=o||{};const a=o.col||'#c0392b',b=o.col2||'#f1e4c4';soft(g,x,y,16);
  [[-10,-6],[10,-6],[-10,6],[10,6]].forEach((q,i)=>M(g,x,y,box(1.5,1.5,18,[q[0],q[1],0]),woodD,0,1231+i,RG));
  M(g,x,y,box(22,6,7,[0,5,0]),wood,0,1235,RG);M(g,x,y,box(24,8,1.2,[0,5,7]),woodL,0,1236,RG);
  for(let i=0;i<6;i++)M(g,x,y,box(4.1,15,1.6,[-10.25+i*4.1,0,18+(i%2?.2:0)]),i%2?b:a,0,1237+i,{crease:0,paint:false,ij:.4});
  M(g,x,y,blob({at:[-5,5,9.6],r:[3,2.4,2],amp:.2,seed:1243}),o.g1||'#d9553a',sm,1243);M(g,x,y,blob({at:[3,5,9.6],r:[3,2.4,2],amp:.2,seed:1244}),o.g2||'#e0b83a',sm,1244);M(g,x,y,box(4,4,4,[8,5,8.2]),woodL,0,1245,RG)},1.5);
 // espadas/lanzas clavadas y cráneo-empalado (decoración de campamento orco)
 add('lanzas',(g,x,y,sm,o)=>{o=o||{};soft(g,x,y,8);
  [[-5,0,26],[0,3,32],[5,-1,24]].forEach((q,i)=>{M(g,x,y,lathe({n:4,at:[q[0],q[1],0],r:[.8,.8],h:q[2],top:.8,seed:1251+i}),woodD,0,1251+i,{crease:0,paint:false});M(g,x,y,cone({at:[q[0],q[1],q[2]],r:[1.5,1.5],h:5,n:4,seed:1255+i}),'#aab4be',0,1255+i,{paint:false})});
  M(g,x,y,blob({at:[0,3,31],r:[2.6,2.4,2.4],amp:.08,seed:1259}),bone,sm,1259)},1.6);
 // cofre abierto (puntos de interés ya saqueados): mismo cuerpo que ORG.U.cofre con la tapa levantada hacia atrás
 add('cofreAbierto',(g,x,y,sm)=>{soft(g,x,y,16);const IR='#59525c';
  M(g,x,y,box(16,11,6,[0,0,0]),'#b9803f',sm,1331,RG);M(g,x,y,box(14,9,.8,[0,0,5.6]),'#2a1e18',0,1332,{crease:0,paint:false});
  M(g,x,y,blob({at:[-2,.5,6.4],r:[4,3,1.4],amp:.2,seed:1336}),'#f1c24a',0,1336,{paint:false,ij:.3});M(g,x,y,blob({at:[3,-.5,6.2],r:[3,2.4,1.2],amp:.2,seed:1337}),'#e0a82a',0,1337,{paint:false,ij:.3});
  [-4.6,4.6].forEach((px,i)=>M(g,x,y,box(1.4,.8,6.1,[px,5.8,0]),IR,0,1333+i,{crease:0,paint:false,ij:.3}));
  M(g,x,y,box(16.8,1.8,9,[0,-6.6,5.6]),'#c28d48',sm,1335,RG);[-4.6,4.6].forEach((px,i)=>M(g,x,y,box(1.4,.8,9.2,[px,-5.6,5.6]),IR,0,1338+i,{crease:0,paint:false,ij:.3}))},1.7);
 // santuario de bendición: peana de piedra, pilar con runas y una gema que brilla (o.col). o.used apaga el brillo
 add('santuario',(g,x,y,sm,o)=>{o=o||{};const c=o.col||'#7ad0ff',u=o.used;soft(g,x,y,18);
  M(g,x,y,box(20,20,3,[0,0,0]),stoneD,sm,1341,RG);M(g,x,y,box(14,14,3,[0,0,3]),stone,sm,1342,RG);
  M(g,x,y,lathe({n:6,at:[0,0,6],r:[5,3.6],h:22,top:.7,seed:1343}),stoneL,sm,1343,RG);
  [8,13,18].forEach((z,i)=>M(g,x,y,box(1.2,4+(i%2)*2,1.2,[4,0,z]),u?'#6a6a66':c,0,1344+i,{crease:0,paint:false,ij:.3}));
  M(g,x,y,blob({at:[0,0,31],r:[3.4,3.4,3.8],amp:.08,seed:1348}),u?'#7a7a76':c,0,1348,{paint:false,ij:.3})},1.8);
 // ajuste fino de escala por modelo (se lee en cada dibujo)
 Object.assign(ORG.KSC,{columna:2.0,lapida:2.1,cruz:2.1,estatuaZorro:2.2,huesos:2.0,estandarte:1.9,totem:1.7,espantapajaros:1.8,charco:1.7,fumarola:1.9});
})();
