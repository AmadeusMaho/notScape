// NotScape · F5 · criaturas «galleta» (enemigos, animales y jefes). Mismo lenguaje que human2d/hero2d (style-organic.js):
// cada pieza = relleno oscuro + el mismo contorno desplazado (-1,6/-1,3) en el tono base (media luna de sombra abajo-derecha) + contorno marrón #5b3a29.
// Se registran en ORG.U (mismos nombres que los ids de MD en game.js: lobo, orco, jabali…); cada una se dibuja a su tamaño FINAL en px de modelo
// (el héroe mide ≈35; ver CRE.H). Miran a la derecha; o.f=-1 las espeja. Pose: o.p={st:-1..1 paso, bob:-1..1 respiración, atk:0..1 golpe, t: segundos (llamas), pk: picoteo}.
// p.t = FASE en radianes (0..2π = un bucle de animación, para poder hornear 8 fotogramas): toda sin(p.t*n) usa n entero para que el bucle cierre sin saltos.
// o.flash=1 → todo casi blanco (golpe recibido); o.sil=1 → sin sombra de apoyo (silueta para el resalte).
// Un enemigo nuevo = una función aquí + una fila en CRE.H (altura de la etiqueta y caja de horneado) + su fila en MD (game.js).
const CRE=(()=>{
 const INK='#5b3a29',mix=(a,b,t)=>PAINT.mix(a,b,t),TAU=Math.PI*2;
 // ───── kit de dibujo (cada modelo recibe k) ─────
 function kit(g,x,y,o){const p=o.p||{},fl=!!o.flash;
  g.save();g.translate(x,y);if(o.f<0)g.scale(-1,1);g.lineJoin='round';g.lineCap='round';
  const hx=c=>c.length===4?'#'+c[1]+c[1]+c[2]+c[2]+c[3]+c[3]:c,C=c=>{c=hx(c);return fl?mix(c,'#ffffff',.8):c},dk=c=>mix(c,'#6a3a3a',.3);
  const P=(fn,c,e)=>{e=e||{};c=C(c);g.save();g.beginPath();fn();g.fillStyle=e.nd?c:dk(c);g.fill();
   if(!e.nd){g.save();g.clip();g.translate(-1.6,-1.3);g.beginPath();fn();g.fillStyle=c;g.fill();g.restore()}
   if(e.ink!==false){g.beginPath();fn();g.lineWidth=e.lw||1.5;g.strokeStyle=INK;g.globalAlpha=.9;g.stroke()}g.restore()};
  const E=(cx,cy,rx,ry,rot)=>()=>g.ellipse(cx,cy,rx,ry,rot||0,0,TAU);
  const R=(a,b,w,h,r)=>()=>{r=Math.min(r==null?2:r,Math.abs(w)/2,Math.abs(h)/2);g.moveTo(a+r,b);g.arcTo(a+w,b,a+w,b+h,r);g.arcTo(a+w,b+h,a,b+h,r);g.arcTo(a,b+h,a,b,r);g.arcTo(a,b,a+w,b,r);g.closePath()};
  const T=pts=>()=>{g.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)g.lineTo(pts[i],pts[i+1]);g.closePath()};
  const eye=(ex,ey,r,col,glow)=>{g.save();g.beginPath();g.fillStyle=C(col||'#2c2224');g.ellipse(ex,ey,r,r*1.15,0,0,TAU);g.fill();if(glow){g.globalAlpha=.35;g.beginPath();g.arc(ex,ey,r*2.1,0,TAU);g.fillStyle=C(col);g.fill();g.globalAlpha=1}
   g.beginPath();g.fillStyle='#fff';g.arc(ex+r*.32,ey-r*.38,Math.max(.5,r*.36),0,TAU);g.fill();g.restore()};
  const line=(pts,c,w)=>{g.save();g.beginPath();g.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)g.lineTo(pts[i],pts[i+1]);g.strokeStyle=C(c);g.lineWidth=w||1;g.stroke();g.restore()};
  const shadow=rx=>{if(o.sil)return;g.save();g.fillStyle='rgba(91,58,41,.15)';g.beginPath();g.ellipse(rx*.15,rx*.08,rx,rx*.5,0,0,TAU);g.fill();g.restore()};
  return{g,p,P,E,R,T,eye,line,shadow,C,dk,done:()=>g.restore(),fl}}
 const lerp=(a,b,t)=>a+(b-a)*t;
 // ───── armas (se dibujan en el marco del brazo: origen en la mano, +y hacia abajo a lo largo del brazo) ─────
 const WP={
  club:k=>{k.P(k.R(-2.3,2,4.6,24,2),'#9a6e3e');k.P(k.E(0,26,5.4,6.4),'#9a6e3e');[[-3,24],[3,27],[0,31]].forEach(q=>k.P(k.T([q[0]-1.4,q[1]+1,q[0]+1.4,q[1]+1,q[0],q[1]-2.6]),'#d8d0b8',{lw:1}))},
  kanabo:k=>{k.P(k.R(-2,0,4,12,1.5),'#6a4a32');k.P(k.R(-3.6,10,7.2,24,3),'#4c4c56');for(let i=0;i<4;i++){k.P(k.E(-3.2,15+i*5.4,1.6,1.6),'#c8c8d0',{lw:1});k.P(k.E(3.2,18+i*5.4,1.6,1.6),'#c8c8d0',{lw:1})}},
  axe:k=>{k.P(k.R(-1.3,-2,2.6,28,1),'#8a6238');k.P(k.T([1,17,11,11,12,28,1,24]),'#aab0bc')},
  cleaver:k=>{k.P(k.R(-1.6,-2,3.2,12,1),'#6a4a32');k.P(k.T([-5,8,5,8,7.5,34,-5,36]),'#9aa0ae');k.line([-3.5,12,-3.5,32],'#e4e8f0',1.1)},
  sword:k=>{k.P(k.R(-1.6,-2,3.2,6,1),'#6a4a32');k.P(k.R(-5,3.4,10,2.6,1),'#8a7a52');k.P(k.T([-2.2,6,2.2,6,2.2,28,0,32,-2.2,28]),'#cfd6e2')},
  rust:k=>{k.P(k.R(-1.6,-2,3.2,6,1),'#5a4a3a');k.P(k.R(-4.4,3.4,8.8,2.4,1),'#6a5a3a');k.P(k.T([-2.2,6,2.2,6,2,24,0,28,-2.4,23]),'#9a9482')},
  trident:k=>{k.P(k.R(-1,-8,2,44,1),'#5a4a52');k.P(k.T([-6,30,-4.4,30,-4.4,40,-6,36]),'#c8c8d4',{lw:1.1});k.P(k.T([4.4,30,6,30,6,36,4.4,40]),'#c8c8d4',{lw:1.1});k.P(k.T([-1.8,30,1.8,30,0,46]),'#c8c8d4',{lw:1.1})},
  flame:k=>{k.P(k.R(-1.8,-2,3.6,8,1),'#3a2a2a');k.P(k.R(-5,5,10,2.6,1),'#c0502a');k.P(k.T([-3.2,8,3.2,8,3,34,0,40,-3,34]),'#ff9a3a');k.P(k.T([-1.4,10,1.4,10,1.2,30,0,34,-1.2,30]),'#ffe27a',{nd:true,ink:false})},
  shiv:k=>{k.P(k.R(-1.5,-2,3,8,1),'#4a3422');k.P(k.R(-4.2,4.6,8.4,2.2,1),'#6a5a3a');k.P(k.T([-2.4,7,2.4,7,3.4,13,1.6,15,3.2,21,0,29,-2.2,21,-1,15,-3.2,13]),'#a6a08c');k.line([0,9,0,26],'#6a5a48',.9)},
  staff:k=>{k.P(k.R(-1.4,-6,2.8,42,1.2),'#6a4a32');k.P(k.E(0,-8,4.6,4.6),'#7fffb0',{nd:true,lw:1});k.g.save();k.g.globalAlpha=.3+.15*Math.sin((k.p.t||0)*3);k.g.fillStyle=k.C('#7fffb0');k.g.beginPath();k.g.arc(0,-8,9,0,TAU);k.g.fill();k.g.restore()},
  bone:k=>{k.P(k.R(-1.6,0,3.2,22,1.4),'#efe8d4');k.P(k.E(-2,23,2.6,2.6),'#efe8d4');k.P(k.E(2,23,2.6,2.6),'#efe8d4')}};
 // ───── humanoide (frente, como human2d). c: s escala, skin, cloth, pants, boot, tw ancho torso, lw ancho piernas, hr radio cabeza, wp arma, wpFar arma mano lejana,
 //   back(k) (detrás del cuerpo), body(k) (sobre el torso), head(k,hy) (cabeza y cara), fat (barriga), arm manga ─────
 function biped(g,x,y,o,c){const k=kit(g,x,y,o),p=k.p,P=k.P,E=k.E,R=k.R,s=c.s||1,st=p.st||0,bob=p.bob||0,at=p.atk||0,tw=c.tw||1,lw=c.lw||1,hr=c.hr||11;
  k.shadow(14*s*Math.max(tw,1));const g2=k.g;g2.save();g2.scale(s,s);
  if(c.back)c.back(k);
  [-1,1].forEach(sg=>{const v=sg<0?st:-st;g2.save();g2.translate(v*2.6,-Math.max(0,v)*3.4);P(R(sg*4.6*lw-3.3,-14,6.6,14,2),c.pants);P(R(sg*4.6*lw-4.6,-5,9.2,5,2.2),c.boot);g2.restore()});
  const hy=-43-bob*.8,ty=-bob*.6,arm=(sx,ang,wp,sleeve)=>{g2.save();g2.translate(sx,-31+ty);g2.rotate(ang);P(R(-2.8,-1.2,5.6,14,2.8),sleeve||c.arm||c.cloth);if(c.glove)P(R(-3,9,6,6,2.4),c.glove);else P(E(0,13.8,3,3),c.skin);if(wp)WP[wp](k);g2.restore()};
  arm(-9.4*tw,.16+(c.wpFar?-at*.6:0),c.wpFar);
  P(R(-9*tw,-33+ty,18*tw,21,6),c.cloth);
  if(c.fat)P(E(0,-19+ty,10.5*tw,9),c.fatCol||c.cloth);
  if(c.belt)P(R(-9.2*tw,-15.5,18.4*tw,3,1.3),c.belt,{lw:1.2});
  if(c.body)c.body(k,ty);
  const sw=Math.sin(Math.min(1,at)*Math.PI),ang=-(.22+(at>0?2.3*sw:0));
  arm(9.4*tw,ang,c.wp);
  g2.save();if(c.hxo||c.hunch)g2.translate(c.hxo||0,c.hunch||0); // postura encorvada (goblin): cabeza adelantada y más baja
  P(E(0,hy,hr*(c.hw||1),hr*.92),c.skin);
  if(c.head)c.head(k,hy);
  g2.restore();g2.restore();k.done()}
 // ───── cuadrúpedo (perfil mirando a +x). c: col, belly, bx/by radios del cuerpo, len altura de patas, lwid ancho de pata, hx/hy cabeza, hr [rx,ry], sn hocico, pre/post ganchos, hoof ─────
 function quad(g,x,y,o,c){const k=kit(g,x,y,o),p=k.p,P=k.P,E=k.E,R=k.R,st=p.st||0,bob=p.bob||0,at=p.atk||0,s=c.s||1;
  k.shadow((c.bx+8)*s);const g2=k.g;g2.save();g2.scale(s,s);
  const len=c.len,lx=c.legX||[-.62,-.26,.28,.64],bodyY=-len-c.by*.78+bob*.5,lung=Math.sin(Math.min(1,at)*Math.PI)*5;
  g2.translate(lung,0);
  if(c.pre)c.pre(k,bodyY);
  const leg=(i)=>{const far=i<2,v=(i%2?-st:st),px=lx[i]*c.bx;g2.save();g2.translate(v*3,-Math.max(0,v)*2.6);const col=far?mix(c.leg||c.col,'#6a3a3a',.18):(c.leg||c.col);
   P(R(px-c.lwid/2,-len-2,c.lwid,len+2,c.lwid*.4),col);P(R(px-c.lwid/2-.4,-3.2,c.lwid+1.6,3.2,1.4),c.hoof||'#5a4030');g2.restore()};
  leg(0);leg(1);
  P(E(0,bodyY,c.bx,c.by),c.col);
  if(c.belly)P(()=>g2.ellipse(0,bodyY+c.by*.3,c.bx*.82,c.by*.58,0,0,TAU),c.belly,{ink:false,nd:true});
  if(c.mid)c.mid(k,bodyY);
  leg(2);leg(3);
  const hx=c.hx+lung*.2,hy=bodyY+c.hy+Math.sin(st*2)*.4-bob*.4;
  if(c.neck)P(c.neck(hx,hy,bodyY),c.col,{ink:false});
  if(c.headFar)c.headFar(k,hx,hy);
  P(E(hx,hy,c.hr[0],c.hr[1]),c.col);
  if(c.sn)P(E(hx+c.sn.x,hy+c.sn.y,c.sn.rx,c.sn.ry),c.sn.col||c.col);
  if(c.post)c.post(k,hx,hy,bodyY);
  g2.restore();k.done()}
 const M={};
 // ───────────────────────── ANIMALES ─────────────────────────
 M.gallina=(g,x,y,o)=>{const k=kit(g,x,y,o),p=k.p,P=k.P,E=k.E,st=p.st||0,pk=p.pk||0,bob=p.bob||0;k.shadow(9);
  [-1,1].forEach(sg=>{const v=sg<0?st:-st;P(k.R(sg*2.2-.8+v*1.6,-7,1.6,7,.6),'#f0a020',{lw:1})});
  P(k.T([-5,-10,-12,-17,-9.5,-9,-12.5,-5,-6,-6]),'#e8dcc0');
  P(E(0,-10+bob*.3,7,6),'#fff6dc');P(E(-1,-9.4,4.4,3.2,-.3),'#efe0b8',{lw:1.1});
  const hx=6.6,hy=-16+pk*3.4;P(k.T([hx-1,hy+2,hx+1,hy+8,hx+4,hy+2]),'#fff6dc',{ink:false});
  P(E(hx,hy,3.7,3.6),'#fff6dc');P(k.T([hx-2.4,hy-2.8,hx-1,hy-6.4,hx+.2,hy-3.2,hx+1.4,hy-6,hx+2,hy-2.8]),'#d92a2a',{lw:1.1});
  P(k.T([hx+3,hy-.6,hx+7,hy+.7,hx+3,hy+1.8]),'#f0a020',{lw:1.1});P(E(hx+1.5,hy+3.8,1.1,1.5),'#d92a2a',{lw:.9});k.eye(hx+1.2,hy-.8,.95);k.done()};
 M.vaca=(g,x,y,o)=>quad(g,x,y,o,{s:1,col:'#f6f1e8',belly:'#efe6d6',bx:17,by:9,len:7,lwid:4.4,leg:'#f6f1e8',hoof:'#6b5a52',hx:18,hy:-1,hr:[7.4,6.4],sn:{x:5.4,y:2.2,rx:3.8,ry:3.2,col:'#f2a8a8'},
  pre:(k,by)=>{k.P(k.T([-16,by-2,-21,by+9+Math.sin((k.p.t||0)*1)*2,-18.4,by+9.6,-15,by+1]),'#e8dfce',{lw:1.2});k.P(k.E(-20,by+10,2.3,2.6),'#5b4a44',{lw:1})},
  mid:(k,by)=>{k.P(k.E(-8,by-3,5,3.6,-.2),'#4a403c',{nd:true,lw:1});k.P(k.E(6,by-1,4.2,3.4,.2),'#4a403c',{nd:true,lw:1});k.P(k.E(1,by+8.6,3.6,2.4),'#f2a8a8',{lw:1.1})},
  headFar:(k,hx,hy)=>{k.P(k.T([hx-3,hy-5,hx-9,hy-9,hx-4,hy-2]),'#e8dfce',{lw:1.1})},
  post:(k,hx,hy)=>{k.P(k.T([hx-1.6,hy-5.4,hx-3.4,hy-10.4,hx+.4,hy-6.6]),'#f4ecd2',{lw:1.1});k.P(k.T([hx+3,hy-5,hx+5.6,hy-9.6,hx+5.6,hy-4.4]),'#f4ecd2',{lw:1.1});k.P(k.E(hx-4.6,hy-3,2.6,1.8,-.5),'#4a403c',{nd:true,lw:1});k.eye(hx+2.4,hy-1.8,1.15);k.P(k.E(hx+9.2,hy+3.4,.8,.8),'#8a4a4a',{nd:true,ink:false})}});
 M.oveja=(g,x,y,o)=>quad(g,x,y,o,{s:1,col:'#f1ede2',belly:'#e4ddcc',bx:17,by:10,len:6.4,lwid:3.8,leg:'#4a403c',hoof:'#2e2622',hx:18,hy:0,hr:[5.6,5.2],sn:{x:4.2,y:1.8,rx:3,ry:2.6,col:'#5a4e48'}, // lote C1: oveja (lana para la tela de las túnicas)
  pre:(k,by)=>{k.P(k.E(-16,by-1,4.4,3.6),'#f1ede2',{lw:1.2})},
  mid:(k,by)=>{[[-9,-5],[-1,-8],[7,-5],[2,0],[-8,2]].forEach(([wx,wy])=>k.P(k.E(wx,by+wy,5,4),'#faf6ea',{nd:true,lw:1}))},
  post:(k,hx,hy)=>{k.P(k.E(hx-3,hy-5,6.6,4.4),'#faf6ea',{lw:1.2});k.P(k.E(hx-6,hy-.6,2.8,1.8,-.4),'#5a4e48',{nd:true,lw:1});k.eye(hx+2.2,hy-1.2,1.1)}});
 M.jabali=(g,x,y,o)=>quad(g,x,y,o,{s:1,col:'#7a5440',belly:'#a07a5c',bx:15,by:9.4,len:6,lwid:4.4,hoof:'#3a2a22',hx:16,hy:2,hr:[7,6.4],sn:{x:6,y:2.4,rx:4.6,ry:3.4,col:'#9a6e58'},
  pre:(k,by)=>{k.P(k.T([-14,by-3,-19,by-6,-15,by+3]),'#5a3e30',{lw:1.2});[0,1,2,3,4,5].forEach(i=>k.P(k.T([-12+i*4.6,by-8.4,-10.6+i*4.6,by-13.8-(i%2),-8.6+i*4.6,by-8.4]),'#4a3226',{lw:1.1}))},
  post:(k,hx,hy,by)=>{k.P(k.E(hx-2,hy-5.4,3,2.2,-.4),'#7a5440',{lw:1.2});k.P(k.T([hx+7,hy+3,hx+13,hy-2.4,hx+9,hy+5.4]),'#f4ecd2',{lw:1.1});k.P(k.E(hx+10.4,hy+2,1.2,1.4),'#3a2a22',{nd:true,ink:false});k.eye(hx+2.2,hy-1.4,1.2,'#e8442a',true);k.line([hx-.6,hy-4.8,hx+5,hy-2.2],'#1e1410',1.8);k.line([hx+4.4,hy+5,hx+8,hy+5.6],'#4a3226',.9)}});
 M.lobo=(g,x,y,o)=>quad(g,x,y,o,{s:1,col:'#8f93a4',belly:'#cdd0da',bx:16.6,by:7.6,len:9.4,lwid:3.8,hoof:'#4a4654',hx:17.6,hy:-2.6,hr:[6.8,5.6],sn:{x:6.8,y:1.8,rx:5.4,ry:2.8,col:'#a2a6b6'},
  pre:(k,by)=>{const w=Math.sin((k.p.t||0)*2)*2;k.P(k.T([-15,by-3,-24,by-9+w,-27,by-1+w,-16,by+4]),'#8f93a4',{lw:1.3});k.P(k.T([-24,by-9+w,-27,by-1+w,-22,by-3+w]),'#e4e6ee',{lw:1})},
  headFar:(k,hx,hy)=>{k.P(k.T([hx-3,hy-4,hx-8,hy-11,hx-1,hy-6]),'#6a6e80',{lw:1.1})},
  post:(k,hx,hy)=>{k.P(k.T([hx-3.4,hy-4.4,hx-2.6,hy-12.4,hx+2,hy-5.4]),'#8f93a4',{lw:1.2});k.P(k.T([hx-2.4,hy-5.2,hx-2,hy-10,hx+.6,hy-5.6]),'#d89aa0',{nd:true,ink:false});
   k.P(k.T([hx+8.4,hy+3.2,hx+9.2,hy+6.6,hx+10.6,hy+3.2]),'#fff',{lw:.9});k.line([hx+4,hy+3.6,hx+11.4,hy+3.8],'#4a3a3a',1);k.P(k.E(hx+12.2,hy+1,1.8,1.5),'#2c2224',{nd:true,ink:false});k.eye(hx+2.4,hy-1.2,1.3,'#ffb020',true);k.line([hx-.4,hy-4.6,hx+5.2,hy-2],'#2a2230',1.8)}});
 M.yak=(g,x,y,o)=>quad(g,x,y,o,{s:1,col:'#55402e',belly:'#3a2a20',bx:20,by:12,len:5.4,lwid:5.6,leg:'#3e2e22',hoof:'#2a2018',legX:[-.6,-.28,.3,.62],hx:20.6,hy:2.6,hr:[8.2,7.4],sn:{x:6.4,y:2.8,rx:4.4,ry:3.6,col:'#6a5240'},
  pre:(k,by)=>{k.P(k.T([-19,by-4,-23,by+10,-18,by+11,-17,by+2]),'#3e2e22',{lw:1.2})},
  mid:(k,by)=>{k.P(k.T([-17,by+6,-12,by+15,-7,by+9,-2,by+16,3,by+9,8,by+16,13,by+8,17,by+10,18,by+3]),'#46352a',{lw:1.2});k.P(k.E(-4,by-9,9,4.4,-.1),'#69503c',{nd:true,ink:false})},
  post:(k,hx,hy)=>{k.P(k.T([hx-4,hy-5,hx-7,hy-14,hx-4,hy-17,hx-1,hy-9]),'#efe6cc',{lw:1.2});k.P(k.T([hx+3,hy-5,hx+7,hy-14,hx+10,hy-13,hx+7,hy-4]),'#efe6cc',{lw:1.2});k.P(k.E(hx-6.4,hy-3,3.2,2.2,-.5),'#3e2e22',{lw:1.1});k.eye(hx+2.6,hy-2,1.3);k.P(k.E(hx+9,hy+3,.9,.9),'#2a2018',{nd:true,ink:false});k.P(k.T([hx-6,hy+4,hx+6,hy+4,hx+4,hy+11,hx-4,hy+10]),'#46352a',{ink:false})}});
 M.zorro=(g,x,y,o)=>quad(g,x,y,o,{s:1,col:'#ef9a52',belly:'#fff0d8',bx:13.6,by:6.6,len:8.6,lwid:3.2,hoof:'#4a3a3a',leg:'#c8743a',hx:15,hy:-2.2,hr:[6,5.2],sn:{x:6.4,y:1.8,rx:5,ry:2.4,col:'#fff0d8'},
  pre:(k,by)=>{const w=Math.sin((k.p.t||0)*1)*2.4;[[1,0],[-1,5]].forEach(q=>{k.P(k.T([-12,by,-22,by-14+w*q[0]+q[1]*.2,-30,by-8+w,-24,by+2,-14,by+5]),'#ef9a52',{lw:1.3});k.P(k.T([-22,by-14+w*q[0]+q[1]*.2,-30,by-8+w,-27,by-6+w,-24,by-10+w]),'#dff6ff',{lw:1})});
   k.g.save();k.g.globalAlpha=.4;k.g.fillStyle=k.C('#7fe6ff');k.g.beginPath();k.g.arc(-27,by-12+w,3.6,0,TAU);k.g.fill();k.g.restore()},
  headFar:(k,hx,hy)=>{k.P(k.T([hx-3,hy-4,hx-7,hy-13,hx,hy-6]),'#c8743a',{lw:1.1})},
  post:(k,hx,hy)=>{k.P(k.T([hx-3,hy-4,hx-2.6,hy-14,hx+2.2,hy-5]),'#ef9a52',{lw:1.2});k.P(k.T([hx-2.6,hy-9,hx-2.6,hy-14,hx+.4,hy-9.4]),'#3a2a2a',{nd:true,ink:false});k.P(k.E(hx+12,hy+1,1.6,1.4),'#2c2224',{nd:true,ink:false});
   k.P(k.T([hx-1,hy-5,hx+1,hy-3.6,hx-1.6,hy-2]),'#5fd8f0',{nd:true,lw:.9});k.eye(hx+2.2,hy-1.2,1.25,'#5fd8f0',true);k.line([hx-.6,hy-4.4,hx+4.8,hy-2],'#2a1a14',1.6)}});
 M.lagarto=(g,x,y,o)=>{const k0=null;return quad(g,x,y,o,{s:1,col:'#d8702a',belly:'#f2b25a',bx:15,by:5.6,len:4.4,lwid:3.8,hoof:'#7a3a1e',legX:[-.7,-.3,.4,.72],hx:19.6,hy:-.6,hr:[6.6,4.4],sn:{x:5.6,y:.8,rx:4.6,ry:2.6},
  pre:(k,by)=>{const w=Math.sin((k.p.t||0)*1)*2;k.P(k.T([-12,by-3,-24,by+1+w,-35,by+7+w*1.6,-24,by+6+w,-12,by+5]),'#d8702a',{lw:1.3});k.line([-16,by+1,-30,by+5+w*1.4],'#ffd23a',1.3)},
  mid:(k,by)=>{[-10,-4,2,8].forEach((px,i)=>k.P(k.T([px-2.2,by-4.6,px,by-9.6-(i%2),px+2.2,by-4.6]),'#8a3a1c',{lw:1.1}));k.line([-12,by-1,-6,by+2,0,by-1,6,by+2],'#ffd23a',1.4);k.g.save();k.g.globalAlpha=.25+.12*Math.sin((k.p.t||0)*3);k.g.fillStyle='#ffb030';k.g.beginPath();k.g.ellipse(0,by,12,6,0,0,TAU);k.g.fill();k.g.restore()},
  post:(k,hx,hy)=>{k.P(k.T([hx-3,hy-3.4,hx-6,hy-9,hx-.4,hy-4.4]),'#8a3a1c',{lw:1.1});k.P(k.E(hx+9,hy+.6,.8,.8),'#5a2a14',{nd:true,ink:false});k.line([hx+3,hy+2.4,hx+10.4,hy+2.4],'#7a3a1e',.9);k.eye(hx+1.4,hy-1.8,1.3,'#ffe04a',true);k.line([hx-1.4,hy-5,hx+4.4,hy-2.8],'#3a1a0c',1.6)}})};
 M.slime=(g,x,y,o)=>{const k=kit(g,x,y,o),p=k.p,P=k.P,E=k.E,bob=p.bob||0,sq=1+bob*.06;k.shadow(15);
  P(E(0,-10*sq+(sq-1)*8,15,11*sq),'#8fdc96');k.g.save();k.g.globalAlpha=.9;P(E(0,-5,11,6),'#6cc47e',{ink:false,nd:true});k.g.restore();
  P(E(-5,-16,3.2,2),'#e8ffe8',{ink:false,nd:true});k.eye(-4,-9,1.8);k.eye(5,-9,1.8);k.line([-1,-5,0,-4,1,-5],'#2c2224',1);k.done()};
 // ───────────────────────── RANA ─────────────────────────
 M.rana=(g,x,y,o)=>{const k=kit(g,x,y,o),p=k.p,P=k.P,E=k.E,st=p.st||0,bob=p.bob||0,hop=Math.max(0,st)*5;k.shadow(13);k.g.save();k.g.translate(0,-hop);
  P(E(-8,-4,7.6,5.4,.2),'#5d9a34');P(E(-10,0,6.4,2.4),'#7ab94a',{lw:1.2});
  P(E(0,-8.4+bob*.4,12.6,7.6),'#78b640');P(E(1,-5,9,4),'#d6e8a0',{ink:false,nd:true});[[-6,-11],[0,-12],[-3,-8]].forEach(q=>P(E(q[0],q[1],1.9,1.4),'#4e8a2a',{nd:true,lw:1}));
  P(E(7,-2.6,3,5.8,.3),'#6aa638');P(E(10,1,4.2,1.8),'#7ab94a',{lw:1.2});
  [4,10].forEach((ex,i)=>{P(E(ex,-14.6,3.6,3.6),'#78b640');k.eye(ex+.6,-14.8,1.9,'#2c2224');});
  k.line([5,-5.6,12,-5.2],'#4a3a2a',1.1);k.g.restore();k.done()};
 // ───────────────────────── HUMANOIDES ─────────────────────────
 const faceOrc=(k,hy,o)=>{const P=k.P,E=k.E;o=o||{};k.eye(-4.2,hy-.4,1.5,o.eye||'#e8c030',!!o.glow);k.eye(4.2,hy-.4,1.5,o.eye||'#e8c030',!!o.glow);k.line([-7.4,hy-3.4,-2.4,hy-2],'#3a2a22',1.3);k.line([7.4,hy-3.4,2.4,hy-2],'#3a2a22',1.3);
  k.line([-3.6,hy+5,3.6,hy+5],'#3a2a22',1.1);P(k.T([-3.8,hy+5,-2.6,hy+5,-3.2,hy+1.8]),'#f4ecd2',{lw:.9});P(k.T([3.8,hy+5,2.6,hy+5,3.2,hy+1.8]),'#f4ecd2',{lw:.9})};
 M.orco=(g,x,y,o)=>biped(g,x,y,o,{s:.84,tw:1.18,lw:1.15,hr:11,hw:1.12,skin:'#6f9a4c',cloth:'#7a5a3c',arm:'#6f9a4c',pants:'#5a4a38',boot:'#3e3026',belt:'#3a2a1e',wp:'axe',
  body:(k,ty)=>{k.P(k.T([-8,-32+ty,-1,-32+ty,-3,-13,-9,-13]),'#5a4230',{lw:1.1});k.line([-6,-26+ty,-2,-23+ty],'#3a2a1e',1);k.P(k.E(-8.6,-31+ty,4.6,3.2,-.3),'#9a9aa6',{lw:1.2});k.P(k.E(8.6,-31+ty,3.4,2.6,.3),'#9a9aa6',{lw:1.2})},
  head:(k,hy)=>{faceOrc(k,hy,{eye:'#e8c030'});k.P(k.T([-12,hy-1,-18,hy-7,-11.4,hy+4]),'#6f9a4c');k.P(k.T([12,hy-1,18,hy-7,11.4,hy+4]),'#6f9a4c')}});
 M.ogro=(g,x,y,o)=>biped(g,x,y,o,{s:1.02,tw:1.5,lw:1.5,hr:9.6,hw:1.1,fat:1,skin:'#c89a5e',cloth:'#a87a46',fatCol:'#c89a5e',arm:'#c89a5e',pants:'#6a4a32',boot:'#4a3424',belt:'#5a3a22',wp:'club',
  body:(k,ty)=>{k.P(k.E(0,-18+ty,9.8,8.6),'#d8aa6e',{ink:false,nd:true});k.P(k.E(0,-20+ty,1.4,1.4),'#8a5a36',{nd:true,lw:.9});k.P(k.T([-12,-14,-6,-13,-9,-8]),'#6a4a32',{lw:1});k.P(k.T([12,-14,6,-13,9,-8]),'#6a4a32',{lw:1})},
  head:(k,hy)=>{k.P(k.E(0,hy+3,9,6.6),'#b88a50',{ink:false,nd:true});k.eye(-3.6,hy-1,1.3,'#2c2224');k.eye(3.6,hy-1,1.3,'#2c2224');k.line([-6.4,hy-4.2,-1.6,hy-2.2],'#4a3220',1.5);k.line([6.4,hy-4.2,1.6,hy-2.2],'#4a3220',1.5);k.P(k.E(0,hy+2,2.2,1.6),'#a87a46',{lw:1});k.line([-3.6,hy+6,3.6,hy+6],'#4a3220',1.1);k.P(k.T([-3.4,hy+6,-2,hy+6,-2.8,hy+3]),'#f4ecd2',{lw:.9});k.P(k.T([3.4,hy+6,2,hy+6,2.8,hy+3]),'#f4ecd2',{lw:.9});
   k.P(k.E(-10.4,hy+1,2.4,3.2),'#c89a5e');k.P(k.E(10.4,hy+1,2.4,3.2),'#c89a5e')}});
 M.esqueleto=(g,x,y,o)=>biped(g,x,y,o,{s:.9,tw:.78,lw:.8,hr:9.4,hw:1.02,skin:'#efe8d4',cloth:'#e2d9bf',arm:'#efe8d4',pants:'#e2d9bf',boot:'#d4cab0',wp:'rust',
  body:(k,ty)=>{k.P(k.R(-8*.78,-33+ty,16*.78,21,5),'#2e2622',{nd:true,ink:false});for(let i=0;i<4;i++)k.P(k.R(-6.4,-30+ty+i*4.6,12.8,2.8,1.4),'#efe8d4',{lw:1});k.P(k.R(-1.2,-32+ty,2.4,19,1),'#efe8d4',{lw:1});k.P(k.R(-7,-15,14,3.4,1.5),'#e2d9bf',{lw:1.1})},
  head:(k,hy)=>{k.P(k.R(-6,hy+5,12,6,2),'#efe8d4');[-3,0,3].forEach(i=>k.line([i,hy+6,i,hy+10],'#5b3a29',.9));k.P(k.E(-4.2,hy-.8,2.7,3.2),'#2e2622',{nd:true,ink:false});k.P(k.E(4.2,hy-.8,2.7,3.2),'#2e2622',{nd:true,ink:false});k.eye(-4.2,hy-.4,1,'#7fe6ff',true);k.eye(4.2,hy-.4,1,'#7fe6ff',true);k.P(k.T([0,hy+2.4,-1.4,hy+5,1.4,hy+5]),'#2e2622',{nd:true,lw:.8})}});
 M.oni=(g,x,y,o)=>biped(g,x,y,o,{s:1.06,tw:1.4,lw:1.3,hr:10.6,hw:1.08,skin:'#c8403a',cloth:'#c8403a',arm:'#c8403a',pants:'#e8b62a',boot:'#5a2a2a',belt:'#3a2a2a',wp:'kanabo',
  body:(k,ty)=>{k.P(k.R(-6,-33+ty,12,4,2),'#f6e6b0',{lw:1.1});k.P(k.E(0,-19+ty,10,8),'#d8504a',{ink:false,nd:true});for(let i=0;i<3;i++)k.P(k.T([-12+i*8,-13,-8+i*8,-13,-10+i*8,-6]),'#2a2220',{nd:true,lw:.9});
   [-1,1].forEach(sg=>k.P(k.T([sg*3,-14,sg*13,-14,sg*13,-4,sg*3,-4]),'#e8b62a',{ink:false,nd:true}))},
  head:(k,hy)=>{k.P(k.T([-8,hy-6,-11.6,hy-18,-4,hy-9]),'#f6e6b0',{lw:1.3});k.P(k.T([8,hy-6,11.6,hy-18,4,hy-9]),'#f6e6b0',{lw:1.3});k.eye(-4.2,hy-.4,1.5,'#ffe04a',true);k.eye(4.2,hy-.4,1.5,'#ffe04a',true);k.line([-8,hy-4.4,-2,hy-2],'#2a1210',1.6);k.line([8,hy-4.4,2,hy-2],'#2a1210',1.6);
   k.P(k.R(-5.4,hy+3.6,10.8,3.4,1.4),'#3a1a1a',{lw:1});k.P(k.T([-4.6,hy+3.6,-3,hy+3.6,-3.8,hy+1]),'#fff',{lw:.8});k.P(k.T([4.6,hy+3.6,3,hy+3.6,3.8,hy+1]),'#fff',{lw:.8});k.P(k.E(0,hy-6.6,1.2,1.2),'#ffe04a',{nd:true,lw:.8})}});
 const wings=(k,ty,col,sp)=>{const fl=Math.sin((k.p.t||0)*3)*3;[-1,1].forEach(sg=>k.P(k.T([sg*5,-34+ty,sg*26,-52+ty-fl,sg*30,-40+ty-fl,sg*24,-34+ty,sg*20,-26+ty,sg*13,-28+ty,sg*5,-22+ty]),col,{lw:1.3}))};
 M.demonio=(g,x,y,o)=>biped(g,x,y,o,{s:1.05,tw:1.1,lw:1,hr:10.4,hw:1.06,skin:'#b02a3a',cloth:'#7a2236',arm:'#b02a3a',pants:'#5a1c2e',boot:'#2e1620',belt:'#2a1218',wp:'trident',
  back:k=>{wings(k,0,'#5a1c2e');const w=Math.sin((k.p.t||0)*2)*2;k.P(k.T([-4,-14,-16,-6+w,-22,-14+w,-18,-3+w,-4,-8]),'#b02a3a',{lw:1.3});k.P(k.T([-22,-14+w,-26,-19+w,-18,-17+w]),'#2a1218',{lw:1})},
  body:(k,ty)=>{k.P(k.E(0,-24+ty,6.4,6),'#d04a52',{ink:false,nd:true});k.line([-4,-25+ty,4,-25+ty],'#7a2236',.9);k.line([-3,-21+ty,3,-21+ty],'#7a2236',.9);k.P(k.R(-2,-31+ty,4,3,1),'#ffb030',{lw:1,nd:true})},
  head:(k,hy)=>{k.P(k.T([-6,hy-6,-14,hy-17,-3,hy-9]),'#2a1218',{lw:1.3});k.P(k.T([6,hy-6,14,hy-17,3,hy-9]),'#2a1218',{lw:1.3});k.P(k.T([-10,hy,-17,hy-3,-10,hy+4]),'#b02a3a');k.P(k.T([10,hy,17,hy-3,10,hy+4]),'#b02a3a');k.eye(-4.2,hy-.4,1.6,'#ffd23a',true);k.eye(4.2,hy-.4,1.6,'#ffd23a',true);k.line([-8,hy-4.6,-2,hy-2],'#2a1218',1.5);k.line([8,hy-4.6,2,hy-2],'#2a1218',1.5);
   k.line([-4,hy+5,0,hy+6.6,4,hy+5],'#2a1218',1.2);k.P(k.T([-3,hy+5.2,-2,hy+5.6,-2.8,hy+7.8]),'#fff',{lw:.8});k.P(k.T([3,hy+5.2,2,hy+5.6,2.8,hy+7.8]),'#fff',{lw:.8});k.P(k.T([-2,hy+9,0,hy+16,2,hy+9]),'#2a1218',{lw:1.1,nd:true})}});

 // GOBLIN (rehecho oct 2026 a petición del dueño: «tierno, no parece enemigo»). Encorvado, ceño fruncido, ojos rojos entrecerrados, colmillos, orejas grandes y rotas, hombrera con púas y cuchilla oxidada.
 M.goblin=(g,x,y,o)=>biped(g,x,y,o,{s:.64,tw:.98,lw:.9,hr:10.4,hw:1.16,hunch:2.6,hxo:2,skin:'#5e8a38',cloth:'#6a4a30',arm:'#5e8a38',pants:'#463628',boot:'#2c2016',belt:'#2a1c12',wp:'shiv',
  body:(k,ty)=>{k.P(k.T([-9,-32+ty,-2,-32+ty,5,-14,-2,-12,-9,-14]),'#4a3322',{lw:1.1});k.line([-6,-26+ty,-2,-22+ty],'#2a1c12',1);k.line([-7,-20+ty,-3,-17+ty],'#2a1c12',1);
   k.P(k.E(-9.2,-32+ty,5.2,3.6,-.3),'#8a8272',{lw:1.2});[-12.4,-8.8,-5.8].forEach((sx,i)=>k.P(k.T([sx-1.5,-34+ty-i*.4,sx+.3,-41+ty-i*1.6,sx+1.9,-34+ty-i*.4]),'#d9d2bc',{lw:1}));
   k.P(k.E(8.6,-31+ty,3.2,2.6,.3),'#5a4230',{lw:1.1});k.P(k.T([-2.6,-15,2.6,-15,1.6,-8,-1.6,-8]),'#d9d2bc',{lw:.9});k.line([0,-14.4,0,-9],'#8a7a60',.8)},
  head:(k,hy)=>{const P=k.P,T=k.T;
   [-1,1].forEach(sg=>{P(T([sg*10,hy-.5,sg*25,hy-12,sg*22,hy-5,sg*26,hy-2,sg*12,hy+5]),'#5e8a38',{lw:1.3});P(T([sg*12,hy,sg*20,hy-7,sg*14,hy+2]),'#c4786a',{nd:true,ink:false})});
   P(T([-1.6,hy+.4,1.6,hy+.4,0,hy+6.6]),'#4e7a2e',{lw:1.1});                                                                             // nariz ganchuda
   k.line([-9.6,hy-5.4,-2.2,hy-.8],'#18100c',2.7);k.line([9.6,hy-5.4,2.2,hy-.8],'#18100c',2.7);                                              // ceño muy fruncido
   k.eye(-4.4,hy+1.2,1.35,'#ff3a24',true);k.eye(4.4,hy+1.2,1.35,'#ff3a24',true);
   k.line([6.2,hy-3.4,8.6,hy+5.4],'#b8483a',1.1);                                                                                          // cicatriz
   P(k.R(-6.6,hy+5.2,13.2,4.4,1.6),'#2a1210',{lw:1.1});[-4.8,-1.6,1.6,4.8].forEach((sx,i)=>P(T([sx-1.4,hy+5.2,sx+1.4,hy+5.2,sx,hy+(i%2?8.4:7.6)]),'#f4ecd2',{nd:true,lw:.7}));
   [-5.4,5.4].forEach(sx=>P(T([sx-1.5,hy+9.6,sx+1.5,hy+9.6,sx+.3,hy+4.4]),'#f4ecd2',{lw:.9}))}});
 // ───────────────────────── JEFES ─────────────────────────
 M.b0=(g,x,y,o)=>biped(g,x,y,o,{s:1.26,tw:1.32,lw:1.3,hr:11,hw:1.14,skin:'#4c7a3a',cloth:'#6a4a34',arm:'#4c7a3a',pants:'#3e3226',boot:'#2a2018',belt:'#2a1c12',wp:'cleaver',glove:'#5a5a64',
  body:(k,ty)=>{k.P(k.E(-9,-31+ty,5.6,4.2,-.3),'#8a8a98',{lw:1.2});k.P(k.E(9,-31+ty,5.2,4,.3),'#8a8a98',{lw:1.2});[-9,9].forEach(sx=>k.P(k.T([sx-1.6,-34+ty,sx,-41+ty,sx+1.6,-34+ty]),'#d8d8e0',{lw:1}));k.P(k.T([-8,-32+ty,8,-32+ty,6,-14,-6,-14]),'#5a3e2a',{ink:false,nd:true});for(let i=0;i<3;i++)k.line([-5,-27+ty+i*4.4,5,-27+ty+i*4.4],'#2a1c12',1);k.P(k.E(0,-20+ty,2.6,2.6),'#e8e2cc',{lw:1})},
  head:(k,hy)=>{faceOrc(k,hy,{eye:'#ff5a3a',glow:1});k.P(k.T([-12,hy-1,-19,hy-8,-11.4,hy+4]),'#4c7a3a');k.P(k.T([12,hy-1,19,hy-8,11.4,hy+4]),'#4c7a3a');k.P(k.R(-11.6,hy-11.4,23.2,6.4,2),'#6a6a76');[-8,-3,3,8].forEach(sx=>k.P(k.T([sx-1.8,hy-11.2,sx,hy-17.4,sx+1.8,hy-11.2]),'#c8c8d4',{lw:1}));k.P(k.T([-12,hy-8,-16,hy-16,-9,hy-10]),'#efe6cc',{lw:1.1});k.P(k.T([12,hy-8,16,hy-16,9,hy-10]),'#efe6cc',{lw:1.1})}});
 M.b1=(g,x,y,o)=>quad(g,x,y,o,{s:1.5,col:'#414355',belly:'#6a6d80',bx:17.6,by:8.6,len:10,lwid:4.4,hoof:'#26262e',hx:19,hy:-3,hr:[7.4,6.2],sn:{x:7.4,y:2,rx:5.8,ry:3.2,col:'#565868'},
  pre:(k,by)=>{const w=Math.sin((k.p.t||0)*2)*2;k.P(k.T([-16,by-3,-26,by-10+w,-30,by-1+w,-17,by+5]),'#414355',{lw:1.3});k.g.save();k.g.globalAlpha=.4;k.g.fillStyle=k.C('#9ab8ff');k.g.beginPath();k.g.arc(-28,by-5+w,4,0,TAU);k.g.fill();k.g.restore()},
  mid:(k,by)=>{for(let i=0;i<6;i++)k.P(k.T([-12+i*4.8,by-7.6,-10+i*4.8,by-15.6-(i%2)*1.6,-7.4+i*4.8,by-7.6]),'#2e2f3c',{lw:1.1});k.line([-6,by+2,-2,by+6],'#9ab8ff',1.1)},
  headFar:(k,hx,hy)=>{k.P(k.T([hx-3,hy-4,hx-9,hy-12,hx-1,hy-6]),'#2e2f3c',{lw:1.1})},
  post:(k,hx,hy)=>{k.P(k.T([hx-3.6,hy-4.6,hx-3,hy-14,hx+2.2,hy-5.4]),'#414355',{lw:1.2});k.P(k.T([hx+8.4,hy+3.4,hx+9.2,hy+8.2,hx+11,hy+3.4]),'#fff',{lw:.9});k.P(k.T([hx+12,hy+3.4,hx+12.6,hy+7,hx+14,hy+3.4]),'#fff',{lw:.9});k.line([hx+4,hy+3.8,hx+14,hy+4],'#26262e',1.1);k.P(k.E(hx+14.4,hy+1.2,2,1.6),'#1e1e26',{nd:true,ink:false});k.line([hx-1,hy-3.6,hx+4,hy+2],'#9ab8ff',1.1);k.eye(hx+2.6,hy-1.4,1.5,'#ff5a3a',true)}});
 M.b2=(g,x,y,o)=>biped(g,x,y,o,{s:1.2,tw:.9,lw:.9,hr:9.8,hw:1.02,skin:'#e8e4cc',cloth:'#4a6a48',arm:'#e8e4cc',pants:'#3a5a3a',boot:'#2e4a30',belt:'#6a8a52',wp:'bone',
  back:k=>{const w=Math.sin((k.p.t||0)*1)*2;k.P(k.T([-10,-34,10,-34,16+w,-4,12,2,2+w,-2,-4,3,-14-w,-2]),'#35553a',{lw:1.2});[-8,0,8].forEach(sx=>k.line([sx,-30,sx+(sx>0?2:-2),-5],'#527a50',1.2))},
  body:(k,ty)=>{k.P(k.R(-7.2,-32+ty,14.4,19,5),'#2e2622',{nd:true,ink:false});for(let i=0;i<4;i++)k.P(k.R(-6,-29+ty+i*4.4,12,2.6,1.3),'#e8e4cc',{lw:1});k.P(k.E(-8,-31+ty,4.2,3.2),'#6a8a52',{lw:1.1});k.P(k.E(8,-31+ty,4.2,3.2),'#6a8a52',{lw:1.1});k.P(k.E(0,-16,2.4,2.4),'#7fe6a0',{nd:true,lw:.9})},
  head:(k,hy)=>{k.P(k.R(-6,hy+5,12,6,2),'#e8e4cc');[-3,0,3].forEach(i=>k.line([i,hy+6,i,hy+10],'#5b3a29',.9));k.P(k.E(-4.2,hy-.8,2.8,3.3),'#1e2a22',{nd:true,ink:false});k.P(k.E(4.2,hy-.8,2.8,3.3),'#1e2a22',{nd:true,ink:false});k.eye(-4.2,hy-.4,1.1,'#7fffb0',true);k.eye(4.2,hy-.4,1.1,'#7fffb0',true);
   k.P(k.R(-9,hy-8,18,4.6,1.5),'#e8c040',{lw:1.3});[-6.6,-2.2,2.2,6.6].forEach(sx=>k.P(k.T([sx-2,hy-8,sx,hy-14.4,sx+2,hy-8]),'#e8c040',{lw:1.2}));k.P(k.E(0,hy-6,1.2,1.2),'#c03a3a',{nd:true,lw:.7});k.P(k.T([0,hy+2.4,-1.4,hy+5,1.4,hy+5]),'#1e2a22',{nd:true,lw:.8})}});
 M.b3=(g,x,y,o)=>biped(g,x,y,o,{s:1.3,tw:1.5,lw:1.4,hr:11,hw:1.14,fat:1,skin:'#f2f8ff',cloth:'#eef4ff',fatCol:'#eef4ff',arm:'#eef4ff',pants:'#dfe8f6',boot:'#c8d6ea',wp:null,glove:'#dfe8f6',
  back:k=>{},
  body:(k,ty)=>{k.P(k.E(0,-19+ty,10,8.6),'#fff',{ink:false,nd:true});for(let i=0;i<5;i++)k.P(k.T([-10+i*5,-31+ty,-7.6+i*5,-26+ty,-5+i*5,-31+ty]),'#cfdcf0',{nd:true,lw:.9});for(let i=0;i<4;i++)k.P(k.T([-8+i*5.4,-14,-5.6+i*5.4,-9,-3+i*5.4,-14]),'#cfdcf0',{nd:true,lw:.9});
   [-1,1].forEach(sg=>[0,1,2].forEach(i=>k.P(k.T([sg*13.4+(i-1)*1.8-1.2,-16-i*0,sg*13.4+(i-1)*1.8+1.2,-16,sg*13.4+(i-1)*1.8,-9.6]),'#8ab0e0',{lw:.8,nd:true})))},
  head:(k,hy)=>{k.P(k.E(0,hy+1.4,8,6.6),'#a8c8f0',{ink:false,nd:true});k.eye(-3.8,hy-.2,1.4,'#1e3a5a');k.eye(3.8,hy-.2,1.4,'#1e3a5a');k.line([-7,hy-3.4,-2,hy-2],'#8ab0e0',1.6);k.line([7,hy-3.4,2,hy-2],'#8ab0e0',1.6);k.P(k.R(-4.6,hy+3,9.2,3.8,1.6),'#3a2a4a',{lw:1});[-3,0,3].forEach(i=>k.P(k.T([i-1.1,hy+3,i+1.1,hy+3,i,hy+5.6]),'#fff',{nd:true,lw:.7}));
   [-1,1].forEach(sg=>{k.P(k.T([sg*9,hy-6,sg*15,hy-11,sg*10.4,hy-2]),'#eef4ff',{lw:1.2});k.P(k.T([sg*7,hy-9,sg*10,hy-16,sg*4,hy-11]),'#fff',{lw:1.1,nd:true})});k.P(k.E(0,hy-9,6.6,3.2),'#fff',{nd:true,lw:1})}});
 M.b4=(g,x,y,o)=>biped(g,x,y,o,{s:1.36,tw:1.42,lw:1.3,hr:10.8,hw:1.1,skin:'#a82a2a',cloth:'#a82a2a',arm:'#a82a2a',pants:'#2a2a34',boot:'#4a1c1c',belt:'#e8b62a',wp:'kanabo',
  body:(k,ty)=>{k.P(k.R(-6,-33+ty,12,4,2),'#f6e6b0',{lw:1.1});k.P(k.E(0,-19+ty,10,8),'#c8403a',{ink:false,nd:true});[[-9,-26],[9,-26],[-9,-20],[9,-20]].forEach(q=>k.P(k.E(q[0],q[1]+ty,1.7,1.7),'#ffe04a',{nd:true,lw:.8}));
   for(let i=0;i<5;i++)k.P(k.T([-11+i*5.5,-13,-8+i*5.5,-13,-9.5+i*5.5,-6]),'#f6e6b0',{nd:true,lw:.9})},
  head:(k,hy)=>{[-1,1].forEach(sg=>{k.P(k.T([sg*7,hy-5,sg*10,hy-22,sg*3,hy-10]),'#f6e6b0',{lw:1.4});k.P(k.T([sg*10,hy-3,sg*18,hy-12,sg*11,hy+3]),'#f6e6b0',{lw:1.2})});k.eye(-4.2,hy-.4,1.7,'#ffe04a',true);k.eye(4.2,hy-.4,1.7,'#ffe04a',true);k.line([-8,hy-4.6,-2,hy-2],'#2a0a0a',1.8);k.line([8,hy-4.6,2,hy-2],'#2a0a0a',1.8);
   k.P(k.R(-6,hy+3.4,12,3.8,1.5),'#3a1010',{lw:1});[-4.4,4.4].forEach(sx=>k.P(k.T([sx-1.4,hy+3.4,sx+1.4,hy+3.4,sx,hy+0]),'#fff',{lw:.8}));k.P(k.E(0,hy-6.6,1.3,1.3),'#ffe04a',{nd:true,lw:.8})}});
 const flameAt=(k,cx,cy,sc,t,sd)=>{const g=k.g;[['#ff7a1a',1],['#ffd23a',.55]].forEach(([c,f])=>{for(let i=0;i<3;i++){const h=(11+Math.sin(t*3+i*2+sd)*3)*sc*f,w=3.4*sc*f,x=cx+(i-1)*3*sc;g.save();g.fillStyle=k.C(c);g.beginPath();g.moveTo(x-w,cy);g.quadraticCurveTo(x-w*.8,cy-h*.6,x+Math.sin(t*3+i)*1.4,cy-h);g.quadraticCurveTo(x+w*.8,cy-h*.6,x+w,cy);g.closePath();g.fill();g.restore()}})};
 M.b5=(g,x,y,o)=>biped(g,x,y,o,{s:1.34,tw:1.3,lw:1.2,hr:10.6,hw:1.06,skin:'#e0482a',cloth:'#3a2630',arm:'#e0482a',pants:'#2a1c22',boot:'#1a1216',belt:'#ffb030',wp:'flame',
  back:k=>{wings(k,0,'#4a1a1e');const t=k.p.t||0;flameAt(k,-8,-36,1.1,t,1);flameAt(k,8,-36,1.1,t,3)},
  body:(k,ty)=>{k.P(k.E(0,-23+ty,6.6,6.4),'#ff8a3a',{ink:false,nd:true});k.line([-4,-26+ty,-1,-22+ty,-3,-18+ty],'#ffe27a',1.2);k.line([4,-26+ty,2,-21+ty,5,-17+ty],'#ffe27a',1.2);k.P(k.E(0,-18+ty,3,3),'#ffe27a',{nd:true,lw:.8});[-1,1].forEach(sg=>k.P(k.T([sg*5,-34+ty,sg*13,-40+ty,sg*12,-30+ty]),'#2a1c22',{lw:1.2}))},
  head:(k,hy)=>{[-1,1].forEach(sg=>k.P(k.T([sg*6,hy-6,sg*12,hy-19,sg*2.6,hy-10]),'#2a1c22',{lw:1.3}));k.eye(-4.2,hy-.4,1.8,'#ffe04a',true);k.eye(4.2,hy-.4,1.8,'#ffe04a',true);k.line([-8,hy-4.6,-2,hy-2],'#2a0a0a',1.7);k.line([8,hy-4.6,2,hy-2],'#2a0a0a',1.7);k.line([-4,hy+5.4,0,hy+6.6,4,hy+5.4],'#2a0a0a',1.2);
   const t=k.p.t||0;flameAt(k,0,hy-9,1.3,t,2)}});

 // ───────────────────────── FAMILIAS NUEVAS (progresión v2) + CAPITANES ─────────────────────────
 // Cada familia = una config `CF.x` (biped/quad); el capitán `kN` es la misma config ampliada y con accesorios (capOf), así comparten silueta y se reconoce al «jefe» de la guarida.
 const capOf=(base,x)=>Object.assign({},base,x.o||{},{body:(k,ty)=>{base.body&&base.body(k,ty);x.body&&x.body(k,ty)},head:(k,hy)=>{base.head&&base.head(k,hy);x.head&&x.head(k,hy)},back:(base.back||x.back)?(k=>{base.back&&base.back(k);x.back&&x.back(k)}):undefined});
 const CF={
  bandido:{s:.9,tw:1,lw:.95,hr:10,hw:1.02,skin:'#e0b890',cloth:'#6a5238',arm:'#6a5238',pants:'#3a3a44',boot:'#2a2018',belt:'#2a1c12',wp:'shiv',
   body:(k,ty)=>{k.P(k.T([-8,-32+ty,-1,-32+ty,2,-14,-8,-14]),'#4a3a28',{lw:1.1});k.line([-6,-26+ty,-2,-22+ty],'#2a1c12',1);k.P(k.R(3,-17,5,8,1.5),'#5a4230',{lw:1});k.P(k.E(-8.4,-31+ty,4,3,-.3),'#7a6a58',{lw:1.1})},
   head:(k,hy)=>{k.P(k.T([-11,hy+1,-10.5,hy-8,-4,hy-13.4,4,hy-13.4,10.5,hy-8,11,hy+1,6,hy-4,-6,hy-4]),'#3f5a3a',{lw:1.3});k.eye(-3.8,hy-.8,1.4);k.eye(3.8,hy-.8,1.4);k.line([-7,hy-3.6,-2,hy-2],'#2a1c12',1.4);k.line([7,hy-3.6,2,hy-2],'#2a1c12',1.4);
    k.P(k.R(-8,hy+1.6,16,6.6,2.6),'#b8302a',{lw:1.2});k.P(k.T([8,hy+3,15,hy+1,13,hy+7.4]),'#b8302a',{lw:1.1});k.line([-6,hy+4.6,5,hy+4.6],'#8a2020',.9)}},
  bruja:{s:.94,tw:.92,lw:.9,hr:9.6,hw:1.02,skin:'#8ab070',cloth:'#4a2a6a',arm:'#4a2a6a',pants:'#3a2058',boot:'#2a1a3a',belt:'#e8c040',wp:'staff',
   back:k=>{const w=Math.sin((k.p.t||0)*2)*1.6;k.P(k.T([-9,-34,9,-34,15+w,-4,-15-w,-4]),'#35204e',{lw:1.2})},
   body:(k,ty)=>{k.P(k.T([-9,-14,9,-14,14,0,-14,0]),'#4a2a6a',{lw:1.3});k.P(k.R(-9,-16.4,18,3,1.3),'#e8c040',{lw:1.1});k.P(k.E(0,-24+ty,2.6,2.6),'#7fffb0',{nd:true,lw:.8});k.line([-6,-8,-3,-3],'#6a4a8a',1);k.line([5,-9,8,-4],'#6a4a8a',1)},
   head:(k,hy)=>{k.P(k.T([-11,hy-2,-14.4,hy+11,-8,hy+5]),'#d8d8d0',{lw:1.1});k.P(k.T([11,hy-2,14.4,hy+11,8,hy+5]),'#d8d8d0',{lw:1.1});k.P(k.T([-1.2,hy+.6,1.6,hy+.6,6.4,hy+6.4]),'#6f9658',{lw:1.1});k.P(k.E(-5,hy+5.4,1,1),'#5a7a44',{nd:true,ink:false});
    k.eye(-3.8,hy-1.2,1.6,'#7fff7a',true);k.eye(3.8,hy-1.2,1.6,'#7fff7a',true);k.line([-7,hy-4.4,-2,hy-2.6],'#2a1a3a',1.3);k.line([7,hy-4.4,2,hy-2.6],'#2a1a3a',1.3);k.line([-3,hy+6,0,hy+7.4,3.4,hy+5.8],'#2a1a3a',1);
    k.P(k.E(0,hy-8.4,15,3.4),'#2e1a48',{lw:1.3});k.P(k.T([-8,hy-8.6,8,hy-8.6,6,hy-21,-1,hy-30,-3,hy-37]),'#3a2058',{lw:1.3});k.P(k.R(-8,hy-13.4,16,3.2,1.2),'#e8c040',{lw:1.1})}},
  gigante:{s:1.25,tw:1.45,lw:1.35,hr:9.6,hw:1.12,fat:1,skin:'#a9c4e6',cloth:'#6a5238',fatCol:'#8a7050',arm:'#a9c4e6',pants:'#4a4038',boot:'#3a3028',belt:'#2a2018',wp:'club',
   body:(k,ty)=>{k.P(k.E(0,-33+ty,12.4,3.6),'#e8f0f8',{lw:1.1});k.P(k.E(0,-19+ty,9.6,8),'#a08060',{ink:false,nd:true});k.line([-5,-24+ty,-2,-20+ty],'#4a3a28',1);k.P(k.R(-3,-15.6,6,3,1),'#d8b040',{lw:1})},
   head:(k,hy)=>{k.P(k.E(0,hy+5,8.6,6.4),'#eef4fa',{lw:1.1});k.eye(-3.6,hy-.8,1.3,'#1e3a5a');k.eye(3.6,hy-.8,1.3,'#1e3a5a');k.line([-7,hy-3.8,-1.6,hy-2],'#6a86a8',2);k.line([7,hy-3.8,1.6,hy-2],'#6a86a8',2);k.P(k.E(0,hy+1.4,2.2,1.8),'#8aa8d0',{lw:1});
    k.P(k.E(0,hy-7.6,10.4,4.4),'#7a6040',{lw:1.2});[-1,1].forEach(sg=>k.P(k.T([sg*8,hy-7,sg*15,hy-13,sg*11.6,hy-18,sg*6,hy-9]),'#efe6cc',{lw:1.2}))}},
  shinobi:{s:.92,tw:.86,lw:.86,hr:9.6,hw:1,skin:'#d8b890',cloth:'#24242e',arm:'#24242e',pants:'#24242e',boot:'#16161c',belt:'#b8302a',wp:'sword',
   body:(k,ty)=>{k.line([-8,-32+ty,8,-14],'#6a6a78',1.6);k.line([8,-32+ty,-8,-14],'#6a6a78',1.6);k.P(k.R(-1.6,-17,3.2,3.6,1),'#b8b8c4',{lw:.9});[-1,1].forEach(sg=>k.P(k.T([sg*4,-14,sg*9,-14,sg*7,-4]),'#b8302a',{ink:false,nd:true}))},
   head:(k,hy)=>{k.P(k.E(0,hy-.4,10.8,9.8),'#24242e',{lw:1.3});k.P(k.R(-7,hy-3.6,14,5.2,2.2),'#d8b890',{ink:false,nd:true});k.eye(-3.6,hy-1.2,1.35,'#2c2224');k.eye(3.6,hy-1.2,1.35,'#2c2224');k.line([-6.4,hy-3.8,-1.6,hy-2.4],'#16161c',1.3);k.line([6.4,hy-3.8,1.6,hy-2.4],'#16161c',1.3);
    k.P(k.R(-10.8,hy-7.4,21.6,2.8,1),'#b8302a',{lw:1.1});const w=Math.sin((k.p.t||0)*2)*2;k.P(k.T([10,hy-7,21,hy-9+w,18,hy-3+w]),'#b8302a',{lw:1.1});k.P(k.T([10,hy-6,19,hy-2+w,14,hy+1]),'#8a2020',{lw:1})}},
  golem:{s:1.3,tw:1.6,lw:1.5,hr:9,hw:1.1,fat:1,skin:'#5a4e52',cloth:'#4a4044',fatCol:'#4a4044',arm:'#5a4e52',pants:'#3a3236',boot:'#2a2226',glove:'#3a3236',belt:null,wp:null,
   body:(k,ty)=>{k.P(k.E(-11.6,-32+ty,5.6,4.6,-.3),'#6a5e62',{lw:1.2});k.P(k.E(11.6,-32+ty,5.6,4.6,.3),'#6a5e62',{lw:1.2});k.P(k.E(0,-19+ty,10.4,8.6),'#5a4e52',{ink:false,nd:true});k.line([-7,-30+ty,-3,-24+ty,-6,-18+ty,-3,-13],'#ff7a2a',1.4);k.line([7,-30+ty,4,-25+ty,7,-19+ty],'#ff7a2a',1.4);
    k.g.save();k.g.globalAlpha=.4+.2*Math.sin((k.p.t||0)*3);k.g.fillStyle=k.C('#ffb040');k.g.beginPath();k.g.arc(0,-22+ty,8,0,TAU);k.g.fill();k.g.restore();k.P(k.E(0,-22+ty,3.6,3.6),'#ffb040',{nd:true,lw:.9})},
   head:(k,hy)=>{k.P(k.R(-8.8,hy-8.2,17.6,15.6,3),'#5a4e52',{lw:1.3});k.P(k.R(-7,hy-8,14,4,1.5),'#6a5e62',{ink:false,nd:true});k.eye(-4,hy-1,1.8,'#ffb040',true);k.eye(4,hy-1,1.8,'#ffb040',true);k.line([-5,hy+4.4,5,hy+4.4],'#ff7a2a',1.3);k.line([-1.4,hy-8,0,hy-2],'#ff7a2a',1)}}};
 M.bandido=(g,x,y,o)=>biped(g,x,y,o,CF.bandido);M.bruja=(g,x,y,o)=>biped(g,x,y,o,CF.bruja);M.gigante=(g,x,y,o)=>biped(g,x,y,o,CF.gigante);M.shinobi=(g,x,y,o)=>biped(g,x,y,o,CF.shinobi);M.golem=(g,x,y,o)=>biped(g,x,y,o,CF.golem);
 const CQ_OSO={s:1,col:'#6b4a32',belly:'#86654a',bx:20,by:12.4,len:7,lwid:6.2,hoof:'#2e2018',legX:[-.58,-.24,.3,.62],hx:21.6,hy:.4,hr:[8.6,7.6],sn:{x:7,y:2.6,rx:4.6,ry:3.6,col:'#a88a62'},
  pre:(k,by)=>{k.P(k.E(-20,by-1,3.2,3),'#5a3e28',{lw:1.1})},
  mid:(k,by)=>{k.P(k.E(-5,by-9.6,10,5,-.12),'#7e5a40',{nd:true,ink:false})},
  headFar:(k,hx,hy)=>{k.P(k.E(hx-5,hy-7.6,2.8,2.8),'#4e3622',{lw:1.1})},
  post:(k,hx,hy)=>{k.P(k.E(hx-1,hy-7.8,3,3),'#6b4a32',{lw:1.2});k.P(k.E(hx-1,hy-7.8,1.4,1.4),'#c89a7a',{nd:true,ink:false});k.eye(hx+2.8,hy-2,1.35);k.P(k.E(hx+10.6,hy+2.6,1.6,1.3),'#2c2224',{nd:true,ink:false});k.line([hx+3.6,hy+5.4,hx+9,hy+5.6],'#3a2a20',1);k.P(k.T([hx+5,hy+5.6,hx+6,hy+8.4,hx+7,hy+5.6]),'#fff',{lw:.7});k.line([hx-.8,hy-5,hx+5,hy-2.6],'#2a1a10',1.6)}};
 M.oso=(g,x,y,o)=>quad(g,x,y,o,CQ_OSO);
 // capitanes (cada uno custodia el Sello de su bioma): misma silueta de su familia, más grande y con accesorios
 M.k0=(g,x,y,o)=>biped(g,x,y,o,capOf(CF.bandido,{o:{s:1.12,tw:1.12,cloth:'#8a2e2a',arm:'#8a2e2a',wp:'cleaver',glove:'#4a3422'},body:(k,ty)=>{k.P(k.R(-9.6,-33+ty,19.2,4,1.5),'#e8c040',{lw:1});k.P(k.E(0,-24+ty,2,2),'#e8c040',{nd:true,lw:.8})},head:(k,hy)=>{k.P(k.E(-4,hy-.6,3,3),'#1e1814',{lw:1});k.line([-8,hy-6,0,hy+2],'#1e1814',1);k.P(k.T([-2,hy-13,6,hy-26,10,hy-12]),'#c8302a',{lw:1.2});k.P(k.R(-10.4,hy-7,20.8,3,1.2),'#e8c040',{lw:1})}}));
 M.k1=(g,x,y,o)=>quad(g,x,y,o,Object.assign({},CQ_OSO,{s:1.42,col:'#3f2c1e',belly:'#5a4030',sn:Object.assign({},CQ_OSO.sn,{col:'#8a6a48'}),
  mid:(k,by)=>{CQ_OSO.mid(k,by);for(let i=0;i<5;i++)k.P(k.T([-12+i*5,by-10.4,-10+i*5,by-17.4-(i%2),-7.4+i*5,by-10.4]),'#d8d0b8',{lw:1.1});k.line([2,by-4,6,by+3],'#c05a3a',1.4);k.line([-4,by-2,-1,by+5],'#c05a3a',1.2)},
  post:(k,hx,hy,by)=>{CQ_OSO.post(k,hx,hy,by);k.P(k.R(hx-9,hy+5.8,11,3.2,1.2),'#8a8a98',{lw:1});[0,1,2].forEach(i=>k.P(k.T([hx-8+i*4,hy+5.8,hx-6+i*4,hy+5.8,hx-7+i*4,hy+2.4]),'#c8c8d4',{lw:.9}));k.eye(hx+2.8,hy-2,1.5,'#ff5a3a',true)}}));
 M.k2=(g,x,y,o)=>biped(g,x,y,o,capOf(CF.bruja,{o:{s:1.22,tw:1,skin:'#78a05e',cloth:'#2e1a48'},back:k=>{const t=k.p.t||0;[-1,1].forEach(sg=>{k.g.save();k.g.globalAlpha=.5;k.g.fillStyle=k.C('#7fff7a');k.g.beginPath();k.g.ellipse(sg*18,-28+Math.sin(t*2+sg)*3,3,5,0,0,TAU);k.g.fill();k.g.restore()})},
   body:(k,ty)=>{k.P(k.E(0,-31+ty,9.4,2.6),'#e8c040',{lw:1});[-5,0,5].forEach(i=>k.P(k.E(i,-24+ty,1.3,1.3),'#7fff7a',{nd:true,lw:.7}))},head:(k,hy)=>{k.P(k.E(0,hy-30,2.2,2.2),'#7fff7a',{nd:true,lw:.8});k.P(k.E(0,hy-16,1.6,1.6),'#c03a3a',{nd:true,lw:.7})}}));
 M.k3=(g,x,y,o)=>biped(g,x,y,o,capOf(CF.gigante,{o:{s:1.46,cloth:'#3a4a68',fatCol:'#5a6a88',skin:'#8ab0dc'},body:(k,ty)=>{[-12,-6,0,6,12].forEach(sx=>k.P(k.T([sx-2,-34+ty,sx,-39+ty,sx+2,-34+ty]),'#e8f4ff',{lw:.9}));k.P(k.R(-9,-16,18,3.4,1.2),'#c8d8f0',{lw:1})},
   head:(k,hy)=>{[-5,0,5].forEach((sx,i)=>k.P(k.T([sx-2,hy-11,sx,hy-20-(i===1?5:0),sx+2,hy-11]),'#bfe8ff',{lw:1.2}));k.P(k.R(-9,hy-12,18,4,1.4),'#9ad0f0',{lw:1.2})}}));
 M.k4=(g,x,y,o)=>biped(g,x,y,o,capOf(CF.shinobi,{o:{s:1.16,cloth:'#3a1a24',arm:'#3a1a24',pants:'#2a1a22',wp:'sword',wpFar:'sword'},body:(k,ty)=>{const w=Math.sin((k.p.t||0)*2)*3;k.P(k.T([-8,-33+ty,-14-w,-24,-24-w,-14,-10,-22]),'#b8302a',{lw:1.1});k.P(k.R(-9,-33+ty,18,3,1.2),'#e8e8f0',{lw:1})},head:(k,hy)=>{k.P(k.E(0,hy-8.6,1.6,1.6),'#e8e8f0',{nd:true,lw:.7});k.eye(-3.6,hy-1.2,1.45,'#ff4a3a',true);k.eye(3.6,hy-1.2,1.45,'#ff4a3a',true)}}));
 M.k5=(g,x,y,o)=>biped(g,x,y,o,capOf(CF.golem,{o:{s:1.62,tw:1.7,skin:'#4a3e42',cloth:'#3a3034'},back:k=>{const t=k.p.t||0;flameAt(k,-12,-37,1.4,t,1);flameAt(k,12,-37,1.4,t,3)},
   body:(k,ty)=>{k.line([-9,-24+ty,-5,-20+ty,-8,-14],'#ffd23a',1.3);k.line([9,-26+ty,6,-21+ty,9,-16],'#ffd23a',1.3)},head:(k,hy)=>{[-1,1].forEach(sg=>k.P(k.T([sg*5,hy-7,sg*9,hy-16,sg*2,hy-9]),'#2a2226',{lw:1.2}));flameAt(k,0,hy-8,1.1,k.p.t||0,2)}}));
 // ───────────────────────── tabla: altura de la etiqueta (px de modelo, tras escala) y caja de horneado {w,h,ax,ay} ─────────────────────────
 const BOX={w:96,h:104,ax:48,ay:84},BIG={w:150,h:160,ax:75,ay:132};
 const H={gallina:23,vaca:26,oveja:26,jabali:29,lobo:31,yak:30,zorro:31,lagarto:20,rana:19,slime:22,orco:46,ogro:54,esqueleto:48,oni:66,demonio:64,goblin:34,b0:77,b1:52,b2:70,b3:77,b4:89,b5:94,bandido:52,oso:36,bruja:76,gigante:80,shinobi:52,golem:72,k0:62,k1:52,k2:96,k3:98,k4:62,k5:108}; // altura medida (px de modelo) = donde cuelga la etiqueta; MD[id].h = H/SPR (ver game.js)
 const MID_BOX={w:110,h:122,ax:55,ay:100},BX={bruja:MID_BOX,gigante:{w:120,h:132,ax:60,ay:108},golem:{w:120,h:128,ax:60,ay:104},k0:MID_BOX,k4:MID_BOX,k1:{w:128,h:110,ax:64,ay:88},k2:BIG,k3:BIG,k5:{w:160,h:176,ax:80,ay:146},oso:{w:104,h:104,ax:52,ay:84},b0:BIG,b1:BIG,b2:BIG,b3:BIG,b4:BIG,b5:BIG,yak:{w:110,h:104,ax:55,ay:84},lobo:{w:104,h:104,ax:52,ay:84},zorro:{w:104,h:104,ax:52,ay:84},lagarto:{w:112,h:90,ax:56,ay:72},ogro:{w:110,h:120,ax:55,ay:98},oni:{w:110,h:122,ax:55,ay:100},demonio:{w:120,h:122,ax:60,ay:100}};
 function reg(){for(const n in M){const f=M[n];ORG.U[n]=(g,x,y,sm,o)=>f(g,x,y,Object.assign({f:1},o||{}))}}
 reg();
 ORG.KSC.goblin=.65; // (obsoleto) tamaño del goblin human2d; desde oct 2026 el goblin del juego es CRE.M.goblin (biped) y ORG.U.goblin pasa a ser ese
 return{M,H,box:n=>BX[n]||BOX}})();
if(typeof module!=='undefined')module.exports={CRE};
