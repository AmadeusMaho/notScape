#!/usr/bin/env python3
"""Solapes VISIBLES entre sprites (por píxeles, no por cajas) alrededor de las instalaciones. Uso: python3 -I tools/overlap_check.py [x y radio [umbral%]]
Sin argumentos revisa las 5 zonas de la aldea de la Pradera (herrería, plaza, taller, escritorio, fogata).
Hornea cada sprite (props y estaciones) en un lienzo aparte con la cámara centrada en la zona, mide cuántos píxeles opacos comparten dos sprites y falla si
una ESTACIÓN (horno, yunque, banco, tienda, taller, escritorio, fogata) o la herrería queda tapada/solapada por otro sprite más allá del umbral
(por defecto 30 % del más pequeño). Nació del bug del 13 oct 2026: el tejado de la herrería tapaba el 49 % del horno y el 59 % del yunque, y
props_check.py (que mira huellas de colisión) no lo veía. Debe acabar en `RESULTADO: OK`."""
import sys, os, subprocess, time, json
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
a = sys.argv[1:]
ZONAS = [('herreria', 2360, 1105, 230), ('plaza', 2300, 1500, 420), ('taller', 2015, 1270, 200), ('escritorio', 2585, 1270, 200), ('fogata', 2645, 1755, 200)]   # lote D4: zonas de la aldea compacta
if len(a) >= 3: ZONAS = [('zona', float(a[0]), float(a[1]), float(a[2]))]
umbral = float(a[3]) / 100 if len(a) > 3 else .30
# solapes que son intencionados (el asador se apoya sobre la fogata; las estaciones del mismo rincón pueden rozarse un poco)
OK_PAR = [('s:fire', 'p:asador')]
JS = '''([cx,cy,rad])=>{const Wd=cv.width,Hd=cv.height,items=[];
 const mk=fn=>{const c=document.createElement('canvas');c.width=Wd;c.height=Hd;const g=c.getContext('2d',{willReadFrequently:true});fn(g);const d=g.getImageData(0,0,Wd,Hd).data,m=new Uint8Array(Wd*Hd);let x0=Wd,y0=Hd,x1=0,y1=0,n=0;
  for(let y=0;y<Hd;y++)for(let x=0;x<Wd;x++)if(d[(y*Wd+x)*4+3]>40){m[y*Wd+x]=1;n++;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}return{m,n,b:[x0,y0,x1,y1]}};
 PROPS.list.forEach(e=>{if(Math.hypot(e.x-cx,e.y-cy)<rad)items.push(Object.assign({k:'p:'+e.n,x:Math.round(e.x),y:Math.round(e.y)},mk(g=>PROPS.draw(g,e,{x:-9999,y:-9999,w:0},0))))});
 ST.forEach(e=>{if(e.id==='door')return;if(Math.hypot(e.x-cx,e.y-cy)<rad)items.push(Object.assign({k:'s:'+e.id,x:Math.round(e.x),y:Math.round(e.y)},mk(g=>PROPS.station(g,e,{ox:0,oy:0,t:0,on:false,night:false,sil:true}))))});
 const out=[];for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){const A=items[i],B=items[j];if(!A.n||!B.n)continue;
  const x0=Math.max(A.b[0],B.b[0]),y0=Math.max(A.b[1],B.b[1]),x1=Math.min(A.b[2],B.b[2]),y1=Math.min(A.b[3],B.b[3]);if(x1<x0||y1<y0)continue;let ov=0;
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(A.m[y*Wd+x]&&B.m[y*Wd+x])ov++;
  if(ov>0)out.push({a:A.k+'@'+A.x+','+A.y,b:B.k+'@'+B.x+','+B.y,ka:A.k,kb:B.k,fa:ov/A.n,fb:ov/B.n,ov})}
 return{n:items.length,out}}'''
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8781', '--bind', '127.0.0.1'], cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1); bad = []
try:
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader']); pg = b.new_page(viewport={'width': 1500, 'height': 1000}); pg.set_default_timeout(120000)
        pg.add_init_script("localStorage.setItem('ns_zoom','2')")
        pg.goto('http://127.0.0.1:8781/index.html?noedit'); pg.wait_for_timeout(2500)
        for nom, x, y, r in ZONAS:
            pg.evaluate(f'P.x={x};P.y={y};P.mv=null;P.g=null'); pg.wait_for_timeout(2500)
            res = pg.evaluate(JS, [x, y, r]); print(f'zona {nom}: {res["n"]} sprites')
            for o in res['out']:
                if (o['ka'], o['kb']) in OK_PAR or (o['kb'], o['ka']) in OK_PAR: continue
                est = o['ka'].startswith('s:') or o['kb'].startswith('s:') or 'herreria' in (o['ka'], o['kb'])
                grave = est and max(o['fa'], o['fb']) >= umbral and min(o['fa'], o['fb']) >= umbral * .5 or (est and min(o['fa'], o['fb']) >= umbral)
                if o['ov'] >= 400 and est:
                    print(('  FALLO ' if grave else '  roce  ') + f'{o["a"]} × {o["b"]}: {o["ov"]} px ({o["fa"]*100:.0f} % / {o["fb"]*100:.0f} %)')
                    if grave: bad.append((nom, o['a'], o['b']))
        b.close()
finally:
    srv.terminate()
print('RESULTADO:', 'FALLO' if bad else 'OK'); sys.exit(1 if bad else 0)
