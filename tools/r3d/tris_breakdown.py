# NotScape · R3D · desglose de triángulos VISIBLES (dentro del frustum de la cámara) por tipo de objeto, para decidir qué optimizar. (Chromium sin pantalla.)
# Uso (raíz del repo, con `python3 -m http.server 8811 &`):  python3 -I tools/r3d/tris_breakdown.py [hora=dia] [x] [y]   (por defecto aldea = spawn)
import asyncio,sys,json
from playwright.async_api import async_playwright
T=sys.argv[1] if len(sys.argv)>1 else 'dia';X=sys.argv[2] if len(sys.argv)>2 else None;Y=sys.argv[3] if len(sys.argv)>3 else None
SUN={'dia':61,'atardecer':145,'noche':241}
INIT="const raf=window.requestAnimationFrame.bind(window);window.__fix=null;window.__t0=0;window.requestAnimationFrame=cb=>raf(ts=>cb(window.__fix===null?ts:window.__fix+(ts-window.__t0)*.002));"
JS="""()=>{const r=R3D,sc=r.scene,THREE=window.THREE;const cam=sc.children.find(o=>o.isOrthographicCamera)||null;
 // cámara: no está en la escena; la reconstruimos con r.renderer? usamos la última matriz de proyección vía scene.userData no existe → contamos TODO y lo visible por frustum con un Frustum propio si hay cámara global
 const out={};const add=(k,t,n)=>{const o=out[k]||(out[k]={objs:0,tris:0,inst:0});o.objs++;o.tris+=t;o.inst+=n};
 sc.traverse(o=>{if(!(o.isMesh||o.isPoints||o.isLine)||!o.visible)return;const g=o.geometry;if(!g)return;const n=o.isInstancedMesh?o.count:1;const c=g.index?g.index.count:(g.attributes.position?g.attributes.position.count:0);
  let p=o.parent,top='';while(p&&p!==sc){top=p.name||top;p=p.parent}const key=(top||o.name||(o.userData.hull?'hull':'otro'))+(o.isInstancedMesh?' [inst]':'')+(o.isPoints?' [pts]':'');add(key,(o.isMesh?c/3:0)*n,n)});
 return out}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':960,'height':600})
    await pg.add_init_script(INIT);await pg.goto('http://127.0.0.1:8811/index.html?r3d=1&noedit',wait_until='commit')
    await pg.wait_for_function('window.R3D&&typeof sunS==="function"&&typeof S!=="undefined"',timeout=90000);await pg.wait_for_timeout(4000)
    if X:await pg.evaluate(f'(()=>{{P.x={X};P.y={Y};ISO.snap(P.x,P.y,TER.standZ(P.x,P.y))}})()')
    await pg.evaluate(f'window.__t0=performance.now();window.__fix={SUN[T]}*1000');await pg.wait_for_timeout(5000)
    res=await pg.evaluate(JS);tot=sum(v['tris'] for v in res.values())
    print('TOTAL en escena (todo lo visible=true, sin recorte por cámara):',int(tot))
    for k,v in sorted(res.items(),key=lambda kv:-kv[1]['tris'])[:14]:print(f"{k:34s} objs={v['objs']:5d} inst={v['inst']:6d} tris={int(v['tris']):9d} ({v['tris']/tot*100:4.1f}%)")
    st=await pg.evaluate('(()=>{const r=R3D.renderer;r.info.autoReset=true;return null})()')
    await b.close()
asyncio.run(main())
