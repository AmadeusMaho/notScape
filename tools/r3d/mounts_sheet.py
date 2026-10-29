# NotScape · R3D · HOJA DE CONTACTO de MONTURAS (lote DOMAR-D3-MODELOS). Abre docs/style-reference/r3d/monturas-3d.html con la GPU real y guarda una captura.
# Uso (raíz del repo, servidor en 8811):  python tools/r3d/mounts_sheet.py <salida.png> "<query>" [ancho=1600] [alto=900]
#   query = parámetros del visor, p. ej. "bio=0&sad=1&cols=4"  ·  "ids=dragon,grifo&gait=2&still&t=.6"  ·  "bio=3&sad=0&yaw=90"
# Imprime errores de página y RESULTADO: OK/FALLO. Sin -I (necesita Playwright instalado).
import asyncio,sys
from playwright.async_api import async_playwright
OUT=sys.argv[1];QS=sys.argv[2] if len(sys.argv)>2 else 'bio=0';W=int(sys.argv[3]) if len(sys.argv)>3 else 1600;H=int(sys.argv[4]) if len(sys.argv)>4 else 900
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(headless=False,args=['--ignore-gpu-blocklist','--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding'])
    pg=await b.new_page(viewport={'width':W,'height':H});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    await pg.goto('http://127.0.0.1:8811/docs/style-reference/r3d/monturas-3d.html?'+QS)
    await pg.wait_for_function('window.__done>2||window.__err',timeout=60000);await pg.wait_for_timeout(600)
    e=await pg.evaluate('window.__err||""')
    if e:errs.append(e)
    await pg.screenshot(path=OUT);print('errores:',errs or 'ninguno');print('RESULTADO: OK' if not errs else 'RESULTADO: FALLO');await b.close()
asyncio.run(main())
