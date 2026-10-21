#!/usr/bin/env python3
"""Editor de personaje: python3 tools/creator_check.py [carpeta_capturas]. Primer inicio, opciones, guardado, recarga, y hoja de todos los peinados×caras×vistas. Debe acabar en RESULTADO: OK"""
import sys, os, subprocess, time
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'capturas'); os.makedirs(out, exist_ok=True)
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8811', '--bind', '127.0.0.1'], cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
fails = []; errs = []
def chk(c, m):
    if not c: fails.append(m)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1200, 'height': 800})
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'TUNNEL' not in m.text and 'fonts.g' not in m.text and 'ERR_' not in m.text else 0)
        pg.goto('http://127.0.0.1:8811/index.html', wait_until='commit'); pg.wait_for_timeout(2500)
        chk(pg.is_visible('#ce'), 'el editor no aparece en el primer inicio')
        chk(not pg.is_visible('#ce-no'), 'Cancelar no debe verse en el primer inicio')
        chk(pg.is_disabled('#ce-ok'), 'Empezar debe estar desactivado sin nombre'); pg.fill('#ce-name','a!'); chk(pg.is_disabled('#ce-ok'), 'nombre inválido aceptado'); pg.fill('#ce-name','  Ana   Lu  ')
        chk(not pg.is_disabled('#ce-ok'), 'nombre válido rechazado')
        pg.screenshot(path=out + '/editor_1.png')
        pg.click('.ce-ch[data-k=g] button[data-v=f]'); pg.click('.ce-ch[data-k=hair] button[data-v=bun]'); pg.click('.ce-ch[data-k=face] button[data-v="1"]')
        pg.click('.ce-sw[data-k=col] button:nth-child(5)'); pg.click('.ce-sw[data-k=hc] button:nth-child(4)'); pg.click('.ce-sw[data-k=skin] button:nth-child(3)')
        for m in ('walk', 'run', 'wc'):
            pg.click(f'#ce-modes button[data-m={m}]'); pg.wait_for_timeout(300)
            for _ in range(8): pg.click('[data-r="1"]'); pg.wait_for_timeout(60)
        pg.click('#ce-modes button[data-m=idle]'); pg.wait_for_timeout(300); pg.screenshot(path=out + '/editor_2.png')
        pg.click('#ce-ok'); pg.wait_for_timeout(500)
        chk(not pg.is_visible('#ce'), 'el editor no se cierra')
        app = pg.evaluate('S.app'); chk(app and app['g'] == 'f' and app['hair'] == 'bun' and app['face'] == 1 and app['name'] == 'Ana Lu' and app['col'] == '#2f8a6a', f'S.app incorrecto: {app}')
        pg.evaluate('save()'); stored = pg.evaluate("JSON.parse(localStorage.getItem('tdo2')).app"); chk(stored and stored['hair'] == 'bun', 'no se guarda en tdo2')
        pg.screenshot(path=out + '/editor_juego.png')
        pg.reload(wait_until='commit'); pg.wait_for_timeout(2500)
        chk(not pg.is_visible('#ce'), 'el editor reaparece con personaje ya creado')
        chk(pg.query_selector('#chb') is None, 'el botón Personaje debe haberse quitado')
        pg.evaluate('CREATOR.open(false)'); pg.wait_for_timeout(300); chk(pg.is_visible('#ce') and pg.is_visible('#ce-no') and pg.is_disabled('#ce-name'), 'CREATOR.open(false) debe mostrar Cancelar y bloquear el nombre')
        pg.click('.ce-ch[data-k=g] button[data-v=m]'); pg.click('.ce-ch[data-k=hair] button[data-v=spiky]'); pg.click('#ce-no'); pg.wait_for_timeout(200)
        chk(pg.evaluate('S.app.hair') == 'bun' and pg.evaluate('S.app.g') == 'f', 'Cancelar no revierte')
        pg.evaluate('CREATOR.open(false)'); pg.wait_for_timeout(200); pg.click('.ce-ch[data-k=g] button[data-v=m]'); pg.wait_for_timeout(100)
        chk(pg.evaluate('CREATOR.state.hair') == 'bald', 'al cambiar de género el peinado debe volver a Calvo si no existe'); pg.click('#ce-no')
        pg.evaluate("localStorage.removeItem('tdo2')"); pg.reload(wait_until='commit'); pg.wait_for_timeout(2500); chk(pg.is_visible('#ce'), 'tras reiniciar debe volver el editor')
        # hoja: peinados × caras × vistas (front, side, back) con todas las animaciones compartidas
        data = pg.evaluate('''()=>{const S2=2.6,W=60,H=64,M=['bald','cut','spiky','side','curly','mane'],F=['bald','long','bun','pony','bob','twin'],rows=[...M.map(h=>['m',h]),...F.map(h=>['f',h])],V=[2,0,6,1],c=document.createElement('canvas');c.width=Math.ceil(W*S2)*16;c.height=Math.ceil(H*S2)*rows.length;const g=c.getContext('2d');g.fillStyle='#fdf9e3';g.fillRect(0,0,c.width,c.height);
         rows.forEach(([gd,hs],r)=>{for(let f=0;f<4;f++)V.forEach((d,j)=>{const R=HERO.pose({dir:d,t:1.2,blink:0}),i=f*4+j,A={g:gd,hair:hs,hc:['#5a3a22','#c08a3a','#a83a22','#2a1a12'][f],skin:['#f6d4b0','#d9a066','#b5764a','#f0c08a'][f],col:['#c0392b','#3a7ac0','#2f8a6a','#c04a8a'][f],eye:['#3a2620','#2a5aa0','#2f8a4a','#8a3aa8'][f],face:f};
          g.setTransform(S2,0,0,S2,i*Math.ceil(W*S2),r*Math.ceil(H*S2));g.lineJoin='round';ORG.rot(R.rot);ORG.U.heroe(g,W/2,H-10,0,Object.assign({view:R.view,pose:R.pose,collar:'#e8c0a8'},PROPS.appOpts(A)));ORG.rot(false)})});return c.toDataURL()}''')
        import base64; open(out + '/editor_hoja.png', 'wb').write(base64.b64decode(data.split(',')[1]))
        b.close()
finally:
    srv.kill()
print('errores de consola/JS:', errs if errs else 'ninguno'); print('fallos:', fails if fails else 'ninguno')
print('RESULTADO:', 'OK' if not fails and not errs else 'FALLO')
