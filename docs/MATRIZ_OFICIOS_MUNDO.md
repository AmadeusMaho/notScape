# MATRIZ · OFICIOS × TIERS × BIOMAS (PROPUESTA del 26 oct 2026 — a corregir por el dueño)

> **Para qué sirve:** es la fuente única de qué materiales, fauna, nodos y estaciones debe CONTENER el mundo. El generador de POI (`src/poi-gen.js`), las zonas de recurso de `biomes.js`/`layouts.js`, la fauna y las recetas se escriben DESPUÉS de aprobar esto, no antes.
> **Reglas ya decididas (no se discuten aquí):** todos los oficios existen y se suben en TODOS los biomas desde el principio; el bioma solo aporta materiales, hierbas, fauna y recetas de SU tier · crafteo = hoja de trabajo FF14 · todo oficio se sube produciendo un intermedio vendible · nodos que reaparecen en otro punto (§5s del plan FF14) · comida/pociones = buffs suaves · ids por convención de `REGLAS_CREACION.md` §13 · cultura solo cambia el ASPECTO.
> Marca **★** = decisión del dueño pendiente. Todo nombre es provisional.

## 0 · DECISIONES YA TOMADAS DEL DUEÑO (26 oct 2026)
- **★1 tiers:** se añaden aleaciones; 12 tiers de metal (§2).  Los tiers se diferencian además por calidades, rarezas, grado Reforzado y piezas únicas por bioma («que se sienta mejorar el tier»).
- **★2 hoz:** UNA POR TIER (como hacha y pico).
- **★3:** Herbolaria = rueda/minijuego propio «arrancar con cuidado»; Alquimia = interfaz propia (no la hoja de herrería); ambos se diseñan con el dueño antes de construir.
- **★4 vidrio:** lo fabrica Alquimia fundiendo ARENA (Desierto/Costa); los biomas sin arena la traen o la compran.
- **★5 piedra:** nodo de Minería (granito, caliza, basalto, arenisca, mármol…); las canteras son POI de plantilla; sin recolección nueva.
- **★6–★10 (aprobadas con la propuesta, 26 oct):** ★6 pergamino de piel curtida + papel barato de fibra de Herbolaria · ★7 «oro» = mena NUEVA de nivel medio (Cumbres y Desierto; ingrediente del alba y de Joyería) · ★8 una gema por bioma (cuarzo, ámbar, jade, zafiro, ópalo, rubí, topacio, perla/coral, amatista, diamante) · ★9 una criatura domable por bioma (lista en §3.8) · ★10 Agricultura se deja para el FINAL y se decide entonces si se mantiene.
- **★11:** fauna de cada bioma = mitad pacífica (caza, desollar, domar) y mitad hostil, + 1 ÉLITE por bioma.
- **★12 (dueño):** **9 tipos de enemigo de combate por bioma** para dar varias opciones de farmeo: **algunos sueltan materiales REPETIDOS entre sí** (más fáciles de farmear según la clase: cuerpo a cuerpo, arco, magia). **No todos tienen jefe, pero sí capitán.** *Cómo lo concreto yo (criterio del agente, a confirmar):* 9 tipos = 5 comunes + 2 «de clase» (fáciles para arco o magia, con drops compartidos) + 2 de élite; **1 capitán por bioma** (hoy `k<N>`, sin cambios) y **1 jefe por bioma** como hito (hoy `b<N>`); como mucho 1 mini-jefe opcional por cada 8 POI fortificados (sin jefe en el resto de tipos). Rendimiento: tope de actores por sector (streaming, igual que `Resources`).
- **★13:** 4 edificios compartidos por aldea: Botica (Alquimia+Herbolaria) · Taller (Artesanía, Sastrería, Escultor, Peletería, Ingeniería) · Herrería (Herrería+Joyería) · Templo arcano (Encantamiento); más Establo y parcelas fuera.
- **★14:** NO por ahora (se quedan 12 tiers).
- **Culturas (26 oct):** 6 Infierno (hierro negro y brasa, cadenas, cuernos; infernita) y 7 Cielo (griego: mármol, oro, alas; celestita) — implementadas en `armorcult3d.js`/`weapons3d.js` (lote CULTURAS-6-7 en AGENTS.md).

## 1 · Lo que YA existe en datos (medido del juego el 26 oct)
| Tier | Metal (nv Minería) | Madera (nv Tala) | Pez (nv Pesca) | Piel (HIDEOF) |
|---|---|---|---|---|
| 0 | cobre 1 | pino 1 | camarón 1 | goblin, vaca |
| 1 | estaño 1 | abedul 5 | sardina 5 | orco, b0 |
| 2 | bronce (aleación) | roble 10 | arenque 10 | bandido, k0 |
| 3 | hierro 12 | fresno 16 | trucha 15 | jabalí |
| 4 | acero (hierro+carbón 22) | sauce 26 | salmón 30 | lobo, b1 |
| 5 | plata 32 | arce 36 | lucio 38 | oso, k1 |
| 6 | mitril 44 | tejo 48 | atún 45 | yak, ogro, gigante, b3, k3 |
| 7 | adamantita 58 | ébano 62 | pez magma 60 | zorro, lagarto |
| 8 | runita 70 | caoba 74 | pez espada 72 | oni, shinobi, b4, k4 |
| 9 | oricalco 79 | baobab 84 | mantarraya 82 | demonio, b5 |
| 10 | celestita 88 | Árbol del Mundo 94 | kraken joven 92 | golem, k5 |

**Biomas hoy (datos de `b.res`):** Pradera (cobre/estaño/hierro · pino/abedul/roble) · Bosque (hierro/carbón · roble/fresno/sauce) · Pantano (carbón/plata/mitril · sauce/arce) · Cumbres (plata/mitril/adamantita · arce/tejo/ébano) · Oriental (adamantita/runita · ébano/caoba) · Volcán (oricalco/celestita · caoba/baobab) · **Páramo, Desierto y Costa copian a Cumbres/Oriental (marcadores, sin contenido propio)** · Cielo (isla del tutorial y endgame). Infierno: sin datos.
**Fauna de combate hoy:** Pradera vaca/gallina/oveja/goblin/orco · Bosque jabalí/lobo/oso · Pantano rana/esqueleto/bruja · Cumbres yak/ogro/gigante · Oriental zorro/oni/shinobi · Volcán lagarto/demonio/golem. Solo 7 animales son desollables (`SKINNABLE`); Desollar no pasa de nv 64.

## 2 · TIERS REWORKEADOS CON ALEACIONES (decisión del dueño 26 oct: «quiero que se sienta mejorar el tier»; propuesta de números a ajustar)
**Principios:** (1) el **estaño deja de ser tier** y pasa a ingrediente (solo existe para el bronce); (2) se añade **1 aleación nueva** (alba) y el tier infernal **infernita** → **12 tiers de metal**; (3) cada tier se distingue por MÁS que el número: **calidad de crafteo** (Normal/Superior/Excelente/Maestra), **rareza**, **grado Reforzado** y **piezas únicas** de bioma (cada bioma tiene al menos 1 objeto/receta exclusiva de su zona, no solo el siguiente número); (4) las aleaciones piden un **aditivo de otro bioma** (obligan a viajar y alimentan las recetas entrelazadas).
| Tier | Metal (aleación) | Nv | Bioma que lo da | Aditivo / mena | Nota |
|---|---|---|---|---|---|
| 1 | cobre | 1 | Pradera | mena de cobre | |
| 2 | **bronce** = cobre + estaño | 8 | Pradera | estaño (mena, ya no es tier) | rework de la Pradera: cobre → bronce → hierro |
| 3 | hierro | 14 | Pradera / Bosque | mena de hierro | |
| 4 | **acero** = hierro + carbón | 24 | Bosque | carbón | ya existe |
| 5 | plata | 34 | Pantano / Cumbres | mena de plata | |
| 6 | **alba** = plata + oro ★NUEVA | 42 | Cumbres / Desierto | **oro** (mena nueva) | |
| 7 | mitril | 50 | Cumbres | mena de mitril + carbón | |
| 8 | adamantita | 60 | Oriental | mena + carbón | |
| 9 | runita | 70 | Oriental / Volcán | mena + carbón | |
| 10 | oricalco | 78 | Volcán | mena + carbón | |
| 11 | **infernita** ★NUEVA | 85 | **Infierno** | mena infernal + carbón | pareja de la celestita |
| 12 | celestita | 92 | **Cielo** | mena + carbón | tier final celestial |
**DECIDIDO 26 oct (dueño): 12 tiers, sin «acero negro»** (estaba a 6 niveles del acero y no aportaba identidad). El Pantano se queda con acero y plata.
**Las aleaciones SOLO añaden METAL** (equipo cuerpo a cuerpo, herramientas, hojas). **(CORREGIDO 26 oct: el dueño eligió ampliar TODO a 12: madera `ceniza` nueva nv 89, pieles y telas nuevas; peces y hierbas siguen sueltos).** Para que arco y magia también «sientan» la mejora, las aleaciones dan **refuerzos** (cuero tachonado de acero negro, bastón con engarce de alba) como grado Reforzado del tier cercano; no tiers nuevos de cuero/tela.
**Qué hay que tocar al implementarlo (NO hacer hasta aprobar):** `TI` (game.js: renumerar niveles, quitar estaño como tier, 2 filas nuevas), `ACT.mi` (menas: estaño y oro como menas secundarias, hollín como nodo), tablas `ALV`/`HIDEOF`/`OFGEAR.G` (equipo de oficio ×12 en vez de ×11), `meas_progresion.py`, `craft_balance.py`, `ids_check.py`, iconos paramétricos (`craftgen3d.js`), e ids con la convención de `REGLAS_CREACION.md` §13 (`og_sm_m_<tier>` con ids de tier `cobre, bronce, hierro, acero, plata, alba, mitril, adam, runita, oricalco, infernita, celestita`).
**IMPLEMENTADO el 26 oct (opción B: todo a 12; ver lote REWORK-TIERS en AGENTS.md). HALLAZGO TÉCNICO que lo motivó:** el índice de tier `i` de `TI` (game.js l.76) está ACOPLADO 1:1 con la madera `WO[i]`/`WON[i]`, la piel `HID[i]`/`RAWN[i]`/`HIDN[i]`, la tela, los arcos/bastones/cañas (`bw_<madera>`, `st_`, `rd_`) y ≥ 10 arrays de 11 valores (`SV, AV, BV, STV8, TV, pr, GPER, AL…`); además las menas y zonas de `biomes.js` referencian índices de `ACT.mi`/`ACT.wc`. Pasar a 12 tiers NO es cambiar una tabla: hay que desacoplar la escalera de METAL (12) de la de MATERIALES orgánicos (11) o ampliar todo a 12. Ver las dos opciones en el lote REWORK-TIERS de AGENTS.md.

**★1: DECIDIDO** (aleaciones sí; los números exactos se afinan al implementar con `meas_progresion.py`).

## 3 · Los 10 oficios que faltan (qué pide cada uno al mundo)
Leyenda: **E** = estación y dónde · **IN** = entrada · **MID** = intermedio vendible con el que se sube · **OUT** = producto · **MUNDO** = lo que el mundo debe contener.

### 3.1 Herbolaria (`he`, recolección)
- **IN:** hierbas (nodos). **MID:** hierba limpia/seca/fibra (para Alquimia, Cocina, Sastrería, Inscripción). **E:** sin estación (la hoz se lleva); secadero opcional en la aldea. Recolección con rueda propia a diseñar («arrancar con cuidado») ★.
- **Nodos:** 1 hierba por tier (11) + 1 EXCLUSIVA por bioma + comunes (3: «manzanilla», «trébol», «ortiga»). Nv Herbolaria = nv del tier. Nombres provisionales por tier: 0 manzanilla · 1 trébol · 2 lavanda · 3 salvia · 4 helecho lunar · 5 loto · 6 genciana · 7 flor de escarcha · 8 brasa-flor · 9 ceniza viva · 10 flor del mundo (la exclusiva de cada bioma se elige al hacerlo).
- **MUNDO:** zonas de hierba con CONCENTRACIÓN por sentido del bioma (humedad en Pantano, claros en Bosque, laderas en Cumbres, dunas/oasis en Desierto); ≥ 3 zonas por bioma + 1 POI «claro de hierbas» (mini-zona rica con guardias).
- **DECIDIDO (27 oct, dueño): la herramienta NO es una hoz sino TIJERAS DE PODAR (una por tier, TOOLS.he).** Minijuego = «punto de corte»: un marcador sube/baja por el tallo y se pulsa LMB al pasar por el nudo (zona verde); en el punto = botín completo (+ semilla a veces), fuera = reducido; tier alto = zona más estrecha, la tijera del tier correcto la ensancha. La paleta/desplantador (raíces y bulbos) queda como complemento futuro.
- ★2: ¿la hoz es herramienta por tier (11) como la azada, o una sola con mejora de oficio?

### 3.2 Alquimia (`al`, proceso)
- **E:** Alambique (en la **Botica** de cada aldea; sala propia). **IN:** hierba + frasco (vidrio ★) + reactivo animal/mineral. **MID:** tinturas, aceites, reactivos (vendibles). **OUT:** pociones (vida, maná, resistencias, buffs `POT`), antídotos de los 10 estados (`STS`: sangrado, veneno, quemadura, ralentización, congelación…), pólvora para Ingeniería.
- **Hoja de trabajo propia** (no la de herrería): a diseñar con el dueño ★3 (el plan decía «Potion Craft simplificado»).
- **DECIDIDO (27 oct, dueño): ALQUIMIA COMBINA AMBAS IDEAS** — (1) el jugador ELIGE ingredientes (base + 1–3), cuyas PROPIEDADES deciden qué poción sale, y (2) la elaboración es un minijuego de DESTILACIÓN por pasos estilo *Kingdom Come: Deliverance 2* (moler, calentar con fuelle, verter…), donde hacerlo perfecto da calidad III y hacerlo mal, calidad baja o brebaje turbio. Requiere MÁS hierbas y más materiales de alquimia (reactivos animales, minerales, disolventes). Diseño detallado y lista de ingredientes: lote ALQUIMIA-DISEÑO en AGENTS.md. `src/alchemy.js` es un BORRADOR sin enchufar (recetas fijas); se rehace con este diseño.
- **MUNDO:** hierbas (Herbolaria), reactivos de fauna (veneno de rana, hollín de magma, colmillos), minerales (azufre en Volcán, sal en Costa). **Frascos:** ★4 ¿vidrio lo hace Alquimia (arena de Desierto/Costa), Escultor o se compra?

### 3.3 Cocina (`co`, proceso — ya existe como skill con recetas simples)
- **E:** Fogón/cocina (hoguera en el campo; cocina en la taberna). **IN:** carne (fauna), pescado, setas/frutos/cultivos, hierbas, sal. **MID:** ingredientes procesados (harina, masa, caldo, mantequilla, conservas). **OUT:** platos = buff largo (~30 min, uno activo) a Maña/Pulso/PO.
- **MUNDO:** carne y grasa PROPIA por animal de cada bioma (§5r), setas y frutos como nodos silvestres (1–2 por bioma), sal (Costa), especias (Oriental, Desierto). Agricultura aporta harina/verduras ★.

### 3.4 Escultor (`es`, proceso — `ACT.es` está VACÍO)
- **Decidido (§5r):** piedra y tallas. **E:** Banco de cantero (Taller; cantera en el campo ★5). **IN:** bloques de piedra. **MID:** losas, ladrillos, columnas (vendibles; sirven para casa del jugador y POI). **OUT:** tallas y adornos, estatuillas y mobiliario de piedra.
- **MUNDO:** NODOS DE PIEDRA por bioma con su material propio (granito, caliza, basalto, arenisca, mármol del Cielo): ★5 ¿la piedra es un nodo de Minería (la misma rueda, drop extra) o una recolección propia «cantera»? Recomendado: nodo de Minería de tipo `piedra` con cantera como POI.

### 3.5 Inscripción → Encantamiento (`ins`→`en`)
- **Decidido (22 oct):** Encantamiento SUSTITUYE a Inscripción (`ins` se retira cuando entre `en`). **E:** Mesa de encantamiento (Taller arcano / templo). **IN:** polvos (de desencantar equipo), tintas (Alquimia/Herbolaria), pergamino (piel curtida o papel ★6). **MID:** polvo, tinta, pergamino. **OUT:** encantamientos y ranuras en equipo, rollos de hechizo.
- **MUNDO:** reliquias/ruinas (POI) con equipo viejo para desencantar; cristales en minas; fauna arcana (Páramo).

### 3.6 Joyería (`jo`)
- **E:** Banco de joyero. **IN:** metal fino (plata, oro★7, mitril…) + gemas. **MID:** gemas talladas, engarces, aros (vendibles). **OUT:** anillos, amuletos, coronas (llenan las ranuras `r`, `r2`, `n` hoy sin fabricante).
- **Gemas (★8 propuesta, una por bioma + raras):** Pradera cuarzo · Bosque ámbar · Pantano jade · Cumbres zafiro · Oriental ópalo · Volcán rubí · Desierto topacio · Costa perla/coral · Páramo amatista · Cielo diamante. **Oro:** ¿existe el metal «oro» (hoy solo es la moneda)? ★7.
- **MUNDO:** vetas de gema en minas/cuevas (POI de mina), perlas en la Costa (pesca), geodas como nodo raro.

### 3.7 Ingeniería (`ing`, estilo WoW)
- **E:** Taller del ingeniero (Taller). **IN:** barras, engranajes (Herrería), pólvora (Alquimia), tela, cuero, gemas. **MID:** engranajes, resortes, mechas (vendibles). **OUT:** artilugios con enfriamiento, explosivos, trampas, mecanismos, mascotas mecánicas, dispositivos de viaje.
- **MUNDO:** casi nada propio: azufre (Volcán), cobre/hierro (ya), POI de «chatarra antigua» (Páramo/Oriental). Depende de Herrería+Alquimia+Sastrería ya definidos.

### 3.8 Domar (`do`) · decidido desde el Bosque
- **E:** Establo (aldea). **IN:** comida de domar + criatura. **OUT:** MONTURA y MASCOTA (2 ranuras dedicadas; las monturas acortan los viajes: a K=6 ≈ 14 min corriendo, ≈ 7 con montura).
- **MUNDO:** una criatura domable por bioma (★9 propuesta: Pradera caballo/poni · Bosque ciervo/lobo · Pantano lagarto gigante · Cumbres yak · Oriental tigre/grulla · Volcán salamandra · Desierto camello · Costa tortuga/foca · Páramo huargo) con zonas de aparición y nivel propio.

### 3.9 Agricultura y Apicultura (`ag`; la ÚLTIMA, posible descarte)
- **Decidido (§5n):** parcelas FIJAS por aldea y casa del jugador por bioma (no parcelas por jugador). **MID:** semillas, harina, miel, cera. **OUT:** cultivos para Cocina/Alquimia/Sastrería (lino).
- **MUNDO:** parcelas y colmenas en cada aldea; cultivos silvestres. ★10: ¿se mantiene o se descarta?

### 3.10 Desollar completo (`ds`, ya v1)
- **Hecho:** 7 animales, nv 1–64. **Falta:** cuchillo por tier (11), fauna hasta nv 95, grasa/hueso/objeto propio por animal.
- **MUNDO (§5r, la fauna más grande a añadir):** ver §4.

## 4 · Fauna por bioma (la lista del dueño, §5r) → lo que hay que crear
Cada animal: nivel, piel del tier de SU bioma, carne propia, hueso, grasa y un objeto único; tope de actores por zona (§P). **Hoy hay 7 desollables. A crear ≈ 60** (≈ 6 por bioma × 10). Para rendimiento: actores por SECTOR (streaming como `Resources`) — ver E3 pendiente.
| Bioma | Fauna propuesta (de §5r) |
|---|---|
| Pradera | vaca, oveja, cabra, cerdo, conejo, zorro, gallina |
| Bosque | ciervo, lobo, jabalí, oso pardo, tejón, búho, ardilla |
| Pantano | lagarto, cocodrilo, rana gigante, serpiente, garza, rata de pantano |
| Cumbres | yak, cabra montés, oso polar, lobo ártico, águila, zorro ártico |
| Oriental | tigre, ciervo sika, tanuki, macaco, grulla, jabalí de bambú |
| Volcán | salamandra de lava, lagarto ígneo, jabalí de ceniza, murciélago de fuego, escorpión volcánico |
| Desierto | camello, chacal, gacela, escorpión, serpiente de cascabel, buitre |
| Costa | foca, tortuga, cangrejo gigante, gaviota, lobo marino |
| Páramo | huargo, hiena, cuervo gigante, jabalí huesudo, ciervo demacrado, araña de páramo |
| Cielo / Infierno | corderos y cabras de nube, aves de luz / murciélagos y cabras infernales, cachorros de cerbero |
**★11 (decidido, ver §0):** ¿cuántos de estos son ENEMIGOS (combate) y cuántos pacíficos (caza/desollar/domar)? Propuesta: la mitad de cada bioma pacíficos (recolección) y la mitad hostiles + siempre 1 «élite» por bioma.
**Enemigos de combate nuevos por bioma** (humanoides/no-muertos/jefes, aparte de la fauna): hoy cada bioma tiene 3 + capitán + jefe; **objetivo: 9 tipos** (≈ 54 nuevos en 9 biomas). ★12 (decidido): 9 tipos por bioma con drops compartidos, capitán sí, jefe no en todos (ver §0).

## 5 · Estaciones por aldea (todos los oficios en TODAS las aldeas, repartidas por el bioma)
Hoy hay: tienda, banco, herrería/fragua, taller (Artesanía/Sastrería/Escultor), curtidor (dentro del Taller), tablón, cocina/taberna. **Faltan:** Botica (Alambique), Mesa de encantamiento, Banco de joyero, Taller del ingeniero, Establo, secadero de hierbas, parcelas. Reparto propuesto en 4 edificios por aldea + exteriores: **Botica** (Alquimia+Herbolaria) · **Taller** (Artesanía+Sastrería+Escultor+Peletería+Ingeniería) · **Herrería** (Herrería+Joyería) · **Templo arcano** (Encantamiento). **★13:** ¿te vale ese reparto o cada oficio tiene su edificio?

## 6 · Qué se genera en el MUNDO con esto (checklist que consumirá E3)
Por bioma: (a) zonas de Tala/Minería/Pesca de SUS tiers ✅ (existen) · (b) **zonas de hierba** (≥ 3) · (c) **cantera** y **zonas de gemas** · (d) **fauna** pacífica y hostil por sector · (e) **POI de recurso**: mina con veta rica, cueva con gemas, claro de hierbas, cantera, caladero, granja (nuevas plantillas de `POIGEN.TPL`) · (f) nodos que reaparecen en OTRO punto · (g) casa del jugador y estaciones en la aldea. Los POI de combate/exploración (campamento, ruina, cofre) YA están generados.

## 7 · Resumen de decisiones ★ para el dueño
1 tabla de 12 tiers con aleaciones (§2) · 14 ¿14.º tier «runacero»? · 2 hoz por tier o única · 3 minijuego/hoja de Alquimia y Herbolaria · 4 vidrio/frascos · 5 piedra: ¿nodo de Minería o cantera propia? · 6 papel/pergamino · 7 ¿metal «oro»? · 8 gemas por bioma · 9 criaturas domables · 10 ¿Agricultura sí o no? · 11 fauna pacífica vs hostil · 12 nº de enemigos nuevos por bioma · 13 edificios de oficio por aldea.
