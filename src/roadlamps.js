// NotScape · Lote R3D-LUZ · FAROLES EN LOS CAMINOS. Corre tras seams.js y antes de props.js: añade farolas (lamp:1) a B.village.props a lo largo de B.routes,
// fuera del núcleo de la aldea (que ya trae las suyas), alternando lados. Datos: BIOMES.list[k].routes (puntos LOCALES). `?roadlamps=0` lo apaga.
(function(){
 const G=typeof globalThis!=='undefined'?globalThis:window;
 if(typeof BIOMES==='undefined'||/[?&]roadlamps=0/.test(typeof location!=='undefined'?location.search:''))return;
 const GAP=520,SIDE=46,CORE=950,MAXB=70,st=G.ROADLAMPS={n:0,perBiome:[]};
 BIOMES.list.forEach((B,k)=>{if(!B.routes||!B.village||!B.village.props)return;
  const c=B.cen||[B.w/2,B.h/2],out=[];let side=1;
  B.routes.forEach(r=>{let acc=GAP*.5;
   for(let i=0;i<r.length-1;i++){const a=r[i],b=r[i+1],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy);if(L<1)continue;const nx=-dy/L,ny=dx/L;
    for(let s=GAP-acc;s<=L;s+=GAP){const x=a[0]+dx*s/L+nx*SIDE*side,y=a[1]+dy*s/L+ny*SIDE*side;side=-side;
     if(Math.hypot(x-c[0],y-c[1])<CORE||x<80||y<80||x>B.w-80||y>B.h-80)continue;
     if(out.some(q=>Math.hypot(q[0]-x,q[1]-y)<GAP*.6))continue;   // rutas que se cruzan o se repiten
     out.push([Math.round(x),Math.round(y)])}
    acc=(acc+L)%GAP}});
  out.slice(0,MAXB).forEach(q=>B.village.props.push({n:'farola',x:q[0],y:q[1],fp:[3,3],lamp:1,_road:1}));st.perBiome[k]=Math.min(out.length,MAXB);st.n+=st.perBiome[k]});
})();
