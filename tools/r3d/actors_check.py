# NotScape · R3D · captura del VISOR de actores (docs/style-reference/r3d/actores-3d.html) sin pantalla (SwiftShader). Con el servidor del repo en 8811.
# Uso:  python3 -I tools/r3d/actors_check.py <salida.png> [grp=all|hum|quad|boss|ru] [state=idle|walk|attack|hit|hover|die] [t=1.2] [az=45] [ancho=1500] [alto=900] [ids=a,b,c] [cols=]
import asyncio,sys
from playwright.async_api import async_playwright
A=sys.argv;OUT=A[1];GRP=A[2] if len(A)>2 else 'all';ST=A[3] if len(A)>3 else 'idle';TT=A[4] if len(A)>4 else '1.2';AZ=A[5] if len(A)>5 else '45';W=int(A[6]) if len(A)>6 else 1500;H=int(A[7]) if len(A)>7 else 900;IDS=A[8] if len(A)>8 else '';COLS=A[9] if len(A)>9 else ''
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':W,'height':H});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_TUNNEL' not in m.text else None)
    q=f'?still&grp={GRP}&state={ST}&t={TT}&az={AZ}'+(f'&ids={IDS}' if IDS else '')+(f'&cols={COLS}' if COLS else '')
    await pg.goto('http://127.0.0.1:8811/docs/style-reference/r3d/actores-3d.html'+q,wait_until='commit')
    await pg.wait_for_function('(window.__done||0)>=2||window.__err',timeout=120000);await pg.wait_for_timeout(1500)
    e=await pg.evaluate('window.__err||""');errs+= [e] if e else []
    await pg.screenshot(path=OUT,timeout=120000);print('errores:',errs or 'ninguno');print('RESULTADO: OK' if not errs else 'RESULTADO: FALLO');await b.close()
asyncio.run(main())
