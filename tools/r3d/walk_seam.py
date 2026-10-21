# NotScape · R3D · Fase 44a · PRUEBA DE FRONTERAS sin capturas (colisión real del juego, `blk`). Uso (raíz del repo, con `python3 -m http.server 8811 &`):
#   python3 -I tools/r3d/walk_seam.py [extra_query]     → imprime JSON y «RESULTADO: OK/FALLO»
# Comprueba: (1) la unión ABIERTA Pradera|Bosque (x=9216) se cruza andando en TODA su longitud útil (sin acantilado ni compuerta) salvo donde la cordillera de frontera la corta;
# (2) las uniones NO encadenadas (Pradera|Volcán y Bosque|Oriental) no se pueden cruzar en ninguna columna de tiles; (3) inundación desde la aldea de la Pradera: se alcanzan los 6 biomas
# (por la cadena de compuertas) y NINGUNA arista de la inundación cruza 0|5 ni 1|4; (4) un cruce a pie real (teclado) de la Pradera al Bosque sin que `guard()` te devuelva atrás, y el
# cambio de bioma (curB) con su aviso; (5) reaparición: al morir en el Bosque sin jefe vencido apareces en la última aldea visitada (S.home); (6) tiempos de generación (SEAMS.ms, WS.ms).
import asyncio,sys,json
from playwright.async_api import async_playwright
EXTRA=sys.argv[1] if len(sys.argv)>1 else ''
JS_CHECK="""(()=>{
 const T=32,NX=TER.NX,NY=TER.NY,out={};
 const free=(tx,ty)=>tx>=0&&ty>=0&&tx<NX&&ty<NY&&!blk((tx+.5)*T,(ty+.5)*T);
 // (1) unión abierta x=9216 → tiles 287|288; filas útiles ty=2..(5984/32)
 let open=0,shut=0,rows=[];for(let ty=3;ty<186;ty++){const a=free(287,ty),b=free(288,ty);if(a&&b)open++;else{shut++;rows.push(ty)}}
 out.abierta={cruzables:open,cerradas:shut,filasCerradas:rows.length>40?rows.slice(0,40).concat(['…']):rows};
 // (2) barreras no encadenadas: y=6016 → tiles 187|188, columnas 0..575 (0|5) y 288..575 (1|4)
 const cross=(tx0,tx1)=>{let n=0;for(let tx=tx0;tx<tx1;tx++){for(const d of[-1,0,1]){if(free(tx,187)&&free(tx+d,188))n++}}return n};
 out.barrera05=cross(0,288);out.barrera14=cross(288,576);
 // (3) inundación (4 vecinos) desde la aldea de la Pradera
 const sp=spawnOf(0),s0=(Math.floor(sp.y/T))*NX+Math.floor(sp.x/T),seen=new Uint8Array(NX*NY),q=new Int32Array(NX*NY);let h=0,t=0;q[t++]=s0;seen[s0]=1;
 const bio=i=>BIOMES.at(((i%NX)+.5)*T,(Math.floor(i/NX)+.5)*T);let bad=0,reach={};
 while(h<t){const i=q[h++],x=i%NX,y=(i/NX)|0,bi=bio(i);reach[bi]=(reach[bi]||0)+1;
  for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(!free(nx,ny))continue;const j=ny*NX+nx;if(seen[j])continue;
   const bj=bio(j);if((bi===0&&bj===5)||(bi===5&&bj===0)||(bi===1&&bj===4)||(bi===4&&bj===1))bad++;seen[j]=1;q[t++]=j}}
 out.inundacion={tiles:t,biomas:reach,aristasProhibidas:bad};
 out.stats={SEAMS:window.SEAMS||null,WSms:window.WS&&WS.ms,seams:BIOMES.seams.map(s=>({par:s.a+'|'+s.b,abierta:s.open,encadenada:s.chained})),gates:BIOMES.gates.map(g=>g.a+'|'+g.b)};
 return out})()"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':960,'height':600});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_TUNNEL' not in m.text and 'status of 404' not in m.text else None)
    await pg.goto('http://127.0.0.1:8811/index.html?r3d=1&noedit'+('&'+EXTRA if EXTRA else ''),wait_until='commit')
    await pg.wait_for_function('window.R3D&&typeof S!=="undefined"&&typeof blk==="function"',timeout=120000);await pg.wait_for_timeout(2500)
    r=await pg.evaluate(JS_CHECK);ok=True
    print(json.dumps(r,ensure_ascii=False,indent=1))
    if r['barrera05'] or r['barrera14']:print('FALLO: barrera cruzable');ok=False
    if r['inundacion']['aristasProhibidas']:print('FALLO: la inundación cruza una frontera sin paso');ok=False
    if len(r['inundacion']['biomas'])!=6:print('FALLO: no se alcanzan los 6 biomas (¿se rompió una compuerta?)');ok=False
    if EXTRA.find('seam=0')<0 and r['abierta']['cruzables']<100:print('FALLO: la unión abierta casi no se cruza');ok=False
    # (4) cruce a pie de la Pradera al Bosque por el camino (y=3000): en pasos de 8 px; `guard()` (que devuelve al jugador a la última posición válida si pisa acantilado/vacío) no debe echarle atrás.
    #     (El teclado no sirve para esto: bajo SwiftShader el juego va a ~2 fps y el movimiento se recorta.)  Luego upd() procesa el cambio de bioma (curB + aviso de zona).
    st=await pg.evaluate('''(()=>{for(let k=0;k<5;k++)S.boss[k]=0;let back=0;GOOD=null;curB=0;
      for(let x=9000;x<=9400;x+=8){P.x=x;P.y=3000;guard();if(Math.abs(P.x-x)>1){back++;break}}
      P.x=9300;P.y=3000;GOOD=null;upd(.016,performance.now());
      return JSON.stringify({x:Math.round(P.x),y:Math.round(P.y),curB,bio:biomeAt(P.x,P.y),revertido:back,boss0:S.boss[0]||0})})()''')
    print('cruce a pie:',st);d=json.loads(st)
    if d['revertido'] or d['bio']!=1 or d['curB']!=1:print('FALLO: no se cruzó la unión andando');ok=False
    # (5) reaparición: sin jefe vencido, en el Bosque, apareces en la ÚLTIMA ALDEA VISITADA (S.home): primero la de la Pradera; tras pisar la del Bosque, la del Bosque
    rs=await pg.evaluate('''(()=>{const o={};S.home=0;P.x=9500;P.y=3000;die();o.sinVisitar={bio:biomeAt(P.x,P.y),home:S.home};
      const sp=spawnOf(1);P.x=sp.x;P.y=sp.y;GOOD=null;upd(.016,performance.now());o.trasAldea={home:S.home};
      P.x=10400;P.y=3000;die();o.muerteEnBosque={bio:biomeAt(P.x,P.y),home:S.home};
      o.bossHTML=bossHTML().length>50;return JSON.stringify(o)})()''')
    print('reaparición:',rs);d=json.loads(rs)
    if d['sinVisitar']['bio']!=0:print('FALLO: sin visitar el Bosque debes reaparecer en la Pradera');ok=False
    if d['trasAldea']['home']!=1 or d['muerteEnBosque']['bio']!=1:print('FALLO: S.home no sigue a la última aldea visitada');ok=False
    if not d['bossHTML']:print('FALLO: bossHTML');ok=False
    print('errores:',errs or 'ninguno');
    if errs:ok=False
    print('RESULTADO: OK' if ok else 'RESULTADO: FALLO');await b.close()
asyncio.run(main())
