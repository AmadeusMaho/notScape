// NotScape · E3 (27 oct 2026) · CUEVAS REALES · lógica de juego. Una cueva es un INTERIOR (mismo motor que las casas: `INT`, `enterRoom/leaveRoom`, sala 3D en IRC) con tres diferencias:
//  · la planta sale de `CAVEGEN` (src/cavegen.js) y la malla de `src/r3d/cave3d.js`; la colisión es la máscara de la cueva (`CAVE.blk`, desde `intBlk`);
//  · AQUÍ SÍ hay combate, menas y cofre: los guardias de combate de game.js usan `inRoom()` (= casa) en vez de `INT`; las criaturas y los nodos de la cueva viven en `M`/`N` mientras estás dentro;
//  · entrar y salir tiene su propio fundido (iris oscuro) y sonido (retumbo grave con eco; al salir, aire y luz), y dentro gotea.
// Datos: cada POI `cueva` de poi-gen.js lleva `p.cave={seed,type,ch,W,H,ores,mobs}`; game.js lo registra con `CAVE.reg(id,…)` y crea la puerta (ST `door`, `cave:id`). Cueva nueva = un POI nuevo, sin código.
// Anti-abuso: al salir se guardan los tiempos de reaparición de menas y criaturas; si vuelves antes de 4 min, siguen agotadas.
// Usa globales de game.js (N, M, ST, PO, GD, GA, P, S, A, MD, mob, alive, dropGround…) solo en tiempo de llamada.
const CAVE=(()=>{
 const T=32,defs=new Map(),saved=new Map();let busy=false,drip=0;
 const reg=(id,p)=>defs.set(id,p);
 // ── fundido propio: iris que se cierra desde los bordes hasta el negro y se abre en la cueva; entra = azul-negro, sale = ámbar apagado ──
 let el=null;const ease=u=>u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
 function ov(){if(el)return el;el=document.createElement('div');el.id='cavefx';el.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:60;opacity:0;--r:150%;--c:#02040a';el.style.background='radial-gradient(circle at 50% 54%,transparent 0,transparent var(--r),var(--c) calc(var(--r) + 24%))';document.body.appendChild(el);return el}
 const tw=(from,to,ms,fn,done)=>{const t0=performance.now();const f=()=>{const u=Math.min(1,(performance.now()-t0)/ms);fn(from+(to-from)*ease(u));if(u<1)requestAnimationFrame(f);else if(done)done()};f()};
 function iris(tint,mid){const e=ov();e.style.setProperty('--c',tint);e.style.opacity=1;e.style.display='block';
  tw(150,-24,520,v=>e.style.setProperty('--r',v+'%'),()=>{mid();setTimeout(()=>tw(-24,150,950,v=>e.style.setProperty('--r',v+'%'),()=>{e.style.opacity=0;e.style.display='none';busy=false}),160)})}
 const T_=(f,d,ty,v,sl,dl)=>{try{tone(f,d,ty,v,sl,dl)}catch(e){}},N_=(d,v,f,ty)=>{try{noise(d,v,f,ty)}catch(e){}};
 function sndIn(){N_(1.1,.16,120,'lowpass');T_(62,1.1,'sine',.13,-24);for(let i=0;i<4;i++)setTimeout(()=>{T_(190-i*28,.55,'triangle',.05*(1-i*.22),-40);N_(.4,.025*(1-i*.2),500,'bandpass')},260+i*210)}
 function sndOut(){N_(.7,.09,1400,'highpass');T_(150,.5,'sine',.07,160);setTimeout(()=>T_(300,.4,'triangle',.04,120),180)}
 // ── colisión: máscara de la cueva (radio del héroe ≈ 9 px) ──
 const solid=(x,y)=>{const d=INT.cave,cx=Math.floor((x-IRC.x)/T+d.W/2),cy=Math.floor((y-IRC.y)/T+d.H/2);return cx<0||cy<0||cx>=d.W||cy>=d.H||!d.mask[cy*d.W+cx]};
 const blk=(x,y)=>{const r=9;return solid(x,y)||solid(x+r,y)||solid(x-r,y)||solid(x,y+r)||solid(x,y-r)};
 const wx=(d,c)=>IRC.x+(c-d.W/2)*T,wy=(d,c)=>IRC.y+(c-d.H/2)*T;
 // ── entrar ──
 function can(now){if(INT||busy)return false;if(M.some(m=>m.hunt&&alive(m,now))||(A&&A.ty==='f')){toast('No puedes entrar con enemigos cerca.');return false}return true}
 function enter(e){const now=performance.now(),id=e.cave,p=defs.get(id);if(!p||!can(now))return;busy=true;closeIW();stopA();P.g=P.mv=null;sndIn();iris('#02040a',()=>build(e,id,p))}
 function build(e,id,p){const now=performance.now(),d=CAVEGEN.gen(p.seed,{type:p.type,ch:p.ch,W:p.W,H:p.H,r0:p.r0});
  const sv={N:N.slice(),ST:ST.slice(),M:M.slice(),PO:PO.slice(),GD:GD.slice(),GA:GA.slice()};[N,ST,M,PO,GD,GA].forEach(a=>a.length=0);PJ.length=0;HFX.length=0;
  const H=CAVEGEN.H,ids=(p.ores&&p.ores.length?p.ores:[0]),rank=ids.slice().sort((a,b)=>a-b),pickOre=(q,i)=>{const lo=p.type==='profunda'?Math.floor(rank.length/3):0,hi=p.type==='tranquila'?Math.max(1,Math.ceil(rank.length*.7)):rank.length;return rank[lo+Math.floor(H(p.seed,i,31)*(hi-lo))]};
  d.ores.forEach((q,i)=>{const x=wx(d,q.x),y=wy(d,q.y);q.oi=pickOre(q,i);N.push({t:'mi',i:q.oi,x,y,rt:0,z:[x,x,y,y],fix:1,g:H(p.seed,i,33)<.015})});
  const hostile=[...new Set((p.mobs||[]).filter(q=>MD[q]&&(MD[q].ag||MD[q].dmg>=3)&&!/^[kb]\d/.test(q)))].sort((a,b)=>MD[a].lv-MD[b].lv),cid='cv_'+id;
  if(hostile.length)d.mobs.forEach((q,i)=>{const x=wx(d,q.x),y=wy(d,q.y),pool=q.elite?hostile.slice(-1):hostile,mid=pool[Math.floor(H(p.seed,i,41)*pool.length)];mob(mid,x,y);const m=M[M.length-1];m.cvi=i;
   if(q.elite){m.lv=Math.round(m.lv*1.35)+2;m.mh=Math.round(m.mh*2.8);m.hp=m.mh;if(m.dm)m.dm=Math.round(m.dm*1.3);m.elite=1}
   if(d.chest&&q.c===d.chest.c)m.poi=cid});
  if(d.chest){const x=wx(d,d.chest.x),y=wy(d,d.chest.y),done=!!S.poi[cid];PO.push({po:1,id:cid,pk:'cofre',n:done?'cofreAbierto':'cofre',o:null,nm:p.nm,x,y,k:e.k,_oa:1,tier:p.tier||1})}
  const ex=wx(d,d.ent.x+.5),ey=wy(d,d.ent.y+.5);ST.push({id:'exit',n:'Salir',x:ex,y:ey,lh:44,cave:1});
  const sp=saved.get(id);if(sp&&Date.now()-sp.ts<POI_RESP){N.forEach((q,i)=>{if(sp.n[i]>now)q.rt=sp.n[i]});M.forEach(m=>{if(m.cvi!=null&&sp.m[m.cvi]>now)m.rt=sp.m[m.cvi]})}   // sigue lo agotado/muerto si vuelves pronto
  INT={k:e.k,R:{nm:p.nm,it:[],st:[],lt:[]},id:'cueva',sv,items:[],fpR:[],ret:{x:e.x,y:e.y+40,rot:false},t0:now,so:null,dust:[],cave:d,cid:id,ptype:p.type,nm:p.nm};
  P.x=wx(d,d.spawn.x);P.y=wy(d,d.spawn.y);P.f=1;P.dir=0;P.vd=0;LFT=0;if(typeof curB!=='undefined')INT.cb=curB;
  toast('🕳️ '+p.nm,2200);
  if(window.R3D&&R3D.rooms&&R3D.rooms.ok){try{R3D.rooms.enter(INT)}catch(err){console.warn('[CAVE] sin sala 3D:',err)}}
  if(window.R3D&&R3D.show)R3D.show(1)}
 // ── salir (con fundido) ──
 function exit(){if(!INT||!INT.cave||busy)return;busy=true;sndOut();iris('#0e0a06',()=>{INT._lv=1;leaveRoom(1)})}
 // al abandonar la cueva (por cualquier vía): guarda lo agotado para que no se pueda «farmear» saliendo y entrando
 function save(I){const id=I.cid;if(!id)return;const n=N.map(q=>q.rt||0),m=[];M.forEach(q=>{if(q.cvi!=null)m[q.cvi]=q.rt||0});saved.set(id,{ts:Date.now(),n,m});busy=false}
 // ── ambiente: goteo con eco ──
 function tick(now,dt){if(!INT||!INT.cave)return;if(now>drip){drip=now+2500+Math.random()*5500;const f=1500+Math.random()*900;T_(f,.07,'sine',.022,-500);setTimeout(()=>T_(f*.97,.09,'sine',.011,-400),190);setTimeout(()=>T_(f*.94,.1,'sine',.006,-300),420)}}
 return{reg,enter,exit,save,tick,blk,solid,get busy(){return busy},defs}})();
