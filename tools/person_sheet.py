#!/usr/bin/env python3
"""Hoja de contacto de los humanos (NPC y personaje) a escala grande, para revisar el aspecto: python3 tools/person_sheet.py salida.png [escala]"""
import sys, os, subprocess, time, base64
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1] if len(sys.argv) > 1 else '/tmp/person_sheet.png'; S = float(sys.argv[2]) if len(sys.argv) > 2 else 4
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8779', '--bind', '127.0.0.1'], cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
JS = '''(S)=>{const P=ORG.PEOPLE,names=(window.__names||Object.keys(P)),W=130,H=150,c=document.createElement('canvas');c.width=Math.ceil(W*S)*names.length;c.height=Math.ceil(H*S)*2;const g=c.getContext('2d');g.fillStyle='#fdf9e3';g.fillRect(0,0,c.width,c.height);
 const poses=[{},{bob:.5,arm:130,blink:1,smile:1}];
 poses.forEach((po,r)=>names.forEach((n,i)=>{g.save();g.setTransform(S,0,0,S,i*Math.ceil(W*S),r*Math.ceil(H*S));g.lineJoin='round';ORG.U.aldeano(g,W/2,H-30,0,Object.assign({},P[n],{pose:po}));g.restore()}));
 return c.toDataURL()}'''
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page()
        pg.on('pageerror', lambda e: print('ERR', e))
        pg.goto('http://127.0.0.1:8779/index.html?noedit', wait_until='commit'); pg.wait_for_timeout(2000)
        if len(sys.argv) > 3: pg.evaluate('(n)=>{window.__names=n}', sys.argv[3].split(','))
        d = pg.evaluate(JS, S)
        open(out, 'wb').write(base64.b64decode(d.split(',')[1]))
finally:
    srv.kill()
print('guardado', out)
