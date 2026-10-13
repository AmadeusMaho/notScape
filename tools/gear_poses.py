#!/usr/bin/env python3
"""Ballesta, cetro, escudo andando/con hacha y guardia (lote G2): python3 tools/gear_poses.py salida.png  · filas E, S, N, SE"""
import sys,os,subprocess,time,base64
from playwright.sync_api import sync_playwright
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));out=sys.argv[1]
srv=subprocess.Popen([sys.executable,'-m','http.server','8816','--bind','127.0.0.1'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
JS='''()=>{const W=64,H=84,Z=2,dirs=[0,2,6,1];
 const rows=[['xbow',{k:'f',wt:'r',wk:'xbow',wcol:'#8a8f98'},[0,.5,.9,.94,.98]],['scepter',{k:'f',wt:'g',wk:'scepter',orb:'#9cf'},[0,.5,.8,.95]],['walk+escudo',null,[0,.25,.5,.75]],['hacha+escudo',{k:'wc',col:'#9a9aa8'},[0,.8]],['guardia espada+escudo',{k:'f',wt:'m',wk:'sword',wcol:'#cfd8e0',rd:1},[0]]];
 let cols=0;rows.forEach(r=>cols+=r[2].length);const c=document.createElement('canvas');c.width=W*Z*cols;c.height=H*Z*dirs.length;const g=c.getContext('2d');g.fillStyle='#fdf9e3';g.fillRect(0,0,c.width,c.height);
 dirs.forEach((d,ri)=>{let ci=0;rows.forEach(([nm,a,phs])=>phs.forEach(ph=>{const st={dir:d,t:1,hurt:0};if(a)st.act=Object.assign({},a,{ph});else{st.mv=1;st.w=ph*2*Math.PI}
  const R=HERO.pose(st);g.setTransform(Z,0,0,Z,ci*W*Z,ri*H*Z);ORG.rot(R.rot);try{ORG.U.heroe(g,W/2,H-12,0,{view:R.view,pose:R.pose,item:R.item,trail:R.trail,col:'#c0392b',gear:{sh:'#8a6a4a',wp:a?null:{t:'sword',wk:'great',col:'#cfd8e0'}}})}catch(e){console.log('ERR',e.message)}ORG.rot(false);
  if(ri===0){g.setTransform(1,0,0,1,0,0);g.fillStyle='#555';g.font='10px monospace';g.fillText(nm.slice(0,12)+' '+ph,ci*W*Z+2,10)}ci++}))});return c.toDataURL()}'''
try:
 with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page();pg.on('console',lambda m:print(m.text) if 'ERR' in m.text else 0);pg.goto('http://127.0.0.1:8816/index.html?noedit',wait_until='commit');pg.wait_for_timeout(2500)
  open(out,'wb').write(base64.b64decode(pg.evaluate(JS).split(',')[1]))
finally: srv.kill()
