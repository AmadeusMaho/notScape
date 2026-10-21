#!/usr/bin/env python3
"""Balance de oficios (Fase 3·c, 21 oct 2026). Carga el juego REAL y analiza ACT (recolección + recetas):
  · recetas con más de 5 componentes distintos, ingredientes que no se pueden obtener de ninguna forma (recolección, otra receta, drop de monstruo, tienda, raro),
  · golpes por recurso y segundos estimados (rueda de tala/minería) según tier de la herramienta,
  · esfuerzo por pieza = suma de recolección de sus ingredientes + golpes de la propia receta.
Uso:  PYTHONUTF8=1 python tools/craft_balance.py [salida.md]   (servidor en :8811: python tools/serve_nocache.py 8811). Acaba en `RESULTADO: OK/FALLO`.
Supuestos (ajustables arriba): 1 golpe BUENO ≈ 1,0 s de rueda; un drop de monstruo ≈ 25 s de caza; tienda ≈ 5 s."""
import asyncio, json, sys, pathlib
from playwright.async_api import async_playwright

SEC_HIT, SEC_MOB, SEC_SHOP = 1.0, 25.0, 5.0
URL = 'http://127.0.0.1:8811/index.html?r3d=1&noedit'
JS = """(()=>{
 applyInterlock();
 const out={gather:{},recipes:[],sources:{},drops:{}};
 for(const k of Object.keys(ACT)){
  for(const a of ACT[k]){
   if(a.length===6){out.recipes.push({sk:k,name:a[0],mats:a[1],out:String(a[2]),lv:a[3],xp:a[4],ms:a[5]})}
   else{out.gather[k]=out.gather[k]||[];out.gather[k].push({name:a[0],item:a[1],lv:a[2],xp:a[3]})}
  }
 }
 const hits={};for(const sk of ['wc','mi']){hits[sk]=ACT[sk].map(a=>{const row=[];for(let t=0;t<=5;t++){const hp=3*Math.pow(NODER,TLV(rq(a)));row.push(Math.max(3,Math.min(12,Math.round(2*hp/(Math.pow(NODER,t)*(1+Math.max(1,rq(a))*.01))))))}return row})}
 out.hits=hits;
 const drops={};if(typeof MD!=='undefined')for(const id in MD){for(const d of (MD[id].dr||[]))(drops[d[0]]=drops[d[0]]||[]).push(id)}out.drops=drops;
 out.tsrc=typeof TSRC!=='undefined'?TSRC:{};
 out.shop=[];try{for(const v in TRADE.VEND){const s=TRADE.VEND[v].stock?TRADE.VEND[v].stock(5):[];s.forEach(r=>out.shop.push(r[0]))}}catch(e){}
 out.rare=typeof RARE!=='undefined'?RARE:{};
 return out})()"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page()
        await pg.goto(URL, wait_until='commit')
        await pg.wait_for_function('typeof ACT!=="undefined"&&typeof applyInterlock==="function"&&typeof MD!=="undefined"&&typeof TRADE!=="undefined"', timeout=240000)
        d = await pg.evaluate(JS)
        await b.close()
    gather_item = {}
    for sk, rows in d['gather'].items():
        for i, r in enumerate(rows):
            gather_item[r['item']] = (sk, i)
    made = {r['out'] for r in d['recipes']}
    shop = set(d['shop']); drops = d['drops']; tsrc = d['tsrc']; rare = {v[0] for v in d['rare'].values()}

    def src(item):
        if item in gather_item: return 'gather'
        if item in made: return 'craft'
        if item in drops or item in tsrc: return 'mob'
        if item in shop: return 'shop'
        if item in rare: return 'rare'
        return None
    effort_cache = {}
    def effort(item, depth=0):
        if item in effort_cache: return effort_cache[item]
        s = src(item); e = None
        if s == 'gather':
            sk, i = gather_item[item]
            e = (d['hits'][sk][i][0] * SEC_HIT) if sk in d['hits'] else 6 * SEC_HIT   # hacha/pico inicial (peor caso); la pesca ≈ 15 s
            if sk == 'fi': e = 15.0
        elif s == 'mob': e = SEC_MOB
        elif s == 'shop': e = SEC_SHOP
        elif s == 'rare': e = 120.0
        elif s == 'craft' and depth < 6:
            r = next((r for r in d['recipes'] if r['out'] == item), None)
            e = sum(n * (effort(m, depth + 1) or 0) for m, n in r['mats'].items()) + r['ms'] / 1000.0 if r else None
        effort_cache[item] = e
        return e
    bad = []; warn = []; rows = []
    for r in d['recipes']:
        n = len(r['mats'])
        if n > 5: bad.append(f"{r['sk']}:{r['name']} tiene {n} componentes (>5)")
        for m in r['mats']:
            if src(m) is None: bad.append(f"{r['sk']}:{r['name']} pide «{m}», que no se puede obtener de ninguna forma")
        e = sum(q * (effort(m) or 0) for m, q in r['mats'].items()) + r['ms'] / 1000.0
        rows.append((r['sk'], r['lv'], r['name'], n, sum(r['mats'].values()), round(e), round(r['xp'] / max(1, e) * 60)))
        if e > 900: warn.append(f"{r['sk']}:{r['name']} cuesta ≈ {e/60:.0f} min de esfuerzo")
    rows.sort()
    md = ['# Balance de oficios', '', '| oficio | nivel | receta | comp. | uds. | esfuerzo (s) | XP/min |', '|---|---|---|---|---|---|---|'] + [f'| {a} | {b} | {c} | {d_} | {e} | {f} | {g} |' for a, b, c, d_, e, f, g in rows]
    md += ['', '## Golpes por recurso (rueda; por tier de herramienta 0…5)', ''] + [f"- {sk} {gi['name']} (nivel {gi['lv']}): {d['hits'][sk][i]}" for sk in d['hits'] for i, gi in enumerate(d['gather'][sk])]
    out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else None
    if out: out.write_text('\n'.join(md), encoding='utf8')
    print(f"recetas: {len(rows)} · componentes máx.: {max(r[3] for r in rows)} · esfuerzo máx.: {max(r[5] for r in rows)} s")
    for w in warn[:15]: print('AVISO', w)
    for x in bad: print('FALLO', x)
    print('RESULTADO:', 'FALLO' if bad else 'OK'); sys.exit(1 if bad else 0)

asyncio.run(main())
