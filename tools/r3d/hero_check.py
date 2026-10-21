# NotScape · R3D · Lote R3D-HEROE-NR · comprobación VISUAL del héroe 3D (Chromium sin pantalla, SwiftShader).
# Uso (raíz del repo, con `python3 -m http.server 8811 &`):  python3 -I tools/r3d/hero_check.py <carpeta_salida> [prefijo] [horas=dia,noche]
# Guarda, por hora: <prefijo>_mundo_<hora>.png (pantalla entera) y <prefijo>_cerca_<hora>.png (recorte de 200×200 alrededor del héroe ampliado ×3,
# sin suavizado, para juzgar si se lee la CARA a tamaño de juego). Además <prefijo>_creador.png: la pantalla de creación (primer inicio, SIN ?noedit)
# y comprueba que con ?r3d=1 el editor muestra la vista previa 3D (#ce-cv3) y NO el héroe 2D (#ce-cv). Imprime errores y RESULTADO: OK/FALLO.
import asyncio,sys,os
from playwright.async_api import async_playwright
OUT=sys.argv[1] if len(sys.argv)>1 else 'capturas_heroe';PRE=sys.argv[2] if len(sys.argv)>2 else 'h';HRS=(sys.argv[3] if len(sys.argv)>3 else 'dia,noche').split(',')
os.makedirs(OUT,exist_ok=True)
SUN={'dia':61,'atardecer':145,'noche':241}
INIT="const raf=window.requestAnimationFrame.bind(window);window.__fix=null;window.__t0=0;window.requestAnimationFrame=cb=>raf(ts=>cb(window.__fix===null?ts:window.__fix+(ts-window.__t0)*.002));"
ARGS=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
def bad(m):return m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_TUNNEL' not in m.text and 'fonts.g' not in m.text
async def main():
  ok=True
  async with async_playwright() as p:
    b=await p.chromium.launch(args=ARGS)
    # 1) mundo
    pg=await b.new_page(viewport={'width':960,'height':600});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if bad(m) else None)
    await pg.add_init_script(INIT);await pg.goto('http://127.0.0.1:8811/index.html?r3d=1&noedit',wait_until='commit')
    await pg.wait_for_function('window.R3D&&typeof sunS==="function"&&typeof S!=="undefined"',timeout=120000);await pg.wait_for_timeout(2500)
    await pg.evaluate('S.app=Object.assign({name:"Probador",g:"m",hair:"cut",hc:"#5a3a22",skin:"#f0c08a",col:"#c0392b",eye:"#3a2620",face:0,outfit:"errante"},S.app||{})')
    for h in HRS:
      await pg.evaluate(f'(()=>{{window.__t0=performance.now();window.__fix={SUN[h]}*1000;R3D.parts.snap()}})()');await pg.wait_for_timeout(4000)
      await pg.screenshot(path=f'{OUT}/{PRE}_mundo_{h}.png',timeout=180000)
      c=await pg.evaluate('(()=>{const q=ISO.toCanvas(P.x,P.y,TER.standZ(P.x,P.y)),d=ISO.V.dpr;return {x:q.x/d,y:q.y/d}})()')
      x=max(0,c['x']-100);y=max(0,c['y']-150)
      await pg.screenshot(path=f'{OUT}/_tmp.png',clip={'x':x,'y':y,'width':200,'height':200},timeout=180000)
      try:
        from PIL import Image
        im=Image.open(f'{OUT}/_tmp.png');im.resize((600,600),Image.NEAREST).save(f'{OUT}/{PRE}_cerca_{h}.png');os.remove(f'{OUT}/_tmp.png')
      except Exception as e:os.replace(f'{OUT}/_tmp.png',f'{OUT}/{PRE}_cerca_{h}.png')
    print('mundo · errores:',errs or 'ninguno');ok=ok and not errs;await pg.close()
    # 2) creador (primer inicio)
    pg=await b.new_page(viewport={'width':960,'height':640});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if bad(m) else None)
    await pg.goto('http://127.0.0.1:8811/index.html?r3d=1',wait_until='commit')
    await pg.wait_for_function('window.R3D&&document.getElementById("ce")&&!document.getElementById("ce").hidden',timeout=120000);await pg.wait_for_timeout(3500)
    st=await pg.evaluate('({cv2:!document.getElementById("ce-cv").hidden,cv3:!document.getElementById("ce-cv3").hidden})')
    print('creador:',st);ok=ok and st['cv3'] and not st['cv2']
    await pg.screenshot(path=f'{OUT}/{PRE}_creador.png',timeout=180000)
    print('creador · errores:',errs or 'ninguno');ok=ok and not errs
    await b.close()
  print('RESULTADO: OK' if ok else 'RESULTADO: FALLO')
asyncio.run(main())
