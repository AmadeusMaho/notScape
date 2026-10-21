// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// NotScape · HUD «Susurro» en el juego real (oct 2026) — H0–H2 (marcos + barras), H5 (avisos de XP y banner), H6 (buffs) y H7 (rueda de resistencia).
// Especificación: docs/style-reference/r3d/hud-barras-final.html + docs/PLAN_HUD_SUSURRO.md + AGENTS.md (RONDAS 17–22). CSS: css/hud-susurro.css.
// Se carga DESPUÉS de game.js y lo llama game.js (`HUDSU.frame(now)` en el bucle de dibujo, `HUDSU.xp()` desde gain(), `HUDSU.banner()` desde banner()).
// El HUD vive en el DOM (nunca en el canvas ni en el pase `grade`): lee el estado del juego, no lo modifica. (El HUD antiguo de lienzo y `?hud=old` se retiraron en el cierre H12, 20 oct 2026.)
//   Marco del jugador (abajo-centro): retrato redondo (busto 3D del héroe con su equipo real; en 2D, el muñeco), nivel total, nombre, vida (verde), maná (azul) y fichas de buffs.
//   Marco del objetivo (arriba-centro): retrato del enemigo, nombre, nivel, barra roja (ámbar si es jefe) con estela de daño.
//   Barra de acción (talar, minar…) sobre el marco; avisos de XP (máx. 3, 3,5 s; los de la misma skill se funden); banner centrado; rueda de resistencia junto al héroe.
//   Animación de barras: un solo bucle (el del juego), un canvas por barra, ≤ 9 partículas, vida baja = respiración rápida; pausa si la pestaña está oculta.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
const HUDSU=(()=>{
 const host=document.getElementById('hud');
 if(!host)return{ok:false,frame(){},xp(){},banner(){},portraitDirty(){}};
 document.body.classList.add('hs-on');
 const root=document.createElement('div');root.id='hs';
 const bar=(c,extra)=>`<div class="b ${c}"><i class="g"></i><i class="f"></i><canvas></canvas><span class="t">${extra||''}</span></div>`;
 root.innerHTML=
  `<div class="hs-col" id="hs-col"><div class="hs-act" id="hs-act"><div class="nm" id="hs-al"></div>${bar('ac')}</div>`+
  `<div class="hs-pl" id="hs-pl"><div class="row"><div class="ring"><img id="hs-pp" alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="></div><span class="lv" id="hs-lv">1</span>`+
  `<div class="bars"><div class="nm" id="hs-nm">Aventurero</div>${bar('hp')}${bar('mp')}</div></div><div class="hs-fx" id="hs-fx"></div></div></div>`+
  `<div class="hs-tg" id="hs-tg"><div class="row"><div class="ring"><canvas class="live" id="hs-tc" style="display:none"></canvas><img id="hs-tp" alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="></div>`+
  `<div class="bars"><div class="nm" id="hs-tn"></div>${bar('hp th')}</div></div></div>`+
  `<div class="hs-xp" id="hs-xp" aria-live="polite"></div>`+
  `<div class="hs-bn" id="hs-bn"><h3></h3><p></p></div>`+
  `<div class="hs-wh" id="hs-wh" title="Resistencia"><svg viewBox="0 0 36 36"><circle class="bg" cx="18" cy="18" r="14"/><circle class="fg" cx="18" cy="18" r="14" pathLength="100" stroke-dasharray="100 100"/></svg></div>`;
 host.appendChild(root);
 const $=s=>root.querySelector(s),pl=$('#hs-pl'),tg=$('#hs-tg'),act=$('#hs-act'),fxr=$('#hs-fx'),wh=$('#hs-wh'),whf=wh.querySelector('.fg');
 const mk=el=>({el,g:el.querySelector('i.g'),f:el.querySelector('i.f'),c:el.querySelector('canvas'),t:el.querySelector('.t'),p:-1,gp:1,k:el.classList.contains('mp')?'mp':el.classList.contains('th')?'th':el.classList.contains('ac')?'ac':'hp',ps:[],tx:''});
 const B={hp:mk(pl.querySelector('.b.hp')),mp:mk(pl.querySelector('.b.mp')),th:mk(tg.querySelector('.b')),ac:mk(act.querySelector('.b'))};
 const setBar=(b,p,txt)=>{p=Math.max(0,Math.min(1,p||0));const q=Math.round(p*1000)/10;
  if(q!==b.p){if(q>b.p){b.g.style.transition='none';b.f.style.transition='none';b.g.style.width=q+'%';void b.g.offsetWidth;b.g.style.transition='';}else{b.f.style.transition='';b.g.style.width=q+'%'}b.f.style.width=q+'%';b.p=q}   // al SUBIR, relleno y estela van a la vez (antes el relleno iba .18 s por detrás y la estela clara asomaba como un rectángulo en la punta)
  if(txt!=null&&txt!==b.tx){b.t.textContent=txt;b.tx=txt}};
 // ── animación de barras (canvas por barra, desde el bucle del juego) ──
 function fx(b,tt,dt,low){const c=b.c;if(!c||!c.offsetParent||b.p<=0)return;const dpr=Math.min(2,window.devicePixelRatio||1),W=c.clientWidth,H=c.clientHeight;if(!W||!H)return;
  if(c.width!==Math.round(W*dpr)||c.height!==Math.round(H*dpr)){c.width=Math.round(W*dpr);c.height=Math.round(H*dpr)}
  const x=c.getContext('2d'),k=b.k,w=W*b.p/100,mir=k==='th';x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,W,H);if(mir){x.translate(W,0);x.scale(-1,1)}
  const sl=H*.575,tip=()=>{x.beginPath();x.moveTo(0,0);x.lineTo(Math.max(0,w-sl),0);x.lineTo(w,H);x.lineTo(0,H);x.closePath()};   // la luz se recorta con la MISMA punta oblicua del relleno (antes un rectángulo: bloque en la punta)
  x.save();tip();x.clip();
  if(k==='mp'){ // energía arcana: nubes cian/violeta + 2 filamentos
   [[.06,.4,'rgba(150,215,255,',.32],[.04,.6,'rgba(160,130,255,',.28],[.05,.25,'rgba(110,190,255,',.24]].forEach((q,i)=>{const bx=(Math.sin(tt*q[0]*6.3+i*2.1)*.5+.5)*(w+H*2)-H,by=H*(.5+.25*Math.sin(tt*q[1]+i*1.7)),r=H*(1.5+.25*Math.sin(tt*.5+i));const g=x.createRadialGradient(bx,by,0,bx,by,r);g.addColorStop(0,q[2]+q[3]+')');g.addColorStop(1,q[2]+'0)');x.fillStyle=g;x.fillRect(0,0,w,H)});
   const fl=.6+.4*Math.sin(tt*2.2);x.lineWidth=1;x.lineCap='round';
   for(let j=0;j<2;j++){x.beginPath();for(let px=0;px<=w;px+=2){const env=Math.sin(Math.min(1,px/(w||1))*Math.PI),yy=H*.5+Math.sin(px*.14+tt*(j?-1.4:1.2)+j*3)*H*.2*env+Math.sin(px*.33-tt*1.6+j)*H*.05*env;px?x.lineTo(px,yy):x.moveTo(px,yy)}x.strokeStyle='rgba('+(j?'200,170,255':'210,240,255')+','+(.14+.16*fl)*(j?.7:1)+')';x.stroke()}
  }else if(k==='hp'){ // vida viva: bandas de luz que fluyen, LATIDO que recorre la barra (más rápido con poca vida) y un menisco ondulante en el borde superior
   const I=.5+.5*Math.sin(tt*(low?2.6:.9)),sp=low?2.1:1,bd=H*1.3;x.fillStyle='rgba(255,255,255,'+(.02+.05*I)+')';x.fillRect(0,0,w,H);
   const off=(tt*H*.5*sp)%bd;x.fillStyle='rgba(215,255,150,.075)';
   for(let bx=-bd+off;bx<w+bd;bx+=bd){x.beginPath();x.moveTo(bx,H);x.lineTo(bx+H*.55,0);x.lineTo(bx+H*.9,0);x.lineTo(bx+H*.35,H);x.closePath();x.fill()}
   const bt=((tt*.62*sp)%1.5)/1.5,bpx=bt*(w+H*4)-H*2,gl=x.createLinearGradient(bpx-H*1.6,0,bpx+H*1.6,0),ba=.34*Math.sin(Math.min(1,bt*1.15)*Math.PI*.5+.4)*(1-bt*.55);
   gl.addColorStop(0,'rgba(220,255,170,0)');gl.addColorStop(.5,'rgba(236,255,196,'+ba+')');gl.addColorStop(1,'rgba(220,255,170,0)');x.fillStyle=gl;x.fillRect(bpx-H*1.6,0,H*3.2,H);
   x.lineWidth=1;x.lineCap='round';x.strokeStyle='rgba(236,255,205,.38)';x.beginPath();for(let q=0;q<=w;q+=2){const yy=H*.17+Math.sin(q*.22+tt*2.3*sp)*H*.06+Math.sin(q*.07-tt*1.3)*H*.04;q?x.lineTo(q,yy):x.moveTo(q,yy)}x.stroke();
   x.strokeStyle='rgba(20,60,10,.28)';x.beginPath();for(let q=0;q<=w;q+=2){const yy=H*.86+Math.sin(q*.18-tt*1.9*sp)*H*.05;q?x.lineTo(q,yy):x.moveTo(q,yy)}x.stroke()
  }else{const I=.5+.5*Math.sin(tt*(low?2.6:.9));x.fillStyle='rgba(255,255,255,'+(.02+.05*I)+')';x.fillRect(0,0,w,H)}
  const p=b.ps,rate=k==='mp'?2.2:1.6;if(Math.random()<rate*dt&&p.length<9&&w>12)p.push({x:Math.random()*w,y:H*(.25+Math.random()*.55),vx:(Math.random()-.5)*3,vy:-(1+Math.random()*2),r:.7+Math.random()*1.5,l:0,d:4.5+Math.random()*3,ph:Math.random()*6});
  const col=k==='mp'?'190,225,255':k==='th'?'255,190,130':k==='ac'?'255,220,150':'225,255,170';
  for(let i=p.length-1;i>=0;i--){const q=p[i];q.l+=dt/q.d;if(q.l>=1||q.x>w+4){p.splice(i,1);continue}q.x+=(q.vx+Math.sin(tt*.7+q.ph)*1.6)*dt;q.y+=q.vy*dt;const al=Math.pow(Math.sin(q.l*Math.PI),1.6)*(.8+.2*Math.sin(tt*2.2+q.ph));
   const g=x.createRadialGradient(q.x,q.y,0,q.x,q.y,q.r*3);g.addColorStop(0,'rgba('+col+','+(.7*al)+')');g.addColorStop(.25,'rgba('+col+','+(.34*al)+')');g.addColorStop(.6,'rgba('+col+','+(.1*al)+')');g.addColorStop(1,'rgba('+col+',0)');x.fillStyle=g;x.beginPath();x.arc(q.x,q.y,q.r*3,0,6.3);x.fill()}
  x.restore();
  if(w>6){const pc=k==='mp'?'140,200,255':k==='th'?'255,170,120':k==='ac'?'255,200,120':'190,240,120',rr=H*1.1,gx=x.createRadialGradient(w,H*.5,0,w,H*.5,rr);gx.addColorStop(0,'rgba('+pc+',.42)');gx.addColorStop(1,'rgba('+pc+',0)'); // remate: luz difusa en la punta
   x.save();tip();x.clip();x.fillStyle=gx;x.fillRect(w-rr,0,rr,H);x.restore()}}
 // ── retratos ──
 const BLANK='data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
 let pv=null,psig='',pcv=null,pimg=$('#hs-pp'),tcache={},ptry=0,pnext=0;
 const portraitDirty=()=>{psig=''};
 // Retrato VIVO (estilo WC3): en 3D el busto se renderiza en un canvas propio a ~30 fps con el estado REAL del héroe (equipo, caminar/correr, talar, pelear, comer, hechizos, golpe recibido).
 // Solo se recalcula el «look» (equipo/apariencia) cuando cambia; la animación va por `o.st` (ver HeroPreview.draw). En 2D queda la imagen estática del panel de personaje.
 let plook=null,lkNext=0,pnx=0;
 const lookNow=now=>{if(!plook||now>lkNext){lkNext=now+500;plook=R3D.outfits.resolve({app:S.app,ar:S.eq.a?ARC(S.eq.a):null,helm:S.eq.h?ARC(S.eq.h):null,boot:S.eq.f?ARC(S.eq.f):null,gear:gearOpts(),hood:'down',arm:armorInfo()})}return plook};
 function liveSt(now){return{mv:!!(P.mvg||P.anm),run:!!RUN,act:P.mvg?null:actState(now),hurt:Math.max(0,1-(now-HURT)/320),cb:!!(A&&A.ty==='f')||now-(P.cbT||-1e9)<2500||now-HURT<2500,t:now/1000}}
 function heroPortrait(now){
  try{
   if(window.R3D&&R3D.outfits&&R3D.preview&&typeof heroState3D==='function'){
    if(now<pnx)return;pnx=now+(document.hasFocus()?33:200);
    lookNow(now);
    if(!pcv){pcv=document.createElement('canvas');pcv.width=pcv.height=192;pcv.className='live';pimg.style.display='none';pimg.parentNode.appendChild(pcv)}
    if(!pv)pv=R3D.preview(pcv);
    pv.draw(plook,{dir:2,H:.4,cy:.73,st:liveSt(now),t:now/1000});ptry=0
   }
  }catch(e){psig='';if(++ptry>3)pnx=pnext=now+60000;if(window.console&&ptry<3)console.warn('[HUD] retrato',e)}}
 function mobPortrait(m){return''}   // Fase 18: sin retrato 2D de reserva (CRE.M ya no existe); el retrato es 3D (tpMob)
 // retrato 3D del enemigo (como el del héroe, pero vivo): TalkHead con setNpc(id,true); si no hay modelo 3D o falla, queda el 2D (mobPortrait)
 let tth=null,tthFail=0,tthOk=0,tthNext=0;const tCv=root.querySelector('#hs-tc'),tImg=root.querySelector('#hs-tp');
 function tpMob(m){tthOk=0;try{if(!tthFail&&window.R3D&&R3D.talkHead){if(!tth)tth=R3D.talkHead(tCv);tthOk=tth.setNpc(m.d.id,true)?1:0}}catch(e){tthFail=1;if(window.console)console.warn('[HUD] retrato 3D enemigo',e)}
  tCv.style.display=tthOk?'block':'none';tImg.style.display=tthOk?'none':''}
 function tpFrame(now){if(!tthOk||now<tthNext)return;tthNext=now+33;try{tth.draw({talk:false})}catch(e){tthOk=0;tthFail=1;tCv.style.display='none';tImg.style.display=''}}
 // ── buffs (E5/H6): fichas con anillo de tiempo. S.buf[k] = instante de fin (Date.now()); estados (P.dot) = debuff ──
 const BF={xp:['Sabiduría','pot_xp'],dmg:['Fuerza','pot_dmg'],spd:['Rapidez','pot_spd'],def:['Piel de piedra','sh_hierro'],mreg:['Maná veloz','pot_xp']},tot={},chips={};
 const fmt=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return s>=60?Math.floor(s/60)+':'+String(s%60).padStart(2,'0'):s+'s'};
 function buffs(now){const list=[],tN=Date.now();
  for(const k in BF){const r=(S.buf[k]||0)-tN;if(r>0){tot[k]=Math.max(tot[k]||0,r);list.push({id:'b'+k,i3:BF[k][1],img:(typeof ITEMICON!=='undefined'?ITEMICON.url(BF[k][1]):''),tip:BF[k][0],p:r/tot[k],tx:fmt(r)})}else tot[k]=0}
  if(P.dot&&typeof DOTN!=='undefined'&&DOTN[P.dot.k]){const D=P.dot,d=DOTN[D.k];list.push({id:'dot',emo:d[0],tip:d[1],p:Math.max(0,D.n)/5,tx:Math.max(0,D.n)+'s',bad:1})}
  if(typeof PRA!=='undefined'&&PRA.length)list.push({id:'pray',emo:'🙏',tip:'Oración activa · puntos: '+Math.floor(PP||0),p:Math.min(1,(PP||0)/Math.max(1,prMax())),tx:String(Math.floor(PP||0))});
  const seen={};list.forEach(o=>{seen[o.id]=1;let e=chips[o.id];
   if(!e){const d=document.createElement('div');d.className='chip'+(o.bad?' bad':'');d.innerHTML=(o.img?'<img alt="" data-i3="'+(o.i3||'')+'" src="'+o.img+'">':'<s>'+o.emo+'</s>')+'<b></b>';fxr.appendChild(d);e=chips[o.id]={d,b:d.lastChild,tx:'',p:-1}}
   const q=Math.round(o.p*100);if(q!==e.p){e.d.style.setProperty('--p',q+'%');e.p=q}if(o.tx!==e.tx){e.b.textContent=o.tx;e.tx=o.tx}e.d.title=o.tip});
  for(const id in chips)if(!seen[id]){chips[id].d.remove();delete chips[id]}}
 // ── avisos de XP (E3) y banner (E4) ──
 const xpH=$('#hs-xp'),xpL={};$('#hs-col').appendChild(xpH);
 function xp(sk,amt,up,lvl){try{
  const l=L(sk),fr=l>=99?1:(S.xp[sk]-XT[l])/(XT[l+1]-XT[l]),nm=SK[sk][0],em=SK[sk][1];let c=xpL[sk];
  if(c&&c.d.parentNode){c.amt+=amt;clearTimeout(c.t1);clearTimeout(c.t2);c.d.classList.remove('out')}
  else{const d=document.createElement('div');d.className='xt';d.innerHTML='<div class="xi">'+em+'</div><div class="tx"><b><span>'+nm+'</span><span class="n"></span></b><em><i></i></em></div>';xpH.appendChild(d);c=xpL[sk]={d,amt,n:d.querySelector('.n'),i:d.querySelector('em i')};
   while(xpH.children.length>3){const f=xpH.firstChild;for(const k in xpL)if(xpL[k].d===f)delete xpL[k];f.remove()}}
  c.n.textContent='+'+Math.round(c.amt)+' XP';c.i.style.setProperty('--p',Math.round(fr*100)+'%');
  c.t1=setTimeout(()=>c.d.classList.add('out'),3000);c.t2=setTimeout(()=>{c.d.remove();if(xpL[sk]===c)delete xpL[sk]},3500)}catch(e){}}
 const bn=$('#hs-bn');let bt1=0,bt2=0;
 function banner(t,sub,c,dur){clearTimeout(bt1);clearTimeout(bt2);bn.querySelector('h3').textContent=t;bn.querySelector('p').textContent=sub||'';bn.style.setProperty('--c',c||'#e8cf94');bn.classList.add('on','pop');setTimeout(()=>bn.classList.remove('pop'),260);
  bt1=setTimeout(()=>bn.classList.remove('on'),Math.max(1200,(dur||3000)-500))}
 // ── muñeco 3D de la pestaña Personaje (reemplaza al dibujo 2D de `paintDoll`): un canvas PERSISTENTE (un solo contexto WebGL) que se re-inserta cada vez que panel() rehace el HTML.
 // Arrastrar con el ratón/dedo lo gira; doble clic lo devuelve al frente. Se dibuja a ~30 fps solo mientras la pestaña está visible. ──
 let dcv=null,dv=null,dDir=2,dNx=0,dDrag=null;
 function doll(){if(!(window.R3D&&R3D.outfits&&R3D.preview))return false;const c=document.getElementById('doll');if(!c)return false;
  if(!dcv){dcv=document.createElement('canvas');dcv.id='doll';dcv.className='live3d';dcv.width=dcv.height=320;dcv.title='Arrastra para girar · doble clic: de frente';
   dcv.addEventListener('pointerdown',e=>{dDrag={x:e.clientX,d:dDir};try{dcv.setPointerCapture(e.pointerId)}catch(x){}});
   dcv.addEventListener('pointermove',e=>{if(dDrag)dDir=dDrag.d-(e.clientX-dDrag.x)/70});
   dcv.addEventListener('pointerup',()=>{dDrag=null});dcv.addEventListener('pointercancel',()=>{dDrag=null});dcv.addEventListener('dblclick',()=>{dDir=2})}
  if(c!==dcv)c.replaceWith(dcv);return true}
 function dollFrame(now){if(!dcv||!dcv.isConnected||!dcv.offsetParent||now<dNx)return;dNx=now+33;
  try{if(!dv)dv=R3D.preview(dcv);dv.draw(lookNow(now),{dir:dDir,H:.74,cy:.6,mode:'idle',t:now/1000})}catch(e){dcv=null;if(window.console)console.warn('[HUD] muñeco 3D',e)}}
 // ── diálogos (Fase 14): #dlg con el lenguaje Susurro + cabeza 3D del PNJ hablando (estilo OSRS: el PNJ aparece en primer plano y mueve la boca mientras habla) ──
 const dg=document.getElementById('dlg');document.body.appendChild(dg);   // fuera de #cw (z 0) para quedar POR ENCIMA del HUD
 dg.innerHTML='<div class="dl-head"><canvas></canvas></div><div class="dl-body"><div class="dl-name"></div><div class="dl-txt"></div><div class="dl-more"></div></div>';
 const dHead=dg.querySelector('.dl-head'),dCv=dg.querySelector('canvas'),dNm=dg.querySelector('.dl-name'),dTx=dg.querySelector('.dl-txt'),dMo=dg.querySelector('.dl-more');
 let th=null,thKey='',dOn=0,dTyping=0,dT0=0,dFull='',dN=-1,dHide=0,dClose=0,dAuto=0,thNext=0,thFail=0;
 const esc=t=>t.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
 function dlg(D){if(!D)return;clearTimeout(dClose);
  const [nm,rol]=String(D.n||'').split(' · ');dNm.innerHTML='<span style="color:'+(D.c||'var(--gold)')+'">'+esc(nm||'')+'</span>'+(rol?'<small>'+esc(rol)+'</small>':'');
  dFull=D.p[D.i]||'';dT0=performance.now();dN=-1;dTyping=!/</.test(dFull);const last=D.i>=D.p.length-1;dMo.textContent=last?(D.then?'▸ clic para comerciar':'▸ clic para cerrar'):'▸ clic para continuar';dMo.classList.remove('on');
  if(!dTyping){dTx.innerHTML=dFull;dMo.classList.add('on')}else dTx.innerHTML='<span class="v"></span><span class="r">'+esc(dFull)+'</span>';
  // cabeza del PNJ: se crea una sola vez (un contexto WebGL) y se reutiliza; si el PNJ no tiene modelo 3D (o en 2D) el cuadro va solo con texto
  let ok=false;try{if(D.id&&window.R3D&&R3D.talkHead&&!thFail){if(!th)th=R3D.talkHead(dCv);ok=th.setNpc(D.id)}}catch(e){thFail=1;if(window.console)console.warn('[HUD] cabeza de PNJ',e)}
  dHead.style.display=ok?'':'none';dg.classList.toggle('nohead',!ok);
  dg.style.display='flex';if(!dOn){void dg.offsetWidth;dg.classList.add('on');dOn=1;document.body.classList.add('dlg-on')}
  clearTimeout(dAuto);if(!dTyping)dAuto=setTimeout(dlgHide,20000)}
 function dlgHide(){if(!dOn)return;dOn=0;dTyping=0;clearTimeout(dAuto);dg.classList.remove('on');document.body.classList.remove('dlg-on');clearTimeout(dClose);dClose=setTimeout(()=>{if(!dOn)dg.style.display='none'},320)}
 function dlgSkip(){if(!dOn||!dTyping)return false;dTyping=0;dTx.textContent=dFull;dMo.classList.add('on');dAuto=setTimeout(dlgHide,20000);return true}
 function dlgFrame(now){if(!dOn)return;
  if(dTyping){const n=Math.min(dFull.length,Math.floor((now-dT0)*.052)); // ~52 caracteres/s
   if(n!==dN){dN=n;dTx.innerHTML='<span class="v">'+esc(dFull.slice(0,n))+'</span><span class="r">'+esc(dFull.slice(n))+'</span>'}
   if(n>=dFull.length){dTyping=0;dMo.classList.add('on');clearTimeout(dAuto);dAuto=setTimeout(dlgHide,20000)}}
  if(th&&dHead.style.display!=='none'&&now>=thNext){thNext=now+33;try{th.draw({talk:!!dTyping})}catch(e){thFail=1;dHead.style.display='none';if(window.console)console.warn('[HUD] cabeza de PNJ',e)}}}
 // pestañas del menú: al cambiar de pestaña (o abrir el panel) el contenido entra con un fundido corto (clase .sw sobre #pn)
 {const pn0=document.getElementById('pn'),t0=window.tab;if(pn0&&typeof t0==='function')window.tab=function(t){const was=TB,wasClosed=document.getElementById('side').classList.contains('closed'),r=t0.apply(this,arguments);if(t!==was||wasClosed){pn0.classList.remove('sw');void pn0.offsetWidth;pn0.classList.add('sw')}return r}}
 // el marco del jugador se aparta a la izquierda si un panel lateral (mochila, personaje…) lo taparía; se mide cada 250 ms y la transición CSS lo suaviza
 let shT=0,shV=-1;const colEl=$('#hs-col'),pwEl=document.getElementById('pw'),sideEl2=document.getElementById('side');
 function shift(now){if(now<shT)return;shT=now+250;let sh=0;
  if(pwEl&&sideEl2&&!sideEl2.classList.contains('closed')){const r=pwEl.getBoundingClientRect(),cw=colEl.offsetWidth*1;if(r.width>0&&cw){sh=Math.max(0,Math.min(innerWidth/2+cw/2-(r.left-14),innerWidth/2-cw/2-8))}}
  sh=Math.round(sh);if(sh!==shV){shV=sh;root.style.setProperty('--shift',sh+'px')}}
 // ── bucle ──
 let last=0,lvT=-1,nmT='',tgM=null,tgOff=0,hideT=0;
 function frame(now){if(document.hidden)return;const dt=Math.min(.05,last?(now-last)/1000:.016),tt=now/1000;last=now;
  const mh=maxHp(),hpv=Math.max(0,P.hp),low=hpv/mh<.3&&hpv>0;
  setBar(B.hp,hpv/mh,Math.ceil(hpv)+' / '+mh);const mm=mnMax();setBar(B.mp,MN/Math.max(1,mm),Math.floor(MN)+' / '+mm);B.hp.el.classList.toggle('low',low);
  const lv=SKL.reduce((s,k)=>s+L(k),0);if(lv!==lvT){lvT=lv;$('#hs-lv').textContent=lv}
  const nm=(S.app&&S.app.name)||'Aventurero';if(nm!==nmT){nmT=nm;$('#hs-nm').textContent=nm}
  heroPortrait(now);buffs(now);
  // objetivo (E2): el enemigo en combate (A.ty==='f') o al que el héroe se dirige
  const m=A&&A.ty==='f'&&A.e?A.e:(P.g&&P.g.e&&P.g.e.d?P.g.e:(typeof aimTarget==='function'?aimTarget(now):null));
  if(m&&m.hp>0){tgM=m;hideT=0;if(!tg.classList.contains('on')||tg._m!==m){tg._m=m;tg.classList.add('on');tg.classList.toggle('boss',!!(m.d.boss||m.boss));$('#hs-tn').innerHTML=m.d.n+'<small>Nv. '+m.lv+'</small>';tpMob(m);B.th.p=-1;B.th.g.style.transition=B.th.f.style.transition='none';B.th.g.style.width=B.th.f.style.width=(m.hp/m.mh*100)+'%';void B.th.g.offsetWidth;B.th.g.style.transition=B.th.f.style.transition=''}
   setBar(B.th,m.hp/m.mh,Math.round(Math.max(0,m.hp)/m.mh*100)+' %')}
  else if(tg.classList.contains('on')){if(!hideT)hideT=now+900;if(now>hideT){tg.classList.remove('on');tg._m=null;hideT=0}}
  // acción (talar, minar…): barra de progreso sobre el marco
  const ac=A&&A.ty!=='f';act.classList.toggle('on',!!ac);if(ac){$('#hs-al').textContent=actLabel();setBar(B.ac,Math.min(1,A.pr||0),null)}
  // resistencia (E7/H7): el juego guarda S.sta (0–100) y S.exh; la rueda se ve solo si no está llena o se está corriendo
  if(typeof S.sta==='number'){const st=S.sta/100;wh.classList.toggle('show',S.sta<99.5||!!RUN);wh.classList.toggle('exh',!!S.exh);wh.classList.toggle('low',!S.exh&&st<.15);wh.classList.toggle('warn',!S.exh&&st>=.15&&st<.35);whf.setAttribute('stroke-dasharray',(st*100).toFixed(1)+' 100')}
  dlgFrame(now);dollFrame(now);if(tg.classList.contains('on'))tpFrame(now);fx(B.hp,tt,dt,low);fx(B.mp,tt,dt,0);if(tg.classList.contains('on'))fx(B.th,tt,dt,0);if(ac)fx(B.ac,tt,dt,0)}
 return{ok:true,frame,xp,banner,portraitDirty,doll,dlg,dlgHide,dlgSkip,get head(){return th},B,root}
})();
