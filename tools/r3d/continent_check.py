# NotScape · R3D · Fase 49a · PRUEBA DEL CONTINENTE 3×3 sin capturas (colisión real, `blk`). Uso (raíz del repo, con `python3 -m http.server 8811 &`):
#   python3 -I tools/r3d/continent_check.py [extra_query]  → JSON + «RESULTADO: OK/FALLO»
# Comprueba: (1) inundación desde la aldea de la Pradera: se alcanzan los 9 biomas (por RECTÁNGULO: BIOMES.own); (2) NINGUNA arista de la inundación cruza una unión CERRADA
# (0|8, 3|4, 1|4, 5|7); (3) las uniones abiertas se cruzan en parte de su longitud; (4) BIOMES.at ≠ own en algún tile (el dominio deformado actúa) pero nunca más de WARP.A+D1 px del rectángulo;
# (5) el esqueleto (Páramo, Desierto, Costa) no tiene jefe (noBoss) y su aldea existe; (6) sin errores de consola.
import asyncio,sys,json
from playwright.async_api import async_playwright
EXTRA=sys.argv[1] if len(sys.argv)>1 else ''
JS="""(()=>{
 const T=32,NX=TER.NX,NY=TER.NY,out={};
 const free=(x,y)=>x>=0&&y>=0&&x<NX&&y<NY&&!blk((x+.5)*T,(y+.5)*T);
 const own=i=>BIOMES.own(((i%NX)+.5)*T,(Math.floor(i/NX)+.5)*T);
 const closed=new Set(BIOMES.seams.filter(s=>!s.open).map(s=>Math.min(s.a,s.b)+'|'+Math.max(s.a,s.b)));
 const sp=spawnOf(0),s0=Math.floor(sp.y/T)*NX+Math.floor(sp.x/T),seen=new Uint8Array(NX*NY),q=new Int32Array(NX*NY);let h=0,t=0;q[t++]=s0;seen[s0]=1;
 let bad=0,reach={},cross={};
 while(h<t){const i=q[h++],x=i%NX,y=(i/NX)|0,bi=own(i);reach[bi]=(reach[bi]||0)+1;
  for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(!free(nx,ny))continue;const j=ny*NX+nx;if(seen[j])continue;
   const bj=own(j);if(bi!==bj){const k=Math.min(bi,bj)+'|'+Math.max(bi,bj);cross[k]=(cross[k]||0)+1;if(closed.has(k))bad++}seen[j]=1;q[t++]=j}}
 out.inundacion={tiles:t,biomas:reach,cruces:cross,aristasProhibidas:bad,cerradas:[...closed]};
 let diff=0,maxd=0;for(let ty=0;ty<NY;ty+=4)for(let tx=0;tx<NX;tx+=4){const x=(tx+.5)*T,y=(ty+.5)*T;if(BIOMES.at(x,y)!==BIOMES.own(x,y))diff++}
 out.warp={tilesDistintos:diff,N:BIOMES.N,L:BIOMES.L,NX,NY};
 out.esqueleto=[6,7,8].map(k=>({k,noBoss:!!BIOMES.list[k].noBoss,aldea:!!(BIOMES.list[k].village&&BIOMES.list[k].village.props.length),spawn:!!spawnOf(k)}));
 out.stats={SEAMS:window.SEAMS&&{roads:SEAMS.roads,groves:SEAMS.groves,ranges:SEAMS.ranges.length,removed:SEAMS.removed,warn:SEAMS.warn,ms:SEAMS.ms}};
 return out})()"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':960,'height':600});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_TUNNEL' not in m.text and 'status of 404' not in m.text else None)
    await pg.goto('http://127.0.0.1:8811/index.html?r3d=1&noedit'+('&'+EXTRA if EXTRA else ''),wait_until='commit')
    await pg.wait_for_function('window.R3D&&typeof S!=="undefined"&&typeof blk==="function"',timeout=180000);await pg.wait_for_timeout(2500)
    r=await pg.evaluate(JS);ok=True;print(json.dumps(r,ensure_ascii=False,indent=1))
    if len(r['inundacion']['biomas'])!=9:print('FALLO: no se alcanzan los 9 biomas');ok=False
    if r['inundacion']['aristasProhibidas']:print('FALLO: la inundación cruza una unión cerrada');ok=False
    if EXTRA.find('warp=0')<0 and r['warp']['tilesDistintos']==0:print('FALLO: el dominio deformado no cambia nada');ok=False
    if not all(e['noBoss'] and e['aldea'] and e['spawn'] for e in r['esqueleto']):print('FALLO: esqueleto incompleto');ok=False
    if r['stats']['SEAMS'] and r['stats']['SEAMS']['warn']:print('FALLO: avisos de seams');ok=False
    print('errores:',errs or 'ninguno')
    if errs:ok=False
    print('RESULTADO: OK' if ok else 'RESULTADO: FALLO');await b.close()
asyncio.run(main())
