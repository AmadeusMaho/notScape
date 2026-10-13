// NotScape · F4b · animaciones del héroe (jugador). Convierte el estado del juego (dirección de 8 vías, caminar/correr, acción, daño) en una pose para ORG.U.heroe.
// No dibuja nada: devuelve opciones cuantizadas (para hornear pocos fotogramas) y las posiciones de anclaje (punta de la caña). Todo es función pura de (estado, t).
// Direcciones en pantalla: 0 E, 1 SE, 2 S, 3 SO, 4 O, 5 NO, 6 N, 7 NE. El mundo es isométrico 2:1: +x→SE, +y→SO, −x→NO, −y→NE; (+x,+y)→S, (−x,−y)→N, (+x,−y)→E, (−x,+y)→O.
const HERO=(()=>{
 const D=Math.PI/180,lerp=(a,b,u)=>a+(b-a)*u,q=(v,n)=>Math.round(v*n)/n,cl=(v,a,b)=>Math.max(a,Math.min(b,v)),eo=u=>1-(1-u)*(1-u),es=u=>u*u*(3-2*u);
 // Objetos de recolección/trabajo que se agarran con DOS manos (en vistas frente/espalda ambos brazos van al mango). ► Toda herramienta de recolección nueva (caña de dos manos, azada, pala…) debe añadirse aquí por su tipo de objeto (item.t).
 const TWO={axe:1,pick:1,hammer:1,great:1,xbow:1};
 // ── AGARRE DE ARMAS (lote G1, oct 2026): la mano va en el centro de la empuñadura (antes en el pomo) y la hoja tiene ángulo PROPIO (item.abs, mismo
 // sistema que el brazo: 0 abajo, 90 adelante, 180 arriba) = brazo + MUÑECA. Así en guardia la hoja apunta adelante-arriba aunque el brazo esté bajo,
 // al cargar queda por encima/detrás del hombro y al golpear se alinea con el brazo. Mandoble = dos manos (en perfil ambos brazos iguales; frente/espalda: TWO).
 // WG[forma] = [brazo guardia, brazo arriba, brazo final, muñeca guardia, muñeca arriba, muñeca final, radio estela]
 const WG={sword:[40,162,52,60,25,0,44],dagger:[40,118,74,48,8,14,32],great:[44,176,36,56,22,0,56]};
 const bladeOf=a=>a.wk==='great'?'great':a.wk==='dagger'?'dagger':'sword';
 const wrist=(w,G)=>w.hit?lerp(G[4],G[5],es(w.hit)):lerp(G[3],G[4],w.w);
 const GA=40,GU=30,GF=20; // guardia cuerpo a cuerpo (lote M4): brazo del arma sin arma (GU) y del otro brazo (GF). Con arma manda WG (lote G1: brazo + muñeca)
 const NF=16; // fotogramas por ciclo de caminar/correr. props.js (warmHero) y game.js (asentado al parar) lo leen de aquí
 const dirOf=(dx,dy)=>((Math.round(Math.atan2((dx+dy)*.5,dx-dy)/(Math.PI/4))%8)+8)%8;
 const VIEW=[['side',0,0],['front',1,0],['front',0,0],['front',1,1],['side',0,1],['back',1,1],['back',0,0],['back',1,0]];   // [vista, giro de cabeza, espejo]
 // golpe genérico (tala, minería, herrería, combate cuerpo a cuerpo): subida lenta, golpe rápido, pausa de impacto al final del ciclo (el impacto del juego ocurre al cerrar la fase)
 function swing(ph,a0,a1,a2){if(ph<.7){const u=ph/.7;return{a:lerp(a0,a1,eo(u)),w:u,hit:0}}if(ph<.92){const u=(ph-.7)/.22;return{a:lerp(a1,a2,u*u),w:1,hit:u,fast:1}}return{a:a2,w:1,hit:1,imp:1}}
 function pose(s){if(s.act&&s.act.rc!=null&&!s.mv){const a=s.act,E=pose(Object.assign({},s,{act:Object.assign({},a,{ph:1,rc:null})})),G=pose(Object.assign({},s,{act:Object.assign({},a,{ph:0,rc:null})}));return mix(E,G,a.rc)} // recuperación tras el golpe (lote M4): de la pose final a la de guardia, en cuartos
  const[view,lk,rot]=VIEW[s.dir==null?2:s.dir],side=view==='side',R={view,rot,pose:{look:lk},item:null,trail:null};const P=R.pose;
  let bob=0,lean=0,dip=0,aN=8,aF=8,L0={x:0,l:0},L1={x:0,l:0},blink=s.blink?1:0,mouth=0,t=s.t;
  const a=s.act;
  if(s.mv){ // ── caminar / correr: NF fotogramas por ciclo (oct 2026: 8→16); piernas alternas, brazos en contrafase, cuerpo sube a mitad de zancada ──
   const fr=Math.floor((((s.w/(2*Math.PI))%1)+1)%1*NF+1e-6)/NF,sn=Math.sin(2*Math.PI*fr),cs=Math.cos(2*Math.PI*fr),A=s.run?1.4:1;
   if(s.run){ // ── CORRER (lote M2, oct 2026): zancada larga, patada de la pierna de atrás, fase de VUELO, inclinación hacia delante y brazos que bombean ──
    // Cada pierna con su fase u (pierna 1 = u+.5): APOYA en u≈.28 (pie delante), APOYO hasta .68 (el pie va de delante a atrás pegado al suelo, 40 % del ciclo),
    // BALANCEO .68→1.28: el talón sube enseguida por DETRÁS (patada, pico en u≈.9) y baja mientras la pierna viaja adelante. Como el apoyo es <50 %, hay dos
    // VUELOS por ciclo (u≈.23 y .73, ambos pies en el aire): el cuerpo sube (p.air) y la sombra se encoge; en mitad de cada apoyo el cuerpo baja (dip).
    const lift=u=>{const v=((u-.68)%1+1)%1/.6;return v<1?Math.sin(Math.PI*Math.pow(v,.7))*5.6:0},l0=lift(fr),l1=lift(fr+.5),ph2=.5+.5*Math.cos(4*Math.PI*(fr-.23)); // ph2: 1 en vuelo, 0 en mitad del apoyo
    P.air=q(ph2*ph2*1.8,2);dip=(1-ph2)*1.2;bob=0;mouth=0;
    P.eN=P.eF=side?84:62;P.cw=.9;P.cf=q(Math.sin(4*Math.PI*fr+.8),2); // K1: codos doblados al correr (brazos que bombean) · K2: capa/pelo arrastrados y aleteo por paso
    if(side){const st=8;L0={x:sn*st,l:l0};L1={x:-sn*st,l:l1};aN=8-sn*40;aF=8+sn*40;lean=10}
    else if(lk){P.fw=1;const vs=view==='back'?-1:1,st=sn*3.6;L0={x:st*.89,y:vs*st*.45,l:l0};L1={x:-st*.89,y:-vs*st*.45,l:l1};const am=view==='back'?22:26;aN=12-sn*am;aF=12+sn*am;lean=5}
    else{const vs=view==='back'?-1:1;P.fw=1;L0={x:sn*.6,y:vs*sn*3.4,l:l0};L1={x:-sn*.6,y:-vs*sn*3.4,l:l1};const am=vs<0?30:40,ab=vs<0?10:16;aN=ab-sn*am;aF=ab+sn*am;lean=0;dip+=.5} // de espaldas el brazo que va adelante se escorza: >~45° se vería de lado, por eso menos amplitud
    P.look=lk*(side?0:1);if(side)P.lgw=1}
   else{
   L0={x:(side?sn*5*A:sn*.9),l:Math.max(0,cs)*3.4*A};L1={x:(side?-sn*5*A:-sn*.9),l:Math.max(0,-cs)*3.4*A};
   bob=(.5+.5*Math.cos(4*Math.PI*fr))*1.5*A; // sube al pasar una pierna junto a la otra, baja al apoyar; curva suave (antes 1-|sin|: pico en punta, «saltito» en cada paso)
   if(side){aN=7-sn*34*A;aF=7+sn*34*A;lean=s.run?9:3;P.lgw=1}else if(lk){ // diagonal: brazos y piernas oscilan en UNA línea (la diagonal), sin abrirse a los lados
    P.fw=1;const am=s.run?26:14;aN=10-sn*am;aF=10+sn*am;dip=0;lean=0;const vs=view==='back'?-1:1,st=sn*(s.run?3.4:2.6);L0.x=st*.89;L0.y=vs*st*.45;L1.x=-L0.x;L1.y=-L0.y}
   else{const vs=view==='back'?-1:1,am=vs<0?16:20;P.fw=1;aN=10-sn*am;aF=10+sn*am;dip=0;lean=0;L0.y=vs*sn*2.4;L1.y=-L0.y} // frente/espalda (lote M5): pies que avanzan/retroceden (antes pisaban en el sitio) y brazos en el plano sagital (antes aleteaban hacia los lados)
   P.look=lk*(side?0:1);P.eN=14+Math.max(0,aN-8)*.45;P.eF=14+Math.max(0,aF-8)*.45;P.cw=.35;P.cf=q(Math.sin(4*Math.PI*fr+.8)*.6,2)}} // K1: codo algo flexionado, más cuando el brazo va adelante
  else if(a){
   const ph=a.ph,k=a.k;P.look=lk;mouth=0;
   if(k==='wc'||k==='mi'||(k==='sm'&&a.id!=='furnace')){ // tala / minería / forja: hacha, pico o martillo por encima de la cabeza
    const mx=k==='mi'?152:k==='sm'?128:166,w=swing(ph,16,mx,6);aN=w.a;aF=side?w.a:10+w.a*.3;lean=side?lerp(0,-5,w.w)+(w.hit?lerp(-5,9,w.hit):0):0;dip=side?0:(w.hit?w.hit*1.4:-w.w*.8);mouth=w.imp||w.fast?1:0;
    R.item=k==='wc'?{t:'axe',col:a.col}:k==='mi'?{t:'pick',col:a.col}:{t:'hammer',col:'#8a8f98'};
    if(w.fast&&k!=='sm'){const pv=swing(Math.max(.7,ph-.07),16,mx,6);R.trail={r:46,a0:pv.a,a1:w.a}}}
   else if(k==='f'){const wt=a.wt;
    if(wt==='r'&&a.wk==='xbow'){ // BALLESTA (lote G2): apunta al hombro con las dos manos, dispara con retroceso (la cuerda vuelve y el virote sale), recarga y vuelve a apuntar
     const hv=a.hv,sh=ph>=.92,u=sh?(ph-.92)/.08:0;aN=84-(sh?10*(1-u*.4):0)+(hv&&ph>.6&&!sh?((Math.floor(t*30)%2)?1.5:-1):0);aF=aN-6;lean=side?(sh?-5:-1):0;dip=sh?.9:.3;P.look=lk;
     R.item={t:'xbow',col:a.wcol||'#8a8f98',col2:'#7a5230',abs:Math.round(aN/3)*3+6,bolt:!sh};if(hv)R.item.hv=sh?0:q(es(cl(ph/.9,0,1)),3)}
    else if(wt==='r'){ // arco: tensar (0–.7), mantener, soltar
     const hv=a.hv,pull=hv?(ph<.85?es(ph/.85):ph<.92?1:0):(ph<.7?es(ph/.7):ph<.92?1:0); // golpe máximo (a.hv): tensado más largo y tembloroso, brillo dorado en el arco y retroceso al soltar
     aN=86+(hv&&ph>=.55&&ph<.92?((Math.floor(t*30)%2)?2:-1):0);aF=lerp(80,46,pull);lean=side?lerp(0,-3,pull)+(hv?(ph>=.92?-7:-2*pull):0):0;P.look=lk;R.item={t:'bow',col:a.wcol||'#8a5a2a',arrow:ph<.92};if(hv){R.item.hv=ph<.92?q(es(cl(ph/.85,0,1)),3):0;if(ph>=.92)dip=1.4}}
    else if(wt==='g'){ // báculo: alzar, empujar, destello
     const u=ph<.7?eo(ph/.7):1,th=ph<.7?0:ph<.92?(ph-.7)/.22:1,hv=a.hv;aN=lerp(22,hv?100:72,u)+th*(hv?44:34);aF=lerp(10,hv?80:60,u);const ab=lerp(176,166,u)-th*(hv?70:58);
     R.item={t:a.wk==='scepter'?'scepter':'staff',col:a.orb||'#9cf',col2:'#8a5a2a',abs:ab,glow:cl(th*1.2+(ph<.7?u*(hv?1:.35):0),0,1)};lean=side?th*(hv?9:5):0;mouth=th>0?1:0;
     if(hv){R.item.hv=q(ph<.92?u:0,3);dip=-u*1.2+th*2.2;P.lunge=q(th*3,1)}} // golpe máximo: alza el báculo más alto (carga dorada), se estira y lo clava hacia delante
    else if(a.hv){ // ── GOLPE MÁXIMO cuerpo a cuerpo: espada = ESTOCADA (echa el brazo atrás, agacha y se lanza con la hoja horizontal); sin arma = PUÑETAZO cargado. Mismos ángulos en frente/espalda (plano sagital) ──
     const armed=!!a.wcol,bk=bladeOf(a),G=WG[bk],gr=bk==='great',w=gr?swing(ph,G[0],192,30):swing(ph,armed?G[0]:GU,armed?-30:-44,armed?92:104);aN=w.a;aF=gr?w.a:lerp(GF,armed?40:56,w.w);lean=side?lerp(0,-9,w.w)+(w.hit?lerp(-9,15,w.hit):0):0;dip=w.hit?w.hit*2:-w.w*.8;P.lunge=q(w.hit?lerp(-2,8,w.hit):-w.w*2,1);mouth=w.fast||w.imp?1:0;
     if(!armed){P.eN=w.hit?lerp(110,4,es(w.hit)):lerp(84,118,w.w);P.eF=80}else if(!gr)P.eF=lerp(46,30,w.w);
     if(armed)R.item={t:bk,col:a.wcol,col2:'#6b4a2a',hv:q(w.hit>.5?1-w.hit:w.w,3),abs:gr?w.a+wrist(w,[0,0,0,56,26,0]):(w.hit?lerp(70,92,w.hit):lerp(G[0]+G[3],70,w.w))}} // estocada: la hoja va horizontal adelante; mandoble: tajo vertical enorme por encima de la cabeza
    else{ const armed=!!a.wcol,bk=bladeOf(a),G=WG[bk],gr=bk==='great',w=armed?swing(ph,G[0],G[1],G[2]):swing(ph,GU,-22,88);aN=w.a;aF=gr?w.a:lerp(GF,36,w.w);lean=side?(armed?lerp(0,-6,w.w)+(w.hit?lerp(-6,10,w.hit):0):lerp(0,-6,w.w)+(w.hit?lerp(-6,12,w.hit):0)):0;dip=side?0:(w.hit?w.hit*1.5:0);mouth=w.fast||w.imp?1:0;if(!w.w){dip=.7;lean=side?3:0} /* ph=0 = GUARDIA (lote M4): arma adelantada, rodillas algo flexionadas */P.lunge=q(w.hit?(w.imp?2.5:w.hit*2.5):-w.w*.8,1); /* M5: se echa un poco atrás al cargar y entra en el golpe */
     if(!armed){P.eN=w.hit?lerp(96,6,es(w.hit)):lerp(84,104,w.w);P.eF=lerp(88,70,w.w)}else if(!gr)P.eF=lerp(46,24,w.w); /* K1: puños = guardia de boxeo (codos doblados, el golpe estira el brazo); con espada el brazo libre recogido */
     if(gr){lean=side?lean*1.4:0;dip+=w.hit?w.hit*.8:0} // mandoble: más peso, el cuerpo acompaña
     if(armed){R.item={t:bk,col:a.wcol,col2:'#6b4a2a',abs:w.a+wrist(w,G)};if(w.fast){const pv=swing(Math.max(.7,ph-.06),G[0],G[1],G[2]);R.trail={r:G[6],a0:pv.a,a1:w.a}}}}}
   else if(k==='fi'){ // pesca: echar hacia atrás, lanzar, esperar con la caña
    const tg=a.tug||0,ab=ph<.1?160:ph<.26?lerp(160,108,es((ph-.1)/.16)):110+Math.sin(t*5)*2.5+tg*16;aN=(ph<.26?lerp(120,74,es(cl(ph/.26,0,1))):74)+tg*12;if(tg)lean=side?-3*tg:0; /* tg: tirón de la caña en cada picada */aF=18;R.item={t:'rod',col:'#cfd6e0',col2:'#8a5a2a',abs:ab};dip=.6;lean=side?2:0;R.rod=ab}
   else if(k==='sp'){const wt=a.wt,c=ph<.5?ph*2:(ph-.5)*2,seg=ph<.5?0:1; // ESPECIAL de arma (solo en combate): cuerpo a cuerpo = dos tajos cruzados · arco = doble tensado · báculo = alzar, girar y descargar
    if(wt==='m'){const u=eo(cl(c/.8,0,1)),pa=seg?lerp(40,160,u):lerp(160,40,u);aN=pa;aF=lerp(10,50,u);lean=side?(seg?lerp(8,-6,u):lerp(-6,10,u)):0;dip=side?0:u*1.4;mouth=1;P.lunge=q(Math.sin(c*Math.PI)*4,1);
     if(a.wcol){const bk=bladeOf(a);R.item={t:bk,col:a.wcol,col2:'#6b4a2a',hv:q(.7,1),abs:pa+(seg?-10:20)};if(bk==='great')aF=aN}if(u>.1&&u<.95)R.trail={r:WG[bladeOf(a)][6],a0:Math.round((seg?pa-40:pa+40)/3)*3,a1:Math.round(pa/3)*3}}
    else if(wt==='r'){const pull=c<.78?es(c/.78):c<.9?1:0;aN=86;aF=lerp(80,46,pull);lean=side?lerp(0,-3,pull)+(c>=.9?-6:0):0;P.look=lk;R.item={t:'bow',col:a.wcol||'#8a5a2a',arrow:c<.9,hv:.6+(seg?.4:0)};
     if(a.wk==='xbow'){aN=84-(c>=.9?9:0);aF=aN-6;R.item={t:'xbow',col:a.wcol||'#8a8f98',col2:'#7a5230',abs:Math.round(aN/3)*3+6,bolt:c<.9,hv:.6+(seg?.4:0)}}}
    else{const u=ph<.45?eo(ph/.45):1,th=ph<.45?0:ph<.8?(ph-.45)/.35:1;aN=lerp(22,100,u)+th*40+Math.sin(ph*Math.PI*8)*(u<1?6:0);aF=lerp(10,80,u);const ab=lerp(176,166,u)-th*70;R.item={t:a.wk==='scepter'?'scepter':'staff',col:a.orb||'#9cf',col2:'#8a5a2a',abs:ab,glow:cl(.4+u*.6,0,1),hv:q(u,3)};lean=side?th*8:0;mouth=th>0?1:0;dip=-u*1.2+th*2;P.lunge=q(th*3,1)}} // arcano: carga con giro y empuje
   else if(k==='eat'){const u=es(cl(ph/.25,0,1));aN=lerp(10,128,u)+(ph>.25?Math.sin((ph-.25)*Math.PI*8)*7:0);aF=lerp(8,30,u);R.item={t:'food',col:'#d2782c'};mouth=ph>.25&&Math.sin((ph-.25)*Math.PI*8)>0?1:0;dip=.5;lean=side?2:0} // comer: lleva la comida a la boca y mastica
   else if(k==='pk'){const u=Math.sin(ph*Math.PI);aN=lerp(8,64,u);aF=lerp(8,26,u);dip=u*1.8;lean=side?u*5:0} // recoger del suelo: se agacha y estira el brazo
   else if(k==='co'||(k==='sm'&&a.id==='furnace')){aN=62+Math.sin(t*7)*12;aF=18;R.item={t:'spoon',col:'#a8a8b0',col2:'#6a4a2a'};dip=.9;lean=side?3:0}
   else if(k==='cr'||k==='es'){aN=68+Math.sin(ph*Math.PI*6)*14;aF=34;R.item={t:'saw',col:'#b8bec8',col2:'#8a5a2a'};dip=.8;lean=side?4:0;mouth=0}
   else if(k==='ins'){aN=40+Math.sin(t*9)*6;aF=14;R.item={t:'quill'};dip=1.1;lean=side?3:0}
   else{aN=45;aF=14}
   if(!side&&!(k==='f'&&a.wt==='r'&&a.wk!=='xbow'))P.fw=1; /* el ARCO se ve de lado en frente/espalda; la ballesta apunta adelante (fw) */ // vistas frente/espalda: el brazo va adelante (plano sagital), no hacia los lados
   bob=a.rd?q(Math.sin(t*2.6)*.5+.5,4)*.8:0} // a.rd: esperando el siguiente golpe → respira (no se queda congelado)
  else{ // ── reposo: respiración, ligero cambio de peso y parpadeo ──
   bob=q(Math.sin(t*2.1)*.5+.5,4);aN=aF=q(7+Math.sin(t*2.1)*1.5,1);P.eN=P.eF=9;lean=side?q(Math.sin(t*.6)*.8,1):0}
  // ── daño: retroceso y mueca ──
  if(s.hurt>.15){const h=q(es(s.hurt),3); /* M5: el golpe recibido llega de golpe y se recupera con curva suave (antes lineal) */lean=side?lean-9*h:lean;dip+=2.2*h;blink=2;aN+=22*h;aF+=22*h}
  if(P.lunge==null)P.lunge=0;P.bob=q(bob,4);if(P.air==null)P.air=0;P.lean=Math.round(lean);P.dip=q(dip,2);P.lg=[{x:q(L0.x,2),l:q(L0.l,2),y:q(L0.y||0,2)},{x:q(L1.x,2),l:q(L1.l,2),y:q(L1.y||0,2)}];P.aN=Math.round(aN/3)*3;P.aF=Math.round(aF/3)*3;P.eN=Math.round((P.eN||0)/3)*3;P.eF=Math.round((P.eF||0)/3)*3;P.blink=blink;P.mouth=mouth;
  if(R.item&&TWO[R.item.t])R.item.two=1;
  if(R.item&&R.item.abs!=null)R.item.abs=Math.round(R.item.abs/3)*3;if(R.item&&R.item.pull!=null)R.item.pull=q(R.item.pull,8);if(R.item&&R.item.glow!=null)R.item.glow=q(R.item.glow,4);
  if(R.trail){R.trail.a0=Math.round(R.trail.a0/3)*3;R.trail.a1=Math.round(R.trail.a1/3)*3}
  return R}
 // ── TRANSICIONES (lote M3, oct 2026): fundido de poses entre estados (reposo↔andar↔correr↔acción). Solo mezcla números de la pose; objeto, estela y
 // vista salen de la pose nueva. k se cuantiza a cuartos → como mucho 3 fotogramas intermedios por transición (no revienta la caché de horneados).
 const NUM=['bob','lean','dip','aN','aF','lunge','air','eN','eF','cw','cf'];
 function mix(A,B,k){if(!A||k>=1||A.view!==B.view||A.rot!==B.rot)return B;const R=Object.assign({},B),pa=A.pose,pb=B.pose,P=R.pose=Object.assign({},pb);
  for(const f of NUM)P[f]=lerp(pa[f]||0,pb[f]||0,k);P.lg=pb.lg.map((l,i)=>{const m=pa.lg[i]||l;return{x:q(lerp(m.x,l.x,k),2),l:q(lerp(m.l,l.l,k),2),y:q(lerp(m.y||0,l.y||0,k),2)}});
  P.bob=q(P.bob,4);P.lean=Math.round(P.lean);P.dip=q(P.dip,2);P.lunge=q(P.lunge,1);P.air=q(P.air,2);P.aN=Math.round(P.aN/3)*3;P.aF=Math.round(P.aF/3)*3;P.eN=Math.round(P.eN/3)*3;P.eF=Math.round(P.eF/3)*3;P.cw=q(P.cw,4);P.cf=q(P.cf,2);
  if(A.item&&B.item&&A.item.t===B.item.t&&A.item.abs!=null&&B.item.abs!=null){R.item=Object.assign({},B.item,{abs:Math.round(lerp(A.item.abs,B.item.abs,k)/3)*3})} // la hoja también se funde (recuperación tras el golpe)
  return R}
 // blend(st,R,key,now,T): st = estado propio del personaje ({}); key = nombre del estado actual. Al cambiar de key, funde desde la ÚLTIMA pose mostrada
 // (si una transición se interrumpe, parte de la mezcla, sin saltos) hasta la pose viva del nuevo estado en T ms (pasos de ¼ repartidos por igual: .25/.5/.75, ~35 ms cada uno).
 function blend(st,R,key,now,T){T=T||140;if(st.key!==key){if(st.last&&st.key!=null){st.R0=st.last;st.t0=now}st.key=key}
  let out=R;if(st.R0){const u=(now-st.t0)/T;if(u>=1)st.R0=null;else out=mix(st.R0,R,Math.floor(u*4)/4+.25)}st.last=out;return out}
 // punta de la caña en px de modelo respecto a los pies (para la línea de pesca). Espeja con la vista.
 function rodTip(R,ks){if(R.rod==null)return null;const P=R.pose,side=R.view==='side',ty=-P.bob*.6+P.dip*.6;let hx,hy,tx,tyy;
  if(P.fw){const S=R.view==='back'?-1:1,fy=a=>Math.cos(a*D)+S*.55*Math.sin(a*D),y=fy(P.aN),m=Math.hypot(.16,y),kk=cl(m,.4,1),y3=fy(R.rod),k3=cl(Math.abs(y3),.12,1);
   hx=9.6+13.6*kk*.16/m;hy=-27+ty+13.6*kk*y/m;tx=hx;tyy=hy+38*k3*(y3<0?-1:1)}
  else{const rot=-P.aN*D,sh=side?0:9.6;hx=sh-13.6*Math.sin(rot);hy=-27+ty+13.6*Math.cos(rot);const w=-R.rod*D;tx=hx-38*Math.sin(w);tyy=hy+38*Math.cos(w)}
  return[(R.rot?-1:1)*tx*ks,tyy*ks]}
 return{dirOf,pose,rodTip,VIEW,TWO,NF,mix,blend}})();
if(typeof module!=='undefined')module.exports=HERO;
