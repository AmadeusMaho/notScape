# Fuerza una pasarela N–S y una E–O en DK (hoy el mundo no tiene ninguna) y reconstruye el terreno para verla.
import asyncio,sys
from playwright.async_api import async_playwright
INIT="const raf=window.requestAnimationFrame.bind(window);window.__fix=null;window.__t0=0;window.requestAnimationFrame=cb=>raf(ts=>cb(window.__fix===null?ts:window.__fix+(ts-window.__t0)*.002));"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':1280,'height':800});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_' not in m.text and '404' not in m.text else None)
    await pg.add_init_script(INIT);await pg.goto('http://127.0.0.1:8811/index.html?r3d=1&noedit',wait_until='commit')
    await pg.wait_for_function('window.R3D&&typeof sunS==="function"&&typeof S!=="undefined"',timeout=150000);await pg.wait_for_timeout(2500)
    await pg.add_style_tag(content='#hud,#side,#goals,#log,#topl,#botl,#ctl,#hd{display:none!important}')
    X,Y=4600,15152;tx0,ty0=Math_floor=int(X/32),int(Y/32)
    await pg.evaluate(f'''(()=>{{const F=TER.fields(),NX=TER.NX;
      for(let i=0;i<6;i++){{F.DK[(({ty0}-2+i)*NX)+({tx0}+3)]=1;F.DK[(({ty0}-2+i)*NX)+({tx0}+4)]=1}}   // N–S, 2 de ancho
      for(let i=0;i<6;i++)F.DK[(({ty0}+5)*NX)+({tx0}-2+i)]=3;   // E–O (kind 3 = compuerta N–S: planks en el otro sentido)
      const T=R3D.dbg.terr;T.ch.forEach(c=>{{T.grp.remove(c.g);if(c.grass)T.freeGrass(c)}});T.ch.clear();
      P.x={X};P.y={Y};GOOD=null;ISO.snap(P.x,P.y,TER.standZ(P.x,P.y));window.__t0=performance.now();window.__fix=61*1000;R3D.oil=.7;}})()''')
    await pg.wait_for_timeout(1500);await pg.evaluate('(()=>{let n=1,g=0;while(n>0&&g++<60)n=R3D.preload();return n})()');await pg.wait_for_timeout(5000)
    await pg.screenshot(path=sys.argv[1],timeout=180000);print('errores:',errs or 'ninguno');await b.close()
asyncio.run(main())
