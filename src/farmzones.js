// NotScape · ÁREAS DE FARMEO (30 oct 2026; el dueño: «áreas grandes de farmeo para X enemigos como en WoW, cada enemigo en su spot con sus props») — PLANTILLA BASE PARA TODOS LOS BIOMAS.
// Se carga ANTES de poi-gen.js (los POI y el relleno de `?map=A` esquivan estas áreas) y de game.js (que lee `B.fauna`, `B.village.props`, `B.village.plaza` y `B.routes`).
// Una ÁREA = un círculo grande (R ≈ 500–700 px ≈ 16–22 tiles) a una distancia/ángulo fijos de la aldea (el peligro crece con la distancia) con:
//   · SUS enemigos (`mobs`: [[id, cantidad]…]), repartidos por todo el círculo con separación mínima (nada de montón en una esquina);
//   · SU decoración temática (`deco`: [[prop, cantidad, zona, opciones]…]) en zonas: 'c' centro · 'm' anillo medio · 'o' borde · 'a' cualquier sitio · 'wall' empalizada/muro CERRADO salvo la entrada que mira a la aldea;
//   · suelo de tierra pisada en el centro (`dirt`) y un camino de tierra desde la aldea (`road`), como las rutas a los campamentos de WoW;
//   · zona de descubrimiento con nombre (`ZS`, 🏴/🏕️…) y un rectángulo reservado en `B.spots['f<i>']` para que POI y relleno no la pisen.
// TODO es determinista (hash, nunca Math.random). Un bioma nuevo = una entrada en `SPEC[k]` (mismo formato); los ids de enemigos salen de `MD` y los de props de `props.js`/`propsdark*`.
// `?farm=0` lo apaga. Estadísticas en `FARM.stats` (consola `[FARM]`). Coordenadas LOCALES del bioma, en px de mundo (1 tile = 32 px).
const FARM=(()=>{
 const qs=location.search,off=/[?&]farm=0/.test(qs),T=32,TAU=Math.PI*2;
 const H=(a,b,c)=>{let h=(Math.imul(a|0,374761393)+Math.imul(b|0,668265263)+Math.imul(c|0,2147483647))|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};
 // ───────── DATOS · PRADERA (k=0). ang = grados desde el centro de la aldea (0 = este, 90 = sur), dist = tiles, R = radio en px ─────────
 // Orden de dificultad por distancia: limos (nv 1–3) → dehesa y cañada (animales) → espantapájaros → goblins → bandidos → orcos (nv 10+, con élite).
 const SPEC={0:[
  {id:'limos',n:'Charca de limos',em:'🟢',ang:200,dist:52,R:520,dirt:.25,mobs:[['slime',14]],
   deco:[['charco',7,'m',{col:'#3a4a2a',water:'#5a7a4a'}],['seta',12,'a'],['piedra',7,'a'],['roca',3,'o'],['arbusto',14,'a'],['tronco',3,'m',{len:24}],['huesos',2,'m']]},
  {id:'dehesa',n:'Dehesa de toros',em:'🐂',ang:80,dist:48,R:560,dirt:.18,mobs:[['vaca',9],['toro',2],['gallina',6]],
   deco:[['heno',12,'m'],['comedero',2,'c'],['abrevadero',2,'c'],['arbusto',10,'a'],['roble',4,'o'],['portillo',2,'o'],['huesos',1,'o']]},
  {id:'canada',n:'Cañada de cabras',em:'🐐',ang:155,dist:68,R:560,dirt:.12,mobs:[['cabra',9],['conejo',8],['zorrorojo',3]],
   deco:[['roca',12,'a'],['piedra',8,'a'],['arbusto',14,'a'],['roble',3,'o'],['tocon',4,'m'],['seta',5,'m']]},
  {id:'espantapajaros',n:'Campo de espantapájaros',em:'🌾',ang:12,dist:82,R:600,dirt:.2,mobs:[['espantapajaros',12]],
   deco:[['heno',16,'a'],['huerto',5,'m'],['portillo',4,'o'],['tocon',4,'a'],['arbusto',8,'o'],['tronco',3,'m',{len:22}],['huesos',3,'m'],['lanzas',2,'c']]},
  {id:'goblins',n:'Ruinas goblin',em:'👺',chest:'Alijo goblin',ang:118,dist:106,R:620,dirt:.34,mobs:[['goblin',10],['goblinarq',4],['goblinsha',2]],
   deco:[['muroRuina',7,'wall',{len:40}],['columna',5,'m',{broken:1}],['carpa',3,'m',{col:'#4a6a3a'}],['estandarte',4,'o',{col:'#4a6a2a'}],['hoguera',2,'c'],['barril',4,'m'],['caja',4,'m'],['huesos',7,'a'],['lanzas',3,'m'],['arbusto',6,'o']]},
  {id:'bandidos',n:'Campamento de bandidos',em:'🏴',chest:'Botín del cabecilla',ang:302,dist:132,R:660,dirt:.36,mobs:[['bandido',12],['banasesino',2]],
   deco:[['empalizada',9,'wall'],['carpa',5,'m',{col:'#8a5a38'}],['hoguera',3,'c'],['estandarte',5,'o',{col:'#6a2a2a'}],['barril',6,'m'],['caja',5,'m'],['carreta',2,'m'],['tronco',4,'a',{len:26}],['huesos',4,'a'],['lanzas',3,'m'],['arbusto',6,'o']]},
  // CAPITÁN y JEFE de la Pradera (cap = `k0` Rufo, boss = `b0` Gruk): su guarida/arena propia, grande y decorada, con un cofre de botín. El capitán se coloca en el centro; el jefe se coloca ahí con `B.bossPos` (game.js lo crea).
  {id:'capitan',n:'Guarida del capitán Rufo',em:'🏴‍☠️',ang:322,dist:152,R:440,dirt:.42,cap:'k0',chest:'Botín del capitán',mobs:[['bandido',5],['banasesino',1]],
   deco:[['empalizada',9,'wall'],['carpa',3,'m',{col:'#7a2a2a'}],['estandarte',4,'o',{col:'#8a1a1a'}],['hoguera',2,'c'],['carreta',2,'m'],['barril',5,'m'],['caja',6,'m'],['lanzas',4,'m'],['huesos',3,'a'],['tronco',3,'a',{len:24}]]},
  {id:'gruk',n:'Trono de Gruk',em:'👑',ang:268,dist:214,R:540,dirt:.46,boss:'b0',chest:'Tesoro de Gruk',mobs:[['orco',6],['orcocampeon',1]],
   deco:[['empalizada',14,'wall'],['portonOrco',1,'gate'],['estandarte',6,'o',{col:'#2f5a2a'}],['hoguera',4,'c'],['carpa',2,'m',{col:'#3a4a2a'}],['huesos',12,'a'],['lanzas',8,'m'],['roca',6,'o'],['barril',3,'m'],['caja',3,'m']]},
  {id:'orcos',n:'Fuerte orco',em:'🛡️',chest:'Tesoro del jefe orco',ang:252,dist:168,R:680,dirt:.4,mobs:[['orco',10],['orcocampeon',1]],
   deco:[['empalizada',12,'wall'],['portonOrco',1,'gate'],['estandarte',5,'o',{col:'#3a5a2a'}],['hoguera',3,'c'],['carpa',3,'m',{col:'#5a4a30'}],['huesos',9,'a'],['lanzas',5,'m'],['barril',3,'m'],['caja',3,'m'],['roca',5,'o']]}]};
 const stats={zonas:0,mobs:0,props:0,rutas:0,sinSitio:[]};
 function run(){
  if(off||typeof BIOMES==='undefined'||typeof TER==='undefined'||!BIOMES.tk||!BIOMES.tk.P)return;
  const P=BIOMES.tk.P,MA=BIOMES.mapA;
  const land=(B,k,x,y,r)=>{const wx=B.ox+x,wy=B.oy+y;if(BIOMES.own(wx,wy)<0)return false;if(MA&&BIOMES.own(wx,wy)!==k)return false;const tx=Math.floor(wx/T),ty=Math.floor(wy/T);
   return TER.isLand(TER.tileH(tx,ty))&&!TER.cliffNear(wx,wy,r)&&TER.sandAt(tx,ty)<.35&&!TER.seaAt(tx,ty)&&!TER.mtnAt(wx,wy)};
  BIOMES.list.forEach((B,k)=>{const sp=SPEC[k];if(!sp||!B.village||!B.cen)return;
   const fa=B.fauna=B.fauna||[],V=B.village,placed=[];let ni=0;
   if(sp.some(a=>a.cap)&&B.pois)B.pois.forEach(p=>{if(p.mobs)p.mobs=p.mobs.filter(m=>!/^k\d/.test(m[0]))});   // el capitán vive en su guarida, no en el POI viejo
   if(sp.some(a=>a.boss)&&B.spots&&B.spots.orc)delete B.spots.orc;   // el campamento orco viejo (en el mar con el mapa A) se sustituye por el Trono de Gruk
   const c0=B.cen,rectsHit=(x,y,r)=>Object.values(B.spots||{}).some(s=>s.z&&x>s.z[0]-r-60&&x<s.z[1]+r+60&&y>s.z[2]-r-60&&y<s.z[3]+r+60);
   sp.forEach((A,ai)=>{const R=A.R;let C=null;
    for(const sc of[1,.8,.62,.48]){for(let rr=A.dist*sc*T;rr<=A.dist*sc*T+1700&&!C;rr+=170)for(let da=0;da<9&&!C;da++){
      const a=(A.ang+(da%2?1:-1)*Math.ceil(da/2)*8)*Math.PI/180,x=Math.round(c0[0]+Math.cos(a)*rr),y=Math.round(c0[1]+Math.sin(a)*rr);
      if(placed.some(q=>Math.hypot(x-q.x,y-q.y)<R+q.R+200)||rectsHit(x,y,R))continue;
      let bad=land(B,k,x,y,26)?0:9;for(let i=0;i<12&&bad<4;i++){const b=i/12*TAU;if(!land(B,k,x+Math.cos(b)*R*.8,y+Math.sin(b)*R*.8,26))bad++}
      if(bad<4)C={x,y}}
     if(C)break}
    if(!C){stats.sinSitio.push(A.id);return}
    const Z={id:A.id,n:A.n,x:C.x,y:C.y,R,mobs:[]};placed.push(Z);const toV=Math.atan2(c0[1]-C.y,c0[0]-C.x);
    const taken=[];                                                    // [x,y,radio] de lo ya colocado (separación entre mobs y props)
    if(A.cap){Z.mobs.push([A.cap,C.x,C.y]);taken.push([C.x,C.y,70])}   // el capitán, en el centro de su guarida
    if(A.boss){B.bossPos=[C.x,C.y];B.bossArena=A.id;taken.push([C.x,C.y,100])}   // el jefe lo crea game.js en `bossPos` (centro del trono)
    const free=(x,y,m)=>land(B,k,x,y,22)&&!taken.some(t=>Math.hypot(x-t[0],y-t[1])<t[2]+m);
    // ── enemigos: Poisson con separación que se relaja si falta sitio ──
    A.mobs.forEach(([id,n],mi)=>{for(let i=0;i<n;i++){let put=false;for(let t=0;t<90&&!put;t++){const u=H(k*977+ai*31+mi,i*13+t,1),a=H(k*977+ai*31+mi,i*13+t,2)*TAU,r=Math.sqrt(u)*R*.86,x=Math.round(C.x+Math.cos(a)*r),y=Math.round(C.y+Math.sin(a)*r),sep=t<45?150:t<70?100:60;
       if(!free(x,y,sep*.5)||Math.hypot(x-C.x,y-C.y)<48&&A.deco.some(d=>d[2]==='c'))continue;Z.mobs.push([id,x-0,y-0]);taken.push([x,y,sep*.5]);put=true}}});
    // ── decoración ──
    const zone=(z,i,sd)=>{const u=H(sd,i,3),a=H(sd,i,4)*TAU;let r;if(z==='c')r=Math.sqrt(u)*R*.3;else if(z==='m')r=R*(.3+.45*u);else if(z==='o')r=R*(.78+.2*u);else r=Math.sqrt(u)*R*.95;return[Math.round(C.x+Math.cos(a)*r),Math.round(C.y+Math.sin(a)*r)]};
    let np=0;
    A.deco.forEach(([nm,n,z,o],di)=>{const sd=k*7919+ai*131+di*17;
     if(z==='wall'){const nw=n,gap=.5;for(let i=0;i<nw;i++){const ang=toV+gap+(i/(nw-1||1))*(TAU-2*gap),x=Math.round(C.x+Math.cos(ang)*R*.97),y=Math.round(C.y+Math.sin(ang)*R*.97);
       if(!land(B,k,x,y,18))continue;V.props.push(P(nm,x,y,Object.assign({rot:Math.abs(Math.cos(ang))<.7?1:0},o||{})));taken.push([x,y,34]);np++}return}
     if(z==='gate'){const x=Math.round(C.x+Math.cos(toV)*R*.97),y=Math.round(C.y+Math.sin(toV)*R*.97);if(land(B,k,x,y,18)){V.props.push(P(nm,x,y,Object.assign({rot:Math.abs(Math.cos(toV))<.7?1:0},o||{})));taken.push([x,y,50]);np++}return}
     for(let i=0;i<n;i++){let put=false;for(let t=0;t<40&&!put;t++){const[x,y]=zone(z,i*40+t,sd);if(!free(x,y,nm==='hoguera'||nm==='carpa'||nm==='carreta'?70:34))continue;V.props.push(P(nm,x,y,o||null));taken.push([x,y,nm==='carpa'||nm==='carreta'?44:20]);put=true;np++}}});
    // ── cofre del cabecilla (opcional; POI `cofre` de poi-gen/game.js, tier 2, en el corazón del campamento: hay que llegar hasta él entre los enemigos) ──
    if(A.chest){const px=Math.round(C.x+Math.cos(toV+2.4)*R*.16),py=Math.round(C.y+Math.sin(toV+2.4)*R*.16);(B.pois||(B.pois=[])).push({id:'F'+A.id,k:'cofre',n:A.chest,x:px,y:py,r:70,tier:2,em:'🧰'});stats.cofres=(stats.cofres||0)+1}
    // ── suelo y camino ──
    if(A.dirt){V.plaza.push([C.x,C.y,Math.round(R*A.dirt)]);for(let i=0;i<6;i++){const a=H(k*31+ai,i,7)*TAU,r=R*A.dirt*(.55+.5*H(k*31+ai,i,8));V.plaza.push([Math.round(C.x+Math.cos(a)*r),Math.round(C.y+Math.sin(a)*r),Math.round(R*A.dirt*(.42+.3*H(k*31+ai,i,9)))])}}   // mancha irregular de tierra pisada (varios círculos solapados, no un disco)
    // (sin camino de tierra hacia el área: se quitaron los caminos extra por área, 30 oct 2026; el dueño los consideró excesivos)
    // ── registrar: enemigos + zona (game.js lee B.fauna), rectángulo reservado, ficha para mapa/diario ──
    const z=[C.x-R,C.x+R,C.y-R,C.y+R];fa.push({z,mobs:Z.mobs,t:A.em+' '+A.n,farm:1});B.spots['f'+ni++]={id:A.id,t:A.em+' '+A.n,z,mobs:[],decor:[]};(B.farm=B.farm||[]).push({id:A.id,n:A.n,em:A.em,x:C.x,y:C.y,R,mobs:A.mobs.map(m=>m[0])});
    stats.zonas++;stats.mobs+=Z.mobs.length;stats.props+=np});
  });
  console.info('[FARM]',stats)}
 try{run()}catch(e){console.warn('[FARM] falló:',e)}
 return{SPEC,stats,run}})();
