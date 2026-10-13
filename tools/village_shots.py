#!/usr/bin/env python3
"""Captura de cada aldea vista desde arriba (lote D2): python3 tools/village_shots.py salida_%d.png [biomas=0,1,2,3,4,5] [zoom 0-4]"""
import sys,os,subprocess,time
from playwright.sync_api import sync_playwright
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));outp=sys.argv[1]
ks=[int(x) for x in (sys.argv[2] if len(sys.argv)>2 else '0,1,2,3,4,5').split(',')]
zi=int(sys.argv[3]) if len(sys.argv)>3 else 0
srv=subprocess.Popen([sys.executable,'-m','http.server','8822','--bind','127.0.0.1'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':1800,'height':1150});pg.set_default_timeout(120000);errs=[]
  pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('http://127.0.0.1:8822/index.html?noedit');pg.wait_for_timeout(5000)
  pg.evaluate('()=>{for(let i=0;i<6;i++)S.boss[i]=1;setZoom(%d);P.hp=9999;MM=0}'%zi)
  for k in ks:
   c=pg.evaluate('''(k)=>{const B=BI[k],V=B.village;const hs=V.props.filter(p=>/^(casa|taberna|troncos|casaLarga|salon|palafito|casaJp|casaMaya|stabbur|casaArbol|cabana|granero)/.test(p.n));let x=0,y=0;hs.forEach(p=>{x+=p.x;y+=p.y});x=B.ox+x/hs.length;y=B.oy+y/hs.length;P.x=x;P.y=y+40;P.mv=null;P.g=null;ISO.snap(P.x,P.y,TER.standZ(P.x,P.y));return [Math.round(x),Math.round(y),hs.length]}''',k)
   pg.wait_for_timeout(7000);pg.screenshot(path=outp%k);print(k,c)
  print('errs',errs[:3])
finally: srv.kill()
