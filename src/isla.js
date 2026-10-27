// NotScape · ISLA-5 (21 oct 2026) · MOTOR DE MISIONES POR PASOS + «CAMINO DEL DESPERTAR» de la isla del Cielo (docs/PLAN_ISLA_CIELO.md §6; guion en docs/GUION_TUTORIAL.md).
// Script clásico, global `ISLA`. Se carga tras cine.js (usa `CINE`, `S`, `P`, `ST`, `N`, `M`, `BIOMES`… solo al llamar). Un PASO es DATOS (`STEPS`): texto de una frase, dónde está el objetivo (flecha dorada) y la condición de cumplirlo.
//   · CONDICIONES (`goal.t`): `talk` (hablar con el PNJ `k`) · `reach` (llegar a un punto `at` de la isla, radio `r` tiles) · `panel` (abrir la Mochila) · `run` / `got` / `make` / `kill` / `dep` (contadores de `S.st` desde que EMPIEZA el paso:
//     correr casillas, conseguir/fabricar un objeto, derrotar, depositar en el banco; `n` veces) · `have` (llevar encima todos los objetos de `k`) · `offer` (dejar cada ofrenda junto a su brasero) · `cine` (ver la cinemática de Gabriel).
//   · ESTADO (se guarda): `S.isla = {step, bs (base del contador), off:[0|1 ×4] (ofrendas dejadas), t:{capítulo: segundos}, done}`. Activo SOLO mientras el héroe está sobre la isla (columna de la zona) y no se ha terminado; en el resto
//     del mundo manda el tutorial de siempre (GOALS). `?isla=1` o `ISLA.go()` llevan al héroe al varadero; `ISLA.go(n)` salta al paso n; `ISLA.reset()` reinicia.
//   · DESVIACIONES CONOCIDAS (ver el lote ISLA-5 de AGENTS.md): ISLA-9 (21 oct 2026): Gabriel SÍ se pelea, en la ARENA DEL VIGÍA (fuera de la isla) con intro cinemática `gabrielIntro`; «Escapa» se reduce a hablar con Remiel; sin bancos de nubes.
// Para AÑADIR un paso: una fila en STEPS (y, si hace falta una condición nueva, una rama en `done()`); los diálogos de los maestros están en villagers.js (`EXILES`).
const ISLA=(()=>{
 const T=32,CAPS=['Llegada','Manos de tierra','Fuego','Agua y cocina','La Palestra','El cofre','El ritual','Escapa'];
 // ofrendas del ritual: [objeto, brasero (tiles desde el centro)] — los 4 braseros están en sky-biome.js alrededor del Altar Quebrado
 const AR=[6,35];   // ARENA DEL VIGÍA (disco de mármol sobre una plataforma FUERA de la isla, al sur, unida por un camino de rocas; sky-biome.js `arenaG`, coast.js `ZI`): centro en tiles desde el centro de la isla. Las ofrendas se llevan AQUÍ y aquí se pelea contra Gabriel
 const OFR=[['of_tronco',3.6,32.6],['of_estano',8.4,32.6],['of_espada',3.6,37.4],['of_camaron',8.4,37.4]];   // 21 oct 2026: OFRENDAS = objetos EXCLUSIVOS del tutorial (game.js `I`, valor 0) que aparecen en el banco al depositar; así el paso no depende de lo que el jugador haya gastado o equipado
 // MISIONES TIPO WOW (21 oct 2026): cada maestro da UNA misión con 3 fases = 3 tipos de paso: `ph:'a'` (ACEPTAR: el maestro tiene un «!»; se acepta en su diálogo), los pasos de OBJETIVO (el maestro muestra un «?» gris) y `ph:'t'` (ENTREGAR: «?» dorado; hay que volver y entregar lo que pide `deliver`, y recibir `reward`). Los textos y datos de cada misión están en QUESTS.
 const QUESTS=[
  {npc:'v:9:raguel',name:'Despertar',hi:'Bienvenido, viajero.',desc:'Cuando llegaste traías algo contigo. Recoge tus pertenencias en la caja de la punta oeste, junto a un árbol (te marcaré el camino), mira qué encuentras y tráemelo.',rem:'Busca en la caja de la punta oeste y abre la Mochila.',turn:'¿Encontraste algo?',deliver:{pendiente:1},done:'Es tuyo: lo llevabas al caer. Quédate con lo que recuerdes. Ahora ve al olivar, al oeste, y habla con Sariel: ella te enseña a talar y minar.',coins:5},
  {npc:'v:9:sariel',name:'Manos de tierra',hi:'Hay trabajo que hacer.',desc:'Necesito 3 troncos de olivo y, de la cantera del norte, 2 de cobre y 2 de estaño. Tráemelos.',rem:'Tala olivos y mina cobre y estaño en la cantera del norte.',turn:'¿Traes los materiales?',deliver:{logs:3,cobre:2,estano:2},reward:{cobre:2,estano:1,logs:1},coins:15,done:'Gracias. Quédate con lo que te sirva. Ve al Ágora y habla con Uriel.'},
  {npc:'v:9:uriel',name:'Fuego',hi:'El fuego no espera.',desc:'Funde 2 barras de cobre en el horno y forja una espada de cobre en el yunque. Luego tráemela.',rem:'Funde las barras en el horno y forja la espada en el yunque.',turn:'¿Está lista la espada?',deliver:{sw_cobre:1},reward:{sw_cobre:1},coins:25,done:'Buen filo. Llévatela. Ve a la fuente y habla con Rafael.'},
  {npc:'v:9:rafael',name:'Agua y cocina',hi:'Ven, siéntate un momento.',desc:'Pesca 3 camarones en la fuente y cocina 2 en la cocina de aquí al lado. Tráeme los cocinados.',rem:'Pesca en la fuente y cocina en la cocina, junto a Rafael.',turn:'¿Los camarones?',deliver:{c_camaron:2},reward:{c_camaron:1},coins:25,done:'Excelente. Guarda uno. Ve a la Palestra y habla con Miguel.'},
  {npc:'v:9:miguel',name:'La Palestra',hi:'Firme. Mirada al frente.',desc:'Practica con los corderos de nube de la Palestra: golpea, carga un golpe, esquiva y bloquea. Te presto un arco, un bastón y un escudo: pruébalos y elige con qué arma te enfrentarás a Gabriel. Vuelve cuando acabes.',rem:'Practica con los corderos de nube de la Palestra.',turn:'¿Has terminado?',give:{bw_pino:1,st_pino:1,sh_cobre:1},done:'Bien. Quédate con las armas y elige la tuya. Deposita todo en el banco, saca del banco las 4 ofrendas que aparecerán allí y llévalas a la Arena del Vigía, al sur, fuera de la isla.',coins:40}];
 const QS=(q,ph,o)=>Object.assign({q,ph,npc:QUESTS[q].npc,g:{t:'talk',k:QUESTS[q].npc}},o);
 const BOXP=[-27,-7.5];   // caja de las pertenencias (tiles desde el centro de la isla): en la PUNTA OESTE, junto a un olivo, a ≈ 20 tiles de la llegada (hay que caminar)
 const STEPS=[
  QS(0,'a',{cap:0,txt:'Habla con Raguel'}),
  {cap:0,txt:'Recoge tus pertenencias en la caja de la punta oeste',at:BOXP,g:{t:'item',k:'pendiente'}},
  {cap:0,txt:'Abre la Mochila',g:{t:'panel'},hint:'inv'},
  QS(0,'t',{cap:0,txt:'Entrégale el pendiente a Raguel'}),
  QS(1,'a',{cap:1,txt:'Habla con Sariel, en el olivar'}),
  {cap:1,txt:'Tala 3 troncos de olivo',at:[-20,-6.5],g:{t:'got',k:'logs',n:3}},
  {cap:1,txt:'Mina 2 de cobre en la cantera',at:[-5.5,-14.8],g:{t:'got',k:'cobre',n:2}},
  {cap:1,txt:'Mina 2 de estaño',at:[-5.5,-14.8],g:{t:'got',k:'estano',n:2}},
  QS(1,'t',{cap:1,txt:'Vuelve con Sariel y entrégale los materiales'}),
  QS(2,'a',{cap:2,txt:'Habla con Uriel, en el Ágora'}),
  {cap:2,txt:'Funde 2 barras de cobre en el horno',at:[.4,-5.4],g:{t:'make',k:'b_cobre',n:2}},
  {cap:2,txt:'Forja una espada de cobre en el yunque',at:[3.6,-5.4],g:{t:'make',k:'sw_cobre',n:1}},
  QS(2,'t',{cap:2,txt:'Vuelve con Uriel y entrégale la espada'}),
  QS(3,'a',{cap:3,txt:'Habla con Rafael, junto a la fuente'}),
  {cap:3,txt:'Pesca 3 camarones en la fuente',at:[8,0],g:{t:'got',k:'camaron',n:3}},
  {cap:3,txt:'Cocina 2 camarones en la cocina de Rafael',at:[13,-2.4],g:{t:'make',k:'c_camaron',n:2}},
  QS(3,'t',{cap:3,txt:'Vuelve con Rafael y entrégale los camarones'}),
  QS(4,'a',{cap:4,txt:'Habla con Miguel, en la Palestra'}),
  {cap:4,txt:'Apunta con el ratón y pulsa LMB: golpea a un cordero (3 golpes)',at:[14,10],g:{t:'cnt',k:'swing',n:3}},
  {cap:4,txt:'Mantén LMB+RMB a la vez para cargar un golpe y suéltalo (gasta resistencia)',at:[14,10],g:{t:'cnt',k:'charged',n:1}},
  {cap:4,txt:'Esquiva con ESPACIO (2 veces)',g:{t:'dash',k:'dash',n:2},hint:'Espacio'},
  {cap:4,txt:'Mantén RMB para bloquear (1 vez)',g:{t:'cnt',k:'bstart',n:1}},
  {cap:4,txt:'Equipa el arco de Miguel (Mochila)',g:{t:'eq',slot:'w',k:'bw_pino'}},
  {cap:4,txt:'Dispara 3 flechas a los corderos (LMB hacia ellos)',at:[14,10],g:{t:'cnt',k:'shot',n:3}},
  {cap:4,txt:'Equipa el bastón de Miguel (Mochila)',g:{t:'eq',slot:'w',k:'st_pino'}},
  {cap:4,txt:'Pulsa 1 para seleccionar la bola de fuego y lánzala con LMB (3 veces; gasta maná)',at:[14,10],g:{t:'cnt',k:'cast',n:3},learn:'cel'},
  {cap:4,txt:'Derrota 3 corderos de nube con el arma que prefieras',at:[14,10],g:{t:'kill',k:'cordero',n:3}},
  QS(4,'t',{cap:4,txt:'Vuelve con Miguel'}),
  {cap:5,txt:'Deposita todo en el banco',at:[21,-3],g:{t:'dep',k:'dep',n:1}},
  {cap:5,txt:'Saca las 4 ofrendas del banco',at:[21,-3],g:{t:'have',k:['of_tronco','of_estano','of_espada','of_camaron']}},
  {cap:6,txt:'Lleva las ofrendas a la Arena del Vigía, al sur, fuera de la isla',at:AR,g:{t:'reach',at:AR,r:5}},
  {cap:6,txt:'Deja las 4 ofrendas en los braseros',at:AR,g:{t:'offer'}},
  {cap:6,txt:'Derrota a Gabriel',at:AR,g:{t:'kill',k:'gabriel',n:1}},
  {cap:6,txt:'…',g:{t:'cine'}},
  {cap:7,txt:'¡Escapa! Corre al borde este',at:[28.5,-0.4],esc:1,g:{t:'reach',at:[28.5,-0.4],r:6}}];
 // 21 oct 2026 (FIX-OFRENDAS): `have` (game.js) cuenta mochila + BANCO, así que «Saca las 4 ofrendas» se daba por cumplido al depositar, y la espada de cobre EQUIPADA no estaba ni en la mochila ni en el banco (el paso no se podía completar). `own` = mochila + equipo (nunca el banco); `give` entrega desde la mochila o, si no, desequipa la pieza.
 const own=k=>S.inv.filter(x=>x===k).length+Object.values(S.eq).filter(x=>x===k).length;
 const give=k=>{const j=S.inv.indexOf(k);if(j>=0){S.inv.splice(j,1);return}const sl=Object.keys(S.eq).find(x=>S.eq[x]===k);if(sl){S.eq[sl]=null;try{syncTools()}catch(e){}}};
 // ANTI-BRICK: en los pasos «saca» y «deja» las ofrendas que falten (aún no entregadas) se vuelven a poner en el BANCO, pase lo que pase
 const grantOfr=()=>{const i=S.isla,g=cur().g;if(!i||(g.t!=='have'&&g.t!=='offer'))return;let n=0;OFR.forEach(([it],k)=>{if(g.t==='offer'&&i.off[k])return;if(own(it)+(S.bank[it]||0)<1){S.bank[it]=1;n++}});if(n){dirty=1;try{toast('Aparecen ofrendas en tu <b>banco</b>',2600);snd('rare')}catch(e){}}}
 const st=()=>S.isla||(S.isla={step:0,bs:0,off:[0,0,0,0],t:{},done:0});
 const zone=()=>BIOMES.zone,B9=()=>BIOMES.list[9],wp=(tx,ty)=>{const b=B9();return{x:b.ox+b.w/2+tx*T,y:b.oy+b.h/2+ty*T}};
 const cur=()=>STEPS[Math.min(st().step,STEPS.length-1)];
 const key=g=>g.t==='kill'?'kill:'+g.k:g.t==='got'?'got:'+g.k:g.t==='make'?'make:'+g.k:g.k;
 const base=()=>{const g=cur().g;st().bs=(g.t==='kill'||g.t==='got'||g.t==='make'||g.t==='run'||g.t==='dep'||g.t==='dash'||g.t==='cnt')?(S.st[key(g)]||0):0};
 const on=()=>{try{const z=zone();return !!z&&!st().done&&P.x>=z.x0&&!(typeof INT!=='undefined'&&INT)}catch(e){return false}};
 const prog=()=>{const g=cur().g,i=st();if(g.t==='offer')return[i.off.reduce((a,b)=>a+b,0),4];if(g.n)return[Math.min(g.n,(S.st[key(g)]||0)-i.bs),g.n];if(g.t==='have')return[g.k.filter(k=>own(k)>=1).length,g.k.length];return null};
 function adv(){const i=st(),c=cur().cap;i.step++;cs=0;i.off=[0,0,0,0];if(i.step>=STEPS.length){finish();return}base();if(cur().esc)startEscape();dirty=1;try{snd('quest')}catch(e){}
  const n=cur();toast('✔ '+(n.cap!==c?'<b>'+CAPS[n.cap]+'</b>':'Hecho'),1800);save()}
 function finish(){const i=st();i.done=1;i.lock=0;try{MUSIC.scene('all_i_had_to_do',false)}catch(e){}   // 22 oct 2026: el FUNDIDO A NEGRO empieza YA (antes se apagaba el cielo en llamas ANTES de oscurecer y se veía regenerarse): `endEscape` y el reseteo ocurren con la pantalla en negro (callback de PLAYA.start)
 const rest=()=>{endEscape();
  // «Despiertas…»: se pierde TODO lo de la isla (mochila, banco de nubes, equipo y monedas); se conservan la apariencia, los descubrimientos y los niveles despertados (nivel 1)
  S.inv.length=0;S.bank={};for(const k in S.eq)S.eq[k]=null;S.coins=0;try{S.amn=0}catch(e){}tipHide();dirty=1;save()};
 if(typeof PLAYA!=='undefined')PLAYA.start(rest);else{rest();const b=BIOMES.list[0];if(typeof CHEAT!=='undefined'&&CHEAT.tp)CHEAT.tp(b.ox+b.spawn[0],b.oy+b.spawn[1])}}
 const done=()=>{const g=cur().g,i=st();
  switch(g.t){case'talk':case'altar':case'cine':return false;   // los resuelven talk()/altar()/el final de la cinemática
   case'reach':{const q=wp(g.at[0],g.at[1]);return Math.hypot(q.x-P.x,q.y-P.y)<g.r*T}
   case'panel':return typeof TB!=='undefined'&&TB==='inv'&&typeof panelOpen==='function'&&panelOpen();
   case'have':return g.k.every(k=>own(k)>=1);
   case'item':return have(g.k)>=1;
   case'eq':return String(S.eq[g.slot]||'').split('~')[0]===g.k;
   case'offer':return i.off.every(v=>v);
   default:if(g.t==='kill'&&g.k==='gabriel')return !!(gm&&gk>=0&&(S.st['kill:gabriel']||0)>gk);   // solo cuenta si ESTA sesión peleó y venció a Gabriel (una partida cargada nunca lo da por muerto)
    return(S.st[key(g)]||0)-i.bs>=g.n}};
 let sp=0,cs=0,chT=0,now_=0,chI=0,box=null;
 // CAJA DE PERTENENCIAS (misión de Raguel): un cofre pequeño (PO con pk 'cajaIsla') junto al borde; F o LMB → `search`: barra de casteo de 5 s con el héroe agachado buscando → recibes el PENDIENTE que llevabas al caer.
 function boxInit(){if(box&&PO.includes(box))return;if(typeof PO==='undefined')return;const q=wp(BOXP[0],BOXP[1]),got=st().step>1||st().done;box=PO.find(p=>p.pk==='cajaIsla')||null;if(!box){box={po:1,id:'isla_caja',pk:'cajaIsla',n:got?'cofreAbierto':'cofre',nm:'Caja de pertenencias',x:q.x,y:q.y,k:9,_oa:1};PO.push(box)}}
 function search(e){const n=cur();if(!on()||n.g.t!=='item'||have('pendiente')>=1){toast('Una caja vieja. Ya no queda nada dentro.',1800);return}
  if(typeof castStart==='function')castStart('Buscando entre tus cosas…',5000,()=>{add('pendiente');if(e)e.n='cofreAbierto';try{toast('Encuentras: <b>Pendiente de plata</b>',2800);snd('rare')}catch(x){}dirty=1},{e})}
 const CHK=[[8.5,7],[14.5,4.8],[20,6.5],[10.5,14],[16.2,10.6],[21.5,11.5]];   // corderos de nube NEUTRALES (como las gallinas), bien separados (≥ 5 tiles) por la Palestra
 // asegura `n` corderos de nube vivos en la Palestra: crea las que falten en los puntos de CHK (en orden, determinista)
 function chickens(n){if(typeof mob!=='function'||!zone())return;const nw=performance.now();let live=M.filter(m=>m.d.id==='cordero'&&m.hx>=zone().x0&&alive(m,nw)).length;for(let k=0;k<CHK.length&&live<n;k++){const [x,y]=CHK[(chI+k)%CHK.length],q=wp(x,y);if(M.some(m=>m.d.id==='cordero'&&alive(m,nw)&&Math.hypot(m.x-q.x,m.y-q.y)<40))continue;mob('cordero',q.x,q.y);live++}chI=(chI+1)%CHK.length}
 function tick(dt){if(!zone())return;
  if(!S.islaInit){S.islaInit=1;if((S.goal||0)===0&&!(S.st&&S.st.talk)&&!/[?&](at=|zone=0)/.test(location.search)){st().lock=1;go(0);save()}}
  if(on()&&st().lock&&!S.islaTip){S.islaTip=1}   // 21 oct 2026: la tarjeta gigante de controles del principio se QUITÓ; los controles se enseñan poco a poco (hintsTick)
  //   // PARTIDA NUEVA: se empieza en la isla (varadero); las partidas con progreso en la Pradera no se tocan
  const i=st();if(!on())return;
  if(qpNpc){const e=ST.find(x=>x.id===qpNpc);if(!e||Math.hypot(e.x-P.x,e.y-P.y)>230)qpHide()}
  if(!sp){sp=1;base();chickens(6);   // PUNTO DE GUARDADO (22 oct 2026): si se carga la partida con el combate de Gabriel pendiente, el jugador aparece en el camino de rocas ANTES de la arena (nunca dentro del combate) y la intro empieza al entrar en ella
  {const g0=cur().g;if(g0.t==='kill'&&g0.k==='gabriel'&&!gm){const q=wp(AR[0],AR[1]-11);P.x=q.x;P.y=q.y;P.g=P.mv=null;try{toast('Retomas el camino hacia la Arena del Vigía.',2600)}catch(e){}}}}
  boxInit()   // 6 gallinas en la Palestra (los cangrejos de nube del plan llegarán con su modelo)
  if(cur().cap===4&&(now_=performance.now())>chT){chT=now_+1500;chickens(4)}   // durante la misión de la Palestra siempre hay ≥ 4 gallinas VIVAS: no hay que esperar al reaparecer para seguir la cadena
  if(cur().esc&&!es)startEscape();
  i.t[cur().cap]=(i.t[cur().cap]||0)+dt;
  grantOfr();
  {const g0=cur().g;if(g0.t==='kill'&&g0.k==='gabriel'&&!gm&&!intro&&Math.hypot(wp(AR[0],AR[1]).x-P.x,wp(AR[0],AR[1]).y-P.y)<7.5*T){if(!fAt)fAt=performance.now()+1400;else if(performance.now()>=fAt){fAt=0;fight()}}}   // última ofrenda → pausa de 1,4 s y arranca la intro del jefe
  if(cur().g.t==='offer'){OFR.forEach(([it,x,y],k)=>{if(i.off[k])return;const q=wp(x,y);if(Math.hypot(q.x-P.x,q.y-P.y)<2.4*T&&own(it)>=1){give(it);i.off[k]=1;dirty=1;try{snd('rare')}catch(e){}toast('El brasero acepta la ofrenda ('+i.off.reduce((a,b)=>a+b,0)+'/4)',1600)}})}
  if(cur().learn&&typeof learnSkill==='function')learnSkill(cur().learn);   // la habilidad se aprende al llegar a su paso
  hintsTick(performance.now());
  gTick(performance.now());if(gAlive()){fightAt=performance.now();bossAt=fightAt}   // música de jefe (src/music.js: DEF[9].jefe = gabriel.mp3) mientras dure el combate

  if(cur().g.t==='cine'&&!cs){cs=1;if(gm){gm.rt=1e15}const end=()=>adv();if(typeof CINE==='undefined'||!CINE.start('caida',{done:end}))end()}
  if(done())adv();dirty=dirty||0}
 // una conversación con un maestro: si es el que pide el paso actual, lo cumple (se llama desde npcTalk)
 function talk(id){}   // (antes avanzaba el paso al hablar; ahora lo hacen las MISIONES: dlg()/accept/turnIn)
 // ── CONTROLES PROGRESIVOS (21 oct 2026): cada ayuda sale UNA vez, cuando el jugador la necesita (ctxHint, game.js). Orden pensado: moverse/cámara al aceptar la 1.ª misión · interactuar al llegar a la caja · Mochila · saltar tras la entrega · combate al llegar a la Palestra (+ Tab con 2+ enemigos cerca) ──
 let hAt=0;
 function hintsTick(now){if(typeof ctxHint!=='function'||!on())return;const s=st().step,n=cur(),T0=now;
  if(s>=1&&!hAt)hAt=now;   // instante en que se aceptó la 1.ª misión
  if(s===1&&now-hAt>1200)ctxHint('move',[[['W','A','S','D'],'moverte'],[['Botón medio'],'mantén y arrastra para girar la cámara'],[['Rueda'],'acercar y alejar']],10000);
  if(s===1&&box&&box.n==='cofre'&&Math.hypot(box.x-P.x,box.y-P.y)<150)ctxHint('interact',[[['F'],'interactuar con lo que tengas delante']],7000);
  if(s===1&&now-hAt>14000)ctxHint('run',[[['Mayús'],'mantén para correr (gasta resistencia)']],7000);
  if(n.g.t==='panel')ctxHint('bag',[[[],'abre la <b>Mochila</b>: primer icono del menú de la derecha']],8000);
  if(s>=3&&s<8&&now-hAt>8000)ctxHint('jump',[[['V'],'saltar (sin gastar resistencia)']],6000);
  if(n.g.t==='eq')ctxHint('equip',[[[],'abre la <b>Mochila</b> y pulsa LMB sobre el objeto para equiparlo']],7000);
  if(n.g.t==='cnt'&&n.g.k==='cast')ctxHint('fire',[[['1'],'selecciona la bola de fuego (barra bajo la vida; se ve resaltada)'],[['LMB'],'lánzala hacia el cursor (necesita bastón y maná)'],[['LMB+RMB'],'mantenlos para cargarla: más grande y arde']],7500);
  if(n.cap===4&&n.g.t==='cnt'&&n.g.k==='bstart')ctxHint('blockT',[[['RMB'],'mantén para bloquear'],[['RMB','justo al golpe'],'parada perfecta: sin daño ni gasto']],6500);   // el bloqueo se enseña AQUÍ (Palestra), no durante el combate de Gabriel
  if(n.cap===4&&n.g.t==='cnt')ctxHint('attack',[[['LMB'],'golpear hacia donde apunta el ratón'],[['Mantén LMB'],'golpes seguidos'],[['LMB+RMB'],'cargar un golpe más fuerte'],[['Espacio'],'esquivar'],[['RMB'],'mantén para bloquear']],10000);
  if(n.cap===4&&M.filter(m=>m.d.id==='cordero'&&alive(m,performance.now())&&Math.hypot(m.x-P.x,m.y-P.y)<260).length>=2&&S.ctxh&&S.ctxh.attack)ctxHint('tab',[[['Tab'],'fijar y cambiar de enemigo']],8000)}
 // ── MISIONES TIPO WOW: marcador del PNJ y diálogo con opciones ──
 const qIdx=(q,ph)=>STEPS.findIndex(x=>x.q===q&&x.ph===ph),qOf=id=>QUESTS.findIndex(x=>x.npc===id);
 const needOk=q=>{const d=QUESTS[q].deliver;return !d||Object.entries(d).every(([k,n])=>have(k)>=n)};
 // «!» = misión disponible (dorado) · «?» gris = aceptada, en curso · «?» dorado = lista para entregar. null = sin marcador.
 function mark(id){if(!on())return null;const q=qOf(id);if(q<0)return null;const s=st().step,a=qIdx(q,'a'),t=qIdx(q,'t');
  if(s===a)return{c:'!',k:'new'};if(s>a&&s<t)return{c:'?',k:'wait'};if(s===t)return{c:'?',k:needOk(q)?'done':'wait'};return null}
 const nm=k=>(typeof I!=='undefined'&&I[k]?I[k][0]:k),close=()=>{try{HUDSU.dlgHide()}catch(e){}};
 const list=(o,chk)=>Object.entries(o).map(([k,n])=>(chk?'<span style="color:'+(have(k)>=n?'#9bd04f':'#d86a5a')+'">'+Math.min(have(k),n)+'/'+n+'</span> ':n+' × ')+nm(k)).join(' · ');
 function open(D,o){DL=Object.assign({n:D.n,id:D.id,c:D.c,i:0},o);dlgShow()}
 // ── PANEL DE MISIÓN (estilo WoW con nuestra UI): lo abre la opción del diálogo. `ph` 'a' = aceptar/rechazar · 't' = completar. Título, descripción, objetivos, entrega y recompensa. ──
 let qp=null,qpNpc=null;
 const coin=n=>'<li class="qp-c"><i class="cn"></i><span>'+n+' monedas de cobre</span></li>';
 const rwd=Q=>(Q.reward||Q.coins)?'<div class="qp-s">Recompensa</div><ul class="qp-i">'+(Q.reward?rows(Q.reward):'')+(Q.coins?coin(Q.coins):'')+'</ul>':'';
 const rows=o=>Object.entries(o).map(([k,n])=>'<li>'+(typeof ic==='function'?ic(k):'')+'<span>'+n+' × '+nm(k)+'</span></li>').join('');
 function qpHide(){if(qp){qp.classList.remove('on');const e=qp;setTimeout(()=>{if(qp!==e||!e.classList.contains('on'))e.style.display='none'},250)}qpNpc=null}
 function qpShow(q,ph,D){const Q=QUESTS[q];if(!qp){qp=document.createElement('div');qp.id='qpn';document.body.appendChild(qp);qp.addEventListener('click',e=>e.stopPropagation())}
  const a=qIdx(q,'a'),t=qIdx(q,'t'),obj=STEPS.slice(a+1,t).map(x=>'<li>'+x.txt+'</li>').join('');
  let h='<div class="qp-h"><b>'+(ph==='a'?'!':'?')+'</b><div><div class="qp-t">'+Q.name+'</div><div class="qp-n">'+(D&&D.n?D.n.split(' · ')[0]:'')+'</div></div></div><div class="qp-r"></div>';
  if(ph==='a'){h+='<div class="qp-d">'+Q.desc+'</div>'+(obj?'<div class="qp-s">Objetivos</div><ul class="qp-o">'+obj+'</ul>':'')+(Q.deliver?'<div class="qp-s">Debes entregar</div><ul class="qp-i">'+rows(Q.deliver)+'</ul>':'')+rwd(Q)
   +'<div class="qp-b"><button data-a="ok">Aceptar</button><button data-a="no" class="g">Rechazar</button></div>'}
  else{const ok=needOk(q);h+='<div class="qp-d">'+(Q.deliver?'Necesito:':'¿Has completado lo que te pedí?')+'</div>'+(Q.deliver?'<ul class="qp-i">'+Object.entries(Q.deliver).map(([k,n])=>'<li class="'+(have(k)>=n?'y':'n')+'">'+(typeof ic==='function'?ic(k):'')+'<span>'+Math.min(have(k),n)+'/'+n+' '+nm(k)+'</span></li>').join('')+'</ul>':'')+rwd(Q)
   +'<div class="qp-b"><button data-a="ok"'+(ok?'':' disabled')+'>Completar misión</button><button data-a="no" class="g">Cerrar</button></div>'}
  qp.innerHTML=h;qp.querySelectorAll('button').forEach(b=>b.onclick=()=>{const yes=b.dataset.a==='ok';qpHide();if(!yes)return;if(ph==='a')accept(q);else turnIn(q,D)});
  qp.style.display='flex';void qp.offsetWidth;qp.classList.add('on');qpNpc=Q.npc}
 addEventListener('keydown',e=>{if(!qpNpc)return;if(e.key==='Escape'){qpHide();e.preventDefault();e.stopImmediatePropagation()}},true);
 function accept(q){const Q=QUESTS[q];if(!mark(Q.npc)||mark(Q.npc).k!=='new')return;adv();if(Q.give){for(const[k,n]of Object.entries(Q.give))for(let j=0;j<n;j++){if(typeof room==='function'&&!room(k))S.bank[k]=(S.bank[k]||0)+1;else add(k)}try{toast('Miguel te presta: <b>'+list(Q.give,0)+'</b>',3400)}catch(e){}}try{toast('❕ Misión aceptada: <b>'+Q.name+'</b>',2600);snd('quest')}catch(e){}}
 function turnIn(q,D){const Q=QUESTS[q];if(!needOk(q)){try{toast('Te falta algo por entregar.',1800)}catch(e){}return}
  if(Q.deliver)take(Q.deliver);let ex='';if(Q.reward){for(const[k,n]of Object.entries(Q.reward))for(let j=0;j<n;j++){if(typeof room==='function'&&!room(k))S.bank[k]=(S.bank[k]||0)+1;else add(k)}ex='<br><span style="color:#e8cf94">Recibes: '+list(Q.reward,0)+'</span>'}
  if(Q.coins){earn(Q.coins);ex+=(ex?'<br>':'<br>')+'<span style="color:#e8cf94">'+Q.coins+' monedas de cobre</span>'}
  adv();try{toast('✔ Misión completada: <b>'+Q.name+'</b>',2800);snd('quest')}catch(e){}
  open(D,{p:[Q.done+ex]})}
 // Aplica la misión del maestro `id` al diálogo `D` (lo llama npcTalk): saludo + OPCIONES numeradas (el nombre de la misión / salir). El detalle (descripción, recompensa, aceptar/rechazar) está en el PANEL DE MISIÓN.
 function dlg(D,id){const m=mark(id);if(!m)return false;const q=qOf(id),Q=QUESTS[q],ex=['Salir',close];qpHide();
  const pan=ph=>()=>{close();qpShow(q,ph,D)};
  if(m.k==='new'){D.p=[Q.hi];D.opts=[[Q.name,pan('a')],ex]}
  else if(st().step===qIdx(q,'t')){D.p=[Q.turn];D.opts=[[Q.name,pan('t')],ex]}
  else{D.p=[Q.rem];D.opts=[ex]}
  return true}
 // el Altar Quebrado: en el paso del ritual hace aparecer a GABRIEL (combate de 3 fases, `fight()`); fuera de él solo avisa
 function altar(){if(!on())return false;const g=cur().g;if(g.t!=='altar'){toast('El altar guarda silencio.',1800);return true}adv();fight();return true}
 // ── COMBATE DE GABRIEL (ISLA-6): jefe «elite» del tutorial. Fase 1 (100–66 % de vida): golpe pesado básico · Fase 2 (<66 %): además marca el suelo bajo tus pies (`met`) · Fase 3 (<33 %): onda expansiva (`nov`), furia y más rápido.
 // Las mecánicas son las de combat.js (`BM.gabriel` se reescribe por fase). El héroe NO puede morir aquí (`noDie`): el golpe «se detiene». Al caer, la cinemática `caida`.
 let gm=null,gph=0;
 const gAlive=()=>!!(gm&&gm.hp>0&&(!gm.rt||gm.rt<=performance.now()));
 // INTRO + COMBATE: la cinemática `gabrielIntro` (cine.js) baja a Gabriel del cielo sobre la arena; al acabar (o saltarla) aparece el combatiente en ese mismo sitio. 30 de vida, 3 fases, golpes con anticipación de brazo (game.js `wind.slow`).
 let intro=0,fAt=0,gk=-1;   // gk = contador de muertes de Gabriel al EMPEZAR el combate de esta sesión
 function spawnBoss(){gk=S.st['kill:gabriel']||0;const q=wp(AR[0],AR[1]);if(!gm||!M.includes(gm)){mob('gabriel',q.x,q.y);gm=M[M.length-1];gm.elite=1}
  gm.x=gm.hx=gm.tx=q.x;gm.y=gm.hy=gm.ty=q.y;gm.mh=gm.hp=30;gm.sgM=null;gm.stun=0;gm.sgIm=0;gm.rip=0;gm.dm=3;gm.hunt=1;gm.rt=0;gm.asx=1;gm.gc=0;gm.tel=null;gm.wind=null;gm.nt=performance.now()+1500;gph=0;BM.gabriel=[];
  try{banner('Gabriel','El vigía del Cielo','#e8cf94',3000)}catch(e){}try{log('✦ <b>Gabriel</b> te mira. Vigila su brazo: cuando lo alza, esquiva.')}catch(e){}}
 function fight(){if(typeof mob!=='function'||intro)return;const q=wp(AR[0],AR[1]);if(typeof bossMusic==='function')bossMusic(16000);   // la música del jefe empieza al EMPEZAR a aparecer (intro)
 
  if(typeof CINE!=='undefined'&&CINE.SCENES&&CINE.SCENES.gabrielIntro){intro=1;CINE.SCENES.gabrielIntro.anchor=[q.x,q.y];
   if(CINE.start('gabrielIntro',{done:()=>{intro=0;spawnBoss()}}))return;intro=0}
  spawnBoss()}
 function gTick(now){if(!gm||!M.includes(gm))return;const r=gm.hp/gm.mh;if(gm.hp<=0)return;const ph=r<.33?3:r<.66?2:1;if(ph===gph)return;gph=ph;
  if(ph===2){BM.gabriel=['met'];gm.asx=.85;try{banner('Segunda fase','Gabriel marca el suelo','#e8cf94',2600);log('✦ <b>Gabriel</b> levanta la mirada: marca el suelo bajo tus pies. ¡Muévete!')}catch(e){}}
  else if(ph===3){BM.gabriel=['met','nov','enr'];gm.asx=.7;try{banner('Tercera fase','Gabriel pierde el control','#ff9a3a',2600);log('✦ <b>Gabriel</b> abre las alas rotas: carga una onda de luz. ¡Aléjate!')}catch(e){}}}
 // MUERTE EN EL COMBATE (ISLA-7; antes el golpe «se detenía»): si caes ante Gabriel, despiertas un poco antes de él (a 6,5 tiles al sur del altar) con la vida llena, y Gabriel vuelve a su sitio con la vida completa y la fase 1.
 // Devuelve true si ha gestionado la muerte (die() de game.js no hace nada más); fuera del combate de Gabriel devuelve false y die() es el de siempre.
 function noDie(){if(!on()||!gAlive())return false;P.dot=null;STS.clear(P);try{HOT=[]}catch(e){}P.pjM=null;M.forEach(m=>m.hunt=0);P.hp=maxHp();const q=wp(AR[0],AR[1]-5.2);P.x=q.x;P.y=q.y;try{FD=performance.now()}catch(e){}P.g=P.mv=null;stopA();
  const g=wp(AR[0],AR[1]);gm.x=gm.hx=gm.tx=g.x;gm.y=gm.hy=gm.ty=g.y;gm.hp=gm.mh;gm.hunt=0;gm.tel=null;gm.sgM=null;gm.stun=0;gm.sgIm=0;gm.rip=0;gm.asx=1;gm.en=0;gm.dm=2;gph=0;BM.gabriel=[];try{snd('die')}catch(e){}toast('☠️ Gabriel te derriba. Despiertas al borde de la arena.',2800);return true}
 // «ESCAPA»: la isla arde. Desaparecen TODOS los PNJ (y los corderos), el cielo se vuelve rojo (`R3D.skyBurn`), el pasto naranja (`uBurn`), las nubes de fuego y caen brasas (r3d.js `burnFx`). Se invoca al entrar en el paso `esc`.
 let es=0;const gone=[];
 function startEscape(){if(es)return;es=1;try{MUSIC.scene('all_i_had_to_do',true)}catch(e){}for(let k=ST.length-1;k>=0;k--){const e=ST[k];if(e.k===9&&e.npc){gone.push(e);ST.splice(k,1)}}
  for(let k=M.length-1;k>=0;k--){const m=M[k];if(zone()&&m.hx>=zone().x0&&m.d.id==='cordero'){gone.push({mob:m});M.splice(k,1)}}
  try{R3D.skyBurn=1}catch(e){}try{banner('¡Escapa!','El cielo arde','#ff6a3a',3600)}catch(e){}try{log('🔥 El cielo arde. Todo lo que conocías desaparece… ¡corre!')}catch(e){}}
 function endEscape(){es=0;try{MUSIC.scene('all_i_had_to_do',false)}catch(e){}try{R3D.skyBurnReset()}catch(e){}gone.splice(0).forEach(e=>{if(e.mob)M.push(e.mob);else ST.push(e)})}
 // tarjeta de bienvenida (UI Susurro: cristal + trazo dorado): cómo moverse, correr, esquivar y golpear; se cierra con el botón o con cualquier tecla de acción
 let tipEl=null;
 function tipShow(){if(tipEl||S.islaTip)return;const R=(k,t)=>`<div class="rw"><div class="ks">${k}</div><span>${t}</span></div>`;tipEl=document.createElement('div');tipEl.id='isla-tip';
  tipEl.innerHTML='<h3>DESPIERTAS</h3><div class="sb">Así se mueve este cuerpo</div>'+R('<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>','Moverte')+R('<kbd>Mayús</kbd>','Correr (mantén; gasta resistencia)')+R('<kbd>Espacio</kbd>','Esquivar: un paso rápido que te protege un instante')+R('<kbd>LMB</kbd>','Golpear hacia donde apunta el ratón')+R('<kbd>Mantén LMB</kbd>','Golpes seguidos')+R('<kbd>LMB+RMB</kbd>','Mantener ambos: cargar el golpe y soltarlo, pega mucho más')+R('<kbd>Tab</kbd>','Fijar y cambiar de enemigo')+R('<kbd>F</kbd>','Hablar, entrar y usar lo que tengas delante')+'<button>ENTENDIDO</button>';
  document.body.appendChild(tipEl);tipEl.querySelector('button').onclick=()=>{S.islaTip=1;tipHide();save()}}
 function tipHide(){if(tipEl){tipEl.remove();tipEl=null}}
 function lock(){return !!(S.isla&&S.isla.lock&&!S.isla.done)}
 function html(){const n=cur(),i=st(),p=prog();
  return `<div class="hint" style="margin:0 0 3px;color:#d8c9a3">${CAPS[n.cap]} · Despertar ${Math.min(i.step+1,STEPS.length)}/${STEPS.length}</div><div style="color:var(--yl);font-size:25px">${n.txt}</div>`+(p?`<div class="hint" style="margin:2px 0">${p[0]}/${p[1]}</div><div class="bar"><i style="width:${p[0]/p[1]*100}%"></i></div>`:'')}
 // objetivo de la flecha dorada (px de mundo) del paso actual: el PNJ pedido o el punto `at`; en el ritual, el brasero que falte
 function target(){if(!on())return null;const n=cur();if(n.g.t==='offer'){const k=st().off.indexOf(0);if(k>=0){const q=wp(OFR[k][1],OFR[k][2]);return q}}
  if(n.npc){const e=ST.find(s=>s.id===n.npc);if(e)return e}if(n.at)return wp(n.at[0],n.at[1]);return null}
 function go(n){const i=st();if(n!=null){i.step=Math.max(0,Math.min(STEPS.length-1,n|0));i.off=[0,0,0,0];i.done=0;base();dirty=1}
  const q=wp(-26,12.4);if(typeof CHEAT!=='undefined'&&CHEAT.tp)CHEAT.tp(q.x,q.y);return i.step}
 function reset(){try{if(typeof PLAYA!=='undefined')PLAYA.reset()}catch(e){}const bi=PO.findIndex(p=>p.pk==='cajaIsla');if(bi>=0)PO.splice(bi,1);box=null;endEscape();tipHide();if(gm&&M.includes(gm))M.splice(M.indexOf(gm),1);gm=null;gph=0;cs=0;intro=0;fAt=0;S.isla={step:0,bs:0,off:[0,0,0,0],t:{},done:0,lock:1};S.awk={};S.islaTip=0;sp=0;if(S.cine)delete S.cine.gabriel;dirty=1;return go(0)}
 if(/[?&]isla=1\b/.test(typeof location!=='undefined'?location.search:''))setTimeout(()=>{try{go()}catch(e){}},4000);
 return{fightOn:()=>!!(gAlive()||intro),bossOn:()=>!!(gAlive()&&!intro),STEPS,QUESTS,CAPS,OFR,lock,on,tick,talk,mark,dlg,search,altar,html,target,go,reset,prog,adv,altar2:fight,fight,noDie,get boss(){return gm},get step(){return st().step},get state(){return st()}}})();
