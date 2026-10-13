#!/usr/bin/env python3
"""Capa y pelo en movimiento (lote K2): python3 tools/cape_poses.py salida.png · filas E, S, N; columnas reposo/andar/correr con capa azul + pelo largo y capa verde + coleta."""
import sys,os,subprocess,time,base64
from playwright.sync_api import sync_playwright
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));out=sys.argv[1]
srv=subprocess.Popen([sys.executable,'-m','http.server','8819','--bind','127.0.0.1'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
JS='''()=>{const W=64,H=80,Z=2,dirs=[0,2,6],modes=[['idle',0,0],['walk',1,0],['walk',1,0],['run',1,1],['run',1,1],['run',1,1]],phs=[0,0,.25,0,.25,.5];const c=document.createElement('canvas');c.width=W*Z*modes.length*2;c.height=H*Z*dirs.length;const g=c.getContext('2d');g.fillStyle='#fdf9e3';g.fillRect(0,0,c.width,c.height);
 dirs.forEach((d,r)=>[['#3a5ad8','long'],['#2a8a4a','pony']].forEach(([cp,hs],j)=>modes.forEach(([nm,mv,run],i)=>{const R=HERO.pose({dir:d,t:1,hurt:0,mv,run,w:phs[i]*2*Math.PI});g.setTransform(Z,0,0,Z,(j*modes.length+i)*W*Z,r*H*Z);ORG.rot(R.rot);ORG.U.heroe(g,W/2,H-10,0,{view:R.view,pose:R.pose,col:'#c0392b',cape:cp,hairStyle:hs,hair:'#6a4022',gear:{cp}});ORG.rot(false)})));return c.toDataURL()}'''
try:
 with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page();pg.on('pageerror',lambda e:print('ERR',e));pg.goto('http://127.0.0.1:8819/index.html?noedit',wait_until='commit');pg.wait_for_timeout(2500)
  open(out,'wb').write(base64.b64decode(pg.evaluate(JS).split(',')[1]))
finally: srv.kill()
