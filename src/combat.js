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
const SPECS={m:{n:'Doble filo',cost:25,e:'🗡️',d:'Dos golpes seguidos, más precisos.'},r:{n:'Doble disparo',cost:55,e:'🏹',d:'Dos flechas seguidas, más precisas.'},g:{n:'Estallido arcano',cost:50,e:'🔮',d:'Un hechizo que no falla ni gasta runas, hasta +60 % de daño.'},
 // lote B2: variantes por FAMILIA de arma (daga, mandoble, ballesta, cetro); el resto usa el de su tipo
 dg:{n:'Danza de dagas',cost:30,e:'🗡️',v:'dg',d:'Tres cortes rápidos, más precisos.'},gr:{n:'Tajo demoledor',cost:45,e:'⚔️',v:'gr',d:'Un tajo que no falla, +70 % de daño.'},xb:{n:'Virote perforante',cost:45,e:'🏹',v:'xb',d:'Un virote que no falla, +60 % de daño.'},sc:{n:'Succión arcana',cost:45,e:'💜',v:'sc',d:'Hechizo que no falla ni gasta runas; te cura la mitad del daño.'}};
const specId=()=>{const k=wKind();return {dagger:'dg',great:'gr',xbow:'xb',scepter:'sc'}[k]||wtype()};
let SPECON=0,specKey='',specLt=0;
const specNow=()=>null;   // 20 oct 2026 (dueño): ataques especiales («Doble filo», etc.) DESACTIVADOS hasta el rework de habilidades; el botón #specb y la tecla V quedan inertes. Para reactivarlos: `SPECS[specId()]`.
function specTog(){const s=specNow();if(!s||P.hp<=0||!inCombat(performance.now()))return;if(!SPECON&&EN<s.cost){toast('⚡ Energía especial: '+Math.floor(EN)+' % (hace falta '+s.cost+' %)');snd('miss');return}SPECON=SPECON?0:1;snd(SPECON?'xp':'miss');specKey='';specTick(performance.now(),1)}
function specTry(m,now,wt){if(!SPECON)return false;const s=SPECS[specId()];if(!s)return false;SPECON=0;specKey='';if(EN<s.cost){toast('⚡ Te falta energía especial.');return false}EN-=s.cost;specFire(m,now,wt,s);inc('spec');return true}
function specFire(m,now,wt,s){const mx=maxHit(),acc=Math.min(1,hitChance(m)+.3);P.pjM=m;P.pj=now+4800;P.sp={t0:now,wt,d:wt==='m'?520:wt==='r'?560:620};P.f=m.x-m.y>=P.x-P.y?1:-1;log('⚡ <b>'+s.n+'</b>');sp(P.x,P.y-16,'#e8cf94',10,70,60,120);
 if(s.v){specVar(m,now,wt,s,mx,acc);dirty=1;return}
 if(wt==='m'){HFX.push({k:wColor()?'thrust':'punch',x:P.x,y:P.y,tx:m.x,ty:m.y,th:m.d.h/2,t0:now,d:300});
  for(let h=0;h<2;h++){const d=Math.random()<acc?R(Math.ceil(mx*.45),mx):0,t1=now+70+h*170;PJ.push({x:P.x,y:P.y,sh:14,tx:m.x,ty:m.y,th:m.d.h/2,t0:t1+9999,t1,m,d,wt:'m',sk:'cb',mxv:mx,nodraw:1})}snd('hit')}
 else if(wt==='r'){for(let h=0;h<2;h++){const d=Math.random()<acc?R(Math.ceil(mx*.45),mx):0,t0=now+h*150;PJ.push({x:P.x,y:P.y,sh:14,tx:m.x,ty:m.y,th:m.d.h/2,t0,t1:t0+170,m,d,wt:'r',sk:'ra',mxv:mx,hv:0})}snd('bow')}
 else{const d=Math.max(1,Math.round(mx*1.6*(.7+Math.random()*.3)));PJ.push({x:P.x,y:P.y,sh:14,tx:m.x,ty:m.y,th:m.d.h/2,t0:now,t1:now+240,m,d,wt:'g',sk:'mg',mxv:mx*1.6,col:'#c8a0ff',hv:1});snd('magic');inc('cast');HFX.push({k:'star',tx:m.x,ty:m.y,th:m.d.h/2,t0:now+240,d:420});sp(m.x,m.y-m.d.h/2,'#c8a0ff',14,110,80,160)}
 dirty=1}
function specVar(m,now,wt,s,mx,acc){const pj=(d,t1,o)=>PJ.push(Object.assign({x:P.x,y:P.y,sh:14,tx:m.x,ty:m.y,th:m.d.h/2,t0:t1+9999,t1,m,d,wt,sk:wt==='m'?'cb':wt==='r'?'ra':'mg',mxv:mx,nodraw:1},o||{}));
 if(s.v==='dg'){HFX.push({k:'thrust',x:P.x,y:P.y,tx:m.x,ty:m.y,th:m.d.h/2,t0:now,d:300});for(let h=0;h<3;h++)pj(Math.random()<Math.min(1,acc+.05)?R(Math.ceil(mx*.3),Math.ceil(mx*.85)):0,now+60+h*130);snd('hit')}
 else if(s.v==='gr'){HFX.push({k:'star',tx:m.x,ty:m.y,th:m.d.h/2,t0:now+260,d:420});pj(Math.max(1,Math.round(mx*1.7*(.85+Math.random()*.15))),now+260,{mxv:mx*1.7});snd('hit');SHK=now+280}
 else if(s.v==='xb'){PJ.push({x:P.x,y:P.y,sh:14,tx:m.x,ty:m.y,th:m.d.h/2,t0:now,t1:now+160,m,d:Math.max(1,Math.round(mx*1.6*(.85+Math.random()*.15))),wt:'r',sk:'ra',mxv:mx*1.6,hv:1});snd('bow')}
 else{const d=Math.max(1,Math.round(mx*1.3*(.75+Math.random()*.25)));PJ.push({x:P.x,y:P.y,sh:14,tx:m.x,ty:m.y,th:m.d.h/2,t0:now,t1:now+240,m,d,wt:'g',sk:'mg',mxv:mx*1.3,col:'#e07aff',hv:1});snd('magic');inc('cast');const h=Math.min(Math.max(0,maxHp()-P.hp),Math.max(1,Math.round(d/2)));if(h>0){P.hp+=h;splat(P.x,P.y,'+'+h,'#2f9a3a',30)}sp(m.x,m.y-m.d.h/2,'#e07aff',14,110,80,160)}}
// botón del especial (DOM): nombre, coste y energía; se ilumina cuando está armado
const inCombat=now=>!INT&&((A&&A.ty==='f')||M.some(m=>m.hunt&&alive(m,now)));   // el botón del especial solo se ve en combate
let arLast=-1;
function specTick(now,force){if(now-specLt<90&&!force)return;specLt=now;{const a=S.ar!==0?1:0;if(a!==arLast){arLast=a;arPaint()}}const el=document.getElementById('specb');if(!el)return;const s=specNow();if(!s||!inCombat(now)){el.hidden=true;specKey='';if(SPECON)SPECON=0;return}
 const can=EN>=s.cost,key=specId()+'|'+SPECON+'|'+(can?1:0)+'|'+Math.floor(EN);if(key===specKey)return;specKey=key;el.hidden=false;el.className=(SPECON?'on ':'')+(can?'':'lack');
 el.innerHTML=`<i>V</i><span class="se">${s.e}</span><span class="sn">${s.n}</span><span class="sc">${s.cost} %</span><b style="width:${Math.min(100,EN)}%"></b>`;el.title=s.d+' Energía especial: '+Math.floor(EN)+' %. Tecla V.';
 if(SPECON&&!can)SPECON=0}
// ── golpe pesado telegrafado ──
const telOn=m=>m.d.boss||m.elite;
function telStart(m,now){const sw=MSW[m.d.id];if(sw){const j=((sw.indexOf(mst(m))+1)%sw.length);m.st=sw[j];if(!m.stl||now-m.stl>2500){m.stl=now;log(SEMO[m.st]+' <b>'+m.d.n+'</b> prepara un golpe de '+SNAME[m.st]+'.')}}
 const cyc=['slam'];if(bmech(m,'met'))cyc.push('met');if(bmech(m,'nov'))cyc.push('nov');const kd=cyc[(m.tc=(m.tc||0)+1)%cyc.length],bs=m.d.boss===1?86:m.d.boss===2?74:66;
 m.tel=kd==='met'?{t0:now,t1:now+1400,r:62,cx:P.x,cy:P.y,f:2.4,k:'met'}:kd==='nov'?{t0:now,t1:now+1500,r:112,f:1.7,k:'nov'}:{t0:now,t1:now+1200,r:bs,f:2.2,k:'slam'};
 if(kd!=='slam'&&(!m.stl2||now-m.stl2>2500)){m.stl2=now;log(kd==='met'?'☄️ <b>'+m.d.n+'</b> marca el suelo bajo tus pies: ¡muévete!':'💥 <b>'+m.d.n+'</b> carga una onda expansiva: ¡aléjate!')}
 m.tn=now+(m.d.boss===1?7000:m.d.boss===2?8500:9500)*(m.asx||1);m.nt=now+1600}
function telUpd(m,now){if(!m.tel)return false;m.f=P.x-m.x-(P.y-m.y)>=0?1:-1;if(now<m.tel.t1)return true;
 const T=m.tel,cx=T.cx==null?m.x:T.cx,cy=T.cy==null?m.y:T.cy,dp=Math.hypot(P.x-cx,P.y-cy),r=T.r;m.tel=null;m.nt=now+1200*(m.asx||1);snd('thunder');SHK=now+180;sp(cx,cy-4,'#ff6a3a',14,r*1.4,40,100);
 if(dp<=r&&P.hp>0&&!dashInv()){const g0=guardHit(m,Math.max(1,Math.round((m.dm||1)*(T.f||2.2))),now,1);if(g0.kind&&g0.d<=0)return true;const q=prMod(m,g0.d,1),d=q.d;if(q.blocked&&!d){splat(P.x,P.y,0,'#6ab0ff',26);log('🙏 Tu oración absorbió el golpe pesado de '+m.d.n+'.');return true}P.hp-=d;splat(P.x,P.y,d,q.blocked?'#6ab0ff':'#d4261c',26);snd('hurt');HURT=now;P.pjM=m;P.pj=now+4800;bossHit(m,d,now);if(P.hp<=0)die()}
 else if(P.hp>0){if(dashInv()&&dp<=r*1.15)pdCheck(m,now);log('Esquivaste el golpe pesado de '+m.d.n+'.');if(dp<=r)splat(P.x,P.y,0,'#e8cf94',26)}return true}
function drawTel(now){const s=ISO.scale();for(const m of M){if(!m.tel)continue;const u=Math.min(1,(now-m.tel.t0)/1200),r=m.tel.r,cx=m.tel.cx==null?m.x:m.tel.cx,cy=m.tel.cy==null?m.y:m.tel.cy;
  try{R3D.spell.tele(m.tel,cx,cy,0,r,7,u,SCOL[mst(m)])}catch(e){}   // círculo en el suelo = decal 3D de bordes suaves (spellfx3d.js); solo el rótulo sigue en 2D
  ctx.save();ctx.setTransform(1,0,0,1,0,0);
  const c=ISO.toCanvas(m.x,m.y,TER.standZ(m.x,m.y)),k2=SPR*s;ctx.globalAlpha=1;ctx.font='bold '+Math.round(14*s+8)+'px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.strokeStyle='#8a1208';ctx.lineWidth=3;const ty=c.y-((m.d.h||20)+22)*k2;const lb=SEMO[mst(m)]+'!';ctx.strokeText(lb,c.x,ty);ctx.fillText(lb,c.x,ty);ctx.restore()}}

// ═══ LOTE B2 · MECÁNICAS DE JEFES Y CAPITANES ═══
// Cada jefe (b0–b5) y capitán (k0–k5) tiene 2–4 mecánicas propias, además del cambio de estilo (MSW):
//  enr = Furia (<30 % de vida: +25 % de daño y golpea un 25 % más rápido) · met = Meteoro (el golpe pesado alterna con un círculo BAJO TUS PIES) · nov = Onda (círculo enorme alrededor del jefe)
//  sum:id = Refuerzos (al 66 % y 33 % de vida llama a 2 esbirros sin botín) · lif = Robavida (cura la mitad del daño que te hace) · dot:tipo = Herida (sus golpes dejan sangrado/veneno/quemadura: 1 daño por segundo)
const BM={b0:['enr','met','sum:goblin'],b1:['enr','sum:lobo','dot:sangrado'],b2:['lif','met','dot:veneno'],b3:['enr','nov','met'],b4:['enr','sum:oni','nov'],b5:['nov','met','dot:quemadura'],
 k0:['sum:goblin','enr'],k1:['enr','dot:sangrado'],k2:['lif','met'],k3:['nov','sum:yak'],k4:['met','dot:sangrado'],k5:['nov','enr']};
const BMN={enr:'Furia',met:'Meteoro',nov:'Onda expansiva',sum:'Refuerzos',lif:'Robavida',dot:'Herida'},DOTN={sangrado:['🩸','Sangrado','#d4261c'],veneno:['☠️','Veneno','#6ad04a'],quemadura:['🔥','Quemadura','#ff8a2a']};
const bmech=(m,k)=>(BM[m.d.id]||[]).find(x=>x===k||x.startsWith(k+':'));
function bossTick(m,now){const L0=BM[m.d.id];if(!L0||m.sm)return;
 if(!m.bi){m.bi=1;log('⚠️ <b>'+m.d.n+'</b> — '+L0.map(x=>BMN[x.split(':')[0]]).join(' · ')+'.')}
 if(bmech(m,'enr')&&!m.en&&m.hp<m.mh*.3){m.en=1;m.dm=Math.max(m.dm+1,Math.round(m.dm*1.25));m.asx=.75;log('🔥 ¡<b>'+m.d.n+'</b> entra en furia!');sp(m.x,m.y-m.d.h/2,'#ff3a1a',16,120,90,180);SHK=now+250;snd('thunder')}
 const s=bmech(m,'sum');if(s&&(m.bph||0)<2&&m.hp<m.mh*((m.bph||0)<1?.66:.33)){m.bph=(m.bph||0)+1;summon(m,s.split(':')[1],now)}}
function summon(m,id,now){log('📣 ¡<b>'+m.d.n+'</b> llama refuerzos!');snd('thunder');for(let i=0;i<2;i++){const a=Math.random()*6.283,x=m.x+Math.cos(a)*40,y=m.y+Math.sin(a)*40,e={d:Object.assign({},MD[id],{dr:[],co:[0,0],ag:1}),hx:m.x,hy:m.y,x,y,rt:0,tx:x,ty:y,wt:0,fl:0,sm:m};rollLv(e);e.mh=Math.max(3,Math.round(e.mh*.6));e.hp=e.mh;e.hunt=1;e.lx=m.x;e.ly=m.y;e.nt=now+1200;M.push(e);sp(x,y-6,'#c8a0ff',10,60,50,110)}}
// esbirros: se retiran al morir, o cuando su jefe muere o deja de perseguirte
function bossClean(now){for(let i=M.length-1;i>=0;i--){const e=M[i];if(!e.sm)continue;if(e.rt||!e.sm.hunt||e.sm.rt||P.hp<=0){if(A&&A.e===e)stopA();if(P.pjM===e)P.pjM=null;M.splice(i,1)}}}
// efectos de un golpe del jefe que ha dañado (d>0): robavida y herida por segundo
function bossHit(m,d,now){if(!d||m.sm)return;if(bmech(m,'lif')){const h=Math.max(1,Math.round(d/2));m.hp=Math.min(m.mh,m.hp+h);splat(m.x,m.y,h,'#6ad04a',m.d.h+6)}
 const dt=bmech(m,'dot');if(dt&&Math.random()<.4&&!P.dot){const k=dt.split(':')[1];P.dot={k,n:5,t:now+1000,v:Math.max(1,Math.round((m.dm||1)*.12))};log(DOTN[k][0]+' ¡'+DOTN[k][1]+'! Pierdes vida cada segundo (un altar de oración te limpia).')}}
function dotTick(now){const D=P.dot;if(!D)return;if(P.hp<=0||INT){P.dot=null;return}if(now<D.t)return;D.t=now+1000;P.hp-=D.v;splat(P.x,P.y,D.v,DOTN[D.k][2],26);HURT=now;if(--D.n<=0)P.dot=null;if(P.hp<=0){P.dot=null;die()}}

// ═══ LOTE B2 · AUTO-RETALIATE (defenderse solo) ═══ Como en OSRS: con «Auto» activado (por defecto), cuando un enemigo te golpea y no estás luchando, empiezas a pelear contra él. Botón en los ajustes (#arb) o tecla T. Se guarda en S.ar (0 = apagado).
function arTog(){S.ar=S.ar===0?1:0;arPaint();snd(S.ar===0?'miss':'xp');toast(S.ar===0?'⚔️ Defensa automática: <b>desactivada</b>. Los enemigos te golpearán sin que respondas.':'⚔️ Defensa automática: <b>activada</b>. Responderás a quien te ataque.',2400);dirty=1}
function arPaint(){const el=document.getElementById('arb');if(!el)return;const on=S.ar!==0;el.textContent='⚔️ Defensa automática: '+(on?'SÍ':'NO')+' (T)';el.title='Defensa automática (tecla T): '+(on?'respondes':'NO respondes')+' a los enemigos que te atacan.'}
