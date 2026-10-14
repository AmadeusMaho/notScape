#!/usr/bin/env python3
"""Cierre fase A (lote D8): por aldea, solapes casa-casa/casa-adorno; entra y sale de cada casa con instalacion y lista sus estaciones. Uso: python3 tools/close_phase_a.py (capturas de interiores de los biomas 0 y 3 en /tmp)"""
import sys,subprocess,time,json
from playwright.sync_api import sync_playwright
S='/tmp/'
srv=subprocess.Popen([sys.executable,'-m','http.server','8861','--bind','127.0.0.1'],cwd='/home/claude/ns',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':1400,'height':900});pg.set_default_timeout(60000);errs=[]
  pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('http://127.0.0.1:8861/index.html?noedit');pg.wait_for_timeout(5000)
  pg.evaluate("()=>{for(let i=0;i<6;i++)S.boss[i]=1;P.hp=9999}")
  # 1) geometria: por aldea, casas vs recursos/guaridas/pois, puertas alcanzables
  r=pg.evaluate("""()=>BI.map((B,k)=>{const V=B.village,H=V.props.filter(p=>/^(casa|taberna|troncos|casaLarga|salon|palafito|casaJp|casaMaya|stabbur|casaArbol|cabana|granero)/.test(p.n)&&p.fp),out=[];
   const ov=(a,b)=>Math.abs(a.x-b.x)<a.fp[0]+(b.fp?b.fp[0]:0)&&Math.abs(a.y-b.y)<a.fp[1]+(b.fp?b.fp[1]:0);
   for(let i=0;i<H.length;i++)for(let j=i+1;j<H.length;j++)if(ov(H[i],H[j]))out.push('casa-casa '+H[i].x+','+H[i].y+' / '+H[j].x+','+H[j].y);
   V.props.forEach(q=>{if(!q.fp||H.includes(q))return;H.forEach(h=>{if(ov(h,q)&&!/^(pino|roble|abedul|sauce|cerezo|bambu|arbolSeco|obsidiana)$/.test(q.n))out.push(h.n+'@'+h.x+','+h.y+' x '+q.n)})});
   const inside=H.filter(h=>Math.abs(h.x-V.safe[0])>V.safe[2]||Math.abs(h.y-V.safe[1])>V.safe[3]).length;
   return {k,houses:H.length,out,fuera:inside}})""")
  for x in r: print(x['k'],x['houses'],'fuera',x['fuera'],x['out'][:6])
  # 2) entrar a cada puerta, mirar interior, salir
  for k in range(6):
    n=pg.evaluate("""(k)=>{const B=BI[k];P.x=B.ox+B.village.safe[0];P.y=B.oy+B.village.safe[1];P.mv=null;P.g=null;ISO.snap(P.x,P.y,TER.standZ(P.x,P.y));return ST.filter(e=>e.id==='door'&&e.k===k).map(e=>e.room)}""",k)
    pg.wait_for_timeout(600)
    for room in n:
      res=pg.evaluate("""([k,room])=>{const e=ST.find(e=>e.id==='door'&&e.k===k&&e.room===room);P.x=e.x;P.y=e.y+10;enterRoom(e);return !!INT}""",[k,room])
      pg.wait_for_timeout(500)
      if k in(0,3) : pg.screenshot(path=S+f'int_{k}_{room}.png')
      st=pg.evaluate("()=>ST.filter(e=>e.inroom).map(e=>e.id).join(',')")
      pg.evaluate("()=>leaveRoom()")
      pg.wait_for_timeout(300)
      print(k,room,'entra',res,'estaciones',st,'sale',not pg.evaluate("()=>!!INT"))
  print('errs',errs[:5])
finally: srv.kill()
