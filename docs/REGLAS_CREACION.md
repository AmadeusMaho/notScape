# NotScape — REGLAS DE CREACIÓN (fuente única) · creado en la auditoría del 21 oct 2026

> **Para qué sirve:** antes esta información estaba repartida por ~90 lotes de `AGENTS.md`. Aquí está TODO lo que hay que respetar al crear contenido, agrupado por tema, con **dónde se hace cumplir** (herramienta o archivo). `AGENTS.md` solo enlaza aquí. **Si descubres una regla nueva, añádela AQUÍ (y una comprobación en `tools/rules_check.py` si se puede automatizar), no en un lote.**
> Verificación automática: `PYTHONUTF8=1 python tools/rules_check.py` (estática, sin navegador) + las herramientas de `tools/r3d/` citadas en cada sección. Resultado de la auditoría: `docs/AUDITORIA_2026-10-21.md`.

## §P · PRIORIDAD 1: RENDIMIENTO (regla del dueño, 22 oct 2026: «que ningún agente pueda volver a afectar a la optimización»)
> El juego iba a **20 fps en un PC con gráfica integrada** (y «fatal» a otro jugador) y tardaba ~30 s en cargar; se arregló en el lote OPT-RENDIMIENTO (AGENTS.md). **Esta sección MANDA sobre cualquier otra regla de estilo o contenido**: si algo nuevo se ve mejor pero rompe el presupuesto, NO entra (o entra con versión barata por calidad). **Una entrega que se pasa del presupuesto NO está terminada.** Subir un límite solo lo decide el dueño, y se anota en el lote.

**P1 · Presupuesto (lo vigila el propio juego: `R3D.budget()` y el aviso `[R3D PRESUPUESTO]` en consola, `src/r3d/r3d.js` `BUDGET`).** Medido en la plaza de la Pradera, por fotograma, sombra y reflejo incluidos:

| Calidad (`QL`) | 0 Máxima | 1 Alta | 2 Media | 3 Baja | 4 Mínima |
|---|---|---|---|---|---|
| Triángulos máx. | 2,9 M | 2,6 M | **1,35 M** | 1,2 M | 1,05 M |
| Llamadas de dibujo máx. | 600 | 580 | 460 | 430 | 400 |
| Medido el 22 oct | 2,42 M / 478 | 2,13 M / 463 | 1,05 M / 369 | 0,95 M / 346 | 0,85 M / 317 |
| Tras PASTO-FRONDOSO (22 oct) | 2,77 M / 476 | 2,36 M / 464 | 1,08 M / ~360 | = | = |

Además: objetos en la escena ≤ **21 000** (hoy ≈ 19 700), en la escena del héroe ≤ **11 500** (≈ 10 750), programas de shader ≤ **300** (≈ 250). **Media es la calidad de las GPU integradas: es la que más importa.**

**P2 · Antes de entregar CUALQUIER cosa que se vea en 3D** (props, criaturas, efectos, terreno, bioma, HUD 3D): carga el juego en la zona afectada y ejecuta `R3D.budget()` (en el navegador integrado o `python tools/fast/ns.py eval "R3D.budget()"`) en **calidad Media y en Alta**; pega el resultado (tris/llamadas/objetos) en el lote. Si `ok:false`, arréglalo antes de entregar. Y `PYTHONUTF8=1 python tools/rules_check.py` (bloque «RENDIMIENTO», ver P9) sin FALLO.

**P3 · CPU: nada de objetos sueltos.** three recorre TODO el árbol de la escena en cada `render()` aunque esté oculto. Lo estático (props, recursos, decoración) va en `InstancedMesh` agrupados por SECTOR, y el grupo-sector lleva `updateMatrixWorld=NOUMW` (`props3d.js`, `nature3d.js`; las posiciones van en `instanceMatrix`). **Prohibido** crear un `Mesh`/`Group` por prop, por árbol o por partícula. Nada de `new THREE.*` dentro de bucles por fotograma (reutiliza vectores/matrices). Nada de `traverse()` de la escena por fotograma.

**P4 · Triángulos: el detalle mínimo que se lea.** Lo que se repite cientos de veces (matas, nubes, rocas, hojas) usa geometría baja (icosaedro detalle ≤ 1–2, esfera ≤ 16 segmentos, planos ≤ 150 segmentos por lado); las normales suaves ya lo hacen ver redondo. Una malla nueva repetida >100 veces: calcula `tris × copias` y dilo en el lote. `frustumCulled=false` solo con razón escrita en un comentario (no ahorra nada que no se vea). El pasto y el adoquín denso ya escalan con `QL`: respétalo.

**P5 · Todo lo caro escala con la calidad.** Un efecto/sistema nuevo con coste de GPU (pasada extra, reflejo, partículas densas, sombras, postproceso, simulación) DEBE leer `QL` y tener versión barata o apagarse en Media/Baja/Mínima (patrón: `GRASS_Q`, `lodR`, `QCAPS`, sombra 2048/1024 a medio ritmo, reflejo del agua solo en Máx/Alta, héroe sin supermuestreo en Baja/Mín). Hay además un **reescalado tipo FSR 1** opcional (Opciones → Gráficos, `FSR_ON`, APAGADO por defecto por decisión del dueño; `?fsr=1` para probar): pinta el mundo al 75 % y lo amplía con nitidez (−19 a −28 % de GPU medido). Todo postproceso nuevo debe seguir funcionando con él (usa el tamaño del render target del composer, no `V.cw`). **Nunca redibujar la escena entera otra vez** (reflejos, mapas de profundidad, retratos) sin limitarlo a Máx/Alta, a baja resolución y quitando el pasto y los contornos.

**P6 · Recursos de GPU escasos (los vigila rules_check como «trinquete»: no pueden SUBIR sin permiso del dueño):** `new THREE.WebGLRenderer` (hoy **4**: principal, retrato, vista previa, iconos — el héroe lo pinta el principal desde FLUIDEZ-3), luces `PointLight/SpotLight` (5; añadir luces recompila TODO), `castShadow=true` (28), `frustumCulled=false` (48), `EffectComposer` (1), `preserveDrawingBuffer:true` (1). Para iluminar algo nuevo usa `dynlight3d.js`/`lampglow3d.js` (luces baratas), no luces de three.

**P7 · Carga.** Todo módulo nuevo de `src/r3d/` lleva su `<link rel="modulepreload">` en `index.html` (rules_check avisa). El trabajo pesado de la pantalla de carga va en tramos grandes (`PR.warm(45)`), nunca «poco + esperar fotograma». Lo que se crea bajo demanda tiene su `warmObjs()` (§5). El servidor local es `tools/serve_nocache.py` (no `python -m http.server`: en Windows ~300 ms por archivo). Nada de recursos externos pesados (texturas/modelos/audio grandes) sin decirlo en el lote.

**P8 · No se toca sin medir antes y después:** `QCAPS`, `GRASS_Q` (hoy `[1.15,1,.5,.25,0]`, aprobado por el dueño; **Máxima queda al 95 % del límite en la plaza: NO subirla más**), `lodR`, `BUDGET`, `IGPU`, `NOUMW`, el ritmo de sombra (`shF`), el reflejo del agua (`reflect`, `q<=1`), los puffs del Cielo, el adoquín (`q>.6`). Si los cambias, mide con la receta de P10 y anota antes/después en el lote.

**P9 · Lo comprueba `tools/rules_check.py` (bloque «RENDIMIENTO», FALLO = no se entrega):** trinquetes de P6, `NOUMW` en los sectores, valores de `QCAPS`/`GRASS_Q`/`lodR`/`BUDGET` no más altos que hoy, geometrías densas (planos >150 segmentos, icosaedro detalle ≥3, esfera ≥48 segmentos), `PR.warm` ≥ 40 ms, reflejo solo en Máx/Alta, `modulepreload` completo, servidor con keep-alive.

**P10 · Cómo medir (navegador integrado con GPU real, panel VISIBLE; SwiftShader no vale para fps pero SÍ para triángulos/objetos):** `R3D.budget()`; `R3D.stats()` (tris y llamadas del último fotograma); CPU envolviendo `R3D.frame`, `R3D.renderer.render`, `R3D.dbg.ar.render` y `scene.updateMatrixWorld` con `performance.now()` (hoy ≈ 3,7 ms de `R3D.frame` en un PC rápido); triángulos por pase midiendo `renderer.info.render.triangles` antes/después de cada `render(scene)` y de `shadowMap.render`; carga con el texto de `#bt-msg` cada 50 ms (hoy ≈ 7 s). Panel F4 en el juego. **Los fps reales los da el dueño en su integrada y su móvil.**

- **Opción del jugador «Pasto» (23 oct 2026):** el deslizador de Opciones → Gráficos (`GRASSK`) solo MULTIPLICA la densidad de briznas (`Terrain.gk`), nunca sube `GRASS_Q`; por encima de 100 % solo actúa en Máxima/Alta. No reutilices `GRASS_Q`/`terr.q` para eso (`q` también decide el adoquín denso).

**P11 · Tirones (lote ANTI-TIRONES, 25 oct 2026): nada puede compilar un shader en mitad de la partida.** (a) Un material cuyo CÓDIGO no cambia NO debe dar un programa nuevo: en `customProgramCacheKey` va solo lo que cambia el GLSL, nunca el color ni valores de uniforms (`toon()` usa `pk`). (b) Lo que se añade con `add()` a la escena lo cubre la compuerta (`src/r3d/shadergate3d.js`, `R3D.gate`); lo que cambia de material SIN añadirse (destellos, resaltes, materiales temporales) necesita un `warmObjs()` que lo compile en la carga. (c) Si en la consola sale `[R3D] shaders compilados EN JUEGO`, es un fallo a arreglar. (d) Contextos WebGL nuevos (retratos, iconos, vistas previas) se crean y compilan en la pantalla de carga, no al abrir un menú.

**P12 · HUD DOM barato (lote ANTI-TIRONES): el HUD costaba ~20 % de fps en combate.** (a) Nada de `backdrop-filter` en lo que se ve mientras se juega (solo con la opción «Cristal del HUD», `body.hs-glass`); (b) en código que corre cada fotograma NO leas layout (`getBoundingClientRect`, `offsetWidth`, `clientWidth`, `getComputedStyle`) después de escribir estilos: usa `cvRect()` (game.js) o un `ResizeObserver`; (c) escribe un estilo solo si cambió; (d) lienzos animados del HUD a ≤ 30 fps y contextos WebGL del HUD (retratos) a ≤ 24 fps, nunca dos en el mismo fotograma.

**P13 · Sin basura por fotograma (lote FLUIDEZ, 26 oct 2026): el recolector de basura de JS es la causa n.º 1 de tirones periódicos.** Medido antes del lote: 80 MB/s de basura en reposo. En todo lo que corre cada fotograma: nada de `map/filter/sort/slice/concat/spread` sobre listas grandes, nada de `new THREE.Vector3/Matrix4/Color` (reutiliza objetos del módulo), nada de claves de cadena construidas (`i+','+j`) en bucles, nada de `Object.entries`. Si necesitas «las N más cercanas», selección en el sitio (ver `lights()` en r3d.js). Mide con la receta de `docs/PLAN_OPTIMIZACION.md` §5.

**P14 · three no debe «cambiar de programa» en cada fotograma.** three r170 re-evalúa el programa (getParameters + clave = CPU y basura) cada vez que un MISMO material se dibuja en otro contexto: (a) **un material lo usan o `InstancedMesh` o mallas normales, nunca ambos** → `twin(m)` de `materials3d.js` para la malla normal (comparte shader compilado); (b) **prohibido `renderer.clippingPlanes`** (el reflejo usa plano cercano oblicuo, `water3d.js oblique()`); (c) si un renderer pinta en varias pasadas con capas de cámara distintas, **las luces deben estar en TODAS esas capas** (si no, «cambian las luces» en cada pase); (d) no alternes `material.map`/`defines` de un material compartido. Comprobación: envolver `customProgramCacheKey` (§5 del plan) → en reposo debe quedar ≈ 1 000/s o menos (hoy lo que queda es la sombra).

**P15 · Todo efecto nuevo con coste es una OPCIÓN.** Fila en `GFX_DEF` (`src/game.js`: clave, etiqueta, valores, `auto(QL)` = comportamiento por calidad, ayuda) y se lee con `gfx('clave')` cada fotograma. «Auto» debe reproducir EXACTAMENTE lo que hacía la calidad (rules_check vigila `view` y `GRASS_Q_`). Nada de leer `QL` directamente en código nuevo de r3d (salvo para el presupuesto).

**P19 · Sombra en caché (FLUIDEZ-4):** lo fijo que proyecta sombra vive en los grupos de `sStatic()` (r3d.js) y se reutiliza; un grupo nuevo de cosas FIJAS se añade ahí, y lo que cambie algo fijo de golpe llama a `R3D.shadowDirty()`. Lo que se mueve va fuera de esos grupos (se redibuja cada fotograma). Para comprobar: `R3D.shadowCompare()` debe dar `distintos≈0` **también corriendo** (quieto no basta: el fallo de profundidad solo salía en movimiento); no uses `NSTEST.hour()` para eso (congela el reloj). Nada de luces con sombra nuevas para «separar» sombras (§P6).

**P18 · Héroe (FLUIDEZ-3):** el héroe se pinta con el renderer principal en el render target de `HeroGrade` y se compone en el lienzo 3D al final del fotograma (`hgrade.composite`); no vuelvas a crearle un contexto propio ni a copiarlo a la capa 2D cada fotograma (`hgrade.toCanvas` lee la GPU: solo para eventos puntuales). Un material nuevo de contorno no se comparte entre mallas normales, instanciadas y con huesos (usa `twin`, como `INK_SK`/`INK_H`). Combinaciones de botones del ratón: `ev.buttons` (los acordes no lanzan `pointerdown/up`).

**P17 · Medir de verdad (FLUIDEZ-2):** `python tools/r3d/stutter_check.py` (GPU real, carga real) debe dar `RESULTADO: OK` antes de entregar algo que toque render, carga o bucle. **Con Playwright el juego se SALTA la pantalla de carga y la precompilación salvo que la URL lleve `&load`**: sin eso, cualquier medida de carga o de tirones es falsa. Nada nuevo puede dibujarse durante la carga antes de `warmShaders` (usa `R3D.dry`).

**P16 · Trabajo pesado que aparece al moverse = repartido o en la carga.** Construir mallas, hornear plantillas, pintar el mapa: presupuesto en ms por fotograma (terreno 3,5 ms, mapa 1,5 ms con minimapa), **máx. 1 plantilla de actor nueva por fotograma** (`actors3d.js nb`), y lo que se sabe que va a hacer falta (aldeanos del bioma actual) se hornea en la pantalla de carga. Lo que cueste > 10 ms de una vez y no pueda partirse va a un Web Worker (propuestas F2/F5 del plan).

## 0 · Protocolo de entrega (siempre)
1. Trabaja en segmentos pequeños; un entregable por mensaje; cierra diciendo **qué probar a mano**.
2. Si cambias algo: **detállalo en `AGENTS.md`** (lote corto: qué, por qué, cómo se verificó, qué NO) — el lote más antiguo pasa a `docs/HISTORIAL.md` cuando haya >14.
2b. **ACTUALIZA SIEMPRE LA HOJA DE RUTA (regla del dueño, 22 oct 2026):** cada entrega añade una línea al «Registro de avance» de `docs/HOJA_DE_RUTA.md` y marca el estado de la fase que toca (además del lote en `AGENTS.md`), para que otros agentes vean en segundos qué se hizo. Si descubres un error o una decisión nueva, va a `docs/REGLAS_CREACION.md` §11.
3. Arregla sin preguntar cualquier fallo que veas en tu camino (y cuéntalo). Se pregunta solo lo que es **de gusto** o cambia el diseño acordado; si dudas entre dos aspectos, entrega ambos en captura.
3b. **RENDIMIENTO = PRIORIDAD 1 (§P):** `R3D.budget()` en Media y Alta en la zona tocada + `rules_check.py` sin FALLO antes de entregar; resultado en el lote.
4. Comprueba la consola (`ns.py logs` / `read_console_messages`) y ejecuta las herramientas de tu área (tabla del §10) antes de darlo por hecho. Lo que no se pueda verificar aquí (fps en GPU/móvil, tacto del combate, oído) se dice en la entrega.
5b. **Textos para la futura localización (Fase 17, al final):** hoy en español; frases cortas, completas (sin montarlas a trozos con `+` cuando se pueda) y sin repetir el mismo literal en varios sitios; no traduzcas todavía. Detalle en `docs/HOJA_DE_RUTA.md` (Fase 17).
5. Cambio de formato de guardado → sube `S.ver` (los guardados NO importan: se pueden descartar). Textos del juego en **español**.

## 1 · Reglas del dueño (producto) — NO se revierten ni se vuelven a proponer
| Regla | Dónde vive / cómo se ve |
|---|---|
| **NO es un survival** (nada de sed/frío/hambre; nada que haya que hacer «para sobrevivir»); lo ambiental NUNCA castiga; la Pradera casi virgen | `PLAN_POSTPORTEO.md` IDENTIDAD DE BIOMAS; `biome-rules.js` (ningún evento daña ni bloquea) |
| **Combate OSRS + WoW, ACTIVO, no idle**: clic izquierdo = acciones, derecho/WASD = moverse; precisión OSRS (apuntar decide a quién, `rollAtk` decide el acierto); velocidades de arma en segundos; magia DESACTIVADA (`MAGIC_ON=false`) hasta el rework de escuelas; las subclases van AL FINAL | `game.js` (`SWSEC`, `swing`, `aimOn`), `combatlab.js` (`FEEL`) |
| **Nivel no se sube solo** (tutorial): la isla «despierta» niveles con el primer éxito; recortada la XP bajo nivel 2 mientras dure | `isla.js` |
| **Munición:** sin munición equipada = flechas estándar infinitas; ranura exclusiva; cada crafteo da 30; la ballesta usa virotes; carcaj de cuero; **las capas NO se fabrican** | `game.js`, `docs/HISTORIAL.md` «Lote C5» |
| **Recolección ACTIVA y SIN offline** (21 oct 2026): nada se pica/tala/pesca solo ni avanza con la pestaña cerrada; el juego NO es idle. **La RUEDA es solo para extraer recursos de golpe (tala, minería); pesca, crafteo y demás oficios llevan MINIJUEGOS DISTINTOS (variación, decisión del dueño); la pesca es visual en el mundo (pez 3D, retroceder en dirección contraria), sin ruedas** | `HOJA_DE_RUTA` Fase 3·c; `offline()` retirado de `game.js` |
| **Oficios entrecruzados:** a más tier, más ítems de OTROS oficios + 1–2 raros de monstruos/fauna; **tope 4–5 componentes distintos**, curva suave de cantidad | `PLAN_POSTPORTEO.md` OFICIOS ENTRECRUZADOS; se rebalancea en la Fase 36 |
| **Árboles de un color distinto por bioma** (paleta del Cielo como modelo): un bioma nuevo = una fila en `TREEPAL` | `nature3d.js` · `rules_check.py` (≥10 filas) |
| **Un solo dorado `#e8cf94`** y **una sola tipografía** (Spectral texto, Cinzel rótulos) | `css/hud-susurro.css` |
| **Reglas de oro del HUD:** cristal + trazos dorados finos (sin marcos gruesos, medallones ni aros en retratos), vida del jugador SIEMPRE verde (salvo mientras sufre un estado: `data-st`), Guardar/Cargar solo en Opciones, nada en hover que cambie el layout, «Sprite 3D» descartado | `docs/PLAN_HUD_SUSURRO.md` §0 |
| **Poco texto en pantalla:** una línea por instalación, diálogos de una frase; nada de párrafos de instrucciones | `STD` en `game.js` |
| **El 2D del mundo está retirado** (excepción: las mariposas 2D de `ambient.js` se QUEDAN, decisión del dueño); WebGL 2 obligatorio | `AGENTS.md` Estado |
| **Tilt-shift:** no endurecerlo (solo Máxima/Alta, se apaga al alejar); **«círculo de calma» alrededor del héroe: descartado, no volver a proponerlo** | `r3d.js` |
| **Escala:** héroe y criaturas `HK=1` (NO achicar), props `PROP_K=1.5`; la aldea NO se reorganiza por la escala hasta la fase de mundo abierto | `props.js`, `docs/PLAN_MUNDO_ABIERTO.md` |
| **Estilo objetivo «óleo oscuro»** (NRftW), sin grano ni «puntitos»; la intensidad puede bajarse por legibilidad | `docs/GUIA_3D_PORTEO.md` §4.9 |
| **Frontera abierta y jefes = hito, no llave** (en el 3D) | `docs/PLAN_MUNDO_ABIERTO.md` |
| **Varios PNJ DISTINTOS por bioma** (incluida Ru): otro modelo, nombre, ropa y diálogo | `villagers.js`, `npcs.js` |
| **Pisadas ligadas a la FASE del pie**, nunca a un temporizador; solo audios con licencia clara (créditos en `docs/CREDITOS.md`) | `footsteps.js` |
| **Reglas de sonido/música:** pistas provisionales hasta el «recheck final» | `docs/MUSICA.md` |

## 2 · REGLA DE SENTIDO (todo lo que se MODELE)
Se comprueba y se cuenta en la entrega: (1) **ESCALA** vs. héroe (≈1 unidad ≈ 1,75 m; 1 tile = 1 unidad): pez 0,15–0,25, flotador 0,045, barril ≈0,5 — calcula, no copies medidas de una demo; (2) **FORMA/ORIENTACIÓN** (cabeza hacia donde avanza, nada flotando ni hundido); (3) **FÍSICA/FUNCIÓN** (lo que flota está a la altura real del agua); (4) **COHERENCIA** de estilo (óleo oscuro; de noche se oscurece); (5) **VERLO** en el juego real a zoom normal Y máximo; (6) corrige y anota. Si no hay tiempo, se dice.

## 3 · Props y estructuras (`src/r3d/propsdark*.js`)
- **Contrato de módulo:** 1 tile = 1 unidad; origen = centro de la huella en el suelo; puerta a +z; `o.rot` = espejo diagonal x↔z; huella y altura dentro de `FOOT ±22 %` (la colisión `fp` NO cambia); atributos `position`, `normal` plana, `color`, `aEmit`, **sin UV**; determinista (`hash` con semilla por modelo, **NUNCA `Math.random`**); datos por bioma, nunca un `if` por modelo; un bioma = un módulo `propsdark_<bioma>3d.js` con la MISMA firma `darkGeo`. → `tools/r3d/props_sheet.py --medir`, `pradera_sheet.py --medir`, `bosque_sheet.py --medir`, `nat_sheet.py --medir`, `cielo_check.py`; `rules_check.py` (sin `Math.random`).
- **ANTICLIP (tejados):** todo prop con tejado usa `B.gable` (o registra su plano con `b.mode=1` + `b.R.push({cx,cz,hw,hd,y0,ye,h2,top,slope})`); nada pegado al muro sobre `capY(yMuro, saliente, pendiente)`; lo que atraviesa el tejado a propósito va en `b.exempt(()=>…)`; un módulo nuevo exporta `clipReport` y se importa en `tools/r3d/roof_clip.html`. → `python tools/r3d/roof_clip_check.py` debe dar `TODO OK` (+ `rules_check.py` comprueba el import).
- **Estilo:** piedra tosca / entramado / pizarra o paja / musgo / hierro; la luz ámbar es el ÚNICO acento saturado; colores ensuciados (`dirty()`); contorno fino; cada prop respeta la CIVILIZACIÓN de su bioma (`CULT_OF`: 0 medieval · 1 élfico · 2 tribal · 3 nórdico · 4 samurái · 5 infernal · 9 griego de mármol); nada pastel junto a casas oscuras.
- **Suaves, no cajas:** piedra = bloques (`B.course/B.stone/B.bevel`), nunca caja plana con juntas pintadas; tejas individuales; material `soft` (degradado continuo, sin 3 bandas) y **sin texturas procedurales de celdas/grietas**; rocas con `slabGeo`. Las rocas/mena del Cielo usan la misma técnica.
- **Nombres:** antes de nombrar un prop nuevo `grep -w nombre src/*.js src/r3d/*.js` (`templo`, `estela`, `columna` ya existían y rompieron el horno/yunque).
- **Árboles y vegetación:** siempre `FOL.<especie>` + `treeGeo/folMat` (nunca geometrías sueltas); color del bioma por `TREEPAL`; sauces colgantes del Cielo = `FOL.colgante`.

- **Suelo elevado (21 oct 2026):** todo prop con zócalo, gradas o suelo caminable declara su plataforma en `ELEV` (`src/props.js`; ver lote ELEVACION-PROPS de AGENTS.md) para que `TER.standZ` suba a quien lo pisa; si no, el personaje atraviesa el suelo.

## 4 · Personajes, actores y ropa
- Todo por código, sin assets externos de modelos; diorama con cel shading; solo el Bandido lleva capucha; todos con pantalones; enemigos sin mejillas rosadas; armas agarradas con la mano; `HERO_SCALE=.8`, zoom ×1,25. Bufanda por defecto, capa = objeto raro.
- **Sin vigas:** correas, bandoleras y cintas = `sash()`/`bandolier()`/`ribbon()` (cintas CURVAS que abrazan el torso); prohibido `BoxGeometry` larga en diagonal pegada al cuerpo. → `node tools/r3d/body_lint.js` = `RESULTADO: OK`.
- **Objetos en mano:** `F.hold(i, rx, fn)` (mano 0 derecha, 1 izquierda); el saludo levanta el brazo DERECHO (quien lleve lanza/bastón ahí → `wave:false`); yelmo cerrado ⇒ `hairFn(estilo,color,true)`; prendas planas con holgura .01–.03 sobre el torso. → `python tools/r3d/actors_lint.py` (tope 14 000 tris por actor; Gabriel 22 000).
- **Nada se corta:** copa cubre el tronco, patas dentro del cuerpo, márgenes de silueta ≥ 4 px. → `ORG.checks()` + `tools/organic_check.py`.
- **Relojes (bug del 21 oct):** los campos que escribe `game.js` con `performance.now()` (`m.fl`, `m.at0`, `m.wind`, `m.tel`, `m.flare`) se comparan con `performance.now()`, **no** con el `now` virtual de r3d.js (hit-stop). Los retrocesos/offsets de animación **no se acumulan** (se deshacen cada fotograma).
- **Equipo por tier = datos** (`TI`, paleta principal+luz, sombra calculada 35 % hacia `#5b3a29`), nunca un `if` por tier. Color de casilla = **rareza por GRADO**, no el color del metal.

## 5 · Shaders, render y rendimiento
- Colores dentro de shaders en **LINEAL**; **ShaderMaterial/uniformes de G** tocados con cuidado (una pasada de reflejo con planos de recorte globales rompió con ShaderMaterial propio: usar `MeshBasicMaterial` + textura cuando se pueda; los decals de `spellfx3d.js` son ShaderMaterial y **no se han probado con el reflejo activo** → pendiente).
- **GLSL:** nunca `pow(x,y)` con `x` posible <0 (usa `max(x,0.)`; un NaN mancha el post-proceso); sin saltos de línea reales dentro de cadenas de shader (usa `\n`); sin acentos graves `` ` `` dentro de plantillas; no mezclar literales enteros en funciones float; `node --check` solo detecta errores en COPIAS `.mjs`. → `rules_check.py` lista los `pow()` sin acotar para revisión.
- **Nunca rotar/escalar un grupo o `InstancedMesh` con coordenadas de mundo grandes** (animar en shader o con el objeto en el centro de la zona).
- **Cámara ortográfica:** `PointsMaterial` con `sizeAttenuation:false` y `size=ppx(unidades)`; el héroe se compone en 2D POR ENCIMA del 3D (nada 3D «detrás» de su silueta se ve).
- **Contexto WebGL escaso** (principal, héroe, muñeco, diálogo, retrato, iconos 3D…): no crear más sin liberar. **No añadir luces en caliente** (recompila todos los materiales; las `PointLight` son fijas). Sin filtros por frame en el lienzo 2D; no crear canvases de 11 500 px.
- **Precompilar shaders** (`R3D.warmShaders`) tras añadir materiales nuevos: **todo material u objeto creado BAJO DEMANDA (efectos, copias que caen, decals) necesita un `warmObjs()` que `warmShaders` añade a la escena durante la carga**, y se compila contra pantalla Y contra el render target del composer (con/sin plano de recorte); si no, la primera vez que ocurre el juego se congela. Comprobar con `renderer.info.programs.length` antes/después de usar el efecto (debe dar 0 nuevos); vigilar `R3D.dbg.scene` y llamadas/triángulos (F4). Optimización pendiente: recursos 53 % y props 21 % de los triángulos.
- **SwiftShader NO sirve para medir fps**: la GPU y el móvil del dueño son el árbitro.
- **Rendimiento = PRIORIDAD 1: reglas completas en §P (al principio de este archivo).**

- **Partículas:** todo efecto nuevo usa `R3D.fx` (`smoke/spark/chips/dust`), NO el `sp()`/`parts` 2D de píxeles; humo y polvo = SOFT, brillos = GLOW, trozos sólidos = CHIPS; sin `Math.random`.
- **Recursos agotables:** al agotarse deben tener su animación de caída/rotura (`Resources.fell`); un recurso nuevo = su geometría en `parts()` y su caso en `fell`/`updFalls`.

## 6 · Mundo, biomas y datos
- **Un bioma nuevo = una fila en TODAS estas tablas** (checklist; ver `AUDITORIA` §Cobertura): `BIOMES` (biomes.js) · `BIOME_RULES` (biome-rules.js) · `TREEPAL` y `GCOLS/BEACH` (nature3d/terrain3d) · música `DEF` (music.js) · ambiente `CFG` (ambience.js) · cultura de aldeanos `CU` (villagers.js) · `CULT_OF`/`ARQ` (props) · `PALS`/`IKB` (interiors) · superficie de pisadas (footsteps.js) · tablón `[data-b="n"]` (CSS) · `BOARD_WELL` si procede · `BIOMA_K` de rayos si procede · `TOD` si tiene luz propia. Los bucles `for(k<BIOMES.N)` que lean tablas por bioma deben saltarse las **zonas** (`zone:true`).
- **Borde del mapa = pared infranqueable** por cualquier medio (andar, correr, dash, teletransporte, lag con `dt` grande); la colisión sale de los MISMOS tiles que se dibujan (`TER.cliffNear`, margen `CM`): **una sola fuente de verdad**. → `tools/r3d/speed_check.py` (borde), `continent_check.py`.
- Datos de bioma en coordenadas LOCALES; puertas de casa solo `rot` 0 (sur) o 1 (este); `ISO.proj` NO gira con la cámara (usa `ISO.toCanvas`); el mar nunca se come spawn/jefe/estaciones/POI; barreras de relieve `w − amp − meandro ≥ 48`. → `tools/r3d/village_check.py <k>` (solapes, calles, alcanzabilidad con `blk()` real).
- **Aldeas = datos** (`village-barrios.js`, `BIOMES`), no código por bioma; los layouts actuales quedan apretados (esperado) hasta la fase de mundo abierto.
- **Nada de `rnd()`/`R()` del juego para arte** (`rnd` está sembrado y el layout depende de él); el arte usa `hash` por tile.
- **Iluminación:** luces de noche = `DynLight` (por fragmento, 16 luces) + `LampGlow`; interiores usan sus 4 `PointLight` fijas; nuevas fuentes de luz se registran en `LK` (r3d.js).
- **Preparar el online (arquitectura, 21 oct 2026):** lógica de MOVIMIENTO/COMBATE/POSICIÓN sin `Math.random` (PRNG con semilla); **aclaración del dueño (22 oct 2026): `Math.random` SÍ vale para tiradas de azar como crafteo, calidad, botín y condiciones; no hace falta semilla ahí** y el estado de un jugador en un objeto, no en globales sueltas; así 16a/16b (ver `HOJA_DE_RUTA` Fase 16) no obligan a reescribir.
- **Zona Cielo:** hora dorada permanente, sin noche; árboles `mundo` azules; todo recurso en `inZone` se dibuja como Árbol del Mundo.

## 7 · HUD y UI
- Todo el HUD es DOM (`#hs`, `hud.js`, `css/hud-susurro.css`); tamaños en `em` desde `--hu`; nada de `dirty=1` en eventos frecuentes (`skLive`); `panel()` reconstruye `innerHTML`.
- **Casillas:** `sfx(id)` → `data-g`/`--rc`; iconos 3D con `ICON3D` (renderer perezoso, se libera a los 6 s); `?icons3d=0` los apaga.
- **Menús nuevos en el lenguaje Susurro** (cristal, trazo dorado, sin emojis en títulos; iconos SVG de línea). **Tablón por bioma:** un bloque `[data-b="n"]`.
- **Nameplates de enemigos** = DOM `#nps` (`dMo`/`npSweep` en game.js); **vida del jugador con estado** = `data-st` (+ color en `DOTN`).
- Táctil: pulsación larga = tooltip + icono 3D vivo (`touch.js`); zonas ≥ 40–44 px.

- **Minijuegos (21 oct 2026):** todo minijuego usa el patrón común de `game.js` (`mgBegin/mgHintRows/mgUi/mgKey`): ayuda de controles suave junto a la estación las primeras 5 veces (sin bloques ni toasts) y enfoque de cámara `MG_ZOOM` (no cine). Detalle en el lote MINIJUEGOS-UI de AGENTS.md.
- **Rendimiento de carga:** NO programar pasadas completas de `R3D.warmShaders` tras la carga (cada una congela ≈ 3 fotogramas de 115–220 ms aunque no compile nada); lo nuevo se precompila con `warmObjs()` y el vigilante `[R3D] shaders compilados EN JUEGO` avisa de lo que falte.

## 8 · Combate (parámetros que no se tocan sin hablarlo)
- `FEEL` (combatlab.js): `swing`, `stop` 35, `shake` .2, `knock` 0 (el empujón rompió la distancia), `manual`, `aim`; el empujón visual NO existe.
- Dash = quickstep (Espacio), i-frames, cuesta 45 de resistencia; correr = Mayús mantenido (R libre); correr en combate gasta ×4,5→×2,4.
- Avisos: enemigos normales = **ojos 0,8 s**; jefes/élites/nivel ≥ 40 (`bigFoe`) = decal 3D en el suelo + golpe pesado (`combat.js`).
- Estados del jugador = `P.dot` hasta el motor de estados (Fase 23); el daño por estado usa el color de `STC/DOTN` y **no da XP**.

- **FORMATO DE JEFE (decisión del dueño, 21 oct 2026; vale para TODOS los jefes futuros):** todo jefe `boss:1` (y Gabriel) sigue el formato Dark Souls: (1) **cinemática de inicio corta** (escena en `cine.js`, ver `SCENES.gabrielIntro` como plantilla: descenso/aparición, impacto, título dorado espaciado con nombre y subtítulo, campana, anclada en su arena); (2) **arena propia** (para el tutorial: plataforma FUERA de la isla sobre un camino de rocas, para que se vean las nubes); (2b) **la música del jefe empieza al EMPEZAR la intro** (`bossMusic(ms)`); (3) **barra de jefe** abajo-centro (`#bbar`, `bbTick` en game.js: nombre, estela de daño, marcas de fase; oculta su nameplate flotante); (4) **ataques básicos con anticipación visible del cuerpo** (brazo/arma que se alza ~1 s, `wind.slow` + `actors3d.js`), no solo conos ni círculos en el suelo; los círculos quedan para golpes de área especiales. **Mini-jefes (`boss:2`, capitanes) NO llevan cinemática pero sí una barra distinta** (nameplate `.np.b2`, violeta y más ancha). Una cinemática de jefe nueva: `CINE.SCENES.<id>.anchor=[x,y]` antes de `CINE.start`, y crear al combatiente en el `done`.
- **BORDES DEL TERRENO REDONDOS (21 oct 2026, dueño: «el borde cuadrado no es el artstyle»):** todo terreno nuevo contra el vacío (islas, plataformas, caminos) debe definirse con el campo continuo de `coast.js` (`ZI`) y `terrain3d.js` (`bnd`, `?edgesm=0` lo apaga) lo redondea; nunca confiar en la escalera de tiles. Mirar siempre una captura del borde a zoom mínimo.

- **BLOQUEO Y ESQUIVA (21 oct 2026):** Q mantenida bloquea (solo cuerpo a cuerpo; arco/magia no); parada perfecta = ventana corta + CD; esquiva perfecta = 170 ms y reembolso del 80 %. Todo arma/escudo nuevo debe tener su `blockPose` coherente (heroanim3d.js) y todo ataque enemigo nuevo debe pasar por `guardHit` si es bloqueable. Detalle en AGENTS.md (lote BLOQUEO-PERFECT-DODGE).

## 9 · Documentación y archivos
- `AGENTS.md` = memoria compartida **delgada** (≤ ~150 KB): reglas cortas, estado, hoja de ruta (puntero), últimos ≤ 14 lotes. Lo demás en `docs/`.
- Los lotes viejos se mueven a `docs/HISTORIAL.md` (más reciente arriba); lo VIGENTE de cada lote se promueve a este archivo, a una guía o a la estructura del repo.
- Módulo nuevo → una línea en «Estructura del repo»; herramienta nueva → una línea en §10; un `<script>` nuevo en `index.html` o `boot.mjs`.
- Código muerto: no se borra a ciegas (no hay git de respaldo antes de oct 2026): `tools/f18_refs.py --cut` y `grep -n "\bNOMBRE\b"` antes; verificar en el juego.

- **Diálogos de PNJ:** los edita el dueño con `tools/dialogos/` (guarda en `data/dialogos.json`, superpuesto a los del código por `src/dialogos.js`). Un PNJ o misión NUEVO aparece solo en el editor si está en `VNPC`, `VILL.LIST` o `ISLA.QUESTS`; no cambies diálogos existentes en el código para un retoque de texto.

## 10 · Herramientas de verificación (qué ejecutar según el área)
| Área | Comando (Windows: `PYTHONUTF8=1 python …`, sin `-I`) | Pasa si |
|---|---|---|
| Reglas estáticas | `tools/rules_check.py` | `RESULTADO: OK` (avisos revisables) |
| Sintaxis | `node --check` (copias `.mjs` para `src/r3d`) | sin salida |
| Tirones, basura y carga (GPU real) | `tools/r3d/stutter_check.py [--q 2] [--secs 20]` (servidor en 8811) | `RESULTADO: OK` |
| Tejados | `tools/r3d/roof_clip_check.py` | `TODO OK` |
| Props | `tools/r3d/props_sheet.py --medir`, `pradera_sheet.py --medir`, `bosque_sheet.py --medir`, `nat_sheet.py --medir`, `cielo_check.py` | `RESULTADO: OK` |
| Personajes | `node tools/r3d/body_lint.js`, `tools/r3d/actors_lint.py`, `tools/r3d/outfit_check.py` | OK |
| Aldeas | `tools/r3d/village_check.py <k>` | 0 solapes, 0 inalcanzables |
| Biomas/clima | `tools/biome_rules_check.py` | OK |
| Mundo | `tools/r3d/continent_check.py`, `coast_check.py`, `map_check.py`, `speed_check.py` | OK (speed_check sale bajo en SwiftShader) |
| HUD | `tools/r3d/hud_game_check.py`, `icons_sheet.py` | OK |
| Matemática iso | `node tools/iso_test.js` | OK (falla ~1/3 veces por 2 puntos aleatorios conocidos) |
| Rápido | `tools/fast/ns.py start --no3d` + `ns.py eval/logs` | sin errores |

## 11 · Lecciones aprendidas y decisiones de diseño (sesión 21–22 oct 2026: Gabriel, bloqueo, tutorial de armas)
**Errores que ya costaron tiempo — NO repetir**
1. **Atributo `data-i` = id de OBJETO.** El tooltip global (`mouseover` en game.js) trata `[data-i],[data-x]`: `data-i` busca el objeto y `data-x` muestra HTML propio. Un elemento nuevo con `data-i="0"` provocó un cuadrado naranja y un tooltip nativo roto en la barra de habilidades. **Usa `data-sk`/`data-<tuyo>` para índices y `data-x="<b>Nombre</b><br>texto"` para el tooltip con nuestra UI; nunca `title=`.**
2. **Scripts clásicos comparten el ámbito global (`const`).** Un `const SKL` nuevo chocó con el `SKL` de skills y el juego no cargaba. Antes de añadir un global: `grep -n "^const NOMBRE\|^let NOMBRE\|^function NOMBRE" src/*.js`.
3. **Zona segura de aldea (`inVilla`)**: dentro de ella los enemigos sueltan al jugador (`hunt=0`). Un combate nuevo en una zona segura NO ataca; `ISLA.fightOn()` la anula durante Gabriel. Toda arena nueva: comprobar que no cae en `village.safe`.
4. **`kill()` reinicia al mob** (`rollLv` rehace su vida y pone `rt`): no detectes su muerte con `hp<=0`. Usa el contador `S.st['kill:<id>']` comparado con el de AL EMPEZAR el combate (`gk` en isla.js) y `alive()` para «sigue vivo».
5. **Una partida cargada no puede saltarse ni reiniciar un jefe**: guarda el estado mínimo, aparece en un punto previo (isla.js `AR[1]-11`) y arranca el encuentro al entrar en la arena.
6. **Reloj real vs virtual** (r3d.js): todo lo que compara con campos escritos con `performance.now()` usa el real (ya documentado en AGENTS.md: lote FIX-RELOJ-VIRTUAL-CRITICO).
7. **El terreno es por TILES**: su borde contra el vacío salía como escalera. `terrain3d.js bnd` lo redondea con el campo continuo `coastD`; todo terreno nuevo se define con ese campo (`coast.js ZI`) y se mira en captura a zoom mínimo. `?edgesm=0` lo apaga.
8. **Materiales creados bajo demanda** (haz de luz de la intro, ghosts) necesitan `warmObjs` o dan un tirón la primera vez; el haz de la intro de Gabriel aún NO está precompilado.
9. **Cambiar los pasos del tutorial desplaza los índices** de `S.isla.step`: avisa de `ISLA.reset()` y no dejes lógica que dependa de un índice fijo.
10. **Tutoriales = pistas CORTAS** (`ctxHint`, una vez, abajo) y pasos con objetivo; NUNCA toasts/tarjetas grandes en mitad de una pelea (se quitó el toast «Apunta con el ratón…» y la pista de bloqueo del combate).
11. **Ids de objeto con calidad** (`sw_cobre~2`): compara con `String(id).split('~')[0]`.
12. **Pruebas en el arnés (`tools/fast/ns.py`)**: la 3D va a ~2 fps, así que prueba la lógica con `eval` y llamando a las funciones (`swingResolve`, `guardHit`, `pdCheck`, `heroState3D`, `ISLA.tick`) y usa `CINE.seek(t)` + `NSTEST.frames(n)` para capturas de cinemáticas; el panel de la Mochila puede abrirse solo (`setPanel(false,0)`); el día/noche avanza rápido durante las capturas.

13. **Paletas/estados compartidos tiñen todo lo que los usa**: cambiar el color de las partículas de la bola de fuego volvió azules las chispas de los golpes normales. Parametriza por tipo (`PAL` en spellfx3d.js) y comprueba otros usos (`grep`) antes de recolorear algo compartido.

**Decisiones de diseño vigentes (del dueño; no se revierten sin hablarlo)**
- **Jefes (`boss:1`)**: formato Dark Souls = cinemática de intro corta + título + barra de jefe abajo-centro + música de jefe desde que empieza a aparecer (`bossMusic`) + ataques con anticipación visible del cuerpo (no solo conos). **Mini-jefes (`boss:2`)**: sin cinemática pero barra/nameplate distinto (`.np.b2`). Ver §8.
- **Arena de Gabriel** FUERA de la isla (camino de rocas + plataforma redonda, se ven las nubes); las 4 ofrendas son objetos exclusivos del tutorial que aparecen en el banco (anti-brickeo, `grantOfr`).
- **Controles**: WASD mueve; clic izquierdo = golpear/interactuar/lanzar; **clic derecho MANTENIDO (o Q) = bloquear**; **botón del medio = girar cámara** (no mueve al personaje); Espacio = esquivar; V = saltar; Tab = fijar; **1 = SELECCIONAR habilidad (no lanza)**. Ya no existe «clic derecho = ir a ese punto».
- **Bloqueo**: solo cuerpo a cuerpo y puños (arco y magia no). Escudo 80 % / arma 50 % / puños 30 %, gasta resistencia por daño, guardia rota si no alcanza; **parada perfecta** (200 ms, 260 con escudo) sin daño ni gasto y con CD 2,5 s; **esquiva perfecta** (golpe en los primeros 170 ms) devuelve el 80 % de la resistencia + imagen fantasma. Constantes en `BLK`/`DSH`.
- **Stagger y contraataque**: todo enemigo con daño tiene barra de stagger; a 0 queda aturdido (×1,5 y primer golpe seguro); la parada perfecta abre un contraataque ×2. Los jefes la muestran bajo su barra de vida. Todo jefe/enemigo nuevo debe funcionar con `m.stun` (no actuar mientras `m.stun>now`).
- **Dos manos**: arcos, bastones, mandobles y ballestas ocupan las dos manos: **sin escudo** (`twoH` en game.js). Un arma nueva a dos manos debe entrar en `twoH`.
- **Ataque**: una mano/daga/puños = OBJETIVO ÚNICO (el fijado con Tab o el más alineado con el cursor) y solo ese hace aggro; **solo armas a dos manos CARGADAS (y futuras magias de área con `s.area`) golpean en área (hasta 3, 60 % a los secundarios)**; **todo ataque cargado (>55 %) gasta resistencia** (12+18·carga, mandoble ×1,5; sin resistencia sale sin carga).
- **Rango = APUNTADO LIBRE**: con arco o hechizo seleccionado el héroe mira SIEMPRE al cursor en combate (no se encara solo al enemigo); el encarar automático es solo para cuerpo a cuerpo.
- **Magia**: `MAGIC_ON=false` sigue (rediseño); lo único activo es la **bola de fuego CELESTIAL** del bastón, aprendida en el tutorial, que se SELECCIONA en la barra de habilidades (bajo la vida, hasta 6 casillas) y se lanza con el clic. Sin seleccionar, el bastón golpea cuerpo a cuerpo.
- **Tutorial del Cielo**: solo la espada se craftea; Miguel presta arco, bastón y escudo para que el jugador elija arma contra Gabriel; los enemigos del Cielo son **corderos de nube neutrales** separados entre sí (no gallinas).
- **Gabriel**: espada celestial (hoja de luz, guardas de plumas), casco completo intimidante, 30 de vida (es el tutorial), ataques básicos con brazo alzado ~1 s y combo cada 3.º.

- **Campamentos (decisión del dueño, 22 oct 2026):** sus guardias y capitán (`m.poi`) tardan 4 min en reaparecer y nunca reaparecen delante del jugador (`POI_RESP`, `campTick`); el cofre se abre con un casteo de 5 s. Todo campamento nuevo debe definirse con `poi` en sus mobs para heredar esto; no pidas «matar a todos» con respawn corto.

**Pendientes conocidos de esta sesión (para el siguiente agente)**: probar a mano TODO el combate (bloqueo/perfect dodge/arco/bastón/Gabriel); poses de bloqueo de daga, mandoble y doble empuñe sin revisar; aspecto 3D del cordero y de la bola celeste sin ver; teclas 2–6 y más habilidades; magias de área (`s.area`); coste extra del mandoble; bloqueo y habilidades en táctil; precompilar el haz de la intro; la cámara se inclina hacia el enemigo también con rango (`foK`); árboles verdes semitransparentes sobre el borde de la plataforma (sin identificar).

> **Regla de textos de entrada (22 oct 2026, dueño):** en TODO texto visible (tutorial, ayudas, tiendas, tooltips, diálogos) y en los comentarios se escribe **LMB** (botón izquierdo del ratón) y **RMB** (botón derecho), nunca «clic» / «clic derecho» / «click». Ejemplos: «Mayús+LMB», «mantén RMB para bloquear». No tocar los identificadores de código (`onclick`, `addEventListener('click')`).

## 12 · Reglas rescatadas de los lotes archivados el 23 oct 2026 (SIGUEN VIGENTES; el texto completo de cada lote está en `docs/HISTORIAL.md`)
**Tiempo y sincronía**
1. **Reloj real vs virtual:** los campos que escribe `game.js` con `performance.now()` (`m.fl`, `m.at0`, `m.wind`, `m.tel`, `A.h0`, `SWG.t0`, `DSH`, `JMP`…) se comparan SIEMPRE con `performance.now()`, nunca con el `now` virtual de `R3D` (se retrasa con el hit-stop: `vlag`; un crítico llegó a desfasar la pose del golpe 300 ms para siempre). `heroState3D` ignora su parámetro y usa el reloj real. Las mediciones de lag/fps con el panel oculto o limitado NO valen (comprobar `document.visibilityState`).
2. **Animaciones disparadas por el jugador:** patrón `armPose/armP0` (game.js): espera armada → sube desde la fase actual en `imp` ms (el efecto cae ahí) → recuperación → vuelta suave; un clic nuevo corta la vuelta sin saltos. Cada acción incrementa un contador (`A.hn`/`A.wkn`) que `heroanim3d.js` usa para `forceFade` (mezcla desde la pose actual). **Si una animación llega tarde, mira PRIMERO el limitador de velocidad del IK** (`dt·16`, `dt·80` durante `inStrike`) y los `forceFade`, no los tiempos de `game.js`.
3. El hit-stop restablece `R3D.tscale=1` con un `setTimeout`: para congelar el tiempo en capturas hay que reasignarlo. `NSTEST.hour()` desplaza el reloj del bucle respecto a `performance.now()` y rompe las comprobaciones de los minijuegos (reiniciar la página).
**Render y rendimiento**
4. **NO añadir stencil/depth-stencil ni más attachments al render target MSAA del composer** (costó ≈ 12 ms por fotograma en una 4070 a 1080p ≈ 20 fps): las siluetas se hacen con profundidad (`depthFunc Greater` + adelanto `XR_D`) o en el RT propio del héroe. Mide siempre a 1080p+ y en Máxima tras tocar el pipeline de render.
5. **Materiales/objetos creados bajo demanda** necesitan su `warmObjs()` en `warmShaders` (compila {con/sin plano de recorte} × {pantalla / `composer.renderTarget1`}). **No reprogrames pasadas completas de `warmShaders` tras la carga** (tirones de 115–220 ms); el vigilante avisa en consola `[R3D] shaders compilados EN JUEGO (+n)` si falta alguno. No uses `compile()` sobre actores desechables con `SkinnedMesh` (error `isReady`). Para medir la carga con el arnés usa `&load` en la URL (sin él `ns.py` salta la pantalla de carga).
6. **Props con plataforma propia:** se colocan con `TER.baseZ` (terreno) y declaran su fila en `PROPS.ELEV`; los pies quedan `EPS`=.07 niveles sobre la losa y el material `XRAY` lleva `polygonOffset`, o aparece una silueta a ras.
**Datos y código**
7. No guardes banderas dentro de `ACT` (rompe los bucles `Object.keys(ACT)`): usa variables aparte.
8. `HUDSU` es una `const` global (no `window.HUDSU`): compruébala con `typeof`.
9. **Casteo genérico:** `castStart(etiqueta, ms, fn, {e})` (barra `#cast`, pose agachada `se`; se interrumpe al moverte o ser herido): reutilízalo para cualquier acción con tiempo (cofres, buscar, desollar…).
10. **Misión nueva del tutorial:** fila en `ISLA.QUESTS` + pasos `QS(q,'a')`/`QS(q,'t')` en `STEPS`; el marcador sale de `questMark()`. Cambiar pasos desplaza índices (`ISLA.reset()`).
11. **Diálogos:** usa el editor (`tools/dialogos/`), no edites `villagers.js`/`npcs.js` salvo cambio de diseño; nunca asignes `DL.then` a pelo (encadena el existente).
12. **Servidor de Python sin Range:** un `<audio>` normal no puede saltar a un punto; las pistas de escena se descargan a Blob (`music.js`).
13. **Combate:** aggro social (los vecinos se unen) solo como propiedad de especie (lobos, goblins), nunca gallinas. Los golpes sin daño son palabras flotantes («Fallo», «Esquiva», «Absorbido»), nunca un «0».
14. **Ayudas y minijuegos:** patrón `mgBegin/mgHintRows/mgUi/mgKey` (rueda, pesca) y `ctxHint(id, filas)` una vez por partida; si añades un elemento flotante nuevo cerca de las ayudas, agrega su selector a `CTX_OBS`.
15. **Oficios (crafteo y equipo):** manda `docs/PLAN_OFICIOS_FF14.md` (hoja de trabajo `WK/WKUI`, equipo `OFGEAR`); calibrar con `tools/work_sim.js`.

## 13 · CONVENCIONES DE IDS Y DATOS (paso D0 de la Fase 3·d, 23 oct 2026) — léelo antes de crear UN SOLO objeto, receta o habilidad nueva
> Objetivo: que los ~10 oficios nuevos, la fauna, los muebles y la economía se construyan sobre nombres y formatos únicos. `tools/rules_check.py` (bloque «CONVENCIONES») comprueba lo que se pueda. Cambiar una convención = actualizar ESTA sección y avisar al dueño.
### 13.1 Ids de objeto (`I[id]`)
- **Forma:** `<prefijo>_<variante>[_<subvariante>]` en minúsculas, ASCII, sin tildes ni espacios (`estano`, no `estaño`). Un nombre sin prefijo solo para MATERIAS PRIMAS crudas ya existentes (`logs`, `roble`, `cobre`, `lana`, `pluma`, `grasa`). El nombre visible (español, sin mayúsculas de título: «Martillo de cobre») va en `I[id][0]`.
- **El sufijo «por tier» es SIEMPRE el id del tier de `TNM`/`TI`** (`cobre, estano, bronce, hierro, acero, plata, mitril, adam, runita, oricalco, celestita`; nunca el índice 0–10): `sw_acero`, `ar_mitril`, `b_hierro`, `og_sm_m_bronce`. Para cosas ligadas a la MADERA el sufijo es el id de la madera de `WON` (`pino, abedul, roble, fresno, sauce, arce, tejo, ebano, caoba, baobab, mundo`): `bw_roble`, `tb_roble`. El eje de tiers, sus niveles (`OFGEAR.TLV` = 1, 10, 19 … 91) y su cultura (`OFGEAR.CULT`) son DATOS; nunca un `if` por tier.
- **Calidad:** sufijo `~0..3` (`sw_cobre~2`); compara con `String(id).split('~')[0]`; no apila (`stk`).
- **Prefijos existentes (no los cambies):** `b_` barra · `sw_` espada · `lw_` arma de botín · `bw_` arco · `st_` bastón · `sh_` escudo · `ar_` peto/armadura · `lg_` pantalones · `gl_` guantes de combate · `lt_` sets de cuero de botín (`lt_<cultura><ranura><n>`) · `fl_`/`vi_` flechas/virotes · `qv_` carcaj · `ax_`/`pk_`/`rd_` hacha/pico/caña de recolección · `c_` comida cocinada · `f_` plato frito · `pot_` poción · `carne_`/`hueso_`/`piel_` botín animal · `bag_` mochila · `rn_` runa · `rv_` runa de viaje · `sc_` pergamino · `of_` ofrenda de misión (lleva su id en `QITEM`) · `og_` equipo de oficio (`og_<oficio>_<ranura>_<tier>`) · `gema_`, `sal_`, `maza_`, `ropa_` sueltos.
- **Prefijos RESERVADOS para lo que viene** (usa estos, no inventes otros): `pc_` piel cruda · `cu_` cuero curtido por tier · `fb_` fibra (lino, cáñamo, algodón, seda… por tier) · `mj_` madeja · `te_` tela por tier · `tb_` madera lisa/tablón por madera · `mn_` mango · `hj_` hoja metálica · `hr_` herraje · `bl_` bloque de piedra · `ld_` ladrillo · `mb_` mueble (`mb_<tipo>_<cultura>`) · `sem_` semilla · `cv_` cultivo · `hb_` hierba · `rc_` reactivo de Alquimia · `tn_` tintura · `gm_` gema tallada · `eg_` engarce · `pv_` polvo · `tt_` tinta arcana · `eng_` engranaje/pieza mecánica · `ml_` miel/cera. Comida y poción con buff siguen `c_`/`f_`/`pot_` y declaran su buff en una tabla (`BUFD`).
- **Cuero (D6, 26 oct):** `HID[i]` (`cuero`, `piel_<tier>`) son ahora la PIEL CRUDA que sueltan las criaturas (ids sin cambiar; el prefijo `pc_` queda reservado para un renombrado futuro) y Peletería la CURTE (`Curtir …`) en `cu_<tier>`, el cuero que usan armaduras de cuero, carcajes, arcos y cañas. Madera: `tb_<madera>` (tablón, Artesanía) y `mn_<madera>` (mango). **A migrar cuando se porte el oficio dueño:** `tela` → `te_<tier>` (Sastrería); `lana`, `pluma`, `grasa` se quedan como materias primas.
- **Objeto de misión:** añade su id a `QITEM`. **Objeto con equipo:** debe entrar en `eqKey`/`OFGEAR.is`.
### 13.2 Claves de habilidad (`SK`, `S.xp`, `SKI`)
- **Existentes:** `wc` Tala · `mi` Minería · `fi` Pesca · `co` Cocina · `sm` Herrería · `cr` Artesanía · `es` Escultor · `ins` Inscripción (se retira con Encantamiento) · `mg` Magia · `cb` Combate · `ra` Arquería · `pr` Oración.
- **Reservadas:** `ds` Desollar · `pe` Peletería · `sa` Sastrería · `he` Herbolaria · `al` Alquimia · `en` Encantamiento · `jo` Joyería · `ing` Ingeniería · `dm` Domar · `ag` Agricultura · `ap` Apicultura. **`cr` pasa a ser Artesanía = MADERA** (arcos, flechas, madera lisa, mangos, muebles); sus recetas de cuero se trasladan a `pe` al portar Peletería. No uses `do`/`in`/`if` (palabras reservadas de JS).
- **Toda habilidad nueva cumple la lista de comprobación de D3** (icono `SKI`, `S.xp.<id>` por defecto, nivel «despierto» del tutorial, fila en `meas_progresion.py` y `craft_balance.py`, aviso `STD` de una línea, grupo en el panel Habilidades).
### 13.3 Recetas (`ACT[sk]`)
- **Fabricación** (la detecta `stepAct` por `a.length===6`): `[nombre, {ingrediente:cantidad}, idResultado, nivelMin, xp, tiempoMs]`; **tope 5 ingredientes distintos**; `tiempoMs` es el tiempo base del que sale la XP (`pxp(nivel, ms)`). Resultados especiales: `tl:<oficio>:<tier>` (herramienta de recolección que se equipa) y `rn_<x>:<n>` (runas).
- **Recolección** (5 campos): `[nombre, idRecurso, nivelMin, xp, ms]`.
- **Las recetas se GENERAN por datos** (patrón de `TI.forEach` en game.js y `OFGEAR.gen`): una tabla de tiers + una plantilla por familia; nunca copiar 11 filas a mano. No guardes banderas dentro de `ACT` (§12-7).
- **Ingredientes de un oficio nuevo:** cada oficio de fabricación se sube produciendo un INTERMEDIO que otro oficio necesita (plan §5r); su primera receta (nivel 1) debe poder completarse solo con Síntesis básica (recetas de nivel ≤ 8, ver `docs/CALIBRACION_HOJA_TRABAJO.md`).
### 13.4 Equipo de oficio (`OFGEAR.OFD`) y hoja de trabajo (`WK`)
- **`OFD[oficio] = {n:'Herrería', slots:{m,s,h,d,g}, mk:{m:'sm',…}}`:** ranuras fijas `m` principal · `s` secundaria · `h` gorro · `d` delantal/chaqueta · `g` guantes; `mk[ranura]` = oficio que la FABRICA (interconexión: p. ej. el gorro de fragua lo hace Peletería).
- **Acciones exclusivas:** fila en `WK.A` con `of:'<oficio>'` (4–6 por oficio, repartidas para que haya algo nuevo cada 3–6 niveles); cada acción lleva su descripción en `DESC` de `workui.js`. **Dificultad:** `WK.K` + `node tools/work_sim.js <oficio>`.
### 13.5 Guardado (`S`)
- Claves nuevas del sistema de oficios: `S.wkb[oficio]` (barra, macros, acciones vistas) · `S.eqt[oficio][ranura]` (equipo) · `S.wkf[idReceta]` (primera vez). **Reservadas:** `S.casa[bioma]` (casa del jugador) · `S.granja[bioma][parcela]` (cultivos). Toda clave nueva se lee con valor por defecto (`S.x=S.x||{}`); los guardados antiguos son descartables (se puede subir `S.ver`).
### 13.6 Categorías de icono (para D4, `icons3d.js`)
Cada prefijo cae en UNA categoría de icono paramétrico con la paleta de su tier: `herramienta` (`og_*_m/s`, `ax_`, `pk_`, `rd_`, cuchillo) · `ropa-oficio` (`og_*_h/d/g`) · `arma` · `armadura` · `munición` · `barra/lingote` (`b_`) · `madera` (`logs…`, `tb_`) · `cuero/piel` (`pc_`, `cu_`, `piel_`) · `tela/fibra` (`fb_`, `mj_`, `te_`) · `piedra` (`bl_`, `ld_`) · `pieza` (`mn_`, `hj_`, `hr_`, `eng_`) · `gema` (`gm_`, `eg_`) · `planta` (`hb_`, `cv_`, `sem_`) · `comida/poción` (`c_`, `f_`, `pot_`, `rc_`) · `mueble` (`mb_`). Un objeto de oficio NUNCA debe caer al icono emoji.
**Implementado en D4 (25 oct 2026):** `src/r3d/craftgen3d.js` + `CRAFT()` de `item-icons.js`; añadir un prefijo o categoría = fila en `CRP`/`OGK`, función en `GEN3`, pose y `SIZE3`. Gira siempre la GEOMETRÍA, no el mesh (el contorno no lo sigue).
### 13.7 Botín de criaturas y comprobación de ids
- Todo drop de una criatura (`MD[id].dr` = `[[idObjeto, prob],…]` y `MD[id].rare` = `[idObjeto, valor]`) usa ids EXISTENTES de `I` y respeta las convenciones de 13.1. Un id con una errata no suelta nada y no avisa.
- **`python tools/ids_check.py`** (con la sesión rápida en marcha: `python tools/fast/ns.py start --no3d`) comprueba que existan en `I` los ids de: drops y raros de `MD`, ingredientes y resultados de TODAS las recetas `ACT`, `OFGEAR.G` y `QITEM`; y que ningún id rompa la forma (`[a-z0-9_]` + `~calidad`). Falla (código 1) si hay inexistentes. Correrlo al añadir objetos, recetas o criaturas.
```ids-skills
wc mi fi ds co sm pe sa cr es ins mg cb ra pr
```
```ids-skills-reservadas
he al en jo ing dm ag ap
```
```ids-prefijos-reservados
pc cu fb mj te tb mn hj hr bl ld mb sem cv hb rc tn gm eg pv tt eng ml
```

## Herramientas de verificación de modelos (26 oct 2026) — OBLIGATORIAS tras tocar armas, armaduras, cascos o ropa de PNJ
`python tools/r3d/weapon_check.py` (tiras/filos flotantes: un adorno de una hoja curva usa `fuller()`/`blade(...,off)`, nunca `box().translate`) · `python tools/r3d/helmet_check.py` (la cabeza/cara no puede atravesar el casco; los cerrados cubren todo) · `python tools/r3d/beam_check.py` (nada de «vigas»: franjas sobre el cuerpo con `ribbon()`, paños colgantes con `drape()`/`cloth()`, nunca cajas finas y rectas). Detalle en AGENTS.md (lote HELMET-BEAM-CHECK).
`python tools/r3d/skirt_check.py` — túnicas y vestidos deben tener falda de cuñas (`skirt3d.js`) y no dejar que las piernas la atraviesen. Los vestidos NUNCA son un cono sólido.
