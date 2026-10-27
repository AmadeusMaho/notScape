// WKUI — Hoja de trabajo (crafteo estilo FF14) conectada al juego. L0b–L1b, 22 oct 2026. Lógica pura en work.js (WK).
// Hoy solo la usa la HERRERÍA en yunque/armero (el horno sigue automático). Plan: docs/PLAN_OFICIOS_FF14.md.
// D2 (25 oct 2026): GENERALIZADO. El oficio activo es `OF` (se fija en start() desde A.sk); un oficio nuevo se registra con WKUI.reg('cr',{n:'Artesanía',stn:['bench'],clip:'sm'}) y listo
// (barra/macros por oficio en S.wkb[of], acciones exclusivas por `of:` en WK.A, estación→oficio con WKUI.on(sk,stn), animación: `clip` = clip del héroe, por defecto el de herrería).
// Se carga DESPUÉS de game.js: usa sus globales (A, S, L, XT, ACT, stepAct, hasIn, log, banner, tone, noise, whSnd, whFx, armPose, armP0, FM_IMP, WH_REC, stopA…).
// Barra de 20 casillas (teclas 1–0 y Mayús+1–0) asignable arrastrando desde el libro; 3 macros de hasta 6 acciones (nv ≥ 30). Guardado en S.wkb[oficio].
const WKUI=(()=>{
  let OF='sm',SKIN='forge';
  const REG={sm:{n:'Herrería',stn:['anvil','armero'],clip:'sm',skin:'forge'}};   // skin = tema de interfaz propia (src/forge.js THEMES)   // oficios con hoja de trabajo: nombre, estaciones donde se abre, clip de animación del héroe (respaldo genérico = 'sm')
  const GRP={p:'Avance',pq:'Avance',q:'Calidad',b:'Estados',r:'Reparación',u:'Utilidad'},ORD=['p','q','b','r','u'];
  const DESC={sb:'Avance 120 %.',tb:'Calidad 100 %. +1 Concentración.',mm_:'Recupera 30 de Resistencia.',ht:'Calidad 100 %, 60 % de acierto, gratis.',rs:'Avance 500 %, 50 % de acierto, gratis.',ob:'No hace nada; enlaza otras acciones.',tt:'Solo con pieza Buena o Excelente: +20 PO.',wn:'4 acciones con la mitad de gasto de Resistencia.',ve:'+50 % de Avance durante 4 acciones.',ts:'Calidad 125 %. Cuesta 18 tras Toque básico.',gs:'El siguiente toque rinde el doble.',inn:'+50 % de Calidad durante 4 acciones.',fa:'El Avance no pasa de 99 % durante 5 acciones.',wn2:'8 acciones con la mitad de gasto.',by:'Calidad 100 % +20 % por Concentración. La consume.',pt:'Solo Buena o Excelente. Calidad 150 %, +2 Concentración.',mu:'Solo en el 1.er paso. Avance 300 % y bono de Avance.',co:'Vuelve a tirar la condición (3 usos).',cs:'Avance 180 %.',ma:'+5 Resistencia por acción durante 8 acciones.',pdt:'Calidad 100 %, mitad de gasto. No con Sin desperdicio.',rf:'Solo en el 1.er paso. Calidad 100 %, +2 Concentración.',pp:'Calidad 200 %, doble gasto, +2 Concentración.',gw:'Avance 360 %, doble gasto.',de:'Avance 100 % y Calidad 100 %.',is:'Solo Buena o Excelente. Avance 400 %.',at:'Calidad 150 %. Cuesta 18 tras Toque estándar.',ps:'Avance 180 %, mitad de gasto. No con Sin desperdicio.',te:'1.er paso, receta muy inferior a tu nivel: Calidad al máximo.',tf:'Con Concentración 10: Calidad 100 % sin gasto.',rt:'Calidad 100 % tras Toque básico.',qi:'Innovación al instante (1 vez).',im:'Restaura toda la Resistencia (1 vez).',tp_:'La siguiente acción no gasta Resistencia (1 vez).',hs:'Fuerza una acción como si la pieza fuera Excelente (1 vez).',
    gd:'Dos martillazos: Avance 220 %, doble gasto.',es_:'Avance 150 % y +1 Concentración.',fc:'Veneración y +1 Concentración.',tm:'+20 Resistencia y 3 acciones a mitad de gasto.',rm:'Calidad 160 %. Pide Concentración 3 o más.',
    lj:'Calidad 130 %, a mitad de gasto de Resistencia.',ec:'Avance +50 % durante 3 acciones y +1 Concentración.',ce:'Avance 190 %.',as_:'Calidad 170 %. Pide Concentración 2 o más.',bz:'Innovación (+50 % de Calidad) y +1 Concentración.',
    cd:'Calidad 130 %, a mitad de gasto de Resistencia.',hl:'Avance +50 % durante 3 acciones y +1 Concentración.',rb:'Avance 190 %.',bo:'Calidad 170 %. Pide Concentración 2 o más.',tj:'Innovación (+50 % de Calidad) y +1 Concentración.',
    rj:'La Condición pasa a Buena.',cf:'Calidad 140 %, a mitad de gasto de Resistencia.',ct:'+15 Resistencia y 2 acciones a mitad de gasto.',gr:'Calidad 170 %. Pide Concentración 2 o más.',tz:'Avance 200 % y +1 Concentración.'};
  const OFN=()=>(REG[OF]&&REG[OF].n)||SK[OF][0];
  const DEFBAR=['sb','gd','tb','ts','pp','by','ve','inn','wn','mm_'];
  const SVG={p:'<path d="M4 20l6-6M9 7l8 8-3 3-8-8z"/>',q:'<path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z"/>',b:'<path d="M12 4v16M6 10l6-6 6 6"/>',r:'<path d="M12 5v14M5 12h14"/>',u:'<circle cx="12" cy="12" r="4"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/>',m:'<path d="M5 6h14M5 12h14M5 18h9"/>'};
  const ico=t=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+SVG[t==='pq'?'p':t]+'</svg>';
  const CCOL={normal:'',buena:'#9fe1a8',excelente:'#ffd36b',mala:'#e08a8a'};
  const NM={ve:'Veneración',inn:'Innovación',gs:'Gran avance',wn:'Sin desperdicio',wn2:'Sin desperdicio II',fa:'Tasación final',ma:'Manipulación',mu:'Memoria muscular',tp:'Perfección'};
  let el=null,lock=0,pend=null,endAt=0,hl=null,edit=-1,runQ=[],ghost=null,dragEnd=0;
  const $=s=>el.querySelector(s);
  const esc=s=>String(s).replace(/"/g,'&quot;');
  const isMac=v=>!!v&&v[0]==='m'&&!WK.A[v];
  // ---------- persistencia de la barra y las macros ----------
  function wb(){S.wkb=S.wkb||{};return S.wkb[OF]=S.wkb[OF]||{bar:new Array(20).fill(null),mac:[[],[],[]],seen:{}}}
  function syncBar(lvl){ // las acciones nuevas entran solas en la primera casilla libre (una vez); lo que quitas no vuelve
    const b=wb(),first=!Object.keys(b.seen).length;
    if(first)DEFBAR.forEach((id,i)=>{if(WK.A[id]&&WK.A[id].lv<=lvl&&(!WK.A[id].of||WK.A[id].of===OF))b.bar[i]=id});
    for(const id of WK.list(OF,lvl)){if(WK.A[id].spec||b.seen[id])continue;b.seen[id]=1;if(!b.bar.includes(id)){const k=b.bar.indexOf(null);if(k>=0)b.bar[k]=id}}
    b.bar=b.bar.map(x=>x&&!isMac(x)&&!WK.avail(x,lvl)?null:x)}
  // ---------- DOM ----------
  function build(){
    el=document.createElement('div');el.id='wk';el.style.display='none';
    el.innerHTML='<div class="wk-h"><b id="wk-n"></b><span id="wk-s"></span></div>'
     +'<div class="wk-meta"><div class="wk-xp"><i id="wk-xpb"></i></div><span id="wk-nx"></span></div>'
     +'<div class="wk-stage"><canvas id="wk-cv"></canvas></div>'
     +'<div class="wk-g"><div class="wk-bars">'
     +'<div class="wk-l"><span>Avance</span><span id="wk-pt"></span></div><div class="wk-b"><i id="wk-pb" class="p"></i></div>'
     +'<div class="wk-l"><span>Calidad</span><span id="wk-qt"></span></div><div class="wk-b"><i id="wk-qb" class="q"></i></div>'
     +'<div id="wk-st" class="wk-st"></div></div>'
     +'<div class="wk-side"><div><small>Resistencia</small><b id="wk-du"></b></div><div><small>Puntos de oficio</small><b id="wk-po" class="po"></b></div>'
     +'<div><small>Concentración</small><b id="wk-iq"></b></div><div id="wk-cd" class="wk-cd"></div></div></div>'
     +'<div id="wk-ac" class="wk-ac"></div><div id="wk-mc" class="wk-mc"></div>'
     +'<div class="wk-f"><div id="wk-bar" class="wk-bar"></div><div class="wk-bt"><button id="wk-qk" hidden>Rápida</button><button id="wk-sg">Sugerir</button><button id="wk-ex">Salir</button></div></div>'
     +'<div id="wk-m" class="wk-m"></div>';
    document.body.appendChild(el);if(typeof FORGE!=='undefined')FORGE.mount(el);   // D8: lienzo de la fragua (solo se ve con skin:'forge')
    $('#wk-sg').onclick=()=>{if(!A||!A.wk)return;const id=WK.suggest(A.wk.s);msg(id?'Sugerencia: '+WK.A[id].n:'');hl=id;render()};
    $('#wk-ex').onclick=()=>stopA('Dejas la pieza.');
    $('#wk-qk').onclick=quick;
    el.addEventListener('mousedown',e=>e.stopPropagation());
    el.addEventListener('click',click);
    // arrastre libro → barra (puntero: vale ratón y dedo)
    el.addEventListener('pointerdown',e=>{
      const src=e.target.closest('.wk-a[data-w],.wk-sl[data-w],.wk-sl[data-mi],.wk-mb');if(!src||e.button!==0)return;
      const val=src.dataset.w!=null?src.dataset.w:'m'+src.dataset.mi;
      ghost={val,from:src.dataset.slot!=null?{k:'slot',i:+src.dataset.slot}:{k:'book'},x:e.clientX,y:e.clientY,on:false,src};
    });
    addEventListener('pointermove',e=>{
      if(!ghost)return;
      if(!ghost.on&&Math.hypot(e.clientX-ghost.x,e.clientY-ghost.y)>6){ghost.on=true;ghost.el=document.createElement('div');ghost.el.className='wk-gh';ghost.el.innerHTML=ico(isMac(ghost.val)?'m':WK.A[ghost.val].t);document.body.appendChild(ghost.el);ghost.src.classList.add('dgs')}
      if(ghost.on){ghost.el.style.left=e.clientX+'px';ghost.el.style.top=e.clientY+'px';const u=document.elementFromPoint(e.clientX,e.clientY),sl=u&&u.closest&&u.closest('.wk-sl');el.querySelectorAll('.wk-sl').forEach(s=>s.classList.toggle('dz',s===sl))}
    });
    addEventListener('pointerup',e=>{
      if(!ghost)return;const g=ghost;ghost=null;
      if(!g.on)return;g.el.remove();g.src.classList.remove('dgs');
      const tgt=document.elementFromPoint(e.clientX,e.clientY),sl=tgt&&tgt.closest&&tgt.closest('.wk-sl'),b=wb();
      if(sl){const j=+sl.dataset.slot;if(g.from.k==='slot'){const t=b.bar[j];b.bar[j]=b.bar[g.from.i];b.bar[g.from.i]=t}else b.bar[j]=g.val}
      else if(g.from.k==='slot'&&!(tgt&&tgt.closest&&tgt.closest('#wk')))b.bar[g.from.i]=null;   // soltar fuera de la ventana = quitar de la barra
      dragEnd=performance.now();render();
    });
  }
  const msg=t=>{if(el)$('#wk-m').textContent=t||''};
  const tip=id=>{const a=WK.A[id];return '<b>'+a.n+'</b><br>'+(a.po?a.po+' PO · ':'')+'nv '+a.lv+(a.of?' · exclusiva':'')+'<br>'+(DESC[id]||'')};
  const slotKey=i=>i<10?String((i+1)%10):'⇧'+((i-9)%10);
  function slotHTML(i,s){
    const b=wb(),v=b.bar[i];let inner='',cls='wk-sl',dx='',at='';
    if(!v)cls+=' em';
    else if(isMac(v)){const k=+v.slice(1),m=b.mac[k]||[];inner=ico('m')+'<small>'+(k+1)+'</small>';dx=esc('<b>Macro '+(k+1)+'</b><br>'+m.map(x=>WK.A[x].n).join(' → '));at=' data-mi="'+k+'"'}
    else{const a=WK.A[v];inner=ico(a.t);dx=esc(tip(v));if(WK.can(s,v))cls+=' off';if(v===hl)cls+=' hl';at=' data-w="'+v+'"'}
    return '<button class="'+cls+'" data-slot="'+i+'"'+at+(dx?' data-x="'+dx+'"':'')+'><kbd>'+slotKey(i)+'</kbd>'+inner+'</button>'}
  const btn=(id,s)=>{const a=WK.A[id],why=WK.can(s,id);return '<button class="wk-a t-'+a.t+(why?' off':'')+(id===hl?' hl':'')+(a.of?' ex':'')+'" data-w="'+id+'" data-x="'+esc(tip(id))+'">'+ico(a.t)+'<span>'+a.n+'</span><em>'+(WK.cost(s,id)||'')+'</em></button>'};
  function metaHTML(lvl){
    const x=S.xp[OF]||0,a=XT[lvl]||0,b=XT[lvl+1]||a+1,f=Math.max(0,Math.min(1,(x-a)/(b-a))),nx=WK.nextUnlock(OF,lvl);
    $('#wk-xpb').style.width=(f*100)+'%';
    let t='';if(nx){const d=nx.lv-lvl;t=d===1&&f>=.8?'<b class="near">Casi tienes '+WK.A[nx.id].n+'</b> · nv '+nx.lv:'Siguiente: <b>'+WK.A[nx.id].n+'</b> · nv '+nx.lv}else t='Has aprendido todas las acciones';
    $('#wk-nx').innerHTML=t+' <span class="mu">· '+Math.round(f*100)+' % al nv '+(lvl+1)+'</span>'}
  function render(){
    if(!el||!A||!A.wk)return;const w=A.wk,s=w.s,rec=w.rec,lvl=s.lvl;
    $('#wk-n').textContent=rec.name;$('#wk-s').textContent=OFN()+' nv '+lvl+' · Maña '+Math.round(s.mana)+' · Pulso '+Math.round(s.pulso)+' · receta nv '+rec.lvl+(A.left<1e8&&A.left>1?' · quedan '+A.left:'');
    metaHTML(lvl);
    $('#wk-qk').hidden=!(lvl-rec.lvl>=15&&!s.over&&!s.hist.length);   // síntesis rápida: recetas ≥ 15 niveles por debajo de las tuyas
    const hq=WK.hq(s);if(el.classList.contains('wk-forge'))FORGE.sync(s);
    $('#wk-pt').textContent=Math.min(s.prog,s.progMax)+' / '+s.progMax;$('#wk-pb').style.width=Math.min(100,100*s.prog/s.progMax)+'%';
    $('#wk-qt').textContent=hq+' % calidad superior';$('#wk-qb').style.width=Math.min(100,hq)+'%';
    $('#wk-du').textContent=Math.max(0,s.dur);$('#wk-po').textContent=s.po;$('#wk-iq').textContent=s.iq+' / '+WK.MAXIQ;
    const c=$('#wk-cd');c.textContent=WK.CONDS[s.cond].n;c.style.color=CCOL[s.cond]||'#e8cf94';c.dataset.c=s.cond;
    $('#wk-st').innerHTML=Object.keys(s.b).filter(k=>s.b[k]>0).map(k=>'<span class="wk-ch">'+(NM[k]||k)+' · '+s.b[k]+'</span>').join('')||'<span class="wk-mu">Sin estados</span>';
    let h='';
    for(const g of ORD){
      const list=WK.list(OF,lvl).filter(id=>{const a=WK.A[id],t=a.t;return !a.spec&&(t===g||(g==='p'&&t==='pq'))});
      if(!list.length)continue;
      const T=el.classList.contains('wk-forge')&&FORGE.toolsOf(SKIN)[g];
      h+='<div class="wk-gr">'+(T?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+T.i+'</svg>'+T.n+' <small>· '+T.s+'</small>':GRP[g])+'</div><div class="wk-gd">'+list.map(id=>btn(id,s)).join('')+'</div>'}
    $('#wk-ac').innerHTML=h+'<div class="wk-hint">Arrastra una acción a la barra para colocarla; arrastra una casilla fuera para quitarla.</div>';
    const mc=$('#wk-mc');
    if(lvl>=30){const b=wb();mc.style.display='block';
      mc.innerHTML='<div class="wk-gr">Macros</div><div class="wk-mr">'+b.mac.map((m,i)=>'<div class="wk-mi'+(edit===i?' ed':'')+'"><button class="wk-mb" data-mi="'+i+'" data-x="'+esc('<b>Macro '+(i+1)+'</b><br>'+(m.length?m.map(x=>WK.A[x].n).join(' → '):'Vacía. Pulsa ✎ y elige hasta 6 acciones.'))+'">'+ico('m')+'<span>Macro '+(i+1)+'</span><em>'+m.length+'</em></button><button class="wk-me" data-me="'+i+'" title="Editar">'+(edit===i?'✓':'✎')+'</button>'+(m.length?'<button class="wk-me" data-mx="'+i+'" title="Borrar">✕</button>':'')+'</div>').join('')+'</div>'
        +(edit>=0?'<div class="wk-mh">Editando macro '+(edit+1)+' ('+b.mac[edit].length+'/6): pulsa acciones del libro para añadirlas · '+b.mac[edit].map(x=>WK.A[x].n).join(' → ')+'</div>':'')}
    else{mc.style.display='none';mc.innerHTML=''}
    $('#wk-bar').innerHTML=[0,1].map(r=>'<div class="wk-row">'+Array.from({length:10},(_,k)=>slotHTML(r*10+k,s)).join('')+'</div>').join('');
  }
  function click(e){
    if(performance.now()-dragEnd<250)return;
    const me=e.target.closest('[data-me]'),mx=e.target.closest('[data-mx]'),mb=e.target.closest('.wk-mb'),it=e.target.closest('.wk-a[data-w]'),sl=e.target.closest('.wk-sl'),b=wb();
    if(me){const i=+me.dataset.me;edit=edit===i?-1:i;render();return}
    if(mx){const i=+mx.dataset.mx;b.mac[i]=[];if(edit===i)edit=-1;render();return}
    if(mb){const i=+mb.dataset.mi;if(b.mac[i].length)runQ=b.mac[i].slice();else msg('Macro vacía.');return}
    if(it){const id=it.dataset.w;if(edit>=0){const m=b.mac[edit];if(m.length<6)m.push(id);render();return}use(id);return}
    if(sl){if(sl.dataset.mi!=null){const m=b.mac[+sl.dataset.mi];if(m&&m.length)runQ=m.slice()}else if(sl.dataset.w)use(sl.dataset.w)}
  }
  // ---------- recetas y arranque ----------
  function gear(){try{return typeof OFGEAR!=='undefined'?OFGEAR.bonus(OF):null}catch(e){return null}}
  function start(now){
    if(!el)build();
    OF=A.sk;const a=ACT[A.sk][A.i],lvl=L(OF),st=Object.assign(WK.mkStats(lvl,gear()),{of:OF}),rec=WK.mkRecipe(a[3],a[0]);
    A.wk={s:WK.start(rec,st),rec,a};const skin=REG[OF]&&REG[OF].skin;SKIN=skin||'';el.classList.toggle('wk-forge',!!skin);if(skin&&typeof FORGE!=='undefined')FORGE.open(rec,a[2],skin);else if(typeof FORGE!=='undefined')FORGE.close();
    Object.assign(A,{wl:now,h0:-1e9,hn:0,p0:0,wkv:null});lock=0;pend=null;endAt=0;hl=null;runQ=[];edit=-1;
    syncBar(lvl);el.style.display='flex';render();msg('Elige una acción (teclas 1–0; Mayús+1–0 la 2.ª fila).');
  }
  // ---------- efectos ----------
  const FXC={p:'#ffb347',pq:'#ffb347',q:'#8fc4ff',b:'#e8cf94',r:'#9fe1a8',u:'#cfc6ac'},BUFC={ve:'#ffd36b',inn:'#7fb4e8',wn:'#9fe1a8',wn2:'#9fe1a8',gs:'#ffffff',fa:'#e8cf94',ma:'#9fe1a8',mu:'#ffb347',tp:'#ffffff',fc:'#ffb347',tm:'#9fe1a8'};
  function fxAct(id,exc,miss){
    const f=window.R3D&&R3D.fx,e=A&&A.e;if(!f||!e)return;const a=WK.A[id],t=a.t,col=FXC[t]||'#fff';
    if(t==='p'||t==='pq'){const n=Math.min(26,6+Math.round((a.e||100)/25));f.spark(e.x,e.y,n,exc?'#fff1b0':col,10,{spread:1.1,up:2.4,g:-.5,size:.075,life:.9});f.spark(e.x,e.y,Math.ceil(n/3),'#ff7a2a',5,{spread:.5,up:1.2,g:-.3,size:.05,life:1.2});if(!miss)f.smoke(e.x,e.y,4,'#8a867e',1.4,{size:.12,grow:2,life:.7,up:.6,alpha:.2})}
    else if(t==='q'){f.spark(e.x,e.y,14,exc?'#ffe9a0':col,4,{spread:.4,up:2.2,g:.15,size:.06,life:1.1});f.spark(e.x,e.y,6,'#ffffff',3,{spread:.25,up:2.8,g:.2,size:.045,life:1.3})}
    else if(t==='b'){const c=BUFC[id]||col;for(let k=0;k<2;k++)f.spark(P.x,P.y,14,c,3,{spread:1.6,up:1.6,g:-.05,size:.06,life:1.2});f.spark(e.x,e.y,8,c,2,{spread:.5,up:2.4,g:0,size:.05,life:1.3})}
    else if(t==='r'){f.spark(e.x,e.y,18,'#9fe1a8',3,{spread:.9,up:2,g:.1,size:.065,life:1.1});f.spark(P.x,P.y,8,'#e8ffe9',2,{spread:.7,up:1.8,g:0,size:.05,life:1.2})}
    else f.spark(P.x,P.y,6,col,2,{spread:.6,up:1.2,g:0,size:.045,life:1})}
  // D8: mensaje de éxito para TODOS los oficios («¡Espada de hierro forjada con éxito!»): verbo por oficio (REG[of].verb) y concordancia de género/número por la primera palabra
  const VERB={sm:'forjad',cr:'fabricad',pe:'elaborad',sa:'confeccionad'};
  function okMsg(a){const out=String(a[2]||''),it=I[out.split('~')[0]],name=(it&&!/^(tl:|rn_)/.test(out)?it[0]:a[0]).replace(/^./,c=>c.toUpperCase()),w=name.split(' ')[0].toLowerCase(),pl=/s$/.test(w),fem=/a$/.test(pl?w.slice(0,-1):w);
    const v=/^cu_/.test(out)?'curtid':(VERB[OF]||'hech');return'¡'+name+' '+v+(fem?'a':'o')+(pl?'s':'')+' con éxito!'}
  function winCard(msg,out,q){   // oficios sin interfaz propia: tarjeta flotante con el icono del objeto que sube y se desvanece
    let c=document.getElementById('wk-ok');if(!c){c=document.createElement('div');c.id='wk-ok';document.body.appendChild(c)}
    let ic='';try{const u=typeof ITEMICON!=='undefined'&&String(out).indexOf(':')<0&&ITEMICON.url(String(out).split('~')[0]);if(u)ic='<img src="'+u+'" alt="">'}catch(e){}
    c.innerHTML=ic+'<b>'+msg+'</b><i>'+'★'.repeat(1+Math.round(q*3))+'</i>';c.classList.remove('on');void c.offsetWidth;c.classList.add('on')}
  let LASTMSG='';
  function fxEnd(ok,q){
    if(el&&el.classList.contains('wk-forge'))FORGE.end(ok,q,LASTMSG);
    if(!(el&&el.classList.contains('wk-forge'))&&ok&&A&&A.wk)winCard(LASTMSG,A.wk.a[2],q);
    const f=window.R3D&&R3D.fx,e=A&&A.e;if(!f||!e)return;
    if(!ok){f.smoke(e.x,e.y,18,'#6e6a62',2,{size:.16,grow:2.6,life:1.2,up:.7,alpha:.3});return}
    const c=q>=.8?'#ffd36b':q>=.4?'#8fc4ff':'#e8dfc8',n=18+Math.round(q*34);
    f.spark(e.x,e.y,n,c,12,{spread:1.6,up:3.2,g:-.5,size:.08,life:1.4});f.spark(P.x,P.y,Math.round(n/2),c,4,{spread:1.8,up:2.4,g:-.1,size:.06,life:1.5});
    if(q>=.8&&typeof whPulse==='function')whPulse(performance.now())}
  // variante de animación del héroe por acción (la lee heroanim3d.js: smith → v)
  const VAR={p:'h',pq:'h',q:'t',b:'c',r:'m',u:'o'},GEST={c:900,m:1000,o:700,f:1300};
  // ---------- uso de una acción ----------
  function use(id){
    if(!A||!A.wk||A.wk.over)return false;const now=performance.now();if(now<lock)return false;
    const w=A.wk,s=w.s,why=WK.can(s,id);if(why){msg(why);tone(170,.06,'sawtooth',.03);runQ=[];return false}
    const exc=s.cond==='excelente',a=WK.A[id],t=a.t,hit=(t==='p'||t==='q'||t==='pq');
    const snap={prog:s.prog,dur:s.dur,hq:WK.hq(s)};
    const r=WK.use(s,id);if(!r.ok){msg(r.why||'');return false}
    hl=null;A.wl=now;fxAct(id,exc,r.hit===false);if(el.classList.contains('wk-forge'))FORGE.act(id,exc,r,snap,s);
    A.wkv=(id==='gd'||id==='gw'||id==='is'||id==='mu')?'H':(id==='by'?'B':((SKIN&&FORGE.var(SKIN)[t])||VAR[t]||'h'));A.wkv0=now;A.wkn=(A.wkn||0)+1;
    if(hit){A.hn++;A.p0=armP0(now-A.h0,FM_IMP,FM_IMP+WH_REC,.65);A.h0=now;pend={t:now+FM_IMP,q:!r.hit?0:exc?2:1,miss:!r.hit};lock=now+640}
    else{lock=now+420;tone(t==='r'?440:520,.14,'sine',.04,260)}
    el.style.setProperty('--lk',(lock-now)+'ms');el.querySelectorAll('.wk-sl').forEach(x=>{x.classList.remove('lk');void x.offsetWidth;x.classList.add('lk')});
    msg(r.hit===false?'Falló.':'');render();
    el.querySelectorAll('[data-w="'+id+'"]').forEach(x=>{x.classList.remove('pop');void x.offsetWidth;x.classList.add('pop')});   // D8: la casilla/botón pulsado «salta»
    if(s.over){runQ=[];endAt=now+(hit?FM_IMP+260:200)}
    return true}
  function tick(now){
    if(!A||!A.wk)return;
    if(now-A.wl>60000)return stopA();
    if(pend&&now>=pend.t){const p=pend,e=A.e;pend=null;
      if(p.miss){noise(.05,.1,420,'lowpass');tone(105,.12,'square',.05,-20)}else{whSnd(OF,p.q);whFx(OF,e,p.q);if(p.q===2&&typeof whPulse==='function')whPulse(now)}}
    if(endAt&&now>=endAt){endAt=0;finish(now)}
    // macro en marcha: una acción cada vez que se libera el bloqueo; se detiene si la pieza sale Excelente
    if(A.wk&&runQ.length&&now>=lock&&!A.wk.s.over){const s=A.wk.s;if(s.cond==='excelente'&&!['pt','is','tt','by','rm'].includes(runQ[0])){msg('Macro detenida: la pieza está Excelente.');runQ=[]}else{const id=runQ.shift();if(!use(id))runQ=[]}}
    const cd=A.wk&&A.wk.s.cond;if((cd==='buena'||cd==='excelente')&&!A.wk.s.over&&now>=(A.wkAmb||0)){A.wkAmb=now+(cd==='excelente'?260:520);const f=window.R3D&&R3D.fx,ee=A.e;if(f&&ee)f.spark(ee.x,ee.y,cd==='excelente'?5:2,cd==='excelente'?'#fff1b0':'#ffb347',3,{spread:.5,up:1.6,g:-.15,size:.05,life:1})}
  }
  function finish(now){
    const w=A.wk,s=w.s;
    if(!s.ok){fxEnd(false,0);msg('La pieza se agota sin terminarse. No pierdes materiales.');tone(150,.3,'sawtooth',.04,-60);return reopen(now,1500)}
    const q=WK.hq(s)/100;QBON=1+1.4*q;const a=w.a,ok=stepAct(A.sk,A.i,false);QBON=1;
    if(!ok)return stopA();
    A.wkv='f';A.wkv0=now;A.wkn=(A.wkn||0)+1;   // levanta la pieza para mirarla
    LASTMSG=okMsg(a);fxEnd(true,q);msg(LASTMSG+' · calidad superior '+WK.hq(s)+' %');tone(660,.2,'triangle',.06,330);setTimeout(()=>tone(880,.25,'triangle',.05,440),120);
    // la pieza dura más que antes (≈ 5 + 0,2·nivel pasos): XP extra para mantener la XP por segundo (tope ×3,5)
    {const k=Math.max(1,Math.min(4.5,WK.pieceSec(a[3])/(a[5]/1000))),ex=Math.round(a[4]*(k-1));if(ex>0)gain(OF,ex,true)}
    // primera vez que fabricas esta receta: bono grande de XP
    S.wkf=S.wkf||{};if(!S.wkf[a[2]]){S.wkf[a[2]]=1;const bonus=Math.round(a[4]*1.5);gain(OF,bonus,false);log('✨ Primera vez: <b>'+a[0]+'</b> (+'+bonus+' XP)');try{banner('Receta nueva',a[0],'#e8cf94',2200)}catch(e){}}
    A.left--;reopen(now,1300)}
  // Síntesis rápida (recetas muy por debajo de tu nivel): una pulsación, calidad normal, sin rotación
  function quick(){
    if(!A||!A.wk||A.wk.s.hist.length||A.wk.s.over)return;const w=A.wk,a=w.a;
    if(!WK.quick(w.rec,w.s.lvl).ok){msg('Esa receta no admite síntesis rápida.');return}
    w.s.over=true;w.s.ok=true;QBON=1;XPM=WK.QUICK_XP;const ok=stepAct(A.sk,A.i,false);XPM=1;QBON=1;if(!ok)return stopA();
    tone(560,.1,'triangle',.05,300);const f=window.R3D&&R3D.fx,e=A.e;if(f&&e)f.spark(e.x,e.y,10,'#e8dfc8',6,{spread:.9,up:1.8,g:-.3,size:.06,life:.9});
    msg('Síntesis rápida: pieza hecha.');A.left--;endAt=0;reopen(performance.now(),700)}
  function reopen(now,ms){
    const a=A.wk.a;if(el.classList.contains('wk-forge')&&(A.left<=0||!hasIn(a[1])))ms=Math.max(ms,3600);   // D8: deja ver el final de la pieza (estrellas, chispas)
    setTimeout(()=>{if(!A||!A.wk)return;if(A.left<=0||!hasIn(a[1]))return stopA();start(performance.now())},ms)}
  // aviso de nivel: acciones nuevas desbloqueadas (lo llama gain() de game.js)
  function onLevel(sk,o,n){
    if(!REG[sk])return;const of=sk,nw=WK.list(of,n).filter(id=>WK.A[id].lv>o&&!WK.A[id].spec);if(!nw.length)return;
    const names=nw.map(id=>WK.A[id].n).join(', ');log('🔨 <b>Nueva acción de '+REG[of].n+':</b> '+names);
    setTimeout(()=>{try{banner('Nueva acción',names,'#7fb4e8',3200)}catch(e){}},1800)}
  function close(){if(el)el.style.display='none';runQ=[];if(typeof FORGE!=='undefined')FORGE.close()}
  function pose(now){
    const id=A.e&&A.e.id,v=A.wkv,k=(REG[OF]&&REG[OF].clip)||'sm';
    if(!A.hn&&!v)return{k,ph:0,id};
    if(v&&GEST[v]){const u=(now-A.wkv0)/GEST[v];return{k,id,n:A.wkn||0,v,ph:u<1?Math.max(.001,Math.min(.999,u)):0}}   // gestos (concentración, reparación, observar): línea de tiempo propia
    return Object.assign({k,id,n:A.wkn||0,v},armPose(now-A.h0,FM_IMP,FM_IMP+WH_REC,.65,A.p0));
  }
  // ¿este oficio usa la hoja de trabajo en esta estación? (lo llama el arranque de la acción en game.js)
  const on=(sk,stn)=>{const r=REG[sk];return !!r&&!!stn&&r.stn.includes(stn.id)};
  const reg=(sk,o)=>{REG[sk]=Object.assign({n:SK[sk]&&SK[sk][0]||sk,stn:[],clip:'sm'},o)};
  reg('cr',{stn:['bench'],skin:'carp'});reg('pe',{stn:['curtidor'],skin:'tan'});reg('sa',{stn:['bench'],skin:'sew'});reg('es',{stn:['cantero'],skin:'stone'});reg('jo',{stn:['joyero'],skin:'jewel'});   // ESC-JOY (27 oct 2026)   // D6: Artesanía (Taller) y Peletería (Banco de curtidor); animación genérica 'sm' hasta que tengan clip propio
  // teclas 1..0 y Mayús+1..0 → casillas (en captura para que el '1' no seleccione habilidad de combate)
  addEventListener('keydown',ev=>{
    if(!A||!A.wk||ev.repeat||ev.ctrlKey||ev.metaKey||ev.altKey)return;
    if(/INPUT|TEXTAREA|SELECT/.test((ev.target||{}).tagName||''))return;
    const m=/^Digit(\d)$/.exec(ev.code||'');
    if(m){const n=+m[1],i=(n+9)%10+(ev.shiftKey?10:0),v=wb().bar[i];ev.preventDefault();ev.stopImmediatePropagation();
      if(v){if(isMac(v)){const mc=wb().mac[+v.slice(1)];if(mc&&mc.length)runQ=mc.slice()}else use(v)}}
    else if(ev.key==='Escape'){stopA('Dejas la pieza.')}
  },true);
  const side=()=>!!(el&&el.classList.contains('wk-forge')&&el.style.display!=='none'&&A&&A.wk);   // ¿hay una hoja con interfaz propia abierta al LADO? (game.js desplaza la cámara para ver al héroe)
  return {start,tick,pose,close,use,render,onLevel,on,reg,REG,side};
})();
