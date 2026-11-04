#!/usr/bin/env python3
"""Equilibrio de los SETS DE MONSTRUO (lote N0.9, docs/PLAN_SETS_MONSTRUO.md §4). Carga el juego REAL (servidor en :8811) y mide para cada set de MSET.SETS:
  · PODER de sus piezas (defensa de AR/LGL/GLL + estadísticas de LOOT/CST ponderadas: def 1 · vida 1 · precisión .8 · fuerza 1,5 · maná .5) frente al equipo NORMAL del mismo tier
    (media de peto/pantalón/guantes/escudo × nº de piezas); y el poder del TRAMO COMPLETO. Objetivo del plan: set completo ≈ +8 % (4 piezas), +12 % (6) o +16 % (8) sobre el equipo normal.
  · COSTE: muertes de monstruo necesarias para reunir los materiales que SOLO caen de criaturas (prob. < 50 %), con un sello/trofeo = 1 muerte del capitán/jefe; y minutos a ~14 s por muerte
    (objetivo del plan: un set completo ≈ 1–2 h de farmeo; los de nivel bajo pueden ser menos).
  · BASE: bonus de los sets base por cultura (2–5 piezas) frente a su tier.
Uso: PYTHONUTF8=1 python tools/sets_balance.py   · acaba en RESULTADO: OK/FALLO (FALLO si algún set completo se sale de [0 %, +100 %] (equipo normal < 10 puntos) o [0 %, +60 %] sobre el normal)."""
import asyncio, json
from playwright.async_api import async_playwright
URL = 'http://127.0.0.1:8811/index.html?r3d=1&noedit'
SEC_KILL = 14.0
JS = """(()=>{const W={def:1,hp:1,acc:.8,str:1.5,mana:.5,mreg:0},pw=o=>Object.keys(o||{}).reduce((t,k)=>t+(W[k]||0)*o[k],0);
 const out={sets:{},base:[]};
 // probabilidad de que un material caiga de un monstruo: dr [id,p] y rare [id,N]
 const prob={};for(const m in MD){for(const d of (MD[m].dr||[]))(prob[d[0]]=prob[d[0]]||[]).push([m,d[1]]);if(MD[m].rare)(prob[MD[m].rare[0]]=prob[MD[m].rare[0]]||[]).push([m,1/MD[m].rare[1]])}
 for(const s in MSET.SETS){const D=MSET.SETS[s],t=D.tier,ti=TI.findIndex(x=>x[0]===t);
  // base de comparación por ranura: peto/pantalón/guantes = el equipo fabricado del tier; casco/botas/amuleto/capa = la pieza de botín verde-azul (calidad 2) del bioma de ese tier
  const k=Math.min(5,OFGEAR.CULT[ti]),slotBase=sl=>sl==='a'?AR['ar_'+t]:sl==='l'?LGL['lg_'+t]:sl==='g'?GLL['gl_'+t]:pw((LOOT['lt_'+k+sl+'2']||{}).st);
  let pieces=0,norm=0,n=0,kills=0;const mats={};
  for(const sl in D.pz){const z=D.pz[sl],id=MSET.idOf(s,sl);if(sl==='w')continue;
   let p=pw(z.st);if(sl==='a')p+=AR[id];else if(sl==='l')p+=LGL[id];else if(sl==='g')p+=GLL[id];n++;pieces+=p;norm+=slotBase(sl)}
  for(const sl in D.pz){const z=D.pz[sl];for(const m in z.ing){const pr=prob[m];if(!pr)continue;const best=Math.max(...pr.map(x=>x[1]));if(best<.5)mats[m]=(mats[m]||0)+z.ing[m]}}
  // muertes: material / probabilidad (una criatura distinta para cada material: se suman; los que caen del mismo monstruo se solapan, así que es una cota superior)
  for(const m in mats){const best=Math.max(...prob[m].map(x=>x[1]));kills+=mats[m]/best}
  const tr=D.tr,full=pw(tr[Math.max(...Object.keys(tr).map(Number))]),acc={};for(const q in tr)for(const k in tr[q])acc[k]=(acc[k]||0)+tr[q][k];const trPow=pw(acc);
  out.sets[s]={n:D.n,tier:t,pieces:Object.keys(D.pz).length,power:pieces,norm,trPow,mats,kills};}
 for(let i=0;i<TI.length;i++){const d={i,tier:TI[i][0],cult:OFGEAR.CULT[i],v:1+Math.floor(i/4)};out.base.push(d)}
 return out})()"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page()
        await pg.goto(URL, wait_until='commit')
        await pg.wait_for_function('typeof MSET!=="undefined"&&typeof MD!=="undefined"&&typeof OFGEAR!=="undefined"', timeout=240000)
        d = await pg.evaluate(JS)
        await b.close()
    bad = []
    tgt = {4: .08, 6: .12, 8: .16}
    print(f"{'SET':16}{'piezas':>7}{'poder':>7}{'normal':>8}{'tramos':>8}{'total %':>9}{'objetivo':>9}{'muertes':>9}{'min':>6}")
    for s, r in d['sets'].items():
        ratio = (r['power'] + r['trPow']) / r['norm'] - 1 if r['norm'] else 0
        t = tgt.get(r['pieces'], .1)
        mins = r['kills'] * SEC_KILL / 60
        flag = ''
        hi = 1.0 if r['norm'] < 10 else .6   # escala pequeña (decisión del dueño, NO ×10): con piezas de 1–3 puntos un solo +1 ya es +30–50 %, así que los límites son holgados
        if ratio < 0 or ratio > hi: flag = f'  <-- FUERA DE [0 %, +{hi*100:.0f} %]'; bad.append(s)
        print(f"{r['n']:16}{r['pieces']:>7}{r['power']:>7.1f}{r['norm']:>8.1f}{r['trPow']:>8.1f}{ratio*100:>8.0f}%{t*100:>8.0f}%{r['kills']:>9.0f}{mins:>6.0f}{flag}")
        if r['mats']: print('    materiales de criatura:', ', '.join(f"{k}×{v}" for k, v in r['mats'].items()))
    print('\nRESULTADO:', 'FALLO (' + ', '.join(bad) + ')' if bad else 'OK')

asyncio.run(main())
