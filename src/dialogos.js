// NotScape · DIÁLOGOS EDITABLES (22 oct 2026; pedido del dueño: «una herramienta propia para editar los diálogos de todos los PNJ, y que se guarden los cambios»).
// Script clásico, global `DLG`. Se carga tras villagers.js (usa `VNPC`, `VILL`, `ISLA`, `BIOMES` solo al llamar).
//   · LOS CAMBIOS viven en `data/dialogos.json` (los escribe la herramienta `tools/dialogos/`, ver su README): {npcs:{<id>:{conv:[[página,…],…]}}, quests:{<id de PNJ>:{name,hi,desc,rem,turn,done}}}.
//     El juego los lee al arrancar (`fetch`); si el archivo no existe o falla, se queda con los textos del código (nada se rompe).
//   · `npcs[id].conv` = CONVERSACIONES que REEMPLAZAN a las del código para ese PNJ: al hablar se rota entre ellas (1.ª vez la 1.ª, 2.ª vez la 2.ª…); cada conversación es una lista de páginas (clic/tecla = siguiente página).
//     Los PNJ de aldea de todos los biomas comparten id: `guardia`, `herrera`, `anciano` valen para las 9 aldeas; los demás (`v:<bioma>:…`) son de una aldea concreta.
//   · `quests[id de PNJ]` pisa los textos de las misiones del tutorial del Cielo (`ISLA.QUESTS`): name, hi (saludo), desc (descripción), rem (recordatorio), turn (al volver), done (al entregar).
//   · `DLG.dump()` devuelve los textos ORIGINALES del código (los usa el editor para enseñarlos como referencia); NO aplica cambios.
const DLG=(()=>{
 let ov={npcs:{},quests:{}},origQ=null,loaded=0;
 const qfields=['name','hi','desc','rem','turn','done'];
 const grabQ=()=>{if(origQ)return origQ;try{origQ=ISLA.QUESTS.map(q=>{const o={npc:q.npc};qfields.forEach(f=>o[f]=q[f]);return o})}catch(e){origQ=[]}return origQ};
 function applyQuests(){if(typeof ISLA==='undefined'){setTimeout(applyQuests,300);return}const orig=grabQ();try{ISLA.QUESTS.forEach((q,i)=>{const o=ov.quests[q.npc];qfields.forEach(f=>{q[f]=(o&&typeof o[f]==='string'&&o[f].trim())?o[f]:orig[i][f]})})}catch(e){}}
 // páginas que se enseñan al hablar con `id` (la veces `n`-ésima, desde 1): las del juego (`pages`) salvo que el PNJ tenga conversaciones editadas
 function apply(id,pages,n){const o=ov.npcs[id];if(!o||!Array.isArray(o.conv)||!o.conv.length)return pages;const c=o.conv[(((n||1)-1)%o.conv.length+o.conv.length)%o.conv.length];return Array.isArray(c)&&c.length?c.map(String):pages}
 function load(){try{fetch('data/dialogos.json?'+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{if(j&&typeof j==='object'){ov={npcs:j.npcs||{},quests:j.quests||{}};loaded=1;applyQuests()}}).catch(()=>{})}catch(e){}}
 // textos originales de TODOS los PNJ (para el editor): cada variante = lista de páginas; se prueban 6 veces de día y de noche con nivel 10
 function dump(){const out={npcs:[],quests:[]},run=f=>{const vs=[],keys=new Set();for(const night of [false,true])for(let n=0;n<6;n++){let p;try{p=f({L:()=>10,night,b:'?'},n)}catch(e){continue}if(!Array.isArray(p))p=[String(p)];const k=JSON.stringify(p);if(!keys.has(k)){keys.add(k);vs.push(p.map(String))}}return vs};
  try{VNPC.forEach(v=>out.npcs.push({id:v.id,nm:v.nm,rol:v.rol,src:'Todas las aldeas',variants:run((c,n)=>v.say(c,n))}))}catch(e){}
  try{VILL.LIST.forEach(d=>out.npcs.push({id:d.id,nm:d.nm,rol:d.rol,src:d.exile?'Isla del Cielo':'Aldea de '+((BIOMES.list[d.k]&&BIOMES.list[d.k].n)||d.k),variants:run((c,n)=>VILL.say(d,c,n))}))}catch(e){}
  try{grabQ().forEach(q=>out.quests.push(Object.assign({},q)))}catch(e){}
  return JSON.parse(JSON.stringify(out))}
 load();
 return{apply,dump,load,applyQuests,get overrides(){return ov},get loaded(){return !!loaded}}})();
