// NotScape · editor de personaje (primer inicio y botón «🧑 Personaje»).
// TÉCNICA: un único modelo PARAMÉTRICO (ORG.U.heroe) + animaciones compartidas (HERO.pose). La apariencia es solo un puñado de parámetros
// (peinado, colores, cara) que se pasan al dibujar → personalizar NO exige reanimar nada, y todo peinado/cara/color nuevo funciona ya con todas las animaciones.
// Datos: S.app = {name, g, hair, hc, skin, col, eye, face}. PROPS.appOpts(S.app) lo convierte en opciones del modelo. Un peinado/cara nuevo = una fila en HAIRS (aquí) y en ORG.HAIRS + su forma en hairGeo/faceX de hero2d (style-organic.js).
// Sin S.app (o sin nombre) el juego pregunta al arrancar —también tras Reiniciar—; `?noedit` en la URL lo omite (herramientas de prueba).
// F6b (17 oct 2026, solo ?r3d=1): selector de ATUENDO (S.app.outfit, ids en src/r3d/outfits3d.js) con vista previa 3D (preview3d.js); `openOutfit()` lo abre sin tocar el resto del aspecto.
// Lote R3D-HEROE-NR (17 oct 2026): con ?r3d=1 el editor YA NO enseña nunca el héroe 2D antiguo: mientras carga el módulo 3D muestra «Cargando modelo 3D…» y
//  solo vuelve al 2D si el 3D falla de verdad (boot deja R3D_ON=false, o la vista previa falla 60 fotogramas seguidos). Nuevo: color de BUFANDA (S.app.scarf, solo 3D).
// NO hay botón para reabrirlo: cambiar el aspecto será un ítem de pago en la tienda que llame a CREATOR.open(false) (nombre bloqueado, con Guardar/Cancelar).
const CREATOR=(()=>{
 const HAIRS={m:[['bald','Calvo'],['cut','Corto'],['spiky','Puntas'],['side','Flequillo'],['curly','Rizado'],['mane','Melena']],
   f:[['bald','Calvo'],['long','Largo'],['bun','Moño'],['pony','Coleta'],['bob','Media melena'],['twin','Dos coletas']]}, // calvo = predeterminado (guiño al OSRS); 5 peinados por género
  GEN=[['m','Hombre'],['f','Mujer']],FACE=[[0,'Clásica'],[1,'Pecas'],[2,'Dulce'],[3,'Seria']],
  SKIN=['#f6d4b0','#f0c08a','#d9a066','#b5764a','#8a5232','#5e3a25'],
  HC=['#5a3a22','#2a1a12','#c08a3a','#e8c872','#a83a22','#dcdcdc','#3a5aa0','#7a3aa8'],
  EYE=['#3a2620','#2a5aa0','#2f8a4a','#7a5a2a','#8a3aa8','#3a8a9a'],
  COL=['#c0392b','#e0906a','#d8a030','#6a9a3a','#2f8a6a','#3a7ac0','#6a4ac0','#c04a8a','#8a8f98','#4a4a52'],
  SCARF=['#b8862e','#8a3a2a','#3a4a32','#33335a','#5a5450','#c8bca0'],   // bufanda (acento único del Errante, GUIA_PERSONAJES_3D §2.3): mostaza, vino, musgo, noche, ceniza, lino
  DEF={name:'',g:'m',hair:'bald',hc:'#5a3a22',skin:'#f6d4b0',col:'#c0392b',eye:'#3a2620',face:0,outfit:'errante',scarf:'#b8862e'},
  MODES=[['idle','Reposo'],['walk','Caminar'],['run','Correr'],['wc','Talar']];
 let el,cv,g,A,bak,first=false,mode='idle',dir=2,raf=0,t0=0,cv3=null,pv=null,ofOnly=false,pvFail=0;   // F6b: cv3/pv = vista previa 3D (solo con ?r3d=1); ofOnly = modo «solo atuendo» (botón de la pestaña Personaje)
 const $$=(s,r)=>(r||el).querySelector(s),pick=a=>a[Math.floor(Math.random()*a.length)];
 const sw=(k,list)=>`<div class="ce-sw" data-k="${k}">${list.map(c=>`<button type="button" class="ce-c" data-v="${c}" style="background:${c}" title="${c}"></button>`).join('')}</div>`;
 const chips=(k,list)=>`<div class="ce-ch" data-k="${k}">${list.map(([v,l])=>`<button type="button" class="bt ce-b" data-v="${v}">${l}</button>`).join('')}</div>`;
 function build(){el=document.getElementById('ce');
  el.innerHTML=`<div class="ce-card panel"><h2>Crea tu personaje</h2><div class="ce-body"><div class="ce-pv"><canvas id="ce-cv" width="300" height="310"></canvas><canvas id="ce-cv3" width="300" height="310" hidden></canvas>
   <div class="ce-nav"><button type="button" class="bt" data-r="-1" title="Girar">↺</button><span>Vista</span><button type="button" class="bt" data-r="1" title="Girar">↻</button></div>
   <div class="ce-ch" id="ce-modes">${MODES.map(([v,l])=>`<button type="button" class="bt ce-b" data-m="${v}">${l}</button>`).join('')}</div></div>
   <div class="ce-op"><div id="ce-of" hidden><label>Atuendo <span class="hint" id="ce-ofsub" style="display:inline"></span></label><div class="ce-ch" data-k="outfit" id="ce-outfits"></div></div><div id="ce-sc" hidden><label>Bufanda</label>${sw('scarf',SCARF)}</div><label>Nombre</label><input id="ce-name" maxlength="16" placeholder="Tu nombre (3-16)" autocomplete="off" spellcheck="false"><div class="hint" id="ce-err" style="margin:2px 0 0;min-height:20px"></div><label>Cuerpo</label>${chips('g',GEN)}<label>Peinado</label><div class="ce-ch" data-k="hair" id="ce-hair"></div><label>Color de pelo</label>${sw('hc',HC)}<label>Piel</label>${sw('skin',SKIN)}<label>Cara</label>${chips('face',FACE)}<label>Ojos</label>${sw('eye',EYE)}
   <label>Ropa base <input type="color" id="ce-col" title="Color propio"></label>${sw('col',COL)}</div></div>
   <div class="ce-ft"><button type="button" class="bt" id="ce-rnd">🎲 Aleatorio</button><span style="flex:1"></span><button type="button" class="bt" id="ce-no">Cancelar</button><button type="button" class="bt ce-go" id="ce-ok">¡Empezar!</button></div></div>`;
  cv=$$('#ce-cv');g=cv.getContext('2d');cv3=$$('#ce-cv3');
  el.addEventListener('keydown',e=>e.stopPropagation());
  el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
   if(b.dataset.r){dir=((dir+ +b.dataset.r)%8+8)%8}
   else if(b.dataset.m){mode=b.dataset.m;t0=performance.now()}
   else if(b.dataset.v!=null){const k=b.parentNode.dataset.k;A[k]=k==='face'?+b.dataset.v:b.dataset.v}
   sync()});
  $$('#ce-name').oninput=e=>{A.name=e.target.value;check()};
  $$('#ce-col').oninput=e=>{A.col=e.target.value;sync()};
  $$('#ce-rnd').onclick=()=>{const g=pick(GEN)[0];A=Object.assign({},A,{g,hair:pick(HAIRS[g])[0],hc:pick(HC),skin:pick(SKIN),col:pick(COL),eye:pick(EYE),face:pick(FACE)[0],scarf:pick(SCARF)});sync()};   // conserva nombre y atuendo
  $$('#ce-ok').onclick=()=>{if(valid(A.name))close(true)};$$('#ce-no').onclick=()=>close(false)}
 // nombre del jugador (futuras tablas de clasificación por skill): 3–16 caracteres, letras (con tildes y ñ), números, espacio, _ y -
 const NAME=/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9_ -]{3,16}$/,clean=n=>String(n||'').replace(/\s+/g,' ').trim(),valid=n=>NAME.test(clean(n));
 function check(){const ok=valid(A.name),n=clean(A.name);$$('#ce-ok').disabled=!ok;$$('#ce-err').textContent=!n?'':n.length<3?'Mínimo 3 caracteres.':ok?'':'Solo letras, números, espacio, _ y -.'}
 function hairList(){return HAIRS[A.g==='f'?'f':'m']}
 function sync(){if(!hairList().some(h=>h[0]===A.hair))A.hair='bald';$$('#ce-hair').innerHTML=hairList().map(([v,l])=>`<button type="button" class="bt ce-b" data-v="${v}">${l}</button>`).join('');
  el.querySelectorAll('.ce-ch[data-k]').forEach(c=>c.querySelectorAll('button').forEach(b=>b.classList.toggle('on',String(A[c.dataset.k])===b.dataset.v)));
  el.querySelectorAll('.ce-sw').forEach(c=>c.querySelectorAll('button').forEach(b=>b.classList.toggle('on',A[c.dataset.k]===b.dataset.v)));
  $$('#ce-modes').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.m===mode));
  if(R3()){const OF=window.R3D.outfits;$$('#ce-of').hidden=false;$$('#ce-outfits').innerHTML=OF.list.map(o=>`<button type="button" class="bt ce-b${OF.unlocked(o.id)?'':' dis'}" data-v="${o.id}" ${OF.unlocked(o.id)?'':'disabled'} title="${o.sub}${OF.unlocked(o.id)?'':' · se desbloquea: '+o.unlock}">${o.name}</button>`).join('');
   $$('#ce-outfits').querySelectorAll('button').forEach(b=>b.classList.toggle('on',(A.outfit||'errante')===b.dataset.v));$$('#ce-ofsub').textContent='· '+OF.of(A.outfit).sub;
   $$('#ce-sc').hidden=OF.of(A.outfit).look.outfit.scarf===false}   // la bufanda solo existe en los atuendos que la llevan (hoy el Errante)
  const ni=$$('#ce-name');if(ni.value!==(A.name||''))ni.value=A.name||'';ni.disabled=!first;check();
  const ci=$$('#ce-col');if(/^#[0-9a-f]{6}$/i.test(A.col))ci.value=A.col}
 // vista previa: el MISMO modelo y las MISMAS animaciones que el juego
 const R3=()=>!!(window.R3D&&window.R3D.outfits&&window.R3D_ON!==false);
 function frame3(now){const OF=window.R3D.outfits,oc=OF.of(A.outfit);if(!pv){try{pv=window.R3D.preview(cv3)}catch(x){pv=null;if(window.console)console.warn('[CREATOR 3D]',x)}}
  if(!pv){pvFail++;window.__ceErr=window.__ceErr||'no se pudo crear la vista previa 3D';return false}cv.hidden=true;cv3.hidden=false;
  try{pv.draw(OF.resolve({app:A,gear:oc.look.gear}),{dir,mode,t:(now-t0)/1000+1});pvFail=0;return true}catch(x){pvFail++;window.__ceErr=String(x&&x.message||x);if(window.console&&pvFail<3)console.warn('[CREATOR 3D]',x);return false}}
 // ?r3d=1 pedido y sin fallo permanente: el 2D NO se enseña (era el «personaje antiguo» que veía el dueño mientras cargaba el 3D o si la vista previa fallaba)
 const want3=()=>!!window.R3D_ON&&pvFail<60;
 function waiting(now){cv.hidden=false;cv3.hidden=true;g.setTransform(1,0,0,1,0,0);const w=cv.width,h=cv.height,gr=g.createRadialGradient(w/2,h*.8,10,w/2,h*.6,w*.8);gr.addColorStop(0,'#4a4a42');gr.addColorStop(1,'#24221e');
  g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='rgba(232,216,176,'+(.55+.35*Math.sin(now/300))+')';g.font='600 18px Fredoka, sans-serif';g.textAlign='center';g.fillText(window.__ceErr?'Error en la vista 3D':'Cargando modelo 3D…',w/2,h/2);if(window.__ceErr){g.font='12px sans-serif';g.fillText(String(window.__ceErr).slice(0,60),w/2,h/2+24)}}
 function frame(now){raf=requestAnimationFrame(frame);if(R3()&&$$('#ce-of').hidden)sync();   // el módulo 3D carga después que este script: al estar listo, mostrar el selector
  if(want3()){if(R3()&&frame3(now))return;if(want3()){waiting(now);return}}
  cv.hidden=false;cv3.hidden=true;const t=(now-t0)/1000,W=60,H=62,S=cv.width/W,st={dir,t:1+t,hurt:0,blink:mode==='idle'&&(t%5)<.13};
  if(mode==='walk'||mode==='run'){st.mv=1;st.run=mode==='run';st.w=t*(mode==='run'?11:8)}else if(mode==='wc')st.act={k:'wc',ph:(t*.9)%1,col:'#9a9aa8'};
  const R=HERO.pose(st);g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,cv.width,cv.height);g.setTransform(S,0,0,S,0,0);g.lineJoin='round';
  ORG.rot(R.rot);ORG.noSoft(false);try{ORG.U.heroe(g,W/2,H-12,0,Object.assign({view:R.view,pose:R.pose,item:R.item?Object.assign({},R.item):null,trail:R.trail,collar:'#e8c0a8'},PROPS.appOpts(A)))}catch(x){if(window.console)console.warn('[CREATOR]',x)}finally{ORG.rot(false)}}
 function open(f,only){if(!el)build();ofOnly=!!only&&R3();first=!!f;$$('.ce-op').classList.toggle('of-only',ofOnly);$$('h2').textContent=ofOnly?'Atuendo':'Crea tu personaje';bak=S.app?Object.assign({},S.app):null;A=Object.assign({},DEF,S.app||{});
  $$('#ce-no').style.display=first?'none':'';$$('#ce-ok').textContent=first?'¡Empezar!':'Guardar';$$('#ce-rnd').style.display=ofOnly?'none':'';
  el.hidden=false;document.body.classList.add('ce-open');mode='idle';t0=performance.now();sync();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame)}
 function close(ok){cancelAnimationFrame(raf);el.hidden=true;document.body.classList.remove('ce-open');
  if(ok){A.name=clean(A.name);S.app=Object.assign({},A);try{save()}catch(e){}}else{S.app=bak||S.app}
  if(typeof dirty!=='undefined')dirty=1}
 if(!/[?&]noedit/.test(location.search)&&(!S.app||!S.app.name))open(true);
 window.openOutfit=()=>open(false,true);   // F6b: botón «Atuendo» de la pestaña Personaje (solo ?r3d=1): abre el editor con SOLO el selector de atuendo
 return{open,close,HAIRS,FACE,DEF,get state(){return A}}})();
