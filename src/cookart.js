// NotScape · ARTE 2D DE LA COCINA (29 oct 2026) · global `COOKART`. Lo usa src/cookauto.js. Sustituye al dibujo plano anterior (degradados lisos + contorno: «aspecto flash»).
// TÉCNICA (misma filosofía que el resto del juego: pintado «óleo oscuro»): todo lo ESTÁTICO se hornea UNA vez a un lienzo de 960×570 (escena lógica 640×380 a ×1,5) con degradados de varias paradas, luz rasante de la
// lumbre, textura martillada/veta/ladrillo por HASH (determinista), hollín, desgaste, contorno fino marrón oscuro y grano de pincel (soft-light); por fotograma solo se dibuja lo VIVO (llamas, brasas, líquido, aceite,
// luz parpadeante). Capas por método: `bg` (muro + mesa + estantes desenfocados) · `fireBack` (llamas detrás) · `body` (recipiente) · `surface` (líquido/aceite/brasas/boca del horno) · [ingredientes] · `front` (labio, rejilla, arco).
// Un recipiente nuevo = una función en `BODY`/`FRONT`/`SURF` y su fila en SLOT de cookauto.js. Coordenadas de anclaje (no cambiarlas sin tocar SLOT): olla (320,162) · sartén (320,208) · parrilla (320,198) · horno (320,226).
const COOKART=(()=>{
 const W=640,H=380,TAU=Math.PI*2,INK='#1c120a',hs=(a,b)=>{const v=Math.sin(a*127.1+b*311.7)*43758.5453;return v-Math.floor(v)};
 const cache={},mk=()=>{const o=document.createElement('canvas');o.width=960;o.height=570;const c=o.getContext('2d');c.scale(1.5,1.5);return[o,c]};
 const bake=(key,fn)=>cache[key]||(cache[key]=(()=>{const[o,c]=mk();fn(c);return o})());
 let GP=null;const grainPat=c=>{if(!GP){const g=document.createElement('canvas');g.width=g.height=96;const x=g.getContext('2d'),d=x.createImageData(96,96);for(let i=0;i<d.data.length;i+=4){const v=118+hs(i,3)*60|0;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255}x.putImageData(d,0,0);GP=g}return c.createPattern(GP,'repeat')};
 const lg=(c,x0,y0,x1,y1,st)=>{const g=c.createLinearGradient(x0,y0,x1,y1);st.forEach(([o,col])=>g.addColorStop(o,col));return g};
 const rg=(c,x,y,r0,r1,st)=>{const g=c.createRadialGradient(x,y,r0,x,y,r1);st.forEach(([o,col])=>g.addColorStop(o,col));return g};
 const grain=(c,a,mode)=>{c.save();c.globalCompositeOperation=mode||'soft-light';c.globalAlpha=a;c.fillStyle=grainPat(c);c.fillRect(0,0,W,H);c.restore()};
 // grano solo dentro de una forma (path ya construido en c)
 const grainIn=(c,a)=>{c.save();c.clip();c.globalCompositeOperation='soft-light';c.globalAlpha=a;c.fillStyle=grainPat(c);c.fillRect(0,0,W,H);c.restore()};
 const ink=(c,w,col)=>{c.strokeStyle=col||INK;c.lineWidth=w||2;c.lineJoin='round';c.lineCap='round';c.globalAlpha=.92;c.stroke();c.globalAlpha=1};
 const ell=(c,x,y,rx,ry,rot)=>{c.beginPath();c.ellipse(x,y,rx,ry,rot||0,0,TAU)};
 const shadow=(c,x,y,rx,ry,a)=>{c.save();c.translate(x,y);c.scale(1,ry/rx);c.fillStyle=rg(c,0,0,rx*.2,rx,[[0,'rgba(0,0,0,'+a+')'],[1,'rgba(0,0,0,0)']]);c.beginPath();c.arc(0,0,rx,0,TAU);c.fill();c.restore();c.beginPath()};   // beginPath final: si no, el siguiente ink() volvía a trazar la elipse de la sombra
 // martillado: hoyuelos suaves claros/oscuros dentro de la forma actual
 const hammer=(c,seed,n,x0,y0,x1,y1,a)=>{c.save();c.clip();for(let i=0;i<n;i++){const x=x0+hs(i,seed)*(x1-x0),y=y0+hs(i,seed+1)*(y1-y0),r=2+hs(i,seed+2)*4;c.fillStyle='rgba(255,255,255,'+a+')';c.beginPath();c.ellipse(x-.8,y-.8,r,r*.8,0,0,TAU);c.fill();c.fillStyle='rgba(0,0,0,'+a*1.6+')';c.beginPath();c.ellipse(x+.9,y+.9,r,r*.8,0,0,TAU);c.fill()}c.restore()};
 const rivet=(c,x,y,r)=>{c.fillStyle=rg(c,x-r*.3,y-r*.3,0,r*1.2,[[0,'#8a8a94'],[1,'#2a2a30']]);ell(c,x,y,r,r);c.fill();ink(c,1,INK)};
 // ── muro de piedra + mesa de madera + estantes desenfocados (fondo) ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 function bg(){return bake('bg',c=>{c.fillStyle='#17100a';c.fillRect(0,0,W,H);
  for(let r=0;r<8;r++){const y=r*34,off=r%2?-38:0;for(let x=off;x<W+40;x+=76){const w=72+hs(x,r)*8|0,l=22+hs(x,r+9)*8,h=(26+hs(x,r)*6)|0;c.fillStyle='hsl('+(24+hs(r,x)*10|0)+','+(14+hs(x,r+3)*10|0)+'%,'+l+'%)';c.fillRect(x+2,y+2,w,30);
    c.fillStyle=lg(c,0,y+2,0,y+32,[[0,'rgba(255,225,170,.14)'],[.25,'rgba(255,225,170,0)'],[.8,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,.34)']]);c.fillRect(x+2,y+2,w,30);
    c.fillStyle='rgba(255,230,180,.06)';c.fillRect(x+2,y+2,3,30);c.fillStyle='rgba(0,0,0,.25)';c.fillRect(x+w-1,y+2,3,30);
    for(let k=0;k<3;k++){c.fillStyle='rgba(0,0,0,'+(.05+hs(x,k+r)*.08)+')';c.beginPath();c.ellipse(x+8+hs(x+k,r)*(w-16),y+6+hs(r,x+k)*22,2+hs(k,x)*5,1+hs(k,r)*3,0,0,TAU);c.fill()}
    if(hs(x,r+21)>.86){c.strokeStyle='rgba(0,0,0,.45)';c.lineWidth=1;c.beginPath();c.moveTo(x+10+hs(x,r)*30,y+3);c.lineTo(x+18+hs(r,x)*30,y+14);c.lineTo(x+12+hs(x,r+1)*30,y+28);c.stroke()}}}
  // musgo y humedad abajo a la izquierda
  for(let i=0;i<26;i++){c.fillStyle='rgba(70,96,44,'+(.05+hs(i,4)*.08)+')';c.beginPath();c.ellipse(20+hs(i,1)*140,230+hs(i,2)*26,5+hs(i,3)*14,3+hs(i,5)*6,0,0,TAU);c.fill()}
  // estante con tarros y colgantes, desenfocados (profundidad de campo)
  c.save();c.globalAlpha=.6;
  c.fillStyle=lg(c,0,0,0,10,[[0,'#4a3220'],[1,'#2a1a10']]);c.fillRect(30,98,150,9);c.fillRect(470,70,150,9);
  [['#6a4a2a',40,70],['#7a3a2a',64,64],['#3a5a3a',90,72],['#8a7a4a',118,66],['#4a3a5a',146,72]].forEach(([col,x,h],i)=>{c.fillStyle=col;c.fillRect(x,98-h*.7,18,h*.7);c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x+12,98-h*.7,6,h*.7);c.fillStyle='#2a1a10';c.fillRect(x+2,98-h*.7-5,14,5)});
  for(let i=0;i<7;i++){c.strokeStyle='#3a2a1a';c.lineWidth=1.5;c.beginPath();c.moveTo(500+i*16,70);c.lineTo(500+i*16+2,88+hs(i,3)*18);c.stroke();c.fillStyle=['#5a7a34','#7a5a2a','#a07a3a','#4a6a3a'][i%4];c.beginPath();c.ellipse(500+i*16+2,98+hs(i,3)*18,5,10,0,0,TAU);c.fill()}
  c.fillStyle='#6a3a1a';[[560,150,24],[596,140,18]].forEach(([x,y,r])=>{c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.fillStyle='#8a5a2a';c.beginPath();c.arc(x-r*.25,y-r*.25,r*.5,0,TAU);c.fill();c.fillStyle='#6a3a1a'});
  c.restore();
  // MESA: tablero con perspectiva, veta, nudos, arañazos y canto iluminado
  const g=lg(c,0,258,0,H,[[0,'#6a4628'],[.2,'#52361e'],[1,'#1c120a']]);c.fillStyle=g;c.fillRect(0,258,W,H-258);
  for(let i=0;i<10;i++){const x=i*64;c.fillStyle='rgba(0,0,0,.4)';c.fillRect(x,258,2.5,H-258);c.fillStyle='rgba(255,220,160,.05)';c.fillRect(x+3,258,2,H-258)}
  for(let i=0;i<110;i++){const x=hs(i,1)*W,y=262+hs(i,2)*118,l=18+hs(i,3)*60;c.strokeStyle='rgba('+(hs(i,4)>.5?'0,0,0':'255,220,170')+','+(.05+hs(i,5)*.07)+')';c.lineWidth=.8;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+l*.3,y+hs(i,6)*3-1.5,x+l*.7,y+hs(i,7)*3-1.5,x+l,y);c.stroke()}
  for(let i=0;i<5;i++){const x=40+hs(i,8)*560,y=290+hs(i,9)*70;c.fillStyle='rgba(20,10,4,.35)';c.beginPath();c.ellipse(x,y,6,3.5,0,0,TAU);c.fill();c.strokeStyle='rgba(20,10,4,.25)';c.lineWidth=1;c.beginPath();c.ellipse(x,y,10,6,0,0,TAU);c.stroke()}
  c.fillStyle=lg(c,0,254,0,266,[[0,'rgba(0,0,0,.6)'],[1,'rgba(0,0,0,0)']]);c.fillRect(0,254,W,12);c.fillStyle='rgba(255,215,150,.22)';c.fillRect(0,258,W,1.5);
  for(let i=0;i<14;i++){c.fillStyle='rgba(255,230,190,.04)';c.fillRect(hs(i,11)*W,262+hs(i,12)*110,20+hs(i,13)*40,1)}
  grain(c,.4)})}
 // ── luz viva de la lumbre sobre la escena (aditiva, parpadea) ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 function light(c,t,pw,y0){const f=.85+.15*Math.sin(t*7.3)+.06*Math.sin(t*13.1+1);c.save();c.globalCompositeOperation='lighter';c.fillStyle=rg(c,320,y0||250,10,340,[[0,'rgba(255,140,50,'+(.30*pw*f).toFixed(3)+')'],[.45,'rgba(220,80,20,'+(.12*pw*f).toFixed(3)+')'],[1,'rgba(120,30,0,0)']]);c.fillRect(0,0,W,H);c.restore()}
 function finish(c){c.save();c.globalCompositeOperation='soft-light';c.globalAlpha=.34;c.drawImage(bake('gr',g=>{g.fillStyle=grainPat(g);g.fillRect(0,0,W,H)}),0,0,W,H);c.restore()}
 function vig(){return bake('vig',c=>{c.fillStyle=rg(c,W/2,H*.58,H*.3,H*.98,[[0,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,.66)']]);c.fillRect(0,0,W,H)})}
 // ── llamas: lenguas con degradado rojo→naranja→amarillo, núcleo claro y chispas; aditivas ───────────────────────────────────────────────────────────────────────────────────────────
 function flames(c,t,cx,by,w,hg,pw,n){n=n||7;c.save();c.globalCompositeOperation='lighter';
  c.fillStyle=rg(c,cx,by,4,w*.6,[[0,'rgba(255,120,30,'+(.4*pw).toFixed(2)+')'],[1,'rgba(255,60,0,0)']]);c.beginPath();c.ellipse(cx,by,w*.6,hg*.22,0,0,TAU);c.fill();
  for(let i=0;i<n;i++){const u=(i+.5)/n-.5,x=cx+u*w,ph=hs(i,3)*TAU,fl=.72+.28*Math.sin(t*6+ph)+.08*Math.sin(t*14+ph*2),hh=hg*pw*fl*(1-Math.abs(u)*.75),ww=w/n*2.4,sw=Math.sin(t*5+ph)*ww*.2;
   const tongue=(k,hk)=>{const H2=hh*hk,W2=ww*k;c.beginPath();c.moveTo(x-W2/2,by);c.bezierCurveTo(x-W2*.6,by-H2*.45,x-W2*.14+sw,by-H2*.72,x+sw*1.7,by-H2);c.bezierCurveTo(x+W2*.14+sw,by-H2*.72,x+W2*.6,by-H2*.45,x+W2/2,by);c.closePath()};
   const g=c.createLinearGradient(0,by,0,by-hh);g.addColorStop(0,'rgba(255,70,12,.6)');g.addColorStop(.4,'rgba(255,150,34,.55)');g.addColorStop(.8,'rgba(255,215,110,.25)');g.addColorStop(1,'rgba(255,240,170,0)');c.fillStyle=g;tongue(1,1);c.fill();
   const g2=c.createLinearGradient(0,by,0,by-hh*.6);g2.addColorStop(0,'rgba(255,255,225,.55)');g2.addColorStop(1,'rgba(255,230,140,0)');c.fillStyle=g2;tongue(.45,.6);c.fill()}
  for(let i=0;i<7;i++){const ph=(t*.9+hs(i,2))%1;c.fillStyle='rgba(255,'+(170+hs(i,5)*60|0)+',80,'+((1-ph)*.9).toFixed(2)+')';c.beginPath();c.arc(cx+(hs(i,1)-.5)*w*.9+Math.sin(ph*6+i)*6,by-ph*hg*1.2,1,0,TAU);c.fill()}c.restore()}
 function glowAt(c,x,y,r,a){c.save();c.globalCompositeOperation='lighter';c.fillStyle=rg(c,x,y,3,r,[[0,'rgba(255,150,50,'+a+')'],[1,'rgba(255,100,20,0)']]);c.fillRect(x-r,y-r,r*2,r*2);c.restore()}
 function steam(c,t,x,y,w,n,al){for(let i=0;i<n;i++){const ph=(t*.3+hs(i,7))%1,yy=y-ph*105,xx=x+(hs(i,8)-.5)*w+Math.sin(ph*6+i)*10,r=9+ph*28;c.fillStyle=rg(c,xx,yy,0,r,[[0,'rgba(255,255,255,'+((1-ph)*al*.34).toFixed(3)+')'],[1,'rgba(255,255,255,0)']]);c.beginPath();c.arc(xx,yy,r,0,TAU);c.fill()}}
 // ── metal de hierro colado (olla, sartén): degradado cilíndrico, martillado, hollín y reflejo ───────────────────────────────────────────────────────────────────────────────────────
 const IRON=[[0,'#0c0c10'],[.22,'#2c2c34'],[.4,'#585866'],[.52,'#3c3c46'],[.78,'#1a1a20'],[1,'#08080a']];
 const POT=c=>{c.beginPath();c.moveTo(210,164);c.bezierCurveTo(194,230,252,270,320,272);c.bezierCurveTo(388,270,446,230,430,164);c.closePath()};
 const hearth=c=>{[[236,276,36,15],[404,276,36,15],[320,284,46,16]].forEach(([x,y,rx,ry],i)=>{shadow(c,x,y+8,rx+8,ry+4,.5);c.fillStyle=lg(c,x-rx,y-ry,x+rx,y+ry,[[0,'#7a7468'],[.5,'#5a554c'],[1,'#2c2824']]);ell(c,x,y,rx,ry);c.fill();c.save();ell(c,x,y,rx,ry);c.clip();hammer(c,40+i,14,x-rx,y-ry,x+rx,y+ry,.05);c.restore();ell(c,x,y,rx,ry);ink(c,1.8);c.fillStyle='rgba(255,230,190,.18)';ell(c,x-rx*.2,y-ry*.35,rx*.6,ry*.3);c.fill()})};
 const BODY={
  g:c=>{hearth(c);shadow(c,320,278,150,20,.55);POT(c);c.fillStyle=lg(c,210,0,430,0,IRON);c.fill();
   c.save();POT(c);c.clip();c.fillStyle=lg(c,0,164,0,272,[[0,'rgba(0,0,0,0)'],[.55,'rgba(0,0,0,.12)'],[1,'rgba(0,0,0,.6)']]);c.fillRect(190,150,260,130);hammer(c,5,120,200,170,440,272,.032);
   c.strokeStyle='rgba(255,255,255,.28)';c.lineWidth=5;c.beginPath();c.moveTo(226,186);c.quadraticCurveTo(232,232,262,250);c.stroke();c.strokeStyle='rgba(255,255,255,.1)';c.lineWidth=2;c.beginPath();c.moveTo(236,180);c.quadraticCurveTo(244,226,274,246);c.stroke();
   for(let i=0;i<20;i++){c.fillStyle='rgba(0,0,0,'+(.06+hs(i,2)*.1)+')';c.beginPath();c.ellipse(260+hs(i,1)*120,232+hs(i,3)*34,10+hs(i,4)*20,3+hs(i,5)*5,0,0,TAU);c.fill()}   // hollín
   c.restore();POT(c);ink(c,2.6);
   // asas: argollas remachadas
   [[203,176],[437,176]].forEach(([x,y],i)=>{c.strokeStyle='#202026';c.lineWidth=7;c.beginPath();c.arc(x+(i?5:-5),y,10,0,TAU);c.stroke();c.strokeStyle='rgba(255,255,255,.22)';c.lineWidth=2;c.beginPath();c.arc(x+(i?5:-5),y,10,3.6,5);c.stroke();rivet(c,x+(i?-3:3),y-2,3.2)});
   // aro superior (labio) con interior oscuro
   ell(c,320,162,114,23);c.fillStyle=lg(c,206,0,434,0,[[0,'#101014'],[.3,'#4c4c58'],[.45,'#6a6a78'],[.7,'#2a2a32'],[1,'#0a0a0c']]);c.fill();ink(c,2.6);
   ell(c,320,163,100,16.5);c.fillStyle='#07070a';c.fill();ink(c,1.6,'#000');grain(c,.35)},
  s:c=>{   // sartén de hierro con trébede y mango de madera
   shadow(c,320,274,150,17,.55);
   [[196,226],[444,226]].forEach(([x,y])=>{c.strokeStyle='#1c1c22';c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.lineTo(x+(x<320?-12:12),276);c.stroke();c.strokeStyle='rgba(255,255,255,.14)';c.lineWidth=2;c.beginPath();c.moveTo(x-2,y+4);c.lineTo(x+(x<320?-12:12)-2,272);c.stroke()});
   ell(c,320,252,148,25);c.strokeStyle='#1c1c22';c.lineWidth=7;c.stroke();c.strokeStyle='rgba(255,255,255,.12)';c.lineWidth=2;ell(c,320,250,148,25);c.stroke();   // aro del trébede
   // mango de madera con veta, remaches y agujero
   c.save();c.translate(436,206);c.beginPath();c.moveTo(0,-8);c.lineTo(138,-6);c.quadraticCurveTo(152,2,138,10);c.lineTo(0,12);c.closePath();c.fillStyle=lg(c,0,-8,0,12,[[0,'#9a6a3a'],[.5,'#6a4222'],[1,'#3a2210']]);c.fill();
   c.save();c.clip();for(let i=0;i<14;i++){c.strokeStyle='rgba('+(i%2?'0,0,0':'255,220,170')+',.14)';c.lineWidth=.8;c.beginPath();c.moveTo(4,-6+i*1.4);c.bezierCurveTo(50,-6+i*1.4+hs(i,1)*3,90,-6+i*1.4-hs(i,2)*3,146,-4+i*1.2);c.stroke()}c.restore();c.beginPath();c.moveTo(0,-8);c.lineTo(138,-6);c.quadraticCurveTo(152,2,138,10);c.lineTo(0,12);c.closePath();ink(c,2.2);rivet(c,22,2,3.4);rivet(c,50,2,3.2);ell(c,134,2,4.5,3.5);c.fillStyle='#120a05';c.fill();c.restore();
   // cuerpo: pared exterior (cilindro) + borde + interior
   c.beginPath();c.moveTo(196,208);c.lineTo(196,222);c.bezierCurveTo(196,246,250,252,320,252);c.bezierCurveTo(390,252,444,246,444,222);c.lineTo(444,208);c.closePath();c.fillStyle=lg(c,196,0,444,0,IRON);c.fill();ink(c,2.4);
   c.save();c.clip();hammer(c,12,60,196,208,444,252,.05);c.restore();
   ell(c,320,208,126,35);c.fillStyle=lg(c,194,0,446,0,[[0,'#0e0e12'],[.3,'#52525e'],[.5,'#6a6a78'],[.75,'#26262e'],[1,'#0c0c0e']]);c.fill();ink(c,2.6);
   ell(c,320,209,112,27);c.fillStyle=rg(c,300,203,6,120,[[0,'#2e2e36'],[.7,'#15151a'],[1,'#08080a']]);c.fill();ink(c,1.6,'#000');grain(c,.32)},
  p:c=>{   // brasero de piedra con lecho de brasas y patas de hierro
   shadow(c,320,276,176,20,.55);
   [[176,226],[464,226]].forEach(([x,y])=>{c.fillStyle=lg(c,x-5,0,x+5,0,[[0,'#16161a'],[.5,'#4a4a56'],[1,'#0e0e12']]);c.fillRect(x-5,y,10,50);ink(c,1.8);c.fillStyle='#20202a';c.fillRect(x-9,y+46,18,6)});
   // cuba de piedra
   c.beginPath();c.moveTo(168,236);c.lineTo(472,236);c.lineTo(456,268);c.quadraticCurveTo(320,278,184,268);c.closePath();c.fillStyle=lg(c,0,236,0,272,[[0,'#6a655b'],[.3,'#4a463e'],[1,'#1e1b17']]);c.fill();c.save();c.clip();
   for(let r=0;r<3;r++)for(let x=-20+(r%2)*26;x<320;x+=52){c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=1.4;c.strokeRect(168+x,238+r*11,52,11);c.fillStyle='rgba(255,230,190,.05)';c.fillRect(168+x+1,239+r*11,50,2)}c.restore();
   c.beginPath();c.moveTo(168,236);c.lineTo(472,236);c.lineTo(456,268);c.quadraticCurveTo(320,278,184,268);c.closePath();ink(c,2.4);
   ell(c,320,236,152,20);c.fillStyle='#120a06';c.fill();ink(c,2);
   // lecho de brasas apagadas (el brillo es dinámico)
   for(let i=0;i<46;i++){const a=hs(i,1)*TAU,rr=hs(i,2),x=320+Math.cos(a)*rr*136,y=236+Math.sin(a)*rr*15,r=4+hs(i,3)*5;c.fillStyle=lg(c,x-r,y-r,x+r,y+r,[[0,'#3a2a22'],[1,'#120c0a']]);c.beginPath();c.ellipse(x,y,r,r*.7,hs(i,4)*3,0,TAU);c.fill();c.strokeStyle='rgba(0,0,0,.5)';c.lineWidth=.8;c.stroke()}
   for(let i=0;i<22;i++){c.fillStyle='rgba(190,180,170,'+(.08+hs(i,6)*.12)+')';c.beginPath();c.ellipse(190+hs(i,7)*260,230+hs(i,8)*12,3+hs(i,9)*6,1.5,0,0,TAU);c.fill()}   // ceniza
   GRATE(c);grain(c,.3)},
  h:c=>{   // horno de pan de piedra y yeso con chimenea
   shadow(c,320,272,210,18,.55);
   c.fillStyle=lg(c,296,0,344,0,[[0,'#2a241e'],[.5,'#4a4238'],[1,'#1c1814']]);c.fillRect(298,42,44,52);ink(c,2.2);c.fillStyle='#0a0806';ell(c,320,44,22,6);c.fill();
   const body=()=>{c.beginPath();c.moveTo(178,272);c.lineTo(178,152);c.quadraticCurveTo(178,78,320,78);c.quadraticCurveTo(462,78,462,152);c.lineTo(462,272);c.closePath()};
   body();c.fillStyle=lg(c,178,0,462,0,[[0,'#3a342c'],[.3,'#7a6e5e'],[.5,'#8a7e6c'],[.8,'#4a4238'],[1,'#241f1a']]);c.fill();c.save();body();c.clip();
   for(let r=0;r<10;r++){const y=84+r*19,off=(r%2)*22;for(let x=170-off;x<470;x+=44){const l=.8+hs(x,r)*.4;c.fillStyle='rgba('+(l>1?'255,235,200':'0,0,0')+','+Math.abs(l-1)*.22+')';c.fillRect(x+1,y+1,42,17);c.strokeStyle='rgba(0,0,0,.42)';c.lineWidth=1.3;c.strokeRect(x,y,44,19);c.fillStyle='rgba(255,235,200,.1)';c.fillRect(x+1,y+1,42,2)}}
   c.fillStyle=lg(c,0,78,0,272,[[0,'rgba(255,235,200,.12)'],[.4,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,.45)']]);c.fillRect(170,70,300,210);
   c.fillStyle=rg(c,320,130,4,70,[[0,'rgba(10,6,3,.7)'],[1,'rgba(10,6,3,0)']]);c.fillRect(230,100,180,90);   // hollín sobre la boca
   c.restore();body();ink(c,2.8);
   // boca (interior oscuro)
   c.beginPath();c.moveTo(236,272);c.lineTo(236,174);c.quadraticCurveTo(236,128,320,128);c.quadraticCurveTo(404,128,404,174);c.lineTo(404,272);c.closePath();c.fillStyle='#0a0604';c.fill();grain(c,.3)}};
 const GRATE=c=>{
   for(let i=0;i<14;i++){const x=192+i*19.6;c.strokeStyle='rgba(10,10,14,.85)';c.lineWidth=2;c.beginPath();c.moveTo(x-(i-6.5)*.5,200);c.lineTo(x+(i-6.5)*.9,226);c.stroke()}
   for(let r=0;r<5;r++){const y=200+r*6.4,x0=190-r*2.6,x1=450+r*2.6;c.fillStyle=lg(c,0,y-2.3,0,y+2.3,[[0,'#8a8a96'],[.45,'#4a4a56'],[1,'#121216']]);c.fillRect(x0,y-2.3,x1-x0,4.6);c.strokeStyle='rgba(0,0,0,.7)';c.lineWidth=.9;c.strokeRect(x0,y-2.3,x1-x0,4.6);c.fillStyle='rgba(255,255,255,.28)';c.fillRect(x0+4,y-1.8,x1-x0-8,1)}
   [[190,-1],[450,1]].forEach(([x,d])=>{c.strokeStyle='#1a1a20';c.lineWidth=5;c.beginPath();c.moveTo(x,198);c.lineTo(x+d*13,228);c.stroke();c.strokeStyle='rgba(255,255,255,.2)';c.lineWidth=1.4;c.beginPath();c.moveTo(x-1,198);c.lineTo(x+d*13-1,228);c.stroke()})}
 const FRONT={
  g:c=>{   // labio delantero de la olla (media elipse inferior) con brillo
   c.beginPath();c.ellipse(320,162,114,23,0,0,Math.PI);c.ellipse(320,163,100,16.5,0,Math.PI,0,true);c.closePath();c.fillStyle=lg(c,206,0,434,0,[[0,'#16161a'],[.3,'#5a5a68'],[.45,'#7c7c8a'],[.7,'#30303a'],[1,'#101014']]);c.fill();ink(c,2);
   c.strokeStyle='rgba(255,255,255,.28)';c.lineWidth=2;c.beginPath();c.ellipse(320,160,110,21,0,.25,1.2);c.stroke()},
  s:c=>{c.strokeStyle='rgba(255,255,255,.16)';c.lineWidth=2.4;c.beginPath();c.ellipse(320,208,124,33,0,.35,1.7);c.stroke()},
  p:c=>{},   // la rejilla va en el CUERPO: la comida se apoya ENCIMA de las barras
  h:c=>{   // arco de dovelas que enmarca la boca (por delante de la comida)
   const outer=()=>{c.moveTo(220,272);c.lineTo(220,174);c.quadraticCurveTo(220,114,320,114);c.quadraticCurveTo(420,114,420,174);c.lineTo(420,272);c.lineTo(404,272);c.lineTo(404,174);c.quadraticCurveTo(404,128,320,128);c.quadraticCurveTo(236,128,236,174);c.lineTo(236,272);c.closePath()};
   c.beginPath();outer();c.fillStyle=lg(c,220,0,420,0,[[0,'#5a5044'],[.5,'#9a8c76'],[1,'#4a4238']]);c.fill();c.save();c.beginPath();outer();c.clip();
   for(let i=0;i<13;i++){const a=Math.PI+i*Math.PI/12,x0=320+Math.cos(a)*84,y0=176+Math.sin(a)*60,x1=320+Math.cos(a)*108,y1=176+Math.sin(a)*70;c.strokeStyle='rgba(0,0,0,.5)';c.lineWidth=1.6;c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke()}c.restore();c.beginPath();outer();ink(c,2.4);
   c.fillStyle=lg(c,0,252,0,272,[[0,'#2c2620'],[1,'#12100c']]);c.fillRect(236,252,168,20);c.fillStyle='rgba(255,230,190,.14)';c.fillRect(236,252,168,2)}};
 // ── parte VIVA por método ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 function fireBack(c,m,t,pw){if(m==='g')flames(c,t,320,270,196,86,pw);else if(m==='s')flames(c,t,320,262,200,86,pw)}
 // m: g líquido de la olla · s aceite de la sartén · p brasas + llamas bajo la parrilla · h fuego dentro del horno
 function surface(c,m,t,pw,liq,steamK){
  if(m==='g'){c.save();ell(c,320,163,98,15);c.clip();c.fillStyle=liq;c.fillRect(220,140,200,50);c.fillStyle=rg(c,320,160,10,104,[[0,'rgba(255,255,255,.12)'],[.6,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,.55)']]);c.fillRect(220,140,200,50);
   for(let i=0;i<5;i++){const a=t*(.4+i*.07)+i;c.strokeStyle='rgba(255,235,190,'+(.1+.05*Math.sin(t*2+i)).toFixed(2)+')';c.lineWidth=1.4;c.beginPath();c.ellipse(320,163,30+i*13,4+i*2.2,0,a,a+1.5);c.stroke()}
   c.fillStyle='rgba(255,255,255,.2)';ell(c,296+Math.sin(t*1.4)*6,157,52,5);c.fill();
   for(let i=0;i<14;i++){const a=hs(i,1)*TAU,x=320+Math.cos(a)*(88+hs(i,2)*6),y=163+Math.sin(a)*(13+hs(i,3)),r=1.2+hs(i,4)*2.2;c.fillStyle='rgba(255,245,220,'+(.35+.3*Math.sin(t*3+i)).toFixed(2)+')';c.beginPath();c.arc(x,y,r,0,TAU);c.fill()}
   c.restore();ell(c,320,163,98,15);ink(c,1.2,'rgba(0,0,0,.6)')}
  else if(m==='s'){c.save();ell(c,320,209,110,26);c.clip();c.fillStyle='rgba(120,70,20,'+(.3*pw).toFixed(2)+')';c.fillRect(200,180,240,60);
   c.fillStyle='rgba(255,215,130,'+(.14+.06*Math.sin(t*3)).toFixed(2)+')';ell(c,296+Math.sin(t*1.2)*8,203,58,8);c.fill();c.fillStyle='rgba(255,240,200,.18)';ell(c,350,214,26,4);c.fill();
   for(let i=0;i<9;i++){const x=232+hs(i,1)*176,y=204+hs(i,2)*14,r=1+hs(i,3)*2;c.strokeStyle='rgba(255,230,160,'+(.3+.3*Math.sin(t*6+i*2)).toFixed(2)+')';c.lineWidth=1;c.beginPath();c.arc(x,y,r+1,0,TAU);c.stroke()}c.restore()}
  else if(m==='p'){glowAt(c,320,238,180,.55*pw);c.save();ell(c,320,236,150,18);c.clip();for(let i=0;i<46;i++){const a=hs(i,1)*TAU,rr=hs(i,2),x=320+Math.cos(a)*rr*136,y=236+Math.sin(a)*rr*15,f=.5+.5*Math.sin(t*(2+hs(i,5)*3)+i*2);c.fillStyle='rgba(255,'+(70+f*110|0)+',20,'+(.35+.5*f*pw).toFixed(2)+')';c.beginPath();c.ellipse(x,y,3+hs(i,3)*4,2+hs(i,3)*2,0,0,TAU);c.fill()}c.restore();flames(c,t,320,240,250,46,pw*.85,11)}
  else{c.save();c.beginPath();c.moveTo(236,272);c.lineTo(236,174);c.quadraticCurveTo(236,128,320,128);c.quadraticCurveTo(404,128,404,174);c.lineTo(404,272);c.closePath();c.clip();
   c.fillStyle=rg(c,320,262,8,150,[[0,'rgba(255,200,90,'+(.95*Math.min(1,pw)).toFixed(2)+')'],[.4,'rgba(210,80,20,'+(.8*Math.min(1,pw)).toFixed(2)+')'],[1,'rgba(40,14,6,.95)']]);c.fillRect(220,120,200,160);flames(c,t,320,264,150,92,pw,8);
   c.fillStyle=lg(c,0,248,0,262,[[0,'#3a342e'],[1,'#17120e']]);c.fillRect(236,250,168,22);c.fillStyle='rgba(255,170,70,.25)';c.fillRect(236,250,168,2);c.restore()}}
 // ── tabla de cortar, cuchillo, plato y salero ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 function board(c){shadow(c,320,368,160,12,.5);c.fillStyle=lg(c,0,298,0,366,[[0,'#b08050'],[.12,'#9a6c40'],[1,'#6a4424']]);c.beginPath();c.moveTo(170,304);c.lineTo(470,304);c.lineTo(478,362);c.lineTo(162,362);c.closePath();c.fill();
  c.save();c.clip();for(let i=0;i<16;i++){c.strokeStyle='rgba('+(i%3?'60,34,14':'255,225,170')+','+(.12+hs(i,2)*.1)+')';c.lineWidth=.9+hs(i,3);c.beginPath();c.moveTo(166,306+i*3.6);c.bezierCurveTo(250,306+i*3.6+hs(i,4)*3,390,306+i*3.6-hs(i,5)*3,474,306+i*3.6);c.stroke()}
  for(let i=0;i<24;i++){c.strokeStyle='rgba(30,16,6,'+(.12+hs(i,7)*.16)+')';c.lineWidth=.7;const x=190+hs(i,8)*260,y=312+hs(i,9)*40;c.beginPath();c.moveTo(x,y);c.lineTo(x+10+hs(i,10)*20,y+hs(i,11)*8-4);c.stroke()}
  c.fillStyle='rgba(140,30,20,.12)';ell(c,300,336,40,12);c.fill();c.fillStyle='rgba(255,230,180,.22)';c.fillRect(160,304,320,3);grainIn(c,.4);c.restore();
  c.beginPath();c.moveTo(170,304);c.lineTo(470,304);c.lineTo(478,362);c.lineTo(162,362);c.closePath();ink(c,2.4);c.fillStyle='#4a2c14';c.beginPath();c.moveTo(162,362);c.lineTo(478,362);c.lineTo(478,368);c.lineTo(162,368);c.closePath();c.fill();ink(c,1.8)}
 let KP=null;
 function knifeDraw(c,x,y,a){c.save();c.translate(x,y);c.rotate(a);const bl=()=>{c.beginPath();c.moveTo(0,0);c.lineTo(88,-8);c.quadraticCurveTo(102,6,0,17);c.closePath()};
  c.fillStyle=lg(c,0,-8,0,17,[[0,'#f4f8ff'],[.3,'#c4ccd8'],[.62,'#8a94a4'],[1,'#586070']]);bl();c.fill();c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.moveTo(4,0);c.lineTo(84,-7);c.lineTo(84,-5);c.lineTo(4,2);c.fill();bl();ink(c,1.8);
  c.fillStyle=lg(c,0,-1,0,16,[[0,'#8a5a30'],[1,'#3a2210']]);c.beginPath();c.moveTo(-52,0);c.lineTo(-3,-1);c.lineTo(-3,17);c.lineTo(-52,15);c.closePath();c.fill();ink(c,1.8);c.fillStyle='#b8a86a';c.fillRect(-6,-2,5,20);ink(c,1.2);rivet(c,-22,8,2.6);rivet(c,-38,7.5,2.4);c.restore()}
 // el cuchillo deja una estela de 2 imágenes tenues cuando se mueve deprisa (sensación de golpe rápido)
 function knife(c,x,y,a){if(KP){const dx=x-KP.x,dy=y-KP.y;if(Math.abs(dx)+Math.abs(dy)>1.2)for(let k=1;k<=2;k++){c.save();c.globalAlpha=.17/k;knifeDraw(c,x-dx*k*1.7,y-dy*k*1.7,a);c.restore()}}KP={x,y};knifeDraw(c,x,y,a)}
 const knifeReset=()=>{KP=null};
 function plate(c,x,y,sc,col,al,t){c.save();c.globalAlpha=al;c.translate(x,y);c.scale(sc,sc);shadow(c,0,16,112,18,.55);
  c.fillStyle=lg(c,0,-26,0,26,[[0,'#fdf8ec'],[1,'#c8bea8']]);ell(c,0,0,102,27);c.fill();ink(c,2.4);
  c.strokeStyle='#4a6a8a';c.lineWidth=2.6;ell(c,0,-1,90,23);c.stroke();c.strokeStyle='rgba(74,106,138,.5)';c.lineWidth=1;ell(c,0,-1,84,21);c.stroke();
  c.fillStyle=lg(c,0,-16,0,16,[[0,'#efe6d2'],[1,'#d4c8b0']]);ell(c,0,-1,72,17);c.fill();c.strokeStyle='rgba(0,0,0,.22)';c.lineWidth=1;c.stroke();
  c.fillStyle='rgba(255,255,255,.5)';c.beginPath();c.ellipse(-52,-12,26,4,-.2,0,TAU);c.fill();
  c.fillStyle=rg(c,-8,-14,2,56,[[0,col],[1,'#2a1a0c']]);ell(c,0,-9,50,17);c.fill();ink(c,2.2);c.fillStyle='rgba(255,255,255,.22)';ell(c,-14,-15,26,5);c.fill();
  [[-16,-22,.2],[6,-25,-.5],[22,-18,.9]].forEach(([a,b,r],i)=>{c.fillStyle=['#5c9a3a','#74b048','#4a8a30'][i];c.beginPath();c.ellipse(a,b,10,4.2,r,0,TAU);c.fill();ink(c,1.5);c.strokeStyle='rgba(0,0,0,.3)';c.lineWidth=.8;c.beginPath();c.moveTo(a-7,b);c.lineTo(a+7,b);c.stroke()});c.restore()}
 function shaker(c,col,t,ang){c.save();c.translate(320,52);c.rotate(ang);c.fillStyle=lg(c,-15,0,15,0,[[0,'rgba(210,225,235,.55)'],[.4,'rgba(245,250,255,.7)'],[1,'rgba(150,170,185,.6)']]);c.beginPath();c.moveTo(-14,-14);c.lineTo(14,-14);c.lineTo(16,22);c.quadraticCurveTo(0,28,-16,22);c.closePath();c.fill();c.save();c.clip();c.fillStyle=col;c.fillRect(-18,2,36,30);c.fillStyle='rgba(255,255,255,.3)';c.fillRect(-12,-12,4,32);c.restore();c.beginPath();c.moveTo(-14,-14);c.lineTo(14,-14);c.lineTo(16,22);c.quadraticCurveTo(0,28,-16,22);c.closePath();ink(c,1.8);
  c.fillStyle=lg(c,-15,0,15,0,[[0,'#7a6a4a'],[.4,'#d8c898'],[1,'#5a4a30']]);c.fillRect(-15,-24,30,11);ink(c,1.8);for(let i=0;i<5;i++){c.fillStyle='#2a1c0c';c.beginPath();c.arc(-8+i*4,-19,1,0,TAU);c.fill()}c.restore()}
 return{bg,vig,finish,light,flames,glowAt,steam,fireBack,surface,body:m=>bake('B_'+m,BODY[m]),front:m=>bake('F_'+m,FRONT[m]),board,knife,knifeReset,plate,shaker}
})();
