#!/usr/bin/env python3
"""Hoja de variantes de casa (V1/V2, 15 oct 2026): dibuja cada modelo de casa con sus variantes `o.v` y mide su silueta respecto al ancla.
Uso: python3 -I tools/house_sheet.py salida.png [escala=2] [modelos=casa,troncos,...]  -> imprime BH sugerido (izq,der,arriba,abajo + 12 px de margen) y termina con RESULTADO: OK/FALLO.
Sirve para ajustar la tabla BH de props.js (lienzo de horneado) cuando se cambia o se añade una variante."""
import sys,os,json
from playwright.sync_api import sync_playwright
root=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
out=sys.argv[1] if len(sys.argv)>1 else 'house_sheet.png';sc=float(sys.argv[2]) if len(sys.argv)>2 else 2
ms=(sys.argv[3] if len(sys.argv)>3 else 'casa,troncos,casaLarga,casaJp,casaMaya,cabana,taberna').split(',')   # también acepta modelo:estilo (p. ej. iglesia:stave) y modelos sin variantes (huerto, monumento, molino, pagoda, templo)
JS="""([ms,sc])=>{const U=ORG.U,CW=190,CH=230,res={};const cols=6,rows=ms.length;const c=document.createElement('canvas');c.width=CW*cols*sc;c.height=CH*rows*sc;const g=c.getContext('2d');g.fillStyle='#a6d24c';g.fillRect(0,0,c.width,c.height);
 const t=document.createElement('canvas');t.width=CW*2;t.height=CH*2;const tg=t.getContext('2d',{willReadFrequently:true});
 ms.forEach((n,r)=>{const [nm,sty]=n.split(':'),vs=/^(casa|troncos|casaLarga|casaJp|casaMaya|cabana)$/.test(nm)?6:1,mx={l:0,r:0,t:0,b:0};for(let v=0;v<vs;v++){if(v===5&&nm!=='casa')continue;const oo={v,style:sty};
  const ax=CW,ay=CH*1.4;tg.clearRect(0,0,t.width,t.height);U[nm](tg,ax,ay,0,oo);const d=tg.getImageData(0,0,t.width,t.height).data;let x0=1e9,y0=1e9,x1=-1,y1=-1;
  for(let y=0;y<t.height;y++)for(let x=0;x<t.width;x++)if(d[(y*t.width+x)*4+3]>20){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  mx.l=Math.max(mx.l,ax-x0);mx.r=Math.max(mx.r,x1-ax);mx.t=Math.max(mx.t,ay-y0);mx.b=Math.max(mx.b,y1-ay);
  g.save();g.translate((v*CW+CW/2)*sc,(r*CH+CH*.72)*sc);g.scale(sc,sc);U[nm](g,0,0,0,oo);g.restore();
  g.fillStyle='#3a2a20';g.font=(11*sc)+'px sans-serif';g.fillText(n+' v'+v,(v*CW+6)*sc,(r*CH+14)*sc)}
  res[n]=mx});
 return{png:c.toDataURL('image/png'),res}}"""
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type in('error','warning') else None)
    pg.set_content('<canvas></canvas>')
    for f in('style.js','style-organic.js'):pg.add_script_tag(path=os.path.join(root,'src',f))
    r=pg.evaluate(JS,[ms,sc]);b.close()
import base64
open(out,'wb').write(base64.b64decode(r['png'].split(',')[1]))
for n,m in r['res'].items():print('%-10s BH:[%d,%d,%d,%d]'%(n,m['l']+12,m['r']+12,m['t']+12,m['b']+12))
for e in errs:print('FALLO:',e)
print('RESULTADO:','OK' if not errs else 'FALLO');sys.exit(1 if errs else 0)
