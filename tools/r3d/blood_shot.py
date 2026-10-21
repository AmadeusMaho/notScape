# NotScape · R3D · Lote R3D-SANGRE · prueba de la SANGRE en el juego real (?r3d=1, Chromium sin pantalla, SwiftShader).
# Uso (raíz del repo, con `python3 tools/serve_nocache.py 8811 &`):
#   python3 -I tools/r3d/blood_shot.py <prefijo_salida> [arma=sw_hierro|none|bw_roble|st_pino…] [monstruo=goblin] [golpes=4] [extra_query]  (zoom máximo y HUD oculto, para ver la sangre)
# Teletransporta al héroe junto a un monstruo de ese tipo, le pone el arma, inicia el combate real (startF) y hace capturas tras cada golpe (<prefijo>_1.png…) y una
# final con el cadáver (<prefijo>_muerte.png). El monstruo tiene vida de sobra hasta el último golpe. Imprime R3D.blood.stats y errores. NO congela el tiempo (la física de
# las gotas es real: con SwiftShader los fps son bajos, así que las capturas muestran gotas en el aire solo a veces; las manchas siempre salen).
import asyncio,sys
from playwright.async_api import async_playwright
OUT=sys.argv[1];W=sys.argv[2] if len(sys.argv)>2 else 'sw_hierro';MID=sys.argv[3] if len(sys.argv)>3 else 'goblin';NH=int(sys.argv[4]) if len(sys.argv)>4 else 4;EXTRA=sys.argv[5] if len(sys.argv)>5 else ''
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':960,'height':600});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_TUNNEL' not in m.text else None)
    await pg.goto('http://127.0.0.1:8811/index.html?r3d=1&noedit&sangre=2'+EXTRA,wait_until='commit')
    await pg.wait_for_function('window.R3D&&typeof sunS==="function"&&typeof S!=="undefined"&&typeof M!=="undefined"&&M.length>0',timeout=90000);await pg.wait_for_timeout(3000)
    r=await pg.evaluate(f'''(()=>{{const m=M.find(q=>q.d.id==='{MID}');if(!m)return 'sin monstruo {MID}';
      S.eq.w={'null' if W=='none' else "'"+W+"'"};S.ar=1;P.x=m.x-34;P.y=m.y;ISO.snap(P.x,P.y,TER.standZ(P.x,P.y));P.hp=1e6;m.hp=m.mh=1e6;m.rt=0;window.__m=m;
      try{{setZoom(ZMS.length-1)}}catch(e){{}}document.querySelectorAll('#hud,#side,#tabs,#goalp,#topl,#botl').forEach(e=>e.style.display='none');startF(m,performance.now());return 'ok'}})()''')
    print('prep:',r)
    if r!='ok':await b.close();return
    await pg.wait_for_timeout(2500)
    hits0=await pg.evaluate('R3D.blood.stats.golpes')
    for i in range(1,NH+1):
      await pg.wait_for_function(f'R3D.blood.stats.golpes>={hits0+i}',timeout=60000);await pg.wait_for_timeout(450)
      await pg.screenshot(path=f'{OUT}_{i}.png',timeout=180000)
    await pg.evaluate('(()=>{window.__m.hp=0;hitM(window.__m,1,performance.now(),"cb",99)})()');await pg.wait_for_timeout(2600)
    await pg.screenshot(path=f'{OUT}_muerte.png',timeout=180000)
    print('stats:',await pg.evaluate('JSON.stringify(R3D.blood.stats)'),'nivel',await pg.evaluate('R3D.blood.level'))
    print('errores:',errs or 'ninguno');print('RESULTADO: OK' if not errs else 'RESULTADO: FALLO');await b.close()
asyncio.run(main())
