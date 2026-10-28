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
   dec:[['piedra',-30,10,null,[7,6]],['piedra',34,-8,null,[7,6]]],mobs:()=>[]},
  // E3 (27 oct 2026): MINA abandonada = boca de roca con puntales, carreta y cofre del capataz; los guardias son mineros/humanoides del bioma y junto a la boca hay una VETA extra de su propio bioma (`vein`).
  mina:{w:.18,r:170,vein:1,n:t=>t>1?'Mina profunda':'Mina abandonada',
   dec:[['piedra',-44,-30,null,[7,6]],['piedra',-8,-46,null,[7,6]],['piedra',34,-30,null,[7,6]],['tronco',-30,-4,{len:30}],['tronco',22,-4,{len:30}],['carreta',-70,40,null,[16,10]],['barril',60,34],['caja',44,52],['hoguera',-10,86]],
   mobs:t=>[[-50,60],[60,70],[0,-70],[10,110]].slice(0,2+t)},
  // E3 (27 oct 2026): CUEVA REAL = la BOCA (prop `bocaCueva`: farallón con arco, 3,6×2,4 tiles, hueco hacia el sur) con rocas, setas, huesos y charco + una puerta en el hueco; dentro hay una cueva generada (src/cavegen.js, src/caves.js) con menas del bioma, a veces criaturas y cofre.
  cueva:{w:.2,r:150,cave:1,n:()=>'Cueva',
   dec:[['bocaCueva',0,-42,null,[46,18]],['roca',-92,-8,null,[10,8]],['roca',88,-12,null,[10,8]],['piedra',-70,30,null,[7,6]],['piedra',66,34,null,[7,6]],['seta',-34,44],['seta',36,42],['charco',0,82,{col:'#3a3a2a',water:'#5a6a60'}],['huesos',-48,74]],mobs:()=>[]},
  // E3: ATALAYA = HITO visible desde lejos (columnas, estandarte y fuego). Sin guardias ni cofre: al llegar se descubre y REVELA el mapa de alrededor (E4: orientarse).
  atalaya:{w:.14,r:120,hito:1,n:()=>'Atalaya antigua',
   dec:[['columna',-26,-12,null,[7,7]],['columna',26,-12,null,[7,7]],['columna',0,-34,{broken:1},[7,7]],['estandarte',0,-6,{col:'#6a4a3a'}],['hoguera',0,40],['piedra',-50,30,null,[7,6]],['piedra',48,26,null,[7,6]]],mobs:()=>[]}};
 const KINDS=Object.keys(TPL),WSUM=KINDS.reduce((a,k)=>a+TPL[k].w,0);
 const pick=r=>{let a=r*WSUM;for(const k of KINDS){a-=TPL[k].w;if(a<=0)return k}return KINDS[0]};
 const stats={por:{},tot:0,rech:0};
 function run(){
  if(off||typeof BIOMES==='undefined'||typeof TER==='undefined')return;
  const P=BIOMES.tk&&BIOMES.tk.P;if(!P)return;
  const MA=BIOMES.mapA,ok=(wx,wy,r,k)=>{if(BIOMES.own(wx,wy)<0)return false;if(MA&&BIOMES.own(wx,wy)!==k)return false;   // ?map=A: el POI debe caer en SU región
   for(let a=0;a<8;a++){const x=wx+Math.cos(a*.785)*r,y=wy+Math.sin(a*.785)*r;if(!TER.isLand(TER.tileH(Math.floor(x/T),Math.floor(y/T))))return false}
   const tx=Math.floor(wx/T),ty=Math.floor(wy/T);return TER.isLand(TER.tileH(tx,ty))&&!TER.cliffNear(wx,wy,r*.5)&&TER.sandAt(tx,ty)<.35&&!TER.seaAt(tx,ty)&&!TER.mtnAt(wx,wy)};
  BIOMES.list.forEach((B,k)=>{
   if(B===BIOMES.zone||B.noPoi||!B.village||!B.w||!B.h)return;
   const pois=B.pois||(B.pois=[]),props=B.village.props,ids=ks=>[...new Set(ks.flatMap(q=>((B.spots||{})[q]||{mobs:[]}).mobs.map(m=>m[0])).filter(id=>!/^[kb]\d/.test(id)))],all=ids(Object.keys(B.spots||{})),POOL={camp:ids(['camp','orc','cap']),mina:ids(['camp','orc','cap']),cueva:ids(['pack','ing']),ruina:ids(['pack','ing'])},L=B.lay||{};
   const rects=[];Object.values(B.spots||{}).forEach(s=>rects.push([s.z[0]-90,s.z[1]+90,s.z[2]-90,s.z[3]+90]));
   ['wc','mi','fi'].forEach(t=>(L[t]||[]).forEach(it=>{rects.push([it.z[0]-60,it.z[1]+60,it.z[2]-60,it.z[3]+60])}));
   const sf=B.village.safe||[B.w/2,B.h/2,700,600],core=[B.cen||[B.w/2,B.h/2],B.spawn||[B.w/2,B.h/2],B.bossPos||[B.w/2,B.h/2]];
   const bad=(x,y,r)=>{if(Math.abs(x-sf[0])<sf[2]+700+r&&Math.abs(y-sf[1])<sf[3]+700+r)return true;if(B.bossPos&&Math.hypot(x-B.bossPos[0],y-B.bossPos[1])<900)return true;
    for(const q of rects)if(x>q[0]-r&&x<q[1]+r&&y>q[2]-r&&y<q[3]+r)return true;for(const p of pois)if(Math.hypot(x-p.x,y-p.y)<p.r+r+260)return true;return false};
   const RB=MA&&MA.bbox?MA.bbox(k):null,gx=RB?RB.x0:0,gy=RB?RB.y0:0,GW=RB?RB.w:B.w,GH=RB?RB.h:B.h;   // ?map=A: la rejilla cubre la caja de la REGIÓN (coords locales, pueden ser negativas), no el rectángulo
   const nx=Math.max(1,Math.round(GW/(CELLT*T))),ny=Math.max(1,Math.round(GH/(CELLT*T))),cw=GW/nx,ch=GH/ny,cs=Math.min(cw,ch);let n=0;
   for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
    const kind=pick(H(k*131+i,j,1)),tp=TPL[kind];let put=false;
    for(let a=0;a<6&&!put;a++){const lx=gx+(i+.15+H(k*131+i,j,10+a)*.7)*cw,ly=gy+(j+.15+H(k*131+i,j,30+a)*.7)*ch;
     if(bad(lx,ly,tp.r)||!ok(B.ox+lx,B.oy+ly,Math.min(tp.r,110),k))continue;
     const dv=Math.hypot(lx-sf[0],ly-sf[1]),tier=dv>cs*1.7?2:1,id='g'+i+'_'+j,p={id,k:kind==='ruina'||kind==='mina'?'cofre':kind==='atalaya'?'hito':kind,n:tp.n(tier),x:Math.round(lx),y:Math.round(ly),r:tp.r,tier};
     const pool=(POOL[kind]&&POOL[kind].length?POOL[kind]:all);if(tp.mobs&&pool.length){const sl=tp.mobs(tier);if(sl.length)p.mobs=sl.map(([dx,dy],m)=>[pool[Math.floor(H(k*131+i,j,50+m)*pool.length)],dx,dy])}   // campamentos: guardias humanoides; ruinas: fieras
     if(tp.cave){const rr=H(k*131+i,j,90),ty=rr<.35?'tranquila':rr<.8||tier<2?'guarida':'profunda',small=k===0,ch=small?(ty==='profunda'?3:2):(ty==='profunda'?5:3+Math.floor(H(k*131+i,j,91)*2)),mi=((B.res||{}).mi||[]).flat().map(a=>a[0]);   // Pradera: cuevas pequeñas (2–3 cámaras, 38×32); el resto 3–5 cámaras
      p.cave={seed:1000+k*977+i*31+j*7,type:ty,ch,W:small?38:ty==='profunda'?64:56,H:small?32:ty==='profunda'?52:46,r0:small?5.2:6.5,ores:[...new Set(mi)],mobs:ids(['pack','ing','camp','orc','cap'])};p.n=CAVEGEN.TYPES[ty].nm;stats.cuevas=(stats.cuevas||0)+1}
     if(tp.vein){const mt=((B.res||{}).mi||[]),lt=L.mi||[];if(mt.length&&lt.length){const q=Math.floor(H(k*131+i,j,70)*mt.length),rc=[p.x-110,p.x+110,p.y+10,p.y+190];if(lt[q]){B.res.mi.push(mt[q].map(([a,m])=>[a,Math.max(2,Math.min(6,Math.round(m*.5)))]));L.mi.push({r:[rc],z:rc});stats.vetas=(stats.vetas||0)+1}}}   // veta del propio bioma pegada a la boca (misma plantilla que sus vetas; game.js la siembra en res.mi/lay.mi)
     pois.push(p);tp.dec.forEach(([nm,dx,dy,o,fp])=>props.push(P(nm,p.x+dx,p.y+dy,o||null,fp?{fp}:undefined)));put=true;n++}
    if(!put)stats.rech++}
   stats.por[B.n||k]=n;stats.tot+=n});
  console.info('[POIGEN]',stats)}
 try{run()}catch(e){console.warn('[POIGEN] falló:',e)}
 return{TPL,stats,run}})();
