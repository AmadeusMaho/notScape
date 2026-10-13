// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ENCARGOS (lote 4, oct 2026) · tablón de misiones de cada pueblo + pestaña «Misiones» (activas) + pestaña «Logros» (las antiguas misiones de hitos).
//  · Cada bioma tiene su TABLÓN en la plaza (estación 'board'). Se renueva cada 15 min reales (S.qb.t). Seis notas por bioma: 2 de recolección, 1 de fabricación y 3 de combate.
//  · Tope por bioma: los encargos de un bioma solo piden lo que existe en su banda de niveles (de BI[k].lv hasta BI[k+1].lv−1); el siguiente bioma es más difícil y paga más.
//  · Peligro 1–5 (★). El RANGO de reputación del bioma (S.rep[k], sube al entregar encargos) decide el peligro máximo que se ofrece: más rango = encargos más duros y mejor pagados.
//      combate: ★1 criatura común · ★2 la de la manada · ★3 campamento (orcos) o la de la manada +3 niveles · ★4 «Alfa» (nivel +6, ×1,6 vida) · ★5 «Cabecilla» (nivel +10, ×3 vida, uno solo).
//  · Los encargos de combate hacen aparecer a sus objetivos (m.tmp = id del encargo) cerca de una guarida real del bioma; solo cuentan ellos (clave st['qk:'+id]). No reaparecen.
//  · Los de recolección/fabricación miden la diferencia de st['got:'+item] / st['make:'+item] desde que aceptas (base).
//  · Racha: cada encargo entregado en menos de 30 min del anterior suma +5 % de recompensa (máx. +50 %).
//  · API pensada para PNJ: qOffer(q) abre la nota ampliada de cualquier encargo (los PNJ futuros llaman a qMake(...)+qOffer(q) y q.giver = id del PNJ).
//  · Se guarda en S.qs (activos), S.qb (tablón), S.rep, S.qn (entregados), S.qstreak. Versión de guardado 13 (los guardados 12 siguen valiendo: solo faltan estos campos).
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const QBN=15*60*1000,QMAX=5,QDG=['','Tranquilo','Moderado','Arriesgado','Peligroso','Mortal'],QRK=[0,4,12,30,60],QMUL=[0,1,1.4,2,3,4.5];
const QRKN=['Forastero','Conocido','Confiable','Respetado','Leyenda'];
let QINIT=0,QSEL=null,QOPEN=0,QPAP=null;
const qEnsure=()=>{if(!S.qs)S.qs=[];if(!S.rep)S.rep={};if(!S.qn)S.qn=0;if(!S.qstreak)S.qstreak=0};
const qRank=k=>{const p=(S.rep||{})[k]||0;let r=0;QRK.forEach(t=>{if(p>=t)r++});return r};
const qIc=q=>q.kind==='combat'?'⚔️':ic(q.tg),qStars=n=>'★'.repeat(n)+'☆'.repeat(5-n);
const qBiomeMax=k=>BI[k+1]?BI[k+1].lv-1:99;
const qRid=()=>Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36);
function qResPool(k,sk){const b=BI[k],seen={};(b.res[sk]||[]).forEach(l=>l.forEach(x=>{seen[x[0]]=1}));return Object.keys(seen).map(Number)}
// Crea un encargo (objeto serializable). kind: 'gather' | 'craft' | 'combat'
function qMake(k,kind,dg){const b=BI[k],mxL=qBiomeMax(k);let q={id:qRid(),k,kind,dg,giver:'board',st:0};
 if(kind==='gather'){const sk=['wc','mi','fi'][R(0,2)],pool=qResPool(k,sk).filter(i=>rq(ACT[sk][i])<=Math.min(mxL,Math.max(L(sk)+4,1)));if(!pool.length)return null;const i=pool[R(0,pool.length-1)],a=ACT[sk][i],lvM=a[2],n=Math.max(4,Math.round((8+dg*4+R(0,6))*Math.max(.6,1-lvM*.004)));
  q.sk=sk;q.key='got:'+a[1];q.tg=a[1];q.n=n;q.req=[sk,rq(a)];q.t=({wc:'Leña para el pueblo',mi:'Pedido de la herrería',fi:'Pescado fresco'})[sk];q.ds=({wc:'Necesitamos madera de calidad: trae ',mi:'La forja anda corta de material: trae ',fi:'La cocina del pueblo pide '})[sk]+n+' × '+I[a[1]][0].toLowerCase()+'.';
  q.ic=I[a[1]][1];const v=I[a[1]][2]||2;q.rw={c:Math.round(n*v*(1.1+.25*dg)+12*(k+1)),xp:[sk,Math.round(n*xv(a)*(1.2+.25*dg))]}}
 else if(kind==='craft'){const cands=[];['co','sm','cr'].forEach(sk=>ACT[sk].forEach((a,i)=>{if(a.length!==6||!a[2]||String(a[2]).startsWith('rn_'))return;const lv=rq(a);if(lv>mxL||lv<Math.max(1,b.lv-10)||lv>L(sk)+3)return;if(typeof ownT==='function'&&ownT(a))return;if(!I[a[2]])return;cands.push([sk,a,lv])}));if(!cands.length)return null;
  const[sk,a,lv]=cands[R(0,cands.length-1)],n=sk==='co'?R(4,8)+dg*2:Math.max(1,R(1,2)+Math.floor(dg/2));q.sk=sk;q.key='make:'+a[2];q.tg=a[2];q.n=n;q.req=[sk,lv];q.t=({co:'Banquete del pueblo',sm:'Encargo de herrería',cr:'Encargo de taller'})[sk];q.ds='Fabrica '+n+' × '+I[a[2]][0].toLowerCase()+' ('+ACT_NAME(sk)+').';q.ic=I[a[2]][1];
  const v=I[a[2]][2]||5;q.rw={c:Math.round(n*v*(1.05+.22*dg)+15*(k+1)),xp:[sk,Math.round(n*xv(a)*(.9+.2*dg))]}}
 else{const mobs=[...b.mobs.ing,b.mobs.pack],camp=b.camp&&dg===3?'orco':null;let tg=dg<=1?b.mobs.ing[R(0,b.mobs.ing.length-1)]:camp||b.mobs.pack;const d=MD[tg];if(!d)return null;
  const lvB=Math.round(d.lv),n=dg===5?1:dg===4?3:Math.max(3,R(5,9)-(dg-1));q.tg=tg;q.n=n;q.key='qk:'+q.id;q.sk='cb';q.lvm=lvB+(dg===3&&!camp?3:dg===4?6:dg===5?10:0);
  q.t=({1:'Plaga de ',2:'Batida de ',3:'Despeja a ',4:'Caza al Alfa: ',5:'Cabecilla: '})[dg]+d.n.toLowerCase()+(dg<=3?'s':'');q.ds=dg===5?'Un '+d.n.toLowerCase()+' enorme ronda por la zona y aterroriza a los aldeanos. Acaba con él.':dg===4?'Una manada liderada por un '+d.n.toLowerCase()+' alfa. Elimina a '+n+'.':'Elimina a '+n+' '+d.n.toLowerCase()+(n>1?'s':'')+' que merodean cerca del camino.';
  q.ic=d.e||'⚔️';q.mname=d.n;const avg=(d.co[0]+d.co[1])/2;q.rw={c:Math.round(n*avg*(2+1.2*dg)*(1+.04*q.lvm)+20*(k+1)),xp:['cb',Math.round(n*(5+.0026*q.lvm*q.lvm)*(2+dg)*.9)]}}
 q.rw.rep=dg;
 if(dg>=3){const fd=Object.keys(I).filter(x=>I[x][3]&&!I[x][4]&&!x.includes('~')&&!/^rv_/.test(x)),tgH=Math.max(4,Math.round(maxHp()*.45)),best=fd.sort((x,y)=>Math.abs(I[x][3]-tgH)-Math.abs(I[y][3]-tgH))[0];if(best)q.rw.it=[best,2+dg]}
 return q}
const ACT_NAME=sk=>({co:'Cocina',sm:'Herrería',cr:'Artesanía'})[sk]||sk;
function qGenBoard(k){const r=qRank(k),mx=Math.min(5,r),out=[],dgs=[];for(let i=0;i<3;i++)dgs.push(R(1,Math.max(1,Math.min(mx,2+Math.floor(r/2)))));dgs[2]=mx;dgs.sort();
 for(const kd of ['gather','gather','craft'])out.push(qMake(k,kd,Math.min(mx,R(1,Math.max(1,mx-1)))));for(let i=0;i<3;i++)out.push(qMake(k,'combat',dgs[i]));return out.filter(Boolean)}
function qBoard(k){qEnsure();const now=Date.now();if(!S.qb||now-S.qb.t>=QBN||!S.qb.k)S.qb={t:now,k:{}};if(!S.qb.k[k])S.qb.k[k]=qGenBoard(k);return S.qb.k[k]}
const qLeft=()=>S.qb?Math.max(0,QBN-(Date.now()-S.qb.t)):QBN;
const qProg=q=>Math.min(q.n,Math.max(0,(S.st[q.key]||0)-(q.base||0)));
function qAccept(id){qEnsure();const k=QPAP&&QPAP.k,q=QPAP;if(!q||q.id!==id)return;if(S.qs.length>=QMAX)return toast('📜 Ya llevas '+QMAX+' encargos. Entrega o abandona alguno.');
 const bd=S.qb&&S.qb.k&&S.qb.k[q.k];if(bd){const i=bd.findIndex(x=>x.id===q.id);if(i>=0)bd.splice(i,1)}
 q.base=q.key.startsWith('qk:')?0:(S.st[q.key]||0);q.st=1;q.t0=Date.now();S.qs.push(q);if(q.kind==='combat')qSpawn(q);snd('quest');log('📜 Aceptas: <b>'+q.t+'</b>.');
 if(q.kind==='combat')toast('📍 Objetivo marcado: <b>'+q.mname+'</b> · '+qWhere(q));QPAP=null;QSEL=null;dirty=1;save();qRender();panel()}
function qAbandon(id){qEnsure();const i=S.qs.findIndex(q=>q.id===id);if(i<0)return;const q=S.qs.splice(i,1)[0];qClean(q.id);log('Abandonas: '+q.t+'.');dirty=1;save();qRender();panel()}
function qReject(){QPAP=null;qRender()}
// ── combate: objetivos que aparecen cerca de una guarida real ──
function qCentre(q){const live=M.filter(m=>!m.tmp&&m.d.id===q.tg&&BIOMES&&biomeAt(m.x,m.y)===q.k),pool=live.length?live:M.filter(m=>!m.tmp&&!m.d.boss&&biomeAt(m.x,m.y)===q.k);if(!pool.length)return{x:BI[q.k].ox+300,y:BI[q.k].oy+700};const p=pool[R(0,pool.length-1)];return{x:p.hx,y:p.hy}}
function qSpawn(q){if(!q.cx){const c=qCentre(q);q.cx=Math.round(c.x);q.cy=Math.round(c.y)}const left=q.n-qProg(q),now=performance.now();M.filter(m=>m.tmp===q.id).forEach(m=>{m.rt=Infinity;m.dead=now-9999});
 const d=MD[q.tg];for(let i=0;i<left;i++){let x=q.cx,y=q.cy;for(let a=0;a<30;a++){const an=Math.random()*6.283,r=40+Math.random()*(60+a*3);x=q.cx+Math.cos(an)*r;y=q.cy+Math.sin(an)*r;if(!blk(x,y)&&!PROPS.solid(x,y))break}
  mob(q.tg,x,y);const m=M[M.length-1];m.tmp=q.id;m.lv=Math.max(1,q.lvm+R(-1,1));const f=MSF[q.tg]||[1,1];m.mh=Math.max(3,Math.round(HPF(m.lv)*f[0]*(q.dg===4?1.6:q.dg===5?3:1)));m.dm=f[1]?Math.max(1,Math.round(DMF(m.lv)*f[1]*(q.dg>=4?1.2+.1*(q.dg-4):1))):0;m.hp=m.mh;m.rt=0;m.elite=q.dg>=4?q.dg:0}}
function qMobDead(m){const now=performance.now();m.rt=Infinity;m.dead=now;S.st['qk:'+m.tmp]=(S.st['qk:'+m.tmp]||0)+1;chk()}
function qClean(id){const now=performance.now();M.forEach(m=>{if(m.tmp===id){m.rt=Infinity;m.dead=now-9999}})}
function qWhere(q){if(q.cx==null)return '';const dx=q.cx-P.x,dy=q.cy-P.y,d=Math.hypot(dx,dy),a=Math.atan2(dy,dx),dirs=['este','sureste','sur','suroeste','oeste','noroeste','norte','noreste'],i=Math.round(a/(Math.PI/4)+8)%8;return 'a '+Math.round(d/10)+' m al '+dirs[i]}
// ── ciclo ──
let qTk=0;
function qTick(now){if(!QINIT&&typeof M!=='undefined'&&M.length){QINIT=1;qEnsure();S.qs.filter(q=>q.kind==='combat').forEach(q=>qSpawn(q))}
 if(now<qTk)return;qTk=now+1500;for(let i=M.length-1;i>=0;i--){const m=M[i];if(m.tmp&&m.rt===Infinity&&now-(m.dead||0)>2500&&!(A&&A.e===m))M.splice(i,1)}
 if(QOPEN&&qLeft()<=0){QPAP=null;qRender()}
 const el=document.getElementById('qbt');if(el)el.textContent=qFmt(qLeft())}
const qFmt=ms=>{const s=Math.ceil(ms/1000);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
function qChk(){if(!S.qs||!S.qs.length)return;const done=S.qs.filter(q=>qProg(q)>=q.n);done.forEach(qDone)}
function qDone(q){const i=S.qs.indexOf(q);if(i<0)return;S.qs.splice(i,1);qClean(q.id);const now=Date.now();S.qstreak=(S.qlast&&now-S.qlast<30*60000)?Math.min(10,(S.qstreak||0)+1):1;S.qlast=now;const bon=1+.05*Math.min(10,S.qstreak-1),c=Math.round(q.rw.c*bon);
 S.coins+=c;S.st.coins=(S.st.coins||0)+c;S.qn=(S.qn||0)+1;S.rep[q.k]=(S.rep[q.k]||0)+q.rw.rep;const rk0=qRank(q.k);
 if(q.rw.xp)gain(q.rw.xp[0],Math.round(q.rw.xp[1]*bon),0);let itx='';if(q.rw.it){for(let n=0;n<q.rw.it[1];n++)if(S.inv.length<cap())add(q.rw.it[0]);itx='<br>+'+q.rw.it[1]+' '+I[q.rw.it[0]][0]}
 snd('quest');banner('📜 ¡Encargo cumplido!',q.t,'#ffe629',3200);toast('📜 <b>'+q.t+'</b><br>+'+fmt(c)+' oro · +'+fmt(Math.round((q.rw.xp?q.rw.xp[1]:0)*bon))+' XP'+itx+(S.qstreak>1?'<br>Racha ×'+S.qstreak+' (+'+Math.round((bon-1)*100)+'%)':''),4200);log('Encargo cumplido: '+q.t+' (+'+fmt(c)+' oro).');
 if(qRank(q.k)>rk0)setTimeout(()=>toast('🏅 ¡Rango de '+BI[q.k].n+': <b>'+QRKN[qRank(q.k)-1]+'</b>!<br>Ahora hay encargos de peligro '+qRank(q.k)+'.',4200),1500);
 dirty=1;save();qRender();if(TB==='qm')panel()}
// ── interfaz: el tablón (papeles sobre madera) ──
function qOpenBoard(){qEnsure();const k=Math.max(0,Math.min(BI.length-1,biomeAt(P.x,P.y)));QOPEN=1;QSEL=k;QPAP=null;let el=document.getElementById('qbd');if(!el){el=document.createElement('div');el.id='qbd';document.body.appendChild(el);el.addEventListener('click',e=>{if(e.target===el)qCloseBoard()})}el.style.display='flex';qRender()}
function qCloseBoard(){QOPEN=0;QPAP=null;const el=document.getElementById('qbd');if(el)el.style.display='none'}
function qOffer(q){QOPEN=1;QPAP=q;let el=document.getElementById('qbd');if(!el){el=document.createElement('div');el.id='qbd';document.body.appendChild(el);el.addEventListener('click',e=>{if(e.target===el)qCloseBoard()})}el.style.display='flex';qRender()}
function qPick(i){const bd=qBoard(QSEL);QPAP=bd[i]||null;qRender()}
const qRwHTML=q=>`<div class="qrw">💰 <b>${fmt(q.rw.c)}</b> oro${q.rw.xp?` · ${SK[q.rw.xp[0]]?SK[q.rw.xp[0]][1]:''} <b>${fmt(q.rw.xp[1])}</b> XP`:''}${q.rw.it?` · ${I[q.rw.it[0]][1]} ×${q.rw.it[1]}`:''} · 🏅 +${q.rw.rep} reputación</div>`;
function qPaperHTML(q){const acc=S.qs&&S.qs.some(x=>x.id===q.id),full=S.qs&&S.qs.length>=QMAX,lock=q.req&&L(q.req[0])<q.req[1]?'Requiere '+SK[q.req[0]][0]+' nivel '+q.req[1]:'';
 return `<div class="qbig" onclick="event.stopPropagation()"><div class="qpin"></div><div class="qh">${qIc(q)} <b>${q.t}</b></div><div class="qdg" title="Peligro">${qStars(q.dg)} <span>${QDG[q.dg]}</span></div><div class="qtx">${q.ds}</div>
  <div class="qob">🎯 ${q.kind==='combat'?'Derrota a '+q.n+' × '+q.mname+' (nv. ~'+q.lvm+')':q.kind==='craft'?'Fabrica '+q.n+' × '+I[q.tg][0]+' · '+ACT_NAME(q.sk)+' '+q.req[1]:'Consigue '+q.n+' × '+I[q.tg][0]+' · '+SK[q.sk][0]+' '+q.req[1]}</div>${qRwHTML(q)}
  ${lock?`<div class="qlk">🔒 ${lock}</div>`:''}<div class="qbt"><button class="bt" onclick="qReject()">Rechazar</button>${acc?'':`<button class="bt ok" ${lock||full?'disabled':''} onclick="qAccept('${q.id}')">${full?'Mochila de encargos llena':'Aceptar'}</button>`}</div></div>`}
function qRender(){const el=document.getElementById('qbd');if(!el||!QOPEN)return;const k=QSEL==null?0:QSEL;
 if(QPAP){el.innerHTML=qPaperHTML(QPAP);return}
 const bd=qBoard(k),r=qRank(k),nx=QRK[r],pp=(S.rep[k]||0);
 el.innerHTML=`<div class="qboard" onclick="event.stopPropagation()"><button class="bt x" onclick="qCloseBoard()" title="Cerrar (Esc)">✕</button><div class="qtt">📜 Tablón de ${BI[k].n}</div>
  <div class="qsub">Nuevos encargos en <b id="qbt">${qFmt(qLeft())}</b> · Rango: <b>${QRKN[r-1]}</b> (${pp}${nx?'/'+nx:''}) · Activos ${S.qs.length}/${QMAX}</div>
  <div class="qwall">${bd.length?bd.map((q,i)=>`<button class="qnote" style="--rot:${(((i*37+q.id.charCodeAt(q.id.length-1))%7)-3)*1.3}deg;--c:${['#f5e8b8','#efe0a8','#f8efc8','#f1dfb0','#f6ecc0','#ead9a2'][i%6]}" onclick="qPick(${i})"><span class="qpn"></span><span class="qi">${qIc(q)}</span><span class="qn1">${q.t}</span><span class="qs">${qStars(q.dg)}</span><span class="qo">${q.kind==='combat'?'⚔️ Combate':q.kind==='craft'?'🔨 Fabricar':'⛏️ Recolectar'} · ${q.n}</span></button>`).join(''):'<div class="hint" style="padding:30px;color:#2a1a0a">No quedan notas. Vuelve cuando se renueve el tablón.</div>'}</div></div>`}
// ── pestaña Misiones ──
function qmHTML(){qEnsure();const g=GOALS[S.goal];let h='<h2>📜 Misiones</h2>';
 h+='<div class="qmain"><div class="hint" style="margin:0">⭐ Misión principal (Ru)</div>'+(g?`<b class="gold">${g[0]}</b><div class="hint" style="margin:0">${(g[1]==='talk'||g[2]<=1)?'Habla con Ru en la plaza.':fmt(Math.min(g[2],S.st[g[1]]||0))+' / '+fmt(g[2])}</div>`:'<b class="gold">¡Completaste todos los objetivos!</b>')+'</div>';
 h+=`<div class="hint" style="margin:8px 0 4px">Encargos activos (${S.qs.length}/${QMAX}) · en el tablón de cada pueblo hay más. Racha: ${S.qstreak||0}</div>`;
 h+=S.qs.length?S.qs.map(q=>{const v=qProg(q);return `<div class="qa"><b class="gold">${qIc(q)} ${q.t}</b> <span class="hint">${qStars(q.dg)} · ${BI[q.k].n}</span><div class="hint" style="margin:0">${q.kind==='combat'?'Derrota a '+q.mname:q.kind==='craft'?'Fabrica '+I[q.tg][0]:'Consigue '+I[q.tg][0]} (${v}/${q.n})${q.kind==='combat'?' · 📍 '+qWhere(q):''}</div><div class="bar"><i style="width:${v/q.n*100}%"></i></div>${qRwHTML(q)}<button class="bt" onclick="qAbandon('${q.id}')">Abandonar</button></div>`}).join(''):'<div class="hint">Sin encargos. Visita el tablón de la plaza.</div>';
 h+='<div class="hint" style="margin:10px 0 3px">Reputación</div>'+BI.map((b,k)=>{const p=S.rep[k]||0,r=qRank(k);return p||k===0||k<=curB?`<div class="hint" style="margin:0">${b.n}: <b>${QRKN[r-1]}</b> (${p}${QRK[r]?'/'+QRK[r]:''})</div>`:''}).join('');return h}
