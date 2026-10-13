// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// COMBATE ESTILO OSRS (13 oct 2026, reemplaza al prototipo de habilidades con barra 1-5, que se ELIMINÓ por decisión del dueño).
//  · El combate base sigue siendo automático. La ENERGÍA (la barra que antes gastaba correr; ahora correr es gratis y más lento) es la barra de ATAQUE ESPECIAL del arma, igual que en OSRS:
//    100 máx., +10 % cada 20 s (`ENREG` en game.js). Se «arma» con la tecla V o el botón #specb y el SIGUIENTE golpe automático pasa a ser el especial (si hay energía suficiente).
//  · Un especial por tipo de arma (el tier del arma ya escala el daño vía maxHit()):
//      cuerpo a cuerpo/puños → «Doble filo» (25 %): dos golpes seguidos con +30 % de precisión y daño mínimo del 45 % del máximo.
//      arco → «Doble disparo» (55 %): dos flechas, +30 % de precisión.
//      báculo → «Estallido arcano» (50 %): un hechizo que no falla, sin maná ni runas, hasta un 60 % más fuerte.
//  · AMENAZA: jefes (d.boss 1), capitanes (d.boss 2) y los «Alfa»/«Cabecilla» de los encargos (m.elite) preparan un GOLPE PESADO TELEGRAFADO: se quedan quietos 1,2 s con un círculo rojo que se llena
//    en el suelo y un «!»; al terminar, si sigues dentro del círculo, recibes 2,2 × su daño máximo. Se esquiva SALIENDO del círculo (futuro: oración de protección, ver AGENTS.md «Plan de oraciones»).
//    Los enemigos comunes no tienen esto: el combate corriente sigue siendo relajado.
// Usa globales de game.js (S, EN, M, P, A, PJ, hitM, maxHit, hitChance, wtype, splat, snd, toast…) solo en tiempo de llamada.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const SPECS={m:{n:'Doble filo',cost:25,e:'🗡️',d:'Dos golpes seguidos, más precisos.'},r:{n:'Doble disparo',cost:55,e:'🏹',d:'Dos flechas seguidas, más precisas.'},g:{n:'Estallido arcano',cost:50,e:'🔮',d:'Un hechizo que no falla ni gasta runas, hasta +60 % de daño.'}};
let SPECON=0,specKey='',specLt=0;
const specNow=()=>SPECS[wtype()];
function specTog(){const s=specNow();if(!s||P.hp<=0||!inCombat(performance.now()))return;if(!SPECON&&EN<s.cost){toast('⚡ Energía especial: '+Math.floor(EN)+' % (hace falta '+s.cost+' %)');snd('miss');return}SPECON=SPECON?0:1;snd(SPECON?'xp':'miss');specKey='';specTick(performance.now(),1)}
function specTry(m,now,wt){if(!SPECON)return false;const s=SPECS[wt];if(!s)return false;SPECON=0;specKey='';if(EN<s.cost){toast('⚡ Te falta energía especial.');return false}EN-=s.cost;specFire(m,now,wt,s);return true}
function specFire(m,now,wt,s){const mx=maxHit(),acc=Math.min(1,hitChance(m)+.3);P.pjM=m;P.pj=now+4800;P.sp={t0:now,wt,d:wt==='m'?520:wt==='r'?560:620};P.f=m.x-m.y>=P.x-P.y?1:-1;log('⚡ <b>'+s.n+'</b>');sp(P.x,P.y-16,'#ffd23a',10,70,60,120);
 if(wt==='m'){HFX.push({k:wColor()?'thrust':'punch',x:P.x,y:P.y,tx:m.x,ty:m.y,th:m.d.h/2,t0:now,d:300});
  for(let h=0;h<2;h++){const d=Math.random()<acc?R(Math.ceil(mx*.45),mx):0,t1=now+70+h*170;PJ.push({x:P.x,y:P.y,sh:14,tx:m.x,ty:m.y,th:m.d.h/2,t0:t1+9999,t1,m,d,wt:'m',sk:'cb',mxv:mx,nodraw:1})}snd('hit')}
 else if(wt==='r'){for(let h=0;h<2;h++){const d=Math.random()<acc?R(Math.ceil(mx*.45),mx):0,t0=now+h*150;PJ.push({x:P.x,y:P.y,sh:14,tx:m.x,ty:m.y,th:m.d.h/2,t0,t1:t0+170,m,d,wt:'r',sk:'ra',mxv:mx,hv:0})}snd('bow')}
 else{const d=Math.max(1,Math.round(mx*1.6*(.7+Math.random()*.3)));PJ.push({x:P.x,y:P.y,sh:14,tx:m.x,ty:m.y,th:m.d.h/2,t0:now,t1:now+240,m,d,wt:'g',sk:'mg',mxv:mx*1.6,col:'#c8a0ff',hv:1});snd('magic');inc('cast');HFX.push({k:'star',tx:m.x,ty:m.y,th:m.d.h/2,t0:now+240,d:420});sp(m.x,m.y-m.d.h/2,'#c8a0ff',14,110,80,160)}
 dirty=1}
// botón del especial (DOM): nombre, coste y energía; se ilumina cuando está armado
const inCombat=now=>!INT&&((A&&A.ty==='f')||M.some(m=>m.hunt&&alive(m,now)));   // el botón del especial solo se ve en combate
function specTick(now,force){if(now-specLt<90&&!force)return;specLt=now;const el=document.getElementById('specb');if(!el)return;const s=specNow();if(!s||!inCombat(now)){el.hidden=true;specKey='';if(SPECON)SPECON=0;return}
 const can=EN>=s.cost,key=wtype()+'|'+SPECON+'|'+(can?1:0)+'|'+Math.floor(EN);if(key===specKey)return;specKey=key;el.hidden=false;el.className=(SPECON?'on ':'')+(can?'':'lack');
 el.innerHTML=`<i>V</i><span class="se">${s.e}</span><span class="sn">${s.n}</span><span class="sc">${s.cost} %</span><b style="width:${Math.min(100,EN)}%"></b>`;el.title=s.d+' Energía especial: '+Math.floor(EN)+' %. Tecla V.';
 if(SPECON&&!can)SPECON=0}
// ── golpe pesado telegrafado ──
const telOn=m=>m.d.boss||m.elite;
function telStart(m,now){m.tel={t0:now,t1:now+1200,r:m.d.boss===1?86:m.d.boss===2?74:66};m.tn=now+(m.d.boss===1?7000:m.d.boss===2?8500:9500);m.nt=now+1600}
function telUpd(m,now){if(!m.tel)return false;m.f=P.x-m.x-(P.y-m.y)>=0?1:-1;if(now<m.tel.t1)return true;
 const dp=Math.hypot(P.x-m.x,P.y-m.y),r=m.tel.r;m.tel=null;m.nt=now+1200;snd('thunder');SHK=now+180;sp(m.x,m.y-4,'#ff6a3a',14,r*1.4,40,100);
 if(dp<=r&&P.hp>0){const d=Math.max(1,Math.round((m.dm||1)*2.2));P.hp-=d;splat(P.x,P.y,d,'#d4261c',26);snd('hurt');HURT=now;P.pjM=m;P.pj=now+4800;if(P.hp<=0)die()}
 else if(P.hp>0)log('Esquivaste el golpe pesado de '+m.d.n+'.');return true}
function drawTel(now){const s=ISO.scale();for(const m of M){if(!m.tel)continue;const u=Math.min(1,(now-m.tel.t0)/1200),r=m.tel.r;ctx.save();ctx.setTransform(1,0,0,1,0,0);
  const ring=k=>{ctx.beginPath();for(let i=0;i<=28;i++){const a=i/28*6.283,q=ISO.toCanvas(m.x+Math.cos(a)*r*k,m.y+Math.sin(a)*r*k,TER.standZ(m.x,m.y));i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)}ctx.closePath()};
  ring(1);ctx.globalAlpha=.18+.12*Math.sin(now/90);ctx.fillStyle='#ff2a1a';ctx.fill();ctx.globalAlpha=.85;ctx.strokeStyle='#ff4a2a';ctx.lineWidth=Math.max(2,s*1.4);ctx.stroke();
  ring(u);ctx.globalAlpha=.32;ctx.fillStyle='#ff6a2a';ctx.fill();
  const c=ISO.toCanvas(m.x,m.y,TER.standZ(m.x,m.y)),k2=SPR*s;ctx.globalAlpha=1;ctx.font='bold '+Math.round(14*s+8)+'px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.strokeStyle='#8a1208';ctx.lineWidth=3;const ty=c.y-((m.d.h||20)+22)*k2;ctx.strokeText('!',c.x,ty);ctx.fillText('!',c.x,ty);ctx.restore()}}
