#!/usr/bin/env python3
"""NotScape · E1 de la Fase 3·e (26 oct 2026): coste REAL del tamaño del mundo (`?wk=K`) en 3D con GPU real.
Por cada K mide: carga, nº de recursos/criaturas, montón de JS, objetos de escena, geometrías/texturas en GPU, tamaño del guardado y de la niebla,
fps en reposo y CORRIENDO (tirones por zona nueva) y R3D.budget(). Uso (servidor en 8811):  python tools/r3d/world_scale_check.py --k 2,3,4,5 --q 1 [--json x.json]"""
import asyncio, json, argparse
from playwright.async_api import async_playwright
TP = """(()=>{if(typeof ISLA!=='undefined'&&ISLA.lock)ISLA.lock=()=>false;const B=BIOMES.list[0];const x=B.ox+B.w/2,y=B.oy+B.h/2;P.x=x;P.y=y;P.mv=null;P.g=null;A=null;ISO.snap(x,y,TER.standZ(x,y));R3D.parts.snap()})()"""
SPIKES = r"""(async(SECS,WALK)=>{const M={cur:{},spk:[],n:0,dts:[]};
const wrap=(o,k,name)=>{if(!o)return;const f=o[k];if(typeof f!=='function'||f.__w)return;const g=function(...a){const t=performance.now();try{return f.apply(this,a)}finally{M.cur[name]=(M.cur[name]||0)+performance.now()-t}};g.__w=1;o[k]=g};
const D=R3D.dbg;[[window,'upd','upd'],[window,'draw','draw'],[window,'panel','panel'],[R3D,'frame','R3D.frame'],[R3D.terr,'update','terreno'],[R3D.renderer,'render','gl.render'],[D.composer,'render','composer'],[D.ar,'render','héroe'],[R3D.actors,'update','actores'],[R3D.water,'reflect','reflejo'],[R3D.renderer.shadowMap,'render','sombra'],[typeof WMAP!=='undefined'?WMAP:null,'paint','mapa'],[R3D.gate,'tick','compuerta'],[R3D.drops,'update','suelo']].forEach(a=>wrap(...a));
const kd=k=>dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true})),ku=k=>dispatchEvent(new KeyboardEvent('keyup',{key:k,bubbles:true}));
if(WALK)(async()=>{kd('Shift');for(const k of ['d','s','d','s','a','w','a','s','d','d']){kd(k);await new Promise(r=>setTimeout(r,SECS*100));ku(k)}ku('Shift')})();
let last=performance.now();const t0=last;
await new Promise(res=>{const f=now=>{const d=now-last;last=now;M.n++;M.dts.push(d);if(d>34)M.spk.push({t:Math.round(now-t0),ms:Math.round(d),w:Object.fromEntries(Object.entries(M.cur).filter(e=>e[1]>.7).map(([k,v])=>[k,+v.toFixed(1)]))});M.cur={};if(now-t0<SECS*1000)requestAnimationFrame(f);else res()};requestAnimationFrame(f)});
const s=M.dts.slice().sort((a,b)=>a-b),q=p=>+s[Math.floor(s.length*p)].toFixed(1);
return {fotogramas:M.n,fps:+(M.n/SECS).toFixed(1),med:q(.5),p95:q(.95),p99:q(.99),max:+s[s.length-1].toFixed(1),mas34:M.spk.length,mas50:M.spk.filter(x=>x.ms>50).length,peores:M.spk.sort((a,b)=>b.ms-a.ms).slice(0,6)}})"""

STATS = """(()=>{const b=R3D.budget(),i=R3D.renderer.info;let sf=0,ss=0;try{sf=JSON.stringify(S.fog||0).length;ss=JSON.stringify(S).length}catch(e){}
return {K:(window.WS&&WS.K)||null,N:typeof N!=='undefined'?N.length:null,M:typeof M!=='undefined'?M.length:null,mundo:[WW,WH],heapMB:Math.round(performance.memory.usedJSHeapSize/1048576),
objs:b.objs,tris:b.tris,calls:b.calls,progs:b.progs,ok:b.ok,geom:i.memory.geometries,tex:i.memory.textures,fogB:sf,saveB:ss}})()"""
async def run(p, k, a):
    out = {'K': k}
    b = await p.chromium.launch(headless=False, args=['--ignore-gpu-blocklist', '--enable-precise-memory-info'])
    ctx = await b.new_context(viewport={'width': a.w, 'height': a.h})
    await ctx.add_init_script("try{localStorage.setItem('ns_q','%s')}catch(e){}" % a.q)
    pg = await ctx.new_page(); logs = []
    pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:160]) if m.type == 'error' or 'PRESUPUESTO' in m.text else None)
    pg.on('pageerror', lambda e: logs.append('ERR ' + str(e)[:160]))
    t0 = asyncio.get_event_loop().time()
    await pg.goto(f'http://127.0.0.1:8811/index.html?noedit&test=1&load&wk={k}{a.extra}', wait_until='commit')
    await pg.wait_for_function('window.__nstestReady===true', timeout=600000)
    await pg.wait_for_function("(()=>{const b=document.querySelector('#boot');return b&&getComputedStyle(b).display==='none'})()", timeout=600000, polling=250)
    out['carga_s'] = round(asyncio.get_event_loop().time() - t0, 1)
    await pg.evaluate(TP); await pg.wait_for_timeout(12000)
    out['reposo_stats'] = await pg.evaluate(STATS)
    out['reposo'] = await pg.evaluate(SPIKES + f'({a.secs},false)')
    out['corriendo'] = await pg.evaluate(SPIKES + f'({a.secs},true)')
    out['tras_correr'] = await pg.evaluate(STATS)
    out['consola'] = logs[-6:]
    await b.close(); return out
async def main(a):
    res = []
    async with async_playwright() as p:
        for k in a.k.split(','):
            try: r = await run(p, k, a)
            except Exception as e: r = {'K': k, 'error': str(e)[:300]}
            print(json.dumps(r, ensure_ascii=False), flush=True); res.append(r)
    if a.json: open(a.json, 'w', encoding='utf8').write(json.dumps(res, indent=1, ensure_ascii=False))
ap = argparse.ArgumentParser(); ap.add_argument('--k', default='2,3,4,5'); ap.add_argument('--q', default='1'); ap.add_argument('--secs', type=int, default=15)
ap.add_argument('--w', type=int, default=1600); ap.add_argument('--h', type=int, default=900); ap.add_argument('--json', default=None); ap.add_argument('--extra', default='')   # p. ej. --extra '&map=A'
asyncio.run(main(ap.parse_args()))
