# NotScape · R3D · Fase 4 · HOJA DE CONTACTO y MEDICIÓN de la naturaleza oscura (src/r3d/propsdark_nat3d.js).
# Uso (raíz del repo):
#   python3 -I tools/r3d/nat_sheet.py --medir                 → mide en Node cada modelo en los 9 biomas contra NAT_FOOT (±TOL), cuenta triángulos y busca NaN. RESULTADO: OK/FALLO.
#   python3 -I tools/r3d/nat_sheet.py <salida.png> [hora] ["only=roca,arbusto&bk=0,1,2&old=0"] [ancho] [alto]    (necesita `python3 -m http.server 8811 &`)
import asyncio,sys,json,subprocess,os,tempfile
if len(sys.argv)>1 and sys.argv[1]=='--medir':
  d=tempfile.mkdtemp();T=__import__('pathlib').Path(os.path.abspath('vendor/three/build/three.module.js')).as_uri()
  for f in ('propsdark3d','propsdark_nat3d'):
    s=open('src/r3d/%s.js'%f,encoding='utf-8').read().replace("from 'three'","from '"+T+"'").replace("'./propsdark3d.js'","'./propsdark3d.mjs'");open(d+'/%s.mjs'%f,'w',encoding='utf-8').write(s)
  js="""import {natGeo,NAT_NAMES,NAT_FOOT,NAT_COUNT,TOL} from './propsdark_nat3d.mjs';let bad=0,tot=0;const V={roca:[{v:0},{v:1}],piedra:[{v:0},{v:1},{v:2}],tronco:[{len:20},{len:26},{len:30}],charco:[{col:'#3f4a2a',water:'#7aa890'},{col:'#4a3a28',water:'#7a6a48'}],carpa:[{col:'#8a5a38'},{col:'#7a6a5a',trim:'#3a2a22'}]};
for(const n of NAT_NAMES){if(n==='arbusto'){console.log('arbusto  (lleva láminas de nature3d: se mide en la hoja de navegador, no en Node)');continue}const F=NAT_FOOT[n];let line=n.padEnd(8),worst=0,tris=0,nan=0;
 for(let bk=0;bk<NAT_COUNT;bk++)for(const o of (V[n]||[{}])){const g=natGeo(n,{...o,bk}).g;g.computeBoundingBox();const b=g.boundingBox,s=[b.max.x-b.min.x,b.max.y-b.min.y,b.max.z-b.min.z],ref=n==='tronco'&&o.len?[o.len*.0438,F[1],F[2]]:F;
  const r=s.map((v,i)=>v/ref[i]),dev=Math.max(...r.map(v=>Math.abs(v-1)));const p=g.attributes.position.array;for(let i=0;i<p.length;i++)if(!Number.isFinite(p[i]))nan++;
  if(process.env.DETALLE)console.log('   ',n,'bk',bk,JSON.stringify(o),'tris',g.attributes.position.count/3,'medida',s.map(v=>v.toFixed(2)).join('x'),'ref',ref.map(v=>v.toFixed(2)).join('x'));tris=Math.max(tris,g.attributes.position.count/3);if(dev>worst)worst=dev;if(dev>TOL){bad++;console.log('  FUERA',n,'bk',bk,JSON.stringify(o),'medida',s.map(v=>v.toFixed(2)).join('x'),'ref',ref.map(v=>v.toFixed(2)).join('x'))}tot++}
 console.log(line,'tris máx',String(tris).padStart(4),'desvío máx',(worst*100).toFixed(0)+'%',nan?'NaN '+nan:'')}
console.log(bad?'RESULTADO: FALLO ('+bad+'/'+tot+')':'RESULTADO: OK ('+tot+' mallas)');"""
  open(d+'/m.mjs','w').write(js);sys.exit(subprocess.call(['node',d+'/m.mjs']))
from playwright.async_api import async_playwright
OUT=sys.argv[1];T=sys.argv[2] if len(sys.argv)>2 else 'dia';EX=sys.argv[3] if len(sys.argv)>3 else '';WD=int(sys.argv[4]) if len(sys.argv)>4 else 1900;HT=int(sys.argv[5]) if len(sys.argv)>5 else 1000
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':WD,'height':HT});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_TUNNEL' not in m.text else None)
    await pg.goto('http://127.0.0.1:8811/docs/style-reference/r3d/naturaleza-oscura.html?still&hora='+T+('&'+EX if EX else ''),wait_until='load')
    await pg.wait_for_function('window.__done>=1||window.__err',timeout=120000);await pg.wait_for_timeout(2500)
    await pg.screenshot(path=OUT,timeout=180000)
    print('hoja:',json.dumps(await pg.evaluate('window.__sheet')));e=await pg.evaluate('window.__err||""')
    if e:errs.append(e)
    sh=await pg.evaluate('window.__sheet');bad=(sh or {}).get('bad') or []
    if bad:errs.append('fuera de FOOT ±22%: '+'; '.join(bad))
    print('errores:',errs or 'ninguno');print('RESULTADO: OK' if not errs else 'RESULTADO: FALLO');await b.close()
asyncio.run(main())
