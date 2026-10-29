// NotScape · ESTABLO EN CADA ALDEA (lote DOMAR-CIERRE, 29 oct 2026). Se carga DESPUÉS de village-barrios.js. Añade la estación exterior `establo` (ya existe en la Pradera por `sadd`) a las aldeas que no la tienen:
// busca, alrededor del banco, el primer hueco libre (lejos de edificios, estaciones y calles). Su modelo 3D usa la paleta/cultura del bioma (`arch`), así que cada aldea lo ve distinto. `?establo=0` lo apaga.
(function(G){
 if(typeof BIOMES==='undefined'||/[?&]establo=0\b/.test(location.search))return;
 const segD=(px,py,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((px-a[0])*dx+(py-a[1])*dy)/l));return Math.hypot(px-a[0]-dx*t,py-a[1]-dy*t)};
 BIOMES.list.forEach((B,k)=>{const V=B&&B.village;if(!V||!V.stations||V.stations.some(s=>s[0]==='establo'))return;const org=V.stations.find(s=>s[0]==='bank')||V.stations[0];if(!org)return;
  const ok=(x,y)=>{
   if(V.stations.some(s=>Math.hypot(s[2]-x,s[3]-y)<130))return false;
   for(const p of V.props){const fp=p.fp,r=fp?Math.max(fp[0],fp[1])/2+78:46;if(Math.hypot(p.x-x,p.y-y)<r)return false}
   for(const c of (V.cobs||[])){for(let i=0;i<c.p.length-1;i++)if(segD(x,y,c.p[i],c.p[i+1])<(c.w||40)+90)return false}
   for(const q of (V.plaza||[])){if(Math.hypot(q[0]-x,q[1]-y)<q[2]+110)return false}
   return true};
  for(let r=230;r<=620;r+=45)for(let a=0;a<360;a+=15){const x=Math.round(org[2]+Math.cos(a*Math.PI/180)*r),y=Math.round(org[3]+Math.sin(a*Math.PI/180)*r);if(ok(x,y)){V.stations.push(['establo','Establo',x,y]);return}}
  if(G.console)console.warn('[establo] sin hueco en la aldea',k)});
})(typeof window!=='undefined'?window:globalThis);
