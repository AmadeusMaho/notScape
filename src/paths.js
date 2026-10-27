// ─── Rutas del tutorial (acto 3 de la misión de Ru) y aviso de "R para correr" ───
// 3 caminos (guerrero · arquero · mago) con 4 pasos cada uno. Los pasos ocupan SIEMPRE los índices 15–18 de GOALS
// (el tramo se reescribe en el sitio al cambiar de camino), así los índices del resto de la cadena no se mueven.
// El camino NO es permanente mientras no lo termines: se cambia desde la misión principal (panel de objetivos o pestaña Misiones).
const PSEG=15,PEND=19,PCH=14;   // PCH = paso "Elige tu camino"; PSEG..PEND-1 = tramo del camino
const PATHS={
 m:{n:'Guerrero',e:'⚔️',col:'#e5453a',tag:'Cuerpo a cuerpo · Combate',ben:['Pelea cuerpo a cuerpo con espada y escudo','Ventaja: la mejor defensa y aguante','Ventaja: sin munición ni maná; golpe especial (V)'],rw:'sw_cobre~2',
  steps:[['Forja una espada de cobre','make:sw_cobre',1,80,'Funde cobre y forja una espada en el yunque.','S:anvil'],
   ['Fabrica una armadura de cuero','make:ar_cuero',1,100,'Reúne 4 cueros y cóselos en el banco de curtidor del taller.','S:curtidor'],
   ['Derrota a 5 goblins','kill:goblin',5,150,'Los goblins (⚔) atacan al verte. Lleva comida cocinada.','M:goblin'],
   ['Usa tu golpe especial','spec',1,120,'En combate, con energía suficiente, pulsa V y tu siguiente golpe será especial.','M:goblin']]},
 r:{n:'Arquero',e:'🏹',col:'#6ad88a',tag:'A distancia · Arquería',ben:['Dispara desde lejos con arco o ballesta','Ventaja: ataca sin recibir golpes si guarda la distancia','Ventaja: flechas estándar infinitas y munición especial'],rw:'bw_pino~2',
  steps:[['Esculpe un arco de pino','make:bw_pino',1,80,'En el taller se esculpen arcos: troncos de pino y un cuero.','S:bench'],
   ['Fabrica flechas de cobre','make:fl_cobre',1,100,'Cada receta da 30 flechas. Se hacen en el taller con ramas, plumas y cobre.','S:bench'],
   ['Equipa tus flechas','eqammo',1,60,'Abre la mochila (I) y pulsa LMB sobre las flechas: irán a su ranura propia de munición.',''],
   ['Derrota a 5 goblins','kill:goblin',5,150,'Dispara de lejos y retrocede mientras avanzan. Lleva comida.','M:goblin']]},
 g:{n:'Mago',e:'✨',col:'#8a6aff',tag:'Hechizos · Magia',ben:['Lanza hechizos con báculo, gastando maná y runas','Ventaja: gran daño explosivo y elementos contra debilidades','Ventaja: pergaminos de un solo uso, sin coste'],rw:'st_pino~2',
  steps:[['Esculpe un báculo de pino','make:st_pino',1,100,'El taller también esculpe báculos.','S:bench'],
   ['Lanza tu primera bola de fuego','cast',1,80,'Equipa el báculo y pulsa LMB hacia un monstruo: lanzas una bola de fuego (gasta 1 de maná). Mantén LMB para cargarla.',''],
   ['Derrota 3 gallinas','kill:gallina',3,60,'Los monstruos sueltan runas, el combustible de los hechizos.','M:gallina']]}};
const PORD=['m','r','g'];
function pathSeg(){const p=PATHS[S.path||'m'];for(let k=0;k<4;k++)GOALS[PSEG+k]=p.steps[k]}
function gpay(){const g=GOALS[S.goal];if(S.goal>=PSEG&&S.goal<PEND){S.gp=S.gp||{};const k='p'+S.path+S.goal;if(S.gp[k])return 0;S.gp[k]=1}return g[3]}
function giveIt(id,n){for(let i=0;i<(n||1);i++){if(room(id))S.inv.push(id);else S.bank[id]=(S.bank[id]||0)+1}disc(id)}
function pathChk(){if(S.path&&S.goal>=PEND&&!(S.pdone||{})[S.path]){S.pdone=S.pdone||{};S.pdone[S.path]=1;const p=PATHS[S.path];giveIt(p.rw);if(S.path==='r')giveIt('fl_cobre',30);toast('🏅 ¡Camino de '+p.n+' completado!<br>Ru te regala: <b>'+I[p.rw][0]+'</b> <span style="color:#6ab8ff">(raro)</span>'+(S.path==='r'?'<br>+ 30 flechas de cobre':''));log('Completaste el camino de '+p.n+'.');dirty=1}}
const pathOpen=()=>S.goal>=PCH&&S.goal<PEND;
function pathPick(k){if((S.pdone||{})[k]||S.goal>=PEND)return;const first=!S.path,chg=S.path&&S.path!==k;
 S.path=k;S.st.path=1;pathSeg();
 if(chg){S.goal=PSEG;S.gseen=-1;toast(PATHS[k].e+' Camino de <b>'+PATHS[k].n+'</b>')}
 pathClose();S.gseen=-1;dirty=1;snd('quest');chk();save()}
function pathClose(){const o=$('#pathov');if(o)o.classList.remove('on')}
function pathUI(){if(!pathOpen())return;let o=$('#pathov');if(!o){o=document.createElement('div');o.id='pathov';document.body.appendChild(o);o.addEventListener('mousedown',e=>{if(e.target===o||e.target.classList.contains('pcs'))pathClose()});addEventListener('keydown',e=>{if(e.key==='Escape'&&o.classList.contains('on'))pathClose()})}
 const pd=S.pdone||{};
 o.innerHTML='<h1>'+(S.path?'Cambiar de camino':'Elige tu camino')+'</h1><div class="sub">'+(S.path?'Puedes cambiarlo cuando quieras hasta terminarlo. Lo ya hecho cuenta.':'No es permanente: podrás cambiarlo desde tu misión principal. LMB fuera para decidir luego: Ru te espera.')+'</div><div class="pcs">'
 +PORD.map(k=>{const p=PATHS[k],cur=S.path===k,dn=pd[k];return `<div class="pc${cur?' cur':''}${dn?' dn':''}" style="--pa:${p.col}" data-k="${k}"><div class="pe">${p.e}</div><h3>${p.n}</h3><div class="tg">${p.tag}</div><ul>${p.ben.map(b=>'<li>'+b+'</li>').join('')}</ul><div class="ps">${p.steps.map(s=>'<span>'+s[0]+'</span>').join('')}</div><div class="pb">${dn?'Completado':cur?'Tu camino actual':'Elegir'}</div></div>`}).join('')+'</div>'
 +(S.path?'<button class="bt" onclick="pathClose()">Seguir con mi camino</button>':'');
 o.classList.add('on');
 o.querySelectorAll('.pc').forEach(c=>{const k=c.dataset.k;c.onclick=()=>{if(S.path===k)pathClose();else pathPick(k)};
  c.onmousemove=e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;c.style.transition='transform .08s ease-out';c.style.transform='rotateY('+((x-.5)*26).toFixed(1)+'deg) rotateX('+((.5-y)*26).toFixed(1)+'deg) translateZ(18px) scale(1.05)';c.style.setProperty('--gx',(x*100)+'%');c.style.setProperty('--gy',(y*100)+'%')};
  c.onmouseleave=()=>{c.style.transition='transform .45s cubic-bezier(.2,.9,.3,1.2)';c.style.transform=''}})}
// ─── aviso "R para correr": solo en partida nueva, unos segundos después de empezar a moverse ───
let RHT=0,RHO=0;
function runHintTick(dt){if(S.hintR)return;if(S.st.talk||S.goal>0){S.hintR=1;return}RHT+=dt;if(RHT>1.1){S.hintR=1;ctxHint('run',[[['Mayús'],'mantén para correr (gasta resistencia)']],7000)}}   // 22 oct 2026: antes un cartel de papel propio (#rh) que se solapaba con #ctxh; ahora pasa por la cola de ayudas del HUD
function rhHide(){const e=$('#rh');if(e)e.className=''}
