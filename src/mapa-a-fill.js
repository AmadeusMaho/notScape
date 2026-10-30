// NotScape · E-MAPA-2c (26 oct 2026) · RELLENO POR REGIÓN para `?map=A`: recursos (tala, minería) y fauna repartidos por TODA la región de cada bioma, fuera del rectángulo de datos locales.
// Se carga tras poi-gen.js y ANTES de game.js (que lee `B.res`, `B.lay` y `B.fauna`). Sin `?map=A` (o con `?mapfill=0`) no hace nada.
// Rejilla del mundo de FC tiles; una celda = un candidato (hash determinista, nunca Math.random) con contenido por probabilidad:
//   tala (wc) · veta (mi) · fauna (grupo de 2–3 criaturas) · nada. Las plantillas salen del PROPIO bioma: las especies/vetas de sus zonas de recurso (`B.res.wc/mi`) y las criaturas de sus guaridas
//   (`B.spots`), así un bioma nuevo no necesita tocar este módulo. Se descartan celdas que pisan el rectángulo de datos, una aldea (zona segura), un POI, o cuyo centro no es tierra pisable de la región.
// Escribe en coordenadas LOCALES del rectángulo (pueden ser negativas): `B.res.wc/mi` + `B.lay.wc/mi` (mismo índice) y `B.fauna=[{z,mobs,t}]` (game.js lo convierte en `mob()` y zona).
// Pesca: zonas `fi` a lo largo de los ríos/lagos del mapa (`MA.fishSpots`). Densidad por celda de 48 tiles: 28 % tala · 12 % veta · 22 % fauna (de las celdas libres). `BIOMES.mapA.fill` = estadísticas.
(()=>{
 if(typeof location==='undefined'||!/[?&]map=A\b/.test(location.search)||/[?&]mapfill=0\b/.test(location.search))return;
 if(typeof BIOMES==='undefined'||!BIOMES.mapA||typeof TER==='undefined')return;
 const T=32,FC=48,CP=FC*T,MA=BIOMES.mapA,list=BIOMES.list,st={por:{}},t0=performance.now();
 const H=(a,b,c)=>{let h=(Math.imul(a|0,374761393)+Math.imul(b|0,668265263)+Math.imul(c|0,2147483647))|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};
 const land=(wx,wy)=>{const tx=Math.floor(wx/T),ty=Math.floor(wy/T);return TER.isLand(TER.tileH(tx,ty))&&!TER.seaAt(tx,ty)&&TER.sandAt(tx,ty)<.35&&!TER.mtnAt(wx,wy)};
 const ok=(wx,wy,r,k)=>{if(BIOMES.own(wx,wy)!==k||!land(wx,wy))return false;for(let a=0;a<6;a++){const x=wx+Math.cos(a*1.047)*r,y=wy+Math.sin(a*1.047)*r;if(!TER.isLand(TER.tileH(Math.floor(x/T),Math.floor(y/T))))return false}return!TER.cliffNear(wx,wy,r*.5)};
 // ── CONEXIÓN REAL: con la altura de terreno FINAL (rectángulos incluidos), cada ancla de aldea debe poder llegar a la de la Pradera a pie. Si el agua (ríos o lagos de un layout) aísla una región, se talla un
 // VADO (`MA.ford(x,y)`, que tileH respeta) por el camino de menor coste (agua 8, acantilado 90; el mar no se cruza). Rejilla de 4 tiles. ──
 {const S=4,w=Math.ceil(BIOMES.WW/T/S),h=Math.ceil(BIOMES.WH/T/S),HG=new Float32Array(w*h),ford=new Uint8Array(w*h);let n=0;
  for(let j=0;j<h;j++)for(let i=0;i<w;i++)HG[j*w+i]=TER.heightAt((i*S+.5)*T,(j*S+.5)*T);
  const walk=c=>HG[c]>=1&&HG[c]<2,cid=a=>Math.min(h-1,Math.max(0,(a[1]/T/S)|0))*w+Math.min(w-1,Math.max(0,(a[0]/T/S)|0));
  const flood=src=>{const seen=new Uint8Array(w*h),q=[src];seen[src]=1;for(let t=0;t<q.length;t++){const c=q[t],i=c%w,j=(c-i)/w;for(const[di,dj]of[[1,0],[-1,0],[0,1],[0,-1]]){const ni=i+di,nj=j+dj;if(ni<0||nj<0||ni>=w||nj>=h)continue;const nc=nj*w+ni;if(!seen[nc]&&walk(nc)){seen[nc]=1;q.push(nc)}}}return seen};
  const base=cid(MA.anchor[0]);let comp=flood(base);st.vadosReales=0;
  for(let k=1;k<9;k++){const sc=cid(MA.anchor[k]);if(comp[sc])continue;
   const dist=new Float32Array(w*h).fill(1e9),prev=new Int32Array(w*h).fill(-1),hp=[[0,sc]];dist[sc]=0;
   const push=e=>{hp.push(e);let i=hp.length-1;while(i>0){const q=(i-1)>>1;if(hp[q][0]<=hp[i][0])break;[hp[q],hp[i]]=[hp[i],hp[q]];i=q}},pop=()=>{const t=hp[0],l=hp.pop();if(hp.length){hp[0]=l;let i=0;for(;;){const a2=2*i+1,b2=a2+1;let m=i;if(a2<hp.length&&hp[a2][0]<hp[m][0])m=a2;if(b2<hp.length&&hp[b2][0]<hp[m][0])m=b2;if(m===i)break;[hp[m],hp[i]]=[hp[i],hp[m]];i=m}}return t};
   let goal=-1;
   while(hp.length){const[d0,c]=pop();if(d0>dist[c])continue;if(comp[c]){goal=c;break}const i=c%w,j=(c-i)/w;
    for(const[di,dj]of[[1,0],[-1,0],[0,1],[0,-1]]){const ni=i+di,nj=j+dj;if(ni<0||nj<0||ni>=w||nj>=h)continue;const nc=nj*w+ni,v=HG[nc];let cost;
     if(walk(nc))cost=1;else if(v>=2)cost=90;else if(BIOMES.coast.land(((nc%w)*S)|0,(Math.floor(nc/w)*S)|0))cost=8;else continue;   // el mar abierto no se vadea
     const nd=d0+cost;if(nd<dist[nc]){dist[nc]=nd;prev[nc]=c;push([nd,nc])}}}
   if(goal<0){st.sinRuta=(st.sinRuta||[]).concat(k);continue}
   for(let c=goal;c>=0;c=prev[c]){if(HG[c]!==.75)continue;const i=c%w,j=(c-i)/w;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const ni=i+di,nj=j+dj;if(ni>=0&&nj>=0&&ni<w&&nj<h&&!ford[nj*w+ni]){ford[nj*w+ni]=1;n++}}}
   st.vadosReales++;
   for(let c=0;c<w*h;c++)if(ford[c]&&HG[c]===.75)HG[c]=1;   // el vado ya es suelo para la inundación siguiente
   comp=flood(base)}
  MA.ford=(x,y)=>x>=0&&y>=0&&ford[((y/T/S)|0)*w+((x/T/S)|0)]===1;MA.fordAdd=(x,y)=>{if(x>=0&&y>=0&&x/T/S<w&&y/T/S<h)ford[((y/T/S)|0)*w+((x/T/S)|0)]=1};   // pasos extra (puente de piedra antiguo de la Pradera)
  // ── CAMINOS A* ENTRE ALDEAS con PUENTES (27 oct 2026) ── red = cadena de progresión (Pradera→Bosque→Pantano→Cumbres→Páramo→Desierto→Oriental→Costa→Volcán) + Pradera–Costa (puerto) y Desierto–Volcán.
  // A* de 4 vecinos sobre la rejilla de 4 tiles (la ruta es 4-conexa: los puentes quedan de una celda de ancho y no se cortan en diagonal). Coste: suelo 1 (+ruido de hash ≤ .35 para que serpentee), agua 14 (puente),
  // camino ya trazado 0,4 (los troncales se funden); acantilado/montaña/mar impasables. Cada celda de AGUA de la ruta pasa a ser vado (`ford`) y pasarela (`MA.bridgeList` → DK 2 = E–O, 3 = N–S, que terrain3d ya dibuja
  // como tablones con postes) y la ruta se suaviza (Chaikin) y se guarda como `routes` del bioma de origen (coords locales): world-iso la pinta como camino de tierra (PF).
  const EDGES=[[0,1],[1,2],[2,3],[3,6],[6,7],[7,4],[4,8],[8,5],[0,8],[7,5]],roadG=new Uint8Array(w*h);st.caminos=[];MA.bridgeList=[];
  const co=BIOMES.coast;
  for(const[ka,kb]of EDGES){const A=list[ka],Bq=list[kb];if(!A||!Bq||A.zone||Bq.zone)continue;const s0=cid(MA.anchor[ka]),g0=cid(MA.anchor[kb]);
   const g=new Float32Array(w*h).fill(1e9),prev=new Int32Array(w*h).fill(-1),hp=[],gx=g0%w,gy=(g0-gx)/w;
   const push=e=>{hp.push(e);let i=hp.length-1;while(i>0){const q=(i-1)>>1;if(hp[q][0]<=hp[i][0])break;[hp[q],hp[i]]=[hp[i],hp[q]];i=q}},pop=()=>{const t=hp[0],l=hp.pop();if(hp.length){hp[0]=l;let i=0;for(;;){const a2=2*i+1,b2=a2+1;let m=i;if(a2<hp.length&&hp[a2][0]<hp[m][0])m=a2;if(b2<hp.length&&hp[b2][0]<hp[m][0])m=b2;if(m===i)break;[hp[m],hp[i]]=[hp[i],hp[m]];i=m}}return t};
   g[s0]=0;push([0,s0]);let found=false;
   while(hp.length){const[,c]=pop();if(c===g0){found=true;break}const i=c%w,j=(c-i)/w;
    for(const[di,dj]of[[1,0],[-1,0],[0,1],[0,-1]]){const ni=i+di,nj=j+dj;if(ni<0||nj<0||ni>=w||nj>=h)continue;const nc=nj*w+ni,v=HG[nc];let cost;
     if(v>=1&&v<2)cost=roadG[nc]?.4:1+.35*H(ni,nj,91);else if(v===.75&&co.land(((nc%w)*S)|0,(Math.floor(nc/w)*S)|0))cost=14;else continue;
     const ng=g[c]+cost;if(ng<g[nc]){g[nc]=ng;prev[nc]=c;push([ng+Math.hypot(ni-gx,nj-gy)*.38,nc])}}}
   if(!found){st.caminos.push([ka,kb,'sin ruta']);continue}
   const cells=[];for(let c=g0;c>=0;c=prev[c])cells.push(c);cells.reverse();let nb=0;
   cells.forEach((c,q)=>{roadG[c]=1;if(HG[c]===.75){const pr=cells[Math.max(0,q-1)],nx=cells[Math.min(cells.length-1,q+1)],ddx=Math.abs((nx%w)-(pr%w)),ddy=Math.abs(Math.floor(nx/w)-Math.floor(pr/w));ford[c]=1;n++;nb++;MA.bridgeList.push([c%w,(c-c%w)/w,ddx>=ddy?2:3])}});
   // puntos cada 3 celdas + 2 pasadas de Chaikin → polilínea suave en px de mundo → coords locales del bioma de origen
   let pts=cells.filter((c,q)=>q%3===0||q===cells.length-1).map(c=>[((c%w)+.5)*S*T,(Math.floor(c/w)+.5)*S*T]);
   for(let it=0;it<2;it++){const o=[pts[0]];for(let q=0;q<pts.length-1;q++){const p0=pts[q],p1=pts[q+1];o.push([p0[0]*.75+p1[0]*.25,p0[1]*.75+p1[1]*.25],[p0[0]*.25+p1[0]*.75,p0[1]*.25+p1[1]*.75])}o.push(pts[pts.length-1]);pts=o}
   A.routes.push(pts.map(p=>[Math.round(p[0]-A.ox),Math.round(p[1]-A.oy)]));st.caminos.push([ka,kb,cells.length*S+' tiles',nb+' celdas de puente'])}
  MA.bridgeS=S;
  st.celdasVado=n;if(n||st.caminos.length)TER.reset()}   // las cuadrículas de terreno cacheadas (y los caminos PF) se rehacen con vados, puentes y rutas
 list.forEach((B,k)=>{
  if(B.zone||!B.village||k>8)return;const bb=MA.bbox(k);if(!bb)return;
  const L=B.lay||(B.lay={}),res=B.res||(B.res={}),fa=B.fauna=B.fauna||[],sf=B.village.safe||[B.w/2,B.h/2,700,600];
  // criaturas del bioma (fieras/animales de sus guaridas `ing` y `pack`; sin humanoides de campamento, jefes ni capitanes)
  const ids=[...new Set(['ing','pack'].flatMap(q=>((B.spots||{})[q]||{mobs:[]}).mobs.map(m=>m[0])).filter(id=>!/^[kb]\d/.test(id)))];
  const pois=B.pois||[],n={wc:0,mi:0,fa:0,celdas:0,rect:0,aldea:0,poi:0,mar:0,nada:0};
  const wcT=(res.wc||[]).map((l,z)=>[l,L.wc&&L.wc[z]]).filter(q=>q[1]),miT=(res.mi||[]).map((l,z)=>[l,L.mi&&L.mi[z]]).filter(q=>q[1]);   // plantillas ORIGINALES (se leen antes de añadir)
  const gx0=Math.floor((B.ox+bb.x0)/CP),gx1=Math.ceil((B.ox+bb.x0+bb.w)/CP),gy0=Math.floor((B.oy+bb.y0)/CP),gy1=Math.ceil((B.oy+bb.y0+bb.h)/CP);
  for(let gj=gy0;gj<gy1;gj++)for(let gi=gx0;gi<gx1;gi++){
   n.celdas++;const x0=gi*CP,y0=gj*CP,cx=x0+CP/2+(H(gi,gj,k*7+2)-.5)*CP*.4,cy=y0+CP/2+(H(gi,gj,k*7+3)-.5)*CP*.4;
   if(x0<B.ox+B.w&&x0+CP>B.ox&&y0<B.oy+B.h&&y0+CP>B.oy){n.rect++;continue}                                   // pisa el rectángulo de datos locales: ya tiene su contenido
   const lx=cx-B.ox,ly=cy-B.oy;
   if(Math.abs(lx-sf[0])<sf[2]+600&&Math.abs(ly-sf[1])<sf[3]+600){n.aldea++;continue}                           // junto a la aldea
   if(pois.some(p=>Math.hypot(lx-p.x,ly-p.y)<p.r+380)){n.poi++;continue}                                       // junto a un POI
   const r=H(gi,gj,k*7+1);
   if(r<.34&&wcT.length){const hw=300+H(gi,gj,9)*160;if(!ok(cx,cy,hw*.6,k)){n.mar++;continue}const t=wcT[Math.floor(H(gi,gj,5)*wcT.length)],rc=[lx-hw,lx+hw,ly-hw*.8,ly+hw*.8];
    res.wc.push(t[0].map(([i,m])=>[i,Math.max(4,Math.min(12,Math.round(m*.6)))]));L.wc.push({r:[rc],z:rc});n.wc++}
   else if(r<.49&&miT.length){const hw=170+H(gi,gj,9)*90;if(!ok(cx,cy,hw*.7,k)){n.mar++;continue}const t=miT[Math.floor(H(gi,gj,6)*miT.length)],rc=[lx-hw,lx+hw,ly-hw,ly+hw];
    res.mi.push(t[0].map(([i,m])=>[i,Math.max(2,Math.min(7,Math.round(m*.6)))]));L.mi.push({r:[rc],z:rc});n.mi++}
   else if(r<.75&&ids.length){if(!ok(cx,cy,150,k)){n.mar++;continue}const id=ids[Math.floor(H(gi,gj,7)*ids.length)],c=2+Math.floor(H(gi,gj,8)*2),mobs=[];
    for(let q=0;q<c;q++){const a=H(gi,gj,20+q)*6.283,d=40+H(gi,gj,30+q)*60;mobs.push([id,Math.round(lx+Math.cos(a)*d),Math.round(ly+Math.sin(a)*d)])}
    fa.push({z:[lx-190,lx+190,ly-190,ly+190],mobs,t:'🐾 Tierras salvajes'});n.fa++}else n.nada++}
  st.por[B.n||k]=n});
 // ── PESCA en ríos y lagos del mapa A: una zona `fi` (mismo formato que las del layout) en puntos de agua con cauce hondo y orilla pisable a 40–90 px (lo que exige `fishOk` de game.js), separadas ≥ 380 px, máx. 40 por bioma ──
 {const sp=MA.fishSpots?MA.fishSpots():[],cnt={},last={};st.pesca=cnt;
  const wat=(x,y)=>TER.heightAt(x,y)===.75;
  for(let q=0;q<sp.length;q++){const x=sp[q][0],y=sp[q][1];if(H(x|0,y|0,77)>.3)continue;const k=BIOMES.own(x,y),B=list[k];if(!B||B.zone||k>8||!B.res||!(B.res.fi||[]).length||(cnt[k]||0)>=40)continue;
   if(!(wat(x,y)&&wat(x+14,y)&&wat(x-14,y)&&wat(x,y+12)&&wat(x,y-12)))continue;
   let shore=false;for(const r of[40,64,90]){for(let a=0;a<12&&!shore;a++){if(TER.isLand(TER.heightAt(x+Math.cos(a*.5236)*r,y+Math.sin(a*.5236)*r)))shore=true}if(shore)break}if(!shore)continue;
   const lp=last[k]||(last[k]=[]);if(lp.some(p=>Math.hypot(p[0]-x,p[1]-y)<380))continue;lp.push([x,y]);
   const L=B.lay||(B.lay={}),fi=L.fi||(L.fi=[]),lx=x-B.ox,ly=y-B.oy;B.res.fi.push(B.res.fi[0].map(([i])=>[i,2]));fi.push({z:[lx-170,lx+170,ly-150,ly+150],t:'Río'});cnt[k]=(cnt[k]||0)+1}}
 // ── PUENTE DE PIEDRA ANTIGUO (hito menor de la Pradera; `?bridge=0` lo apaga): se busca en la región de la Pradera un RÍO estrecho (56–190 px de ancho, que sigue a ambos lados) con orilla firme a los dos extremos, lo más cerca posible de la aldea; ──
 // se talla el vado bajo el tablero (`MA.fordAdd`), se pone el modelo `puenteAntiguo` (propsdark_hitos3d.js, gira con `rot` si cruza de N a S) y un hito 🌉 que revela el mapa. Sin colisión propia: el tablero es el vado.
 {const B=list[0],P=BIOMES.tk&&BIOMES.tk.P;if(B&&P&&MA.fordAdd&&B.cen&&!/[?&]bridge=0/.test(location.search)){const c0=B.cen,T2=32,wat=(x,y)=>!TER.isLand(TER.heightAt(x,y)),lnd=(x,y)=>TER.isLand(TER.heightAt(x,y))&&!TER.cliffNear(x,y,14)&&TER.sandAt(Math.floor(x/T2),Math.floor(y/T2))<.5&&!TER.mtnAt(x,y);
   const rect=Object.values(B.spots||{}).map(s=>s.z).filter(Boolean),pois=B.pois||[];let best=null;
   for(let ring=1500;ring<=8000&&!best;ring+=160)for(let a=0;a<72&&!best;a++){const ang=(a*5+(ring/160%5))*Math.PI/180,wx=Math.round(B.ox+c0[0]+Math.cos(ang)*ring),wy=Math.round(B.oy+c0[1]+Math.sin(ang)*ring);
    if(BIOMES.own(wx,wy)!==0||!wat(wx,wy))continue;
    for(const dir of[0,1]){const ax=dir?[0,1]:[1,0],pp=dir?[1,0]:[0,1];let lo=0,hi=0;while(lo>-320&&wat(wx+ax[0]*(lo-8),wy+ax[1]*(lo-8)))lo-=8;while(hi<320&&wat(wx+ax[0]*(hi+8),wy+ax[1]*(hi+8)))hi+=8;
     const run=hi-lo;if(run<56||run>190)continue;const mid=(hi+lo)/2,cx=wx+ax[0]*mid,cy=wy+ax[1]*mid,lx=cx-B.ox,ly=cy-B.oy,e=run/2+70;
     if(!lnd(cx+ax[0]*e,cy+ax[1]*e)||!lnd(cx-ax[0]*e,cy-ax[1]*e))continue;                                   // orilla firme a los dos extremos
     if(!wat(cx+pp[0]*90,cy+pp[1]*90)||!wat(cx-pp[0]*90,cy-pp[1]*90))continue;                                // el río sigue a ambos lados (no es la esquina de un lago)
     if(rect.some(z=>lx>z[0]-170&&lx<z[1]+170&&ly>z[2]-170&&ly<z[3]+170)||pois.some(q=>Math.hypot(q.x-lx,q.y-ly)<420))continue;
     best={cx,cy,lx,ly,dir,run,ax,pp}}}
   if(best){const{cx,cy,lx,ly,dir,run,ax,pp}=best,e=run/2+72;for(let t=-e;t<=e;t+=24)for(let q=-60;q<=60;q+=30)MA.fordAdd(cx+ax[0]*t+pp[0]*q,cy+ax[1]*t+pp[1]*q);
    B.village.props.push(P('puenteAntiguo',Math.round(lx),Math.round(ly),{rot:dir},{keep:1}),P('arbusto',Math.round(lx+ax[0]*(e+40)+pp[0]*70),Math.round(ly+ax[1]*(e+40)+pp[1]*70),null,{keep:1}),P('piedra',Math.round(lx-ax[0]*(e+36)-pp[0]*66),Math.round(ly-ax[1]*(e+36)-pp[1]*66),null,{keep:1}));
    (B.pois||(B.pois=[])).push({id:'LB',k:'hito',n:'Puente de piedra antiguo',em:'🌉',x:Math.round(lx),y:Math.round(ly),r:230,rv:14,tier:1});{const NAT=/^(pino|abedul|roble|fresno|sauce|arce|tejo|ebano|caoba|baobab|ceniza|mundo|arbusto|roca|piedra|arbolSeco|tocon|tronco|seta|cerezo|junco)$/;let cl=0;   // despejar el paso: sin árboles ni rocas sobre el tablero ni en las rampas de acceso
     B.village.props.forEach(q=>{if(q.keep||q._del||!NAT.test(q.n))return;const dx=q.x-lx,dy=q.y-ly,t=dx*ax[0]+dy*ax[1],pr=dx*pp[0]+dy*pp[1];if(Math.abs(t)<run/2+190&&Math.abs(pr)<96){q._del=1;cl++}});st.puenteDespejados=cl}
    // (sin camino de tierra hasta el puente: quitado el 30 oct 2026)
    TER.reset&&TER.reset();st.puente=[Math.round(cx),Math.round(cy),dir,run]}
   else st.puente='sin sitio'}}
 MA.fill=st;st.ms=Math.round(performance.now()-t0);
 console.info('[MAPA A relleno]',JSON.stringify(st.por),st.ms+' ms');
})();
