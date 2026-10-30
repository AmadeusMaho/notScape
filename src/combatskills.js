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
 guardian:{sk:'cb',fam:['sword'],n:'Guardián',em:'🛡️',idn:'Recibes un 12 % menos de daño (20 % con escudo).',
  key:[{n:'Fortaleza',d:'Recibes un 8 % menos de daño adicional.'},{n:'Represalia',d:'+20 % de daño durante 4 s tras recibir un golpe.'}],
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
/* Armas sin kit propio (ya todas tienen): vacío, queda por si se añade una familia nueva. */
const ALIAS={};
const RK=[20,80,240,600],GCD=700,ENR=1.5,MR=.015,UPLIFT=.3;   /* UPLIFT = DPS extra que se supone con uso MEDIO de las habilidades (la rotación perfecta da ~+55 %); lo usa tools/meas_progresion.py y compensa `HPK` (vida de los enemigos, game.js) */   /* ENR = Energía/s; MR = fracción del maná máx. que regenera por s con un kit de magia (equilibrado por simulación, ver PLAN_HABILIDADES.md §5) */
let cd={},gcd=0,Q=[],lastSig='';const U={};   // U: instante de la última pulsación (destello de la casilla)
const st=()=>{const o=S.csk||(S.csk={});o.use=o.use||{};o.seen=o.seen||{};return o};
const rank=id=>{const u=st().use[id]||0;let r=0;RK.forEach(t=>{if(u>=t)r++});return r};
const wf=()=>{const k=(typeof wKind==='function'?wKind():null)||'fist';return ALIAS[k]||k};
const fam=()=>FAM[wf()]||null;
const locked=()=>typeof ISLA!=='undefined'&&ISLA.lock&&ISLA.lock();
/* ¿está el sistema activo? (hay kit para el arma, no estamos en el tutorial ni dentro de una casa) */
const active=()=>!!fam()&&!locked();
const T={n:0,m:null,st:0,hurt:-1e9,still:0,px:0,py:0};   // seguidores de las reglas de identidad
const FID=fid=>fid||wf();
const spec=(sk,fid)=>{fid=FID(fid);const f=FAM[fid];if(!f||(sk&&sk!==f.sk))return null;const id=(st().spec||{})[f.sk],sp=id&&SP[id];return sp&&sp.fam.includes(fid)&&L(f.sk)>=30?sp:null};
const keyOn=fid=>{const f=FAM[FID(fid)];return f&&L(f.sk)>=60?((st().key||{})[f.sk]||0):0};
const avail=fid=>{fid=FID(fid);const f=FAM[fid];if(!f)return[];const sp=spec(f.sk,fid);return f.kit.concat(sp?sp.kit:[]).filter(a=>L(f.sk)>=a.lv).sort((a,b)=>a.lv-b.lv)};
const barIds=fid=>{fid=FID(fid);const b=((st().bar||(st().bar={}))[fid])||[],av=avail(fid),ids=av.map(a=>a.id),o=[];for(let i=0;i<6;i++){const id=b[i];o[i]=id&&ids.includes(id)?id:null}
 ids.forEach(id=>{if(!o.includes(id)){const j=o.indexOf(null);if(j>=0)o[j]=id}});return o};
const bar=fid=>{const av=avail(fid),by={};av.forEach(a=>by[a.id]=a);return barIds(fid).map(id=>id?by[id]:null)};
const list=()=>bar().filter(Boolean);
const costOf=a=>a.mp?Math.max(1,Math.ceil(mnMax()*a.mp)):a.c;
const cdOf=a=>a.cd*(1-.04*rank(a.id));
function unlockCheck(){const f=fam();if(!f||locked())return;const s=st(),n=avail().filter(a=>!s.seen[a.id]);if(!n.length)return;
 n.forEach(a=>s.seen[a.id]=1);if(n.every(a=>a.lv<=1))return;   // las del nivel 1 no se anuncian
 const it=n.filter(a=>a.lv>1).map(a=>({em:f.em,name:a.n}));if(!it.length)return;
 try{if(typeof RECN!=='undefined'&&RECN.unlock)RECN.unlock({title:'Nueva habilidad',sub:f.n,items:it,foot:'Pestaña Habilidades (Z)'})}catch(e){}}
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
 const mul=1+.08*rk;
 if(typeof tone==='function')try{tone(300+slot*55,.07,'triangle',.05)}catch(e){}
 U[a.id]=now;
 if(a.buf){STS.add(P,a.buf[0],{dur:a.buf[1]});try{snd('magic')}catch(e){}sp(P.x,P.y-14,f.col,12,70,60,120)}
 if(tg0){const rk0=rank(a.id);tg0.forEach(o=>STS.add(o,a.sts[0],{dur:a.sts[1]*(1+.08*rk0),v:a.sts[2]}));HFX.push({k:'star',tx:P.x,ty:P.y,th:4,t0:now,d:380});sp(P.x,P.y-6,a.col||f.col,16,a.aoe*1.6,50,120);try{snd('magic')}catch(e){}}
 if(a.coef&&m){
  if(!A||A.e!==m){stopA();P.g=null;startF(m,now)}P.f=m.x-m.y>=P.x-P.y?1:-1;
  const mx=maxHit(),cx=a.self?P.x:m.x,cy=a.self?P.y:m.y,tg=a.aoe?M.filter(o=>alive(o,now)&&!o.poi&&Math.hypot(o.x-cx,o.y-cy)<=a.aoe):[m];if(!tg.includes(m)&&!a.self)tg.unshift(m);
  const n2=a.n2||1,melee=f.sk==='cb',hv=a.coef>=1.3;
  tg.forEach(o=>{for(let h=0;h<n2;h++){
   let d=Math.max(1,Math.round(mx*a.coef*mul*(.85+Math.random()*.3)));
   if(a.exec&&o.hp<=o.mh*a.exec[0])d=Math.max(1,Math.round(mx*a.exec[1]*mul*(.85+Math.random()*.3)));
   const t1=now+(melee?60+h*110:(a.aoe&&!a.self?260:150)+h*110);
   if(melee){if(!h&&o===m)HFX.push({k:wColor()?'thrust':'punch',x:P.x,y:P.y,tx:o.x,ty:o.y,th:o.d.h/2,t0:now,d:300});
    PJ.push({x:P.x,y:P.y,sh:14,tx:o.x,ty:o.y,th:o.d.h/2,t0:t1+9999,t1,m:o,d,wt:'m',sk:'cb',mxv:mx*a.coef,hv:0,nodraw:1})}
   else PJ.push({x:P.x,y:P.y,sh:14,tx:o.x,ty:o.y,th:o.d.h/2,t0:t1-170,t1,m:o,d,wt:f.sk==='mg'?'g':'r',sk:f.sk,mxv:mx*a.coef,col:a.col,hv:hv&&!h?1:0})}
   if(a.sts||a.stun||a.drain)Q.push({t:now+280,fn:()=>{if(!alive(o,performance.now()))return;
    if(a.sts)STS.add(o,a.sts[0],{dur:a.sts[1]*(1+.08*rk),v:a.sts[2]});
    if(a.stun&&typeof stunStart==='function'&&o===m)stunStart(o,performance.now(),a.stun*(1+.08*rk));
    if(a.drain&&o===m){const hl=Math.max(1,Math.round(mx*a.coef*mul*a.drain));P.hp=Math.min(maxHp(),P.hp+hl);splat(P.x,P.y,'+'+hl,'#2f9a3a',30)}}})});
  if(a.aoe&&a.self){HFX.push({k:'star',tx:cx,ty:cy,th:4,t0:now,d:380});sp(cx,cy-6,a.col||f.col,16,a.aoe*1.6,50,120)}
  try{snd(melee?'hit':f.sk==='mg'?'magic':'bow')}catch(e){}}
 dirty=1;return true}
function tick(now,dt){{const f=fam();if(f&&f.res==='MN'&&active()&&dt>0&&!(typeof STS!=='undefined'&&STS.noMana&&STS.noMana()))MN=Math.min(mnMax(),MN+dt*mnMax()*MR)}if(Math.hypot(P.x-T.px,P.y-T.py)>2){T.still=now;T.px=P.x;T.py=P.y}if(Q.length){const r=Q.filter(q=>now>=q.t);if(r.length){Q=Q.filter(q=>now<q.t);r.forEach(q=>q.fn())}}
 if(now-(tick.u||0)>1000){tick.u=now;unlockCheck()}}
/* vista para el HUD (hud.js `skFrame`): una entrada por casilla */
function view(){const f=fam();if(!f)return[];const now=performance.now(),mg=f.res==='MN',have=mg?MN:EN;
 return bar().map((a,i)=>a?{a,i}:null).filter(Boolean).map(({a,i})=>{const c=costOf(a),r=Math.max((cd[a.id]||0)-now,gcd-now,0),tot=Math.max(1,(cd[a.id]||0)>now?cdOf(a)*1000:GCD),rk=rank(a.id);
  const rd=(cd[a.id]||0),pop=now-(U[a.id]||-1e9)<260,rdy=rd>0&&now>=rd&&now-rd<450;
  return{id:a.id,slot:i,pop,rdy,key:String(i+1),n:a.n,e:a.e,col:a.col||f.col,cdp:r>0?Math.min(1,r/tot):0,off:have<c,
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
function out(m,sk,wt,now){const sp=spec(sk);if(!sp||!m)return 1;const k=keyOn(),n=now||performance.now();let r=1;
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
function inMul(){const sp=spec('cb');if(!sp)return 1;const k=keyOn();let r=1;
 if(sp.id==='guardian'){r=S.eq.s?.8:.88;if(k===1)r*=.92}else if(sp.id==='monje'&&k===2)r=.9;return r}
function onHit(m,d,sk,wt,now){const sp=spec(sk);if(!sp||!m)return;const k=keyOn(),rn=Math.random();
 switch(sp.id){
  case 'asesino':if(k===2&&rn<.2)STS.add(m,'bleed',{dur:6000});break;
  case 'piro':if(rn<(k===1?.45:.25))STS.add(m,'burn',{dur:5000});break;
  case 'crio':if(rn<(k===1?.45:.25))STS.add(m,'chill',{dur:5000});break;
  case 'tempestad':if(rn<(k===1?.45:.25)){const rg=k===1?230:170;let b=null,bd=rg;M.forEach(o=>{if(o===m||!alive(o,now)||o.poi)return;const dd=Math.hypot(o.x-m.x,o.y-m.y);if(dd<bd){bd=dd;b=o}});
    if(b){STS.add(b,'shock',{dur:4000});hitM(b,Math.max(1,Math.round(d*(k===2?.75:.5))),now,sk,99);try{HFX.push({k:'star',tx:b.x,ty:b.y,th:b.d.h/2,t0:now,d:300})}catch(e){}}}break;
  case 'oscura':if(rn<(k===2?.25:k===1?.5:.25))STS.add(m,'curse',{dur:6000});if(k===2){const h=Math.max(1,Math.round(d*.06));P.hp=Math.min(maxHp(),P.hp+h)}break}}

/* ── PESTAÑA «Habilidades» (tecla Z; antes «Magia»): arma → árbol (kit por nivel + Caminos) → detalle y barra. HTML para `panel()` de game.js (TB==='mg'). ── */
const UI={f:null,sel:null,last:null};
const ORDER=['sword','dagger','great','fist','bow','xbow','staff','scepter'];
const ABX=()=>{const m={};Object.values(FAM).forEach(f=>f.kit.forEach(a=>m[a.id]=a));Object.values(SP).forEach(q=>q.kit.forEach(a=>m[a.id]=a));return m};
const uiFam=()=>{const e=wf();if(UI.last!==e){UI.last=e;UI.f=null}return UI.f||e};
const respecCost=sk=>500+50*L(sk);
function choose(id){const sp=SP[id],f=FAM[uiFam()];if(!f||!sp||sp.sk!==f.sk||L(f.sk)<30)return;const s=st();s.spec=s.spec||{};s.key=s.key||{};const cur=s.spec[f.sk];if(cur===id)return;
 if(cur){const c=respecCost(f.sk);if(S.coins<c){toast('Necesitas '+money(c)+' para cambiar de Camino.',2400);return}S.coins-=c;try{snd('coin')}catch(e){}}
 s.spec[f.sk]=id;s.key[f.sk]=0;s.bar={};try{snd('quest')}catch(e){}toast('Camino elegido: <b>'+sp.n+'</b>',2800);dirty=1;save()}
function chooseKey(n){const f=FAM[uiFam()],s=st();if(!f||L(f.sk)<60||!(s.spec||{})[f.sk])return;s.key=s.key||{};s.key[f.sk]=s.key[f.sk]===n?0:n;try{snd('quest')}catch(e){}dirty=1;save()}
function assign(slot,id){const fid=uiFam();id=id||UI.sel;if(!FAM[fid]||!id||!avail(fid).some(a=>a.id===id))return;const ids=barIds(fid),j=ids.indexOf(id),old=ids[slot];ids[slot]=id;if(j>=0&&j!==slot)ids[j]=old;const s=st();s.bar=s.bar||{};s.bar[fid]=ids;save()}
const dmgTxt=(a,rk)=>a.coef?'daño ×'+(a.coef*(1+.08*rk)).toFixed(2)+(a.n2?' × '+a.n2:'')+(a.aoe?' · área '+a.aoe+' px':''):'';
function node(a,f,fid,sp){const lv=L(f.sk),un=lv>=a.lv,onBr=!sp||(st().spec||{})[f.sk]===sp.id,live=un&&onBr,rk=live?rank(a.id):0,slot=barIds(fid).indexOf(a.id);
 return '<button class="kn '+(live?'un':'lk')+(UI.sel===a.id?' sel':'')+(onBr?'':' dm')+'" data-a="n" data-i="'+a.id+'" style="--c:'+(a.col||f.col)+'"><span class="ki">'+icon(a.e)+'</span><b>'+a.n+'</b><small>'+(live?(rk?'★'.repeat(rk):'listo'):'Nv '+a.lv)+'</small>'+(slot>=0&&live?'<u>'+(slot+1)+'</u>':'')+'</button>'}
function keynode(sp,f){const lv=L(f.sk),on=(st().spec||{})[f.sk]===sp.id,k=on?((st().key||{})[f.sk]||0):0,live=on&&lv>=60;
 return '<button class="kn ks '+(live?'un':'lk')+(UI.sel==='key:'+sp.id?' sel':'')+(on?'':' dm')+'" data-a="n" data-i="key:'+sp.id+'"><span class="ki"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6 6 1-4.500 4.500 1 6.500-5.500-3-5.500 3 1-6.500L3 9l6-1z"/></svg></span><b>'+(k?sp.key[k-1].n:'Piedra clave')+'</b><small>'+(live?(k?'activa':'elige'):'Nv 60')+'</small></button>'}
function detail(f,fid){const sel=UI.sel;if(!sel)return'<div class="kd hint">Toca una habilidad para ver qué hace y ponerla en la barra.</div>';
 const lv=L(f.sk);
 if(sel.startsWith('key:')){const sp=SP[sel.slice(4)];if(!sp)return'';const on=(st().spec||{})[f.sk]===sp.id,k=(st().key||{})[f.sk]||0;
  return '<div class="kd"><div class="kd-h"><b>Piedra clave · '+sp.n+'</b></div>'+(!on?'<p class="kd-w">Elige primero el Camino '+sp.n+'.</p>':lv<60?'<p class="kd-w">Se desbloquea a nivel 60 de '+SK[f.sk][0]+'. Cambia una regla de tu Camino.</p>':
   '<p>Elige una (cambiar es gratis):</p><div class="kd-k">'+sp.key.map((q,i)=>'<button class="'+(k===i+1?'on':'')+'" data-a="key" data-i="'+(i+1)+'"><b>'+q.n+'</b><small>'+q.d+'</small></button>').join('')+'</div>')+'</div>'}
 const a=ABX()[sel];if(!a)return'';const sp=Object.values(SP).find(q=>q.kit.some(x=>x.id===a.id)),onBr=!sp||(st().spec||{})[f.sk]===sp.id,un=lv>=a.lv,live=un&&onBr,rk=rank(a.id),u=st().use[a.id]||0,nx=RK[rk],ids=barIds(fid);
 let h='<div class="kd"><div class="kd-h"><span style="color:'+(a.col||f.col)+'">'+icon(a.e)+'</span><b>'+a.n+'</b>'+(rk?'<em>'+'★'.repeat(rk)+'</em>':'')+'</div><p>'+a.d+'</p><small>'+(f.res==='MN'?'Coste '+(a.mp?Math.round(a.mp*100)+' % del maná':'—'):'Coste '+(a.c||0)+' de energía')+' · enfriamiento '+(a.cd*(1-.04*rk)).toFixed(1)+' s'+(a.coef?' · '+dmgTxt(a,rk):'')+'</small>';
 if(live)h+='<small>Dominio '+rk+'/4 · '+u+' usos'+(nx?' (siguiente rango a los '+nx+')':' · máximo')+'</small><div class="kd-s">Poner en la casilla: '+ids.map((id,i)=>'<button class="'+(id===a.id?'on':'')+'" data-a="slot" data-i="'+i+'">'+(i+1)+'</button>').join('')+'</div>';
 else if(!un)h+='<p class="kd-w">Se desbloquea a nivel '+a.lv+' de '+SK[f.sk][0]+'.</p>';
 else h+='<p class="kd-w">Es del Camino '+sp.n+': elígelo para usarla.</p>';
 return h+'</div>'}
function tab(){const fid=uiFam(),f=FAM[fid],eq=wf()===fid,lv=L(f.sk),cur=(st().spec||{})[f.sk],ids=barIds(fid),by={};avail(fid).forEach(a=>by[a.id]=a);
 const br=Object.keys(SP).filter(i=>SP[i].sk===f.sk&&SP[i].fam.includes(fid)).map(i=>SP[i]);
 let h='<h2>Habilidades <small>'+SK[f.sk][0]+' nivel '+lv+'</small></h2><div class="kw">';
 h+='<div class="kw-tabs">'+ORDER.map(x=>{const q=FAM[x];return '<button class="'+(x===fid?'on':'')+(x===wf()?' eq':'')+'" data-a="w" data-i="'+x+'" title="'+q.n+(x===wf()?' (equipada)':'')+'"><span>'+q.em+'</span><b>'+q.n+'</b></button>'}).join('')+'</div>';
 h+='<div class="kw-note'+(eq?' ok':'')+'">'+(eq?'Arma equipada: sus habilidades están en tu barra (teclas 1–6).':'No llevas esta arma: equípala para usar sus habilidades.')+'</div>';
 h+='<div class="kw-t">Barra <small>'+(UI.sel&&UI.sel[0]!=='k'&&by[UI.sel]?'toca una casilla para poner «'+by[UI.sel].n+'»':'las 6 casillas de esta arma')+'</small></div><div class="kw-bar">'+
  ids.map((id,i)=>{const a=id&&by[id];return '<button class="'+(a?'':'e')+(a&&UI.sel===a.id?' sel':'')+'" data-a="bar" data-i="'+i+'" '+(a?'style="--c:'+(a.col||f.col)+'"':'')+'><b>'+(i+1)+'</b>'+(a?'<span>'+icon(a.e)+'</span><small>'+a.n+'</small>':'<small>vacía</small>')+'</button>'}).join('')+'</div>';
 h+='<div class="kw-t">Habilidades del arma <small>se aprenden solas al subir '+SK[f.sk][0]+'</small></div><div class="kw-trunk">'+f.kit.map((a,i)=>(i?'<i class="kl"></i>':'')+node(a,f,fid,null)).join('')+'</div>';
 h+='<div class="kw-t">Caminos <small>especialización · se elige uno por skill a nivel 30</small></div>';
 if(!br.length)h+='<div class="kw-note">Esta arma no tiene Camino propio'+(cur&&SP[cur]?' (tu Camino de '+SK[f.sk][0]+' es «'+SP[cur].n+'», del '+SP[cur].fam.map(x=>FAM[x].n.toLowerCase()).join(' / ')+')':'')+'.</div>';
 br.forEach(sp=>{const on=cur===sp.id,k3=sp.kit;
  const btn=on?'<u class="kw-on">Elegido</u>':lv<30?'<u class="kw-lk">Nivel 30</u>':'<button class="kw-go" data-a="sp" data-i="'+sp.id+'">'+(cur?'Cambiar · '+money(respecCost(f.sk)):'Elegir Camino')+'</button>';
  h+='<div class="kw-br'+(on?' on':'')+'"><div class="kw-bh"><div><b>'+sp.em+' '+sp.n+'</b><small>'+sp.idn+'</small></div>'+btn+'</div><div class="kw-bn">'+node(k3[0],f,fid,sp)+'<i class="kl"></i>'+node(k3[1],f,fid,sp)+'<i class="kl"></i>'+keynode(sp,f)+'<i class="kl"></i>'+node(k3[2],f,fid,sp)+'</div></div>'});
 h+=detail(f,fid)+'</div>';return h}
function ui(a,i){const fid=uiFam(),f=FAM[fid];
 if(a==='w'){UI.f=i;UI.sel=null}
 else if(a==='n'){UI.sel=UI.sel===i?null:i}
 else if(a==='bar'){const id=barIds(fid)[+i];if(UI.sel&&UI.sel[0]!=='k'&&avail(fid).some(x=>x.id===UI.sel)&&UI.sel!==id)assign(+i,UI.sel);else UI.sel=id||null}
 else if(a==='slot')assign(+i,UI.sel);
 else if(a==='sp'){choose(i)}
 else if(a==='key')chooseKey(+i);
 panel()}
document.addEventListener('click',ev=>{const b=ev.target.closest&&ev.target.closest('.kw [data-a]');if(!b)return;ev.preventDefault();ui(b.dataset.a,b.dataset.i)});
addEventListener('contextmenu',ev=>{if(ev.target.closest&&ev.target.closest('#hs-sk')&&!locked()){ev.preventDefault();if(typeof tabClick==='function')tabClick('mg')}},true);
return{FAM,SP,ALIAS,ENR,UPLIFT,active,use,tick,view,icon,list,fam:()=>wf(),rank,cd:()=>cd,out,inMul,onHit,tab,ui,choose,chooseKey,assign,dbg:{st,T,UI}}})();
