"""Mide la caja (izq,der,arriba,abajo) de cada modelo de prop para la tabla BH de src/props.js. Uso: python3 tools/bbox_props.py raiz_proyecto > bb.json (luego sumar 12 px de margen)."""
import sys, subprocess, time, json
from playwright.sync_api import sync_playwright
root=sys.argv[1]
srv=subprocess.Popen([sys.executable,'-m','http.server','8793','--bind','127.0.0.1'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
try:
  with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page();pg.goto('http://127.0.0.1:8793/index.html?noedit');pg.wait_for_timeout(1500)
    r=pg.evaluate('''()=>{const seen={},out={};const AX=130,AY=205,Wc=260,Hc=250;
      const all=PROPS.list.concat(PO||[]);
      for(const e of all){if(!e.n||!ORG.U[e.n])continue;const k=e.n+'|'+JSON.stringify(e.o||{});if(seen[k])continue;seen[k]=1;
        const c=document.createElement('canvas');c.width=Wc;c.height=Hc;const g=c.getContext('2d',{willReadFrequently:true});g.lineJoin='round';
        ORG.noSoft(false);ORG.theme(null);ORG.rot(e.o&&e.o.rot);try{ORG.U[e.n](g,AX,AY,0,e.o)}catch(x){}ORG.rot(false);
        const d=g.getImageData(0,0,Wc,Hc).data;let x0=Wc,y0=Hc,x1=-1,y1=-1;for(let y=0;y<Hc;y++)for(let x=0;x<Wc;x++)if(d[(y*Wc+x)*4+3]>4){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
        const o=out[e.n]||(out[e.n]={l:0,r:0,u:0,d:0,n:0});o.n++;if(x1>=0){o.l=Math.max(o.l,AX-x0);o.r=Math.max(o.r,x1-AX);o.u=Math.max(o.u,AY-y0);o.d=Math.max(o.d,y1-AY)}}
      return out}''')
    print(json.dumps(r))
    b.close()
finally: srv.terminate()
