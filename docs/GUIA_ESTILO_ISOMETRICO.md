# NotScape: guía isométrica pintada «cozy»

Guía de estilo y assets para un agente de código, válida para cualquier versión del juego · 11 de octubre de 2026

## 0. Cómo usar este documento

Esta guía fija el estilo, la geometría y los assets, pero no nombres de archivos ni de funciones, porque la versión actual del juego puede haber cambiado. Donde aparezca [verificar], confirma el dato en el código antes de usarlo.

- **Primer entregable: `INVENTARIO.md`.** Antes de tocar nada, documenta el estado real del juego: tamaño del canvas, unidad de coordenadas del mundo, orden de dibujo, entidades, cuántos ítems, biomas, estaciones, NPC y monstruos existen, y qué parte de la interfaz es HTML.
- **Referencia visual:** la demo `notscape-diorama.html` (cópiala a `docs/style-reference/`). De ella salen los **colores y la técnica de pincel**; sus **formas no** están aprobadas (sección 4). `notscape-cenital.html` es una demo en vista cenital que sí usa formas blandas; sirve solo como referencia de la forma (`soft`), no de la vista.
- **Prioridad:** en lo visual manda este documento; en lo técnico manda el `AGENTS.md` (o la guía equivalente) del repositorio: no tocar lógica, guardado ni colisiones, y una rama por fase.
- Todo el arte se genera por código. No hay arte pintado a mano.

## 1. Decisiones ya tomadas

- **2D con proyección isométrica 2:1.** Nada de 3D ni Three.js.
- **La lógica no cambia.** El mundo sigue siendo una cuadrícula plana; la isometría solo se aplica al dibujar y, a la inversa, al convertir clics en posiciones.
- **Colores:** aprobados (sección 3).
- **Formas:** blandas e irregulares, sin círculos perfectos ni polígonos duros (sección 4).
- **Resolución:** el arte se produce a 2× y se escala según `devicePixelRatio` (máximo 2).
- **Alturas:** niveles discretos (agua, suelo, acantilado), no un mapa 3D real.
- **Formato diorama por bioma (decidido por el dueño).** Cada bioma es un bloque isométrico flotante con el corte de tierra visible, como en la primera demo. Ver sección 11.

## 2. Geometría isométrica

Un tile mide 56×28 px lógicos (112×56 a 2×) y cada nivel de altura suma 22 px. Proyección de un punto (x, y, z) del mundo a pantalla, con (Ox, Oy) el origen de la cámara:

```latex
s_x = O_x + (x - y)\cdot 28 \qquad s_y = O_y + (x + y)\cdot 14 - z\cdot 22
```

Para convertir un clic en posición del mundo, con z = altura del suelo en ese punto:

```latex
u = \frac{s_x - O_x}{28},\quad v = \frac{s_y - O_y + 22z}{14},\quad x = \frac{u + v}{2},\quad y = \frac{v - u}{2}
```

- **Escala del mundo [verificar].** Si el juego usa píxeles como unidad, define cuántos equivalen a un tile y documéntalo en `INVENTARIO.md`. Colisiones y pathfinding siguen en la cuadrícula plana original.
- **Orden de dibujo.** Tiles por (x + y) ascendente, desempate por x. Entidades por la posición de sus pies. Objetos que ocupan varios tiles se ordenan por su tile más cercano a la cámara.
- **Alturas:** agua 0,75; suelo 1; acantilado 2. Una cara lateral solo se dibuja donde el vecino es más bajo.
- **Luz arriba a la izquierda.** Cara superior la más clara, cara izquierda media y cara derecha un 28 % más oscura (mezcla hacia `#6a3a3a`). Las sombras proyectadas caen hacia abajo a la derecha.
- **Cámara.** Sigue al jugador y se redondea al píxel de render para evitar vibraciones. Fuera del mapa se muestra el papel `#fdf9e3`.
- **Oclusión.** Los objetos altos que tapan al jugador se atenúan al 50 % mientras lo cubren.
- **Cursor.** El tile bajo el puntero se resalta con un rombo suave.

## 3. Paleta

Los colores de la demo están aprobados y se usan tal cual. Contorno `#5b3a29` (nunca negro puro) y papel `#fdf9e3`.

- **Pasto:** base `#a6d24c` y `#8fc443`; luz `#d4ee7a` / `#c6e86a`; sombra `#4f9438` / `#3f8030`.
- **Arcilla y tierra:** arcilla `#e8a06a`; franja de tierra `#a3643d`, luz `#c98a5a`, sombra `#6f4128`.
- **Agua:** degradado `#c4f6f2` → `#52d2e0`; manchas `rgba(40,150,190,.28)`; destellos `rgba(255,255,255,.7)`; cara frontal translúcida `rgba(110,215,235,.75)`.
- **Vegetación:** hoja `#6fb048` con luz `#b4e06a`; copas `#5fa046` / `#6fb04a` / `#7cc050`.
- **Detalles:** flores `#ff9ac0`, `#ffd75a`, `#fff`; fuego `#ff9a3a`, `#ffd95a`, `#fff6c0`; boya `#ee3b2f`; madera `#9b6a3f`, `#a8683a`, `#bd7a45`; oro `#f1c24a`; piedra `#9a958d` con luz `#d0cbc0`.
- **Piel y tela del personaje:** piel `#f3cba3` (luz `#ffe6c8`, sombra `#d9a77d`); pantalón `#6b4f8a`.
- **Atardecer:** multiplicar un degradado vertical `#ffc99a` → `#a68fd2` con opacidad proporcional a la hora; después sumar luces (`lighter`) de fogata, horno, antorchas y luciérnagas.

**Armaduras (principal / luz):**

| Tier | Principal | Luz | Sombra (auto) |
| --- | --- | --- | --- |
| Bronce | `#c8803c` | `#e8a864` | mezcla 35 % hacia negro |
| Hierro | `#8f969e` | `#c2c8d0` | mezcla 35 % hacia negro |
| Acero | `#b6c4d0` | `#eef4f8` | mezcla 35 % hacia negro |
| Mithril | `#5c7fd6` | `#93adf2` | mezcla 35 % hacia negro |
| Adamant (propuesta) | `#5fa36a` | `#9fd6a4` | mezcla 35 % hacia negro |
| Runa (propuesta) | `#4fc3d9` | `#9fe6f2` | mezcla 35 % hacia negro |

Si la versión actual tiene más tiers, extiéndelos con la misma lógica (principal saturado, luz clara, sombra calculada).

**Biomas.** Cada bioma usa la misma estructura base / luz / sombra, desplazando el tono. Propuesta inicial; ajústala a los biomas reales [verificar]:

| Bioma | Suelo base | Suelo luz | Suelo sombra | Agua | Acento |
| --- | --- | --- | --- | --- | --- |
| Pradera | `#a6d24c` | `#d4ee7a` | `#4f9438` | `#52d2e0` | `#ff9ac0` |
| Bosque | `#5f9a40` | `#94c455` | `#2f6e38` | `#3fb0bf` | `#e8645a` |
| Pantano | `#9aa84a` | `#c9d070` | `#5a6a38` | `#6fb59a` | `#d9b24a` |
| Nieve | `#e9f4f8` | `#ffffff` | `#a9c3d6` | `#8fd6ee` | `#7fb4e8` |
| Volcán | `#7a6a66` | `#a8968f` | `#3f3438` | lava `#ff7a2a` | `#ffb040` |

## 4. Lenguaje de formas

Objetivo: formas blandas e irregulares, como recortadas a mano. Al dueño no le gustó el estilo todo redondo ni el todo angular.

- **Base:** rectángulos y trapecios con esquinas redondeadas (radio ≈ 25–35 % del lado menor), asimetría de ±10 % y borde con temblor de ±0,6 px.
- **Aristas isométricas:** las caras laterales son paralelogramos con vértices levemente redondeados (2–3 px a 2×); nunca aristas afiladas.
- **Árboles y arbustos:** masas de 3–5 lóbulos de tamaños distintos. No elipses sueltas ni triángulos apilados.
- **Piedras:** óvalos achatados e irregulares con una cara plana abajo.
- **Edificios y estaciones:** base plana, lados casi rectos, esquinas suaves, sin diagonales agresivas.
- **Un solo helper de forma** (`soft`) y un objeto global de estilo, por ejemplo `STYLE = { round: 0.3, wobble: 0.6, line: '#5b3a29', lineW: 1.3, grain: 0.55 }`. Todos los sprites lo usan, así el dueño puede pedir «más o menos redondo» cambiando un número.
- **Prohibido** en sprites nuevos: `arc` o `ellipse` para el cuerpo de los objetos y triángulos como forma principal. Sí se permiten para luces, ondas, humo y destellos.

## 5. Técnica de pintado

Todo se compone de cuatro piezas, copiadas de la demo (sin sus formas):

1. **Relleno con pincel (`paint`).** Se rellena la forma con el color base y se recorta a ella; encima van trazos cortos de luz y sombra, con punta plana, alpha entre 0,18 y 0,5 y ángulo con ±0,45 rad de variación.
2. **Contorno irregular (`ink`).** Línea `#5b3a29` de 1,3–1,5 px, alpha 0,85, partida en 4 segmentos con ±0,6 px de desvío. Solo en aristas de silueta y de contacto; nunca entre tiles contiguos de la misma altura.
3. **Grano de papel.** Patrón de 128×128 con valores 228–255 y un 4 % de manchas a 185, aplicado con `multiply` al 55 % sobre todo el mundo.
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
- **Rendimiento.** El arte estático se pinta una vez, en chunks (por ejemplo 512×512 px lógicos) con caché LRU de unos 12; a 2× cada chunk pesa ~4 MB. Nunca se generan trazos por frame, salvo agua animada, luces y partículas.
- **Agua.** Se dibuja antes de la capa estática (que deja ese hueco transparente) para que los bordes de pasto la tapen bien. Lleva destellos desplazándose, manchas fijas, peces y ondas.

## 6. Catálogo de assets

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
  - Árboles: 3 especies por bioma, 2 variantes y 2 frames de balanceo cada una; tronco, tocón y árbol talado.
  - Arbustos (2), matas (3), flores (3 colores), hierba alta, juncos, nenúfares, setas, piedras (S, M, L), cristales, témpanos, charcos de lava, huesos, cartel.
- **Recursos de skills.** Rocas de mena (una silueta, un recolor por mena), árboles talables por tipo, puntos de pesca (poste, boya, burbujas), plantas cosechables, y cada recurso con estado «agotado». [verificar los tipos reales]
- **Estructuras.** Casas de aldea (3 variantes), valla, muralla, portón de bioma, puente (2 orientaciones), farol y antorcha, tienda de puesto, **banco (cofre grande)**, **fogata** (3 frames más brasas), **horno** (2 frames), **yunque**, **taller (mesa)**, entrada de guarida. Las estructuras ocupan 1×1 a 3×3 tiles y declaran su huella.
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

Una rama por fase. Cada fase termina con capturas y con el visto bueno del dueño antes de pasar a la siguiente.

1. **F0 · Inventario.** Entrega `INVENTARIO.md` (sección 0). *Hecho cuando:* el dueño confirma que refleja su versión actual.
2. **F1 · Núcleo isométrico.** Proyección, proyección inversa, orden de dibujo, cámara, cursor de tile y oclusión, sobre un terreno de prueba con tres alturas. Sin arte final: rombos de color plano. *Hecho cuando:* el jugador camina por el mapa de prueba, los clics caen en el tile correcto en cualquier altura y las colisiones se comportan igual que antes.
3. **F2 · Estilo y terreno.** Módulo de estilo (`STYLE`, `soft`, `paint`, `ink`, grano, tinte), bloques de terreno con caras, transiciones, caminos y agua animada para los biomas. **Puerta de aprobación:** 3 capturas (Pradera de día, de atardecer y un bioma distinto). El dueño decide si la forma de las cosas le gusta antes de seguir.
4. **F3 · Decoración, recursos y estructuras.** Vegetación, rocas, árboles talables, aldea, estaciones de campamento, puentes, portones y carteles, con sus huellas de colisión.
5. **F4 · Personaje y equipo.** Capas, paleta-swap por tier, atlas cacheado, animaciones de acción. *Hecho cuando:* cambiar de equipo se ve al instante y no cuesta más de un frame de recomposición.
6. **F5 · NPC, monstruos y efectos.** Con destello de golpe, muerte, partículas y sombras.
7. **F6 · Luz, clima y post.** Día y atardecer con tinte multiplicado, luces aditivas, lluvia, tormenta, nieve, ceniza y grano de papel. Reemplaza cualquier filtro de canvas por frame por multiplicaciones y superposiciones.
8. **F7 · Interfaz e iconos de ítems.** Paneles, botones, barras, iconos de skills e ítems por recolor, minimapa cenital.
9. **F8 · Pulido y rendimiento.** Medir, ajustar la caché de chunks, revisar memoria en móvil y limpiar código viejo.

## 8. Riesgos y restricciones técnicas

- **Colocar lo existente en isométrico.** Un mapa cenital con rectángulos de colisión se convierte en rombos. Mantén los datos planos y proyecta solo al dibujar; documenta la escala en `INVENTARIO.md`.
- **Esquinas vacías.** Con el formato diorama cada bioma es un bloque flotante, así que el rombo vacío deja de ser un problema. Rellena el exterior con el papel `#fdf9e3`, y cada bioma lleva su corte de tierra visible (como la demo).
- **Alturas y oclusión.** Los acantilados tapan lo que está detrás; el orden por (x + y) debe respetar eso. Prueba escenas con personaje pegado a un acantilado.
- **Memoria.** A 2×, un bioma entero pre-renderizado ocupa decenas de MB. Usa chunks con caché LRU y libera los lejanos.
- **Nada de filtros por frame.** `ctx.filter` o copiar el canvas sobre sí mismo cada frame es caro en móvil.
- **Nombres globales.** Usa un prefijo propio (por ejemplo `ISO` y `SY`) y comprueba que no choque con variables existentes [verificar].
- **Fallback.** Mientras convivan la versión vieja y la nueva, conserva un interruptor (por ejemplo `?old`) [verificar si existe].
- **Consistencia.** Si el dueño ya cambió cosas respecto a esta guía, lo que esté en el código actual gana en lógica; esta guía gana en estilo.

## 9. Criterios de aceptación

- Sin errores en consola, con y sin partida guardada.
- Las colisiones y el guardado se comportan como antes.
- El tiempo por frame no empeora de forma notable respecto a la versión previa (comparar en las mismas condiciones).
- Capturas antes y después por bioma, de día y de atardecer.
- Todos los assets de una categoría comparten contorno, luz y paleta; nada con negro puro ni con círculos perfectos.
- El agente indica al dueño qué debe probar a mano en el navegador (fluidez y aspecto real no se verifican desde un chat).

## 10. Reglas y preguntas abiertas

- No cambiar lógica de juego, guardado ni colisiones.
- Un cambio por vez; tras cada uno, comprobar que el guardado carga.
- Textos del juego en español.
- Si dudas entre dos aspectos, entrega ambos en capturas y deja elegir al dueño. El gusto no se decide por él.
- **Preguntas que el agente debe plantear al dueño, no resolver solo:** ¿el canvas es fijo o responsivo?; ¿movimiento en 4 u 8 direcciones?; ¿se conservan todos los biomas actuales?; ¿qué tiers de equipo existen hoy?; ¿se mantiene el minimapa cenital?

## 11. Formato diorama por bioma

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

Cada bioma se desbloquea al derrotar a su jefe, y la barrera entre biomas debe contar esa historia: el obstáculo es distinto según el jefe. La luz también cambia de un bioma a otro para que se distingan a simple vista. Solo se conocen con certeza dos jefes (orco en la Pradera, lobo de hielo en las Cumbres); el resto son propuestas que el dueño debe corregir [verificar].

**Bloqueos**

| Bioma | Jefe | Barrera cerrada | Si el jugador intenta pasar | Al derrotar al jefe |
| --- | --- | --- | --- | --- |
| Pradera | Orco | Portón doble de empalizada con estandartes y postes con cráneos | Choca con la puerta; aviso «Las puertas están selladas» | Los estandartes caen y las hojas se abren (1,5 s) |
| Bosque | [propuesta] | Muro de telarañas y raíces enredadas | Las raíces se agitan; aviso de que algo bloquea el paso | Se retraen y se marchitan |
| Pantano | [propuesta] | Banco de niebla densa con zarzas | La niebla se espesa alrededor del jugador | Se disipa de forma gradual (3 s) |
| Cumbres | Lobo de hielo | Tormenta de nieve en el paso | Ráfagas, visibilidad reducida, aullido y aviso de que la tormenta lo frena | La tormenta amaina con fundido de 3 s |
| Volcán | [propuesta] | Muro de lava y ceniza | Brasas y calor visibles, aviso de que la lava impide el paso | La lava se solidifica en un puente de basalto |

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
- Bosque: `web_wall_{closed,dissolve}`, `root_tangle_{01..03}`.
- Pantano: `fog_bank_{01..03}` (sprites blandos translúcidos), `bramble_{01..03}`.
- Cumbres: `snow_gust` (partículas), `storm_overlay`, `snow_drift` en el paso.
- Volcán: `lava_wall_{01..04}` (animada), `basalt_bridge`, `ember` y `ash` (partículas).
- Aviso en pantalla: texto del HUD, sin sprite.

**Fase.** Las barreras entran en F3 (estructuras) y la iluminación y partículas por bioma en F6. Primero se hace solo la Pradera: el portón del orco con sus tres estados, la pasarela y la mezcla de luz hacia el Bosque, con capturas para aprobación antes de seguir.
