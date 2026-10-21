# NotScape · R3D · F3d · prueba del estilo «óleo oscuro» DENTRO del juego (?r3d=1). Chromium sin pantalla (SwiftShader).
# Uso (desde la raíz del repo):  python3 -m http.server 8811 &   y luego
#   python3 -I tools/r3d/oleo_check.py <prefijo_salida> [horas=dia,atardecer,noche] [K=0,70,100]
# Fuerza la hora congelando el timestamp de requestAnimationFrame (sunS es const y no se puede sobrescribir): dia t=61 s, atardecer 145 s, noche 241 s (DAYLEN 360); la perilla con R3D.oil; guarda <prefijo>_<hora>_<K>.png.
# Imprime errores de página y RESULTADO: OK/FALLO. Los fps son de CPU (SwiftShader): no son medida real.
import asyncio,sys
from playwright.async_api import async_playwright
OUT=sys.argv[1];HORAS=(sys.argv[2] if len(sys.argv)>2 else 'dia,atardecer,noche').split(',');KS=[int(x) for x in (sys.argv[3] if len(sys.argv)>3 else '0,70,100').split(',')]
SUN={'dia':61,'atardecer':145,'noche':241}
INIT="const raf=window.requestAnimationFrame.bind(window);window.__fix=null;window.__t0=0;window.requestAnimationFrame=cb=>raf(ts=>cb(window.__fix===null?ts:window.__fix+(ts-window.__t0)*.002));"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    ok=True
    for t in HORAS:
      pg=await b.new_page(viewport={'width':720,'height':450});errs=[]
      pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_TUNNEL' not in m.text else None)
      await pg.add_init_script(INIT);await pg.goto('http://127.0.0.1:8811/index.html?r3d=1&noedit',wait_until='commit')
      await pg.wait_for_function('window.R3D&&typeof sunS==="function"&&typeof S!=="undefined"',timeout=60000);await pg.wait_for_timeout(4000)
      await pg.evaluate(f'window.__t0=performance.now();window.__fix={SUN[t]}*1000')   # tiempo del juego CONGELADO (casi) en esa hora
      for k in KS:
        await pg.evaluate(f'R3D.oil={k/100}');await pg.wait_for_timeout(2500)
        await pg.screenshot(path=f'{OUT}_{t}_{k}.png',timeout=180000);print(t,k,'ok')
      await pg.close();print(t,'errores:',errs or 'ninguno');ok=ok and not errs
    await b.close();print('RESULTADO: OK' if ok else 'RESULTADO: FALLO')
asyncio.run(main())
