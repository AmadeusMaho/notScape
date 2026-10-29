// NotScape · COCINA AUTOMÁTICA (28 oct 2026) — global `COOKA`. Sustituye al flujo de minijuegos de la Cocina (mesa · fogón · sartén · parrilla · horno · sazón · emplatado), que sigue GUARDADO en cookkit.js/cooking.js (`?cookmg`).
// Decisión del dueño: «todo automático menos la selección de ingredientes; sin estaciones en pantalla (se deciden al elegir); al elegir ingredientes o receta, como en BotW, cocina solo tras una escena con "Cocinando…"».
// FLUJO: ELEGIR (despensa o recetario → huecos → método recomendado + condimento opcional → raciones) → «Cocinar» → ESCENA (preparar · al fuego · cocinar · sazonar · emplatar; Espacio/clic/Esc la acelera) → TARJETA de resultado.
// Los DATOS y la lógica (calidad, ids de plato, XP, recetas) viven en cooking.js (`COC.X`: autoScore, cookAuto, maxPortions…). Aquí solo hay interfaz y escena. El resultado se aplica AL EMPEZAR la escena (no hay forma de perder el plato cerrando).
// Escena = lienzo 2D (el mismo arte de ingredientes que el minijuego: `KIT.drawCh` → `FART`). Sin WebGL nuevo. Ventana = `#alq` con `zoom:var(--ui)` (src/uiscale.js).
const COOKA=(()=>{
 const X=COC.X,FX=X.FX,FL=X.FL,MET=X.MET,FLK=X.FLK,W=640,H=380,TAU=Math.PI*2,OL='#2a1a0e';
 const MN={g:['Guiso','🍲'],s:['Frito','🍳'],p:['Asado','🍖'],h:['Horneado','🥧']},FLE={d:'🍯',s:'🧂',a:'🌿',p:'🌶️',u:'🍖'},SPN={d:'Miel',s:'Sal',a:'Hierbas',p:'Pimienta',u:'Caldo'},SPC={d:'#e8b030',s:'#f4f0e6',a:'#6a9a3a',p:'#c83a22',u:'#b8803a'};
 const CATS=[['all','Todo'],['c','Carnes'],['p','Pescados'],['h','Hierbas'],['o','Otros']],CATN={c:0,p:1,h:2,o:3},VERB={fish:'Limpiando',cut:'Cortando',chop:'Picando'};
 let OPEN=false,ST='pick',SEL=[],MSEL=null,COND=null,QTY=1,TAB='ing',CAT='all',RES=null,SQ=null,LAST=null,STN=null,root=null,cv=null,cx=null,t=0,RR=[],pop={},bad=0;
 const $=s=>root&&root.querySelector(s),nm=X.nm,cnt=id=>SEL.filter(x=>x===id).length,T_=()=>X.tutRec(),ease=x=>1-Math.pow(1-Math.max(0,Math.min(1,x)),3),cl=(v,a,b)=>Math.max(a,Math.min(b,v)),hsh=(a,b)=>{const v=Math.sin(a*127.1+b*311.7)*43758.5453;return v-Math.floor(v)};
 const tn=(f,d)=>{try{tone(f,d||.05,'triangle',.04,700)}catch(e){}};
 // ── SFX (síntesis: tone/noise del juego) y VFX (partículas 2D en coordenadas de la escena 640×380) ──────────────────────────────────────────────────────────────────────────────
 const T2=(f,d,ty,v,sl,dl)=>{try{tone(f,d,ty||'sine',v||.04,sl,dl)}catch(e){}},nz=(d,v,f,ty)=>{try{noise(d,v,f||2000,ty||'bandpass')}catch(e){}},PENT=[0,2,4,7,9,12,14,16],pn=i=>523*Math.pow(2,PENT[i%8]/12);
 const sfx={chop:()=>{nz(.05,.13,1900,'bandpass');T2(170+Math.random()*30,.07,'triangle',.07,-70)},scrape:()=>{nz(.12,.06,3800,'highpass');T2(900,.05,'square',.012,-300)},plop:j=>{T2(320+(j%4)*45,.15,'sine',.07,-200);nz(.1,.05,900,'lowpass')},
  whoosh:()=>{nz(.55,.07,420,'lowpass');T2(80,.5,'sawtooth',.02,90)},sear:()=>{nz(.5,.08,6500,'highpass');T2(140,.3,'triangle',.05,-60)},sizz:()=>nz(.09,.02+Math.random()*.02,5200+Math.random()*1800,'highpass'),pop:()=>T2(480+Math.random()*520,.05,'sine',.022,-120),
  shake:()=>nz(.08,.05,6200,'highpass'),slide:()=>{nz(.28,.05,1100,'lowpass')},clink:()=>{T2(2400,.14,'sine',.05);T2(3150,.1,'sine',.03,0,.04)},flip:()=>{nz(.12,.07,1400,'bandpass');T2(260,.12,'triangle',.05,160)},
  crackle:()=>{nz(.025,.018+Math.random()*.02,2500+Math.random()*2500,'highpass')},err:()=>{T2(150,.14,'square',.04,-40)},tick:()=>T2(1100,.02,'sine',.012),
  fan:q=>{for(let i=0;i<3+q;i++)T2(pn(i*2),.28,'triangle',.05,0,.09*i);if(q>=3){T2(pn(7),.7,'sine',.05,0,.45);T2(pn(4),.7,'sine',.04,0,.45)}}};
 let HOLD=null;   // gancho de PRUEBA: COOKA.dbg.hold(segundos) congela la escena en ese instante para capturarla
 let FP=[],shk=0,zp=0,wob=0,DT=.016,lastHov=0;
 const emit=(k,x,y,n,o)=>{o=o||{};for(let i=0;i<n;i++){const a=(o.a!=null?o.a:Math.random()*TAU)+(Math.random()-.5)*(o.sp||0),v=(o.v||60)*(.4+Math.random()*.8);FP.push({k,x:x+(Math.random()-.5)*(o.w||0),y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:o.g!=null?o.g:300,l:0,L:(o.L||.7)*(.7+Math.random()*.6),r:(o.r||3)*(.6+Math.random()*.8),c:o.c||'#fff',rot:Math.random()*TAU,vr:(Math.random()-.5)*9})}if(FP.length>260)FP.splice(0,FP.length-260)};
 function fpTick(dt){for(let i=FP.length-1;i>=0;i--){const q=FP[i];q.l+=dt;if(q.l>=q.L){FP.splice(i,1);continue}q.vx*=1-dt*1.2;q.vy+=q.g*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.rot+=q.vr*dt}shk*=Math.exp(-dt*9);zp*=Math.exp(-dt*5);wob*=Math.exp(-dt*5.5)}
 function star4(c,r){c.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,rr=i%2?r*.32:r;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}c.closePath();c.fill()}
 function fpDraw(c){FP.forEach(q=>{const u=q.l/q.L,al=Math.max(0,1-u*u);c.save();c.translate(q.x,q.y);
   if(q.k==='dot'){c.globalAlpha=al;c.fillStyle=q.c;c.beginPath();c.arc(0,0,q.r*(1-u*.4),0,TAU);c.fill()}
   else if(q.k==='spark'){c.globalCompositeOperation='lighter';c.globalAlpha=al;c.strokeStyle=q.c;c.lineWidth=q.r*.7;c.beginPath();c.moveTo(0,0);c.lineTo(-q.vx*.035,-q.vy*.035);c.stroke()}
   else if(q.k==='bub'){c.globalAlpha=al*.8;c.strokeStyle=q.c;c.lineWidth=1.3;c.beginPath();c.arc(0,0,q.r*(1+u*.8),0,TAU);c.stroke()}
   else if(q.k==='chip'){c.globalAlpha=al;c.rotate(q.rot);c.fillStyle=q.c;c.fillRect(-q.r,-q.r*.5,q.r*2,q.r);c.strokeStyle=OL;c.lineWidth=1;c.strokeRect(-q.r,-q.r*.5,q.r*2,q.r)}
   else if(q.k==='star'){c.globalCompositeOperation='lighter';c.globalAlpha=al;c.rotate(q.rot);c.fillStyle=q.c;star4(c,q.r*(1.1-u*.4))}
   else if(q.k==='ring'){c.globalAlpha=al*.9;c.strokeStyle=q.c;c.lineWidth=2.5*(1-u);c.beginPath();c.arc(0,0,q.r+u*38,0,TAU);c.stroke()}
   c.restore()})}
 const chipCol=id=>({c:'#b8523a',p:'#d8d0c0',h:'#6a9a3a',o:'#d8c8a0'})[catOf(id)];
 const meth=()=>{const T=T_();return T?T.m:(MSEL||X.autoMeth(SEL))};
 const lim=()=>{const T=T_();if(T)return Math.max(1,T.ing.length);let n=X.maxIng();if(MSEL)n=Math.min(n,MET[MSEL].max);return n};
 const ready=()=>SEL.length>=2||!!X.recFor(SEL);
 const catOf=id=>{const b=String(id).split('~')[0];return /^h_|^hongo$/.test(b)?'h':/^(sardina|arenque|trucha|salmon|atun|lucio|pmagma|pezespada|manta|kraken|camaron)$/.test(b)?'p':/^(carne|jamon|pollo|ancas|huevo)/.test(b)?'c':'o'};
 const stars=n=>'★'.repeat(n)+'☆'.repeat(3-n);
 // ── despensa: lo cocinable que llevas (mochila) o tienes en el banco ──────────────────────────────────────────────────────────────────────────────────────────────────────
 function pantry(){const seen={};X.candidates().forEach(id=>seen[id]=1);const T=T_();Object.keys(S.bank||{}).forEach(k=>{if(S.bank[k]>0&&X.props(k)&&(!T||T.ing.indexOf(k)>=0))seen[k]=1});
  return Object.keys(seen).filter(id=>have(id)>0).sort((a,b)=>(CATN[catOf(a)]-CATN[catOf(b)])||nm(a).localeCompare(nm(b)))}
 const info=id=>{const p=X.props(id);if(!p)return'<b>'+nm(id)+'</b>';return'<b>'+nm(id)+'</b> · sustancia '+p[0]+(X.known(id)?' · '+[...p[1]].map(c=>'<span style="color:'+FL[c][1]+'">'+FL[c][0]+'</span>').join(' ')+' · '+(Object.keys(p[2]).length?Object.entries(p[2]).map(([e,v])=>'<span style="color:'+FX[e][1]+'">'+FX[e][0]+' '+v+'</span>').join(' '):'sin efecto'):' · <i>sabor y efectos: se descubren al cocinar</i>')};
 // ── ventana ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 function open(stn){if(OPEN)return;STN=stn||STN;OPEN=true;ST='pick';RES=null;SQ=null;COND=null;MSEL=null;QTY=1;TAB='ing';CAT='all';pop={};bad=0;const T=T_();SEL=[];
  if(T){if(T.ing.every(id=>have(id)>=1))SEL=T.ing.slice()}
  else if(LAST&&LAST.sel.length&&LAST.sel.every(id=>have(id)>=LAST.sel.filter(x=>x===id).length)&&LAST.sel.length<=X.maxIng()){SEL=LAST.sel.slice();MSEL=LAST.m;COND=LAST.cond&&KIT.spiceOn(LAST.cond)?LAST.cond:null}   // recuerda tu última mezcla
  const e=document.getElementById('alq')||(()=>{const d=document.createElement('div');d.id='alq';document.body.appendChild(d);return d})();e.className='ck-auto';e.style.display='block';
  e.innerHTML='<div class="ck-root"><div class="ck-top"><b class="ck-ti">🍲 Cocina</b><span class="ck-lv"></span><button class="ck-x" data-a="x" title="Cerrar (Esc)">✕ Cerrar</button></div>'
   +'<div class="ck-body"><section class="ck-pick"><div class="ck-tabs"></div><div class="ck-cats"></div><div class="ck-grid"></div><div class="ck-info"></div></section>'
   +'<section class="ck-side"><div class="ck-stage"><canvas width="960" height="570"></canvas><div class="ck-cap"></div><div class="ck-bar"><i></i></div></div>'
   +'<div class="ck-form"><div class="ck-slots"></div><div class="ck-meth"></div><div class="ck-cond"></div><div class="ck-pred"></div><div class="ck-act"></div></div><div class="ck-steps"></div></section></div><div class="ck-res"></div></div>';
  root=e.querySelector('.ck-root');cv=root.querySelector('canvas');cx=cv.getContext('2d');root.onclick=onClick;
  root.onmouseover=ev=>{const b=ev.target.closest('.ck-t[data-id]');const n=$('.ck-info');if(b&&performance.now()-lastHov>70){lastHov=performance.now();sfx.tick()}if(n)n.innerHTML=b?info(b.dataset.id):(T_()?'':'Pulsa un ingrediente para añadirlo al plato.')};
  renderAll();tn(520,.08)}
 function close(){if(!OPEN)return;if(ST==='cook'&&RES)log('Has cocinado '+RES.n+' × '+I[RES.out][0]+'.');OPEN=false;ST='pick';SQ=null;if(RES&&RES.n){LAST={sel:SEL.slice(),m:MSEL,cond:COND}}const e=document.getElementById('alq');if(e){e.style.display='none';e.innerHTML='';e.className=''}root=null;cv=null;cx=null}
 function renderAll(){renderPick();renderForm()}
 function renderPick(){if(!root)return;const T=T_(),lv=X.L('co');$('.ck-lv').textContent='Nivel '+lv+' · hasta '+X.maxIng()+' ingredientes';
  $('.ck-tabs').innerHTML=T?'':'<button data-a="tab" data-v="ing" class="'+(TAB==='ing'?'on':'')+'">Ingredientes</button><button data-a="tab" data-v="rec" class="'+(TAB==='rec'?'on':'')+'">Recetario</button>';
  const cats=$('.ck-cats'),grid=$('.ck-grid');
  if(TAB==='rec'&&!T){cats.innerHTML='';RR=recRows();const nx=X.RECIPES.filter(r=>r.lvl>lv).sort((a,b)=>a.lvl-b.lvl)[0];
   grid.className='ck-grid rec';grid.innerHTML=(RR.length?RR.map((r,i)=>{const miss=r.ing.filter((id,k)=>have(id)<r.ing.filter(x=>x===id).length&&r.ing.indexOf(id)===k),ok=!miss.length;
     return'<button class="ck-r'+(ok?'':' off')+'" data-a="rec" data-v="'+i+'" title="'+(ok?'Cargar esta receta':'Te falta: '+miss.map(nm).join(', '))+'"><span class="n"><b>'+r.name+'</b><em>'+MN[r.m][1]+' '+MN[r.m][0]+(r.formal?' · receta':' · tu mezcla')+(r.best>=0?' · mejor '+stars(r.best+1):'')+'</em></span><span class="ic3">'+r.ing.map(id=>'<span class="'+(have(id)>0?'':'no')+'" title="'+nm(id)+'">'+ic(id)+'</span>').join('')+'</span>'+(ok?'':'<small>falta '+miss.map(nm).join(', ')+'</small>')+'</button>'}).join(''):'<p class="ck-empty">Aún no conoces recetas. Prueba mezclas en «Ingredientes»: las que salgan bien quedan aquí.</p>')
    +(nx?'<p class="ck-next">Próxima receta: <b>'+nx.name+'</b> (Cocina nivel '+nx.lvl+')</p>':'');return}
  const ps=pantry(),have_c={};ps.forEach(id=>have_c[catOf(id)]=1);
  cats.innerHTML=T?'':CATS.filter(c=>c[0]==='all'||have_c[c[0]]).map(c=>'<button data-a="cat" data-v="'+c[0]+'" class="'+(CAT===c[0]?'on':'')+'">'+c[1]+'</button>').join('');if(!have_c[CAT])CAT='all';
  const full=SEL.length>=lim();grid.className='ck-grid';
  grid.innerHTML=ps.length?ps.filter(id=>CAT==='all'||catOf(id)===CAT).map(id=>{const left=have(id)-cnt(id),on=cnt(id);return'<button class="ck-t'+(on?' on':'')+(left<=0?' off':'')+(full&&!on?' full':'')+'" data-a="add" data-id="'+id+'" title="'+nm(id)+'">'+ic(id)+'<b>'+nm(id)+'</b><em>×'+Math.max(0,left)+'</em>'+(on?'<u>'+on+'</u>':'')+'</button>'}).join(''):'<p class="ck-empty">No llevas nada cocinable. Caza, pesca o recolecta hierbas y vuelve.</p>';
  $('.ck-info').innerHTML=T?'':'Pulsa un ingrediente para añadirlo al plato.'}
 function recRows(){const T=T_(),lv=X.L('co'),R=S.cor||{},fk={},fs=X.RECIPES.filter(r=>r.lvl<=lv&&(!T||r===T));fs.forEach(r=>fk[X.keyOf(r.ing,r.m)]=1);
  const rows=fs.map(r=>({name:r.name,ing:r.ing,m:r.m,best:(R[X.keyOf(r.ing,r.m)]||{best:-1}).best,formal:1}));
  if(!T)Object.keys(R).filter(k=>!fk[k]).forEach(k=>rows.push({name:R[k].name,ing:R[k].sel,m:R[k].m||'g',best:R[k].best,formal:0}));return rows}
 function renderForm(){if(!root)return;const T=T_(),m=meth(),ok=ready(),n=SEL.length;
  // huecos
  const mx=T?T.ing.length:X.maxIng();let h='';for(let i=0;i<mx;i++){const id=SEL[i];h+=id?'<button class="ck-s on" data-a="del" data-v="'+i+'" title="Quitar '+nm(id)+'">'+ic(id)+'</button>':'<span class="ck-s"></span>'}
  if(!T&&mx<6)h+='<span class="ck-s lock" title="Con Cocina nivel '+15*(mx-1)+' tendrás un hueco más">🔒</span>';
  $('.ck-slots').innerHTML=h+(n&&!T?'<button class="ck-clr" data-a="clear" title="Quitar todo">Vaciar</button>':'');
  // método (se recomienda solo; puedes cambiarlo)
  $('.ck-meth').innerHTML=T?'<span class="ck-lb">Se cocina en</span><b class="ck-fix">'+MN[m][1]+' '+MN[m][0]+'</b>':'<span class="ck-lb">Se cocina en</span>'+Object.keys(MET).map(k=>{const dis=n>MET[k].max;return'<button data-a="meth" data-v="'+k+'" class="ck-m'+(m===k?' on':'')+(dis?' off':'')+'" title="'+MET[k].desc+(dis?' (máx. '+MET[k].max+' ingredientes)':'')+'">'+MN[k][1]+' '+MN[k][0]+'</button>'}).join('')+(MSEL?'<button data-a="auto" class="ck-m auto" title="Que el juego elija el método">Auto</button>':'<small>automático</small>');
  // condimento opcional (una decisión más: sube efecto y sabor)
  if(T)$('.ck-cond').innerHTML='';else{const ks=FLK.filter(k=>KIT.spiceOn(k));let best=null,bs=X.autoScore(SEL,m,null).score;if(ok)ks.forEach(k=>{const s=X.autoScore(SEL,m,k).score;if(s>bs+.004){bs=s;best=k}});
   $('.ck-cond').innerHTML='<span class="ck-lb">Condimento</span><button data-a="cond" data-v="" class="ck-m'+(COND?'':' on')+'">Ninguno</button>'+ks.map(k=>'<button data-a="cond" data-v="'+k+'" class="ck-m'+(COND===k?' on':'')+'" title="Añade '+FX[X.SPFX[k]][0]+' y sabor '+FL[k][0].toLowerCase()+(best===k?' · mejora este plato':'')+'">'+FLE[k]+' '+SPN[k]+(best===k?' <i class="star">★</i>':'')+'</button>').join('')}
  // previsión del plato
  const pr=$('.ck-pred');
  if(!n)pr.innerHTML='<p class="ck-hint">'+(T?'Falta el ingrediente del encargo.':'Elige ingredientes de la despensa o una receta del recetario. Los que comparten efecto se suman.')+'</p>';
  else if(!ok)pr.innerHTML='<p class="ck-hint">Con un solo ingrediente hace falta una receta. Añade otro.</p>';
  else{const r=X.autoScore(SEL,m,COND),M=r.M,rc=r.rec,id=(rc&&rc.out)||X.idOf(M.top,M.ti,r.q,m);X.ensure(id);
   pr.innerHTML='<div class="ck-nm"><b>'+I[id][0].replace(/ (I|II|III)$/,'')+'</b><span class="ck-tag'+(rc?' rec':'')+'">'+(rc?'receta':'improvisada')+'</span><span class="ck-q" title="Calidad prevista">'+stars(r.q+1)+'</span></div>'
    +'<div class="ck-fx">Cura <b>'+X.healOf(M.ti,r.q,m)+' PV</b> · tier '+M.ti+(M.top.length?M.top.map(([k,l])=>' · <b style="color:'+FX[k][1]+'">'+X.FXI[k]+' '+FX[k][0]+' '+X.ROM[l-1]+'</b>').join(''):' · solo alimenta')+'</div>'
    +(rc?'<div class="ck-fl" title="Sabor frente al ideal de la receta">'+FLK.map(k=>'<i class="'+r.st[k]+'" title="'+FL[k][0]+': '+(r.st[k]==='ok'?'en su punto':r.st[k]==='low'?'falta':'sobra')+'">'+FLE[k]+'<s>'+(r.st[k]==='ok'?'✓':r.st[k]==='low'?'▲':'▼')+'</s></i>').join('')+'<span>sabor</span></div>':'<p class="ck-hint">Sin receta la calidad máxima es ★. Prueba el recetario o descubre una mezcla.</p>')
    +(T?'<p class="ck-hint tut">Pulsa «Cocinar»: el plato se prepara solo.</p>':'')}
  // acción
  const mp=X.maxPortions(SEL);QTY=cl(QTY,1,Math.max(1,mp));
  $('.ck-act').innerHTML='<div class="ck-qty" title="Raciones: se cocinan de una vez"><button data-a="qm">−</button><b>×'+QTY+'</b><button data-a="qp">+</button><button data-a="qx" title="Todas las que puedas">Máx</button></div><button class="ck-go'+(ok&&mp>0?'':' off')+(T&&ok?' pulse':'')+'" data-a="go">🔥 Cocinar'+(QTY>1?' ×'+QTY:'')+'</button>'}
 // ── acciones ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 function afterSel(){if(MSEL&&SEL.length>MET[MSEL].max)MSEL=null;renderAll()}
 function addIng(id){if(ST!=='pick'||!id)return;if(T_()){toast('Para este encargo solo hace falta lo que ves');return}
  if(have(id)-cnt(id)<=0){toast('No te quedan más '+nm(id).toLowerCase());return}
  if(SEL.length>=lim()){toast(MSEL&&SEL.length>=MET[MSEL].max?'Con '+MN[MSEL][0]+' caben '+MET[MSEL].max+': cambia el método':'No caben más ingredientes (máx. '+lim()+' con tu nivel de Cocina)');return}
  SEL.push(id);pop[SEL.length-1]=t;const ix=SEL.length-1;T2(pn(ix),.12,'triangle',.05,0);setTimeout(()=>{if(!OPEN||ST!=='pick'||!SEL[ix])return;const[x,y]=slot(meth(),ix,SEL.length);sfx.plop(ix);emit('dot',x,y,7,{a:-1.57,sp:2.4,v:100,L:.55,r:2.4,c:brothCol()});emit('ring',x,y,1,{r:5,L:.4,c:'rgba(255,255,255,.7)'});wob=Math.max(wob,.8)},300);afterSel()}
 function delIng(i){if(ST!=='pick'||T_())return;SEL.splice(i,1);T2(300,.1,'triangle',.04,-90);afterSel()}
 function setMeth(m){if(ST!=='pick'||!MET[m])return;if(SEL.length>MET[m].max){toast('Con '+MN[m][0]+' caben '+MET[m].max+' ingredientes');return}MSEL=m;T2(440,.08,'square',.025,200);emit('spark',320,230,10,{a:-1.57,sp:2,v:90,L:.6,r:2,c:'#ffb050',g:100});renderForm()}
 function useRec(i){const r=RR[i];if(!r||ST!=='pick')return;const miss=r.ing.filter((id,k)=>have(id)<r.ing.filter(x=>x===id).length&&r.ing.indexOf(id)===k);if(miss.length){toast('Te falta: '+miss.map(nm).join(', '));return}
  if(r.ing.length>X.maxIng()){toast('Esa receta pide más huecos de los que tienes');return}SEL=r.ing.slice();pop={};SEL.forEach((x,k)=>pop[k]=t+k*.08);MSEL=X.autoMeth(SEL)===r.m?null:r.m;COND=null;SEL.forEach((x,k)=>T2(pn(k*2),.14,'triangle',.045,0,.07*k));afterSel()}
 function onClick(ev){const b=ev.target.closest('[data-a]');if(!b||!root.contains(b))return;const a=b.dataset.a,v=b.dataset.v;if(a==='x'){close();return}
  if(ST==='cook'){if(a==='skip')skip();return}
  if(ST==='res'){if(a==='again')again();else if(a==='back')back();return}
  switch(a){case'tab':TAB=v;renderPick();break;case'cat':CAT=v;renderPick();break;case'add':addIng(b.dataset.id);break;case'del':delIng(+v);break;case'clear':SEL=[];pop={};afterSel();break;
   case'meth':setMeth(v);break;case'auto':MSEL=null;renderForm();break;case'cond':COND=v||null;if(v){nz(.14,.06,6000,'highpass');emit('dot',320,110,10,{a:1.57,sp:1.6,v:50,g:240,L:.7,r:2,c:SPC[v]})}else T2(380,.06,'sine',.03);renderForm();break;case'rec':useRec(+v);break;
   case'qm':QTY=Math.max(1,QTY-1);renderForm();break;case'qp':QTY=QTY+1;renderForm();break;case'qx':QTY=Math.max(1,X.maxPortions(SEL));renderForm();break;case'go':startCook();break}}
 addEventListener('keydown',ev=>{if(!OPEN)return;if(ev.key==='Escape'){ev.stopImmediatePropagation();ev.preventDefault();if(ST==='cook')skip();else close()}else if((ev.key===' '||ev.key==='Enter')&&ST==='cook'){ev.stopImmediatePropagation();ev.preventDefault();skip()}},true);
 // ── la escena «Cocinando…» ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 function startCook(){if(ST!=='pick')return;COOKART.knifeReset();if(!ready()){sfx.err();toast('Elige al menos 2 ingredientes (o una receta)');return}const mp=X.maxPortions(SEL);if(mp<1){sfx.err();toast('Te faltan ingredientes');return}QTY=cl(QTY,1,mp);
  const sel=SEL.slice(),m=meth(),n=QTY,cond=COND&&KIT.spiceOn(COND)?COND:null,r=X.cookAuto(sel,m,cond,n);if(!r){toast('Te faltan ingredientes');return}
  RES=r;LAST={sel:sel.slice(),m:MSEL,cond:COND};const steps=[],items=sel.map((id,i)=>({id,i,k:X.prepOf(id),cut:false,r:0}));
  items.forEach(it=>{if(it.k)steps.push({k:'prep',it,txt:VERB[it.k]+' '+nm(it.id).toLowerCase(),d:.8})});
  steps.push({k:'fire',txt:'Al fuego: '+MN[m][0].toLowerCase(),d:.75},{k:'cook',txt:'Cocinando'+(n>1?' ×'+n:''),d:1.5+Math.min(1.3,(n-1)*.12)});
  if(cond)steps.push({k:'spice',txt:'Sazonando con '+SPN[cond].toLowerCase(),d:.7});steps.push({k:'plate',txt:'Emplatando',d:.9});
  SQ={steps,i:0,el:0,fast:false,items,m,cond,total:steps.reduce((a,s)=>a+s.d,0),lastI:-1,ev:{},flipT:null,sz:0};ST='cook';root.classList.add('ck-cooking');stepsHTML();capSet(true);sfx.whoosh();shk=.3;zp=.6}
 const skip=()=>{if(SQ)SQ.fast=true};
 function stepsHTML(){const e=$('.ck-steps');if(!e||!SQ)return;e.innerHTML=SQ.steps.map((s,i)=>'<span class="ck-st'+(i<SQ.i?' ok':i===SQ.i?' cur':'')+'"><i>'+(i<SQ.i?'✓':'')+'</i>'+s.txt+'</span>').join('')+'<button class="ck-skip" data-a="skip" title="Espacio / clic / Esc">Saltar ▸</button>'}
 function capSet(on){const c=$('.ck-cap');if(!c)return;c.innerHTML=on?(SQ.steps[SQ.i]?SQ.steps[SQ.i].txt:'Cocinando')+'<span class="dts"><i>.</i><i>.</i><i>.</i></span>':''}
 function land(j){const m=SQ.m,n=SQ.items.length,[x,y]=slot(m,j,n);sfx.plop(j);emit('dot',x,y,9,{a:-1.57,sp:2.4,v:115,L:.6,r:2.6,c:brothCol()});emit('ring',x,y,1,{r:6,L:.45,c:'rgba(255,255,255,.7)'});if(m==='s'||m==='p')emit('spark',x,y,5,{a:-1.57,sp:2,v:80,L:.5,r:2,c:'#ffd080'});wob=1}
 function stepFx(s,i,p,dt,enter){const st=s.steps[i],m=s.m,n=s.items.length,ev=s.ev,bx=m==='g'?162:m==='s'?208:m==='p'?240:200;
  if(enter){if(st.k==='fire'){sfx.whoosh();shk=Math.max(shk,.3);zp=.7;emit('spark',320,262,16,{a:-1.57,sp:1.5,v:120,L:.9,r:2,c:'#ffb050',g:120,w:120})}
   else if(st.k==='cook'){sfx.sear();emit('ring',320,bx,1,{r:10,L:.5,c:'#ffd080'});emit('ring',320,bx,1,{r:2,L:.7,c:'#fff0c0'});zp=.5}
   else if(st.k==='spice')sfx.shake();else if(st.k==='plate')sfx.slide()}
  if(st.k==='prep'){const it=st.it;[1/6,1/2,5/6].forEach((u,j)=>{if(p>=u&&!ev['c'+i+j]){ev['c'+i+j]=1;if(it.k==='fish'){sfx.scrape();emit('dot',320,326,6,{a:-1.57,sp:2.6,v:90,L:.5,r:1.8,c:'#cfd8e0'})}else{sfx.chop();shk=Math.max(shk,.32);emit('chip',320,326,7,{a:-1.57,sp:2.6,v:130,L:.6,r:3,c:chipCol(it.id)})}}})}
  else if(st.k==='fire'){for(let j=0;j<n;j++)if(p*st.d>=.5+j*.09&&!ev['l'+j]){ev['l'+j]=1;land(j)}}
  else if(st.k==='cook'){s.sz+=dt;if(s.sz>.11){s.sz=0;sfx.sizz();if(Math.random()<.4)sfx.pop()}
   if(Math.random()<dt*11){const x=m==='g'?232+Math.random()*176:m==='s'?238+Math.random()*164:m==='p'?210+Math.random()*220:262+Math.random()*118;if(m==='p'||m==='s')emit(Math.random()<.5?'spark':'bub',x,bx+6,1,{a:-1.57,sp:2.2,v:70,g:m==='p'?200:30,L:.7,r:2,c:m==='p'?'#ffb050':'#fff0c0'});else emit('bub',x,bx+(m==='g'?0:20),1,{a:-1.57,v:20,g:-24,L:1,r:2.5,c:'rgba(255,240,200,.9)'})}
   if((m==='s'||m==='p')&&p>=.5&&s.flipT==null){s.flipT=t;sfx.flip();shk=Math.max(shk,.25)}
   if(m==='h'&&p>.85&&!ev.dn){ev.dn=1;T2(1760,.5,'sine',.05);T2(2350,.4,'sine',.03,0,.06)}}
  else if(st.k==='spice'){s.sz+=dt;if(s.sz>.1){s.sz=0;sfx.shake();emit('dot',320+(Math.random()-.5)*70,96,2,{a:1.57,sp:.6,v:60,g:220,L:.9,r:2,c:SPC[s.cond]||'#fff'})}}
  else if(st.k==='plate'){if(p>=.6&&!ev.pl){ev.pl=1;sfx.clink();emit('star',320,298,9,{a:-1.57,sp:3.5,v:80,L:.8,r:5,c:'#ffe8a0',g:60,w:90})}}}
 function seqTick(dt){const s=SQ;s.el+=dt*(s.fast?6:1);let a=0,i=0;for(;i<s.steps.length;i++){if(s.el<a+s.steps[i].d)break;a+=s.steps[i].d}
  if(i>=s.steps.length){s.i=s.steps.length;s.p=1;endCook();return}
  s.p=(s.el-a)/s.steps[i].d;const enter=i!==s.lastI;s.lastI=i;if(i!==s.i){for(let j=0;j<i;j++){const st=s.steps[j];if(st.it)st.it.cut=st.it.k==='cut'||st.it.k==='chop'}s.i=i;stepsHTML();capSet(true);T2(pn(i),.06,'triangle',.03,0)}
  stepFx(s,i,s.p,dt,enter);
  const bar=$('.ck-bar i');if(bar)bar.style.width=Math.round(s.el/s.total*100)+'%'}
 function endCook(){const r=RES,e=$('.ck-res');ST='res';SQ.items.forEach(it=>{it.cut=it.k==='cut'||it.k==='chop'});capSet(false);const bar=$('.ck-bar i');if(bar)bar.style.width='100%';
  const q=r.q+1,left=X.maxPortions(SEL)>=1;snd('quest');sfx.fan(q);for(let i=0;i<q;i++)setTimeout(()=>{T2(pn(i*2+2),.2,'sine',.05);emitCard(e,i,q)},500+i*350);shk=.5;zp=1;
  e.innerHTML='<div class="ck-card"><div class="ck-ri cc-plate">'+ic(r.out)+(r.n>1?'<em>×'+r.n+'</em>':'')+'</div><div class="cc-st">'+[0,1,2].map(i=>'<i class="'+(i<q?'on':'')+'" style="animation-delay:'+(.5+i*.35)+'s">★</i>').join('')+'</div>'
   +'<p>'+(r.score>=.9?'¡Perfecto! ':'')+'Has cocinado '+(r.n>1?r.n+' × ':'')+'<b>'+I[r.out][0]+'</b></p><small>Calidad '+X.ROM[r.q]+(r.rec?' · receta: '+r.rec.name:' · improvisada: con una receta podría salir mejor')+(r.isNew?' · ¡mezcla nueva en el recetario!':'')+'</small>'
   +'<small>'+(r.M.top.length?r.M.top.map(([k,l])=>'<b style="color:'+FX[k][1]+'">'+X.FXI[k]+' '+FX[k][0]+' '+X.ROM[l-1]+'</b>').join(' · '):'Solo alimenta')+' · <b>+'+r.xp+' XP</b> de Cocina</small>'
   +'<div class="ck-bt"><button class="n" data-a="back">Volver</button><button class="ck-go'+(left?'':' off')+'" data-a="again">🔥 Cocinar otra vez</button></div></div>';e.style.display='flex';e.querySelector('.ck-card').classList.toggle('gold',q>=3||r.score>=.9)}
 function emitCard(e,i,q){const cd=e.querySelector('.ck-card');if(!cd)return;for(let k=0;k<(q>=3?9:5);k++){const sp=document.createElement('i');sp.className='ck-sp';sp.style.cssText='--x:'+((Math.random()*2-1)*170).toFixed(0)+'px;--y:'+(-30-Math.random()*140).toFixed(0)+'px;--d:'+(.5+Math.random()*.8).toFixed(2)+'s;--s:'+(5+Math.random()*9).toFixed(0)+'px;left:'+(32+i*18+Math.random()*10)+'%;top:'+(30+Math.random()*16)+'%';cd.appendChild(sp);setTimeout(()=>sp.remove(),1600)}}
 function back(){ST='pick';SQ=null;const e=$('.ck-res');if(e){e.style.display='none';e.innerHTML=''}root.classList.remove('ck-cooking');const k={};SEL=SEL.filter(id=>{k[id]=(k[id]||0)+1;return have(id)>=k[id]});if(!ready()){if(!T_())SEL=[]}pop={};renderAll()}
 function again(){if(X.maxPortions(SEL)<1||!ready()){toast('Te faltan ingredientes');return}const e=$('.ck-res');if(e){e.style.display='none';e.innerHTML=''}ST='pick';SQ=null;startCook()}
 // ── dibujo ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

 const steam=(c,x,y,w,n,al)=>COOKART.steam(c,t,x,y,w,n,al),glow=(c,x,y,r,a)=>COOKART.glowAt(c,x,y,r,a),ink=(c,w)=>{c.strokeStyle=OL;c.lineWidth=w||2.5;c.lineJoin='round';c.stroke()};
 function brothCol(){const BR={c:[154,85,48],p:[201,138,82],h:[127,154,68],o:[184,138,72]},a=[0,0,0];let k=0;(SQ?SQ.items.map(i=>i.id):SEL).forEach(id=>{const q=BR[catOf(id)];a[0]+=q[0];a[1]+=q[1];a[2]+=q[2];k++});return k?'rgb('+Math.round(a[0]/k)+','+Math.round(a[1]/k)+','+Math.round(a[2]/k)+')':'#a8692e'}
 const APEX={g:190,s:150,p:150,h:50};
 const SLOT={g:(k,i)=>[320+k*132,162+Math.sin(i*2.1)*3],s:(k,i)=>[320+k*160,208+(i%2?5:-4)],p:(k,i)=>[320+k*176,201+(i%2?3:-2)],h:(k,i)=>[320+k*150,226]},RAD={g:20,s:22,p:22,h:20};
 const slot=(m,i,n)=>SLOT[m]((i+.5)/n-.5,i),rowPos=(i,n)=>[190+(i+.5)*(260/n),340];
 function drawItem(c,it){if(!(it.sc>0)||it.r<=0)return;c.save();c.translate(it.x,it.y);c.scale(it.sc,it.sc);try{KIT.drawCh(c,{id:it.id,r:it.r,a:it.a||0,cut:it.cut},null,it.d||0)}catch(e){if(!bad++)console.warn('[COOKA] item',e)}c.restore()}
 const board=c=>COOKART.board(c),knife=(c,x,y,a)=>COOKART.knife(c,x,y,a),plate=(c,x,y,sc,col,al)=>COOKART.plate(c,x,y,sc,col,al);
 function frame(){if(!cx)return;const c=cx,z=1.025+zp*.04,sx=(Math.random()-.5)*shk*5,sy=(Math.random()-.5)*shk*5;c.setTransform(1.5*z,0,0,1.5*z,1.5*(W/2*(1-z)+sx),1.5*(H/2*(1-z)+sy));c.drawImage(COOKART.bg(),0,0,W,H);const m=SQ?SQ.m:meth(),ph=SQ&&SQ.steps[SQ.i]?SQ.steps[SQ.i]:null,k=ph?ph.k:(ST==='res'?'plate':'idle'),p=SQ?SQ.p||0:0;
  const pw=k==='idle'?.55:k==='prep'?.45:k==='fire'?.5+.6*p:k==='cook'?1.1:k==='spice'?1:.7;COOKART.light(c,t,pw*(1+shk*.5),m==='h'?220:250);c.save();c.translate(320,264);c.scale(1+wob*.025,1-wob*.03);c.translate(-320,-264);COOKART.fireBack(c,m,t,pw);c.drawImage(COOKART.body(m),0,0,W,H);COOKART.surface(c,m,t,pw,brothCol());c.restore();const front=()=>{c.save();c.translate(320,264);c.scale(1+wob*.025,1-wob*.03);c.translate(-320,-264);c.drawImage(COOKART.front(m),0,0,W,H);c.restore()};
  const n=SQ?SQ.items.length:SEL.length;
  if(!SQ){SEL.forEach((id,i)=>{const[x,y]=slot(m,i,n),a=t-(pop[i]||-9);drawItem(c,{id,x,y:y-(a<.45?(1-ease(a/.45))*70:0)+Math.sin(t*1.7+i*1.9)*(m==='g'?2.2:.5),r:RAD[m],a:(i*1.7)%6.28,sc:a<0?0:a<.45?.6+.4*ease(a/.45):1,d:0,cut:false})});front();steam(c,320,m==='h'?120:m==='g'?150:190,70,m==='g'?5:3,.5*pw)}
  else{const its=SQ.items,late=[];let cookP=k==='cook'?p:(k==='spice'||k==='plate'||ST==='res')?1:0;
   if(k==='prep'||k==='fire'){board(c)}
   its.forEach((it,i)=>{const[sx,sy]=slot(m,i,n),[rx,ry]=rowPos(i,n),base={id:it.id,a:(i*1.7)%6.28,cut:it.cut};
    if(k==='prep'){const cur=ph.it===it,done=its.indexOf(it)<its.indexOf(ph.it)&&it.k;
     if(cur){const q=p,sp=q>.45?Math.min(1,(q-.45)*3)*9:0,cutK=it.k==='cut'||it.k==='chop';if(cutK&&q>.45){drawItem(c,{...base,x:320-sp,y:326,r:26,sc:1,cut:true,d:0});drawItem(c,{...base,x:320+sp,y:326,r:26,sc:1,cut:true,d:0,a:base.a+.6})}else drawItem(c,{...base,x:320,y:326+Math.sin(q*40)*(it.k==='fish'?2:0),r:26,sc:1,cut:false,d:0});
      const sw=Math.abs(Math.sin(q*Math.PI*3));knife(c,296+q*56,314-56*(1-sw),-.3+(it.k==='fish'?.12*Math.sin(q*20):0))}
     else drawItem(c,{...base,x:rx,y:ry,r:15,sc:1,cut:done||it.cut,d:0})}
    else if(k==='fire'){const hp=ease((p*ph.d-i*.09)/.5),x=rx+(sx-rx)*hp,y=ry+(sy-ry)*hp-Math.sin(hp*Math.PI)*APEX[m],o={...base,x,y,r:15+(RAD[m]-15)*hp,sc:1,cut:it.cut,d:0,a:base.a+hp*5};if(hp<(m==='h'?.86:.8))late.push(o);else drawItem(c,o)}   // en vuelo va POR DELANTE del recipiente (sube por fuera y cae por encima del borde); al entrar pasa por detrás del labio
    else if(k==='plate'||ST==='res'){const q=ST==='res'?1:p;drawItem(c,{...base,x:sx,y:sy,r:RAD[m],sc:1-ease(q*1.6),cut:it.cut,d:.8})}
    else{const hu=SQ.flipT!=null&&(m==='s'||m==='p')?Math.min(1,(t-SQ.flipT)/.55):1,sw=k==='cook'&&m==='g'?Math.cos(t*1.2+i*2.1)*8:0;drawItem(c,{...base,x:sx+sw,y:sy+Math.sin(t*2+i*1.9)*(m==='g'?2.5:.6)-(hu<1?Math.sin(hu*Math.PI)*40:0),r:RAD[m],sc:1,cut:it.cut,d:cookP*.8,a:base.a+(hu<1?hu*TAU:0)})}});
   front();late.forEach(o=>drawItem(c,o));
   if(k==='cook'||k==='spice'){steam(c,320,m==='h'?120:m==='g'?150:190,90,6,.9);if(m==='s'||m==='p')for(let i=0;i<12;i++){const ph2=(t*2.4+hsh(i,9))%1;c.fillStyle='rgba(255,230,160,'+((1-ph2)*.9).toFixed(2)+')';c.fillRect(250+hsh(i,1)*140,196-ph2*34,2,2)}}
   if(k==='spice'){const col=SPC[SQ.cond]||'#fff';COOKART.shaker(c,col,t,1.9+Math.sin(p*18)*.1);for(let i=0;i<22;i++){const f=(p*2.2+hsh(i,5))%1,x=320+(hsh(i,6)-.5)*80*f,y=70+f*130;c.fillStyle=col;c.beginPath();c.arc(x,y,1.8+hsh(i,7)*1.4,0,TAU);c.fill()}}
   if(k==='plate'||ST==='res'){const q=ST==='res'?1:ease(p/.6);plate(c,320+(1-q)*340,308,1,brothCol(),Math.min(1,q*2));if(q>.9)steam(c,320,286,80,5,.9)}}
  fpDraw(c);COOKART.finish(c);c.drawImage(COOKART.vig(),0,0,W,H)}
 // ── fotograma ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 function tick(now,dt){if(!OPEN)return;if(STN&&typeof P!=='undefined'&&Math.hypot(P.x-STN.x,P.y-STN.y)>190){close();return}dt=Math.min(dt||.016,.1);t+=dt;DT=dt;fpTick(dt);if(ST==='pick'&&Math.random()<dt*1.8)sfx.crackle();if(ST==='cook'&&SQ){if(HOLD!=null)SQ.el=HOLD;seqTick(dt)}try{frame()}catch(e){if(!bad++)console.warn('[COOKA] frame',e)}}
 return{dbg:{hold:v=>{HOLD=v}},open,close,tick,skip,get active(){return OPEN},get cooking(){return OPEN&&ST==='cook'},get stage(){return ST},get sel(){return SEL.slice()},get res(){return RES},pick:{add:addIng,del:delIng,go:startCook,meth:setMeth,rec:useRec,again,back,render:renderAll,qty:q=>{QTY=Math.max(1,q|0);renderForm()},cond:k=>{COND=k||null;renderForm()},clear:()=>{SEL=[];afterSel()}}}})();
