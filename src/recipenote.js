// NotScape · AVISO DE RECETAS NUEVAS (29 oct 2026) · global `RECN`. Al subir el nivel de un oficio (o descubrir una receta) aparece a la IZQUIERDA de la pantalla una tarjeta que entra deslizando con rebote, con destellos
// y los iconos de lo que ya se puede fabricar. También decide cuándo se VEN las recetas en el libro: solo las que están a `REVEAL` niveles o menos de desbloquearse (`near`); las demás no existen para el jugador.
// ES EL AVISO ÚNICO DE DESBLOQUEOS (decisión del dueño, 29 oct 2026): todo lo que se desbloquee en el juego —recetas, recursos, animales domables, acciones de oficio, habilidades de montura, futuras habilidades, subclases, zonas…— se anuncia con `RECN.unlock({title,sub,items:[{id|em,name}],foot})`.
// API: `RECN.unlock(o)` (= `push`) · `RECN.onLevel(sk,viejo,nuevo)` (lo llama `gain` de game.js) · `RECN.learn(titulo,[{id,name}])` (recetas descubiertas, p. ej. una mezcla nueva de Cocina) · `RECN.near(sk,a)` · `RECN.REVEAL`.
const RECN=(()=>{
 const REVEAL=6,HOLD=6800,Q=[];let busy=0,root=null;
 const gk=a=>(typeof GATE!=='undefined'&&GATE[a[2]])||null;
 // ¿está la receta a ≤ REVEAL niveles de poder hacerse? (también el requisito extra de otra skill, p. ej. Arquería para la munición)
 const near=(sk,a)=>{const g=gk(a);return L(sk)+REVEAL>=rq(a)&&(!g||L(g[0])+REVEAL>=g[1])};
 // ¿está abierta con los niveles dados? (`ov` = niveles hipotéticos por skill)
 const openAt=(sk,a,ov)=>{const lv=k=>ov&&ov[k]!=null?ov[k]:L(k),g=gk(a);return lv(sk)>=rq(a)&&(!g||lv(g[0])>=g[1])};
 const SKIP={mi:1,wc:1,fi:1,he:1,ds:1,ins:1,en:1,co:1,al:1,dm:1};   // oficios sin lista de recetas fijas (recolección, encantamiento dinámico, cocina y alquimia con su propio recetario)
 function ensureRoot(){if(root)return root;root=document.createElement('div');root.id='rcn';document.body.appendChild(root);return root}
 const T=(f,d,ty,v,sl,dl)=>{try{tone(f,d,ty||'sine',v||.04,sl,dl)}catch(e){}};
 function chime(n){const P=[0,4,7,12,16,19];for(let i=0;i<Math.min(6,2+n);i++)T(523*Math.pow(2,P[i]/12),.32,'triangle',.045,0,.08*i);try{noise(.5,.04,7000,'highpass')}catch(e){}}
 function show(o){busy=1;const e=ensureRoot(),c=document.createElement('div');c.className='rc-card';
  const it=o.items,sh=it.slice(0,8),more=it.length-sh.length;
  c.innerHTML='<div class="rc-glow"></div><div class="rc-hd"><b>'+o.title+'</b><span>'+o.sub+'</span></div><div class="rc-row">'+sh.map((x,i)=>'<span class="rc-i" style="animation-delay:'+(.35+i*.09)+'s" title="'+String(x.name).replace(/"/g,'')+'">'+(x.id&&typeof I!=='undefined'&&I[x.id]?ic(x.id):'<em>'+(x.em||'📖')+'</em>')+'</span>').join('')+(more>0?'<span class="rc-i more">+'+more+'</span>':'')+'</div>'
   +'<ul class="rc-ls">'+it.slice(0,5).map((x,i)=>'<li style="animation-delay:'+(.5+i*.1)+'s">'+x.name+'</li>').join('')+(it.length>5?'<li class="mo">y '+(it.length-5)+' más…</li>':'')+'</ul><div class="rc-ft">'+(o.foot||'Búscalas en el libro de recetas del oficio.')+'</div>';
  for(let i=0;i<14;i++){const s=document.createElement('i');s.className='rc-sp';s.style.cssText='--x:'+(Math.random()*100).toFixed(0)+'%;--y:'+(10+Math.random()*60).toFixed(0)+'%;--d:'+(.9+Math.random()*1.2).toFixed(2)+'s;--w:'+(.3+Math.random()*.8).toFixed(2)+'s;--s:'+(4+Math.random()*7).toFixed(0)+'px';c.appendChild(s)}
  e.appendChild(c);requestAnimationFrame(()=>c.classList.add('in'));chime(it.length);try{snd('lvl')}catch(x){}
  let done=0;const out=()=>{if(done)return;done=1;c.classList.remove('in');c.classList.add('out');setTimeout(()=>{c.remove();busy=0;next()},650)};c.onclick=out;let tm=setTimeout(out,HOLD);c.onmouseenter=()=>clearTimeout(tm);c.onmouseleave=()=>{tm=setTimeout(out,2200)}}
 function next(){if(busy||!Q.length)return;show(Q.shift())}
 function push(o){Q.push(o);next()}
 // recetas que se ABREN al pasar la skill `sk` de `o` a `n` (incluye las que dependen de ella como requisito extra)
 function onLevel(sk,o,n){try{if(typeof ISLA!=='undefined'&&ISLA.lock&&ISLA.lock())return;const items=[],seen={};
   Object.keys(ACT).forEach(k=>{if(SKIP[k])return;(ACT[k]||[]).forEach(a=>{if(!a||typeof a[1]!=='object'||!a[2]||typeof a[2]!=='string')return;if(!openAt(k,a,{[sk]:o})&&openAt(k,a)){const id=String(a[2]).split(':')[0];if(seen[id])return;seen[id]=1;items.push({id,name:a[0],k})}})});
   if(sk==='co'&&typeof COC!=='undefined'&&COC.X)COC.X.RECIPES.forEach(r=>{if(r.lvl>o&&r.lvl<=n)items.push({id:r.out||r.ing[0],name:r.name+' (receta)',k:'co'})});
   const sub0=SK[sk][1]+' '+SK[sk][0]+' · nivel '+n;
   // recursos que se recolectan al subir esa skill (tala, minería, pesca, herbolaria): ACT[sk] con [nombre, objeto, nivel…]
   if(!SKIP[sk]||['wc','mi','fi','he'].indexOf(sk)>=0){const rs=[];(ACT[sk]||[]).forEach(a=>{if(a&&typeof a[1]==='string'&&rq(a)>o&&rq(a)<=n)rs.push({id:a[1],name:a[0]})});if(rs.length)push({title:'🌿 ¡Nuevos recursos!',sub:sub0,items:rs,foot:'Ya puedes recolectarlos.'})}
   if(sk==='dm'&&typeof MTD!=='undefined'){const an=[];for(const id in MTD.E){const e=MTD.E[id];if(e&&!e.rare&&e.lv>o&&e.lv<=n)an.push({id:'mt_'+id,name:e.n})}if(an.length)push({title:'🐎 ¡Nuevos animales por domar!',sub:sub0,items:an,foot:'Los encontrarás en los pastos salvajes de su bioma.'})}
   if(!items.length)return;const by={};items.forEach(x=>by[x.k]=1);
   push({title:'✨ ¡Nuevas recetas!',sub:SK[sk][1]+' '+SK[sk][0]+' · nivel '+n,items,foot:Object.keys(by).length>1?'Repartidas entre varios oficios.':'Ya puedes fabricarlas en su estación.'})}catch(e){console.warn('[RECN]',e)}}
 // receta descubierta (mezcla nueva de Cocina, etc.)
 function learn(title,items,sub){try{if(!items||!items.length)return;push({title:'📖 '+title,sub:sub||'',items,foot:'Se guarda en tu recetario.'})}catch(e){console.warn('[RECN]',e)}}
 return{REVEAL,near,openAt,onLevel,learn,push,unlock:push}
})();
