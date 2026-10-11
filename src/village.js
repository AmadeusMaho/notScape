/* NotScape — ALDEA (Fase 2, paso 3, bloque 1). Ver AGENTS.md → "Cómo funciona la aldea".
   Sustituye el bloque `// ---- aldea` de la IIFE de `bgc` en game.js: plaza empedrada por píxel (adoquines, bordillo con luz arriba-izquierda,
   boca de los caminos que desembocan en ella), 3 casas con tejado de tejas, pozo, cajas y barril, farolas, 2 cobertizos (horno/yunque y taller),
   bancos y arbustos. Misma técnica que roads.js/water.js: máscara + paso por píxel en un ImageData -> canvas temporal -> g.drawImage;
   el resto son rectángulos con contorno oscuro #14100a. Todas las coordenadas son de MUNDO (ya incluyen el antiguo OY=300).
   GEOMETRÍA = la original (plaza x0+40..380 × y650..912, casas en y596..636, pozo x0+48..72, cobertizos y828..876, farolas en x0+120/270, y732..748).
   Las luces de las farolas (lighting(): x0+120/270, y730) y las estaciones (ST) no cambian. Con ?old, VG es null y game.js usa el código antiguo.
   NO usar rnd()/R() del juego: todo sale de hash()/vnoise() de GR.H (determinista). */
const VG=GR?(()=>{
 const{hash,vnoise,mix,hex}=GR.H,OL='#14100a';
 const vn=(t,s)=>{const a=Math.floor(t),f=t-a,m=f*f*(3-2*f);return hash(a,0,s)*(1-m)+hash(a+1,0,s)*m};
 const sh=(c,t)=>mix(c,'#000000',t),li=(c,t)=>mix(c,'#ffffff',t);
 const f=(g,c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
 const fa=(g,a,x,y,w,h,c)=>{g.globalAlpha=a;f(g,c||'#000000',x,y,w,h);g.globalAlpha=1};
 // versión numérica (arrays [r,g,b]) para el bucle por píxel de la plaza
 const mA=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t],W3=[255,255,255],K3=[0,0,0];
 // Transformada de distancia (chamfer): distancia de cada celda a la fuente (src=1) más cercana
 const dist=(src,w,h)=>{const d=new Float32Array(w*h),Q=1.414;for(let i=0;i<d.length;i++)d[i]=src[i]?0:1e4;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;let v=d[i];if(x>0)v=Math.min(v,d[i-1]+1);if(y>0){v=Math.min(v,d[i-w]+1);if(x>0)v=Math.min(v,d[i-w-1]+Q);if(x<w-1)v=Math.min(v,d[i-w+1]+Q)}d[i]=v}
  for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const i=y*w+x;let v=d[i];if(x<w-1)v=Math.min(v,d[i+1]+1);if(y<h-1){v=Math.min(v,d[i+w]+1);if(x<w-1)v=Math.min(v,d[i+w+1]+Q);if(x>0)v=Math.min(v,d[i+w-1]+Q)}d[i]=v}
  return d};
 // Paleta de edificios por bioma: pared, madera (vigas/puerta), cristal
 const PW=[{w:'#d8c9a3',t:'#6b4a2a'},{w:'#d2c7a2',t:'#5a3e22'},{w:'#c4c8a4',t:'#4a3a22'},{w:'#e6ebf0',t:'#7a6a5a'},{w:'#8a7466',t:'#3a2a24'}];

 /* ---------- plaza empedrada ---------- */
 function plaza(g,k,x0,b,sc,rc){
  const X=x0+40,Y=650,w=340,h=262,M=4,bw=w+2*M,bh=h+2*M,BX=X-M,BY=Y-M,s=k*17+5,m=new Uint8Array(bw*bh);
  const jit=(v,sd)=>Math.round((vn(v/9,sd)-.5)*2.4);
  const jT=[],jB=[];for(let x=0;x<bw;x++){jT.push(jit(BX+x,s+1));jB.push(jit(BX+x,s+2))}
  for(let y=0;y<bh;y++){const Yw=BY+y,jL=jit(Yw,s+3),jR=jit(Yw,s+4);for(let x=0;x<bw;x++){const Xw=BX+x;
   const dx=Xw-X,ex=X+w-1-Xw,dy=Yw-Y,ey=Y+h-1-Yw;if(dx<jL||ex<jR||dy<jT[x]||ey<jB[x]||Math.min(dx,ex)+Math.min(dy,ey)<4)continue;m[y*bw+x]=1}}
  const mm=(x,y)=>x>=0&&y>=0&&x<bw&&y<bh&&m[y*bw+x]===1,d=dist(m.map(v=>1-v),bw,bh);
  // bocas de los caminos (principal este-oeste y calle norte-sur): sin bordillo, el adoquín se funde con la tierra del camino
  const OP=[[x0,752,52,34],[x0+372,752,60,34],[x0+186,Y-8,22,18],[x0+186,Y+h-10,22,18]];
  const inOp=(x,y)=>OP.some(o=>x>=o[0]&&x<o[0]+o[2]&&y>=o[1]&&y<o[1]+o[3]);
  const sc_=hex(sc),rc_=hex(rc),gr_=hex(b.g[1]),dk=hex(OL),mud=[58,42,26],fcx=x0+195,fcy=795,cw=8,ch=6;
  const img=g.createImageData(bw,bh),D=img.data;
  for(let y=0;y<bh;y++)for(let x=0;x<bw;x++){const i=y*bw+x,o=i*4,Xw=BX+x,Yw=BY+y,op=inOp(Xw,Yw);let c,a=255;
   if(!m[i]){ // halo exterior: sombra suave hacia abajo-derecha (la luz viene de arriba-izquierda)
    if(op)continue;
    const q=(mm(x-1,y)||mm(x,y-1))?.34:(mm(x-2,y)||mm(x,y-2)||mm(x-1,y-1))?.2:(mm(x-3,y)||mm(x,y-3)||mm(x-2,y-2))?.1:0;
    if(!q)continue;D[o]=D[o+1]=D[o+2]=0;D[o+3]=q*255;continue}
   const di=d[i],row=Math.floor(Yw/ch),xx=Xw+((row&1)?4:0),col=Math.floor(xx/cw),fx=xx-col*cw,fy=Yw-row*ch,id=hash(col,row,s+9);
   const n=vnoise(Xw,Yw,s+3,20);let base=mA(sc_,n>.5?W3:K3,Math.abs(n-.5)*.2);
   c=mA(base,id>.5?W3:K3,Math.abs(id-.5)*.22);
   if(fx===0||fy===0)c=mA(sc_,K3,.3);else if((fx===1&&fy>1)||(fy===1&&fx>1))c=mA(c,W3,.16);else if(fx===cw-1||fy===ch-1)c=mA(c,K3,.12);
   // corredor de los caminos que cruzan la plaza: tinte de tierra
   if((Yw>=752&&Yw<786)||(Xw>=x0+186&&Xw<x0+208))c=mA(c,rc_,.14);
   // incrustación circular alrededor de la fogata
   const rr=Math.sqrt((Xw-fcx)*(Xw-fcx)+(Yw-fcy)*(Yw-fcy));if(rr>=37&&rr<40)c=mA(c,mud,.4);else if(rr<37)c=mA(c,W3,.05);
   if(op){const t=Math.min(1,Math.max(0,(di-1)/8)),nz=hash(Xw,Yw,s+11),r0=mA(rc_,nz>.5?W3:K3,.07);c=mA(r0,c,t*t)}
   else if(di<=1)c=mA(c,dk,.8);
   else if(di<=3){const lit=!mm(x-3,y)||!mm(x,y-3),dkc=!mm(x+3,y)||!mm(x,y+3);c=lit?mA(sc_,W3,.36):dkc?mA(sc_,K3,.28):mA(sc_,W3,.1);if(di>2&&hash(Xw,Yw,s+5)<.25)c=mA(c,K3,.1)}
   else if(di<=6&&hash(Xw,Yw,s+7)<.07)c=mA(c,gr_,.45); // musgo / hierba que se cuela entre adoquines
   D[o]=c[0];D[o+1]=c[1];D[o+2]=c[2];D[o+3]=a}
  const t=document.createElement('canvas');t.width=bw;t.height=bh;t.getContext('2d').putImageData(img,0,0);g.drawImage(t,BX,BY)}

 /* ---------- casa ---------- */
 function roof(g,x,y,w,rf,seed,snow){
  const H=18;
  for(let j=0;j<H;j++){const ins=Math.round(12*(1-j/(H-1))),xl=x-6+ins,xr=x+w+6-ins,Yr=y-H+j;
   f(g,OL,xl-1,Yr,1,1);f(g,OL,xr,Yr,1,1);
   if(j===0)f(g,OL,xl,Yr-1,xr-xl,1);
   if(j===H-1){f(g,OL,xl-1,Yr,xr-xl+2,1);continue}
   if(j===H-2){f(g,sh(rf,.38),xl,Yr,xr-xl,1);continue}
   const tr=Math.floor(j/3),jr=j%3;
   for(let X=xl;X<xr;X++){const tx=X-(x-6)+((tr&1)?3:0),tc=Math.floor(tx/6),fx=((tx%6)+6)%6,id=hash(tc,tr,seed),fr=(X-xl)/(xr-xl);
    let c=mix(rf,id>.5?'#ffffff':'#000000',Math.abs(id-.5)*.2);
    if(jr===2)c=sh(c,.3);else if(fx===0)c=sh(c,.18);else if(jr===0)c=li(c,.1);
    if(fr<.22)c=li(c,.12);else if(fr>.78)c=sh(c,.14);
    if(j===0)c=li(c,.35);else if(j===1)c=li(c,.15);
    if(snow){const jm=3+Math.floor(hash(X>>1,0,seed+2)*3);if(j<jm)c=j===jm-1?'#bcd0e0':'#f4f8fc'}
    f(g,c,X,Yr,1,1)}}}
 function win(g,x,y,shut,box,P){
  f(g,OL,x-1,y-1,9,9);f(g,'#6a8ab0',x,y,7,7);f(g,'#8fb0d4',x,y,7,3);f(g,P.t==='#7a6a5a'?'#e6ebf0':'#d8c9a3',x+3,y,1,7);f(g,P.t==='#7a6a5a'?'#e6ebf0':'#d8c9a3',x,y+3,7,1);f(g,'#ffffff',x+1,y+1,1,1);
  f(g,OL,x-2,y+8,11,1);f(g,li(P.w,.2),x-2,y+8,11,1);fa(g,.3,x-1,y+9,9,1);
  if(shut){f(g,OL,x-4,y-1,3,9);f(g,P.sh,x-3,y,1,7);f(g,sh(P.sh,.25),x-2,y,1,7);f(g,OL,x+8,y-1,3,9);f(g,P.sh,x+9,y,1,7);f(g,sh(P.sh,.25),x+10,y,1,7)}
  if(box){f(g,OL,x-1,y+9,9,4);f(g,P.t,x,y+10,7,2);for(let i=0;i<4;i++){f(g,i%2?'#ff8ab0':'#d03030',x+i*2,y+8,2,2);f(g,'#3a8a4a',x+i*2,y+9,2,1)}}}
 function house(g,k,x,y,w,h,rf,opt){
  const P={w:PW[k].w,t:PW[k].t,sh:sh(rf,.15)},seed=k*41+x%97;
  // sombra en el suelo (cae hacia abajo-derecha)
  fa(g,.22,x-2,y+h,w+11,5);fa(g,.18,x+w+6,y-8,6,h+10);
  f(g,OL,x-1,y-1,w+2,h+2);f(g,P.w,x,y,w,h);
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const r=hash(x+i,y+j,seed);if(r<.05)f(g,sh(P.w,.1),x+i,y+j,1,1);else if(r<.08)f(g,li(P.w,.1),x+i,y+j,1,1)}
  for(let j=7;j<h-5;j+=7)fa(g,.07,x+2,y+j,w-4,1); // juntas de revoco
  f(g,li(P.w,.22),x,y,2,h);f(g,sh(P.w,.2),x+w-3,y,3,h);fa(g,.12,x,y+h-9,w,4);
  // zócalo de piedra
  f(g,'#8a8070',x,y+h-5,w,5);for(let i=0;i<w;i+=6){f(g,'#6a6258',x+i,y+h-5,1,5);f(g,'#a89f8f',x+i+1,y+h-5,4,1)}f(g,'#5a5248',x,y+h-5,w,1);
  // vigas de madera
  f(g,P.t,x,y,3,h-5);f(g,P.t,x+w-3,y,3,h-5);f(g,li(P.t,.2),x,y,1,h-5);f(g,P.t,x,y+2,w,3);f(g,li(P.t,.2),x,y+2,w,1);f(g,sh(P.t,.3),x,y+4,w,1);
  if(w>=80){f(g,P.t,x+w/2-18,y+5,2,h-10);f(g,P.t,x+w/2+16,y+5,2,h-10)}
  // puerta
  const dx=x+Math.round(w/2)-4,dy=y+h-14;f(g,OL,dx-1,dy-1,10,15);f(g,'#6b4a2a',dx,dy,8,14);for(let i=2;i<8;i+=2)f(g,'#4a2f18',dx+i-1,dy,1,14);f(g,li('#6b4a2a',.2),dx,dy,1,14);f(g,'#4a2f18',dx,dy+4,8,1);f(g,'#4a2f18',dx,dy+10,8,1);f(g,'#e8c040',dx+6,dy+7,1,2);
  f(g,OL,dx-3,y+h,14,1);f(g,'#a89f8f',dx-2,y+h-1,12,1);
  // ventanas
  win(g,x+5,y+8,opt.shut,opt.box,P);win(g,x+w-12,y+8,opt.shut,opt.box,P);
  fa(g,.32,x,y,w,3); // sombra del alero sobre la pared
  roof(g,x,y,w,rf,seed+7,k===3);
  if(opt.chim){const cx=x+w-26,cy=y-30;f(g,OL,cx-1,cy-1,11,17);f(g,'#8a7a6a',cx,cy,9,15);for(let j=0;j<15;j+=4){f(g,'#5a4e42',cx,cy+j,9,1);f(g,'#5a4e42',cx+(j%8?3:6),cy+j,1,4)}f(g,'#a89f8f',cx,cy,2,15);f(g,'#5a4e42',cx+7,cy,2,15);f(g,OL,cx-2,cy-2,13,3);f(g,'#b8ac9c',cx-1,cy-1,11,1);f(g,'#2a2018',cx+1,cy-1,7,1);if(k===3)f(g,'#f4f8fc',cx-1,cy-2,11,2)}
 }
 /* ---------- pequeños elementos ---------- */
 function pot(g,x,y,c){f(g,OL,x-1,y+2,7,6);f(g,'#a05a3a',x,y+3,5,4);f(g,'#c47a52',x,y+3,5,1);f(g,'#3a8a4a',x,y,5,3);f(g,c,x+1,y-1,1,2);f(g,c,x+3,y,1,2)}
 function bush(g,x,y,k,seed){ // arbusto redondeado de 20×13 con contorno completo (x,y = esquina sup. izq.); sombra suave abajo-derecha
  const c=['#2f7a3a','#2a7a4a','#4a7a3a','#8a9aaa','#5a3a2a'][k],cx=9.5,cy=6.5;
  fa(g,.22,x+3,y+11,17,3);
  for(let j=0;j<13;j++)for(let i=0;i<20;i++){const dx=(i-cx)/10,dy=(j-cy)/6.6,r=dx*dx+dy*dy;if(r>1)continue;
   let col;if(r>.74)col=OL;else{const lit=(-dx-dy)*.5,n=hash(x+i,y+j,seed);col=mix(c,lit>0?'#ffffff':'#000000',Math.min(.4,Math.abs(lit)*.5+(n>.7?.12:0)));if(n<.1)col=sh(c,.35)}
   f(g,col,x+i,y+j,1,1)}
  for(let i=0;i<5;i++){const fx=x+3+Math.floor(hash(i,seed,5)*14),fy=y+2+Math.floor(hash(i,seed,7)*7);f(g,['#ff8ab0','#ffffff','#ffd040','#d03030','#ffffff'][i],fx,fy,2,2)}}
 function bench(g,x,y){fa(g,.22,x+2,y+9,24,3);f(g,OL,x-1,y-1,28,10);f(g,'#7a4a2a',x,y,26,3);f(g,li('#7a4a2a',.22),x,y,26,1);f(g,'#6b4a2a',x,y+4,26,3);f(g,li('#6b4a2a',.18),x,y+4,26,1);f(g,'#4a2f18',x+2,y+7,3,3);f(g,'#4a2f18',x+21,y+7,3,3)}
 function well(g,k,x,y,rf){ // x,y = esquina sup. izq. del pozo (x0+46, 762)
  fa(g,.24,x+4,y+30,28,5);
  f(g,OL,x+2,y+20,26,14);f(g,'#9a9484',x+3,y+21,24,12);f(g,'#b8b4aa',x+3,y+21,24,2);f(g,'#7a766a',x+3,y+30,24,3);
  for(let i=0;i<24;i+=6){f(g,'#6a665a',x+3+i,y+23,1,10)}f(g,'#6a665a',x+3,y+27,24,1);
  f(g,OL,x+6,y+20,18,6);f(g,'#1a3a6a',x+7,y+21,16,4);f(g,'#4a7ac0',x+8,y+21,6,1);f(g,'#2a5a9a',x+8,y+23,12,1);
  f(g,OL,x+3,y+6,4,28);f(g,'#7a4a2a',x+4,y+7,2,26);f(g,li('#7a4a2a',.25),x+4,y+7,1,26);f(g,OL,x+23,y+6,4,28);f(g,'#7a4a2a',x+24,y+7,2,26);f(g,sh('#7a4a2a',.2),x+25,y+7,1,26);
  for(let j=0;j<8;j++){const ins=7-j;f(g,OL,x+ins-2,y+j,1,1);f(g,OL,x+28-ins+1,y+j,1,1);f(g,j===0?li(rf,.3):j%3===2?sh(rf,.3):rf,x+ins-1,y+j,30-2*ins+0,1)}f(g,OL,x+5,y-1,20,1);
  f(g,'#c8b88a',x+15,y+8,1,10);f(g,OL,x+13,y+18,5,4);f(g,'#8a6a3a',x+14,y+18,3,3);f(g,'#a08a5a',x+14,y+18,3,1)}
 function crates(g,x,y){fa(g,.24,x+2,y+11,28,4);
  f(g,OL,x-1,y-1,16,14);f(g,'#8a6a3a',x,y,14,12);f(g,'#a8864a',x,y,14,2);f(g,'#6a4a22',x,y+5,14,1);f(g,'#6a4a22',x+6,y,2,12);f(g,'#6a4a22',x,y+11,14,1);f(g,'#e0c090',x+1,y+1,1,1);
  f(g,OL,x+15,y+3,14,11);f(g,'#7a4a2a',x+16,y+4,12,9);f(g,'#9a6a3a',x+16,y+4,12,1);f(g,'#4a2f18',x+16,y+6,12,1);f(g,'#4a2f18',x+16,y+11,12,1);f(g,'#a89f8f',x+17,y+5,1,7);
  f(g,OL,x-9,y+5,9,9);f(g,'#c8b88a',x-8,y+6,7,7);f(g,'#e0d4a8',x-8,y+6,3,2);f(g,'#8a7a50',x-5,y+6,1,2);f(g,'#a89868',x-3,y+10,2,3)}
 function lamp(g,x,y){ // farol de calle (pequeño): x = eje, y = 732 → cristal en y727–733 (la luz de lighting() está en y730). La SOMBRA es dinámica: la dibuja dDecor() con Sd() en (x,y+12)
  f(g,OL,x-3,y+8,7,4);f(g,'#6a665a',x-2,y+9,5,2);f(g,'#9a9484',x-2,y+9,5,1); // peana
  f(g,OL,x-2,y+1,4,8);f(g,'#3a3a42',x-1,y+1,2,8);f(g,'#6a6a76',x-1,y+1,1,8); // poste
  f(g,OL,x-3,y-6,7,8);f(g,'#3a3a42',x-2,y-5,5,6);f(g,'#ffd23a',x-2,y-5,5,6);f(g,'#fff4a8',x-1,y-4,3,3);f(g,'#3a3a42',x-2,y-5,1,6); // farol
  f(g,OL,x-4,y-8,9,2);f(g,'#4a4a54',x-3,y-7,7,1);f(g,OL,x-1,y-10,3,2);f(g,'#6a6a76',x,y-9,1,1)}
 function shed(g,k,x,y,w,hr,legH,wood){ // cobertizo abierto: tejado de tablas visto de frente + dos postes
  const T=wood,dk=sh(wood,.35);fa(g,.2,x+2,y+hr,w-2,legH,'#000000');
  [x+2,x+w-6].forEach(px=>{f(g,OL,px-1,y+hr-1,6,legH+2);f(g,T,px,y+hr,4,legH);f(g,li(T,.25),px,y+hr,1,legH);f(g,dk,px+3,y+hr,1,legH);f(g,'#8a8070',px-1,y+hr+legH-3,6,3);f(g,OL,px-1,y+hr+legH,6,1)});
  f(g,OL,x-1,y-1,w+2,hr+2);
  for(let j=0;j<hr;j++){const r=Math.floor(j/4),jr=j%4;for(let i=0;i<w;i++){let c=T;const id=hash(Math.floor((i+(r&1)*9)/18),r,k*7+x%31);c=mix(c,id>.5?'#ffffff':'#000000',Math.abs(id-.5)*.18);
    if(jr===3)c=sh(c,.35);else if(jr===0)c=li(c,.14);if((i+(r&1)*9)%18===0)c=sh(c,.25);if(i<2)c=li(c,.12);else if(i>w-4)c=sh(c,.15);f(g,c,x+i,y+j,1,1)}}
  f(g,li(T,.3),x,y,w,1);f(g,sh(T,.5),x,y+hr-1,w,1);fa(g,.28,x+3,y+hr,w-6,4)}
 function slabs(g,x,y,w,h,sc,seed){for(let j=0;j<h;j+=4)for(let i=0;i<w;i+=6){const o=(j&4)?3:0,id=hash(i,j,seed),c=mix(sc,id>.5?'#ffffff':'#000000',Math.abs(id-.5)*.2);f(g,sh(sc,.3),x+i-o,y+j,6,4);f(g,c,x+i-o+1,y+j+1,5,3)}}

 return{
  /* g = contexto de bgc (coords de mundo, sin OX/OY). x0 = k*BW. b = BI[k]. rf = color de tejado del bioma, sc = color de la plaza, rc = color del camino */
  draw(g,k,x0,b,rf,sc,rc){
   plaza(g,k,x0,b,sc,rc);
   // pasos de losas de la puerta a la plaza (entre las casas y el borde norte de la plaza)
   [[x0+216,84],[x0+322,36],[x0+60,60]].forEach(([hx,hw])=>{const dx=hx+Math.round(hw/2)-6;slabs(g,dx,636,12,14,sc,k*5+hx)});
   // arbustos y macetas junto a las puertas
   bush(g,x0+158,622,k,1);bush(g,x0+170,627,k,2);bush(g,x0+304,622,k,3);pot(g,x0+216+14,628,'#ffd040');pot(g,x0+216+72,628,'#ff8ab0');pot(g,x0+60+8,630,'#d03030');pot(g,x0+60+46,630,'#ffffff');
   house(g,k,x0+216,596,84,40,rf,{shut:1,box:1,chim:1});house(g,k,x0+322,606,36,30,rf,{});house(g,k,x0+60,600,60,36,rf,{shut:1});
   well(g,k,x0+46,762,rf);
   crates(g,x0+322,790);
   lamp(g,x0+120,732);lamp(g,x0+270,732);
   bench(g,x0+126,664);bench(g,x0+246,664);
   shed(g,k,x0+50,826,172,16,34,'#7a4a2a');shed(g,k,x0+262,840,76,10,26,'#7a4a2a');
  }}
})():null;
