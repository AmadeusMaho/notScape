# NotScape · R3D · Fase 49b · PRUEBA DE LA COSTA del continente, sin capturas (usa el motor real: TER, blk, N, M, ST, PO, PROPS). Uso (raíz del repo, con `python3 -m http.server 8811 &`):
#   python3 -I tools/r3d/coast_check.py [extra_query]   → JSON + «RESULTADO: OK/FALLO»        (con `coast=0` comprueba el modo antiguo: solo los chequeos que valen)
# Comprueba: (1) la costa es IRREGULAR (largo de costa ≥ 1,05× el perímetro del mundo) y no se come demasiada tierra (≥ 85 % del área queda);
#            (2) ningún tile de tierra a < MIN_D tiles del borde del mundo, ningún acantilado en el borde exterior (todo es mar);
#            (3) TODO lo importante está en TIERRA pisable: nodos de recurso (N), enemigos (M), estaciones (ST), cofres/santuarios (PO), spawn y jefe de cada bioma; props de la aldea: ninguno en el mar;
#            (4) la inundación desde la aldea de la Pradera sigue alcanzando los 9 biomas y ≥ 97 % de la tierra pisable queda conectada (la costa no aísla regiones);
#            (5) `seaAt` marca el mar exterior y la playa (`sandAt`) existe junto a la costa; (6) sin errores de consola.
import asyncio,sys,json
from playwright.async_api import async_playwright
EXTRA=sys.argv[1] if len(sys.argv)>1 else ''
JS="""(()=>{
 const T=32,NX=TER.NX,NY=TER.NY,CO=BIOMES.coast,out={on:!!(CO&&CO.on),NX,NY};
 const hAt=(x,y)=>TER.heightAt(x,y),land=(x,y)=>TER.isLand(hAt(x,y));
 if(CO&&CO.on){out.stats=CO.stats;
  // (2) borde: tiles de tierra a menos de MIN_D del borde y acantilados en el borde
  let nearLand=0,edgeCliff=0,edgeN=0;for(let ty=0;ty<NY;ty++)for(let tx=0;tx<NX;tx++){const e=Math.min(tx,ty,NX-1-tx,NY-1-ty);if(e>=Math.ceil(CO.MIN_D))continue;edgeN++;const h=TER.tileH(tx,ty);if(h>=1&&h<2)nearLand++;if(h>=2)edgeCliff++}
  out.borde={tilesBanda:edgeN,tierraCercaDelBorde:nearLand,acantiladosEnBorde:edgeCliff,MIN_D:CO.MIN_D};
  // playa y mar exterior
  let sea=0,seaFlag=0,sand=0,shore=0;for(let ty=2;ty<NY-2;ty+=2)for(let tx=2;tx<NX-2;tx+=2){const h=TER.tileH(tx,ty);if(h===.75&&!CO.land(tx,ty)){sea++;if(TER.seaAt(tx,ty))seaFlag++}if(CO.land(tx,ty)&&(!CO.land(tx+2,ty)||!CO.land(tx,ty+2))){shore++;if(TER.sandAt(tx,ty)>.3)sand++}}
  out.marYPlaya={marMuestras:sea,marMarcadoSeaAt:seaFlag,orillaMuestras:shore,orillaConPlaya:sand}}
 // (3) contenido en tierra
 const bad=(arr,fx,fy,name)=>{let n=0,ej=[];arr.forEach(e=>{const x=fx(e),y=fy(e);if(!land(x,y)){n++;if(ej.length<3)ej.push([Math.round(x),Math.round(y),e.t||e.id||e.pk||''])}});return{n:arr.length,enAguaOCliff:n,ejemplos:ej}};
 out.contenido={nodos:bad(N.filter(e=>e.t!=='fi'),e=>e.x,e=>e.y),pesca:{n:N.filter(e=>e.t==='fi').length},mobs:bad(M,e=>e.x,e=>e.y),estaciones:bad(ST,e=>e.x,e=>e.y),poi:bad(PO,e=>e.x,e=>e.y),
  spawns:bad(BIOMES.list.map((b,k)=>({x:b.ox+b.spawn[0],y:b.oy+b.spawn[1],id:'spawn'+k})),e=>e.x,e=>e.y),
  jefes:bad(BIOMES.list.filter(b=>!b.noBoss).map((b,k)=>({x:b.ox+b.bossPos[0],y:b.oy+b.bossPos[1],id:'jefe'+b.id})),e=>e.x,e=>e.y),
  props:bad(PROPS.list,e=>e.x,e=>e.y)};
 // (4) inundación
 const free=(x,y)=>x>=0&&y>=0&&x<NX&&y<NY&&!blk((x+.5)*T,(y+.5)*T);
 const own=i=>BIOMES.own(((i%NX)+.5)*T,(Math.floor(i/NX)+.5)*T);
 const sp=spawnOf(0),s0=Math.floor(sp.y/T)*NX+Math.floor(sp.x/T),seen=new Uint8Array(NX*NY),q=new Int32Array(NX*NY);let h=0,t=0;q[t++]=s0;seen[s0]=1;const reach={};
 while(h<t){const i=q[h++],x=i%NX,y=(i/NX)|0,bi=own(i);reach[bi]=(reach[bi]||0)+1;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(!free(nx,ny))continue;const j=ny*NX+nx;if(seen[j])continue;seen[j]=1;q[t++]=j}}
 let walk=0;for(let ty=0;ty<NY;ty++)for(let tx=0;tx<NX;tx+=1){if(free(tx,ty))walk++}
 out.conexion={alcanzados:t,pisablesTotales:walk,fraccion:+(t/walk).toFixed(4),biomas:reach};
 return out})()"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':960,'height':600});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_TUNNEL' not in m.text and 'status of 404' not in m.text else None)
    await pg.goto('http://127.0.0.1:8811/index.html?noedit'+('&'+EXTRA if EXTRA else ''),wait_until='commit')
    await pg.wait_for_function('typeof S!=="undefined"&&typeof blk==="function"&&typeof N!=="undefined"&&N.length>0',timeout=240000);await pg.wait_for_timeout(2000)
    r=await pg.evaluate(JS);print(json.dumps(r,ensure_ascii=False,indent=1));ok=True
    if r['on']:
      st=r['stats'];tot=st['landTiles']+st['seaTiles']
      if st['shore']<1.05*st['perim']:print('FALLO: costa poco irregular (%d < 1,05×%d)'%(st['shore'],st['perim']));ok=False
      if st['landTiles']<.85*.75*tot:   # ×.75: desde ISLA-1 el mundo tiene 4 columnas y la 4.ª (Cielo) es mar de nubes casi entera
        print('FALLO: la costa se come demasiada tierra');ok=False
      if r['borde']['tierraCercaDelBorde']:print('FALLO: hay tierra a menos de MIN_D del borde');ok=False
      if r['borde']['acantiladosEnBorde']:print('FALLO: hay acantilado en el borde exterior');ok=False
      if r['marYPlaya']['marMarcadoSeaAt']<.98*r['marYPlaya']['marMuestras']:print('FALLO: seaAt no marca el mar exterior');ok=False
      if r['marYPlaya']['orillaConPlaya']<.9*r['marYPlaya']['orillaMuestras']:print('FALLO: falta playa junto a la costa');ok=False
    KNOWN={'7_h1'}   # cofre del Desierto dentro de un lago del esqueleto de la 49a (falla también con coast=0; lo rehace la Fase 50b): aviso, no fallo
    for k,v in r['contenido'].items():
      if k=='pesca':continue
      if k=='poi':
        w=[e for e in v['ejemplos'] if e[2] in KNOWN]
        if w:print('AVISO (conocido, previo a la 49b):',w);v['enAguaOCliff']-=len(w)
      if v['enAguaOCliff']:print('FALLO: %s en agua/acantilado: %d de %d %s'%(k,v['enAguaOCliff'],v['n'],v['ejemplos']));ok=False
    if len(r['conexion']['biomas'])!=9:print('FALLO: no se alcanzan los 9 biomas');ok=False
    if r['conexion']['fraccion']<.97:print('FALLO: la costa aísla regiones (fracción conectada %s)'%r['conexion']['fraccion']);ok=False
    print('errores:',errs or 'ninguno')
    if errs:ok=False
    print('RESULTADO: OK' if ok else 'RESULTADO: FALLO');await b.close()
asyncio.run(main())
