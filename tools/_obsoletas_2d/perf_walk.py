#!/usr/bin/env python3
"""Lote V8b · caminar por la Pradera y desglosar el tiempo de cada fotograma (terreno, props, luz…) + chunks construidos: python3 -I tools/perf_walk.py desfase(0 día|180 noche) [px/fotograma=3] [fotogramas=400] · R=otra/carpeta para comparar. Calidad fija (QA=0, QL=2)."""
import sys,subprocess,time,json,os
from playwright.sync_api import sync_playwright
root=os.environ.get('R',os.path.dirname(os.path.dirname(os.path.abspath(__file__))));off=int(sys.argv[1]);sp=float(sys.argv[2]) if len(sys.argv)>2 else 3;n=int(sys.argv[3]) if len(sys.argv)>3 else 400
srv=subprocess.Popen([sys.executable,'-m','http.server','8846','--bind','127.0.0.1'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(args=['--enable-unsafe-swiftshader']);pg=b.new_page(viewport={'width':1600,'height':900});pg.set_default_timeout(300000)
  pg.add_init_script('(()=>{const O=%d,o=performance.now.bind(performance);performance.now=()=>o()+O;const r=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>r(t=>cb(t+O))})()'%(off*1000))
  pg.goto('http://127.0.0.1:8846/index.html?noedit');pg.wait_for_timeout(5000)
  pg.evaluate('()=>{for(let i=0;i<6;i++)S.boss[i]=1;setZoom(2);QA=0;QL=2;fitCv();P.hp=9999;const B=BI[0];P.x=B.ox+2300-900;P.y=B.oy+1500-300;P.mv=null;P.g=null;ISO.snap(P.x,P.y,TER.standZ(P.x,P.y))}')
  pg.wait_for_timeout(4000)
  r=pg.evaluate('''([sp,n])=>new Promise(res=>{const F=[];let cur=null;const W=(o,k,lab)=>{const f=o[k];o[k]=function(...a){const t=performance.now();try{return f.apply(this,a)}finally{if(cur)cur[lab]=(cur[lab]||0)+performance.now()-t}}};
   W(TER,'draw','ter');W(PROPS,'warm','warm');W(PROPS,'draw','pdraw');W(PROPS,'resource','res');W(PROPS,'station','stn');W(window,'lighting','light');W(LIGHT,'update','lupd');
   const od=window.draw;window.draw=function(now){cur={};const t=performance.now();od(now);cur.draw=performance.now()-t};
   let l=performance.now(),i=0;const st0=TER.stats();const f=()=>{const t=performance.now();if(cur){cur.fr=t-l;F.push(cur)}l=t;P.x+=sp;P.y+=sp*.5*Math.sin(i/60);if(++i<n)requestAnimationFrame(f);else res({F,st0,st1:TER.stats()})};requestAnimationFrame(f)})''',[sp,n])
  F=r['F'][5:];import statistics
  for k in ['fr','draw','ter','warm','pdraw','res','stn','light']:
   v=sorted(x.get(k,0) for x in F);print('%-6s med %6.1f p90 %6.1f p99 %6.1f max %6.1f'%(k,v[len(v)//2],v[int(len(v)*.9)],v[int(len(v)*.99)],v[-1]))
  print(r['st0'],r['st1'])
  top=sorted(F,key=lambda x:-x.get('draw',0))[:8]
  for x in top:print({k:round(v,1) for k,v in x.items()})
finally: srv.kill()
