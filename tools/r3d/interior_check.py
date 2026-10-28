# NotScape · R3D · COMPROBACIÓN DE INTERIORES (28 oct 2026). Entra en TODAS las salas de las 6 culturas con la GPU real y comprueba, con la geometría REAL de la escena:
#   (1) COBERTURA DEL SUELO: rejilla de 0,2 sobre toda la sala; cada punto debe caer sobre una cara superior del suelo (y ≈ 0). Un hueco = FALLO («espacios vacíos»).
#   (2) CLIPPING CON EL SUELO: ningún mueble/estación puede tener vértices por debajo de y = −0,01 (el suelo tapa su base) ni estar hundido más de 1 cm; las alfombras (fl) tampoco. FALLO.
#   (3) MUEBLES QUE SE ATRAVIESAN: pares de muebles altos cuyas huellas se solapan más de 0,06 (AVISO; sillas y objetos sobre mesas no cuentan).
#   (4) PNJ EN SU SITIO: cada PNJ con tarea debe tener su objetivo (mueble/estación) a ≤ 0,22 de sus manos y de cara a él (≤ 50°); los sentados, su mesa a ≤ 0,7 y de cara. Si no, FALLO («moviéndose al aire»). También AVISO si su cuerpo se solapa con otro mueble.
# Uso (raíz del repo; servidor en 8811: `python tools/serve_nocache.py 8811` o `ns.py start`):  python tools/r3d/interior_check.py [k=0,1,2,3,4,5] [-v]     (sin `-I`: necesita Playwright)
import asyncio, sys, json, os, socket, subprocess, time
from playwright.async_api import async_playwright

KS = [int(x) for x in (sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('-') else '0,1,2,3,4,5').split(',')]
V = '-v' in sys.argv
ROOMS = ['herreria', 'taberna', 'taller', 'banco', 'tienda', 'templo', 'botica']

JS = r"""(([k,room])=>{
 const e={id:'door',k,room,n:room,x:P.x,y:P.y};enterRoom(e);const RM=R3D.rooms,G=RM.grp;if(!INT)return{err:'no se entró en '+room};G.updateMatrixWorld(true);
 const W=INTROOMS.RW*IK/32,D=INTROOMS.RD*IK/32;
 const verts=gr=>{const m=gr.children.find(c=>c.isMesh&&c.geometry&&c.geometry.attributes.position);if(!m)return null;const p=m.geometry.attributes.position,me=gr.matrixWorld.elements,out=[];for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);out.push([me[0]*x+me[4]*y+me[8]*z+me[12],me[1]*x+me[5]*y+me[9]*z+me[13],me[2]*x+me[6]*y+me[10]*z+me[14]])}return{v:out,m}};
 const bx=v=>{let a=[1e9,1e9,1e9],b=[-1e9,-1e9,-1e9];for(const q of v)for(let i=0;i<3;i++){a[i]=Math.min(a[i],q[i]);b[i]=Math.max(b[i],q[i])}return{a,b}};
 const hb=G.position,rel=q=>[q[0]-hb.x,q[1]-hb.y,q[2]-hb.z];
 const gs=G.children.filter(c=>c.userData&&(c.userData.kind||c.userData.item||c.userData.st));
 const res={room,k,W,D,gaps:0,gapSample:[],sink:[],overlap:[],npc:[],items:gs.length};
 // (1) cobertura
 const fl=gs.find(c=>c.userData.kind==='floor'),fv=fl?verts(fl):null;
 if(!fv)return{err:'sin suelo'};
 const tris=[];{const idx=fv.m.geometry.index,V=fv.v;const n=idx?idx.count/3:V.length/3;for(let t=0;t<n;t++){const a=V[idx?idx.getX(t*3):t*3],b=V[idx?idx.getX(t*3+1):t*3+1],c=V[idx?idx.getX(t*3+2):t*3+2];const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];const ny=uz*vx-ux*vz,L=Math.hypot(uy*vz-uz*vy,ny,ux*vy-uy*vx);if(L<1e-9||Math.abs(ny)/L<.9)continue;const top=Math.max(a[1],b[1],c[1])-hb.y;if(top<-.09)continue;tris.push([a[0]-hb.x,a[2]-hb.z,b[0]-hb.x,b[2]-hb.z,c[0]-hb.x,c[2]-hb.z,top>=-.03?1:0])}}
 {let mx=1e9,Mx=-1e9,mz=1e9,Mz=-1e9;for(const t of tris){for(let i=0;i<6;i+=2){mx=Math.min(mx,t[i]);Mx=Math.max(Mx,t[i]);mz=Math.min(mz,t[i+1]);Mz=Math.max(Mz,t[i+1])}}res.fb=[+mx.toFixed(2),+Mx.toFixed(2),+mz.toFixed(2),+Mz.toFixed(2),tris.length]}
 const inT=(x,z,t)=>{const d=(t[3]-t[5])*(t[0]-t[4])+(t[4]-t[2])*(t[1]-t[5]);if(Math.abs(d)<1e-12)return false;const a=((t[3]-t[5])*(x-t[4])+(t[4]-t[2])*(z-t[5]))/d,b=((t[5]-t[1])*(x-t[4])+(t[0]-t[4])*(z-t[5]))/d;return a>=-1e-6&&b>=-1e-6&&1-a-b>=-1e-6};
 let n=0,tc=0;for(let x=-W/2+.05;x<W/2;x+=.2)for(let z=-D/2+.05;z<D/2;z+=.2){let ok=false,okT=false;n++;for(const t of tris){if(x<Math.min(t[0],t[2],t[4])-1e-6||x>Math.max(t[0],t[2],t[4])+1e-6||z<Math.min(t[1],t[3],t[5])-1e-6||z>Math.max(t[1],t[3],t[5])+1e-6)continue;if(inT(x,z,t)){ok=true;if(t[6]){okT=true;break}}}if(okT)tc++;if(!ok){res.gaps++;if(res.gapSample.length<6)res.gapSample.push([+x.toFixed(2),+z.toFixed(2)])}}
 res.tile=n?+(tc/n*100).toFixed(1):0;
 // (2)(3) muebles
 const objs=[];for(const g of gs){if(g.userData.kind==='floor')continue;const vv=verts(g);if(!vv||!vv.v.length)continue;const b=bx(vv.v.map(rel)),n=g.userData.item||g.userData.st;objs.push({n,fl:!!g.userData.fl,wall:/^(estante|cuadro|colgante|escudoPared|rackArmas|herramientas|pielPared|farolPapel|sconce|candelabro|boveda)$/.test(n),b,st:!!g.userData.st});
  if(!g.userData.fl&&b.a[1]<-.011){const lo=vv.v.map(rel).filter(q=>q[1]<-.011).slice(0,3).map(q=>q.map(c=>+c.toFixed(2)));res.sink.push([n,+b.a[1].toFixed(3),lo,[+g.position.x.toFixed(2),+g.position.z.toFixed(2)]])}if(g.userData.fl&&b.a[1]<-.011)res.sink.push([n+'(alfombra)',+b.a[1].toFixed(3)])}
 const ONTOP=/^(vajilla|vajillaBaja|hierbasMesa|jarras|alfombra|cojin|maceta|farolPapel|sconce|candelabro|silla|taburete|mesaBaja|plantaGrande|barrilTap|cestaLena|arcon|barrilAgua)$/;
 for(let i=0;i<objs.length;i++)for(let j=i+1;j<objs.length;j++){const A=objs[i],B=objs[j];if(A.fl||B.fl||A.wall||B.wall||ONTOP.test(A.n)||ONTOP.test(B.n))continue;const ox=Math.min(A.b.b[0],B.b.b[0])-Math.max(A.b.a[0],B.b.a[0]),oz=Math.min(A.b.b[2],B.b.b[2])-Math.max(A.b.a[2],B.b.a[2]);if(ox>.06&&oz>.06)res.overlap.push([A.n,B.n,+ox.toFixed(2),+oz.toFixed(2)])}
 // (4) PNJ
 const dist=(px,pz,b)=>{const dx=Math.max(b.a[0]-px,0,px-b.b[0]),dz=Math.max(b.a[2]-pz,0,pz-b.b[2]);return Math.hypot(dx,dz)};
 for(const a of RM.act){if(!a.job)continue;const fx=Math.sin(a.yaw),fz=Math.cos(a.yaw),rx=a.x+fx*.42,rz=a.z+fz*.42;
  const names=a.seat?['mesa','mesaBaja','barra']:[a.tg];const T=objs.filter(o=>names.includes(o.n));if(!T.length){res.npc.push({job:a.job,tg:a.tg,err:'objetivo no encontrado'});continue}
  let best=null;for(const o of T){const d=a.seat?dist(a.x,a.z,o.b):dist(rx,rz,o.b);if(!best||d<best.d)best={d,o}}
  const cx=(best.o.b.a[0]+best.o.b.b[0])/2,cz=(best.o.b.a[2]+best.o.b.b[2])/2;let df=Math.abs(Math.atan2(cx-a.x,cz-a.z)-a.yaw);df=df>Math.PI?2*Math.PI-df:df;
  const lim=a.seat?.7:(a.job==='pray'?.45:.22);const bad=best.d>lim||df>.87;
  let clip=null;for(const o of objs){if(o===best.o||o.fl||o.wall||ONTOP.test(o.n)&&o.n!=='barrilAgua')continue;if(a.x>o.b.a[0]+.05&&a.x<o.b.b[0]-.05&&a.z>o.b.a[2]+.05&&a.z<o.b.b[2]-.05&&o.b.b[1]>.3){clip=o.n;break}}
  res.npc.push({job:a.job,tg:best.o.n,dist:+best.d.toFixed(2),face:+(df*57.3).toFixed(0),bad,clip})}
 leaveRoom(1);return res})"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=False, args=['--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1100, 'height': 700}); errs = []
        pg.on('pageerror', lambda e: errs.append('PAGEERROR '+str(e)+' | '+str(getattr(e,'stack',''))[:300]))
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        await pg.goto('http://127.0.0.1:8811/index.html?test=1&noedit&at=4600,15152', wait_until='commit')
        await pg.wait_for_function('window.__nstestReady===true||(window.R3D&&window.R3D.rooms&&typeof enterRoom==="function")', timeout=120000)
        await pg.wait_for_timeout(8000)
        fails = 0; warns = 0
        for k in KS:
            for room in ROOMS:
                try:
                    r = await pg.evaluate(JS, [k, room])
                except Exception as e:
                    print('k%d %-9s EXCEPCIÓN %s' % (k, room, str(e)[:160])); fails += 1; continue
                await pg.wait_for_timeout(400)
                if r.get('err'):
                    print('k%d %-9s %s' % (k, room, r['err'])); continue
                npcbad = [n for n in r['npc'] if n.get('bad') or n.get('err')]
                f = (1 if (r['gaps'] or r['tile'] < 90) else 0) + len(r['sink']) + len(npcbad)
                w = len(r['overlap']) + len([n for n in r['npc'] if n.get('clip')])
                fails += f; warns += w
                print('k%d %-9s muebles %2d  huecos %3d (losas %s%%)  hundidos %d  muebles-solapados %d  PNJ %d (mal %d)  %s' % (k, room, r['items'], r['gaps'], r['tile'], len(r['sink']), len(r['overlap']), len(r['npc']), len(npcbad), 'FALLO' if f else ('aviso' if w else 'ok')))
                if r['gaps']: print('     huecos en', r['gapSample'], 'suelo', r.get('fb'), 'sala', round(r['W'],2), round(r['D'],2))
                for s in r['sink']: print('     HUNDIDO', s)
                for n in npcbad: print('     PNJ LEJOS/DESORIENTADO', n)
                if V:
                    for o in r['overlap']: print('     solape', o)
                    for n in r['npc']:
                        if n.get('clip'): print('     PNJ pisa mueble', n)
        print('consola:', errs[:6] or 'sin errores')
        print('RESULTADO: OK (%d avisos)' % warns if not fails and not errs else 'RESULTADO: FALLO (%d fallos)' % fails)
        await b.close()
asyncio.run(main())
