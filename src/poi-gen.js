// NotScape · E3 (26 oct 2026) · GENERADOR DE PUNTOS DE INTERÉS POR PLANTILLAS DE DATOS.
// Se carga tras world-iso.js y ANTES de game.js (que lee `B.pois` y `B.village.props`). Reparte campamentos, ruinas y cofres por cada bioma con una rejilla de ~150×150 tiles
// (a K=6 ≈ 22 por bioma; a K=2 solo unos pocos): una celda = 1 candidato con jitter DETERMINISTA (hash, nunca Math.random) que se descarta si cae en agua, playa, acantilado, montaña,
// cerca de la aldea, del jefe, de una guarida/zona de recurso o de otro POI. Los POI hechos a mano (Pradera) se respetan. `?poi=0` lo apaga; `?poicell=N` cambia el lado de la celda (tiles).
// Para añadir un tipo: una fila en `TPL` (peso, radio, decorado y guardias como datos). Los guardias salen de los mobs de las guaridas del propio bioma (nada de ids fijos por bioma).
const POIGEN=(()=>{
 const qs=location.search,off=/[?&]poi=0/.test(qs),cm=/[?&]poicell=(\d+)/.exec(qs),CELLT=cm?+cm[1]:150,T=32;
 const H=(a,b,c)=>{let h=(Math.imul(a|0,374761393)+Math.imul(b|0,668265263)+Math.imul(c|0,2147483647))|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};
 // Plantillas. dec = [prop, dx, dy, opciones, huella]; el decorado y los guardias van en px relativos al centro del POI.
 const TPL={
  camp:{w:.3,r:210,n:t=>t>1?'Campamento fortificado':'Campamento',
   dec:[['hoguera',0,34],['carpa',-70,-6,{col:'#8a5a38'},[10,10]],['carpa',64,-14,{col:'#6a5a3a'},[10,10]],['estandarte',-26,-52,{col:'#6a4a3a'}],['estandarte',44,-60,{col:'#6a4a3a'}],['barril',-48,46],['caja',58,40],['tronco',-20,86,{len:26}],['huesos',24,76]],
   mobs:t=>[[-60,70],[70,60],[10,-40],[0,100],[-90,-30]].slice(0,2+t)},
  ruina:{w:.3,r:150,n:()=>'Ruinas olvidadas',
   dec:[['columna',-50,-20,{broken:1},[7,7]],['columna',46,-26,null,[7,7]],['columna',-24,44,{broken:1},[7,7]],['muroRuina',10,60,{len:40},[29,4]],['lapida',60,36,null,[6,3]],['huesos',-70,40]],
   mobs:t=>[[0,-60],[40,50]].slice(0,t)},
  cofre:{w:.4,r:90,n:()=>'Cofre escondido',
   dec:[['piedra',-30,10,null,[7,6]],['piedra',34,-8,null,[7,6]]],mobs:()=>[]}};
 const KINDS=Object.keys(TPL),WSUM=KINDS.reduce((a,k)=>a+TPL[k].w,0);
 const pick=r=>{let a=r*WSUM;for(const k of KINDS){a-=TPL[k].w;if(a<=0)return k}return KINDS[0]};
 const stats={por:{},tot:0,rech:0};
 function run(){
  if(off||typeof BIOMES==='undefined'||typeof TER==='undefined')return;
  const P=BIOMES.tk&&BIOMES.tk.P;if(!P)return;
  const ok=(wx,wy,r)=>{if(BIOMES.own(wx,wy)<0)return false;for(let a=0;a<8;a++){const x=wx+Math.cos(a*.785)*r,y=wy+Math.sin(a*.785)*r;if(!TER.isLand(TER.tileH(Math.floor(x/T),Math.floor(y/T))))return false}
   const tx=Math.floor(wx/T),ty=Math.floor(wy/T);return TER.isLand(TER.tileH(tx,ty))&&!TER.cliffNear(wx,wy,r*.5)&&TER.sandAt(tx,ty)<.35&&!TER.seaAt(tx,ty)&&!TER.mtnAt(wx,wy)};
  BIOMES.list.forEach((B,k)=>{
   if(B===BIOMES.zone||B.noPoi||!B.village||!B.w||!B.h)return;
   const pois=B.pois||(B.pois=[]),props=B.village.props,ids=ks=>[...new Set(ks.flatMap(q=>((B.spots||{})[q]||{mobs:[]}).mobs.map(m=>m[0])).filter(id=>!/^[kb]\d/.test(id)))],all=ids(Object.keys(B.spots||{})),POOL={camp:ids(['camp','orc','cap']),ruina:ids(['pack','ing'])},L=B.lay||{};
   const rects=[];Object.values(B.spots||{}).forEach(s=>rects.push([s.z[0]-90,s.z[1]+90,s.z[2]-90,s.z[3]+90]));
   ['wc','mi','fi'].forEach(t=>(L[t]||[]).forEach(it=>{rects.push([it.z[0]-60,it.z[1]+60,it.z[2]-60,it.z[3]+60])}));
   const sf=B.village.safe||[B.w/2,B.h/2,700,600],core=[B.cen||[B.w/2,B.h/2],B.spawn||[B.w/2,B.h/2],B.bossPos||[B.w/2,B.h/2]];
   const bad=(x,y,r)=>{if(Math.abs(x-sf[0])<sf[2]+700+r&&Math.abs(y-sf[1])<sf[3]+700+r)return true;if(B.bossPos&&Math.hypot(x-B.bossPos[0],y-B.bossPos[1])<900)return true;
    for(const q of rects)if(x>q[0]-r&&x<q[1]+r&&y>q[2]-r&&y<q[3]+r)return true;for(const p of pois)if(Math.hypot(x-p.x,y-p.y)<p.r+r+260)return true;return false};
   const nx=Math.max(1,Math.round(B.w/(CELLT*T))),ny=Math.max(1,Math.round(B.h/(CELLT*T))),cw=B.w/nx,ch=B.h/ny,cs=Math.min(cw,ch);let n=0;
   for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
    const kind=pick(H(k*131+i,j,1)),tp=TPL[kind];let put=false;
    for(let a=0;a<6&&!put;a++){const lx=(i+.15+H(k*131+i,j,10+a)*.7)*cw,ly=(j+.15+H(k*131+i,j,30+a)*.7)*ch;
     if(bad(lx,ly,tp.r)||!ok(B.ox+lx,B.oy+ly,Math.min(tp.r,110)))continue;
     const dv=Math.hypot(lx-sf[0],ly-sf[1]),tier=dv>cs*1.7?2:1,id='g'+i+'_'+j,p={id,k:kind==='ruina'?'cofre':kind,n:tp.n(tier),x:Math.round(lx),y:Math.round(ly),r:tp.r,tier};
     const pool=(POOL[kind]&&POOL[kind].length?POOL[kind]:all);if(tp.mobs&&pool.length){const sl=tp.mobs(tier);if(sl.length)p.mobs=sl.map(([dx,dy],m)=>[pool[Math.floor(H(k*131+i,j,50+m)*pool.length)],dx,dy])}   // campamentos: guardias humanoides; ruinas: fieras
     pois.push(p);tp.dec.forEach(([nm,dx,dy,o,fp])=>props.push(P(nm,p.x+dx,p.y+dy,o||null,fp?{fp}:undefined)));put=true;n++}
    if(!put)stats.rech++}
   stats.por[B.n||k]=n;stats.tot+=n});
  console.info('[POIGEN]',stats)}
 try{run()}catch(e){console.warn('[POIGEN] falló:',e)}
 return{TPL,stats,run}})();
