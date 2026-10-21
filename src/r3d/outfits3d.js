// NotScape · R3D · DISEÑOS APROBADOS de personajes (dueño, 17 oct 2026: «me gustaron mucho los diseños y los vamos a usar»).
// Fuente ÚNICA de verdad: la hoja docs/style-reference/r3d/disenos-personaje.html y el juego leen de aquí. Cada entrada = un `look` para Hero.setLook()
// (hero3d.js): app (apariencia: género, pelo, colores), outfit (piezas de vestuario, ver la lista en hero3d.js «VESTUARIO»), gear (arma/escudo/placas), helm.
// Reglas de estilo para añadir más: docs/GUIA_PERSONAJES_3D.md. NO cambiar los colores de estas entradas sin el visto bueno del dueño.

// ── ATUENDOS DEL HÉROE ── `base` = el que lleva al empezar; el resto se desbloquean (plan F6b: ver GUIA_3D_PORTEO §6). `app` aquí es solo de muestra:
//    en el juego la apariencia (género, pelo, piel, ojos) la pone el jugador en el editor y el atuendo solo aporta `outfit` + colores de prenda.
export const OUTFITS=[
 {id:'errante',name:'Errante',sub:'camisa, correas de cuero, cinturón',base:true,unlock:'inicial',
  look:{app:{g:'m',hair:'cut',hc:'#4a3022',skin:'#d9a878',col:'#5a5a3a'},outfit:{straps:'#5a3e2c',bag:'#6a4a30',pouches:1,knife:1,skirt:'corta'},gear:{wp:{t:'sword',wk:'sword',col:'#b8c0c8'}}}},
 {id:'penitente',name:'Penitente de ceniza',sub:'túnica larga, capelina, vendas',unlock:'Plegaria / Magia (propuesta)',
  look:{app:{g:'f',hair:'long',hc:'#2a1e18',skin:'#e6c4a0',col:'#6a6460'},outfit:{skirt:'larga',skirtC:'#5a5450',capelet:'#3e3a40',hood:'baja',hoodC:'#3e3a40',wraps:1,rope:'#a08a60',amulet:'#d8b050',scarf:false},gear:{wp:{t:'staff',wk:'staff',col:'#e8a050'}}}},
 {id:'mercenario',name:'Mercenario de frontera',sub:'brigantina, hombrera, piel',unlock:'Cuerpo a cuerpo (propuesta)',
  look:{app:{g:'m',hair:'cut',hc:'#6a4a2a',skin:'#c88a5a',col:'#4a3a3a',face:3},outfit:{build:'robusto',top:'brigantina',fur:'#6a5a4a',pauldron:'#8a8a90',rolled:1,beard:'corta',pouches:1,scarf:false},gear:{wp:{t:'sword',wk:'great',col:'#9aa0a8'}}}},
 {id:'cazadora',name:'Cazadora del bosque',sub:'chaleco, máscara, carcaj',unlock:'A distancia (propuesta)',
  look:{app:{g:'f',hair:'pony',hc:'#7a3a22',skin:'#e0b088',col:'#3a4a32'},outfit:{top:'chaleco',topC:'#5a4632',mask:'#3a4436',quiver:1,wraps:1,knife:1,scarf:false},gear:{wp:{t:'bow',wk:'bow',col:'#6a4a2a'}}}}];

// ── PNJ Y HUMANOIDES ── `uses` = a qué entidad del juego sustituye (plan F7a).
export const NPCS=[
 {id:'tendero',name:'Tendero',sub:'delantal, mangas arremangadas',uses:'Ru (PEOPLE.ru, props.js) y tenderos de interiores',
  look:{app:{g:'m',hair:'bald',hc:'#6a5a4a',skin:'#e0b090',col:'#7a6a50'},outfit:{build:'robusto',apron:'#c8bca0',rolled:1,beard:'corta',scarf:false}}},
 {id:'guardia',name:'Guardia de la aldea',sub:'tabardo con emblema, yelmo',uses:'nuevo: guardias en puertas de aldea / compuertas de bioma',
  look:{app:{g:'m',hair:'cut',hc:'#3a2a20',skin:'#d0a07a',col:'#5a5a62'},helm:'#8a8a90',outfit:{tabard:'#6a2a2a',emblem:'#d8b050',skirt:'rodilla',scarf:false},gear:{pl:1,ht:'hierro',wp:{t:'staff',wk:'spear',col:'#cfd4dc'}}}},
 {id:'herrera',name:'Herrera',sub:'delantal de cuero, pañuelo',uses:'nuevo: junto al yunque/horno de la aldea (ST anvil/furnace)',
  look:{app:{g:'f',hair:'bun',hc:'#2a1a12',skin:'#b5764a',col:'#6a4a3a'},outfit:{apron:'#4a3426',apronLeather:1,rolled:1,hat:'panuelo',hatC:'#8a3a2a',scarf:false}}},
 {id:'anciano',name:'Anciano sabio',sub:'túnica larga, barba, encorvado',uses:'nuevo: dador de misiones / altar (ST altar)',
  look:{app:{g:'m',hair:'mane',hc:'#d8d4cc',skin:'#e0bc9a',col:'#3a3a5a'},outfit:{build:'anciano',skirt:'larga',skirtC:'#33335a',beard:'larga',rope:'#8a7a5a',capelet:'#2a2a44',scarf:false},gear:{wp:{t:'staff',wk:'staff',col:'#9cf'}}}},
 {id:'bandido',name:'Bandido',sub:'capucha, pañuelo en la cara',uses:'criatura «bandido» (creatures.js) y jefe Rufo, Cabecilla Bandido (variante con capa)',
  look:{app:{g:'m',hair:'cut',hc:'#2a1a12',skin:'#c89060',col:'#3a3030'},outfit:{top:'chaleco',topC:'#3a2e26',hood:'alta',hoodC:'#2e2a2a',mask:'#5a2a26',knife:1,pouches:1,scarf:false},gear:{wp:{t:'sword',wk:'dagger',col:'#9aa0a8'}}}}];

// ── F6b · ATUENDOS DEL HÉROE EN EL JUEGO (17 oct 2026) ──
// S.app.outfit = id de OUTFITS (por defecto 'errante'). El jugador conserva SU apariencia (género, pelo, piel, ojos, color de ropa); el atuendo solo
// aporta las PRENDAS (`outfit`). El equipo real manda sobre el diseño: ver resolveLook().
// DESBLOQUEO: la guía lo dejó «a confirmar con el dueño» (propuesta: Penitente por Plegaria/Magia, Mercenario por cuerpo a cuerpo, Cazadora por distancia).
// Hasta que lo confirme, TODOS están disponibles: OUTFIT_FREE=true. Cuando se decida, pon false y rellena OUTFIT_RULE (id → función de requisito).
export const OUTFIT_FREE=true;
export const OUTFIT_RULE={};   // p. ej. {penitente:()=>L('pr')>=20||L('mg')>=20}  (L = nivel de la skill, global de game.js)
export const outfitOf=id=>OUTFITS.find(o=>o.id===id)||OUTFITS[0];
export const outfitUnlocked=id=>OUTFIT_FREE||id==='errante'||!OUTFIT_RULE[id]||!!OUTFIT_RULE[id]();
// look del juego (app + equipo) → look para Hero.setLook con el atuendo elegido aplicado.
//  · Armadura equipada (look.ar) o peto de placas (gear.pl): sustituyen a la prenda de torso (gambesón/brigantina/chaleco), al tabardo y al delantal.
//  · Yelmo equipado (look.helm): no se pintan gorro ni capucha alta (el pelo y la cabeza los resuelve hero3d con el yelmo).
//  · Capa equipada (gear.cp): la bufanda ya se oculta sola en hero3d.js; capelina y capucha del atuendo se quedan.
export function resolveLook(look){look=look||{};const app=look.app||{},o=Object.assign({},outfitOf(app.outfit).look.outfit),gr=look.gear||{};
 if(look.ar||gr.pl){delete o.top;delete o.topC;delete o.tabard;delete o.emblem;delete o.apron;delete o.apronLeather}
 if(look.helm){delete o.hat;delete o.hatC;if(o.hood==='alta'){delete o.hood;delete o.hoodC}}
 return Object.assign({},look,{outfit:o})}
