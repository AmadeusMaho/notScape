// WINMOVE — ventanas arrastrables (22 oct 2026, pedido del dueño: «mover la ventana y todas, en general, arrastrándolas»).
// Arrastra desde cualquier zona VACÍA de la ventana (no desde botones, casillas, campos ni objetos arrastrables). Usa la propiedad CSS `translate`
// (independiente de `transform`, que las ventanas usan para sus animaciones). La posición se guarda por ventana en localStorage (`ns_win`);
// doble clic en una zona vacía la devuelve a su sitio. Para una ventana nueva basta añadir su selector a SEL.
const WINMOVE=(()=>{
  const SEL=['#wk','#sw','#pw','#bw','#qpn','#ctl','#goalp'];
  const SKIP='button,a,input,select,textarea,label,canvas,[data-dg],[data-i],[data-x],[data-eq],[data-w],[onclick],.bar,.sl,kbd';
  let pos={};try{pos=JSON.parse(localStorage.getItem('ns_win')||'{}')}catch(e){}
  const save=()=>{try{localStorage.setItem('ns_win',JSON.stringify(pos))}catch(e){}};
  const apply=(el,p)=>{el.style.translate=p?p[0]+'px '+p[1]+'px':''};
  const clamp=(el,p)=>{ // deja siempre ≥ 60 px de la ventana dentro de la pantalla
    const r=el.getBoundingClientRect(),cur=(el._wm||[0,0]),bx=r.left-cur[0],by=r.top-cur[1],W=innerWidth,H=innerHeight,m=60;
    return [Math.min(W-m-bx,Math.max(m-bx-r.width,p[0])),Math.min(H-m-by,Math.max(-by,p[1]))]};
  let drag=null;
  function win(t){for(const s of SEL){const el=t.closest&&t.closest(s);if(el)return el}return null}
  addEventListener('pointerdown',e=>{
    if(e.button!==0||e.target.closest&&e.target.closest(SKIP))return;
    const el=win(e.target);if(!el)return;
    drag={el,x:e.clientX,y:e.clientY,o:(el._wm||[0,0]).slice(),moved:false};
  },true);
  addEventListener('pointermove',e=>{
    if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(!drag.moved&&Math.hypot(dx,dy)<5)return;
    if(!drag.moved){drag.moved=true;document.body.style.cursor='grabbing';getSelection&&getSelection().removeAllRanges()}
    const p=clamp(drag.el,[drag.o[0]+dx,drag.o[1]+dy]);drag.el._wm=p;apply(drag.el,p);e.preventDefault();
  },true);
  addEventListener('pointerup',()=>{
    if(!drag)return;const el=drag.el;document.body.style.cursor='';
    if(drag.moved&&el.id){pos[el.id]=el._wm;save()}
    drag=null;
  },true);
  addEventListener('dblclick',e=>{
    if(e.target.closest&&e.target.closest(SKIP))return;const el=win(e.target);if(!el||!el.id)return;
    el._wm=[0,0];apply(el,null);delete pos[el.id];save();
  },true);
  // restaurar posiciones guardadas (las ventanas ya existen en el DOM salvo #wk/#bw: se aplican al aparecer)
  function restore(){for(const id in pos){const el=document.getElementById(id);if(el&&!el._wm){el._wm=pos[id];apply(el,pos[id])}}}
  restore();new MutationObserver(restore).observe(document.body,{childList:true,subtree:false});
  addEventListener('resize',()=>{for(const id in pos){const el=document.getElementById(id);if(el&&el._wm){el._wm=clamp(el,el._wm);apply(el,el._wm)}}});
  return {restore,reset:()=>{pos={};save();SEL.forEach(s=>{const el=document.querySelector(s);if(el){el._wm=[0,0];apply(el,null)}})}};
})();
