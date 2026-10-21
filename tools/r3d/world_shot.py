# NotScape · R3D · capturas del JUEGO (?r3d=1) en VARIOS puntos del mundo en una sola sesión (Fase 44-0, 19 oct 2026).
# Como shot_at.py, pero: (1) varios puntos por sesión (la carga del juego tarda ~1 min en SwiftShader), (2) FUERZA la construcción del terreno de la zona (R3D.preload() hasta que no quede
# nada pendiente: sin esto las zonas lejanas salen con fondo claro, ver «Trampa de herramienta» de PLAN_MUNDO_ABIERTO §1), (3) abre TODAS las compuertas EN MEMORIA (S.boss=1) para poder
# teletransportarse a cualquier bioma (la página es nueva en cada ejecución: NO toca tu partida), (4) admite zoom por punto y la query extra (p. ej. `wk=1` para el mundo antiguo).
# Uso (raíz del repo, con `python3 -m http.server 8811 &`):
#   python3 -I tools/r3d/world_shot.py <prefijo> <hora: dia|atardecer|noche> "x,y[,zoomIdx];x,y[,zoomIdx];…" [K_oleo=70] [extra_query]
# HIDE2D=1 oculta el lienzo 2D (evita el «fotograma roto» rojo/negro de SwiftShader en sesiones con muchas tomas; ver Lote R3D-F49b). VW=1900 VH=1150 agranda la ventana (más mundo a la vista). NOHUD=1 oculta el HUD (paneles, objetivos, registro) para ver solo el mundo.
# Guarda <prefijo>_1.png, <prefijo>_2.png… (x,y en px de MUNDO). rotMs (4.º valor): mantiene la tecla «,» pulsada esos ms para girar la cámara (≈1,6 rad/s con reloj real). zoomIdx: índice de ZF en game.js (por defecto el del juego, 3); menor = más lejos.
import asyncio,sys,os
from playwright.async_api import async_playwright
PRE,T,PTS=sys.argv[1],sys.argv[2],[[float(v) for v in p.split(',')] for p in sys.argv[3].split(';') if p.strip()]
K=int(sys.argv[4]) if len(sys.argv)>4 else 70;ZV=os.environ.get('ZV')   # ZV=0.5: zoom «de depuración» menor que el mínimo del juego (vista de conjunto de la aldea; solo para capturas)
EXTRA=sys.argv[5] if len(sys.argv)>5 else ''
SUN={'dia':61,'atardecer':145,'noche':241}
INIT="const raf=window.requestAnimationFrame.bind(window);window.__fix=null;window.__t0=0;window.requestAnimationFrame=cb=>raf(ts=>cb(window.__fix===null?ts:window.__fix+(ts-window.__t0)*.002));"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':int(os.environ.get('VW',960)),'height':int(os.environ.get('VH',600))});errs=[]   # VW/VH: tamaño de ventana (Fase 44b: una ventana grande deja ver la aldea entera; el zoom mínimo del juego es 1 a cualquier tamaño);errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_TUNNEL' not in m.text and 'status of 404' not in m.text else None)   # los 404 son la música (assets/music) que se pide al pulsar una tecla; no existe en el zip de trabajo
    await pg.add_init_script(INIT);await pg.goto('http://127.0.0.1:8811/index.html?r3d=1&noedit'+('&'+EXTRA if EXTRA else ''),wait_until='commit')
    await pg.wait_for_function('window.R3D&&typeof sunS==="function"&&typeof S!=="undefined"',timeout=120000);await pg.wait_for_timeout(2500)
    if os.environ.get('NOHUD'):await pg.add_style_tag(content='#hud,#side,#goals,#log,#topl,#botl,#ctl,#hd{display:none!important}')
    if os.environ.get('HIDE2D'):await pg.add_style_tag(content='#c{visibility:hidden!important}')   # Fase 49b: oculta el lienzo 2D (HUD dibujado, flechas, mariposas…). En SwiftShader, tras ≥3 teletransportes en una sesión ese lienzo 2D se llena de basura roja/negra (solo el 2D; la capa 3D sale limpia): con HIDE2D=1 se ve solo el mundo 3D
    for i,pt in enumerate(PTS,1):
      ZVSET=('ISO.V.zoom='+ZV+';') if ZV else '';X,Y=pt[0],pt[1];Z=int(pt[2]) if len(pt)>2 else None
      await pg.evaluate(f'''(()=>{{for(let k=0;k<5;k++)S.boss[k]=1;{"setZoom("+str(Z)+");" if Z is not None else ""}P.x={X};P.y={Y};GOOD=null;ISO.snap(P.x,P.y,TER.standZ(P.x,P.y));window.__t0=performance.now();window.__fix={SUN[T]}*1000;R3D.oil={K/100};R3D.parts.snap();{ZVSET}}})()''')
      await pg.wait_for_timeout(1500)
      if len(pt)>3:
        await pg.evaluate('window.__fix=null')   # reloj real mientras gira (con el reloj congelado dt≈0 y la cámara no se mueve)
        await pg.keyboard.down(',');await pg.wait_for_timeout(int(pt[3]));await pg.keyboard.up(',');await pg.wait_for_timeout(1200)
        await pg.evaluate(f'(()=>{{window.__t0=performance.now();window.__fix={SUN[T]}*1000}})()')
      left=await pg.evaluate('(()=>{let n=1,g=0;while(n>0&&g++<60)n=R3D.preload();return n})()')   # construye de golpe los chunks de la vista
      await pg.wait_for_timeout(2500);await pg.evaluate('R3D.parts.snap()');await pg.wait_for_timeout(4500)
      info=await pg.evaluate('JSON.stringify({p:[Math.round(P.x),Math.round(P.y)],bio:biomeAt(P.x,P.y),chunks:R3D.stats?R3D.stats().chunks:null,occ:(R3D.dbg.aScene.children.find(o=>o.name==="terreno3d_occ")||{children:[]}).children.length})')
      await pg.screenshot(path=f'{PRE}_{i}.png',timeout=180000);print(f'{PRE}_{i}.png',info,'pendiente:',left)
    print('errores:',errs or 'ninguno');print('RESULTADO: OK' if not errs else 'RESULTADO: FALLO');await b.close()
asyncio.run(main())
