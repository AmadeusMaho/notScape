#!/usr/bin/env python3
"""Lote V8 · cuánta pantalla se rellena por fotograma y desde qué función (drawImage/fillRect/clearRect, lienzo principal y lienzos auxiliares).
Uso: python3 -I tools/perf_overdraw.py [segundos_de_desfase_del_reloj: 0=día, 180=noche] [dx] [dy]  (dx,dy = desde el centro de la aldea de la Pradera)"""
import os,sys,subprocess,time,json
from playwright.sync_api import sync_playwright
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));off=int(sys.argv[1]);dx=sys.argv[2] if len(sys.argv)>2 else '0';dy=sys.argv[3] if len(sys.argv)>3 else '0'
srv=subprocess.Popen([sys.executable,'-m','http.server','8842','--bind','127.0.0.1'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
JS=r'''()=>new Promise(res=>{const C2=CanvasRenderingContext2D.prototype,main=cv.getContext('2d'),R={},N={};let on=0;
 const tag=()=>{const s=new Error().stack.split('\n').slice(3,6).map(l=>{const m=/at (\S+) .*\/(\w[\w-]*\.js):(\d+)/.exec(l)||/at .*\/(\w[\w-]*\.js):(\d+)/.exec(l);return m?(m.length>3?m[1]+'@'+m[2]+':'+m[3]:m[1]+':'+m[2]):'?'});return s.join(' < ')};
 const area=(g,w,h)=>{const t=g.getTransform();return Math.abs(w*t.a*h*t.d)};
 const wrap=(nm,fa)=>{const o=C2[nm];C2[nm]=function(...a){if(on){const ar=fa(this,a);if(ar>0){const k=(this===main?'MAIN ':'off ')+nm+' '+tag();R[k]=(R[k]||0)+ar;N[k]=(N[k]||0)+1}}return o.apply(this,a)}};
 wrap('drawImage',(g,a)=>{const w=a.length>=9?a[7]:a.length>=5?a[3]:(a[0].width||0),h=a.length>=9?a[8]:a.length>=5?a[4]:(a[0].height||0);return area(g,w,h)});
 wrap('fillRect',(g,a)=>area(g,a[2],a[3]));wrap('fill',(g,a)=>1);wrap('stroke',(g,a)=>1);wrap('clearRect',(g,a)=>area(g,a[2],a[3]));wrap('getImageData',(g,a)=>a[2]*a[3]);wrap('putImageData',(g,a)=>1);
 let n=0;const f=()=>{n++;if(n===2)on=1;if(n===12){on=0;res({R,N,W:cv.width,H:cv.height})}else requestAnimationFrame(f)};requestAnimationFrame(f)})'''
try:
 with sync_playwright() as p:
  b=p.chromium.launch(args=['--enable-unsafe-swiftshader']);pg=b.new_page(viewport={'width':1600,'height':900});pg.set_default_timeout(180000)
  pg.add_init_script('(()=>{const O=%d,o=performance.now.bind(performance);performance.now=()=>o()+O;const r=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>r(t=>cb(t+O))})()'%(off*1000))
  pg.goto('http://127.0.0.1:8842/index.html?noedit');pg.wait_for_timeout(5000)
  pg.evaluate('()=>{for(let i=0;i<6;i++)S.boss[i]=1;setZoom(2);P.hp=9999;const B=BI[0];P.x=B.ox+2300+%s;P.y=B.oy+1500+%s;P.mv=null;P.g=null;ISO.snap(P.x,P.y,TER.standZ(P.x,P.y))}'%(dx,dy))
  pg.wait_for_timeout(3500)
  r=pg.evaluate(JS);scr=r['W']*r['H'];print('canvas',r['W'],r['H'])
  it=sorted(r['R'].items(),key=lambda x:-x[1])
  tot=sum(v for k,v in it if k.startswith('MAIN'))/10/scr;print('MAIN overdraw/frame (screens): %.2f'%tot)
  for k,v in it[:45]:print('%6.2f scr  %6.1f calls  %s'%(v/10/scr,r['N'][k]/10,k[:200]))
finally: srv.kill()
