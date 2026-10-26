#!/usr/bin/env python3
"""NotScape · MEDIDOR DE TIRONES Y BASURA (lote FLUIDEZ, 26 oct 2026; propuesta F1 de docs/PLAN_OPTIMIZACION.md).
Abre el juego en Chromium CON VENTANA (GPU real; SwiftShader no sirve), espera a que acabe la pantalla de carga, va a la plaza de la Pradera y mide:
  · basura de JS por segundo (perfilador de memoria por CDP) y las funciones que más asignan,
  · re-evaluaciones de programa de shader por segundo (three «cambia de programa»; ver REGLAS_CREACION §P14),
  · fotogramas > 34 ms en reposo y CORRIENDO (Mayús+WASD), con desglose por función.
Uso (con el servidor en 8811: python tools/serve_nocache.py 8811):
  python tools/r3d/stutter_check.py [--q 1] [--secs 20] [--no-walk] [--no-heap] [--json salida.json]
Acaba en `RESULTADO: OK` si: basura en reposo ≤ 60 MB/s, re-evaluaciones ≤ 2500/s y ≤ 3 fotogramas > 50 ms en reposo (umbrales para un PC rápido;
en una integrada mira las cifras, no el veredicto)."""
import asyncio, json, sys, os, argparse, collections
from playwright.async_api import async_playwright
URL = 'http://127.0.0.1:8811/index.html?noedit&test=1&load'
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
PROGS = r"""(async()=>{const sc=[R3D.scene,R3D.dbg.aScene];let mat=null;R3D.scene.traverse(o=>{if(!mat&&o.material&&!Array.isArray(o.material))mat=o.material});
let pr=Object.getPrototypeOf(mat);while(pr&&!Object.prototype.hasOwnProperty.call(pr,'customProgramCacheKey'))pr=Object.getPrototypeOf(pr);
const C=new Map();let n=0;const W=f=>function(){n++;C.set(this,(C.get(this)||0)+1);return f.call(this)};const base=pr.customProgramCacheKey;pr.customProgramCacheKey=W(base);
const own=new Map();sc.forEach(s=>s.traverse(o=>{(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(m&&Object.prototype.hasOwnProperty.call(m,'customProgramCacheKey')&&!own.has(m))own.set(m,m.customProgramCacheKey)})}));
own.forEach((f,m)=>m.customProgramCacheKey=W(f));await new Promise(r=>setTimeout(r,3000));pr.customProgramCacheKey=base;own.forEach((f,m)=>m.customProgramCacheKey=f);
return {porSegundo:Math.round(n/3),top:[...C.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([m,k])=>m.type+'#'+m.id+' '+Math.round(k/3)+'/s')}})()"""
async def main(a):
    out = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=False, args=['--ignore-gpu-blocklist', '--enable-precise-memory-info'])
        ctx = await b.new_context(viewport={'width': a.w, 'height': a.h})
        if a.q is not None: await ctx.add_init_script("try{localStorage.setItem('ns_q','%s')}catch(e){}" % a.q)
        pg = await ctx.new_page(); logs = []
        pg.on('console', lambda m: logs.append(m.type + ' ' + m.text) if m.type in ('error',) or 'PRESUPUESTO' in m.text or 'EN JUEGO' in m.text else None)
        pg.on('pageerror', lambda e: logs.append('ERR ' + str(e)))
        t0 = asyncio.get_event_loop().time()
        await pg.goto(URL, wait_until='commit')
        await pg.wait_for_function('window.__nstestReady===true', timeout=300000)
        await pg.wait_for_function("(()=>{const b=document.querySelector('#boot');return b&&getComputedStyle(b).display==='none'})()", timeout=300000, polling=250)
        out['carga_s'] = round(asyncio.get_event_loop().time() - t0, 1)
        await pg.evaluate(TP); await pg.wait_for_timeout(12000)
        out['programas'] = await pg.evaluate('R3D.renderer.info.programs.length')
        if not a.no_heap:
            c = await ctx.new_cdp_session(pg); await c.send('HeapProfiler.enable'); await c.send('HeapProfiler.collectGarbage')
            await c.send('HeapProfiler.startSampling', {'samplingInterval': 4096, 'includeObjectsCollectedByMajorGC': True, 'includeObjectsCollectedByMinorGC': True})
            await pg.wait_for_timeout(8000)
            prof = (await c.send('HeapProfiler.stopSampling'))['profile']; agg = collections.Counter(); tot = 0
            def walk(n):
                nonlocal tot
                cf = n['callFrame']; s = n.get('selfSize', 0); tot += s
                agg[f"{cf['functionName'] or '(anon)'} {cf['url'].split('/')[-1]}:{cf['lineNumber']+1}"] += s
                for ch in n.get('children', []): walk(ch)
            walk(prof['head'])
            out['basura_MBs'] = round(tot / 1e6 / 8, 1); out['basura_top'] = [f'{v/8e6:.2f} MB/s {k}' for k, v in agg.most_common(10)]
        out['programas_reevaluados'] = await pg.evaluate(PROGS)
        out['reposo'] = await pg.evaluate(SPIKES + f'({a.secs},false)')
        if not a.no_walk: out['corriendo'] = await pg.evaluate(SPIKES + f'({a.secs},true)')
        out['presupuesto'] = await pg.evaluate('(()=>{const b=R3D.budget();return {ql:b.ql,tris:b.tris,calls:b.calls,objs:b.objs,progs:b.progs,ok:b.ok}})()')
        out['consola'] = logs[-12:]
        await b.close()
    print(json.dumps(out, indent=1, ensure_ascii=False))
    if a.json: open(a.json, 'w', encoding='utf8').write(json.dumps(out, indent=1, ensure_ascii=False))
    bad = []
    if out.get('basura_MBs', 0) > 60: bad.append('basura en reposo > 60 MB/s')
    if out['programas_reevaluados']['porSegundo'] > 2500: bad.append('re-evaluaciones de programa > 2500/s')
    if out['reposo']['mas50'] > 3: bad.append('más de 3 fotogramas > 50 ms en reposo')
    if any(l.startswith('ERR') or l.startswith('error') and '404' not in l for l in out['consola']): bad.append('errores en consola')
    print('RESULTADO:', 'OK' if not bad else 'FALLO (' + '; '.join(bad) + ')')
ap = argparse.ArgumentParser(); ap.add_argument('--q', default=None); ap.add_argument('--secs', type=int, default=20); ap.add_argument('--w', type=int, default=1600); ap.add_argument('--h', type=int, default=900)
ap.add_argument('--no-walk', action='store_true'); ap.add_argument('--no-heap', action='store_true'); ap.add_argument('--json', default=None)
asyncio.run(main(ap.parse_args()))
