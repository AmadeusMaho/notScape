# NotScape · R3D · HOJA DE CONTACTO de los props oscuros (F2-C · Q02). Abre docs/style-reference/r3d/props-oscuros.html (mismo código y materiales que el juego) y captura.
# Uso (raíz del repo, con `python3 -m http.server 8811 &`):  python3 -I tools/r3d/props_sheet.py <salida.png> [hora=dia|atardecer|noche] [extra="only=casa,pozo&rot=1&foot=1&old=0&az=45"] [ancho=1900] [alto=1000]
# Imprime errores de página, nº de modelos y triángulos nuevos, y RESULTADO. `--medir` (como único argumento) mide las huellas de las mallas oscuras en Node y las compara con FOOT (±TOL).
import asyncio,sys,json,subprocess,os
if len(sys.argv)>1 and sys.argv[1]=='--medir':
  js="""import {darkGeo,DARK_NAMES,FOOT,TOL} from './src/r3d/propsdark3d.js';let bad=0;for(const n of DARK_NAMES){const g=darkGeo(n,n==='valla'?{len:18}:{wall:'#e8c9a0',roof:'#c0504a'}).g;g.computeBoundingBox();const b=g.boundingBox,s=[b.max.x-b.min.x,b.max.y-b.min.y,b.max.z-b.min.z],F=FOOT[n],r=s.map((v,i)=>v/F[i]),f=r.some(v=>Math.abs(v-1)>TOL);if(f)bad++;
 console.log(n.padEnd(8),'tris',String(g.attributes.position.count/3).padStart(5),'medida',s.map(v=>v.toFixed(2)).join('x'),'ref',F.join('x'),'ratio',r.map(v=>v.toFixed(2)).join('/'),f?'FUERA':'ok')}console.log(bad?'RESULTADO: FALLO ('+bad+')':'RESULTADO: OK')"""
  # el módulo importa 'three': se resuelve con un import map mínimo vía un cargador temporal
  import tempfile;d=tempfile.mkdtemp();open(d+'/m.mjs','w').write(js.replace("'./src/r3d/propsdark3d.js'","'"+__import__('pathlib').Path(os.path.abspath('src/r3d/propsdark3d.js')).as_uri()+"'"))
  src=open('src/r3d/propsdark3d.js',encoding='utf-8').read().replace("from 'three'","from '"+__import__('pathlib').Path(os.path.abspath('vendor/three/build/three.module.js')).as_uri()+"'");open(d+'/pd.mjs','w',encoding='utf-8').write(src)
  open(d+'/m.mjs','w').write(js.replace("'./src/r3d/propsdark3d.js'","'./pd.mjs'"));sys.exit(subprocess.call(['node',d+'/m.mjs']))
from playwright.async_api import async_playwright
OUT=sys.argv[1];T=sys.argv[2] if len(sys.argv)>2 else 'dia';EX=sys.argv[3] if len(sys.argv)>3 else '';WD=int(sys.argv[4]) if len(sys.argv)>4 else 1900;HT=int(sys.argv[5]) if len(sys.argv)>5 else 1000
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':WD,'height':HT});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_TUNNEL' not in m.text else None)
    await pg.goto('http://127.0.0.1:8811/docs/style-reference/r3d/props-oscuros.html?still&hora='+T+('&'+EX if EX else ''),wait_until='load')
    await pg.wait_for_function('window.__done>=1||window.__err',timeout=120000);await pg.wait_for_timeout(2500)
    await pg.screenshot(path=OUT,timeout=180000)
    print('hoja:',json.dumps(await pg.evaluate('window.__sheet')));e=await pg.evaluate('window.__err||""')
    if e:errs.append(e)
    print('errores:',errs or 'ninguno');print('RESULTADO: OK' if not errs else 'RESULTADO: FALLO');await b.close()
asyncio.run(main())
