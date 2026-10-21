// NotScape · FASE 44a (ampliada en la FASE 49a) · FRONTERAS ABIERTAS + BARRERAS DE RELIEVE entre los biomas del continente (19 oct 2026). Se carga DESPUÉS de world-scale.js y ANTES de props/world-iso/game.
// Las reglas de las uniones viven en biomes.js (`BIOMES.openPairs`, `seams`, `openAt`, `blendAt`, `at`/`own`) y en world-iso.js (`tileH`: el anillo de acantilado no existe en una unión abierta);
// la mezcla de color 3D en src/r3d/terrain3d.js (`gc`). Aquí solo se tocan los DATOS del mundo ya construido (sirve igual con `?wk=1`, no depende de la escala):
//   1 · CAMINO PRINCIPAL CONTINUO: en cada unión abierta (VERTICAL u HORIZONTAL desde la 49a) se añade al bioma de abajo/derecha un tramo que enlaza el final de la carretera de un lado con el comienzo de la del otro.
//   2 · BOSQUETES DE TRANSICIÓN: grupos de árboles (mezcla de las especies de los dos biomas) en una franja a cada lado de la unión, para que el bosque «empiece» antes de la línea.
//   3 · BARRERAS DE RELIEVE: cada arista CERRADA (Bosque|Oriental, Cumbres|Oriental, Pradera|Costa, Desierto|Volcán; 49a: en las dos orientaciones) se cierra con una CORDILLERA centrada en la línea
//       (BIOMES.addRange; núcleo infranqueable = acantilado, sin pared recta de tile ni props). `?range=0` las quita (queda el anillo de siempre).
//   4 · Lo que quedó dentro del núcleo se retira (árboles) o se avisa por consola (POI, guaridas, zonas de recurso: no debería haber ninguno).
// Para abrir o cerrar una unión: edita `BIOMES.PROG` / `openPairs` en biomes.js; este archivo ya hace el camino y los bosquetes de cualquier unión abierta.
// Estadísticas (herramientas de prueba): `SEAMS = {roads, groves, ranges, removed, ms}`.
(()=>{
 const G=typeof globalThis!=='undefined'?globalThis:window;
 if(typeof BIOMES==='undefined'||!BIOMES.seams)return;
 const qs=typeof location!=='undefined'?location.search:'',list=BIOMES.list,TK=BIOMES.tk,vn=BIOMES.geo.vn;
 const t0=typeof performance!=='undefined'?performance.now():0,ST=G.SEAMS={roads:0,groves:0,ranges:[],removed:0,warn:[],ms:0};

 // lado «de origen» y «de destino» de una unión según la geometría: A = el de la izquierda / el de arriba; B = el de la derecha / el de abajo
 const ends=s=>{const a=list[s.a],b=list[s.b],first=s.vert?(a.ox<b.ox):(a.oy<b.oy);return first?[a,b]:[b,a]};

 // ── 1 · camino principal continuo ──
 // extremo de una ruta de un bioma más cercano a la línea de unión (coordenada de mundo `sc` en el eje `vert?x:y`), en coordenadas LOCALES
 const nearEnd=(B,sc,vert)=>{let best=null,bd=1e9;for(const r of B.routes)for(const q of [r[0],r[r.length-1]]){const d=vert?Math.abs(B.ox+q[0]-sc):Math.abs(B.oy+q[1]-sc);if(d<bd){bd=d;best=q}}return best};
 const newRoutes=[];   // [bioma, ruta] añadidas (para limpiar árboles de los bosques ya generados)
 BIOMES.openSeams.forEach(s=>{const[A,B]=ends(s),sc=s.vert?s.x:s.y,ea=nearEnd(A,sc,s.vert),eb=nearEnd(B,sc,s.vert);if(!ea||!eb)return;
  // en coordenadas de MUNDO: final de la carretera de A y comienzo de la de B; el tramo nuevo se guarda en B (puntos locales de B), con una S suave
  const ax=A.ox+ea[0],ay=A.oy+ea[1],bx=B.ox+eb[0],by=B.oy+eb[1];if(s.vert?bx-ax<8:by-ay<8)return;   // ya se tocan
  const n=6,pts=[];for(let i=0;i<=n;i++){const u=i/n,e=u*u*(3-2*u);pts.push(s.vert?[Math.round(ax+(bx-ax)*u-B.ox),Math.round(ay+(by-ay)*e-B.oy)]:[Math.round(ax+(bx-ax)*e-B.ox),Math.round(ay+(by-ay)*u-B.oy)])}
  B.routes.push(pts);newRoutes.push([B,pts]);ST.roads++});

 // ── 2 · bosquetes de transición ── (a cada lado de una unión abierta; solo si el bioma tiene bosques, y mezclando las especies de ambos)
 const kindsOf=B=>{const c={};B.village.props.forEach(p=>{if(p._grove)c[p.n]=(c[p.n]||0)+1});return Object.keys(c).sort((a,b)=>c[b]-c[a]).slice(0,3)};
 if(TK.groves)BIOMES.openSeams.forEach(s=>{const[A,B]=ends(s),ka=kindsOf(A),kb=kindsOf(B),mix=Array.from(new Set(ka.concat(kb)));if(!mix.length)return;
  const ts=[];for(let t=s.lo+700;t<s.hi-500;t+=900)ts.push(t);
  // vertical: A termina en x = A.w (dir −1) y B empieza en x = 0 (dir +1); horizontal: igual con y. i = índice a lo largo de la unión.
  const mk=(Bk,edge,dir)=>ts.map((t,i)=>{const o=edge+dir*(60+(i%3)*50),j=((i*37)%5-2)*40,kk=i%3?mix:(dir<0?ka:kb);
   return s.vert?[o,t-Bk.oy+j,260+(i%2)*60,210,7,kk]:[t-Bk.ox+j,o,260+(i%2)*60,210,7,kk]});
  const da=mk(A,s.vert?A.w:A.h,-1),db=mk(B,0,1);TK.groves(A,da,true);TK.groves(B,db,true);ST.groves+=da.length+db.length});

 // los caminos nuevos no deben quedar tapados por árboles que ya existían (misma regla que groves(): nada a < 60 px de una ruta)
 newRoutes.forEach(([B,pts])=>{const P=B.village.props;for(let i=P.length-1;i>=0;i--){const e=P[i];if(!e._grove)continue;
  for(let j=0;j<pts.length-1;j++){const a=pts[j],c=pts[j+1],dx=c[0]-a[0],dy=c[1]-a[1],l=dx*dx+dy*dy||1,u=Math.max(0,Math.min(1,((e.x-a[0])*dx+(e.y-a[1])*dy)/l));if(Math.hypot(e.x-a[0]-dx*u,e.y-a[1]-dy*u)<64){P.splice(i,1);break}}}});

 // ── 3 · barreras de relieve en TODAS las aristas cerradas (verticales y horizontales) ──
 const COL={'0|8':['#4e4a44','#7c776e','#b4aea0'],      // Pradera|Costa: acantilado costero de piedra clara
  '3|4':['#4a5660','#7c8a98','#c4d0da'],                // Cumbres|Oriental: roca nevada (muralla norte de la capital)
  '1|4':['#40453f','#666c60','#97a08e'],                // Bosque|Oriental: roca gris verdosa (muralla oeste de la capital)
  '5|7':['#3a2624','#6a3e36','#a45c42']};               // Desierto|Volcán: cañón de lava
 const PK={'0|8':9,'3|4':10,'1|4':8,'5|7':10};
 if(!/[?&]range=0\b/.test(qs)&&BIOMES.addRange){
  BIOMES.seams.filter(s=>!s.open).forEach((s,si)=>{const id=s.a+'|'+s.b,L=s.hi-s.lo,n=Math.max(6,Math.round(L/700)),pts=[];
   for(let i=0;i<=n;i++){const u=i/n,t=s.lo-80+(L+160)*u,m=Math.round((vn(i*.9+si*7,3.3+si,11)-.5)*80);   // cresta casi sobre la línea, con ±40 px de meandro (el núcleo la cubre con margen)
    pts.push(s.vert?[Math.round(s.x+m),Math.round(t)]:[Math.round(t),Math.round(s.y+m)])}
   ST.ranges.push(BIOMES.addRange({id,p:pts,w:210,f:300,amp:80,seed:5+si*11,pk:PK[id]||8,col:COL[id]||COL['1|4']}))});
  // ── 4 · limpiar el núcleo (+1 tile de margen) ──
  const core=(x,y)=>[[0,0],[32,0],[-32,0],[0,32],[0,-32]].some(o=>BIOMES.rangeAt(x+o[0],y+o[1])[0]>=2);
  list.forEach(B=>{const P=B.village.props;for(let i=P.length-1;i>=0;i--)if(core(B.ox+P[i].x,B.oy+P[i].y)){P.splice(i,1);ST.removed++}
   (B.pois||[]).forEach(p=>{if(core(B.ox+p.x,B.oy+p.y)){ST.warn.push('POI '+B.n+':'+p.id);console.warn('[seams] POI dentro de una cordillera:',B.n,p.id)}});
   Object.entries(B.spots||{}).forEach(([id,sp])=>{if(core(B.ox+(sp.z[0]+sp.z[1])/2,B.oy+(sp.z[2]+sp.z[3])/2)){ST.warn.push('guarida '+B.n+':'+id);console.warn('[seams] guarida dentro de una cordillera:',B.n,id)}});
   ['wc','mi','fi'].forEach(t=>((B.lay&&B.lay[t])||[]).forEach(it=>{if(core(B.ox+(it.z[0]+it.z[1])/2,B.oy+(it.z[2]+it.z[3])/2)){ST.warn.push('zona '+t+' '+B.n);console.warn('[seams] zona de recurso dentro de una cordillera:',B.n,t)}}))})}
 ST.ms=typeof performance!=='undefined'?Math.round(performance.now()-t0):0;
})();
