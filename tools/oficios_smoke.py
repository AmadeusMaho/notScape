#!/usr/bin/env python3
"""Prueba de humo de la interfaz de oficios (D5, 26 oct 2026; docs/HOJA_DE_RUTA.md Fase 3·d).
Necesita la sesión rápida:  python tools/fast/ns.py start --no3d
Uso:  PYTHONUTF8=1 python tools/oficios_smoke.py [clave_de_oficio ...]   (sin argumentos = todos los de WKUI.REG)
Por cada oficio con hoja de trabajo comprueba: arrancar pieza (panel + barra), éxito (la pieza sale y da XP), fallo SIN pérdida de
materiales, aviso de nivel (acciones nuevas), equipo de oficio (OFGEAR), guardado (barra/macros serializan), arrastre real con ratón
(libro -> casilla) y macro (se ejecuta). Un oficio nuevo se prueba solo con registrarlo en WKUI.reg. Sale con código 1 si hay FALLO."""
import subprocess, sys, json, time, pathlib
R = pathlib.Path(__file__).resolve().parent.parent
NS = [sys.executable, str(R / 'tools/fast/ns.py')]

def run(*a):
    p = subprocess.run(NS + list(a), capture_output=True, text=True, encoding='utf-8')
    return (p.stdout or '').strip(), p.stderr

def ev(js):
    out, err = run('eval', js)
    lines = out.splitlines()
    if not lines:
        raise RuntimeError('sin salida de ns.py: ' + err[-300:])
    v = lines[-1]
    try:
        v = json.loads(v)
        if isinstance(v, str):
            try: v = json.loads(v)
            except Exception: pass
    except Exception:
        pass
    return v

fails, warns = [], []
def chk(ok, msg, fatal=True):
    print(('  ok     ' if ok else ('  FALLO  ' if fatal else '  AVISO  ')) + msg)
    if not ok: (fails if fatal else warns).append(msg)
    return ok

# sesión viva
try:
    n = ev('typeof WKUI')
except Exception as e:
    print('No hay sesión rápida (python tools/fast/ns.py start --no3d):', e); sys.exit(2)
if n != 'object':
    print('WKUI no existe en la página:', n); sys.exit(2)

want = sys.argv[1:] or ev('JSON.stringify(Object.keys(WKUI.REG))')
print('Oficios con hoja de trabajo:', ', '.join(want))

# S.stn se limpia entre llamadas: fijar la estación y arrancar en la MISMA evaluación
START = "(()=>{const st=ST.find(s=>WKUI.REG['%s'].stn.includes(s.id))||{id:WKUI.REG['%s'].stn[0],x:P.x,y:P.y-30,sks:['%s'],nodraw:1};NSTEST.tp(st.x,st.y+30);S.stn=st;startC('%s',%d);return 1})()"

# ---- preparación común: estación + materiales de la 1.ª receta posible
SETUP = r"""(sk=>{stopA();S.inv.length=0;const r=WKUI.REG[sk];const st=ST.find(s=>r.stn.includes(s.id))||{id:r.stn[0],x:P.x,y:P.y-30,sks:[sk],nodraw:1};
S.stn=st;if(typeof ISLA!=='undefined')ISLA.lock=()=>false;S.xp[sk]=Math.max(S.xp[sk]||0,XT[30]);const L0=L(sk);
if(sk==='en'){CHEAT.give('sw_cobre',1);ENCH.rebuild()}   /* Encantamiento: las recetas salen de las armas que llevas */
let i=ACT[sk].findIndex(a=>a.length===6&&L0>=rq(a)&&!ownT(a));if(i<0)return JSON.stringify({err:'sin receta'});
const a=ACT[sk][i];for(const g in a[1])CHEAT.give(g,12);
return JSON.stringify({i,name:a[0],ing:a[1],lvl:L0,out:a[2]})})"""

for sk in want:
    print(f'\n== {sk} ==')
    ev('stopA()')
    info = ev(SETUP + f"('{sk}')")
    if not isinstance(info, dict) or info.get('err'):
        chk(False, f'preparación: {info}'); continue
    i, ing = info['i'], info['ing']
    cnt = lambda: ev("JSON.stringify(" + json.dumps(list(ing)) + ".map(g=>count(g)))")
    # 1 arrancar pieza
    ev(START % (sk, sk, sk, sk, i))
    s = ev("JSON.stringify({wk:!!(A&&A.wk),disp:(document.getElementById('wk')||{style:{}}).style.display,bar:WKUI.REG&&(S.wkb&&S.wkb['%s']?S.wkb['%s'].bar.filter(Boolean).length:-1)})" % (sk, sk))
    chk(s['wk'] and s['disp'] == 'flex' and s['bar'] > 0, f"arranca «{info['name']}»: hoja abierta y barra con {s['bar']} acciones")
    # 2 éxito: usar el planificador hasta terminar
    before = cnt(); xp0 = ev(f"S.xp['{sk}']||0"); out0 = ev(f"count('{info['out'].split('~')[0]}')") if isinstance(info['out'], str) else 0
    done = False
    for _ in range(80):
        st = ev("(()=>{const w=A&&A.wk;if(!w)return 'none';if(w.s.over)return 'over';const id=WK.suggest(w.s);if(!id)return 'noid';return WKUI.use(id)?'used':'wait'})()")
        if st in ('over', 'none'): done = True
        if st == 'noid': break
        if done: break
        time.sleep(0.25 if st == 'wait' else 0.7)
    time.sleep(1.2)  # endAt -> finish -> consume y entrega
    after = cnt(); xp1 = ev(f"S.xp['{sk}']||0")
    chk(done, 'la pieza termina (over) en <= 80 acciones')
    chk(any(a < b for a, b in zip(after, before)), f'consume materiales al terminar ({before} -> {after})')
    chk(xp1 > xp0, f'da XP ({xp0} -> {xp1})')
    # 3 fallo sin pérdida: dur=1 y gastar durabilidad
    ev("stopA()"); ev(START % (sk, sk, sk, sk, i))
    b2 = cnt()
    st = None
    for _ in range(6):
        st = ev("(()=>{const w=A&&A.wk;if(!w)return 'none';w.s.dur=WK.cost(w.s,'sb');return WKUI.use('sb')?'used:'+w.s.over+':'+w.s.ok:'wait'})()")
        if str(st).startswith('used'): break
        time.sleep(0.7)
    time.sleep(2.2)
    b3 = cnt()
    chk(str(st).startswith('used:true:false'), f'la pieza se agota (resultado: {st})', fatal=False)
    chk(b3 == b2 or not str(st).startswith('used:true:false'), f'fallo sin perder materiales ({b2} -> {b3})')
    ev("stopA()")
    # 4 aviso de nivel
    ev("log('x')")
    ev(f"WKUI.onLevel('{sk}',1,40)")
    time.sleep(0.4)
    lg = ev("document.getElementById('log').innerText")
    new = ev(f"JSON.stringify(WK.list('{sk}',40).filter(id=>WK.A[id].lv>1&&!WK.A[id].spec).length)")
    chk(new == 0 or 'Nueva acci' in str(lg), f'aviso de nivel ({new} acciones nuevas entre nv 1 y 40)')
    # 5 equipo de oficio
    g = ev(f"(()=>{{try{{const b=OFGEAR.bonus('{sk}');return JSON.stringify({{ok:true,t:typeof b}})}}catch(e){{return JSON.stringify({{ok:false,e:String(e)}})}}}})()")
    chk(g.get('ok'), f'OFGEAR.bonus({sk}) sin error ({g})')
    # 6 guardado: barra y macros serializan idénticas
    sv = ev(f"(()=>{{const st=ST.find(s=>WKUI.REG['{sk}'].stn.includes(s.id))||{{id:WKUI.REG['{sk}'].stn[0],x:P.x,y:P.y-30,sks:['{sk}'],nodraw:1}};NSTEST.tp(st.x,st.y+30);S.stn=st;startC('{sk}',{i});const b=S.wkb['{sk}'];const a=JSON.stringify(b);const r=JSON.stringify(JSON.parse(a));stopA();return JSON.stringify({{same:a===r,len:b.bar.length,mac:b.mac.length}})}})()")
    chk(sv['same'] and sv['len'] == 20 and sv['mac'] == 3, f'guardado: barra 20 casillas, 3 macros, serializa igual ({sv})')
    # 7 arrastre real: acción del libro -> casilla vacía
    ev("stopA();delete S.wkb['%s']" % sk); ev(START % (sk, sk, sk, sk, i))
    geo = ev("""(()=>{const w=document.getElementById('wk');const b=S.wkb[Object.keys(S.wkb).pop()];const f0=b.bar.findIndex(Boolean),vid=b.bar[f0];b.bar[f0]=null;WKUI.render();const e=f0;
const ids=[vid];
if(e<0||!ids.length)return JSON.stringify({skip:true});
const s=w.querySelector('.wk-a[data-w="'+ids[0]+'"]'),t=w.querySelector('.wk-sl[data-slot="'+e+'"]');
if(!s||!t)return JSON.stringify({skip:true});const a=s.getBoundingClientRect(),c=t.getBoundingClientRect();
return JSON.stringify({id:ids[0],slot:e,ax:a.x+a.width/2,ay:a.y+a.height/2,bx:c.x+c.width/2,by:c.y+c.height/2})})()""")
    if geo.get('skip'):
        chk(False, 'arrastre: sin acción libre o casilla vacía para probar (barra llena)', fatal=False)
    else:
        acts = [{"t": "move", "x": geo['ax'], "y": geo['ay']}, {"t": "down"}, {"t": "move", "x": geo['bx'], "y": geo['by'], "steps": 10}, {"t": "wait", "ms": 200}, {"t": "up"}]
        run('mouse', json.dumps(acts)); time.sleep(0.5)
        got = ev(f"S.wkb['{sk}'].bar[{geo['slot']}]")
        chk(got == geo['id'], f"arrastre libro->casilla {geo['slot']}: «{geo['id']}» (quedó {got})")
    # 8 macro: se ejecuta
    ev("(()=>{S.inv.length=0;for(const g in ACT[A.sk][A.i][1])CHEAT.give(g,6);return 1})()")   # hueco y materiales para que la pieza no se detenga por la mochila llena
    mac = ev(f"(()=>{{const b=S.wkb['{sk}'];const ids=WK.list('{sk}',L('{sk}')).filter(id=>!WK.A[id].spec&&WK.A[id].t==='p'&&(WK.A[id].e||0)<=200&&!WK.can(A.wk.s,id));b.mac[0]=ids.slice(0,2);const m='m0';b.bar[19]=m;WKUI.render();A.wk.s.progMax=99999;const n0=A.wk.s.hist.length;const el=document.getElementById('wk').querySelector('.wk-sl[data-mi=\"0\"]');if(!el)return JSON.stringify({{err:'sin casilla de macro'}});el.click();return JSON.stringify({{n0,ids:b.mac[0]}})}})()")
    if isinstance(mac, dict) and mac.get('err'):
        chk(False, 'macro: ' + mac['err'], fatal=False)
    else:
        time.sleep(2.2)
        n1 = ev("A&&A.wk?A.wk.s.hist.length:-1")
        chk(n1 > mac['n0'], f"macro ejecuta sus acciones (historial {mac['n0']} -> {n1})")
    ev("stopA()")

# consola limpia
out, _ = run('logs')
errs = [l for l in out.splitlines() if 'error' in l.lower() and 'seams' not in l]
chk(not errs, 'consola sin errores' + (': ' + errs[0][:120] if errs else ''))

print('\nRESULTADO:', 'FALLO' if fails else 'OK', f'({len(fails)} fallos, {len(warns)} avisos)')
sys.exit(1 if fails else 0)
