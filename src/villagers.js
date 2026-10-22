// NotScape · ALDEANOS DE LAS 9 ALDEAS (Fase 25 · B2, 20 oct 2026; pedido del dueño: «PNJ nuevos y distintos para los 9 biomas, ~8 por aldea repartidos en distintas actividades, el doble (mínimo) en la
// CAPITAL = Oriental, dar vida al mundo»). Script clásico, globales `NPCLK` (look de cada PNJ, lo lee src/r3d/actors3d.js) y `VILL`. Se carga ANTES de game.js (usa sus globales solo al llamar).
// QUÉ HACE: para cada bioma `k` genera de forma DETERMINISTA (hash, nunca Math.random) su ELENCO: un PNJ por oficio con nombre, género, ropa, peinado, sombrero y herramienta de SU cultura, su sitio de
// trabajo en la aldea (junto a la herrería, el huerto, el agua, la pila de troncos…), su animación de oficio (`e.job`: martillear, talar, azadón, pescar, amasar, barrer, laúd, leer…) y, si toca, su
// rutina de movimiento (guardia que patrulla, niño que correteaa). Diálogo: frase del oficio + frase de la cultura + manía personal (tono de aldeano; ver docs/LORE.md).
// REGLAS DEL DUEÑO: (1) cada bioma tiene PNJ NUEVOS (no se reutilizan), la Pradera conserva sus tres aprobados (Ivo, Brenna, Orsen; `npcs.js VNPC`); (2) la CAPITAL (Oriental, k=4) lleva ≥ el doble (20);
// (3) UN VENDEDOR POR OFICIO: `vend` = clave de `TRADE.VEND` (shop.js); lo que venden se decidirá después (catálogos vacíos salvo los ya hechos); los duplicados del mismo oficio NO venden.
// AÑADIR: un oficio = una fila en ROLES (+ su herramienta/animación en actors3d.js si es nueva) y, si se quiere en una aldea concreta, un id en CAST/CAPITAL; una cultura = una fila en CU.
const NPCLK={};
const VILL=(()=>{
 const hs=(a,b,c)=>{let h=(Math.imul(a|0,374761393)+Math.imul(b|0,668265263)+Math.imul(c|0,2147483647))|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};
 const pick=(a,r)=>a[Math.floor(r*a.length)%a.length];
 // ── CULTURAS (una por bioma; índices = BIOMES.list). Datos de color, nombres y una frase de ambiente. ──
 const CU=[
  {n:'Pradera',robes:['#8a6a4a','#6a7a4a','#7a5a5a','#5a6a8a','#a08a5a','#7a6a5a'],trims:['#d8ccb0','#4a3426','#b8a070'],hair:['#5a3a28','#3a2a1a','#8a6a3a','#2a1a12','#c8b8a0','#a05a2a'],skins:['#e6bc98','#d8a878','#e0b690','#f0d0b8','#c08a60'],hm:['cut','side','curly','spiky'],hf:['bun','pony','bob','long'],beard:.25,
   m:['Aldo','Berto','Cael','Dunstan','Edric','Fenn','Garrick','Hob','Jory','Kellan','Lowen','Merrick','Osric','Perrin'],f:['Alys','Corwen','Dessa','Elda','Fiona','Gwen','Hana','Isolde','Joss','Maren','Nell','Petra','Rosa','Tilda'],
   say:['Aquí se vive tranquilo mientras no mires demasiado lejos del camino.','La Pradera es de las pocas tierras donde todavía se puede arar sin miedo. Cuídala.','Dicen que nuestros abuelos llegaron huyendo de algo. Nadie recuerda de qué.']},
  {n:'Bosque',robes:['#4f7a4a','#3f6a46','#6a8a4a','#5a7a5a','#7a6a3a','#456a5a'],trims:['#c8d890','#e8e0b0','#8a6a3a'],hair:['#c8b890','#8a6a3a','#d8d0b0','#5a4a2a','#2a2a1a','#b88a4a'],skins:['#e8d0b0','#e0c8a8','#d0b890','#f0dcc0'],hm:['long','side','cut'],hf:['long','pony','bun','twin'],beard:.04,hat:'band',
   m:['Sylvar','Ithiel','Faenor','Caladren','Orrelin','Ilmar','Aerendil','Vaelor','Thandor','Eldrin','Naeron','Lorien','Sevrin','Aldaris'],f:['Maelis','Lirael','Eryndis','Naerith','Aelwen','Vaelis','Thessaly','Yselle','Neriel','Sylwen','Ilyana','Caelith','Faelyn','Miravel'],
   say:['Los árboles escuchan más de lo que los forasteros creen. No les cuentes secretos.','Nuestra gente vigila el bosque desde antes de que hubiera caminos. Los caminos llegaron después, y con ellos los problemas.','La luz entre las copas cambia con la luna. A la llena, es mejor quedarse bajo techo.']},
  {n:'Pantano',robes:['#6a6a3a','#5a5a3a','#7a5a3a','#4a5a4a','#6a4a3a','#58604a'],trims:['#c8a050','#8a4a2a','#d8d0a0'],hair:['#1a1410','#2a1a12','#3a2a1a','#5a4a2a','#8a7a5a'],skins:['#9a7a5a','#8a6a4a','#a88a60','#b09068'],hm:['spiky','cut','curly'],hf:['twin','bob','pony','long'],beard:.15,hat:'feather',
   m:['Bokk','Mazu','Zaru','Gorm','Mbela','Kofi','Obo','Dembe','Sefu','Tzuki','Nokta','Ugra','Zolo','Kwame'],f:['Zuri','Ataa','Nyla','Safi','Imani','Kesi','Layo','Mosi','Ndira','Rafi','Tumi','Yara','Zinzi','Bahati'],
   say:['El agua sube y baja y nosotros con ella. Quien construye en el suelo duro, acaba hundido igual.','Las brujas del sur no son leyenda. Tampoco son lo peor que vive en la niebla.','Aquí cada casa se apoya en la de al lado. Así se aguanta lo que viene.']},
  {n:'Cumbres',robes:['#5a6a8a','#7a7a8a','#8a5a4a','#6a5a4a','#4a5a6a','#7a6a5a'],trims:['#c8d8f0','#e8e0cc','#8a8a9a'],hair:['#d8c8a0','#c8a050','#8a5a2a','#e0d8c0','#6a4a2a','#a0a0a8'],skins:['#f0d0b8','#e8c8a8','#e0b890','#f4dcc8'],hm:['mane','long','cut','side'],hf:['twin','long','bob','pony'],beard:.55,hat:'fur',
   m:['Ragnvald','Thorgil','Bjarn','Hrolf','Ulfar','Gunnar','Eirik','Torvald','Sigmund','Leif','Orm','Haldor','Knut','Varg'],f:['Sigrun','Astrid','Ingrid','Freydis','Helga','Solveig','Ylva','Gudrun','Thora','Runa','Sunniva','Brynja','Aud','Eir'],
   say:['El frío no mata a quien se prepara. Mata al que se cree más listo que la montaña.','Contamos las nieves por inviernos. He visto sesenta y cuatro. El sesenta y cinco no me asusta.','Ahí arriba están los gigantes. Aquí abajo, nosotros, haciendo ruido para que se acuerden de que seguimos vivos.']},
  {n:'Oriental',robes:['#b8302a','#2a3a5a','#4a6a5a','#8a2a4a','#3a3a4a','#6a4a3a'],trims:['#e8d8a0','#f0e8d0','#c8a050'],hair:['#1a1414','#2a1a14','#0e0c0c','#3a2a24'],skins:['#e8c8a0','#e0c090','#f0d4b0','#d8b888'],hm:['bun','cut','side'],hf:['bun','bun','bob','long'],beard:.08,hat:'straw',
   m:['Haruto','Kenji','Ryo','Takeshi','Daichi','Kaito','Shinji','Genji','Hiroshi','Isamu','Masato','Noboru','Satoru','Tadashi'],f:['Sakura','Aiko','Mei','Yuna','Rin','Akari','Hanae','Kasumi','Miyu','Noriko','Reika','Sayuri','Tomoe','Yoshino'],
   say:['La capital no duerme, pero tampoco habla de lo que ve. Aprende esa cortesía.','Una promesa pesa más que una espada. La espada se puede soltar.','Aquí se camina despacio. Quien corre es porque huye o porque le deben algo.']},
  {n:'Volcán',robes:['#3a2a2a','#5a2a1a','#4a3a3a','#6a3a1a','#2a2020','#5a3a2a'],trims:['#ffb030','#e8541c','#8a5a3a'],hair:['#1a1010','#3a1a10','#2a1814','#5a2a18'],skins:['#8a5a4a','#6a4a42','#a06a50','#7a4a3a'],hm:['spiky','cut','mane'],hf:['pony','bob','spiky','twin'],beard:.3,hat:'horn',
   m:['Kharn','Morrak','Vesh','Zorak','Brannok','Tharn','Gruk','Dagan','Obran','Rask','Sulfar','Torrek','Vulk','Ashur'],f:['Ashka','Cinda','Sulis','Pyra','Ruska','Obsa','Kessa','Embra','Narra','Zhara','Brasa','Ignea','Lavra','Torva'],
   say:['El suelo respira aquí. A veces con rabia. Aprendes a caminar con los oídos.','Los dioses del fuego no pidieron que los adoráramos. Nosotros decidimos que nos convenía.','Todo lo que ves lo hicimos con ceniza y paciencia. Lo demás se lo llevó la lava.']},
  {n:'Páramo Arcano',robes:['#4a3a7a','#5a4a8a','#3a3a6a','#6a4a8a','#2a2a50','#58407a'],trims:['#c8b0ff','#e8c040','#a898d8'],hair:['#e8e0f0','#8a6ac0','#2a2040','#c0b0e0','#4a3a6a'],skins:['#d8c0d8','#c8b0c8','#e0d0e0','#bfa8c8'],hm:['long','mane','side','cut'],hf:['long','bob','twin','pony'],beard:.2,hat:'wizard',
   m:['Orin','Alaric','Thessar','Quillon','Corvin','Pellam','Nox','Eldrow','Veyl','Marek','Sorin','Ilvar','Tamsel','Brodin'],f:['Zephyra','Veyra','Isenna','Morwyn','Elarin','Sibyl','Lysandra','Mirel','Ondine','Yvaine','Seraphe','Nimue','Cassel','Odilia'],
   say:['Aquí las piedras recuerdan. No les preguntes demasiado: responden.','La magia no es un don. Es una deuda. Alguien siempre acaba pagándola.','Cuando el cielo se pone violeta, cierra los libros. Algunos aprenden a leerte a ti.']},
  {n:'Desierto',robes:['#d8c08a','#c8a060','#b8805a','#e0d0a0','#a8704a','#c89a5a'],trims:['#8a2a2a','#2a5a8a','#e8d8a0'],hair:['#1a1410','#2a1a14','#3a2a1a','#5a3a28'],skins:['#b5764a','#c08a60','#a06a40','#b88458'],hm:['cut','curly','side'],hf:['long','bun','pony','bob'],beard:.45,hat:'turban',
   m:['Amir','Zahir','Khalid','Tariq','Rashid','Idris','Jalil','Hakim','Nasir','Omar','Samir','Walid','Yusuf','Karim'],f:['Layla','Samira','Nadia','Yasmin','Soraya','Farah','Dalia','Amara','Basma','Inaya','Leena','Mariam','Rania','Zaina'],
   say:['El agua es lo único que vale de verdad aquí. El oro es para quien no tiene sed.','Las dunas se mueven de noche. Por eso los mapas son de papel viejo y los guías de carne y hueso.','Cuenta una historia a la sombra y te darán agua. Eso es lo que queda de dinero en el desierto.']},
  {n:'Costa de las Tormentas',robes:['#3a5a7a','#4a7a8a','#6a6a7a','#8a7a5a','#5a6a7a','#3a4a5a'],trims:['#e8e8e0','#c8d8e0','#a88a5a'],hair:['#c8b890','#6a4a2a','#2a2a30','#8a6a3a','#d8d0c0'],skins:['#d8a878','#c89868','#e0b890','#b88858'],hm:['cut','curly','mane','side'],hf:['bun','pony','twin','bob'],beard:.4,hat:'sailor',
   m:['Marlo','Odric','Corin','Jonas','Tobias','Pelle','Dunmar','Rook','Silas','Nils','Ewan','Bram','Cael','Hollis'],f:['Nerea','Selene','Coral','Seren','Maris','Wren','Isla','Thalassa','Perla','Marina','Brisa','Lenka','Oriel','Tamsin'],
   say:['El mar da y quita. Cuando quita, no se discute: se reza.','Las tormentas de aquí no vienen del cielo, vienen de debajo. Los pescadores viejos lo saben.','Si oyes campanas en la niebla, no vayas hacia ellas. Y no cuentes a nadie que las oíste.']}];
 // ── OFICIOS. lbl [masc,fem]; job = animación (actors3d JOBF); tool = herramienta en la mano; anchor = dónde trabaja; vend = clave de TRADE.VEND (un vendedor por oficio; los demás no venden) ──
 const ROLES={
  guardia:{lbl:['Guardia','Guardiana'],tool:'spear',pauld:1,H:55,w:1.06,chestW:1.05,anchor:{st:'fire'},pref:60,mv:'patrol',wave:0,vend:0,hat:'cap'},
  herrero:{lbl:['Herrero','Herrera'],job:'hammer',tool:'hammer',apron:'#4a3426',anchor:{door:'herreria'},pref:78,wave:0,vend:'herrero',hand:1,rx:-.9,w:1.04,chestW:1.06},
  anciano:{lbl:['Anciano','Anciana'],tool:'staff',H:47,w:.95,lean:.22,anchor:{door:'templo'},pref:76,wave:0,vend:'anciano',old:1},
  granjero:{lbl:['Granjero','Granjera'],job:'hoe',tool:'hoe',anchor:{props:['huerto','heno','gallinero','espantapajaros','cerca','valla']},pref:44,wave:0,vend:'granjero',hat:'straw',hc:'#c8a860'},
  pescador:{lbl:['Pescador','Pescadora'],job:'fish',tool:'rod',anchor:{water:1},pref:30,wave:0,vend:'pescador',hat:'cap'},
  lenador:{lbl:['Leñador','Leñadora'],job:'chop',tool:'axe',anchor:{props:['pilaTroncos','tablones','tocon','lenera','caballete']},pref:50,wave:0,vend:'lenador',w:1.06,chestW:1.06,beardP:.6},
  cocinero:{lbl:['Cocinero','Cocinera'],job:'knead',tool:'ladle',apron:'#efe9da',anchor:{door:'taberna'},pref:70,wave:0,vend:'cocinero',hat:'cap',hc:'#f1ece0'},
  nino:{lbl:['Niño','Niña'],k0:.64,H:36,mv:'wander',anchor:{plaza:1},pref:50,wave:1,vend:0,child:1},
  bardo:{lbl:['Bardo','Bardesa'],job:'lute',tool:'lute',anchor:{door:'taberna'},pref:92,wave:0,vend:0,hat:'feather'},
  escriba:{lbl:['Escriba','Escriba'],job:'read',tool:'book',anchor:{st:'board'},pref:56,wave:0,vend:0},
  mercader:{lbl:['Mercader','Mercadera'],tool:'basket',job:'carry',anchor:{props:['puesto','caja','barril']},pref:44,wave:1,vend:0,sash:1},
  noble:{lbl:['Noble','Noble'],job:'pose',anchor:{plaza:1},pref:96,wave:0,vend:0,fine:1,dressP:.7},
  cazador:{lbl:['Cazador','Cazadora'],tool:'sword',anchor:{plaza:1},pref:110,wave:0,vend:0},
  aguador:{lbl:['Aguador','Aguadora'],job:'carry',tool:'bucket',anchor:{props:['pozo']},pref:44,wave:1,vend:0},
  aprendiz:{lbl:['Aprendiz','Aprendiza'],job:'sweep',tool:'broom',anchor:{door:'herreria'},pref:100,wave:1,vend:0},
  tejedor:{lbl:['Tejedor','Tejedora'],job:'sweat',anchor:{door:'taller'},pref:80,wave:0,vend:0}};
 const BASE=['guardia','herrero','anciano','granjero','pescador','lenador','cocinero','nino'];   // 8 por aldea
 const CAPITAL=4;   // Oriental: la capital lleva el doble (los 8 otra vez, sin vendedores repetidos) + 4 oficios de ciudad = 20
 const EXTRA=['bardo','escriba','mercader','noble'];
 const MORE=['aguador','aprendiz','cazador','tejedor'];   // reservados para aldeas grandes o futuras misiones
 // ── ELENCO ──
 const cast=k=>{const L=[];BASE.forEach(r=>L.push([r,0]));if(k===CAPITAL){BASE.forEach(r=>L.push([r,1]));EXTRA.forEach(r=>L.push([r,0]))}return L};
 const look=(k,role,idx,dup)=>{const C=CU[k],R=ROLES[role],seed=k*131+idx*17+(dup?7:0),r=i=>hs(k,role.length*7+idx+i,seed+i*3),fem=R.child?r(1)<.5:r(1)<(R.old?.5:.45);
  const robe=pick(C.robes,r(2)),trim=pick(C.trims,r(3)),skin=pick(C.skins,r(4)),old=R.old,hair=old?'#d8d4cc':pick(C.hair,r(5));
  const hs_=fem?pick(C.hf,r(6)):pick(C.hm,r(6));
  const o={ph:r(7)*6.28,robe:R.fine?pick(C.robes,r(8)):robe,trim:R.fine?'#e8c040':trim,belt:R.sash?trim:'#3a2a20',skin,pants:'#4a3a32',boot:'#2e2218',hair,hs:old?'mane':hs_,w:R.w||(fem?.94:1),chestW:R.chestW||(fem?1:1.02),H:R.H||(fem?48:51),
   tool:R.tool,hand:R.hand,rx:R.rx,apron:R.apron,sash:R.sash&&trim,wave:!!R.wave,k0:R.k0,lean:R.lean,job:R.job||null,blush:!!R.child||(fem&&r(9)<.4),
   hat:R.hat||null,hatC:R.hc,hatC2:null,beard:(!fem&&(old||r(10)<(R.beardP!=null?R.beardP:C.beard)))?(old?.3:.14+r(11)*.08):0,pauld:R.pauld?'#8a8e96':null,scarf:(k===3||k===8)&&r(12)<.5?trim:null};
  if(k===0&&R.hat==='cap'&&role==='guardia')o.hatC='#7a7a82';
  if(!o.hat&&!R.child&&r(13)<.4&&C.hat&&!R.apron&&role!=='anciano')o.hat=C.hat;   // algunos llevan el sombrero de su cultura
  if(o.hat&&!o.hatC){const m={wizard:C.trims[0]!==undefined?C.robes[0]:'#4a3a7a',turban:'#e8e0c8',fur:'#8a6a4a',sailor:'#e8e8e0',straw:'#d8c070',horn:'#2a1a1a',feather:C.robes[0],band:C.trims[0],cap:robe};o.hatC=m[o.hat]||trim;o.hatC2=o.hat==='turban'?C.trims[0]:o.hat==='sailor'?'#2a3a5a':C.trims[1]}
  if(o.hat==='wizard')o.hatC=C.robes[(idx+1)%C.robes.length];
  if(fem&&((R.fine&&r(14)<R.dressP)||(role==='cocinero'&&r(15)<.5)||(role==='bardo'&&r(15)<.6)))o.dress=true;   // vestido solo en PNJ femeninos de oficios que lo admiten (Mini.DRESS_OK se amplía en actors3d.js)
  if(role==='anciano'){o.robe=pick(['#33335a','#4a3a5a','#3a4a5a','#5a4a3a'],r(16));o.trim='#8a7a5a';o.belt='#8a7a5a';o.sleeve=o.robe;o.dress=true;o.hat=null}
  if(R.child){o.robe=pick(C.robes,r(17));o.beard=0;o.hat=r(18)<.3?'cap':null}
  return{o,fem}};
 const nameOf=(k,fem,idx,dup)=>{const C=CU[k],a=fem?C.f:C.m;return a[Math.floor(hs(k,idx*3+(fem?1:0),dup?9:5)*a.length)%a.length]};
 // ── TEXTOS (voz de aldeano, no de jugador; ver docs/LORE.md) ──
 const SAY={
  guardia:['Vigilo la plaza. Lo que entra, entra; lo que sale, que avise antes. Es una regla sencilla y casi nadie la cumple.','Si ves algo que no habla, no le hables tú. Si ves algo que habla demasiado, tampoco.','Mi turno acaba cuando amanece. Algunas noches, creo que el amanecer es solo un rumor.'],
  herrero:['Hierro, carbón y paciencia. Lo demás es adorno. Si quieres algo de calidad, tráeme el material y no me hables de plazos.','Esto de aquí hace un ruido que ahuyenta a los espíritus y a los clientes. Pensé que el ruido sería lo peor; resultó ser lo útil.','Una espada bien hecha no te hace valiente. Solo evita que mueras por una cosa menos.'],
  anciano:['Hmm. Otro que pasa por el templo sin saber por qué. Siéntate, no cobramos la sombra.','Antes había ángeles mirando el cielo. Ahora miramos nosotros, y a veces la luna nos devuelve la mirada.','No digo ciertos nombres en voz alta: los nombres llaman. Y ya hay quien responde.'],
  granjero:['La tierra no pregunta por qué. Pide agua y paciencia. Yo se las doy; ella decide si me las devuelve.','Este año el trigo salió torcido. Dicen que es por la luna. Yo digo que es por el vecino, pero no se lo repitas.','Si ves una cosecha dorada, no es suerte. Es un pacto que nadie escribió.'],
  pescador:['Shh. Los peces oyen más de lo que parece. Si quieres hablar, espera a que pique.','Pesco desde antes de que me creciera la barba. El pez más grande siempre se escapó. Eso es lo que me mantiene aquí.','El agua cuenta historias si sabes escuchar. La mayoría son de gente que no volvió.'],
  lenador:['Cada tronco es un favor que le debo al bosque. Intento no deber demasiado.','Un hacha afilada es una amiga. Una embotada, un castigo. Tú dirás cuál prefieres tener cerca de los dedos.','Hay árboles que no se talan. No es superstición: es una forma de educación.'],
  cocinero:['Si algo huele bien, es porque alguien se quemó los dedos para que así fuera. Prueba y calla.','El secreto es la sal, y el segundo secreto también es la sal. Los demás son mentiras de cocinero.','Aquí se come lo que hay. Si hay poco, se comparte. Si hay mucho, se invita. Es la única ley que todos cumplen.'],
  nino:['¡Hola! ¿Eres un aventurero? ¿Has matado un lobo? ¿Uno de verdad? Mi padre dice que no hay que salir del camino pero yo salgo de vez en cuando.','Mira, encontré esta piedra. Brilla si la miras de lado. No se la enseñes al guardia, me la quitaría.','Dicen que de noche vienen cosas. Yo no he visto ninguna. Pero tampoco he mirado mucho.'],
  bardo:['Tengo una canción para cada puerta de este lugar. La de la herrería es la más ruidosa; la del templo, la que más pide silencio.','Cantar es lo único que los dioses no nos quitaron. Quizá porque no lo supieron imaginar.','Si quieres que te recuerden, pídeme una estrofa. Si quieres que te olviden, dame una moneda y no pidas nada.'],
  escriba:['Yo apunto lo que otros prefieren olvidar. Es un oficio solitario, pero tiene archivo.','Las deudas, los nacimientos, los muertos. En ese orden. A veces es el mismo libro.','No pregunto qué haces. Pregunto qué firmaste. Lo primero no importa; lo segundo, sí.'],
  mercader:['Todo tiene precio, aunque a veces el precio sea una pregunta. Mira, mira, y no toques lo que no vayas a pagar.','He recorrido tres caminos y vendido en todos. En el cuarto casi me venden a mí.','Si buscas algo raro, ven más tarde: los raros llegan cuando ya no los esperas.'],
  noble:['Qué encantador, otro viajero. Espero que sepas que aquí se saluda antes de hablar. Es una costumbre antigua. Y cara.','Mi apellido pesa más que mi bolsa, y aun así la bolsa se vacía más rápido.','Hay cosas de las que no se habla en la capital. Se habla de lo que no se habla, que es peor.'],
  cazador:['Sigo huellas que otros no ven. A veces llevan a una presa; a veces, a un problema con dientes.','El bosque no es peligroso: es honesto. La gente es la que miente.','Si oyes un silencio de golpe, no te muevas. Ese silencio no es tuyo.'],
  aguador:['Agua fresca, agua del pozo, agua de lo que no se pregunta. ¡Pasa, que hoy hace calor!','Cargo cubos desde antes del alba. Mis hombros se quejan, pero el pueblo bebe. Es un buen trato.','En este pozo hay un eco que nunca devuelve lo que dices. No lo mires fijo.'],
  aprendiz:['Barro, mantengo el fuego, llevo el carbón. Algún día me dejarán golpear el yunque. Algún día.','Mi maestro dice que la paciencia es la mitad del oficio. La otra mitad es no quemarse. Voy por la primera.','No toques eso, está caliente. Lo sé porque lo toqué.'],
  tejedor:['Cada hilo cuenta una historia. Este azul vino de lejos, este rojo, de una promesa.','Se me da mejor la tela que la gente. La tela no pregunta por qué tardas.','Si algún día necesitas remendar algo roto, ven. Si es un corazón, trae algo más fuerte que el hilo.']};
 const QUIRK=['Por cierto, no me fío de los gatos.','A veces canto para mí mismo. No lo digas.','Odio la lluvia. Pero la necesito. Es un matrimonio.','Si ves a mi vecino, dile que le guardo la deuda.','Dicen que soy gruñón. Dicen muchas cosas.','Hoy dormí poco. Ayer, igual. La semana pasada, no preguntes.','Tengo un hermano en otra aldea. Nunca contesta mis cartas.','Siempre llevo algo de pan encima. Nunca se sabe.','Mi madre decía que hay que saludar a todo el mundo. También a quien no te gusta.','No me preguntes por mi pasado. Ya es bastante con aguantar el presente.','Una vez vi algo en el camino. No hablaré de ello.','Cuento mis monedas todas las noches. Nunca coinciden.'];
 const NIGHT=['Es tarde para andar por ahí. Ve a cubierto antes de que salga lo que sale.','Con la luna alta, hasta el fuego parece más pequeño. Que no se apague.','Cada noche cuento las estrellas y cada noche me faltan dos. No sé quién se las lleva.'];
 // ── GENERAR ──
 const LIST=[];   // [{id,k,role,nm,rol,col,say,vend,job,mv,fem,dup}]
 const RK=Object.keys(ROLES);
 const gen=k=>{const out=[],cnt={};cast(k).forEach(([role,dup],i)=>{
   if(k===0&&!dup&&(role==='guardia'||role==='herrero'||role==='anciano'))return;   // Pradera: ya tiene a Ivo, Brenna y Orsen (npcs.js VNPC, diseños APROBADOS)
   const n=cnt[role]=(cnt[role]||0),idx=cnt[role]++;const{o,fem}=look(k,role,i,dup),R=ROLES[role],nm=nameOf(k,fem,i,dup),id='v:'+k+':'+role+idx;
   NPCLK[id]=Object.assign({},o);const vend=dup?0:R.vend;
   out.push({id,k,role,nm,rol:R.lbl[fem?1:0],col:o.trim,vend,job:o.job,mv:R.mv||null,fem,dup,idx:i})});return out};
 for(let k=0;k<CU.length;k++)gen(k).forEach(d=>LIST.push(d));
 const byId=new Map(LIST.map(d=>[d.id,d]));
 // ── LOS EXILIADOS DEL CIELO (ISLA-4b, 21 oct 2026; docs/PLAN_ISLA_CIELO.md §6–§7): los maestros de la isla del tutorial, con nombres de ARCÁNGELES (canon del dueño). Son 6 (el 7.º, Gabriel, es el jefe: `gabriel3d.js`).
 // Cultura GRIEGA (quitones claros con ribete dorado, sin alas ni halo). UNA frase por diálogo (regla de poco texto) y voz sobria, con una «cojera de fe»: se cortan al hablar del cielo. Las PISTAS del giro (cicatrices de alas,
 // chispas que suben, nunca comen…) viven aquí en `secret` y NO se dicen en ningún diálogo: LORE §1b y PLAN_ISLA_CIELO §7 (propuesta sin canon hasta que el dueño la apruebe).
 // `at` = tiles desde el centro de la isla (como sky-biome.js); `job`/`tool` = animación y objeto en la mano (actors3d.js JOBF/TOOLW); `to` = punto al que miran mientras trabajan.
 const EXILES=[
  {id:'v:9:raguel',nm:'Raguel',rol:'Guía',fem:0,at:[-24.3,11.2],to:[-26,12.4],tool:'staff',wave:0,lines:['Bienvenido. Camina por el camino de lajas hasta la columna, corre un poco manteniendo Mayús y abre la Mochila. Después vuelve conmigo.','Bien. Ahora ve al olivar, al oeste, y habla con Sariel: ella te enseña a talar y minar.'],
   o:{robe:'#d9d2bf',trim:'#c9a95e',belt:'#c9a95e',skin:'#e0bd98',hair:'#d4d0c6',hs:'cut',beard:.2,w:1.0,chestW:1.03,H:53},secret:'ordena sin mandar; se santigua al mirar la Acrópolis'},
  {id:'v:9:sariel',nm:'Sariel',rol:'De la tierra',fem:1,at:[-19.4,-0.6],job:'chop',tool:'axe',to:[-21,-3],wave:0,lines:['Necesito 3 troncos de olivo y, de la cantera del norte, 2 de cobre y 2 de estaño. Tráelos contigo.','Cuando tengas los troncos y las menas, ve al Ágora y habla con Uriel.'],
   o:{robe:'#9aa384',trim:'#c9a95e',belt:'#7a6a4a',skin:'#d7ab84',hair:'#5a4a3a',hs:'bun',dress:true,w:.95,chestW:1,H:50},secret:'una cicatriz recta en cada omóplato bajo la capa; trabaja mirando la luna'},
  {id:'v:9:uriel',nm:'Uriel',rol:'Fragua',fem:0,at:[2,-7.4],job:'hammer',tool:'hammer',to:[2,-5.4],wave:0,lines:['Con esa mena, funde 2 barras de cobre en el horno y forja una espada de cobre en el yunque.','Con la espada hecha, ve a la fuente y habla con Rafael.'],
   o:{robe:'#b0805e',trim:'#e0b060',belt:'#3a2a20',skin:'#c08a60',hair:'#2a1a12',hs:'curly',beard:.26,apron:'#4a3426',hand:1,rx:-.9,w:1.06,chestW:1.07,H:53},secret:'las chispas de su forja suben en vez de caer; no se quema'},
  {id:'v:9:rafael',nm:'Rafael',rol:'Pesca y cocina',fem:0,at:[11.6,0.6],job:'fish',tool:'rod',to:[8.6,0.6],wave:0,lines:['Pesca 3 camarones en la fuente y cocina 2 en la fogata del Ágora.','Cuando los tengas cocinados, ve a la Palestra y habla con Miguel.'],
   o:{robe:'#8fb3ba',trim:'#e8e0c8',belt:'#d9c9a0',skin:'#e0be9a',hair:'#8a6a3a',hs:'side',w:.98,chestW:1.02,H:52},secret:'lo que cocina cura un poco más; nunca come'},
  {id:'v:9:miguel',nm:'Miguel',rol:'Guerra',fem:0,at:[14,10],tool:'sword',wave:0,lines:['Practica con los corderos de nube: golpea, carga un golpe, esquiva y bloquea. Te presto un arco, un bastón y un escudo: prueba cada arma y elige con cuál te enfrentarás a Gabriel.','Cuando acabes, deposita todo en el banco, saca del banco las 4 ofrendas que aparecerán allí y llévalas a la Arena del Vigía, al sur, fuera de la isla.'],
   o:{robe:'#cfc6b0',trim:'#b8b0a0',belt:'#4a3426',skin:'#cfa07a',hair:'#3a2a1a',hs:'spiky',beard:.14,pauld:'#9aa0a8',w:1.07,chestW:1.08,H:55},secret:'no soporta que bajes el arma; mira siempre al norte'},
  {id:'v:9:remiel',nm:'Remiel',rol:'Barquera',fem:1,at:[27,-0.4],tool:'staff',wave:0,lines:['Aún no es tiempo. Termina el ritual en la Acrópolis; entonces te llevaré.','…'],
   o:{robe:'#9a9ab4',trim:'#e8e0c8',belt:'#d9c9a0',skin:'#d9b490',hair:'#e8e6f0',hs:'long',dress:true,w:.94,chestW:1,H:51},secret:'guía con una lámpara sin llama; casi nunca habla'}];
 EXILES.forEach((x,i)=>{NPCLK[x.id]=Object.assign({ph:i*1.7+.4,pants:'#d4cdb8',boot:'#8a7a5a',tool:x.tool,job:x.job||null,wave:!!x.wave,blush:false,sleeve:null},x.o,{tool:x.tool,job:x.job||null});
  const d={id:x.id,k:9,role:'exilio',nm:x.nm,rol:x.rol,col:x.o.trim,vend:0,job:x.job||null,mv:null,fem:!!x.fem,dup:0,idx:i,lines:x.lines,at:x.at,to:x.to,exile:1};LIST.push(d);byId.set(d.id,d)});
 // diálogo de un PNJ generado: oficio + cultura + manía; de noche, a veces, una frase nocturna
 const say=(d,c,n)=>{if(d.lines)return [d.lines[n%d.lines.length]];const C=CU[d.k],v=(n+d.idx)%3,night=c.night&&n%2===1;const s=SAY[d.role]||SAY.mercader,q=QUIRK[Math.floor(hs(d.k,d.idx,41)*QUIRK.length)];
  return [s[v],night?NIGHT[(d.idx+n)%3]:C.say[(v+d.idx)%3]+' '+q]};
 // ── COLOCACIÓN: junto a su sitio de trabajo, en el primer hueco libre (npcFree de npcs.js) ──
 const anchorOf=(d,k)=>{const R=ROLES[d.role],a=R.anchor,B=BI[k],plaza=B.village.plaza[0];
  if(a.door){const e=ST.find(s=>s.id==='door'&&s.room===a.door&&s.k===k);if(e)return{x:e.x,y:e.y,rot:e.rot,door:1}}
  if(a.st){const e=ST.find(s=>s.id===a.st&&!s.inroom&&ownAt(s.x,s.y)===k);if(e)return{x:e.x,y:e.y}}
  if(a.props){const L=PROPS.list.filter(p=>p.k===k&&a.props.includes(p.n)&&Math.hypot(p.x-(B.ox+plaza[0]),p.y-(B.oy+plaza[1]))<700);if(L.length){const p=L[Math.floor(hs(k,d.idx,3)*L.length)];return{x:p.x,y:p.y}}}
  if(a.water){let best=null,bd=1e9;const cx=B.ox+plaza[0],cy=B.oy+plaza[1],W=(x,y)=>TER.heightAt(x,y)===.75;
   for(let dy=-760;dy<=760;dy+=32)for(let dx=-760;dx<=760;dx+=32){const x=cx+dx,y=cy+dy,dd=Math.hypot(dx,dy);if(dd<150||dd>=bd||!W(x,y))continue;if(!W(x+32,y)||!W(x-32,y)||!W(x,y+32)||!W(x,y-32)){bd=dd;best={x,y,water:1}}}   // casilla de agua con orilla (alguna vecina no es agua) más cercana a la plaza
   if(best)return best}
  return{x:B.ox+plaza[0],y:B.oy+plaza[1],plaza:1}};
 const free=(x,y,k,pl)=>npcFree(x,y,k,null,pl);
 function place(d,k,pl){const a=anchorOf(d,k),R=ROLES[d.role];if(!a)return null;const front=a.door?(a.rot?0:Math.PI/2):0,RS=[0,18,-18,36,-36,64,96,140,200];let best=null;
  const seed=hs(k,d.idx,19)*6.283;for(let i=0;i<RS.length&&!best;i++){const r=R.pref+RS[i];if(r<26)continue;for(let j=0;j<36&&!best;j++){const ang=(a.door?front+.9:seed)+(j%2?-1:1)*Math.ceil(j/2)*(Math.PI/18),x=a.x+Math.cos(ang)*r,y=a.y+Math.sin(ang)*r;if(free(x,y,k,pl)){if(a.water&&TER.heightAt(x,y)!==1)continue;best={x,y}}}}
  if(!best)return null;best.face=(d.job&&a)?Math.atan2(a.x-best.x,a.y-best.y):null;best.a=a;return best}
 // ── INICIO: crea las entidades de estación (ST) de todos los aldeanos ──
 const ents=[];
 function init(){let n=0;if(!window.R3D_ON)return 0;ents.length=0;
  for(let k=0;k<BI.length;k++){const B=BI[k];if(B.zone)continue;const pl=PROPS.list.filter(p=>p.n!=='huerto'&&Math.abs(p.x-(B.ox+B.village.plaza[0][0]))<1100&&Math.abs(p.y-(B.oy+B.village.plaza[0][1]))<1100);
   for(const d of LIST){if(d.k!==k)continue;const q=place(d,k,pl);if(!q)continue;
    const e={id:d.id,n:d.nm+', '+d.rol.toLowerCase(),x:q.x,y:q.y,npc:1,k,role:d.role,job:d.job,col:d.col,home:{x:q.x,y:q.y},mvr:d.mv,face:q.face,vend:d.vend,st:{t:0,dir:1,wait:hs(k,d.idx,2)*4}};ST.push(e);ents.push(e);n++}}
  // los EXILIADOS del Cielo (zona 9, no pasan por `gen`): posición fija en tiles desde el centro de la isla
  {const B=BI[9];if(B&&B.zone)for(const d of LIST){if(!d.exile)continue;const x=B.ox+B.w/2+d.at[0]*32,y=B.oy+B.h/2+d.at[1]*32,face=d.to?Math.atan2(B.ox+B.w/2+d.to[0]*32-x,B.oy+B.h/2+d.to[1]*32-y):null;
   ST.push({id:d.id,n:d.nm+', '+d.rol.toLowerCase(),x,y,npc:1,k:9,role:d.role,job:d.job,col:d.col,home:{x,y},mvr:null,face,vend:0,st:{t:0,dir:1,wait:0}});ents.push(ST[ST.length-1]);n++}}
  {const B=BI[9];if(B&&B.zone){ST.push({id:'v:9:altar',n:'Altar Quebrado',x:B.ox+B.w/2+16*32,y:B.oy+B.h/2+(-3.5+1.3)*32,npc:1,k:9,role:'altar',home:{x:0,y:0},vend:0,st:{t:0,dir:1,wait:0}});n++}}   // el Altar Quebrado como punto de interacción (sin actor 3D: la estatua es un prop); ISLA.altar() lo gestiona
  return n}
 // ── RUTINAS DE MOVIMIENTO (guardia patrulla, niño corretea): solo se mueven los cercanos al jugador ──
 const okStep=(x,y)=>!blk(x,y)&&!PROPS.solid(x,y)&&TER.heightAt(x,y)>=1&&TER.heightAt(x,y)<2;
 function tick(dt){if(INT||!ents.length)return;for(const e of ents){if(!e.mvr)continue;const dx=e.x-P.x,dy=e.y-P.y;if(dx*dx+dy*dy>1500*1500)continue;const s=e.st;
   if(Math.hypot(dx,dy)<64){e.job=null;continue}   // si el jugador está cerca, se queda quieto (para hablar)
   if(s.wait>0){s.wait-=dt;continue}
   if(e.mvr==='patrol'){const sp=22*dt,nx=e.x+Math.cos(e.pa||0)*sp*s.dir,ny=e.y+Math.sin(e.pa||0)*sp*s.dir;if(e.pa==null){e.pa=hs(e.x,e.y,5)*Math.PI;s.len=0}
    if(okStep(nx,ny)&&Math.hypot(nx-e.home.x,ny-e.home.y)<95){e.x=nx;e.y=ny}else{s.dir*=-1;s.wait=2+hs(e.x,e.y,s.t++)*4}e.face=null}
   else if(e.mvr==='wander'){if(!s.tx||Math.hypot(s.tx-e.x,s.ty-e.y)<10){const a=hs(e.x,s.t++,9)*6.283,r=40+hs(e.y,s.t,11)*110;s.tx=e.home.x+Math.cos(a)*r;s.ty=e.home.y+Math.sin(a)*r;if(!okStep(s.tx,s.ty)){s.tx=0;s.wait=1+hs(e.x,e.y,s.t)*2;continue}s.wait=1+hs(e.x,e.y,s.t)*3.5;continue}
    const vx=s.tx-e.x,vy=s.ty-e.y,l=Math.hypot(vx,vy),sp=Math.min(l,42*dt),nx=e.x+vx/l*sp,ny=e.y+vy/l*sp;if(okStep(nx,ny)){e.x=nx;e.y=ny;e.fx=vx/l;e.fy=vy/l}else{s.tx=0;s.wait=1}}}}
 return{init,tick,LIST,byId,CU,ROLES,say,list:ents,def:e=>byId.get(e.id)||null}})();
