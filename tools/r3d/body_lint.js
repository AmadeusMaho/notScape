// R3D-FIX-VIGAS (20 oct 2026): lint de «vigas» en personajes. Falla si un cuerpo/NPC/enemigo/armadura lleva una CAJA recta larga (≥ .35) puesta en diagonal (rotation.z/x) fuera de armas.
// Uso: node tools/r3d/body_lint.js  → RESULTADO: OK. Regla: cintas, correas y bandoleras = `sash()`/`bandolier()` (curvas que abrazan el torso), nunca BoxGeometry en diagonal.
const fs=require('fs'),path=require('path'),D=path.join(__dirname,'../../src/r3d');
const files=['mini3d.js','actors3d.js','herom3d.js','armor3d.js','figure3d.js','heroanim3d.js'].filter(f=>fs.existsSync(path.join(D,f)));
let bad=0;
for(const f of files){fs.readFileSync(path.join(D,f),'utf8').split('\n').forEach((ln,i)=>{
 if(/sword|blade|spear|staff|lance|axe|bow|shiv|dagger|pick|rod|arrow|mast|pole|wand|cane|ARM/i.test(ln.slice(0,260))&&!/strap|belt|sash/i.test(ln))return;
 const re=/BoxGeometry\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/g;let m;
 while((m=re.exec(ln))){const d=[+m[1],+m[2],+m[3]],mx=Math.max(...d),mn=Math.min(...d);
  if(mx>=.35&&mx/mn>=4&&/rotation\.[zx]\s*=\s*-?[\d.]+/.test(ln)){bad++;console.log('VIGA',f+':'+(i+1),ln.trim().slice(0,150))}}})}
console.log(bad?'RESULTADO: FALLO ('+bad+')':'RESULTADO: OK');process.exit(bad?1:0);
