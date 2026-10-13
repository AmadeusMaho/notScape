// NotScape · F9 · LAYOUTS NUEVOS POR BIOMA (13 oct 2026). Se carga DESPUÉS de biome-spots.js y ANTES de props/world-iso/game.
// Un bioma con layout nuevo trae aquí su rectángulo (w,h), su aldea en el CENTRO, sus zonas de recurso (`lay`), sus guaridas y sus caminos, y sustituye lo que antes
// salía de la plantilla común (biomes.js + biome-spots.js). Los biomas que no están aquí siguen con el layout antiguo (legacyLay) hasta que les toque.
// Modelo («anillos de peligro»): anillo 0 = aldea (zona segura) · anillo 1 = recursos de nivel bajo y la primera guarida · anillo 2 = recursos medios y guaridas medias ·
// anillo 3 = borde: guarida difícil, minerales altos, el jefe y el paso (compuerta) al bioma siguiente. Caminos de tierra unen la aldea con cada nodo.
// Todo en coordenadas LOCALES del bioma (0,0 = esquina noroeste de su rectángulo). Ver AGENTS.md «F9».
(()=>{
 const TK=BIOMES.tk,P=TK.P,L=TK.L,KIT=TK.KIT,flat=TK.flat;
 const sh=(dx,dy)=>({pt:q=>[q[0]+dx,q[1]+dy],
  prop:e=>Object.assign({},e,{x:e.x+dx,y:e.y+dy}),
  spot:s=>{const o=Object.assign({},s);o.z=[s.z[0]+dx,s.z[1]+dx,s.z[2]+dy,s.z[3]+dy];o.mobs=s.mobs.map(([id,x,y])=>[id,x+dx,y+dy]);
   if(s.dirt)o.dirt=s.dirt.map(d=>[d[0]+dx,d[1]+dy,d[2]]);if(s.stone)o.stone=s.stone.map(r=>({p:r.p.map(q=>[q[0]+dx,q[1]+dy]),w:r.w}));if(s.routes)o.routes=s.routes.map(r=>r.map(q=>[q[0]+dx,q[1]+dy]));
   o.decor=s.decor.map(e=>Object.assign({},e,{x:e.x+dx,y:e.y+dy}));return o}});


 // bosques: elipses de árboles sólidos con RNG con semilla (mismo mundo en cada carga). Evitan caminos, aldea, agua, riscos, zonas de recurso/guarida y otros props.
 const DENS=2.7;   // densidad de los bosques (1 = rala, ~3 = bosque cerrado con caminos)
 function groves(B,defs){let sd=90210;const rnd=()=>{sd=(sd+0x6D2B79F5)|0;let t=Math.imul(sd^sd>>>15,1|sd);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  const segs=[];B.routes.forEach(r=>{for(let i=0;i<r.length-1;i++)segs.push([r[i][0],r[i][1],r[i+1][0],r[i+1][1]])});
  const dseg=(x,y,a)=>{const dx=a[2]-a[0],dy=a[3]-a[1],l=dx*dx+dy*dy||1,u=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/l));return Math.hypot(x-a[0]-dx*u,y-a[1]-dy*u)};
  const G=BIOMES.geo,wet=(x,y)=>[[0,0],[44,0],[-44,0],[0,44],[0,-44],[32,32],[-32,-32]].some(o=>G.water(B,x+o[0],y+o[1]))||G.sand(B,x,y)>.08,
   holes=[].concat((B.lay.cliff||[]).map(w=>[w[0]-45,w[1]+45,w[2]-45,w[3]+45]),B.lay.water?B.lay.water.map(w=>[w[0]-45,w[1]+45,w[2]-45,w[3]+45]):[],
   B.lay.wc.concat(B.lay.mi,B.lay.fi).map(q=>[q.z[0]-40,q.z[1]+40,q.z[2]-40,q.z[3]+40]),(B.pois||[]).map(p=>{const r=p.k==='camp'?130:85;return[p.x-r,p.x+r,p.y-r,p.y+r]}),Object.values(B.spots).map(s=>[s.z[0]-60,s.z[1]+60,s.z[2]-60,s.z[3]+60]),[[B.village.safe[0]-B.village.safe[2]-40,B.village.safe[0]+B.village.safe[2]+40,B.village.safe[1]-B.village.safe[3]-40,B.village.safe[1]+B.village.safe[3]+40]]);
  const have=B.village.props.filter(e=>e.fp||e.fps).map(e=>[e.x,e.y]),mine=[];
  for(const[cx,cy,rx,ry,n0,kinds]of defs){const n=Math.round(n0*DENS);let k=0,tries=0;while(k<n&&tries++<n*40){const a=rnd()*6.2832,r=Math.sqrt(rnd()),x=cx+Math.cos(a)*rx*r,y=cy+Math.sin(a)*ry*r;
    if(x<90||y<90||x>B.w-90||y>B.h-90)continue;if(holes.some(h=>x>h[0]&&x<h[1]&&y>h[2]&&y<h[3])||wet(x,y))continue;if(segs.some(s=>dseg(x,y,s)<60))continue;
    if(have.some(q=>Math.hypot(q[0]-x,q[1]-y)<48)||mine.some(q=>Math.hypot(q[0]-x,q[1]-y)<54))continue;
    const kind=kinds[Math.floor(rnd()*kinds.length)];mine.push([x,y]);B.village.props.push(P(kind,Math.round(x),Math.round(y),null,{fp:kind==='pino'?[5,5]:[6,6]}));k++}}}
 // ═════════════════════════ PRADERA · 4600×3000, aldea al centro ═════════════════════════
 {const B=BIOMES.list[0],S0=TK.SPOTS[0],CX=2300,CY=1500,old=B.village;
  const kit=KIT[0];let i=0;const H=(t,x,y,r)=>kit[t](CX+x,CY+y,i++,r||0);
  // ── aldea (menos cosas, mejor repartidas: las instalaciones se leen; las casas flanquean 4 calles que salen de la plaza) ──
  const props=[
   H('M',-120,-312,0),H('M',-200,-395,0),H('M',210,-405,1),H('B',120,335,1),            // calle norte (el hueco de las dos casas más cercanas es de Taller y Escritorio) y taberna al sur de la plaza
   H('M',-345,-115,1),H('S',-350,125,0),H('M',345,-115,1),H('S',352,122,1),              // calles oeste y este
   H('M',-200,292,0),H('M',205,298,1)];                                                  // calle sur
  [[-80,-55],[80,-55],[-80,55],[80,55],[0,-285],[0,300]].forEach(([x,y])=>props.push(L(kit.lamp,CX+x,CY+y)));   // 4 farolas en la plaza y 2 en los extremos de la calle
  props.push(P('puesto',CX+240,CY-48,Object.assign({g1:'#d9553a',g2:'#e0b83a'},kit.stall)),P('puesto',CX+300,CY-48,Object.assign({g1:'#e0b83a',g2:'#7aa84a'},kit.stall)));
  [[-400,-215],[405,-210],[-395,235],[400,230]].forEach(([x,y])=>props.push(P(kit.tree,CX+x,CY+y,null,{fp:kit.tfp})));
  props.push(P('pozo',CX-150,CY-45,null,{fp:[9,9]}),P('barril',CX-232,CY-100),P('barril',CX-220,CY-91));
  // ── rincones de las instalaciones (oct 2026): cada una tiene su sitio y su decoración con sentido; la plaza queda para banco y tienda ──
  const D=(n,x,y,o,fp)=>props.push(P(n,CX+x,CY+y,o||null,fp?{fp}:undefined)),LP=(x,y)=>props.push(L(kit.lamp,CX+x,CY+y));
  D('banca',-62,42,null,[11,4]);D('banca',62,42,null,[11,4]);D('estandarte',-95,-135,{col:'#4a6ab0'});D('estandarte',95,-135,{col:'#c0502a'});
  // herrería (horno + yunque), al norte junto al camino de la cantera: cobertizo de dos muros y tejado (ancla = esquina trasera), abrevadero, carbón, lingotes, muela, brasero, rack de armas y carreta de mena
  props.push(P('herreria',CX+145,CY-665,null,{fps:[[32,3,32,4],[3,32,4,32]]}));   // cobertizo del herrero al fondo del patio (NE): antes estaba justo detrás del horno/yunque y su tejado se solapaba con ambos (medido por píxeles: 49 % del horno, 59 % del yunque)
  D('tinaja',44,-503,null,[13,6]);D('carbon',152,-548,null,[8,7]);D('lingotes',138,-515,{col:'#c8742a'});D('muela',22,-540,null,[7,6]);
  D('brasero',150,-590,null,[6,6]);D('lanzas',30,-512);D('barril',30,-575,null,[6,6]);D('barril',18,-562,null,[6,6]);D('caja',170,-502,null,[8,7]);D('caja',182,-492);
  D('carreta',190,-575,{load:'#8a8a98'},[16,10]);D('tocon',200,-540,null,[7,6]);D('lenera',214,-512,null,[12,8]);LP(2,-505);
  // cocina al aire libre (fogata), junto al camino del estanque: asador sobre el fuego, olla, secadero de pescado, cesta, troncos para sentarse y la tienda
  {const X=385,Y=292;[['tronco',-38,32,{len:26}],['tronco',42,36,{len:26}],['tronco',2,-44,{len:24}]].forEach(([n,x,y,o])=>D(n,X+x,Y+y,o));D('asador',X,Y-6,null,[14,3]);D('olla',X+40,Y-10,null,[7,6]);D('carpa',X-72,Y-26,{col:'#8a6a3a'},[10,10]);D('secadero',X+62,Y-34,null,[12,4]);D('cestaPeces',X+60,Y+16,null,[7,6]);D('barril',X-74,Y+12,null,[6,6]);D('caja',X+86,Y+4,null,[8,7]);}
  // taller de artesanía (noroeste de la plaza): leña apilada, tablones, caballete de aserrado, tocón de trabajo, cajas y una carreta
  {const X=-270,Y=-255;D('pilaTroncos',X-52,Y+34,null,[10,8]);D('tablones',X+45,Y-45,null,[11,5]);D('caballete',X-30,Y-48,null,[11,5]);D('tocon',X+42,Y+26,null,[7,6]);D('caja',X+66,Y+6,null,[8,7]);D('barril',X+80,Y+14,null,[6,6]);D('carreta',X-84,Y-6,{load:'#a07040'},[16,10]);LP(X-58,Y-30);}
  // escritorio del escriba (noreste): estantería de libros, atril, cesta de rollos, candelabro, estandarte y farol
  {const X=275,Y=-255;D('estanteria',X-40,Y-42,null,[13,4]);D('atril',X+40,Y+16,null,[6,6]);D('rollos',X-46,Y+26,null,[6,6]);D('candelabro',X+48,Y-30,null);D('estandarte',X-70,Y-10,{col:'#4a6ab0'});LP(X+70,Y+2);}
  // portón y empalizada del campamento orco (se mueven con él)
  const DOC=sh(2077,768);old.props.filter(e=>(e.n==='portonOrco'||e.n==='empalizada')&&e.x===1900).forEach(e=>props.push(DOC.prop(e)));
  // ── guaridas: las ya decoradas, movidas a su anillo ──
  const sp={ing:sh(778,1440).spot(S0.ing),camp:sh(1503,345).spot(S0.camp),orc:sh(2077,768).spot(S0.orc)};
  const st=[],plaza=[[CX,CY,115],[CX+95,CY-550,105],[CX+385,CY+292,95],[CX-270,CY-255,85],[CX+275,CY-255,85]],routes=[],dirt=[];
  ['ing','camp','orc'].forEach(k=>{sp[k].decor.forEach(e=>props.push(e));(sp[k].dirt||[]).forEach(d=>plaza.push(d));(sp[k].routes||[]).forEach(r=>routes.push(r));st.push(...(sp[k].stone||[]))});
  B.spots=sp;
  B.village=Object.assign({},old,{props,stations:[['bank','Banco',CX-125,CY-105],['shop','Tienda',CX+125,CY-105],['fire','Fogata',CX+385,CY+292,['co']],['furnace','Horno',CX+112,CY-570,['sm']],['anvil','Yunque',CX+66,CY-528,['sm']],['bench','Taller',CX-270,CY-255,['cr','es']],['altar','Escritorio',CX+275,CY-255,['ins']]],
   plaza,bridge:null,safe:[CX,CY,470,470],
   cobs:[{p:[[CX-70,CY],[CX+70,CY]],w:130},{p:[[CX,CY-120],[CX,CY-320]],w:24},{p:[[CX,CY+120],[CX,CY+340]],w:24},{p:[[CX-130,CY],[CX-400,CY]],w:24},{p:[[CX+130,CY],[CX+420,CY]],w:24},{p:[[CX+60,CY-540],[CX+160,CY-565]],w:70}].concat(st)});
  // ── caminos de tierra (aldea → cada nodo) ──
  B.routes=routes.concat([
   [[360,1520],[900,1510],[1500,1500],[2000,1500],[2300,1500],[2700,1500],[3300,1490],[3977,1500],[4620,1500]],   // camino principal oeste–este hasta la compuerta
   [[CX,CY-320],[CX,950],[2150,850]],[[CX,CY-535],[CX+60,CY-540]],[[CX,950],[2500,700],[2900,470]],                                          // norte: cantera (3 vetas)
   [[CX,CY+340],[CX,1900],[2100,2050],[1800,2150],[1648,2145]],                                                  // sur: rancho
   [[CX,1900],[2500,1840],[2780,1780]],                                                                          // sur-este: estanque
   [[1500,1500],[1350,1300],[1200,1050],[1050,900]],                                                             // oeste: bosque noroeste
   [[1500,1505],[1330,1620],[1160,1700]],                                                                         // oeste: río
   [[3050,1498],[3020,1280],[3001,1070]],                                                                        // noreste: ruinas goblin
   [[3300,1495],[3450,1800],[3600,2050]],                                                                        // sureste: bosque
   [[3400,1495],[3550,1250],[3800,1110]]]);                                                          // este: lago
  // ── zonas de recurso y agua ──
  // agua orgánica (BIOMES.geo): lagos con contorno ondulado, un río de óvalos encadenados y el mar al sur con su playa. Los puntos de pesca se reparten por TODA el agua (fishOk en game.js).
  const RIO=[[1050,1650,70,95,11],[1030,1830,82,100,12],[1075,2020,66,96,13],[1040,2200,78,100,14],[1060,2340,72,86,15]].map(([x,y,a,b,sd])=>({c:[x,y],r:[a,b],seed:sd,amp:.16,sand:46}));
  B.lay={water:[],lakes:[{c:[3800,760],r:[330,240],seed:3,amp:.3,sand:70},{c:[2850,1985],r:[200,125],seed:6,amp:.3,sand:60}].concat(RIO),
   sea:{y:2720,amp:34,seed:4,sand:150},
   hills:[{c:[1750,2300],r:[250,160],seed:3,amp:.3,lv:3},{c:[3250,1850],r:[230,150],seed:5,amp:.3,lv:2},{c:[760,1300],r:[190,140],seed:7,amp:.3,lv:2},{c:[4200,2060],r:[240,150],seed:11,amp:.3,lv:3},{c:[2350,2420],r:[300,150],seed:13,amp:.3,lv:2},
    {c:[1800,560],r:[200,130],seed:17,amp:.3,lv:2},{c:[520,2450],r:[240,160],seed:19,amp:.3,lv:2},{c:[4150,2450],r:[220,150],seed:23,amp:.3,lv:3},{c:[1500,1950],r:[150,100],seed:29,amp:.3,lv:1},{c:[3600,2250],r:[180,110],seed:31,amp:.3,lv:2},{c:[3150,950],r:[160,100],seed:37,amp:.3,lv:1},
    // afloramientos de piedra (rock:1) = zonas de minería: macizos escalonados de 3 niveles, ancho de unos 520 px; la mena queda en sus terrazas
    {c:[2050,760],r:[280,125],seed:41,amp:.22,lv:3,rock:1},{c:[2490,540],r:[280,125],seed:43,amp:.22,lv:3,rock:1},{c:[2950,330],r:[280,115],seed:47,amp:.22,lv:3,rock:1},
    {c:[3550,1560],r:[120,75],seed:51,amp:.3,lv:2,rock:1},{c:[620,1720],r:[110,70],seed:53,amp:.3,lv:2,rock:1},{c:[2750,2300],r:[120,70],seed:59,amp:.3,lv:2,rock:1},{c:[1700,1780],r:[90,60],seed:61,amp:.3,lv:1,rock:1}],
   wc:[{r:[[1280,1700,1230,1420]],z:[1240,1740,1200,1450]},{r:[[700,1300,600,1000]],z:[660,1340,560,1040]},{r:[[3400,4000,2100,2500]],z:[3360,4040,2060,2540]}],
   mi:[{r:[[1900,2200,720,800]],z:[1840,2260,640,880]},{r:[[2340,2640,500,580]],z:[2280,2700,420,620]},{r:[[2800,3100,290,370]],z:[2740,3160,210,410]}],
   fi:[{z:[2600,3110,1800,2200],t:'Estanque'},{z:[940,1190,1560,2450],t:'Río'},{z:[3400,4260,480,1060],t:'Lago'},{z:[60,4540,2640,2975],t:'Mar'}],cliff:[]};
  B.res.fi=[[[0,6],[1,1]],[[1,6],[0,2]],[[2,5],[1,2]],[[1,8],[2,3]]];   // Estanque, Río, Lago, Mar
  // ── puntos de interés (F9-L2): repartidos por la Pradera para animar a explorar. B.pois = [{id,k,n,x,y,r,tier,...}] (coordenadas LOCALES). Los lee game.js (PO, S.poi = ya saqueados, S.map = descubiertos).
  //   camp = campamento goblin con guardias y cofre · cofre = cofre escondido · santuario = bendición permanente de una vez (stat: vig +5 PV, wis +5 % XP, luck +25 % suerte, trv +5 % velocidad)
  const pois=B.pois=[];
  const camp=(id,n,x,y,tier,mobs)=>{pois.push({id,k:'camp',n,x,y,r:210,tier,mobs});
   const q=(nm,dx,dy,o,fp)=>B.village.props.push(P(nm,x+dx,y+dy,o||null,fp?{fp}:undefined));
   q('hoguera',0,34);q('carpa',-70,-6,{col:'#8a5a38'},[10,10]);q('carpa',64,-14,{col:'#6a5a3a'},[10,10]);q('estandarte',-26,-52,{col:'#4a8a3a'});q('estandarte',44,-60,{col:'#4a8a3a'});q('barril',-48,46);q('caja',58,40);q('tronco',-20,86,{len:26});q('huesos',24,76);};
  camp('c1','Campamento goblin',620,400,1,[['goblin',-60,70],['goblin',70,60],['goblin',10,-40]]);
  camp('c2','Campamento del este',4250,1280,2,[['goblin',-60,70],['bandido',70,60],['bandido',10,-40],['orco',0,100]]);
  camp('c3','Guarida de bandidos',2480,2440,2,[['bandido',-80,70],['bandido',80,60],['bandido',-40,-50],['bandido',50,-45],['k0',0,10]]);   // guarida del CAPITÁN de la Pradera: su Sello abre a Gruk (game.js sealed)
  [['s1','vig','Santuario del Vigor','#ff7a7a',1450,700],['s2','wis','Santuario de la Sabiduría','#7ad0ff',3320,2440],['s3','luck','Santuario de la Fortuna','#ffd23a',380,1950],['s4','trv','Santuario del Viajero','#9aff9a',4380,330]].forEach(([id,stat,n,col,x,y])=>{
   pois.push({id,k:'santuario',n,x,y,r:120,tier:2,stat,col});B.village.props.push(P('piedra',x-30,y+10,null,{fp:[7,6]}),P('piedra',x+34,y-8,null,{fp:[7,6]}))});
  [['h1',2100,2640],['h2',880,2580],['h3',4300,2560],['h4',3450,260],['h5',1300,300],['h6',4350,1850],['h7',700,1050]].forEach(([id,x,y])=>pois.push({id,k:'cofre',n:'Cofre escondido',x,y,r:90,tier:1}));
  Object.assign(B,{w:4608,h:3008,spawn:[CX,CY+80],cen:[CX,CY],bossPos:[4210,1500],exitE:[1443,1557]});
  // ── bosques y bosquetes decorativos (árboles sólidos, con huecos para caminos, zonas, agua y guaridas) ──
  groves(B,[[1000,800,640,470,64,['roble','abedul','pino']],[1500,1330,340,230,20,['pino','roble']],[3700,2300,540,430,56,['roble','pino','abedul']],
   [700,1900,420,360,26,['abedul','roble']],[3300,2700,420,260,18,['pino','roble']],[1000,2750,520,200,22,['roble','abedul']],[4100,2200,320,220,12,['pino']],[2700,2650,380,200,16,['roble','abedul']],[600,1200,260,220,14,['pino','roble']],
   [3950,2850,420,150,14,['pino','roble']],[2200,2750,360,160,12,['roble']],[3900,300,380,170,12,['abedul','roble']],[800,420,420,200,18,['pino','abedul']]]);
 }
 // ═════════════════════ BIOMAS 1-5 · A1 (oct 2026): mismo esqueleto que la Pradera, espejado y con su propia geografía ═════════════════════
 // Cada bioma reutiliza las posiciones de la Pradera (aldea al centro, cantera, bosques, estanque, río, ruinas, rancho, campamentos, santuarios y cofres) pasadas por `mp` (espejo X/Y respecto a la aldea) para que no sean copias
 // idénticas, y añade lo propio: su fauna y su arte (KIT/SPOTS), su guarida del capitán (spot `cap`), campamentos con guardias del bioma, y una arena decorada para el jefe. Los pasos entre biomas son del mapa 2D en serpiente 3×2:
 //   fila 1: Pradera → Bosque → Pantano (E→O→) · Pantano → Cumbres por el SUR (compuerta horizontal) · fila 2: Cumbres → Oriental → Volcán (hacia el OESTE, así que esos tres están espejados en X: entran por el este y el jefe está al oeste).
 const W4=4608,H3=3008,CX=2300,CY=1500;
 const CFG=[null,
  {fx:0,fy:1,place:{ox:4608,oy:0},sea:0,gv:1.2,kinds:['pino','roble','abedul'],sd:7,bx:4210,by:1500,
   camps:[['c1','Campamento de cazadores furtivos',1,[['jabali',-60,70],['jabali',70,60],['lobo',10,-40]]],['c2','Campamento de leñadores',2,[['lobo',-60,70],['lobo',70,60],['lobo',10,-40],['oso',0,100]]]],
   col:'#4a8a3a',arena:'tocones'},
  {fx:0,fy:0,place:{ox:9216,oy:0},sea:0,gv:1.1,kinds:['sauce','sauce','arbolSeco'],sd:13,bx:4300,by:2620,exit:[[3977,1500],[4300,1520],[4320,2000],[4300,2500],[4300,3015]],xlakes:[{c:[1900,2450],r:[300,170],seed:21,amp:.32,sand:60},{c:[3500,2750],r:[260,150],seed:22,amp:.3,sand:60},{c:[2000,300],r:[240,130],seed:24,amp:.3,sand:50}],
   camps:[['c1','Campamento de pescadores',1,[['rana',-60,70],['rana',70,60],['esqueleto',10,-40]]],['c2','Refugio de la ciénaga',2,[['esqueleto',-60,70],['esqueleto',70,60],['esqueleto',10,-40],['bruja',0,100]]]],
   col:'#6f8f3a',arena:'cienaga'},
  {fx:1,fy:1,place:{ox:9216,oy:3008},sea:0,gv:.8,kinds:['pino','pino','arbolSeco'],sd:29,bx:4210,by:1500,entry:[[4300,-15],[4300,700],[4300,1480]],gate:{vert:false,x0:9216+4243,x1:9216+4357,y:3008},
   camps:[['c1','Campamento de expedición',1,[['yak',-60,70],['yak',70,60],['ogro',10,-40]]],['c2','Puesto de los gigantes',2,[['ogro',-60,70],['ogro',70,60],['ogro',10,-40],['gigante',0,100]]]],
   col:'#3a6aa8',arena:'hielo'},
  {fx:1,fy:0,place:{ox:4608,oy:3008},sea:1,gv:1,kinds:['cerezo','bambu','pino'],sd:37,bx:4210,by:1500,entry:[[4240,1520],[4620,1500]],gate:{vert:true,x:9216,y0:3008+1443,y1:3008+1557},
   camps:[['c1','Campamento ronin',1,[['zorro',-60,70],['zorro',70,60],['oni',10,-40]]],['c2','Aldea abandonada',2,[['oni',-60,70],['oni',70,60],['oni',10,-40],['shinobi',0,100]]]],
   col:'#b8302a',arena:'torii'},
  {fx:1,fy:1,place:{ox:0,oy:3008},sea:0,gv:.7,kinds:['obsidiana','arbolSeco','obsidiana'],sd:41,bx:4210,by:1500,entry:[[4240,1520],[4620,1500]],gate:{vert:true,x:4608,y0:3008+1443,y1:3008+1557},
   xlakes:[{c:[2300,2750],r:[500,170],seed:25,amp:.3,sand:40}],
   camps:[['c1','Campamento de ceniza',1,[['lagarto',-60,70],['lagarto',70,60],['demonio',10,-40]]],['c2','Puesto de los demonios',2,[['demonio',-60,70],['demonio',70,60],['demonio',10,-40],['golem',0,100]]]],
   col:'#d8501a',arena:'lava'}];
 for(let k=1;k<=5;k++){const B=BIOMES.list[k],C=CFG[k],kit=KIT[k],SP=TK.SPOTS[k];
  const mp=(x,y)=>[C.fx?4600-x:x,C.fy?3000-y:y],MP=q=>mp(q[0],q[1]),MR=r=>{const a=mp(r[0],r[2]),b=mp(r[1],r[3]);return[Math.min(a[0],b[0]),Math.max(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[1],b[1])]};
  let i=0;const H=(t,x,y,r)=>kit[t](CX+x,CY+y,i++,r||0),old=B.village;
  // ── aldea (misma distribución que la Pradera con el estilo de edificios del bioma) ──
  const props=[H('M',-120,-312,0),H('M',-200,-395,0),H('M',210,-405,1),H('B',120,335,1),H('M',-345,-115,1),H('S',-350,125,0),H('M',345,-115,1),H('S',352,122,1),H('M',-200,292,0),H('M',205,298,1)];
  [[-80,-55],[80,-55],[-80,55],[80,55],[0,-285],[0,300]].forEach(([x,y])=>props.push(L(kit.lamp,CX+x,CY+y)));
  props.push(P('puesto',CX+240,CY-48,Object.assign({g1:'#d9553a',g2:'#e0b83a'},kit.stall)),P('puesto',CX+300,CY-48,Object.assign({g1:'#e0b83a',g2:'#7aa84a'},kit.stall)));
  [[-400,-215],[405,-210],[-395,235],[400,230]].forEach(([x,y])=>props.push(P(kit.tree,CX+x,CY+y,null,{fp:kit.tfp})));
  props.push(P('pozo',CX-150,CY-45,null,{fp:[9,9]}),P('barril',CX-232,CY-100),P('barril',CX-220,CY-91));
  const D=(n,x,y,o,fp)=>props.push(P(n,CX+x,CY+y,o||null,fp?{fp}:undefined)),LP=(x,y)=>props.push(L(kit.lamp,CX+x,CY+y));
  D('banca',-62,42,null,[11,4]);D('banca',62,42,null,[11,4]);D('estandarte',-95,-135,{col:'#4a6ab0'});D('estandarte',95,-135,{col:'#c0502a'});
  props.push(P('herreria',CX+145,CY-665,null,{fps:[[32,3,32,4],[3,32,4,32]]}));
  D('tinaja',44,-503,null,[13,6]);D('carbon',152,-548,null,[8,7]);D('lingotes',138,-515,{col:'#c8742a'});D('muela',22,-540,null,[7,6]);
  D('brasero',150,-590,null,[6,6]);D('lanzas',30,-512);D('barril',30,-575,null,[6,6]);D('barril',18,-562,null,[6,6]);D('caja',170,-502,null,[8,7]);D('caja',182,-492);
  D('carreta',190,-575,{load:'#8a8a98'},[16,10]);D('tocon',200,-540,null,[7,6]);D('lenera',214,-512,null,[12,8]);LP(2,-505);
  {const X=385,Y=292;[['tronco',-38,32,{len:26}],['tronco',42,36,{len:26}],['tronco',2,-44,{len:24}]].forEach(([n,x,y,o])=>D(n,X+x,Y+y,o));D('asador',X,Y-6,null,[14,3]);D('olla',X+40,Y-10,null,[7,6]);D('carpa',X-72,Y-26,{col:'#8a6a3a'},[10,10]);D('secadero',X+62,Y-34,null,[12,4]);D('cestaPeces',X+60,Y+16,null,[7,6]);D('barril',X-74,Y+12,null,[6,6]);D('caja',X+86,Y+4,null,[8,7]);}
  {const X=-270,Y=-255;D('pilaTroncos',X-52,Y+34,null,[10,8]);D('tablones',X+45,Y-45,null,[11,5]);D('caballete',X-30,Y-48,null,[11,5]);D('tocon',X+42,Y+26,null,[7,6]);D('caja',X+66,Y+6,null,[8,7]);D('barril',X+80,Y+14,null,[6,6]);D('carreta',X-84,Y-6,{load:'#a07040'},[16,10]);LP(X-58,Y-30);}
  {const X=275,Y=-255;D('estanteria',X-40,Y-42,null,[13,4]);D('atril',X+40,Y+16,null,[6,6]);D('rollos',X-46,Y+26,null,[6,6]);D('candelabro',X+48,Y-30,null);D('estandarte',X-70,Y-10,{col:'#4a6ab0'});LP(X+70,Y+2);}
  // ── guaridas del bioma movidas a su sitio y espejadas (decoración, monstruos, senda, suelos y zona) ──
  const mv=(s,dx,dy)=>{const o=Object.assign({},s),t=(x,y)=>mp(x+dx,y+dy);o.z=MR([s.z[0]+dx,s.z[1]+dx,s.z[2]+dy,s.z[3]+dy]);o.mobs=s.mobs.map(([id,x,y])=>[id].concat(t(x,y)));
   if(s.dirt)o.dirt=s.dirt.map(d=>t(d[0],d[1]).concat(d[2]));if(s.stone)o.stone=s.stone.map(r=>({p:r.p.map(q=>t(q[0],q[1])),w:r.w}));if(s.routes)o.routes=s.routes.map(r=>r.map(q=>t(q[0],q[1])));
   o.decor=s.decor.map(e=>{const q=t(e.x,e.y);return Object.assign({},e,{x:q[0],y:q[1]})});if(o.decor.some(e=>e.fps))o.decor.forEach(e=>{if(e.fps&&C.fx)e.fps=e.fps.map(f=>[-f[0],f[1],f[2],f[3]])});return o};
  const sp={ing:mv(SP.ing,778,1440),pack:mv(SP.pack,1503,345),cap:mv(SP.cap,1150,1300)};
  B.spots=sp;const plaza=[[CX,CY,115],[CX+95,CY-550,105],[CX+385,CY+292,95],[CX-270,CY-255,85],[CX+275,CY-255,85]],routes=[],st=[];
  ['ing','pack','cap'].forEach(key=>{sp[key].decor.forEach(e=>props.push(e));(sp[key].dirt||[]).forEach(d=>plaza.push(d));(sp[key].routes||[]).forEach(r=>routes.push(r));st.push(...(sp[key].stone||[]))});
  B.village=Object.assign({},old,{props,stations:[['bank','Banco',CX-125,CY-105],['shop','Tienda',CX+125,CY-105],['fire','Fogata',CX+385,CY+292,['co']],['furnace','Horno',CX+112,CY-570,['sm']],['anvil','Yunque',CX+66,CY-528,['sm']],['bench','Taller',CX-270,CY-255,['cr','es']],['altar','Escritorio',CX+275,CY-255,['ins']]],
   plaza,bridge:null,safe:[CX,CY,470,470],
   cobs:[{p:[[CX-70,CY],[CX+70,CY]],w:130},{p:[[CX,CY-120],[CX,CY-320]],w:24},{p:[[CX,CY+120],[CX,CY+340]],w:24},{p:[[CX-130,CY],[CX-400,CY]],w:24},{p:[[CX+130,CY],[CX+420,CY]],w:24},{p:[[CX+60,CY-540],[CX+160,CY-565]],w:70}].concat(st)});
  // ── caminos de tierra (plantilla de la Pradera, espejada) ──
  const RT=[[[360,1520],[900,1510],[1500,1500],[2000,1500],[2300,1500],[2700,1500],[3300,1490],[3977,1500]],
   [[CX,CY-320],[CX,950],[2150,850]],[[CX,CY-535],[CX+60,CY-540]],[[CX,950],[2500,700],[2900,470]],[[CX,CY+340],[CX,1900],[2100,2050],[1800,2150],[1648,2145]],[[CX,1900],[2500,1840],[2780,1780]],[[2500,1840],[2450,1990]],
   [[1500,1500],[1350,1300],[1200,1050],[1050,900]],[[1500,1505],[1330,1620],[1160,1700]],[[3050,1498],[3020,1280],[3001,1070]],[[3300,1495],[3450,1800],[3600,2050]],[[3400,1495],[3550,1250],[3800,1110]]];
  if(!C.exit)RT[0].push([4620,1500]);
  B.routes=routes.concat(RT.map(r=>r.map(MP)));
  if(C.exit)B.routes.push(C.exit.map(MP));
  if(C.entry)B.routes.push(C.entry);
  // ── geografía: lagos, río, mar (solo si no está espejado en Y), colinas y afloramientos de piedra ──
  const sd=C.sd,RIO=[[1050,1650,70,95,11],[1030,1830,82,100,12],[1075,2020,66,96,13],[1040,2200,78,100,14],[1060,2340,72,86,15]].map(([x,y,a,b,s2])=>({c:MP([x,y]),r:[a,b],seed:s2+sd,amp:.16,sand:46}));
  const LK=[{c:MP([3800,760]),r:[330,240],seed:3+sd,amp:.3,sand:70},{c:MP([2850,1985]),r:[200,125],seed:6+sd,amp:.3,sand:60}].concat(RIO).concat(C.xlakes||[]);
  const HL=[[1750,2300,250,160,3,3],[3250,1850,230,150,5,2],[760,1300,190,140,7,2],[4200,2060,240,150,11,3],[2350,2420,300,150,13,2],[1800,560,200,130,17,2],[520,2450,240,160,19,2],[4150,2450,220,150,23,3],[1500,1950,150,100,29,1],[3600,2250,180,110,31,2],[3150,950,160,100,37,1]].map(([x,y,a,b,s2,lv])=>({c:MP([x,y]),r:[a,b],seed:s2+sd,amp:.3,lv}))
   .concat([[2050,760,280,125,41,3,.22],[2490,540,280,125,43,3,.22],[2950,330,280,115,47,3,.22],[3550,1560,120,75,51,2,.3],[620,1720,110,70,53,2,.3],[2750,2300,120,70,59,2,.3],[1700,1780,90,60,61,1,.3]].map(([x,y,a,b,s2,lv,am])=>({c:MP([x,y]),r:[a,b],seed:s2+sd,amp:am,lv,rock:1})));
  // la guarida del capitán va en el cerro de piedra del sur: se evita que un lago espejado se le meta encima
  const WCt=[{r:[[1280,1700,1230,1420]],z:[1240,1740,1200,1450]},{r:[[700,1300,600,1000]],z:[660,1340,560,1040]},{r:[[3400,4000,2100,2500]],z:[3360,4040,2060,2540]}],MIt=[{r:[[1900,2200,720,800]],z:[1840,2260,640,880]},{r:[[2340,2640,500,580]],z:[2280,2700,420,620]},{r:[[2800,3100,290,370]],z:[2740,3160,210,410]}],
   FIt=[{z:[2600,3110,1800,2200],t:'Estanque'},{z:[940,1190,1560,2450],t:'Río'},{z:[3400,4260,480,1060],t:'Lago'}];
  const zr=q=>({r:q.r.map(MR),z:MR(q.z)});
  B.lay={water:[],lakes:LK,sea:C.sea?{y:2720,amp:34,seed:4+sd,sand:150}:undefined,hills:HL,wc:WCt.map(zr),mi:MIt.map(zr),fi:FIt.map(q=>({z:MR(q.z),t:q.t})).concat(C.sea?[{z:[60,4540,2640,2975],t:'Mar'}]:[]),cliff:[]};
  if(!C.sea)delete B.lay.sea;
  // recursos: cada zona toma la lista de su tier (si el bioma tiene menos listas que zonas, se repite la última)
  const cy=(a,n)=>{a=a.slice();while(a.length<n)a.push(a[a.length-1]);return a};B.res={wc:cy(B.res.wc,3),mi:cy(B.res.mi,3),fi:cy(B.res.fi,B.lay.fi.length)};
  // ── puntos de interés: campamentos con guardias del bioma, santuarios y cofres (mismos sitios que la Pradera, espejados) ──
  const pois=B.pois=[];
  C.camps.forEach(([id,n,tier,mobs],j)=>{const q0=j?[4250,1280]:[620,400],q=mp(q0[0],q0[1]);pois.push({id,k:'camp',n,x:q[0],y:q[1],r:210,tier,mobs});const x=q[0],y=q[1],qq=(nm,dx,dy,o,fp)=>props.push(P(nm,x+dx,y+dy,o||null,fp?{fp}:undefined));
   qq('hoguera',0,34);qq('carpa',-70,-6,{col:'#8a5a38'},[10,10]);qq('carpa',64,-14,{col:'#6a5a3a'},[10,10]);qq('estandarte',-26,-52,{col:C.col});qq('estandarte',44,-60,{col:C.col});qq('barril',-48,46);qq('caja',58,40);qq('tronco',-20,86,{len:26});qq('huesos',24,76)});
  [['s1','vig','Santuario del Vigor','#ff7a7a',1450,700],['s2','wis','Santuario de la Sabiduría','#7ad0ff',3320,2440],['s3','luck','Santuario de la Fortuna','#ffd23a',380,1950],['s4','trv','Santuario del Viajero','#9aff9a',4380,330]].forEach(([id,stat,n,col,x,y])=>{const q=mp(x,y);
   pois.push({id,k:'santuario',n,x:q[0],y:q[1],r:120,tier:2,stat,col});props.push(P('piedra',q[0]-30,q[1]+10,null,{fp:[7,6]}),P('piedra',q[0]+34,q[1]-8,null,{fp:[7,6]}))});
  [['h1',2100,2640],['h2',880,2580],['h3',4300,2560],['h4',3450,260],['h5',1300,300],['h6',4350,1850],['h7',700,1050]].forEach(([id,x,y])=>{const q=mp(x,y);pois.push({id,k:'cofre',n:'Cofre escondido',x:q[0],y:q[1],r:90,tier:1})});
  Object.assign(B,{w:4608,h:3008,place:C.place,spawn:[CX,CY+80],cen:[CX,CY],bossPos:[C.bx,C.by],exitE:[1443,1557],entryW:[1443,1557]});if(C.gate)B.gate=C.gate;
  // ── arena del jefe: círculo de tierra con estandartes y piezas del bioma ──
  {const bx=C.bx,by=C.by,A=[];plaza.push([bx,by,150]);[[-130,-70],[130,-70],[-130,70],[130,70]].forEach(([dx,dy])=>A.push(P('estandarte',bx+dx,by+dy,{col:C.col})));
   const add={tocones:[['tocon',-170,0],['tocon',170,0],['tronco',0,-150,{len:30}],['arbolSeco',-60,150],['arbolSeco',70,160]],cienaga:[['arbolSeco',-170,20],['arbolSeco',175,-10],['lapida',-100,140],['lapida',100,150],['cruz',0,-150]],hielo:[['totem',-170,0],['totem',170,0],['roca',0,-160],['roca',-80,155],['roca',90,150]],
    torii:[['torii',0,-175,{rot:1}],['linterna',-170,-20],['linterna',170,-20],['cerezo',-190,100,null],['cerezo',190,100,null]],lava:[['fumarola',-175,0],['fumarola',175,0],['obsidiana',0,-160],['estela',-90,150],['estela',90,150]]}[C.arena];
   add.forEach(([n,dx,dy,o])=>A.push(n==='linterna'?L(n,bx+dx,by+dy,o):P(n,bx+dx,by+dy,o||null,n==='cerezo'?{fp:[5,5]}:undefined)));A.forEach(e=>props.push(e))}
  // ── bosques sólidos de las especies del bioma (con huecos para caminos, zonas, agua y guaridas) ──
  const G0=[[1000,800,640,470,64],[1500,1330,340,230,20],[3700,2300,540,430,56],[700,1900,420,360,26],[3300,2700,420,260,18],[1000,2750,520,200,22],[4100,2200,320,220,12],[2700,2650,380,200,16],[600,1200,260,220,14],[3950,2850,420,150,14],[2200,2750,360,160,12],[3900,300,380,170,12],[800,420,420,200,18]];
  groves(B,G0.map(([x,y,a,b,n],j)=>{const q=mp(x,y);return[q[0],q[1],a,b,Math.max(4,Math.round(n*C.gv)),j%2?C.kinds.slice(1):C.kinds]}))}
 BIOMES.finish();
})();
