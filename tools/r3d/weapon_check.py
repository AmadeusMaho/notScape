#!/usr/bin/env python3
"""NotScape · comprobación de armas por cultura (tiras/aristas FLOTANTES, p. ej. la línea vertical de la espadón del desierto). Servidor del repo en 8811.
Uso:  python tools/r3d/weapon_check.py   → imprime las armas con piezas delgadas que se salen de su hoja y acaba en RESULTADO: OK / FALLO (necesita Playwright; sin -I)."""
import asyncio,sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg=await b.new_page();errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
        await pg.goto('http://127.0.0.1:8811/tools/r3d/weapon_check.html',wait_until='commit')
        try:await pg.wait_for_function('window.__res',timeout=60000)
        except Exception as e:errs.append('timeout '+str(e)[:80])
        r=await pg.evaluate('window.__res||null');await b.close()
    if not r:print('sin resultado',errs);print('RESULTADO: FALLO');sys.exit(1)
    print(f"armas OK: {r['ok']} · omitidas (arma base): {r['omitidos']} · errores: {len(r['errores'])} · FLOTANTES: {len(r['fallos'])}")
    for e in r['errores']:print('  ERROR',e)
    for f in r['fallos']:print('  FLOTANTE',f['arma'],'cultura',f['cultura'],f['piezas'])
    for e in errs:print('  JS',e)
    print('RESULTADO: OK' if not r['fallos'] and not r['errores'] and not errs else 'RESULTADO: FALLO')
asyncio.run(main())
