// NotScape · Lote ISLA-1 (21 oct 2026) · ZONA «EL CIELO»: el 10.º rectángulo del mundo (docs/PLAN_ISLA_CIELO.md). Isla del tutorial = base del bioma final.
// Se carga DESPUÉS de world-scale.js y village-barrios.js (todas las coordenadas ya son las FINALES) y ANTES de seams.js/coast.js/world-iso.js.
//   · Es una ZONA (`zone:true`): fuera de la progresión (no entra en PROG ni en uniones), aislada por MAR DE NUBES de la casilla de al lado. Vive en la casilla [3,1] de una rejilla de 4 columnas
//     (la casilla 3 está justo al este del Desierto; entre la costa del continente y la isla quedan ≈ 55 tiles de mar).
//   · Hoy es una isla VACÍA con spawn (ISLA-1): sin aldea, recursos, PNJ ni enemigos (los lotes ISLA-2…5 los añaden). Forma: elipse irregular de 64×48 tiles (rx 32, ry 24) con la costa de `coast.js`.
//   · `?zone=0` la quita y el mundo queda IDÉNTICO al de antes (para comparar). `BIOMES.zone` = {k, cx, cy, rx, ry} (px de mundo; rx, ry en tiles) o ausente.
//   · Coordenadas de la isla en TILES relativos a su centro (x → este, y → sur): spawn = Propileos (−26, 12), centro de aldea = Ágora (2, −6), acrópolis/jefe = (20, −16). Ver el plan §6.2.
(()=>{
 if(typeof BIOMES==='undefined'||!BIOMES.list||BIOMES.list.length!==9)return;
 if(/[?&]zone=0\b/.test(typeof location!=='undefined'?location.search:''))return;
 const list=BIOMES.list,T=32,P=list[0],B8=list[8],W=P.w,H=P.h,cx=W/2,cy=H/2;
 const tp=(tx,ty)=>[Math.round(cx+tx*T),Math.round(cy+ty*T)];
 const pal={g:'#9ed2ee',l:'#cdeeff',s:'#68a4cc',w:'#8fd8f0'};
 const dec=Object.assign({},P.dec,{dots:['#ffffff','#f4e2a0','#bfe6ff'],soil:'#c9d8e6',soilL:'#e6eef6',soilD:'#8fa8c0',clay:'#e8e0d0',rock:'#cfd6dc',rockL:'#f2f4f6',wl:'#f2fbff',wd:'#7ac8e8',wsh:'#ffffff',pa:['#ebe4d2','#f7f2e6','#cfc7b4']});
 const sp=tp(-26,12),ce=tp(2,-6),bo=tp(20,-16);
 // estanques CRISTALINOS (tiles relativos al centro → px locales): fuente de las ninfas (centro-este) y 3 estanques de los que nacen riachuelos hacia las cascadas del borde (S, E, N)
 const SRC=[[7,0,3.2,2.6,11,0],[-3,16.5,2.8,2.0,12,1],[25.5,8,2.6,1.9,13,1],[6,-20.5,2.8,1.8,14,1],[-17,-19,2.3,1.7,15,1],[-27,-3,2.1,1.6,16,1],[19,15,2.5,1.8,17,1]];   // [x, y, rx, ry, semilla, nace una cascada (1) o es solo fuente (0)] en tiles desde el centro: la fuente de las ninfas (centro-este) y 6 estanques/manantiales de los que sale un RÍO hasta el borde (toda cascada tiene su río y su origen)
 const LK=SRC.map(([x,y,rx,ry,sd])=>({c:tp(x,y),r:[rx*T,ry*T],seed:sd,amp:.14,sand:38})),HL=[];
 // RÍOS = AGUA REAL del juego (tiles de agua con sus físicas, ondas y chapoteos): cada manantial con cascada vierte una cadena de pequeños estanques que se solapan (como el río de la Pradera) en línea radial hasta el borde
 // (fuera del contorno los tiles son vacío y ya no cuentan). Y cada manantial está EN ALTURA: sobre una colina de ROCA escalonada de 3 niveles (+.9) con el estanque como laguna de cráter.
 SRC.forEach(([x,y,rx,ry,sd,fall],k)=>{if(!fall)return;const a=Math.atan2(y,x),r0=Math.hypot(x,y)+Math.hypot(rx*Math.cos(a),ry*Math.sin(a))*.8;
  HL.push({c:tp(x,y),r:[(rx+3.4)*T,(ry+3.2)*T],seed:sd+30,amp:.16,lv:3,rock:1});   // el estanque (cráter) queda en la meseta de 3 niveles (+.9) y la roca baja en terrazas alrededor
  for(let r=r0,q=0;r<40;r+=.85,q++){const wob=Math.sin(q*.8+k)*.5;LK.push({c:tp(Math.cos(a)*r-Math.sin(a)*wob,Math.sin(a)*r+Math.cos(a)*wob),r:[1.05*T,1.05*T],seed:sd+q,amp:.1,sand:20})}})


 HL.push({c:tp(-19,5.5),r:[5.9*T,4.2*T],seed:77,amp:.06,lv:1});   // PROPÍLEOS: zócalo elevado de 1 nivel bajo toda la estructura (relieve DENTRO del edificio: se sube al pórtico, no se atraviesa a ras)
 // ISLA-4 (21 oct 2026) · VIDA de la isla: OLIVAR (tala; olivos y cipreses en lugar de pinos, ver nature3d.js `inZone`), CANTERA (cobre y estaño en menas de mármol claro), FUENTE DE LAS NINFAS (pesca de camarones),
 // estaciones del Ágora (horno, yunque, fogata) y el BANCO al pie de la Acrópolis, y el CAMINO DE LAJAS de mármol (cobs → adoquín; suena a mármol) desde la llegada hasta el templo. Zonas y estaciones según docs/PLAN_ISLA_CIELO.md §6.2.
 const RC=(x0,x1,y0,y1)=>{const a=tp(x0,y0),b=tp(x1,y1);return[a[0],b[0],a[1],b[1]]};
 const STN=[['fire','Fogata',...tp(-1.6,-3.7),['co']],['furnace','Horno',...tp(0.4,-5.4),['sm']],['anvil','Yunque',...tp(3.6,-5.4),['sm']],['bank','Banco',...tp(21,-3)]];
 const CAM=[[-26,12.4],[-19,12.4],[-19,-1.6],[2,-6],[9,-6.4],[16,-6.4]],COBZ=[{p:CAM.map(q=>tp(q[0],q[1])),w:60},{p:[tp(16,-6.4),tp(21,-6.4),tp(21,-3.8)],w:44}];   // camino principal (propíleos → ágora → templo) y ramal al banco
 // ISLA-3 (21 oct 2026) · ARQUITECTURA GRIEGA de MÁRMOL (src/r3d/propsdark_cielo3d.js): Propileos en la llegada, camino de columnas, Ágora, Acrópolis (templo + Altar Quebrado con sus 4 braseros) y ruinas del borde.
 // Coordenadas en tiles desde el centro (como tp); `fp`/`fps` = colisión en px SIN escalar (props.js la multiplica ×PROP_K). Todo es decoración + colisión: los oficios, PNJ y recursos llegan en ISLA-4.
 const PRP=[],put=(n,tx,ty,o,fp,fps,ex)=>{const q=tp(tx,ty);PRP.push(Object.assign({n,x:q[0],y:q[1]},o?{o}:{},fp?{fp}:{},fps?{fps}:{},ex||{}))};
 {const KP=2.2,col4=(sx,zs)=>zs.map(z=>[z*T*KP,sx*28.8*KP,4.6*KP,4.6*KP]),
   fill=sx=>{const y=sx*28.8*KP,h=4.6*KP,r=[];[-1,1].forEach(q=>{r.push([q*.775*T*KP,y,.275*T*KP+h,h]);r.push([q*1.275*T*KP,y,.225*T*KP+5.5*KP,h])});return r};   // COLONATA SÓLIDA: relleno continuo entre las columnas exteriores y hasta los muros (cierra los huecos laterales y las esquinas: solo queda libre el paso central N–S)       // propíleos MONUMENTALES (CI_SCALE.propileos = 2,2 → ≈ 11,6 × 8,3 tiles y 7 de alto con ×PROP_K): columnas y muros (ya espejados: model z → x, model x → z) escalados igual
  put('propileos',-19,5.5,null,null,[...col4(-1,[-1.05,-.5,.5,1.05]),...col4(1,[-1.05,-.5,.5,1.05]),...fill(-1),...fill(1),[-48*KP,0,5.5*KP,29*KP],[48*KP,0,5.5*KP,29*KP]]);
  for(const t of [.25,.5,.75]){const px=-19+21*t,py=-1.6-4.4*t;put('columnaG',px+.45,py+2.15,null,[5,5]);put('columnaG',px-.45,py-2.15,null,[5,5])}   // dos filas de columnas flanquean el CAMINO DE LAJAS (de los propíleos al Ágora)
  put('estelaG',-22,14.3,null,[7,4]);put('estelaG',-16.5,13.8,null,[7,4]);put('estelaG',-27.4,8.5,null,[7,4]);
  put('agora',2,-6,null,null,Array.from({length:7},(_,i)=>{const a=Math.PI+i/6*Math.PI;return[Math.cos(a)*2.28*T,Math.sin(a)*2.28*T,4,4]}));
  put('bancoG',-2,-1.2,null,[11,4]);put('bancoG',1.6,-1.0,null,[11,4]);put('anfora',0.5,-3.1,null,[3,3]);put('anfora',3.5,-3.1,null,[3,3]);
  put('temploG',16,-12,null,[56,94]);
  put('estatuaAlada',16,-3.5,null,[20,20]);
  [[12.8,-5.2],[19.2,-5.2],[12.8,-1.8],[19.2,-1.8]].forEach(([x,y])=>put('braseroG',x,y,null,[5,5]));
  put('anfora',13.5,-7,null,[3,3]);put('anfora',18.5,-7,null,[3,3]);
  put('columnaRota',27,-6,{v:0},[8,8]);put('columnaRota',-28,-8,{v:1},[8,8]);put('columnaRota',27.5,2,{v:2},[8,8]);put('estelaG',24,-9.5,{ruins:1},[7,4])}
 // ARBOLEDAS REPARTIDAS (Lote CIELO-ARBOLES, 21 oct 2026): árboles del Cielo por toda la isla, no solo en el olivar. [x0,x1,y0,y1,n] en tiles desde el centro, lejos de edificios, lagos y camino; su «zona» es 1×1 tile (sin aviso de zona de tala).
 const GR=[[-12,-4,10,15,8],[3,12,11,18,8],[-20,-12,-15,-11,7],[19,23,-13,-10,5],[22,26,7,11,5],[5,11,-15,-9,6]];   // rectángulos de arboledas DENTRO de la elipse de la isla (rx 32, ry 24): las esquinas de antes (p. ej. 29,13) caían al agua/acantilado (coast_check)
 const Z={n:'El Cielo',lv:80,ic:'☁️',g:['#9ed2ee','#8fc8e6','#aadcf4'],w:'#8fd8f0',sh:'#e8f8ff',noBoss:1,base:0,zone:true,id:'cielo',pal,dec,
  village:{stations:STN,props:PRP,cobs:COBZ,plaza:[],bridge:null,safe:[ce[0],ce[1],470,470],theme:{}},routes:[],pathW:B8.pathW,lake:false,camp:false,
  res:{wc:[[[0,16]],...GR.map(g=>[[0,g[4]]])],mi:[[[0,6],[1,6]]],fi:[[[0,5]]]},mobs:{ing:[],pack:B8.mobs.pack},music:B8.music,rvc:B8.rvc,bossResp:B8.bossResp,bossRunes:B8.bossRunes,
  w:W,h:H,ox:0,oy:0,spawn:[sp[0],sp[1]],cen:[ce[0],ce[1]],bossPos:[bo[0],bo[1]],exitE:[cy-57,cy+57],entryW:[cy-57,cy+57],
  lay:{water:[],lakes:LK,hills:HL,wc:[{r:[RC(-25,-15,-10,-3.5)],z:RC(-26,-14,-11,-2.5)},...GR.map(g=>({r:[RC(g[0],g[1],g[2],g[3])],z:RC((g[0]+g[1])/2-.5,(g[0]+g[1])/2+.5,(g[2]+g[3])/2-.5,(g[2]+g[3])/2+.5)}))],mi:[{r:[RC(-9,-2,-17,-12.5)],z:RC(-10,-1,-18,-12)}],fi:[{z:RC(3,11,-3.6,3.6),t:'Fuente de las ninfas'}]},spots:{},pois:[],_gdefs:[]};
 // DOS MONTAÑAS PEQUEÑAS de mármol (BIOMES.addRange: núcleo infranqueable de ≈ 4 tiles + falda transitable en 3 terrazas, cumbre de ≈ 3,6 unidades) detrás de los manantiales NO y N: la del NO será la CANTERA
 if(BIOMES.addRange&&!/[?&]range=0\b/.test(typeof location!=='undefined'?location.search:'')){const wx=tx=>3*W+cx+tx*T,wy=ty=>H+cy+ty*T,COLM=['#8a8578','#c2bba8','#f1ece0'];
  [[[-15,-12.5],[-11,-15.5],3.6,41],[[3,-14.8],[9,-14.8],3.2,42]].forEach(([a,b,pk,sd])=>BIOMES.addRange({id:'cielo',p:[[Math.round(wx(a[0])),Math.round(wy(a[1]))],[Math.round(wx(b[0])),Math.round(wy(b[1]))]],w:70,f:140,amp:26,seed:sd,pk,col:COLM}))}
 list.push(Z);BIOMES.N=list.length;BIOMES.GRIDPOS[9]=[3,1];BIOMES.COLS=4;
 BIOMES.finish();                                   // recalcula rectángulos (ox,oy), mundo (WW = 4 columnas), sin uniones con el continente
 BIOMES.zone={k:9,cx:Z.ox+cx,cy:Z.oy+cy,rx:32,ry:24,x0:Z.ox,src:SRC.map(([x,y,rx,ry,sd,fall],i)=>({i,tx:x,ty:y,rx,ry,fall}))};   // x0 = borde oeste de la columna del Cielo (todo lo que está al este es «aire»: sin agua, el 3D pone nubes)
})();
