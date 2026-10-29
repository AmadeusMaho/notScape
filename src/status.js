// NotScape · ESTADOS ALTERADOS (22 oct 2026; Fase 2 · AMPLIADO en el lote ESTADOS-FINALES, 28 oct 2026, con la lista aprobada por el dueño en docs/PLAN_ENCANTAMIENTOS.md §1).
// Motor ÚNICO para el jugador (`P`) y los enemigos (`m` de `M`). Se carga tras combat.js y antes de game.js; solo usa globales del juego en tiempo de llamada.
// Todo es DATOS (`D`): añadir un estado = una fila en `D`. Campos: dot/every/vm (daño por tiempo, × vm) · stack (cargas) · spd/spdN (velocidad fija / por carga) · inM/inN (daño recibido fijo / por carga)
// · outM (daño que hace) · acc (precisión) · hard (control duro: jefes ×0,4; «Inquebrantable» lo anula) · heal (× curación recibida) · rep (versión DÉBIL a la que sustituye: Toxina rep veneno…)
// · noShield (quita escudos) · y banderas de mecánica propia (froze, fear, silence, chain, doom, judge, spread, move, noMana, regen, thorns, unbreak, toFreeze, toDis).
// Se guardan en `e.sts = {clave:{t0,t1,v,n,nx,acc}}` con el reloj REAL (`performance.now()`); no se persisten en la partida (se limpian al morir).
// VERSIONES FUERTES: al aplicar la débil sobre la fuerte se refresca la fuerte; al aplicar la fuerte se borra la débil y hereda sus cargas.
// REACCIONES (`react`): Empapado apaga el fuego · Empapado + rayo = Electrocutado · Empapado + frío = Congelación · Fuego + hielo = Vapor (se anulan y ciega) · Veneno + fuego = Nube tóxica · Maldición + Juicio = Purga
// · Corrosión + golpe pesado = Disolución.
// API: STS.add(e,k,{dur,v,n}) · has · clear(e,soloMalos) · list(e) · spd(e) · out(e) · acc(e) · inP(d,now) · inM(m,d,now,{sk,heavy}) · frozen(e) · onHit(m,now) · onKill(m,now) · healM(e) · tick(now,dt).
const STS=(()=>{
 const C={critFreeze:1.75,vuln:1.15,weak:.75,fury:1.3,furySpd:1.1,slow:.65,blind:.4,bossHard:.4,immMs:3500,shield:.25,judge:1.5,judgeUnd:2,chainR:120,nearR:95};   // ajustables
 const D={
  bleed:{n:'Sangrado',ic:'🩸',col:'#d4261c',bad:1,dur:6000,dot:1,every:1000,stack:3,st:'sangrado',kind:'bleed'},
  hemorrhage:{n:'Hemorragia',ic:'🩸',col:'#ff1a10',bad:1,dur:7000,dot:1,every:800,stack:3,vm:1.5,move:2,st:'sangrado',kind:'bleed',rep:'bleed'},   // ×2 si el objetivo se mueve
  poison:{n:'Veneno',ic:'☠️',col:'#6ad04a',bad:1,dur:8000,dot:1,every:1000,stack:3,st:'veneno',kind:'poison'},
  toxin:{n:'Toxina',ic:'🧪',col:'#3aff6a',bad:1,dur:9000,dot:1,every:900,stack:5,vm:1.6,heal:.7,st:'veneno',kind:'poison',rep:'poison'},
  burn:{n:'Quemadura',ic:'🔥',col:'#ff8a2a',bad:1,dur:4000,dot:1,every:800,stack:1,st:'quemadura',kind:'burn'},
  incinerate:{n:'Incinerar',ic:'🔥',col:'#ffd04a',bad:1,dur:5000,dot:1,every:600,stack:1,vm:1.6,spread:1,st:'quemadura',kind:'burn',rep:'burn'},   // al morir ardiendo, salta a los cercanos
  slow:{n:'Ralentización',ic:'🐌',col:'#7ad0ff',bad:1,dur:5000,spd:C.slow},
  chill:{n:'Escarcha',ic:'🧊',col:'#a8e4ff',bad:1,dur:5000,stack:5,spdN:.08,toFreeze:5},   // a 5 cargas → Congelación
  freeze:{n:'Congelación',ic:'❄️',col:'#bfeaff',bad:1,dur:5000,hard:1,froze:1},
  shock:{n:'Electrizado',ic:'⚡',col:'#ffe85a',bad:1,dur:6000,chain:1,cn:1,cp:.5,cm:.5},   // tu siguiente golpe salta (50 %) a un enemigo cercano
  overload:{n:'Sobrecarga',ic:'⚡',col:'#fff7b0',bad:1,dur:6000,chain:1,cn:3,cp:1,cm:.6,cstun:400,rep:'shock'},
  vuln:{n:'Vulnerable',ic:'💔',col:'#e86a8a',bad:1,dur:8000,inM:C.vuln},
  exposed:{n:'Expuesto',ic:'💔',col:'#ff4a6a',bad:1,dur:8000,inM:1.3,noShield:1,rep:'vuln'},
  weak:{n:'Debilitado',ic:'🪶',col:'#a8a090',bad:1,dur:8000,outM:C.weak},
  exhaust:{n:'Agotamiento',ic:'🥀',col:'#8a8070',bad:1,dur:8000,outM:.65,spd:.85,rep:'weak'},
  curse:{n:'Maldición',ic:'🕯️',col:'#9a48ff',bad:1,dur:9000,dot:1,every:1500,stack:1,vm:.6,heal:.5,kind:'void'},
  doom:{n:'Condena',ic:'💀',col:'#d070ff',bad:1,dur:6000,heal:.5,doom:.25,rep:'curse'},   // al terminar estalla con el 25 % del daño recibido mientras duró
  corrode:{n:'Corrosión',ic:'🫧',col:'#c8e04a',bad:1,dur:8000,stack:5,inN:.04,toDis:5},   // a 5 cargas → Disolución
  dissolve:{n:'Disolución',ic:'💧',col:'#e8ff6a',bad:1,dur:4000,inM:1.35,noShield:1},
  rend:{n:'Desgarro',ic:'🗡️',col:'#e8d0b0',bad:1,dur:8000,stack:5,inN:.03},
  root:{n:'Raíces',ic:'🌿',col:'#6aa84a',bad:1,dur:3000,hard:1,spd:0},
  blind:{n:'Ceguera',ic:'🕶️',col:'#b8a0e0',bad:1,dur:6000,hard:1,acc:C.blind},
  fear:{n:'Miedo',ic:'😱',col:'#c0a0ff',bad:1,dur:1600,hard:1,fear:1},   // el enemigo huye y no ataca
  silence:{n:'Silencio',ic:'🤐',col:'#a0b0ff',bad:1,dur:5000,silence:1},   // sin habilidades (embestidas, proyectiles, hechizos)
  mark:{n:'Marcado',ic:'🎯',col:'#ffb04a',bad:1,dur:10000,inR:1.2},   // +20 % de daño a distancia contra él
  manaburn:{n:'Quemadura de maná',ic:'🔷',col:'#5aa0ff',bad:1,dur:6000,dot:1,every:1000,vm:.5,noMana:1,kind:'arcane'},   // jugador: no regenera maná
  judgement:{n:'Juicio',ic:'⚖️',col:'#ffe9a8',bad:1,dur:8000,judge:1},   // el próximo golpe recibido es crítico (×2 a no-muertos y demonios)
  wet:{n:'Empapado',ic:'💧',col:'#4ab0ff',bad:1,dur:7000},
  shield:{n:'Escudo',ic:'🛡️',col:'#6ab0ff',dur:12000,shield:1},
  fury:{n:'Furia',ic:'💢',col:'#ff5a3a',dur:10000,outM:C.fury,spd:C.furySpd},
  regen:{n:'Regeneración',ic:'💚',col:'#5ad06a',dur:10000,regen:1,every:2000},
  haste:{n:'Celeridad',ic:'💨',col:'#bfffef',dur:6000,spd:1.15},
  thorns:{n:'Espinas',ic:'🌵',col:'#a8c87a',dur:10000,thorns:.1},
  unbreak:{n:'Inquebrantable',ic:'🗿',col:'#d8c8a0',dur:4000,unbreak:1}
 };
 const STRONG={};for(const k in D)if(D[k].rep)STRONG[D[k].rep]=k;   // débil → fuerte
 const UNDEAD=new Set(['esqueleto','espantapajaros','demonio','k5','b5','bruja']);
 const ONHIT={lobo:['bleed',.25,6000],jabali:['bleed',.2,6000],oso:['bleed',.25,6000],rana:['poison',.3,7000],bruja:['poison',.3,8000],lagarto:['poison',.25,7000],demonio:['burn',.3,4000],k5:['burn',.35,4000],
  yak:['slow',.3,4000],gigante:['slow',.3,4000],golem:['root',.2,2500],k3:['freeze',.25,3500],k2:['poison',.35,8000],oni:['weak',.3,6000],shinobi:['blind',.25,4000],k4:['blind',.25,4000],bandido:['bleed',.2,6000],orco:['vuln',.25,6000]};
 const now0=()=>performance.now(),isP=e=>e===P,H=e=>isP(e)?60:(e.d&&e.d.h)||40;
 const get=(e,k)=>{const s=e&&e.sts&&e.sts[k];return s&&s.t1>now0()?s:null};
 const has=(e,k)=>!!get(e,k),any=(e,...ks)=>ks.some(k=>has(e,k)),del=(e,...ks)=>{if(e&&e.sts)ks.forEach(k=>delete e.sts[k])};
 const mhOf=e=>isP(e)?maxHp():(e.mh||10),say=(e,t,c,dy,cls)=>{if(cls==='sts'&&(RD||performance.now()-(e._rs||0)<450))return;if(cls==='react')e._rs=performance.now();   /* tras una REACCIÓN su letrero manda: no se repite el del estado */   /* lo que contagia una reacción no repite su letrero: ya se ve el arco */
  try{const n0=performance.now();e._sy=(e._sy||[]).filter(v=>n0-v<750);const sl=e._sy.length;e._sy.push(n0);   /* PILA por enemigo: cada letrero reciente sube un escalón (no se pisan) */
  fText(t,c,e.x,e.y,H(e)+(dy||22)+sl*(cls==='react'?13:10),cls);if(cls){const n=performance.now(),k=cls==='react'?'react':'sts';if(n-(SAYT[k]||0)>140){SAYT[k]=n;snd(k)}}}catch(x){}},SAYT={},R3=()=>typeof window!=='undefined'&&window.R3D&&R3D.impact&&R3D.impact.react?R3D.impact:null,fx=(e,c,n)=>{if(R3())return;try{sp(e.x,e.y-H(e)*.5,c,n||10,90,70,-20)}catch(x){}};
 const V=(n,e,ts)=>{const I=R3();if(I)I.react(n,e,ts)};   // VFX 3D de la reacción (src/r3d/impact3d.js REACT + bodyfx3d.js); sin 3D quedan las chispas 2D de `fx`
 const near=(e,r,n)=>{const out=[];if(typeof M==='undefined')return out;const now=now0();for(const o of M){if(o===e||!o.d||(typeof alive==='function'&&!alive(o,now))||o.d.dmg===0&&!o.d.boss)continue;const d=Math.hypot(o.x-e.x,o.y-e.y);if(d<r)out.push([d,o])}return out.sort((a,b)=>a[0]-b[0]).slice(0,n||9).map(v=>v[1])};
 const hurt=(e,d,now,kind)=>{if(!(d>0))return;if(isP(e)){if(typeof INT!=='undefined'&&INT)return;P.hp-=d;splat(P.x,P.y,d,'#ff8a8a',26);HURT=now;if(P.hp<=0)die()}else if(typeof dotHit==='function')dotHit(e,d,now,kind||'shock')};
 let blindEl=null,blindK=0,RD=0;   // RD: profundidad de reacción (lo que una reacción contagia NO vuelve a reaccionar: sin bucles)
 const spread=f=>{RD++;try{f()}finally{RD--}};
 const STC_K=k=>typeof STC!=='undefined'&&STC[k]?k:D[k].kind;   // color del número de daño: el del estado (Incinerar ≠ Quemadura) si game.js lo define, si no el de su familia
 // REACCIONES entre estados (devuelve la clave a aplicar, o null si la reacción consume el estado nuevo)
 function react(e,k,now){if(RD)return k;
  if(k==='wet'){if(any(e,'burn','incinerate')){del(e,'burn','incinerate');say(e,'¡Apagado!','#9ad8ff',18,'react');V('apagado',e)}if(any(e,'chill')){del(e,'chill');say(e,'¡Congelado!','#bfeaff',18,'react');V('congelado',e);return 'freeze'}return k}
  if((k==='shock'||k==='overload')&&has(e,'wet')){del(e,'wet');say(e,'¡Electrocutado!','#fff07a',18,'react');fx(e,'#fff07a',18);hurt(e,Math.round(mhOf(e)*.08)+2,now,'shock');const ts=isP(e)?[]:near(e,C.chainR,3);V('electrocutado',e,ts);spread(()=>ts.forEach(o=>add(o,'shock')));return k}
  if((k==='chill'||k==='freeze')&&has(e,'wet')){del(e,'wet');say(e,'¡Congelado!','#bfeaff',18,'react');V('congelado',e);return 'freeze'}
  if((k==='chill'||k==='freeze')&&any(e,'burn','incinerate')||(k==='burn'||k==='incinerate')&&any(e,'chill','freeze')){del(e,'burn','incinerate','chill','freeze');say(e,'¡Vapor!','#e8f4ff',18,'react');fx(e,'#e8f4ff',16);V('vapor',e);add(e,'blind',{dur:1000});return null}
  if((k==='burn'||k==='incinerate')&&any(e,'poison','toxin')||(k==='poison'||k==='toxin')&&any(e,'burn','incinerate')){say(e,'¡Nube tóxica!','#b8ff4a',18,'react');fx(e,'#9ad84a',22);const ts=isP(e)?[]:near(e,C.nearR,5).filter(o=>!has(o,'poison')&&!has(o,'toxin'));V('nube',e,ts);spread(()=>ts.forEach(o=>add(o,'poison')));return k}
  if(k==='judgement'&&any(e,'curse','doom')){del(e,'curse','doom');say(e,'¡Purga!','#fff2c0',18,'react');fx(e,'#fff2c0',20);V('purga',e);hurt(e,Math.round(mhOf(e)*.15)+3,now,'holy');return null}
  return k}
 function add(e,k,o){o=o||{};if(!D[k]||!e)return false;const now=now0();if(isP(e)?P.hp<=0:(typeof alive==='function'&&!alive(e,now)))return false;
  if(!isP(e)&&e.d&&(e.d.dmg===0&&!e.d.boss)&&D[k].bad&&k!=='burn')return false;   // neutrales (gallinas, corderos) no sufren estados de control
  if(STRONG[k]&&has(e,STRONG[k]))k=STRONG[k];
  const pur=isP(e)&&D[k].bad&&typeof ENCH!=='undefined'?Math.min(.6,.15*ENCH.arm('purificacion')):0;   /* PURIFICACIÓN de la armadura: dura menos */   // la versión débil sobre la fuerte refresca la fuerte
  k=react(e,k,now);if(!k)return true;const d=D[k];
  if(d.hard&&has(e,'unbreak'))return false;
  e.stsImm=e.stsImm||{};if(e.stsImm[k]>now)return false;
  let dur=(o.dur||d.dur)*(1-pur);if(d.hard&&!isP(e)&&e.d&&(e.d.boss||e.elite))dur*=C.bossHard;
  e.sts=e.sts||{};let s=e.sts[k];const fresh=!s||s.t1<=now;
  let inh=0;if(d.rep&&e.sts[d.rep]){const w=e.sts[d.rep];if(w.t1>now)inh=w.n||0;delete e.sts[d.rep]}   // la fuerte hereda las cargas de la débil
  const v0=o.v!=null?o.v:d.dot?Math.max(1,Math.round((isP(e)?maxHp()*.03:e.mh*.04)*(d.vm||1))):d.shield?Math.max(1,Math.round(mhOf(e)*C.shield)):0,add1=Math.max(1,o.n||1);
  if(fresh){s=e.sts[k]={t0:now,t1:now+dur,v:v0,n:Math.min(d.stack||1,inh+add1),nx:now+(d.every||0),acc:0}}else{s.t0=now;s.t1=Math.max(s.t1,now+dur);s.v=Math.max(s.v,v0);if(d.stack>1)s.n=Math.min(d.stack,s.n+add1);if(d.shield)s.v=v0}
  if(d.noShield)delete e.sts.shield;
  if(d.toFreeze&&s.n>=d.toFreeze){delete e.sts[k];say(e,'¡Congelado!','#bfeaff',18,'react');V('congelado',e);return add(e,'freeze')}
  if(d.toDis&&s.n>=d.toDis){delete e.sts[k];say(e,'¡Disolución!','#e8ff6a',18,'react');V('disolucion',e);return add(e,'dissolve')}
  if(fresh){say(e,(d.ic?d.ic+' ':'')+d.n+(d.bad?'':'!'),d.col,14,'sts');
   if(d.froze&&!isP(e)){e.wind=null;e.tel=null;e.nt=Math.max(e.nt||0,s.t1+500)}
   if((d.fear)&&!isP(e)){e.wind=null;e.tel=null;e.dash=null}
   if(isP(e)&&k==='blind')try{log('🕶️ ¡Te ciegan! Tu campo de visión se reduce.')}catch(x){}
   if(isP(e)&&d.bad)try{log(d.ic+' <b>'+d.n+'</b>')}catch(x){}}
  return true}
 function clear(e,onlyBad){if(!e||!e.sts)return;for(const k in e.sts){if(!onlyBad||D[k].bad)delete e.sts[k]}}
 function list(e){const out=[],now=now0();if(!e||!e.sts)return out;for(const k in e.sts){const s=e.sts[k];if(s.t1>now)out.push({k,d:D[k],n:s.n,rem:s.t1-now,tot:s.t1-s.t0||1,v:s.v})}return out}
 const prod=(e,f)=>{let m=1;if(e&&e.sts){const now=now0();for(const k in e.sts){const s=e.sts[k],d=D[k];if(s.t1<=now)continue;if(d[f]!=null)m*=d[f];if(f==='spd'&&d.spdN)m*=Math.max(.2,1-d.spdN*s.n);if(f==='inM'&&d.inN)m*=1+d.inN*s.n}}return m};
 const frozen=e=>has(e,'freeze');
 const spd=e=>frozen(e)?0:prod(e,'spd'), out=e=>prod(e,'outM'), acc=e=>prod(e,'acc'), healM=e=>prod(e,'heal'), noMana=()=>any(P,'manaburn');
 // daño que RECIBE el jugador: vulnerable, la congelación se rompe con el golpe (crítico), el escudo absorbe; ESPINAS devuelve parte al atacante (`src`)
 function inP(d,now,src){if(!(d>0))return d;const e=P;if(!e.sts)return d;if(has(e,'freeze')){d=Math.round(d*C.critFreeze);thaw(e,now);say(P,'¡Crítico!','#bfeaff',10)}
  d=Math.max(1,Math.round(d*prod(e,'inM')));const th=get(e,'thorns'),ae=typeof ENCH!=='undefined'?ENCH.arm('espinas'):0;if((th||ae)&&src&&src!==P)hurt(src,Math.max(1,Math.round(d*((th?D.thorns.thorns:0)+.06*ae))),now,'thorns');   /* Espinas: estado + encantamiento de armadura */return shieldAbs(e,d)}
 // daño que RECIBE un enemigo (golpes del jugador): congelación (crítico), Juicio (crítico), Marcado (distancia), cargas de Corrosión/Desgarro, Disolución por golpe pesado,
 // cadena de Electrizado/Sobrecarga y acumulado de la Condena. Devuelve {d,crit}
 function inM(m,d,now,o){o=o||{};if(!(d>0)||!m.sts)return{d,crit:0};let crit=0;if(has(m,'freeze')){d=Math.round(d*C.critFreeze)+1;crit=1;thaw(m,now)}
  if(has(m,'judgement')){d=Math.round(d*(UNDEAD.has(m.d&&m.d.id)?C.judgeUnd:C.judge))+1;crit=1;delete m.sts.judgement;fx(m,'#fff2c0',12);V('juicio',m)}
  if(o.sk==='ra'&&has(m,'mark'))d*=D.mark.inR;
  if(o.heavy&&has(m,'corrode')){delete m.sts.corrode;say(m,'¡Disolución!','#e8ff6a',18,'react');V('disolucion',m);add(m,'dissolve')}
  d=Math.max(1,Math.round(d*prod(m,'inM')));d=shieldAbs(m,d);
  for(const k of ['overload','shock']){const s=get(m,k);if(!s)continue;const c=D[k];delete m.sts[k];if(Math.random()<c.cp){const ts=near(m,C.chainR,c.cn);V('cadena',m,ts);ts.forEach(t=>{hurt(t,Math.max(1,Math.round(d*c.cm)),now,'shock');fx(t,'#fff07a',8);if(c.cstun)t.nt=Math.max(t.nt||0,now)+c.cstun});say(m,'¡Cadena!','#fff07a',18,'react')}break}
  const dm=get(m,'doom');if(dm)dm.acc=(dm.acc||0)+d;
  return{d,crit}}
 function shieldAbs(e,d){const s=get(e,'shield');if(!s)return d;const ab=Math.min(s.v,d);s.v-=ab;d-=ab;say(e,ab?'Absorbido '+ab:'Escudo','#6ab0ff',30);if(s.v<=0)delete e.sts.shield;return d}
 function thaw(e,now){if(e.sts&&e.sts.freeze)delete e.sts.freeze;e.stsImm=e.stsImm||{};e.stsImm.freeze=now+C.immMs;if(R3())V('deshielo',e);else try{sp(e.x,e.y-H(e)/2,'#cfeaff',14,120,80,140)}catch(x){}}
 function onHit(m,now){const o=m&&m.d&&ONHIT[m.d.id];if(o&&Math.random()<o[1])add(P,o[0],{dur:o[2],v:Math.max(1,Math.round((m.dm||1)*.12))})}
 // al MORIR un enemigo: Incinerar salta a los cercanos (lo llama kill() de game.js)
 function onKill(m,now){if(!m||!m.sts)return;if(has(m,'incinerate')){const t=near(m,C.nearR,3);spread(()=>t.forEach(o=>add(o,'incinerate')));if(t.length){say(m,'¡Incinerar!','#ffd04a',18,'react');fx(m,'#ffd04a',20);V('incinerar',m,t)}}}
 function vision(dt){const t=has(P,'blind')?1:0;blindK+=(t-blindK)*Math.min(1,dt*(t?4:2.2));
  if(blindK<.01){if(blindEl&&blindEl.style.display!=='none')blindEl.style.display='none';return}
  if(!blindEl){blindEl=document.createElement('div');blindEl.id='blind';document.body.appendChild(blindEl)}
  blindEl.style.display='block';blindEl.style.setProperty('--r',(72-60*blindK).toFixed(1)+'vmin');blindEl.style.opacity=Math.min(1,blindK*1.4)}
 function tick(now,dt){vision(dt||.016);const all=[P];if(typeof M!=='undefined')for(const m of M)if(m.sts)all.push(m);
  for(const e of all){if(!e.sts)continue;const me=!isP(e);if(me&&typeof alive==='function'&&!alive(e,now)){e.sts=null;continue}if(!me&&P.hp<=0){e.sts=null;continue}
   for(const k in e.sts){const s=e.sts[k],d=D[k];
    if(now>=s.t1){delete e.sts[k];if(d.doom&&me&&alive(e,now)){const b=Math.round((s.acc||0)*d.doom)+2;say(e,'¡Condena!','#d070ff',18,'react');fx(e,'#d070ff',22);V('condena',e);dotHit(e,b,now,'doom');if(!alive(e,now)){e.sts=null;break}}continue}
    if(d.regen&&!me&&now>=s.nx){s.nx=now+d.every;if(P.hp<maxHp()){const h=Math.max(1,Math.round(maxHp()*.03*healM(P)));P.hp=Math.min(maxHp(),P.hp+h);splat(P.x,P.y,'+'+h,'#2f9a3a',30)}}
    if(d.dot&&now>=s.nx){s.nx=now+d.every;let dmg=Math.max(1,Math.round(s.v*s.n));
     if(d.move&&(me?now-(e.mv||0)<400:(P.mvg||P.anm)))dmg*=d.move;   // HEMORRAGIA: moverse la empeora
     if(me){dotHit(e,dmg,now,STC_K(k));if(!alive(e,now)){e.sts=null;break}}
     else if(!INT){if(typeof ENCH!=='undefined')dmg=Math.max(1,Math.round(dmg*(1-Math.min(.6,.12*ENCH.arm('resguardo')))));P.hp-=dmg;splat(P.x,P.y,dmg,d.col,26);HURT=now;if(P.hp<=0){die();break}}}}
   if(e.sts&&now>(e.stsFx||0)&&!(me&&R3())){   /* con 3D los estados los pinta R3D.aura/R3D.body; esto es el respaldo 2D */e.stsFx=now+420;for(const k in e.sts){const d=D[k];if(d.dot||d.froze||d.stack>1||k==='fury'||k==='root'||k==='wet'||k==='shock'||k==='overload'){try{sp(e.x,e.y-H(e)*.5,d.col,k==='burn'||k==='incinerate'?2:1,24,30,k==='burn'||k==='incinerate'||k==='fury'||k==='curse'?-30:20)}catch(x){}}}}}
 }
 return{D,C,ONHIT,UNDEAD,STRONG,add,has,clear,list,spd,out,acc,healM,noMana,inP,inM,frozen,onHit,onKill,tick,thaw}
})();
