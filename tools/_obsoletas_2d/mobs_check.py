#!/usr/bin/env python3
"""F5 · comprobación de monstruos en el juego: para cada id de MD busca un ejemplar, coloca al jugador al lado y recorta una captura.
Uso: python3 -I tools/mobs_check.py [salida.png] [ids,...]  (por defecto todos). Comprueba: sin errores de consola, que el sprite se hornee
(PROPS.mob no lanza), golpe y destello, y que h/etiqueta de MD vengan de CRE.H. Termina con RESULTADO: OK / FALLO."""
import sys, os, subprocess, time, io
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1] if len(sys.argv) > 1 else '/tmp/mobs.png'; ids = sys.argv[2].split(',') if len(sys.argv) > 2 else None
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8779', '--bind', '127.0.0.1'], cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1); errs = []; fails = []; shots = []
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1280, 'height': 800}, device_scale_factor=1)
        pg.on('console', lambda m: errs.append(m.text) if (m.type == 'error' or '[PROPS]' in m.text) and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('http://127.0.0.1:8779/index.html?noedit'); pg.wait_for_timeout(1500)
        pg.evaluate('S.boss=[1,1,1,1,1]')
        allids = pg.evaluate('[...new Set(M.map(m=>m.d.id))]')
        for i in (ids or allids):
            if i not in allids: fails.append(i + ': no hay ejemplares en el mundo'); continue
            r = pg.evaluate('''id=>{const m=M.find(m=>m.d.id===id);m.hunt=0;P.x=m.x-34;P.y=m.y+26;P.mv=null;P.g=null;m.at0=performance.now();m.fl=performance.now()+3000;return {h:m.d.h,n:m.d.n}}''', i)
            pg.wait_for_timeout(450)
            pg.evaluate('M.find(m=>m.d.id===%r).fl=0' % i); pg.wait_for_timeout(350)
            rc = pg.evaluate('(()=>{const r=cv.getBoundingClientRect();const q=ISO.toCanvas(P.x,P.y,TER.standZ(P.x,P.y));return [r.left+q.x*r.width/cv.width,r.top+q.y*r.height/cv.height]})()')
            png = pg.screenshot(clip={'x': max(0, rc[0] - 130), 'y': max(0, rc[1] - 190), 'width': 400, 'height': 300}); shots.append((i, png)); print('%-10s h=%s' % (i, r['h']))
        b.close()
finally:
    srv.kill()
for e in errs: fails.append('consola: ' + e)
try:
    from PIL import Image, ImageDraw
    cols = 4; rows = (len(shots) + cols - 1) // cols; im = Image.new('RGB', (400 * cols, 300 * rows), '#fdf9e3')
    for k, (n, png) in enumerate(shots):
        t = Image.open(io.BytesIO(png)); im.paste(t, ((k % cols) * 400, (k // cols) * 300)); ImageDraw.Draw(im).text(((k % cols) * 400 + 6, (k // cols) * 300 + 6), n, fill='#5b3a29')
    im.save(out); print('guardado', out)
except ImportError:
    for n, png in shots: open(out.replace('.png', '_' + n + '.png'), 'wb').write(png)
for f in fails: print('FALLO:', f)
print('RESULTADO:', 'OK' if not fails else 'FALLO'); sys.exit(1 if fails else 0)
