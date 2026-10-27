// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// INTERIORES (lote 5, oct 2026). Cada aldea tiene 3 casas con puerta: Herrería (casa 1), Taberna/Salón (casa 2) y Taller (casa del sur-este).
// Se entra con F / LMB en la puerta (punto «door» en ST) y se sale por la puerta de la sala (punto «exit»). Dentro NO hay combate, clima ni monstruos.
// Diseño del motor (para tocar lo mínimo de game.js):
//  · Al entrar, las listas del mundo (N, ST, M, PO, GD, GA) se GUARDAN y se vacían; se meten las instalaciones de la sala en ST (horno, yunque, taller, escritorio…),
//    así que pickEnt / useNear / iwFrame / openIW funcionan igual que fuera. Al salir se restauran.
//  · La sala vive en coordenadas de mundo alrededor de IRC (fuera del mapa). TER.heightAt/standZ devuelven 0 y blk() usa intBlk() mientras INT está activo.
//  · draw(): si INT, intScene() pinta fondo + cáscara horneada (arte en interior-art.js) + muebles ordenados por profundidad + luces; el HUD sigue siendo el de game.js.
//  · Unidades de diseño = unidades de modelo de la sala (la cáscara se dibuja con K=2): mundo = IRC + 2·u.
// Usa globales de game.js (P, ST, N, M, PO, GD, GA, PJ, HFX, FD, LFT, S, A, IW…) solo en tiempo de llamada.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
let INT=null;
const IRC={x:6000,y:6000},IK=2;   // IRC: centro de todas las salas; IK: px de mundo por unidad de modelo de la sala
(()=>{
 // ── tamaños de sala (unidades de modelo) y paletas por bioma ──
 const RW=140,RD=116,RH=58,DOOR=.34;
 const PALS=[
  {nm:'Pradera',style:'enlucido',wall:'#ecd9ae',wall2:'#d9bf8c',beam:'#7a5232',floor:'#b98a52',wood:'#9a6a3a',woodL:'#b9803f',woodD:'#5a3e28',cloth:'#c0392b',cloth2:'#f7f1e1',stone:'#b4b0a4',plant:'#6fb048',flower:'#ff9ac0',pot:'#c9885a',kind:'flores',kind2:'helecho'},
  {nm:'Bosque',style:'troncos',wall:'#b08456',beam:'#5a3e28',floor:'#a8784a',moss:'#6f9a46',wood:'#8a5e34',woodL:'#a8783f',woodD:'#4a3220',cloth:'#3f8a4a',cloth2:'#efe6c8',stone:'#a47e52',plant:'#5f9a46',flower:'#f0d86a',pot:'#a8784a',kind:'helecho',kind2:'flores'},
  {nm:'Pantano',style:'cana',wall:'#b79a62',beam:'#6a5a3e',floor:'#a8895a',wood:'#8a6e40',woodL:'#a8884e',woodD:'#4e3e26',cloth:'#d9a03a',cloth2:'#efe6c8',stone:'#9a8a5e',plant:'#6f8f3a',flower:'#e8c050',pot:'#9a7a4a',kind:'lirio',kind2:'bambu'},
  {nm:'Cumbres',style:'enlucido',wall:'#8a6a48',wall2:'#6a4a30',beam:'#34200f',floor:'#6f4e34',wood:'#6a4a30',woodL:'#8a6a48',woodD:'#34200f',cloth:'#3a6aa8',cloth2:'#f4f8fb',stone:'#7a7a80',plant:'#4f8a5a',flower:'#cfe6f4',pot:'#6a5a4a',kind:'abeto',kind2:'abeto',glass:'#cfe8f6'},
  {nm:'Oriental',style:'shoji',wall:'#f2e8cf',beam:'#6a3a28',floor:'#d6d29a',wood:'#8a5a3a',woodL:'#b07a4a',woodD:'#4a2a1c',cloth:'#b8302a',cloth2:'#f6efe0',stone:'#a89878',plant:'#6a9a58',flower:'#ffb0c8',pot:'#4a5a6a',kind:'bonsai',kind2:'bambu',paper:'#f6e8c0'},
  {nm:'Volcán',style:'basalto',wall:'#4a3e3c',beam:'#2a2226',floor:'#4a3e3c',wood:'#5a3a2a',woodL:'#7a4e34',woodD:'#2a1a14',cloth:'#d8501a',cloth2:'#e8c898',stone:'#6a5a58',plant:'#6a8a3a',flower:'#ff8a2a',lava:'#ff8a2a',pot:'#3a3034',kind:'fuego',kind2:'fuego',glass:'#ffcf8a'}];
 // ── plantillas de sala ──  it: [modelo, x, y, opciones, extra]. extra: {w:1 → pared derecha (y=−RD/2), wl:1 → pared izquierda (se espeja), fl:1 → suelo (se pinta antes), fp:[hx,hy] colisión en px de mundo}
 // Las posiciones son del PIE del modelo. Pared derecha: y=−RD/2+1.5; pared izquierda: x=−RW/2+1.5 (con rot).
 const WR=-RD/2+1.5,WL=-RW/2+1.5;
 const FPT={mesa:[24,18],silla:[6,6],taburete:[6,6],cama:[30,20],hogar:[26,10],alacena:[18,9],estante:[0,0],barra:[44,10],barrilTap:[12,12],mesaTrabajo:[24,16],mesaEscribir:[24,16],rackArmas:[0,0],herramientas:[0,0],plantaGrande:[8,8],maceta:[5,5],mesaBaja:[18,12],biombo:[26,4],farolPapel:[5,5],arcon:[16,10],hamaca:[30,8],barrilAgua:[9,9],fuelle:[12,10],cestaLena:[9,9],cojin:[0,0]};
 function mk(k,id){
  const P=PALS[k],o0={wood:P.wood,woodL:P.woodL,woodD:P.woodD,cloth:P.cloth,cloth2:P.cloth2,stone:P.stone,plant:P.plant,flower:P.flower,pot:P.pot,lava:P.lava||'#ff8a2a'};
  const O=(x)=>Object.assign({},o0,x||{}),it=[],st=[],lt=[];
  const add=(n,x,y,o,ex)=>it.push([n,x,y,O(o),ex||{}]),wr=(n,x,o)=>add(n,x,WR,o,{w:1}),wl=(n,y,o)=>add(n,WL,y,Object.assign({rot:true},o||{}),{wl:1});
  const ori=k===4,vol=k===5,swp=k===2,nor=k===3,bos=k===1;
  const sit=(x,y,o)=>ori?add('cojin',x,y,Object.assign({col:P.cloth},o),{fl:0}):add('silla',x,y,o);
  const table=(x,y,o)=>ori?add('mesaBaja',x,y,o):add('mesa',x,y,o);
  const doorX=RW*DOOR;
  if(id==='herreria'){
   st.push(['furnace',-42,-38],['anvil',-8,-10],['armero',34,-12],['joyero',-60,2]);   // ESC-JOY (27 oct 2026): Banco de joyero contra la pared izquierda, girado hacia el centro (lejos del horno y del yunque, que se quedaban la tecla F) // lote C1b-1: Armero (armaduras de malla/placa)
   wr('rackArmas',-12);wr('herramientas',14);wl('escudoPared',-22,{col:P.cloth});wl('escudoPared',30,{col:P.cloth});
   add('fuelle',-23,-46,{},{fp:[12,8]});add('barrilAgua',-60,30);add('cestaLena',-58,46);
   add('arcon',54,34);add('maceta',63,-40,{kind:P.kind});add('alfombra',-8,28,{w:50,d:30,col:vol?'#7a3a2a':P.cloth,col2:P.cloth2},{fl:1});
   add('plantaGrande',62,50);add('barrilAgua',-48,52);
   if(vol||nor)wr('pielPared',-36);
   lt.push([-42,-38,16,170,'#ff7a2a'],[-8,-10,10,80,'#ffb050']);
   return{id,nm:'Herrería',it,st,lt}}
  if(id==='taberna'){
   wr('estante',18);wr('cuadro',-2);wl('estante',-40);wr('colgante',-56);
   add('barra',WL+8,8,{w:62,rot:true},{wl:1,fp:[12,56]});add('barrilTap',WL+6,-34,{rot:true},{wl:1});
   table(14,12);sit(2,12);sit(26,12);sit(14,0);sit(14,24);
   table(28,42);sit(14,42);sit(42,42);
   add('alfombra',14,22,{w:56,d:48,col:P.cloth,col2:P.cloth2},{fl:1});
   if(ori)add('farolPapel',62,-38);
   add('plantaGrande',64,22);add('maceta',-58,52,{kind:P.kind2});add('cojin',-50,-30,{col:P.cloth},{fl:0});
   if(vol||nor)wr('pielPared',42);if(swp||bos)wr('colgante',42);   /* x=42: antes en −8, pegados a la cocina */
   st.push(['cocina',-26,-46]);lt.push([-26,-52,12,190,'#ff8a3a']);   // 27 oct 2026 (dueño): la COCINA 3D de cada cultura sustituye al hogar de la pared; mide 2,05 × 1,19 casillas (≈ 33 × 19 u): fondo pegado a la pared (WR), frente hacia la sala
   return{id,nm:'Taberna',it,st,lt}}
  if(id==='templo'){
   st.push(['shrine',-4,-34]);
   wr('colgante',-44);wr('colgante',36);wl('cuadro',-18);wl('cuadro',16);wl('estante',-44);
   add('alfombra',-4,12,{w:44,d:64,col:P.cloth,col2:P.cloth2},{fl:1});
   [[-24,22],[16,22],[-24,44],[16,44]].forEach(([x,y])=>add('cojin',x,y,{col:P.cloth},{fl:0}));
   add('farolPapel',-46,-38);add('farolPapel',40,-38);add('plantaGrande',64,46);add('maceta',-62,-36,{kind:P.kind});add('maceta',64,10,{kind:P.kind2});
   lt.push([-4,-34,22,190,'#ffe9a0'],[-46,-38,16,110,'#ffd890'],[40,-38,16,110,'#ffd890']);
   return{id,nm:'Templo',it,st,lt}}
 if(id==='banco'){   // lote V8: banco «de verdad»: mostrador con reja y 3 ventanillas (la instalación 'bank' ES el mostrador; lo pinta intBankDraw con sus cajeros), cámara acorazada al fondo
   st.push(['bank',-10,-30]);
   wl('boveda',-30,{k});wr('cuadro',-40);wr('cuadro',22);wl('cuadro',22);
   add('arcon',-58,8,{rot:true},{});
   add('alfombra',-10,4,{w:58,d:30,col:P.cloth,col2:P.cloth2},{fl:1});
   add('mesaEscribir',40,26);sit(40,40);
   add('farolPapel',62,-40);add('plantaGrande',64,50);add('maceta',-62,-14,{kind:P.kind});add('maceta',64,6,{kind:P.kind2});
   if(vol||nor)wr('pielPared',2);
   lt.push([-10,-30,26,170,'#ffd890'],[40,26,10,80,'#ffc070']);
   return{id,nm:'Banco',it,st,lt}}
  if(id==='tienda'){
   st.push(['shop',-14,-34],['market',-60,-10]);   // Fase 28b: mostrador del tendero al fondo y, al otro lado, el tablón del mercado global
   wr('estante',-54);wr('estante',22);wr('colgante',-2);wl('estante',-30);wl('estante',6);
   add('barrilAgua',-58,40);add('cestaLena',-48,54);add('arcon',-58,22,{rot:true},{});add('mesa',24,20);sit(24,36);sit(40,20);
   add('alfombra',4,12,{w:56,d:40,col:P.cloth,col2:P.cloth2},{fl:1});
   add('farolPapel',62,-40);add('plantaGrande',64,50);add('maceta',-62,-40,{kind:P.kind});
   lt.push([-18,-36,16,130,'#ffd890'],[24,20,10,80,'#ffc070']);
   return{id,nm:'Tienda',it,st,lt}}
  // taller
  st.push(['bench',-40,-36],['altar',2,-36],['curtidor',42,-10],['alambique',50,-38],['cantero',8,26]);   // ESC-JOY (27 oct 2026): Banco de cantero en el centro (donde estaba la mesa con sillas) // lote C1b-1 · ALQUIMIA (provisional en el Taller hasta tener la Botica): Banco de curtidor (cuero)
  wr('estante',-52);wr('estante',-16);wr('cuadro',26);wl('estante',-22);wl('cuadro',16);
  if(swp||bos||ori)add('hamaca',-34,46);else add('cama',-46,36,{});
  if(ori)add('biombo',-56,-6,{rot:true},{wl:1});
  add('farolPapel',62,-40);
  add('alfombra',10,28,{w:52,d:34,col:P.cloth,col2:P.cloth2},{fl:1});
  add('plantaGrande',64,46);add('maceta',64,12,{kind:P.kind});add('maceta',-62,-38,{kind:P.kind2});
  if(nor||vol)wr('pielPared',34);
  lt.push([-40,-36,14,110,'#ffc070'],[2,-36,20,110,'#ffd890']);
  return{id,nm:ori?'Escritorio y taller':'Taller',it,st,lt}}
 // Biomas 6–8 (Páramo, Desierto, Costa) aún no tienen paleta de interior propia: usan la de un bioma afín (6→Cumbres, 7→Oriental, 8→Pradera) hasta su fase (antes `ROOMS[k]` era undefined y entrar a sus casas lanzaba un error).
 const IKB=k=>PALS[k]?k:({6:3,7:4,8:0})[k]||0;
 const ROOMS=PALS.map((p,k)=>({herreria:mk(k,'herreria'),taberna:mk(k,'taberna'),taller:mk(k,'taller'),banco:mk(k,'banco'),tienda:mk(k,'tienda'),templo:mk(k,'templo')}));
 const DNAME={herreria:'Herrería',taberna:'Taberna',taller:'Taller',banco:'Banco',tienda:'Tienda',templo:'Templo'};

 const shellO=k=>{const p=PALS[k];return{w:RW,d:RD,h:RH,style:p.style,wall:p.wall,wall2:p.wall2,beam:p.beam,floor:p.floor,moss:p.moss,glass:p.glass,doorAt:RW*DOOR,wood:p.wood,woodL:p.woodL,woodD:p.woodD,lava:p.lava,stone:p.stone}};

 // ── entrada / salida ──
 // posición de la puerta de cada casa (mundo): el modelo dibuja la puerta en la cara +y, a x=fx·w (K·…); con rot se espeja (x↔y). off = hacia fuera.
 const DM={iglesia:[40,24,-1/6,1.9],pagoda:[30,30,0,1.5],templo:[38,38,0,1.5],casa:[30,22,-1/6,2.3],taberna:[36,26,-.16,2.15],troncos:[32,24,-1/6,2.3],casaLarga:[46,22,-.2,1.7],salon:[40,28,-.15,1.6],palafito:[30,22,-1/6,2.3],casaJp:[32,24,-1/6,2.1],casaMaya:[30,22,-1/6,2.1]};
 function doorPos(p,B){const m=DM[p.n];if(!m)return null;const w=(p.o&&p.o.w)||m[0],d=(p.o&&p.o.d)||m[1],K=ORG.KSC[p.n]||m[3],lx=K*m[2]*w,ly=K*d/2+14,rot=p.o&&p.o.rot;return rot?{x:B.ox+p.x+ly,y:B.oy+p.y+lx}:{x:B.ox+p.x+lx,y:B.oy+p.y+ly}}
 // se llama desde game.js tras crear las instalaciones de las aldeas: elige 3 casas por bioma (Herrería = la más cercana al horno, Taberna/Salón = la taberna o la casa más cercana a la tienda, Taller = la más cercana al banco de trabajo)
 window.intDoorPos=doorPos;   // lote D5: lo usa el editor de aldeas (village-edit.js) para mover la puerta con su casa
 window.intDoorsInit=function(){BI.forEach((B,k)=>{const V=B.village,hs=[];V.props.forEach(p=>{const q=DM[p.n]&&doorPos(p,B);if(q)hs.push({p,q})});if(!hs.length)return;
   // lote D2: una puerta con otra casa/edificio a <90 px DELANTE queda «tapada» (fachada metida contra la pared de enfrente; pasaba con el Taller en las 6 aldeas) → penalización fuerte
   const BIG=/^(casa|taberna|troncos|casaLarga|salon|palafito|casaJp|casaMaya|stabbur|casaArbol|cabana|granero|gallinero|guarida|templo|iglesia|pagoda|molino)/; // los puestos de mercado no cuentan: van junto a la tienda a propósito
   const blocked=h=>{const r=h.p.o&&h.p.o.rot,nx=r?1:0,ny=r?0:1;return V.props.some(o=>{if(o===h.p||!BIG.test(o.n))return false;const dx=B.ox+o.x-h.q.x,dy=B.oy+o.y-h.q.y,f=dx*nx+dy*ny,sd2=Math.abs(dx*ny-dy*nx);return f>-6&&f<90&&sd2<46})};
   hs.forEach(h=>h.bl=blocked(h));
   const stn=id=>ST.find(e=>e.id===id&&!e.inroom&&ownAt(e.x,e.y)===k),used=new Set(),sv=(typeof VEDIT!=='undefined'&&VEDIT.doors(k))||{},saved={};for(const id in sv){const f=hs.find(h=>h.p._ek===sv[id]&&!used.has(h));if(f){saved[id]=f;used.add(f)}}   // lote D5: casa de cada instalación fijada por el editor de aldeas (sobrevive a que muevas casas)
   const pick=(e,pref)=>{if(!e)return null;let b=null,bd=1e12;hs.forEach(h=>{if(used.has(h))return;const d=Math.hypot(h.q.x-e.x,h.q.y-e.y)-(pref&&pref(h)?200:0)+(h.bl?600:0);if(d<bd){bd=d;b=h}});if(b)used.add(b);return b};
   const tag={};hs.forEach(h=>{if(h.p.room&&!saved[h.p.room]&&!tag[h.p.room]&&!used.has(h)){tag[h.p.room]=h;used.add(h)}});   // lote D7: casa fijada en layouts.js (p.room)
   const gt=(id,e,pf)=>saved[id]||tag[id]||pick(e,pf),out=[['herreria',gt('herreria',stn('furnace'))],['taller',gt('taller',stn('bench'))],['banco',gt('banco',stn('bank'))],['tienda',gt('tienda',stn('shop'))],['taberna',gt('taberna',stn('fire'),h=>h.p.n==='taberna'||h.p.n==='salon'||h.p.tav)],['templo',gt('templo',stn('shrine'))]];   // lote B2: el Templo es una casa más (el altar de oración vive dentro)
   out.forEach(([id,h])=>{if(!h)return;V.cobs.push({p:[[h.p.x,h.p.y],[h.q.x-B.ox,h.q.y-B.oy]],w:60});   // adoquín bajo cada casa-instalación y su puerta (14 oct 2026)
    ST.push({id:'door',n:DNAME[id],x:h.q.x,y:h.q.y,k,room:id,lh:44,rot:!!(h.p.o&&h.p.o.rot),hn:h.p.n,hp:h.p})});
   ST.forEach(e=>{if((e.id==='board'||e.id==='ru')&&!e.inroom&&ownAt(e.x,e.y)===k)V.cobs.push({p:[[e.x-B.ox,e.y-B.oy],[e.x-B.ox,e.y-B.oy]],w:46})});
   // las instalaciones salen del mapa (viven dentro de las casas); la fogata de la plaza queda de adorno
   for(let i=ST.length-1;i>=0;i--){const e=ST[i];if(e.inroom||e.id==='door'||ownAt(e.x,e.y)!==k)continue;if(['bank','shop','furnace','anvil','bench','altar'].includes(e.id)||(e.id==='shrine'&&out.some(o=>o[0]==='templo'&&o[1])))ST.splice(i,1);else if(e.id==='fire'){e.deco=1;delete e.sks}}})}; const WOR=['N','ST','M','PO','GD','GA'];
 function canEnter(now){if(INT)return false;if(M.some(m=>m.hunt&&alive(m,now))||(A&&A.ty==='f')){toast('No puedes entrar con enemigos cerca.');return false}return true}
 window.enterRoom=function(e){const now=performance.now();if(!canEnter(now))return;const R=ROOMS[IKB(e.k)][e.room];if(!R)return;
  closeIW();stopA();P.g=P.mv=null;if(!SND.door)SND.door=()=>{noise(.1,.08,260,'lowpass');tone(150,.07,'triangle',.06,-50);setTimeout(()=>tone(220,.05,'sine',.03,-30),120)};snd('door');
  const sv={N:N.slice(),ST:ST.slice(),M:M.slice(),PO:PO.slice(),GD:GD.slice(),GA:GA.slice()};[N,ST,M,PO,GD,GA].forEach(a=>a.length=0);PJ.length=0;HFX.length=0;
  const items=R.it.map(q=>{const[n,x,y,o,ex]=q,fp=ex.fp||(ex.w||ex.wl||ex.fl?null:FPT[n])||null,tall=['hogar','alacena','plantaGrande','biombo','rackArmas','cama','barra'].includes(n);return{n,o,wx:IRC.x+x*IK,wy:IRC.y+y*IK,fl:!!ex.fl,fp,tall,oa:1,wall:!!(ex.w||ex.wl)}});
  const fpR=[];items.forEach(it=>{if(it.fp&&!it.fl){let[hx,hy]=it.fp;if(it.o.rot){const t=hx;hx=hy;hy=t}fpR.push([it.wx-hx,it.wx+hx,it.wy-hy,it.wy+hy])}});
  R.st.forEach(([id,x,y])=>{const s={id,n:({cocina:'Cocina',furnace:'Horno',anvil:'Yunque',armero:'Armero',curtidor:'Banco de curtidor',cantero:'Banco de cantero',joyero:'Banco de joyero',alambique:'Alambique',bench:'Taller',altar:'Escritorio',bank:'Banco',shop:'Tienda',market:'Mercado',fire:'Hogar',shrine:'Altar de oración'})[id]||id,x:IRC.x+x*IK,y:IRC.y+y*IK,k:e.k,inroom:1};if(id==='market'||id==='joyero')s.rot=1;   // una vuelta a la derecha (x↔z): el tablón queda paralelo a la pared izquierda y de cara a la sala
   if(id==='fire'||id==='cocina'){s.sks=['co'];if(id==='fire')s.nodraw=1}if(id==='bench'||id==='altar')s.sks=id==='bench'?['cr','sa']:['ins'];if(id==='cantero')s.sks=['es'];if(id==='joyero')s.sks=['jo'];if(id==='furnace'||id==='anvil'||id==='armero')s.sks=['sm'];if(id==='curtidor')s.sks=['pe'];if(id==='alambique')s.sks=['al'];ST.push(s);if(id==='bank'){s.lh=52;fpR.push([s.x-56,s.x+56,s.y-60,s.y+12])}else if(id==='shop')fpR.push([s.x-36,s.x+36,s.y-24,s.y+20]);else if(id==='market')fpR.push([s.x-22,s.x+22,s.y-32,s.y+32]);else if(id==='cocina')fpR.push([s.x-33,s.x+33,s.y-19,s.y+16]);else if(id==='cantero')fpR.push([s.x-23,s.x+23,s.y-13,s.y+13]);else if(id==='joyero')fpR.push([s.x-11,s.x+11,s.y-18,s.y+18]);else if(id!=='fire')fpR.push([s.x-20,s.x+20,s.y-13,s.y+13])});
  const dx=IRC.x+RW*DOOR*IK;
  ST.push({id:'exit',n:'Salir',x:dx,y:IRC.y-RD*IK/2+26,lh:44});
  INT={k:e.k,R,id:e.room,sv,items,fpR,ret:{x:e.x,y:e.y,rot:!!e.rot},t0:now,so:shellO(IKB(e.k)),dust:Array.from({length:16},(_,i)=>({x:Math.random(),y:Math.random(),v:.01+Math.random()*.02,p:Math.random()*6.28}))};
  P.x=dx;P.y=IRC.y-RD*IK/2+54;P.f=1;P.dir=0;P.vd=0;LFT=0;if(typeof curB!=='undefined')INT.cb=curB;
  toast('🚪 '+R.nm,1800);
  if(window.R3D&&R3D.rooms&&R3D.rooms.ok){try{R3D.rooms.enter(INT)}catch(err){console.warn('[R3D interior] sin sala 3D, se usa el diorama 2D:',err)}}};   // R3D-F15b
 // R3D-F15-SALIDA (20 oct 2026): el punto de la puerta cae DENTRO de la caja de colisión de la casa (crece con PROP_K) en ~60 % de las puertas → al salir `blk()` rechazaba todo movimiento (BUG «héroe atascado al entrar»).
 // La reaparición busca el punto LIBRE más cercano delante de la puerta (sur si rot=0, este si rot=1), luego a los lados y por último en anillos; garantiza `!blk` y sin acantilado.
 const freeBy=(x,y,rot)=>{const ok=(px,py)=>!blk(px,py)&&!(TER.cliffNear&&TER.cliffNear(px,py,6));if(ok(x,y))return[x,y];const fx=rot?1:0,fy=rot?0:1,lx=fy,ly=fx;
  for(const d of[16,24,32,44,56,70,90,115,145,180])for(const l of[0,18,-18,36,-36,60,-60]){const px=x+fx*d+lx*l,py=y+fy*d+ly*l;if(ok(px,py))return[px,py]}
  for(let r=20;r<=320;r+=12)for(let a=0;a<24;a++){const px=x+Math.cos(a*Math.PI/12)*r,py=y+Math.sin(a*Math.PI/12)*r;if(ok(px,py))return[px,py]}
  return[x,y]};
 window.leaveRoom=function(quiet){if(!INT)return;const I=INT;if(window.R3D&&R3D.rooms)try{R3D.rooms.leave()}catch(err){}closeIW();stopA();P.g=P.mv=null;S.stn=null;[N,ST,M,PO,GD,GA].forEach(a=>a.length=0);
  N.push(...I.sv.N);ST.push(...I.sv.ST);M.push(...I.sv.M);PO.push(...I.sv.PO);GD.push(...I.sv.GD);GA.push(...I.sv.GA);
  INT=null;{const q=freeBy(I.ret.x,I.ret.y,I.ret.rot);P.x=q[0];P.y=q[1]}LFT=0;FD=performance.now();if(!quiet)snd('door');dirty=1;GOOD=null;P.mv=null};
 // ── colisión y alturas ──
 window.intBlk=(x,y)=>{const hx=RW*IK/2-12,hy=RD*IK/2-12;if(Math.abs(x-IRC.x)>hx||Math.abs(y-IRC.y)>hy)return true;for(const r of INT.fpR)if(x>r[0]&&x<r[1]&&y>r[2]&&y<r[3])return true;return false};
 {const hA=TER.heightAt,sZ=TER.standZ;TER.heightAt=(x,y)=>INT?2:hA(x,y);TER.standZ=(x,y)=>INT?0:sZ(x,y)}
 // ── pintado ──
 window.dDoor=function(e,t){if(SIL)return;const p=ISO.toCanvas(e.x,e.y,0),s=ISO.scale(),near=Math.hypot(P.x-e.x,P.y-e.y)<90,a=(near?.5:.22)+.08*Math.sin(t*3+e.x);ctx.save();ctx.setTransform(1,0,0,1,0,0);
  const x=p.x-SPX,y=p.y-SPY-4*s;ctx.globalAlpha=a;ctx.fillStyle='#ffd88a';ctx.beginPath();ctx.ellipse(x,y,17*s,8*s,0,0,7);ctx.fill();ctx.globalAlpha=Math.min(1,a+.3);ctx.strokeStyle='#fff0b8';ctx.lineWidth=Math.max(1,s*.9);ctx.beginPath();ctx.ellipse(x,y,17*s,8*s,0,0,7);ctx.stroke();ctx.restore()};
 // R3D-F15b · versión con la sala en 3D: el lienzo 2D solo pinta lo que SIGUE siendo 2D (etiquetas y resaltes de estaciones, marcadores de puerta/salida, héroe compuesto, texto flotante, fundido de entrada).
 window.intScene3=function(now,t){const s=ISO.scale(),dtv=OCDT||.016;ISO.snap(IRC.x,IRC.y,0);ctx.setTransform(1,0,0,1,0,0);R3D.frame(now);ctx.setTransform(1,0,0,1,0,0);
  dCur(t);hovUpdate();const draws=[];
  ST.forEach(e=>draws.push([ISO.depth(e.x,e.y),()=>{if(e.id==='door'||e.id==='exit'){dDoor(e,t);return}spr(e.x,e.y,0,()=>dS(e,t))}]));
   draws.push([ISO.depth(P.x,P.y),()=>R3D.drawHero(ctx)]);
  draws.sort((a,b)=>a[0]-b[0]).forEach(o=>o[1]());
  parts.forEach(p=>p.hs?hsDraw(p):spr(p.x,p.y,12,()=>{ctx.globalAlpha=Math.min(1,p.l);if(p.sp){ctx.beginPath();ctx.arc(p.x,p.y,7,0,7);ctx.fillStyle=p.sp;ctx.fill();T(p.tx,p.x,p.y+4,'#fff')}else if(p.tx)T(p.tx,p.x,p.y,p.c);else Rc(p.c,p.x,p.y,2,2);ctx.globalAlpha=1}));
  ctx.setTransform(1,0,0,1,0,0);const e=now-INT.t0;if(e<500){ctx.globalAlpha=1-e/500;ctx.fillStyle='#000';ctx.fillRect(0,0,cv.width,cv.height);ctx.globalAlpha=1}
  if(P.hp<=0)leaveRoom(1)};
 window.INTROOMS={ROOMS,PALS,RW,RD,RH,doorPos};
})();
