/* NotScape · ganchos de PRUEBA para agentes sin GPU. Solo se carga con ?test=1 (ver index.html). NO afecta al juego normal.
   Uso: tools/fast/README.md. Todo cuelga de window.NSTEST (también se llama desde `python3 tools/fast/ns.py eval "NSTEST.xxx()"`).
   Cada gancho es síncrono y devuelve algo serializable (o undefined). Si algo no existe en tu versión del juego, falla con mensaje claro. */
(()=>{
const Q=new URLSearchParams(location.search),T={ver:1};
/* ---- tiempo: congelar / fijar la hora del día (sunS(t), t = now/1000, DAYLEN=360) ---- */
const raf=window.requestAnimationFrame.bind(window);let fix=null,t0=0;
window.requestAnimationFrame=cb=>raf(ts=>cb(fix===null?ts:fix+(ts-t0)*.002));   // ts*.002 => el reloj del juego casi no avanza
T.time=sec=>{fix=sec==null?null:sec*1000;t0=performance.now();return fix};        // sec de juego (null = reloj normal)
const PH={dia:61,atardecer:145,noche:241,amanecer:20};
T.hour=n=>T.time(typeof n==='string'?PH[n]:n);                                     // 'dia'|'atardecer'|'noche'|'amanecer' o segundos
/* ---- jugador / estado ---- */
T.tp=(x,y)=>{P.x=x;P.y=y;P.mv=null;P.g=null;A=null;if(ISO.snap)ISO.snap(x,y,TER.standZ(x,y));if(window.R3D&&R3D.parts)R3D.parts.snap();return [P.x,P.y]};
T.hp=n=>{P.hp=Math.max(0,Math.min(maxHp(),n));return P.hp};
T.mana=n=>{MN=Math.max(0,Math.min(mnMax(),n));return MN};
T.xp=(sk,n)=>{gain(sk,n);return S.xp&&S.xp[sk]};
T.banner=(t,s)=>banner(t,s||'','#e8cf94',3000);
T.tab=t=>{tab(t);return t};                                                         // 'inv','eq','sk',…
T.zoom=i=>{setZoom(i);return ZMI};
T.quality=(q)=>{try{localStorage.setItem('ns_q',q)}catch(e){}QA=q==='a'?1:0;QL=q==='a'?2:+q;fitCv();return QL};   // 0 máxima … 4 mínima
/* ---- enemigos ---- */
T.mobs=(r=400)=>M.filter(m=>Math.hypot(m.x-P.x,m.y-P.y)<r).map(m=>({id:m.d.id,n:m.d.n,x:Math.round(m.x),y:Math.round(m.y),hp:m.hp,lv:m.lv}));
T.nearMob=(id)=>{let b=null,bd=1e9;for(const m of M){if(id&&m.d.id!==id)continue;const d=Math.hypot(m.x-P.x,m.y-P.y);if(d<bd){bd=d;b=m}}return b};
T.spawn=(id,dx=40,dy=0)=>{if(!MD[id])throw new Error('mob desconocido: '+id+' · '+Object.keys(MD).slice(0,20).join(','));mob(id,P.x+dx,P.y+dy);const m=M[M.length-1];return {id,x:m.x,y:m.y,i:M.length-1}};
T.target=(id,dmg)=>{const m=T.nearMob(id);if(!m)throw new Error('no hay '+(id||'ningún mob'));A={ty:'f',e:m,pr:0};if(dmg&&m.hp!=null)m.hp=Math.max(1,m.hp-dmg);return {id:m.d.id,hp:m.hp}};
T.untarget=()=>{A=null;P.g=null};
/* killAll (lote FIX-CONGELA-SLIMES, 2 nov 2026): crea y MATA cada criatura de MD forzando el azar (botín épico, azul, verde y ninguno) y devuelve los ids que lanzan error.
   Un error al matar = el mundo se congelaba (lo atrapaba el bucle). Obligatorio tras añadir/tocar enemigos, fauna, botín o kill(): `ns.py eval "JSON.stringify(NSTEST.killAll())"` → {n, err:[]}.
   Restaura S, el suelo y Math.random; no guardes la partida de prueba después. */
/* attrCoverage (lote N0.9-ATRIBUTOS-3): lista los objetos EQUIPABLES (ranuras h f r n w c s l g a) que NO dan ningún atributo (ni explícito ni implícito). Debe devolver []; objeto nuevo equipable = `attrOf` lo cubre o lleva `st:{fue…}`. */
T.attrCoverage=()=>{const out=[];for(const id of Object.keys(I)){if(id.includes('^')||id.includes('@'))continue;const sl=slotOfId(id);if(!sl||!AWT[sl])continue;const L0=LOOT[id.split('~')[0]],ex=L0&&L0.st&&ATTRB.some(k=>L0.st[k]);if(ex)continue;const a=attrOf(sl,id);if(!a||!Object.values(a).some(v=>v>0))out.push(id)}return out};
T.killAll=(ids)=>{const S0=JSON.stringify(S),gd=GD.length,rnd=Math.random,err=[],now=performance.now();let n=0;
 for(const id of ids||Object.keys(MD))for(const r of [0,.0005,.005,.9]){Math.random=()=>r;const k=M.length;try{mob(id,P.x+60,P.y);const m=M[M.length-1];m.hp=0;kill(m,now);n++}catch(e){err.push(id+'@'+r+': '+(e&&e.stack||e).toString().split('\n').slice(0,3).join(' | '))}finally{Math.random=rnd;M.splice(k)}}
 const s=JSON.parse(S0);for(const key of Object.keys(S))if(!(key in s))delete S[key];Object.assign(S,s);GD.splice(gd);dirty=1;return {n,err}};
/* ---- modo rápido: render 3D mínimo / sin 3D (solo HUD DOM) ---- */
let f0=null;
T.no3d=on=>{if(!window.R3D)return 'sin R3D';if(on&&!f0){f0=R3D.frame;R3D.frame=()=>{}}else if(!on&&f0){R3D.frame=f0;f0=null}return !!f0};
/* ---- esperas ---- */
T.ready=()=>!!(window.R3D?window.R3D&&typeof sunS==='function'&&typeof S!=='undefined':typeof S!=='undefined');
T.frames=n=>new Promise(r=>{let k=0;const s=()=>{if(++k>=n)r(k);else raf(s)};raf(s)});   // espera N fotogramas reales (útil antes de capturar)
/* ---- info ---- */
T.info=()=>({x:Math.round(P.x),y:Math.round(P.y),hp:P.hp,biome:typeof biomeAt==='function'?biomeAt(P.x,P.y):null,QL,QA,zoom:ZMI,r3d:!!window.R3D_ON,fixTime:fix});
window.NSTEST=T;
/* ---- query params: ?test=1&hour=noche&at=x,y&fast=1&no3d=1&q=4&hp=5&target=goblin ---- */
const go=()=>{if(!T.ready()){setTimeout(go,300);return}
  try{if(Q.get('hour'))T.hour(isNaN(+Q.get('hour'))?Q.get('hour'):+Q.get('hour'));
  if(Q.get('hp'))T.hp(+Q.get('hp'));
  if(Q.get('no3d'))T.no3d(true);
  if(Q.get('spawn'))T.spawn(Q.get('spawn'));
  if(Q.get('target'))setTimeout(()=>{try{T.target(Q.get('target')==='1'?null:Q.get('target'))}catch(e){console.error(e)}},1500)}catch(e){console.error('NSTEST init',e)}
  window.__nstestReady=true};
go();
})();
