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
 const T=32,CELL=16,RV=3.3,LOCAL_R=1200,FOGC='#0d0b09';
 let PX=2;   // px por tile del lienzo único: 2 normalmente; 1 en mundos enormes (?map=A a K=6 = 13 M tiles → 53 MB en vez de 213 MB)
 // ESTILO DIBUJADO (E-MAPA, 27 oct 2026; «como dibujado, como en World of Warcraft»): pergamino con ruido, tierra teñida por bioma, TINTA en la costa, líneas de ola en el mar, picos dibujados en las montañas, copas de árbol, ríos azul tinta,
 // caminos de trazos y casitas en las aldeas (misma paleta que docs/style-reference/mapa_antiguo_A.html). `?mapstyle=0` vuelve al mapa plano de siempre.
 const PAINTED=!/[?&]mapstyle=0\b/.test(location.search);
 // R3D-ESTETICA: el mapa se pintaba con la paleta pastel (verde lima) y era lo más saturado de la pantalla. Se apaga la saturación y se vela con pergamino (misma gama que el mundo óleo). `?mapmute=0` lo quita.
 const MAPMUTE=(()=>{try{const v=new URLSearchParams(location.search).get('mapmute');return v==null?1:Math.max(0,Math.min(1,+v||0))}catch(e){return 1}})();
 function muteMap(c,x,y,w,h){if(!MAPMUTE||PAINTED)return;c.save();try{c.globalCompositeOperation='saturation';c.fillStyle='rgba(128,128,128,'+(.5*MAPMUTE)+')';c.fillRect(x,y,w,h);c.globalCompositeOperation='multiply';c.fillStyle='rgba(222,206,170,'+(.55*MAPMUTE)+')';c.fillRect(x,y,w,h)}catch(e){}c.restore()}
 let E=null,NX=0,NY=0,CX=0,CY=0,fog=null,pdone=null,cv=null,q=null,queue=[],last=-1,treeB=null,lastEnc='',painted=0,paintMs=0;
 const enc=()=>{let s='';for(let i=0;i<fog.length;i+=4)s+=((fog[i]?8:0)|(fog[i+1]?4:0)|(fog[i+2]?2:0)|(fog[i+3]?1:0)).toString(16);return CX+'x'+CY+':'+s};
 const dec=str=>{const m=/^(\d+)x(\d+):([0-9a-f]*)$/.exec(str||'');if(!m||+m[1]!==CX||+m[2]!==CY||m[3].length<Math.ceil(CX*CY/4))return false;
  for(let i=0;i<fog.length;i++){const n=parseInt(m[3][i>>2],16)||0;fog[i]=(n>>(3-(i&3)))&1}return true};
 function init(env){E=env;NX=E.TER.NX;NY=E.TER.NY;PX=NX*NY>9e6?1:2;CX=Math.ceil(NX/CELL);CY=Math.ceil(NY/CELL);fog=new Uint8Array(CX*CY);pdone=new Uint8Array(CX*CY);
  cv=document.createElement('canvas');cv.width=NX*PX;cv.height=NY*PX;q=cv.getContext('2d',PAINTED?{willReadFrequently:true}:undefined);q.fillStyle=FOGC;q.fillRect(0,0,cv.width,cv.height);
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
 // E3/E4: un hito (atalaya) revela de golpe un círculo de `r` celdas alrededor
 function revealAt(x,y,r){if(!fog)return;const cx=Math.floor(x/T/CELL),cy=Math.floor(y/T/CELL);let n=0;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(dx*dx+dy*dy<=r*r&&rv(cx+dx,cy+dy))n++;if(n)save()}
 const revealed=(x,y)=>{if(!fog)return false;const cx=Math.floor(x/T/CELL),cy=Math.floor(y/T/CELL);return cx>=0&&cy>=0&&cx<CX&&cy<CY&&!!fog[cy*CX+cx]};
 function trees(){treeB=new Map();E.N().forEach(e=>{if(PAINTED?e.t!=='wc':!e.fix)return;const cx=Math.floor(e.x/T/CELL),cy=Math.floor(e.y/T/CELL),k=cy*CX+cx;let a=treeB.get(k);if(!a)treeB.set(k,a=[]);a.push(e.x,e.y)})}
 // -------- pintado de una celda (terreno + árboles + caminos + aldea) --------
 let cbuf=null,cb32=null;const PXC=new Map();let pxc=null;
 function px32(c){let v=PXC.get(c);if(v!==undefined)return v;let r=0,g=0,b=0;if(/^#[0-9a-f]{6}$/i.test(c)){const n=parseInt(c.slice(1),16);r=n>>16&255;g=n>>8&255;b=n&255}else{if(!pxc){pxc=document.createElement('canvas').getContext('2d',{willReadFrequently:true})}pxc.clearRect(0,0,1,1);pxc.fillStyle=c;pxc.fillRect(0,0,1,1);[r,g,b]=pxc.getImageData(0,0,1,1).data}
  v=(255<<24|b<<16|g<<8|r)>>>0;if(PXC.size>4096)PXC.clear();PXC.set(c,v);return v}   // píxel ABGR (little-endian) de un color CSS
 // -------- pintado DIBUJADO de una celda (pergamino, tinta, olas, picos, copas, caminos de trazos) --------
 const PAR=[233,217,174],INK=[59,42,26],BCOL=[[159,196,106],[79,143,74],[106,148,127],[211,221,224],[207,132,132],[185,90,60],[154,127,176],[223,189,114],[185,183,143],[205,238,255]];
 const hsh=(x,y,s)=>{let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,1442695041);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};
 const mx=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t],pk=(r,g,b)=>(255<<24|(b<0?0:b>255?255:b|0)<<16|(g<0?0:g>255?255:g|0)<<8|(r<0?0:r>255?255:r|0))>>>0;
 function paintCellP(i,q,PX,ox,oy,det){const cx=i%CX,cy=(i/CX)|0,tx0=cx*CELL,ty0=cy*CELL,tx1=Math.min(NX,tx0+CELL),ty1=Math.min(NY,ty0+CELL),TER=E.TER,w=tx1-tx0,h=ty1-ty0,gw=w*PX,gh=h*PX,cD=TER.coastD;
  if(!(gw>0&&gh>0))return;   /* 28 oct 2026: celda fuera del mundo (el héroe dentro de una sala/cueva) → antes lanzaba «createImageData … not of type long» */
  let bI,b32;if(det){bI=q.createImageData(gw,gh);b32=new Uint32Array(bI.data.buffer)}else{if(!cbuf||cbuf.width!==gw||cbuf.height!==gh){cbuf=q.createImageData(gw,gh);cb32=new Uint32Array(cbuf.data.buffer)}bI=cbuf;b32=cb32}
  // clase de cada tile de la celda y su vecindad (1 tile de margen): 0 vacío · 1 mar · 2 agua interior (río/lago) · 3 tierra · 4 montaña
  const kls=new Uint8Array((w+2)*(h+2)),hh=new Float32Array((w+2)*(h+2));
  for(let y=-1;y<=h;y++)for(let x=-1;x<=w;x++){const tx=tx0+x,ty=ty0+y,o=(y+1)*(w+2)+x+1;
   if(tx<0||ty<0||tx>=NX||ty>=NY){kls[o]=1;continue}
   const H=TER.heightAt((tx+.5)*T,(ty+.5)*T);hh[o]=H;let c;if(H===0)c=0;else if(H<1){c=(cD&&cD((tx+.5)*T,(ty+.5)*T)<=0)?1:2}else if(H>=2)c=4;else c=3;kls[o]=c}
  for(let ty=ty0;ty<ty1;ty++)for(let tx=tx0;tx<tx1;tx++){const x=tx-tx0,y=ty-ty0,o=(y+1)*(w+2)+x+1,c=kls[o],wx=(tx+.5)*T,wy=(ty+.5)*T,k=E.biomeAt(wx,wy),bc=BCOL[k<0?0:Math.min(9,k)];
   let col;
   if(c===0||k<0)col=[14,12,10];
   else if(c===1){col=mx(PAR,[150,176,176],.42);const d=cD?-cD(wx,wy):0;for(let b=0;b<4;b++){const L=[5,11,18,27][b];if(Math.abs(d-L)<.55){const f=1-(.34-b*.07)*.7;col=[col[0]*f,col[1]*(1-(.34-b*.07)*.55),col[2]*(1-(.34-b*.07)*.35)];break}}}
   else if(c===2){col=[143,182,191]}
   else{col=mx(PAR,bc,.62);const sd=TER.sandAt(tx,ty);if(sd>.45)col=mx(col,[232,214,160],.6);
    if(c===4){const m=TER.mtnAt(wx,wy);col=mx(col,m>0?mx([140,128,114],[225,220,210],Math.min(1,m/6)):[130,120,108],.7)}
    else if(hh[o]>1)col=mx(col,[246,240,214],Math.min(.45,(hh[o]-1)*.7))}
   const nw=(hsh(tx,ty,3)-.5)*.05;
   for(let yy=0;yy<PX;yy++)for(let xx=0;xx<PX;xx++){const n=.9+.2*(hsh((tx*PX+xx)>>2,(ty*PX+yy)>>2,5))+nw+(hsh(tx*PX+xx,ty*PX+yy,7)-.5)*.06;let r=col[0],g=col[1],b=col[2];
    if(c!==0&&k>=0){r*=n;g*=n;b*=n;
     if(c>=3){   // TINTA en la orilla: el borde de la tierra pegado al agua/mar
      const wat=v=>v===1||v===2;let ink=0;if(xx===0&&wat(kls[o-1]))ink=1;if(xx===PX-1&&wat(kls[o+1]))ink=1;if(yy===0&&wat(kls[o-(w+2)]))ink=1;if(yy===PX-1&&wat(kls[o+(w+2)]))ink=1;if(ink){r=INK[0];g=INK[1];b=INK[2]}}
     else if(c===2){const wl=v=>v>=3;let e=0;if(xx===0&&wl(kls[o-1]))e=1;if(xx===PX-1&&wl(kls[o+1]))e=1;if(yy===0&&wl(kls[o-(w+2)]))e=1;if(yy===PX-1&&wl(kls[o+(w+2)]))e=1;if(e){r=74;g=122;b=143}}}
    b32[(y*PX+yy)*gw+x*PX+xx]=pk(r,g,b)}}
  q.putImageData(bI,tx0*PX-ox,ty0*PX-oy);q.save();q.translate(-ox,-oy);q.beginPath();q.rect(tx0*PX,ty0*PX,gw,gh);q.clip();
  const sc=PX/T,X0=tx0*T,Y0=ty0*T,X1=tx1*T,Y1=ty1*T,hit=(a,b,c,d)=>!(b<X0||a>X1||d<Y0||c>Y1);
  // PICOS dibujados (montañas): cada ~5 tiles de núcleo, con cara de luz, cara de sombra y contorno de tinta
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(kls[(y+1)*(w+2)+x+1]!==4)continue;const tx=tx0+x,ty=ty0+y;if(hsh(tx>>1,ty>>1,11)>.34||((tx>>1)+(ty>>1))%2)continue;
   const m=TER.mtnAt((tx+.5)*T,(ty+.5)*T),sz=(3.2+Math.min(m,6)*.5)*Math.max(1,PX*.8),px=(tx+hsh(tx,ty,13))*PX,py=(ty+1)*PX;
   q.beginPath();q.moveTo(px-sz*.9,py);q.lineTo(px,py-sz*1.5);q.lineTo(px+sz*.9,py);q.closePath();q.fillStyle='#d9d2c4';q.fill();
   q.beginPath();q.moveTo(px,py-sz*1.5);q.lineTo(px+sz*.9,py);q.lineTo(px+sz*.1,py);q.closePath();q.fillStyle='#8a8074';q.fill();
   q.beginPath();q.moveTo(px-sz*.9,py);q.lineTo(px,py-sz*1.5);q.lineTo(px+sz*.9,py);q.strokeStyle='#3b2a1a';q.lineWidth=Math.max(.6,PX*.45);q.stroke()}
  // COPAS de árbol (bosques y árboles sueltos)
  if(!treeB)trees();const tb=treeB.get(i);if(tb){const r=Math.max(1.1,PX*.9);for(let j=0;j<tb.length;j+=2){const x=tb[j]/T*PX,y=tb[j+1]/T*PX;q.fillStyle='#34602c';q.beginPath();q.arc(x,y-r*.6,r,0,7);q.fill();q.fillStyle='#6a9a4a';q.fillRect(x-r*.45,y-r*1.35,r*.55,r*.5)}}
  // CALLES, plazas y CAMINOS de trazos; edificios con tinta; aldea con su casita
  const BI=E.BI;
  BI.forEach(b=>{const V=b.village;if(!V||!hit(b.ox,b.ox+b.w,b.oy,b.oy+b.h))return;
   if(V.plaza){q.fillStyle='#b69a6a';V.plaza.forEach(p=>{if(!hit(b.ox+p[0]-p[2],b.ox+p[0]+p[2],b.oy+p[1]-p[2],b.oy+p[1]+p[2]))return;q.beginPath();q.arc((b.ox+p[0])*sc,(b.oy+p[1])*sc,p[2]*sc,0,7);q.fill()})}
   if(V.cobs){q.strokeStyle='#a89472';q.lineCap='round';q.lineJoin='round';V.cobs.forEach(c=>{q.lineWidth=Math.max(1,1.6*c.w*sc);q.beginPath();c.p.forEach((p,j)=>j?q.lineTo((b.ox+p[0])*sc,(b.oy+p[1])*sc):q.moveTo((b.ox+p[0])*sc,(b.oy+p[1])*sc));q.stroke()})}});
  q.strokeStyle='#7a5a38';q.lineCap='round';q.lineJoin='round';q.lineWidth=Math.max(1,PX*.9);q.setLineDash([PX*3.2,PX*2.2]);
  BI.forEach(b=>{if(!b.routes)return;b.routes.forEach(r=>{let a=1e9,c=-1e9,d=1e9,e=-1e9;r.forEach(p=>{a=Math.min(a,p[0]);c=Math.max(c,p[0]);d=Math.min(d,p[1]);e=Math.max(e,p[1])});if(!hit(b.ox+a,b.ox+c,b.oy+d,b.oy+e))return;   // caja de la ruta (los caminos A* cruzan biomas: solo se mira su propia caja)
    q.beginPath();r.forEach((p,j)=>j?q.lineTo((b.ox+p[0])*sc,(b.oy+p[1])*sc):q.moveTo((b.ox+p[0])*sc,(b.oy+p[1])*sc));q.stroke()})});
  q.setLineDash([]);
  const PK=window.PROP_K||1;
  BI.forEach(b=>{const V=b.village;if(!V||!V.props)return;
   if(hit(b.ox,b.ox+b.w,b.oy,b.oy+b.h))V.props.forEach(p=>{if(!p.fp||p.fp[0]*p.fp[1]<500)return;const w2=p.fp[0]*PK,h2=p.fp[1]*PK,x=b.ox+p.x,y=b.oy+p.y;if(!hit(x-w2,x+w2,y-h2,y+h2))return;
    q.fillStyle='#e9d6a8';q.fillRect((x-w2)*sc,(y-h2)*sc,2*w2*sc,2*h2*sc);q.strokeStyle='#3b2a1a';q.lineWidth=Math.max(.5,PX*.4);q.strokeRect((x-w2)*sc,(y-h2)*sc,2*w2*sc,2*h2*sc)});
   const vx=b.ox+(b.cen?b.cen[0]:b.w/2),vy=b.oy+(b.cen?b.cen[1]:b.h/2);if(!b.zone&&hit(vx-300,vx+300,vy-300,vy+300)){const X=vx*sc,Y=vy*sc,z=PX*3.2;q.fillStyle='#f4e6bc';q.strokeStyle='#3b2a1a';q.lineWidth=Math.max(.7,PX*.5);q.beginPath();q.moveTo(X-z,Y);q.lineTo(X-z,Y-z*.9);q.lineTo(X,Y-z*1.7);q.lineTo(X+z,Y-z*.9);q.lineTo(X+z,Y);q.closePath();q.fill();q.stroke()}});
  q.restore()}
 function paintCell(i){if(PAINTED)return paintCellP(i,q,PX,0,0,0);const cx=i%CX,cy=(i/CX)|0,tx0=cx*CELL,ty0=cy*CELL,tx1=Math.min(NX,tx0+CELL),ty1=Math.min(NY,ty0+CELL),TER=E.TER,mix=E.mix,BI=E.BI;
  // FLUIDEZ (26 oct 2026): el suelo de la celda va a un BÚFER DE PÍXELES y se sube con un putImageData (antes 256 fillRect con un fillStyle distinto cada uno ≈ 9 ms por celda,
  // y al explorar se pintaba una celda en CADA fotograma = tirones al caminar). Mismos colores; la conversión hex→píxel se cachea.
  const gw=(tx1-tx0)*PX,gh=(ty1-ty0)*PX;if(!(gw>0&&gh>0))return;if(!cbuf||cbuf.width!==gw||cbuf.height!==gh){cbuf=q.createImageData(gw,gh);cb32=new Uint32Array(cbuf.data.buffer)}
  q.save();q.beginPath();q.rect(tx0*PX,ty0*PX,(tx1-tx0)*PX,(ty1-ty0)*PX);q.clip();
  let lk=-2,Pk=null;
  for(let ty=ty0;ty<ty1;ty++)for(let tx=tx0;tx<tx1;tx++){const wx=(tx+.5)*T,wy=(ty+.5)*T,k=E.biomeAt(wx,wy);let col;
   if(k<0){col='#0b0a09'}else{if(k!==lk){lk=k;Pk=TER.PAL[k]}
    const h=TER.tileH(tx,ty);
    if(h===0)col='#1a1a1a';else if(h<1)col=Pk.w;
    else if(h>=2){const m=TER.mtnAt(wx,wy);col=m>0?mix('#6c675f','#d9d4c8',Math.min(1,m/5.5)):'#8f8a80'}   // cordillera: gris más claro cuanto más alta
    else if(TER.rk(tx,ty))col=mix('#a8a398','#ece8dc',(h-1)*.8);
    else{const sd=TER.sandAt(tx,ty);col=sd>.45?'#e3d199':h>1?mix(Pk.g,'#f2f6c8',Math.min(.6,(h-1)*.9)):Pk.g}}
   const pv=px32(col),bx=(tx-tx0)*PX,by=(ty-ty0)*PX;for(let yy=0;yy<PX;yy++){const o=(by+yy)*gw+bx;for(let xx=0;xx<PX;xx++)cb32[o+xx]=pv}}
  q.putImageData(cbuf,tx0*PX,ty0*PX);
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
   const c=queue[b];queue[b]=queue[queue.length-1];queue.pop();paintCell(c);pdone[c]=1;n++;painted++}paintMs+=performance.now()-t0}
 // -------- dibujo --------
 // MINIMAPA LOCAL: círculo de diámetro d con centro (cx,cy) en pantalla. Devuelve proyector (mundo → pantalla) y escala (px de pantalla por px de mundo).
 // H8 (Susurro): el mapa se pinta en un lienzo auxiliar y se aplica una máscara radial suave (sin borde duro ni marco); el proyector devuelto es el mismo de siempre.
 // CAPA DE DETALLE del minimapa (E-MAPA-4, 27 oct 2026): con el lienzo a 1 px/tile (`?map=A` a K=6) el minimapa se veía suave; las celdas REVELADAS que caen en su ventana se repintan a 3 px/tile
 // en lienzos pequeños (48×48 px) con una caché LRU de 120 y como mucho 2 nuevos por fotograma. `?mapdetail=0` la apaga. Solo actúa si PX === 1 (con 2 px/tile el minimapa ya es nítido).
 const DPX=3,DCACHE=new Map(),DMAX=120,detailOn=()=>PAINTED&&PX===1&&!/[?&]mapdetail=0\b/.test(location.search);let dBud=0;
 function detailCell(i){let c=DCACHE.get(i);if(c){DCACHE.delete(i);DCACHE.set(i,c);return c}
  if(dBud<=0)return null;dBud--;const cx=i%CX,cy=(i/CX)|0,w=Math.min(NX,(cx+1)*CELL)-cx*CELL,h=Math.min(NY,(cy+1)*CELL)-cy*CELL;
  c=document.createElement('canvas');c.width=w*DPX;c.height=h*DPX;paintCellP(i,c.getContext('2d',{willReadFrequently:true}),DPX,cx*CELL*DPX,cy*CELL*DPX,1);
  DCACHE.set(i,c);if(DCACHE.size>DMAX)DCACHE.delete(DCACHE.keys().next().value);return c}
 // celdas visibles de la ventana (±LOCAL_R) con detalle, dibujadas sobre el mapa base ya girado (el contexto `g` tiene el origen en el héroe)
 function detailOverlay(g,px,py,s){dBud=2;const R=LOCAL_R,x0=Math.floor((px-R)/T/CELL),x1=Math.floor((px+R)/T/CELL),y0=Math.floor((py-R)/T/CELL),y1=Math.floor((py+R)/T/CELL);
  for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++){if(cx<0||cy<0||cx>=CX||cy>=CY)continue;const i=cy*CX+cx;if(!fog[i]||!pdone[i])continue;const dc=detailCell(i);if(!dc)continue;
   g.drawImage(dc,(cx*CELL*T-px)*s,(cy*CELL*T-py)*s,dc.width/DPX*T*s,dc.height/DPX*T*s)}}
 let mmc=null,mmq=null,mmb=null;
 function local(ctx,cx,cy,d,px,py,az){const s=d/2/LOCAL_R,ca=Math.cos(az),sa=Math.sin(az),h=LOCAL_R/T*PX,k=(ctx.getTransform&&ctx.getTransform().a)||1,n=Math.ceil(d*k)+4,u=n/k,c0=u/2;
  if(!mmc||mmc.width!==n){mmc=document.createElement('canvas');mmc.width=mmc.height=n;mmq=mmc.getContext('2d')}
  const g=mmq;g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-over';g.clearRect(0,0,n,n);g.setTransform(k,0,0,k,0,0);
  g.save();g.beginPath();g.arc(c0,c0,d/2,0,7);g.clip();g.fillStyle=FOGC;g.fillRect(c0-d/2,c0-d/2,d,d);
  g.translate(c0,c0);g.rotate(az);g.imageSmoothingEnabled=true;
  const sx=px/T*PX-h,sy=py/T*PX-h;try{g.drawImage(cv,sx,sy,2*h,2*h,-LOCAL_R*s,-LOCAL_R*s,2*LOCAL_R*s,2*LOCAL_R*s);muteMap(g,-LOCAL_R*s,-LOCAL_R*s,2*LOCAL_R*s,2*LOCAL_R*s);if(detailOn())detailOverlay(g,px,py,s)}catch(e){}
  g.restore();
  if(typeof BR!=='undefined'&&BR.map>.02){const m=BR.map,sm=Math.max(8,Math.round(n*(1-.78*m)));if(!mmb)mmb=document.createElement('canvas');mmb.width=mmb.height=sm;const b=mmb.getContext('2d');b.imageSmoothingEnabled=true;b.drawImage(mmc,0,0,n,n,0,0,sm,sm);g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='copy';g.imageSmoothingEnabled=true;g.drawImage(mmb,0,0,sm,sm,0,0,n,n);g.globalCompositeOperation='source-over';g.setTransform(k,0,0,k,0,0)}   // Fase B3: poca visibilidad = minimapa difuso (se reduce y se reescala; sin filtros de canvas)
  g.globalCompositeOperation='destination-in';const gr=g.createRadialGradient(c0,c0,d/2*.62,c0,c0,d/2);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(.55,'rgba(0,0,0,.85)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,u,u);g.globalCompositeOperation='source-over';
  ctx.drawImage(mmc,cx-c0,cy-c0,u,u);
  return{s,az,cx,cy,r:d/2,proj:(wx,wy)=>{const dx=wx-px,dy=wy-py;return[cx+(dx*ca-dy*sa)*s,cy+(dx*sa+dy*ca)*s]}}}
 // MAPA GRANDE: el mundo entero con el norte arriba en el rectángulo (x,y,w,h) (se respeta la proporción y se centra)
 // MARCO DE PERGAMINO del mapa grande (E-MAPA-4): banda de pergamino con ruido y manchas, doble filete de tinta, REGLA de escala con casillas alternas (como los mapas antiguos), adornos en las esquinas,
 // viñeta de tinta sobre el mapa y una ROSA DE LOS VIENTOS. `before` (la placa del HUD) se dibuja debajo.
 const FB=16;
 function frameBack(c,x,y,w,h){c.save();const g=c.createLinearGradient(x-FB,y-FB,x+w+FB,y+h+FB);g.addColorStop(0,'#e6d6a6');g.addColorStop(.5,'#d9c690');g.addColorStop(1,'#cdb77f');c.fillStyle=g;c.fillRect(x-FB,y-FB,w+2*FB,h+2*FB);
  for(let i=0;i<46;i++){const rx=x-FB+hsh(i,1,41)*(w+2*FB),ry=y-FB+hsh(i,2,41)*(h+2*FB),rr=10+hsh(i,3,41)*38;const gr=c.createRadialGradient(rx,ry,0,rx,ry,rr);gr.addColorStop(0,'rgba(120,84,40,'+(.05+hsh(i,4,41)*.07)+')');gr.addColorStop(1,'rgba(120,84,40,0)');c.fillStyle=gr;c.fillRect(rx-rr,ry-rr,2*rr,2*rr)}
  c.restore()}
 function frameFront(c,x,y,w,h){c.save();const INKC='#3b2a1a';
  // viñeta de tinta suave sobre el borde del mapa
  const v=c.createRadialGradient(x+w/2,y+h/2,Math.min(w,h)*.42,x+w/2,y+h/2,Math.hypot(w,h)*.52);v.addColorStop(0,'rgba(59,42,26,0)');v.addColorStop(1,'rgba(59,42,26,.38)');c.fillStyle=v;c.fillRect(x,y,w,h);
  // regla: casillas alternas negras/pergamino a lo largo de los cuatro lados (entre dos filetes)
  const n=24,tk=6;c.fillStyle=INKC;
  for(let i=0;i<n;i++){if(i%2)continue;const a=x+w*i/n,b=w/n,d=y+h*i/n,e=h/n;c.fillRect(a,y-tk-3,b,tk);c.fillRect(a,y+h+3,b,tk);c.fillRect(x-tk-3,d,tk,e);c.fillRect(x+w+3,d,tk,e)}
  c.strokeStyle=INKC;c.lineWidth=2;c.strokeRect(x,y,w,h);c.lineWidth=1;c.strokeRect(x-tk-3,y-tk-3,w+2*(tk+3),h+2*(tk+3));c.strokeRect(x-FB+1,y-FB+1,w+2*FB-2,h+2*FB-2);
  // adornos de esquina: rombo con punto
  [[x-tk-3,y-tk-3],[x+w+tk+3,y-tk-3],[x-tk-3,y+h+tk+3],[x+w+tk+3,y+h+tk+3]].forEach(([cx,cy])=>{c.fillStyle='#e6d6a6';c.strokeStyle=INKC;c.lineWidth=1.4;c.beginPath();c.moveTo(cx,cy-8);c.lineTo(cx+8,cy);c.lineTo(cx,cy+8);c.lineTo(cx-8,cy);c.closePath();c.fill();c.stroke();c.fillStyle=INKC;c.beginPath();c.arc(cx,cy,2,0,7);c.fill()});
  // rosa de los vientos (esquina inferior izquierda con ?map=A, sobre el mar; inferior derecha en la rejilla)
  const R=Math.max(20,Math.min(34,Math.min(w,h)*.06)),rx=(typeof BIOMES!=='undefined'&&BIOMES.mapA)?x+R+16:x+w-R-16,ry=y+h-R-22;c.translate(rx,ry);c.globalAlpha=.78;
  c.fillStyle='rgba(233,217,174,.7)';c.beginPath();c.arc(0,0,R*1.05,0,7);c.fill();c.strokeStyle=INKC;c.lineWidth=1.2;c.beginPath();c.arc(0,0,R*.62,0,7);c.stroke();c.beginPath();c.arc(0,0,R*1.05,0,7);c.stroke();
  for(let k=0;k<8;k++){const a=k*Math.PI/4-Math.PI/2,len=k%2?R*.62:R,wd=k%2?R*.1:R*.16;c.save();c.rotate(a+Math.PI/2);c.beginPath();c.moveTo(0,-len);c.lineTo(wd,0);c.lineTo(0,len*.2);c.lineTo(-wd,0);c.closePath();c.fillStyle=k%2?'#f4e6bc':(k===0?'#8c2f1f':INKC);c.fill();c.stroke();c.restore()}
  c.fillStyle=INKC;c.font='700 '+Math.round(R*.46)+'px Cinzel, Georgia, serif';c.textAlign='center';c.textBaseline='middle';c.fillText('N',0,-R*1.32);
  c.restore()}
 // CARTELA (E-MAPA-5): cinta de pergamino con tinta para el título (arriba, fuera del marco) o la leyenda (abajo); `txt` se mide y la cinta se ajusta; devuelve el ancho
 function cartouche(c,cx,cy,txt,px){c.save();const INKC='#3b2a1a';c.font='600 '+(px||15)+'px Cinzel, Georgia, serif';c.textAlign='center';c.textBaseline='middle';const tw=c.measureText(txt).width,hw=tw/2+22,hh=(px||15)/2+7;
  const g=c.createLinearGradient(cx,cy-hh,cx,cy+hh);g.addColorStop(0,'#e9dab0');g.addColorStop(1,'#cdb77f');c.fillStyle=g;c.strokeStyle=INKC;c.lineWidth=1.6;
  c.beginPath();c.moveTo(cx-hw,cy-hh);c.lineTo(cx+hw,cy-hh);c.lineTo(cx+hw+10,cy);c.lineTo(cx+hw,cy+hh);c.lineTo(cx-hw,cy+hh);c.lineTo(cx-hw-10,cy);c.closePath();c.fill();c.stroke();
  c.lineWidth=.8;c.strokeRect(cx-hw+4,cy-hh+3,2*hw-8,2*hh-6);c.fillStyle=INKC;c.fillText(txt,cx,cy+.5);c.restore();return 2*hw+20}
 function big(ctx,x,y,w,h,before){const a=NX/NY,ww=Math.min(w,h*a),hh=ww/a,ox=x+(w-ww)/2,oy=y+(h-hh)/2,s=ww/(NX*T);
  if(before)before(ox,oy,ww,hh);if(PAINTED)frameBack(ctx,ox,oy,ww,hh);ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(cv,ox,oy,ww,hh);muteMap(ctx,ox,oy,ww,hh);ctx.restore();if(PAINTED)frameFront(ctx,ox,oy,ww,hh);
  return{s,ox,oy,w:ww,h:hh,proj:(wx,wy)=>[ox+wx*s,oy+wy*s]}}
 const stats=()=>({cells:CX*CY,revealed:fog?fog.reduce((a,b)=>a+b,0):0,queued:queue.length,painted,paintMs:Math.round(paintMs),cv:cv?[cv.width,cv.height]:null,fog:lastEnc.length});
 function revealAll(){for(let i=0;i<fog.length;i++)if(!fog[i]){fog[i]=1;queue.push(i)}save()}
 function reset(){fog.fill(0);pdone.fill(0);DCACHE.clear();queue=[];q.fillStyle=FOGC;q.fillRect(0,0,cv.width,cv.height);last=-1;lastEnc='';delete E.S().fog}
 return{init,tick,paint,local,big,cartouche,FB,get painted(){return PAINTED},revealed,stats,revealAll,revealAt,reset,get ready(){return!!fog},get canvas(){return cv},CELL,get PX(){return PX},LOCAL_R}})();
