// NotScape · E3 (27 oct 2026) · CUEVAS REALES · generador de la PLANTA y del CONTENIDO de una cueva a partir de una semilla (módulo PURO, navegador y Node; sin DOM ni three).
// Una cueva es una rejilla de W×H celdas de 1 tile (32 px de mundo): `mask[i]=1` es suelo. Se compone de 2–6 CÁMARAS (blobs con contorno irregular) unidas por PASILLOS estrechos y un
// túnel de entrada que sale por el borde sur de la rejilla (por donde se entra y se sale). Todo es determinista (hash, nunca Math.random): la misma semilla da la misma cueva.
// Devuelve además dónde van las menas, los enemigos, el cofre, las luces (cristales/antorchas) y la decoración (estalagmitas, rocas). Lo consume `src/caves.js` (lógica) y `src/r3d/cave3d.js` (malla).
// TIPOS: 'tranquila' (sin enemigos, más menas) · 'guarida' (enemigos + menas + cofre) · 'profunda' (más cámaras, un élite, menas de más tier, cofre). Cueva nueva = una fila en `TYPES`.
const CAVEGEN=(()=>{
 const H=(a,b,c)=>{let h=(Math.imul(a|0,374761393)+Math.imul(b|0,668265263)+Math.imul(c|0,2147483647))|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};
 const TYPES={
  tranquila:{nm:'Cueva',mobs:[0,0],ore:[9,13],chest:0,elite:0,light:1},
  guarida:{nm:'Guarida',mobs:[5,8],ore:[4,7],chest:1,elite:0,light:.7},
  profunda:{nm:'Cueva profunda',mobs:[5,8],ore:[8,12],chest:1,elite:1,light:.55}};
 function gen(seed,o){
  o=o||{};const type=TYPES[o.type]?o.type:'tranquila',TY=TYPES[type],W=o.W||52,Hh=o.H||44,nc=o.ch||3,mask=new Uint8Array(W*Hh),at=(x,y)=>x>=0&&y>=0&&x<W&&y<Hh?mask[y*W+x]:0;
  const cham=[];
  // 1 · cámaras: la de la entrada abajo-centro, las demás repartidas con separación mínima
  const R0=o.r0||6.5;cham.push({x:W*.5+(H(seed,1,1)-.5)*8,y:Hh-R0-6,r:R0*.9});
  for(let i=1;i<nc;i++){let best=null;for(let a=0;a<60&&!best;a++){const r=R0*(.85+H(seed,i,20+a)*.55),x=r+4+H(seed,i,40+a)*(W-2*r-8),y=r+4+H(seed,i,60+a)*(Hh-2*r-24);if(cham.every(c=>Math.hypot(c.x-x,c.y-y)>c.r+r+(o.gap||5)))best={x,y,r}}if(!best){const c=cham[cham.length-1];best={x:Math.max(8,Math.min(W-8,c.x+(i%2?-1:1)*14)),y:Math.max(8,c.y-14),r:R0*.8}}cham.push(best)}
  const carve=(cx,cy,r,w)=>{for(let y=Math.floor(cy-r-2);y<=Math.ceil(cy+r+2);y++)for(let x=Math.floor(cx-r-2);x<=Math.ceil(cx+r+2);x++){if(x<2||y<2||x>W-3||y>Hh-3)continue;const dx=x+.5-cx,dy=y+.5-cy,an=Math.atan2(dy,dx),rr=r*(1+.2*Math.sin(an*3+w)+.1*Math.sin(an*5+w*1.7)+.06*Math.sin(an*8+w*.6));if(Math.hypot(dx,dy)<rr)mask[y*W+x]=1}};
  cham.forEach((c,i)=>carve(c.x,c.y,c.r,seed*.37+i*2.1));
  // 2 · pasillos: cada cámara se une con la más cercana de las anteriores (árbol) y, en las grandes, una vuelta extra
  const tun=(a,b,k)=>{const mx=(a.x+b.x)/2+(H(seed,k,3)-.5)*10,my=(a.y+b.y)/2+(H(seed,k,4)-.5)*10,steps=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)*1.5);for(let s=0;s<=steps;s++){const t=s/steps,u=1-t,x=u*u*a.x+2*u*t*mx+t*t*b.x,y=u*u*a.y+2*u*t*my+t*t*b.y;carve(x,y,1.55+.35*Math.sin(s*.5+k),k*1.3)}};
  for(let i=1;i<nc;i++){let bj=0,bd=1e9;for(let j=0;j<i;j++){const d=Math.hypot(cham[i].x-cham[j].x,cham[i].y-cham[j].y);if(d<bd){bd=d;bj=j}}tun(cham[bj],cham[i],i)}
  if(nc>=4)tun(cham[1],cham[nc-1],40);
  // 3 · túnel de entrada: de la cámara 0 hacia el sur hasta el borde
  const ex=Math.round(cham[0].x),ey0=Math.round(cham[0].y+cham[0].r*.6);for(let y=ey0;y<Hh-1;y++)carve(ex+Math.sin(y*.4+seed)*.6,y,1.6,y*.2);
  const ent={x:ex,y:Hh-3};   // celda de la salida
  // 4 · distancia a la pared (chaflán 3-4) y celdas útiles
  const D=new Float32Array(W*Hh).fill(99);for(let i=0;i<W*Hh;i++)if(!mask[i])D[i]=0;
  const pass=(x0,x1,dx,y0,y1,dy,nb)=>{for(let y=y0;y!==y1;y+=dy)for(let x=x0;x!==x1;x+=dx){const i=y*W+x;for(const[ox,oy,c]of nb){const xx=x+ox,yy=y+oy;if(xx<0||yy<0||xx>=W||yy>=Hh)continue;const v=D[yy*W+xx]+c;if(v<D[i])D[i]=v}}};
  pass(0,W,1,0,Hh,1,[[-1,0,1],[0,-1,1],[-1,-1,1.41],[1,-1,1.41]]);pass(W-1,-1,-1,Hh-1,-1,-1,[[1,0,1],[0,1,1],[1,1,1.41],[-1,1,1.41]]);
  // cámara de cada celda (la más cercana), para repartir el contenido
  const owner=(x,y)=>{let b=0,bd=1e9;cham.forEach((c,i)=>{const d=Math.hypot(c.x-x,c.y-y)/c.r;if(d<bd){bd=d;b=i}});return b};
  const spawn={x:ex,y:Hh-6.5},far=cham.slice(1).reduce((m,c,i)=>{const d=Math.hypot(c.x-spawn.x,c.y-spawn.y);return d>m.d?{d,i:i+1}:m},{d:-1,i:Math.min(1,nc-1)}).i;
  // 5 · contenido: candidatos por hash, con separación mínima
  const cells=[];for(let y=2;y<Hh-2;y++)for(let x=2;x<W-2;x++)if(mask[y*W+x])cells.push([x,y]);
  const picked=[],pick=(salt,n,ok,sep)=>{const out=[],ord=cells.map(([x,y],i)=>[H(seed+salt,x,y),x,y]).sort((a,b)=>a[0]-b[0]);for(const[,x,y]of ord){if(out.length>=n)break;if(!ok(x,y))continue;const px=x+.5,py=y+.5;if(out.some(q=>Math.hypot(q.x-px,q.y-py)<sep))continue;if(picked.some(q=>Math.hypot(q.x-px,q.y-py)<2.2))continue;const p={x:px,y:py,c:owner(px,py)};out.push(p);picked.push(p)}return out};
  const nOre=Math.round(TY.ore[0]+H(seed,9,9)*(TY.ore[1]-TY.ore[0])),nMob=Math.round(TY.mobs[0]+H(seed,8,8)*(TY.mobs[1]-TY.mobs[0]));
  const chest=TY.chest?pick(7,1,(x,y)=>owner(x+.5,y+.5)===far&&D[y*W+x]>=2.4,1)[0]||null:null;
  const mobs=nMob?pick(11,nMob,(x,y)=>D[y*W+x]>=2&&Math.hypot(x+.5-spawn.x,y+.5-spawn.y)>11&&owner(x+.5,y+.5)>0,3.2):[];
  if(TY.elite&&mobs.length){const c=cham[far],m=mobs.reduce((b,q)=>Math.hypot(q.x-c.x,q.y-c.y)<Math.hypot(b.x-c.x,b.y-c.y)?q:b,mobs[0]);m.elite=1}
  // MENAS EN LA PARED (Lote CUEVAS-DOFUS): solo en celdas pegadas a la roca; `wx,wz` = dirección unitaria HACIA la pared, y el nodo se adelanta .3 hacia ella
  const sol=(x,y)=>x<0||y<0||x>=W||y>=Hh||!mask[y*W+x];
  const ores=pick(13,nOre,(x,y)=>D[y*W+x]>=1&&D[y*W+x]<=1.45&&(sol(x-1,y)||sol(x+1,y)||sol(x,y-1)||sol(x,y+1))&&Math.hypot(x+.5-spawn.x,y+.5-spawn.y)>7,2.6);
  for(const q of ores){let vx=0,vz=0;for(const[ox,oy]of[[-1,0],[1,0],[0,-1],[0,1]])if(sol(Math.floor(q.x)+ox,Math.floor(q.y)+oy)){vx+=ox;vz+=oy}const l=Math.hypot(vx,vz)||1;q.wx=vx/l;q.wz=vz/l;q.x+=q.wx*.3;q.y+=q.wz*.3}
  // luces: cristales/setas/antorchas pegadas a la pared; decoración: estalagmitas y rocas
  const nL=Math.max(5,Math.round(cells.length/(36/(TY.light+.25)))),lights=pick(17,nL,(x,y)=>D[y*W+x]>=1&&D[y*W+x]<=1.8,5.5).map((p,i)=>(p.k=H(seed,i,5)<.3?'seta':'cristal',p));
  const deco=[];for(let i=0;i<cells.length&&deco.length<Math.round(cells.length*.07);i++){const[x,y]=cells[Math.floor(H(seed,i,77)*cells.length)];if(D[y*W+x]<=1.6&&Math.hypot(x+.5-spawn.x,y+.5-spawn.y)>3)deco.push({x:x+.15+H(seed,x,y)*.7,y:y+.15+H(seed,y,x)*.7,k:H(seed,x,y+9)<.62?'estalagmita':'roca',s:.6+H(seed,y,x+3)*.9})}
  return{seed,type,nm:TY.nm,W,H:Hh,mask,cham,ent,spawn,chest,mobs,ores,lights,deco,floor:cells.length,D,TY}}
 return{gen,TYPES,H}})();
if(typeof module!=='undefined')module.exports=CAVEGEN;
