#!/usr/bin/env python3
"""Comprobación automática SIN pantalla (Chromium headless vía Playwright). Complementa, no reemplaza, el checklist manual de AGENTS.md.
Uso: python3 tools/headless_check.py [carpeta_de_capturas]      (por defecto /tmp/notscape_shots)
Hace: (1) carga el juego nuevo y con ?old y reporta errores de consola; (2) verifica que cada rectángulo de PD (agua) esté bloqueado por blk()
salvo bajo el puente y que la calzada del puente sea libre, con TODAS las puertas abiertas; (3) mide WT.draw por bioma; (4) guarda capturas del canvas
(estanque, río+puente, lago, y los otros biomas). Requiere `pip install playwright` + `playwright install chromium`. Levanta su propio servidor
http en un puerto libre y lo cierra al terminar (no uses `pkill -f http.server`: mata tu propio shell)."""
import base64, os, subprocess, sys, time, socket
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/notscape_shots'
os.makedirs(OUT, exist_ok=True)
s = socket.socket(); s.bind(('127.0.0.1', 0)); PORT = s.getsockname()[1]; s.close()
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
BASE = f'http://127.0.0.1:{PORT}/'

def open_page(b, url):
    pg = b.new_page(viewport={'width': 1100, 'height': 800}); errs = []
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load' not in m.text else None)
    for pat in ('**/fonts.googleapis.com/**', '**/fonts.gstatic.com/**'): pg.route(pat, lambda r: r.abort())  # sin red: las fuentes no cargan, no importa
    pg.goto(url, wait_until='domcontentloaded'); pg.wait_for_timeout(2500)
    return pg, errs

ok = True
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg, errs = open_page(b, BASE)
        has_wt = pg.evaluate("typeof WT!=='undefined'&&WT!==null")
        print('Juego nuevo: WT activo =', has_wt, '| errores de consola =', errs[:5]); ok &= not errs
        # (2) colisiones: S.boss es un OBJETO (no arreglo); hay que abrir las puertas o todo x>=BW está bloqueado y el test no dice nada
        r = pg.evaluate("""()=>{const old=JSON.parse(JSON.stringify(S.boss));for(let i=0;i<8;i++)S.boss[i]=1;let bad=[],n=0,free=0;
          for(let k=0;k<5;k++){const x0=k*BW;PD.filter(p=>p.x>=x0&&p.x<x0+BW).forEach((p,i)=>{
            for(let x=p.x;x<p.x+p.w;x+=2)for(let y=p.y;y<p.y+p.h;y+=2){n++;const inB=i===1&&x>=x0+236&&x<=x0+304;if(!inB&&!blk(x,y))bad.push([k,i,x,y])}
            if(i===1){for(let x=x0+237;x<x0+304;x+=3)for(let y=1228;y<=1308;y+=4){free++;if(blk(x,y))bad.push(['puente bloqueado',k,x,y])}
              for(const x of [x0+60,x0+200,x0+234,x0+306,x0+400])if(!blk(x,1270))bad.push(['rio libre',k,x])}})}
          for(const q in S.boss)delete S.boss[q];Object.assign(S.boss,old);return {n,free,nbad:bad.length,bad:bad.slice(0,6)}}""")
        print('Colisiones agua vs blk():', r); ok &= r['nbad'] == 0
        if has_wt:
            t = pg.evaluate("""()=>{const c=document.createElement('canvas');c.width=WW;c.height=WH;const g=c.getContext('2d'),o=[];
              for(let k=0;k<5;k++){const x0=k*BW,t=performance.now();WT.draw(g,k,x0,BI[k],PD.filter(p=>p.x>=x0&&p.x<x0+BW));o.push(Math.round(performance.now()-t))}return o}""")
            print('WT.draw ms por bioma (el primero incluye JIT en frío):', t)
        # (4) capturas: el jugador se teletransporta (P.x/P.y); la cámara lo sigue en el siguiente frame
        for name, k, dx, dy in (('estanque', 0, 730, 1150), ('puente', 0, 270, 1200), ('lago', 0, 1470, 1100), ('puente_bosque', 1, 270, 1200),
                                ('puente_pantano', 2, 270, 1200), ('puente_nieve', 3, 270, 1200), ('lava', 4, 730, 1150)):
            pg.evaluate(f"()=>{{P.x={k}*BW+{dx};P.y={dy}}}"); pg.wait_for_timeout(900)
            d = pg.evaluate("document.getElementById('c').toDataURL('image/png')")
            open(os.path.join(OUT, f'juego_{name}.png'), 'wb').write(base64.b64decode(d.split(',')[1]))
        pg.close()
        pg2, e2 = open_page(b, BASE + '?old')
        print('Con ?old: WT =', pg2.evaluate("typeof WT!=='undefined'&&WT!==null"), '| GR =', pg2.evaluate("GR!==null"), '| errores =', e2[:5]); ok &= not e2
        pg2.close(); b.close()
finally:
    srv.terminate()
print('Capturas en', OUT); print('RESULTADO:', 'OK' if ok else 'FALLOS')
sys.exit(0 if ok else 1)
