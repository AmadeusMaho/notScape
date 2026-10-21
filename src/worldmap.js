// NotScape · FASE 47 · MAPA DEL MUNDO CON NIEBLA + MINIMAPA LOCAL ALINEADO CON LA PANTALLA (19 oct 2026; pedido del dueño: «sigue con la siguiente fase»).
// Se carga ANTES de game.js (clásico, sin módulos). game.js lo inicializa con `WMAP.init({...})` y lo usa desde `drawMap` (dibujo) y `zoneCheck` (`WMAP.tick`).
//   · UN solo lienzo de TODO el mundo (`TER.NX × TER.NY` tiles × `PX` px por tile; 864×376 tiles → 1728×752 px con el mundo ×2) que se pinta POR CELDAS de 16×16 tiles, solo cuando la
//     celda se REVELA (niebla de guerra): el coste es proporcional a lo explorado, no al mundo (antes `mmk` pintaba un lienzo por bioma con un `fillRect` por tile).
//   · `S.fog` = cadena «CXxCY:hex» (54×24 celdas = 1 296 bits = 324 caracteres). Es aditivo: NO se sube `S.ver` (una partida antigua sin `S.fog` se migra al cargar desde `S.map`).
//   · Minimapa LOCAL: círculo con ventana de `LOCAL_R` px de mundo alrededor del héroe, GIRADO con el acimut de la cámara (`R3D.az`) para que «arriba» del mapa = «arriba» de la pantalla.
//     Rotación (derivada de la cámara de r3d.js): derecha de pantalla = (cos az, −sin az), arriba = (−sin az, −cos az) en ejes (x, y) de mundo ⇒ `ctx.rotate(az)` sobre un mapa con el norte arriba.
//   · Mapa GRANDE (tecla M): el mundo entero con el norte arriba, niebla, bioma actual resaltado.
// API: WMAP.init(env) · WMAP.tick(x,y) · WMAP.paint(ms) (pinta celdas pendientes con presupuesto) · WMAP.local(ctx,cx,cy,d,px,py,az) → proyector · WMAP.big(ctx,x,y,w,h,before) → proyector
//      WMAP.revealed(wx,wy) · WMAP.stats() · WMAP.revealAll() (depuración) · WMAP.reset()
// env = { TER, BI, biomeAt, mix(a,b,t), N:()=>array, S:()=>estado, dirty:()=>void }
const WMAP=(()=>{
 const T=32,CELL=16,PX=2,RV=3.3,LOCAL_R=1200,FOGC='#0d0b09';
 // R3D-ESTETICA: el mapa se pintaba con la paleta pastel (verde lima) y era lo más saturado de la pantalla. Se apaga la saturación y se vela con pergamino (misma gama que el mundo óleo). `?mapmute=0` lo quita.
 const MAPMUTE=(()=>{try{const v=new URLSearchParams(location.search).get('mapmute');return v==null?1:Math.max(0,Math.min(1,+v||0))}catch(e){return 1}})();
 function muteMap(c,x,y,w,h){if(!MAPMUTE)return;c.save();try{c.globalCompositeOperation='saturation';c.fillStyle='rgba(128,128,128,'+(.5*MAPMUTE)+')';c.fillRect(x,y,w,h);c.globalCompositeOperation='multiply';c.fillStyle='rgba(222,206,170,'+(.55*MAPMUTE)+')';c.fillRect(x,y,w,h)}catch(e){}c.restore()}
 let E=null,NX=0,NY=0,CX=0,CY=0,fog=null,cv=null,q=null,queue=[],last=-1,treeB=null,lastEnc='',painted=0,paintMs=0;
 const enc=()=>{let s='';for(let i=0;i<fog.length;i+=4)s+=((fog[i]?8:0)|(fog[i+1]?4:0)|(fog[i+2]?2:0)|(fog[i+3]?1:0)).toString(16);return CX+'x'+CY+':'+s};
 const dec=str=>{const m=/^(\d+)x(\d+):([0-9a-f]*)$/.exec(str||'');if(!m||+m[1]!==CX||+m[2]!==CY||m[3].length<Math.ceil(CX*CY/4))return false;
  for(let i=0;i<fog.length;i++){const n=parseInt(m[3][i>>2],16)||0;fog[i]=(n>>(3-(i&3)))&1}return true};
 function init(env){E=env;NX=E.TER.NX;NY=E.TER.NY;CX=Math.ceil(NX/CELL);CY=Math.ceil(NY/CELL);fog=new Uint8Array(CX*CY);
  cv=document.createElement('canvas');cv.width=NX*PX;cv.height=NY*PX;q=cv.getContext('2d');q.fillStyle=FOGC;q.fillRect(0,0,cv.width,cv.height);
  const S=E.S();if(!dec(S.fog))migrate(S);else lastEnc=S.fog;
  for(let i=0;i<fog.length;i++)if(fog[i])queue.push(i)}
 // partida antigua (sin S.fog) o con otro tamaño de mundo: se revela lo que ya estaba descubierto en S.map (aldea ±4 celdas, jefe, zonas) y el entorno del héroe
 function migrate(S){const R=(x,y,r)=>{const cx=Math.floor(x/T/CELL),cy=Math.floor(y/T/CELL);for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(dx*dx+dy*dy<=r*r+1)rv(cx+dx,cy+dy,1)};
  const m=S.map||{};E.BI.forEach((b,k)=>{if(m['v'+k]||k===0)R(b.ox+b.cen[0],b.oy+b.cen[1],4);if(m['b'+k]&&b.bossPos)R(b.ox+b.bossPos[0],b.oy+b.bossPos[1],2)});
  (E.ZS?E.ZS():[]).forEach((z,i)=>{if(m['z'+i])R((z.r[0]+z.r[1])/2,(z.r[2]+z.r[3])/2,2)});save()}
 function rv(cx,cy,noSave){if(cx<0||cy<0||cx>=CX||cy>=CY)return false;const i=cy*CX+cx;if(fog[i])return false;fog[i]=1;queue.push(i);return true}
 function save(){const e=enc();if(e!==lastEnc){lastEnc=e;E.S().fog=e;E.dirty()}}
 // llamado por fotograma/zona: revela las celdas a ≤ RV celdas del héroe (≈ 53 tiles = 1 700 px: más que la ventana del minimapa)
 function tick(x,y){if(!fog)return;const cx=Math.floor(x/T/CELL),cy=Math.floor(y/T/CELL),id=cy*CX+cx;if(id===last)return;last=id;let n=0;
  for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++)if(dx*dx+dy*dy<=RV*RV&&rv(cx+dx,cy+dy))n++;if(n)save()}
 const revealed=(x,y)=>{if(!fog)return false;const cx=Math.floor(x/T/CELL),cy=Math.floor(y/T/CELL);return cx>=0&&cy>=0&&cx<CX&&cy<CY&&!!fog[cy*CX+cx]};
 function trees(){treeB=new Map();E.N().forEach(e=>{if(!e.fix)return;const cx=Math.floor(e.x/T/CELL),cy=Math.floor(e.y/T/CELL),k=cy*CX+cx;let a=treeB.get(k);if(!a)treeB.set(k,a=[]);a.push(e.x,e.y)})}
 // -------- pintado de una celda (terreno + árboles + caminos + aldea) --------
 function paintCell(i){const cx=i%CX,cy=(i/CX)|0,tx0=cx*CELL,ty0=cy*CELL,tx1=Math.min(NX,tx0+CELL),ty1=Math.min(NY,ty0+CELL),TER=E.TER,mix=E.mix,BI=E.BI;
  q.save();q.beginPath();q.rect(tx0*PX,ty0*PX,(tx1-tx0)*PX,(ty1-ty0)*PX);q.clip();
  let lk=-2,Pk=null;
  for(let ty=ty0;ty<ty1;ty++)for(let tx=tx0;tx<tx1;tx++){const wx=(tx+.5)*T,wy=(ty+.5)*T,k=E.biomeAt(wx,wy);let col;
   if(k<0){col='#0b0a09'}else{if(k!==lk){lk=k;Pk=TER.PAL[k]}
    const h=TER.tileH(tx,ty);
    if(h===0)col='#1a1a1a';else if(h<1)col=Pk.w;
    else if(h>=2){const m=TER.mtnAt(wx,wy);col=m>0?mix('#6c675f','#d9d4c8',Math.min(1,m/5.5)):'#8f8a80'}   // cordillera: gris más claro cuanto más alta
    else if(TER.rk(tx,ty))col=mix('#a8a398','#ece8dc',(h-1)*.8);
    else{const sd=TER.sandAt(tx,ty);col=sd>.45?'#e3d199':h>1?mix(Pk.g,'#f2f6c8',Math.min(.6,(h-1)*.9)):Pk.g}}
   q.fillStyle=col;q.fillRect(tx*PX,ty*PX,PX,PX)}
  // bosques (árboles fijos)
  if(!treeB)trees();const tb=treeB.get(i);if(tb){q.fillStyle='#244a24';for(let j=0;j<tb.length;j+=2)q.fillRect(tb[j]/T*PX-1,tb[j+1]/T*PX-1,2.2,2.2)}
  const X0=tx0*T,Y0=ty0*T,X1=tx1*T,Y1=ty1*T,sc=PX/T,hit=(a,b,c,d)=>!(b<X0||a>X1||d<Y0||c>Y1);   // (xmin,xmax,ymin,ymax) corta la celda
  // calles adoquinadas y plazas de las aldeas (piedra clara) + caminos de tierra del bioma + edificios
  BI.forEach(b=>{const V=b.village;if(!V||!hit(b.ox,b.ox+b.w,b.oy,b.oy+b.h))return;
   if(V.plaza){q.fillStyle='#7c6a4c';V.plaza.forEach(p=>{if(!hit(b.ox+p[0]-p[2],b.ox+p[0]+p[2],b.oy+p[1]-p[2],b.oy+p[1]+p[2]))return;q.beginPath();q.arc((b.ox+p[0])*sc,(b.oy+p[1])*sc,p[2]*sc,0,7);q.fill()})}
   if(V.cobs){q.strokeStyle='#a39a88';q.lineCap='round';q.lineJoin='round';V.cobs.forEach(c=>{q.lineWidth=Math.max(1.2,2*c.w*sc);q.beginPath();c.p.forEach((p,j)=>j?q.lineTo((b.ox+p[0])*sc,(b.oy+p[1])*sc):q.moveTo((b.ox+p[0])*sc,(b.oy+p[1])*sc));q.stroke()})}});
  q.strokeStyle='#c9a46a';q.lineCap='round';q.lineJoin='round';q.lineWidth=Math.max(1.2,2.6*PX/2);
  BI.forEach(b=>{if(!b.routes||!hit(b.ox,b.ox+b.w,b.oy,b.oy+b.h))return;b.routes.forEach(r=>{let a=1e9,c=-1e9,d=1e9,e=-1e9;r.forEach(p=>{a=Math.min(a,p[0]);c=Math.max(c,p[0]);d=Math.min(d,p[1]);e=Math.max(e,p[1])});if(!hit(b.ox+a,b.ox+c,b.oy+d,b.oy+e))return;
    q.beginPath();r.forEach((p,j)=>j?q.lineTo((b.ox+p[0])*sc,(b.oy+p[1])*sc):q.moveTo((b.ox+p[0])*sc,(b.oy+p[1])*sc));q.stroke()})});
  const PK=window.PROP_K||1;
  BI.forEach(b=>{const V=b.village;if(!V||!V.props||!hit(b.ox,b.ox+b.w,b.oy,b.oy+b.h))return;
   V.props.forEach(p=>{if(!p.fp||p.fp[0]*p.fp[1]<500)return;const w=p.fp[0]*PK,h=p.fp[1]*PK,x=b.ox+p.x,y=b.oy+p.y;if(!hit(x-w,x+w,y-h,y+h))return;
    q.fillStyle='#3b2c20';q.fillRect((x-w)*sc,(y-h)*sc,2*w*sc,2*h*sc);q.fillStyle='#8a6a48';q.fillRect((x-w)*sc+.5,(y-h)*sc+.5,Math.max(1,2*w*sc-1),Math.max(1,2*h*sc-1))})});
  q.restore()}
 // pinta celdas pendientes con un presupuesto de milisegundos por fotograma (al cargar una partida avanzada pueden ser cientos)
 function paint(ms){if(!queue.length)return;const t0=performance.now();let n=0,hx=last<0?0:last%CX,hy=last<0?0:(last/CX)|0;
  while(queue.length&&(performance.now()-t0<ms||n===0)){let b=0,bd=1e9;for(let j=0;j<queue.length;j++){const i=queue[j],d=((i%CX)-hx)**2+(((i/CX)|0)-hy)**2;if(d<bd){bd=d;b=j}}   // primero las celdas más cercanas al héroe (las que ve el minimapa)
   const c=queue[b];queue[b]=queue[queue.length-1];queue.pop();paintCell(c);n++;painted++}paintMs+=performance.now()-t0}
 // -------- dibujo --------
 // MINIMAPA LOCAL: círculo de diámetro d con centro (cx,cy) en pantalla. Devuelve proyector (mundo → pantalla) y escala (px de pantalla por px de mundo).
 // H8 (Susurro): el mapa se pinta en un lienzo auxiliar y se aplica una máscara radial suave (sin borde duro ni marco); el proyector devuelto es el mismo de siempre.
 let mmc=null,mmq=null,mmb=null;
 function local(ctx,cx,cy,d,px,py,az){const s=d/2/LOCAL_R,ca=Math.cos(az),sa=Math.sin(az),h=LOCAL_R/T*PX,k=(ctx.getTransform&&ctx.getTransform().a)||1,n=Math.ceil(d*k)+4,u=n/k,c0=u/2;
  if(!mmc||mmc.width!==n){mmc=document.createElement('canvas');mmc.width=mmc.height=n;mmq=mmc.getContext('2d')}
  const g=mmq;g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-over';g.clearRect(0,0,n,n);g.setTransform(k,0,0,k,0,0);
  g.save();g.beginPath();g.arc(c0,c0,d/2,0,7);g.clip();g.fillStyle=FOGC;g.fillRect(c0-d/2,c0-d/2,d,d);
  g.translate(c0,c0);g.rotate(az);g.imageSmoothingEnabled=true;
  const sx=px/T*PX-h,sy=py/T*PX-h;try{g.drawImage(cv,sx,sy,2*h,2*h,-LOCAL_R*s,-LOCAL_R*s,2*LOCAL_R*s,2*LOCAL_R*s);muteMap(g,-LOCAL_R*s,-LOCAL_R*s,2*LOCAL_R*s,2*LOCAL_R*s)}catch(e){}
  g.restore();
  if(typeof BR!=='undefined'&&BR.map>.02){const m=BR.map,sm=Math.max(8,Math.round(n*(1-.78*m)));if(!mmb)mmb=document.createElement('canvas');mmb.width=mmb.height=sm;const b=mmb.getContext('2d');b.imageSmoothingEnabled=true;b.drawImage(mmc,0,0,n,n,0,0,sm,sm);g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='copy';g.imageSmoothingEnabled=true;g.drawImage(mmb,0,0,sm,sm,0,0,n,n);g.globalCompositeOperation='source-over';g.setTransform(k,0,0,k,0,0)}   // Fase B3: poca visibilidad = minimapa difuso (se reduce y se reescala; sin filtros de canvas)
  g.globalCompositeOperation='destination-in';const gr=g.createRadialGradient(c0,c0,d/2*.62,c0,c0,d/2);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(.55,'rgba(0,0,0,.85)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,u,u);g.globalCompositeOperation='source-over';
  ctx.drawImage(mmc,cx-c0,cy-c0,u,u);
  return{s,az,cx,cy,r:d/2,proj:(wx,wy)=>{const dx=wx-px,dy=wy-py;return[cx+(dx*ca-dy*sa)*s,cy+(dx*sa+dy*ca)*s]}}}
 // MAPA GRANDE: el mundo entero con el norte arriba en el rectángulo (x,y,w,h) (se respeta la proporción y se centra)
 function big(ctx,x,y,w,h,before){const a=NX/NY,ww=Math.min(w,h*a),hh=ww/a,ox=x+(w-ww)/2,oy=y+(h-hh)/2,s=ww/(NX*T);
  if(before)before(ox,oy,ww,hh);ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(cv,ox,oy,ww,hh);muteMap(ctx,ox,oy,ww,hh);ctx.restore();
  return{s,ox,oy,w:ww,h:hh,proj:(wx,wy)=>[ox+wx*s,oy+wy*s]}}
 const stats=()=>({cells:CX*CY,revealed:fog?fog.reduce((a,b)=>a+b,0):0,queued:queue.length,painted,paintMs:Math.round(paintMs),cv:cv?[cv.width,cv.height]:null,fog:lastEnc.length});
 function revealAll(){for(let i=0;i<fog.length;i++)if(!fog[i]){fog[i]=1;queue.push(i)}save()}
 function reset(){fog.fill(0);queue=[];q.fillStyle=FOGC;q.fillRect(0,0,cv.width,cv.height);last=-1;lastEnc='';delete E.S().fog}
 return{init,tick,paint,local,big,revealed,stats,revealAll,reset,get ready(){return!!fog},get canvas(){return cv},CELL,PX,LOCAL_R}})();
