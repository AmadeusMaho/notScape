// NotScape · F2 · formas ORGÁNICAS (árboles, rocas, arbustos, criaturas). PRUEBA: aún no conectado a game.js.
// Requiere style.js cargado antes (STYLE, STY, facet, shadow, prism). Mantiene la proyección isométrica 2:1 del juego.
// Dos familias para elegir con el ojo (ver docs/style-reference/prueba_formas_v3.png):
//   A · «blobs triangulados»: mallas de 12–30 triángulos deformadas por hash, iluminadas por NORMAL real (luz arriba-izquierda).
//       smooth=0 → un tono plano por triángulo; smooth>0 → degradado por vértice dentro de cada triángulo (estilo OSRS/Gouraud).
//       Solo la SILUETA lleva contorno grueso; las aristas interiores van sin línea (o muy tenues con o.inner).
//   B · «racimos pintados»: polígonos irregulares festoneados apilados con 3 capas de tono (o degradado radial si smooth>0).
// Todo determinista (hash sembrado), sin Math.random. Pensado para prerenderizarse una vez a caché (sin coste por frame).
const ORG=(()=>{
 // Proyección ortográfica dimétrica 2:1 (elevación 30°): igual que ISO.proj en forma. Unidades del modelo = px de pantalla a zoom 1.
 let KS=1;
 const COW={body:{z:17,rx:19,ry:11,rz:11},legH:15,legs:[{x:-10,y:-6},{x:10,y:-6},{x:-10,y:6},{x:10,y:6}]}; // datos: las patas deben entrar en el cuerpo (ver checks)
 // escala de modelo del objeto en curso (se fija por objeto en U)
 const C=.7071,KY=.3536,KZ=.866;
 const L=(()=>{const v=[-.55,.25,.8],m=Math.hypot(v[0],v[1],v[2]);return v.map(a=>a/m)})(); // hacia la luz: arriba a la izquierda
 const VIEW=[.612,.612,.5];                                                                  // hacia la cámara
 const norm=v=>{const m=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/m,v[1]/m,v[2]/m]};
 const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
 // posición de modelo a partir de «desplazamiento horizontal en pantalla, profundidad (+ = hacia la cámara), altura»
 const at=(sx,d,z)=>[(d+sx/C)/2,(d-sx/C)/2,z];

 // ---- mallas ----
 function ico(det){const t=(1+Math.sqrt(5))/2;
  let V=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(norm);
  let T=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  for(;det>0;det--){const cache={},mid=(a,b)=>{const k=a<b?a+'_'+b:b+'_'+a;if(cache[k]!=null)return cache[k];V.push(norm([0,1,2].map(i=>(V[a][i]+V[b][i])/2)));return cache[k]=V.length-1};
   const N=[];T.forEach(([a,b,c])=>{const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);N.push([a,ab,ca],[b,bc,ab],[c,ca,bc],[ab,bc,ca])});T=N}
  return{V,T}}
 // blob: icosaedro deformado. o={at:[X,Y,Z] centro, r:[rx,ry,rz], amp (0–.4), det (0 = 20 tris, 1 = 80), seed, flat (base plana a la altura del suelo del blob)}
 function blob(o){const base=ico(o.det||0),R=STY.rng((o.seed||1)*3571),a=o.amp!=null?o.amp:.25,r=o.r,c=o.at;
  const V=base.V.map(u=>{const k=1+(R()-.5)*2*a;let z=c[2]+u[2]*r[2]*k;if(o.flat)z=Math.max(z,c[2]-r[2]*.35);return[c[0]+u[0]*r[0]*k,c[1]+u[1]*r[1]*k,z]});
  return{V,T:base.T.map(t=>t.slice()),c}}
 // cono / pirámide irregular (copas de pino, flecos de sauce): base en o.at, altura o.h (negativa = apunta hacia abajo)
 function cone(o){const n=o.n||7,R=STY.rng((o.seed||1)*2713),a=o.amp!=null?o.amp:.15,c=o.at,V=[],T=[];
  for(let k=0;k<n;k++){const an=(k+R()*.4)*Math.PI*2/n,j=1+(R()-.5)*2*a;V.push([c[0]+Math.cos(an)*o.r[0]*j,c[1]+Math.sin(an)*o.r[1]*j,c[2]])}
  V.push([c[0]+(R()-.5)*o.r[0]*.2,c[1]+(R()-.5)*o.r[1]*.2,c[2]+o.h]);
  for(let k=0;k<n;k++)T.push([k,(k+1)%n,n]);
  return{V,T,c:[c[0],c[1],c[2]+o.h/2]}}

 // ---- iluminación y pincel ----
 const lit=n=>Math.max(0,Math.min(1,(dot(n,L)+.42)/1.22));                // 0 = cara a contraluz, ~.6 = cara izquierda, 1 = cara superior
 const ramp=(col,s)=>{const l=STY.mix(col,'#ffffff',.36),d=STY.mix(col,STYLE.shadeR,.5);return s<.6?STY.mix(d,col,s/.6):STY.mix(col,l,(s-.6)/.4)};
 const ink=(g,a,b,R,ij)=>{g.beginPath();g.moveTo(a[0],a[1]);for(let s=1;s<=4;s++){const t=s/4,e=s<4?(R()-.5)*ij:0;g.lineTo(a[0]+(b[0]-a[0])*t+e,a[1]+(b[1]-a[1])*t+e)}g.stroke()};

 // drawMesh: pinta una malla. o={smooth:0..1, seed, inner:alpha de aristas interiores (0 = ninguna), paint:true|false, ink:true|false}
 function drawMesh(g,ox,oy,m,col,o){o=o||{};const sm=o.smooth||0,R=STY.rng((o.seed||1)*6007+m.V.length);
  const k=o.k||1,P=m.V.map(v=>[ox+k*C*(v[0]-v[1]),oy+k*(KY*(v[0]+v[1])-KZ*v[2])]);
  // orientar hacia fuera y calcular normales de cara y de vértice (suaves)
  const F=m.T.map(t=>{const A=m.V[t[0]],B=m.V[t[1]],D=m.V[t[2]];let n=cross(sub(B,A),sub(D,A));const ce=[(A[0]+B[0]+D[0])/3,(A[1]+B[1]+D[1])/3,(A[2]+B[2]+D[2])/3];
   if(dot(n,sub(ce,m.c))<0){n=n.map(q=>-q);t=[t[0],t[2],t[1]]}return{t,n:norm(n),area:n,ce}});
  const VN=m.V.map(()=>[0,0,0]);F.forEach(f=>f.t.forEach(i=>{VN[i][0]+=f.area[0];VN[i][1]+=f.area[1];VN[i][2]+=f.area[2]}));VN.forEach((n,i)=>VN[i]=norm(n));
  const front=F.filter(f=>dot(f.n,VIEW)>0).sort((p,q)=>dot(p.ce,VIEW)-dot(q.ce,VIEW));
  front.forEach(f=>{const t=f.t,jit=(R()-.5)*.08,pts=t.map(i=>P[i]);
   let fill;
   if(sm<.02){let lv=Math.max(0,Math.min(1,lit(f.n)+(o.bands?0:jit)));if(o.bands)lv=Math.round(lv*(o.bands-1))/(o.bands-1);fill=ramp(col,lv)}
   else{const sv=t.map(i=>Math.max(0,Math.min(1,lit(norm(f.n.map((q,k)=>q*(1-sm)+VN[i][k]*sm)))+jit)));
    let lo=0,hi=0;sv.forEach((s,k)=>{if(s<sv[lo])lo=k;if(s>sv[hi])hi=k});
    if(hi===lo||Math.abs(sv[hi]-sv[lo])<.02)fill=ramp(col,sv[0]);
    else{fill=g.createLinearGradient(pts[lo][0],pts[lo][1],pts[hi][0],pts[hi][1]);fill.addColorStop(0,ramp(col,sv[lo]));fill.addColorStop(1,ramp(col,sv[hi]))}}
   g.beginPath();g.moveTo(pts[0][0],pts[0][1]);g.lineTo(pts[1][0],pts[1][1]);g.lineTo(pts[2][0],pts[2][1]);g.closePath();
   g.fillStyle=fill;g.fill();g.lineWidth=.9;g.lineJoin='round';g.strokeStyle=fill;g.stroke()}); // el trazo del mismo color tapa las costuras
  // trazos cortos de pincel recortados a la silueta
  if(o.paint!==false&&front.length){g.save();g.beginPath();front.forEach(f=>{const p=f.t.map(i=>P[i]);g.moveTo(p[0][0],p[0][1]);g.lineTo(p[1][0],p[1][1]);g.lineTo(p[2][0],p[2][1]);g.closePath()});g.clip();
   let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;P.forEach(p=>{x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1])});
   const n=Math.max(4,Math.round((x1-x0)*(y1-y0)/170));g.lineCap='butt';
   for(let i=0;i<n;i++){const x=x0+R()*(x1-x0),y=y0+R()*(y1-y0),a=-.6+(R()-.5)*.9,len=3+R()*5;g.strokeStyle=R()<.55?'rgba(255,255,255,'+(.1+R()*.2)+')':'rgba(91,58,41,'+(.08+R()*.16)+')';g.lineWidth=1+R()*1.3;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*len,y+Math.sin(a)*len);g.stroke()}
   g.restore()}
  // aristas: solo la silueta (borde con una cara trasera o sin vecino) con contorno irregular; las interiores, opcionales y muy tenues
  const cnt={};front.forEach(f=>{for(let k=0;k<3;k++){const a=f.t[k],b=f.t[(k+1)%3],key=a<b?a+'_'+b:b+'_'+a;const e=(cnt[key]=cnt[key]||{a,b,n:0,ns:[]});e.n++;e.ns.push(f.n)}});
  g.save();g.lineJoin='round';g.lineCap='round';
  if(o.inner)for(const k in cnt)if(cnt[k].n>1){g.strokeStyle='rgba(91,58,41,'+o.inner+')';g.lineWidth=.7;g.beginPath();g.moveTo(P[cnt[k].a][0],P[cnt[k].a][1]);g.lineTo(P[cnt[k].b][0],P[cnt[k].b][1]);g.stroke()}
  if(o.crease)for(const k in cnt){const e=cnt[k];if(e.n===2&&dot(e.ns[0],e.ns[1])<.86){g.strokeStyle='rgba(91,58,41,'+o.crease+')';g.lineWidth=.8;g.beginPath();g.moveTo(P[e.a][0],P[e.a][1]);g.lineTo(P[e.b][0],P[e.b][1]);g.stroke()}} // pliegues: aristas entre caras con ángulo marcado, muy tenues
  if(o.ink!==false){g.strokeStyle=STYLE.line;g.globalAlpha=STYLE.lineA;g.lineWidth=o.lw||STYLE.lineW;const ij=o.ij!=null?o.ij:1.2;for(const q in cnt)if(cnt[q].n===1)ink(g,P[cnt[q].a],P[cnt[q].b],R,ij)}
  g.restore()}

 // ---- B · racimo pintado: polígono festoneado con 3 capas de tono (o degradado radial si sm>0) ----
 function clump(g,cx,cy,rx,ry,col,seed,sm,m){m=m||9;const T=STY.tones(col),R=STY.rng(seed*977),pts=[];
  for(let k=0;k<m;k++){const a=k*Math.PI*2/m+R()*.25,rr=(.82+R()*.3)*(k%2?.9:1.06);pts.push([cx+Math.cos(a)*rx*rr,cy+Math.sin(a)*ry*rr])}
  const sc=(f,dx,dy)=>pts.map(p=>[cx+(p[0]-cx)*f+dx*rx,cy+(p[1]-cy)*f+dy*ry]);
  if(sm>0){const gr=g.createRadialGradient(cx-.3*rx,cy-.45*ry,rx*.1,cx,cy,rx*1.15);gr.addColorStop(0,T.l);gr.addColorStop(.5,T.m);gr.addColorStop(1,T.d);facet(g,pts,{c:gr,seed});}
  else{facet(g,pts,{c:T.d,seed});facet(g,sc(.9,-.07,-.1),{c:T.m,seed:seed+1,ink:false,jit:.4});facet(g,sc(.55,-.22,-.32),{c:T.l,seed:seed+2,ink:false,jit:.4})}
  return pts}
 // B · piso de pino: silueta con dientes abajo, mitad izquierda media, derecha sombra, filo de luz
 function tier(g,x,y,w,h,col,seed,sm){const T=STY.tones(col),R=STY.rng(seed*541),teeth=4,bot=[];
  for(let k=0;k<=teeth*2;k++){const f=k/(teeth*2);bot.push([x+w-2*w*f,y+(k%2?h*.2:0)+(R()-.5)*1.2])}
  const sil=[[x,y-h]].concat(bot),left=[[x,y-h]].concat(bot.slice(teeth)),
   fillR=sm>0?(()=>{const gr=g.createLinearGradient(x-w,y-h,x+w,y);gr.addColorStop(0,T.l);gr.addColorStop(.45,T.m);gr.addColorStop(1,T.d);return gr})():T.d;
  facet(g,sil,{c:fillR,seed});if(sm<=0){facet(g,left.slice().reverse(),{c:T.m,seed:seed+1,ink:false,jit:.4});facet(g,[[x,y-h],[x-w*.55,y-h*.2],[x-w*.2,y-h*.1]],{c:T.l,seed:seed+2,ink:false,jit:.3,paint:false})}}

 // ---- Catálogo de pruebas: A(g,x,y,sm) y B(g,x,y,sm) con las mismas 6 especies. (x,y) = pies; sm = suavidad 0..1 ----
 const bl=(g,x,y,o,col,sm,seed,extra)=>drawMesh(g,x,y,blob(Object.assign({seed},o)),col,Object.assign({smooth:sm,seed,k:KS},extra||{}));
 const A={
  roble(g,x,y,sm){shadow(g,x,y,28,10);prism(g,x,y,8,8,20,'#a8784a',{seed:11});const c='#8cc070';
   bl(g,x,y,{at:at(-13,-5,32),r:[14,14,11],amp:.38},c,sm,1);bl(g,x,y,{at:at(14,-4,34),r:[13,13,11],amp:.38},c,sm,2);
   bl(g,x,y,{at:at(0,-2,46),r:[16,16,12],amp:.36},c,sm,6);
   bl(g,x,y,{at:at(0,4,38),r:[20,20,14],amp:.34},c,sm,3);bl(g,x,y,{at:at(-5,10,28),r:[13,13,9],amp:.38},c,sm,4);bl(g,x,y,{at:at(9,9,30),r:[11,11,8],amp:.38},c,sm,7)},
  sauce(g,x,y,sm){shadow(g,x,y,28,10);prism(g,x,y,7,7,22,'#a58d6a',{seed:13});const c='#8fcbb8';
   for(let k=0;k<10;k++){const a=k*Math.PI*2/10+.2,d=Math.sin(a)*16,sx=Math.cos(a)*19;if(d<-6)drawMesh(g,x,y,cone({at:at(sx,d,40),r:[4.5,4.5],h:-15-(k%3)*3,n:4,seed:20+k}),STY.mix(c,'#ffffff',.3),{smooth:sm,seed:20+k})}
   bl(g,x,y,{at:at(0,0,44),r:[21,21,14],amp:.3},c,sm,5);
   for(let k=0;k<10;k++){const a=k*Math.PI*2/10+.2,d=Math.sin(a)*16,sx=Math.cos(a)*19;if(d>=-6)drawMesh(g,x,y,cone({at:at(sx,d,40),r:[4.5,4.5],h:-16-(k%3)*3,n:4,seed:20+k}),STY.mix(c,'#ffffff',k%2?.12:.3),{smooth:sm,seed:20+k})}},
  pino(g,x,y,sm){shadow(g,x,y,22,8);prism(g,x,y,6,6,12,'#b08a5f',{seed:31});const c='#6fae7c';
   [[21,17,28,0],[17,16,45,1],[11,15,60,2]].forEach(([r,h,z,i])=>drawMesh(g,x,y,cone({at:[0,0,z-14],r:[r,r],h,n:7,seed:40+i,amp:.12}),i%2?'#5fa070':c,{smooth:sm,seed:40+i}))},
  piedra(g,x,y,sm){shadow(g,x,y,24,8);bl(g,x,y,{at:at(0,0,7),r:[17,15,9],amp:.22,flat:true},'#a29d93',sm,51);
   bl(g,x,y,{at:at(12,5,4),r:[8,7,5],amp:.22,flat:true},'#b6b1a6',sm,52);bl(g,x,y,{at:at(-3,2,12),r:[4.5,4,3.4],amp:.2},'#f1c24a',sm,53,{paint:false})},
  arbusto(g,x,y,sm){shadow(g,x,y,18,6);const c='#6fb048';bl(g,x,y,{at:at(-6,-1,8),r:[9,9,7],amp:.3},c,sm,61);bl(g,x,y,{at:at(7,-1,8),r:[9,9,7],amp:.3},c,sm,62);bl(g,x,y,{at:at(0,4,9),r:[10,10,8],amp:.3},c,sm,63);
   [[-4,3,17],[5,2,16]].forEach(([sx,d,z],i)=>bl(g,x,y,{at:at(sx,d,z),r:[2.2,2.2,2],amp:.1},i?'#ffd75a':'#ff9ac0',sm,64+i,{paint:false}))},
  vaca(g,x,y,sm){soft(g,x,y,24);const w='#f4efe6',k='#6b5a52',B=COW.body,mk=(m,c,sd,e)=>drawMesh(g,x,y,m,c,Object.assign({smooth:sm,seed:sd,k:KS,crease:.15,ij:.6},e||{}));
   const leg=(l,col,sd)=>{mk(lathe({n:6,at:[l.x,l.y,0],r:[3,3],h:COW.legH,top:1.15,seed:sd}),col,sd);mk(lathe({n:6,at:[l.x,l.y,0],r:[3.3,3.3],h:2.6,seed:sd+1}),k,sd+1,{crease:0})};
   leg(COW.legs[0],'#d8d1c3',70);leg(COW.legs[1],'#d8d1c3',72);
   bl(g,x,y,{at:[0,0,B.z],r:[B.rx,B.ry,B.rz],amp:.1},w,sm,74);bl(g,x,y,{at:[-3,-1,B.z+B.rz*.86],r:[7,5,2.2],amp:.1},k,sm,75,{paint:false});bl(g,x,y,{at:[-1,B.ry*.86,B.z+4],r:[4.5,2.2,4],amp:.1},k,sm,76,{paint:false});
   leg(COW.legs[2],'#ece6d9',78);leg(COW.legs[3],'#ece6d9',80);
   bl(g,x,y,{at:[B.rx+1,0,B.z+9],r:[8,7,7],amp:.12},w,sm,82);bl(g,x,y,{at:[B.rx+8,0,B.z+6],r:[4.2,4.6,3.4],amp:.08},'#f2b8b0',sm,83,{paint:false});
   [[-1],[1]].forEach(([sg],q)=>{bl(g,x,y,{at:[B.rx,sg*6.5,B.z+17],r:[2.2,1.8,3],amp:.08},'#e8e2d6',sm,84+q,{paint:false});bl(g,x,y,{at:[B.rx+2,sg*5.5,B.z+10],r:[1,1,1],amp:0},'#3b2a22',sm,86+q,{paint:false,ink:false})})}
 };
 const B={
  roble(g,x,y,sm){shadow(g,x,y,26,9);prism(g,x,y,7,7,17,'#a8784a',{seed:11});const c='#8cc070';
   clump(g,x-11,y-30,12,9,c,1,sm);clump(g,x+11,y-32,11,9,c,2,sm);clump(g,x,y-40,15,11,c,3,sm);clump(g,x-3,y-24,13,8,c,4,sm)},
  sauce(g,x,y,sm){shadow(g,x,y,26,9);prism(g,x,y,6,6,18,'#a58d6a',{seed:13});const c='#8fcbb8',T=STY.tones(c);
   clump(g,x,y-38,19,9,c,5,sm,10);for(let k=0;k<7;k++){const sx=x-16+k*5.3,top=y-36+Math.abs(k-3)*.9,len=16+(k%3)*3;facet(g,[[sx-2.6,top],[sx+2.6,top],[sx+1.2,top+len],[sx-.8,top+len+1]],{c:k%2?T.m:T.d,seed:30+k,jit:.4})}},
  pino(g,x,y,sm){shadow(g,x,y,22,8);prism(g,x,y,6,6,12,'#b08a5f',{seed:31});tier(g,x,y-8,18,22,'#6fae7c',41,sm);tier(g,x,y-22,14,20,'#5fa070',42,sm);tier(g,x,y-35,10,20,'#6fae7c',43,sm)},
  piedra(g,x,y,sm){shadow(g,x,y,24,8);const T=STY.tones('#a29d93'),sil=[[x-17,y-1],[x-14,y-9],[x-6,y-14],[x+5,y-14],[x+14,y-8],[x+18,y-1],[x+8,y+4],[x-8,y+3]];
   const gr=sm>0?(()=>{const q=g.createLinearGradient(x-17,y-14,x+18,y+4);q.addColorStop(0,T.l);q.addColorStop(.5,T.m);q.addColorStop(1,T.d);return q})():T.m;
   facet(g,sil,{c:gr,seed:51});if(sm<=0){facet(g,[[x-14,y-9],[x-6,y-14],[x+5,y-14],[x+1,y-6],[x-9,y-4]],{c:T.l,seed:52,ink:false,jit:.4});facet(g,[[x+5,y-14],[x+14,y-8],[x+18,y-1],[x+8,y+4],[x+2,y-3]],{c:T.d,seed:53,ink:false,jit:.4})}
   facet(g,[[x-6,y-11],[x-1,y-12],[x+1,y-8],[x-4,y-6]],{c:'#f1c24a',seed:54,jit:.3,paint:false})},
  arbusto(g,x,y,sm){shadow(g,x,y,18,6);const c='#6fb048';clump(g,x-7,y-8,9,7,c,61,sm,8);clump(g,x+7,y-8,9,7,c,62,sm,8);clump(g,x,y-6,11,8,c,63,sm,8);
   facet(g,[[x-5,y-15],[x-2,y-16],[x-2,y-13],[x-5,y-13]],{c:'#ff9ac0',seed:64,jit:.2,paint:false});facet(g,[[x+4,y-14],[x+7,y-15],[x+7,y-12],[x+4,y-12]],{c:'#ffd75a',seed:65,jit:.2,paint:false})},
  vaca(g,x,y,sm){shadow(g,x,y,24,8);const w='#f4efe6',T=STY.tones(w);
   [[-9,-3],[10,-3],[-9,4],[10,4]].forEach(([a,b],i)=>facet(g,[[x+a-2.6,y+b-10],[x+a+2.6,y+b-10],[x+a+2.2,y+b],[x+a-2.2,y+b]],{c:i%2?T.d:T.m,seed:70+i,jit:.3}));
   clump(g,x,y-14,17,9,w,72,sm,10);facet(g,[[x-7,y-20],[x-1,y-22],[x+2,y-17],[x-4,y-14]],{c:'#6b5a52',seed:73,ink:false,jit:.4,paint:false});facet(g,[[x+5,y-12],[x+10,y-14],[x+11,y-9],[x+6,y-8]],{c:'#6b5a52',seed:74,ink:false,jit:.4,paint:false});
   clump(g,x+17,y-17,7,6,w,77,sm,8);facet(g,[[x+21,y-16],[x+27,y-15],[x+27,y-11],[x+21,y-11]],{c:'#f2b8b0',seed:78,jit:.3,paint:false});
   facet(g,[[x+14,y-26],[x+16,y-30],[x+17,y-25]],{c:'#e8e2d6',seed:79,jit:.2});facet(g,[[x+20,y-25],[x+23,y-29],[x+23,y-24]],{c:'#e8e2d6',seed:80,jit:.2})}
 };

 // ---- constructores de mallas para formas rígidas y personajes ----
 // lathe: prisma/cilindro de n lados con anillo superior escalado (top) y tapa. n=4 y rot=π/4 → caja; top<1 → tronco de pirámide; top>1 → hombro ancho.
 const lathe=o=>{const n=o.n||6,R=STY.rng((o.seed||1)*1237),jt=o.jit||0,c=o.at,V=[],T=[],rot=o.rot||0,top=o.top!=null?o.top:1;
  const ring=(z,sc)=>{for(let k=0;k<n;k++){const a=rot+(k+(R()-.5)*jt)*Math.PI*2/n,j=1+(R()-.5)*(o.amp||0);V.push([c[0]+Math.cos(a)*o.r[0]*sc*j,c[1]+Math.sin(a)*o.r[1]*sc*j,c[2]+z])}};
  ring(0,1);ring(o.h,top);for(let k=0;k<n;k++){const k2=(k+1)%n;T.push([k,k2,n+k2],[k,n+k2,n+k])}
  if(o.cap!==false){V.push([c[0],c[1],c[2]+o.h]);for(let k=0;k<n;k++)T.push([n+k,n+(k+1)%n,2*n])}
  return{V,T,c:[c[0],c[1],c[2]+o.h/2]}};
 const box=(w,d,h,at,o)=>Object.assign(lathe(Object.assign({n:4,rot:Math.PI/4,r:[w/1.4142,d/1.4142],h,at},o)),{rig:1});
 // gable: tejado a dos aguas con la cumbrera a lo largo de X (ov = alero)
 const gable=o=>{const c=o.at,w=o.w/2+(o.ov||0),d=o.d/2+(o.ov||0),h=o.h,P=[[-w,-d,0],[w,-d,0],[w,d,0],[-w,d,0],[-w,0,h],[w,0,h]].map(v=>[c[0]+v[0],c[1]+v[1],c[2]+v[2]]);
  return{V:P,T:[[0,1,5],[0,5,4],[3,2,5],[3,5,4],[0,3,4],[1,2,5]],c:[c[0],c[1],c[2]+h/3],rig:1}};
 // 14 oct 2026: tejado a dos aguas SIN los triángulos de los hastiales (gableOpen) + hastiales como pared del color del muro (gableEnds): así el piso de arriba se ve macizo y no «por dentro»
 const gableOpen=o=>{const g=gable(o);return{V:g.V,T:[[0,1,5],[0,5,4],[3,2,5],[3,5,4]],c:g.c,rig:1}};
 const gableEnds=o=>{const w=o.w/2+.15,d=o.d/2,hh=o.at[2],ov=o.ov||0,r=o.h*(d/(d+ov)),h2=o.h,V=[],T=[];[-1,1].forEach(sx=>{const b=V.length,X=o.at[0]+sx*w;V.push([X,o.at[1]-d,hh-.5],[X,o.at[1]+d,hh-.5],[X,o.at[1]+d,hh+(o.h-r)],[X,o.at[1],hh+h2-.3],[X,o.at[1]-d,hh+(o.h-r)]);T.push([b,b+1,b+2],[b,b+2,b+4],[b+4,b+2,b+3])});return{V,T,c:[o.at[0],o.at[1],hh+o.h/3],rig:1}};
 // hip: tejado a cuatro aguas (pirámide truncada a punta) con la base alineada a los ejes; ov = alero
 const hip=o=>{const c=o.at,w=o.w/2+(o.ov||0),d=o.d/2+(o.ov||0),h=o.h,P=[[-w,-d,0],[w,-d,0],[w,d,0],[-w,d,0],[0,0,h]].map(v=>[c[0]+v[0],c[1]+v[1],c[2]+v[2]]);return{V:P,T:[[0,1,4],[1,2,4],[2,3,4],[3,0,4]],c:[c[0],c[1],c[2]+h/3],rig:1}};
 // tilt: gira una malla construida a lo largo de Z para que apunte a lo largo de X ('x') o de Y ('y', dir ±1) desde el punto at
 const tilt=(m,at,axis,dir)=>{dir=dir||1;const f=v=>axis==='x'?[v[2]*dir+at[0],v[1]+at[1],v[0]+at[2]]:[v[0]+at[0],v[2]*dir+at[1],v[1]+at[2]];return{V:m.V.map(f),T:m.T,c:f(m.c)}};
 let NOSOFT=false; // true al hornear la silueta del contorno de hover: sin sombra de apoyo (si no, el contorno rodea la sombra como una «alfombrilla»)
 const soft=(g,x,y,rx)=>{if(NOSOFT)return;rx*=KS;g.save();g.fillStyle='rgba(91,58,41,.15)';g.beginPath();g.ellipse(x+rx*.15,y+rx*.08,rx,rx*.5,0,0,Math.PI*2);g.fill();g.restore()}; // sombra de apoyo: elipse blanda (permitida)
 let ROT=false; // espejo diagonal (x↔y): la misma casa «de lado», con la cumbrera y la puerta giradas
 const mir=m=>Object.assign({},m,{V:m.V.map(v=>[v[1],v[0],v[2]]),c:m.c&&[m.c[1],m.c[0],m.c[2]]});
 let TH=null; // tema de bioma (F3-C): mapa color→color que se aplica a TODAS las mallas (la misma casa en piedra o en madera)
 let DEFSM=0; // mezcla 3D/2D unificada: las mallas orgánicas (no cajas ni tejados) llevan luz suave por vértice por defecto
 const M=(g,x,y,m,col,sm,seed,e)=>drawMesh(g,x,y,ROT?mir(m):m,(TH&&TH[col])||col,Object.assign({smooth:sm||(m.rig?0:DEFSM),seed,k:KS},e));
 const RG={crease:.2,ij:.5};

 // ---- Tiers (datos, guía §3): principal; luz y sombra salen de la rampa ----
 const TIER={cuero:'#b98560',cobre:'#e0906a',bronce:'#d9a05a',hierro:'#939eac',acero:'#a9c4dc',plata:'#e3e1ee',mitril:'#7f9be0',adam:'#7fc08a'};
 // ---- Especies de árbol como DATOS (copa, tronco, altura de tronco, masas [desp.pantalla, profundidad, altura, radio, radio vertical]) ----
 const SPECIES={
  roble:{c:'#8cc070',tr:'#a8784a',th:16,L:[[0,2,31,20,13],[-4,-1,46,14,11]]},
  abedul:{c:'#a9d68a',tr:'#efe9dc',th:22,L:[[0,2,38,14,11],[1,-1,51,10,9]],marks:1},
  arce:{c:'#f0a878',tr:'#a8704a',th:16,L:[[0,2,31,22,12],[8,-1,44,13,10]]},
  fresno:{c:'#c9d985',tr:'#b9a57a',th:18,L:[[0,2,35,13,15],[0,-1,50,9,10]]},
  tejo:{c:'#8fa3d4',tr:'#7a6a80',th:15,L:[[0,2,34,18,17]]},
  ebano:{c:'#a67bb8',tr:'#4f3f52',th:18,L:[[-2,2,34,19,14],[6,-1,47,12,10]]},
  caoba:{c:'#d4785a',tr:'#6a3a2a',th:20,L:[[0,2,40,22,16],[-6,-1,56,15,12]]},
  baobab:{c:'#bdb85a',tr:'#9a8a68',th:26,L:[[0,2,46,26,12],[8,-1,56,16,9],[-9,0,54,15,9]]},
  mundo:{c:'#62d6a6',tr:'#7a5a3a',th:26,L:[[0,2,46,24,16],[-8,-1,62,16,12],[8,0,72,13,11]]}};
 const trunkH=sp=>Math.max(sp.th,Math.min.apply(null,sp.L.map(l=>l[2]-l[4]))+5); // el tronco siempre llega 5 px dentro de la masa más baja
 function tree(g,x,y,sm,sp){soft(g,x,y,20);M(g,x,y,lathe({n:6,at:[0,0,0],r:[3.6,3.6],h:trunkH(sp),top:.78,seed:3}),sp.tr,sm,3,RG);
  if(sp.marks)for(let k=0;k<3;k++)M(g,x,y,box(1.4,2.4,.9,[3.2,(k-1)*1.4,3+k*5.5]),'#5b4a40',0,40+k,{ink:false,paint:false});
  sp.L.forEach((l,i)=>M(g,x,y,blob({at:at(l[0],l[1],l[2]),r:[l[3],l[3],l[4]],amp:.15,seed:10+i}),sp.c,sm,10+i))}
 // ---- Personaje: tres proporciones y tiers recoloreables. Mira hacia +X (abajo a la derecha en pantalla). ----
 const BUILD={esbelto:{lh:12,lr:2.4,th:12,tw:10,td:6,hr:4.4,hh:8.5,ar:2.1,al:11},robusto:{lh:9,lr:3,th:11,tw:12,td:7.5,hr:5.2,hh:9,ar:2.7,al:9.5},chibi:{lh:6,lr:3.1,th:8,tw:10.5,td:7,hr:6.8,hh:10,ar:2.6,al:7},goblin:{lh:5,lr:2.2,th:7,tw:8,td:5.5,hr:5.4,hh:8.5,ar:1.8,al:6.5}};
 function person(g,x,y,sm,b,col,o){o=o||{};const B=BUILD[b],skin=o.skin||'#f3cba3',pants=o.pants||'#6b4f8a',boot='#7a5238',zl=B.lh,zt=zl+B.th,ty=B.tw/2+B.ar*.9,P=(m,c,e,sd)=>M(g,x,y,m,c,sm,sd,Object.assign({crease:.16,ij:.3,lw:1},e));
  soft(g,x,y,15);
  const arm=(yy,sd)=>{P(lathe({n:6,at:[0,yy,zt-B.al],r:[B.ar,B.ar],h:B.al,top:1.18,seed:sd}),col,0,sd);P(lathe({n:6,at:[0,yy,zt-B.al-2.4],r:[B.ar*.92,B.ar*.92],h:2.6,seed:sd+1}),skin,0,sd+1)};
  const leg=(yy,sd)=>{P(lathe({n:6,at:[0,yy,0],r:[B.lr,B.lr],h:zl,top:1.1,seed:sd}),pants,0,sd);P(lathe({n:6,at:[0,yy,0],r:[B.lr*1.1,B.lr*1.1],h:Math.min(3.8,zl*.45),seed:sd+1}),boot,0,sd+1)};
  arm(-ty,5);leg(-B.tw*.24,7);leg(B.tw*.24,9);
  P(lathe({n:4,rot:Math.PI/4,at:[0,0,zl],r:[B.td/1.4142,B.tw/1.4142],h:B.th,top:1.12,seed:11}),col,0,11);
  P(box(B.td+.9,B.tw+.9,1.7,[0,0,zl+.4],{cap:false}),boot,0,13);
  if(b==='goblin')P(tilt(cone({at:[0,0,0],r:[2.2,2.2],h:6,n:4,amp:0,seed:2}),[0,-B.hr,zt+B.hh*.55],'y',-1),skin,0,15);
  arm(ty,17);
  const hx=B.hr;
  P(lathe({n:8,rot:Math.PI/8,at:[0,0,zt],r:[hx,hx],h:B.hh,top:.92,seed:19}),skin,0,19);
  if(b==='goblin')P(tilt(cone({at:[0,0,0],r:[2.2,2.2],h:6,n:4,amp:0,seed:3}),[0,B.hr,zt+B.hh*.55],'y',1),skin,0,16);
  [-1,1].forEach((sg,i)=>P(box(.9,1.5,1.8,[hx*.9,sg*hx*.38,zt+B.hh*.42]),o.eye||'#3b2a22',0,21+i,{ink:false,paint:false,crease:0}));
  if(o.helm!==false)P(lathe({n:8,rot:Math.PI/8,at:[0,0,zt+B.hh*.58],r:[hx*1.07,hx*1.07],h:B.hh*.5,top:.78,seed:23}),o.helm||o.hair||'#7a4a2a',0,23)}


 // ───── Humano (F4 adelantado): NPC y futuro personaje principal. Cabeza redonda suavizada, ojos con esclera/pupila/brillo, cejas, nariz, mejillas, boca, orejas; 6 peinados, barba, sombrero, delantal, capa, cinturón y manos.
 // Mira hacia +X. `o.pose` = {bob (respiración, ±0,6), arm (0–150°: brazo cercano levantado para saludar), farArm (balanceo del otro), blink (0|1), smile (0–1)}. Determinista (todo sale de la semilla).
 const rotZ=(m,a)=>{const c=Math.cos(a),s=Math.sin(a),f=v=>[v[0]*c-v[1]*s,v[0]*s+v[1]*c,v[2]];return{V:m.V.map(f),T:m.T,c:f(m.c)}};
 const rotX=(m,pv,a)=>{const c=Math.cos(a),s=Math.sin(a),f=v=>{const dy=v[1]-pv[1],dz=v[2]-pv[2];return[v[0],pv[1]+dy*c-dz*s,pv[2]+dy*s+dz*c]};return{V:m.V.map(f),T:m.T,c:f(m.c)}};
 let HR=0;
 function human(g,x,y,sm,o){o=o||{};const p=o.pose||{},B=BUILD[o.build||'esbelto'],skin=o.skin||'#f3cba3',col=o.col||'#6a3aa8',pants=o.pants||'#6b4f8a',boot=o.boot||'#7a5238',hair=o.hair||'#5a3a22',
   zl=B.lh,zt=zl+B.th,dz=p.bob||0,hr=B.hr*(o.headK||1.42),hh=B.hr*(o.headK||1.42)*1.6,ty=B.tw/2+B.ar*.9,Q=(m,c,e,sd,e2)=>M(g,x,y,HR?rotZ(m,HR):m,c,sm,sd,Object.assign({crease:.1,ij:.25,lw:1.3,bands:o.bands||4,paint:false},e&&{smooth:e.smooth*(o.soft||0)},e2)),
   hz=0,hc=zt+dz+hh*.6-1.4,eyeZ=hc-.2,face=hr*.96;
  soft(g,x,y,15);
  const arm=(yy,sd,ang)=>{const pv=[0,yy,zt+dz-1.2],mk=m=>ang?rotX(m,pv,yy<0?-ang:ang):m;
   Q(mk(lathe({n:6,at:[0,yy,zt+dz-B.al],r:[B.ar,B.ar],h:B.al,top:1.18,seed:sd})),col,0,sd);Q(mk(lathe({n:6,at:[0,yy,zt+dz-B.al-1],r:[B.ar*.95,B.ar*.95],h:1.6,seed:sd+1})),o.cuff||skin,0,sd+1);
   Q(mk(blob({at:[0,yy,zt+dz-B.al-2.2],r:[B.ar*1.05,B.ar*1.05,B.ar*1.1],amp:.05,seed:sd+2})),skin,{smooth:.6},sd+2)};
  const leg=(yy,sd)=>{Q(lathe({n:8,rot:Math.PI/8,at:[0,yy,0],r:[B.lr*1.08,B.lr*1.08],h:5.2,top:1,seed:sd+1}),boot,{smooth:.5},sd+1);Q(box(B.lr*2.5,B.lr*2,1.5,[B.lr*.8,yy,0],{cap:true}),boot,{smooth:.3},sd+2,{crease:0});Q(lathe({n:8,rot:Math.PI/8,at:[0,yy,3.8],r:[B.lr*1.12,B.lr*1.12],h:zl-3.8,top:1.0,seed:sd}),pants,{smooth:.5},sd)};
  if(o.cape)Q(box(1.4,B.tw+1.6,B.th+B.lh*.7,[-B.td/2-1,0,zl*.35+dz*.5]),o.cape,0,29,{crease:.1});
  arm(-ty,5,(p.farArm||0)*Math.PI/180);leg(-B.tw*.24,7);leg(B.tw*.24,9);
  Q(lathe({n:8,rot:Math.PI/8,at:[0,0,zl],r:[B.td*.62,B.tw*.56],h:B.th+dz*.5,top:1.1,seed:11}),col,{smooth:.5},11);
  if(o.apron)Q(lathe({n:4,rot:Math.PI/4,at:[B.td/2+.1,0,zl+.6],r:[.5,B.tw*.36],h:B.th*.78,top:.7,seed:12}),o.apron,0,12,{crease:0});
  if(o.dress)Q(lathe({n:8,rot:Math.PI/8,at:[0,0,2.6],r:[B.td*.75,B.tw*.66],h:zl-3.6,top:.78,seed:13}),o.dress,0,13);
  Q(box(B.td+.9,B.tw+.9,1.7,[0,0,zl+.5],{cap:false}),o.belt||'#6a4a2a',0,13);Q(box(1,2.2,1.5,[B.td/2+.6,0,zl+.6]),'#e0b84a',0,14,{crease:0,ij:.2});
  if(o.pouch)Q(blob({at:[B.td/2+.2,-B.tw*.36,zl+.2],r:[1.6,1.5,1.9],amp:.1,seed:15}),o.pouch,0,15);
  arm(ty,17,(p.arm||0)*Math.PI/180);
  Q(lathe({n:6,at:[0,0,zt-.4+dz],r:[1.9,1.9],h:2.2,seed:18}),skin,0,18);Q(lathe({n:4,rot:Math.PI/4,at:[0,0,zt-.3+dz],r:[B.td/1.4142*.9,B.tw/1.4142*.7],h:1.2,top:.9,seed:16}),o.collar||STY.mix(col,'#ffffff',.25),0,16);
  HR=o.turn==null?.6:o.turn; // cabeza girada hacia la cámara
  const hs=o.hairStyle||'short';
  if(hs==='long'){Q(blob({at:[-hr*.55,0,hc-hh*.12],r:[hr*.6,hr*1.05,hh*.62],amp:.06,seed:24}),hair,{smooth:.6},24);[-1,1].forEach((sg,k)=>Q(blob({at:[-hr*.1,sg*hr*1.0,hc-hh*.5],r:[hr*.38,hr*.26,hh*.62],amp:.05,seed:60+k}),hair,{smooth:.6},60+k))}
  Q(blob({at:[0,0,hc],r:[hr,hr*.98,hh*.6],amp:.025,det:1,seed:19}),skin,{smooth:.85},19);
  [-1,1].forEach((sg,i)=>Q(blob({at:[0,sg*hr*.97,hc-.4],r:[.9,.7,1.3],amp:.05,seed:30+i}),skin,{smooth:.5},30+i));
  if(o.ears)[-1,1].forEach((sg,k)=>Q(tilt(cone({at:[0,0,0],r:[2.2,2.2],h:4.6,n:5,amp:0,seed:70+k}),[-hr*.1,sg*hr*.92,hc+hh*.02],'y',sg),skin,{smooth:.6},70+k));
  // pelo (estilo): short | long | bun | curly | bald
  if(hs!=='bald'){const hl=blob({at:[-hr*.5,0,hc+hh*.3],r:[hr*1.05,hr*1.05,hh*.36],amp:.04,det:1,seed:21});Q(hl,hair,{smooth:.7},21);
   Q(blob({at:[hr*.4,0,hc+hh*.5],r:[hr*.55,hr*.92,hh*.14],amp:.05,seed:22}),hair,{smooth:.6},22);   // flequillo
   Q(blob({at:[-hr*.62,0,hc+hh*.0],r:[hr*.55,hr*1.0,hh*.42],amp:.05,seed:23}),hair,{smooth:.6},23);}
  if(hs==='bun')Q(blob({at:[-hr*.5,0,hc+hh*.78],r:[hr*.5,hr*.5,hr*.5],amp:.05,seed:25}),hair,{smooth:.6},25);
  if(hs==='curly')[[-.2,.7],[-.2,-.7],[-.7,0],[.3,0]].forEach((q,i)=>Q(blob({at:[q[0]*hr,q[1]*hr,hc+hh*.62],r:[hr*.5,hr*.5,hr*.42],amp:.08,seed:26+i}),hair,{smooth:.5},26+i));
  // cara
  const blink=p.blink,smile=p.smile==null?.8:p.smile,my=eyeZ-3.6;
  if(o.beard)Q(blob({at:[face*.55,0,hc-hh*.6],r:[hr*.45,hr*.7,hh*.15],amp:.07,seed:54}),o.beard,{smooth:.6},54);
  if(o.stache)Q(blob({at:[face+.2,0,my+1.1],r:[.9,2.4,.7],amp:.06,seed:55}),o.stache,{smooth:.5},55);
  // cara PINTADA en 2D sobre la cabeza (cel-shading: formas planas, sin malla): óvalos de ojo, iris, brillo y sonrisa
  {const th=HR,fx=hr*.96*Math.cos(th),fy=hr*.96*Math.sin(th),X=ROT?fy:fx,Y=ROT?fx:fy,k=KS,bx=x+k*C*(X-Y),by=y+k*(KY*(X+Y)-KZ*eyeZ),d=hr*.42*k,e=(cx,cy,rx,ry,c)=>{g.fillStyle=c;g.beginPath();g.ellipse(cx,cy,rx*k,ry*k,0,0,7);g.fill()};
   g.save();[-1,1].forEach(sg=>{const cx=bx+sg*d;
    if(blink){g.strokeStyle=o.lash||'#4a3022';g.lineWidth=.8*k;g.lineCap='round';g.beginPath();g.moveTo(cx-1.3*k,by);g.quadraticCurveTo(cx,by+.9*k,cx+1.3*k,by);g.stroke()}
    else{e(cx,by,1.7,2.15,o.sclera||'#fffaf0');e(cx,by+.3*k,1.2,1.65,o.eye||'#5a3622');e(cx-.25*k,by-.3*k,.5,.6,'#ffffff')}});
   const mc=by+KZ*k*3.1;g.strokeStyle=o.lip||'#8a4038';g.lineWidth=.85*k;g.lineCap='round';g.beginPath();
   if(smile>.3)g.arc(bx,mc-1.1*k,1.7*k*smile,.2*Math.PI,.8*Math.PI);else{g.moveTo(bx-1*k,mc);g.lineTo(bx+1*k,mc)}g.stroke();g.restore()}
  if(o.hat==='cap'){Q(lathe({n:8,rot:Math.PI/8,at:[0,0,hc+hh*.38],r:[hr*1.12,hr*1.12],h:hh*.4,top:.82,seed:56}),o.hatCol||col,{smooth:.5},56);Q(box(hr*1.1,hr*2.1,.9,[hr*.78,0,hc+hh*.4]),o.hatCol||col,0,57)}
  if(o.hat==='helm')Q(lathe({n:8,rot:Math.PI/8,at:[0,0,hc+hh*.2],r:[hr*1.12,hr*1.12],h:hh*.55,top:.78,seed:58}),o.hatCol||col,0,58);HR=0}
 // ───── Humano 2D (F4): personaje PINTADO en 2D con cel-shading ligero (sin malla). Mira a cámara en 3/4; `ORG.rot` lo espeja.
 // Cada pieza = relleno de sombra + el mismo contorno desplazado (-1,5/-1,2) en el tono base (queda una media luna de sombra abajo-derecha) + contorno marrón.
 function human2d(g,x,y,sm,o){o=o||{};const p=o.pose||{},INKC=STYLE.line||'#5b3a29',skin=o.skin||'#f6d4b0',col=o.col||'#6a3aa8',pants=o.pants||'#5a4a7a',boot=o.boot||'#7a5238',hair=o.hair||'#7a4a2a',
   sc=(o.build==='chibi'?.82:o.build==='goblin'?.88:1)*KS,bob=p.bob||0,hs=o.hairStyle||'short',dk=c=>STY.mix(c,'#6a3a3a',.3);
  soft(g,x,y,15);
  g.save();g.translate(x,y);if(ROT)g.scale(-1,1);g.scale(sc,sc);g.lineJoin='round';g.lineCap='round';
  const lw=1.5/sc,P=(fn,c,e)=>{e=e||{};g.save();g.beginPath();fn();g.fillStyle=e.nodark?c:dk(c);g.fill();if(!e.nodark){g.save();g.clip();g.translate(-1.6,-1.3);g.beginPath();fn();g.fillStyle=c;g.fill();g.restore()}
    if(e.ink!==false){g.beginPath();fn();g.lineWidth=(e.lw||1.5)/sc;g.strokeStyle=INKC;g.globalAlpha=.9;g.stroke()}g.restore()};
  const rr=(a,b,w,h,r)=>{r=Math.min(r,w/2,h/2);g.moveTo(a+r,b);g.arcTo(a+w,b,a+w,b+h,r);g.arcTo(a+w,b+h,a,b+h,r);g.arcTo(a,b+h,a,b,r);g.arcTo(a,b,a+w,b,r);g.closePath()};
  const el=(cx,cy,rx,ry)=>()=>{g.ellipse(cx,cy,rx,ry,0,0,Math.PI*2)};
  const hy=-39-bob*1.2,ty=-bob*.6; // cabeza y torso suben al respirar
  // capa (detrás)
  const bk=!!o.back,st=p.step||0; // bk: vista de espalda (sin cara); st: paso de caminata −1..1 (piernas alternas)
  if(o.cape&&!bk)P(()=>rr(-9.5,-30+ty,19,27,4),o.cape);
  // pelo largo (detrás de la cabeza)
  if(hs==='long'&&!bk)P(()=>rr(-14.8,hy-7,29.6,29,10),hair);
  // piernas / botas (o falda)
  const leg=sx=>{P(()=>rr(sx-3,-15,6,12,2),pants);P(()=>{g.moveTo(sx-4.2,-4);g.quadraticCurveTo(sx-4.4,-5.6,sx-3,-5.6);g.lineTo(sx+2,-5.6);g.quadraticCurveTo(sx+5.4,-5,sx+5,-1.6);g.quadraticCurveTo(sx+4.8,0,sx+3,0);g.lineTo(sx-3.4,0);g.quadraticCurveTo(sx-4.6,0,sx-4.2,-1.8);g.closePath()},boot)};
  const lg=(sx,v)=>{g.save();g.translate(v*2.8,-Math.max(0,v)*3.2);leg(sx);g.restore()};lg(-4,st);lg(4,-st);
  // brazos (detrás del torso)
  const arm=(sx,ang)=>{g.save();g.translate(sx,-27+ty);g.rotate(ang);P(()=>rr(-2.6,-1,5.2,14,2.6),col);P(el(0,13.6,2.7,2.7),skin);g.restore()};
  arm(-9.6,.1+(p.farArm||0)*Math.PI/180);
  // torso (+ falda si es vestido)
  P(()=>rr(-8,-30+ty,16,18,5),col);
  if(o.dress)P(()=>{g.moveTo(-8,-16);g.lineTo(8,-16);g.quadraticCurveTo(12.5,-8,11.5,-3.6);g.quadraticCurveTo(0,-1.2,-11.5,-3.6);g.quadraticCurveTo(-12.5,-8,-8,-16);g.closePath()},o.dress);
  if(o.apron&&!bk)P(()=>{g.moveTo(-5,-27+ty);g.lineTo(5,-27+ty);g.lineTo(6.5,-7);g.lineTo(-6.5,-7);g.closePath()},o.apron);
  P(()=>rr(-8.2,-15.2,16.4,2.8,1.2),o.belt||'#7a5230',{lw:1.2});
   if(!bk){P(()=>rr(-1.4,-15.4,2.8,3.2,.8),'#e0b84a',{lw:1,nodark:true});
  P(()=>{g.moveTo(-3.6,-30+ty);g.lineTo(3.6,-30+ty);g.lineTo(0,-25.5+ty);g.closePath()},o.collar||STY.mix(col,'#ffffff',.5),{lw:1,nodark:true})}
  if(bk&&o.cape)P(()=>rr(-9.5,-30+ty,19,29,4),o.cape);
  if(bk&&hs==='long')P(()=>rr(-12,hy+2,24,24,8),hair);
  arm(9.6,-.1-(p.arm||0)*Math.PI/180);
  // cabeza
  const hw=o.build==='goblin'?14.2:12.8,hv=hw*.89;
  if(o.ears)[-1,1].forEach(sg=>P(()=>{g.moveTo(sg*(hw-1),hy-2);g.lineTo(sg*(hw+9),hy-9);g.lineTo(sg*(hw-.5),hy+4);g.closePath()},skin));
  else[-1,1].forEach(sg=>P(el(sg*(hw-.6),hy+1,2.3,2.9),skin));
  P(()=>g.ellipse(0,hy,hw,hv,0,0,Math.PI*2),skin);
  // barba y bigote (bajo la cara)
  if(o.beard&&!bk)P(()=>{g.moveTo(-hw+1.2,hy+1);g.quadraticCurveTo(-hw+2,hy+14.5,0,hy+15.5);g.quadraticCurveTo(hw-2,hy+14.5,hw-1.2,hy+1);g.quadraticCurveTo(0,hy+7,-hw+1.2,hy+1);g.closePath()},o.beard);
  // pelo (gorro de pelo con flequillo)
  if(bk&&hs!=='bald'&&o.hat!=='helm')P(()=>{g.ellipse(0,hy+.6,hw+.9,hv+1.4,0,0,Math.PI*2)},hair)
  if(bk&&hs!=='bald'&&o.hat!=='helm'){g.save();g.strokeStyle=STY.mix(hair,'#ffffff',.28);g.lineWidth=1.1/sc;g.lineCap='round';g.beginPath();g.moveTo(-hw*.55,hy-hv*.35);g.quadraticCurveTo(-hw*.15,hy-hv*.9,hw*.45,hy-hv*.6);g.moveTo(-hw*.3,hy+hv*.25);g.quadraticCurveTo(0,hy+hv*.55,hw*.35,hy+hv*.3);g.stroke();g.restore()}
  if(hs!=='bald'&&o.hat!=='helm'&&!bk){const f=hw+.9;P(()=>{g.moveTo(-f,hy+2);g.ellipse(0,hy,f,hv+.9,0,Math.PI,Math.PI*2);g.lineTo(f,hy+2);g.quadraticCurveTo(f-2,hy-4,hw*.45,hy-5.5);g.quadraticCurveTo(hw*.15,hy-1.5,-hw*.15,hy-5.8);g.quadraticCurveTo(-hw*.55,hy-3,-hw*.7,hy-6);g.quadraticCurveTo(-f+1,hy-3,-f,hy+2);g.closePath()},hair);
   if(hs==='bun')P(el(-3,hy-hv-2.4,4.6,4.6),hair);
   if(hs==='curly')[-8,-2.6,2.6,8].forEach((cx,i)=>P(el(cx,hy-hv+.6-(i%2)*1.2,3.8,3.6),hair))}
  if(o.hat==='helm'){if(bk)P(()=>{g.ellipse(0,hy+.4,hw+1.4,hv+1.8,0,0,Math.PI*2)},o.hatCol||'#7a8290');else P(()=>{g.moveTo(-hw-1.4,hy+1.5);g.ellipse(0,hy,hw+1.4,hv+1.8,0,Math.PI,Math.PI*2);g.lineTo(hw+1.4,hy+1.5);g.lineTo(hw*.55,hy-1);g.lineTo(-hw*.55,hy-1);g.closePath()},o.hatCol||'#7a8290')}
  if(o.hat==='cap'){P(()=>{g.moveTo(-hw-1,hy-1);g.ellipse(0,hy-1,hw+1,hv+.2,0,Math.PI,Math.PI*2);g.closePath()},o.hatCol||col);P(()=>rr(-2,hy-5.5,hw+3,3.6,1.6),o.hatCol||col)}
  // cara: pequeña y simple (estilo «galleta»): ojos de punto, boca mínima, sin mejillas
  const ey=hy+3.2,gb=p.blink,sm2=p.smile==null?.7:p.smile;
  if(!bk)[-1,1].forEach(sg=>{const cx=sg*4.7;g.save();
   if(gb){g.strokeStyle=o.lash||'#4a2e22';g.lineWidth=1/sc;g.beginPath();g.moveTo(cx-1.8,ey);g.quadraticCurveTo(cx,ey+1.2,cx+1.8,ey);g.stroke()}
   else{g.fillStyle=o.eye||'#3a2620';g.beginPath();g.ellipse(cx,ey,1.55,2.1,0,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(cx-.45,ey-.8,.55,0,7);g.fill()}
   g.restore()});
  g.strokeStyle=o.lip||'#8a4a3e';g.lineWidth=.9/sc;g.beginPath();
  if(bk){}else if(o.grin){g.moveTo(-3,ey+5);g.quadraticCurveTo(0,ey+8,3,ey+5)}else if(sm2>.3){g.arc(0,ey+4,1.5,.15*Math.PI,.85*Math.PI)}else{g.moveTo(-1,ey+5.4);g.lineTo(1,ey+5.4)}g.stroke();
  if(o.stache&&!bk)P(()=>{g.moveTo(-5.5,ey+3.3);g.quadraticCurveTo(0,ey+1,5.5,ey+3.3);g.quadraticCurveTo(0,ey+5.4,-5.5,ey+3.3);g.closePath()},o.stache,{lw:1.1});
  g.restore()}
 // ── Héroe (F4b): el jugador con esqueleto 2D propio, pensado para animar. Estilo «galleta» como human2d, pero con 3 vistas (front|side|back) y poses libres.
 // pose: bob, lean(° sobre los pies), look(−1..1: giro de la cabeza), dip(px), lg:[{x,l},{x,l}] (pierna cercana/lejana: desplazamiento x y elevación), aN/aF (brazo cercano/lejano: ° hacia fuera/adelante,
 // 0 = colgando, 90 = horizontal, 180 = arriba), blink (1 cerrados, 2 mueca de dolor), mouth. item (en la mano cercana): {t,col,col2,abs(° absolutos),pull,glow}; trail {r,a0,a1} (estela de golpe).
 // catálogo de peinados (editor de personaje): cap = casquete (short|part|sweep), behind = mechón largo (long|mane|bob), tail = coleta(s) (pony|twin), top = moño|puntas|rizos. Uno nuevo = una fila (+ su forma si es nueva en hairGeo).
 const HAIRS={bald:{},cut:{cap:'short'},spiky:{cap:'short',top:'spiky'},side:{cap:'sweep'},curly:{cap:'short',top:'curly'},mane:{cap:'short',behind:'mane'},long:{cap:'part',behind:'long'},bun:{cap:'part',top:'bun'},pony:{cap:'part',tail:'pony'},bob:{cap:'part',behind:'bob'},twin:{cap:'part',tail:'twin'}};
 function hero2d(g,x,y,sm,o){o=o||{};const GR=o.gear||{},p=o.pose||{},view=o.view||'front',sd=view==='side',bk=view==='back',INKC=STYLE.line||'#5b3a29',skin=o.skin||'#f6d4b0',col=o.col||'#c0392b',pants=GR.lg||o.pants||'#5a4a6a',boot=o.boot||'#7a5238',hair=o.hair||'#5a3a22',hs=o.hairStyle||'bald',sc=KS,dk=c=>STY.mix(c,'#6a3a3a',.3),D=Math.PI/180;
  soft(g,x,y,15-(p.air||0)*1.6);g.save();g.translate(x,y);if(ROT)g.scale(-1,1);g.scale(sc,sc);if(o.gender==='f')g.scale(.95,.95);g.lineJoin='round';g.lineCap='round';if(p.lunge)g.translate(sd?p.lunge:0,sd?0:(bk?-1:1)*p.lunge*.45);if(p.air)g.translate(0,-p.air); // p.air (oct 2026): fase de vuelo al correr; todo el cuerpo sube y la sombra (dibujada antes) se encoge en el suelo // p.lunge: avance del cuerpo en px (estocada/golpe máximo); de frente/espalda se acorta por la perspectiva
  g.rotate((p.lean||0)*D);
  const P=(fn,c,e)=>{e=e||{};g.save();g.beginPath();fn();g.fillStyle=e.nodark?c:dk(c);g.fill();if(!e.nodark){g.save();g.clip();g.translate(-1.6,-1.3);g.beginPath();fn();g.fillStyle=c;g.fill();g.restore()}
   if(e.ink!==false){g.beginPath();fn();g.lineWidth=(e.lw||1.5)/sc;g.strokeStyle=INKC;g.globalAlpha=.9;g.stroke()}g.restore()};
  const rr=(a,b,w,h,r)=>{r=Math.min(r==null?1:r,w/2,h/2);g.moveTo(a+r,b);g.arcTo(a+w,b,a+w,b+h,r);g.arcTo(a+w,b+h,a,b+h,r);g.arcTo(a,b+h,a,b,r);g.arcTo(a,b,a+w,b,r);g.closePath()};
  const el=(cx,cy,rx,ry)=>()=>{g.ellipse(cx,cy,rx,ry,0,0,Math.PI*2)};
  const bob=p.bob||0,dip=p.dip||0,ty=-bob*.6+dip*.6,hy=-38.6-bob*.7+dip,lk=p.look||0,lg=p.lg||[{x:0,l:0},{x:0,l:0}],aN=p.aN==null?8:p.aN,aF=p.aF==null?8:p.aF,it=o.item;
  // ── cuerpo según género (o.gender 'm'|'f'): mujer = hombros y torso más estrechos, cintura marcada, 5 % más baja, cabeza algo más pequeña ──
  const fem=o.gender==='f',SHW=fem?8.4:9.6,hw=fem?12.2:12.8,hv=hw*.89,hdx=sd?1.2:lk*2.4,eo=Math.PI*2;
  // ── PELO: una sola silueta (contorno solo por fuera). Datos en HAIRS (más abajo): cap = casquete (short|part|sweep), behind = mechones largos, tail = coleta(s), top = moño|puntas|rizos.
  const HDEF=HAIRS[hs]||HAIRS[hs==='short'?'cut':'bald'],hasH=HDEF!==HAIRS.bald&&o.hat!=='helm';
  const edge=x=>hy-hv*Math.sqrt(Math.max(.02,1-(x/hw)*(x/hw)))+1.2;
  const hairGeo=()=>{const C=HDEF.cap,f=hw+.9,B=[],T=[];
   if(HDEF.behind){const hh={long:27,mane:22,bob:16.5}[HDEF.behind],hc=p.cw||0;B.push(bk?()=>rr(-12.5+(p.cf||0)*.8,hy+1,25,hh+2-hc*2,8):sd?()=>rr(-13.5-hc*3,hy-4,14.5+hc*1.5,hh+1-hc*3,6):()=>rr(-13.3,hy-3,26.6,hh,8))} // K2: al moverse el pelo largo se va hacia atrás
   if(HDEF.tail==='pony'){const hc=p.cw||0,hf=p.cf||0;if(sd)B.push(()=>g.ellipse(-hw-2.6-hc*2.5,hy+5.5-hc*2,3.2,8.6,.22+hc*.75+hf*.12,0,eo));else if(bk)B.push(()=>g.ellipse(hf*1.6,hy+10,3.8,9.6,-hf*.18,0,eo))} // K2: la coleta se balancea con cada paso
   if(HDEF.tail==='twin'){if(sd)B.push(()=>g.ellipse(-2,hy+10.5,3.6,7.8,0,0,eo));else[-1,1].forEach(sg=>B.push(()=>g.ellipse(sg*(hw+.4),hy+11,3.2,8.6,sg*.12,0,eo)))}
   if(!hasH)return{B,cap:null,T};
   let cap;
   if(bk)cap={full:()=>g.ellipse(0,hy+.6,hw+.9,hv+1.4,0,0,eo)};
   else if(sd){const rx=hw+.4,ry=hv+1,t0=C==='sweep'?-.3:-.55,t1=(C==='short'?2.62:2.8)-eo,cx=-.8,cy=hy-.8,Sx=cx+rx*Math.cos(t0),Sy=cy+ry*Math.sin(t0),Ex=cx+rx*Math.cos(t1),Ey=cy+ry*Math.sin(t1),
     inner=()=>{g.quadraticCurveTo(-7,hy+6.4,-3.4,hy+3.4);g.quadraticCurveTo(-2.4,hy+.8,-.8,hy-1.6);g.quadraticCurveTo(2,hy-3.2,4.8,hy-3.4);g.quadraticCurveTo(9,hy-4,Sx,Sy)};
    cap={full:()=>{g.ellipse(cx,cy,rx,ry,0,t0,t1,true);inner();g.closePath()},fringe:()=>{g.moveTo(Ex,Ey);inner()}}}
   else{const seg={short:()=>{g.quadraticCurveTo(f-2,hy-4,hw*.45,hy-5.5);g.quadraticCurveTo(hw*.15,hy-1.5,-hw*.15,hy-5.8);g.quadraticCurveTo(-hw*.55,hy-3,-hw*.7,hy-6);g.quadraticCurveTo(-f+1,hy-3,-f,hy+2)},
     part:()=>{g.quadraticCurveTo(f-1,hy-2,hw*.5,hy-5.2);g.quadraticCurveTo(hw*.2,hy-7,0,hy-8.2);g.quadraticCurveTo(-hw*.2,hy-7,-hw*.5,hy-5.2);g.quadraticCurveTo(-f+1,hy-2,-f,hy+2)},
     sweep:()=>{g.quadraticCurveTo(f-1.5,hy-3.5,hw*.35,hy-6.4);g.quadraticCurveTo(-hw*.3,hy-8.4,-hw*.8,hy-2.6);g.quadraticCurveTo(-f+.4,hy-.5,-f,hy+2)}}[C];
    cap={full:()=>{g.moveTo(-f,hy+2);g.ellipse(0,hy,f,hv+.9,0,Math.PI,eo);g.lineTo(f,hy+2);seg()},fringe:()=>{g.moveTo(f,hy+2);seg()}}}
   const xs=sd?[-9.4,-4.6,0,4.6,9.2]:[-9.6,-4.8,0,4.8,9.6];
   if(HDEF.top==='bun')T.push(sd?()=>g.ellipse(-hw*.55-.6,hy-hv-.8,4.8,4.6,0,0,eo):()=>g.ellipse(0,hy-hv-3.2,5,4.8,0,0,eo));
   if(HDEF.top==='spiky')xs.filter(x=>!sd||x<5).forEach(x=>{const by=edge(x),tx=x+(sd?-1.2:(x<0?-1.4:x>0?1.4:0)),up=6.6-Math.abs(x)*.12;T.push(()=>{g.moveTo(x-3.2,by+.8);g.lineTo(tx,by-up);g.lineTo(x+3.2,by+.8);g.closePath()})});
   if(HDEF.top==='curly')xs.forEach((x,i)=>T.push(()=>g.ellipse(x,edge(x)-1.6+(i%2)*1.2,3.9,3.5,0,0,eo)));
   return{B,cap,T}};
  const hairOutline=L=>{g.save();g.lineWidth=2.6/sc;g.strokeStyle=INKC;g.globalAlpha=.9;L.forEach(fn=>{g.beginPath();fn();g.stroke()});g.restore()},hairFill=L=>{L.forEach(fn=>{g.save();g.beginPath();fn();g.fillStyle=dk(hair);g.fill();g.restore()});L.forEach(fn=>{g.save();g.beginPath();fn();g.clip();g.translate(-1.6,-1.3);g.beginPath();fn();g.fillStyle=hair;g.fill();g.restore()})};
  // ── pelo, fase A (de frente/perfil): silueta completa DETRÁS del cuerpo y la cabeza; el contorno de todas las piezas se pinta antes que los rellenos → sin líneas internas ──
  if(!bk){const G_=hairGeo(),L=[...G_.B,...(G_.cap?[G_.cap.full,...G_.T]:[])];if(L.length){g.save();g.translate(hdx,0);hairOutline(L);hairFill(L);g.restore()}}
  // ── giro 3/4 del cuerpo en diagonales (lk=1): torso, piernas y brazos se estrechan y se desplazan hacia donde mira; la cabeza va aparte ──
  const tw=sd?1:1-.14*Math.abs(lk),bx=sd?0:lk*1.2,bodyOn=()=>{g.save();g.translate(bx,0);g.scale(tw,1)};bodyOn();
  // ── piernas ──
  const leg=(sx,L,far)=>{g.save();const c1=far?dk(pants):pants,b1=far?dk(boot):boot;
   const bootP=()=>{const f=sd?2.4:(bk?0:lk*2.2);g.moveTo(sx-3.1,-5.4);g.lineTo(sx+3.1,-5.4);g.lineTo(sx+3.1,-3.4);g.quadraticCurveTo(sx+5.8+f,-3.2,sx+5.8+f,-1.2);g.quadraticCurveTo(sx+5.8+f,.2,sx+4.2+f,.2);g.lineTo(sx-3.2,.2);g.quadraticCurveTo(sx-4.5,.2,sx-4.2,-1.4);g.closePath()};   // bota: caña recta del ancho de la pierna + pie con puntera (antes era un bloque más ancho que la pierna)
   const cuff=()=>P(()=>rr(sx-3.5,-6.2,7,2,.9),STY.mix(b1,'#ffffff',.22),{lw:1});
   if(sd){ // perfil: la pierna GIRA desde la cadera (L.x = avance del pie en px, acotado al largo de la pierna) y la bota se mantiene horizontal → los pies nunca se separan más de lo que da la pierna
    // RODILLA (lote K1): pierna en 2 tramos (muslo 6 + espinilla 6) resuelta por IK: el pie va donde diga la pose (avance L.x, elevación L.l) y la rodilla
    // se dobla HACIA DELANTE sola. Antes la pierna era rígida y «subir el pie» la trasladaba entera hacia arriba. p.lgw: la inclinación es solo del torso.
    const lw=p.lgw?(p.lean||0)*D:0,th=Math.asin(Math.max(-.8,Math.min(.8,L.x/12)));let fx=12*Math.sin(th),fy=12*Math.cos(th)-L.l;
    {const r=Math.hypot(fx,fy),ph=Math.atan2(fx,fy)+lw;const d=Math.min(11.98,Math.max(3,r));fx=d*Math.sin(ph);fy=d*Math.cos(ph)}
    const d=Math.hypot(fx,fy),phi=Math.atan2(fx,fy),al=Math.acos(Math.max(-1,Math.min(1,d/12))),tA=phi+al,kx=6*Math.sin(tA),ky=6*Math.cos(tA),sA=Math.atan2(fx-kx,fy-ky);
    g.save();g.translate(sx+kx,-15+ky);g.rotate(-sA);P(()=>rr(-3,-1.4,6,7.6,2),c1);g.restore();
    g.save();g.translate(sx,-15);g.rotate(-tA);P(()=>rr(-3,-.6,6,7.6,2.2),c1);g.restore();
    if(GR.lg){g.save();g.translate(sx+kx,-15+ky);g.rotate(-(tA+sA)/2);P(()=>rr(-3.5,-1.8,7,3.6,1.4),STY.mix(c1,'#ffffff',.3),{lw:1});g.restore()}
    g.translate(fx,fy-12);{const tl=L.l>.4?Math.min(L.l,6)*(L.x<0?.11:.05):0;if(lw||tl){g.translate(sx,-2.5);g.rotate(-lw+tl);g.translate(-sx,2.5)}}P(bootP,b1);cuff()} // pie en el aire: puntera hacia abajo (más si va detrás: «patada»)
   else{g.translate(L.x*(lk?1:.3),-L.l+(L.y||0));P(()=>rr(sx-3,-15,6,12,2),c1);if(GR.lg&&!bk)P(()=>rr(sx-3.5,-9.6,7,3.6,1.4),STY.mix(c1,'#ffffff',.3),{lw:1});
    if(lk){g.save();g.translate(sx,-2.8);g.rotate((bk?-1:1)*.1);g.translate(-sx,2.8);P(bootP,b1);cuff();g.restore()} // diagonales: la bota (no la pierna) apunta por la diagonal de pantalla
    else{P(bootP,b1);cuff()}}
   g.restore()};
  // (lote D3: la capa de frente/perfil va ANTES de las piernas; estaba después y tapaba los pantalones, sobre todo al andar de frente)
  // ── capa detrás (frente/lado) ──
  // CAPA con movimiento (lote K2): p.cw = cuánto la arrastra la velocidad (0 quieto · .35 andar · .9 correr), p.cf = aleteo por paso (-1..1).
  // Perfil: el bajo se va hacia atrás y sube; de frente se abre por los lados; de espaldas (más abajo) el bajo ondea.
  const cw=p.cw||0,cf=p.cf||0;
  if(o.cape&&!bk)P(()=>{if(sd){const hx=-10-cw*7.5+cf*1.4,hy2=-3-cw*6.5-cf*.8;g.moveTo(-2,-30+ty);g.lineTo(-7.5,-30+ty);g.quadraticCurveTo(-10.5-cw*2,-16+ty,hx,hy2);g.quadraticCurveTo((hx-2)*.5,hy2+1.2+cf*.6,-2.5-cw*2.5,-3.5-cw*3);g.closePath()}
   else if(cw){const ww=9.5+cw*1.8,bw=ww+cw*1.6+Math.abs(cf)*.6;g.moveTo(-ww,-28+ty);g.quadraticCurveTo(-ww,-30+ty,-ww+4,-30+ty);g.lineTo(ww-4,-30+ty);g.quadraticCurveTo(ww,-30+ty,ww,-28+ty);g.lineTo(bw+cf*.8,-3-cw*1.5);g.lineTo(-bw+cf*.8,-3-cw*1.5);g.closePath()}else rr(-9.5,-30+ty,19,27,4)},o.cape);
  if(sd){leg(-.4,lg[1],true);leg(.4,lg[0],false)}else{const lx=fem?3.6:4;leg(-lx,lg[1],false);leg(lx,lg[0],false)}
  // ── objetos y brazos ──
  const drawItem=t=>{const c=t.col||'#aaa',c2=t.col2||'#8a5a2a',ex=t.ex==null?1:t.ex; // ex<1: cabezal visto de canto (golpe hacia/desde la cámara)
   if(t.hv&&(t.t!=='bow'||sd)){const nk=t.nock||[0,-6],gx=t.t==='bow'?nk[0]:0,cy=t.t==='bow'?nk[1]+24:({sword:20,dagger:12,great:28,staff:39,scepter:19,xbow:14,axe:22})[t.t]||20;g.save();g.fillStyle='#ffd23a';g.globalAlpha=.2+.2*t.hv;g.beginPath();g.arc(gx,cy,9+5*t.hv,0,7);g.fill();g.globalAlpha=.55*t.hv;g.fillStyle='#fff6b0';g.beginPath();g.arc(gx,cy,4.5,0,7);g.fill();g.restore()} // carga dorada del golpe máximo (item.hv 0..1)
   
   switch(t.t){
    case'axe':P(()=>rr(-1.1,-4,2.2,32),c2,{lw:1.2});P(()=>{g.moveTo(1,18);g.quadraticCurveTo(1+9.5*ex,14,1+10*ex,23.5);g.quadraticCurveTo(1+9.5*ex,31,1,28);g.closePath()},c);break;
    case'pick':P(()=>rr(-1.1,-4,2.2,34),c2,{lw:1.2});P(()=>{g.moveTo(-11.5*ex,25);g.quadraticCurveTo(-5*ex,30,0,32);g.quadraticCurveTo(5*ex,30,11.5*ex,25);g.quadraticCurveTo(5*ex,27.2,0,28);g.quadraticCurveTo(-5*ex,27.2,-11.5*ex,25);g.closePath()},c);break;
    // espadas (lote G1): la MANO (origen) queda en el centro de la empuñadura; pomo detrás, guarda y hoja delante. Antes la mano iba en el pomo con 11 u. de mango por delante
    case'sword':P(el(0,-6.4,1.9,1.9),'#d8b050',{lw:1});P(()=>rr(-1.2,-5.4,2.4,9.6),c2,{lw:1.1});P(()=>{g.moveTo(-1.8,5.6);g.lineTo(1.8,5.6);g.lineTo(1.8,28.5);g.lineTo(0,32.6);g.lineTo(-1.8,28.5);g.closePath()},c);P(()=>rr(-1,7,.9,20.5,.4),STY.mix(c,'#ffffff',.45),{ink:false,nodark:true});P(()=>rr(-4.6,3.6,9.2,2.5,1),'#d8b050',{lw:1.1});break;
    case'dagger':P(el(0,-4.4,1.6,1.6),'#d8b050',{lw:.9});P(()=>rr(-1.1,-3.8,2.2,7),c2,{lw:1});P(()=>{g.moveTo(-1.6,4.2);g.lineTo(1.6,4.2);g.lineTo(1.2,15.5);g.lineTo(0,19);g.lineTo(-1.2,15.5);g.closePath()},c);P(()=>rr(-3.3,2.6,6.6,2,.8),'#d8b050',{lw:1});break;
    case'great':P(el(0,-11.6,2.2,2.2),'#d8b050',{lw:1.1});P(()=>rr(-1.4,-10.6,2.8,15.4),c2,{lw:1.1});for(let i=0;i<3;i++)P(()=>rr(-1.4,-8.4+i*4.4,2.8,.8,.3),STY.mix(c2,'#000000',.3),{ink:false,nodark:true});
     P(()=>{g.moveTo(-2.5,7);g.lineTo(2.5,7);g.lineTo(2.5,42);g.lineTo(0,47);g.lineTo(-2.5,42);g.closePath()},c,{lw:1.2});P(()=>rr(-1.3,9,1.1,32,.5),STY.mix(c,'#ffffff',.45),{ink:false,nodark:true});P(()=>rr(-6.6,4.4,13.2,2.8,1.2),'#d8b050',{lw:1.2});break;
    case'staff':P(()=>rr(-1.1,-14,2.2,50),c2,{lw:1.1});if(t.glow){g.save();g.globalAlpha=.35*t.glow;g.fillStyle=c;g.beginPath();g.arc(0,39,10,0,7);g.fill();g.restore()}P(el(0,39,3.8,3.8),c,{nodark:true});break;
    case'xbow':{P(()=>rr(-1.6,-7.5,3.2,24,1.2),c2,{lw:1.1});P(()=>rr(-1.9,-1.5,3.8,3.2,.8),STY.mix(c2,'#000000',.25),{lw:.8}); // ballesta (lote G2): culata a lo largo de la mano, arco de metal cruzado delante, cuerda y virote
     g.save();g.lineCap='round';const sy=t.bolt?6.5:13.4;g.beginPath();g.moveTo(-10.5,15.2);g.lineTo(0,sy);g.lineTo(10.5,15.2);g.lineWidth=.9/sc;g.strokeStyle='#f4efe0';g.stroke();
     g.beginPath();g.moveTo(-10.5,15.2);g.quadraticCurveTo(0,10.2,10.5,15.2);g.lineWidth=3.4/sc;g.strokeStyle=INKC;g.stroke();g.lineWidth=1.9/sc;g.strokeStyle=c;g.stroke();g.restore();
     if(t.bolt)P(()=>rr(-.7,6,1.4,13.5,.5),'#c8b080',{lw:.8});break}
    case'scepter':{if(t.glow){g.save();g.globalAlpha=.35*t.glow;g.fillStyle=c;g.beginPath();g.arc(0,19,8,0,7);g.fill();g.restore()}P(()=>rr(-1,-5,2,21),c2,{lw:1}); // cetro (lote G2): corto, con corona dorada y orbe
     P(()=>{g.moveTo(-3.4,14.6);g.lineTo(3.4,14.6);g.lineTo(2.4,17.4);g.lineTo(-2.4,17.4);g.closePath()},'#d8b050',{lw:.9});P(el(0,19.6,3.1,3.1),c,{nodark:true});P(el(-.9,18.7,.9,.9),'#ffffff',{ink:false,nodark:true});break}
    case'rod':P(()=>rr(-.9,-6,1.8,44),c2,{lw:1});P(el(0,5,1.8,1.8),'#9a9aa8',{lw:.9});break;
    case'hammer':P(()=>rr(-1,-2,2,16),c2,{lw:1.1});P(()=>rr(-5.8*ex,12,11.6*ex,6.8,1.5),c);break;
    case'spoon':P(()=>rr(-.9,-2,1.8,19),c2,{lw:1});P(el(0,19,3.4,2.7),c);break;
    case'saw':P(()=>rr(-1.2,-2,2.4,8),c2,{lw:1.1});P(()=>rr(-2.6,6,5.2,24,1),c);for(let i=0;i<5;i++)P(()=>{g.moveTo(2.6,8+i*4.6);g.lineTo(4.4,10.3+i*4.6);g.lineTo(2.6,12.6+i*4.6);g.closePath()},c,{lw:.8});break;
    case'food':P(el(0,4,6.4,4.8),c,{lw:1.1});P(el(-1.6,5.8,2.4,1.6),'#f8e2a8',{nodark:true});P(()=>{g.moveTo(3.2,6.6);g.lineTo(6.8,3.2);g.lineTo(3.8,1.4);g.closePath()},'#8a5224',{nodark:true});break;
    case'quill':P(()=>rr(-.5,-2,1,16),'#f4efe0',{lw:.9});P(()=>{g.moveTo(.5,4);g.quadraticCurveTo(6,12,1,19);g.lineTo(-.5,19);g.quadraticCurveTo(-2,10,.5,4);g.closePath()},'#f4efe0',{lw:.9});break;
    case'bow':{g.save();g.lineCap='round';g.beginPath();g.moveTo(-14,-6);g.quadraticCurveTo(0,10,14,-6);g.lineWidth=3.6/sc;g.strokeStyle=INKC;g.stroke();g.lineWidth=2/sc;g.strokeStyle=c;g.stroke();
     const nk=t.nock||[0,-6-(t.pull||0)*9];g.beginPath();g.moveTo(-14,-6);g.lineTo(nk[0],nk[1]);g.lineTo(14,-6);g.lineWidth=.9/sc;g.strokeStyle='#f4efe0';g.stroke();
     if(t.arrow){g.beginPath();g.moveTo(nk[0],nk[1]);g.lineTo(nk[0],nk[1]+26);g.lineWidth=1.3/sc;g.strokeStyle='#c8b080';g.stroke()}g.restore();break}}};
  // F5-anim: en las vistas frente/espalda las ACCIONES (pose.fw) mueven el brazo en el plano sagital (adelante/atrás) en vez de abrirlo de lado:
  // ángulo 0 = colgando, 90 = hacia delante, 180 = arriba. Con cámara isométrica «adelante» sube en pantalla de espaldas (el brazo se acorta por escorzo) y baja de frente.
  let fw=!!p.fw&&!sd;const fwS=bk?-1:1,FWK=.55,FWL=.16,fwY=a=>Math.cos(a*D)+fwS*FWK*Math.sin(a*D);
  // fwDir (lote G1): orienta un objeto con ángulo propio (item.abs) en vistas frente/espalda. Caña y báculo: solo arriba/abajo con escorzo (como antes).
  // Hojas (BLD): además se abren hacia FUERA según lo que apunten adelante → en guardia la espada queda en diagonal y no «clavada» hacia la cámara.
  const BLD={sword:1,dagger:1,great:1},fwDir=(item,out)=>{const y3=fwY(item.abs);if(!BLD[item.t]){if(y3<0)g.rotate(Math.PI);g.scale(1,Math.max(.12,Math.min(1,Math.abs(y3))));return}
   const vx=out*.62*Math.abs(Math.sin(item.abs*D)),m=Math.hypot(vx,y3);g.rotate(-Math.atan2(vx,y3));g.scale(1,Math.max(.3,Math.min(1,m)))};
  // CODO (lote K1, oct 2026): eb = flexión del codo en grados (el antebrazo se dobla hacia DELANTE, mismo sistema de ángulos que el brazo). Solo en brazos
  // SIN objeto (andar, correr, reposo, brazo libre o puños en combate): con objeto el brazo sigue recto para no mover la mano que lo agarra (caña, arco, dos manos).
  // Brazo = 2 tramos de 6,8 u. (antes 1 de 13,6: la mano queda en el mismo sitio con eb=0). En frente/espalda (fw) cada tramo tiene su propio escorzo.
  const aDir=(shx,ang)=>{if(!fw)return[((shx<0&&!sd)?1:-1)*ang*D,1];const y=fwY(ang),xs=FWL+(shx>0?1:-1)*lk*.8*Math.sin(ang*D),m=Math.hypot(xs,y);return[(shx<0?1:-1)*Math.atan2(xs,y),Math.max(.4,Math.min(1,m))]};
  const arm=(shx,ang,far,item,eb)=>{eb=item?0:(eb||0);g.save();g.translate(shx,-27+ty);let[rot,kk]=aDir(shx,ang);
   // estela de golpe (en el sistema del hombro, antes de rotar)
   if(item&&o.trail&&!far){const tr=o.trail,k=(shx<0&&!sd)?1:-1;g.save();g.beginPath();g.arc(0,0,tr.r,k*tr.a0*D+Math.PI/2+(k>0?0:0),k*tr.a1*D+Math.PI/2,k>0?tr.a1<tr.a0:tr.a1>tr.a0);g.strokeStyle='#ffffff';g.globalAlpha=.55;g.lineWidth=3/sc;g.lineCap='round';g.stroke();g.restore()}
   g.rotate(rot);const c=far&&sd?dk(col):col;
   if(eb){const[r2,k2]=aDir(shx,ang+eb);g.save();g.scale(1,kk);P(()=>rr(-2.6,-1,5.2,8.2,2.6),c);g.restore();g.translate(0,6.8*kk);g.rotate(r2-rot); // codo
    g.save();g.scale(1,k2);P(()=>rr(-2.5,-1.3,5,8.4,2.5),c);g.restore();P(el(0,6.8*k2,2.7,2.7),GR.gl||skin);if(GR.gl&&!fw)P(()=>rr(-3,2.4,6,2.6,1),STY.mix(GR.gl,'#ffffff',.25),{lw:1});g.restore();return}
   if(fw){ // brazo y objeto con escorzo a lo largo del eje del brazo
    g.save();g.scale(1,kk);P(()=>rr(-2.6,-1,5.2,14,2.6),c);g.restore();
    if(item){g.save();g.translate(0,13.6*kk);
     if(item.abs!=null){g.rotate(-rot);fwDir(item,shx>0?1:-1)}else g.scale(1,kk);
     drawItem(item);g.restore()}
    P(el(0,13.6*kk,2.7,2.7),GR.gl||skin);g.restore();return}
   if(item){g.save();g.translate(0,13.6);if(item.abs!=null)g.rotate(((shx<0&&!sd)?1:-1)*item.abs*D-rot);drawItem(item);g.restore()}
   P(()=>rr(-2.6,-1,5.2,14,2.6),c);P(el(0,13.6,2.7,2.7),GR.gl||skin);if(GR.gl)P(()=>rr(-3,9.2,6,2.6,1),STY.mix(GR.gl,'#ffffff',.25),{lw:1});g.restore()};
  // posición de la mano cercana en el sistema de la mano lejana (para la cuerda del arco)
  if(it&&it.t==='bow'){const shN=sd?0:SHW,shF=sd?0:-SHW,rN=-aN*D,rF=((sd)?-1:1)*aF*D,hF=[shF-13.6*Math.sin(rF),-27+ty+13.6*Math.cos(rF)],dx=hF[0]-shN,dy=hF[1]-(-27+ty),c1=Math.cos(rN),s1=Math.sin(rN);it.nock=[dx*c1+dy*s1,-dx*s1+dy*c1-13.6]}
  const shN=sd?0:SHW,shF=sd?0:-SHW;
  // Objetos a dos manos (it.two, ver HERO.TWO en hero.js: hacha, pico, martillo y TODA herramienta de recolección nueva): en frente/espalda ambos brazos agarran el mango en un punto común G (centro del cuerpo)
  const fwArms=(st)=>{if(!(it&&it.two)){arm(shF,aF,false,null,p.eF);arm(shN,aN,false,it,p.eN);return}
   const ny=fwY(aN),nm=Math.hypot(FWL,ny),nk=Math.max(.4,Math.min(1,nm)),sy=-27+ty,u=bk?0:Math.max(0,Math.min(1,-ny)),G=[1.8+u*9.5,sy+13.6*nk*ny/nm],Gf=[-1.8+u*7.5,G[1]+(ny<0?-1:1)*5*nk]; // de frente, al levantar la herramienta va por encima del hombro derecho (no tapa la cara)
   const dA=(sx,T)=>{const dx=T[0]-sx,dy=T[1]-sy,d=Math.hypot(dx,dy);g.save();g.translate(sx,sy);g.rotate(Math.atan2(-dx,dy));g.scale(1,Math.max(.35,Math.min(1.3,d/13.6)));P(()=>rr(-2.6,-1,5.2,14,2.6),col);g.restore();g.save();g.translate(T[0],T[1]);P(el(0,0,2.7,2.7),GR.gl||skin);g.restore()};
   if(st==='far'){dA(shF,Gf);return}
   if(o.trail){const tr=o.trail;g.save();g.translate(shN,sy);g.beginPath();g.arc(0,0,tr.r,-tr.a0*D+Math.PI/2,-tr.a1*D+Math.PI/2,tr.a1>tr.a0);g.strokeStyle='#ffffff';g.globalAlpha=.55;g.lineWidth=3/sc;g.lineCap='round';g.stroke();g.restore()}
   g.save();g.translate(G[0],G[1]);if(it.abs!=null&&BLD[it.t])fwDir(it,1);else{if(ny<0)g.rotate(Math.PI);g.scale(1,nk)}drawItem(Object.assign({},it,{ex:.7}));g.restore();
   if(!st)dA(shF,Gf);dA(shN,G)};
  // de espaldas (adelante = lejos de la cámara) los brazos van DETRÁS del torso y de la cabeza: solo asoma el mango/hacha por encima (decisión del dueño, oct 2026)
  const late=fw&&!bk&&!!(it&&it.two); // de frente (adelante = hacia la cámara) los brazos y la herramienta van delante de la cabeza
  if(fw&&bk)fwArms();else if(!fw)arm(shF,aF,sd,null,p.eF);   // de espaldas con acción: ambos brazos van detrás del torso (adelante = lejos de la cámara)
  // ── arma a la espalda (cuando no se empuña nada): detrás del torso en frente/perfil, encima en la espalda ──
  // ESPADA ENVAINADA a la espalda (lote D1): empuñadura arriba asomando por encima del hombro DERECHO del personaje y hoja hacia abajo dentro de una vaina
  // de cuero (antes la espada iba al revés, con la hoja desnuda hacia arriba). De frente solo asoma la empuñadura; de espaldas se ve entera.
  const sheath=w=>{const gr=w.wk==='great',L=gr?40:27,W2=gr?3.3:2.6,lth='#5a3a22',mt='#c9a24a',k=gr?.6:.66;g.save();
   if(sd)g.translate(-8,-29+ty),g.rotate(.32);else if(bk)g.translate(8.6+lk*1.2,-29.5+ty),g.rotate(.75);else g.translate(-9.4+lk*1.2,-29.5+ty),g.rotate(-.75); // la empuñadura asoma al lado de la cabeza (si no, el pelo la tapa)
   g.scale(k,k);drawItem({t:w.wk,col:w.col,col2:'#6b4a2a'}); // empuñadura y guarda (la hoja queda tapada por la vaina)
   const y0=gr?5.6:4.2;P(()=>{g.moveTo(-W2,y0);g.lineTo(W2,y0);g.lineTo(W2,y0+L-3);g.quadraticCurveTo(0,y0+L+2,-W2,y0+L-3);g.closePath()},lth,{lw:1.2});
   P(()=>rr(-W2-.4,y0,W2*2+.8,2.6,.8),mt,{lw:.9});P(()=>{g.moveTo(-W2*.8,y0+L-5);g.lineTo(W2*.8,y0+L-5);g.lineTo(W2*.6,y0+L-2.6);g.quadraticCurveTo(0,y0+L+1.4,-W2*.6,y0+L-2.6);g.closePath()},mt,{lw:.9});
   P(()=>rr(-.5,y0+4,1,L-11,.4),STY.mix(lth,'#ffffff',.18),{ink:false,nodark:true});g.restore()};
  const stow=()=>{const w=GR.wp;if(!w||it)return;const wk=w.wk||w.t;if(wk==='sword'||wk==='great'){sheath(Object.assign({},w,{wk}));return}g.save();g.translate(sd?-4.5:(bk?0:-2.5),-14+ty);
   // lote G2: cada forma de arma se guarda a su manera
   if(wk==='bow'){g.translate(sd?-2:-1,-9);g.rotate(Math.PI/2+.12);g.scale(.8,.8)}
   else if(wk==='xbow'){g.translate(0,-4);g.rotate(Math.PI-.35);g.scale(.62,.62)}
   else if(wk==='staff'){g.rotate(Math.PI-.5);g.scale(.62,.62)}
   else if(wk==='scepter'){g.translate(sd?6:7.5,4);g.rotate(Math.PI-.25);g.scale(.62,.62)}   // cetro y daga: colgados del cinturón, no a la espalda
   else if(wk==='dagger'){g.translate(sd?6:7.5,4);g.rotate(Math.PI-.3);g.scale(.7,.7)}
   else if(wk==='great'){g.translate(0,-2);g.rotate(Math.PI-.55);g.scale(.6,.6)}
   else{g.rotate(Math.PI-.62);g.scale(.62,.62)}
   drawItem({t:wk==='bow'||wk==='staff'?w.t:wk,col:w.col,col2:'#6b4a2a',bolt:1});g.restore()};
  if(!bk)stow();
  const shOnBack=!!(GR.sh&&it&&(it.two||it.t==='bow'));
  const armPt=(shx,ang,len,useFw,eb)=>{const f0=fw;fw=useFw;const[r1,k1]=aDir(shx,ang),[r2,k2]=aDir(shx,ang+(eb||0));fw=f0;const l1=Math.min(len,6.8),l2=len-l1;return[shx-l1*k1*Math.sin(r1)-l2*k2*Math.sin(r2),-27+ty+l1*k1*Math.cos(r1)+l2*k2*Math.cos(r2)]}; // punto a `len` u. del hombro siguiendo brazo y antebrazo (codo eb)
  // lote D1: en las DIAGONALES DE FRENTE (lk y no espalda) el brazo del escudo es el lado que se aleja de la cámara → el escudo va DETRÁS del torso y asoma por el borde
  // (antes se pintaba encima del pecho). De espaldas en diagonal sigue delante pero más estrecho (girado 3/4).
  const shBehind=!!(GR.sh&&lk&&!bk&&!sd);
  const shieldDraw=()=>{const sc2=GR.sh,rim=STY.mix(sc2,'#2a2a3a',.4),hi=STY.mix(sc2,'#ffffff',.32),ap=armPt(shF,aF,10,fw,p.eF),a0=armPt(shF,sd?20:8,10,false,0),dx=ap[0]-a0[0],dy=ap[1]-a0[1];
   if(sd){const ex=ap[0]+3.8,ey=ap[1]-1.4;P(()=>g.ellipse(ex,ey,4.4,8.8,0,0,eo),rim,{lw:1.2});P(()=>g.ellipse(ex+.6,ey,3.1,7.4,0,0,eo),sc2,{lw:.8});P(el(ex+2,ey,1.4,1.7),hi,{lw:.8,nodark:true})} // perfil: más ancho y adelantado sobre el antebrazo (antes 3,2 de ancho justo detrás del brazo cercano: no se veía)
   else{const cx=shF+lk*1.2+dx*.85-Math.abs(lk)*(bk?1.4:2.4),cy=-19+ty+dy*.85;if(lk){g.save();g.translate(cx,cy);g.scale(.78,1);g.translate(-cx,-cy)} // diagonal: escudo girado 3/4 (más estrecho) y hacia fuera
    P(()=>{g.moveTo(cx-7.6,cy-8.4);g.lineTo(cx+7.6,cy-8.4);g.quadraticCurveTo(cx+8.4,cy+3,cx,cy+11.6);g.quadraticCurveTo(cx-8.4,cy+3,cx-7.6,cy-8.4);g.closePath()},bk?dk(rim):rim,{lw:1.4});
    P(()=>{g.moveTo(cx-5.6,cy-6.4);g.lineTo(cx+5.6,cy-6.4);g.quadraticCurveTo(cx+6.2,cy+2.6,cx,cy+9);g.quadraticCurveTo(cx-6.2,cy+2.6,cx-5.6,cy-6.4);g.closePath()},bk?dk(sc2):sc2,{lw:.9});
    if(!bk){P(el(cx,cy-.4,2.5,2.5),hi,{lw:.9,nodark:true});P(()=>{g.moveTo(cx-5.4,cy-5.6);g.lineTo(cx-1.6,cy-5.6);g.lineTo(cx-4.6,cy+1);g.closePath()},hi,{ink:false,nodark:true})}if(lk)g.restore()}};
  if(GR.sh&&!shOnBack&&shBehind)shieldDraw();
  // ── torso ──
  if(sd){P(()=>fem?rr(-5.1,-30+ty,10.2,18,5):rr(-5.8,-30+ty,11.6,18,5),col);if(!bk)P(()=>fem?rr(-5.2,-15.2,10.4,2.8,1.2):rr(-5.9,-15.2,11.8,2.8,1.2),o.belt||'#7a5230',{lw:1.2})}
  else{P(fem?()=>{g.moveTo(-6.4,-28.8+ty);g.quadraticCurveTo(-6.4,-30.4+ty,-4.8,-30.4+ty);g.lineTo(4.8,-30.4+ty);g.quadraticCurveTo(6.4,-30.4+ty,6.4,-28.8+ty);g.quadraticCurveTo(5.2,-21+ty,7.2,-13.6+ty);g.quadraticCurveTo(7.2,-12+ty,5.6,-12+ty);g.lineTo(-5.6,-12+ty);g.quadraticCurveTo(-7.2,-12+ty,-7.2,-13.6+ty);g.quadraticCurveTo(-5.2,-21+ty,-6.4,-28.8+ty);g.closePath()}:()=>rr(-8,-30+ty,16,18,5),col);P(()=>fem?rr(-7.4,-15.2,14.8,2.8,1.2):rr(-8.2,-15.2,16.4,2.8,1.2),o.belt||'#7a5230',{lw:1.2});
   if(lk&&!bk)P(()=>fem?rr(-7.2,-29.6+ty,4.2,17,2):rr(-8,-29.6+ty,6,17.4,2.4),STY.mix(col,'#3a2a4a',.38),{lw:1.1,nodark:true});   // 3/4: cara lateral del torso (la que mira a la cámara) más oscura → el cuerpo se ve girado, no solo la cabeza
   if(!bk){P(()=>rr(-1.4,-15.4,2.8,3.2,.8),'#e0b84a',{lw:1,nodark:true});P(()=>{g.moveTo(-3.6,-30+ty);g.lineTo(3.6,-30+ty);g.lineTo(0,-25.5+ty);g.closePath()},o.collar||STY.mix(col,'#ffffff',.5),{lw:1,nodark:true})}}
  if(bk&&o.cape)P(()=>{if(!cw){rr(-9.5,-30+ty,19,29,4);return}const sw=cf*1.6,hy3=-1-cw*2.2,bw=9.5+cw*1.2; // de espaldas al moverse: bajo ondulado que se balancea
   g.moveTo(-9.5,-26+ty);g.quadraticCurveTo(-9.5,-30+ty,-5.5,-30+ty);g.lineTo(5.5,-30+ty);g.quadraticCurveTo(9.5,-30+ty,9.5,-26+ty);g.lineTo(bw+sw,hy3);
   g.quadraticCurveTo(bw*.5+sw,hy3+1.6*cf,sw,hy3);g.quadraticCurveTo(-bw*.5+sw,hy3-1.6*cf,-bw+sw,hy3);g.closePath()},o.cape);
  if(bk)stow();
  // ── ARMADURA del torso: peto con relieve (nervio central, borde) y hombreras ──
  const plate=GR.pl?STY.mix(col,'#ffffff',.26):null;
  if(plate&&!sd){if(!bk){P(()=>rr(-5.8,-28.6+ty,11.6,10.4,3.2),plate,{lw:1.1});g.save();g.strokeStyle=STY.mix(col,'#2a2a3a',.45);g.globalAlpha=.7;g.lineWidth=.9/sc;g.beginPath();g.moveTo(0,-28.4+ty);g.lineTo(0,-18.4+ty);g.stroke();g.restore()}else P(()=>rr(-6,-28.6+ty,12,11,3.2),plate,{lw:1.1})}
  if(plate&&sd)P(()=>rr(-4.2,-28.6+ty,8.4,10.6,3.2),plate,{lw:1.1});
  // tahalí (lote D1): correa de cuero cruzada sobre el pecho cuando hay espada/mandoble envainado a la espalda → se lee el arma aunque el pelo tape la empuñadura
  if(GR.wp&&!it&&(GR.wp.wk==='sword'||GR.wp.wk==='great')&&!bk){const sx2=sd?-1.4:-7.4+lk*1.6,ex2=sd?3.2:6.6+lk*.6;P(()=>{g.moveTo(sx2-1.3,-29.6+ty);g.lineTo(sx2+1.3,-29.6+ty);g.lineTo(ex2+1.3,-14.6+ty);g.lineTo(ex2-1.3,-14.6+ty);g.closePath()},'#5a3a22',{lw:1});P(el(sx2*.45+ex2*.55,-21.6+ty,1.3,1.3),'#c9a24a',{lw:.8,nodark:true})}
  // ── ESCUDO (mano libre): de frente/espalda cubre el brazo lejano; de perfil asoma por delante del torso ──
  // ESCUDO (lote G2): va en el antebrazo del brazo libre (sigue a aF: se balancea al andar y cubre en guardia). Si las dos manos están ocupadas
  // (mandoble, arco, ballesta, hacha, pico… it.two o arco) va colgado a la ESPALDA: se ve de espaldas, de frente/perfil queda tapado por el cuerpo.
  if(shOnBack&&bk){const sc2=GR.sh,rim=STY.mix(sc2,'#2a2a3a',.4),cx=lk*-1.2,cy=-21+ty;P(()=>rr(cx-6.6,cy-3.4,13.2,1.6,.6),'#6b4a2a',{lw:.9}); // escudo a la espalda: correa + escudo
   P(()=>{g.moveTo(cx-7,cy-7.8);g.lineTo(cx+7,cy-7.8);g.quadraticCurveTo(cx+7.8,cy+2.8,cx,cy+10.8);g.quadraticCurveTo(cx-7.8,cy+2.8,cx-7,cy-7.8);g.closePath()},rim,{lw:1.4});
   P(()=>{g.moveTo(cx-5.2,cy-5.9);g.lineTo(cx+5.2,cy-5.9);g.quadraticCurveTo(cx+5.8,cy+2.4,cx,cy+8.4);g.quadraticCurveTo(cx-5.8,cy+2.4,cx-5.2,cy-5.9);g.closePath()},sc2,{lw:.9});P(el(cx,cy,2.2,2.2),STY.mix(sc2,'#ffffff',.32),{lw:.9,nodark:true})}
  if(GR.sh&&!shOnBack&&!shBehind)shieldDraw();
  if(fw&&!bk&&!late)fwArms();else if(late){bodyOn();fwArms('far');g.restore()}else if(!fw)arm(shN,aN,false,it,p.eN);
  if(plate){const pa=(cx,cy)=>{P(()=>g.ellipse(cx,cy,5.2,3.6,0,0,eo),plate,{lw:1.3});P(()=>g.ellipse(cx-.6,cy-1,3,1.5,0,0,eo),STY.mix(plate,'#ffffff',.4),{ink:false,nodark:true})};
   if(sd)pa(0,-28.4+ty);else{pa(shN,-27.8+ty);pa(shF,-27.8+ty)}}
  // ── farol colgado del cinturón (o.lamp: undefined = sin farol, 0 apagado, 1/2 encendido con dos fases de parpadeo). De noche el juego lo enciende (game.js dP); su luz real es LIGHT.player ──
  if(o.lamp!=null){const lx=sd?-4.2:-6.6,ly=-14.4,lit=o.lamp>0,fl=o.lamp===2?.82:1;g.save();g.translate(lx,ly);g.scale(.72,.72);g.translate(-lx,-ly);   // pequeño y enganchado al cinturón (y≈-14)
   g.save();g.lineWidth=1/sc;g.strokeStyle=INKC;g.beginPath();g.moveTo(lx,ly-.6);g.lineTo(lx,ly+2.2);g.stroke();g.restore();
   if(lit){g.save();const gr=g.createRadialGradient(lx,ly+6,0,lx,ly+6,12*fl);gr.addColorStop(0,'rgba(255,214,120,.75)');gr.addColorStop(.45,'rgba(255,190,80,.28)');gr.addColorStop(1,'rgba(255,170,60,0)');g.fillStyle=gr;g.beginPath();g.arc(lx,ly+6,12*fl,0,Math.PI*2);g.fill();g.restore()}
   P(()=>rr(lx-2.5,ly+2.4,5,6,1.2),lit?(o.lamp===2?'#ffdf90':'#ffeeb0'):'#7a6a50',{nodark:lit,lw:1});P(()=>rr(lx-3,ly+1.4,6,1.7,.6),'#4a3a2e',{lw:.9,nodark:true});P(()=>rr(lx-3,ly+8.1,6,1.7,.6),'#4a3a2e',{lw:.9,nodark:true});
   if(lit){g.save();g.fillStyle='#fff6d0';g.globalAlpha=.9;g.beginPath();g.ellipse(lx,ly+5.4,.9,1.6,0,0,7);g.fill();g.restore()}g.restore()}
  g.restore(); // fin del giro del cuerpo
  // ── cabeza ──
  g.save();g.translate(hdx,0);
  // ── YELMO de armadura (v:'f' frente, 's' perfil, 'b' espalda): casco con nervio, ala remachada, nasal y carrilleras; cimera según tier (GR.ht) ──
  const helmArt=v=>{const c=o.hatCol||'#7a8290',hl=STY.mix(c,'#ffffff',.38),hd=STY.mix(c,'#2a2a3a',.42),br=STY.mix(c,'#2a2a3a',.2),rv=STY.mix(c,'#ffffff',.6),T=GR.ht||'',fin=/mitril|adam|dragon|runa/.test(T),spk=/hierro|acero|plata/.test(T);
   const rivets=(a,b,yy,n)=>{for(let i=0;i<n;i++){const xx=a+(b-a)*(i+.5)/n;P(el(xx,yy,.7,.7),rv,{ink:false,nodark:true})}};
   if(v==='f'){const W=hw+1.5;
    P(()=>{g.moveTo(-W,hy+2.4);g.ellipse(0,hy-.2,W,hv+1.8,0,Math.PI,eo);g.lineTo(W,hy+2.4);g.lineTo(W-1,hy-1.6);g.lineTo(-W+1,hy-1.6);g.closePath()},c);
    P(()=>rr(-W-.2,hy-2.6,W*2+.4,3.4,1.4),br,{lw:1.2});rivets(-W+2,W-2,hy-.9,6);
    P(()=>rr(-W-.4,hy-1,3.8,9.4,1.6),br,{lw:1.2});P(()=>rr(W-3.4,hy-1,3.8,9.4,1.6),br,{lw:1.2});
    P(()=>rr(-1.3,hy-2,2.6,8.4,1.1),hl,{lw:1.1});
    g.save();g.strokeStyle=hl;g.globalAlpha=.8;g.lineWidth=1.3/sc;g.beginPath();g.moveTo(0,hy-hv-1.5);g.lineTo(0,hy-3);g.stroke();g.restore();
    if(fin)P(()=>{g.moveTo(-2.4,hy-hv+.6);g.quadraticCurveTo(-1,hy-hv-8,3.6,hy-hv-6);g.quadraticCurveTo(1.6,hy-hv-3,2.4,hy-hv+.6);g.closePath()},STY.mix(c,'#d8303a',.55));
    else if(spk)P(()=>{g.moveTo(-1.8,hy-hv+.4);g.lineTo(0,hy-hv-5.6);g.lineTo(1.8,hy-hv+.4);g.closePath()},hl)}
   else if(v==='s'){
    P(()=>{g.moveTo(-hw-.8,hy+2.4);g.ellipse(-.4,hy-.2,hw+1.3,hv+1.7,0,Math.PI,eo);g.lineTo(hw+1.2,hy+1.6);g.lineTo(hw*.5,hy-1.6);g.lineTo(-hw-.8,hy+2.4);g.closePath()},c);
    P(()=>rr(-hw-.9,hy-2.6,hw*2+2.2,3.4,1.4),br,{lw:1.2});rivets(-hw+1,hw-1,hy-.9,5);
    P(()=>rr(-4.6,hy+.6,6.4,6.6,2.2),br,{lw:1.2});P(el(-1.4,hy+3.6,.9,.9),rv,{ink:false,nodark:true});
    P(()=>rr(hw*.9,hy-2,2.2,8,1),hl,{lw:1.1});
    g.save();g.strokeStyle=hl;g.globalAlpha=.8;g.lineWidth=1.3/sc;g.beginPath();g.moveTo(-hw*.7,hy-hv*.5);g.quadraticCurveTo(0,hy-hv-1.4,hw*.6,hy-hv*.4);g.stroke();g.restore();
    if(fin)P(()=>{g.moveTo(-7,hy-hv+2);g.quadraticCurveTo(-12,hy-hv-6,-2,hy-hv-5.4);g.quadraticCurveTo(-4,hy-hv-2.6,2,hy-hv);g.closePath()},STY.mix(c,'#d8303a',.55));
    else if(spk)P(()=>{g.moveTo(-2.4,hy-hv+.2);g.lineTo(-.4,hy-hv-5.4);g.lineTo(1.6,hy-hv+.4);g.closePath()},hl)}
   else{const W=hw+1.5;
    P(()=>g.ellipse(0,hy+.2,W,hv+1.9,0,0,eo),c);
    P(()=>rr(-W-.2,hy+1.6,W*2+.4,3.4,1.4),br,{lw:1.2});rivets(-W+2,W-2,hy+3.3,6);
    P(()=>rr(-W*.55,hy+5,W*1.1,3.2,1.5),hd,{lw:1.2});
    g.save();g.strokeStyle=hl;g.globalAlpha=.8;g.lineWidth=1.3/sc;g.beginPath();g.moveTo(0,hy-hv-1.4);g.lineTo(0,hy+1.4);g.stroke();g.restore();
    if(fin)P(()=>{g.moveTo(-2,hy-hv+.6);g.quadraticCurveTo(0,hy-hv-8,4,hy-hv-6);g.quadraticCurveTo(2,hy-hv-3,2.4,hy-hv+.6);g.closePath()},STY.mix(c,'#d8303a',.55));
    else if(spk)P(()=>{g.moveTo(-1.8,hy-hv+.4);g.lineTo(0,hy-hv-5.6);g.lineTo(1.8,hy-hv+.4);g.closePath()},hl)}};
  // ── personalización (editor de personaje): peinados extra y rasgos de cara. Son parámetros del MISMO modelo: no hay que reanimar nada. ──
  // o.hairStyle: short | long | bun (moño) | spiky (puntas) | bald ; o.face: 0 normal, 1 pecas, 2 pestañas y rubor, 3 cejas gruesas ; o.eye color de ojos ; o.skin ; o.hair
  const faceX=()=>{const f=o.face|0;if(!f||bk)return;const ey=hy+3.2,ink=o.lash||'#4a2e22',sh=sd?0:lk*1.6;g.save();g.lineCap='round';
   const pts=sd?[[ 5.6]]:[[-4.7+sh],[4.7+sh]];
   if(f===1){g.fillStyle='#c98a62';(sd?[[hw*.5,ey+3.4],[hw*.5+2,ey+4.4],[hw*.5-1.4,ey+5]]:[-1,1].flatMap(sg=>[[sg*7.4+sh,ey+3.2],[sg*5.6+sh,ey+4.4],[sg*8.2+sh,ey+5.2]])).forEach(q=>{g.beginPath();g.ellipse(q[0],q[1],.6,.6,0,0,7);g.fill()})}
   if(f===2){g.strokeStyle=ink;g.lineWidth=1/sc;pts.forEach(q=>{const cx=q[0],sg=sd?1:(cx<sh?-1:1);g.beginPath();g.moveTo(cx+sg*1.2,ey-1.7);g.lineTo(cx+sg*3.2,ey-2.9);g.stroke()});
    g.fillStyle='#f0958a';g.globalAlpha=.55;(sd?[[hw*.55,ey+3.8]]:[[-7.6+sh,ey+3.8],[7.6+sh,ey+3.8]]).forEach(q=>{g.beginPath();g.ellipse(q[0],q[1],2.3,1.5,0,0,7);g.fill()})}
   if(f===3){g.strokeStyle=STY.mix(hair,'#2a1a12',.35);g.lineWidth=1.5/sc;pts.forEach(q=>{const cx=q[0],sg=sd?1:(cx<sh?-1:1);g.beginPath();g.moveTo(cx-sg*2.4,ey-3);g.lineTo(cx+sg*2.2,ey-3.9);g.stroke()})}
   g.restore()};
  if(sd){
   P(()=>{g.ellipse(0,hy,hw*.97,hv,0,0,Math.PI*2)},skin);
   if(hasH){const G_=hairGeo();P(G_.cap.full,hair,{ink:false,nodark:true});g.save();g.beginPath();G_.cap.fringe();g.lineWidth=1.5/sc;g.strokeStyle=INKC;g.globalAlpha=.9;g.stroke();g.restore()}
   if(!HDEF.behind&&HDEF.tail!=='twin')P(el(-1.4,hy+1.4,2.3,2.9),skin);
   if(o.hat==='helm'){P(()=>{g.ellipse(4.2,hy+2.4,hw*.62,hv*.74,0,0,Math.PI*2)},skin);helmArt('s')}
   P(el(hw*.95+.4,hy+4.2,1.9,1.6),skin,{lw:1.1});
   const ey=hy+3.2,ex=5.6;if(p.blink===1){g.strokeStyle=o.lash||'#4a2e22';g.lineWidth=1/sc;g.beginPath();g.moveTo(ex-1.8,ey);g.quadraticCurveTo(ex,ey+1.2,ex+1.8,ey);g.stroke()}
   else if(p.blink===2){g.strokeStyle='#3a2620';g.lineWidth=1.1/sc;g.beginPath();g.moveTo(ex-2,ey-1.3);g.lineTo(ex+.8,ey);g.lineTo(ex-2,ey+1.3);g.stroke()}
   else{g.fillStyle=o.eye||'#3a2620';g.beginPath();g.ellipse(ex,ey,1.55,2.1,0,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(ex-.45,ey-.8,.55,0,7);g.fill()}
   g.strokeStyle=o.lip||'#8a4a3e';g.lineWidth=.9/sc;g.beginPath();if(p.mouth){g.ellipse(hw*.62+1,ey+5,1.6,1.3,0,0,7)}else g.arc(hw*.62,ey+4,1.4,.1*Math.PI,.8*Math.PI);g.stroke()}
  else{
   [-1,1].forEach(sg=>{if(lk&&!bk&&sg<0)return;P(el(sg*(hw-.6)+(lk&&sg>0?1:0),hy+1,2.3,2.9),skin)});   // 3/4: la oreja del lado que da la espalda a la cámara queda oculta
   P(()=>g.ellipse(0,hy,hw,hv,0,0,Math.PI*2),skin);
   if(bk){{const G_=hairGeo(),L=[...G_.B,...(G_.cap?[G_.cap.full,...G_.T]:[])];if(L.length){hairOutline(L);hairFill(L)}}
    if(o.hat==='helm')helmArt('b')}
   else{
    if(hasH){const G_=hairGeo();P(G_.cap.full,hair,{ink:false,nodark:true});g.save();g.beginPath();G_.cap.fringe();g.lineWidth=1.5/sc;g.strokeStyle=INKC;g.globalAlpha=.9;g.stroke();g.restore()}
    if(o.hat==='helm')helmArt('f');
    const ey=hy+3.2,gb=p.blink,sh=lk*3.1;
    [-1,1].forEach(sg=>{const cx=sg*4.7+sh;if(gb===1){g.strokeStyle=o.lash||'#4a2e22';g.lineWidth=1/sc;g.beginPath();g.moveTo(cx-1.8,ey);g.quadraticCurveTo(cx,ey+1.2,cx+1.8,ey);g.stroke()}
     else if(gb===2){g.strokeStyle='#3a2620';g.lineWidth=1.1/sc;g.beginPath();g.moveTo(cx-sg*2,ey-1.3);g.lineTo(cx+sg*.8,ey);g.lineTo(cx-sg*2,ey+1.3);g.stroke()}
     else{g.fillStyle=o.eye||'#3a2620';g.beginPath();g.ellipse(cx,ey,1.55,2.1,0,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(cx-.45,ey-.8,.55,0,7);g.fill()}});
    g.strokeStyle=o.lip||'#8a4a3e';g.lineWidth=.9/sc;g.beginPath();if(p.mouth){g.ellipse(sh,ey+5,1.5,1.4,0,0,7)}else g.arc(sh,ey+4,1.5,.15*Math.PI,.85*Math.PI);g.stroke()}}
  faceX();
  g.restore();if(late){bodyOn();fwArms('near');g.restore()}g.restore()}
 // presets de NPC (datos); se pasan como opciones a U.aldeano. Un NPC nuevo = una fila.
 const PEOPLE={goblin:{build:'goblin',headK:1.18,col:'#a0764a',skin:'#8cc070',pants:'#6e5238',boot:'#5a4030',hairStyle:'bald',eye:'#b02a2a',sclera:'#f4e9a0',ears:true,blush:'#7fb060',collar:'#8a6a42',belt:'#4a3422',smile:.9},
  ru:{col:'#6a3aa8',dress:'#7a46b8',hair:'#8a5a32',hairStyle:'long',pouch:'#b9803f',pants:'#4a3a6a',skin:'#f6d4b0',collar:'#f1e4c4'},
  herrero:{col:'#a85a3a',apron:'#4a3a32',hair:'#2a1a12',hairStyle:'bald',beard:'#5a3a22',pants:'#4a3a32',skin:'#e8b890',collar:'#c08a6a'},
  aldeana:{col:'#c06a7a',hair:'#7a3a22',hairStyle:'long',pants:'#6a4a5a',collar:'#f1e4c4',skin:'#f6d4b0'},
  guardia:{col:'#939eac',hat:'helm',hatCol:'#7a8290',hair:'#3a2a1a',hairStyle:'short',pants:'#4a4a5a',cape:'#a83a3a',collar:'#c8d0d8'},
  anciano:{col:'#5a7a5a',hair:'#dcdcdc',hairStyle:'short',beard:'#dcdcdc',pants:'#5a4a3a',skin:'#e8c4a0',collar:'#8aa88a'},
  nino:{build:'chibi',col:'#4a8ac0',hair:'#c08a3a',hairStyle:'curly',pants:'#6a5a3a',skin:'#f6d4b0'},
  jugador:{build:'esbelto',col:'#e0906a',hair:'#5a3a22',hairStyle:'short',pants:'#5a4a6a'}};
 const U={
  roble:(g,x,y,sm)=>tree(g,x,y,sm,SPECIES.roble),abedul:(g,x,y,sm)=>tree(g,x,y,sm,SPECIES.abedul),arce:(g,x,y,sm)=>tree(g,x,y,sm,SPECIES.arce),fresno:(g,x,y,sm)=>tree(g,x,y,sm,SPECIES.fresno),tejo:(g,x,y,sm)=>tree(g,x,y,sm,SPECIES.tejo),ebano:(g,x,y,sm)=>tree(g,x,y,sm,SPECIES.ebano),caoba:(g,x,y,sm)=>tree(g,x,y,sm,SPECIES.caoba),baobab:(g,x,y,sm)=>tree(g,x,y,sm,SPECIES.baobab),mundo:(g,x,y,sm)=>tree(g,x,y,sm,SPECIES.mundo),
  sauce(g,x,y,sm){soft(g,x,y,20);const c='#8fcbb8';M(g,x,y,lathe({n:6,at:[0,0,0],r:[3.6,3.6],h:24,top:.78,seed:3}),'#a58d6a',sm,3,RG);
   const drape=back=>{for(let k=0;k<9;k++){const a=k*Math.PI*2/9+.25,d=Math.sin(a)*14,sx=Math.cos(a)*18;if((d<-3)===back)M(g,x,y,blob({at:at(sx,d,31-(k%3)*1.5),r:[3.4,3.4,11+(k%3)*2.5],amp:.1,seed:20+k}),STY.mix(c,'#ffffff',k%2?.1:.22),sm,20+k)}};
   drape(true);M(g,x,y,blob({at:at(0,0,44),r:[21,21,12],amp:.16,seed:5}),c,sm,5);M(g,x,y,blob({at:at(-2,-1,53),r:[13,13,8],amp:.16,seed:6}),c,sm,6);drape(false)},
  pino(g,x,y,sm){soft(g,x,y,18);M(g,x,y,lathe({n:6,at:[0,0,0],r:[3.4,3.4],h:12,top:.8,seed:31}),'#b08a5f',sm,31,RG);
   [[22,18,12,0],[17,17,28,1],[11,16,43,2]].forEach(([r,h,z,i])=>M(g,x,y,cone({at:[0,0,z],r:[r,r],h,n:7,seed:40+i,amp:.1}),i%2?'#5fa070':'#6fae7c',sm,40+i))},
  roca(g,x,y,sm){soft(g,x,y,18);M(g,x,y,blob({at:at(0,0,6),r:[13,11,7],amp:.18,flat:true,seed:55}),'#a29d93',sm,55);M(g,x,y,blob({at:at(9,4,3),r:[6,5,3.6],amp:.18,flat:true,seed:56}),'#b6b1a6',sm,56);M(g,x,y,blob({at:at(-7,-3,2.4),r:[4,3.4,2.4],amp:.2,flat:true,seed:57}),'#8f8a80',sm,57)},
  piedra(g,x,y,sm){soft(g,x,y,24);M(g,x,y,blob({at:at(0,0,8),r:[18,16,10],amp:.16,flat:true,seed:51}),'#a29d93',sm,51);M(g,x,y,blob({at:at(13,5,4),r:[8,7,5],amp:.16,flat:true,seed:52}),'#b6b1a6',sm,52);
   M(g,x,y,blob({at:at(-3,2,13),r:[4.8,4.2,3.6],amp:.2,seed:53}),'#f1c24a',sm,53,{paint:false})},
  arbusto(g,x,y,sm){soft(g,x,y,18);const c='#6fb048';[[-6,-1,9,9],[7,-1,9,9],[0,4,10,10]].forEach((l,i)=>M(g,x,y,blob({at:at(l[0],l[1],l[2]),r:[l[3],l[3],l[3]*.8],amp:.2,seed:61+i}),c,sm,61+i));
   [[-4,3,18,'#ff9ac0'],[5,2,17,'#ffd75a']].forEach((f,i)=>M(g,x,y,blob({at:at(f[0],f[1],f[2]),r:[2.2,2.2,2],amp:.1,seed:64+i}),f[3],sm,64+i,{paint:false}))},
  casa(g,x,y,sm,o){o=o||{};const w=o.w||30,d=o.d||22,hh=o.h||16,W=o.wall||'#e6d2a6',rf=o.roof||'#d0674a';soft(g,x,y,Math.max(w,d)*.8);M(g,x,y,box(w,d,hh,[0,0,0]),W,sm,61,RG);
   M(g,x,y,box(7,1.4,11,[-w/6,d/2,0]),'#7a4e2c',0,62,{crease:0,paint:false});M(g,x,y,box(1.4,4.6,5,[w/2,-d*.2,hh*.45]),'#9fd6e8',0,63,{crease:0,paint:false,ij:.3});M(g,x,y,box(1.4,4.6,5,[w/2,d*.2,hh*.45]),'#9fd6e8',0,64,{crease:0,paint:false,ij:.3});
   M(g,x,y,gable({at:[0,0,hh],w:w,d:d,h:o.rh||13,ov:2.2}),rf,sm,65,RG);M(g,x,y,box(5,5,12,[-w*.27,-d*.14,hh+4]),'#a29d93',sm,66,RG)},
  farola(g,x,y,sm){soft(g,x,y,9);M(g,x,y,lathe({n:6,at:[0,0,0],r:[1.7,1.7],h:30,top:.8,seed:91}),'#5a4a3a',sm,91,RG);
   M(g,x,y,box(8,8,1.6,[0,0,29]),'#4a3a2e',sm,94,RG);                                           // base del farol (se pinta ANTES del cristal para no taparlo)
   M(g,x,y,box(6,6,8,[0,0,30.6]),'#ffd98a',0,92,{crease:0,paint:false,ij:.3});                   // cristal con luz
   M(g,x,y,box(8,8,1.6,[0,0,38.6]),'#4a3a2e',sm,93,RG);M(g,x,y,cone({at:[0,0,40.2],r:[4.4,4.4],h:3.4,n:4,amp:0,seed:96}),'#4a3a2e',sm,96,RG)},
  valla(g,x,y,sm,o){o=o||{};const L=o.len||18,al=o.dir==='y';const B=(w,d,h,p)=>al?box(d,w,h,[p[1],p[0],p[2]]):box(w,d,h,p);soft(g,x,y,L*.6);
   [-L/2,L/2].forEach((px,i)=>M(g,x,y,B(2.4,2.4,11,[px,0,0]),'#9a6a3a',sm,95+i,RG));[4,8].forEach((z,i)=>M(g,x,y,B(L,1.4,1.8,[0,0,z]),'#b9803f',sm,97+i,RG))},
  barril(g,x,y,sm){soft(g,x,y,8);M(g,x,y,lathe({n:8,at:[0,0,0],r:[5,5],h:10,top:.95,seed:101}),'#9a6a3a',sm,101,RG);M(g,x,y,lathe({n:8,at:[0,0,4],r:[5.3,5.3],h:1.4,top:1,seed:102}),'#6e4a2a',0,102,{crease:0,paint:false})},
  caja(g,x,y,sm){soft(g,x,y,8);M(g,x,y,box(9,9,8,[0,0,0]),'#b9803f',sm,103,RG);M(g,x,y,box(9.4,2,8.2,[0,0,0]),'#8f5f2c',0,104,{crease:0,paint:false,ij:.3})},
  taberna(g,x,y,sm,o){o=o||{};const w=o.w||36,d=o.d||26,hh=28,W=o.wall||'#eadcb8',rf=o.roof||'#9a4a3a',T='#6e4a2a',h1=hh*.5,J=.7;soft(g,x,y,w*.8);
   // 14 oct 2026: piso de arriba MACIZO y del mismo color que el de abajo (voladizo de .7 px): antes solo había un muro y los pilares/ménsula formaban marcos que se leían como «ver por dentro»
   M(g,x,y,box(w,d,h1,[0,0,0]),W,sm,111,RG);
   [-w*.32,0,w*.32].forEach((px,i)=>M(g,x,y,box(2,1.4,h1,[px,d/2,0]),T,0,112+i,{crease:0,paint:false,ij:.2}));[-d*.36,d*.36].forEach((py,i)=>M(g,x,y,box(1.4,2,h1,[w/2,py,0]),T,0,115+i,{crease:0,paint:false,ij:.2}));
   M(g,x,y,box(8,1.4,13,[-w*.16,d/2,0]),'#5a3a22',0,119,{crease:0,paint:false});
  M(g,x,y,box(w+2*J+.6,d+2*J+.6,1.6,[0,0,h1-.6]),T,0,118,{crease:0,paint:false,ij:.2});M(g,x,y,box(w+2*J,d+2*J,hh-h1,[0,0,h1]),W,sm,110,RG);   // orden: el canto va ANTES del piso de arriba (M pinta en orden de llamada; si va después, su cara superior tapa la fachada y parece un suelo «hueco»)
   // ventanas: marco hundido + cristal + alféizar, entre los pilares; las de arriba salen a la cara del voladizo
   {let nn=300;const WN=(c,pz,fy,e)=>{const dd=d/2+e,ww=w/2+e,fr=fy?box(7,1.8,7,[c,dd-.3,pz-1.1]):box(1.8,7,7,[ww-.3,c,pz-1.1]),gl=fy?box(4.8,1.2,4.8,[c,dd+.5,pz]):box(1.2,4.8,4.8,[ww+.5,c,pz]),sl=fy?box(8,2.8,1.2,[c,dd+.4,pz-2.1]):box(2.8,8,1.2,[ww+.4,c,pz-2.1]);
    M(g,x,y,fr,T,0,nn++,{crease:0,paint:false,ij:.2});M(g,x,y,gl,'#9fd6e8',0,nn++,{crease:0,paint:false,ij:.3});M(g,x,y,sl,'#8a5a30',0,nn++,{crease:0,paint:false,ij:.2})};
    WN(w*.16,5.6,1,0);WN(-w*.16,hh*.64,1,J);WN(w*.16,hh*.64,1,J);[-d*.17,d*.17].forEach(c=>{WN(c,5.6,0,0);WN(c,hh*.64,0,J)})}
   M(g,x,y,gableEnds({at:[0,0,hh],w:w+2*J+.3,d:d+2*J,h:15,ov:2.4}),W,sm,128,RG);M(g,x,y,gableOpen({at:[0,0,hh],w:w,d:d,h:15,ov:2.4}),rf,sm,129,RG);M(g,x,y,box(6,6,13,[w*.28,-d*.16,hh+5]),'#a29d93',sm,130,RG);
   M(g,x,y,box(1.6,1.6,14,[w/2+5,d/2+2,0]),T,sm,131,RG);M(g,x,y,box(1.4,10,7,[w/2+5,d/2-3,8]),'#d9a05a',0,132,{crease:0,paint:false,ij:.3})},   // cartel colgante
  granero(g,x,y,sm,o){o=o||{};const w=o.w||42,d=o.d||30,hh=20,W=o.wall||'#c0583c',rf=o.roof||'#7a4a3a';soft(g,x,y,w*.8);M(g,x,y,box(w,d,hh,[0,0,0]),W,sm,141,RG);
   M(g,x,y,box(16,1.4,15,[0,d/2,0]),'#6e4a2a',0,142,{crease:0,paint:false});M(g,x,y,box(16.6,1.8,1.6,[0,d/2,7]),'#f1e4c4',0,143,{crease:0,paint:false,ij:.2});M(g,x,y,box(1.6,1.9,16.6,[0,d/2,0]),'#f1e4c4',0,144,{crease:0,paint:false,ij:.2});
   M(g,x,y,box(1.4,7,7,[w/2,0,hh+4]),'#4a3a2e',0,145,{crease:0,paint:false,ij:.2});M(g,x,y,box(1.4,d*.7,1.6,[w/2,0,hh*.5]),'#f1e4c4',0,146,{crease:0,paint:false,ij:.2});
   M(g,x,y,gable({at:[0,0,hh],w:w,d:d,h:15,ov:2.4}),rf,sm,147,RG)},
  cabana(g,x,y,sm,o){o=o||{};const w=o.w||22,d=o.d||18,hh=12,W=o.wall||'#d8b98a',rf=o.roof||'#d9b45a';soft(g,x,y,w*.9);M(g,x,y,box(w,d,hh,[0,0,0]),W,sm,151,RG);
   M(g,x,y,box(6,1.4,9,[-w*.2,d/2,0]),'#7a4e2c',0,152,{crease:0,paint:false});M(g,x,y,box(1.4,4.6,4.6,[w/2,0,hh*.5]),'#9fd6e8',0,153,{crease:0,paint:false,ij:.3});
   M(g,x,y,gable({at:[0,0,hh],w:w+2,d:d+2,h:11,ov:3}),rf,sm,154,RG);
   M(g,x,y,box(4.4,4.4,10,[-w*.28,-d*.1,hh+3]),'#8a8a80',sm,155,RG)},
  // ── recursos (F3-D): menas/rocas (o.base roca, o.ore pepitas, o.crystal cristales, o.dead escombro) ──
  mena(g,x,y,sm,o){o=o||{};const B=o.base||'#a29d93',O=o.ore||'#c8742a';soft(g,x,y,20);
   if(o.dead){M(g,x,y,blob({at:at(0,0,2.4),r:[11,9,3],amp:.2,flat:true,seed:501}),STY.mix(B,'#5b3a29',.25),sm,501);M(g,x,y,blob({at:at(7,3,1.6),r:[4,3.4,2],amp:.2,flat:true,seed:502}),STY.mix(B,'#5b3a29',.4),sm,502);return}
   if(o.crystal){const L=STY.mix(O,'#ffffff',.7);M(g,x,y,blob({at:at(0,0,3),r:[13,11,4],amp:.16,flat:true,seed:503}),B,sm,503);
    [[0,0,22,3.6],[-6,3,15,3],[6,2,17,3.2],[2,-5,12,2.6],[-3,-4,10,2.2]].forEach((c,i)=>{M(g,x,y,lathe({n:5,at:[c[0],c[1],4],r:[c[3]*1.35,c[3]*1.35],h:c[2],top:.2,seed:510+i}),STY.mix(O,'#ffffff',.18),sm,510+i,RG);M(g,x,y,lathe({n:5,at:[c[0]-c[3]*.35,c[1],4.4],r:[c[3]*.34,c[3]*.34],h:c[2]*.8,top:.2,seed:520+i}),L,0,520+i,{crease:0,paint:false,ij:.3})});return}
   M(g,x,y,blob({at:at(0,0,7),r:[16,14,9],amp:.2,flat:true,seed:504}),B,sm,504);M(g,x,y,blob({at:at(10,5,3.6),r:[7,6,4.4],amp:.2,flat:true,seed:505}),STY.mix(B,'#ffffff',.14),sm,505);
   [[-6,5,10,3.2],[4,8,5.6,2.8],[9,-3,10.4,3],[-9,-4,8,2.4]].forEach((c,i)=>M(g,x,y,blob({at:at(c[0],c[1],c[2]),r:[c[3],c[3],c[3]*.8],amp:.14,seed:530+i}),O,0,530+i,{paint:false,ij:.25}))},
  // portón del campamento orco (F3-D): una torre de troncos con medio dintel; o.side −1/+1 elige el lado (las dos mitades se juntan en el centro del paso)
  portonOrco(g,x,y,sm,o){o=o||{};const sg=o.side||1,W='#6a4a30',D='#4a3220';soft(g,x,y,13);
   M(g,x,y,box(11,11,40,[0,0,0]),W,sm,601,RG);for(let i=0;i<5;i++)M(g,x,y,box(11.8,11.8,1.2,[0,0,4+i*8]),D,0,602+i,{crease:0,paint:false,ij:.2});
   M(g,x,y,box(15,15,2.6,[0,0,40]),D,sm,608,RG);M(g,x,y,hip({at:[0,0,42.6],w:13,d:13,h:9,ov:2.4}),'#4a5a38',sm,609,RG);
   [[-1,-1],[1,-1],[-1,1],[1,1]].forEach((q,i)=>M(g,x,y,lathe({n:4,at:[q[0]*5.6,q[1]*5.6,42.6],r:[1,1],h:7,top:.2,seed:610+i}),'#8a8f98',sm,610+i,RG));
   M(g,x,y,box(5,30,5,[0,-sg*15,31]),W,sm,615,RG);M(g,x,y,box(5.4,30.6,1.2,[0,-sg*15,34.8]),D,0,616,{crease:0,paint:false,ij:.2});
   for(let i=0;i<3;i++)M(g,x,y,lathe({n:4,at:[0,-sg*(5+i*7),36],r:[1.2,1.2],h:8,top:.2,seed:617+i}),'#8a8f98',sm,617+i,RG);
   M(g,x,y,box(1.3,8,15,[sg*0+6.6,0,15]),'#5a7a3a',0,620,{crease:0,paint:false,ij:.2});M(g,x,y,box(1.4,5,5,[6.7,0,22]),'#c0392b',0,621,{crease:0,paint:false,ij:.3});
   M(g,x,y,blob({at:[0,-sg*20,27],r:[2.8,2.4,3],amp:.08,seed:622}),'#efe6d0',0,622,{paint:false,ij:.2})},
  // tramo de empalizada de estacas a lo largo de Y (o.l = largo)
  empalizada(g,x,y,sm,o){o=o||{};const l=o.l||48,n=Math.round(l/6);soft(g,x,y,8);M(g,x,y,box(2,l,2,[0,0,6]),'#4a3220',sm,631,RG);M(g,x,y,box(2,l,2,[0,0,14]),'#4a3220',sm,632,RG);
   for(let i=0;i<n;i++){const py=-l/2+3+i*(l-6)/(n-1);M(g,x,y,lathe({n:5,at:[0,py,0],r:[2.4,2.4],h:22+(i%3)*3,top:.18,seed:640+i}),i%2?'#7a5a3a':'#8a6a44',sm,640+i,RG)}},
  heno(g,x,y,sm){soft(g,x,y,10);M(g,x,y,blob({at:at(0,0,6),r:[9,8,7],amp:.14,flat:true,seed:161}),'#e0c25a',sm,161);M(g,x,y,blob({at:at(-4,3,4),r:[5,5,4],amp:.16,flat:true,seed:162}),'#c9a843',sm,162)},
  pozo(g,x,y,sm){soft(g,x,y,10);M(g,x,y,lathe({n:8,at:[0,0,0],r:[8,8],h:9,top:.95,seed:171}),'#a29d93',sm,171,RG);M(g,x,y,lathe({n:8,at:[0,0,8.6],r:[5.6,5.6],h:.8,top:1,seed:172}),'#3a6a8a',0,172,{crease:0,paint:false});
   [-6.4,6.4].forEach((py,i)=>M(g,x,y,box(1.8,1.8,18,[0,py,8]),'#8f5f2c',sm,173+i,RG));M(g,x,y,gable({at:[0,0,25],w:12,d:18,h:6,ov:1.6}),'#b9803f',sm,175,RG)},
  // ── instalaciones por arquitectura (o.arch: 0 medieval, 1 silvano, 2 palafito, 3 nórdica, 4 japonesa, 5 mesoamericana) ──
  banco(g,x,y,sm,o){o=o||{};const a=o.arch||0,w=44,d=30,hh=24,S=a===1?'#8a6a44':'#b4b0a4',win=o.night?'#ffd070':'#9fd6e8',CO=a===4?'#9a2e2e':a===1?'#7a5230':a===2?'#a8884e':'#d8d4c6';soft(g,x,y,w*.8);M(g,x,y,box(w+4,d+4,3,[0,0,0]),a===2?'#8a6e44':a===5?'#4a4044':'#8e8a80',sm,181,RG);M(g,x,y,box(w,d,hh,[0,0,3]),a===2?'#c9a96a':a===3?'#6a4a30':a===4?'#efe6d0':a===5?'#5a4a48':S,sm,182,RG);
   [-15,-5,5,15].forEach((px,i)=>M(g,x,y,lathe({n:6,at:[px,d/2+1.6,3],r:[2.2,2.2],h:hh-3,top:1,seed:183+i}),CO,sm,183+i,RG));
   M(g,x,y,box(8,1.4,13,[0,d/2+.2,3]),'#5a3a22',0,187,{crease:0,paint:false});M(g,x,y,box(12,1.8,3.4,[0,d/2+3.4,hh-1]),'#f1c24a',0,188,{crease:0,paint:false,ij:.2});
   [-d*.25,d*.25].forEach((py,i)=>M(g,x,y,box(1.4,6,8,[w/2,py,10]),win,0,189+i,{crease:0,paint:false,ij:.3}));M(g,x,y,box(1.4,9,9,[w/2,0,hh*.55]),'#f1c24a',0,191,{crease:0,paint:false,ij:.25});
   if(a===0)M(g,x,y,gable({at:[0,0,hh+3],w:w+3,d:d+3,h:9,ov:1.8}),'#6f7f8f',sm,192,RG);
   else if(a===1)M(g,x,y,gable({at:[0,0,hh+3],w:w+5,d:d+5,h:11,ov:2.4}),'#5f8a46',sm,192,RG);
   else if(a===2)M(g,x,y,hip({at:[0,0,hh+3],w:w+5,d:d+5,h:12,ov:2}),'#c9b36a',sm,192,RG);
   else if(a===3){M(g,x,y,gable({at:[0,0,hh+3],w:w+3,d:d+3,h:10,ov:2.2}),'#e4edf3',sm,192,RG);[-1,1].forEach((sg,i)=>M(g,x,y,tilt(cone({at:[0,0,0],r:[1.4,1.4],h:8,n:4,amp:0,seed:193+i}),[sg*(w/2+4),0,hh+13],'x',sg),'#3a2616',sm,193+i,RG))}
   else if(a===4){M(g,x,y,hip({at:[0,0,hh+3],w:w+8,d:d+8,h:8,ov:3}),'#3e4250',sm,192,RG);M(g,x,y,box(w*.5,d*.5,4,[0,0,hh+11]),'#efe6d0',sm,196,RG);M(g,x,y,hip({at:[0,0,hh+15],w:w*.5+4,d:d*.5+4,h:7,ov:2.4}),'#3e4250',sm,197,RG)}
   else{M(g,x,y,box(w+2,d+2,3,[0,0,hh+3]),'#4a4044',sm,192,RG);M(g,x,y,box(w-8,d-8,5,[0,0,hh+6]),'#6a5a58',sm,198,RG);M(g,x,y,box(w-6,1.2,1.4,[0,(d-8)/2+.1,hh+8]),'#ff7a2a',0,199,{crease:0,paint:false,ij:.3})}},
  tienda(g,x,y,sm,o){o=o||{};const a=o.arch||0,w=40,d=24;soft(g,x,y,w*.8);
   M(g,x,y,box(w-6,3,14,[0,-d/2+3,0]),a===1?'#6a4a30':a===5?'#4a4044':'#7a4e2c',sm,201,RG);M(g,x,y,box(w-4,7,10,[0,d/2-3,0]),a===4?'#8a2e2e':a===5?'#5a4a48':'#b9803f',sm,202,RG);M(g,x,y,box(w-2,9,1.6,[0,d/2-3,10]),a===4?'#3a2a2a':a===5?'#6a5a58':'#d6a566',sm,203,RG);
   [[-12,'#c0392b'],[-4,'#e0b83a'],[5,'#6aa84f'],[13,'#c0392b']].forEach((q,i)=>M(g,x,y,box(4,4,3,[q[0],d/2-3,11.6]),q[1],sm,204+i,RG));
   [[-1,-1],[1,-1],[-1,1],[1,1]].forEach((q,i)=>M(g,x,y,a===1||a===2?lathe({n:6,at:[q[0]*(w/2-2),q[1]*(d/2-2),0],r:[1.5,1.5],h:26,top:1,seed:208+i}):box(2,2,26,[q[0]*(w/2-2),q[1]*(d/2-2),0]),a===4?'#9a2e2e':a===5?'#5a4a48':a===2?'#a8884e':'#8f5f2c',sm,208+i,RG));
   if(a===0||a===5){const c1=a===5?'#d8501a':'#c0392b',c2=a===5?'#2a2220':'#f7f1e1';for(let i=0;i<8;i++)M(g,x,y,box(w/8+.2,d+6,1.8,[-w/2+(i+.5)*w/8,1,26]),i%2?c2:c1,sm,212+i,RG);if(a===5)for(let i=0;i<4;i++)M(g,x,y,box(1.4,1.4,6,[-w/2+4+i*(w-8)/3,d/2+3,27.5]),['#2fb59a','#e0b83a','#d8501a','#2fb59a'][i],0,230+i,{crease:0,paint:false,ij:.3})}
   else if(a===1)M(g,x,y,gable({at:[0,1,26],w:w+2,d:d+6,h:9,ov:1.6}),'#5f8a46',sm,212,RG);
   else if(a===2)M(g,x,y,hip({at:[0,1,26],w:w+4,d:d+7,h:9,ov:1.6}),'#c9b36a',sm,212,RG);
   else if(a===3){M(g,x,y,gable({at:[0,1,26],w:w+2,d:d+6,h:9,ov:1.6}),'#6a4a30',sm,212,RG);M(g,x,y,box(w-2,2,2.4,[0,1,35]),'#e4edf3',0,213,{crease:0,paint:false,ij:.2});[-12,0,12].forEach((px,i)=>M(g,x,y,lathe({n:8,at:[px,d/2+3.6,15],r:[3,3],h:.9,top:1,seed:214+i}),['#c0392b','#3a6aa8','#e0b84a'][i],0,214+i,{crease:0,paint:false,ij:.2}))}
   else{M(g,x,y,hip({at:[0,1,26],w:w+4,d:d+7,h:8,ov:2}),'#3e4250',sm,212,RG);M(g,x,y,box(w+4,1.2,1.8,[0,d/2+4.8,26]),'#9a2e2e',0,213,{crease:0,paint:false,ij:.2});M(g,x,y,blob({at:[w/2-3,d/2+4,22],r:[2.4,2.4,3],amp:.05,seed:215}),'#e8452c',0,215,{paint:false,ij:.3})}},
  fogata(g,x,y,sm,o){o=o||{};const a=o.arch||0;soft(g,x,y,16);M(g,x,y,blob({at:[0,0,.6],r:[10,10,.8],amp:.1,flat:true,seed:221}),a===5?'#2a2224':'#4a3a32',0,221,{paint:false,ij:.4});
   if(a===4){M(g,x,y,box(24,24,3,[0,0,0]),'#6b4a2a',sm,222,RG);M(g,x,y,box(19,19,3.2,[0,0,0]),'#d8d0b8',0,223,{crease:0,paint:false,ij:.2});M(g,x,y,box(5,5,1,[0,0,3]),'#3a2a24',0,224,{crease:0,paint:false});return}
   if(a===5){for(let k=0;k<8;k++){const q=[[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0]][k];M(g,x,y,box(7,7,5,[q[0]*10,q[1]*10,0]),k%2?'#4a4044':'#5a4a48',sm,222+k,RG)}M(g,x,y,box(14,3,2,[0,0,.8]),'#ff7a2a',0,231,{crease:0,paint:false,ij:.3});return}
   const n=a===3?6:8,rr=a===3?13:12,sz=a===3?4.6:3.4;for(let k=0;k<n;k++){const an=k*Math.PI*2/n+.2;M(g,x,y,blob({at:[Math.cos(an)*rr,Math.sin(an)*rr,2],r:[sz,sz,sz*.82],amp:.22,seed:222+k}),a===1?'#7a5a3a':a===2?'#6a5a4a':k%2?'#8f8a80':'#a29d93',sm,222+k)}
   M(g,x,y,box(18,3.2,3.2,[0,0,.8]),'#6b4a2a',sm,231,RG);M(g,x,y,box(3.2,18,3.2,[0,0,4]),'#5a3a1a',sm,232,RG)},
  horno(g,x,y,sm,o){o=o||{};const a=o.arch||0,w=24,d=22,hole=z=>M(g,x,y,box(7,7,.7,[0,0,z]),'#1c1614',0,243,{crease:0,paint:false}); // sin chimenea: el humo sale del tragaluz de arriba; la boca mira a +x (hacia la plaza)
   soft(g,x,y,w*.8);
   if(a===1||a===2){M(g,x,y,lathe({n:8,at:[0,0,0],r:[13.5,12.5],h:21,top:.8,seed:241}),a===1?'#a8683e':'#c9a070',sm,241,RG);hole(21)}
   else if(a===4){M(g,x,y,lathe({n:8,at:[0,0,0],r:[13,12],h:17,top:.8,seed:241}),'#8a5a3a',sm,241,RG);M(g,x,y,lathe({n:8,at:[0,0,16],r:[9,8.4],h:10,top:.7,seed:242}),'#7a4a30',sm,242,RG);M(g,x,y,box(1.2,13,1.3,[w/2,0,15]),'#3a2a24',0,298,{crease:0,paint:false});hole(25.6)}
   else if(a===5){M(g,x,y,box(w+2,d+2,10,[0,0,0]),'#3a3034',sm,241,RG);M(g,x,y,box(w-4,d-4,8,[0,0,10]),'#4a4044',sm,242,RG);M(g,x,y,box(w-8,d-8,4,[0,0,18]),'#5a4a48',sm,298,RG);M(g,x,y,box(.9,d-3,1.3,[(w+2)/2+.1,0,6]),'#ff7a2a',0,299,{crease:0,paint:false,ij:.3});hole(22.2)}
   else{M(g,x,y,box(w,d,22,[0,0,0]),a===3?'#6a6a72':'#8d8f96',sm,241,RG);M(g,x,y,box(w-4,d-4,6,[0,0,22]),a===3?'#e4edf3':'#7a7c84',sm,242,RG);hole(28.2)}
   const X=a===5?(w+2)/2:a===1||a===2?12.4:w/2;
   M(g,x,y,box(1.8,12,11,[X,0,3]),'#2a2220',0,245,{crease:0,paint:false});if(o.on){M(g,x,y,box(2,9,7,[X+.1,0,4]),'#ff8a2a',0,246,{crease:0,paint:false,ij:.3});M(g,x,y,box(2.2,5,4,[X+.2,0,4.5]),'#ffd070',0,247,{crease:0,paint:false,ij:.3})}
   M(g,x,y,box(2.4,14,2,[X+.4,0,13]),a===5?'#2a2024':'#5a5c64',sm,248,RG);if(a===0||a===3)[0,1,2].forEach(i=>M(g,x,y,box(5,1.4,3,[-6+i*6,d/2,8+(i%2)*6]),'#a3a9b6',0,249+i,{crease:0,paint:false,ij:.3}))},
  taller(g,x,y,sm,o){o=o||{};const a=o.arch||0,w=34,d=16,LG=a===4?'#9a2e2e':a===5?'#5a4a48':a===1?'#7a5230':a===3?'#5a3e28':a===2?'#a8884e':'#8f5f2c',TP=a===4?'#3a2a2a':a===5?'#5a4a48':a===3?'#6a4a30':a===2?'#d8c488':a===1?'#8a6a44':'#b9803f';soft(g,x,y,w*.7);
   [[-1,-1],[1,-1],[-1,1],[1,1]].forEach((q,i)=>M(g,x,y,a===1||a===2?lathe({n:6,at:[q[0]*(w/2-2),q[1]*(d/2-2),0],r:[2,2],h:11,top:1,seed:261+i}):box(3,3,11,[q[0]*(w/2-2),q[1]*(d/2-2),0]),LG,sm,261+i,RG));
   M(g,x,y,box(w-4,d-3,1.6,[0,0,4]),a===4?'#7a2020':'#a8723a',sm,265,RG);M(g,x,y,box(w,d,3,[0,0,11]),TP,sm,266,RG);
   M(g,x,y,box(12,6,3,[-9,0,14]),'#d6a566',sm,267,RG);M(g,x,y,box(11,5,2.4,[-9,0,17]),'#c99556',sm,268,RG);M(g,x,y,box(14,1,3.4,[7,3.4,14]),'#a3a9b6',sm,269,RG);M(g,x,y,box(4,1.8,2.2,[0,-3,14]),'#8f5f2c',sm,270,RG);M(g,x,y,box(5,2,2,[0,-3,16]),'#6e7380',sm,271,RG);M(g,x,y,box(5,5,5,[13,-2,14]),'#6e7380',sm,272,RG);
   if(a===3)M(g,x,y,box(34,16,1.2,[0,0,19.4]),'#e4edf3',0,273,{crease:0,paint:false,ij:.2});
   if(a===4)M(g,x,y,box(34.4,1.4,1.4,[0,-d/2-.2,14]),'#d8a030',0,273,{crease:0,paint:false,ij:.2})},
  escritorio(g,x,y,sm,o){o=o||{};const a=o.arch||0,w=28,d=16,LG=a===4?'#9a2e2e':a===5?'#4a4044':a===1?'#7a5230':a===3?'#5a3e28':a===2?'#a8884e':'#6e4a2a',TP=a===4?'#3a2a2a':a===5?'#6a5a58':a===3?'#6a4a30':a===2?'#d8c488':a===1?'#8a6a44':'#8f5f2c';soft(g,x,y,w*.7);
   [[-1,-1],[1,-1],[-1,1],[1,1]].forEach((q,i)=>M(g,x,y,a===1||a===2?lathe({n:6,at:[q[0]*(w/2-2),q[1]*(d/2-2),0],r:[1.8,1.8],h:11,top:1,seed:281+i}):box(2.6,2.6,11,[q[0]*(w/2-2),q[1]*(d/2-2),0]),LG,sm,281+i,RG));
   M(g,x,y,box(w,d,2,[0,0,11]),TP,sm,285,RG);M(g,x,y,box(10,8,.8,[-6,0,13]),'#8a3a3a',sm,286,RG);M(g,x,y,box(9,7,1,[-6,0,13.8]),'#f4efe0',sm,287,RG);M(g,x,y,box(8,6,.6,[4,3.4,13]),'#f1e4c4',sm,288,RG);
   M(g,x,y,lathe({n:6,at:[7,-4,13],r:[2,2],h:3.2,top:1,seed:289}),'#2a2a3a',sm,289,RG);M(g,x,y,box(1,1,9,[8,-4,16]),'#f4efe0',0,290,{crease:0,paint:false});M(g,x,y,lathe({n:6,at:[11,3,13],r:[1.4,1.4],h:5,top:1,seed:291}),'#f4efe0',sm,291,RG);
   if(a===4)M(g,x,y,lathe({n:6,at:[-1,-6,13],r:[1.2,1.2],h:9,top:1,seed:292}),'#f4efe0',sm,292,RG)
   if(a===3)M(g,x,y,box(w,d,.9,[0,0,13]),'#e4edf3',0,293,{crease:0,paint:false,ij:.2})},
  troncos(g,x,y,sm,o){o=o||{};const w=o.w||32,d=o.d||24,hh=14,W=o.wall||'#a8784a',rf=o.roof||'#5f8a46';soft(g,x,y,Math.max(w,d)*.8);M(g,x,y,box(w,d,hh,[0,0,0]),W,sm,301,RG);
   for(let i=0;i<4;i++)M(g,x,y,box(w+1.2,d+1.2,1.3,[0,0,2.5+i*3.2]),'#7a5230',0,302+i,{crease:0,paint:false,ij:.2});
   M(g,x,y,box(7,1.6,10,[-w/6,d/2+.2,0]),'#4a2e1a',0,306,{crease:0,paint:false});M(g,x,y,box(1.6,4.6,5,[w/2+.2,-d*.2,hh*.45]),'#9fd6e8',0,307,{crease:0,paint:false,ij:.3});M(g,x,y,box(1.6,4.6,5,[w/2+.2,d*.2,hh*.45]),'#9fd6e8',0,308,{crease:0,paint:false,ij:.3});
   M(g,x,y,gable({at:[0,0,hh],w:w+1,d:d+1,h:o.rh||14,ov:2.8}),rf,sm,309,RG);M(g,x,y,box(5,5,12,[-w*.27,-d*.14,hh+4]),'#8a8a80',sm,310,RG)},
  casaArbol(g,x,y,sm,o){o=o||{};soft(g,x,y,14);M(g,x,y,blob({at:at(-7,-3,56),r:[24,22,13],amp:.16,seed:312}),'#2c6e4c',sm,312);M(g,x,y,blob({at:at(6,-1,50),r:[15,14,9],amp:.16,seed:358}),'#357a54',sm,358);M(g,x,y,lathe({n:7,at:[-4,-3,0],r:[7,7],h:30,top:.82,seed:311}),'#8a6a44',sm,311,RG);
   M(g,x,y,box(28,24,2,[0,0,28]),'#a8784a',sm,313,RG);M(g,x,y,box(18,15,11,[0,0,30]),o.wall||'#c9a878',sm,314,RG);
   M(g,x,y,box(6,1.4,8,[-3,7.7,30]),'#5a3a22',0,315,{crease:0,paint:false});M(g,x,y,box(1.4,4,4,[9.2,0,35]),'#9fd6e8',0,316,{crease:0,paint:false,ij:.3});
   M(g,x,y,gable({at:[0,0,41],w:21,d:18,h:9,ov:2}),o.roof||'#4f8a3f',sm,317,RG);
   [10,14].forEach((lx,i)=>M(g,x,y,box(1.2,1.2,28,[lx,13.6,0]),'#7a5230',sm,318+i,RG));for(let i=0;i<7;i++)M(g,x,y,box(5,1,1,[12,13.9,3+i*3.8]),'#a8784a',sm,320+i,RG)},
  lenera(g,x,y,sm){soft(g,x,y,12);[[-4,0,0],[0,0,0],[4,0,0],[-2,0,3],[2,0,3],[0,0,6]].forEach((q,i)=>M(g,x,y,box(16,3.6,3,[q[0]*0,q[0],q[2]]),i%2?'#8f6238':'#a8784a',sm,330+i,RG))},
  tocon(g,x,y,sm){soft(g,x,y,7);M(g,x,y,lathe({n:7,at:[0,0,0],r:[5,5],h:5,top:.92,seed:341}),'#a8784a',sm,341,RG);M(g,x,y,lathe({n:7,at:[0,0,5],r:[4.2,4.2],h:.6,top:1,seed:342}),'#d6a566',0,342,{crease:0,paint:false})},
  seta(g,x,y,sm){soft(g,x,y,8);[[-4,1,5],[3,-2,6.5],[4,4,4]].forEach((q,i)=>{M(g,x,y,lathe({n:6,at:[q[0],q[1],0],r:[1.2,1.2],h:q[2],top:1,seed:351+i}),'#efe6d0',sm,351+i,RG);M(g,x,y,blob({at:[q[0],q[1],q[2]],r:[3.4,3.4,2.2],amp:.1,flat:true,seed:355+i}),i%2?'#d9a05a':'#c0392b',sm,355+i)})},
  casaLarga(g,x,y,sm,o){o=o||{};const w=o.w||46,d=o.d||22,hh=10,W=o.wall||'#6a4a30',rf=o.roof||'#e4edf3';soft(g,x,y,w*.7);M(g,x,y,box(w,d,hh,[0,0,0]),W,sm,401,RG);
   for(let i=0;i<8;i++)M(g,x,y,box(1,d+.6,hh,[-w/2+3+i*(w-6)/7,0,0]),'#4a3220',0,402+i,{crease:0,paint:false,ij:.2});
   M(g,x,y,box(8,1.6,9,[-w/5,d/2+.2,0]),'#3a2616',0,410,{crease:0,paint:false});M(g,x,y,box(10,2,1.4,[-w/5,d/2+.4,9]),'#c0392b',0,411,{crease:0,paint:false,ij:.2});
   [-w*.1,w*.1,w*.28].forEach((px,i)=>M(g,x,y,lathe({n:8,at:[px,d/2+.8,5.4],r:[2.2,2.2],h:.8,top:1,seed:412+i}),['#c0392b','#3a6aa8','#e0b84a'][i],0,412+i,{crease:0,paint:false,ij:.2}));
   M(g,x,y,gable({at:[0,0,hh],w:w+1,d:d+1,h:10,ov:3}),rf,sm,415,RG);M(g,x,y,box(w+8,1.6,1.6,[0,0,hh+10.4]),'#3a2616',0,416,{crease:0,paint:false});
   [-1,1].forEach((sg,i)=>M(g,x,y,tilt(cone({at:[0,0,0],r:[1.2,1.2],h:7,n:4,amp:0,seed:417+i}),[sg*(w/2+3.5),0,hh+10],'x',sg),'#3a2616',sm,417+i,RG));M(g,x,y,box(4,4,6,[w*.2,-d*.1,hh+8]),'#8a8f98',sm,419,RG)},
  stabbur(g,x,y,sm,o){o=o||{};const w=16,d=14;soft(g,x,y,12);[[-1,-1],[1,-1],[-1,1],[1,1]].forEach((q,i)=>M(g,x,y,lathe({n:6,at:[q[0]*(w/2-2),q[1]*(d/2-2),0],r:[1.8,1.8],h:8,top:.9,seed:421+i}),'#5a3e28',sm,421+i,RG));
   M(g,x,y,box(w+2,d+2,1.6,[0,0,8]),'#4a3220',sm,425,RG);M(g,x,y,box(w,d,11,[0,0,9.6]),o.wall||'#7a5a3a',sm,426,RG);M(g,x,y,box(5,1.4,7,[-2,d/2+.2,9.6]),'#3a2616',0,427,{crease:0,paint:false});
   M(g,x,y,gable({at:[0,0,20.6],w:w+2,d:d+2,h:9,ov:2.4}),o.roof||'#e4edf3',sm,428,RG);M(g,x,y,box(w+8,1.4,1.4,[0,0,29.8]),'#3a2616',0,429,{crease:0,paint:false})},
  salon(g,x,y,sm,o){o=o||{};const W=o.wall||'#5a3e28',rf=o.roof||'#3a3330',sn=o.snow||'#e4edf3';soft(g,x,y,34);M(g,x,y,box(40,28,14,[0,0,0]),W,sm,431,RG);
   [-12,0,12].forEach((px,i)=>M(g,x,y,box(1.4,1.6,14,[px,14.2,0]),'#2e2014',0,432+i,{crease:0,paint:false,ij:.2}));M(g,x,y,box(8,1.6,10,[-6,14.2,0]),'#241810',0,436,{crease:0,paint:false});
   M(g,x,y,gable({at:[0,0,14],w:44,d:32,h:6,ov:3}),rf,sm,437,RG);M(g,x,y,box(26,18,10,[0,0,19.5]),W,sm,438,RG);M(g,x,y,gable({at:[0,0,29.5],w:30,d:22,h:7,ov:2.4}),rf,sm,439,RG);
   M(g,x,y,box(14,10,8,[0,0,35]),W,sm,440,RG);M(g,x,y,gable({at:[0,0,43],w:17,d:13,h:9,ov:2}),sn,sm,441,RG);M(g,x,y,cone({at:[0,0,52],r:[1.4,1.4],h:9,n:4,amp:0,seed:442}),'#2e2014',sm,442,RG);
   [-1,1].forEach((sg,i)=>[[20.5,25.5],[16,36]].forEach((q,j)=>M(g,x,y,tilt(cone({at:[0,0,0],r:[1,1],h:5,n:4,amp:0,seed:443+i*2+j}),[sg*q[0],0,q[1]],'x',sg),'#2e2014',sm,443+i*2+j,RG)))},
  runestone(g,x,y,sm){soft(g,x,y,8);M(g,x,y,lathe({n:6,at:[0,0,0],r:[4.4,3],h:19,top:.62,seed:451}),'#8a8f98',sm,451,RG);[5,9,13].forEach((z,i)=>M(g,x,y,box(1.2,4+(i%2)*2,1.2,[4,0,z]),'#c0392b',0,452+i,{crease:0,paint:false,ij:.3}))},
  rack(g,x,y,sm){soft(g,x,y,12);[-9,9].forEach((px,i)=>M(g,x,y,box(1.8,1.8,18,[px,0,0]),'#5a3e28',sm,461+i,RG));M(g,x,y,box(22,1.4,1.4,[0,0,16]),'#7a5a3a',sm,463,RG);M(g,x,y,box(22,1.4,1.4,[0,0,9]),'#7a5a3a',sm,464,RG);
   for(let i=0;i<5;i++)M(g,x,y,box(2,.8,5,[-8+i*4,.8,10.5+(i%2)*6]),i%2?'#b8c6d2':'#d6a566',0,465+i,{crease:0,paint:false,ij:.3})},
  // ── Pantano (F3-C): palafitos de bayou / sudeste asiático ──
  palafito(g,x,y,sm,o){o=o||{};const w=o.w||30,d=o.d||22,hh=o.h||10,Z=12,W=o.wall||'#b8996a',rf=o.roof||'#c9b36a';soft(g,x,y,Math.max(w,d)*.8);
   [-1,0,1].forEach(a=>[-1,1].forEach(b=>M(g,x,y,lathe({n:6,at:[a*(w/2-2),b*(d/2-2),0],r:[1.7,1.7],h:Z,top:.9,seed:500+a*3+b+4}),'#5a4028',sm,500+a*3+b+4,RG)));
   M(g,x,y,box(w-4,1,1.2,[0,d/2-2,4.5]),'#6a4a30',0,510,{crease:0,paint:false});
   M(g,x,y,box(w+5,d+5,1.8,[0,0,Z]),'#8a6a42',sm,511,RG);
   [[d/2+9.4,Z-3.4],[d/2+11.4,Z-6.8],[d/2+13.4,Z-10.2]].forEach((q,i)=>M(g,x,y,box(6,2.2,1.2,[-w/6,q[0],q[1]]),'#7a5a36',0,512+i,{crease:0,paint:false,ij:.3}));
   M(g,x,y,box(w*.62,6.5,1.6,[-w*.12,d/2+5.4,Z]),'#9a7a4a',sm,516,RG);
   M(g,x,y,box(w,d,hh,[0,0,Z+1.8]),W,sm,517,RG);
   M(g,x,y,box(6.4,1.4,8.4,[-w/6,d/2,Z+1.8]),'#4a3020',0,518,{crease:0,paint:false});
   [-1,1].forEach((sg,i)=>{M(g,x,y,box(1.4,5.4,4.8,[w/2,sg*d*.22,Z+5.4]),'#6f9a8c',0,519+i,{crease:0,paint:false,ij:.3});M(g,x,y,box(1.7,1.4,5.4,[w/2,sg*d*.22-3.6,Z+5.2]),'#6a4a30',0,521+i,{crease:0,paint:false})});
   M(g,x,y,gable({at:[0,0,Z+1.8+hh],w:w+2,d:d+2,h:o.rh||13,ov:3.4}),rf,sm,523,RG);M(g,x,y,box(w+9,1.6,1.4,[0,0,Z+1.8+hh+13]),'#8a6a3a',0,524,{crease:0,paint:false});
   M(g,x,y,box(2.4,2.4,3.2,[w*.28,d/2+7.4,Z+7]),'#ffb84a',0,525,{crease:0,paint:false,ij:.3})},
  barca(g,x,y,sm){soft(g,x,y,18);M(g,x,y,lathe({n:8,rot:Math.PI/8,at:[0,0,0],r:[5.8,15],h:5,top:1.18,seed:531}),'#7a5434',sm,531,RG);M(g,x,y,box(9,2,1,[0,0,5]),'#9a7040',0,532,{crease:0,paint:false});M(g,x,y,box(.9,24,.9,[3.4,0,5.6]),'#5a3e28',0,533,{crease:0,paint:false})},
  red(g,x,y,sm){soft(g,x,y,12);[-1,1].forEach((sg,i)=>M(g,x,y,lathe({n:5,at:[sg*10,0,0],r:[1.3,1.3],h:24,top:.8,seed:541+i}),'#6a4a30',sm,541+i,RG));
   M(g,x,y,box(20,.8,13,[0,0,9]),'#d6cfa4',0,543,{crease:0,paint:false,ij:.4});[[-6,'#c0392b'],[0,'#e0b83a'],[6,'#c0392b']].forEach((q,i)=>M(g,x,y,blob({at:[q[0],0,22],r:[1.5,1.5,1.5],amp:.1,seed:544+i}),q[1],0,544+i,{paint:false}))},
  junco(g,x,y,sm){soft(g,x,y,8);[[-4,1,20],[0,-2,26],[4,2,22],[1,3,17]].forEach((q,i)=>{M(g,x,y,lathe({n:4,at:[q[0],q[1],0],r:[.8,.8],h:q[2],top:.7,seed:551+i}),'#6b8a3a',0,551+i,{crease:0,paint:false,ij:.3});if(i<3)M(g,x,y,lathe({n:5,at:[q[0],q[1],q[2]-5],r:[1.7,1.7],h:6,top:.8,seed:556+i}),'#6a4a2a',sm,556+i,RG)})},
  // ── Oriental (F3-C2): arquitectura japonesa/china ──
  casaJp(g,x,y,sm,o){o=o||{};const w=o.w||32,d=o.d||24,hh=o.h||14,W=o.wall||'#efe6d0',rf=o.roof||'#3e4250',R='#9a2e26';soft(g,x,y,Math.max(w,d)*.8);
   M(g,x,y,box(w+3,d+3,2,[0,0,0]),'#8a8a90',sm,601,RG);M(g,x,y,box(w,d,hh,[0,0,2]),W,sm,602,RG);
   [[-1,-1],[1,-1],[-1,1],[1,1]].forEach((q,i)=>M(g,x,y,box(2.2,2.2,hh,[q[0]*w/2,q[1]*d/2,2]),R,0,603+i,{crease:0,paint:false}));
   M(g,x,y,box(w+1,1.6,1.5,[0,d/2,2+hh-1.6]),R,0,607,{crease:0,paint:false});M(g,x,y,box(1.6,d+1,1.5,[w/2,0,2+hh-1.6]),R,0,608,{crease:0,paint:false});
   M(g,x,y,box(9,1.4,8.4,[-w/6,d/2,2]),'#c9b27a',0,609,{crease:0,paint:false});M(g,x,y,box(9.8,1.6,1,[-w/6,d/2,10.4]),R,0,610,{crease:0,paint:false});
   [-1,1].forEach((sg,i)=>{M(g,x,y,box(1.4,6.2,5.8,[w/2,sg*d*.22,5.4]),'#f6f0d8',0,611+i,{crease:0,paint:false,ij:.3});M(g,x,y,box(1.7,.9,6,[w/2,sg*d*.22,5.3]),R,0,613+i,{crease:0,paint:false})});
   M(g,x,y,box(w+5,d+5,1.5,[0,0,2+hh-1.2]),'#2e3240',sm,615,RG);
   M(g,x,y,hip({at:[0,0,2+hh+.3],w:w+1,d:d+1,h:o.rh||9,ov:2.4}),rf,sm,616,RG);
   [-1,1].forEach((sg,i)=>M(g,x,y,cone({at:[sg*2,0,2+hh+(o.rh||9)],r:[1.4,1.4],h:3.6,n:4,amp:0,seed:617+i}),'#e0b040',0,617+i,{crease:0,paint:false}))},
  pagoda(g,x,y,sm){soft(g,x,y,26);M(g,x,y,box(30,30,2.4,[0,0,0]),'#8a8a90',sm,621,RG);let z=2.4;
   [[22,9,34,6],[16,8,26,5.5],[10,7,18,5]].forEach(([b,bh,rw,rh],i)=>{M(g,x,y,box(b,b,bh,[0,0,z]),i%2?'#efe6d0':'#b8302a',sm,622+i*3,RG);
    [-1,1].forEach((sg,j)=>M(g,x,y,box(1.4,b*.4,bh*.55,[b/2,sg*b*.22,z+bh*.25]),'#3e2a22',0,623+i*3+j*9,{crease:0,paint:false}));
    M(g,x,y,box(rw*.78,rw*.78,1.3,[0,0,z+bh-.6]),'#7a2a22',sm,640+i,RG);z+=bh;M(g,x,y,hip({at:[0,0,z],w:rw,d:rw,h:rh,ov:2.6}),'#3e4250',sm,650+i,RG);z+=rh-1.2});
   M(g,x,y,lathe({n:6,at:[0,0,z],r:[.9,.9],h:11,top:.5,seed:660}),'#e0b040',0,660,{crease:0,paint:false});M(g,x,y,blob({at:[0,0,z+5],r:[2.4,2.4,1.5],amp:.05,seed:661}),'#e0b040',0,661,{paint:false})},
  torii(g,x,y,sm,o){o=o||{};soft(g,x,y,18);const R='#c8302a';[-1,1].forEach((sg,i)=>{M(g,x,y,lathe({n:6,at:[0,sg*13,0],r:[2.1,2.1],h:30,top:.9,seed:671+i}),R,sm,671+i,RG);M(g,x,y,box(5,5,1.6,[0,sg*13,0]),'#3a3430',0,673+i,{crease:0,paint:false})});
   M(g,x,y,box(2.2,32,2,[0,0,21]),R,sm,675,RG);M(g,x,y,box(5.4,40,2.4,[0,0,29.6]),'#2a2a30',sm,676,RG);M(g,x,y,box(4,44,1.6,[0,0,32]),R,sm,677,RG);[-1,1].forEach((sg,i)=>M(g,x,y,box(4,4,2.4,[0,sg*21,33.2]),R,0,678+i,{crease:0,paint:false}))},
  linterna(g,x,y,sm){soft(g,x,y,8);M(g,x,y,box(7,7,2,[0,0,0]),'#9a958d',sm,681,RG);M(g,x,y,lathe({n:6,at:[0,0,2],r:[1.6,1.6],h:9,top:.9,seed:682}),'#a8a39a',sm,682,RG);
   M(g,x,y,box(8,8,1.6,[0,0,11]),'#9a958d',sm,683,RG);M(g,x,y,box(5.4,5.4,5,[0,0,12.6]),'#ffd98a',0,684,{crease:0,paint:false,ij:.3});M(g,x,y,hip({at:[0,0,17.6],w:8,d:8,h:4,ov:1.4}),'#7a766e',sm,685,RG);M(g,x,y,blob({at:[0,0,22.3],r:[1.2,1.2,1.2],amp:.05,seed:686}),'#9a958d',0,686,{paint:false})},
  cerezo(g,x,y,sm){soft(g,x,y,18);M(g,x,y,lathe({n:6,at:[0,0,0],r:[3.4,3.4],h:20,top:.78,seed:691}),'#6a4a40',sm,691,RG);
   [[0,2,32,18,12,'#f6b3c8'],[-6,-2,40,12,9,'#f9c8d6'],[7,3,36,12,9,'#f2a6bd']].forEach((l,i)=>M(g,x,y,blob({at:at(l[0],l[1],l[2]),r:[l[3],l[3],l[4]],amp:.16,seed:692+i}),l[5],sm,692+i))},
  bambu(g,x,y,sm){soft(g,x,y,10);[[-5,1,30],[0,-3,38],[5,2,33],[1,4,26],[-2,-1,34]].forEach((q,i)=>{M(g,x,y,lathe({n:5,at:[q[0],q[1],0],r:[1.2,1.2],h:q[2],top:.8,seed:701+i}),i%2?'#8ec45a':'#7ab84c',0,701+i,{crease:0,paint:false,ij:.3});M(g,x,y,blob({at:[q[0],q[1],q[2]-3],r:[3.6,3.6,2.2],amp:.2,flat:true,seed:710+i}),'#5f9a3e',sm,710+i)})},
  // ── Volcán (F3-C): arquitectura mesoamericana de basalto con vetas de lava ──
  templo(g,x,y,sm,o){o=o||{};soft(g,x,y,30);const B='#4a4044',L='#6a5a58',V='#ff7a2a';let z=0;const T=[[38,6],[30,6],[22,6]];
   T.forEach(([b,h],i)=>{M(g,x,y,box(b,b,h,[0,0,z]),i%2?L:B,sm,801+i,RG);M(g,x,y,box(.7,b*.7,1.2,[b/2+.05,0,z+h*.5]),V,0,805+i,{crease:0,paint:false,ij:.3});M(g,x,y,box(b*.7,.7,1.2,[0,b/2+.05,z+h*.5]),V,0,809+i,{crease:0,paint:false,ij:.3});z+=h});
   for(let i=0;i<3;i++)M(g,x,y,box(9,4.4,6*(i+1)-1.6*i*0,[0,38/2+3.2-i*8-1,0]),'#7a6a66',sm,815+i,RG); // escalinata (cada peldaño llega hasta su terraza)
   M(g,x,y,box(14,12,9,[0,0,z]),'#3a3034',sm,820,RG);M(g,x,y,box(7,1.4,6.4,[0,6.1,z]),'#1a1418',0,821,{crease:0,paint:false});M(g,x,y,box(9,1.8,1.4,[0,6.3,z+6.4]),V,0,822,{crease:0,paint:false});
   M(g,x,y,box(18,16,2.4,[0,0,z+9]),'#4a4044',sm,823,RG);M(g,x,y,box(12,2.6,5,[0,0,z+11.4]),'#6a5a58',sm,824,RG);
   [[-1,-1],[1,-1],[-1,1],[1,1]].forEach((q,i)=>{M(g,x,y,lathe({n:6,at:[q[0]*17,q[1]*17,6],r:[2.6,2.6],h:3.4,top:1.25,seed:830+i}),'#2e2628',sm,830+i,RG);M(g,x,y,blob({at:[q[0]*17,q[1]*17,10],r:[2.4,2.4,1],amp:.1,flat:true,seed:834+i}),'#ff8a2a',0,834+i,{paint:false})})},
  casaMaya(g,x,y,sm,o){o=o||{};const w=o.w||30,d=o.d||22,hh=o.h||11,W=o.wall||'#6a5a58',rf=o.roof||'#7a6a42';soft(g,x,y,Math.max(w,d)*.8);
   M(g,x,y,box(w+2,d+2,2,[0,0,0]),'#3a3034',sm,841,RG);M(g,x,y,box(w,d,hh,[0,0,2]),W,sm,842,RG);M(g,x,y,box(w+.5,d+.5,1.6,[0,0,2+hh*.55]),'#d8501a',0,843,{crease:0,paint:false,ij:.3});
   [-1,1].forEach((sg,i)=>[0,1,2].forEach(k=>M(g,x,y,box(.8,1.6,1.6,[w/2+.3,sg*d*.2+(k-1)*2.4,2+hh*.8]),'#ffb040',0,850+i*3+k,{crease:0,paint:false})));
   M(g,x,y,box(7.4,1.4,8.4,[-w/6,d/2,2]),'#2a2226',0,844,{crease:0,paint:false});M(g,x,y,box(9,1.6,1.4,[-w/6,d/2,10.4]),'#c8421a',0,845,{crease:0,paint:false});
   M(g,x,y,box(1.4,4,5,[w/2,0,6]),'#2a2226',0,846,{crease:0,paint:false});
   M(g,x,y,hip({at:[0,0,2+hh],w:w+2,d:d+2,h:o.rh||10,ov:2.8}),rf,sm,847,RG);M(g,x,y,box(w*.4,1.4,1.2,[0,0,2+hh+(o.rh||10)-.2]),'#5a4a30',0,848,{crease:0,paint:false})},
  estela(g,x,y,sm){soft(g,x,y,10);M(g,x,y,box(9,9,2.4,[0,0,0]),'#3a3034',sm,861,RG);M(g,x,y,box(6.4,4.6,26,[0,0,2.4]),'#4a4044',sm,862,RG);
   [-1,1].forEach((sg,i)=>M(g,x,y,box(.8,1.6,2,[3.3,sg*1.3,21]),'#ffb040',0,863+i,{crease:0,paint:false}));M(g,x,y,box(.8,3.4,1,[3.3,0,16.6]),'#ff7a2a',0,865,{crease:0,paint:false});M(g,x,y,box(.8,4.4,1.4,[3.3,0,11]),'#ff7a2a',0,866,{crease:0,paint:false});
   M(g,x,y,hip({at:[0,0,28.4],w:7,d:5.2,h:4.4,ov:1.2}),'#2e2628',sm,867,RG)},
  vasija(g,x,y,sm){soft(g,x,y,7);M(g,x,y,lathe({n:8,rot:Math.PI/8,at:[0,0,0],r:[4.4,4.4],h:9,top:.8,seed:871}),'#c8602a',sm,871,RG);M(g,x,y,lathe({n:8,rot:Math.PI/8,at:[0,0,9],r:[3.4,3.4],h:3,top:.85,seed:872}),'#c8602a',sm,872,RG);M(g,x,y,box(9,9,1.2,[0,0,5]),'#f0c070',0,873,{crease:0,paint:false,ij:.4})},
  obsidiana(g,x,y,sm){soft(g,x,y,10);[[0,0,24,3],[-5,2,16,2.4],[5,-2,18,2.6],[2,5,12,2]].forEach((q,i)=>M(g,x,y,cone({at:[q[0],q[1],0],r:[q[3],q[3]],h:q[2],n:4,amp:0,seed:881+i}),i%2?'#2a2236':'#3a2e4c',sm,881+i,RG))},
  brasero(g,x,y,sm){soft(g,x,y,8);M(g,x,y,lathe({n:6,at:[0,0,0],r:[1.6,1.6],h:14,top:.8,seed:471}),'#4a4440',sm,471,RG);M(g,x,y,lathe({n:7,at:[0,0,14],r:[5,5],h:4,top:1.25,seed:472}),'#3a3430',sm,472,RG);M(g,x,y,blob({at:[0,0,18],r:[4,4,1.6],amp:.1,flat:true,seed:473}),'#ff8a2a',0,473,{paint:false,ij:.3})},
  cofre(g,x,y,sm){soft(g,x,y,16);const W='#b9803f',WL='#cf9d55',IR='#59525c';M(g,x,y,box(16,11,6,[0,0,0]),W,sm,71,RG);   // cuerpo + tapa escalonada (bisel) con flejes finos de hierro y cerradura dorada
   M(g,x,y,box(16.8,11.8,3.4,[0,0,6]),'#c28d48',sm,72,RG);M(g,x,y,box(14.2,9.8,1.5,[0,0,9.4]),WL,sm,74,RG);
   [-4.8,4.8].forEach((px,i)=>{M(g,x,y,box(1.4,12.4,.7,[px,0,10.6]),IR,0,76+i,{crease:0,paint:false,ij:.25});M(g,x,y,box(1.4,.8,10.8,[px,6.1,0]),IR,0,78+i,{crease:0,paint:false,ij:.25})});
   M(g,x,y,box(1.2,3.6,4.2,[8.5,0,4.6]),'#f1c24a',0,75,{crease:0,paint:false,ij:.3})},
  yunque(g,x,y,sm,o){o=o||{};const a=o.arch||0;soft(g,x,y,18);
   if(a===1||a===2||a===3)M(g,x,y,lathe({n:7,at:[0,0,0],r:[7,6],h:9,top:.94,seed:79}),a===3?'#5a3e28':a===2?'#a8884e':'#8a6a44',sm,79,RG),M(g,x,y,box(8,6,1,[0,0,9]),'#6e7380',sm,82,RG);
   else if(a===4){M(g,x,y,box(14,10,3,[0,0,0]),'#3a2a2a',sm,81,RG);M(g,x,y,box(10,7,7,[0,0,3]),'#9a2e2e',sm,82,RG)}
   else if(a===5){M(g,x,y,box(14,10,5,[0,0,0]),'#3a3034',sm,81,RG);M(g,x,y,box(8,6,5,[0,0,5]),'#4a4044',sm,82,RG)}
   else{M(g,x,y,box(14,10,5,[0,0,0]),'#7d8290',sm,81,RG);M(g,x,y,box(8,6,5,[0,0,5]),'#6e7380',sm,82,RG)}
   M(g,x,y,box(18,8,5,[0,0,10]),a===5?'#8a8f98':'#a3a9b6',sm,83,RG);
   M(g,x,y,tilt(cone({at:[0,0,0],r:[2.6,3.4],h:8,n:4,amp:0,seed:4}),[9,0,12.5],'x',1),a===5?'#8a8f98':'#a3a9b6',sm,84,RG)},
  // lote C1b-1: Armero (Herrería): maniquí de armadura de placa sobre tarima, con yelmo, peto, hombreras y escudo apoyado; `arch` cambia el metal por bioma. Todo a escala K para que se lea junto al yunque.
  armero(g,x,y,sm,o){o=o||{};const a=o.arch||0,K=1.45,MT=['#b4bac8','#a8b8a8','#bcb4a0','#c4ccdc','#c8b8a8','#7a7480'][a]||'#b4bac8',MD2=STY.mix(MT,'#000000',.28),WD2=['#7a5a34','#6a5030','#5a4a30','#7a6a52','#8a2e22','#3a3034'][a]||'#7a5a34',
    bx=(w,d,h,p)=>box(w*K,d*K,h*K,p.map(v=>v*K)),bl=(at,r,seed)=>blob({at:at.map(v=>v*K),r:r.map(v=>v*K),amp:.04,seed});soft(g,x,y,26);
   M(g,x,y,bx(22,13,2.4,[0,0,0]),WD2,sm,170,RG);                                    // tarima
   M(g,x,y,lathe({n:6,at:[0,0,2.4*K],r:[2.2*K,1.8*K],h:14*K,top:1,seed:171}),WD2,sm,171,RG);  // poste
   M(g,x,y,bx(13,7.4,11,[0,0,10]),MT,sm,172,RG);                                    // peto
   M(g,x,y,bx(13.6,8,1.6,[0,0,15]),MD2,0,173,{crease:0,paint:false,ij:.25});          // faja del peto
   [-1,1].forEach((sg,i)=>M(g,x,y,bl([0,sg*8,19.5],[3.6,3.2,2.6],174+i),MT,sm,174+i,RG));   // hombreras
   M(g,x,y,bl([0,0,26.5],[4.2,4,4.2],176),MT,sm,176,RG);                             // yelmo
   M(g,x,y,bx(1.2,5.6,1.1,[3.9,0,26.2]),'#2a2c34',0,177,{crease:0,paint:false,ij:.2}); // visera
   M(g,x,y,cone({at:[0,0,30*K],r:[.9*K,1.6*K],h:4*K,n:4,amp:0,seed:178}),'#d0453a',sm,178,RG);   // penacho
   M(g,x,y,bx(2.2,9,12,[-8.6,6.2,2.4]),MD2,sm,179,RG);M(g,x,y,bx(2.6,6,7,[-8.9,6.2,5]),'#e0b84a',0,180,{crease:0,paint:false,ij:.25})}, // escudo apoyado con emblema
  // lote C1b-1: Banco de curtidor (Taller): bastidor con una piel tensada, tina de curtido y cuchilla. Escala K.
  curtidor(g,x,y,sm,o){o=o||{};const a=o.arch||0,K=1.5,WD2=['#5a3c22','#4e3a22','#473a26','#5e5040','#6a2820','#2e2628'][a]||'#5a3c22',bx=(w,d,h,p)=>box(w*K,d*K,h*K,p.map(v=>v*K));soft(g,x,y,26);
   [-1,1].forEach((sg,i)=>M(g,x,y,bx(2,2,22,[-3,sg*8,0]),WD2,sm,190+i,RG));          // postes
   M(g,x,y,bx(2,18,2,[-3,-9,22]),WD2,sm,192,RG);M(g,x,y,bx(2,18,2,[-3,-9,6]),WD2,sm,193,RG);   // travesaños
   M(g,x,y,bx(.9,13,15,[-2,-6.5,7.5]),'#c98a4a',sm,194,RG);                          // piel tensada
   M(g,x,y,bx(.7,9,10,[-1.6,-4.5,9.8]),'#e0a868',0,195,{crease:0,paint:false,ij:.3});
   M(g,x,y,lathe({n:7,at:[8*K,-6*K,0],r:[4.6*K,4.2*K],h:7*K,top:.9,seed:196}),'#6a4a2a',sm,196,RG); M(g,x,y,lathe({n:7,at:[8*K,-6*K,6.2*K],r:[3.6*K,3.6*K],h:.9*K,top:1,seed:197}),'#2a1e18',0,197,{crease:0,paint:false,ij:.2}); // tina
   M(g,x,y,bx(7,2.4,1,[3,6.5,0]),WD2,sm,198,RG);M(g,x,y,bx(5,.9,.5,[3.5,6.5,1]),'#c4ccd8',0,199,{crease:0,paint:false,ij:.3})}, // cuchilla
  slime(g,x,y,sm){soft(g,x,y,20);const gm=.8,body='#7fd08a',core='#4faa72';
   M(g,x,y,blob({at:at(2,2,.6),r:[19,19,.8],amp:.12,seed:100}),STY.mix(body,'#ffffff',.3),0,100,{paint:false,ij:.6});   // charco plano bajo el cuerpo
   M(g,x,y,blob({at:at(1,1,8),r:[10,10,7],amp:.1,seed:93}),core,gm,93);                                   // núcleo oscuro visible por transparencia
   g.save();g.globalAlpha=.84;M(g,x,y,blob({at:at(0,0,10),r:[17,17,11],amp:.07,det:1,flat:true,seed:91}),body,gm,91);g.restore(); // cuerpo gelatinoso translúcido, degradado por vértice
   M(g,x,y,blob({at:at(-5,-3,17),r:[3.6,2.6,1.8],amp:.1,seed:94}),'#ffffff',0,94,{paint:false,ink:false,crease:0});    // brillo
   [-1,1].forEach((sg,i)=>{M(g,x,y,blob({at:[15.8,sg*4.6,11.5],r:[1.4,1.9,2.6],amp:0,seed:95+i}),'#2c2224',0,95+i,{paint:false,ink:false});M(g,x,y,blob({at:[16.8,sg*4.6-.4,12.6],r:[.6,.7,.9],amp:0,seed:97+i}),'#ffffff',0,97+i,{paint:false,ink:false})});
   M(g,x,y,blob({at:[16.2,0,7.2],r:[1,2.2,.8],amp:0,seed:99}),'#2c2224',0,99,{paint:false,ink:false});         // boca
   },
  vaca:A.vaca,
  goblin:(g,x,y,sm,o)=>human2d(g,x,y,sm,Object.assign({},PEOPLE.goblin,o||{})),
  aldeano:(g,x,y,sm,o)=>human2d(g,x,y,sm,o),
  heroe:(g,x,y,sm,o)=>hero2d(g,x,y,sm,o),
  personaje:(g,x,y,sm,build,tier,o)=>human2d(g,x,y,sm,Object.assign({build:build||'esbelto',col:TIER[tier||'bronce'],pants:'#5a4a6a',hair:'#5a3a22',cuff:TIER[tier||'bronce'],belt:'#6a4a2a',collar:STY.mix(TIER[tier||'bronce'],'#ffffff',.3)},o||{}))
 };
 const KSC={roble:1.15,abedul:1.15,sauce:1.15,pino:1.2,arce:1.15,fresno:1.15,ebano:1.15,tejo:1.15,caoba:1.2,baobab:1.2,mundo:1.25,piedra:1.2,arbusto:1.25,casa:2.3,casaLarga:1.7,stabbur:1.9,salon:1.6,runestone:1.9,rack:1.8,brasero:1.7,troncos:2.3,casaArbol:1.9,lenera:2.1,tocon:1.8,seta:1.8,banco:1.5,tienda:1.5,fogata:1.6,horno:1.6,taller:1.7,escritorio:1.7,taberna:2.15,granero:2.05,cabana:2.3,heno:2.1,pozo:2.1,farola:1.7,valla:1.7,barril:1.8,caja:1.8,cofre:1.7,yunque:1.7,slime:1.3,vaca:1.25,goblin:1.9,aldeano:.7,personaje:.7,palafito:2.3,casaJp:2.1,templo:1.5,casaMaya:2.1,estela:1.6,vasija:1.6,obsidiana:1.5,pagoda:1.5,torii:1.7,linterna:1.7,cerezo:1.3,bambu:1.5,barca:1.8,red:1.9,junco:1.8,roca:1.1,mena:1.35,heroe:.7,portonOrco:1.6,empalizada:1.5};
 // ── decoración con sentido por instalación (oct 2026): herrería, taller, escritorio y cocina. Mismas reglas que el resto: cajas/prismas pintados + contorno. Unidades de modelo (× KSC = px de mundo) ──
 const BK=['#8a3a3a','#3a5a8a','#4a7a4a','#c9a040','#6a3a7a','#3a7a7a'];
 Object.assign(U,{
  banca(g,x,y,sm,o){o=o||{};const L=o.len||20;soft(g,x,y,L*.55);[-L*.38,L*.38].forEach((px,i)=>M(g,x,y,box(2.2,5,5,[px,0,0]),'#6e4a2a',sm,1101+i,RG));M(g,x,y,box(L,5.6,1.8,[0,0,5]),'#b9803f',sm,1103,RG);if(o.back)M(g,x,y,box(L,1.2,4.4,[0,-2.4,6.8]),'#9a6a3a',sm,1104,RG)},
  pilaTroncos(g,x,y,sm){soft(g,x,y,13);const row=[[-4.6,2.3],[0,2.3],[4.6,2.3],[-2.3,6.3],[2.3,6.3],[0,10.3]];
   row.forEach((q,i)=>M(g,x,y,tilt(lathe({n:6,at:[0,0,0],r:[2.3,2.3],h:18,top:1,seed:1110+i}),[-9,q[0],q[1]],'x'),i%2?'#9a6a3a':'#a8784a',sm,1110+i,RG));
   row.forEach((q,i)=>M(g,x,y,box(.5,3.4,3.4,[9.2,q[0],q[1]-1.7]),'#d6a566',0,1120+i,{crease:0,paint:false,ij:.2}))},
  tablones(g,x,y,sm){soft(g,x,y,12);[0,1,2,3].forEach(i=>M(g,x,y,box(22-(i%2)*1.5,9,1.8,[(i%2)*1.2-.6,0,i*1.8]),i%2?'#c99556':'#d6a566',sm,1130+i,RG));M(g,x,y,box(1.2,9.6,7.6,[4,0,0]),'#8a6a3a',0,1135,{crease:0,paint:false,ij:.2})},
  caballete(g,x,y,sm){soft(g,x,y,13);[-7,7].forEach((px,i)=>M(g,x,y,box(1.8,9,8,[px,0,0]),'#6e4a2a',sm,1140+i,RG));M(g,x,y,box(20,2.4,2,[0,0,7.6]),'#8f5f2c',sm,1142,RG);M(g,x,y,box(18,6,1.4,[1,0,9.6]),'#d6a566',sm,1143,RG);
   M(g,x,y,box(9,.6,3.4,[4,3.4,11.2]),'#b8c6d2',0,1145,{crease:0,paint:false,ij:.3});M(g,x,y,box(2.4,.8,2.4,[9,3.4,11.2]),'#6e4a2a',0,1146,{crease:0,paint:false})},
  tinaja(g,x,y,sm){soft(g,x,y,14);M(g,x,y,box(24,10,8,[0,0,0]),'#7a5230',sm,1150,RG);M(g,x,y,box(21,7,.8,[0,0,7.4]),'#4f8fbf',0,1151,{crease:0,paint:false,ij:.3});[-8,0,8].forEach((px,i)=>M(g,x,y,box(1.4,10.4,8.2,[px,0,0]),'#4a3220',0,1152+i,{crease:0,paint:false,ij:.2}))},
  carbon(g,x,y,sm){soft(g,x,y,12);[[0,0,4,9,8,6,'#2e2a28'],[-7,3,2,6,5,3.4,'#3a3430'],[6,3,2,6,5,3.4,'#241f1e'],[2,-5,1.6,5,4,3,'#3a3430']].forEach((q,i)=>M(g,x,y,blob({at:[q[0],q[1],q[2]],r:[q[3],q[4],q[5]],amp:.2,flat:true,seed:1160+i}),q[6],sm,1160+i));
   M(g,x,y,blob({at:[1,1,9],r:[2,1.6,1],amp:.1,seed:1165}),'#c8501a',0,1165,{paint:false,ij:.3})},
  lingotes(g,x,y,sm,o){o=o||{};const C=o.col||'#a3a9b6';soft(g,x,y,10);[[-5,0],[0,0],[5,0],[-2.5,2.2],[2.5,2.2],[0,4.4]].forEach((q,i)=>M(g,x,y,box(4.6,8,2,[q[0],0,q[1]]),i%2?STY.mix(C,'#ffffff',.2):C,sm,1170+i,RG))},
  muela(g,x,y,sm){soft(g,x,y,10);[-5,5].forEach((px,i)=>M(g,x,y,box(1.8,8,9,[px,0,0]),'#6e4a2a',sm,1180+i,RG));M(g,x,y,tilt(lathe({n:10,at:[0,0,0],r:[6,6],h:3,top:1,seed:1182}),[0,-1.5,9],'y'),'#a29d93',sm,1182,RG);M(g,x,y,box(12,1.2,1.2,[0,0,9]),'#4a3220',0,1183,{crease:0,paint:false});M(g,x,y,box(1.2,1.2,5,[6.4,2,9]),'#8a8f98',0,1184,{crease:0,paint:false})},
  // herrería: esquina de dos muros (zócalo de piedra + tablas) con tejado a cuatro aguas y chimenea. El ancla es la ESQUINA TRASERA: horno y yunque quedan dentro, delante, y el prop se ordena detrás de ellos
  herreria(g,x,y,sm){const S=40,WH=14,PH=26;soft(g,x,y,28);
   M(g,x,y,box(S,3,WH,[S/2,1.5,0]),'#8d8f96',sm,1190,RG);M(g,x,y,box(3,S,WH,[1.5,S/2,0]),'#7d7f86',sm,1191,RG);
   M(g,x,y,box(S,2.4,PH-WH,[S/2,1.2,WH]),'#9a6a3a',sm,1192,RG);M(g,x,y,box(2.4,S,PH-WH,[1.2,S/2,WH]),'#8f5f2c',sm,1193,RG);
   [[10,10,8],[16,8,9.5],[24,9,8.4]].forEach((t,i)=>{M(g,x,y,box(.9,.8,t[2],[t[0],3.4,t[1]]),'#5a5c64',0,1194+i,{crease:0,paint:false,ij:.3})});M(g,x,y,box(4.2,.9,2.2,[10,3.4,18]),'#6e7380',0,1197,{crease:0,paint:false,ij:.3});
   M(g,x,y,box(2.6,16,1,[4.2,26,11]),'#6e4a2a',0,1198,{crease:0,paint:false});[[19,'#c8742a'],[24,'#a3a9b6'],[29,'#e0b83a']].forEach((q,i)=>M(g,x,y,box(2.2,3.6,2.2,[4.4,q[0],12]),q[1],0,1199+i,{crease:0,paint:false,ij:.3}));
   [[S,0],[0,S]].forEach((p,i)=>M(g,x,y,box(2.6,2.6,PH,[p[0],p[1],0]),'#6e4a2a',sm,1203+i,RG));
   M(g,x,y,hip({at:[S/2,S/2,PH],w:S,d:S,h:12,ov:3}),'#7a4a30',sm,1205,RG);M(g,x,y,box(6,6,12,[10,10,PH+5]),'#a29d93',sm,1206,RG);M(g,x,y,box(7,7,1.6,[10,10,PH+16.6]),'#6e6a62',sm,1207,RG)},
  asador(g,x,y,sm){soft(g,x,y,14);[-10,10].forEach((px,i)=>M(g,x,y,box(1.6,1.6,13,[px,0,0]),'#5a3e28',sm,1210+i,RG));M(g,x,y,box(24,1.2,1.2,[0,0,12]),'#4a4440',sm,1212,RG);M(g,x,y,blob({at:[0,0,12],r:[6.4,3.4,3.4],amp:.12,seed:1213}),'#b0583a',sm,1213);M(g,x,y,blob({at:[-1.6,.6,13],r:[3,2,1.6],amp:.1,seed:1214}),'#d6925a',0,1214,{paint:false,ij:.2});M(g,x,y,box(1.2,4,1.2,[11.5,0,12]),'#4a3220',0,1215,{crease:0,paint:false})},
  olla(g,x,y,sm){soft(g,x,y,10);[[-4,-3],[4,-3],[0,4]].forEach((q,i)=>M(g,x,y,box(1.2,1.2,15,[q[0],q[1],0]),'#5a3e28',sm,1220+i,RG));M(g,x,y,lathe({n:8,at:[0,0,3],r:[5.6,5.6],h:6,top:1.12,seed:1223}),'#3a3430',sm,1223,RG);M(g,x,y,lathe({n:8,at:[0,0,8.8],r:[4.8,4.8],h:.6,top:1,seed:1224}),'#c8742a',0,1224,{crease:0,paint:false,ij:.3})},
  secadero(g,x,y,sm){soft(g,x,y,12);[-9,9].forEach((px,i)=>M(g,x,y,box(1.8,1.8,18,[px,0,0]),'#5a3e28',sm,1230+i,RG));M(g,x,y,box(22,1.4,1.4,[0,0,16]),'#7a5a3a',sm,1232,RG);
   [-7,-2.5,2,6.5].forEach((px,i)=>{M(g,x,y,blob({at:[px,.9,11],r:[1.4,.7,3.6],amp:.1,seed:1233+i}),i%2?'#9ab8c8':'#c8d8e0',0,1233+i,{paint:false,ij:.25});M(g,x,y,box(1.4,.6,1.4,[px+.5,.9,13.4]),'#5a7a8a',0,1240+i,{crease:0,paint:false})})},
  cestaPeces(g,x,y,sm){soft(g,x,y,9);M(g,x,y,lathe({n:8,at:[0,0,0],r:[4.6,4.6],h:5,top:1.1,seed:1250}),'#b98a4a',sm,1250,RG);[[-1.6,0,5.4,'#9ab8c8'],[1.6,.8,5.8,'#c8d8e0'],[0,-1.6,6,'#7a98aa']].forEach((q,i)=>M(g,x,y,blob({at:[q[0],q[1],q[2]],r:[3.2,1.2,1.2],amp:.12,seed:1251+i}),q[3],0,1251+i,{paint:false,ij:.25}))},
  altarRezo(g,x,y,sm){soft(g,x,y,15);M(g,x,y,box(26,18,3,[0,0,0]),'#a9a49a',sm,1400,RG);M(g,x,y,box(20,13,3,[0,0,3]),'#bdb8ae',sm,1401,RG);M(g,x,y,box(15,9,9,[0,0,6]),'#cfcac0',sm,1402,RG);M(g,x,y,box(17,11,1.6,[0,0,15]),'#e9e4d8',sm,1403,RG);M(g,x,y,box(13,7,.8,[0,0,16.4]),'#c8a23a',0,1404,{crease:0,paint:false,ij:.2});
   [-5,5].forEach((px,i)=>{M(g,x,y,lathe({n:6,at:[px,0,17],r:[1.1,1.1],h:5,top:1,seed:1405+i}),'#f4efe0',sm,1405+i,RG);M(g,x,y,blob({at:[px,0,23.4],r:[.9,.9,1.5],amp:.05,seed:1407+i}),'#ffd070',0,1407+i,{paint:false,ij:.4})});
   M(g,x,y,box(1.6,1.6,10,[0,-5,19]),'#e8c040',sm,1409,RG);M(g,x,y,box(1.6,7,1.6,[0,-5,25]),'#e8c040',sm,1410,RG)},
  tablon(g,x,y,sm){soft(g,x,y,16);M(g,x,y,box(2.4,2.4,28,[0,-13,0]),'#6e4a2a',sm,1300,RG);M(g,x,y,box(2.4,2.4,28,[0,13,0]),'#6e4a2a',sm,1301,RG);M(g,x,y,box(2.2,30,17,[0,0,9]),'#8f5f2c',sm,1302,RG);
   [[-8,19,6.4,7.4,'#f4efe0'],[1,17,6,8.2,'#efe2b0'],[9,18.5,5.4,6.4,'#f6ecc8'],[-4,11.6,5.6,5.4,'#ead9a2'],[6,11,6.4,5.8,'#f4efe0']].forEach(([py,pz,w,h,c],i)=>M(g,x,y,box(.7,w,h,[1.5,py,pz-h/2+2]),c,0,1304+i,{crease:0,paint:false,ij:.25}));
   M(g,x,y,box(7,34,2.4,[0,0,27]),'#a8442e',sm,1303,RG)},
  atril(g,x,y,sm){soft(g,x,y,8);M(g,x,y,box(5,5,12,[0,0,0]),'#6e4a2a',sm,1260,RG);M(g,x,y,box(11,8,1.4,[0,0,12]),'#8f5f2c',sm,1261,RG);M(g,x,y,box(10,6,.8,[0,0,13.4]),'#8a3a3a',sm,1262,RG);M(g,x,y,box(9,5.2,.6,[0,0,14.2]),'#f4efe0',0,1263,{crease:0,paint:false,ij:.2})},
  estanteria(g,x,y,sm){soft(g,x,y,14);M(g,x,y,box(24,6,26,[0,0,0]),'#6e4a2a',sm,1270,RG);
   [0,1,2].forEach(r=>{M(g,x,y,box(21,.8,6.4,[0,3.2,2+r*8]),'#2a1c14',0,1271+r,{crease:0,paint:false});for(let k=0;k<7;k++)M(g,x,y,box(2.3,.9,5+(k%3)*.5,[-9+k*3,3.6,2+r*8]),BK[(k+r*2)%6],0,1280+r*10+k,{crease:0,paint:false,ij:.2})})},
  rollos(g,x,y,sm){soft(g,x,y,8);M(g,x,y,lathe({n:8,at:[0,0,0],r:[4.6,4.6],h:6,top:1.05,seed:1310}),'#b98a4a',sm,1310,RG);[[-1.8,-.8,'#f4efe0'],[1.2,1.2,'#e8dcb8'],[1.8,-1.6,'#f4efe0']].forEach((q,i)=>{M(g,x,y,lathe({n:6,at:[q[0],q[1],4],r:[1.2,1.2],h:8,top:1,seed:1311+i}),q[2],sm,1311+i,RG);M(g,x,y,lathe({n:6,at:[q[0],q[1],8.6],r:[1.4,1.4],h:.9,top:1,seed:1315+i}),'#a83a3a',0,1315+i,{crease:0,paint:false})})},
  candelabro(g,x,y,sm){soft(g,x,y,7);M(g,x,y,lathe({n:6,at:[0,0,0],r:[3,3],h:1.6,top:.8,seed:1320}),'#8a6a3a',sm,1320,RG);M(g,x,y,lathe({n:6,at:[0,0,0],r:[1,1],h:18,top:1,seed:1321}),'#8a6a3a',sm,1321,RG);M(g,x,y,box(9,1.4,1.4,[0,0,18]),'#8a6a3a',sm,1322,RG);
   [-4,0,4].forEach((px,i)=>{M(g,x,y,lathe({n:6,at:[px,0,18.8],r:[.9,.9],h:4.2,top:1,seed:1323+i}),'#f4efe0',sm,1323+i,RG);M(g,x,y,blob({at:[px,0,24],r:[.9,.9,1.5],amp:.05,seed:1326+i}),'#ffd070',0,1326+i,{paint:false,ij:.4})})}
 });
 Object.assign(KSC,{altarRezo:1.8,tablon:1.9,banca:1.7,pilaTroncos:1.8,tablones:1.8,caballete:1.8,tinaja:1.8,carbon:1.8,lingotes:1.8,muela:1.8,herreria:1.6,asador:1.8,olla:1.8,secadero:1.8,cestaPeces:1.8,atril:1.8,estanteria:1.8,rollos:1.8,candelabro:1.8});
 Object.keys(U).forEach(n=>{const f=U[n];U[n]=(g,x,y,sm,a,b,c)=>{KS=KSC[n]||1;try{f(g,x,y,sm,a,b,c)}finally{KS=1}}});
 // checks(): comprobaciones geométricas de «no se corta» (sin navegador). Devuelve una lista de problemas; vacía = OK.
 function checks(){const bad=[];
  for(const n in SPECIES){const sp=SPECIES[n],low=sp.L.reduce((a,l)=>l[2]-l[4]<a[2]-a[4]?l:a),c=at(low[0],low[1],low[2]);
   if(trunkH(sp)<low[2]-low[4]+3)bad.push(n+': el tronco no llega a la copa');
   if(Math.hypot(c[0],c[1])>low[3]*.7)bad.push(n+': la masa inferior no cubre el tronco');}
  const B=COW.body,f=.85;COW.legs.forEach((l,i)=>{const q=1-Math.pow(l.x/(B.rx*f),2)-Math.pow(l.y/(B.ry*f),2);if(q<=0)bad.push('vaca: pata '+i+' fuera del cuerpo');else if(COW.legH<B.z-B.rz*f*Math.sqrt(q)+2)bad.push('vaca: pata '+i+' no entra en el cuerpo')});
  return bad}
 // ORG.add(nombre, fn(g,x,y,sm,o), escala): registra un modelo nuevo desde otro archivo (src/spots.js) con las mismas utilidades que los de aquí (M = malla con tema/espejo, soft = sombra de apoyo, RG = pliegues).
 const add=(n,f,ks)=>{KSC[n]=ks||1;U[n]=(g,x,y,sm,a,b,c)=>{KS=KSC[n]||1;try{f(g,x,y,sm,a,b,c)}finally{KS=1}}};
 return{add,M:(...a)=>M(...a),soft:(...a)=>soft(...a),RG,STY_:STY,KSC,HAIRS,PEOPLE,noSoft:v=>{NOSOFT=!!v},theme:m=>{TH=m||null},rot:v=>{ROT=!!v},A,B,U,TIER,checks,COW,trunkH,SPECIES,BUILD,blob,cone,lathe,box,gable,tilt,ico,drawMesh,clump,tier,at,lit,ramp,C,KY}})();
if(typeof module!=='undefined')module.exports={ORG};
