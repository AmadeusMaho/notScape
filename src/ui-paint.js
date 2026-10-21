// NotScape · interfaz «dibujada» (plan v3 §10, paso 3-4): todo lo que no es mundo se pinta con la misma paleta que el arte (papel #fdf9e3, contorno #5b3a29).
//  · plate/trough: placas y barras de papel con tinta para el HUD del lienzo.
//  · vitals: corazón de vida con líquido que baja al recibir golpes + dos frascos (energía, maná), con oleaje y burbujas.
//  · icon(nombre): iconos pintados (pestañas e instalaciones) como dataURL.
//  · initDom(): grano de papel, iconos y cursor pintados como variables CSS (--grain, --cur-arrow, --cur-hand, --ic-*).
// No toca la lógica del juego: game.js solo llama a UI.plate(), UI.trough()… desde draw().
const UI=(()=>{
 const INK='#1c140d',PAPER='#4b4236',PAPER2='#3a3228',TXT='#f2e6c4',GOLD='#ff981f',CURF='#fdf9e3',SH='rgba(0,0,0,.42)'; // paleta OSRS: piedra marrón, contorno casi negro, texto crema y naranja
 const FONT="'Spectral','Cinzel',Georgia,'Times New Roman',serif";   // una sola tipografía en toda la interfaz: la del panel de Objetivo (oct 2026)
 const rr=(c,x,y,w,h,r)=>{r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()};
 const mixc=(a,b,t)=>{const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),A=p(a),B=p(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')};
 // ---------- placas y barras ----------
 function plate(c,x,y,w,h,o){o=o||{};const r=o.r==null?4:o.r;c.save();c.lineJoin='round';
  rr(c,x+1.5,y+2,w,h,r);c.fillStyle=SH;c.fill();
  rr(c,x,y,w,h,r);c.fillStyle=o.fill||PAPER;c.fill();
  rr(c,x+1.2,y+1.2,w-2.4,h-2.4,Math.max(0,r-1));c.strokeStyle='rgba(205,178,120,.38)';c.lineWidth=1;c.stroke();
  rr(c,x,y,w,h,r);c.strokeStyle=o.ink||INK;c.lineWidth=o.lw||1.4;c.stroke();c.restore()}
 function trough(c,x,y,w,h,pct,col,o){o=o||{};pct=Math.max(0,Math.min(1,pct));c.save();c.lineJoin='round';
  rr(c,x,y,w,h,h/2);c.fillStyle=o.back||'#241e16';c.fill();
  if(pct>0){c.save();rr(c,x,y,w,h,h/2);c.clip();c.fillStyle=col;c.fillRect(x,y,w*pct,h);c.fillStyle='rgba(255,255,255,.45)';c.fillRect(x,y+h*.14,w*pct,h*.28);c.restore()}
  rr(c,x,y,w,h,h/2);c.strokeStyle=INK;c.lineWidth=1.2;c.stroke();c.restore()}
 // ---------- iconos pintados (64×64) ----------
 const IC={};
 function mk(draw){const cv=document.createElement('canvas');cv.width=cv.height=64;const c=cv.getContext('2d');c.lineJoin='round';c.lineCap='round';c.lineWidth=3.4;c.strokeStyle=INK;draw(c);return cv.toDataURL()}
 const fs=(c,fill,hi)=>{c.fillStyle=fill;c.fill();if(hi){c.save();c.clip();c.fillStyle=hi;c.globalAlpha=.55;c.fillRect(0,0,64,24);c.restore()}c.stroke()};
 const DRAW={
  bag:c=>{c.beginPath();c.moveTo(22,16);c.quadraticCurveTo(32,10,42,16);c.quadraticCurveTo(54,32,50,48);c.quadraticCurveTo(32,58,14,48);c.quadraticCurveTo(10,32,22,16);fs(c,'#d9985c','#f0c08e');
   c.beginPath();c.moveTo(21,17);c.quadraticCurveTo(32,23,43,17);c.stroke();c.beginPath();c.moveTo(18,12);c.quadraticCurveTo(32,6,46,12);c.lineTo(43,18);c.quadraticCurveTo(32,23,21,18);c.closePath();fs(c,'#bd7a45','#e0a468');c.beginPath();c.arc(32,38,5,0,7);fs(c,'#f1c24a');},
  person:c=>{c.beginPath();c.arc(32,20,12,0,7);fs(c,'#f1c9a0','#ffe7cc');c.beginPath();c.moveTo(10,56);c.quadraticCurveTo(10,34,32,34);c.quadraticCurveTo(54,34,54,56);c.closePath();fs(c,'#e5484d','#ff9a8a');c.beginPath();c.arc(32,12,13,Math.PI,0);c.closePath();fs(c,'#b55a2a','#d98a50')},
  chart:c=>{c.beginPath();c.moveTo(10,52);c.lineTo(54,52);c.stroke();[[14,34,'#a6d24c'],[28,20,'#ffd75a'],[42,10,'#ff9ac0']].forEach(([x,y,col])=>{c.beginPath();c.rect(x,y,11,52-y);fs(c,col,'#fff')})},
  pray:c=>{c.beginPath();c.arc(32,28,22,0,7);fs(c,'#fff2b0','#ffffff');c.beginPath();c.moveTo(32,12);c.lineTo(32,50);c.moveTo(20,26);c.lineTo(44,26);c.lineWidth=5;c.stroke();c.beginPath();c.moveTo(18,56);c.quadraticCurveTo(32,46,46,56);c.lineWidth=3.4;c.stroke()},
  sword:c=>{c.beginPath();c.moveTo(14,50);c.lineTo(44,10);c.lineTo(54,8);c.lineTo(52,20);c.lineTo(22,56);c.closePath();fs(c,'#dfe6ee','#fff');c.beginPath();c.moveTo(10,40);c.lineTo(28,52);c.lineTo(24,57);c.lineTo(8,45);c.closePath();fs(c,'#e8b84a','#fff0b0');c.beginPath();c.moveTo(12,52);c.lineTo(6,58);c.lineWidth=5;c.stroke()},
  trophy:c=>{c.beginPath();c.moveTo(16,10);c.lineTo(48,10);c.quadraticCurveTo(48,36,32,40);c.quadraticCurveTo(16,36,16,10);c.closePath();fs(c,'#ffd75a','#fff6c0');c.beginPath();c.moveTo(16,16);c.quadraticCurveTo(6,16,8,26);c.quadraticCurveTo(10,32,18,32);c.moveTo(48,16);c.quadraticCurveTo(58,16,56,26);c.quadraticCurveTo(54,32,46,32);c.lineWidth=3;c.stroke();c.beginPath();c.rect(28,40,8,8);fs(c,'#e8b84a');c.beginPath();c.rect(18,48,28,8);fs(c,'#c98a3a','#e8b84a')},
  scroll:c=>{c.beginPath();c.moveTo(16,12);c.lineTo(48,12);c.lineTo(48,48);c.lineTo(16,48);c.closePath();fs(c,'#fdf0c4','#fff');
   c.beginPath();c.ellipse(32,12,17,6,0,0,7);fs(c,'#e8c98a');c.beginPath();c.ellipse(32,50,17,6,0,0,7);fs(c,'#e8c98a');
   c.lineWidth=2.6;[22,30,38].forEach(y=>{c.beginPath();c.moveTo(22,y);c.lineTo(42,y);c.stroke()})},
  book:c=>{c.beginPath();c.moveTo(32,16);c.quadraticCurveTo(20,10,8,14);c.lineTo(8,48);c.quadraticCurveTo(20,44,32,50);c.closePath();fs(c,'#fdf0c4','#fff');
   c.beginPath();c.moveTo(32,16);c.quadraticCurveTo(44,10,56,14);c.lineTo(56,48);c.quadraticCurveTo(44,44,32,50);c.closePath();fs(c,'#f6e6b0','#fff');
   c.lineWidth=2.4;[[16,24,26],[16,31,26],[38,24,48],[38,31,48]].forEach(([x1,y,x2])=>{c.beginPath();c.moveTo(x1,y);c.lineTo(x2,y);c.stroke()});
   c.lineWidth=3.4;c.beginPath();c.moveTo(32,16);c.lineTo(32,50);c.stroke()},
  star:c=>{c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?11:25;c.lineTo(32+Math.cos(a)*r,34+Math.sin(a)*r)}c.closePath();fs(c,'#ffd75a','#fff6c0');
   c.fillStyle='#fff';c.lineWidth=2;c.beginPath();c.arc(50,12,3.4,0,7);c.fill();c.stroke();c.beginPath();c.arc(12,50,2.6,0,7);c.fill();c.stroke()},
  gear:c=>{c.beginPath();for(let i=0;i<16;i++){const a=i*Math.PI/8,r=i%2?19:25;c.lineTo(32+Math.cos(a)*r,32+Math.sin(a)*r)}c.closePath();fs(c,'#b9c4cf','#eef3f7');c.beginPath();c.arc(32,32,8,0,7);fs(c,'#fdf9e3')},
  bank:c=>{c.beginPath();c.moveTo(6,24);c.lineTo(32,8);c.lineTo(58,24);c.closePath();fs(c,'#e8b84a','#fff0b0');
   [14,26,38].forEach(x=>{c.beginPath();c.rect(x,27,9,22);fs(c,'#e9e2cf','#fff')});c.beginPath();c.rect(7,49,50,8);fs(c,'#c9c2b0','#e9e2cf');
   c.beginPath();c.arc(32,17,4,0,7);fs(c,'#fff6c0')},
  shop:c=>{c.beginPath();c.moveTo(8,26);c.lineTo(14,10);c.lineTo(50,10);c.lineTo(56,26);c.closePath();fs(c,'#fdf9e3');
   c.save();c.beginPath();c.moveTo(8,26);c.lineTo(14,10);c.lineTo(50,10);c.lineTo(56,26);c.closePath();c.clip();c.fillStyle='#e5484d';[14,32,50].forEach(x=>{c.fillRect(x-6,6,9,24)});c.restore();
   c.beginPath();c.moveTo(8,26);c.lineTo(14,10);c.lineTo(50,10);c.lineTo(56,26);c.closePath();c.stroke();
   c.lineWidth=3;c.beginPath();c.moveTo(14,26);c.lineTo(14,54);c.moveTo(50,26);c.lineTo(50,54);c.stroke();c.beginPath();c.rect(10,40,44,8);fs(c,'#bd7a45','#e0a468');
   c.beginPath();c.arc(24,34,4,0,7);fs(c,'#ff9a3a');c.beginPath();c.arc(36,35,3.6,0,7);fs(c,'#a6d24c')},
  fire:c=>{c.beginPath();c.moveTo(32,6);c.quadraticCurveTo(46,24,48,38);c.quadraticCurveTo(50,56,32,58);c.quadraticCurveTo(14,56,16,38);c.quadraticCurveTo(18,28,26,22);c.quadraticCurveTo(26,32,32,34);c.quadraticCurveTo(36,22,32,6);fs(c,'#ff9a3a','#ffd95a');
   c.beginPath();c.moveTo(32,34);c.quadraticCurveTo(42,44,38,52);c.quadraticCurveTo(32,58,26,52);c.quadraticCurveTo(24,44,32,34);fs(c,'#ffd95a','#fff6c0')},
  furnace:c=>{c.beginPath();c.rect(10,22,44,34);fs(c,'#9a958d','#d0cbc0');c.beginPath();c.rect(38,6,10,18);fs(c,'#8a857d','#c0bbb0');
   c.beginPath();c.moveTo(20,56);c.lineTo(20,42);c.quadraticCurveTo(32,28,44,42);c.lineTo(44,56);c.closePath();fs(c,'#3a2a22');c.beginPath();c.moveTo(25,56);c.quadraticCurveTo(26,44,32,42);c.quadraticCurveTo(38,46,39,56);c.closePath();fs(c,'#ff9a3a','#ffd95a')},
  anvil:c=>{c.beginPath();c.moveTo(8,16);c.lineTo(56,16);c.quadraticCurveTo(54,28,40,28);c.lineTo(40,36);c.lineTo(48,44);c.lineTo(48,52);c.lineTo(16,52);c.lineTo(16,44);c.lineTo(24,36);c.lineTo(24,28);c.quadraticCurveTo(12,28,8,16);c.closePath();fs(c,'#8f9aa6','#d4dce3');
   c.beginPath();c.moveTo(8,16);c.lineTo(2,12);c.lineTo(10,12);c.stroke()},
  armero:c=>{c.beginPath();c.moveTo(14,24);c.quadraticCurveTo(14,8,32,8);c.quadraticCurveTo(50,8,50,24);c.lineTo(50,30);c.lineTo(14,30);c.closePath();fs(c,'#9aa5b0','#d4dce3');
   c.beginPath();c.rect(22,22,20,4);fs(c,'#3a3e48');c.beginPath();c.moveTo(12,36);c.lineTo(52,36);c.lineTo(46,58);c.lineTo(18,58);c.closePath();fs(c,'#8f9aa6','#d4dce3')}, // lote C1b-1: Armero
  curtidor:c=>{c.lineWidth=3.6;c.beginPath();c.moveTo(14,8);c.lineTo(14,58);c.moveTo(50,8);c.lineTo(50,58);c.stroke();c.beginPath();c.rect(10,8,44,5);fs(c,'#bd7a45','#e0a468');
   c.beginPath();c.moveTo(19,16);c.lineTo(45,16);c.lineTo(41,32);c.lineTo(45,50);c.lineTo(19,50);c.lineTo(23,32);c.closePath();fs(c,'#b98a55','#e0b784')}, // lote C1b-1: Banco de curtidor
  bench:c=>{c.beginPath();c.rect(6,26,52,9);fs(c,'#bd7a45','#e0a468');c.lineWidth=3.6;c.beginPath();c.moveTo(12,35);c.lineTo(12,56);c.moveTo(52,35);c.lineTo(52,56);c.stroke();c.lineWidth=3.4;
   c.save();c.translate(30,14);c.rotate(-.5);c.beginPath();c.rect(-3,-2,6,22);fs(c,'#9b6a3f','#c98a5a');c.beginPath();c.rect(-9,-9,18,9);fs(c,'#9aa5b0','#d4dce3');c.restore()},
  altar:c=>{c.beginPath();c.moveTo(10,30);c.lineTo(54,30);c.lineTo(50,56);c.lineTo(14,56);c.closePath();fs(c,'#bd7a45','#e0a468');
   c.beginPath();c.moveTo(14,30);c.lineTo(18,14);c.lineTo(46,14);c.lineTo(50,30);c.closePath();fs(c,'#fdf0c4','#fff');c.lineWidth=2.4;[20,25].forEach(y=>{c.beginPath();c.moveTo(24,y);c.lineTo(42,y);c.stroke()});
   c.lineWidth=3.2;c.beginPath();c.moveTo(50,6);c.quadraticCurveTo(54,18,40,28);c.stroke();c.beginPath();c.moveTo(50,6);c.quadraticCurveTo(62,10,54,20);c.quadraticCurveTo(52,14,50,6);fs(c,'#7cc0e8','#d0efff')}
 };
 const icon=n=>IC[n]||(DRAW[n]?(IC[n]=mk(DRAW[n])):'');
 // ---------- cursor pintado ----------
 function cursorImg(kind){const cv=document.createElement('canvas');cv.width=cv.height=40;const c=cv.getContext('2d');c.lineJoin='round';c.lineCap='round';c.translate(3,3);
  if(kind==='arrow'){c.beginPath();c.moveTo(0,0);c.lineTo(0,23);c.lineTo(6,18);c.lineTo(10,27);c.lineTo(14,25);c.lineTo(10,17);c.lineTo(18,17);c.closePath();c.fillStyle='rgba(0,0,0,.3)';c.save();c.translate(1.5,2);c.fill();c.restore();c.fillStyle=CURF;c.fill();c.lineWidth=2.4;c.strokeStyle=INK;c.stroke();
   c.beginPath();c.moveTo(3,6);c.lineTo(3,16);c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=1.6;c.stroke()}
  else{ // mano que señala
   c.beginPath();c.moveTo(6,2);c.quadraticCurveTo(10,0,11,4);c.lineTo(11,13);c.lineTo(13,12);c.quadraticCurveTo(16,11,17,14);c.lineTo(18,14);c.quadraticCurveTo(21,13,22,16);c.lineTo(23,16);c.quadraticCurveTo(26,15,27,18);c.lineTo(27,25);c.quadraticCurveTo(26,33,17,33);c.quadraticCurveTo(9,33,6,26);c.lineTo(1,17);c.quadraticCurveTo(0,14,3,14);c.quadraticCurveTo(5,14,6,16);c.lineTo(6,6);c.quadraticCurveTo(6,3,6,2);c.closePath();
   c.fillStyle='rgba(0,0,0,.3)';c.save();c.translate(1.5,2);c.fill();c.restore();c.fillStyle=CURF;c.fill();c.lineWidth=2.4;c.strokeStyle=INK;c.stroke();c.lineWidth=1.6;[[11,14,11,20],[17,15,17,20],[22,17,22,21]].forEach(([a,b,d,e])=>{c.beginPath();c.moveTo(a,b);c.lineTo(d,e);c.stroke()})}
  return cv.toDataURL()}
 let CUR=null;
 function initDom(){
  try{const r=document.documentElement.style;
   // grano de papel (128×128): valores 228–255 y un 4 % de manchas, como en el terreno
   const g=document.createElement('canvas');g.width=g.height=128;const x=g.getContext('2d'),im=x.createImageData(128,128);let s=7;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
   for(let i=0;i<im.data.length;i+=4){const v=rnd()<.04?185:228+Math.floor(rnd()*28);im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255}x.putImageData(im,0,0);
   r.setProperty('--grain','url('+g.toDataURL()+')');
   CUR={arrow:'url('+cursorImg('arrow')+') 3 3, auto',hand:'url('+cursorImg('hand')+') 12 4, pointer'};
   r.setProperty('--hand-img','url('+cursorImg('hand')+')');r.setProperty('--cur-arrow',CUR.arrow);r.setProperty('--cur-hand',CUR.hand);
   document.querySelectorAll('[data-ic]').forEach(e=>{e.style.backgroundImage='url('+icon(e.dataset.ic)+')'})
  }catch(e){}}
 return{INK,PAPER,PAPER2,TXT,GOLD,FONT,plate,trough,icon,initDom,rr,mixc,cursor:k=>CUR?CUR[k]:''}
})();
