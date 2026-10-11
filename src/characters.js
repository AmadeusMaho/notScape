/* NotScape — PERSONAJES (Fase 3, paso 3). Ver AGENTS.md → "Cómo funcionan los personajes".
   Sustituye el cuerpo de `pBody` (game.js) —jugador y Ru, que comparten esa función— por un diseño con contorno oscuro #14100a, luz arriba-izquierda,
   3–4 tonos por material, cara con ojos/boca y parpadeo, bota, cinturón con hebilla, correa y bolsa. Con ?old, CH es null (GR null) y `pBody` usa el código antiguo.
   CONTRATO: `CH.person(x,y,sh,ha,f,w,mv,ar,b,lg)` tiene la MISMA firma que `pBody` y es PURA: solo depende de sus argumentos (nada de t, performance.now ni Math.random:
   se hornea una vez con `bk()` y la clave de caché de `dPerson` ya lleva camisa, pelo, dirección, armadura y fotograma). `b` (rebote del cuerpo) y `lg`
   (paso) los calcula `dPerson` a partir del fotograma cuantizado; aquí se redondean a enteros para que no haya medios píxeles.
   Geometría (x,y = suelo, centro): cuerpo en x−8..+7 (con hombreras), alto ≈ 26 (≈ 29 con casco); el lienzo de caché es 28×40 con ancla (14,34).
   Las manos quedan en y−10 aprox.: `dP` pinta el arma/herramienta (en vivo) con pivote en (x+f·5, y−12−b), no se movió.
   Armadura: `ar` es el color del tier (TCOL). Metálica = placas, hombreras y casco; cuero (TCOL.cuero) = chaleco con cordones y sin casco; null = túnica `sh`. */
const CH=GR?(()=>{
 const{mix}=GR.H,OL='#14100a',L=(c,t)=>mix(c,'#ffffff',t==null?.2:t),D=(c,t)=>mix(c,'#000000',t==null?.25:t);
 const SK='#f1c27d',PANT='#2f3f66',BOOT='#4a2f1a',BELT='#5a3a1a',GOLD='#e0b030',LINEN='#c8b890';
 function person(x,y,sh,ha,f,w,mv,ar,b,lg){
  x=Math.round(x);y=Math.round(y);
  const bb=Math.max(0,Math.round(b||0)),sw=mv?Math.round(lg):0,lL=mv?Math.max(0,Math.round(lg)):0,lR=mv?Math.max(0,Math.round(-lg)):0,
   blink=!mv&&bb===1,metal=!!ar&&ar!==TCOL.cuero,leather=!!ar&&!metal,fr=f>0?1:-1,T=ar||sh,
   by=y-17-bb; // y de la fila superior del torso
  Sd(x-7,y-1,14,3);
  // ---- 1) silueta: un contorno de 1 px alrededor de la unión de todas las piezas
  const S=[[x-4,y-8,3,8-lL],[x+1,y-8,3,8-lR],
   [fr>0?x-1:x-5,y-lL-1,1,1],[fr>0?x+4:x,y-lR-1,1,1], // puntera de cada bota
   [x-5,by,10,9+bb],[x-7,by+1+sw,2,8],[x+5,by+1-sw,2,8], // torso (se estira con el rebote) y brazos
   [x-4,y-25-bb,8,7],[x-2,y-18-bb,4,1],[fr>0?x-5:x+4,y-22-bb,1,2]]; // cabeza, cuello, oreja
  if(metal)S.push([x-8,y-18-bb,4,4],[x+4,y-18-bb,4,4],[x-5,y-27-bb,10,5]);else S.push([x+(fr>0?-2:0),y-26-bb,3,1]); // hombreras y casco / mechón
  for(const r of S)Rc(OL,r[0]-1,r[1]-1,r[2]+2,r[3]+2);
  // ---- 2) piernas y botas
  for(const[lx,lift,toe]of[[x-4,lL,fr>0?x-1:x-5],[x+1,lR,fr>0?x+4:x]]){
   const h=8-lift;Rc(PANT,lx,y-8,3,h-2);Rc(L(PANT,.18),lx,y-8,1,h-2);Rc(D(PANT,.25),lx+2,y-8,1,h-2);
   Rc(BOOT,lx,y-lift-2,3,2);Rc(L(BOOT,.3),lx,y-lift-2,3,1);Rc(D(BOOT,.2),lx,y-lift-1,3,1);Rc(BOOT,toe,y-lift-1,1,1)}
  // ---- 3) torso
  Rc(T,x-5,by,10,9+bb);Rc(L(T,.22),x-5,by,1,9+bb);Rc(D(T,.28),x+4,by,1,9+bb);Rc(D(T,.22),x-5,y-9,10,1);Rc(L(T,.3),x-3,by,6,1);
  if(metal){ // placas: brillo arriba-izquierda, sombra a la derecha, juntura central y remaches
   Rc(L(ar,.28),x-4,by+1,3,4);Rc(D(ar,.3),x+2,by+1,2,6);Rc(D(ar,.4),x,by+2,1,5);Rc(L(ar,.65),x-3,by+3,1,1);Rc(L(ar,.65),x+2,by+3,1,1);Rc(D(ar,.18),x-4,y-12,8,1)}
  else if(leather){ // chaleco: tirantes, cordones y costuras
   Rc(D(ar,.2),x-4,by,2,4);Rc(D(ar,.2),x+2,by,2,4);for(let i=0;i<4;i++)Rc(D(ar,.5),x,by+1+i*2,1,1);Rc(D(ar,.15),x-4,y-12,8,1)}
  else{ // túnica con correa cruzada y bolsa
   for(let i=0;i<7;i++){const sx=fr>0?x-4+i:x+3-i;Rc('#6a4424',sx,by+1+i,1,1);if(i<6)Rc(D('#6a4424',.3),sx+(fr>0?1:-1),by+1+i,1,1)}
   const px=fr>0?x+2:x-4;Rc('#7a5230',px,y-13,3,3);Rc(L('#7a5230',.3),px,y-13,3,1);Rc(D('#7a5230',.35),px,y-11,3,1);Rc(GOLD,px+1,y-12,1,1)}
  Rc(BELT,x-5,y-10,10,1);Rc(GOLD,fr>0?x:x-2,y-10,2,1); // cinturón y hebilla
  // ---- 4) brazos: manga + puño + mano
  const slv=metal?D(ar,.45):leather?LINEN:T;
  for(const[ax,ay,left]of[[x-7,by+1+sw,1],[x+5,by+1-sw,0]]){
   Rc(slv,ax,ay,2,6);Rc(left?L(slv,.2):slv,ax+(left?0:1),ay,1,6);Rc(D(slv,.3),ax+(left?1:0),ay,1,6);
   Rc(metal?L(ar,.25):D(slv,.22),ax,ay+5,2,1);Rc(SK,ax,ay+6,2,2);Rc(D(SK,.15),ax,ay+7,2,1);Rc(L(SK,.15),ax+(left?0:1),ay+6,1,1)}
  // ---- 5) cabeza
  const hy=y-25-bb;
  Rc(D(SK,.22),x-2,y-18-bb,4,1); // cuello
  Rc(SK,x-4,hy,8,7);Rc(L(SK,.14),x-4,hy+3,1,3);Rc(D(SK,.1),x+3,hy+3,1,3);Rc(D(SK,.16),x-4,hy+6,8,1);
  Rc(D(SK,.1),fr>0?x-5:x+4,y-22-bb,1,2); // oreja
  const ex1=fr>0?x:x-3,ex2=fr>0?x+2:x-1;
  if(blink){Rc('#1a1410',ex1,hy+4,1,1);Rc('#1a1410',ex2,hy+4,1,1)}else{Rc('#1a1410',ex1,hy+3,1,2);Rc('#1a1410',ex2,hy+3,1,2);Rc('#ffffff',ex1,hy+3,1,1)}
  Rc('#9a5040',fr>0?x+1:x-2,hy+5,1,1);
  if(metal){ // casco: cúpula, ala, brillo, cubrenuca y protector de nariz
   Rc(ar,x-5,y-27-bb,10,5);Rc(L(ar,.4),x-4,y-27-bb,4,1);Rc(L(ar,.2),x-5,y-26-bb,1,3);Rc(D(ar,.28),x+4,y-26-bb,1,4);Rc(D(ar,.32),x-5,y-24-bb,10,1);
   Rc(D(ar,.15),fr>0?x-5:x+4,y-22-bb,1,3);Rc(D(ar,.25),fr>0?x+1:x-2,y-22-bb,1,3)}
  else{ // pelo: capa superior con brillo, nuca, flequillo y mechón
   Rc(ha,x-4,hy,8,3);Rc(L(ha,.3),x-3,hy,3,1);Rc(D(ha,.22),x-4,hy+2,8,1);Rc(D(ha,.12),fr>0?x-4:x+2,hy+3,2,3);Rc(ha,fr>0?x+2:x-4,hy+3,2,1);
   Rc(ha,x+(fr>0?-2:0),y-26-bb,3,1);Rc(L(ha,.3),x+(fr>0?-2:0),y-26-bb,1,1)}
  if(metal){Rc(ar,x-8,y-18-bb,4,4);Rc(L(ar,.38),x-8,y-18-bb,4,1);Rc(L(ar,.2),x-8,y-17-bb,1,2);Rc(D(ar,.3),x-8,y-15-bb,4,1);Rc(ar,x+4,y-18-bb,4,4);Rc(L(ar,.25),x+4,y-18-bb,4,1);Rc(D(ar,.12),x+7,y-17-bb,1,2);Rc(D(ar,.35),x+4,y-15-bb,4,1)} // hombreras
 }
 return{person};
})():null;
