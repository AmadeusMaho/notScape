# NotScape · R3D · ISLA-3 · comprobación en Node de la arquitectura griega de mármol (src/r3d/propsdark_cielo3d.js): triángulos, medidas frente a CI_FOOT (±TOL), NaN y la regla ANTICLIP de tejados.
# Uso (raíz del repo, sin navegador):  python3 tools/r3d/cielo_check.py      → termina en `RESULTADO: OK`
import os,sys,subprocess,tempfile,pathlib
R=pathlib.Path('.').resolve();d=tempfile.mkdtemp()
for f in ('propsdark3d.js','propsdark_pradera3d.js','propsdark_cielo3d.js'):
  s=open('src/r3d/'+f,encoding='utf-8').read().replace("from 'three'","from '"+R.as_uri()+"/vendor/three/build/three.module.js'")
  s=s.replace("'./propsdark3d.js'","'./propsdark3d.mjs'").replace("'./propsdark_pradera3d.js'","'./propsdark_pradera3d.mjs'");open(d+'/'+f.replace('.js','.mjs'),'w',encoding='utf-8').write(s)
js="""import {cieloGeo,CI_CASES,CI_FOOT,TOL,clipReport} from './propsdark_cielo3d.mjs';let bad=0,tot=0;
for(const [n,o,fk] of CI_CASES()){const g=cieloGeo(n,o).g;g.computeBoundingBox();const b=g.boundingBox,s=[b.max.x-b.min.x,b.max.y-b.min.y,b.max.z-b.min.z],F=CI_FOOT[fk],t=g.attributes.position.count/3;tot+=t;
 let nan=false;for(const a of ['position','normal','color'])for(const v of g.attributes[a].array)if(!isFinite(v)){nan=true;break}
 const ru=o&&(o.ruins||o.lit===0),off=!ru&&s.some((v,i)=>Math.abs(v-F[i])>Math.max(TOL*F[i],.12)),c=clipReport(n,o);const f=nan||off||c.clips.length>0;if(f)bad++;
 console.log((n+' '+JSON.stringify(o)).padEnd(34),'tris',String(t).padStart(6),'medida',s.map(v=>v.toFixed(2)).join('x'),'ref',F.join('x'),'tejados',c.roofs,'clips',c.clips.length,nan?'NaN!':'',f?'FALLO':'ok')}
console.log('triangulos totales',tot);console.log(bad?'RESULTADO: FALLO ('+bad+')':'RESULTADO: OK')"""
open(d+'/m.mjs','w').write(js);sys.exit(subprocess.call(['node',d+'/m.mjs']))
