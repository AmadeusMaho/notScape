// NotScape · ESTADOS ALTERADOS (22 oct 2026; Fase 2). Motor ÚNICO para el jugador (`P`) y los enemigos (`m` de `M`). Se carga tras combat.js y antes de game.js; solo usa globales del juego en tiempo de llamada.
// Todo es DATOS (`D`): añadir un estado = una fila en `D` (+ su efecto en `mul/inc` si usa un número nuevo). Estados: sangrado, veneno, quemadura (daño por tiempo), ralentización, congelación, vulnerable, debilitar,
// raíces, ceguera, escudo y furia. Se guardan en `e.sts = {clave:{t0,t1,v,n,nx}}` con el reloj REAL (`performance.now()`); no se persisten en la partida (se limpian al morir).
// API: STS.add(e,k,{dur,v,src}) · has · clear(e,soloMalos) · list(e) · spd(e) · out(e) (daño que HACE e) · acc(e) · inP(d,now) (daño que RECIBE el jugador) · inM(m,d,now) (daño que RECIBE un enemigo) · frozen(e) · tick(now,dt).
// Fuentes hoy: bola de fuego (quemadura), procs de sangrado, golpes de jefes/criaturas (`ONHIT`), y a mano: `STS.add(P,'freeze')`. Estados ELEMENTALES futuros (rayo/descarga, ácido, sombra…): filas nuevas en `D`.
const STS=(()=>{
 const C={critFreeze:1.75,vuln:1.15,weak:.75,fury:1.3,furySpd:1.1,slow:.65,blind:.4,bossHard:.4,immMs:3500,shield:.25};   // ajustables
 // dot: daño por tick cada `every` ms · st: clave de color del HUD (data-st de la barra de vida) · hard: CC duro (los jefes lo sufren `C.bossHard` del tiempo)
 const D={
  bleed:{n:'Sangrado',ic:'🩸',col:'#d4261c',bad:1,dur:6000,dot:1,every:1000,stack:3,st:'sangrado',kind:'bleed'},
  poison:{n:'Veneno',ic:'☠️',col:'#6ad04a',bad:1,dur:8000,dot:1,every:1000,stack:3,st:'veneno',kind:'poison'},
  burn:{n:'Quemadura',ic:'🔥',col:'#ff8a2a',bad:1,dur:4000,dot:1,every:800,stack:1,st:'quemadura',kind:'burn'},
  slow:{n:'Ralentización',ic:'🐌',col:'#7ad0ff',bad:1,dur:5000,spd:C.slow},
  freeze:{n:'Congelación',ic:'❄️',col:'#bfeaff',bad:1,dur:5000,hard:1,froze:1},
  vuln:{n:'Vulnerable',ic:'💔',col:'#e86a8a',bad:1,dur:8000,inM:C.vuln},
  weak:{n:'Debilitado',ic:'🪶',col:'#a8a090',bad:1,dur:8000,outM:C.weak},
  root:{n:'Raíces',ic:'🌿',col:'#6aa84a',bad:1,dur:3000,hard:1,spd:0},
  blind:{n:'Ceguera',ic:'🕶️',col:'#b8a0e0',bad:1,dur:6000,hard:1,acc:C.blind},
  shield:{n:'Escudo',ic:'🛡️',col:'#6ab0ff',dur:12000,shield:1},
  fury:{n:'Furia',ic:'💢',col:'#ff5a3a',dur:10000,outM:C.fury,spd:C.furySpd}
 };
 // criaturas que infligen un estado al GOLPEAR al jugador: id → [estado, probabilidad 0..1, duración ms]
 const ONHIT={lobo:['bleed',.25,6000],jabali:['bleed',.2,6000],oso:['bleed',.25,6000],rana:['poison',.3,7000],bruja:['poison',.3,8000],lagarto:['poison',.25,7000],demonio:['burn',.3,4000],k5:['burn',.35,4000],
  yak:['slow',.3,4000],gigante:['slow',.3,4000],golem:['root',.2,2500],k3:['freeze',.25,3500],k2:['poison',.35,8000],oni:['weak',.3,6000],shinobi:['blind',.25,4000],k4:['blind',.25,4000],bandido:['bleed',.2,6000],orco:['vuln',.25,6000]};
 const now0=()=>performance.now(),isP=e=>e===P,H=e=>isP(e)?60:(e.d&&e.d.h)||40;
 const get=(e,k)=>{const s=e&&e.sts&&e.sts[k];return s&&s.t1>now0()?s:null};
 let blindEl=null,blindK=0,pfx=0;
 function add(e,k,o){o=o||{};const d=D[k];if(!d||!e)return false;const now=now0();if(isP(e)?P.hp<=0:(typeof alive==='function'&&!alive(e,now)))return false;
  if(!isP(e)&&e.d&&(e.d.dmg===0&&!e.d.boss)&&d.bad&&k!=='burn')return false;   // neutrales (gallinas, corderos) no sufren estados de control
  e.stsImm=e.stsImm||{};if(e.stsImm[k]>now)return false;
  let dur=o.dur||d.dur;if(d.hard&&!isP(e)&&e.d&&(e.d.boss||e.elite))dur*=C.bossHard;
  e.sts=e.sts||{};const s=e.sts[k],fresh=!s||s.t1<=now;
  const v0=o.v!=null?o.v:d.dot?Math.max(1,isP(e)?Math.round(maxHp()*.03):Math.round(e.mh*.04)):d.shield?Math.max(1,Math.round((isP(e)?maxHp():e.mh)*C.shield)):0;
  if(fresh)e.sts[k]={t0:now,t1:now+dur,v:v0,n:1,nx:now+(d.every||0)};else{s.t0=now;s.t1=Math.max(s.t1,now+dur);s.v=Math.max(s.v,v0);if(d.stack>1)s.n=Math.min(d.stack,s.n+1);if(d.shield)s.v=v0}
  if(fresh){try{fText(d.n+(d.bad?'':'!'),d.col,e.x,e.y,H(e)+14)}catch(x){}
   if(d.froze&&!isP(e)){e.wind=null;e.tel=null;e.nt=Math.max(e.nt||0,e.sts[k].t1+500)}
   if(isP(e)&&k==='blind')try{log('🕶️ ¡Te ciegan! Tu campo de visión se reduce.')}catch(x){}
   if(isP(e)&&d.bad)try{log(d.ic+' <b>'+d.n+'</b>')}catch(x){}}
  return true}
 const has=(e,k)=>!!get(e,k);
 function clear(e,onlyBad){if(!e||!e.sts)return;for(const k in e.sts){if(!onlyBad||D[k].bad)delete e.sts[k]}}
 function list(e){const out=[],now=now0();if(!e||!e.sts)return out;for(const k in e.sts){const s=e.sts[k];if(s.t1>now)out.push({k,d:D[k],n:s.n,rem:s.t1-now,tot:s.t1-s.t0||1,v:s.v})}return out}
 const prod=(e,f)=>{let m=1;if(e&&e.sts){const now=now0();for(const k in e.sts){const s=e.sts[k];if(s.t1>now&&D[k][f]!=null)m*=D[k][f]}}return m};
 const frozen=e=>has(e,'freeze');
 const spd=e=>frozen(e)?0:prod(e,'spd'), out=e=>prod(e,'outM'), acc=e=>prod(e,'acc');
 // daño que RECIBE el jugador: vulnerable +15 %, la congelación se rompe con el golpe (y ese golpe es crítico), el escudo absorbe primero
 function inP(d,now){if(!(d>0))return d;const e=P;if(!e.sts)return d;if(has(e,'freeze')){d=Math.round(d*C.critFreeze);thaw(e,now);try{fText('¡Crítico!','#bfeaff',P.x,P.y,70)}catch(x){}}
  d=Math.max(1,Math.round(d*prod(e,'inM')));return shieldAbs(e,d)}
 // daño que RECIBE un enemigo (solo golpes del jugador, no DoT): ver `hitM`. Devuelve {d,crit}
 function inM(m,d,now){if(!(d>0)||!m.sts)return{d,crit:0};let crit=0;if(has(m,'freeze')){d=Math.round(d*C.critFreeze)+1;crit=1;thaw(m,now)}
  d=Math.max(1,Math.round(d*prod(m,'inM')));return{d:shieldAbs(m,d),crit}}
 function shieldAbs(e,d){const s=get(e,'shield');if(!s)return d;const ab=Math.min(s.v,d);s.v-=ab;d-=ab;try{fText(ab?'Absorbido '+ab:'Escudo','#6ab0ff',e.x,e.y,H(e)+30)}catch(x){}if(s.v<=0)delete e.sts.shield;return d}
 function thaw(e,now){if(e.sts&&e.sts.freeze)delete e.sts.freeze;e.stsImm=e.stsImm||{};e.stsImm.freeze=now+C.immMs;try{sp(e.x,e.y-H(e)/2,'#cfeaff',14,120,80,140)}catch(x){}}
 // el jugador GOLPEADO por `m` puede sufrir su estado (monHit/telegrafiados)
 function onHit(m,now){const o=m&&m.d&&ONHIT[m.d.id];if(o&&Math.random()<o[1])add(P,o[0],{dur:o[2],v:Math.max(1,Math.round((m.dm||1)*.12))})}
 function vision(dt){const t=has(P,'blind')?1:0;blindK+=(t-blindK)*Math.min(1,dt*(t?4:2.2));
  if(blindK<.01){if(blindEl&&blindEl.style.display!=='none')blindEl.style.display='none';return}
  if(!blindEl){blindEl=document.createElement('div');blindEl.id='blind';document.body.appendChild(blindEl)}
  blindEl.style.display='block';blindEl.style.setProperty('--r',(72-60*blindK).toFixed(1)+'vmin');blindEl.style.opacity=Math.min(1,blindK*1.4)}
 function tick(now,dt){vision(dt||.016);const all=[P];if(typeof M!=='undefined')for(const m of M)if(m.sts)all.push(m);
  for(const e of all){if(!e.sts)continue;const me=!isP(e);if(me&&typeof alive==='function'&&!alive(e,now)){e.sts=null;continue}if(!me&&P.hp<=0){e.sts=null;continue}
   for(const k in e.sts){const s=e.sts[k],d=D[k];if(now>=s.t1){delete e.sts[k];continue}
    if(d.dot&&now>=s.nx){s.nx=now+d.every;const dmg=Math.max(1,Math.round(s.v*s.n));
     if(me){dotHit(e,dmg,now,d.kind);if(!alive(e,now)){e.sts=null;break}}
     else if(!INT){P.hp-=dmg;splat(P.x,P.y,dmg,d.col,26);HURT=now;if(P.hp<=0){die();break}}}}
   if(e.sts&&now>(e.stsFx||0)){e.stsFx=now+420;for(const k in e.sts){const d=D[k];if(d.dot||d.froze||k==='fury'||k==='root'){try{sp(e.x,e.y-H(e)*.5,d.col,k==='burn'?2:1,24,30,k==='burn'||k==='fury'?-30:20)}catch(x){}}}}}
 }
 return{D,C,ONHIT,add,has,clear,list,spd,out,acc,inP,inM,frozen,onHit,tick,thaw}
})();
