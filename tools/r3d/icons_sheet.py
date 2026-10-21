# NotScape · R3D · H3 · hoja de contacto de los ICONOS 3D (src/r3d/icons3d.js) sin el juego, solo el módulo + arnés `tools/r3d/icons_test.html`. Servidor del repo en 8811.
# Uso:  python3 -I tools/r3d/icons_sheet.py <salida.png> <id,id,id,…> [cols=6] [size=128]      (ids = los del juego: sw_hierro, lw_3m2, ar_cu_acero, lt_1h2, cobre, pot_xp…)
# Imprime errores y RESULTADO: OK/FALLO. Mira SIEMPRE la captura (regla de sentido de AGENTS.md).
import asyncio,sys,subprocess,time,os,socket
from playwright.async_api import async_playwright
A=sys.argv;OUT=A[1];IDS=A[2];COLS=A[3] if len(A)>3 else '6';SZ=A[4] if len(A)>4 else '128'
ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
def up():
  s=socket.socket();s.settimeout(.3)
  try:s.connect(('127.0.0.1',8811));return True
  except Exception:return False
  finally:s.close()
async def main():
  srv=None
  if not up():srv=subprocess.Popen([sys.executable,'-m','http.server','8811','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1.2)
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':1200,'height':900});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type in('error','warning') and 'ERR_NAME_NOT_RESOLVED' not in m.text else None)
    await pg.goto(f'http://127.0.0.1:8811/tools/r3d/icons_test.html?cols={COLS}&size={SZ}&ids={IDS}',wait_until='commit')
    try:await pg.wait_for_function('window.__ready||window.__err',timeout=180000)
    except Exception as e:errs.append('timeout '+str(e)[:80])
    e=await pg.evaluate('window.__err||""')
    if e:errs.append(e)
    el=await pg.query_selector('canvas')
    if el:await el.screenshot(path=OUT)
    print('captura:',OUT);print('errores:',errs or 'ninguno');print('RESULTADO: OK' if not errs and el else 'RESULTADO: FALLO');await b.close()
  if srv:srv.terminate()
asyncio.run(main())
