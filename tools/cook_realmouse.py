# NotScape · COCINA · prueba con RATÓN REAL y «jugador humano» simulado (27 oct 2026).
# Lanza un Chromium con la GPU real, abre la cocina y juega los minijuegos de preparación con page.mouse (eventos de puntero de verdad, con captura de puntero)
# con ruido humano: reacción gaussiana, temblor de mano y velocidades típicas. Imprime la puntuación media y la tasa de «perfectos» por minijuego para AFINAR la dificultad
# (objetivo: un jugador normal saca 2–3 estrellas y ~30–50 % de perfectos; un tosco aún completa el minijuego).
# Uso (raíz del repo; necesita el servidor del juego en 8811, p. ej. `python tools/fast/ns.py start --gpu --no3d`):  python tools/cook_realmouse.py [intentos=4] [reaccion_ms=330] [temblor_px=8]
import asyncio,random,math,sys,json
from playwright.async_api import async_playwright
N=int(sys.argv[1]) if len(sys.argv)>1 else 4;RX=float(sys.argv[2])/1000 if len(sys.argv)>2 else .33;JIT=float(sys.argv[3]) if len(sys.argv)>3 else 8
URL='http://127.0.0.1:8811/index.html?r3d=1&test=1&noedit&no3d=1'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(headless=False,args=['--ignore-gpu-blocklist']);ctx=await b.new_context(viewport={'width':1500,'height':860});pg=await ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto(URL,wait_until='commit');await pg.wait_for_function('window.__nstestReady===true',timeout=300000);await pg.wait_for_timeout(2500)
    async def ev(js):return await pg.evaluate(js)
    async def rect():return await ev("(()=>{const r=document.querySelector('#alq canvas').getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()")
    R=[0,0,1,1]
    def X(x):return R[0]+x/800*R[2]
    def Y(y):return R[1]+y/460*R[3]
    async def setup():
      await ev("(()=>{S.xp.co=3000;ISLA.lock=()=>false;['trucha','h_manzanilla','carne_jab'].forEach(i=>CHEAT.give(i,3));COC.close();COC.open({x:P.x,y:P.y,id:'cocina',n:'C'});const q=s=>document.querySelector(s);['trucha','h_manzanilla','carne_jab'].forEach(id=>q('[data-add='+id+']').click());COC.stationClick('g')})()")
      nonlocal R;await pg.wait_for_timeout(300);R=await rect()
    async def wait(js,t=20):
      for _ in range(int(t*50)):
        if await ev(js):return True
        await pg.wait_for_timeout(20)
      return False
    res={'cut':[],'chop':[],'fish_scale':[],'fish':[]}
    for trial in range(N):
      await setup()
      for _ in range(3):
        if not await wait("COC.G.stage!=='prep'||(COC.G.mg&&!COC.G.mg.done&&COC.G.cam.arr)",20):break
        k=await ev("COC.G.stage==='prep'&&COC.G.mg?COC.G.mg.kind:null")
        if not k:break
        if k=='cut':
          while not await ev("!COC.G.mg||COC.G.mg.done"):
            mk=await ev("(()=>{const m=COC.G.mg;return m&&m.marks[m.kn]})()")
            if not mk:break
            ang=random.uniform(-math.pi,math.pi);dx,dy=math.cos(ang),math.sin(ang);off=random.gauss(0,JIT*1.2);ox,oy=-dy*off,dx*off   # tajo en una dirección cualquiera, algo desviado
            sx,sy=mk['x']+ox-dx*70,mk['y']+oy-dy*70;await pg.mouse.move(X(sx),Y(sy));await asyncio.sleep(max(.1,random.gauss(RX*.6,.06)));await pg.mouse.down()
            for i in range(1,11):await pg.mouse.move(X(sx+dx*14*i),Y(sy+dy*14*i));await asyncio.sleep(.008)
            await pg.mouse.up();await pg.wait_for_timeout(80)
          sc=await ev("COC.G.mg?COC.G.mg.sc:COC.G.pr[COC.G.pr.length-1]");res['cut'].append(sc)
        elif k=='chop':
          seen=-1
          while not await ev("!COC.G.mg||COC.G.mg.done"):
            s=await ev("(()=>{const m=COC.G.mg;return m&&{n:m.n,tm:m.tm,mk:m.marks[m.n]}})()")
            if not s or s['mk'] is None:break
            if s['n']!=seen and s['tm']<.15:
              seen=s['n'];await asyncio.sleep(max(.12,random.gauss(RX,.07)));mk=s['mk'];yy=mk['y']+random.gauss(0,14)
              await pg.mouse.move(X(mk['x']-70),Y(yy));await pg.mouse.down()
              for i in range(1,8):await pg.mouse.move(X(mk['x']-70+i*20),Y(yy+random.gauss(0,JIT*.3)));await asyncio.sleep(.008)
              await pg.mouse.up()
            await pg.wait_for_timeout(10)
          res['chop'].append(await ev("COC.G.mg?COC.G.mg.sc:[0]"))
        else:
          await pg.mouse.move(X(300),Y(250));await pg.mouse.down()
          for i in range(90):
            if await ev("COC.G.mg.st")==1:break
            await pg.mouse.move(X(290+(i%2)*220+random.gauss(0,5)),Y(230+random.gauss(0,18)),steps=3)
          await pg.mouse.up();res['fish_scale'].append(await ev("COC.G.mg.st"))
          path=lambda u:(285+u*230,253+math.sin(u*math.pi*2.4)*16)
          x0,y0=path(0);await pg.mouse.move(X(x0),Y(y0));await pg.mouse.down();u=0
          while u<1.03 and not await ev("COC.G.mg.done"):
            u+=.012;x,y=path(u);await pg.mouse.move(X(x+random.gauss(0,JIT*.6)),Y(y+random.gauss(0,JIT)),steps=2);await asyncio.sleep(.012)
          await pg.mouse.up();res['fish'].append(await ev("COC.G.mg.sc||COC.G.pr[COC.G.pr.length-1]"))
    # ── fogón con ratón real: lanzar ingredientes, girar el mando de fuego y remover en círculos ──
    await ev("(()=>{S.xp.co=3000;ISLA.lock=()=>false;['arroz','grasa'].forEach(i=>CHEAT.give(i,3));COC.close();COC.open({x:P.x,y:P.y,id:'cocina',n:'C'});const q=s=>document.querySelector(s);['arroz','grasa'].forEach(id=>q('[data-add='+id+']').click());COC.stationClick('g')})()")
    await wait("COC.G.stage==='cook'&&COC.G.cam.arr",20);R=await rect()
    pos=await ev("COC.G.chunks.map(c=>[c.x,c.y])")
    for x,y in pos:
      await pg.mouse.move(X(x),Y(y));await pg.mouse.down();await pg.mouse.up();await pg.wait_for_timeout(700)
    await wait("COC.G.kk.puchero.all",5);F0=await ev("COC.G.kk.puchero.F")
    await pg.mouse.move(X(704),Y(372));await pg.mouse.down()
    for i in range(1,13):await pg.mouse.move(X(704),Y(372-i*7),steps=2)
    await pg.mouse.up();F1=await ev("COC.G.kk.puchero.F")
    for rep in range(10):
      await pg.mouse.move(X(430+95),Y(270));await pg.mouse.down()
      for a in range(0,360,24):await pg.mouse.move(X(430+95*math.cos(math.radians(a))),Y(270+75*math.sin(math.radians(a))));await asyncio.sleep(.012)
      await pg.mouse.up()
    sv=await ev("COC.G.kk.puchero.stirV");stk=await ev("COC.G.kk.puchero.stk")
    print('fogón con ratón real: fuego',round(F0,2),'->',round(F1,2),'· velocidad de remover',round(sv,2),'· pegado',round(stk,2))
    def stat(xs):
      v=[(x[0] if isinstance(x,list) and x else x) for x in xs];v=[a for a in v if isinstance(a,(int,float))]
      return (sum(v)/len(v) if v else None,len(v))
    out={}
    for k,v in res.items():
      flat=[a for x in v for a in (x if isinstance(x,list) else [x]) if isinstance(a,(int,float))]
      out[k]={'n':len(flat),'media':round(sum(flat)/len(flat),2) if flat else None,'perfectos':round(sum(1 for a in flat if a>.85)/len(flat),2) if flat else None}
    print(json.dumps(out,ensure_ascii=False));print('detalle',json.dumps({k:[[round(a,2) for a in (x if isinstance(x,list) else [x]) if isinstance(a,(int,float))] for x in v] for k,v in res.items()}));print('errores de página:',errs or 'ninguno')
    await b.close()
asyncio.run(main())
