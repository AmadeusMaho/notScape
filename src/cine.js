// CINE · motor de cinemáticas en tiempo real por DATOS (Lote CINE-0, 20 oct 2026). Global `CINE`.
// Una escena = {dur, shots:[{t,d,from:{x,y,az,zoom},to:{…},ease,shake,sub,fade:[a,b]}], done?:fn}.
//  · x,y = desplazamiento en px de mundo respecto a la ANCLA (héroe al empezar, o `anchor:[x,y]`); az = giro en rad respecto al acimut previo;
//    zoom = multiplicador del zoom del jugador. `to` omitido = plano fijo. Cada plano es un CORTE (sin mezcla con el anterior).
//  · Mientras dura: el juego NO actualiza (upd en pausa), sin entrada, HUD oculto, bandas de cine, saltable (mantener Esc o pulsar 1 s).
//  · Al terminar o saltar se restaura cámara/zoom/acimut y se llama a `scene.done()` (SIEMPRE, para que saltarla no rompa el tutorial).
// Usa solo globales de game.js en tiempo de llamada (P, K, A, ISO, R3D, TER, S, toast).
const CINE=(()=>{
 const SCENES={},HOLD=1;                                  // HOLD = segundos de pulsación para saltar
 let recv=0,look=null,skyEl=null,live=[],drone=null,fz=false,on=false,sc=null,T=0,last=0,skipT=0,holding=0,saved=null,anc=[0,0],el=null,sub=null,fade=null,skip=null,hintOff=0,fin=null;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease={lin:u=>u,io:u=>u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2,out:u=>1-(1-u)*(1-u)};
 const dom=()=>{if(el)return;el=document.createElement('div');el.id='cine';el.innerHTML='<i class="cn-t"></i><i class="cn-b"></i><div class="cn-sub"></div><div class="cn-skip">Mantén Esc para saltar</div><i class="cn-fade"></i>';el.insertAdjacentHTML('afterbegin','<div class="cn-sky"><svg viewBox="0 0 100 60" preserveAspectRatio="none"><path class="ck" pathLength="1" d="M70 0 L66 7 L69 12 L61 22 L64 27 L55 38 L58 42 L49 54 L51 60"/><path class="ck" pathLength="1" d="M82 0 L79 9 L84 14 L78 24 L82 30 L74 41"/><path class="ck" pathLength="1" d="M58 0 L60 6 L55 13 L57 19 L50 29"/></svg></div>');document.body.appendChild(el);sub=el.querySelector('.cn-sub');skyEl=el.querySelector('.cn-sky');fade=el.querySelector('.cn-fade');skip=el.querySelector('.cn-skip')};
 const lerp=(a,b,u)=>a+(b-a)*u,pick=(o,k,d)=>o&&o[k]!=null?o[k]:d;
 // ───────── TIEMPO DETENIDO (plano con `freeze:true`) ─────────
 // R3D.tscale→0 congela animación, partículas, nubes, agua, luz del día y rayos (reloj virtual de r3d.js); sube la viñeta oro oscuro y baja la saturación;
 // el audio se apaga salvo un tono agudo sostenido (sale por AC.destination, no por AMASTER); al soltar: golpe grave y todo vuelve de golpe.
 const gain=(v,tc)=>{try{if(typeof AMASTER!=='undefined'&&AMASTER&&AC)AMASTER.gain.setTargetAtTime(v,AC.currentTime,tc)}catch(e){}};
 function droneOn(){try{const a=ac();if(!a||S.mute||drone)return;const g=a.createGain(),o1=a.createOscillator(),o2=a.createOscillator();o1.type='sine';o2.type='sine';o1.frequency.value=1480;o2.frequency.value=2218;g.gain.setValueAtTime(0,a.currentTime);g.gain.linearRampToValueAtTime(.045,a.currentTime+.5);o1.connect(g);o2.connect(g);g.connect(a.destination);o1.start();o2.start();drone={a,g,o1,o2}}catch(e){drone=null}}
 function droneOff(){if(!drone)return;const{a,g,o1,o2}=drone;drone=null;try{g.gain.cancelScheduledValues(a.currentTime);g.gain.setValueAtTime(g.gain.value,a.currentTime);g.gain.linearRampToValueAtTime(0,a.currentTime+.12);o1.stop(a.currentTime+.2);o2.stop(a.currentTime+.2)}catch(e){}}
 function setFreeze(on_,quiet){if(on_===fz)return;fz=on_;
  if(on_){R3D.tscale=0;gain(.03,.12);droneOn()}
  else{R3D.tscale=1;droneOff();gain(typeof BR!=='undefined'?BR.snd:1,.05);if(!quiet)try{tone(58,.7,'sine',.55,30)}catch(e){}}}
 // ───────── CIELO (capa DOM: resplandor naranja desde arriba + grietas de luz que se dibujan) ─────────
 function sky(u){if(!skyEl)return;u=clamp(u,0,1);skyEl.style.opacity=u>0?Math.min(.8,u*1.3):0;skyEl.style.setProperty('--ck',u.toFixed(3))}
 // ───────── AUDIO sintetizado (sin archivos; sale por AMASTER: con el tiempo detenido queda casi mudo) ─────────
 const sfx=(()=>{const A=()=>{const a=ac();return a&&!S.mute?a:null},V=v=>v*S.sv/100,D=a=>AMASTER||a.destination;
  const env=(g,t0,at,hold,rel,v)=>{g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(Math.max(.0002,v),t0+at);g.gain.setValueAtTime(Math.max(.0002,v),t0+at+hold);g.gain.exponentialRampToValueAtTime(.0001,t0+at+hold+rel)};
  const reg=(g,nodes)=>{live.push({g,nodes});if(live.length>60)live.shift()};
  const noiseBuf=(a,d)=>{const n=a.sampleRate*d|0,b=a.createBuffer(1,n,a.sampleRate),c=b.getChannelData(0);for(let i=0;i<n;i++)c[i]=Math.random()*2-1;return b};
  return{
   // coro: acorde de triangulares con vibrato lento (f = fundamental, `ch` razones)
   choir(f,dur,v,dl,ch){const a=A();if(!a)return;const t0=a.currentTime+(dl||0),g=a.createGain(),nodes=[];g.connect(D(a));env(g,t0,dur*.4,dur*.2,dur*.4,V(v));
    (ch||[1,1.5,2,2.5]).forEach((r,i)=>{const o=a.createOscillator(),l=a.createOscillator(),lg=a.createGain();o.type=i%2?'triangle':'sine';o.frequency.value=f*r;o.detune.value=(i-1.5)*5;l.frequency.value=4.6+i*.3;lg.gain.value=f*r*.004;l.connect(lg);lg.connect(o.frequency);o.connect(g);o.start(t0);l.start(t0);o.stop(t0+dur+.1);l.stop(t0+dur+.1);nodes.push(o,l)});reg(g,nodes)},
   rumble(dur,v,dl,fr){const a=A();if(!a)return;const t0=a.currentTime+(dl||0),s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=noiseBuf(a,dur);f.type='lowpass';f.frequency.value=fr||150;env(g,t0,dur*.35,dur*.25,dur*.4,V(v));s.connect(f);f.connect(g);g.connect(D(a));s.start(t0);reg(g,[s])},
   wind(dur,v,dl){const a=A();if(!a)return;const t0=a.currentTime+(dl||0),s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain(),l=a.createOscillator(),lg=a.createGain();s.buffer=noiseBuf(a,dur);f.type='bandpass';f.frequency.value=480;f.Q.value=.7;l.frequency.value=.23;lg.gain.value=180;l.connect(lg);lg.connect(f.frequency);env(g,t0,dur*.2,dur*.5,dur*.3,V(v));s.connect(f);f.connect(g);g.connect(D(a));s.start(t0);l.start(t0);l.stop(t0+dur);reg(g,[s,l])},
   boom(v,dl){const a=A();if(!a)return;const t0=a.currentTime+(dl||0),o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.setValueAtTime(88,t0);o.frequency.exponentialRampToValueAtTime(26,t0+1);g.gain.setValueAtTime(V(v),t0);g.gain.exponentialRampToValueAtTime(.0001,t0+1.1);o.connect(g);g.connect(D(a));o.start(t0);o.stop(t0+1.2);reg(g,[o]);this.rumble(.9,v*.7,dl||0,220)},
   brass(f,dur,v,dl){const a=A();if(!a)return;const t0=a.currentTime+(dl||0),g=a.createGain(),lp=a.createBiquadFilter(),nodes=[];lp.type='lowpass';lp.frequency.setValueAtTime(240,t0);lp.frequency.exponentialRampToValueAtTime(2300,t0+dur*.8);lp.Q.value=2;env(g,t0,dur*.7,dur*.1,dur*.2,V(v));lp.connect(g);g.connect(D(a));
    [-7,7].forEach(c=>{const o=a.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=c;o.connect(lp);o.start(t0);o.stop(t0+dur+.1);nodes.push(o)});reg(g,nodes)},
   bell(f,v,dl){const a=A();if(!a)return;const t0=a.currentTime+(dl||0),nodes=[],g=a.createGain();g.connect(D(a));g.gain.value=1;[[1,1],[2.76,.5],[5.4,.25]].forEach(([r,k])=>{const o=a.createOscillator(),gg=a.createGain();o.type='sine';o.frequency.value=f*r;gg.gain.setValueAtTime(V(v)*k,t0);gg.gain.exponentialRampToValueAtTime(.0001,t0+3.8/r**.4);o.connect(gg);gg.connect(g);o.start(t0);o.stop(t0+4);nodes.push(o)});reg(g,nodes)},
   shimmer(dur,v,dl){const a=A();if(!a)return;const t0=a.currentTime+(dl||0),g=a.createGain(),nodes=[];g.connect(D(a));env(g,t0,dur*.5,.1,dur*.4,V(v));[1320,1760,2217].forEach((f,i)=>{const o=a.createOscillator(),l=a.createOscillator(),lg=a.createGain(),m=a.createGain();o.type='sine';o.frequency.setValueAtTime(f*.9,t0);o.frequency.linearRampToValueAtTime(f,t0+dur);l.frequency.value=5+i*1.7;lg.gain.value=.5;m.gain.value=.5;l.connect(lg);lg.connect(m.gain);o.connect(m);m.connect(g);o.start(t0);l.start(t0);o.stop(t0+dur+.1);l.stop(t0+dur+.1);nodes.push(o,l)});reg(g,nodes)},
   stop(){const a=ac();if(!a)return;for(const {g,nodes} of live.splice(0)){try{g.gain.cancelScheduledValues(a.currentTime);g.gain.setValueAtTime(Math.max(.0001,g.gain.value),a.currentTime);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+.2);nodes.forEach(n=>{try{n.stop(a.currentTime+.25)}catch(e){}})}catch(e){}}}}})();
 function shotAt(t){let s=null;for(const x of sc.shots)if(t>=x.t)s=x;return s||sc.shots[0]}
 // estado de cámara de un plano en el instante t (x,y,az,zoom,shake)
 function camAt(s,t){const u=clamp((t-s.t)/Math.max(.001,s.d),0,1),e=(ease[s.ease||'io']||ease.io)(u),f=s.from||{},to=s.to||f;
  return{x:lerp(pick(f,'x',0),pick(to,'x',pick(f,'x',0)),e),y:lerp(pick(f,'y',0),pick(to,'y',pick(f,'y',0)),e),az:lerp(pick(f,'az',0),pick(to,'az',pick(f,'az',0)),e),zoom:lerp(pick(f,'zoom',1),pick(to,'zoom',pick(f,'zoom',1)),e),z:lerp(pick(f,'z',0),pick(to,'z',pick(f,'z',0)),e),u}}
 const seen=id=>!!(typeof S!=='undefined'&&S.cine&&S.cine[id]),mark=id=>{try{S.cine=S.cine||{};S.cine[id]=1;if(typeof save==='function')save()}catch(e){}};   // flags de escenas vistas (S.cine.<id>, se guardan con la partida)
 function start(id,opt){opt=opt||{};const s=typeof id==='string'?SCENES[id]:id;if(on||!s||typeof P==='undefined'||!window.R3D)return false;const fk=s.flag||(typeof id==='string'?id:null);if(opt.once&&fk&&seen(fk))return false;   // `flag` de la escena = clave en S.cine (por defecto su id)
  dom();sc=s;fin=opt.done||null;T=0;last=0;skipT=0;holding=0;hintOff=0;anc=s.anchor||[P.x,P.y];
  saved={zoom:ISO.V.zoom,az:R3D.az};recv=0;look=null;sc.st=null;try{if(sc.setup)sc.st=sc.setup({anchor:anc,P})}catch(e){console.warn('[CINE] setup',e)}
  try{P.mv=null;P.g=null;A=null;for(const k in K)K[k]=0}catch(e){}   // quieto: sin clic pendiente ni tecla pegada
  fz=false;on=true;document.body.classList.add('cine');if(skip)skip.style.opacity=1;return true}
 function end(skipped){if(!on)return;recv=0;look=null;sky(0);sfx.stop();try{R3D.skyBurnReset()}catch(e){}setFreeze(false,true);R3D.tsync();on=false;document.body.classList.remove('cine');sub.textContent='';sub.style.opacity=0;
  try{ISO.V.zoom=saved.zoom;R3D.az=saved.az;ISO.snap(P.x,P.y,TER.standZ(P.x,P.y));if(R3D.parts)R3D.parts.snap()}catch(e){}
  fade.style.opacity=0;const s=sc,f=fin;try{if(s&&s.cleanup)s.cleanup(s.st)}catch(e){console.warn('[CINE] cleanup',e)}sc=null;fin=null;try{if(s&&s.flag)mark(s.flag);if(s&&s.done)s.done(skipped)}catch(e){console.warn('[CINE] done',e)}try{if(f)f(skipped)}catch(e){}}
 // lo llama loop() ANTES de upd: avanza el reloj propio, la pulsación de salto y el DOM (bandas, subtítulo, fundidos)
 function tick(now){if(!on)return;const dt=last?Math.min(.1,(now-last)/1000):1/60;last=now;
  if(holding){skipT+=dt;if(skipT>=HOLD)return end(true)}else skipT=Math.max(0,skipT-dt*2);
  T+=dt;if(T>=sc.dur)return end(false);
  try{if(sc.update)sc.update(T,dt*(1-R3D.frozen),sc.st)}catch(e){console.warn('[CINE] update',e);sc.update=null}   // dt ya descontado el «tiempo detenido»
  const s=shotAt(T);setFreeze(!!s.freeze);const FI=.7,FO=.7;let a=0;if(s.fade){const u=clamp((T-s.t)/Math.max(.001,s.d),0,1);a=lerp(s.fade[0],s.fade[1],u)}
  a=Math.max(a,1-clamp(T/FI,0,1),1-clamp((sc.dur-T)/FO,0,1));   // entrada y salida suaves a negro
  a=Math.max(a,skipT/HOLD*.85);fade.style.opacity=a.toFixed(3);
  const tx=s.sub||'';if(sub.textContent!==tx)sub.textContent=tx;sub.classList.toggle('card',!!s.card);sub.style.opacity=tx?clamp(Math.min((T-s.t)/.5,(s.t+s.d-T)/.5),0,1):0;
  if(!hintOff&&T>3.2){hintOff=1;skip.style.opacity=0}}
 // lo llama draw() en vez de ISO.follow: coloca ISO.cam, el zoom y el acimut del plano actual
 function cam(){const s=shotAt(T),c=camAt(s,T),x=anc[0]+c.x,y=anc[1]+c.y;
  ISO.V.zoom=clamp(saved.zoom*c.zoom,.5,8);R3D.az=saved.az+c.az;ISO.snap(x,y,TER.standZ(x,y)+c.z);
  const k=s.shake||0;if(k){const t=T*23;ISO.cam.x+=(Math.sin(t*1.7)+Math.sin(t*2.9+1))*.5*k*3;ISO.cam.y+=(Math.sin(t*2.3+2)+Math.sin(t*3.7))*.5*k*3}}   // temblor determinista (sin Math.random), px lógicos
 addEventListener('keydown',e=>{if(on&&e.key==='Escape'){holding=1;e.stopImmediatePropagation();e.preventDefault()}},true);
 addEventListener('keyup',e=>{if(e.key==='Escape')holding=0},true);
 addEventListener('pointerdown',e=>{if(on){holding=1;e.stopImmediatePropagation();e.preventDefault()}},true);
 addEventListener('pointerup',()=>{holding=0},true);
 // ───────── escenas ─────────
 // «prueba»: recorre la plaza (empuje, giro, primer plano con temblor, desplazamiento) para validar cámara, bandas, subtítulo y restauración.
 SCENES.prueba={dur:15,shots:[
  {t:0,d:4.5,from:{zoom:1},to:{zoom:1.5},sub:'Prueba de cinemática.'},
  {t:4.5,d:4,from:{x:0,y:0,az:0,zoom:1.3},to:{az:.9,zoom:1.3}},
  {t:8.5,d:3,from:{zoom:2.4},to:{zoom:2.8},shake:.5,ease:'out'},
  {t:11.5,d:3.5,from:{x:-200,y:140,zoom:1.2},to:{x:240,y:-120,zoom:1.2},ease:'lin'}]};
 // «congelado»: 3 s normal, 5 s de TIEMPO DETENIDO con cámara fija, 4 s normal; valida R3D.tscale, audio y grado.
 SCENES.congelado={dur:12,shots:[{t:0,d:3,from:{zoom:2.2},to:{zoom:2.4}},{t:3,d:5,from:{zoom:2.6},freeze:true},{t:8,d:4,from:{zoom:2.6},to:{zoom:1.6}}]};
 // «gabriel»: PRUEBA del modelo (CINE-2): Gabriel arrodillado en la plaza, alza la cara, susurra su frase, el halo se agrieta y se disuelve en polvo dorado. Sin audio ni cielo ardiendo (CINE-3).
 const GO=[-74,-74];   // posición de Gabriel respecto al héroe (px de mundo)
 SCENES.gabriel={dur:24,
  setup:({anchor,P})=>{const g=R3D.gabriel(anchor[0]+GO[0],anchor[1]+GO[1]);g.faceTo(P.x/ISO.TILE,P.y/ISO.TILE);g.to({kneel:1,head:.4,chest:.18,armR:0,armL:0},2.2);g.update(0,.5);return g},
  update:(T,dt,g)=>{if(!g)return;
   if(T>5)g.to({head:-.12,chest:-.02},1.6);if(T>14)g.to({head:.5,chest:.22},1.2);
   const hc=clamp((T-13.2)/2.2,0,1),lv=T<13.2?1:clamp(1-(T-14.6)/1.6,0,1)*(.75+.25*Math.sin(T*40));g.setHalo(lv,hc);   // grieta 13,2→15,4 s; se apaga ~16,2 s
   g.setDissolve(T<16.5?0:clamp((T-16.5)/5.5,0,1.05));g.update(T,dt)},
  cleanup:g=>{if(g)g.dispose()},
  shots:[{t:0,d:5,from:{x:GO[0],y:GO[1],zoom:1.5,z:.4},to:{zoom:1.9}},{t:5,d:3.5,from:{x:GO[0],y:GO[1],zoom:3.2,z:.9},to:{zoom:3.6},ease:'out'},
   {t:8.5,d:7.5,from:{x:GO[0],y:GO[1],zoom:2.4,z:.6},to:{zoom:2.7},sub:'Ahora también estarás maldito. Ve a liberar el mundo.'},{t:16,d:8,from:{x:GO[0],y:GO[1],zoom:2.2,z:.6},to:{zoom:1.6}}]};
 // «caida»: BORRADOR COMPLETO de «La caída de Gabriel» (CINE-3; el montaje fino con el dueño es CINE-4): Gabriel muere → el FRAGMENTO DEL TIEMPO sube de su pecho y flota hasta la mano del jugador →
 // TIEMPO DETENIDO (hueco para la visión de Nul'ru) → el fragmento se hunde en la palma → el CIELO ARDE (grado, grietas, brasas, escombros, temblor, coro y metales) → «Cien años.»
 SCENES.caida={dur:46,
  setup:({anchor,P})=>{const g=R3D.gabriel(anchor[0]+GO[0],anchor[1]+GO[1]);g.faceTo(P.x/ISO.TILE,P.y/ISO.TILE);g.to({kneel:1,head:.4,chest:.18},2.2);g.update(0,.5);
   const hp=R3D.W3(P.x,P.y,TER.standZ(P.x,P.y)),em=R3D.embers(420);em.at(hp.x,hp.z,hp.y);look=[GO[0],GO[1]];return{g,fr:R3D.fragment(),db:R3D.debris(90),em,hp,tmp:hp.clone(),vt:0,done:{}}},
  update:(T,dt,st)=>{if(!st)return;st.vt+=dt;const{g,fr,db,em,hp,tmp,vt}=st,once=(k,t,f)=>{if(T>=t&&!st.done[k]){st.done[k]=1;f()}},ez=u=>u<0?0:u>1?1:u*u*(3-2*u),S_=sfx;
   // Gabriel: cabizbajo → alza la cara → susurra (8–15 s) → el halo se agrieta (11,5–13,5) y se apaga → se disuelve (15–19,2 s)
   if(T>5)g.to({head:-.12,chest:-.02},1.6);if(T>14.5)g.to({head:.5,chest:.22},1.2);
   g.setHalo(T<11.5?1:clamp(1-(T-12.8)/1.4,0,1)*(.75+.25*Math.sin(T*40)),clamp((T-11.5)/2,0,1));g.setDissolve(T<15?0:clamp((T-15)/4.2,0,1.05));g.update(vt,dt);
   // fragmento: nace del pecho (15,4 s), sube, y de 17,5 a 23 s viaja en arco hasta la mano del héroe; en 23–26,5 s está quieto (tiempo detenido); de 26,5 a 28,2 se hunde en la palma
   const ch=g.base,hand=[hp.x+.4,hp.y+.75,hp.z-.11];   // sobre la palma abierta: el héroe se gira hacia ahí (look) y alarga la mano derecha; queda a la derecha en pantalla (fuera de su silueta: el héroe se compone en 2D por encima del 3D)
   look=T<19.5?[GO[0],GO[1]]:[(hand[0]-hp.x)*ISO.TILE,(hand[2]-hp.z)*ISO.TILE];   // primero mira a Gabriel; desde que nace el fragmento, mira cómo se acerca
   CINE.recv=T<20?0:T<26.5?ez((T-20)/2.6):1-ez((T-27)/1.4);   // pose de RECIBIR: sube con el fragmento, se mantiene en el tiempo detenido y baja al hundirse
   if(T<15.4){fr.set(tmp.set(ch.x,-50,ch.z),0)}
   else if(T<17.5){const u=ez((T-15.4)/2.1);fr.set(tmp.set(ch.x,ch.y+.65+.45*u,ch.z),Math.min(1,u*2.5+.05))}
   else if(T<23){const u=ez((T-17.5)/5.5),sx=ch.x,sz=ch.z,sy=ch.y+1.1;fr.set(tmp.set(sx+(hand[0]-sx)*u,sy+(hand[1]+.25-sy)*u+Math.sin(u*Math.PI)*.35,sz+(hand[2]-sz)*u),1)}
   else if(T<26.5)fr.set(tmp.set(hand[0],hand[1]+.25,hand[2]),1);
   else{const u=ez((T-26.5)/1.7);fr.set(tmp.set(hand[0]+(hp.x-hand[0])*u,hand[1]+.25-u*.3,hand[2]+(hp.z-hand[2])*u),1-u*.9)}   // se hunde en el pecho del héroe (queda tapado por su silueta)
   fr.beat=T<26.5||T>26.5;fr.update(vt,dt);
   // cielo: grado de fuego (R3D.skyBurn), resplandor y grietas (capa DOM), brasas y escombros
   once('burn',28,()=>{R3D.skyBurn=1});sky(clamp((T-28.6)/4,0,1)*(T<40?1:clamp(1-(T-40)/2.5,0,1)));
   em.level=clamp((T-28.5)/3,0,1)*(T<41?1:clamp(1-(T-41)/3,0,1));em.update(vt,dt);
   [[31,.5,-.3],[34,-1.1,.6],[36.5,.2,1.2],[38.5,-.6,-1]].forEach(([t,ox,oz],i)=>once('d'+i,t,()=>{db.burst(hp.x+ox*2,hp.z+oz*2,hp.y,i?18:26,3.2,5.5+i*.4);S_.boom(.14+i*.02)}));db.update(vt,dt);
   // audio (todo sintetizado; el volumen maestro baja solo en el tiempo detenido)
   once('a0',.3,()=>{S_.wind(20,.05);S_.choir(110,12,.04)});once('a1',8.4,()=>S_.choir(146.8,8,.04));once('halo',12.8,()=>S_.bell(880,.05));once('shim',15.2,()=>S_.shimmer(6,.035));
   once('snap',26.5,()=>S_.boom(.2));once('fire',28,()=>{S_.rumble(11,.13,0,110);S_.brass(110,8,.045);S_.choir(98,13,.06,0,[1,1.5,2,3])});once('bell',36,()=>S_.bell(220,.07))},
  cleanup:st=>{if(!st)return;st.g.dispose();st.fr.dispose();st.db.dispose();st.em.dispose()},
  flag:'gabriel',   // al terminar O saltar: S.cine.gabriel=1 (se guarda); el tutorial lo lee con CINE.seen('gabriel') y puede lanzarla con CINE.start('caida',{once:true})
  shots:[{t:0,d:4,from:{x:GO[0],y:GO[1],zoom:1.5,z:.4},to:{zoom:1.85}},{t:4,d:4,from:{x:GO[0],y:GO[1],zoom:3.2,z:.9},to:{zoom:3.6},ease:'out'},
   {t:8,d:7,from:{x:GO[0],y:GO[1],zoom:2.4,z:.6},to:{zoom:2.7},sub:'Ahora también estarás maldito. Ve a liberar el mundo.'},{t:15,d:4.2,from:{x:GO[0],y:GO[1],zoom:2.2,z:.9},to:{x:GO[0]*.85,y:GO[1]*.85,zoom:2.3}},
   {t:19.2,d:3.8,from:{x:GO[0]*.5,y:GO[1]*.5,zoom:1.9,z:.9},to:{x:GO[0]*.1+10,y:GO[1]*.1-6,zoom:2.5,z:.7},ease:'lin'},{t:23,d:3.5,from:{x:6,y:-4,zoom:3,z:.6},freeze:true},
   {t:26.5,d:3.5,from:{x:4,y:-2,zoom:3.1,z:.55},to:{x:0,y:0,zoom:2.5}},{t:30,d:10,from:{x:0,y:0,zoom:2.2,z:.7},to:{zoom:1.2,z:1.2},shake:.7,ease:'lin'},
   {t:40,d:2,from:{x:0,y:0,zoom:1.2,z:1.2},fade:[0,.92]},{t:42,d:4,from:{x:0,y:0,zoom:1.2,z:1.2},fade:[.92,1],sub:'Cien años.',card:true}]};
 // «gabrielIntro» (21 oct 2026, pedido del dueño: intro corta de jefe al estilo Dark Souls): la ARENA en calma con brasas → una columna de luz cae del cielo → Gabriel desciende y ATERRIZA (temblor, polvo, estruendo) arrodillado → se incorpora, el halo se enciende →
 // el título del jefe aparece en letras doradas espaciadas, con campana. Anclada en el centro de la arena (`SCENES.gabrielIntro.anchor` la pone isla.js antes de lanzarla); al acabar (o saltar) isla.js crea al Gabriel combatiente en ese mismo sitio.
 let GBT=null;
 SCENES.gabrielIntro={dur:13.2,
  setup:({anchor,P})=>{const g=R3D.gabriel(anchor[0],anchor[1]);g.faceTo(P.x/ISO.TILE,P.y/ISO.TILE);g.to({kneel:1,head:.5,chest:.2,armR:0,armL:0},.01);g.lift=14;g.grp.visible=false;g.update(0,.5);
   const hp=g.base,em=R3D.embers(260);em.at(hp.x,hp.z,hp.y);em.level=.5;
   if(!GBT){GBT=document.createElement('div');GBT.id='gbt';GBT.style.cssText='position:fixed;left:0;right:0;bottom:19%;text-align:center;pointer-events:none;z-index:100000;opacity:0;font-family:Cinzel,Spectral,serif;color:#e8cf94;text-shadow:0 0 18px #000,0 0 6px #000,0 2px 0 #000;transition:none';
    GBT.innerHTML='<div style="font-size:min(5.6vw,64px);letter-spacing:.42em;padding-left:.42em;font-weight:600">GABRIEL</div><div style="width:min(46vw,520px);height:1px;margin:.7em auto .8em;background:linear-gradient(90deg,transparent,#e8cf94,transparent)"></div><div style="font-size:min(2.3vw,26px);letter-spacing:.38em;padding-left:.38em;font-weight:600;text-shadow:0 0 14px #000,0 0 5px #000,0 2px 0 #000">EL VIGÍA DEL CIELO</div>';document.body.appendChild(GBT)}
   return{g,em,hp,db:R3D.debris(70),vt:0,done:{}}},
  update:(T,dt,st)=>{if(!st)return;st.vt+=dt;const{g,em,hp,db,vt}=st,once=(k,t,f)=>{if(T>=t&&!st.done[k]){st.done[k]=1;f()}},ez=u=>u<0?0:u>1?1:u*u*(3-2*u),S_=sfx;
   // 3,0–5,2 s: la columna de luz se enciende y Gabriel cae (aceleración); 5,2 s: impacto; 6,6–8,6 s: se incorpora
   const fu=clamp((T-3)/2.2,0,1),fall=fu*fu;g.lift=T<3?14:14*(1-fall);g.grp.visible=T>=3.1;
   const bm=T<2.6?0:T<5.2?ez((T-2.6)/1.2):clamp(1-(T-5.2)/1.8,0,1);g.setBeam(.62*bm*(0.85+.15*Math.sin(T*31)),.55+.5*bm+(T>5.2?clamp(T-5.2,0,1)*.5:0));
   g.to(T<3.2?{kneel:1}:T<5.2?{kneel:0,head:-.25,chest:-.1,armR:-.35,armL:-.35}:T<6.6?{kneel:1,head:.5,chest:.22,armR:0,armL:0}:{kneel:0,head:-.1,chest:.0},T<5.3?5:T<6.6?9:1.5);
   g.setHalo(T<7.4?.15:clamp(.15+(T-7.4)/1.2,0,1),.35);g.update(vt,dt);em.update(vt,dt);db.update(vt,dt);
   once('a0',.2,()=>{S_.wind(12,.05);S_.choir(98,11,.04,0,[1,1.5,2,3])});once('a1',2.6,()=>{S_.shimmer(3,.05);S_.rumble(3,.08,0,90)});
   once('hit',5.2,()=>{S_.boom(.3);S_.rumble(3,.12,0,160);db.burst(hp.x,hp.z,hp.y,40,4.5,3.2);em.level=1;
    try{sp(anc[0],anc[1]+4,'#cfc8b6',24,170,30,40);sp(anc[0],anc[1],'#ffe9a8',14,150,90,120)}catch(e){}});
   once('brass',6.8,()=>{S_.brass(73.4,4.5,.06);S_.choir(73.4,6,.06,0,[1,1.5,2])});once('bell',9.9,()=>S_.bell(196,.09));
   if(GBT){const a=T<9.8?0:T<10.8?ez(T-9.8):T<12.4?1:clamp(1-(T-12.4)/.8,0,1);GBT.style.opacity=a.toFixed(3);GBT.style.transform='scale('+(1+.035*clamp((T-9.8)/3.4,0,1)).toFixed(4)+')'}},
  cleanup:st=>{if(GBT){GBT.remove();GBT=null}if(!st)return;st.g.dispose();st.em.dispose();st.db.dispose()},
  shots:[{t:0,d:3.2,from:{x:0,y:150,zoom:1.15,z:.5},to:{x:0,y:110,zoom:1.35,z:.6},ease:'out'},
   {t:3.2,d:2.1,from:{x:0,y:50,zoom:1.55,z:2.2},to:{x:0,y:20,zoom:1.9,z:.5},shake:.55,ease:'in'},
   {t:5.3,d:1.4,from:{x:6,y:44,zoom:2.5,z:.5},to:{x:0,y:40,zoom:2.8,z:.55},shake:1.1,ease:'out'},
   {t:6.7,d:3.2,from:{x:0,y:36,zoom:3.3,z:.85},to:{x:0,y:30,zoom:3.7,z:1.05},ease:'lin'},
   {t:9.9,d:3.3,from:{x:0,y:96,zoom:2.1,z:.85},to:{x:0,y:130,zoom:1.75,z:.9},ease:'lin'}]};
 return{get on(){return on},get T(){return T},get recv(){return recv},set recv(v){recv=clamp(+v||0,0,1)},get look(){return look},set look(v){look=v},seen,mark,seek:t=>{if(on)T=t},start,end,tick,cam,sky,sfx,SCENES,list:()=>Object.keys(SCENES)}})();
