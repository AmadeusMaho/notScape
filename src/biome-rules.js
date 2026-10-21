// NotScape · MOTOR DE BIOMA (Bloque B · B3 / «ID0», 20 oct 2026; diseño aprobado por el dueño). Script clásico, globales `BIOME_RULES` (datos) y `BR` (motor). Se carga ANTES de game.js (usa sus globales solo al llamar).
// QUÉ ES: UNA fila por bioma (mismo índice que `BIOMES.list`) con las REGLAS DE JUEGO que cambian de un bioma a otro: clima (eventos con aviso), fauna, noche, viaje, maestro y estilo de combate.
//   REGLA DE ORO: REFERENCIAR, NO DUPLICAR. Las paletas y el arte siguen donde están (`biomes.js pal/dec`, `ambient.js E`, `particles3d.js BIOME_W`, `rays3d.js BIOMA_K`, `r3d.js BT`, `villagers.js CU`…);
//   aquí van las reglas y, cuando haga falta, un puntero a esas tablas. Un bioma nuevo = una fila aquí (+ lo suyo en esas tablas de arte).
// REGLAS DEL DUEÑO (no se rompen): NINGÚN evento hace daño ni bloquea (no es un survival); el jugador siempre puede esperar a que pase; el aviso va ANTES; lo ambiental solo cambia cómo se VE / se OYE.
// EVENTOS DE CLIMA: {id, kind, w (peso entre los del bioma), msg:{aviso,ini,fin}, aviso (s), dura [s,s], wet (0..0,36: lluvia .18, tormenta .36; lo lee el 3D), vis (0..1: radio de visión; 1 = normal),
//   snd (0..1 volumen), mapa (0..1 difuminado del minimapa), fog (color de la niebla radial), rayos (relámpagos+trueno)}. Cada bioma: `p` = probabilidad por tirada y `cada` [s,s] entre tiradas.
// SALIDAS (suavizadas, 1 = normal): BR.vis → niebla radial en el pase de grado (r3d.js uniforms uFog/uFogC); BR.snd → volumen maestro (game.js AMASTER); BR.map → difuminado de WMAP.local; BR.wet → lluvia (WXD).
//   `weather()` de game.js solo llama a BR.update y copia WX.t/WXD/rayos para el código antiguo (ambient.js, 3D).
// PRUEBAS: BR.trigger('id') (cualquier evento del bioma actual o de BR.TEST), CHEAT.event(id), `tools/biome_rules_check.py` (valida cada fila).
// RESERVADOS (se rellenan en la fase de cada bioma; hoy `null`): fauna (ID2: rutinas y caza), noche (TOD propio), viaje (sendas, balsas, monturas, barco), maestro (B4), estilo (ID4: combate cultural).
const BIOME_RULES=[
 {id:'pradera',cult:0,clima:{p:.3,cada:[60,130],primero:[40,90],ev:[
   {id:'lluvia',kind:'rain',w:1,msg:{aviso:'🌥️ El cielo se cubre…',ini:'🌧️ Empieza a llover.',fin:'☀️ Deja de llover.'},aviso:6,dura:[45,90],wet:.18,vis:1,snd:1,mapa:0}]},
  fauna:null,noche:null,viaje:null,maestro:null,estilo:null},
 {id:'bosque',cult:1,clima:{p:.35,cada:[60,130],primero:[40,90],ev:[
   {id:'lluvia',kind:'rain',w:1,msg:{aviso:'🌥️ El cielo se cubre…',ini:'🌧️ Empieza a llover.',fin:'☀️ Deja de llover.'},aviso:6,dura:[45,90],wet:.18,vis:1,snd:1,mapa:0}]},
  fauna:null,noche:null,viaje:null,maestro:null,estilo:null},
 {id:'pantano',cult:2,clima:{p:.55,cada:[60,130],primero:[40,90],ev:[
   {id:'lluvia',kind:'rain',w:.4,msg:{aviso:'🌥️ El aire se vuelve pesado…',ini:'🌧️ Empieza a llover.',fin:'☀️ Deja de llover.'},aviso:6,dura:[45,90],wet:.18,vis:1,snd:1,mapa:0},
   {id:'tormenta',kind:'storm',w:.6,msg:{aviso:'🌩️ Rugen truenos a lo lejos…',ini:'⛈️ Se acerca una tormenta.',fin:'☀️ Deja de llover.'},aviso:8,dura:[45,90],wet:.36,vis:1,snd:1,mapa:0,rayos:1}]},
  fauna:null,noche:null,viaje:null,maestro:null,estilo:null},
 {id:'cumbres',cult:3,clima:{p:0,cada:[60,130],primero:[40,90],ev:[]},fauna:null,noche:null,viaje:null,maestro:null,estilo:null},   // ventisca: ID1/Cumbres
 {id:'oriental',cult:4,clima:{p:0,cada:[60,130],primero:[40,90],ev:[]},fauna:null,noche:null,viaje:null,maestro:null,estilo:null},
 {id:'volcan',cult:5,clima:{p:0,cada:[60,130],primero:[40,90],ev:[]},fauna:null,noche:null,viaje:null,maestro:null,estilo:null},   // erupciones avisadas: ID1/Volcán
 {id:'paramo',cult:6,clima:{p:0,cada:[60,130],primero:[40,90],ev:[]},fauna:null,noche:null,viaje:null,maestro:null,estilo:null},   // maná salvaje: Páramo
 {id:'desierto',cult:7,clima:{p:0,cada:[60,130],primero:[40,90],ev:[]},fauna:null,noche:null,viaje:null,maestro:null,estilo:null},   // tormenta de arena: ID1/Desierto
 {id:'costa',cult:8,clima:{p:.2,cada:[60,130],primero:[40,90],ev:[
   {id:'lluvia',kind:'rain',w:1,msg:{aviso:'🌥️ Sopla un viento húmedo…',ini:'🌧️ Empieza a llover.',fin:'☀️ Deja de llover.'},aviso:6,dura:[45,90],wet:.18,vis:1,snd:1,mapa:0}]},
  fauna:null,noche:null,viaje:null,maestro:null,estilo:null},
 {id:'cielo',cult:9,clima:{p:0,cada:[600,900],primero:[600,900],ev:[]},fauna:null,noche:null,viaje:null,maestro:null,estilo:null}];   // ZONA del Cielo (ISLA-1): hora dorada permanente, sin eventos de clima
const BR=(()=>{
 const KINDS=['rain','storm','fog','sand','snow','ash','mana','tide'],cl=(v,a,b)=>Math.max(a,Math.min(b,v)),rr=(a,b)=>a+Math.random()*(b-a);
 // evento de PRUEBA (no está en ninguna fila): bruma densa que acorta la vista, apaga el sonido y difumina el minimapa; sirve para ver y medir el cableado (CHEAT.event('prueba'))
 const TEST={id:'prueba',kind:'fog',w:0,msg:{aviso:'🌫️ (prueba) Se levanta una bruma…',ini:'🌫️ (prueba) La bruma lo cubre todo.',fin:'(prueba) La bruma se disipa.'},aviso:3,dura:[25,25],wet:0,vis:.4,snd:.6,mapa:.8,fog:'#a8b0b4'};
 const S={k:-1,ev:null,ph:'calma',t0:0,t1:0,next:0,forced:false,nl:0,flash:0,thunder:0};
 const O={vis:1,snd:1,map:0,wet:0,fog:'#a8b0b4',kind:'',rayos:0,fase:'calma',ev:null};   // salidas SUAVIZADAS
 const row=k=>BIOME_RULES[k]||BIOME_RULES[0],say=m=>{try{if(typeof log==='function')log(m)}catch(e){}};
 const pickEv=r=>{const L=r.clima.ev;if(!L.length)return null;let t=0;L.forEach(e=>t+=e.w);let x=Math.random()*t;for(const e of L){x-=e.w;if(x<=0)return e}return L[L.length-1]};
 function start(ev,now,forced){S.ev=ev;S.ph='aviso';S.forced=!!forced;S.t0=now;S.t1=now+(ev.aviso||0)*1000;if(ev.msg&&ev.msg.aviso&&ev.aviso>0)say(ev.msg.aviso);else activate(now)}
 function activate(now){const ev=S.ev;S.ph='activo';S.t0=now;S.t1=now+rr(ev.dura[0],ev.dura[1])*1000;S.nl=now+rr(3000,8000);if(ev.msg&&ev.msg.ini)say(ev.msg.ini)}
 function stop(now,silent){const ev=S.ev;if(ev&&!silent&&S.ph==='activo'&&ev.msg&&ev.msg.fin)say(ev.msg.fin);S.ev=null;S.ph='calma';S.forced=false}
 // dt en SEGUNDOS, now en ms (como weather() de game.js). k = bioma en el que está el jugador.
 function update(now,dt,k){dt=Math.min(.1,dt||0);const r=row(k);
  if(S.k!==k){S.k=k;if(S.ev&&!S.forced&&!r.clima.ev.some(e=>e.id===S.ev.id))stop(now,true);S.next=0}   // al cambiar a un bioma sin ese evento, se acaba (como antes: «k≥3 → sin lluvia»)
  if(!S.next)S.next=now+rr(r.clima.primero[0],r.clima.primero[1])*1000;
  if(!S.ev&&now>S.next){S.next=now+rr(r.clima.cada[0],r.clima.cada[1])*1000;if(r.clima.p>0&&Math.random()<r.clima.p){const ev=pickEv(r);if(ev)start(ev,now)}}
  if(S.ev){if(S.ph==='aviso'&&now>=S.t1)activate(now);else if(S.ph==='activo'&&now>=S.t1)stop(now)}
  const ev=S.ph==='activo'?S.ev:null,tw=ev?ev.wet:0,tv=ev?ev.vis:1,ts=ev?ev.snd:1,tm=ev?ev.mapa:0,a=Math.min(1,dt*.7);
  O.wet+=(tw-O.wet)*a;O.vis+=(tv-O.vis)*a;O.snd+=(ts-O.snd)*a;O.map+=(tm-O.map)*a;if(ev&&ev.fog)O.fog=ev.fog;
  O.kind=ev?ev.kind:'';O.rayos=ev&&ev.rayos?1:0;O.fase=S.ph;O.ev=ev?ev.id:(S.ev?S.ev.id:null);
  if(O.rayos&&now>S.nl){S.nl=now+rr(6000,15000);S.flash=.6;S.thunder=now+rr(350,900)}   // relámpago y, un poco después, el trueno
  S.flash=Math.max(0,S.flash-dt*2.2);if(S.thunder&&now>S.thunder){S.thunder=0;O.thunder=1}else O.thunder=0;
  O.flash=S.flash;if(Math.abs(O.vis-1)<.002)O.vis=1;if(Math.abs(O.snd-1)<.002)O.snd=1;if(O.map<.002)O.map=0;if(O.wet<.002&&!ev)O.wet=0}
 // fuerza un evento (CHEAT.event / pruebas): ignora el bioma y las probabilidades
 function trigger(id,now){now=now||performance.now();const ev=id==='prueba'?TEST:BIOME_RULES.flatMap(r=>r.clima.ev).find(e=>e.id===id);if(!ev)return false;if(S.ev)stop(now,true);start(ev,now,true);return true}
 const end=()=>{if(S.ev)stop(performance.now())};
 const ids=()=>['prueba',...new Set(BIOME_RULES.flatMap(r=>r.clima.ev.map(e=>e.id)))];
 // validación de las filas (tools/biome_rules_check.py): devuelve la lista de problemas (vacía = OK)
 function validate(){const P=[],ok=(c,m)=>{if(!c)P.push(m)},n=typeof BIOMES!=='undefined'?BIOMES.list.length:BIOME_RULES.length;ok(BIOME_RULES.length===n,'hay '+BIOME_RULES.length+' filas y '+n+' biomas');
  BIOME_RULES.forEach((r,k)=>{const w='fila '+k+' ('+r.id+'): ';ok(typeof r.id==='string'&&r.id,w+'id');ok(Number.isInteger(r.cult)&&r.cult>=0&&r.cult<10,w+'cult fuera de rango');ok(r.clima&&Array.isArray(r.clima.ev),w+'clima.ev');if(!r.clima||!r.clima.ev)return;
   ok(r.clima.p>=0&&r.clima.p<=1,w+'p fuera de 0..1');['cada','primero'].forEach(f=>ok(Array.isArray(r.clima[f])&&r.clima[f].length===2&&r.clima[f][0]>0&&r.clima[f][1]>=r.clima[f][0],w+f+' [min,max]'));
   r.clima.ev.forEach(e=>{const q=w+'evento '+e.id+': ';ok(KINDS.includes(e.kind),q+'kind «'+e.kind+'»');ok(e.w>0,q+'peso');ok(Array.isArray(e.dura)&&e.dura[0]>0&&e.dura[1]>=e.dura[0],q+'dura');ok(e.aviso>=0,q+'aviso');ok(e.msg&&e.msg.ini&&e.msg.fin,q+'msg.ini/fin');
    ['vis','snd','mapa'].forEach(f=>ok(e[f]>=0&&e[f]<=1,q+f+' fuera de 0..1'));ok(e.wet>=0&&e.wet<=.4,q+'wet fuera de 0..0,4');ok(!('dano' in e)&&!('dmg' in e)&&!('bloquea' in e),q+'un evento NO puede dañar ni bloquear')});
   ['fauna','noche','viaje','maestro','estilo'].forEach(f=>ok(r[f]===null||typeof r[f]==='object',w+f+' debe ser null u objeto'))});return P}
 return{update,trigger,end,ids,validate,TEST,get vis(){return O.vis},get snd(){return O.snd},get map(){return O.map},get wet(){return O.wet},get fog(){return O.fog},get kind(){return O.kind},get rayos(){return O.rayos},get flash(){return O.flash},get thunder(){return O.thunder},get fase(){return O.fase},get ev(){return O.ev},row,O}})();
