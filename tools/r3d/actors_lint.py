# NotScape · R3D · comprobación de los actores 3D: TODA criatura de MD (game.js) tiene plantilla, esqueleto completo y presupuesto de triángulos. Servidor del repo en 8811.
# Uso:  python3 -I tools/r3d/actors_lint.py            → imprime id, triángulos de cuerpo/contorno y huesos; RESULTADO: OK/FALLO
import asyncio,json
from playwright.async_api import async_playwright
JS="""(async()=>{const m=await import('/src/r3d/actors3d.js');const OK=(await import('/src/r3d/mini3d.js')).Mini.DRESS_OK;const o={miss:[],rows:[],bad:[]};const NEED={human:['root','pelvis','chest','body','head','legR','legL','kneeR','kneeL','armR','armL','elbR','elbL'],quad:['root','body','head','legFL','legFR','legBL','legBR','tail'],bird:['root','body','head','wingL','wingR','legL','legR','tail'],frog:['root','body','head','legBL','legBR','legFL','legFR']};
 for(const id of [...Object.keys(MD),'ru']){const A=m.makeActor(id);if(!A){o.miss.push(id);continue}const k=A.tpl.kind,names=A.tpl.names;const lack=NEED[k].filter(n=>!names.includes(n));if(lack.length)o.bad.push(id+':'+lack.join('/'));
  if(A.tpl.dress&&!OK.includes(id))o.bad.push(id+': lleva VESTIDO (prohibido)');const tr=A.tpl.tris,ht=A.tpl.hgeo.attributes.position.count/3|0;o.rows.push([id,k,tr,ht,names.length]);if(tr+ht>14000)o.bad.push(id+': '+(tr+ht)+' tris (>14000)')}
 return o})()"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':800,'height':500});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_TUNNEL' not in m.text else None)
    await pg.goto('http://127.0.0.1:8811/index.html?r3d=1&noedit',wait_until='commit');await pg.wait_for_function('window.R3D&&typeof MD!=="undefined"',timeout=90000);await pg.wait_for_timeout(1500)
    o=await pg.evaluate(JS)
    for r in o['rows']:print('%-10s %-6s cuerpo %5d  contorno %5d  huesos %d'%tuple(r))
    print('sin plantilla:',o['miss'] or 'ninguna');print('problemas:',o['bad'] or 'ninguno');print('errores:',errs or 'ninguno')
    ok=not o['miss'] and not o['bad'] and not errs;print('RESULTADO: OK' if ok else 'RESULTADO: FALLO');await b.close()
asyncio.run(main())
