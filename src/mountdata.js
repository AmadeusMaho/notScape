// NotScape · MONTURAS: DATOS (lote DOMAR-D3-MODELOS, 29 oct 2026) · global `MTD`. Cargado ANTES de mount.js y game.js (tras creatures.js).
// 4 especies DOMABLES por bioma (36) + 2 monturas ÚNICAS RARAS por bioma (18). Cada fila = un animal salvaje (`MD[id]`, criatura con `tm`) y su objeto de montura `mt_<id>`.
// El MODELO 3D (uno por especie, mismo para el salvaje y la montura con silla) está en src/r3d/mountmodels3d.js (`SPEC`, `MBIO` = bioma; rules_check exige que coincidan).
// Columnas: id · bioma (0 Pradera … 8 Costa) · nombre del salvaje · nombre de la montura · nivel de Domar · XP al domar · color (icono/etiqueta) · altura en px de modelo (CRE.H)
//           · v = velocidad (× sobre el trote/galope del caballo) · a = aguante (× duración del galope) · emoji · r = 1 si es RARA (aparece a veces; ver TAME.mobTick)
// Equilibrio PROVISIONAL (sin jugar): la velocidad va de ×0,85 a ×1,2 (raras ×1,25–1,3) para no romper el tope ×2,2 del plan; lo que diferencia a las lentas es el aguante.
const MTD=(()=>{
 const L=[
  ['caballo',0,'Caballo salvaje','Caballo de las llanuras',1,110,'#9a5a32',76,1,1,'🐴'],
  ['poni',0,'Poni pinto salvaje','Poni pinto',4,140,'#efe6d6',69,.92,1.35,'🐴'],
  ['asno',0,'Asno gris','Asno de carga',8,170,'#8a8580',70,.88,1.6,'🫏'],
  ['uro',0,'Uro','Uro manso',12,220,'#3a2a20',71,.95,1.3,'🐂'],
  ['ciervo',1,'Ciervo real','Ciervo real',15,260,'#8a4e2e',106,1.12,.9,'🦌'],
  ['alce',1,'Alce','Alce astado',19,300,'#3e2c22',87,1,1.25,'🫎'],
  ['osopardo',1,'Oso de las hayas','Oso de las hayas',23,340,'#5a3a24',57,.9,1.5,'🐻'],
  ['lince',1,'Lince boreal','Lince boreal',27,380,'#b89068',57,1.15,.85,'🐈'],
  ['varano',2,'Varano de ciénaga','Varano de ciénaga',28,400,'#4a5a34',45,.95,1.2,'🦎'],
  ['sapo',2,'Sapo buey','Sapo buey',32,440,'#6a6a34',38,.9,1.3,'🐸'],
  ['raptor',2,'Raptor de los juncos','Raptor de los juncos',36,480,'#5a6a3a',71,1.18,.9,'🦖'],
  ['bufalo',2,'Búfalo de agua','Búfalo de agua',40,520,'#4a4a4e',67,.95,1.4,'🐃'],
  ['yakcarga',3,'Yak salvaje','Yak de carga',40,520,'#3a2e26',68,.9,1.7,'🐂'],
  ['ibice',3,'Íbice','Íbice de las cumbres',44,560,'#9a8466',88,1.1,1.1,'🐐'],
  ['mamut',3,'Mamut lanudo','Mamut lanudo',48,620,'#6a4a32',74,.88,1.8,'🦣'],
  ['osoblanco',3,'Oso de las nieves','Oso de las nieves',52,660,'#ece8dc',54,1,1.4,'🐻'],
  ['tigre',4,'Tigre de bambú','Tigre de bambú',50,640,'#e07a2a',54,1.18,.95,'🐅'],
  ['grulla',4,'Grulla gigante','Grulla de monta',54,680,'#ece8e0',83,1.1,1.1,'🪶'],
  ['panda',4,'Panda gigante','Panda gigante',58,720,'#efebe2',53,.9,1.5,'🐼'],
  ['komainu',4,'León guardián','León guardián',62,760,'#4a8a6a',60,1.1,1.2,'🦁'],
  ['salamandra',5,'Salamandra de lava','Salamandra de lava',60,760,'#2a1e1c',45,1,1.3,'🦎'],
  ['rino',5,'Rinoceronte de ceniza','Rinoceronte de ceniza',64,800,'#5a5450',59,1,1.5,'🦏'],
  ['escarabajo',5,'Escarabajo de brasa','Escarabajo de brasa',68,840,'#4a1414',47,.95,1.6,'🪲'],
  ['sabueso',5,'Sabueso infernal','Sabueso infernal',72,880,'#2a1e1e',59,1.2,1,'🐕'],
  ['huargo',6,'Huargo','Huargo',70,860,'#4a4650',62,1.2,1.1,'🐺'],
  ['aveterror',6,'Ave del terror','Ave del terror',74,900,'#3a3240',80,1.2,.95,'🪶'],
  ['ciervorunico',6,'Ciervo rúnico','Ciervo rúnico',78,940,'#4a4652',100,1.15,1.15,'🦌'],
  ['tejon',6,'Tejón gigante','Tejón gigante',82,980,'#7a7670',42,.95,1.5,'🦡'],
  ['camello',7,'Camello bactriano','Camello bactriano',55,720,'#b88a5a',79,.95,2,'🐫'],
  ['orix',7,'Órix','Órix del desierto',59,760,'#d8cfc0',101,1.15,1.1,'🦌'],
  ['avestruz',7,'Avestruz de duna','Avestruz de duna',63,800,'#1e1a18',88,1.2,.9,'🪶'],
  ['gola',7,'Lagarto de gola','Lagarto de gola',67,840,'#b8784a',49,1.1,1.1,'🦎'],
  ['tortuga',8,'Tortuga de arrecife','Tortuga de arrecife',45,600,'#5a7a6a',41,.85,2.2,'🐢'],
  ['cangrejo',8,'Cangrejo de roca','Cangrejo de roca',49,640,'#c84a2a',41,.95,1.4,'🦀'],
  ['iguana',8,'Iguana marina','Iguana marina',53,680,'#2a2a2c',41,1,1.2,'🦎'],
  ['gavion',8,'Gaviotón','Gaviotón',57,720,'#efede8',62,1.1,1.1,'🪶'],
  // ── ÚNICAS RARAS (2 por bioma): un solo ejemplar en un claro sin rótulo; aparición MUY baja (RARE_P) y, domada, tarda mucho en volver ──
  ['unicornio',0,'Unicornio','Unicornio de la llanura',30,900,'#f4f2ee',79,1.22,1.3,'🦄',1],
  ['pegaso',0,'Pegaso','Pegaso',35,1000,'#d8dce8',75,1.25,1.3,'🐴',1],
  ['ciervolunar',1,'Ciervo lunar','Ciervo lunar',40,1100,'#2a3a52',108,1.24,1.2,'🦌',1],
  ['osomusgo',1,'Oso de musgo ancestral','Oso de musgo ancestral',45,1200,'#4a3a28',58,1.1,1.8,'🐻',1],
  ['cocodrilo',2,'Cocodrilo ancestral','Cocodrilo ancestral',50,1300,'#3a4a2e',40,1.12,1.6,'🐊',1],
  ['sapojade',2,'Sapo de jade','Sapo de jade',55,1350,'#2a8a6a',38,1.15,1.5,'🐸',1],
  ['tortugadragon',8,'Tortuga dragón','Tortuga dragón',62,1450,'#c89a30',45,1.05,2.4,'🐢',1],
  ['cangrejorey',8,'Cangrejo rey','Cangrejo rey',66,1500,'#2a4a9a',41,1.15,1.6,'🦀',1],
  ['ibicecristal',3,'Íbice de cristal','Íbice de cristal',65,1500,'#e8eef4',91,1.25,1.4,'🐐',1],
  ['grifo',3,'Grifo celeste','Grifo celeste',85,1900,'#c89a5a',60,1.28,1.4,'🦅',1],
  ['qilin',4,'Qilin','Qilin',72,1650,'#e8b048',84,1.27,1.4,'🦌',1],
  ['tigreblanco',4,'Tigre blanco celestial','Tigre blanco celestial',76,1700,'#f0f2f8',55,1.27,1.3,'🐅',1],
  ['escarabajosol',7,'Escarabajo del sol','Escarabajo del sol',74,1700,'#d8a830',47,1.15,2,'🪲',1],
  ['esfinge',7,'Esfinge','Esfinge',80,1800,'#d8a860',57,1.28,1.5,'🦁',1],
  ['corcelinfernal',5,'Corcel infernal','Corcel infernal',88,2000,'#1e1616',75,1.3,1.5,'🐴',1],
  ['dragon',5,'Minidragón de brasa','Minidragón de brasa',95,2200,'#7a1e1a',53,1.3,1.6,'🐉',1],
  ['cuervo',6,'Cuervo de la ceniza','Cuervo de la ceniza',86,2000,'#1a1a22',65,1.28,1.4,'🐦',1],
  ['espectral',6,'Lobo espectral','Lobo espectral',90,2100,'#8ab0c8',63,1.3,1.5,'🐺',1]];
 const RARE_P=.04,RARE_WAIT=[10,20],RARE_GONE=40;   // MUY baja (decisión del dueño): 4 % cada vez que «toca» aparecer; si no sale, vuelve a tirar en 10–20 min (≈ 4–6 h de juego cerca de su claro); domada, 40 min   // probabilidad de estar al reaparecer · minutos hasta volver a tirar si no estaba · minutos tras domarla
 const E={};L.forEach(r=>E[r[0]]={id:r[0],k:r[1],n:r[2],mt:r[3],lv:r[4],xp:r[5],c:r[6],h:r[7],v:r[8],a:r[9],ic:r[10],rare:!!r[11]});
 const get=id=>E[id]||null,rar=e=>e.rare?4:e.lv<20?1:e.lv<50?2:3;
 // objetos de montura (los llama MOUNT.reg)
 function reg(){for(const id in E){const e=E[id];I['mt_'+id]=[e.mt,e.ic,e.rare?6000:120+e.lv*18];LOOT['mt_'+id]={s:'mt',r:rar(e),k:0,st:{},mt:{sp:id}}}}
 // criaturas salvajes (game.js, tras definir LVR/MSF y antes de calcular sus niveles)
 function regMobs(){for(const id in E){const e=E[id],lo=Math.max(1,Math.round(e.lv*.6));
  MD[id]=Object.assign(MD[id]||{},{n:e.n,lv:e.lv,hp:1,dmg:0,as:3000,c:e.c,w:24,h:e.h,an:1,tm:{lv:e.lv,xp:e.xp,rare:e.rare?1:0},co:[1,6],dr:[['carne',.6],['cuero',.5],['hueso',.3]]});
  MD[id].id=id;MD[id].h=Math.round(e.h/1.5);CRE.H[id]=e.h;LVR[id]=[lo,lo+3];MSF[id]=[e.rare?3:1.4,0]}}
 // colocación por bioma (game.js, junto a HERB.place): 2 pastos con 2 especies × 2 ejemplares; las raras, un claro aparte con UN ejemplar
 function place(b,k,x0,y0){if(b.zone)return 0;const sp=L.filter(r=>r[1]===k&&!r[11]).map(r=>r[0]),rr=L.filter(r=>r[1]===k&&r[11]).map(r=>r[0]),cen=b.cen||[b.w/2,b.h/2],W=300,H=200,zr=[];let tries=0;
  const want=(sp.length?2:0)+rr.length;
  while(zr.length<want&&tries++<260){const lx=Math.random()*b.w,ly=Math.random()*b.h,x=x0+lx,y=y0+ly;
   if(Math.hypot(lx-cen[0],ly-cen[1])<(b.safe||620)+120||zr.some(z=>Math.hypot(z[0]-lx,z[1]-ly)<700))continue;
   if(N.some(o=>Math.abs(o.x-x)<W*.6&&Math.abs(o.y-y)<H*.6))continue;
   let ok=1;for(const[dx,dy]of[[0,0],[-W/2,-H/2],[W/2,-H/2],[-W/2,H/2],[W/2,H/2]]){const px=x+dx,py=y+dy;if(!TER.isLand(TER.heightAt(px,py))||TER.heightAt(px,py)<1||TER.cliffNear(px,py,14)||PROPS.solid(px,py)||(typeof biomeAt==='function'&&biomeAt(px,py)!==k)){ok=0;break}}
   if(ok)zr.push([lx,ly])}
  zr.forEach(([lx,ly],i)=>{const r=[lx-W/2,lx+W/2,ly-H/2,ly+H/2],rare=i>=2||!sp.length,ids=rare?[rr[i-(sp.length?2:0)]]:[sp[i*2],sp[i*2+1]].filter(Boolean);
   ids.forEach(id=>{for(let j=0;j<(rare?1:2);j++)mob(id,x0+r[0]+20+Math.random()*(W-40),y0+r[2]+20+Math.random()*(H-40))});
   if(!rare)ZS.push({k,r:[x0+r[0],x0+r[1],y0+r[2],y0+r[3]],t:'🐎 Pastos salvajes: '+ids.map(id=>E[id].n.toLowerCase()).join(' y ')})});return zr.length}
 return{L,E,get,reg,regMobs,place,RARE_P,RARE_WAIT,RARE_GONE}})();
