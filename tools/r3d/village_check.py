# NotScape · R3D · Fase 44b · COMPROBACIÓN DE LA ALDEA POR BARRIOS con los datos y la colisión REALES del juego (sin capturas). Uso (raíz del repo, con `python3 -m http.server 8811 &`):
#   python3 -I tools/r3d/village_check.py [k=0] [extra_query]      → imprime un resumen y acaba en «RESULTADO: OK/FALLO»  (extra_query p. ej. `barrios=0` o `vk=1` para comparar)
# Comprueba, para la aldea del bioma k (por defecto la Pradera):
#  (1) EDIFICIOS (casa, cabaña, taberna, iglesia, granero, molino…) que se pisan entre sí (cajas de colisión `fp`, ya con PROP_K) o que pisan una CALLE o la PLAZA (las 6 primeras `cobs` de la aldea
#      y el adoquín de la plaza; las puertas añaden su propio adoquín en runtime y no cuentan). Los puestos, pozo, banca, farolas y tablón SÍ pueden estar en la plaza.
#  (2) ALCANZABILIDAD (incluye el PUNTO DE APARICIÓN `spawnOf(k)`, donde reapareces al morir): inundación (rejilla de 8 px, `blk()` real: el héroe es un punto) desde el centro de la plaza por ±1100 px; cada PUERTA (ST id 'door'), Ru, el tablón, la fogata, el altar y las
#      estaciones del mapa deben tener una celda alcanzable a < 28 px, y no estar dentro de un sólido.
#  (3) CAMINO PRINCIPAL: desde el borde oeste hasta el borde este de la aldea por la calle mayor (y=centro) sin sólidos; y la avenida norte y la sur hasta el camino del mundo.
#  (4) Errores de consola = 0.
# QUIET=1 imprime solo el resumen y los FALLO. La salida lista cada problema con coordenadas RELATIVAS a la plaza (x→este, y→sur) para que se pueda corregir en `src/village-barrios.js`.
import asyncio,sys,json,re
from playwright.async_api import async_playwright
K=int(sys.argv[1]) if len(sys.argv)>1 and re.fullmatch(r'\d',sys.argv[1]) else 0
EXTRA=sys.argv[2] if len(sys.argv)>2 else (sys.argv[1] if len(sys.argv)>1 and not re.fullmatch(r'\d',sys.argv[1]) else '')
JS="""(k=>{
 const B=BIOMES.list[k],V=B.village,C=WS.C,out={k,c:C,problemas:[]};const cx=B.ox+C[0],cy=B.oy+C[1];
 const rel=(x,y)=>[Math.round(x-cx),Math.round(y-cy)];
 const BIG=/^(casa|cabana|troncos|casaLarga|salon|palafito|casaJp|casaMaya|stabbur|casaArbol|granero|taberna|iglesia|pagoda|templo|molino|gallinero)$/;
 const ents=PROPS.list.filter(e=>e.k===k&&e.fp&&BIG.test(e.n)&&Math.abs(e.x-cx)<1000&&Math.abs(e.y-cy)<1000);
 out.edificios=ents.length;
 // (1a) edificio contra edificio
 let solapes=[];for(let i=0;i<ents.length;i++)for(let j=i+1;j<ents.length;j++){const a=ents[i],b=ents[j],ox=a.fp[0]+b.fp[0]-Math.abs(a.x-b.x),oy=a.fp[1]+b.fp[1]-Math.abs(a.y-b.y);if(ox>0&&oy>0)solapes.push([a.n+rel(a.x,a.y),b.n+rel(b.x,b.y),Math.round(Math.min(ox,oy))])}
 out.edificiosSeSolapan=solapes;
 // (1a') adornos con caja (puestos, leña, tablones, barriles…) contra edificios: también se pisan
 const pequenos=PROPS.list.filter(e=>e.k===k&&e.fp&&!BIG.test(e.n)&&!/^(valla|verja|empalizada|muroRuina|columna|huerto)$/.test(e.n)&&Math.abs(e.x-cx)<1000&&Math.abs(e.y-cy)<1000);
 for(const a of pequenos)for(const b of ents){const ox=a.fp[0]+b.fp[0]-Math.abs(a.x-b.x),oy=a.fp[1]+b.fp[1]-Math.abs(a.y-b.y);if(ox>2&&oy>2)solapes.push([a.n+rel(a.x,a.y),b.n+rel(b.x,b.y),Math.round(Math.min(ox,oy))])}
 // (1b) edificio contra calle (cápsula de las 6 primeras cobs) y plaza (círculo de tierra [0]); muestreo de la caja cada 8 px
 const calles=V.cobs.slice(0,6).map(c=>({p:c.p,w:c.w}));const seg=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy||1,u=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/l));return Math.hypot(x-a[0]-dx*u,y-a[1]-dy*u)};
 const plz=V.plaza[0];let pisan=[];
 for(const e of ents){let worst=0,que='';for(let x=e.x-e.fp[0];x<=e.x+e.fp[0];x+=8)for(let y=e.y-e.fp[1];y<=e.y+e.fp[1];y+=8){
   calles.forEach((c,i)=>{if(i===0)return;const d=seg(x,y,c.p[0],c.p[1]);const pen=c.w-d;if(pen>worst){worst=pen;que='calle'+i}});
   const dp=Math.hypot(x-plz[0],y-plz[1]),pen=plz[2]-dp;if(pen>worst){worst=pen;que='plaza'}
   const c0=calles[0],d0=seg(x,y,c0.p[0],c0.p[1]);if(c0.w-d0>worst){worst=c0.w-d0;que='adoquín'}}
  if(worst>6)pisan.push([e.n+rel(e.x,e.y),que,Math.round(worst)])}
 out.edificiosPisanCalle=pisan;
 // (2) alcanzabilidad por inundación (8 px) desde el centro de la plaza
 const R=1100,S=8,N=Math.ceil(2*R/S),ox=cx-R,oy=cy-R,seen=new Uint8Array(N*N),q=new Int32Array(N*N);
 const fr=(i,j)=>!blk(ox+(i+.5)*S,oy+(j+.5)*S);
 // celda de salida: la más cercana al centro que sea libre
 let si=Math.floor(R/S),sj=si,found=false;for(let r=0;r<40&&!found;r++)for(let a=-r;a<=r&&!found;a++)for(let b=-r;b<=r&&!found;b++){if(Math.max(Math.abs(a),Math.abs(b))!==r)continue;if(fr(si+a,sj+b)){si+=a;sj+=b;found=true}}
 let h=0,t=0;q[t++]=sj*N+si;seen[sj*N+si]=1;
 while(h<t){const c=q[h++],i=c%N,j=(c/N)|0;for(const[di,dj]of[[1,0],[-1,0],[0,1],[0,-1]]){const a=i+di,b=j+dj;if(a<0||b<0||a>=N||b>=N)continue;const n=b*N+a;if(seen[n])continue;if(!fr(a,b))continue;seen[n]=1;q[t++]=n}}
 out.celdasAlcanzadas=t;
 let noAlc0=0;const reach=(x,y,r)=>{const i0=Math.floor((x-ox)/S),j0=Math.floor((y-oy)/S),m=Math.ceil(r/S);for(let a=-m;a<=m;a++)for(let b=-m;b<=m;b++){const i=i0+a,j=j0+b;if(i<0||j<0||i>=N||j>=N)continue;if(Math.hypot(a*S,b*S)<=r&&seen[j*N+i])return true}return false};
 const sp=spawnOf(k);out.spawn=rel(sp.x,sp.y);if(!reach(sp.x,sp.y,12))noAlc0=1;
 const objetivos=ST.filter(e=>biomeAt(e.x,e.y)===k&&Math.abs(e.x-cx)<R-60&&Math.abs(e.y-cy)<R-60&&!e.inroom);
 const noAlc=[];for(const e of objetivos){if(!reach(e.x,e.y,28))noAlc.push([e.id+(e.room?':'+e.room:''),rel(e.x,e.y),blk(e.x,e.y)?'dentro de un sólido':'aislado'])}
 if(noAlc0)noAlc.push(['spawn',out.spawn,blk(sp.x,sp.y)?'dentro de un sólido':'aislado']);out.objetivos=objetivos.map(e=>e.id+(e.room?':'+e.room:'')+JSON.stringify(rel(e.x,e.y)));out.noAlcanzables=noAlc;
 // (3) calles principales: desde el borde oeste al este de la aldea por y=centro, y N/S por x=centro, sin sólidos (paso de 4 px)
 const linea=(x0,y0,x1,y1)=>{const n=Math.ceil(Math.hypot(x1-x0,y1-y0)/4);let bad=0,first=null;for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n,y=y0+(y1-y0)*i/n;if(blk(x,y)){bad++;if(!first)first=rel(x,y)}}return{bloqueos:bad,primero:first}};
 out.calleMayor=linea(cx-760,cy,cx+760,cy);out.avenidaNorte=linea(cx,cy-160,cx,cy-520);out.avenidaSur=linea(cx,cy+160,cx,cy+520);
 if(window.VBARRIOS)out.vb={hechas:VBARRIOS.done,avisos:VBARRIOS.warn};
 return out})"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':960,'height':600});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_TUNNEL' not in m.text and 'status of 404' not in m.text else None)
    await pg.goto('http://127.0.0.1:8811/index.html?r3d=1&noedit'+('&'+EXTRA if EXTRA else ''),wait_until='commit')
    await pg.wait_for_function('window.R3D&&typeof S!=="undefined"&&typeof blk==="function"&&typeof PROPS!=="undefined"&&PROPS.list&&PROPS.list.length',timeout=120000);await pg.wait_for_timeout(2500)
    r=await pg.evaluate(f'({JS})({K})');ok=True
    if not __import__('os').environ.get('QUIET'):print(json.dumps(r,ensure_ascii=False,indent=1))
    print('RESUMEN: bioma',K,'edificios',r['edificios'],'solapes',len(r['edificiosSeSolapan']),'pisan calle/plaza',len(r['edificiosPisanCalle']),'no alcanzables',len(r['noAlcanzables']),'calleMayor/N/S bloqueos',r['calleMayor']['bloqueos'],r['avenidaNorte']['bloqueos'],r['avenidaSur']['bloqueos'],'celdas',r['celdasAlcanzadas'])
    if r['edificiosSeSolapan']:print('FALLO: edificios que se pisan:',len(r['edificiosSeSolapan']));ok=False
    if r['edificiosPisanCalle']:print('FALLO: edificios que pisan calle/plaza:',len(r['edificiosPisanCalle']));ok=False
    if r['noAlcanzables']:print('FALLO: objetivos no alcanzables:',r['noAlcanzables']);ok=False
    for n in('calleMayor','avenidaNorte','avenidaSur'):
      if r[n]['bloqueos']:
        if K==0:print('FALLO: bloqueo en',n,r[n]);ok=False
        else:print('AVISO (aldea heredada, sin spec de barrios; no es fallo): bloqueo en',n,r[n])   # p. ej. la farola del eje de la avenida norte, el palafito del Pantano o la casa del Oriental en la avenida sur
    if r.get('vb',{}).get('avisos'):print('AVISO: village-barrios no encontró props:',r['vb']['avisos'])
    print('errores:',errs or 'ninguno')
    if errs:ok=False
    print('RESULTADO: OK' if ok else 'RESULTADO: FALLO');await b.close()
asyncio.run(main())
