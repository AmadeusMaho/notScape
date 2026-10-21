# gear_shot: como hero_shot.py/shot_at.py pero con EQUIPO puesto: env GS_EQ='{"a":"ar_adam","w":"sw_adam",...}' (ids de S.eq). Para ver armaduras/armas por cultura EN EL JUEGO.
# (variante hero_shot: dpr y recorte alrededor del héroe vía env HS_DPR, HS_CLIP='x,y,w,h')
# NotScape · R3D · captura del JUEGO (?r3d=1) en un punto del mundo y a una hora dada (Chromium sin pantalla, SwiftShader).
# Uso (raíz del repo, con `python3 -m http.server 8811 &`):  python3 -I tools/r3d/shot_at.py <salida.png> <hora: dia|atardecer|noche> <x> <y> [K_oleo=70] [clima=''|rain|storm] [extra_query]
# Teletransporta a P (x,y en px de mundo) y congela el tiempo del juego como oleo_check.py. Imprime errores de página y RESULTADO.
import asyncio,sys,os
from playwright.async_api import async_playwright
OUT,T,X,Y=sys.argv[1],sys.argv[2],float(sys.argv[3]),float(sys.argv[4]);K=int(sys.argv[5]) if len(sys.argv)>5 else 70;WX=sys.argv[6] if len(sys.argv)>6 else '';EXTRA=sys.argv[7] if len(sys.argv)>7 else ''
SUN={'dia':61,'atardecer':145,'noche':241}
INIT="const raf=window.requestAnimationFrame.bind(window);window.__fix=null;window.__t0=0;window.requestAnimationFrame=cb=>raf(ts=>cb(window.__fix===null?ts:window.__fix+(ts-window.__t0)*.002));"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':960,'height':600},device_scale_factor=float(os.environ.get('HS_DPR','1')));errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_TUNNEL' not in m.text else None)
    await pg.add_init_script(INIT);await pg.goto('http://127.0.0.1:8811/index.html?r3d=1&noedit'+EXTRA,wait_until='commit')
    await pg.wait_for_function('window.R3D&&typeof sunS==="function"&&typeof S!=="undefined"',timeout=90000);await pg.wait_for_timeout(3000)
    await pg.evaluate(f'''(()=>{{P.x={X};P.y={Y};ISO.snap(P.x,P.y,TER.standZ(P.x,P.y));window.__t0=performance.now();window.__fix={SUN[T]}*1000;R3D.oil={K/100};Object.assign(S.eq,JSON.parse(`{os.environ.get('GS_EQ','{}')}`));R3D.parts.snap();
      {"WX.t='"+WX+"';WX.end=performance.now()+9e6;WXD="+("0.36" if WX=="storm" else "0.18")+";" if WX else ""}}})()''')
    await pg.wait_for_timeout(2500);await pg.evaluate('R3D.parts.snap()');await pg.wait_for_timeout(6000);clip=os.environ.get('HS_CLIP');kw={}
    if clip:x,y,w,h=[float(v) for v in clip.split(',')];kw['clip']={'x':x,'y':y,'width':w,'height':h}
    await pg.screenshot(path=OUT,timeout=180000,**kw)
    print('errores:',errs or 'ninguno');print('RESULTADO: OK' if not errs else 'RESULTADO: FALLO');await b.close()
asyncio.run(main())
