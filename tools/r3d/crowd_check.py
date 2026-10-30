"""Fluidez con MUCHOS enemigos/animales cerca (corral de la Pradera, 29 oct 2026): mide ms por fotograma, GPU del mundo y nº de placas de nombre a 1500, 700 y 350 px
y DENTRO del corral, con la CPU sin limitar (thr 1) y limitada ×6 (≈ un portátil lento). Necesita el servidor en el 8811 (python tools/serve_nocache.py 8811) y Playwright.
Uso: PYTHONUTF8=1 python tools/r3d/crowd_check.py     · Referencia tras los arreglos (thr 6): fuera 23–25 ms, a 350 px ~35 ms, en el corral ≤ ~65 ms (antes 218 ms).
Si dentro del corral sube mucho respecto a 350 px, mira placas `.np` (will-change, sombras, radio en `dMo`), números de daño (`hsDraw`) y `R3D.stats()`."""

import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(headless=False,args=['--ignore-gpu-blocklist','--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding','--disable-background-timer-throttling'])
    ctx=await b.new_context(viewport={'width':1718,'height':655},device_scale_factor=2)
    await ctx.add_init_script("try{localStorage.setItem('ns_q','0')}catch(e){}")
    pg=await ctx.new_page()
    await pg.goto('http://127.0.0.1:8811/index.html?test=1&noedit',wait_until='commit')
    await pg.wait_for_function('window.__nstestReady===true',timeout=600000)
    await pg.wait_for_timeout(3000)
    await pg.evaluate("""()=>{ISLA.lock=()=>false;['cb','ra','mg'].forEach(k=>S.xp[k]=XT[50]);S.eq.w='sw_hierro';NSTEST.quality(0);NSTEST.zoom(0);P.hp=99999}""")
    cdp=await ctx.new_cdp_session(pg)
    async def at(label,x,y,thr):
      await cdp.send('Emulation.setCPUThrottlingRate',{'rate':thr})
      await pg.evaluate("([x,y])=>{NSTEST.tp(x,y)}",[x,y]);await pg.wait_for_timeout(9000)
      r=await pg.evaluate("""async()=>{const t=[],g=[];let l=performance.now();const t0=l;await new Promise(res=>{const f=()=>{const n=performance.now();t.push(n-l);l=n;if(R3D.gpu&&R3D.gpu.mundo!=null)g.push(R3D.gpu.mundo);if(n-t0<4000)requestAnimationFrame(f);else res()};requestAnimationFrame(f)});t.sort((a,b)=>a-b);g.sort((a,b)=>a-b);const now=performance.now();const nearM=M.filter(m=>alive(m,now)&&Math.hypot(m.x-P.x,m.y-P.y)<700);return {fr:t.length,med:+t[t.length>>1].toFixed(0),gpu:+(g[g.length>>1]||0).toFixed(1),calls:R3D.stats().calls,tris:R3D.stats().tris/1000|0,mobs700:nearM.length,hunting:nearM.filter(m=>m.hunt).length,plates:document.querySelectorAll('.np').length,platesVis:[...document.querySelectorAll('.np')].filter(e=>e.style.display!=='none'&&e.offsetParent).length}}""")
      print(label,'thr',thr,r,flush=True)
    for thr in (1,6):
      await at('lejos 1500px',3500,15830-1500,thr)
      await at('a 700px',3500,15830-700,thr)
      await at('a 350px',3500,15830-350,thr)
      await at('en el corral',3500,15830,thr)
    await b.close()
asyncio.run(main())
