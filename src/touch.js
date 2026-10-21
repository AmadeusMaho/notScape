// NotScape · H9 · TÁCTIL (20 oct 2026) — pulsación larga = el «hover» del móvil.
// Qué hace: mantener el dedo ~0,42 s sobre un objeto/casilla con `data-i` o `data-x` muestra el tooltip del juego (#tip, ENCIMA del dedo para que no lo tape),
// enciende el icono 3D vivo (`ICON3D.hoverStart`) y un temblor de 12 ms de vibración si el dispositivo lo permite. Al soltar, el tooltip se queda 1,8 s y se apaga.
// Mover el dedo >10 px (desplazar la lista) cancela; el toque posterior a una pulsación larga NO activa la casilla (no equipa/usa por error).
// Además: con puntero táctil, tocar el mundo (lienzo #c) cierra el panel lateral abierto (antes no había forma de cerrarlo sin volver a tocar su botón).
// Solo actúa con `pointerType==='touch'`; con ratón no hace nada (ahí sigue el hover de siempre: game.js, slotfx.js, icons3d.js).
(()=>{
 const LP=420,MV=10,KEEP=1800;let tm=0,st=null,hideT=0,supUntil=0,active=null;
 const tip=()=>document.getElementById('tip');
 function show(el,x,y){const t=tip();if(!t)return;let h='';try{h=el.dataset.x||(typeof desc==='function'?desc(el.dataset.i):'')}catch(e){}if(!h)return false;
  t.innerHTML=h;t.style.display='block';t.style.visibility='hidden';const w=t.offsetWidth,hh=t.offsetHeight;
  t.style.left=Math.max(6,Math.min(innerWidth-w-6,x-w/2))+'px';let ty=y-hh-28;if(ty<6&&y+44+hh<innerHeight)ty=y+44;t.style.top=Math.max(6,ty)+'px';   // encima del dedo; si no cabe, debajo
  t.style.visibility='';return true}
 function stopHover(){const i=active;active=null;if(i&&window.ICON3D)try{ICON3D.hoverStop()}catch(e){}}
 function fire(){tm=0;if(!st)return;const el=st.el,img=el.querySelector&&el.querySelector('img[data-i3]')||(el.closest('.slot,.eqc')||{}).querySelector&&el.closest('.slot,.eqc').querySelector('img[data-i3]');
  if(show(el,st.x,st.y)===false)return;st.fired=1;supUntil=performance.now()+700;try{navigator.vibrate&&navigator.vibrate(12)}catch(e){}
  if(img&&window.ICON3D&&ICON3D.on){try{ICON3D.hoverStart(img,img.dataset.i3);active=img}catch(e){}}clearTimeout(hideT)}
 function end(){clearTimeout(tm);tm=0;if(st&&st.fired){clearTimeout(hideT);hideT=setTimeout(()=>{const t=tip();if(t)t.style.display='none';stopHover()},KEEP)}st=null}
 document.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;const el=e.target.closest&&e.target.closest('[data-i],[data-x]');
  // tocar el mundo cierra el panel lateral (solo táctil)
  if(e.target.id==='c'&&typeof panelOpen==='function'&&panelOpen()&&typeof setPanel==='function')setPanel(false);
  clearTimeout(hideT);const t=tip();if(t)t.style.display='none';stopHover();
  if(!el){st=null;return}st={el,x:e.clientX,y:e.clientY,fired:0};clearTimeout(tm);tm=setTimeout(fire,LP)},{passive:true});
 document.addEventListener('pointermove',e=>{if(e.pointerType!=='touch'||!st||st.fired)return;if(Math.hypot(e.clientX-st.x,e.clientY-st.y)>MV){clearTimeout(tm);tm=0;st=null}},{passive:true});
 document.addEventListener('pointerup',e=>{if(e.pointerType==='touch')end()},{passive:true});
 document.addEventListener('pointercancel',e=>{if(e.pointerType==='touch')end()},{passive:true});
 // el «clic» que sigue a una pulsación larga se descarta; el menú contextual del navegador (pulsación larga) no sale sobre objetos
 document.addEventListener('click',e=>{if(performance.now()<supUntil&&e.target.closest&&e.target.closest('[data-i],[data-x]')){e.stopImmediatePropagation();e.preventDefault()}},true);
 document.addEventListener('contextmenu',e=>{if(e.target.closest&&e.target.closest('[data-i],[data-x]'))e.preventDefault()});
 window.TOUCH={LP,active:()=>!!active,fire:el=>{st={el,x:0,y:0,fired:0};fire()}};
})();
