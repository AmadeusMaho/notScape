# NotScape · R3D · captura del JUEGO (?r3d=1) SIN HUD, en el centro de la aldea de la Pradera (adoquines), para revisar el suelo.
# Uso (raíz del repo, con `python3 -m http.server 8811` en segundo plano):  python3 -I tools/r3d/cob_shot.py <salida.png> <dia|atardecer|noche> [zoom] [x] [y]
# Por defecto va a (2304,1504) px de mundo (plaza). Oculta el DOM con CSS (solo queda el canvas) y congela la hora como shot_at.py. Imprime errores de consola.
import asyncio,sys
from playwright.async_api import async_playwright
OUT,T=sys.argv[1],sys.argv[2];ZOOM=sys.argv[3] if len(sys.argv)>3 else ''
SUN={'dia':61,'atardecer':145,'noche':241}
INIT="const raf=window.requestAnimationFrame.bind(window);window.__fix=null;window.__t0=0;window.requestAnimationFrame=cb=>raf(ts=>cb(window.__fix===null?ts:window.__fix+(ts-window.__t0)*.002));"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':960,'height':600});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_' not in m.text else None)
    await pg.add_init_script(INIT);await pg.goto('http://127.0.0.1:8811/index.html?r3d=1&noedit',wait_until='commit')
    await pg.wait_for_function('window.R3D&&typeof sunS==="function"&&typeof S!=="undefined"',timeout=90000);await pg.wait_for_timeout(3000)
    css="div,section,aside,header,nav,button,span{visibility:hidden!important}canvas{visibility:visible!important}"
    await pg.add_style_tag(content=css)
    X=float(sys.argv[4]) if len(sys.argv)>4 else 2304;Y=float(sys.argv[5]) if len(sys.argv)>5 else 1504
    await pg.evaluate(f"""(()=>{{P.x={X};P.y={Y};ISO.snap(P.x,P.y,TER.standZ(P.x,P.y));window.__t0=performance.now();window.__fix={SUN[T]}*1000;R3D.oil=.7;R3D.parts.snap();{('ISO.V.zoom='+ZOOM+';') if ZOOM else ''}}})()""")
    await pg.wait_for_timeout(2500);await pg.wait_for_timeout(7000)
    await pg.screenshot(path=OUT,timeout=180000)
    print('errores:',errs or 'ninguno')
    await b.close()
asyncio.run(main())
