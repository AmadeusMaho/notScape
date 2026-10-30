// NotScape · MUNDO INTERACTIVO (30 oct 2026) · DESCUBRIMIENTOS: pequeños puntos de interés de TIER 1 repartidos por TODO el continente (poi-gen.js los coloca en una rejilla fina).
// Cada uno es un `PO` (entidad interactuable con F / LMB) con un modelo de prop que YA existe (sin assets nuevos) y una interacción propia:
//   fuente     «Pozo de aguas claras»   · reutilizable (enfría 4 min): vida, maná y resistencia al máximo
//   tótem      «Tótem del viajero»      · reutilizable (enfría 15 min): una bendición TEMPORAL al azar (XP, daño, velocidad, defensa)
//   monolito   «Monolito rúnico»        · una sola vez: revela el mapa alrededor, XP de oficio y una inscripción
//   caravana   «Caravana saqueada»      · una sola vez: se registra (casteo), salta una EMBOSCADA de criaturas del bioma y deja botín
// Para añadir un tipo: una fila en `EV` (modelo, nombre, uso) + una plantilla `ev:1` en `POIGEN.TPL` (poi-gen.js). Lo demás (cuenta de descubrimientos, avisos, guardado) es común.
// Estado guardado: `S.poi[id]=1` (los de una sola vez), `S.dsc[id]=hasta` (reutilizables, reloj real) y `S.dcv` (nº de descubrimientos). Sin subir `S.ver`.
// Solo toca globales de game.js EN TIEMPO DE LLAMADA (toast, log, snd, gain, earn, add, mob, M…): se carga ANTES de game.js.
const DISC=(()=>{
 const COOL={fuente:4*60e3,totem:15*60e3},INS=['«Quien camina deja huella, quien se detiene la ve.»','«Aquí descansaron los que ya no están.»','«El camino es más viejo que el reino.»','«No toda piedra callada está vacía.»','«Lo que buscas también te busca.»'];
 const EV={
  fuente:{m:'pozo',n:'Pozo de aguas claras',em:'💧',once:0},
  totem:{m:'totem',n:'Tótem del viajero',em:'🪶',once:0},
  monolito:{m:'columna',o:{broken:1},n:'Monolito rúnico',em:'🗿',once:1},
  caravana:{m:'carreta',n:'Caravana saqueada',em:'🛒',once:1}};
 // Nombres por civilización (índice de bioma → tipo → nombre); sin entrada = el nombre base de `EV`. Puramente descriptivos: el lore lo fija el dueño.
 const NM={1:{fuente:'Fuente de musgo',totem:'Tótem de raíces',monolito:'Piedra cubierta de hiedra',caravana:'Carro abandonado'},2:{fuente:'Pozo de agua turbia',totem:'Tótem de la ciénaga',monolito:'Monolito hundido',caravana:'Balsa varada'},3:{fuente:'Manantial helado',totem:'Tótem de los ancestros',monolito:'Piedra rúnica nórdica',caravana:'Trineo abandonado'},4:{fuente:'Pozo del peregrino',totem:'Santuario del viajero',monolito:'Estela inscrita',caravana:'Carreta de mercader'},5:{fuente:'Fumarola curativa',totem:'Tótem de brasas',monolito:'Obelisco de basalto',caravana:'Convoy calcinado'},6:{fuente:'Fuente espectral',totem:'Tótem rúnico',monolito:'Monolito arcano',caravana:'Caravana espectral'},7:{fuente:'Oasis diminuto',totem:'Tótem del desierto',monolito:'Obelisco enterrado',caravana:'Caravana varada'},8:{fuente:'Pozo de agua dulce',totem:'Tótem del marinero',monolito:'Piedra del faro',caravana:'Cargamento naufragado'}};
 const R_=(a,b)=>Math.floor(a+Math.random()*(b-a+1));   // azar de recompensa (Math.random permitido: no es arte ni posición)
 const dsc=()=>S.dsc||(S.dsc={}),ready=id=>(dsc()[id]||0)<=Date.now(),left=id=>Math.max(0,dsc()[id]-Date.now());
 const mins=ms=>Math.max(1,Math.ceil(ms/60e3))+' min';
 // el PO se crea desde game.js (bloque de `b.pois`)
 const all=[];   // todos los descubrimientos del mundo (para el mapa y el diario)
 function make(p,id,x,y,k,PO){const d=EV[p.k],done=d.once&&!!S.poi[id];
  const e={po:1,id,pk:p.k,ev:1,n:done&&p.k==='caravana'?'huesos':d.m,o:d.o||null,nm:(NM[k]&&NM[k][p.k])||d.n,x,y,k,_oa:1,lh:64,tier:p.tier||1};PO.push(e);all.push(e)}
 // ── DESCUBIERTO = lo has visto de cerca (≤ 520 px): entra en `S.dvd` (guardado), sale en el minimapa/mapa del mundo y cuenta en el diario ──
 let tk=0,seen=null;
 function tick(now){if(now-tk<900)return;tk=now;const D=S.dvd||(S.dvd={});let nw=0;for(let i=0;i<all.length;i++){const e=all[i];if(D[e.id]||Math.abs(e.x-P.x)>520||Math.abs(e.y-P.y)>520)continue;if(Math.hypot(e.x-P.x,e.y-P.y)<520){D[e.id]=1;nw++;seen=null}}
  if(nw&&typeof WMAP!=='undefined'&&WMAP.ready)try{toast('🧭 Descubierto: '+(nw>1?nw+' lugares':EV[all.find(e=>D[e.id]&&Math.hypot(e.x-P.x,e.y-P.y)<520).pk].n),1800)}catch(x){}}
 const list=()=>seen||(seen=all.filter(e=>(S.dvd||{})[e.id]));
 // iconos en el minimapa local y en el mapa grande (`ic(emoji,x,y,etiqueta,tamaño)` es el pintor de drawMap en game.js); los de una sola vez ya usados no se dibujan
 function mapIcons(ic,big){const L=list();for(let i=0;i<L.length;i++){const e=L[i],d=EV[e.pk];if(d.once&&S.poi[e.id])continue;ic(d.em,e.x,e.y,null,big?12:11)}}
 // ── DIARIO DE EXPLORACIÓN (tecla J): por bioma, lo visto/total de cada tipo y los lugares notables ──
 let el=null;
 function diary(on){if(on===undefined)on=!(el&&!el.hidden);if(!el){el=document.createElement('div');el.id='dsc';el.hidden=true;document.body.appendChild(el);
   const st=document.createElement('style');st.textContent='#dsc{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:9;width:min(560px,92vw);max-height:80vh;overflow:auto;padding:18px 22px;background:rgba(16,13,10,.94);border:1px solid rgba(232,207,148,.35);border-radius:8px;color:#e8dcc0;font:15px Spectral,Georgia,serif;box-shadow:0 8px 40px #000a}#dsc h3{margin:0 0 4px;font:600 20px Cinzel,Georgia,serif;color:#e8cf94;letter-spacing:.06em}#dsc .tot{opacity:.8;margin-bottom:12px}#dsc .row{display:flex;gap:10px;align-items:baseline;padding:6px 0;border-top:1px solid rgba(232,207,148,.14)}#dsc .row b{flex:0 0 38%;font:600 14px Cinzel,Georgia,serif;color:#d9ccaa}#dsc .row span{flex:1;display:flex;gap:12px;flex-wrap:wrap}#dsc .row i{font-style:normal;white-space:nowrap}#dsc .row i.ok{color:#e8cf94}#dsc .x{float:right;cursor:pointer;opacity:.7}#dsc .hint{margin-top:10px;font-size:12px;opacity:.6}';document.head.appendChild(st)}
  if(on){const D=S.dvd||{},tot=all.length,sn=Object.keys(D).length;let h='<span class="x" onclick="DISC.diary(false)">✕</span><h3>Diario de exploración</h3><div class="tot">'+sn+' de '+tot+' descubrimientos vistos · '+(S.dcv||0)+' usados</div>';
   BI.forEach((B,k)=>{const ev=all.filter(e=>e.k===k);if(!ev.length)return;const zn=ZS.filter((z,i)=>z.k===k&&S.map['z'+i]).length,zt=ZS.filter(z=>z.k===k).length;
    h+='<div class="row"><b>'+B.n+'</b><span>'+Object.keys(EV).map(t=>{const a=ev.filter(e=>e.pk===t),v=a.filter(e=>D[e.id]).length;return'<i class="'+(v?'ok':'')+'">'+EV[t].em+' '+v+'/'+a.length+'</i>'}).join('')+'<i class="'+(zn?'ok':'')+'">🗺️ '+zn+'/'+zt+'</i></span></div>'});
   el.innerHTML=h+'<div class="hint">💧 pozos · 🪶 tótems · 🗿 monolitos · 🛒 caravanas · 🗺️ lugares notables · J o Esc: cerrar</div>';el.hidden=false}else el.hidden=true}
 addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test((e.target||{}).tagName||''))return;if((e.key==='j'||e.key==='J')&&!e.repeat)diary();else if(e.key==='Escape'&&el&&!el.hidden)diary(false)});
 function count(e){S.dcv=(S.dcv||0)+1;if(typeof RECN!=='undefined'&&S.dcv%5===0)try{RECN.unlock({title:'Explorador',sub:S.dcv+' descubrimientos',items:[{em:'🧭',name:'Sigue explorando: cada rincón guarda algo'}]})}catch(x){}}
 function hostiles(k){const b=BIOMES.list[k],sp=Object.values((b&&b.spots)||{}).flatMap(s=>s.mobs.map(m=>m[0]));return[...new Set(sp)].filter(q=>MD[q]&&(MD[q].ag||MD[q].dmg>=3)&&!MD[q].an&&!MD[q].el&&!MD[q].boss&&!/^[kb]\d/.test(q))}   // la emboscada nunca trae élites ni jefes
 function use(e,now){const d=EV[e.pk];if(!d)return false;
  if(d.once&&S.poi[e.id]){log('Ya lo has registrado.');return true}
  if(!d.once&&!ready(e.id)){toast(d.em+' <b>'+e.nm+'</b><br>Vuelve en '+mins(left(e.id)),2200);return true}
  const k=e.pk,t=e.tier||1;
  if(k==='fuente'){P.hp=maxHp();MN=mnMax();S.sta=100;S.exh=0;dsc()[e.id]=Date.now()+COOL.fuente;snd('lvl');count(e);toast('💧 <b>'+e.nm+'</b><br>Vida, maná y resistencia al máximo',3000);log('💧 '+e.nm+': vida, maná y resistencia al máximo.');dirty=1;save();return true}
  if(k==='totem'){const o=[['xp','Sabiduría: +50 % de experiencia'],['dmg','Fuerza: más daño'],['spd','Viento: +35 % de velocidad'],['def','Piel de piedra: más defensa']],r=o[R_(0,o.length-1)];S.buf[r[0]]=Math.max(S.buf[r[0]]||0,Date.now()+(r[0]==='xp'?6:5)*60e3);dsc()[e.id]=Date.now()+COOL.totem;snd('rare');count(e);toast('🪶 <b>'+e.nm+'</b><br>Bendición de 5 min — '+r[1],3800);log('🪶 '+e.nm+': '+r[1]+'.');dirty=1;save();return true}
  if(k==='monolito'){S.poi[e.id]=1;if(typeof WMAP!=='undefined'&&WMAP.ready)WMAP.revealAt(e.x,e.y,26);const sk=['wc','mi','fi','he'].sort((a,b)=>L(a)-L(b))[0],xp=Math.round((60+L(sk)*8)*t);gain(sk,xp,true);snd('rare');count(e);
   toast('🗿 <b>'+e.nm+'</b><br>'+INS[Math.abs(Math.round(e.x*7+e.y))%INS.length]+'<br>Mapa revelado · +'+xp+' XP '+SK[sk][0],4600);log('🗿 '+e.nm+': el mapa se aclara a tu alrededor.');dirty=1;save();return true}
  if(k==='caravana'){if(M.some(m=>m.amb===e.id&&alive(m,now))){toast('⚔️ Termina con los saqueadores primero');return true}
   const go=()=>{S.poi[e.id]=1;const pool=hostiles(e.k),n=2+t;if(pool.length)for(let i=0;i<n;i++){const a=i/n*Math.PI*2+.6,id=pool[Math.abs(Math.round(e.x*3+e.y+i*5))%pool.length];mob(id,e.x+Math.cos(a)*150,e.y+Math.sin(a)*110);const m=M[M.length-1];m.amb=e.id;m.hunt=1;m.tmp=e.id}   // emboscada: aparecen alrededor y te cazan; `tmp` (como los de misión) = NO reaparecen al morir (kill → qMobDead)
    const tx=CLOOT.grant(CLOOT.roll(e.k,t,{gear:true}),e.x,e.y);   // botín de la tabla del bioma (sin XP)
    e.n='huesos';count(e);snd('rare');toast('🛒 <b>'+e.nm+'</b><br>¡Una emboscada!'+(pool.length?'':'<br>(sin saqueadores cerca)')+'<br>'+tx,4200);log('🛒 '+e.nm+': '+tx.replace('<br>',' · '));dirty=1;save()};
   if(typeof castStart==='function'&&!e._ok){castStart('Registrando la caravana…',3000,()=>{e._ok=1;try{go()}finally{e._ok=0}},{e});return true}go();return true}
  return false}
 return{EV,make,use,hostiles,tick,mapIcons,diary,all}})();
