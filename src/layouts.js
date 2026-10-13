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

 // ═════════════ lote D7 · AJUSTES DEL DUEÑO (aldeas_ajustes.json del editor F2, 13 oct 2026) ═════════════
 // PRA_ADJ = la Pradera tal como la dejó el dueño con el editor. `o`: 'nombre|x|y' ORIGINAL (coords locales de este archivo; los duplicados exactos llevan '#n') → [x,y,rot,escala]; `add`: piezas duplicadas; `doors`: casa de cada instalación (clave de la pieza).
 // Se aplica en la Pradera con applyAdj(). En las otras 5 aldeas SOLO se copia la estructura de las 5 casas con instalación (DOORH, relativa al centro) y el resto de casas se reparten al azar con semilla (layHouses).
 const PRA_ADJ={o:{"casa|2170|1215":[2232,1312,0,1],"casa|2460|1210":[2360,1096,0,1],"casa|1995|1415":[2008,1264,0,1],"cabana|1990|1610":[2168,1112,0,1],"casa|2620|1410":[2520,1328,0,1],"cabana|2615|1620":[2648,1664,0,1],"casa|2115|1770":[2576,1264,1,1],"casa|2470|1755":[2640,1448,0,1],"taberna|2345|1825":[2184,1544,1,1],"farola|2175|1410":[2176,1464,0,1],"farola|2425|1410":[2448,1336,0,1],"farola|2175|1590":[2040,1400,0,1],"farola|2425|1590":[2176,1312,0,1],"farola|2300|1255":[2280,1272,0,1],"farola|2300|1762":[2248,1696,0,1],"puesto|2440|1608":[2352,1384,0,1],"puesto|2498|1608":[2688,1456,0,1],"pozo|2150|1455":[2304,1552,0,1],"barril|2080|1369":[2016,1216,0,1],"banca|2205|1562":[2336,1224,1,1],"banca|2395|1562":[2304,1592,0,1],"estandarte|2150|1350":[2152,1352,0,1],"estandarte|2450|1350":[2472,1344,1,1],"farola|2267|1150":[2272,1160,0,1],"estanteria|2545|1228":[2456,1312,0,1],"atril|2625|1286":[2424,1312,1,1],"rollos|2539|1296":[2408,1320,0,1],"candelabro|2633|1240":[2392,1296,0,1],"farola|2655|1272":[2584,1216,0,1]},
  add:[{"n":"banca","x":2296,"y":1504,"o":null,"sc":1,"fp":[11,4]},{"n":"cabana","x":2528,"y":1120,"o":{"roof":"#6a8fb8","rot":1},"sc":1,"fp":[24,20]},{"n":"puesto","x":2584,"y":1304,"o":{"g1":"#d9553a","g2":"#e0b83a","col":"#c0392b","rot":0},"sc":1,"fp":[16,10]},{"n":"puesto","x":2264,"y":1320,"o":{"g1":"#d9553a","g2":"#e0b83a","col":"#c0392b","rot":1},"sc":1,"fp":[16,10]},{"n":"casa","x":1832,"y":1448,"o":{"roof":"#c98a3a","wall":"#efe0bd","rot":0},"sc":1,"fp":[32,25]},{"n":"farola","x":2384,"y":1384,"o":null,"sc":1,"fp":[3,3]},{"n":"casa","x":1904,"y":1656,"o":{"roof":"#8a6aa8","wall":"#e6d2a6","rot":1},"sc":1,"fp":[32,25]},{"n":"casa","x":2176,"y":1848,"o":{"roof":"#c98a3a","wall":"#efe0bd","rot":1},"sc":1,"fp":[32,25]},{"n":"farola","x":2568,"y":1328,"o":null,"sc":1,"fp":[3,3]},{"n":"casa","x":2416,"y":1800,"o":{"roof":"#8a6aa8","wall":"#e6d2a6","rot":0},"sc":1,"fp":[32,25]},{"n":"puesto","x":2376,"y":1480,"o":{"g1":"#d9553a","g2":"#e0b83a","col":"#c0392b","rot":0},"sc":1,"fp":[16,10]},{"n":"puesto","x":2416,"y":1384,"o":{"g1":"#d9553a","g2":"#e0b83a","col":"#c0392b"},"sc":1,"fp":[16,10]},{"n":"casa","x":2056,"y":1792,"o":{"roof":"#c98a3a","wall":"#efe0bd","rot":0},"sc":1,"fp":[32,25]},{"n":"cabana","x":2200,"y":1224,"o":{"roof":"#6a8fb8","rot":1},"sc":1,"fp":[24,20]},{"n":"puesto","x":2440,"y":1480,"o":{"g1":"#e0b83a","g2":"#7aa84a","col":"#c0392b"},"sc":1,"fp":[16,10]},{"n":"casa","x":1992,"y":1128,"o":{"roof":"#c98a3a","wall":"#efe0bd","rot":1},"sc":1,"fp":[32,25]},{"n":"farola","x":2056,"y":1640,"o":null,"sc":1,"fp":[3,3]},{"n":"farola","x":2552,"y":1664,"o":null,"sc":1,"fp":[3,3]}],
  doors:{"herreria":"casa|2460|1210","taller":"casa|1995|1415","banco":"casa|2170|1215","tienda":"casa|2620|1410","taberna":"taberna|2345|1825"}};
 const LAMPN={farola:1,brasero:1,linterna:1,antorcha:1};
 function applyAdj(props,adj){const seen={},byKey={};
  props.forEach(p=>{let ek=p.n+'|'+p.x+'|'+p.y;if(seen[ek]!=null)ek+='#'+(++seen[ek]);else seen[ek]=0;byKey[ek]=p;const a=adj.o[ek];if(!a)return;
   p.x=a[0];p.y=a[1];const r0=p.o&&p.o.rot?1:0;if(a[2]!==r0)p.o=Object.assign({},p.o||{},{rot:a[2]?1:0});if(a[3]&&a[3]!==1)p.sc=a[3]});
  adj.add.forEach(a=>{const q={n:a.n,x:a.x,y:a.y,o:a.o?Object.assign({},a.o):null,sc:a.sc||1,fp:a.fp||null};if(!q.o)delete q.o;if(!q.fp)delete q.fp;if(q.sc===1)delete q.sc;if(LAMPN[a.n])q.lamp=1;props.push(q)});
  for(const r in adj.doors){const p=byKey[adj.doors[r]];if(p)p.room=r}}
 // las 5 casas con instalación respecto al centro de la aldea (tomadas de la Pradera del dueño): [tipo de KIT, dx, dy, rot]
 const DOORH={herreria:['M',60,-404,0],taller:['M',-292,-236,0],banco:['M',-68,-188,0],tienda:['M',220,-172,0],taberna:['B',-116,44,1]};
 const SECOND=['S','S','S','S','M','M','M','M','M','M','M','M'];   // el resto de casas: 4 cabañas y 8 medianas (como en la Pradera del dueño)
 // Coloca en un bioma de las 5 aldeas nuevas: primero las 5 casas con instalación (estructura fija; se empujan hacia fuera los adornos que queden debajo) y luego las demás al azar con semilla (reparto natural: lejos de la plaza, de las calles, de los patios y de otras casas).
 function layHouses(props,kit,k,CX,CY,plaza){let sd=7001+k*977;const rnd=()=>{sd=(sd+0x6D2B79F5)|0;let t=Math.imul(sd^sd>>>15,1|sd);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  let i=k*3;const hs=[],mk=(t,x,y,r)=>{const q=kit[t](CX+x,CY+y,i++,r);if(t==='B'&&q)q.tav=1;return q};
  const half=q=>{const f=q.fp||[0,0],r=q.o&&q.o.rot;return r?[f[1],f[0]]:f};
  for(const room in DOORH){const[t,x,y,r]=DOORH[room],q=mk(t,x,y,r);q.room=room;props.push(q);hs.push(q)}
  // adornos bajo una casa de instalación: se apartan en línea recta (pasos de 8 px)
  const hit=(a,b,m)=>{const fa=half(a),fb=half(b);return Math.abs(a.x-b.x)<fa[0]+fb[0]+m&&Math.abs(a.y-b.y)<fa[1]+fb[1]+m};
  props.forEach(p=>{if(hs.includes(p)||p.fps||!p.fp&&!p.lamp&&!/^(banca|estandarte|barril|caja|tocon|pozo)$/.test(p.n))return;if(p.fp&&p.fp[0]>40)return;
   hs.forEach(h=>{const q=p.fp?p:Object.assign({},p,{fp:[3,3]});let n=0;while(hit(q,h,10)&&n++<25){const dx=p.x-h.x,dy=p.y-h.y,l=Math.hypot(dx,dy)||1;p.x=Math.round(p.x+dx/l*8);p.y=Math.round(p.y+dy/l*8);q.x=p.x;q.y=p.y}})});
  const fixed=props.filter(p=>p.fp||p.fps||p.lamp),ok=(x,y,f)=>{
   const dx=x-CX,dy=y-CY;if(Math.hypot(dx,dy)<235)return false;if(Math.abs(dx)>470-f[0]||Math.abs(dy)>440-f[1])return false;
   if(Math.abs(dy)<60+f[1]&&dx>-430&&dx<450)return false;if(Math.abs(dx)<60+f[0]&&dy>-350&&dy<350)return false;   // calles
   if(plaza.some(([px,py,pr],j)=>j>0&&Math.hypot(x-px,y-py)<pr+Math.max(f[0],f[1])*.7+14))return false;                  // patios de instalaciones
   if(hs.some(h=>{const g=half(h);return Math.abs(x-h.x)<f[0]+g[0]+34&&Math.abs(y-h.y)<f[1]+g[1]+34}))return false;     // otras casas y su fachada
   return !fixed.some(p=>{const g=p.fps?[40,40]:half(p);return Math.abs(x-p.x)<f[0]+g[0]+14&&Math.abs(y-p.y)<f[1]+g[1]+14})};
  for(const t of SECOND){let q=null;for(let n=0;n<400&&!q;n++){const a=rnd()*6.2832,r=235+rnd()*230,x=Math.round(CX+Math.cos(a)*r),y=Math.round(CY+Math.sin(a)*r*.85);
    const dy=y-CY,dx=x-CX,rot=dy<-70?0:dx<-70?1:rnd()<.5?0:1,c=mk(t,x-CX,y-CY,rot);if(c&&ok(x,y,half(c)||[24,20])){q=c}}
   if(q){props.push(q);hs.push(q)}}}
 // ═════════════════════════ PRADERA · 4600×3000, aldea al centro ═════════════════════════
 {const B=BIOMES.list[0],S0=TK.SPOTS[0],CX=2300,CY=1500,old=B.village;
  const kit=KIT[0];let i=0;const H=(t,x,y,r)=>{const q=kit[t](CX+x,CY+y,i++,r||0);if(t==='B'&&q)q.tav=1;return q};   // tav: edificio reservado a la taberna (interiors.js lo prefiere)
  // ── aldea (menos cosas, mejor repartidas: las instalaciones se leen; las casas flanquean 4 calles que salen de la plaza) ──
  const props=[
   H('M',-130,-285,0),H('M',160,-290,0),H('M',-305,-85,1),H('S',-310,110,1),H('M',320,-90,0),H('S',315,120,0),   // lote D4: aldea más COMPACTA y centrada. Anillo de casas a ~300-330 px de la plaza (antes 330-410 y repartidas), con la plaza ampliada a 175 px de radio. Norte/oeste: puerta hacia la plaza; este/sur: puerta hacia la calle
   H('M',-185,270,1),H('M',170,255,0),H('B',45,325,1)];                                  // calle sur y taberna al sur de la plaza (el esqueleto 'B' se marca tav=1 y intDoorsInit lo prefiere para la taberna)
  [[-125,-90],[125,-90],[-125,90],[125,90],[0,-245],[0,262]].forEach(([x,y])=>props.push(L(kit.lamp,CX+x,CY+y)));   // 4 farolas en la plaza y 2 en los extremos de la calle
  props.push(P('puesto',CX+140,CY+108,Object.assign({g1:'#d9553a',g2:'#e0b83a'},kit.stall)),P('puesto',CX+198,CY+108,Object.assign({g1:'#e0b83a',g2:'#7aa84a'},kit.stall)));
  [[-430,-235],[440,-215],[-385,262],[480,215]].forEach(([x,y])=>props.push(P(kit.tree,CX+x,CY+y,null,{fp:kit.tfp})));
  props.push(P('pozo',CX-150,CY-45,null,{fp:[9,9]}),P('barril',CX-232,CY-140),P('barril',CX-220,CY-131));
  // ── rincones de las instalaciones (oct 2026): cada una tiene su sitio y su decoración con sentido; la plaza queda para banco y tienda ──
  const D=(n,x,y,o,fp)=>props.push(P(n,CX+x,CY+y,o||null,fp?{fp}:undefined)),LP=(x,y)=>props.push(L(kit.lamp,CX+x,CY+y));
  D('banca',-95,62,null,[11,4]);D('banca',95,62,null,[11,4]);D('estandarte',-150,-150,{col:'#4a6ab0'});D('estandarte',150,-150,{col:'#c0502a'});
  // herrería (horno + yunque), al norte junto al camino de la cantera: cobertizo de dos muros y tejado (ancla = esquina trasera), abrevadero, carbón, lingotes, muela, brasero, rack de armas y carreta de mena
  props.push(P('herreria',CX+110,CY-510,null,{fps:[[32,3,32,4],[3,32,4,32]]}));   // cobertizo del herrero al fondo del patio (NE): antes estaba justo detrás del horno/yunque y su tejado se solapaba con ambos (medido por píxeles: 49 % del horno, 59 % del yunque)
  D('tinaja',9,-348,null,[13,6]);D('carbon',117,-393,null,[8,7]);D('lingotes',103,-360,{col:'#c8742a'});D('muela',-13,-385,null,[7,6]);
  D('brasero',115,-435,null,[6,6]);D('lanzas',-5,-357);D('barril',-5,-420,null,[6,6]);D('barril',-17,-407,null,[6,6]);D('caja',135,-347,null,[8,7]);D('caja',147,-337);
  D('carreta',155,-420,{load:'#8a8a98'},[16,10]);D('tocon',165,-385,null,[7,6]);D('lenera',179,-357,null,[12,8]);LP(-33,-350);
  // cocina al aire libre (fogata), junto al camino del estanque: asador sobre el fuego, olla, secadero de pescado, cesta, troncos para sentarse y la tienda
  {const X=345,Y=255;[['tronco',-38,32,{len:26}],['tronco',42,36,{len:26}],['tronco',2,-44,{len:24}]].forEach(([n,x,y,o])=>D(n,X+x,Y+y,o));D('asador',X,Y-6,null,[14,3]);D('olla',X+40,Y-10,null,[7,6]);D('carpa',X-72,Y-26,{col:'#8a6a3a'},[10,10]);D('secadero',X+62,Y-34,null,[12,4]);D('cestaPeces',X+60,Y+16,null,[7,6]);D('barril',X-74,Y+12,null,[6,6]);D('caja',X+86,Y+4,null,[8,7]);}
  // taller de artesanía (noroeste de la plaza): leña apilada, tablones, caballete de aserrado, tocón de trabajo, cajas y una carreta
  {const X=-285,Y=-230;D('pilaTroncos',X-52,Y+34,null,[10,8]);D('tablones',X+45,Y-45,null,[11,5]);D('caballete',X-30,Y-48,null,[11,5]);D('tocon',X+42,Y+26,null,[7,6]);D('caja',X+66,Y+6,null,[8,7]);D('barril',X+80,Y+14,null,[6,6]);D('carreta',X-84,Y-6,{load:'#a07040'},[16,10]);LP(X-58,Y-30);}
  // escritorio del escriba (noreste): estantería de libros, atril, cesta de rollos, candelabro, estandarte y farol
  {const X=285,Y=-230;D('estanteria',X-40,Y-42,null,[13,4]);D('atril',X+40,Y+16,null,[6,6]);D('rollos',X-46,Y+26,null,[6,6]);D('candelabro',X+48,Y-30,null);D('estandarte',X-70,Y-10,{col:'#4a6ab0'});LP(X+70,Y+2);}
  // portón y empalizada del campamento orco (se mueven con él)
  const DOC=sh(2077,768);old.props.filter(e=>(e.n==='portonOrco'||e.n==='empalizada')&&e.x===1900).forEach(e=>props.push(DOC.prop(e)));
  // ── guaridas: las ya decoradas, movidas a su anillo ──
  const sp={ing:sh(778,1440).spot(S0.ing),camp:sh(1503,345).spot(S0.camp),orc:sh(2077,768).spot(S0.orc)};
  const st=[],plaza=[[CX,CY,175],[CX+60,CY-395,105],[CX+345,CY+255,95],[CX-285,CY-230,85],[CX+285,CY-230,85]],routes=[],dirt=[];
  ['ing','camp','orc'].forEach(k=>{sp[k].decor.forEach(e=>props.push(e));(sp[k].dirt||[]).forEach(d=>plaza.push(d));(sp[k].routes||[]).forEach(r=>routes.push(r));st.push(...(sp[k].stone||[]))});
  B.spots=sp;
  applyAdj(props,PRA_ADJ);   // lote D7: la Pradera tal como la dejó el dueño con el editor (F2)
  B.village=Object.assign({},old,{props,stations:[['bank','Banco',CX-125,CY-105],['shop','Tienda',CX+125,CY-105],['fire','Fogata',CX+345,CY+255,['co']],['furnace','Horno',CX+77,CY-415,['sm']],['anvil','Yunque',CX+31,CY-373,['sm']],['bench','Taller',CX-285,CY-230,['cr','es']],['altar','Escritorio',CX+285,CY-230,['ins']]],
   plaza,bridge:null,safe:[CX,CY,470,470],
   cobs:[{p:[[CX-95,CY],[CX+95,CY]],w:215},{p:[[CX,CY-170],[CX,CY-330]],w:24},{p:[[CX,CY+170],[CX,CY+340]],w:24},{p:[[CX-180,CY],[CX-410,CY]],w:24},{p:[[CX+180,CY],[CX+430,CY]],w:24},{p:[[CX+25,CY-385],[CX+125,CY-410]],w:70}].concat(st)});
  // ── caminos de tierra (aldea → cada nodo) ──
  B.routes=routes.concat([
   [[360,1520],[900,1510],[1500,1500],[2000,1500],[2300,1500],[2700,1500],[3300,1490],[3977,1500],[4620,1500]],   // camino principal oeste–este hasta la compuerta
   [[CX,CY-320],[CX,950],[2150,850]],[[CX,CY-380],[CX+25,CY-395]],[[CX,950],[2500,700],[2900,470]],                                          // norte: cantera (3 vetas)
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
  let i=0;const H=(t,x,y,r)=>{const q=kit[t](CX+x,CY+y,i++,r||0);if(t==='B'&&q)q.tav=1;return q},old=B.village;
  // ── aldea (misma distribución que la Pradera con el estilo de edificios del bioma) ──
  const props=[];   // las casas las coloca layHouses() más abajo
  [[-125,-90],[125,-90],[-125,90],[125,90],[0,-245],[0,262]].forEach(([x,y])=>props.push(L(kit.lamp,CX+x,CY+y)));
  props.push(P('puesto',CX+140,CY+108,Object.assign({g1:'#d9553a',g2:'#e0b83a'},kit.stall)),P('puesto',CX+198,CY+108,Object.assign({g1:'#e0b83a',g2:'#7aa84a'},kit.stall)));
  [[-430,-235],[440,-215],[-385,262],[480,215]].forEach(([x,y])=>props.push(P(kit.tree,CX+x,CY+y,null,{fp:kit.tfp})));
  props.push(P('pozo',CX-150,CY-45,null,{fp:[9,9]}),P('barril',CX-232,CY-140),P('barril',CX-220,CY-131));
  const D=(n,x,y,o,fp)=>props.push(P(n,CX+x,CY+y,o||null,fp?{fp}:undefined)),LP=(x,y)=>props.push(L(kit.lamp,CX+x,CY+y));
  D('banca',-95,62,null,[11,4]);D('banca',95,62,null,[11,4]);D('estandarte',-150,-150,{col:'#4a6ab0'});D('estandarte',150,-150,{col:'#c0502a'});
  props.push(P('herreria',CX+110,CY-510,null,{fps:[[32,3,32,4],[3,32,4,32]]}));
  D('tinaja',9,-348,null,[13,6]);D('carbon',117,-393,null,[8,7]);D('lingotes',103,-360,{col:'#c8742a'});D('muela',-13,-385,null,[7,6]);
  D('brasero',115,-435,null,[6,6]);D('lanzas',-5,-357);D('barril',-5,-420,null,[6,6]);D('barril',-17,-407,null,[6,6]);D('caja',135,-347,null,[8,7]);D('caja',147,-337);
  D('carreta',155,-420,{load:'#8a8a98'},[16,10]);D('tocon',165,-385,null,[7,6]);D('lenera',179,-357,null,[12,8]);LP(-33,-350);
  {const X=345,Y=255;[['tronco',-38,32,{len:26}],['tronco',42,36,{len:26}],['tronco',2,-44,{len:24}]].forEach(([n,x,y,o])=>D(n,X+x,Y+y,o));D('asador',X,Y-6,null,[14,3]);D('olla',X+40,Y-10,null,[7,6]);D('carpa',X-72,Y-26,{col:'#8a6a3a'},[10,10]);D('secadero',X+62,Y-34,null,[12,4]);D('cestaPeces',X+60,Y+16,null,[7,6]);D('barril',X-74,Y+12,null,[6,6]);D('caja',X+86,Y+4,null,[8,7]);}
  {const X=-285,Y=-230;D('pilaTroncos',X-52,Y+34,null,[10,8]);D('tablones',X+45,Y-45,null,[11,5]);D('caballete',X-30,Y-48,null,[11,5]);D('tocon',X+42,Y+26,null,[7,6]);D('caja',X+66,Y+6,null,[8,7]);D('barril',X+80,Y+14,null,[6,6]);D('carreta',X-84,Y-6,{load:'#a07040'},[16,10]);LP(X-58,Y-30);}
  {const X=285,Y=-230;D('estanteria',X-40,Y-42,null,[13,4]);D('atril',X+40,Y+16,null,[6,6]);D('rollos',X-46,Y+26,null,[6,6]);D('candelabro',X+48,Y-30,null);D('estandarte',X-70,Y-10,{col:'#4a6ab0'});LP(X+70,Y+2);}
  // ── guaridas del bioma movidas a su sitio y espejadas (decoración, monstruos, senda, suelos y zona) ──
  const mv=(s,dx,dy)=>{const o=Object.assign({},s),t=(x,y)=>mp(x+dx,y+dy);o.z=MR([s.z[0]+dx,s.z[1]+dx,s.z[2]+dy,s.z[3]+dy]);o.mobs=s.mobs.map(([id,x,y])=>[id].concat(t(x,y)));
   if(s.dirt)o.dirt=s.dirt.map(d=>t(d[0],d[1]).concat(d[2]));if(s.stone)o.stone=s.stone.map(r=>({p:r.p.map(q=>t(q[0],q[1])),w:r.w}));if(s.routes)o.routes=s.routes.map(r=>r.map(q=>t(q[0],q[1])));
   o.decor=s.decor.map(e=>{const q=t(e.x,e.y);return Object.assign({},e,{x:q[0],y:q[1]})});if(o.decor.some(e=>e.fps))o.decor.forEach(e=>{if(e.fps&&C.fx)e.fps=e.fps.map(f=>[-f[0],f[1],f[2],f[3]])});return o};
  const sp={ing:mv(SP.ing,778,1440),pack:mv(SP.pack,1503,345),cap:mv(SP.cap,1150,1300)};
  B.spots=sp;const plaza=[[CX,CY,175],[CX+60,CY-395,105],[CX+345,CY+255,95],[CX-285,CY-230,85],[CX+285,CY-230,85]],routes=[],st=[];
  ['ing','pack','cap'].forEach(key=>{sp[key].decor.forEach(e=>props.push(e));(sp[key].dirt||[]).forEach(d=>plaza.push(d));(sp[key].routes||[]).forEach(r=>routes.push(r));st.push(...(sp[key].stone||[]))});
  layHouses(props,kit,k,CX,CY,plaza);   // lote D7: las 5 casas con instalación en la posición de la Pradera del dueño y el resto repartidas al azar (semilla por bioma)
  B.village=Object.assign({},old,{props,stations:[['bank','Banco',CX-125,CY-105],['shop','Tienda',CX+125,CY-105],['fire','Fogata',CX+345,CY+255,['co']],['furnace','Horno',CX+77,CY-415,['sm']],['anvil','Yunque',CX+31,CY-373,['sm']],['bench','Taller',CX-285,CY-230,['cr','es']],['altar','Escritorio',CX+285,CY-230,['ins']]],
   plaza,bridge:null,safe:[CX,CY,470,470],
   cobs:[{p:[[CX-95,CY],[CX+95,CY]],w:215},{p:[[CX,CY-170],[CX,CY-330]],w:24},{p:[[CX,CY+170],[CX,CY+340]],w:24},{p:[[CX-180,CY],[CX-410,CY]],w:24},{p:[[CX+180,CY],[CX+430,CY]],w:24},{p:[[CX+25,CY-385],[CX+125,CY-410]],w:70}].concat(st)});
  // ── caminos de tierra (plantilla de la Pradera, espejada) ──
  const RT=[[[360,1520],[900,1510],[1500,1500],[2000,1500],[2300,1500],[2700,1500],[3300,1490],[3977,1500]],
   [[CX,CY-320],[CX,950],[2150,850]],[[CX,CY-380],[CX+25,CY-395]],[[CX,950],[2500,700],[2900,470]],[[CX,CY+340],[CX,1900],[2100,2050],[1800,2150],[1648,2145]],[[CX,1900],[2500,1840],[2780,1780]],[[2500,1840],[2450,1990]],
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
