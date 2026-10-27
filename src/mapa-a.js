// NotScape · FASE 3·e / E-MAPA-2b (26 oct 2026) · `?map=A`: el continente del MAPA ANTIGUO A (src/continent.js) en lugar de la rejilla 3×3. SOLO con `?map=A`; sin el parámetro este módulo no hace NADA.
// Modelo POR REGIÓN (decidido por el dueño el 26 oct): `BIOMES.own(x,y)` = región real del mapa A (un bioma por punto; el mar toma la región de la tierra más cercana); los DATOS LOCALES de cada
// bioma (aldea, layout, zonas, POI) siguen en un rectángulo {ox,oy,w,h}, ahora ANCLADO en el interior de su región (el centro de su aldea cae en el punto más hondo de la región). La GEOMETRÍA (agua,
// colinas, mar propio del layout) solo se evalúa dentro de ese rectángulo (`BIOMES.geoOwn`); fuera = terreno llano sin datos (los lotes siguientes lo rellenan: recursos, fauna y POI por región).
// Se carga tras sky-biome.js y ANTES de seams.js/coast.js/world-iso.js. Qué cambia con `?map=A`: ox/oy de cada bioma, WW/WH, `own/at/geoOwn`, sin uniones ni cordilleras de la rejilla, y costa = CONT.
// El Cielo (zona) se queda como una columna extra al ESTE del continente (todo lo que `isla.js`/coast.js asumen: «x ≥ zone.x0 es aire»).
// Pendiente (lotes siguientes): recursos/fauna/POI por región, cordilleras y ríos del mapa, caminos A*, aldeas de los otros biomas, minimapa. Ver «Lote E-MAPA-2b» en AGENTS.md.
(()=>{
 if(typeof location==='undefined'||!/[?&]map=A\b/.test(location.search))return;
 if(typeof BIOMES==='undefined'||typeof CONT==='undefined'||!BIOMES.list)return;
 const T=32,B=BIOMES,list=B.list,zone=list.find(b=>b.zone)||null,K=(typeof WS!=='undefined'&&WS.K)||2,tpp=4.34*K/6,cell=4,t0=performance.now();
 const r=CONT.build({tpp,cell}),w=r.w,h=r.h,N=w*h,CW=r.tiles.w*T,CH=r.tiles.h*T;
 // transformada de distancia (cadena 3-4) con etiqueta del origen más cercano: d en celdas, l = etiqueta del origen
 const dt=(isSrc,label)=>{const d=new Float32Array(N),l=new Uint8Array(N),INF=1e9,a=1,b=1.414;
  for(let k=0;k<N;k++){if(isSrc(k)){d[k]=0;l[k]=label?label(k):0}else d[k]=INF}
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const k=j*w+i;let v=d[k],lb=l[k];if(!v)continue;
   const t=(q,c)=>{if(d[q]+c<v){v=d[q]+c;lb=l[q]}};if(i>0)t(k-1,a);if(j>0){t(k-w,a);if(i>0)t(k-w-1,b);if(i<w-1)t(k-w+1,b)}d[k]=v;l[k]=lb}
  for(let j=h-1;j>=0;j--)for(let i=w-1;i>=0;i--){const k=j*w+i;let v=d[k],lb=l[k];if(!v)continue;
   const t=(q,c)=>{if(d[q]+c<v){v=d[q]+c;lb=l[q]}};if(i<w-1)t(k+1,a);if(j<h-1){t(k+w,a);if(i<w-1)t(k+w+1,b);if(i>0)t(k+w-1,b)}d[k]=v;l[k]=lb}
  return{d,l}};
 const isLand=k=>r.land[k]>0,GAME=CONT.GAME;
 // región del juego por celda (1..9 → índice de bioma + 1; 0 = nada). El mar toma la etiqueta de la tierra más cercana (nunca hay «vacío» dentro del continente).
 const near=dt(isLand,k=>GAME[r.bio[k]]+1),OWN=near.l;
 // campo de distancia con signo a la costa, en TILES (+ tierra, − mar), de las dos transformadas
 const dSea=dt(k=>!isLand(k)).d,SD=new Float32Array(N);for(let k=0;k<N;k++)SD[k]=isLand(k)?dSea[k]*cell:-near.d[k]*cell;
 const D=(xp,yp)=>{const u=Math.max(0,Math.min(w-1.001,xp/T/cell-.5)),v=Math.max(0,Math.min(h-1.001,yp/T/cell-.5)),i=u|0,j=v|0,a=u-i,b=v-j,o=j*w+i;
  return(SD[o]*(1-a)+SD[o+1]*a)*(1-b)+(SD[o+w]*(1-a)+SD[o+w+1]*a)*b};
 // ── CORDILLERAS del mapa antiguo A (cumbres MS de docs/style-reference/mapa_antiguo_A.html): polilíneas en (u,v) de referencia con PASOS (huecos) para no cerrar el continente ──
 const X0=50,Y0=45,CWr=165,CHr=145,toPx=(u,v)=>[(X0+u*CWr)*tpp*T,(Y0+v*CHr)*tpp*T];
 const MSEG=[[[.6,1.4],[.65,1.9]],[[.75,2.4],[.8,2.9],[.85,3.3]],[[2.35,.95],[2.4,1.25],[2.35,1.6]],[[2.3,1.95],[2.2,2.25]],[[1.0,3.85],[1.3,4.0]],[[1.6,4.05],[1.95,4.1]],[[2.5,3.75],[2.4,4.05]]];   // dorsal oeste (paso en 2,15) · cordillera este (paso en 1,8) · dorsal sur (paso en 1,45) · espolón del Volcán
 const RNG={w:480,f:640,amp:110},RMASK=new Uint8Array(N);
 MSEG.forEach(sg=>{for(let i=0;i<sg.length-1;i++){const a0=toPx(...sg[i]),b0=toPx(...sg[i+1]),n=Math.ceil(Math.hypot(b0[0]-a0[0],b0[1]-a0[1])/(cell*T*.5));
  for(let q=0;q<=n;q++){const x=a0[0]+(b0[0]-a0[0])*q/n,y=a0[1]+(b0[1]-a0[1])*q/n,ci=Math.floor(x/T/cell),cj=Math.floor(y/T/cell);if(ci>=0&&cj>=0&&ci<w&&cj<h)RMASK[cj*w+ci]=1}}});
 const DR=dt(c=>RMASK[c]===1).d,RFAR=(RNG.w+RNG.f+RNG.amp*1.6+160)/T/cell;   // celdas a las que la aldea queda fuera de la cordillera (núcleo + falda + ondulación + margen)
 // punto más hondo de cada región de tierra firme (ancla de la aldea)
 const anchor=[];
 for(let k=0;k<9;k++){const reg0=c=>r.land[c]===1&&GAME[r.bio[c]]===k,reg=c=>reg0(c)&&DR[c]>=RFAR,ds=dt(c=>!reg0(c)).d;let best=-1,bi=0;for(let c=0;c<N;c++)if(reg(c)&&ds[c]>best){best=ds[c];bi=c}if(best<0)for(let c=0;c<N;c++)if(reg0(c)&&ds[c]>best){best=ds[c];bi=c}   /* sin hueco lejos de las montañas: la más honda */anchor[k]=[((bi%w)+.5)*cell*T,(Math.floor(bi/w)+.5)*cell*T,best*cell]}
 // colocación de los rectángulos de datos: el centro de la aldea (b.cen, local) cae en el ancla; el rectángulo se mantiene dentro del continente y alineado a tiles
 const old=zone?{ox:zone.ox,oy:zone.oy}:null,al=v=>Math.round(v/T)*T;
 list.forEach((b,k)=>{if(b.zone)return;const a=anchor[k],c=b.cen||[b.w/2,b.h/2];b.ox=al(Math.max(0,Math.min(CW-b.w,a[0]-c[0])));b.oy=al(Math.max(0,Math.min(CH-b.h,a[1]-c[1])))});
 let dxz=0,dyz=0;
 if(zone){const pr=list[0];zone.ox=CW;zone.oy=al(Math.max(0,Math.min(CH-zone.h,pr.oy+pr.h/2-zone.h/2)));dxz=zone.ox-old.ox;dyz=zone.oy-old.oy}
 B.WW=CW+(zone?zone.w:0);B.WH=CH;
 // sin uniones, compuertas ni cordilleras de la rejilla (las del Cielo se desplazan con él)
 B.seams=[];B.openSeams=[];B.zseams=[];B.openPairs=[];B.gates=[];
 const keep=B.ranges.filter(q=>q.id==='cielo');B.ranges.length=0;keep.forEach(q=>{q.p.forEach(p=>{p[0]+=dxz;p[1]+=dyz});q.bb=[q.bb[0]+dxz,q.bb[1]+dxz,q.bb[2]+dyz,q.bb[3]+dyz];B.ranges.push(q)});
 if(B.addRange)MSEG.forEach((sg,i)=>B.addRange({id:'mapA'+i,p:sg.map(q=>toPx(...q).map(Math.round)),w:RNG.w,f:RNG.f,amp:RNG.amp,seed:5+i*11,pk:8,col:['#6b6670','#8a8590','#b8b4bc']}));
 if(B.zone){B.zone.cx+=dxz;B.zone.cy+=dyz;B.zone.x0=zone.ox}
 // propiedad por punto
 const zk=zone?list.indexOf(zone):-1;
 B.own=(x,y)=>{if(x<0||y<0||x>=B.WW||y>=B.WH)return -1;
  if(zone&&x>=zone.ox)return y>=zone.oy&&y<zone.oy+zone.h?zk:-1;
  return OWN[Math.min(h-1,(y/T/cell)|0)*w+Math.min(w-1,(x/T/cell)|0)]-1};
 B.at=(x,y)=>B.own(x,y);
 B.geoOwn=(x,y)=>{const k=B.own(x,y);if(k<0)return -1;const b=list[k];return x>=b.ox&&x<b.ox+b.w&&y>=b.oy&&y<b.oy+b.h?k:-1};
 B.blendAt=(x,y,k)=>{BL[0]=k;BL[1]=0;return BL};const BL=[0,0];
 B.spawnOf=k=>{const b=list[k];return{x:b.ox+b.spawn[0],y:b.oy+b.spawn[1]}};
 // poda: lo que la aldea de un bioma tenga fuera de SU región (props) se quita (coast.js poda además lo que cae al mar)
 let pruned=0;list.forEach((b,k)=>{const P=b.village&&b.village.props;if(!P||b.zone)return;for(let i=P.length-1;i>=0;i--){if(B.own(b.ox+P[i].x,b.oy+P[i].y)!==k){P.splice(i,1);pruned++}}});
 // ── HIDROLOGÍA (mismo método que el mapa antiguo): relleno de cuencas (priority-flood) + dirección de flujo + acumulación sobre una rejilla de 4 px de referencia. Todo drena al mar; los lagos son
 // depresiones rellenadas; el ancho del río sale del caudal. Resultado: máscara de AGUA por celda (`WM`) con VADOS (huecos de ~1 segmento, hash determinista) para que los ríos no aíslen regiones
 // mientras no haya puentes (los caminos A* con puentes son un lote aparte).
 const hs=(x,y)=>{let q=Math.imul(x,374761393)+Math.imul(y,668265263);q=Math.imul(q^(q>>>13),1274126177);return((q^(q>>>16))>>>0)/4294967295},
  vn=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,sx=xf*xf*(3-2*xf),sy=yf*yf*(3-2*yf),a=hs(xi,yi),b=hs(xi+1,yi),c=hs(xi,yi+1),d=hs(xi+1,yi+1);return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy},
  fb=(x,y)=>vn(x,y)*.6+vn(x*2.1,y*2.1)*.3+vn(x*4.3,y*4.3)*.1;
 const HS=4,RW=CONT.REF_W,RH=CONT.REF_H,hw=Math.ceil(RW/HS),hh=Math.ceil(RH/HS),HN=hw*hh,hz=new Float32Array(HN),fz=new Float32Array(HN),fl=new Int32Array(HN).fill(-1),isL=new Uint8Array(HN),vis=new Uint8Array(HN),acc=new Float32Array(HN);
 const MSP=[[.6,1.4],[.65,1.9],[.75,2.4],[.8,2.9],[.85,3.3],[2.35,.95],[2.4,1.25],[2.35,1.6],[2.3,1.95],[2.2,2.25],[1.0,3.85],[1.3,4.0],[1.6,4.05],[1.95,4.1],[2.5,3.75],[2.4,4.05]];
 const cellAt=(rx,ry)=>{const ci=Math.floor(rx*tpp/cell),cj=Math.floor(ry*tpp/cell);return ci>=0&&cj>=0&&ci<w&&cj<h?cj*w+ci:-1};
 const Hh=(u,v,sdTiles)=>{let m=0;for(const q of MSP){const dx=u-q[0],dy=v-q[1];m=Math.max(m,Math.exp(-(dx*dx+dy*dy)/.16))}const dist=Math.min(Math.max(sdTiles,0)/tpp,400)/CWr;return 1.5*m+.8*dist-.5*u+.04*fb(u*3+2,v*3+5)};
 for(let j=0;j<hh;j++)for(let i=0;i<hw;i++){const k=j*hw+i,rx=i*HS+2,ry=j*HS+2,c=cellAt(rx,ry),id=c>=0?r.bio[c]:0;isL[k]=id>0&&id<10?1:0;const u=(rx-X0)/CWr,v=(ry-Y0)/CHr,dx=u-1.85,dy=v-2.65;hz[k]=isL[k]?Hh(u,v,SD[c])-.3*Math.exp(-(dx*dx+dy*dy)/.05):-1}
 {const hp=[],push=(c,k)=>{hp.push([c,k]);let i=hp.length-1;while(i>0){const q=(i-1)>>1;if(hp[q][0]<=hp[i][0])break;const t=hp[q];hp[q]=hp[i];hp[i]=t;i=q}},
   pop=()=>{const top=hp[0],last=hp.pop();if(hp.length){hp[0]=last;let i=0;for(;;){const l=2*i+1,rr=l+1;let m=i;if(l<hp.length&&hp[l][0]<hp[m][0])m=l;if(rr<hp.length&&hp[rr][0]<hp[m][0])m=rr;if(m===i)break;const t=hp[m];hp[m]=hp[i];hp[i]=t;i=m}}return top};
  for(let k=0;k<HN;k++)if(!isL[k]){vis[k]=1;fz[k]=hz[k];push(fz[k],k)}
  while(hp.length){const e=pop(),c=e[1],ci=c%hw,cj=(c-ci)/hw;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const ni=ci+di,nj=cj+dj;if(ni<0||nj<0||ni>=hw||nj>=hh)continue;const nk=nj*hw+ni;if(vis[nk])continue;vis[nk]=1;fz[nk]=Math.max(hz[nk],fz[c]+.0004);fl[nk]=c;push(fz[nk],nk)}}
  const ord=[];for(let k=0;k<HN;k++)if(isL[k]){ord.push(k);acc[k]=1}
  ord.sort((a,b)=>fz[b]-fz[a]);for(const k of ord)if(fl[k]>=0&&isL[fl[k]])acc[fl[k]]+=acc[k]}
 // lagos: depresiones rellenadas, lejos de la costa, componentes ≥ 80 celdas
 const lk=new Uint8Array(HN);
 for(let k=0;k<HN;k++)if(isL[k]&&fz[k]-hz[k]>.035){const ki=k%hw,kj=(k-ki)/hw;let nr=0;for(let dj=-6;dj<=6&&!nr;dj++)for(let di=-6;di<=6;di++){const ni=ki+di,nj=kj+dj;if(ni<0||nj<0||ni>=hw||nj>=hh||!isL[nj*hw+ni]){nr=1;break}}if(!nr)lk[k]=1}
 {const seen=new Uint8Array(HN);for(let s0=0;s0<HN;s0++){if(!lk[s0]||seen[s0])continue;const comp=[s0];seen[s0]=1;for(let q=0;q<comp.length;q++){const c=comp[q],ci=c%hw,cj=(c-ci)/hw;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const ni=ci+di,nj=cj+dj;if(ni<0||nj<0||ni>=hw||nj>=hh)continue;const nk=nj*hw+ni;if(lk[nk]&&!seen[nk]){seen[nk]=1;comp.push(nk)}}}if(comp.length<80)comp.forEach(c=>{lk[c]=0})}}
 // CAMPO DE AGUA por celda de CONT (4 tiles): `WD` = profundidad con signo en tiles (+ dentro del cauce/lago, − fuera, tope −6) = máx. sobre cápsulas de río (radio = medio ancho del mapa × tpp;
 // ×1,8 en el último tramo = ESTUARIO) y discos de lago. Se consulta con interpolación bilineal, un DESPLAZAMIENTO de baja frecuencia (meandros, ±3 tiles cada ~40) y ruido fino de orilla.
 const WD=new Float32Array(N).fill(-6),RT=70,nst={rios:0,vados:0,lagos:0},SW=3.4;
 const cen=k=>[((k%hw)*HS+2)*tpp,(Math.floor(k/hw)*HS+2)*tpp];   // tiles
 const capsule=(a0,b0,rad)=>{const m=rad+6,i0=Math.max(0,Math.floor((Math.min(a0[0],b0[0])-m)/cell)),i1=Math.min(w-1,Math.ceil((Math.max(a0[0],b0[0])+m)/cell)),j0=Math.max(0,Math.floor((Math.min(a0[1],b0[1])-m)/cell)),j1=Math.min(h-1,Math.ceil((Math.max(a0[1],b0[1])+m)/cell)),dx=b0[0]-a0[0],dy=b0[1]-a0[1],l2=dx*dx+dy*dy||1;
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const px=(i+.5)*cell,py=(j+.5)*cell,u=Math.max(0,Math.min(1,((px-a0[0])*dx+(py-a0[1])*dy)/l2)),v=rad-Math.hypot(px-a0[0]-dx*u,py-a0[1]-dy*u);if(v>WD[j*w+i]&&r.land[j*w+i]===1)WD[j*w+i]=v}};
 for(let k=0;k<HN;k++){if(!isL[k]||acc[k]<RT||lk[k])continue;const to=fl[k];if(to<0)continue;
  if(isL[to]&&hs(k,7)<.1){nst.vados++;continue}   // VADO: este tramo no lleva agua (sin puentes aún)
  const wd=Math.min(.8+.2*Math.sqrt(acc[k]-RT+1),4.2);capsule(cen(k),cen(to),Math.max(1.2,wd*tpp*.5)*(isL[to]?1:1.8));nst.rios++}
 for(let k=0;k<HN;k++)if(lk[k]){const c=cen(k);capsule(c,c,HS*.95*tpp);nst.lagos++}
 // profundidad con signo en (x,y) px: bilineal sobre WD con la posición desplazada (meandro) + ruido de orilla
 const wdAt=(x,y)=>{const tx=x/T,ty=y/T,ox=3*(vn(tx/42+3.1,ty/42+7.7)-.5)*2+1.2*(vn(tx/13+9,ty/13+1)-.5)*2,oy=3*(vn(tx/42+11.3,ty/42+2.2)-.5)*2+1.2*(vn(tx/13+4,ty/13+8)-.5)*2,
   u=Math.max(0,Math.min(w-1.001,(tx+ox)/cell-.5)),v=Math.max(0,Math.min(h-1.001,(ty+oy)/cell-.5)),i=u|0,j=v|0,a=u-i,b=v-j,o=j*w+i;
  return(WD[o]*(1-a)+WD[o+1]*a)*(1-b)+(WD[o+w]*(1-a)+WD[o+w+1]*a)*b+.8*(vn(tx/5+1.7,ty/5+5.3)-.5)*2};
 const inSafe=(x,y,k)=>{if(k<0)return false;const b=list[k],sf=b.village&&b.village.safe;return!!sf&&Math.abs(x-b.ox-sf[0])<sf[2]+900&&Math.abs(y-b.oy-sf[1])<sf[3]+900};
 // ¿agua en (x,y)? Dentro del rectángulo de datos del bioma k solo FUERA de su zona segura de aldea (el layout local ya trae el agua de su aldea)
 const waterAt=(x,y,k)=>{if(x<0||y<0||x>=CW||y>=CH)return false;return wdAt(x,y)>0&&!inSafe(x,y,k)};
 // arena de orilla 0..1: franja de SW tiles alrededor del agua (en tierra, fuera de la zona segura de aldea)
 const sandAt=(x,y)=>{if(x<0||y<0||x>=CW||y>=CH)return 0;const v=wdAt(x,y);if(v>0||v<-SW)return 0;if(inSafe(x,y,B.geoOwn(x,y)))return 0;const t=1+v/SW;return t*t*(3-2*t)};
 // ── REPARACIÓN DE CONEXIÓN: si un ancla de aldea queda aislada de la Pradera por agua (ríos/lagos), se talla un VADO por el camino de menor coste (agua = 8, núcleo de cordillera = 60) ──
 {const dry=c=>r.land[c]===1&&WD[c]<=-.2&&DR[c]*cell*T>RNG.w;   // celda seca = tierra firme sin agua (aprox. por WD de la celda; el meandro desplaza ±3 tiles)
  const cid=a=>Math.min(h-1,(a[1]/T/cell)|0)*w+Math.min(w-1,(a[0]/T/cell)|0);
  const flood=src=>{const seen=new Uint8Array(N),q=[src];seen[src]=1;for(let t=0;t<q.length;t++){const c=q[t],i=c%w,j=(c-i)/w;for(const[di,dj]of[[1,0],[-1,0],[0,1],[0,-1]]){const ni=i+di,nj=j+dj;if(ni<0||nj<0||ni>=w||nj>=h)continue;const nc=nj*w+ni;if(!seen[nc]&&dry(nc)){seen[nc]=1;q.push(nc)}}}return seen};
  const base=cid(anchor[0]);let comp=flood(base);nst.vadoRep=0;
  for(let k=1;k<9;k++){const sc=cid(anchor[k]);if(comp[sc])continue;
   // Dijkstra desde sc hasta cualquier celda de `comp` (cola binaria mínima)
   const dist=new Float32Array(N).fill(1e9),prev=new Int32Array(N).fill(-1),hp=[[0,sc]];dist[sc]=0;
   const push=e=>{hp.push(e);let i=hp.length-1;while(i>0){const q=(i-1)>>1;if(hp[q][0]<=hp[i][0])break;[hp[q],hp[i]]=[hp[i],hp[q]];i=q}},pop=()=>{const t=hp[0],l=hp.pop();if(hp.length){hp[0]=l;let i=0;for(;;){const a2=2*i+1,b2=a2+1;let m=i;if(a2<hp.length&&hp[a2][0]<hp[m][0])m=a2;if(b2<hp.length&&hp[b2][0]<hp[m][0])m=b2;if(m===i)break;[hp[m],hp[i]]=[hp[i],hp[m]];i=m}}return t};
   let goal=-1;
   while(hp.length){const[d0,c]=pop();if(d0>dist[c])continue;if(comp[c]){goal=c;break}const i=c%w,j=(c-i)/w;
    for(const[di,dj]of[[1,0],[-1,0],[0,1],[0,-1]]){const ni=i+di,nj=j+dj;if(ni<0||nj<0||ni>=w||nj>=h)continue;const nc=nj*w+ni;if(r.land[nc]!==1)continue;const cost=DR[nc]*cell*T<=RNG.w?60:(WD[nc]>-.2?8:1),nd=d0+cost;if(nd<dist[nc]){dist[nc]=nd;prev[nc]=c;push([nd,nc])}}}
   if(goal<0)continue;
   for(let c=goal;c>=0;c=prev[c]){const i=c%w,j=(c-i)/w;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const ni=i+di,nj=j+dj;if(ni<0||nj<0||ni>=w||nj>=h)continue;if(WD[nj*w+ni]>-6){WD[nj*w+ni]=-6;nst.vadoRep++}}}   // el vado también quita la arena (WD = −6)
   comp=flood(base)}}
 // puntos de pesca candidatos: celdas de agua con cauce ≥ 1,3 tiles de profundidad y tierra a 40–90 px (lo usa mapa-a-fill.js)
 const fishSpots=()=>{const out=[];for(let j=0;j<h;j+=3)for(let i=0;i<w;i+=3){const c=j*w+i;if(WD[c]<1.3)continue;out.push([(i+.5)*cell*T,(j+.5)*cell*T])}return out};
 // caja (px LOCALES al rectángulo de datos del bioma k) que envuelve las celdas de TIERRA de su región: la usan poi-gen.js y mapa-a-fill.js para repartir contenido por toda la región
 const bb=[];for(let k=0;k<9;k++)bb[k]=[1e9,1e9,-1e9,-1e9];
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const c=j*w+i;if(!isLand(c))continue;const k=OWN[c]-1,q=bb[k];if(!q)continue;q[0]=Math.min(q[0],i);q[1]=Math.min(q[1],j);q[2]=Math.max(q[2],i+1);q[3]=Math.max(q[3],j+1)}
 const bbox=k=>{const q=bb[k],b=list[k];if(!q||q[0]>q[2])return null;const S=cell*T;return{x0:q[0]*S-b.ox,y0:q[1]*S-b.oy,w:(q[2]-q[0])*S,h:(q[3]-q[1])*S}};
 B.mapA={waterAt,sandAt,fishSpots,water:nst,bbox,D,r,cell,anchor,CW,CH,pruned,ms:Math.round(performance.now()-t0),K,tpp};
 console.log('[MAPA A] '+B.WW/T+'×'+B.WH/T+' tiles · K='+K+' · '+B.mapA.ms+' ms · props podados '+pruned);
})();
