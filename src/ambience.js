// NotScape · SONIDO AMBIENTE POR BIOMA (21 oct 2026; pack `matmos` aportado por el dueño; SIN las pistas `music.*`: no son la música que busca). Global `AMB`. Archivos en assets/sfx/amb/ (+ manifest.json por grupos, igual que las pisadas).
// QUÉ HACE: por cada bioma (índice = BIOMES.list) hay una CAPA con (1) un LECHO continuo (viento u oleaje, archivos largos encadenados con fundido) y (2) SONIDOS PUNTUALES con intervalos al azar, distintos de DÍA y de NOCHE (pájaros, grillos, búhos, coyotes…).
//   Al cambiar de bioma las capas se cruzan con un fundido de ≈ 1,6 s; dentro de un edificio suena solo el viento de interior; la LLUVIA es una capa aparte que sigue `BR.wet`/`WXD` (eventos de clima de biome-rules.js); el trueno del juego (`SND.thunder`) usa las grabaciones.
//   También `AMB.take(id)` = sonido al EQUIPAR (espada, arco, armadura, herramienta, genérico) y `AMB.food()` al comer.
// VOLUMEN: BAJO por defecto (`AMB.vol` .2, ajustable; sigue el volumen de efectos S.sv, S.mute y el maestro AMASTER que bajan los eventos de bioma). `?noamb` lo apaga. Carga perezosa por grupo (se descarga y decodifica al entrar en el bioma) y descarga de lo que no se usa.
// AÑADIR UN BIOMA: una fila en CFG (mismo índice que BIOMES.list). Los nombres de grupo son los del manifiesto (nombre del archivo sin el número final).
const AMB=(()=>{
 const DIR='assets/sfx/amb/';
 // lecho: [grupos de archivos largos, volumen] · día/noche: [{g grupo, e:[min,max] segundos entre sonidos, v volumen}]
 const WIND=['weather.wind.wind'],TREE=['wind.tree','weather.wind.ogtreewind'];
 const CFG=[
  /*0 Pradera*/ {bed:[WIND,.2],day:[{g:'biome.plain.day.bird',e:[3.5,10],v:.5}],night:[{g:'biome.plain.night.cricket',e:[3,7],v:.4},{g:'biome.plain.night.owl',e:[20,45],v:.45}]},
  /*1 Bosque*/  {bed:[TREE,.3],day:[{g:'biome.forest.day.bird',e:[2.5,8],v:.55}],night:[{g:'biome.forest.night.cricket',e:[4,9],v:.4},{g:'biome.plain.night.owl',e:[15,35],v:.5}]},
  /*2 Pantano*/ {bed:[['block.water.waterstill'],.22],day:[{g:'biome.jungle.day.ambiant',e:[5,12],v:.5}],night:[{g:'biome.jungle.night.ambiant',e:[6,14],v:.5}]},
  /*3 Cumbres*/ {bed:[['weather.wind.snowwind','weather.wind.strongwind'],.28],day:[{g:'weather.wind.ogstrongwind',e:[18,40],v:.35}],night:[{g:'weather.wind.ogstrongwind',e:[14,32],v:.4}]},
  /*4 Oriental*/{bed:[TREE,.22],day:[{g:'biome.plain.day.bird',e:[5,13],v:.4},{g:'block.water.waterstill',e:[10,22],v:.3}],night:[{g:'biome.plain.night.cricket',e:[3.5,8],v:.4}]},
  /*5 Volcán*/  {bed:[['biome.nether.ambiant'],.3],day:[{g:'biome.nether.moan',e:[28,65],v:.25},{g:'weather.wind.strongwind',e:[20,45],v:.2}],night:[{g:'biome.nether.moan',e:[22,50],v:.28}]},
  /*6 Páramo*/  {bed:[WIND,.16],day:[{g:'cave.ambiant',e:[9,22],v:.35}],night:[{g:'cave.darkambiant',e:[8,20],v:.4}]},
  /*7 Desierto*/{bed:[WIND,.2],day:[{g:'biome.desert.day.ambiant',e:[6,14],v:.45}],night:[{g:'biome.desert.night.coyote',e:[22,48],v:.4},{g:'biome.desert.night.snake',e:[30,70],v:.3}]},
  /*8 Costa*/   {bed:[['weather.wind.strongwind','block.water.waterstill'],.26],day:[{g:'block.water.waterfall',e:[24,50],v:.18}],night:[{g:'weather.wind.ogstrongwind',e:[16,36],v:.3}]},
  /*9 Cielo*/   {bed:[['weather.wind.wind','weather.wind.ogstrongwind'],.2],day:[],night:[]}];
 const INTERIOR=[['weather.wind.interiorwind'],.22],RAIN=[['wind.rain'],.5];
 let M=null,mLoad=null,vol=.2,on=!/[?&]noamb\b/.test(typeof location!=='undefined'?location.search:''),bus=null,cur=null,st={n:0,cur:null,plays:0};
 const BUF={},LD={},USE={},layers={};const ac_=()=>{try{return typeof ac==='function'?ac():null}catch(e){return null}};
 const rnd=(a,b)=>a+Math.random()*(b-a);
 const manifest=()=>mLoad||(mLoad=fetch(DIR+'manifest.json').then(r=>r.json()).then(j=>{M=j}).catch(()=>{M={}}));
 // descarga + decodifica un grupo; normaliza cada archivo (RMS ≈ .05) con un tope para no subir el ruido de fondo
 function load(group,a){USE[group]=performance.now();if(LD[group])return;LD[group]=1;BUF[group]=[];manifest().then(()=>{(M[group]||[]).forEach((f,i)=>fetch(DIR+f).then(r=>r.arrayBuffer()).then(b=>new Promise((ok,no)=>a.decodeAudioData(b,ok,no))).then(d=>{
   const c=d.getChannelData(0);let s=0,n=0;const stp=Math.max(1,c.length/6000|0);for(let k=0;k<c.length;k+=stp){s+=c[k]*c[k];n++}const rms=Math.sqrt(s/Math.max(1,n))||.05;BUF[group][i]={d,g:Math.max(.3,Math.min(2.2,.05/rms))}}).catch(()=>{}))})}
 const have=g=>(BUF[g]||[]).filter(Boolean);
 function pick(g,avoid){const L=have(g);if(!L.length)return null;let e=L[Math.floor(Math.random()*L.length)];if(L.length>1&&e===avoid)e=L[(L.indexOf(e)+1)%L.length];return e}
 function layer(key){let l=layers[key];if(l)return l;const a=ac_();if(!a)return null;if(!bus){bus=a.createGain();bus.connect(typeof AMASTER!=='undefined'&&AMASTER?AMASTER:a.destination)}
  l={key,gain:a.createGain(),bedOn:false,bedT:0,due:{},last:{}};l.gain.gain.value=0;l.gain.connect(bus);return layers[key]=l}
 function bedStart(l,def){if(l.bedOn)return;l.bedOn=true;const a=ac_(),next=()=>{if(!l.bedOn||!a)return;const gr=def[0][Math.floor(Math.random()*def[0].length)];def[0].forEach(g=>load(g,a));const e=pick(gr,l.lastBed);
   if(!e){l.bedT=setTimeout(next,800);return}l.lastBed=e;const src=a.createBufferSource(),g=a.createGain(),t=a.currentTime,D=e.d.duration,fi=Math.min(1.8,D/3),v=e.g*def[1];src.buffer=e.d;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+fi);g.gain.setValueAtTime(v,t+Math.max(fi,D-fi));g.gain.linearRampToValueAtTime(0,t+D);src.connect(g);g.connect(l.gain);src.start(t);l.bedT=setTimeout(next,Math.max(500,(D-fi)*1000))};next()}
 function bedStop(l){l.bedOn=false;clearTimeout(l.bedT)}
 function oneShot(l,gr,v,pan){const a=ac_(),e=pick(gr.g,l.last[gr.g]);if(!e)return false;l.last[gr.g]=e;const src=a.createBufferSource(),g=a.createGain();src.buffer=e.d;src.playbackRate.value=.96+Math.random()*.08;g.gain.value=e.g*v*(.8+Math.random()*.4);
  let out=g;if(a.createStereoPanner){const p=a.createStereoPanner();p.pan.value=pan;g.connect(p);out=p}src.connect(g);out.connect(l.gain);src.start();st.plays++;return true}
 const night=now=>{try{return typeof sunS==='function'&&sunS(now/1000)<-.05}catch(e){return false}};
 let lastT=0,evT=0;
 function tick(now,dt){if(!on)return;const a=ac_();if(!a||typeof UNL==='undefined'||!UNL||(typeof S!=='undefined'&&S.mute)){if(bus)bus.gain.value=0;return}
  if(!bus)layer('x');const sv=typeof S!=='undefined'&&S.sv!=null?S.sv/100:1;bus.gain.value=vol*sv;
  const inInt=typeof INT!=='undefined'&&INT,k=inInt?'int':Math.max(0,Math.min(CFG.length-1,typeof curB==='number'?curB:0)),nt=!inInt&&k!==9&&night(now);cur=k;st.cur=k;
  // capas: la activa sube, las demás bajan; el lecho solo corre mientras la capa suena
  const keys=['int','rain'].concat(CFG.map((_,i)=>i));
  const wet=typeof WXD==='number'?Math.min(1,WXD):0,rainT=(!inInt?wet:wet*.3)*(typeof WX!=='undefined'&&(WX.t==='rain'||WX.t==='storm')?1:0);
  for(const key of keys){const l=layer(key);if(!l)continue;const tgt=key==='rain'?rainT:(key===k?1:0),def=key==='rain'?RAIN:key==='int'?INTERIOR:CFG[key].bed;
   if(Math.abs((l.tg==null?-1:l.tg)-tgt)>.02){l.tg=tgt;l.gain.gain.setTargetAtTime(tgt,a.currentTime,1.6)}
   if(tgt>.02){if(!l.bedOn){def[0].forEach(g=>load(g,a));bedStart(l,def)}}else if(l.bedOn&&l.gain.gain.value<.01)bedStop(l)}
  // sonidos puntuales de la capa activa
  if(k!=='int'){const l=layer(k),C=CFG[k],list=(nt?C.night:C.day)||[];for(const gr of list){load(gr.g,a);const key=gr.g+(nt?'n':'d');if(l.due[key]==null)l.due[key]=now+rnd(gr.e[0],gr.e[1])*1000*.4;if(now>=l.due[key]){if(oneShot(l,gr,gr.v,rnd(-.7,.7)))l.due[key]=now+rnd(gr.e[0],gr.e[1])*1000;else l.due[key]=now+1500}}}
  // descarga lo que no se usa desde hace 3 minutos (memoria)
  if(now-evT>60000){evT=now;for(const g in BUF)if(now-(USE[g]||0)>180000&&!/^weather\.wind\.wind$/.test(g)){delete BUF[g];delete LD[g]}}}
 // sonido al equipar un objeto
 function take(id){if(!on||typeof UNL==='undefined'||!UNL||(typeof S!=='undefined'&&S.mute))return;const a=ac_();if(!a)return;id=String(id||'');
  const g=/^lw_\d+[dm]/.test(id)||/^sw_/.test(id)?'takesword':/^bw_|^lw_\d+b/.test(id)?'takebow':/^(ar_|lg_|gl_|sh_|lt_|cl_|hl_|bt_)/.test(id)?'takearme':/^(ax_|pk_|rd_|tl:)/.test(id)?'takeutility':id==='food'?'takefood':'takegeneric';
  load(g,a);const e=pick(g);if(!e)return;if(!bus)layer('x');const src=a.createBufferSource(),gn=a.createGain();src.buffer=e.d;gn.gain.value=Math.min(1.5,e.g*.6);src.connect(gn);gn.connect(bus);src.start()}
 function thunder(){if(!on||typeof UNL==='undefined'||!UNL||(typeof S!=='undefined'&&S.mute))return false;const a=ac_();if(!a)return false;load('weather.thunder.thunder',a);const e=pick('weather.thunder.thunder');if(!e)return false;if(!bus)layer('x');const src=a.createBufferSource(),gn=a.createGain();src.buffer=e.d;gn.gain.value=Math.min(1.6,e.g*.9);src.connect(gn);gn.connect(bus);src.start();return true}
 return{tick,take,food:()=>take('food'),thunder,CFG,stats:st,get on(){return on},set on(v){on=!!v},get vol(){return vol},set vol(v){vol=Math.max(0,Math.min(1,+v||0))},get cur(){return cur}}})();
