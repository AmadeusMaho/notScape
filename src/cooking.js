// NotScape · COCINA (`co`, 27 oct 2026) — v4 «cocina cenital»: una superestación con SEIS estaciones físicas (Mesa · Fogón · Sartén · Parrilla · Horno · Emplatado) dibujadas en `src/cookkit.js` (global `KIT`).
// Este archivo = DATOS (ingredientes, efectos, métodos, recetas) + FLUJO (elegir → preparar → cocinar → emplatar → plato) + inventario (ids de plato, comer, repetir).
// Decisiones del dueño: (1) al cocinar, los ingredientes con el MISMO efecto se SUMAN (plato más fuerte, como BotW); al COMER, el buff de un mismo efecto NO se acumula (vale el más fuerte); solo hay plato, sin bebida.
// (2) improvisar con lo que sea es posible, pero SIN receta la calidad topa en I (igual que Alquimia); con la receta exacta (mismo método y mismos ingredientes) llega a III. (3) un pez crudo NO entra en la olla hasta filetearlo.
// (4) bajo el mínimo de calidad → plato estropeado. (5) sin combo; «¡Perfecto!», estrellas, emplatado con minijuego, duración corta y «Repetir mejor resultado» (máx. II, sin minijuego).
// (6) cada MÉTODO aporta algo distinto al plato (tabla MET) y el SABOR (especiero + radar) es lo propio de Cocina. (7) el TIER del plato sale de la sustancia y lo limita el nivel de Cocina. (8) efectos ambientales (Abrigo/Frescor/Ignífugo)
// existen como datos; ninguna zona los exige todavía. Se carga DESPUÉS de alchemy.js y cookkit.js, ANTES de game.js; `COC.reg()`/`COC.sweep()` los llama game.js.
// EFECTOS PROPIOS DE COCINA (distintos de las pociones): Vitalidad = PV máximos (carnes), Aguante = resistencia (regenera más deprisa y gasta menos al correr; pescados y cereales), Regeneración, Dureza, Sabiduría y los ambientales. Vigor/Celeridad/Maná se comparten con Alquimia pero casi no salen de la comida.
// ── DATOS: ingrediente nuevo = una fila en ING (y su preparación en prepOf si no es la de su familia) ───────────────────────────────────────────────────────────────────────────
//   [sustancia (cura), sabores (d dulce · s salado · a amargo · p picante · u umami), {efecto:fuerza}]
const COC=(()=>{
 const FX={reg:['Regeneración','#d8584a','reconstituyente'],vig:['Vigor','#e8a030','vigorizante'],vel:['Celeridad','#8ad0e8','ligero'],def:['Dureza','#9aa0b0','recio'],abr:['Abrigo','#ff9a3a','reconfortante'],fre:['Frescor','#bfe8ff','refrescante'],ign:['Ignífugo','#ff5a2a','ignífugo'],sab:['Sabiduría','#9a78d0','erudito'],man:['Maná','#4a7ae0','arcano'],hpm:['Vitalidad','#e86a7a','robusto'],sta:['Aguante','#7ac8a0','resistente']};
 const FXI={reg:'💚',hpm:'❤️',sta:'🏃',def:'🛡️',vig:'💪',vel:'💨',abr:'🔥',fre:'❄️',ign:'🧯',sab:'📜',man:'🔷'},SPFX={d:'reg',s:'sta',a:'sab',p:'vig',u:'hpm'};   // icono de cada efecto · efecto que añade cada especia (0,5 de especia = +1 punto)
 const FXK=Object.keys(FX),FL={d:['Dulce','#f0a8c8'],s:['Salado','#e8e0d0'],a:['Amargo','#7ab058'],p:['Picante','#e8582a'],u:['Umami','#c88a4a']};
 const BUFK={vig:'dmg',vel:'spd',def:'def',sab:'xp',man:'mreg'};   // efectos que reutilizan los temporizadores S.buf del juego (la magnitud es fija; el nivel cambia duración y comparación)
 const ING={
  carne:[5,'u',{hpm:1}],jamon:[6,'s',{hpm:1,sta:1}],carne_jab:[6,'u',{hpm:2}],carne_yak:[7,'u',{abr:3,hpm:1}],carne_lag:[7,'p',{ign:3,hpm:1}],carne_oso:[8,'u',{hpm:2,def:2}],carne_gig:[9,'u',{abr:2,hpm:3}],
  pollo:[4,'s',{reg:1,sta:1}],huevo:[3,'s',{sab:1,reg:1}],ancas:[4,'u',{sta:2}],hongo:[2,'a',{sab:2,man:1}],grasa:[2,'s',{abr:1}],arroz:[3,'d',{reg:1,sta:1}],sal_vol:[0,'s',{ign:2,def:1}],
  camaron:[3,'s',{sta:1}],sardina:[3,'s',{reg:1}],arenque:[3,'s',{reg:1,abr:1}],trucha:[4,'u',{sta:1,reg:1}],salmon:[5,'u',{reg:2,sta:1}],atun:[6,'u',{hpm:2,reg:1}],lucio:[5,'u',{def:2}],pmagma:[6,'p',{ign:3}],
  pezespada:[8,'u',{hpm:3,sta:2}],manta:[8,'u',{sab:2,reg:2}],kraken:[10,'u',{sab:3,hpm:2}],
  h_manzanilla:[1,'d',{reg:2}],h_ortiga:[0,'a',{vig:1}],h_trebol:[1,'d',{sab:1,man:1}],h_lavanda:[1,'da',{reg:1,sab:1}],h_salvia:[1,'a',{def:2}],h_helecho:[1,'a',{man:2,sab:1}],h_loto:[2,'d',{reg:2,man:1}],h_genciana:[0,'a',{vig:2,sta:1}],
  h_escarcha:[0,'a',{fre:3}],h_brasaflor:[0,'p',{abr:3}],h_cenizaviva:[0,'p',{ign:3,abr:1}],h_espinainf:[0,'pa',{ign:2,vig:2}],h_flormundo:[2,'d',{reg:3,sab:2}]};
 const PFX=[[/^carne/,[4,'u',{}]],[/^(c|f)_/,null],[/^h_/,[1,'a',{reg:1}]]];
 const props=id=>{const b=String(id).split('~')[0];if(ING[b])return ING[b];for(const[r,p]of PFX)if(r.test(b))return p;return null};
 // PREPARACIÓN en la MESA antes de cocinar: fish = escamar + filetear (OBLIGATORIA: un pez crudo no entra) · cut = cortar al compás (carne) · chop = picar de un tajo (hierbas, hongos). El resto (arroz, grasa, huevo, sal) entra tal cual.
 const FISH=/^(sardina|arenque|trucha|salmon|atun|lucio|pmagma|pezespada|manta|kraken)$/;
 const prepOf=id=>{const b=String(id).split('~')[0];return FISH.test(b)?'fish':/^(carne|pollo|ancas)/.test(b)?'cut':/^(h_|hongo$)/.test(b)?'chop':null};
 const PN={fish:'Limpiar y filetear',cut:'Cortar',chop:'Picar'};
 // MÉTODOS (la estación): cada uno cambia el plato. g Guiso (fogón) · s Frito (sartén) · p Asado (parrilla) · h Horneado (horno). heal = multiplicador de curación, dur = de la duración de los efectos, max = ingredientes máximos
 const MET={g:{n:'Guiso',st:'Fogón',heal:1,dur:1,max:6,desc:'Suma todo y llega lejos. Hasta 6 ingredientes. Fuego a fuego lento y remover.'},s:{n:'Frito',st:'Sartén',heal:.9,dur:1.3,max:4,desc:'Efectos más duraderos. Hasta 4 ingredientes. Remueve, voltea y sazona.'},
  p:{n:'Asado',st:'Parrilla',heal:1.25,dur:.9,max:3,desc:'Mucha curación. Hasta 3 ingredientes. Reparte las piezas por las zonas de calor.'},h:{n:'Horneado',st:'Horno',heal:1,dur:1.6,max:5,desc:'Efectos larguísimos. Hasta 5 ingredientes. Regula el horno y abre a tiempo.'}};
 const maxIng=()=>Math.min(6,2+Math.floor(L('co')/15)),maxIngM=m=>Math.min(maxIng(),MET[m].max),nFx=n=>n>=6?3:n>=4?2:1;
 const capTier=()=>Math.max(1,Math.min(6,1+Math.floor(L('co')/18)));   // el nivel de Cocina limita el tier del plato (progresión, como cap() en Alquimia)
 const ROM=['I','II','III'],QM=[.85,1,1.3];
 // RECETAS (fórmulas; método + ingredientes exactos + perfil de sabor `tg` ideal): seguirlas = hasta calidad III. Por ahora se desbloquean por nivel (PROVISIONAL: llegarán de Maestros, libros y encargos)
 const RECIPES=[{name:'Caldo de manzanilla',lvl:1,m:'g',ing:['h_manzanilla','arroz'],tg:{d:.6,s:.3}},{name:'Sopa de trucha',lvl:3,m:'g',ing:['trucha','h_manzanilla'],tg:{u:.5,d:.35,s:.4}},
  {name:'Asado de jabalí',lvl:9,m:'p',ing:['carne_jab','grasa'],tg:{u:.5,s:.5}},{name:'Estofado de jabalí',lvl:15,m:'g',ing:['carne_jab','h_salvia','arroz'],tg:{u:.4,a:.35,d:.35,s:.45}},
  {name:'Sopa de salmón',lvl:20,m:'g',ing:['salmon','h_loto','arroz'],tg:{u:.45,d:.6,s:.4}},{name:'Guiso de oso',lvl:30,m:'g',ing:['carne_oso','h_salvia','grasa','arroz'],tg:{u:.5,a:.35,s:.5,d:.35,p:.35}},
  {name:'Festín del mar',lvl:45,m:'h',ing:['atun','salmon','h_loto','arroz','grasa'],tg:{u:.7,d:.5,s:.5}},{name:'Pollo frito con hierbas',lvl:6,m:'s',ing:['pollo','h_lavanda'],tg:{s:.5,d:.3,a:.3}},
  // recetas SIMPLES del TUTORIAL (un solo ingrediente, sin preparar): dan los platos clásicos c_camaron y f_camaron (cuentan para las misiones) y nunca se estropean mientras sean el paso actual
  {name:'Camarones asados',lvl:0,m:'p',ing:['camaron'],tg:{s:.4},out:'c_camaron'},{name:'Camarones fritos',lvl:0,m:'s',ing:['camaron','grasa'],tg:{s:.5},out:'f_camaron'}];
 const HB=Object.keys(ING).filter(k=>/^h_/.test(k)),herbsHave=()=>HB.filter(k=>have(k)>0).slice(0,4);   // hierbas de Herbolaria que puedes espolvorear como sazón (máx. 4 a la vista)
 /* TUTORIAL: mientras el paso actual es cocinar un plato clásico (camarones asados/fritos), la interfaz solo ofrece el método y el ingrediente que hacen falta (nada con que confundirse) */
 const tutRec=()=>{let k=null;try{if(typeof ISLA!=='undefined'&&ISLA.on&&ISLA.on()){const n=ISLA.STEPS[ISLA.step];if(n&&n.g&&n.g.t==='make')k=n.g.k}}catch(e){}if(!k&&GOALS&&GOALS[S.goal]){const q=GOALS[S.goal][1]||'';if(q.indexOf('make:')===0)k=q.slice(5)}return k?RECIPES.find(r=>r.out===k&&r.lvl===0)||null:null};
 const keyOf=(sel,m)=>sel.slice().sort().join('+')+'|'+m,recOf=(sel,m)=>RECIPES.find(r=>r.lvl<=L('co')&&r.m===m&&keyOf(r.ing,r.m)===keyOf(sel,m));
 // ── mezcla ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 function mix(sel,sp,hb){let sus=0;const fx={},fl={};sel.forEach(id=>{const p=props(id);if(!p)return;sus+=p[0];for(const c of p[1])fl[c]=(fl[c]||0)+1;for(const k in p[2])fx[k]=(fx[k]||0)+p[2][k]});
  if(sp)for(const k in SPFX){const pts=Math.floor((sp[k]||0)/.5);if(pts>0)fx[SPFX[k]]=(fx[SPFX[k]]||0)+pts}   // las ESPECIAS suman puntos de efecto (la miel regenera, la sal da aguante…)
  if(hb)for(const id in hb){const p=props(id),n=hb[id];if(!p||!n)continue;for(const c of p[1])fl[c]=(fl[c]||0)+.5*n;for(const k in p[2])fx[k]=(fx[k]||0)+Math.ceil(p[2][k]/2)*n}   // HIERBAS FRESCAS espolvoreadas (sazón): cada una suma la MITAD de sus puntos de efecto y medio punto de sabor (no ocupan casilla de ingrediente)
  const n=sel.length;const top=Object.entries(fx).sort((a,b)=>b[1]-a[1]).slice(0,nFx(n)).filter(e=>e[1]>0).map(e=>e[0]);top.sort((a,b)=>FXK.indexOf(a)-FXK.indexOf(b));
  const lv=k=>Math.max(1,Math.min(3,Math.ceil(fx[k]/2))),ti=Math.max(1,Math.min(capTier(),1+Math.floor(sus/5)));   // BotW: los puntos del MISMO efecto se SUMAN en su nivel; la sustancia suma la curación (tier)
  return{sus,fx,fl,n,top:top.map(k=>[k,lv(k)]),ti}}
 // ── objetos: pl_<efecto><nivel>[-…]_<tier 1-6><calidad 1-3><método g/s/p/h>  (p. ej. pl_vig2-reg1_43s = Frito) ───────────────────────────────────────────────────────────────
 const idOf=(top,ti,q,m)=>'pl_'+(top.length?top.map(([k,l])=>k+l).join('-'):'n')+'_'+ti+(q+1)+(m||'g');
 const parse=id=>{const x=/^pl_((?:[a-z]{3}[1-3]-){0,2}[a-z]{3}[1-3]|n)_([1-6])([1-3])([gsph])?$/.exec(id);if(!x)return null;const top=x[1]==='n'?[]:x[1].split('-').map(t=>[t.slice(0,3),+t[3]]);return top.every(([k])=>FX[k])?{top,ti:+x[2],q:+x[3]-1,m:x[4]||'g'}:null};
 const LVW=['','muy ','sumamente '],adj=top=>top.map(([k,l])=>LVW[l-1]+FX[k][2]).join(' y '),EMO={g:'🍲',s:'🍳',p:'🍖',h:'🥧'};
 const healOf=(ti,q,m)=>Math.round((3+ti*3.2)*QM[q]*MET[m].heal);
 function defOf(top,ti,q,m){return[MET[m].n+(top.length?' '+adj(top):' sencillo')+' '+ROM[q],EMO[m],Math.round((8+ti*14)*(1+q*.5)),healOf(ti,q,m)]}
 function ensure(id){if(I[id])return true;const f=parse(id);if(!f)return false;I[id]=defOf(f.top,f.ti,f.q,f.m);return true}
 /* los ids de plato son demasiados para registrarlos todos: se crean al cocinarlos y al cargar la partida (`sweep`, llamado desde game.js tras leer el guardado). Un plato que salga de otro sitio debe pasar por ensure() */
 function reg(){ensure(idOf([],1,0,'g'))}
 function sweep(){S.inv.forEach(ensure);Object.keys(S.bank||{}).forEach(ensure)}
 // ── estado ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 let G=null,SEL=[],STN=null,OPEN=false,SKIP=false,METH='g';
 const AUTO=()=>typeof COOKA!=='undefined'&&!/[?&]cookmg/.test(location.search);   // COCINA AUTOMÁTICA (src/cookauto.js) por defecto; `?cookmg` vuelve a los minijuegos manuales
 const known=id=>!!(S.cok||{})[String(id).split('~')[0]];
 function el(){let e=document.getElementById('alq');if(!e){e=document.createElement('div');e.id='alq';document.body.appendChild(e)}return e}
 function close(){if(AUTO())COOKA.close();OPEN=false;G=null;const e=document.getElementById('alq');if(e)e.style.display='none'}
 function open(stn){if(G)return;STN=stn||STN;if(typeof A!=='undefined'&&A)stopA();if(AUTO()){COOKA.open(STN);return}start()}
 function candidates(){const seen={},T=tutRec();S.inv.forEach(id=>{const b=id.split('~')[0];if(props(b)&&!seen[b]&&(!T||T.ing.indexOf(b)>=0))seen[b]=1});return Object.keys(seen)}
 const propTxt=id=>{const p=props(id);if(!p)return'';const pr=prepOf(id),base='<b style="color:#e8cf94">Sustancia '+p[0]+'</b> '+(pr?'<b style="color:#c8b888">⚙ '+PN[pr]+'</b> ':'');if(!known(id))return base+'<i class="aq-u">sabor y efectos: se descubren al cocinarlo</i>';
  return base+[...p[1]].map(c=>'<b style="color:'+FL[c][1]+'">'+FL[c][0]+'</b>').join(' ')+' '+Object.entries(p[2]).map(([k,v])=>'<b style="color:'+FX[k][1]+'">'+FX[k][0]+' '+v+'</b>').join(' ')};
 // ── puesta en marcha ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 const WW=800,HH=460;
 function start(){OPEN=true;SEL=[];{const T=tutRec();if(T)METH=T.m}G={t:0,stage:'pick',sel:[],chunks:[],q:[],mg:null,pr:[],sp:{d:0,s:0,a:0,p:0,u:0},fx:[],pops:[],kk:{},k:null,hs:0,shake:0,meth:METH,res:null,M:null,rec:null,potCol:null,jar:null,dr:null,cres:null,plate:0};KIT.camInit(G);
  const e=el();e.className='aq-brew';e.style.display='block';
  e.innerHTML='<div class="aq-tb"><span class="aq-tt">🍲 Cocina</span><div class="aq-tg"><button data-t="quick" title="Repite al instante tu mejor resultado con la última mezcla">⚡ Repetir mejor resultado</button><button data-t="old" title="Asar o freír un solo ingrediente, sin mezclar">🍖 Asar rápido</button></div><button data-t="x" class="aq-x" title="Cerrar (Esc)">✕ Cerrar</button></div><div class="aq-bd"><canvas class="aq-cv" width="1600" height="920"></canvas><div class="aq-sh"></div></div><div class="aq-bot"><div class="aq-p"></div></div><div class="aq-h"></div>';if(tutRec())e.querySelectorAll('.aq-tg button').forEach(b=>{if(['rec','quick','old'].indexOf(b.dataset.t)>=0)b.style.display='none'});
  const cv=e.querySelector('canvas'),xy=ev=>{const r=cv.getBoundingClientRect();return[(ev.clientX-r.left)/r.width*WW,(ev.clientY-r.top)/r.height*HH]};
  let tPrev=0;cv.onpointerdown=ev=>{if(ev.button!==0||!G||G.res)return;try{cv.setPointerCapture(ev.pointerId)}catch(e){}const[x,y]=xy(ev);tPrev=performance.now();KIT.input(G,'down',x,y,16)};
  cv.onpointermove=ev=>{if(!G||G.res)return;const[x,y]=xy(ev),n=performance.now();KIT.input(G,'move',x,y,n-tPrev);tPrev=n};cv.onpointerup=cv.onpointercancel=ev=>{if(!G)return;const[x,y]=xy(ev);KIT.input(G,'up',x,y,16)};cv.oncontextmenu=ev=>ev.preventDefault();
  e.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>tb(b.dataset.t));{const T=tutRec();if(T&&T.ing.every(id=>have(id)>=1))setSel(T.ing)}shelf()}
 const idle=()=>G&&G.stage==='pick';
 function tb(t){if(!G||G.res)return;if(t==='x'){close();return}if(t==='old'){close();SKIP=true;if(STN)openIW(STN);return}if(t==='quick'){quick(S.cql);return}drawer(G.dr===t?null:t)}
 function setMeth(m){if(!idle()||!MET[m])return;const T=tutRec();if(T&&m!==T.m){toast('Ahora solo necesitas «'+MET[T.m].n+'»');return}METH=G.meth=m;SEL=SEL.slice(0,maxIngM(m));G.sel=SEL.slice();shelf();tn_(520)}
 function stationClick(m){if(!idle()||!MET[m])return;const T=tutRec();if(T&&m!==T.m){toast('Ahora solo necesitas «'+MET[T.m].n+'»');return}if(!ready()){toast('Primero elige los ingredientes (arriba) o una receta');return}METH=G.meth=m;SEL=SEL.slice(0,maxIngM(m));G.sel=SEL.slice();if(!(SEL.length>=2||recOf(SEL,m))){toast('Con esa estación hace falta algo más');shelf();return}go()}
 const tn_=f=>{try{tone(f,.05,'triangle',.04,700)}catch(e){}};
 function setSel(ids){if(!idle())return;SEL=ids.slice(0,maxIngM(G.meth));G.sel=SEL.slice()}

 // ── ESTANTE SUPERIOR: despensa (lo que llevas) + recetas + «en la mesa» + guía paso a paso (27 oct 2026; sustituye al cajón lateral de ingredientes) ─────────────────────────────────────
 const SPN={d:'miel',s:'sal',a:'hierbas',p:'pimienta',u:'caldo'},CHT={g:'remueve y mantén el fuego en la franja verde',s:'voltea con la espátula y sirve cuando se dore',p:'mueve las piezas entre las zonas de calor y voltea',h:'regula la temperatura y abre la puerta en la franja dorada'};
 const nm=id=>I[id]?I[id][0]:id;
 // pasos de lo que vas a cocinar: preparar cada ingrediente · cocinar · sazonar (si la receta lo pide) · emplatar
 const sameIng=(a,b)=>a.length===b.length&&a.slice().sort().join('+')===b.slice().sort().join('+'),recFor=sel=>RECIPES.find(r=>r.lvl<=L('co')&&sameIng(r.ing,sel))||null,ready=()=>SEL.length>=2||!!recFor(SEL);
 function stepsOf(sel,m){const rc=m?recOf(sel,m):recFor(sel),L2=[],seen={};sel.forEach(id=>{if(seen[id])return;seen[id]=1;const k=prepOf(id);if(k)L2.push({t:PN[k][0].toUpperCase()+PN[k].slice(1)+' '+nm(id).toLowerCase(),k:'prep'})});
  L2.push({t:m?'Cocina en '+MET[m].st.toLowerCase()+': '+CHT[m]:'Elige la estación y cocina',k:'cook'});
  if(rc&&rc.tg){const tk=Object.keys(rc.tg).sort((a,b)=>rc.tg[b]-rc.tg[a])[0];if(tk&&rc.tg[tk]>=.3&&KIT.spiceOn(tk))L2.push({t:'Sazona con '+SPN[tk],k:'spice',tk,opt:1})}
  L2.push({t:'Sirve (emplatar es opcional)',k:'plate'});return{L:L2,rc}}
 function stepNow(g,S2){let np=S2.L.filter(x=>x.k==='prep').length;if(g.stage==='pick')return -1;if(g.stage==='prep')return Math.min(np-1,g.pr.length);if(g.stage==='cook')return np;return S2.L.length-1}
 function guideHTML(g){const sel=g.stage==='pick'?SEL:g.sel;if(!sel.length)return'';const S2=stepsOf(sel,g.stage==='pick'?(recFor(sel)||{}).m:g.meth),cur=stepNow(g,S2);
  return(S2.rc?'<b class="aq-gr">'+S2.rc.name+'</b>':'<b class="aq-gr aq-imp">Mezcla improvisada</b>')+S2.L.map((x,i)=>{const done=i<cur||(x.k==='spice'&&g.sp&&g.sp[x.tk]>=.3);return'<span class="aq-gs'+(i===cur?' cur':'')+(done?' ok':'')+'"><i>'+(done?'✓':i+1)+'</i>'+x.t+'</span>'}).join('')}
 function shelf(){const g=G,e=document.querySelector('#alq .aq-sh');if(!e||!g)return;if(g.stage!=='pick'){e.style.display='none';return}e.style.display='block';
  const T=tutRec(),cs=candidates(),used={},mx=maxIngM(g.meth);SEL.forEach(id=>used[id]=(used[id]||0)+1);
  const chip=id=>{const left=have(id)-(used[id]||0),p=props(id);return'<button class="aq-ch'+(left<=0||SEL.length>=mx?' off':'')+(used[id]?' on':'')+'" data-add="'+id+'" title="'+nm(id)+(p?' · sustancia '+p[0]:'')+'"><span class="ic">'+ic(id)+'</span><b>'+nm(id)+'</b><em>×'+Math.max(0,left)+'</em>'+(used[id]?'<u>'+used[id]+'</u>':'')+'</button>'};
  const R=S.cor||{},lv=L('co'),fs=RECIPES.filter(r=>r.lvl<=lv&&(!T||r===T)),fk={};fs.forEach(r=>fk[keyOf(r.ing,r.m)]=1);const cur=recFor(SEL);
  const rchip=(name,ing,m,best,form)=>{const miss=ing.filter((id,i)=>have(id)<ing.filter(x=>x===id).length&&ing.indexOf(id)===i),ok=!miss.length&&ing.length<=maxIngM(m),k=keyOf(ing,m),on=cur&&keyOf(cur.ing,cur.m)===k;
   return'<button class="aq-ch aq-rc'+(ok?'':' off')+(on?' on':'')+'" data-rk="'+k+'" title="'+(ok?'Pulsa para elegir esta receta':'Te falta: '+miss.map(nm).join(', '))+'"><b>'+name+'</b><em>'+MET[m].n+(best>=0?' · '+ROM[best]:'')+'</em><small>'+ing.map(nm).join(' + ')+(ok?'':' (falta)')+'</small></button>'};
  const rec=fs.map(r=>rchip(r.name,r.ing,r.m,(R[keyOf(r.ing,r.m)]||{best:-1}).best,1)).join('')+(T?'':Object.keys(R).filter(k=>!fk[k]).map(k=>rchip(R[k].name,R[k].sel,R[k].m||'g',R[k].best,0)).join(''));
  const okRec=rec.indexOf('aq-rc"')>=0||rec.indexOf('aq-rc on')>=0;
  e.innerHTML='<div class="aq-sr"><span class="aq-sx">Ingredientes</span><div class="aq-chips">'+(cs.length?cs.map(chip).join(''):'<i class="aq-u">No llevas nada cocinable: caza, pesca o recolecta hierbas.</i>')+'</div></div>'
   +(okRec?'<div class="aq-sr"><span class="aq-sx">o receta</span><div class="aq-chips">'+rec.replace(/<button class="aq-ch aq-rc off"[^]*?<\/button>/g,'')+'</div></div>':'')
   +(SEL.length?'<div class="aq-sr aq-mesa"><span class="aq-sx">Elegidos</span><div class="aq-chips">'+SEL.map((id,i)=>'<button class="aq-ch on" data-del="'+i+'" title="Quitar"><span class="ic">'+ic(id)+'</span><b>'+nm(id)+'</b><u>×</u></button>').join('')+'</div></div>':'')
   +'<div class="aq-go2'+(ready()?' on':'')+'">'+(ready()?(cur?'Receta: '+cur.name+' · ':'')+'Ahora toca la estación donde quieras cocinarlo ↓':'Elige ingredientes (o una receta); luego toca una estación')+'</div>';
  e.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>setMeth(b.dataset.m));
  e.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{if(!b.classList.contains('off')){setSel(SEL.concat(b.dataset.add));shelf();tn_(660)}});
  e.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{const s2=SEL.slice();s2.splice(+b.dataset.del,1);setSel(s2);shelf()});
  e.querySelectorAll('[data-rk]').forEach(b=>b.onclick=()=>{if(b.classList.contains('off')){toast(b.title);return}const r=recByKey(b.dataset.rk);if(r){const T2=tutRec();if(!T2||r.m===T2.m)METH=G.meth=r.m;setSel(r.sel);shelf();tn_(720)}});
}
 // ── cajones (ingredientes · recetas) ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 function drawer(kind){const g=G,e=document.querySelector('#alq .aq-dr');if(!e||!g)return;g.dr=kind;document.querySelectorAll('#alq .aq-tg button').forEach(b=>b.classList.toggle('on',b.dataset.t===kind));if(!kind){e.style.display='none';return}e.style.display='block';
  const locked=!idle();
  if(kind==='ing'){const cs=candidates(),used={},mx=maxIngM(g.meth);SEL.forEach(id=>used[id]=(used[id]||0)+1);
   e.innerHTML='<h4>Método</h4><div class="aq-v">'+Object.keys(MET).filter(m=>!tutRec()||m===tutRec().m).map(m=>'<button class="aq-so'+(g.meth===m?' on':'')+'" data-m="'+m+'" title="'+MET[m].desc+'"'+(locked?' disabled':'')+'>'+MET[m].n+' · '+MET[m].st+'</button>').join('')+'</div><p class="aq-u">'+MET[g.meth].desc+'</p><h4>Ingredientes <small>(hasta '+mx+')</small></h4><p class="aq-u">'+(locked?'Ya estás cocinando.':'Cada ingrediente se prepara en la mesa antes de cocinarlo. Los ingredientes con el mismo efecto se SUMAN y hacen el plato más fuerte. Al comer, un efecto igual no se acumula. Sin receta, la calidad topa en I.')+'</p><div class="aq-g">'+(cs.length?cs.map(id=>{const left=have(id)-(used[id]||0);return'<div class="aq-c'+(left<=0&&!used[id]?' off':'')+'"><span>'+(I[id]?I[id][1]:'')+' '+(I[id]?I[id][0]:id)+' <em>×'+Math.max(0,left)+'</em></span><small>'+propTxt(id)+'</small><div class="aq-pm"><button data-del="'+id+'"'+(used[id]&&!locked?'':' class="off"')+'>−</button><b>'+(used[id]||0)+'</b><button data-add="'+id+'"'+(left>0&&SEL.length<mx&&!locked?'':' class="off"')+'>+</button></div></div>'}).join(''):'<p class="aq-u">No llevas nada cocinable: caza, pesca o recolecta hierbas.</p>')+'</div>'+(locked?'':'<div class="aq-pred">'+predTxt()+'</div><button class="aq-go'+(SEL.length>=2||recOf(SEL,g.meth)?'':' off')+'" data-ok="1">Listo: a cocinar</button>');
   e.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>setMeth(b.dataset.m));
   e.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{if(!b.classList.contains('off')){setSel(SEL.concat(b.dataset.add));drawer('ing')}});
   e.querySelectorAll('[data-ok]').forEach(b=>b.onclick=()=>{if(SEL.length>=2||recOf(SEL,G.meth))go();else toast('Elige al menos 2 ingredientes (o una receta sencilla)')});
   e.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{if(!b.classList.contains('off')){const k=SEL.lastIndexOf(b.dataset.del);if(k>=0){const s=SEL.slice();s.splice(k,1);setSel(s)}drawer('ing')}})}
  else if(kind==='rec'){const R=S.cor||{},lv=L('co'),fs=RECIPES.filter(r=>r.lvl<=lv),fk={};fs.forEach(r=>fk[keyOf(r.ing,r.m)]=1);
   const row=(name,sel,m,best,form)=>{const ok=!locked&&sel.length<=maxIngM(m)&&sel.every(id=>have(id)>=sel.filter(x=>x===id).length);const k=keyOf(sel,m);return'<div class="aq-rr"><span class="n"><b>'+name+'</b> <em>'+MET[m].n+' · '+(form?'receta · hasta III':'improvisada · máx. I')+(best>=0?' · mejor '+ROM[best]:'')+'</em><br><em>'+sel.map(id=>I[id]?I[id][0]:id).join(' + ')+'</em></span><button data-k="'+k+'"'+(ok?'':' disabled')+'>Cargar</button>'+(best>=0?'<button data-q="'+k+'"'+(ok?'':' disabled')+'>⚡</button>':'')+'</div>'};
   e.innerHTML='<h4>Recetas</h4><p class="aq-u">Seguir una receta (mismo método e ingredientes) con buen sabor y buenas preparaciones llega a calidad III. Las demás mezclas topan en I.</p>'+fs.map(r=>row(r.name,r.ing,r.m,(R[keyOf(r.ing,r.m)]||{best:-1}).best,true)).join('')+Object.keys(R).filter(k=>!fk[k]).map(k=>row(R[k].name,R[k].sel,R[k].m||'g',R[k].best,false)).join('')+(fs.length||Object.keys(R).length?'':'<p class="aq-u">Aún no hay recetas.</p>');
   e.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{const r=recByKey(b.dataset.k);if(r){setMeth(r.m);setSel(r.sel);drawer('ing')}});e.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>quick(b.dataset.q))}}
 function recByKey(k){const m=k.split('|')[1]||'g',r=RECIPES.find(r=>keyOf(r.ing,r.m)===k&&r.lvl<=L('co'));if(r)return{sel:r.ing.slice(),m:r.m};const c=(S.cor||{})[k];return c?{sel:c.sel.slice(),m}:null}
 function predTxt(){if(SEL.length<2&&!recOf(SEL,G.meth))return'<i class="aq-u">Elige al menos 2 ingredientes.</i>';const M=mix(SEL),rc=recOf(SEL,G.meth);return(rc?'<b>Receta: '+rc.name+'</b> · puede llegar a III<br>':'<i class="aq-u">Improvisada: calidad máx. I.</i><br>')+MET[G.meth].n+' · cura '+healOf(M.ti,1,G.meth)+' PV (tier '+M.ti+')'+(M.top.length?' · '+M.top.map(([k,l])=>'<b style="color:'+FX[k][1]+'">'+FX[k][0]+' '+ROM[l-1]+'</b>').join(' · '):'')}
 // ── flujo: Listo → preparar en la MESA → cocinar en la estación del método → EMPLATAR → plato ─────────────────────────────────────────────────────────────────────────────────
 function mkChunk(id,i,stars){const a=(i*1.7)%6.28;return{id,x:0,y:0,hx:0,hy:0,r:17,a,s:'board',ft:0,sx:0,sy:0,stars}}
 function go(){const g=G;if(!idle()||(SEL.length<2&&!recOf(SEL,g.meth)))return;g.sel=SEL.slice();S.cql=keyOf(g.sel,g.meth);g.rec=recOf(g.sel,g.meth);g.M=mix(g.sel);g.q=[];g.chunks=[];g.pr=[];g.sp={d:0,s:0,a:0,p:0,u:0};g.hb={};g.stage='prep';drawer(null);
  g.sel.forEach((id,i)=>{const k=prepOf(id);if(k)g.q.push({id,k,i});else g.chunks.push(mkChunk(id,i,0))});
  if(g.q.length)KIT.mesaStart(g);nextPrep()}
 function nextPrep(){const g=G;if(!g.q.length){toCook();return}const p=g.q.shift();g.mg=KIT.mgNew(g,p.k,p.id,p.i)}
 function prepDone(m){const g=G,ch=mkChunk(m.id,m.i,m.stars);ch.cut=m.kind==='cut'||m.kind==='chop';g.chunks.push(ch);nextPrep()}
 function toCook(){const g=G;g.stage='cook';g.chunks.sort((a,b)=>g.sel.indexOf(a.id)-g.sel.indexOf(b.id));KIT.cookInit(g)}
 function cookDone(r){const g=G;g.cres=r;g.stage='plate';KIT.plateInit(g)}
 function plateDone(sc){const g=G;g.plate=sc;finish()}
 // ── resultado ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 function finish(){const g=G,cr=g.cres||{cook:0};if(g.res)return;const M=mix(g.sel,g.sp,g.hb),prep=g.pr.length?g.pr.reduce((a,b)=>a+b,0)/g.pr.length:.85,sab=KIT.sabor(g),rec=g.rec,
  score=Math.max(0,Math.min(1,cr.cook*.45+prep*.2+sab*.2+g.plate*.12+(rec?.03:0))),burnt=!!cr.burnt;let q=score>=.86?2:score>=.66?1:0;if(!rec)q=Math.min(q,0);   // SIN receta topa en I
  const tut=rec&&rec.out&&GOALS[S.goal]&&GOALS[S.goal][1]==='make:'+rec.out,fail=(burnt||score<.4)&&!tut,m=g.meth,out=fail?'quemado':(rec&&rec.out)||idOf(M.top,M.ti,q,m);ensure(out);   // el paso de cocina del tutorial nunca se estropea
  g.res={out,q,cook:cr.cook,prep,sab,plate:g.plate,score,burnt,M,fail,rec,m};if(g.hb&&Object.keys(g.hb).length)take(g.hb);   // la sazón de hierbas se gasta hayas triunfado o no
  const key=keyOf(g.sel,m),R=S.cor||(S.cor={});
  if(!fail){add(out);if(rec&&rec.out)inc('make:'+rec.out);const isNew=!R[key];if(isNew)R[key]={name:rec?rec.name:I[out][0].replace(/ (I|II|III)$/,''),sel:g.sel.slice(),m,best:q};else if(q>R[key].best)R[key].best=q;g.res.isNew=isNew;
   gain('co',Math.round((8+M.ti*9+M.n*4)*(isNew?1.5:1)*(.6+.4*(q+1)/3)));inc&&inc('cook')}else add('quemado');
  dirty=1;snd(fail?'hit':'quest');card()}
 function card(){const g=G,r=g.res,e=document.getElementById('alq'),ex=r.fail?0:r.q+1,pc=v=>Math.round(v*100)+' %';const d=document.createElement('div');d.className='aq-name aq-res';
  d.innerHTML='<div class="aq-ri cc-plate">'+ic(r.out)+'</div><div class="cc-st">'+[0,1,2].map(i=>'<i class="'+(i<ex?'on':'')+'" style="animation-delay:'+(.5+i*.35)+'s">★</i>').join('')+'</div><p>'+(r.fail?'Plato estropeado':(r.score>=.9?'¡Perfecto! ':'')+'Has cocinado <b>'+I[r.out][0]+'</b>')+'</p><small>'+(r.fail?(r.burnt?'Se ha quemado o se ha pasado de punto.':'Ha quedado demasiado malo: no alcanza la calidad mínima.'):'Calidad '+ROM[r.q]+(r.rec?' · receta: '+r.rec.name:' · improvisada: con receta podría ser mejor')+(r.isNew?' · ¡nueva!':''))+'</small>'
   +(r.fail?'':'<small>'+(r.M.top.length?r.M.top.map(([k,l])=>'<b style="color:'+FX[k][1]+'">'+FX[k][0]+' '+ROM[l-1]+'</b>').join(' · '):'Solo alimenta')+'</small>')+'<small class="q">'+MET[r.m].st+' '+pc(r.cook)+' · preparación '+pc(r.prep)+' · sabor '+pc(r.sab)+' · emplatado '+pc(r.plate)+'</small><div class="aq-bt"><button class="aq-ok">Continuar</button></div>';
  e.appendChild(d);if(!r.fail)for(let i=0;i<ex;i++)setTimeout(()=>{try{tone(500+i*180,.15,'triangle',.06,i*60+700)}catch(e){}},500+i*350);
  d.querySelector('.aq-ok').onclick=()=>{d.remove();const keep=G.sel.slice(),m=G.meth;start();SEL=[];if(keep.length&&keep.every(id=>have(id)>=keep.filter(x=>x===id).length)){G.meth=m;setSel(keep);drawer('ing')}}}
 // «Repetir mejor resultado»: sin minijuego, calidad = tu mejor (máx. II) y 40 % de la XP
 function quick(key){if(!key)return toast('Aún no has cocinado nada que repetir');const R=(S.cor||{})[key],rc=recByKey(key);if(!rc||!R)return toast('Aún no has cocinado nada que repetir');
  if(R.best<0)return toast('Primero cocina esa receta una vez');if(!idle())return toast('Termina lo que estás cocinando');
  const used={};rc.sel.forEach(id=>used[id]=(used[id]||0)+1);if(!Object.entries(used).every(([k,v])=>have(k)>=v))return toast('Te faltan ingredientes');
  take(used);const M=mix(rc.sel),q=Math.min(R.best,1),rcp=RECIPES.find(r=>keyOf(r.ing,r.m)===key),out=(rcp&&rcp.out)||idOf(M.top,M.ti,q,rc.m);ensure(out);add(out);if(rcp&&rcp.out)inc('make:'+rcp.out);gain('co',Math.round((8+M.ti*9+M.n*4)*.4*(.6+.4*(q+1)/3)));dirty=1;snd('quest');toast('Repites <b>'+I[out][0]+'</b>');drawer(G.dr)}
 // ── fotograma ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 function tick(now,dt){FOODtick(now);if(AUTO())COOKA.tick(now,dt);if(!G)return;if(STN&&Math.hypot(P.x-STN.x,P.y-STN.y)>190){close();return}dt=Math.min(dt,.05);G.t+=dt;KIT.tick(G,dt);hint();render()}
 function hint(){const h=document.querySelector('#alq .aq-h'),g=G;if(!h||!g)return;if(g.shs!==g.stage){g.shs=g.stage;shelf()}
  const txt=g.stage==='pick'?(tutRec()?'Toca la Parrilla para empezar: te guío paso a paso.':'Elige ingredientes de la despensa (o una receta) y toca la estación donde cocinarlos.'):g.stage==='prep'?'Prepara cada ingrediente en la mesa de trabajo.':g.stage==='cook'?MET[g.meth].st+': '+MET[g.meth].desc:'Pulsa SERVIR cuando quieras; emplatar es opcional y sube la nota.',gd=guideHTML(g),key=gd+'|'+txt+'|'+JSON.stringify(g.sp);
  if(g.hk!==key){g.hk=key;h.innerHTML=(gd?'<div class="aq-gd">'+gd+'</div>':'')+'<div class="aq-ht">'+txt+'</div>'}}
 function render(){const e=document.getElementById('alq'),cv=e&&e.querySelector('canvas');if(!cv||!G)return;const c=cv.getContext('2d');c.setTransform(2,0,0,2,0,0);KIT.render(c,G)}
 addEventListener('keydown',ev=>{if(G&&ev.key==='Escape'&&!G.res){ev.stopImmediatePropagation();close()}},true);
 // ── comer: efectos de los platos (NO se acumulan; vale el más fuerte) ──────────────────────────────────────────────────────────────────────────────────────────────────────────
 function use(id,i){const f=parse(id);if(!f)return false;ensure(id);const now=performance.now();if(now<EATCD)return true;
  const heal=healOf(f.ti,f.q,f.m),fo=S.food||(S.food={}),applied=[],kept=[];
  f.top.forEach(([k,l])=>{const str=l*QM[f.q],dur=Math.round((60+l*45)*QM[f.q]*MET[f.m].dur)*1000,ex=Date.now()+dur,cur=fo[k];   // NO se acumula: solo vale el efecto más fuerte (a igual fuerza, el más duradero); los distintos conviven
   if(cur&&cur.exp>Date.now()&&(cur.v>str||(cur.v===str&&cur.exp>=ex))){kept.push(k);return}
   fo[k]={exp:ex,v:str,per:Math.max(1,Math.round(1+l*QM[f.q]*1.3)),hp:Math.round((3+l*4+f.ti*2)*QM[f.q])};if(BUFK[k])S.buf[BUFK[k]]=ex;applied.push(k+':'+Math.round(dur/1000))});
  if(P.hp+hotLeft()>=maxHp()&&!applied.length){log('Ya estás en plena forma'+(kept.length?' y ya tienes un efecto igual o más fuerte.':'.'));return true}
  S.inv.splice(i,1);inc('eat');EATCD=now+1100;eatDelay(now,1800);P.eat=now;snd('eat');try{AMB.food()}catch(e){}
  HOT.push({left:heal,step:Math.max(1,Math.round(heal/6)),t:now+450});const nm=a=>FX[a.split(':')[0]][0];
  log('Comes '+I[id][0]+': recuperas '+heal+' PV poco a poco.'+(applied.length?' Efecto: '+applied.map(a=>nm(a)+' ('+a.split(':')[1]+' s)').join(', ')+'.':'')+(kept.length?' Ya tenías '+kept.map(k=>FX[k][0]).join(', ')+' igual o más fuerte.':''));dirty=1;return true}
 let regT=0;function FOODtick(now){const fo=S.food;if(!fo||!fo.reg||fo.reg.exp<Date.now()||now<regT)return;regT=now+3000;if(P.hp>0&&P.hp<maxHp()){P.hp=Math.min(maxHp(),P.hp+fo.reg.per);dirty=1}}
 /* consulta para efectos AMBIENTALES (todavía ninguna zona los pide): COC.has('abr') */
 const has=k=>{const fo=S.food;return !!(fo&&fo[k]&&fo[k].exp>Date.now())},hpBonus=()=>{const fo=S.food;return fo&&fo.hpm&&fo.hpm.exp>Date.now()?fo.hpm.hp||0:0};
 const skipOnce=()=>{const s=SKIP;SKIP=false;return s};

 // ── COCINA AUTOMÁTICA: capa de datos para src/cookauto.js (`COC.X`). Sin minijuegos: la calidad sale de receta + sabor; preparación y fuego se dan por buenos (.85/.8) ────────────────────────────
 const FLK=['d','s','a','p','u'],cl_=(v,a,b)=>Math.max(a,Math.min(b,v));
 const autoMeth=sel=>{const rc=recFor(sel);if(rc)return rc.m;const n=sel.length,cut=sel.some(id=>prepOf(id)==='cut'||/^camaron/.test(id));return n>=6?'g':n===5?'h':(n<=3&&cut)?'p':'g'};
 /* puntuación automática: cocción .8 · preparación .85 · emplatado .7 + SABOR (lo único que decide el jugador, con la receta y el condimento); sin receta topa en I; con receta + buen sabor llega a III */
 function autoScore(sel,m,cond){const M=mix(sel,cond?{[cond]:1}:null),rc=recOf(sel,m),f={},st={};let s=0;
  FLK.forEach(k=>{f[k]=(M.fl[k]||0)+(cond===k?1:0);const v=cl_(f[k]/3,0,1),t=rc&&rc.tg?(rc.tg[k]||.1):(M.fl[k]?.5:.1),d=Math.abs(v-t);s+=cl_(1-Math.max(0,d-.2)/.4,0,1);st[k]=d<=.2?'ok':v<t?'low':'high'});
  const sab=s/5,score=cl_(.8*.45+.85*.2+sab*.2+.7*.12+(rc?.03:0),0,1);let q=score>=.86?2:score>=.66?1:0;if(!rc)q=0;return{M,rec:rc,score,q,sab,st}}
 const maxPortions=sel=>{if(!sel.length)return 0;const u={};sel.forEach(id=>u[id]=(u[id]||0)+1);return Math.min(20,...Object.keys(u).map(id=>Math.floor(have(id)/u[id])))};
 function cookAuto(sel,m,cond,n){n=Math.max(1,Math.min(n|0||1,maxPortions(sel)));if(!sel.length||maxPortions(sel)<1||(sel.length<2&&!recOf(sel,m)))return null;
  const u={};sel.forEach(id=>u[id]=(u[id]||0)+n);take(u);sel.forEach(id=>{S.cok=S.cok||{};S.cok[id.split('~')[0]]=1});
  const r=autoScore(sel,m,cond),M=r.M,rec=r.rec,q=r.q,out=(rec&&rec.out)||idOf(M.top,M.ti,q,m);ensure(out);const key=keyOf(sel,m),R=S.cor||(S.cor={}),isNew=!R[key];
  if(isNew)R[key]={name:rec?rec.name:I[out][0].replace(/ (I|II|III)$/,''),sel:sel.slice(),m,best:q};else if(q>R[key].best)R[key].best=q;
  for(let i=0;i<n;i++){add(out);if(rec&&rec.out)inc('make:'+rec.out);inc('cook')}
  const per=(8+M.ti*9+M.n*4)*(.6+.4*(q+1)/3)*.85,xp=Math.round(per*(isNew?1.5:1)*(1+(n-1)*.5));gain('co',xp);dirty=1;
  return{out,q,n,M,rec,score:r.score,xp,isNew,m}}
 const X={FX,FXI,FL,FLK,MET,SPFX,ROM,RECIPES,nm,props,known,prepOf,tutRec,recFor,keyOf,idOf,ensure,healOf,candidates,maxIng,autoMeth,autoScore,maxPortions,cookAuto,L:k=>L(k)};
 return{X,stationClick,ready:()=>!!G&&idle()&&ready(),recM:()=>{const r=G&&idle()?recFor(SEL):null;return r?r.m:null},tutM:()=>{const T=tutRec();return T?T.m:null},HB,herbsHave,reg,sweep,open,close,tick,use,mix,props,parse,ensure,FX,FXI,SPFX,FL,MET,healOf,RECIPES,prepOf,has,hpBonus,skipOnce,setMeth,prepDone,cookDone,plateDone,get active(){return !!G||OPEN||(AUTO()&&COOKA.active)},get cooking(){return (AUTO()&&COOKA.cooking)||(!!G&&!G.res&&G.stage!=='pick')},get stn(){return STN},get G(){return G}}})();
