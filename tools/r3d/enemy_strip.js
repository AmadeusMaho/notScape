/* NotScape · N0-ESQUELETOS · tira de poses de UN enemigo: ns.py eval "$(cat tools/r3d/enemy_strip.js)" con ID y FASES editables (ver enemy_strip.py).
   Pone N copias del enemigo en fila, quietas (ag=0), cada una con su fase de ataque congelada (at0 se reescribe cada 16 ms); fase -1 = sin ataque. */
(([id,phs,walk])=>{M.length=0;ST.length=0;if(window.__esI)clearInterval(window.__esI);const cx=P.x,cy=P.y,sp=88,n=phs.length,L=[];
 phs.forEach((u,i)=>{const x=cx+(i-(n-1)/2)*sp+120,y=cy-90;mob(id,x,y);const m=M[M.length-1];m.d=Object.assign({},m.d,{ag:0});m.nt=1e15;m.tx=m.x;m.ty=m.y;m.hunt=u>=0?1:0;m.hp=m.mh=99999;L.push([m,u])});
 window.__esI=setInterval(()=>{const now=performance.now();L.forEach(([m,u],i)=>{if(i===0)ISO.snap(m.x,m.y,TER.standZ(m.x,m.y));if(u>=0)m.at0=now-u*(m.d.boss?760:640);else m.at0=-1e9})},16);
 setZoom(9);ISO.snap(cx,cy+40,TER.standZ(cx,cy));return n})
