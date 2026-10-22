// NotScape · EDITOR DE ALDEAS (lote D5, 13 oct 2026). Pedido del dueño: mover, rotar, escalar y borrar a mano los props de las aldeas (farolas, barriles, bancas, casas…) y que se guarde solo.
// Dos partes en un solo archivo:
//  1) AL CARGAR (antes de PROPS.build): aplica los ajustes guardados en localStorage ('ns_vedit') sobre BIOMES.list[k].village.props. Cada pieza recibe una clave estable `_ek` = 'k|nombre|x|y'
//     (coordenadas ORIGINALES de layouts.js; si se repite, se añade #n) y un registro `_o0` con sus valores originales. Ajustes = {o:{clave:{x,y,rot,sc}|{del:1}}, add:[piezas duplicadas], doors:{bioma:{sala:clave}}}.
//     Si layouts.js cambia la posición original de una pieza, su ajuste deja de encontrarla y se ignora (por eso existe «Exportar»).
//  2) EDITOR (F2): se activa dentro de la aldea del bioma actual (solo piezas dentro de V.safe). Arrastrar = mover (Mayús = sin cuadrícula), R = rotar (espejo diagonal), [ ] = escalar, D = duplicar,
//     Supr = borrar, Ctrl+Z = deshacer, flechas = empujar 1 px (Mayús 8), G = cuadrícula de 8 px, Esc = deseleccionar/salir. Todo se guarda al soltar. Las casas con instalación arrastran su puerta (ST 'door', hp = pieza);
//     la casa de cada instalación se guarda en `doors` para que no cambie al recargar (interiors.js lo lee con VEDIT.doors(k)). Los árboles decorativos (son recursos talables) no se editan.
// Usa globales de game.js (cv, ISO, TER, P, ST, INT, biomeAt, toast) solo en tiempo de llamada.
const VEDIT=(()=>{
 const KEY='ns_vedit2';   // D7: la v1 ('ns_vedit') quedó horneada en layouts.js; ya no se lee
 const blank=()=>({v:1,o:{},add:[],doors:{}});
 let D=blank();try{const r=JSON.parse(localStorage.getItem(KEY));if(r&&r.v===1)D=Object.assign(blank(),r)}catch(e){}
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(D))}catch(e){}};
 // ── 1) aplicar al cargar ──
 let addN=0;const LAMPN={farola:1,brasero:1,linterna:1,antorcha:1};   // piezas que emiten luz (light.js LAMPK): los duplicados deben conservar el flag `lamp` de L()

 BIOMES.list.forEach((B,k)=>{const seen={};
  B.village.props.forEach(p=>{let ek=k+'|'+p.n+'|'+p.x+'|'+p.y;if(seen[ek]!=null)ek+='#'+(++seen[ek]);else seen[ek]=0;p._ek=ek;p._o0={x:p.x,y:p.y,rot:p.o&&p.o.rot?1:0,sc:p.sc||1};
   const a=D.o[ek];if(!a)return;if(a.del){p._del=1;return}
   if(typeof a.x==='number'){p.x=a.x;p.y=a.y}if(a.rot!=null&&a.rot!==p._o0.rot)p.o=Object.assign({},p.o||{},{rot:a.rot?1:0});if(a.sc&&a.sc!==1)p.sc=a.sc});
  D.add.filter(a=>a.k===k).forEach(a=>{addN=Math.max(addN,a.id||0);B.village.props.push({n:a.n,x:a.x,y:a.y,o:a.o||null,sc:a.sc||1,fp:a.fp||null,lamp:a.lamp||(LAMPN[a.n]?1:0),_add:1,_id:a.id,_ek:'add|'+a.id})})});
 // ── 2) editor ──
 let on=false,sel=null,hov=null,drag=null,grid=true,undo=[],ui=null,ov=null,ovg=null,raf=0;
 const kb=()=>biomeAt(P.x,P.y),Bk=k=>BIOMES.list[k];
 const say=h=>{try{toast(h,1800)}catch(e){}};
 const inVillage=p=>{const B=Bk(kb()),sf=B.village.safe;return Math.abs(p.x-sf[0])<=sf[2]&&Math.abs(p.y-sf[1])<=sf[3]};
 const editable=e=>e._src&&e.k===kb()&&inVillage(e._src);
 const entOf=p=>PROPS.list.find(e=>e._src===p);
 const isHouse=(p,B)=>!!(window.intDoorPos&&intDoorPos(p,B));
 const doorsOf=p=>ST.filter(d=>d.id==='door'&&d.hp===p);
 function syncDoor(p,k){const B=Bk(k);doorsOf(p).forEach(d=>{const q=intDoorPos(p,B);if(q){d.x=q.x;d.y=q.y}d.rot=!!(p.o&&p.o.rot)})}
 function refresh(p,k){const e=entOf(p);if(!e)return null;const B=Bk(k);e.x=B.ox+p.x;e.y=B.oy+p.y;e.o=p.o;e.sc=p.sc||1;if(p.fp){const f=p.o&&p.o.rot?[p.fp[1],p.fp[0]]:p.fp;e.fp=[f[0]*e.sc,f[1]*e.sc]}return e}
 // guardado: recalcula los ajustes desde las piezas vivas
 function persist(){const o={},add=[],ed=new Set();
  BIOMES.list.forEach((B,k)=>B.village.props.forEach(p=>{
   if(p._add){if(!p._del){add.push({k,n:p.n,x:p.x,y:p.y,o:p.o||null,sc:p.sc||1,fp:p.fp||null,lamp:p.lamp?1:0,id:p._id});ed.add(k)}return}
   const z=p._o0;if(!z)return;const rot=p.o&&p.o.rot?1:0,sc=p.sc||1;
   if(p._del){o[p._ek]={del:1};ed.add(k)}else if(p.x!==z.x||p.y!==z.y||rot!==z.rot||sc!==z.sc){o[p._ek]={x:p.x,y:p.y,rot,sc};ed.add(k)}}));
  const doors={};ST.forEach(d=>{if(d.id==='door'&&d.hp&&ed.has(d.k)&&d.hp._ek){(doors[d.k]=doors[d.k]||{})[d.room]=d.hp._ek}});
  D={v:1,o,add,doors};save();updUI()}
 const push=fn=>{undo.push(fn);if(undo.length>60)undo.shift()};
 const mkGhost=p=>{const e=entOf(p);return e};
 // ── acciones ──
 function move(e,nx,ny){const p=e._src,B=Bk(e.k);p.x=Math.round(nx-B.ox);p.y=Math.round(ny-B.oy);refresh(p,e.k);syncDoor(p,e.k)}
 function doRot(){if(!sel)return;const p=sel._src,k=sel.k;if(p.fps){say('Este prop no se puede rotar');return}const was=p.o;
  p.o=Object.assign({},p.o||{},{rot:p.o&&p.o.rot?0:1});sel=refresh(p,k);PROPS.resol();syncDoor(p,k);push(()=>{p.o=was;refresh(p,k);PROPS.resol();syncDoor(p,k)});persist()}
 function doScale(f){if(!sel)return;const p=sel._src,k=sel.k,B=Bk(k);if(p.fps||isHouse(p,B)){say('Las casas y este prop no se pueden escalar');return}const was=p.sc||1,nv=Math.max(.5,Math.min(2,Math.round(was*f*100)/100));if(nv===was)return;
  p.sc=nv;sel=refresh(p,k);PROPS.resol();push(()=>{p.sc=was;refresh(p,k);PROPS.resol()});persist()}
 function doDel(){if(!sel)return;const p=sel._src,k=sel.k;if(doorsOf(p).length){say('Esta casa tiene una instalación: muévela o cámbiala de casa antes de borrarla');return}
  p._del=1;PROPS.delEnt(sel);sel=null;push(()=>{p._del=0;PROPS.addEnt(p,k)});persist()}
 function doDup(){if(!sel)return;const p=sel._src,k=sel.k,B=Bk(k);if(p.fps){say('Este prop no se puede duplicar');return}const id=++addN,q={n:p.n,x:p.x+24,y:p.y+24,o:p.o?Object.assign({},p.o):null,sc:p.sc||1,fp:p.fp||null,lamp:p.lamp?1:0,_add:1,_id:id,_ek:'add|'+id};
  B.village.props.push(q);sel=PROPS.addEnt(q,k);push(()=>{q._del=1;PROPS.delEnt(entOf(q));if(sel&&sel._src===q)sel=null});persist()}
 function doUndo(){const f=undo.pop();if(!f){say('Nada que deshacer');return}f();const k=kb();if(sel&&sel._src._del)sel=null;else if(sel)sel=entOf(sel._src)||null;persist()}
 function nudge(dx,dy){if(!sel)return;const B=Bk(sel.k),p=sel._src,ox=p.x,oy=p.y;move(sel,sel.x+dx,sel.y+dy);PROPS.resol();const k=sel.k;push(()=>{p.x=ox;p.y=oy;refresh(p,k);PROPS.resol();syncDoor(p,k)});persist()}
 function doExport(){const t=JSON.stringify(D,null,1);try{navigator.clipboard.writeText(t)}catch(e){}
  try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:'application/json'}));a.download='aldeas_ajustes.json';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}catch(e){}say('📤 Ajustes exportados (portapapeles + archivo aldeas_ajustes.json)')}
 function doReset(){const k=kb();if(!confirm('¿Restablecer la aldea de '+(BI&&BI[k]?BI[k].n:k)+' a su diseño original? (se pierden tus ajustes de esta aldea)'))return;
  Object.keys(D.o).forEach(c=>{if(c.split('|')[0]==k)delete D.o[c]});D.add=D.add.filter(a=>a.k!==k);delete D.doors[k];save();location.reload()}
 // ── interfaz ──
 const CSS='#ved{position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:60;background:#2b2118ee;border:3px solid #6b4a2a;border-radius:8px;color:#f4e4c0;padding:6px 8px;font:13px/1.3 inherit;font-family:inherit;max-width:96vw;box-shadow:0 3px 0 #0006}'+
  '#ved .r{display:flex;flex-wrap:wrap;gap:4px;align-items:center;justify-content:center}#ved button{font:inherit;color:#f4e4c0;background:#4a3624;border:2px solid #7a5a36;border-radius:5px;padding:3px 7px;cursor:pointer}#ved button:hover{background:#6a4a2c}#ved button.on{background:#8a6a2c;border-color:#e8c060}'+
  '#ved .s{opacity:.85;font-size:12px;margin-top:4px;text-align:center}#ved b{color:#ffd23a}#vedc{position:fixed;pointer-events:none;z-index:40}';
 function mkUI(){const st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
  ui=document.createElement('div');ui.id='ved';ui.style.display='none';
  ui.innerHTML='<div class="r"><b>✏️ Editor de aldea</b><button data-a="rot" title="Rotar (R)">⟳ Rotar</button><button data-a="dn" title="Más pequeño ([)">－</button><button data-a="up" title="Más grande (])">＋</button><button data-a="dup" title="Duplicar (D)">⧉ Duplicar</button><button data-a="del" title="Borrar (Supr)">🗑 Borrar</button><button data-a="undo" title="Deshacer (Ctrl+Z)">↶</button><button data-a="grid" title="Cuadrícula (G)">▦ 8 px</button><button data-a="exp" title="Exportar ajustes">📤</button><button data-a="rst" title="Restablecer esta aldea">♻</button><button data-a="off" title="Salir (F2)">✖</button></div><div class="s" id="vedi"></div>';
  document.body.appendChild(ui);
  ui.addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;const a=b.dataset.a;({rot:doRot,dn:()=>doScale(1/1.12),up:()=>doScale(1.12),dup:doDup,del:doDel,undo:doUndo,grid:()=>{grid=!grid;updUI()},exp:doExport,rst:doReset,off:()=>setOn(false)})[a]();b.blur()});
  ov=document.createElement('canvas');ov.id='vedc';ov.style.display='none';document.body.appendChild(ov);ovg=ov.getContext('2d')}
 function updUI(){if(!ui)return;const i=document.getElementById('vedi'),g=ui.querySelector('[data-a=grid]');if(g)g.classList.toggle('on',grid);
  const n=Object.keys(D.o).length+D.add.length;
  i.innerHTML=(sel?'<b>'+sel.n+'</b> · x '+sel._src.x+' y '+sel._src.y+(sel._src.o&&sel._src.o.rot?' · girado':'')+(sel.sc&&sel.sc!==1?' · ×'+sel.sc:'')+' · ':'LMB en un objeto para elegirlo · ')+'arrastra = mover · R rotar · [ ] tamaño · D duplicar · Supr borrar · Ctrl+Z deshacer · '+n+' ajuste'+(n===1?'':'s')+' guardado'+(n===1?'':'s')}
 // selección por LMB: entre las piezas editables bajo el puntero gana la de menor caja (así una farola gana a la casa que tiene detrás)
 function pick(px,py){const s=ISO.scale(),w=ISO.toWorld(px,py,TER.heightAt);let best=null,ba=1e12;
  PROPS.list.forEach(e=>{if(!editable(e)||Math.abs(e.x-w.x)>260||Math.abs(e.y-w.y)>260)return;const b=PROPS.sprite(e,s),p=ISO.toCanvas(e.x,e.y,TER.standZ(e.x,e.y)),sc=e.sc||1,
   m=b.bb||[0,0,b.c.width,b.c.height],x0=p.x-b.ax*sc+m[0]*sc,y0=p.y-b.ay*sc+m[1]*sc,ww=m[2]*sc,hh=m[3]*sc;
   if(px>=x0&&px<=x0+ww&&py>=y0&&py<=y0+hh){const a=ww*hh;if(a<ba){ba=a;best=e}}});
  if(!best){let bd=18*ISO.scale();PROPS.list.forEach(e=>{if(!editable(e))return;const p=ISO.toCanvas(e.x,e.y,TER.standZ(e.x,e.y)),d=Math.hypot(p.x-px,p.y-py);if(d<bd){bd=d;best=e}})}   // minúsculos sin caja bajo el puntero: el más cercano a su punto de apoyo
  return best}
 const cpos=ev=>{const r=cv.getBoundingClientRect();return[(ev.clientX-r.left)*cv.width/r.width,(ev.clientY-r.top)*cv.height/r.height]};
 function onDown(ev){if(!on||ev.target!==cv||ev.button>0)return;ev.stopImmediatePropagation();ev.preventDefault();const[px,py]=cpos(ev),e=pick(px,py);sel=e;updUI();if(!e)return;
  const w=ISO.toWorld(px,py,TER.heightAt);drag={ox:e.x-w.x,oy:e.y-w.y,x0:e._src.x,y0:e._src.y,moved:0,id:ev.pointerId};try{cv.setPointerCapture(ev.pointerId)}catch(x){}}
 function onMove(ev){if(!on)return;const[px,py]=cpos(ev);if(!drag){hov=ev.target===cv?pick(px,py):null;return}if(!sel)return;ev.stopImmediatePropagation();
  const w=ISO.toWorld(px,py,TER.heightAt),B=Bk(sel.k);let nx=w.x+drag.ox,ny=w.y+drag.oy;if(grid&&!ev.shiftKey){nx=B.ox+Math.round((nx-B.ox)/8)*8;ny=B.oy+Math.round((ny-B.oy)/8)*8}
  const sf=B.village.safe;nx=Math.max(B.ox+sf[0]-sf[2],Math.min(B.ox+sf[0]+sf[2],nx));ny=Math.max(B.oy+sf[1]-sf[3],Math.min(B.oy+sf[1]+sf[3],ny));
  if(Math.round(nx-B.ox)!==sel._src.x||Math.round(ny-B.oy)!==sel._src.y){move(sel,nx,ny);drag.moved=1;updUI()}}
 function onUp(ev){if(!drag)return;ev.stopImmediatePropagation();try{cv.releasePointerCapture(drag.id)}catch(x){}const d=drag;drag=null;if(!d.moved||!sel)return;
  const p=sel._src,k=sel.k,x0=d.x0,y0=d.y0;PROPS.resol();push(()=>{p.x=x0;p.y=y0;refresh(p,k);PROPS.resol();syncDoor(p,k)});persist()}
 const typing=t=>/INPUT|TEXTAREA|SELECT/.test((t&&t.tagName)||'');
 function onKey(ev){if(ev.key==='F2'){ev.preventDefault();ev.stopImmediatePropagation();setOn(!on);return}
  if(!on||typing(ev.target)||ev.altKey)return;const k=ev.key,K=k.length===1?k.toLowerCase():k,eat=()=>{ev.preventDefault();ev.stopImmediatePropagation()};
  if((ev.ctrlKey||ev.metaKey)&&K==='z'){eat();doUndo();return}if(ev.ctrlKey||ev.metaKey)return;
  if(K==='Escape'){eat();if(sel){sel=null;updUI()}else setOn(false);return}
  if(K==='r'){eat();doRot();return}if(K==='d'){eat();doDup();return}if(K==='g'){eat();grid=!grid;updUI();return}
  if(K==='Delete'||K==='Backspace'){eat();doDel();return}if(K==='['||(K==='-'&&sel)){eat();doScale(1/1.12);return}if(K===']'||(sel&&(K==='+'||K==='='))){eat();doScale(1.12);return}
  if(sel&&/^Arrow/.test(K)){eat();const n=ev.shiftKey?8:1;({ArrowLeft:()=>nudge(-n,n),ArrowRight:()=>nudge(n,-n),ArrowUp:()=>nudge(-n,-n),ArrowDown:()=>nudge(n,n)})[K]()}}   // flechas en ejes de pantalla (arriba = (-1,-1) de mundo)
 function frame(){raf=0;if(!on)return;const r=cv.getBoundingClientRect();Object.assign(ov.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});if(ov.width!==cv.width||ov.height!==cv.height){ov.width=cv.width;ov.height=cv.height}
  const g=ovg,s=ISO.scale();g.clearRect(0,0,ov.width,ov.height);g.lineJoin='round';
  PROPS.list.forEach(e=>{if(!editable(e))return;const p=ISO.toCanvas(e.x,e.y,TER.standZ(e.x,e.y));g.fillStyle=e===sel?'#ffd23a':'#ffffffaa';g.beginPath();g.arc(p.x,p.y,Math.max(2,2*s),0,7);g.fill()});
  const box=(e,col,lw,dash)=>{const b=PROPS.sprite(e,s),p=ISO.toCanvas(e.x,e.y,TER.standZ(e.x,e.y)),sc=e.sc||1,m=b.bb||[0,0,b.c.width,b.c.height];g.save();g.strokeStyle=col;g.lineWidth=lw;g.setLineDash(dash||[]);g.strokeRect(p.x-b.ax*sc+m[0]*sc,p.y-b.ay*sc+m[1]*sc,m[2]*sc,m[3]*sc);g.restore();
   if(e.fp){const q=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,c])=>ISO.toCanvas(e.x+a*e.fp[0],e.y+c*e.fp[1],TER.standZ(e.x,e.y)));g.save();g.strokeStyle=col;g.fillStyle=col+'33';g.lineWidth=1.5;g.beginPath();q.forEach((c,i)=>i?g.lineTo(c.x,c.y):g.moveTo(c.x,c.y));g.closePath();g.fill();g.stroke();g.restore()}};
  if(hov&&hov!==sel&&PROPS.list.includes(hov))box(hov,'#ffffff',1,[4,3]);if(sel&&PROPS.list.includes(sel))box(sel,'#ffd23a',2.5);
  raf=requestAnimationFrame(frame)}
 function setOn(v){if(v&&((typeof INT!=='undefined'&&INT)||!Bk(kb()))){say('El editor solo funciona en las aldeas (fuera de las casas)');return}if(!ui)mkUI();on=v;ui.style.display=v?'block':'none';ov.style.display=v?'block':'none';sel=hov=drag=null;if(v){undo=[];updUI();say('✏️ Editor de aldea: arrastra los objetos. F2 para salir.');if(!raf)raf=requestAnimationFrame(frame)}
  else{PROPS.resol()}}
 window.addEventListener('keydown',onKey,true);document.addEventListener('pointerdown',onDown,true);document.addEventListener('pointermove',onMove,true);document.addEventListener('pointerup',onUp,true);
 return{doors:k=>D.doors[k]||null,get data(){return D},get on(){return on},toggle:()=>setOn(!on),persist,export:()=>JSON.stringify(D)}
})();
