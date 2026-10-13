// NotScape · F2 · lenguaje de formas poligonales («low-poly pintado»). Helpers puros de dibujo, sin globales del juego.
// Estado: PRUEBA DE FORMAS (aún no conectado a game.js). El dueño elige el aspecto con docs/style-reference/prueba_formas_v3.html (el v1 original fue eliminado) antes de pintar terreno.
// API: STYLE (ajustes), facet(g,pts,o) (UN solo helper de polígono), shapes.* (árbol, pino, piedra, casa, cofre, personaje), mix/shade.
// Determinista: todo el azar sale de un hash (semilla), nunca de Math.random.
const STYLE={facets:2,jitter:.7,bevel:1,line:'#5b3a29',lineW:1.4,lineA:.85,grain:.55,shadeR:'#6a3a3a',shadeK:.28,paper:'#fdf9e3'};
const STY=(()=>{
 const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
 const mix=(a,b,t)=>{const A=hex(a),B=hex(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')};
 // tres tonos por color base: luz (cara superior), medio (izquierda), sombra (derecha, 28 % hacia #6a3a3a)
 const tones=c=>({l:mix(c,'#ffffff',.28),m:c,d:mix(c,STYLE.shadeR,STYLE.shadeK)});
 const rng=seed=>{let a=seed|0||1;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
 return{hex,mix,tones,rng}})();

// facet: polígono plano con un tono, jitter por vértice (determinista), relleno + trazos cortos de pincel recortados + contorno irregular.
// pts=[[x,y],...]; o={c:color, seed, ink:true|false, paint:true|false, jit:número}
function facet(g,pts,o){o=o||{};const R=STY.rng((o.seed||1)*7919+pts.length*104729),j=o.jit!=null?o.jit:STYLE.jitter;
 const P=pts.map(p=>[p[0]+(R()-.5)*2*j,p[1]+(R()-.5)*2*j]);
 g.save();g.lineJoin='round';g.lineCap='round';g.beginPath();g.moveTo(P[0][0],P[0][1]);for(let i=1;i<P.length;i++)g.lineTo(P[i][0],P[i][1]);g.closePath();
 g.fillStyle=o.c;g.fill();
 if(o.paint!==false){g.save();g.clip();let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;P.forEach(p=>{x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1])});
  const n=Math.max(3,Math.round((x1-x0)*(y1-y0)/90));g.lineCap='butt';
  for(let i=0;i<n;i++){const x=x0+R()*(x1-x0),y=y0+R()*(y1-y0),a=-.6+(R()-.5)*.9,L=3+R()*5;g.strokeStyle=R()<.5?'rgba(255,255,255,'+(.18+R()*.25)+')':'rgba(91,58,41,'+(.1+R()*.2)+')';g.lineWidth=1+R()*1.2;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*L,y+Math.sin(a)*L);g.stroke()}
  g.restore()}
 if(o.ink!==false){g.strokeStyle=STYLE.line;g.globalAlpha=STYLE.lineA;g.lineWidth=STYLE.lineW;
  for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length];g.beginPath();g.moveTo(a[0],a[1]);for(let s=1;s<=4;s++){const t=s/4;g.lineTo(a[0]+(b[0]-a[0])*t+(s<4?(R()-.5)*1.2:0),a[1]+(b[1]-a[1])*t+(s<4?(R()-.5)*1.2:0))}g.stroke()}}
 g.restore()}

// Masa n-gonal achatada (copa, roca, torreón): cara superior + n caras laterales visibles, cada una con UN tono según hacia dónde mira (luz arriba-izquierda).
// (cx,cy)=centro de la base, rx/ry=radios en pantalla (ry≈rx/2 por la proyección 2:1), h=altura, n=lados, top=factor de la cara superior (1=igual que la base, <1=cónica)
function mass(g,cx,cy,rx,ry,h,col,n,o){o=o||{};const T=STY.tones(col),R=STY.rng((o.seed||1)*131+n),tp=o.top!=null?o.top:.8,ph=o.rot||0.3;
 const ring=(k,yy,s)=>{const a=ph+k*Math.PI*2/n,w=.86+R()*.28;return[cx+Math.cos(a)*rx*s*w,yy+Math.sin(a)*ry*s*w]};
 const base=[],top=[];for(let k=0;k<n;k++){base.push(ring(k,cy,1));top.push(ring(k,cy-h,tp))}
 // lados visibles: los que miran hacia abajo en pantalla (sin(a)>0 en el punto medio)
 const sides=[];for(let k=0;k<n;k++){const a=ph+(k+.5)*Math.PI*2/n;if(Math.sin(a)>-.05)sides.push({k,a})}
 sides.sort((p,q)=>Math.sin(p.a)-Math.sin(q.a));
 sides.forEach(s=>{const k=s.k,k2=(k+1)%n,face=Math.cos(s.a); // cos<0 mira a la izquierda, >0 a la derecha
  const tone=face<-.45?T.l:face<.2?T.m:T.d;
  facet(g,[base[k],base[k2],top[k2],top[k]],{c:tone,seed:(o.seed||1)+k})});
 facet(g,top,{c:T.l,seed:(o.seed||1)+99});return{top:cy-h}}

// Prisma isométrico (casa, cofre, bloque): ancho w (eje x de mundo), fondo d (eje y), alto h; centro de la base en (cx,cy).
function prism(g,cx,cy,w,d,h,col,o){o=o||{};const T=STY.tones(col),s=o.seed||1;
 // vértices de la base (rombo): izquierda, abajo, derecha, arriba
 const P0=[cx-(w+d)/4,cy+(w-d)/8],P1=[cx+(w-d)/4,cy+(w+d)/8],P2=[cx+(w+d)/4,cy-(w-d)/8],P3=[cx-(w-d)/4,cy-(w+d)/8]; // izq, abajo, der, arriba
 const up=p=>[p[0],p[1]-h];
 facet(g,[P0,P1,up(P1),up(P0)],{c:T.m,seed:s+1});          // cara izquierda (media)
 facet(g,[P1,P2,up(P2),up(P1)],{c:T.d,seed:s+2});          // cara derecha (sombra)
 if(!o.noTop)facet(g,[up(P0),up(P1),up(P2),up(P3)],{c:T.l,seed:s+3});
 return{P0,P1,P2,P3,up}}

// Sombra de apoyo poligonal (rombo aplastado, alpha bajo): cae abajo a la derecha.
function shadow(g,cx,cy,rx,ry){g.save();g.fillStyle='rgba(91,58,41,.22)';g.beginPath();g.moveTo(cx-rx*.7,cy);g.lineTo(cx+rx*.2,cy+ry*.9);g.lineTo(cx+rx*1.25,cy+ry*.2);g.lineTo(cx+rx*.3,cy-ry*.7);g.closePath();g.fill();g.restore()}

const SHAPES={
 // nivel de detalle: STYLE.facets (1–3) → número de lados de las masas y de masas apiladas
 arbol(g,x,y,f){const n=[5,6,8][f-1];shadow(g,x,y,22,8);
  prism(g,x,y,7,7,16,'#8a5a32',{seed:11});
  const k=f===1?1:f===2?2:3,col=['#6fb04a','#7cbd52','#8acb5c'];
  for(let i=0;i<k;i++){const s=1-i*.22;mass(g,x+(i%2?3:-2),y-14-i*(f===3?11:13),18*s,9*s,f===1?20:12,col[i],n,{seed:20+i,top:.7})}},
 pino(g,x,y,f){shadow(g,x,y,20,7);prism(g,x,y,6,6,12,'#7a4e2c',{seed:31});
  const tiers=f+1;for(let i=0;i<tiers;i++){const s=1-i/(tiers+1)*.8;mass(g,x,y-8-i*(f===1?14:11),17*s,8.5*s,f===1?20:15,i%2?'#3f8a52':'#4a9a5a',[4,5,7][f-1]+0,{seed:40+i,top:.08})}},
 piedra(g,x,y,f){shadow(g,x,y,22,8);const n=[4,5,7][f-1];mass(g,x,y,17,8.5,9,'#a29d93',n,{seed:51,top:.7});
  if(f>=2)mass(g,x+10,y+3,9,4.5,6,'#b6b1a6',4,{seed:52,top:.7});if(f>=3)mass(g,x-11,y+2,7,3.5,5,'#948f86',4,{seed:53,top:.7});
  // veta de mena: facetas pequeñas del color luz
  facet(g,[[x-3,y-8],[x+2,y-9],[x+4,y-5],[x-1,y-4]],{c:'#f1c24a',seed:54,jit:.3})},
 casa(g,x,y,f){shadow(g,x,y,34,12);const b=prism(g,x,y,40,32,22,'#e6d2a6',{seed:61,noTop:true});
  // tejado a dos aguas (planos): cumbrera a lo largo del eje x
  const T=STY.tones('#d0674a'),up=p=>[p[0],p[1]-22],ry=14,P=b;
  const m0=[(P.P0[0]+P.P3[0])/2,(P.P0[1]+P.P3[1])/2-22-ry],m1=[(P.P1[0]+P.P2[0])/2,(P.P1[1]+P.P2[1])/2-22-ry];
  facet(g,[up(P.P0),up(P.P1),m1,m0],{c:T.m,seed:62});
  facet(g,[up(P.P1),up(P.P2),m1],{c:T.d,seed:63});
  facet(g,[up(P.P0),up(P.P3),m0],{c:T.l,seed:64,paint:false});
  facet(g,[[x-4,y+4],[x+4,y+8],[x+4,y-6],[x-4,y-10]].map(p=>[p[0]-8,p[1]+3]),{c:'#7a4e2c',seed:65});
  if(f>=2)facet(g,[[x+8,y-12],[x+16,y-8],[x+16,y-16],[x+8,y-20]],{c:'#9fd6e8',seed:66,jit:.3});
  if(f>=3)prism(g,x+18,y-34,6,6,12,'#a29d93',{seed:67})},
 cofre(g,x,y,f){shadow(g,x,y,16,6);prism(g,x,y,22,16,10,'#b9803f',{seed:71});
  const T=STY.tones('#9b6a3f');prism(g,x,y-10,22,16,f===1?4:6,'#c99650',{seed:72});
  facet(g,[[x-2,y-10],[x+3,y-8],[x+3,y-3],[x-2,y-5]],{c:'#f1c24a',seed:73,jit:.2});void T},
 personaje(g,x,y,f){shadow(g,x,y,12,5);
  prism(g,x-4,y,6,6,10,'#6a6fb0',{seed:81});prism(g,x+5,y+1,6,6,10,'#585d9a',{seed:82});          // piernas
  prism(g,x,y-10,16,9,12,'#d9a05a',{seed:83});                                                      // torso (tier bronce)
  if(f>=2){prism(g,x-10,y-10,5,5,10,'#c98a5a',{seed:84});prism(g,x+10,y-9,5,5,10,'#b0764a',{seed:85})} // brazos
  prism(g,x,y-24,10,10,10,'#f0c8a0',{seed:86})}                                                      // cabeza cúbica
};
if(typeof module!=='undefined')module.exports={STYLE,STY,facet,mass,prism,shadow,SHAPES};
