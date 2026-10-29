#!/usr/bin/env python3
"""NotScape · SIMULACIÓN DE EQUILIBRIO de Domar y Cocina (lote DOMAR-CIERRE, 29 oct 2026).
Uso:  python tools/doma_sim.py            (lee tools/doma_data.json: XT, XPR, especies, recetas; no necesita el juego)
Refrescar los datos con el juego abierto:  python tools/fast/ns.py eval "JSON.stringify({XT:XT.slice(0,100),XPR:Array.from({length:100},(_,i)=>XPR(i)),sp:Object.values(MTD.E).filter(e=>!e.rare).map(e=>[e.id,e.b,e.lv,e.xp,e.v,e.a]),rn:Object.values(MTD.E).filter(e=>e.rare).map(e=>[e.id,e.lv,e.xp]),rec:COC.X.RECIPES.map(r=>({n:r.name,l:r.lvl,m:r.m,i:r.ing,tg:r.tg}))})"
Objetivos de diseño (los mismos que el resto de oficios): ~55–70 h de juego activo hasta nivel 99; la montura sube de nivel en ≈ media hora por generación temprana; un linaje casi perfecto (G5, genes ≥ 90) cuesta del orden de 40–60 crías (~8–12 h de gestación activa, la mitad con tónico).
Cada parte imprime «actual» y «propuesto»; las constantes propuestas son las que quedan en el juego."""
import json,os,random,statistics as st,sys
sys.stdout.reconfigure(encoding="utf-8")
D=json.load(open(os.path.join(os.path.dirname(__file__),'doma_data.json'),encoding='utf-8'))
XT,XPR=D['XT'],D['XPR']
def hours_to(level,rate_at):   # rate_at(l) = XP/s al nivel l
    s=0
    for l in range(1,level):
        r=rate_at(l)
        s+=(XT[l+1]-XT[l])/max(r,1e-9)
    return s/3600
# ── A · DOMAR: horas hasta nivel 99 domando ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
SP=sorted(D['sp'],key=lambda e:e[2])
CYC=100.0   # segundos por doma lograda (buscar al animal, acecharlo, lazo, doma y fallos), incluye el reaparecer de los pastos
def best(l):
    c=[e for e in SP if e[2]<=l]
    return c[-1] if c else SP[0]
def rate_actual(l):  return best(l)[3]/CYC
def rate_prop(l):    return 1.1*XPR[best(l)[2]]            # XP por doma = 1,1·XPR(nivel de la especie)·CYC  → el ritmo es 1,1·XPR(especie) por segundo (como cualquier receta de ese nivel)
print('A · Domar hasta 99 (ciclo de %d s por doma)'%CYC)
print('   actual (XP fija 110–980)     : %7.0f h'%hours_to(99,rate_actual))
print('   propuesto (XP = 1,1·XPR·CYC)  : %7.1f h'%hours_to(99,rate_prop))
print('   hueco entre especies: ',[(SP[i][2],SP[i+1][2]) for i in range(len(SP)-1) if SP[i+1][2]-SP[i][2]>=6])
# ── B · MONTURA: XP por segundo y tiempo hasta el tope de cada generación ───────────────────────────────────────────────────────────────────────────────────────────────────────────
def mount_xp_rate(frac_gallop_wish=1.0,a=1.0,dt=.05,T=3600):
    # réplica de mount.js: DRAIN 14/a, regen 5 en marcha, agotado hasta 30; galope = 240 px/s, trote 133; XP = d/20 · (1,5 al galope) · (casillas nuevas ~ .8)
    sta,tired,xp,t=100.0,False,0.0,0.0
    while t<T:
        gal=(not tired) and sta>0 and random.random()<frac_gallop_wish
        gal=(not tired) and sta>0
        v=240 if gal else 133
        xp+=v*dt/20*(1.5 if gal else 1)*.8
        if gal:
            sta=max(0,sta-14/a*dt)
            if sta<=0: tired=True
        else: sta=min(100,sta+5*dt)
        if tired and sta>=30: tired=False
        t+=dt
    return xp/T
need=lambda l:300+150*l
def mount_minutes(g,rate):
    cap=12+4*(g-1);lo=1 if g==1 else 12+4*(g-2)
    return sum(need(l) for l in range(lo,cap))/rate/60
r=mount_xp_rate()
print('\nB · Montura: %.1f XP/s a galope-trote continuo (aguante ×1)'%r)
for g in range(1,6): print('   G%d: nivel %2d en %5.1f min (desde el tope anterior)'%(g,12+4*(g-1),mount_minutes(g,r)))
print('   total hasta nivel 28 (G5): %.0f min'%sum(mount_minutes(g,r) for g in range(1,6)))
# ── C · CRÍA: crías necesarias para un G5 con los 4 genes ≥ 90 ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
CE=lambda g:55+10*(g-1)
def clamp(v,a,b):return max(a,min(b,v))
def start_animal():return {'g':[clamp(random.randint(22,50)+random.randint(-4,4),10,55) for _ in range(4)],'gen':1,'k':0}
def child(A,B,bias=.5,lo=-6,hi=10):
    gen=min(5,max(A['gen'],B['gen'])+1);ce=CE(gen);g=[]
    for i in range(4):
        avg=(A['g'][i]+B['g'][i])/2;bst=max(A['g'][i],B['g'][i]);base=avg+(bst-avg)*bias
        g.append(clamp(round(base+random.randint(lo,hi)),10,ce))
    return {'g':g,'gen':gen,'k':0}
def run(bias=.5,lo=-6,hi=10,goal=90,maxn=400,pool_cap=10):
    pool=[start_animal(),start_animal()];births=0;gold=0
    while births<maxn:
        ok=[a for a in pool if a['k']<3]
        if len(ok)<2: # sin pareja: hace falta domar otro animal de la especie (G1 nuevo)
            pool.append(start_animal());pool.append(start_animal());continue
        ok.sort(key=lambda a:(a['gen'],sum(a['g'])),reverse=True)
        # pareja: los dos mejores por generación y suma de genes
        A,B=ok[0],ok[1]
        c=child(A,B,bias,lo,hi);A['k']+=1;B['k']+=1;births+=1;gold+=120*max(A['gen'],B['gen'])**2+80
        pool.append(c)
        if c['gen']==5 and min(c['g'])>=goal: return births,gold
        # el establo guarda `pool_cap`: se descartan los peores (los retirados primero)
        pool.sort(key=lambda a:(a['k']<3,a['gen'],sum(a['g'])),reverse=True);del pool[pool_cap:]
    return maxn,gold
def stats(**kw):
    rs=[run(**kw) for _ in range(300)];b=[x[0] for x in rs];g=[x[1] for x in rs]
    return st.median(b),sorted(b)[int(len(b)*.9)],st.median(g)
print('\nC · Cría: crías hasta un G5 con los 4 genes ≥ 90 (estrategia voraz, establo de 10)')
for name,kw in [('actual (sesgo .5, azar −6…+10)',dict()),('sesgo .6, azar −5…+9',dict(bias=.6,lo=-5,hi=9)),('sesgo .7, azar −4…+8',dict(bias=.7,lo=-4,hi=8))]:
    m,p90,gl=stats(**kw);print('   %-34s mediana %3.0f crías · p90 %3.0f · oro %6.0f · %.1f h de gestación (%.1f h con tónico)'%(name,m,p90,gl,m*12/60,m*6/60))
random.seed(7)
# ── D · COCINA: horas hasta nivel 99 (la limitante es conseguir ingredientes) ──────────────────────────────────────────────────────────────────────────────────────────────────────
GATHER=15.0     # s de caza/pesca/recolección por unidad de ingrediente (media)
K_ING=3         # ingredientes por ración (receta típica)
def cook_xp_actual(l,n=10):
    ti=min(6,1+l//18);q=2;per=(8+ti*9+K_ING*4)*(.6+.4*(q+1)/3)*.85
    return per*(1+(n-1)*.5)
def rate_cook_actual(l,n=10):   # XP/s contando el tiempo de conseguir los ingredientes (n·K_ING·GATHER) + 18 s de elegir y cocinar
    return cook_xp_actual(l,n)/(n*K_ING*GATHER+18)
def portion_xp(l,n_ing=K_ING,q=2):
    ti=min(6,1+l//18);dl=1+(ti-1)*17      # nivel «de plato»: tier 1 → 1 · tier 6 → 86
    effort=n_ing*GATHER*(1+.25*(ti-1))     # esfuerzo de conseguir los ingredientes (más caros cuanto más tier)
    return 1.1*XPR[dl]*effort*1.1*(.6+.4*(q+1)/3)
def rate_cook_prop(l,n=10): return portion_xp(l)*n/(n*K_ING*GATHER*(1+.25*(min(6,1+l//18)-1))+18)
print('\nD · Cocina automática hasta 99 (lotes de 10 raciones; %d ingr./ración, %.0f s por ingrediente)'%(K_ING,GATHER))
print('   actual    : %7.1f h'%hours_to(99,rate_cook_actual))
print('   propuesto : %7.1f h'%hours_to(99,rate_cook_prop))
print('   XP por ración al nivel 1/30/60/90 (propuesto): ',[round(portion_xp(l)) for l in (1,30,60,90)])
