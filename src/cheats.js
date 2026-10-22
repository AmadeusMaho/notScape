/* NotScape · MENÚ DE TRUCOS (F3) — oct 2026, pedido del dueño.
   Panel DOM independiente (no toca el HUD ni el guardado). F3 lo abre/cierra; Esc también cierra. `?nocheat` en la URL lo desactiva.
   Pestañas: Objetos (buscar + dar con cantidad) · Teletransporte (aldeas, jefes, entradas, coordenadas, marcadores) · Jugador (curar, modo dios, oro, niveles, velocidad)
             · Mundo (hora del día, crear criaturas, revelar mapa).
   Solo usa globales del juego en tiempo de llamada (S, P, BI, I, MD, add, room, earn, XT, disc, maxHp, mnMax, mob, tab, toast…); si alguna no existe, el botón avisa en un toast.
   API por consola: `CHEAT.give(id,n)`, `CHEAT.tp(x,y)`, `CHEAT.levels(n)`, `CHEAT.god(true)`, `CHEAT.hour('noche')`, `CHEAT.spawn(id)`. Documentado en AGENTS.md («Menú de trucos»). */
const CHEAT=(()=>{
 if(/[?&]nocheat\b/.test(location.search))return{off:true};
 const API={};let root=null,tabId='it',god=false,fixT=null,t0=0,rafOrig=null;const MARK=[null,null];
 const say=m=>{try{toast('🛠 '+m,1800)}catch(e){console.log('[CHEAT]',m)}};
 const need=(...n)=>{for(const k of n){try{if(typeof eval(k)==='undefined')throw 0}catch(e){say('no existe «'+k+'» en esta versión');return false}}return true};
 const redraw=()=>{try{dirty=1}catch(e){}};
 // ───────── acciones ─────────
 API.give=(id,n=1)=>{if(!need('I','add','room')||!I[id])return say('objeto desconocido: '+id),0;let k=0;n=Math.max(1,Math.min(5000,n|0));for(;k<n&&room(id);k++)add(id);try{disc(id)}catch(e){}redraw();return k};
 API.tp=(x,y)=>{if(!need('P'))return;P.x=x;P.y=y;P.mv=null;P.g=null;try{A=null}catch(e){}try{if(ISO.snap)ISO.snap(x,y,TER.standZ(x,y))}catch(e){}try{if(window.R3D&&R3D.parts)R3D.parts.snap()}catch(e){}return[Math.round(P.x),Math.round(P.y)]};
 API.heal=()=>{P.hp=maxHp();try{MN=mnMax()}catch(e){}try{S.exh=0}catch(e){}};
 API.god=on=>{god=on==null?!god:!!on;say('Modo dios '+(god?'ACTIVADO':'apagado'));return god};
 API.gold=n=>{try{earn(n)}catch(e){S.coins=(S.coins||0)+n}redraw()};
 API.levels=n=>{if(!need('S','XT','SK'))return;n=Math.max(1,Math.min(99,n|0));for(const k in SK)S.xp[k]=XT[n];redraw();API.heal();say('Todas las habilidades a nivel '+n)};
 API.skill=(k,n)=>{n=Math.max(1,Math.min(99,n|0));S.xp[k]=XT[n];redraw();say(SK[k][0]+' → nivel '+n)};
 API.speed=on=>{try{S.buf.spd=on?Date.now()+864e5:0}catch(e){}redraw();say('Velocidad '+(on?'+35 % (24 h)':'normal'))};
 API.clear=()=>{if(!confirm('¿Vaciar la mochila?'))return;S.inv.length=0;redraw()};
 API.cine=id=>{if(typeof CINE==='undefined')return false;if(!id)id='prueba';const ok=CINE.start(id);say(ok?'Cinemática: '+id:'No se pudo iniciar «'+id+'» ('+CINE.list().join(', ')+')');if(ok)API.toggle(false);return ok};   // CINE-0: lanza una escena de src/cine.js (cierra este menú para verla)
 API.event=id=>{if(typeof BR==='undefined')return false;if(!id){BR.end();return true}return BR.trigger(id)};   // Fase B3: dispara un evento de clima de BIOME_RULES (o 'prueba' = bruma densa); sin id lo termina
 API.hour=n=>{ // congela el reloj del juego en una hora (misma técnica que NSTEST.time); null = reloj normal
  const PH={dia:61,atardecer:145,noche:241,amanecer:20};const sec=n==null?null:typeof n==='string'?PH[n]:n;
  if(rafOrig===null)rafOrig=window.requestAnimationFrame.bind(window);
  if(sec==null){fixT=null;window.requestAnimationFrame=rafOrig;rafOrig=null;say('Hora: reloj normal');return}
  fixT=sec*1000;t0=performance.now();const ro=rafOrig;window.requestAnimationFrame=cb=>ro(ts=>cb(fixT+(ts-t0)*.002));say('Hora fijada: '+n)};
 API.spawn=id=>{if(!need('MD','mob','P'))return;if(!MD[id])return say('criatura desconocida');mob(id,P.x+50,P.y+10);say('Creado: '+MD[id].n)};
 API.reveal=()=>{try{if(window.WMAP&&WMAP.revealAll)WMAP.revealAll();else if(S.fog){for(const k in S.fog)S.fog[k]=1}say('Mapa: revelado (si el motor lo permite)')}catch(e){say('no se pudo revelar')}};
 setInterval(()=>{if(god&&typeof P!=='undefined'&&P.hp>0){try{P.hp=maxHp();MN=mnMax();S.exh=0}catch(e){}}},80);
 // ───────── interfaz ─────────
 const CSS=`#cheat{position:fixed;left:12px;top:12px;width:min(420px,calc(100vw - 24px));max-height:calc(100vh - 24px);z-index:60;display:none;flex-direction:column;font:500 14px Spectral,Georgia,serif;color:#f2e6c4;background:rgba(16,13,10,.94);border:1.5px solid rgba(232,207,148,.45);border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.6);backdrop-filter:blur(3px)}
#cheat.on{display:flex}#cheat *{box-sizing:border-box}
#cheat .hd{display:flex;align-items:center;gap:8px;padding:8px 10px;border-bottom:1px solid rgba(232,207,148,.2);font:600 14px Cinzel,Georgia,serif;letter-spacing:.08em;color:#e8cf94;cursor:move}#cheat .hd span{flex:1}
#cheat .tabs{display:flex;gap:4px;padding:6px 8px 0}#cheat .tabs button{flex:1}
#cheat button{font:inherit;color:#f2e6c4;background:#2b241b;border:1px solid rgba(232,207,148,.28);border-radius:6px;padding:4px 8px;cursor:pointer}#cheat button:hover{background:#3a3326;border-color:#e8cf94}#cheat button.sel{background:#4a3f31;border-color:#e8cf94;color:#e8cf94}#cheat button.on{background:#3b5a2a;border-color:#8fd05a}
#cheat input,#cheat select{font:inherit;color:#f2e6c4;background:#1c160f;border:1px solid rgba(232,207,148,.28);border-radius:6px;padding:4px 7px;min-width:0}
#cheat .bd{padding:8px;overflow:auto;display:flex;flex-direction:column;gap:8px}#cheat .row{display:flex;gap:6px;flex-wrap:wrap;align-items:center}#cheat .row>label{opacity:.75;min-width:5.5em}
#cheat h4{margin:4px 0 0;font:600 12px Cinzel,Georgia,serif;letter-spacing:.1em;color:#e8cf94;opacity:.85}
#cheat .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(46px,1fr));gap:4px}#cheat .it{aspect-ratio:1;padding:2px;display:grid;place-items:center;position:relative}#cheat .it img{width:100%;height:100%;object-fit:contain}
#cheat .it .r{position:absolute;inset:0;border-radius:6px;border:2px solid var(--rc,transparent);pointer-events:none}
#cheat .hint{font-size:12px;opacity:.65}#cheat .tp{display:grid;grid-template-columns:1fr auto auto auto;gap:4px;align-items:center}`;
 const st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
 const el=(h)=>{const d=document.createElement('div');d.innerHTML=h;return d.firstElementChild};
 const ICO={};const icon=id=>ICO[id]||(ICO[id]=(()=>{try{return ITEMICON.canvas(id).toDataURL()}catch(e){return''}})());   // canvas 2D cacheado (NO ITEMICON.url: evitaría encolar cientos de iconos 3D)
 let IQ='',IQty=1;
 const ITEMS=()=>{const q=IQ.trim().toLowerCase();return Object.keys(I).filter(k=>!q||k.toLowerCase().includes(q)||String(I[k][0]).toLowerCase().includes(q))};
 function itemsTab(b){
  b.innerHTML=`<div class="row"><input id="cq" type="search" placeholder="Buscar objeto (nombre o id)…" style="flex:1" value="${IQ.replace(/"/g,'')}"><label style="min-width:0">Cant.</label><input id="cn" type="number" min="1" max="5000" value="${IQty}" style="width:70px"></div>
  <div class="row">${[1,10,100,1000].map(n=>`<button data-q="${n}">×${n}</button>`).join('')}<span class="hint" id="cc"></span></div><div class="grid" id="cg"></div><div class="hint">LMB = dar la cantidad indicada. Respeta el espacio de la mochila.</div>`;
  const g=b.querySelector('#cg'),cc=b.querySelector('#cc'),fill=()=>{const l=ITEMS(),sh=l.slice(0,160);cc.textContent=l.length+' objetos'+(l.length>sh.length?' (mostrando '+sh.length+')':'');
   g.innerHTML=sh.map(k=>{let rc='';try{const r=rr(k);if(r)rc=` style="--rc:${RAR[r][1]}"`}catch(e){}return`<button class="it" data-id="${k}" title="${String(I[k][0]).replace(/"/g,'')} · ${k}"><img src="${icon(k)}"><i class="r"${rc}></i></button>`}).join('')};
  fill();
  b.querySelector('#cq').oninput=e=>{IQ=e.target.value;fill()};
  b.querySelector('#cn').oninput=e=>{IQty=Math.max(1,+e.target.value||1)};
  b.querySelectorAll('[data-q]').forEach(x=>x.onclick=()=>{IQty=+x.dataset.q;b.querySelector('#cn').value=IQty});
  g.onclick=e=>{const t=e.target.closest('.it');if(!t)return;const n=API.give(t.dataset.id,IQty);say(n?'+'+n+' '+I[t.dataset.id][0]:'Mochila llena')};
 }
 function tpTab(b){
  let h='';
  try{h+=BI.map((B,k)=>`<div class="tp"><b>${B.n}</b><button data-t="${k}:cen">Aldea</button><button data-t="${k}:boss">Jefe</button><button data-t="${k}:spawn">Entrada</button></div>`).join('')}catch(e){h='<div class="hint">BI no disponible</div>'}
  b.innerHTML=`<h4>BIOMAS</h4>${h}<h4>COORDENADAS DE MUNDO</h4><div class="row"><input id="tx" type="number" placeholder="x" style="width:90px"><input id="ty" type="number" placeholder="y" style="width:90px"><button id="tg">Ir</button><span class="hint" id="tpos"></span></div>
  <h4>MARCADORES</h4><div class="row"><button data-m="s0">Guardar 1</button><button data-m="g0">Ir a 1</button><button data-m="s1">Guardar 2</button><button data-m="g1">Ir a 2</button></div>`;
  const pos=b.querySelector('#tpos'),upd=()=>{if(!root||!root.classList.contains('on')||tabId!=='tp')return;try{pos.textContent='Estás en '+Math.round(P.x)+', '+Math.round(P.y)}catch(e){}setTimeout(upd,400)};upd();
  b.querySelectorAll('[data-t]').forEach(x=>x.onclick=()=>{const[k,w]=x.dataset.t.split(':'),B=BI[+k],p=w==='cen'?B.cen:w==='boss'?B.bossPos:B.spawn;if(!p)return say('sin punto «'+w+'»');API.tp(B.ox+p[0],B.oy+p[1]);say('→ '+B.n+' · '+x.textContent)});
  b.querySelector('#tg').onclick=()=>{const x=+b.querySelector('#tx').value,y=+b.querySelector('#ty').value;if(isNaN(x)||isNaN(y))return;API.tp(x,y)};
  b.querySelectorAll('[data-m]').forEach(x=>x.onclick=()=>{const[a,i]=[x.dataset.m[0],+x.dataset.m[1]];if(a==='s'){MARK[i]=[P.x,P.y];say('Posición '+(i+1)+' guardada')}else if(MARK[i])API.tp(MARK[i][0],MARK[i][1]);else say('Nada guardado en '+(i+1))});
 }
 function playerTab(b){
  let sk='';try{sk=Object.keys(SK).map(k=>`<option value="${k}">${SK[k][1]} ${SK[k][0]}</option>`).join('')}catch(e){}
  b.innerHTML=`<h4>ESTADO</h4><div class="row"><button id="ph">Curar todo</button><button id="pg" class="${god?'on':''}">Modo dios: ${god?'SÍ':'no'}</button><button id="ps">Velocidad +35 %</button><button id="pn">Normal</button></div>
  <h4>MONEDAS (cobre: 100 = 1 plata, 10 000 = 1 oro)</h4><div class="row">${[100,1000,10000,100000,1000000].map(n=>`<button data-g="${n}">+${typeof money==='function'?money(n):n}</button>`).join('')}</div>
  <h4>NIVELES</h4><div class="row"><label>Todas</label><input id="lv" type="number" min="1" max="99" value="99" style="width:64px"><button id="la">Aplicar a todas</button></div>
  <div class="row"><label>Una</label><select id="ls">${sk}</select><input id="ln" type="number" min="1" max="99" value="99" style="width:64px"><button id="lo">Aplicar</button></div>
  <h4>MOCHILA</h4><div class="row"><button id="pc">Vaciar mochila</button></div>`;
  b.querySelector('#ph').onclick=()=>{API.heal();say('Vida, maná y resistencia al máximo')};
  b.querySelector('#pg').onclick=()=>{API.god();playerTab(b)};
  b.querySelector('#ps').onclick=()=>API.speed(true);b.querySelector('#pn').onclick=()=>API.speed(false);
  b.querySelectorAll('[data-g]').forEach(x=>x.onclick=()=>{API.gold(+x.dataset.g);say('+'+(typeof money==='function'?money(+x.dataset.g):x.dataset.g))});
  b.querySelector('#la').onclick=()=>API.levels(+b.querySelector('#lv').value);
  b.querySelector('#lo').onclick=()=>API.skill(b.querySelector('#ls').value,+b.querySelector('#ln').value);
  b.querySelector('#pc').onclick=API.clear;
 }
 function worldTab(b){
  let mo='';try{mo=Object.keys(MD).map(k=>`<option value="${k}">${MD[k].n} (nv ${MD[k].lv})</option>`).join('')}catch(e){}
  b.innerHTML=`<h4>HORA DEL DÍA</h4><div class="row">${['amanecer','dia','atardecer','noche'].map(h=>`<button data-h="${h}">${h==='dia'?'Día':h[0].toUpperCase()+h.slice(1)}</button>`).join('')}<button data-h="">Reloj normal</button></div><div class="hint">Fijar la hora congela el ciclo hasta pulsar «Reloj normal».</div>
  <h4>CINEMÁTICAS (CINE)</h4><div class="row">${(typeof CINE!=='undefined'?CINE.list():[]).map(i=>`<button data-cine="${i}">${i}</button>`).join('')}</div><div class="hint">Mantén Esc para saltar. Pausa el juego mientras dura.</div>
  <h4>EVENTOS DE CLIMA (BIOME_RULES)</h4><div class="row">${(typeof BR!=='undefined'?BR.ids():[]).map(i=>`<button data-ev="${i}">${i}</button>`).join('')}<button data-ev="">Terminar</button></div><div class="hint">Aviso previo, luego efecto (niebla radial, sonido, minimapa). Ninguno daña ni bloquea.</div>
  <h4>CRIATURAS</h4><div class="row"><select id="ms" style="flex:1">${mo}</select><button id="mb">Crear junto a mí</button></div>
  <h4>COMBATE</h4><div class="row"><button id="lab">Laboratorio de combate</button></div><div class="hint">Muñeco, medidor de golpes y deslizadores de sensación (hit-stop, temblor, empujón, velocidad).</div>
  <h4>MAPA</h4><div class="row"><button id="mr">Revelar mapa</button></div>`;
  b.querySelectorAll('[data-h]').forEach(x=>x.onclick=()=>API.hour(x.dataset.h||null));
  b.querySelectorAll('[data-cine]').forEach(x=>x.onclick=()=>API.cine(x.dataset.cine));
  {const lb=b.querySelector('#lab');if(lb)lb.onclick=()=>{if(typeof LAB!=='undefined')LAB.open()}}
  b.querySelectorAll('[data-ev]').forEach(x=>x.onclick=()=>{API.event(x.dataset.ev||null);say(x.dataset.ev?'Evento: '+x.dataset.ev:'Evento terminado')});
  b.querySelector('#mb').onclick=()=>API.spawn(b.querySelector('#ms').value);
  b.querySelector('#mr').onclick=API.reveal;
 }
 const TABS={it:['Objetos',itemsTab],tp:['Teleport',tpTab],pl:['Jugador',playerTab],wo:['Mundo',worldTab]};
 function render(){if(!root)return;root.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('sel',x.dataset.k===tabId));TABS[tabId][1](root.querySelector('.bd'))}
 function build(){
  root=el(`<div id="cheat"><div class="hd"><span>MENÚ DE TRUCOS · F3</span><button data-x>✕</button></div><div class="tabs">${Object.keys(TABS).map(k=>`<button data-k="${k}">${TABS[k][0]}</button>`).join('')}</div><div class="bd"></div></div>`);
  document.body.appendChild(root);
  // las teclas escritas en el panel NO llegan al juego (WASD moverían al personaje)
  for(const ev of['keydown','keyup','keypress'])root.addEventListener(ev,e=>{if(e.key==='Escape'||e.key==='F3')return;e.stopPropagation()});
  for(const ev of['mousedown','wheel','contextmenu'])root.addEventListener(ev,e=>e.stopPropagation());
  root.querySelector('[data-x]').onclick=()=>API.toggle(false);
  root.querySelectorAll('.tabs button').forEach(x=>x.onclick=()=>{tabId=x.dataset.k;render()});
  // arrastrar por la cabecera
  const hd=root.querySelector('.hd');let d=null;hd.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;const r=root.getBoundingClientRect();d=[e.clientX-r.left,e.clientY-r.top];hd.setPointerCapture(e.pointerId)});
  hd.addEventListener('pointermove',e=>{if(!d)return;root.style.left=Math.max(0,e.clientX-d[0])+'px';root.style.top=Math.max(0,e.clientY-d[1])+'px'});hd.addEventListener('pointerup',()=>{d=null});
 }
 API.toggle=on=>{if(!root)build();const v=on==null?!root.classList.contains('on'):!!on;root.classList.toggle('on',v);if(v)render();return v};
 // F3 abre/cierra (se cancela la búsqueda del navegador); Esc cierra. Captura = va antes que el manejador del juego.
 addEventListener('keydown',e=>{if(e.key==='F3'){e.preventDefault();e.stopPropagation();API.toggle()}else if(e.key==='Escape'&&root&&root.classList.contains('on')&&!/INPUT|SELECT/.test((e.target||{}).tagName||'')){API.toggle(false)}},true);
 return API;
})();
