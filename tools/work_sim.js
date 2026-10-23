// Simulación de la Hoja de trabajo: éxito, calidad y pasos por nivel de receta y de jugador, con 3 estilos de juego.
//   node tools/work_sim.js [oficio] [N]   → tabla (no necesita el juego). Sirve para calibrar PROG0/PROG1/QUAL0/QUAL1/PO0/PO1 de work.js.
// Estilos: «spam» = solo Síntesis básica · «torpe» = algo de calidad sin rotación · «experto» = planificador (WK.suggest).
// Objetivos de diseño (22 oct 2026): spam falla al nivel de la receta (solo vale en recetas ≥ 15–20 niveles inferiores); experto completa casi siempre
// con 10–18 pasos; la calidad máxima exige estados (Veneración, Innovación, Sin desperdicio, Manipulación, Byregot…).
const WK=require('../src/work.js'),of=process.argv[2]||'sm',N=+process.argv[3]||20;
if(process.argv[4])Object.assign(WK.K,JSON.parse(process.argv[4]));   // p. ej. '{"PCAP":12,"QCAP":50}'
const RL=(process.argv[5]||'1,5,10,20,30,40,50,60,70,80,90,99').split(',').map(Number);
const pol={spam:s=>'sb',torpe:s=>{const a=['tb','tb','ts','sb','sb','sb'];const id=a[s.step-1]||'sb';return WK.can(s,id)?'sb':id},experto:s=>WK.suggest(s)};
function run(rl,lvl,p){let ok=0,hq=0,st=0;
  for(let i=0;i<N;i++){const s=WK.start(WK.mkRecipe(rl),{...WK.mkStats(lvl),of,seed:i*7919+rl*31+lvl});let n=0;
    while(!s.over&&n++<60){const id=pol[p](s);if(!id||WK.use(s,id).ok===false)break}
    if(s.ok){ok++;hq+=WK.hq(s)}st+=s.step-1}
  return (100*ok/N).toFixed(0).padStart(3)+'% hq'+(ok?(hq/ok).toFixed(0):'-').toString().padStart(3)+' p'+(st/N).toFixed(1).padStart(4)}
console.log('oficio',of,'· '+N+' piezas por celda · formato: éxito% hq% pasos');
console.log('receta | jugador=receta: spam | torpe | experto || jugador=receta+20: spam | torpe | experto');
for(const rl of RL){
  const a=['spam','torpe','experto'].map(p=>run(rl,rl,p)),b=['spam','torpe','experto'].map(p=>run(rl,Math.min(99,rl+20),p));
  console.log('nv'+String(rl).padStart(2)+'    | '+a.join(' | ')+' || '+b.join(' | '))}
