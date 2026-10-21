# NotScape · R3D · Fase 44b · PLANO CENITAL (matplotlib) de un volcado de village_dump.py: casas (rojo), adornos con caja (amarillo), árboles, estaciones (azul), plaza, calles y zona segura. Uso: `python3 tools/r3d/village_plot.py datos.json plano.png [radio=1100]`. Ejes: x → este, y → sur (como el juego).
# Plano cenital de los datos de la aldea (matplotlib): python3 plot_village.py datos.json salida.png [R=1100]
import json,sys,math
import matplotlib;matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle,Circle
d=json.load(open(sys.argv[1]));out=sys.argv[2];R=float(sys.argv[3]) if len(sys.argv)>3 else 1100
cx,cy=d['safe'][0],d['safe'][1];PK=1.5
fig,ax=plt.subplots(figsize=(13,13));ax.set_aspect('equal')
ax.set_xlim(cx-R,cx+R);ax.set_ylim(cy+R,cy-R);ax.set_facecolor('#8fbf6a')
for q in d['plaza']:
    ax.add_patch(Circle((q[0],q[1]),q[2],fc='#b9b2a2',ec='none',alpha=.8))
for c in d['cobs']:
    (x0,y0),(x1,y1)=c['p'][0],c['p'][1];ax.plot([x0,x1],[y0,y1],color='#8a7a5a',lw=c['w']/6,solid_capstyle='round',alpha=.8,zorder=1)
for r in d['routes']:
    xs=[p[0] for p in r];ys=[p[1] for p in r];ax.plot(xs,ys,color='#b08a5a',lw=3,alpha=.9,zorder=1)
for lk in d['lay']['lakes']:
    ax.add_patch(plt.matplotlib.patches.Ellipse(lk['c'],lk['r'][0]*2,lk['r'][1]*2,fc='#5aa8d8',alpha=.6,zorder=1))
for h in d['lay']['hills']:
    ax.add_patch(plt.matplotlib.patches.Ellipse(h['c'],h['r'][0]*2,h['r'][1]*2,fc='#7a7a6a' if h.get('rock') else '#6d9a58',alpha=.35,zorder=1))
for k,s in d['spots'].items():
    z=s['z'];ax.add_patch(Rectangle((z[0],z[2]),z[1]-z[0],z[3]-z[2],fc='none',ec='red',ls='--'));ax.text(z[0],z[2],k,color='red',clip_on=True)
TR={'abedul','pino','roble'}
HOUSE={'casa','taberna','iglesia','cabana','granero','molino'}
for p in d['props']:
    n=p['n'];x,y=p['x'],p['y']
    if abs(x-cx)>R or abs(y-cy)>R:continue
    if n in TR: ax.plot(x,y,'o',color='#2f6b2f',ms=3,zorder=2);continue
    fp=p['fp']
    if fp:
        f=[fp[1],fp[0]] if p['rot'] else fp
        col='#c0654a' if n in HOUSE else '#d8b84a'
        ax.add_patch(Rectangle((x-f[0]*PK,y-f[1]*PK),2*f[0]*PK,2*f[1]*PK,fc=col,ec='k',lw=.6,alpha=.8,zorder=3))
        if n in HOUSE or n=='puesto':ax.text(x,y,n[:4]+('·'+p['room'][:3] if p['room'] else ''),fontsize=6,ha='center',va='center',zorder=5)
    else:
        ax.plot(x,y,'s',color='#555',ms=3,zorder=3)
for s in d['stations']:
    ax.plot(s[2],s[3],'*',color='blue',ms=12,zorder=6);ax.text(s[2]+6,s[3],s[1],color='blue',fontsize=8,zorder=6,clip_on=True)
ax.add_patch(Circle((cx,cy),d['safe'][2],fc='none',ec='yellow',lw=2,ls=':'))
ax.grid(alpha=.3);ax.set_xlim(cx-R,cx+R);ax.set_ylim(cy+R,cy-R);plt.savefig(out,dpi=70,bbox_inches='tight')
