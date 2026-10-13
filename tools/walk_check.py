#!/usr/bin/env python3
"""Mide los tirones al caminar (F5/pantalla completa): simula al héroe avanzando a velocidad constante y registra los intervalos de frame y cuántos
chunks VISIBLES hubo que construir de golpe (TER.stats().sync / syncMs: lo que causa el tirón; debe ser 0 o casi). En el sandbox el render es por
software (lento), así que lo fiable es `sync_walk`, no los ms. Uso: python3 tools/walk_check.py [ancho alto dpr segundos dx dy]  (dx,dy = px de mundo cada 50 ms)"""
import sys, os, subprocess, time, json
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
a = sys.argv[1:]; w = int(a[0]) if len(a) > 0 else 1920; h = int(a[1]) if len(a) > 1 else 1080; dpr = float(a[2]) if len(a) > 2 else 1
secs = int(a[3]) if len(a) > 3 else 12; dx = a[4] if len(a) > 4 else '12'; dy = a[5] if len(a) > 5 else '6'
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8767', '--bind', '127.0.0.1'], cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=dpr); pg.set_default_timeout(60000)
        pg.goto('http://127.0.0.1:8767/index.html?noedit'); pg.wait_for_timeout(1500)
        pg.evaluate('P.x=1000;P.y=1000;P.mv=null;P.g=null'); pg.wait_for_timeout(4000)   # precarga inicial
        pg.evaluate('''()=>{window.__f=[];let l=performance.now();const f=t=>{window.__f.push(t-l);l=t;requestAnimationFrame(f)};requestAnimationFrame(f)}''')
        s0 = pg.evaluate('TER.stats()'); pg.evaluate('window.__t=setInterval(()=>{P.x+=%s;P.y+=%s;P.mv=null},50)' % (dx, dy)); pg.wait_for_timeout(secs * 1000); pg.evaluate('clearInterval(window.__t)')
        r = pg.evaluate('''()=>{const a=window.__f.slice(2),s=[...a].sort((x,y)=>x-y),n=a.length;return {frames:n,avg_ms:a.reduce((x,y)=>x+y,0)/n,p95_ms:s[Math.floor(n*.95)],max_ms:s[n-1],pos:[P.x|0,P.y|0],stats:TER.stats()}}''')
        st = r.pop('stats'); r['sync_walk'] = st['sync'] - s0['sync']; r['syncMs_walk'] = st['syncMs'] - s0['syncMs']; r['chunks_built_walk'] = st['construidos'] - s0['construidos']; r['cache_MB'] = round(st['bytes'] / 1e6, 1)
        print(json.dumps(r)); b.close()
finally:
    srv.terminate()
