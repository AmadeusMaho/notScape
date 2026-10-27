# NotScape · COCINA · SARTÉN, PARRILLA y HORNO con RATÓN REAL y «jugador humano» simulado (27 oct 2026).
# Chromium con la GPU real + page.mouse (eventos de puntero de verdad). El «humano» MIRA el color de la pieza (lee su punto con ruido de
# percepción) y reacciona tarde (reacción gaussiana) y con temblor; mide nota de cocción, tiempo y si algo se quemó, para afinar la dificultad.
# Ingredientes sin preparación (huevo, arroz, grasa) para no pasar por la Mesa. Objetivo: humano normal 2–3 estrellas (cocción .66–.9).
# Uso (raíz del repo; servidor en 8811, p. ej. `python tools/fast/ns.py start --gpu`):
#   python tools/cook_stations_realmouse.py [intentos=3] [reaccion_ms=330] [temblor_px=8] [estaciones=s,p,h] [ruido_vista=.08]
import asyncio,random,math,sys,json,time
from playwright.async_api import async_playwright
N=int(sys.argv[1]) if len(sys.argv)>1 else 3;RX=float(sys.argv[2])/1000 if len(sys.argv)>2 else .33;JIT=float(sys.argv[3]) if len(sys.argv)>3 else 8
STS=(sys.argv[4] if len(sys.argv)>4 else 's,p,h').split(',');EYE=float(sys.argv[5]) if len(sys.argv)>5 else .08
URL='http://127.0.0.1:8811/index.html?r3d=1&test=1&noedit&no3d=1'
ING=['huevo','arroz','grasa']
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(headless=False,args=['--ignore-gpu-blocklist']);ctx=await b.new_context(viewport={'width':1500,'height':860});pg=await ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto(URL,wait_until='commit');await pg.wait_for_function('window.__nstestReady===true',timeout=300000);await pg.wait_for_timeout(2500)
    async def ev(js):return await pg.evaluate(js)
    R=[0,0,1,1]
    def X(x):return R[0]+x/800*R[2]
    def Y(y):return R[1]+y/460*R[3]
    async def wait(js,t=20):
      for _ in range(int(t*50)):
        if await ev(js):return True
        await pg.wait_for_timeout(20)
      return False
    async def click(x,y,hold=.05):
      await pg.mouse.move(X(x+random.gauss(0,JIT*.5)),Y(y+random.gauss(0,JIT*.5)),steps=4);await pg.mouse.down();await asyncio.sleep(hold);await pg.mouse.up()
    async def react():await asyncio.sleep(max(.12,random.gauss(RX,.07)))
    async def knob(kx,ky,F0,F1):   # arrastra el mando hacia arriba/abajo (170 px = recorrido completo)
      dy=-(F1-F0)*170;await pg.mouse.move(X(kx),Y(ky),steps=3);await pg.mouse.down()
      for i in range(1,9):await pg.mouse.move(X(kx+random.gauss(0,2)),Y(ky+dy*i/8),steps=2);await asyncio.sleep(.01)
      await pg.mouse.up()
    async def setup(m):
      await ev("(()=>{S.xp.co=3000;ISLA.lock=()=>false;"+json.dumps(ING)+".forEach(i=>CHEAT.give(i,3));COC.close();COC.open({x:P.x,y:P.y,id:'cocina',n:'C'});const q=s=>document.querySelector(s);"+json.dumps(ING)+".forEach(id=>q('[data-add='+id+']').click());COC.stationClick('"+m+"')})()")
      await wait("COC.G&&COC.G.stage==='cook'&&COC.G.cam.arr",25);nonlocal R
      R=await ev("(()=>{const r=document.querySelector('#alq canvas').getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()")
    async def load():   # echa cada trozo de la bandeja con LMB
      for _ in range(len(ING)):
        pos=await ev("COC.G.chunks.filter(c=>c.s==='board').map(c=>[c.x,c.y])")
        if not pos:break
        await react();await click(*pos[0]);await pg.wait_for_timeout(250)
    out={}
    for st in STS:
      key={'s':'sarten','p':'parrilla','h':'horno'}[st];rs=[]
      for trial in range(N):
        await setup(st);t0=time.time();await load();await wait("COC.G.kk."+key+".all",8)
        if st=='s':
          await react();await knob(704,372,await ev("COC.G.kk.sarten.F"),random.gauss(.62,.06))
          while not await ev("COC.G.kk.sarten.done") and time.time()-t0<70:
            ps=await ev("COC.G.kk.sarten.pcs.map(p=>({x:p.x,y:p.y,d:p.side?p.sb:p.sa,o:p.side?p.sa:p.sb,f:p.flip,s:p.side}))")
            seen=[(q,q['d']+random.gauss(0,EYE),q['o']) for q in ps]
            if all(min(d,o+random.gauss(0,EYE))>.62 for q,d,o in seen):await react();await click(700,150);break
            tgt=[q for q,d,o in seen if q['f']==0 and d>.7 and o<.5]
            if tgt:   # pasa la espátula RÁPIDO por encima de la pieza para voltearla
              q=tgt[0];await react();a=random.uniform(0,6.28);dx,dy=math.cos(a),math.sin(a);sx,sy=q['x']-dx*60,q['y']-dy*60
              await pg.mouse.move(X(sx),Y(sy),steps=2);await pg.mouse.down()
              for i in range(1,9):await pg.mouse.move(X(sx+dx*15*i+random.gauss(0,JIT*.4)),Y(sy+dy*15*i+random.gauss(0,JIT*.4)));await asyncio.sleep(.006)
              await pg.mouse.up();await pg.wait_for_timeout(350)
            else:await pg.wait_for_timeout(150)
        elif st=='p':   # pasa las piezas a la zona MEDIA, voltea a su punto, sirve
          for i in range(len(ING)):
            q=await ev("(()=>{const p=COC.G.kk.parrilla.pcs["+str(i)+"];return[p.x,p.y]})()");await react()
            tx,ty=330+i*12+random.gauss(0,10),170+i*80+random.gauss(0,8)
            await pg.mouse.move(X(q[0]),Y(q[1]),steps=3);await pg.mouse.down()
            for j in range(1,11):await pg.mouse.move(X(q[0]+(tx-q[0])*j/10),Y(q[1]+(ty-q[1])*j/10));await asyncio.sleep(.012)
            await pg.mouse.up();await pg.wait_for_timeout(150)
          while not await ev("COC.G.kk.parrilla.done") and time.time()-t0<75:
            ps=await ev("COC.G.kk.parrilla.pcs.map(p=>({x:p.x,y:p.y,d:p.side?p.sb:p.sa,o:p.side?p.sa:p.sb,f:p.flip}))")
            seen=[(q,q['d']+random.gauss(0,EYE),q['o']) for q in ps]
            if all(min(d,o+random.gauss(0,EYE))>.62 for q,d,o in seen):await react();await click(676,104);break
            tgt=[q for q,d,o in seen if q['f']==0 and d>.7 and o<.5]
            if tgt:await react();q=tgt[0];await pg.mouse.move(X(q['x']),Y(q['y']),steps=3);await pg.mouse.down();await asyncio.sleep(.06);await pg.mouse.up();await pg.wait_for_timeout(300)
            else:await pg.wait_for_timeout(150)
        else:   # horno: mando a la franja verde, ENCENDER, abrir en la franja dorada
          await react();ide=await ev("COC.G.kk.horno.ideal");await knob(722,226,await ev("COC.G.kk.horno.F"),ide+random.gauss(0,.04))
          await react();await click(722,226+112)
          await wait("COC.G.kk.horno.ph==='bake'",5)
          tgt=random.gauss(.9,.04)
          while not await ev("COC.G.kk.horno.done"):
            bb=await ev("COC.G.kk.horno.b")
            if bb+random.gauss(0,EYE*.3)>=tgt:await react();await click(420,200);break
            await pg.wait_for_timeout(60)
        await wait("COC.G.stage==='plate'",10)
        r=await ev("COC.G.cres||{}");pz=await ev("(()=>{const k=COC.G.kk['"+key+"'];return k.pcs.map(p=>[+p.sa.toFixed(2),+p.sb.toFixed(2),Math.round(p.x),Math.round(p.y)])})()");rs.append({'pz':pz,'cook':round(r.get('cook',0),2),'burnt':bool(r.get('burnt')),'s':round(time.time()-t0,1),'b':round(r.get('b',0),2) if 'b' in r else None})
      cs=[x['cook'] for x in rs];out[key]={'media':round(sum(cs)/len(cs),2),'quemado':sum(x['burnt'] for x in rs),'seg':round(sum(x['s'] for x in rs)/len(rs),1),'detalle':rs}
      print(key,json.dumps(out[key],ensure_ascii=False),flush=True)
    print('errores de página:',errs or 'ninguno');await b.close()
asyncio.run(main())
