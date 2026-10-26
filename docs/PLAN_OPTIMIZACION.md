# NotScape · Plan de optimización y fluidez (26 oct 2026, lote FLUIDEZ)

> Pedido del dueño: «escanea TODO el proyecto y genera propuestas para optimizarlo; que vaya muy fluido, que se cubran los rangos de rendimiento en las distintas calidades, opciones gráficas para personalizar cada aspecto, y que deje de hacer *stutters*».
> Este documento = **diagnóstico medido + lo que ya se hizo en este lote + propuestas priorizadas (lo que falta)**. Las reglas que salen de aquí están en `docs/REGLAS_CREACION.md` §P (P13–P16).

## 0 · Cómo se midió (para repetirlo)
- **Navegador con GPU real** (RTX 4070, Chromium de Playwright con ventana, sin caché de shaders = como un jugador nuevo) y el navegador integrado.
- **Basura por segundo** (la causa n.º 1 de tirones en JS): `HeapProfiler.startSampling` por CDP, 8 s en reposo en la plaza de la Pradera, agrupado por función y por pila.
- **Programas re-evaluados por segundo**: se envuelve `customProgramCacheKey` de todos los materiales (three solo lo llama cuando decide «cambiar de programa»).
- **Tirones**: fotogramas > 34 ms con desglose por función (`upd`, `draw`, `R3D.frame`, `terr.update`, `renderer.render`, `composer`, render del héroe, sombra, reflejo, `WMAP.paint`, `actors.update`…), en reposo 25 s y corriendo 24 s por la Pradera.
- Los guiones de medición están descritos en §5 (convertirlos en `tools/r3d/stutter_check.py` es la propuesta **F1**).

## 1 · Diagnóstico (antes de este lote)

| # | Causa | Medido | Efecto |
|---|---|---|---|
| D1 | **three re-evaluaba el programa de shader de cada objeto ~7 100 veces/s**: (a) el reflejo del agua usaba `renderer.clippingPlanes` → cada material «cambiaba de programa» al entrar y salir del pase del reflejo; (b) el héroe se pinta en 3 pases con la cámara en capas distintas y las luces solo estaban en la capa 0 → «las luces cambian» en cada pase → todo material del héroe y de los actores se re-evaluaba; (c) las estaciones usaban el MISMO material que los `InstancedMesh` de los props → alterna instanciado/normal | `getParameters` = 19 MB/s de basura, 7 096 evaluaciones/s | CPU + recolector de basura → **tirones periódicos** |
| D2 | three **minificado**: el minificador convierte `setProgram` en una función creada en CADA llamada de dibujo | 11 MB/s de basura en `renderBufferDirect` | recolector → tirones |
| D3 | `lights()` (r3d.js) ordenaba TODAS las fuentes de luz del mundo con `map`+`sort` en cada fotograma | ~5 MB/s | recolector |
| D4 | **Mapa con niebla** (`WMAP.paint`): presupuesto de **8 ms por fotograma** con el minimapa visible mientras quedan celdas por revelar | 8–10 ms en cada fotograma al explorar | **tirones al caminar por zona nueva** |
| D5 | **Aldeanos** (87 variantes `v:<bioma>:<rol>`) se horneaban en pleno juego, hasta 3 por fotograma | 27 ms cada uno en un PC rápido (≈ 60 ms en portátil); picos de 33–41 ms | **tirón al llegar a cada aldea** |
| D6 | Construcción de trozos de terreno en el hilo principal (`terr.update`, presupuesto 3,5 ms; 9 ms si «urgente» al correr) + subida a la GPU en el primer dibujo | 4–12 ms + 5–10 ms de subida | tirones al correr (sigue abierto: **F2**) |
| D7 | Héroe en un **2.º contexto WebGL** con 3 pases + su sombra + su grado | 2,5–4 ms de CPU fijos por fotograma | coste fijo (abierto: **F4**) |
| D8 | Calidad = un único número `QL` leído en 20 sitios | — | el jugador no podía ajustar nada por separado |
| D9 | `requestAnimationFrame` sin límite: en gráficas justas los fps oscilan (45↔60) y el ritmo irregular se percibe como tirón | — | sin forma de fijar 30/60 |

## 2 · Hecho en este lote (medido)

| Arreglo | Dónde | Resultado medido |
|---|---|---|
| Reflejo del agua con **plano cercano oblicuo** (Lengyel, como `three/Reflector`) en vez de `clippingPlanes` | `water3d.js` `oblique()` | sin cambio de programa por pase; ya no se compila la variante «con recorte» de cada shader (**programas al cargar 125 → 71**, en partida 50–55). Comprobado numéricamente: lo que está 2 cm sobre el agua se dibuja, 2 cm debajo no |
| Luces del pase del héroe también en la **capa 3** (la sombra del héroe se sigue dibujando en el pase de la capa 0) | `r3d.js` | elimina ~6 000 evaluaciones/s |
| `twin()`: copia de material para mallas normales que comparten material con `InstancedMesh` (mismo shader compilado) | `materials3d.js`, estaciones en `r3d.js` | elimina ~700 evaluaciones/s |
| **three sin minificar** (`three.module.js`) | `index.html` (importmap + modulepreload) | `renderBufferDirect` 11 → 2 MB/s de basura |
| `lights()` sin `map/sort` (selección de las 4 más cercanas en el sitio) | `r3d.js` | −5 MB/s |
| **Total en reposo** | | evaluaciones de programa **7 100 → 1 000/s**; basura **80 → 38 MB/s** (−52 %) |
| `WMAP.paint`: suelo de la celda con `ImageData` + presupuesto **1,5 ms** con minimapa (8 ms solo con el mapa grande) | `worldmap.js`, `game.js zoneCheck` | 8,5 → ~2 ms por fotograma al explorar |
| Aldeanos: los del bioma del jugador se hornean **en la carga** (+0,3 s) y en partida **máx. 1 plantilla nueva por fotograma** | `actors3d.js` `bake()`, `update()` (`nb`) | sin ráfagas de 3 horneados por fotograma |
| **Opciones gráficas por aspecto** (18 filas, cada una «Auto» o fija) + **límite de fps** | `game.js` `GFX_DEF/gfx()`, panel Opciones → Gráficos → «Ajustes avanzados» | límite 60: p95 20 ms / máx 20,5 ms; límite 30: p95 35,2 / máx 35,5 (fotogramas regulares); Sombras No: −42 % triángulos; Pasto No: −47 % |
| `rules_check.py`: 8 comprobaciones nuevas (oblicuo, capas, twin, three sin minificar, GFX, presupuesto del mapa, `lodR`/`GRASS_Q` en Auto) | `tools/rules_check.py` | OK |

`R3D.budget()` en la plaza de la Pradera tras el lote: **Alta** 2,46 M tris / 495 llamadas / 19 705 objetos / 50 programas → `ok`; **Media** 1,09 M / 371 / 19 703 / 55 → `ok`.

## 3 · Las calidades y las opciones (lo que hace cada preset)

La **Calidad** sigue siendo el *preset* (y el modo Auto la baja sola si no sostiene ~40 fps). Cada opción avanzada en «Auto» toma el valor de esta tabla; si el jugador la fija, se mantiene aunque cambie la calidad (`localStorage ns_gfx`; `?gfx=reset` lo borra).

| Opción (`gfx(clave)`) | Máxima | Alta | Media (integradas) | Baja (móvil) | Mínima | Coste que ahorra |
|---|---|---|---|---|---|---|
| Resolución (`res`) | QCAPS 4,5 MP | 4,5 MP | 2,4 MP | 1,6 MP | 0,95 MP | GPU (todo) |
| Límite de fps (`fps`) | sin límite | = | = | = | = | regularidad, calor, batería |
| Sombras (`shadow`) | Altas 2048 | Altas | Altas | Bajas 1024 ½ ritmo | Bajas | GPU: pase de sombra (~40 % de triángulos) |
| Óleo color (`post`) | Sí | Sí | Sí | No | No | GPU: composer a pantalla completa |
| Pincelada (`brush`) | Sí | Sí | No | No | No | GPU: Kuwahara |
| Resplandor (`bloom`) | Sí | Sí | Sí | No | No | GPU |
| Desenfoque maqueta (`tilt`) | Sí | Sí | No | No | No | GPU |
| Reflejos del agua (`refl`) | Sí | Sí | No | No | No | GPU+CPU: redibuja la escena |
| Agua animada (`water`) | Sí | Sí | Sí | No | No | CPU+GPU: simulación |
| Pasto (`grass`) | 1,15 | 1 | 0,5 | 0,25 | 0 | triángulos (≈ 50 % en praderas) |
| Detalle a distancia (`view`) | 12 | 9 | 7 | 5 | 4 | triángulos del suelo |
| Partículas (`parts`) | Altas | Altas | Medias | Bajas | No | GPU |
| Sombras de nubes / Rayos / Halos / Contacto | Sí | Sí | Sí | Sí | No | GPU |
| Héroe nítido (`hero`) | Sí | Sí | Sí | No | No | GPU del héroe |
| Retratos 3D (`prt`) | 24 fps | 24 | 24 | 12 | 12 | CPU+GPU (2.º contexto) |
| Ya existían: Suavizado (FXAA/SMAA/MSAA), Reescalado FSR, Cristal del HUD, Frondosidad del pasto, Sangre | | | | | | |

**Recomendación para el jugador con integrada** (texto para la ayuda o la web): Calidad Media + Límite de fps 60 (o 30) + Sombras Bajas; si aún va justo, Resolución 75 % o FSR.

## 3b · ESTADO DE LAS PROPUESTAS (lote FLUIDEZ-2, 26 oct 2026: «haz todas las propuestas juntas»)

| # | Estado | Qué se hizo / qué falta |
|---|---|---|
| F1 | ✅ | `tools/r3d/stutter_check.py` (basura/s, re-evaluaciones/s, tirones en reposo y corriendo, presupuesto, consola → `RESULTADO`). **Lleva `&load`: con Playwright (`navigator.webdriver`) el juego se SALTA la pantalla de carga y la precompilación si no.** |
| F2 | 🟡 parcial | Terreno: cada vértice de la rejilla de un tile se calcula 1 vez (antes 4: ×2,5–3,4 menos llamadas, malla idéntica) y `field1` sin arrays; carga **por delante** del jugador según su velocidad (máx. 8 tiles). **Falta** el Web Worker (dependencias: `TER`, `BIOMES`, `PROPS`, costa, caminos → habría que cargar esos scripts clásicos en el worker). |
| F3 | 🟡 | Ya se completa como mucho 1 trozo de terreno por fotograma; aldeanos máx. 1 plantilla/fotograma. **Falta** una cola que reparta la subida a GPU de props/actores nuevos. |
| F5 | ✅ (sin worker) | Aldeanos del bioma actual en la carga + **horneado en segundo plano de los demás con el jugador quieto ≥ 1,5 s** (1 cada 0,4 s) + máx. 1 nueva por fotograma al acercarse. Worker/IndexedDB no hechos (no hacen falta mientras esto baste). |
| F6 | ✅ | `Skeleton.update` una vez por fotograma (`SKF`); `DEPTH_I`/`depthI()` para la sombra de los `InstancedMesh` de props y naturaleza. Re-evaluaciones **1 000 → 335/s**. |
| F7 | 🟡 | Opción **«Contornos»** (No = −25 % llamadas y −24 % triángulos medidos). **Falta** contorno en shader / `BatchedMesh`. |
| F8 | ❌ | LOD de árboles y casas: requiere modelos simplificados (trabajo de arte por especie/edificio). Con cámara ortográfica el «lejos» es el zoom alejado: hacerlo por nivel de zoom. |
| F9 | ✅ (FLUIDEZ-4) | Sombra del sol en caché: lo fijo en `sRT` (por casilla de luz / cambio / 1,2 s), copia nativa `blitFramebuffer` + lo que se mueve encima, sin luz nueva. Mapa idéntico (0 texels distintos); Media 1,09 M / 372 → 0,71 M / 251; noche igual. También «Sombras: Medias». |
| F10 | ✅ | El modo Auto **sube** un nivel tras ~15–20 s con mediana < 9 ms (no sube por encima de un nivel del que bajó en los últimos 3 min; no actúa con límite de fps). |
| F11 | 🟡 | `LOWDEV`: ≤ 4 núcleos o ≤ 4 GB declarados → arranca en Media (y F10 sube si va sobrado). Sin prueba de rendimiento sintética. |
| F12 | ✅ | «Resolución: Dinámica» (pasos de 0,1 entre 50 y 100 %, mínimo 4 s entre cambios, objetivo = límite de fps o 60). |
| F13 | ✅ | Presets: Equilibrado · Portátil/integrada (Media + 60 fps + sombras bajas + sin reflejos + resolución dinámica) · Máxima calidad · Ahorro de batería. |
| F14 | ✅ | Preset «Ahorro de batería» (Mínima, 30 fps, retratos lentos, 75 %, sin partículas). |
| F15 | ✅ | **Carga en un PC sin caché de shaders 30–37 s → 17,5–21,5 s** y **0 bloqueos tras la carga** (5/5 ejecuciones): dibujos de la carga «en seco» (`R3D.dry`: el primer dibujo compilaba los shaders de uno en uno, 13 s), compuerta encendida detrás de la pantalla de carga, 2.ª pasada de `warmShaders` sustituida por esperar a la compuerta (−4,6 s), compuerta que oculta también los objetos que comparten un material aún en compilación (causaba esperas de 3–5 s justo al terminar la carga), plazo de la compuerta 4 → 8 s, `blobD` sin trigonometría (−1 s de generación, mundo idéntico comprobado). |
| F16 | ✅ | La 2.ª copia de cada pista (cruce) se descarga 30 s antes del final, no al entrar en el bioma. |
| F4 | ✅ (FLUIDEZ-3) | Héroe pintado por el renderer principal en su render target y compuesto en el lienzo 3D; oclusores ocultos en los pases 2–3; `INK_SK`/`INK_H`. CPU de dibujo −10 %, 149–161 → 183–185 fps, máx. 15 ms corriendo, héroe idéntico al píxel. |

**Medido tras FLUIDEZ-2 (Pradera, RTX 4070, `stutter_check.py`):** reposo 0 fotogramas > 50 ms; corriendo 0 > 50 ms (máx. 45; antes 55); re-evaluaciones 335/s; presupuesto Alta 2,46 M / 504 llamadas, Media 1,11 M / 382 → `ok`; `RESULTADO: OK`.

## 4 · Propuestas (lo que FALTA), por prioridad

### P0 · Tirones que siguen (lo que más se nota)
- **F2 · Terreno en un Web Worker.** `terrain3d.buildG` (geometría de cada trozo + pradera) se calcula en el hilo principal (4–12 ms por trozo al correr). Pasarlo a un *worker* que devuelve `Float32Array` transferibles (posición/color/normal) y en el hilo principal solo crear el `BufferGeometry`. Requiere llevar al worker las tablas de alturas (`TER.tileH`, campos de caminos, `BIOMES.at`) como `SharedArrayBuffer` o copia al iniciar. **Mayor ganancia restante al correr.** Mientras tanto: presupuesto adaptativo (`BUD` según lo que sobre del fotograma) y precarga en la dirección del movimiento.
- **F3 · Subida a la GPU repartida.** Lo recién construido se sube en su primer dibujo (5–10 ms extra). Mostrar como mucho 1 trozo/actor nuevo por fotograma (cola) y crear los `InstancedMesh` con `count` creciente.
- **F5 · Aldeanos fuera de pantalla de carga.** Hoy se hornean los del bioma actual en la carga y el resto 1 por fotograma al acercarse (27–60 ms cada uno = 1 fotograma perdido por variante). Opciones: (a) hornear en un *worker* (los datos del `Mini` son puros: geometría + pesos), (b) guardar la plantilla horneada en IndexedDB tras el primer horneado (`BufferGeometry.toJSON` binario) y cargarla en sesiones siguientes, (c) hornear el siguiente bioma en segundo plano cuando el jugador se acerca a la frontera (por proximidad, no al cruzar).
- **F6 · Basura restante (38 MB/s).** Lo mayor ya es interno de three (`setValueM4`, `Skeleton.update` en cada `render()`: el reflejo y los 3 pases del héroe vuelven a actualizar los esqueletos de los actores). Propuesto: `skeleton.update` una vez por fotograma (marca propia) y sacar los actores del reflejo en Alta; sombra de profundidad con `customDepthMaterial` compartido para los `InstancedMesh` (quedan ~600 evaluaciones/s del `MeshDepthMaterial` de la sombra por alternar instanciado/normal/con huesos).

### P1 · Coste fijo por fotograma (más fps en todas las calidades)
- **F4 · El héroe en el renderer principal.** Hoy: 2.º contexto WebGL + 3 pases + su sombra + su grado + copia a un lienzo 2D = 2,5–4 ms de CPU y ~2 ms de GPU fijos. Pintarlo en la escena principal (capa propia, mismo composer) y hacer la silueta tras paredes con *stencil* en ese mismo renderer. Es el mayor ahorro de CPU restante (toca rayos X y grado del héroe: lote propio).
- **F7 · Menos llamadas de dibujo.** 370–500 por fotograma. Los contornos (`hull`) duplican las llamadas de props y actores: (a) contorno en el *shader* (inflado en el vértice del mismo `InstancedMesh` con un segundo grupo) o (b) contorno por postproceso (bordes de profundidad/normal) solo en Máx/Alta y sin contorno en Baja/Mínima. También: `BatchedMesh` para los props estáticos de un sector (three r170 lo tiene) = 1 llamada por sector y material.
- **F8 · LOD de árboles y casas.** Recursos ≈ 53 % y props ≈ 21 % de los triángulos. Versión simplificada (copa en 1 malla, casa sin tejas individuales) a partir de cierta distancia de la cámara y en Baja/Mínima.
- **F9 · Sombra en cascada barata.** La sombra del sol redibuja todo cada fotograma en Máx/Alta/Media: separar lo ESTÁTICO (props, árboles, terreno; se redibuja solo al moverse la cámara > N tiles o cambiar la hora) de lo DINÁMICO (héroe y actores, en un mapa pequeño aparte).

### P2 · Rangos de rendimiento y opciones
- **F10 · Calidad «Auto» que también SUBE.** `qmon` solo baja. Subir un nivel si la mediana < 9 ms durante 20 s (con histéresis) para que un PC potente no se quede en Media tras un pico de carga.
- **F11 · Detección de GPU por rendimiento real**, no solo por nombre (`IGPU`): medir 60 fotogramas en la pantalla de carga con una escena de prueba y elegir el preset.
- **F12 · Escala de resolución dinámica** (opción «Resolución: Dinámica»): ajusta `dpr` cada segundo para sostener los fps objetivo (el límite de fps elegido) — lo que hacen las consolas.
- **F13 · Presets nombrados en la UI** («Portátil», «Equilibrado», «Calidad») que fijan varias filas a la vez; y una línea de ayuda con el coste de cada opción (barato/medio/caro).
- **F14 · Móvil**: hoy Baja + ×0,55 de resolución. Añadir «Ahorro de batería» = límite 30 + Mínima + sin retratos 3D.

### P3 · Carga
- **F15 · Shaders: caché del programa.** La primera carga en un PC nuevo tarda 13–17 s (compilación). Reducir variantes (cada `define` distinto = programa); ya bajamos a 50–71 programas. Siguiente: unificar `soft`/`flat`/`chr` en uniforms donde no cambie el rendimiento.
- **F16 · Música**: cada pista crea 2 `Audio` con `preload='auto'` (cruce A/B) → con el servidor sin caché se descargan 2 veces y se precargan las 5 pistas del bioma al entrar. Precargar solo la que suena; la segunda copia, al empezar el cruce.

### SIEMPRE (reglas nuevas; texto completo en `REGLAS_CREACION.md` §P13–P16)
- Nada de asignaciones por fotograma en bucles calientes (arrays con `map/filter/sort`, `new Vector3`, cadenas como clave).
- Un material lo usan **o** `InstancedMesh` **o** mallas normales, nunca ambos (`twin()`).
- Nada de `renderer.clippingPlanes` (usa plano oblicuo o `material.clippingPlanes` en un material propio).
- Todo efecto nuevo con coste de GPU entra como fila en `GFX_DEF` y se lee con `gfx()`.

## 5 · Receta de medición rápida (hasta que exista `tools/r3d/stutter_check.py`, propuesta F1)
1. Playwright con `headless=False` (GPU real), `?noedit&test=1`, esperar a `#boot` con `display:none` (NO basta `__nstestReady`: aún se están precompilando shaders).
2. Teletransporte a la plaza de la Pradera (`BIOMES.list[0]` centro) y 8–20 s de espera.
3. **Basura**: CDP `HeapProfiler.startSampling` 8 s → agrupar `selfSize` por `callFrame`.
4. **Tirones**: envolver las funciones de la tabla D y registrar fotogramas > 34 ms; correr con eventos `keydown` (Mayús + WASD).
5. **Programas re-evaluados**: envolver `customProgramCacheKey` del prototipo de `Material` y de los materiales con clave propia; contar por material.
