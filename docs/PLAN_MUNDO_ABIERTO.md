# NotScape · PLAN DEL MUNDO ABIERTO (Fase 43 · alias Q41) — 19 oct 2026

> **2.ª RONDA (19 oct 2026, 15:22): el mundo se EXPANDE ×2 lineal, hay muralla con prueba solo para el Volcán, montañas de relieve en el resto y una capital en el Oriental → ver §8, que MANDA sobre lo anterior donde choque.**
> **Estado:** decisiones del dueño recibidas el 19 oct 2026 (ver §7; (b) y (b2) CAMBIAN la recomendación del agente). **SOLO PLANIFICACIÓN: no se tocó código del juego.** Lo escribe la Fase 43; lo ejecuta la **Fase 44** (prototipo Pradera + Bosque pegados, con la aldea reorganizada). Lo que manda sobre este archivo: las decisiones del dueño que figuren en §7 y en AGENTS.md.
> **Las cifras de §1–§7 son del mundo ANTES del ×2 (144×94 tiles por bioma); con el ×2 de §8 se multiplican (×2 lineal, ×4 área).** Todas las de §1 están **medidas en el código/juego real** (19 oct 2026, página cargada sin 3D para contar entidades; `BIOMES`, `TER`, `N`, `M`, `ST`, `S`). Lo que es propuesta lleva la marca *(propuesta)*; lo que no se pudo comprobar, *(por verificar en la Fase 44)*.

---

## 1 · Qué hay HOY (correcciones a lo que decía la cola)

**La cola decía «cada bioma es un diorama de ~96×96». Es falso.** Medido:

| Dato | Valor medido |
|---|---|
| Bioma | **4608 × 3008 px = 144 × 94 tiles** (`BIOMES.list[k].w/h`; `layouts.js` líneas 137 y 221) |
| Mundo | **13 824 × 6 016 px = 432 × 188 tiles = 81 216 tiles** (`BIOMES.WW/WH`, `TER.NX/NY`) |
| Disposición | **Rejilla de 3 × 2 en serpiente, SIN huecos entre biomas** (los rectángulos son contiguos): fila 1 Pradera (0,0) → Bosque (4608,0) → Pantano (9216,0); fila 2 (de derecha a izquierda) Cumbres (9216,3008) → Oriental (4608,3008) → Volcán (0,3008). Pantano→Cumbres cruza por el SUR (compuerta horizontal); Cumbres→Oriental→Volcán van hacia el OESTE (esos tres están espejados en X) |
| Frontera | **Anillo de acantilado de 1 tile** en el borde de cada rectángulo (`world-iso.js:21`), salvo en las **5 compuertas** de **114 px (≈ 3,6 tiles)** de ancho (`BIOMES.gates`) |
| Compuerta | La abre matar al jefe del bioma anterior (`S.boss[k-1]`; `lockedAt()` en `game.js:602`). Cerrada: valla + candado + cartel «Derrota al jefe anterior» (visto en captura) |
| Vacío | Solo existe **fuera** de la caja 13 824 × 6 016. Es ahí donde el 3D corta el «diorama flotante» con paredes por estratos (`terrain3d.js` cabecera, punto 3) |
| Entidades | `N` (naturaleza fija) **2 168** [458 / 673 / 367 / 392 / 208 / 70 por bioma]; `M` (mobs) **152** [37 / 23 ×5]; `ST` (estaciones) **54** [9 por bioma]; props de aldea por bioma **609 / 737 / 717 / 675 / 517 / 627**. **Todo está siempre en memoria** (un solo `curB`, un solo `S`). |
| 3D en streaming | Terreno por chunks de 16×16 tiles: **27 × 12 = 324 chunks**, LRU `MAXC=70` (≈ 22 % vivo). Props agrupados «por modelo Y por zona CELL×CELL» (`props3d.js:35`) → ya se descartan zonas fuera de vista. Es decir: **la «carga por región» del render YA existe**; lo que falta es otra cosa (§3). |
| Color en 3D | `terrain3d.js:61` usa **un solo `k` por tile** (`TER.biomeOf`) → **corte duro de color en la frontera**. El 2D sí mezcla 9 tiles (`blendTh`, F3-E, `world-iso.js:143`) pero el 3D no lo usa. Luz: `lgAt` ya mezcla con el bioma vecino a < 280 px de la compuerta (`game.js:906`). |
| Minimapa | Por bioma (`curB`), **norte fijo** (ejes del mundo), 196×128 px; mapa grande (tecla M) 588×384 de **un bioma**, no del mundo. Descubrimiento en `S.map` (claves `z#`, `v#`, `b#`). |
| Guardado | **Un solo `S`** en `localStorage['tdo2']` (49 claves; **755 bytes** en partida nueva). Los ids ya llevan el bioma (`S.poi['k_id']`, `S.boss[k]`, `S.map['v'+k]`). No hay nada que partir por región. |
| Escala | `PROP_K = 1,5` escala **todos** los props y la colisión de props (`props.js:24`); **los árboles/naturaleza NO** (`solOf`: `tree?1:PROP_K`) ni `arbolSeco` (`props3d.js:18`); héroe y criaturas ×1. |
| Aldea (Pradera) | Los edificios ocupan una caja de **1 232 × 854 px (38 × 27 tiles)** alrededor de (2300,1500) local; calles de **22–25 px (< 1 tile)**, plaza de **r = 70 px (≈ 2 tiles)**. Con ×1,5 los edificios se pisan con calles y plaza (es lo que el dueño ya vio). **Las 6 aldeas usan las MISMAS coordenadas** (`LAY`, `LAY_B`, `LAY_P`… comparten x,y y cambian solo modelos y `fp`). |

**Consecuencias (lo que cambia el plan):**
1. No hay que «pegar» biomas ni crear regiones: **ya están pegados y en un solo estado**. El trabajo real de la Fase 44 es la **frontera** (qué se ve y se siente al cruzar), la **mezcla visual en 3D** y la **aldea**.
2. No hay que construir un sistema de carga por región ni de guardado por región: **sobra** a esta escala (§5, §6). Se dejan solo los ganchos baratos.
3. El «diorama flotante» solo es un problema en el **borde exterior** del mundo (y en el anillo de 1 tile entre biomas, que se ve como una pared estrecha).
4. Como las 6 aldeas comparten coordenadas, **rehacer la aldea de la Pradera sirve de molde para las seis** (una función de transformación de posiciones + ajustes por bioma).

**Trampa de herramienta (descubierta al preparar este plan):** `tools/r3d/shot_at.py` teletransporta y captura a los ~10 s; en SwiftShader el terreno de una zona lejana **aún no está construido** y la captura sale con el fondo claro y solo unos matojos (visto en (4540,1500) y (70,1000): `R3D.stats().chunks = 6`). Para capturas de frontera hay que esperar a que acabe la construcción por chunks o forzar la precarga (`preload()` en `r3d.js:204`, que llama `terr.update(...,true)`; *por verificar si está expuesta en `R3D`*). La Fase 44 debe crear una herramienta `tools/r3d/border_shot.py` con esa espera.

---

## 2 · Decisiones (a)–(f): opciones, recomendación y coste

Cada una: **Opciones → Recomendada → Por qué → Coste**. Tiempos de caminata con la velocidad actual (andar 70 px/s, correr ×1,9): un bioma de lado a lado = **66 s andando / 35 s corriendo**; la serpiente completa ≈ **27 000 px ≈ 6,5 min andando**.

### (a) Tamaño del mundo y de cada región — **CAMBIADO por el dueño (19 oct, 2.ª ronda): ×2 LINEAL (ver §8)**; el texto de abajo es el análisis original
- **A. Mantener 144 × 94 tiles por bioma (mundo 432 × 188).** Cero trabajo de layouts. 
- B. Crecer ×1,5 / ×2 (= Fase 48): rehacer todos los layouts en casillas, zonas, rutas, 2 168 + 3 882 colocaciones. XL.
- C. Achicar (~110 × 72) para que la aldea ×1,5 pese más: obliga a rehacer zonas y cofres.
- **Recomendada: A.** Cada bioma ya es ~1 min de lado a lado; con la aldea ×1,5 sigue habiendo ≈ 100 tiles de campo a cada lado. Crecer es una decisión de contenido (Fase 48, opcional), no de arquitectura.

### (b) Cómo y dónde se pegan los biomas; compuertas de jefe y rutas — **DECIDIDO por el dueño (19 oct 2026): FRONTERA ABIERTA; los jefes pasan a ser HITO, no llave**
Opciones que se le presentaron: A) desfiladero con portón de jefe (la recomendada del agente), **B) frontera abierta (ELEGIDA)**, C) frontera geográfica variada.
**Qué significa (interpretación del agente, a confirmar al ver la captura de la 44a):**
1. **Desaparece el anillo de acantilado de 1 tile y también la compuerta/valla/candado** en las 5 uniones encadenadas (0|1, 1|2, 2|3, 3|4, 4|5): el terreno, el relieve y la paleta pasan de un bioma al siguiente de forma continua (la mezcla de §4 ocupa ±12 tiles a cada lado). *No* se construye sierra ni portón.
2. **Dos bordes que hoy el anillo cierra y que NO son de la cadena: Pradera|Volcán (0|5) y Bosque|Oriental (1|4).** Sin muro, quedarían abiertos y se podría ir de la Pradera (nv 1) al Volcán (nv 80) en ~15 s. **Regla propuesta:** esos dos bordes (y el borde exterior) se cierran con **barrera NATURAL infranqueable** (mar, cordillera, abismo), no con muro de tile: la Pradera ya tiene el mar al sur (`Mar` z 2640–2975) y el Oriental tiene `sea:1`; habría que hacer que el lado del Volcán/Bosque la continúe. *(por confirmar con el dueño al ver la captura)*.
3. **Apertura ancha pero irregular:** una unión encadenada mide 94 tiles (vertical) o 144 (horizontal) de largo. *(propuesta)* se deja abierta con **obstáculos naturales intercalados** (lagos, riscos, bosque denso, la costa) y un camino principal, para que no sea una línea recta de 94 tiles de portal: tramos abiertos ≥ 30 tiles. Se ve en la captura y se ajusta.
4. **Jefes = HITO, no llave (decisión del dueño):** el jefe sigue dando runas, logros y su botín, pero **ya no bloquea el paso**. El freno pasa a ser el **peligro**: aviso al entrar en una zona (`META.lv` ya trae el nivel sugerido por bioma: 1 / 15 / 31 / 47 / 63 / 80) y mobs de nivel alto. **Al morir se reaparece en la última aldea (o estatua, Fase 45) visitada.**
5. **Qué toca esto en el código (medido con `grep`; son pocos puntos):** `game.js:602` `lockedAt` (quitar el bloqueo por jefe; el vacío sigue bloqueando), `:603` `blk`, `:610` `spawnK` (hoy elige el bioma más lejano con jefes vencidos; pasa a «última aldea visitada», dato nuevo `S.home`), `:418` migración de `S.st.bio`/`S.boss` (se conserva `S.boss` como logro, sin tocar partidas), `:564 bossKill` y `:569 bossHTML` (el texto «Jefes (abren el camino)» → «Jefes»), `:1095` dibujo de la valla de compuerta (se elimina), y `TER.gate` en `world-iso.js:306`. La mezcla de luz `lgAt` ya existe. **Ojo con lo que dependa de que el jefe abra el camino:** el **sello del capitán** (`sealed`, 5 menciones en `game.js`) que abre a Gruk, las misiones del camino de la cola R6 y los textos del tutorial: la Fase 44a debe repasarlos y proponer al dueño qué se hace con cada uno *(por verificar)*.
6. **Pierden sentido** (a retirar o reutilizar, decide la Fase 44a): `BIOMES.gates` como puertas (se queda como lista de «uniones» para la mezcla y la música), `exitE/entryW` de 114 px, y la compuerta horizontal del Pantano→Cumbres.
7. **Atajos:** las estatuas de viaje (Fase 45) siguen siendo las anclas; no hay más pasos físicos.
- **Rutas:** `ROUTES` locales terminan en el borde; el camino principal debe **cruzar la unión** y continuar en el vecino (mismo ancho, adoquín/tierra mezclados) → se comprueba con `tools/world_snapshot.py`.
- **Coste:** M–L (quitar anillo y compuertas + relieve y mezcla continuos + barreras naturales de los 2 bordes cerrados + repaso de lo que dependía del jefe). Es el grueso de la Fase 44a.

### (c) Rework de la aldea de la Pradera con la escala ×1,5
Medida: caja 38 × 27 tiles, calles < 1 tile, plaza r = 2 tiles. Con edificios ×1,5 todo queda apretado.
- A. **Mecánico:** multiplicar las posiciones ×1,5 alrededor de la plaza (una función). Barato y seguro (colisiones y rutas siguen válidas) pero deja calles vacías y el mismo diseño.
- **B. Por barrios *(recomendada)*:** se parte del ×1,5 mecánico y se **reorganiza a mano**: plaza **r ≈ 120 px (≈ 4 tiles)** con fogata, pozo, banco y tienda mirando a la plaza; **calle mayor E–O de ~3 tiles** (es la ruta del mundo: entrada por el oeste, jefe y portón al este); **calle norte** (casas, taberna), **calle sur** (oficios: horno, yunque, taller, carbón, secadero), **iglesia** en un altillo al norte, **molino** junto al río/lago, **granero y heno** al este, campos con vallas; calles secundarias ≈ **1,5 tiles**. *(propuesta de cifras: confirmar con captura)* Tamaño final ≈ **57 × 40 tiles** (= ×1,5 lineal ≈ ×2,25 de área).
- C. Ciudad grande con muralla (×2): bloquea la ruta de entrada y obliga a rehacer `routes`; no.
- **Para las otras 5 aldeas:** la misma transformación de posiciones (`vilXf`) + los ajustes de su arquitectura; se hace en cada Fase 7–11.
- **Árboles y estaciones:** hoy las **estaciones** (yunque, horno, taller…) ya crecen ×1,5 con el resto de props; los **árboles no**. *Propuesta:* árboles de aldea y bosques **×1,3 solo visual** (copa y tronco; la colisión no cambia) para que no queden por debajo de las casas; se prueba con captura. Si queda raro, se vuelve a ×1.
- **Coste:** parte de la Fase 44b (L). Herramientas: `village_shots.py`, `props_check.py` (tiene fallos de base conocidos: ver «PENDIENTES HEREDADOS»).

### (d) Minimapa y mapa grande
Hoy: norte fijo en ejes del mundo (en pantalla el mundo se ve girado 45° por la proyección isométrica), y solo del bioma actual.
- **A. Local alineado con la pantalla *(recomendada)*:** el minimapa es una **ventana de ~1 200 px de radio** alrededor del héroe, **girada para que «arriba» del mapa = «arriba» de la pantalla** (así «el camino que veo hacia la derecha está a la derecha del mapa»), con marca de norte. La tecla M abre el **mapa del mundo entero** (6 biomas cosidos, **niebla de guerra por celdas**), con el bioma actual resaltado.
- B. Norte fijo (como ahora) + mapa del mundo. Más simple (S), pero hay que girar la cabeza 45° para leerlo.
- C. Solo mapa del mundo (sin minimapa). Pierde la ayuda de orientación en combate.
- **Coste de A:** M (`drawMap`/`mmk` ya pintan un bioma en un canvas de 588×384; el mundo cosido = 6 canvases + giro; la niebla ver (e)). Va en la Fase 47, no en la 44 (en la 44 el minimapa solo debe **no romperse** al cruzar la frontera: hoy cambia de bioma en `curB`).

### (e) Guardado por región
- **A. Mantener el `S` único *(recomendada)*.** Ya está indexado por bioma y pesa < 1 KB. No hace falta partir nada.
- B. Un guardado por región: solo tendría sentido con carga por región del estado (mundo en servidor / multijugador): fuera de alcance.
- **Añadir solo (en la Fase 47):** (1) **niebla del mapa grande**: rejilla de 16 × 16 tiles = **27 × 12 = 324 bits ≈ 41 bytes con el tamaño ANTIGUO; con ×2 son 54 × 24 = 1 296 bits ≈ 162 bytes** (`S.fog`); (2) subir `S.ver` y migrar sin perder partidas (añadir `S.home`, conservar `S.boss`); (3) comprobar que `spawnK()` y la muerte (`die`) siguen devolviendo al bioma correcto con la compuerta nueva.
- **Coste:** S.

### (f) El «diorama flotante»: borde del mundo, acantilados, agua
- **A. Isla única *(recomendada)*:** el mundo entero es **una sola isla** que conserva el corte por estratos (la firma «diorama» que al dueño le gusta, §4.9) **solo en el borde exterior**, con la oscuridad/viñeta del óleo detrás; **hacia dentro no hay ningún corte** (las uniones son terreno continuo, §2-b; los dos bordes no encadenados se cierran con mar/cordillera, no con pared de estratos). En la costa de la Pradera (sur) y del Oriental el borde ya es mar: se deja.
- B. Mundo continental sin borde visible: sierras/mar hasta el horizonte (sin niebla, decisión del dueño 17 oct) → necesita una lámina de agua muy grande y tapar el vacío; más trabajo y riesgo de rendimiento.
- C. Borde exterior con mar en todo el perímetro. Combina con B; caro.
- **Coste de A:** S–M (el corte exterior ya existe; hay que **no dibujar estratos hacia dentro** y revisar que el vacío exterior no se vea en el zoom máximo).

---

## 3 · Lo que SÍ falta (resumen del trabajo real)
1. **Mezcla de color, relieve y densidad en la frontera, en 3D** (§4.1). Hoy hay un corte duro de color por tile.
2. **Frontera abierta** (§2-b): quitar anillo y compuertas, terreno continuo, barreras naturales en los 2 bordes no encadenados, y **jefes como hito** (repaso de `lockedAt`, `spawnK`, sellos y misiones).
3. **Aldea de la Pradera reorganizada** (§2-c).
4. Minimapa/mapa del mundo/niebla (Fase 47).
5. Rendimiento del conjunto (§6).

## 4 · Fase 44 — alcance propuesto (la 2.ª ronda añade la **44-0 · Mundo ×2** ANTES de 44a/44b: ver §8.6; las cifras de tiles de este apartado se multiplican ×2)

### 44a · Frontera abierta Pradera | Bosque (L)
1. **Datos:** para el par 0–1, quitar el anillo de 1 tile (`world-iso.js:21`) y la compuerta; que `TER.heightAt`/`tileH` den terreno continuo (el relieve de los dos biomas se interpola en ±12 tiles; `terrain3d.js` ya lee de ahí → colisión y malla coinciden). Hacerlo con un **parámetro por unión** (`BIOMES.seams`) para reutilizarlo en las otras 4 uniones encadenadas (Fases 7–11 / 46).
2. **Barreras naturales** de los bordes no encadenados (0|5 y 1|4) y revisión del borde exterior (§2-f): mar/cordillera/abismo infranqueables, **sin** pared de tile.
3. **Mezcla de paleta en 3D:** en `terrain3d.js` `gc(x,z,k)`: color = mezcla de `GCOLS[k]` y `GCOLS[nk]` con `w = smoothstep` en ±12 tiles hasta **50 %** en la línea de unión (como `blendTh` del 2D, mismos pasos); mismo criterio en tierra/camino/adoquín. *(por verificar:* caché de chunks y AO por vértice).
4. **Naturaleza y fauna en la unión:** `kinds` de árboles de los dos biomas mezclados en la franja (`groves()` en `layouts.js`); densidad de mobs que sube por tramos (el nivel de peligro se anuncia, ver 6).
5. **Camino principal continuo** que cruza la unión; sin portón ni valla (se elimina el dibujo de `game.js:1095` y la lámina `TER.gate` para ese par).
6. **Jefes = hito:** quitar `lockedAt` por jefe; `spawnK` → última aldea visitada (`S.home`); **aviso de zona peligrosa** al entrar en un bioma por debajo del nivel sugerido (`META.lv`) (toast/banner, no bloquea); textos «abren el camino» → «Jefes». Repasar `sealed`, misiones y tutorial y **proponer** al dueño qué se hace.
7. **Cámara, luz, música, clima:** `lgAt` ya mezcla luz; comprobar el cambio de música/clima al cruzar (`curB`) para que no «salte».
8. **Pruebas:** `node tools/iso_test.js`, `tools/world_snapshot.py` (el 2D no debe cambiar fuera del par 0–1), `tools/r3d/perf_check.py`, nueva `tools/r3d/border_shot.py` (esperar a la construcción de chunks), capturas día/noche a K=70 desde ambos lados y a pie por la unión.
9. **Criterio de hecho:** caminar de la Pradera al Bosque **sin ver corte de color, pared ni valla**; el paso a Pradera→Volcán y Bosque→Oriental sigue imposible; morir en el Bosque sin jefe vencido reaparece en la última aldea; ≤ 233 draw calls en la aldea; sin errores de consola.

### 44b · Aldea de la Pradera reorganizada (L)
`vilXf` (×1,5 alrededor de la plaza) + reorganización por barrios (§2-c) en `biomes.js`/`layouts.js`; molino y iglesia siguen siendo de la Fase 5 (si el dueño lo prefiere, se funde aquí). Criterio: ningún prop pisa calle ni plaza; todos los PNJ y puertas alcanzables; `props_check.py` no empeora; capturas con `village_shots.py` y desde la cámara del juego.

## 5 · Carga por región (hecha en esencia)
Medido §1: 324 chunks de terreno con LRU, props por zona, todo el estado en memoria (≈ 6 000 entradas). **No se construye un sistema de regiones.** Ganchos baratos que SÍ valen la pena en la 44/47: (1) **simular IA de mobs solo a < N px del héroe** *(por verificar si ya se hace)*; (2) **precargar los chunks del lado contrario del paso** al acercarse a < 600 px de una compuerta abierta (evita el tirón al cruzar); (3) descartar los grupos de props de la región vecina cuando el héroe se aleja > 1,5 pantallas.

## 6 · Riesgos y presupuestos
- **Rendimiento:** no se ha medido en la GPU/móvil del dueño (sigue pendiente). Cada paso nuevo de 3D se mide con `perf_check.py` y el panel F3; objetivo ≥ 50 fps en móvil de noche (criterio de la Fase 15).
- **SwiftShader no sirve para fps** (solo para ver).
- **Alineación a tiles:** biomas y compuertas deben ser múltiplos de 32 px (ya lo exige `biomes.js`: `LW/LH` múltiplos de `TQ`).
- **El jefe está a ~400 px del borde** (`bossPos [4210,1500]` frente a 4608): con la unión abierta, la arena del jefe queda a ~12 tiles de la zona de mezcla; vigilar que la franja no pise su arena (`arena`, `bossPos`) ni el campamento `c2` (4250,1280).
- **Sin llave, el progreso lo marca el nivel:** hay que decidir (Fase 44a, con el dueño) qué avisa y qué castiga entrar demasiado pronto; hoy el mundo está balanceado asumiendo el bloqueo por jefe (`B2c`, `meas_progresion.py`) → **no rebalancear ahora** (Fase 36), solo avisar.
- **Atajos no deseados:** Pradera|Volcán y Bosque|Oriental son vecinos directos en la rejilla; si la barrera natural falla, el dueño puede saltarse 4 biomas.
- **Pantano → Cumbres** es horizontal (sur) y los tres biomas de la fila 2 están espejados: la mezcla de unión debe tratar ambas orientaciones y el espejo.
- **Saves antiguos:** nada de lo propuesto cambia ids de `S`; solo se añade `S.fog` (Fase 47).
- **Estatuas de viaje (Fase 45)** aún sin diseño de modelo: dejar en cada unión un **sitio libre** de ~6×6 tiles a ~20 tiles de la línea de unión *(propuesta)*.

## 7 · Decisiones del dueño (19 oct 2026, respondidas en el chat de la Fase 43)
| | Decisión | Nota |
|---|---|---|
| (a) Tamaño | ~~Mantener 144×94~~ → **CAMBIADO en la 2.ª ronda: ×2 lineal (288×188 tiles por bioma), ver §8** | sustituye a la recomendada |
| (b) Frontera | **FRONTERA ABIERTA** (terreno continuo, sin muro, sin portón) — **elegida por el dueño**, distinta de la recomendada | ver §2-b: obliga a cerrar con barreras naturales Pradera\|Volcán y Bosque\|Oriental |
| (b2) Jefes | **«Hito, no llave»**: el jefe da runas/logros pero ya no bloquea; el freno es el peligro (aviso de zona + mobs); morir → última aldea visitada | **cambia la decisión antigua «los jefes abren el camino»** |
| (c) Aldea | **Por barrios** (plaza ~4 tiles, calle mayor 3, oficios, iglesia en altillo, molino junto al río; ≈ 57×40 tiles) | árboles ×1,3 solo visual: **no preguntado**, se prueba con captura en la 44b |
| (d) Minimapa | **Local alineado con la pantalla + tecla M = mapa del mundo con niebla** | va en la Fase 47 |
| (e) Guardado | **`S` único** (+ `S.fog`, `S.home`) *(recomendada; no objetada)* | por defecto |
| (f) Borde | **Isla única**: corte por estratos solo en el borde exterior | |

---

## 8 · SEGUNDA RONDA (19 oct 2026, 15:22; pedido del dueño: «vasto mundo como WoW», aldeas con la escala nueva, capital en el Oriental) — MANDA sobre §2 y §7 donde choque

### 8.1 · Decisiones
| | Decisión del dueño | Cifras |
|---|---|---|
| (a) **Tamaño** | **Cada bioma crece ×2 LINEAL** (antes: se mantenía) | **288 × 188 tiles = 9 216 × 6 016 px** por bioma (hoy 144×94). **Mundo 864 × 376 tiles = 27 648 × 12 032 px** (hoy 432×188). **4× el área.** Cruzar un bioma ≈ **132 s andando / 70 s corriendo** (hoy 66 / 35). Serpiente completa ≈ **54 000 px ≈ 13 min andando** (hoy ≈ 6,5). |
| (b3) **Volcán** | **Muralla con guardias, solo para el Volcán, y NO dice «zona endgame»**: un texto más elaborado de **prueba** («primero tienes que probarte para entrar aquí» o similar). | El Volcán se entra por Oriental|Volcán (unión 4|5, la única de la cadena). **Interpretación del agente (confirmar):** esa unión es la ÚNICA con puerta física; se abre al **superar una «prueba»** (misión/desafío, **diseño pendiente**, no es el jefe). Pradera|Volcán (vecinos por el sur) se cierra con montañas/mar. |
| (b4) **Resto de bordes** | **Montañas generadas por el RELIEVE, no por assets:** el propio terreno impide el paso, para que no se vean raros los assets; «un escenario natural». Vale para los biomas pegados a la Pradera y para los bordes no encadenados (Pradera\|Volcán, Bosque\|Oriental). | Nada de muros de props. Cordillera = campo de altura (`TER.heightAt`/`tileH` con nivel de acantilado `2`/crestas, laderas con ruido), sin pared de tile recta; cumbres con nieve/roca según bioma. Los **pasos encadenados siguen abiertos** (§2-b). |
| (c2) **Escala en TODAS las aldeas** | Las 6 aldeas pasan por la misma transformación de escala (×1,5 de props **ya aplicado**; falta rehacer la distribución). | Como las 6 comparten coordenadas (`LAY*`), se hace UNA función `vilXf` y se aplica a todas; cada bioma ajusta su arquitectura (Fases 7–11). |
| (g) **CAPITAL** | **La ciudad capital del mundo estará en la zona ORIENTAL.** | Ver 8.3. |

### 8.2 · Qué cambia en el plan (consecuencias medidas)
1. **La ampliación ×2 ya NO es opcional ni XL «de luego»: es el PRIMER paso** (nueva **Fase 44-0 · Mundo ×2**) porque la frontera, la aldea y la capital se diseñan sobre el tamaño final. La antigua Fase 48 queda **absorbida** por la 44-0.
2. **Qué hay que rehacer** (medido en `layouts.js`): constantes `W4=4608, H3=3008, CX=2300, CY=1500` y `B.w/h` (líneas 137 y 221), las `place` de cada bioma (`ox 4608/9216`, `oy 3008`), `exitE/entryW`, `bossPos`, y **todas las coordenadas escritas a mano** (Pradera: `groves`, `pois` [3 campamentos, 4 santuarios, 7 cofres], zonas de recurso `wc/mi/fi`, ríos, lagos, colinas `hills`; biomas 1–5: `CFG` + `mp()` que espeja las posiciones de la Pradera). **Estrategia propuesta:** una función de escala `W2(x,y)` que lleva cada coordenada del diseño actual al sistema ×2 **dejando fijo el centro de la aldea**, y después **rellenar** el espacio nuevo (≈ 3/4 del bioma) con contenido propio: más POIs, campamentos y bosques; zonas de recurso nuevas; lagos y ríos más largos; relieve con cordilleras. **Si solo se estira, el mundo queda vacío** (riesgo principal, ver 8.4).
3. **Cifras a poblar** (extrapolando lo medido: 2 168 naturaleza, 152 mobs, 54 estaciones, 3 POI-tipos): ≈ **8 700 naturaleza** y ≈ **600 mobs** si se mantiene la densidad; en la práctica se mantendrá la densidad en las zonas y se dejarán **«praderas de paso»** (WoW tiene mucho campo abierto entre zonas) → *(propuesta)* ≈ 60 % de la densidad lineal ⇒ ≈ 5 200 y ≈ 360. **Por medir** en la Fase 44-0.
4. **Render/memoria:** terreno 27 × 12 = 324 chunks → **54 × 24 = 1 296 chunks** (el LRU `MAXC=70` no cambia, así que se ve el mismo número de chunks a la vez; ojo con la **construcción en frontera de chunks al correr a ×1,9**). Props/naturaleza en memoria: con ≈ 4× entidades hay que **medir** (`props3d.js` agrupa por modelo+zona; la iteración por fotograma de «3400 objetos» ya era un pendiente). Minimapa: `mmk` pinta un canvas de 588×384 por bioma con un `fillRect` por tile → pasa de 13 536 a 54 144 tiles por bioma: **hacerlo por chunks y cachear**.
5. **Guardado:** `S.fog` (rejilla de 16×16 tiles) pasa de 27×12 a **54×24 = 1 296 bits ≈ 162 bytes**: sigue siendo trivial. `S.map` (`z#, v#, b#`) no cambia.
6. **Velocidad / sensación WoW:** a 70 px/s el mundo entero son ≈ 13 min andando. Es la sensación de «vasto», pero también más caminata: *(a decidir con el dueño más adelante, NO ahora)* monturas, estatuas de viaje (Fase 45, ya planeadas como anclas) o carrera sin coste «al explorar el bioma» (R5·1). **No cambiar velocidades ahora.**
7. **Montañas por relieve:** hoy el relieve es de niveles escalonados (`HSTEP .3`, `lv` de colinas, acantilado = 2). Para cordilleras creíbles hace falta un **campo de altura continuo** en el borde y laderas con ruido. *(por verificar)* si `terrain3d.js` (interpolación `field`) soporta alturas continuas por encima de 2 sin romper colisión (`TER.cliffNear`, `blk`). Esa es la parte técnica más arriesgada: la Fase 44-0/44a debe empezar con un **prototipo de una cordillera** (Pradera|Volcán) y una captura antes de generalizarla.
8. **Muralla del Volcán:** es una **estructura de props** (muro, torres, guardias PNJ) en el paso Oriental|Volcán. Los guardias reutilizan el humanoide `Mini` (Fase 6 hace Guardia 3D); el texto de la prueba y su mecánica (misión, desafío, nivel, objeto) **no están decididos** → pregunta abierta (8.5).

### 8.3 · La CAPITAL del Oriental
- **Qué se sabe:** capital del mundo, en el Oriental (el bioma tiene mar `sea:1`, arquitectura de madera y papel, pagoda, torii, laca roja: `VIL_O`, `LAY_O`).
- **Tamaño propuesto *(a confirmar con captura)*:** ≈ **100 × 70 tiles** (≈ 3 200 × 2 240 px, **2,5× la aldea ×1,5**), con **puerto** en la costa, **distritos** (palacio/templo en altura, mercado, barrio de oficios, barrio residencial, muralla perimetral con 3–4 puertas), **calle mayor** que continúa la ruta principal del mundo, y plaza central mayor (r ≈ 12 tiles).
- **Qué implica:** (1) es la primera **ciudad** (no aldea): necesita **PNJ de la Fase 25 «NPC y vida del mundo» con muchos más habitantes** (≥ 8 por aldea → en la capital ≥ 30); (2) concentra servicios: Banco, Mercado/subastas (R5·6), Encantamiento, Sastrería, Iglesia/Templo — **decidir qué servicios solo existen en la capital** (pregunta 8.5); (3) interiores en 3D (Fase 15) en mayor cantidad; (4) rendimiento: la ciudad es el peor caso de draw calls (hoy ≤ 233 en la aldea ×1,5): **instanciar y fusionar** antes de construirla; (5) música/luz propias.
- **Cuándo:** **no** en la 44. Se añade una fila nueva **«Fase 10b · Capital del Oriente»** justo tras la 10 (Oriental), después de que la 44-0 y la 44a fijen escala y fronteras. Diseño de modelos con la técnica de props oscuros (`propsdark3d.js`) y una pasada de hoja de contacto aprobada por el dueño ANTES de colocar (como se hizo con los props de la aldea).

### 8.4 · Riesgos nuevos
- **Mundo vacío:** 4× el área sin contenido se siente peor que un mundo compacto. Mitigación: la 44-0 incluye *densidad objetivo* y una lista de POIs (≥ 1 de interés cada ~25 tiles de camino) y **capturas de recorrido** (`world_snapshot.py`, `walk_check.py`).
- **Balance:** `meas_progresion.py`/`B2c` asumen distancias y tiempos de camino actuales; con ×2 los tiempos de viaje de misiones y recursos cambian. **No rebalancear ahora** (Fase 36), pero anotar en cada lote los tiempos de viaje nuevos.
- **Costes de rendimiento** al construir chunks corriendo (SwiftShader no sirve para medir; hace falta la GPU/móvil del dueño, sigue sin medirse).
- **Trabajo de contenido:** la antigua Fase 48 (XL) pasa a ser la **44-0** y **debe partirse** en: (i) parametrizar tamaños + función de escala y reconstruir el mundo sin errores; (ii) relieve y cordilleras; (iii) poblar zona por zona (un bioma por prompt, junto a las Fases 7–11).

### 8.5 · Preguntas abiertas (no bloquean la 44-0 ni la 44a)
1. **La prueba del Volcán:** ¿qué es? (una misión de rango, un jefe «de prueba», un objeto/sello, un nivel mínimo, una combinación). Hoy solo se sabe que lo dicen los guardias de la muralla.
2. **Servicios exclusivos de la capital:** ¿banco, subastas, encantamiento, sastrería…?
3. **¿Quieres que el Volcán siga siendo accesible solo desde el Oriental** (como ahora en la serpiente), o también por otro lado?
4. **Velocidad/viaje:** ¿monturas, solo estatuas de viaje, o ninguno? (se decide en las Fases 21/31/45).

### 8.6 · Orden de ejecución actualizado (sustituye al del punto «Fase 44» de §4)
1. **Fase 44-0 · Mundo ×2** (parametrizar `W4/H3`, función `W2`, relieve base, 1 cordillera de prueba, recorridos sin errores). Parte (i)+(ii).
2. **Fase 44a · Frontera abierta Pradera|Bosque** (§4) sobre el tamaño ya ×2, con **montañas por relieve** en los otros bordes de la Pradera.
3. **Fase 44b · Aldea de la Pradera por barrios** (y función `vilXf` para las 6).
4. **Fases 7–11 · un bioma por fase** + su **poblado ×2** (44-0 iii) y su aldea nueva; **Fase 10b · Capital del Oriente**; **muralla y prueba del Volcán** dentro de la Fase 11.
5. Fases 45 (estatuas de viaje, ancla de regiones) y 47 (mapa del mundo con niebla, minimapa local) como estaban.

---

## 9 · TERCERA RONDA (19 oct 2026, 15:29; respuestas del dueño a §8.5) — MANDA sobre §8 donde choque
| Pregunta | Respuesta del dueño | Efecto en el plan |
|---|---|---|
| 1. ¿Qué es «la prueba» del Volcán? | **Matar al jefe que originalmente estaba justo antes de entrar al Volcán** (el del Oriental, `S.boss[4]`; bossPos del Oriental). | La «prueba» **no es un sistema nuevo**: se reutiliza el jefe existente. Los guardias de la muralla comprueban `S.boss[4]` (mismo dato que ya guarda `bossKill`). No hay nada que diseñar de mecánica; solo el **texto** de los guardias. |
| 2. Servicios de la capital | **Los mismos que una aldea, pero con más edificios y más PNJ** (es una ciudad). | Sin servicios exclusivos por ahora. La capital reutiliza las 9 estaciones por bioma y añade **edificios y habitantes** (≥ 30 PNJ, Fase 25). Cierra la pregunta 2 de §8.5. |
| 3. Muralla | **La muralla SOLO existe en el Volcán, y solo donde limita con la Pradera.** Debe ser **lo bastante grande para que NO se pueda ver el interior con la cámara** y **verse natural**. | Ver abajo. Queda anulada la lectura de §8 que la ponía en Oriental\|Volcán. |

### 9.1 · Cómo queda el Volcán (interpretación del agente; confirmar con la captura de la 44a)
1. **Oriental → Volcán (unión 4|5) es una unión ABIERTA como las demás** (frontera abierta, jefe = hito). La prueba **no** se pide ahí.
2. **Pradera|Volcán es la única muralla del mundo.** Es la unión «no encadenada»: la Pradera (nv 1) y el Volcán (nv 80) son vecinos directos en la rejilla, así que la muralla cierra ese atajo. Tiene **una puerta con guardias** que **se abre cuando `S.boss[4]` (jefe del Oriental) está muerto**, con texto tipo «Primero debes probarte: derrota al guardián del Oriente». Para quien ya lo mató sirve de **atajo de vuelta** Volcán↔Pradera (por eso tiene sentido que exista). *Por confirmar con el dueño: si prefiere que la puerta no se abra nunca (solo muralla) o solo se abra desde el lado de la Pradera.*
3. **Ubicación:** la Pradera tiene **mar al sur** (`Mar`, z 2640–2975 en su sistema actual) y a su sur está el Volcán. La muralla va **donde acaba el mar** (cabo/estrecho entre costa y cordillera), no sobre el agua; con el mundo ×2 se coloca en el tramo de unión que no sea mar. **A decidir con captura en la 44-0/44a.**
4. **Que NO se vea el interior:** la cámara es isométrica con zoom; un muro solo oculta lo que hay detrás si su altura supera **profundidad_oculta × tan(elevación de la cámara)**. Regla de la fase: **la altura se mide con la cámara real** (zoom mínimo y máximo de `zoom3`) y debe ocultar **al menos los 12 tiles** tras el muro; además el **«rayo X» del héroe** (`stencil:true`, silueta tras oclusores) **no debe revelar** lo de detrás ni al héroe del otro lado (excluir esta muralla del rayo X, por verificar en `r3d.js`). Si hace falta, el relieve de detrás del muro sube (cordillera) para taparlo.
5. **Que se vea NATURAL (no un muro recto de props):** (a) **la base es relieve**: una cordillera/risco real de `TER.heightAt` con el muro asentado en la cresta y **los extremos empotrados en la montaña** (sin cabos visibles); (b) el muro sigue la **curva del terreno** (tramos con ángulos y torres de vigilancia irregulares, no una línea recta); (c) piedra del Volcán (basalto oscuro de `propsdark3d.js`, musgo/ceniza en la base, grietas); (d) **antorchas/braseros y guardias** (`Mini` oscuros, Fase 6) en torre y puerta; (e) la puerta es un arco en la roca, no un portón aislado. **Hoja de contacto de la muralla antes de colocarla** (como los props oscuros), aprobada por el dueño.
6. **Las otras uniones con vecinos (Bosque|Oriental) y el borde exterior:** **montañas de relieve**, sin props (decisión de §8.1 b4), «escenario natural».

### 9.2 · Preguntas abiertas que quedan (no bloquean la 44-0)
1. Puerta de la muralla: ¿se abre solo al matar al jefe del Oriental, y desde ambos lados? (propuesta en 9.1-2).
2. Velocidad/viaje (monturas o estatuas) — se decide en las Fases 21/31/45.

---
## Nota de implementación (19 oct 2026, Lote R3D-F44-0)
Fase 44-0 (i)+(ii) HECHA: `src/world-scale.js` (escala `W2` por eje con meseta de ±640 px en la aldea, `?wk=1..3`, por defecto 2), motor de cordilleras `BIOMES.addRange/rangeAt` y relieve en `terrain3d.js`. Cordillera de prueba `sur` en el borde N del Volcán (`?range=0` la quita). Detalle y trampas en `AGENTS.md` → «Lote R3D-F44-0». Pendiente: poblar (iii), 44a, 44b, minimapa por chunks (47).

---
## Nota de implementación (19 oct 2026, Lote R3D-F44a)
Fase 44a HECHA (detalle, cifras y trampas en `AGENTS.md` → «Lote R3D-F44a»): unión **Pradera|Bosque ABIERTA** (`BIOMES.openPairs`, `seams`, `openAt`, `blendAt`; sin anillo ni compuerta; paleta 3D al 50 % en la línea y ±12 tiles), **barreras de relieve** centradas en las líneas Pradera|Volcán y Bosque|Oriental (`src/seams.js`, sustituyen a la cordillera `sur` de prueba), **jefes = hito** (`lockedAt` solo cierra el vacío, `S.home` = última aldea visitada, aviso de zona peligrosa). Medido y **diferido** de §10.2: índice espacial de `game.js`, mobs durmientes y props 3D por sector (con el mundo sin poblar cuestan < 1 ms; el heap, 177 MB, es lo que pesa). Hecho de §10.2-1: `Grid` (`src/r3d/sector3d.js`) y las sombras de contacto locales (corrige que con el ×2 ningún árbol tenía sombra). Pendiente de §10.3: ambiente (`AMBI`) y clima por posición, hitos/atalayas, gradiente de peligro, generación perezosa. Las otras 4 uniones se abren añadiendo su par a `openPairs` (Fases 7–11).

---
## Nota de implementación (19 oct 2026, Lote R3D-F44b)
Fase 44b HECHA (detalle, cifras y trampas en `AGENTS.md` → «Lote R3D-F44b»): `vilXf` = núcleo de aldea ×1,5 dentro de `W2` (`src/world-scale.js`, `?vk=`; vale para las 6 aldeas, `?vk=1` = 44a idéntico) y aldea de la Pradera REORGANIZADA por barrios con datos (`src/village-barrios.js`, `VBARRIOS.barrio(k, spec)`): calle mayor de 3 tiles, plaza de ≈ 6 tiles de radio, calle de oficios al norte, calle sur con taberna/iglesia/vecinos, cocina y molino al sureste; comprobada con `tools/r3d/village_check.py`. **No hecho:** iglesia en altillo (Fase 5), árboles ×1,3 (visual), `spec` de las otras 5 aldeas (Fases 7–11). Cifra cambiada respecto a §2-c: plaza ≈ 6 tiles de radio, no 4 (con puestos, pozo y tablón dentro).

---
## 10 · CUARTA RONDA (19 oct 2026, 16:15; pedido del dueño: «que el cambio de bioma sea seamless como WoW/Genshin» + «que NO se cargue todo el mundo directamente; lo técnico lo decides tú») — MANDA sobre §5 («no se construye un sistema de regiones») y amplía la 44a

### 10.1 · Estado medido tras la 44-0 (K=2, SwiftShader)
- Carga inicial 2,4 s (K=1) → 2,8 s (K=2); heap JS 22 MB → 64 MB; props 4 036 → 12 631. Hoy **se genera todo el mundo al arrancar** (los 6 biomas, `BIOMES.finish()`, rejilla `TER` entera de 864×376 tiles, `PROPS.list` completa, todos los mobs/POI de `game.js` ~l.405). El terreno 3D ya es por chunks con LRU (16×16 tiles); lo demás (props 3D, mobs, IA, rejillas) **no**.
- Con K=2 esto aún es asumible, pero crece con cada bioma poblado (44-0 iii, Fases 7–11): objetivo de esta ronda = **coste proporcional a lo que hay cerca del héroe, no al tamaño del mundo**.

### 10.2 · Streaming por sectores (diseño técnico, lo decide el agente)
Unidad: **sector = 8×8 chunks = 128×128 tiles (4 096 px)** → el mundo ×2 (27 648×12 032 px) son ≈7×3 sectores. Anillos alrededor del héroe con histéresis: **carga** a ≤ 1 sector, **descarga** a > 2 sectores (evita parpadeo en la frontera). Cada capa se pide/libera por sector:
1. **Índice espacial** (rejilla por sector) para `PROPS.list`, estaciones, POI, mobs, zonas `ZS`: el dibujo, las colisiones y las búsquedas consultan solo los sectores cercanos (hoy son listas lineales; ya se vio con `scatter` que escalan mal). *Bajo riesgo, primero.*
2. **Mobs durmientes:** fuera del anillo de carga el mob NO se simula ni se dibuja; se guarda como dato (`id, home, hp, respawn`). Al entrar el sector se «despierta» (reaparición coherente por tiempo transcurrido, sin teletransportes visibles). Jefes y PNJ de misión: siempre como dato.
3. **Props 3D por sector:** los grupos instanciados de `props3d.js`/`nature3d.js` se construyen al cargar el sector y se `dispose()` al descargarlo (geometrías compartidas, instancias propias); el terreno sigue con su LRU pero con **precarga direccional** (chunks en el sentido del movimiento, ~600 px antes de una unión) y presupuesto por fotograma (≈2,5 ms, como ya hace `update()`).
4. **Generación perezosa por bioma:** arrancar solo con el bioma del héroe + vecinos de unión; el resto se genera troceado en tiempo ocioso (`requestIdleCallback`/generadores) y SIEMPRE antes de que el héroe llegue a ≤ 1 sector de su unión (las uniones necesitan la altura del vecino). Requiere que `world-scale.js`/`layouts.js` sean invocables **por bioma** (hoy transforman la lista entera): refactor medido, con prueba de que el resultado es idéntico al actual (hash de `tileH` y de props, como en el Lote R3D-F44-0).
5. **Minimapa/mapa:** minimapa local de la zona cargada; mapa del mundo con niebla (Fase 47) sin necesitar el terreno 3D.
**Orden de implementación dentro de la 44a:** (1) índice espacial → (2) mobs durmientes → (3) props 3D por sector + precarga direccional → (4) generación perezosa (si la medición tras 1–3 lo justifica; si no, se deja para antes de poblar los 6 biomas en 7–11).
**Presupuestos (a medir con `perf_check.py` + un script de recorrido nuevo `tools/r3d/walk_seam.py`):** arranque ≤ 3 s con K=2 aunque se pueblen los 6 biomas; heap JS ≤ ~100 MB; ningún fotograma > 50 ms (≤ 33 ms de media) al cruzar una unión; draw calls ≤ 233 en la aldea (criterio previo). SwiftShader no vale para fps: se compara contador de objetos/tris/ms de construcción, y el dueño verifica fps en su equipo.
**Riesgos:** (a) guardado: los mobs durmientes y sus temporizadores deben serializarse igual que hoy (no subir `S.ver` salvo necesidad); (b) lógica que asume `mobs`/`PROPS.list` completos (IA global, misiones, `ZS`, minimapa 2D) → grep y adaptar; (c) bordes de sector con props grandes (huella) → asignar por centro y consultar con margen; (d) **el 2D ya no importa (decisión del dueño, 19 oct 16:17: se reemplazará pronto):** el streaming se diseña SOLO para 3D (`?r3d=1`); si algo rompe el 2D, no se arregla ni se pone como condición. Esto simplifica: índice y mobs durmientes pueden vivir en la capa 3D/lógica sin mantener rutas duales.

### 10.3 · Añadidos al «seamless» (entran en la 44a, además de §4)
- **Ambiente por posición:** luz, niebla de color (sin niebla de distancia: regla del estilo), clima y **crossfade de música** según la mezcla de bioma (peso `w` de la unión), con curva suave y sin saltos al volver atrás (histéresis).
- **Gradiente de peligro:** el nivel de mobs sube por tramos con la distancia al pueblo y a la unión (no de golpe en la frontera); aviso de zona peligrosa existente (§4-6).
- **Caminos y puntos de interés guía:** el camino principal cruza cada unión y serpentea por pasos/valles de la cordillera; atalayas, estatuas (hueco reservado para la Fase 45) y hitos visibles que anuncian el siguiente bioma. Las cordilleras dejan **pasos naturales** (el núcleo de montaña es infranqueable, el flanco no) para que no haya líneas rectas.
- **Criterio de hecho ampliado:** caminar Pradera→Bosque sin pantalla de carga, sin corte de color/música y sin tirones; las capas del §10.2 (1–3) activas y medidas; el 2D igual que antes.

## Nota de implementación (19 oct 2026, Lote R3D-F47 · Fase 47)
**Fase 47 HECHA** (§2-d opción A y §2-e): minimapa local alineado con la pantalla (círculo de ventana de 1 200 px girado con `R3D.az`, marca N), mapa del mundo entero con niebla (tecla M) y `S.fog` (54×24 celdas de 16 tiles = cadena `"54x24:hex"`; aditivo, sin subir `S.ver`; migra desde `S.map`). Implementación en `src/worldmap.js` (pintado por celdas solo al revelar: no hace falta «minimapa por chunks» aparte, §6-4). Detalle, trampas y pendientes (clic/zoom en el mapa, iconos de estatuas de la Fase 45) en `AGENTS.md` → «Lote R3D-F47».

## 11 · QUINTA RONDA (19 oct 2026, 18:25) — EL MUNDO ES UN CONTINENTE (Fase 49) — **MANDA sobre la «serpiente» 3×2 de §1/§8/§9 y sobre el cierre de bordes con «anillo/cordillera recta». ⚠ La COLOCACIÓN de biomas de §11.2 (Pradera al centro) quedó ANULADA por §12 (Pradera en la esquina, capital al centro); lo técnico de §11.3–11.4 (máscara de tierra, región por tile, cordilleras curvas, costas) sigue vigente.**
**Corrección del dueño (literal):** *«la zona en sí sea como un continente: ahora se va en línea recta a los otros biomas; quiero que la Pradera sea el nexo central y que de allí vayamos a los otros biomas, con bordes como un continente y no como un muro; que se sienta natural y que el mapa sea como World of Warcraft, que tenga sentido».* Un agente anterior interpretó «biomas contiguos» como 6 rectángulos encadenados en serpiente (Pradera→Bosque→Pantano / Volcán←Oriental←Cumbres) con bordes rectos: eso es lo que hay que deshacer. **Elegido por el dueño: «anillo con vecinos lógicos» + «solo plan + boceto» (SIN código en este lote).**
### 11.1 · Medido hoy (para no repetir el error)
- Rejilla **3×2** (cada bioma 9 216×6 016 px = 288×188 tiles; mundo 27 648×12 032 = 864×376 tiles): fila 0 = Pradera(0), Bosque(1), Pantano(2); fila 1 = Volcán(5), Oriental(4), Cumbres(3). La Pradera solo toca al Bosque (E) y al Volcán (S, mar+cordillera). Costas = el **borde de la caja** (acantilado/estratos rectos); entre biomas = anillo de 1 tile o cordillera recta (`seams.js`). `BIOMES.at(x,y)` es una **búsqueda por RECTÁNGULO**; todo (mobs, props, estaciones, música, paleta) está en coordenadas locales de cada rectángulo; `BIOMES.openPairs=[[0,1]]`; `BIOMES.seams` se calcula solo a partir de rectángulos que comparten arista.
### 11.2 · Geografía propuesta (boceto: `docs/style-reference/continente_boceto.png`, generado con `tools/r3d/continente_boceto.py`; ESQUEMÁTICO)
Rejilla **3×3 de casillas de 288×188 tiles** (mundo 864×564 tiles = 27 648×18 048 px, +50 % de área; los 6 biomas conservan su tamaño y sus layouts locales); 6 casillas ocupadas y 3 esquinas de **mar/bahía/cabo**:
| Casilla | Bioma | Papel |
|---|---|---|
| centro (1,1) | **PRADERA** | **nexo**: toca por arista a Cumbres (N), Bosque (O), Oriental (E) y Volcán (S) |
| O (0,1) | Bosque | primera salida natural (camino ya abierto desde la 44a) |
| SO (0,2) | Pantano | cuelga del Bosque (N) y del Volcán (E): se llega por el Bosque |
| N (1,0) | Cumbres | montañas al norte de la Pradera (paso de montaña con carretera) |
| E (2,1) | Oriental | capital + **puerto** en un **golfo** al sureste (la esquina (2,2) es mar) |
| S (1,2) | Volcán | tras la **muralla con guardias** de la Pradera (decisión 3.ª ronda, se mantiene) |
Esquinas NO (0,0), NE (2,0), SE (2,2): **mar** (bahía NO, cabo NE, golfo SE). **El orden de niveles ya no es una cadena de rectángulos:** la dificultad la dan **relieve + pasos + avisos de zona peligrosa** (decisión 44a: jefes = hito, no llave). Cuidado con Cumbres (lv 47) y Oriental (lv 63) pegados a la Pradera (lv 1): sus fronteras con la Pradera son **cordilleras/cañones con UN paso con carretera** (ver 11.4), nunca llanura abierta.
### 11.3 · Cómo se hace «continente» y no «muro» (lo técnico)
1. **Máscara de tierra** (`LAND`): unión de las casillas ocupadas, redondeada por una elipse grande y erosionada con fbm (escalas ≈ 60 tiles) + bahías y cabos. Fuera de la máscara = **mar profundo** (ya existe `TER.seaAt` y el agua 3D con oleaje Gerstner de R3D-AGUA-IMPL). **La costa** = playa/acantilado bajo (alturas 0,5–1) que baja al agua con la espuma del agua D; **sin anillo de acantilado recto ni estratos rectos** en ningún borde. Los estratos «diorama» solo en el borde exterior del mundo (decisión (f)): ahora ese borde es el MAR, así que se ve el agua hasta el horizonte (no hay niebla: hace falta una lámina de agua grande; riesgo de §2-f opción B, pero esta vez es agua plana barata).
2. **Fronteras que serpentean:** la región de un tile se decide con el **dominio deformado** (`x+fbm·70 tiles`) → `BIOMES.at` deja de ser «¿en qué rectángulo está?» y pasa a **una rejilla `Uint8` por tile (864×564 = 487 KB), precalculada una vez** (O(1) por consulta; todo `biomeAt` de `game.js`, `lgAt`, música, `WMAP` sigue igual). `BIOMES.blendAt` (mezcla de paleta, 0,5 en la línea) ya funciona por distancia: se recalcula sobre la nueva rejilla. **Los datos de cada bioma NO se mueven** (siguen locales a su casilla); con deformación ≤ 35 tiles basta con que `seams.js` retire árboles/POI/guaridas que queden al otro lado (ya hace algo parecido en las uniones abiertas).
3. **Pasos y barreras naturales** (campo de altura continuo, motor `BIOMES.addRange` ya existente): cordilleras con forma de **cresta curva** (no recta) en las fronteras Pradera|Cumbres, Pradera|Oriental, Pradera|Volcán (esta con la muralla), Bosque|Pantano (ciénaga/río ancho) y Pantano|Volcán (lava/cañón); **cada una con un paso** por donde sale la carretera. Bosque|Pradera queda abierto (colinas suaves, hecho en la 44a).
4. **Carreteras desde la Pradera** (como en el boceto): **cuatro salidas** (O, N, E, S) que cruzan los pasos y siguen por cada bioma hasta su aldea; Pantano se enlaza desde el Bosque. `seams.js` ya sabe coser el camino principal en uniones abiertas verticales: ampliar a horizontales y a pasos curvos.
5. **Pradera:** hoy tiene **mar al sur** (fue la barrera con el Volcán). En el continente el sur es el Volcán detrás de la muralla: ese mar se convierte en lago/ría o se quita (decisión del agente al implementar; se puede dejar una **ría** que entra desde el golfo hasta el molino).
6. **Minimapa/mapa del mundo:** `WMAP` ya se adapta (`TER.NX/NY` → 54×36 celdas; `S.fog` descarta la rejilla vieja y migra solo). El mapa del mundo pasará a mostrar la silueta del continente con el mar como celdas ya reveladas por la costa.
### 11.4 · Alcance por fases (nueva **Fase 49**, partida en 4; el dueño aprueba el boceto ANTES de empezar)
| Parte | Qué | T |
|---|---|---|
| **49a · Rejilla 3×3 y región por tile** | `place` de los 6 biomas en la rejilla 3×3 (`layouts.js`); mundo 864×564; **`BIOMES.at` por rejilla `Uint8` con dominio deformado**; `seams` y `openPairs` para TODAS las aristas (la «cadena» desaparece); `lockedAt` solo cierra el vacío; `S.home`/spawn de cada bioma recalculados; `walk_seam.py` actualizado | L |
| **49b · Costa y mar** ✅ HECHA 19 oct 2026 (`src/coast.js`, `?coast=0`, `tools/r3d/coast_check.py`; ver AGENTS.md «Lote R3D-F49b»; ría de la Pradera descartada) | máscara `LAND`, playa/acantilado bajo, mar profundo hasta el horizonte, estratos solo donde haya borde de mundo, retirada del anillo y de la caja recta; bahías y cabos; ría en la Pradera | L |
| **49c · Pasos, cordilleras curvas y carreteras** (19 oct 2026: HECHO solo el retoque visual de las cordilleras actuales, ver AGENTS.md «Lote R3D-F49c-MONTAÑAS»; lo demás sigue pendiente) | crestas curvas con paso en cada frontera, muralla del Volcán (hoja de contacto aprobada antes), carreteras desde la Pradera, bosquetes de transición con mezcla de especies | L |
| **49d · Repaso** | `border_shot.py` por cada frontera y costa (día/noche), `walk_seam.py` (alcanzabilidad: se llegan los 6 biomas, 0 cruces por barreras salvo los pasos), rendimiento (heap/chunks con +50 % de área), minimapa, **sin tocar la progresión** (rebalanceo = Fase 36) | M |
**Orden recomendado:** Fase 49 **ANTES de las Fases 7–11** (poblar un bioma sobre una geografía que va a cambiar es trabajo tirado); las Fases 3–5 (suelo/naturaleza/edificios de la Pradera) son independientes y pueden ir antes. **Compatibilidad de partidas:** las coordenadas de mundo cambian (las casillas se recolocan); al cargar, el héroe se coloca en `spawnOf(S.home)` y `S.fog` se reconstruye (ya implementado en la Fase 47); `S.map`/`S.boss`/`S.home` no cambian.
### 11.5 · Preguntas abiertas para el dueño (no bloquean el boceto)
(a) ¿Aprueba la geografía del boceto (Cumbres N, Bosque O, Oriental E con golfo, Volcán S tras la muralla, Pantano SO)? ¿Quiere intercambiar alguna casilla? (b) ¿Islas pequeñas fuera de la costa (con tesoros/POI) en las esquinas de mar? (c) ¿Se acepta que Pantano solo se alcance por el Bosque (o por el Volcán), no desde la Pradera? (d) Tamaño: ¿mantener 288×188 por bioma (mundo +50 %) o reducir los biomas externos para que la Pradera destaque como centro?

## 12 · SEXTA RONDA (19 oct 2026, 18:39; CERRADA con las respuestas de las 18:47) — MAPA DEFINITIVO: 9 biomas en rejilla 3×3 + 2 PLANOS (Infierno y Cielo), 15 TIERS y PROGRESIÓN NATURAL (Fase 49/50) — **MANDA sobre §11.2 y sobre la primera versión de §12 (18:31). Solo plan, SIN código.**
**Decisiones del dueño (todas vigentes):** (1) **Páramo Arcano en el NE, Desierto en el SE y Costa en el SO: sí.** **La Pradera pasa al BORDE (esquina)** «para que sea más fácil equilibrar las zonas siguientes» y **la capital Oriental va AL MEDIO**. (2) **15 TIERS.** (3) **Se añade un ÚLTIMO bioma: el CIELO**, accesible **solo desde el Infierno con un portal**; al matar al **jefe final del Volcán** se abre **una grieta de la realidad con una escalera que baja al Infierno**; el Infierno y el Cielo traen **tiers nuevos** y **la celestita pasa al Cielo** (ahora tiene sentido). (4) **Partidas antiguas: DESCARTADAS y NO se consideran** («nadie está jugando»): **no escribir migraciones ni compatibilidad** (se sube `S.ver` y listo; se puede borrar código de migración que estorbe). (5) **Combate naval: sí, pero SOLO PLANEADO** (la navegación tiene sentido con él). (6) El Volcán ya NO es el final (lo es el Cielo).
**Respuestas del dueño a la 12.7 (18:47, todas vigentes):** (a) **el portal del Infierno al Cielo se abre AL VENCER AL JEFE DEL INFIERNO**; (b) **la distribución de niveles y tiers le gusta; hay que REBALANCEAR TODO EL JUEGO otra vez con ella (Fase 36/50d) y añadir los MODELADOS (armas, armaduras, iconos) de cada tier**; (c) **la Costa de las Tormentas es un BIOMA COMO TAL, con su tier propio y SU PROGRESIÓN: la NAVEGACIÓN ES OPCIONAL y NUNCA es parte de la progresión (el jugador no debe tener que «grindear el barco»)**; (d) **la navegación queda APARTE, por decidir (¿skill?)**: servirá para sacar **tesoros repartidos por las islas** y **combates navales**, y **toda esa idea puede ser una EXPANSIÓN FUTURA**; (e) **las aristas Bosque|Capital y Cumbres|Capital están CERRADAS (sin paso)**: por el lore **las puertas están cerradas y a la capital solo se accede desde el DESIERTO**, como marca la progresión.
Boceto actualizado: **`docs/style-reference/continente_boceto.png`** (`tools/r3d/continente_boceto.py`; esquemático).
### 12.1 · Los 9 biomas del continente y los 2 planos (la tabla rehecha)
Rejilla 3×3 (cada casilla 288×188 tiles; continente 864×564 tiles = 27 648×18 048 px). **Se recorre en el orden 1→9 por EDGE-adyacencia (cada bioma toca al siguiente por una arista):** Pradera (SO) → sube por el oeste → recorre el norte → baja por el este → entra en la capital del centro → sale al sur → Volcán (SE).
| # | Casilla (col,fila) | Bioma | Nivel | Tiers (nuevos en **negrita**) | Cultura / papel | Estado |
|---|---|---|---|---|---|---|
| 1 | SO (0,2) | **Pradera** | 1–10 | cobre 1 · estaño 4 · bronce 8 | medieval · inicio y tutorial (esquina: la zona más fácil de equilibrar) | existe |
| 2 | O (0,1) | **Bosque** | 11–19 | hierro 11 · acero 16 | silvana | existe |
| 3 | NO (0,0) | **Pantano** | 20–28 | plata 22 | palafito | existe |
| 4 | N (1,0) | **Cumbres** | 29–37 | mitril 30 | nórdica | existe |
| 5 | NE (2,0) | **Páramo Arcano** | 38–46 | **A «lunita»** 38 | **cultura feérica-arcana de cristal** (élfica alta/persa arcana: torres, observatorios, astrolabios, jardines lunares); identidad de la **magia** | **NUEVO** |
| 6 | E (2,1) | **Desierto «Dunas de Ámbar»** | 47–55 | **B «electro»** 47 | **cultura egipcia con toques beduinos** (pirámides escalonadas, obeliscos, oasis con mercados de tiendas, caravanas) | **NUEVO** |
| 7 | **centro (1,1)** | **Oriental · CAPITAL (nexo)** | 56–64 | adamantita 56 | japonesa; ≥ 30 PNJ, mismos servicios que una aldea, **hub de viaje del continente**; **única entrada: el Desierto** (las puertas de Bosque y Cumbres están cerradas) | existe (se reubica) |
| 8 | S (1,2) | **Costa de las Tormentas** | 65–72 | **runita 66** (reasignada desde el Oriental) | **cultura portuguesa/mediterránea de navegantes** (casas de piedra encaladas, faros, astilleros, cartas náuticas; runas grabadas en los cascos); bioma **normal y completo** con su progresión; **puertos que SOLO decoran y servirán a la expansión de navegación (opcional)** | **NUEVO** |
| 9 | SE (2,2) | **Volcán** | 73–82 | oricalco 73 | mesoamericana; **muralla** y su puerta; jefe final = **abre la grieta** | existe |
| plano | (aparte) | **INFIERNO** | 83–91 | **C «infernal»** 84 (nombre provisional) | grietas y ríos de lava sobre un abismo; **llegada por la ESCALERA del Volcán** | **NUEVO (plano)** |
| plano | (aparte) | **CIELO** | 92–99 | celestita 92 · **D «aurora»** 97 (provisional) + Árbol del Mundo | islas flotantes entre nubes unidas por puentes; **llegada por el PORTAL del Infierno**; **último bioma** | **NUEVO (plano)** |
**Cuenta de tiers: 11 actuales + 4 nuevos (A, B, C, D) = 15** (la **runita** se reasigna del Oriental a la **Costa**, que así tiene tier propio sin añadir ninguno). Maderas análogas (1 por tier): pino, abedul, roble, fresno, sauce, arce, tejo, **álamo plateado (A)**, **acacia/palmera (B)**, ébano, caoba/baobab, **madera calcinada (C)** y Árbol del Mundo + **D** en el Cielo (las maderas actuales se reasignan a las bandas nuevas; `CULT_OF` gana las culturas 6–9: arcana, egipcia, marinera, infernal, celestial). **Todas las bandas de nivel de este cuadro son PROPUESTA y cambian respecto a las de hoy** (p. ej. mitril de 44 → 30, runita de 70 → 61, celestita de 88 → 92): las fija `meas_progresion.py` en la Fase 50d. **Los 2 planos NO son parte de la rejilla**: son dos mapas de 288×188 tiles (`place` lejos del continente) unidos por **entidades de paso** (escalera, portal) con fundido, para no tener fronteras con el continente; la niebla/mapa del mundo (Fase 47) los muestra como **pestañas** («Superficie · Infierno · Cielo»).
### 12.2 · Fronteras del continente (qué barrera pide cada arista)
La capital en el centro toca por arista a Bosque (O), Cumbres (N), Desierto (E) y Costa (S): **las aristas entre niveles muy distintos son cordilleras/acantilados curvos con UN paso y carretera** (la dificultad la da el peligro del paso, no un muro; **las dos aristas de la capital con el Bosque y las Cumbres son la excepción: están cerradas por lore**):
| Arista | Niveles | Tratamiento |
|---|---|---|
| 1\|2, 2\|3, 3\|4, 4\|5, 5\|6 (Pradera→Bosque→Pantano→Cumbres→Páramo→Desierto) | contiguos | **ABIERTAS** (colinas suaves, ecotono con mezcla de paleta y exploradores) |
| 6\|7 (Desierto→Capital) y 7\|8 (Capital→Costa), 8\|9 (Costa→Volcán) | contiguos | **ABIERTAS** salvo **la entrada del Volcán = MURALLA con guardias** (puerta tras vencer al jefe del Oriental, regla de la 3.ª ronda) |
| **Bosque\|Capital** (11–19 vs 56–64) y **Cumbres\|Capital** (29–37 vs 56–64) | muy distintos | **CERRADAS (decisión del dueño 18:47): muralla de la capital con su PUERTA SELLADA** («puertas del Bosque y Boreal»); no hay paso; **a la capital solo se entra desde el Desierto**. *Idea opcional (no decidida): al llegar a la capital y abrir las puertas DESDE DENTRO se crean atajos de vuelta hacia el Bosque y las Cumbres (estilo atajo de Dark Souls), nunca de ida.* |
| **Pradera\|Costa** (1–10 vs 65–72) | muy distintos | **acantilado costero** sin paso (también para barcos: la navegación NO debe saltarse la progresión) |
| **Desierto\|Volcán** (47–55 vs 73–82) | muy distintos | **cañón de lava** sin paso |
La Pradera conserva su mar/ría al sur-oeste (ya existe en su layout: es ahora el **mar exterior**) y toca al Bosque por el norte.
### 12.3 · Diseño para que sea NATURAL ir al siguiente bioma (los 6 empujes; cada transición los lleva TODOS)
1. **Geografía continua:** el siguiente bioma es el vecino por arista; la carretera principal lo atraviesa y el paso se ve desde la zona final del anterior. Sin muros ni pantallas de carga (salvo los dos planos, que son escalera y portal).
2. **Ecotono:** el último 15 % de cada bioma lleva flora, fauna y paleta del siguiente (mezcla de la 44a) y 1–2 **exploradores** con el nivel del vecino −3.
3. **Gradiente de peligro suave:** en el paso el nivel de los mobs sube ≈ 5 niveles en 40 tiles; aviso de zona peligrosa solo si Combate < 75 % del recomendado; reaparición en la última aldea visitada.
4. **El jefe del bioma es un HITO que señala el camino:** al vencerlo suelta una **carta/mapa/recuerdo** que abre la cadena de misiones del siguiente y revela su aldea en el mapa.
5. **Atractivo económico y de oficio:** la **mena/madera del tier siguiente solo existe allí**; su aldea vende las recetas y paga más; un **ingrediente de fundición** de cada bioma hace falta para el tier del anterior (sin «llaves»).
6. **Refugio:** campamento/atalaya con estatua de viaje y fogata a mitad de cada paso; la **capital central** conecta al resto (viaje rápido) y es el sitio al que se vuelve a vender, reparar y cambiar de camino.
**Regla de nivel:** cada bioma cubre ≈ 9 niveles; al entrar por el paso el jugador debería estar en el 80–100 % del nivel recomendado; la zona final de un bioma equivale al nivel de entrada del siguiente (superposición de ≈ 3 niveles, estilo WoW).
### 12.4 · Infierno, Cielo y los dos pasos entre planos
- **Escalera del Volcán → Infierno:** el **jefe final del Volcán** (hoy «Señor del Fuego», último jefe; deja de ser el final del juego) abre **«una grieta de la realidad»**: una **escalera** (entidad `PORTAL`/`STAIRS` con fundido a negro y aviso «la grieta se ha abierto» para toda la partida: `S.rift=1`) que baja al Infierno. La grieta queda abierta (también sirve de atajo de vuelta).
- **Portal del Infierno → Cielo (DECIDIDO 18:47):** el Cielo **solo** se alcanza desde el Infierno por un **portal**, que **se abre AL VENCER AL JEFE-HITO DEL INFIERNO** (igual que la grieta se abre con el del Volcán; `S.portal=1`).
- **Tiers:** Infierno **C** (nivel 84; el Infierno tiene así 1 tier); Cielo: **celestita** (92, ya existe y **se reasigna al Cielo**) y **D** (97). El Cielo es **el final del juego** (jefe final nuevo, nivel ≈ 99; el «Señor del Fuego» pasa a ser el jefe-hito del Volcán).
- **Arte/estilo:** el Infierno y el Cielo se pintan con la misma receta óleo oscuro (§4.9) con filas `TOD` propias (Infierno: rojo-negro con la lava como luz principal; Cielo: dorado frío, sin sombras duras); **sin niebla** (decisión del dueño); el Cielo encaja con la firma «diorama flotante» del juego (islas con estratos que flotan).
### 12.5 · Navegación y COMBATE NAVAL — **OPCIONAL, fuera de la progresión, EXPANSIÓN FUTURA (solo planeada; NO implementar)**
**Reglas del dueño (18:47):** (1) la navegación es **OPCIONAL y NUNCA gatea la progresión** (no se «grindea el barco»; por eso la Costa de las Tormentas es un bioma normal con su tier y los barcos no dan acceso a ningún bioma ni tier); (2) sirve para **sacar tesoros repartidos por las islas** y para **combates navales**; (3) **toda la idea puede ser una expansión futura**; (4) lo de la skill queda **por decidir, aparte**. **Borrador para cuando se retome** (no es compromiso): anillo de mar fuera de la rejilla con islas de nivel creciente con la distancia (30 → 85), barco propio (se compra/alquila en los **puertos de la Costa**, que ya existen como decorado), combate naval reutilizando el combate activo, objetos de recompensa **cosméticos o de comodidad** (no tiers: así no es obligatorio), niebla del mapa que se revela al navegar (Fase 47 ya lo permite). **Condición de diseño:** nada de lo obtenido navegando puede ser requisito de la progresión principal ni dar ventaja que obligue a hacerlo.
### 12.6 · Fases (insertadas tras la 49; ver «Fase 50/51» en la cola)
| Fase | Qué | T |
|---|---|---|
| **49a (ampliada)** | rejilla **3×3 con los 9 biomas** (los 3 nuevos —Páramo, Desierto, Costa— como **ESQUELETO**: paleta, relieve, aldea mínima, 3 mobs), **región por tile con dominio deformado**, generalización de `BIOMES.N` (hoy arrays de 6: `META`, `PAL`, música, `lv`, `CULT_OF`, `HIDEOF`, `lt_<bioma>…`), `S.ver` ↑ **sin migrar** | L |
| 49b–49d | costa irregular y mar · cordilleras curvas con paso y carreteras · repaso (§11.4) | L ×3 |
| **50a / 50b / 50c** | **Desierto**, **Páramo Arcano**, **Costa de las Tormentas** (uno por fase): cultura, aldea por barrios (`VBARRIOS`), props oscuros, suelo, luz, agua, enemigos, jefe-hito, recursos del tier, música | L ×3 |
| **50d** | **Tiers A y B** + reasignación de bandas de nivel de los 11 anteriores (runita → Costa) + **REBALANCEO DE TODO EL JUEGO** (`meas_progresion.py`, daño/vida/XP, precios, drops) + **MODELADOS por tier** (armas, armaduras, escudos, iconos pintados y herramientas de cada tier nuevo y de los reasignados; `armorcult3d.js`, `weapons3d.js`, `item-icons.js`) | XL |
| **Fase 52 · Infierno** y **Fase 53 · Cielo** | cada plano: mapa, cultura, enemigos, jefe-hito, **tiers C y D + celestita**, escalera/portal, filas de luz, música, pestañas del mapa | L ×2 cada una |
| **Fase 51 · Navegación y combate naval (EXPANSIÓN FUTURA, opcional)** | 12.5 (solo planeada; fuera del camino principal) | XL |
| Fases 7–11 | se hacen con las **bandas nuevas** y las 6 reglas de 12.3; **Oriental (10)** incluye la capital **al centro** | — |
### 12.6b · Culturas por bioma (DECIDIDO 19 oct 18:52)
Existentes: Pradera medieval (0), Bosque silvano (1), Pantano palafito (2), Cumbres nórdicas (3), Oriental japonesa (4), Volcán mesoamericana (5). **Nuevas:** Páramo Arcano = **feérica-arcana de cristal** (6); Desierto = **egipcia/beduina** (7); Costa = **portuguesa/mediterránea de navegantes** (8); Infierno = **demoníaca** (forjas, tronos, gótico de hierro negro; alternativa asiria/mesopotámica) (9); Cielo = **celestial** (griega clásica/bizantina: templos de mármol y oro, ciudades sobre nubes) (10). `CULT_OF` (game.js y `armorcult3d.js`) pasa de 6 a 11 culturas (los ids son provisionales); cada una necesita su familia de armadura, armas, madera y botín `lt_/lw_` y su arquitectura de aldea (parte del modelado por tier de la Fase 50d y de las aldeas de la 49).

### 12.7 · Preguntas
**Cerradas el 19 oct 18:47** (ver arriba). **Quedan por decidir (no bloquean la 49a):** (a) nombres definitivos de los tiers A–D (lunita, electro, infernal, aurora son provisionales); (b) si la **skill de Navegación** existe (dueño: «por decidir, aparte»; solo afecta a la expansión futura); (c) *(opcional)* atajos abiertos desde dentro de la capital hacia el Bosque y las Cumbres; (d) cuándo se hace el rebalanceo global (propuesta: dentro de 50d, tras tener los biomas y tiers montados).

> **Implementación 49a (19 oct 2026):** hecha la rejilla 3×3 (9 biomas, 4 uniones cerradas 0|8·1|4·3|4·5|7), `own` (rectángulo) vs `at` (dominio deformado), esqueleto 6–8 sin jefe. Detalles, trampas y lo no hecho: AGENTS.md «Lote R3D-F49a». Prueba: `tools/r3d/continent_check.py`.
