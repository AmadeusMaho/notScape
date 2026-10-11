/* NotScape — AGUA (Fase 2, paso 2). Ver AGENTS.md.
   Sustituye el bloque `// ---- agua` de la IIFE de `bgc` en game.js y las ondas de `PD` en draw(). Misma técnica que roads.js:
   por cada masa de agua (estanque, río y, en el bioma 0, lago) se crea una máscara, se calculan distancias a la orilla y se pinta por píxel en un
   `ImageData` -> canvas temporal -> `g.drawImage` (nunca putImageData directo sobre bgc). Luz arriba-izquierda: la orilla NO/N/O proyecta sombra
   sobre el agua y la orilla S/E queda iluminada y con espuma; el borde exterior de la arena es claro arriba-izquierda y oscuro abajo-derecha.
   GEOMETRÍA: el agua es exactamente el rectángulo de PD (±0–2 px de entrantes de arena y esquinas redondeadas); la arena rodea 8 px. Las colisiones
   (BLK) no cambian. El puente queda en x0+232..308 (calzada x0+236..304 = hueco de BLK) y el poste de pesca del lago en (lago.x+96, lago.y-16).
   Las ondas animadas se dibujan SOLO dentro del agua (inset 3 px) y la espuma de orilla sigue la máscara real. Con ?old, WT es null y game.js usa el código antiguo.
   NO usar rnd()/R() del juego: aquí todo sale de hash()/vnoise() de GR.H (determinista). */
const WT=GR?(()=>{
 const{hash,vnoise,mix,hex}=GR.H,C=(a,b,t)=>hex(mix(a,b,t)),M=12,RW=8,FM=new Map(); // M = margen de la caja de trabajo, RW = ancho de la orilla de arena
 const vn=(t,s)=>{const a=Math.floor(t),f=t-a,m=f*f*(3-2*f);return hash(a,0,s)*(1-m)+hash(a+1,0,s)*m};
 // Paleta de orilla por bioma. S=suelo de la orilla (arena/barro/nieve/basalto), P=guijarros, fc=espuma, wet=arena mojada (null=derivada),
 // st=piedras {H,M,D}, reed=[tallo oscuro,tallo claro,espiga] o null, fl=flotantes (lily/ice/slag), fp=paleta de flotantes, alg=algas, crust=costra de lava, spk=cristales
 const PAL=[
  {S:'#d8c68a',P:['#8a8a80','#a8a090'],fc:'#ffffff',wet:null,st:{H:'#b8b4a8',M:'#8a8a80',D:'#5a5a54'},reed:['#3a7a3a','#5a9a4a','#6b4a2a'],fl:'lily',fp:{O:'#1f4a2a',G:'#3a8a4a',H:'#5ab06a'}},
  {S:'#cdbb82',P:['#7a7a72','#a8a090'],fc:'#ffffff',wet:null,st:{H:'#b0b0a8',M:'#807f78',D:'#55554f'},reed:['#2f6a3a','#4a8a4a','#6b4a2a'],fl:'lily',fp:{O:'#1a4226',G:'#2f7a4a',H:'#4aa060'}},
  {S:'#85774e',P:['#5a5238','#a0a070'],fc:'#cfe8b0',wet:null,st:{H:'#8a9070',M:'#6a7258',D:'#474f3c'},reed:['#4a6a2a','#6a8a3a','#5a3a1a'],fl:'lily',fp:{O:'#2a3a1a',G:'#4a6a2a',H:'#6a8a3a'},alg:1,dense:2},
  {S:'#e4eef4',P:['#9ab0c0','#ffffff'],fc:'#ffffff',wet:'#a9c6d9',st:{H:'#ffffff',M:'#c8d8e4',D:'#8aa4b8'},reed:['#9fbccc','#cfe0ea','#e8f4fa'],fl:'ice',fp:{O:'#3a6a8a',H:'#ffffff',M:'#d8f0ff',D:'#9ad0ee'}},
  {S:'#4a3a3a',P:['#1a1212','#6a4a3a'],fc:'#ffd070',wet:'#7a2a12',st:{H:'#6a4a3a',M:'#3a2a2a',D:'#1e1414'},reed:null,fl:'slag',fp:{O:'#14100a',H:'#6a4a3a',M:'#3a2a2a',D:'#2a1a1a',E:'#ff7a2a'},crust:1,spk:1}];
 // Sprites pequeños: cada letra es un color de la paleta, '.' = transparente. Contorno 1 px.
 const spr=(g,x,y,rows,pl)=>{for(let j=0;j<rows.length;j++)for(let i=0;i<rows[j].length;i++){const c=pl[rows[j][i]];if(c){g.fillStyle=c;g.fillRect(x+i,y+j,1,1)}}};
 const ST1=['.OOO.','OHHMO','OMMDO','.OOO.'],ST2=['..OOO..','.OHHMO.','OHHMMDO','OMMMDDO','.OOOOO.'];
 const LILY=['.OOOOO.','OHHGGGO','OHGGGG.','OGGGGGO','.OOOOO.'],LILYF=['.OOOOO.','OHHFGGO','OHGGGG.','OGGGGGO','.OOOOO.'];
 const ICE=['..OOO..','.OHHHO.','OHHMMDO','.OOOOO.'],SLAG=['.OOOO.','OHMMEO','OMMDDO','.OOOO.'];
 const SPK=['..O..','.OHO.','.OHO.','OHMDO','OHMDO','OMMDO','ODDDO','OOOOO'];
 // Transformada de distancia (chamfer 1 / 1.414): distancia de cada celda a la fuente (src=1) más cercana
 const dist=(src,w,h)=>{const d=new Float32Array(w*h),Q=1.414;for(let i=0;i<d.length;i++)d[i]=src[i]?0:1e4;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;let v=d[i];if(x>0)v=Math.min(v,d[i-1]+1);if(y>0){v=Math.min(v,d[i-w]+1);if(x>0)v=Math.min(v,d[i-w-1]+Q);if(x<w-1)v=Math.min(v,d[i-w+1]+Q)}d[i]=v}
  for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const i=y*w+x;let v=d[i];if(x<w-1)v=Math.min(v,d[i+1]+1);if(y<h-1){v=Math.min(v,d[i+w]+1);if(x<w-1)v=Math.min(v,d[i+w+1]+Q);if(x>0)v=Math.min(v,d[i+w-1]+Q)}d[i]=v}
  return d};
 const L=-.7071; // dirección a la luz = (L,L) (arriba-izquierda)
 /* Pinta una masa de agua p={x,y,w,h,sh} (coords de mundo). s = semilla propia. Devuelve lo necesario para colocar la decoración. */
 function lake(g,k,s,p,pal,b){
  const BX=p.x-M,BY=p.y-M,bw=p.w+2*M,bh=p.h+2*M,m=new Uint8Array(bw*bh),X1=p.x+p.w-1,Y1=p.y+p.h-1;
  const ins=(v,sd)=>Math.max(0,Math.round((vn(v/6,sd)-.35)*3.2)); // entrantes de arena en la orilla: 0 casi siempre, a veces 1–2 px
  const iT=[],iB=[];for(let x=0;x<bw;x++){iT.push(ins(BX+x,s+3));iB.push(ins(BX+x,s+4))}
  for(let y=0;y<bh;y++){const Y=BY+y,iL=ins(Y,s+1),iR=ins(Y,s+2);for(let x=0;x<bw;x++){const X=BX+x;if(X<p.x||X>X1||Y<p.y||Y>Y1)continue;
   const dx=X-p.x,ex=X1-X,dy=Y-p.y,ey=Y1-Y;if(dx<iL||ex<iR||dy<iT[x]||ey<iB[x]||Math.min(dx,ex)+Math.min(dy,ey)<3)continue;m[y*bw+x]=1}} // esquinas redondeadas (radio 3)
  const nm=m.map(v=>1-v),dw=dist(m,bw,bh),di=dist(nm,bw,bh);
  const W=hex(b.w),WL=C(b.w,b.sh,.2),WLL=C(b.w,b.sh,.42),WD=C(b.w,'#14100a',.12),WDD=C(b.w,'#14100a',.22),WSH=C(b.w,'#14100a',.28),WS=hex(b.sh),OUT=C(b.w,'#14100a',.62);
  const SA=hex(pal.S),SL=C(pal.S,'#ffffff',.22),SD=C(pal.S,'#14100a',.25),SM=C(pal.S,pal.S==='#4a3a3a'?'#14100a':'#6a5a30',.18),SS=C(pal.S,'#14100a',.1);
  const wb=pal.wet||mix(mix(pal.S,b.w,.2),'#14100a',.12),WT0=hex(wb),WTD=C(wb,'#14100a',.22),WTL=C(wb,'#ffffff',.2); // arena mojada: base, sombra (ribera NO) y luz (ribera S/E)
  const P1=hex(pal.P[0]),P2=hex(pal.P[1]),CR=C(b.w,'#3a0a00',.5),AL=C(b.w,'#6ab04a',.38);
  const img=g.createImageData(bw,bh),D=img.data,put=(i,c,a)=>{const q=i*4;D[q]=c[0];D[q+1]=c[1];D[q+2]=c[2];D[q+3]=a};
  const foam=[];let nRing=0,nWater=0;
  for(let y=2;y<bh-2;y++)for(let x=2;x<bw-2;x++){const i=y*bw+x,X=BX+x,Y=BY+y;
   if(m[i]){nWater++;const e=di[i];let c,gx=0,gy=0;
    if(e<=2.2){gx=di[i+1]-di[i-1];gy=di[i+bw]-di[i-bw];const ql=(gx+gy)*L/(Math.sqrt(gx*gx+gy*gy)||1); // ql<0: la orilla queda al noroeste
     c=ql<-.35?WSH:ql>.35?WLL:WL}                                              // franja de orilla: sombra de la ribera NO, brillo en la S/E
    else if(e<=6)c=hash(X,Y,s+8)<(7-e)/6*.55?WL:W;                                // degradado a aguas someras
    else{const n=vnoise(X,Y,s+9,12);c=n>.8?WDD:n>.66?WD:W}                        // manchas de aguas profundas
    if(pal.crust&&e>3&&vnoise(X,Y,s+11,9)>.74)c=CR;     // volcán: costra oscura sobre la lava
    if(pal.alg&&e>2&&vnoise(X,Y,s+11,10)>.7)c=AL;                                  // pantano: algas
    if(e>2.2&&(Y&1)===0&&((Y>>1)+(X>>3)*3)%9===0&&(X&7)<5&&hash(X>>3,Y,s+4)<.45)c=WL; // dashes de ola estáticos
    if(hash(X,Y,s+2)<.003)c=WS;                                                    // destellos
    if(e<=1.2&&hash(X,Y,s+15)<.28)foam.push([X,Y,Math.abs(gy)>Math.abs(gx)?2:1,Math.abs(gy)>Math.abs(gx)?1:2,hash(X,Y,s+16)*4|0]);
    put(i,c,255);continue}
   const d=dw[i];if(d>RW+2.2)continue;
   const Rr=RW+Math.round((vnoise(X,Y,s+5,8)-.5)*3);                              // borde exterior irregular (7–9 px)
   if(d>Rr+.5){if(d<=Rr+2.2&&hash(X,Y,s+6)<(Rr+2.2-d)/2.2*.4)put(i,SA,220);continue} // halo ralo sobre el pasto
   nRing++;
   if(d<1.2){put(i,OUT,255);continue}                                              // contorno oscuro de 1 px
   const gx=dw[i+1]-dw[i-1],gy=dw[i+bw]-dw[i-bw],ql=(gx+gy)*L/(Math.sqrt(gx*gx+gy*gy)||1); // ql>0: la orilla queda al sureste (ribera NO)
   let c;
   if(d<=3.3){c=ql>.35?WTD:ql<-.35?WTL:WT0;if(hash(X,Y,s+3)<.12)c=SS}                // arena mojada: más oscura en la ribera NO, más clara en la S/E
   else{const h=hash(X,Y,s+7);c=vnoise(X,Y,s+10,6)>.62?SM:SA;if(h<.07)c=SD;else if(h<.13)c=SL;else if(h<.145)c=P1;else if(h<.155)c=P2;
    if(d>Rr-1.6)c=ql>.35?SL:ql<-.35?SD:SM}                                         // borde exterior: claro arriba-izq, oscuro abajo-der
   put(i,c,255)}
  const cv=document.createElement('canvas');cv.width=bw;cv.height=bh;cv.getContext('2d').putImageData(img,0,0);g.drawImage(cv,BX,BY);
  // espuma: píxeles de orilla ORDENADOS por x en 4 grupos de fase (anim() los hace parpadear)
  foam.sort((a,c)=>a[0]-c[0]);const gr=[0,1,2,3].map(n=>{const f=foam.filter(v=>v[4]===n),A=new Int32Array(f.length*4);f.forEach((v,j)=>{A[j*4]=v[0];A[j*4+1]=v[1];A[j*4+2]=v[2];A[j*4+3]=v[3]});return A});
  FM.set(p,{col:pal.fc,g:gr});
  return{BX,BY,bw,bh,m,dw,di,nRing,nWater}}
 // Coloca hasta `want` elementos en puntos aleatorios (hash) que cumplan ok(X,Y), separados al menos minD px
 const scatter=(sd,want,tries,minD,r,ok,fn)=>{const pl=[];for(let n=0;n<tries&&pl.length<want;n++){const X=r.BX+(hash(n,11,sd)*r.bw|0),Y=r.BY+(hash(n,13,sd)*r.bh|0);
  if(!ok(X,Y)||pl.some(q=>Math.abs(q[0]-X)<minD&&Math.abs(q[1]-Y)<minD))continue;pl.push([X,Y]);fn(X,Y,pl.length)}};
 function reed(g,X,Y,pal,n,sd){const[dk,lt,hd]=pal.reed;g.fillStyle='rgba(0,0,0,.22)';g.fillRect(X-5,Y,10,1);
  for(let j=0;j<n;j++){const ox=-4+Math.round(j*8/Math.max(1,n-1)),h=6+(hash(X,Y,sd+j)*6|0);g.fillStyle=j%2?lt:dk;g.fillRect(X+ox,Y-h,1,h);
   g.fillStyle=hd;g.fillRect(X+ox,Y-h-3,2,3);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(X+ox,Y-h-3,1,1)}}
 // Puente sobre el río (bx,by = esquina; 76×80). Calzada de tablones x+4..x+72 (hueco de BLK), barandas con postes en los costados, vigas en las entradas.
 function bridge(g,bx,by){const f=(c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(bx+x,by+y,w,h)};
  f('rgba(0,0,0,.24)',76,5,4,76);f('rgba(0,0,0,.24)',3,80,76,3);f('#14100a',-1,-1,78,82);f('#6a4a2a',0,0,76,80); // sombra, contorno, base
  for(const y of[0,77]){f('#5a3a1a',0,y,76,3);f('#8a6a3a',0,y,76,1)}
  for(let r=0;r<12;r++){const y=3+r*6,t=hash(bx,y,5),c=t<.33?'#9a7a4a':t<.66?'#8f7040':'#a58550';
   f(c,4,y,68,5);f('#b8955a',4,y,68,1);f('#3a2410',4,y+5,68,1);
   for(let q=0;q<3;q++)f('#7a5a30',4+(hash(bx,y,q+9)*56|0),y+2+(q&1),4+(hash(bx,y,q+20)*5|0),1);   // vetas
   f('#3a2a1a',6,y+1,2,2);f('#3a2a1a',68,y+1,2,2)}                                                     // clavos
  f('rgba(0,0,0,.2)',4,3,3,74);f('rgba(0,0,0,.2)',4,3,68,2);                                              // sombra de la baranda izquierda y de la viga norte
  f('#7a5a2a',1,3,3,74);f('#9a7a4a',1,3,1,74);f('#7a5a2a',72,3,3,74);f('#9a7a4a',72,3,1,74);
  for(const y of[2,25,48,71])for(const x of[-1,71]){f('#14100a',x,y-1,7,8);f('#8a6a3a',x+1,y,5,6);f('#b08a50',x+1,y,5,1);f('#b08a50',x+1,y,1,6);f('#5a3a1a',x+5,y+1,1,5)}}
 // Poste de pesca del lago (bioma 0): poste con brazo y un pez colgando. (px,py) = esquina superior izquierda del poste.
 function post(g,px,py){const f=(c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(px+x,py+y,w,h)};
  f('rgba(0,0,0,.22)',9,10,4,18);f('rgba(255,255,255,.4)',-2,25,12,1);f('#14100a',-1,-1,10,28);f('#8a6a3a',0,0,8,26);f('#b08a50',0,0,1,26);f('#5a3a1a',6,0,2,26);
  for(let j=0;j<4;j++)f('#6a4a2a',2,3+j*6,3,1);
  f('#14100a',7,-1,35,7);f('#8a6a3a',8,0,33,5);f('#b08a50',8,0,33,1);f('#5a3a1a',8,4,33,1);
  f('#d8c9a3',38,5,1,5);f('#14100a',35,9,8,5);f('#8ab8ee',36,10,5,3);f('#c8e4ff',36,10,5,1);f('#14100a',33,10,3,3);f('#000',39,10,1,1)}
 return{
  /* g = ctx de bgc (coords de mundo), k = bioma, x0 = k*BW, b = BI[k], shapes = entradas de PD de ese bioma en orden [estanque, río, lago?] */
  draw(g,k,x0,b,shapes){const pal=PAL[k],ex=[];
   const rv=shapes[1];if(rv)ex.push([rv.x+192-8,rv.y-10-8,76+16,80+16]);                  // zona del puente: sin decoración
   const out=(X,Y)=>ex.some(e=>X>=e[0]&&X<e[0]+e[2]&&Y>=e[1]&&Y<e[1]+e[3]);
   shapes.forEach((p,n)=>{const s=k*31+n*7+3,r=lake(g,k,s,p,pal,b),at=(X,Y)=>{const x=X-r.BX,y=Y-r.BY;return x>=0&&y>=0&&x<r.bw&&y<r.bh?y*r.bw+x:-1},
     dry=(X,Y,a,c)=>{const i=at(X,Y);return i>=0&&!r.m[i]&&r.dw[i]>=a&&r.dw[i]<=c&&!out(X,Y)},wet=(X,Y,a,c)=>{const i=at(X,Y);return i>=0&&r.m[i]&&r.di[i]>=a&&r.di[i]<=c&&!out(X,Y)};
    const st=pal.st,sp=()=>({O:'#14100a',H:st.H,M:st.M,D:st.D});
    scatter(s+1,Math.round(r.nRing/230),3000,7,r,(X,Y)=>dry(X,Y,3,6.5),(X,Y,j)=>{g.fillStyle='rgba(0,0,0,.2)';g.fillRect(X-1,Y+2,j%3?6:8,2);spr(g,X-2,Y-2,j%3?ST1:ST2,sp())}); // piedras en la arena
    scatter(s+2,Math.round(r.nWater/20000),800,16,r,(X,Y)=>wet(X,Y,3,7),(X,Y)=>{g.fillStyle='rgba(255,255,255,.35)';g.fillRect(X-3,Y+3,7,1);spr(g,X-3,Y-2,ST2,sp())}); // piedras en el agua con espuma
    if(pal.reed)scatter(s+3,Math.round(r.nRing/520*(pal.dense||1)),3000,12,r,(X,Y)=>dry(X,Y,1.5,4),(X,Y,j)=>reed(g,X,Y,pal,3+(j%3),s+j));                // juncos
    if(pal.spk)scatter(s+4,Math.round(r.nRing/700),3000,16,r,(X,Y)=>dry(X,Y,3,6),(X,Y)=>{g.fillStyle='rgba(0,0,0,.25)';g.fillRect(X-2,Y+7,7,2);spr(g,X-2,Y,SPK,{O:'#14100a',H:'#7a5aa0',M:'#3a2a4a',D:'#1a1020'})}); // cristales de obsidiana
    if(p.h>100){const lw=pal.fl==='lily'?[LILY,LILYF]:pal.fl==='ice'?[ICE]:[SLAG];                                                                        // flotantes (solo masas anchas)
     scatter(s+5,Math.round(r.nWater/9000*(pal.alg?1.6:1)),2000,18,r,(X,Y)=>wet(X,Y,9,99)&&Y>p.y+22,(X,Y,j)=>{const q=lw[hash(X,Y,s)<.3?lw.length-1:0];
      g.fillStyle='rgba(0,0,0,.18)';g.fillRect(X-2,Y+3,7,2);spr(g,X-3,Y-2,q,pal.fp)})}});
   if(rv)bridge(g,rv.x+192,rv.y-10);
   if(k===0&&shapes[2])post(g,shapes[2].x+96,shapes[2].y-16)},
  /* Ondas y espuma animadas de UNA masa de agua; se llama desde draw() (coords de mundo, ya trasladado). Solo pinta dentro del agua. */
  anim(ctx,p,t,cx,cy,W,H){const x1=Math.max(p.x+3,cx-12),x2=Math.min(p.x+p.w-3,cx+W+12);ctx.fillStyle=p.sh;
   for(let r=0;r<Math.floor(p.h/14);r++){const yy=p.y+8+r*14;if(yy<cy-8||yy>cy+H+8||yy<p.y+3||yy+2>p.y+p.h-3)continue;const sp2=(r%2?1:-1)*(9+r*1.4);
    for(let x=x1-(x1%12);x<x2;x+=12){const rx=x+(((x+t*sp2)%24)+24)%24-12;if(rx<p.x+3||rx+7>p.x+p.w-3)continue;
     ctx.globalAlpha=.14+.14*Math.sin(t*1.5+x*.07+r);ctx.fillRect(Math.round(rx),Math.round(yy+Math.sin(t*2+x*.12+r)*1.4),7,2)}}
   const f=FM.get(p);if(f){ctx.fillStyle=f.col;for(let n=0;n<4;n++){ctx.globalAlpha=.1+.42*Math.max(0,Math.sin(t*1.8+n*1.7));const A=f.g[n];let lo=0,hi=A.length/4;
    while(lo<hi){const mid=(lo+hi)>>1;if(A[mid*4]<cx-6)lo=mid+1;else hi=mid}
    for(let j=lo*4;j<A.length;j+=4){if(A[j]>cx+W+6)break;if(A[j+1]<cy-4||A[j+1]>cy+H+4)continue;ctx.fillRect(A[j],A[j+1],A[j+2],A[j+3])}}}
   ctx.globalAlpha=1}}
})():null;
