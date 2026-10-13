// NotScape · editor de personaje (primer inicio y botón «🧑 Personaje»).
// TÉCNICA: un único modelo PARAMÉTRICO (ORG.U.heroe) + animaciones compartidas (HERO.pose). La apariencia es solo un puñado de parámetros
// (peinado, colores, cara) que se pasan al dibujar → personalizar NO exige reanimar nada, y todo peinado/cara/color nuevo funciona ya con todas las animaciones.
// Datos: S.app = {name, g, hair, hc, skin, col, eye, face}. PROPS.appOpts(S.app) lo convierte en opciones del modelo. Un peinado/cara nuevo = una fila en HAIRS (aquí) y en ORG.HAIRS + su forma en hairGeo/faceX de hero2d (style-organic.js).
// Sin S.app (o sin nombre) el juego pregunta al arrancar —también tras Reiniciar—; `?noedit` en la URL lo omite (herramientas de prueba).
// NO hay botón para reabrirlo: cambiar el aspecto será un ítem de pago en la tienda que llame a CREATOR.open(false) (nombre bloqueado, con Guardar/Cancelar).
const CREATOR=(()=>{
 const HAIRS={m:[['bald','Calvo'],['cut','Corto'],['spiky','Puntas'],['side','Flequillo'],['curly','Rizado'],['mane','Melena']],
   f:[['bald','Calvo'],['long','Largo'],['bun','Moño'],['pony','Coleta'],['bob','Media melena'],['twin','Dos coletas']]}, // calvo = predeterminado (guiño al OSRS); 5 peinados por género
  GEN=[['m','Hombre'],['f','Mujer']],FACE=[[0,'Clásica'],[1,'Pecas'],[2,'Dulce'],[3,'Seria']],
  SKIN=['#f6d4b0','#f0c08a','#d9a066','#b5764a','#8a5232','#5e3a25'],
  HC=['#5a3a22','#2a1a12','#c08a3a','#e8c872','#a83a22','#dcdcdc','#3a5aa0','#7a3aa8'],
  EYE=['#3a2620','#2a5aa0','#2f8a4a','#7a5a2a','#8a3aa8','#3a8a9a'],
  COL=['#c0392b','#e0906a','#d8a030','#6a9a3a','#2f8a6a','#3a7ac0','#6a4ac0','#c04a8a','#8a8f98','#4a4a52'],
  DEF={name:'',g:'m',hair:'bald',hc:'#5a3a22',skin:'#f6d4b0',col:'#c0392b',eye:'#3a2620',face:0},
  MODES=[['idle','Reposo'],['walk','Caminar'],['run','Correr'],['wc','Talar']];
 let el,cv,g,A,bak,first=false,mode='idle',dir=2,raf=0,t0=0;
 const $$=(s,r)=>(r||el).querySelector(s),pick=a=>a[Math.floor(Math.random()*a.length)];
 const sw=(k,list)=>`<div class="ce-sw" data-k="${k}">${list.map(c=>`<button type="button" class="ce-c" data-v="${c}" style="background:${c}" title="${c}"></button>`).join('')}</div>`;
 const chips=(k,list)=>`<div class="ce-ch" data-k="${k}">${list.map(([v,l])=>`<button type="button" class="bt ce-b" data-v="${v}">${l}</button>`).join('')}</div>`;
 function build(){el=document.getElementById('ce');
  el.innerHTML=`<div class="ce-card panel"><h2>Crea tu personaje</h2><div class="ce-body"><div class="ce-pv"><canvas id="ce-cv" width="300" height="310"></canvas>
   <div class="ce-nav"><button type="button" class="bt" data-r="-1" title="Girar">↺</button><span>Vista</span><button type="button" class="bt" data-r="1" title="Girar">↻</button></div>
   <div class="ce-ch" id="ce-modes">${MODES.map(([v,l])=>`<button type="button" class="bt ce-b" data-m="${v}">${l}</button>`).join('')}</div></div>
   <div class="ce-op"><label>Nombre</label><input id="ce-name" maxlength="16" placeholder="Tu nombre (3-16)" autocomplete="off" spellcheck="false"><div class="hint" id="ce-err" style="margin:2px 0 0;min-height:20px"></div><label>Cuerpo</label>${chips('g',GEN)}<label>Peinado</label><div class="ce-ch" data-k="hair" id="ce-hair"></div><label>Color de pelo</label>${sw('hc',HC)}<label>Piel</label>${sw('skin',SKIN)}<label>Cara</label>${chips('face',FACE)}<label>Ojos</label>${sw('eye',EYE)}
   <label>Ropa base <input type="color" id="ce-col" title="Color propio"></label>${sw('col',COL)}</div></div>
   <div class="ce-ft"><button type="button" class="bt" id="ce-rnd">🎲 Aleatorio</button><span style="flex:1"></span><button type="button" class="bt" id="ce-no">Cancelar</button><button type="button" class="bt ce-go" id="ce-ok">¡Empezar!</button></div></div>`;
  cv=$$('#ce-cv');g=cv.getContext('2d');
  el.addEventListener('keydown',e=>e.stopPropagation());
  el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
   if(b.dataset.r){dir=((dir+ +b.dataset.r)%8+8)%8}
   else if(b.dataset.m){mode=b.dataset.m;t0=performance.now()}
   else if(b.dataset.v!=null){const k=b.parentNode.dataset.k;A[k]=k==='face'?+b.dataset.v:b.dataset.v}
   sync()});
  $$('#ce-name').oninput=e=>{A.name=e.target.value;check()};
  $$('#ce-col').oninput=e=>{A.col=e.target.value;sync()};
  $$('#ce-rnd').onclick=()=>{const g=pick(GEN)[0];A={g,hair:pick(HAIRS[g])[0],hc:pick(HC),skin:pick(SKIN),col:pick(COL),eye:pick(EYE),face:pick(FACE)[0]};sync()};
  $$('#ce-ok').onclick=()=>{if(valid(A.name))close(true)};$$('#ce-no').onclick=()=>close(false)}
 // nombre del jugador (futuras tablas de clasificación por skill): 3–16 caracteres, letras (con tildes y ñ), números, espacio, _ y -
 const NAME=/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9_ -]{3,16}$/,clean=n=>String(n||'').replace(/\s+/g,' ').trim(),valid=n=>NAME.test(clean(n));
 function check(){const ok=valid(A.name),n=clean(A.name);$$('#ce-ok').disabled=!ok;$$('#ce-err').textContent=!n?'':n.length<3?'Mínimo 3 caracteres.':ok?'':'Solo letras, números, espacio, _ y -.'}
 function hairList(){return HAIRS[A.g==='f'?'f':'m']}
 function sync(){if(!hairList().some(h=>h[0]===A.hair))A.hair='bald';$$('#ce-hair').innerHTML=hairList().map(([v,l])=>`<button type="button" class="bt ce-b" data-v="${v}">${l}</button>`).join('');
  el.querySelectorAll('.ce-ch[data-k]').forEach(c=>c.querySelectorAll('button').forEach(b=>b.classList.toggle('on',String(A[c.dataset.k])===b.dataset.v)));
  el.querySelectorAll('.ce-sw').forEach(c=>c.querySelectorAll('button').forEach(b=>b.classList.toggle('on',A[c.dataset.k]===b.dataset.v)));
  $$('#ce-modes').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.m===mode));
  const ni=$$('#ce-name');if(ni.value!==(A.name||''))ni.value=A.name||'';ni.disabled=!first;check();
  const ci=$$('#ce-col');if(/^#[0-9a-f]{6}$/i.test(A.col))ci.value=A.col}
 // vista previa: el MISMO modelo y las MISMAS animaciones que el juego
 function frame(now){raf=requestAnimationFrame(frame);const t=(now-t0)/1000,W=60,H=62,S=cv.width/W,st={dir,t:1+t,hurt:0,blink:mode==='idle'&&(t%5)<.13};
  if(mode==='walk'||mode==='run'){st.mv=1;st.run=mode==='run';st.w=t*(mode==='run'?11:8)}else if(mode==='wc')st.act={k:'wc',ph:(t*.9)%1,col:'#9a9aa8'};
  const R=HERO.pose(st);g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,cv.width,cv.height);g.setTransform(S,0,0,S,0,0);g.lineJoin='round';
  ORG.rot(R.rot);ORG.noSoft(false);try{ORG.U.heroe(g,W/2,H-12,0,Object.assign({view:R.view,pose:R.pose,item:R.item?Object.assign({},R.item):null,trail:R.trail,collar:'#e8c0a8'},PROPS.appOpts(A)))}catch(x){if(window.console)console.warn('[CREATOR]',x)}finally{ORG.rot(false)}}
 function open(f){if(!el)build();first=!!f;bak=S.app?Object.assign({},S.app):null;A=Object.assign({},DEF,S.app||{});
  $$('#ce-no').style.display=first?'none':'';$$('#ce-ok').textContent=first?'¡Empezar!':'Guardar';
  el.hidden=false;document.body.classList.add('ce-open');mode='idle';t0=performance.now();sync();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame)}
 function close(ok){cancelAnimationFrame(raf);el.hidden=true;document.body.classList.remove('ce-open');
  if(ok){A.name=clean(A.name);S.app=Object.assign({},A);try{save()}catch(e){}}else{S.app=bak||S.app}
  if(typeof dirty!=='undefined')dirty=1}
 if(!/[?&]noedit/.test(location.search)&&(!S.app||!S.app.name))open(true);
 return{open,close,HAIRS,FACE,DEF,get state(){return A}}})();
