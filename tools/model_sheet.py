#!/usr/bin/env python3
"""Hoja de contacto de modelos ORG.U (todos o los nombrados): python3 tools/model_sheet.py salida.png [escala] [n1,n2,...]"""
import sys, os, subprocess, time, base64
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1] if len(sys.argv) > 1 else '/tmp/model_sheet.png'; S = float(sys.argv[2]) if len(sys.argv) > 2 else 2
names = sys.argv[3].split(',') if len(sys.argv) > 3 else None
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8777', '--bind', '127.0.0.1'], cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
JS = '''([S,names])=>{const U=ORG.U,ks=names||Object.keys(U),W=170,H=190,cols=6,rows=Math.ceil(ks.length/cols),c=document.createElement('canvas');c.width=Math.ceil(W*S)*cols;c.height=Math.ceil(H*S)*rows;const g=c.getContext('2d');g.fillStyle='#fdf9e3';g.fillRect(0,0,c.width,c.height);
 ks.forEach((n,i)=>{g.save();g.setTransform(S,0,0,S,(i%cols)*Math.ceil(W*S),Math.floor(i/cols)*Math.ceil(H*S));g.lineJoin='round';try{U[n](g,W/2,H-30,0,ORG.PEOPLE[n]||undefined)}catch(e){}g.setTransform(1,0,0,1,0,0);g.restore()});return c.toDataURL()}'''
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(); pg.on('pageerror', lambda e: print('ERR', e))
        pg.goto('http://127.0.0.1:8777/index.html?noedit', wait_until='commit'); pg.wait_for_timeout(2000)
        open(out, 'wb').write(base64.b64decode(pg.evaluate(JS, [S, names]).split(',')[1]))
finally:
    srv.kill()
print('guardado', out)
