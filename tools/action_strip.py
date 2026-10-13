#!/usr/bin/env python3
"""Tira de fotogramas REAL de una acción en el juego (lote M4, oct 2026): python3 tools/action_strip.py salida.png f|wc|mi|fi
Arranca combate (f, contra el monstruo más cercano, inmortal) o recolección y muestrea actState+HERO.pose+HERO.blend cada 70 ms durante 3,6 s.
Etiqueta: ms, fase ph, r = recuperación (rc), w = esperando en guardia (rd)."""
import sys,os,subprocess,time,base64,json
from playwright.sync_api import sync_playwright
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));out,mode=sys.argv[1],sys.argv[2]
srv=subprocess.Popen([sys.executable,'-m','http.server','8813','--bind','127.0.0.1'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
JS='''async([mode])=>{const sl=ms=>new Promise(r=>setTimeout(r,ms));const now=()=>performance.now();
 if(mode==='f'){S.eq.w=S.eq.w||null;let m=M.filter(m=>alive(m,now())&&!m.d.boss&&!sealed(m)).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0];P.x=m.x-20;P.y=m.y;m.hp=9999;m.mh=9999;P.hp=999;startF(m,now())}
 else{const e=N.filter(n=>n.t===mode&&alive(n,now())&&L(n.t)>=rq(ACT[n.t][n.i])).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0];P.x=e.x-20;P.y=e.y+4;startG(e,now())}
 await sl(400);const fr=[];const st={};const t0=now();while(now()-t0<3600){const a=actState(now());const mv=P.mvg||P.anm;let R=HERO.pose({dir:0,mv,run:0,w:P.w,t:now()/1000,act:mv?null:a,hurt:0});R=HERO.blend(st,R,mv?'w':a?a.k:'i',now());fr.push([R,a?(a.ph||0).toFixed(2)+(a.rc!=null?' r'+a.rc:'')+(a.rd?' w':''):'-']);await sl(70)}
 const W=56,H=70,Z=2,NC=13,rows=Math.ceil(fr.length/NC),c=document.createElement('canvas');c.width=W*Z*NC;c.height=H*Z*rows;const g=c.getContext('2d');g.fillStyle='#fdf9e3';g.fillRect(0,0,c.width,c.height);
 fr.forEach(([R,l],i)=>{g.setTransform(Z,0,0,Z,(i%NC)*W*Z,Math.floor(i/NC)*H*Z);ORG.rot(R.rot);try{ORG.U.heroe(g,W/2,H-10,0,{view:R.view,pose:R.pose,item:R.item,trail:R.trail,col:'#c0392b'})}catch(e){}ORG.rot(false);g.setTransform(1,0,0,1,0,0);g.fillStyle='#333';g.font='11px monospace';g.fillText(i*70+' '+l,(i%NC)*W*Z+2,Math.floor(i/NC)*H*Z+11)});
 return c.toDataURL()}'''
try:
 with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('http://127.0.0.1:8813/index.html?noedit');pg.wait_for_timeout(5000)
  open(out,'wb').write(base64.b64decode(pg.evaluate(JS,[mode]).split(',')[1]));print('errs',errs[:3])
finally: srv.kill()
