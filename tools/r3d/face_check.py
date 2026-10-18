# NotScape · R3D · captura de la CARA y del cuerpo del héroe con HeroPreview (sin mundo). Uso (servidor en :8811):
#   python3 -I tools/r3d/face_check.py <salida.png> [outfit=errante] [dirs=2,3,4] [extra_query]
# Hace una hoja: fila 1 = cara de cerca (focus:'face') en las direcciones pedidas; fila 2 = cuerpo entero.
import asyncio,sys
from playwright.async_api import async_playwright
OUT=sys.argv[1];OF=sys.argv[2] if len(sys.argv)>2 else 'errante';DIRS=[int(x) for x in (sys.argv[3] if len(sys.argv)>3 else '2,3,4').split(',')];EXTRA=sys.argv[4] if len(sys.argv)>4 else '';ZOOM=float(sys.argv[5]) if len(sys.argv)>5 else .2;CY=float(sys.argv[6]) if len(sys.argv)>6 else 1.07;OIL=sys.argv[7] if len(sys.argv)>7 else '';JS=sys.argv[8] if len(sys.argv)>8 else ''
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':1000,'height':680});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_' not in m.text else None)
    await pg.goto('http://127.0.0.1:8811/index.html?r3d=1&noedit'+EXTRA,wait_until='commit')
    await pg.wait_for_function('window.R3D&&window.R3D.preview&&typeof S!=="undefined"',timeout=90000);await pg.wait_for_timeout(1500)
    await pg.evaluate('''([of,dirs,ZOOM,CY])=>{const old=document.getElementById('r3d');document.getElementById('cw').style.visibility='hidden';
      const box=document.createElement('div');box.id='fc';box.style.cssText='position:fixed;inset:0;z-index:999;background:#3a3834;display:flex;flex-wrap:wrap;gap:4px;padding:4px';document.body.appendChild(box);
      window.__pv=[];dirs.forEach((d,i)=>[true,false].forEach(face=>{const c=document.createElement('canvas');c.width=face?320:320;c.height=face?320:340;c.style.cssText='width:320px;height:'+(face?320:340)+'px;background:#4a4a42';box.appendChild(c);
        const pv=R3D.preview(c);window.__pv.push({pv,d,face,c})}));
      const OF=R3D.outfits,oc=OF.of(of);window.__look=OF.resolve({app:Object.assign({g:'m',hair:'cut',hc:'#5a3a22',skin:'#e0b48a',col:'#8a3a34',eye:'#2a1a14',face:0},S.app||{}),gear:oc.look.gear,outfit:of});
      window.__zoom=ZOOM;window.__cy=CY;window.__go=()=>{window.__pv.forEach(o=>o.pv.draw(Object.assign({},window.__look),{dir:o.d,mode:'idle',t:1.3,focus:o.face?'face':null,zoom:window.__zoom,cy:window.__cy}));requestAnimationFrame(window.__go)};window.__go()}''',[OF,DIRS,ZOOM,CY])
    if JS:await pg.evaluate(JS)
    if OIL!='':await pg.evaluate(f'R3D.oil={OIL}')
    await pg.wait_for_timeout(5000)
    await pg.screenshot(path=OUT,timeout=180000)
    print('errores:',errs or 'ninguno');print('RESULTADO: OK' if not errs else 'RESULTADO: FALLO');await b.close()
asyncio.run(main())
