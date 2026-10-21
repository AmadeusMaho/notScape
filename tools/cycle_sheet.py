#!/usr/bin/env python3
"""Ciclo de caminar/correr AMPLIADO (oct 2026): python3 tools/cycle_sheet.py salida.png walk|run [NC=16] [dirs=0,2,1,6] [escala=3]
Una fila por dirección (0 E, 1 SE, 2 S, 6 N…), NC fotogramas por ciclo, línea de suelo para ver pies que flotan o se hunden."""
import sys, os, subprocess, time, base64
from playwright.sync_api import sync_playwright
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));a=sys.argv[1:]
out,mode=a[0],a[1];NC=int(a[2]) if len(a)>2 else 16;dirs=[int(x) for x in (a[3] if len(a)>3 else '0,2,1,6').split(',')];S=float(a[4]) if len(a)>4 else 3
srv=subprocess.Popen([sys.executable,'-m','http.server','8811','--bind','127.0.0.1'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
JS='''([S,mode,NC,dirs])=>{const W=50,H=64,c=document.createElement('canvas');c.width=Math.ceil(W*S)*NC;c.height=Math.ceil(H*S)*dirs.length;const g=c.getContext('2d');g.fillStyle='#fdf9e3';g.fillRect(0,0,c.width,c.height);
 dirs.forEach((d,r)=>{for(let i=0;i<NC;i++){const st={dir:d,t:1.3,hurt:0,blink:0,mv:1,run:mode==='run',w:i/NC*2*Math.PI};
  const R=HERO.pose(st);g.save();g.setTransform(S,0,0,S,i*Math.ceil(W*S),r*Math.ceil(H*S));g.strokeStyle='#e0d8b8';g.lineWidth=.3;g.beginPath();g.moveTo(0,H-8);g.lineTo(W,H-8);g.stroke();g.lineJoin='round';ORG.rot(R.rot);
  try{ORG.U.heroe(g,W/2,H-8,0,{view:R.view,pose:R.pose,item:R.item,trail:R.trail,col:'#c0392b'})}catch(e){console.error(e.message)}ORG.rot(false);g.restore()}});return c.toDataURL()}'''
try:
  with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page();pg.on('pageerror',lambda e:print('ERR',e))
    pg.goto('http://127.0.0.1:8811/index.html?noedit',wait_until='commit');pg.wait_for_timeout(2000)
    open(out,'wb').write(base64.b64decode(pg.evaluate(JS,[S,mode,NC,dirs]).split(',')[1]))
finally: srv.kill()
print('ok',out)
