# NotScape · R3D · F3f-P3A · comparación de las SOMBRAS DE CONTACTO: captura el juego (?r3d=1) en un punto, hora dada, con R3D.contact = 0 / 1 / 1.5 y devuelve el nº de blobs.
# Uso (raíz del repo, con `python3 -m http.server 8811 &`):  python3 -I tools/r3d/contact_check.py <prefijo_png> <hora: dia|atardecer|noche> <x> <y> [K_oleo=70]
# Guarda <prefijo>_c0.png, _c1.png, _c15.png y un montaje <prefijo>_cmp.png (recorte central ×2). Imprime estadísticas y RESULTADO.
import asyncio,sys
from playwright.async_api import async_playwright
PRE,T,X,Y=sys.argv[1],sys.argv[2],float(sys.argv[3]),float(sys.argv[4]);K=int(sys.argv[5]) if len(sys.argv)>5 else 70
SUN={'dia':61,'atardecer':145,'noche':241}
INIT="const raf=window.requestAnimationFrame.bind(window);window.__fix=null;window.__t0=0;window.requestAnimationFrame=cb=>raf(ts=>cb(window.__fix===null?ts:window.__fix+(ts-window.__t0)*.002));"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':960,'height':600});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)[:300]));pg.on('console',lambda m:errs.append(m.text[:300]) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_TUNNEL' not in m.text else None)
    await pg.add_init_script(INIT);await pg.goto('http://127.0.0.1:8811/index.html?r3d=1&noedit',wait_until='commit')
    await pg.wait_for_function('window.R3D&&typeof sunS==="function"&&typeof S!=="undefined"',timeout=90000);await pg.wait_for_timeout(3000)
    await pg.evaluate(f'(()=>{{P.x={X};P.y={Y};ISO.snap(P.x,P.y,TER.standZ(P.x,P.y));window.__t0=performance.now();window.__fix={SUN[T]}*1000;R3D.oil={K/100};R3D.parts.snap()}})()')
    await pg.wait_for_timeout(5000)
    for k,n in ((0,'c0'),(1,'c1'),(1.5,'c15')):
      await pg.evaluate(f'R3D.contact={k}');await pg.wait_for_timeout(2500);await pg.screenshot(path=f'{PRE}_{n}.png',timeout=180000)
    print('stats blobs:',await pg.evaluate('R3D.dbg.cts.stats'),'| instancias dibujadas:',await pg.evaluate('R3D.dbg.cts.mesh.count'))
    print('errores:',errs or 'ninguno');print('RESULTADO: OK' if not errs else 'RESULTADO: FALLO');await b.close()
  from PIL import Image
  ims=[Image.open(f'{PRE}_{n}.png').crop((280,120,680,420)).resize((640,480)) for n in ('c0','c1','c15')]
  m=Image.new('RGB',(1920,480));[m.paste(im,(i*640,0)) for i,im in enumerate(ims)];m.save(f'{PRE}_cmp.png')
asyncio.run(main())
