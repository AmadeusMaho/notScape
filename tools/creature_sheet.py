#!/usr/bin/env python3
"""Hoja de contacto de criaturas (src/creatures.js) y comprobación de «no se corta».
Uso: python3 -I tools/creature_sheet.py salida.png [escala] [n1,n2,...]
Cada criatura en 4 poses (reposo, paso, golpe a medias, golpe recibido) dentro de su caja de horneado (CRE.box). Imprime medidas y
termina con RESULTADO: OK si ninguna pose toca el borde de su caja (margen >= 4 px) ni queda vacía."""
import sys, os, subprocess, time, base64, json
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1] if len(sys.argv) > 1 else '/tmp/creature_sheet.png'; S = float(sys.argv[2]) if len(sys.argv) > 2 else 2
names = sys.argv[3].split(',') if len(sys.argv) > 3 else None
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8778', '--bind', '127.0.0.1'], cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
JS = '''([S,names])=>{const ks=names||Object.keys(CRE.M).concat(['goblin']),poses=[{},{p:{st:1}},{p:{atk:.5,t:1}},{flash:1,p:{t:2}}],res=[];
 const cells=ks.map(n=>CRE.box(n)),CW=Math.max(...cells.map(b=>b.w)),CH=Math.max(...cells.map(b=>b.h)),W=Math.ceil(CW*S),H=Math.ceil(CH*S),cols=4,
 c=document.createElement('canvas');c.width=W*cols;c.height=H*ks.length;const g=c.getContext('2d');g.fillStyle='#fdf9e3';g.fillRect(0,0,c.width,c.height);
 const t=document.createElement('canvas'),tg=t.getContext('2d',{willReadFrequently:true});
 ks.forEach((n,i)=>{const b=CRE.box(n),f=ORG.U[n];let worst=99,top=0,empty=false;
  poses.forEach((po,j)=>{t.width=Math.ceil(b.w*S);t.height=Math.ceil(b.h*S);tg.setTransform(S,0,0,S,0,0);tg.clearRect(0,0,b.w,b.h);tg.lineJoin='round';
   f(tg,b.ax,b.ay,0,Object.assign({f:1},po));tg.setTransform(1,0,0,1,0,0);
   const d=tg.getImageData(0,0,t.width,t.height).data;let x0=t.width,y0=t.height,x1=-1,y1=-1;
   for(let y=0;y<t.height;y++)for(let x=0;x<t.width;x++)if(d[(y*t.width+x)*4+3]>20){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}
   if(x1<0)empty=true;else{worst=Math.min(worst,Math.min(x0,y0,t.width-1-x1,t.height-1-y1)/S);if(j===0)top=(b.ay*S-y0)/S}
   g.drawImage(t,j*W,i*H);g.strokeStyle='rgba(200,80,80,.35)';g.strokeRect(j*W+.5,i*H+.5,t.width-1,t.height-1);g.beginPath();g.moveTo(j*W,i*H+b.ay*S);g.lineTo(j*W+t.width,i*H+b.ay*S);g.stroke()});
  res.push({n,worst:Math.round(worst*10)/10,top:Math.round(top),empty})});
 return{img:c.toDataURL(),res}}'''
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('http://127.0.0.1:8778/index.html?noedit', wait_until='commit'); pg.wait_for_timeout(2500)
        r = pg.evaluate(JS, [S, names])
        open(out, 'wb').write(base64.b64decode(r['img'].split(',')[1])); b.close()
finally:
    srv.kill()
bad = list(errs)
for x in r['res']:
    print('%-10s altura %3d  margen mín %5.1f' % (x['n'], x['top'], x['worst']))
    if x['empty']: bad.append(x['n'] + ': vacío')
    elif x['worst'] < 4: bad.append(x['n'] + ': silueta a %.1f px del borde de su caja' % x['worst'])
for m in bad: print('FALLO:', m)
print('guardado', out); print('RESULTADO:', 'OK' if not bad else 'FALLO'); sys.exit(1 if bad else 0)
