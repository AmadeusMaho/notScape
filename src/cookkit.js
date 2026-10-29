// NotScape · COCINA · LA COCINA CENITAL (cookkit.js, 27 oct 2026) — todo lo que se DIBUJA y JUEGA en la cocina de `src/cooking.js` (global `COC`).
// Una sola cocina vista desde arriba con SEIS estaciones físicas en una encimera continua (cuadrícula 3×2 de 800×460): Mesa de trabajo · Fogón (puchero) · Sartén · Parrilla · Horno · Emplatado.
// La cámara hace zoom de la vista general a cada estación (`go`). Cada estación = un fondo cacheado (`BG`) + su dibujo dinámico (`DRAW`) + su minijuego (`ST`). Todo en lienzo 2D, sin WebGL.
// Estación nueva: fila en CELL/NM, su fondo en BG, su dibujo en DRAW y su lógica en ST (init/tick/down/move/up). Estilo y helpers de dibujo compartidos con Alquimia vía `ALQ.gfx`.
// Cosas comunes: el ESPECIERO (5 frascos; cada uno añade un sabor), el RADAR de sabor (pentágono: ideal vs actual), la BANDEJA de ingredientes ya preparados (se echan con LMB) y el feedback
// (hit-stop de 40 ms, partículas con física, «¡Perfecto!», chispas doradas, sonido por capas). Se carga ANTES de cooking.js; solo usa COC/ALQ en tiempo de llamada.
const KIT=(()=>{
 const WW=800,HH=460,OL='#2a1a0e',CELL={mesa:[0,0],puchero:[1,0],sarten:[2,0],parrilla:[0,1],horno:[1,1],plato:[2,1]},STOF={g:'puchero',s:'sarten',p:'parrilla',h:'horno'};
 const NM={mesa:'Mesa de trabajo',puchero:'Fogón',sarten:'Sartén',parrilla:'Parrilla',horno:'Horno',plato:'Emplatado'},FLK=['d','s','a','p','u'],JN={d:'Miel',s:'Sal',a:'Hierbas',p:'Pimienta',u:'Caldo'};
 const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=t=>t*t*(3-2*t),TAU=Math.PI*2;
 const tn=(f,d,ty,v,sl)=>{try{tone(f,d,ty||'sine',v||.05,sl)}catch(e){}},nz=(d,v,f,ty)=>{try{noise(d,v,f,ty)}catch(e){}};
 const gx=()=>ALQ.gfx,hx=h=>gx().hex(h),mixc=(a,b,t)=>gx().lerpc(a,b,t),rgb=(a,al)=>'rgba('+(a[0]|0)+','+(a[1]|0)+','+(a[2]|0)+','+(al==null?1:al)+')';
 // ── CÁMARA: vista general (toda la encimera) ↔ una estación a pantalla completa ───────────────────────────────────────────────────────────────────────────────────────────────────────
 const OV={x:1200,y:241,s:1/3};   // la vista general queda más abajo para dejar libre arriba el estante de ingredientes
 function camInit(g){g.kk={};g.k=null;g.cam={x:OV.x,y:OV.y,s:OV.s,tx:OV.x,ty:OV.y,ts:OV.s,arr:true};g.st='over';g.prev=null}
 function go(g,id){if(g.st!==id){g.prev=g.st;g.pz=.9}g.st=id;const c=g.cam;if(id==='over'){c.tx=OV.x;c.ty=OV.y;c.ts=OV.s}else{const[cx,cy]=CELL[id];c.tx=cx*WW+400;c.ty=cy*HH+230;c.ts=1}c.arr=false}
 function camTick(g,dt){const c=g.cam,k=1-Math.exp(-dt*4.6);c.x+=(c.tx-c.x)*k;c.y+=(c.ty-c.y)*k;c.s+=(c.ts-c.s)*k;if(Math.abs(c.s-c.ts)<.004&&Math.abs(c.x-c.tx)<1.5&&Math.abs(c.y-c.ty)<1.5){c.s=c.ts;c.x=c.tx;c.y=c.ty;c.arr=true;g.prev=null}}
 // ── fondos cacheados (una vez) ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 function hs(a,b,c2){let h=(a*374761393+b*668265263+c2*2147483647)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296}
 function counter(x){const g=x.createLinearGradient(0,0,WW,HH);g.addColorStop(0,'#8c6438');g.addColorStop(1,'#6a4624');x.fillStyle=g;x.fillRect(0,0,WW,HH);
  for(let i=0;i<9;i++){const y=i*52+((i*29)%7);x.fillStyle=i%2?'rgba(40,20,6,.12)':'rgba(255,220,150,.05)';x.fillRect(0,y,WW,51);x.strokeStyle='rgba(30,14,4,.55)';x.lineWidth=2;x.beginPath();x.moveTo(0,y);x.lineTo(WW,y);x.stroke();
   x.strokeStyle='rgba(50,26,8,.2)';x.lineWidth=1;for(let k=0;k<6;k++){const sx=(i*131+k*173)%WW;x.beginPath();x.moveTo(sx,y+8+k*7);x.bezierCurveTo(sx+60,y+3+k*7,sx+120,y+13+k*7,sx+200,y+8+k*7);x.stroke()}
   const kx=(i*211)%700+40;x.fillStyle='rgba(30,14,4,.4)';x.beginPath();x.ellipse(kx,y+24,6,4,0,0,7);x.fill();[18,WW-18].forEach(nx=>{x.fillStyle='#3a342e';x.beginPath();x.arc(nx,y+8,2.4,0,7);x.fill()})}
  // muro de piedra (arriba): sillares irregulares con mortero y musgo
  let yy=0;for(let r=0;r<4;r++){const h=13+((r*7)%5);let xx=-((r*23)%40);while(xx<WW){const w=34+Math.floor(hs(r,xx,3)*30);x.fillStyle=['#8a847a','#78726a','#6c665e','#928c82'][Math.floor(hs(r,xx,5)*4)];x.beginPath();x.roundRect(xx+1,yy+1,w-2,h-2,3);x.fill();x.strokeStyle='rgba(20,16,12,.7)';x.lineWidth=1.6;x.stroke();x.fillStyle='rgba(255,255,255,.12)';x.fillRect(xx+4,yy+3,w*.4,2);if(hs(r,xx,9)>.8){x.fillStyle='rgba(80,120,50,.45)';x.beginPath();x.ellipse(xx+w*.3,yy+h-3,8,3,0,0,7);x.fill()}xx+=w}yy+=h}
  // colgados: ristra de ajos, salchichas y manojos de hierbas
  const braid=(a,b)=>{x.strokeStyle='#8a7a4a';x.lineWidth=2;x.beginPath();x.moveTo(a,0);x.lineTo(a,b);x.stroke();for(let i=0;i<4;i++){x.fillStyle='#efe6cc';x.beginPath();x.ellipse(a+(i%2?4:-4),10+i*9,5.5,6.5,0,0,7);x.fill();x.strokeStyle=OL;x.lineWidth=1.4;x.stroke()}},herbs=(a,col)=>{x.strokeStyle='#6a5030';x.lineWidth=1.6;x.beginPath();x.moveTo(a,0);x.lineTo(a,14);x.stroke();for(let i=0;i<5;i++){x.fillStyle=col;x.beginPath();x.ellipse(a+(i-2)*4,26+Math.abs(i-2)*2,3.4,11,(i-2)*.22,0,7);x.fill();x.strokeStyle=OL;x.lineWidth=1.2;x.stroke()}},saus=(a)=>{x.strokeStyle='#6a5030';x.lineWidth=1.6;x.beginPath();x.moveTo(a,0);x.lineTo(a,8);x.stroke();for(let i=0;i<3;i++){x.fillStyle=['#a8483a','#b8584a','#984038'][i];x.beginPath();x.roundRect(a+(i-1)*9-4,8,8,26,4);x.fill();x.strokeStyle=OL;x.lineWidth=1.4;x.stroke()}};
  braid(40,40);herbs(78,'#6a9a48');saus(116);herbs(150,'#c8a84a');herbs(578,'#7a9a68');braid(620,38);saus(660);herbs(700,'#a86a48');braid(752,40);
  // viga de madera con herrajes
  x.fillStyle='rgba(0,0,0,.4)';x.fillRect(0,64,WW,10);const bg=x.createLinearGradient(0,52,0,64);bg.addColorStop(0,'#6a4426');bg.addColorStop(1,'#3e2814');x.fillStyle=bg;x.fillRect(0,52,WW,13);x.strokeStyle=OL;x.lineWidth=2.6;x.strokeRect(-2,52,WW+4,13);[90,300,510,720].forEach(b=>{x.fillStyle='#3a342e';x.fillRect(b,50,14,17);x.strokeStyle=OL;x.lineWidth=1.6;x.strokeRect(b,50,14,17)});
  const v=x.createRadialGradient(WW/2,HH*.55,HH*.3,WW/2,HH*.55,WW*.65);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(20,10,2,.4)');x.fillStyle=v;x.fillRect(0,0,WW,HH);x.strokeStyle='rgba(20,10,2,.7)';x.lineWidth=5;x.strokeRect(0,0,WW,HH)}
 function rr(x,a,b,w,h,r){x.beginPath();x.roundRect(a,b,w,h,r)}
 function hob(x,cx,cy,R){const px=70,py=100,pw=660,ph=344;x.fillStyle='rgba(0,0,0,.45)';rr(x,px+6,py+10,pw,ph,22);x.fill();   // hogar de losas de piedra con el hoyo del fuego
  let ry=py;for(let r=0;r<7;r++){const h=ph/7;let rx=px-((r*37)%50);while(rx<px+pw){const w=60+Math.floor(hs(r,rx,2)*46),a=Math.max(px,rx),b=Math.min(px+pw,rx+w);if(b>a+4){x.fillStyle=['#6a645c','#5a554e','#7a746a','#4e4a44','#625c54'][Math.floor(hs(r,rx,4)*5)];x.beginPath();x.roundRect(a+1,ry+1,b-a-2,h-2,4);x.fill();x.strokeStyle='rgba(14,10,6,.75)';x.lineWidth=2;x.stroke();x.fillStyle='rgba(255,255,255,.08)';x.fillRect(a+4,ry+3,(b-a)*.5,2)}rx+=w}ry+=h}
  x.strokeStyle=OL;x.lineWidth=3.2;rr(x,px,py,pw,ph,22);x.stroke();
  const ash=x.createRadialGradient(cx,cy,R*.6,cx,cy,R*2.1);ash.addColorStop(0,'rgba(10,6,2,.7)');ash.addColorStop(1,'rgba(10,6,2,0)');x.fillStyle=ash;x.fillRect(px,py,pw,ph);
  x.fillStyle='#120c08';x.beginPath();x.arc(cx,cy,R+20,0,TAU);x.fill();for(let i=0;i<16;i++){const a=i*TAU/16+.15,sx=cx+Math.cos(a)*(R+22),sy=cy+Math.sin(a)*(R+22);x.fillStyle=['#7a746a','#625c54','#8a847a'][i%3];x.beginPath();x.ellipse(sx,sy,15,11,a,0,TAU);x.fill();x.strokeStyle=OL;x.lineWidth=2.4;x.stroke();x.fillStyle='rgba(255,255,255,.14)';x.beginPath();x.ellipse(sx-3,sy-3,8,4,a,0,TAU);x.fill()}
  for(let i=0;i<30;i++){x.fillStyle=['#3a1e10','#2a160c','#4a2812'][i%3];x.beginPath();x.ellipse(cx+Math.cos(i*2.4)*(R*.72),cy+Math.sin(i*2.4)*(R*.72),10,6,i,0,TAU);x.fill()}   // lecho de brasas
  x.strokeStyle='#26221e';x.lineWidth=4;x.lineCap='round';for(let i=0;i<4;i++){const a=i*Math.PI/4;x.beginPath();x.moveTo(cx+Math.cos(a)*(R+18),cy+Math.sin(a)*(R+18));x.lineTo(cx-Math.cos(a)*(R+18),cy-Math.sin(a)*(R+18));x.stroke()}}   // parrilla de hierro
 const BG={
  mesa(x){counter(x);x.fillStyle='rgba(0,0,0,.35)';rr(x,152,124,520,262,18);x.fill();const g=x.createLinearGradient(0,120,0,380);g.addColorStop(0,'#c9a468');g.addColorStop(1,'#a8824a');x.fillStyle=g;rr(x,140,114,520,262,18);x.fill();x.strokeStyle=OL;x.lineWidth=3.2;x.stroke();
   x.strokeStyle='rgba(60,34,12,.25)';x.lineWidth=1.3;for(let i=0;i<13;i++){x.beginPath();x.moveTo(156,130+i*18);for(let k=0;k<=10;k++)x.lineTo(156+k*48.8,130+i*18+Math.sin(k+i*1.7)*2.4);x.stroke()}
   x.strokeStyle='rgba(60,34,12,.35)';x.lineWidth=3;rr(x,164,138,472,214,12);x.stroke();   // canal de jugos
   [[70,170,'#d8c8a0'],[736,330,'#b8c890'],[74,330,'#c8b080']].forEach(([a,b,c])=>{x.fillStyle='rgba(0,0,0,.3)';x.beginPath();x.ellipse(a+3,b+5,32,28,0,0,TAU);x.fill();x.fillStyle='#a8683a';x.beginPath();x.arc(a,b,30,0,TAU);x.fill();x.strokeStyle=OL;x.lineWidth=2.4;x.stroke();x.fillStyle=c;x.beginPath();x.arc(a,b,22,0,TAU);x.fill();x.strokeStyle='rgba(60,40,20,.5)';x.lineWidth=1;x.stroke()})},
  puchero(x){counter(x);hob(x,430,270,112)},
  sarten(x){counter(x);hob(x,420,270,128)},
  parrilla(x){counter(x);x.fillStyle='rgba(0,0,0,.4)';rr(x,176,112,590,312,16);x.fill();const g=x.createLinearGradient(0,100,0,420);g.addColorStop(0,'#7a7468');g.addColorStop(1,'#56514a');x.fillStyle=g;rr(x,168,102,590,312,16);x.fill();x.strokeStyle=OL;x.lineWidth=3;x.stroke();
   for(let r=0;r<5;r++)for(let k=0;k<14;k++){x.fillStyle=['#8a8478','#6c675e','#9a9488','#7a746a'][(r+k)%4];x.beginPath();x.roundRect(176+k*41-(r%2?10:0),108+r*8,40,8,2);x.fill()}
   x.fillStyle='#17110d';rr(x,186,128,554,264,10);x.fill();x.strokeStyle=OL;x.lineWidth=2.5;x.stroke();for(let i=0;i<120;i++){x.fillStyle=['#2a1e16','#3a281a','#1e1610'][i%3];x.beginPath();x.ellipse(196+((i*97)%534),138+((i*53)%244),9+((i*7)%8),6+((i*5)%5),(i%7)*.4,0,TAU);x.fill()}},
  horno(x){x.fillStyle='#3e3830';x.fillRect(0,0,WW,HH);for(let r=0;r<11;r++){let xx=-((r*29)%50);while(xx<WW){const w=56+Math.floor(hs(r,xx,7)*40);x.fillStyle=['#7a746a','#6a645c','#5a554e','#847e74'][Math.floor(hs(r,xx,8)*4)];x.beginPath();x.roundRect(xx+1,r*42+1,w-2,40,5);x.fill();x.strokeStyle='rgba(14,10,6,.8)';x.lineWidth=2;x.stroke();x.fillStyle='rgba(255,255,255,.08)';x.fillRect(xx+5,r*42+4,w*.45,2);xx+=w}}
   x.fillStyle='rgba(0,0,0,.45)';arch(x,186,60,468,300);x.fill();const g=x.createLinearGradient(0,60,0,360);g.addColorStop(0,'#5a544a');g.addColorStop(1,'#2e2a24');x.fillStyle=g;arch(x,176,50,468,300);x.fill();x.strokeStyle=OL;x.lineWidth=4;x.stroke();
   for(let i=0;i<13;i++){const a=Math.PI+i*Math.PI/12,cx=410,cy=140,R=252;x.save();x.translate(cx+Math.cos(a)*R*.95,cy+Math.sin(a)*R*.62);x.rotate(a+Math.PI/2);x.fillStyle=['#8a847a','#726c64'][i%2];x.beginPath();x.roundRect(-16,-22,32,44,4);x.fill();x.strokeStyle=OL;x.lineWidth=2;x.stroke();x.restore()}
   x.fillStyle='#120c08';arch(x,216,86,388,250);x.fill();x.strokeStyle=OL;x.lineWidth=3;x.stroke();
   x.fillStyle='rgba(0,0,0,.4)';x.fillRect(0,400,WW,60);x.strokeStyle=OL;x.lineWidth=3;x.beginPath();x.moveTo(0,400);x.lineTo(WW,400);x.stroke()},
  plato(x){counter(x);x.fillStyle='rgba(0,0,0,.38)';x.beginPath();x.ellipse(430,264,178,170,0,0,TAU);x.fill();const g=x.createRadialGradient(400,220,20,430,250,172);g.addColorStop(0,'#d8a468');g.addColorStop(.7,'#b27c44');g.addColorStop(1,'#8a5a2c');x.fillStyle=g;x.beginPath();x.arc(420,250,168,0,TAU);x.fill();x.strokeStyle=OL;x.lineWidth=3.4;x.stroke();
   x.strokeStyle='rgba(60,30,8,.28)';x.lineWidth=1.4;for(let i=-7;i<=7;i++){const hh=Math.sqrt(Math.max(0,168*168-(i*20)*(i*20)));x.beginPath();x.moveTo(420+i*20-10,250-hh);x.bezierCurveTo(420+i*20+8,200,420+i*20-8,300,420+i*20,250+hh);x.stroke()}
   x.strokeStyle='rgba(50,24,6,.55)';x.lineWidth=2.6;x.beginPath();x.arc(420,250,142,0,TAU);x.stroke();x.fillStyle='#c4905a';x.beginPath();x.arc(420,250,126,0,TAU);x.fill();x.strokeStyle='rgba(50,24,6,.4)';x.lineWidth=1.6;x.stroke();x.strokeStyle='rgba(255,230,180,.45)';x.lineWidth=3;x.beginPath();x.arc(420,250,158,Math.PI*1.1,Math.PI*1.45);x.stroke()}
};
 const BGC={};function bgc(id){if(BGC[id])return BGC[id];const c=document.createElement('canvas');c.width=WW*2;c.height=HH*2;const x=c.getContext('2d');x.setTransform(2,0,0,2,0,0);BG[id](x);BGC[id]=c;return c}
 function arch(x,a,b,w,h){x.beginPath();x.moveTo(a,b+h);x.lineTo(a,b+w*.4);x.quadraticCurveTo(a,b,a+w/2,b);x.quadraticCurveTo(a+w,b,a+w,b+w*.4);x.lineTo(a+w,b+h);x.closePath()}
 let FLR=null;function floor(){if(FLR)return FLR;const c=document.createElement('canvas');c.width=WW;c.height=HH;const x=c.getContext('2d');x.fillStyle='#2e2a24';x.fillRect(0,0,WW,HH);for(let r=0;r<9;r++){let xx=-((r*41)%70);while(xx<WW){const w=70+Math.floor(hs(r,xx,1)*60);x.fillStyle=['#4a453d','#3e3a33','#544e44','#463f36'][Math.floor(hs(r,xx,2)*4)];x.beginPath();x.roundRect(xx+2,r*52+2,w-4,48,6);x.fill();x.strokeStyle='rgba(10,8,4,.8)';x.lineWidth=2;x.stroke();xx+=w}}FLR=c;return c}
 // ── utilidades de escena ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 function pop(g,x,y,txt,col){g.pops.push({x,y,txt,col,t:0})}
 function burst(g,x,y,col,n,k,sp){const c=typeof col==='string'?col:rgb(col);for(let i=0;i<n;i++){const a=rnd(0,TAU),v=rnd(40,200)*(sp||1);g.fx.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-(k==='chip'?80:0),t:0,g:k==='star'?0:420,col:c,sz:k==='star'?2.8:rnd(2,3.8),k:k||'chip'})}}
 function hit(g){g.hs=.045;g.shake=.16}   // hit-stop + temblor muy corto en los aciertos
 function perfect(g,x,y,txt){pop(g,x,y,txt||'¡Perfecto!','#ffe58a');burst(g,x,y+20,'#ffe58a',12,'star');burst(g,x,y+20,'#fff6c8',6,'star',.6);tn(780,.09,'triangle',.06,1200);tn(1040,.12,'triangle',.05,1500);hit(g)}
 function fxDraw(c,g){g.fx.forEach(p=>{if(p.k==='steam'||p.k==='smoke'){const R2=(p.sz||8)*(1+p.t*2.4),a=(p.k==='smoke'?.36:.3)*Math.max(0,1-p.t),gr=c.createRadialGradient(p.x,p.y,0,p.x,p.y,R2);gr.addColorStop(0,p.k==='smoke'?'rgba(74,68,64,'+a+')':'rgba(255,252,246,'+a+')');gr.addColorStop(1,p.k==='smoke'?'rgba(74,68,64,0)':'rgba(255,252,246,0)');c.globalAlpha=1;c.fillStyle=gr;c.beginPath();c.arc(p.x,p.y,R2,0,TAU);c.fill();return}c.globalAlpha=Math.max(0,1-p.t);c.fillStyle=p.col;if(p.k==='star'){c.save();c.translate(p.x,p.y);c.rotate(p.t*6);c.beginPath();for(let k=0;k<8;k++){const r=k%2?p.sz*.45:p.sz*1.4,a=k*Math.PI/4;k?c.lineTo(Math.cos(a)*r,Math.sin(a)*r):c.moveTo(Math.cos(a)*r,Math.sin(a)*r)}c.fill();c.restore()}else{c.beginPath();c.arc(p.x,p.y,p.sz||2,0,TAU);c.fill()}c.globalAlpha=1})}
 function popsDraw(c,g){g.pops.forEach(p=>{const u=p.t/1.1,s=u<.18?.3+u*6:u<.3?1.2-(u-.18)*1.6:1;c.save();c.globalAlpha=Math.max(0,1-Math.max(0,u-.6)*2.5);c.translate(p.x,p.y-u*38);c.scale(s,s);c.rotate(Math.sin(u*9)*.04);c.font='bold 24px Cinzel,serif';c.textAlign='center';c.lineJoin='round';c.lineWidth=6;c.strokeStyle=OL;c.strokeText(p.txt,0,0);c.fillStyle=p.col;c.fillText(p.txt,0,0);c.restore()})}
 function shadow(c,x,y,rx,ry,a){c.fillStyle='rgba(0,0,0,'+(a||.3)+')';c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill()}
 const colOf=(col,d)=>{const gold=mixc(col,[214,150,58],.58),brown=[122,72,30],burnt=[34,24,18];return d<.6?mixc(col,gold,d/.6):d<.9?mixc(gold,brown,(d-.6)/.3):mixc(brown,burnt,clamp((d-.9)/.3,0,1))};
 const dScore=d=>d>=.55&&d<=.88?1:d<.55?Math.max(0,d/.55):Math.max(0,1-(d-.88)/.3);
 // vapor, humo y chisporroteo de lo que se cocina: más cuanto más fuego y más hecho está (acogedor, no agresivo)
 function cookFx(g,dt,pcs,heat){pcs.forEach(p=>{const d=Math.max(p.sa||0,p.sb||0),r=p.r||20;if(Math.random()<dt*heat*(1.5+d*7))g.fx.push({x:p.x+rnd(-r*.5,r*.5),y:p.y-r*.3,vx:rnd(-8,8),vy:-rnd(26,52),t:0,col:'#fff',sz:rnd(5,9),k:'steam',sl:.7});
  if(d>.9&&Math.random()<dt*5)g.fx.push({x:p.x+rnd(-r*.4,r*.4),y:p.y-r*.2,vx:rnd(-10,10),vy:-rnd(20,36),t:0,col:'#444',sz:rnd(7,11),k:'smoke',sl:.6});
  if(heat>.25&&d>.05&&Math.random()<dt*heat*5)g.fx.push({x:p.x+rnd(-r,r),y:p.y+rnd(-r*.6,r*.6),vx:rnd(-30,30),vy:-rnd(30,90),t:0,g:260,col:'rgba(255,224,150,.9)',sz:rnd(1.2,2.2),k:'spark'})})}
 function drawCh(c,ch,col,d){if(FART.draw(c,ch.id,{cut:ch.cut,r:ch.r*1.2,a:ch.a,d:d||0,t:(typeof performance!=='undefined'?performance.now()/1000:0)}))return;const id=ch.id,f=gx(),hd=/^h_/.test(id)&&f.herbD(id);f.drawChunk(c,{r:ch.r,a:ch.a,hp:1},f.chunkKind(id),col||f.icol(id),hd?f.hex(hd[3]):null)}
 // ── bandeja de ingredientes preparados (a la izquierda de cada estación de cocción) ─────────────────────────────────────────────────────────────────────────────────────────────
 const TRAY={x:22,y:250,w:120,h:148};
 const trayPos=(i)=>[52+(i%2)*56,278+Math.floor(i/2)*46];
 function trayLayout(g){let i=0;g.chunks.forEach(c=>{if(c.s==='board'){const[x,y]=trayPos(i++);c.hx=c.x=x;c.hy=c.y=y}})}
 function drawTray(c,g){c.fillStyle='rgba(0,0,0,.35)';rr(c,TRAY.x+4,TRAY.y+7,TRAY.w,TRAY.h,14);c.fill();const gr=c.createLinearGradient(0,TRAY.y,0,TRAY.y+TRAY.h);gr.addColorStop(0,'#a8763e');gr.addColorStop(1,'#7a4e26');c.fillStyle=gr;rr(c,TRAY.x,TRAY.y,TRAY.w,TRAY.h,14);c.fill();c.strokeStyle=OL;c.lineWidth=2.8;c.stroke();c.strokeStyle='rgba(50,24,6,.35)';c.lineWidth=1.3;for(let i=1;i<6;i++){c.beginPath();c.moveTo(TRAY.x+10,TRAY.y+i*26);c.lineTo(TRAY.x+TRAY.w-10,TRAY.y+i*26+Math.sin(i)*3);c.stroke()}
  c.strokeStyle='rgba(255,230,170,.3)';c.lineWidth=2;rr(c,TRAY.x+5,TRAY.y+5,TRAY.w-10,TRAY.h-10,10);c.stroke();c.fillStyle='rgba(255,236,190,.7)';c.font='9px Cinzel,serif';c.textAlign='center';c.lineWidth=3;c.strokeStyle='rgba(30,14,4,.8)';c.strokeText('LISTO PARA ECHAR',TRAY.x+TRAY.w/2,TRAY.y+TRAY.h-7);c.fillText('LISTO PARA ECHAR',TRAY.x+TRAY.w/2,TRAY.y+TRAY.h-7);
  g.chunks.forEach(ch=>{if(ch.s!=='board')return;const T=g.t,hv=Math.sin(T*3+ch.hx)*1.2;c.save();shadow(c,ch.x+2,ch.y+14,15,5,.3);c.translate(ch.x,ch.y+hv);const sc=1.1+(g.hov===ch?.18:0);c.scale(sc,sc);drawCh(c,ch);if(ch.stars){c.fillStyle='#ffd84a';c.strokeStyle=OL;c.lineWidth=1.5;c.font='bold 11px sans-serif';c.textAlign='center';c.strokeText('★'.repeat(ch.stars),0,-22);c.fillText('★'.repeat(ch.stars),0,-22)}c.restore()})}
 function trayHit(g,x,y){return g.chunks.find(c=>c.s==='board'&&Math.hypot(c.x-x,(c.y-y)*1.15)<26)}
 // lanzar un ingrediente de la bandeja a la estación (arco con rebote); al aterrizar llama a la estación
 function toss(g,ch,tx,ty,land){S.inv.splice(S.inv.indexOf(ch.id),1);dirty=1;S.cok=S.cok||{};S.cok[ch.id.split('~')[0]]=1;ch.s='fly';ch.ft=0;ch.sx=ch.x;ch.sy=ch.y;ch.tx=tx;ch.ty=ty;ch.land=land;tn(300,.07,'sine',.04,160);trayLayout(g)}
 function flyTick(g,dt){g.chunks.forEach(c=>{if(c.s!=='fly')return;c.ft+=dt/.5;const t=Math.min(1,c.ft);c.x=c.sx+(c.tx-c.sx)*ease(t);c.y=c.sy+(c.ty-c.sy)*ease(t)-Math.sin(t*Math.PI)*110;c.a+=dt*10;if(t>=1){c.s='in';c.land(c)}})}
 function flyDraw(c,g){g.chunks.forEach(ch=>{if(ch.s!=='fly')return;const t=Math.min(1,ch.ft);shadow(c,ch.sx+(ch.tx-ch.sx)*ease(t),ch.sy+(ch.ty-ch.sy)*ease(t)+14,13,4,.25);c.save();c.translate(ch.x,ch.y);drawCh(c,ch);c.restore()})}
 // ── especiero + radar de sabor ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 const JX=i=>200+i*60,JY=40,SPL={d:4,s:0,a:8,p:14,u:22},jv=()=>FLK.filter(k=>L('co')>=SPL[k]);   // especias DESBLOQUEADAS por nivel de Cocina: solo se ven las que tienes (la sal desde el principio)

 const FLI={d:'🍯',s:'🧂',a:'🌿',p:'🌶️',u:'🍖'},HXP=j=>JX(jv().length+j),HUSE=2,HTOT=4;   // hierbas frescas: ramillos a la derecha del especiero (sazón de la receta; máx. 2 de cada y 4 en total)

 function jarsDraw(c,g){const FL=COC.FL;jv().forEach((k,i)=>{const h=g.jar&&g.jar.i===i,x=h?ptr.x:JX(i),y=h?ptr.y:JY,col=hx(FL[k][1]);c.save();c.translate(x,y);if(h){c.rotate(2.0+Math.sin(g.t*30)*.05)}shadow(c,3,h?46:22,17,5,.32);
   const body=()=>{c.beginPath();c.moveTo(-9,-12);c.quadraticCurveTo(-20,-6,-19,6);c.quadraticCurveTo(-19,19,-8,21);c.lineTo(8,21);c.quadraticCurveTo(19,19,19,6);c.quadraticCurveTo(20,-6,9,-12);c.closePath()};
   const gg=c.createLinearGradient(-19,0,19,0);gg.addColorStop(0,'#7a4624');gg.addColorStop(.45,'#c0804a');gg.addColorStop(1,'#6a3c1e');body();c.fillStyle=gg;c.fill();c.strokeStyle=OL;c.lineWidth=2.4;c.stroke();c.fillStyle='rgba(255,230,180,.28)';c.beginPath();c.ellipse(-8,2,3,9,0,0,TAU);c.fill();
   c.fillStyle=rgb(col,.95);c.beginPath();c.moveTo(-12,-12);c.quadraticCurveTo(0,-26,12,-12);c.quadraticCurveTo(0,-8,-12,-12);c.closePath();c.fill();c.stroke();c.strokeStyle='#d8c8a0';c.lineWidth=2;c.beginPath();c.moveTo(-10,-10);c.quadraticCurveTo(0,-5,10,-10);c.stroke();
   c.font='15px "Segoe UI Emoji",sans-serif';c.textAlign='center';c.fillStyle='#000';c.fillText(FLI[k],0,13);c.font='10px "Segoe UI Emoji",sans-serif';c.fillText(COC.FXI[COC.SPFX[k]],15,-8);c.restore();
   if(!h){c.fillStyle='#fff2d0';c.font='9px Cinzel,serif';c.textAlign='center';c.lineWidth=3;c.strokeStyle=OL;c.strokeText(JN[k],x,JY+36);c.fillText(JN[k],x,JY+36)}})}

 function herbsDraw(c,g){const hv=COC.herbsHave(),hb=g.hb||{};hv.forEach((id,j)=>{const h=g.jar&&g.jar.i===50+j,x=h?ptr.x:HXP(j),y=h?ptr.y:JY,left=(typeof have==='function'?have(id):9)-(hb[id]||0);c.save();c.translate(x,y);if(h)c.rotate(.5+Math.sin(g.t*26)*.08);shadow(c,3,h?46:20,15,4,.3);
   c.strokeStyle=OL;c.lineWidth=2.2;c.fillStyle='#4f7a34';[-.7,-.25,.25,.7].forEach((a,i)=>{c.save();c.rotate(a);c.beginPath();c.moveTo(0,16);c.quadraticCurveTo(-9,-1,0,-18-i%2*4);c.quadraticCurveTo(9,-1,0,16);c.fill();c.stroke();c.restore()});
   c.fillStyle='#d8c8a0';c.fillRect(-7,10,14,5);c.strokeRect(-7,10,14,5);c.font='10px "Segoe UI Emoji",sans-serif';c.textAlign='center';c.fillStyle='#000';const p=COC.props(id),k=p&&Object.keys(p[2])[0];if(k)c.fillText(COC.FXI[k],14,-10);c.restore();
   if(!h){c.fillStyle='#fff2d0';c.font='9px Cinzel,serif';c.textAlign='center';c.lineWidth=3;c.strokeStyle=OL;const nm=I[id][0].replace(/^Hierba de |^Flor de /,'').slice(0,10)+' ×'+Math.max(0,left);c.strokeText(nm,x,JY+36);c.fillText(nm,x,JY+36)}})}
 function jarHit(x,y){const n=jv().length;for(let i=0;i<n;i++)if(Math.abs(x-JX(i))<22&&Math.abs(y-JY)<30)return i;const hv=COC.herbsHave();for(let j=0;j<hv.length;j++)if(Math.abs(x-HXP(j))<22&&Math.abs(y-JY)<30)return 50+j;return -1}
 function flav(g){const f={d:0,s:0,a:0,p:0,u:0};Object.keys(g.M.fl).forEach(k=>f[k]+=g.M.fl[k]);FLK.forEach(k=>f[k]+=g.sp[k]);const hb=g.hb||{};for(const id in hb){const p=COC.props(id);if(p)for(const c of p[1])f[c]+=.5*hb[id]}return f}
 const tgOf=g=>{const t={};FLK.forEach(k=>t[k]=g.rec&&g.rec.tg?(g.rec.tg[k]||.1):(g.M.fl[k]?.5:.1));return t};
 function sabor(g){const f=flav(g),t=tgOf(g);let s=0;FLK.forEach(k=>{const v=clamp(f[k]/3,0,1),d=Math.max(0,Math.abs(v-t[k])-.2);s+=clamp(1-d/.4,0,1)});return s/5}
 // PERGAMINO DE EFECTOS: lo que el plato va a dar (con los ingredientes y las especias que llevas) + la curación; debajo, las especias con su marca de sabor (✓ en su punto · ▲ añade · ▼ te pasaste)
 function radar(c,g,cx,cy,R){const f=flav(g),t=tgOf(g),Mx=COC.mix(g.sel,g.sp,g.hb),FXI=COC.FXI,FX=COC.FX,r0=R*1.62;
  c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.arc(cx+3,cy+5,r0,0,TAU);c.fill();const pg=c.createRadialGradient(cx-12,cy-16,10,cx,cy,r0);pg.addColorStop(0,'#eedcae');pg.addColorStop(1,'#b8985e');c.fillStyle=pg;c.beginPath();c.arc(cx,cy,r0,0,TAU);c.fill();c.strokeStyle=OL;c.lineWidth=2.6;c.stroke();c.strokeStyle='rgba(90,60,24,.4)';c.lineWidth=1.2;c.beginPath();c.arc(cx,cy,r0-6,0,TAU);c.stroke();
  c.fillStyle='#5a3a14';c.font='bold 8px Cinzel,serif';c.textAlign='center';c.fillText('EFECTOS DEL PLATO',cx,cy-r0+25);   /* más abajo y más pequeño: a +17 el título era más ancho que el pergamino y se cortaba */
  const rows=Mx.top.length?Mx.top:null;
  if(rows)rows.forEach(([k,l],i)=>{const y=cy-20+i*25;c.fillStyle='rgba(40,24,10,.12)';rr(c,cx-r0+14,y-11,r0*2-28,22,8);c.fill();c.font='16px "Segoe UI Emoji",sans-serif';c.textAlign='left';c.fillStyle='#000';c.fillText(FXI[k],cx-r0+17,y+6);c.font='bold 10px Cinzel,serif';c.fillStyle=FX[k][1]==='#bfe8ff'?'#4a7a9a':FX[k][1]==='#9aa0b0'?'#5a6070':FX[k][1];c.lineWidth=0;c.fillText(FX[k][0],cx-r0+38,y+4);
   for(let n=0;n<3;n++){c.fillStyle=n<l?'#8a3a14':'rgba(90,60,24,.28)';c.beginPath();c.arc(cx+r0-24+n*0,y,0,0,TAU)}c.textAlign='right';c.font='bold 10px sans-serif';c.fillStyle='#8a3a14';c.fillText('●'.repeat(l)+'○'.repeat(3-l),cx+r0-14,y+4)});
  else{c.fillStyle='#6a4a20';c.font='italic 10px Cinzel,serif';c.textAlign='center';c.fillText('Solo alimenta',cx,cy+2);c.font='9px Cinzel,serif';c.fillText('(añade ingredientes o especias)',cx,cy+16)}
  c.textAlign='center';c.fillStyle='#4a2c10';c.font='bold 10px Cinzel,serif';c.fillText('Cura '+COC.healOf(Mx.ti,1,g.meth)+' PV · tier '+Mx.ti,cx,cy+r0-20);
  // especias con su marca de sabor
  FLK.forEach((k,i)=>{const x=cx-44+i*22,y=cy+r0+13,v=clamp(f[k]/3,0,1),lo=clamp(t[k]-.2,0,1),hi=clamp(t[k]+.2,0,1),ok=v>=lo&&v<=hi,low=v<lo;c.fillStyle=ok?'rgba(150,210,90,.95)':'rgba(40,24,10,.7)';c.beginPath();c.arc(x,y,10,0,TAU);c.fill();c.strokeStyle=ok?'#3e7a1c':low?'#d8a030':'#c8482a';c.lineWidth=2.4;c.stroke();c.font='11px "Segoe UI Emoji",sans-serif';c.textAlign='center';c.fillStyle='#000';c.fillText(FLI[k],x,y+4);
   const mk=ok?'✓':low?'▲':'▼';c.font='bold 9px sans-serif';c.lineWidth=2.5;c.strokeStyle='rgba(30,14,4,.9)';c.strokeText(mk,x+9,y-6);c.fillStyle=ok?'#b8f070':low?'#ffd070':'#ff7a5a';c.fillText(mk,x+9,y-6)})}
 const hxs=h=>h;
 // ── ratón (siempre en coordenadas locales de la estación a pantalla completa) ─────────────────────────────────────────────────────────────────────────────────────────────────
 const ptr={x:0,y:0,px:0,py:0,pt:0,down:false,dt:16,ang:-.35};
 // ── controles redondos (mandos) ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 function knob(c,x,y,r,v,ideal,lbl,g){c.save();shadow(c,x+3,y+r*.5,r*1.05,r*.3,.4);const a0=Math.PI*.75,a1=Math.PI*2.25,ang=a0+v*(a1-a0);
  c.lineCap='round';c.strokeStyle='rgba(20,10,2,.55)';c.lineWidth=7;c.beginPath();c.arc(x,y,r+11,a0,a1);c.stroke();
  if(ideal){c.strokeStyle='rgba(130,200,70,.95)';c.lineWidth=6;c.beginPath();c.arc(x,y,r+11,a0+ideal[0]*(a1-a0),a0+ideal[1]*(a1-a0));c.stroke()}
  c.strokeStyle=v>.8?'#ff7a3a':'#ffd070';c.lineWidth=3.4;c.beginPath();c.arc(x,y,r+11,a0,ang);c.stroke();
  c.save();c.translate(x,y);c.rotate(ang+Math.PI/2);const wg=c.createRadialGradient(-r*.3,-r*.3,2,0,0,r);wg.addColorStop(0,'#b88048');wg.addColorStop(1,'#5a3818');c.fillStyle=wg;c.beginPath();c.arc(0,0,r,0,TAU);c.fill();c.strokeStyle='#3a362f';c.lineWidth=5;c.stroke();c.strokeStyle=OL;c.lineWidth=1.4;c.beginPath();c.arc(0,0,r+2.5,0,TAU);c.stroke();
  c.strokeStyle='rgba(40,20,6,.7)';c.lineWidth=5;for(let i=0;i<4;i++){c.beginPath();c.moveTo(Math.cos(i*Math.PI/2)*r*.9,Math.sin(i*Math.PI/2)*r*.9);c.lineTo(-Math.cos(i*Math.PI/2)*r*.9,-Math.sin(i*Math.PI/2)*r*.9);c.stroke()}
  c.fillStyle='#3a362f';c.beginPath();c.arc(0,0,r*.28,0,TAU);c.fill();c.strokeStyle=OL;c.lineWidth=1.6;c.stroke();c.fillStyle='#d8b868';c.beginPath();c.arc(0,-r*.7,r*.15,0,TAU);c.fill();c.stroke();c.restore();
  c.fillStyle='#ffe2a8';c.font='bold 10px Cinzel,serif';c.textAlign='center';c.lineWidth=3;c.strokeStyle=OL;c.strokeText(lbl,x,y+r+28);c.fillText(lbl,x,y+r+28);c.restore()}
 const knobHit=(k,x,y,cx,cy,r)=>Math.hypot(x-cx,y-cy)<r+16;
 function pill(c,x,y,w,h,txt,on,t){c.save();c.translate(x,y);const p=on?1+Math.sin(t*6)*.03:1;c.scale(p,p);shadow(c,2,h*.5,w*.5,h*.3,.35);const g=c.createLinearGradient(0,-h/2,0,h/2);g.addColorStop(0,on?'#b88444':'#7a5a34');g.addColorStop(1,on?'#7a4e22':'#4a341c');c.fillStyle=g;rr(c,-w/2,-h/2,w,h,6);c.fill();c.strokeStyle=on?'#ffe08a':'#2a2622';c.lineWidth=3.2;c.stroke();[[-w/2+7,-h/2+7],[w/2-7,-h/2+7],[-w/2+7,h/2-7],[w/2-7,h/2-7]].forEach(([a,b])=>{c.fillStyle='#2a2622';c.beginPath();c.arc(a,b,2.2,0,TAU);c.fill()});c.lineWidth=3.4;c.strokeStyle='rgba(30,14,4,.8)';c.fillStyle=on?'#fff0c0':'#b09870';c.font='bold 13px Cinzel,serif';c.textAlign='center';c.strokeText(txt,0,5);c.fillText(txt,0,5);c.restore()}
 // ═══ ESTACIÓN: MESA DE TRABAJO (preparar cada ingrediente) ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
 //  cut = cortar al compás (carne) · chop = picar de un tajo (hierbas, hongos) · fish = escamar y filetear (pescado)
 function mgNew(g,kind,id,i){const m={kind,id,i,t:0,done:false,col:gx().icol(id),sc:[],fin:0,k:0,trail:[]};
  if(kind==='cut'){m.marks=[[340,232],[388,274],[432,236],[474,276],[510,240]].map(([x,y])=>({x,y}));m.kn=0;m.cuts=[]}
  else if(kind==='chop'){m.marks=[[290,196],[372,262],[454,326],[536,206],[618,282]].map(([x,y])=>({x,y}));m.n=0;m.tm=0;m.W=1.5;m.hits=[]}
  else{m.st=0;m.sp=0;m.u=0;m.hold=false;m.acc=0;m.cnt=0}
  g.fx.length=0;return m}
 const fpath=u=>({x:285+u*230,y:253+Math.sin(u*Math.PI*2.4)*16});
 const MESA={
  down(g,x,y){const m=g.mg;if(!m||m.done)return;
   if(m.kind==='cut')return;
   else if(m.kind==='fish'&&m.st===1){const p=fpath(m.u);if(Math.hypot(x-p.x,y-p.y)<46)m.hold=true}},
  move(g,x,y){const m=g.mg;if(!m||m.done)return;const dt=ptr.dt;
   if(m.kind==='cut'&&ptr.down&&m.kn<m.marks.length){const mk=m.marks[m.kn],ax=ptr.px,ay=ptr.py,bx=x-ax,by=y-ay,L2=bx*bx+by*by,sp=Math.sqrt(L2)/Math.max(1,dt);   // tajo en cualquier dirección: se mide lo cerca que pasa el cuchillo de la marca (al alejarse se da por hecho el corte)
    if(L2>1){const t=clamp(((mk.x-ax)*bx+(mk.y-ay)*by)/L2,0,1),d=Math.hypot(ax+bx*t-mk.x,ay+by*t-mk.y);if(sp>.3&&d<38&&(m.best==null||d<m.best)){m.best=d;m.bang=Math.atan2(by,bx)}if(m.best!=null&&(d>m.best+7||d>=38))cutCommit(g,m)}}
   if(m.kind==='chop'){m.trail.push({x,y,t:0});if(m.trail.length>14)m.trail.shift()}
   if(m.kind==='chop'&&ptr.down&&m.n<m.marks.length){const mk=m.marks[m.n],px=ptr.px,py=ptr.py,sp=Math.hypot(x-px,y-py)/Math.max(1,dt),c0=px-mk.x,c1=x-mk.x;
    if(c0*c1<=0&&c0!==c1&&sp>.45){const t=c0/(c0-c1),cy=py+(y-py)*t;if(Math.abs(cy-mk.y)<46){const acc=clamp(1-Math.max(0,m.tm-.15)/(m.W*.9),.3,1);m.sc.push(acc);m.hits.push(mk);burst(g,mk.x,mk.y,m.col,12,'chip');nz(.07,.13,2200,'highpass');if(acc>.7)perfect(g,mk.x,mk.y-46);else{tn(300+acc*400,.06,'square',.04,140);g.shake=.08}m.n++;m.tm=0;m.k=.2;if(m.n>=m.marks.length)endMg(g)}}}
   else if(m.kind==='fish'&&ptr.down){if(m.st===0){const d=Math.hypot(x-ptr.px,y-ptr.py);if(x>260&&x<540&&y>190&&y<320){m.sp=Math.min(1,m.sp+d/1100);if(d>3&&Math.random()<.8)g.fx.push({x,y,vx:rnd(-90,90),vy:-rnd(40,140),t:0,g:380,col:'#e8f0f6',sz:2.6,k:'scale'});if(Math.random()<.2)nz(.04,.06,3000,'highpass');if(m.sp>=1){m.st=1;pop(g,400,170,'¡Limpio!','#cfe8f0');tn(600,.12,'triangle',.05,900)}}}
    else if(m.hold){let bu=m.u,bd=1e9;for(let k=0;k<=24;k++){const u=Math.min(1,m.u+k*.006),p=fpath(u),d=Math.hypot(x-p.x,y-p.y);if(d<bd){bd=d;bu=u}}
     if(bd<60){m.u=Math.max(m.u,bu);m.acc+=clamp(1-bd/44,0,1);m.cnt++;if(bd>26&&Math.random()<.4)g.fx.push({x,y,vx:rnd(-30,30),vy:-rnd(20,60),t:0,g:200,col:'#d84a3a',sz:2.2,k:'drop'});if(bd<12&&Math.random()<.3)g.fx.push({x,y,vx:rnd(-20,20),vy:-rnd(20,50),t:0,g:0,col:'#fff2b0',sz:1.8,k:'star'});
      if(m.u>=.985){m.sc.push(m.cnt?m.acc/m.cnt:0);if(m.sc[0]>.8)perfect(g,400,160);tn(700,.14,'triangle',.06,1000);nz(.12,.12,1800,'highpass');endMg(g)}}}}},
  up(g){const m=g.mg;if(m&&m.kind==='fish')m.hold=false;if(m&&m.kind==='cut'&&m.best!=null)cutCommit(g,m)},
  tick(g,dt){const m=g.mg;if(!m)return;m.t+=dt;m.k=Math.max(0,m.k-dt);m.trail.forEach(p=>p.t+=dt*3);m.trail=m.trail.filter(p=>p.t<1);
   if(m.done){m.fin+=dt;if(m.fin>1.5){g.mg=null;COC.prepDone(m)}return}
   if(m.kind==='chop'){m.tm+=dt;if(m.n<m.marks.length&&m.tm>m.W){m.sc.push(.2);m.n++;m.tm=0;tn(150,.12,'sawtooth',.04,80);if(m.n>=m.marks.length)endMg(g)}}}};
 function cutCommit(g,m){const mk=m.marks[m.kn],d=m.best,acc=clamp(1-d/38,.25,1);m.best=null;m.sc.push(acc);m.cuts.push({x:mk.x,y:mk.y,a:m.bang,t:0});burst(g,mk.x,mk.y,m.col,10,'chip');if(d<10)perfect(g,mk.x,mk.y-42);else{tn(250+acc*300,.06,'square',.04,120);g.shake=.08}nz(.08,.12,1500,'highpass');m.kn++;m.k=.2;if(m.kn>=m.marks.length)endMg(g)}
 function endMg(g){const m=g.mg,s=m.sc.length?m.sc.reduce((a,b)=>a+b,0)/m.sc.length:1;m.done=true;m.fin=0;m.score=s;m.stars=s>=.85?3:s>=.6?2:1;g.pr.push(s)}
 function drawKnife(c,x,y,rot,s,lift){c.save();shadow(c,x+8+(lift||0)*.2,y+70*s+(lift||0)*.3,24*s,6*s,.3-(lift||0)*.003);c.translate(x,y);c.rotate(rot||0);c.scale(s||1,s||1);const g=c.createLinearGradient(-16,0,16,0);g.addColorStop(0,'#aeb4be');g.addColorStop(.55,'#f2f5fa');g.addColorStop(1,'#8a909a');c.fillStyle=g;c.beginPath();c.moveTo(-14,-4);c.lineTo(15,-4);c.lineTo(15,92);c.quadraticCurveTo(0,108,-14,100);c.closePath();c.fill();c.strokeStyle=OL;c.lineWidth=2.4;c.stroke();c.fillStyle='rgba(255,255,255,.7)';c.fillRect(-9,4,3,80);
  c.fillStyle='#6a4020';c.beginPath();c.roundRect(-13,-52,26,50,6);c.fill();c.stroke();[-38,-22,-6].forEach(yy=>{c.fillStyle='#d8b868';c.beginPath();c.arc(0,yy,2.6,0,TAU);c.fill();c.stroke()});c.fillStyle='#b89040';c.fillRect(-13,-8,26,6);c.restore()}
// cuchillo visto desde ARRIBA: sigue al ratón y apunta hacia donde lo mueve el jugador (ang); `lift` = cuánto despega de la tabla (sombra más grande y lejana)
 function knifeTop(c,x,y,ang,lift,sc){const s=sc||1;c.save();c.translate(x,y);c.rotate(ang||0);c.scale(s,s);const L=lift||0;
  c.save();c.translate(5+L*9,7+L*11);c.fillStyle='rgba(0,0,0,'+(.34-L*.1)+')';c.beginPath();c.moveTo(-30,-9);c.lineTo(36,-9);c.quadraticCurveTo(66,-6,70,4);c.quadraticCurveTo(40,10,-30,10);c.closePath();c.fill();c.beginPath();c.roundRect(-80,-8,50,16,6);c.fill();c.restore();
  const bl=c.createLinearGradient(0,-10,0,11);bl.addColorStop(0,'#f4f6fa');bl.addColorStop(.35,'#c8cdd6');bl.addColorStop(1,'#8a909c');c.fillStyle=bl;c.beginPath();c.moveTo(-30,-9);c.lineTo(36,-9);c.quadraticCurveTo(64,-7,70,3);c.quadraticCurveTo(40,11,-30,10);c.closePath();c.fill();c.strokeStyle=OL;c.lineWidth=2.2;c.stroke();
  c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=1.6;c.beginPath();c.moveTo(-26,-5);c.lineTo(48,-5);c.stroke();c.strokeStyle='rgba(60,66,76,.5)';c.lineWidth=1;c.beginPath();c.moveTo(-26,3);c.lineTo(52,3);c.stroke();
  c.fillStyle='#3a362f';c.beginPath();c.roundRect(-36,-10,9,20,2);c.fill();c.strokeStyle=OL;c.lineWidth=1.8;c.stroke();   // virola
  const hg=c.createLinearGradient(0,-8,0,8);hg.addColorStop(0,'#9a6a38');hg.addColorStop(1,'#5a3a1a');c.fillStyle=hg;c.beginPath();c.roundRect(-82,-8,48,16,6);c.fill();c.strokeStyle=OL;c.lineWidth=2.2;c.stroke();[-70,-56,-44].forEach(rx=>{c.fillStyle='#d8b868';c.beginPath();c.arc(rx,0,2.2,0,TAU);c.fill();c.strokeStyle=OL;c.lineWidth=1;c.stroke()});c.restore()}
 function drawStars(c,x,y,n,t){for(let i=0;i<3;i++){const u=clamp(t*3-i*.6,0,1),sz=(18+12*Math.sin(u*Math.PI))*(u>0?1:0);c.save();c.translate(x+(i-1)*46,y);c.rotate((1-u)*-.8);c.fillStyle=i<n?'#ffd84a':'rgba(120,110,90,.6)';c.strokeStyle=OL;c.lineWidth=2.2;c.beginPath();for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,r=k%2?sz*.45:sz;c[k?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r)}c.closePath();c.fill();c.stroke();if(i<n){c.fillStyle='rgba(255,255,255,.5)';c.beginPath();c.arc(-sz*.2,-sz*.25,sz*.18,0,TAU);c.fill()}c.restore()}}
 // ── TROCEADO REAL (27 oct 2026): cada corte parte de verdad la pieza por la línea del cuchillo y las dos mitades se separan con suavidad (perpendicular al corte). Pieza = semiplanos [nx,ny,d,signo] + desplazamiento animado.
 const clipHalf=(poly,nx,ny,d,sg)=>{const out=[],f=q=>sg*(nx*q[0]+ny*q[1]-d);for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],fa=f(a),fb=f(b);if(fa>=0)out.push(a);if((fa>=0)!==(fb>=0)){const u=fa/(fa-fb);out.push([a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u])}}return out};
 const polyArea=P=>{let a=0;for(let i=0;i<P.length;i++){const q=P[i],r=P[(i+1)%P.length];a+=q[0]*r[1]-r[0]*q[1]}return Math.abs(a)/2};
 const pieceOf=(p,cx,cy)=>{let P=[[cx-190,cy-140],[cx+190,cy-140],[cx+190,cy+140],[cx-190,cy+140]];p.cs.forEach(k=>P=clipHalf(P,k[0],k[1],k[2],k[3]));return P};
 function meatCut(c,m,cx,cy,T,drawArt){const dt=Math.min(.05,Math.max(0,T-(m.lt==null?T:m.lt)));m.lt=T;if(!m.pcs){m.pcs=[{cs:[],ox:0,oy:0,tx:0,ty:0}];m.pn=0}
  while(m.pn<m.cuts.length){const k=m.cuts[m.pn++],nx=-Math.sin(k.a),ny=Math.cos(k.a),d=nx*k.x+ny*k.y,out=[];
   m.pcs.forEach(p=>{const P=pieceOf(p,cx,cy),A=clipHalf(P,nx,ny,d,1),B=clipHalf(P,nx,ny,d,-1);if(A.length>2&&B.length>2&&polyArea(A)>400&&polyArea(B)>400){[[1,A],[-1,B]].forEach(([sg])=>out.push({cs:p.cs.concat([[nx,ny,d,sg]]),ox:p.ox,oy:p.oy,tx:p.tx+sg*nx*11,ty:p.ty+sg*ny*11}))}else out.push(p)});m.pcs=out}
  const kk=1-Math.exp(-dt*7),OX=190,OY=140,oc=m.oc||(m.oc=document.createElement('canvas'));oc.width=OX*4;oc.height=OY*4;const o=oc.getContext('2d');
  m.pcs.forEach(p=>{p.ox+=(p.tx-p.ox)*kk;p.oy+=(p.ty-p.oy)*kk;const P=pieceOf(p,cx,cy);if(P.length<3)return;
   // cada trozo se pinta en un lienzo auxiliar (recortado a su polígono) para que la cara de corte solo salga SOBRE la carne
   o.setTransform(2,0,0,2,0,0);o.clearRect(0,0,OX*2,OY*2);o.save();o.beginPath();P.forEach((q,i)=>{const x=q[0]-cx+OX,y=q[1]-cy+OY;i?o.lineTo(x,y):o.moveTo(x,y)});o.closePath();o.clip();o.save();o.translate(OX,OY);drawArt(o);o.restore();
   o.globalCompositeOperation='source-atop';p.cs.forEach(k=>{const dx=k[1],dy=-k[0],px=k[0]*k[2]-cx+OX,py=k[1]*k[2]-cy+OY;o.lineCap='round';o.strokeStyle='rgba(255,170,155,.95)';o.lineWidth=5;o.beginPath();o.moveTo(px-dx*500,py-dy*500);o.lineTo(px+dx*500,py+dy*500);o.stroke();o.strokeStyle='rgba(110,34,30,.85)';o.lineWidth=1.6;o.stroke()});o.restore();
   c.save();c.shadowColor='rgba(0,0,0,.28)';c.shadowBlur=6;c.shadowOffsetY=3;c.drawImage(oc,0,0,OX*4,OY*4,cx-OX+p.ox,cy-OY+p.oy,OX*2,OY*2);c.restore()})}
 function lt(h,k){const a=hx(h);return rgb(k>=0?mixc(a,[255,255,255],k):mixc(a,[0,0,0],-k))}
 MESA.draw=function(c,g){const m=g.mg,T=g.t,f=gx();if(!m){c.fillStyle='rgba(8,5,2,.2)';c.fillRect(0,0,WW,HH);return}
  c.save();if(g.shake>0)c.translate(rnd(-1,1)*g.shake*9,rnd(-1,1)*g.shake*9);
  if(m.kind==='cut'){const cx=410,cy=254,fin=m.done?Math.min(1,m.fin*3):0;shadow(c,cx+5,cy+38,150,30,.28);
   meatCut(c,m,cx,cy,T,cc=>{if(!FART.draw(cc,m.id,{r:/^pollo/.test(m.id)?88:/^ancas/.test(m.id)?100:98,a:0,d:0,t:T})){cc.scale(2.1,1.18);f.drawChunk(cc,{r:58,a:0,hp:1},'flesh',m.col,null)}});
   /* los cortes son reales: ver meatCut() */
   m.marks.forEach((mk,i)=>{const act=i===m.kn&&!m.done,done=i<m.kn;if(done)return;c.strokeStyle=act?'#ffe58a':'rgba(255,240,200,.45)';c.lineWidth=act?3.2:1.6;c.setLineDash(act?[]:[4,5]);c.beginPath();c.arc(mk.x,mk.y,act?22+Math.sin(T*8)*3:12,0,TAU);c.stroke();c.setLineDash([]);if(act){c.fillStyle='rgba(255,229,138,'+(.18+.14*Math.sin(T*10))+')';c.beginPath();c.arc(mk.x,mk.y,22,0,TAU);c.fill();c.fillStyle='#fff2d0';c.beginPath();c.arc(mk.x,mk.y,3,0,TAU);c.fill()}});
   if(!m.done){c.fillStyle='#fff2d0';c.font='13px Cinzel,serif';c.textAlign='center';c.lineWidth=4;c.strokeStyle=OL;const tx='Corta pasando el cuchillo por cada marca, en la dirección que quieras ('+m.kn+'/'+m.marks.length+')';c.strokeText(tx,400,148);c.fillText(tx,400,148)}}
  else if(m.kind==='chop'){const lt0=m.lt;[196,262,326].forEach(y=>{const x0=262,x1=650,dt2=Math.min(.05,Math.max(0,T-(m.lt==null?T:m.lt))),hs2=m.hits.filter(h=>[196,262,326].reduce((b2,r)=>Math.abs(r-h.y)<Math.abs(b2-h.y)?r:b2)===y).sort((a2,b2)=>a2.x-b2.x),bd=[x0].concat(hs2.map(h=>h.x),[x1]);hs2.forEach(h=>h.u=Math.min(1,(h.u||0)+dt2*4));bd.slice(0,-1).forEach((xa,si)=>{const xb=bd[si+1];let sh=0;for(let q=0;q<si;q++)sh+=9*ease(hs2[q].u||0);c.save();c.translate(sh,0);c.beginPath();c.rect(xa-(si?0:30),y-34,xb-xa+(si<bd.length-2?0:30),68);c.clip();shadow(c,(x0+x1)/2+3,y+13,(x1-x0)/2,8,.25);const g2=c.createLinearGradient(0,y-12,0,y+12);g2.addColorStop(0,rgb(mixc(m.col,[255,255,255],.25)));g2.addColorStop(1,rgb(mixc(m.col,[0,0,0],.25)));c.fillStyle=g2;rr(c,x0,y-11,x1-x0,22,10);c.fill();c.strokeStyle=OL;c.lineWidth=2.2;c.stroke();c.fillStyle='rgba(255,255,255,.3)';c.fillRect(x0+10,y-7,x1-x0-20,4);c.save();c.translate(x0+4,y+1);c.rotate(-.5);f.drawChunk(c,{r:16,a:0,hp:1},'leaf',m.col,null);c.restore();c.restore()})});
   m.lt=T;
   /* los cortes se ven como huecos entre los trozos */
   m.marks.forEach((mk,i)=>{if(i<m.n)return;const act=i===m.n,u=act?m.tm/m.W:0;c.strokeStyle=act?'#ffe58a':'rgba(255,240,200,.4)';c.lineWidth=act?4:1.6;c.setLineDash(act?[]:[5,5]);c.beginPath();c.moveTo(mk.x,mk.y-34);c.lineTo(mk.x,mk.y+34);c.stroke();c.setLineDash([]);
    if(act){c.strokeStyle='rgba(255,229,138,.95)';c.lineWidth=3.4;c.beginPath();c.arc(mk.x,mk.y,31,-Math.PI/2,-Math.PI/2+(1-u)*TAU);c.stroke();c.fillStyle='rgba(255,229,138,'+(.22+.2*Math.sin(T*14))+')';c.beginPath();c.arc(mk.x,mk.y,25,0,TAU);c.fill()}});
   m.trail.forEach((p,i,a)=>{if(i){c.strokeStyle='rgba(255,255,255,'+(.5*(1-p.t))+')';c.lineWidth=5*(1-p.t)+1;c.lineCap='round';c.beginPath();c.moveTo(a[i-1].x,a[i-1].y);c.lineTo(p.x,p.y);c.stroke()}});
   knifeTop(c,ptr.x,ptr.y,ptr.ang,ptr.down?0:1)}
  else{const split=m.done?Math.min(1,m.fin*2):0,fb=FART.base(m.id),fc='#'+fb.map(v=>('0'+Math.round(Math.min(255,v*.85+30)).toString(16)).slice(-2)).join('');
   const fish=(dy,hl)=>{c.save();shadow(c,404,262+dy+36,160,18,.25);c.translate(400,254+dy);const body=()=>{c.beginPath();c.moveTo(-135,0);c.quadraticCurveTo(-90,-hl*52,0,-hl*46);c.quadraticCurveTo(95,-hl*30,128,-4);c.lineTo(168,-hl*34);c.lineTo(160,0);c.lineTo(168,hl*34);c.lineTo(128,4);c.quadraticCurveTo(95,hl*30,0,hl*46);c.quadraticCurveTo(-90,hl*52,-135,0);c.closePath()};
    const gr=c.createLinearGradient(0,-50,0,50);gr.addColorStop(0,lt(fc,-.25));gr.addColorStop(.5,fc);gr.addColorStop(1,lt(fc,.5));body();c.fillStyle=gr;c.fill();c.strokeStyle=OL;c.lineWidth=2.6;c.stroke();
    if(m.st===0&&!m.done){c.save();body();c.clip();c.globalAlpha=1-m.sp*.95;c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=1.2;for(let r=-4;r<=4;r++)for(let k=-8;k<=7;k++){c.beginPath();c.arc(-120+k*17+(r%2?8:0),r*11,7,0,Math.PI);c.stroke()}c.restore()}
    c.save();body();c.clip();c.strokeStyle='rgba(40,50,70,.5)';c.lineWidth=5;c.beginPath();c.moveTo(-130,-hl*20);c.quadraticCurveTo(0,-hl*44,128,-hl*14);c.stroke();c.strokeStyle='rgba(255,255,255,.25)';c.lineWidth=2;c.beginPath();c.moveTo(-110,0);c.quadraticCurveTo(0,-hl*6,150,0);c.stroke();if(m.st>0||m.done){c.strokeStyle='rgba(255,240,230,.35)';c.lineWidth=2;for(let k=0;k<9;k++){const x=-100+k*24;c.beginPath();c.moveTo(x,-hl*26);c.quadraticCurveTo(x+14,0,x-4,hl*26);c.stroke()}}c.restore();c.strokeStyle='rgba(30,20,20,.55)';c.lineWidth=2.4;c.beginPath();c.arc(-92,-2,hl*28,-1.2,1.2);c.stroke();[[150,-hl*24],[150,hl*24]].forEach(([x,y])=>{c.strokeStyle='rgba(30,20,20,.4)';c.lineWidth=1.4;for(let q=0;q<4;q++){c.beginPath();c.moveTo(130+q*4,y*.2);c.lineTo(x+q*4,y*(1+q*.05));c.stroke()}});
    c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.ellipse(-20,-28,70,8,-.05,0,TAU);c.fill();if(hl>.9){c.fillStyle='#fff';c.beginPath();c.arc(-108,-6,5,0,TAU);c.fill();c.fillStyle='#1a1a1a';c.beginPath();c.arc(-107,-6,2.6,0,TAU);c.fill()}c.restore()};
   if(m.done){fish(-split*22,.55);fish(split*22,.55)}else fish(0,1);
   if(m.st===1&&!m.done){c.strokeStyle='rgba(255,240,200,.6)';c.lineWidth=3;c.setLineDash([8,7]);c.beginPath();for(let k=0;k<=40;k++){const p=fpath(k/40);k?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y)}c.stroke();c.setLineDash([]);
    c.strokeStyle='#ffe58a';c.lineWidth=4.4;c.lineCap='round';c.beginPath();for(let k=0;k<=Math.round(m.u*40);k++){const p=fpath(k/40);k?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y)}c.stroke();const p0=fpath(m.u);c.fillStyle='rgba(255,229,138,'+(.4+.3*Math.sin(T*10))+')';c.beginPath();c.arc(p0.x,p0.y,m.hold?9:17,0,TAU);c.fill();if(ptr.down&&m.hold)knifeTop(c,ptr.x,ptr.y,ptr.ang,0,.8)}
   if(m.st===0&&!m.done){c.fillStyle='#fff2d0';c.font='13px Cinzel,serif';c.textAlign='center';c.lineWidth=4;c.strokeStyle=OL;c.strokeText('Raspa las escamas arrastrando sobre el pez',400,150);c.fillText('Raspa las escamas arrastrando sobre el pez',400,150);c.fillStyle='rgba(16,12,8,.8)';rr(c,300,340,200,10,5);c.fill();c.fillStyle='#cfe8f0';rr(c,301,341,198*m.sp,8,4);c.fill()}}
  if(m.kind==='cut'&&!m.done)knifeTop(c,ptr.x,ptr.y,ptr.ang,ptr.down?0:1);
  c.restore();
  const all=g.sel.filter(id=>COC.prepOf(id));let sx=400-(all.length-1)*30;all.forEach((id,i)=>{const done=g.pr.length>i,cur=!done&&m.id===id&&i===g.pr.length;c.fillStyle=cur?'rgba(232,207,148,.35)':'rgba(16,12,8,.75)';c.beginPath();c.arc(sx+i*60,92,19,0,TAU);c.fill();c.strokeStyle=cur?'#e8cf94':OL;c.lineWidth=2.4;c.stroke();c.save();c.translate(sx+i*60,92);f.drawChunk(c,{r:11,a:0,hp:1},f.chunkKind(id),f.icol(id),null);c.restore();if(done){c.fillStyle='#bfe880';c.font='bold 14px sans-serif';c.textAlign='center';c.fillText('✓',sx+i*60+14,78)}});
  if(m.done)drawStars(c,400,408,m.stars,m.fin)};
 // ═══ piezas con punto de cocción (sartén y parrilla) ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
 function mkPiece(ch,x,y){return{cut:ch.cut,id:ch.id,x,y,r:25,a:ch.a,sq:0,sa:0,sb:0,side:0,flip:0,fa:0,col:gx().icol(ch.id),stars:ch.stars,vx:0,vy:0,gold:[0,0],pk:0}}
 function pieceDraw(c,p,T){const d=p.side?p.sb:p.sa,flipS=Math.abs(Math.cos(p.flip*Math.PI)),col=colOf(p.col,d),lift=Math.sin(Math.min(1,p.flip)*Math.PI)*22;shadow(c,p.x+3,p.y+10+lift*.5,p.r*1.05,p.r*.4,.3-lift*.005);c.save();c.translate(p.x,p.y-lift);c.rotate(p.a);c.scale(1+p.sq,(1-p.sq)*Math.max(.12,flipS));const f=gx(),hd=/^h_/.test(p.id)&&f.herbD(p.id);if(!FART.draw(c,p.id,{cut:p.cut,r:p.r*1.2,a:0,d,t:T}))f.drawChunk(c,{r:p.r,a:0,hp:1},f.chunkKind(p.id),col,hd?f.hex(hd[3]):null);
  c.fillStyle='rgba(255,236,170,'+(.18+.1*Math.sin(T*3+p.x)) +')';c.beginPath();c.ellipse(-p.r*.2,-p.r*.3,p.r*.5,p.r*.18,-.3,0,TAU);c.fill();
  if(d>.95){c.fillStyle='rgba(20,12,8,.5)';for(let k=0;k<4;k++){c.beginPath();c.arc(Math.cos(k*1.7+p.a)*p.r*.5,Math.sin(k*1.7+p.a)*p.r*.4,2.2,0,TAU);c.fill()}}c.restore();
  if(p.pk>0){c.save();c.globalAlpha=Math.min(1,p.pk);c.strokeStyle='#ffe58a';c.lineWidth=2.6;c.beginPath();c.arc(p.x,p.y,p.r+8+(1-p.pk)*10,0,TAU);c.stroke();c.restore()}}
 function pieceTick(g,p,dt,rate){p.sq*=Math.max(0,1-dt*7);p.pk=Math.max(0,p.pk-dt*1.5);if(p.flip>0){p.flip+=dt*3.4;if(p.flip>=1){p.flip=0;p.side^=1;p.sq=.22}}
  const k=p.side?'sb':'sa';p[k]+=rate*dt;if(p[k]>1.35)p[k]=1.35;const gi=p.side,was=p.gold[gi];if(!was&&p[k]>=.58&&p[k]<=.86){p.gold[gi]=1;p.pk=1;burst(g,p.x,p.y,'#ffe58a',5,'star',.5);tn(900+p.gold[0]*200,.07,'triangle',.04,1100)}}
 const pScore=p=>{const a=dScore(p.sa),b=dScore(p.sb);return .5*(a+b)/2+.5*Math.min(a,b)};
 // ═══ PUCHERO (fogón) ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
 const PC={x:430,y:270,R:112},KN={x:704,y:372,r:44},TOTAL=14;
 function jarsInput(g,type,x,y,area){if(type==='down'){const i=jarHit(x,y);if(i>=0&&!g.jar){g.jar={i,t:0,acc:0};tn(500,.05,'triangle',.04,700);return true}}
  else if(type==='up'&&g.jar){g.jar=null}return false}
 function jarTick(g,dt,inArea){const j=g.jar;if(!j)return;j.t+=dt;if(j.i>=50){const id=COC.herbsHave()[j.i-50];if(!id||!inArea(ptr.x,ptr.y)||!ptr.down)return;j.acc+=dt;if(Math.random()<dt*30)g.fx.push({x:ptr.x+rnd(-8,8),y:ptr.y+rnd(10,30),vx:rnd(-20,20),vy:rnd(60,140),t:0,g:200,col:'#7ab058',sz:rnd(1.6,2.8),k:'spice'});
   if(j.acc>.6){j.acc=0;const hb=g.hb||(g.hb={}),tot=Object.values(hb).reduce((a,b)=>a+b,0);if((hb[id]||0)<HUSE&&tot<HTOT&&(hb[id]||0)<have(id)){hb[id]=(hb[id]||0)+1;pop(g,ptr.x,ptr.y-30,'+'+I[id][0].split(' ').pop(),'#b8e090');tn(700,.06,'triangle',.04,900);nz(.05,.05,3000,'highpass')}else if(!j.warn){j.warn=1;pop(g,ptr.x,ptr.y-30,'Ya no cabe más','#e8cf94')}}return}if(inArea(ptr.x,ptr.y)&&ptr.down){j.acc+=dt;const k=jv()[j.i];if(Math.random()<dt*34)g.fx.push({x:ptr.x+rnd(-8,8),y:ptr.y+rnd(10,30),vx:rnd(-20,20),vy:rnd(60,140),t:0,g:200,col:COC.FL[k][1],sz:rnd(1.4,2.6),k:'spice'});
   if(j.acc>.25){j.acc=0;g.sp[k]=Math.min(2.2,g.sp[k]+.12);nz(.05,.05,3500,'highpass')}}}
 const PUCHERO={
  init(g){g.k={F:.22,T:.08,clock:0,inB:0,stk:.2,okS:0,burn:0,foam:0,stirAcc:0,stirV:0,sa:null,drag:null,all:false,done:false,scorch:0,sizz:0,bub:[],steam:[],pcs:[]};trayLayout(g)},
  down(g,x,y){const k=g.k;if(jarsInput(g,'down',x,y))return;const ch=trayHit(g,x,y);if(ch){toss(g,ch,PC.x+rnd(-50,50),PC.y+rnd(-30,30)+4,c=>{k.pcs.push({cut:c.cut,id:c.id,x:c.x,y:c.y,a:c.a,col:gx().icol(c.id),r:15});g.potCol=g.potCol?mixc(g.potCol,gx().icol(c.id),.4):mixc([150,130,90],gx().icol(c.id),.5);k.wob=.6;burst(g,c.x,c.y,gx().icol(c.id),8,'drop');nz(.18,.1,500,'lowpass');tn(180,.1,'sine',.05,90);if(k.pcs.length===g.chunks.length)k.all=true});return}
   if(Math.hypot(x-KN.x,y-KN.y)<KN.r+18)k.drag={y0:y,F0:k.F};else if(Math.hypot(x-PC.x,y-PC.y)<PC.R+14)k.sa=Math.atan2(y-PC.y,x-PC.x)},
  move(g,x,y){const k=g.k;if(!ptr.down)return;if(k.drag){k.F=clamp(k.drag.F0+(k.drag.y0-y)/170,0,1);if(Math.abs(k.F-(k.lastTick||0))>.05){k.lastTick=k.F;tn(260+k.F*500,.03,'square',.03)}return}
   if(Math.hypot(x-PC.x,y-PC.y)<PC.R+26){if(k.sa==null)k.sa=Math.atan2(y-PC.y,x-PC.x);const a=Math.atan2(y-PC.y,x-PC.x);let d=a-k.sa;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;k.stirAcc+=Math.abs(d);k.sa=a}},
  up(g){jarsInput(g,'up');g.k.drag=null;g.k.sa=null},
  tick(g,dt){const k=g.k;if(!k)return;flyTick(g,dt);k.wob=(k.wob||0)*Math.max(0,1-dt*5);jarTick(g,dt,(x,y)=>Math.hypot(x-PC.x,y-PC.y)<PC.R);
   k.T+=(k.F-k.T)*Math.min(1,dt*1.1);k.stirV+=(k.stirAcc/Math.max(dt,.001)-k.stirV)*Math.min(1,dt*6);k.stirAcc=0;k.orb=(k.orb||0)+dt*(.15+Math.min(k.stirV,6)*.1);
   if(k.all&&!k.done){k.clock+=dt;const lo=.42-.002*L('co'),hi=.7+.002*L('co');if(k.T>=lo&&k.T<=hi)k.inB+=dt;if(k.T>.84){k.foam=Math.min(1.2,k.foam+(k.T-.84)*dt*2.2);if(k.foam>=1)k.burn+=dt*1.6}else k.foam=Math.max(0,k.foam-dt*.6);
    k.stk=clamp(k.stk+(k.stirV>2?-.35:k.stirV>.8?-.12:.11)*dt,0,1);if(k.stk<.6)k.okS+=dt;if(k.stk>=1)k.burn+=dt*1.5;k.scorch=Math.max(k.scorch,k.stk>.7?k.stk:0);
    if(k.clock>=TOTAL){k.done=true;const heat=clamp(k.inB/TOTAL,0,1),stir=clamp(k.okS/TOTAL,0,1);COC.cookDone({cook:clamp(heat*.67+stir*.33,0,1),burnt:k.burn>2.5,heat,stir})}}
   if(Math.random()<dt*(k.T>.22?(k.T-.2)*(k.T>.8?55:26):0))k.bub.push({x:PC.x+rnd(-80,80),y:PC.y+rnd(-70,70),r:k.T>.8?rnd(5,10):rnd(2,5),t:0});k.bub.forEach(b=>b.t+=dt*(k.T>.8?2.2:1.4));k.bub=k.bub.filter(b=>b.t<1);
   if(Math.random()<dt*(3+k.T*18))k.steam.push({x:PC.x+rnd(-70,70),y:PC.y+rnd(-70,40),vy:-rnd(25,55),vx:rnd(-8,8),a:.4,r:rnd(9,16),t:0});k.steam.forEach(s=>{s.t+=dt;s.y+=s.vy*dt;s.x+=s.vx*dt;s.r+=dt*12;s.a=.4*(1-s.t/1.9)});k.steam=k.steam.filter(s=>s.t<1.9);
   k.sizz-=dt;if(k.sizz<=0&&k.T>.3){k.sizz=.16;nz(.1,.015+k.T*.04,3200+k.T*2200,'highpass')}},
  draw(c,g){const k=g.k,T=g.t,F=k.T,f=gx(),w=k.wob||0;
   // llamas alrededor de la olla
   for(let i=0;i<30;i++){const a=i*TAU/30,fl=F>.04?(8+F*34+Math.sin(T*11+i*2.3)*5*F):0;if(fl<=0)break;const x0=PC.x+Math.cos(a)*(PC.R+8),y0=PC.y+Math.sin(a)*(PC.R+8),x1=PC.x+Math.cos(a)*(PC.R+8+fl),y1=PC.y+Math.sin(a)*(PC.R+8+fl);const g2=c.createLinearGradient(x0,y0,x1,y1);g2.addColorStop(0,'rgba(80,140,255,.85)');g2.addColorStop(.35,'rgba(255,190,70,.95)');g2.addColorStop(1,'rgba(255,90,30,0)');c.strokeStyle=g2;c.lineWidth=10;c.lineCap='round';c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke()}
   const gl=c.createRadialGradient(PC.x,PC.y,PC.R*.6,PC.x,PC.y,PC.R*2.3);gl.addColorStop(0,'rgba(255,150,60,'+(.05+F*.28)+')');gl.addColorStop(1,'rgba(255,150,60,0)');c.fillStyle=gl;c.fillRect(0,0,WW,HH);
   c.save();c.translate(PC.x,PC.y);c.scale(1+Math.sin(T*24)*.01*w,1+Math.sin(T*24)*.01*w);shadow(c,6,10,PC.R+8,PC.R-4,.4);
   // asas + borde de la olla (vista cenital)
   [-1,1].forEach(s=>{c.fillStyle='#26211d';rr(c,s*(PC.R-4)-(s<0?30:0),-12,34,24,8);c.fill();c.strokeStyle=OL;c.lineWidth=2.4;c.stroke();c.fillStyle='#6a645a';c.beginPath();c.arc(s*(PC.R+22),0,5,0,TAU);c.fill();c.stroke()});
   const rg=c.createRadialGradient(-20,-24,30,0,0,PC.R);rg.addColorStop(0,'#8a847a');rg.addColorStop(.5,'#58524a');rg.addColorStop(1,'#2e2a26');c.fillStyle=rg;c.beginPath();c.arc(0,0,PC.R,0,TAU);c.fill();c.strokeStyle=OL;c.lineWidth=3;c.stroke();c.strokeStyle='rgba(255,255,255,.3)';c.lineWidth=3;c.beginPath();c.arc(0,0,PC.R-5,Math.PI*1.1,Math.PI*1.55);c.stroke();
   c.fillStyle='#1c1814';c.beginPath();c.arc(0,0,PC.R-16,0,TAU);c.fill();
   // caldo (agua de Alquimia, vista cenital)
   const col=g.potCol||[120,110,100];waterTop(c,0,0,PC.R-20,col,F,Math.min(1.4,k.stirV*.12+w*.4),k.stirV,T);
   c.save();c.beginPath();c.arc(0,0,PC.R-20,0,TAU);c.clip();k.pcs.forEach((p,i)=>{const a=(k.orb||0)+i*(TAU/Math.max(3,k.pcs.length)),rr2=26+((i*37)%34),x=Math.cos(a)*rr2+Math.sin(T*1.3+i)*2.5,y=Math.sin(a)*rr2*.9+Math.sin(T*1.7+i*2)*2,pc=Object.assign({},p,{a:(p.a||0)+(k.orb||0)*.6});c.save();c.translate(x,y);c.scale(.95,.95);c.globalAlpha=.95;drawCh(c,pc,null,.25+k.T*.5);c.globalAlpha=.3;c.fillStyle='rgb('+col.map(v=>Math.round(v)).join(',')+')';c.beginPath();c.arc(0,0,13,0,TAU);c.fill();c.restore()});   /* los trozos flotan a media agua: el ángulo ORBITAL se integra en tick (antes dependía de T·velocidad y saltaba al cambiar el remolino), escala menor y velo del color del caldo */
   k.bub.forEach(b=>{const u=b.t;c.strokeStyle='rgba(255,255,255,'+(.7*(1-u))+')';c.fillStyle='rgba(255,255,255,'+(.18*(1-u))+')';c.lineWidth=1.5;c.beginPath();c.arc(b.x-PC.x,b.y-PC.y,b.r*(.5+u),0,TAU);c.fill();c.stroke()});
   if(k.foam>0){c.fillStyle='rgba(255,252,240,'+Math.min(.9,k.foam)+')';for(let i=0;i<46;i++){const a=i*2.399,rr3=(PC.R-24)*(.55+k.foam*.4)*(.6+((i*7)%10)/25);c.beginPath();c.arc(Math.cos(a)*rr3*.9,Math.sin(a)*rr3*.9,4+((i*5)%6),0,TAU);c.fill()}}
   if(k.scorch>0){c.strokeStyle='rgba(30,18,10,'+Math.min(.8,k.scorch*.8)+')';c.lineWidth=10;c.beginPath();c.arc(0,0,PC.R-26,.4,.4+k.scorch*3.4);c.stroke()}c.restore();
   // reloj de cocción: arco dorado por fuera del borde
   if(k.all){c.strokeStyle='rgba(16,12,8,.6)';c.lineWidth=7;c.beginPath();c.arc(0,0,PC.R+30,-Math.PI/2,-Math.PI/2+TAU);c.stroke();c.strokeStyle=(F>.84)?'#ff7a3a':(F>=.42&&F<=.7)?'#bfe880':'#ffd070';c.lineWidth=5;c.lineCap='round';c.beginPath();c.arc(0,0,PC.R+30,-Math.PI/2,-Math.PI/2+TAU*(k.clock/TOTAL));c.stroke()}
   c.restore();
   if(ptr.down&&k.sa!=null){c.save();c.translate(ptr.x,ptr.y);c.rotate(-.5);shadow(c,10,34,10,40,.3);c.fillStyle='#9a6a38';rr(c,-5,-60,10,70,4);c.fill();c.strokeStyle=OL;c.lineWidth=2.2;c.stroke();c.fillStyle='#b88048';c.beginPath();c.ellipse(0,12,17,10,0,0,TAU);c.fill();c.stroke();c.restore()}
   k.steam.forEach(s=>{c.fillStyle='rgba(240,240,245,'+Math.max(0,s.a)+')';c.beginPath();c.arc(s.x,s.y,s.r,0,TAU);c.fill()});
   knob(c,KN.x,KN.y,KN.r,k.F,[.42,.7],'LEÑA',g);drawTray(c,g);flyDraw(c,g);jarsDraw(c,g);herbsDraw(c,g);radar(c,g,92,136,50);
   if(!k.all){c.fillStyle='#fff2d0';c.font='13px Cinzel,serif';c.textAlign='center';c.lineWidth=4;c.strokeStyle=OL;const tx='Echa cada ingrediente al puchero con LMB ('+k.pcs.length+'/'+g.chunks.length+')';c.strokeText(tx,430,438);c.fillText(tx,430,438)}}};
 // agua de Alquimia vista desde arriba (círculo): ondas, brillos, remolino al remover y hervor
 function waterTop(c,cx,cy,R,col,heat,sa,sv,t){const N=54,amp=.012+.02*sa+.016*heat,f=gx();c.save();c.translate(cx,cy);const pth=()=>{c.beginPath();for(let i=0;i<=N;i++){const a=i/N*TAU,w=1+amp*Math.sin(a*5+t*2.2)+amp*.7*Math.sin(a*3-t*1.7);const px=Math.cos(a)*R*w,py=Math.sin(a)*R*w;i?c.lineTo(px,py):c.moveTo(px,py)}c.closePath()};
  pth();const rg=c.createRadialGradient(-R*.25,-R*.3,2,0,0,R);rg.addColorStop(0,f.css(f.lerpc(col,[255,255,255],.3)));rg.addColorStop(.6,f.css(col));rg.addColorStop(1,f.css(f.lerpc(col,[0,0,0],.45)));c.fillStyle=rg;c.fill();
  c.save();pth();c.clip();c.fillStyle='rgba(255,246,220,.35)';c.beginPath();c.ellipse(-R*.3,-R*.45,R*.4,R*.12,-.4,0,TAU);c.fill();for(let k=0;k<7;k++){const a=t*.55+k*1.7,u=Math.sin(a)*.5+.5;c.fillStyle='rgba(255,255,255,'+(.08+.2*u)+')';c.beginPath();c.ellipse(Math.cos(a*.7+k)*R*.6,Math.sin(a*.9+k*2)*R*.6,R*.05+u*3,R*.03+u,a,0,TAU);c.fill()}
  const vo=clamp(sv/5,0,1);if(vo>.05){const vg=c.createRadialGradient(0,0,2,0,0,R*.6);vg.addColorStop(0,'rgba(10,6,3,'+(.4*vo)+')');vg.addColorStop(1,'rgba(10,6,3,0)');c.fillStyle=vg;c.beginPath();c.arc(0,0,R,0,TAU);c.fill();for(let k=0;k<4;k++){const r=.25+k*.18,sw=t*2.4*(1.35-r)+k;c.strokeStyle='rgba(255,255,255,'+(.1+.3*vo)+')';c.lineWidth=1.8;c.beginPath();c.arc(0,0,R*r,sw,sw+1.6+vo);c.stroke()}}
  if(heat>.4){c.fillStyle='rgba(255,255,255,'+(.14+.32*(heat-.4))+')';for(let k=0;k<34;k++){const a=k/34*TAU+t*.1,rr3=.92+.05*Math.sin(k*3+t*2);c.beginPath();c.arc(Math.cos(a)*R*rr3,Math.sin(a)*R*rr3,1.2+((k*7)%3)*.7,0,TAU);c.fill()}}c.restore();pth();c.strokeStyle='rgba(255,255,255,.3)';c.lineWidth=1.5;c.stroke();c.restore()}
 // ═══ SARTÉN ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
 //  superficie que se fríe: los trozos se hacen por sus DOS caras; remueve con la espátula (voltea y reparte), echa especias y sirve cuando estén en su punto.
 const PN={x:410,y:272,R:130},SERVE={x:700,y:150,w:110,h:34},SERVEG={x:676,y:104,w:110,h:34},onBtn=(B,x,y)=>Math.abs(x-B.x)<B.w/2+6&&Math.abs(y-B.y)<B.h/2+6;   /* SERVEG: el SERVIR de la parrilla va FUERA de la rejilla (antes pulsar un trozo de la esquina servía el plato crudo) */
 const SARTEN={
  init(g){g.k={F:.32,pcs:[],all:false,t:0,done:false,drag:null,spat:{x:PN.x,y:PN.y,vx:0,vy:0,on:false},flips:0,sizz:0,smoke:[],oil:[]};trayLayout(g)},
  down(g,x,y){const k=g.k;if(onBtn(SERVE,x,y)&&k.all){serve(g);return}if(jarsInput(g,'down',x,y))return;const ch=trayHit(g,x,y);if(ch){const a=rnd(0,TAU),d=rnd(20,PN.R-40);toss(g,ch,PN.x+Math.cos(a)*d,PN.y+Math.sin(a)*d,c=>{k.pcs.push(mkPiece(c,c.x,c.y));k.pcs[k.pcs.length-1].sq=.25;burst(g,c.x,c.y,'#ffe08a',7,'drop');nz(.25,.14,3500,'highpass');tn(160,.08,'sine',.05,80);if(k.pcs.length===g.chunks.length)k.all=true});return}
   if(Math.hypot(x-KN.x,y-KN.y)<KN.r+18)k.drag={y0:y,F0:k.F};else if(Math.hypot(x-PN.x,y-PN.y)<PN.R+22){k.spat.on=true;k.spat.x=x;k.spat.y=y}},
  move(g,x,y){const k=g.k;if(!ptr.down)return;if(k.drag){k.F=clamp(k.drag.F0+(k.drag.y0-y)/170,0,1);return}if(k.spat.on){const s=k.spat;s.vx=(x-s.x)/Math.max(.008,ptr.dt/1000);s.vy=(y-s.y)/Math.max(.008,ptr.dt/1000);s.x=x;s.y=y}},
  up(g){jarsInput(g,'up');g.k.drag=null;g.k.spat.on=false},
  tick(g,dt){const k=g.k;if(!k)return;flyTick(g,dt);cookFx(g,dt,k.pcs,k.F!=null?k.F:(k.T||.5));jarTick(g,dt,(x,y)=>Math.hypot(x-PN.x,y-PN.y)<PN.R);
   if(k.all&&!k.done)k.t+=dt;
   const sp=k.spat,spd=Math.hypot(sp.vx,sp.vy);sp.vx*=Math.max(0,1-dt*9);sp.vy*=Math.max(0,1-dt*9);
   k.pcs.forEach((p,i)=>{const dd=Math.hypot(p.x-PN.x,p.y-PN.y),zone=clamp(1.15-dd/PN.R*.6,.45,1.1),rate=k.F*.12*zone;pieceTick(g,p,dt,rate);
    if(sp.on){const dx=p.x-sp.x,dy=p.y-sp.y,d=Math.hypot(dx,dy);if(d<p.r+30){const push=(p.r+30-d)/(p.r+30);p.vx+=dx/(d||1)*push*260*dt*3+sp.vx*.03*push;p.vy+=dy/(d||1)*push*260*dt*3+sp.vy*.03*push;if(spd>240&&p.flip===0&&d<p.r+16){p.flip=.001;k.flips++;p.sq=.2;tn(380+rnd(0,160),.05,'triangle',.04,500);nz(.06,.08,2500,'bandpass')}}}
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.max(0,1-dt*6);p.vy*=Math.max(0,1-dt*6);const dx=p.x-PN.x,dy=p.y-PN.y,d=Math.hypot(dx,dy),lim=PN.R-p.r-4;if(d>lim){p.x=PN.x+dx/d*lim;p.y=PN.y+dy/d*lim;p.vx*=-.3;p.vy*=-.3}
    for(let j=i+1;j<k.pcs.length;j++){const q=k.pcs[j],ex=q.x-p.x,ey=q.y-p.y,e=Math.hypot(ex,ey),md=p.r+q.r-4;if(e<md&&e>.1){const o=(md-e)/2;p.x-=ex/e*o;p.y-=ey/e*o;q.x+=ex/e*o;q.y+=ey/e*o}}
    if(Math.max(p.sa,p.sb)>1&&Math.random()<dt*3)k.smoke.push({x:p.x,y:p.y,vy:-rnd(20,40),vx:rnd(-6,6),a:.4,r:rnd(5,9),t:0})});
   if(Math.random()<dt*k.F*(k.pcs.length?24:6))k.oil.push({x:PN.x+rnd(-PN.R+16,PN.R-16),y:PN.y+rnd(-PN.R+16,PN.R-16),r:rnd(1.5,3.5),t:0});k.oil.forEach(o=>o.t+=dt*3);k.oil=k.oil.filter(o=>o.t<1);
   k.smoke.forEach(s=>{s.t+=dt;s.y+=s.vy*dt;s.x+=s.vx*dt;s.r+=dt*8;s.a=.4*(1-s.t/1.6)});k.smoke=k.smoke.filter(s=>s.t<1.6);
   k.sizz-=dt;if(k.sizz<=0&&k.pcs.length&&k.F>.1){k.sizz=.1;nz(.09,.02+k.F*.05,3800+k.F*2000,'highpass')}
   if(k.all&&!k.done&&k.t>55)serve(g)}};
 function serve(g){const k=g.k;if(k.done)return;k.done=true;const sc=k.pcs.map(pScore),mean=sc.reduce((a,b)=>a+b,0)/Math.max(1,sc.length),burnt=k.pcs.every(p=>Math.max(p.sa,p.sb)>1.1);
  k.pcs.forEach(p=>{if(pScore(p)>.9){burst(g,p.x,p.y,'#ffe58a',6,'star',.7)}});if(mean>.85)perfect(g,PN.x,PN.y-70,'¡En su punto!');COC.cookDone({cook:mean,burnt,flips:k.flips})}
 SARTEN.draw=function(c,g){const k=g.k,T=g.t,F=k.F;
  for(let i=0;i<22;i++){const a=i*TAU/22+.1,fl=F>.04?5+F*22+Math.sin(T*12+i*2)*4*F:0;if(fl<=0)break;const x0=PN.x+Math.cos(a)*(PN.R+4),y0=PN.y+Math.sin(a)*(PN.R+4);c.strokeStyle='rgba(255,170,60,.75)';c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(x0,y0);c.lineTo(PN.x+Math.cos(a)*(PN.R+4+fl),PN.y+Math.sin(a)*(PN.R+4+fl));c.stroke()}
  const gl=c.createRadialGradient(PN.x,PN.y,PN.R*.5,PN.x,PN.y,PN.R*2.2);gl.addColorStop(0,'rgba(255,150,60,'+(.04+F*.22)+')');gl.addColorStop(1,'rgba(255,150,60,0)');c.fillStyle=gl;c.fillRect(0,0,WW,HH);
  // sartén de hierro con mango
  shadow(c,PN.x+8,PN.y+14,PN.R+6,PN.R-2,.4);c.save();c.translate(PN.x,PN.y);c.fillStyle='#26211d';c.beginPath();c.moveTo(PN.R-8,-16);c.lineTo(PN.R+150,-12);c.quadraticCurveTo(PN.R+164,0,PN.R+150,12);c.lineTo(PN.R-8,16);c.closePath();c.fill();c.strokeStyle=OL;c.lineWidth=3;c.stroke();c.fillStyle='#6a4a2a';rr(c,PN.R+70,-13,86,26,10);c.fill();c.stroke();c.fillStyle='rgba(255,255,255,.18)';c.fillRect(PN.R+78,-9,70,4);
  const pg=c.createRadialGradient(-30,-34,10,0,0,PN.R);pg.addColorStop(0,'#5a544c');pg.addColorStop(.6,'#38332e');pg.addColorStop(1,'#1e1b18');c.fillStyle=pg;c.beginPath();c.arc(0,0,PN.R,0,TAU);c.fill();c.strokeStyle=OL;c.lineWidth=3.2;c.stroke();c.strokeStyle='rgba(255,255,255,.25)';c.lineWidth=3;c.beginPath();c.arc(0,0,PN.R-5,Math.PI*1.08,Math.PI*1.5);c.stroke();
  c.fillStyle='#15120f';c.beginPath();c.arc(0,0,PN.R-14,0,TAU);c.fill();const og=c.createRadialGradient(-20,-20,5,0,0,PN.R-14);og.addColorStop(0,'rgba(240,200,100,.22)');og.addColorStop(1,'rgba(240,200,100,.04)');c.fillStyle=og;c.beginPath();c.arc(0,0,PN.R-14,0,TAU);c.fill();   // película de aceite
  k.oil.forEach(o=>{c.strokeStyle='rgba(255,230,160,'+(.6*(1-o.t))+')';c.lineWidth=1.4;c.beginPath();c.arc(o.x-PN.x,o.y-PN.y,o.r*(.6+o.t),0,TAU);c.stroke()});c.restore();
  k.pcs.forEach(p=>pieceDraw(c,p,T));k.smoke.forEach(s=>{c.fillStyle='rgba(60,56,52,'+Math.max(0,s.a)+')';c.beginPath();c.arc(s.x,s.y,s.r,0,TAU);c.fill()});
  const sp=k.spat;if(sp.on&&ptr.down){c.save();c.translate(sp.x,sp.y);c.rotate(Math.atan2(sp.vy,sp.vx)*.3-.3);shadow(c,8,40,14,34,.3);c.fillStyle='#8a6a40';rr(c,-6,-8,12,96,5);c.fill();c.strokeStyle=OL;c.lineWidth=2.2;c.stroke();c.fillStyle='#c8c4bc';c.beginPath();c.roundRect(-20,-48,40,44,6);c.fill();c.stroke();c.fillStyle='rgba(255,255,255,.5)';c.fillRect(-16,-44,6,36);c.restore()}
  knob(c,KN.x,KN.y,KN.r,k.F,null,'LEÑA',g);drawTray(c,g);flyDraw(c,g);jarsDraw(c,g);herbsDraw(c,g);radar(c,g,92,136,50);
  if(k.all)pill(c,SERVE.x,SERVE.y,SERVE.w,SERVE.h,'SERVIR',true,T);
  c.fillStyle='#fff2d0';c.font='13px Cinzel,serif';c.textAlign='center';c.lineWidth=4;c.strokeStyle=OL;const tx=!k.all?'Echa cada ingrediente a la sartén con LMB ('+k.pcs.length+'/'+g.chunks.length+')':'Remueve con la espátula (arrastra) · echa especias · sirve cuando estén doradas por las dos caras';c.strokeText(tx,420,444);c.fillText(tx,420,444)};
 // ═══ PARRILLA (hoguera) ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
 //  tres zonas de calor (fuerte · media · suave): arrastra las piezas entre ellas y voltéalas con LMB para que se hagan por las dos caras sin quemarse.
 const GR={x0:190,y0:130,x1:738,y1:392},ZH=[.17,.09,.04],zoneOf=x=>x<GR.x0+(GR.x1-GR.x0)/3?0:x<GR.x0+(GR.x1-GR.x0)*2/3?1:2;
 const PARRILLA={
  init(g){g.k={pcs:[],all:false,t:0,done:false,drag:null,hold:null,sizz:0,smoke:[],emb:[]};trayLayout(g)},
  down(g,x,y){const k=g.k;if(onBtn(SERVEG,x,y)&&k.all){serveP(g);return}if(jarsInput(g,'down',x,y))return;const ch=trayHit(g,x,y);if(ch){const n=k.pcs.length+g.chunks.filter(c=>c.s==='fly').length,tx=GR.x1-70-Math.floor(n/3)*64+rnd(-6,6),ty=GR.y0+52+(n%3)*80+rnd(-6,6);toss(g,ch,tx,ty,c=>{k.pcs.push(mkPiece(c,c.x,c.y));k.pcs[k.pcs.length-1].sq=.25;burst(g,c.x,c.y,'#ff9a3a',6,'drop');nz(.2,.1,3000,'highpass');if(k.pcs.length===g.chunks.length)k.all=true});return}
   const p=k.pcs.slice().reverse().find(p=>Math.hypot(p.x-x,p.y-y)<p.r+10);if(p){k.hold={p,x0:x,y0:y,moved:0};p.sq=.15}},
  move(g,x,y){const h=g.k.hold;if(!h||!ptr.down)return;h.moved+=Math.hypot(x-ptr.px,y-ptr.py);if(h.moved>7){h.p.x=clamp(x,GR.x0+h.p.r,GR.x1-h.p.r);h.p.y=clamp(y,GR.y0+h.p.r,GR.y1-h.p.r)}},
  up(g){const k=g.k;jarsInput(g,'up');const h=k.hold;if(h){if(h.moved<=7&&h.p.flip===0){h.p.flip=.001;h.p.sq=.2;tn(400,.05,'triangle',.04,520)}else{h.p.sq=.2;tn(220,.04,'sine',.04)}}k.hold=null},
  tick(g,dt){const k=g.k;if(!k)return;flyTick(g,dt);cookFx(g,dt,k.pcs,k.F!=null?k.F:(k.T||.5));jarTick(g,dt,(x,y)=>x>GR.x0&&x<GR.x1&&y>GR.y0&&y<GR.y1);if(k.all&&!k.done)k.t+=dt;
   k.pcs.forEach(p=>{const rate=ZH[zoneOf(p.x)]*(k.hold&&k.hold.p===p&&k.hold.moved>7?.4:1);pieceTick(g,p,dt,rate*(.8+.2*Math.sin(g.t*3+p.x)));if(Math.max(p.sa,p.sb)>1&&Math.random()<dt*4)k.smoke.push({x:p.x,y:p.y,vy:-rnd(25,45),vx:rnd(-8,8),a:.45,r:rnd(5,9),t:0});if(Math.random()<dt*3)k.emb.push({x:p.x+rnd(-10,10),y:p.y+rnd(-6,6),vy:-rnd(30,70),vx:rnd(-12,12),t:0})});
   k.pcs.forEach((p,i)=>{for(let j=i+1;j<k.pcs.length;j++){const q=k.pcs[j],ex=q.x-p.x,ey=q.y-p.y,e=Math.hypot(ex,ey),md=p.r+q.r-6;if(e<md&&e>.1){const o=(md-e)/2*Math.min(1,dt*12),hp=k.hold&&k.hold.p===p,hq=k.hold&&k.hold.p===q;if(!hp){p.x-=ex/e*o*(hq?2:1);p.y-=ey/e*o*(hq?2:1)}if(!hq){q.x+=ex/e*o*(hp?2:1);q.y+=ey/e*o*(hp?2:1)}}}p.x=clamp(p.x,GR.x0+p.r,GR.x1-p.r);p.y=clamp(p.y,GR.y0+p.r,GR.y1-p.r)});   /* las piezas no se apilan (caen en huecos separados de la zona suave y se empujan con suavidad; la que arrastras no se mueve) */
   k.smoke.forEach(s=>{s.t+=dt;s.y+=s.vy*dt;s.x+=s.vx*dt;s.r+=dt*9;s.a=.45*(1-s.t/1.7)});k.smoke=k.smoke.filter(s=>s.t<1.7);k.emb.forEach(e=>{e.t+=dt*1.2;e.x+=e.vx*dt;e.y+=e.vy*dt});k.emb=k.emb.filter(e=>e.t<1);
   if(Math.random()<dt*5)k.emb.push({x:rnd(GR.x0,GR.x1),y:rnd(GR.y0+20,GR.y1),vy:-rnd(20,60),vx:rnd(-10,10),t:0});
   k.sizz-=dt;if(k.sizz<=0&&k.pcs.length){k.sizz=.12;nz(.1,.03,3000,'highpass')}if(k.all&&!k.done&&k.t>60)serveP(g)}};
 function serveP(g){const k=g.k;if(k.done)return;k.done=true;const sc=k.pcs.map(pScore),mean=sc.reduce((a,b)=>a+b,0)/Math.max(1,sc.length),burnt=k.pcs.every(p=>Math.max(p.sa,p.sb)>1.1);if(mean>.85)perfect(g,430,170,'¡En su punto!');COC.cookDone({cook:mean,burnt})}
 PARRILLA.draw=function(c,g){const k=g.k,T=g.t,w=(GR.x1-GR.x0)/3;
  [0,1,2].forEach(z=>{const h=ZH[z]/.2,g2=c.createLinearGradient(GR.x0+z*w,0,GR.x0+(z+1)*w,0);const a=.18+h*.5+Math.sin(T*3+z)*.05*h;g2.addColorStop(0,'rgba(255,120,30,'+a+')');g2.addColorStop(1,'rgba(255,170,60,'+a*.7+')');c.fillStyle=g2;c.fillRect(GR.x0+z*w+2,GR.y0,w-4,GR.y1-GR.y0);
   for(let i=0;i<10;i++){c.fillStyle='rgba(255,'+(130+i*8)+',60,'+(.2+h*.5)*(.5+.5*Math.sin(T*4+i*2+z))+')';c.beginPath();c.ellipse(GR.x0+z*w+14+((i*53)%(w-28)),GR.y0+14+((i*97)%(GR.y1-GR.y0-28)),8+((i*3)%7),5,0,0,TAU);c.fill()}});
  k.emb.forEach(e=>{c.globalAlpha=1-e.t;c.fillStyle='#ffb040';c.beginPath();c.arc(e.x,e.y,1.8,0,TAU);c.fill();c.globalAlpha=1});
  // rejilla
  c.strokeStyle='rgba(20,16,12,.55)';c.lineWidth=7;c.lineCap='round';for(let y=GR.y0+14;y<GR.y1;y+=26){c.beginPath();c.moveTo(GR.x0,y);c.lineTo(GR.x1,y);c.stroke()}c.strokeStyle='rgba(120,114,104,.8)';c.lineWidth=3;for(let y=GR.y0+14;y<GR.y1;y+=26){c.beginPath();c.moveTo(GR.x0,y-1);c.lineTo(GR.x1,y-1);c.stroke()}
  ['FUERTE','MEDIA','SUAVE'].forEach((n,z)=>{c.fillStyle='rgba(255,240,200,.55)';c.font='11px Cinzel,serif';c.textAlign='center';c.lineWidth=3;c.strokeStyle=OL;c.strokeText(n,GR.x0+z*w+w/2,GR.y1+16);c.fillText(n,GR.x0+z*w+w/2,GR.y1+16)});
  k.pcs.forEach(p=>pieceDraw(c,p,T));k.smoke.forEach(s=>{c.fillStyle='rgba(60,56,52,'+Math.max(0,s.a)+')';c.beginPath();c.arc(s.x,s.y,s.r,0,TAU);c.fill()});
  drawTray(c,g);flyDraw(c,g);jarsDraw(c,g);herbsDraw(c,g);radar(c,g,92,136,50);if(k.all)pill(c,SERVEG.x,SERVEG.y,SERVEG.w,SERVEG.h,'SERVIR',true,T);
  c.fillStyle='#fff2d0';c.font='13px Cinzel,serif';c.textAlign='center';c.lineWidth=4;c.strokeStyle=OL;const tx=!k.all?'Echa cada ingrediente a la parrilla con LMB ('+k.pcs.length+'/'+g.chunks.length+')':'Arrastra las piezas entre zonas · LMB = voltear · sirve cuando estén doradas por las dos caras';c.strokeText(tx,440,444);c.fillText(tx,440,444)};
 // ═══ HORNO ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
 //  carga la bandeja, regula la temperatura al punto ideal y abre la puerta cuando el reloj de cocción esté en la ventana dorada.
 const HD={x:722,y:226,r:46},DOOR={x:196,y:76,w:448,h:262},WIN={x:226,y:106,w:388,h:200};
 const HORNO={
  init(g){const ideal=clamp(.4+.05*g.M.ti,.4,.7);g.k={F:.2,ideal,ph:'load',pcs:[],all:false,b:0,tOK:0,tn:0,done:false,drag:null,open:0,door:0,steam:[],heatT:0,fl:[]};trayLayout(g)},
  down(g,x,y){const k=g.k;if(jarsInput(g,'down',x,y))return;const ch=k.ph==='load'?trayHit(g,x,y):null;if(ch){const n=k.pcs.length+g.chunks.filter(c=>c.s==='fly').length,tx=WIN.x+80+(n%3)*115,ty=WIN.y+WIN.h-86-Math.floor(n/3)*46;toss(g,ch,tx,ty,c=>{k.pcs.push(Object.assign(mkPiece(c,c.x,c.y),{bx:c.x,by:c.y}));burst(g,c.x,c.y,'#ffd88a',5,'drop');tn(240,.08,'sine',.05,120);if(k.pcs.length===g.chunks.length){k.all=true;k.ph='set'}});return}
   if(k.ph==='set'&&Math.hypot(x-HD.x,y-HD.y)<HD.r+18)k.drag={y0:y,F0:k.F};
   if(k.ph==='set'&&k.all&&Math.hypot(x-HD.x,y-(HD.y+112))<48)startBake(g);
   else if(k.ph==='bake'&&x>DOOR.x&&x<DOOR.x+DOOR.w&&y>DOOR.y&&y<DOOR.y+DOOR.h)openDoor(g)},
  move(g,x,y){const k=g.k;if(!ptr.down||!k.drag)return;k.F=clamp(k.drag.F0+(k.drag.y0-y)/170,0,1)},
  up(g){jarsInput(g,'up');g.k.drag=null},
  tick(g,dt){const k=g.k;if(!k)return;flyTick(g,dt);cookFx(g,dt,k.pcs,k.F!=null?k.F:(k.T||.5));jarTick(g,dt,(x,y)=>x>WIN.x&&x<WIN.x+WIN.w&&y>WIN.y&&y<WIN.y+WIN.h);k.heatT+=(k.F-k.heatT)*Math.min(1,dt*1.5);
   if(k.ph==='bake'){const off=Math.abs(k.F-k.ideal);k.tn+=dt;k.tOK+=dt*clamp(1-off*3.2,0,1);k.b+=dt*(.075+.05*clamp(1-off*2.5,0,1)*(k.heatT>.2?1:0));if(k.b>1.28)openDoor(g,true)}
   k.pcs.forEach(p=>{p.sq*=Math.max(0,1-dt*7);const d=k.b*.82;p.sa=p.sb=d;p.puff=1+Math.min(.28,k.b*.3)});
   if(Math.random()<dt*(k.ph==='bake'?5:0))k.steam.push({x:rnd(WIN.x+30,WIN.x+WIN.w-30),y:WIN.y+WIN.h-20,vy:-rnd(14,30),a:.25,r:rnd(8,14),t:0});k.steam.forEach(s=>{s.t+=dt;s.y+=s.vy*dt;s.a=.25*(1-s.t/2)});k.steam=k.steam.filter(s=>s.t<2);
   if(k.door!==k.open){k.door+=(k.open-k.door)*Math.min(1,dt*7)}}};
 function startBake(g){const k=g.k;k.ph='bake';k.b=.02;tn(320,.12,'triangle',.06,600);nz(.2,.1,800,'lowpass')}
 function openDoor(g,over){const k=g.k;if(k.done||k.ph!=='bake')return;k.done=true;k.ph='done';k.open=1;const b=k.b;let w;if(over)w=Math.max(0,.3-(b-1.28));else if(b>=.82&&b<=1.02)w=1;else if(b<.82)w=Math.max(0,.15+(b/.82)*.5);else w=Math.max(0,1-(b-1.02)*3.2);
  const tScore=k.tn?clamp(k.tOK/k.tn,0,1):0,cook=clamp(w*.75+tScore*.25,0,1);nz(.2,.14,1500,'bandpass');tn(560,.1,'triangle',.05,900);if(w>.92)perfect(g,420,80,'¡Al punto!');COC.cookDone({cook,burnt:b>1.18||over,b})}
 HORNO.draw=function(c,g){const k=g.k,T=g.t,hb=k.heatT;
  const WG=c.createLinearGradient(0,WIN.y,0,WIN.y+WIN.h);WG.addColorStop(0,'#2a1608');WG.addColorStop(1,'#14100c');c.fillStyle=WG;arch(c,WIN.x,WIN.y-10,WIN.w,WIN.h+10);c.fill();
  c.save();arch(c,WIN.x,WIN.y-10,WIN.w,WIN.h+10);c.clip();const gl=c.createRadialGradient(WIN.x+WIN.w/2,WIN.y+WIN.h+20,10,WIN.x+WIN.w/2,WIN.y+WIN.h,WIN.w*.7);gl.addColorStop(0,'rgba(255,150,50,'+(.12+hb*.6)+')');gl.addColorStop(1,'rgba(255,100,20,0)');c.fillStyle=gl;c.fillRect(WIN.x,WIN.y,WIN.w,WIN.h);
   c.strokeStyle='rgba(255,120,40,'+(.2+hb*.6)+')';c.lineWidth=5;c.beginPath();c.moveTo(WIN.x+30,WIN.y+WIN.h-14);c.lineTo(WIN.x+WIN.w-30,WIN.y+WIN.h-14);c.stroke();   // resistencia
   // bandeja
   c.fillStyle='#4a4640';rr(c,WIN.x+24,WIN.y+WIN.h-60,WIN.w-48,12,4);c.fill();c.strokeStyle=OL;c.lineWidth=2.2;c.stroke();c.fillStyle='rgba(255,255,255,.2)';c.fillRect(WIN.x+30,WIN.y+WIN.h-58,WIN.w-60,3);
   k.pcs.forEach(p=>{const d=p.sa;c.save();c.translate(p.x,p.y);c.scale(p.puff||1,(p.puff||1)*(1-p.sq));const col=colOf(p.col,d);const f=gx(),hd=/^h_/.test(p.id)&&f.herbD(p.id);shadow(c,3,16,p.r*1.1,5,.3);if(!FART.draw(c,p.id,{cut:p.cut,r:p.r*1.35,a:p.a,d,t:T}))f.drawChunk(c,{r:p.r*1.15,a:p.a,hp:1},f.chunkKind(p.id),col,hd?f.hex(hd[3]):null);c.restore()});
   k.steam.forEach(s=>{c.fillStyle='rgba(240,240,245,'+Math.max(0,s.a)+')';c.beginPath();c.arc(s.x,s.y,s.r,0,TAU);c.fill()});
   // ventana dorada del reloj: aro alrededor de la bandeja
   if(k.ph==='bake'||k.ph==='done'){const u=clamp(k.b/1.28,0,1),a0=-Math.PI*.5,x=WIN.x+WIN.w/2,y=WIN.y+WIN.h/2;c.strokeStyle='rgba(16,12,8,.6)';c.lineWidth=9;c.beginPath();c.arc(x,y,76,a0,a0+TAU);c.stroke();const gA=a0+TAU*(.82/1.28),gB=a0+TAU*(1.02/1.28);c.strokeStyle='rgba(255,220,120,'+(.55+.25*Math.sin(T*8))+')';c.lineWidth=11;c.beginPath();c.arc(x,y,76,gA,gB);c.stroke();c.strokeStyle=(k.b>=.82&&k.b<=1.02)?'#bfe880':k.b>1.02?'#ff7a3a':'#ffd070';c.lineWidth=5;c.lineCap='round';c.beginPath();c.arc(x,y,76,a0,a0+TAU*u);c.stroke()}c.restore();
  // cristal y puerta (se abre hacia abajo al sacar)
  if(k.door>.02){c.save();arch(c,WIN.x,WIN.y-10,WIN.w,WIN.h+10);c.clip();c.fillStyle='rgba(20,16,12,'+(.75*k.door)+')';c.fillRect(WIN.x-10,WIN.y-20,WIN.w+20,WIN.h+30);c.restore()}
  // tirador
  c.strokeStyle='#3a362f';c.lineWidth=6;c.beginPath();c.arc(WIN.x+WIN.w/2,WIN.y+WIN.h+14,16,0,TAU);c.stroke();c.strokeStyle=OL;c.lineWidth=1.6;c.beginPath();c.arc(WIN.x+WIN.w/2,WIN.y+WIN.h+14,19,0,TAU);c.stroke();
  knob(c,HD.x,HD.y,HD.r,k.F,[k.ideal-.08,k.ideal+.08],'TIRO',g);
  if(k.ph==='set'&&k.all)pill(c,HD.x,HD.y+112,120,38,'ENCENDER',true,T);
  drawTray(c,g);flyDraw(c,g);jarsDraw(c,g);herbsDraw(c,g);radar(c,g,92,136,50);
  c.fillStyle='#fff2d0';c.font='13px Cinzel,serif';c.textAlign='center';c.lineWidth=4;c.strokeStyle=OL;const tx=k.ph==='load'?'Mete cada pieza en la bandeja con LMB ('+k.pcs.length+'/'+g.chunks.length+')':k.ph==='set'?'Gira el mando hasta la franja verde y pulsa ENCENDER':k.ph==='bake'?'LMB sobre la puerta cuando el aro esté en la franja dorada':'';c.strokeText(tx,430,450);c.fillText(tx,430,450)};
 // ═══ EMPLATADO ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
 //  1) coloca las guarniciones en los círculos fantasma  2) traza el chorrito de salsa sobre la curva.  Puntúa la composición y reparte las estrellas.

 // EMPLATADO LIBRE (opcional): decoraciones DESBLOQUEADAS por nivel de Cocina (bandeja de la izquierda: solo salen las que tienes); se arrastran al plato y se sueltan DONDE QUIERAS; la salsa se traza libre sobre el plato.
 // Sin decorar vale .7 (neutro); cada pieza suma y repartirlas bien suma un poco más. El botón SERVIR sirve en cualquier momento.
 const PL={x:420,y:250,R:112},SERV2={x:690,y:408,w:132,h:34};
 const GAR=[['leaf','Hoja',0],['flor','Flor',6],['gr','Granos',12],['salsa','Salsa',18]],garOn=()=>GAR.filter(q=>L('co')>=q[2]),GTX=60,GTY=i=>150+i*74;
 const inPlate=(x,y)=>Math.hypot(x-PL.x,y-PL.y)<PL.R-14;
 function garDraw(c,kind,col,T,sc){c.save();c.scale(sc||1,sc||1);
  if(kind==='leaf'){c.rotate(-.5);c.fillStyle=rgb(col);c.beginPath();c.moveTo(0,12);c.quadraticCurveTo(-11,0,0,-14);c.quadraticCurveTo(11,0,0,12);c.fill();c.strokeStyle=OL;c.lineWidth=1.8;c.stroke();c.strokeStyle='rgba(255,255,255,.4)';c.lineWidth=1.2;c.beginPath();c.moveTo(0,10);c.lineTo(0,-10);c.stroke()}
  else if(kind==='flor'){for(let n=0;n<5;n++){c.save();c.rotate(n*TAU/5);c.fillStyle='#f0a8c0';c.beginPath();c.ellipse(0,-7,5,7,0,0,TAU);c.fill();c.strokeStyle=OL;c.lineWidth=1.4;c.stroke();c.restore()}c.fillStyle='#ffd870';c.beginPath();c.arc(0,0,3.6,0,TAU);c.fill();c.stroke()}
  else if(kind==='gr'){[[-6,2],[0,-5],[6,3],[1,6]].forEach(([x,y])=>{c.fillStyle='#e0c890';c.beginPath();c.arc(x,y,3.2,0,TAU);c.fill();c.strokeStyle=OL;c.lineWidth=1.2;c.stroke()})}
  else{c.rotate(.5);c.fillStyle=rgb(col);c.beginPath();c.moveTo(-5,10);c.lineTo(-7,-2);c.lineTo(-3,-8);c.lineTo(3,-8);c.lineTo(7,-2);c.lineTo(5,10);c.closePath();c.fill();c.strokeStyle=OL;c.lineWidth=1.8;c.stroke();c.fillStyle='#d8c8a0';c.fillRect(-3,-13,6,6);c.strokeRect(-3,-13,6,6)}
  c.restore()}
 const PLATO={
  init(g){const gs=g.sel.find(id=>/^h_/.test(id)),gc=gs?gx().icol(gs):[110,170,70];g.k={pcs:[],drag:null,trail:[],tl:0,gc,done:false,fin:0,sc:.7,sauce:mixc(g.potCol||[170,110,60],[190,60,30],.3),rise:0}},
  down(g,x,y){const k=g.k;if(k.done)return;if(Math.abs(x-SERV2.x)<SERV2.w/2&&Math.abs(y-SERV2.y)<SERV2.h/2+4){endPlate(g);return}
   garOn().forEach((q,i)=>{if(!k.drag&&Math.hypot(x-GTX,y-GTY(i))<30)k.drag={kind:q[0],x,y}})},
  move(g,x,y){const k=g.k;if(!ptr.down||k.done||!k.drag)return;k.drag.x=x;k.drag.y=y;if(k.drag.kind==='salsa'&&inPlate(x,y)){const l=k.trail[k.trail.length-1];if(!l||Math.hypot(x-l.x,y-l.y)>4){if(l&&!l.br)k.tl+=Math.hypot(x-l.x,y-l.y);k.trail.push({x,y,br:!l||l.out});if(k.trail.length>400)k.trail.shift()}}else if(k.drag.kind==='salsa'&&k.trail.length&&!k.trail[k.trail.length-1].out)k.trail.push({x,y,out:true})},
  up(g){const k=g.k,d=k.drag;k.drag=null;if(!d||k.done)return;if(d.kind!=='salsa'&&inPlate(d.x,d.y)&&k.pcs.length<10){k.pcs.push({kind:d.kind,x:d.x,y:d.y,r:rnd(-.8,.8),sq:.5});burst(g,d.x,d.y,d.kind==='flor'?'#f0a8c0':'#9ad070',5,'drop');tn(600+rnd(0,200),.07,'triangle',.05,800);if(k.pcs.length===3)pop(g,PL.x,120,'¡Qué buena pinta!','#ffe58a')}},
  tick(g,dt){const k=g.k;if(!k)return;k.pcs.forEach(p=>p.sq=(p.sq||0)*Math.max(0,1-dt*6));k.rise=Math.min(1,k.rise+dt*2.4);if(k.done){k.fin+=dt;if(k.fin>2.1){k.fin=-99;COC.plateDone(k.sc)}}}};
 function endPlate(g){const k=g.k;if(k.done)return;const n=k.pcs.length;let spread=0;if(n>1){let mn=1e9;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)mn=Math.min(mn,Math.hypot(k.pcs[i].x-k.pcs[j].x,k.pcs[i].y-k.pcs[j].y));spread=mn>38?1:mn/38}
  k.sc=clamp(.7+Math.min(n,4)*.05+spread*.05+Math.min(1,k.tl/260)*.1,0,1);k.done=true;k.fin=0;tn(700,.14,'triangle',.06,1000);if(k.sc>.88)perfect(g,420,90,'¡Una obra de arte!');else pop(g,420,90,k.sc>.74?'¡Bien emplatado!':'Servido','#fff2d0')}
 PLATO.draw=function(c,g){const k=g.k,T=g.t,f=gx(),r=ease(k.rise);
  // mesa: servilleta de tela y cubiertos a los lados
  c.save();c.globalAlpha=r;c.translate(PL.x-PL.R-48,PL.y);c.rotate(-.06);shadow(c,3,6,26,60,.25);c.fillStyle='#d8cfb8';rr(c,-24,-60,48,120,6);c.fill();c.strokeStyle=OL;c.lineWidth=2;c.stroke();c.strokeStyle='rgba(150,60,50,.55)';c.lineWidth=3;c.beginPath();c.moveTo(-24,-44);c.lineTo(24,-44);c.moveTo(-24,44);c.lineTo(24,44);c.stroke();
  const sv=c.createLinearGradient(-6,0,6,0);sv.addColorStop(0,'#f4f6fa');sv.addColorStop(.5,'#c4cad4');sv.addColorStop(1,'#8a909c');c.fillStyle=sv;c.beginPath();c.roundRect(-3,-12,6,62,3);c.fill();c.stroke();[-7,0,7].forEach(x=>{c.beginPath();c.roundRect(x-1.5,-50,3,40,1.5);c.fill();c.stroke()});c.beginPath();c.roundRect(-8,-14,16,6,3);c.fill();c.stroke();c.restore();
  c.save();c.globalAlpha=r;c.translate(PL.x+PL.R+40,PL.y);c.rotate(.04);shadow(c,3,6,12,62,.25);c.fillStyle=sv;c.beginPath();c.moveTo(-5,-56);c.quadraticCurveTo(10,-46,7,-6);c.lineTo(-5,-6);c.closePath();c.fill();c.strokeStyle=OL;c.lineWidth=2;c.stroke();c.fillStyle='#7a4a24';c.beginPath();c.roundRect(-5,-6,12,52,5);c.fill();c.stroke();c.restore();
  // plato de cerámica (vista cenital): sombra, borde, pocillo y filete pintado
  c.save();c.translate(PL.x,PL.y);c.scale(r,r);shadow(c,7,24,PL.R+8,PL.R-6,.34);
  const pg=c.createRadialGradient(-30,-34,10,0,0,PL.R);pg.addColorStop(0,'#fffaf0');pg.addColorStop(.7,'#f1e7d0');pg.addColorStop(1,'#cfc2a4');c.fillStyle=pg;c.beginPath();c.arc(0,0,PL.R,0,TAU);c.fill();c.strokeStyle=OL;c.lineWidth=2.8;c.stroke();
  c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=3;c.beginPath();c.arc(0,0,PL.R-4,Math.PI*1.08,Math.PI*1.55);c.stroke();
  const band=mixc(g.potCol||[170,110,60],[60,80,120],.35);c.strokeStyle=rgb(band,.9);c.lineWidth=3.2;c.beginPath();c.arc(0,0,PL.R-14,0,TAU);c.stroke();c.lineWidth=1.4;c.beginPath();c.arc(0,0,PL.R-21,0,TAU);c.stroke();
  const wg=c.createRadialGradient(18,22,6,0,0,PL.R-30);wg.addColorStop(0,'#fff8ea');wg.addColorStop(1,'#d8cbb0');c.fillStyle=wg;c.beginPath();c.arc(0,0,PL.R-30,0,TAU);c.fill();c.strokeStyle='rgba(120,100,70,.45)';c.lineWidth=1.6;c.stroke();
  // la comida emplatada: cada ingrediente con su arte, ya hecho (punto dorado), dispuesto con gracia
  const n=g.sel.length;g.sel.forEach((id,i)=>{const a=n===1?0:-1.3+i*TAU/n,rr2=n===1?0:(n===2?32:46),x=Math.cos(a)*rr2,y=Math.sin(a)*rr2*.9,sz=n===1?56:n===2?42:n===3?34:29;c.save();c.translate(x,y);shadow(c,2,9,sz*.7,sz*.28,.28);c.rotate(a*.6+i);if(!FART.draw(c,id,{cut:!!COC.prepOf(id)&&COC.prepOf(id)!=='fish',r:sz,a:0,d:.72,t:T}))drawCh(c,{id,r:sz*.8,a:0},colOf(f.icol(id),.65));c.restore()});
  c.restore();
  if(k.rise>.5&&!k.done&&Math.random()<.1)g.fx.push({x:PL.x+rnd(-36,36),y:PL.y-8,vx:rnd(-6,6),vy:-rnd(16,32),t:0,col:'#fff',sz:rnd(6,10),k:'steam',sl:.5});
  if(k.trail.length>1){c.strokeStyle=rgb(k.sauce,.95);c.lineWidth=7;c.lineCap='round';c.lineJoin='round';c.beginPath();k.trail.forEach((p,i)=>{if(p.out)return;(i&&!p.br&&!k.trail[i-1].out)?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y)});c.stroke();c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=2;c.beginPath();k.trail.forEach((p,i)=>{if(p.out)return;(i&&!p.br&&!k.trail[i-1].out)?c.lineTo(p.x-1,p.y-2):c.moveTo(p.x-1,p.y-2)});c.stroke()}
  k.pcs.forEach(p=>{c.save();c.translate(p.x,p.y);c.rotate(p.r);shadow(c,2,6,9,4,.25);garDraw(c,p.kind,k.gc,T,1+(p.sq||0));c.restore()});
  // bandeja de decoraciones desbloqueadas (solo las que tienes)
  const on=garOn();if(!k.done&&on.length){c.fillStyle='rgba(30,20,12,.6)';rr(c,GTX-34,GTY(0)-38,68,on.length*74-4,10);c.fill();c.strokeStyle='rgba(232,207,148,.5)';c.lineWidth=1.5;c.stroke()}
  on.forEach((q,i)=>{if(k.done)return;const x=GTX,y=GTY(i),h=k.drag&&k.drag.kind===q[0];c.save();c.translate(x,y);garDraw(c,q[0],k.gc,T,h?.7:1.25);c.restore();c.fillStyle='#fff2d0';c.font='9px Cinzel,serif';c.textAlign='center';c.lineWidth=3;c.strokeStyle=OL;c.strokeText(q[1],x,y+27);c.fillText(q[1],x,y+27)});
  if(k.drag){c.save();c.translate(k.drag.x,k.drag.y);shadow(c,3,18,10,4,.3);garDraw(c,k.drag.kind,k.gc,T,1.5);c.restore()}
  if(!k.done){const nx=GAR.find(q=>L('co')<q[2]);c.fillStyle='#fff2d0';c.font='13px Cinzel,serif';c.textAlign='center';c.lineWidth=4;c.strokeStyle=OL;const tx='Opcional: arrastra decoraciones al plato donde quieras · o pulsa SERVIR';c.strokeText(tx,420,444);c.fillText(tx,420,444);if(nx){c.font='10px Cinzel,serif';c.fillStyle='#c8b888';const t2='Próxima decoración: '+nx[1]+' (Cocina '+nx[2]+')';c.strokeText(t2,GTX+34+90,GTY(on.length-1)+44);c.fillText(t2,GTX+34+90,GTY(on.length-1)+44)}}
  if(!k.done)pill(c,SERV2.x,SERV2.y,SERV2.w,SERV2.h,'SERVIR',true,T);
  if(k.done){const u=Math.max(0,k.fin);c.fillStyle='rgba(255,246,200,'+Math.max(0,.4-u*.4)+')';c.fillRect(0,0,WW,HH);for(let i=0;i<9;i++){const a=i*TAU/9+T,rr2=130+u*60;c.fillStyle='rgba(255,229,138,'+Math.max(0,1-u*.6)+')';c.beginPath();c.arc(PL.x+Math.cos(a)*rr2,PL.y+Math.sin(a)*rr2*.8,3,0,TAU);c.fill()}}};
 // ── tabla de estaciones y despacho ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 const ST={mesa:MESA,puchero:PUCHERO,sarten:SARTEN,parrilla:PARRILLA,horno:HORNO,plato:PLATO},DRAW={mesa:MESA.draw,puchero:PUCHERO.draw,sarten:SARTEN.draw,parrilla:PARRILLA.draw,horno:HORNO.draw,plato:PLATO.draw};
 const MST=Object.keys(STOF);
 function cookInit(g){const id=STOF[g.meth];go(g,id);ST[id].init(g);g.kk[id]=g.k}
 function plateInit(g){go(g,'plato');PLATO.init(g);g.kk.plato=g.k}
 function mesaStart(g){go(g,'mesa')}
 function tick(g,dt){camTick(g,dt);g.pops.forEach(p=>p.t+=dt);g.pops=g.pops.filter(p=>p.t<1.1);g.fx.forEach(f=>{f.t+=dt*(f.sl||1.5);f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=(f.g||0)*dt});g.fx=g.fx.filter(f=>f.t<1);g.shake=Math.max(0,(g.shake||0)-dt);
  if(g.hs>0){g.hs-=dt;return}   // hit-stop
  const s=ST[g.st];if(s&&s.tick&&g.cam.arr){g.k=g.kk[g.st]||null;s.tick(g,dt)}}   // los minijuegos no empiezan hasta que la cámara llega
 function input(g,type,x,y,dtm){ptr.px=ptr.x;ptr.py=ptr.y;ptr.x=x;ptr.y=y;ptr.dt=dtm||16;{const dx=x-ptr.px,dy=y-ptr.py;if(Math.hypot(dx,dy)>1.5){let d=Math.atan2(dy,dx)-ptr.ang;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;ptr.ang+=d*.4}}if(type==='down')ptr.down=true;if(type==='up')ptr.down=false;
  if(g.st==='over'){if(type==='down'){const c=g.cam,wx=(x-400)/c.s+c.x,wy=(y-230)/c.s+c.y,cx=Math.floor(wx/WW),cy=Math.floor(wy/HH);const id=Object.keys(CELL).find(k=>CELL[k][0]===cx&&CELL[k][1]===cy),m=Object.keys(STOF).find(k=>STOF[k]===id);if(m)COC.stationClick(m)}return}
  if(!g.cam.arr&&g.cam.s<.97)return;const s=ST[g.st];if(!s)return;g.k=g.kk[g.st]||null;if(type==='down'&&s.down)s.down(g,x,y);else if(type==='move'&&s.move)s.move(g,x,y);else if(type==='up'&&s.up)s.up(g)}
 function render(c,g){const cam=g.cam;c.drawImage(floor(),0,0,WW,HH);const fg=c.createRadialGradient(400,230,100,400,230,520);fg.addColorStop(0,'rgba(0,0,0,0)');fg.addColorStop(1,'rgba(10,4,0,.5)');c.fillStyle=fg;c.fillRect(0,0,WW,HH);
  c.save();c.translate(400,230);c.scale(cam.s,cam.s);c.translate(-cam.x,-cam.y);
  if(g.shake>0&&g.st!=='over')c.translate(rnd(-1,1)*g.shake*7,rnd(-1,1)*g.shake*7);
  Object.keys(CELL).forEach(id=>{const[cx,cy]=CELL[id];c.drawImage(bgc(id),cx*WW,cy*HH,WW,HH);
   if(g.st===id||g.prev===id){c.save();c.translate(cx*WW,cy*HH);c.beginPath();c.rect(0,0,WW,HH);c.clip();g.k=g.kk[id]||null;if(DRAW[id]&&(id==='mesa'||g.k))DRAW[id](c,g);fxDraw(c,g);popsDraw(c,g);c.restore()}});
  if(g.st==='over'||cam.s<.9){const a=g.st==='over'?1:clamp((.9-cam.s)*4,0,1);c.globalAlpha=a;Object.keys(CELL).forEach(id=>{const[cx,cy]=CELL[id],m=Object.keys(STOF).find(k=>STOF[k]===id),rm=COC.recM()||COC.tutM(),sel=m&&rm===m,rd=m&&COC.ready()&&g.st==='over',tm=COC.tutM(),lk=m&&tm&&tm!==m;   // en el tutorial los demás métodos se ven apagados
    c.fillStyle=sel?'rgba(255,200,80,.2)':lk?'rgba(8,4,0,.72)':'rgba(8,4,0,.22)';c.fillRect(cx*WW,cy*HH,WW,HH);if(sel||(rd&&!lk)){c.strokeStyle=sel?'#ffd070':'rgba(255,208,112,'+(.35+.3*Math.sin(g.t*5))+')';c.lineWidth=sel?12:8;c.strokeRect(cx*WW+8,cy*HH+8,WW-16,HH-16)}
    c.fillStyle=sel?'#fff2c0':'#fff2d0';c.font='bold 54px Cinzel,serif';c.textAlign='center';c.lineWidth=12;c.lineJoin='round';c.strokeStyle=OL;c.strokeText(NM[id],cx*WW+400,cy*HH+250);c.fillText(NM[id],cx*WW+400,cy*HH+250);
    if(m){c.font='28px Cinzel,serif';c.fillStyle=sel?'#ffd070':'#c8b888';c.lineWidth=8;const t2=lk?'ahora no':rd?(sel?'receta: cocinar aquí':'cocinar aquí'):'primero los ingredientes';c.strokeText(t2,cx*WW+400,cy*HH+300);c.fillText(t2,cx*WW+400,cy*HH+300)}});c.globalAlpha=1}
  c.restore();gx().paintFinish(c)}
 return{drawCh,spiceOn:k=>L("co")>=SPL[k],CELL,NM,STOF,go,camInit,cookInit,plateInit,mesaStart,mgNew,tick,input,render,sabor,tgOf,flav,get ptr(){return ptr},pop,perfect}})();
