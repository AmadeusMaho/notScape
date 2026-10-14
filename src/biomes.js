// NotScape · F3-B · DATOS POR BIOMA. Un bioma nuevo = una entrada más en `list` (y su fila en PAL/DEC); el código de game.js, world-iso.js y props.js recorre BIOMES.list.
// Todo lo de aquí se movió tal cual desde game.js / world-iso.js / props.js (sin cambiar valores); `tools/world_snapshot.py` comprueba que el mundo es idéntico.
// Coordenadas locales de cada bioma: x desde k*BW. Los biomas comparten por ahora la misma plantilla de aldea (`VIL0`) y de zonas (`layout`); F3-C dará a cada uno la suya.
// Lo que NO está aquí todavía y sigue fijo a 5 biomas (se hace al añadir el Oriental, F3-C2): ver AGENTS.md → F3-B.
const BIOMES=(()=>{
 const BW=2300,WH=1500;
 const PAL_ALL=[{g:'#a6d24c',l:'#d4ee7a',s:'#4f9438',w:'#52d2e0'},{g:'#5f9a40',l:'#94c455',s:'#2f6e38',w:'#3fb0bf'},{g:'#9aa84a',l:'#c9d070',s:'#5a6a38',w:'#6fb59a'},
  {g:'#e9f4f8',l:'#ffffff',s:'#a9c3d6',w:'#8fd6ee'},{g:'#8fcf6e',l:'#c4ec8c',s:'#4a9a5a',w:'#5fd0b8'},{g:'#7a6a66',l:'#a8968f',s:'#3f3438',w:'#ff7a2a'}];
 const DEC_ALL=[
  {dots:['#ffffff','#ffd75a','#ff9ac0']},                                                                                                                         // Pradera: valores base de CUT
  {dots:['#e8645a','#ffd75a','#ffffff'],soil:'#7a4f30',soilL:'#9a6a42',soilD:'#4f3220',clay:'#b87a4e',rock:'#8a8578',rockL:'#bdb8a8',wl:'#c8f0e0',wd:'#2f8c9c',pa:['#a8825a','#c4a078','#7e5c3c']},    // Bosque: tierra oscura y húmeda
  {dots:['#d9b24a','#ffffff'],soil:'#5e5230',soilL:'#7e7040',soilD:'#3e3620',clay:'#8a7a4a',rock:'#6a6a58',rockL:'#9a9a82',wl:'#cfe8c0',wd:'#4a8a70',wsh:'#d8e8b0',pa:['#8a7a52','#a89a6c','#645634']},  // Pantano: barro y agua turbia
  {dots:['#7fb4e8','#ffffff'],soil:'#9db7cc',soilL:'#c4d8e6',soilD:'#6f8aa6',clay:'#cfe6f2',rock:'#8fa6bb',rockL:'#d6e4ee',wl:'#ffffff',wd:'#5fb0d8',wsh:'#f2fbff',pa:['#e8eef3','#ffffff','#b4c6d6']},          // Cumbres: hielo azulado
  {dots:['#ffb7c8','#ffffff','#ff8aa8'],soil:'#8a4a38',soilL:'#aa6048',soilD:'#5e3224',clay:'#c8806a',rock:'#7a7a82',rockL:'#a8a8b0',wl:'#c8f5e6',wd:'#2a9a8a',wsh:'#e8fff4',pa:['#b8b0a0','#d8d0c0','#8a8272'],cb:['#a8a0a0','#c8c0c0','#807878']},   // Oriental: tierra rojiza, grava rastrillada, agua jade, pétalos
  {dots:['#ffb040','#ff7a2a'],soil:'#3f3438',soilL:'#5a4a4c',soilD:'#2a2226',clay:'#6a4a48',rock:'#4a4044',rockL:'#7a6a68',wl:'#ffd95a',wd:'#c8401a',wsh:'#ffb040',fx:'rgba(255,230,120,.8)',vein:'#ff7a2a',pa:['#8a7468','#aa968a','#5a4440']}  // Volcán: roca oscura con vetas de lava
 ];
 const WC_ALL=[[[[0,7],[1,1]],[[1,7],[0,1],[2,1]],[[2,6],[1,1]]],[[[3,7],[2,1]],[[4,7],[3,1]],[[2,6],[3,1]]],[[[5,7],[4,1]],[[4,7],[5,1]]],[[[6,7],[5,1]],[[5,7],[6,1]],[[7,6],[6,1]]],[[[7,7],[6,1]],[[8,7],[7,1]]],[[[9,7],[8,1]],[[8,7],[9,1]],[[10,6],[9,1]]]],MI_ALL=[[[[0,7],[1,1]],[[1,7],[0,1]],[[2,6],[1,1]]],[[[2,7],[3,1]],[[3,7],[2,1]]],[[[4,7],[3,1]],[[5,7],[4,1]]],[[[5,7],[6,1]],[[6,7],[5,1]]],[[[6,8],[5,1]],[[7,8],[6,1]]],[[[8,8],[7,1]],[[9,8],[8,1]]]],FI_ALL=[[[[0,7],[1,1]],[[1,7],[0,1]],[[2,6],[1,1]]],[[[3,7],[2,1]],[[4,7],[3,1]]],[[[5,7],[4,1]],[[6,5],[5,1]]],[[[6,7],[5,1]],[[7,5],[6,1]]],[[[7,7],[6,1]],[[8,6],[7,1]]],[[[9,7],[8,1]],[[10,5],[9,1]]]],ING_ALL=[['vaca','oveja','gallina'],['jabali'],['rana'],['yak'],['zorro'],['lagarto']],MID_ALL=['goblin','lobo','esqueleto','ogro','oni','demonio'];
 // geometría de zonas compartida por todos los biomas: rectángulos de tala por zona, columnas de las vetas de mina
 const WR=[[[60,360,90,270]],[[60,440,1140,1222],[60,440,1318,1372]],[[620,1000,850,1000]]],MR=[[430,640],[910,1110],[1390,1600]];
 const META=[{n:'Pradera',lv:1,ic:'🌱',g:['#4a8a3e','#3f7a36','#58994a'],w:'#2f6fb5',sh:'#9fd0ff'},{n:'Bosque',lv:15,ic:'🌲',g:['#2f6a3a','#285a30','#3a7a44'],w:'#2a5f9a',sh:'#8ab8ee'},
{n:'Pantano',lv:31,ic:'🐸',g:['#55623a','#4a5632','#66744a'],w:'#3a5a3a',sh:'#8fbf8a'},{n:'Cumbres',lv:47,ic:'❄️',g:['#d6e2ea','#c4d2dc','#eaf2f7'],w:'#7ab4d8',sh:'#e8f6ff'},{n:'Oriental',lv:63,ic:'⛩️',g:['#6a9a5a','#5a8a4e','#7aaa68'],w:'#2fa890',sh:'#a8f0dc'},{n:'Volcán',lv:80,ic:'🌋',g:['#3a2a2a','#2e2020','#4a3434'],w:'#d8501a',sh:'#ffc060'}];
 const PEN=[[262,294,330,392,440],[220,247,294,330,370],[196,233,262,311,349],[294,349,392,440,523],[262,294,311,392,415],[165,175,208,247,262]],RVC=[500,1200,2500,5000,7500,11000],BRESP=[60,90,120,150,165,180],BRN=[[['air',12,24],['earth',8,16],['life',4,8]],[['earth',10,20],['life',6,12],['water',4,8]],[['water',8,16],['life',6,12],['arc',2,4]],[['fire',6,12],['water',8,14],['arc',3,6]],[['air',8,16],['arc',5,10],['life',6,12]],[['fire',8,16],['arc',6,12],['earth',10,20]]];
 const roofs=['#d0674a','#6a8fb8','#c98a3a','#8a6aa8'],walls=['#e6d2a6','#ead9b5','#dcc79a','#efe0bd'];
 const H1=(x,y,i,o)=>({n:'casa',x,y,o:Object.assign({roof:roofs[i%4],wall:walls[(i+1)%4]},o||{}),fp:[32,25]});
 // aldea de la Pradera (plantilla visual)
 const LAY=[
  // casas residenciales (norte y sur), taberna en la plaza (junto a la tienda), granero y heno al este (cerca del camino a las minas), cabañas pequeñas en los bordes. Ninguna toca el muro (x local ≥ 70) ni el agua.
  H1(110,622,0),{n:'taberna',x:338,y:622,o:{roof:'#9a4a3a'},fp:[41,31]},{n:'granero',x:482,y:650,o:{rot:1},fp:[46,34]},{n:'heno',x:405,y:692,fp:[9,9]},{n:'heno',x:418,y:704,fp:[9,9]},
  {n:'cabana',x:458,y:892,o:{rot:1},fp:[24,20]},H1(105,990,1,{w:34,d:24,rot:1}),{n:'cabana',x:190,y:1016,o:{roof:'#c98a3a'},fp:[24,20]},H1(380,970,3),{n:'pozo',x:112,y:822,fp:[9,9]},
  {n:'farola',x:178,y:752,fp:[3,3],lamp:1},{n:'farola',x:240,y:748,fp:[3,3],lamp:1},{n:'farola',x:70,y:905,fp:[3,3],lamp:1},{n:'farola',x:352,y:905,fp:[3,3],lamp:1},
  {n:'barril',x:376,y:722,fp:[5,5]},{n:'barril',x:388,y:731,fp:[5,5]},{n:'caja',x:162,y:690,fp:[5,5]},{n:'caja',x:173,y:699,fp:[5,5]},
  // portón del campamento orco (F3-D): dos torres a ambos lados del camino y empalizada
  {n:'portonOrco',x:1900,y:702,o:{side:-1},fp:[7,7]},{n:'portonOrco',x:1900,y:762,o:{side:1},fp:[7,7]},{n:'empalizada',x:1900,y:671,o:{l:48},fp:[3,24]},{n:'empalizada',x:1900,y:623,o:{l:48},fp:[3,24]},{n:'empalizada',x:1900,y:575,o:{l:48},fp:[3,24]},{n:'empalizada',x:1900,y:527,o:{l:48},fp:[3,24]},{n:'empalizada',x:1900,y:479,o:{l:48},fp:[3,24]},{n:'empalizada',x:1900,y:793,o:{l:48},fp:[3,24]},{n:'empalizada',x:1900,y:841,o:{l:48},fp:[3,24]},{n:'empalizada',x:1900,y:889,o:{l:48},fp:[3,24]},{n:'empalizada',x:1900,y:937,o:{l:48},fp:[3,24]},{n:'empalizada',x:1900,y:985,o:{l:48},fp:[3,24]}
 ];
 [120,138,156,244,262,280].forEach(x=>LAY.push({n:'valla',x,y:662,o:{len:18},fp:[9,3]}));

 // aldea (plantilla compartida): estaciones [id, nombre, dx, dy, habilidades], props, calles/plaza adoquinadas, caminos de tierra y puente sobre el río
 const ROUTES=[[[-80,769],[120,775],[200,785],[340,770],[520,740],[900,700],[1300,690],[1700,720],[2100,745],[2380,769]],
  [[200,785],[205,600],[215,420],[200,290]],[[520,740],[535,500],[540,215]],[[1000,705],[1010,450],[1010,215]],[[1450,695],[1495,450],[1495,215]],
  [[270,880],[270,1000],[268,1130],[270,1236],[270,1304],[270,1345]],[[268,1000],[420,1040],[700,1120],[740,1160]]],PLAZA=[[200,790,70]],PW=27;
 const COBS=[{p:[[150,795],[280,795]],w:100},{p:[[-30,769],[120,775],[200,785],[340,770],[470,755]],w:25},{p:[[203,690],[203,560]],w:22},{p:[[270,890],[270,1010]],w:22}],EXTRA0=[[[1500,700],[1470,900],[1470,1100]]];
 const VIL0={stations:[['bank','Banco',90,710],['shop','Tienda',300,710],['fire','Fogata',195,795,['co']],['furnace','Horno',90,875,['sm']],['anvil','Yunque',170,878,['sm']],['bench','Taller',300,875,['cr','es']],['altar','Escritorio',340,778,['ins']]],
  props:LAY,cobs:COBS,plaza:PLAZA,bridge:{x:[236,304],y:[1200,1340]}};

 // ── Bosque (F3-C): cabañas de troncos con tejado de musgo, casas en los árboles, leña y tocones; instalaciones de madera con toldo verde; adoquín cubierto de musgo ──
 const T1=(x,y,i,o)=>({n:'troncos',x,y,o:Object.assign({wall:['#a8784a','#9a6c42','#b08456'][i%3],roof:['#5f8a46','#4f7a3e','#6f9a50'][i%3]},o||{}),fp:[32,25]});
 const LAY_B=[T1(110,622,0),{n:'taberna',x:338,y:622,o:{roof:'#3f6a3a',wall:'#c9a878'},fp:[41,31]},{n:'granero',x:482,y:650,o:{wall:'#8a5a34',roof:'#4a5a3a',rot:1},fp:[46,34]},{n:'lenera',x:405,y:692,fp:[10,8]},{n:'lenera',x:420,y:704,fp:[10,8]},
  {n:'casaArbol',x:458,y:892,o:{rot:1},fp:[17,17]},T1(105,990,1,{w:34,d:24,rot:1}),{n:'casaArbol',x:190,y:1016,fp:[17,17]},T1(380,970,2,{rot:1}),{n:'pozo',x:112,y:822,fp:[9,9]},
  {n:'farola',x:178,y:752,fp:[3,3],lamp:1},{n:'farola',x:240,y:748,fp:[3,3],lamp:1},{n:'farola',x:70,y:905,fp:[3,3],lamp:1},{n:'farola',x:352,y:905,fp:[3,3],lamp:1},
  {n:'barril',x:376,y:722,fp:[5,5]},{n:'barril',x:388,y:731,fp:[5,5]},{n:'caja',x:162,y:690,fp:[5,5]},{n:'caja',x:173,y:699,fp:[5,5]},
  {n:'tocon',x:66,y:650,fp:[5,5]},{n:'tocon',x:300,y:1030,fp:[5,5]},{n:'tocon',x:420,y:930,fp:[5,5]},{n:'seta',x:150,y:600,fp:[3,3]},{n:'seta',x:400,y:600,fp:[3,3]},{n:'seta',x:90,y:1045,fp:[3,3]}];
 [120,138,156,244,262,280].forEach(x=>LAY_B.push({n:'valla',x,y:662,o:{len:18},fp:[9,3]}));
 const VIL_B=Object.assign({},VIL0,{props:LAY_B,theme:{'#b4b0a4':'#a47e52','#8e8a80':'#6e5436','#d8d4c6':'#caa874','#6f7f8f':'#3f7a3a','#c0392b':'#3f8a4a','#f7f1e1':'#efe6c8','#f1c24a':'#e0b84a'}});
 Object.assign(DEC_ALL[1],{cb:['#8f9a78','#b3bf96','#6a7456']});

 // ── Cumbres (F3-C): arquitectura NÓRDICA. Casas largas de tablones oscuros con tejado de turba nevado y remates de dragón, sala de duelas (stave) escalonada en la plaza, almacenes sobre pilotes (stabbur), piedras rúnicas, secaderos de pescado y braseros ──
 // ── Pantano (F3-C): palafitos de bayou con techo de paja, redes y barcas varadas, juncos; instalaciones de bambú con toldo mostaza ──
 const LAY_P=[{n:'palafito',x:110,y:622,o:{w:34,d:24},fp:[36,27]},{n:'palafito',x:338,y:622,o:{w:44,d:28,roof:'#b8a25a',rh:15},fp:[45,30]},{n:'stabbur',x:482,y:650,o:{wall:'#9a7a4a',roof:'#c9b36a'},fp:[20,18]},{n:'red',x:405,y:692,fp:[12,5]},{n:'red',x:432,y:706,fp:[12,5]},
  {n:'palafito',x:458,y:892,o:{w:26,d:20,rot:1,roof:'#b8a25a'},fp:[29,23]},{n:'palafito',x:105,y:990,o:{w:34,d:24,rot:1},fp:[36,27]},{n:'palafito',x:190,y:1016,o:{w:24,d:18},fp:[27,21]},{n:'palafito',x:380,y:970,o:{w:36,d:24,rot:1,wall:'#a8895a'},fp:[38,27]},{n:'pozo',x:112,y:822,fp:[9,9]},
  {n:'farola',x:178,y:752,fp:[3,3],lamp:1},{n:'farola',x:240,y:748,fp:[3,3],lamp:1},{n:'farola',x:70,y:905,fp:[3,3],lamp:1},{n:'farola',x:352,y:905,fp:[3,3],lamp:1},
  {n:'barril',x:376,y:722,fp:[5,5]},{n:'barril',x:388,y:731,fp:[5,5]},{n:'caja',x:162,y:690,fp:[5,5]},{n:'caja',x:173,y:699,fp:[5,5]},
  {n:'barca',x:290,y:1040,o:{rot:1},fp:[6,14]},{n:'barca',x:430,y:1030,fp:[6,14]},{n:'junco',x:66,y:650,fp:[4,4]},{n:'junco',x:300,y:1010,fp:[4,4]},{n:'junco',x:420,y:930,fp:[4,4]},{n:'junco',x:200,y:590,fp:[4,4]},{n:'junco',x:400,y:600,fp:[4,4]},{n:'junco',x:90,y:1045,fp:[4,4]}];
 [120,138,156,244,262,280].forEach(x=>LAY_P.push({n:'valla',x,y:662,o:{len:18},fp:[9,3]}));
 const VIL_P=Object.assign({},VIL0,{props:LAY_P,theme:{'#b4b0a4':'#9a8a5e','#8e8a80':'#6a5a3e','#d8d4c6':'#c9b784','#6f7f8f':'#6f7f3a','#c0392b':'#d9a03a','#f7f1e1':'#efe6c8','#f1c24a':'#e0b84a'}});
 Object.assign(DEC_ALL[2],{cb:['#8a8466','#aaa27c','#6e6850']});
 const LAY_C=[{n:'casaLarga',x:118,y:620,fp:[41,26]},{n:'salon',x:338,y:622,fp:[38,30]},{n:'stabbur',x:482,y:650,o:{},fp:[20,18]},{n:'rack',x:410,y:700,fp:[14,5]},{n:'rack',x:430,y:712,fp:[14,5]},
  {n:'casaLarga',x:470,y:892,o:{rot:1},fp:[41,26]},{n:'casaLarga',x:112,y:992,o:{w:40,rot:1},fp:[37,26]},{n:'stabbur',x:196,y:1016,fp:[20,18]},{n:'casaLarga',x:390,y:972,o:{wall:'#5a3e28'},fp:[41,26]},{n:'pozo',x:112,y:822,fp:[9,9]},
  {n:'brasero',x:178,y:752,fp:[3,3],lamp:1},{n:'brasero',x:240,y:748,fp:[3,3],lamp:1},{n:'brasero',x:70,y:905,fp:[3,3],lamp:1},{n:'brasero',x:352,y:905,fp:[3,3],lamp:1},
  {n:'barril',x:376,y:722,fp:[5,5]},{n:'barril',x:388,y:731,fp:[5,5]},{n:'caja',x:162,y:690,fp:[5,5]},{n:'caja',x:173,y:699,fp:[5,5]},
  {n:'runestone',x:196,y:586,fp:[5,5]},{n:'runestone',x:410,y:830,fp:[5,5]},{n:'runestone',x:76,y:1050,fp:[5,5]}];
 [120,138,156,244,262,280].forEach(x=>LAY_C.push({n:'valla',x,y:662,o:{len:18},fp:[9,3]}));
 const VIL_C=Object.assign({},VIL0,{props:LAY_C,theme:{'#b4b0a4':'#6f4e34','#8e8a80':'#4a3220','#d8d4c6':'#8a6a48','#6f7f8f':'#e4edf3','#c0392b':'#3a6aa8','#f7f1e1':'#f4f8fb','#f1c24a':'#d9b24a'}});
 Object.assign(DEC_ALL[3],{cb:['#b8c6d2','#e6eef4','#8da0b2']});
 // ── Oriental (F3-C2): casas de madera y papel con tejado de teja oscura, pagoda, torii y linternas de piedra, cerezos y bambú; instalaciones de laca roja ──
 const LAY_O=[{n:'casaJp',x:110,y:622,o:{w:34,d:24},fp:[34,25]},{n:'casaJp',x:338,y:622,o:{w:46,d:30,roof:'#8a2e2a',rh:11},fp:[44,31]},{n:'pagoda',x:482,y:650,fp:[20,20]},{n:'bambu',x:405,y:692,fp:[6,6]},{n:'bambu',x:432,y:706,fp:[6,6]},
  {n:'casaJp',x:458,y:892,o:{w:26,d:20,rot:1},fp:[27,22]},{n:'casaJp',x:105,y:990,o:{w:34,d:24,rot:1},fp:[34,25]},{n:'casaJp',x:190,y:1016,o:{w:26,d:20,wall:'#e8dcc0'},fp:[27,22]},{n:'casaJp',x:380,y:970,o:{w:38,d:24,rot:1,roof:'#4a4a58'},fp:[37,25]},{n:'pozo',x:112,y:822,fp:[9,9]},
  {n:'linterna',x:178,y:752,fp:[3,3],lamp:1},{n:'linterna',x:240,y:748,fp:[3,3],lamp:1},{n:'linterna',x:70,y:905,fp:[3,3],lamp:1},{n:'linterna',x:352,y:905,fp:[3,3],lamp:1},
  {n:'barril',x:376,y:722,fp:[5,5]},{n:'barril',x:388,y:731,fp:[5,5]},{n:'caja',x:162,y:690,fp:[5,5]},{n:'caja',x:173,y:699,fp:[5,5]},
  {n:'torii',x:610,y:733},{n:'cerezo',x:66,y:650,fp:[5,5]},{n:'cerezo',x:300,y:1030,fp:[5,5]},{n:'cerezo',x:420,y:930,fp:[5,5]},{n:'cerezo',x:200,y:590,fp:[5,5]},{n:'bambu',x:400,y:600,fp:[6,6]},{n:'bambu',x:90,y:1045,fp:[6,6]}];
 [120,138,156,244,262,280].forEach(x=>LAY_O.push({n:'valla',x,y:662,o:{len:18},fp:[9,3]}));
 const VIL_O=Object.assign({},VIL0,{props:LAY_O,theme:{'#b4b0a4':'#d8c9a8','#8e8a80':'#a89878','#d8d4c6':'#efe6d0','#6f7f8f':'#3e4250','#c0392b':'#b8302a','#f7f1e1':'#f6efe0','#f1c24a':'#e8c050'}});
 // ── Volcán (F3-C): casas de basalto con techo de paja y vetas de lava, templo escalonado, estelas talladas, vasijas y braseros; instalaciones de piedra oscura ──
 const LAY_V=[{n:'casaMaya',x:110,y:622,o:{w:34,d:24},fp:[34,25]},{n:'casaMaya',x:338,y:622,o:{w:46,d:30,rh:12},fp:[44,31]},{n:'templo',x:482,y:650,fp:[34,34]},{n:'vasija',x:405,y:692,fp:[6,6]},{n:'vasija',x:420,y:704,fp:[6,6]},
  {n:'casaMaya',x:458,y:892,o:{w:26,d:20,rot:1},fp:[27,22]},{n:'casaMaya',x:105,y:990,o:{w:34,d:24,rot:1},fp:[34,25]},{n:'casaMaya',x:190,y:1016,o:{w:26,d:20},fp:[27,22]},{n:'casaMaya',x:380,y:970,o:{w:38,d:24,rot:1},fp:[37,25]},{n:'brasero',x:112,y:822,fp:[3,3],lamp:1},
  {n:'brasero',x:178,y:752,fp:[3,3],lamp:1},{n:'brasero',x:240,y:748,fp:[3,3],lamp:1},{n:'brasero',x:70,y:905,fp:[3,3],lamp:1},{n:'brasero',x:352,y:905,fp:[3,3],lamp:1},
  {n:'barril',x:376,y:722,fp:[5,5]},{n:'barril',x:388,y:731,fp:[5,5]},{n:'caja',x:162,y:690,fp:[5,5]},{n:'caja',x:173,y:699,fp:[5,5]},
  {n:'estela',x:196,y:586,fp:[5,5]},{n:'estela',x:410,y:830,fp:[5,5]},{n:'estela',x:76,y:1050,fp:[5,5]},{n:'obsidiana',x:66,y:650,fp:[6,6]},{n:'obsidiana',x:300,y:1030,fp:[6,6]},{n:'obsidiana',x:420,y:930,fp:[6,6]},{n:'vasija',x:50,y:1040,fp:[6,6]}];
 [120,138,156,244,262,280].forEach(x=>LAY_V.push({n:'valla',x,y:662,o:{len:18},fp:[9,3]}));
 const VIL_V=Object.assign({},VIL0,{props:LAY_V,theme:{'#b4b0a4':'#6a5a58','#8e8a80':'#4a3e3c','#d8d4c6':'#8a7a74','#6f7f8f':'#3a3034','#c0392b':'#d8501a','#f7f1e1':'#e8c898','#f1c24a':'#ffb040'}});
 Object.assign(DEC_ALL[5],{cb:['#5a4a48','#7a6a66','#352c30']});
 const IDS=['pradera','bosque','pantano','cumbres','oriental','volcan'];
 const list=META.map((m,k)=>Object.assign({},m,{id:IDS[k],pal:PAL_ALL[k],dec:DEC_ALL[k],village:[VIL0,VIL_B,VIL_P,VIL_C,VIL_O,VIL_V][k],routes:ROUTES.concat(k===0?EXTRA0:[]),pathW:PW,lake:k===0,camp:k===0,
  res:{wc:WC_ALL[k],mi:MI_ALL[k],fi:FI_ALL[k]},mobs:{ing:ING_ALL[k],pack:MID_ALL[k]},music:{pen:PEN[k],wave:k===5?'sawtooth':'triangle',gain:k===5?.012:.03},rvc:RVC[k],bossResp:BRESP[k],bossRunes:BRN[k]}));
 // ── F9-L0 · MUNDO CON RECTÁNGULOS PROPIOS (13 oct 2026) ──
 // Cada bioma ocupa un rectángulo del mundo {ox,oy,w,h}; sus datos siguen en coordenadas LOCALES (x desde 0 en su borde izquierdo, y desde 0 en el superior).
 // Mundo = caja que envuelve a todos; lo que no está en ningún rectángulo es VACÍO (TER.tileH=0, infranqueable). Los pasos entre biomas son `gates`.
 // Por defecto los biomas se encadenan en horizontal (entrada por el oeste, salida por el este, tramo de paso exitE/entryW); un bioma puede traer `place:{ox,oy}` y `gate`
 // propios (mapa 2D). `lay` = zonas de recurso y agua del bioma (esquema único; los biomas aún con el layout antiguo lo reciben de legacyLay()).
 const LW=2304,LH=1504,TQ=32;   // tamaños múltiplos de un tile (ISO.TILE=32) para que el anillo de borde y las compuertas caigan alineados
 // layout antiguo (plantilla común a todos los biomas): se expresa con el esquema `lay` para que game.js tenga un solo camino de código
 const legacyLay=b=>({
  water:[[476,984,1178,1378],[-40,236,1236,1304],[304,476,1236,1304]].concat(b.lake?[[1300,1634,1118,1302]]:[]),
  wc:WR.map((r,z)=>({r,z:[[50,370,80,280],[40,476,1130,1380],[610,1010,840,1010]][z]})),
  mi:MR.map(c=>({r:[[c[0],c[1],60,190]],z:[c[0]-10,c[1]+10,40,215]})),
  fi:[{r:[[520,940,1184,1192]],z:[480,980,1168,1380],t:'Estanque'},{r:[[60,220,1242,1250],[312,440,1242,1250],[60,220,1290,1298],[312,440,1290,1298]],z:[40,476,1230,1312],t:'Río'}].concat(b.lake?[{r:[[1330,1600,1124,1132]],z:[1300,1634,1108,1306],t:'Lago'}]:[])});
 list.forEach(b=>{Object.assign(b,{w:LW,h:LH,ox:0,oy:0,spawn:[200,750],cen:[210,770],bossPos:[2130,740],exitE:[712,826],entryW:[712,826],lay:legacyLay(b)})});
  // ── F9-L2 · GEOMETRÍA ORGÁNICA DEL TERRENO (agua, playa, relieve), pura y determinista; la usan world-iso.js (tileH) y layouts.js (para colocar cosas). Coordenadas LOCALES del bioma. ──
 // lay.lakes=[{c:[x,y],r:[rx,ry],seed,amp,sand?}] lagos/ríos orgánicos (óvalo con contorno ondulado por ruido angular); lay.sea={y,amp,seed,sand} mar con costa ondulada (agua por debajo de la costa);
 // lay.hills=[{c,r,seed,amp,lv}] montículos escalonados (lv niveles de HSTEP); lay.water=[rects] agua rectangular (layout antiguo).
 const HSTEP=.3,hsh=(i,j,s)=>{const v=Math.sin(i*127.1+j*311.7+s*74.7)*43758.5453;return v-Math.floor(v)};
 const vn=(x,y,s)=>{const i=Math.floor(x),j=Math.floor(y),u=x-i,v=y-j,a=u*u*(3-2*u),b=v*v*(3-2*v),A=hsh(i,j,s),B=hsh(i+1,j,s),C=hsh(i,j+1,s),D=hsh(i+1,j+1,s);return A+(B-A)*a+(C-A)*b+(A-B-C+D)*a*b};
 // distancia normalizada al contorno ondulado de un óvalo (<1 dentro)
 const blobD=(c,r,seed,amp,lx,ly)=>{const dx=(lx-c[0])/r[0],dy=(ly-c[1])/r[1],d=Math.hypot(dx,dy);if(d>2.2)return d;const a=Math.atan2(dy,dx),ca=Math.cos(a),sa=Math.sin(a);
  return d/(1+amp*((vn(ca*1.7+seed,sa*1.7,3)-.5)*2+.5*(vn(ca*4.3,sa*4.3+seed,9)-.5)*2))};
 const seaY=(S,lx)=>S.y+S.amp*((vn(lx*.0042,S.seed,5)-.5)*2+.5*(vn(lx*.013,S.seed+3,8)-.5)*2);
 const geo={HSTEP,vn,blobD,seaY,
  water(B,lx,ly){const L=B.lay;if(!L)return false;if(L.water)for(const w of L.water)if(lx>w[0]&&lx<w[1]&&ly>w[2]&&ly<w[3])return true;
   if(L.lakes)for(const q of L.lakes)if(blobD(q.c,q.r,q.seed||1,q.amp==null?.25:q.amp,lx,ly)<1)return true;
   if(L.sea&&ly>seaY(L.sea,lx))return true;return false},
  // intensidad de arena 0..1 (1 = arena plena junto al agua, 0 = pasto)
  sand(B,lx,ly){const L=B.lay;if(!L)return 0;let m=0;
   if(L.sea){const dd=seaY(L.sea,lx)-ly,W=(L.sea.sand||170)*(1+.35*((vn(lx*.01,5,2)-.5)*2));if(dd>0&&dd<W)m=Math.max(m,Math.min(1,(W-dd)/(W*.4)))}
   if(L.lakes)for(const q of L.lakes){if(!q.sand)continue;const d=blobD(q.c,q.r,q.seed||1,q.amp==null?.25:q.amp,lx,ly);if(d>=1){const dd=(d-1)*(q.r[0]+q.r[1])/2;if(dd<q.sand)m=Math.max(m,Math.min(1,(q.sand-dd)/(q.sand*.45)))}}
   return m},
  // altura del suelo en (lx,ly): 1 llano, +HSTEP por nivel de montículo
  // ¿es roca? (montículo con rock:1 = afloramiento de piedra: mismo relieve escalonado, pintado con textura de piedra)
  rock(B,lx,ly){const L=B.lay;if(!L||!L.hills)return false;for(const q of L.hills){if(q.rock&&blobD(q.c,q.r,q.seed||1,q.amp==null?.3:q.amp,lx,ly)<1)return true}return false},
  ground(B,lx,ly){const L=B.lay;let h=1;if(!L||!L.hills)return h;for(const q of L.hills){const d=blobD(q.c,q.r,q.seed||1,q.amp==null?.3:q.amp,lx,ly);if(d<1){const lv=Math.ceil((1-d)*(q.lv||2));if(lv>0)h=Math.max(h,1+HSTEP*Math.min(q.lv||2,lv))}}return h}};
 const API={geo,WH,N:list.length,WW:0,list,gates:[],layout:{wr:WR,mr:MR}};
 // recoloca los rectángulos y recalcula WW/WH y las compuertas (se llama aquí y otra vez tras src/layouts.js)
 API.finish=()=>{let ww=0,wh=0;
  list.forEach((b,k)=>{if(b.place){b.ox=b.place.ox;b.oy=b.place.oy}else if(k===0){b.ox=0;b.oy=0}else{const a=list[k-1],c=(a.exitE[0]+a.exitE[1])/2,d=(b.entryW[0]+b.entryW[1])/2;b.ox=a.ox+a.w;b.oy=Math.round((a.oy+c-d)/TQ)*TQ}});
  const mn=list.reduce((m,b)=>Math.min(m,b.oy),0);if(mn<0)list.forEach(b=>b.oy-=mn);   // nada con y negativa
  list.forEach(b=>{ww=Math.max(ww,b.ox+b.w);wh=Math.max(wh,b.oy+b.h)});API.WW=ww;API.WH=wh;
  API.gates=list.map((b,k)=>{if(!k)return null;if(b.gate)return Object.assign({a:b.gate.a==null?k-1:b.gate.a,b:k},b.gate);const a=list[k-1];return{a:k-1,b:k,vert:true,x:b.ox,y0:a.oy+a.exitE[0],y1:a.oy+a.exitE[1]}}).filter(Boolean)};
 // bioma que contiene el punto de mundo (x,y), o -1 si es vacío
 API.at=(x,y)=>{for(let k=0;k<list.length;k++){const b=list[k];if(x>=b.ox&&x<b.ox+b.w&&y>=b.oy&&y<b.oy+b.h)return k}return -1};
 API.spawnOf=k=>{const b=list[k];return{x:b.ox+b.spawn[0],y:b.oy+b.spawn[1]}};
 API.finish();
 return API
})();
if(typeof module!=='undefined')module.exports=BIOMES;
