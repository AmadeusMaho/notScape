// NotScape · F6-música · MUSIC: música por bioma y por situación con fundidos suaves.
// Cada bioma con pistas en DEF suena así (prioridad): jefe (combate contra un jefe) > combate > aldea (dentro del pueblo) > noche (de noche, fuera del pueblo) > mundo.
// Los fundidos son de potencia igual (sin) entre la pista que sale y la que entra; al apagarse, aldea/mundo/noche se PAUSAN y siguen donde iban; combate y jefe vuelven al inicio.
// Bucle sin corte: cada pista tiene dos <audio>; en los últimos LOOPX segundos la copia B entra desde el principio mientras la A se apaga (las pistas de Suno acaban con fundido de salida).
// Biomas sin entrada en DEF devuelven false → game.js usa la música antigua (síntesis / amber-tavern-dragon). Un bioma nuevo = una fila en DEF con 5 nombres de assets/music/*.mp3.
const MUSIC=(()=>{
 const LOOPX=3.5,DIR='assets/music/';
 // DIRS: carpeta propia opcional por bioma (hoy vacío: todos leen de assets/music/).
 const DIRS={};
 const DEF={0:{aldea:'pradera_aldea',mundo:'pradera_mundo',combate:'pradera_combate',jefe:'pradera_jefe',noche:'pradera_noche'},1:{aldea:'bosque_aldea',mundo:'bosque_mundo',combate:'bosque_combate',jefe:'bosque_jefe',noche:'bosque_noche'},2:{aldea:'pantano_aldea',mundo:'pantano_mundo',combate:'pantano_combate',jefe:'pantano_jefe',noche:'pantano_noche'},3:{aldea:'cumbres_aldea',mundo:'cumbres_mundo',combate:'cumbres_combate',jefe:'cumbres_jefe',noche:'cumbres_noche'},4:{aldea:'oriental_aldea',mundo:'oriental_mundo',combate:'oriental_combate',jefe:'oriental_jefe',noche:'oriental_noche'},5:{aldea:'volcan_aldea',mundo:'volcan_mundo',combate:'volcan_combate',jefe:'volcan_jefe',noche:'volcan_noche'}};
 // EL CIELO (21 oct 2026; pistas del dueño, PROVISIONALES: se revisan en un paso final): `cielo.mp3` (heaven, 9 min 33 s) suena en la isla/bioma en TODAS las situaciones menos contra GABRIEL, que tiene su propia pista `cielo_jefe.mp3` (gabriel, 4 min 30 s).
 // Las situaciones que apuntan al MISMO archivo que `mundo` se tratan como `mundo` (no reinicia la canción al entrar en combate o en la aldea).
 DEF[9]={aldea:'cielo',mundo:'cielo',combate:'cielo',jefe:'cielo_jefe',noche:'cielo'};
 // NORMALIZACIÓN por pista (medida en el navegador: RMS con puerta, bloques de 400 ms): heaven −16,4 dBFS (pico 0 dB) y gabriel −15,8 dBFS (pico −1,4 dB) son más fuertes que el resto del juego; se bajan a ≈ −22 dBFS de RMS
 // (×0,52 y ×0,49). Solo se puede ATENUAR (HTMLAudio.volume ≤ 1): las pistas nuevas que sean más bajas se ajustan bajando las demás. Clave = nombre de archivo.
 const TG={cielo:.52,cielo_jefe:.49,wakeup:.9,all_i_had_to_do:.35};   // wakeup y all_i_had_to_do (22 oct 2026, pistas del dueño; RMS medido −20,1 y −11,8 dBFS con puerta) → ≈ −21 dBFS como el resto
 // i/o: segundos de fundido de entrada/salida; g: ganancia relativa; rs: reinicia al apagarse
 const KIND={aldea:{i:3,o:3,g:.9},mundo:{i:3,o:3,g:.9},noche:{i:4,o:4,g:.85},combate:{i:.9,o:2.6,g:.95,rs:1},jefe:{i:.7,o:3.2,g:1,rs:1}};

 // MÚSICA DE ESCENA (22 oct 2026; pedido del dueño): pistas de secuencias/cinemáticas que SUSTITUYEN a la música del bioma mientras duran, con fundidos de potencia igual como el resto de la OST (la del bioma se apaga sola y vuelve al terminar).
 // `MUSIC.scene(id,true|false)`; `start` = segundo desde el que arranca (y al que vuelve al repetirse). wakeup = despertar en la playa con Ru; all_i_had_to_do = el cielo en llamas (arranca en 0:25).
 const SCD={wakeup:{i:3.5,o:4.5,start:0},all_i_had_to_do:{i:4.5,o:3,start:25}},SCN={};
 const T={},cl=(v,a,b)=>Math.max(a,Math.min(b,v));
 let dbg=null;
 function mk(k,kind){const id=k+'_'+kind;if(T[id])return T[id];const t=T[id]={id,k,kind,v:0,cur:0,dead:false,a:[0,1].map(i=>{const a=new Audio((DIRS[k]||DIR)+DEF[k][kind]+'.mp3');a.preload=i?'none':'auto';   /* FLUIDEZ F16 (26 oct 2026): la 2.ª copia (la del cruce al repetirse) ya no se descarga al entrar en el bioma: se pide 30 s antes del final (step) */a.loop=false;a.volume=0;a.addEventListener('error',()=>{t.dead=true});return a})};return t}
 const play=a=>{const p=a.play();if(p&&p.catch)p.catch(()=>{})};
 function step(t,tgt,dt,mv,live){const K=KIND[t.kind];
  // v: 0..1 lineal en el tiempo; la ganancia real es sin(v·π/2) → potencia igual entre dos fundidos complementarios
  t.v=cl(t.v+(tgt>t.v?1/K.i:-1/K.o)*dt,0,1);
  const A=t.a[t.cur],B=t.a[1-t.cur];
  if(t.v<=0&&tgt===0){if(!A.paused||!B.paused){A.pause();B.pause();if(K.rs){A.currentTime=0;B.currentTime=0;t.cur=0}}return}
  if(t.dead)return;
  if(A.paused&&!A.ended)play(A);
  const d=A.duration;let fa=1,fb=0;
  if(isFinite(d)&&d>LOOPX*3){const rem=d-A.currentTime;if(rem<30&&B.preload==='none'){B.preload='auto';try{B.load()}catch(e){}}
   if(rem<LOOPX){if(B.paused){B.currentTime=0;play(B)}const x=cl(1-rem/LOOPX,0,1);fa=Math.cos(x*Math.PI/2);fb=Math.sin(x*Math.PI/2);if(rem<.06||A.ended){A.pause();A.currentTime=0;t.cur=1-t.cur}}
   else if(!B.paused){B.pause();B.currentTime=0}}
  const base=Math.sin(t.v*Math.PI/2)*K.g*mv*(TG[DEF[t.k][t.kind]]||1);A.volume=cl(base*fa,0,1);B.volume=cl(base*fb,0,1)}
 // OJO (22 oct 2026): el servidor local de Python NO soporta Range y entonces el navegador NO deja saltar a un segundo lejano (`seekable` vacío). Por eso las pistas de escena se descargan a un Blob y suenan desde su URL (siempre se puede saltar y repetir desde `start`).
 function sc(id){let s=SCN[id];if(s)return s;const d=SCD[id];if(!d)return null;const a=new Audio();a.preload='auto';a.loop=false;a.volume=0;s=SCN[id]={id,d,a,v:0,tgt:0,dead:false,pos:false,ready:false,needSeek:false};
  a.addEventListener('error',()=>{if(a.src)s.dead=true});a.addEventListener('loadedmetadata',()=>{s.ready=true});a.addEventListener('ended',()=>{try{a.currentTime=d.start||0}catch(e){}if(s.tgt||s.v>0)play(a)});
  try{fetch(DIR+id+'.mp3').then(r=>r.ok?r.blob():Promise.reject()).then(b=>{a.src=URL.createObjectURL(b)}).catch(()=>{s.dead=true})}catch(e){s.dead=true}return s}
 function scene(id,on){const s=sc(id);if(!s)return false;s.tgt=on?1:0;if(on&&!s.pos){s.pos=true;s.needSeek=true}return true}
 function stepS(s,dt,mv,off){const D=s.d,t=(s.tgt&&!off)?1:0;if(s.dead||!s.ready)return;
  if(t&&s.needSeek){s.a.volume=0;try{s.a.currentTime=D.start||0}catch(e){}if(Math.abs(s.a.currentTime-(D.start||0))<1.5){s.needSeek=false}else return}
  s.v=cl(s.v+(t>s.v?1/D.i:-1/D.o)*dt,0,1);
  if(s.v<=0&&!t){if(!s.a.paused)s.a.pause();s.pos=false;s.needSeek=false;return}if(s.a.paused&&!s.a.ended)play(s.a);s.a.volume=cl(Math.sin(s.v*Math.PI/2)*mv*(TG[s.id]||1),0,1)}
 // o: {k,vil,fight,boss,night,off,mv}; devuelve true si el bioma actual tiene música propia que funcione
 function update(now,dt,o){dt=Math.min(.1,dt||.016);if(dbg)o=Object.assign({},o,dbg);const has=!!DEF[o.k]&&['aldea','mundo','combate','jefe','noche'].every(n=>!(T[o.k+'_'+n]&&T[o.k+'_'+n].dead));
  let act=o.boss?'jefe':o.fight?'combate':o.vil?'aldea':o.night?'noche':'mundo';{const D=DEF[o.k];if(D&&act!=='jefe'&&act!=='mundo'&&D[act]===D.mundo)act='mundo'}const mv=cl((o.mv==null?60:o.mv)/100,0,1);
  let scn=false;for(const id in SCN){const s=SCN[id];stepS(s,dt,mv,o.off);if(s.tgt||s.v>0)scn=true}   // pistas de escena: la del bioma se apaga mientras suenan
  Object.keys(DEF).forEach(ks=>{const k=+ks;Object.keys(DEF[k]).forEach(kind=>{const on=has&&k===o.k&&kind===act&&!o.off&&!scn;let t=T[k+'_'+kind];
    if(!t){if(!on&&!(has&&k===o.k&&!o.off))return;t=mk(k,kind)} // precarga las 5 del bioma al entrar
    step(t,on?1:0,dt,mv,1)})});
  return has}
 const seek=(id,t)=>{const o=T[id];if(o)o.a[o.cur].currentTime=t};
 const state=()=>{const r={};Object.values(T).forEach(t=>{const A=t.a[t.cur];r[t.id]={v:+t.v.toFixed(2),playing:!A.paused,t:+A.currentTime.toFixed(1),dur:+(A.duration||0).toFixed(1),vol:+A.volume.toFixed(2),dead:t.dead}});return r};
 return{DEF,DIRS,KIND,update,state,seek,scene,SCN,set dbg(v){dbg=v},get dbg(){return dbg},has:k=>!!DEF[k]}
})();
if(typeof module!=='undefined')module.exports=MUSIC;
