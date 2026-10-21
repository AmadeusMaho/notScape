# NotScape · R3D · F6b · comprobación de ATUENDOS del héroe (Chromium sin pantalla, SwiftShader).
# Uso (raíz del repo, con `python3 -m http.server 8811 &`):  python3 -I tools/r3d/outfit_check.py <carpeta_salida>
# 1) abre el editor en modo «solo atuendo» y captura la vista previa 3D de cada atuendo (4 PNG recortados al panel del editor);
# 2) con cada atuendo puesto, captura el héroe en el mundo (aldea, día) y comprueba que setLook no lanza errores;
# 3) comprueba que el equipo manda: con armadura equipada se retira la prenda de torso. Imprime RESULTADO: OK/FALLO.
import asyncio,sys,os
from playwright.async_api import async_playwright
OUT=sys.argv[1] if len(sys.argv)>1 else 'capturas_outfit';os.makedirs(OUT,exist_ok=True)
SUN=61
INIT="const raf=window.requestAnimationFrame.bind(window);window.__fix=null;window.__t0=0;window.requestAnimationFrame=cb=>raf(ts=>cb(window.__fix===null?ts:window.__fix+(ts-window.__t0)*.002));"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':960,'height':640});errs=[];ok=True
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_TUNNEL' not in m.text else None)
    await pg.add_init_script(INIT);await pg.goto('http://127.0.0.1:8811/index.html?r3d=1&noedit',wait_until='commit')
    await pg.wait_for_function('window.R3D&&typeof sunS==="function"&&typeof S!=="undefined"',timeout=90000)
    await pg.evaluate('S.app=Object.assign({name:"Probador",g:"m",hair:"cut",hc:"#5a3a22",skin:"#f0c08a",col:"#c0392b",eye:"#3a2620",face:0},S.app||{})')
    await pg.evaluate(f'window.__t0=performance.now();window.__fix={SUN}*1000');await pg.wait_for_timeout(2500)
    ids=await pg.evaluate('R3D.outfits.list.map(o=>o.id)');print('atuendos:',ids)
    await pg.evaluate('CREATOR.open(false,true)');await pg.wait_for_timeout(1500)
    for i in ids:
      await pg.evaluate(f'(()=>{{CREATOR.state.outfit="{i}";document.querySelector("#ce-outfits [data-v=\\"{i}\\"]").click()}})()');await pg.wait_for_timeout(2500)
      bb=await pg.evaluate('(()=>{const r=document.querySelector(".ce-card").getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})()');await pg.screenshot(path=f'{OUT}/editor_{i}.png',clip=bb,timeout=180000)
    await pg.evaluate('CREATOR.close(false)');await pg.wait_for_timeout(500)
    for i in ids:
      await pg.evaluate(f'(()=>{{S.app.outfit="{i}";R3D.parts.snap()}})()');await pg.wait_for_timeout(2500)
      await pg.screenshot(path=f'{OUT}/mundo_{i}.png',clip={'x':330,'y':170,'width':300,'height':300},timeout=120000)
    # el equipo manda: con armadura equipada (look.ar) sin prenda de torso
    r=await pg.evaluate('(()=>{const a=R3D.outfits.resolve({app:{outfit:"errante"},ar:"#8a8a90"}).outfit,b=R3D.outfits.resolve({app:{outfit:"errante"}}).outfit;return [a.top||null,b.top||null]})()')
    print('top con armadura / sin armadura:',r);ok=ok and r[0] is None and r[1]=='gambeson'
    print('errores:',errs or 'ninguno');ok=ok and not errs;print('RESULTADO: OK' if ok else 'RESULTADO: FALLO');await b.close()
asyncio.run(main())
