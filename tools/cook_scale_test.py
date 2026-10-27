# NotScape · COCINA/ALQUIMIA · prueba de la REGLA DE ESCALA POR PANTALLA (`UIS`, `--ui`) y del bloqueo del TUTORIAL (27 oct 2026).
# Para cada tamaño (1280×720, 1920×1080, ultrawide 3440×1440): abre la cocina, mide el panel `#alq` y su lienzo (deben ocupar bastante pantalla y NO salirse), comprueba que un arrastre con ratón REAL
# sigue acertando con el zoom CSS (el ramillo de hierba se anota) y, en modo tutorial (paso «make:c_camaron»), que solo se ofrece el método Asado y el camarón. Guarda capturas en capturas/.
# Uso (raíz del repo; servidor en 8811, p. ej. `python tools/fast/ns.py start --gpu --no3d`):  python tools/cook_scale_test.py
import asyncio
from playwright.async_api import async_playwright
URL='http://127.0.0.1:8811/index.html?r3d=1&test=1&noedit&no3d=1'
SIZES=[(1280,720),(1920,1080),(3440,1440)]
async def main():
  bad=0
  async with async_playwright() as p:
    b=await p.chromium.launch(headless=False,args=['--ignore-gpu-blocklist'])
    for (W,H) in SIZES:
      ctx=await b.new_context(viewport={'width':W,'height':H});pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
      await pg.goto(URL,wait_until='commit');await pg.wait_for_function('window.__nstestReady===true',timeout=300000);await pg.wait_for_timeout(2000)
      ev=pg.evaluate
      # 1) cocina normal (no tutorial)
      await ev("(()=>{S.goal=0;S.xp.co=3000;ISLA.lock=()=>false;[['camaron',2],['grasa',2],['h_salvia',3]].forEach(([i,n])=>CHEAT.give(i,n));COC.close();COC.open({x:P.x,y:P.y,id:'cocina',n:'C'})})()")
      await pg.wait_for_timeout(500)
      m=await ev("(()=>{const e=document.querySelector('#alq'),c=e.querySelector('canvas'),a=e.getBoundingClientRect(),r=c.getBoundingClientRect();return {ui:UIS.v,pw:a.width,ph:a.height,px:a.x,py:a.y,cw:r.width,ch:r.height,tabs:[...e.querySelectorAll('.aq-tg button')].filter(b=>b.style.display!=='none').length}})()")
      fit=m['px']>=-1 and m['py']>=-1 and m['px']+m['pw']<=W+1 and m['py']+m['ph']<=H+1
      print(f"{W}x{H}: --ui={m['ui']:.2f} panel {m['pw']:.0f}x{m['ph']:.0f} lienzo {m['cw']:.0f}px ({m['cw']/W*100:.0f}% del ancho) cabe={fit} pestañas={m['tabs']}")
      if not fit or m['cw']<min(W*.4,700): bad+=1
      await pg.screenshot(path=f'capturas/cocina_{W}.png')
      # 2) tutorial: solo Asado y camarón
      await ev("(()=>{COC.close();S.goal=GOALS.findIndex(g=>g[1]==='make:c_camaron');COC.open({x:P.x,y:P.y,id:'cocina',n:'C'})})()")
      await pg.wait_for_timeout(400)
      t=await ev("(()=>{const e=document.querySelector('#alq');return {meths:[COC.tutM()],ings:[...e.querySelectorAll('.aq-sh [data-add]')].map(b=>b.dataset.add),recs:e.querySelectorAll('.aq-sh [data-rk]').length,sel:COC.G.sel.slice(),tabs:[...e.querySelectorAll('.aq-tg button')].filter(b=>b.style.display!=='none').map(b=>b.dataset.t),meth:COC.G.meth}})()")
      print('   tutorial:',t)
      if t['meths']!=['p'] or t['ings']!=['camaron'] or t['meth']!='p' or t['recs']!=1 or t['sel']!=['camaron']: bad+=1
      await pg.screenshot(path=f'capturas/cocina_tut_{W}.png')
      # 3) ratón real con el zoom: arrastrar un ramillo (se cocina camarón + manteca en Frito, sin tutorial)
      await ev("(()=>{S.goal=0;COC.close();COC.open({x:P.x,y:P.y,id:'cocina',n:'C'});const q=s=>document.querySelector(s);['camaron','grasa'].forEach(id=>q('[data-add='+id+']').click());COC.stationClick('s')})()")
      for _ in range(300):
        if await ev("COC.G&&COC.G.stage==='cook'&&COC.G.cam&&COC.G.cam.arr"):break
        await pg.wait_for_timeout(100)
      await pg.wait_for_timeout(500)
      r=await ev("(()=>{const r=document.querySelector('#alq canvas').getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()")
      X=lambda x:r[0]+x/800*r[2];Y=lambda y:r[1]+y/460*r[3]
      nj=await ev("['d','s','a','p','u'].filter(k=>L('co')>=({d:4,s:0,a:8,p:14,u:22})[k]).length")
      await pg.mouse.move(X(200+nj*60),Y(40));await pg.mouse.down();await pg.mouse.move(X(420),Y(250),steps=12)
      for i in range(10):
        await pg.mouse.move(X(420+12*((i%2)*2-1)),Y(250),steps=2);await pg.wait_for_timeout(120)
      await pg.mouse.up()
      hb=await ev("JSON.stringify(COC.G.hb)");print('   arrastre con zoom:',hb)
      if 'h_salvia' not in hb: bad+=1
      if errs: print('   errores:',errs);bad+=1
      await ctx.close()
    await b.close()
  print('RESULTADO:','OK' if not bad else f'FALLO ({bad})')
asyncio.run(main())
