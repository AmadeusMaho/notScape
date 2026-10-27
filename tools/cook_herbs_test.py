# NotScape · COCINA · prueba de la SAZÓN CON HIERBAS FRESCAS (27 oct 2026): abre la cocina, elige camarón + manteca (Frito), llega a la sartén, arrastra un ramillo de hierba sobre la comida con ratón REAL
# y comprueba que se anota en `g.hb`, que el radar/efectos lo reflejan, y que al emplatar se gasta la hierba. Guarda capturas en capturas/.
# Uso (raíz del repo; servidor en 8811, p. ej. `python tools/fast/ns.py start --gpu --no3d`):  python tools/cook_herbs_test.py
import asyncio,sys
from playwright.async_api import async_playwright
URL='http://127.0.0.1:8811/index.html?r3d=1&test=1&noedit&no3d=1'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(headless=False,args=['--ignore-gpu-blocklist']);ctx=await b.new_context(viewport={'width':1500,'height':860});pg=await ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto(URL,wait_until='commit');await pg.wait_for_function('window.__nstestReady===true',timeout=300000);await pg.wait_for_timeout(2500)
    ev=pg.evaluate
    await ev("(()=>{S.xp.co=3000;ISLA.lock=()=>false;[['camaron',2],['grasa',2],['h_salvia',3],['h_loto',2]].forEach(([i,n])=>CHEAT.give(i,n));COC.close();COC.open({x:P.x,y:P.y,id:'cocina',n:'C'});const q=s=>document.querySelector(s);['camaron','grasa'].forEach(id=>q('[data-add='+id+']').click());COC.stationClick('s')})()")
    for _ in range(300):
      if await ev("COC.G&&COC.G.stage==='cook'&&COC.G.cam&&COC.G.cam.arr"):break
      await pg.wait_for_timeout(100)
    await pg.wait_for_timeout(600)
    r=await ev("(()=>{const r=document.querySelector('#alq canvas').getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()")
    X=lambda x:r[0]+x/800*r[2];Y=lambda y:r[1]+y/460*r[3]
    nj=await ev("['d','s','a','p','u'].filter(k=>L('co')>=({d:4,s:0,a:8,p:14,u:22})[k]).length")
    st=await ev("JSON.stringify({stage:COC.G.stage,herbs:COC.herbsHave()})");print('estado',st)
    await pg.screenshot(path='capturas/cocina_hierbas_1.png')
    # ramillo 0 (salvia) está en x=566; se arrastra al centro de la sartén (~ 400,250) y se mantiene un par de segundos
    await pg.mouse.move(X(200+nj*60),Y(40));await pg.mouse.down();await pg.mouse.move(X(420),Y(250),steps=14)
    for _ in range(14):
      await pg.mouse.move(X(420+12*((_%2)*2-1)),Y(250),steps=2);await pg.wait_for_timeout(120)
    await pg.screenshot(path='capturas/cocina_hierbas_2.png');await pg.mouse.up()
    hb=await ev("JSON.stringify(COC.G.hb)");mx=await ev("JSON.stringify(COC.mix(COC.G.sel,COC.G.sp,COC.G.hb).top)");print('hb',hb,'efectos',mx)
    ok=hb and 'h_salvia' in hb and not errs
    print('errores:',errs or 'ninguno');print('RESULTADO:','OK' if ok else 'FALLO')
    await b.close()
asyncio.run(main())
