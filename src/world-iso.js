// NotScape · terreno isométrico con 3 alturas (agua .75, suelo 1, acantilado 2). F1-B: rombos planos; F2-B: pintado como diorama (pincel + tinta, chunks en caché).
// Requiere iso.js y paint.js cargados antes. La colisión NO sale de aquí: sigue siendo blk()/BLK/cliff() en px de mundo.
// Usa globales de game.js solo en tiempo de ejecución (BI, WW, WH, BLK, S), nunca al cargar.
const TER=(()=>{
 const T=ISO.TILE,HW=ISO.HW,HH=ISO.HH,LV=ISO.LV,HWATER=.75,HGROUND=1,HCLIFF=2,
  NX=Math.ceil(BIOMES.WW/T),NY=Math.ceil(BIOMES.WH/T);   // = WW/T, WH/T (de biomes.js; WW/WH = caja que envuelve a los rectángulos de los biomas)
 // paleta por bioma de la guía §3 (suelo base, luz, sombra, agua); Cumbres = «Nieve». Datos, no código por bioma.
 const PAL=BIOMES.list.map(b=>b.pal);
 const CO=BIOMES.coast&&BIOMES.coast.on?BIOMES.coast:null;   // Fase 49b: costa del continente (src/coast.js); null = `?coast=0` o sin el módulo (anillo y caja recta de siempre)
 const STONE='#9a958d',STONEL='#d0cbc0',EARTH='#a3643d',EARTHL='#c98a5a',INK='#5b3a29',PAPER='#fdf9e3';
 const inR=(r,x,y)=>x>r[0]&&x<r[1]&&y>r[2]&&y<r[3];
 const BOF=()=>BO; let BO=null;                            // bioma de cada tile (por su centro; 255 = vacío), se rellena en grid()
 const biomeOf=(tx,ty)=>BO?(BO[ty*NX+tx]===255?0:BO[ty*NX+tx]):Math.max(0,BIOMES.at((tx+.5)*T,(ty+.5)*T));   // bioma de ATRIBUCIÓN del tile (región deformada, Fase 49a): paleta, colores, luz
 const ownerOf=(tx,ty)=>Math.max(0,BIOMES.own((tx+.5)*T,(ty+.5)*T));   // bioma DUEÑO de la casilla rectangular (geometría y datos locales: agua, colinas, mar, puentes)
 // ¿el tile (centro x,y) del anillo de borde del bioma k cae en el hueco de una compuerta? (entonces no es acantilado)
 const gateOpen=(x,y)=>{for(const g of BIOMES.gates){if(g.vert?(Math.abs(x-g.x)<T&&y>g.y0&&y<g.y1):(Math.abs(y-g.y)<T&&x>g.x0&&x<g.x1))return g}return null};
 // altura del tile por su centro. Cliff: franja de la frontera de cada bioma (salvo el hueco) y el borde del mundo.
 function tileH(tx,ty){
  if(tx<0||ty<0||tx>=NX||ty>=NY)return 0;
  const x=(tx+.5)*T,y=(ty+.5)*T,k=BIOMES.own(x,y);   // Fase 49a: la geometría la manda la casilla rectangular (BIOMES.own), no la región deformada (BIOMES.at)
  if(k<0)return 0;                                          // vacío (fuera de todo rectángulo)
  if(CO&&!CO.land(tx,ty))return BIOMES.zone&&x>=BIOMES.zone.x0?0:HWATER;   // ISLA-2: fuera de la isla del Cielo NO hay agua: vacío (el 3D pone debajo el mar de nubes; sigue siendo infranqueable)
                      // Fase 49b: MAR EXTERIOR (fuera de la máscara de tierra de src/coast.js): agua, no vacío ni anillo de acantilado; el 3D lo continúa hasta el horizonte
  const r=BIOMES.list[k],lx=x-r.ox,ly=y-r.oy;
  if(lx<T||ly<T||lx>=r.w-T||ly>=r.h-T){   // anillo de 1 tile en el borde de cada rectángulo, salvo en las compuertas y en las UNIONES ABIERTAS (Fase 44a: BIOMES.openAt; cada lado del anillo se abre solo si su unión lo está)
   if(!gateOpen(x,y)&&(((lx<T||lx>=r.w-T)&&!BIOMES.openAt(x,y,true))||((ly<T||ly>=r.h-T)&&!BIOMES.openAt(x,y,false))))return HCLIFF}
  const cl=r.lay&&r.lay.cliff;if(cl)for(const c of cl)if(lx>c[0]&&lx<c[1]&&ly>c[2]&&ly<c[3])return HCLIFF;   // macizos/crestas del layout (lay.cliff, rectángulos locales): paredes de roca pintadas como el borde
  const rg=BIOMES.ranges.length?BIOMES.rangeAt(x,y)[0]:0;if(rg>=HCLIFF)return HCLIFF;   // núcleo de una cordillera (BIOMES.ranges, Fase 44-0 ii): acantilado, no se pisa (ni siquiera sobre el agua)
  if(BIOMES.geo.water(r,lx,ly))return HWATER;              // agua orgánica (lagos/río/mar) o rectangular del layout antiguo: sale de BIOMES.geo (biomes.js)
  const gh0=BIOMES.geo.ground(r,lx,ly);return rg>gh0?rg:gh0}   // 1 = llano; 1.3, 1.6… = montículos escalonados (lay.hills) o falda de una cordillera
 const th=(tx,ty)=>GRID?(tx<0||ty<0||tx>=NX||ty>=NY?0:GRID[ty*NX+tx]):tileH(tx,ty);   // altura del tile: de la rejilla ya construida (rápido) o calculada
 const heightAt=(x,y)=>th(Math.floor(x/T),Math.floor(y/T));
 const isLand=h=>h>=HGROUND&&h<HCLIFF;   // suelo pisable: llano o montículo (1 ≤ h < 2)
 // Altura a la que se DIBUJA a quien está de pie en (x,y) (jugador, recursos, cámara). Igual que heightAt salvo en un punto pisable que visualmente cae en un
 // tile de acantilado (la banda de colisión de cliff() mide 26–28 px y el tile 32: 15 px del tile quedan pisables). Ahí se dibuja a nivel de suelo: sin «salto» de altura.
 // Los clics y el cursor siguen usando heightAt (lo que se ve). La colisión no cambia.
 // ¿hay un tile de acantilado a menos de m px de (x,y)? Es la colisión de pared: sale del MISMO tileH que se dibuja, así que lo que se ve como pared bloquea
 // (y m deja un margen antes de ella). F1-C4b: sustituye a la banda de 26–28 px de cliff() que no coincidía con los tiles.
 const cliffNear=(x,y,m)=>{const tx0=Math.floor((x-m)/T),tx1=Math.floor((x+m)/T),ty0=Math.floor((y-m)/T),ty1=Math.floor((y+m)/T);for(let tx=tx0;tx<=tx1;tx++)for(let ty=ty0;ty<=ty1;ty++)if(th(tx,ty)===HCLIFF)return true;return false};
 let elevHook=null;const standZ=(x,y)=>standZ0(x,y)+(elevHook?elevHook(x,y):0);   // + elevación de los props (props.js ELEV): el suelo de un zócalo/templo es caminable
 const standZ0=(x,y)=>{const h=heightAt(x,y);if(h===HCLIFF)return typeof blk==='function'&&!blk(x,y)?HGROUND:h;if(!GRID||h<HGROUND)return h;
  // suelo: interpolación bilineal entre los centros de los 4 tiles vecinos pisables → quien camina sube los montículos en rampa, sin saltos (los tiles se PINTAN escalonados)
  const u=x/T-.5,v=y/T-.5,i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j,g=(p,q)=>{const e=th(p,q);return isLand(e)?e:h};
  return(g(i,j)*(1-a)+g(i+1,j)*a)*(1-b)+(g(i,j+1)*(1-a)+g(i+1,j+1)*a)*b};
 // ───────── F2-B · terreno pintado (diorama) ─────────
 // La colisión y las alturas NO salen de aquí (tileH/heightAt/cliffNear no cambian). Esto solo PINTA lo que ya decide tileH:
 // cada tile se pinta una vez (pincel + tinta) en chunks de CFG.cs px lógicos, prerenderizados a ISO.scale() y guardados en una caché LRU.
 // Determinista: todo el azar sale de hash(tx,ty,bioma,capa). Un chunk no depende de los vecinos, así que se ve igual con cualquier tamaño de chunk.
 // Datos por bioma del terreno pintado. CUT = colores del corte de tierra y la piedra; DEC = motas, agua (lt/dk/orilla) y vetas. Un bioma nuevo = una fila nueva en PAL, DEC y NOTA.
 // R3D-SUELO-BLEND: el adoquín se desvanece en una banda más ancha y con más ruido (px de mundo; `?cobsoft=0` = antes)
 const COB_SOFT=(()=>{try{const v=new URLSearchParams(location.search).get('cobsoft');return v==null?16:Math.max(0,+v||0)}catch(e){return 16}})();
 let GRID=null,ROCK=null,MTN=null,PF=null,PC=null,PM=null,DK=null; // LC: cámara del frame anterior; SYNC: chunks visibles construidos en el propio frame (causan tirones; ver tools/walk_check.py)
 // ───────── F2-C2 · caminos y pasarelas ─────────
 // Los datos (rutas de tierra `routes`, plaza, calles adoquinadas `cobs`, puente `bridge`) viven en biomes.js (F3-B): BIOMES.list[k].routes / .village.
 // rellena PM (0–255: cuánto camino hay en el tile; ≥128 = camino) y DK (1 = pasarela sobre el río, 2 = pasarela de frontera)
 function buildPaths(){PM=new Uint8Array(NX*NY);DK=new Uint8Array(NX*NY);
  const SG=4,FW=NX*SG,sc=T/SG;PF=new Float32Array(FW*NY*SG);PC=new Float32Array(FW*NY*SG);
  const mark=(F,ax,ay,bx,by,w,sf)=>{sf=sf||0;const x0=Math.max(0,Math.floor((Math.min(ax,bx)-w-24-sf*2)/sc)),x1=Math.min(FW-1,Math.floor((Math.max(ax,bx)+w+24+sf*2)/sc)),y0=Math.max(0,Math.floor((Math.min(ay,by)-w-24-sf*2)/sc)),y1=Math.min(NY*SG-1,Math.floor((Math.max(ay,by)+w+24+sf*2)/sc)),dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy||1;
   for(let j=y0;j<=y1;j++)for(let i=x0;i<=x1;i++){if(!isLand(gh(Math.floor(i/SG),Math.floor(j/SG))))continue;const cx=(i+.5)*sc,cy=(j+.5)*sc,u=Math.max(0,Math.min(1,((cx-ax)*dx+(cy-ay)*dy)/l2)),d=Math.hypot(cx-ax-dx*u,cy-ay-dy*u),e=w+(PAINT.vnoise(cx*.05,cy*.05,7)-.5)*(14+sf*1.5)+(sf?(PAINT.vnoise(cx*.14,cy*.14,11)-.5)*sf:0),t=Math.max(0,Math.min(1,(e+12+sf-d)/(24+2*sf))),a=t*t*(3-2*t);if(a>F[j*FW+i])F[j*FW+i]=a}};
  for(let k=0;k<BIOMES.N;k++){const x0=BIOMES.list[k].ox,y0=BIOMES.list[k].oy,B=BIOMES.list[k],V=B.village;for(const r of B.routes)for(let i=0;i<r.length-1;i++)mark(PF,x0+r[i][0],y0+r[i][1],x0+r[i+1][0],y0+r[i+1][1],B.pathW);for(const q of V.plaza)mark(PF,x0+q[0],y0+q[1],x0+q[0],y0+q[1],q[2]);for(const r of V.cobs)for(let i=0;i<r.p.length-1;i++)mark(PC,x0+r.p[i][0],y0+r.p[i][1],x0+r.p[i+1][0],y0+r.p[i+1][1],r.w,COB_SOFT)}
  for(let ty=0;ty<NY;ty++)for(let tx=0;tx<NX;tx++){let m=0;for(let j=0;j<SG;j++)for(let i=0;i<SG;i++)m=Math.max(m,PF[(ty*SG+j)*FW+tx*SG+i]);PM[ty*NX+tx]=Math.round(m*255)}
  // pasarelas: el puente sobre el río de la aldea (DK=1) y el paso de cada compuerta (DK=2 compuerta E–O, DK=3 compuerta N–S)
  for(let k=0;k<BIOMES.N;k++){const B=BIOMES.list[k],br=B.village.bridge;if(!br)continue;
   for(let ty=0;ty<NY;ty++){const cy=(ty+.5)*T;for(let tx=0;tx<NX;tx++){const cx=(tx+.5)*T;if(!isLand(gh(tx,ty)))continue;
    if(cx>B.ox+br.x[0]&&cx<B.ox+br.x[1]&&cy>B.oy+br.y[0]&&cy<B.oy+br.y[1]&&ownerOf(tx,ty)===k)DK[ty*NX+tx]=1}}}
  for(const g of BIOMES.gates){const x0=g.vert?g.x-1.5*T:g.x0,x1=g.vert?g.x+1.5*T:g.x1,y0=g.vert?g.y0:g.y-1.5*T,y1=g.vert?g.y1:g.y+1.5*T;
   for(let ty=Math.max(0,Math.floor(y0/T));ty<=Math.min(NY-1,Math.floor(y1/T));ty++)for(let tx=Math.max(0,Math.floor(x0/T));tx<=Math.min(NX-1,Math.floor(x1/T));tx++){const cx=(tx+.5)*T,cy=(ty+.5)*T;
    if(isLand(gh(tx,ty))&&cx>x0&&cx<x1&&cy>y0&&cy<y1&&!DK[ty*NX+tx])DK[ty*NX+tx]=g.vert?2:3}}}
 const rk=(tx,ty)=>ROCK&&tx>=0&&ty>=0&&tx<NX&&ty<NY&&ROCK[ty*NX+tx]===1;   // afloramiento de piedra (lay.hills con rock:1)
 const pc=(tx,ty)=>tx<0||ty<0||tx>=NX||ty>=NY?0:PC[(ty*4)*(NX*4)+tx*4+0]>=0&&cobAny(tx,ty);
 const cobAny=(tx,ty)=>{for(let j=0;j<4;j++)for(let i=0;i<4;i++)if(PC[(ty*4+j)*NX*4+tx*4+i]>=.5)return true;return false};
 const pm=(tx,ty)=>tx<0||ty<0||tx>=NX||ty>=NY?0:PM[ty*NX+tx]>=10,pmf=(tx,ty)=>PM[ty*NX+tx]>=128,dk=(tx,ty)=>tx<0||ty<0||tx>=NX||ty>=NY?0:DK[ty*NX+tx];
 const grid=()=>{if(GRID)return GRID;GRID=new Float32Array(NX*NY);ROCK=new Uint8Array(NX*NY);BO=new Uint8Array(NX*NY);MTN=new Uint8Array(NX*NY);for(let ty=0;ty<NY;ty++)for(let tx=0;tx<NX;tx++){const k=BIOMES.at((tx+.5)*T,(ty+.5)*T),ko=BIOMES.own((tx+.5)*T,(ty+.5)*T);BO[ty*NX+tx]=k<0?255:k;{const h=tileH(tx,ty);GRID[ty*NX+tx]=h;if(h===HCLIFF&&BIOMES.ranges.length&&BIOMES.rangeAt((tx+.5)*T,(ty+.5)*T)[0]>=HCLIFF)MTN[ty*NX+tx]=1;if(h>=HGROUND&&h<HCLIFF&&ko>=0){const r=BIOMES.list[ko];if(r.lay&&r.lay.hills&&BIOMES.geo.rock(r,(tx+.5)*T-r.ox,(ty+.5)*T-r.oy))ROCK[ty*NX+tx]=1}}}buildPaths();return GRID};
 const gh=(tx,ty)=>tx<0||ty<0||tx>=NX||ty>=NY?0:GRID[ty*NX+tx];
 const out=(tx,ty)=>tx<0||ty<0||tx>=NX||ty>=NY||GRID[ty*NX+tx]===0;   // fuera del mundo o vacío
  const reset=()=>{GRID=null;ROCK=null;BO=null;PF=null;PC=null;PM=null;DK=null};
 // R3D-AGUA-IMPL: 1 si el tile es MAR (hay oleaje ambiental); estanques y lagos = 0 (en calma)
 const seaAt=(tx,ty)=>{if(CO&&(tx<0||ty<0||tx>=NX||ty>=NY||!CO.land(tx,ty)))return 1;const k=ownerOf(tx,ty),r=BIOMES.list[k];if(!r||!r.lay||!r.lay.sea)return 0;return (ty+.5)*T-r.oy>BIOMES.geo.seaY(r.lay.sea,(tx+.5)*T-r.ox)?1:0};
 const sandL=(tx,ty)=>{const k=ownerOf(tx,ty),r=BIOMES.list[k];if(!r||!r.lay||(!r.lay.sea&&!r.lay.lakes))return 0;return BIOMES.geo.sand(r,(tx+.5)*T-r.ox,(ty+.5)*T-r.oy)};   // playa de los lagos y del mar propio de un layout (Pradera)
 const sandAt=(tx,ty)=>{const a=sandL(tx,ty);return CO?Math.max(a,CO.sand(tx,ty)):a};   // + playa de la costa del continente (Fase 49b)
 const isW=(tx,ty)=>gh(tx,ty)===HWATER;
 // ondas: la pesca las llama con ripple(x,y); env() recibe cada frame la posición del jugador y la hora para la estela y el cielo
 const RIP=[],ENV={sun:1,t:0,lx:0,ly:0,lt:-9};
 function ripple(x,y){RIP.push({x,y,t:ENV.t});if(RIP.length>8)RIP.shift()}
 function env(px,py,t,sun){ENV.t=t;ENV.sun=sun;if(!GRID)return;const tx=Math.floor(px/T),ty=Math.floor(py/T);let bx=0,by=0,bd=1e9;
  for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)if(isW(tx+i,ty+j)){const cx=(tx+i+.5)*T,cy=(ty+j+.5)*T,d=Math.hypot(cx-px,cy-py);if(d<bd){bd=d;bx=cx;by=cy}}
  if(bd<1e9&&t-ENV.lt>.45&&Math.hypot(px-ENV.lx,py-ENV.ly)>3){ENV.lt=t;ripple(bx,by)}
  ENV.lx=px;ENV.ly=py}
 // estado de la caché (para herramientas de prueba y medir memoria en F8)
  const stats=()=>({});   // ya no hay cache de chunks pintados (Fase 18: terreno 2D retirado)
 const mtnAt=(x,y)=>{const q=BIOMES.rangeAt(x,y);return q[0]>=HCLIFF?q[1]:0},mtnIdx=(x,y)=>{const q=BIOMES.rangeAt(x,y);return q[0]>=HCLIFF?q[2]:-1};   // altura 3D de cumbre en (x,y) px de mundo (0 fuera del núcleo) e índice de cordillera: los lee la malla 3D
 return{setElev:f=>{elevHook=f},baseZ:standZ0,mtnAt,mtnIdx,PAL,PAPER,heightAt,standZ,cliffNear,tileH,sandAt,seaAt,isLand,rk,NX,NY,reset,stats,ripple,env,sandL,coastD:CO?CO.D:null,coastSand:CO?CO.sandAt:null,fields:()=>{grid();return{PF,PC,PM,DK,MTN,SG:4}},biomeOf,ownerOf}   // fields/biomeOf: R3D (terrain3d.js) lee caminos y adoquines de aquí
})();
if(typeof module!=='undefined')module.exports=TER;
