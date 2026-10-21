# NotScape: guía isométrica pintada «cozy» (2D) — ACTUALIZADA el 17 oct 2026

Guía de estilo del **modo 2D isométrico** y fuente de **datos del mundo** (tiers, especies, biomas, jefes, diorama, bloqueos). Escrita el 11 oct 2026; revisada el 17 oct 2026 para convivir con el porteo a three.js.

> ### ¿Sigue haciendo falta? SÍ, pero con otro papel
> - **El 2D sigue siendo el modo predeterminado hasta el corte F9** (`?r3d=1` activa el 3D). Mientras tanto, esta guía manda en **todo lo que se dibuje en 2D**.
> - **En lo visual del 3D manda `docs/GUIA_3D_PORTEO.md`** (diorama pintado, §4.9 **estilo objetivo «óleo oscuro» No Rest for the Wicked**) y `docs/GUIA_PERSONAJES_3D.md` para personajes. Donde esta guía diga algo de color, luz, grano o ambiente y choque con ellas, **gana la 3D**.
> - **Lo que de aquí sigue valiendo también en 3D:** la jerarquía de datos (§3 tabla de tiers, §13 biomas/monstruos/jefes/especies), el formato diorama (§11), los bloqueos por jefe y la transición entre biomas (§12), y el lenguaje de formas aprobado (§4, «Formas aprobadas»).
> - **Lo que ya NO aplica:** «nada de 3D», `INVENTARIO.md`, los atlas de assets (§6), el plan F0–F8 (§7), el modo antiguo `?old`, y el grano de papel / la paleta pastel como look final del 3D.
> - Cuando se llegue a F9 (corte) y se retire el 2D, esta guía se archiva en `docs/HISTORIAL.md` conservando §3 (tiers), §11–§13.

| § | Tema | Estado hoy |
| --- | --- | --- |
| 0 | Cómo usar | **Reescrito** |
| 1 | Decisiones | **Actualizado** (la regla «nada de 3D» está superada) |
| 2 | Geometría isométrica | Vigente en 2D; el 3D usa la misma cámara (ortográfica 30°, 45°) con acimut giratorio |
| 3 | Paleta | Colores pastel = **2D**; la **tabla de tiers es dato vigente** (en 3D el óleo los modifica: ver nota) |
| 4 | Lenguaje de formas | **Vigente** (las formas aprobadas son las que se portean a 3D) |
| 5 | Técnica de pintado | Solo 2D (pincel, grano de papel). **En 3D y óleo no hay grano ni trama** |
| 6 | Catálogo de assets | **Histórico** (los atlas no se hacen; todo sale de código) |
| 7 | Plan de trabajo | **Sustituido** por `GUIA_3D_PORTEO.md` §6 y la «HOJA DE RUTA ÚNICA» de `AGENTS.md` |
| 8 | Riesgos | Parcial (memoria y filtros por frame siguen valiendo en 2D) |
| 9 | Criterios de aceptación | Vigente |
| 10 | Reglas | Vigente (preguntas ya respondidas) |
| 11 | Formato diorama | **Vigente** (también en 3D) |
| 12 | Bloqueos, transiciones, luz por bioma | **Vigente**; la luz por bioma en 3D son filas de `TOD` por bioma (guía 3D §4.8) |
| 13 | Datos reales del juego | **Vigente con correcciones** (hoy 11 tiers y 11 maderas) |

## 0. Cómo usar este documento

- **Antes de nada**, lee `AGENTS.md` (decisiones y registro) y, si vas a tocar el 3D, `docs/GUIA_3D_PORTEO.md` + `docs/GUIA_PERSONAJES_3D.md`. Esta guía es de apoyo para el 2D y para los datos del mundo.
- **Referencia visual 2D:** `docs/style-reference/notscape-diorama.html` (colores y técnica de pincel; sus formas **no** están aprobadas) y `notscape-cenital.html` (composición y proporciones). Las formas aprobadas están en `prueba_formas_v3.png`. **Referencia visual 3D:** `r3d/referencia-3d.html` y la demo del estilo objetivo `r3d/demo-nrftw.html`.
- **Prioridad:** en lo visual del 2D manda este documento; en lo visual del 3D, las guías 3D; en lo técnico, `AGENTS.md`: no tocar lógica, guardado ni colisiones, una rama por fase.
- Donde aparezca [verificar], confirma el dato en el código antes de usarlo. Todo el arte se genera por código; no hay arte pintado a mano.
- Las desviaciones decididas por el dueño (cursor de tile, resalte de entidades, escala visual, etc.) están en «Decisiones ya tomadas por el dueño» de `AGENTS.md`. Donde choquen, gana `AGENTS.md`.

## 1. Decisiones ya tomadas

- **2D con proyección isométrica 2:1** (modo predeterminado hasta F9). ~~Nada de 3D ni Three.js~~: **superado el 17 oct 2026**; el dueño aprobó portear el mundo a three.js (solo con `?r3d=1`, ver `GUIA_3D_PORTEO.md`). La excepción previa del agua en WebGL sigue vigente en 2D.
- **La lógica no cambia.** El mundo sigue siendo una cuadrícula plana; la isometría solo se aplica al dibujar y, a la inversa, al convertir clics en posiciones.
- **Colores:** aprobados (sección 3).
- **Formas (dirección actual, tentativa):** poligonales con pocos polígonos, al estilo OSRS, pintadas con la paleta pastel y el pincel de la sección 5. Las formas redondeadas no convencieron al dueño y tampoco quiere «todo cubitos». **Desde el 12 oct 2026 cualquier técnica de dibujo vale mientras mantenga la vista isométrica 2:1** (sección 4). **El 12 oct (noche) el dueño aprobó el lenguaje unificado de `prueba_formas_v3.png`** (sección 4, «Formas aprobadas»).
- **Resolución:** el arte estático se prerenderiza a la escala real de pantalla, `ISO.scale()` = zoom × `devicePixelRatio` (hasta 3,2), no a un 2× fijo. El dueño aceptó el coste de memoria (≈129 MB con 12 chunks a 3,2×).
- **Alturas:** niveles discretos (agua, suelo, acantilado), no un mapa 3D real.
- **Formato diorama por bioma (decidido por el dueño).** Cada bioma es un bloque isométrico flotante con el corte de tierra visible, como en la primera demo. Ver sección 11.
- **Estilo objetivo (17 oct 2026): «óleo oscuro» tipo *No Rest for the Wicked*** (`GUIA_3D_PORTEO.md` §4.9; el dueño puede bajar su intensidad si estorba a la lectura). Aplica al 3D; el 2D conserva su look pastel hasta el corte.

## 2. Geometría isométrica

Un tile mide 56×28 px lógicos (112×56 a 2×) y cada nivel de altura suma 22 px. Proyección de un punto (x, y, z) del mundo a pantalla, con (Ox, Oy) el origen de la cámara:

```latex
s_x = O_x + (x - y)\cdot 28 \qquad s_y = O_y + (x + y)\cdot 14 - z\cdot 22
```

Para convertir un clic en posición del mundo, con z = altura del suelo en ese punto:

```latex
u = \frac{s_x - O_x}{28},\quad v = \frac{s_y - O_y + 22z}{14},\quad x = \frac{u + v}{2},\quad y = \frac{v - u}{2}
```

- **Escala del mundo [verificar].** Si el juego usa píxeles como unidad, define cuántos equivalen a un tile y ya está documentada en `AGENTS.md` (`ISO.TILE = 32` px de mundo por tile). Colisiones y pathfinding siguen en la cuadrícula plana original.
- **Orden de dibujo.** Tiles por (x + y) ascendente, desempate por x. Entidades por la posición de sus pies. Objetos que ocupan varios tiles se ordenan por su tile más cercano a la cámara.
- **Alturas:** agua 0,75; suelo 1; acantilado 2. Una cara lateral solo se dibuja donde el vecino es más bajo.
- **Luz arriba a la izquierda.** Cara superior la más clara, cara izquierda media y cara derecha un 28 % más oscura (mezcla hacia `#6a3a3a`). Las sombras proyectadas caen hacia abajo a la derecha.
- **Cámara.** Sigue al jugador y se redondea al píxel de render para evitar vibraciones. Fuera del mapa se muestra el papel `#fdf9e3`.
- **Oclusión.** Los objetos altos que tapan al jugador se atenúan al 50 % mientras lo cubren.
- **Cursor.** El tile bajo el puntero se resalta con un rombo suave.

## 3. Paleta

> **Nota (17 oct 2026):** estos colores pastel son el look del **2D**. En 3D el estilo objetivo (óleo oscuro) es más sucio y apagado: los modelos portan sus colores base, pero el grado los desatura (×0,58) y los enfría/calienta. **La tabla de tiers de abajo sigue siendo la fuente de datos** (principal/luz; la sombra se calcula) y hoy hay **11 tiers** (ver §13). Pendiente con el dueño: cómo mantener distinguibles los tiers bajo el óleo (`GUIA_3D_PORTEO.md` §4.9). El papel `#fdf9e3` y el contorno `#5b3a29` son del 2D; en 3D los contornos los fija §4.3 de la guía 3D.

Los colores de la demo están aprobados y se usan tal cual. Contorno `#5b3a29` (nunca negro puro) y papel `#fdf9e3`.

- **Pasto:** base `#a6d24c` y `#8fc443`; luz `#d4ee7a` / `#c6e86a`; sombra `#4f9438` / `#3f8030`.
- **Arcilla y tierra:** arcilla `#e8a06a`; franja de tierra `#a3643d`, luz `#c98a5a`, sombra `#6f4128`.
- **Agua:** degradado `#c4f6f2` → `#52d2e0`; manchas `rgba(40,150,190,.28)`; destellos `rgba(255,255,255,.7)`; cara frontal translúcida `rgba(110,215,235,.75)`.
- **Vegetación:** hoja `#6fb048` con luz `#b4e06a`; copas `#5fa046` / `#6fb04a` / `#7cc050`.
- **Detalles:** flores `#ff9ac0`, `#ffd75a`, `#fff`; fuego `#ff9a3a`, `#ffd95a`, `#fff6c0`; boya `#ee3b2f`; madera `#9b6a3f`, `#a8683a`, `#bd7a45`; oro `#f1c24a`; piedra `#9a958d` con luz `#d0cbc0`.
- **Piel y tela del personaje:** piel `#f3cba3` (luz `#ffe6c8`, sombra `#d9a77d`); pantalón `#6b4f8a`.
- **Atardecer:** multiplicar un degradado vertical `#ffc99a` → `#a68fd2` con opacidad proporcional a la hora; después sumar luces (`lighter`) de fogata, horno, antorchas y luciérnagas.

**Tiers de equipo (los 9 que tiene el juego; paleta pastel aprobada por el dueño).** Vista en `docs/style-reference/paleta_pastel.png`. La sombra siempre se calcula: mezcla del 35 % hacia el contorno `#5b3a29` (no hacia negro puro). Son **datos** (una tabla), nunca un `if` por tier; para añadir un tier se añade una fila.

| Tier (id del juego) | Principal | Luz | Dónde se usa |
| --- | --- | --- | --- |
| Madera (`madera`) | `#c9a46e` | `#e8cc9a` | herramientas |
| Cuero (`cuero`) | `#b98560` | `#dcae88` | armadura |
| Cobre (`cobre`) | `#e0906a` | `#f2b898` | armadura, arma, herramienta |
| Estaño (`estano`) | `#c9cdb8` | `#e6e9d8` | armadura, arma, herramienta |
| Bronce (`bronce`) | `#d9a05a` | `#f0c88a` | armadura, arma, herramienta |
| Hierro (`hierro`) | `#939eac` | `#c3cbd6` | armadura, arma, herramienta |
| Acero (`acero`) | `#a9c4dc` | `#e2eef8` | armadura, arma, herramienta |
| Plata (`plata`) | `#e3e1ee` | `#fbfaff` | armadura, arma, herramienta |
| Mitril (`mitril`) | `#7f9be0` | `#b4c8f5` | armadura, arma, herramienta |
| Adamantita (`adam`) | `#7fc08a` | `#b5e4b8` | armadura, arma, herramienta |

- Las **calidades de fabricación** (`id~1`, `~2`, `~3`) no tienen color propio por ahora; si hace falta distinguirlas, que sea con un detalle (ribete o destello), decisión pendiente del dueño.
- **No existe «runa»** como tier en el juego (la guía original lo proponía): no lo dibujes.
- Los colores `TCOL` del código actual son los antiguos, más saturados; esta tabla los sustituye en F4.

**Biomas.** Cada bioma usa la misma estructura base / luz / sombra, desplazando el tono. Propuesta inicial; ajústala a los biomas reales [verificar]:

| Bioma | Suelo base | Suelo luz | Suelo sombra | Agua | Acento |
| --- | --- | --- | --- | --- | --- |
| Pradera | `#a6d24c` | `#d4ee7a` | `#4f9438` | `#52d2e0` | `#ff9ac0` |
| Bosque | `#5f9a40` | `#94c455` | `#2f6e38` | `#3fb0bf` | `#e8645a` |
| Pantano | `#9aa84a` | `#c9d070` | `#5a6a38` | `#6fb59a` | `#d9b24a` |
| Nieve | `#e9f4f8` | `#ffffff` | `#a9c3d6` | `#8fd6ee` | `#7fb4e8` |
| Volcán | `#7a6a66` | `#a8968f` | `#3f3438` | lava `#ff7a2a` | `#ffb040` |

## 4. Lenguaje de formas

> **Nota (17 oct 2026):** el lenguaje de formas (facetado, mallas triangulares con luz por normal, chaflanes, «modelos que no se cortan») es el que ya se porta a 3D vía `ORG.capture`; no se rehace. Los modelos de personaje y su proporción mandan en `GUIA_PERSONAJES_3D.md`. Las reglas de contorno y los colores de esta sección son del 2D.

**Dirección actual (11 oct 2026, tentativa).** Al dueño no le convencieron las formas redondeadas; prefiere formas **poligonales con pocos polígonos, al estilo OSRS**, pero visualmente atractivas. Sigue sin aprobar ninguna forma concreta: F2 empieza con una **prueba de formas** (ver sección 7) y él decide. La demo cenital (`blobz`/`bp`) y las formas de la demo diorama **no son el objetivo**.

- **Marco obligatorio (lo único fijo):** proyección isométrica 2:1 (`ISO.proj`), luz arriba a la izquierda (cara superior la más clara, izquierda media, derecha más oscura), contorno `#5b3a29` en la silueta, papel `#fdf9e3`, determinismo por hash y prerenderizado a caché. Dentro de eso, el agente elige y combina técnicas.
- **Técnicas permitidas (12 oct 2026):**
  - *Facetado plano:* polígonos de 5–12 vértices con un tono por cara. Va bien en lo rígido (edificios, cofres, troncos, puentes).
  - *Mallas triangulares con luz por normal (familia A):* masas de 12–80 triángulos deformadas por hash, proyectadas con la misma isometría e iluminadas por la normal de cada triángulo; es lo que da volumen a lo orgánico sin parecer cubos. Implementación de prueba: `src/style-organic.js` (`ico`, `blob`, `cone`, `drawMesh`).
  - *Degradados:* lineales, radiales o por vértice (Gouraud, `smooth` 0–1) dentro de una forma; luces y sombras suaves. Ya no están prohibidos.
  - *Racimos pintados (familia B):* polígonos festoneados apilados con 3 capas de tono o degradado radial (`clump`, `tier`).
  - *Chaflanes y cuerpos que se estrechan* en personajes y criaturas, en vez de cubos.
  - *Elipses y círculos:* permitidos si encajan con la proyección (una elipse con `ry≈rx/2` es un círculo en isométrico). Siguen siendo imprescindibles en luces, ondas, humo y destellos.
  - *Texturas procedurales* sembradas por hash (vetas, motas, pincel).
- **Contorno:** solo en la silueta y en los contactos entre masas; las aristas interiores, sin línea o muy tenues (alpha ≤ .12). Un contorno grueso en cada cara es lo que produce el aspecto de «cubitos con rejilla».
- **Formas aprobadas (12 oct 2026, noche).** Rígidos = cajas y tejados facetados (`box`, `gable`, `lathe`); orgánicos = mallas triangulares con luz por normal (`blob`, `cone`); personajes = piezas con chaflán (`lathe` de 6–8 lados); contorno solo en la silueta; tono plano por triángulo (`smooth` 0 por defecto; el slime usa degradado por vértice y translucidez). Catálogo en `ORG.U` (`src/style-organic.js`): 8 especies de árbol como datos (`ORG.SPECIES`), piedra con mena, arbusto, casa, cofre, yunque, slime, vaca, goblin y personaje. **Personaje elegido: esbelto** (cabeza de 8 lados, torso trapezoidal, miembros que se estrechan); tiers por tabla (`ORG.TIER`). **Goblin aprobado tal cual.**
- **Modelos que no se cortan (obligatorio).** Copa y tronco deben solaparse, las patas entran en el cuerpo y la silueta no se recorta en el lienzo. Se garantiza por construcción (`trunkH`, `COW`) y con `ORG.checks()` + `tools/organic_check.py`; todo asset nuevo debe pasarla.
- **Facetado low-poly (base).** Cada objeto es un polígono de 5–12 vértices con **caras planas**: cada cara lleva un tono (luz arriba a la izquierda, medio, sombra) y encima van el pincel suave y el grano de la sección 5. Si se prefiere más suavidad, se usa `smooth`.
- **Vértices:** aristas rectas, jitter de ±0,5–1 px y asimetría de ±8 % para que parezca recortado a mano. Esquinas con bisel mínimo (1 px) y contorno con unión redondeada (`lineJoin = 'round'`) para que no se vean afiladas.
- **Árboles:** copa de 2–3 masas facetadas apiladas (hexágonos u octógonos achatados con 3–4 facetas) sobre un tronco en prisma; el pino, conos facetados de 3 pisos. Cada una de las 8 especies del juego conserva su silueta (ver sección 13).
- **Piedras y menas:** poliedros irregulares de 6–8 vértices con base plana; las vetas son facetas pequeñas del color «luz» del tier.
- **Edificios y estaciones:** prismas isométricos con tejados de planos; base plana, lados casi rectos.
- **Personaje y NPC:** bloques estilo OSRS pero **con chaflán** (cabeza de 8 lados, torso trapecio, miembros que se estrechan), 48×64; evitar el cubo puro. **Aprobado: proporción esbelta** (`ORG.BUILD.esbelto`); goblin aprobado (`ORG.U.goblin`).
- **Un solo helper de forma, `facet(pts, opts)`, y un objeto global `STYLE`**, por ejemplo `STYLE = { facets: 2, jitter: 0.6, bevel: 1, line: '#5b3a29', lineW: 1.3, grain: 0.55 }`. `facets` fija el nivel de detalle (1 = muy pocos polígonos, 3 = más), así el dueño puede pedir «más o menos polígonos» cambiando un número. Todos los sprites lo usan.
- **Sigue prohibido:** negro puro y romper el marco de arriba (otra proyección, otra dirección de luz, sin contorno en la silueta). Todo lo demás está permitido; los círculos perfectos y los degradados quedan a criterio del agente, con la regla de coherencia entre sprites de una misma categoría.
- En `game.js` hay un helper provisional `cursorPoly` (solo el cursor de tile opcional): **no es `facet`** y no debe reutilizarse para sprites.

## 5. Técnica de pintado

> **Nota (17 oct 2026):** técnica del **2D**. En 3D y en el estilo óleo oscuro **no hay grano de papel, de película ni trama de lienzo** (el dueño rechazó los «puntitos blancos»); el aspecto pictórico lo da el filtro Kuwahara y las manchas de pigmento suaves (`GUIA_3D_PORTEO.md` §4.9).

Todo se compone de cuatro piezas, copiadas de la demo (sin sus formas):

1. **Relleno con pincel (`paint`).** Se rellena la forma con el color base y se recorta a ella; encima van trazos cortos de luz y sombra, con punta plana, alpha entre 0,18 y 0,5 y ángulo con ±0,45 rad de variación.
2. **Contorno irregular (`ink`).** Línea `#5b3a29` de 1,3–1,5 px, alpha 0,85, partida en 4 segmentos con ±0,6 px de desvío. Solo en aristas de silueta y de contacto; nunca entre tiles contiguos de la misma altura.
3. **Grano de papel (SOLO 2D).** Patrón de 128×128 con valores 228–255 y un 4 % de manchas a 185, aplicado con `multiply` al 55 % sobre todo el mundo.
4. **Luz.** Tinte multiplicado para la hora y luces aditivas encima.

**Recetas de trazos** (a 1×; duplica longitudes y grosores a 2×):

| Superficie | Trazos grandes | Trazos pequeños | Ángulo |
| --- | --- | --- | --- |
| Cara superior de pasto | 7 de largo 16 y grosor 7 | 34 de largo 5 y grosor 1,3 | −0,6 rad y vertical |
| Cara lateral de arcilla | 30 de largo 9 y grosor 2,4 | no lleva | vertical |
| Acantilado | 70 de largo 16 y grosor 3 | no lleva | vertical |
| Franja de tierra | 14 de largo 6 y grosor 2 | no lleva | horizontal |
| Cara frontal del agua | 26 de largo 12 y grosor 2,4 | no lleva | casi horizontal |

- **Determinismo.** El azar sale de un hash por tile (x, y, bioma, capa) y nunca de `Math.random` ni del RNG de la lógica del juego. El mismo mundo se ve igual en cada carga.
- **Rendimiento.** El arte estático se pinta una vez, en chunks (por ejemplo 512×512 px lógicos) con caché LRU de unos 12, **a la escala real de pantalla** `ISO.scale()`. Peso de un chunk = (512·s)²·4 bytes: s=1,6 → 2,7 MB; s=2 → 4,2 MB; s=3,2 → 10,7 MB (12 chunks ≈ 129 MB, aceptado por el dueño). En F8 medir en un móvil real; si hace falta, plan B: LRU de 8 o tope de escala 2,5. Nunca se generan trazos por frame, salvo agua animada, luces y partículas.
- **Agua.** Se dibuja antes de la capa estática (que deja ese hueco transparente) para que los bordes de pasto la tapen bien. Lleva destellos desplazándose, manchas fijas, peces y ondas.

## 6. Catálogo de assets

> **Nota (17 oct 2026): sección HISTÓRICA.** El juego no usa atlas PNG ni estos nombres de archivo: todo el arte se genera por código (`style-organic.js`, `props.js`, `creatures.js`, `item-icons.js`…) y en 3D salen de `ORG.capture`. Se conserva solo como **lista de categorías de contenido que debe existir** (terreno, agua, vegetación, estructuras, personajes, criaturas, ítems, efectos, interfaz); para saber qué hay realmente, mira el código y `docs/CONTEXTO.md`.

La lista parte de lo que tenía la versión que se analizó (5 biomas, estaciones de campamento, skills, misiones, colección, magia, fabricación). **Contrasta cada categoría con el inventario real [verificar]**: añade lo que falte y descarta lo que ya no exista. Tamaños en píxeles a 2×; el ancla de todo sprite de mundo está en los pies.

**Convención de nombres:** `categoria_rol_variante_frame` en minúsculas con guiones bajos (`ground_top_a_03`, `char_walk_se_02`, `item_helm_base`). Se nombra por rol, nunca por color. Cada categoría se entrega como atlas (PNG + JSON con nombre, rectángulo y ancla).

- **Terreno (por bioma).**
  - `ground_top_{a,b}_{01..06}`: rombo de 112×56; 6 variantes por tono para que no se note la repetición.
  - `ground_left` y `ground_right`: caras laterales de 56×(28 + 44·niveles); versión arcilla, tierra y roca. `ground_soil_band` es la franja de tierra bajo el pasto.
  - `cliff_left` y `cliff_right`: acantilado con veteado vertical, de 1 y 2 niveles.
  - Transiciones autotile (máscara de 4 vecinos, 16 piezas): `edge_grass_sand`, `edge_grass_snow`, `edge_grass_mud`, `edge_grass_water`.
  - Caminos autotile (16 piezas por tipo): tierra, piedra y empedrado de aldea.
- **Agua.** `water_top` animada (4 frames de 112×56), `water_front` (cara translúcida), orillas autotile `shore_*`, `ripple_{01..04}`, destellos `glint_{01..03}`, y variantes por bioma (barro con algas, hielo con témpanos, lava con costra).
- **Vegetación y decoración (por bioma).**
  - Árboles: las **8 especies del juego** (sección 13), cada una con su paleta pastel, 2 variantes y 2 frames de balanceo; tronco, tocón y árbol talado.
  - Arbustos (2), matas (3), flores (3 colores), hierba alta, juncos, nenúfares, setas, piedras (S, M, L), cristales, témpanos, charcos de lava, huesos, cartel.
- **Recursos de skills.** Rocas de mena (una silueta, un recolor por mena), árboles talables por tipo, puntos de pesca (poste, boya, burbujas), plantas cosechables, y cada recurso con estado «agotado». (tipos reales en la sección 13)
- **Estructuras.** Casas de aldea (3 variantes), valla, muralla, portón de bioma, puente (2 orientaciones), farol y antorcha, tienda de puesto, **banco (edificio de piedra, como en el juego)**, **fogata** (3 frames más brasas), **horno** (2 frames), **yunque**, **taller (mesa)**, **escritorio (mesa con velas y pergaminos)**, entrada de guarida. Las estructuras ocupan 1×1 a 3×3 tiles y declaran su huella.
- **Personaje del jugador.**
  - 4 direcciones diagonales: se dibujan SE y NE y se espejan para SW y NW.
  - Tamaño 48×64. Animaciones: idle (4 frames), caminar (6), correr (6) y una por acción: talar, minar, pescar, cocinar o fabricar, atacar y recibir golpe (4 cada una).
  - **Equipo en capas:** casco, torso, piernas, guantes, botas, arma, escudo y capa. Cada pieza es una silueta base más **paleta-swap por tier** (3 tonos: principal, luz, sombra; el contorno no cambia). No se dibuja un sprite por combinación: se compone y se cachea en un atlas, invalidándolo solo cuando cambia el equipo.
- **NPC.** Banquero, tendero, herrero, guía y los que existan en la versión actual [verificar]: 48×64, idle de 4 frames, 2 direcciones espejadas, mismas capas de ropa recoloreables.
- **Monstruos.** Por bioma, de 2 a 4 tipos más un jefe [verificar]. Tamaños: pequeño 32×32, mediano 48×48, grande 64×64, jefe 96×96. Animaciones: idle (4), ataque (4), golpe (1, con destello blanco por tinte) y muerte (4); 2 direcciones espejadas. Sombra blanda bajo cada uno.
- **Ítems (iconos de inventario).** No son isométricos: vista frontal ligeramente inclinada, 64×64, mismo contorno marrón y luz arriba a la izquierda.
  - Una silueta base por familia (casco, peto, piernas, botas, guantes, escudo; daga, espada, hacha, maza, arco, bastón; pico, hacha de tala, caña) y recolor por tier con la tabla de la sección 3.
  - Comida cruda y cocinada, recursos (mena, lingote, tronco, pescado, hierba), runas y objetos de magia, monedas (3 tamaños de montón), llaves y misceláneos.
  - Nombres: `item_{familia}_{nombre}`; las variantes de tier salen de la paleta, no de archivos nuevos.
- **Efectos.** Golpe y chispa, destello de subida de nivel, chispas de yunque, humo de fogata y horno, luciérnagas, lluvia, tormenta, nieve, ceniza de volcán, sombras blandas (3 tamaños), rombo de cursor y marcador de destino al hacer clic. Los números flotantes son texto, no sprites.
- **Interfaz.** Paneles, botones (normal, pulsado, desactivado), pestañas, barras de vida, maná y XP, casillas de inventario, tooltips, iconos de skills (un icono por skill), cursor y minimapa. El minimapa **sigue en vista cenital** (se dibuja plano, no isométrico). Estilo: fondo `#fdf9e3`, borde `#5b3a29`, esquinas redondeadas y acento `#8a6bd1`.

## 7. Plan de trabajo

> **Sección sustituida (17 oct 2026).** El plan F0–F8 de esta guía (inventario, núcleo isométrico, terreno, decoración, personaje, NPC, luz, interfaz, pulido) **se completó o quedó reemplazado**. Hoy mandan:
> - `docs/GUIA_3D_PORTEO.md` **§6 Plan por fases** (F0–F9 del porteo a 3D, incl. **F3d estilo óleo oscuro**),
> - la **«HOJA DE RUTA ÚNICA»** de `AGENTS.md` (contenido del juego: ítems, magia, alquimia, biomas…),
> - el bloque «SIGUIENTE AGENTE» del Estado en `AGENTS.md`.
>
> Se mantiene del plan antiguo la **regla de trabajo**: una rama por fase, capturas y visto bueno del dueño antes de pasar a la siguiente, y **una sola cosa por entrega**.

## 8. Riesgos y restricciones técnicas

> **Nota (17 oct 2026):** sección parcialmente histórica. Siguen valiendo **Memoria** (caché LRU de chunks, ≈129 MB aceptados), **Nada de filtros por frame** (en 2D) y **Alturas y oclusión**. El interruptor `?old` se descartó (no hay modo antiguo); el 2D convive con el 3D por `?r3d=1` hasta F9. En 3D el rendimiento se mide según `GUIA_3D_PORTEO.md` §8.

- **Colocar lo existente en isométrico.** Un mapa cenital con rectángulos de colisión se convierte en rombos. Mantén los datos planos y proyecta solo al dibujar; la escala ya está documentada en `AGENTS.md`.
- **Esquinas vacías.** Con el formato diorama cada bioma es un bloque flotante, así que el rombo vacío deja de ser un problema. Rellena el exterior con el papel `#fdf9e3`, y cada bioma lleva su corte de tierra visible (como la demo).
- **Alturas y oclusión.** Los acantilados tapan lo que está detrás; el orden por (x + y) debe respetar eso. Prueba escenas con personaje pegado a un acantilado.
- **Memoria.** A 2×, un bioma entero pre-renderizado ocupa decenas de MB. Usa chunks con caché LRU y libera los lejanos.
- **Nada de filtros por frame.** `ctx.filter` o copiar el canvas sobre sí mismo cada frame es caro en móvil.
- **Nombres globales.** Usa un prefijo propio (por ejemplo `ISO` y `SY`) y comprueba que no choque con variables existentes [verificar].
- **Consistencia.** Si el dueño ya cambió cosas respecto a esta guía, lo que esté en el código actual gana en lógica; esta guía gana en estilo.

## 9. Criterios de aceptación

- Sin errores en consola, con y sin partida guardada.
- Las colisiones y el guardado se comportan como antes.
- El tiempo por frame no empeora de forma notable respecto a la versión previa (comparar en las mismas condiciones).
- Capturas antes y después por bioma, de día y de atardecer.
- Todos los assets de una categoría comparten contorno, luz y paleta; nada con negro puro. Los degradados y las elipses se permiten si respetan la isometría 2:1 y la luz arriba a la izquierda.
- El agente indica al dueño qué debe probar a mano en el navegador (fluidez y aspecto real no se verifican desde un chat).

## 10. Reglas y preguntas abiertas

- No cambiar lógica de juego, guardado ni colisiones.
- Un cambio por vez; tras cada uno, comprobar que el guardado carga.
- Textos del juego en español.
- Si dudas entre dos aspectos, entrega ambos en capturas y deja elegir al dueño. El gusto no se decide por él.
- **Preguntas iniciales del antiguo inventario: ya respondidas** (canvas responsivo, 8 direcciones, 5 biomas con más por venir, 11 tiers, minimapa cenital); ver «Respuestas del dueño…» en `AGENTS.md`. Las dudas nuevas (intensidad del óleo, día óleo, tiers bajo el óleo) están en `GUIA_3D_PORTEO.md` §4.9.

## 11. Formato diorama por bioma

> **Nota (17 oct 2026): VIGENTE también en 3D.** El diorama por bioma (bloque flotante con corte de tierra, sombra de apoyo, pasarelas) es la base del 3D (`terrain3d.js`, borde y estratos). Los nombres de assets `block_*`/`bridge_*` son orientativos; en 3D son geometría, no sprites.

Cada bioma se dibuja como una maqueta: un bloque isométrico flotante sobre el papel `#fdf9e3`, con las caras laterales a la vista y una sombra suave debajo. Es lo que da el aire «cozy» y distinto de la demo.

- **Corte del bloque.** En los bordes frontales (izquierdo y derecho) se ve la sección: franja de pasto, tierra `#a3643d`, arcilla `#e8a06a` y una base de roca. Grosor mínimo de 2 niveles (44 px a 2×); los biomas con acantilado lo suman encima.
- **Contorno y luz.** Mismo contorno `#5b3a29` irregular y misma luz arriba a la izquierda; la cara derecha más oscura.
- **Sombra de apoyo.** Forma blanda `rgba(90,60,40,.12)` bajo el bloque, desplazada hacia abajo a la derecha. Nada de elipse perfecta.
- **Bioma distinto, base distinta.** Nieve con hielo azulado en el corte, volcán con roca oscura y vetas de lava, pantano con raíces y barro. Se derivan de la paleta de la sección 3.
- **Tamaño del bloque [verificar].** Calcula cuántos tiles ocupa cada bioma en la versión actual y proyéctalo como un rectángulo de tiles; el rombo resultante es el contorno del bloque.
- **Unión entre biomas.** Propuesta: bloques contiguos en diagonal, con una pequeña separación y una pasarela o escalera entre ellos, de modo que el jugador cruza caminando. La cámara sigue al jugador y muestra el bloque actual más un trozo del vecino. **Alternativa:** teletransporte con fundido entre bloques (más simple, menos continuo). Decidido por el dueño: transición suave y continua con pasarelas (sección 12).
- **Elementos de ambiente.** Nubes pequeñas, hojas o copos que flotan alrededor y algún elemento colgando bajo el bloque (raíces, cristales). Son decoración, sin colisión.
- **Assets nuevos.** `block_edge_left`, `block_edge_right` y `block_base` por bioma (con variantes para que no se repitan), `block_shadow`, `bridge_{ne,nw}`, `stairs_{ne,nw}`, `ambient_{cloud,leaf,flake,ember}`.
- **Rendimiento.** Solo se dibuja el bloque actual y el vecino visible; el resto se descarta por cámara. Los bordes y la sombra son estáticos y se pre-renderizan una vez por bioma.
- **Fase.** Se añade a F2 como entregable propio: primero un solo bloque (Pradera) con borde, sombra y una pasarela, y capturas para aprobación antes de seguir con los demás biomas.

## 12. Bloqueos por jefe, transiciones e iluminación por bioma

> **Nota (17 oct 2026): VIGENTE.** Bloqueos, estados (`closed`/`opening`/`open`) y transición por mezcla (0–1 a lo largo de la pasarela) valen igual en 3D. La **iluminación por bioma** de esta sección (tintes multiplicados) es del 2D: en 3D se expresa como **una fila de modificadores por bioma sobre las filas de `TOD`** (`GUIA_3D_PORTEO.md` §4.8, «Paleta por bioma») y, con el estilo objetivo, pasa por la derivación óleo (§4.9). Los tintes de aquí sirven como intención de color por bioma, no como valores finales.

Cada bioma se desbloquea al derrotar a su jefe, y la barrera entre biomas debe contar esa historia: el obstáculo es distinto según el jefe. La luz también cambia de un bioma a otro para que se distingan a simple vista. Los jefes son los del juego (Gruk, Fenrir, Rey Ciénaga, Yeti Milenario, Señor del Fuego), que el dueño considera placeholders: **ignora cualquier otro nombre de jefe**. Lo que sigue siendo propuesta son las barreras de cada bioma.

**Bloqueos**

| Bioma | Jefe | Barrera cerrada | Si el jugador intenta pasar | Al derrotar al jefe |
| --- | --- | --- | --- | --- |
| Pradera | Gruk, Jefe Orco | Portón doble de empalizada con estandartes y postes con cráneos | Choca con la puerta; aviso «Las puertas están selladas» | Los estandartes caen y las hojas se abren (1,5 s) |
| Bosque | Fenrir, Lobo Alfa | Muro de raíces enredadas con huesos y zarpazos | Las raíces se agitan; aviso de que algo bloquea el paso | Se retraen y se marchitan |
| Pantano | Rey Ciénaga | Banco de niebla densa con zarzas | La niebla se espesa alrededor del jugador | Se disipa de forma gradual (3 s) |
| Cumbres | Yeti Milenario | Tormenta de nieve en el paso | Ráfagas, visibilidad reducida, rugido lejano y aviso de que la tormenta lo frena | La tormenta amaina con fundido de 3 s |
| Volcán | Señor del Fuego | Muro de lava y ceniza | Brasas y calor visibles, aviso de que la lava impide el paso | La lava se solidifica en un puente de basalto |

- **La lógica no cambia.** Cada barrera se apoya en el bloqueo y la bandera de «jefe derrotado» que el juego ya tenga [verificar cómo se llaman]. Lo nuevo es solo visual: el bloqueo duro queda en el paso y los efectos lo cuentan.
- **Tormenta de nieve: dos niveles.** Por defecto es visual, con partículas, viento, tinte azul y un bloqueo duro invisible. Un empuje real o una ralentización del jugador sería un cambio de mecánica: no se hace sin pedirlo al dueño.
- **Estados de cada barrera:** `closed`, `opening` (animación de 1,5–3 s) y `open`. Al cargar una partida se pinta directamente el estado guardado, sin animación.
- **Zona de aviso.** Cuando el jugador está a menos de 4 tiles del paso, se intensifica el efecto (más nieve, niebla más espesa, brasas) y se muestra un texto breve en español.

**Transición suave**

- Cada paso entre biomas es una pasarela de unos 6 tiles. La posición del jugador a lo largo de ella da un valor de 0 a 1.
- Ese valor mezcla (con `mix`) la iluminación, las partículas ambientales y la música del bioma de origen con los del de destino. Nada de cortes ni pantallas de carga.
- La cámara sigue al jugador con suavizado y muestra un trozo del bloque vecino mientras se cruza.
- Con la barrera cerrada la mezcla llega solo hasta la mitad de la pasarela.

**Iluminación por bioma.** Se usa el mismo sistema de tinte multiplicado y luces aditivas de la sección 5, con un degradado vertical de arriba a abajo por bioma y por hora. Propuesta inicial:

| Bioma | Tinte de día | Tinte de atardecer | Partículas y luz extra |
| --- | --- | --- | --- |
| Pradera | `#fff4d6` → `#ffffff` | `#ffc99a` → `#a68fd2` (aprobado) | Luciérnagas, polen |
| Bosque | `#d9f0d0` → `#b8d8b8` | `#b8d0a0` → `#6a5f8f` | Hojas, rayos de luz entre copas |
| Pantano | `#e6efc9` → `#c4d4a0` | `#c8c58a` → `#6b6a84` | Niebla baja, bichos de luz |
| Cumbres | `#dff1ff` → `#bcd8f2` | `#b8c8f0` → `#7a86c8` | Nieve, aurora tenue al atardecer |
| Volcán | `#ffd9b8` → `#e0a080` | `#ff9a6a` → `#7a3f5a` | Brasas, ceniza, brillo naranja de la lava |

- Cada bioma tiene además un color de viñeta distinto en los bordes de la pantalla (verde profundo, verde pantano, azul hielo, rojo ceniza).
- Las luces locales (fogatas, antorchas, lava) se suman encima y se ven más en los biomas oscuros.
- Si el juego ya tiene música por bioma, se mezcla igual que la luz [verificar].

**Assets nuevos**

- Pradera: `gate_orc_{closed,opening,open}` (huella de 3 tiles), `banner_orc`, `pole_skull`.
- Bosque: `root_wall_{closed,dissolve}`, `root_tangle_{01..03}`.
- Pantano: `fog_bank_{01..03}` (sprites blandos translúcidos), `bramble_{01..03}`.
- Cumbres: `snow_gust` (partículas), `storm_overlay`, `snow_drift` en el paso.
- Volcán: `lava_wall_{01..04}` (animada), `basalt_bridge`, `ember` y `ash` (partículas).
- Aviso en pantalla: texto del HUD, sin sprite.

**Fase.** Las barreras entran en F3 (estructuras) y la iluminación y partículas por bioma en F6. Primero se hace solo la Pradera: el portón del orco con sus tres estados, la pasarela y la mezcla de luz hacia el Bosque, con capturas para aprobación antes de seguir.

## 13. Datos reales del juego (verificados en el código el 11 oct 2026)

> **Correcciones (17 oct 2026):** esta tabla se verificó el 11 oct y **ha crecido**. Hoy hay **11 tiers** de metal (cobre, estaño, bronce, hierro, acero, plata, mitril, adamantita, runita, oricalco, celestita) y **11 maderas** (pino, abedul, roble, fresno, sauce, arce, tejo, ébano, caoba, baobab, Árbol del Mundo), más cuero por tier; los datos reales están en `TI`/`TNM`/`WO`/`WON` de `game.js` y en `FOL`/`SPECIES` (3D). La lista de biomas, monstruos y jefes sigue siendo la del juego pero los jefes son **placeholders**. Si choca con el código, gana el código. Donde esta sección dice «9 tiers», léase «los que haya en `TI`».

Esta sección corrige lo que la guía original supuso sin ver el juego. Si choca con otra sección, **gana esta**.

**Biomas, monstruos y jefes** (en el orden del juego):

| Bioma | Monstruos | Jefe (placeholder) |
| --- | --- | --- |
| Pradera | Vaca, Gallina, Goblin, Orco | Gruk, Jefe Orco |
| Bosque | Jabalí, Lobo | Fenrir, Lobo Alfa |
| Pantano | Rana gigante, Esqueleto | Rey Ciénaga |
| Cumbres | Yak, Ogro | Yeti Milenario |
| Volcán | Lagarto de lava, Demonio | Señor del Fuego |

**Árboles (tala).** Ocho especies; el índice es el de `dN` en `game.js`. Paleta pastel (copa / luz / tronco); ver `paleta_pastel.png`.

| i | Especie | Biomas donde aparece | Copa | Luz | Tronco | Silueta actual |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | Pino | Pradera | `#6fae7c` | `#a4d9a4` | `#b08a5f` | tronco corto y capas apiladas |
| 1 | Abedul | Pradera | `#a9d68a` | `#d3eeb0` | `#efe9dc` | tronco blanco con marcas, copa clara |
| 2 | Roble | Pradera, Bosque | `#8cc070` | `#c0e496` | `#a8784a` | copa ancha y baja |
| 3 | Fresno | Bosque | `#c9d985` | `#e6efb0` | `#b9a57a` | copa alta y estrecha |
| 4 | Sauce | Bosque, Pantano | `#8fcbb8` | `#bfe8d9` | `#a58d6a` | copa ancha con flecos colgantes |
| 5 | Arce | Pantano, Cumbres | `#f0a878` | `#f8cfa6` | `#a8704a` | copa naranja y ancha |
| 6 | Tejo | Cumbres, Volcán | `#8fa3d4` | `#bccbee` | `#7a6a80` | copa oscura y redondeada |
| 7 | Ébano | Volcán | `#a67bb8` | `#d0a8e0` | `#4f3f52` | copa con brillo y tronco muy oscuro |

**Minas (7 menas).** Roca base gris pastel; las vetas usan la «luz» del tier correspondiente. Cobre (Pradera), Estaño (Pradera), Hierro (Pradera y Bosque), Carbón (Bosque y Pantano), Plata (Pantano y Cumbres), Mitril (Cumbres, y algo en el Volcán), Adamantita (Volcán). Carbón, que no es tier: principal `#7a6f7c`, luz `#a99fae`.

**Pesca (8 tipos).** Camarones, Sardinas, Arenques, Truchas, Salmones, Lucios, Atunes y Pez magma (este último, en lava, en el Volcán). Colores por definir en F3.

**Tiers:** los 9 de la sección 3 (madera, cobre, estaño, bronce, hierro, acero, plata, mitril, adamantita) más el cuero para armaduras.

**Estaciones de campamento (7).** Banco (edificio de piedra con tejado, ventanas y puerta), Ru · Tienda (puesto con toldo a rayas rojas y blancas, con el tendero dentro), Fogata, Horno, Yunque, Taller (mesa con herramientas) y Escritorio (mesa con velas y pergaminos; id `altar`). Cada bioma tendrá su propia aldea con arquitectura propia (decisión del dueño, ver `AGENTS.md`).

**Equipo.** El panel tiene 10 casillas: arma, armadura, casco, botas, anillo, anillo 2, amuleto, hacha, pico y caña.
