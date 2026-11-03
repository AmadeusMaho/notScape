/* NotScape · PELEAS EN GRUPO (lote COMBATE-GRUPO, 2 nov 2026; el dueño: «cuando hay dos o más enemigos contra el jugador no se siente bien pelearles»).
   Antes: un bloqueo heredado de OSRS (`busy` en game.js) hacía que solo el último enemigo que te golpeó pudiera atacar; los demás se quedaban QUIETOS a tu lado hasta 4,8 s.
   Ahora, estilo Souls/God of War, con «TURNOS DE ATAQUE» (global `CROWD`, script clásico cargado antes de game.js; `?crowd=0` vuelve al sistema antiguo):
   · `CROWD.N` (2) enemigos cuerpo a cuerpo a la vez tienen turno (`m.tok`); +1 si en la pelea hay un élite/campeón/jefe. Jefes y capitanes SIEMPRE tienen turno y no ocupan plaza.
   · Un turno dura `HOLD` ms (± azar) y, si hay alguien esperando, pasa al que más lleva esperando cuando el enemigo no está a mitad de un golpe.
   · Los que esperan RODEAN al héroe a `R` px (+ su tamaño), se reparten el círculo (se apartan unos de otros) y derivan hacia tu ESPALDA; de vez en cuando AMAGAN (un paso hacia ti).
     No usan la embestida (`lunge`) mientras esperan, pero sí pueden lanzar cuchillos.
   · Los tiradores (`sk.knife` con k 'arrow'/'orb') no necesitan turno: guardan distancia (`keep`) y rodean despacio; si te pegas a ellos, pelean cuerpo a cuerpo.
   · Entre el INICIO de dos ataques de enemigos distintos pasan al menos `GAP` ms (legibles, bloqueables y esquivables).
   · AVISO DE ESPALDA: un arco rojo alrededor del héroe (lienzo 2D) señala a todo enemigo que prepara un golpe fuera de tu objetivo o fuera de la pantalla.
   Coste: un recorrido de `M` cerca del héroe por fotograma con la lista de los que persiguen (`hunt`, < 260 px), sin DOM. */
const CROWD=(()=>{
 const C={on:!/[?&]crowd=0\b/.test(location.search),N:2,GAP:380,R:118,HOLD:2800,last:-1e9,lastM:null,list:[],t:0};
 const rangedOf=m=>{const k=m.d.sk&&m.d.sk.knife;return !!(k&&(k.k==='arrow'||k.k==='orb'))};
 C.ranged=rangedOf;
 const hasTok=m=>!!(m.d.boss||m.tok||rangedOf(m));
 // una vez por fotograma (upd, antes de mover a los enemigos): quién tiene turno
 C.tick=(now)=>{if(!C.on)return;const L=C.list;L.length=0;let big=0;
  for(const m of M){if(!m.hunt||!alive(m,now))continue;if(Math.abs(m.x-P.x)>260||Math.abs(m.y-P.y)>260){m.tok=0;continue}
   if(m.d.boss||rangedOf(m)){m.tok=1;if(m.d.boss||m.elite)big=1;continue}if(m.elite)big=1;L.push(m)}
  for(const m of L)if(!m.tok&&m.tokW==null)m.tokW=now;
  const N=C.N+big;let held=0;
  for(const m of L){if(!m.tok)continue;const mid=m.wind||m.dash||m.tel;if(now>m.tokE&&!mid&&L.length>N){m.tok=0;m.tokW=now;m.oa=null}else held++}
  if(held<N){const W=L.filter(m=>!m.tok).sort((a,b)=>(a.tokW||0)-(b.tokW||0)||Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y));
   for(const m of W){if(held>=N)break;m.tok=1;m.oa=null;m.tokE=now+C.HOLD*(.8+Math.random()*.5);m.nt=Math.max(m.nt||0,now+250);held++}}
  C.t=now};
 // ¿debe ESPERAR (rodear sin atacar)?
 C.wait=(m)=>C.on&&!hasTok(m);
 // separación entre ataques de enemigos distintos
 C.gap=(m,now)=>!C.on||m.d.boss||C.lastM===m||now-C.last>=C.GAP;
 C.mark=(m,now)=>{C.last=now;C.lastM=m};
 // ESPERAR / GUARDAR DISTANCIA: se mueve hacia un punto del anillo alrededor del héroe y lo encara
 C.orbit=(m,now,dt,dx,dy,dp,keep)=>{if(m.oa==null)m.oa=Math.atan2(-dy,-dx);
  let oa=m.oa;const R=keep||(C.R+(m.d.w||16)*.5);
  // reparto: se aparta en ángulo de los otros que rodean
  let push=0;for(const o of C.list){if(o===m||o.tok||o.oa==null)continue;let df=oa-o.oa;df=Math.atan2(Math.sin(df),Math.cos(df));if(Math.abs(df)<.9)push+=(df>=0?1:-1)*(.9-Math.abs(df))}
  // deriva hacia la espalda del héroe (lado contrario a su objetivo)
  let back=null;const f=typeof combatFoe==='function'?combatFoe(now):null;if(f&&f!==m)back=Math.atan2(P.y-f.y,P.x-f.x);
  let drift=0;if(back!=null&&!keep){let db=back-oa;db=Math.atan2(Math.sin(db),Math.cos(db));drift=Math.sign(db)*Math.min(Math.abs(db),1)*.35}
  oa+=(push*1.6+drift)*dt+(keep?.12*dt*((m.seed||(m.seed=Math.random()<.5?1:-1))):0);m.oa=oa;
  // amago: cada 3–6 s un paso hacia ti de 380 ms
  if(!keep){if(m.fnT==null)m.fnT=now+3000+Math.random()*3000;if(now>m.fnT+380)m.fnT=now+3000+Math.random()*3000}
  const fe=!keep&&now>=m.fnT&&now<m.fnT+380?32:0,tx=P.x+Math.cos(oa)*(R-fe),ty=P.y+Math.sin(oa)*(R-fe),ex=tx-m.x,ey=ty-m.y,d=Math.hypot(ex,ey);
  if(d>3){const sp=Math.min(d,(m.d.ag?58:45)*(fe?1.6:.8)*dt*STS.spd(m)*(m.spx||1)),nx=m.x+ex/d*sp,ny=m.y+ey/d*sp;if(!inVilla(nx,ny)){m.x=nx;m.y=ny;m.mv=now}}
  m.f=dx-dy>=0?1:-1};
 // AVISO DE ESPALDA (lienzo 2D, tras las placas): arco rojo hacia cada enemigo que prepara un golpe y NO es tu objetivo (o está fuera de la pantalla)
 C.draw=(x,now)=>{if(!C.on||P.hp<=0)return;const f=typeof combatFoe==='function'?combatFoe(now):null;let any=0;
  for(const m of M){const w=m.wind||m.tel;if(!w||!m.hunt||!alive(m,now))continue;if(Math.abs(m.x-P.x)>420||Math.abs(m.y-P.y)>420)continue;
   const t1=w.t1||(w.t0+(w.d||1000));if(now>=t1)continue;
   const hc=ISO.toCanvas(P.x,P.y,TER.standZ(P.x,P.y)),mc=ISO.toCanvas(m.x,m.y,TER.standZ(m.x,m.y)),off=mc.x<0||mc.y<0||mc.x>cv.width||mc.y>cv.height;
   if(m===f&&!off)continue;if(f&&m!==f&&!off){const a1=Math.atan2(m.y-P.y,m.x-P.x),a2=Math.atan2(f.y-P.y,f.x-P.x);let df=Math.abs(a1-a2);df=df>Math.PI?2*Math.PI-df:df;if(df<1.2)continue}
   if(!any){x.save();x.setTransform(1,0,0,1,0,0);any=1}
   const u=Math.max(0,Math.min(1,(now-w.t0)/Math.max(1,t1-w.t0))),a=Math.atan2(mc.y-hc.y,mc.x-hc.x),r=cv.height*.1,cy=hc.y-cv.height*.01,pul=.55+.45*Math.sin(now/70);
   x.lineCap='round';x.strokeStyle='rgba(255,70,50,'+(.35+.55*u)*pul+')';x.lineWidth=cv.height*(.008+.01*u);x.beginPath();x.ellipse(hc.x,cy,r,r*.62,0,a-.5,a+.5);x.stroke();
   const tx=hc.x+Math.cos(a)*(r+cv.height*.028),ty=cy+Math.sin(a)*(r+cv.height*.028)*.62,s=cv.height*.022;x.fillStyle='rgba(255,90,60,'+(.5+.5*u)+')';x.beginPath();x.moveTo(tx+Math.cos(a)*s,ty+Math.sin(a)*s);x.lineTo(tx+Math.cos(a+2.3)*s,ty+Math.sin(a+2.3)*s);x.lineTo(tx+Math.cos(a-2.3)*s,ty+Math.sin(a-2.3)*s);x.closePath();x.fill()}
  if(any)x.restore()};
 return C})();
