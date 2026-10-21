/* NotScape · SLOTFX — luz y partículas al pasar el ratón por objetos AZULES, ÉPICOS y LEGENDARIOS (oct 2026, pedido del dueño).
   Un único lienzo `position:fixed` (fuera del layout, pointer-events:none) con `mix-blend-mode:screen`: la luz BAÑA también las casillas vecinas y el panel (por eso «ilumina de verdad»),
   y las partículas se pintan en aditivo. Se activa solo con ratón (no táctil) sobre `.slot[data-g]` con rareza ≥2 (`data-r` lo pone `sfx()` en game.js). `?nofx` lo apaga; respeta prefers-reduced-motion.
   Por rareza (tabla `CFG`):  2 Raro = motas azules que suben despacio, luz suave · 3 Épico = luces que orbitan + destellos en cruz, luz que pulsa · 4 Legendario = brasas que suben con chispas, luz que parpadea y radio mayor.
   Coste: un lienzo ≤ 7 casillas de lado (tope 512 px), ≤ 40 partículas con sprites cacheados; se libera al terminar el desvanecido. Complementa el hover 3D de icons3d.js (que añade además una luz puntual REAL sobre el modelo). */
const SLOTFX=(()=>{
 if(typeof document==='undefined'||/[?&]nofx\b/.test(location.search))return{off:true};
 const mq=q=>window.matchMedia&&matchMedia(q).matches;
 const CFG={
  2:{col:[90,170,255],core:[205,235,255],max:14,rate:9,rad:2.3,int:.62,type:'mote'},
  3:{col:[185,80,255],core:[240,200,255],max:24,rate:16,rad:2.8,int:.8,type:'wisp'},
  4:{col:[255,130,25],core:[255,226,140],max:40,rate:32,rad:3.4,int:1,type:'ember'}};
 const SPR={},sprite=(c,k)=>{const key=c.join()+k;if(SPR[key])return SPR[key];const s=document.createElement('canvas');s.width=s.height=48;const g=s.getContext('2d'),r=g.createRadialGradient(24,24,0,24,24,24);
  r.addColorStop(0,`rgba(255,255,255,${k})`);r.addColorStop(.25,`rgba(${c},${k*.85})`);r.addColorStop(1,`rgba(${c},0)`);g.fillStyle=r;g.fillRect(0,0,48,48);return SPR[key]=s};
 let cv=null,x=null,cell=null,cfg=null,A=0,tgt=0,raf=0,last=0,LS=48,t0=0,mx=-1,my=-1,px=0,py=0,PT=[],acc=0,hotEl=null;
 const rnd=()=>Math.random();   // solo efectos visuales; NO toca el azar del juego (que va sembrado)
 function ensure(){if(cv)return;cv=document.createElement('canvas');cv.style.cssText='position:fixed;pointer-events:none;z-index:29;mix-blend-mode:screen;left:0;top:0';document.body.appendChild(cv);x=cv.getContext('2d')}
 function drop(){cancelAnimationFrame(raf);raf=0;if(cv){cv.remove();cv=x=null}PT=[];if(hotEl){hotEl.classList.remove('fxhot');hotEl=null}cell=null}
 function emit(S,cx,cy,c){const f=cfg,ty=f.type;
  if(ty==='mote')PT.push({k:'m',x:cx+(rnd()-.5)*S*.8,y:cy+S*(.1+rnd()*.35),vx:(rnd()-.5)*.06,vy:-(.16+rnd()*.2),l:0,L:1.6+rnd()*1.1,s:.05+rnd()*.05,ph:rnd()*6.3,c:f});
  else if(ty==='wisp'){if(rnd()<.28)PT.push({k:'g',x:cx+(rnd()-.5)*S*.9,y:cy+(rnd()-.5)*S*.9,vx:0,vy:0,l:0,L:.6+rnd()*.5,s:.16+rnd()*.12,ph:0,c:f});
   else PT.push({k:'w',a:rnd()*6.3,r:S*(.5+rnd()*.14),w:(rnd()<.5?-1:1)*(1.7+rnd()*1.6),vr:-.05+rnd()*.12,l:0,L:1.5+rnd()*1.0,s:.06+rnd()*.05,hist:[],c:f})}
  else{if(rnd()<.22)PT.push({k:'s',x:cx+(rnd()-.5)*S*.7,y:cy+S*.2,vx:(rnd()-.5)*.9,vy:-(.9+rnd()*.9),l:0,L:.45+rnd()*.3,s:.035,c:f});
   else PT.push({k:'e',x:cx+(rnd()-.5)*S*.85,y:cy+S*(.28+rnd()*.2),vx:(rnd()-.5)*.14,vy:-(.32+rnd()*.5),l:0,L:1.0+rnd()*1.0,s:.05+rnd()*.06,ph:rnd()*6.3,c:f})}}
 function loop(now){raf=requestAnimationFrame(loop);const dt=Math.min(.05,(now-(last||now))/1000);last=now;if(!t0)t0=now;const T=(now-t0)/1000;
  if(cell&&!cell.isConnected){const e=mx>=0&&document.elementFromPoint(mx,my),n=e&&e.closest&&e.closest('.slot[data-g]');if(n&&(+n.dataset.g)>=2)bind(n);else leave()}
  A+=(tgt-A)*Math.min(1,dt*(tgt?10:6));if(!tgt&&A<.01&&!PT.length){drop();return}
  if(!cell&&!PT.length&&!tgt){drop();return}
  const r=cell?cell.getBoundingClientRect():null;if(r&&r.width>4){const nx=r.left+r.width/2,ny=r.top+r.height/2;if(!px&&!py){px=nx;py=ny}else{px+=(nx-px)*Math.min(1,dt*14);py+=(ny-py)*Math.min(1,dt*14)}LS=r.width}
  const S=r&&r.width>4?r.width:LS,dpr=Math.min(2,window.devicePixelRatio||1),W=Math.round(S*7);
  if(cv.width!==Math.round(W*dpr)){cv.width=cv.height=Math.round(W*dpr);cv.style.width=cv.style.height=W+'px'}
  cv.style.left=(px-W/2)+'px';cv.style.top=(py-W/2)+'px';
  x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,W,W);x.globalCompositeOperation='lighter';
  const c0=W/2,f=cfg||PT[0]&&PT[0].c;
  if(f){ // LUZ: ilumina la casilla y las vecinas. Raro = estable; Épico = pulso; Legendario = parpadeo (suma de senos incommensurables)
   let k=1;if(f.type==='wisp')k=.82+.18*Math.sin(T*3.2);else if(f.type==='ember')k=.8+.12*Math.sin(T*9.1)+.08*Math.sin(T*23.7+1)+.06*Math.sin(T*41.3);else k=.93+.07*Math.sin(T*1.8);
   const R0=S*f.rad,I=f.int*k*A,g=x.createRadialGradient(c0,c0,S*.12,c0,c0,R0);
   g.addColorStop(0,`rgba(${f.core},${I})`);g.addColorStop(.28,`rgba(${f.col},${I*.62})`);g.addColorStop(.65,`rgba(${f.col},${I*.2})`);g.addColorStop(1,`rgba(${f.col},0)`);x.fillStyle=g;x.fillRect(0,0,W,W);
   if(f.type==='ember'){ // rayos suaves que giran despacio (solo legendario)
    x.save();x.translate(c0,c0);x.rotate(T*.35);for(let i=0;i<6;i++){x.rotate(Math.PI/3);const lg=x.createLinearGradient(0,0,R0*.95,0);lg.addColorStop(0,`rgba(${f.core},${.16*A*k})`);lg.addColorStop(1,`rgba(${f.col},0)`);x.fillStyle=lg;x.beginPath();x.moveTo(0,-S*.07);x.lineTo(R0*.95,-S*.015);x.lineTo(R0*.95,S*.015);x.lineTo(0,S*.07);x.fill()}x.restore()}}
  // PARTÍCULAS (coordenadas locales al centro del lienzo)
  if(tgt&&cfg&&!mq('(prefers-reduced-motion:reduce)')){acc+=dt*cfg.rate;while(acc>=1&&PT.length<cfg.max){acc--;emit(S,c0,c0,cfg)}acc=Math.min(acc,1)}
  for(let i=PT.length-1;i>=0;i--){const p=PT[i];p.l+=dt;if(p.l>=p.L){PT.splice(i,1);continue}const u=p.l/p.L,fa=Math.min(1,u*5)*(1-u)*(1-u*.2),cc=p.c;let X,Y,sz=p.s*S,col=cc.col,sp,al=fa;
   if(p.k==='m'){p.x+=(p.vx+Math.sin(T*2+p.ph)*.05)*S*dt;p.y+=p.vy*S*dt;X=p.x;Y=p.y;al*=.85}
   else if(p.k==='w'){p.a+=p.w*dt;p.r+=p.vr*S*dt;X=c0+Math.cos(p.a)*p.r;Y=c0+Math.sin(p.a)*p.r*.78;p.hist.push(X,Y);if(p.hist.length>10)p.hist.splice(0,2);
    for(let h=0;h<p.hist.length-2;h+=2){const q=(h/2+1)/(p.hist.length/2),ss=sz*(.4+.5*q);x.globalAlpha=al*q*.45;x.drawImage(sprite(cc.col,.9),p.hist[h]-ss*1.5,p.hist[h+1]-ss*1.5,ss*3,ss*3)}al*=.95}
   else if(p.k==='g'){X=p.x;Y=p.y;const a=al*(.6+.4*Math.sin(T*30+p.l*40));x.globalAlpha=a;const r=sz*(.5+u*.5);x.strokeStyle=`rgba(${cc.core},1)`;x.lineWidth=Math.max(1,S*.018);x.beginPath();x.moveTo(X-r,Y);x.lineTo(X+r,Y);x.moveTo(X,Y-r);x.lineTo(X,Y+r);x.stroke();x.drawImage(sprite(cc.col,.9),X-r*.6,Y-r*.6,r*1.2,r*1.2);continue}
   else if(p.k==='e'){p.x+=(p.vx+Math.sin(T*3+p.ph)*.1)*S*dt;p.y+=p.vy*S*dt;X=p.x;Y=p.y;sz*=(1-u*.6)*(.8+.2*Math.sin(T*18+p.ph));col=u<.4?cc.core:cc.col;al*=1}
   else{p.x+=p.vx*S*dt;p.y+=p.vy*S*dt;p.vy+=.9*dt;X=p.x;Y=p.y;sz*=(1-u*.5);col=cc.core;x.globalAlpha=al;x.strokeStyle=`rgba(${cc.core},1)`;x.lineWidth=Math.max(1,S*.02);x.beginPath();x.moveTo(X,Y);x.lineTo(X-p.vx*S*.05,Y-p.vy*S*.05);x.stroke()}
   x.globalAlpha=Math.max(0,Math.min(1,al*A+(tgt?0:al*.0)));const s2=sz*3;x.drawImage(sprite(col,1),X-s2/2,Y-s2/2,s2,s2)}
  x.globalAlpha=1;x.globalCompositeOperation='source-over'}
// color del efecto = el del MARCO de la casilla (`--rc`: rareza, o tier si el objeto es común), así una espada de adamantita echa luz verde y una legendaria naranja; el nivel (`data-g` ≥2) solo elige el estilo
 const hex=h=>{h=(h||'').trim().replace('#','');if(h.length===3)h=h.split('').map(q=>q+q).join('');const n=parseInt(h,16);return h.length===6&&!isNaN(n)?[n>>16&255,n>>8&255,n&255]:null};
 const mk=c=>{const f=CFG[Math.min(4,Math.max(2,+c.dataset.g))],col=hex(c.style.getPropertyValue('--rc'))||f.col;return Object.assign({},f,{col,core:col.map(v=>Math.round(v+(255-v)*.62))})};
 function bind(c){if(cell===c)return;if(hotEl)hotEl.classList.remove('fxhot');cell=c;hotEl=c;c.classList.add('fxhot');cfg=mk(c);tgt=1;ensure();if(!raf){last=0;t0=0;px=py=0;raf=requestAnimationFrame(loop)}}
 function leave(){tgt=0;cell=null;if(hotEl){hotEl.classList.remove('fxhot');hotEl=null}}
 document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY},{passive:true});
 document.addEventListener('mouseover',e=>{if(e.pointerType==='touch'||mq('(hover:none)'))return;const t=e.target,c=t&&t.closest&&t.closest('.slot[data-g]');if(c&&(+c.dataset.g)>=2)bind(c);else if(cell&&!(t&&t.closest&&t.closest('.slot[data-g]')))leave()});
 document.addEventListener('mouseout',e=>{if(!cell)return;const to=e.relatedTarget;if(to&&to.closest&&cell.contains(to))return;if(!(to&&to.closest&&to.closest('.slot[data-g]')))leave()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)drop()});
 return{on:true,drop};
})();
