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
 // i/o: segundos de fundido de entrada/salida; g: ganancia relativa; rs: reinicia al apagarse
 const KIND={aldea:{i:3,o:3,g:.9},mundo:{i:3,o:3,g:.9},noche:{i:4,o:4,g:.85},combate:{i:.9,o:2.6,g:.95,rs:1},jefe:{i:.7,o:3.2,g:1,rs:1}};
 const T={},cl=(v,a,b)=>Math.max(a,Math.min(b,v));
 let dbg=null;
 function mk(k,kind){const id=k+'_'+kind;if(T[id])return T[id];const t=T[id]={id,k,kind,v:0,cur:0,dead:false,a:[0,1].map(()=>{const a=new Audio((DIRS[k]||DIR)+DEF[k][kind]+'.mp3');a.preload='auto';a.loop=false;a.volume=0;a.addEventListener('error',()=>{t.dead=true});return a})};return t}
 const play=a=>{const p=a.play();if(p&&p.catch)p.catch(()=>{})};
 function step(t,tgt,dt,mv,live){const K=KIND[t.kind];
  // v: 0..1 lineal en el tiempo; la ganancia real es sin(v·π/2) → potencia igual entre dos fundidos complementarios
  t.v=cl(t.v+(tgt>t.v?1/K.i:-1/K.o)*dt,0,1);
  const A=t.a[t.cur],B=t.a[1-t.cur];
  if(t.v<=0&&tgt===0){if(!A.paused||!B.paused){A.pause();B.pause();if(K.rs){A.currentTime=0;B.currentTime=0;t.cur=0}}return}
  if(t.dead)return;
  if(A.paused&&!A.ended)play(A);
  const d=A.duration;let fa=1,fb=0;
  if(isFinite(d)&&d>LOOPX*3){const rem=d-A.currentTime;
   if(rem<LOOPX){if(B.paused){B.currentTime=0;play(B)}const x=cl(1-rem/LOOPX,0,1);fa=Math.cos(x*Math.PI/2);fb=Math.sin(x*Math.PI/2);if(rem<.06||A.ended){A.pause();A.currentTime=0;t.cur=1-t.cur}}
   else if(!B.paused){B.pause();B.currentTime=0}}
  const base=Math.sin(t.v*Math.PI/2)*K.g*mv;A.volume=cl(base*fa,0,1);B.volume=cl(base*fb,0,1)}
 // o: {k,vil,fight,boss,night,off,mv}; devuelve true si el bioma actual tiene música propia que funcione
 function update(now,dt,o){dt=Math.min(.1,dt||.016);if(dbg)o=Object.assign({},o,dbg);const has=!!DEF[o.k]&&['aldea','mundo','combate','jefe','noche'].every(n=>!(T[o.k+'_'+n]&&T[o.k+'_'+n].dead));
  const act=o.boss?'jefe':o.fight?'combate':o.vil?'aldea':o.night?'noche':'mundo',mv=cl((o.mv==null?60:o.mv)/100,0,1);
  Object.keys(DEF).forEach(ks=>{const k=+ks;Object.keys(DEF[k]).forEach(kind=>{const on=has&&k===o.k&&kind===act&&!o.off;let t=T[k+'_'+kind];
    if(!t){if(!on&&!(has&&k===o.k&&!o.off))return;t=mk(k,kind)} // precarga las 5 del bioma al entrar
    step(t,on?1:0,dt,mv,1)})});
  return has}
 const seek=(id,t)=>{const o=T[id];if(o)o.a[o.cur].currentTime=t};
 const state=()=>{const r={};Object.values(T).forEach(t=>{const A=t.a[t.cur];r[t.id]={v:+t.v.toFixed(2),playing:!A.paused,t:+A.currentTime.toFixed(1),dur:+(A.duration||0).toFixed(1),vol:+A.volume.toFixed(2),dead:t.dead}});return r};
 return{DEF,DIRS,KIND,update,state,seek,set dbg(v){dbg=v},get dbg(){return dbg},has:k=>!!DEF[k]}
})();
if(typeof module!=='undefined')module.exports=MUSIC;
