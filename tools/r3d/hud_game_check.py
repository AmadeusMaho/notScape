#!/usr/bin/env python3
"""NotScape · prueba del HUD «Susurro» en el JUEGO REAL (R3D-HUD-PORTEO, 20 oct 2026).
Uso (raíz del repo, servidor sin caché en 8811: `python3 tools/serve_nocache.py 8811`):
   python3 -I tools/r3d/hud_game_check.py [consulta=?noedit] [ancho=1280] [alto=720] [prefijo=hud] [espera_ms=2500]
   · `?noedit` = modo 2D (rápido; SwiftShader dibuja el mundo en blanco a veces, pero el HUD se ve bien) · `?r3d=1&noedit` = 3D real (usa espera_ms ≥ 9000: los fotogramas tardan segundos en SwiftShader).
Ejercita: buffs + sangrado + avisos de XP + banner, combate contra una criatura (marco del objetivo), vida baja y rueda de resistencia. Capturas en /tmp/hud_game_test/<prefijo>_*.png.
SwiftShader NO mide fps. Resultado «ERRORES: ninguno» = 0 errores de JS."""
import asyncio,sys,json,os
from playwright.async_api import async_playwright
Q=sys.argv[1] if len(sys.argv)>1 else '?noedit';W=int(sys.argv[2]) if len(sys.argv)>2 else 1280;H=int(sys.argv[3]) if len(sys.argv)>3 else 720;TAG=sys.argv[4] if len(sys.argv)>4 else 'hud';WT=int(sys.argv[5]) if len(sys.argv)>5 else 2500
OUT='/tmp/hud_game_test/';os.makedirs(OUT,exist_ok=True)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':W,'height':H});errs=[]
    pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)))
    pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_TUNNEL' not in m.text and 'Failed to load resource' not in m.text else None)
    await pg.goto('http://127.0.0.1:8811/index.html'+Q,wait_until='commit')
    ready='window.R3D&&typeof sunS==="function"&&typeof S!=="undefined"&&typeof HUDSU!=="undefined"' if 'r3d=1' in Q else 'typeof sunS==="function"&&typeof S!=="undefined"&&typeof HUDSU!=="undefined"'
    await pg.wait_for_function(ready,timeout=120000);await pg.wait_for_timeout(4000)
    sh=lambda n:pg.screenshot(path=f'{OUT}{TAG}_{n}.png',timeout=180000)
    await sh('1_base')
    await pg.evaluate("""()=>{S.buf.xp=Date.now()+170000;S.buf.dmg=Date.now()+90000;S.buf.spd=Date.now()+30000;P.dot={k:'sangrado',n:3,t:performance.now()+1000,v:0};gain('wc',45);banner('¡Nivel 12!','🪓 Tala','#e8cf94',6000)}""")
    await pg.wait_for_timeout(WT);await sh('2_buffs_xp_banner')
    r=await pg.evaluate("""()=>{const m=M.find(m=>m.d&&m.d.id);if(!m)return null;P.x=m.x-60;P.y=m.y-10;P.mv=null;try{ISO.snap(P.x,P.y,TER.standZ(P.x,P.y))}catch(e){};engage(m,performance.now());m.hp=Math.max(1,Math.floor(m.mh*.62));return [m.d.id,m.d.n]}""")
    print('criatura:',r);await pg.wait_for_timeout(WT);await sh('3_combate')
    await pg.evaluate("()=>{P.hp=2;S.sta=22;RUN=1;S.exh=0}");await pg.wait_for_timeout(WT);await sh('4_vida_baja_rueda')
    print(json.dumps(await pg.evaluate("({hs:HUDSU.ok,retrato:document.getElementById('hs-pp').src.length,sta:S.sta,fichas:document.querySelectorAll('#hs-fx .chip').length})")))
    print('ERRORES:',errs or 'ninguno');await b.close()
asyncio.run(main())
