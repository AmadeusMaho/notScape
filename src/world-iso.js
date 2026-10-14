// NotScape · terreno isométrico con 3 alturas (agua .75, suelo 1, acantilado 2). F1-B: rombos planos; F2-B: pintado como diorama (pincel + tinta, chunks en caché).
// Requiere iso.js y paint.js cargados antes. La colisión NO sale de aquí: sigue siendo blk()/BLK/cliff() en px de mundo.
// Usa globales de game.js solo en tiempo de ejecución (BI, WW, WH, BLK, S), nunca al cargar.
const TER=(()=>{
 const T=ISO.TILE,HW=ISO.HW,HH=ISO.HH,LV=ISO.LV,HWATER=.75,HGROUND=1,HCLIFF=2,
  NX=Math.ceil(BIOMES.WW/T),NY=Math.ceil(BIOMES.WH/T);   // = WW/T, WH/T (de biomes.js; WW/WH = caja que envuelve a los rectángulos de los biomas)
 // paleta por bioma de la guía §3 (suelo base, luz, sombra, agua); Cumbres = «Nieve». Datos, no código por bioma.
 const PAL=BIOMES.list.map(b=>b.pal);
 const STONE='#9a958d',STONEL='#d0cbc0',EARTH='#a3643d',EARTHL='#c98a5a',INK='#5b3a29',PAPER='#fdf9e3';
 const inR=(r,x,y)=>x>r[0]&&x<r[1]&&y>r[2]&&y<r[3];
 const BOF=()=>BO; let BO=null;                            // bioma de cada tile (por su centro; 255 = vacío), se rellena en grid()
 const biomeOf=(tx,ty)=>BO?(BO[ty*NX+tx]===255?0:BO[ty*NX+tx]):Math.max(0,BIOMES.at((tx+.5)*T,(ty+.5)*T));
 // ¿el tile (centro x,y) del anillo de borde del bioma k cae en el hueco de una compuerta? (entonces no es acantilado)
 const gateOpen=(x,y)=>{for(const g of BIOMES.gates){if(g.vert?(Math.abs(x-g.x)<T&&y>g.y0&&y<g.y1):(Math.abs(y-g.y)<T&&x>g.x0&&x<g.x1))return g}return null};
 // altura del tile por su centro. Cliff: franja de la frontera de cada bioma (salvo el hueco) y el borde del mundo.
 function tileH(tx,ty){
  if(tx<0||ty<0||tx>=NX||ty>=NY)return 0;
  const x=(tx+.5)*T,y=(ty+.5)*T,k=BIOMES.at(x,y);
  if(k<0)return 0;                                          // vacío (fuera de todo rectángulo)
  const r=BIOMES.list[k],lx=x-r.ox,ly=y-r.oy;
  if((lx<T||ly<T||lx>=r.w-T||ly>=r.h-T)&&!gateOpen(x,y))return HCLIFF;   // anillo de 1 tile en el borde de cada rectángulo, salvo en las compuertas
  const cl=r.lay&&r.lay.cliff;if(cl)for(const c of cl)if(lx>c[0]&&lx<c[1]&&ly>c[2]&&ly<c[3])return HCLIFF;   // macizos/crestas del layout (lay.cliff, rectángulos locales): paredes de roca pintadas como el borde
  if(BIOMES.geo.water(r,lx,ly))return HWATER;              // agua orgánica (lagos/río/mar) o rectangular del layout antiguo: sale de BIOMES.geo (biomes.js)
  return BIOMES.geo.ground(r,lx,ly)}                        // 1 = llano; 1.3, 1.6… = montículos escalonados (lay.hills)
 const th=(tx,ty)=>GRID?(tx<0||ty<0||tx>=NX||ty>=NY?0:GRID[ty*NX+tx]):tileH(tx,ty);   // altura del tile: de la rejilla ya construida (rápido) o calculada
 const heightAt=(x,y)=>th(Math.floor(x/T),Math.floor(y/T));
 const isLand=h=>h>=HGROUND&&h<HCLIFF;   // suelo pisable: llano o montículo (1 ≤ h < 2)
 // Altura a la que se DIBUJA a quien está de pie en (x,y) (jugador, recursos, cámara). Igual que heightAt salvo en un punto pisable que visualmente cae en un
 // tile de acantilado (la banda de colisión de cliff() mide 26–28 px y el tile 32: 15 px del tile quedan pisables). Ahí se dibuja a nivel de suelo: sin «salto» de altura.
 // Los clics y el cursor siguen usando heightAt (lo que se ve). La colisión no cambia.
 // ¿hay un tile de acantilado a menos de m px de (x,y)? Es la colisión de pared: sale del MISMO tileH que se dibuja, así que lo que se ve como pared bloquea
 // (y m deja un margen antes de ella). F1-C4b: sustituye a la banda de 26–28 px de cliff() que no coincidía con los tiles.
 const cliffNear=(x,y,m)=>{const tx0=Math.floor((x-m)/T),tx1=Math.floor((x+m)/T),ty0=Math.floor((y-m)/T),ty1=Math.floor((y+m)/T);for(let tx=tx0;tx<=tx1;tx++)for(let ty=ty0;ty<=ty1;ty++)if(th(tx,ty)===HCLIFF)return true;return false};
 const standZ=(x,y)=>{const h=heightAt(x,y);if(h===HCLIFF)return typeof blk==='function'&&!blk(x,y)?HGROUND:h;if(!GRID||h<HGROUND)return h;
  // suelo: interpolación bilineal entre los centros de los 4 tiles vecinos pisables → quien camina sube los montículos en rampa, sin saltos (los tiles se PINTAN escalonados)
  const u=x/T-.5,v=y/T-.5,i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j,g=(p,q)=>{const e=th(p,q);return isLand(e)?e:h};
  return(g(i,j)*(1-a)+g(i+1,j)*a)*(1-b)+(g(i,j+1)*(1-a)+g(i+1,j+1)*a)*b};
 // ───────── F2-B · terreno pintado (diorama) ─────────
 // La colisión y las alturas NO salen de aquí (tileH/heightAt/cliffNear no cambian). Esto solo PINTA lo que ya decide tileH:
 // cada tile se pinta una vez (pincel + tinta) en chunks de CFG.cs px lógicos, prerenderizados a ISO.scale() y guardados en una caché LRU.
 // Determinista: todo el azar sale de hash(tx,ty,bioma,capa). Un chunk no depende de los vecinos, así que se ve igual con cualquier tamaño de chunk.
 const CFG={cs:256,lru:12,ring:2,budget:3,budgetHi:5,vis:10,mem:(()=>{const dm=(typeof navigator!=='undefined'&&navigator.deviceMemory)||4;return Math.max(150e6,Math.min(400e6,dm*48e6))})(),grassBig:7,grassFine:34};                                   // px lógicos por chunk, mínimo de chunks en caché (la caché real = vista + anillo de precarga), anillo de precarga (chunks) y ms de precarga por frame y nº de trazos grandes/finos por tile de pasto
 // Datos por bioma del terreno pintado. CUT = colores del corte de tierra y la piedra; DEC = motas, agua (lt/dk/orilla) y vetas. Un bioma nuevo = una fila nueva en PAL, DEC y NOTA.
 const CUT={soil:'#a3643d',soilL:'#c98a5a',soilD:'#6f4128',clay:'#e8a06a',rock:STONE,rockL:STONEL,wl:'#d9fbff',wd:'#3aa6c8',wsh:'#c4f6f2',fx:'rgba(255,255,255,.7)',vein:null,cb:['#b8ad9a','#d6ccb8','#8f8472'],pa:['#c9a46a','#e0c18c','#a07a48']};
 const DEC=BIOMES.list.map(b=>b.dec);
 const M=PAINT.mix,TH=[];
 const theme=k=>TH[k]||(TH[k]=Object.assign({},PAL[k],CUT,DEC[k],{g2:M(PAL[k].g,PAL[k].s,.25),l2:M(PAL[k].l,PAL[k].g,.3),d2:M(PAL[k].s,INK,.15)}));
 const GLOK=()=>typeof WGL!=='undefined'&&WGL.ok;
 let GRID=null,ROCK=null,PF=null,PC=null,PM=null,DK=null,CACHE=new Map(),CSCALE=0,BUILT=0;const CPOOL=[];const LC={x:0,y:0,f:0},SYNC={n:0,ms:0}; // LC: cámara del frame anterior; SYNC: chunks visibles construidos en el propio frame (causan tirones; ver tools/walk_check.py)
 // ───────── F2-C2 · caminos y pasarelas ─────────
 // Los datos (rutas de tierra `routes`, plaza, calles adoquinadas `cobs`, puente `bridge`) viven en biomes.js (F3-B): BIOMES.list[k].routes / .village.
 // rellena PM (0–255: cuánto camino hay en el tile; ≥128 = camino) y DK (1 = pasarela sobre el río, 2 = pasarela de frontera)
 function buildPaths(){PM=new Uint8Array(NX*NY);DK=new Uint8Array(NX*NY);
  const SG=4,FW=NX*SG,sc=T/SG;PF=new Float32Array(FW*NY*SG);PC=new Float32Array(FW*NY*SG);
  const mark=(F,ax,ay,bx,by,w)=>{const x0=Math.max(0,Math.floor((Math.min(ax,bx)-w-24)/sc)),x1=Math.min(FW-1,Math.floor((Math.max(ax,bx)+w+24)/sc)),y0=Math.max(0,Math.floor((Math.min(ay,by)-w-24)/sc)),y1=Math.min(NY*SG-1,Math.floor((Math.max(ay,by)+w+24)/sc)),dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy||1;
   for(let j=y0;j<=y1;j++)for(let i=x0;i<=x1;i++){if(!isLand(gh(Math.floor(i/SG),Math.floor(j/SG))))continue;const cx=(i+.5)*sc,cy=(j+.5)*sc,u=Math.max(0,Math.min(1,((cx-ax)*dx+(cy-ay)*dy)/l2)),d=Math.hypot(cx-ax-dx*u,cy-ay-dy*u),e=w+(PAINT.vnoise(cx*.05,cy*.05,7)-.5)*14,t=Math.max(0,Math.min(1,(e+12-d)/24)),a=t*t*(3-2*t);if(a>F[j*FW+i])F[j*FW+i]=a}};
  for(let k=0;k<BIOMES.N;k++){const x0=BIOMES.list[k].ox,y0=BIOMES.list[k].oy,B=BIOMES.list[k],V=B.village;for(const r of B.routes)for(let i=0;i<r.length-1;i++)mark(PF,x0+r[i][0],y0+r[i][1],x0+r[i+1][0],y0+r[i+1][1],B.pathW);for(const q of V.plaza)mark(PF,x0+q[0],y0+q[1],x0+q[0],y0+q[1],q[2]);for(const r of V.cobs)for(let i=0;i<r.p.length-1;i++)mark(PC,x0+r.p[i][0],y0+r.p[i][1],x0+r.p[i+1][0],y0+r.p[i+1][1],r.w)}
  for(let ty=0;ty<NY;ty++)for(let tx=0;tx<NX;tx++){let m=0;for(let j=0;j<SG;j++)for(let i=0;i<SG;i++)m=Math.max(m,PF[(ty*SG+j)*FW+tx*SG+i]);PM[ty*NX+tx]=Math.round(m*255)}
  // pasarelas: el puente sobre el río de la aldea (DK=1) y el paso de cada compuerta (DK=2 compuerta E–O, DK=3 compuerta N–S)
  for(let k=0;k<BIOMES.N;k++){const B=BIOMES.list[k],br=B.village.bridge;if(!br)continue;
   for(let ty=0;ty<NY;ty++){const cy=(ty+.5)*T;for(let tx=0;tx<NX;tx++){const cx=(tx+.5)*T;if(!isLand(gh(tx,ty)))continue;
    if(cx>B.ox+br.x[0]&&cx<B.ox+br.x[1]&&cy>B.oy+br.y[0]&&cy<B.oy+br.y[1]&&biomeOf(tx,ty)===k)DK[ty*NX+tx]=1}}}
  for(const g of BIOMES.gates){const x0=g.vert?g.x-1.5*T:g.x0,x1=g.vert?g.x+1.5*T:g.x1,y0=g.vert?g.y0:g.y-1.5*T,y1=g.vert?g.y1:g.y+1.5*T;
   for(let ty=Math.max(0,Math.floor(y0/T));ty<=Math.min(NY-1,Math.floor(y1/T));ty++)for(let tx=Math.max(0,Math.floor(x0/T));tx<=Math.min(NX-1,Math.floor(x1/T));tx++){const cx=(tx+.5)*T,cy=(ty+.5)*T;
    if(isLand(gh(tx,ty))&&cx>x0&&cx<x1&&cy>y0&&cy<y1&&!DK[ty*NX+tx])DK[ty*NX+tx]=g.vert?2:3}}}
 const rk=(tx,ty)=>ROCK&&tx>=0&&ty>=0&&tx<NX&&ty<NY&&ROCK[ty*NX+tx]===1;   // afloramiento de piedra (lay.hills con rock:1)
 const pc=(tx,ty)=>tx<0||ty<0||tx>=NX||ty>=NY?0:PC[(ty*4)*(NX*4)+tx*4+0]>=0&&cobAny(tx,ty);
 const cobAny=(tx,ty)=>{for(let j=0;j<4;j++)for(let i=0;i<4;i++)if(PC[(ty*4+j)*NX*4+tx*4+i]>=.5)return true;return false};
 const pm=(tx,ty)=>tx<0||ty<0||tx>=NX||ty>=NY?0:PM[ty*NX+tx]>=10,pmf=(tx,ty)=>PM[ty*NX+tx]>=128,dk=(tx,ty)=>tx<0||ty<0||tx>=NX||ty>=NY?0:DK[ty*NX+tx];
 const grid=()=>{if(GRID)return GRID;GRID=new Float32Array(NX*NY);ROCK=new Uint8Array(NX*NY);BO=new Uint8Array(NX*NY);for(let ty=0;ty<NY;ty++)for(let tx=0;tx<NX;tx++){const k=BIOMES.at((tx+.5)*T,(ty+.5)*T);BO[ty*NX+tx]=k<0?255:k;{const h=tileH(tx,ty);GRID[ty*NX+tx]=h;if(h>=HGROUND&&h<HCLIFF&&k>=0){const r=BIOMES.list[k];if(r.lay&&r.lay.hills&&BIOMES.geo.rock(r,(tx+.5)*T-r.ox,(ty+.5)*T-r.oy))ROCK[ty*NX+tx]=1}}}buildPaths();return GRID};
 const gh=(tx,ty)=>tx<0||ty<0||tx>=NX||ty>=NY?0:GRID[ty*NX+tx];
 const out=(tx,ty)=>tx<0||ty<0||tx>=NX||ty>=NY||GRID[ty*NX+tx]===0;   // fuera del mundo o vacío
 const reset=()=>{TB.clear();SB.clear();GRID=null;ROCK=null;BO=null;PF=null;PC=null;PM=null;DK=null;CACHE=new Map();CPOOL.length=0;CSCALE=0;LC.f=0};
 const PP=(x,y,z)=>{const p=ISO.proj(x,y,z);return[p.x,p.y]};
 // tramos de una cara lateral: [z arriba, z abajo, material]. Hacia el exterior del mundo la pared sigue como corte de bloque (tierra → arcilla → roca).
 const CUTZ=[[HGROUND,.76,'soil'],[.76,-.4,'clay'],[-.4,-1.2,'deep']];
 function segs(h,hn,isOut,wood,rock){const s=[];const cl=h===HCLIFF||!!rock;
  if(!isOut){s.push([h,hn,cl?'stone':wood?'wood':'soil']);return s}
  let top=h;if(cl){s.push([h,HGROUND,'stone']);top=HGROUND}
  for(const q of CUTZ)if(q[1]<top)s.push([Math.min(top,q[0]),q[1],q[2]]);
  return s}
 function recipe(kind,Th,sh){const b0={stone:Th.rock,soil:Th.soil,clay:Th.clay,deep:M(Th.rock,INK,.3),wood:'#9a6a3a'}[kind],b=M(b0,'#6a3a3a',sh);
  if(kind==='wood')return{b,l:'#c08a52',d:'#5e3c20',n:22/148,ang:0,len:7,w:2};
  if(kind==='soil')return{b,l:Th.soilL,d:Th.soilD,n:14/148,ang:0,len:6,w:2};
  if(kind==='clay')return{b,l:M(b,'#ffffff',.35),d:M(b,INK,.3),n:30/616,ang:Math.PI/2,len:9,w:2.4};
  return{b,l:M(b,'#ffffff',.3),d:M(b,INK,.4),n:70/1232,ang:Math.PI/2,len:14,w:3}}
 // cara lateral de un tile. side 'x': hacia +x (derecha, más oscura); 'y': hacia +y (izquierda, media).
 function face(c,tx,ty,side,h,hn,isOut,Th,k,rock){
  const X=tx*T,Y=ty*T,sx=side==='x',ax=sx?X+T:X,ay=sx?Y:Y+T,bx=X+T,by=Y+T,sh=sx?.28:0,ss=segs(h,hn,isOut,dk(tx,ty)===1,rock),L=sx?10:20;
  ss.forEach((q,i)=>{const quad=[PP(ax,ay,q[0]),PP(bx,by,q[0]),PP(bx,by,q[1]),PP(ax,ay,q[1])],rc=recipe(q[2],Th,sh),area=ISO.HW*(q[0]-q[1])*ISO.LV;
   const Rq=PAINT.rng(PAINT.seedOf(tx,ty,k,L+i));PAINT.paint(c,quad,rc.b,rc.l,rc.d,Math.max(4,Math.round(area*rc.n)),rc.ang,rc.len,rc.w,Rq,{fillPts:PAINT.grow(quad,.5)});
   if(Th.vein&&(q[2]==='stone'||q[2]==='deep')&&Rq()<.7){const p0=quad[0],p1=quad[1],hq=(q[0]-q[1])*ISO.LV,u=.15+Rq()*.7,x0=p0[0]+(p1[0]-p0[0])*u,y0=p0[1]+(p1[1]-p0[1])*u;c.save();PAINT.path(c,quad);c.clip();c.strokeStyle=Th.vein;c.lineWidth=1.6;c.lineCap='round';c.lineJoin='round';c.globalAlpha=.85;c.beginPath();c.moveTo(x0,y0);let yy=y0,xx=x0;for(let j=0;j<3;j++){xx+=(Rq()-.5)*7;yy+=hq*.3;c.lineTo(xx,yy)}c.stroke();c.restore()}});
  const zb=ss[ss.length-1][1],R=PAINT.rng(PAINT.seedOf(tx,ty,k,L+8));
  // misma caída a lo largo de la pared: las juntas verticales solo se pintan en los extremos de cada tramo
  const same=(ox,oy)=>sx?(gh(ox,oy)===h&&gh(ox+1,oy)===hn):(gh(ox,oy)===h&&gh(ox,oy+1)===hn);
  PAINT.ink(c,PP(ax,ay,zb),PP(bx,by,zb),R);
  if(sx){if(!same(tx,ty-1))PAINT.ink(c,PP(ax,ay,h),PP(ax,ay,zb),R);if(!same(tx,ty+1)||gh(tx,ty+1)<h)PAINT.ink(c,PP(bx,by,h),PP(bx,by,zb),R)}
  else{if(!same(tx-1,ty))PAINT.ink(c,PP(ax,ay,h),PP(ax,ay,zb),R);if(gh(tx+1,ty)>=h&&!same(tx+1,ty))PAINT.ink(c,PP(bx,by,h),PP(bx,by,zb),R)}}
 // sombra de apoyo del bloque: forma blanda bajo el corte exterior, desplazada abajo a la derecha (dos capas, sin elipse perfecta)
 function shadow(c,tx,ty,side){const X=tx*T,Y=ty*T,sx=side==='x',ax=sx?X+T:X,ay=sx?Y:Y+T,bx=X+T,by=Y+T,zb=-1.2,R=PAINT.rng(PAINT.seedOf(tx,ty,9,side==='x'?1:2));
  [[9,13,.07],[17,24,.06]].forEach(([dx,dy,al])=>{const j=(R()-.5)*3,a=PP(ax,ay,zb),b=PP(bx,by,zb);c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.lineTo(b[0]+dx+j,b[1]+dy);c.lineTo(a[0]+dx-j,a[1]+dy);c.closePath();c.fillStyle='rgba(90,60,40,'+al+')';c.fill()})}
 // camino de tierra: mancha de ocho puntos dentro del tile; hacia un vecino que también es camino llega hasta el borde (sin rendijas), hacia el resto se retrae con jitter
 function dirt(c,tx,ty,k,Th,top,h){const X=tx*T,Y=ty*T,R=PAINT.rng(PAINT.seedOf(tx,ty,k,31)),pa=Th.pa,SG=4,FW=NX*SG,sc=T/SG,F=(i,j)=>PF[(ty*SG+j)*FW+tx*SG+i],G=PAINT.grow(top,.6);
  // esquina global (ix,iy) con jitter determinista: los tiles vecinos comparten esquinas, así el borde del camino es continuo
  const cn=(i,j)=>{const ix=tx*SG+i,iy=ty*SG+j,jx=(PAINT.hash(ix,iy,k,51)-.5)*5,jy=(PAINT.hash(ix,iy,k,52)-.5)*5;return PP(ix*sc+jx,iy*sc+jy,h)};
  const C=[];for(let j=0;j<=SG;j++){C[j]=[];for(let i=0;i<=SG;i++)C[j][i]=cn(i,j)}
  let inside=0;c.save();PAINT.path(c,G);c.clip();
  c.beginPath();for(let j=0;j<SG;j++)for(let i=0;i<SG;i++)if(F(i,j)>=.5){inside++;const q=[C[j][i],C[j][i+1],C[j+1][i+1],C[j+1][i]],cx=(q[0][0]+q[2][0])/2,cy=(q[0][1]+q[2][1])/2;q.forEach((p,n)=>{const dx=p[0]-cx,dy=p[1]-cy,l=Math.hypot(dx,dy)||1,x=p[0]+dx/l*.7,y=p[1]+dy/l*.7;n?c.lineTo(x,y):c.moveTo(x,y)});c.closePath()}
  if(inside){c.fillStyle=pa[0];c.fill();c.save();c.clip();
   const bx0=Math.min(top[0][0],top[3][0]),bx1=Math.max(top[1][0],top[2][0]),by0=top[0][1],by1=top[2][1],n=inside>=SG*SG?9:6;
   for(let i=0;i<n;i++){const x=bx0+R()*(bx1-bx0),y=by0+R()*(by1-by0),a=-.5+(R()-.5)*.9,l=6+R()*10;c.strokeStyle=R()<.5?pa[1]:pa[2];c.globalAlpha=.25+R()*.35;c.lineWidth=2+R()*2.4;c.lineCap='butt';c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);c.stroke()}
   c.restore()}
  // fundido con trazos duros: pinceladas cortas de tierra sobre el pasto, más escasas cuanto menor es la cobertura
  c.globalAlpha=1;c.lineCap='round';
  for(let j=0;j<SG;j++)for(let i=0;i<SG;i++){const a=F(i,j);if(a<.1||a>=.5)continue;const m=Math.round(a*7*R()+.4);for(let q=0;q<m;q++){const p=PP(X+(i+R())*sc,Y+(j+R())*sc,h),an=-.5+(R()-.5)*1.2,l=3+R()*4;c.strokeStyle=R()<.65?pa[0]:pa[2];c.globalAlpha=.55+R()*.3;c.lineWidth=1.6+R()*1.6;c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(p[0]+Math.cos(an)*l,p[1]+Math.sin(an)*l);c.stroke()}}
  // detalles: piedrecitas sobre la tierra y un mechón de pasto en el borde
  c.globalAlpha=1;
  for(let j=0;j<SG;j++)for(let i=0;i<SG;i++){const a=F(i,j);if(a>=.7&&R()<.07){const p=PP(X+(i+.2+R()*.6)*sc,Y+(j+.2+R()*.6)*sc,h);c.fillStyle=R()<.5?'#bdb3a2':'#8e8474';c.fillRect(p[0]-1,p[1]-.7,2.6,1.8)}
   else if(a>=.3&&a<.7&&R()<.12){const p=PP(X+(i+.2+R()*.6)*sc,Y+(j+.2+R()*.6)*sc,h);c.strokeStyle=Th.d2;c.lineWidth=1.2;c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(p[0]-1,p[1]-4);c.moveTo(p[0]+1,p[1]);c.lineTo(p[0]+2,p[1]-3.5);c.stroke()}}
  c.restore()}
 // adoquines: argamasa oscura bajo la unión de subceldas con cobertura ≥0,5 y una piedra por subcelda (cuadrilátero encogido, tono variable). Borde irregular compartido entre tiles.
 function cobble(c,tx,ty,k,Th,top,h){const SG=4,FW=NX*SG,sc=T/SG,F=(i,j)=>PC[(ty*SG+j)*FW+tx*SG+i],cb=Th.cb,mort=M(cb[2],INK,.35),G=PAINT.grow(top,.6);
  const cn=(i,j)=>{const ix=tx*SG+i,iy=ty*SG+j;return PP(ix*sc+(PAINT.hash(ix,iy,k,61)-.5)*4,iy*sc+(PAINT.hash(ix,iy,k,62)-.5)*4,h)};
  const C=[];for(let j=0;j<=SG;j++){C[j]=[];for(let i=0;i<=SG;i++)C[j][i]=cn(i,j)}
  c.save();PAINT.path(c,G);c.clip();c.beginPath();
  for(let j=0;j<SG;j++)for(let i=0;i<SG;i++)if(F(i,j)>=.5){const q=[C[j][i],C[j][i+1],C[j+1][i+1],C[j+1][i]],cx=(q[0][0]+q[2][0])/2,cy=(q[0][1]+q[2][1])/2;q.forEach((p,n)=>{const dx=p[0]-cx,dy=p[1]-cy,l=Math.hypot(dx,dy)||1,x=p[0]+dx/l*.8,y=p[1]+dy/l*.8;n?c.lineTo(x,y):c.moveTo(x,y)});c.closePath()}
  c.fillStyle=mort;c.fill();
  for(let j=0;j<SG;j++)for(let i=0;i<SG;i++){if(F(i,j)<.5)continue;const r=PAINT.hash(tx*SG+i,ty*SG+j,k,63),q=[C[j][i],C[j][i+1],C[j+1][i+1],C[j+1][i]],cx=(q[0][0]+q[2][0])/2,cy=(q[0][1]+q[2][1])/2,sh=.2+.12*PAINT.hash(tx*SG+i,ty*SG+j,k,64),p=q.map(v=>[v[0]+(cx-v[0])*sh,v[1]+(cy-v[1])*sh]);
   const col=r<.3?M(cb[0],cb[1],.5+r):r>.7?M(cb[0],cb[2],(r-.7)*2):cb[0];c.beginPath();p.forEach((v,n)=>n?c.lineTo(v[0],v[1]):c.moveTo(v[0],v[1]));c.closePath();c.fillStyle=col;c.fill();
   c.strokeStyle=cb[1];c.globalAlpha=.55;c.lineWidth=1;c.beginPath();c.moveTo(p[0][0],p[0][1]);c.lineTo(p[1][0],p[1][1]);c.stroke();c.strokeStyle=cb[2];c.beginPath();c.moveTo(p[2][0],p[2][1]);c.lineTo(p[3][0],p[3][1]);c.stroke();c.globalAlpha=1}
  c.restore()}
 // pasarela de madera: tablones (cruzan el sentido de la marcha) y barandilla con postes en los bordes laterales. kind 1 = puente N–S, 2 = frontera E–O.
 function deck(c,tx,ty,k,h,kind){const X=tx*T,Y=ty*T,R=PAINT.rng(PAINT.seedOf(tx,ty,k,41)),top=[PP(X,Y,h),PP(X+T,Y,h),PP(X+T,Y+T,h),PP(X,Y+T,h)],ns=kind===1||kind===3;
  PAINT.paint(c,top,'#b88650','#d6aa72','#8a5a30',8,ns?.46:2.68,10,2.4,R,{fillPts:PAINT.grow(top,.6)});
  for(let i=1;i<4;i++){const a=ns?PP(X,Y+i*T/4,h):PP(X+i*T/4,Y,h),b=ns?PP(X+T,Y+i*T/4,h):PP(X+i*T/4,Y+T,h);PAINT.ink(c,a,b,R,1,.45)}
  // bordes laterales sin pasarela vecina: poste en cada extremo y barandilla
  const sides=ns?[[dk(tx-1,ty)!==kind,X,Y,X,Y+T],[dk(tx+1,ty)!==kind,X+T,Y,X+T,Y+T]]:[[dk(tx,ty-1)!==kind,X,Y,X+T,Y],[dk(tx,ty+1)!==kind,X,Y+T,X+T,Y+T]];
  for(const[on,ax,ay,bx,by]of sides){if(!on)continue;const a0=PP(ax,ay,h),b0=PP(bx,by,h),a1=PP(ax,ay,h+.34),b1=PP(bx,by,h+.34);c.save();c.lineCap='round';
   c.strokeStyle=INK;c.lineWidth=3.2;c.beginPath();c.moveTo(a0[0],a0[1]);c.lineTo(a1[0],a1[1]);c.moveTo(b0[0],b0[1]);c.lineTo(b1[0],b1[1]);c.moveTo(a1[0],a1[1]);c.lineTo(b1[0],b1[1]);c.stroke();
   c.strokeStyle='#c08a52';c.lineWidth=1.8;c.stroke();c.restore()}}

 // F3-E · transición entre biomas: los tiles de suelo cerca de una frontera mezclan la paleta con la del bioma vecino (hasta 50 % pegado al muro) y toman sus motas con esa probabilidad.
 // Determinista por (tx,ty); la mezcla se cuantiza en 8 pasos y se cachea por (k,vecino,paso).
 const TRD=9,TB=new Map();
 function blendTh(tx,ty,k,Th){let nk=-1,d=1e9;     // distancia (en tiles) a la compuerta más cercana del bioma → mezcla con el bioma del otro lado
  const cx=(tx+.5)*T,cy=(ty+.5)*T;for(const g of BIOMES.gates){if(g.a!==k&&g.b!==k)continue;const dx=g.vert?Math.abs(cx-g.x):Math.max(0,g.x0-cx,cx-g.x1),dy=g.vert?Math.max(0,g.y0-cy,cy-g.y1):Math.abs(cy-g.y),dd=Math.hypot(dx,dy)/T;if(dd<d){d=dd;nk=g.a===k?g.b:g.a}}
  if(nk<0||d>=TRD)return Th;const w=Math.round((1-d/TRD)*(1-d/TRD)*.5*8)/8;if(w<=0)return Th;const key=k+'|'+nk+'|'+w;let o=TB.get(key);
  if(!o){const N=theme(nk);o=Object.assign({},Th);['g','g2','l','s','l2','d2'].forEach(q=>o[q]=M(Th[q],N[q],w));o.dots2=N.dots;TB.set(key,o)}
  return PAINT.hash(tx,ty,k,77)<w*1.4?Object.assign({},o,{dots:o.dots2||o.dots}):o}
 // playa: la fuerza de arena (0..1) sale de BIOMES.geo.sand (costa del mar, orillas de lagos con `sand`); mezcla la paleta con la de arena en 6 pasos (cacheada)
 const SAND={g:'#e6d29a',g2:'#dcc78a',l:'#f4e6b4',s:'#c2a86c',l2:'#f1e2a8',d2:'#b09458',dots:['#c9b27a','#f5e9c2','#a98f5a','#e9dcae']},SB=new Map();
 const sandAt=(tx,ty)=>{const k=biomeOf(tx,ty),r=BIOMES.list[k];if(!r||!r.lay||(!r.lay.sea&&!r.lay.lakes))return 0;return BIOMES.geo.sand(r,(tx+.5)*T-r.ox,(ty+.5)*T-r.oy)};
 function sandTh(tx,ty,k,Tg){const w=Math.round(sandAt(tx,ty)*6)/6;if(w<=0)return Tg;const key=k+'|'+w+'|'+(Tg.g);let o=SB.get(key);
  if(!o){o=Object.assign({},Tg);['g','g2','l','s','l2','d2'].forEach(q=>o[q]=M(Tg[q],SAND[q],w*.92));if(w>=.5)o.dots=SAND.dots;SB.set(key,o)}return o}
 function tile(c,tx,ty){
  const h=gh(tx,ty),k=biomeOf(tx,ty),Th=theme(k),X=tx*T,Y=ty*T,hr=gh(tx+1,ty),hl=gh(tx,ty+1),hb=gh(tx,ty-1),hw=gh(tx-1,ty),cl=h===HCLIFF,wat=h===HWATER;
  const Rn=n=>PAINT.rng(PAINT.seedOf(tx,ty,k,n)),r0=PAINT.hash(tx,ty,k,0);
  const rkk=rk(tx,ty);
  if(hr<h)face(c,tx,ty,'x',h,hr,out(tx+1,ty),Th,k,rkk);
  if(hl<h)face(c,tx,ty,'y',h,hl,out(tx,ty+1),Th,k,rkk);
  const top=[PP(X,Y,h),PP(X+T,Y,h),PP(X+T,Y+T,h),PP(X,Y+T,h)],G=PAINT.grow(top,.6);
  if(cl||rkk){PAINT.paint(c,top,M(Th.rock,Th.rockL,r0*.5),Th.rockL,M(Th.rock,INK,.4),14,-.6,13,5,Rn(1),{fillPts:G});PAINT.paint(c,top,'#000000',M(Th.rockL,'#ffffff',.3),M(Th.rock,INK,.5),16,Math.PI/2,5,1.6,Rn(2),{nofill:1})}
  else if(wat){if(GLOK()){/* hueco transparente: el agua la pinta WGL debajo del canvas 2D */}else{const sh=(hb>h)+(hw>h)+(hr>h)+(hl>h),base=M(Th.w,Th.wsh,Math.min(.6,.1+.12*sh)),R=Rn(1);
   PAINT.paint(c,top,base,Th.wl,Th.wd,10,.1,12,2.4,R,{fillPts:G});
   if(R()<.45){const p=PP(X+(.25+R()*.5)*T,Y+(.25+R()*.5)*T,h),w=8+R()*8,q=2.5+R()*2;c.fillStyle='rgba(40,150,190,.28)';c.beginPath();c.moveTo(p[0]-w,p[1]);c.lineTo(p[0]-w*.3,p[1]-q);c.lineTo(p[0]+w,p[1]-q*.3);c.lineTo(p[0]+w*.4,p[1]+q);c.closePath();c.fill()}
  }}
  else{const Tg=sandTh(tx,ty,k,blendTh(tx,ty,k,Th)),nv=PAINT.vnoise(tx*.22,ty*.22,k),b0=r0<.5?Tg.g:Tg.g2,base=nv<.5?M(b0,Tg.l,(.5-nv)*.7):M(b0,Tg.s,(nv-.5)*.7);
   PAINT.paint(c,top,base,Tg.l,Tg.s,CFG.grassBig,-.6,16,7,Rn(1),{fillPts:G});
   PAINT.paint(c,top,'#000000',Tg.l2,Tg.d2,CFG.grassFine,-Math.PI/2,5,1.3,Rn(2),{nofill:1});
   if(pm(tx,ty))dirt(c,tx,ty,k,Th,top,h);
   if(cobAny(tx,ty))cobble(c,tx,ty,k,Th,top,h);
   // sombra de la pared que cae sobre el suelo (luz arriba a la izquierda: cae a la derecha y abajo de una pared al oeste/norte)
   const shd=(a,b,ia,ib)=>{const g=c.createLinearGradient(a[0],a[1],ia[0],ia[1]);g.addColorStop(0,'rgba(90,60,40,.24)');g.addColorStop(1,'rgba(90,60,40,0)');c.save();PAINT.path(c,top);c.clip();c.fillStyle=g;c.fillRect(Math.min(a[0],b[0],ia[0],ib[0])-2,Math.min(a[1],b[1],ia[1],ib[1])-2,70,40);c.restore()};
   if(hw===HCLIFF)shd(top[0],top[3],PP(X+.45*T,Y,h),PP(X+.45*T,Y+T,h));
   if(hb===HCLIFF)shd(top[0],top[1],PP(X,Y+.45*T,h),PP(X+T,Y+.45*T,h));
   const R=Rn(3),dots=Tg.dots,nd=pmf(tx,ty)?0:Math.floor(R()*2.6);
   for(let i=0;i<nd;i++){const p=PP(X+(.12+R()*.76)*T,Y+(.12+R()*.76)*T,h);c.fillStyle=dots[Math.floor(R()*dots.length)];c.fillRect(p[0]-1,p[1]-1,2.2,2.2)}}
  if(!cl&&!wat&&dk(tx,ty))deck(c,tx,ty,k,h,dk(tx,ty));
  // contorno de la silueta: solo en las aristas donde el vecino es más bajo (nunca entre tiles de la misma altura)
  const R=Rn(4);
  if(hl<h)PAINT.ink(c,top[3],top[2],R);if(hr<h)PAINT.ink(c,top[2],top[1],R);if(hw<h)PAINT.ink(c,top[0],top[3],R);if(hb<h)PAINT.ink(c,top[0],top[1],R)}
 // construye el chunk (ci,cj) a escala s. Cada chunk mide un número ENTERO de px reales (o1-o0), así los vecinos encajan sin rendijas ni solapes.
 function prep(ci,cj,s){
  const cs=CFG.cs,ox0=Math.round(ci*cs*s),ox1=Math.round((ci+1)*cs*s),oy0=Math.round(cj*cs*s),oy1=Math.round((cj+1)*cs*s),lx0=ox0/s,lx1=ox1/s,ly0=oy0/s,ly1=oy1/s;
  let wx0=1e9,wx1=-1e9,wy0=1e9,wy1=-1e9;for(const z of[-1.2,0,2])for(const[a,b]of[[lx0,ly0],[lx1,ly0],[lx0,ly1],[lx1,ly1]]){const w=ISO.unproj(a,b,z);wx0=Math.min(wx0,w.x);wx1=Math.max(wx1,w.x);wy0=Math.min(wy0,w.y);wy1=Math.max(wy1,w.y)}
  const tx0=Math.max(0,Math.floor(wx0/T)-2),tx1=Math.min(NX-1,Math.ceil(wx1/T)+2),ty0=Math.max(0,Math.floor(wy0/T)-2),ty1=Math.min(NY-1,Math.ceil(wy1/T)+2);
  const list=[];
  for(let sum=tx0+ty0;sum<=tx1+ty1;sum++)for(let tx=Math.max(tx0,sum-ty1);tx<=Math.min(tx1,sum-ty0);tx++){const ty=sum-tx,h=gh(tx,ty);if(h<=0)continue;const nx=(tx-ty)*ISO.HW,ny=(tx+ty)*ISO.HH-h*ISO.LV;
   if(nx+ISO.HW+26<lx0||nx-ISO.HW>lx1||ny-3>ly1||ny+2*ISO.HH+(h+1.4)*ISO.LV+30<ly0)continue;list.push([tx,ty])}
  if(!list.length)return{c:null,ox:ox0,oy:oy0,w:ox1-ox0,h:oy1-oy0,done:true};
  // lote V8b: lienzo reciclado de un chunk desalojado del mismo tamaño (evita crear/soltar lienzos de ~0,7 MB al caminar: menos recolector de basura y menos texturas nuevas en la GPU)
  const pw=ox1-ox0,ph=oy1-oy0,pi=CPOOL.findIndex(q=>q.width===pw&&q.height===ph);let cv,c;
  if(pi>=0){cv=CPOOL.splice(pi,1)[0];c=cv.getContext('2d');c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.clearRect(0,0,pw,ph)}else{cv=document.createElement('canvas');cv.width=pw;cv.height=ph;c=cv.getContext('2d')}
  c.setTransform(s,0,0,s,-ox0,-oy0);c.lineJoin='round';
  for(const[tx,ty]of list){if(out(tx+1,ty))shadow(c,tx,ty,'x');if(out(tx,ty+1))shadow(c,tx,ty,'y')}
  return{c:cv,g:c,list:list,i:0,ox:ox0,oy:oy0,w:ox1-ox0,h:oy1-oy0,done:false}}
 // pinta tiles del chunk hasta agotar el tiempo (until = performance.now() límite; 0 = sin límite). Se reparte en varios frames para no causar tirones.
 function run(e,until){while(!e.done){const q=e.list[e.i++];tile(e.g,q[0],q[1]);if(e.i>=e.list.length){e.done=true;e.g=null;e.list=null;BUILT++}else if(until&&performance.now()>=until)break}return e.done}
 function chunk(ci,cj,s,until){const key=ci+','+cj;let e=CACHE.get(key);if(e){CACHE.delete(key);CACHE.set(key,e)}else{e=prep(ci,cj,s);CACHE.set(key,e)}if(!e.done)run(e,until);return e}
 function draw(g,t){
  const V=ISO.V,s=ISO.scale(),cam=ISO.cam;if(Math.abs(s-CSCALE)>1e-6){CACHE=new Map();CPOOL.length=0;CSCALE=s;LC.f=0}grid();
  const cs=CFG.cs,hw=V.cw/2/s,hh=V.ch/2/s,i0=Math.floor((cam.x-hw)/cs),i1=Math.floor((cam.x+hw)/cs),j0=Math.floor((cam.y-hh)/cs),j1=Math.floor((cam.y+hh)/cs),
   offX=Math.round(V.cw/2-cam.x*s),offY=Math.round(V.ch/2-cam.y*s),lim=Math.max(CFG.lru,(i1-i0+1+2*CFG.ring)*(j1-j0+1+2*CFG.ring)+2);
  // velocidad de la cámara (px lógicos/frame): sirve para precargar primero lo que está en la dirección de la marcha
  const vx=cam.x-LC.x,vy=cam.y-LC.y,vm=Math.hypot(vx,vy),jump=!LC.f||vm>cs*.5;LC.x=cam.x;LC.y=cam.y;LC.f=1;
  // anillo de precarga: 3 chunks si la memoria lo permite (CFG.mem: 150–400 MB según la RAM), si no 2 o 1. Con pantalla completa la vista tiene más chunks y cruzar uno nuevo exige hacer toda una fila a tiempo.
  const per=(cs*s)*(cs*s)*4,nv=(i1-i0+1)*(j1-j0+1),R=[3,2].find(r=>((i1-i0+1+2*r)*(j1-j0+1+2*r))*per<=CFG.mem)||1,lim2=Math.max(CFG.lru,(i1-i0+2+2*R)*(j1-j0+2+2*R)+2);   // anillo 3 si la memoria da (CFG.mem sale de la RAM del equipo), si no 2, si no 1
  // visibles: si falta alguno tras un salto (inicio, viaje) o faltan muchos, se hacen de golpe (una pausa única); si no, se pintan por tramos de VB ms (sin tirón; se ve completarse)
  let nm=0;for(let cj=j0;cj<=j1;cj++)for(let ci=i0;ci<=i1;ci++){const q=CACHE.get(ci+','+cj);if(!q||!q.done)nm++}
  const hard=jump||nm>6,vUntil=performance.now()+CFG.vis;
  for(let cj=j0;cj<=j1;cj++)for(let ci=i0;ci<=i1;ci++){const q=CACHE.get(ci+','+cj);if(q&&q.done){chunk(ci,cj,s,0);if(q.c)g.drawImage(q.c,q.ox+offX,q.oy+offY);continue}
   const t0=performance.now(),e=chunk(ci,cj,s,hard?0:Math.max(vUntil,t0+1));if(!e.done||hard){SYNC.n++;SYNC.ms+=performance.now()-t0}if(e.c)g.drawImage(e.c,e.ox+offX,e.oy+offY)}
  // precarga: anillo alrededor de la vista, primero lo más cercano y lo que está en la dirección de la marcha, con un presupuesto de ms por frame
  // (CFG.budget normal; CFG.budgetHi cuando aún falta algo del primer anillo, que es lo que se cruza primero).
  const ax=vm>.05?Math.sign(vx)*(Math.abs(vx)>vm*.3):0,ay=vm>.05?Math.sign(vy)*(Math.abs(vy)>vm*.3):0;   // un chunk extra de precarga en la dirección de la marcha
  const miss=[];for(let cj=j0-R-(ay<0?1:0);cj<=j1+R+(ay>0?1:0);cj++)for(let ci=i0-R-(ax<0?1:0);ci<=i1+R+(ax>0?1:0);ci++){const q=CACHE.get(ci+','+cj);if(q&&q.done)continue;const dx=(ci+.5)*cs-cam.x,dy=(cj+.5)*cs-cam.y,rd=Math.max(i0-ci,ci-i1,j0-cj,cj-j1,0);
   miss.push([Math.hypot(dx,dy)-(vm>.05?.9*cs*(dx*vx+dy*vy)/(Math.hypot(dx,dy)*vm+1e-6):0),ci,cj,rd])}
  miss.sort((a,b)=>a[0]-b[0]);const tn=performance.now(),slow=LC.t&&tn-LC.t>22;LC.t=tn; // si el juego ya va justo (>22 ms entre frames) la precarga baja a 3 ms para no empeorarlo
  const until=tn+(slow?3:(miss.length&&miss.some(m=>m[3]<=1)?CFG.budgetHi:CFG.budget));for(const m of miss){if(performance.now()>=until)break;chunk(m[1],m[2],s,until)}
  // lote V8b: se desaloja lo MÁS LEJANO de la vista (antes, el más antiguo por orden de inserción: los chunks del anillo de precarga ya hechos no se «tocaban» y eran
  // los primeros en salir → se volvían a pintar al rato; caminando se reconstruía ~2,5× más de lo necesario y la precarga no daba abasto → chunks a medias y tirones)
  const lim3=Math.max(lim2,Math.min(Math.floor(CFG.mem/per),lim2*2));   // V8b: se guardan hasta el doble de chunks si la memoria (CFG.mem) da → al volver sobre tus pasos no se repintan
  if(CACHE.size>lim3){const ev=[];for(const[k,e]of CACHE){const c=k.indexOf(','),ci=+k.slice(0,c),cj=+k.slice(c+1);ev.push([Math.max(i0-ci,ci-i1,j0-cj,cj-j1,0)*1e6+Math.hypot((ci+.5)*cs-cam.x,(cj+.5)*cs-cam.y),k])}
   ev.sort((a,b)=>b[0]-a[0]);for(let n=0;n<ev.length&&CACHE.size>lim3;n++){const e=CACHE.get(ev[n][1]);CACHE.delete(ev[n][1]);if(e&&e.c&&e.done&&CPOOL.length<12)CPOOL.push(e.c)}}
  if(GLOK())waterGL(t);else waterFx(g,t)}
 // Carga previa (pantalla de carga, oct 2026): construye en tandas de `ms` los chunks de la vista + el anillo de precarga alrededor de la cámara actual. Devuelve [hechos,total].
 function preload(ms){const V=ISO.V,s=ISO.scale(),cam=ISO.cam;if(Math.abs(s-CSCALE)>1e-6){CACHE=new Map();CPOOL.length=0;CSCALE=s;LC.f=0}grid();
  const cs=CFG.cs,hw=V.cw/2/s,hh=V.ch/2/s,i0=Math.floor((cam.x-hw)/cs),i1=Math.floor((cam.x+hw)/cs),j0=Math.floor((cam.y-hh)/cs),j1=Math.floor((cam.y+hh)/cs),per=(cs*s)*(cs*s)*4,
   R=[3,2].find(r=>((i1-i0+1+2*r)*(j1-j0+1+2*r))*per<=CFG.mem)||1,list=[];
  for(let cj=j0-R;cj<=j1+R;cj++)for(let ci=i0-R;ci<=i1+R;ci++)list.push([Math.hypot((ci+.5)*cs-cam.x,(cj+.5)*cs-cam.y),ci,cj]);list.sort((a,b)=>a[0]-b[0]);
  const until=performance.now()+ms;let done=0;
  for(const m of list){const q=CACHE.get(m[1]+','+m[2]);if(q&&q.done){done++;continue}if(performance.now()>=until)continue;const e=chunk(m[1],m[2],s,until);if(e.done)done++}
  return[done,list.length]}
 // agua viva (F2-C1/C3), todo en 2D sin shaders ni filtros: (1) dos texturas repetibles por bioma (cáusticas claras + manchas oscuras) que se desplazan en
 // sentidos distintos y se recortan a los tiles de agua visibles (un solo clip por bioma); (2) espuma ondulante en las orillas; (3) destellos y chispas.
 // La textura se genera una vez por bioma a ISO.scale() (192×192 px lógicos, con envoltura sin costuras). Anclada al mundo: no se desliza con la cámara.
 let WT=[],WTS=0;
 function wtex(k,s){if(WTS!==s){WT=[];WTS=s}if(WT[k])return WT[k];const Th=theme(k),N=192,px=Math.round(N*s),mk=()=>{const c=document.createElement('canvas');c.width=c.height=px;const x=c.getContext('2d');x.scale(px/N,px/N);x.lineCap='round';x.lineJoin='round';return[c,x]},r=PAINT.rng(1234+k*77);
  const[lc,lx]=mk();lx.strokeStyle=Th.wl;
  for(let i=0;i<40;i++){const x0=r()*N,y0=r()*N,len=14+r()*30,amp=1+r()*2.6,ph=r()*6.28,w=.7+r()*1.1,al=.22+r()*.4;lx.lineWidth=w;lx.globalAlpha=al;
   for(const ox of[-N,0,N])for(const oy of[-N,0,N]){if(x0+ox+len<-4||x0+ox-len>N+4||y0+oy<-6||y0+oy>N+6)continue;lx.beginPath();for(let j=0;j<=10;j++){const u=j/10,X=x0+ox+(u-.5)*len,Y=y0+oy+Math.sin(u*6.28*1.5+ph)*amp;j?lx.lineTo(X,Y):lx.moveTo(X,Y)}lx.stroke()}}
  const[dc,dx]=mk();dx.fillStyle=Th.wd;
  for(let i=0;i<16;i++){const x0=r()*N,y0=r()*N,rx=10+r()*20,ry=rx*(.3+r()*.25),n=6,ph=r()*6.28;dx.globalAlpha=.1+r()*.1;
   for(const ox of[-N,0,N])for(const oy of[-N,0,N]){if(x0+ox+rx<0||x0+ox-rx>N||y0+oy+ry<0||y0+oy-ry>N)continue;dx.beginPath();for(let j=0;j<n;j++){const a=j/n*6.283+ph,q=1+.3*Math.sin(j*2.7+ph);j?dx.lineTo(x0+ox+Math.cos(a)*rx*q,y0+oy+Math.sin(a)*ry*q):dx.moveTo(x0+ox+Math.cos(a)*rx*q,y0+oy+Math.sin(a)*ry*q)}dx.closePath();dx.fill()}}
  return WT[k]={l:lc,d:dc,px}}
 function waterFx(g,t){const V=ISO.V,s=ISO.scale(),cs=[ISO.toWorld(0,0),ISO.toWorld(V.cw,0),ISO.toWorld(0,V.ch),ISO.toWorld(V.cw,V.ch)],
   tx0=Math.max(0,Math.floor(Math.min(...cs.map(p=>p.x))/T)-1),tx1=Math.min(NX-1,Math.ceil(Math.max(...cs.map(p=>p.x))/T)+1),ty0=Math.max(0,Math.floor(Math.min(...cs.map(p=>p.y))/T)-1),ty1=Math.min(NY-1,Math.ceil(Math.max(...cs.map(p=>p.y))/T)+1);
  const clip=[],foam=[],spark=[],pt=(x,y)=>ISO.toCanvas(x*T,y*T,HWATER);
  for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++){if(gh(tx,ty)!==HWATER)continue;const k=biomeOf(tx,ty);
   const cp=clip[k]||(clip[k]=new Path2D()),n=pt(tx,ty),e=pt(tx+1,ty),so=pt(tx+1,ty+1),w=pt(tx,ty+1);
   cp.moveTo(n.x,n.y);cp.lineTo(e.x,e.y);cp.lineTo(so.x,so.y);cp.lineTo(w.x,w.y);cp.closePath();
   // espuma en las aristas que tocan tierra: línea ondulante hacia dentro del agua; dos fases alternas por tile
   const fp=foam[(tx+ty)&1]||(foam[(tx+ty)&1]=new Path2D()),edge=(a,b,nx,ny)=>{const dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,ox=nx*2.2*s,oy=ny*1.1*s;fp.moveTo(a.x+ox,a.y+oy);for(let j=1;j<=4;j++){const u=j/4,wv=Math.sin(t*1.6+u*5+tx*1.3+ty*.9)*1.1*s;fp.lineTo(a.x+dx*u+ox+nx*wv,a.y+dy*u+oy+ny*wv*.5)}};
   if(gh(tx+1,ty)>HWATER)edge(e,so,-1,-.5);if(gh(tx,ty+1)>HWATER)edge(w,so,1,-.5);if(gh(tx-1,ty)>HWATER)edge(n,w,1,.5);if(gh(tx,ty-1)>HWATER)edge(n,e,-1,.5);
   // chispas que parpadean (1 por tile con probabilidad)
   const hq=PAINT.hash(tx,ty,k,91);if(hq<.5){const tw=Math.sin(t*2.2+hq*40);if(tw>.55){const p=pt(tx+.25+hq,ty+.3+((hq*7)%.4)),z=(1+tw)*1.3*s;(spark[k]||(spark[k]=new Path2D())).moveTo(p.x-z,p.y);spark[k].lineTo(p.x+z,p.y);spark[k].moveTo(p.x,p.y-z*.6);spark[k].lineTo(p.x,p.y+z*.6)}}}
  g.save();g.lineCap='round';
  const o=ISO.toCanvas(0,0,HWATER);
  clip.forEach((cp,k)=>{if(!cp)return;const tx=wtex(k,s),Th=theme(k);g.save();g.clip(cp);
   // capa oscura (manchas profundas) hacia un lado, capa clara (cáusticas) hacia el otro; parpadeo suave de la clara
   const pd=g.createPattern(tx.d,'repeat'),pl=g.createPattern(tx.l,'repeat');
   if(pd&&pd.setTransform){pd.setTransform(new DOMMatrix().translate(o.x-t*9*s,o.y+t*3.5*s));g.globalAlpha=1;g.fillStyle=pd;g.fillRect(0,0,V.cw,V.ch)}
   if(pl&&pl.setTransform){pl.setTransform(new DOMMatrix().translate(o.x+t*16*s,o.y+t*6*s));g.globalAlpha=.9+.1*Math.sin(t*1.3+k);g.fillStyle=pl;g.fillRect(0,0,V.cw,V.ch);
    pl.setTransform(new DOMMatrix().translate(o.x-t*8*s+37*s,o.y-t*3*s+23*s));g.globalAlpha=.6;g.fillStyle=pl;g.fillRect(0,0,V.cw,V.ch)}   // segunda pasada de cáusticas, más lenta y en sentido contrario (da profundidad)
   // crestas de ola: franjas claras que viajan por el mundo en dos direcciones cruzadas (se ve claramente que el agua se mueve)
   {const wx0=Math.min(...cs.map(p=>p.x))-40,wx1=Math.max(...cs.map(p=>p.x))+40,wy0=Math.min(...cs.map(p=>p.y))-40,wy1=Math.max(...cs.map(p=>p.y))+40;g.fillStyle=Th.wl;
    for(const[ax,P,sp,wd,al]of[[0,52,20,10,.22],[1,70,-14,7,.16]]){const lo=ax?wy0:wx0,hi=ax?wy1:wx1,ph=((t*sp)%P+P)%P,b0=Math.floor((lo-ph)/P);g.beginPath();
     for(let b=b0;(b)*P+ph<hi;b++){const u=b*P+ph,wob=Math.sin(t*1.1+b)*3,q=(a,c)=>{const p=ax?ISO.toCanvas(c,a,HWATER):ISO.toCanvas(a,c,HWATER);return p};
      const lo2=ax?wx0:wy0,hi2=ax?wx1:wy1,A=q(u,lo2),B=q(u+wd,lo2),C=q(u+wd+wob,hi2),D=q(u+wob,hi2);g.moveTo(A.x,A.y);g.lineTo(B.x,B.y);g.lineTo(C.x,C.y);g.lineTo(D.x,D.y);g.closePath()}
     g.globalAlpha=al*(.8+.2*Math.sin(t*.9+ax));g.fill()}}
   if(k===5){g.globalAlpha=.1+.07*Math.sin(t*1.7);g.fillStyle=Th.wl;g.fillRect(0,0,V.cw,V.ch)}                                                             // lava: pulso de brillo
   g.restore()});
  g.lineWidth=Math.max(1,1.5*s);foam.forEach((fp,i)=>{g.strokeStyle='#ffffff';g.globalAlpha=.22+.22*(.5+.5*Math.sin(t*1.5+i*Math.PI));g.stroke(fp)});
  g.lineWidth=Math.max(1,1.2*s);g.globalAlpha=.9;spark.forEach((p,k)=>{if(!p)return;g.strokeStyle=theme(k).fx;g.stroke(p)});
  g.restore()}
 // agua con WebGL (F2-C4): un triángulo-par por tile de agua visible, con coordenadas de mundo y «profundidad» por vértice (0 en la orilla, 1 mar adentro).
 // Se agrupa por bioma (cada uno con su paleta) y lo dibuja WGL en el canvas que va bajo el 2D. Los huecos de agua del chunk dejan ver ese canvas.
 const GBUF=[],PGL=[];
 const palGL=k=>PGL[k]||(PGL[k]=(()=>{const Th=theme(k),h=WGL.hex;return{base:h(Th.w),light:h(Th.wl),dark:h(Th.wd),foam:h(M(Th.wsh,'#ffffff',.65)),spark:k===5?[1,.9,.5]:[1,1,1]}})());
 const isW=(tx,ty)=>gh(tx,ty)===HWATER;
 const vdep=(i,j)=>isW(i-1,j-1)&&isW(i,j-1)&&isW(i-1,j)&&isW(i,j)?1:0;
 function waterGL(t){const V=ISO.V,s=ISO.scale(),cs=[ISO.toWorld(0,0),ISO.toWorld(V.cw,0),ISO.toWorld(0,V.ch),ISO.toWorld(V.cw,V.ch)],
   tx0=Math.max(0,Math.floor(Math.min(...cs.map(p=>p.x))/T)-1),tx1=Math.min(NX-1,Math.ceil(Math.max(...cs.map(p=>p.x))/T)+1),ty0=Math.max(0,Math.floor(Math.min(...cs.map(p=>p.y))/T)-1),ty1=Math.min(NY-1,Math.ceil(Math.max(...cs.map(p=>p.y))/T)+1);
  const groups=[],pad=1.2*s;
  for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++){if(!isW(tx,ty))continue;const k=biomeOf(tx,ty);let G=groups[k];
   if(!G){const cap=Math.max(2000,(tx1-tx0+1)*(ty1-ty0+1))*30;G=groups[k]={v:GBUF[k]&&GBUF[k].length>=cap?GBUF[k]:(GBUF[k]=new Float32Array(cap)),n:0,pal:palGL(k),lava:k===5?1:0}}
   const P=(i,j)=>ISO.toCanvas(i*T,j*T,HWATER),a=P(tx,ty),b=P(tx+1,ty),c=P(tx+1,ty+1),d=P(tx,ty+1),mx=(a.x+c.x)/2,my=(a.y+c.y)/2,ex=(p)=>({x:p.x+Math.sign(p.x-mx)*pad,y:p.y+Math.sign(p.y-my)*pad});
   const A=ex(a),B=ex(b),C=ex(c),D=ex(d),da=vdep(tx,ty),db=vdep(tx+1,ty),dc=vdep(tx+1,ty+1),dd=vdep(tx,ty+1),v=G.v;let n=G.n*5;
   const push=(p,i,j,dp)=>{v[n++]=p.x;v[n++]=p.y;v[n++]=i;v[n++]=j;v[n++]=dp};
   push(A,tx,ty,da);push(B,tx+1,ty,db);push(C,tx+1,ty+1,dc);push(A,tx,ty,da);push(C,tx+1,ty+1,dc);push(D,tx,ty+1,dd);G.n+=6}
  const rip=new Float32Array(24).fill(-1);let q=0;for(const r of RIP){const a=t-r.t;if(a<0||a>2||q>=8)continue;rip[q*3]=r.x/T;rip[q*3+1]=r.y/T;rip[q*3+2]=a;q++}
  const sn=ENV.sun,dayK=Math.max(0,Math.min(1,(sn+.1)/.5)),duskK=Math.max(0,1-Math.abs(sn)*3.5),mx=(a,b,k)=>a.map((v,i)=>v+(b[i]-v)*k),sky=mx(mx([.25,.3,.55],[.78,.9,1],dayK),[1,.62,.38],duskK*.8);
  WGL.render(groups.filter(Boolean),t,{rip,sky,skyA:.35+.4*Math.max(dayK,duskK)})}
 // ondas: la pesca las llama con ripple(x,y); env() recibe cada frame la posición del jugador y la hora para la estela y el cielo
 const RIP=[],ENV={sun:1,t:0,lx:0,ly:0,lt:-9};
 function ripple(x,y){RIP.push({x,y,t:ENV.t});if(RIP.length>8)RIP.shift()}
 function env(px,py,t,sun){ENV.t=t;ENV.sun=sun;if(!GRID)return;const tx=Math.floor(px/T),ty=Math.floor(py/T);let bx=0,by=0,bd=1e9;
  for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)if(isW(tx+i,ty+j)){const cx=(tx+i+.5)*T,cy=(ty+j+.5)*T,d=Math.hypot(cx-px,cy-py);if(d<bd){bd=d;bx=cx;by=cy}}
  if(bd<1e9&&t-ENV.lt>.45&&Math.hypot(px-ENV.lx,py-ENV.ly)>3){ENV.lt=t;ripple(bx,by)}
  ENV.lx=px;ENV.ly=py}
 // estado de la caché (para herramientas de prueba y medir memoria en F8)
 const stats=()=>{let n=0,b=0;CACHE.forEach(e=>{if(e.c&&e.done){n++;b+=e.w*e.h*4}});return{chunks:CACHE.size,pintados:n,bytes:b,construidos:BUILT,escala:CSCALE,sync:SYNC.n,syncMs:Math.round(SYNC.ms)}};
 // compuerta del paso entre biomas k-1 → k (provisional): postes y viga; cerrada = muro de postes
 function gate(g,k,open,t){
  const G=BIOMES.gates.find(q=>q.b===k);if(!G)return;
  const V=ISO.V,s=ISO.scale(),vt=!!G.vert,fx=vt?Math.floor(G.x/T)*T+T/2:0,fy=vt?0:Math.floor(G.y/T)*T+T/2,a0=vt?G.y0:G.x0,a1=vt?G.y1:G.x1,pt=(u)=>vt?ISO.toCanvas(fx,u,HGROUND):ISO.toCanvas(u,fy,HGROUND);
  g.save();g.lineWidth=Math.max(1,s*.9);g.strokeStyle=INK;
  const post=(u,hgt)=>{const p=pt(u),w=7*s;g.fillStyle='#8a5a2a';g.fillRect(p.x-w/2,p.y-hgt*s,w,hgt*s);g.strokeRect(p.x-w/2,p.y-hgt*s,w,hgt*s)};
  if(open){post(a0-4,30);post(a1+4,30);const a=pt(a0-4),b=pt(a1+4);g.strokeStyle='#bd7a45';g.lineWidth=3*s;g.beginPath();g.moveTo(a.x,a.y-30*s);g.lineTo(b.x,b.y-30*s);g.stroke()}
  else{for(let u=a0;u<=a1;u+=19)post(u,26);const a=pt(a0),b=pt(a1);g.strokeStyle='#5a3a1a';g.lineWidth=3*s;g.beginPath();g.moveTo(a.x,a.y-18*s);g.lineTo(b.x,b.y-18*s);g.stroke();
   const m=pt((a0+a1)/2);g.font=Math.round(13*s)+'px VT323, monospace';g.textAlign='center';g.fillStyle=INK;g.fillText('🔒 Derrota al jefe anterior',m.x,m.y-38*s)}
  g.restore()}
 return{PAL,PAPER,heightAt,standZ,cliffNear,tileH,sandAt,isLand,rk,draw,preload,gate,NX,NY,CFG,reset,stats,ripple,env}
})();
if(typeof module!=='undefined')module.exports=TER;
