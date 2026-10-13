// NotScape · F4b · animaciones del héroe (jugador). Convierte el estado del juego (dirección de 8 vías, caminar/correr, acción, daño) en una pose para ORG.U.heroe.
// No dibuja nada: devuelve opciones cuantizadas (para hornear pocos fotogramas) y las posiciones de anclaje (punta de la caña). Todo es función pura de (estado, t).
// Direcciones en pantalla: 0 E, 1 SE, 2 S, 3 SO, 4 O, 5 NO, 6 N, 7 NE. El mundo es isométrico 2:1: +x→SE, +y→SO, −x→NO, −y→NE; (+x,+y)→S, (−x,−y)→N, (+x,−y)→E, (−x,+y)→O.
const HERO=(()=>{
 const D=Math.PI/180,lerp=(a,b,u)=>a+(b-a)*u,q=(v,n)=>Math.round(v*n)/n,cl=(v,a,b)=>Math.max(a,Math.min(b,v)),eo=u=>1-(1-u)*(1-u),es=u=>u*u*(3-2*u);
 // Objetos de recolección/trabajo que se agarran con DOS manos (en vistas frente/espalda ambos brazos van al mango). ► Toda herramienta de recolección nueva (caña de dos manos, azada, pala…) debe añadirse aquí por su tipo de objeto (item.t).
 const TWO={axe:1,pick:1,hammer:1};
 const dirOf=(dx,dy)=>((Math.round(Math.atan2((dx+dy)*.5,dx-dy)/(Math.PI/4))%8)+8)%8;
 const VIEW=[['side',0,0],['front',1,0],['front',0,0],['front',1,1],['side',0,1],['back',1,1],['back',0,0],['back',1,0]];   // [vista, giro de cabeza, espejo]
 // golpe genérico (tala, minería, herrería, combate cuerpo a cuerpo): subida lenta, golpe rápido, pausa de impacto al final del ciclo (el impacto del juego ocurre al cerrar la fase)
 function swing(ph,a0,a1,a2){if(ph<.7){const u=ph/.7;return{a:lerp(a0,a1,eo(u)),w:u,hit:0}}if(ph<.92){const u=(ph-.7)/.22;return{a:lerp(a1,a2,u*u),w:1,hit:u,fast:1}}return{a:a2,w:1,hit:1,imp:1}}
 function pose(s){const[view,lk,rot]=VIEW[s.dir==null?2:s.dir],side=view==='side',R={view,rot,pose:{look:lk},item:null,trail:null};const P=R.pose;
  let bob=0,lean=0,dip=0,aN=8,aF=8,L0={x:0,l:0},L1={x:0,l:0},blink=s.blink?1:0,mouth=0,t=s.t;
  const a=s.act;
  if(s.mv){ // ── caminar / correr: 8 fotogramas por ciclo; piernas alternas, brazos en contrafase, cuerpo sube a mitad de zancada ──
   const fr=Math.floor((((s.w/(2*Math.PI))%1)+1)%1*8)/8,sn=Math.sin(2*Math.PI*fr),cs=Math.cos(2*Math.PI*fr),A=s.run?1.4:1;
   L0={x:(side?sn*5*A:sn*.9),l:Math.max(0,cs)*3.4*A};L1={x:(side?-sn*5*A:-sn*.9),l:Math.max(0,-cs)*3.4*A};
   bob=(1-Math.abs(sn))*1.5*A;
   if(side){aN=7-sn*34*A;aF=7+sn*34*A;lean=s.run?9:3}else if(lk){ // diagonal: brazos y piernas oscilan en UNA línea (la diagonal), sin abrirse a los lados
    P.fw=1;const am=s.run?26:14;aN=10-sn*am;aF=10+sn*am;dip=0;lean=0;const vs=view==='back'?-1:1,st=sn*(s.run?3.4:2.6);L0.x=st*.89;L0.y=vs*st*.45;L1.x=-L0.x;L1.y=-L0.y}
   else{aN=9-sn*9*A;aF=9+sn*9*A;dip=s.run?1.2:0;lean=0}
   P.look=lk*(side?0:1);
   if(!side&&!lk&&s.run){ // correr de frente/espalda: brazos y piernas avanzan en el plano sagital (adelante = arriba en pantalla de espaldas)
    const vs=view==='back'?-1:1;P.fw=1;aN=12-sn*40;aF=12+sn*40;dip=0;L0.y=vs*.5*sn*5*A;L1.y=-L0.y}}
  else if(a){
   const ph=a.ph,k=a.k;P.look=lk;mouth=0;
   if(k==='wc'||k==='mi'||(k==='sm'&&a.id!=='furnace')){ // tala / minería / forja: hacha, pico o martillo por encima de la cabeza
    const mx=k==='mi'?152:k==='sm'?128:166,w=swing(ph,16,mx,6);aN=w.a;aF=side?w.a:10+w.a*.3;lean=side?lerp(0,-5,w.w)+(w.hit?lerp(-5,9,w.hit):0):0;dip=side?0:(w.hit?w.hit*1.4:-w.w*.8);mouth=w.imp||w.fast?1:0;
    R.item=k==='wc'?{t:'axe',col:a.col}:k==='mi'?{t:'pick',col:a.col}:{t:'hammer',col:'#8a8f98'};
    if(w.fast&&k!=='sm'){const pv=swing(Math.max(.7,ph-.07),16,mx,6);R.trail={r:46,a0:pv.a,a1:w.a}}}
   else if(k==='f'){const wt=a.wt;
    if(wt==='r'){ // arco: tensar (0–.7), mantener, soltar
     const hv=a.hv,pull=hv?(ph<.85?es(ph/.85):ph<.92?1:0):(ph<.7?es(ph/.7):ph<.92?1:0); // golpe máximo (a.hv): tensado más largo y tembloroso, brillo dorado en el arco y retroceso al soltar
     aN=86+(hv&&ph>=.55&&ph<.92?((Math.floor(t*30)%2)?2:-1):0);aF=lerp(80,46,pull);lean=side?lerp(0,-3,pull)+(hv?(ph>=.92?-7:-2*pull):0):0;P.look=lk;R.item={t:'bow',col:a.wcol||'#8a5a2a',arrow:ph<.92};if(hv){R.item.hv=ph<.92?q(es(cl(ph/.85,0,1)),3):0;if(ph>=.92)dip=1.4}}
    else if(wt==='g'){ // báculo: alzar, empujar, destello
     const u=ph<.7?eo(ph/.7):1,th=ph<.7?0:ph<.92?(ph-.7)/.22:1,hv=a.hv;aN=lerp(22,hv?100:72,u)+th*(hv?44:34);aF=lerp(10,hv?80:60,u);const ab=lerp(176,166,u)-th*(hv?70:58);
     R.item={t:'staff',col:a.orb||'#9cf',col2:'#8a5a2a',abs:ab,glow:cl(th*1.2+(ph<.7?u*(hv?1:.35):0),0,1)};lean=side?th*(hv?9:5):0;mouth=th>0?1:0;
     if(hv){R.item.hv=q(ph<.92?u:0,3);dip=-u*1.2+th*2.2;P.lunge=q(th*3,1)}} // golpe máximo: alza el báculo más alto (carga dorada), se estira y lo clava hacia delante
    else if(a.hv){ // ── GOLPE MÁXIMO cuerpo a cuerpo: espada = ESTOCADA (echa el brazo atrás, agacha y se lanza con la hoja horizontal); sin arma = PUÑETAZO cargado. Mismos ángulos en frente/espalda (plano sagital) ──
     const armed=!!a.wcol,w=swing(ph,armed?16:10,armed?-30:-44,armed?92:104);aN=w.a;aF=lerp(10,armed?40:56,w.w);lean=side?lerp(0,-9,w.w)+(w.hit?lerp(-9,15,w.hit):0):0;dip=w.hit?w.hit*2:-w.w*.8;P.lunge=q(w.hit?lerp(-2,8,w.hit):-w.w*2,1);mouth=w.fast||w.imp?1:0;
     if(armed)R.item={t:'sword',col:a.wcol,col2:'#6b4a2a',hv:q(w.hit>.5?1-w.hit:w.w,3)}}
    else{ const armed=!!a.wcol,w=armed?swing(ph,16,162,52):swing(ph,10,-22,88);aN=w.a;aF=lerp(10,36,w.w);lean=side?(armed?lerp(0,-6,w.w)+(w.hit?lerp(-6,10,w.hit):0):lerp(0,-6,w.w)+(w.hit?lerp(-6,12,w.hit):0)):0;dip=side?0:(w.hit?w.hit*1.5:0);mouth=w.fast||w.imp?1:0;
     if(armed){R.item={t:'sword',col:a.wcol,col2:'#6b4a2a'};if(w.fast){const pv=swing(Math.max(.7,ph-.06),16,162,52);R.trail={r:50,a0:pv.a,a1:w.a}}}}}
   else if(k==='fi'){ // pesca: echar hacia atrás, lanzar, esperar con la caña
    const ab=ph<.1?160:ph<.26?lerp(160,108,es((ph-.1)/.16)):110+Math.sin(t*5)*2.5;aN=ph<.26?lerp(120,74,es(cl(ph/.26,0,1))):74;aF=18;R.item={t:'rod',col:'#cfd6e0',col2:'#8a5a2a',abs:ab};dip=.6;lean=side?2:0;R.rod=ab}
   else if(k==='sp'){const wt=a.wt,c=ph<.5?ph*2:(ph-.5)*2,seg=ph<.5?0:1; // ESPECIAL de arma (solo en combate): cuerpo a cuerpo = dos tajos cruzados · arco = doble tensado · báculo = alzar, girar y descargar
    if(wt==='m'){const u=eo(cl(c/.8,0,1)),pa=seg?lerp(40,160,u):lerp(160,40,u);aN=pa;aF=lerp(10,50,u);lean=side?(seg?lerp(8,-6,u):lerp(-6,10,u)):0;dip=side?0:u*1.4;mouth=1;P.lunge=q(Math.sin(c*Math.PI)*4,1);
     if(a.wcol)R.item={t:'sword',col:a.wcol,col2:'#6b4a2a',hv:q(.7,1)};if(u>.1&&u<.95)R.trail={r:50,a0:Math.round((seg?pa-40:pa+40)/3)*3,a1:Math.round(pa/3)*3}}
    else if(wt==='r'){const pull=c<.78?es(c/.78):c<.9?1:0;aN=86;aF=lerp(80,46,pull);lean=side?lerp(0,-3,pull)+(c>=.9?-6:0):0;P.look=lk;R.item={t:'bow',col:a.wcol||'#8a5a2a',arrow:c<.9,hv:.6+(seg?.4:0)}}
    else{const u=ph<.45?eo(ph/.45):1,th=ph<.45?0:ph<.8?(ph-.45)/.35:1;aN=lerp(22,100,u)+th*40+Math.sin(ph*Math.PI*8)*(u<1?6:0);aF=lerp(10,80,u);const ab=lerp(176,166,u)-th*70;R.item={t:'staff',col:a.orb||'#9cf',col2:'#8a5a2a',abs:ab,glow:cl(.4+u*.6,0,1),hv:q(u,3)};lean=side?th*8:0;mouth=th>0?1:0;dip=-u*1.2+th*2;P.lunge=q(th*3,1)}} // arcano: carga con giro y empuje
   else if(k==='eat'){const u=es(cl(ph/.25,0,1));aN=lerp(10,128,u)+(ph>.25?Math.sin((ph-.25)*Math.PI*8)*7:0);aF=lerp(8,30,u);R.item={t:'food',col:'#d2782c'};mouth=ph>.25&&Math.sin((ph-.25)*Math.PI*8)>0?1:0;dip=.5;lean=side?2:0} // comer: lleva la comida a la boca y mastica
   else if(k==='pk'){const u=Math.sin(ph*Math.PI);aN=lerp(8,64,u);aF=lerp(8,26,u);dip=u*1.8;lean=side?u*5:0} // recoger del suelo: se agacha y estira el brazo
   else if(k==='co'||(k==='sm'&&a.id==='furnace')){aN=62+Math.sin(t*7)*12;aF=18;R.item={t:'spoon',col:'#a8a8b0',col2:'#6a4a2a'};dip=.9;lean=side?3:0}
   else if(k==='cr'||k==='es'){aN=68+Math.sin(ph*Math.PI*6)*14;aF=34;R.item={t:'saw',col:'#b8bec8',col2:'#8a5a2a'};dip=.8;lean=side?4:0;mouth=0}
   else if(k==='ins'){aN=40+Math.sin(t*9)*6;aF=14;R.item={t:'quill'};dip=1.1;lean=side?3:0}
   else{aN=45;aF=14}
   if(!side&&!(k==='f'&&a.wt==='r'))P.fw=1; // vistas frente/espalda: el brazo va adelante (plano sagital), no hacia los lados
   bob=0}
  else{ // ── reposo: respiración, ligero cambio de peso y parpadeo ──
   bob=q(Math.sin(t*2.1)*.5+.5,4);aN=aF=q(7+Math.sin(t*2.1)*1.5,1);lean=side?q(Math.sin(t*.6)*.8,1):0}
  // ── daño: retroceso y mueca ──
  if(s.hurt>.15){const h=q(s.hurt,3);lean=side?lean-9*h:lean;dip+=2.2*h;blink=2;aN+=22*h;aF+=22*h}
  if(P.lunge==null)P.lunge=0;P.bob=q(bob,4);P.lean=Math.round(lean);P.dip=q(dip,2);P.lg=[{x:q(L0.x,2),l:q(L0.l,2),y:q(L0.y||0,2)},{x:q(L1.x,2),l:q(L1.l,2),y:q(L1.y||0,2)}];P.aN=Math.round(aN/3)*3;P.aF=Math.round(aF/3)*3;P.blink=blink;P.mouth=mouth;
  if(R.item&&TWO[R.item.t])R.item.two=1;
  if(R.item&&R.item.abs!=null)R.item.abs=Math.round(R.item.abs/3)*3;if(R.item&&R.item.pull!=null)R.item.pull=q(R.item.pull,8);if(R.item&&R.item.glow!=null)R.item.glow=q(R.item.glow,4);
  if(R.trail){R.trail.a0=Math.round(R.trail.a0/3)*3;R.trail.a1=Math.round(R.trail.a1/3)*3}
  return R}
 // punta de la caña en px de modelo respecto a los pies (para la línea de pesca). Espeja con la vista.
 function rodTip(R,ks){if(R.rod==null)return null;const P=R.pose,side=R.view==='side',ty=-P.bob*.6+P.dip*.6;let hx,hy,tx,tyy;
  if(P.fw){const S=R.view==='back'?-1:1,fy=a=>Math.cos(a*D)+S*.55*Math.sin(a*D),y=fy(P.aN),m=Math.hypot(.16,y),kk=cl(m,.4,1),y3=fy(R.rod),k3=cl(Math.abs(y3),.12,1);
   hx=9.6+13.6*kk*.16/m;hy=-27+ty+13.6*kk*y/m;tx=hx;tyy=hy+38*k3*(y3<0?-1:1)}
  else{const rot=-P.aN*D,sh=side?0:9.6;hx=sh-13.6*Math.sin(rot);hy=-27+ty+13.6*Math.cos(rot);const w=-R.rod*D;tx=hx-38*Math.sin(w);tyy=hy+38*Math.cos(w)}
  return[(R.rot?-1:1)*tx*ks,tyy*ks]}
 return{dirOf,pose,rodTip,VIEW,TWO}})();
if(typeof module!=='undefined')module.exports=HERO;
