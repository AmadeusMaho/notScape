// NotScape · SONIDO PROCEDURAL «REALISTA» DE COMBATE (lote N0-FX-SHADERS, 2 nov 2026; el dueño: «no hace falta que hagas todo con sonidos sintéticos si puedes diseñarlos más realistas»).
// Global `SFXS`. No hay archivos de sonido de combate con licencia en el proyecto (descargar packs pide permiso del dueño), así que esto es DISEÑO DE SONIDO por capas con WebAudio:
//   · bus propio con compresor + REVERBERACIÓN de convolución con respuesta al impulso GENERADA (ruido con caída exponencial y filtrado, estéreo);
//   · ruido blanco/rosa en búferes precalculados con filtros que BARREN (silbidos de arma, rugido del fuego, viento);
//   · transitorios (clic + golpe grave) para los impactos, parciales inarmónicos para el metal, granos para la piedra;
//   · CUERDA FÍSICA (Karplus-Strong precalculado y cacheado) para el arco y la ballesta;
//   · campanas FM (magia, hielo), coro de senos desafinados con vibrato (sagrado), sierra con tartamudeo (electricidad), burbujas con glissando (veneno).
// Respeta `S.mute` y el volumen de efectos `S.sv`; máx. MAXV SONIDOS a la vez (cada uno ~1 s; un sonido son varias capas) y un antirrebote por sonido (no satura en peleas grandes; lote PELEA-MULTITUD).
// API: `SFXS.play(nombre,{k,pan})` con nombre ∈ swoosh, swooshHeavy, whirl, hitFlesh, hitMetal, hitStone, fire, ice, shock, poison, blood, void, arcane, holy, powerup, stun, execute, bow, crossbow.
// Sonido nuevo = una función en `V`. Prueba: `SFXS.play('fire')` en la consola.
const SFXS=(()=>{
 let C=null,bus=null,rev=null,NB=null,PB=null,act=0;const MAXV=10,last={},KS={};
 const R=(a,b)=>a+Math.random()*(b-a);
 function ctx(){const a=typeof ac==='function'?ac():null;if(!a||(typeof S!=='undefined'&&S.mute))return null;if(a!==C){C=a;build()}return a}
 function build(){const sr=C.sampleRate;bus=C.createGain();bus.gain.value=1;const comp=C.createDynamicsCompressor();comp.threshold.value=-16;comp.knee.value=12;comp.ratio.value=4;comp.attack.value=.003;comp.release.value=.18;bus.connect(comp);comp.connect(C.destination);
  const len=sr*1.8|0,ir=C.createBuffer(2,len,sr);for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);let lp=0;for(let i=0;i<len;i++){const x=Math.random()*2-1;lp+=(x-lp)*(.18+.6*(1-i/len));d[i]=lp*Math.pow(1-i/len,3.4)*(i<sr*.012?i/(sr*.012):1)}}
  rev=C.createConvolver();rev.buffer=ir;const rg=C.createGain();rg.gain.value=.5;rev.connect(rg);rg.connect(comp);
  NB=C.createBuffer(1,sr*2,sr);{const d=NB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
  PB=C.createBuffer(1,sr*2,sr);{const d=PB.getChannelData(0);let b0=0,b1=0,b2=0;for(let i=0;i<d.length;i++){const w=Math.random()*2-1;b0=.997*b0+.029591*w;b1=.985*b1+.032534*w;b2=.95*b2+.048056*w;d[i]=(b0+b1+b2+.1848*w)*.25}}}
 const vol=()=>Math.max(0,Math.min(1.5,(typeof S!=='undefined'&&S.sv!=null?S.sv:70)/100));
 // salida de una voz: ganancia final → panorama → bus (+ envío a reverberación)
 function out(node,t,dur,send,pan){const g=C.createGain();g.gain.value=vol();node.connect(g);let o=g;if(C.createStereoPanner){const p=C.createStereoPanner();p.pan.value=Math.max(-1,Math.min(1,pan||0));g.connect(p);o=p}o.connect(bus);if(send){const s=C.createGain();s.gain.value=send;o.connect(s);s.connect(rev)}setTimeout(()=>{try{g.disconnect()}catch(e){}},(t-C.currentTime+dur+.1)*1000)}
 function env(g,t,at,pk,dec,curve){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,pk),t+at);g.gain.exponentialRampToValueAtTime(.0001,t+at+dec*(curve||1))}
 // ruido filtrado con barrido de frecuencia
 function nz(t,o){const s=C.createBufferSource();s.buffer=o.pink?PB:NB;const off=Math.random()*1.5;const f=C.createBiquadFilter();f.type=o.ft||'bandpass';f.Q.value=o.q||1;f.frequency.setValueAtTime(o.f0,t);if(o.f1)f.frequency.exponentialRampToValueAtTime(o.f1,t+(o.fd||o.at+o.dec));
  const g=C.createGain();env(g,t,o.at||.005,o.v||.2,o.dec||.15);s.connect(f);f.connect(g);out(g,t,(o.at||.005)+(o.dec||.15),o.rv||0,o.pan);s.start(t,off,(o.at||.005)+(o.dec||.15)+.05)}
 // oscilador con glissando
 function os(t,o){const s=C.createOscillator();s.type=o.ty||'sine';s.frequency.setValueAtTime(o.f0,t);if(o.f1)s.frequency.exponentialRampToValueAtTime(Math.max(20,o.f1),t+(o.fd||o.at+o.dec));if(o.det)s.detune.value=o.det;
  const g=C.createGain();env(g,t,o.at||.005,o.v||.15,o.dec||.2);let n=s;if(o.lp){const f=C.createBiquadFilter();f.type='lowpass';f.frequency.value=o.lp;s.connect(f);n=f}n.connect(g);out(g,t,(o.at||.005)+(o.dec||.2),o.rv||0,o.pan);s.start(t);s.stop(t+(o.at||.005)+(o.dec||.2)+.05);return s}
 // campana FM (portadora + moduladora con índice que decae)
 function bell(t,f,v,dec,ratio,idx,rv,pan){const c=C.createOscillator(),m=C.createOscillator(),mg=C.createGain(),g=C.createGain();c.frequency.value=f;m.frequency.value=f*(ratio||3.5);mg.gain.setValueAtTime(f*(idx||2.5),t);mg.gain.exponentialRampToValueAtTime(f*.05,t+dec);m.connect(mg);mg.connect(c.frequency);env(g,t,.003,v,dec);c.connect(g);out(g,t,dec+.01,rv||.4,pan);c.start(t);m.start(t);c.stop(t+dec+.06);m.stop(t+dec+.06)}
 // cuerda pulsada (Karplus-Strong) precalculada
 function ks(f,dur,damp){const k=f+'|'+dur+'|'+damp;if(KS[k])return KS[k];const sr=C.sampleRate,n=sr*dur|0,b=C.createBuffer(1,n,sr),d=b.getChannelData(0),P=Math.max(2,Math.round(sr/f)),ring=new Float32Array(P);for(let i=0;i<P;i++)ring[i]=Math.random()*2-1;let ix=0;for(let i=0;i<n;i++){const nx=(ix+1)%P,y=(ring[ix]+ring[nx])*.5*damp;d[i]=ring[ix];ring[ix]=y;ix=nx}return KS[k]=b}
 function pluck(t,f,v,dur,damp,rv,pan){const s=C.createBufferSource();s.buffer=ks(f,dur,damp||.996);const g=C.createGain();g.gain.value=v;s.connect(g);out(g,t,dur,rv||.15,pan);s.start(t)}
 // transitorio de impacto: clic agudo + golpe grave
 function thump(t,f,v,dec,pan){os(t,{f0:f*2.2,f1:f,fd:.05,at:.002,dec:dec||.16,v:v||.3,pan});nz(t,{ft:'highpass',f0:2600,at:.001,dec:.018,v:(v||.3)*.6,pan})}
 const V={
  swoosh:(t,k,p)=>{nz(t,{f0:700,f1:3600,fd:.12,q:1.6,at:.03,dec:.13,v:.16*k,pan:p,rv:.08});nz(t+.02,{ft:'lowpass',f0:500,at:.03,dec:.1,v:.06*k,pan:p})},
  swooshHeavy:(t,k,p)=>{nz(t,{f0:260,f1:1300,fd:.22,q:1.1,at:.06,dec:.22,v:.24*k,pan:p,rv:.12});nz(t,{ft:'lowpass',f0:180,at:.05,dec:.25,v:.12*k,pan:p,pink:1})},
  whirl:(t,k,p)=>{for(let i=0;i<4;i++)nz(t+i*.07,{f0:500+i*120,f1:2600,fd:.11,q:1.4,at:.025,dec:.1,v:.13*k,pan:Math.sin(i*1.6)*.6,rv:.1});nz(t,{ft:'lowpass',f0:220,f1:520,fd:.35,at:.08,dec:.3,v:.1*k,pink:1})},
  hitFlesh:(t,k,p)=>{thump(t,95,.32*k,.14,p);nz(t+.004,{ft:'lowpass',f0:1100,f1:300,fd:.07,at:.002,dec:.08,v:.22*k,pan:p})},
  hitMetal:(t,k,p)=>{thump(t,140,.22*k,.1,p);[523,1347,2411,3803].forEach((f,i)=>os(t,{f0:f*R(.98,1.02),at:.001,dec:.5-i*.08,v:.06*k/(i+1),rv:.35,pan:p}))},
  hitStone:(t,k,p)=>{thump(t,70,.38*k,.2,p);for(let i=0;i<7;i++)nz(t+R(0,.12),{f0:R(400,1800),q:4,at:.001,dec:R(.02,.05),v:.08*k,pan:p+R(-.2,.2)})},
  fire:(t,k,p)=>{nz(t,{ft:'lowpass',f0:350,f1:1100,fd:.25,at:.04,dec:.45,v:.22*k,pink:1,rv:.2,pan:p});nz(t,{f0:900,f1:300,fd:.4,q:.7,at:.02,dec:.4,v:.08*k,pan:p});for(let i=0;i<10;i++)nz(t+R(0,.5),{ft:'highpass',f0:R(2500,6000),at:.001,dec:R(.004,.015),v:R(.05,.13)*k,pan:p+R(-.3,.3)})},
  ice:(t,k,p)=>{nz(t,{ft:'highpass',f0:3500,at:.002,dec:.05,v:.18*k,pan:p});for(let i=0;i<6;i++)bell(t+R(0,.3),R(2400,5200),.035*k,R(.25,.6),R(2.6,4.4),1.8,.5,p+R(-.4,.4));nz(t+.03,{f0:6000,f1:2500,fd:.4,q:2,at:.02,dec:.4,v:.05*k,rv:.4,pan:p})},
  shock:(t,k,p)=>{const s=C.createOscillator();s.type='sawtooth';s.frequency.value=R(70,95);const g=C.createGain();g.gain.setValueAtTime(.0001,t);for(let i=0,tt=t;i<22;i++,tt+=.016)g.gain.setValueAtTime(Math.random()<.6?.09*k:.0001,tt);g.gain.setValueAtTime(.0001,t+.36);const f=C.createBiquadFilter();f.type='bandpass';f.frequency.value=1800;f.Q.value=.8;s.connect(f);f.connect(g);out(g,t,.38,.15,p);s.start(t);s.stop(t+.4);
   nz(t,{ft:'highpass',f0:3000,at:.001,dec:.03,v:.22*k,pan:p});for(let i=0;i<6;i++)nz(t+R(0,.3),{f0:R(2000,5000),q:3,at:.001,dec:.012,v:.12*k,pan:p+R(-.3,.3)})},
  poison:(t,k,p)=>{nz(t,{ft:'lowpass',f0:700,at:.03,dec:.3,v:.08*k,pan:p});for(let i=0;i<8;i++){const f=R(260,520);os(t+R(0,.45),{f0:f,f1:f*R(1.8,2.6),fd:.05,at:.004,dec:.06,v:.07*k,lp:1600,pan:p+R(-.3,.3),rv:.1})}},
  blood:(t,k,p)=>{thump(t,85,.28*k,.12,p);nz(t+.005,{ft:'lowpass',f0:900,f1:250,fd:.12,at:.003,dec:.14,v:.26*k,pan:p});os(t+.02,{f0:210,f1:75,fd:.12,at:.005,dec:.12,v:.08*k,lp:600,pan:p})},
  void:(t,k,p)=>{nz(t,{ft:'lowpass',f0:180,f1:700,fd:.35,at:.32,dec:.12,v:.22*k,pink:1,rv:.35,pan:p});os(t,{f0:58,f1:42,fd:.6,at:.08,dec:.55,v:.22*k,rv:.3,pan:p});[0,-14,9].forEach(d=>os(t,{ty:'sawtooth',f0:110,det:d,at:.2,dec:.4,v:.03*k,lp:500,rv:.4,pan:p}))},
  arcane:(t,k,p)=>{[0,4,7].forEach((st,i)=>bell(t+i*.035,440*Math.pow(2,(st+12)/12),.07*k,.8,2.01,1.5,.55,p+(i-1)*.25));nz(t,{ft:'highpass',f0:5000,at:.05,dec:.35,v:.04*k,rv:.5,pan:p})},
  holy:(t,k,p)=>{[0,4,7,12,16].forEach((st,i)=>{const s=os(t,{f0:330*Math.pow(2,st/12),det:R(-9,9),at:.18,dec:.7,v:.035*k,rv:.6,pan:p+R(-.3,.3)});try{const l=C.createOscillator(),lg=C.createGain();l.frequency.value=R(4.5,6);lg.gain.value=4;l.connect(lg);lg.connect(s.frequency);l.start(t);l.stop(t+.95)}catch(e){}})},
  powerup:(t,k,p)=>{nz(t,{f0:300,f1:3200,fd:.45,q:1.8,at:.4,dec:.12,v:.12*k,rv:.3,pan:p});[0,4,7].forEach((st,i)=>os(t+.3+i*.06,{ty:'triangle',f0:392*Math.pow(2,st/12),at:.01,dec:.35,v:.06*k,rv:.4,pan:p}))},
  stun:(t,k,p)=>{thump(t,60,.45*k,.28,p);nz(t,{ft:'lowpass',f0:400,f1:120,fd:.2,at:.003,dec:.22,v:.25*k,pan:p});os(t+.05,{f0:3150,at:.05,dec:.75,v:.025*k,pan:p})},
  execute:(t,k,p)=>{V.swooshHeavy(t,k,p);const tt=t+.14;os(tt,{f0:75,f1:32,fd:.5,at:.003,dec:.55,v:.4*k,rv:.3,pan:p});nz(tt,{ft:'lowpass',f0:800,f1:150,fd:.3,at:.002,dec:.35,v:.3*k,rv:.25,pan:p});V.hitMetal(tt,.8*k,p)},
  bow:(t,k,p)=>{pluck(t,R(98,112),.35*k,.5,.994,.12,p);nz(t+.02,{f0:1800,f1:4500,fd:.1,q:2,at:.01,dec:.09,v:.07*k,pan:p})},
  crossbow:(t,k,p)=>{nz(t,{ft:'highpass',f0:1800,at:.001,dec:.012,v:.25*k,pan:p});nz(t+.035,{ft:'highpass',f0:1200,at:.001,dec:.015,v:.18*k,pan:p});pluck(t+.01,R(70,80),.4*k,.4,.99,.1,p);thump(t+.02,120,.15*k,.08,p)}
 };
 function play(name,o){const f=V[name];if(!f)return false;const a=ctx();if(!a||!bus)return false;const now=performance.now();if(now-(last[name]||0)<45||act>=MAXV)return false;last[name]=now;o=o||{};
  act++;setTimeout(()=>{act=Math.max(0,act-1)},1100);try{f(a.currentTime+.005,Math.max(.3,Math.min(1.6,o.k||1)),o.pan||0)}catch(e){console.warn('[SFXS]',name,e)}return true}
 return{play,V,get voces(){return act}}})();
