#!/usr/bin/env python3
"""TIEMPO PARA MATAR (lote COMBATE-PESO, 2 nov 2026). Mide con las funciones REALES del juego (hitChance, mxs, manMs, HPF, MSF, SB, CSK.UPLIFT) cuántos segundos tarda el héroe
en matar a cada tipo de enemigo de SU nivel con el equipo de su nivel, por familia de arma, y comprueba los OBJETIVOS del dueño (docs/REGLAS_CREACION.md §8):
  común 6–10 s · élite 20–30 s · capitán 45–60 s · jefe 80–120 s (con uso medio de habilidades: ×(1+UPLIFT)). Solo CUENTAN las filas de la Pradera (nv ≤ 15; regla «un bioma se cierra
  antes del siguiente»): los demás biomas se ajustan a estos objetivos al cerrarlos (sus jefes usan su propio MSF). «tier +» = cuánto más rápido mata la espada de ese nivel que la de 12 niveles antes (informativo);
  daga y mandoble sin más de +15 % de DPS que una espada de botín de la misma fuerza (`eqSw`; el mandoble barre: su tope es +15 % con un solo objetivo).
Uso:  python tools/fast/ns.py start --gpu --url '?r3d=1&test=1&noedit&defmap'   (una vez)   ·   python tools/ttk_check.py [--pradera]
Modelo: golpe medio = acierto·(1+máx)/2·(1+crít·0,75)·1,2 (combo de 3: el último ×1,6), cada manMs(); sin estados, encantamientos ni comida. Si tocas HPK/HPF/MSF/SB/SWDMG/STRK, vuelve a correrlo."""
import json, subprocess, sys, os
here = os.path.dirname(os.path.abspath(__file__))
JS = r"""(()=>{const sv=JSON.stringify(S),out={rows:[],pra:[],up:CSK.UPLIFT};
 const xpL=l=>XT[Math.max(1,Math.min(99,l))]||0,setL=l=>{S.xp.cb=xpL(l);S.xp.ra=xpL(l)};
 const swOf=l=>{let b=null;for(const t of TI)if(t[3]<=l)b='sw_'+t[0];return b},bwOf=l=>{let b=null;WO.forEach((w,i)=>{if(w[3]<=l&&BOW['bw_'+WON[i]])b='bw_'+WON[i]});return b},
  kOf=l=>{let b=0;for(let k=0;k<6;k++)if((BI[k].lv||1)<=l)b=k;return b};
 const per=(w,m)=>{S.eq.w=w;const h=hitChance(m),mx=mxs(),cr=Math.max(0,pv('crit'))/100;return h*dAvg(mx)*(1+cr*.75)*1.2/(manMs()/1000)};
 const fake=(id,lv,f)=>({d:MD[id]||MD.goblin,lv,x:P.x+40,y:P.y,hp:1,mh:1,f});
 const ROLE={comun:1,elite:3,capitan:MSF.k0[0],jefe:MSF.b0[0]};
 for(const L of [5,10,15,25,35,50,65,80,95]){setL(L);const k=kOf(L),sw=swOf(L),ws={espada:sw,daga:'lw_'+k+'d2',mandoble:'lw_'+k+'m2',arco:bwOf(L),ballesta:'lw_'+k+'b2'};
  const r={L,arma:{},ttk:{}};const m=fake('goblin',L);
  for(const [f,w] of Object.entries(ws)){if(!w||!WB[w]){r.arma[f]=null;continue}r.arma[f]={id:w,dps:per(w,m)}}
  {const mw='lw_'+k+'m2';SW.__eq=SW[mw];WB.__eq=SW[mw];SB.__eq=SB[mw];r.eqSw=per('__eq',m);   /* espada de BOTÍN equivalente (misma fuerza que el mandoble: STRK.m = 1): base justa para comparar familias */
   const bw=BOW[bwOf(L)]!=null?bwOf(L):null;delete SW.__eq;delete WB.__eq;delete SB.__eq}
  const prev=swOf(Math.max(1,L-12));r.prevSw=prev;if(prev&&prev!==sw)r.tierGain=per(sw,m)/per(prev,m)-1;
  for(const [role,f] of Object.entries(ROLE)){const hp=Math.max(3,Math.round(HPF(L)*f));r.ttk[role]={hp,s:hp/(r.arma.espada.dps*(1+CSK.UPLIFT))}}
  out.rows.push(r)}
 for(const L of [5,10,15]){setL(L);const sw=swOf(L);for(const id of ['slime','goblin','goblinarq','goblinsha','espantapajaros','bandido','banasesino','orco','orcocampeon','k0','b0']){if(!LVR[id]||!MSF[id])continue;
  const lv=Math.round((LVR[id][0]+LVR[id][1])/2),m=fake(id,lv),hp=Math.max(3,Math.round(HPF(lv)*MSF[id][0]));
  out.pra.push({L,sw,id,lv,hp,s:hp/(per(sw,m)*(1+CSK.UPLIFT)),sm:hp/(per('lw_0m2',m)*(1+CSK.UPLIFT))})}}
 const s=JSON.parse(sv);for(const k of Object.keys(S))if(!(k in s))delete S[k];Object.assign(S,s);return JSON.stringify(out)})()"""
out = subprocess.run([sys.executable, os.path.join(here, 'fast', 'ns.py'), 'eval', JS], capture_output=True, text=True, encoding='utf-8').stdout.strip().splitlines()[-1]
D = json.loads(json.loads(out))
GOAL = {'comun': (6, 10), 'elite': (20, 30), 'capitan': (45, 60), 'jefe': (80, 120)}
bad = 0
print(f"UPLIFT habilidades = {D['up']}\n")
print(' nv | espada              | común       | élite       | capitán     | jefe        | tier +  | DPS frente a espada de botín igual')
for r in D['rows']:
    cells = []
    for role, (a, b) in GOAL.items():
        s = r['ttk'][role]['s']; ok = a * .9 <= s <= b * 1.1
        if not ok and r['L'] <= 15: bad += 1
        cells.append(f"{s:5.1f}s {'ok' if ok else '!!'}")
    tg = r.get('tierGain'); tgs = f"{tg*100:+5.0f}%" if tg is not None else '   — '
    base = r['eqSw']
    rel = ' '.join(f"{f} {v['dps']/base*100-100:+.0f}%" for f, v in r['arma'].items() if v and f in ('daga', 'mandoble'))
    for f, v in r['arma'].items():
        if v and f in ('daga', 'mandoble') and r['L'] >= 35 and v['dps'] / base > 1.15 + 1e-6: bad += 1; rel += f' !!{f}'   # nv < 35: fuerza de 3–9 puntos y golpes pequeños: 1 punto ≈ ±8 % y el redondeo (mín. 1 por golpe) favorece al arma rápida: informativo
    print(f" {r['L']:2} | {r['arma']['espada']['id']:19} | " + ' | '.join(cells) + f" | {tgs} | {rel}")
if '--pradera' in sys.argv or True:
    print('\nPRADERA (s para matar con habilidades; espada de tu nivel · mandoble lw_0m2):')
    for p in D['pra']:
        print(f"  héroe nv {p['L']:2} {p['sw']:10} vs {p['id']:15} nv {p['lv']:2} ({p['hp']:3} PV): espada {p['s']:5.1f}s · mandoble {p['sm']:5.1f}s")
print(f"\nRESULTADO: {'OK' if not bad else 'FUERA DE OBJETIVO'} ({bad} casillas fuera)")
