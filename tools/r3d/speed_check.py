# NotScape · F4 · comprobación de la VELOCIDAD de movimiento (andar / correr) en el juego real (?r3d=1, Chromium sin pantalla).
# Uso (raíz del repo, con `python3 -m http.server 8811 &`):  python3 -I tools/r3d/speed_check.py
# Qué hace: simula 1 s de juego (60 llamadas a upd(1/60)) con la tecla pulsada y mide los px de mundo recorridos, andando y corriendo;
#   exige andar ≈ WALK_V y correr ≈ WALK_V·RUN_MUL (±6 %), cociente correr/andar entre 1,7 y 2,1, y que NO se cruce el borde del mundo
#   empujando 4 s contra cada lado con dt grande (0,1 s, el máximo del juego) y con el buff de velocidad activo. Termina en RESULTADO: OK/FALLO.
# Los fps de SwiftShader no importan: el bucle se ejecuta de forma síncrona, sin rAF por medio.
import asyncio,sys,json
from playwright.async_api import async_playwright
JS="""()=>{
 const out={};const now0=performance.now();
 const place=()=>{const q=spawnOf(curB);P.x=q.x;P.y=q.y;P.g=P.mv=null;A=null;CK=null;return q};
 const meas=(run,dirKeys,secs=1,dt=1/60)=>{place();RUN=run;K.l=K.r=K.u=K.d=0;dirKeys.forEach(k=>K[k]=1);const x0=P.x,y0=P.y,n=Math.round(secs/dt);let t=now0;
  for(let i=0;i<n;i++){t+=dt*1000;upd(dt,t)}K.l=K.r=K.u=K.d=0;return Math.hypot(P.x-x0,P.y-y0)/secs};
 // buscar la dirección con más recorrido libre (el spawn puede tener un obstáculo cerca)
 const dirs=[['r'],['l'],['u'],['d']];let best=null,bw=0;for(const d of dirs){const v=meas(0,d,.5);if(v>bw){bw=v;best=d}}
 out.dir=best;out.walk=meas(0,best,1);out.run=meas(1,best,1);
 out.walkV=WALK_V;out.runMul=RUN_MUL;
 // borde del mundo: empujar 4 s contra cada lado con dt=.1 y buff de velocidad
 const T=ISO.TILE;let bad=[];S.buf.spd=Date.now()+60000;
 for(const d of dirs){for(const dt of[.1,1/60]){place();RUN=1;K.l=K.r=K.u=K.d=0;d.forEach(k=>K[k]=1);let t=now0;for(let i=0;i<Math.round(4/dt);i++){t+=dt*1000;upd(dt,t)}K.l=K.r=K.u=K.d=0;
   if(!(P.x>=T&&P.y>=T&&P.x<=TER.NX*T&&P.y<=WH)||!isFinite(P.x+P.y))bad.push([d.join(''),dt,P.x|0,P.y|0])}}
 // empujar en diagonal de pantalla hacia las 4 esquinas del plano (2 teclas)
 for(const d of[['r','d'],['l','u'],['r','u'],['l','d']]){place();RUN=1;K.l=K.r=K.u=K.d=0;d.forEach(k=>K[k]=1);let t=now0;for(let i=0;i<80;i++){t+=100;upd(.1,t)}K.l=K.r=K.u=K.d=0;
   if(!(P.x>=T&&P.y>=T&&P.x<=TER.NX*T&&P.y<=WH)||!isFinite(P.x+P.y))bad.push([d.join(''),.1,P.x|0,P.y|0])}
 S.buf.spd=0;RUN=0;place();out.bad=bad;return out}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':960,'height':600});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_TUNNEL' not in m.text else None)
    await pg.goto('http://127.0.0.1:8811/index.html?r3d=1&noedit',wait_until='commit')
    await pg.wait_for_function('window.R3D&&typeof sunS==="function"&&typeof S!=="undefined"&&typeof upd==="function"',timeout=90000);await pg.wait_for_timeout(4000)
    r=await pg.evaluate(JS);print(json.dumps(r,ensure_ascii=False))
    ok=True;w=r['walk'];ru=r['run'];tw=r['walkV'];tr=tw*r['runMul']
    def chk(n,c):
      nonlocal ok;print(('OK   ' if c else 'FALLO'),n);ok=ok and c
    chk(f'andar {w:.1f} px/s ≈ {tw}',abs(w-tw)<=tw*.06);chk(f'correr {ru:.1f} px/s ≈ {tr:.1f}',abs(ru-tr)<=tr*.06);chk(f'cociente correr/andar {ru/max(w,1e-6):.2f} en [1,7 ; 2,1]',1.7<=ru/max(w,1e-6)<=2.1)
    chk('borde del mundo no cruzado '+str(r['bad']),not r['bad']);chk('sin errores de consola '+str(errs[:3]),not errs)
    await b.close();print('RESULTADO: OK' if ok else 'RESULTADO: FALLO')
asyncio.run(main())
