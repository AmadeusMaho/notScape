#!/usr/bin/env python3
"""Pruebas de la demo del HUD (Chromium sin pantalla + SwiftShader; NO sirve para medir fps).
Uso:  python3 -I tools/r3d/hud_demo/check.py [carpeta_salida]      (ejecuta build.py antes)
Comprueba: (1) ningún recuadro de la mochila se mueve al hacer hover; (2) 0 errores de JS;
(3) guarda capturas: main.png (jugador+mochila), wow.png (objetivo + XP), opt.png (Opciones), eq_<basico|cuero|acero>.png (retratos).
"""
import asyncio,base64,os,subprocess,sys,threading,http.server,functools
from playwright.async_api import async_playwright
R=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..','..'))
out=sys.argv[1] if len(sys.argv)>1 else '/tmp/hud_demo_test'
subprocess.check_call([sys.executable,'-I',os.path.join(R,'tools','r3d','hud_demo','build.py'),out])
H=functools.partial(http.server.SimpleHTTPRequestHandler,directory=out)
srv=http.server.ThreadingHTTPServer(('127.0.0.1',0),H);port=srv.server_address[1]
threading.Thread(target=srv.serve_forever,daemon=True).start()
async def main():
  fails=[]
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':1240,'height':900});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('http://127.0.0.1:%d/test.html'%port);await pg.wait_for_timeout(4000)
    js="()=>[...document.querySelectorAll('#grid .cell')].map(c=>{const r=c.getBoundingClientRect();return [r.x,r.y,r.width].map(v=>Math.round(v*10)/10)})"
    base=await pg.evaluate(js)
    for i in ('0','7','13'):
      await pg.hover('.cell[data-i="%s"]'%i);await pg.wait_for_timeout(500)
      if await pg.evaluate(js)!=base: fails.append('la rejilla se mueve al hacer hover en la celda '+i)
    await pg.mouse.move(5,5)
    st=await pg.query_selector('#stage')
    await st.screenshot(path=os.path.join(out,'main.png'))
    await pg.evaluate("for(let i=0;i<3;i++)document.getElementById('bXp').click();document.getElementById('bTgt').click()");await pg.wait_for_timeout(700)
    await st.screenshot(path=os.path.join(out,'wow.png'))
    await pg.evaluate("document.getElementById('tb-opt').click()");await pg.wait_for_timeout(300)
    await st.screenshot(path=os.path.join(out,'opt.png'))
    for n in ('basico','cuero','acero'):
      u=await pg.evaluate("(n)=>window.__icon('heroP',{eq:n},null,200)",n)
      open(os.path.join(out,'eq_%s.png'%n),'wb').write(base64.b64decode(u.split(',')[1]))
    if errs: fails.append('errores JS: %s'%errs[:3])
    await b.close()
  print('FALLOS:' if fails else 'TODO OK (capturas en %s)'%out, *fails, sep='\n')
  sys.exit(1 if fails else 0)
asyncio.run(main())
