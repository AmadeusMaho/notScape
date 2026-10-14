// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// FASE B · ORACIÓN Y ESTILOS DE COMBATE (13 oct 2026, lote B1). Se carga después de combat.js y antes de game.js; usa globales de game.js (S, L, P, M, toast, snd, log, gain, dirty…) solo en tiempo de llamada.
//  · Skill «Oración» (`pr`, la 13.ª): se entrena ENTERRANDO huesos (clic en el hueso del inventario) o ofreciéndolos en el ALTAR de la aldea (×2 de XP, los ofrece todos de golpe).
//  · PUNTOS DE ORACIÓN `PP` (orbe amarillo junto a los demás): máximo = nivel de Oración; cada oración activa los gasta por minuto (`dr`); se rellenan en el altar. Sin puntos se apagan todas.
//  · ORACIONES: protección (una a la vez: −40 % a los golpes normales del estilo y −100 % al golpe pesado telegrafado), mejoras de defensa / fuerza / precisión (una por grupo) y curación (regeneración).
//  · ESTILOS: cada enemigo ataca con un estilo (`m` cuerpo a cuerpo · `r` distancia · `g` magia; `MSTY`); algunos jefes lo CAMBIAN en cada golpe pesado (`MSW`): el color del círculo y el icono dicen cuál viene.
// Guardado: `S.pp` (puntos) y `S.pa` (activas), con valores por defecto (no hace falta subir `S.ver`).
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const BONEXP={hueso:20,hueso_g:60,hueso_a:200,hueso_r:500};
const PRS=[
 {id:'p_m',n:'Proteger del cuerpo a cuerpo',e:'🗡️',lv:8,g:'prot',st:'m',dr:12,d:'−40 % de daño de los golpes cuerpo a cuerpo y anula el golpe pesado de ese estilo.'},
 {id:'p_r',n:'Proteger de la distancia',e:'🏹',lv:14,g:'prot',st:'r',dr:12,d:'−40 % de daño de flechas y proyectiles y anula el golpe pesado de ese estilo.'},
 {id:'p_g',n:'Proteger de la magia',e:'✨',lv:20,g:'prot',st:'g',dr:12,d:'−40 % de daño de los hechizos y anula el golpe pesado de ese estilo.'},
 {id:'d1',n:'Piel de piedra',e:'🪨',lv:4,g:'def',def:.06,dr:5,d:'−6 % de daño recibido.'},
 {id:'d2',n:'Piel de hierro',e:'⛓️',lv:24,g:'def',def:.12,dr:9,d:'−12 % de daño recibido.'},
 {id:'d3',n:'Piel de acero',e:'🛡️',lv:52,g:'def',def:.18,dr:14,d:'−18 % de daño recibido.'},
 {id:'d4',n:'Piel de mitril',e:'💠',lv:80,g:'def',def:.24,dr:20,d:'−24 % de daño recibido.'},
 {id:'s1',n:'Fuerza de roble',e:'🌳',lv:7,g:'str',str:.06,dr:5,d:'+6 % de daño máximo.'},
 {id:'s2',n:'Fuerza de ébano',e:'🖤',lv:30,g:'str',str:.12,dr:9,d:'+12 % de daño máximo.'},
 {id:'s3',n:'Fuerza de baobab',e:'🌴',lv:58,g:'str',str:.18,dr:14,d:'+18 % de daño máximo.'},
 {id:'s4',n:'Fuerza del mundo',e:'🌍',lv:84,g:'str',str:.25,dr:22,d:'+25 % de daño máximo.'},
 {id:'a1',n:'Ojo de águila',e:'🦅',lv:9,g:'acc',acc:.05,dr:5,d:'+5 % de probabilidad de acertar.'},
 {id:'a2',n:'Ojo de halcón',e:'🦉',lv:34,g:'acc',acc:.09,dr:9,d:'+9 % de probabilidad de acertar.'},
 {id:'a3',n:'Ojo de búho',e:'👁️',lv:62,g:'acc',acc:.14,dr:15,d:'+14 % de probabilidad de acertar.'},
 {id:'h1',n:'Renovación',e:'🌱',lv:14,g:'reg',reg:.15,dr:6,d:'Recuperas 0,15 PV por segundo.'},
 {id:'h2',n:'Rejuvenecer',e:'🌿',lv:40,g:'reg',reg:.4,dr:12,d:'Recuperas 0,4 PV por segundo.'},
 {id:'h3',n:'Aliento vital',e:'💖',lv:70,g:'reg',reg:.9,dr:20,d:'Recuperas 0,9 PV por segundo.'}];
const PRB=Object.fromEntries(PRS.map(p=>[p.id,p])),PGN={prot:'Protección',def:'Defensa',str:'Fuerza',acc:'Precisión',reg:'Curación'};
// estilo de ataque de cada enemigo (lo que no está aquí = cuerpo a cuerpo) y jefes que CAMBIAN de estilo en cada golpe pesado
const MSTY={bandido:'r',k0:'r',esqueleto:'r',zorro:'g',shinobi:'r',k4:'r',bruja:'g',k2:'g',demonio:'g',b2:'g',b5:'g',lagarto:'g',b3:'g'};
const MSW={b2:['g','m'],k2:['g','m'],b3:['m','g'],b4:['m','r'],k4:['r','m'],b5:['g','m','r'],k5:['m','g']};
const SEMO={m:'🗡️',r:'🏹',g:'✨'},SCOL={m:'#ff4a2a',r:'#4ac84a',g:'#5a8aff'},SNAME={m:'cuerpo a cuerpo',r:'distancia',g:'magia'};
const mst=m=>m.st||(MSW[m.d.id]&&MSW[m.d.id][0])||MSTY[m.d.id]||'m';
// estado
let PP=null,PRA=[],BCD=0;
const prMax=()=>L('pr');
function prInit(){if(PP!==null)return;PP=S.pp==null?prMax():Math.min(S.pp,prMax());PRA=(S.pa||[]).filter(id=>PRB[id]&&L('pr')>=PRB[id].lv)}
const prSync=()=>{if(PP===null)return;S.pp=Math.round(PP*100)/100;S.pa=PRA.slice()};
const pry=k=>{prInit();let v=0;for(const id of PRA)if(PRB[id][k])v+=PRB[id][k];return v};
const prot=st=>{prInit();return PRA.some(id=>PRB[id].st===st)};
// daño que te hace un golpe de `m`: `heavy` = golpe pesado telegrafado (la protección del estilo lo anula del todo)
function prMod(m,d,heavy){const st=mst(m),p=prot(st);let k=(1-pry('def'))*armMul(st);if(p)k*=heavy?0:.6;return{d:Math.max(0,Math.round(d*k)),blocked:p}}
function prTog(id){prInit();const p=PRB[id];if(!p)return;if(L('pr')<p.lv){toast('🔒 Necesitas Oración nivel '+p.lv);snd('miss');return}
 if(PRA.includes(id)){PRA=PRA.filter(x=>x!==id);snd('miss')}else{if(PP<=0){toast('🙏 No te quedan puntos de oración: reza en un altar.');snd('miss');return}PRA=PRA.filter(x=>PRB[x].g!==p.g);PRA.push(id);snd('xp')}
 prSync();dirty=1}
function prTick(dt){prInit();if(PP>prMax())PP=prMax();if(PRA.length&&P.hp>0&&!INT){let d=0;for(const id of PRA)d+=PRB[id].dr/60*dt;PP-=d;if(PP<=0){PP=0;PRA=[];toast('🙏 Te quedaste sin puntos de oración.');snd('miss');dirty=1}}
 const r=pry('reg');if(r&&P.hp>0&&P.hp<maxHp())P.hp=Math.min(maxHp(),P.hp+r*dt)}
// enterrar un hueso del inventario (clic en el inventario)
function bury(i){const id=S.inv[i],x=BONEXP[id];if(!x)return false;const now=performance.now();if(now<BCD)return true;BCD=now+450;S.inv.splice(i,1);gain('pr',x,false);snd('xp');inc('bury');log('🙏 Entierras '+I[id][0]+' (+'+x+' XP de Oración).');dirty=1;return true}
// altar de la aldea: rellena los puntos y ofrece TODOS los huesos de la mochila con ×2 de XP
function prAltar(){prInit();if(P.dot){P.dot=null;log('🙏 El altar te limpia de tu herida.')}const was=PP;PP=prMax();let xp=0,n=0;for(const id in BONEXP){const c=count(id);if(c){xp+=BONEXP[id]*2*c;n+=c;S.inv=S.inv.filter(x=>x!==id)}}
 if(xp){gain('pr',xp,false);snd('lvl');toast('🙏 Ofrendas: '+n+' hueso'+(n>1?'s':'')+' → +'+xp+' XP de Oración (×2).<br>Puntos de oración restaurados.',3600);inc('bury')}
 else if(was<PP-.01){snd('xp');toast('🙏 Puntos de oración restaurados ('+prMax()+').<br>Trae huesos para ofrecerlos aquí con ×2 de XP.',3200)}
 else toast('🙏 Tus puntos de oración ya están completos.<br>Trae huesos para ofrecerlos aquí con ×2 de XP.',3200);
 prSync();dirty=1;save()}
// panel «Oraciones»
function prHTML(){prInit();const lv=L('pr'),xp=S.xp.pr,pc=lv>=99?100:(xp-XT[lv])/(XT[lv+1]-XT[lv])*100;let h=`<h2>🙏 Oración · nivel ${lv}</h2><div class="bar"><i style="width:${pc}%"></i></div><div class="hint" style="margin:3px 0 6px">Puntos: <b>${Math.floor(PP)}</b>/${prMax()} · ${PRA.length?'gastas '+PRA.reduce((s,id)=>s+PRB[id].dr,0)+'/min':'sin oraciones activas'}</div>`;
 let g0='';PRS.forEach(p=>{if(p.g!==g0){g0=p.g;h+=`<div class="hint" style="margin:8px 0 3px;color:var(--yl)">${PGN[g0]}${g0==='prot'?' (una a la vez)':''}</div>`}
  const on=PRA.includes(p.id),lock=lv<p.lv;h+=`<div class="row${lock?' cant':''}" style="${on?'outline:2px solid #ffd23a;border-radius:6px':''}"><span>${p.e} ${p.n}<br><span class="hint" style="margin:0">${lock?'🔒 Nivel '+p.lv:p.d+' · '+p.dr+' pts/min'}</span></span><button class="bt" onclick="prTog('${p.id}')">${on?'Quitar':'Activar'}</button></div>`});
 return h+'<div class="hint" style="margin-top:10px">Entierra huesos haciendo clic en ellos en la mochila (+XP) o ofrécelos en el <b>altar</b> de la aldea (×2 de XP y puntos al máximo). Los jefes y capitanes cambian de estilo: el círculo del golpe pesado muestra cuál viene (🗡️ rojo · 🏹 verde · ✨ azul).</div>'}

// ═══ LOTE B2 · TRIÁNGULO DE ARMADURAS ═══
// Cada pieza es de una CLASE: cuero (`r`, resiste distancia), malla/metal (`m`, resiste cuerpo a cuerpo) o túnica (`g`, resiste magia).
// La armadura de una clase es DÉBIL al estilo que la contrarresta: malla ← magia, cuero ← cuerpo a cuerpo, túnica ← distancia.
// Cada punto de defensa de una clase da 0,6 % de resistencia a su estilo (tope 25 %); cada punto de la clase débil suma la mitad como vulnerabilidad (tope 12 %).
// Metal = crafteado de metal (ar_/sh_/lg_/gl_ de barra); cuero = `ar_cuero`; botín `lt_*`: clase por familia (k%3: 0 malla · 1 cuero · 2 túnica); legendarios por su tipo.
const ACLS={m:'Malla',r:'Cuero',g:'Túnica'},AWEAK={m:'g',r:'m',g:'r'},ASLOTS=['a','s','l','g','h','f','c'];
function armCls(id){if(!id)return null;if(LOOT[id]){if(LOOT[id].s==='r'||LOOT[id].s==='n'||LOOT[id].s==='w'||LOOT[id].s==='m')return null;return['m','r','g'][LOOT[id].k%3]}
 if(/^ar_cuero/.test(id))return 'r';if(/^(ar|sh|lg|gl)_/.test(id)&&(AR[id]||SHL[id]||LGL[id]||GLL[id]))return 'm';return null}
function armDef(id){return AR[id]||SHL[id]||LGL[id]||GLL[id]||(LOOT[id]&&LOOT[id].st.def)||0}
function armPts(){const t={m:0,r:0,g:0};for(const sl of ASLOTS){const id=S.eq[sl],c=armCls(id);if(c)t[c]+=armDef(id)}return t}
// multiplicador de daño recibido de un estilo `st` por la armadura (1 = sin efecto)
function armMul(st){const p=armPts(),res=Math.min(.25,p[st]*.006),cw=Object.keys(AWEAK).find(c=>AWEAK[c]===st),weak=Math.min(.12,p[cw]*.003);return 1-res+weak}
function armInfo(){const m=x=>Math.round((1-armMul(x))*100);return '🗡️ '+m('m')+'% · 🏹 '+m('r')+'% · ✨ '+m('g')+'%'}

// ═══ LOTE B2 · PRECISIÓN CONTRA LA DEFENSA DE CADA ENEMIGO POR ESTILO ═══
// Multiplicador a TU probabilidad de acertar según el estilo con el que atacas (m cuerpo a cuerpo · r distancia · g magia); lo que no figura = 1. <1 resiste ese estilo, >1 es débil a él.
const DFP={esqueleto:{m:.85,r:.8,g:1.2},golem:{m:.85,r:.9,g:1.2},k5:{m:.85,r:.9,g:1.2},b5:{m:1.1,r:1,g:.85},lagarto:{m:1.1,g:.85},demonio:{m:1.1,g:.85},bruja:{m:1.15,r:1.1,g:.9},k2:{m:1.15,r:1.1,g:.9},b2:{m:1.1,g:.9},
 gigante:{m:.9,g:1.15},k3:{m:.9,g:1.15},b3:{m:.9,g:1.15},oni:{m:.95,r:.85,g:1.1},shinobi:{m:.95,r:.8,g:1.1},k4:{m:.95,r:.8,g:1.1},b4:{m:.95,r:.85,g:1.1},
 oso:{r:1.1},lobo:{r:1.1},jabali:{r:1.1},yak:{r:1.1},k1:{r:1.1},b1:{r:1.1},ogro:{r:1.1},orco:{r:1.1},b0:{r:1.1}};
const dfp=m=>((DFP[m.d.id]||{})[wtype()])||1;
const DFPSEEN={};
function dfpHint(m){const t=DFP[m.d.id];if(!t||DFPSEEN[m.d.id])return;DFPSEEN[m.d.id]=1;const w=Object.keys(t).filter(k=>t[k]>1).map(k=>SEMO[k]+' '+SNAME[k]),r=Object.keys(t).filter(k=>t[k]<1).map(k=>SEMO[k]+' '+SNAME[k]);
 if(w.length||r.length)log('🔍 <b>'+m.d.n+'</b>'+(w.length?' · débil a '+w.join(', '):'')+(r.length?' · resiste '+r.join(', '):'')+'.')}
