#!/usr/bin/env python3
"""Lote V8 · tiempo de fotograma (mediana/p90) quitando partes del dibujo una a una (luz, terreno, entidades, ambiente…).
Uso: python3 -I tools/perf_ablation.py desfase(0 día|180 noche) dx dy zoom [escenarios.json {nombre: js}]  · R=otra/carpeta para comparar con otra copia del juego.
Ojo: Chromium sin GPU (SwiftShader): sirve para comparar antes/después, no son los ms reales de un equipo con GPU."""
import sys,subprocess,time,json
from playwright.sync_api import sync_playwright
import os
root=os.environ.get('R',os.path.dirname(os.path.dirname(os.path.abspath(__file__))));off=int(sys.argv[1]);dx=sys.argv[2];dy=sys.argv[3];zoom=sys.argv[4]
scen=json.loads(open(sys.argv[5]).read()) if len(sys.argv)>5 else None
SC=scen or {'base':'','nolight':'window.lighting=()=>{};','nolightupd':'window.lightUpd=()=>{};','noTER':'TER.draw=()=>{};','noEnts':'window.onScr=()=>false;','noAMBI':'AMBI.draw=()=>{};','noPost':'window.post=()=>{};','noHL':'window.hl=()=>{};window.occ=(e,f)=>f();','noMap':'MM=0;','noHUD':'UI.vitals=()=>{};window.hudPlate=()=>{};window.hudFx=()=>{};'}
srv=subprocess.Popen([sys.executable,'-m','http.server','8840','--bind','127.0.0.1'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(args=['--enable-unsafe-swiftshader','--disable-gpu-vsync','--disable-frame-rate-limit']);
  for name,js in SC.items():
   pg=b.new_page(viewport={'width':1600,'height':900});pg.set_default_timeout(180000)
   pg.add_init_script('(()=>{const O=%d,o=performance.now.bind(performance);performance.now=()=>o()+O;const r=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>r(t=>cb(t+O))})()'%(off*1000))
   pg.goto('http://127.0.0.1:8840/index.html?noedit');pg.wait_for_timeout(5000)
   pg.evaluate('()=>{for(let i=0;i<6;i++)S.boss[i]=1;setZoom(%s);P.hp=9999;const B=BI[0];P.x=B.ox+2300+%s;P.y=B.oy+1500+%s;P.mv=null;P.g=null;ISO.snap(P.x,P.y,TER.standZ(P.x,P.y))}'%(zoom,dx,dy))
   pg.wait_for_timeout(3500);pg.evaluate('()=>{'+js+'}');pg.wait_for_timeout(500)
   r=pg.evaluate('''()=>new Promise(r=>{const a=[];let l=performance.now(),n=0;const f=()=>{const t=performance.now();a.push(t-l);l=t;if(++n<100)requestAnimationFrame(f);else r({a,j:PFJ})};requestAnimationFrame(f)})''')
   ft=sorted(r['a'][5:]);print('%-12s med %5.1f p90 %5.1f'%(name,ft[len(ft)//2],ft[int(len(ft)*.9)]),flush=True);pg.close()
finally: srv.kill()
