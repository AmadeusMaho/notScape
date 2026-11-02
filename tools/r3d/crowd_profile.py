"""NotScape · PERFIL DE CPU con MUCHAS criaturas en pantalla (2 nov 2026; el dueño: «con muchos enemigos bajan los fps al moverme o girar la cámara; quieto vuelven a 100+»).
Coloca ~N criaturas alrededor del héroe (mundo por defecto, calidad Máxima, lienzo grande), mide 3 fases de 4 s — QUIETO, GIRANDO LA CÁMARA y ANDANDO — y en cada una:
ms por fotograma (mediana/p95), «JS dibujo», GPU del mundo y el reparto de tiempo por función (envoltorios) + el perfil de CPU de Chrome (funciones con más tiempo propio).
Uso (servidor en 8811):  PYTHONUTF8=1 python tools/r3d/crowd_profile.py [--n 40] [--thr 1] [--q 0]"""
import asyncio, argparse, json, collections
from playwright.async_api import async_playwright
ap = argparse.ArgumentParser(); ap.add_argument('--n', type=int, default=40); ap.add_argument('--thr', type=float, default=1); ap.add_argument('--q', default='0'); ap.add_argument('--top', type=int, default=22); ap.add_argument('--css', default=''); ap.add_argument('--phases', default='quieto,girar,andar'); ap.add_argument('--who', default='')
a = ap.parse_args()
WRAP = r"""(()=>{if(window.__W)return;window.__W={};const wrap=(o,k,n)=>{if(!o)return;const f=o[k];if(typeof f!=='function'||f.__w)return;const g=function(...x){const t=performance.now();try{return f.apply(this,x)}finally{__W[n]=(__W[n]||0)+performance.now()-t}};g.__w=1;o[k]=g};
const D=R3D.dbg||{};[[window,'upd','upd'],[window,'draw','draw'],[R3D,'frame','R3D.frame'],[R3D.terr,'update','terreno'],[R3D.renderer,'render','gl.render'],[D.composer,'render','composer'],[R3D.actors,'update','actores'],[R3D.water,'reflect','reflejo'],[R3D.renderer.shadowMap,'render','sombra'],[typeof WMAP!=='undefined'?WMAP:null,'paint','mapa'],[R3D.gate,'tick','compuerta'],[R3D.drops,'update','suelo'],[window,'dMo','placas(dMo)'],[window,'npDeb','npDeb'],[window,'hsDraw','números'],[R3D.impact,'update','impact'],[R3D.aura,'update','aura'],[R3D.body,'update','body'],[R3D.skill,'update','skill'],[R3D.blood,'update','sangre'],[window,'drawMap','minimapa'],[typeof HUDSU!=='undefined'?HUDSU:null,'frame','hud.frame']].forEach(x=>wrap(...x))})()"""
PHASE = r"""async(mode)=>{const W=ms=>new Promise(r=>setTimeout(r,ms));for(const k in __W)__W[k]=0;const kd=k=>dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true})),ku=k=>dispatchEvent(new KeyboardEvent('keyup',{key:k,bubbles:true}));
 const t=[],g=[];let l=performance.now(),run=true;const t0=l;const az0=R3D.az;
 if(mode==='andar')(async()=>{for(const k of ['d','s','a','w','d','s']){kd(k);await W(650);ku(k)}})();
 await new Promise(res=>{const f=()=>{const n=performance.now();t.push(n-l);l=n;if(mode==='girar')R3D.az=az0+(n-t0)/1000*1.2;if(R3D.gpu&&R3D.gpu.mundo!=null)g.push(R3D.gpu.mundo);if(n-t0<4000)requestAnimationFrame(f);else res()};requestAnimationFrame(f)});
 t.sort((x,y)=>x-y);g.sort((x,y)=>x-y);const fr=t.length,rep={};for(const k in __W)rep[k]=+(__W[k]/fr).toFixed(2);
 return {fr,fps:+(fr/4).toFixed(0),med:+t[fr>>1].toFixed(1),p95:+t[Math.floor(fr*.95)].toFixed(1),gpu:+(g[g.length>>1]||0).toFixed(1),msPorFotograma:Object.fromEntries(Object.entries(rep).filter(e=>e[1]>.05).sort((x,y)=>y[1]-x[1]))}}"""
async def main():
  async with async_playwright() as p:
    b = await p.chromium.launch(headless=False, args=['--ignore-gpu-blocklist','--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding','--disable-background-timer-throttling'])
    ctx = await b.new_context(viewport={'width':1718,'height':655}, device_scale_factor=2)
    await ctx.add_init_script("try{localStorage.setItem('ns_q','%s')}catch(e){}" % a.q)
    pg = await ctx.new_page()
    await pg.goto('http://127.0.0.1:8811/index.html?test=1&noedit&defmap', wait_until='commit')
    await pg.wait_for_function('window.__nstestReady===true', timeout=600000)
    await pg.wait_for_timeout(4000)
    await pg.evaluate("""async(N)=>{const W=ms=>new Promise(r=>setTimeout(r,ms));ISLA.lock=()=>false;P.hp=99999;CHEAT.god=1;const B=BIOMES.list[0];let x=0,y=0;for(let i=0;i<60;i++){const a=i*.7,r=1800+i*40;x=B.ox+B.cen[0]+Math.cos(a)*r;y=B.oy+B.cen[1]+Math.sin(a)*r;if(!blk(x,y)&&!inVilla(x,y)&&!blk(x+200,y+200))break}NSTEST.tp(x,y);await W(3000);
      const ids=['cabra','zorrorojo','conejo','orco','goblin','oveja','cerdo','bandido'];for(let i=0;i<N;i++){const a=i/N*6.283*2.3,r=60+(i%7)*35;mob(ids[i%ids.length],x+Math.cos(a)*r,y+Math.sin(a)*r);const m=M[M.length-1];m.dm=0}await W(4000)}""", a.n)
    await pg.evaluate(WRAP)
    if a.css: await pg.evaluate("(c)=>{const s=document.createElement('style');s.textContent=c;document.head.appendChild(s)}", a.css)
    cdp = await ctx.new_cdp_session(pg)
    await cdp.send('Emulation.setCPUThrottlingRate', {'rate': a.thr})
    await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', {'interval': 200})
    for mode in a.phases.split(','):
      await cdp.send('Profiler.start')
      r = await pg.evaluate('(' + PHASE + ')', mode)
      prof = (await cdp.send('Profiler.stop'))['profile']
      nodes = {n['id']: n for n in prof['nodes']}; self_t = collections.Counter()
      dt = prof.get('timeDeltas', []); smp = prof.get('samples', [])
      for i, s in enumerate(smp):
        n = nodes[s]; cf = n['callFrame']; key = (cf['functionName'] or '(anónima)') + ' ' + cf['url'].split('/')[-1] + ':' + str(cf['lineNumber'] + 1)
        self_t[key] += dt[i] / 1000 if i < len(dt) else 0
      tot = sum(self_t.values()) or 1
      print('=== ' + mode.upper() + ' ===', json.dumps({k: v for k, v in r.items() if k != 'msPorFotograma'}, ensure_ascii=False), flush=True)
      print('  envoltorios ms/fotograma:', json.dumps(r['msPorFotograma'], ensure_ascii=False), flush=True)
      for k, v in self_t.most_common(a.top): print('   %5.1f%%  %7.1f ms  %s' % (100 * v / tot, v, k[:120]), flush=True)
      if a.who:
        par = {}
        for n in prof['nodes']:
          for c in n.get('children', []): par[c] = n['id']
        cnt = collections.Counter()
        for n in prof['nodes']:
          if n['callFrame']['functionName'] == a.who:
            q = par.get(n['id']); path = []
            while q and len(path) < 4: cf = nodes[q]['callFrame']; path.append((cf['functionName'] or '?') + ':' + str(cf['lineNumber'] + 1)); q = par.get(q)
            cnt[' <- '.join(path)] += n.get('hitCount', 0)
        print('  quién llama a', a.who, cnt.most_common(5), flush=True)
    await b.close()
asyncio.run(main())
