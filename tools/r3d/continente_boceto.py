# NotScape · Fase 49/50 (PLAN v2, 19 oct 2026 18:39) · BOCETO ESQUEMÁTICO del continente: Pradera en una ESQUINA, la CAPITAL ORIENTAL en el centro, anillo de biomas que se recorre por orden de nivel,
# + los dos PLANOS aparte (Infierno y Cielo). NO es el terreno del juego: solo el plano para aprobar la geografía. Uso: python3 -I tools/r3d/continente_boceto.py salida.png
import sys,numpy as np
import matplotlib;matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap
import matplotlib.patheffects as pe
CW,CH=288,188;PAD=46;NX,NY=CW*3+2*PAD,CH*3+2*PAD            # 3×3 casillas de 288×188 tiles (+ margen de mar)
def fbm(sh,sc,oct=5,seed=0):
  r=np.random.default_rng(seed);out=np.zeros(sh);amp=1;tot=0
  for o in range(oct):
    g=r.random((int(sh[0]/sc)+3,int(sh[1]/sc)+3));ys,xs=np.mgrid[0:sh[0],0:sh[1]];fy,fx=ys/sc,xs/sc;iy,ix=fy.astype(int),fx.astype(int);ty,tx=fy-iy,fx-ix
    ty=ty*ty*(3-2*ty);tx=tx*tx*(3-2*tx);v=(g[iy,ix]*(1-tx)+g[iy,ix+1]*tx)*(1-ty)+(g[iy+1,ix]*(1-tx)+g[iy+1,ix+1]*tx)*ty
    out+=v*amp;tot+=amp;amp*=.5;sc/=2
  return out/tot
ys,xs=np.mgrid[0:NY,0:NX].astype(float)
wx=xs+(fbm((NY,NX),90,4,1)-.5)*70;wy=ys+(fbm((NY,NX),90,4,2)-.5)*70     # fronteras que serpentean (dominio deformado)
col=np.clip(((wx-PAD)//CW).astype(int),0,2);row=np.clip(((wy-PAD)//CH).astype(int),0,2)
# (col,fila) → bioma: 0 Pradera · 1 Bosque · 2 Pantano · 3 Cumbres · 4 Páramo Arcano · 5 Desierto · 6 Oriental (capital, centro) · 7 Costa · 8 Volcán
G={(0,2):0,(0,1):1,(0,0):2,(1,0):3,(2,0):4,(2,1):5,(1,1):6,(1,2):7,(2,2):8}
reg=np.zeros((NY,NX),int)
for (c,r),b in G.items():reg[(col==c)&(row==r)]=b
# costa irregular: rectángulo redondeado + ruido (esquinas con bahías suaves; la Pradera conserva su esquina)
cx,cy=NX/2,NY/2;hx,hy=CW*1.5,CH*1.5;R=70
qx=np.abs(xs-cx)-(hx-R);qy=np.abs(ys-cy)-(hy-R)
sdf=np.hypot(np.maximum(qx,0),np.maximum(qy,0))+np.minimum(np.maximum(qx,qy),0)-R
land=(sdf+(fbm((NY,NX),55,5,3)-.5)*70)<0
# golfos/cabos: muescas en la costa norte y este y un cabo al SE
for (px,py,rad) in [(PAD+CW*1.0,PAD-5,38),(PAD+CW*3.0,PAD+CH*1.55,45),(PAD+CW*2.55,PAD+CH*3.0,40)]:
  land&=(np.hypot(xs-px,ys-py)>rad*(0.8+.4*fbm((NY,NX),30,3,4)))
final=np.where(land,reg,-1)
colors=['#7ea34a','#3f6b36','#7f8a3e','#9aa6ad','#8c7bc0','#d9b45a','#58b296','#cdbf8f','#8a5a48']
cm=ListedColormap(['#1d4e5f']+colors)
fig=plt.figure(figsize=(16,8.8),dpi=105);gs=fig.add_gridspec(2,2,width_ratios=[3.1,1],height_ratios=[1,1],wspace=.05,hspace=.12)
ax=fig.add_subplot(gs[:,0]);ax.imshow(final+1,cmap=cm,vmin=0,vmax=9,interpolation='nearest',origin='upper');ax.set_xticks([]);ax.set_yticks([])
O=lambda t:[pe.withStroke(linewidth=3,foreground='black')]
cen=lambda c,r:(PAD+CW*(c+.5),PAD+CH*(r+.5))
names={0:('PRADERA\n(inicio · tutorial)\nnv 1–10',(0,2)),1:('BOSQUE\nnv 11–19',(0,1)),2:('PANTANO\nnv 20–28',(0,0)),3:('CUMBRES\nnv 29–37',(1,0)),4:('PÁRAMO ARCANO\nnv 38–46',(2,0)),5:('DESIERTO\nnv 47–55',(2,1)),6:('ORIENTAL\n(CAPITAL · nexo)\nnv 56–64',(1,1)),7:('COSTA DE LAS\nTORMENTAS\nnv 65–72 · runita',(1,2)),8:('VOLCÁN\nnv 73–82',(2,2))}
for b,(t,(c,r)) in names.items():x,y=cen(c,r);ax.text(x,y,t,ha='center',va='center',fontsize=11.5,color='white',weight='bold',path_effects=O(0))
# recorrido por orden de nivel (carretera principal): Pradera→Bosque→Pantano→Cumbres→Páramo→Desierto→Oriental→Costa→Volcán
path=[(0,2),(0,1),(0,0),(1,0),(2,0),(2,1),(1,1),(1,2),(2,2)]
pts=np.array([cen(c,r) for c,r in path]);ax.plot(pts[:,0],pts[:,1],color='#ffe629',lw=2.6,ls='-',marker='o',ms=5,mec='black',zorder=5)
for i,(c,r) in enumerate(path):x,y=cen(c,r);ax.text(x-CW*.36,y-CH*.36,str(i+1),fontsize=12,color='#ffe629',weight='bold',path_effects=O(0),ha='center',va='center')
# barreras (cordillera/acantilado con UN paso) en las aristas que unen niveles muy distintos; muralla en la entrada del Volcán
def bar(p0,p1,label,c='#2b2b2b',gap=.5):
  p0=np.array(p0,float);p1=np.array(p1,float);a=p0+(p1-p0)*(gap-.09);b=p0+(p1-p0)*(gap+.09)
  ax.plot([p0[0],a[0]],[p0[1],a[1]],color=c,lw=6,solid_capstyle='round',alpha=.75);ax.plot([b[0],p1[0]],[b[1],p1[1]],color=c,lw=6,solid_capstyle='round',alpha=.75)
  m=(a+b)/2;ax.text(m[0],m[1]+9,label,fontsize=7.5,color='white',ha='center',va='top',path_effects=O(0))
X=lambda c:PAD+CW*c;Y=lambda r:PAD+CH*r
ax.plot([X(1),X(1)],[Y(1)+8,Y(2)-8],color='#2b2b2b',lw=7,solid_capstyle='round',alpha=.85);ax.text(X(1)+6,Y(1)+CH*.5,'puerta sellada',fontsize=7.5,color='white',va='center',path_effects=O(0))                      # Bosque|Oriental (x=1, fila 1)
ax.plot([X(1)+8,X(2)-8],[Y(1),Y(1)],color='#2b2b2b',lw=7,solid_capstyle='round',alpha=.85);ax.text(X(1)+CW*.5,Y(1)+8,'puerta sellada',fontsize=7.5,color='white',ha='center',va='top',path_effects=O(0))                      # Cumbres|Oriental (y=1, col 1)  [se dibuja horizontal por simetría de la figura]
bar((X(1),Y(2)+8),(X(1),Y(3)-8),'acantilado costero',gap=.5)        # Pradera|Costa
bar((X(2)+8,Y(2)),(X(3)-8,Y(2)),'cañón de lava',gap=.5)            # Desierto|Volcán
ax.plot([X(2),X(2)],[Y(2)+25,Y(3)-25],color='#e8b84a',lw=7,solid_capstyle='butt',zorder=4);ax.text(X(2)+6,Y(2)+CH*.5,'MURALLA\n(puerta tras el\njefe del Oriental)',fontsize=8,color='#e8b84a',va='center',path_effects=O(0))
ax.set_title('CONTINENTE v2 (esquemático, 864×564 tiles) · se recorre 1→9 por orden de nivel',fontsize=11)
# planos aparte
def plane(a,title,sub,c1,c2,seed):
  g=np.linspace(0,1,200);Z=np.tile(g,(120,1));n=fbm((120,200),20,4,seed)
  a.imshow(c1*(1-n[...,None])+c2*n[...,None],aspect='auto');a.set_xticks([]);a.set_yticks([]);a.set_title(title,fontsize=10.5,weight='bold');a.text(.5,.5,sub,transform=a.transAxes,ha='center',va='center',color='white',fontsize=9.5,path_effects=O(0))
a2=fig.add_subplot(gs[0,1]);plane(a2,'PLANO · INFIERNO (nv 83–91)','grietas y ríos de lava\nsobre un abismo\nacceso: ESCALERA desde el Volcán\n(grieta abierta al caer su jefe final)',np.array([.25,.07,.06]),np.array([.85,.3,.08]),11)
a3=fig.add_subplot(gs[1,1]);plane(a3,'PLANO · CIELO (nv 92–99)','islas flotantes entre nubes\nunidas por puentes\nacceso: PORTAL en el Infierno\n(se abre al vencer a su jefe)\ncelestita y último tier',np.array([.42,.62,.85]),np.array([.97,.95,.88]),12)
from matplotlib.patches import ConnectionPatch
vx,vy=cen(2,2);fig.add_artist(ConnectionPatch((vx+CW*.3,vy-CH*.25),(0,.35),'data','axes fraction',axesA=ax,axesB=a2,arrowstyle='-|>',color='#ff5030',lw=2.4,mutation_scale=18,connectionstyle='arc3,rad=-.25'))
fig.add_artist(ConnectionPatch((.5,0),(.5,1),'axes fraction','axes fraction',axesA=a2,axesB=a3,arrowstyle='-|>',color='#9fd0ff',lw=2.4,mutation_scale=18))
plt.savefig(sys.argv[1],bbox_inches='tight');print('ok',sys.argv[1])
