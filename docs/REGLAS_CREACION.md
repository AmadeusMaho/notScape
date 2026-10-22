# NotScape — REGLAS DE CREACIÓN (fuente única) · creado en la auditoría del 21 oct 2026

> **Para qué sirve:** antes esta información estaba repartida por ~90 lotes de `AGENTS.md`. Aquí está TODO lo que hay que respetar al crear contenido, agrupado por tema, con **dónde se hace cumplir** (herramienta o archivo). `AGENTS.md` solo enlaza aquí. **Si descubres una regla nueva, añádela AQUÍ (y una comprobación en `tools/rules_check.py` si se puede automatizar), no en un lote.**
> Verificación automática: `PYTHONUTF8=1 python tools/rules_check.py` (estática, sin navegador) + las herramientas de `tools/r3d/` citadas en cada sección. Resultado de la auditoría: `docs/AUDITORIA_2026-10-21.md`.

## 0 · Protocolo de entrega (siempre)
1. Trabaja en segmentos pequeños; un entregable por mensaje; cierra diciendo **qué probar a mano**.
2. Si cambias algo: **detállalo en `AGENTS.md`** (lote corto: qué, por qué, cómo se verificó, qué NO) — el lote más antiguo pasa a `docs/HISTORIAL.md` cuando haya >14.
3. Arregla sin preguntar cualquier fallo que veas en tu camino (y cuéntalo). Se pregunta solo lo que es **de gusto** o cambia el diseño acordado; si dudas entre dos aspectos, entrega ambos en captura.
4. Comprueba la consola (`ns.py logs` / `read_console_messages`) y ejecuta las herramientas de tu área (tabla del §10) antes de darlo por hecho. Lo que no se pueda verificar aquí (fps en GPU/móvil, tacto del combate, oído) se dice en la entrega.
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

- **Partículas:** todo efecto nuevo usa `R3D.fx` (`smoke/spark/chips/dust`), NO el `sp()`/`parts` 2D de píxeles; humo y polvo = SOFT, brillos = GLOW, trozos sólidos = CHIPS; sin `Math.random`.
- **Recursos agotables:** al agotarse deben tener su animación de caída/rotura (`Resources.fell`); un recurso nuevo = su geometría en `parts()` y su caso en `fell`/`updFalls`.

## 6 · Mundo, biomas y datos
- **Un bioma nuevo = una fila en TODAS estas tablas** (checklist; ver `AUDITORIA` §Cobertura): `BIOMES` (biomes.js) · `BIOME_RULES` (biome-rules.js) · `TREEPAL` y `GCOLS/BEACH` (nature3d/terrain3d) · música `DEF` (music.js) · ambiente `CFG` (ambience.js) · cultura de aldeanos `CU` (villagers.js) · `CULT_OF`/`ARQ` (props) · `PALS`/`IKB` (interiors) · superficie de pisadas (footsteps.js) · tablón `[data-b="n"]` (CSS) · `BOARD_WELL` si procede · `BIOMA_K` de rayos si procede · `TOD` si tiene luz propia. Los bucles `for(k<BIOMES.N)` que lean tablas por bioma deben saltarse las **zonas** (`zone:true`).
- **Borde del mapa = pared infranqueable** por cualquier medio (andar, correr, dash, teletransporte, lag con `dt` grande); la colisión sale de los MISMOS tiles que se dibujan (`TER.cliffNear`, margen `CM`): **una sola fuente de verdad**. → `tools/r3d/speed_check.py` (borde), `continent_check.py`.
- Datos de bioma en coordenadas LOCALES; puertas de casa solo `rot` 0 (sur) o 1 (este); `ISO.proj` NO gira con la cámara (usa `ISO.toCanvas`); el mar nunca se come spawn/jefe/estaciones/POI; barreras de relieve `w − amp − meandro ≥ 48`. → `tools/r3d/village_check.py <k>` (solapes, calles, alcanzabilidad con `blk()` real).
- **Aldeas = datos** (`village-barrios.js`, `BIOMES`), no código por bioma; los layouts actuales quedan apretados (esperado) hasta la fase de mundo abierto.
- **Nada de `rnd()`/`R()` del juego para arte** (`rnd` está sembrado y el layout depende de él); el arte usa `hash` por tile.
- **Iluminación:** luces de noche = `DynLight` (por fragmento, 16 luces) + `LampGlow`; interiores usan sus 4 `PointLight` fijas; nuevas fuentes de luz se registran en `LK` (r3d.js).
- **Preparar el online (arquitectura, 21 oct 2026):** lógica nueva SIN `Math.random` (PRNG con semilla) y el estado de un jugador en un objeto, no en globales sueltas; así 16a/16b (ver `HOJA_DE_RUTA` Fase 16) no obligan a reescribir.
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

- **FORMATO DE JEFE (decisión del dueño, 21 oct 2026; vale para TODOS los jefes futuros):** todo jefe `boss:1` (y Gabriel) sigue el formato Dark Souls: (1) **cinemática de inicio corta** (escena en `cine.js`, ver `SCENES.gabrielIntro` como plantilla: descenso/aparición, impacto, título dorado espaciado con nombre y subtítulo, campana, anclada en su arena); (2) **arena propia** (para el tutorial: plataforma FUERA de la isla sobre un camino de rocas, para que se vean las nubes); (3) **barra de jefe** abajo-centro (`#bbar`, `bbTick` en game.js: nombre, estela de daño, marcas de fase; oculta su nameplate flotante); (4) **ataques básicos con anticipación visible del cuerpo** (brazo/arma que se alza ~1 s, `wind.slow` + `actors3d.js`), no solo conos ni círculos en el suelo; los círculos quedan para golpes de área especiales. **Mini-jefes (`boss:2`, capitanes) NO llevan cinemática pero sí una barra distinta** (nameplate `.np.b2`, violeta y más ancha). Una cinemática de jefe nueva: `CINE.SCENES.<id>.anchor=[x,y]` antes de `CINE.start`, y crear al combatiente en el `done`.
- **BORDES DEL TERRENO REDONDOS (21 oct 2026, dueño: «el borde cuadrado no es el artstyle»):** todo terreno nuevo contra el vacío (islas, plataformas, caminos) debe definirse con el campo continuo de `coast.js` (`ZI`) y `terrain3d.js` (`bnd`, `?edgesm=0` lo apaga) lo redondea; nunca confiar en la escalera de tiles. Mirar siempre una captura del borde a zoom mínimo.

## 9 · Documentación y archivos
- `AGENTS.md` = memoria compartida **delgada** (≤ ~150 KB): reglas cortas, estado, hoja de ruta (puntero), últimos ≤ 14 lotes. Lo demás en `docs/`.
- Los lotes viejos se mueven a `docs/HISTORIAL.md` (más reciente arriba); lo VIGENTE de cada lote se promueve a este archivo, a una guía o a la estructura del repo.
- Módulo nuevo → una línea en «Estructura del repo»; herramienta nueva → una línea en §10; un `<script>` nuevo en `index.html` o `boot.mjs`.
- Código muerto: no se borra a ciegas (no hay git de respaldo antes de oct 2026): `tools/f18_refs.py --cut` y `grep -n "\bNOMBRE\b"` antes; verificar en el juego.

## 10 · Herramientas de verificación (qué ejecutar según el área)
| Área | Comando (Windows: `PYTHONUTF8=1 python …`, sin `-I`) | Pasa si |
|---|---|---|
| Reglas estáticas | `tools/rules_check.py` | `RESULTADO: OK` (avisos revisables) |
| Sintaxis | `node --check` (copias `.mjs` para `src/r3d`) | sin salida |
| Tejados | `tools/r3d/roof_clip_check.py` | `TODO OK` |
| Props | `tools/r3d/props_sheet.py --medir`, `pradera_sheet.py --medir`, `bosque_sheet.py --medir`, `nat_sheet.py --medir`, `cielo_check.py` | `RESULTADO: OK` |
| Personajes | `node tools/r3d/body_lint.js`, `tools/r3d/actors_lint.py`, `tools/r3d/outfit_check.py` | OK |
| Aldeas | `tools/r3d/village_check.py <k>` | 0 solapes, 0 inalcanzables |
| Biomas/clima | `tools/biome_rules_check.py` | OK |
| Mundo | `tools/r3d/continent_check.py`, `coast_check.py`, `map_check.py`, `speed_check.py` | OK (speed_check sale bajo en SwiftShader) |
| HUD | `tools/r3d/hud_game_check.py`, `icons_sheet.py` | OK |
| Matemática iso | `node tools/iso_test.js` | OK (falla ~1/3 veces por 2 puntos aleatorios conocidos) |
| Rápido | `tools/fast/ns.py start --no3d` + `ns.py eval/logs` | sin errores |
