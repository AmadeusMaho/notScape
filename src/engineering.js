// NotScape · INGENIERÍA (`ing`) · lote INGENIERIA-1 (29 oct 2026). Global `ING`. Se carga ANTES de game.js y solo usa sus globales en tiempo de llamada; `ING.reg()` lo llama game.js tras definir I/ACT/LOOT.
// Qué hay (todo son TABLAS: pieza/elemento/grado nuevo = una fila):
//  · INTERMEDIOS vendibles (los que sube el oficio): engranajes y resortes por TIER (de las barras de Herrería), mechas (tela de Sastrería) y pólvora (carbón + hueso).
//  · BOMBAS `bm_<elemento>_<grado>`: artilugios de uso activo (tecla de uso en la mochila) con ENFRIAMIENTO COMPARTIDO; daño en área + el estado alterado de su elemento (status.js: reacciones
//    de Encantamiento incluidas: bomba de agua/escarcha + rayo, fuego + hielo = vapor…). Elementales piden la esencia de Encantamiento (`es_<e>`, 1 por 2 bombas).
//  · TRAMPAS `tr_<tipo>_<grado>`: se colocan a tus pies, se arman a 1,2 s y saltan con el primer enemigo agresivo que pisa (cepo = raíces, brea = ralentiza y expone, hielo, veneno). Máx. 3.
//  · APAREJOS `mk_<oficio>_<grado>`: herramientas mecánicas de 8 min que dan el efecto de un encantamiento de herramienta (eficiencia, precisión, fortuna) al oficio de recolección.
//  · LENTES `ln_*` (ranura `x`): equipo EXCLUSIVO por nivel de Ingeniería (hay que tener el nivel para llevarlas): pasivas y bonos a bombas/trampas/enfriamiento.
//  · MIRAS `mr_*` (ranura `z`): se montan en arcos y ballestas: más alcance, precisión y crítico a distancia (no hacen nada con otra arma).
// Estación: `ingeniero` (Banco de ingeniero, Taller). Hoja de trabajo FF14 con la skin `tinker` (forge.js) y 5 acciones exclusivas `of:'ing'` (work.js).
const ING=(()=>{
 // grados: [id de tier de TI, multiplicador de daño, radio px, desplazamiento de nivel de receta]
 const GR=[['cobre',1,70,0],['acero',3.4,92,0],['mitril',7,112,0]],GLV={bm:[8,28,54],tr:[6,26,52],mk:[12,32,58]},GN=['de cobre','de acero','de mitril'],GB=[1,1.5,2];
 // elementos de bomba: [nombre, emoji, color, esencia, estados [grado0-1, grado2], cargas, impacto 3D (receta de impact3d.js), desplazamiento de nivel]
 const EL={polvora:['Bomba','💣','#ffcf6a',null,null,0,null,0],humo:['Bomba de humo','🌫️','#9a9a9a',null,['blind','blind'],0,null,3],fuego:['Bomba incendiaria','🔥','#ff8a2a','es_fuego',['burn','incinerate'],0,'fuego',6],
  escarcha:['Bomba de escarcha','❄️','#9fdcff','es_escarcha',['chill','chill'],2,'escarcha',9],veneno:['Bomba venenosa','☠️','#6ad04a','es_veneno',['poison','toxin'],0,'veneno',8],
  rayo:['Bomba de tormenta','⚡','#ffe85a','es_rayo',['shock','overload'],0,'rayo',12],vacio:['Bomba abisal','🌀','#9a48ff','es_vacio',['curse','doom'],0,'vacio',15],
  agua:['Bomba de agua','💧','#4ab0ff',null,['wet','wet'],0,null,4]};
 // trampas: [nombre, emoji, color, esencia, ingredientes extra, desplazamiento de nivel]
 const TK={cepo:['Cepo','🪤','#b8b8c0',null,{},4],brea:['Trampa de brea','🕳️','#4a3a2a',null,{grasa:2},8],hielo:['Trampa de hielo','❄️','#9fdcff','es_escarcha',{},14],veneno:['Trampa venenosa','☠️','#6ad04a','es_veneno',{},12]};
 // aparejos: oficio de recolección → [nombre, emoji, efecto de ENCH.TOOL, oficio]
 const MK={wc:['Cabrestante de tala','⚙️','eficiencia'],mi:['Taladro de mina','⛏️','eficiencia'],he:['Podadora mecánica','✂️','fortuna'],fi:['Carrete mecánico','🎣','precision']},MKMS=8*60*1000;
 // lentes: id → [nombre, nivel de Ingeniería, metal del engranaje (índice de TI), gema, rareza, stats, pasivas {id:mult de PS.b}, bonos de ingeniería {bomb,trap,cd,rng}, descripción]
 const LN={ln_cristal:['Lentes de cristal',15,2,'cuarzo',2,{acc:3},{prosp:1.2},{},'Cristal pulido: ves mejor los botines escondidos.'],
  ln_prospector:['Lentes de prospector',35,4,'ambar',2,{acc:2},{lucky:1.4,harvest:1.2},{},'Resaltan el brillo de las menas y las hierbas: más suerte al recolectar.'],
  ln_tirador:['Lentes de tirador',52,6,'zafiro',3,{acc:9},{crit:1.3,precise:1.4},{rng:30},'Lentes graduadas para apuntar: más precisión, críticos y +30 de alcance a distancia.'],
  ln_noche:['Lentes de cazador nocturno',72,8,'amatista',3,{acc:6},{swift:1.6,haste:1.2},{},'Visión afilada en la oscuridad: más velocidad y ritmo de golpe.'],
  ln_artificiero:['Lentes de artificiero',80,9,'rubi',4,{},{thorns:1.5,crit:1.2},{bomb:.3,trap:.25,cd:.15},'Protegen del estallido: tus bombas pegan un 30 % más, trampas +25 % y los artilugios se enfrían un 15 % antes.'],
  ln_maestro:['Lentes de ingeniero maestro',93,11,'diamante',4,{acc:8},{double:1.4,crit:1.4},{bomb:.6,trap:.5,cd:.3,rng:40},'Lo mejor de la ingeniería: bombas +60 %, trampas +50 %, enfriamiento −30 % y +40 de alcance a distancia.']};
 // miras para arcos y ballestas (ranura `z`): [nombre, nivel, metal (índice TI), gema, rareza, alcance, precisión, crítico %]
 const MR={mr_simple:['Mira simple',10,0,'cuarzo',1,30,3,0],mr_telescopica:['Mira telescópica',30,3,'zafiro',2,70,6,0],mr_precision:['Mira de precisión',54,6,'opalo',3,110,10,4],
  mr_francotirador:['Mira de francotirador',74,8,'rubi',4,160,14,8],mr_maestra:['Mira maestra',93,11,'diamante',4,220,18,12]};
 let cdT=0;const FL=[],TR=[],REQ={};   // REQ[id] = nivel de Ingeniería para USAR el objeto (bombas, trampas, aparejos, lentes y miras: como en WoW, el nivel de su receta)
 const clk=()=>performance.now(),Lg=()=>typeof L==='function'?L('ing'):1;
 const TIN=['cobre','bronce','hierro','acero','plata','alba','mitril','adam','runita','oricalco','infernita','celestita'],tier=i=>typeof TI!=='undefined'?TI[i]:[TIN[i]],bid=t=>'b_'+t;
 // ── equipo puesto ──
 const gog=()=>{const id=typeof S!=='undefined'&&S.eq&&S.eq.x,o=id&&LOOT[id]&&LOOT[id].ing;return o||{}};
 function scope(){const o={rng:0,acc:0,crit:0};try{const id=S.eq.z,m=id&&LOOT[id]&&LOOT[id].sc;if(m&&wtype()==='r'){o.rng=m.rng;o.acc=m.acc;o.crit=m.crit}const g=gog();if(g.rng&&wtype()==='r')o.rng+=g.rng}catch(e){}return o}
 // ── registro de objetos y recetas ──
 function reg(){const E=(lv,ms)=>pxp(Math.min(99,lv),ms),cap=l=>Math.min(97,l),R=ACT.ing=[];
  Object.assign(I,{eng_mecha:['Mecha','🧵',6],pv_polvora:['Pólvora','🌑',14]});
  R.push(['Mechas',{tela:1},'eng_mecha',4,E(4,2000),2000],['Pólvora',{carbon:1,hueso:1},'pv_polvora',8,E(8,2400),2400]);R[0].n=4;R[1].n=3;
  TI.forEach(([id,nm,,L0],i)=>{if(!I[bid(id)])return;I['eng_engranaje_'+id]=['Engranaje de '+nm,'⚙️',Math.round(10+L0*3)];I['eng_resorte_'+id]=['Resorte de '+nm,'🌀',Math.round(10+L0*3)];
   const a=['Engranajes de '+nm,{[bid(id)]:1},'eng_engranaje_'+id,L0,E(L0,2000+L0*20),2000+L0*20],b=['Resortes de '+nm,{[bid(id)]:1},'eng_resorte_'+id,cap(L0+1),E(L0+1,2100+L0*20),2100+L0*20];a.n=b.n=2;R.push(a,b)});
  const need=(gi,x)=>Object.assign({['eng_engranaje_'+GR[gi][0]]:1},x||{});
  // BOMBAS
  Object.keys(EL).forEach(k=>{const e=EL[k];GR.forEach((g,gi)=>{const id='bm_'+k+'_'+gi,lv=cap(GLV.bm[gi]+e[7]),nm=e[0]+' '+GN[gi];I[id]=[nm,e[1],Math.round(18+gi*40+e[7]*3)];REQ[id]=lv;
   const ing=need(gi,{pv_polvora:2,eng_mecha:1});if(e[3])ing[e[3]]=1;const r=[nm.replace(/^Bomba/,'Bombas'),ing,id,lv,E(lv,2800+lv*25),2800+lv*25];r.n=2;R.push(r)})});
  // TRAMPAS
  Object.keys(TK).forEach(k=>{const e=TK[k];GR.forEach((g,gi)=>{const id='tr_'+k+'_'+gi,lv=cap(GLV.tr[gi]+e[5]),nm=e[0]+' '+GN[gi];I[id]=[nm,e[1],Math.round(24+gi*45+e[5]*3)];REQ[id]=lv;
   const ing=Object.assign({['eng_engranaje_'+g[0]]:1,['eng_resorte_'+g[0]]:1},e[4]);if(e[3])ing[e[3]]=1;R.push([nm,ing,id,lv,E(lv,3000+lv*25),3000+lv*25])})});
  // APAREJOS
  Object.keys(MK).forEach(sk=>{const e=MK[sk];GR.forEach((g,gi)=>{const id='mk_'+sk+'_'+gi,lv=cap(GLV.mk[gi]),nm=e[0]+' '+GN[gi];I[id]=[nm,e[1],Math.round(40+gi*60)];REQ[id]=lv;
   R.push([nm,{['eng_engranaje_'+g[0]]:2,['eng_resorte_'+g[0]]:1,grasa:1},id,lv,E(lv,3200+lv*25),3200+lv*25])})});
  // LAZOS DE CAPTURA (lote DOMAR-D2): los usa Domar (src/mount.js `TAME`); el grado ensancha la zona de acierto del lazo. 3 lazos por crafteo; piden cuero curtido de Peletería
  GR.forEach((g,gi)=>{const id='lz_'+gi,lv=cap([10,30,56][gi]),nm='Lazo '+GN[gi];I[id]=[nm,'🪢',Math.round(30+gi*50)];const r=[nm.replace(/^Lazo/,'Lazos'),{['eng_resorte_'+g[0]]:1,eng_mecha:2,['cu_'+g[0]]:1},id,lv,E(lv,3000+lv*25),3000+lv*25];r.n=3;R.push(r)});
  // LENTES (exclusivas por nivel) y MIRAS
  Object.keys(LN).forEach(id=>{const d=LN[id],t=tier(d[2])[0],nm=d[0];I[id]=[nm,'🥽',Math.round(150+d[1]*22)];
   LOOT[id]={s:'x',r:d[4],k:0,st:d[5],pa:Object.keys(d[6]).map(p=>({id:p,v:+((PS[p]?PS[p].b:5)*d[6][p]*(1+d[1]/60)).toFixed(1)})),ing:d[7],lvr:d[1],ln:1};
   R.push([nm,{['eng_engranaje_'+t]:2,['eng_resorte_'+t]:1,['gm_'+d[3]]:2},id,d[1],E(d[1],4200+d[1]*30),4200+d[1]*30])});
  Object.keys(MR).forEach(id=>{const d=MR[id],t=tier(d[2])[0];I[id]=[d[0],'🔭',Math.round(90+d[1]*18)];LOOT[id]={s:'z',r:d[4],k:0,st:{},sc:{rng:d[5],acc:d[6],crit:d[7]},lvr:d[1]};
   R.push([d[0],{['eng_engranaje_'+t]:1,['eng_resorte_'+t]:1,['gm_'+d[3]]:1},id,d[1],E(d[1],3600+d[1]*28),3600+d[1]*28])});
  R.sort((a,b)=>rq(a)-rq(b))}
 // ── aviso de uso ──
 const nowCd=(k)=>{const t=clk();if(t<cdT){toast('Tus artilugios se enfrían: '+Math.ceil((cdT-t)/1000)+' s',1200);return false}cdT=t+k*(1-(gog().cd||0));return true};
 function aim(){let x,y;if(typeof CUR!=='undefined'&&CUR.on&&!CUR.touch){const w=ISO.toWorld(CUR.px,CUR.py,TER.heightAt);x=w.x;y=w.y}else{const now=clk();let b=null,bd=340;M.forEach(m=>{if(!alive(m,now)||sealed(m))return;const d=Math.hypot(m.x-P.x,m.y-P.y);if(d<bd){bd=d;b=m}});if(!b)return null;x=b.x;y=b.y}
  const dx=x-P.x,dy=y-P.y,d=Math.hypot(dx,dy)||1,k=Math.min(1,320/d);return{x:P.x+dx*k,y:P.y+dy*k}}
 const fx=()=>typeof R3D!=='undefined'&&R3D.fx?R3D.fx:null,hostile=(m,now)=>alive(m,now)&&!sealed(m);
 function boom(x,y,col,n){const f=fx();if(f){f.spark(x,y,6,col,n,{spread:2.4,up:2.2,size:.14,life:.8});f.smoke(x,y,4,'#4a4440',6,{size:.34,grow:3,life:1.1,up:.6,spread:1.2})}try{noise(.4,.14,420,'lowpass');tone(60,.35,'sawtooth',.09,-20)}catch(e){}}
 function status(m,st,gi,extra){if(!st||typeof STS==='undefined')return;STS.add(m,st,Object.assign({dur:(st==='blind'?3000:st==='wet'?7000:5000)+gi*1800},extra||{}))}
 // ── BOMBAS: vuelo en arco y explosión ──
 function throwBomb(id,k,gi){const t=aim();if(!t)return false;const e=EL[k],g=GR[gi],gg=gog(),bo=gg.bomb||0;FL.push({x0:P.x,y0:P.y,x1:t.x,y1:t.y,t0:clk(),dur:420+Math.hypot(t.x-P.x,t.y-P.y)*.7,k,gi,dmg:Math.round(g[1]*(6+Lg()*.35)*(1+bo)),rad:g[2]*(1+bo*.5)});return true}
 function explode(f){const now=clk(),e=EL[f.k];boom(f.x1,f.y1,e[2],22);STC.bomb=STC.bomb||'#ffd890';let n=0;
  for(const m of M){if(!hostile(m,now))continue;const d=Math.hypot(m.x-f.x1,m.y-f.y1);if(d>f.rad+(m.d.w||12)*.4)continue;n++;const fall=1-.35*Math.min(1,d/f.rad);dotHit(m,Math.max(1,Math.round(f.dmg*fall)),now,'bomb');
   if(!alive(m,now))continue;aggro(m,now);const st=e[4]&&e[4][f.gi>=2?1:0];status(m,st,f.gi,e[5]?{n:e[5]+f.gi}:null);try{if(e[6]&&R3D.impact&&n<=6)R3D.impact.burst(m,e[6],1)}catch(x){}}
  }
 // ── TRAMPAS ──
 function placeTrap(id,k,gi){const gg=gog();if(typeof inVilla==='function'&&inVilla(P.x,P.y)){log('No puedes poner trampas dentro de la aldea.');return false}if(TR.some(t=>Math.hypot(t.x-P.x,t.y-P.y)<34)){log('Ya hay una trampa aquí.');return false}
  const mx=3+(gg.trap?1:0);while(TR.length>=mx)TR.shift();TR.push({x:P.x,y:P.y,k,gi,t0:clk(),arm:clk()+1200,end:clk()+120000,dmg:Math.round(GR[gi][1]*.8*(6+Lg()*.35)*(1+(gg.trap||0))),rad:60+gi*14});log('🪤 '+I[id][0]+' armada: se activa en 1 s.');return true}
 function spring(t,m){const now=clk(),e=TK[t.k],gi=t.gi;boom(t.x,t.y,e[2],10);STC.bomb=STC.bomb||'#ffd890';
  for(const o of M){if(!hostile(o,now))continue;if(Math.hypot(o.x-t.x,o.y-t.y)>t.rad)continue;dotHit(o,t.dmg,now,'bomb');if(!alive(o,now))continue;aggro(o,now);
   if(t.k==='cepo')status(o,'root',gi,{dur:2500+gi*900});else if(t.k==='brea'){status(o,'slow',gi,{dur:6000+gi*1500});status(o,'vuln',gi,{dur:8000})}else if(t.k==='hielo')status(o,'chill',gi,{n:3+gi});else status(o,gi>=2?'toxin':'poison',gi,{dur:8000});
   try{if(R3D.impact&&t.k==='hielo')R3D.impact.burst(o,'escarcha',1);if(R3D.impact&&t.k==='veneno')R3D.impact.burst(o,'veneno',1)}catch(x){}}}
 // ── APAREJOS ──
 function rig(id,sk,gi){S.buf.mk=S.buf.mk||{};S.buf.mk[sk]={e:MK[sk][2],b:GB[gi],t:Date.now()+MKMS,n:MK[sk][0]};log('⚙️ <b>'+I[id][0]+'</b> en marcha durante 8 min.');return true}
 // ── enganche de use(i) (game.js): true si el objeto es de Ingeniería y ya se ha gestionado ──
 function use(id,i){if(!id)return false;let m;
  if(REQ[id]&&!LN[id]&&!MR[id]&&Lg()<REQ[id]){toast('Necesitas Ingeniería nivel '+REQ[id]+' para usar '+I[id][0]+'.',2800);snd('miss');return true}
  if(m=/^bm_([a-z]+)_(\d)$/.exec(id)){if(typeof INT!=='undefined'&&INT&&!INT.cave){log('No puedes lanzar bombas aquí dentro.');return true}if(typeof inVilla==='function'&&inVilla(P.x,P.y)){log('No puedes lanzar bombas dentro de la aldea.');return true}
   if(!nowCd(4000))return true;if(!throwBomb(id,m[1],+m[2])){cdT=0;toast('Apunta a un enemigo o al suelo para lanzarla.',1400);return true}S.inv.splice(i,1);snd('bow');dirty=1;return true}
  if(m=/^tr_([a-z]+)_(\d)$/.exec(id)){if(!nowCd(2500))return true;if(!placeTrap(id,m[1],+m[2])){cdT=0;return true}S.inv.splice(i,1);snd('coin');dirty=1;return true}
  if(m=/^mk_([a-z]+)_(\d)$/.exec(id)){S.inv.splice(i,1);rig(id,m[1],+m[2]);snd('quest');dirty=1;return true}
  const ln=LN[id],mr=MR[id],q=ln?ln[1]:mr?mr[1]:0;if(q&&Lg()<q){toast('Necesitas Ingeniería nivel '+q+' para llevar '+I[id][0]+'.',2800);snd('miss');return true}
  return false}
 // ── bucle (swingTick): vuelo de bombas y disparo de trampas ──
 function tick(now,dt){for(let i=FL.length-1;i>=0;i--){const f=FL[i],u=Math.min(1,(now-f.t0)/f.dur);f.x=f.x0+(f.x1-f.x0)*u;f.y=f.y0+(f.y1-f.y0)*u;f.h=Math.sin(u*Math.PI)*70;
   if(now-(f.sp||0)>45){f.sp=now;const q=fx();if(q)q.spark(f.x,f.y,10+f.h,EL[f.k][2],1,{spread:.1,up:.1,g:0,size:.08,life:.35})}if(u>=1){FL.splice(i,1);explode(f)}}
  for(let i=TR.length-1;i>=0;i--){const t=TR[i];if(now>t.end){TR.splice(i,1);continue}if(now<t.arm)continue;
   for(const m of M){if(!hostile(m,now)||!(m.hunt||m.d.ag)||(m.d.fl))continue;if(Math.hypot(m.x-t.x,m.y-t.y)<30+(m.d.w||12)*.4){TR.splice(i,1);spring(t,m);break}}}}
 // ── dibujo 2D de las trampas (sobre el 3D, como los cuchillos) ──
 function draw(now){if(!TR.length||typeof ctx==='undefined')return;const k=SPR*ISO.scale()*.9;ctx.save();ctx.setTransform(1,0,0,1,0,0);
  for(const t of TR){const c=ISO.toCanvas(t.x,t.y,TER.standZ(t.x,t.y)),armed=now>=t.arm,col=TK[t.k][2];ctx.globalAlpha=armed?.95:.5+.3*Math.sin(now/90);ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(c.x,c.y,10*k,4.4*k,0,0,6.283);ctx.fill();
   ctx.strokeStyle='#2a2420';ctx.lineWidth=1.6*k;ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(c.x,c.y-1*k,8*k,3.4*k,0,0,6.283);ctx.fill();ctx.stroke();
   ctx.fillStyle='#dcd6c8';for(let j=0;j<6;j++){const a=j*1.047,x=c.x+Math.cos(a)*7*k,y=c.y-1*k+Math.sin(a)*2.9*k;ctx.beginPath();ctx.moveTo(x-1.4*k,y);ctx.lineTo(x,y-3.4*k);ctx.lineTo(x+1.4*k,y);ctx.fill()}
   if(armed){ctx.fillStyle='#e8cf94';ctx.globalAlpha=.6+.4*Math.sin(now/260);ctx.beginPath();ctx.arc(c.x,c.y-2*k,1.5*k,0,6.283);ctx.fill()}}
  ctx.restore()}
 // ── HUD: ficha del aparejo activo ──
 function chips(){const o=[];try{const mk=S.buf&&S.buf.mk;if(mk)for(const sk in mk){const r=mk[sk].t-Date.now();if(r>0)o.push({id:'mk'+sk,emo:'<svg class="stsv" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M5.6 18.4l2-2M16.4 7.6l2-2"/></svg>',svg:'#e8cf94',tip:mk[sk].n,p:r/MKMS,tx:Math.ceil(r/1000)>=60?Math.floor(r/60000)+':'+String(Math.ceil(r/1000)%60).padStart(2,'0'):Math.ceil(r/1000)+'s'})}}catch(e){}return o}
 // aparejo activo de un oficio de recolección (lo lee ENCH.tool)
 const rigOf=sk=>{try{const m=S.buf.mk&&S.buf.mk[sk];return m&&m.t>Date.now()?{e:m.e,b:m.b}:null}catch(e){return null}};
 // ── texto de objeto (tooltip) ──
 function desc(id){let m;const rq=REQ[id]&&!LN[id]&&!MR[id]?'<br><span style="color:'+(Lg()>=REQ[id]?'#7fd48a':'#ff8a7a')+'">Requiere Ingeniería '+REQ[id]+'</span>':'';
  if(m=/^bm_([a-z]+)_(\d)$/.exec(id)){const e=EL[m[1]],g=GR[+m[2]],st=e[4]&&e[4][+m[2]>=2?1:0];return '💥 Arrojable: daño en área (≈'+Math.round(g[1]*(6+Lg()*.35)*(1+(gog().bomb||0)))+', radio '+Math.round(g[2])+')'+(st&&typeof STS!=='undefined'?' + '+STS.D[st].n:'')+'. Enfriamiento de artilugios 4 s. Úsala con LMB en la mochila: cae donde apuntas.'+rq}
  if(m=/^tr_([a-z]+)_(\d)$/.exec(id))return '🪤 Se coloca a tus pies (máx. 3), se arma en 1,2 s y salta con el primer enemigo agresivo: '+({cepo:'raíces',brea:'ralentiza y expone',hielo:'escarcha acumulable',veneno:'veneno'}[m[1]])+'.'+rq;
  if(m=/^mk_([a-z]+)_(\d)$/.exec(id)){const e=MK[m[1]];return '⚙️ Dura 8 min: '+({eficiencia:'menos golpes por recurso',fortuna:'más probabilidad de doble recolección',precision:'zona perfecta más ancha'}[e[2]])+' (×'+GB[+m[2]]+'). Se activa al usarlo.'+rq}
  if(/^lz_\d$/.test(id))return '🪢 Lazo de captura: lo usa Domar sobre un animal domable (LMB o F cerca de él). Se gasta al lanzarlo; un lazo mejor ensancha la zona de acierto.';
  if(LN[id])return '🥽 Equipo de ingeniería: requiere Ingeniería nivel '+LN[id][1]+' · '+LN[id][8];
  if(MR[id])return '🔭 Mira: solo con arcos y ballestas. +'+MR[id][5]+' de alcance · +'+MR[id][6]+' de precisión'+(MR[id][7]?' · +'+MR[id][7]+' % de crítico':'')+' · requiere Ingeniería '+MR[id][1]+'.';
  return ''}
 // ── icono (item-icons.js): [kind, color, opciones] ──
 function icon(id,TC){let m;const last=id.split('_').pop();
  if(m=/^bm_([a-z]+)_(\d)$/.exec(id))return['bomb',EL[m[1]][2],{g:+m[2]}];
  if(m=/^tr_([a-z]+)_(\d)$/.exec(id))return['trap',TK[m[1]][2],{g:+m[2]}];
  if(m=/^mk_([a-z]+)_(\d)$/.exec(id))return['rig',TC[GR[+m[2]][0]]||'#aaaaaa',{g:+m[2]}];
  if(LN[id]){const d=LN[id];return['lens',TC[tier(d[2])[0]]||'#cfa860',{c:({cuarzo:'#e6e2f2',ambar:'#e8a030',zafiro:'#3a6aff',amatista:'#9a5ae0',rubi:'#e02a3a',diamante:'#e8f8ff'})[d[3]]}]}
  if(MR[id])return['scope',TC[tier(MR[id][2])[0]]||'#aaaaaa',{}];
  if(/^eng_resorte_/.test(id))return['spring',TC[last]||'#aaaaaa',{}];
  if(/^lz_\d$/.test(id))return['thread',TC[GR[+id[3]][0]]||'#d8c8a0',{}];if(id==='eng_mecha')return['thread','#d8c8a0',{}];if(id==='pv_polvora')return['dust','#5a5650',{g:0}];return null}
 return{reg,use,tick,draw,chips,rigOf,desc,icon,scope,gog,EL,TK,MK,LN,MR,GR,get traps(){return TR},get flying(){return FL},cdReset(){cdT=0}}
})();
