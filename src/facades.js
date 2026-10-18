// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// FACHADAS DE LAS INSTALACIONES (oct 2026). Las instalaciones ya no están en el mapa: cada una vive en una casa de la aldea con puerta (ver interiors.js).
// Para que se reconozcan a simple vista, la puerta de cada casa lleva un TOLDO a rayas del color del oficio y sobre el tejado flota un MEDALLÓN con el emblema (yunque, monedas, bolsa, jarra, martillo y sierra; lote D3: ya no hay cartel, y el medallón se oculta con zoom alejado)
// y objetos de oficio junto a la entrada (leña y yunque en la herrería, barriles y farol en la taberna, pilares dorados en el banco, cajas de fruta en la tienda, tablones en el taller).
// Todo se pinta en vector sobre el plano de la pared (matriz isométrica), con el material del bioma (madera, bambú lacado, piedra volcánica…). Se dibuja desde dDoor(), que game.js llama
// para las entidades ST con id 'door' (y que el contorno de selección también usa, así que al pasar el ratón se perfila toda la fachada).
// Usa globales de game.js (ctx, SIL, SPX, SPY, SPR, ISO, P, parts…) solo en tiempo de llamada.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
(()=>{
 const TR={ // color principal / secundario del oficio (el principal coincide con el de la ventana de la instalación)
  herreria:{c:'#e5784a',c2:'#33302f',nm:'Herrería'},banco:{c:'#e8b84a',c2:'#2f5f9a',nm:'Banco'},tienda:{c:'#e58aa8',c2:'#4f9a5a',nm:'Tienda'},
  taberna:{c:'#ff9a3a',c2:'#8a3a1a',nm:'Taberna'},taller:{c:'#4aa39a',c2:'#8a5a30',nm:'Taller'},templo:{c:'#b79adf',c2:'#4a3a6a',nm:'Templo'}};
 // material de cartel por bioma: tablero / marco / alféizar del toldo (cream)
 const MAT=[{b:'#c18a48',f:'#5a3e28',cr:'#f7f1e1'},{b:'#a0703e',f:'#3a2616',cr:'#e9e0c0'},{b:'#a8884e',f:'#4e3e26',cr:'#efe6c8'},{b:'#9a7048',f:'#3a2414',cr:'#f4f8fb'},{b:'#a02a22',f:'#e0b050',cr:'#f6efe0'},{b:'#6a5248',f:'#ff8a2a',cr:'#e8c898'}]; // lote D2: tableros de Bosque/Cumbres/Volcán aclarados (de lejos se leían como un bloque negro)
 // ALTURAS POR MODELO DE CASA (lote D2, oct 2026), en px lógicos medidos del modelo (unidades × KSC): b = altura del suelo de la puerta (palafito: plataforma),
 // D = alto de la puerta, E = alero (o la viga del 1.er piso en la taberna). Antes la fachada usaba alturas fijas (toldo a ~60 px y cartel a 66-90 px) y en TODAS
 // las casas el toldo quedaba sobre el tejado y el cartel flotando por encima (la casa normal mide 37 px; la nórdica 17). Casa nueva = añadir su fila aquí. so = cuánto se adelanta el cartel desde la pared (palafito: su tejado vuela mucho y tapaba el cartel).
 const FH={casa:{b:0,D:25,E:37,T:66},taberna:{b:0,D:28,E:30,T:80},troncos:{b:0,D:23,E:32,T:58},palafito:{b:31.7,D:19,E:23,T:98},casaLarga:{b:0,D:15,E:17,T:34},salon:{b:0,D:16,E:22,T:72},casaJp:{b:4.2,D:17.6,E:29,T:48},casaMaya:{b:4.2,D:17.6,E:23,T:44},iglesia:{b:0,D:20,E:40,T:92},pagoda:{b:0,D:20,E:40,T:110},templo:{b:0,D:20,E:40,T:80}};   // T = cumbrera del tejado (px desde el suelo, de tools/house_ruler.py): el medallón flota encima
 const UH=px=>px/1.5;   // px lógicos → unidades de altura de la fachada (G.hs = SPR·s)
 const sh=(h,f)=>{const n=parseInt(h.slice(1),16);let r=n>>16&255,g=n>>8&255,b=n&255;if(f<0){r*=1+f;g*=1+f;b*=1+f}else{r+=(255-r)*f;g+=(255-g)*f;b+=(255-b)*f}return'#'+((1<<24)|(Math.round(r)<<16)|(Math.round(g)<<8)|Math.round(b)).toString(16).slice(1)};
 let DU=0;
 let G=null;   // geometría de la fachada que se está pintando
 function setup(e,s){const Z0=TER.standZ(e.x,e.y),rot=!!e.rot,a=rot?[0,-1]:[1,0],n=rot?[1,0]:[0,1],fs=ORG.HK||1,hs=SPR*s*fs;G={e,s,hs,fs,a,n,Z0,P:(u,o,h)=>{const wx=e.x+a[0]*(u*fs+DU)+n[0]*(o*fs-14),wy=e.y+a[1]*(u*fs+DU)+n[1]*(o*fs-14),c=ISO.toCanvas(wx,wy,Z0);return[c.x-SPX,c.y-SPY-h*hs]}}}
 const poly=(pts,fill,line)=>{ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(line){ctx.strokeStyle=line;ctx.lineWidth=Math.max(1,G.s*.7);ctx.stroke()}};
 // caja alineada con los ejes del mundo (la fachada la define en (u,o)): se pintan solo las caras visibles (+x, +y, tapa)
 function box(u0,u1,o0,o1,h0,h1,col,line){const fs=G.fs,A=[G.e.x+G.a[0]*(u0*fs+DU)+G.n[0]*(o0*fs-14),G.e.y+G.a[1]*(u0*fs+DU)+G.n[1]*(o0*fs-14)],B=[G.e.x+G.a[0]*(u1*fs+DU)+G.n[0]*(o1*fs-14),G.e.y+G.a[1]*(u1*fs+DU)+G.n[1]*(o1*fs-14)],
  x0=Math.min(A[0],B[0]),x1=Math.max(A[0],B[0]),y0=Math.min(A[1],B[1]),y1=Math.max(A[1],B[1]),p=(x,y,h)=>{const c=ISO.toCanvas(x,y,G.Z0);return[c.x-SPX,c.y-SPY-h*G.hs]},ln=line||'rgba(30,18,8,.55)';
  poly([p(x0,y1,h0),p(x1,y1,h0),p(x1,y1,h1),p(x0,y1,h1)],sh(col,-.12),ln);   // cara +y
  poly([p(x1,y1,h0),p(x1,y0,h0),p(x1,y0,h1),p(x1,y1,h1)],sh(col,-.32),ln);   // cara +x
  poly([p(x0,y0,h1),p(x1,y0,h1),p(x1,y1,h1),p(x0,y1,h1)],sh(col,.14),ln)}   // tapa
 // pasa a coordenadas planas de la pared: u a lo largo (+ = derecha en pantalla), v hacia ARRIBA en px de altura; o = distancia a la pared
 function flat(o,fn){const O=G.P(0,o,0),U=G.P(1,o,0),du=[U[0]-O[0],U[1]-O[1]];ctx.save();ctx.setTransform(du[0],du[1],0,-G.hs,O[0],O[1]);try{fn()}finally{ctx.restore()}}
 const em={ // emblemas planos (centro en 0,0; ~±8 de tamaño; v hacia arriba)
  herreria(c){ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(-9,3);ctx.lineTo(6,3);ctx.lineTo(10,1);ctx.lineTo(6,-1);ctx.lineTo(3,-2);ctx.lineTo(3,-4);ctx.lineTo(6,-6);ctx.lineTo(-6,-6);ctx.lineTo(-4,-4);ctx.lineTo(-4,-2);ctx.lineTo(-9,-1);ctx.closePath();ctx.fill()},
  banco(c){for(let i=0;i<3;i++){ctx.fillStyle=i%2?sh(c,-.15):c;ctx.beginPath();ctx.ellipse(0,3-i*3.2,7,2.6,0,0,7);ctx.fill();ctx.fillRect(-7,-i*3.2+.2,14,3.2);ctx.strokeStyle='rgba(60,40,0,.5)';ctx.lineWidth=.5;ctx.strokeRect(-7,-i*3.2+.2,14,3.2)}ctx.fillStyle=sh(c,.25);ctx.beginPath();ctx.ellipse(0,-6.5,7,2.6,0,0,7);ctx.fill()},
  tienda(c){ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(-3,-7);ctx.quadraticCurveTo(-9,-2,-8,3);ctx.quadraticCurveTo(0,6,8,3);ctx.quadraticCurveTo(9,-2,3,-7);ctx.closePath();ctx.fill();ctx.fillStyle=sh(c,-.3);ctx.fillRect(-3.4,-8,6.8,2);ctx.fillStyle='#fff';ctx.globalAlpha=.9;ctx.beginPath();ctx.arc(0,-.5,3,0,7);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=sh(c,-.35);ctx.fillRect(-.6,-2.8,1.2,4.6)},
  taberna(c){ctx.fillStyle=c;ctx.fillRect(-6,-5,10,10);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(5.5,0,3.2,3.4,0,-1.57,1.57);ctx.stroke();ctx.fillStyle='#fff6d8';ctx.beginPath();ctx.arc(-4,-5,2.6,0,7);ctx.arc(-.5,-6,3,0,7);ctx.arc(2.6,-5,2.4,0,7);ctx.fill();ctx.fillStyle=sh(c,-.3);ctx.fillRect(-6,1,10,1)},
  taller(c){ctx.save();ctx.rotate(-.7);ctx.fillStyle=c;ctx.fillRect(-1,-8,2,16);ctx.fillRect(-5,-8,10,4.2);ctx.restore();ctx.save();ctx.rotate(.75);ctx.fillStyle=sh(c,.35);ctx.fillRect(-8,-1.3,16,2.6);ctx.fillStyle=sh(c,-.35);ctx.fillRect(7,-3,3,5);ctx.restore()}};
 const ex={ // objetos de oficio junto a la puerta (u<0 a la izquierda, u>0 a la derecha)
  herreria(k,t,s){const M=MAT[k];box(-40,-28,2,12,0,8,'#6a4a2a');box(-38,-30,4,10,8,12.5,'#4a4e58');box(-36,-27,4.5,9.5,12.5,15,'#4a4e58');   // tocón + yunque
   box(30,44,2,10,0,5,'#3a3636');box(33,41,3,9,5,8,'#262222');   // montón de carbón
   const T=G.P(36,5,9);ctx.save();ctx.globalAlpha=.55+.25*Math.sin(t*9);ctx.fillStyle='#ff8a2a';ctx.beginPath();ctx.arc(T[0],T[1],2.4*G.s,0,7);ctx.fill();ctx.restore();
   },   // (lote D2) sin el «tubo de chimenea» suelto delante de la casa: parecía un poste; la casa ya tiene chimenea
  taberna(k,t,s){box(-44,-32,2,12,0,11,'#9a6a3a');box(-30,-19,3,12,0,10,'#8a5a30');   // barriles
   const S=G.P(22,6,G.hA-2),sw=Math.sin(t*1.6+G.e.x)*1.4*s;   // farol colgante (a la altura del toldo)
   ctx.strokeStyle='rgba(30,18,8,.8)';ctx.lineWidth=Math.max(1,s*.8);ctx.beginPath();ctx.moveTo(S[0],S[1]-6*G.hs*.5);ctx.lineTo(S[0]+sw,S[1]);ctx.stroke();
   if(!SIL){ctx.fillStyle='#ffdc86';ctx.fillRect(S[0]+sw-2.5*s,S[1],5*s,6*s);ctx.strokeStyle='#4a2a14';ctx.strokeRect(S[0]+sw-2.5*s,S[1],5*s,6*s);ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(S[0]+sw,S[1]+3*s,0,S[0]+sw,S[1]+3*s,26*s);g.addColorStop(0,'#ffb04a55');g.addColorStop(1,'#ffb04a00');ctx.fillStyle=g;ctx.fillRect(S[0]+sw-26*s,S[1]-23*s,52*s,52*s);ctx.restore()}
   else ctx.fillRect(S[0]+sw-2.5*s,S[1],5*s,6*s);
   box(-18,-8,8,13,0,6,MAT[k].b)},   // banco de madera
  banco(k,t,s){box(18,30,3,12,0,6,'#7a4a24');box(18,30,3,12,3,4.6,'#e8b84a');box(22,26,11.2,12.4,2,4.2,'#e8b84a')},   // lote D4: cofre con refuerzo dorado (los pilares gruesos se fueron con el toldo)
  tienda(k,t,s){box(-44,-30,2,13,0,9,'#a8783f');box(-43,-31,3,12,9,10.5,'#d44a3a');box(30,42,3,13,0,8,'#b8883f');box(31,41,4,12,8,9.5,'#e8c040');   // cajas con fruta
   box(-26,-22,10,13,0,5,'#c98a4a');box(34,38,-1,3,0,3,'#e58aa8')},
  taller(k,t,s){box(-42,-26,2,9,0,3,'#c89860');box(-41,-27,3,8,3,6,'#d8a870');box(-40,-28,4,7,6,9,'#c89860');   // tablones
   box(24,28,2,5,0,14,'#8a5a30');box(36,40,2,5,0,14,'#8a5a30');box(22,42,3,4,12,15,'#a8783f')}};   // caballete
 // MEDALLÓN FLOTANTE (lote D3, oct 2026): sustituye al cartel de tablero. Disco con el color del oficio y el emblema en el centro, flotando sobre el tejado (billboard: sin plano de pared,
 // así no hay paralelogramos en casas giradas). Se hornea una vez por oficio × bioma × escala y se pinta con drawImage. Solo se ve con zoom >= MZ (alejado = oculto).
 const MZ=1.6,MC=new Map(),MKE={herreria:'⚒️',banco:'🏦',tienda:'🛒',taberna:'🍺',taller:'🪚',templo:'⛪'};   // medallón = icono PINTADO del juego (item-icons.js, el mismo del mapa); antes eran emblemas vectoriales planos y la bolsa/jarra salían al revés
 function medal(room,k,lp){const key=room+k+'|'+lp.toFixed(2),h=MC.get(key);if(h)return h;const fa=TR[room],r=11.5*lp,W=Math.ceil(r*2+4*lp),c=document.createElement('canvas');c.width=c.height=W;const g=c.getContext('2d'),cx=W/2,cy=W/2;
  const gr=g.createRadialGradient(cx-r*.35,cy-r*.4,r*.1,cx,cy,r);gr.addColorStop(0,sh(fa.c,.38));gr.addColorStop(.6,fa.c);gr.addColorStop(1,sh(fa.c,-.3));
  g.beginPath();g.arc(cx,cy,r,0,7);g.fillStyle=gr;g.fill();
  g.globalAlpha=.65;g.lineWidth=.9*lp;g.strokeStyle=sh(fa.c,.55);g.beginPath();g.arc(cx,cy,r*.8,0,7);g.stroke();g.globalAlpha=1;
  const mk=(typeof ITEMICON!=='undefined')&&ITEMICON.marker(MKE[room]);if(mk){const z=r*1.5;g.drawImage(mk,cx-z/2,cy-z/2+.5*lp,z,z)}else{const sv=ctx;ctx=g;try{g.save();g.translate(cx,cy);const q=r/11.5*.8;g.scale(q,-q);em[room]&&em[room](k===5?'#3a1a10':room==='herreria'?'#2c2a2a':fa.c2);g.restore()}finally{ctx=sv}}
  g.lineWidth=1.4*lp;g.strokeStyle='#5b3a29';g.beginPath();g.arc(cx,cy,r,0,7);g.stroke();
  MC.set(key,c);return c}
 window.dDoor=function(e,t){const fa=TR[e.room];if(!fa){return}const s=ISO.scale(),k=e.k||0,M=MAT[k]||MAT[0];setup(e,s);
  if(!SIL){const near=Math.hypot(P.x-e.x,P.y-e.y)<90,a=(near?.5:.18)+.08*Math.sin(t*3+e.x),p=ISO.toCanvas(e.x,e.y,G.Z0);ctx.save();ctx.setTransform(1,0,0,1,0,0);const x=p.x-SPX,y=p.y-SPY-4*s;ctx.globalAlpha=a;ctx.fillStyle='#ffd88a';ctx.beginPath();ctx.ellipse(x,y,17*s,8*s,0,0,7);ctx.fill();ctx.globalAlpha=Math.min(1,a+.3);ctx.strokeStyle='#fff0b8';ctx.lineWidth=Math.max(1,s*.9);ctx.beginPath();ctx.ellipse(x,y,17*s,8*s,0,0,7);ctx.stroke();ctx.restore()}
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.lineJoin='round';
  const F=FH[e.hn]||FH.casa,hb=UH(F.b),h0=hb+UH(Math.min(F.E-2,F.D+7));G.hA=h0;   // toldo justo encima de la puerta y por debajo del alero
  try{ (ex[e.room]||(()=>0))(k,t,s);
   // PORCHE (lote D4, sustituye al toldo a rayas «de mercadillo» y a los pilares del banco): marco de puerta de madera + peldaño de piedra + tejadillo liso pintado del color del
   // oficio, con ménsulas, tablas marcadas y remate crema. Todo con los materiales del bioma (MAT) y el contorno suave de la guía de estilo.
   if(e.room!=='templo'){const W0=15.5,oo=11,t=1.5,h1=h0-UH(6),hD=hb+UH(F.D),wd=sh(M.b,-.36),wl=sh(M.b,-.14),stn=k===5?'#6c5c58':k===3?'#b8c0ca':k===4?'#bdb4a6':'#c9c4b6',LN='rgba(50,30,14,.5)',c=fa.c;
    box(-12,12,0,12,hb,hb+UH(1.6),stn);                                     // peldaño de piedra
    box(-10.2,-8,0,2.4,hb,hD,wd);box(8,10.2,0,2.4,hb,hD,wd);box(-10.8,10.8,0,2.6,hD-.4,hD+UH(2.4),wd);   // jambas y dintel de madera oscura
    for(const u of[-1,1]){const x=u*12.4;poly([G.P(x,0,h0-UH(1)),G.P(x,0,h0-UH(9)),G.P(x,oo*.8,h1-.2)],wl,LN)}   // ménsulas
    poly([G.P(W0,0,h0),G.P(W0,oo,h1),G.P(W0,oo,h1+t),G.P(W0,0,h0+t)],sh(c,-.5),LN);                         // canto derecho
    poly([G.P(-W0,oo,h1),G.P(W0,oo,h1),G.P(W0,oo,h1+t),G.P(-W0,oo,h1+t)],sh(c,-.3),LN);                     // canto frontal
    poly([G.P(-W0,0,h0+t),G.P(W0,0,h0+t),G.P(W0,oo,h1+t),G.P(-W0,oo,h1+t)],sh(c,.08),LN);                   // faldón
    ctx.save();ctx.strokeStyle='rgba(50,30,14,.28)';ctx.lineWidth=Math.max(1,G.s*.6);for(let i=1;i<5;i++){const f=i/5,a=G.P(-W0,oo*f,h0+t+(h1-h0)*f),b=G.P(W0,oo*f,h0+t+(h1-h0)*f);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke()}
    ctx.strokeStyle=M.cr;ctx.globalAlpha=.85;ctx.lineWidth=Math.max(1,G.s*.9);{const a=G.P(-W0,oo,h1+t),b=G.P(W0,oo,h1+t);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke()}ctx.restore()}   // remate crema del borde
   // medallón flotante sobre el tejado (lote D3; sustituye al cartel). Oculto con zoom alejado y en la silueta de selección.
   if(!SIL&&ISO.V.zoom>=MZ){const lp=G.hs/1.5/G.fs,bob=Math.sin(t*1.8+e.x)*1.5,pt=G.P(0,-10,UH(F.T||F.E+24)),py=pt[1]-(14+bob)*lp,c=medal(e.room,k,lp);
    ctx.save();ctx.globalAlpha=.16;ctx.fillStyle='#3a2410';ctx.beginPath();ctx.ellipse(pt[0],pt[1]-1.5*lp,6*lp,2.4*lp,0,0,7);ctx.fill();ctx.restore();   // sombra tenue sobre el tejado
    ctx.drawImage(c,Math.round(pt[0]-c.width/2),Math.round(py-c.height/2))}
   // chimenea con humo: la sueltan la herrería, la taberna y el taller (partículas del juego)
  }finally{ctx.restore()}
  };
 window.FACADE={TR,MAT,FH,MKE};
})();
