# NotScape · R3D · HOJA DE CONTACTO de los edificios/puestos de la Pradera en oscuro (Fase 5). Abre docs/style-reference/r3d/pradera-oscura.html (mismo código y materiales que el juego) y captura.
# Uso (raíz del repo, con `python3 -m http.server 8811 &`):  python3 -I tools/r3d/pradera_sheet.py <salida.png> [hora=dia|atardecer|noche] [extra="only=casa,pozo&rot=1&foot=1&old=0&az=45"] [ancho=1900] [alto=1000]
# Imprime errores de página, nº de modelos y triángulos nuevos, y RESULTADO. `--medir` (como único argumento) mide las huellas de las mallas oscuras en Node y las compara con FOOT (±TOL).
import asyncio,sys,json,subprocess,os
if len(sys.argv)>1 and sys.argv[1] in ('--medir','--org'):
  import tempfile;d=tempfile.mkdtemp();R=os.path.abspath('.')
  for f in ('propsdark3d.js','propsdark_pradera3d.js','propsdark_estaciones3d.js'):
    src=open('src/r3d/'+f,encoding='utf-8').read().replace("from 'three'","from '"+__import__('pathlib').Path(R).as_uri()+"/vendor/three/build/three.module.js'");open(d+'/'+f.replace('.js','.mjs'),'w',encoding='utf-8').write(src.replace("'./propsdark3d.js'","'./propsdark3d.mjs'").replace("'./propsdark_pradera3d.js'","'./propsdark_pradera3d.mjs'"))
  js="""import {praderaGeo,PR_FOOT,PR_CASES,TOL} from './propsdark_pradera3d.mjs';import {ofGeo,OF_FOOT,OF_CASES} from './propsdark_estaciones3d.mjs';let bad=0,tot=0;
const CASES=[...PR_CASES().map(c=>[...c,praderaGeo,PR_FOOT]),...OF_CASES().map(c=>[...c,ofGeo,OF_FOOT])];   // Fase 5 + Fase 5b (estaciones)
for(const [n,o,fk,GF,FT] of CASES){const g=GF(n,o).g;g.computeBoundingBox();const b=g.boundingBox,s=[b.max.x-b.min.x,b.max.y-b.min.y,b.max.z-b.min.z],F=FT[fk]||FT[n],tris=g.attributes.position.count/3;tot+=tris;
 let nan=false;for(const a of ['position','normal','color'])for(const v of g.attributes[a].array)if(!isFinite(v)){nan=true;break}
 const r=s.map((v,i)=>v/F[i]),f=nan||s.some((v,i)=>Math.abs(v-F[i])>Math.max(TOL*F[i],.12));if(f)bad++;   // ejes finos (< .5 tile): tolerancia absoluta .12if(f)bad++;
 console.log((n+' '+JSON.stringify(o)).padEnd(46),'tris',String(tris).padStart(5),'medida',s.map(v=>v.toFixed(2)).join('x'),'ref',F.join('x'),'ratio',r.map(v=>v.toFixed(2)).join('/'),nan?'NaN!':f?'FUERA':'ok')}
console.log('triangulos totales',tot);console.log(bad?'RESULTADO: FALLO ('+bad+')':'RESULTADO: OK')"""
  open(d+'/m.mjs','w').write(js);sys.exit(subprocess.call(['node',d+'/m.mjs']))
from playwright.async_api import async_playwright
OUT=sys.argv[1];T=sys.argv[2] if len(sys.argv)>2 else 'dia';EX=sys.argv[3] if len(sys.argv)>3 else '';WD=int(sys.argv[4]) if len(sys.argv)>4 else 1900;HT=int(sys.argv[5]) if len(sys.argv)>5 else 1000
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':WD,'height':HT});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_TUNNEL' not in m.text else None)
    await pg.goto('http://127.0.0.1:8811/docs/style-reference/r3d/pradera-oscura.html?still&hora='+T+('&'+EX if EX else ''),wait_until='load')
    await pg.wait_for_function('window.__done>=1||window.__err',timeout=120000);await pg.wait_for_timeout(2500)
    await pg.screenshot(path=OUT,timeout=180000)
    print('hoja:',json.dumps(await pg.evaluate('window.__sheet')));e=await pg.evaluate('window.__err||""')
    if e:errs.append(e)
    print('errores:',errs or 'ninguno');print('RESULTADO: OK' if not errs else 'RESULTADO: FALLO');await b.close()
asyncio.run(main())
