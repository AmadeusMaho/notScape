# NotScape · R3D · VERIFICACIÓN DE CERCA de un modelo (regla del dueño, 18 oct 2026: «luego de modelar algo siempre compruébalo»). Server del repo en 8811.
# Uso:  python3 -I tools/r3d/actor_close.py <id> [<id>…] [--az=60] [--out=/ruta/carpeta]   → guarda <out>/close_<id>.png (recorte ampliado, listo para mirar) e imprime RESULTADO.
# Renderiza cada criatura/PNJ sola en el visor a 3200×2400 y recorta alrededor. Mirar SIEMPRE: proporciones (largo/ancho/altura), manchas, cuernos, patas, que se lea la especie.
import asyncio,sys,os
from playwright.async_api import async_playwright
from PIL import Image
import numpy as np
ids=[a for a in sys.argv[1:] if not a.startswith('--')];az=next((a.split('=')[1] for a in sys.argv if a.startswith('--az=')),'60');out=next((a.split('=')[1] for a in sys.argv if a.startswith('--out=')),'.');os.makedirs(out,exist_ok=True)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']);ok=True
    for i in ids:
      pg=await b.new_page(viewport={'width':3200,'height':2400});errs=[]
      pg.on('pageerror',lambda e:errs.append(str(e)))
      await pg.goto(f'http://127.0.0.1:8811/docs/style-reference/r3d/actores-3d.html?still&state=idle&t=1.2&az={az}&ids={i}&cols=1',wait_until='commit');await pg.wait_for_timeout(6000)
      f=os.path.join(out,f'full_{i}.png');await pg.screenshot(path=f);await pg.close()
      im=Image.open(f).convert('RGB');a=np.asarray(im).astype(int);d=(abs(a-a[300,5]).sum(2)>40);d[:60,:]=False;ys,xs=np.where(d)
      if not len(xs):print(i,'VACÍO');ok=False;continue
      im.crop((max(0,xs.min()-40),max(0,ys.min()-40),xs.max()+40,ys.max()+40)).save(os.path.join(out,f'close_{i}.png'));os.remove(f);print(i,'→',os.path.join(out,f'close_{i}.png'),'errores:',errs or 'ninguno');ok=ok and not errs
    print('RESULTADO: OK' if ok else 'RESULTADO: FALLO');await b.close()
asyncio.run(main())
