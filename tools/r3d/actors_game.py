# NotScape · R3D · prueba de JUEGO con actores 3D en movimiento real (sin congelar el tiempo): teletransporta al jugador junto a una criatura y captura N fotogramas.
# Uso (raíz del repo, servidor en 8811):  python3 -I tools/r3d/actors_game.py <prefijo> <id_criatura> [espera_s=10] [n=3] [intervalo_ms=500] [ancho=960] [alto=600]
# Imprime posiciones, estado de R3D.actors y errores. Los fps de SwiftShader no valen: sirve para ver comportamiento (andar, atacar, daño, hover).
import asyncio,sys,json
from playwright.async_api import async_playwright
A=sys.argv;PRE=A[1];ID=A[2];WAIT=float(A[3]) if len(A)>3 else 10;N=int(A[4]) if len(A)>4 else 3;GAP=int(A[5]) if len(A)>5 else 500;W=int(A[6]) if len(A)>6 else 960;H=int(A[7]) if len(A)>7 else 600
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':W,'height':H});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_TUNNEL' not in m.text else None)
    await pg.goto('http://127.0.0.1:8811/index.html?r3d=1&noedit',wait_until='commit')
    await pg.wait_for_function('window.R3D&&typeof sunS==="function"&&typeof S!=="undefined"',timeout=90000);await pg.wait_for_timeout(3000)
    r=await pg.evaluate(f"(()=>{{const m=M.find(m=>m.d.id==='{ID}');if(!m)return null;P.x=m.x-70;P.y=m.y-10;P.mv=null;ISO.snap(P.x,P.y,TER.standZ(P.x,P.y));for(let i=0;i<60&&R3D.preload()>0;i++);return[m.x,m.y,m.d.n]}})()");print('objetivo:',r)
    await pg.evaluate("(()=>{const w=document.getElementById('pw');if(w)w.style.display='none'})()");await pg.wait_for_timeout(int(WAIT*1000))
    for i in range(N):
      await pg.screenshot(path=f'{PRE}_{i}.png',timeout=120000);print(i,json.dumps(await pg.evaluate("({a:R3D.actors.stats,hp:P.hp,calls:R3D.renderer.info.render.calls,mobs:M.filter(m=>Math.hypot(m.x-P.x,m.y-P.y)<260).map(m=>[m.d.id,Math.round(m.x),Math.round(m.y),m.hp,(performance.now()-(m.at0||-1e9))|0])})")));await pg.wait_for_timeout(GAP)
    print('errores:',errs or 'ninguno');print('RESULTADO: OK' if not errs else 'RESULTADO: FALLO');await b.close()
asyncio.run(main())
