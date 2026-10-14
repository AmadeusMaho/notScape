// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// HABILIDADES (prototipo, oct 2026) · árbol de talentos por familia + barra de acceso rápido 1–5 (estilo WoW).
//  · Tres familias, ligadas al TIPO DE ARMA equipada: espada/puños → Combate (cb) · báculo → Magia (mg) · arco → Arquería (ra). Cambiar de arma cambia de barra.
//  · Cada familia tiene 3 ramas × 3 escalones (9 habilidades). Para APRENDER una hace falta: nivel mínimo en la skill, haber aprendido el escalón anterior de la rama y 1 punto de talento.
//    Puntos de talento de una familia = 1 + ⌊nivel de la skill / 15⌋ (1…7 al nivel 99): no alcanzan para las 9 → hay que elegir (reiniciar talentos cuesta oro).
//  · Las ARMAS no suben de nivel: su tier ya escala el daño (todas las habilidades se miden en «× el golpe máximo del arma», maxHit()). Lo que sube es el DOMINIO de cada
//    habilidad (rango 0–4 por usos: 20/80/240/600): +8 % de efecto y −4 % de enfriamiento por rango. Así se aprende usando, como en OSRS, y se elige como en un RPG.
//  · Recursos: Combate y Arquería gastan Energía (la misma de correr), Magia gasta maná (sin runas). Enfriamiento propio + 0,7 s de enfriamiento global.
// Este archivo solo define datos y lógica; usa globales de game.js (S, L, wtype, maxHit, M, A, P, hitM…) siempre en tiempo de llamada.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const ABF={cb:{n:'Combate',e:'⚔️',wt:'m',res:'EN',rn:'Energía',br:['Filo','Temple','Furia']},mg:{n:'Magia',e:'🔮',wt:'g',res:'MN',rn:'Maná',br:['Arcano','Protección','Tormenta']},ra:{n:'Arquería',e:'🏹',wt:'r',res:'EN',rn:'Energía',br:['Precisión','Caza','Volea']}};
// fx: coef (× golpe máximo), n golpes, sure (no falla), aoe (radio px, centrado en el objetivo o en ti si self), drain (fracción curada), exec [umbral, coef], bleed (golpes), buf [clave, ms, valor]
const ABIL=[
 // ── Combate ──
 {id:'cb_tajo',fam:'cb',br:0,t:0,n:'Tajo',e:'🗡️',lv:1,cd:6,cost:8,coef:1.5,sure:1,d:'Un tajo certero.'},
 {id:'cb_estocada',fam:'cb',br:0,t:1,n:'Estocada',e:'🔪',lv:20,cd:10,cost:16,coef:2.3,sure:1,d:'Estocada profunda que nunca falla.'},
 {id:'cb_ejec',fam:'cb',br:0,t:2,n:'Ejecución',e:'💀',lv:50,cd:25,cost:26,coef:1.2,exec:[.3,3.6],sure:1,d:'Remata: daño enorme si el enemigo tiene menos del 30 % de vida.'},
 {id:'cb_guardia',fam:'cb',br:1,t:0,n:'Guardia alta',e:'🛡️',lv:1,cd:30,cost:10,self:1,buf:['def',14000,5],d:'+5 de defensa durante 14 s.'},
 {id:'cb_grito',fam:'cb',br:1,t:1,n:'Grito de guerra',e:'📣',lv:20,cd:40,cost:15,self:1,buf:['abd',15000,1.3],d:'+30 % de daño durante 15 s.'},
 {id:'cb_muro',fam:'cb',br:1,t:2,n:'Muro de acero',e:'🏰',lv:50,cd:60,cost:25,self:1,buf:['wall',8000,.5],d:'Recibes la mitad de daño durante 8 s.'},
 {id:'cb_giro',fam:'cb',br:2,t:0,n:'Golpe giratorio',e:'🌀',lv:1,cd:10,cost:12,coef:1,aoe:70,self:1,sure:1,d:'Golpea a todos los enemigos a tu alrededor.'},
 {id:'cb_torb',fam:'cb',br:2,t:1,n:'Torbellino',e:'🌪️',lv:20,cd:14,cost:20,coef:1.5,aoe:80,self:1,sure:1,d:'Un torbellino de acero más amplio.'},
 {id:'cb_terr',fam:'cb',br:2,t:2,n:'Terremoto',e:'💥',lv:50,cd:30,cost:30,coef:2.3,aoe:110,self:1,sure:1,d:'Golpeas el suelo y sacudes a todo el que esté cerca.'},
 // ── Magia ──
 {id:'mg_orbe',fam:'mg',br:0,t:0,n:'Orbe arcano',e:'🔮',lv:1,cd:5,cost:2,coef:1.4,sure:1,col:'#c8a0ff',d:'Lanzas un orbe que no falla.'},
 {id:'mg_rayo',fam:'mg',br:0,t:1,n:'Rayo',e:'⚡',lv:20,cd:9,cost:6,coef:2.2,sure:1,col:'#fff2a0',d:'Un rayo certero y potente.'},
 {id:'mg_meteoro',fam:'mg',br:0,t:2,n:'Meteoro',e:'☄️',lv:50,cd:30,cost:16,coef:3.4,aoe:80,sure:1,col:'#ff6a3a',d:'Un meteoro que cae sobre el objetivo y los cercanos.'},
 {id:'mg_barrera',fam:'mg',br:1,t:0,n:'Barrera',e:'🔰',lv:1,cd:30,cost:3,self:1,buf:['def',14000,5],d:'+5 de defensa durante 14 s.'},
 {id:'mg_escudo',fam:'mg',br:1,t:1,n:'Escudo de maná',e:'🫧',lv:20,cd:45,cost:8,self:1,buf:['wall',10000,.6],d:'Recibes un 40 % menos de daño durante 10 s.'},
 {id:'mg_drenar',fam:'mg',br:1,t:2,n:'Drenar vida',e:'🩸',lv:50,cd:18,cost:10,coef:1.8,drain:.5,sure:1,col:'#d04a6a',d:'Daña al enemigo y te curas la mitad del daño.'},
 {id:'mg_prisa',fam:'mg',br:2,t:0,n:'Prisa arcana',e:'💨',lv:1,cd:30,cost:3,self:1,buf:['spd',8000,1],d:'+35 % de velocidad durante 8 s.'},
 {id:'mg_nova',fam:'mg',br:2,t:1,n:'Nova',e:'❄️',lv:20,cd:14,cost:8,coef:1.3,aoe:110,self:1,sure:1,col:'#9ad8ff',d:'Una onda de energía a tu alrededor.'},
 {id:'mg_tormenta',fam:'mg',br:2,t:2,n:'Tormenta de energía',e:'⛈️',lv:50,cd:28,cost:15,coef:2.3,aoe:140,self:1,sure:1,col:'#7ab0ff',d:'Una tormenta que arrasa en un radio grande.'},
 // ── Arquería ──
 {id:'ra_certero',fam:'ra',br:0,t:0,n:'Disparo certero',e:'🎯',lv:1,cd:6,cost:8,coef:1.6,sure:1,d:'Un disparo que no falla.'},
 {id:'ra_perf',fam:'ra',br:0,t:1,n:'Disparo perforante',e:'🏹',lv:20,cd:10,cost:16,coef:2.4,sure:1,d:'Una flecha pesada que atraviesa la defensa.'},
 {id:'ra_mortal',fam:'ra',br:0,t:2,n:'Tiro mortal',e:'☠️',lv:50,cd:30,cost:28,coef:4,sure:1,d:'El disparo más fuerte del arco.'},
 {id:'ra_halcon',fam:'ra',br:1,t:0,n:'Ojo de halcón',e:'🦅',lv:1,cd:40,cost:10,self:1,buf:['abd',12000,1.3],d:'+30 % de daño durante 12 s.'},
 {id:'ra_veneno',fam:'ra',br:1,t:1,n:'Flecha envenenada',e:'🧪',lv:20,cd:14,cost:12,coef:1,bleed:6,sure:1,d:'Daña y envenena: 6 golpes de sangrado.'},
 {id:'ra_evasion',fam:'ra',br:1,t:2,n:'Evasión',e:'👣',lv:50,cd:60,cost:22,self:1,buf:['wall',8000,.5],d:'Recibes la mitad de daño durante 8 s.'},
 {id:'ra_doble',fam:'ra',br:2,t:0,n:'Disparo doble',e:'✌️',lv:1,cd:8,cost:10,coef:.8,n2:2,sure:1,d:'Dos flechas seguidas.'},
 {id:'ra_lluvia',fam:'ra',br:2,t:1,n:'Lluvia de flechas',e:'🌧️',lv:20,cd:15,cost:20,coef:1.1,aoe:100,sure:1,d:'Llueven flechas sobre el objetivo y los cercanos.'},
 {id:'ra_salva',fam:'ra',br:2,t:2,n:'Salva',e:'🎆',lv:50,cd:25,cost:26,coef:.9,n2:5,sure:1,d:'Cinco flechas en ráfaga.'}];
const ABX={};ABIL.forEach(a=>ABX[a.id]=a);
const ABRK=[20,80,240,600],ABGC=700;let ABCD={},ABG=0,ABT=0,ABSEL=null,ABFV=null,abKey='';
const abFam=()=>{const t=wtype();return t==='r'?'ra':t==='g'?'mg':'cb'};
const abSk=()=>{const k=S.sk||(S.sk={});k.learned=k.learned||{};k.bar=k.bar||{};k.use=k.use||{};['cb','mg','ra'].forEach(f=>k.bar[f]=k.bar[f]||[]);return k};
const abRank=id=>{const u=abSk().use[id]||0;let r=0;ABRK.forEach(t=>{if(u>=t)r++});return r};
const abSlots=f=>3+(L(f)>=40?1:0)+(L(f)>=70?1:0);
const abSpent=f=>ABIL.filter(a=>a.fam===f&&abSk().learned[a.id]).length;
const abPts=f=>1+Math.floor(L(f)/15)-abSpent(f);
const abCd=a=>a.cd*(1-.04*abRank(a.id));
function abCan(a){const f=a.fam,k=abSk();if(k.learned[a.id])return 'ya';if(L(f)<a.lv)return 'Requiere '+ABF[f].n+' nivel '+a.lv;if(a.t>0){const p=ABIL.find(x=>x.fam===f&&x.br===a.br&&x.t===a.t-1);if(!k.learned[p.id])return 'Requiere «'+p.n+'»'}if(abPts(f)<1)return 'Sin puntos de talento';return ''}
function abLearn(id){const a=ABX[id],k=abSk(),w=abCan(a);if(w){if(w!=='ya')toast('🔒 '+w);return}k.learned[id]=1;const bar=k.bar[a.fam];if(bar.length<5&&!bar.includes(id))bar.push(id);snd('quest');log('Aprendes <b>'+a.n+'</b>.');abKey='';dirty=1;save();panel()}
function abAssign(id,slot){const k=abSk(),a=ABX[id];if(!k.learned[id])return;const b=k.bar[a.fam];const o=b.indexOf(id);if(o>=0)b[o]=null;while(b.length<=slot)b.push(null);b[slot]=id;for(let i=b.length-1;i>=0&&!b[i];i--)b.pop();abKey='';dirty=1;save();panel()}
function abUnassign(id){const k=abSk(),b=k.bar[ABX[id].fam],o=b.indexOf(id);if(o>=0){b[o]=null;for(let i=b.length-1;i>=0&&!b[i];i--)b.pop()}abKey='';dirty=1;save();panel()}
function abRespecCost(){return 200+30*(L('cb')+L('mg')+L('ra'))}
function abRespec(){const k=abSk(),c=abRespecCost();if(!Object.keys(k.learned).length)return;if(S.coins<c)return toast('Necesitas '+c+' de oro para reiniciar los talentos.');S.coins-=c;k.learned={};['cb','mg','ra'].forEach(f=>k.bar[f]=[]);abKey='';snd('coin');log('Talentos reiniciados (−'+c+' oro).');dirty=1;save();panel()}
function abUse(slot){if(P.hp<=0||CK)return;const f=abFam(),id=abSk().bar[f][slot];if(!id)return;const a=ABX[id],now=performance.now();if(now<ABG||now<(ABCD[id]||0))return;
 const isMg=ABF[f].res==='MN',have=isMg?MN:EN;if(have<a.cost){toast(isMg?'💧 Te falta maná.':'⚡ Te falta energía.');return}
 let m=null;
 if(a.coef){m=spellTarget();if(!m){toast('No hay ningún enemigo cerca.');return}const dd=Math.hypot(P.x-m.x,P.y-m.y),rg=a.self&&a.aoe?a.aoe+12:f==='cb'?80:220;if(dd>rg){toast(f==='cb'||a.self?'Acércate más al enemigo.':'Está demasiado lejos.');return}}
 if(isMg)MN-=a.cost;else EN-=a.cost;ABCD[id]=now+abCd(a)*1000;ABG=now+ABGC;ABT=now+380;
 const k=abSk();k.use[id]=(k.use[id]||0)+1;const rk=abRank(id);if(rk>abRank0(id,k.use[id]-1))toast('⭐ <b>'+a.n+'</b>: ¡dominio '+rk+'!');
 const mul=1+.08*rk;
 if(a.buf){const[kk,ms,v]=a.buf,t=Date.now()+ms;S.buf[kk]=Math.max(S.buf[kk]||0,t);if(kk==='abd')S.buf.abdv=v;if(kk==='wall')S.buf.wallv=v;snd('magic');sp(P.x,P.y-14,'#9fe0ff',12,70,60,120);log('Usas <b>'+a.n+'</b>.')}
 if(a.coef&&m){if(!A||A.e!==m){stopA();P.g=null;startF(m,now)}P.f=m.x-m.y>=P.x-P.y?1:-1;
  const mx=maxHit(),cx=a.self?P.x:m.x,cy=a.self?P.y:m.y,tg=a.aoe?M.filter(o=>alive(o,now)&&!o.poi&&Math.hypot(o.x-cx,o.y-cy)<=a.aoe):[m];if(!tg.includes(m)&&!a.self)tg.unshift(m);
  const n2=a.n2||1,hv=a.coef>=2.2;
  tg.forEach(o=>{for(let h=0;h<n2;h++){let d=Math.max(1,Math.round(mx*a.coef*mul*(.85+Math.random()*.3)));if(a.exec&&o.hp<=o.mh*a.exec[0])d=Math.max(1,Math.round(mx*a.exec[1]*mul*(.85+Math.random()*.3)));
   const t1=now+(f==='cb'?60+h*110:(a.aoe&&!a.self?260:150)+h*110);
   if(f==='cb'){if(!h&&o===m)HFX.push({k:wColor()?'thrust':'punch',x:P.x,y:P.y,tx:o.x,ty:o.y,th:o.d.h/2,t0:now,d:300});PJ.push({x:P.x,y:P.y,sh:14,tx:o.x,ty:o.y,th:o.d.h/2,t0:t1+9999,t1,m:o,d,wt:'m',sk:'cb',mxv:mx*a.coef,hv:0,nodraw:1})}
   else PJ.push({x:P.x,y:P.y,sh:14,tx:o.x,ty:o.y,th:o.d.h/2,t0:t1-170,t1,m:o,d,wt:f==='mg'?'g':'r',sk:f,mxv:mx*a.coef,col:a.col,hv:hv&&!h?1:0})}
   if(a.drain&&o===m)ABQ.push({t:now+200,fn:()=>{const hl=Math.max(1,Math.round(mx*a.coef*mul*a.drain));P.hp=Math.min(maxHp(),P.hp+hl);splat(P.x,P.y,'+'+hl,'#2f9a3a',30)}});
   if(a.bleed&&o===m)o.bleed={n:a.bleed,t:now+600}});
  if(a.aoe&&a.self){HFX.push({k:'star',tx:cx,ty:cy,th:4,t0:now,d:380});sp(cx,cy-6,a.col||'#ffe629',16,a.aoe*1.6,50,120)}
  snd(f==='cb'?'hit':f==='mg'?'magic':'bow');log('Usas <b>'+a.n+'</b>.')}
 dirty=1}
const abRank0=(id,u)=>{let r=0;ABRK.forEach(t=>{if(u>=t)r++});return r};
let ABQ=[];
function abTick(now){if(ABQ.length){const r=ABQ.filter(q=>now>=q.t);if(r.length){ABQ=ABQ.filter(q=>now<q.t);r.forEach(q=>q.fn())}}abBarUpd(now)}
// ── barra de acceso rápido (DOM) ──
let abLt=0;function abBarUpd(now){if(now-abLt<80)return;abLt=now;const el=document.getElementById('abar');if(!el)return;const f=abFam(),k=abSk(),n=abSlots(f),key=f+'|'+n+'|'+k.bar[f].join(',');
 if(key!==abKey){abKey=key;el.innerHTML='<span class="abf" title="Familia según el arma equipada">'+ABF[f].e+'</span>'+Array.from({length:n},(_,i)=>{const id=k.bar[f][i],a=id&&ABX[id];return `<button class="abs${a?'':' empty'}" data-sl="${i}" onclick="abUse(${i})"${a?` data-ab="${id}"`:''}><i class="kn">${i+1}</i>${a?`<span class="ae">${a.e}</span><b class="cd"></b><u class="ct"></u>`:''}</button>`}).join('')}
 el.querySelectorAll('.abs[data-ab]').forEach(b=>{const a=ABX[b.dataset.ab],r=Math.max(0,(ABCD[a.id]||0)-now),tot=abCd(a)*1000,g=Math.max(0,ABG-now),isMg=ABF[f].res==='MN',lack=(isMg?MN:EN)<a.cost,rr=Math.max(r,g),h=r>0?r/tot:g/ABGC;
  const cd=b.querySelector('.cd'),ct=b.querySelector('.ct');cd.style.height=(rr>0?Math.min(100,h*100):0)+'%';ct.textContent=r>0?(r>=10000?Math.ceil(r/1000):(r/1000).toFixed(1)):'';b.classList.toggle('lack',lack&&rr<=0)})}
// ── pestaña «Habilidades» ──
function abHTML(){const k=abSk(),cur=abFam(),f=ABFV&&ABF[ABFV]?ABFV:cur,F=ABF[f],pts=abPts(f);
 let h='<h2>🌳 Habilidades</h2><div class="abtabs">'+['cb','mg','ra'].map(x=>`<button class="bt${x===f?' on':''}" onclick="ABFV='${x}';ABSEL=null;panel()">${ABF[x].e} ${ABF[x].n} <span class="gold">${L(x)}</span></button>`).join('')+'</div>';
 h+=`<div class="hint" style="margin:4px 0">${f===cur?'':'Equipa un '+(f==='cb'?'arma cuerpo a cuerpo (o nada)':f==='mg'?'báculo':'arco')+' para usar esta barra. · '}Puntos de talento: <b class="gold">${pts}</b> · Barra: ${abSlots(f)} huecos${abSlots(f)<5?' (más a nivel '+(L(f)<40?40:70)+')':''}</div>`;
 h+='<div class="abtree">'+F.br.map((bn,b)=>`<div class="abcol"><div class="abh">${bn}</div>`+[0,1,2].map(t=>{const a=ABIL.find(x=>x.fam===f&&x.br===b&&x.t===t),ln=k.learned[a.id],w=ln?'':abCan(a),cls=ln?'ln':w?'lk':'av';return `<button class="abn ${cls}${ABSEL===a.id?' sel':''}" onclick="ABSEL='${a.id}';panel()"><span class="ae">${a.e}</span><span class="an">${a.n}</span><span class="al">${ln?'Rango '+abRank(a.id):'nv. '+a.lv}</span></button>`}).join('')+'</div>').join('')+'</div>';
 const s=ABSEL&&ABX[ABSEL]&&ABX[ABSEL].fam===f?ABX[ABSEL]:null;
 if(s){const ln=k.learned[s.id],w=ln?'':abCan(s),rk=abRank(s.id),mul=1+.08*rk,nx=ABRK[rk],u=k.use[s.id]||0,F2=ABF[s.fam];
  h+=`<div class="abd"><b class="gold">${s.e} ${s.n}</b> <span class="hint">(${F2.br[s.br]} · escalón ${s.t+1})</span><div>${s.d}</div><div class="hint" style="margin:3px 0">${s.coef?'Daño: '+Math.round(s.coef*mul*100)+'% del golpe máximo'+(s.n2?' × '+s.n2:'')+(s.aoe?' · área '+s.aoe+' px':'')+(s.exec?' · '+Math.round(s.exec[1]*mul*100)+'% si <'+Math.round(s.exec[0]*100)+'% de vida':'')+' · ':''}Coste: ${s.cost} ${F2.rn} · Enfriamiento: ${abCd(s).toFixed(1)} s</div>`;
  if(ln){h+=`<div class="hint" style="margin:3px 0">Dominio ${rk}/4 · ${u} usos${nx?' (siguiente rango a los '+nx+')':' · máximo'}</div><div class="abass">Barra: `+Array.from({length:abSlots(s.fam)},(_,i)=>{const o=k.bar[s.fam][i];return `<button class="bt${o===s.id?' on':''}" title="${o&&o!==s.id?'Sustituye a '+ABX[o].n:'Asignar al hueco '+(i+1)}" onclick="abAssign('${s.id}',${i})">${i+1}</button>`}).join('')+`<button class="bt" onclick="abUnassign('${s.id}')">Quitar</button></div>`}
  else h+=w?`<div class="hint" style="color:var(--rd)">🔒 ${w}</div>`:`<button class="bt" style="margin-top:5px" onclick="abLearn('${s.id}')">Aprender (1 punto)</button>`;h+='</div>'}
 h+=`<div style="margin-top:10px"><button class="bt" onclick="abRespec()">Reiniciar talentos (${abRespecCost()} oro)</button></div>`;return h}
