// NotScape · LUZ DINÁMICA (oct 2026). Sustituye al viejo «velo oscuro con agujeros redondos» de lighting() en game.js.
// Qué hace, de noche / al atardecer / con tormenta:
//  1) Cada luz (fogata, horno, farolas, braseros, linternas, mostrador, antorchas del campamento, el propio jugador) pinta un disco de luz en un MAPA DE LUZ de baja resolución (1/3 de la vista).
//  2) Los OBJETOS BLOQUEAN la luz: cada oclusor (casa, árbol, roca, valla, estación, jugador…) proyecta una sombra desde la luz (casco convexo de su huella + su proyección alejándose de la luz).
//     Las bajas (barril, caja) dan sombras cortas que se desvanecen; las altas llegan hasta el radio de la luz. El borde es suave (trazos anchos de poca alfa + el reescalado bilineal).
//  3) El mapa de luz «recorta» la oscuridad (lighting() en game.js) y un segundo mapa COLOREADO (cada luz con su tono) añade el brillo cálido.
//  4) Los ASSETS reciben la luz: LIGHT.at(x,y) da, para un punto del mundo, cuánta luz le llega (con sombras) y desde qué lado de la pantalla; LIGHT.tint() pinta sobre el sprite
//     (source-atop) un degradado cálido en el lado que mira a la luz y uno frío/oscuro en el opuesto. Así la fogata ilumina la cara de la casa que la mira, y el personaje tiene luz y sombra.
// Todo es 2D canvas, sin shaders. Sin luces (de día) el coste es cero. Los datos de cada tipo de luz están en DEFS (un tipo nuevo = una línea).
const LIGHT=(()=>{
 let SC=4;const MAXL=20;                    // SC: factor de reducción del mapa de luz (ahora se adapta a los píxeles reales por texel, ver update); MAXL: máximo de luces simultáneas (solo cuentan las que se ven en pantalla)
 const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
 let W=640,H=400,LM=null,LMx,LC=null,LCx,lights=[],occ=[],d=0,proj=null,LR=1,tm=0,own=null,PL=null,DEV=1;
 // tipos de luz: r = radio en px de mundo, k = intensidad (0..1), c = color cálido, fl = parpadeo (amplitud relativa), s = sombra de la propia luz (si es 0, no la tapa su portador)
 const DEFS={fire:{r:128,k:1,c:[255,150,64],fl:.06},fireOn:{r:150,k:1,c:[255,150,64],fl:.07},furnace:{r:78,k:1,c:[255,120,50],fl:.05},furnaceOn:{r:104,k:1,c:[255,120,50],fl:.08},
  shop:{r:60,k:.9,c:[255,205,120],fl:0},bank:{r:60,k:.9,c:[255,205,120],fl:0},altar:{r:56,k:.9,c:[255,200,120],fl:.03},
  farola:{r:96,k:.95,c:[255,206,120],fl:.015},linterna:{r:84,k:.95,c:[255,186,130],fl:.02},brasero:{r:96,k:.95,c:[255,140,60],fl:.06},antorcha:{r:84,k:.95,c:[255,150,70],fl:.06},
  hoguera:{r:122,k:1,c:[255,150,64],fl:.07},lava:{r:88,k:.85,c:[255,90,40],fl:.05},faro:{r:100,k:.95,c:[255,206,120],fl:.015},fosforo:{r:60,k:.6,c:[150,230,200],fl:.08},
  mob:{r:44,k:.8,c:[255,220,120],fl:0},gold:{r:84,k:.95,c:[255,212,80],fl:.1},g1:{r:52,k:.85,c:[90,230,100],fl:.07},g2:{r:66,k:.9,c:[90,150,255],fl:.07},g3:{r:82,k:.95,c:[190,100,255],fl:.08},g4:{r:100,k:1,c:[255,150,40],fl:.09},player:{r:100,k:.95,c:[255,200,130],fl:.02}};
 // oclusores por modelo: [semiancho,semifondo,altura]. Altura ≥30 = sombra larga; ~15 = media; <15 = corta. Solo para los props SIN fp (los demás usan su `fp`).
 const OH={casa:40,casaLarga:36,stabbur:30,salon:38,troncos:34,casaArbol:34,palafito:34,casaJp:36,templo:46,casaMaya:36,pagoda:50,taberna:38,granero:38,cabana:30,pozo:20,torii:44,cerezo:42,
  portonOrco:46,empalizada:34,estela:30,runestone:22,obsidiana:16,roca:10,piedra:10,arbusto:9,tocon:8,barril:10,caja:9,heno:10,lenera:9,valla:12,rack:16,bambu:26,junco:6,seta:5,farola:40,brasero:16,linterna:18,
  ruina:34,muro:26,columna:34,tienda:30,tiendaOrco:30,totem:44,lapida:12,cruz:20,huesos:6,cueva:36,abrevadero:9,comedero:9,gallinero:20,cofre:10,estandarte:40,hoguera:8,carreta:20,fumarola:12,altarDemon:24,roca2:14};
 Object.assign(OH,{iglesia:60,molino:44,monumento:34,huerto:2});['casa','casaLarga','stabbur','salon','troncos','casaArbol','palafito','casaJp','casaMaya','taberna','cabana'].forEach(n=>{OH[n]=Math.round(OH[n]*(ORG.HK||1))});Object.assign(OH,{pagoda:78,templo:62});   // V4/V5: nuevos modelos y alturas de sombra de los edificios escalados por ORG.HK
 const DFP={roca:[8,6],piedra:[8,6],arbusto:[6,5],tocon:[4,4],cerezo:[4,4],bambu:[3,3],estela:[4,4],obsidiana:[4,4],runestone:[4,4],barril:[4,4],caja:[4,4],heno:[7,6],lenera:[8,4],rack:[10,2],valla:[9,2],farola:[1.5,1.5],brasero:[2,2],linterna:[2,2],torii:[18,3]};
 const FIX={mi:[6,5,14],wc:[4.5,4.5,40]};
 function init(w,h){W=w;H=h;const lw=Math.ceil(W/SC)+2,lh=Math.ceil(H/SC)+2;if(!LM||LM.width!==lw||LM.height!==lh){LM=mk(lw,lh);LMx=LM.getContext('2d');LC=mk(lw,lh);LCx=LC.getContext('2d')}}
 // lienzos de reparto por luz: el lado crece si hace falta (antes eran fijos de 150 px y recortaban el disco de las luces grandes con mucho zoom → luz «cortada en cuadrado»)
 const lpool=(i,n)=>{let e=RPOOL[i];if(!e){e=RPOOL[i]={m:mk(n,n),n:mk(n,n)};e.mx=e.m.getContext('2d');e.nx=e.n.getContext('2d')}else if(e.m.width<n){e.m.width=e.m.height=e.n.width=e.n.height=n}return e};
 // lienzos de reparto (uno por uso dentro del fotograma): reutilizar UNO solo para muchas lecturas/escrituras en el mismo fotograma obliga al navegador a vaciar la cola gráfica cada vez
 const SPOOL=[],RPOOL=[];let spi=0;
 function sprite(w,h){let e=SPOOL[spi];if(!e){e=SPOOL[spi]={c:mk(w,h)};e.g=e.c.getContext('2d')}spi++;if(e.c.width!==w||e.c.height!==h){e.c.width=w;e.c.height=h}else{e.g.setTransform(1,0,0,1,0,0);e.g.globalAlpha=1;e.g.globalCompositeOperation='source-over';e.g.clearRect(0,0,w,h)}return e}
 const DISC=new Map();
 const disc=rq=>{let c=DISC.get(rq);if(c)return c;c=mk(rq*2,rq*2);const g=c.getContext('2d'),q=g.createRadialGradient(rq,rq,0,rq,rq,rq);
  [[0,1],[.2,.86],[.45,.52],[.7,.2],[.88,.05],[1,0]].forEach(([s,a])=>q.addColorStop(s,'rgba(0,0,0,'+a+')'));g.fillStyle=q;g.fillRect(0,0,rq*2,rq*2);if(DISC.size>40)DISC.delete(DISC.keys().next().value);DISC.set(rq,c);return c};
 let NOOCC=0;   // R3D: el mundo es 3D y ya tiene sus propias sombras; aquí solo se iluminan sprites 2D → sin oclusores (ahorra los cascos y las sombras del mapa de luz)
 const rect=(x,y,hw,hh,h,id)=>{if(!NOOCC)occ.push({x,y,hw,hh,h,id,rr:Math.max(hw,hh)})};
 // ---- recogida por fotograma ----
 // o: {t, d (0..1 oscuridad), W,H (px lógicos), proj(x,y)->[sx,sy] lógico, LR (px lógicos por px de mundo), P, ST, N (recursos), props, now, active (estación en uso o null), near (radio de recogida)}
 function update(o){fr++;spi=0;NOOCC=!!o.noOcc;d=o.d;proj=o.proj;LR=o.LR;tm=o.t;lights.length=0;occ.length=0;own=null;PL=o.P;if(d<.02)return;DEV=o.dev||1;SC=Math.max(2,Math.min(4,Math.round(6/DEV)));init(o.W,o.H);   // texel ≈ 6 px reales como máximo (en pantallas HiDPI el mapa 1/4 se veía a bloques)
  const P=o.P,R=o.near||640,near=(x,y,m)=>Math.abs(x-P.x)<R+(m||0)&&Math.abs(y-P.y)<R+(m||0),T=o.t,L=(x,y,def,key,extra)=>{const D=DEFS[def];if(!D)return;lights.push(Object.assign({x,y,r:D.r,k:D.k,c:D.c,fl:D.fl,key},extra||{}))};
  o.ST.forEach(e=>{if(!near(e.x,e.y))return;const on=o.active&&o.active.e===e;
   if(e.id==='fire')L(e.x,e.y-2,on?'fireOn':'fire',e);else if(e.id==='furnace')L(e.x,e.y-4,on?'furnaceOn':'furnace',e);else if(e.id==='shop'||e.id==='bank'||e.id==='altar')L(e.x,e.y-14,e.id,e);
   const SZ={bank:[13,9,30],shop:[15,10,32],furnace:[9,9,28],bench:[13,8,14],altar:[8,6,16],anvil:[6,4,10],armero:[8,5,24],curtidor:[8,5,18]}[e.id];if(SZ)rect(e.x,e.y,SZ[0],SZ[1],SZ[2],e)});
  o.props.forEach(e=>{if(!near(e.x,e.y,60))return;
   if(e.lamp){const k=LAMPK[e.n]||'farola';L(e.x,e.y,k,e)}else if(LIGHTN[e.n])L(e.x,e.y,LIGHTN[e.n],e);
   if(e.fps){const h=OH[e.n]!=null?OH[e.n]:30;e.fps.forEach(r=>rect(e.x+r[0],e.y+r[1],r[2],r[3],h,e))}
   const fp=e.fp||DFP[e.n];if(!fp)return;const h=OH[e.n]!=null?OH[e.n]:(e.fp?30:10);if(h>=1)rect(e.x,e.y,fp[0],fp[1],h,e)});
  o.N.forEach(e=>{if(!near(e.x,e.y))return;if(e.t==='fi'){if(e.g&&!(e.rt&&e.rt>o.now))L(e.x,e.y-6,'gold',e);return}const f=FIX[e.t];if(!f)return;const gone=e.rt&&e.rt>o.now;rect(e.x,e.y,f[0],f[1],gone?8:f[2],e);if(e.g&&!gone)L(e.x,e.y-8,'gold',e)});
  (o.GD||[]).forEach(e=>{if(e.q>=1&&near(e.x,e.y))L(e.x,e.y-5,'g'+e.q,e)});   // drops en el suelo: luz del color de su calidad
  PL=P;own={x:P.x,y:P.y-2,r:DEFS.player.r,k:DEFS.player.k,c:DEFS.player.c,fl:DEFS.player.fl,key:P,self:1};lights.push(own);rect(P.x,P.y,4,3,26,P);
  // fuera de pantalla no aportan: se descartan ANTES del tope para que no quiten sitio a las visibles (antes, con la aldea llena, se apagaban farolas visibles al andar)
  {let j=0;for(const l of lights){const a=proj(l.x,l.y),rl=l.r*1.12*LR;if(a[0]<-rl||a[0]>W+rl||a[1]<-rl||a[1]>H+rl)continue;lights[j++]=l}lights.length=j}
  if(lights.length>MAXL){lights.sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-a.r-(Math.hypot(b.x-P.x,b.y-P.y)-b.r));lights.length=MAXL}
  lights.forEach((l,i)=>{const ph=(l.x*.37+l.y*.11);l.f=l.fl?1+l.fl*(Math.sin(T*11+ph)*.55+Math.sin(T*17.3+ph*2)*.45):1;l.rx=l.x+(l.fl?Math.sin(T*9+ph)*l.fl*10:0);l.ry=l.y+(l.fl?Math.cos(T*8+ph)*l.fl*6:0)})}
 const LAMPK={farola:'farola',brasero:'brasero',linterna:'linterna',antorcha:'antorcha',hoguera:'hoguera',faro:'faro'},LIGHTN={hoguera:'hoguera',antorcha:'antorcha',fumarola:'lava',faroLava:'lava',estelaLava:'lava',altarDemon:'lava',lavaPozo:'lava',fogataC:'hoguera',tiendaFuego:'antorcha'};
 // ---- sombra de un oclusor visto desde una luz (casco convexo en el mundo) ----
 const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
 function hull(pts){pts.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const lo=[];for(const p of pts){while(lo.length>=2&&cross(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p)}
  const up=[];for(let i=pts.length-1;i>=0;i--){const p=pts[i];while(up.length>=2&&cross(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p)}up.pop();lo.pop();return lo.concat(up)}
 function shadow(l,R,c){const lx=l.rx,ly=l.ry,x0=c.x-c.hw,x1=c.x+c.hw,y0=c.y-c.hh,y1=c.y+c.hh;if(lx>x0-1.5&&lx<x1+1.5&&ly>y0-1.5&&ly<y1+1.5)return null; // la luz está dentro: no la tapa
  const far=c.h>=30?R*1.6:(c.h>=15?c.h*3.4:c.h*3.8),pts=[];[[x0,y0],[x1,y0],[x1,y1],[x0,y1]].forEach(q=>{pts.push(q);const dx=q[0]-lx,dy=q[1]-ly,m=Math.hypot(dx,dy)||1;pts.push([q[0]+dx/m*far,q[1]+dy/m*far])});
  return{poly:hull(pts),tall:c.h>=30,far}}
 // ---- mapa de luz ----
 function render(){if(!LM||d<.02||!lights.length)return null;LMx.setTransform(1,0,0,1,0,0);LMx.globalCompositeOperation='source-over';LMx.clearRect(0,0,LM.width,LM.height);LCx.setTransform(1,0,0,1,0,0);LCx.globalCompositeOperation='source-over';LCx.clearRect(0,0,LC.width,LC.height);
  let li=0,bx0=1e9,by0=1e9,bx1=-1e9,by1=-1e9;for(const l of lights){const R=l.r*l.f,rl=R*LR,rq=Math.max(4,Math.ceil(rl/SC));if(rq>240)continue;const s=proj(l.rx,l.ry),ox=s[0]-rl,oy=s[1]-rl,tw=Math.ceil(rl*2/SC)+2,sz=tw;
   if(s[0]<-rl||s[0]>W+rl||s[1]<-rl||s[1]>H+rl)continue;const LP=lpool(li++,sz),TM=LP.m,TMx=LP.mx,TN=LP.n,TNx=LP.nx;
   TMx.setTransform(1,0,0,1,0,0);TMx.globalCompositeOperation='source-over';TMx.clearRect(0,0,sz,sz);TMx.globalAlpha=l.k;TMx.drawImage(disc(rq),0,0,rl*2/SC,rl*2/SC);TMx.globalAlpha=1;
   TMx.globalCompositeOperation='destination-out';TMx.lineJoin='round';
   for(const c of occ){if(c.id===l.key)continue;const dd=Math.hypot(c.x-l.rx,c.y-l.ry);if(dd>R+c.rr+4)continue;if(c.h<12&&dd>R*.55)continue;
    const sh=shadow(l,R,c);if(!sh)continue;const pp=sh.poly.map(q=>{const a=proj(q[0],q[1]);return[(a[0]-ox)/SC,(a[1]-oy)/SC]});
    const path=()=>{TMx.beginPath();pp.forEach((q,i)=>i?TMx.lineTo(q[0],q[1]):TMx.moveTo(q[0],q[1]));TMx.closePath()};
    let fill='rgba(0,0,0,.9)';if(!sh.tall){const a=proj(c.x,c.y),b=proj(c.x+(c.x-l.rx)/(dd||1)*sh.far,c.y+(c.y-l.ry)/(dd||1)*sh.far),g=TMx.createLinearGradient((a[0]-ox)/SC,(a[1]-oy)/SC,(b[0]-ox)/SC,(b[1]-oy)/SC);g.addColorStop(0,'rgba(0,0,0,.92)');g.addColorStop(.6,'rgba(0,0,0,.45)');g.addColorStop(1,'rgba(0,0,0,0)');fill=g}
    path();TMx.strokeStyle='rgba(0,0,0,.22)';TMx.lineWidth=3.4;TMx.stroke();TMx.fillStyle=fill;TMx.fill()}
   TMx.globalCompositeOperation='source-over';
   const px=ox/SC,py=oy/SC;if(px<bx0)bx0=px;if(py<by0)by0=py;if(px+sz>bx1)bx1=px+sz;if(py+sz>by1)by1=py+sz;LMx.globalCompositeOperation='lighter';LMx.drawImage(TM,0,0,sz,sz,px,py,sz,sz);
   TNx.setTransform(1,0,0,1,0,0);TNx.globalCompositeOperation='source-over';TNx.clearRect(0,0,sz,sz);TNx.drawImage(TM,0,0,sz,sz,0,0,sz,sz);TNx.globalCompositeOperation='source-in';TNx.fillStyle='rgb('+l.c[0]+','+l.c[1]+','+l.c[2]+')';TNx.fillRect(0,0,sz,sz);TNx.globalCompositeOperation='source-over';
   LCx.globalCompositeOperation='lighter';LCx.drawImage(TN,0,0,sz,sz,px,py,sz,sz)}
  LMx.globalCompositeOperation='source-over';LCx.globalCompositeOperation='source-over';
  // bb (lote V8): caja de texels donde hay luz (unión de los discos); fuera de ella el mapa de color está vacío → game.js solo mezcla ese recorte con 'lighter'
  const bb=bx1>bx0?[Math.max(0,Math.floor(bx0)),Math.max(0,Math.floor(by0)),0,0]:null;if(bb){bb[2]=Math.min(LC.width,Math.ceil(bx1))-bb[0];bb[3]=Math.min(LC.height,Math.ceil(by1))-bb[1];if(bb[2]<=0||bb[3]<=0)bb.length=0}
  return{map:LM,col:LC,sc:SC,bb:bb&&bb.length?bb:null}}
 // ---- luz que llega a un punto del mundo (para los assets) ----
 // visibilidad de un punto desde una luz: producto de (1 - cobertura) de los oclusores que cruzan el segmento (circulo aproximado, con borde suave)
 function vis(l,x,y,self){let v=1;const sx=x-l.rx,sy=y-l.ry,len2=sx*sx+sy*sy||1;
  for(const c of occ){if(c.id===self||c.id===l.key)continue;const rx=c.x-l.rx,ry=c.y-l.ry;if(Math.abs(rx)>Math.abs(sx)+40&&Math.abs(rx)>c.rr+Math.abs(sx))continue;
   let t=(rx*sx+ry*sy)/len2;if(t<=.02||t>=.98)continue;const px=l.rx+sx*t-c.x,py=l.ry+sy*t-c.y,dd=Math.hypot(px,py),rho=c.rr*.78;if(Math.hypot(c.x-x,c.y-y)<c.rr+3)continue; // el propio objeto o uno pegado al punto no se tapa a sí mismo
   const cover=Math.max(0,Math.min(1,(rho+3-dd)/(rho*.6+3)));if(cover>0){const tall=c.h>=30?1:(c.h>=15?.7:.4);v*=1-cover*tall*.92}}
  return v}
 const OUT={w:0,ux:0,uy:-1,dir:0,r:255,g:200,b:140};
 // at(x,y,self): self = el objeto que se evalúa (para no taparse a sí mismo) · devuelve {w:0..1 luz, ux,uy: dirección unitaria en pantalla hacia la luz dominante, dir: 0..1 cuánto es direccional, r,g,b}
 function atRaw(x,y,self){OUT.w=0;if(d<.02||!lights.length)return OUT;let W0=0,vx=0,vy=0,cr=0,cg=0,cb=0,wd=0;const a=proj(x,y);
  for(const l of lights){if((l.self&&self===PL)||l.key===self)continue;const dx=l.rx-x,dy=l.ry-y,dist=Math.hypot(dx,dy),R=l.r*l.f;if(dist>=R)continue;let w=Math.pow(1-dist/R,1.35)*l.k;if(w<.03)continue;w*=vis(l,x,y,self);if(w<.03)continue;
   const b=proj(l.rx,l.ry);let sx=b[0]-a[0],sy=b[1]-a[1];const m=Math.hypot(sx,sy);const dk=Math.min(1,dist/26);if(m>1e-3){vx+=sx/m*w*dk;vy+=sy/m*w*dk}W0+=w;wd+=w*dk;cr+=l.c[0]*w;cg+=l.c[1]*w;cb+=l.c[2]*w}
  if(W0<.03)return OUT;const vm=Math.hypot(vx,vy)||1;OUT.w=Math.min(1,W0)*d;OUT.ux=vx/vm;OUT.uy=vy/vm;OUT.dir=Math.min(1,vm/W0);OUT.r=cr/W0;OUT.g=cg/W0;OUT.b=cb/W0;return OUT}
 // at() con memoria (oct 2026): cada objeto recalcula su luz cada 3 fotogramas (desfasados por posición, para que no cambien todos a la vez) en vez de todos los fotogramas.
 // Antes, de noche, cada prop/recurso/mob visible recorría todas las luces × todos los oclusores (decenas de miles de vueltas por fotograma). El jugador (self===PL) sí se evalúa siempre.
 const AC=new WeakMap();let fr=0;
 function at(x,y,self){if(d<.02||!lights.length){OUT.w=0;return OUT}
  if(!self||typeof self!=='object'||self===PL)return atRaw(x,y,self);
  const c=AC.get(self);if(c&&fr-c.f<3)return c.o;
  const r=atRaw(x,y,self),o={w:r.w,ux:r.ux,uy:r.uy,dir:r.dir,r:r.r,g:r.g,b:r.b};AC.set(self,{f:fr-(Math.abs((x*31+y*17)|0)%3),o});return o}
 // ---- pinta la luz sobre un sprite ya dibujado en g (source-atop: solo donde hay píxeles) ----
 // (cx,cy) = centro del cuerpo del sprite en g, ext = semiextensión en px de g, w,h = tamaño del lienzo; info = salida de at()
 function tint(g,w,h,cx,cy,ext,info){if(!info||info.w<.04)return;const k=info.w,u=[info.ux,info.uy],L=ext,x0=cx-u[0]*L,y0=cy-u[1]*L,x1=cx+u[0]*L,y1=cy+u[1]*L,col=info.r+','+info.g+','+info.b;
  g.save();g.globalCompositeOperation='source-atop';const q=g.createLinearGradient(x0,y0,x1,y1);
  q.addColorStop(0,'rgba(14,12,44,'+(.3*k*info.dir)+')');q.addColorStop(.42,'rgba(14,12,44,0)');q.addColorStop(.58,'rgba('+col+',0)');q.addColorStop(1,'rgba('+col+','+(.5*k*info.dir)+')');
  g.fillStyle=q;g.fillRect(0,0,w,h);g.fillStyle='rgba('+col+','+(.07*k)+')';g.fillRect(0,0,w,h);g.restore()}
 return{DEFS,update,render,at,tint,sprite,get lights(){return lights},get occ(){return occ},get on(){return d>=.02},get d(){return d}}})();
if(typeof module!=='undefined')module.exports=LIGHT;
