# NotScape · B3 · comprobación de BIOME_RULES (src/biome-rules.js). Uso (raíz del repo, con `python tools/serve_nocache.py 8811` levantado; en Windows `PYTHONUTF8=1`, sin -I):
#   python tools/biome_rules_check.py
# Carga el juego, llama a BR.validate() (campos, rangos, que ningún evento dañe ni bloquee), recorre el motor de eventos de CADA bioma con tiempo simulado (el aviso llega antes que el efecto,
# los que no tienen eventos no los reciben, las salidas vuelven a su valor neutro) y dispara el evento de prueba para comprobar el cableado (niebla del pase de grado, minimapa, volumen). Acaba en «RESULTADO: OK/FALLO».
import asyncio,json,sys
from playwright.async_api import async_playwright
JS="""()=>{const out={probs:BR.validate(),filas:BIOME_RULES.length,biomas:BIOMES.list.length,rows:[]};
 for(let k=0;k<BIOME_RULES.length;k++){BR.end();let now=1e7*(k+1),avisos=0,activos=0,orden=true,prev='calma',maxv=1,minv=1;
  for(let i=0;i<30000;i++){now+=1000;BR.update(now,1,k);const f=BR.fase;if(f==='aviso'&&prev!=='aviso')avisos++;if(f==='activo'&&prev==='calma')orden=false;if(f==='activo'&&prev!=='activo')activos++;prev=f;minv=Math.min(minv,BR.vis)}
  BR.end();const p0=BIOME_RULES[k].clima.p;BIOME_RULES[k].clima.p=0;for(let i=0;i<160;i++){now+=1000;BR.update(now,1,k)}BIOME_RULES[k].clima.p=p0;
  out.rows.push({k,id:BIOME_RULES[k].id,eventos:BIOME_RULES[k].clima.ev.length,avisos,activos,ordenOK:orden,vis:+BR.vis.toFixed(2),snd:+BR.snd.toFixed(2),map:+BR.map.toFixed(2),wet:+BR.wet.toFixed(2),minVis:+minv.toFixed(2)})}
 return out}"""
JS2="""async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));BR.end();CHEAT.event('prueba');for(let i=0;i<120&&!(BR.fase==='activo'&&BR.vis<.9);i++)await w(500);const o={fase:BR.fase,vis:+BR.vis.toFixed(2),snd:+BR.snd.toFixed(2),map:+BR.map.toFixed(2),uFog:+R3D.dbg.grade.uniforms.uFog.value.toFixed(2)};CHEAT.event(null);return o}"""
async def main():
  bad=[]
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':960,'height':600});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('http://127.0.0.1:8811/index.html?noedit&test',wait_until='commit')
    await pg.wait_for_function('window.R3D&&typeof BR!=="undefined"&&typeof CHEAT!=="undefined"',timeout=120000);await pg.wait_for_timeout(6000)
    r=await pg.evaluate(JS)
    print('filas',r['filas'],'biomas',r['biomas'])
    if r['filas']!=r['biomas']:bad.append('filas != biomas')
    for p_ in r['probs']:print('PROBLEMA',p_);bad.append(p_)
    for x in r['rows']:
      print(f"{x['k']} {x['id']:9s} eventos={x['eventos']} avisos={x['avisos']:3d} activos={x['activos']:3d} orden={'ok' if x['ordenOK'] else 'MAL'} minVis={x['minVis']} final vis/snd/map/wet={x['vis']}/{x['snd']}/{x['map']}/{x['wet']}")
      if not x['ordenOK']:bad.append(f"{x['id']}: un efecto empezó sin aviso")
      if x['eventos']==0 and (x['avisos'] or x['activos']):bad.append(f"{x['id']}: sin eventos pero recibió alguno")
      if x['eventos']>0 and x['avisos']==0:bad.append(f"{x['id']}: tiene eventos y nunca se disparó uno")
      if (x['vis'],x['snd'],x['map'],x['wet'])!=(1,1,0,0):bad.append(f"{x['id']}: las salidas no vuelven a neutro")
    t=await pg.evaluate(JS2);print('evento de prueba:',t)
    if not(t['fase']=='activo' and t['vis']<.95 and t['snd']<.97 and t['map']>.03 and t['uFog']>.03):bad.append('cableado del evento de prueba incompleto: '+json.dumps(t))
    if errs:print('errores de página:',errs[:3]);bad.append('errores de página')
    await b.close()
  print('RESULTADO:','FALLO ('+'; '.join(bad)+')' if bad else 'OK');sys.exit(1 if bad else 0)
asyncio.run(main())
