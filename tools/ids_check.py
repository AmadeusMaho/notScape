#!/usr/bin/env python3
"""Comprobación de ids del juego (D0, 23 oct 2026; docs/REGLAS_CREACION.md §13). Necesita la sesión rápida: `python tools/fast/ns.py start --no3d`.
Uso:  PYTHONUTF8=1 python tools/ids_check.py   → lista los ids que no existen en I (drops, recetas, equipo, objetos de misión) y los que rompen la forma (minúsculas, ASCII).
Sale con código 1 si hay ids INEXISTENTES (un drop con errata no suelta nada y no avisa). Las formas raras de ids antiguos solo se muestran como aviso."""
import subprocess, sys, json, pathlib
R = pathlib.Path(__file__).resolve().parent.parent
JS = r"""(()=>{const bad=[],form=[];const ok=id=>!!I[String(id).split('~')[0]];
for(const k in MD){const m=MD[k];(m.dr||[]).forEach(d=>{if(!ok(d[0]))bad.push('MD.'+k+'.dr → '+d[0])});if(m.rare&&!ok(m.rare[0]))bad.push('MD.'+k+'.rare → '+m.rare[0])}
for(const sk in ACT)ACT[sk].forEach((a,i)=>{if(a.length!==6)return;for(const g in a[1])if(!ok(g))bad.push('ACT.'+sk+'['+i+'] «'+a[0]+'» ingrediente → '+g);const o=String(a[2]||'');if(o&&!/^(tl:|rn_)/.test(o)&&!ok(o))bad.push('ACT.'+sk+'['+i+'] «'+a[0]+'» resultado → '+o)});
if(typeof OFGEAR!=='undefined')for(const g in OFGEAR.G)if(!ok(g))bad.push('OFGEAR.G → '+g);
if(typeof QITEM!=='undefined')QITEM.forEach(q=>{if(!ok(q))bad.push('QITEM → '+q)});
for(const k in I)if(!/^[a-z0-9_]+(~[0-3])?$/.test(k))form.push(k);
return JSON.stringify({n:Object.keys(I).length,bad,form})})()"""
p = subprocess.run([sys.executable, str(R / 'tools/fast/ns.py'), 'eval', JS], capture_output=True, text=True, encoding='utf-8')
out = (p.stdout or '').strip().splitlines()
try:
    d = json.loads(json.loads(out[-1]))
except Exception:
    print('No pude leer la sesión rápida (¿está en marcha `python tools/fast/ns.py start --no3d`?):', (p.stdout + p.stderr)[-400:]); sys.exit(2)
print(f"ids en I: {d['n']}")
for b in d['bad']: print('FALLO   id inexistente:', b)
for f in d['form'][:20]: print('AVISO   forma de id no estándar:', f)
if len(d['form']) > 20: print(f"AVISO   … y {len(d['form']) - 20} más con forma no estándar")
print(f"\nRESULTADO: {'FALLO' if d['bad'] else 'OK'} ({len(d['bad'])} inexistentes, {len(d['form'])} de forma no estándar)")
sys.exit(1 if d['bad'] else 0)
