// NotScape · MONTURAS (lote DOMAR-D1, 29 oct 2026) · global `MOUNT`. Plan completo: docs/PLAN_DOMAR.md.
// D1 = prototipo: UNA montura (caballo) en una ranura dedicada `S.eq.mt` (EQK, hoja de personaje «Montura»), tecla H para montar/desmontar, velocidad propia, AGUANTE propio y desmontar al
// combatir, recibir daño, recolectar o entrar en un interior. Todavía sin captura, nivel, habilidades, Establo ni cría (D2–D5). El modelo y la pose del jinete: src/r3d/mount3d.js + herom3d.js/heroanim3d.js.
// D3 (29 oct): NIVEL de la montura (1–12 en G1; sube con la DISTANCIA y el galope, menos si das vueltas) y HABILIDADES ALEATORIAS (35 %+ en los hitos 3/6/9/12; ver `SKD`). El estado va en `S.mtx[especie]` (por ESPECIE hasta el Establo, D4, que lo pasará a cada animal).
// Velocidades: trote = lo mismo que correr (RUN_MUL, gratis); galope (Mayús) = ×GAL sobre el trote y gasta el aguante de la montura; con el aguante a 0 vuelve al trote hasta recuperar 30.
const MOUNT=(()=>{
 const GAL=1.7,DRAIN=14,REG_W=5,REG_I=9,TIRED_OFF=30;
 const o={on:0,k:0,g:0,sta:100,tired:0,gl:0};let bar=null,fill=null,lastShow=0;
 // ── D3 · PROGRESO POR USO ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 // SKD = habilidades [nombre, rareza (0 común · 1 rara · 2 épica), efecto por rango]. Cada especie tiene un pool de 8 de las 10 (`pool`, determinista por hash del id). Habilidad nueva = una fila aquí + su efecto abajo.
 const SKD={firme:['Galope firme',0,'−10 % de gasto de aguante'],ligero:['Paso ligero',0,'+4 % de velocidad'],pulmones:['Pulmones',0,'+15 % de recuperación de aguante'],descanso:['Buen descanso',0,'se recupera antes del agotamiento'],
  temple:['Temple',1,'15 % de no desmontar al recibir daño'],sigilo:['Sigilo',1,'−20 % de ruido ante los animales salvajes'],instinto:['Instinto',1,'+20 % de XP de montura'],
  arranque:['Arranque',2,'al empezar a galopar, +12 % de velocidad 3 s (enfriamiento 20 s)'],aliento:['Segundo aliento',2,'al agotarse recupera un 40 % del aguante (cada 60 s)'],eterno:['Galope eterno',2,'−20 % de gasto de aguante']};
 const SKK=Object.keys(SKD),RW=[60,30,10],RN=['I','II','III'],LV_CAP=12,SK_MAX=4,need=l=>300+150*l;   // LV_CAP = tope de la generación G1 (la cría lo ampliará en D5: +4 por generación)
 const hs=str=>{let h=7;for(let i=0;i<str.length;i++)h=(h*31+str.charCodeAt(i))>>>0;return h};
 const pool=sp=>{const a=hs(sp)%SKK.length,b=(a+3+hs(sp+'x')%6)%SKK.length;return SKK.filter((k,i)=>i!==a&&i!==b)};
 const mst=()=>STAB.cur()||{xp:0,lv:1,sk:{},g:{vel:0,agu:0,car:0,tem:0},tr:[],aff:0,gen:1};   /* D4: el estado vive en el ANIMAL equipado (S.stab[uid], src/stable.js) */
 const ge=k=>{const r=STAB.cur();return r?r.g[k]:0},tr=k=>{const r=STAB.cur();return r&&r.tr.indexOf(k)>=0?1:0};
 const rk=k=>{try{return has()?(mst().sk[k]||0):0}catch(e){return 0}};
 const lvl=()=>{try{return has()?mst().lv:1}catch(e){return 1}};
 function roll(){const st=mst(),known=Object.keys(st.sk),full=known.length>=SK_MAX;let c=pool(spOf()).filter(k=>(st.sk[k]||0)<3&&(!full||st.sk[k]));if(!c.length)return;
  const w=c.map(k=>RW[SKD[k][1]]),tot=w.reduce((a,b)=>a+b,0);let r=Math.random()*tot,k=c[c.length-1];for(let i=0;i<c.length;i++){r-=w[i];if(r<=0){k=c[i];break}}
  st.sk[k]=(st.sk[k]||0)+1;const col=['#e8dcc0','#7ab8ff','#c58aff'][SKD[k][1]];say(nm()+' ha aprendido <b style="color:'+col+'">'+SKD[k][0]+' '+RN[st.sk[k]-1]+'</b>: '+SKD[k][2]+'.');try{snd('quest')}catch(e){}}
 function addXp(n){if(!has())return;const st=mst();if(st.lv>=LV_CAP)return;st.xp+=n*(1+.2*rk('instinto')+.25*tr('fiel'));
  while(st.lv<LV_CAP&&st.xp>=need(st.lv)){st.xp-=need(st.lv);st.lv++;say(nm()+' sube a <b style="color:#e8cf94">nivel '+st.lv+'</b>.');try{snd('quest')}catch(e){}if(st.lv%3===0&&Math.random()<Math.min(.7,.35+L('dm')*.003+(st.aff||0)*.002))roll()}
  if(st.lv>=LV_CAP)st.xp=0;dirty=1}
 // la XP sale de la DISTANCIA recorrida montado (el galope rinde ×1,5); dar vueltas por las mismas casillas rinde ×0,25 (anti-farmeo)
 function track(dt){if(o.lx==null||Math.hypot(P.x-o.lx,P.y-o.ly)>200)o.lx=P.x,o.ly=P.y;const d=Math.hypot(P.x-o.lx,P.y-o.ly);o.lx=P.x;o.ly=P.y;if(!d)return;
  const key=Math.floor(P.x/128)+','+Math.floor(P.y/128),R=o.rc||(o.rc=[]),seen=R.indexOf(key)>=0;if(!seen){R.push(key);if(R.length>24)R.shift()}
  o.xa=(o.xa||0)+d/20*(o.g===2?1.5:1)*(seen?.25:1);if(o.xa>=5){addXp(o.xa);o.xa=0}}
 const has=()=>{try{return !!(S.eq.mt&&LOOT[S.eq.mt]&&LOOT[S.eq.mt].mt)}catch(e){return false}};
 function reg(){ACT.dm=[];MTD.reg()}   /* DOMAR-D3: los 39 objetos mt_<especie> salen de src/mountdata.js */
 const spOf=()=>{try{return LOOT[S.eq.mt].mt.sp||'caballo'}catch(e){return 'caballo'}},cur=()=>MTD.get(spOf())||MTD.get('caballo'),nm=()=>{const e=cur();return 'Tu '+e.mt.toLowerCase().split(' ')[0]};
 function say(t){try{toast(t,2200)}catch(e){}}
 function off(why){if(!o.on)return;o.on=0;o.gl=0;if(why&&why!=='manual')say('Desmontas ('+why+').');try{if(window.R3D&&R3D.fx)R3D.fx.dust(P.x,P.y,'#b8a888',3,0)}catch(e){}}
 function toggle(){if(o.on)return off('manual');
  if(!has())return say('Equipa una montura en la ranura «Montura» para poder montar (tecla H).');
  if(typeof INT!=='undefined'&&INT)return say('No puedes montar dentro de un edificio ni de una cueva.');
  if(P.hp<=0||(typeof CK!=='undefined'&&CK))return;
  const now=performance.now();if(now-(P.cbT||-1e9)<2500||now-HURT<2500)return say('No puedes montar en pleno combate.');
  if(typeof A!=='undefined'&&A)stopA();P.g=P.mv=null;o.on=1;o.tired=o.sta<=0?1:o.tired;try{if(window.R3D&&R3D.fx)R3D.fx.dust(P.x,P.y,'#b8a888',3,0)}catch(e){}snd&&snd('coin')}
 // ¿galopa este fotograma? (Mayús mantenida, con aguante)
 function gal(req){o.gl=o.on&&req&&!o.tired&&o.sta>0?1:0;return o.gl}
 const mul=run=>(typeof RUN_MUL!=='undefined'?RUN_MUL:1.9)*(run&&o.gl?GAL:1)*cur().v*(1+.012*(lvl()-1))*(1+ge('vel')/1000)*(1+.05*tr('ligera'))*(1+.04*rk('ligero'))*(performance.now()<(o.arE||0)?1+.12*rk('arranque'):1);   /* v = velocidad de la especie */
 let lab=null,xpl=null,labT='';function ui(show,now){if(!bar){bar=document.createElement('div');bar.id='mtb';bar.innerHTML='<i></i><s></s>';document.body.appendChild(bar);fill=bar.firstChild;xpl=bar.lastChild;lab=document.createElement('div');lab.id='mtl';document.body.appendChild(lab)}
  if(show!==lastShow){lastShow=show;bar.classList.toggle('on',!!show);if(!show&&lab)lab.classList.remove('on')}if(show){const L2=lvl(),st=has()?mst():null,t='Nv '+L2+(L2>=LV_CAP?' (máx.)':'')+(st&&Object.keys(st.sk).length?' · '+Object.keys(st.sk).map(k=>SKD[k][0]+' '+RN[st.sk[k]-1]).join(' · '):'');if(t!==labT){labT=t;lab.textContent=t}lab.classList.toggle('on',true);xpl.style.width=st&&L2<LV_CAP?Math.min(100,st.xp/need(L2)*100).toFixed(1)+'%':'100%';fill.style.width=Math.max(0,Math.min(100,o.sta)).toFixed(1)+'%';bar.classList.toggle('low',!!o.tired)}}
 function tick(now,dt){
  if(o.on&&(!has()||(typeof INT!=='undefined'&&INT)||P.hp<=0))off();
  if(o.on&&HURT!==o.hs){o.hs=HURT;o.keep=Math.random()<.15*rk('temple')+.25*tr('imperturbable')}
  if(o.on&&now-HURT<350&&!o.keep)off('daño');
  if(o.on&&P.mvg){o.rd=(o.rd||0)+(o.g===2?1.6:1)*(typeof RUN_MUL!=='undefined'?RUN_MUL:1.9)*70*dt;if(o.rd>=640){o.rd-=640;try{gain('dm',3,true)}catch(e){}}}   /* Domar sube un poco montando (cada ~20 casillas) */
  if(o.on&&P.mvg)track(dt);else o.lx=null;
  o.k+=((o.on?1:0)-o.k)*Math.min(1,dt*(o.on?5:6));if(Math.abs(o.k-(o.on?1:0))<.004)o.k=o.on?1:0;
  const mv=!!P.mvg,galNow=o.on&&mv&&o.gl;o.g=o.on&&mv?(galNow?2:1):0;
  if(galNow&&!o.pg&&rk('arranque')&&now>(o.arT||0)){o.arE=now+3000;o.arT=now+20000}
  o.pg=galNow;
  if(galNow){o.sta=Math.max(0,o.sta-DRAIN/cur().a/(1+.015*(lvl()-1))/(1+ge('agu')/200)/(1+.15*tr('pecho'))*Math.max(.3,1-.1*rk('firme')-.2*rk('eterno'))*dt);if(o.sta<=0){if(rk('aliento')&&now>(o.alT||0)){o.sta=40*rk('aliento');o.alT=now+60000;say(nm()+' toma un segundo aliento.')}else{o.tired=1;say(nm()+' está agotado: trota hasta que recupere el aliento.')}}}else{o.sta=Math.min(100,o.sta+(mv?REG_W:REG_I)*(1+.15*rk('pulmones')+.3*tr('odre'))*dt)}
  if(o.tired&&o.sta>=TIRED_OFF-8*rk('descanso'))o.tired=0;
  ui(o.on||o.sta<99,now)}
 const desc=id=>{const m=LOOT[id]&&LOOT[id].mt;if(!m)return '';const e=MTD.get(m.sp),pc=x=>(x>=1?'+':'')+Math.round((x-1)*100)+' %';return e.ic+' Montura'+(e.rare?' <b style="color:#e8cf94">única</b>':'')+' · velocidad '+pc(e.v)+' · aguante '+pc(e.a)+'. '+(()=>{try{const st=STAB.recOf(id);if(!st)return '';const ks=Object.keys(st.sk);return ' <br>Nivel <b>'+st.lv+'</b>'+(st.lv>=LV_CAP?' (máx. de su generación)':' · '+Math.round(st.xp/need(st.lv)*100)+' %')+(ks.length?'<br>'+ks.map(k=>'<b>'+SKD[k][0]+' '+RN[st.sk[k]-1]+'</b> — '+SKD[k][2]).join('<br>'):'')+(st.tr.length?'<br>'+st.tr.map(k=>'<b>'+STAB.TR[k][0]+'</b> — '+STAB.TR[k][1]).join('<br>'):'')+'<br>Genes: vel '+st.g.vel+' · agu '+st.g.agu+' · carga '+st.g.car+' · temple '+st.g.tem+'<br>'}catch(e){return ''}})()+' Equípala en la ranura «Montura» (o en el Establo) y pulsa <b>H</b>. <b>Mayús</b> = galope (gasta su aguante). Desmontas al recibir daño, combatir, recolectar o entrar en un edificio.'};
 return{reg,toggle,off,gal,mul,tick,desc,has,addXp,roll,SKD,pool,lvl,rk,stealth:()=>o.on?Math.max(.2,1-.2*rk('sigilo')-.25*tr('sigiloso')):1,bag:()=>has()&&STAB.cur()?Math.floor(STAB.cur().g.car/20):0,refill:()=>{o.sta=100;o.tired=0},get sp(){return spOf()},get on(){return o.on},get k(){return o.k},get g(){return o.g},get sta(){return o.sta},get tired(){return o.tired}}
})();

// ── CAPTURA (lote DOMAR-D2, estilo BDO, en el mundo y sin ventana; plan: docs/PLAN_DOMAR.md §2.1) ──
// 1 ACECHAR: un animal domable (`MD[id].tm`) tiene una ALERTA 0..1 que sube con tu ruido (correr/galopar, cerca) y baja si te quedas quieto o lejos; al llegar a 1 huye ~4,5 s.
// 2 LAZO: LMB sobre él (o F) a ≤ 300 px con un lazo `lz_*` en la mochila: un aro se cierra y hay que pulsar LMB cuando coincide con el aro interior (un lazo mejor = zona más ancha).
//    Fallar gasta el lazo y alerta al animal. 3 DOMA: se sacude; cada sacudida AVISA (aro que se cierra) y hay que pulsar ESPACIO en el último instante. 3 aciertos = domado; 2 fallos = te tira.
// Resultado: el animal se va y recibes su objeto de montura (`mt_<especie>`) + XP de Domar. El nivel de Domar limita qué animales (`tm.lv`).
const TAME=(()=>{
 const T={on:0,ph:'',sub:'',m:null,t0:0,dur:0,gi:0,rnd:0,ok:0,bad:0,w0:0,w1:0,res:0,resT:0,next:0,msg:'',msgT:0};
 const now=()=>performance.now(),say=t=>{try{toast(t,2400)}catch(e){}},lzI=()=>S.inv.findIndex(x=>/^lz_\d$/.test(x));
 function why(m){const n=now();if(!m||!m.d||!m.d.tm)return 'No se puede domar.';if(!alive(m,n)||m.gone)return 'Ya no está.';if(m.fleeT>n)return 'Está huyendo: acércate despacio.';if((m.al||0)>=.85)return 'Está demasiado alerta: quédate quieto un momento.';
  if(typeof INT!=='undefined'&&INT)return 'Aquí no.';if(P.hp<=0)return 'No.';if(n-(P.cbT||-1e9)<2500)return 'No puedes domar en pleno combate.';if(Math.hypot(m.x-P.x,m.y-P.y)>300)return 'Acércate más (a menos de 9 casillas).';
  if(L('dm')<m.d.tm.lv)return 'Necesitas Domar nivel '+m.d.tm.lv+'.';if(lzI()<0)return 'Necesitas un lazo (Ingeniería: Banco de ingeniero).';return ''}
 function start(m){if(T.on)return true;const r=why(m);if(r){say(r);return /^Necesitas/.test(r)}   /* sin lazo o sin nivel el clic NO ataca al animal por accidente */
  if(MOUNT.on)MOUNT.off();if(typeof A!=='undefined'&&A)stopA();P.g=P.mv=null;const gi=+S.inv[lzI()][3];Object.assign(T,{on:1,ph:'lazo',sub:'',m,t0:now(),dur:1500,gi,rnd:0,ok:0,bad:0,msg:'',msgT:0});m.al=Math.max(m.al||0,.35);return true}
 function end(msg,fail){const m=T.m;T.on=0;T.ph='';if(m)m.tmHeld=0;if(msg)say(msg);if(fail&&m){m.al=1;m.fleeT=now()+4500}T.m=null}
 function round(good,n,why2){T.sub='res';T.res=good?1:-1;T.resT=n+650;if(good){T.ok++;T.msg='¡Bien!'}else{T.bad++;T.msg=why2||'¡Te sacude!';try{P.hp=Math.max(1,P.hp-Math.round(maxHp()*.08));HURT=n;SHK=5}catch(e){}}T.msgT=n+700}
 function press(n){if(!T.on)return false;
  if(T.ph==='lazo'){const i=lzI(),r=1-(n-T.t0)/T.dur,w=.13+.04*T.gi,m=T.m;if(i>=0)S.inv.splice(i,1);dirty=1;
   if(Math.abs(r-.3)<=w){T.ph='doma';T.rnd=0;T.ok=0;T.bad=0;T.sub='wait';T.next=n+900;T.msg='¡Lazo! Aguanta: ESPACIO cuando se cierre el aro';T.msgT=n+2200;m.tmHeld=1;try{snd('quest')}catch(e){}}
   else{end('El lazo falló: el animal se asusta.',false);m.al=Math.min(1,(m.al||0)+.5);if(m.al>=1)m.fleeT=n+4500}return true}
  if(T.ph==='doma'){if(T.sub==='warn'){const d=n-T.w1;if(d>=-320&&d<=140)round(true,n);else if(d<-320)round(false,n,'¡Demasiado pronto!');return true}
   if(T.sub==='wait'){round(false,n,'¡Demasiado pronto!');return true}return true}
  return true}
 function success(n){const m=T.m;T.on=0;T.ph='';m.tmHeld=0;m.rt=n+90000;m.gone=1;m.hunt=0;m.al=0;T.m=null;if(m.d.tm.rare)m.rt=n+MTD.RARE_GONE*60000;add('mt_'+m.d.id);gain('dm',m.d.tm.xp);inc('tame');log((MTD.get(m.d.id)||{ic:'🐴'}).ic+' <b>¡Has domado: '+m.d.n.toLowerCase().replace(' salvaje','')+'!</b> Equípalo en la ranura «Montura».'+(m.d.tm.rare?' <b style="color:#e8cf94">¡Una montura única!</b>':''));try{snd('quest');if(window.R3D&&R3D.fx)R3D.fx.spark(m.x,m.y,30,'#e8cf94',18,{spread:1.6,up:1.4,size:.12,life:1})}catch(e){}dirty=1;save()}
 function tick(n,dt){if(!T.on)return;const m=T.m;
  if(!m||!alive(m,n)||P.hp<=0||(typeof INT!=='undefined'&&INT)||Math.hypot(m.x-P.x,m.y-P.y)>380){end('Se acabó la doma.',false);return}
  if(T.ph==='lazo'){if(n-T.t0>T.dur){end('Tardaste demasiado con el lazo.',false);m.al=Math.min(1,(m.al||0)+.25)}return}
  if(T.ph==='doma'){const f=T.sub;
   if(f==='wait'&&n>=T.next){T.sub='warn';T.w0=n;T.w1=n+900+Math.random()*350;try{snd('miss')}catch(e){}}
   else if(f==='warn'){m.x+=(Math.random()-.5)*1.4;m.y+=(Math.random()-.5)*1.4;if(n>T.w1+140)round(false,n,'¡No reaccionaste!')}
   else if(f==='res'&&n>=T.resT){if(T.ok>=3){success(n);return}if(T.bad>=2){end('El animal te tira al suelo y se escapa.',true);try{SHK=8}catch(e){}return}T.sub='wait';T.next=n+700+Math.random()*600}}}
 // IA del animal domable dentro del bucle de criaturas (game.js): devuelve true si ya movió/gestionó a la criatura este fotograma
 function mobTick(m,n,dt,dp,dx,dy){if(m.gone&&alive(m,n)){m.gone=0;m.rr=0}if(m.al==null)m.al=0;
  if(m.d.tm.rare&&!m.rr){m.rr=1;if(Math.random()>MTD.RARE_P){m.gone=1;m.rt=n+(MTD.RARE_WAIT[0]+Math.random()*(MTD.RARE_WAIT[1]-MTD.RARE_WAIT[0]))*60000;return true}}   /* ÚNICA RARA: al (re)aparecer tira el dado; si no sale, se esconde unos minutos */
  if(m.tmHeld)return true;
  if(m.hunt){m.hunt=0;m.fleeT=n+4000;m.al=1}
  if(m.fleeT>n&&dp>0){const sp=(m.d.tm.flee||150)*dt,nx=m.x-dx/dp*sp,ny=m.y-dy/dp*sp;if(typeof inVilla!=='function'||!inVilla(nx,ny)){m.x=nx;m.y=ny;m.mv=n;m.f=-(dx-dy)>=0?1:-1}return true}
  const near=dp<300&&P.hp>0&&!(typeof INT!=='undefined'&&INT);
  if(near){const loud=P.mvg?((typeof RUN!=='undefined'&&RUN)||MOUNT.g===2?1.7:.5)*(MOUNT.on?1.5*MOUNT.stealth():1):0,prox=1-dp/300;m.al=Math.min(1,m.al+(loud*prox*.9+(dp<110?.5:0)*prox*(P.mvg?1:.3))*dt);if(!P.mvg&&dp>=110)m.al=Math.max(0,m.al-.2*dt)}
  else m.al=Math.max(0,m.al-.35*dt);
  if(m.al>=1&&!(m.fleeT>n))m.fleeT=n+4500;
  return false}
 // dibujo 2D sobre el 3D (como los cuchillos): barra de alerta sobre el animal cercano, aro del lazo y aros de la doma
 function draw(n){if(typeof ctx==='undefined')return;const k=ISO.scale();   /* px de pantalla por px de modelo (no SPR: eso es para los sprites antiguos) */
  ctx.save();ctx.setTransform(1,0,0,1,0,0);
  for(const m of M){if(!m.d||!m.d.tm||m.gone||!alive(m,n))continue;const dp=Math.hypot(m.x-P.x,m.y-P.y);if(dp>340)continue;
   const c=ISO.toCanvas(m.x,m.y,TER.standZ(m.x,m.y)),y=c.y-(m.d.h+14)*k,w=30*k,h=4*k,a=Math.max(0,Math.min(1,m.al||0));
   ctx.globalAlpha=.9;ctx.fillStyle='rgba(10,8,6,.75)';ctx.fillRect(c.x-w/2-1,y-1,w+2,h+2);ctx.fillStyle=a<.5?'#8fcf6a':a<.8?'#e8cf94':'#e0603a';ctx.fillRect(c.x-w/2,y,w*a,h);ctx.globalAlpha=1}
  if(T.on&&T.m){const m=T.m,c=ISO.toCanvas(m.x,m.y,TER.standZ(m.x,m.y)),cy=c.y-(m.d.h*.5)*k,R0=56*k;
   const ring=(r,col,lw)=>{ctx.beginPath();ctx.arc(c.x,cy,Math.max(1,r),0,6.283);ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.stroke()};
   if(T.ph==='lazo'){const r=Math.max(0,1-(n-T.t0)/T.dur),w=.13+.04*T.gi;ring(R0*(.3+w),'rgba(232,207,148,.35)',2*k);ring(R0*Math.max(0,.3-w),'rgba(232,207,148,.35)',2*k);ring(R0*.3,'#e8cf94',3*k);ring(R0*r,Math.abs(r-.3)<=w?'#9fe08a':'#ffffff',4*k)}
   else if(T.ph==='doma'){if(T.sub==='warn'){const u=Math.max(0,(T.w1-n)/(T.w1-T.w0));ring(R0*(.3+.7*u),(T.w1-n)<=320&&(T.w1-n)>=-140?'#9fe08a':'#ff7a5a',4*k);ring(R0*.3,'#e8cf94',3*k)}else ring(R0*.3,'rgba(232,207,148,.45)',2*k)}
   const fs0=Math.round(17*(cv.width/innerWidth)),py=c.y+fs0*4.1;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(c.x+(i-1)*fs0*1.4-fs0*1.3,py,fs0*.45,0,6.283);ctx.fillStyle=i<T.ok?'#9fe08a':'rgba(20,16,12,.7)';ctx.fill();ctx.strokeStyle='#e8cf94';ctx.lineWidth=1.5;ctx.stroke()}
   for(let i=0;i<2;i++){ctx.beginPath();ctx.arc(c.x+(i-.5)*fs0*1.2+fs0*1.9,py,fs0*.38,0,6.283);ctx.fillStyle=i<T.bad?'#e0603a':'rgba(20,16,12,.7)';ctx.fill();ctx.strokeStyle='#e8cf94';ctx.lineWidth=1.2;ctx.stroke()}
   const fs=Math.round(17*(cv.width/innerWidth));ctx.font='700 '+fs+'px Cinzel,serif';ctx.textAlign='center';ctx.fillStyle='#e8cf94';ctx.shadowColor='#000';ctx.shadowBlur=4;
   const t=T.ph==='lazo'?'LMB al cerrarse':T.sub==='warn'?'¡ESPACIO!':(n<T.msgT?T.msg:'Aguanta…');ctx.fillText(t,c.x,c.y+fs*2.4)}
  ctx.restore()}
 return{T,start,press,tick,mobTick,draw,why,get on(){return T.on}}
})();
