/* NotScape · N0-ESQUELETOS-3 · congela una HABILIDAD de enemigo para mirarla: ns.py eval "$(cat tools/r3d/enemy_skill.js)(['bandido','lunge',.9])"
   modos: lunge (aviso de embestida) · charge (carga) · arrow · orb · knife (aviso de proyectil) · slam · met · nov (golpe pesado telegrafado, p = progreso 0..1) · call · roar (señales, p = progreso)
   y 'at' = fase de ataque tras haber hecho antes el aviso (strike: p = u). */
(([id,mode,p])=>{M.length=0;ST.length=0;if(window.__esI)clearInterval(window.__esI);const cx=P.x,cy=P.y;mob(id,cx+130,cy-70);const m=M[M.length-1];m.d=Object.assign({},m.d,{ag:0});m.nt=1e15;m.tx=m.x;m.ty=m.y;m.hunt=1;m.hp=m.mh=99999;
 window.__esI=setInterval(()=>{const now=performance.now();ISO.snap(m.x,m.y,TER.standZ(m.x,m.y));m.nt=1e15;m.at0=-1e9;
  if(mode==='lunge')m.wind={t0:now-300,t1:now+5000,d:400,kind:'sk',sk:'lunge'};
  else if(mode==='charge')m.dash={t0:now-p*500,t1:now-p*500+500,a:0,sp:0,f:1,hit:1};
  else if(mode==='arrow'||mode==='orb'||mode==='knife'){m.d.sk={knife:{k:mode,min:0,max:999,cd:1e9,wind:700}};m.wind={t0:now-300,t1:now+5000,d:700,kind:'sk',sk:'knife'}}
  else if(mode==='slam'||mode==='met'||mode==='nov')m.tel={t0:now-p*1200,t1:now-p*1200+1200,k:mode,r:60,f:1};
  else if(mode==='call'||mode==='roar')m.sig={k:mode,t0:now-p*1100};},16);
 setZoom(7);return mode})
