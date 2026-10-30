#!/usr/bin/env python3
"""Equilibrio de las habilidades de combate (src/combatskills.js): DPS sostenido de las habilidades frente al ataque básico, por familia de arma.
Uso:  python tools/fast/ns.py start --gpu --url '?test=1&noedit'   (una vez)   ·   python tools/csk_dps.py [Energía_por_s]
Modelo: básico = ½·P(acierto .75)·SWDMG/2,4/SWSEC por segundo (en múltiplos del golpe máximo); habilidades = reparto voraz de la Energía/s por daño-por-energía,
limitado por el enfriamiento de cada una (sin buffs, estados ni área). Objetivo del diseño (docs/PLAN_HABILIDADES.md §5): media ≈ 0,5 (+50 % de DPS con rotación
perfecta) y ninguna familia fuera de ±15 % de la media. Si cambias coeficientes, costes o `ENR`, vuelve a correrlo."""
import json,subprocess,sys,os
here=os.path.dirname(os.path.abspath(__file__))
js="JSON.stringify(Object.fromEntries(Object.entries(CSK.FAM).map(([k,f])=>[k,{kit:f.kit.map(a=>({id:a.id,cd:a.cd,c:a.c,mp:a.mp,coef:a.coef,n2:a.n2}))}])))"
out=subprocess.run([sys.executable,os.path.join(here,'fast','ns.py'),'eval',js],capture_output=True,text=True,encoding='utf-8').stdout.strip().splitlines()[-1]
F=json.loads(json.loads(out))
SWSEC={'fist':1.1,'dagger':.7,'sword':1,'scepter':1,'bow':1.4,'staff':1.4,'great':2,'xbow':2}
SWDMG={'fist':2,'dagger':1.2,'sword':1.5,'scepter':1.5,'bow':2.4,'staff':2.4,'great':3,'xbow':3}
P=.75;ENR=float(sys.argv[1]) if len(sys.argv)>1 else 1.5
cost=lambda a:a['c'] if a.get('c') else (a.get('mp') or 0)*100   # maná: % del máximo (misma escala que la Energía)
dmg=lambda a:(a.get('coef') or 0)*(a.get('n2') or 1)
res={}
for f,d in F.items():
    bs=.5*P*SWDMG[f]/2.4/SWSEC[f];b=ENR;tot=0
    for a in sorted([a for a in d['kit'] if dmg(a)],key=lambda a:-dmg(a)/cost(a)):
        u=min(1/a['cd'],b/cost(a));tot+=u*dmg(a);b-=u*cost(a)
    res[f]=tot/bs;print('%-8s básico %.3f  habilidades %.3f  ratio %.2f'%(f,bs,tot,tot/bs))
m=sum(res.values())/len(res);print('media %.2f  (objetivo ≈ 0,50; rango %.2f–%.2f)'%(m,.85*m,1.15*m))
bad=[f for f,r in res.items() if abs(r-m)>.15*m];print('RESULTADO:','OK' if not bad else 'FUERA DE ±15 %: '+', '.join(bad))
