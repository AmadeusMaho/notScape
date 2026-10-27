# NotScape · R3D · captura del VISOR de armaduras (docs/style-reference/r3d/armaduras-3d.html) sin pantalla (SwiftShader). Servidor del repo en 8811.
# Uso:  python3 -I tools/r3d/armor_sheet.py <salida.png> [set=metal|cuero|tela|cascos|botas|capas|escudos|conjuntos] [az=45] [ancho=1800] [alto=900] [ids=0,3,6] [cols=]
# Imprime errores y RESULTADO: OK/FALLO. REGLA DEL DUEÑO: tras modelar una pieza, mirar SIEMPRE la captura (y un recorte de cerca con ids=… y ancho/alto grandes).
import asyncio,sys
from playwright.async_api import async_playwright
import os
WALK=os.environ.get('WALK','');A=sys.argv;OUT=A[1];SET=A[2] if len(A)>2 else 'metal';AZ=A[3] if len(A)>3 else '45';W=int(A[4]) if len(A)>4 else 1800;H=int(A[5]) if len(A)>5 else 900;IDS=A[6] if len(A)>6 else '';COLS=A[7] if len(A)>7 else ''
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':W,'height':H});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_TUNNEL' not in m.text else None)
    q=f'?still&face=45&set={SET}&az={AZ}'+(f'&walk={WALK}' if WALK else '')+('&draw' if SET in ('escudos','conjuntos','armas') else '')+(f'&ids={IDS}' if IDS else '')+(f'&cols={COLS}' if COLS else '')
    await pg.goto('http://127.0.0.1:8811/docs/style-reference/r3d/armaduras-3d.html'+q,wait_until='commit')
    try:await pg.wait_for_function('window.__ready||window.__err',timeout=90000)
    except Exception as e:errs.append('timeout '+str(e)[:80])
    await pg.wait_for_timeout(2500);e=await pg.evaluate('window.__err||""')
    if e:errs.append(e)
    await pg.screenshot(path=OUT);print('captura:',OUT);print('errores:',errs or 'ninguno');print('RESULTADO: OK' if not errs else 'RESULTADO: FALLO');await b.close()
asyncio.run(main())
