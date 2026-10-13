#!/usr/bin/env python3
"""Golpe cuerpo a cuerpo en 7 direcciones (lote M5): python3 tools/melee_poses.py salida.png
Filas: E, SE, S, SO, NO, N, NE. Columnas: espada ph 0 (guardia) .3 .6 .8 .9 1 | puños igual."""
import sys,os,subprocess,time,base64
from playwright.sync_api import sync_playwright
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));out=sys.argv[1]
srv=subprocess.Popen([sys.executable,'-m','http.server','8814','--bind','127.0.0.1'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
JS='''()=>{const dirs=[0,1,2,3,5,6,7],phs=[0,.3,.6,.8,.9,1],W=60,H=76,Z=2,c=document.createElement('canvas');c.width=W*Z*phs.length*2;c.height=H*Z*dirs.length;const g=c.getContext('2d');g.fillStyle='#fdf9e3';g.fillRect(0,0,c.width,c.height);
 dirs.forEach((d,r)=>{[['#ccd',0],[null,0]].forEach(([wc],j)=>phs.forEach((ph,i)=>{const R=HERO.pose({dir:d,t:1,hurt:0,act:{k:'f',wt:'m',wcol:wc,ph,rd:ph?0:1}});const x=(j*phs.length+i)*W*Z;g.setTransform(Z,0,0,Z,x,r*H*Z);ORG.rot(R.rot);try{ORG.U.heroe(g,W/2,H-10,0,{view:R.view,pose:R.pose,item:R.item,trail:R.trail,col:'#c0392b'})}catch(e){}ORG.rot(false)}))});return c.toDataURL()}'''
try:
 with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page();pg.goto('http://127.0.0.1:8814/index.html?noedit',wait_until='commit');pg.wait_for_timeout(2500)
  open(out,'wb').write(base64.b64decode(pg.evaluate(JS).split(',')[1]))
finally: srv.kill()
