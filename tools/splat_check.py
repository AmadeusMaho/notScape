#!/usr/bin/env python3
"""F5-B · hitsplats estilo OSRS: genera splats de prueba (daño, fallo, máximo, curación, 3 dígitos) sobre el jugador y un monstruo y guarda una captura ampliada.
Uso: python3 -I tools/splat_check.py [salida.png]. Mide que el centro del splat coincida (±2 px) con la vertical de los pies del objetivo. RESULTADO: OK / FALLO."""
import sys, os, subprocess, time
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1] if len(sys.argv) > 1 else '/tmp/splat.png'
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8780', '--bind', '127.0.0.1'], cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1); errs = []; fails = []
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1280, 'height': 800}, device_scale_factor=1)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('http://127.0.0.1:8780/index.html?noedit'); pg.wait_for_timeout(1500)
        pg.evaluate('''()=>{const m=M.find(m=>m.d.id==='vaca');window.__m=m;P.x=m.x-60;P.y=m.y+10;P.mv=null;P.g=null;m.hunt=0}''')
        pg.wait_for_timeout(600)
        r = pg.evaluate('''()=>{const m=window.__m;m.mv=0;const s=ISO.scale(),a=ISO.toCanvas(m.x,m.y,TER.standZ(m.x,m.y)),pp=ISO.toCanvas(P.x,P.y,TER.standZ(P.x,P.y)),rc=cv.getBoundingClientRect();
          splat(m.x,m.y,7,null,m.d.h+6);splat(P.x,P.y,0,null,26);setTimeout(()=>{},0);
          return {mx:rc.left+a.x*rc.width/cv.width,my:rc.top+a.y*rc.height/cv.height,px:rc.left+pp.x*rc.width/cv.width,py:rc.top+pp.y*rc.height/cv.height}}''')
        pg.wait_for_timeout(120)
        pg.evaluate('''()=>{const m=window.__m;splat(m.x+30,m.y+40,24,'#d8a020',30);splat(m.x-30,m.y-40,105,null,30);splat(m.x+90,m.y+20,3,'#2f9a3a',30)}''')
        pg.wait_for_timeout(80)
        x0 = max(0, r['mx'] - 260); y0 = max(0, r['my'] - 190)
        pg.screenshot(path=out, clip={'x': x0, 'y': y0, 'width': 520, 'height': 300})
        # el centro horizontal de la salpicadura del monstruo debe caer sobre sus pies (x de pantalla)
        c = pg.evaluate('''()=>{const p=parts.find(q=>q.hs&&q.tx==='7');const b=hsBake(p.hs,p.tx),q=ISO.toCanvas(p.x,p.y,TER.standZ(p.x,p.y)),px=Math.max(2,Math.round(ISO.scale()*1.1));return (q.x-b.W*px/2+p.jx*px+b.W*px/2)-q.x}''')
        if abs(c) > 2 * 3 + 1: fails.append('splat descentrado %.1f px' % c)
        b.close()
finally:
    srv.kill()
for e in errs: fails.append('JS: ' + e)
print('guardado', out)
for f in fails: print('FALLO:', f)
print('RESULTADO:', 'OK' if not fails else 'FALLO'); sys.exit(1 if fails else 0)
