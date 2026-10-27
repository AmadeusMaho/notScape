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
# 1b. (OPT-RENDIMIENTO, 22 oct 2026) todo módulo 3D tiene su <link rel="modulepreload"> (si falta, se baja en cascada y la carga se alarga) y todo modulepreload existe
pre = re.findall(r'<link rel="modulepreload" href="([^"]+)"', idx)
nopre = [p.name for p in r3d if 'src/r3d/' + p.name not in pre]
(warn if nopre else ok)('src/r3d/* sin modulepreload en index.html', ', '.join(nopre))
pmiss = [s for s in pre if not (R / s).exists()]
(bad if pmiss else ok)('index.html: todos los modulepreload existen', ', '.join(pmiss))

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

# 9. RENDIMIENTO = PRIORIDAD 1 (docs/REGLAS_CREACION.md §P, lote OPT-RENDIMIENTO 22 oct 2026; el juego iba a 20 fps en una integrada).
#    TRINQUETES: estos números NO pueden subir sin permiso del dueño. Si el dueño aprueba subir uno, cambia aquí el límite Y anótalo en el lote.
code = {p: rd(str(p.relative_to(R))) for p in src + r3d}
allc = '\n'.join(code.values())
def cnt(rx): return len(re.findall(rx, allc))
TRINQ = [  # (nombre, regex, límite de hoy)
    ('renderers WebGL (new THREE.WebGLRenderer)', r'new THREE\.WebGLRenderer\(', 4),   # F4 (26 oct 2026): el héroe ya no tiene renderer propio (5 → 4)
    ('luces de three (PointLight/SpotLight; recompilan todo)', r'new THREE\.(?:PointLight|SpotLight)\(', 5),
    ('castShadow=true', r'castShadow\s*=\s*(?:\w+\.receiveShadow\s*=\s*)?true', 28),
    ('frustumCulled=false', r'frustumCulled\s*[:=]\s*false', 48),
    ('EffectComposer', r'new EffectComposer\(', 1),
    ('preserveDrawingBuffer:true', r'preserveDrawingBuffer\s*:\s*true', 1),
]
for n, rx, lim in TRINQ:
    c = cnt(rx); (bad if c > lim else ok)(f'RENDIMIENTO trinquete: {n} ≤ {lim}', f'hoy {c}')
# geometrías densas
dense = []
for p, t in code.items():
    for m in re.finditer(r'PlaneGeometry\(\s*[^,()]+,\s*[^,()]+,\s*(\d+)\s*,\s*(\d+)', t):
        if max(int(m.group(1)), int(m.group(2))) > 150: dense.append(f'{p.name}: {m.group(0)}')
    for m in re.finditer(r'IcosahedronGeometry\(\s*[^,()]+,\s*(\d+)\s*\)', t):
        if int(m.group(1)) >= 3: dense.append(f'{p.name}: {m.group(0)}')
    for m in re.finditer(r'SphereGeometry\(\s*[^,()]+,\s*(\d+)', t):
        if int(m.group(1)) >= 48: dense.append(f'{p.name}: {m.group(0)}')
(bad if dense else ok)('RENDIMIENTO: sin geometrías densas (plano >150 seg., icosaedro detalle ≥3, esfera ≥48)', '; '.join(dense))
# sectores estáticos sin updateMatrixWorld
for f in ('props3d.js', 'nature3d.js'):
    t = rd('src/r3d/' + f); (ok if 'g.updateMatrixWorld=NOUMW' in t else bad)(f'RENDIMIENTO: sectores estáticos con NOUMW en {f}', '')
# tablas por calidad: no más caras que hoy
def nums(rx, t):
    m = re.search(rx, t); return [float(x) for x in re.findall(r'[\d.]+(?:e\d+)?', m.group(1))] if m else None
gj = rd('src/game.js'); rj = rd('src/r3d/r3d.js')
for n, rx, t, lim in [('QCAPS', r'const QCAPS=\[([^\]]+)\]', gj, [4.5e6, 4.5e6, 2.4e6, 1.6e6, .95e6]),
                      ('GRASS_Q', r'const GRASS_Q=\[([^\]]+)\]', rj, [1.15, 1, .5, .25, 0]),   # 22 oct 2026: Máx/Alta subidas con permiso del dueño (lote PASTO-FRONDOSO)
                      ('lodR', r'terr\.lodR=[^;\[]*\[([^\]]+)\]', rj, [12, 9, 7, 5, 4]),
                      ('GFX view (auto = lodR)', r"\['view',[^\n]*?q=>\[([^\]]+)\]\[q\]", gj, [12, 9, 7, 5, 4]),   # FLUIDEZ (26 oct 2026): «Detalle a distancia» en Auto = lodR
                      ('GFX GRASS_Q_ (copia de GRASS_Q)', r'GRASS_Q_=\[([^\]]+)\]', gj, [1.15, 1, .5, .25, 0]),
                      ('BUDGET.tris', r'tris:\[([^\]]+)\]', rj, [2.9e6, 2.6e6, 1.35e6, 1.2e6, 1.05e6]),
                      ('BUDGET.calls', r'calls:\[([^\]]+)\]', rj, [600, 580, 460, 430, 400])]:
    v = nums(rx, t)
    if v is None or len(v) != len(lim): bad(f'RENDIMIENTO: tabla {n} no encontrada', 'se borró o cambió de forma: revisa §P')
    else: (bad if any(a > b * 1.0001 for a, b in zip(v, lim)) else ok)(f'RENDIMIENTO: {n} no más caro que el 22 oct', str(v))
for n, ok_, d in [
    ('presupuesto en el juego (BUDGET + budgetTick)', 'const BUDGET=' in rj and 'budgetTick(rnow)' in rj, 'src/r3d/r3d.js'),
    ('detección de GPU integrada (IGPU)', 'const IGPU=' in gj and ('else if(IGPU)QL=2' in gj or 'else if(IGPU||LOWDEV)QL=2' in gj), 'src/game.js'),
    ('reflejo del agua solo en Máx/Alta', 'this.q<=1)&&this.refNeed' in rd('src/r3d/water3d.js') and "['refl','Reflejos del agua',[[1,'Sí'],[0,'No']],q=>q<=1?1:0" in gj, 'src/r3d/water3d.js / GFX_DEF refl'),
    # Lote FLUIDEZ (26 oct 2026): basura por fotograma y re-evaluación de programas (tirones del recolector)
    ('reflejo del agua SIN planos de recorte globales (plano cercano oblicuo)', 'this.oblique(vc)' in rd('src/r3d/water3d.js') and 'clippingPlanes=[this.vplane]' not in rd('src/r3d/water3d.js'), 'src/r3d/water3d.js'),
    ('luces del héroe también en la capa 3 (sin cambio de estado de luces por pase)', '.forEach(l=>l.layers.enable(3))' in rj, 'src/r3d/r3d.js'),
    ('estaciones con material propio (twin), no el de los InstancedMesh', 'new Stations(scene,aScene,W3,twin(props.mat),twin(props.ink))' in rj, 'src/r3d/r3d.js'),
    ('three SIN minificar (el .min crea una función por llamada de dibujo = basura)', 'three/build/three.module.js"' in rd('index.html') and 'three.module.min.js' not in rd('index.html'), 'index.html'),
    ('opciones gráficas por aspecto (GFX_DEF/gfx) y límite de fps', 'const GFX_DEF=[' in gj and "gfx('fps')" in gj, 'src/game.js'),
    ('mapa con niebla: presupuesto pequeño con el minimapa', 'WMAP.paint(MM===2?8:1.5)' in gj, 'src/game.js'),
    # Lote HERBOLARIA-3 (27 oct 2026): el contorno «ink» de una pieza es HIJO de su malla (si copia la pose al crearse, girar la malla después deja una cuña negra)
    ('contorno de piezas: hijo de la malla en mini3d/icons3d/actors3d (no copia la pose)', all('m.add(h)' in rd(f) and 'h.rotation.copy(m.rotation)' not in rd(f) for f in ('src/r3d/mini3d.js','src/r3d/icons3d.js','src/r3d/actors3d.js')), 'src/r3d/mini3d.js, icons3d.js, actors3d.js'),
    # Lote FLUIDEZ-2 (26 oct 2026): propuestas F1–F16
    ('carga: dibujos «en seco» antes de precompilar (sin compilar shaders uno a uno)', 'R3D.dry=true' in gj and 'if(!dry)composer.render(dt)' in rj, 'src/game.js / src/r3d/r3d.js'),
    ('compuerta: objetos con un material que aún compila también se ocultan', 'this.pm.get(mt)' in rd('src/r3d/shadergate3d.js'), 'src/r3d/shadergate3d.js'),
    ('esqueletos actualizados una vez por fotograma (SKF)', 'THREE.Skeleton.prototype.update=function(){if(this._skf===SKF)return' in rj, 'src/r3d/r3d.js'),
    ('sombras de InstancedMesh con material de profundidad propio (depthI)', 'depthI(new THREE.InstancedMesh' in rd('src/r3d/props3d.js') and 'depthI(new THREE.InstancedMesh' in rd('src/r3d/nature3d.js'), 'props3d.js / nature3d.js'),
    ('terreno: vértices de la rejilla calculados una vez (GV)', 'GV[b*N1+a]=' in rd('src/r3d/terrain3d.js'), 'src/r3d/terrain3d.js'),
    ('medidor de tirones presente (tools/r3d/stutter_check.py, con &load)', '&load' in rd('tools/r3d/stutter_check.py'), 'tools/r3d/stutter_check.py'),
    ('sombra del sol en caché (F9): lo fijo se reutiliza y solo se redibuja lo que se mueve', 'function shadowWork(' in rj and 'blitFramebuffer' in rj and "['shcache'," in gj, 'src/r3d/r3d.js / GFX_DEF'),
    ('héroe pintado por el renderer principal y compuesto en el lienzo 3D (F4)', 'const ar=r;' in rj and 'hgrade.composite(' in rj and 'hOcc' in rj, 'src/r3d/r3d.js'),
    ('calidad Auto que también sube, resolución dinámica y presets', 'QUP' in gj and 'function dynRes' in gj and 'const GFX_PRE=' in gj, 'src/game.js'),
    ('sombra a medio ritmo en Baja/Mínima', 'shF' in rj and 'r.shadowMap.autoUpdate=!lo' in rj, 'src/r3d/r3d.js'),
    ('reescalado FSR disponible y APAGADO por defecto (decisión del dueño)', 'let FSR_ON=false;' in gj and 'fsr=new ShaderPass' in rj, 'src/game.js / src/r3d/r3d.js'),
    ('servidor local con keep-alive', "protocol_version='HTTP/1.1'" in rd('tools/serve_nocache.py'), 'tools/serve_nocache.py'),
    # Lote ANTI-TIRONES (25 oct 2026): tirones por compilar shaders en juego
    ('compuerta de shaders activa (lo nuevo compila en 2.º plano, oculto)', 'new ShaderGate()' in rj and 'gate.tick(' in rj and 'src/r3d/shadergate3d.js' in rd('index.html'), 'src/r3d/r3d.js / index.html'),
    ('clave de programa del material toon SIN el color (un shader por color = tirones)', "customProgramCacheKey=()=>'t'+k" not in rd('src/r3d/materials3d.js') and "customProgramCacheKey=()=>pk" in rd('src/r3d/materials3d.js'), 'src/r3d/materials3d.js'),
    ('HUD sin backdrop-filter salvo con «Cristal del HUD» (body.hs-glass)', 'let GLASS=false;' in gj and 'body:not(.hs-glass) #hs .b::before' in rd('css/hud-susurro.css'), 'src/game.js / css/hud-susurro.css'),
    ('retratos 3D del HUD limitados e intercalados (PRT)', 'const PRT=' in rd('src/hud.js'), 'src/hud.js'),
]: (ok if ok_ else bad)(f'RENDIMIENTO: {n}', '' if ok_ else d)
wm = re.search(r'PR\.warm\((\d+)\)', gj); (ok if wm and int(wm.group(1)) >= 40 else bad)('RENDIMIENTO: props en tramos ≥ 40 ms (PR.warm)', wm.group(0) if wm else 'no encontrado')


# 10. CONVENCIONES DE IDS Y DATOS (D0, 23 oct 2026; docs/REGLAS_CREACION.md §13)
_rc = rd('docs/REGLAS_CREACION.md')
def _blk(name):
    m = re.search('```' + name + r'\n(.*?)\n```', _rc, re.S)
    return set(m.group(1).split()) if m else None
_sk, _skr, _pf = _blk('ids-skills'), _blk('ids-skills-reservadas'), _blk('ids-prefijos-reservados')
if _sk is None or _skr is None or _pf is None:
    bad('CONVENCIONES: §13 de REGLAS_CREACION.md con sus 3 bloques (ids-skills, ids-skills-reservadas, ids-prefijos-reservados)', 'falta un bloque')
else:
    ok('CONVENCIONES: §13 y sus bloques de datos presentes', '')
    _sm = re.search(r'const SK=\{(.*?)\},SKL', rd('src/game.js'))
    _keys = set(re.findall(r"(\w+):\['", _sm.group(1))) if _sm else set()
    _extra = _keys - _sk - _skr
    (ok if not _extra else bad)('CONVENCIONES: toda habilidad de SK está documentada en §13.2', '' if not _extra else 'sin documentar: ' + ', '.join(sorted(_extra)))
    _dup = _sk & _skr
    (ok if not _dup else bad)('CONVENCIONES: ninguna clave de habilidad repetida entre existentes y reservadas', ', '.join(sorted(_dup)))
    _jsw = {'do', 'in', 'if', 'for', 'new', 'var', 'let', 'try'}
    (ok if not ((_sk | _skr) & _jsw) else bad)('CONVENCIONES: ninguna clave de habilidad es palabra reservada de JS', '')
    _col = _pf & (_sk | _skr)
    (ok if not _col else bad)('CONVENCIONES: ningún prefijo de objeto reservado choca con una clave de habilidad', ', '.join(sorted(_col)))
    _ex = re.search(r'\*\*Prefijos existentes.*?\n', _rc)
    _used = set(re.findall(r'`(\w+)_`', _ex.group(0))) if _ex else set()
    _clash = _pf & _used
    (ok if not _clash else bad)('CONVENCIONES: ningún prefijo reservado coincide con uno ya en uso', ', '.join(sorted(_clash)))
    (ok if "'og_'+of+'_'+sl+'_'+t[0]" in rd('src/oficios.js') else bad)('CONVENCIONES: ids de equipo de oficio con el id del TIER (no el índice)', 'src/oficios.js')

# 11. LISTA DE COMPROBACIÓN DE SKILL NUEVA (D3, 25 oct 2026; docs/REGLAS_CREACION.md §13.8)
# Toda clave de SK necesita: icono SVG en SKI, tarjeta en el panel de Habilidades (grupo G) y, si es de recolección u oficio, fila en tools/meas_progresion.py.
_g = rd('src/game.js')
_sm2 = re.search(r'const SK=\{(.*?)\},SKL', _g)
_sks = set(re.findall(r"(\w+):\['", _sm2.group(1))) if _sm2 else set()
_ski = re.search(r'const SKI=\{(.*?)\n', _g)
_skik = set(re.findall(r"(\w+):'<", _ski.group(1))) if _ski else set()
_gm = re.search(r"G=\[\['Combate',\[(.*?)\]\],\['Recolección',\[(.*?)\]\],\['Oficios',\[(.*?)\]\]\]", _g)
_grp = [set(re.findall(r"'(\w+)'", x)) for x in _gm.groups()] if _gm else [set(), set(), set()]
_mp = re.search(r"const sks=\[(.*?)\]", rd('tools/meas_progresion.py'))
_mps = set(re.findall(r"'(\w+)'", _mp.group(1))) if _mp else set()
_m1 = _sks - _skik
(ok if not _m1 and _sks else bad)('SKILL NUEVA: toda habilidad de SK tiene icono en SKI', 'sin icono: ' + ', '.join(sorted(_m1)))
_m2 = _sks - (_grp[0] | _grp[1] | _grp[2])
(ok if not _m2 else bad)('SKILL NUEVA: toda habilidad de SK sale en el panel de Habilidades (grupo G)', 'sin tarjeta: ' + ', '.join(sorted(_m2)))
_m3 = (_grp[1] | _grp[2]) - _mps
(ok if not _m3 else bad)('SKILL NUEVA: recolección y oficios con fila en tools/meas_progresion.py', 'sin fila: ' + ', '.join(sorted(_m3)))

# 12. ICONOS 3D DE OFICIO (D4, 25 oct 2026): todo kind que item-icons.js asigna a un objeto de oficio existe en craftgen3d.js (GEN3) con tamaño en SIZE3 y modulepreload
_cg = rd('src/r3d/craftgen3d.js'); _ii = rd('src/item-icons.js')
_g3 = set(re.findall(r'^ (\w+)\(p,g', _cg, re.M))
_crp = ' '.join(re.findall(r'const (?:CRK|OGK|CRP)=.*', _ii))
_used = set(re.findall(r"'(\w+)'", _crp)) & set(re.findall(r"(?:^|[\s,{])\w+:\s*\[?'(\w+)'", _crp)) if False else set(re.findall(r"'(\w+)'", _crp))
_old = {'hide', 'cloth'}
_missing = {k for k in re.findall(r":\['(\w+)','[twlg]'\]", _crp)} - _g3 - _old
(ok if _g3 and not _missing else bad)('ICONOS DE OFICIO: todo kind de CRP existe en craftgen3d.js', ', '.join(sorted(_missing)))
_sz3 = _cg.split('export const SIZE3=')[1] if 'export const SIZE3=' in _cg else ''
_sz = set(re.findall(r'(\w+):[.\d]+', _sz3))
(ok if _g3 <= _sz else bad)('ICONOS DE OFICIO: todo kind de GEN3 tiene tamaño en SIZE3', ', '.join(sorted(_g3 - _sz)))
(ok if 'craftgen3d.js' in rd('index.html') else bad)('ICONOS DE OFICIO: craftgen3d.js con modulepreload', 'index.html')

for lv, r, d in res: print(f'{lv:7} {r}' + (f'  → {d}' if d else ''))
nf = sum(1 for x in res if x[0] == 'FALLO'); nw = sum(1 for x in res if x[0] in ('AVISO', 'REVISAR'))
print(f'\nRESULTADO: {"OK" if not nf else "FALLO"} ({nf} fallos, {nw} avisos)'); sys.exit(1 if nf else 0)
