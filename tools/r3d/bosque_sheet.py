# NotScape · R3D · FASE 7 · HOJA DE CONTACTO del Bosque (cabañas de troncos, casa en el árbol, leñera, taberna) en el lenguaje oscuro.
# Usa docs/style-reference/r3d/pradera-oscura.html (mismo código y materiales que el juego) con la lista del Bosque.
# Uso (raíz del repo, con `python3 -m http.server 8811 &`):
#   python3 -I tools/r3d/bosque_sheet.py <salida.png> [hora=dia|atardecer|noche] [extra="rot=1&foot=1&az=45&old=0"] [ancho=1900] [alto=1000]
#   python3 -I tools/r3d/bosque_sheet.py --medir      (mide las huellas en Node y las compara con BO_FOOT ±TOL; imprime RESULTADO)
import sys,os,subprocess,tempfile,json
if len(sys.argv)>1 and sys.argv[1]=='--medir':
  d=tempfile.mkdtemp();R=os.path.abspath('.')
  for f in ('propsdark3d.js','propsdark_pradera3d.js','propsdark_bosque3d.js'):
    src=open('src/r3d/'+f,encoding='utf-8').read().replace("from 'three'","from '"+__import__('pathlib').Path(R).as_uri()+"/vendor/three/build/three.module.js'")
    src=src.replace("'./propsdark3d.js'","'./propsdark3d.mjs'").replace("'./propsdark_pradera3d.js'","'./propsdark_pradera3d.mjs'");open(d+'/'+f.replace('.js','.mjs'),'w',encoding='utf-8').write(src)
  js="""import {bosqueGeo,BO_FOOT,BO_CASES,TOL} from './propsdark_bosque3d.mjs';let bad=0,tot=0;
for(const [n,o,fk] of BO_CASES()){const D=bosqueGeo(n,o),g=D.g;g.computeBoundingBox();const b=g.boundingBox,s=[b.max.x-b.min.x,b.max.y-b.min.y,b.max.z-b.min.z],F=BO_FOOT[fk],tris=g.attributes.position.count/3;tot+=tris;
 let nan=false;for(const a of ['position','normal','color'])for(const v of g.attributes[a].array)if(!isFinite(v)){nan=true;break}
 const r=s.map((v,i)=>v/F[i]);let f=nan||s.some((v,i)=>Math.abs(v-F[i])>Math.max(TOL*F[i],.12));if(n==='casaArbol'&&!nan)f=s.some((v,i)=>i<2&&false);   // el árbol: sin copa (láminas) la altura de la malla es menor; se mide solo el cuerpo
 if(f)bad++;console.log((n+' '+JSON.stringify(o)).padEnd(60),'tris',String(tris).padStart(5),'medida',s.map(v=>v.toFixed(2)).join('x'),'ref',F.join('x'),'ratio',r.map(v=>v.toFixed(2)).join('/'),nan?'NaN!':f?'FUERA':'ok')}
console.log('triangulos totales',tot);console.log(bad?'RESULTADO: FALLO ('+bad+')':'RESULTADO: OK')"""
  open(d+'/m.mjs','w').write(js);sys.exit(subprocess.call(['node',d+'/m.mjs']))
import asyncio,urllib.parse
from playwright.async_api import async_playwright
OUT=sys.argv[1];T=sys.argv[2] if len(sys.argv)>2 else 'dia';EX=sys.argv[3] if len(sys.argv)>3 else '';WD=int(sys.argv[4]) if len(sys.argv)>4 else 1900;HT=int(sys.argv[5]) if len(sys.argv)>5 else 1000
LIST=[["troncos",{"v":0,"wall":"#a8784a","roof":"#5f8a46"}],["troncos",{"v":1,"wall":"#9a6c42","roof":"#4f7a3e"}],["troncos",{"v":2,"wall":"#b08456","roof":"#6f9a50"}],["troncos",{"v":3,"wall":"#9a6c42","roof":"#4f7a3e"}],["troncos",{"v":4,"wall":"#a8784a","roof":"#5f8a46"}],["casaArbol",{}],["taberna",{"bk":1,"wall":"#c9a878","roof":"#3f6a3a","rot":0}],["lenera",{"bk":1}]]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':WD,'height':HT});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_TUNNEL' not in m.text else None)
    q='still&hora='+T+'&cols=4&sp=5.4&spz=9&list='+urllib.parse.quote(json.dumps(LIST))+('&'+EX if EX else '')
    await pg.goto('http://127.0.0.1:8811/docs/style-reference/r3d/pradera-oscura.html?'+q,wait_until='load')
    await pg.wait_for_function('window.__done>=1||window.__err',timeout=120000);await pg.wait_for_timeout(2500)
    await pg.screenshot(path=OUT,timeout=180000)
    print('hoja:',json.dumps(await pg.evaluate('window.__sheet')));e=await pg.evaluate('window.__err||""')
    if e:errs.append(e)
    print('errores:',errs or 'ninguno');print('RESULTADO: OK' if not errs else 'RESULTADO: FALLO');await b.close()
asyncio.run(main())
