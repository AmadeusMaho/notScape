// NotScape · F6 · ambiente y clima por bioma (AMBI). Partículas pixeladas (cuadrados de tamaño entero, como los hitsplats) que se dibujan en 3 capas:
//  'ground' → sombras de nubes y bancos de niebla (sobre el terreno, bajo las entidades); 'over' → lluvia, nieve, hojas, mariposas, pétalos, ceniza (sobre las entidades,
//  antes de la oscuridad nocturna); 'late' → luciérnagas y brasas (después de la luz: brillan en la oscuridad).
// Datos por bioma en AMBI.E[k] (una fila por emisor); un bioma nuevo = una entrada más. Nada usa Math.random para ARTE estático: es ambiente vivo y efímero (sí se permite).
// Mundo vs pantalla: mariposas, luciérnagas, hojas, pétalos, niebla y nubes viven en coordenadas de MUNDO (se quedan quietas al caminar); lluvia, nieve, brasas y ceniza, en pantalla.
// Los emisores de cada bioma solo nacen sobre terreno de ESE bioma (se elige un punto al azar de la pantalla → mundo → bioma), así el ambiente cambia de forma natural al cruzar la frontera.
const AMBI=(()=>{
 const A=[],CL=[];let RIP=[];const MAXP=520;
 const rnd=(a,b)=>a+Math.random()*(b-a),pick=l=>l[Math.floor(Math.random()*l.length)],cl=(v,a,b)=>Math.max(a,Math.min(b,v));
 // Emisor: t tipo, r tasa (partículas/s en una pantalla de 1280×800; se escala por el área), w condición ('day'|'night'|undefined), col colores.
 const E=[
  /*0 Pradera */[{t:'bf',r:.7,w:'day',col:['#ffd24a','#ff8ac8','#8ad8ff','#ffffff']},{t:'lf',r:.6,col:['#8ac85a','#b6dc6a','#d8d84a']},{t:'ff',r:1.1,w:'night',col:['#ffe870']}],
  /*1 Bosque  */[{t:'lf',r:2.2,col:['#d8802a','#8ac85a','#c8b030','#b0501e']},{t:'ff',r:1.7,w:'night',col:['#d8f070','#ffe870']},{t:'bf',r:.25,w:'day',col:['#8ad8ff','#c8a0ff']}],
  /*2 Pantano */[{t:'fog',r:.32,col:['#cfe0d0']},{t:'ff',r:1.5,w:'night',col:['#d8f060','#a0ff90']}],
  /*3 Cumbres */[{t:'sn',r:34,col:['#ffffff','#e8f2ff']}],
  /*4 Oriental*/[{t:'pt',r:5,col:['#ffc2d6','#ff9ec0','#ffe0ea']},{t:'ff',r:.9,w:'night',col:['#ffd890']}],
  /*5 Volcán  */[{t:'em',r:15,col:['#ff8a2a','#ffd070','#ff5a1a']},{t:'as',r:10,col:['#9a8a8a','#6a5a5a']},{t:'fog',r:.18,col:['#7a4a42']}]];
 // sombras de nubes (solo de día): color por bioma o null
 const CS=['#2c4a2a','#1e3a26','#3a4a30','#3a4a6a','#4a3a44',null];
 const st={k:0,day:1,wx:'',t:0};
 const px=()=>Math.max(2,Math.round(ISO.scale())),W=()=>ISO.V.cw,H=()=>ISO.V.ch;
 const bAt=q=>Math.max(0,BIOMES.at(q.x,q.y));   // q = punto de mundo {x,y}
 const toW=(sx,sy)=>ISO.toWorld(sx,sy,null);
 function spawn(e,k){const w=W(),h=H(),s=ISO.scale(),T=e.t;let p;
  if(T==='sn'){const x=rnd(-.1,1.1)*w;if(bAt(toW(x,rnd(0,h)))!==k)return;p={T,x,y:-6,vx:rnd(-14,6)*s,vy:rnd(55,95)*s,l:99,big:Math.random()<.3,ph:rnd(0,6),c:pick(e.col)}}
  else if(T==='em'){const x=rnd(0,w),y=h+4;if(bAt(toW(x,rnd(0,h)))!==k)return;p={T,x,y,vx:rnd(-10,10)*s,vy:-rnd(26,70)*s,l:rnd(3,6),ph:rnd(0,6),c:pick(e.col)}}
  else if(T==='as'){const x=rnd(-.1,1.1)*w;if(bAt(toW(x,rnd(0,h)))!==k)return;p={T,x,y:-4,vx:rnd(-12,8)*s,vy:rnd(16,32)*s,l:99,ph:rnd(0,6),c:pick(e.col)}}
  else{const sx=rnd(-.05,1.05)*w,sy=rnd(-.05,1.05)*h,q=toW(sx,sy);if(bAt(q)!==k)return;
   if(T==='fog')p={T,x:q.x,y:q.y,vx:rnd(8,16),vy:rnd(-3,3),z:0,l:rnd(14,22),r:rnd(55,100),c:pick(e.col),ph:0};
   else if(T==='bf')p={T,x:q.x,y:q.y,z:rnd(6,22),vx:rnd(-10,10),vy:rnd(-10,10),vz:0,l:rnd(8,14),ph:rnd(0,6),c:pick(e.col)};
   else if(T==='ff')p={T,x:q.x,y:q.y,z:rnd(4,26),vx:rnd(-5,5),vy:rnd(-5,5),vz:0,l:rnd(8,12),ph:rnd(0,6),c:pick(e.col)};
   else if(T==='lf')p={T,x:q.x,y:q.y,z:rnd(40,70),vx:rnd(10,22),vy:rnd(4,12),vz:-rnd(12,22),l:rnd(5,8),ph:rnd(0,6),c:pick(e.col)};
   else if(T==='pt')p={T,x:q.x,y:q.y,z:rnd(36,64),vx:rnd(8,20),vy:rnd(2,10),vz:-rnd(8,15),l:rnd(6,10),ph:rnd(0,6),c:pick(e.col)};
   else return}
  p.l0=p.l;if(A.length<MAXP)A.push(p)}
 // lluvia: cada gota elige dónde cae (landY) y, al llegar, deja un chapoteo pixelado
 function rain(dt,storm){const w=W(),h=H(),s=ISO.scale(),n=(storm?2800:1100)*dt*(w*h)/(1280*800);for(let i=0,m=Math.floor(n)+(Math.random()<n%1?1:0);i<m;i++){if(A.length>=MAXP+300)break;const x=rnd(-.1,1.15)*w,land=rnd(.05,1.02)*h,fall=rnd(140,260)*s;
   A.push({T:'rn',x:x+fall*.14,y:land-fall,land,vx:-72*s,vy:520*s*(storm?1.15:1),l:99,c:Math.random()<.35?'#e8f4ff':'#9cc4f0'})}}
 function update(now,dt,o){dt=Math.min(.1,dt||0);st.k=o.k;st.wx=o.wx||'';st.t=now/1000;const sun=o.sun,day=cl((sun+.1)/.5,0,1);st.day=day;
  const area=(W()*H())/(1280*800),ks=[];for(let k=st.k-1;k<=st.k+1;k++)if(k>=0&&k<E.length)ks.push(k);
  const wet=st.wx==='rain'||st.wx==='storm';
  const P3=!!(window.R3D&&window.R3D.parts3d);   // R3D-F3e: con ?r3d=1 el 3D (src/r3d/particles3d.js) dibuja luciérnagas, hojas, pétalos, nieve, brasas, ceniza y lluvia; aquí quedan mariposas, niebla y sombras de nubes
  ks.forEach(k=>E[k].forEach(e=>{if(wet&&(e.t==='bf'))return;if(P3&&(e.t==='fog'||e.t==='ff'||e.t==='lf'||e.t==='pt'||e.t==='sn'||e.t==='em'||e.t==='as'))return;const cond=e.w==='day'?day>.35:e.w==='night'?day<.55:true;if(!cond)return;
   const n=e.r*area*dt*(e.w==='night'?1-day:1)*(k===st.k?1:1),cnt=Math.floor(n)+(Math.random()<n%1?1:0);for(let i=0;i<cnt;i++)spawn(e,k)}));
  if(wet&&!P3)rain(dt,st.wx==='storm');
  // nubes (sombras): 4 blobs en el mundo cerca del jugador, viento hacia el SE
  if(typeof P!=='undefined'){while(CL.length<4)CL.push({x:P.x+rnd(-900,900),y:P.y+rnd(-700,700),r:rnd(90,170)});
   CL.forEach(c=>{c.x+=14*dt;c.y+=5*dt;if(Math.abs(c.x-P.x)>1000||Math.abs(c.y-P.y)>800){c.x=P.x-900+rnd(0,200);c.y=P.y+rnd(-700,700);c.r=rnd(90,170)}})}
  const s=ISO.scale();
  for(let i=A.length-1;i>=0;i--){const p=A[i];p.l-=dt;
   if(p.T==='rn'){p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.y>=p.land){if(Math.random()<.55&&RIP.length<90)RIP.push({x:p.x,y:p.land,l:.28});A.splice(i,1)}continue}
   if(p.T==='sn'){p.x+=(p.vx+Math.sin(st.t*1.4+p.ph)*12*s)*dt;p.y+=p.vy*dt*(p.big?1:.7);if(p.y>H()+8)A.splice(i,1);continue}
   if(p.T==='em'){p.x+=(p.vx+Math.sin(st.t*2+p.ph)*14*s)*dt;p.y+=p.vy*dt;if(p.l<=0||p.y<-8)A.splice(i,1);continue}
   if(p.T==='as'){p.x+=(p.vx+Math.sin(st.t+p.ph)*10*s)*dt;p.y+=p.vy*dt;if(p.y>H()+8)A.splice(i,1);continue}
   p.x+=p.vx*dt;p.y+=p.vy*dt;
   if(p.T==='bf'||p.T==='ff'){p.vx+=Math.sin(st.t*3+p.ph)*22*dt;p.vy+=Math.cos(st.t*2.3+p.ph)*22*dt;p.vx*=.98;p.vy*=.98;p.z=cl(p.z+Math.sin(st.t*2+p.ph)*6*dt,3,34)}
   else if(p.T==='lf'||p.T==='pt'){p.z+=p.vz*dt;p.vx+=Math.sin(st.t*2.2+p.ph)*30*dt;p.vx=cl(p.vx,-6,26);if(p.z<=0)p.l=0}
   const q=ISO.toCanvas(p.x,p.y,0);if(p.l<=0||q.x<-200||q.x>W()+200||q.y<-200||q.y>H()+260)A.splice(i,1)}
  for(let i=RIP.length-1;i>=0;i--){RIP[i].l-=dt;if(RIP[i].l<=0)RIP.splice(i,1)}}
 // ───── dibujo ─────
 // Resplandor REDONDO y suave (oct 2026): antes la luz de luciérnagas y brasas era un fillRect (cuadrado) con 'lighter', que de noche se veía como cuadros de luz.
 // Ahora es un degradado radial prerenderizado por color (64 px, caché) estampado con drawImage + un núcleo circular. Sin coste de gradiente por frame.
 const GLW=new Map(),glowSpr=c=>{let e=GLW.get(c);if(e)return e;e=document.createElement('canvas');e.width=e.height=64;const x=e.getContext('2d'),r=x.createRadialGradient(32,32,0,32,32,32);
  r.addColorStop(0,c);r.addColorStop(.25,c);r.addColorStop(1,'rgba(0,0,0,0)');x.globalAlpha=1;x.fillStyle=r;x.beginPath();x.arc(32,32,32,0,7);x.fill();
  // el borde del degradado debe morir en 0 con el MISMO tono (no negro): 'lighter' suma, así que el negro transparente no oscurece, pero se rehace con alfa para evitar halos grises
  x.globalCompositeOperation='destination-in';const m=x.createRadialGradient(32,32,0,32,32,32);m.addColorStop(0,'rgba(0,0,0,1)');m.addColorStop(.35,'rgba(0,0,0,.55)');m.addColorStop(.7,'rgba(0,0,0,.14)');m.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=m;x.fillRect(0,0,64,64);GLW.set(c,e);return e};
 const dot=(g,x,y,R,r,halo,core,ah,ac)=>{g.imageSmoothingEnabled=true;g.globalAlpha=Math.max(0,Math.min(1,ah));g.drawImage(glowSpr(halo),x-R,y-R,R*2,R*2);g.globalAlpha=Math.max(0,Math.min(1,ac));g.fillStyle=core;g.beginPath();g.arc(x,y,r,0,7);g.fill();g.globalAlpha=1};
 const sqr=(g,x,y,c,a,n)=>{const q=px();g.globalAlpha=Math.max(0,Math.min(1,a));g.fillStyle=c;n=n||1;g.fillRect(Math.round(x/q)*q,Math.round(y/q)*q,q*n,q*n)};
 function proj(p){const q=ISO.toCanvas(p.x,p.y,0);return[q.x,q.y-(p.z||0)*ISO.scale()*1.1]}
 function draw(g,layer){const w=W(),h=H(),s=ISO.scale(),q=px(),t=st.t;g.save();g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;
  if(layer==='ground'){
   if(st.day>.05){const wetF=st.wx?0:1;CL.forEach(c=>{const col=CS[bAt(c)];if(!col||!wetF)return;const o=ISO.toCanvas(c.x,c.y,0),rx=c.r*1.237*s,ry=c.r*.618*s;if(o.x<-rx||o.x>w+rx||o.y<-ry||o.y>h+ry)return;
     g.save();g.translate(o.x,o.y);g.scale(1,.5);const gr=g.createRadialGradient(0,0,rx*.15,0,0,rx);gr.addColorStop(0,col);gr.addColorStop(1,'rgba(0,0,0,0)');g.globalAlpha=.16*st.day;g.fillStyle=gr;g.beginPath();g.arc(0,0,rx,0,7);g.fill();g.restore()})}
   A.forEach(p=>{if(p.T!=='fog')return;const[x,y]=proj(p),a=Math.min(1,p.l/3,(p.l0-p.l)/3)*.1;g.save();g.translate(x,y);g.scale(1,.38);g.globalAlpha=a;g.fillStyle=p.c;g.beginPath();g.arc(0,0,p.r*s,0,7);g.fill();g.restore()});
   RIP.forEach(r=>{const u=1-r.l/.28,d=(1+u*2.4)*q;g.globalAlpha=(1-u)*.7;g.fillStyle='#dff0ff';g.fillRect(Math.round((r.x-d*1.6)/q)*q,Math.round(r.y/q)*q,q,q);g.fillRect(Math.round((r.x+d*1.6)/q)*q,Math.round(r.y/q)*q,q,q);if(u>.35){g.fillRect(Math.round(r.x/q)*q,Math.round((r.y-d*.6)/q)*q,q,q);g.fillRect(Math.round(r.x/q)*q,Math.round((r.y+d*.6)/q)*q,q,q)}})}
  else if(layer==='over'){
   A.forEach(p=>{const a=Math.min(1,p.l/1.2,(p.l0||9)-p.l>0?1:1);
    if(p.T==='rn'){const dx=p.vx/520*3.4*q,dy=3.4*q*(p.vy/520);for(let i=0;i<4;i++)sqr(g,p.x-dx*i*.5,p.y-dy*i*.5,i?'#9cc4f0':p.c,.75-i*.2)}
    else if(p.T==='sn'){const a2=p.big?.95:.7;sqr(g,p.x,p.y,p.c,a2,p.big?1:1);if(p.big){sqr(g,p.x+q,p.y,p.c,.5);sqr(g,p.x,p.y+q,p.c,.5)}}
    else if(p.T==='as'){sqr(g,p.x,p.y,p.c,.6)}
    else if(p.T==='bf'){const[x,y]=proj(p),f=Math.sin(t*16+p.ph)>0,u=Math.min(1,p.l/1.2);sqr(g,x-q,y,p.c,.95*u);sqr(g,x+q,y,p.c,.95*u);if(f){sqr(g,x-q,y-q,p.c,.8*u);sqr(g,x+q,y-q,p.c,.8*u)}else{sqr(g,x-q*2,y,p.c,.7*u);sqr(g,x+q*2,y,p.c,.7*u)}sqr(g,x,y,'#5b3a29',u)}
    else if(p.T==='lf'){const[x,y]=proj(p),u=Math.min(1,p.l/1.2),f=Math.sin(t*5+p.ph)>0;sqr(g,x,y,p.c,.9*u);sqr(g,x+(f?q:-q),y+(f?0:q),p.c,.75*u)}
    else if(p.T==='pt'){const[x,y]=proj(p),u=Math.min(1,p.l/1.2),f=Math.sin(t*4+p.ph)>0;sqr(g,x,y,p.c,.95*u);sqr(g,x+q,y+(f?q:0),p.c,.8*u)}})}
  else if(layer==='late'){
   g.globalCompositeOperation='lighter';
   A.forEach(p=>{
    if(p.T==='ff'){const[x,y]=proj(p),u=Math.min(1,p.l/1.5,(p.l0-p.l)/1.5)*(.45+.45*Math.sin(t*3+p.ph));dot(g,x,y,q*4.2,q*.8,p.c,'#fffbd0',.55*u,Math.min(1,u+.1))}
    else if(p.T==='em'){const u=Math.min(1,p.l/1.2);dot(g,p.x,p.y,q*2.8,q*.7,p.c,p.c,.4*u,.95*u)}});
   g.globalCompositeOperation='source-over'}
  g.restore()}
 const reset=()=>{A.length=0;CL.length=0;RIP=[]};
 return{E,update,draw,reset,CS,get count(){return A.length}}
})();
if(typeof module!=='undefined')module.exports=AMBI;
