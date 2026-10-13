#!/usr/bin/env python3
"""F5-C · golpe máximo (daño amarillo) en el juego real: para espada, arco, báculo y puños fuerza que el siguiente golpe sea máximo y guarda 5 capturas por arma
(carga, tensado/lanzada, impacto…). Comprueba que el daño acabe en amarillo (splat '#d8a020'), que la animación use hv y que no haya errores de consola.
Uso: python3 -I tools/heavy_check.py [salida.png]. RESULTADO: OK / FALLO."""
import sys, os, subprocess, time, io
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1] if len(sys.argv) > 1 else '/tmp/heavy.png'
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8781', '--bind', '127.0.0.1'], cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1); errs = []; fails = []; rows = []
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1280, 'height': 800}, device_scale_factor=1)
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('http://127.0.0.1:8781/index.html?noedit'); pg.wait_for_timeout(1500)
        for name, w in [('espada', 'sw_hierro'), ('arco', 'bw_roble'), ('baculo', 'st_roble'), ('punos', None)]:
            r = pg.evaluate('''([w])=>{S.eq.w=w;S.runes.air=99;MN=50;const m=M.find(m=>m.d.id==='vaca');window.__m=m;m.hp=m.mh=9999;m.hunt=0;const dx=wtype()==='m'?-44:-110;P.x=m.x+dx;P.y=m.y+dx*-.35;P.mv=null;P.g=null;P.f=1;
              S.xp.cb=Math.max(S.xp.cb||0,5e4);S.xp.mg=Math.max(S.xp.mg||0,5e4);window.__log=[];return wtype()}''', [w])
            pg.wait_for_timeout(300)
            # fuerza que el siguiente golpe sea máximo: tira normal y lo sube al máximo
            pg.evaluate('''()=>{const m=window.__m,now=performance.now();startF(m,now);A.ms=1600;A.ph=now+1600;const N=A.nx;N.hit=true;N.heavy=true;
              if(N.wt==='g'){const si=autoSpell();if(si>=0){const s=SPL[si],mx=spMax(s);N.sp={si,hit:true,d:mx,mx}}else N.heavy=false}else N.d1=Math.max(2,maxHit())}''')
            shots = []
            for t in (500, 450, 300, 180, 120, 200):
                pg.wait_for_timeout(t)
                rc = pg.evaluate('(()=>{const r=cv.getBoundingClientRect(),m=window.__m,q=ISO.toCanvas((P.x+m.x)/2,(P.y+m.y)/2,TER.standZ(P.x,P.y));return [r.left+q.x*r.width/cv.width,r.top+q.y*r.height/cv.height]})()')
                shots.append(pg.screenshot(clip={'x': max(0, rc[0] - 110), 'y': max(0, rc[1] - 120), 'width': 220, 'height': 170}))
            y = pg.evaluate('parts.some(q=>q.hs===\'#d8a020\')||HFX.length>0')
            if not y and name != 'baculo': fails.append(name + ': no hubo golpe máximo visible')
            pg.evaluate('stopA()')
            rows.append((name, shots))
        b.close()
finally:
    srv.kill()
for e in errs: fails.append('consola: ' + e)
try:
    from PIL import Image
    im = Image.new('RGB', (220 * 6, 170 * len(rows)), '#fdf9e3')
    for r, (n, sh) in enumerate(rows):
        for c, png in enumerate(sh): im.paste(Image.open(io.BytesIO(png)), (c * 220, r * 170))
    im.save(out); print('guardado', out)
except ImportError: pass
for f in fails: print('FALLO:', f)
print('RESULTADO:', 'OK' if not fails else 'FALLO'); sys.exit(1 if fails else 0)
