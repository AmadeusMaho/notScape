#!/usr/bin/env python3
"""NotScape · comprobación casco ↔ cabeza (la cara/cabeza que ATRAVIESA el casco, o un casco «cerrado» que no cubre toda la cabeza). Servidor del repo en 8811.
Uso:  python tools/r3d/helmet_check.py [-v]   (sin -I: necesita Playwright). -v imprime la tabla completa. Acaba en RESULTADO: OK / FALLO."""
import asyncio,sys
from playwright.async_api import async_playwright
NM=['Pradera','Bosque','Pantano','Cumbres','Oriental','Volcán','Páramo','Desierto','Costa','Cielo','Infierno']
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg=await b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
        await pg.goto('http://127.0.0.1:8811/tools/r3d/helmet_check.html',wait_until='commit')
        try:await pg.wait_for_function('window.__res',timeout=120000)
        except Exception as e:errs.append('timeout '+str(e)[:80])
        r=await pg.evaluate('window.__res||null');await b.close()
    if not r:print('sin resultado',errs);print('RESULTADO: FALLO');sys.exit(1)
    if '-v' in sys.argv:
        for t in r['tabla']:print(f"  {NM[t['k']]:9s} q{t['q']} fuera x,y,z={t['donde']} desc x,y,z={t['dondeDesc']} piezas {t['piezas']:2d} sale {t['sale']:.3f} rasgos {t['rasgos']} prof {t['prof']:.3f} desc {t['desc']:.3f} {'CERRADO' if t['cerrado'] else ''}")
    print(f"cascos OK: {r['ok']} · FALLOS: {len(r['fallos'])}")
    for f in r['fallos']:print(f"  FALLO {NM[f['k']]} q{f['q']}: cabeza que sale {f['sale']*100:.1f} % · rasgos de la cara fuera {f['rasgos']} · profundidad {f['prof']:.3f}"+(f" · DESCUBIERTA {f['descubierta']*100:.1f} %" if f['cerrado'] else ''))
    for e in errs:print('  JS',e)
    print('RESULTADO: OK' if not r['fallos'] and not errs else 'RESULTADO: FALLO')
asyncio.run(main())
