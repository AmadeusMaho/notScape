# NotScape · R3D · Fase 44b · vuelca a JSON los DATOS de la aldea de la Pradera (props con fp/room/rot, estaciones, plaza, cobs, rutas, guaridas, POI, lagos) del juego cargado, sin WebGL. Uso: `python3 -I tools/r3d/village_dump.py salida.json [extra_query]` (con `python3 -m http.server 8811 &`). Lo lee village_plot.py.
# Vuelca los datos de la aldea de la Pradera (props, estaciones, plaza, cobs, rutas, guaridas) a JSON desde el juego real.
import asyncio,sys,json
from playwright.async_api import async_playwright
OUT=sys.argv[1];Q=sys.argv[2] if len(sys.argv)>2 else ''
JS='''(()=>{const B=BIOMES.list[0],V=B.village;
return JSON.stringify({w:B.w,h:B.h,safe:V.safe,plaza:V.plaza,stations:V.stations,cobs:V.cobs,routes:B.routes,spots:Object.fromEntries(Object.entries(B.spots).map(([k,s])=>[k,{z:s.z,t:s.t}])),
 props:V.props.map(p=>({n:p.n,x:p.x,y:p.y,fp:p.fp||null,room:p.room||null,tav:p.tav||0,o:p.o&&p.o.v!=null?p.o.v:null,rot:p.o&&p.o.rot!=null?p.o.rot:null})),pois:B.pois,lay:{lakes:B.lay.lakes,hills:B.lay.hills.slice(0,30),sea:B.lay.sea}})})()'''
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch();pg=await b.new_page()
    await pg.goto('http://127.0.0.1:8811/index.html?noedit'+('&'+Q if Q else ''),wait_until='commit')
    await pg.wait_for_function('typeof BIOMES!=="undefined"&&BIOMES.list&&BIOMES.list[0].village&&typeof S!=="undefined"&&typeof PROPS!=="undefined"&&PROPS.list&&PROPS.list.length',timeout=60000)
    d=await pg.evaluate(JS);open(OUT,'w').write(d);print(len(d));await b.close()
asyncio.run(main())
