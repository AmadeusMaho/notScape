#!/usr/bin/env python3
"""F6 · ambiente, clima y luz por bioma: captura cada bioma de día, de noche y (Pradera/Bosque/Pantano) con lluvia.
Fuerza la hora desplazando el reloj de rAF (init script) y el clima con WX. Uso: python3 -I tools/ambient_check.py [salida.png]
Comprueba: sin errores de consola, que AMBI genere partículas del bioma y que el conteo no pase de 900. Termina con RESULTADO: OK / FALLO."""
import sys, os, subprocess, time, io
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1] if len(sys.argv) > 1 else '/tmp/ambient.png'
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8781', '--bind', '127.0.0.1'], cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1); errs = []; fails = []; shots = []
NOON, NIGHT = 61200, 241000   # ms de reloj: dayP=.5 (mediodía) / dayP=0 (medianoche)
sc = [(k, h, w) for k in range(6) for h, w in (('dia', ''), ('noche', '')) ] + [(k, 'lluvia', 'rain') for k in range(3)] + [(2, 'tormenta', 'storm')]
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        for k, h, w in sc:
            pg = b.new_page(viewport={'width': 1280, 'height': 800}, device_scale_factor=1)
            pg.on('console', lambda m: errs.append(m.text) if (m.type == 'error' or '[PROPS]' in m.text) and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
            pg.on('pageerror', lambda e: errs.append(str(e)))
            off = NIGHT if h == 'noche' else NOON
            pg.add_init_script('window.__off=%d;const _r=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=f=>_r(t=>f(t+window.__off));' % off)
            pg.goto('http://127.0.0.1:8781/index.html?noedit'); pg.wait_for_timeout(1200)
            pg.evaluate('(k)=>{S.boss=[1,1,1,1,1];{const q=spawnOf(k);P.x=q.x+(k?900:0);P.y=q.y+(k?0:-900)}P.mv=null;P.g=null}', k)
            if w: pg.evaluate('(w)=>{WX.t=w;WX.end=1e15;WX.next=1e15}', w)
            pg.wait_for_timeout(4500)
            n = pg.evaluate('AMBI.count'); png = pg.locator('canvas').first.screenshot(); shots.append(('%d %s' % (k, h), png)); print('bioma %d %-8s partículas=%d' % (k, h, n))
            if n > 900: fails.append('demasiadas partículas %d' % n)
            if k in (3, 5) and h == 'dia' and n < 5: fails.append('bioma %d sin partículas' % k)
            pg.close()
        b.close()
finally:
    srv.kill()
for e in errs: fails.append('consola: ' + e)
from PIL import Image, ImageDraw
cols = 4; W_, H_ = 640, 420; rows = (len(shots) + cols - 1) // cols; im = Image.new('RGB', (W_ * cols, H_ * rows), '#fdf9e3')
for i, (n, png) in enumerate(shots):
    t = Image.open(io.BytesIO(png)).resize((W_, H_)); im.paste(t, ((i % cols) * W_, (i // cols) * H_)); ImageDraw.Draw(im).text(((i % cols) * W_ + 6, (i // cols) * H_ + 6), n, fill='#ffffff')
im.save(out); print('guardado', out)
for f in fails: print('FALLO:', f)
print('RESULTADO:', 'OK' if not fails else 'FALLO'); sys.exit(1 if fails else 0)
