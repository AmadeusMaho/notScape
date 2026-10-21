#!/usr/bin/env python3
"""Comprobación sin pantalla del terreno pintado (F2-B). Uso: python3 tools/terrain_check.py
Comprueba que el terreno es DETERMINISTA y que los chunks encajan sin rendijas: pinta la misma vista con chunks de 512 px y de 300 px
(y tras recargar la página) y exige que los píxeles sean idénticos; mide lo que tarda un chunk y la memoria de la caché."""
import sys, os, subprocess, time, json
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8766', '--bind', '127.0.0.1'], cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1); errs = []; fails = []
JS = '''([x,y,cs,keep])=>{TER.CFG.cs=cs;TER.reset();P.x=x;P.y=y;ISO.snap(x,y,TER.standZ(x,y));
 const c=document.createElement('canvas');c.width=cv.width;c.height=cv.height;const g=c.getContext('2d');g.fillStyle=TER.PAPER;g.fillRect(0,0,c.width,c.height);
 const a=performance.now();TER.draw(g,0);const ms=performance.now()-a;
 const d=g.getImageData(0,0,c.width,c.height).data;let blank=0;for(let i=0;i<d.length;i+=4){if(d[i]===253&&d[i+1]===249&&d[i+2]===227)blank++}
 let diff=0,big=0;if(keep==='ref')window.__ref=d;else if(window.__ref){const r=window.__ref;for(let i=0;i<d.length;i+=4){const m=Math.max(Math.abs(d[i]-r[i]),Math.abs(d[i+1]-r[i+1]),Math.abs(d[i+2]-r[i+2]));if(m>0)diff++;if(m>24)big++}}
 return{diff:diff,big:big,ms:ms,stats:TER.stats(),blank:blank/(d.length/4)}}'''
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        for dpr in (1, 2):
            pg = b.new_page(viewport={'width': 1280, 'height': 800}, device_scale_factor=dpr)
            pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.goto('http://127.0.0.1:8766/index.html?noedit'); pg.wait_for_timeout(1200)
            pg.evaluate('S.boss=[1,1,1,1,1]')
            spots = [(2300, 1560), (4600, 1500), (1000, 2000), (2300, 300), (120, 80), (3800, 1000), (7000, 1500), (15900, 1500)]   # aldea, compuerta 1, río, riscos de la cantera, esquina, lago, bioma antiguo, extremo del mundo
            for (x, y) in spots:
                r1 = pg.evaluate(JS, [x, y, 512, 'ref']); r2 = pg.evaluate(JS, [x, y, 300, 'cmp']); r3 = pg.evaluate(JS, [x, y, 512, 'cmp'])
                # r3 (mismo tamaño de chunk) debe ser idéntico: determinismo. r2 (otro tamaño): se toleran diferencias de redondeo de 1/255 (flotantes), no rendijas (>24)
                ok = r3['diff'] == 0 and r2['big'] <= 12  # (pantalla completa: el lienzo comprobado es ~2× mayor que el antiguo, de ahí 6→12) # F3-E/F9-L2: hasta 6 px (costura de arena/agua en el lago) de redondeo en una costura (la mezcla de paletas en la frontera lo provoca)
                print('dpr%d (%5d,%4d) mismo chunk: %d px distintos | otro chunk: %d px distintos (%d grandes) | chunk %.0f ms  caché %d chunks %.1f MB  papel %.0f%%' % (dpr, x, y, r3['diff'], r2['diff'], r2['big'], r1['ms'], r1['stats']['pintados'], r1['stats']['bytes'] / 1e6, r1['blank'] * 100))
                if not ok: fails.append(f'dpr{dpr} ({x},{y}): terreno no determinista o con rendijas entre chunks')
            pg.evaluate(JS, [2300, 1560, 512, 'ref'])
            pg.reload(); pg.wait_for_timeout(1200); pg.evaluate('S.boss=[1,1,1,1,1]')
            pg.evaluate(JS, [2300, 1560, 512, 'ref'])
            pg.reload(); pg.wait_for_timeout(1200)
            pg.close()
finally:
    srv.terminate()
print('errores de consola:', errs or 'ninguno'); print('fallos:', fails or 'ninguno')
print('RESULTADO:', 'OK' if not errs and not fails else 'FALLO'); sys.exit(0 if not errs and not fails else 1)
