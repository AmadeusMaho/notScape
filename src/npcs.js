// NotScape · PNJ DE ALDEA (Fase 6, 20 oct 2026) · Guardia, Herrera y Anciano. Script clásico (global `VNPC`), se carga antes de game.js.
// Un PNJ = una FILA de datos (nada de ifs por personaje en game.js): id, nombre, dónde se pone y qué dice. El modelo 3D (diseños APROBADOS de `outfits3d.js` NPCS) está en
// `src/r3d/actors3d.js` (tabla NPC_DEF, misma clave = id). Solo existen con ?r3d=1 (en 2D no hay figura que dibujar).
// DÓNDE: `at` = ancla en CADA aldea (los 9 biomas tienen las mismas anclas: puerta de la Herrería/Templo y la fogata de la plaza). `npcInit()` busca el sitio libre más cercano
// a `pref` px de la ancla (sin colisión de props, en tierra, lejos de puertas/estaciones/otros PNJ), así que sirve para cualquier aldea sin coordenadas a mano.
// QUÉ DICE: `say(ctx)` devuelve las páginas del diálogo (array de strings); `ctx` = {L(sk)} con datos REALES del juego. Cada vez que se habla se rota la variante (`n` = veces).
//   Para añadir un PNJ: una fila aquí + una entrada en NPC_DEF (actors3d.js) con el mismo id + (si quieres) su verbo en IWI de game.js.
// NO hace misiones todavía (el Anciano «dador de misiones» del plan queda para cuando exista ese sistema: ver campo `quest`).
// VOZ Y LORE: cada PNJ habla desde lo que SABE un aldeano, no desde lo que sabe el jugador. Biblia de la historia y guía de voz: `docs/LORE.md` (léela antes de escribir diálogos nuevos).
// `rol` = lo que se muestra junto al nombre en el cuadro de diálogo. ctx = {L(sk), night, b (nombre del bioma)}.
const VNPC=[
 {id:'guardia',n:'Ivo, guardia',nm:'Ivo',rol:'Guardia',col:'#d8b050',at:{st:'fire'},pref:58,
  say:(c,n)=>[
   c.night?'Hay que ser tonto o estar desesperado para andar fuera de noche. ¿Cuál de los dos eres? No me contestes, me da igual.|Yo me quedo junto al fuego. Si oigo algo que no habla, aviso. Si oigo algo que sí habla... aviso más rápido.'
   :'Otro que llega por el camino con cara de no haber dormido. Pasa. Soy Ivo, vigilo la plaza porque alguien tiene que hacerlo y los demás tienen excusas.|Regla de la casa: si ves a alguien ahí fuera, quieto, sin hablar, con la mirada fija... no le preguntes nada. Corre.',
   '¿Sin trabajo? Mira el tablón. Lobos en el camino, bichos en el granero, a veces algo peor. Paga poco, pero paga. Y los jefes de ahí fuera te dejan una runa al caer. Una runa. Con eso no se come, pero dicen que cuenta.|Si sales mal parado, pasa por el templo: el altar cierra heridas. El viejo del coro te da la lata con sus himnos, pero es el precio.',
   'Cuento las noches hasta la luna llena. Faltan... qué sé yo. Siempre me pierdo. No cambia nada contarlas, pero mi abuelo las contaba y a él le fue bien. Hasta que no.|Esa noche cierro la puerta de casa, me siento y no miro por la ventana. Te lo recomiendo. Es lo más sensato que oirás hoy.'][n%3].split('|')},
 {id:'herrera',n:'Brenna, herrera',nm:'Brenna',rol:'Herrera',col:'#c8704a',at:{door:'herreria'},pref:78,
  say:(c,n)=>{const sm=c.L('sm');return [
   sm<5?'Lo primero: no toques nada caliente, y casi todo lo está. Entra a la Herrería, funde cobre y estaño en el horno y dale forma en el yunque. Tres barras de cobre y tienes un peto. Feo, pero te salva el pellejo.|¿Que si enseño gratis? No. Tráeme menas y hablamos.'
    :sm<25?'Ya tienes callos, bien. Pero el cobre se te va a quedar corto: un pico de cobre en una veta dura es como rascar una roca con una cuchara. Sube la minería y vuelve.|Y no me mires el martillo. No es un souvenir.'
    :'Con ese nivel de forja ya no te puedo enseñar nada. Ahora me haces competencia. Me cae mal. Un poco.',
   'Dicen que los dioses hicieron el mundo. Los dioses nunca sacaron carbón de una veta con la espalda mala. Esto lo hemos hecho nosotros, con estas manos y mucha ceniza.|Mi hermano rezaba mucho. Mucho más que yo. Se fue una noche de luna llena y lo que volvió ya no sabía mi nombre.|Yo hago las puntas de lanza de Ivo. No pregunto a quién se las clava.',
   'El pañuelo no es por moda: la ceniza se mete en todo, hasta en los pensamientos. ¿Ves esa mancha? No es hollín, es mi mal humor.|Si algún día entiendes por qué un yunque es más fiable que un dios, ven a decírmelo. Ahora déjame trabajar.'][n%3].split('|')}},
 {id:'anciano',n:'Orsen, anciano',nm:'Orsen',rol:'Anciano',col:'#9cc4ff',at:{door:'templo'},pref:76,quest:null,
  say:(c,n)=>[
   'Hmm. Otro que no sabe por qué entra al templo. No me mires así: canté en este coro cuarenta años. Reconozco la cara de quien dejó de creer y todavía no se ha enterado.|El altar de ahí dentro hace tres cosas y solo una tiene que ver con los dioses: te limpia las heridas, te devuelve la plegaria y, si le llevas huesos, los quema por ti y la oración sube. Los dioses nunca pidieron huesos. El altar, sí.',
   c.night?'Shh. De noche se oye más lejos. Dicen que antes había ángeles mirando el cielo cada noche y nadie lo agradecía. Ahora solo miramos nosotros, y a la luna.|Cuando se pone gorda, alguien, en algún sitio, oye una voz. Una sola persona. Siempre una. Las veces anteriores pasó cada mil años. Esta vez le tocó a nuestra generación y se llevó a la mitad del mundo.'
   :'Antes no había que encerrarse en luna llena. Antes había ángeles vigilando, y la gente pagaba con fe, y el que dudaba en voz alta se iba al exilio. Yo dudaba solo por dentro. Quizá por eso sigo aquí.|¿Las bestias de ahí fuera? Mira bien la próxima. Casi todas tuvieron nombre.',
   'No digo su nombre en voz alta: los nombres llaman. Digamos «el Enmascarado». Quiso matar a dios y lo consiguió. La parte que nadie cuenta es que lo que dejó al morir sigue buscando dónde vivir.|Si alguna vez te ofrecen respuestas a cambio de sangre, no te hagas el fuerte. Mientras más fuerte eres, más fuerza de voluntad te hace falta. Y ese precio no se paga en el altar.'][n%3].split('|')}
];
const NPCN={};   // veces que se ha hablado con cada PNJ (solo sesión: rota la variante del diálogo)

// ¿Es sitio válido para un PNJ? Tierra firme, sin props sólidos (centro + 4 puntos a 16 px), sin estaciones/puertas/otros PNJ cerca. Usa PROPS.solid y TER.heightAt (existen al construir la aldea; blk() aún no).
function npcFree(x,y,k,self,pl){if(ownAt(x,y)!==k||TER.heightAt(x,y)<1)return false;if(PROPS.solid(x,y)||PROPS.solid(x+16,y)||PROPS.solid(x-16,y)||PROPS.solid(x,y+16)||PROPS.solid(x,y-16))return false;
 for(const s of ST){if(s===self||s.inroom||ownAt(s.x,s.y)!==k)continue;const d=Math.hypot(s.x-x,s.y-y);if(d<(s.id==='door'?58:s.deco?34:s.npc||s.id==='ru'?56:46))return false}
 if(pl)for(const p of pl)if(Math.abs(p.x-x)<50&&Math.abs(p.y-y)<50&&Math.hypot(p.x-x,p.y-y)<(p.fp?50:28))return false;   // farolas, bancos, arbustos, rocas…: no se planta encima de un adorno
 return true}
// Coloca cada PNJ de VNPC en cada aldea (se llama tras intDoorsInit, cuando ya existen las puertas). Solo con ?r3d=1. Devuelve cuántos puso.
function npcInit(){if(!window.R3D_ON)return 0;let n=0;
 BI.forEach((B,k)=>VNPC.forEach(d=>{if(k!==0)return;/* Fase 25: Ivo, Brenna y Orsen (diseños aprobados) solo en la Pradera; el resto de biomas tiene SUS aldeanos (villagers.js) */const a=d.at.door?ST.find(e=>e.id==='door'&&e.room===d.at.door&&e.k===k):ST.find(e=>e.id===d.at.st&&!e.inroom&&ownAt(e.x,e.y)===k);if(!a)return;
  // anillo alrededor de la ancla: radios desde `pref` hacia dentro y fuera, 24 ángulos desde «delante y a un lado» de la puerta (la cara de la puerta mira a +y, o a +x si rot);
  // gana el primer sitio libre. Orden fijo = determinista (sin Math.random): la misma aldea da siempre el mismo sitio.
  const pl=PROPS.list.filter(p=>p.n!=='huerto'&&Math.abs(p.x-a.x)<260&&Math.abs(p.y-a.y)<260),front=a.rot?0:Math.PI/2,RS=[0,20,-20,40,-40,70,100,140];let best=null;
  for(let i=0;i<RS.length&&!best;i++){const r=d.pref+RS[i];if(r<40)continue;for(let j=0;j<24&&!best;j++){const ang=front+.9+(j%2?-1:1)*Math.ceil(j/2)*(Math.PI/12),x=a.x+Math.cos(ang)*r,y=a.y+Math.sin(ang)*r;if(npcFree(x,y,k,null,pl))best={x,y}}}
  if(!best)return;ST.push({id:d.id,n:d.n,x:best.x,y:best.y,npc:1,k,role:d.id==='herrera'?'herrero':d.id,vend:d.id==='herrera'?'herrero':d.id==='anciano'?'anciano':0});n++}));
 if(typeof VILL!=='undefined')n+=VILL.init();
 return n}
// Abre el diálogo de un PNJ (clic o tecla F). Reusa #dlg (dlgShow/dlgNext de game.js); el nombre sale de DL.n.
function npcTalk(e){if(e.id==='v:9:altar'&&typeof ISLA!=='undefined'&&ISLA.altar())return;let d=VNPC.find(v=>v.id===e.id),V=null;if(!d&&typeof VILL!=='undefined'&&(V=VILL.def(e)))d={id:V.id,nm:V.nm,rol:V.rol,col:V.col,say:(c,n)=>VILL.say(V,c,n)};if(!d)return;const c={L:sk=>L(sk),night:(()=>{try{return sunS(performance.now()/1000)<-.05}catch(e){return false}})(),b:(()=>{try{return BIOMES.list[ownAt(e.x,e.y)].n}catch(x){return''}})()},nn=NPCN[d.id]=(NPCN[d.id]||0)+1;
 DL={n:d.nm+' · '+d.rol,id:d.id,c:d.col,p:d.say(c,nn-1),i:0};if(typeof ISLA!=='undefined')ISLA.dlg(DL,d.id);if(e.vend&&typeof TRADE!=='undefined'&&TRADE.VEND[e.vend])DL.then=()=>TRADE.open(e.vend,e);dlgShow();dirty=1}
