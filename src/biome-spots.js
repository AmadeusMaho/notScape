// NotScape · AMPLIACIÓN DE ALDEAS Y GUARIDAS CON DECORACIÓN (oct 2026). Se carga DESPUÉS de biomes.js y ANTES de game.js; amplía los datos de BIOMES.list[k] (no toca código de dibujo):
//  1) ALDEA MÁS GRANDE (pedido del dueño: «demasiado pequeña»): anillo de casas y cabañas por las calles norte/este/sur, plaza de mercado con puestos, más farolas, pozo, árboles y calles adoquinadas
//     (`village.props` y `village.cobs`), con el estilo de edificios de cada bioma (KIT). La zona segura (`village.safe` → inVilla en game.js) crece con ella. Las instalaciones NO se mueven.
//  2) GUARIDAS DECORADAS (pedido del dueño: «los spots de monstruos aparecen en un camino de la nada»): cada bioma tiene `spots` = {ing: el bicho común, pack: el grupo/campamento, camp: el campamento orco (solo Pradera)}.
//     Un spot = {id, t: título de la zona, z: [x0,x1,y0,y1], mobs: [[id,x,y],…], decor: [props], dirt: [[x,y,r]] (tierra pisada), stone: [{p,w}] (suelo adoquinado), routes: [[…]] (sendas de tierra)}.
//     game.js crea los monstruos desde `mobs`; los `decor` se suman a `village.props` (colisión por `fp`/`fps`, luz por light.js). Coordenadas locales del bioma (x desde k*BW).
// Para cambiar una guarida: editar su lista aquí. Un bioma nuevo = una entrada más en SPOTS y en KIT.
(()=>{
 const BL=BIOMES.list;
 // ---- huellas de colisión (semi-ancho, semi-fondo en px de mundo) de los modelos nuevos; null = sin colisión; dir:'y' gira 90° ----
 const FPT={tronco:[18,5],huesos:null,carpa:[16,13],estandarte:[3,3],hoguera:[10,10],antorcha:[3,3],muroRuina:o=>[(o.len||34)*.72,4],columna:[7,7],lapida:[6,3],cruz:[4,3],tumba:[13,7],verja:o=>[(o.len||18)*.85,2],
  totem:[6,6],guarida:[26,16],arbolSeco:[5,5],abrevadero:[16,6],comedero:[14,5],gallinero:[12,9],carreta:[13,8],espantapajaros:[3,3],estatuaZorro:[7,6],fumarola:[13,11],altarDemon:[15,15],charco:null,puesto:[16,10],lanzas:[7,3],
  roca:[8,6],piedra:[8,6],arbusto:[6,5],tocon:[4,4],seta:null,junco:null,heno:[9,9],barril:[5,5],caja:[5,5],pozo:[9,9],valla:o=>[(o.len||18)*.72,3],obsidiana:[6,6],estela:[5,5],vasija:[5,5],cerezo:[5,5],bambu:[4,4],pino:[5,5],roble:[6,6],sauce:[6,6],
  linterna:[3,3],brasero:[3,3],farola:[3,3],torii:null,granero:[46,34],rack:[11,3]};
 const SOLO_FPS={arcoRuina:o=>{const S=(o.span||13)*1.5;return o.dir==='y'?[[0,-S,4,4],[0,S,4,4]]:[[-S,0,4,4],[S,0,4,4]]},portillo:o=>[[-15,0,3,3],[15,0,3,3]]};
 const fpOf=(n,o)=>{o=o||{};const a=FPT[n];if(a===undefined||a===null)return null;const f=typeof a==='function'?a(o):a;return o.dir==='y'?[f[1],f[0]]:f};
 const P=(n,x,y,o,extra)=>{const e={n,x,y};if(o)e.o=o;const f=fpOf(n,o);if(f)e.fp=f;if(SOLO_FPS[n])e.fps=SOLO_FPS[n](o||{});if(extra)Object.assign(e,extra);return e};
 const L=(n,x,y,o)=>P(n,x,y,o,{lamp:1});                              // prop que emite luz de noche (light.js LAMPK)
 const fenceX=(x0,x1,y,o,step,skip)=>{const a=[];for(let x=x0;x<=x1+.1;x+=step||26)if(!skip||!skip(x))a.push(P('valla',x,y,Object.assign({len:18},o)));return a};
 const fenceY=(y0,y1,x,o,step)=>{const a=[];for(let y=y0;y<=y1+.1;y+=step||26)a.push(P('valla',x,y,Object.assign({len:18,dir:'y'},o)));return a};
 const verX=(x0,x1,y,step,skip)=>{const a=[];for(let x=x0;x<=x1+.1;x+=step||26)if(!skip||!skip(x))a.push(P('verja',x,y,{len:18}));return a};
 const verY=(y0,y1,x,step)=>{const a=[];for(let y=y0;y<=y1+.1;y+=step||26)a.push(P('verja',x,y,{len:18,dir:'y'}));return a};
 const flat=a=>[].concat(...a);

 // ═══════════════════════ 1 · ALDEA MÁS GRANDE ═══════════════════════
 // Plantilla de ampliación (misma para los 6 biomas; cada uno pone sus edificios con KIT). [tipo, x, y, rot]: M casa mediana, S cabaña, B edificio grande.
 const SLOTS=[['M',108,392,0],['M',300,392,1],['M',108,470,0],['M',300,470,1],['M',108,548,0],['S',300,548,1],['M',432,470,0],['M',432,548,0],['M',625,470,1],['M',625,548,1],['B',655,637,1],
  ['M',590,808,1],['S',520,842,1],['M',205,1092,0],['M',400,1095,1],['M',545,950,1]];
 const HRW=['#d0674a','#6a8fb8','#c98a3a','#8a6aa8'],HWL=['#e6d2a6','#ead9b5','#dcc79a','#efe0bd'];
 const KIT=[
  // Pradera: casas de cal y teja, cabañas, posada
  {M:(x,y,i,r)=>P('casa',x,y,{roof:HRW[i%4],wall:HWL[(i+1)%4],rot:r},{fp:[32,25]}),S:(x,y,i,r)=>P('cabana',x,y,{roof:HRW[(i+2)%4],rot:r},{fp:[24,20]}),B:(x,y,i,r)=>P('taberna',x,y,{roof:'#8a4a3a',rot:r},{fp:[41,31]}),lamp:'farola',tree:'roble',tfp:[6,6],
   put:[['barril'],['caja']],stall:{col:'#c0392b'}},
  // Bosque: cabañas de troncos y casas en los árboles
  {M:(x,y,i,r)=>P('troncos',x,y,{wall:['#a8784a','#9a6c42','#b08456'][i%3],roof:['#5f8a46','#4f7a3e','#6f9a50'][i%3],rot:r},{fp:[32,25]}),S:(x,y,i,r)=>P('casaArbol',x,y,{rot:r},{fp:[17,17]}),B:(x,y,i,r)=>P('taberna',x,y,{roof:'#3f6a3a',wall:'#c9a878',rot:r},{fp:[41,31]}),lamp:'farola',tree:'pino',tfp:[5,5],put:[['lenera'],['barril']],stall:{col:'#3f8a4a',col2:'#efe6c8'}},
  // Pantano: palafitos de bayou
  {M:(x,y,i,r)=>P('palafito',x,y,{w:34,d:24,rot:r},{fp:[36,27]}),S:(x,y,i,r)=>P('palafito',x,y,{w:26,d:20,rot:r,roof:'#b8a25a'},{fp:[29,23]}),B:(x,y,i,r)=>P('palafito',x,y,{w:44,d:28,roof:'#b8a25a',rh:15,rot:r},{fp:[45,30]}),lamp:'farola',tree:'sauce',tfp:[6,6],put:[['barril'],['caja']],stall:{col:'#d9a03a',col2:'#efe6c8'}},
  // Cumbres: casas largas nórdicas y almacenes sobre pilotes
  {M:(x,y,i,r)=>P('casaLarga',x,y,{wall:i%2?'#5a3e28':undefined},{fp:[41,26]}),S:(x,y,i,r)=>P('stabbur',x,y,{rot:r},{fp:[20,18]}),B:(x,y,i,r)=>P('salon',x,y,{},{fp:[38,30]}),lamp:'brasero',tree:'pino',tfp:[5,5],put:[['barril'],['caja']],stall:{col:'#3a6aa8',col2:'#f4f8fb'}},
  // Oriental: casas de madera y papel, linternas de piedra
  {M:(x,y,i,r)=>P('casaJp',x,y,{w:34,d:24,rot:r},{fp:[34,25]}),S:(x,y,i,r)=>P('casaJp',x,y,{w:26,d:20,wall:'#e8dcc0',rot:r},{fp:[27,22]}),B:(x,y,i,r)=>P('casaJp',x,y,{w:46,d:30,roof:'#8a2e2a',rh:11,rot:r},{fp:[44,31]}),lamp:'linterna',tree:'cerezo',tfp:[5,5],put:[['barril'],['caja']],stall:{col:'#b8302a',col2:'#f6efe0'}},
  // Volcán: casas de basalto y paja
  {M:(x,y,i,r)=>P('casaMaya',x,y,{w:34,d:24,rot:r},{fp:[34,25]}),S:(x,y,i,r)=>P('casaMaya',x,y,{w:26,d:20,rot:r},{fp:[27,22]}),B:(x,y,i,r)=>P('casaMaya',x,y,{w:46,d:30,rh:12,rot:r},{fp:[44,31]}),lamp:'brasero',tree:'obsidiana',tfp:[6,6],put:[['vasija'],['caja']],stall:{col:'#d8501a',col2:'#e8c898'}}];
 // farolas nuevas (a pie de calle), troncos/árboles del borde, puestos del mercado y barriles
 const LAMPS=[[228,440],[178,520],[232,560],[560,470],[512,560],[560,640],[480,716],[520,772],[610,714],[690,712],[640,772],[300,1030]];
 const TREES=[[262,350],[60,336],[420,400],[580,380],[150,1115]];
 const STALLS=[[580,698],[640,698]];
 const COBS_X=[{p:[[203,560],[205,400]],w:22},{p:[[525,745],[535,480]],w:22},{p:[[470,755],[560,742],[690,728]],w:26},{p:[[540,741],[650,731]],w:78},{p:[[270,1010],[270,1100]],w:22}];
 BL.forEach((B,k)=>{const V=B.village,kit=KIT[k];let i=0;
  SLOTS.forEach(([t,x,y,r])=>V.props.push(kit[t](x,y,i++,r)));
  LAMPS.filter((_,j)=>j%2===0).forEach(([x,y])=>V.props.push(L(kit.lamp,x,y)));   // F9: menos ruido (la mitad de las farolas)
  TREES.slice(0,3).forEach(([x,y])=>V.props.push(P(kit.ttree||kit.tree,x,y,null,{fp:kit.tfp})));
  STALLS.forEach(([x,y],j)=>V.props.push(P('puesto',x,y,Object.assign({g1:j%2?'#e0b83a':'#d9553a',g2:j%2?'#7aa84a':'#e0b83a'},kit.stall))));
  V.props.push(P(kit.put[0][0],536,702),P(kit.put[1][0],548,712),P('pozo',165,432,null,{fp:[9,9]}));
  V.cobs=V.cobs.concat(COBS_X);
  V.safe=[330,765,365,335]});          // zona segura: [cx,cy,semiancho,semialto] (inVilla en game.js)

 // ═══════════════════════ 2 · GUARIDAS CON DECORACIÓN ═══════════════════════
 const SPOTS=[];
 // ── Pradera · Rancho (vacas y gallinas) ──
 SPOTS[0]={ing:{id:'rancho',t:'🐄 Rancho',z:[760,985,455,665],
  mobs:[['vaca',810,540],['vaca',850,525],['vaca',820,580],['vaca',860,575],['oveja',885,603],['oveja',838,553],['oveja',905,628],['gallina',915,545],['gallina',945,560],['gallina',920,590],['gallina',950,600]],
  dirt:[[870,560,98]],routes:[[[870,705],[870,650],[870,615]]],
  decor:flat([fenceX(770,978,470),fenceX(770,822,650),fenceX(918,978,650),fenceY(496,626,770),fenceY(496,626,970)]).concat([
   P('portillo',870,650),P('gallinero',935,500),P('comedero',805,497),P('abrevadero',820,627),P('heno',790,596),P('heno',804,606),P('comedero',950,625,{dir:'y'}),
   P('granero',725,529,{rot:1},{fp:[46,34]}),P('heno',700,605),P('heno',714,616),P('heno',728,608),P('espantapajaros',880,438),P('roble',735,455,null,{fp:[6,6]}),P('arbusto',760,665),P('arbusto',990,680),P('barril',748,600),P('caja',758,610)])},
  // Ruinas goblin (junto al camino, antes del portón orco)
  camp:{id:'ruinas',t:'🏚️ Ruinas goblin',z:[1495,1800,545,865],
  mobs:[['goblin',1560,632],['goblin',1618,654],['goblin',1668,642],['goblin',1715,640],['goblin',1742,648],['goblin',1610,806],['goblin',1692,816]],
  stone:[{p:[[1530,615],[1760,615]],w:44},{p:[[1555,818],[1730,818]],w:36}],dirt:[[1640,700,50]],
  decor:[P('arcoRuina',1498,718,{dir:'y',span:24}),
   P('muroRuina',1545,565),P('muroRuina',1597,565),P('muroRuina',1701,565,{h:9}),P('muroRuina',1753,565),P('muroRuina',1510,598,{dir:'y'}),P('muroRuina',1510,650,{dir:'y',h:9}),P('muroRuina',1790,598,{dir:'y'}),P('muroRuina',1790,650,{dir:'y'}),
   P('muroRuina',1560,790),P('muroRuina',1612,790),P('muroRuina',1664,790,{h:8}),P('muroRuina',1716,790),P('muroRuina',1580,848),P('muroRuina',1632,848),P('muroRuina',1684,848,{h:8}),
   P('columna',1560,657,{broken:1}),P('columna',1625,572),P('columna',1685,657),P('columna',1738,655,{broken:1}),P('columna',1648,570,{broken:1}),P('columna',1545,818,{broken:1}),P('columna',1735,822),
   P('carpa',1585,600,{col:'#8a6a46'}),P('carpa',1692,598,{col:'#7f8a4a',trim:'#4a3a28'}),P('carpa',1640,819,{col:'#8a6a46'}),
   P('hoguera',1640,626),P('huesos',1618,640),P('huesos',1668,650),P('huesos',1680,826),P('barril',1735,610),P('barril',1746,621),P('caja',1535,628),P('lanzas',1722,642),P('estandarte',1762,628,{col:'#3f7a3a',mark:'#e8d9a0'}),
   P('tronco',1600,818),P('tronco',1700,830,{len:20}),P('carreta',1766,808),P('roca',1520,700),P('roca',1780,725),P('roca',1490,760),P('roca',1800,780),P('arbusto',1500,600),P('arbusto',1800,560)]},
  // Campamento orco (detrás del portón)
  orc:{id:'campamento',t:'⛺ Campamento orco',z:[1912,2235,560,905],
  mobs:[['orco',2000,650],['orco',2080,662],['orco',2005,830],['orco',2085,822]],dirt:[[2040,740,150],[2040,640,72],[2040,845,72]],
  decor:[P('carpa',1985,612,{col:'#7a3a2a',trim:'#3a2a22'}),P('carpa',2092,616,{col:'#6a3a2a',trim:'#3a2a22'}),P('carpa',1992,878,{col:'#7a3a2a',trim:'#3a2a22'}),P('carpa',2097,872,{col:'#6a3a2a',trim:'#3a2a22'}),
   P('hoguera',2036,668),P('hoguera',2036,818),P('totem',1955,650,{col:'#8a2e2a'}),P('totem',1955,832,{col:'#8a2e2a'}),
   P('estandarte',1938,672,{col:'#8a2e2a',mark:'#e8d9a0'}),P('estandarte',1938,812,{col:'#8a2e2a',mark:'#e8d9a0'}),P('estandarte',2172,672,{col:'#8a2e2a',mark:'#e8d9a0'}),P('estandarte',2172,812,{col:'#8a2e2a',mark:'#e8d9a0'}),
   P('lanzas',2002,692),P('lanzas',2072,692),P('lanzas',2004,796),P('huesos',2060,650),P('huesos',2012,842),P('huesos',2120,800),P('carreta',2158,862),P('barril',2122,640),P('barril',2134,651),P('caja',2180,640),P('rack',2150,640),P('arbolSeco',1930,590),P('arbolSeco',2200,900)]}};

 // 14 oct 2026: rancho 1,6× más grande (pedido del dueño: «todo muy junto»); las ovejas se fueron a su propio prado (layouts.js, sp.pack)
 ;(()=>{const s=SPOTS[0].ing,cx=870,cy=560,F=1.6,fx=x=>Math.round(cx+(x-cx)*F),fy=y=>Math.round(cy+(y-cy)*F);
  const rest=s.decor.filter(d=>d.n!=='valla').map(d=>Object.assign({},d,{x:fx(d.x),y:fy(d.y)}));
  s.decor=flat([fenceX(fx(770),fx(978),fy(470)),fenceX(fx(770),fx(822),fy(650)),fenceX(fx(918),fx(978),fy(650)),fenceY(fy(496),fy(626),fx(770)),fenceY(fy(496),fy(626),fx(970))]).concat(rest);
  s.mobs=s.mobs.filter(m=>m[0]!=='oveja').map(([id,x,y])=>[id,fx(x),fy(y)]);
  s.dirt=[[fx(870),fy(560),Math.round(98*F)]];s.routes=s.routes.map(r=>r.map(q=>[fx(q[0]),fy(q[1])]));
  s.z=[fx(s.z[0]),fx(s.z[1]),fy(s.z[2]),fy(s.z[3])]})();
 // ── Bosque · claro de jabalíes y guarida de lobos ──
 SPOTS[1]={ing:{id:'claro',t:'🐗 Claro de jabalíes',z:[765,985,465,650],mobs:[['jabali',830,555],['jabali',875,545],['jabali',905,580],['jabali',850,592]],dirt:[[870,565,82]],routes:[[[870,705],[870,640],[870,600]]],
  decor:[P('tronco',812,520,{len:28}),P('tronco',942,592,{len:24}),P('tronco',860,498),P('charco',872,598,{col:'#4a3a28',water:'#7a6a48'}),P('charco',808,592,{col:'#4a3a28',water:'#7a6a48'}),P('tocon',790,560),P('tocon',942,522),P('tocon',905,622),P('seta',830,625),P('seta',930,555),P('seta',795,520),
   P('arbusto',780,610),P('arbusto',960,610),P('arbusto',800,480),P('arbusto',955,480),P('arbusto',880,640),P('pino',768,478,null,{fp:[5,5]}),P('pino',978,500,null,{fp:[5,5]}),P('roca',815,640),P('roca',925,640)]},
  pack:{id:'guarida',t:'🐺 Guarida de lobos',z:[1485,1790,520,690],mobs:[['lobo',1590,626],['lobo',1640,612],['lobo',1668,642],['lobo',1612,652],['lobo',1702,624],['lobo',1550,642]],dirt:[[1625,625,105]],
  decor:[P('guarida',1562,596),P('guarida',1698,588),P('guarida',1630,560),P('arbolSeco',1515,640),P('arbolSeco',1740,640),P('arbolSeco',1595,675),P('arbolSeco',1665,677),P('huesos',1600,630),P('huesos',1650,625),P('huesos',1685,650),P('huesos',1545,615),P('huesos',1715,610),P('huesos',1625,660),
   P('tronco',1560,650,{len:26}),P('tronco',1720,660),P('roca',1500,590),P('roca',1760,590),P('roca',1630,675),P('arbusto',1510,560),P('arbusto',1770,640)]}};
 // ── Pantano · charca de ranas y cementerio ──
 SPOTS[2]={ing:{id:'charca',t:'🐸 Charca de ranas',z:[765,985,465,650],mobs:[['rana',825,560],['rana',880,555],['rana',862,590],['rana',905,572]],dirt:[[870,568,78]],routes:[[[870,705],[870,640],[870,605]]],
  decor:[P('charco',838,545,{col:'#3f4a2a',water:'#7aa890'}),P('charco',898,588,{col:'#3f4a2a',water:'#7aa890'}),P('charco',850,602,{col:'#3f4a2a',water:'#7aa890'}),P('charco',918,545,{col:'#3f4a2a',water:'#7aa890'}),
   P('junco',790,520),P('junco',800,600),P('junco',945,520),P('junco',950,600),P('junco',870,500),P('junco',880,630),P('junco',830,500),P('tronco',900,520,{len:26}),P('tronco',820,625),P('seta',780,560),P('seta',955,565),P('seta',905,625),P('arbolSeco',780,490),P('tocon',960,640)]},
  pack:{id:'cementerio',t:'⚰️ Cementerio',z:[1485,1715,525,700],mobs:[['esqueleto',1560,600],['esqueleto',1600,590],['esqueleto',1642,606],['esqueleto',1580,642],['esqueleto',1622,636],['esqueleto',1672,632]],dirt:[[1600,610,92]],
  decor:flat([verX(1500,1700,540),verX(1500,1552,680),verX(1648,1700,680),verY(566,654,1500),verY(566,654,1700)]).concat([
   P('lapida',1530,578,{v:0}),P('lapida',1572,570,{v:1}),P('lapida',1614,578,{v:2}),P('lapida',1656,570,{v:0}),P('lapida',1530,618,{v:2}),P('lapida',1566,652,{v:1}),P('lapida',1660,612,{v:1}),P('lapida',1690,585,{v:2}),P('lapida',1512,652,{v:0}),P('lapida',1684,650,{v:2}),
   P('cruz',1546,598),P('cruz',1640,590),P('cruz',1598,660),P('cruz',1676,628),P('tumba',1572,622),P('tumba',1625,648),P('arbolSeco',1520,556),P('arbolSeco',1684,666),
   P('antorcha',1510,552),P('antorcha',1690,552),P('antorcha',1510,668),P('antorcha',1690,668),P('antorcha',1585,684),P('antorcha',1615,684)])}};
 // ── Cumbres · corral de yaks y campamento de ogros ──
 SPOTS[3]={ing:{id:'corral',t:'🦬 Corral de yaks',z:[765,975,455,665],mobs:[['yak',822,556],['yak',866,544],['yak',902,572],['yak',852,588]],dirt:[[870,565,92]],routes:[[[870,705],[870,650],[870,612]]],
  decor:flat([fenceX(790,950,500),fenceX(790,822,620),fenceX(918,950,620),fenceY(526,594,790),fenceY(526,594,950)]).concat([
   P('portillo',870,620),P('comedero',832,528),P('comedero',912,530),P('abrevadero',828,600,{water:'#bfe6f2'}),P('heno',908,603),P('heno',920,592),P('roca',770,640),P('roca',985,640),P('roca',775,520),P('pino',768,470,null,{fp:[5,5]}),P('pino',975,520,null,{fp:[5,5]}),P('pino',790,660,null,{fp:[5,5]})])},
  pack:{id:'ogros',t:'🍖 Campamento de ogros',z:[1485,1790,520,700],mobs:[['ogro',1568,628],['ogro',1596,652],['ogro',1664,654],['ogro',1696,628],['ogro',1650,598],['ogro',1608,598]],dirt:[[1632,625,110]],
  decor:[P('carpa',1560,586,{col:'#7a6a5a',trim:'#3a2a22'}),P('carpa',1705,584,{col:'#6a6a72',trim:'#3a2a22'}),P('carpa',1632,560,{col:'#7a6a5a',trim:'#3a2a22'}),P('totem',1525,640),P('totem',1745,640),P('hoguera',1631,628),P('hoguera',1560,660),
   P('huesos',1590,625),P('huesos',1690,600),P('huesos',1665,670),P('huesos',1545,615),P('huesos',1715,650),P('carreta',1755,600,{load:'#c9a070'}),P('arbolSeco',1510,560),P('arbolSeco',1770,570),P('lanzas',1595,676),P('lanzas',1680,678),P('roca',1500,680),P('roca',1790,690),P('roca',1620,690)]}};
 // ── Oriental · santuario de zorros y templo en ruinas ──
 SPOTS[4]={ing:{id:'santuario',t:'🦊 Santuario de zorros',z:[765,985,455,680],mobs:[['zorro',815,562],['zorro',870,545],['zorro',925,566],['zorro',870,588]],stone:[{p:[[870,700],[870,520]],w:26}],dirt:[],routes:[],
  decor:[P('torii',870,672,{rot:1}),L('linterna',845,640),L('linterna',895,640),L('linterna',845,596),L('linterna',895,596),L('linterna',845,530),L('linterna',895,530),P('estatuaZorro',822,520),P('estatuaZorro',918,520),P('estatuaZorro',822,610),P('estatuaZorro',918,610),
   P('cerezo',780,480),P('cerezo',962,486),P('cerezo',782,625),P('cerezo',968,628),P('bambu',770,560),P('bambu',984,560),P('bambu',805,470),P('bambu',940,470),P('roca',790,590),P('roca',950,590),P('roca',860,470)]},
  pack:{id:'templo',t:'👹 Templo en ruinas',z:[1485,1775,500,700],mobs:[['oni',1580,592],['oni',1630,580],['oni',1682,596],['oni',1600,632],['oni',1662,634],['oni',1632,610]],stone:[{p:[[1545,598],[1720,598]],w:62}],
  decor:[P('columna',1540,545,{col:'#c0392b',dark:'#8a2420',moss:false}),P('columna',1600,545,{col:'#c0392b',dark:'#8a2420',moss:false,broken:1}),P('columna',1660,545,{col:'#c0392b',dark:'#8a2420',moss:false}),P('columna',1720,545,{col:'#c0392b',dark:'#8a2420',moss:false,broken:1}),
   P('columna',1540,655,{col:'#c0392b',dark:'#8a2420',moss:false}),P('columna',1720,655,{col:'#c0392b',dark:'#8a2420',moss:false,broken:1}),P('arcoRuina',1630,672,{col:'#c0392b',dark:'#8a2420',moss:'#d6c8a0',span:30}),
   P('muroRuina',1578,540,{col:'#d8c9a8',dark:'#a89878',moss:'#7fb050'}),P('muroRuina',1690,540,{col:'#d8c9a8',dark:'#a89878',h:9,moss:'#7fb050'}),P('muroRuina',1500,598,{dir:'y',col:'#d8c9a8',dark:'#a89878',moss:'#7fb050'}),P('muroRuina',1755,598,{dir:'y',col:'#d8c9a8',dark:'#a89878',h:9,moss:'#7fb050'}),
   L('linterna',1570,620),L('linterna',1690,620),L('linterna',1630,545),P('estandarte',1514,640,{col:'#8a2e2a'}),P('estandarte',1750,640,{col:'#8a2e2a'}),P('estandarte',1630,525,{col:'#8a2e2a'}),P('huesos',1600,620),P('huesos',1655,612),P('huesos',1700,640),P('huesos',1560,648),P('cerezo',1500,540,null,{fp:[5,5]}),P('cerezo',1770,545,null,{fp:[5,5]})]}};
 // ── Volcán · campo de lava de lagartos y ruinas demoníacas ──
 SPOTS[5]={ing:{id:'lava',t:'🦎 Campo de lava',z:[765,985,455,680],mobs:[['lagarto',850,552],['lagarto',888,562],['lagarto',868,586],['lagarto',905,592]],dirt:[[870,565,92]],routes:[[[870,705],[870,640],[870,605]]],
  decor:[P('fumarola',815,520),P('fumarola',930,525),P('fumarola',825,612),P('fumarola',925,607),P('obsidiana',790,560),P('obsidiana',955,570),P('obsidiana',870,500),P('obsidiana',880,635),P('roca',775,500),P('roca',975,630),P('roca',775,640),P('huesos',840,600),P('huesos',900,530),P('huesos',950,600),P('estela',800,490),P('estela',945,485)]},
  pack:{id:'ruinas',t:'😈 Ruinas demoníacas',z:[1485,1775,500,700],mobs:[['demonio',1580,602],['demonio',1680,602],['demonio',1602,638],['demonio',1660,638],['demonio',1630,552],['demonio',1630,646]],stone:[{p:[[1545,600],[1720,600]],w:56}],dirt:[],
  decor:[P('altarDemon',1632,592),P('estela',1560,548),P('estela',1708,548),P('estela',1560,650),P('estela',1708,650),L('brasero',1592,562),L('brasero',1672,562),L('brasero',1592,640),L('brasero',1672,640),
   P('columna',1530,600,{col:'#4a4044',dark:'#3a3034',moss:false}),P('columna',1740,600,{col:'#4a4044',dark:'#3a3034',moss:false,broken:1}),P('columna',1632,530,{col:'#4a4044',dark:'#3a3034',moss:false,broken:1}),P('columna',1632,668,{col:'#4a4044',dark:'#3a3034',moss:false}),
   P('muroRuina',1560,526,{col:'#4a4044',dark:'#3a3034',moss:'#4a4044'}),P('muroRuina',1700,526,{col:'#4a4044',dark:'#3a3034',h:9,moss:'#4a4044'}),P('muroRuina',1510,660,{dir:'y',col:'#4a4044',dark:'#3a3034',moss:'#4a4044'}),
   P('obsidiana',1500,560),P('obsidiana',1765,640),P('obsidiana',1600,680),P('fumarola',1500,640),P('fumarola',1760,570),P('huesos',1600,612),P('huesos',1665,615),P('huesos',1700,578)]}};


 // ── progresión v2 · GUARIDA DEL CAPITÁN de cada bioma (spot `cap`): la 6.ª criatura del bioma + su capitán, que custodia el Sello que abre al jefe (ver game.js `sealed`). Zona z=[1160,1500,990,1290], camino desde la carretera principal. ──
 const CAPS=[null,
  {id:'cueva',t:'🐻 Cueva del oso',mobs:[['oso',1250,1090],['oso',1410,1100],['oso',1260,1200],['oso',1420,1205],['k1',1335,1140]],
   decor:[P('guarida',1335,1075),P('guarida',1235,1150),P('guarida',1440,1160),P('arbolSeco',1190,1040),P('arbolSeco',1480,1030),P('arbolSeco',1200,1260),P('arbolSeco',1470,1255),P('huesos',1300,1120),P('huesos',1372,1170),P('huesos',1330,1215),P('huesos',1250,1140),P('tronco',1290,1230,{len:26}),P('tronco',1400,1040),P('roca',1180,1130),P('roca',1490,1140),P('roca',1330,1020),P('arbusto',1200,1190),P('arbusto',1465,1195),P('pino',1170,1010,null,{fp:[5,5]}),P('pino',1495,1250,null,{fp:[5,5]})]},
  {id:'aquelarre',t:'🧙 Aquelarre de la bruja',mobs:[['bruja',1250,1090],['bruja',1410,1100],['bruja',1262,1200],['bruja',1418,1205],['k2',1335,1140]],
   decor:[P('hoguera',1335,1175),P('charco',1250,1150,{col:'#3f4a2a',water:'#7aa890'}),P('charco',1420,1150,{col:'#3f4a2a',water:'#7aa890'}),P('charco',1335,1070,{col:'#3f4a2a',water:'#7aa890'}),P('antorcha',1290,1110),P('antorcha',1380,1110),P('antorcha',1290,1210),P('antorcha',1380,1210),
    P('lapida',1200,1090,{v:1}),P('lapida',1470,1090,{v:2}),P('cruz',1190,1200),P('cruz',1480,1210),P('arbolSeco',1180,1030),P('arbolSeco',1490,1040),P('arbolSeco',1200,1265),P('arbolSeco',1470,1262),P('seta',1300,1060),P('seta',1380,1250),P('seta',1230,1230),P('seta',1445,1235),P('junco',1180,1120),P('junco',1490,1160),P('tocon',1335,1250),P('huesos',1305,1160),P('huesos',1365,1125)]},
  {id:'fortaleza',t:'🧊 Fortaleza del gigante',mobs:[['gigante',1250,1090],['gigante',1410,1100],['gigante',1262,1200],['gigante',1418,1205],['k3',1335,1140]],
   decor:[P('carpa',1215,1060,{col:'#7a6a5a',trim:'#3a2a22'}),P('carpa',1450,1058,{col:'#6a6a72',trim:'#3a2a22'}),P('carpa',1335,1050,{col:'#7a6a5a',trim:'#3a2a22'}),P('totem',1185,1150),P('totem',1485,1150),P('hoguera',1335,1190),P('hoguera',1260,1250),P('hoguera',1410,1250),P('estandarte',1190,1100,{col:'#3a6aa8',mark:'#e8f4ff'}),P('estandarte',1480,1100,{col:'#3a6aa8',mark:'#e8f4ff'}),
    P('huesos',1300,1110),P('huesos',1370,1130),P('huesos',1335,1235),P('lanzas',1290,1250),P('lanzas',1380,1255),P('rack',1200,1230),P('carreta',1470,1235,{load:'#c9a070'}),P('roca',1170,1030),P('roca',1495,1030),P('roca',1330,1280),P('pino',1165,1190,null,{fp:[5,5]}),P('pino',1500,1200,null,{fp:[5,5]})]},
  {id:'dojo',t:'🥷 Dojo de sombras',mobs:[['shinobi',1250,1090],['shinobi',1410,1100],['shinobi',1262,1200],['shinobi',1418,1205],['k4',1335,1140]],stone:[{p:[[1200,1140],[1470,1140]],w:70}],
   decor:[P('torii',1335,1020,{rot:1}),L('linterna',1250,1060),L('linterna',1420,1060),L('linterna',1250,1230),L('linterna',1420,1230),L('linterna',1335,1085),P('muroRuina',1220,1000,{col:'#d8c9a8',dark:'#a89878',moss:'#7fb050'}),P('muroRuina',1450,1000,{col:'#d8c9a8',dark:'#a89878',moss:'#7fb050'}),P('muroRuina',1180,1260,{dir:'y',col:'#d8c9a8',dark:'#a89878'}),P('muroRuina',1490,1260,{dir:'y',col:'#d8c9a8',dark:'#a89878'}),
    P('estandarte',1200,1190,{col:'#24242e',mark:'#b8302a'}),P('estandarte',1470,1190,{col:'#24242e',mark:'#b8302a'}),P('bambu',1175,1090),P('bambu',1495,1090),P('bambu',1190,1250),P('bambu',1480,1255),P('cerezo',1330,1275,null,{fp:[5,5]}),P('cerezo',1165,1040,null,{fp:[5,5]}),P('roca',1500,1050),P('roca',1170,1170)]},
  {id:'forja',t:'🌋 Forja del coloso',mobs:[['golem',1250,1090],['golem',1410,1100],['golem',1262,1200],['golem',1418,1205],['k5',1335,1140]],
   decor:[P('altarDemon',1335,1070),P('fumarola',1230,1140),P('fumarola',1445,1140),P('fumarola',1335,1230),P('obsidiana',1185,1060),P('obsidiana',1490,1060),P('obsidiana',1190,1235),P('obsidiana',1485,1240),L('brasero',1280,1100),L('brasero',1390,1100),L('brasero',1280,1200),L('brasero',1390,1200),
    P('estela',1210,1090),P('estela',1460,1090),P('estela',1220,1215),P('estela',1455,1215),P('columna',1170,1150,{col:'#4a4044',dark:'#3a3034',moss:false,broken:1}),P('columna',1500,1150,{col:'#4a4044',dark:'#3a3034',moss:false}),P('huesos',1300,1150),P('huesos',1370,1130),P('roca',1330,1275),P('roca',1180,1010)]}];
 CAPS.forEach((c,k)=>{if(!c)return;c.z=[1160,1500,990,1290];c.dirt=[[1335,1140,125]];c.routes=[[[1300,690],[1315,860],[1330,985]]];SPOTS[k].cap=c});

 // ── aplicar: los decor entran en village.props; suelos y sendas en cobs/plaza/routes; las zonas se leen en game.js (ZS) ──
 BL.forEach((B,k)=>{const V=B.village,S=SPOTS[k];B.spots=S;V.plaza=V.plaza.slice();B.routes=B.routes.slice();let st=[];
  ['ing','pack','camp','orc','cap'].forEach(key=>{const s=S[key];if(!s)return;s.decor.forEach(e=>V.props.push(e));(s.dirt||[]).forEach(d=>V.plaza.push(d));(s.routes||[]).forEach(r=>B.routes.push(r));st=st.concat(s.stone||[])});
  V.cobs=V.cobs.concat(st)});
 BIOMES.tk={P,L,KIT,SPOTS,flat,fenceX,fenceY,fpOf};   // para src/layouts.js (layout nuevo por bioma)
})();
