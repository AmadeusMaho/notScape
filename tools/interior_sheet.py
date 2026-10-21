#!/usr/bin/env python3
"""Hoja de modelos de interior recortados a su caja: python3 tools/interior_sheet.py salida.png [escala] [n1,n2,..] [js-opts]"""
import sys,os,subprocess,time,base64
from playwright.sync_api import sync_playwright
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out=sys.argv[1];S=float(sys.argv[2]) if len(sys.argv)>2 else 2
names=sys.argv[3].split(',') if len(sys.argv)>3 else None
opts=sys.argv[4] if len(sys.argv)>4 else '{}'
srv=subprocess.Popen([sys.executable,'-m','http.server','8804','--bind','127.0.0.1'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
JS='''([S,names,opts])=>{const ks=names||Object.keys(ORG.U).filter(n=>INT_NAMES.includes(n)),cells=[];
 for(const n of ks){const c=document.createElement('canvas');c.width=c.height=Math.ceil(700*S);const g=c.getContext('2d');g.setTransform(S,0,0,S,0,0);g.lineJoin='round';
  try{ORG.U[n](g,350,500,0,Object.assign({},opts,opts[n]||{}))}catch(e){console.log(n,e.message)}
  const d=g.getImageData(0,0,c.width,c.height).data;let x0=1e9,y0=1e9,x1=0,y1=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>8){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  if(x1>=x0)cells.push({n,c,x0,y0,w:x1-x0+1,h:y1-y0+1})}
 const cols=5,cw=Math.max(...cells.map(q=>q.w))+20,ch=Math.max(...cells.map(q=>q.h))+34,rows=Math.ceil(cells.length/cols),o=document.createElement('canvas');o.width=cw*cols;o.height=ch*rows;const q=o.getContext('2d');q.fillStyle='#fff8e0';q.fillRect(0,0,o.width,o.height);q.font='14px sans-serif';q.fillStyle='#333';
 cells.forEach((k,i)=>{const X=(i%cols)*cw,Y=Math.floor(i/cols)*ch;q.drawImage(k.c,k.x0,k.y0,k.w,k.h,X+10,Y+24,k.w,k.h);q.fillText(k.n+' '+Math.round(k.w/S)+'x'+Math.round(k.h/S),X+6,Y+16)});return o.toDataURL()}'''
try:
  with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page();pg.on('pageerror',lambda e:print('ERR',e));pg.on('console',lambda m:print(m.text))
    pg.goto('http://127.0.0.1:8804/index.html?noedit',wait_until='commit');pg.wait_for_timeout(2500)
    import json
    pg.evaluate("window.INT_NAMES='sala mesa silla taburete cama alfombra hogar alacena estante barra barrilTap mesaTrabajo mesaEscribir rackArmas herramientas escudoPared cuadro maceta plantaGrande colgante pielPared cojin mesaBaja biombo farolPapel arcon hamaca barrilAgua fuelle cestaLena'.split(' ')")
    open(out,'wb').write(base64.b64decode(pg.evaluate(JS,[S,names,json.loads(opts)]).split(',')[1]))
finally: srv.kill()
print('ok',out)
