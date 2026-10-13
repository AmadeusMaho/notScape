#!/usr/bin/env python3
"""Comprobación de «no se corta» para las formas orgánicas/rígidas (src/style-organic.js).
1) ORG.checks(): geometría (tronco entra en la copa, patas entran en el cuerpo).
2) Cada forma de ORG.U se dibuja en un lienzo grande y se exige que su silueta quede a >=4 px de los bordes (ningún sprite recortado).
Uso: python3 -I tools/organic_check.py   -> termina con RESULTADO: OK / FALLO."""
import sys,os
from playwright.sync_api import sync_playwright
root=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
JS="""()=>{const out=[],U=ORG.U,W=300,H=300,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d',{willReadFrequently:true});
 const jobs=[['roble'],['abedul'],['sauce'],['pino'],['arce'],['fresno'],['ebano'],['tejo'],['piedra'],['arbusto'],['casa'],['cofre'],['yunque'],['slime'],['vaca'],['goblin'],['personaje','esbelto','bronce'],['personaje','esbelto','adam'],['personaje','robusto','hierro'],['personaje','chibi','cuero']];
 for(const a of jobs){g.clearRect(0,0,W,H);U[a[0]](g,W/2,H-60,0,a[1],a[2]);const d=g.getImageData(0,0,W,H).data;let x0=W,y0=H,x1=-1,y1=-1;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]>20){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}
  out.push({n:a.join(' '),w:x1-x0+1,h:y1-y0+1,m:Math.min(x0,y0,W-1-x1,H-1-y1),empty:x1<0})}
 return{checks:ORG.checks(),shapes:out}}"""
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.set_content('<canvas></canvas>')
    pg.add_script_tag(path=os.path.join(root,'src','style.js'));pg.add_script_tag(path=os.path.join(root,'src','style-organic.js'))
    r=pg.evaluate(JS);b.close()
bad=list(r['checks'])+errs
for s in r['shapes']:
    print('%-24s %3dx%-3d margen %3d'%(s['n'],s['w'],s['h'],s['m']))
    if s['empty']:bad.append(s['n']+': vacío')
    elif s['m']<4:bad.append(s['n']+': silueta a %d px del borde (recorte)'%s['m'])
for m in bad:print('FALLO:',m)
print('RESULTADO:','OK' if not bad else 'FALLO');sys.exit(1 if bad else 0)
