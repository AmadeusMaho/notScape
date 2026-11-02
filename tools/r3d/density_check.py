#!/usr/bin/env python3
"""NotScape · N0.1 (2 nov 2026): DENSIDAD del mundo por tamaño (`?wk=K`, mapa A).
Para cada K toma puntos al azar de tierra PISABLE de cada bioma (sin el Cielo) y mide la distancia a lo más cercano de:
  (a) CONTENIDO = POI/descubrimientos/cofres/cuevas/hitos (`PO`), criaturas (`M`) y centros de aldea;
  (b) CUALQUIER COSA = (a) + zonas con nombre (`ZS`: recursos, guaridas, áreas de farmeo);
  (c) LUGAR IMPORTANTE = POI que no son descubrimientos menores (campamentos, ruinas, cofres, cuevas, minas, santuarios), hitos, áreas de farmeo y aldeas.
Lo pasa a SEGUNDOS andando (70 px/s) y corriendo (×1,9). Objetivo del dueño: algo cada 30–60 s caminando.
Uso (servidor en 8811):  python tools/r3d/density_check.py --k 3,4,6 [--n 300] [--json x.json]"""
import asyncio, json, argparse
from playwright.async_api import async_playwright
ap = argparse.ArgumentParser(); ap.add_argument('--k', default='3,4,6'); ap.add_argument('--n', type=int, default=300); ap.add_argument('--json', default=None)
JS = r"""((NS)=>{const WALK=70,RUN=133,C=400,PT=[];const add=(x,y)=>PT.push([x,y]);
(typeof PO!=='undefined'?PO:[]).forEach(p=>{if(p&&p.x!=null)add(p.x,p.y)});M.forEach(m=>{if(m&&m.hx!=null)add(m.hx,m.hy);else if(m&&m.x!=null)add(m.x,m.y)});
BIOMES.list.forEach(b=>{if(b.cen)add(b.ox+b.cen[0],b.oy+b.cen[1])});
const G=new Map(),key=(i,j)=>i+','+j;PT.forEach(p=>{const k=key(Math.floor(p[0]/C),Math.floor(p[1]/C));(G.get(k)||G.set(k,[]).get(k)).push(p)});
const ZR=ZS.map(z=>z.r);const P2=[];(typeof PO!=='undefined'?PO:[]).forEach(p=>{if(p&&p.x!=null&&!/^e/.test(String(p.id||'')))P2.push([p.x,p.y])});ZS.forEach(z=>{if(z.hito||z.poi||/nv \d/.test(z.t||''))P2.push([(z.r[0]+z.r[1])/2,(z.r[2]+z.r[3])/2])});BIOMES.list.forEach(b=>{if(b.cen)P2.push([b.ox+b.cen[0],b.oy+b.cen[1]])});
const G2=new Map();P2.forEach(p=>{const k=key(Math.floor(p[0]/C),Math.floor(p[1]/C));(G2.get(k)||G2.set(k,[]).get(k)).push(p)});
const nearImp=(x,y)=>{const ci=Math.floor(x/C),cj=Math.floor(y/C);let best=1e9;for(let r=0;r<80;r++){for(let i=ci-r;i<=ci+r;i++)for(let j=cj-r;j<=cj+r;j++){if(Math.max(Math.abs(i-ci),Math.abs(j-cj))!==r)continue;const L=G2.get(key(i,j));if(L)for(const p of L){const d=Math.hypot(p[0]-x,p[1]-y);if(d<best)best=d}}if(best<=r*C)break}return best};
const nearPt=(x,y)=>{const ci=Math.floor(x/C),cj=Math.floor(y/C);let best=1e9;for(let r=0;r<40;r++){for(let i=ci-r;i<=ci+r;i++)for(let j=cj-r;j<=cj+r;j++){if(Math.max(Math.abs(i-ci),Math.abs(j-cj))!==r)continue;const L=G.get(key(i,j));if(L)for(const p of L){const d=Math.hypot(p[0]-x,p[1]-y);if(d<best)best=d}}if(best<=r*C)break}return best};
const nearZ=(x,y)=>{let b=1e9;for(const r of ZR){const dx=Math.max(r[0]-x,0,x-r[1]),dy=Math.max(r[2]-y,0,y-r[3]);const d=Math.hypot(dx,dy);if(d<b)b=d}return b};
const own=(x,y)=>BIOMES.own?BIOMES.own(x,y):-1;const q=(a,p)=>a.length?a[Math.min(a.length-1,Math.floor(a.length*p))]:null;
const out={K:WS.K,mundo:[WW,WH],PO:(typeof PO!=='undefined'?PO.length:0),M:M.length,ZS:ZS.length,porBioma:{}};let allA=[],allB=[],allC=[];out.importantes=P2.length;
for(let k=0;k<9;k++){const A=[],B=[];let tries=0;while(A.length<NS&&tries<NS*400){tries++;const x=Math.random()*WW,y=Math.random()*WH;if(own(x,y)!==k)continue;if(blk(x,y))continue;const a=nearPt(x,y),z=Math.min(a,nearZ(x,y));A.push(a);B.push(z);allC.push(nearImp(x,y))}
A.sort((u,v)=>u-v);B.sort((u,v)=>u-v);allA=allA.concat(A);allB=allB.concat(B);
const s=(arr,p)=>{const v=q(arr,p);return v==null?null:+(v/WALK).toFixed(1)};out.porBioma[(BI[k]&&BI[k].n)||k]={n:A.length,contenido_andando_s:{med:s(A,.5),p75:s(A,.75),p90:s(A,.9)},cualquier_andando_s:{med:s(B,.5),p90:s(B,.9)}}}
allA.sort((u,v)=>u-v);allB.sort((u,v)=>u-v);allC.sort((u,v)=>u-v);const T=(arr,p,v)=>+(q(arr,p)/v).toFixed(1);
out.total={contenido:{andar_med:T(allA,.5,WALK),andar_p75:T(allA,.75,WALK),andar_p90:T(allA,.9,WALK),correr_med:T(allA,.5,RUN),correr_p90:T(allA,.9,RUN),dentro_60s_andando:+(allA.filter(d=>d/WALK<=60).length/allA.length*100).toFixed(1)},
 importante:{andar_med:T(allC,.5,WALK),andar_p75:T(allC,.75,WALK),andar_p90:T(allC,.9,WALK),correr_med:T(allC,.5,RUN),dentro_60s_andando:+(allC.filter(d=>d/WALK<=60).length/allC.length*100).toFixed(1)},
 cualquier:{andar_med:T(allB,.5,WALK),andar_p90:T(allB,.9,WALK),dentro_30s_andando:+(allB.filter(d=>d/WALK<=30).length/allB.length*100).toFixed(1)}};
out.cruzar_mundo_corriendo_min={NS:+(WH/RUN/60).toFixed(1),EO:+(WW/RUN/60).toFixed(1)};return out})"""
async def run(p, k, n):
    b = await p.chromium.launch(headless=False, args=['--ignore-gpu-blocklist'])
    pg = await (await b.new_context(viewport={'width': 800, 'height': 500})).new_page()
    await pg.goto(f'http://127.0.0.1:8811/index.html?noedit&test=1&wk={k}&map=A', wait_until='commit')
    await pg.wait_for_function('window.__nstestReady===true', timeout=600000)
    await pg.wait_for_timeout(3000)
    r = await pg.evaluate(JS + f'({n})'); await b.close(); return r
async def main(a):
    res = []
    async with async_playwright() as p:
        for k in a.k.split(','):
            try: r = await run(p, k, a.n)
            except Exception as e: r = {'K': k, 'error': str(e)[:300]}
            print(json.dumps(r, ensure_ascii=False), flush=True); res.append(r)
    if a.json: open(a.json, 'w', encoding='utf8').write(json.dumps(res, indent=1, ensure_ascii=False))
asyncio.run(main(ap.parse_args()))
