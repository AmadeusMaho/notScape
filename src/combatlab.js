// NotScape · LABORATORIO DE COMBATE (21 oct 2026; acordado con el dueño: «tendríamos que ver el auto-ataque en acción»). Globales `FEEL` y `LAB`. Se carga ANTES de game.js (game.js usa `FEEL` con guardia typeof).
// QUÉ ES: (1) `FEEL` = parámetros de «sensación» del combate, ajustables en vivo y guardados en localStorage (`ns_feel`): velocidad del auto-ataque, congelado al impactar (hit-stop), temblor de pantalla y empujón del objetivo.
//   game.js los lee en `atkMs()` (swing) y `hitM()` (stop, shake, knock). Con los valores por defecto el juego se comporta EXACTAMENTE como antes.
// (2) `LAB` = un MUÑECO de entrenamiento (un goblin con vida casi infinita) junto al héroe, con un panel que mide el ritmo REAL: periodo entre golpes, daño del último, % de aciertos, DPS de 10 s y golpes totales, y deslizadores de FEEL.
//   Abrir: `LAB.open()`, `?lab` en la URL, o el botón «Laboratorio de combate» del menú de trucos (F3, pestaña Mundo). Está pensado para probarlo en TU GPU: SwiftShader (sin GPU) va a ≈ 2 fps y no sirve para juzgar el tacto.
const FEEL=(()=>{const D={swing:1,stop:35,shake:.2,knock:0,manual:1,mk:1,aim:1,ver:4};let v=Object.assign({},D);try{const j=JSON.parse(localStorage.getItem('ns_feel')||'null');if(j){if((j.ver||0)<2){j.mk=1}if((j.ver||0)<3){j.stop=35;j.shake=.2}if((j.ver||0)<4){j.knock=0;j.ver=4}v=Object.assign(v,j)}}catch(e){}
 const save=()=>{try{localStorage.setItem('ns_feel',JSON.stringify(v))}catch(e){}};
 return{D,get v(){return v},set(k,x){if(k in D){v[k]=+x;save()}},reset(){v=Object.assign({},D);save()},get swing(){return v.swing},get stop(){return v.stop},get shake(){return v.shake},get knock(){return v.knock},get manual(){return v.manual},get mk(){return v.mk},get aim(){return v.aim}}})();
const LAB=(()=>{
 let on=false,root=null,dummy=null,hits=[],last=0,per=0,n=0,tot=0,miss=0,timer=null,ed=0;
 const $=s=>root&&root.querySelector(s);
 // lo llama hitM() de game.js con cada golpe del héroe sobre cualquier criatura (el muñeco o no)
 function hit(m,d,now){if(!on||m!==dummy)return;if(last)per=now-last;last=now;n++;if(d>0){tot+=d;hits.push([now,d])}else miss++;while(hits.length&&now-hits[0][0]>10000)hits.shift()}
 function dps(){const now=performance.now();while(hits.length&&now-hits[0][0]>10000)hits.shift();if(!hits.length)return 0;const s=Math.max(2,(now-hits[0][0])/1000);return hits.reduce((a,h)=>a+h[1],0)/s}
 function spawn(){if(dummy){const i=M.indexOf(dummy);if(i>=0)M.splice(i,1)}
  const x=P.x+44,y=P.y+18;mob('goblin',x,y);dummy=M[M.length-1];dummy.mh=dummy.hp=1e7;dummy.lv=1;dummy.dm=ed;dummy.hunt=0;dummy.rt=0;dummy.lab=1;dummy.tx=x;dummy.ty=y}
 function paint(){if(!root)return;const m=dummy,hc=m&&typeof hitChance==='function'?Math.round(hitChance(m)*100):0;
  $('#lb-st').innerHTML=`swing: <b>${typeof atkMs==='function'?atkMs():0} ms</b> (medido ${per?Math.round(per):'—'} ms)<br>golpes <b>${n}</b> · fallos <b>${miss}</b> · acierto teórico <b>${hc}%</b><br>daño total <b>${tot}</b> · DPS(10 s) <b>${dps().toFixed(1)}</b><br>máx. golpe <b>${typeof maxHit==='function'?maxHit():0}</b>`}
 function html(){const F=FEEL.v;const sl=(k,l,mn,mx,st,u)=>`<label>${l}: <b id="v-${k}">${F[k]}${u}</b><input type="range" data-k="${k}" min="${mn}" max="${mx}" step="${st}" value="${F[k]}"></label>`;
  return `<div class="hd">⚔ Laboratorio de combate <button id="lb-x">✕</button></div><div id="lb-st"></div>
  <div class="row"><button id="lb-s">Nuevo muñeco</button><button id="lb-e">Muñeco pega: ${ed?'SÍ':'NO'}</button><button id="lb-r">Reiniciar medidas</button></div>
  <div class="row"><button id="lb-a">Apuntado con ratón: ${F.aim?'SÍ':'NO'}</button><button id="lb-m">Ataque: ${F.manual?'MANUAL (clic / E)':'AUTOMÁTICO'}</button></div>${sl('mk','Cadencia (× del tiempo del arma: 1 = WoW)',.5,1.5,.05,'')}
  ${sl('swing','Velocidad del auto-ataque (× del tiempo)',.4,1.5,.05,'')}${sl('stop','Hit-stop al impactar',0,160,10,' ms')}${sl('shake','Temblor al golpear',0,1,.1,'')}${sl('knock','Empujón del objetivo',0,24,2,' px')}
  <div class="row"><button id="lb-d">Valores por defecto</button></div><div class="hint">1 = como el juego normal. Ataca al muñeco con clic o acércate; los cambios se guardan. Mide en tu GPU (el navegador de pruebas va a 2 fps).</div>`}
 function open(){if(on)return;if(typeof P==='undefined'||typeof mob!=='function')return;on=true;if(!root){root=document.createElement('div');root.id='lab';root.style.cssText='position:fixed;left:12px;top:70px;z-index:30;width:280px;background:rgba(14,12,10,.88);border:1px solid #e8cf94;border-radius:6px;padding:8px 10px;color:#ecdfc6;font:12px Spectral,Georgia,serif;backdrop-filter:blur(6px)';document.body.appendChild(root)}
  const css=document.getElementById('lab-css')||Object.assign(document.createElement('style'),{id:'lab-css',textContent:'#lab .hd{font:600 13px Cinzel,serif;color:#e8cf94;display:flex;justify-content:space-between;margin-bottom:4px}#lab button{background:#2a241c;color:#ecdfc6;border:1px solid #6a5a3a;border-radius:4px;padding:3px 7px;margin:2px 2px 2px 0;cursor:pointer;font:inherit}#lab button:hover{border-color:#e8cf94}#lab label{display:block;margin:5px 0 0}#lab input{width:100%}#lab .row{display:flex;flex-wrap:wrap}#lab .hint{opacity:.65;margin-top:6px;font-size:11px}'});if(!css.parentNode)document.head.appendChild(css);
  root.style.display='block';root.innerHTML=html();
  root.onclick=ev=>{const id=ev.target.id;if(id==='lb-x')close();else if(id==='lb-s')spawn();else if(id==='lb-r'){hits=[];last=0;per=0;n=0;tot=0;miss=0}
   else if(id==='lb-e'){ed=ed?0:3;if(dummy)dummy.dm=ed;root.innerHTML=html()}else if(id==='lb-a'){FEEL.set('aim',FEEL.aim?0:1);root.innerHTML=html()}else if(id==='lb-m'){FEEL.set('manual',FEEL.manual?0:1);root.innerHTML=html()}else if(id==='lb-d'){FEEL.reset();root.innerHTML=html()}};
  root.oninput=ev=>{const i=ev.target;if(i.dataset&&i.dataset.k){FEEL.set(i.dataset.k,i.value);const u={stop:' ms',knock:' px'}[i.dataset.k]||'',v=root.querySelector('#v-'+i.dataset.k);if(v)v.textContent=i.value+u}};
  spawn();timer=setInterval(paint,250);try{if(typeof CHEAT!=='undefined'&&CHEAT.toggle)CHEAT.toggle(false)}catch(e){}}
 function close(){on=false;clearInterval(timer);if(root)root.style.display='none';if(dummy){const i=M.indexOf(dummy);if(i>=0)M.splice(i,1);dummy=null}}
 if(/[?&]lab\b/.test(location.search))setTimeout(()=>{try{open()}catch(e){}},5000);
 return{open,close,hit,get on(){return on},get dummy(){return dummy},paint}})();
