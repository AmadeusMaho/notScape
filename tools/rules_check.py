#!/usr/bin/env python3
"""Auditoría estática de las REGLAS de creación de NotScape (21 oct 2026). No necesita navegador.
Uso:  PYTHONUTF8=1 python tools/rules_check.py        → imprime cada comprobación (OK / AVISO / FALLO) y `RESULTADO: …`.
Comprueba que lo que dicen AGENTS.md y docs/REGLAS_CREACION.md se cumple en el código y en los archivos. Añade aquí una función por cada regla nueva que se pueda comprobar con texto."""
import re, sys, pathlib

R = pathlib.Path(__file__).resolve().parent.parent
rd = lambda p: (R / p).read_text(encoding='utf8', errors='replace')
res = []   # (nivel, regla, detalle)
def ok(r, d=''): res.append(('OK', r, d))
def warn(r, d): res.append(('AVISO', r, d))
def bad(r, d): res.append(('FALLO', r, d))

src = sorted((R / 'src').glob('*.js')); r3d = sorted((R / 'src/r3d').glob('*.js')) + sorted((R / 'src/r3d').glob('*.mjs'))
idx = rd('index.html'); ag = rd('AGENTS.md')

# 1. index.html carga solo archivos que existen, y todo src/*.js está cargado (o es módulo r3d)
loaded = re.findall(r'<script[^>]+src="([^"]+)"', idx)
miss = [s for s in loaded if not (R / s.split('?')[0]).exists()]
(bad if miss else ok)('index.html: todos los <script> existen', ', '.join(miss))
orph = [p.name for p in src if 'src/' + p.name not in [l.split('?')[0] for l in loaded]]
(warn if orph else ok)('src/*.js sin <script> en index.html', ', '.join(orph))

# 2. Rutas citadas en AGENTS.md (entre comillas invertidas) que no existen
paths = set(re.findall(r'`((?:src|docs|tools|assets|css)/[A-Za-z0-9_./\-<>*]+?\.(?:js|mjs|py|md|html|css|json))`', ag))
gone = sorted(p for p in paths if '<' not in p and '*' not in p and not (R / p).exists())
(warn if gone else ok)('rutas citadas en AGENTS.md que ya no existen (deben estar marcadas BORRADO/OBSOLETO o corregirse)', ', '.join(gone))

# 3. Determinismo: nada de Math.random en módulos de arte (props, naturaleza, modelos, iconos, actores)
ART = ['propsdark', 'nature3d', 'props3d', 'itemgen3d', 'icons3d', 'mini3d', 'herom3d', 'actors3d', 'outfitwear3d', 'wings3d', 'cloth3d', 'stations3d', 'interiors3d']
for p in r3d:
    if any(a in p.name for a in ART):
        n = len(re.findall(r'Math\.random\(', rd(str(p.relative_to(R)))))
        (bad if n else ok)('determinismo (sin Math.random) en ' + p.name, f'{n} usos' if n else '')

# 4. Todo módulo propsdark_*3d.js exporta clipReport y está en roof_clip.html (regla ANTICLIP)
rc = rd('tools/r3d/roof_clip.html') if (R / 'tools/r3d/roof_clip.html').exists() else ''
for p in sorted((R / 'src/r3d').glob('propsdark*3d.js')):
    t = rd(str(p.relative_to(R)))
    if 'gable' in t or 'B.gable' in t:
        good = 'clipReport' in t and p.name in rc
        (ok if good else bad)('ANTICLIP: ' + p.name + ' exporta clipReport y está en roof_clip.html', '' if good else 'falta')

# 5. GLSL: pow(...) sin max(...,0.) en el primer argumento (NaN al bloom) → solo aviso para revisión manual
for p in r3d:
    t = rd(str(p.relative_to(R)))
    for m in re.finditer(r'pow\(\s*([^,()]+(?:\([^()]*\))?[^,()]*),', t):
        a = m.group(1).strip()
        if re.fullmatch(r'[0-9.]+', a) or a.startswith('max(') or a.startswith('abs(') or a.startswith('clamp(') or a.startswith('exp'): continue
        if re.search(r'varying|uniform|gl_Frag|float ', t[max(0, m.start() - 400):m.start()]):
            res.append(('REVISAR', 'pow() con base no acotada en ' + p.name, a[:60]))

# 6. Tablas por bioma: cada bioma nuevo = una fila. Cuenta de biomas declarada vs. filas (texto)
nb = len(re.findall(r"\{id:'[a-z]+',cult:", rd('src/biome-rules.js')))
(ok if nb >= 10 else warn)('BIOME_RULES: filas con id', str(nb))
tp = re.search(r'TREEPAL\s*=\s*\[(.*?)\];', rd('src/r3d/nature3d.js'), re.S)
if tp: (ok if tp.group(1).count('{') >= 10 else warn)('TREEPAL: una fila por bioma (≥10)', str(tp.group(1).count('{')))
else: warn('TREEPAL no encontrado', '')

# 6b. Cobertura por bioma de las demás tablas (biomas 6–8 son esqueletos: se avisa, no se falla)
NB = 10
cov = [('música DEF (music.js)', len(re.findall(r"(?:^|[ ,{])(\d+):\{aldea:", rd('src/music.js'))) + (1 if re.search(r"DEF\[9\]\s*=", rd('src/music.js')) else 0)),
       ('cultura de aldeanos CU (villagers.js)', len(re.findall(r"\{n:'[^']+',robes", rd('src/villagers.js')))),
       ('paleta de interiores PALS (interiors.js; 6–8 usan IKB)', len(re.findall(r"\{nm:'[^']+',style", rd('src/interiors.js')))),
       ('ambiente CFG (ambience.js)', len(re.findall(r"/\*\d+ [^*]*\*/\s*\{", rd('src/ambience.js'))))]
for n, c in cov:
    (ok if c >= NB else warn)(f'cobertura por bioma: {n}', f'{c}/{NB}')

# 7. Documentación: tamaño de AGENTS.md y nº de lotes (la propia regla: archivar a HISTORIAL cuando pasen de ~10)
sz = len(ag.encode('utf8')); lotes = len(re.findall(r'^### (?:Lote|PROPUESTA)', ag, re.M))
(ok if sz <= 150_000 else warn)(f'AGENTS.md ≤ 150 KB (hoy {sz // 1024} KB)', '')
(ok if lotes <= 14 else warn)(f'lotes en el registro de AGENTS.md ≤ 14 (hoy {lotes})', '')

# 8. Cada doc de «Orden de lectura» existe
docs = set(re.findall(r'`(docs/[A-Za-z0-9_\-]+\.md)`', ag))
m = sorted(d for d in docs if not (R / d).exists()); (bad if m else ok)('docs citados en AGENTS.md existen', ', '.join(m))
rg = (R / 'docs/REGLAS_CREACION.md').exists(); (ok if rg else bad)('docs/REGLAS_CREACION.md existe', '')

for lv, r, d in res: print(f'{lv:7} {r}' + (f'  → {d}' if d else ''))
nf = sum(1 for x in res if x[0] == 'FALLO'); nw = sum(1 for x in res if x[0] in ('AVISO', 'REVISAR'))
print(f'\nRESULTADO: {"OK" if not nf else "FALLO"} ({nf} fallos, {nw} avisos)'); sys.exit(1 if nf else 0)
