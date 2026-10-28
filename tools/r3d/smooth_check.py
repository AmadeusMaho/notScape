# NotScape · R3D · DETECTOR DE ASSETS SIN SUAVIZAR (28 oct 2026). La forma antigua de sombrear (`tex:'auto'|'piedra'|'madera'… SIN `soft`) deja una textura RUGOSA tipo pixel-art; la actual (`soft:1`, texB bajo) es suave.
# Cada material `toon()` lleva ahora la etiqueta `userData.ns = {tex, soft, chr, ground, fol, texB}` (materials3d.js). Esta herramienta, con la GPU real:
#   · RUNTIME: visita la aldea de la Pradera, el Bosque, Cumbres, Volcán y TODAS las salas de las 6 culturas, recorre la escena y lista cada material con textura de clase y sin `soft` (excepto personajes `chr`, suelo `ground` y follaje `fol`), con cuántas mallas lo usan y nombres de muestra.
#   · ESTÁTICO: grep de `toon(`/`tex:` en src/r3d/*.js sin `soft` ni `chr` (informativo: pistas de dónde está el código antiguo).
# Uso (raíz del repo, servidor en 8811; sin `-I`):  python tools/r3d/smooth_check.py      → «RESULTADO: OK» si no queda ningún material rugoso; si no, FALLO con la lista.
import asyncio, sys, re, glob, io
from playwright.async_api import async_playwright

SPOTS = [('aldea Pradera', 4600, 15152), ('Bosque', None, None), ('Cumbres', None, None), ('Volcán', None, None)]
ROOMS = ['herreria', 'taberna', 'taller', 'banco', 'tienda', 'templo', 'botica']

COLLECT = r"""(()=>{const out={};const seen=new Set();const sc=R3D.rooms.scene;sc.traverse(o=>{const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];for(const m of ms){const ns=m.userData&&m.userData.ns;if(!ns)continue;const key=JSON.stringify([ns.tex,ns.soft,ns.chr,ns.ground,ns.fol,ns.texB]);const e=out[key]||(out[key]={ns,meshes:0,names:[]});e.meshes++;const nm=(o.name||(o.parent&&o.parent.name)||o.type)+'';if(e.names.length<4&&!e.names.includes(nm))e.names.push(nm)}});return out})()"""

async def main():
    agg = {}
    def add(o):
        for k, v in o.items():
            e = agg.setdefault(k, {'ns': v['ns'], 'meshes': 0, 'names': []})
            e['meshes'] += v['meshes']
            for n in v['names']:
                if len(e['names']) < 6 and n not in e['names']: e['names'].append(n)
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=False, args=['--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1100, 'height': 700}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://127.0.0.1:8811/index.html?test=1&noedit&at=4600,15152', wait_until='commit')
        await pg.wait_for_function('window.R3D&&R3D.rooms&&typeof enterRoom==="function"', timeout=120000)
        await pg.wait_for_timeout(9000)
        add(await pg.evaluate(COLLECT))
        # otros biomas: se teletransporta al centro de cada uno
        for k, nm in ((1, 'Bosque'), (3, 'Cumbres'), (5, 'Volcán')):
            pos = await pg.evaluate("(k=>{const B=BI[k];return[B.ox+B.village.safe[0],B.oy+B.village.safe[1]]})(%d)" % k)
            await pg.evaluate("(p=>{NSTEST.tp(p[0],p[1]);return 1})(%s)" % pos)
            await pg.wait_for_timeout(9000)
            add(await pg.evaluate(COLLECT))
        for k in range(6):
            for room in ROOMS:
                await pg.evaluate("([k,room])=>{enterRoom({id:'door',k,room,n:room,x:P.x,y:P.y});return 1}", [k, room])
                await pg.wait_for_timeout(500)
                add(await pg.evaluate(COLLECT))
                await pg.evaluate("()=>{leaveRoom(1);return 1}")
        await b.close()
    bad = []
    print('%-38s %7s  %s' % ('MATERIAL (tex | soft | chr | ground | fol | texB)', 'mallas', 'ejemplos'))
    for k, e in sorted(agg.items(), key=lambda kv: -kv[1]['meshes']):
        ns = e['ns']; rough = ns['tex'] is not None and ns['tex'] != 'montana' and not ns['soft'] and not ns['chr'] and not ns['ground'] and not ns['fol']
        flag = 'RUGOSO' if rough else ''
        if rough: bad.append(e)
        print('%-38s %7d  %s  %s' % ('%s|%s|%s|%s|%s|%s' % (ns['tex'], ns['soft'], ns['chr'], ns['ground'], ns['fol'], ns['texB']), e['meshes'], ', '.join(e['names'][:4]), flag))
    # estático
    print('\nESTÁTICO (pistas): toon(...) con tex: y sin soft/chr en src/r3d')
    for f in sorted(glob.glob('src/r3d/*.js')):
        for i, l in enumerate(io.open(f, encoding='utf-8').read().split('\n'), 1):
            for m in re.finditer(r"toon\([^;]*?tex\s*:\s*'[^']+'[^;]*", l):
                t = m.group(0)
                if 'soft' not in t and 'chr' not in t and 'ground' not in t and "'montana'" not in t:
                    print('  %s:%d  %s' % (f, i, t[:150]))
    print('errores de página:', errs[:3] or 'ninguno')
    print('RESULTADO: OK' if not bad else 'RESULTADO: FALLO (%d materiales rugosos)' % len(bad))
asyncio.run(main())
