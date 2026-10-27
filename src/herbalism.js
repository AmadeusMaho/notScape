// NotScape · HERBOLARIA (`he`, 27 oct 2026): recolección con TIJERAS DE PODAR y el minijuego «punto de corte» (decisión del dueño: la hoz no encaja con «arrancar con cuidado»).
// Se carga ANTES de game.js y solo usa sus globales en tiempo de llamada (S, L, ACT, I, TLV, add, room, dropGround, gain, toast, log, snd, relocate, N, P, alive, noise, tone).
// Mecánica (v2): LMB sobre una mata → un tallo con 3 NUDOS; en cada uno unas tijeras suben y bajan y hay que pulsar LMB al pasar por la zona verde.
//   por nudo: exacto = 2 · zona = 1 · fuera = 0 hierbas (mínimo 1 en total; los 3 exactos = «cosecha perfecta», +1). Cada nudo es más rápido y estrecho que el anterior. Hierba de tier alto = zona más estrecha y marcador más rápido; la tijera de tier superior ensancha la zona.
// Datos: `HERB.D` (nombre, id de objeto, nivel, color de flor); `ACT.he` se construye en game.js a partir de ella (misma forma que el resto de ACT de recolección).
const HERB=(()=>{
 // [nombre, id, nivel, flor, hoja]  (orden = nivel; tier de tijera requerido = TLV(nivel)). Las 3 primeras son «comunes»; el resto una por tier (matriz de oficios §3.1).
 const D=[['Manzanilla','manzanilla',1,'#f2efe2','#6f9a46'],['Ortiga','ortiga',4,'#4f7a3a','#3d6a34'],['Trébol','trebol',8,'#d890b0','#5f9a4a'],['Lavanda','lavanda',14,'#9a78d0','#6a8a58'],
  ['Salvia','salvia',24,'#8aa0c0','#7a9a8a'],['Helecho lunar','helecho',34,'#c8d4e0','#5a8a8a'],['Loto','loto',42,'#f0c8d8','#4a8a6a'],['Genciana','genciana',50,'#4a7ae0','#4a7a5a'],
  ['Flor de escarcha','escarcha',60,'#bfe8ff','#6a9ab0'],['Brasa-flor','brasaflor',70,'#ff8a3a','#7a5a3a'],['Ceniza viva','cenizaviva',78,'#c8b0a0','#5a4a44'],
  ['Espina infernal','espinainf',85,'#c8281c','#3a2024'],['Flor del mundo','flormundo',92,'#ffe08a','#4a9a8a']];
 let G=null,LASTCUT=-1e9;
 const ROUNDS=3;
 // dificultad: zona (semi-ancho) y velocidad por hierba y ronda; la tijera de tier superior al necesario ensancha la zona; de la hierba nº 5 en adelante el nudo «respira» (la zona se desplaza un poco)
 const W=n=>{const lv=ACT.he[G.e.i][2],need=TLV(lv)-1,over=Math.max(0,(S.tool.he||0)-need),hi=G.e.i;
  return{hw:Math.max(.04,.125-hi*.0055+over*.013-n*.006),spd:(.8+hi*.05)*(1+n*.14),drift:hi>=5?.035+hi*.003:0}};
 function ui(){let el=document.getElementById('hg');if(el)return el;el=document.createElement('div');el.id='hg';
  el.innerHTML='<div class="hg-t"></div><canvas class="hg-c" width="300" height="440"></canvas><div class="hg-p"><i></i><i></i><i></i></div><div class="hg-h">LMB: cortar en el nudo</div>';document.body.appendChild(el);return el}
 function hide(){const el=document.getElementById('hg');if(el)el.style.display='none'}
 function round(now){Object.assign(G,W(G.n));G.c=G.nodes[G.n];G.pos=Math.random()<.5?0:1;G.dir=G.pos?-1:1;G.res=null}
 function start(e,now){if(G||!alive(e,now))return false;const a=ACT.he[e.i],lv=a[2];
  if(L('he')<lv){log('Necesitas Herbolaria nv '+lv+' para '+a[0].toLowerCase()+'.');return false}
  if((S.tool.he||0)<TLV(lv)-1){log('Tus tijeras no bastan para '+a[0].toLowerCase()+' (hace falta un tier mayor).');return false}
  if(!room(a[1])){log('Inventario lleno. Vende o usa el banco.');return false}
  if(typeof A!=='undefined'&&A)stopA();
  G={e,n:0,q:[],fall:[],shake:0,flash:0,t:0,end:0,nodes:[.2,.45,.7],mp:0};round(now);
  const el=ui();el.style.display='block';el.className='';el.querySelector('.hg-t').textContent=a[0]+' · nv '+lv;el.querySelector('.hg-h').textContent='LMB: cortar en el nudo';
  el.querySelectorAll('.hg-p i').forEach(i=>i.className='');return true}
 // dibujo: tallo curvo con 3 nudos con hojas y flor arriba; el nudo activo brilla (zona verde = donde hay que cortar); el marcador (tijeras) sube y baja; la rama cortada cae
 function draw(){const el=document.getElementById('hg'),cv=el&&el.querySelector('canvas');if(!cv)return;const c=cv.getContext('2d'),Wd=cv.width,H=cv.height,HD=HERB.D[G.e.i],fl=HD[3],lf=HD[4];
  c.clearRect(0,0,Wd,H);const bx=Wd*.5,y0=H-30,y1=60,ph=y=>y0-(y0-y1)*y,sx=y=>bx+Math.sin(y*3.1+G.e.i)*14+G.shake*Math.sin(G.t*60)*5;
  const gr=c.createRadialGradient(bx,H*.55,10,bx,H*.55,Wd*.42);gr.addColorStop(0,'rgba(60,44,28,.55)');gr.addColorStop(1,'rgba(16,13,10,0)');c.fillStyle=gr;c.fillRect(0,0,Wd,H);
  const zc=G.c+Math.sin(G.t*1.6)*G.drift,zy0=ph(Math.min(1,zc+G.hw)),zy1=ph(Math.max(0,zc-G.hw));
  if(G.res===null&&!G.end){const gg=c.createLinearGradient(0,zy0,0,zy1);gg.addColorStop(0,'rgba(143,200,96,0)');gg.addColorStop(.5,'rgba(143,200,96,.55)');gg.addColorStop(1,'rgba(143,200,96,0)');c.fillStyle=gg;c.fillRect(bx-86,zy0,172,zy1-zy0);
   c.strokeStyle='rgba(191,232,128,.9)';c.lineWidth=1.5;c.beginPath();c.moveTo(bx-72,ph(zc));c.lineTo(bx+72,ph(zc));c.stroke()}
  c.lineCap='round';c.lineJoin='round';const stem=w=>{c.lineWidth=w;c.beginPath();for(let k=0;k<=24;k++){const u=k/24,X=sx(u),Y=ph(u);k?c.lineTo(X,Y):c.moveTo(X,Y)}c.stroke()};
  c.strokeStyle='#1d2616';stem(11);c.strokeStyle=lf;stem(6);
  for(let k=0;k<ROUNDS;k++){if(G.q[k]!==undefined)continue;const u=G.nodes[k],X=sx(u),Y=ph(u);for(const sd of[-1,1]){c.fillStyle=lf;c.strokeStyle='#1d2616';c.lineWidth=1.8;c.beginPath();c.ellipse(X+sd*24,Y-9,22,8,sd*-.5,0,7);c.fill();c.stroke()}}
  c.fillStyle=fl;c.strokeStyle='#1d2616';c.lineWidth=1.8;for(let k=0;k<6;k++){const an=k/6*6.283;c.beginPath();c.ellipse(sx(1)+Math.cos(an)*15,y1+Math.sin(an)*15,10,7,an,0,7);c.fill();c.stroke()}c.fillStyle='#f4d060';c.beginPath();c.arc(sx(1),y1,8,0,7);c.fill();c.stroke();
  G.fall.forEach(f=>{c.save();c.translate(f.x,f.y);c.rotate(f.r);c.fillStyle=f.c;c.strokeStyle='#1d2616';c.lineWidth=1.4;c.beginPath();c.ellipse(0,0,f.s,f.s*.4,0,0,7);c.fill();c.stroke();c.restore()});
  if(!G.end&&(G.res===null||G.flash>0)){const my=ph(G.res===null?G.pos:G.mp);c.save();c.translate(bx+80,my);c.strokeStyle='#e8cf94';c.shadowColor='#e8cf94';c.shadowBlur=8;c.lineWidth=3;c.beginPath();c.moveTo(-150,0);c.lineTo(-10,0);c.stroke();c.shadowBlur=0;
   c.lineWidth=3.2;c.strokeStyle='#cfd4dc';c.beginPath();c.moveTo(-8,-2);c.lineTo(16,-10);c.moveTo(-8,2);c.lineTo(16,10);c.stroke();c.strokeStyle='#8a5a2a';c.beginPath();c.arc(23,-5,6,0,7);c.stroke();c.beginPath();c.arc(23,5,6,0,7);c.stroke();c.restore()}
  if(G.flash>0){c.strokeStyle='rgba(255,240,180,'+G.flash+')';c.lineWidth=3;c.beginPath();c.arc(sx(G.mp),ph(G.mp),34*(1.5-G.flash),0,7);c.stroke()}}
 function tick(now,dt){if(!G)return;const e=G.e;G.t+=dt;G.shake=Math.max(0,G.shake-dt*3);G.flash=Math.max(0,G.flash-dt*2.6);
  G.fall.forEach(f=>{f.vy+=380*dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.r+=f.vr*dt});G.fall=G.fall.filter(f=>f.y<480);
  if(G.end){draw();if(now>G.end){G=null;hide()}return}
  if(Math.hypot(P.x-e.x,P.y-e.y)>130||!alive(e,now)){G=null;hide();return}
  if(G.res!==null){if(now>G.rt){if(G.n>=ROUNDS)finish(now);else round(now)}draw();return}
  G.pos+=G.dir*G.spd*dt;if(G.pos>=1){G.pos=1;G.dir=-1}if(G.pos<=0){G.pos=0;G.dir=1}
  draw()}
 function cut(now){if(!G||G.end||G.res!==null)return false;const d=Math.abs(G.pos-(G.c+Math.sin(G.t*1.6)*G.drift)),q=d<=G.hw*.33?2:d<=G.hw?1:0;
  G.res=q;G.q[G.n]=q;G.mp=G.pos;G.rt=now+400;G.flash=1;LASTCUT=now;G.shake=q?0:1;
  if(typeof noise==='function')noise(.06,.16,q?4600:1800,'highpass');if(typeof tone==='function')tone(q===2?1040:q?760:200,.08,'triangle',.06,0);
  const HD=HERB.D[G.e.i];for(let i=0;i<(q?6:2);i++)G.fall.push({x:150+(Math.random()-.5)*30,y:300-G.nodes[G.n]*320+Math.random()*30,vx:(Math.random()-.5)*180,vy:-110-Math.random()*90,vr:(Math.random()-.5)*9,r:0,s:8+Math.random()*8,c:q?HD[4]:'#6a5a3a'});
  const el=document.getElementById('hg');if(el){const pip=el.querySelectorAll('.hg-p i')[G.n];if(pip)pip.className='q'+q;el.querySelector('.hg-h').textContent=q===2?'¡Corte perfecto!':q===1?'Buen corte':'Corte torpe'}
  G.n++;return true}
 function finish(now){const e=G.e,a=ACT.he[e.i],sum=G.q.reduce((s,q)=>s+q,0),perf=G.q.every(q=>q===2);let n=Math.min(7,Math.max(1,sum)+(perf?1:0));
  for(let i=0;i<n;i++)if(room(a[1]))dropGround(a[1],e.x,e.y,{au:1,rare:perf&&i===0});
  gain('he',a[3]*(.45+sum*.2+(perf?.35:0)));if(perf){toast('🌿 ¡Cosecha perfecta! +1 '+a[0].toLowerCase());if(typeof snd==='function')snd('rare')}
  if(typeof inc==='function')inc('herb');log('Cortas: '+a[0]+' ×'+n);
  const el=document.getElementById('hg');if(el)el.querySelector('.hg-h').textContent=perf?'¡Cosecha perfecta! ×'+n:a[0]+' ×'+n;
  e.rt=now+30000;if(typeof reseek==='function')reseek(e,now);relocate(e);dirty=1;G.end=now+900}
 // la entrada: en captura sobre la ventana para que el LMB no mueva al héroe ni ataque mientras el minijuego está activo
 addEventListener('pointerdown',ev=>{if(!G||ev.button!==0)return;ev.stopImmediatePropagation();ev.preventDefault();cut(performance.now())},true);
 addEventListener('keydown',ev=>{if(G&&ev.key==='Escape'){G=null;hide()}},true);
 // COLOCACIÓN (se llama desde game.js por bioma, tras las zonas de tala/minería/pesca): hasta 5 claros de 3–6 matas por bioma, solo en tierra firme llana y lejos de la aldea.
 // Hierbas por bioma = índices de `D` (comunes + las del tier del bioma; matriz de oficios §3.1). Math.random a propósito (como `relocate`): no altera la secuencia sembrada del layout.
 const HB=[[0,1,2,3],[2,3,4],[3,4,5],[5,6,7],[7,8,9],[9,10,11],[5,6,7],[6,7,8],[3,4,5],[0,1,2]];
 function place(b,k,x0,y0){if(b.zone)return 0;const hb=HB[k]||HB[0],cen=b.cen||[b.w/2,b.h/2],zr=[];let tries=0;const W=170,H=120;
  while(zr.length<5&&tries++<140){const lx=Math.random()*b.w,ly=Math.random()*b.h,x=x0+lx,y=y0+ly;
   if(Math.hypot(lx-cen[0],ly-cen[1])<(b.safe||620)||zr.some(z=>Math.hypot(z[0]-lx,z[1]-ly)<420))continue;
   if(N.some(o=>o.t!=='he'&&Math.abs(o.x-x)<W&&Math.abs(o.y-y)<H+30))continue;   // nunca dentro de un bosque o una veta: el claro debe verse
   let ok=1;for(const[dx,dy]of[[0,0],[-W/2,-H/2],[W/2,-H/2],[-W/2,H/2],[W/2,H/2]]){const px=x+dx,py=y+dy;if(!TER.isLand(TER.heightAt(px,py))||TER.heightAt(px,py)<1||TER.cliffNear(px,py,14)||PROPS.solid(px,py)||(typeof biomeAt==='function'&&biomeAt(px,py)!==k)){ok=0;break}}
   if(ok)zr.push([lx,ly])}
  zr.forEach(([lx,ly])=>{const hi=hb[Math.floor(Math.random()*hb.length)],n=3+Math.floor(Math.random()*4),r=[lx-W/2,lx+W/2,ly-H/2,ly+H/2];
   for(let j=0;j<n;j++)sp0('he',hi,1,x0+r[0],x0+r[1],y0+r[2],y0+r[3]);ZS.push({k,r:[x0+r[0],x0+r[1],y0+r[2],y0+r[3]],t:'🌿 Hierbas: '+D[hi][0].toLowerCase()})});return zr.length}
 return{D,place,start,tick,cut,phase:now=>Math.max(0,Math.min(1,(now-LASTCUT)/420)),get active(){return!!G},get target(){return G&&G.e},cancel(){G=null;hide()}}})();
