#!/usr/bin/env python3
"""Héroe en las 8 direcciones (reposo + 2 fases de andar) con escudo y arma envainada (lote D1): python3 tools/dirs8_gear.py salida.png [sword|great]"""
import sys,os,subprocess,time,base64
from playwright.sync_api import sync_playwright
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));out=sys.argv[1]
wk=sys.argv[2] if len(sys.argv)>2 else 'sword'
srv=subprocess.Popen([sys.executable,'-m','http.server','8820','--bind','127.0.0.1'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
JS='''([wk])=>{const W=64,H=84,Z=3,dirs=[0,1,2,3,4,5,6,7],st=[[0,0],[1,.25],[1,.75]];const c=document.createElement('canvas');c.width=W*Z*dirs.length;c.height=H*Z*st.length;const g=c.getContext('2d');g.fillStyle='#8ac060';g.fillRect(0,0,c.width,c.height);
 st.forEach(([mv,w],r)=>dirs.forEach((d,i)=>{const R=HERO.pose({dir:d,t:1,hurt:0,mv,run:0,w:w*2*Math.PI});g.setTransform(Z,0,0,Z,i*W*Z,r*H*Z);ORG.rot(R.rot);ORG.U.heroe(g,W/2,H-10,0,{view:R.view,pose:R.pose,col:'#a0603a',hairStyle:(window.HS||'curly'),hair:'#4a2a1a',gear:{sh:'#9a7a50',wp:{t:'sword',wk,col:'#cfd8e0'}}});ORG.rot(false)}));return c.toDataURL()}'''
try:
 with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page();pg.on('pageerror',lambda e:print('ERR',e));pg.goto('http://127.0.0.1:8820/index.html?noedit',wait_until='commit');pg.wait_for_timeout(2500)
  open(out,'wb').write(base64.b64decode(pg.evaluate(JS,[wk]).split(',')[1]))
finally: srv.kill()
