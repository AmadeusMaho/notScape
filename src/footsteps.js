// NotScape · PASOS (Lote FOOT-2, 21 oct 2026) — sonido de pisadas por SUPERFICIE con las grabaciones del dueño (assets/sfx/steps/<carpeta>/<set>N.ogg + manifest.json con todos los sets y sus variantes).
// ► SINCRONÍA POR FASE DEL PIE (requisito del dueño: «que si cambiamos la velocidad del jugador no rompa los sonidos, que se reproduzcan al pisar»): el héroe 3D saca su fase de marcha `gph` de la DISTANCIA recorrida
//   (heroanim3d.js: `gph += dt·cadencia`, cadencia = velocidad medida / zancada). `foot(u,side)` pone el pie IZQUIERDO en apoyo cuando u pasa por un entero y el DERECHO en k+.5: cada vez que cambia
//   `floor(2·gph)` un pie toca el suelo → suena un paso. NO hay temporizadores ni velocidades escritas aquí: cambiar WALK_V/RUN_MUL/zancada mueve el apoyo y la cadencia sola. Al PARAR, la animación termina el paso
//   hasta el doble apoyo (`gph` avanza hasta el siguiente .5): suena ese último pie (natural). Llamada: `FOOT.tick3(R3D.gait,P)` desde draw() (game.js) tras `R3D.frame`.
// ► ISLA-3 (21 oct 2026): suelos de mármol bajo los props griegos (`FLOORS`) y suelo de interiores por cultura/sala (`INTFLOOR`); ver el lote ISLA-3 + FOOT-3 de AGENTS.md.
// ► SUPERFICIES (ver `surface(x,y)`): grass (Pradera, Oriental, Cielo) · leaves (Bosque) · mud (Pantano) · snow (Cumbres) · gravel (Volcán, Páramo, Costa y FALDAS de montaña) · sand (Desierto y playas) ·
//   dirt (caminos de tierra) · stone (adoquín y afloramientos fuera del Cielo) · MARBLE (adoquín/plazas/caminos de la isla del Cielo: la arquitectura griega es de mármol) · wood (pasarelas e interiores).
//   Andar usa `<set>_walk`, correr `<set>_run` (si no existe, el walk con la variación de tono/volumen de correr). Los `_wander`, `_land`, `_through`… están en el manifiesto para otros usos (idle, caída, atravesar follaje).
// ► VARIACIÓN: grabación al azar sin repetir la anterior, tono ±4 %, volumen ±10 %, volumen ×1,15 al correr; cada archivo se NORMALIZA al cargar (RMS → −24 dBFS) para que todas las superficies suenen parejas.
// ► AJUSTES: `FOOT.vol` (0–1, .5), `FOOT.gain[superficie]`, `FOOT.on`; respeta `S.mute` y el volumen de efectos `S.sv`; sale por el volumen maestro (`AMASTER`: la niebla/eventos de bioma lo bajan).
// ► CARGA PEREZOSA: al primer paso sobre una superficie se descargan y decodifican sus ~22 ogg (≈ 150 KB cada set); mientras tanto no suena nada. `?nofoot` lo apaga.
const FOOT=(()=>{
 // superficie → [set de andar, set de correr] (nombres del manifiesto)
 const SETS={grass:['grass_walk','grass_run'],leaves:['leaves_through','leaves_through'],mud:['mud_walk','mud_walk'],snow:['snow_walk','snow_run'],gravel:['gravel_walk','gravel_run'],sand:['sand_walk','sand_run'],
  dirt:['dirt_walk','dirt_run'],stone:['stone_walk','stone_run'],marble:['marble_walk','marble_run'],wood:['wood_walk','deckwood_run'],lino:['lino_walk','lino_run'],rug:['rug_walk','rug_walk'],
  squeakywood:['squeakywood_walk','squeakywood_walk'],bluntwood:['bluntwood_walk','bluntwood_walk'],concrete:['concrete_walk','concrete_run'],metal:['metalbar_walk','metalbar_run']};
 const G={grass:.9,leaves:.8,mud:.9,snow:.85,gravel:.8,sand:.8,dirt:.9,stone:.85,marble:.9,wood:.9,lino:.9,rug:.9,squeakywood:.9,bluntwood:.9,concrete:.85,metal:.8};
 let M=null,mLoad=null,vol=.17,on=!/[?&]nofoot\b/.test(typeof location!=='undefined'?location.search:''),bus=null,lk=null;const BUF={},LD={},last={};
 const ctx=()=>{try{return typeof ac==='function'?ac():null}catch(e){return null}};
 const manifest=()=>mLoad||(mLoad=fetch('assets/sfx/steps/manifest.json').then(r=>r.json()).then(j=>{M=j}).catch(()=>{M={}}));
 // descarga + decodifica un set; guarda cada buffer con su ganancia de normalización (RMS → −24 dBFS ≈ .063)
 function load(name,a){if(LD[name])return;LD[name]=1;BUF[name]=[];manifest().then(()=>{(M[name]||[]).forEach((f,i)=>fetch('assets/sfx/steps/'+f).then(r=>r.arrayBuffer()).then(b=>new Promise((ok,no)=>a.decodeAudioData(b,ok,no))).then(d=>{
   const c=d.getChannelData(0);let s=0;const st=Math.max(1,c.length/4000|0);let n=0;for(let k=0;k<c.length;k+=st){s+=c[k]*c[k];n++}const rms=Math.sqrt(s/Math.max(1,n))||.05;BUF[name][i]={d,g:Math.max(.25,Math.min(2.5,.05/rms))}}).catch(()=>{}))})}
 // suelo bajo (x,y) en píxeles de mundo: lee los mismos campos que pinta el terreno (caminos PF, adoquines PC, pasarelas DK) + montañas y biomas
 // SUELOS DE MÁRMOL de los props griegos del Cielo (ISLA-3): el ágora, la plataforma de los propíleos, el estilóbato del templo y la base del Altar Quebrado suenan a mármol aunque el terreno de debajo sea hierba.
 // [forma ('c' círculo radio / 'r' rectángulo medio ancho×medio fondo), medidas en tiles SIN escalar] × PROP_K × 32 px; se miden de las huellas del módulo (CI_FOOT).
 const FLOORS={agora:['c',2.6],arenaG:['c',3.95],propileos:['r',3.96,3.23],temploG:['r',1.83,3.1],estatuaAlada:['r',.62,.62],estelaG:['r',.3,.2]};let FL=null,FLn=-1;
 // SUELO DE LOS INTERIORES: manda la cultura (tatami del Oriental, basalto del Volcán, troncos del Bosque y cañas del Pantano) y, en las demás, la sala (forja de piedra, banco y templo de mármol, el resto de madera que cruje).
 /* 28 oct 2026: el sonido sigue al SUELO que dibuja interiors3d.js `floorOf`: tatami (Oriental) y basalto (Volcán) mandan por cultura; en las demás, banco = mármol, taller/herrería/templo = PIEDRA, y taberna/botica/tienda = madera (bluntwood en Bosque y Pantano). Si cambias el suelo de una sala, cambia aquí su superficie. */
 const INTFLOOR=I=>{const st=I.so&&I.so.style,id=I.id;if(st==='shoji')return 'rug';if(st==='basalto')return 'stone';if(id==='banco')return 'marble';if(id==='taller'||id==='herreria'||id==='templo')return 'stone';return st==='troncos'||st==='cana'?'bluntwood':'squeakywood'};
 function floorAt(x,y){try{const L=PROPS.list;if(FLn!==L.length){FLn=L.length;FL=L.filter(e=>FLOORS[e.n]);}if(!FL||!FL.length)return null;const K=(window.PROP_K||1)*32;
  for(const e of FL){const f=FLOORS[e.n],dx=Math.abs(x-e.x),dy=Math.abs(y-e.y);if(f[0]==='c'?Math.hypot(dx,dy)<f[1]*K:dx<f[1]*K&&dy<f[2]*K)return 'marble'}}catch(err){}return null}
 function surface(x,y){try{
  if(typeof INT!=='undefined'&&INT)return INTFLOOR(INT);
  const fm=floorAt(x,y);if(fm)return fm;
  const T=ISO.TILE,F=TER.fields(),SG=F.SG,NX=TER.NX,NY=TER.NY,FW=NX*SG,sc=T/SG,i=Math.floor(x/sc),j=Math.floor(y/sc),tx=Math.floor(x/T),ty=Math.floor(y/T);
  let b=typeof curB==='number'?curB:0;try{const q=BIOMES.at(x,y);if(q>=0)b=q}catch(e){}
  if(tx>=0&&ty>=0&&tx<NX&&ty<NY){if(F.DK[ty*NX+tx])return 'wood';if(F.PC[j*FW+i]>=128)return b===9?'marble':'stone';if(F.PF[j*FW+i]>=128)return 'dirt';if(TER.rk(tx,ty))return 'stone';if(TER.sandAt(tx,ty)>.5)return 'sand';
   try{if(BIOMES.ranges.length&&BIOMES.rangeAt(x,y)[0]>1)return 'gravel'}catch(e){}}
  return ['grass','grass','mud','snow','grass','gravel','gravel','sand','gravel','grass'][b]||'grass'}catch(e){return 'grass'}}
 const ST={n:0,last:'',run:0,by:{}};   // contador de pasos (pruebas): total, última superficie, corriendo, por superficie
 function play(s,run){ST.n++;ST.last=s;ST.run=run?1:0;ST.by[s]=(ST.by[s]||0)+1;const a=ctx();if(!a||(typeof S!=='undefined'&&S.mute))return;const P=SETS[s]||SETS.grass,nm=P[run?1:0];load(nm,a);const L=(BUF[nm]||[]).map((b,i)=>b?i:-1).filter(i=>i>=0);if(!L.length)return;
  let k=L[Math.floor(Math.random()*L.length)];if(L.length>1&&k===last[nm])k=L[(L.indexOf(k)+1)%L.length];last[nm]=k;
  if(!bus){bus=a.createGain();bus.connect(typeof AMASTER!=='undefined'&&AMASTER?AMASTER:a.destination)}
  const e=BUF[nm][k],src=a.createBufferSource(),g=a.createGain(),sv=typeof S!=='undefined'&&S.sv!=null?S.sv/100:1;src.buffer=e.d;src.playbackRate.value=(1+(Math.random()-.5)*.08)*(run&&P[0]===P[1]?1.07:1);
  g.gain.value=vol*sv*e.g*(G[s]||1)*(run?1.15:1)*(1+(Math.random()-.5)*.2);src.connect(g);g.connect(bus);src.start()}
 // llamada por fotograma con la marcha del héroe 3D: gait = {g: fase gph, run: ¿corriendo?, mv: ¿en marcha?}; suena un paso cada vez que un pie toca el suelo
 function tick3(gait,P){if(!on||!gait)return;try{const k=Math.floor(gait.g*2);if(lk===null||Math.abs(k-lk)>3){lk=k;return}   // salto grande (reaparición, teletransporte): sin paso
  if(k!==lk){const fwd=k>lk;lk=k;if(fwd&&gait.vis){const sf=surface(P.x,P.y);play(sf,gait.run);if((sf==='snow'||sf==='sand'||sf==='mud')&&window.R3D&&R3D.fx&&R3D.fx.print)R3D.fx.print(P.x,P.y,P.ldx||0,P.ldy||1,k&1,sf)}}}catch(e){}}
 // efectos sueltos del pack (dash, wing, land…): `FOOT.sfx(nombre, volumen)` reproduce una grabación al azar del manifiesto (se descarga la primera vez: ese primer disparo puede no sonar)
 function sfx(name,v){const a=ctx();if(!a||!on||(typeof S!=='undefined'&&S.mute))return;load(name,a);const L=(BUF[name]||[]).filter(Boolean);if(!L.length)return;const e=L[Math.floor(Math.random()*L.length)];
  if(!bus){bus=a.createGain();bus.connect(typeof AMASTER!=='undefined'&&AMASTER?AMASTER:a.destination)}const src=a.createBufferSource(),g=a.createGain(),sv=typeof S!=='undefined'&&S.sv!=null?S.sv/100:1;src.buffer=e.d;src.playbackRate.value=.97+Math.random()*.06;g.gain.value=Math.min(1.2,vol*2*sv*e.g*(v==null?1:v));src.connect(g);g.connect(bus);src.start()}
 // (API antigua 2D: ya no se usa; se conserva por compatibilidad)
 function tick(){}
 return{tick,tick3,surface,play,sfx,load,SETS,stats:ST,get on(){return on},set on(v){on=!!v},get vol(){return vol},set vol(v){vol=Math.max(0,Math.min(1,+v||0))},gain:G,get manifest(){return M}}})();
