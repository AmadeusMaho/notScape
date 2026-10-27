#!/usr/bin/env python3
"""NotScape · comprobación de la FALDA LIGERA (túnicas y vestidos; src/r3d/skirt3d.js). Servidor del repo en 8811. Uso: python tools/r3d/skirt_check.py (sin -I).
Hace caminar y correr 3 s simulados al héroe con túnica de tela (3 culturas) y mide la penetración máxima de las piernas en la falda (con anticipación de 60 ms; el muelle
la abre justo lo necesario). FALLO si la prenda no tiene falda con cuñas (volvió a ser sólida) o si la penetración supera 12 cm (los pies atraviesan la túnica)."""
import asyncio,sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg=await b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
        await pg.goto('http://127.0.0.1:8811/tools/r3d/skirt_check.html',wait_until='commit')
        try:await pg.wait_for_function('window.__res',timeout=60000)
        except Exception as e:errs.append('timeout')
        r=await pg.evaluate('window.__res||null');await b.close()
    if not r:print('sin resultado',errs);print('RESULTADO: FALLO');sys.exit(1)
    mal=[]
    for c in r['casos']:
        print(f"  cultura {c['cultura']} {'corriendo' if c['run'] else 'andando'}: cuñas {c['cunas']} · penetración máx. {c['pen']} m")
        if not c['skirt'] or c['cunas']<6 or (c['pen'] or 0)>.12:mal.append(c)
    for e in errs:print('  JS',e)
    print('RESULTADO: OK' if not mal and not errs else 'RESULTADO: FALLO')
asyncio.run(main())
