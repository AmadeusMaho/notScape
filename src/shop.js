// NotScape · TIENDAS Y MERCADO (Bloque B · Fase 28b, 20 oct 2026; pedido del dueño). Script clásico, global `TRADE` (OJO: `SHOP` ya es la lista antigua de game.js). Se carga DESPUÉS de game.js (usa sus globales solo en tiempo de llamada).
// ── 1) VENDEDORES (estilo World of Warcraft): ventana con pestañas COMPRAR · VENDER · RECOMPRAR (+ MEJORAS en la tienda general). Cada PNJ relevante vende lo suyo:
//    Ru (mostrador de la tienda): comida, flechas, cañas…; Brenna (herrera): menas, barras, carbón y herramientas; Orsen (anciano): pociones de maná, pergaminos y runas.
//    El catálogo de cada vendedor sale de una función de datos (`stock(k)`: k = bioma) con topes de tier por bioma; NO hay `if` por personaje en el resto del juego.
//    Precio de compra = valor del objeto × BUY_K (3), salvo `PRICE`; venta al vendedor = valor × (1 + 10 % por nivel de «Contrato mercantil»). Recomprar = lo que cobraste (últimos 12, `S.bb`).
// ── 2) MERCADO GLOBAL (casa de subastas): ventana con EXPLORAR · VENDER · MIS SUBASTAS. HOY es una SIMULACIÓN LOCAL (sin servidor): otros «jugadores» (vendedores simulados) publican
//    ofertas y compran las tuyas según lo caro o barato que pongas el precio. TODA la lógica pasa por el objeto `MARKET` (search/post/cancel/buy/tick): para el mercado online real
//    (Fase S15) solo hay que cambiar esas 5 funciones por llamadas al servidor; la interfaz no cambia. Estado en `S.mk`.
// Dinero: S.coins en COBRE (ver `money()/moneyH()` de game.js).
const TRADE=(()=>{
 const BUY_K=3,MK_K=2.2,COMM=.05,TIER=['cobre','bronce','hierro','acero','plata','alba','mitril','adam','runita','oricalco','infernita','celestita'],WOOD=['pino','abedul','roble','fresno','sauce','arce','tejo','ebano','caoba','baobab','ceniza','mundo'];
 const PRICE={rn_air:30,rn_earth:30,rn_life:30,rn_water:30,rn_fire:30,rn_arc:60,carbon:60};   // objetos con valor 0 o que conviene fijar
 const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const val=id=>PRICE[id]!=null?PRICE[id]/BUY_K:(I[id]?I[id][2]:0),buyPrice=id=>PRICE[id]!=null?PRICE[id]:Math.max(1,Math.round(I[id][2]*BUY_K)),sellPrice=id=>Math.round((I[id]?I[id][2]:0)*(1+.1*S.merc));
 const cap=k=>Math.min(10,2+Math.max(0,k|0)),upto=(pre,list,k)=>list.slice(0,cap(k)+1).map(t=>pre+'_'+t).filter(id=>I[id]),ex=ids=>ids.filter(id=>I[id]);
 // ══ VENDEDORES ══  stock(k) → filas [id, límite] (límite 0 = ilimitado; con límite se repone cada 10 min)
 const VEND={
  ru:{n:'Ru',rol:'Tendero',ic:'shop',acc:'#e58aa8',up:1,stock:k=>[...ex(['pan','frasco','vino','c_sardina','c_camaron','c_carne','c_pollo']).map(id=>[id,0]),...(k>=1?ex(['c_trucha','f_camaron']).map(id=>[id,0]):[]),...(k>=2?ex(['c_salmon','f_hamb','f_trucha']).map(id=>[id,0]):[]),
   ...upto('fl',TIER,k).map(id=>[id,0]),...upto('vi',TIER,k).map(id=>[id,0]),...upto('qv',TIER,k).filter((_,i)=>i%2===0).map(id=>[id,3]),...upto('rd',WOOD,k).map(id=>[id,0]),...ex(['pot_mana']).map(id=>[id,10])]},
  herrera:{n:'Brenna',rol:'Herrera',ic:'anvil',acc:'#c8704a',stock:k=>[...ex(['cobre','estano','carbon']).map(id=>[id,60]),...upto('b',TIER,k).map(id=>[id,25]),...upto('pk',TIER,k).map(id=>[id,0]),...upto('ax',TIER,k).map(id=>[id,0])]},
  anciano:{n:'Orsen',rol:'Anciano',ic:'altar',acc:'#9cc4ff',stock:k=>[...ex(['rn_air','rn_earth','rn_life','rn_water','rn_fire']).map(id=>[id,80]),...(k>=2?ex(['rn_arc']).map(id=>[id,30]):[]),...ex(['pot_mana']).map(id=>[id,10]),...(k>=1?ex(['pot_pr']).map(id=>[id,6]):[]),...(k>=2?ex(['pot_mana2']).map(id=>[id,5]):[]),
   ...ex(['sc_spark','sc_heal','sc_stone','sc_haste','sc_skin','sc_wave','sc_recall','sc_wis','sc_fire','sc_arcane','sc_storm','sc_gheal','sc_vortex','sc_cata']).slice(0,3+k*2).map(id=>[id,4])]}
 };
 // UN VENDEDOR POR OFICIO (Fase 25): cada oficio de aldea tiene su clave aquí; el catálogo de cada uno se decidirá después (stock vacío = «sin mercancía por ahora»)
 VEND.herrero=VEND.herrera;   // Brenna (Pradera) y todos los herreros
 ['granjero','pescador','lenador','cocinero'].forEach((r,i)=>VEND[r]={n:r,rol:r,ic:['shop','shop','anvil','fire'][i],acc:['#9ac060','#6ab0d8','#c89a5a','#e5784a'][i],stock:()=>[]});
 let V=null,tab='buy',q='',cur=null,bk=0,bound=0;   // V = vendedor abierto {id,e,k}
 const bio=e=>{try{return Math.max(0,ownAt(e.x,e.y))}catch(x){return typeof curB==='number'?curB:0}};
 function remaining(vid,id,lim){if(!lim)return Infinity;S.vs=S.vs||{};const key=vid+'|'+id,r=S.vs[key],now=Date.now();if(!r||now>r.t){S.vs[key]={n:lim,t:now+600000};return lim}return r.n}
 function useStock(vid,id,lim,n){if(!lim)return;remaining(vid,id,lim);S.vs[vid+'|'+id].n-=n}
 // ── ventana de vendedor ──
 function mkWin(){if($('#vend'))return;const d=document.createElement('div');d.id='vend';d.className='shw';d.hidden=true;
  d.innerHTML='<div class="shh"><i class="shi"></i><div class="sht"><b></b><small></small></div><button class="shx" title="Cerrar">✕</button></div><div class="shtabs"></div><input class="shq" type="search" placeholder="Buscar…" autocomplete="off"><div class="shl"></div><div class="shf"><span class="shn"></span><span class="shp"></span></div>';
  document.body.appendChild(d);d.querySelector('.shx').onclick=close;const qi=d.querySelector('.shq');qi.oninput=()=>{q=nrm(qi.value.trim());render()};qi.onkeydown=e=>{e.stopPropagation();if(e.key==='Escape')close()};
  d.addEventListener('click',onClick);d.addEventListener('keydown',e=>e.stopPropagation())}
 function open(vid,e){const v=VEND[vid];if(!v)return false;mkWin();closeMkt();V={id:vid,e:e||null,k:e?bio(e):(typeof curB==='number'?curB:0)};tab='buy';q='';S.bb=S.bb||[];const d=$('#vend');d.hidden=false;d.style.setProperty('--acc',v.acc);d.querySelector('.shq').value='';
  {const nm=e&&e.npc?e.n.split(', '):null;d.querySelector('.sht b').textContent=nm?nm[0]:v.n;d.querySelector('.sht small').textContent=nm&&nm[1]?nm[1].charAt(0).toUpperCase()+nm[1].slice(1):v.rol}d.querySelector('.shi').style.backgroundImage='url('+UI.icon(v.ic)+')';render();return true}
 function close(){V=null;const d=$('#vend');if(d)d.hidden=true}
 const tabsOf=()=>[['buy','Comprar'],['sell','Vender'],['bb','Recomprar'+((S.bb||[]).length?' ('+S.bb.length+')':'')],...(VEND[V.id].up?[['up','Mejoras']]:[])];
 function rowItem(id,right,o){o=o||{};return '<div class="shr'+(o.cant?' cant':'')+'" data-a="'+o.a+'" data-id="'+id+'" data-i="'+id+'"><i class="mi"'+sfx(id)+'>'+ic(id)+'</i><div class="shnm"><b>'+esc(I[id][0])+'</b>'+(o.sub?'<em>'+o.sub+'</em>':'')+'</div><span class="shpr">'+right+'</span></div>'}
 function render(){if(!V)return;const d=$('#vend'),v=VEND[V.id];d.querySelector('.shtabs').innerHTML=tabsOf().map(([t,l])=>'<button data-t="'+t+'" class="'+(t===tab?'on':'')+'">'+l+'</button>').join('');
  d.querySelector('.shq').style.display=tab==='up'?'none':'';let h='';const ok=id=>!q||nrm(I[id][0]).includes(q);
  if(tab==='buy'){const rows=v.stock(V.k).filter(([id])=>ok(id));if(!v.stock(V.k).length)h='<div class="shem">Por ahora no tiene mercancía a la venta.</div>';else h=rows.map(([id,lim])=>{const left=remaining(V.id,id,lim),pr=buyPrice(id),cant=S.coins<pr||left<=0||!room(id);return rowItem(id,moneyH(pr),{a:'buy',cant,sub:lim?(left>0?'quedan '+left:'agotado'):''})}).join('')||'<div class="shem">Nada que mostrar.</div>'}
  else if(tab==='sell'){const ids=[...new Set(S.inv)].filter(id=>I[id]&&I[id][2]>0&&!QITEM.has(id)&&ok(id));h=ids.map(id=>rowItem(id,moneyH(sellPrice(id)),{a:'sell',sub:'x'+count(id)})).join('')||'<div class="shem">No tienes nada que vender.</div>';
   if(ids.length&&!q)h+='<div class="shr act" data-a="sellall"><b>Vender todo lo de la mochila</b><span class="shpr">'+moneyH(S.inv.reduce((a,x)=>a+(QITEM.has(x)?0:sellPrice(x)),0))+'</span></div>'}
  else if(tab==='bb'){h=(S.bb||[]).map((b,i)=>rowItem(b.id,moneyH(b.p*b.n),{a:'bb',cant:S.coins<b.p*b.n||!room(b.id),sub:'x'+b.n}).replace('data-a="bb"','data-a="bb" data-n="'+i+'"')).join('')||'<div class="shem">Aquí aparece lo que vendas, por si te arrepientes.</div>'}
  else if(tab==='up'){h='<div class="shsec">Mejoras permanentes</div>'+UP.map((u,i)=>{const lv=S[u[0]]||0,c=u[3][lv],no=c==null||S.coins<c;return '<div class="shr up'+(no?' cant':'')+'" data-a="up" data-n="'+i+'"><div class="shnm"><b>'+u[1]+' <em>nv. '+lv+'/'+u[3].length+'</em></b><em>'+u[2]+'</em></div><span class="shpr">'+(c==null?'Máx':moneyH(c))+'</span></div>'}).join('')
   +'<div class="shsec">Runas de viaje rápido</div>'+BI.slice(0,S.st.bio).map((b,k)=>{const id='rv_'+k,own=count(id)>0||S.bank[id]>0,c=RVC[k],no=own||S.coins<c;return '<div class="shr up'+(no?' cant':'')+'" data-a="rv" data-n="'+k+'" data-i="'+id+'"><i class="mi">'+ic(id)+'</i><div class="shnm"><b>'+I[id][0]+'</b><em>Reutilizable · 45 s</em></div><span class="shpr">'+(own?'Tienes':moneyH(c))+'</span></div>'}).join('')}
  d.querySelector('.shl').innerHTML=h;d.querySelector('.shp').innerHTML=moneyH(S.coins);
  d.querySelector('.shn').textContent=tab==='buy'?'LMB: comprar 1 · Mayús: 5 · Ctrl: todo lo que puedas':tab==='sell'?'LMB: vender 1 · Mayús: todos':tab==='bb'?'LMB: recomprar':'Pagos únicos'}
 function onClick(e){const t=e.target.closest('[data-t]');if(t&&t.parentNode.classList.contains('shtabs')){tab=t.dataset.t;render();return}
  const r=e.target.closest('.shr[data-a]');if(!r||!V)return;const a=r.dataset.a,id=r.dataset.id,n=+r.dataset.n;
  if(a==='buy'){const lim=(VEND[V.id].stock(V.k).find(x=>x[0]===id)||[0,0])[1];let want=e.ctrlKey||e.metaKey?999:e.shiftKey?5:1,got=0;
   while(got<want&&S.coins>=buyPrice(id)&&room(id)&&remaining(V.id,id,lim)>0){S.coins-=buyPrice(id);add(id);useStock(V.id,id,lim,1);got++}
   if(got){snd('coin');log('Compraste '+got+'× '+I[id][0]);dirty=1;save()}else toast(S.coins<buyPrice(id)?'No tienes dinero suficiente.':!room(id)?'Mochila llena.':'Agotado.',1500)}
  else if(a==='sell'){const all=e.shiftKey?count(id):1;sellN(id,all)}
  else if(a==='sellall'){const ids=[...new Set(S.inv)].filter(x=>I[x]&&I[x][2]>0);ids.forEach(x=>sellN(x,count(x),1));snd('coin');dirty=1;save()}
  else if(a==='bb'){const b=S.bb[n];if(!b)return;const c=b.p*b.n;if(S.coins<c){toast('No tienes dinero suficiente.',1500);return}let ok=0;for(let i=0;i<b.n;i++){if(!room(b.id))break;S.inv.push(b.id);ok++}if(!ok){toast('Mochila llena.',1500);return}S.coins-=b.p*ok;b.n-=ok;if(b.n<=0)S.bb.splice(n,1);snd('coin');dirty=1;save()}
  else if(a==='up'){buyU(UP[n][0],n)}
  else if(a==='rv'){buyRV(n)}
  render()}
 function sellN(id,n,quiet){if(QITEM.has(id))return;let c=0;for(let i=0;i<n;i++){const j=S.inv.indexOf(id);if(j<0)break;S.inv.splice(j,1);c++}if(!c)return;const p=sellPrice(id);earn(p*c);inc('sell');
  S.bb=S.bb||[];const b=S.bb.find(x=>x.id===id&&x.p===p);if(b)b.n+=c;else S.bb.unshift({id,n:c,p});if(S.bb.length>12)S.bb.length=12;if(!quiet){snd('coin');log('Vendiste '+c+'× '+I[id][0]+' por '+money(p*c));dirty=1;save()}}
 // ══ MERCADO GLOBAL (simulado) ══
 const SELLERS=['Aldric','Maelis','Torvin','Selka','Brannoch','Yuna','Dorian','Hakon','Isolde','Pipo','Garrick','Lenka','Ostrel','Vesper','Kaito','Mirren','Rurik','Tamsin','Odalys','Burk'];
 const CATS=[['all','Todo'],['arm','Armas'],['def','Armaduras'],['tool','Herramientas'],['mat','Materiales'],['food','Comida'],['mag','Magia'],['misc','Varios']];
 const catOf=id=>/^(sw|bw|st|lw|maza|garrote|shuriken)(_|$)/.test(id)?'arm':/^(ar|lg|gl|sh)_/.test(id)||id==='antifaz'||id==='sombrero'||id==='corona'?'def':/^(pk|ax|rd)_/.test(id)?'tool':/^(c|f)_/.test(id)||['pan','carne','pollo','huevo','camaron','trucha','salmon','atun','sardina','arenque','lucio','pezespada','manta','kraken','arroz','hongo'].includes(id)||/^carne_/.test(id)?'food':/^(pot|sc|rn)_/.test(id)?'mag':/^(b|logs|roble|sauce|arce|abedul|fresno|ebano|tejo|caoba|baobab|mundo|cobre|estano|hierro|carbon|mitril|plata|adam|runita|oricalco|celestita|cuero|lana|tela|piel|hueso|pluma|grasa|gema|perla)(_|$)/.test(id)?'mat':'misc';
 const trade=id=>I[id]&&I[id][2]>0&&!/^rv_/.test(id)&&id!=='quemado';
 let ALL=null;const allIds=()=>ALL||(ALL=Object.keys(I).filter(trade));
 const fair=id=>Math.max(1,Math.round(val(id)*MK_K));
 const rng=(()=>{let s=(Date.now()>>>0)||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296}})();
 const MK={
  st(){S.mk=S.mk||{pool:[],my:[],ret:[],hist:[],t:0,seq:1};return S.mk},
  nid(){return this.st().seq++},
  // oferta simulada: item, cantidad, precio por unidad
  gen(now){let id,tries=0;while(tries++<40){id=allIds()[Math.floor(rng()*allIds().length)];const v=val(id);if(rng()<Math.min(1,160/(v+40)))break}
   const f=fair(id),st=/^(b_|pk_|ax_|sw_|ar_|lg_|gl_|sh_|st_|bw_)/.test(id)?1+Math.floor(rng()*2):1+Math.floor(rng()*(f<20?40:f<100?12:4));
   return{id:this.nid(),it:id,n:st,p:Math.max(1,Math.round(f*(.78+rng()*.75))),sel:SELLERS[Math.floor(rng()*SELLERS.length)],exp:now+(4+Math.floor(rng()*44))*3600000,mine:0}},
  // avanza la simulación hasta `now` (como mucho 24 h simuladas): caducan ofertas, entran otras, se venden las tuyas
  tick(now){const m=this.st();now=now||Date.now();if(!m.t){m.t=now;while(m.pool.length<260)m.pool.push(this.gen(now))}const dt=Math.min(24*3600000,now-m.t);if(dt<15000&&m.pool.length>=200)return;m.t=now;
   m.pool=m.pool.filter(o=>o.exp>now);const want=260,add=Math.min(60,Math.max(0,want-m.pool.length)+Math.floor(dt/3600000*8));for(let i=0;i<add;i++)m.pool.push(this.gen(now));
   // compradores simulados: a cada oferta tuya le toca con probabilidad según su precio frente al justo
   const hrs=dt/3600000;for(let i=m.my.length-1;i>=0;i--){const o=m.my[i];if(o.exp<=now){m.ret.push([o.it,o.n]);m.my.splice(i,1);toast('📦 Caducó tu oferta de '+I[o.it][0]+' (se devuelve a «Mis subastas»)',2600);continue}
    const f=fair(o.it),lam=Math.max(0,.9*(f*1.2/o.p-.55));if(rng()<1-Math.exp(-lam*hrs)){const k=Math.max(1,Math.ceil(o.n*(.35+.65*rng())));this.sold(o,k,i)}}
   if(m.pool.length>420)m.pool.splice(0,m.pool.length-420)},
  sold(o,k,i){const m=this.st(),gross=k*o.p,net=Math.round(gross*(1-COMM));earn(net);o.n-=k;m.hist.unshift({it:o.it,n:k,p:o.p,net,t:Date.now()});if(m.hist.length>20)m.hist.length=20;if(o.n<=0){S.coins+=o.dep||0;m.my.splice(i,1)}
   snd('coin');toast('🪙 Mercado: vendiste '+k+'× <b>'+I[o.it][0]+'</b><br>+'+money(net)+' (comisión '+Math.round(COMM*100)+' %)',3200);log('Mercado: vendiste '+k+'× '+I[o.it][0]+' por '+money(net));dirty=1},
  search(qq,cat,sort){this.tick();const m=this.st(),f=nrm(qq||'');let L=m.pool.filter(o=>I[o.it]&&(!f||nrm(I[o.it][0]).includes(f))&&(cat==='all'||!cat||catOf(o.it)===cat));
   L.sort(sort==='name'?(a,b)=>I[a.it][0].localeCompare(I[b.it][0])||a.p-b.p:sort==='time'?(a,b)=>a.exp-b.exp:(a,b)=>a.p-b.p||I[a.it][0].localeCompare(I[b.it][0]));return L.slice(0,160)},
  buy(id,n){const m=this.st(),o=m.pool.find(x=>x.id===id);if(!o)return 'Esa oferta ya no existe.';n=Math.min(n,o.n);let got=0;while(got<n&&S.coins>=o.p&&room(o.it)){S.coins-=o.p;add(o.it);got++}
   if(!got)return S.coins<o.p?'No tienes dinero suficiente.':'Mochila llena.';o.n-=got;if(o.n<=0)m.pool.splice(m.pool.indexOf(o),1);snd('coin');log('Mercado: compraste '+got+'× '+I[o.it][0]+' por '+money(got*o.p));dirty=1;save();return ''},
  post(it,n,p,hours){const m=this.st();if(count(it)<n||n<1)return 'No tienes esa cantidad.';p=Math.max(1,Math.floor(p));if(m.my.length>=20)return 'Máximo 20 ofertas a la vez.';const dep=Math.max(1,Math.round(p*n*.01*(hours/12)));if(S.coins<dep)return 'Necesitas '+money(dep)+' de depósito.';
   for(let i=0;i<n;i++)S.inv.splice(S.inv.indexOf(it),1);S.coins-=dep;m.my.push({id:this.nid(),it,n,p,exp:Date.now()+hours*3600000,mine:1,dep});snd('coin');log('Mercado: publicaste '+n+'× '+I[it][0]+' a '+money(p)+' c/u');dirty=1;save();return ''},
  cancel(id){const m=this.st(),i=m.my.findIndex(x=>x.id===id);if(i<0)return;const o=m.my[i];m.ret.push([o.it,o.n]);m.my.splice(i,1);dirty=1;save()},
  collect(){const m=this.st();let c=0;for(let i=m.ret.length-1;i>=0;i--){const[it,n]=m.ret[i];let k=0;while(k<n&&room(it)){S.inv.push(it);k++}c+=k;if(k>=n)m.ret.splice(i,1);else m.ret[i][1]=n-k}if(c){snd('coin');dirty=1;save()}return c}
 };
 let mtab='browse',mq='',mcat='all',msort='price',msel=null,mfq=1,mfd=24,mfp='';
 function mkMkt(){if($('#mkt'))return;const d=document.createElement('div');d.id='mkt';d.className='shw wide';d.hidden=true;
  d.innerHTML='<div class="shh"><i class="shi"></i><div class="sht"><b>Mercado</b><small>Subastas entre jugadores</small></div><button class="shx" title="Cerrar">✕</button></div><div class="shtabs"></div><div class="shctl"></div><div class="shl"></div><div class="shf"><span class="shn"></span><span class="shp"></span></div>';
  document.body.appendChild(d);d.querySelector('.shx').onclick=closeMkt;d.addEventListener('click',onMkt);d.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')closeMkt()});d.addEventListener('input',onMktIn)}
 function openMkt(e){mkMkt();close();MK.tick();mtab='browse';msel=null;const d=$('#mkt');d.hidden=false;d.style.setProperty('--acc','#d9a35a');d.dataset.e=e?'1':'';d._e=e||null;d.querySelector('.shi').style.backgroundImage='url('+UI.icon('bank')+')';rMkt();return true}
 function closeMkt(){const d=$('#mkt');if(d){d.hidden=true;d._e=null}}
 const left=o=>{const h=(o.exp-Date.now())/3600000;return h<2?'Muy corto':h<12?'Corto':h<24?'Medio':'Largo'};
 function rMkt(){const d=$('#mkt');if(!d||d.hidden)return;const m=MK.st();d.querySelector('.shtabs').innerHTML=[['browse','Explorar'],['sell','Vender'],['mine','Mis subastas'+(m.my.length?' ('+m.my.length+')':'')]].map(([t,l])=>'<button data-t="'+t+'" class="'+(t===mtab?'on':'')+'">'+l+'</button>').join('');
  const ctl=d.querySelector('.shctl'),L=d.querySelector('.shl');let h='';
  if(mtab==='browse'){ctl.innerHTML='<input class="shq" data-k="q" type="search" placeholder="Buscar objeto…" value="'+esc(mq)+'" autocomplete="off"><div class="shcats">'+CATS.map(([c,l])=>'<button data-c="'+c+'" class="'+(c===mcat?'on':'')+'">'+l+'</button>').join('')+'</div><div class="shsort">Ordenar: <button data-s="price" class="'+(msort==='price'?'on':'')+'">Precio</button><button data-s="name" class="'+(msort==='name'?'on':'')+'">Nombre</button><button data-s="time" class="'+(msort==='time'?'on':'')+'">Tiempo</button></div>';
   const res=MK.search(mq,mcat,msort);h='<div class="shth"><span>Objeto</span><span>Vendedor</span><span>Tiempo</span><span>Precio</span></div>'+(res.map(o=>'<div class="shr mk'+(S.coins<o.p?' cant':'')+'" data-a="mbuy" data-id="'+o.id+'" data-i="'+o.it+'"><i class="mi"'+sfx(o.it)+'>'+ic(o.it)+'</i><div class="shnm"><b>'+esc(I[o.it][0])+'</b><em>x'+o.n+'</em></div><span class="shsl">'+o.sel+'</span><span class="shsl">'+left(o)+'</span><span class="shpr">'+moneyH(o.p)+'<small>c/u</small></span></div>').join('')||'<div class="shem">No hay ofertas con ese filtro.</div>');
   d.querySelector('.shn').textContent='LMB: comprar 1 · Mayús: 5 · Ctrl: toda la oferta'}
  else if(mtab==='sell'){const ids=[...new Set(S.inv)].filter(id=>trade(id));ctl.innerHTML='<div class="shsec">Elige un objeto de tu mochila</div>';
   const it=msel&&count(msel)>0?msel:null;if(msel&&!it)msel=null;
   h=(ids.map(id=>'<div class="shr'+(id===msel?' sel':'')+'" data-a="msel" data-id="'+id+'" data-i="'+id+'"><i class="mi"'+sfx(id)+'>'+ic(id)+'</i><div class="shnm"><b>'+esc(I[id][0])+'</b><em>x'+count(id)+' · precio justo ≈ '+money(fair(id))+'</em></div></div>').join('')||'<div class="shem">No tienes nada que se pueda vender.</div>');
   if(it){const f=fair(it);if(!mfp)mfp=String(f);const dep=Math.max(1,Math.round((+mfp||f)*Math.min(mfq,count(it))*.01*(mfd/12))),tot=(+mfp||0)*Math.min(mfq,count(it));
    h='<div class="shform"><div class="shsec">Publicar '+esc(I[it][0])+'</div><label>Cantidad <input data-k="fq" type="number" min="1" max="'+count(it)+'" value="'+Math.min(mfq,count(it))+'"> / '+count(it)+'</label><label>Precio por unidad (cobre) <input data-k="fp" type="number" min="1" value="'+esc(mfp)+'"></label>'
     +'<div class="hint">Precio justo ≈ '+money(f)+' · el vendedor de la tienda te da '+money(sellPrice(it))+'</div><label>Duración <select data-k="fd"><option value="12"'+(mfd==12?' selected':'')+'>12 horas</option><option value="24"'+(mfd==24?' selected':'')+'>24 horas</option><option value="48"'+(mfd==48?' selected':'')+'>48 horas</option></select></label>'
     +'<div class="hint">Depósito '+money(dep)+' (se devuelve al venderse) · comisión '+Math.round(COMM*100)+' % · cobrarás ≈ '+moneyH(Math.round(tot*(1-COMM)))+'</div><button class="bt" data-a="post">Publicar oferta</button></div>'+h}
   d.querySelector('.shn').textContent=''}
  else{ctl.innerHTML=m.ret.length?'<div class="shsec">Devoluciones: '+m.ret.map(([i,n])=>n+'× '+I[i][0]).join(', ')+' <button class="bt" data-a="collect">Recoger</button></div>':'';
   h=(m.my.map(o=>'<div class="shr mk" data-i="'+o.it+'"><i class="mi"'+sfx(o.it)+'>'+ic(o.it)+'</i><div class="shnm"><b>'+esc(I[o.it][0])+'</b><em>x'+o.n+' · '+left(o)+'</em></div><span class="shpr">'+moneyH(o.p)+'<small>c/u</small></span><button class="bt" data-a="mcancel" data-id="'+o.id+'">Cancelar</button></div>').join('')||'<div class="shem">No tienes ofertas publicadas.</div>');
   if(m.hist.length)h+='<div class="shsec">Ventas recientes</div>'+m.hist.slice(0,8).map(x=>'<div class="shr" data-i="'+x.it+'"><i class="mi">'+ic(x.it)+'</i><div class="shnm"><b>'+esc(I[x.it][0])+'</b><em>x'+x.n+' a '+money(x.p)+' c/u</em></div><span class="shpr">+'+moneyH(x.net)+'</span></div>').join('');
   d.querySelector('.shn').textContent='Si no se vende, sube o baja el precio: los otros jugadores comparan.'}
  L.innerHTML=h;d.querySelector('.shp').innerHTML=moneyH(S.coins)}
 function onMkt(e){const d=$('#mkt'),t=e.target.closest('[data-t]');if(t&&t.parentNode.classList.contains('shtabs')){mtab=t.dataset.t;rMkt();return}
  const c=e.target.closest('[data-c]');if(c){mcat=c.dataset.c;rMkt();return}const s=e.target.closest('[data-s]');if(s){msort=s.dataset.s;rMkt();return}
  const r=e.target.closest('[data-a]');if(!r)return;const a=r.dataset.a,id=+r.dataset.id;
  if(a==='mbuy'){const o=MK.st().pool.find(x=>x.id===id);if(!o)return;const msg=MK.buy(id,e.ctrlKey||e.metaKey?o.n:e.shiftKey?5:1);if(msg)toast(msg,1600)}
  else if(a==='msel'){msel=r.dataset.id;mfp='';mfq=1}
  else if(a==='post'){const it=msel,msg=MK.post(it,Math.min(mfq,count(it)),+mfp,mfd);if(msg)toast(msg,2000);else{msel=null;mfp='';mtab='mine'}}
  else if(a==='mcancel'){MK.cancel(id)}else if(a==='collect'){const n=MK.collect();if(!n)toast('Mochila llena.',1500)}
  rMkt()}
 function onMktIn(e){const k=e.target.dataset.k;if(!k)return;if(k==='q'){mq=e.target.value;const pos=e.target.selectionStart;rMkt();const q2=$('#mkt .shq');if(q2){q2.focus();try{q2.setSelectionRange(pos,pos)}catch(x){}}return}
  if(k==='fq')mfq=Math.max(1,+e.target.value||1);else if(k==='fp')mfp=e.target.value;else if(k==='fd')mfd=+e.target.value||24;
  if(k==='fd'){rMkt();return}const f=$('#mkt .shform .hint:last-of-type');if(msel&&f){const n=Math.min(mfq,count(msel)),p=+mfp||0;f.innerHTML='Depósito '+money(Math.max(1,Math.round(p*n*.01*(mfd/12))))+' (se devuelve al venderse) · comisión '+Math.round(COMM*100)+' % · cobrarás ≈ '+moneyH(Math.round(p*n*(1-COMM)))}}
 // cierre automático al alejarse; refresco ligero del dinero; la simulación avanza sola cada 20 s
 setInterval(()=>{try{const d=$('#vend');if(V&&V.e&&Math.hypot(P.x-V.e.x,P.y-V.e.y)>130)close();if(V&&d&&!d.hidden)d.querySelector('.shp').innerHTML=moneyH(S.coins);const m=$('#mkt');if(m&&!m.hidden&&m._e&&Math.hypot(P.x-m._e.x,P.y-m._e.y)>130)closeMkt();if(typeof S!=='undefined'&&S.mk)MK.tick()}catch(e){}},1000);
 addEventListener('keydown',e=>{if(e.key==='Escape'){close();closeMkt()}},true);
 return{open,close,openMkt,closeMkt,MARKET:MK,VEND,buyPrice,sellPrice,fair,catOf,render,rMkt}})();
