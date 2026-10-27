// NotScape · BOT DEL TUTORIAL DEL CIELO (27 oct 2026). Se inyecta en la página (tools/isla_playthrough.py) y juega los 35 pasos con las MECÁNICAS REALES:
// hablar con el maestro + panel de misión, buscar en la caja (casteo), abrir la Mochila, talar/minar con la RUEDA (pulsa cuando el marcador entra en el arco, con error
// humano), fundir/forjar (hoja de trabajo con WK.suggest = botón «Sugerir»), pescar (LMB al picar), golpes/carga/esquiva/bloqueo, arco, bola de fuego, matar corderos,
// banco, ofrendas y Gabriel. La COCINA la juega el guion de Python con el RATÓN REAL. Nada pone contadores a mano: si un paso no avanza, es un fallo del juego.
window.IBOT=(()=>{const sl=ms=>new Promise(r=>setTimeout(r,ms)),T=32,now=()=>performance.now(),log=[];
 const B9=()=>BIOMES.list[9],wp=(tx,ty)=>{const b=B9();return{x:b.ox+b.w/2+tx*T,y:b.oy+b.h/2+ty*T}};
 const step=()=>ISLA.step,txt=()=>ISLA.STEPS[Math.min(ISLA.step,ISLA.STEPS.length-1)].txt;
 const near=(x,y,d=40)=>{NSTEST.tp(x,y+d);P.g=P.mv=null};
 async function until(f,ms=20000,dt=100){const t=now();while(now()-t<ms){try{if(f())return true}catch(e){}await sl(dt)}return false}
 // hablar con un maestro y pulsar la opción de su misión → botón del panel (Aceptar / Completar)
 async function quest(id){const e=ST.find(s=>s.id===id);if(!e)return 'sin PNJ '+id;near(e.x,e.y,36);await sl(400);const s0=step();npcTalk(e);await sl(500);
  if(!DL||!DL.opts||!DL.opts[0])return 'sin opciones';DL.opts[0][1]();await sl(400);const b=document.querySelector('#qpn button[data-a=ok]');if(!b)return 'sin panel';if(b.disabled)return 'botón desactivado (falta algo)';b.click();await sl(600);
  try{HUDSU.dlgHide()}catch(x){}return step()>s0?'ok':'no avanzó'}
 // RUEDA (tala/minería): el bot espera a que el marcador esté en el arco y pulsa; reacción humana ±60 ms
 async function wheel(pred,item,n){const c0=()=>S.st['got:'+item]||0,start=c0();let tries=0;
  while(c0()-start<n&&tries<12){tries++;const e=N.filter(o=>o.x>=BIOMES.zone.x0&&pred(o)&&alive(o,now())).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0];if(!e)return 'sin recurso '+item;
   near(e.x,e.y,30);await sl(300);P.g={e};if(!await until(()=>A&&A.wh,8000,50))continue;
   while(A&&A.wh){const d=whDiff(whAng(now()),A.wa);if(d<=A.whalf*.55&&now()>=A.wc){await sl(Math.max(0,40+Math.random()*60));whPress(now())}await sl(16)}
   await sl(400)}return c0()-start>=n?'ok':'solo '+(c0()-start)+'/'+n}
 // oficio en estación (hoja de trabajo FF14 o barra): arranca la receta que da `out` y la termina con «Sugerir»
 async function craft(stId,sk,out,n){const st=ST.find(s=>s.id===stId&&s.x>=BIOMES.zone.x0&&!s.inroom);if(!st)return 'sin estación '+stId;const i=ACT[sk].findIndex(a=>a[2]===out);if(i<0)return 'sin receta '+out;const c0=()=>S.st['make:'+out]||0,s0=c0();
  for(let k=0;k<n*3&&c0()-s0<n;k++){near(st.x,st.y,40);await sl(300);S.stn=st;startC(sk,i);await sl(300);
   if(!A)return 'no arrancó ('+out+')';
   while(A&&A.ty==='c'){if(A.wk){const w=A.wk;if(w.s.over){await sl(150);continue}const id=WK.suggest(w.s);if(id)WKUI.use(id)}else if(A.wh){const d=whDiff(whAng(now()),A.wa);if(d<=A.whalf*.55&&now()>=A.wc)whPress(now())}await sl(A&&A.wk?260:30);if(c0()-s0>=n)break}
   await sl(700);try{stopA()}catch(e){}}
  return c0()-s0>=n?'ok':'solo '+(c0()-s0)+'/'+n}
 async function fish(n){const c0=()=>S.st['got:camaron']||0,s0=c0();let k=0;
  while(c0()-s0<n&&k<10){k++;const e=N.filter(o=>o.x>=BIOMES.zone.x0&&o.t==='fi').sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0];if(!e)return 'sin pesca';near(e.x,e.y,60);await sl(300);P.g={e};
   if(!await until(()=>A&&A.fg,8000,50))continue;await until(()=>!A||!A.fg||A.fg.st==='bite',30000,30);await sl(250+Math.random()*200);if(A&&A.fg)fishPress(now());await sl(900)}
  return c0()-s0>=n?'ok':'solo '+(c0()-s0)+'/'+n}
 const lamb=()=>M.filter(m=>m.d.id==='cordero'&&alive(m,now())).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0];
 function aimAt(m){const c=ISO.toCanvas(m.x,m.y,TER.standZ(m.x,m.y)),r=cvRect(),k=r.width/cv.width;return{x:r.left+c.x*k,y:r.top+c.y*k}}
 async function nearLamb(){const m=lamb();if(!m)return null;near(m.x,m.y,-50);await sl(250);return m}
 // GABRIEL con reflejos humanos: esquiva (la misma función que ESPACIO) ~180 ms (±60) ANTES de que caiga su golpe pesado (la esquiva protege 0,28 s) y golpea
 // (la misma función que LMB) cuando el ataque está listo, apuntando a él. Devuelve cómo acabó; `secs` = tope de tiempo.
 async function gabriel(secs=180){const t0=now();let seen=null,deaths=0,hp0=P.hp,dodges=0,hits=0;
  while(now()-t0<secs*1000){const g=ISLA.boss;if(!g||g.hp<=0||!ISLA.bossOn())break;const d=Math.hypot(g.x-P.x,g.y-P.y);
   if(P.hp>hp0+3)deaths++;hp0=P.hp;
   const warn=g.tel;if(warn&&warn!==seen){seen=warn;const w=warn.t1-now()-180+(Math.random()-.5)*120;if(w>0)await sl(w);if(dash())dodges++;await sl(300);continue}
   if(d>60){near(g.x,g.y,-36)}
   const n=now();if(n>=SWG.cd&&n>=ATKT&&!swSlow(n)){swing(n,Math.atan2(g.y-P.y,g.x-P.x));hits++}
   await sl(40)}
  const g=ISLA.boss;return 'Gabriel '+(g?g.hp:'?')+'/30 · caídas '+deaths+' · esquivas '+dodges+' · golpes '+hits+' · '+Math.round((now()-t0)/1000)+' s'}
 return{gabriel,log,sl,until,step,txt,wp,near,quest,wheel,craft,fish,lamb,aimAt,nearLamb}})();
'IBOT listo'
