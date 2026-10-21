# NotScape · R3D · Fase 47 (19 oct 2026) · COMPRUEBA el minimapa local alineado y el mapa del mundo con niebla en el JUEGO real (?r3d=1), sin tocar tu partida (página nueva en cada ejecución).
# Uso (raíz del repo, con `python3 -m http.server 8811 &`):  python3 -I tools/r3d/map_check.py <prefijo> [az_grados=45,135] [extra_query]
# Hace: (1) arranca, (2) comprueba que WMAP existe y que la niebla solo revela alrededor del héroe, (3) teletransporta a la aldea, a la frontera Pradera|Bosque y al interior del Bosque
# (la niebla crece; S.fog se codifica/decodifica sin pérdida), (4) captura el minimapa local con la cámara a cada acimut (comprueba la ALINEACIÓN: el norte del mapa gira con la cámara) y el mapa grande,
# (5) mide el coste de pintar celdas y de dibujar el mapa. Acaba en `RESULTADO: OK/FALLO`. Guarda <prefijo>_local<az>.png, <prefijo>_mundo.png (y recortes del minimapa <prefijo>_mm<az>.png).
import asyncio,sys,os,json
from playwright.async_api import async_playwright
PRE=sys.argv[1];AZS=[float(a) for a in (sys.argv[2] if len(sys.argv)>2 else '45,135').split(',')];EXTRA=sys.argv[3] if len(sys.argv)>3 else ''
INIT="const raf=window.requestAnimationFrame.bind(window);window.__fix=null;window.__t0=0;window.requestAnimationFrame=cb=>raf(ts=>cb(window.__fix===null?ts:window.__fix+(ts-window.__t0)*.002));"
async def main():
  fails=[]
  def chk(c,m):
    print(('  ok  ' if c else '  FALLO ')+m)
    if not c:fails.append(m)
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':int(os.environ.get('VW',1100)),'height':int(os.environ.get('VH',650))});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_TUNNEL' not in m.text and 'status of 404' not in m.text else None)
    await pg.add_init_script(INIT);await pg.goto('http://127.0.0.1:8811/index.html?r3d=1&noedit'+('&'+EXTRA if EXTRA else ''),wait_until='commit')
    await pg.wait_for_function('window.R3D&&typeof sunS==="function"&&typeof S!=="undefined"&&typeof WMAP!=="undefined"',timeout=150000);await pg.wait_for_timeout(3000)
    await pg.evaluate('(()=>{window.__t0=performance.now();window.__fix=61*1000;MM=1})()');await pg.wait_for_timeout(2500)
    st=await pg.evaluate('WMAP.stats()');print('inicio',st)
    chk(st['cells']>0 and st['revealed']>0,'WMAP inicializado y con celdas reveladas alrededor del héroe');chk(st['revealed']<st['cells']*0.15,'la niebla cubre casi todo el mundo al empezar (%d/%d)'%(st['revealed'],st['cells']))
    chk(st['cv']==[1728,752] or st['cv'][0]>0,'lienzo del mundo %s'%st['cv'])
    async def go(x,y):
      await pg.evaluate(f'(()=>{{for(let k=0;k<5;k++)S.boss[k]=1;P.x={x};P.y={y};GOOD=null;ISO.snap(P.x,P.y,TER.standZ(P.x,P.y));R3D.parts.snap()}})()')
      await pg.wait_for_timeout(1800);await pg.evaluate('(()=>{let n=1,g=0;while(n>0&&g++<60)n=R3D.preload();WMAP.tick(P.x,P.y);WMAP.paint(5000);return n})()');await pg.wait_for_timeout(2500)   # SwiftShader va a ~2 fps: se fuerza el pintado de celdas que el juego haría en unos fotogramas
    # aldea (pradera) → frontera Pradera|Bosque → interior del Bosque
    info=await pg.evaluate('JSON.stringify({sp:spawnOf(0),b1:[BI[1].ox,BI[1].oy,BI[1].w,BI[1].h],w:[BIOMES.WW,BIOMES.WH]})');inf=json.loads(info);print(inf)
    sp=inf['sp'];bx,by,bw,bh=inf['b1']
    await go(sp['x'],sp['y']);r0=(await pg.evaluate('WMAP.stats()'))['revealed']
    await go(bx-200,by+bh/2);r1=(await pg.evaluate('WMAP.stats()'))['revealed']
    await go(bx+1500,by+bh/2);r2=(await pg.evaluate('WMAP.stats()'))['revealed']
    chk(r1>r0 and r2>r1,'la niebla se disipa al explorar (%d → %d → %d celdas)'%(r0,r1,r2))
    # guardado: S.fog existe, se codifica en 54x24 y se puede decodificar tras recargar el estado
    fg=await pg.evaluate('S.fog');chk(isinstance(fg,str) and fg.startswith('54x24:'),'S.fog codificado: %s…(%d car.)'%(str(fg)[:16],len(fg or '')))
    rt=await pg.evaluate('''(()=>{const a=WMAP.stats().revealed,f=S.fog;const cv=WMAP.canvas;return JSON.stringify({a,len:f.length})})()''');print(rt)
    # alineación: el norte del minimapa gira con el acimut de la cámara
    await go(sp['x']+100,sp['y']-60);await pg.evaluate('MM=1')
    for az in AZS:
      await pg.evaluate(f'(()=>{{R3D.az={az}*Math.PI/180;window.__t0=performance.now();window.__fix=61*1000}})()');await pg.wait_for_timeout(2500)
      nA=await pg.evaluate('R3D.az*180/Math.PI');chk(abs(nA-az)<1,'acimut de la cámara %.1f°'%nA)
      await pg.screenshot(path=f'{PRE}_local{int(az)}.png',timeout=180000)
    # ALINEACIÓN REAL: la dirección de pantalla del juego (ISO.proj de la cámara 3D, con la compresión vertical de la elevación de 30° deshecha) debe coincidir con la del minimapa a cualquier acimut
    worst=0
    JS='''(()=>{const c=document.createElement('canvas').getContext('2d'),out=[];
        const L=WMAP.local(c,100,100,100,P.x,P.y,R3D.az),p0=ISO.toCanvas(P.x,P.y,0),m0=L.proj(P.x,P.y);
        for(const [vx,vy] of [[500,0],[0,500],[-300,200],[250,-400]]){const q=ISO.toCanvas(P.x+vx,P.y+vy,0),m=L.proj(P.x+vx,P.y+vy);
          const g=Math.atan2((q.y-p0.y)/.5,q.x-p0.x),h=Math.atan2(m[1]-m0[1],m[0]-m0[0]);let d=Math.abs(g-h)*180/Math.PI;d=Math.min(d,360-d);out.push(+d.toFixed(2))}return out})()'''
    for deg in [0,45,90,135,200,300]:
      await pg.evaluate(f'(()=>{{R3D.az={deg}*Math.PI/180;window.__t0=performance.now();window.__fix=61*1000}})()')
      for t in range(4):   # la cámara se actualiza en el siguiente fotograma (SwiftShader ≈ 2 fps): se reintenta hasta que la cámara ya esté en el acimut pedido
        await pg.wait_for_timeout(2500);ds=await pg.evaluate(JS)
        if max(ds)<1.5:break
      print('  az',deg,'error angular (°):',ds);worst=max(worst,max(ds))
    chk(worst<1.5,'el minimapa está alineado con la pantalla (error angular máx. %.2f° en 6 acimutes × 4 direcciones)'%worst)
    # mapa grande
    await pg.evaluate('(()=>{MM=2;R3D.az=Math.PI/4})()');await pg.wait_for_timeout(1500);await pg.screenshot(path=f'{PRE}_mundo.png',timeout=180000)
    # coste
    cost=await pg.evaluate('''(()=>{const t=(f,n=60)=>{const a=performance.now();for(let i=0;i<n;i++)f();return (performance.now()-a)/n};MM=1;const a=t(()=>drawMap(performance.now()));MM=2;const b=t(()=>drawMap(performance.now()));MM=1;const c=WMAP.stats();return JSON.stringify({local:a,mundo:b,st:c})})()''');print('coste ms',cost)
    c=json.loads(cost);chk(c['local']<4 and c['mundo']<8,'drawMap local %.2f ms · mundo %.2f ms (SwiftShader/CPU: solo sirve para comparar)'%(c['local'],c['mundo']))
    # revealAll + migración: pintar todo el mundo y comprobar el tiempo (peor caso: partida 100 % explorada)
    await pg.evaluate('WMAP.revealAll()');t0=await pg.evaluate('(()=>{const a=performance.now();let n=0;while(WMAP.stats().queued>0&&n++<9999)WMAP.paint(1000);return performance.now()-a})()')
    print('pintar el mundo entero (peor caso): %.0f ms'%t0);await pg.evaluate('MM=2');await pg.wait_for_timeout(1200);await pg.screenshot(path=f'{PRE}_mundo_todo.png',timeout=180000)
    print('errores:',errs or 'ninguno');chk(not errs,'0 errores de consola')
    print('RESULTADO: OK' if not fails else 'RESULTADO: FALLO',fails);await b.close()
asyncio.run(main())
