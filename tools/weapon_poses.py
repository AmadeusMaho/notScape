#!/usr/bin/env python3
"""Golpe por forma de arma (lote G1): python3 tools/weapon_poses.py salida.png sword|dagger|great [dirs=0,2,6,1]\nDos filas por dirección: golpe normal y golpe máximo (MAX), fases 0 (guardia) .25 .5 .7 .8 .88 .95 1, con escudo."""
import sys,os,subprocess,time,base64
from playwright.sync_api import sync_playwright
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));out,wk=sys.argv[1],sys.argv[2]
dirs=[int(x) for x in (sys.argv[3] if len(sys.argv)>3 else '0,2,6,1').split(',')]
srv=subprocess.Popen([sys.executable,'-m','http.server','8815','--bind','127.0.0.1'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
JS='''([wk,dirs])=>{const phs=[0,.25,.5,.7,.8,.88,.95,1],W=70,H=86,Z=2,rows=[];dirs.forEach(d=>{rows.push([d,0]);rows.push([d,1])});const c=document.createElement('canvas');c.width=W*Z*phs.length;c.height=H*Z*rows.length;const g=c.getContext('2d');g.fillStyle='#fdf9e3';g.fillRect(0,0,c.width,c.height);
 rows.forEach(([d,hv],r)=>phs.forEach((ph,i)=>{const R=HERO.pose({dir:d,t:1,hurt:0,act:{k:'f',wt:'m',wk,wcol:'#cfd8e0',ph,hv,rd:ph?0:1}});g.setTransform(Z,0,0,Z,i*W*Z,r*H*Z);ORG.rot(R.rot);try{ORG.U.heroe(g,W/2,H-12,0,{view:R.view,pose:R.pose,item:R.item,trail:R.trail,col:'#c0392b',gear:{sh:'#8a6a4a'}})}catch(e){console.log(e.message)}ORG.rot(false);g.setTransform(1,0,0,1,0,0);g.fillStyle='#555';g.font='10px monospace';g.fillText((hv?'MAX ':'')+ph,i*W*Z+2,r*H*Z+10)}));return c.toDataURL()}'''
try:
 with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page();pg.on('console',lambda m:print('C',m.text) if 'TUNNEL' not in m.text else 0);pg.goto('http://127.0.0.1:8815/index.html?noedit',wait_until='commit');pg.wait_for_timeout(2500)
  open(out,'wb').write(base64.b64decode(pg.evaluate(JS,[wk,dirs]).split(',')[1]))
finally: srv.kill()
