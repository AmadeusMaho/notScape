// Simulación de la Hoja de trabajo: éxito y calidad de la rotación sugerida por nivel de receta/jugador.
// node tools/work_sim.js [of]  → tabla (no necesita el juego). Sirve para calibrar PROG0/PROG1/QUAL0/QUAL1 de work.js.
const WK=require('../src/work.js'),of=process.argv[2]||'sm',N=300;
const rows=[];
for(const rl of [1,5,10,15,20,30,40,50,60,70,80,90,99]){
  const out=[];
  for(const off of [0,8,20]){const lvl=Math.min(99,rl+off);let ok=0,hq=0,steps=0;
    for(let i=0;i<N;i++){const s=WK.start(WK.mkRecipe(rl),{...WK.mkStats(lvl),of,seed:i*7919+rl});let n=0;
      while(!s.over&&n++<60){const id=WK.suggest(s);if(!id||WK.use(s,id).ok===false)break}
      if(s.ok){ok++;hq+=WK.hq(s)}steps+=s.step-1}
    out.push((100*ok/N).toFixed(0).padStart(3)+'% hq'+(ok?(hq/ok).toFixed(0):'-').toString().padStart(3)+' p'+(steps/N).toFixed(1))}
  rows.push('receta nv'+String(rl).padStart(2)+' | jugador=nv: '+out.join(' | '))}
console.log('columnas: jugador al nivel de la receta / +8 / +20   (éxito, calidad media, pasos)');console.log(rows.join('\n'));
