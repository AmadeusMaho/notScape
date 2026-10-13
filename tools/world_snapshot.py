#!/usr/bin/env python3
"""Vuelca a JSON la parte DETERMINISTA del mundo (estaciones, zonas, BLK, estanques, conteos de recursos y monstruos por bioma, tablas por bioma).
Sirve para comprobar que un refactor de datos no cambia el mundo: python3 tools/world_snapshot.py antes.json ; (refactor) ; python3 tools/world_snapshot.py despues.json ; diff."""
import sys, os, subprocess, time, json
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1]
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8778', '--bind', '127.0.0.1'], cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
JS = '''()=>{const cnt=(a,f)=>{const o={};a.forEach(e=>{const k=f(e);o[k]=(o[k]||0)+1});return o};
 return JSON.stringify({WW:WW,WH:WH,NX:TER.NX,NY:TER.NY,
  ST:ST.map(e=>[e.id,e.n,e.x,e.y,e.sks||null]),ZS:ZS.map(z=>[z.k,z.r,z.t]),BLK:BLK,PD:PD,
  Ncount:cnt(N,e=>biomeAt(e.x,e.y)+':'+e.t+':'+e.i),Mcount:cnt(M,m=>biomeAt(m.x,m.y)+':'+m.d.id),
  BI:BI.map(b=>[b.n,b.lv,b.ic]),PEN:PEN,BRESP:BRESP,MB:MB,RVC:RVC,
  PAL:TER.PAL,tileHsum:(()=>{let s=0;for(let ty=0;ty<TER.NY;ty++)for(let tx=0;tx<TER.NX;tx++)s=(s*31+Math.round(TER.tileH(tx,ty)*100))|0;return s})(),
  props:PROPS.list.map(p=>[p.n,Math.round(p.x),Math.round(p.y),p.k])})}'''
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page()
        pg.on('pageerror', lambda e: print('ERR', e))
        pg.goto('http://127.0.0.1:8778/index.html?noedit', wait_until='commit'); pg.wait_for_timeout(2500)
        open(out, 'w').write(json.dumps(json.loads(pg.evaluate(JS)), indent=1, sort_keys=True))
finally:
    srv.kill()
print('guardado', out)
