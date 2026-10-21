# NotScape · R3D · Lote R3D-AGUA-IMPL · captura del MAR (oleaje Gerstner + rompiente) en el juego real. Uso: python3 -I tools/r3d/water_sea.py <salida.png> [calidad=2]
import asyncio,sys
from playwright.async_api import async_playwright
OUT=sys.argv[1];Q=sys.argv[2] if len(sys.argv)>2 else '2'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':960,'height':600});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_TUNNEL' not in m.text else None)
    await pg.goto(f'http://127.0.0.1:8811/index.html?r3d=1&noedit&q={Q}',wait_until='commit')
    await pg.wait_for_function('window.R3D&&R3D.water&&typeof N!=="undefined"&&N.length>0',timeout=90000);await pg.wait_for_timeout(2000)
    r=await pg.evaluate('''(()=>{S.boss={0:1,1:1,2:1,3:1,4:1,5:1};const T=32;for(let ty=0;ty<TER.NY;ty++)for(let tx=Math.floor(TER.NX/2);tx<TER.NX;tx++){if(TER.seaAt(tx,ty)&&TER.tileH(tx,ty-1)===1&&TER.tileH(tx,ty-2)===1&&TER.tileH(tx,ty+3)===.75){P.x=(tx+.5)*T;P.y=(ty-.9)*T;ISO.snap(P.x,P.y,TER.standZ(P.x,P.y));P.hp=1e6;try{setZoom(ZMS.length-2)}catch(_){}document.querySelectorAll('#hud,#side,#tabs,#goalp,#topl,#botl').forEach(q=>q.style.display='none');return [tx,ty].join()}}return 'sin mar'})()''')
    print('mar en',r)
    for _ in range(40):
      n=await pg.evaluate('R3D.preload?R3D.preload():0')
      if not n:break
      await pg.wait_for_timeout(1500)
    await pg.wait_for_timeout(6000);await pg.screenshot(path=OUT,timeout=180000)
    print('errores:',errs or 'ninguno');await b.close()
asyncio.run(main())
