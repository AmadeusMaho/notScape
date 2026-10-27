# NotScape · COCINA · capturas del ARTE de los ingredientes en cada estación (27 oct 2026): mesa (cortar/filetear), fogón, sartén, parrilla, horno y emplatado.
# Uso (raíz del repo; servidor en 8811, p. ej. `python tools/fast/ns.py start --gpu --no3d`):  python tools/cook_art_shots.py   → capturas/arte_*.png (solo el lienzo del minijuego)
import asyncio
from playwright.async_api import async_playwright
URL='http://127.0.0.1:8811/index.html?r3d=1&test=1&noedit&no3d=1'
CASES=[('g',['carne','trucha','hongo','arroz'],'puchero'),('s',['pollo','huevo','grasa','ancas'],'sarten'),('p',['carne_jab','trucha','camaron'],'parrilla'),('h',['carne','hongo','grasa','pollo'],'horno')]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(headless=False,args=['--ignore-gpu-blocklist']);pg=await (await b.new_context(viewport={'width':1920,'height':1080})).new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto(URL,wait_until='commit');await pg.wait_for_function('window.__nstestReady===true',timeout=300000);await pg.wait_for_timeout(2000)
    ev=pg.evaluate
    async def cv():return await pg.query_selector('#alq canvas')
    for (m,ings,name) in CASES:
      await ev("(()=>{S.goal=0;S.xp.co=20000;ISLA.lock=()=>false;%s.forEach(i=>CHEAT.give(i,3));COC.close();COC.open({x:P.x,y:P.y,id:'cocina',n:'C'});const q=s=>document.querySelector(s);%s.forEach(id=>q('.aq-sh [data-add='+id+']').click());COC.stationClick('%s')})()"%(str(ings),str(ings),m))
      for _ in range(60):
        st=await ev("COC.G.stage")
        if st=='prep':
          await pg.wait_for_timeout(1200)
          await (await cv()).screenshot(path='capturas/arte_mesa_%s_%d.png'%(name,_)) if _<3 else None
          await ev("(()=>{const mg=COC.G.mg;if(mg)COC.prepDone({id:mg.id,i:mg.i,kind:mg.kind,stars:2})})()")
        elif st=='cook':break
        await pg.wait_for_timeout(200)
      for _ in range(200):
        if await ev("COC.G.stage==='cook'&&COC.G.cam&&COC.G.cam.arr"):break
        await pg.wait_for_timeout(100)
      await pg.wait_for_timeout(500)
      r=await ev("(()=>{const r=document.querySelector('#alq canvas').getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()")
      X=lambda x:r[0]+x/800*r[2];Y=lambda y:r[1]+y/460*r[3]
      n=len(ings)
      for i in range(n):
        await pg.mouse.click(X(52+(i%2)*56),Y(278+(i//2)*46));await pg.wait_for_timeout(450)
      await ev("(()=>{const k=COC.G.k;if(k&&k.F!=null)k.F=Math.max(k.F,.6);if(k&&k.T!=null&&k.F!=null)k.T=.5})()")
      await pg.wait_for_timeout(6500)
      await (await cv()).screenshot(path='capturas/arte_%s.png'%name)
      if m=='h' or True:
        await ev("COC.cookDone({cook:.8,burnt:false})")
        for _ in range(100):
          if await ev("COC.G.stage==='plate'&&COC.G.cam.arr"):break
          await pg.wait_for_timeout(100)
        await pg.wait_for_timeout(900)
        await (await cv()).screenshot(path='capturas/arte_plato_%s.png'%name)
    print('errores:',errs or 'ninguno')
    await b.close()
asyncio.run(main())
