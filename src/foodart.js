// NotScape · ARTE DE COMIDA 2D del minijuego de Cocina (27 oct 2026). Global `FART`. Cada ingrediente tiene una forma propia y apetitosa (filete con grasa y vetas, muslo con hueso, filete de pescado con piel y escamas,
// camarón curvo, huevo, seta, mantequilla, arroz…) y cambia con el PUNTO DE COCCIÓN `d` (0 crudo · .6 dorado · .9 tostado · 1.2 quemado): color por tramos, corteza oscura en los bordes, brillo jugoso mientras se hace
// y manchas negras al quemarse. Mismo lenguaje del resto del minijuego: contorno de tinta `#2a1a0e`, brillo arriba-izquierda, sombra suave. Lo que no tiene forma propia (hierbas, huesos, cristales) lo sigue dibujando `ALQ.gfx.drawChunk`.
// API: `FART.has(id)`, `FART.draw(c, id, {r, a, d, t})` (dibuja centrado en 0,0 con radio ≈ r px; el llamador traslada), `FART.tone(base, d)`.
const FART=(()=>{const OL='#2a1a0e',TAU=Math.PI*2,cl=(v,a,b)=>Math.max(a,Math.min(b,v));
 const hx=h=>{h=h.replace('#','');return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]},mx=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t],rgb=(c,a)=>'rgba('+Math.round(c[0])+','+Math.round(c[1])+','+Math.round(c[2])+','+(a==null?1:a)+')';
 const GOLD=[222,160,70],BROWN=[126,74,34],BURN=[34,24,18];
 // color a lo largo de la cocción: crudo → dorado → tostado → quemado (la parte «magra»; la grasa y la clara cambian menos)
 const tone=(base,d,k)=>{k=k==null?1:k;const g=mx(base,GOLD,.6*k),b=mx(g,BROWN,.8);return d<.6?mx(base,g,d/.6):d<.9?mx(g,b,(d-.6)/.3):mx(b,BURN,cl((d-.9)/.3,0,1))};
 const lit=(c,t)=>mx(c,[255,255,255],t),drk=(c,t)=>mx(c,[0,0,0],t);
 // base cruda por ingrediente
 const RAW={carne:'#bc423e',carne_jab:'#a63c36',carne_yak:'#9c4640',carne_lag:'#b04a3e',carne_oso:'#8a3a36',carne_gig:'#9c3e48',
  sardina:'#b8c4cc',arenque:'#aab8c4',trucha:'#e8a090',salmon:'#f08a6a',atun:'#b03a42',lucio:'#e6dcc8',pmagma:'#f08a3a',pezespada:'#e4c8c0',manta:'#c8b0d0',kraken:'#9a70b0',
  pollo:'#f0cfa8',ancas:'#f0d0bc',camaron:'#a8b4c0',hongo:'#c8b090',grasa:'#f4e49a',arroz:'#f4ecd6',huevo:'#f6efe0'};
 const FISH=/^(sardina|arenque|trucha|salmon|atun|lucio|pmagma|pezespada|manta|kraken)$/;
 const kind=id=>{const b=String(id).split('~')[0];return /^carne/.test(b)?'steak':b==='pollo'?'drum':b==='ancas'?'frog':b==='camaron'?'shrimp':FISH.test(b)?'fish':b==='huevo'?'egg':b==='hongo'?'mush':b==='grasa'?'butter':b==='arroz'?'rice':null};
 const base=id=>hx(RAW[String(id).split('~')[0]]||'#c8a070'),has=id=>!!kind(id);
 // utilidades de forma: relleno con volumen (degradado luz→sombra), contorno de tinta y brillo
 const vol=(c,col,x0,y0,x1,y1)=>{const g=c.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,rgb(lit(col,.28)));g.addColorStop(.55,rgb(col));g.addColorStop(1,rgb(drk(col,.34)));c.fillStyle=g};
 let SC=1;const ink=(c,w)=>{c.strokeStyle=OL;c.lineWidth=(w||1.8)/Math.sqrt(Math.max(1,SC));c.lineJoin='round';c.stroke()};
 const gloss=(c,x,y,rx,ry,rot,a)=>{c.fillStyle='rgba(255,246,220,'+a+')';c.beginPath();c.ellipse(x,y,rx,ry,rot,0,TAU);c.fill()};
 // determinista por posición/id (sin Math.random en el dibujo: las piezas no «parpadean»)
 const hs=(n,i)=>{const v=Math.sin(n*127.1+i*311.7)*43758.5453;return v-Math.floor(v)};
 function steak(c,id,d,t){const col=tone(base(id),d),fat=mx(hx('#f6ecd0'),GOLD,cl(d*.6,0,.5)),cr=drk(col,.28+.2*cl(d,0,1));
  const P=()=>{c.beginPath();c.moveTo(-15,-3);c.bezierCurveTo(-17,-12,-6,-15,2,-13);c.bezierCurveTo(10,-14,17,-8,16,0);c.bezierCurveTo(17,9,8,14,-1,13);c.bezierCurveTo(-10,14,-16,8,-15,-3);c.closePath()};
  c.save();P();c.fillStyle='rgba(0,0,0,.18)';c.translate(1.5,2);c.fill();c.restore();
  P();const rg=c.createRadialGradient(-4,-5,2,0,0,19);rg.addColorStop(0,rgb(lit(col,.18)));rg.addColorStop(.62,rgb(col));rg.addColorStop(1,rgb(cr));c.fillStyle=rg;c.fill();ink(c,1.9);
  c.save();P();c.clip();   // fibras de la carne, borde de grasa, vetas y corteza
  c.strokeStyle=rgb(drk(col,.22),.35);c.lineWidth=.8;for(let k=0;k<13;k++){const y=-12+k*2;c.beginPath();c.moveTo(-16,y+hs(3,k)*2);c.quadraticCurveTo(0,y-2+hs(5,k)*4,16,y+1+hs(7,k)*2);c.stroke()}
  c.fillStyle=rgb(lit(mx(col,fat,.5),.1),.55);for(let k=0;k<7;k++){c.beginPath();c.ellipse(-9+hs(21,k)*20,-8+hs(23,k)*17,1+hs(25,k)*1.6,.6+hs(27,k)*.6,hs(29,k)*3,0,TAU);c.fill()}
  c.strokeStyle=rgb(fat);c.lineWidth=3.4;c.beginPath();c.moveTo(-14,4);c.bezierCurveTo(-17,-10,-4,-16,6,-13);c.stroke();
  c.strokeStyle=rgb(lit(col,.38),.75);c.lineWidth=1.3;[[-8,2,-2,-4,4,-2],[-5,8,2,3,9,5],[0,-9,5,-6,9,-9]].forEach(v=>{c.beginPath();c.moveTo(v[0],v[1]);c.quadraticCurveTo(v[2],v[3],v[4],v[5]);c.stroke()});
  if(d>.45){c.strokeStyle='rgba(60,28,10,'+cl((d-.35)*.9,0,.55)+')';c.lineWidth=2.4;[-6,0,6].forEach(y=>{c.beginPath();c.moveTo(-13,y+4);c.lineTo(13,y-3);c.stroke()})}   // marcas de parrilla al hacerse
  if(d>1){c.fillStyle='rgba(18,12,10,.55)';for(let k=0;k<6;k++){c.beginPath();c.arc(-9+hs(7,k)*18,-8+hs(9,k)*16,1.8+hs(3,k)*1.8,0,TAU);c.fill()}}c.restore();
  if(d>.08&&d<.95)gloss(c,-5,-6,6.5,2.6,-.5,.26+.12*Math.sin(t*3));}
 function drum(c,id,d,t){const col=tone(base(id),d,1.1),bone=hx('#f2ead6');
  c.save();c.rotate(.55);c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(2,2.5,14,10.5,0,0,TAU);c.fill();
  c.strokeStyle=rgb(bone);c.lineWidth=4;c.lineCap='round';c.beginPath();c.moveTo(9,0);c.lineTo(21,0);c.stroke();ink(c,0);c.strokeStyle=OL;c.lineWidth=6.2;c.globalCompositeOperation='destination-over';c.beginPath();c.moveTo(9,0);c.lineTo(21,0);c.stroke();c.globalCompositeOperation='source-over';c.strokeStyle=rgb(bone);c.lineWidth=4;c.beginPath();c.moveTo(9,0);c.lineTo(21,0);c.stroke();
  [[22,-2.4],[22,2.4]].forEach(([x,y])=>{c.fillStyle=rgb(bone);c.beginPath();c.arc(x,y,2.8,0,TAU);c.fill();c.strokeStyle=OL;c.lineWidth=1.5;c.stroke()});
  c.beginPath();c.moveTo(-13,-2);c.bezierCurveTo(-14,-11,-2,-12,6,-8);c.bezierCurveTo(10,-4,10,4,6,8);c.bezierCurveTo(-2,13,-14,10,-13,-2);c.closePath();vol(c,col,-10,-10,8,10);c.fill();ink(c,1.9);
  c.save();c.clip();c.strokeStyle=rgb(drk(col,.3),.55);c.lineWidth=1.5;[-6,-1,4].forEach(y=>{c.beginPath();c.moveTo(-12,y);c.quadraticCurveTo(-2,y-3,8,y+1);c.stroke()});c.restore();
  if(d>.08&&d<.95)gloss(c,-5,-5,5,2.2,-.4,.3+.1*Math.sin(t*3));c.restore()}
 function frog(c,id,d,t){const col=tone(base(id),d);[-1,1].forEach(s=>{c.save();c.rotate(s*.5);c.translate(s*4,0);c.fillStyle='rgba(0,0,0,.16)';c.beginPath();c.ellipse(1,2.5,5.5,10,0,0,TAU);c.fill();
   c.strokeStyle=OL;c.lineWidth=5.4;c.lineCap='round';c.beginPath();c.moveTo(0,8);c.lineTo(0,17);c.stroke();c.strokeStyle=rgb(lit(col,.1));c.lineWidth=3;c.beginPath();c.moveTo(0,8);c.lineTo(0,17);c.stroke();
   c.beginPath();c.ellipse(0,0,5.6,10,0,0,TAU);vol(c,col,-4,-9,4,9);c.fill();ink(c,1.7);gloss(c,-1.8,-4,1.8,4.5,0,d<.9?.3:0);c.restore()})}
 function shrimp(c,id,d,t){const raw=hx('#c4b0b4'),col=tone(mx(raw,hx('#f0784f'),cl(d*3,0,1)),d*.55,.45),shell=drk(col,.18),belly=lit(col,.3);
  c.save();c.rotate(-.25);c.fillStyle='rgba(0,0,0,.17)';c.beginPath();c.ellipse(2,4,17,9,0,0,TAU);c.fill();
  // patitas
  c.strokeStyle=rgb(drk(col,.3));c.lineWidth=1.1;for(let k=0;k<5;k++){const a=-2.1+k*.55,x=Math.cos(a)*11,y=2+Math.sin(a)*11;c.beginPath();c.moveTo(x,y);c.lineTo(x*1.2,y*1.2+3);c.stroke()}
  // abanico de la cola (3 lóbulos)
  [-.5,0,.5].forEach(a=>{c.save();c.translate(15,9);c.rotate(.9+a);c.beginPath();c.ellipse(0,5.5,3,6.5,0,0,TAU);vol(c,shell,-3,0,3,12);c.fill();ink(c,1.3);c.restore()});
  // cuerpo en C: segmentos con bandas
  const N=7;for(let i=0;i<N;i++){const u=i/(N-1),a=-2.5+u*2.9,x=Math.cos(a)*11.5,y=2+Math.sin(a)*11.5,r=4.2+Math.sin(u*Math.PI)*3;c.beginPath();c.arc(x,y,r,0,TAU);vol(c,i%2?col:shell,x-r,y-r,x+r,y+r);c.fill();ink(c,1.4)}
  c.strokeStyle=rgb(belly,.55);c.lineWidth=1.3;c.beginPath();c.arc(0,2,8.4,-2.3,.3);c.stroke();
  // cabeza: ojo y antenas
  c.beginPath();c.ellipse(-12.5,-3,5,4.2,-.5,0,TAU);vol(c,col,-17,-7,-8,1);c.fill();ink(c,1.5);c.fillStyle='#1a1210';c.beginPath();c.arc(-13.8,-4.2,1.2,0,TAU);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(-14.2,-4.6,.4,0,TAU);c.fill();
  c.strokeStyle=OL;c.lineWidth=1;c.beginPath();c.moveTo(-15,-6);c.quadraticCurveTo(-22,-12,-26,-9);c.moveTo(-16,-4);c.quadraticCurveTo(-24,-5,-27,0);c.stroke();
  if(d>.05&&d<.95)gloss(c,-4,-8,4.5,1.6,-.3,.3);c.restore()}
 function fish(c,id,d,t){const raw=base(id),col=tone(raw,d,.9),skin=drk(mx(raw,[60,70,90],.55),.1),flake=lit(col,.3);
  const P=()=>{c.beginPath();c.moveTo(-20,1);c.bezierCurveTo(-14,-9,0,-12,10,-9);c.bezierCurveTo(16,-8,20,-4,20,0);c.bezierCurveTo(20,5,15,9,8,10);c.bezierCurveTo(-2,12,-14,9,-20,1);c.closePath()};
  c.save();P();c.fillStyle='rgba(0,0,0,.17)';c.translate(1.5,2.5);c.fill();c.restore();P();vol(c,col,-14,-10,12,12);c.fill();ink(c,1.9);
  c.save();P();c.clip();c.strokeStyle=rgb(skin);c.lineWidth=3.4;c.beginPath();c.moveTo(-20,8);c.bezierCurveTo(-8,13,6,12,20,5);c.stroke();   // piel plateada en el borde
  c.strokeStyle=rgb(flake,.7);c.lineWidth=1.3;for(let k=0;k<6;k++){const x=-13+k*5.6;c.beginPath();c.moveTo(x,-8+Math.abs(k-2.5)*.6);c.quadraticCurveTo(x+3,0,x-1,8);c.stroke()}   // lascas
  c.strokeStyle=rgb(lit(col,.5),.55);c.lineWidth=1;c.beginPath();c.moveTo(-18,0);c.lineTo(17,-1);c.stroke();
  if(d>.5){c.strokeStyle='rgba(60,28,10,'+cl((d-.4)*.8,0,.5)+')';c.lineWidth=2;[-3,3].forEach(y=>{c.beginPath();c.moveTo(-15,y+3);c.lineTo(15,y-2);c.stroke()})}
  if(d>1){c.fillStyle='rgba(18,12,10,.55)';for(let k=0;k<6;k++){c.beginPath();c.arc(-12+hs(5,k)*24,-6+hs(8,k)*14,1.6+hs(2,k)*1.6,0,TAU);c.fill()}}c.restore();
  if(d>.08&&d<.95)gloss(c,-4,-5,7,2.2,-.15,.28+.1*Math.sin(t*3))}
 function egg(c,id,d,t){if(d<.12){c.fillStyle='rgba(0,0,0,.16)';c.beginPath();c.ellipse(1.5,3,10,12.5,0,0,TAU);c.fill();c.beginPath();c.ellipse(0,0,9.5,12,0,0,TAU);vol(c,hx('#f0e4cc'),-6,-10,8,10);c.fill();ink(c,1.8);gloss(c,-3.5,-5,2.4,4.4,-.3,.5);return}
  const white=mx(hx('#fffaf0'),hx('#e8c068'),cl((d-.4)*1.2,0,.7)),yolk=tone(hx('#f4b830'),d*.6,.6);   // huevo frito: clara irregular y yema
  c.fillStyle='rgba(0,0,0,.16)';c.beginPath();c.ellipse(1.5,3,16,12,0,0,TAU);c.fill();c.beginPath();c.moveTo(-14,0);c.bezierCurveTo(-16,-10,-4,-13,3,-11);c.bezierCurveTo(12,-13,18,-4,15,3);c.bezierCurveTo(17,11,6,14,-2,12);c.bezierCurveTo(-11,14,-15,8,-14,0);c.closePath();vol(c,white,-10,-10,10,10);c.fill();ink(c,1.7);
  if(d>.5){c.strokeStyle='rgba(150,90,30,'+cl((d-.4)*.7,0,.6)+')';c.lineWidth=2;c.stroke()}c.beginPath();c.arc(-1,0,6,0,TAU);vol(c,yolk,-5,-5,5,5);c.fill();ink(c,1.5);gloss(c,-3,-2.5,2,1.3,-.5,.55)}
 function mush(c,id,d,t){const cap=tone(hx('#b88a5a'),d,.7),stem=tone(hx('#efe2c6'),d*.7,.5);c.fillStyle='rgba(0,0,0,.17)';c.beginPath();c.ellipse(1.5,3,12,8,0,0,TAU);c.fill();
  c.beginPath();c.moveTo(-4,0);c.lineTo(-5,12);c.quadraticCurveTo(0,15,5,12);c.lineTo(4,0);c.closePath();vol(c,stem,-5,0,5,12);c.fill();ink(c,1.6);
  c.beginPath();c.moveTo(-15,2);c.bezierCurveTo(-16,-12,-6,-15,0,-15);c.bezierCurveTo(6,-15,16,-12,15,2);c.quadraticCurveTo(0,6,-15,2);c.closePath();vol(c,cap,-12,-14,12,4);c.fill();ink(c,1.8);
  c.fillStyle='rgba(255,240,210,.55)';[[-6,-8,1.8],[3,-10,1.5],[8,-4,1.7],[-2,-3,1.2]].forEach(([x,y,r])=>{c.beginPath();c.arc(x,y,r,0,TAU);c.fill()});if(d>.1&&d<.95)gloss(c,-6,-10,5,1.8,-.25,.3)}
 function butter(c,id,d,t){const col=tone(hx('#f6e48e'),d*.5,.4),melt=cl((d-.15)*1.4,0,1);c.fillStyle='rgba(0,0,0,.15)';c.beginPath();c.ellipse(1.5,3,13,9,0,0,TAU);c.fill();
  if(melt>0){c.fillStyle='rgba(250,222,110,'+(.55*melt)+')';c.beginPath();c.ellipse(0,3,10+melt*8,6+melt*4,0,0,TAU);c.fill();c.strokeStyle='rgba(120,80,20,.5)';c.lineWidth=1.2;c.stroke()}
  const s=1-.45*melt;c.save();c.scale(s,s);c.beginPath();c.moveTo(-11,-6);c.lineTo(10,-6);c.lineTo(12,5);c.lineTo(-12,5);c.closePath();vol(c,col,-10,-6,10,6);c.fill();ink(c,1.8);c.fillStyle=rgb(lit(col,.45));c.beginPath();c.moveTo(-11,-6);c.lineTo(10,-6);c.lineTo(8,-9);c.lineTo(-9,-9);c.closePath();c.fill();ink(c,1.4);gloss(c,-4,-1,4,1.4,0,.5);c.restore()}
 function rice(c,id,d,t){const col=tone(base(id),d*.9,.6);c.fillStyle='rgba(0,0,0,.14)';c.beginPath();c.ellipse(1.5,3,15,9,0,0,TAU);c.fill();
  for(let k=0;k<22;k++){const a=hs(11,k)*TAU,rr=Math.sqrt(hs(13,k))*11,x=Math.cos(a)*rr*1.1,y=Math.sin(a)*rr*.8,ra=hs(17,k)*Math.PI;c.save();c.translate(x,y);c.rotate(ra);c.beginPath();c.ellipse(0,0,3.6,1.7,0,0,TAU);c.fillStyle=rgb(lit(col,.1+.18*hs(19,k)));c.fill();c.strokeStyle='rgba(60,40,20,.7)';c.lineWidth=.9;c.stroke();c.restore()}}
 // CARNE TROCEADA (tras cortarla): tres trozos irregulares de carne juntos, con grosor, fibras, borde de grasa y corteza al hacerse (nada de cubos: se lee como carne). Sirve para carne, pollo y ancas.
 function meatBit(c,x,y,rot,rx,ry,col,fat,i,d,t){c.save();c.translate(x,y);c.rotate(rot);
  const N=9,pts=[];for(let k=0;k<N;k++){const a=k/N*TAU,rr=.7+.5*hs(41+i*3,k);pts.push([Math.cos(a)*rx*rr,Math.sin(a)*ry*rr])}
  const P=(dy)=>{c.beginPath();for(let k=0;k<N;k++){const q=pts[k],r=pts[(k+1)%N],mx2=(q[0]+r[0])/2,my2=(q[1]+r[1])/2+dy;if(!k)c.moveTo((pts[N-1][0]+q[0])/2,(pts[N-1][1]+q[1])/2+dy);c.quadraticCurveTo(q[0],q[1]+dy,mx2,my2)}c.closePath()};
  c.save();P(2.8);c.fillStyle='rgba(0,0,0,.2)';c.translate(1.5,2);c.fill();c.restore();
  P(2.6);c.fillStyle=rgb(drk(col,.42));c.fill();ink(c,1.6);                                   // canto (grosor) más oscuro
  P(0);const rg=c.createRadialGradient(-rx*.3,-ry*.4,1,0,0,rx*1.15);rg.addColorStop(0,rgb(lit(col,.2)));rg.addColorStop(.65,rgb(col));rg.addColorStop(1,rgb(drk(col,.3+.15*cl(d,0,1))));c.fillStyle=rg;c.fill();ink(c,1.7);
  c.save();P(0);c.clip();c.save();c.scale(.82,.82);P(0);c.strokeStyle=rgb(lit(col,.35),.45*(1-cl(d,0,1)*.7));c.lineWidth=1.6;c.stroke();c.restore();   // cara de corte más viva por dentro
  c.strokeStyle=rgb(drk(col,.22),.4);c.lineWidth=.8;for(let k=0;k<7;k++){const yy=-ry+k*ry*.3;c.beginPath();c.moveTo(-rx,yy+hs(51+i,k)*1.4);c.quadraticCurveTo(0,yy-1.5+hs(53+i,k)*3,rx,yy+hs(57+i,k)*1.4);c.stroke()}   // fibras
  if(i%2===0){c.strokeStyle=rgb(fat);c.lineWidth=2.6;c.beginPath();c.moveTo(-rx*.9,ry*.25);c.quadraticCurveTo(-rx*.5,-ry*1.05,rx*.4,-ry*.95);c.stroke()}   // borde de grasa
  c.fillStyle=rgb(lit(mx(col,fat,.45),.1),.5);c.beginPath();c.ellipse(rx*.15,ry*.1,rx*.18,ry*.1,.4,0,TAU);c.fill();
  if(d>.4){c.strokeStyle='rgba(60,28,10,'+cl((d-.3)*.9,0,.55)+')';c.lineWidth=2.2;c.beginPath();c.moveTo(-rx*.8,-ry*.2);c.lineTo(rx*.8,-ry*.5);c.moveTo(-rx*.7,ry*.3);c.lineTo(rx*.8,0);c.stroke()}
  if(d>1){c.fillStyle='rgba(18,12,10,.5)';for(let k=0;k<4;k++){c.beginPath();c.arc((hs(61+i,k)-.5)*rx*1.4,(hs(63+i,k)-.5)*ry*1.2,1.4+hs(65,k)*1.2,0,TAU);c.fill()}}c.restore();
  if(d>.08&&d<.95)gloss(c,-rx*.25,-ry*.35,rx*.34,ry*.14,-.3,.3+.1*Math.sin(t*3));c.restore()}
 function dice(c,id,d,t){const col=tone(base(id),d,/^carne/.test(id)?.5:.9),fat=mx(hx('#f6ecd0'),GOLD,cl(d*.6,0,.5));
  c.fillStyle='rgba(0,0,0,.14)';c.beginPath();c.ellipse(1,8,17,6,0,0,TAU);c.fill();
  meatBit(c,1,-6,.15,8.5,6.3,col,fat,0,d,t);meatBit(c,-8,3,-.45,9,6.6,col,fat,1,d,t);meatBit(c,7,4,.35,8.2,6.4,col,fat,2,d,t)}
 function slices(c,id,d,t){const cap=tone(hx('#b88a5a'),d,.7),stem=tone(hx('#efe2c6'),d*.7,.5);   // seta laminada
  c.fillStyle='rgba(0,0,0,.17)';c.beginPath();c.ellipse(1,6,14,6,0,0,TAU);c.fill();[[-8,4,-.3],[2,5,.2],[-3,-2,.1],[8,0,-.2]].forEach(([x,y,a],i)=>{c.save();c.translate(x,y);c.rotate(a);c.beginPath();c.moveTo(-7,3);c.bezierCurveTo(-8,-6,-2,-8,0,-8);c.bezierCurveTo(2,-8,8,-6,7,3);c.lineTo(3,3);c.lineTo(3,7);c.lineTo(-3,7);c.lineTo(-3,3);c.closePath();vol(c,i%2?cap:mx(cap,stem,.4),-6,-8,6,7);c.fill();ink(c,1.3);c.restore()})}
 const FN={dice,slices,steak,drum,frog,shrimp,fish,egg,mush,butter,rice};
 // dibuja centrado en (0,0) a radio ≈ r px (las formas se definen para r≈16)
 function draw(c,id,o){let k=kind(id);if(!k)return false;o=o||{};if(o.cut){if(k==='steak'||k==='drum'||k==='frog')k='dice';else if(k==='mush')k='slices'}const r=o.r||16,d=o.d||0,t=o.t||0;c.save();c.rotate(o.a||0);const s=r/16;SC=s;c.scale(s,s);FN[k](c,id,d,t);c.restore();return true}
 return{has,kind,draw,tone,base,hx,mx,rgb,hs,OL}})();
