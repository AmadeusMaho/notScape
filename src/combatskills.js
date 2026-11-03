// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// HABILIDADES DE COMBATE POR ARMA (29 oct 2026) · motor `CSK` + kits. Diseño completo: docs/PLAN_HABILIDADES.md
//  · Cada FAMILIA de arma (espada, arco, báculo… `wKind()`) tiene un kit de 6 habilidades que se aprenden SOLAS al subir la skill del arma
//    (Combate / Arquería / Magia, niveles 1·8·18·30·45·65) y mejoran de rango USÁNDOLAS (I–IV a 20/80/240/600 usos: +8 % efecto, −4 % enfriamiento por rango).
//  · Teclas 1–6 = casillas de la barra `#hs-sk` (hud.js). Recurso: Energía (Combate/Arquería) o fracción de maná (Magia). Enfriamiento propio + 0,7 s global.
//  · Todo daño = × el golpe máximo del arma (`maxHit()`); los estados salen de `status.js` (STS). Habilidad nueva = UNA FILA en `FAM[..].kit`.
//  · Durante el tutorial de la isla (`ISLA.lock()`) el sistema se apaga: la tecla 1 sigue siendo la bola de fuego celestial (`ABIL`/`selSkill` de game.js).
//  · Usa globales de game.js (S, P, M, EN, MN, L, PJ, HFX, STS…) SOLO en tiempo de llamada. Se carga justo antes de game.js.
// Campos de una habilidad: id, n, e (icono: slash arrow burst up shield bolt skull drop snow orb), lv, cd (s), c (Energía) o mp (fracción de maná),
//   coef (× golpe máx.), n2 (nº de golpes), aoe (radio px; con self = centrado en ti), sts [estado, ms, v] al objetivo, stun (ms), exec [umbral, coef],
//   drain (fracción curada), buf [estado propio, ms], col (color del proyectil), d (descripción).
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const CSK=(()=>{
const FAM={
 sword:{sk:'cb',n:'Espada',em:'⚔️',res:'EN',rng:90,col:'#e8cf94',kit:[
  {id:'sw_tajo',n:'Tajo',e:'slash',lv:1,cd:4,c:10,coef:.9,d:'Un tajo certero que nunca falla.'},
  {id:'sw_corte',n:'Corte sangrante',e:'drop',lv:8,cd:9,c:14,coef:.6,sts:['bleed',6000,1],d:'Hiere y provoca sangrado.'},
  {id:'sw_giro',n:'Torbellino',e:'burst',lv:18,cd:12,c:20,coef:.7,aoe:85,self:1,d:'Golpeas a todos los enemigos a tu alrededor.'},
  {id:'sw_grito',n:'Grito de guerra',e:'up',lv:30,cd:40,c:15,buf:['fury',15000],d:'Furia: +30 % de daño durante 15 s.'},
  {id:'sw_aturde',n:'Golpe aturdidor',e:'shield',lv:45,cd:18,c:24,coef:1.1,stun:1500,d:'Aturde al enemigo e interrumpe su ataque.'},
  {id:'sw_ejec',n:'Ejecución',e:'skull',lv:65,cd:25,c:28,coef:.7,exec:[.3,2.3],d:'Daño enorme si el enemigo tiene menos del 30 % de vida.'}]},
 bow:{sk:'ra',n:'Arco',em:'🏹',res:'EN',rng:260,col:'#bfe28a',kit:[
  {id:'bw_certero',n:'Disparo certero',e:'arrow',lv:1,cd:4,c:10,coef:.95,d:'Una flecha que nunca falla.'},
  {id:'bw_veneno',n:'Flecha envenenada',e:'drop',lv:8,cd:10,c:14,coef:.6,sts:['poison',8000,1],d:'Daña y envenena.'},
  {id:'bw_lluvia',n:'Lluvia de flechas',e:'burst',lv:18,cd:14,c:22,coef:.65,aoe:100,d:'Llueven flechas sobre el objetivo y los cercanos.'},
  {id:'bw_halcon',n:'Ojo de halcón',e:'up',lv:30,cd:40,c:15,buf:['fury',12000],d:'Furia: +30 % de daño durante 12 s.'},
  {id:'bw_escarcha',n:'Flecha de escarcha',e:'snow',lv:45,cd:16,c:20,coef:.85,sts:['chill',7000,1],d:'Daña y aplica Escarcha: ralentiza y acumula.'},
  {id:'bw_mortal',n:'Tiro mortal',e:'skull',lv:65,cd:30,c:30,coef:2.4,d:'El disparo más fuerte del arco.'}]},
 staff:{sk:'mg',n:'Báculo',em:'🔮',res:'MN',rng:260,col:'#c8a0ff',kit:[
  {id:'st_orbe',n:'Orbe arcano',e:'orb',lv:1,cd:4,mp:.10,coef:.9,col:'#c8a0ff',d:'Lanzas un orbe que nunca falla.'},
  {id:'st_escarcha',n:'Escarcha',e:'snow',lv:8,cd:9,mp:.13,coef:.65,sts:['chill',7000,1],col:'#9ad8ff',d:'Daña y aplica Escarcha: ralentiza y acumula.'},
  {id:'st_nova',n:'Nova',e:'burst',lv:18,cd:13,mp:.16,coef:.8,aoe:110,self:1,col:'#9ad8ff',d:'Una onda de energía a tu alrededor.'},
  {id:'st_barrera',n:'Barrera de maná',e:'shield',lv:30,cd:45,mp:.14,buf:['shield',12000],d:'Un escudo absorbe daño durante 12 s.'},
  {id:'st_rayo',n:'Rayo',e:'bolt',lv:45,cd:14,mp:.19,coef:1.4,sts:['shock',6000,1],col:'#fff2a0',d:'Un rayo potente que electriza.'},
  {id:'st_meteoro',n:'Meteoro',e:'burst',lv:65,cd:30,mp:.24,coef:2.05,aoe:85,col:'#ff6a3a',d:'Un meteoro cae sobre el objetivo y los cercanos.'}]},
 dagger:{sk:'cb',n:'Daga',em:'🗡️',res:'EN',rng:78,col:'#d8e4ee',kit:[
  {id:'dg_doble',n:'Puñalada doble',e:'slash',lv:1,cd:3.5,c:10,coef:.5,n2:2,d:'Dos puñaladas seguidas.'},
  {id:'dg_veneno',n:'Veneno de hoja',e:'drop',lv:8,cd:10,c:13,coef:.55,sts:['poison',8000,1],d:'Hiere y envenena.'},
  {id:'dg_danza',n:'Danza de dagas',e:'burst',lv:18,cd:12,c:22,coef:.35,n2:4,d:'Cuatro tajos veloces al mismo enemigo.'},
  {id:'dg_paso',n:'Paso ligero',e:'up',lv:30,cd:35,c:14,buf:['haste',8000],d:'Celeridad durante 8 s.'},
  {id:'dg_hemo',n:'Hemorragia',e:'drop',lv:45,cd:16,c:22,coef:.65,sts:['hemorrhage',7000,1],col:'#ff1a10',d:'Sangrado profundo, doble si el enemigo se mueve.'},
  {id:'dg_letal',n:'Estocada letal',e:'skull',lv:65,cd:25,c:28,coef:.8,exec:[.35,2.7],d:'Daño enorme si el enemigo tiene menos del 35 % de vida.'}]},
 great:{sk:'cb',n:'Mandoble',em:'⚔️',res:'EN',rng:106,col:'#e0b070',kit:[
  {id:'gr_pesado',n:'Golpe pesado',e:'slash',lv:1,cd:6,c:14,coef:1.2,d:'Un tajo lento y brutal.'},
  {id:'gr_quebrar',n:'Quebrar armadura',e:'shield',lv:8,cd:12,c:18,coef:.85,sts:['vuln',8000,1],d:'Hiere y deja al enemigo Vulnerable (recibe más daño).'},
  {id:'gr_barrido',n:'Barrido',e:'burst',lv:18,cd:14,c:22,coef:.9,aoe:105,self:1,d:'Un barrido que alcanza a todos a tu alrededor.'},
  {id:'gr_furia',n:'Furia',e:'up',lv:30,cd:40,c:16,buf:['fury',15000],d:'Furia: +30 % de daño durante 15 s.'},
  {id:'gr_embestida',n:'Embestida',e:'bolt',lv:45,cd:20,c:28,coef:1.3,stun:1800,d:'Embistes y aturdes al enemigo.'},
  {id:'gr_decap',n:'Decapitar',e:'skull',lv:65,cd:30,c:32,coef:.9,exec:[.25,3],d:'Daño devastador si el enemigo tiene menos del 25 % de vida.'}]},
 fist:{sk:'cb',n:'Puños',em:'👊',res:'EN',rng:72,col:'#f0c8a0',kit:[
  {id:'fs_jab',n:'Jab',e:'slash',lv:1,cd:3,c:8,coef:.8,d:'Un golpe directo y rápido.'},
  {id:'fs_patada',n:'Patada baja',e:'snow',lv:8,cd:9,c:12,coef:.6,sts:['slow',6000,1],d:'Ralentiza al enemigo.'},
  {id:'fs_rafaga',n:'Ráfaga',e:'burst',lv:18,cd:11,c:18,coef:.3,n2:4,d:'Cuatro golpes en una ráfaga.'},
  {id:'fs_meditar',n:'Meditar',e:'up',lv:30,cd:35,c:14,buf:['regen',10000],d:'Regeneración durante 10 s.'},
  {id:'fs_palma',n:'Palma',e:'shield',lv:45,cd:16,c:22,coef:.9,stun:1500,d:'Aturde al enemigo.'},
  {id:'fs_dragon',n:'Golpe del dragón',e:'bolt',lv:65,cd:25,c:30,coef:2.4,d:'Tu golpe más fuerte.'}]},
 xbow:{sk:'ra',n:'Ballesta',em:'🏹',res:'EN',rng:270,col:'#d8c090',kit:[
  {id:'xb_certero',n:'Virote certero',e:'arrow',lv:1,cd:5,c:12,coef:1.1,d:'Un virote que nunca falla.'},
  {id:'xb_perf',n:'Virote perforante',e:'arrow',lv:8,cd:11,c:16,coef:.9,sts:['exposed',8000,1],d:'Perfora la defensa: el enemigo queda Expuesto.'},
  {id:'xb_anclaje',n:'Anclaje',e:'snow',lv:18,cd:14,c:18,coef:.6,sts:['root',3000,1],d:'Clava al enemigo al suelo: no puede moverse 3 s.'},
  {id:'xb_recarga',n:'Recarga rápida',e:'up',lv:30,cd:35,c:14,buf:['haste',8000],d:'Celeridad durante 8 s.'},
  {id:'xb_salva',n:'Salva',e:'burst',lv:45,cd:18,c:26,coef:.7,n2:3,d:'Tres virotes en ráfaga.'},
  {id:'xb_franco',n:'Disparo del francotirador',e:'skull',lv:65,cd:30,c:34,coef:2.75,d:'El disparo más potente de la ballesta.'}]},
 scepter:{sk:'mg',n:'Cetro',em:'🔮',res:'MN',rng:260,col:'#b070d8',kit:[
  {id:'sc_drenar',n:'Drenar vida',e:'drop',lv:1,cd:5,mp:.10,coef:.85,drain:.5,col:'#d04a6a',d:'Daña al enemigo y te curas la mitad del daño.'},
  {id:'sc_marchitar',n:'Marchitar',e:'snow',lv:8,cd:10,mp:.13,coef:.6,sts:['curse',8000,1],col:'#9a48ff',d:'Maldición: el enemigo hace menos daño.'},
  {id:'sc_nube',n:'Nube tóxica',e:'burst',lv:18,cd:13,mp:.16,coef:.6,aoe:110,self:1,sts:['poison',8000,1],col:'#6ad04a',d:'Una nube envenena a todos a tu alrededor.'},
  {id:'sc_muro',n:'Muro de sombras',e:'shield',lv:30,cd:45,mp:.14,buf:['shield',12000],d:'Un escudo absorbe daño durante 12 s.'},
  {id:'sc_almas',n:'Cadena de almas',e:'burst',lv:45,cd:15,mp:.19,coef:1.1,aoe:130,col:'#c070ff',d:'Arrancas almas del objetivo y los cercanos.'},
  {id:'sc_condena',n:'Condena',e:'skull',lv:65,cd:30,mp:.24,coef:1.8,sts:['doom',8000,1],col:'#7a2a9a',d:'Condena al enemigo: estalla al terminar.'}]}};

/* ESPECIALIZACIONES («Caminos»): una por skill a nivel 30. Añaden 3 habilidades (30/50/75), una regla de identidad (hooks out/inMul/onHit) y una piedra clave a nivel 60 (elegir 1 de 2).
   Solo valen con las armas de `fam`. Datos; la lógica de cada `id` está en `out`, `inMul` y `onHit`. */
const SP={
 guardian:{sk:'cb',fam:['sword'],n:'Guardián',em:'🛡️',idn:'Recibes un 12 % menos de daño (20 % con escudo). Al bloquear mitigas un 10 % más y reflejas parte del golpe al atacante.',
  key:[{n:'Fortaleza',d:'Recibes un 8 % menos de daño adicional. El daño reflejado al bloquear se duplica.'},{n:'Represalia',d:'+20 % de daño durante 4 s tras recibir un golpe.'}],
  kit:[{id:'gd_provocar',n:'Provocar',e:'up',lv:30,cd:30,c:16,aoe:160,self:1,sts:['weak',8000,1],d:'Los enemigos cercanos quedan Debilitados: hacen menos daño.'},
   {id:'gd_escudo',n:'Embestida de escudo',e:'shield',lv:50,cd:18,c:24,coef:.95,stun:2000,d:'Embistes con el escudo y aturdes al enemigo.'},
   {id:'gd_muro',n:'Muro inamovible',e:'shield',lv:75,cd:60,c:25,buf:['unbreak',8000],d:'Inquebrantable: inmune a aturdimientos y raíces durante 8 s.'}]},
 asesino:{sk:'cb',fam:['dagger'],n:'Asesino',em:'🗡️',idn:'Los enemigos que aún no te han visto reciben ×1,8 de daño.',
  key:[{n:'Sombra',d:'El daño a enemigos desprevenidos sube a ×2,4.'},{n:'Hemorragia en cadena',d:'Cada golpe tiene un 20 % de provocar Sangrado.'}],
  kit:[{id:'as_marca',n:'Marca de muerte',e:'skull',lv:30,cd:14,c:14,coef:.5,sts:['vuln',8000,1],d:'Marca al enemigo: recibe más daño.'},
   {id:'as_sombra',n:'Paso sombrío',e:'up',lv:50,cd:14,c:22,coef:.95,n2:2,buf:['haste',4000],d:'Te lanzas sobre el enemigo, golpeas dos veces y ganas Celeridad.'},
   {id:'as_sombrio',n:'Tajo de sombra',e:'skull',lv:75,cd:30,c:30,coef:.6,exec:[.4,3.6],d:'Daño enorme si el enemigo tiene menos del 40 % de vida.'}]},
 verdugo:{sk:'cb',fam:['great'],n:'Verdugo',em:'⚔️',idn:'+40 % de daño a enemigos con menos del 30 % de vida; +15 % si tu vida está por debajo del 50 %.',
  key:[{n:'Sed de sangre',d:'El umbral de remate sube al 40 %.'},{n:'Furia creciente',d:'Con poca vida el bonus sube a +30 %.'}],
  kit:[{id:'vd_rugido',n:'Rugido',e:'burst',lv:30,cd:30,c:18,aoe:150,self:1,sts:['fear',3000,1],d:'Los enemigos cercanos huyen aterrados.'},
   {id:'vd_quebrantar',n:'Quebrantar',e:'slash',lv:50,cd:16,c:26,coef:1.1,sts:['rend',8000,1],d:'Desgarra al enemigo: sangra y recibe más daño.'},
   {id:'vd_guillotina',n:'Guillotina',e:'skull',lv:75,cd:40,c:36,coef:.7,exec:[.4,3.9],d:'Un golpe devastador contra enemigos con menos del 40 % de vida.'}]},
 monje:{sk:'cb',fam:['fist'],n:'Monje',em:'👊',idn:'Cada golpe sin recibir daño suma una racha (hasta 5): +4 % de daño por punto.',
  key:[{n:'Ritmo',d:'La racha llega hasta 8.'},{n:'Piel de piedra',d:'Recibes un 10 % menos de daño.'}],
  kit:[{id:'mj_tigre',n:'Postura del tigre',e:'up',lv:30,cd:35,c:14,buf:['haste',10000],d:'Celeridad durante 10 s.'},
   {id:'mj_trueno',n:'Palma de trueno',e:'bolt',lv:50,cd:15,c:24,coef:1.1,sts:['shock',6000,1],d:'Un golpe eléctrico que electriza.'},
   {id:'mj_mil',n:'Mil puños',e:'burst',lv:75,cd:30,c:34,coef:.25,n2:8,d:'Ocho golpes en una ráfaga.'}]},
 cazador:{sk:'ra',fam:['bow'],n:'Cazador',em:'🏹',idn:'Cada flecha sobre la misma presa suma +5 % de daño (hasta 5).',
  key:[{n:'Cacería',d:'La acumulación llega hasta 8.'},{n:'Presa marcada',d:'Al cambiar de objetivo, la primera flecha lo Marca.'}],
  kit:[{id:'cz_marca',n:'Marca de presa',e:'arrow',lv:30,cd:12,c:12,coef:.6,sts:['mark',10000,1],d:'Marca a la presa: recibe más daño a distancia.'},
   {id:'cz_agil',n:'Disparo ágil',e:'up',lv:50,cd:14,c:18,coef:.7,buf:['haste',4000],d:'Disparas y ganas Celeridad.'},
   {id:'cz_lluvia',n:'Lluvia mortal',e:'burst',lv:75,cd:28,c:30,coef:.8,n2:2,aoe:130,d:'Dos oleadas de flechas sobre el objetivo y los cercanos.'}]},
 franco:{sk:'ra',fam:['xbow'],n:'Francotirador',em:'🎯',idn:'+25 % de daño a más de 180 px; el primer disparo tras quedarte quieto 1 s hace +30 %.',
  key:[{n:'Pulso firme',d:'El disparo tras quedarte quieto hace +50 %.'},{n:'Rango extremo',d:'A más de 240 px el bonus sube a +50 %.'}],
  kit:[{id:'fr_gracia',n:'Bala de gracia',e:'skull',lv:30,cd:18,c:20,coef:1.55,d:'Un disparo potente.'},
   {id:'fr_debil',n:'Tiro debilitante',e:'snow',lv:50,cd:16,c:20,coef:.9,sts:['weak',8000,1],d:'El enemigo queda Debilitado: hace menos daño.'},
   {id:'fr_aguila',n:'Ojo de águila',e:'arrow',lv:75,cd:40,c:40,coef:3.1,d:'Tu mejor disparo.'}]},
 piro:{sk:'mg',fam:['staff'],n:'Piromante',em:'🔥',idn:'Tus golpes tienen un 25 % de provocar Quemadura.',
  key:[{n:'Combustión',d:'La probabilidad de Quemadura sube al 45 %.'},{n:'Calor',d:'+20 % de daño a enemigos que arden.'}],
  kit:[{id:'pi_bola',n:'Bola de fuego',e:'orb',lv:30,cd:8,mp:.14,coef:1.15,sts:['burn',6000,1],col:'#ff8a2a',d:'Una bola de fuego que quema.'},
   {id:'pi_muro',n:'Muro de llamas',e:'burst',lv:50,cd:16,mp:.19,coef:.7,aoe:100,self:1,sts:['burn',6000,1],col:'#ff6a2a',d:'Llamas a tu alrededor que queman a todos.'},
   {id:'pi_incinerar',n:'Incinerar',e:'skull',lv:75,cd:28,mp:.24,coef:1.8,sts:['incinerate',8000,1],col:'#e8202e',d:'Un fuego voraz que salta al morir el enemigo.'}]},
 crio:{sk:'mg',fam:['staff'],n:'Criomante',em:'❄️',idn:'Tus golpes tienen un 25 % de aplicar Escarcha; ×1,3 de daño a enemigos helados.',
  key:[{n:'Escarcha profunda',d:'La probabilidad de Escarcha sube al 45 %.'},{n:'Quebrar hielo',d:'El bonus contra helados sube a ×1,45.'}],
  kit:[{id:'cr_lanza',n:'Lanza de hielo',e:'snow',lv:30,cd:8,mp:.14,coef:1.15,sts:['chill',7000,1],col:'#9ad8ff',d:'Una lanza helada que aplica Escarcha.'},
   {id:'cr_ventisca',n:'Ventisca',e:'burst',lv:50,cd:16,mp:.19,coef:.7,aoe:130,self:1,sts:['chill',7000,1],col:'#bfe8ff',d:'Una ventisca que enfría a todos a tu alrededor.'},
   {id:'cr_prision',n:'Prisión de hielo',e:'snow',lv:75,cd:28,mp:.24,coef:.9,sts:['freeze',3500,1],col:'#9ad8ff',d:'Congela al enemigo: inmóvil, y el siguiente golpe es crítico.'}]},
 tempestad:{sk:'mg',fam:['staff'],n:'Tempestad',em:'⚡',idn:'Tus golpes tienen un 25 % de saltar a otro enemigo cercano (50 % del daño) y electrizarlo.',
  key:[{n:'Cadena larga',d:'La probabilidad sube al 45 % y alcanza más lejos.'},{n:'Sobrecarga',d:'El salto hace el 75 % del daño.'}],
  kit:[{id:'tm_relampago',n:'Relámpago encadenado',e:'bolt',lv:30,cd:9,mp:.14,coef:.95,aoe:120,sts:['shock',6000,1],col:'#fff2a0',d:'Un relámpago que salta entre los enemigos cercanos.'},
   {id:'tm_descarga',n:'Descarga',e:'bolt',lv:50,cd:16,mp:.19,coef:1.45,sts:['overload',6000,1],col:'#fff2a0',d:'Una descarga que sobrecarga al enemigo.'},
   {id:'tm_tormenta',n:'Tormenta',e:'burst',lv:75,cd:28,mp:.24,coef:1.45,aoe:160,self:1,sts:['shock',6000,1],col:'#7ab0ff',d:'Una tormenta eléctrica a tu alrededor.'}]},
 oscura:{sk:'mg',fam:['scepter'],n:'Magia oscura',em:'🌑',idn:'Tus golpes tienen un 25 % de Maldecir; ×1,25 de daño a enemigos maldecidos.',
  key:[{n:'Maldición profunda',d:'La probabilidad de Maldecir sube al 50 %.'},{n:'Cosecha',d:'Recuperas el 6 % del daño que haces.'}],
  kit:[{id:'os_toque',n:'Toque fúnebre',e:'drop',lv:30,cd:8,mp:.14,coef:.95,sts:['weak',8000,1],col:'#9a48ff',d:'Debilita al enemigo.'},
   {id:'os_cosecha',n:'Cosecha de almas',e:'burst',lv:50,cd:16,mp:.19,coef:.85,aoe:140,col:'#c070ff',d:'Arrancas almas a todos los enemigos cercanos al objetivo.'},
   {id:'os_abismo',n:'Abismo',e:'skull',lv:75,cd:28,mp:.24,coef:1.55,aoe:150,self:1,sts:['doom',8000,1],col:'#5a1a7a',d:'El abismo condena a todos a tu alrededor.'}]}};
Object.keys(SP).forEach(k=>SP[k].id=k);
/* Técnicas exclusivas (lote MAESTRIA-ARMAS): ahora son nodos de los árboles de New World (TRD). `f.sk` = SOLO tipo de daño (cb cuerpo a cuerpo · ra distancia · mg magia). */
const EXC={
 sword:[{id:'sw_x_contra',n:'Contraataque',e:'shield',lv:40,cd:14,c:18,coef:1.4,stun:800,d:'Un golpe seco que aturde un instante y abre la guardia.'},
  {id:'sw_x_hoja',n:'Hoja danzante',e:'slash',lv:40,cd:16,c:22,coef:.55,n2:4,d:'Cuatro tajos encadenados a toda velocidad.'}],
 dagger:[{id:'dg_x_humo',n:'Bomba de humo',e:'burst',lv:40,cd:30,c:20,aoe:120,self:1,sts:['fear',3000,1],d:'Una nube de humo: los enemigos cercanos huyen aterrados.'},
  {id:'dg_x_mil',n:'Mil cortes',e:'drop',lv:40,cd:18,c:24,coef:.35,n2:6,sts:['bleed',6000,1],d:'Seis cortes rapidísimos que dejan sangrando.'}],
 great:[{id:'gr_x_terremoto',n:'Terremoto',e:'burst',lv:40,cd:22,c:28,coef:.9,aoe:110,self:1,stun:1000,d:'Hundes el mandoble en el suelo: daña y aturde a todos a tu alrededor.'},
  {id:'gr_x_titan',n:'Tajo del titán',e:'skull',lv:40,cd:20,c:30,coef:2.4,d:'Un único tajo descomunal.'}],
 fist:[{id:'fs_x_ciclon',n:'Patada ciclón',e:'burst',lv:40,cd:14,c:20,coef:.8,aoe:90,self:1,d:'Giras con una patada que golpea a todos a tu alrededor.'},
  {id:'fs_x_chakra',n:'Chakra',e:'up',lv:40,cd:40,c:15,buf:['regen',8000],d:'Concentras tu energía: regeneras vida durante 8 s.'}],
 bow:[{id:'bw_x_triple',n:'Disparo triple',e:'arrow',lv:40,cd:12,c:20,coef:.7,n2:3,d:'Tres flechas seguidas al mismo objetivo.'},
  {id:'bw_x_red',n:'Flecha de red',e:'snow',lv:40,cd:16,c:16,coef:.5,sts:['root',3000,1],d:'Una red enreda al enemigo: no se puede mover.'}],
 xbow:[{id:'xb_x_explosivo',n:'Virote explosivo',e:'burst',lv:40,cd:18,c:26,coef:1.2,aoe:90,sts:['burn',4000,1],d:'Estalla al impactar y quema a los que están cerca.'},
  {id:'xb_x_arpon',n:'Arpón',e:'arrow',lv:40,cd:16,c:20,coef:1,stun:600,sts:['slow',4000,1],d:'Un arpón que frena y aturde un instante.'}],
 staff:[{id:'st_x_singular',n:'Singularidad',e:'orb',lv:40,cd:24,mp:.2,coef:.8,aoe:140,self:1,sts:['slow',4000,1],col:'#a070ff',d:'Un vórtice que daña y ralentiza a todos a tu alrededor.'},
  {id:'st_x_eco',n:'Eco arcano',e:'orb',lv:40,cd:10,mp:.14,coef:.6,n2:3,col:'#c8a0ff',d:'Tres orbes que se persiguen hasta el objetivo.'}],
 scepter:[{id:'sc_x_pacto',n:'Pacto de sangre',e:'drop',lv:40,cd:18,mp:.16,coef:1.3,drain:.5,col:'#c03050',d:'Golpe oscuro que te cura la mitad del daño.'},
  {id:'sc_x_plaga',n:'Plaga',e:'burst',lv:40,cd:22,mp:.2,coef:.4,aoe:130,self:1,sts:['poison',8000,1],col:'#7ac040',d:'Envenenas a todos los enemigos cercanos.'}]};
const MSN={sword:'de la Espada',dagger:'de la Daga',great:'del Mandoble',fist:'de los Puños',bow:'del Arco',xbow:'de la Ballesta',staff:'del Báculo',scepter:'del Cetro'};
/* ÁRBOLES DE MAESTRÍA ESTILO NEW WORLD (lote MAESTRIA-NW, 2 nov 2026; el dueño: «un sistema parecido al de New World respecto a las habilidades de las armas, que permita aprender las que quieras»;
   sustituye a los hitos 20/40/60/80 de MAESTRIA-ARMAS; docs/PLAN_HABILIDADES.md §0).
   · Cada arma tiene DOS árboles (`TR[fid]`): habilidades activas (círculos), pasivas (rombos) y una ÚLTIMA al fondo; las dos de al lado de la última son una elección (1 de 2).
   · PUNTOS: 1 + 1 cada 4 niveles de maestría (máx. 25 a nivel 96); cada nodo cuesta 1. Un árbol entero tiene 14–15 nodos: no se pueden completar los dos.
   · FILAS: la fila r pide 2·r puntos gastados EN ESE ÁRBOL; la última fila pide 8 y los dos nodos de elección piden la última.
   · CASILLAS: 4 habilidades activas equipadas por arma (teclas 1–4). Reiniciar los puntos de un arma: gratis hasta maestría 10, luego 15 monedas por nivel.
   · La ÚLTIMA de los árboles con Camino (`sp`) activa su regla de identidad (`spec`) y los nodos de elección son sus piedras clave (`keyOn`); en los demás árboles son pasivas grandes.
   · PASIVAS (`pas(clave)` suma lo aprendido del arma equipada): dmgS (+% daño de habilidades) · dmgB (+% todo el daño) · cd (−% enfriamiento) · en (+% regeneración de energía/maná) ·
     dr (−% daño recibido) · ls (cura % del daño hecho) · stsD (+% duración de estados) · exec (+% daño a enemigos con < 35 % de vida).
   · Maestro (99): todas las habilidades del arma al dominio IV. El Camino Tempestad (báculo) y las técnicas Singularidad/Eco quedan sin árbol (datos conservados). */
const PA={dmgS:['Técnica','+6 % de daño de las habilidades.',{dmgS:.06}],cd:['Ritmo','−8 % de enfriamiento de las habilidades.',{cd:.08}],dmgB:['Golpe firme','+5 % de todo el daño con esta arma.',{dmgB:.05}],
 sts:['Persistencia','+20 % de duración de los estados que aplicas.',{stsD:.2}],exec:['Remate','+10 % de daño a enemigos con menos del 35 % de vida.',{exec:.1}],
 dr:['Determinación','Recibes un 5 % menos de daño.',{dr:.05}],en:['Aliento','+20 % de regeneración de energía o maná.',{en:.2}],ls:['Sed','Te curas el 2 % del daño que haces.',{ls:.02}],cd2:['Concentración','−8 % de enfriamiento de las habilidades.',{cd:.08}]};
const PASA=['dmgS','cd','dmgB','sts','exec'],PASB=['dr','en','ls','sts','cd2'];
const UA={sword:['Filo maestro','+12 % de daño de habilidades y +15 % a enemigos con menos del 35 % de vida.',{dmgS:.12,exec:.15}],dagger:['Mil heridas','+8 % de todo el daño y te curas el 3 % del daño.',{dmgB:.08,ls:.03}],
 great:['Peso del acero','+10 % de todo el daño y recibes un 6 % menos.',{dmgB:.1,dr:.06}],fist:['Puño de hierro','+8 % de todo el daño y −10 % de enfriamiento.',{dmgB:.08,cd:.1}],
 bow:['Vista de águila','+12 % de daño de habilidades y +30 % de duración de estados.',{dmgS:.12,stsD:.3}],xbow:['Calibre pesado','+10 % de todo el daño y +15 % de daño de habilidades.',{dmgB:.1,dmgS:.15}],
 scepter:['Pacto eterno','Te curas el 4 % del daño y +10 % de daño de habilidades.',{ls:.04,dmgS:.1}]};
const KA2=[['Furia','+10 % de daño de las habilidades.',{dmgS:.1}],['Celeridad','−12 % de enfriamiento de las habilidades.',{cd:.12}]];
const TRD={
 sword:[{n:'Maestro de armas',em:'⚔️',act:['sw_tajo','sw_corte','sw_giro','sw_ejec','sw_x_hoja']},{n:'Guardián',em:'🛡️',sp:'guardian',act:['sw_grito','sw_aturde','gd_provocar','gd_escudo','gd_muro','sw_x_contra']}],
 dagger:[{n:'Duelista',em:'🗡️',act:['dg_doble','dg_veneno','dg_danza','dg_hemo','dg_x_mil']},{n:'Asesino',em:'🌑',sp:'asesino',act:['dg_paso','dg_letal','as_marca','as_sombra','as_sombrio','dg_x_humo']}],
 great:[{n:'Destructor',em:'⚔️',act:['gr_pesado','gr_quebrar','gr_barrido','gr_embestida','gr_x_terremoto']},{n:'Verdugo',em:'💀',sp:'verdugo',act:['gr_furia','gr_decap','vd_rugido','vd_quebrantar','vd_guillotina','gr_x_titan']}],
 fist:[{n:'Púgil',em:'👊',act:['fs_jab','fs_patada','fs_rafaga','fs_palma','fs_x_ciclon']},{n:'Monje',em:'🧘',sp:'monje',act:['fs_meditar','fs_dragon','mj_tigre','mj_trueno','mj_mil','fs_x_chakra']}],
 bow:[{n:'Arquero',em:'🏹',act:['bw_certero','bw_veneno','bw_lluvia','bw_escarcha','bw_x_red']},{n:'Cazador',em:'🦌',sp:'cazador',act:['bw_halcon','bw_mortal','cz_marca','cz_agil','cz_lluvia','bw_x_triple']}],
 xbow:[{n:'Tirador',em:'🎯',act:['xb_certero','xb_perf','xb_anclaje','xb_salva','xb_x_explosivo']},{n:'Francotirador',em:'🔭',sp:'franco',act:['xb_recarga','xb_franco','fr_gracia','fr_debil','fr_aguila','xb_x_arpon']}],
 staff:[{n:'Escarcha',em:'❄️',sp:'crio',act:['st_orbe','st_escarcha','st_barrera','cr_lanza','cr_ventisca','cr_prision']},{n:'Fuego',em:'🔥',sp:'piro',act:['st_nova','st_rayo','st_meteoro','pi_bola','pi_muro','pi_incinerar']}],
 scepter:[{n:'Nigromante',em:'☠️',act:['sc_drenar','sc_marchitar','sc_nube','sc_almas','sc_x_pacto']},{n:'Sombra',em:'🌑',sp:'oscura',act:['sc_muro','sc_condena','os_toque','os_cosecha','os_abismo','sc_x_plaga']}]};
const SLOTS=4;
const ABX0={};Object.values(FAM).forEach(f=>f.kit.forEach(a=>ABX0[a.id]=a));Object.values(SP).forEach(q=>q.kit.forEach(a=>ABX0[a.id]=a));Object.values(EXC).forEach(L2=>L2.forEach(a=>ABX0[a.id]=a));
/* construye los nodos: rejilla de 3 columnas, filas [a p a] / [p a p] … y la última fila [elección · ÚLTIMA · elección] */
const TR={},NODE={};
Object.entries(TRD).forEach(([fid,T2])=>{TR[fid]=T2.map((t,ti)=>{const acts=t.act.map(id=>ABX0[id]).filter(Boolean).sort((a,b)=>a.lv-b.lv),pk=ti?PASB:PASA,pas=pk.map((k,i)=>({id:'p:'+fid+ti+i,ty:'p',n:PA[k][0],d:PA[k][1],e:PA[k][2]}));
  const rows=[];let ai=0,pi=0;const pat=[['a','p','a'],['p','a','p'],['a','p','a'],['p','a','p']];
  for(let r=0;r<4;r++){const row=pat[r].map(c=>{let x=null;if(c==='a'&&ai<acts.length)x={id:acts[ai++].id,ty:'a'};else if(c==='p'&&pi<pas.length)x=pas[pi++];else if(ai<acts.length)x={id:acts[ai++].id,ty:'a'};else if(pi<pas.length)x=pas[pi++];return x});rows.push(row)}
  const sp=t.sp&&SP[t.sp],u=sp?{id:'u:'+fid+ti,ty:'u',n:sp.n,d:sp.idn,sp:sp.id}:{id:'u:'+fid+ti,ty:'u',n:UA[fid][0],d:UA[fid][1],e:UA[fid][2]},
   k=[0,1].map(i=>sp?{id:'k:'+fid+ti+i,ty:'k',n:sp.key[i].n,d:sp.key[i].d,ki:i+1,sp:sp.id}:{id:'k:'+fid+ti+i,ty:'k',n:KA2[i][0],d:KA2[i][1],e:KA2[i][2],ki:i+1});
  rows.push([k[0],u,k[1]]);rows.forEach((row,r)=>row.forEach((x,c)=>{if(x){x.r=r;x.c=c;x.t=ti;x.f=fid;NODE[x.id]=x}}));return{n:t.n,em:t.em,sp:t.sp||null,rows}})});
const ID2F={};Object.entries(TRD).forEach(([fid,T2])=>T2.forEach(t=>t.act.forEach(id=>ID2F[id]=fid)));
const MLV=fid=>typeof ML==='function'?ML(fid):1;
const PTS=fid=>Math.min(25,1+Math.floor(MLV(fid)/4));
/* Armas sin kit propio (ya todas tienen): vacío, queda por si se añade una familia nueva. */
const ALIAS={};
const RK=[20,80,240,600],GCD=700,ENR=1.5,MR=.015,UPLIFT=.3;   /* UPLIFT = DPS extra que se supone con uso MEDIO de las habilidades (la rotación perfecta da ~+55 %); lo usa tools/meas_progresion.py y compensa `HPK` (vida de los enemigos, game.js) */   /* ENR = Energía/s; MR = fracción del maná máx. que regenera por s con un kit de magia (equilibrado por simulación, ver PLAN_HABILIDADES.md §5) */
let cd={},gcd=0,Q=[],lastSig='';const U={};   // U: instante de la última pulsación (destello de la casilla)
const st=()=>{const o=S.csk||(S.csk={});o.use=o.use||{};o.tr=o.tr||{};o.bar=o.bar||{};return o};
const rank=id=>{if(ID2F[id]&&MLV(ID2F[id])>=99)return 4;const u=st().use[id]||0;let r=0;RK.forEach(t=>{if(u>=t)r++});return r};   /* Maestro (99): dominio IV en todo */
const wf=()=>{const k=(typeof wKind==='function'?wKind():null)||'fist';return ALIAS[k]||k};
const fam=()=>FAM[wf()]||null;
const locked=()=>typeof ISLA!=='undefined'&&ISLA.lock&&ISLA.lock();
/* ¿está el sistema activo? (hay kit para el arma, no estamos en el tutorial ni dentro de una casa) */
const active=()=>!!fam()&&!locked();
const T={n:0,m:null,st:0,hurt:-1e9,still:0,px:0,py:0};   // seguidores de las reglas de identidad
const FID=fid=>fid||wf();
/* ── ÁRBOLES: aprendido, gastado, disponible ── */
const lrn=fid=>{const o=st().tr;return o[fid]||(o[fid]={})};
const has=(fid,id)=>!!lrn(FID(fid))[id];
const spent=(fid,t)=>Object.keys(lrn(fid)).filter(id=>NODE[id]&&(t==null||NODE[id].t===t)).length;
const ptsFree=fid=>Math.max(0,PTS(fid)-spent(fid));
const rowNeed=r=>r>=4?8:2*r;
function canLearn(fid,id){const x=NODE[id];if(!x||x.f!==fid||has(fid,id))return false;if(ptsFree(fid)<1)return false;if(spent(fid,x.t)<rowNeed(x.r))return false;
 if(x.ty==='k'){const u='u:'+fid+x.t;if(!has(fid,u))return false;const o='k:'+fid+x.t+(x.ki===1?1:0);if(has(fid,o))return false}return true}
function learn(fid,id){if(!canLearn(fid,id))return false;lrn(fid)[id]=1;const x=NODE[id];if(x.ty==='a'){const b=barIds(fid);const j=b.indexOf(null);if(j>=0){b[j]=id;st().bar[fid]=b}}
 try{snd('quest')}catch(e){}dirty=1;save();return true}
function resetCost(fid){return MLV(fid)<=10?0:15*MLV(fid)}
function resetTree(fid){const c=resetCost(fid);if(c&&S.coins<c){toast('Necesitas '+money(c)+' para reiniciar los puntos.',2400);return}if(c){S.coins-=c;try{snd('coin')}catch(e){}}
 st().tr[fid]={};st().bar[fid]=[];toast('Puntos de '+FAM[fid].n+' reiniciados.',2200);dirty=1;save()}
/* identidad del Camino = la ÚLTIMA aprendida de un árbol con `sp`; piedra clave = nodo de elección aprendido */
const spec=(sk,fid)=>{fid=FID(fid);const f=FAM[fid];if(!f||(sk&&sk!==f.sk))return null;const T2=TR[fid]||[];for(let t=0;t<T2.length;t++){if(T2[t].sp&&has(fid,'u:'+fid+t))return SP[T2[t].sp]}return null};
const keyOn=fid=>{fid=FID(fid);const T2=TR[fid]||[];for(let t=0;t<T2.length;t++){if(!T2[t].sp||!has(fid,'u:'+fid+t))continue;if(has(fid,'k:'+fid+t+'0'))return 1;if(has(fid,'k:'+fid+t+'1'))return 2}return 0};
/* pasivas aprendidas del arma equipada (caché por fotograma) */
let PC={k:'',v:{}};
function pas(key){const fid=wf(),L2=lrn(fid),sig=fid+':'+Object.keys(L2).length;if(PC.k!==sig){const v={};Object.keys(L2).forEach(id=>{const x=NODE[id];if(x&&x.e)for(const k in x.e)v[k]=(v[k]||0)+x.e[k]});PC={k:sig,v}}return PC.v[key]||0}
const avail=fid=>{fid=FID(fid);return Object.keys(lrn(fid)).filter(id=>NODE[id]&&NODE[id].ty==='a'&&ABX0[id]).map(id=>ABX0[id])};
const barIds=fid=>{fid=FID(fid);const b=(st().bar[fid])||[],ids=avail(fid).map(a=>a.id),o=[];for(let i=0;i<SLOTS;i++){const id=b[i];o[i]=id&&ids.includes(id)&&!o.includes(id)?id:null}return o};
const bar=fid=>{const by={};avail(fid).forEach(a=>by[a.id]=a);return barIds(fid).map(id=>id?by[id]:null)};
const list=()=>bar().filter(Boolean);
const costOf=a=>a.mp?Math.max(1,Math.ceil(mnMax()*a.mp)):a.c;
const cdOf=a=>a.cd*(1-.04*rank(a.id))*Math.max(.5,1-pas('cd'));
/* aviso al subir maestría: punto nuevo (letrero único) */
function onMastery(fid,o,n){const f=FAM[fid];if(!f)return;const p0=Math.min(25,1+Math.floor(o/4)),p1=PTS(fid);
 try{if(p1>p0&&typeof RECN!=='undefined'&&RECN.unlock)RECN.unlock({title:'Maestría '+n,sub:f.n,items:[{em:f.em,name:'+'+(p1-p0)+' punto de maestría'}],foot:'Pestaña Habilidades (Z)'});else if(typeof fText==='function')fText(f.em+' Maestría '+n,'#e8cf94',P.x,P.y,40)}catch(e){}
 if(typeof log==='function')log('<span style="color:#e8cf94">'+f.em+' Maestría '+MSN[fid]+': nivel '+n+'</span>')}
/* primer punto: si el arma no tiene nada aprendido, se aprende sola la primera habilidad del primer árbol (así siempre hay algo en la barra) */
function unlockCheck(){const fid=wf();if(!FAM[fid]||locked()||!TR[fid])return;if(spent(fid)===0&&ptsFree(fid)>0){const x=TR[fid][0].rows[0].find(q=>q&&q.ty==='a');if(x&&learn(fid,x.id))toast(FAM[fid].em+' Aprendes <b>'+ABX0[x.id].n+'</b>. Más en la pestaña Habilidades (Z).',3200)}}
/* ═══ FX DE HABILIDADES (2 nov 2026, fase N0.4 · lotes N0-FX y N0-FX-SHADERS) — TODO POR ARQUETIPO Y ELEMENTO; una habilidad nueva hereda su FX de sus datos.
   · SHADERS PROPIOS (`R3D.skill`, src/r3d/skillfx3d.js, 1 programa y 1 llamada): cuerpo a cuerpo = TAJO (media luna que barre, una por golpe, alternando lado; grande en golpes fuertes);
     área centrada en ti = REMOLINO (cuerpo a cuerpo) u ORBE (magia); a distancia = ESTELA hasta el objetivo (una por flecha/virote/orbe); mejora propia = COLUMNA de energía;
     ejecutar = HENDIDURA vertical sobre el objetivo; al impactar, aturdir/aplastante = GRIETAS en el suelo y magia fuerte = ORBE. Magia de fuego potente: además, bola de fuego.
   · IMPACTO: estallido del ELEMENTO sobre el objetivo (`R3D.impact.burst`, recetas de encantamiento). Elemento (`elemOf`) = el del estado que aplica (ELEM); si no:
     robo de vida → vampírica, aturdir → aplastante, ejecutar → implacable, magia → arcana, resto → físico.
   · SONIDO: diseño procedural por capas (`SFXS`, src/sfxsynth.js: reverberación, ruido filtrado, cuerda física, campanas FM…); `SKS` = sonido por elemento, `BUFS` por mejora;
     si `SFXS` no suena (silencio, demasiadas voces) cae al `SND.en` antiguo. Para un FX propio de una habilidad, su id en `FXID` (sobrescribe el elemento). */
const ELEM={bleed:'sangre',hemorrhage:'hemorragica',poison:'veneno',toxin:'toxica',chill:'escarcha',slow:'escarcha',freeze:'glacial',shock:'rayo',overload:'tempestad',burn:'fuego',incinerate:'infernal',curse:'vacio',weak:'vacio',fear:'vacio',doom:'abisal',vuln:'aplastante',root:'aplastante',exposed:'fisico',rend:'implacable',mark:'cazadora'},
 BUFE={fury:'fuego',shield:'arcana',haste:'rayo',regen:'sagrada',unbreak:'aplastante'},
 SNDE={sangre:'sangre',hemorragica:'sangre',vampirica:'sangre',veneno:'veneno',toxica:'veneno',escarcha:'escarcha',glacial:'escarcha',rayo:'rayo',tempestad:'rayo',fuego:'fuego',infernal:'fuego',vacio:'vacio',abisal:'vacio',sagrada:'sagrada',arcana:'arcana'},
 FXID={};
const elemOf=(a,f)=>FXID[a.id]||(a.drain?'vampirica':a.sts&&ELEM[a.sts[0]]?ELEM[a.sts[0]]:a.stun?'aplastante':a.exec?'implacable':f.sk==='mg'?'arcana':'fisico');
const SKS={sangre:'blood',hemorragica:'blood',vampirica:'blood',veneno:'poison',toxica:'poison',escarcha:'ice',glacial:'ice',rayo:'shock',tempestad:'shock',fuego:'fire',infernal:'fire',vacio:'void',abisal:'void',sagrada:'holy',arcana:'arcane',aplastante:'hitStone',implacable:'hitMetal',cazadora:'hitFlesh',fisico:'hitFlesh'},
 BUFS={fury:'fire',shield:'arcane',haste:'shock',regen:'holy',unbreak:'hitStone'};
const dk=(h,f)=>{const n=parseInt(String(h).slice(1),16);if(isNaN(n))return h;const c=x=>Math.max(0,Math.min(255,Math.round(x*f))).toString(16).padStart(2,'0');return '#'+c(n>>16&255)+c(n>>8&255)+c(n&255)};
const SX=(n,k,pan)=>{try{if(typeof SFXS!=='undefined'&&SFXS.play(n,{k,pan}))return true}catch(e){}return false};
const SK3=()=>typeof R3D!=='undefined'&&R3D.skill;
function fxCast(a,f,m,melee){const col=a.col||f.col||'#e8cf94',c2=dk(col,.45),hv=(a.coef||0)>=1.3,n2=a.n2||1,K=SK3(),el=elemOf(a,f);
 try{
  if(a.buf&&!a.coef){if(K)K.play('columna',{x:P.x,y:P.y,r:34,h:78,col,col2:c2,life:1.1});if(R3D.impact)R3D.impact.burst(P,BUFE[a.buf[0]]||'arcana',.9);SX('powerup',1);SX(BUFS[a.buf[0]]||'arcane',.7);return}
  if(a.aoe&&a.self){if(melee){if(K)K.play('remolino',{x:P.x,y:P.y,r:a.aoe,col,col2:c2,life:.6,dir:1});SX('whirl',1.1)}else{if(K)K.play('orbe',{x:P.x,y:P.y,r:a.aoe*.7,col,col2:c2,life:.75});SX(SKS[el]||'arcane',1.2)}return}
  if(!m)return;const ang=Math.atan2(m.y-P.y,m.x-P.x),rch=(f.rng||90)*.7;
  if(melee){for(let h=0;h<Math.min(n2,5);h++){if(K)K.play('tajo',{x:P.x,y:P.y,ang:ang+(h&1?.25:-.25)*(h?1:0),r:rch,dir:h&1?-1:1,col,col2:c2,k:hv&&!h?1.6:1,delay:h*.11,life:hv&&!h?.38:.28});setTimeout(()=>SX(hv&&!h?'swooshHeavy':'swoosh',hv&&!h?1.2:.9,0),h*110)}
   if(a.exec&&K)K.play('hendidura',{x:m.x,y:m.y,h:Math.max(60,(m.d.h||40)*1.6),col:'#ffffff',col2:col,k:1.6,delay:.12,life:.45});return}
  const ranged=f.sk!=='mg';if(K)for(let h=0;h<Math.min(n2,4);h++)K.play('estela',{x:P.x,y:P.y,tx:m.x,ty:m.y,r:hv?18:12,col,col2:c2,delay:h*.11,life:.3});
  if(f.sk==='mg'&&hv&&(el==='fuego'||el==='infernal')&&R3D.spell&&R3D.spell.fireball)R3D.spell.fireball(P.x,P.y,m.x,m.y,260,.7);
  if(ranged)SX(/ballesta|virote|anclaje|salva|francotirador|recarga/i.test(a.n+' '+f.n)?'crossbow':'bow',hv?1.2:1);else SX(SKS[el]||'arcane',hv?1.1:.8)
 }catch(e){}}
function fxHit(a,f,o,k){if(!o||!(o.hp>0))return;const el=elemOf(a,f),K=SK3(),col=a.col||f.col||'#e8cf94';
 try{if(R3D.impact)R3D.impact.burst(o,el,k)}catch(e){}
 try{if(K){if(a.stun||el==='aplastante')K.play('grietas',{x:o.x,y:o.y,r:46*k,ang:Math.random()*6.28,col:'#ffc070',col2:'#7a3010',life:1});else if(f.sk==='mg'&&(a.coef||0)>=1.3)K.play('orbe',{x:o.x,y:o.y,r:34*k,col,col2:dk(col,.45),life:.55})}}catch(e){}
 if(!SX(a.stun?'stun':a.exec?'execute':SKS[el]||'hitFlesh',k)){try{if(SND&&SND.en)SND.en(SNDE[el]||'fisico')}catch(e){}}}
function use(slot){
 if(!active()||P.hp<=0||CK||(typeof inRoom==='function'&&inRoom()))return false;
 const f=fam(),a=bar()[slot];if(!a)return false;const now=performance.now();
 if(now<gcd||now<(cd[a.id]||0))return false;
 if(typeof STS!=='undefined'){if(STS.frozen&&STS.frozen(P))return false;if(f.res==='MN'&&STS.has(P,'silence')){toast('🤐 Estás silenciado.',1200);return false}}
 const mg=f.res==='MN',cost=costOf(a),have=mg?MN:EN;if(have<cost){toast(mg?'💧 Te falta maná.':'⚡ Te falta energía.',1200);return false}
 let m=null;
 if(a.coef){m=spellTarget();if(!m){toast('No hay ningún enemigo cerca.',1200);return false}
  const dd=Math.hypot(P.x-m.x,P.y-m.y),rg=a.self&&a.aoe?a.aoe+14:f.rng;if(dd>rg){toast(f.sk==='cb'||a.self?'Acércate más al enemigo.':'Está demasiado lejos.',1200);return false}}
 let tg0=null;if(!a.coef&&a.aoe&&a.self){tg0=M.filter(o=>alive(o,now)&&!o.poi&&Math.hypot(o.x-P.x,o.y-P.y)<=a.aoe);if(!tg0.length){toast('No hay enemigos cerca.',1200);return false}}
 if(mg)MN-=cost;else EN-=cost;cd[a.id]=now+cdOf(a)*1000;gcd=now+GCD;
 const s=st();s.use[a.id]=(s.use[a.id]||0)+1;const rk=rank(a.id);if(rk>0&&s.use[a.id]===RK[rk-1])toast('⭐ <b>'+a.n+'</b>: ¡dominio '+rk+'!',2600);
 const mul=(1+.08*rk)*(1+pas('dmgS'));   /* pasivas del árbol (Técnica, Furia…) */
 if(typeof tone==='function')try{tone(300+slot*55,.07,'triangle',.05)}catch(e){}
 U[a.id]=now;
 /* ANIMACIÓN (skillanim3d.js, `window.SKA[id]` = {d ms, ip fracción del impacto, hits}): el héroe hace lo que describe la habilidad y los efectos y el daño caen en el impacto del clip */
 const KA=(typeof window!=='undefined'&&window.SKA&&window.SKA[a.id])||null,imp=KA?KA.d*KA.hits[0]:0;
 if(KA&&typeof P==='object')P.ck={id:a.id,t0:now,d:KA.d};
 if(KA&&imp>90){const f0=f,m0=m,sk0=f.sk==='cb';Q.push({t:now+imp-(sk0?70:0),fn:()=>{if(P.hp>0)fxCast(a,f0,m0,sk0)}})}else fxCast(a,f,m,f.sk==='cb');
 if(a.buf){STS.add(P,a.buf[0],{dur:a.buf[1]});try{snd('magic')}catch(e){}sp(P.x,P.y-14,f.col,12,70,60,120)}
 if(tg0){const rk0=rank(a.id);tg0.forEach(o=>STS.add(o,a.sts[0],{dur:a.sts[1]*(1+.08*rk0)*(1+pas('stsD')),v:a.sts[2]}));HFX.push({k:'star',tx:P.x,ty:P.y,th:4,t0:now,d:380});sp(P.x,P.y-6,a.col||f.col,16,a.aoe*1.6,50,120);try{snd('magic')}catch(e){}}
 if(a.coef&&m){
  if(!A||A.e!==m){stopA();P.g=null;startF(m,now)}P.f=m.x-m.y>=P.x-P.y?1:-1;
  const mx=maxHit(),cx=a.self?P.x:m.x,cy=a.self?P.y:m.y,tg=a.aoe?M.filter(o=>alive(o,now)&&!o.poi&&Math.hypot(o.x-cx,o.y-cy)<=a.aoe):[m];if(!tg.includes(m)&&!a.self)tg.unshift(m);
  const n2=a.n2||1,melee=f.sk==='cb',hv=a.coef>=1.3;
  tg.forEach(o=>{for(let h=0;h<n2;h++){
   let d=Math.max(1,Math.round(mx*a.coef*mul*(.85+Math.random()*.3)));
   if(a.exec&&o.hp<=o.mh*a.exec[0])d=Math.max(1,Math.round(mx*a.exec[1]*mul*(.85+Math.random()*.3)));
   const hf=KA?KA.d*(KA.hits[Math.min(h,KA.hits.length-1)]+(h>=KA.hits.length?(h-KA.hits.length+1)*.06:0)):0,t1=KA?now+hf+(melee?0:(a.aoe&&!a.self?260:170)):now+(melee?60+h*110:(a.aoe&&!a.self?260:150)+h*110);
   if(melee){if(!h&&o===m)HFX.push({k:wColor()?'thrust':'punch',x:P.x,y:P.y,tx:o.x,ty:o.y,th:o.d.h/2,t0:now,d:300});
    PJ.push({x:P.x,y:P.y,sh:14,tx:o.x,ty:o.y,th:o.d.h/2,t0:t1+9999,t1,m:o,d,wt:'m',sk:'cb',mxv:mx*a.coef,hv:0,nodraw:1})}
   else PJ.push({x:P.x,y:P.y,sh:14,tx:o.x,ty:o.y,th:o.d.h/2,t0:t1-170,t1,m:o,d,wt:f.sk==='mg'?'g':'r',sk:f.sk,mxv:mx*a.coef,col:a.col,hv:hv&&!h?1:0});
   if(h<3)Q.push({t:t1+15,fn:()=>fxHit(a,f,o,(o===m?1:.65)*(h?.7:1)*(hv?1.3:1))})}
   if(a.sts||a.stun||a.drain)Q.push({t:now+(KA?KA.d*KA.hits[0]+(melee?10:200):280),fn:()=>{if(!alive(o,performance.now()))return;
    if(a.sts)STS.add(o,a.sts[0],{dur:a.sts[1]*(1+.08*rk)*(1+pas('stsD')),v:a.sts[2]});
    if(a.stun&&typeof stunStart==='function'&&o===m)stunStart(o,performance.now(),a.stun*(1+.08*rk));
    if(a.drain&&o===m){const hl=Math.max(1,Math.round(mx*a.coef*mul*a.drain));P.hp=Math.min(maxHp(),P.hp+hl);splat(P.x,P.y,'+'+hl,'#2f9a3a',30)}}})});
  if(a.aoe&&a.self){HFX.push({k:'star',tx:cx,ty:cy,th:4,t0:now,d:380});sp(cx,cy-6,a.col||f.col,16,a.aoe*1.6,50,120)}
  try{snd(melee?'hit':f.sk==='mg'?'magic':'bow')}catch(e){}}
 dirty=1;return true}
function tick(now,dt){{const f=fam(),pe=pas('en');if(f&&pe>0&&active()&&dt>0){if(f.res==='MN')MN=Math.min(mnMax(),MN+dt*mnMax()*MR*pe);else EN=Math.min(enMax(),EN+dt*ENR*pe)}}{const f=fam();if(f&&f.res==='MN'&&active()&&dt>0&&!(typeof STS!=='undefined'&&STS.noMana&&STS.noMana()))MN=Math.min(mnMax(),MN+dt*mnMax()*MR)}if(Math.hypot(P.x-T.px,P.y-T.py)>2){T.still=now;T.px=P.x;T.py=P.y}if(Q.length){const r=Q.filter(q=>now>=q.t);if(r.length){Q=Q.filter(q=>now<q.t);r.forEach(q=>q.fn())}}
 if(now-(tick.u||0)>1000){tick.u=now;unlockCheck()}}
/* vista para el HUD (hud.js `skFrame`): una entrada por casilla */
function view(){const f=fam();if(!f)return[];const now=performance.now(),mg=f.res==='MN',have=mg?MN:EN;
 return bar().map((a,i)=>a?{a,i}:null).filter(Boolean).map(({a,i})=>{const c=costOf(a),r=Math.max((cd[a.id]||0)-now,gcd-now,0),tot=Math.max(1,(cd[a.id]||0)>now?cdOf(a)*1000:GCD),rk=rank(a.id);
  const rd=(cd[a.id]||0),pop=now-(U[a.id]||-1e9)<260,rdy=rd>0&&now>=rd&&now-rd<450;
  return{id:a.id,slot:i,pop,rdy,kick:!!a.stun,key:String(i+1),n:a.n,e:a.e,col:a.col||f.col,cdp:r>0?Math.min(1,r/tot):0,off:have<c,
   tip:'<b>'+a.n+'</b> <small>(tecla '+(i+1)+(rk?' · dominio '+rk:'')+')</small><br>'+a.d+'<br><small>Coste: '+c+(mg?' de maná':' de energía')+' · enfriamiento '+cdOf(a).toFixed(1)+' s'+(a.coef?' · daño ×'+(a.coef*(1+.08*rk)).toFixed(1):'')+'</small>'}})}
/* iconos SVG (24×24, color = currentColor) */
const IC={slash:'<path d="M5 19L17 5l2 2L7 21z"/><path d="M15 4l5 5-2 2-5-5z" opacity=".6"/>',arrow:'<path d="M3 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
 burst:'<path d="M12 2l2.4 6.6L21 7l-4.6 5L21 17l-6.6-1.6L12 22l-2.4-6.6L3 17l4.6-5L3 7l6.6 1.6z"/>',up:'<path d="M12 3l7 9h-4v9H9v-9H5z"/>',
 shield:'<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/>',bolt:'<path d="M13 2L5 14h6l-2 8 9-13h-6z"/>',skull:'<path d="M12 3a8 8 0 0 0-8 8c0 3 1.5 4.7 3 5.7V20h3v-2h4v2h3v-3.3c1.5-1 3-2.700 3-5.700a8 8 0 0 0-8-8zM9 12a1.700 1.700 0 1 1 0 .1zm6 0a1.700 1.700 0 1 1 0 .1z" fill-rule="evenodd"/>',
 drop:'<path d="M12 2c3 5 6 8 6 12a6 6 0 0 1-12 0c0-4 3-7 6-12z"/>',snow:'<path d="M12 2v20M3.400 7l17.200 10M3.400 17L20.600 7" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round"/>',
 orb:'<circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="9.500" fill="none" stroke="currentColor" stroke-width="1.400" opacity=".6"/>'};
const icon=k=>'<svg viewBox="0 0 24 24" fill="currentColor">'+(IC[k]||IC.burst)+'</svg>';

/* ── REGLAS DE IDENTIDAD de las especializaciones (enganchadas en game.js: `out` multiplica el daño que haces, `inMul` el que recibes, `onHit` aplica efectos al golpear) ── */
const HU=()=>typeof HURT!=='undefined'?HURT:-1e9;
function out(m,sk,wt,now){if(!m)return 1;const pb=(1+pas('dmgB'))*(m.hp<=m.mh*.35?1+pas('exec'):1);return pb*out0(m,sk,wt,now)}   /* pasivas de los árboles × regla del Camino */
function out0(m,sk,wt,now){const sp=spec(sk);if(!sp||!m)return 1;const k=keyOn(),n=now||performance.now();let r=1;
 switch(sp.id){
  case 'guardian':if(k===2&&n-HU()<4000)r*=1.2;break;
  case 'asesino':if(!m.hunt)r*=k===1?2.4:1.8;break;
  case 'verdugo':if(m.hp<=m.mh*(k===1?.4:.3))r*=1.4;if(P.hp<maxHp()*.5)r*=k===2?1.3:1.15;break;
  case 'monje':{if(HU()>T.hurt){T.hurt=HU();T.st=0}r*=1+.04*T.st;T.st=Math.min(k===1?8:5,T.st+1);break}
  case 'cazador':{if(T.m!==m){T.m=m;T.n=0;if(k===2)STS.add(m,'mark',{dur:6000})}r*=1+.05*T.n;T.n=Math.min(k===1?8:5,T.n+1);break}
  case 'franco':{const d=Math.hypot(P.x-m.x,P.y-m.y);if(d>(k===2?240:180))r*=k===2?1.5:1.25;if(n-T.still>1000){r*=k===1?1.5:1.3;T.still=n}break}
  case 'piro':if(k===2&&STS.has(m,'burn'))r*=1.2;break;
  case 'crio':if(STS.has(m,'chill')||STS.has(m,'freeze'))r*=k===2?1.45:1.3;break;
  case 'oscura':if(STS.has(m,'curse'))r*=1.25;break}
 return r}
/* REFLEJO DEL GUARDIÁN (N0): al BLOQUEAR (no en la parada perfecta, que es la de todos) devuelve el 35 % del golpe al atacante (70 % con Fortaleza) con un contragolpe visual (estela + estallido físico) */
const guardian=()=>{const sp=spec('cb');return !!sp&&sp.id==='guardian'};
function riposte(m,d0,now){if(!guardian()||!m||!(d0>0))return;const d=Math.max(1,Math.round(d0*(keyOn()===1?.7:.35)));try{hitM(m,d,now,'cb',99)}catch(e){}
 try{const K=R3D.skill;if(K)K.play('estela',{x:P.x,y:P.y,tx:m.x,ty:m.y,col:'#cfe3ff',col2:'#ffffff',life:.35});if(R3D.impact)R3D.impact.burst(m,'fisico',1.1);if(R3D.spell)R3D.spell.parry((P.x+m.x)/2,(P.y+m.y)/2,Math.atan2(m.y-P.y,m.x-P.x))}catch(e){}}
function inMul(){return Math.max(.5,1-pas('dr'))*inMul0()}
function inMul0(){const sp=spec('cb');if(!sp)return 1;const k=keyOn();let r=1;
 if(sp.id==='guardian'){r=S.eq.s?.8:.88;if(k===1)r*=.92}else if(sp.id==='monje'&&k===2)r=.9;return r}
function onHit(m,d,sk,wt,now){const l=pas('ls');if(l>0&&d>0&&P.hp>0){P.hp=Math.min(maxHp(),P.hp+Math.max(0,d*l));}onHit0(m,d,sk,wt,now)}   /* Sed: cura un % del daño */
function onHit0(m,d,sk,wt,now){const sp=spec(sk);if(!sp||!m)return;const k=keyOn(),rn=Math.random();
 switch(sp.id){
  case 'asesino':if(k===2&&rn<.2)STS.add(m,'bleed',{dur:6000});break;
  case 'piro':if(rn<(k===1?.45:.25))STS.add(m,'burn',{dur:5000});break;
  case 'crio':if(rn<(k===1?.45:.25))STS.add(m,'chill',{dur:5000});break;
  case 'tempestad':if(rn<(k===1?.45:.25)){const rg=k===1?230:170;let b=null,bd=rg;M.forEach(o=>{if(o===m||!alive(o,now)||o.poi)return;const dd=Math.hypot(o.x-m.x,o.y-m.y);if(dd<bd){bd=dd;b=o}});
    if(b){STS.add(b,'shock',{dur:4000});hitM(b,Math.max(1,Math.round(d*(k===2?.75:.5))),now,sk,99);try{HFX.push({k:'star',tx:b.x,ty:b.y,th:b.d.h/2,t0:now,d:300})}catch(e){}}}break;
  case 'oscura':if(rn<(k===2?.25:k===1?.5:.25))STS.add(m,'curse',{dur:6000});if(k===2){const h=Math.max(1,Math.round(d*.06));P.hp=Math.min(maxHp(),P.hp+h)}break}}

/* ── PESTAÑA «Habilidades» (tecla Z) ESTILO NEW WORLD (lote MAESTRIA-NW): solo el arma EQUIPADA (botón «Otras armas» para mirar las demás), cabecera con maestría y puntos,
   las 4 casillas, los DOS árboles lado a lado (activas = círculos, pasivas = rombos, ÚLTIMA al fondo) y un panel de detalle con «Aprender» / «Poner en la casilla». ── */
const UI={f:null,sel:null,last:null,all:0};
const ORDER=['sword','dagger','great','fist','bow','xbow','staff','scepter'];
const ABX=()=>ABX0;
const uiFam=()=>{const e=wf();if(UI.last!==e){UI.last=e;UI.f=null;UI.sel=null}return UI.f||e};
function assign(slot,id){const fid=uiFam();id=id||UI.sel;if(!FAM[fid]||!id||!avail(fid).some(a=>a.id===id))return;const ids=barIds(fid),j=ids.indexOf(id),old=ids[slot];ids[slot]=id;if(j>=0&&j!==slot)ids[j]=old;st().bar[fid]=ids;save()}
const dmgTxt=(a,rk)=>a.coef?'daño ×'+(a.coef*(1+.08*rk)).toFixed(2)+(a.n2?' × '+a.n2:'')+(a.aoe?' · área '+a.aoe+' px':''):'';
const PSVG='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l9 9-9 9-9-9z"/></svg>',USVG='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6 6 1-4.500 4.500 1 6.500-5.500-3-5.500 3 1-6.500L3 9l6-1z"/></svg>';
function nnode(x,fid,f){const id=x.id,on=has(fid,id),can=!on&&canLearn(fid,id),a=x.ty==='a'?ABX0[id]:null,slot=a?barIds(fid).indexOf(id):-1,
  cls='nn '+x.ty+(on?' on':can?' can':' off')+(UI.sel===id?' sel':''),ic=a?icon(a.e):x.ty==='u'?USVG:x.ty==='k'?USVG:PSVG,nm=a?a.n:x.n;
 return '<button class="'+cls+'" data-a="n" data-i="'+id+'" title="'+nm+'" style="--c:'+((a&&a.col)||f.col)+'"><span class="ni">'+ic+'</span>'+(slot>=0?'<u>'+(slot+1)+'</u>':'')+'</button>'}
function ntree(t,ti,fid,f){const sp=spent(fid,ti);let h='<div class="nt"><div class="nt-h"><span>'+t.em+'</span><b>'+t.n+'</b><em>'+sp+'</em></div><div class="nt-g">';
 t.rows.forEach((row,r)=>{const lk=sp<rowNeed(r);h+='<div class="nt-r'+(r===4?' ult':'')+(lk?' lk':'')+'">'+(lk?'<i class="nt-need">'+rowNeed(r)+'</i>':'')+row.map(x=>x?nnode(x,fid,f):'<span class="nn e"></span>').join('')+'</div>'});
 return h+'</div></div>'}
function ndetail(fid,f){const id=UI.sel,x=NODE[id];if(!x||x.f!==fid)return '<div class="nd hint">Toca un nodo para ver qué hace. Los círculos son habilidades (se ponen en la barra), los rombos pasivas y la estrella del fondo es la última del árbol.</div>';
 const on=has(fid,id),can=canLearn(fid,id),a=x.ty==='a'?ABX0[id]:null,T2=TR[fid][x.t];let why='';
 if(!on&&!can){if(ptsFree(fid)<1)why='Sin puntos libres: sube la maestría matando con esta arma.';else if(spent(fid,x.t)<rowNeed(x.r))why='Gasta '+rowNeed(x.r)+' puntos en «'+T2.n+'» para llegar a esta fila.';else if(x.ty==='k')why=has(fid,'u:'+fid+x.t)?'Ya elegiste la otra opción.':'Aprende antes la última del árbol.'}
 let h='<div class="nd"><div class="nd-h"><span class="ni" style="color:'+((a&&a.col)||f.col)+'">'+(a?icon(a.e):x.ty==='p'?PSVG:USVG)+'</span><b>'+(a?a.n:x.n)+'</b><small>'+(a?'Habilidad':x.ty==='u'?'Última del árbol':x.ty==='k'?'Elección (1 de 2)':'Pasiva')+' · '+T2.n+'</small></div><p>'+(a?a.d:x.d)+'</p>';
 if(a){const rk=rank(a.id);h+='<small>'+(f.res==='MN'?'Coste '+(a.mp?Math.round(a.mp*100)+' % del maná':'—'):'Coste '+(a.c||0)+' de energía')+' · enfriamiento '+cdOf(a).toFixed(1)+' s'+(a.coef?' · '+dmgTxt(a,rk):'')+(on?' · dominio '+rk+'/4':'')+'</small>'}
 if(on&&a)h+='<div class="nd-s">Casilla: '+barIds(fid).map((q,i)=>'<button class="'+(q===id?'on':'')+'" data-a="slot" data-i="'+i+'">'+(i+1)+'</button>').join('')+'</div>';
 else if(on)h+='<div class="nd-ok">Aprendido</div>';else if(can)h+='<button class="nd-go" data-a="learn" data-i="'+id+'">Aprender · 1 punto</button>';else h+='<p class="nd-w">'+why+'</p>';
 return h+'</div>'}
function tab(){const fid=uiFam(),f=FAM[fid],eq=wf()===fid,lv=MLV(fid),mx=(S.ms||{})[fid]||0,pc=lv>=99?100:Math.max(0,Math.min(100,(mx-XT[lv])/(XT[lv+1]-XT[lv])*100)),fr=ptsFree(fid),ids=barIds(fid),by={};avail(fid).forEach(a=>by[a.id]=a);
 let h='<div class="kw nw"><div class="nw-top"><span class="nw-em">'+f.em+'</span><div class="nw-tt"><b>'+f.n+(lv>=99?' · Maestro':'')+'</b><small>Maestría '+lv+(eq?'':' · no la llevas equipada')+'</small><div class="nw-bar"><i style="width:'+pc.toFixed(1)+'%"></i></div></div>'+
  '<div class="nw-pt'+(fr?' on':'')+'"><b>'+fr+'</b><small>punto'+(fr===1?'':'s')+'</small></div><button class="nw-ot" data-a="all">'+(UI.all?'Cerrar':'Otras armas')+'</button></div>';
 if(UI.all)h+='<div class="nw-arms">'+ORDER.map(x=>{const q=FAM[x];return '<button class="'+(x===fid?'on':'')+(x===wf()?' eq':'')+'" data-a="w" data-i="'+x+'"><span>'+q.em+'</span><b>'+q.n+'</b><small>'+MLV(x)+'</small></button>'}).join('')+'</div>';
 h+='<div class="nw-slots">'+ids.map((id,i)=>{const a=id&&by[id];return '<button class="'+(a?'':'e')+(a&&UI.sel===a.id?' sel':'')+'" data-a="bar" data-i="'+i+'" '+(a?'style="--c:'+(a.col||f.col)+'"':'')+'><b>'+(i+1)+'</b>'+(a?'<span>'+icon(a.e)+'</span><small>'+a.n+'</small>':'<small>vacía</small>')+'</button>'}).join('')+'</div>';
 h+='<div class="nw-trees">'+TR[fid].map((t,ti)=>ntree(t,ti,fid,f)).join('')+'</div>'+ndetail(fid,f);
 const rc=resetCost(fid);h+='<div class="nw-ft"><small>1 punto cada 4 niveles de maestría (máx. 25) · 4 habilidades en la barra</small>'+(spent(fid)?'<button data-a="reset">Reiniciar puntos'+(rc?' · '+money(rc):'')+'</button>':'')+'</div></div>';
 return h}
function ui(a,i){const fid=uiFam();
 if(a==='w'){UI.f=i;UI.sel=null;UI.all=0}
 else if(a==='all')UI.all=UI.all?0:1;
 else if(a==='n'){UI.sel=UI.sel===i?null:i}
 else if(a==='learn'){if(!locked()||1)learn(fid,i)}
 else if(a==='bar'){const id=barIds(fid)[+i];if(UI.sel&&NODE[UI.sel]&&NODE[UI.sel].ty==='a'&&has(fid,UI.sel)&&UI.sel!==id)assign(+i,UI.sel);else UI.sel=id||null}
 else if(a==='slot')assign(+i,UI.sel);
 else if(a==='reset')resetTree(fid);
 panel()}
document.addEventListener('click',ev=>{const b=ev.target.closest&&ev.target.closest('.kw [data-a]');if(!b)return;ev.preventDefault();ui(b.dataset.a,b.dataset.i)});
document.addEventListener('dblclick',ev=>{const b=ev.target.closest&&ev.target.closest('.nw .nn[data-i]');if(!b)return;ev.preventDefault();learn(uiFam(),b.dataset.i);panel()});   /* doble LMB sobre un nodo = aprenderlo */
addEventListener('contextmenu',ev=>{if(ev.target.closest&&ev.target.closest('#hs-sk')&&!locked()){ev.preventDefault();if(typeof tabClick==='function')tabClick('mg')}},true);
return{EXC,TR,NODE,PTS,ptsFree,learn,canLearn,resetTree,pas,onMastery,spec,FAM,SP,ALIAS,ENR,UPLIFT,fx:{cast:fxCast,hit:fxHit,elemOf},active,use,tick,view,icon,list,fam:()=>wf(),rank,cd:()=>cd,out,inMul,guardian,riposte,onHit,tab,ui,assign,dbg:{st,T,UI}}})();
