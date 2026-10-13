#!/usr/bin/env python3
"""Los 8 modelos de casa con regla de alturas en px lógicos (lote D2): python3 tools/house_ruler.py salida.png · sirve para rellenar FH en facades.js"""
import sys,os,subprocess,time,base64
from playwright.sync_api import sync_playwright
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));out=sys.argv[1]
srv=subprocess.Popen([sys.executable,'-m','http.server','8826','--bind','127.0.0.1'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
JS='''()=>{const M=[['casa',{}],['taberna',{}],['troncos',{}],['palafito',{w:34,d:24}],['casaLarga',{}],['salon',{}],['casaJp',{w:34,d:24}],['casaMaya',{w:34,d:24}]],Z=3,W=170,H=150;const c=document.createElement('canvas');c.width=W*Z*4;c.height=H*Z*2;const g=c.getContext('2d');g.fillStyle='#cfe3b0';g.fillRect(0,0,c.width,c.height);
 M.forEach(([n,o],i)=>{const ox=(i%4)*W*Z,oy=Math.floor(i/4)*H*Z;g.setTransform(Z,0,0,Z,ox,oy);const x=W/2,y=H-30;
  for(let h=0;h<=110;h+=10){g.strokeStyle=h%20?'rgba(0,0,0,.12)':'rgba(0,0,0,.3)';g.lineWidth=.3;g.beginPath();g.moveTo(0,y-h);g.lineTo(W,y-h);g.stroke();g.fillStyle='#333';g.font='5px monospace';g.fillText(h,1,y-h-1)}
  try{ORG.U[n](g,x,y,0,o)}catch(e){g.fillText('ERR '+e.message,5,20)}g.fillStyle='#000';g.font='7px monospace';g.fillText(n,30,8)});return c.toDataURL()}'''
try:
 with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page();pg.goto('http://127.0.0.1:8826/index.html?noedit',wait_until='commit');pg.wait_for_timeout(2500)
  open(out,'wb').write(base64.b64decode(pg.evaluate(JS).split(',')[1]))
finally: srv.kill()
