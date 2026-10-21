#!/usr/bin/env python3
"""F6-música · comprueba MUSIC en el juego real (Chromium headless con autoplay permitido): mundo → aldea (jugador en la plaza) → combate → jefe → noche,
fundidos de potencia igual, pausa con reanudación, reinicio de combate, bucle sin corte (solape al final) y vuelta a la música antigua en un bioma sin pistas.
Uso: python3 -I tools/music_check.py. Termina con RESULTADO: OK / FALLO."""
import sys, os, subprocess, time
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8783', '--bind', '127.0.0.1'], cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1); errs = []; fails = []
def ok(c, m):
    print(('  ok   ' if c else '  FALLA ') + m)
    if not c: fails.append(m)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        pg = b.new_page(viewport={'width': 1280, 'height': 800})
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'fonts.g' not in m.text and 'ERR_' not in m.text and 'WebGL' not in m.text else None)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('http://127.0.0.1:8783/index.html?noedit'); pg.wait_for_timeout(1200)
        pg.evaluate('S.boss=[1,1,1,1,1];S.mute=false;S.mv=60;P.x=1150;P.y=800;P.mv=null;P.g=null'); pg.keyboard.press('Space'); pg.mouse.click(600, 300); pg.evaluate('A=null;P.mv=null;P.g=null')
        st = lambda: pg.evaluate('MUSIC.state()')
        def wait(s): pg.wait_for_timeout(int(s * 1000))
        wait(5)
        s = st(); print('estado inicial:', {k: (v['v'], v['playing']) for k, v in s.items()})
        ok(len(s) == 5, 'se crean las 5 pistas de la Pradera')
        ok(not any(v['dead'] for v in s.values()), 'ningún mp3 falla al cargar')
        ok(s['0_mundo']['v'] > .95 and s['0_mundo']['playing'], 'fuera del pueblo, de día: suena «mundo»')
        ok(all(not v['playing'] for k, v in s.items() if k != '0_mundo'), 'las demás están pausadas')
        t0 = s['0_mundo']['t']; wait(2); ok(st()['0_mundo']['t'] > t0 + 1, 'mundo avanza (reproduciendo de verdad)')
        # entrar al pueblo (posición real, usa inVil)
        pg.evaluate('P.x=2300;P.y=1500'); wait(1.5); s = st()
        print('a mitad del fundido:', {k: v['v'] for k, v in s.items() if v['v'] > 0})
        pw = s['0_mundo']['v'] ** 0 and (__import__('math').sin(s['0_mundo']['v'] * 1.5708) ** 2 + __import__('math').sin(s['0_aldea']['v'] * 1.5708) ** 2)
        ok(.7 < pw < 1.4, 'a mitad del fundido la potencia total es ≈ constante (%.2f)' % pw)
        wait(3); s = st(); ok(s['0_aldea']['v'] > .95 and s['0_aldea']['playing'], 'en la plaza suena «aldea»')
        ok(not s['0_mundo']['playing'], 'mundo queda pausado')
        tm = s['0_mundo']['t']; pg.evaluate('P.x=1150;P.y=800'); wait(4)
        s = st(); ok(s['0_mundo']['playing'] and s['0_mundo']['t'] >= tm, 'al salir, mundo reanuda donde iba (%.1f → %.1f s)' % (tm, s['0_mundo']['t']))
        # combate
        pg.evaluate('MUSIC.dbg={fight:true}'); wait(2.5); s = st(); ok(s['0_combate']['v'] > .9 and s['0_combate']['playing'], 'combate entra rápido (<2,5 s)')
        tc = s['0_combate']['t']; pg.evaluate('MUSIC.dbg=null'); wait(4); wait(1)
        s = st(); ok(not s['0_combate']['playing'] and s['0_combate']['t'] < 1, 'combate se apaga y vuelve al inicio')
        ok(s['0_mundo']['v'] > .9, 'tras el combate vuelve «mundo»')
        pg.evaluate('MUSIC.dbg={fight:true,boss:true}'); wait(2); s = st(); ok(s['0_jefe']['v'] > .9 and s['0_jefe']['playing'] and s['0_combate']['v'] < .2, 'jefe tiene prioridad sobre combate')
        pg.evaluate('MUSIC.dbg=null'); wait(5)
        pg.evaluate('MUSIC.dbg={night:true}'); wait(5); s = st(); ok(s['0_noche']['v'] > .95 and s['0_noche']['playing'], 'de noche fuera del pueblo suena «noche»')
        pg.evaluate('MUSIC.dbg={night:true,vil:true}'); wait(4.5); s = st(); ok(s['0_aldea']['v'] > .9, 'en el pueblo de noche sigue sonando «aldea»')
        pg.evaluate('MUSIC.dbg=null'); wait(5)
        # bucle sin corte: saltar al final de «mundo»
        d = st()['0_mundo']['dur']
        pg.evaluate('MUSIC.seek&&MUSIC.seek("0_mundo",%f)' % (d - 2.5)); wait(4)
        s = st(); ok(s['0_mundo']['playing'] and s['0_mundo']['vol'] > .3 and s['0_mundo']['t'] < d - 10, 'el bucle sigue sonando tras el final (t=%.1f de %.1f)' % (s['0_mundo']['t'], d))
        # otro bioma → sus propias pistas (Bosque) y las de Pradera se apagan
        pg.evaluate('P.x=BI[1].ox+1150;P.y=BI[1].oy+500'); wait(6); r = pg.evaluate('({has:MUSIC.has(curB),b:curB})')
        s = st(); ok(r['b'] == 1 and s['1_mundo']['playing'] and s['1_mundo']['v'] > .9 and not s['0_mundo']['playing'], 'en el Bosque suena bosque_mundo y se apaga pradera (curB=%d)' % r['b'])
        ok(all(MUSIC_HAS for MUSIC_HAS in [pg.evaluate('MUSIC.has(%d)' % k) for k in range(6)]), 'los 6 biomas tienen pistas')
        b.close()
finally:
    srv.kill()
for e in errs: fails.append('consola: ' + e)
for f in fails: print('FALLO:', f)
print('RESULTADO:', 'OK' if not fails else 'FALLO'); sys.exit(1 if fails else 0)
