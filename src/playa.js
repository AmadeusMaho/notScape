// NotScape · LA PLAYA (22 oct 2026; pedido del dueño: «la secuencia luego de escapar de Gabriel: el jugador empieza en la playa, desnudo (con ropa interior), dormido, Ru lo cuida hasta que despierta; una pequeña cabaña; ahí te equipas la ropa;
// las misiones de progresión van a cambiar, inventa algo con el lore»). Script clásico, global `PLAYA`. Se carga ANTES de game.js (y tras sky-biome.js); usa globales del juego solo al llamar.
// Canon que respeta (docs/LORE.md §1b y docs/GUION_TUTORIAL.md Acto 7): despiertas CIEN AÑOS después en la playa de la Pradera con la pluma del ángel encendida; Ru estaba a tu lado (es «el mismo Ru de siempre» y no envejece: pista, no se explica);
// los aldeanos no revelan canon. NADA de esto afirma quién es el jugador ni qué es Ru.
// FLUJO (`S.playa = {step, done}`): 0 cinemática «playa» (dormido, Ru lo cuida, despierta) · 1 abre el baúl de la cabaña · 2 se viste (usa «Ropa de viajero» en la Mochila: quita la ropa interior, `S.app.under`) ·
//   3 habla con Ru (la pluma no se apaga; manda a Orsen y se adelanta a la tienda) · 4 enseña la pluma a Orsen, el anciano ex-corista del templo · 5 vuelve con Ru en la plaza → fin: se traspasa a la cadena antigua (`S.goal=GOAL_HAND`, PROVISIONAL hasta que el dueño
//   rehaga las misiones de progresión: ya NO hay «tala 5 troncos»/«mina 4 menas» de arranque).
// Los textos están aquí (PLAYA.TXT); se pueden retocar a mano. La cabaña, el baúl, la hoguera y el secadero son props/PO de la Pradera, en la playa del SUR (tiles locales 150–158 × 162–170).
const PLAYA=(()=>{
 const T=32,GOAL_HAND=4;   // GOALS[4] = «Funde una barra de cobre» (provisional)
 // sitios (tiles LOCALES de la Pradera, x → este, y → sur); la arena queda al sur-oeste, la hierba al norte
 const SP={hero:[152.4,169.1],ru:[154.5,169.5],hut:[153.8,163.6],chest:[156.4,165.7],fire:[150.8,166.4],rack:[157.4,168.6],barrel:[155.6,162.2],net:[149.6,164.6]};
 // ── LA PLAYA MÁS CERCANA A LA ALDEA (30 oct 2026; el dueño: «te tienes que spawnear en la playa más cercana a la aldea»): con el mapa A la playa fija de la rejilla antigua (tiles locales 150–170) quedaba a ~300 tiles de la aldea.
 // Se busca, en anillos crecientes desde la plaza, el primer punto de ARENA con MAR al sur (el layout de la cabaña mira a un mar al sur), un rectángulo llano y seco al norte para la cabaña, el baúl, la hoguera y el secadero,
 // y se desplazan TODOS los sitios (`SP`) ahí. Además se traza un camino de tierra desde la playa hasta la aldea («sigue el camino hacia el norte»). `?beach=0` conserva la playa antigua. `PLAYA.beach` = {x,y,dist} del punto elegido.
 let BEACH=null;
 function retarget(){try{const B=BIOMES.list[0];if(!BIOMES.mapA||!B||!B.cen||/[?&]beach=0/.test(location.search))return;
  const cx=B.ox+B.cen[0],cy=B.oy+B.cen[1],wat=(x,y)=>!TER.isLand(TER.heightAt(x,y)),sea=(x,y)=>wat(x,y)&&TER.seaAt(Math.floor(x/T),Math.floor(y/T));
  const okSite=(x,y)=>{if(BIOMES.own(x,y)!==0||wat(x,y)||TER.sandAt(Math.floor(x/T),Math.floor(y/T))<.3)return false;let s=false;for(let d=70;d<=300;d+=35)if(sea(x,y+d)){s=true;break}if(!s)return false;
   for(let u=-3;u<=5;u+=2)for(let v=-11;v<=0;v+=2){const px=x+u*T,py=y+v*T;if(wat(px,py)||TER.cliffNear(px,py,12))return false}return true};   // sitio llano y seco para la cabaña
  let H=null;for(let r=600;r<=14000&&!H;r+=96)for(let a=0;a<120&&!H;a++){const q=a*3*Math.PI/180,x=Math.round(cx+Math.cos(q)*r),y=Math.round(cy+Math.sin(q)*r);if(okSite(x,y))H=[x,y]}
  if(!H){console.warn('[PLAYA] sin playa válida: se conserva la antigua');return}
  const dx=(H[0]-B.ox)/T-SP.hero[0],dy=(H[1]-B.oy)/T-SP.hero[1];for(const k in SP){SP[k][0]+=dx;SP[k][1]+=dy}
  BEACH={x:H[0],y:H[1],dist:Math.round(Math.hypot(H[0]-cx,H[1]-cy))};
  // camino de tierra playa → aldea (avance voraz de 150 px hacia la plaza esquivando agua y acantilados)
  {const pts=[],ok=(x,y)=>BIOMES.own(x,y)===0&&!wat(x,y)&&!TER.cliffNear(x,y,12)&&TER.sandAt(Math.floor(x/T),Math.floor(y/T))<.9;let px=H[0],py=H[1]-6*T;pts.push([Math.round(px-B.ox),Math.round(py-B.oy)]);
   for(let i=0;i<260;i++){const ddx=cx-px,ddy=cy-py;if(Math.hypot(ddx,ddy)<420)break;const base=Math.atan2(ddy,ddx);let mv=false;
    for(const off of[0,.3,-.3,.6,-.6,.95,-.95,1.3,-1.3,1.7,-1.7]){const a=base+off,nx=px+Math.cos(a)*150,ny=py+Math.sin(a)*150;if(ok(nx,ny)&&ok((px+nx)/2,(py+ny)/2)){px=nx;py=ny;mv=true;break}}
    if(!mv)break;pts.push([Math.round(px-B.ox),Math.round(py-B.oy)])}
   if(pts.length>2){B.routes.push(pts);BEACH.camino=pts.length}}
  console.info('[PLAYA] playa en',BEACH)}catch(e){console.warn('[PLAYA] retarget falló',e)}}
 let inited=0;const init=()=>{if(inited)return;inited=1;retarget();addProps()};   // game.js lo llama justo ANTES de `PROPS.build()` (el mapa A y TER ya existen; al cargar este script aún no)
 const TXT={
  wake:['Cien años.','Respira… sigue respirando.','El mar te dejó aquí entero. No sé cómo.','Despacio. No te levantes de golpe.'],
  chest:'Un baúl viejo, hinchado de sal. Dentro hay ropa doblada.',
  ru1:['Tienes cara de haber dormido mucho. Mucho.','Esa pluma no se apaga. Llevo un rato mirándola y no se apaga.','En la aldea hay un viejo, Orsen. Cantó cuarenta años en el coro de los ángeles. Enséñale la pluma a él, no a otros.','Yo me adelanto a abrir la tienda. Sigue el camino hacia el norte.'],
  ruWait:['Orsen, en el templo. Camino al norte; no tiene pérdida.'],
  orsen:['Hmm. Acércate. ¿Eso es una pluma? No. Eso es lo que queda de una.','Hace cien años el cielo ardió. De todo lo que cayó, nada siguió ardiendo. Ni el mar la apagó; ni el siglo.','Guárdala. Y no se la enseñes a quien pregunte demasiado.','Ve con Ru. Dice que atiende la tienda desde antes que mi abuelo, y me da que no miente.'],
  ru2:['¿Qué te dijo el viejo? …Da igual. Lo importante es que sigues aquí.','Hay mucho que hacer antes de que alguien pregunte por la pluma. Empecemos por lo básico: fuego, hierro y una espada.']};
 const STEPS=[
  {txt:'Despierta',g:'cine'},
  {txt:'Abre el baúl de la cabaña',g:'item',at:'chest'},
  {txt:'Vístete: usa la «Ropa de viajero» en la Mochila',g:'dressed'},
  {txt:'Habla con Ru, junto a la hoguera',g:'ru',npc:'ru'},
  {txt:'Enséñale la pluma a Orsen, el anciano del templo',g:'orsen',npc:'anciano'},
  {txt:'Vuelve con Ru, en la plaza',g:'ru2',npc:'ru'}];
 let sl=0,pend=0,boxed=null,ruHome=null,cineTried=0,musOn=0;
 const st=()=>S.playa||(S.playa={step:0,done:1}),B0=()=>BIOMES.list[0],loc=(k)=>({x:B0().ox+SP[k][0]*T,y:B0().oy+SP[k][1]*T});
 const on=()=>!!(S.playa&&!S.playa.done);
 const ruEnt=()=>{try{return ST.find(e=>e.id==='ru')||null}catch(e){return null}};
 const orsenEnt=()=>{try{return ST.find(e=>e.id==='anciano'&&ownAt(e.x,e.y)===0)||ST.find(e=>e.id==='anciano')||null}catch(e){return null}};
 // ── props de la playa: se añaden a la aldea de la Pradera ANTES de que props.js construya la lista ──
 function addProps(){try{const b=BIOMES.list[0];if(!b||!b.village||!b.village.props)return;const L=(k)=>({x:SP[k][0]*T,y:SP[k][1]*T});
  [['cabana','hut',{roof:'#7a5a34',rot:0},[24,20]],['hoguera','fire',null,[8,8]],['secadero','rack',null,[16,10]],['barril','barrel',null,[8,8]],['cestaPeces','net',null,[10,8]]].forEach(([n,k,o,fp])=>{const q=L(k),e={n,x:q.x,y:q.y};if(o)e.o=o;if(fp)e.fp=fp;b.village.props.push(e)})}catch(e){}}
 const html=()=>{const i=st(),n=STEPS[Math.min(i.step,STEPS.length-1)];return `<div class="hint" style="margin:0 0 3px;color:#d8c9a3">Cien años</div><div style="color:var(--yl);font-size:25px">${n.txt}</div>`};
 const target=()=>{if(!on())return null;const n=STEPS[st().step];if(n.g==='item')return loc('chest');if(n.g==='ru'||n.g==='ru2'){const e=ruEnt();return e}if(n.g==='orsen')return orsenEnt();return null};
 function adv(){const i=st();i.step++;if(i.step>=4)try{MUSIC.scene('wakeup',false)}catch(e){}if(i.step>=STEPS.length){finish();return}try{snd('quest');toast('✔ <b>Cien años</b>',1800)}catch(e){}try{dirty=1;save()}catch(e){}}
 function finish(){const i=st();i.done=1;try{S.goal=GOAL_HAND;S.gseen=-1;toast('Ru te espera en la plaza con el siguiente encargo.',3200);dirty=1;save()}catch(e){}}
 // ── Ru en la playa ──
 function placeRu(){const e=ruEnt();if(!e)return;if(!ruHome)ruHome={x:e.x,y:e.y};const q=loc('ru');e.x=q.x;e.y=q.y}
 function ruGoHome(){const e=ruEnt();if(e&&ruHome){e.x=ruHome.x;e.y=ruHome.y}ruHome=null}
 // ── baúl (un PO con modelo de cofre, como la caja de la isla) ──
 function boxInit(){if(boxed&&PO.includes(boxed))return;if(typeof PO==='undefined')return;boxed=PO.find(p=>p.pk==='cofreNaufrago')||null;if(!boxed){const q=loc('chest'),got=st().step>1||st().done;boxed={po:1,id:'playa_cofre',pk:'cofreNaufrago',n:got?'cofreAbierto':'cofre',nm:'Baúl del náufrago',x:q.x,y:q.y,k:0,_oa:1};PO.push(boxed)}}
 function chest(e){const n=STEPS[st().step];if(!on()||n.g!=='item'||have('ropa_viajero')>=1){toast('Un baúl vacío, hinchado de sal.',1800);return}
  if(typeof castStart==='function')castStart('Abriendo el baúl…',2200,()=>{add('ropa_viajero');if(e)e.n='cofreAbierto';try{toast('Encuentras: <b>Ropa de viajero</b>',2600);snd('rare')}catch(x){}dirty=1},{e})}
 // ── diálogos ──
 const say=(pages,then)=>{DL={n:'Ru · Tendero',id:'ru',c:'#e8cf94',p:pages.slice(),i:0};if(then)DL.then=then;dlgShow();dirty=1};
 function ruTalk(){if(!on())return false;const n=STEPS[st().step];
  if(n.g==='ru'){say(TXT.ru1,()=>{adv();ruGoHome()});return true}
  if(n.g==='ru2'){say(TXT.ru2,()=>adv());return true}
  if(n.g==='cine'||n.g==='item'||n.g==='dressed'){say(['Despacio. Ahí tienes el baúl; lo de dentro es tuyo.'].slice(0,1));return true}
  if(n.g==='orsen'){say(TXT.ruWait);return true}
  return false}
 function dlg(D,id){if(!on()||id!=='anciano')return false;const n=STEPS[st().step];if(n.g!=='orsen')return false;D.p=TXT.orsen.slice();D.then=()=>adv();return true}
 function tick(dt){if(!S.playa)return;boxInit();
  if(on()){const i=st();
   if(i.step===0&&!pend&&!cineTried&&typeof CINE!=='undefined'&&!CINE.on){cineTried=1;start0()}
   if(i.step>=1&&i.step<=3&&!musOn){musOn=1;try{MUSIC.scene('wakeup',true)}catch(e){}}   // tras recargar a mitad: la canción vuelve
   if(i.step===2&&S.app&&!S.app.under)adv();
   if(i.step===1&&have('ropa_viajero')>=1)adv();
   if(i.step<=3){const e=ruEnt();if(e&&Math.hypot(e.x-loc('ru').x,e.y-loc('ru').y)>4)placeRu()}   // Ru no se va del sitio hasta que habla contigo
   else if(ruHome){const e=ruEnt();if(e&&Math.hypot(e.x-P.x,e.y-P.y)>420)ruGoHome()}}}
 // arranca la cinemática de despertar (pantalla negra «Cien años.»)
 function start0(){try{MUSIC.scene('wakeup',true)}catch(e){}const q=loc('hero');if(!CINE.SCENES||!CINE.SCENES.playa){adv();return}sl=1;CINE.SCENES.playa.anchor=[q.x,q.y];if(!CINE.start('playa',{done:()=>{sl=0;adv()}})){sl=0;adv()}}
 // lo llama isla.js `finish()`: nueva partida del mundo real = la playa, dormido y en ropa interior
 // lo llama isla.js `finish()` (al llegar al borde de la isla en llamas): FUNDIDO A NEGRO (1,3 s) → mover al jugador a la playa → cinemática `playa` (negro, «Cien años.», fundido a la playa). El estado se prepara YA (si se recarga en medio, `tick` arranca la cinemática).
 function start(cb){S.playa={step:0,done:0};S.app=S.app||{};S.app.under=1;cineTried=1;boxed=null;dirty=1;try{save()}catch(e){}   // FIX 22 oct: `sl` (tumbado) ya NO se activa aquí: el héroe seguía CORRIENDO en la isla durante el fundido y se le veía moverse con la pose de dormido; ahora se activa con la pantalla en negro, justo al teletransportarlo
  const ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;background:#000;opacity:0;transition:opacity 2.8s ease-in;z-index:99998;pointer-events:none';document.body.appendChild(ov);requestAnimationFrame(()=>requestAnimationFrame(()=>{ov.style.opacity=1}));
  setTimeout(()=>{try{if(cb)cb()}catch(e){}sl=1;try{for(const k in K)K[k]=0;P.mvg=0;P.anm=0;P.mv=P.g=null}catch(e){}placeRu();const q=loc('hero');try{if(typeof CHEAT!=='undefined'&&CHEAT.tp)CHEAT.tp(q.x,q.y);else{P.x=q.x;P.y=q.y}}catch(e){P.x=q.x;P.y=q.y}try{P.mv=P.g=null;ISO.snap(P.x,P.y,TER.standZ(P.x,P.y))}catch(e){}
   try{zoneCheck(performance.now());for(let i=0;i<10&&R3D.preload()>0;i++);}catch(e){}   // FIX: tras el salto de 75 tiles se fuerza la carga de los chunks del terreno alrededor (la pantalla sigue negra), si no la playa salía a trozos
   start0();setTimeout(()=>ov.remove(),500)},3000)}
 function reset(){try{MUSIC.scene('wakeup',false)}catch(e){}musOn=0;S.playa=null;if(S.app)S.app.under=0;sl=0;cineTried=0;ruGoHome()}   // para `ISLA.reset()` y pruebas
 return{init,get beach(){return BEACH},STEPS,SP,TXT,on,html,target,tick,start,reset,chest,ruTalk,dlg,adv,loc,placeRu,ruGoHome,get sl(){return sl},set sl(v){sl=Math.max(0,Math.min(1,+v||0))},get step(){return on()?st().step:-1}}})();
