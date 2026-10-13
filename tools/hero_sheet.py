#!/usr/bin/env python3
"""Hoja de contacto de las animaciones del héroe: python3 tools/hero_sheet.py salida.png modo [escala]
modo: walk (8 direcciones × 8 fotogramas), run, o una acción: wc mi fi co sm cr ins f_m f_r f_g (golpe máximo: h_m estocada, h_0 puñetazo, h_r flecha, h_g báculo) (8 fotogramas de fase × dirs E,S,N,SE) """
import sys, os, subprocess, time, base64
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1]; mode = sys.argv[2]; S = float(sys.argv[3]) if len(sys.argv) > 3 else 2
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8809', '--bind', '127.0.0.1'], cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
JS = '''([S,mode])=>{const W=110,H=130,NC=8,dirs=(mode==='walk'||mode==='run')?[0,1,2,3,4,5,6,7]:[0,2,6,1],c=document.createElement('canvas');c.width=Math.ceil(W*S)*NC;c.height=Math.ceil(H*S)*dirs.length;const g=c.getContext('2d');g.fillStyle='#fdf9e3';g.fillRect(0,0,c.width,c.height);
 const ACT={wc:{k:'wc',col:'#9a9aa8'},mi:{k:'mi',col:'#9a9aa8'},fi:{k:'fi'},co:{k:'co',id:'fire'},sm:{k:'sm',id:'anvil'},cr:{k:'cr'},ins:{k:'ins'},f_m:{k:'f',wt:'m',wcol:'#cfd8e0'},f_r:{k:'f',wt:'r',wcol:'#8a5a2a'},f_g:{k:'f',wt:'g',orb:'#9cf'},h_m:{k:'f',wt:'m',wcol:'#cfd8e0',hv:1},h_0:{k:'f',wt:'m',hv:1},h_r:{k:'f',wt:'r',wcol:'#8a5a2a',hv:1},h_g:{k:'f',wt:'g',orb:'#9cf',hv:1},f_0:{k:'f',wt:'m'}};
 dirs.forEach((d,r)=>{for(let i=0;i<NC;i++){const st={dir:d,t:1.3+i*.1,hurt:0,blink:0};
  if(mode==='walk'||mode==='run'){st.mv=1;st.run=mode==='run';st.w=i/NC*2*Math.PI}else if(mode==='hurt'){st.hurt=.8}else if(mode==='idle'){st.t=i*.9}else{st.act=Object.assign({ph:(i+.5)/NC},ACT[mode])}
  const R=HERO.pose(st);g.save();g.setTransform(S,0,0,S,i*Math.ceil(W*S),r*Math.ceil(H*S));g.lineJoin='round';ORG.rot(R.rot);
  try{ORG.U.heroe(g,W/2,H-24,0,{view:R.view,pose:R.pose,item:R.item,trail:R.trail,col:'#9a9aa8',hat:i%2?'helm':undefined,hatCol:'#7a8290'})}catch(e){console.error(e.message)}ORG.rot(false);g.restore()}});return c.toDataURL()}'''
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(); pg.on('pageerror', lambda e: print('ERR', e)); pg.on('console', lambda m: print('C', m.text) if m.type=='error' and 'TUNNEL' not in m.text else 0)
        pg.goto('http://127.0.0.1:8809/index.html?noedit', wait_until='commit'); pg.wait_for_timeout(2000)
        open(out, 'wb').write(base64.b64decode(pg.evaluate(JS, [S, mode]).split(',')[1]))
finally:
    srv.kill()
print('guardado', out)
