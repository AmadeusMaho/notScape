// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// FACHADAS DE LAS INSTALACIONES (oct 2026). Las instalaciones ya no están en el mapa: cada una vive en una casa de la aldea con puerta (ver interiors.js).
// Para que se reconozcan a simple vista, la puerta de cada casa lleva un TOLDO a rayas del color del oficio, un CARTEL con el emblema (yunque, monedas, bolsa, jarra, martillo y sierra)
// y objetos de oficio junto a la entrada (leña y yunque en la herrería, barriles y farol en la taberna, pilares dorados en el banco, cajas de fruta en la tienda, tablones en el taller).
// Todo se pinta en vector sobre el plano de la pared (matriz isométrica), con el material del bioma (madera, bambú lacado, piedra volcánica…). Se dibuja desde dDoor(), que game.js llama
// para las entidades ST con id 'door' (y que el contorno de selección también usa, así que al pasar el ratón se perfila toda la fachada).
// Usa globales de game.js (ctx, SIL, SPX, SPY, SPR, ISO, P, parts…) solo en tiempo de llamada.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
(()=>{
 const TR={ // color principal / secundario del oficio (el principal coincide con el de la ventana de la instalación)
  herreria:{c:'#e5784a',c2:'#33302f',nm:'Herrería'},banco:{c:'#e8b84a',c2:'#2f5f9a',nm:'Banco'},tienda:{c:'#e58aa8',c2:'#4f9a5a',nm:'Tienda'},
  taberna:{c:'#ff9a3a',c2:'#8a3a1a',nm:'Taberna'},taller:{c:'#4aa39a',c2:'#8a5a30',nm:'Taller'}};
 // material de cartel por bioma: tablero / marco / alféizar del toldo (cream)
 const MAT=[{b:'#b9803f',f:'#5a3e28',cr:'#f7f1e1'},{b:'#8a5e34',f:'#3a2616',cr:'#e9e0c0'},{b:'#a8884e',f:'#4e3e26',cr:'#efe6c8'},{b:'#6a4a30',f:'#25160b',cr:'#f4f8fb'},{b:'#a02a22',f:'#e0b050',cr:'#f6efe0'},{b:'#3a2e2c',f:'#ff8a2a',cr:'#e8c898'}];
 const sh=(h,f)=>{const n=parseInt(h.slice(1),16);let r=n>>16&255,g=n>>8&255,b=n&255;if(f<0){r*=1+f;g*=1+f;b*=1+f}else{r+=(255-r)*f;g+=(255-g)*f;b+=(255-b)*f}return'#'+((1<<24)|(Math.round(r)<<16)|(Math.round(g)<<8)|Math.round(b)).toString(16).slice(1)};
 let G=null;   // geometría de la fachada que se está pintando
 function setup(e,s){const rot=!!e.rot,a=rot?[0,-1]:[1,0],n=rot?[1,0]:[0,1],hs=SPR*s;G={e,s,hs,a,n,P:(u,o,h)=>{const wx=e.x+a[0]*u+n[0]*(o-14),wy=e.y+a[1]*u+n[1]*(o-14),c=ISO.toCanvas(wx,wy,0);return[c.x-SPX,c.y-SPY-h*hs]}}}
 const poly=(pts,fill,line)=>{ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(line){ctx.strokeStyle=line;ctx.lineWidth=Math.max(1,G.s*.7);ctx.stroke()}};
 // caja alineada con los ejes del mundo (la fachada la define en (u,o)): se pintan solo las caras visibles (+x, +y, tapa)
 function box(u0,u1,o0,o1,h0,h1,col,line){const A=[G.e.x+G.a[0]*u0+G.n[0]*(o0-14),G.e.y+G.a[1]*u0+G.n[1]*(o0-14)],B=[G.e.x+G.a[0]*u1+G.n[0]*(o1-14),G.e.y+G.a[1]*u1+G.n[1]*(o1-14)],
  x0=Math.min(A[0],B[0]),x1=Math.max(A[0],B[0]),y0=Math.min(A[1],B[1]),y1=Math.max(A[1],B[1]),p=(x,y,h)=>{const c=ISO.toCanvas(x,y,0);return[c.x-SPX,c.y-SPY-h*G.hs]},ln=line||'rgba(30,18,8,.55)';
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
   box(19,25,0,5,0,54,'#8a7a70');box(17.5,26.5,-1,6,54,58,'#5a504a')},   // tubo de chimenea
  taberna(k,t,s){box(-44,-32,2,12,0,11,'#9a6a3a');box(-30,-19,3,12,0,10,'#8a5a30');   // barriles
   const S=G.P(24,6,38),sw=Math.sin(t*1.6+G.e.x)*1.4*s;   // farol colgante
   ctx.strokeStyle='rgba(30,18,8,.8)';ctx.lineWidth=Math.max(1,s*.8);ctx.beginPath();ctx.moveTo(S[0],S[1]-6*G.hs*.5);ctx.lineTo(S[0]+sw,S[1]);ctx.stroke();
   if(!SIL){ctx.fillStyle='#ffdc86';ctx.fillRect(S[0]+sw-2.5*s,S[1],5*s,6*s);ctx.strokeStyle='#4a2a14';ctx.strokeRect(S[0]+sw-2.5*s,S[1],5*s,6*s);ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(S[0]+sw,S[1]+3*s,0,S[0]+sw,S[1]+3*s,26*s);g.addColorStop(0,'#ffb04a55');g.addColorStop(1,'#ffb04a00');ctx.fillStyle=g;ctx.fillRect(S[0]+sw-26*s,S[1]-23*s,52*s,52*s);ctx.restore()}
   else ctx.fillRect(S[0]+sw-2.5*s,S[1],5*s,6*s);
   box(-18,-8,8,13,0,6,MAT[k].b)},   // banco de madera
  banco(k,t,s){const M=MAT[k];for(const u of[-31,31]){box(u-4,u+4,0,8,0,46,sh(k===5?'#6a5a58':'#c9c4b6',0));box(u-5.5,u+5.5,-1,9.5,46,50,'#e8b84a');box(u-5.5,u+5.5,-1,9.5,0,3,sh('#c9c4b6',-.25))}},
  tienda(k,t,s){box(-44,-30,2,13,0,9,'#a8783f');box(-43,-31,3,12,9,10.5,'#d44a3a');box(30,42,3,13,0,8,'#b8883f');box(31,41,4,12,8,9.5,'#e8c040');   // cajas con fruta
   box(-26,-22,10,13,0,5,'#c98a4a');box(34,38,-1,3,0,3,'#e58aa8')},
  taller(k,t,s){box(-42,-26,2,9,0,3,'#c89860');box(-41,-27,3,8,3,6,'#d8a870');box(-40,-28,4,7,6,9,'#c89860');   // tablones
   box(24,28,2,5,0,14,'#8a5a30');box(36,40,2,5,0,14,'#8a5a30');box(22,42,3,4,12,15,'#a8783f')}};   // caballete
 window.dDoor=function(e,t){const fa=TR[e.room];if(!fa){return}const s=ISO.scale(),k=e.k||0,M=MAT[k]||MAT[0];setup(e,s);
  if(!SIL){const near=Math.hypot(P.x-e.x,P.y-e.y)<90,a=(near?.5:.18)+.08*Math.sin(t*3+e.x),p=ISO.toCanvas(e.x,e.y,0);ctx.save();ctx.setTransform(1,0,0,1,0,0);const x=p.x-SPX,y=p.y-SPY-4*s;ctx.globalAlpha=a;ctx.fillStyle='#ffd88a';ctx.beginPath();ctx.ellipse(x,y,17*s,8*s,0,0,7);ctx.fill();ctx.globalAlpha=Math.min(1,a+.3);ctx.strokeStyle='#fff0b8';ctx.lineWidth=Math.max(1,s*.9);ctx.beginPath();ctx.ellipse(x,y,17*s,8*s,0,0,7);ctx.stroke();ctx.restore()}
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.lineJoin='round';
  try{ (ex[e.room]||(()=>0))(k,t,s);
   // toldo a rayas (sobre la puerta): del muro hacia fuera y hacia abajo
   const W0=24,N=6,h0=40,h1=33,oo=13;
   for(let i=0;i<N;i++){const u0=-W0+i*(2*W0/N),u1=u0+2*W0/N,c=i%2?M.cr:fa.c;poly([G.P(u0,0,h0),G.P(u1,0,h0),G.P(u1,oo,h1),G.P(u0,oo,h1)],i%2?sh(c,-.03):sh(c,-.05),'rgba(40,24,10,.45)')}
   for(let i=0;i<N;i++){const u0=-W0+i*(2*W0/N),u1=u0+2*W0/N,c=i%2?M.cr:fa.c;poly([G.P(u0,oo,h1),G.P(u1,oo,h1),G.P(u1,oo,h1-4),G.P((u0+u1)/2,oo,h1-6)],sh(c,-.22),'rgba(40,24,10,.4)')}   // volante festoneado
   poly([G.P(W0,0,h0),G.P(W0,oo,h1),G.P(W0,oo,h1-4),G.P(W0,0,h0-3)],sh(fa.c,-.4),'rgba(40,24,10,.45)');
   // cartel sobre el toldo
   const bh0=44,bh1=60,bw=19;
   flat(2.2,()=>{ctx.fillStyle=M.f;ctx.fillRect(-bw-1.6,bh0-1.6,bw*2+3.2,bh1-bh0+3.2)});
   flat(2.8,()=>{ctx.fillStyle=M.b;ctx.fillRect(-bw,bh0,bw*2,bh1-bh0);const g=ctx.createLinearGradient(0,bh1,0,bh0);g.addColorStop(0,'rgba(255,255,255,.18)');g.addColorStop(1,'rgba(0,0,0,.16)');ctx.fillStyle=g;ctx.fillRect(-bw,bh0,bw*2,bh1-bh0);
    ctx.fillStyle=fa.c;ctx.fillRect(-bw,bh0,bw*2,2.4);if(!SIL){ctx.save();ctx.translate(0,(bh0+bh1)/2+1);ctx.scale(1,-1);(em[e.room])(k===5?'#ff9a3a':e.room==='herreria'?'#2c2a2a':fa.c2);ctx.restore()}});
   // chimenea con humo: la sueltan la herrería, la taberna y el taller (partículas del juego)
  }finally{ctx.restore()}
  if(!SIL&&e.room==='herreria'&&Math.abs(e.x-P.x)<420&&Math.abs(e.y-P.y)<320&&Math.random()<(window.OCDT||.016)*2.2)sp(e.x+G.a[0]*22+G.n[0]*(-12),e.y+G.a[1]*22+G.n[1]*(-12)-64,'#9a9a9a',1,8,16,-8)};
 window.FACADE={TR,MAT};
})();
