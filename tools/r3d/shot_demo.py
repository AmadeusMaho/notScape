# NotScape · R3D · capturas de una página three.js en Chromium sin pantalla (WebGL por SwiftShader; funciona en el sandbox).
# Uso (desde la raíz del repo):  python3 -m http.server 8811 &   y luego
#   python3 -I tools/r3d/shot_demo.py docs/style-reference/r3d/referencia-3d.html salida noche,atardecer,dia
# Abre <página>?still&t=<hora> (sin giro automático, hora fija), espera 5 s y guarda salida_<hora>.png. Imprime errores de página.
# Los fps que muestra son de CPU (SwiftShader): sirven para comparar antes/después, no como medida real.
import asyncio,sys
from playwright.async_api import async_playwright
PAGE,OUT=sys.argv[1],sys.argv[2];HORAS=(sys.argv[3] if len(sys.argv)>3 else 'noche').split(',')
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    ok=True
    for t in HORAS:
      pg=await b.new_page(viewport={'width':900,'height':640});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
      await pg.goto(f'http://127.0.0.1:8811/{PAGE}?still&t={t}');await pg.wait_for_timeout(5000)
      await pg.screenshot(path=f'{OUT}_{t}.png');ed=await pg.inner_text('#err') if await pg.query_selector('#err') else ''
      print(t,'errores:',errs or 'ninguno',ed);ok=ok and not errs and not ed.strip();await pg.close()
    await b.close();print('RESULTADO: OK' if ok else 'RESULTADO: FALLO')
asyncio.run(main())
