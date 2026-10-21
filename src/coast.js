// NotScape · FASE 49b (19 oct 2026) · COSTA DEL CONTINENTE: máscara de tierra con costa irregular, playas y mar abierto en lugar del anillo de acantilado exterior.
// Se carga DESPUÉS de seams.js (los datos del mundo ya están construidos y escalados) y ANTES de world-iso.js (que la consulta en `tileH`).
// Qué hace (docs/PLAN_MUNDO_ABIERTO.md §11.3 punto 1 y §11.4 «49b»):
//   1 · CAMPO DE COSTA `L` (tiles, + = tierra adentro, − = mar) en una rejilla gruesa (CG tiles por celda, interpolación bilineal → costa suave, sin escalera):
//         L = min( max(Lbase, K) , profundidadAlBorde − MIN_D )
//       Lbase = profundidad dentro de un RECTÁNGULO REDONDEADO del tamaño del mundo (esquinas redondas, radio RC) − inset(x,y); el inset es ruido a tres escalas (bahías/cabos grandes,
//       entrantes medianos, dentado fino) + 3 accidentes diseñados (golfo de la Costa, bahía del Pantano, cabo del Volcán).
//       K = campo de PROTECCIÓN: discos/rectángulos alrededor de lo que NO puede quedar en el mar (aldeas, estaciones, cofres/santuarios, guaridas, zonas de recurso, carreteras, spawn y jefes)
//       con margen; la costa los rodea. MIN_D garantiza ≥ MIN_D tiles de mar entre la tierra y el borde RECTO del mundo (ahí empieza la lámina de mar exterior del 3D).
//   2 · Lo que SÍ es prescindible se poda: los props/árboles de `village.props` que caen en el mar o a ≤ 1 tile de la orilla (`COAST.removed`).
//   3 · API (`BIOMES.coast`):
//         .on                 true si la costa está activa (`?coast=0` la apaga: vuelve el anillo de acantilado y la caja recta de siempre)
//         .land(tx,ty)        1 si el tile (por su centro) es tierra, 0 si es mar exterior (fuera del mundo → 0)
//         .D(x,y)             campo de costa en (x,y) px de mundo: tiles tierra adentro (>0) o mar adentro (<0). Continuo.
//         .sand(tx,ty)        fuerza de playa 0..1 por tile (la usa `TER.sandAt` → lógica, props y mapa)
//         .sandAt(x,y)        fuerza de playa 0..1 continua en px de mundo (la usa el color por vértice del terreno 3D)
//         .PAD                tiles de mar que el 3D dibuja más allá del borde del mundo
//         .stats              {landTiles, seaTiles, shore (largo de costa en tiles), perim, protegidos, removed, ms}
// Todo es determinista (ruido por semilla fija) y barato (rejilla de ~123 000 celdas, ~25 ms).
(()=>{
 if(typeof BIOMES==='undefined'||!BIOMES.list||!BIOMES.geo)return;
 const T=32,list=BIOMES.list,NX=Math.ceil(BIOMES.WW/T),NY=Math.ceil(BIOMES.WH/T);
 const ZB=list.find(b=>b.zone)||null,NXc=ZB?Math.round(NX*BIOMES.COLS0/BIOMES.COLS):NX;   // Lote ISLA-1: con la ZONA del Cielo el mundo tiene 4 columnas; NXc = ancho del CONTINENTE (3 columnas) en tiles. Sin zona: NXc = NX (todo igual que antes)
 const qs=typeof location!=='undefined'?location.search:'';
 const t0=typeof performance!=='undefined'?performance.now():0;
 const ST={landTiles:0,seaTiles:0,shore:0,perim:2*(NX+NY),protegidos:0,removed:0,ms:0};
 const API={on:!/[?&]coast=0\b/.test(qs),PAD:112,MIN_D:3.5,BEACH:3.2,SHELF:10,stats:ST,NX,NY};
 BIOMES.coast=API;
 if(!API.on){API.land=()=>1;API.D=()=>1e3;API.sand=()=>0;API.sandAt=()=>0;return}

 // ── parámetros de forma (en tiles) ──
 const CG=2,GX=Math.ceil(NX/CG)+2,GY=Math.ceil(NY/CG)+2;
 const RC=130,INSET=15;                      // radio de las esquinas redondeadas (la esquina del mundo retrocede ≈ 0,41·RC en diagonal) · retroceso medio de la costa respecto al borde del mundo
 const hx=NXc/2,hy=NY/2;
 // ruido de valor con hash ENTERO (Math.sin es ~10× más lento y esto se evalúa ~400 000 veces al cargar)
 const hh=(i,j,s)=>{let h=Math.imul(i,374761393)+Math.imul(j,668265263)+Math.imul(s,1442695041);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};
 const vn=(x,y,s)=>{const i=Math.floor(x),j=Math.floor(y),u=x-i,v=y-j,a=u*u*(3-2*u),b=v*v*(3-2*v),A=hh(i,j,s),B=hh(i+1,j,s),C=hh(i,j+1,s),D=hh(i+1,j+1,s);return A+(B-A)*a+(C-A)*b+(A-B-C+D)*a*b};
 const nz=(x,y,s,seed)=>(vn(x/s,y/s,seed)-.5)*2,hyp=(a,b)=>Math.sqrt(a*a+b*b);
 // accidentes diseñados: d > 0 = el mar entra (bahía/golfo), d < 0 = la tierra sale (cabo). Gaussianas elípticas centradas en (cx,cy) tiles.
 const FEAT=[
  {n:'Golfo de las Tormentas',cx:NXc/2,cy:NY,rx:52,ry:26,d:26},       // sur-centro: la Costa de las Tormentas abraza un golfo (puerto futuro, Fase 50c)
  {n:'Bahía del Pantano',cx:NXc*.17,cy:0,rx:64,ry:18,d:15},            // norte-oeste: bahía ancha y poco profunda
  {n:'Cabo del Volcán',cx:NXc-26,cy:NY-26,rx:46,ry:46,d:-9},           // sureste: la tierra sale hacia la esquina (contrarresta el redondeo)
  {n:'Cabo del Páramo',cx:NXc,cy:NY*.14,rx:20,ry:44,d:-7}];            // noreste: península estrecha
 // profundidad (tiles) dentro del rectángulo redondeado del mundo; negativa fuera (SDF estándar de caja redondeada: sd = |max(q,0)| + min(max(qx,qy),0) − RC; profundidad = −sd)
 const depth=(x,y)=>{const qx=Math.abs(x-hx)-(hx-RC),qy=Math.abs(y-hy)-(hy-RC);return -(hyp(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-RC)};
 const edge=(x,y)=>x>=NXc?Math.min(y,NY-y,NX-x):Math.min(x,y,NXc-x,NY-y);   // ISLA-1: las celdas de la zona miden la distancia a SU borde (no al del continente)   // distancia (tiles) al borde RECTO del mundo: la regla dura MIN_D usa esta (no la del rectángulo redondeado, para no ahogar contenido que vive en las esquinas)
 const inset=(x,y)=>{let v=INSET+11*nz(x,y,120,71)+5.5*nz(x,y,40,72)+1.4*nz(x,y,11,73);
  for(const f of FEAT){const dx=(x-f.cx)/f.rx,dy=(y-f.cy)/f.ry;v+=f.d*Math.exp(-(dx*dx+dy*dy))}return v};

 // ── campo de protección K (tiles; ≥ 0 = a menos de «margen» de algo que no puede quedar en el mar) ──
 const K=new Float32Array(GX*GY).fill(-1e3);let nProt=0;
 const disc=(cx,cy,r)=>{nProt++;const i0=Math.max(0,Math.floor((cx-r)/CG)),i1=Math.min(GX-1,Math.ceil((cx+r)/CG)),j0=Math.max(0,Math.floor((cy-r)/CG)),j1=Math.min(GY-1,Math.ceil((cy+r)/CG));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const v=r-hyp(i*CG-cx,j*CG-cy);if(v>K[j*GX+i])K[j*GX+i]=v}};
 const rect=(x0,x1,y0,y1,m)=>{nProt++;const i0=Math.max(0,Math.floor((x0-m)/CG)),i1=Math.min(GX-1,Math.ceil((x1+m)/CG)),j0=Math.max(0,Math.floor((y0-m)/CG)),j1=Math.min(GY-1,Math.ceil((y1+m)/CG));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const px=i*CG,py=j*CG,dx=Math.max(x0-px,0,px-x1),dy=Math.max(y0-py,0,py-y1),v=m-hyp(dx,dy);if(v>K[j*GX+i])K[j*GX+i]=v}};
 // cápsula (segmento con radio): une un elemento protegido con el interior del continente para que no quede un islote o un cuello fino (la costa lo ABRAZA como un cabo)
 const cap=(ax,ay,bx,by,r)=>{const i0=Math.max(0,Math.floor((Math.min(ax,bx)-r)/CG)),i1=Math.min(GX-1,Math.ceil((Math.max(ax,bx)+r)/CG)),j0=Math.max(0,Math.floor((Math.min(ay,by)-r)/CG)),j1=Math.min(GY-1,Math.ceil((Math.max(ay,by)+r)/CG)),dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy||1;
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const px=i*CG,py=j*CG,u=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/l2)),v=r-hyp(px-ax-dx*u,py-ay-dy*u);if(v>K[j*GX+i])K[j*GX+i]=v}};
 const toCenter=(cx,cy,len,r)=>{const dx=hx-cx,dy=hy-cy,l=hyp(dx,dy)||1;cap(cx,cy,cx+dx/l*len,cy+dy/l*len,r)};
 // PROTEGIDO (no puede quedar en el mar): spawn, jefes, estaciones, cofres/santuarios, guaridas. PRESCINDIBLE (se poda o se recoloca): árboles/props, zonas de recurso (los nodos se recolocan en tierra: game.js `relocate`) y carreteras (se cortan en la orilla).
 list.forEach(B=>{const ox=B.ox,oy=B.oy,W=(x,y)=>[(ox+x)/T,(oy+y)/T];
  {const p=W(B.spawn[0],B.spawn[1]);disc(p[0],p[1],14)}
  if(B.bossPos&&!B.noBoss){const p=W(B.bossPos[0],B.bossPos[1]);disc(p[0],p[1],14);toCenter(p[0],p[1],40,10)}
  ((B.village&&B.village.stations)||[]).forEach(s=>{const p=W(s[2],s[3]);disc(p[0],p[1],10)});
  (B.pois||[]).forEach(q=>{const p=W(q.x,q.y),r=Math.max(9,(q.r||0)/T+5);disc(p[0],p[1],r);toCenter(p[0],p[1],45,r*.75)});
  Object.values(B.spots||{}).forEach(sp=>{if(!sp||!sp.z)return;const x0=(ox+sp.z[0])/T,x1=(ox+sp.z[1])/T,y0=(oy+sp.z[2])/T,y1=(oy+sp.z[3])/T;rect(x0,x1,y0,y1,6);toCenter((x0+x1)/2,(y0+y1)/2,45,Math.max(8,Math.min(x1-x0,y1-y0)/2))})});
 ST.protegidos=nProt;

 // ── ISLA-1 · campo de la ZONA del Cielo: elipse irregular (rx 32, ry 24 tiles; el contorno sale de ruido angular a 3 escalas, igual que en la demo docs/style-reference/r3d/isla-cielo.html) ──
 // devuelve tiles tierra adentro (>0) o mar adentro (<0); la protección K (spawn, estaciones) también la sostiene
 const ZI=ZB&&BIOMES.zone?(()=>{const Z=BIOMES.zone,zx=Z.cx/T,zy=Z.cy/T,rx=Z.rx,ry=Z.ry,m=Math.min(rx,ry);
  return(x,y)=>{const dx=x-zx,dy=y-zy,d=Math.hypot(dx/rx,dy/ry),a=Math.atan2(dy,dx),ca=Math.cos(a),sa=Math.sin(a);
   const rr=1+.16*(vn(ca*1.3+3,sa*1.3,1)-.5)*2+.08*(vn(ca*3.7,sa*3.7+5,2)-.5)*2+.035*(vn(ca*9,sa*9,3)-.5)*2;return(rr-d)*m}})():null;
 // ── campo final L ──
 const F=new Float32Array(GX*GY);
 for(let j=0;j<GY;j++)for(let i=0;i<GX;i++){const x=i*CG,y=j*CG,dp=depth(x,y),lb=dp-inset(x,y),k=K[j*GX+i];F[j*GX+i]=ZI&&x>=NXc?Math.min(Math.max(ZI(x,y),k),edge(x,y)-API.MIN_D):Math.min(Math.max(lb,k),edge(x,y)-API.MIN_D)}
 // un pase de suavizado 3×3 (binomial) para ablandar los pliegues donde se unen la costa libre y la protegida; luego se vuelve a imponer MIN_D
 {const G=new Float32Array(F);for(let j=1;j<GY-1;j++)for(let i=1;i<GX-1;i++){const o=j*GX+i;G[o]=(4*F[o]+2*(F[o-1]+F[o+1]+F[o-GX]+F[o+GX])+F[o-GX-1]+F[o-GX+1]+F[o+GX-1]+F[o+GX+1])/16}
  for(let j=0;j<GY;j++)for(let i=0;i<GX;i++){const o=j*GX+i;F[o]=Math.min(G[o],edge(i*CG,j*CG)-API.MIN_D)}}

 // ── consulta (bilineal) ──
 const D=(xp,yp)=>{const u=Math.max(0,Math.min(GX-1.001,xp/T/CG)),v=Math.max(0,Math.min(GY-1.001,yp/T/CG)),i=u|0,j=v|0,a=u-i,b=v-j,o=j*GX+i;
  return(F[o]*(1-a)+F[o+1]*a)*(1-b)+(F[o+GX]*(1-a)+F[o+GX+1]*a)*b};
 API.D=D;API.dbg={K,F,GX,GY,CG,depth,inset};
 const LAND=new Uint8Array(NX*NY);for(let ty=0;ty<NY;ty++)for(let tx=0;tx<NX;tx++)LAND[ty*NX+tx]=D((tx+.5)*T,(ty+.5)*T)>0?1:0;
 API.land=(tx,ty)=>tx<0||ty<0||tx>=NX||ty>=NY?0:LAND[ty*NX+tx];
 const sm=t=>t<=0?0:t>=1?1:t*t*(3-2*t);
 API.sandAt=(xp,yp)=>{if(ZB&&xp>=NXc*T)return 0;const d=D(xp,yp);return d<=0?0:1-sm(d/API.BEACH)};   // la zona del Cielo no tiene playa
 API.sand=(tx,ty)=>API.sandAt((tx+.5)*T,(ty+.5)*T);

 // ── estadísticas y poda de props en el mar ──
 for(let i=0;i<LAND.length;i++){if(LAND[i])ST.landTiles++;else ST.seaTiles++}
 for(let ty=0;ty<NY-1;ty++)for(let tx=0;tx<NX-1;tx++){const a=LAND[ty*NX+tx];if(a!==LAND[ty*NX+tx+1])ST.shore++;if(a!==LAND[(ty+1)*NX+tx])ST.shore++}
 list.forEach(B=>{const P=B.village&&B.village.props;if(!P)return;for(let i=P.length-1;i>=0;i--){const e=P[i];if(D(B.ox+e.x,B.oy+e.y)<1){P.splice(i,1);ST.removed++}}});
 ST.ms=typeof performance!=='undefined'?Math.round(performance.now()-t0):0;
})();
