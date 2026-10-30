// NotScape · E3 (26 oct 2026) · GENERADOR DE PUNTOS DE INTERÉS POR PLANTILLAS DE DATOS.
// Se carga tras world-iso.js y ANTES de game.js (que lee `B.pois` y `B.village.props`). Reparte campamentos, ruinas y cofres por cada bioma con una rejilla de ~150×150 tiles
// (a K=6 ≈ 22 por bioma; a K=2 solo unos pocos): una celda = 1 candidato con jitter DETERMINISTA (hash, nunca Math.random) que se descarta si cae en agua, playa, acantilado, montaña,
// cerca de la aldea, del jefe, de una guarida/zona de recurso o de otro POI. Los POI hechos a mano (Pradera) se respetan. `?poi=0` lo apaga; `?poicell=N` cambia el lado de la celda (tiles).
// Para añadir un tipo: una fila en `TPL` (peso, radio, decorado y guardias como datos). Los guardias salen de los mobs de las guaridas del propio bioma (nada de ids fijos por bioma).
const POIGEN=(()=>{
 const qs=location.search,off=/[?&]poi=0/.test(qs),cm=/[?&]poicell=(\d+)/.exec(qs),CELLT=cm?+cm[1]:150,em=/[?&]evcell=(\d+)/.exec(qs),EVCELL=em?+em[1]:72,T=32;   // EVCELL: lado (tiles) de la rejilla fina de DESCUBRIMIENTOS (mundo interactivo, src/discoveries.js)
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
 // MUNDO INTERACTIVO (30 oct 2026): DESCUBRIMIENTOS de tier 1 (`ev:1`, w:0 = no salen en la rejilla grande; los coloca una 2.ª pasada FINA, ver `EVCELL`). El PO (modelo + uso) lo crea src/discoveries.js; aquí solo va el decorado.
 Object.assign(TPL,{
  fuente:{w:0,r:70,ev:1,ew:.3,n:()=>'Pozo de aguas claras',dec:[['piedra',-44,14,null,[7,6]],['arbusto',40,24],['piedra',30,-30,null,[7,6]]],mobs:()=>[]},
  totem:{w:0,r:70,ev:1,ew:.22,n:()=>'Tótem del viajero',dec:[['piedra',-36,22,null,[7,6]],['piedra',40,16,null,[7,6]],['hoguera',0,56]],mobs:()=>[]},
  monolito:{w:0,r:80,ev:1,ew:.26,n:()=>'Monolito rúnico',dec:[['columna',-42,6,{broken:1},[7,7]],['columna',44,10,null,[7,7]],['piedra',0,52,null,[7,6]]],mobs:()=>[]},
  caravana:{w:0,r:90,ev:1,ew:.22,n:()=>'Caravana saqueada',dec:[['barril',-46,26],['caja',40,34],['huesos',-18,-46],['tronco',54,-22,{len:22}]],mobs:()=>[]}});
 // Sabor por civilización (índice de bioma → props extra que se suman al decorado de cada descubrimiento; la paleta ya la pone el tema del bioma): bosque con setas, pantano con tótems, oriental con estandartes, volcán/desierto con huesos y rocas, Páramo con columnas rotas, Costa con aparejos.
 const FLAV={1:[['seta',-30,40],['seta',38,34],['tocon',-56,-10]],2:[['totem',62,-6],['seta',-40,36]],3:[['roca',-62,20,null,[10,8]],['roca',58,-24,null,[10,8]]],4:[['estandarte',52,-30,{col:'#8a2a2a'}],['estandarte',-52,-26,{col:'#8a2a2a'}]],5:[['huesos',-30,42],['roca',54,22,null,[10,8]]],6:[['columna',58,0,{broken:1},[7,7]],['seta',-34,40]],7:[['huesos',-30,32],['roca',52,22,null,[10,8]]],8:[['barril',-40,36],['tronco',54,30,{len:20}]]};
 // MUNDO-HITOS (30 oct 2026): HITOS GRANDES (`lm:1`, w:0): estructuras únicas y altas (src/r3d/propsdark_hitos3d.js) que se colocan UNA vez por bioma en una dirección y distancia fijas desde la aldea (`LANDM`: [plantilla, ángulo en grados]).
 // El torre/roble son zonas de descubrimiento (revelan el mapa `rv` celdas); el fortín es un POI de combate (guardias del bioma + cofre del cabecilla, opcional: nunca bloquea el paso).
 Object.assign(TPL,{
  lm_torre:{w:0,r:300,lm:1,em:'🗼',rv:34,n:()=>'Torre del Vigía',dec:[['torreVigia',0,0,null,[50,50]],['hoguera',0,96],['piedra',-84,62,null,[7,6]],['piedra',74,72,null,[7,6]],['arbusto',-44,104],['banca',64,-96]],mobs:()=>[]},
  lm_roble:{w:0,r:300,lm:1,em:'🌳',rv:30,n:()=>'Roble del Pacto',dec:[['robleCentenario',0,0,null,[17,17]],['piedra',-90,70,null,[7,6]],['arbusto',100,-70],['arbusto',-96,-40]],mobs:()=>[]},
  lm_fortin:{w:0,r:270,lm:1,pk:'cofre',em:'🏰',mobIds:['bandido','banasesino','bandido'],n:()=>'Fortín de los Bandidos',
   dec:[['torreRuina',-175,-125,null,[40,40]],['torreRuina',175,-125,null,[40,40]],['torreRuina',-175,125,null,[40,40]],['torreRuina',175,125,{rot:1},[40,40]],
    ['muroRuina',-95,-130,{len:40},[29,4]],['muroRuina',95,-130,{len:40},[29,4]],['muroRuina',-178,0,{len:40,rot:1},[4,29]],['muroRuina',178,0,{len:40,rot:1},[4,29]],['muroRuina',-105,130,{len:40},[29,4]],['muroRuina',105,130,{len:40},[29,4]],
    ['hoguera',0,10],['estandarte',-70,-80,{col:'#6a3a3a'}],['estandarte',70,-80,{col:'#6a3a3a'}],['carpa',-90,30,{col:'#6a5a3a'},[10,10]],['barril',60,40],['caja',84,50],['huesos',-30,84]],
   mobs:()=>[[-80,50],[80,50],[0,-70],[-40,100],[60,95]]}});
  // HITOS MENORES (pequeños, con props que ya existen): molino abandonado, menhires en círculo, cementerio de caravana y granja quemada (con bandidos y cofre).
 Object.assign(TPL,{
  lm_molino:{w:0,r:200,lm:1,em:'🌀',rv:14,n:()=>'Molino abandonado',dec:[['molino',0,0],['heno',-70,46],['heno',-52,60],['carreta',80,52],['caja',104,30],['arbusto',-96,-20],['arbusto',90,-60],['tronco',-30,92,{len:24}]],mobs:()=>[]},
  lm_menhires:{w:0,r:170,lm:1,em:'🗿',rv:12,n:()=>'Menhires en círculo',dec:[...Array(9)].map((_,i)=>['menhir',Math.round(Math.cos(i/9*6.2832+.2)*100),Math.round(Math.sin(i/9*6.2832+.2)*100),{v:[0,1,2,0,3,1,0,2,1][i],rot:i%2},[9,9]]).concat([['piedra',0,6,null,[7,6]],['seta',-24,18],['seta',28,-14],['huesos',8,-26]]),mobs:()=>[]},
  lm_pozo:{w:0,r:170,lm:1,pk:'cofre',em:'🪣',n:()=>'Pozo del espantapájaros',dec:[['pozo',0,0],['espantapajaros',62,-34],['espantapajaros',-70,40],['heno',-30,-50],['heno',-16,-58],['huerto',70,50],['portillo',-90,-10],['arbusto',100,10],['tocon',-40,70]],mobs:()=>[]},
  lm_cementerio:{w:0,r:170,lm:1,pk:'cofre',em:'⚰️',n:()=>'Cementerio de caravana',dec:[['carreta',-60,-20,null,[16,10]],['carreta',70,30,{rot:1},[16,10]],['lapida',-20,50,null,[6,3]],['lapida',20,56,null,[6,3]],['lapida',60,-40,null,[6,3]],['lapida',-80,40,null,[6,3]],['huesos',0,-10],['huesos',-40,70],['huesos',50,-8],['barril',90,-30],['caja',-100,10],['tronco',0,100,{len:26}]],mobs:()=>[]},
  lm_granja:{w:0,r:200,lm:1,pk:'cofre',em:'🔥',mobIds:['bandido'],n:()=>'Granja quemada',dec:[['muroRuina',-70,-60,{len:40},[29,4]],['muroRuina',70,-60,{len:40},[29,4]],['muroRuina',-110,0,{len:40,rot:1},[4,29]],['muroRuina',110,0,{len:40,rot:1},[4,29]],['muroRuina',-60,70,{len:40},[29,4]],['huerto',0,10],['heno',-40,30],['heno',44,-20],['huesos',20,50],['hoguera',0,-10],['barril',80,30]],mobs:()=>[[-60,30],[60,20],[0,80]]}});
 const LANDM={0:[['lm_torre',50],['lm_roble',170],['lm_fortin',285],['lm_molino',20],['lm_menhires',105],['lm_cementerio',215],['lm_granja',335],['lm_pozo',255]]};   // Pradera: Torre del Vigía, Roble del Pacto y Fortín de los Bandidos
 const KINDS=Object.keys(TPL).filter(k=>!TPL[k].ev&&!TPL[k].lm),EVK=Object.keys(TPL).filter(k=>TPL[k].ev),WSUM=KINDS.reduce((a,k)=>a+TPL[k].w,0),EWSUM=EVK.reduce((a,k)=>a+TPL[k].ew,0);
 const pickE=r=>{let a=r*EWSUM;for(const k of EVK){a-=TPL[k].ew;if(a<=0)return k}return EVK[0]};
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
   const cs0=Math.min(GW/Math.max(1,Math.round(GW/(CELLT*T))),GH/Math.max(1,Math.round(GH/(CELLT*T))));let n=0;
   for(const PASS of[0,1]){const CT=PASS?EVCELL:CELLT,SALT=PASS?7919:0,nx=Math.max(1,Math.round(GW/(CT*T))),ny=Math.max(1,Math.round(GH/(CT*T))),cw=GW/nx,ch=GH/ny,cs=cs0;   // pasada 0 = POI grandes (campamento, ruina, cueva…); pasada 1 = descubrimientos pequeños en rejilla fina
   for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
    const kind=PASS?pickE(H(k*131+i+SALT,j,1)):pick(H(k*131+i,j,1)),tp=TPL[kind];let put=false;
    for(let a=0;a<6&&!put;a++){const lx=gx+(i+.15+H(k*131+i,j,10+a)*.7)*cw,ly=gy+(j+.15+H(k*131+i,j,30+a)*.7)*ch;
     if(bad(lx,ly,tp.r)||!ok(B.ox+lx,B.oy+ly,Math.min(tp.r,110),k))continue;
     const dv=Math.hypot(lx-sf[0],ly-sf[1]),tier=dv>cs*1.7?2:1,id=(PASS?'e':'g')+i+'_'+j,p={id,k:kind==='ruina'||kind==='mina'?'cofre':kind==='atalaya'?'hito':kind,n:tp.n(tier),x:Math.round(lx),y:Math.round(ly),r:tp.r,tier};
     const pool=(POOL[kind]&&POOL[kind].length?POOL[kind]:all);if(tp.mobs&&pool.length){const sl=tp.mobs(tier);if(sl.length)p.mobs=sl.map(([dx,dy],m)=>[pool[Math.floor(H(k*131+i,j,50+m)*pool.length)],dx,dy])}   // campamentos: guardias humanoides; ruinas: fieras
     if(tp.cave){const rr=H(k*131+i,j,90),ty=rr<.35?'tranquila':rr<.8||tier<2?'guarida':'profunda',small=k===0,ch=small?(ty==='profunda'?3:2):(ty==='profunda'?5:3+Math.floor(H(k*131+i,j,91)*2)),mi=((B.res||{}).mi||[]).flat().map(a=>a[0]);   // Pradera: cuevas pequeñas (2–3 cámaras, 38×32); el resto 3–5 cámaras
      p.cave={seed:1000+k*977+i*31+j*7,type:ty,ch,W:small?38:ty==='profunda'?64:56,H:small?32:ty==='profunda'?52:46,r0:small?5.2:6.5,ores:[...new Set(mi)],mobs:ids(['pack','ing','camp','orc','cap'])};p.n=CAVEGEN.TYPES[ty].nm;stats.cuevas=(stats.cuevas||0)+1}
     if(tp.vein){const mt=((B.res||{}).mi||[]),lt=L.mi||[];if(mt.length&&lt.length){const q=Math.floor(H(k*131+i,j,70)*mt.length),rc=[p.x-110,p.x+110,p.y+10,p.y+190];if(lt[q]){B.res.mi.push(mt[q].map(([a,m])=>[a,Math.max(2,Math.min(6,Math.round(m*.5)))]));L.mi.push({r:[rc],z:rc});stats.vetas=(stats.vetas||0)+1}}}   // veta del propio bioma pegada a la boca (misma plantilla que sus vetas; game.js la siembra en res.mi/lay.mi)
     pois.push(p);(tp.ev&&FLAV[k]?tp.dec.concat(FLAV[k]):tp.dec).forEach(([nm,dx,dy,o,fp])=>props.push(P(nm,p.x+dx,p.y+dy,o||null,fp?{fp}:undefined)));put=true;n++}
    if(!put)stats.rech++}}
   (LANDM[k]||[]).forEach(([kind,ang],li)=>{const tp=TPL[kind],c0=B.cen||[B.w/2,B.h/2];let put=false;   // hito grande: se busca el primer sitio válido siguiendo el rayo desde la aldea (±7°, ±14°…), cada vez más lejos
    for(let rr=2400;rr<=7200&&!put;rr+=240)for(let da=0;da<7&&!put;da++){const a=(ang+(da%2?1:-1)*Math.ceil(da/2)*7)*Math.PI/180,lx=c0[0]+Math.cos(a)*rr,ly=c0[1]+Math.sin(a)*rr;
     if(bad(lx,ly,tp.r)||!ok(B.ox+lx,B.oy+ly,Math.min(tp.r,110),k))continue;
     const p={id:'L'+li,k:tp.pk||'hito',n:tp.n(),x:Math.round(lx),y:Math.round(ly),r:tp.r,tier:2,em:tp.em,rv:tp.rv},pool=tp.mobIds||(POOL.camp.length?POOL.camp:all);
     if(tp.mobs&&pool.length)p.mobs=tp.mobs().map(([dx,dy],m)=>[pool[Math.floor(H(k*131+li,m,77)*pool.length)],dx,dy]);
     pois.push(p);tp.dec.forEach(([nm,dx,dy,o,fp])=>props.push(P(nm,p.x+dx,p.y+dy,o||null,fp?{fp}:undefined)));put=true;stats.hitos=(stats.hitos||0)+1;
     {const L=Math.hypot(lx-c0[0],ly-c0[1]),n=Math.floor((L-tp.r*.6-380)/150),pts=[],ta=Math.atan2(c0[1]-ly,c0[0]-lx);   // camino de tierra desde la aldea hasta el hito (serpentea y se corta donde deja de ser tierra firme)
      if(n>2){for(let i=0;i<=n;i++){const f=(380+i*150)/L,w=Math.sin(i*1.3+li*2)*24*Math.min(1,i/2),x=Math.round(c0[0]+(lx-c0[0])*f-Math.sin(ta)*w),y=Math.round(c0[1]+(ly-c0[1])*f+Math.cos(ta)*w);if(!ok(B.ox+x,B.oy+y,12,k))break;pts.push([x,y])}if(pts.length>2){B.routes.push(pts);stats.caminos=(stats.caminos||0)+1}}}}
    if(!put)console.warn('[POIGEN] sin sitio para el hito',kind,B.n)});
   stats.por[B.n||k]=n;stats.tot+=n});
  console.info('[POIGEN]',stats)}
 try{run()}catch(e){console.warn('[POIGEN] falló:',e)}
 return{TPL,stats,run}})();
