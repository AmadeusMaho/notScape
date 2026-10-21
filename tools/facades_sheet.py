#!/usr/bin/env python3
"""Fachadas de las 30 casas con instalación, fotografiadas en el juego (lote D2): python3 tools/facades_sheet.py salida.png [0herreria,3tienda,...]
Cuadrícula 5 columnas (herrería, taller, banco, tienda, taberna) × 6 biomas. Oculta el minimapa y aleja al jugador para que no salga «Entrar»."""
import sys,os,subprocess,time,json
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));outp=sys.argv[1]
only=sys.argv[2].split(',') if len(sys.argv)>2 else None
srv=subprocess.Popen([sys.executable,'-m','http.server','8825','--bind','127.0.0.1'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
tiles=[]
try:
 with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':1000,'height':800});pg.set_default_timeout(120000)
  pg.goto('http://127.0.0.1:8825/index.html?noedit');pg.wait_for_timeout(5000)
  pg.evaluate("()=>{for(let i=0;i<6;i++)S.boss[i]=1;setZoom(3);MM=0;document.querySelectorAll('#hud,.panel,#side,#inv,#ui').forEach(e=>e.style.display='none')}")
  ds=pg.evaluate("()=>ST.filter(e=>e.id==='door').map((d,i)=>[i,d.k,d.room,!!d.rot])")
  for i,k,room,rot in ds:
   if only and f'{k}{room}' not in only: continue
   c=pg.evaluate('''(i)=>{const d=ST.filter(e=>e.id==='door')[i];P.x=d.x+(d.rot?150:-20);P.y=d.y+(d.rot?-20:150);P.mv=null;P.g=null;ISO.snap(P.x,P.y,TER.standZ(P.x,P.y));return 0}''',i)
   pg.wait_for_timeout(1800)
   q=pg.evaluate('''(i)=>{const d=ST.filter(e=>e.id==='door')[i];const c=ISO.toCanvas(d.x,d.y,TER.standZ(d.x,d.y));const r=cv.getBoundingClientRect();return [r.left+c.x*r.width/cv.width,r.top+c.y*r.height/cv.height]}''',i)
   pg.screenshot(path='/tmp/claude-0/sheets/_d.png')
   im=Image.open('/tmp/claude-0/sheets/_d.png');x,y=int(q[0]),int(q[1])
   t=im.crop((x-190,y-250,x+190,y+70)).copy();ImageDraw.Draw(t).text((4,4),f'{k} {room} rot={int(rot)}',fill=(255,255,255));tiles.append(t)
finally: srv.kill()
n=len(tiles);cols=5;rows=(n+cols-1)//cols;o=Image.new('RGB',(380*cols,320*rows))
for j,t in enumerate(tiles): o.paste(t,((j%cols)*380,(j//cols)*320))
o.save(outp);print(n)
