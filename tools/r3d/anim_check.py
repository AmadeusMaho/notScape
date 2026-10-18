# NotScape · R3D · Lote R3D-ANIM · capturas de las TIRAS de fotogramas del héroe diorama (Chromium sin pantalla, SwiftShader).
# Uso (raíz del repo, con `python3 -m http.server 8811 &`):
#   python3 -I tools/r3d/anim_check.py <carpeta> <nombre>=<id>,<id>[:n][@az][+perfil] ...
#   p. ej.  python3 -I tools/r3d/anim_check.py capturas_anim espada=sword.ataque,sword.ataqueB:8@45+perfil
# Cada argumento = una imagen <carpeta>/<nombre>.png con una fila por escenario (ids de tools/r3d/anim_states.mjs). Sin argumentos: hoja completa.
# Imprime los errores de la página y RESULTADO: OK/FALLO.
import asyncio,sys,os
from playwright.async_api import async_playwright
OUT=sys.argv[1] if len(sys.argv)>1 else 'capturas_anim';os.makedirs(OUT,exist_ok=True)
SPECS=sys.argv[2:] or ['guardias=fist.guardia,sword.guardia,sword+sh.guardia,dagger.guardia,great.guardia,bow.guardia,xbow.guardia,staff.guardia,scepter.guardia:4']
ARGS=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
def bad(m):return m.type=='error' and 'favicon' not in m.text
async def main():
  ok=True
  async with async_playwright() as p:
    b=await p.chromium.launch(args=ARGS)
    for spec in SPECS:
      name,rest=spec.split('=',1);side='+perfil' in rest;rest=rest.replace('+perfil','');az='45'
      if '@' in rest:rest,az=rest.split('@')
      n='8'
      if ':' in rest:rest,n=rest.split(':')
      rows=len(rest.split(','))*(2 if side else 1)
      pg=await b.new_page(viewport={'width':min(2400,240*int(n)),'height':min(3200,300*rows)});errs=[]
      pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if bad(m) else None)
      await pg.goto(f'http://127.0.0.1:8811/docs/style-reference/r3d/anim-diorama.html?sheet={rest.replace('+','%2B')}&n={n}&az={az}&still'+('&side=1' if side else ''),wait_until='load')
      await pg.wait_for_function('window.__ready===true',timeout=240000);await pg.wait_for_timeout(1500)
      e=await pg.evaluate('document.getElementById("err").textContent')
      if e:errs.append(e)
      await pg.screenshot(path=f'{OUT}/{name}.png',timeout=240000)
      print(name,'· errores:',errs or 'ninguno');ok=ok and not errs;await pg.close()
    await b.close()
  print('RESULTADO: OK' if ok else 'RESULTADO: FALLO')
asyncio.run(main())
