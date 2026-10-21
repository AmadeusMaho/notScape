#!/usr/bin/env python3
"""Hoja de contacto de los modelos de src/spots.js (guaridas y ampliación de aldeas) y de otros ORG.U. Sin el juego: solo carga las formas y las pinta en una rejilla.
Uso: python3 -I tools/spots_sheet.py salida.png [escala=2] [modelo,modelo,...]  (por defecto, todos los de spots.js). Cada celda lleva el nombre; termina con RESULTADO: OK / FALLO."""
import sys, os, subprocess, time, base64
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1] if len(sys.argv) > 1 else '/tmp/spots.png'; sc = float(sys.argv[2]) if len(sys.argv) > 2 else 2; only = sys.argv[3].split(',') if len(sys.argv) > 3 else None
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8776', '--bind', '127.0.0.1'], cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1); errs = []
JS = '''([names,sc])=>{const base=Object.keys(ORG.U);const all=names||window.__SPOTS;const cw=150*sc,ch=140*sc,cols=6,rows=Math.ceil(all.length/cols),c=document.createElement('canvas');c.width=cw*cols;c.height=ch*rows;const g=c.getContext('2d');
 g.fillStyle='#cfe0a0';g.fillRect(0,0,c.width,c.height);const bad=[];
 all.forEach((n,i)=>{const x=(i%cols)*cw,y=Math.floor(i/cols)*ch;g.save();g.beginPath();g.rect(x,y,cw,ch);g.clip();g.setTransform(sc,0,0,sc,x,y);g.lineJoin='round';
  const O=window.__OPT&&window.__OPT[n]||{};try{ORG.U[n](g,75,100,0,O)}catch(e){bad.push(n+': '+e.message)}g.restore();g.setTransform(1,0,0,1,0,0);g.fillStyle='#3a2a1a';g.font=(11*sc/2)+'px monospace';g.fillText(n,x+4,y+12*sc/2)});
 return {png:c.toDataURL('image/png'),bad}}'''
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 800, 'height': 600})
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('http://127.0.0.1:8776/index.html?noedit', wait_until='commit'); pg.wait_for_timeout(1800)
        pg.evaluate('''()=>{window.__SPOTS=["tronco","huesos","carpa","estandarte","hoguera","antorcha","muroRuina","columna","arcoRuina","lapida","cruz","tumba","verja","totem","guarida","arbolSeco","abrevadero","comedero","gallinero","carreta","espantapajaros","portillo","estatuaZorro","fumarola","altarDemon","charco","puesto","lanzas"];window.__OPT={columna:{broken:1},muroRuina:{len:40}}}''')
        r = pg.evaluate(JS, [only, sc])
        open(out, 'wb').write(base64.b64decode(r['png'].split(',')[1])); errs += r['bad']; b.close()
finally:
    srv.kill()
for e in errs: print('FALLO:', e)
print('guardado', out); print('RESULTADO:', 'OK' if not errs else 'FALLO'); sys.exit(1 if errs else 0)
