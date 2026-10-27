#!/usr/bin/env python3
"""NotScape · comprobación de «VIGAS» y PLACAS PLANAS (26 oct 2026). Servidor del repo en 8811. Uso:  python tools/r3d/beam_check.py [-v]   (sin -I: necesita Playwright).
 1) VIGAS (beam_check.html): para cada cultura (0–10) y familia (metal, cuero, tela) busca cajas largas y RECTAS (franjas, correas) sobre el torso/piernas curvos cuyo hueco con el cuerpo
    varía > 16 mm. Se arreglan con `ribbon()` (armorcult3d.js), que sigue la curvatura. La tela suelta que cuelga se marca con `cloth()` (userData.cloth) y se ignora.
 2) PLACAS PLANAS (escaneo estático): `box(a,b,c)` con lado mayor ≥ .28, segundo ≥ .18 y grosor ≤ .035 en los modelos de personajes/armaduras = un panel recto sin forma de tela
    (delantal, tabardo, jirones). Se arreglan con `drape()` (actors3d.js). Se exime con un comentario `slab-ok` en la misma línea (p. ej. una hoja de herramienta rígida).
Acaba en RESULTADO: OK / FALLO."""
import asyncio,sys,re
from playwright.async_api import async_playwright
NM=['Pradera','Bosque','Pantano','Cumbres','Oriental','Volcán','Páramo','Desierto','Costa','Cielo','Infierno']
FILES=['actors3d','figure3d','mini3d','armor3d','armorcult3d','hero3d','herom3d','outfitwear3d','heroanim3d','helmets3d']
PAT=re.compile(r"box\(\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\s*\)")
def placas():
    out=[]
    for f in FILES:
        try:L=open(f'src/r3d/{f}.js',encoding='utf-8').read().split('\n')
        except OSError:continue
        for n,l in enumerate(L,1):
            if 'slab-ok' in l:continue
            for m in PAT.finditer(l):
                d=sorted(map(float,m.groups()),reverse=True)
                if d[0]>=.28 and d[1]>=.18 and d[2]<=.035:out.append(f'{f}.js:{n} {m.group(0)}')
    return out
async def vigas():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg=await b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
        await pg.goto('http://127.0.0.1:8811/tools/r3d/beam_check.html',wait_until='commit')
        try:await pg.wait_for_function('window.__res',timeout=120000)
        except Exception as e:errs.append('timeout '+str(e)[:80])
        r=await pg.evaluate('window.__res||null');await b.close()
    return r,errs
def main():
    pl=placas();r,errs=asyncio.run(vigas())
    print(f'placas planas (paños sin forma): {len(pl)}')
    for x in pl:print('  PLACA',x)
    if not r:print('sin resultado',errs);print('RESULTADO: FALLO');sys.exit(1)
    if '-v' in sys.argv:
        for t in r['tabla']:print(f"  {NM[t['k']]:9s} {t['f']:2s} vigas {t['vigas']} / {t['total']} franjas")
    print(f"armaduras OK: {r['ok']} · con VIGAS: {len(r['fallos'])}")
    for f in r['fallos']:print(f"  VIGAS {NM[f['k']]} ({f['f']}): "+'; '.join(f"largo {v['L']} hueco {v['mn']}..{v['mx']}" for v in f['vigas']))
    for e in errs:print('  JS',e)
    print('RESULTADO: OK' if not r['fallos'] and not errs and not pl else 'RESULTADO: FALLO')
main()
