# NotScape · PLAN DE LA ISLA DEL CIELO (isla del tutorial = base del bioma CIELO) · 21 oct 2026

> **Estado:** DIRECCIÓN DE ARTE hecha (demo visual) + plan de integración. **Nada de esto está en el juego todavía.** Demo: `docs/style-reference/r3d/isla-cielo.html` (abrir con el servidor `python tools/serve_nocache.py 8811`: `/docs/style-reference/r3d/isla-cielo.html?still=1`; `?ruins=1` = versión en RUINAS del endgame; `?az=grados`, `?zoom=`; arrastrar = girar, rueda = zoom, R = alternar ruinas).
> **Pedido del dueño (21 oct 2026):** la isla del tutorial será la base del último bioma (el Cielo); estará **delimitada por nubes (que queden bonitas)**, el **pasto es azul claro** y la **cultura es griega**; el resto de detalles los decide el agente (todo lo marcado **[PROPUESTA]** lo aprueba o cambia el dueño). Canon: `docs/LORE.md` §1b y `docs/GUION_TUTORIAL.md`.

## 1 · Dirección de arte (lo que muestra la demo)
- **Pasto azul claro:** `#9ed2ee` base, luz `#cdeeff`, sombra `#68a4cc`, con manchas grandes (ruido a escala de 9 tiles) y variación fina de hojas; briznas de hierba (conos de 4 caras, 4 tonos azul-hielo) y flores blancas/crema/rosa pálido/azul hielo. Nunca verde: es el rasgo del bioma. Sombras y fondo del bioma con el mismo azul (no negro).
- **Mármol cálido** `#f1ece0` / sombra `#ded8c8`, **dorado** `#e8cf94` (el MISMO dorado único del juego) para acentos (friso, braseros), **terracota** `#b8785a` para tejados y ánforas. El cielo de fondo es un degradado azul → marfil cálido.
- **Acantilado:** franjas de piedra clara (marfil/arena) bajo la hierba, con un bisel de ~1 tile (la hierba cae como un labio); el borde de la isla es irregular (contorno por ruido a 3 escalas, ±16 %).
- **NUBES (el borde):** racimos de 4–8 «puffs» (icosfera con ruido, aplastada en elipsoide) en **4 anillos concéntricos**: 1) pegados al acantilado, bajos y delgados (el filo se disuelve en nubes y se ve el cielo entre ellas), 2) y 3) intermedios que bajan, 4) mar de nubes lejano, grande y bajo; color blanco arriba → azul pálido `#bcd4e8` abajo (por altura); sombreado suave de 4 bandas con un toque emisivo azulado; ~170 racimos ≈ 900 instancias (**un solo `InstancedMesh`**, 1 draw call), deriva y respiración lentas (seno por nube, determinista) y una lámina base `#c4dbed` por debajo (nunca se ve el vacío). Para el juego: el anillo exterior puede ser el «mar» de `water3d.js` recoloreado y sin olas (`uDeep/uShal` blancos azulados).
- **Cultura griega (props):** templo períptero (3 escalones, 6×… columnas, arquitrabe, friso dorado, techo a dos aguas de terracota con frontón); **ágora** circular de mármol con columnata en U; **Altar Quebrado** = estatua alada de mármol con el **rostro borrado** (LORE §4) sobre pedestal con 4 braseros dorados (las 4 pilas del ritual); columnas sueltas, ánforas, lajas de mármol en el camino; **olivos** de copa azul-grisácea, **cipreses** azul-verdosos. **Versión RUINAS** (endgame, Fase 53): techo caído, columnas rotas con tambores en el suelo, alas de la estatua rotas.
- **Luz:** hemisférica cielo/mármol + sol bajo cálido del NO; sin noche profunda **[PROPUESTA]**: el Cielo vive en una hora dorada permanente (la fila `TOD` propia del bioma; la noche = azul más hondo, no negro, para respetar «lo ambiental nunca castiga»). *Pendiente ★ del dueño.*

## 2 · Mapa de la isla (zonas del guion §3 con nombres griegos **[PROPUESTA]**)
| Guion | Nombre griego | Qué enseña / contiene |
|---|---|---|
| Varadero | **Los Propileos** (llegada) | pórtico de 4 columnas sobre una plataforma de nubes; barca de viento encallada; Anselm |
| Claro | **El Olivar** | tala (olivos y cipreses como «árboles» del tier 1) |
| Veta | **La Cantera** | minería: cobre y estaño en vetas dentro del mármol (rocas claras con vetas de color) |
| Fogón | **El Ágora** | horno, yunque, hogar y fuente (pesca en la fuente de las ninfas = estanque); mercado de pega |
| Explanada | **La Palestra** | tres braseros-camino (espada/arco/báculo), maniquíes, dianas; entrenamiento de Grix |
| Altar Quebrado | **La Acrópolis** | el templo en la terraza alta, el altar y su arena circular (jefe Gabriel) |
| Senda de Ceniza | **La Escalinata** | el camino de bajada que se derrumba en «Escapa» |
Distribución (como en la demo): llegada al sur-oeste, ágora y palestra al centro-oeste, acrópolis (3 terrazas) al nor-este, olivar y cantera repartidos por el borde; **UN camino de lajas** casi lineal (guion §3) que lleva de los Propileos al templo.
**Personajes (DECIDIDO 21 oct: nombres de ÁNGELES; ver §7 «giro»):** 6 exiliados = 6 de los 7 arcángeles (libro de Enoc) + el jefe **Gabriel** (el 7.º). Sustituyen a los nombres del guion: **Raguel** (guía y banco; antes Anselm), **Sariel** (tala y minería; antes Tilda+Bruno), **Uriel** (fragua; antes Kessa), **Rafael** (pesca y cocina; antes Olo), **Miguel** (combate; antes Grix), **Remiel** (barquera de la huida; antes Wren). Bruno y Tilda se fusionan en Sariel (menos PNJ, más peso por personaje).

## 3 · Cómo se integra en el motor (hallazgos del 21 oct, leyendo el código)
1. **El mundo es una rejilla 3×3** (`BIOMES.GRIDPOS`, `CELL`, `API.own` indexan por `*3`); `BIOMES.N` se usa en bucles de progresión (`S.home`, «último jefe», runas); `coast.js` calcula UNA máscara de tierra con el rectángulo redondeado de TODO el mundo; `layouts.js` genera cada bioma con un CFG/KIT propio (aldea, rutas, guaridas); `world-iso.js`/`props.js`/`roadlamps.js`/`village-edit.js` recorren `BIOMES.list` y exigen `village.props/routes`.
2. **Diseño recomendado (zona aislada = 10.º rectángulo `zone:true`):** (a) `src/sky-biome.js` (después de `layouts.js`, antes de `world-scale.js`) crea `list[9]` clonando la forma de un bioma esqueleto y sobrescribe `id:'cielo'`, `zone:true`, paleta y `lay` de la isla; (b) `biomes.js`: columnas de la rejilla pasan de 3 a `API.COLS` (por defecto 3, 5 con la isla en la casilla `[4,1]`; la casilla 3 queda VACÍA como mar de nubes) y `N` de progresión se separa de `list.length` (`API.NP=9` para progresión, `list.length` para geometría); (c) `coast.js`: la máscara del continente usa solo las 3 columnas y una segunda máscara = la isla (blob de la demo, `landD`); lo demás es «mar» → nubes; (d) `world-scale.js` escala la isla ×K como al resto; (e) `BIOME_RULES` fila 9 (sin eventos de clima); `TOD` fila `cielo`; suelo azul en `materials3d.js` (`bi==9`) y arena→mármol en la orilla; (f) `S.home`/`spawnK`/`capKill` ignoran `zone`.
3. **Nubes en el juego:** `src/r3d/skyclouds3d.js` (portar `ring()` de la demo; 1 `InstancedMesh`, colores por instancia, cull por distancia a la cámara) + el mar exterior del 3D recoloreado; el borde jugable es un anillo de acantilado (colisión ya resuelta por `TER.cliffNear`) con nubes delante: **no se puede caer** (regla del dueño: lo ambiental nunca castiga).
4. **Props griegos:** `src/r3d/propsdark_cielo3d.js` con el contrato de módulo de props (1 tile = 1 unidad, origen en el centro de la huella, `darkGeo` con la misma firma, `clipReport` y regla ANTICLIP del techo con `B.gable`; verificar con `props_sheet.py --medir` y `roof_clip_check.py`). Modelos: `columna`, `columnaRota`, `templo`, `propileos`, `agora`, `estatuaAlada`, `brasero` (dorado), `anfora`, `fuente`, `olivo`, `cipres`, `banco`, `estela`.
5. **PNJ y objetos:** cultura 9 (griega) en `villagers.js` (`CU`), `NPC_DEF` de los 7 exiliados (reglas de PNJ de AGENTS.md), `PALS`/interiores si hay templo visitable.
6. **Tutorial:** zona instanciada del guion (`zone:true`, una sola vez, se «hunde» al terminar; reaparece como el bioma Cielo en RUINAS y mucho más grande en la Fase 53 → los datos de la isla se diseñan ya como «mismo rectángulo, restaurada/en ruinas» con el flag `ruins`).

## 4 · Lotes propuestos (uno por mensaje; cada uno termina con captura y «qué probar»)
- **ISLA-0 ✅ (este lote):** demo de arte + este plan.
- **ISLA-1 · motor de zona:** `API.COLS`, `API.NP`, `sky-biome.js` (isla vacía con spawn), máscara de isla en `coast.js`, `CHEAT.tp('cielo')`; 0 errores y el mundo existente idéntico (comparar con `?zone=0`).
- **ISLA-2 · suelo y nubes:** pasto azul + acantilado de estratos + anillo de nubes + mar de nubes en el 3D real; fila `TOD` del Cielo.
- **ISLA-3 ✅ (21 oct 2026) · arquitectura griega de MÁRMOL:** `propsdark_cielo3d.js` (columnas, templo, propíleos, ágora, estatua, braseros, ánforas, estela, banco) + ruinas; colocados en `sky-biome.js`. Ver el lote en AGENTS.md. Faltan olivos/cipreses (ISLA-4, `FOL.<especie>`).
- **ISLA-4 ✅ parcial (21 oct 2026: olivar, cantera, fuente, estaciones y camino de lajas; los 6 exiliados llegaron en ISLA-4b, 21 oct) · vida:** olivar/cantera (recursos), estaciones (horno, yunque, fogata, fuente), los 7 exiliados con cultura griega, camino de lajas.
- **ISLA-5 ✅ parcial (21 oct 2026: motor + 24 pasos jugables con cinemática; combate de Gabriel hecho en ISLA-6; faltan compuertas, niveles despiertos y arranque en la isla; ver AGENTS.md) · tutorial sobre la isla:** motor de misiones por pasos + niveles «despiertos» + jefe Gabriel + «Escapa» + empalme con la cinemática `caida` (`CINE`).

## 5 · Decisiones del dueño (21 oct 2026) ✅
1. **Hora dorada PERMANENTE** en el Cielo (fila `TOD` fija; sin noche).
2. **Exiliados con nombres de ángeles** y un **plot twist** planeado (§7).
3. **Nombre: «El Cielo»** (bioma del endgame y, por extensión, la isla del tutorial; los textos de la isla dicen «la isla»).
4. **Tamaño ≈ 1/6** del Cielo final y **diseño al estilo Tutorial Island de OSRS**: bien estructurada, el jugador completa tareas en orden (§6).

## 6 · DISEÑO DE JUEGO: «el camino del despertar» (estructura tipo Tutorial Island de OSRS)
**Principios (qué hace buena a la isla de OSRS y cómo lo copiamos):** (1) **un solo hilo**: siempre sabes qué hacer (línea de objetivo del HUD + flecha dorada `goalTgt` + brillo en el icono del menú nuevo); (2) **cada tarea enseña UNA cosa y se demuestra haciéndola**; (3) **el mundo se abre por compuertas** (aquí: BANCOS DE NUBES que se apartan al completar el capítulo, §6.3); (4) **una persona = un oficio** (PNJ-maestro, tarea corta, frase corta, regalo de herramienta); (5) **el resultado de un capítulo es la entrada del siguiente** (las 4 ofrendas del ritual salen de los oficios); (6) **nada se pierde ni se atasca** (herramientas re-entregadas, menas/árboles reaparecen, sin muerte ni castigo); (7) **poco texto**: una frase por diálogo y una pista breve en el momento que importa (regla permanente del dueño).

### 6.1 Escala y forma
- Isla = elipse de **≈ 64×48 tiles** (rx 32, ry 24; ≈ 2 400 tiles² de tierra) con contorno irregular (el de la demo) dentro de la casilla del bioma (144×94 tiles con `?wk=2`). El Cielo del endgame ≈ 6× (≈ 14 400 tiles² ≈ 1 bioma) con esta isla como su **esquina suroeste en ruinas** (misma geometría, flag `ruins:true`). *La demo usa un radio de 40 solo por composición: al integrar, la elipse de arriba.*
- **Ritmo:** 25–35 min la primera vez; ≈ 190 tiles de camino (≈ 3 min de caminar puro a 70 px/s); cada zona está a ≤ 25 tiles de la anterior. Coordenadas en tiles relativas al centro de la isla (x → este, y → sur).

### 6.2 Capítulos, tareas y puertas (24 tareas; el texto es la línea de objetivo del HUD)
| Cap. | Zona (centro tile) | Maestro | Tareas (en orden) | Qué enseña / «despierta» | Puerta que se abre |
|---|---|---|---|---|---|
| **0 · Llegada** | **Propileos** (−26, 12), plataforma 8×6 | **Raguel** (−23, 10) | 1 Habla con Raguel · 2 Camina hasta la columna dorada (a 8 tiles) · 3 Corre hasta el arco (R, 20 tiles) · 4 Recoge el **kit del exiliado** del cofre (hacha, pico, caña, martillo) y mira la Mochila · 5 Vuelve con Raguel | mover/clic/WASD, correr, cámara (`,` `.`), Mochila | **Banco A** (−20, 6) |
| **1 · Manos de tierra** | **Olivar** (−22, −2), 12×14 → **Cantera** (−12, −16), 12×8 | **Sariel** (−19, −1) y (−9, −14) | 6 Tala 3 troncos de olivo · 7 Mina 2 de cobre y 2 de estaño | **Tala** y **Minería** 0→1 («despierta»); objetos al suelo/mochila; el recurso se agota y vuelve | **Banco B** (−17, −10) tras el olivar · **Banco C** (−5, −15) tras la cantera |
| **2 · Fuego** | **Ágora** (2, −6), r 9 | **Uriel** (1, −9) | 8 Funde una barra en el horno · 9 Forja una hoja en el yunque (la «hoja» del ritual) | **Herrería** 0→1; usar estaciones (menú de la estación, receta) | (el Ágora ya está abierta) |
| **3 · Agua y cocina** | **Fuente de las ninfas** (7, 0) + fogata (−1, −4) | **Rafael** (7, 1) | 10 Pesca 2 camarones en la fuente · 11 Cocínalos en la fogata (minijuego) → la «ofrenda» | **Pesca** y **Cocina** 0→1; minijuego de cocinar; la comida cura | **Banco D** (10, 2) |
| **4 · La Palestra** | **Palestra** (14, 10), 14×10; orilla sur (20, 18) | **Miguel** (14, 10) | 12 Elige un brasero (espada · arco · báculo) y supera su prueba (maniquí / diana / círculo) · 13 Derrota 3 **cangrejos de nube** · 14 Come cuando te hieran (Miguel te roza) · 15 Esquiva el golpe pesado telegrafado | camino (`S.path`: Combate/Arquería/Magia 0→1), clic para atacar, barra del objetivo, comer en combate, esquivar el aviso rojo | **Banco E** (20, 2) |
| **5 · El cofre** | **Pie de la Escalinata** (22, −2) con el **banco** | **Raguel** (22, −3) | 16 Deposita todo en el cofre (banco) · 17 Saca las 4 **ofrendas** (leña, mena, hoja, ofrenda cocinada) · 18 Habla con Raguel: «el Altar» | banco: depositar/sacar; qué es el ritual | **Banco F** (24, −6) |
| **6 · El ritual** | **Acrópolis** (20, −16), 3 terrazas, arena r 7 | **Gabriel** (jefe) | 19 Sube la escalinata · 20 Coloca las 4 ofrendas en los 4 braseros (cada una enciende un brasero y la estatua recupera un rasgo) · 21 Habla al altar (aparece Gabriel) · 22 Derrota a Gabriel (cinemática `CINE 'caida'`, `S.cine.gabriel`) | golpes pesados, comer, estilo del camino | — |
| **7 · Escapa** | **Escalinata y senda este** (24→32, −8→0) | **Remiel** (32, 0) con la barca de viento | 23 Corre hasta Remiel (3 tramos: olivar en llamas, puente de nubes que se rompe, frente de fuego; sin daño: caer = punto de control) · 24 Sube a la barca | correr con un objetivo con tiempo | transición al **Acto 7** (Pradera) |

**Objetos del capítulo → ritual:** `leña` (cap. 1) · `mena` (la 2.ª de estaño sin fundir) · `hoja` (cap. 2) · `ofrenda` (cap. 3). Si el jugador pierde o consume uno, el maestro del oficio lo re-entrega gratis (anti-atasco).

### 6.3 Compuertas = BANCOS DE NUBES (la firma visual del tutorial)
- Cada puerta es un **banco de nubes** (racimo de puffs de la demo, más denso y con un tenue brillo dorado) que ocupa un paso de 4–6 tiles y **bloquea** (rectángulo de colisión en `blk`) hasta completar su capítulo. Al abrirse: campana, los puffs suben y se apartan en ≈ 2,5 s, el rectángulo desaparece y la **cámara** hace un paneo corto al nuevo camino (`CINE`, ≈ 1,8 s, saltable). Sirven además de **niebla de curiosidad**: de lejos se adivina la forma de la zona siguiente medio tapada.
- Datos: `ISLA.GATES=[{id:'A',r:[x0,x1,y0,y1],open:'step>=5'},…]` en tiles locales; se pintan con el mismo `skyclouds3d.js` del borde (instancias con flag `gate`).

### 6.4 Estado, datos y guardado
- `S.isla={step:0..24, done:{…}, kit:1, path:null, t:{cap:seg}}` (se guarda). `ISLA.STEPS` = tabla de DATOS del **motor de misiones por pasos** (el mismo de las questlines de cada bioma): `{id, cap, npc, say:[1 frase], goal:{t:'talk|reach|got|kill|use|place|bank|eat|dodge', k, n}, hint:'icono del menú a resaltar', gate:'A'|null, flag?}`. El HUD muestra solo la tarea actual y «Despertar n/N» (barra lineal de los oficios).
- **Niveles:** todos en 0; el primer éxito de cada oficio lo despierta a nivel 1 y la XP se recorta justo bajo el nivel 2 (`S.awk`, guion §2). Al terminar: nivel total = nº de oficios; se pierde todo lo de la isla salvo el fragmento (`S.cine.gabriel`, objeto «Fragmento del tiempo»).
- **Saltar el tutorial:** opción del editor de personaje (despierta todos los oficios a 1 y lleva a la Pradera; marca `S.cine.gabriel` para no repetir la escena).

### 6.5 Pistas, ayudas y anti-atasco
- **Pista breve en el momento que importa:** al entrar una mecánica nueva, el icono del menú correspondiente **late** en dorado (Mochila, Personaje, Habilidades…) y sale una línea de 1 frase; nada de párrafos.
- **Flecha dorada** al objetivo de la tarea actual (como `goalTgt` de hoy) y marcador «!» sobre el maestro que toca.
- **Sin atascos:** herramientas siempre re-entregadas; recursos infinitos en la isla (reaparecen en 5 s); sin muerte (el golpe se «detiene», guion §2); sin forma de salirse del mapa (acantilado + nubes); se puede volver atrás por zonas ya abiertas.
- **Telemetría de balance:** `S.isla.t[cap]` (segundos por capítulo) para ajustar con `tools/meas_progresion.py`.

### 6.6 Requisitos nuevos que salen de esta estructura (para los lotes)
Cangrejo de nube (cuadrúpedo nuevo, ≈ nivel 1; hoy NO existe ningún cangrejo en `MD`), maniquí/diana/círculo de práctica, banco de nubes (prop con colisión animada), fuente de las ninfas (agua tipo «estanque» con estación de pesca), cofre-kit, 4 braseros del ritual + estatua que recupera rasgos, barca de viento de Remiel (modelo y animación), marcadores de ruta (arco, columna dorada), objeto «Fragmento del tiempo».

## 7 · PLOT TWIST (PROPUESTA ★ sin canon hasta que el dueño la apruebe)
**Base propuesta:** los 6 «exiliados» son **6 de los 7 arcángeles** (Raguel, Sariel, Uriel, Rafael, Miguel, Remiel), sin alas ni halo, castigados con el exilio por **dudar** (LORE §1: «quien pensaba distinto del rebaño era castigado con el exilio»); **Gabriel** es el 7.º, el que se quedó de vigía de la isla. Te enseñan los oficios porque necesitan que el recién llegado esté listo… **¿para qué? (pregunta abierta ★, es canon y es del dueño):** A) reunir la fuerza para «liberar el mundo»; B) porque ya han visto caer a otros antes; C) porque fueron ellos quienes entregaron a Nul'ru en el primer sacrificio.
**Pistas sembradas en el tutorial (sutiles, solo en DATOS/DESCRIPCIONES, sin diálogo explícito):**
| PNJ | Pista | Dominio angélico (se descubre después) |
|---|---|---|
| Raguel | ordena sin mandar; se santigua al mirar la Acrópolis | justicia y orden (guía y banco) |
| Sariel | una cicatriz recta en cada omóplato bajo la capa; trabaja mirando la luna | la tierra y la luna (tala/minería) |
| Uriel | las chispas de su forja suben en vez de caer; no se quema | el fuego (fragua) |
| Rafael | lo que cocina cura un poco más; nunca come | la curación (pesca/cocina) |
| Miguel | no soporta que bajes el arma; mira siempre al norte | la guerra (combate) |
| Remiel | guía con una lámpara sin llama; casi nunca habla | la esperanza y las visiones (huida) |
**Dónde se revela (propuesta):** (1) la frase de Gabriel «Ahora también estarás maldito» ya los incluye a todos; (2) en el **Cielo en ruinas** del endgame hay 7 estatuas aladas en la Acrópolis, 6 con el rostro borrado y un pedestal con 7 nombres, los 6 que oíste (la revelación se lee, no se explica); (3) reliquias con descripciones ambiguas estilo Dark Souls («Pluma de Uriel: no ardió nunca»).
**Sigue abierto:** el papel de Ru/Nul'ru en el giro (Ru NO está en la isla, decisión del dueño), qué quieren de verdad los arcángeles, y si el jugador es también un ángel exiliado. **No escribir diálogos de revelación sin aprobación.**

### 7b · DECISIÓN DEL DUEÑO (21 oct, tarde) sobre el «porqué»: el jugador APARECE EN EL CIELO PORQUE MURIÓ
> «Me enseñan porque pienso que si aparezco en el cielo es porque morí.» → **el jugador está muerto**. Los arcángeles (exiliados) le enseñan los oficios porque es un **alma recién llegada**. Esto sustituye a las opciones A/B/C de arriba como base; lo que sigue son **sugerencias del agente (todas [PROPUESTA], el dueño elige)** para encajarlo con lo ya decidido y con lo que falta.

**1 · Encaje con el canon ya fijado**
- *Isla fuera del tiempo y «cien años» (fragmento del tiempo):* encajan sin tocar nada: las almas no cuentan los años; el fragmento del tiempo es lo que permite volver al mundo mortal en otro momento. «Hibernación» pasa a ser «tu cuerpo ya no estaba» (ambiguo a propósito).
- *«Ahora también estarás maldito. Ve a liberar el mundo.»*: Gabriel es el **juez/portero** de las almas; matarlo es **escapar del más allá** (el jugador se vuelve un «muerto que camina»). «Ahora también» incluye a los arcángeles exiliados: todos están malditos por **dudar** (LORE §1: el exilio).
- *Exiliados (LORE):* «solo los exiliados pueden recibir la llamada del sacrificio»: el jugador, al morir y rechazar el juicio, **queda exiliado del paraíso** de verdad; no hace falta que fuera «exiliado» en vida.
- *Ru = Nul'ru:* Ru te «saca» al otro lado (el fragmento del tiempo reconoce su voz): sigue siendo secreto; no choca.
- *Niveles 0 y «se pierde todo»:* lo que las almas llevan = nada; todo el tutorial es literalmente «aprender a vivir otra vez».

**2 · Mecánicas que ganan sentido (lo que sugiero aprovechar)**
1. **Óbolo (moneda en la boca):** el jugador empieza con una moneda **que no se puede gastar**; Remiel la toma como pasaje de la barca; luego reaparece como la **moneda de muerte** del juego real (Fase 29): morir = pagar al barquero para volver. Griego, simple y explica por qué mueres sin consecuencias graves.
2. **Pistas visuales de que estás muerto** (sin decirlo): el héroe **no proyecta sombra** en la isla, **no sale su reflejo** en la fuente, los PNJ jamás le ofrecen comer «para vivir» sino «para practicar», no hay hambre ni cansancio (ya es regla del juego: NO survival), y el HUD de vida **no baja de 1** en el tutorial (el golpe se «detiene», guion §2). Todo con datos, sin texto nuevo.
3. **Tu cuerpo en el mundo real:** al despertar en la playa de la Pradera (Acto 7) el jugador está **sobre su propia tumba** o junto a un cuerpo cubierto de arena y musgo que desaparece al acercarse (el «cuerpo hibernado» del guion). Un detalle de 3 s: la cámara baja a un cuerpo y se funde.
4. **Cielo del endgame = el paraíso verdadero** (en ruinas): las estatuas de los 7 arcángeles, el altar y el anillo de nubes son lo que quedó tras «el cielo ardió». Volver como un **muerto** con poder para reabrirlo es el clímax.
5. **Los cuatro oficios del ritual = las 4 cosas que le faltan a un alma para ser juzgada** (leña = calor, mena = cuerpo, hoja = voluntad, ofrenda = sustento): se puede explicar en un único descubrimiento tardío (descripciones de objeto).

**3 · Cómo se revela (3 niveles, de más a menos obvio; elige el dueño)**
- **A · «lo intuyes tú»** (recomendado): ninguna frase lo dice; la suma de pistas (sin sombra, sin reflejo, óbolo, Remiel, barca) hace que el jugador **sospeche solo** (justo lo que el dueño piensa de sí mismo como jugador). La confirmación aparece en el Cielo en ruinas (7 estatuas, 6 nombres) y en una reliquia.
- **B · «te lo insinúan los PNJ»:** una frase ambigua por maestro («Aquí nadie tiene prisa. Tú tampoco la tendrás.»).
- **C · «lo dice Gabriel» al morir** (en la cinemática `caida`): cambiaría su frase canónica → NO recomendado (la frase está fijada por el dueño).

**4 · Sugerencias para «lo demás» (cosas que aún no están decididas y que conviene decidir pronto)**
1. **Los nombres:** (a) decirlos desde el principio (Raguel, Sariel, Uriel, Rafael, Miguel, Remiel; el jugador occidental reconocerá a Miguel/Rafael y se verá venir el giro: **no es malo**, es una pista más); (b) usar solo **epítetos** en el tutorial («el Guía», «la de la Tierra», «el del Fuego», «el Sanador», «el Guerrero», «la Barquera») y revelar los nombres al final; propongo (b) + (a) en el endgame.
2. **La voz de los arcángeles:** pocos, sobrios, con una **cojera de fe** (frases que se cortan al hablar del cielo). Escribirlos con `docs/LORE.md §3` como guía; un tic por cada uno.
3. **Los otros muertos:** ¿hay más almas en la isla (figuras translúcidas que repiten un gesto, **sin diálogo**, como «ecos»)? Daría ambiente y una pista de que otros llegaron antes (y no salieron). Barato: PNJ sin colisión, material semitransparente dorado.
4. **Opción de saltar el tutorial:** ya decidido; en ese caso el jugador «ya conoce el camino»: se salta la isla y el óbolo se da al empezar.
5. **Música:** coro suave en la isla, cuerdas graves en la Acrópolis; la pieza del jefe sin coro (silencio, el coro se calla al caer Gabriel).
6. **Pruebas de balance del tutorial:** medir el tiempo por capítulo (`S.isla.t`) y quitar tareas que pasen de 4 min.
7. **Rejugar el tutorial:** una vez (la isla se hunde). En el endgame vuelve en ruinas como zona nueva, **sin** tareas.
8. **Seguridad de canon:** dejar fuera de cualquier texto del juego la palabra «muerto/morir» al hablar del jugador hasta el endgame; el tutorial solo sugiere.
