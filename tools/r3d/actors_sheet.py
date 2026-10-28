# NotScape · R3D · HOJA DE CONTACTO de actores 3D (Lote R3D-ACTORES). Pone todas las criaturas de MD en una cuadrícula en un claro de la Pradera (sin IA: ag=0), a una hora dada, y captura.
# Uso (raíz del repo, con `python3 -m http.server 8811 &`):  python3 -I tools/r3d/actors_sheet.py <salida.png> [hora=dia] [ids=all|lobo,goblin,…] [zoom=4] [cols=6] [ancho=1400] [alto=900] [atk=0|1]
# GPU=1 (variable de entorno) = GPU real en vez de SwiftShader.
# atk=1 → pone m.at0 = ahora en todas (pose de ataque congelada en el golpe) para revisar la animación. Imprime errores de página, estadísticas de R3D.actors y RESULTADO.
import asyncio,sys,json,os
from playwright.async_api import async_playwright
OUT=sys.argv[1];T=sys.argv[2] if len(sys.argv)>2 else 'dia';IDS=sys.argv[3] if len(sys.argv)>3 else 'all';ZM=int(sys.argv[4]) if len(sys.argv)>4 else 4;COLS=int(sys.argv[5]) if len(sys.argv)>5 else 6
WD=int(sys.argv[6]) if len(sys.argv)>6 else 1400;HT=int(sys.argv[7]) if len(sys.argv)>7 else 900;ATK=int(sys.argv[8]) if len(sys.argv)>8 else 0
SUN={'dia':61,'atardecer':145,'noche':241}
INIT="const raf=window.requestAnimationFrame.bind(window);window.__fix=null;window.__t0=0;window.requestAnimationFrame=cb=>raf(ts=>cb(window.__fix===null?ts:window.__fix+(ts-window.__t0)*.002));"
JS="""(([ids,cols,zm,atk,sun])=>{const all=Object.keys(MD).filter(k=>!/^slime$/.test(k));const list=ids==='all'?all:ids.split(',');M.length=0;ST.length=0;
 const cx=1500,cy=2050,sp=64;P.x=cx;P.y=cy;P.mv=null;list.forEach((id,i)=>{const c=i%cols,r=Math.floor(i/cols),x=cx+(c-(cols-1)/2)*sp-(r%2)*0,y=cy+(r-.5)*sp*1.25+60;mob(id,x,y);const m=M[M.length-1];m.d=Object.assign({},m.d,{ag:0});m.nt=1e15;m.tx=m.x;m.ty=m.y;m.hunt=0;if(atk)m.at0=performance.now()});
 setZoom(zm);ISO.snap(P.x,P.y,TER.standZ(P.x,P.y));for(let i=0;i<60&&R3D.preload()>0;i++);window.__t0=performance.now();window.__fix=sun*1000;R3D.parts.snap();return list.length})"""
async def main():
  async with async_playwright() as p:
    b=await (p.chromium.launch(headless=False,args=['--ignore-gpu-blocklist']) if os.environ.get('GPU') else p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']))   # GPU=1 usa la GPU real del PC
    pg=await b.new_page(viewport={'width':WD,'height':HT});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_TUNNEL' not in m.text else None)
    await pg.add_init_script(INIT);await pg.goto('http://127.0.0.1:8811/index.html?r3d=1&noedit',wait_until='commit')
    await pg.wait_for_function('window.R3D&&typeof sunS==="function"&&typeof S!=="undefined"',timeout=90000);await pg.wait_for_timeout(3000)
    n=await pg.evaluate(JS,[IDS,COLS,ZM,ATK,SUN[T]]);print('criaturas:',n);await pg.wait_for_timeout(2500)
    await pg.evaluate("document.querySelectorAll('#hud,.panel,#log,#goal,#quest,#side').forEach(e=>e.style.display='none')")
    await pg.wait_for_timeout(5000);await pg.screenshot(path=OUT,timeout=180000)
    print('actores:',json.dumps(await pg.evaluate('R3D.actors.stats')));print('errores:',errs or 'ninguno');print('RESULTADO: OK' if not errs else 'RESULTADO: FALLO');await b.close()
asyncio.run(main())
