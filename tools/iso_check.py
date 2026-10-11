#!/usr/bin/env python3
"""Comprobación sin pantalla del juego isométrico (F1-B). Uso: python3 tools/iso_check.py [carpeta_capturas]
Levanta un servidor, abre el juego en Chromium headless, comprueba errores de consola y colisiones, y guarda capturas."""
import sys, os, subprocess, time, json
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'capturas'); os.makedirs(out, exist_ok=True)
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8765', '--bind', '127.0.0.1'], cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1); errs = []; fails = []
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1280, 'height': 800}, device_scale_factor=1)
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('http://127.0.0.1:8765/index.html'); pg.wait_for_timeout(1500)
        shots = {'01_inicio': (200, 750), '02_puente_rio': (270, 1240), '03_estanque': (700, 1150), '04_paso_cerrado': (2250, 770), '05_acantilado': (2250, 300)}
        for n, (x, y) in shots.items():
            pg.evaluate(f'P.x={x};P.y={y};P.mv=null;P.g=null'); pg.wait_for_timeout(700)
            pg.screenshot(path=os.path.join(out, n + '.png'))
        # colisiones: la lógica es la de siempre; comprobamos que blk() sigue bloqueando agua y acantilado y deja libre el puente y el paso
        r = pg.evaluate('''()=>{const c=blk(2400,770);S.boss[0]=1;const r={agua:blk(700,1250),pasto:blk(200,750),puente:blk(270,1270),acant:blk(2300,300),paso:blk(2300,770),cerrado:c};S.boss[0]=0;return r}''')  # S.boss[0]=1 abre la puerta del bioma 1
        exp = {'agua': True, 'pasto': False, 'puente': False, 'acant': True, 'paso': False, 'cerrado': True}
        for k, v in exp.items():
            if r[k] != v: fails.append(f'blk {k}: esperado {v}, salió {r[k]}')
        # el clic: un punto de la pantalla debe volver al mismo tile (a la altura del suelo)
        c = pg.evaluate('''()=>{P.x=300;P.y=800;P.mv=null;let bad=0,n=0;for(let i=0;i<200;i++){const x=P.x-200+Math.random()*400,y=P.y-150+Math.random()*300,z=TER.heightAt(x,y),q=ISO.toCanvas(x,y,z),w=ISO.toWorld(q.x,q.y,TER.heightAt);n++;if(Math.abs(w.x-x)>2||Math.abs(w.y-y)>2)bad++}return[bad,n]}''')
        if c[0] > 10: fails.append(f'clic: {c[0]}/{c[1]} puntos no vuelven a su sitio')
        # teclado: en 8 direcciones sobre ejes de pantalla; arriba debe subir en pantalla
        pg.evaluate('P.x=300;P.y=800;P.mv=null;P.g=null'); pg.wait_for_timeout(300); y0 = pg.evaluate('ISO.proj(P.x,P.y,1).y'); pg.evaluate('K.u=1'); pg.wait_for_timeout(500)
        y1 = pg.evaluate('ISO.proj(P.x,P.y,1).y'); pg.evaluate('K.u=0')
        if not y1 < y0 - 5: fails.append(f'tecla arriba no sube en pantalla ({y0}->{y1})')
        # rendimiento: ms por frame de draw()
        t = pg.evaluate('''()=>{const a=performance.now();for(let i=0;i<60;i++)draw(performance.now());return (performance.now()-a)/60}''')
        print('draw() ms/frame (software, solo para comparar): %.1f' % t)
        # F1-C1 · cursor de tile: con el ratón sobre el canvas, el tile resaltado debe ser el que hay bajo el puntero; fuera, ninguno
        pg.evaluate('P.x=300;P.y=800;P.mv=null;P.g=null'); pg.wait_for_timeout(500)
        bb = pg.evaluate('(()=>{const r=cv.getBoundingClientRect();return [r.left,r.top,r.width,r.height]})()')
        js_hover = 'm=>{const rc=cv.getBoundingClientRect(),px=(m[0]-rc.left)*cv.width/rc.width,py=(m[1]-rc.top)*cv.height/rc.height,w=ISO.toWorld(px,py,TER.heightAt),q=ISO.tileAt(w.x,w.y);return [CUR.tx===q.tx&&CUR.ty===q.ty,CUR.tx,CUR.ty,q.tx,q.ty]}'
        for fx, fy in [(.5, .5), (.3, .7), (.75, .35)]:
            mx, my = bb[0] + bb[2] * fx, bb[1] + bb[3] * fy
            pg.mouse.move(mx, my); pg.wait_for_timeout(200)
            r = pg.evaluate(js_hover, [mx, my])
            if not r[0]: fails.append(f'cursor: tile {r[1:3]} != esperado {r[3:5]} en ({fx},{fy})')
        pg.mouse.move(bb[0] + bb[2] * .5, bb[1] + bb[3] * .5); pg.wait_for_timeout(200)
        pg.screenshot(path=os.path.join(out, '06_cursor.png'))
        pg.mouse.move(5, 5); pg.wait_for_timeout(200)
        if pg.evaluate('CUR.tx') != -1: fails.append('cursor: sigue visible con el ratón fuera del canvas')
        # cursor sobre agua (no transitable): captura aparte
        pg.evaluate('P.x=700;P.y=1000;P.mv=null;P.g=null'); pg.wait_for_timeout(500)
        pg.mouse.move(bb[0] + bb[2] * .5, bb[1] + bb[3] * .5); pg.wait_for_timeout(200)
        pg.screenshot(path=os.path.join(out, '07_cursor_agua.png'))
        b.close()
finally:
    srv.terminate()
print('errores de consola:', errs if errs else 'ninguno')
print('fallos:', fails if fails else 'ninguno')
print('RESULTADO:', 'OK' if not errs and not fails else 'FALLÓ')
sys.exit(1 if errs or fails else 0)
