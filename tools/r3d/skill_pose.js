/* NotScape · N0-HABILIDADES-ANIM · congela una habilidad del jugador en una fase: ns.py eval "$(cat tools/r3d/skill_pose.js)(['sw_giro',.5])"
   Pone el arma de la familia necesaria (NSTEST/CHEAT) y mantiene P.ck con la fase fija (se reescribe cada 16 ms). Fase = 0..1 del clip. */
(([id,ph,eq])=>{if(window.__skI)clearInterval(window.__skI);
 const d=(window.SKA&&SKA[id]&&SKA[id].d)||1000;window.__skI=setInterval(()=>{const now=performance.now();P.ck={id,t0:now-ph*d,d};P.g=null;P.mv=null},16);setZoom(10);return [id,d]})
