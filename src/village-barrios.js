// NotScape · FASE 44b · ALDEA POR BARRIOS (19 oct 2026). Se carga DESPUÉS de world-scale.js y ANTES de seams/props/world-iso/game. Solo vale con la escala de aldea activa (`WS.VK>1`, es decir `vilXf` de world-scale.js).
// QUÉ HACE: `vilXf` (world-scale.js) ya multiplica ×1,5 las posiciones del núcleo de las SEIS aldeas (y el radio de plaza, el ancho de las calles y la zona segura). Aquí se REORGANIZA a mano la aldea
// de la Pradera sobre ese tamaño (plan: docs/PLAN_MUNDO_ABIERTO.md §2-c opción B). Cada aldea se describe con un objeto de DATOS `spec` y la función genérica `barrio(k,spec)`; las Fases 7–11 solo tienen
// que añadir el `spec` de su bioma (no hay código por aldea). Todas las coordenadas del `spec` son RELATIVAS al centro de la plaza (WS.C), en px de mundo, y SON LAS DE DESPUÉS DE ×1,5 (x → este, y → sur).
// REGLAS DE DISEÑO (las puertas solo miran al SUR (`rot` 0) o al ESTE (`rot` 1), ver interiors.js `doorPos`; por eso las casas se alinean en FILAS cuyo frente es una calle E–O):
//   · PLAZA cívica pequeña (adoquín de ≈ 165 px + 40 px de cápsula; ≈ 5 tiles de radio) con pozo, banca, 4 puestos, tablón y Ru. Banco y tienda de cara a la plaza (puertas al sur).
//   · CALLE MAYOR E–O de 3 tiles (96 px, radio 48), es el camino principal del mundo: pasa por la plaza y sale por los dos lados. Avenidas N–S de ≈ 2 tiles (radio 30).
//   · CALLE DE LOS OFICIOS (norte, radio 24 = 1,5 tiles): una fila de talleres con la puerta a la calle (taller, herrería con su patio de carbón y brasero, escritorio del escriba).
//   · CALLE SUR (radio 24): taberna, iglesia y casas de vecinos con la puerta a la calle; la cocina al aire libre (fogata), el huerto y el molino quedan al sureste, junto al lago.
//   · Un prop NO pisa calle ni plaza salvo lo que es de plaza (puestos, pozo, banca, farolas, tablón). `tools/r3d/village_check.py` lo comprueba con los datos reales.
// `?barrios=0` = solo ×1,5 mecánico (comparar). `?vk=1` = sin ×1,5 (y por tanto sin barrios). Estadísticas y avisos: `window.VBARRIOS = {done, warn, ms}`.
(()=>{
 const G=typeof globalThis!=='undefined'?globalThis:window,qs=typeof location!=='undefined'?location.search:'';
 const VB=G.VBARRIOS={done:[],warn:[],ms:0,spec:{}};
 if(typeof BIOMES==='undefined'||!G.WS||!G.WS.on||!(G.WS.VK>1)||/[?&]barrios=0\b/.test(qs))return;
 const t0=typeof performance!=='undefined'?performance.now():0;

 // ── motor genérico ──
 // spec = { plaza:[r] (radio del círculo de tierra bajo el adoquín),
 //          cobs:[{p:[[x,y],[x,y]],w}] (calles adoquinadas: SUSTITUYEN a las 6 primeras de la aldea),
 //          dirt:{i:[x,y,r]} (círculos de tierra por índice: patios de las instalaciones),
 //          st:{id:[x,y]} (estaciones), mv:[[nombre,[x0,y0],[x1,y1],{rot,o}]] (mover un prop: se busca el más cercano a (x0,y0) del mismo nombre) }
 function barrio(k,spec){const B=BIOMES.list[k],V=B.village,C=G.WS.C,warn=[];
  const find=(n,x,y,tol)=>{let b=null,bd=tol;for(const p of V.props){if(p.n!==n||p._vb||p._del)continue;const d=Math.hypot(p.x-C[0]-x,p.y-C[1]-y);if(d<bd){bd=d;b=p}}return b};
  // 1 · plaza (círculo de tierra) y patios
  if(spec.plaza!=null&&V.plaza[0]){V.plaza[0][2]=spec.plaza}
  for(const i in (spec.dirt||{})){const q=V.plaza[+i],d=spec.dirt[i];if(!q){warn.push('plaza['+i+'] no existe');continue}q[0]=C[0]+d[0];q[1]=C[1]+d[1];q[2]=d[2]}
  // 2 · calles: las 6 primeras `cobs` de la aldea (plaza, 4 brazos, patio de la herrería) son las que escribió layouts.js; las demás (adoquín de guaridas) NO se tocan
  if(spec.cobs){if(V.cobs.length<6||!(V.cobs[0].w>150))warn.push('cobs: la estructura esperada (plaza + 4 brazos + patio) no coincide; no se tocan las calles');
   else V.cobs.splice(0,6,...spec.cobs.map(c=>({p:c.p.map(q=>[C[0]+q[0],C[1]+q[1]]),w:c.w})))}
  // 3 · estaciones (viven en coordenadas LOCALES; las de «instalación» desaparecen del mapa al crear las puertas, interiors.js, pero se usan para elegir casa y para Ru/tablón)
  for(const id in (spec.st||{})){const s=V.stations.find(e=>e[0]===id);if(!s){warn.push('estación '+id+' no existe');continue}s[2]=C[0]+spec.st[id][0];s[3]=C[1]+spec.st[id][1]}
  // 4 · props: se buscan por nombre y posición (relativa a la plaza, tras ×1,5); si no se encuentran se avisa (no se rompe nada)
  for(const [n,a,b,o] of (spec.mv||[])){const p=find(n,a[0],a[1],44);if(!p){warn.push(n+' @'+a+' no encontrado');continue}
   p.x=Math.round(C[0]+b[0]);p.y=Math.round(C[1]+b[1]);p._vb=1;
   if(o&&o.rot!=null){const q=Object.assign({},p.o||{});if(o.rot)q.rot=1;else delete q.rot;p.o=Object.keys(q).length?q:null}}
  V.props.forEach(p=>{delete p._vb});
  VB.done.push(k);VB.warn.push(...warn.map(w=>'['+k+'] '+w));return warn}

 // ── PRADERA (k=0) ──
 // Coordenadas «desde» = las del ×1,5 mecánico (volcado de la aldea, Lote R3D-F44b); «hasta» = barrio nuevo.
 const PRADERA={
  plaza:190,
  cobs:[
   {p:[[-40,0],[40,0]],w:165},                 // adoquín de la plaza
   {p:[[-790,0],[790,0]],w:48},                // CALLE MAYOR E–O, 3 tiles de ancho (radio 48 = 96 px)
   {p:[[0,-165],[0,-520]],w:30},               // avenida norte (hasta el camino de la cantera)
   {p:[[0,165],[0,520]],w:30},                 // avenida sur (hasta el camino del rancho)
   {p:[[-610,-330],[610,-330]],w:24},          // calle de los oficios (radio 24 = 1,5 tiles)
   {p:[[-610,470],[230,470]],w:24}],           // calle sur (taberna, iglesia, vecinos)
  dirt:{1:[150,-450,140],3:[-420,-430,115],4:[330,-430,115]},   // patios de herrería, taller y escritorio
  st:{bank:[-232,-150],shop:[262,-150],furnace:[110,-470],anvil:[70,-450],bench:[-420,-450],altar:[330,-450]},
  mv:[
   // FILA NORTE DE LA CALLE MAYOR (puertas al sur, a la plaza y a la calle mayor): banco y tienda a los lados de la plaza, vecinos hacia fuera
   ['casa',[-102,-282],[-232,-150],{rot:0}],['casa',[330,-258],[262,-150],{rot:0}],
   ['casa',[-702,-78],[-380,-135],{rot:0}],['casa',[-594,234],[-530,-135],{rot:0}],['casa',[-462,-558],[-680,-135],{rot:0}],
   ['casa',[510,-78],[390,-135],{rot:0}],['cabana',[342,-570],[540,-130],{rot:0}],
   // CALLE DE LOS OFICIOS (puertas al sur, a la calle): taller · herrería (patio con carbón y brasero) · escritorio del escriba; cabañas-almacén detrás
   ['casa',[-438,-354],[-420,-410],{rot:0}],['pilaTroncos',[-505,-294],[-545,-420]],['tablones',[-360,-412],[-330,-440]],
   ['casa',[90,-606],[110,-430],{rot:0}],['carbon',[176,-589],[215,-430]],['brasero',[173,-652],[215,-470]],['barril',[-7,-630],[40,-500]],
   ['casa',[414,-378],[330,-410],{rot:0}],['atril',[186,-282],[410,-380]],['estanteria',[234,-282],[430,-455]],
   ['cabana',[-198,-582],[-250,-545],{rot:0}],['cabana',[-150,-414],[-80,-545],{rot:0}],['banca',[54,-414],[80,-285]],
   // CALLE SUR (puertas al sur, a la calle): taberna al oeste de la avenida (puerta al este), iglesia y casas
   ['taberna',[-174,66],[-110,300]],['iglesia',[-219,260],[-400,400],{rot:0}],
   ['casa',[-366,438],[-270,392],{rot:0}],['casa',[-186,522],[-150,410],{rot:0}],['casa',[174,450],[150,410],{rot:0}],
   // PLAZA Y CALLES: puestos fuera de las avenidas y farolas en los cruces
   ['puesto',[-18,-270],[-120,-215]],['puesto',[426,-294],[330,-270]],
   ['farola',[-366,210],[-236,-60]],['farola',[-186,-54],[236,-60]],['farola',[-186,-282],[-50,-300]],['farola',[-30,-342],[50,-300]],['farola',[126,-174],[-60,445]],['farola',[402,-258],[60,445]]]};
 // ── BOSQUE (k=1) · Lote R3D-F7-BARRIOS (20 oct 2026) ──
 // Aldea élfica sobre la MISMA estructura de estaciones/patios que la Pradera (las instalaciones y sus puertas viven en esas coordenadas), pero con calles SINUOSAS (polilíneas de 3–5 puntos),
 // plaza menor, casas-tronco y casas-árbol alternadas en las filas, y el templo (iglesia) en la calle sur. «Desde» = posiciones del ×1,5 mecánico del Bosque (volcado); «hasta» = barrio nuevo.
 const BOSQUE={
  plaza:170,
  cobs:[
   {p:[[-40,0],[40,0]],w:152},                              // adoquín de la plaza
   {p:[[-790,45],[-450,-28],[0,0],[420,-32],[790,38]],w:44},   // CALLE MAYOR sinuosa
   {p:[[0,-165],[18,-340],[-10,-520]],w:28},                // avenida norte
   {p:[[0,165],[-14,340],[8,520]],w:28},                    // avenida sur
   {p:[[-610,-305],[-220,-348],[210,-346],[610,-302]],w:23},   // calle de los oficios
   {p:[[-610,445],[-240,482],[230,466]],w:23}],             // calle sur
  dirt:{1:[150,-450,140],3:[-420,-430,115],4:[330,-430,115]},
  st:{bank:[-232,-150],shop:[262,-150],furnace:[110,-470],anvil:[70,-450],bench:[-420,-450],altar:[330,-450]},
  mv:[
   // FILA NORTE DE LA CALLE MAYOR (puertas al sur): banco y tienda de tronco a los lados de la plaza; casas-árbol y de tronco hacia fuera
   ['troncos',[-102,-282],[-232,-150],{rot:0}],['troncos',[330,-258],[262,-150],{rot:0}],
   ['casaArbol',[-348,-138],[-380,-135],{rot:0}],['casaArbol',[482,135],[390,-135],{rot:0}],
   ['troncos',[-618,243],[-530,-135],{rot:0}],['troncos',[623,194],[540,-135],{rot:0}],['troncos',[-465,191],[-680,-135],{rot:0}],
   // CALLE DE LOS OFICIOS: taller · herrería (patio con carbón y brasero) · escritorio; casas-árbol detrás
   ['troncos',[-438,-354],[-420,-410],{rot:0}],['pilaTroncos',[-523,-279],[-545,-420]],['tablones',[-342,-427],[-330,-440]],
   ['troncos',[90,-606],[110,-430],{rot:0}],['carbon',[176,-589],[215,-430]],['brasero',[173,-652],[215,-470]],['barril',[-7,-630],[40,-500]],
   ['troncos',[570,-207],[330,-410],{rot:0}],['atril',[488,-321],[410,-380]],['estanteria',[368,-408],[430,-455]],
   ['casaArbol',[-222,-484],[-250,-545],{rot:0}],['casaArbol',[-307,248],[-80,-545],{rot:0}],['banca',[-79,146],[80,-285]],
   // CALLE SUR: taberna al oeste de la avenida (puerta al este), templo y casas
   ['taberna',[-174,66],[-110,300]],['iglesia',[183,-412],[-400,400],{rot:0}],
   ['troncos',[-172,344],[-270,392],{rot:0}],['troncos',[-181,518],[-150,428],{rot:0}],['troncos',[203,339],[150,410],{rot:0}],['troncos',[177,494],[300,410],{rot:0}],
   // PLAZA Y CALLES
   ['puesto',[210,162],[-120,-215]],['puesto',[297,162],[330,-270]],
   ['farola',[-187,-135],[-236,-60]],['farola',[188,135],[236,-60]],['farola',[0,-367],[-50,-300]]]};
 VB.spec[0]=PRADERA;barrio(0,PRADERA);
 VB.spec[1]=BOSQUE;barrio(1,BOSQUE);
 VB.barrio=barrio;
 VB.ms=typeof performance!=='undefined'?Math.round(performance.now()-t0):0;
 if(VB.warn.length&&typeof console!=='undefined')console.warn('[44b] barrios: ',VB.warn.join(' · '));
})();
