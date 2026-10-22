// NotScape · F3-A · props de aldea (casas, farolas, vallas, barriles…). Primer uso de las formas de style-organic.js (ORG.U) dentro del juego.
// (Los datos de los props viven en biomes.js → BIOMES.list[k].village.props.) Cada prop es {n: nombre en ORG.U, x, y (mundo), o: opciones del modelo (colores, tamaños), fp: [medio ancho, medio fondo] de colisión en px de mundo}.
// El sprite se hornea UNA vez por (modelo, opciones, escala) en un lienzo y luego solo se estampa (sin coste por frame). Datos locales al bioma (x desde k*BW).
// Para otra aldea: otra lista LAY (F3-C). Colisión: PROPS.solid(x,y) se suma a blk() en game.js; los props NO tocan BLK (BLK pinta agua en world-iso.js).
const PROPS=(()=>{
 let list=[],sol=[],extra=[],trees=[],SG=null;   // SG: rejilla de 128 px con los rectángulos sólidos (solid() no recorre toda la lista)
 // lote D5 (editor de aldeas): build() se reparte en mk() (entidad de mundo desde la pieza LOCAL p; guarda p en e._src), solOf() (colisión de una pieza) y resol() (recalcula toda la colisión
 // desde las piezas fuente: es lo que usa el editor tras mover/rotar/escalar/borrar). Una pieza puede llevar p.sc (escala del editor, 0,5-2; escala sprite y huella) y p._del (borrada por el editor).
 function solOf(p,B,tree){const x=B.ox+p.x,y=B.oy+p.y,sc=(p.sc||1)*(tree?1:PROP_K);
  if(p.fp){const f=!tree&&p.o&&p.o.rot?[p.fp[1],p.fp[0]]:p.fp;sol.push([x-f[0]*sc,x+f[0]*sc,y-f[1]*sc,y+f[1]*sc])}
  if(!tree&&p.fps)p.fps.forEach(r=>{const q=PROP_K;sol.push([x+r[0]*q-r[2]*q,x+r[0]*q+r[2]*q,y+r[1]*q-r[3]*q,y+r[1]*q+r[3]*q])})}
 // R3D-ESCALA-2 (19 oct 2026): PROP_K = escala de TODOS los props en el modo 3D (edificios, puestos, vallas…); 1 en 2D. `?pk=1.8` para probar. La huella de colisión `fp` crece igual.
 const PROP_K=window.R3D_ON?(()=>{const m=/[?&]pk=([\d.]+)/.exec(location.search);return m?Math.max(.5,Math.min(3,+m[1]||1.5)):1.5})():1;window.PROP_K=PROP_K;
 const HOUSEK=/^(casa|troncos|cabana|palafito|casaJp|casaMaya|casaLarga|salon|stabbur|taberna|casaArbol)$/;   // edificios escalados por ORG.HK (V5)
 function mk(p,k){const B=BIOMES.list[k],e=Object.assign({},p,{x:B.ox+p.x,y:B.oy+p.y,k,_oa:1,_src:p,sc:p.sc||1});if(p.fp){const f=p.o&&p.o.rot?[p.fp[1],p.fp[0]]:p.fp,hk=window.R3D_ON?PROP_K:(HOUSEK.test(p.n)?ORG.HK:1);e.fp=[f[0]*e.sc*hk,f[1]*e.sc*hk]}return e}
 function build(){list=[];sol=[];SG=null;trees=[];extra=[];for(let k=0;k<BIOMES.N;k++){const B=BIOMES.list[k];for(const p of B.village.props){if(p._del)continue;
  const ti=TREES.indexOf(p.n);if(ti>=0){trees.push({i:ti,x:B.ox+p.x,y:B.oy+p.y});solOf(p,B,1);continue}   // árbol → recurso talable (lo crea game.js desde PROPS.trees)
  list.push(mk(p,k));solOf(p,B,0)}}}
 function resol(){sol=[];SG=null;for(let k=0;k<BIOMES.N;k++){const B=BIOMES.list[k];for(const p of B.village.props)if(!p._del)solOf(p,B,TREES.indexOf(p.n)>=0)}extra.forEach(r=>sol.push(r))}
 const addEnt=(p,k)=>{const e=mk(p,k);list.push(e);resol();return e},delEnt=e=>{const i=list.indexOf(e);if(i>=0)list.splice(i,1);resol()};
 const GC=128,gk=(i,j)=>i*100003+j;
 function sgrid(){SG=new Map();for(const r of sol){for(let i=Math.floor(r[0]/GC);i<=Math.floor(r[1]/GC);i++)for(let j=Math.floor(r[2]/GC);j<=Math.floor(r[3]/GC);j++){const k=gk(i,j);let a=SG.get(k);if(!a)SG.set(k,a=[]);a.push(r)}}}
 const solid=(x,y)=>{if(!SG)sgrid();const a=SG.get(gk(Math.floor(x/GC),Math.floor(y/GC)));if(a)for(const r of a)if(x>r[0]&&x<r[1]&&y>r[2]&&y<r[3])return true;return false};
 // instalaciones (banco, tienda, fogata, horno, yunque, taller, escritorio). lh = altura de la etiqueta en px de modelo. El sprite se hornea una vez por variante
 // (banco de noche, horno encendido) y se pinta con el desplazamiento (ox,oy) del lienzo pequeño de hl()/occ(); llamas y luz de vela son overlays en vivo.
 const ST={bank:{n:'banco',lh:68},shop:{n:'tienda',lh:50},market:{n:'subastas',lh:62},ru:{n:null,lh:66},board:{n:'tablon',lh:44},fire:{n:'fogata',lh:34},furnace:{n:'horno',lh:58},anvil:{n:'yunque',lh:48},armero:{n:'armero',lh:56},curtidor:{n:'curtidor',lh:46},bench:{n:'taller',lh:50},altar:{n:'escritorio',lh:54},shrine:{n:'altarRezo',lh:50}};
 const TREES=['pino','abedul','roble','fresno','sauce','arce','tejo','ebano','caoba','baobab','mundo'],MBA=['#8a5a3a','#9a9aa8','#6a4a3a','#3a3a40','#8a9aa8','#3a4a6a','#2a4a3a','#2a4a52','#5a3a2a','#3a3a5a'],MOR=['#c8742a','#e8e8f8','#c0603a','#6a6a72','#f0f0f8','#4a7aff','#3adf6a','#3ad0d8','#e89a3a','#c8a0ff'];

 // decoración dispersa por bioma (F3-D): arbustos, rocas, setas, juncos… sin colisión; semilla fija → mismo mundo en cada carga.
 // Evita agua/acantilados (TER.heightAt≠1), caminos, la aldea, estaciones, zonas de recurso, recursos y guaridas.
 const SC=[[['arbusto',5],['roca',2],['heno',1]],[['arbusto',4],['seta',3],['tocon',3],['roca',1]],[['junco',5],['seta',2],['tocon',2],['arbusto',2]],[['roca',5],['runestone',1],['tocon',1]],[['bambu',4],['arbusto',3],['linterna',1],['roca',2],['cerezo',1]],[['obsidiana',4],['roca',4],['estela',1],['vasija',1]]];
 SC.push(SC[3],SC[5],[['roca',4],['junco',3],['arbusto',2],['tocon',1]]);   // F49a: Páramo, Desierto y Costa (esqueleto)
 function scatter(c){const NB=BIOMES.list.filter(b=>!b.zone).length,out=[];   // ISLA-1: la ZONA del Cielo (siempre la última) no tiene tabla de decoración dispersa: se queda fuera
  // Fase 44-0: rejilla espacial para «hay un recurso/adorno a menos de d px» (con el mundo ×2 hay ~8 000 recursos y la búsqueda lineal tardaba ~3,5 s en cargar). Mismas distancias y mismo resultado.
  const GS=64,gkey=(x,y)=>Math.floor(x/GS)*100003+Math.floor(y/GS),gput=(g,e,x,y)=>{const k=gkey(x,y);let a=g.get(k);if(!a)g.set(k,a=[]);a.push(e)},
   gnear=(g,x,y,d,fx,fy)=>{const i=Math.floor(x/GS),j=Math.floor(y/GS),r=Math.ceil(d/GS);for(let a=i-r;a<=i+r;a++)for(let b=j-r;b<=j+r;b++){const q=g.get(a*100003+b);if(q)for(const e of q)if(Math.hypot(fx(e)-x,fy(e)-y)<d)return true}return false},
   NG=new Map();c.N.forEach(e=>gput(NG,e,e.x,e.y));const nx=e=>e.x,ny=e=>e.y;
  for(let k=0;k<NB;k++){const B=BIOMES.list[k],x0=B.ox,y0=B.oy,BW=B.w,BH=B.h;let sd=(k*7919+17)>>>0;const rnd=()=>{sd=(sd+0x6D2B79F5)|0;let t=Math.imul(sd^sd>>>15,1|sd);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
   const segs=[];for(const r of B.routes)for(let i=0;i<r.length-1;i++)segs.push([x0+r[i][0],y0+r[i][1],x0+r[i+1][0],y0+r[i+1][1],B.pathW||40]);
   for(const q of (B.village.cobs||[]))for(let i=0;i<q.p.length-1;i++)segs.push([x0+q.p[i][0],y0+q.p[i][1],x0+q.p[i+1][0],y0+q.p[i+1][1],q.w||30]);
   const dseg=(x,y,a)=>{const dx=a[2]-a[0],dy=a[3]-a[1],l=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/l));return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t)-a[4]};
   const tot=SC[k].reduce((a,b)=>a+b[1],0),mine=[],MG=new Map();let n=0,tries=0;
   const quota=Math.round((k===0?70:80)*BW*BH/(2300*1500));while(n<quota&&tries++<quota*22){const x=x0+60+rnd()*(BW-120),y=y0+70+rnd()*(BH-140),dl=x-x0,dr=x0+BW-x,nk=dl<dr?k-1:k+1,dn=Math.min(dl,dr),T2=nk>=0&&nk<NB&&dn<300&&rnd()<(1-dn/300)*.6?SC[nk]:SC[k],tt=T2.reduce((a,b)=>a+b[1],0);let r=rnd()*tt,m=T2[0][0];for(const q of T2){if((r-=q[1])<0){m=q[0];break}}
    if(![[0,0],[12,0],[-12,0],[0,10],[0,-10]].every(q=>TER.isLand(TER.heightAt(x+q[0],y+q[1]))))continue;if(TER.sandAt(Math.floor(x/32),Math.floor(y/32))>.2&&m!=='roca'&&m!=='junco')continue;
    if(segs.some(a=>dseg(x,y,a)<34))continue;
    if(c.ST.some(e=>Math.hypot(e.x-x,e.y-y)<70))continue;   // (antes también `list.some(e=>e.k===k&&!e.sc&&…)`: nunca era cierto porque todo prop lleva sc≥1; se quitó por coste, el resultado es el mismo)
    if(c.ZS.some(z=>x>z.r[0]-30&&x<z.r[1]+30&&y>z.r[2]-30&&y<z.r[3]+30))continue;
    if(gnear(NG,x,y,40,nx,ny)||c.M.some(e=>Math.hypot(e.hx-x,e.hy-y)<36)||gnear(MG,x,y,30,nx,ny))continue;
    const it={n:m,x,y,k,sc:1,_oa:1};mine.push(it);gput(MG,it,x,y);n++}
   mine.forEach(e=>list.push(e))}}

 // apariencia del jugador (editor de personaje, S.app) → opciones de ORG.U.heroe. Un solo punto: el juego y la vista previa del editor usan lo mismo.
 function appOpts(a){a=a||{};const o={};if(a.skin)o.skin=a.skin;if(a.hc)o.hair=a.hc;if(a.hair)o.hairStyle=a.hair;if(a.eye)o.eye=a.eye;if(a.face)o.face=a.face;if(a.pants)o.pants=a.pants;if(a.g)o.gender=a.g;if(a.col)o.col=a.col;return o}
 // caja de un prop para el editor de aldeas (village-edit.js; antes el sprite 2D horneado). Si el 3D ya conoce la huella REAL de la malla (R3D.props.fp: x,y,sx,sz en tiles, h en unidades) se usa; si no, sale de la colision `fp`.
 // Devuelve px de PANTALLA (a escala s) con el ancla `ax,ay` en los pies: un tile = rombo de 56×28 px logicos y una unidad de altura 3D ≈ 34 px.
 let FPM=null,FPN=-1;
 const sprite=(e,s)=>{s=s||ISO.scale();let f=null;try{const L=window.R3D&&R3D.props&&R3D.props.fp;if(L){if(FPN!==L.length){FPN=L.length;FPM=new Map();for(const q of L)FPM.set(Math.round(q.x)+'|'+Math.round(q.y),q)}f=FPM.get(Math.round(e.x)+'|'+Math.round(e.y))||null}}catch(x){}
  const sx=f?f.sx/1.35:Math.max(.3,(e.fp?e.fp[0]:24)/32),sz=f?f.sz/1.35:Math.max(.3,(e.fp?e.fp[1]:24)/32),h=f?f.h:1.6,fw=(sx+sz)*56,fh=(sx+sz)*28,W=Math.max(30,fw),Ht=fh+h*34;
  return{c:{width:Math.ceil(W*s),height:Math.ceil(Ht*s)},ax:W*s/2,ay:(Ht-fh/2)*s,bb:null}}
 /* SISTEMA DE ELEVACIÓN (21 oct 2026; el dueño: «traspaso el suelo con el personaje, necesito que se quede encima»): los props con zócalo/gradas/suelo propio declaran aquí sus PLATAFORMAS caminables y `TER.standZ` suma su altura
    (el héroe, los PNJ, el sonido, la cámara y las etiquetas usan standZ, así que todos se quedan encima). Por modelo: `sc` = escala del modelo (CI_SCALE) y `r` = lista de capas [{hx,hy,h}] (rectángulo de medio ancho hx/medio fondo hy,
    o {r} = disco) en UNIDADES DE MODELO con ejes de MUNDO (ya espejados x↔z), `h` = altura de la superficie sobre la base. Cada capa se rampa en su borde (`m` = margen, unidades de modelo) para que se suba sin saltos.
    PARA UN PROP NUEVO CON SUELO ELEVADO: añade su fila aquí (medidas = las del módulo propsdark*; comprobar en el juego que los pies quedan sobre el suelo). Altura en niveles = h·sc·PROP_K / 0,6415. */
 const ELEV={propileos:{sc:2.2,m:.22,r:[{hx:1.75,hy:1.25,h:.12}]},
  temploG:{sc:1,m:.2,r:[{hx:1.825,hy:3.1,h:.07},{hx:1.705,hy:2.98,h:.14},{hx:1.585,hy:2.86,h:.21}]},
  agora:{sc:1,m:.25,r:[{r:2.6,h:.04},{r:2.48,h:.075},{r:2.3,h:.1}]}};
 let ELV=[],ELn=-1;const LVY=.6415,EPS=.07;   // EPS (niveles ≈ 4 cm) = los pies quedan un pelo POR ENCIMA de la losa: con la suela exactamente a ras el pase de profundidad del héroe (rayos X) la daba por tapada y dibujaba la silueta en las piernas
 function elevBuild(){ELn=list.length;ELV=[];for(const e of list){const d=ELEV[e.n];if(!d)continue;const q=32*d.sc*PROP_K,hz=d.sc*PROP_K/LVY;let R=0;for(const c of d.r)R=Math.max(R,(c.r||Math.max(c.hx,c.hy))+d.m);ELV.push({x:e.x,y:e.y,R:R*q,m:d.m*q,L:d.r.map(c=>({hx:(c.hx||c.r)*q,hy:(c.hy||c.r)*q,disc:!!c.r,h:c.h*hz}))})}}
 // altura extra (en niveles) bajo el punto (x,y): máximo de las capas que lo contienen, con rampa de margen `m` hacia fuera
 function elevAt(x,y){if(ELn!==list.length)elevBuild();if(!ELV.length)return 0;let best=0;for(const e of ELV){const dx=Math.abs(x-e.x),dy=Math.abs(y-e.y);if(dx>e.R||dy>e.R)continue;
   for(const c of e.L){let d;if(c.disc)d=Math.hypot(dx,dy)-c.hx;else d=Math.max(dx-c.hx,dy-c.hy);if(d>=e.m)continue;const f=d<=0?1:1-d/e.m,z=c.h*(f*f*(3-2*f))+EPS*f;if(z>best)best=z}}return best}
 return{sprite,build,solid,get trees(){return trees},addSolid:(x,y,hx,hy)=>{const r=[x-hx,x+hx,y-hy,y+hy];sol.push(r);extra.push(r);SG=null},resol,addEnt,delEnt,scatter,appOpts,ST,elevAt,ELEV,get list(){return list}}
})();
if(typeof module!=='undefined')module.exports=PROPS;
