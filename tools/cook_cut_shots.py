# NotScape · COCINA · capturas de la vista general nueva (ingredientes arriba → tocar estación) y del TROCEADO real al cortar (carne) y picar (hierbas) (27 oct 2026).
# Uso (raíz del repo; servidor en 8811, p. ej. `python tools/fast/ns.py start --gpu --no3d`):  python tools/cook_cut_shots.py   → capturas/corte_*.png
import asyncio,math
from playwright.async_api import async_playwright
URL='http://127.0.0.1:8811/index.html?r3d=1&test=1&noedit&no3d=1'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(headless=False,args=['--ignore-gpu-blocklist']);pg=await (await b.new_context(viewport={'width':1920,'height':1080})).new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto(URL,wait_until='commit');await pg.wait_for_function('window.__nstestReady===true',timeout=300000);await pg.wait_for_timeout(2000)
    ev=pg.evaluate
    cv=lambda:pg.query_selector('#alq canvas')
    await ev("(()=>{S.goal=0;S.xp.co=20000;ISLA.lock=()=>false;[['carne',2],['trucha',2],['h_manzanilla',2]].forEach(([i,n])=>CHEAT.give(i,n));COC.close();COC.open({x:P.x,y:P.y,id:'cocina',n:'C'});const q=s=>document.querySelector(s);['carne','h_manzanilla'].forEach(id=>q('.aq-sh [data-add='+id+']').click())})()")
    await pg.wait_for_timeout(800);await (await cv()).screenshot(path='capturas/corte_vista.png')
    await ev("COC.stationClick('s')")
    for _ in range(100):
      if await ev("COC.G.stage==='prep'&&COC.G.mg&&COC.G.cam.arr"):break
      await pg.wait_for_timeout(100)
    for fase in range(2):
      kind=await ev("COC.G.mg.kind");print('mini:',kind)
      await pg.wait_for_timeout(500)
      for i in range(4):
        await ev("(()=>{const m=COC.G.mg;if(m.kind==='cut'){const mk=m.marks[m.kn];m.cuts.push({x:mk.x,y:mk.y,a:[.5,-.4,1.2,.1,.8][m.kn],t:0});m.kn++;}else if(m.kind==='chop'){m.hits.push(m.marks[m.n]);m.n++}})()")
        await pg.wait_for_timeout(120 if i<3 else 900)
        if i==1:await (await cv()).screenshot(path='capturas/corte_%s_1.png'%kind)
      await (await cv()).screenshot(path='capturas/corte_%s_2.png'%kind)
      await ev("(()=>{const mg=COC.G.mg;COC.prepDone({id:mg.id,i:mg.i,kind:mg.kind,stars:2})})()")
      await pg.wait_for_timeout(1500)
      if await ev("COC.G.stage!=='prep'"):break
    print('errores:',errs or 'ninguno')
    await b.close()
asyncio.run(main())
