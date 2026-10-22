// NotScape · ARRASTRAR OBJETOS (22 oct 2026; el dueño: «agarrar items en la interfaz, que se vea smooth»). Global `DRAG`. Se carga tras game.js.
// Cualquier elemento con `data-dg="inv|bank|eq"` (+ `data-i` id del objeto, `data-dn` cantidad, `data-di` índice en S.inv, `data-dk` ranura de equipo) se puede AGARRAR con el ratón (tras 6 px) o con el dedo (manteniendo ~220 ms).
// Lo que se agarra es el OBJETO, no el cuadrado: un fantasma `.dg` (solo icono + contador) que crece al estar en la mano, sigue al cursor con suavizado exponencial (independiente de los fps) y se inclina según la velocidad;
// al soltar vuela hasta su sitio (la pila del banco), cae al suelo o VUELVE a su origen si el destino no vale. Esc cancela.
// Destinos (`zoneAt`/`ACT`): mochila → banco (cualquier casilla; se apila solo), mochila → ranura de mochila (equipar bolsa), mochila → casilla de equipo que le corresponde (equipar), mochila → FUERA de los paneles (tirar; no objetos de misión),
// banco → mochila, equipo → mochila o banco (desequipar). Las acciones son funciones de game.js (`bankPut`, `bankTake`, `bagEquip`, `use`, `unq`, `dropItem`). Para un destino nuevo: añade su zona en `zoneAt` y su caso en `ACT`.
const DRAG=(()=>{
 const TH=6,HOLD=220,$=s=>document.querySelector(s);let st=null,gh=null,raf=0,just=0,hot=null,pos={x:0,y:0,tx:0,ty:0,vx:0,vy:0,r:0},tp=0;
 const UI_SEL='#log,#ctl,#dlg,#qpn,#tabs,#toast,.shwin,#hs,#side';
 function zoneAt(x,y){const el=document.elementFromPoint(x,y);if(!el)return{z:'none'};
  const eq=el.closest&&el.closest('#pw [data-eq]');if(eq)return{z:'eq',el:eq,k:eq.dataset.eq};
  const bag=el.closest&&el.closest('#pw [data-bag],#bw [data-bag]');if(bag)return{z:'bag',el:bag,i:+bag.dataset.bag};
  if(el.closest('#sw'))return{z:(typeof IW!=='undefined'&&IW&&IW.tab==='bank')?'bank':'ui',el:$('#sw')};
  if(el.closest('#pw,#bw'))return{z:'inv',el:el.closest('#pw,#bw')};
  if(el.closest(UI_SEL))return{z:'ui'};
  return{z:'world'}}
 const eqOk=(k,id)=>{const e=eqKey(id);return !!e&&(e===k||(e==='r'&&k==='r2'))};   // ¿va ese objeto en la ranura de equipo `k`?
 const valid=z=>st.type==='inv'?((z.z==='bank'&&bankOK())||(z.z==='bag'&&BAGS[st.id])||(z.z==='eq'&&eqOk(z.k,st.id))||(z.z==='world'&&!QITEM.has(st.id))):
  st.type==='eq'?(z.z==='inv'||z.z==='bag'||(z.z==='bank'&&bankOK())):(z.z==='inv'||z.z==='bag');
 // qué hace soltar el objeto `st` en la zona `z`: devuelve 'ok' | 'world' | 'no'
 const ACT={
  inv:z=>{const id=st.id,n=st.n;
   if(z.z==='bank'&&bankOK()){bankPut(id,n);return'ok'}
   if(z.z==='bag'&&BAGS[id]){return bagEquip(z.i,id)?'ok':'no'}
   if(z.z==='eq'){use(st.idx);return'ok'}
   if(z.z==='world'){return dropItem(st.idx,n)?'world':'no'}
   return'no'},
  eq:z=>{if(z.z==='inv'||z.z==='bag'){unq(st.k);return S.eq[st.k]?'no':'ok'}if(z.z==='bank'&&bankOK()){unq(st.k);if(S.eq[st.k])return'no';bankPut(st.id,1);return'ok'}return'no'},
  bank:z=>{if(z.z==='inv'||z.z==='bag'){return bankTake(st.id,st.n)?'ok':'no'}return'no'}};
 // casilla del banco donde queda un objeto: su pila si ya existe, si no la primera vacía (se ve DÓNDE va al soltar en cualquier parte del banco)
 const bankSlot=id=>document.querySelector('#sw .slot[data-dg="bank"][data-i="'+id+'"]')||document.querySelector('#sw .bkg .slot:not([data-dg])');
 function begin(){const r=st.src.getBoundingClientRect(),g=document.createElement('div');g.className='dg';
  g.style.cssText='width:'+r.width+'px;height:'+r.height+'px;margin:-'+r.height/2+'px 0 0 -'+r.width/2+'px;--rc:'+((getComputedStyle(st.src).getPropertyValue('--rc')||'').trim()||'#e8cf94');try{['mouseout','mouseleave'].forEach(t=>st.src.dispatchEvent(new MouseEvent(t,{bubbles:true,relatedTarget:document.body})))}catch(e){}   // apaga el icono 3D vivo del hover (deja la <img> del origen con opacity 0)
  g.innerHTML=st.src.innerHTML;g.querySelectorAll('img').forEach(i=>{i.style.opacity='';i.draggable=false});   // solo el OBJETO (icono + contador), sin el cuadrado de la casilla
  document.body.appendChild(g);gh=g;
  pos.x=r.left+r.width/2;pos.y=r.top+r.height/2;pos.tx=st.cx;pos.ty=st.cy;pos.vx=pos.vy=pos.r=0;tp=performance.now();st.started=1;st.sr={x:pos.x,y:pos.y};
  st.src.classList.add('dg-src');document.body.classList.add('dragging');requestAnimationFrame(()=>g.classList.add('pick'));if(!raf)raf=requestAnimationFrame(loop);try{tip.style.display='none'}catch(e){}}
 function loop(t){raf=0;if(!gh||!st)return;const dt=Math.min(.05,(t-tp)/1000||.016);tp=t;const k=1-Math.exp(-dt*24),ox=pos.x;pos.x+=(pos.tx-pos.x)*k;pos.y+=(pos.ty-pos.y)*k;
  const vx=(pos.x-ox)/Math.max(dt,.001);pos.vx+=(vx-pos.vx)*Math.min(1,dt*10);const rot=Math.max(-14,Math.min(14,pos.vx*.012));pos.r+=(rot-pos.r)*Math.min(1,dt*14);
  gh.style.translate=pos.x.toFixed(1)+'px '+pos.y.toFixed(1)+'px';gh.style.rotate=pos.r.toFixed(2)+'deg';raf=requestAnimationFrame(loop)}   // posición con las propiedades `translate`/`rotate` (la propiedad `scale` del CSS NO debe multiplicar la traslación)
 function hover(x,y){const z=zoneAt(x,y),ok=valid(z),el=ok&&z.z!=='world'?(z.z==='bank'?(bankSlot(st.id)||z.el):z.el):null;if(el!==hot){if(hot)hot.classList.remove('dz-hot');hot=el;if(hot)hot.classList.add('dz-hot')}
  gh.classList.toggle('dg-world',ok&&z.z==='world');gh.classList.toggle('dg-bad',!ok&&z.z!=='none')}
 function clean(){if(hot){hot.classList.remove('dz-hot');hot=null}document.body.classList.remove('dragging');if(st&&st.src)st.src.classList.remove('dg-src')}
 function end(e){const s=st;if(!s)return;clearTimeout(s.tm);if(!s.started){st=null;return}
  const z=zoneAt(e.clientX,e.clientY),tg=(z.z==='bank'&&valid(z))?bankSlot(s.id):null;let res=valid(z)?ACT[s.type](z):'no';just=performance.now()+220;
  const g=gh;cancelAnimationFrame(raf);raf=0;clean();gh=null;st=null;
  if(res==='no'){g.classList.add('dg-back');g.style.translate=s.sr.x+'px '+s.sr.y+'px';g.style.rotate='0deg'}
  else if(res==='world'){g.classList.add('dg-fall')}
  else if(tg){const r=tg.getBoundingClientRect();g.classList.add('dg-dock');g.style.translate=(r.left+r.width/2)+'px '+(r.top+r.height/2)+'px';g.style.rotate='0deg';tg.classList.add('dz-ok');setTimeout(()=>tg.classList.remove('dz-ok'),500)}
  else{g.classList.add('dg-in');if(z.el){z.el.classList.add('dz-ok');setTimeout(()=>z.el.classList.remove('dz-ok'),360)}}
  setTimeout(()=>g.remove(),360);dirty=1}
 function cancel(){const s=st;if(!s)return;clearTimeout(s.tm);if(s.started&&gh){const g=gh;cancelAnimationFrame(raf);raf=0;clean();gh=null;g.classList.add('dg-back');g.style.translate=s.sr.x+'px '+s.sr.y+'px';setTimeout(()=>g.remove(),340)}st=null}
 addEventListener('pointerdown',e=>{if(e.button!==0)return;const el=e.target.closest&&e.target.closest('[data-dg]');if(!el||el.dataset.i==null)return;
  st={src:el,type:el.dataset.dg,id:el.dataset.i,k:el.dataset.dk,n:+el.dataset.dn||1,idx:+el.dataset.di,x0:e.clientX,y0:e.clientY,cx:e.clientX,cy:e.clientY,touch:e.pointerType==='touch',started:0};
  if(st.touch)st.tm=setTimeout(()=>{if(st&&!st.started)begin()},HOLD)},true);
 addEventListener('pointermove',e=>{if(!st)return;st.cx=e.clientX;st.cy=e.clientY;pos.tx=e.clientX;pos.ty=e.clientY;
  if(!st.started){const d=Math.hypot(e.clientX-st.x0,e.clientY-st.y0);if(st.touch){if(d>10){clearTimeout(st.tm);st=null}}else if(d>TH)begin();return}
  hover(e.clientX,e.clientY)},true);
 addEventListener('pointerup',end,true);addEventListener('pointercancel',cancel,true);
 addEventListener('keydown',e=>{if(e.key==='Escape'&&st&&st.started){cancel();e.stopPropagation()}},true);
 addEventListener('click',e=>{if(performance.now()<just){e.stopPropagation();e.preventDefault()}},true);
 addEventListener('dragstart',e=>{if(e.target.closest&&e.target.closest('[data-dg]'))e.preventDefault()},true);
 addEventListener('touchmove',e=>{if(st&&st.started)e.preventDefault()},{passive:false});
 return{get on(){return !!(st&&st.started)}}
})();
