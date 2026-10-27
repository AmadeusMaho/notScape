// NotScape · FASE 3·e / E-MAPA paso 1 (26 oct 2026) · SILUETA DEL CONTINENTE «mapa antiguo A vertical» como DATOS.
// Fuente de verdad visual: docs/style-reference/mapa_antiguo_A.html (mismas bolas BL/ISL, mismo umbral con ruido, mismas semillas de bioma). Aquí se reproduce a escala de TILES.
// Módulo PURO (sin DOM, sin globales del juego): sirve en el navegador (`CONT`) y en Node (`require`). NO lo usa todavía el juego: es el paso 1 (la máscara y el reparto
// de biomas); el paso 2 conectará `coast.js` y `biomeOf/ownerOf` a esta máscara cuando se reubiquen los biomas.
// API:
//   CONT.build({tpp, cell}) → {w, h, cell, tiles:{w,h}, land:Uint8Array (1 tierra firme, 2 isla, 0 mar), bio:Uint8Array (0 mar · 1..9 bioma de referencia · 10 isla), stats}
//   CONT.GAME[idRef] → índice de bioma del juego (0 Pradera · 1 Bosque · 2 Pantano · 3 Cumbres · 4 Oriental · 5 Volcán · 6 Páramo · 7 Desierto · 8 Costa)
//   CONT.NAMES[idRef] → nombre
// `tpp` = tiles por píxel del mapa de referencia (4,34 → mundo ≈ 2951×3494 tiles, la meta K=6 medida SOLO sobre tierra firme); `cell` = tiles por celda de la rejilla (8 por defecto).
// Determinista: ruido por hash entero, sin Math.random.
(function(root){
 const REF_W=680,REF_H=805,X0=50,Y0=45,CW=165,CH=145;
 const BL=[[1.5,.45,.5],[1.3,.8,.4],[1.8,.8,.35],[1.9,1.3,.5],[1.6,1.6,.4],[.6,1.4,.3],[.65,1.9,.32],[.75,2.4,.32],[.8,2.9,.3],[.85,3.3,.28],[2.55,1.1,.3],[2.8,1.35,.28],[2.7,1.75,.22],[2.3,1.2,.28],[1.5,2.3,.5],[1.9,2.4,.42],[2.4,2.8,.4],[2.6,3.1,.28],[1.1,2.0,.3],[1.6,3.5,.5],[1.3,3.8,.35],[2.0,3.7,.4],[.7,3.8,.33],[.5,4.2,.25],[.3,4.55,.18],[1.0,3.7,.28],[1.5,4.4,.38],[1.7,4.8,.3],[1.9,5.0,.2]];
 const ISL=[[3.0,3.55,.17],[3.3,3.75,.15],[3.15,4.15,.19],[3.5,4.3,.16],[2.85,4.4,.14],[3.55,3.35,.14],[2.6,3.95,.14],[3.35,4.75,.15],[3.55,2.1,.15],[3.35,2.65,.14],[3.75,2.85,.13],[2.3,.3,.15],[2.95,.55,.16],[1.0,.2,.14],[.2,1.05,.15],[.08,2.0,.14],[.15,3.15,.16],[.02,4.0,.15],[.15,4.9,.16],[.65,5.0,.14],[1.05,5.1,.15],[2.4,5.1,.14],[2.3,4.6,.16],[3.2,1.0,.14],[3.55,1.4,.13],[2.0,.1,.13],[.15,4.6,.14],[.9,4.75,.13]];
 // semillas de bioma [id de referencia, u, v]: el bioma de un punto es el de la semilla más cercana tras deformar (u,v) con ruido
 const SEED=[[5,1.5,.6],[2,1.9,1.7],[2,1.7,1.4],[2,2.1,1.9],[4,.65,1.5],[4,.7,2.15],[4,.8,2.65],[7,2.7,1.4],[3,1.7,2.4],[1,2.45,3.0],[1,2.55,3.35],[1,2.3,2.55],[6,1.65,3.65],[6,1.15,3.3],[8,.55,4.0],[8,.4,4.4],[9,1.6,4.6]];
 const NAMES=['Mar','Pradera','Bosque','Pantano','Cumbres','Páramo Arcano','Desierto','Oriental','Costa de las Tormentas','Volcán','Islas (Costa)'];
 const GAME=[-1,0,1,2,3,6,7,4,8,5,8];
 // ruido de valor, idéntico al de la referencia (misma función hash → misma silueta)
 const hs=(x,y)=>{let h=Math.imul(x,374761393)+Math.imul(y,668265263);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967295};
 const vn=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,sx=xf*xf*(3-2*xf),sy=yf*yf*(3-2*yf),a=hs(xi,yi),b=hs(xi+1,yi),c=hs(xi,yi+1),d=hs(xi+1,yi+1);return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy};
 const fb=(x,y)=>vn(x,y)*.6+vn(x*2.1,y*2.1)*.3+vn(x*4.3,y*4.3)*.1;
 const field=(L,u,v)=>{let s=0;for(let i=0;i<L.length;i++){const b=L[i],dx=u-b[0],dy=v-b[1];s+=Math.pow(b[2]*b[2]/(dx*dx+dy*dy+.015),1.8)}return s};
 function build(o){
  o=o||{};const tpp=o.tpp||4.34,cell=o.cell||8,t0=typeof performance!=='undefined'?performance.now():Date.now();
  const tw=Math.round(REF_W*tpp),th=Math.round(REF_H*tpp),w=Math.ceil(tw/cell),h=Math.ceil(th/cell),land=new Uint8Array(w*h),bio=new Uint8Array(w*h),cnt=new Float64Array(11);
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){
   const bx=(i+.5)*cell/tpp,by=(j+.5)*cell/tpp,u=(bx-X0)/CW,v=(by-Y0)/CH,
    thr=1+(fb(bx/30,by/30)-.5)*1.1+(fb(bx/110+5,by/110+9)-.5)*.7,f=field(BL,u,v);
   let id=0,l=0;
   if(f>thr){l=1;const wu=u+(fb(bx/70+7,by/70+3)-.5)*.5,wv=v+(fb(bx/70+31,by/70+19)-.5)*.5;let best=1e9;id=1;
    for(let s=0;s<SEED.length;s++){const dx=wu-SEED[s][1],dy=wv-SEED[s][2],d=dx*dx+dy*dy;if(d<best){best=d;id=SEED[s][0]}}}
   else if(field(ISL,u,v)>thr*1.02){l=2;id=10}
   land[j*w+i]=l;bio[j*w+i]=id;cnt[id]++}
  const mainTiles=(cnt.reduce((a,b,k)=>k>0&&k<10?a+b:a,0))*cell*cell,st={ms:Math.round((typeof performance!=='undefined'?performance.now():Date.now())-t0),mainLandTiles:mainTiles,islandTiles:cnt[10]*cell*cell,byBiome:{}};
  for(let k=1;k<=10;k++)st.byBiome[NAMES[k]]={tiles:cnt[k]*cell*cell,pct:+(100*cnt[k]/Math.max(1,cnt.reduce((a,b,q)=>q>0?a+b:a,0))).toFixed(1)};
  return{w,h,cell,tpp,tiles:{w:tw,h:th},land,bio,stats:st};
 }
 const API={build,GAME,NAMES,REF_W,REF_H};
 if(typeof module!=='undefined'&&module.exports)module.exports=API;else root.CONT=API;
})(typeof window!=='undefined'?window:globalThis);
