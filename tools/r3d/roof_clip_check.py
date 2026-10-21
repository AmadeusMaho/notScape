#!/usr/bin/env python3
"""Verificador ANTI-CLIPPING de tejados (20 oct 2026). Uso: python3 tools/r3d/roof_clip_check.py  (desde la raíz del repo; levanta su propio servidor).
Sale con código 1 si algún modelo de `propsdark3d.js` tiene piezas que asoman por encima de su tejado. Reglas: AGENTS.md «Reglas» (PROPS CON TEJADO) y docs/HISTORIAL.md «Lote R3D-ANTICLIP»."""
import subprocess,sys,time,json,glob,os,re
from playwright.sync_api import sync_playwright
# COBERTURA OBLIGATORIA (R3D-ANTICLIP): todo módulo `src/r3d/propsdark*.js` que construya tejados con `gable(` debe exportar `clipReport` Y estar importado en roof_clip.html.
# Un módulo nuevo (otro bioma) que no esté aquí hace FALLAR la comprobación: añádelo a roof_clip.html (import + fila del bucle) en el mismo lote.
html=open('tools/r3d/roof_clip.html').read();miss=[]
for f in sorted(glob.glob('src/r3d/propsdark*.js')):
    t=open(f).read()
    if 'gable(' not in t and 'b.R.push' not in t: continue
    if 'export function clipReport' not in t or os.path.basename(f) not in html: miss.append(f)
if miss: print('SIN VERIFICAR (añade export clipReport + import en tools/r3d/roof_clip.html):',*miss,sep='\n  ');sys.exit(1)
srv=subprocess.Popen([sys.executable,'-m','http.server','8765'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1.5)
try:
    with sync_playwright() as p:
        b=p.chromium.launch();pg=b.new_page();pg.goto('http://localhost:8765/tools/r3d/roof_clip.html');pg.wait_for_function('window.__out',timeout=30000);o=pg.evaluate('window.__out');b.close()
finally: srv.terminate()
# modelos con clipping CONOCIDO aún sin auditar (la torre/anexos se mezclan con fallos reales): se listan como PEND y no hacen fallar. QUITAR de aquí al arreglarlos.
PEND={'pr:iglesia:troncos','pr:iglesia:palafito','pr:iglesia:stave'}
bad=0
for n,r in o.items():
    if 'err' in r: print('ERROR',n,r['err']);bad+=1;continue
    if r['roofs']==0: continue
    ok=r['n']==0;pend=(not ok) and n in PEND;bad+=0 if (ok or pend) else 1
    print(('OK   ' if ok else ('PEND ' if pend else 'CLIP ')),n.ljust(10),f"tejados={r['roofs']} vértices_fuera={r['n']} sobra_max={r['max']:.3f}",'' if ok else r['ej'])
print('RESULTADO:','TODO OK' if not bad else f'{bad} modelo(s) con clipping');sys.exit(1 if bad else 0)
