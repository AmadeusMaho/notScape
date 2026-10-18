# NotScape · R3D · medición de rendimiento del modo ?r3d=1 (Chromium sin pantalla, SwiftShader).
# Uso (raíz del repo, con `python3 -m http.server 8811 &`):  python3 -I tools/r3d/perf_check.py [horas=dia,noche] [segundos=6] [extra_query]
# Mide por hora: draw calls y triángulos por fotograma (todos los pases), nº de chunks/props, y el coste de CPU de R3D.frame() (ms medios y p95).
# Los fps y el tiempo de GPU de SwiftShader NO son reales: compara antes/después, no ms absolutos. Los draw calls y triángulos sí son exactos.
import asyncio,sys,json
from playwright.async_api import async_playwright
HORAS=(sys.argv[1] if len(sys.argv)>1 else 'dia,noche').split(',');SEG=float(sys.argv[2]) if len(sys.argv)>2 else 6;EXTRA=sys.argv[3] if len(sys.argv)>3 else ''
SUN={'dia':61,'atardecer':145,'noche':241}
INIT="const raf=window.requestAnimationFrame.bind(window);window.__fix=null;window.__t0=0;window.requestAnimationFrame=cb=>raf(ts=>cb(window.__fix===null?ts:window.__fix+(ts-window.__t0)*.002));"
JS="""async(seg)=>{const r=R3D,ri=r.renderer.info;ri.autoReset=false;const fr=r.frame;const ms=[];let calls=0,tris=0,n=0,maxc=0,maxt=0;
 r.frame=function(now){ri.reset();const a=performance.now();fr.call(r,now);ms.push(performance.now()-a);calls+=ri.render.calls;tris+=ri.render.triangles;maxc=Math.max(maxc,ri.render.calls);maxt=Math.max(maxt,ri.render.triangles);n++};
 await new Promise(s=>setTimeout(s,seg*1000));r.frame=fr;ri.autoReset=true;ms.sort((a,b)=>a-b);
 return{frames:n,cpuMs:+(ms.reduce((a,b)=>a+b,0)/Math.max(1,n)).toFixed(2),p95:+(ms[Math.floor(ms.length*.95)]||0).toFixed(2),calls:Math.round(calls/Math.max(1,n)),maxCalls:maxc,tris:Math.round(tris/Math.max(1,n)),maxTris:maxt,
  chunks:r.stats().chunks,geoms:r.renderer.info.memory.geometries,tex:r.renderer.info.memory.textures,props:r.props.stats||null}}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    ok=True
    for t in HORAS:
      pg=await b.new_page(viewport={'width':960,'height':600});errs=[]
      pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_TUNNEL' not in m.text else None)
      await pg.add_init_script(INIT);await pg.goto('http://127.0.0.1:8811/index.html?r3d=1&noedit'+EXTRA,wait_until='commit')
      await pg.wait_for_function('window.R3D&&typeof sunS==="function"&&typeof S!=="undefined"',timeout=90000);await pg.wait_for_timeout(5000)
      await pg.evaluate(f'window.__t0=performance.now();window.__fix={SUN[t]}*1000');await pg.wait_for_timeout(2500)
      res=await pg.evaluate(JS,SEG);print(t,json.dumps(res,ensure_ascii=False));print(t,'errores:',errs or 'ninguno');ok=ok and not errs
      await pg.close()
    await b.close();print('RESULTADO: OK' if ok else 'RESULTADO: FALLO')
asyncio.run(main())
