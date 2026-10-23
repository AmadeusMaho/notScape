// NotScape · FASE 44-0 (i) · MUNDO ×K (19 oct 2026). Se carga DESPUÉS de layouts.js y ANTES de props/world-iso/game.
// Los layouts (src/layouts.js, biomes.js, biome-spots.js) siguen escritos para un bioma de 4608×3008 px con la aldea en (2300,1500). Aquí se les aplica UNA transformación
// de escala `W2` a los datos ya construidos, en lugar de reescribir cientos de coordenadas a mano. K = 2 (por defecto) → bioma 9216×6016 px = 288×188 tiles, mundo 27 648×12 032 px.
//   · `?wk=1` (o window.WORLD_K=1 antes de cargar) = el mundo de siempre, IDÉNTICO (la transformación no se aplica). `?wk=1.5`… admite 1–6 (desde el 23 oct 2026; 1–3 son los valores probados con 3D, 4–6 solo medidos sin 3D).
//   · W2 por eje: un NÚCLEO de ±A0 px alrededor del centro de la aldea se ESCALA ×VK (= `vilXf`, Fase 44b, 19 oct 2026: la aldea crece ×1,5 lineal en las SEIS aldeas con la misma función; antes era una
//     meseta de ±640 px que solo se trasladaba) y fuera de él el espacio se estira LINEALMENTE hasta que el borde del bioma cae exactamente en K× su posición (bordes, compuertas y rejilla de biomas
//     siguen alineados con las losetas de 32 px). `?vk=1` = núcleo sin escalar (comparar); `?vk=1.5` (por defecto), admite 1–2.
//   · Qué se mueve cómo: PUNTOS (props sueltos, caminos, estaciones, POI) → W2; FORMAS DE TERRENO (lagos, colinas, río, mar, charcas de pesca) → su caja se estira (el río sigue
//     encadenado); GUARIDAS Y CAMPAMENTOS (spots, POI y su decorado, arena del jefe) y ZONAS DE TALA/MINA → se mueven RÍGIDAS (mismo tamaño, nuevo sitio); BOSQUES → se regeneran con las
//     elipses escaladas y el MISMO número de árboles por área (densidad ×WS.forest = 0,6 respecto a la de antes: «praderas de paso» entre bosques, ≈ 8 600 árboles en todo el mundo).
//   · Lo que NO hace (Fase 44-0 iii, «poblar»): no añade contenido nuevo. Entre guaridas el mundo queda más vacío; cada Fase 7–11 rellena su bioma.
// API: `WS = {K, on, A, W, H, C, fx(lx), fy(ly), pt(lx,ly), old2new(k,x,y)}`. `old2new` convierte una posición de MUNDO del layout antiguo (×1) a la del mundo actual (scripts y guardados).
(()=>{
 const G=typeof globalThis!=='undefined'?globalThis:window;
 const qs=typeof location!=='undefined'?location.search:'';
 const mm=/[?&]wk=([\d.]+)/.exec(qs);
 const K=Math.max(1,Math.min(6,(mm?+mm[1]:+G.WORLD_K)||2));
 const OW=4608,OH=3008,CX=2300,CY=1500,T=32;
 const vm=/[?&]vk=([\d.]+)/.exec(qs),VK=Math.max(1,Math.min(2,vm?+vm[1]:(+G.VILLAGE_K||1.5))),A0=VK>1?500:640;   // vilXf: escala del núcleo de aldea (Fase 44b). Con VK=1 el núcleo vuelve a ser la meseta de ±640 px que solo se trasladaba (= el mundo de la Fase 44a, idéntico)
 const NW=Math.round(OW*K/T)*T,NH=Math.round(OH*K/T)*T,C1X=Math.round(CX*NW/OW),C1Y=Math.round(CY*NH/OH);
 // eje: l = coordenada LOCAL antigua, c = centro antiguo, L = largo antiguo, N = largo nuevo, c1 = centro nuevo
 const ax=(l,c,L,N,c1)=>{const u=l-c;if(u>=-A0&&u<=A0)return c1+u*VK;const E=VK*A0;return u>0?c1+E+(u-A0)*((N-c1-E)/(L-c-A0)):c1-E-(-u-A0)*((c1-E)/(c-A0))};
 const fx=l=>ax(l,CX,OW,NW,C1X),fy=l=>ax(l,CY,OH,NH,C1Y);
 const WS=G.WS={K,on:K!==1,VK,A0,A:A0,forest:.6,W:NW,H:NH,C:[C1X,C1Y],fx,fy,pt:(x,y)=>[fx(x),fy(y)]};
 if(K===1||typeof BIOMES==='undefined')return;
 const TK=BIOMES.tk,list=BIOMES.list,oldPlace=list.map(b=>b.place?{ox:b.place.ox,oy:b.place.oy}:{ox:0,oy:0});
 WS.old2new=(k,x,y)=>{const o=oldPlace[k];return[o.ox*NW/OW+fx(x-o.ox),o.oy*NH/OH+fy(y-o.oy)]};
 // cada objeto se transforma UNA sola vez aunque esté compartido (los spots comparten arrays con plaza, cobs y routes)
 const S=new WeakSet(),once=o=>{if(S.has(o))return false;S.add(o);return true};
 const P2=q=>{if(once(q)){q[0]=fx(q[0]);q[1]=fy(q[1])}},                        // [x,y,…] → W2
  mvA=(q,dx,dy)=>{if(once(q)){q[0]+=dx;q[1]+=dy}},                               // [x,y,…] → desplazamiento rígido
  mvM=(m,dx,dy)=>{if(once(m)){m[1]+=dx;m[2]+=dy}},                               // mob [id,x,y] → rígido
  prop=p=>{if(once(p)){p.x=Math.round(fx(p.x));p.y=Math.round(fy(p.y))}},        // {x,y} → W2
  mvP=(p,dx,dy)=>{if(once(p)){p.x+=dx;p.y+=dy}},                                 // {x,y} → rígido
  rect=r=>{if(once(r)){const a=fx(r[0]),b=fx(r[1]),c=fy(r[2]),d=fy(r[3]);r[0]=a;r[1]=b;r[2]=c;r[3]=d}},       // [x0,x1,y0,y1] estirado
  rectR=(r,dx,dy)=>{if(once(r)){r[0]+=dx;r[1]+=dx;r[2]+=dy;r[3]+=dy}},         // [x0,x1,y0,y1] rígido
  ext=(c,r)=>{const x0=fx(c[0]-r[0]),x1=fx(c[0]+r[0]),y0=fy(c[1]-r[1]),y1=fy(c[1]+r[1]);return{c:[(x0+x1)/2,(y0+y1)/2],r:[(x1-x0)/2,(y1-y0)/2]}},    // elipse (centro, radios) → su caja estirada
  blob=q=>{if(once(q)){const e=ext(q.c,q.r);q.c=e.c;q.r=e.r}},
  // un trozo rígido (zona de tala/mina, guarida) se mueve lo que se mueve el centro de su zona
  delta=z=>{const cx=(z[0]+z[1])/2,cy=(z[2]+z[3])/2;return[fx(cx)-cx,fy(cy)-cy]};
 const t0=typeof performance!=='undefined'?performance.now():0;
 list.forEach((B,k)=>{
  const V=B.village,props=V.props,L=B.lay,op=oldPlace[k];
  // 1 · bosques: fuera los árboles generados (se regeneran al final con las elipses escaladas)
  const gd=(B._gdefs||[]).slice(),kept=props.filter(e=>!e._grove);props.splice(0,props.length,...kept);
  // 2 · guaridas (spots): rígidas. La zona manda cuánto se mueven (mobs [id,x,y], decorado, adoquín, piedras); sus caminos van con W2 más abajo.
  for(const key in B.spots){const sp=B.spots[key],[dx,dy]=delta(sp.z);rectR(sp.z,dx,dy);sp.mobs.forEach(m=>mvM(m,dx,dy));(sp.dirt||[]).forEach(d=>mvA(d,dx,dy));
   (sp.stone||[]).forEach(r=>{if(once(r))r.p.forEach(q=>{if(once(q)){q[0]+=dx;q[1]+=dy}})});sp.decor.forEach(e=>mvP(e,dx,dy))}
  // 3 · POI: el punto va con W2; campamentos y santuarios arrastran su decorado (props a < R px del punto, aún sin mover)
  (B.pois||[]).forEach(p=>{const ox=p.x,oy=p.y,dx=fx(ox)-ox,dy=fy(oy)-oy,R=p.k==='camp'?125:p.k==='santuario'?60:0;
   if(R)props.forEach(e=>{if(!S.has(e)&&Math.hypot(e.x-ox,e.y-oy)<R)mvP(e,dx,dy)});p.x=Math.round(ox+dx);p.y=Math.round(oy+dy)});
  // 4 · arena del jefe: props a < 240 px de bossPos rígidos con él; el círculo de adoquín de la arena también
  {const[bx,by]=B.bossPos,dx=fx(bx)-bx,dy=fy(by)-by;props.forEach(e=>{if(!S.has(e)&&Math.hypot(e.x-bx,e.y-by)<240)mvP(e,dx,dy)});
   (V.plaza||[]).forEach(q=>{if(!S.has(q)&&Math.hypot(q[0]-bx,q[1]-by)<2)mvA(q,dx,dy)});B.bossPos=[bx+dx,by+dy]}
  // 5 · aldea y todo lo suelto: puntos con W2 (dentro de la meseta es una traslación pura)
  // vilXf (44b): lo que está dentro del núcleo de aldea (±A0 del centro) escala también su TAMAÑO: radio de cada círculo de plaza (q[2]), ancho de cada calle adoquinada (c.w) y semiejes de la zona segura
  const inC=(x,y)=>Math.abs(x-CX)<=A0&&Math.abs(y-CY)<=A0;
  props.forEach(prop);(V.stations||[]).forEach(e=>{if(once(e)){e[2]=fx(e[2]);e[3]=fy(e[3])}});(V.plaza||[]).forEach(q=>{if(once(q)){const c=inC(q[0],q[1]);q[0]=fx(q[0]);q[1]=fy(q[1]);if(c)q[2]*=VK}});
  (V.cobs||[]).forEach(c=>{if(once(c)){const ic=c.p.every(q=>inC(q[0],q[1]));c.p.forEach(P2);if(ic)c.w*=VK}});if(V.safe&&once(V.safe)){V.safe[0]=fx(V.safe[0]);V.safe[1]=fy(V.safe[1]);V.safe[2]*=VK;V.safe[3]*=VK}
  if(V.bridge&&once(V.bridge)){V.bridge.x=V.bridge.x.map(fx);V.bridge.y=V.bridge.y.map(fy)}
  (B.routes||[]).forEach(r=>r.forEach(P2));[B.spawn,B.cen].forEach(P2);
  // 6 · terreno: formas orgánicas estiradas; zonas de tala y mina rígidas; charcas de pesca estiradas
  (L.lakes||[]).forEach(blob);(L.hills||[]).forEach(blob);(L.water||[]).forEach(rect);(L.cliff||[]).forEach(rect);
  if(L.sea&&once(L.sea)){L.sea.y=fy(L.sea.y);L.sea.amp=L.sea.amp*K;L.sea.f=1/K}
  ['wc','mi'].forEach(t=>(L[t]||[]).forEach(it=>{const[dx,dy]=delta(it.z);(it.r||[]).forEach(r=>rectR(r,dx,dy));rectR(it.z,dx,dy)}));
  (L.fi||[]).forEach(it=>{rect(it.z);(it.r||[]).forEach(rect)});
  // 7 · pasos entre biomas. exitE/entryW son rangos de y LOCAL (se centran con W2 y conservan su ancho de 114 px).
  ['exitE','entryW'].forEach(f=>{const r=B[f],c=fy((r[0]+r[1])/2),h=(r[1]-r[0])/2;B[f]=[Math.round(c-h),Math.round(c+h)]});
  if(B.gate){const g=B.gate,kx=NW/OW,ky=NH/OH,nox=op.ox*kx,noy=op.oy*ky;
   if(g.vert){const c=noy+fy((g.y0+g.y1)/2-op.oy),h=(g.y1-g.y0)/2;g.x*=kx;g.y0=Math.round(c-h);g.y1=Math.round(c+h)}
   else{const c=nox+fx((g.x0+g.x1)/2-op.ox),h=(g.x1-g.x0)/2;g.y*=ky;g.x0=Math.round(c-h);g.x1=Math.round(c+h)}}
  // 8 · tamaño y colocación del rectángulo
  B.w=NW;B.h=NH;if(B.place){B.place.ox=op.ox*NW/OW;B.place.oy=op.oy*NH/OH}
  // 9 · bosques regenerados: misma densidad (n × área nueva/área vieja) en las elipses escaladas, evitando ya los caminos, el agua y las guaridas NUEVOS
  if(TK.groves&&gd.length){const defs=gd.map(([cx,cy,rx,ry,n,kinds])=>{const e=ext([cx,cy],[rx,ry]);return[e.c[0],e.c[1],e.r[0],e.r[1],Math.max(4,Math.round(n*WS.forest*(e.r[0]*e.r[1])/(rx*ry))),kinds]});B._gdefs=[];TK.groves(B,defs,true)}
 });
 WS.ms=typeof performance!=='undefined'?Math.round(performance.now()-t0):0;   // coste de la transformación (incluye regenerar los bosques)
 BIOMES.finish();   // recalcula ox/oy, WW/WH y las compuertas con los tamaños nuevos
 // ── RELIEVE: la cordillera de PRUEBA `sur` de la Fase 44-0 (ii) se retiró en la Fase 44a: ahora las barreras de relieve de los bordes sin paso (Pradera|Volcán y Bosque|Oriental) las crea src/seams.js
 //    (mismo motor BIOMES.addRange/rangeAt, centradas en la línea de unión; `?range=0` las quita).
 WS.stats=()=>list.map(b=>({n:b.n,w:b.w,h:b.h,ox:b.ox,oy:b.oy,props:b.village.props.length}));
})();
