// NotScape · ESTABLO (lote DOMAR-D4, 29 oct 2026) · global `STAB`. Plan: docs/PLAN_DOMAR.md §2.2–2.3. Cargado tras mount.js y ANTES de game.js (`add()` lo llama al recibir una montura).
// CADA ANIMAL ES UN INDIVIDUO: `S.stab[uid]={sp,nm,lv,xp,sk,g:{vel,agu,car,tem},tr:[rasgos],gen,aff}` y se lleva como un OBJETO variante `mt_<especie>~<uid>` (mismo mecanismo que las armas encantadas: no apila,
// no se vende ni se tira —`QITEM`—, se equipa en la ranura «Montura»). Los `mt_<especie>` sueltos (CHEAT.give, partidas del lote D1–D3) se ADOPTAN al recibirlos (`adopt`, `sweep`): nace un animal nuevo (con el nivel
// y las habilidades que tuviera `S.mtx[especie]`). El ESTABLO guarda animales fuera de la mochila (`S.stable=[uid…]`, hasta `S.stabCap`=4) y es donde se equipan, alimentan, renombran y sueltan.
// GENES (0–100; techo 55 en G1, +10 por generación): Velocidad (+0,1 % por punto) · Aguante (menos gasto de galope) · Carga (+1 hueco de mochila cada 20 puntos MIENTRAS la llevas equipada) · Temple (reservado: terreno, D6).
// RASGOS (0–2 por animal, `TR`): efectos REALES aplicados en mount.js. El AFECTO (0–100) sube con el pienso y sube la probabilidad de aprender habilidades. D5 (cría) hereda genes, rasgos y habilidades.
const STAB=(()=>{
 const GK=['vel','agu','car','tem'],GN={vel:['Velocidad','#e8cf94'],agu:['Aguante','#7ac8a0'],car:['Carga','#c8a070'],tem:['Temple','#7ab8ff']},CEIL=g=>55+10*(g-1);
 const TR={sigiloso:['Sigiloso','−25 % de ruido ante los animales salvajes'],pecho:['Pecho recio','+15 % de aguante'],ligera:['Pezuña ligera','+5 % de velocidad'],fiel:['Fiel','+25 % de XP de montura'],imperturbable:['Imperturbable','25 % de no desmontar al recibir daño'],odre:['Odre','recupera el aguante un 30 % antes']};
 const TK=Object.keys(TR);
 const say=t=>{try{toast(t,2400)}catch(e){}};
 const st=()=>S.stab||(S.stab={}),stable=()=>S.stable||(S.stable=[]),capS=()=>S.stabCap||4;
 const uidOf=id=>{const m=/^mt_[a-z]+~([a-z0-9]+)$/.exec(String(id||''));return m?m[1]:null},spOfId=id=>String(id||'').replace(/^mt_/,'').split('~')[0],itemId=(sp,u)=>'mt_'+sp+'~'+u,legacy=id=>/^mt_[a-z]+$/.test(String(id||''));
 const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
 let seq=0;const newUid=()=>'a'+Date.now().toString(36).slice(-5)+(seq++).toString(36);
 // un animal nuevo: genes al azar (25–55, algo sesgados por la especie), 0–2 rasgos
 function mk(sp){const e=MTD.get(sp)||MTD.get('caballo'),g={vel:rnd(22,50)+Math.round((e.v-1)*40),agu:rnd(22,50)+Math.round((e.a-1)*30),car:rnd(15,50)+(e.a>1.3?8:0),tem:rnd(20,50)};GK.forEach(k=>g[k]=Math.max(10,Math.min(55,g[k])));
  const r=Math.random(),n=r<.12?2:r<.5?1:0,tr=[];while(tr.length<n){const k=TK[rnd(0,TK.length-1)];if(tr.indexOf(k)<0)tr.push(k)}
  const leg=(S.mtx||{})[sp];return{sp,nm:'',lv:leg?leg.lv:1,xp:leg?leg.xp:0,sk:leg?Object.assign({},leg.sk):{},g,tr,gen:1,aff:0}}
 const baseName=sp=>{const e=MTD.get(sp);return e?e.mt:sp};
 // registra el objeto variante (I y LOOT) de un animal existente; false si no hay registro
 function ensure(id){const u=uidOf(id);if(!u||!st()[u])return false;const r=st()[u],sp=r.sp,b='mt_'+sp;if(!I[b]||!LOOT[b])return false;
  I[id]=[(r.nm?r.nm+' · ':'')+baseName(sp),I[b][1],0];if(!LOOT[id])LOOT[id]=Object.assign({},LOOT[b],{mt:{sp,u}});return true}
 function rename(u,nm){const r=st()[u];if(!r)return;r.nm=String(nm||'').replace(/[<>&"]/g,'').slice(0,18);const id=itemId(r.sp,u);if(I[id])I[id][0]=(r.nm?r.nm+' · ':'')+baseName(r.sp);dirty=1}
 // «adoptar»: convierte un objeto antiguo `mt_<especie>` en un animal nuevo y devuelve su id de variante
 function adopt(id){if(!legacy(id))return id;const sp=spOfId(id);if(!MTD.get(sp))return id;const u=newUid(),r=mk(sp);st()[u]=r;if(S.mtx&&S.mtx[sp])delete S.mtx[sp];const nid=itemId(sp,u);ensure(nid);return nid}
 function sweep(){try{S.inv=S.inv.map(adopt);if(S.bank)for(const k of Object.keys(S.bank)){if(legacy(k)){for(let i=0;i<S.bank[k];i++){S.inv.push(adopt(k))}delete S.bank[k]}}
  if(S.eq&&S.eq.mt)S.eq.mt=adopt(S.eq.mt);S.inv.forEach(ensure);if(S.bank)Object.keys(S.bank).forEach(ensure);if(S.eq&&S.eq.mt)ensure(S.eq.mt)}catch(e){console.warn('[STAB] sweep',e)}}
 // el animal equipado (registro) o null
 const cur=()=>{try{const u=uidOf(S.eq.mt);return u?st()[u]||null:null}catch(e){return null}};
 const recOf=id=>{const u=uidOf(id);return u?st()[u]||null:null};
 // ¿se puede quitar la montura equipada sin desbordar la mochila? (la Carga da huecos mientras se lleva)
 function canLose(){const g=cur()?Math.floor(cur().g.car/20):0;if(slotsUsed()>cap()-g){say('Libera espacio en la mochila antes de quitarte la montura (su Carga te daba '+g+' huecos).');return false}return true}
 // ── operaciones del Establo ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 function where(u){const id=itemId(st()[u].sp,u);if(S.eq&&S.eq.mt===id)return'eq';if(stable().indexOf(u)>=0)return'stable';if(S.inv.indexOf(id)>=0)return'inv';return(S.bank&&S.bank[id]>0)?'bank':'?'}
 function equip(u){const r=st()[u];if(!r)return;const w=where(u),id=itemId(r.sp,u);if(w==='eq')return;
  const old=S.eq.mt,ou=uidOf(old);if(old&&!canLose())return;
  if(old&&ou){if(stable().length<capS())stable().push(ou);else if(slotsUsed()<cap()||w==='inv'){S.inv.push(old)}else return say('No hay sitio: libera un hueco o una plaza del establo.')}
  if(w==='stable')S.stable=stable().filter(x=>x!==u);else if(w==='inv')S.inv.splice(S.inv.indexOf(id),1);
  try{MOUNT.off('manual')}catch(e){}S.eq.mt=id;ensure(id);snd('coin');say('Montura: <b>'+(r.nm||baseName(r.sp))+'</b>.');dirty=1;save()}
 function store(u){const r=st()[u];if(!r)return;const w=where(u),id=itemId(r.sp,u);if(w==='stable')return;if(stable().length>=capS())return say('El establo está lleno ('+capS()+' plazas).');
  if(w==='eq'){if(!canLose())return;try{MOUNT.off('manual')}catch(e){}S.eq.mt=null}else if(w==='inv')S.inv.splice(S.inv.indexOf(id),1);else return;
  stable().push(u);snd('coin');dirty=1;save()}
 function take(u){const r=st()[u];if(!r||where(u)!=='stable')return;if(slotsUsed()>=cap())return say('Mochila llena.');S.stable=stable().filter(x=>x!==u);S.inv.push(itemId(r.sp,u));snd('coin');dirty=1;save()}
 function release(u){const r=st()[u];if(!r)return;const w=where(u),id=itemId(r.sp,u);if(w==='eq'){if(!canLose())return;try{MOUNT.off('manual')}catch(e){}S.eq.mt=null}else if(w==='stable')S.stable=stable().filter(x=>x!==u);else if(w==='inv')S.inv.splice(S.inv.indexOf(id),1);
  delete st()[u];say((r.nm||baseName(r.sp))+' vuelve a la naturaleza.');dirty=1;save()}
 const isFood=id=>/^(pl_|c_|f_)/.test(id)||(typeof COC!=='undefined'&&!!COC.props(id)&&!/^carne|^pollo|^ancas/.test(id)&&COC.props(id)[0]>=0);
 // PIENSO: gasta 1 comida y sube el afecto (+10, +16 con un plato) y da un poco de XP; si la montura está equipada recupera todo el aguante
 function feed(u,food){const r=st()[u];if(!r)return;const i=S.inv.indexOf(food);if(i<0)return say('Ya no tienes eso.');if(r.aff>=100)return say((r.nm||baseName(r.sp))+' no quiere más: está encantado contigo.');
  S.inv.splice(i,1);r.aff=Math.min(100,r.aff+(/^(pl_|c_|f_)/.test(food)?16:10));try{if(S.eq.mt===itemId(r.sp,u)){MOUNT.addXp(30);MOUNT.refill()}}catch(e){}snd('eat');dirty=1}
 // ── interfaz ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 let root=null,SELU=null,STN=null,confirm=null;
 const all=()=>{const L=[];Object.keys(st()).forEach(u=>{const w=where(u);if(w!=='?')L.push([u,w])});const ord={eq:0,inv:1,stable:2,bank:3};return L.sort((a,b)=>ord[a[1]]-ord[b[1]]||st()[b[0]].lv-st()[a[0]].lv)};
 const WT={eq:'Montura',inv:'Mochila',stable:'Establo',bank:'Banco'};
 function open(stn){STN=stn||STN;sweep();const l=all();if(!SELU||!st()[SELU])SELU=l.length?l[0][0]:null;confirm=null;let e=document.getElementById('stb');if(!e){e=document.createElement('div');e.id='stb';document.body.appendChild(e)}
  e.style.display='block';root=e;e.onclick=onClick;render();try{snd('coin')}catch(x){}}
 function close(){const e=document.getElementById('stb');if(e){e.style.display='none';e.innerHTML=''}root=null}
 function bar(k,v,c){return'<div class="sb-g"><span>'+GN[k][0]+'</span><div class="sb-b"><i style="width:'+Math.min(100,v)+'%;background:'+GN[k][1]+'"></i><s style="left:'+CEIL(c)+'%"></s></div><b>'+v+'</b></div>'}
 function render(){if(!root)return;const l=all(),r=SELU?st()[SELU]:null,n=stable().length;
  let h='<div class="sb-top"><b class="sb-ti">🐴 Establo</b><span class="sb-cap">Plazas: '+n+' / '+capS()+'</span><button class="sb-x" data-a="x">✕ Cerrar</button></div><div class="sb-body"><div class="sb-list">';
  h+=l.length?l.map(([u,w])=>{const q=st()[u],id=itemId(q.sp,u);return'<button class="sb-c'+(u===SELU?' on':'')+'" data-a="sel" data-u="'+u+'"><span class="ic">'+ic(id)+'</span><span class="n"><b>'+(q.nm||baseName(q.sp))+'</b><em>Nv '+q.lv+' · '+baseName(q.sp)+'</em></span><span class="tg '+w+'">'+WT[w]+'</span></button>'}).join(''):'<p class="sb-empty">Aún no tienes ningún animal. Doma uno en el campo: busca los «Pastos salvajes» y lleva un lazo (Ingeniería).</p>';
  h+='</div><div class="sb-det">';
  if(r){const w=where(SELU),id=itemId(r.sp,SELU),e=MTD.get(r.sp),lvCap=12+4*(r.gen-1);
   h+='<div class="sb-hd"><span class="big">'+ic(id)+'</span><div><input class="sb-nm" maxlength="18" placeholder="'+baseName(r.sp)+'" value="'+(r.nm||'')+'" data-a="nm"><div class="sb-sub">'+baseName(r.sp)+' · generación '+r.gen+(e&&e.rare?' · <b style="color:#e8cf94">única</b>':'')+' · '+WT[w]+'</div></div></div>'
    +'<div class="sb-sec"><h4>Nivel '+r.lv+(r.lv>=lvCap?' (máx.)':'')+'</h4>'+(r.lv<lvCap?'<div class="sb-b xp"><i style="width:'+Math.min(100,r.xp/(300+150*r.lv)*100)+'%"></i></div>':'')+'<div class="sb-sub">Gana experiencia recorriendo el mundo a lomos. Velocidad ×'+(e?(e.v*(1+.012*(r.lv-1))*(1+r.g.vel/1000)).toFixed(2):'1')+'</div></div>'
    +'<div class="sb-sec"><h4>Genes <small>(techo '+CEIL(r.gen)+')</small></h4>'+GK.map(k=>bar(k,r.g[k],r.gen)).join('')+'<div class="sb-sub">Carga: '+Math.floor(r.g.car/20)+' huecos de mochila mientras la llevas equipada. Temple: reservado para el terreno.</div></div>'
    +'<div class="sb-sec"><h4>Rasgos</h4>'+(r.tr.length?r.tr.map(k=>'<div class="sb-tr"><b>'+TR[k][0]+'</b> — '+TR[k][1]+'</div>').join(''):'<div class="sb-sub">Sin rasgos. Los rasgos se heredan y mutan al criar (próximamente).</div>')+'</div>'
    +'<div class="sb-sec"><h4>Habilidades</h4>'+(Object.keys(r.sk).length?Object.keys(r.sk).map(k=>'<div class="sb-tr"><b>'+MOUNT.SKD[k][0]+' '+['I','II','III'][r.sk[k]-1]+'</b> — '+MOUNT.SKD[k][2]+'</div>').join(''):'<div class="sb-sub">Aún no ha aprendido ninguna (niveles 3, 6, 9 y 12).</div>')+'</div>'
    +'<div class="sb-sec"><h4>Afecto</h4><div class="sb-b aff"><i style="width:'+r.aff+'%"></i></div><div class="sb-sub">Más afecto = más probabilidad de aprender habilidades. Dale de comer:</div><div class="sb-food">'
    +(()=>{const c={};S.inv.filter(isFood).forEach(x=>c[x]=(c[x]||0)+1);const ks=Object.keys(c).slice(0,10);return ks.length?ks.map(x=>'<button class="sb-f" data-a="feed" data-f="'+x+'" title="'+I[x][0]+'">'+ic(x)+'<em>×'+c[x]+'</em></button>').join(''):'<span class="sb-sub">No llevas comida.</span>'})()+'</div></div>'
    +'<div class="sb-act">'+(w==='eq'?'':'<button class="sb-go" data-a="equip">Equipar</button>')+(w==='stable'?'<button data-a="take">Sacar a la mochila</button>':w==='bank'?'':'<button data-a="store">Guardar en el establo</button>')
    +(confirm===SELU?'<button class="danger" data-a="release2">¿Seguro? Soltar</button>':'<button class="danger" data-a="release">Soltar</button>')+'</div>'}
  else h+='<p class="sb-empty">Elige un animal.</p>';
  h+='</div></div>';const keep=root.querySelector('.sb-nm'),had=keep&&document.activeElement===keep;root.innerHTML=h;const n2=root.querySelector('.sb-nm');if(n2){n2.onchange=()=>{rename(SELU,n2.value);render()};n2.onkeydown=ev=>{ev.stopPropagation();if(ev.key==='Enter')n2.blur()}}}
 function onClick(ev){const b=ev.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;if(a==='x'){close();return}if(a==='nm')return;
  if(a==='sel'){SELU=b.dataset.u;confirm=null}else if(a==='equip')equip(SELU);else if(a==='store')store(SELU);else if(a==='take')take(SELU);else if(a==='feed')feed(SELU,b.dataset.f);else if(a==='release')confirm=SELU;else if(a==='release2'){release(SELU);confirm=null;SELU=null;const l=all();if(l.length)SELU=l[0][0]}
  render()}
 addEventListener('keydown',ev=>{if(root&&ev.key==='Escape'){ev.stopImmediatePropagation();close()}},true);
 function tick(){if(root&&STN&&typeof P!=='undefined'&&Math.hypot(P.x-STN.x,P.y-STN.y)>200)close()}
 return{open,close,tick,adopt,sweep,ensure,cur,recOf,uidOf,mk,canLose,equip,store,take,release,feed,rename,TR,GK,get active(){return !!root},get list(){return all()}}
})();
