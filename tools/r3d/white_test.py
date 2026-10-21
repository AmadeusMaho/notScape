# Prueba del «suelo blanco»: teletransporta SIN precargar (como en el juego real, con chunks aún sin construir) y mide la fracción de píxeles blancos/cielo claro.
import asyncio,sys,os
from playwright.async_api import async_playwright
from PIL import Image
PTS=[(300,17900),(9000,200),(27300,17900),(14000,9000),(4600,15152)]
INIT="const raf=window.requestAnimationFrame.bind(window);window.__fix=null;window.__t0=0;window.requestAnimationFrame=cb=>raf(ts=>cb(window.__fix===null?ts:window.__fix+(ts-window.__t0)*.002));"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':1280,'height':800});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.add_init_script(INIT);await pg.goto('http://127.0.0.1:8811/index.html?r3d=1&noedit',wait_until='commit')
    await pg.wait_for_function('window.R3D&&typeof sunS==="function"&&typeof S!=="undefined"',timeout=150000);await pg.wait_for_timeout(2500)
    await pg.add_style_tag(content='#hud,#side,#goals,#log,#topl,#botl,#ctl,#hd{display:none!important}#c{visibility:hidden!important}')
    for i,(x,y) in enumerate(PTS):
      await pg.evaluate(f'(()=>{{for(let k=0;k<5;k++)S.boss[k]=1;setZoom(0);P.x={x};P.y={y};GOOD=null;ISO.snap(P.x,P.y,TER.standZ(P.x,P.y));window.__t0=performance.now();window.__fix=61*1000;R3D.oil=.7}})()')
      await pg.wait_for_timeout(2500)   # SIN R3D.preload(): lo que ve el jugador al llegar
      f=f'/tmp/claude-0/-home-claude/ea091f96-f1d2-5ea1-96c1-8841da10aca4/scratchpad/shots/white_{i}.png';await pg.screenshot(path=f)
      im=Image.open(f).convert('RGB');px=im.load();W,H=im.size;n=0;sky=0
      for yy in range(0,H,4):
        for xx in range(0,W,4):
          r,g,bb=px[xx,yy];n+=1
          if min(r,g,bb)>215:sky+=1
      ch=await pg.evaluate('R3D.stats?R3D.stats().chunks:-1')
      print((x,y),'chunks',ch,'blanco %.2f%%'%(100*sky/n))
    print('errores:',errs or 'ninguno');await b.close()
asyncio.run(main())
