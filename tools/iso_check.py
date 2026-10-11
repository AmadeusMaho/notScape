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
        pg.evaluate('CURON=1')
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
        pg.evaluate('CURON=0'); pg.mouse.move(bb[0] + bb[2] * .5, bb[1] + bb[3] * .5); pg.wait_for_timeout(200)
        if pg.evaluate('CUR.tx') != -1: fails.append('cursor: se dibuja con el interruptor apagado')
        pg.evaluate('CURON=1'); pg.mouse.move(5, 5); pg.wait_for_timeout(100)
        if pg.evaluate('CUR.tx') != -1: fails.append('cursor: sigue visible con el ratón fuera del canvas')
        # cursor sobre agua (no transitable): captura aparte
        pg.evaluate('P.x=700;P.y=1000;P.mv=null;P.g=null'); pg.wait_for_timeout(500)
        pg.mouse.move(bb[0] + bb[2] * .5, bb[1] + bb[3] * .5); pg.wait_for_timeout(200)
        pg.screenshot(path=os.path.join(out, '07_cursor_agua.png'))
        # F1-C2 · resalte de entidad: el ratón sobre una entidad debe resaltarla (y el clic usa la misma selección)
        pg.evaluate('P.x=200;P.y=750;P.mv=null;P.g=null'); pg.wait_for_timeout(500)
        info = pg.evaluate('(()=>{const e=ST[0],k=SPR*ISO.scale(),q=ISO.toCanvas(e.x,e.y,TER.heightAt(e.x,e.y)),r=cv.getBoundingClientRect();return {id:e.id,x:r.left+q.x*r.width/cv.width,y:r.top+(q.y-10*k)*r.height/cv.height,on:onScr(e.x,e.y)}})()')
        if not info['on']: pg.evaluate('(()=>{const e=ST[0];P.x=e.x-60;P.y=e.y+10})()'); pg.wait_for_timeout(600); info = pg.evaluate('(()=>{const e=ST[0],k=SPR*ISO.scale(),q=ISO.toCanvas(e.x,e.y,TER.heightAt(e.x,e.y)),r=cv.getBoundingClientRect();return {id:e.id,x:r.left+q.x*r.width/cv.width,y:r.top+(q.y-10*k)*r.height/cv.height,on:onScr(e.x,e.y)}})()')
        pg.mouse.move(info['x'], info['y']); pg.wait_for_timeout(250)
        h = pg.evaluate('CUR.hov&&CUR.hov===ST[0]')
        if not h: fails.append('resalte: la entidad bajo el puntero no se resalta')
        pg.screenshot(path=os.path.join(out, '08_resalte_entidad.png'))
        px_sil = pg.evaluate('(()=>{const d=HLC.getContext("2d").getImageData(0,0,HLC.width,HLC.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>0)n++;return n})()')
        if px_sil < 50: fails.append(f'contorno: la silueta casi no tiene píxeles ({px_sil})')
        # el contorno debe funcionar con los tres tipos de entidad: recurso (N), monstruo (M) y estación (ST)
        for nombre, lst, idx in [('09_contorno_recurso', 'N', 0), ('10_contorno_monstruo', 'M', 0), ('11_contorno_estacion', 'ST', 3)]:
            ok = pg.evaluate(f'(()=>{{const l={lst}.filter(e=>alive(e,performance.now())&&e.x<2200),e=l[{idx}%l.length];if(!e)return false;window.__e=e;P.x=e.x-70;P.y=e.y+40;P.mv=null;P.g=null;return true}})()')
            if not ok: continue
            pg.wait_for_timeout(700)
            q = pg.evaluate('(()=>{const e=window.__e,k=SPR*ISO.scale(),q=ISO.toCanvas(e.x,e.y,TER.heightAt(e.x,e.y)),r=cv.getBoundingClientRect();return [r.left+q.x*r.width/cv.width,r.top+(q.y-10*k)*r.height/cv.height]})()')
            pg.mouse.move(q[0], q[1]); pg.wait_for_timeout(250)
            if not pg.evaluate('CUR.hov===window.__e'): fails.append(f'contorno: {lst} no se resalta')
            pg.screenshot(path=os.path.join(out, nombre + '.png'))
        pg.mouse.move(bb[0] + bb[2] * .5, bb[1] + bb[3] * .1); pg.wait_for_timeout(200)
        pg.mouse.move(5, 5); pg.wait_for_timeout(200)
        if pg.evaluate('CUR.hov') is not None and pg.evaluate('CUR.on'): fails.append('resalte: queda activo con el ratón fuera')
        # F1-C3 · oclusión: un árbol DELANTE del jugador que le tapa debe atenuarse (~0,5); si el jugador está delante o lejos, no
        pg.mouse.move(5, 5)
        o = pg.evaluate('(()=>{const e=N.filter(n=>n.t==="wc"&&alive(n,performance.now())&&n.x<2200)[0];window.__t=e;return [e.x,e.y]})()')
        def pon(dx, dy, ms=900):
            pg.evaluate(f'(()=>{{const e=window.__t;P.x=e.x+({dx});P.y=e.y+({dy});P.mv=null;P.g=null}})()'); pg.wait_for_timeout(ms)
            return pg.evaluate('window.__t._oa==null?1:window.__t._oa')
        a_det = pon(-10, -10); pg.screenshot(path=os.path.join(out, '12_oclusion_detras.png'))
        a_del = pon(30, 30); pg.screenshot(path=os.path.join(out, '13_oclusion_delante.png'))
        a_lej = pon(-200, 0)
        a_det2 = pon(-10, -10)
        print('oclusión (alpha del árbol): detrás=%.2f delante=%.2f lejos=%.2f otra vez detrás=%.2f' % (a_det, a_del, a_lej, a_det2))
        if not a_det < .7: fails.append(f'oclusión: el árbol no se atenúa con el jugador detrás ({a_det:.2f})')
        if not a_del > .95: fails.append(f'oclusión: el árbol se atenúa con el jugador delante ({a_del:.2f})')
        if not a_lej > .95: fails.append(f'oclusión: el árbol se atenúa con el jugador lejos ({a_lej:.2f})')
        if not a_det2 < .7: fails.append('oclusión: no vuelve a atenuarse')
        b.close()
finally:
    srv.terminate()
print('errores de consola:', errs if errs else 'ninguno')
print('fallos:', fails if fails else 'ninguno')
print('RESULTADO:', 'OK' if not errs and not fails else 'FALLÓ')
sys.exit(1 if errs or fails else 0)
