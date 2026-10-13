#!/usr/bin/env python3
"""Hoja de las 7 instalaciones x 6 arquitecturas (tema de cada bioma): python3 tools/station_sheet.py salida.png [escala] [on]"""
import sys, os, subprocess, time, base64
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1] if len(sys.argv) > 1 else '/tmp/station_sheet.png'; S = float(sys.argv[2]) if len(sys.argv) > 2 else 2
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8781', '--bind', '127.0.0.1'], cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
JS = '''(S)=>{const N=['banco','tienda','fogata','horno','taller','yunque','escritorio'],W=130,H=150,c=document.createElement('canvas');c.width=Math.ceil(W*S)*N.length;c.height=Math.ceil(H*S)*6;const g=c.getContext('2d');g.fillStyle='#fdf9e3';g.fillRect(0,0,c.width,c.height);
 for(let k=0;k<6;k++)N.forEach((n,i)=>{g.save();g.setTransform(S,0,0,S,i*Math.ceil(W*S),k*Math.ceil(H*S));g.lineJoin='round';ORG.theme(BIOMES.list[k].village.theme||null);try{ORG.U[n](g,W/2,H-30,0,{arch:k,on:true})}catch(e){console.error(n,k,e.message)}ORG.theme(null);g.restore()});return c.toDataURL()}'''
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(); pg.on('pageerror', lambda e: print('ERR', e)); pg.on('console', lambda m: print('C', m.text) if m.type=='error' else 0)
        pg.goto('http://127.0.0.1:8781/index.html?noedit', wait_until='commit'); pg.wait_for_timeout(2000)
        open(out, 'wb').write(base64.b64decode(pg.evaluate(JS, S).split(',')[1]))
finally:
    srv.kill()
print('guardado', out)
