# PLAN DEL CONTINENTE — qué falta para que el mundo nuevo esté «vivo» (29 oct 2026)

> Contexto: desde el 29 oct 2026 el mundo por defecto es el continente del **mapa A a K=6** (≈ 3 815 × 3 494 tiles, 9 biomas + Cielo; `docs/PLAN_MUNDO_ABIERTO.md` «Tamaño final»). Técnicamente funciona (aldeas, caminos A*, puentes, ríos, costa, POI generados, cuevas, minas, atalayas, niebla, mapa). Lo que falta es **contenido, identidad y paisaje**. Este documento ordena TODO lo pendiente en fases con entregables y criterios de aceptación, e incluye el sistema de **landmarks (hitos) y puntos de interés (POI) por bioma** que pidió el dueño.
> Reglas que mandan sobre todo (no se repiten): rendimiento = prioridad 1 (`REGLAS_CREACION.md` §P, `R3D.budget()` en Media y Alta antes de entregar); **nada de assets reutilizados** entre enemigos/fauna/PNJ y casas de instalación distintas por bioma; todo por código; datos por tabla, nunca `if` por bioma; sentido y escala (REGLA DE SENTIDO); `tools/rules_check.py` en verde; cada entrega actualiza `AGENTS.md` y `docs/HOJA_DE_RUTA.md`.

## 0. Estado de partida (lo que YA hay)
| Pieza | Estado |
|---|---|
| Mundo, costa, regiones, ríos, lagos, cordilleras, caminos A* + puentes, niebla y mapa | ✅ (E-MAPA-1…5, E5, E6) |
| Aldeas | Pradera y Bosque por barrios; las otras 7 heredadas (aldea del rectángulo, sin barrios) |
| POI generados (`poi-gen.js`) | `camp`, `ruina`, `cofre`, `mina`, `cueva`, `atalaya`; ≈ 260 a K=6, **mismo decorado en todos los biomas** |
| Relleno por región (`mapa-a-fill.js`) | tala, vetas, fauna genérica, pesca en ríos |
| **Paisaje fuera de los rectángulos** | ✅ HECHO en este lote (ver §1) |
| Fauna y enemigos propios | solo Pradera |
| Estaciones de oficio y Establo | en todas las aldeas (Establo ✅) |

---

## 1. FASE P1 · PAISAJE Y DENSIDAD (HECHA en parte el 29 oct; lote MUNDO-PAISAJE)
**Hecho:** decoración dispersa por región (`props.js`, ≈ 20 000 props con la tabla `SCR` de cada bioma), densidad de tala/vetas/fauna subida en `mapa-a-fill.js`. Medido: carga +0,3 s, `R3D.budget()` ok (1,05 M tris / 163 llamadas en la Costa).
**Falta de P1 (orden):**
1. **P1.b · Más variedad de naturaleza** (modelos nuevos en `propsdark_nat3d.js`, cada uno con paleta por bioma y huella medida con `nat_sheet.py --medir`): `hierba/matas`, `flores`, `helecho`, `cactus`, `arbolMuerto`, `cristalHielo`, `coral/conchas`, `rocaVolcánica con grietas`, `columnaBasalto`, `piedraRúnica`, `duna/costra de sal`, `nenúfares/lirios`. Meta: ≥ 8 especies decorativas por bioma (hoy 4–6 y repetidas entre biomas).
2. **P1.c · Relieve suave por región** (colinas, vaguadas, mesetas, dunas, escarpes bajos): campo de altura por ruido de baja frecuencia en `world-iso.js tileH` (solo `?map=A`, solo fuera de rectángulos), respetando vados, caminos y aldeas; debe pasar `cliff_check`/`village_check` y la regla «el terreno dibujado decide qué bloquea». Entregable: colinas de 1–2 niveles, sin escalones imposibles.
3. **P1.d · Lagos y charcas fuera de los rectángulos** (pesca, fauna de agua, reflejos) y **orillas con vida** (juncos, patos, peces ambientales).
4. **P1.e · Árboles de relleno de bosque**: las regiones boscosas solo tienen zonas `wc` (talables); añadir masa arbórea decorativa (no talable) con instancias baratas para que el Bosque y el Pantano se lean como bosques de verdad.
5. **P1.f · Transiciones entre regiones**: mezcla de paleta/suelo/vegetación en la frontera (hoy corte seco entre tablas `SCR`), clima y luz por región (`TOD` por bioma), partículas de ambiente propias (polen, ceniza, nieve, arena).
**Aceptación P1:** recorrer 5 minutos cualquier región sin ver «llanura vacía»; `R3D.budget()` ok en Media/Alta; carga ≤ +1 s; consola limpia; capturas por bioma aprobadas por el dueño.

---

## 2. FASE P2 · LANDMARKS Y PUNTOS DE INTERÉS (pedido del dueño, 29 oct 2026)
### 2.1 Vocabulario (todo es DATOS en `POIGEN.TPL` / una tabla nueva `LANDMARKS`)
- **HITO / LANDMARK (nuevo):** estructura singular, **única por bioma o región**, de silueta reconocible **a distancia** (≥ 25–60 tiles), con luz/columna visible de noche; sirve para orientarse, es destino de misiones y se **revela en el mapa** al verla o al acercarse. 3 grandes + 4–6 menores por bioma (decidido el 29 oct). No tiene combate obligatorio; puede tener un secreto o un guardián opcional.
- **POI de TIER 1 (descubrimiento):** pequeños (3–8 props), baratos, abundantes: monolito, cairn, pozo, estatua rota, cadáver con nota, claro con setas, árbol grande con hueco, charca curativa.
- **POI de TIER 2 (encuentro):** campamentos/ruinas/guaridas con guardias del bioma y cofre (ya existe `camp`, `ruina`, `cofre`).
- **POI de TIER 3 (mazmorra corta):** cuevas profundas, minas con veta, torres/criptas con interior (reusa `CAVEGEN`/`interiors3d`), élite y recompensa propia.
- **Rasgos de paisaje con función:** mirador (revela el mapa en un radio: la `atalaya` actual), santuario (bendición temporal), fuente/oasis (recupera aguante), portal/atajo de la región (futuro viaje rápido).
### 2.2 Sistema técnico (a construir)
1. **`src/landmarks.js`** (global `LM`): tabla de datos por bioma `{id, n, cultura, modelo, huella, altura, luz, mapIcon, reveal, hook}` + colocación determinista por semilla en la región (no en rectángulo de aldea, tierra pisable, visible desde llanura: se prefieren cotas altas y claros; separación mínima 700 tiles entre grandes hitos).
2. **Modelos** en `propsdark_<bioma>3d.js` (un módulo por bioma, misma firma y `clipReport`; contrato de props; huella medida) **altos** (hasta 12–20 u) con `aEmit` para la luz nocturna. LOD: son pocos (≈ 30 en el mundo), instancias únicas, dentro del presupuesto §P.
3. **Descubrimiento:** al entrar en su radio → zona de descubrimiento (`ZS` con `hito`), aviso con el letrero deslizante `RECN.unlock`, XP de exploración, icono permanente en mapa/minimapa (iconos 2D por tipo en `worldmap.js`), y entrada en un **Diario de exploración** (logros por bioma: «descubre todos los hitos de la Pradera»).
4. **Visibilidad a distancia:** `cull` y sectores deben dibujar los hitos más lejos que los props normales (radio propio) sin romper el streaming (E2); sombra desactivada para hitos lejanos; silueta/niebla de distancia.
5. **Navegación:** brújula/bandera ya existe (E-MAPA-5): permitir marcar un hito descubierto desde el mapa. **Viaje rápido** (decisión del dueño: fase posterior) se apoyará en hitos/portales descubiertos.
6. **Misiones y lore:** cada hito lleva un gancho de `docs/LORE.md` y 1 misión corta (tablón/PNJ) — el canon lo escribe el dueño; el agente propone, no inventa lore.
### 2.3 Catálogo por bioma (DECIDIDO el 29 oct: **3 GRANDES hitos + 4–6 menores por bioma**, algunos con enemigos según el hito; nombres y lore los fija el dueño)
Leyenda: ⚔ = con enemigos/guardián (según el hito: élite, jefe opcional, nido) · 🏚 = con interior (cripta, torre, cueva corta) · 💡 = luz/columna visible de noche · 🔮 = gancho de misión/lore. Los POI de tier 1–3 salen aparte de las plantillas (§2.1) y rellenan el espacio entre hitos.
| Bioma | 3 GRANDES hitos | 4–6 menores |
|---|---|---|
| **0 Pradera** | **Torre del Vigía** de piedra en una loma 💡🔮 · **Roble del Pacto** (árbol enorme con mesa de piedra, punto de reunión) 🔮 · **Fortín de los Bandidos** en ruinas ⚔🏚 | Molino abandonado · Menhires en círculo · Granja quemada ⚔ · Pozo del Espantapájaros (cofre) · Puente de piedra antiguo · Cementerio de caravana |
| **1 Bosque** | **Árbol Madre** (gigante, luz verde nocturna) 💡🔮 · **Claro de las Hadas** (arco de raíces, santuario) 🔮 · **Nido de la Reina Araña** ⚔🏚 | Puente colgante · Cabaña del ermitaño · Tocón-trono · Cueva de osos ⚔ · Fuente curativa · Campamento de cazadores |
| **2 Pantano** | **Torre hundida** (inclinada, faroles fatuos) 💡🏚 · **Poblado sobre pilotes** abandonado ⚔ · **Cementerio de barcos** (casco enorme) 🔮 | Tótem gigante · Isla de la bruja ⚔ · Charca tóxica · Ruinas con rana gigante ⚔ · Cueva inundada 🏚 · Pasarela rota |
| **3 Cumbres** | **Fortaleza nórdica en ruinas** en el paso ⚔🏚 · **Arco de roca del Gigante** (paso natural) 🔮 · **Faro de hielo** (atalaya helada con luz azul) 💡 | Mamut congelado · Mina enana ⚔🏚 · Cueva de yetis ⚔ · Cairn con cuerno · Ermita del monje · Puente de cuerda |
| **4 Oriental** | **Gran Torii** (puerta roja sobre el camino) 💡🔮 · **Pagoda de cinco pisos** 🏚⚔ · **Templo de la cascada** 🔮 | Jardín de cerezos eternos · Dojo abandonado ⚔ · Camino de linternas 💡 · Cementerio de samuráis ⚔ · Casa de té · Santuario kitsune |
| **5 Volcán** | **Chimenea del volcán** (columna de brillo y humo, visible a 100+ tiles) 💡 · **Forja infernal en ruinas** ⚔🏚 · **Altar demoníaco** (círculo de brasas) ⚔🔮 | Puente de basalto sobre lava · Fumarolas curativas · Mina de obsidiana ⚔ · Campamento de salamandras ⚔ · Grieta con cofre · Coloso de piedra caído |
| **6 Páramo** | **Monolito flotante** (piedras en órbita, luz violeta) 💡🔮 · **Torre del arcanista caído** ⚔🏚 · **Biblioteca derrumbada** 🏚🔮 | Círculo de runas · Sala de espejos 🏚 · Piedras flotantes · Campamento de espectros ⚔ · Mina de piedra astral · Estatua llorosa |
| **7 Desierto** | **Pirámide** 🏚⚔ · **Esfinge** (acertijo/misión) 🔮 · **Ciudad enterrada** (calles bajo la arena) ⚔🏚 | Oasis (aguante) · Obelisco 💡 · Caravana varada · Mirador de dunas · Nido de escorpiones ⚔ · Mina de oro |
| **8 Costa** | **Faro gigante** (haz giratorio) 💡🏚 · **Barco pirata encallado** ⚔🏚 · **Isla del tesoro** (archipiélago; tras la questline del barco) ⚔🔮 | Cueva de contrabandistas ⚔🏚 · Arrecife de coral · Naufragio · Campamento pirata ⚔ · Cofre en la playa · Mina de sal |
| **9 Cielo** | (ya hecho: templo, ágora, Altar Quebrado) | — |
Total: **27 grandes + ≈ 45 menores** (≈ 72 hitos). Los ⚔ reutilizan `POIGEN` (guardias del bioma, élite, cofre) y los 🏚 reutilizan `CAVEGEN`/`interiors3d` (planta por semilla, sala 3D). Un hito ⚔ es opcional (nunca bloquea el paso) y el jefe/élite de cada bioma puede vivir en uno de sus grandes (decisión del dueño: los jefes son hito, no llave).
### 2.4 Cantidades objetivo (K=6)
Hitos: 27 grandes + ≈ 45 menores (3 + 4–6 por bioma, decidido). POI: ≈ 60–70 por bioma (hoy ≈ 25–30 genéricos), repartidos por tier (≈ 60 % tier 1, 30 % tier 2, 10 % tier 3). Densidad objetivo: **un hito o POI cada ≈ 60–90 s caminando** por cualquier región.
### 2.5 Entregas por lotes (cada una con captura, `R3D.budget()` y `rules_check`)
1. **P2.1 · Sistema** (`landmarks.js`, descubrimiento, iconos de mapa, revelar niebla, diario) + el hito de la **Pradera** completo como piloto (Torre del Vigía + 2 menores + sus POI de tier 1).
2. **P2.2 · Plantillas de POI con estilo de civilización** (`TPL` por cultura: mismo generador, decorado propio) — reemplaza el decorado único actual.
3. **P2.3 · Un bioma por lote** (orden: Bosque, Pantano, Cumbres, Oriental, Volcán, Páramo, Desierto, Costa): sus hitos, POI de tier 1–3 y sus modelos. Coincide con la fase de contenido del bioma (§4).

---

## 3. FASE P3 · ALDEAS, PNJ Y ECONOMÍA LOCAL
1. **Aldea por barrios en los 7 biomas restantes** (`village-barrios.js` spec por bioma; arquitectura propia de su cultura; calles/plazas/patios; estaciones repartidas: banco, tienda, tablón, hornos, Botica, Taller, Herrería, Establo ✅, Templo arcano…). Verificar con `village_check.py` (0 solapes, todo alcanzable).
2. **PNJ distintos por bioma** (requisito del dueño: no clones; incluye a Ru): tabla `NPC_BK`, ropa/cultura/diálogo propios; guardia, herrero, anciano, boticario, tabernero, mozo de cuadra…
3. **Casas de instalación distintas por bioma** (regla permanente: Botica, Taller, Herrería, Templo arcano… con detalles que cuenten el oficio).
4. **Música y ambiente por región** (`ambience.js`, pack del dueño) y mezcla en fronteras; sonidos de pisadas por superficie ya existen.

---

## 4. FASE P4 · CONTENIDO DE COMBATE Y PROGRESIÓN POR BIOMA (E3 «fauna y enemigos»)
1. **Fauna por bioma** (≈ 55 animales, `MATRIZ_OFICIOS_MUNDO.md` §4b): modelo ÚNICO, comportamiento mixto (huida / ganado / defensa), botín = piel del tier + carne + hueso/grasa + 1 único raro. Pradera ya; **Bosque siguiente**.
2. **9 enemigos de combate por bioma** (5 comunes + 2 de clase + 2 élite) + capitán + jefe; aprobada la lista de la Pradera (ya implementada). Buff de enemigos a distancia/embestida ya existe por datos (`sk`).
3. **Peligro por zona (decidido 29 oct: crece con la DISTANCIA a la aldea; sustituye a «los jefes abren el camino»):** nivel de criaturas por distancia a la aldea y por región (`LVR`), señales de peligro (cartel, niebla, cambio de música) y recompensa; los jefes son hito de región, no llave.
4. **Tiers en el mundo:** colocar **oro, infernita y ceniza infernal**; tiers propios de Páramo, Desierto y Costa (hoy copian a otros biomas); reparto tier→bioma según la matriz.
5. **Cuevas, minas y mazmorras por bioma** con enemigos y menas propios (ya hay generador; falta estilo y balance).
6. **Costa y archipiélago (decidido 29 oct):** el **barco se consigue al llegar a la Costa con una QUESTLINE** (no es skill; sin contador de pasos); su final desbloquea el archipiélago (Isla del tesoro, hitos de islas). Hasta entonces las islas del mapa A quedan inaccesibles a propósito.

---

## 5. FASE P5 · VIAJE, ORIENTACIÓN Y MUNDO ABIERTO
1. **Viaje rápido (decidido 29 oct):** las **monturas son el transporte principal** (ya hechas) y se añaden **CARAVANAS en ciertos spots** (POI/estación «Caravana», ligada a aldeas y a algunos hitos) que permiten viajar entre ellas: solo entre caravanas ya descubiertas, con coste en monedas y tiempo de viaje abreviado (corte con fundido), sin trivializar el recorrido. Las caravanas son contenido (modelo único por civilización, PNJ caravanero).
2. **Mapa:** iconos de hitos/POI/cuevas/minas/atalayas, filtros, anotaciones del jugador, marcador múltiple.
3. **Respawn y puntos de aparición por región**; santuarios de reaparición como POI.
4. **Persistencia:** descubrimientos en `S.disc`/`S.fog` (migración ya resuelta por `S.world`).

---

## 6. FASE P6 · TÉCNICA, RENDIMIENTO Y HERRAMIENTAS (transversal, siempre)
1. **Medir en gráfica integrada y móvil** (`docs/PLAN_MOVIL.md`): a K=6 el montón JS ronda 1,0–1,3 GB; palancas: recortar el mar sobrante, estrechar la columna del Cielo, decoración por LOD, `?map=grid` como respaldo en móvil (hoy automático).
2. **Herramientas a rehacer para el mapa A:** `walk_seam.py` (obsoleta), `coast_check`, un **recorrido automático** por el continente (conectividad a pie, caída de fps por región, errores de consola), `landmarks_check.py` (visibilidad a distancia y huellas), captura por bioma a ojo (`world_shot.py`).
3. **Presupuesto §P por región** (`R3D.budget()` en cada bioma, Media y Alta) y trinquetes nuevos en `rules_check` para decoración/hitos.
4. **Tutorial y playa en el mundo nuevo** (jugarlos de punta a punta con `isla_playthrough.py`).
5. **Documentación:** actualizar `PLAN_MUNDO_ABIERTO.md`, `GUIA_ESTILO_ISOMETRICO.md` (datos del mundo) y `LORE.md` con lo que el dueño decida.

---

## 7. ORDEN RECOMENDADO Y DEPENDENCIAS
1. **P1.b–P1.f** (paisaje) — se ve en todo el mundo; no depende de nada.
2. **P2.1** (sistema de hitos + piloto Pradera) y **P2.2** (plantillas por civilización).
3. **Bosque completo** = P3 (aldea y PNJ) + P4 (fauna y 9 enemigos) + P2.3 (hitos y POI) — primer bioma «redondo»; sirve de plantilla para los demás.
4. Pantano → Cumbres → Oriental → Volcán → Páramo → Desierto → Costa (uno por lote grande).
5. **P5** (viaje rápido, mapa) cuando haya ≥ 3 biomas con hitos descubribles.
6. **P6** continuo; medición en integrada/móvil antes de dar el mundo por «cerrado».
**Puerta ★ (prototipo Asesino):** sigue en la Fase 6 de `HOJA_DE_RUTA.md` tras Bosque y Pantano.

## 8. DECISIONES DEL DUEÑO (29 oct 2026) y preguntas que quedan
1. ✅ **Hitos: 3 GRANDES + 4–6 menores por bioma**, algunos con enemigos (según el hito). Catálogo en §2.3.
2. ✅ El resto del plan aprobado (vocabulario, sistema técnico, cantidades, orden).
3. 🟡 **Orden de biomas / progresión:** el dueño quiere que el entorno CAMBIE más entre biomas consecutivos (Pradera, Bosque y Pantano se parecen: verdes y húmedos) y pide «repasar la progresión» de tiers. Propuesta en §9; **pendiente su elección**.
4. ✅ **Barco de la Costa:** se consigue **al llegar a la Costa mediante una questline** (no es una skill). Esa cadena de misiones desbloquea el archipiélago (Isla del tesoro y demás).
5. ✅ **Transporte:** las **monturas son el medio de transporte** (ya hechas). Además se podrán dejar **caravanas en ciertos puntos (spots)** para viaje rápido entre ellos: nuevo POI/estación «Caravana» (ver P5).
6. ✅ **Dificultad:** el nivel de las criaturas crece con la **distancia a la aldea** de la región (`LVR` por distancia + señales de peligro).
7. ✅ **Questlines sin contador de pasos** (hecho el 29 oct 2026): se quitó el «1/35» del tutorial de la isla («Despertar») y el de «Cien años» de la playa; solo se ve el paso actual. Regla: **ninguna cadena de misiones muestra «n/N» de pasos** (los contadores de objetivos como «3/10 talas» sí valen).

## 9. REVISIÓN DE LA PROGRESIÓN (PROPUESTA para decidir con el dueño)
**Problema:** el orden actual Pradera → Bosque → Pantano son tres biomas verdes/templados/húmedos y los tiers (cobre-bronce-hierro-acero-plata) avanzan casi sin cambio de entorno. **Objetivo:** que cada bioma consecutivo cambie **clima, paleta, civilización y mecánica de ambiente** (frío, calor, humedad, altura, oscuridad), y que el tier «pegue» con el entorno (mineral de montaña, oro en desierto, mitril élfico…).
Tiers del juego (nivel de barra): cobre 1 · bronce 8 · hierro 14 · acero 24 · plata 34 · alba 42 · mitril 50 · adamantita 60 · runita 70 · oricalco 78 · infernita 85 · celestita 92.
**Propuesta «ruta contrastada»** (los niveles son el rango de las criaturas; el orden es de dificultad, no obliga a andar en ese orden porque las fronteras están abiertas y habrá caravanas/monturas):
| # | Bioma | Niveles | Tier principal | Entorno (contraste con el anterior) | Por qué ahí |
|---|---|---|---|---|---|
| 1 | **Pradera** | 1–14 | cobre → bronce → (hierro inicial) | verde, abierto, medieval, luz cálida | arranque amable |
| 2 | **Cumbres** | 14–28 | hierro → acero | frío, rocoso, altura, nórdico, nieve y viento | **máximo contraste** con la Pradera; las minas de hierro/acero encajan con la montaña |
| 3 | **Pantano** | 28–40 | plata | húmedo, oscuro, niebla, tribal; veneno y charcas | tras el frío, lo opuesto: calor húmedo y visibilidad baja |
| 4 | **Desierto** | 40–52 | oro → **alba** (plata+oro) | árido, ocre, egipcio, calor y sed (Odre), dunas | el oro nace aquí; vuelve a abrir el paisaje tras la niebla |
| 5 | **Bosque ancestral** | 52–62 | **mitril** | denso, élfico, luz verde mágica, árboles gigantes | el mitril élfico: el Bosque pasa a ser un bioma de nivel medio-alto, no el segundo |
| 6 | **Oriental** | 62–72 | adamantita | ordenado, jardines y templos, samurái, rojo y rosa | civilización y color nuevos |
| 7 | **Volcán** | 72–82 | runita → oricalco | fuego, ceniza, lava, infernal; calor extremo | forja de alto nivel |
| 8 | **Páramo Arcano** | 82–90 | oricalco (arcano) | desolado, runas, magia, violeta | endgame mágico |
| 9 | **Costa de las Tormentas** | 84–98 | (mar/sal; cierre) | tormentas, piratas, islas (questline del barco) | cierre de mundo con el archipiélago |
| — | Cielo (inicio) · Infierno (infernita) | — | celestita · infernita | ya previstos | — |
**Qué implica (si se aprueba):** (a) cambiar `BI[k].lv` y las listas `B.res`/`TI` por bioma (datos, no código); (b) reordenar misiones principales, `MATRIZ_OFICIOS_MUNDO.md` §2 (tier→bioma) y la dificultad por distancia; (c) la Pradera se conecta con las Cumbres por un camino largo (las Cumbres están al oeste: caravanas/monturas ayudan); (d) el Bosque deja de ser el «bioma 2» y su aldea/oficios/fauna se rehacen con identidad élfica de nivel alto; (e) las fases P2–P4 se ejecutan en este orden (Cumbres → Pantano → Desierto → Bosque → …). **Alternativa «suave»:** mantener Pradera → Bosque → Pantano pero cambiar los climas del Bosque (otoñal/oscuro) y del Pantano (muy sombrío) y mover solo el tier de plata a las Cumbres. **El dueño elige.**
