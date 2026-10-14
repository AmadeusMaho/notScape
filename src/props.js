// NotScape · F3-A · props de aldea (casas, farolas, vallas, barriles…). Primer uso de las formas de style-organic.js (ORG.U) dentro del juego.
// (Los datos de los props viven en biomes.js → BIOMES.list[k].village.props.) Cada prop es {n: nombre en ORG.U, x, y (mundo), o: opciones del modelo (colores, tamaños), fp: [medio ancho, medio fondo] de colisión en px de mundo}.
// El sprite se hornea UNA vez por (modelo, opciones, escala) en un lienzo y luego solo se estampa (sin coste por frame). Datos locales al bioma (x desde k*BW).
// Para otra aldea: otra lista LAY (F3-C). Colisión: PROPS.solid(x,y) se suma a blk() en game.js; los props NO tocan BLK (BLK pinta agua en world-iso.js).
const PROPS=(()=>{
 const W=260,H=250,AX=130,AY=205; // lienzo de horneado en px de modelo y punto de apoyo
 const TALL={santuario:1,abedul:1,arce:1,fresno:1,tejo:1,ebano:1,totem:1,columna:1,arcoRuina:1,carpa:1,guarida:1,gallinero:1,puesto:1,altarDemon:1,arbolSeco:1,pino:1,roble:1,sauce:1,estandarte:1,antorcha:1,muroRuina:0,portonOrco:1,empalizada:1,mena:0,casa:1,casaLarga:1,stabbur:1,salon:1,troncos:1,casaArbol:1,palafito:1,casaJp:1,templo:1,casaMaya:1,estela:1,pagoda:1,torii:1,cerezo:1,taberna:1,granero:1,cabana:1,pozo:1,herreria:1,estanteria:1};
 // BH: caja de cada modelo (medida con tools/bbox_props.py + 12 px de margen). Antes cada sprite, hasta una roca, se horneaba en 260×250 px de modelo (≈570×550 reales): bake lento, memoria de más y tirones al entrar props nuevos.
 const BH={abrevadero:[31,37,31,24],altarDemon:[35,38,50,25],antorcha:[19,20,53,16],arbolSeco:[28,32,48,22],arbusto:[33,37,34,24],arcoRuina:[62,79,71,45],asador:[34,40,42,26],atril:[25,28,41,20],bambu:[25,29,65,20],banca:[29,33,31,22],barca:[40,49,33,30],barril:[25,28,33,20],brasero:[24,27,45,19],caballete:[32,38,37,25],cabana:[59,64,73,38],caja:[25,28,31,20],candelabro:[23,26,55,19],carbon:[34,36,31,24],carpa:[37,44,57,28],carreta:[34,41,41,26],casa:[63,75,90,43],casaArbol:[63,62,134,31],casaJp:[78,100,75,56],casaLarga:[62,74,63,43],casaMaya:[81,100,71,56],cerezo:[39,38,71,25],cestaPeces:[26,30,26,21],charco:[33,33,23,22],cofre:[36,43,37,27],columna:[28,32,63,27],comedero:[30,35,28,23],cruz:[31,31,44,21],empalizada:[40,39,55,25],espantapajaros:[26,25,63,18],estandarte:[22,25,74,18],estanteria:[34,40,63,26],estatuaZorro:[31,37,51,24],estela:[26,30,59,21],farola:[25,29,77,20],fumarola:[33,40,27,26],gallinero:[35,42,46,27],granero:[72,91,92,51],guarida:[43,53,41,32],heno:[32,35,38,24],herreria:[65,64,67,37],hoguera:[32,38,25,25],huesos:[28,32,23,22],junco:[25,28,58,20],lanzas:[23,26,63,19],lapida:[31,31,41,21],lenera:[34,40,37,26],lingotes:[28,32,27,22],linterna:[26,27,48,19],muela:[28,32,38,22],muroRuina:[39,41,49,26],obsidiana:[25,29,44,20],olla:[28,32,42,22],pagoda:[55,56,79,34],palafito:[86,104,112,56],piedra:[37,45,35,28],pilaTroncos:[33,38,38,25],portillo:[38,35,38,23],portonOrco:[51,50,88,23],pozo:[40,39,75,24],puesto:[36,39,49,25],rack:[31,36,50,24],red:[32,38,60,25],roca:[29,34,28,23],rollos:[25,28,35,20],runestone:[25,29,46,20],salon:[63,74,98,43],santuario:[40,49,67,30],secadero:[31,36,48,24],seta:[25,28,27,20],stabbur:[42,41,73,25],taberna:[68,83,109,47],tablones:[34,36,33,24],templo:[54,63,62,37],tinaja:[35,40,36,26],tocon:[23,26,26,19],torii:[44,47,81,29],totem:[24,27,79,19],tronco:[35,41,32,27],troncos:[71,83,87,48],tumba:[31,37,31,24],valla:[28,32,36,22],vasija:[23,24,32,18],verja:[27,31,39,21]};
 // Cachés de sprites horneados con LÍMITE POR MEMORIA (oct 2026; antes eran por número: 260 props, 360 monstruos, 900 jugador → con zoom/dpr altos un sprite pesa 4-10 veces más
 // y los límites por número ni protegían la memoria ni daban margen: las entradas útiles se tiraban y se volvían a hornear al caminar = tirones). El presupuesto total sale de la RAM
 // del equipo (navigator.deviceMemory, máx. 8 en Chrome; sin dato se supone 4) y se reparte: props 45 %, monstruos 25 %, jugador 20 %, tendero 10 %. PROPS.budget lo ajusta a mano.
 const BUD=(()=>{const dm=(typeof navigator!=='undefined'&&navigator.deviceMemory)||4;return Math.max(110e6,Math.min(380e6,dm*48e6))})();
 function lru(share){const m=new Map();let by=0;return{get(k){const b=m.get(k);if(b){m.delete(k);m.set(k,b)}return b},
  set(k,b,w,h){b.by=w*h*4;by+=b.by;m.set(k,b);const mx=BUD*share;while(by>mx&&m.size>16){const o=m.entries().next().value;by-=o[1].by;m.delete(o[0])}return b},
  get size(){return m.size},get bytes(){return by}}}
 let list=[],sol=[],extra=[],trees=[],cache=lru(.45),SG=null;   // SG: rejilla de 128 px con los rectángulos sólidos (solid() no recorre toda la lista)
 // lote D5 (editor de aldeas): build() se reparte en mk() (entidad de mundo desde la pieza LOCAL p; guarda p en e._src), solOf() (colisión de una pieza) y resol() (recalcula toda la colisión
 // desde las piezas fuente: es lo que usa el editor tras mover/rotar/escalar/borrar). Una pieza puede llevar p.sc (escala del editor, 0,5-2; escala sprite y huella) y p._del (borrada por el editor).
 function solOf(p,B,tree){const x=B.ox+p.x,y=B.oy+p.y,sc=p.sc||1;
  if(p.fp){const f=!tree&&p.o&&p.o.rot?[p.fp[1],p.fp[0]]:p.fp;sol.push([x-f[0]*sc,x+f[0]*sc,y-f[1]*sc,y+f[1]*sc])}
  if(!tree&&p.fps)p.fps.forEach(r=>sol.push([x+r[0]-r[2],x+r[0]+r[2],y+r[1]-r[3],y+r[1]+r[3]]))}
 function mk(p,k){const B=BIOMES.list[k],e=Object.assign({},p,{x:B.ox+p.x,y:B.oy+p.y,k,_oa:1,_src:p,sc:p.sc||1});if(p.fp){const f=p.o&&p.o.rot?[p.fp[1],p.fp[0]]:p.fp;e.fp=[f[0]*e.sc,f[1]*e.sc]}return e}
 function build(){list=[];sol=[];SG=null;trees=[];extra=[];for(let k=0;k<BIOMES.N;k++){const B=BIOMES.list[k];for(const p of B.village.props){if(p._del)continue;
  const ti=TREES.indexOf(p.n);if(ti>=0){trees.push({i:ti,x:B.ox+p.x,y:B.oy+p.y});solOf(p,B,1);continue}   // árbol → recurso talable (lo crea game.js desde PROPS.trees)
  list.push(mk(p,k));solOf(p,B,0)}}}
 function resol(){sol=[];SG=null;for(let k=0;k<BIOMES.N;k++){const B=BIOMES.list[k];for(const p of B.village.props)if(!p._del)solOf(p,B,TREES.indexOf(p.n)>=0)}extra.forEach(r=>sol.push(r))}
 const addEnt=(p,k)=>{const e=mk(p,k);list.push(e);resol();return e},delEnt=e=>{const i=list.indexOf(e);if(i>=0)list.splice(i,1);resol()};
 const GC=128,gk=(i,j)=>i*100003+j;
 function sgrid(){SG=new Map();for(const r of sol){for(let i=Math.floor(r[0]/GC);i<=Math.floor(r[1]/GC);i++)for(let j=Math.floor(r[2]/GC);j<=Math.floor(r[3]/GC);j++){const k=gk(i,j);let a=SG.get(k);if(!a)SG.set(k,a=[]);a.push(r)}}}
 const solid=(x,y)=>{if(!SG)sgrid();const a=SG.get(gk(Math.floor(x/GC),Math.floor(y/GC)));if(a)for(const r of a)if(x>r[0]&&x<r[1]&&y>r[2]&&y<r[3])return true;return false};
 function bake(e,s,sil){const k=e.k!=null?e.k:Math.max(0,BIOMES.at(e.x,e.y)),th=BIOMES.list[k].village.theme||null,key=e.n+'|'+JSON.stringify(e.o||{})+'|'+s.toFixed(3)+(sil?'|sil':'')+(th?'|k'+k:'');let b=cache.get(key);if(b)return b;
  const hh=BH[e.n],cw=hh?hh[0]+hh[1]:W,ch=hh?hh[2]+hh[3]:H,ax=hh?hh[0]:AX,ay=hh?hh[2]:AY;   // lienzo a medida (BH: izq,der,arriba,abajo en px de modelo); sin entrada = lienzo grande
  const c=document.createElement('canvas'),w=Math.ceil(cw*s),h=Math.ceil(ch*s);c.width=w;c.height=h;const g=c.getContext('2d');g.setTransform(s,0,0,s,0,0);g.lineJoin='round';
  ORG.noSoft(sil);ORG.theme(th);ORG.rot(e.o&&e.o.rot);try{ORG.U[e.n](g,ax,ay,0,e.o)}catch(x){if(window.console)console.warn('[PROPS]',e.n,x)}finally{ORG.noSoft(false);ORG.theme(null);ORG.rot(false)}
  b={c,ax:ax*s,ay:ay*s};if(hh){const m=Math.round(11*s);b.bb=[m,m,Math.max(1,w-2*m),Math.max(1,h-2*m)]}   // caja del sprite = el lienzo a medida menos su margen de 12 px (BH): evita leer píxeles de la GPU (getImageData = «GPU stall due to ReadPixels») al iluminarlo de noche
  return cache.set(key,b,w,h)}
 // estampa el prop; si el jugador queda detrás y tapado, se atenúa a ~50 % con transición suave (como occ() de game.js)
 function draw(g,e,P,dt){const s=ISO.scale(),b=bake(e,s),p=ISO.toCanvas(e.x,e.y,TER.standZ(e.x,e.y)),pf=ISO.toCanvas(P.x,P.y,TER.standZ(P.x,P.y)),tall=TALL[e.n]?1:0;
  let tgt=1;if(tall&&ISO.depth(e.x,e.y)>ISO.depth(P.x,P.y)){const dy=p.y-pf.y,dx=Math.abs(p.x-pf.x);if(dy>-8*s&&dy<80*s&&dx<44*s)tgt=.5}
  e._oa+=(tgt-e._oa)*(1-Math.exp(-dt*14));g.save();g.setTransform(1,0,0,1,0,0);g.globalAlpha=e._oa;
  // luz dinámica (src/light.js): si le llega luz, se estampa una copia con el degradado cálido/oscuro encima (solo sobre sus píxeles)
  let src=b.c;const li=(typeof LIGHT!=='undefined'&&LIGHT.on)?LIGHT.at(e.x,e.y,e):null;
  let ox=0,oy=0;
  if(li&&li.w>=.04){if(!b.bb){const c=b.c,d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let x0=c.width,y0=c.height,x1=0,y1=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>8){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
    b.bb=x1>=x0?[x0,y0,x1-x0+1,y1-y0+1]:[0,0,1,1]}
   const[bx,by,bw,bh]=b.bb,L=LIGHT.sprite(bw,bh);L.g.drawImage(b.c,bx,by,bw,bh,0,0,bw,bh);
   LIGHT.tint(L.g,bw,bh,b.ax-bx,b.ay-by-(tall?34:12)*s,(tall?46:16)*s,li);src=L.c;ox=bx;oy=by}
  if(e.sc&&e.sc!==1){g.translate(Math.round(p.x),Math.round(p.y));g.scale(e.sc,e.sc);g.drawImage(src,Math.round(-b.ax)+ox,Math.round(-b.ay)+oy)}   // escala del editor de aldeas (lote D5)
  else g.drawImage(src,Math.round(p.x-b.ax)+ox,Math.round(p.y-b.ay)+oy);if(FXN[e.n])propFx(g,e,p.x,p.y,s,performance.now()/1000);g.restore()}


 // ── precalentado (oct 2026): hornear un sprite por primera vez cuesta 5-25 ms y, si ocurre al entrar en pantalla, es un tirón al caminar.
 // warm() recorre las listas (nodos, estaciones, props) en rondas de 300, y hornea lo que está a menos de ~1 pantalla del borde, con presupuesto en ms.
 let wcur=0;
 function warmOne(e,s){
  if(e.t==='wc'||e.t==='mi'){const mi=e.t==='mi',i=e.i;for(const dead of[false,true]){const n=mi?'mena':(dead?'tocon':TREES[i]),opt=mi?{base:MBA[i],ore:MOR[i],crystal:i>=5,dead}:{};bake({n,o:opt,x:e.x},s,false)}return}
  if(e.id&&ST[e.id]){const d=ST[e.id];if(!d.n)return;const ar=Math.max(0,BIOMES.at(e.x,e.y));const vs=e.id==='bank'?[{night:false},{night:true}]:e.id==='furnace'?[{on:false},{on:true}]:[{}];for(const v of vs)bake({n:d.n,o:Object.assign({arch:ar},v),x:e.x},s,false);return}
  if(e.n&&ORG.U[e.n])bake(e,s,false)}
 function warm(lists,ms){const s=ISO.scale(),t0=performance.now(),V=ISO.V,m=.8*Math.max(V.cw,V.ch);let tot=0;for(const L of lists)tot+=L.length;if(!tot)return 0;let done=0,scan=300;
  while(scan-->0){let k=wcur=(wcur+1)%tot,L=null;for(const A of lists){if(k<A.length){L=A;break}k-=A.length}if(!L)continue;const e=L[k];if(!e||e._ws===s)continue;
   const q=ISO.toCanvas(e.x,e.y,1);if(q.x<-m||q.x>V.cw+m||q.y<-m||q.y>V.ch+m)continue;
   try{warmOne(e,s)}catch(x){}e._ws=s;done++;if(performance.now()-t0>ms)break}return done}
 // ── carga previa (pantalla de carga, oct 2026): hornean TODO lo que se va a necesitar al empezar a caminar, para que no haya hornadas (5-25 ms cada una) durante el juego. El estado `st` es del llamador.
 // warmPass: recorre UNA vez las listas y hornea lo que cae a menos de `range` pantallas del borde de la vista; devuelve la fracción hecha (0..1).
 function warmPass(lists,ms,range,st){const s=ISO.scale(),t0=performance.now(),V=ISO.V,m=(range||1.1)*Math.max(V.cw,V.ch);if(!st.all){st.all=[].concat(...lists);st.i=0}
  while(st.i<st.all.length){const e=st.all[st.i++];if(!e||e._ws===s)continue;const q=ISO.toCanvas(e.x,e.y,1);if(q.x<-m||q.x>V.cw+m||q.y<-m||q.y>V.ch+m)continue;try{warmOne(e,s)}catch(x){}e._ws=s;if(performance.now()-t0>ms)break}
  return st.all.length?st.i/st.all.length:1}
 // warmHero: ciclo de andar y correr en las 8 direcciones + reposo, con el equipo/apariencia actuales (eq={dir,ar,helm,boot,app}). Para si el jugador ya ocupa el 70 % de su cuota de memoria.
 function warmHero(st,ms,eq){const s=ISO.scale(),t0=performance.now();
  if(!st.q){st.q=[];const d0=eq.dir==null?2:eq.dir;for(let k=0;k<8;k++){const d=(d0+k)%8;for(const run of[false,true])for(let f=0;f<HERO.NF;f++)st.q.push({dir:d,mv:true,run,w:(f+.02)/HERO.NF*2*Math.PI,t:0});for(let i=0;i<8;i++)st.q.push({dir:d,mv:false,run:false,w:0,t:i*.37})}st.i=0}
  while(st.i<st.q.length){const o=st.q[st.i++];if(PLC.bytes>BUD*.2*.7){st.i=st.q.length;break}
   try{const R=HERO.pose({dir:o.dir,mv:o.mv,run:o.run,w:o.w,t:o.t,act:null,hurt:0,blink:false});playerFrame(R,{ar:eq.ar||null,helm:eq.helm||null,boot:eq.boot||null,app:eq.app||null},s,false)}catch(x){}
   if(performance.now()-t0>ms)break}
  return st.q.length?Math.min(1,st.i/st.q.length):1}
 // warmMob: andar y reposo (8 fases, mirando a ambos lados) de cada tipo de monstruo `ids`. Los golpes y destellos se hornean al vuelo (son raros).
 function warmMob(st,ms,ids){const s=ISO.scale(),t0=performance.now();
  if(!st.q){st.q=[];for(const id of ids)for(const f of[1,-1])for(let ph=0;ph<8;ph++){const a=ph*Math.PI/4;st.q.push([id,f,{st:Math.round(Math.sin(a*2)*2)/2,bob:0,t:a,atk:0}],[id,f,{st:0,bob:Math.round(Math.sin(a)*2)/2,t:a,atk:0}])}st.i=0}
  while(st.i<st.q.length){const q=st.q[st.i++];if(MCA.bytes>BUD*.25*.8){st.i=st.q.length;break}try{mobFrame(q[0],q[1],q[2],0,s,false)}catch(x){}if(performance.now()-t0>ms)break}
  return st.q.length?Math.min(1,st.i/st.q.length):1}
 // instalaciones (banco, tienda, fogata, horno, yunque, taller, escritorio). lh = altura de la etiqueta en px de modelo. El sprite se hornea una vez por variante
 // (banco de noche, horno encendido) y se pinta con el desplazamiento (ox,oy) del lienzo pequeño de hl()/occ(); llamas y luz de vela son overlays en vivo.
 const ST={bank:{n:'banco',lh:68},shop:{n:'tienda',lh:50},ru:{n:null,lh:66},board:{n:'tablon',lh:44},fire:{n:'fogata',lh:34},furnace:{n:'horno',lh:58},anvil:{n:'yunque',lh:48},bench:{n:'taller',lh:50},altar:{n:'escritorio',lh:54},shrine:{n:'altarRezo',lh:50}};
 const prj=(X,Y,Z,K)=>[(X-Y)*.7071*K,(X+Y)*.3536*K-Z*.866*K];
 function flame(g,cx,cy,s,t,h0,w0,seed){for(let k=0;k<3;k++){const h=(h0+Math.sin(t*14+k*2+seed)*h0*.2)*s,w=w0*s,x=cx+(k-1)*w0*.9*s;
   [['#ff7a1a',1],['#ffd23a',.55]].forEach(([c,f])=>{g.fillStyle=c;g.beginPath();g.moveTo(x-w*f,cy);g.quadraticCurveTo(x-w*.8*f,cy-h*f*.6,x+Math.sin(t*9+k+seed)*2*s,cy-h*f);g.quadraticCurveTo(x+w*.8*f,cy-h*f*.6,x+w*f,cy);g.closePath();g.fill()})}}

 // ── animaciones en vivo (F3-C): humo, chispas, brasas, pétalos y llamas. Sin azar: todo sale de t y una semilla → determinista y barato.
 const prj2=(n,X,Y,Z,rot)=>{const K=(ORG.KSC[n]||1);return rot?prj(Y,X,Z,K):prj(X,Y,Z,K)};
 // n partículas que suben desde (cx,cy) y se desvanecen; col=color, r0=radio inicial, grow=cuánto crecen, rise=altura (px de pantalla/s), dr=deriva lateral
 function puffs(g,cx,cy,s,t,seed,n,o){const per=o.per||3.2;for(let i=0;i<n;i++){const ph=((t/per+i/n+seed*.137)%1),a=(1-ph)*(ph<.12?ph/.12:1)*(o.al||.3),r=(o.r0+o.grow*ph)*s;if(a<=.01)continue;
   g.globalAlpha=a;g.fillStyle=o.col;g.beginPath();g.arc(cx+(o.dr||6)*s*(ph*(.6+Math.sin(seed+i*2.1)*.4)+Math.sin(t*.8+i)*.12*ph),cy-ph*o.rise*s,r,0,7);g.fill()}g.globalAlpha=1}
 function sparks(g,cx,cy,s,t,seed,n,col){for(let i=0;i<n;i++){const per=.55+((i*37+seed)%5)*.08,ph=((t/per+i*.31+seed*.11)%1),a=1-ph;if(a<=.05)continue;const ang=-1.2+((i*53+seed)%9)*.3-.6,v=14+((i*29)%7)*3;
   g.globalAlpha=a;g.fillStyle=i%2?col:'#fff2a0';g.fillRect(cx+Math.cos(ang)*v*ph*s,cy+(Math.sin(ang)*v*ph+ph*ph*18)*s,1.6*s,1.6*s)}g.globalAlpha=1}
 function petals(g,cx,cy,s,t,seed,n,cols){cols=cols||['#ffc2d6','#ff9ec0'];for(let i=0;i<n;i++){const ph=((t/7+i/n+seed*.07)%1),x=cx+(Math.sin(i*5.3+seed)*18+ph*26+Math.sin(t*1.3+i)*4)*s,y=cy-26*s+ph*52*s,a=Math.sin(ph*Math.PI);
   g.globalAlpha=a*.9;g.fillStyle=cols[i%2];g.beginPath();g.ellipse(x,y,1.9*s,1.1*s,t+i,0,7);g.fill()}g.globalAlpha=1}
 const glow=(g,cx,cy,r,col,a)=>{g.globalAlpha=a;g.fillStyle=col;g.beginPath();g.arc(cx,cy,r,0,7);g.fill();g.globalAlpha=1};
 function flies(g,cx,cy,s,t,seed,n,col){for(let i=0;i<n;i++){const a=t*(.35+i*.07)+seed+i*2.4,x=cx+Math.cos(a)*(14+i*4)*s,y=cy-(10+Math.sin(a*1.3+i)*6+i*5)*s,k=.5+.5*Math.sin(t*2.3+i*1.9+seed);glow(g,x,y,3.2*s,col,.12*k);glow(g,x,y,1.1*s,'#fffbd0',.9*k)}}
 const CH={casa:o=>[-(o.w||30)*.27,-(o.d||22)*.14,(o.h||16)+17],casaLarga:o=>[(o.w||46)*.2,-(o.d||22)*.1,24],cabana:o=>[-(o.w||22)*.28,-(o.d||18)*.1,25],troncos:o=>[-(o.w||32)*.27,-(o.d||24)*.14,30],taberna:o=>[(o.w||36)*.28,-(o.d||26)*.16,46]};
 const FXN={hoguera:1,antorcha:1,fumarola:1,altarDemon:1,estatuaZorro:0,casa:1,casaLarga:1,cabana:1,troncos:1,taberna:1,brasero:1,cerezo:1,bambu:1,templo:1,farola:1,linterna:1,seta:1,junco:1,palafito:1,estela:1,obsidiana:1,runestone:1};
 // overlay de un prop del paisaje: se pinta justo tras el sprite (lo dibuja draw() solo para los modelos de FXN)
 function propFx(g,e,px,py,s,t){const o=e.o||{},r=!!o.rot,n=e.n,sd=(e.x*.013+e.y*.007);let q;
  if(CH[n]){const c=CH[n](o);q=prj2(n,c[0],c[1],c[2],r);puffs(g,px+q[0]*s,py+q[1]*s,s,t,sd,5,{col:'#e8e4dc',r0:1.6,grow:4.5,rise:30,al:.45,per:4.2,dr:9})}
  else if(n==='brasero'){q=prj2(n,0,0,18.5,r);flame(g,px+q[0]*s,py+q[1]*s,s,t,7,2,sd);puffs(g,px+q[0]*s,py+q[1]*s-6*s,s,t,sd,3,{col:'#d8a070',r0:1,grow:2.5,rise:18,al:.18,per:2.2,dr:4})}
  else if(n==='templo')[[-1,-1],[1,-1],[-1,1],[1,1]].forEach((c,i)=>{q=prj2(n,c[0]*17,c[1]*17,10.5,r);flame(g,px+q[0]*s,py+q[1]*s,s,t,9,2.4,sd+i*1.7);glow(g,px+q[0]*s,py+q[1]*s-3*s,9*s,'#ff8a2a',.1+.04*Math.sin(t*11+i))});
  else if(n==='hoguera'){q=prj2(n,0,0,2.4,r);flame(g,px+q[0]*s,py+q[1]*s,s,t,13,3.4,sd);flame(g,px+q[0]*s+3*s,py+q[1]*s+1*s,s,t,8,2.2,sd+2);puffs(g,px+q[0]*s,py+q[1]*s-10*s,s,t,sd,4,{col:'#9a9088',r0:1.5,grow:4,rise:34,al:.3,per:3.4,dr:8});sparks(g,px+q[0]*s,py+q[1]*s,s,t,sd*10,4,'#ff8a2a')}
  else if(n==='antorcha'){q=prj2(n,0,0,25,r);flame(g,px+q[0]*s,py+q[1]*s,s,t,6,1.8,sd);glow(g,px+q[0]*s,py+q[1]*s-3*s,9*s,'#ffa040',.1+.05*Math.sin(t*11+sd*7))}
  else if(n==='fumarola'){q=prj2(n,0,0,3,r);glow(g,px+q[0]*s,py+q[1]*s,15*s,'#ff7a2a',.1+.06*Math.sin(t*2.2+sd*5));puffs(g,px+q[0]*s,py+q[1]*s,s,t,sd,5,{col:'#b8aaa4',r0:2,grow:6,rise:40,al:.32,per:4,dr:9})}
  else if(n==='altarDemon'){q=prj2(n,0,0,36,r);glow(g,px+q[0]*s,py+q[1]*s,13*s,'#ff3a2a',.12+.08*Math.sin(t*2.6+sd*3));sparks(g,px+q[0]*s,py+q[1]*s+2*s,s,t,sd*7,4,'#ff5a3a')}
  else if(n==='farola'){q=prj2(n,0,0,34.6,r);glow(g,px+q[0]*s,py+q[1]*s,10*s,'#ffd070',.1+.05*Math.sin(t*7+sd*9)+.03*Math.sin(t*17+sd))}
  else if(n==='linterna'){q=prj2(n,0,0,15,r);glow(g,px+q[0]*s,py+q[1]*s,9*s,'#ffd070',.12+.05*Math.sin(t*5+sd*9))}
  else if(n==='cerezo')petals(g,px,py,s,t,sd,6);
  else if(n==='bambu')petals(g,px,py,s,t,sd,3,['#a8d070','#7fb050']);
  else if(n==='seta'){q=prj2(n,0,0,8,r);puffs(g,px+q[0]*s,py+q[1]*s,s,t,sd,4,{col:'#e8f0b0',r0:.7,grow:.5,rise:22,al:.5,per:3.4,dr:10})}
  else if(n==='junco')flies(g,px,py,s,t,sd,3,'#d8f060');
  else if(n==='palafito')flies(g,px,py,s,t,sd,2,'#d8f060');
  else if(n==='estela'){q=prj2(n,0,0,16,r);glow(g,px+q[0]*s,py+q[1]*s,7*s,'#ff7a2a',.08+.07*(.5+.5*Math.sin(t*1.8+sd*5)))}
  else if(n==='obsidiana'){const k=(t*.5+sd)%1;if(k<.25){q=prj2(n,2,-1,7,r);const a=Math.sin(k/.25*Math.PI),x=px+q[0]*s,yy=py+q[1]*s;g.globalAlpha=a;g.fillStyle='#e8d8ff';g.fillRect(x-s,yy-3*s,2*s,6*s);g.fillRect(x-3*s,yy-s,6*s,2*s);g.globalAlpha=1}}
  else if(n==='runestone'){q=prj2(n,4,0,9,r);glow(g,px+q[0]*s,py+q[1]*s,6*s,'#ff5a3a',.07+.07*(.5+.5*Math.sin(t*1.5+sd*4)))}}

 // recursos de recolección (F3-D): árboles y rocas/menas con modelos ORG.U horneados (como las instalaciones). e={t:'wc'|'mi',i,x,y}; o={dead,on,sh,t,ox,oy,sil}
 const TREES=['pino','abedul','roble','fresno','sauce','arce','tejo','ebano','caoba','baobab','mundo'],MBA=['#8a5a3a','#9a9aa8','#6a4a3a','#3a3a40','#8a9aa8','#3a4a6a','#2a4a3a','#2a4a52','#5a3a2a','#3a3a5a'],MOR=['#c8742a','#e8e8f8','#c0603a','#6a6a72','#f0f0f8','#4a7aff','#3adf6a','#3ad0d8','#e89a3a','#c8a0ff'];
 function resource(g,e,o){const s=ISO.scale(),mi=e.t==='mi',i=e.i,n=mi?'mena':(o.dead?'tocon':TREES[i]),opt=mi?{base:MBA[i],ore:MOR[i],crystal:i>=5,dead:!!o.dead}:{},b=bake({n,o:opt,x:e.x},s,o.sil),p=ISO.toCanvas(e.x,e.y,TER.standZ(e.x,e.y)),px=p.x-o.ox,py=p.y-o.oy,T=o.t;
  g.save();g.setTransform(1,0,0,1,0,0);g.drawImage(b.c,Math.round(px-b.ax+(o.sh||0)*s*1.6),Math.round(py-b.ay));
  if(!o.sil&&!o.dead){const sd=e.x*.01+e.y*.013;
   if(!mi&&i>=7)glow(g,px,py-30*s,15*s,['#c060ff','#ffb050','#ff7060','#a0d0ff'][i-7]||'#c060ff',.1+.1*Math.sin(T*3+sd));
   else if(mi&&i>=5)glow(g,px,py-14*s,14*s,i===5?'#9ac0ff':i===6?'#a0ffc0':MOR[i],.1+.08*Math.sin(T*3+sd));
   else if(mi&&i===4){const k=(T*.6+sd)%1;if(k<.2){const a=Math.sin(k/.2*Math.PI);g.globalAlpha=a;g.fillStyle='#fff';g.fillRect(px+4*s,py-14*s,2*s,2*s);g.fillRect(px+3*s,py-13.5*s,4*s,1*s);g.globalAlpha=1}}}
  g.restore()}

 // decoración dispersa por bioma (F3-D): arbustos, rocas, setas, juncos… sin colisión; semilla fija → mismo mundo en cada carga.
 // Evita agua/acantilados (TER.heightAt≠1), caminos, la aldea, estaciones, zonas de recurso, recursos y guaridas.
 const SC=[[['arbusto',5],['roca',2],['heno',1]],[['arbusto',4],['seta',3],['tocon',3],['roca',1]],[['junco',5],['seta',2],['tocon',2],['arbusto',2]],[['roca',5],['runestone',1],['tocon',1]],[['bambu',4],['arbusto',3],['linterna',1],['roca',2],['cerezo',1]],[['obsidiana',4],['roca',4],['estela',1],['vasija',1]]];
 function scatter(c){const NB=BIOMES.N,out=[];
  for(let k=0;k<NB;k++){const B=BIOMES.list[k],x0=B.ox,y0=B.oy,BW=B.w,BH=B.h;let sd=(k*7919+17)>>>0;const rnd=()=>{sd=(sd+0x6D2B79F5)|0;let t=Math.imul(sd^sd>>>15,1|sd);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
   const segs=[];for(const r of B.routes)for(let i=0;i<r.length-1;i++)segs.push([x0+r[i][0],y0+r[i][1],x0+r[i+1][0],y0+r[i+1][1],B.pathW||40]);
   for(const q of (B.village.cobs||[]))for(let i=0;i<q.p.length-1;i++)segs.push([x0+q.p[i][0],y0+q.p[i][1],x0+q.p[i+1][0],y0+q.p[i+1][1],q.w||30]);
   const dseg=(x,y,a)=>{const dx=a[2]-a[0],dy=a[3]-a[1],l=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/l));return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t)-a[4]};
   const tot=SC[k].reduce((a,b)=>a+b[1],0),mine=[];let n=0,tries=0;
   const quota=Math.round((k===0?70:80)*BW*BH/(2300*1500));while(n<quota&&tries++<quota*22){const x=x0+60+rnd()*(BW-120),y=y0+70+rnd()*(BH-140),dl=x-x0,dr=x0+BW-x,nk=dl<dr?k-1:k+1,dn=Math.min(dl,dr),T2=nk>=0&&nk<NB&&dn<300&&rnd()<(1-dn/300)*.6?SC[nk]:SC[k],tt=T2.reduce((a,b)=>a+b[1],0);let r=rnd()*tt,m=T2[0][0];for(const q of T2){if((r-=q[1])<0){m=q[0];break}}
    if(![[0,0],[12,0],[-12,0],[0,10],[0,-10]].every(q=>TER.isLand(TER.heightAt(x+q[0],y+q[1]))))continue;if(TER.sandAt(Math.floor(x/32),Math.floor(y/32))>.2&&m!=='roca'&&m!=='junco')continue;
    if(segs.some(a=>dseg(x,y,a)<34))continue;
    if(c.ST.some(e=>Math.hypot(e.x-x,e.y-y)<70)||list.some(e=>e.k===k&&!e.sc&&Math.hypot(e.x-x,e.y-y)<(e.fp?Math.max(e.fp[0],e.fp[1])+34:30)))continue;
    if(c.ZS.some(z=>x>z.r[0]-30&&x<z.r[1]+30&&y>z.r[2]-30&&y<z.r[3]+30))continue;
    if(c.N.some(e=>Math.hypot(e.x-x,e.y-y)<40)||c.M.some(e=>Math.hypot(e.hx-x,e.hy-y)<36)||mine.some(e=>Math.hypot(e.x-x,e.y-y)<30))continue;
    mine.push({n:m,x,y,k,sc:1,_oa:1});n++}
   mine.forEach(e=>list.push(e))}}

 // jugador (F4b): ORG.U.heroe horneado por fotograma. La pose sale de HERO.pose (src/hero.js: 8 direcciones, caminar/correr, acciones, daño); aquí solo se cachea y se estampa.
 // o: {dir,mv,run,w,t,act,hurt,ar,helm,boot,ox,oy,sil}. Devuelve {tip} (punta de la caña, px de pantalla respecto a los pies) para la línea de pesca.
 const PLC=lru(.2);
 // apariencia del jugador (editor de personaje, S.app) → opciones de ORG.U.heroe. Un solo punto: el juego y la vista previa del editor usan lo mismo.
 function appOpts(a){a=a||{};const o={};if(a.skin)o.skin=a.skin;if(a.hc)o.hair=a.hc;if(a.hair)o.hairStyle=a.hair;if(a.eye)o.eye=a.eye;if(a.face)o.face=a.face;if(a.pants)o.pants=a.pants;if(a.g)o.gender=a.g;if(a.col)o.col=a.col;return o}
 function playerFrame(R,e,s,sil){const key=JSON.stringify([R.view,R.rot,R.pose,R.item,R.trail,e,s.toFixed(3),sil?1:0]);let b=PLC.get(key);if(b)return b;
  const w=130,h=150,ax=65,ay=116,c=document.createElement('canvas');c.width=Math.ceil(w*s);c.height=Math.ceil(h*s);const g=c.getContext('2d');g.setTransform(s,0,0,s,0,0);g.lineJoin='round';
  const o={view:R.view,pose:R.pose,item:R.item?Object.assign({},R.item):null,trail:R.trail,col:e.ar||'#c0392b',collar:e.ar?null:'#e8c0a8'};if(e.app){const q=appOpts(e.app);if(e.ar)delete q.col;Object.assign(o,q)}if(e.helm){o.hat='helm';o.hatCol=e.helm}if(e.boot)o.boot=e.boot;if(e.lamp!=null)o.lamp=e.lamp;if(e.gear){o.gear=e.gear;if(e.gear.cp)o.cape=e.gear.cp}
  ORG.noSoft(sil);ORG.rot(R.rot);try{ORG.U.heroe(g,ax,ay,0,o)}catch(x){if(window.console)console.warn('[PROPS] player',x)}finally{ORG.noSoft(false);ORG.rot(false)}
  b=trimFrame(c,ax*s,ay*s);return PLC.set(key,b,b.c.width,b.c.height)}
 // recorte del fotograma (oct 2026): el lienzo de 130×150 deja mucho aire alrededor del héroe; se copia solo la caja con píxeles (+1 px) a un lienzo propio.
 // Así cada fotograma ocupa ~1/4 de memoria y caben los 16 fotogramas por ciclo de caminar/correr. Una lectura de píxeles por horneado (no por frame).
 function trimFrame(c,ax,ay){let d;try{d=c.getContext('2d').getImageData(0,0,c.width,c.height).data}catch(x){return{c,ax,ay}}
  const W=c.width,H=c.height;let x0=W,y0=H,x1=-1,y1=-1;
  for(let y=0;y<H;y++){const r=y*W*4;for(let x=0;x<W;x++)if(d[r+x*4+3]){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;y1=y}}
  if(x1<0)return{c,ax,ay};x0=Math.max(0,x0-1);y0=Math.max(0,y0-1);x1=Math.min(W-1,x1+1);y1=Math.min(H-1,y1+1);
  const w=x1-x0+1,h=y1-y0+1;if(w*h>W*H*.8)return{c,ax,ay};const t=document.createElement('canvas');t.width=w;t.height=h;t.getContext('2d').drawImage(c,x0,y0,w,h,0,0,w,h);
  return{c:t,ax:ax-x0,ay:ay-y0}}
 // retrato para el inventario: el héroe de frente (dir 2), en reposo, con su apariencia y equipo, centrado en un lienzo propio
 function portrait(c,o){const sc=3,R=HERO.pose({dir:2,mv:false,run:false,w:0,t:0,act:null,hurt:0,blink:false}),b=playerFrame(R,{ar:o.ar||null,helm:o.helm||null,boot:o.boot||null,app:o.app||null,gear:o.gear||null},sc,false),g=c.getContext('2d');
  if(!b.bb2){const d=b.c.getContext('2d').getImageData(0,0,b.c.width,b.c.height).data;let x0=b.c.width,y0=b.c.height,x1=0,y1=0;for(let y=0;y<b.c.height;y++)for(let x=0;x<b.c.width;x++)if(d[(y*b.c.width+x)*4+3]>10){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}b.bb2=x1>=x0?[x0,y0,x1-x0+1,y1-y0+1]:[0,0,b.c.width,b.c.height]}
  const[bx,by,bw,bh]=b.bb2,k=Math.min(c.width*.68/bw,c.height*.8/bh);g.clearRect(0,0,c.width,c.height);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(b.c,bx,by,bw,bh,(c.width-bw*k)/2,c.height*.95-bh*k,bw*k,bh*k)}
 function player(g,P,o){const s=ISO.scale(),R0=HERO.pose({dir:o.dir,mv:o.mv,run:o.run,w:P.w,t:o.t,act:o.act,hurt:o.hurt||0,blink:!o.mv&&!o.act&&(o.t%5)<.13}),R=o.post?o.post(R0):R0, // o.post: fundido entre estados (HERO.blend, game.js)
   b=playerFrame(R,{ar:o.ar||null,helm:o.helm||null,boot:o.boot||null,app:o.app||null,lamp:o.lamp,gear:o.gear||null},s,o.sil),p=ISO.toCanvas(P.x,P.y,TER.standZ(P.x,P.y));
  g.save();g.setTransform(1,0,0,1,0,0);g.drawImage(b.c,Math.round(p.x-o.ox-b.ax),Math.round(p.y-o.oy-b.ay));g.restore();
  const tp=HERO.rodTip(R,ORG.KSC.heroe*(o.app&&o.app.g==='f'?.95:1));return{tip:tp}}

 // monstruos (F5): ORG.U[id] de src/creatures.js horneado por pose cuantizada. Pose = fase 0..7 (bucle de 1,6 s en reposo, 0,8 s andando; cada monstruo desfasado por m.hx),
 // paso `st` (−1..1 en 5 niveles), respiración `bob`, golpe `atk` (6 niveles, 520 ms desde m.at0 que pone monHit) y destello blanco al recibir daño (m.fl). Caché LRU de 220 fotogramas.
 // Todos los monstruos (goblin incluido desde oct 2026) son modelos de CRE; miran a la derecha y f=-1 los espeja.
 const MCA=lru(.25);
 function mobFrame(id,f,po,fl,s,sil){const key=[id,f,po.st,po.bob,po.atk,po.t.toFixed(2),fl,s.toFixed(3),sil?1:0].join('|');let b=MCA.get(key);if(b)return b;
  const bx=CRE.box(id),c=document.createElement('canvas');c.width=Math.ceil(bx.w*s);c.height=Math.ceil(bx.h*s);const g=c.getContext('2d');g.setTransform(s,0,0,s,0,0);g.lineJoin='round';
  try{ORG.U[id](g,bx.ax,bx.ay,0,{f,p:po,flash:fl,sil})}catch(x){if(window.console)console.warn('[PROPS] mob',id,x)}
  b={c,ax:bx.ax*s,ay:bx.ay*s};return MCA.set(key,b,c.width,c.height)}
 function mob(g,m,o){const s=ISO.scale(),id=m.d.id,mv=o.now-(m.mv||0)<250,ph=Math.floor(o.now/(mv?100:200)+(m.hx|0))&7,a=ph*Math.PI/4,ap=(o.now-(m.at0||-1e9))/520,
   po={st:mv?Math.round(Math.sin(a*2)*2)/2:0,bob:mv?0:Math.round(Math.sin(a)*2)/2,t:a,atk:ap>=0&&ap<1?Math.ceil(ap*6)/6:0},
   b=mobFrame(id,m.f||1,po,o.now<m.fl?1:0,s,o.sil),p=ISO.toCanvas(m.x,m.y,TER.standZ(m.x,m.y));
  g.save();g.setTransform(1,0,0,1,0,0);g.drawImage(b.c,Math.round(p.x-o.ox-b.ax),Math.round(p.y-o.oy-b.ay));g.restore()}

 // Ru (tendero) animado en vivo: se hornean fotogramas pequeños por pose cuantizada (respiración, parpadeo, saludo) y orientación hacia el jugador.
 const RC=lru(.1);
 function ruFrame(pose,rot,s,sil){const key=[pose.bob,pose.arm,pose.blink,pose.smile,rot?1:0,s.toFixed(3),sil?1:0].join('|');let b=RC.get(key);if(b)return b;
  const w=100,h=120,ax=50,ay=100,c=document.createElement('canvas');c.width=Math.ceil(w*s);c.height=Math.ceil(h*s);const g=c.getContext('2d');g.setTransform(s,0,0,s,0,0);g.lineJoin='round';
  ORG.noSoft(sil);ORG.rot(rot);try{ORG.U.aldeano(g,ax,ay,0,Object.assign({},ORG.PEOPLE.ru,{pose,turn:.6}))}catch(x){if(window.console)console.warn('[PROPS] ru',x)}finally{ORG.noSoft(false);ORG.rot(false)}
  b={c,ax:ax*s,ay:ay*s};return RC.set(key,b,c.width,c.height)}
 function ru(g,e,px,py,s,t,sil,off){let near=0,rot=false;if(typeof P!=='undefined'&&P){const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy);near=d<170?1:0;rot=dy>dx}
  const q=v=>Math.round(v*4)/4,per=9,ph=(t%per),wv=false,bob=q(Math.sin(t*2.1)*.5),
   pose={bob,arm:wv?Math.round((105+Math.sin(t*9)*22)/8)*8:0,blink:0,smile:.8},o=off?[0,0]:prj(37,6,0,1.5),f=ruFrame(pose,rot,s,sil);
  g.drawImage(f.c,Math.round(px+o[0]*s-f.ax),Math.round(py+o[1]*s-f.ay))}
 function station(g,e,o){if(e.id==='ru'){const s=ISO.scale(),p=ISO.toCanvas(e.x,e.y,TER.standZ(e.x,e.y));g.save();g.setTransform(1,0,0,1,0,0);ru(g,e,p.x-o.ox,p.y-o.oy,s,o.t,o.sil,1);g.restore();return ST.ru.lh}const d=ST[e.id],s=ISO.scale(),ar=e.k!=null?e.k:Math.max(0,BIOMES.at(e.x,e.y)),opt=Object.assign({arch:ar},e.id==='bank'?{night:!!o.night}:e.id==='furnace'?{on:!!o.on}:{}),b=bake({n:d.n,o:opt,x:e.x},s,o.sil),p=ISO.toCanvas(e.x,e.y,TER.standZ(e.x,e.y)),px=p.x-o.ox,py=p.y-o.oy;
  g.save();g.setTransform(1,0,0,1,0,0);g.drawImage(b.c,Math.round(px-b.ax),Math.round(py-b.ay));
  if(e.id==='fire'){if(!o.sil){g.globalAlpha=.16;g.fillStyle='#ff9a2a';g.beginPath();g.ellipse(px,py-3*s,(o.on?46:32)*s,(o.on?23:16)*s,0,0,7);g.fill();g.globalAlpha=1}flame(g,px,py-3*s,s,o.t,o.on?24:15,5,e.x)}
  else if(e.id==='altar'){const q=prj(11,3,18.4,1.7);if(!o.sil){g.globalAlpha=.2;g.fillStyle='#ffd070';g.beginPath();g.arc(px+q[0]*s,py+q[1]*s-2*s,9*s,0,7);g.fill();g.globalAlpha=1}flame(g,px+q[0]*s,py+q[1]*s,s,o.t,6,1.6,e.y)}
  const T=o.t,pf=(X,Y,Z)=>{const q=prj2(d.n,X,Y,Z,false);return[px+q[0]*s,py+q[1]*s]};
  if(!o.sil){
   if(e.id==='furnace'){const c=pf(0,0,[28,21,21,28,26,23][ar]+1);puffs(g,c[0],c[1],s,T,e.x*.01,o.on?7:3,{col:o.on?'#b8b4ac':'#d8d4cc',r0:1.8,grow:5,rise:o.on?38:24,al:o.on?.5:.3,per:o.on?3:4.5,dr:10});if(o.on){const m=pf(12,0,12);sparks(g,m[0],m[1],s,T,3,5,'#ffa030')}}
   else if(e.id==='fire'){const c=pf(0,0,16);puffs(g,c[0],c[1],s,T,e.y*.01,o.on?5:3,{col:'#9a9088',r0:1.5,grow:4,rise:o.on?40:28,al:.3,per:3.4,dr:8});sparks(g,c[0],c[1]+4*s,s,T,e.x,o.on?5:2,'#ff8a2a')}
   else if(e.id==='anvil'&&o.on){const c=pf(0,0,17);sparks(g,c[0],c[1],s,T,7,9,'#ffb030');g.globalAlpha=.25+.2*Math.sin(T*30);g.fillStyle='#ffd070';g.beginPath();g.arc(c[0],c[1],4*s,0,7);g.fill();g.globalAlpha=1}
   else if(e.id==='bench'&&o.on){const c=pf(0,0,14);for(let i=0;i<7;i++){const ph=((T*1.6+i/7)%1);g.globalAlpha=1-ph;g.fillStyle=i%2?'#e6c888':'#c8a060';g.fillRect(c[0]+(i-3)*2.4*s+ph*8*s,c[1]-ph*10*s+ph*ph*14*s,1.5*s,1.5*s)}g.globalAlpha=1}
   else if(e.id==='bank'){const c=pf(0,18.4,24),ph=(T*.45)%1;if(ph<.3){const k=Math.sin(ph/.3*Math.PI);g.globalAlpha=k;g.fillStyle='#fff6b0';const x=c[0]+(ph*40-6)*s,y=c[1]-2*s;g.fillRect(x-s,y-3*s,2*s,6*s);g.fillRect(x-3*s,y-s,6*s,2*s);g.globalAlpha=1}}
  }
  g.restore();return d.lh}
 const sprite=(e,s)=>bake(e,s||ISO.scale());
 return{playerFrame,sprite,warmPass,warmHero,warmMob,portrait,get cacheN(){return cache.size},get mcaN(){return MCA.size},get plcN(){return PLC.size},get cacheMB(){return(cache.bytes+MCA.bytes+PLC.bytes+RC.bytes)/1e6},budgetMB:BUD/1e6,build,solid,draw,warm,get trees(){return trees},addSolid:(x,y,hx,hy)=>{const r=[x-hx,x+hx,y-hy,y+hy];sol.push(r);extra.push(r);SG=null},resol,addEnt,delEnt,station,resource,scatter,player,mob,appOpts,ST,get list(){return list}}
})();
if(typeof module!=='undefined')module.exports=PROPS;
