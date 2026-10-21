# NotScape 3D · estilo «Diorama pintado» (*painterly low-poly diorama*) y plan de porteo a three.js

> ## ⭐ ESTILO OBJETIVO (decisión del dueño, 17 oct 2026): «ÓLEO OSCURO» estilo *No Rest for the Wicked*
> **Léelo antes de tocar luz, color o postproceso.** El dueño vio la demo y dijo «me gusta mucho»: este es el aspecto al que debe llegar el juego.
> - **Qué es:** el mismo diorama y los mismos modelos, pero con **paleta sucia y apagada, sombras frías verdeazuladas, luces cálidas ámbar, **sin niebla** (el dueño la quitó el 17 oct 2026: invadía de día), viñeta fuerte y aspecto de pintura al óleo** (filtro Kuwahara). La luz (fogata, farol, ventana) es lo único saturado.
> - **Verlo:** `docs/style-reference/r3d/demo-nrftw.html` (botón «No Rest for the Wicked» frente a «NotScape actual»; admite `?t=noche|atardecer|dia` y `?still`). **Si algo no cuadra con la guía, manda la demo.**
> - **Receta exacta:** §4.9 (pasos, números y tabla por hora). Fase de integración: **F3d** (§6).
> - **LEGIBILIDAD MANDA (decisión del dueño, 17 oct 2026):** «si es necesario bajamos el óleo un poco para que se entienda mejor lo que pasa en pantalla». La demo es el **100 %**, no un mínimo: la intensidad del óleo es una **perilla** (§4.9, «Intensidad») que se fija en la planeación de F3d viendo el juego real. Nunca se sacrifica leer al héroe, enemigos, recursos, el clic ni el HUD por parecerse más a la demo.
> - **Reglas que no se negocian:** (1) **sin grano ni trama de lienzo** (el dueño los rechazó dos veces: «puntitos blancos»); (2) **SIN NIEBLA de ningún tipo** (decisión del dueño, 17 oct 2026: «invade mucho de día»; ya no existe ni la baja en postproceso; no la reintroduzcas sin preguntarle); (3) es **solo color, luz y postproceso: no cambia modelos, formas ni lógica**; (4) los assets no tienen versión «oscura»: lo cambia la luz (§1.1); (5) la saturación se reserva para las luces.
> - **Por decidir con el dueño (en la planeación de F3d):** (a) la **intensidad** por defecto del óleo; (b) el **día** en óleo oscuro (la demo lo deriva, pero el dueño solo ha revisado a fondo noche y atardecer); (c) los **tiers pastel** de armadura se lavan con saturación ×0,58; (d) rendimiento del Kuwahara en su GPU y en móvil; (e) cómo casa con los **personajes aprobados** (`GUIA_PERSONAJES_3D.md`): conservan contorno negro y rim, el grado no debe esconderlos.

Documento único para el agente que haga el porteo · aprobado por el dueño el 17 oct 2026.
Todo lo que hace falta para **replicar el estilo** está aquí y en la página de referencia; lo demás de las propuestas anteriores se borró.

**Referencia visual (manda):** `docs/style-reference/r3d/referencia-3d.html`. Usa `vendor/three`, así que funciona sin internet: `python3 -m http.server` desde la raíz del repo y abrir `/docs/style-reference/r3d/referencia-3d.html`. Admite `?t=noche|atardecer|dia` y `?still` (sin giro automático). Capturas: `ref3d_noche.jpg`, `ref3d_atardecer.jpg`, `ref3d_dia.jpg`, `ref3d_detalle.jpg`. **Toda receta de esta guía está implementada en ese archivo:** si un número no cuadra, manda el archivo.

## 0. Estado y verificación

- **Verificado:** la referencia renderiza sin errores en Chromium sin pantalla (SwiftShader) en las tres horas (`python3 -I tools/r3d/shot_demo.py docs/style-reference/r3d/referencia-3d.html salida noche,atardecer,dia` → `RESULTADO: OK`). `node tools/r3d/org_capture.js` exporta 150 modelos de `ORG.U` con `RESULTADO: OK`, y `tools/r3d/org3d_adapter.mjs` los convierte a geometría three sin errores. `organic_check.py` sigue en OK con el gancho `ORG.capture`.
- **No verificado:** rendimiento en móvil y en la GPU del dueño de la versión final (una versión anterior iba a 100–200 fps en su PC), integración con `game.js` (no se tocó).
- **Prioridad:** en lo visual manda esta guía; en lo técnico, `AGENTS.md`. Una rama por fase (`r3d-fN`), un entregable por mensaje, capturas al dueño al cerrar cada fase.

## 0b. Avance (17 oct 2026, Lote R3D-F0/F1 en AGENTS.md)
- **Fase 7 (Bosque) hecha, 20 oct 2026:** props oscuros del Bosque en `src/r3d/propsdark_bosque3d.js`, suelo con hojarasca, luz/partículas; `?bo=old`. Ver AGENTS.md «Lote R3D-F7». Siguiente: Fase 8 Pantano.
- **F0 hecha** y **F1 hecha en modo híbrido**: terreno/agua/pradera en 3D bajo los sprites 2D (que siguen alineados al píxel a 45° y como billboards al girar). Cámara giratoria: rueda pulsada + arrastrar o `,` `.`; `Inicio` = 45°.
- **Héroe (adelantado de F6):** rehecho desde cero en `src/r3d/hero3d.js` (adulto, no «galleta»), animaciones de `HERO.pose` pulidas, física de ropa en `src/r3d/cloth3d.js`. Visor `docs/style-reference/r3d/heroe-3d.html`. **Decisión del dueño: bufanda por defecto; la capa es un objeto raro (con capucha).**
- Pendiente de F1: decidir minimapa (gira o norte).
- **F2-A hecha (Lote R3D-F2a):** props de aldea (`PROPS.list`) en 3D, instanciados por modelo y zona. **Legibilidad del héroe (decisión del dueño, estilo ARPG):** zoom definido por el tamaño del héroe en pantalla (13,5 % del alto por defecto), héroe +11 %, silueta de rayos X cuando queda detrás de algo 3D. Siguiente: F2-B (recursos/estaciones, follaje, árbol muerto, pradera ya hecha).
- **F3a hecha (Lote R3D-F3a):** hora del día en 3D, luces prácticas, emisivos, linterna, niebla a ras de suelo, bloom y grado. La capa 2D oscurece solo sus propios píxeles (`source-atop`). Falta F3b: agua con refracción, filas por bioma, partículas, lluvia 3D.
- **F3b hecha (Lote R3D-F3b):** detalle de superficie procedural (solo color en personajes: el bump rompe las bandas toon), adoquines con relieve real (malla densa + desplazamiento), sistema de vestuario `look.outfit` con propuestas de héroe y PNJ. Lo que era «F3b» (agua, biomas, partículas) pasa a F3c.
- **Niebla ELIMINADA (17 oct 2026, pedido del dueño) y F6b HECHA (atuendos del héroe con selector y vista previa 3D):** ver «Lote R3D-NONIEBLA + F6b» en AGENTS.md.
- **Velocidad (RESUELTO en F4, 18 oct 2026):** andar 95 → **70 px/s** y correr ×1,15 → **×1,9** (`WALK_V`/`RUN_MUL` en `game.js`); la zancada 3D se adapta sola a la velocidad medida. Falta la prueba a mano del dueño (si se siente lento, subir `WALK_V` a 75–80). Ver «Lote R3D-F4» en AGENTS.md.

- **F3d HECHA (Lote R3D-F3d en AGENTS.md, 17 oct 2026):** el óleo oscuro NRftW ya está en el juego con `?r3d=1`: `nr()` + `setOil(K)` en `materials3d.js`, shader `grade` con Kuwahara y tono dividido en `r3d.js`, perilla `K` (slider 🎨, `localStorage['ns_oleo']`, defecto 0,7 = PROPUESTA pendiente del visto bueno del dueño). Capturas `r3d_f3d_*_0-70-100.jpg`. Pendiente: lo que sigue en 2D no recibe el grado; rendimiento en GPU/móvil.
- **R3D-OPT + F3e HECHA (Lote «R3D-OPT + F3e» en AGENTS.md, 17 oct 2026):** pasada de optimización medida (pasto con recorte por cuadrante y 2 LOD, brizna de 35 tris, caché de vértices y presupuesto de 5 ms en los chunks, niebla con pasos por calidad, sombra 1024 y MSAA×2 en táctil) y **partículas/clima 3D en GPU** (`src/r3d/particles3d.js`: 3 draw calls) + cáusticas del agua. Triángulos de la aldea 1,86 M → 0,75 M. Pendiente: refracción real (solo Máxima), luz por bioma, fusionar props, medir en móvil.
- **Estilo objetivo fijado (Lote DEMO-NRW):** óleo oscuro tipo No Rest for the Wicked, demo aprobada (intensidad ajustable por legibilidad); receta en §4.9, integración = **F3d** (no empezada; empezar con planeación). No confundir con F3c (agua/luz por bioma).

- **ESCALA DECIDIDA (19 oct 2026):** props ×1,5 (`PROP_K`), héroe y criaturas sin cambios; el rework de aldeas (más grandes y realistas) va dentro del mundo abierto. Ver AGENTS.md «ESCALA DEL MUNDO» y «Lote R3D-ESCALA».
- **Fase 2 · héroe↔props HECHA (Lote R3D-FASE2, 19 oct 2026):** túnica y bufanda del héroe más apagadas (`TAME` en `herom3d.js`), contorno ×0,8 y facetado opt-in de botas/cinturón/manos/hombrera (`spec.facet`/`inkK` en `mini3d.js`), props con vigas, marcos y puertas ×1,18 (`TK` en `propsdark3d.js`), ventanas apagadas y brasa de chimenea casi apagada de día (`aEmit 4`, shader `emit` de `materials3d.js`). Altura de puerta +20 % disponible con `?puerta=1.2` (decisión del dueño pendiente).
- **R3D-HEROE-NR HECHO (17 oct 2026):** el héroe (renderer aparte) y la vista previa del editor reciben el MISMO grado óleo que el mundo (`src/r3d/herograde3d.js`, receta compartida `OIL_GLSL` en `materials3d.js`; héroe al 85 %); resuelve el pendiente de F3d «el héroe no recibe el grado». Los sprites 2D (PNJ, monstruos) siguen sin él.

## 0c. Personajes (17 oct 2026)
- **R3D-ACTORES HECHO (18 oct 2026):** enemigos, animales, jefes y Ru son actores 3D horneados (`src/r3d/actors3d.js`, ver AGENTS.md «Lote R3D-ACTORES»: trampas, cómo añadir criaturas, herramientas `tools/r3d/actors_*.py`, visor `docs/style-reference/r3d/actores-3d.html`). Pendiente: Guardia/Herrero/Anciano, estaciones 3D, medir fps en la GPU del dueño.
- **ACTUALIZACIÓN (17 oct, tarde): los personajes pasan al estilo «diorama» con cel shading, TODO por código** (`src/r3d/mini3d.js`, `herom3d.js`): sustituye al héroe facetado de `hero3d.js` (queda con `?hero=old`). F6/F6b/F7a/F7b se entienden con ese modelo; las animaciones definitivas están pendientes. Ver AGENTS.md «CAMBIO DE RUMBO EN PERSONAJES» y la «PLANIFICACIÓN ANOTADA».
- **Animaciones del héroe diorama HECHAS (Lote R3D-ANIM, 17 oct 2026):** `src/r3d/heroanim3d.js` (rig con pelvis/torso/codos/rodillas/tobillos en `mini3d.js`, IK de brazos y piernas, guardia de combate por arma, ataques con anticipación-golpe-seguimiento, trabajos, andar/correr por distancia). Visor y tiras: `docs/style-reference/r3d/anim-diorama.html`; comprobación numérica: `node tools/r3d/anim_lint.mjs`. Ver AGENTS.md «Lote R3D-ANIM».
- **Diseños de personaje APROBADOS** (4 atuendos de héroe + 5 PNJ). Reglas para replicar el estilo: **`docs/GUIA_PERSONAJES_3D.md`**. Datos: `src/r3d/outfits3d.js`. Fases F6b y F7a en §6.

## 1. Decisiones del dueño

1. **El ambiente lo cambia la luz.** Noche, atardecer y día son filas de datos (§4.8). **De noche el juego es muy dark fantasy; de día, vibrante y bonito** (es parte de la historia). Los assets no tienen versión «oscura».
2. **Cámara:** ortográfica, **siempre isométrica** (elevación fija de 30°); el acimut puede girar.
3. **Linterna del héroe:** se enciende sola de noche.
4. **three.js r170 guardado en el repo** (`vendor/three`, licencia MIT).
5. **Contorno:** el color le es indiferente. Se usa negro en el héroe y fino del color del objeto en el escenario (§4.3).
6. **Pasto:** estilo «pradera» (referencias del dueño: *The Witness* y un campo de hierba estilizado). Se descartaron conos, matas sueltas, low-poly, briznas cortas tipo Ghibli y capas.
7. **Agua:** clara y esmeralda con refracción real (referencia del dueño: el vídeo «Cozy creek» en three.js). Fondo de tierra. **Rocas en el agua opcionales por estanque.**
8. **Sin grano de película** («puntitos blancos») y **sin niebla** (el dueño la quitó por completo el 17 oct 2026; antes había una niebla a ras de suelo en postproceso). **Vale también para el estilo óleo oscuro (§4.9): sin grano ni trama.**
9. **ESTILO OBJETIVO (17 oct 2026): «óleo oscuro» tipo *No Rest for the Wicked*** (§4.9, demo `demo-nrftw.html`). Aprobado por el dueño tras ver la demo, **con la salvedad de que la intensidad se baja si hace falta para que se entienda lo que pasa en pantalla** (se decide en la planeación de F3d). Matiza el punto 1: la luz sigue cambiando el ambiente, pero el **día vibrante** pasa a ser «día óleo» (apagado, dorado); pendiente de confirmar a ojo.

## 2. Dirección de arte

**Una frase:** *un diorama de juguete pintado a mano: de día un prado luminoso, de noche un cuento oscuro iluminado por fuegos y ventanas.*

- **Dos familias de forma que conviven:**
  1. **Lo orgánico y suave** (pasto, follaje, nubes, agua): mucho detalle pequeño, sombreado blando, sin contorno, colores que salen de un **campo de color** compartido con el suelo.
  2. **Lo construido y lo jugable** (casas, lápidas, rocas, héroe, enemigos): low-poly facetado, bandas de luz suaves y contorno de casco.
- Para que convivan: (a) bandas suaves en todo, (b) contorno fino y del color del objeto en el escenario y solo negro en lo jugable, (c) **musgo y suelo** en la base de todo lo que toca el terreno, y pasto más bajo a su alrededor.
- **Regla de oro:** un foco cálido dominante por encuadre (fogata, ventana, linterna) y emisivos por debajo del 10 % de la imagen.
- **Legibilidad primero:** el héroe y los enemigos llevan contorno negro y rim de luz; si algo no se lee de noche, se corrige ese algo, no la luz global.
- **Capa óleo oscuro (objetivo, §4.9):** encima de todo lo anterior va un grado único de color/luz/pincel; ningún asset lleva su propio «look NRftW». Si un asset desentona, se corrige su color base (más sucio, menos saturado), no el grado.
- **Tierno siniestro:** silueta simpática más un detalle inquietante (ojos que brillan, niebla, cementerio).

## 3. El catálogo del juego ya es 3D

`drawMesh(g,ox,oy,m,col,o)` de `style-organic.js` recibe mallas `{V,T,c,rig}` y solo las proyecta con `C=.7071, KY=.3536, KZ=.866`, que es exactamente una cámara ortográfica a 30° de elevación y 45° de acimut.

- **`ORG.capture(fn)`** (gancho en `style-organic.js`, no cambia el 2D): mientras corre `fn`, `drawMesh` no dibuja y devuelve las mallas con su color ya tematizado (`ORG.theme`) y espejado (`ORG.rot`).
- **`node tools/r3d/org_capture.js salida.json [ids] [--compact]`:** 150 modelos con malla (exteriores, `spots.js`, `interior-art.js`). Los interiores necesitan sus opciones reales; sin ellas sale un aviso de «colores NaN». Sin malla: `heroe`, `aldeano`, `personaje`, `goblin` y todo `creatures.js` (son «galleta» 2D; `CRE` sobrescribe `vaca` y `slime`).
- **`tools/r3d/org3d_adapter.mjs`:** `orgGeometry(THREE, parts)` devuelve una `BufferGeometry` por modelo, con color por vértice, normales planas en piezas `rig` y suaves en las orgánicas, y `aEmit` desde la tabla `EMIT` (1 = ventana o farol que se enciende de noche, 2 = fuego, lava o vela). Para añadir un emisivo se añade una fila, nunca un `if`.
- **Conversión de unidades:** 1 tile (32 px de mundo) = 1 unidad three; `x3 = wx/32`, `z3 = wy/32`; modelo ORG / `ORG_PX (39.6)`; ejes ORG `(x, y, z↑)` → three `(x, z, y)`; 1 nivel de altura (`LV = 22` px) = `0.641` → `y = (h−1)·0.641`; héroe ≈ 1 unidad, casa ≈ 2,2.
- **Para que encajen con §2:** al cargarlos se les aplica el material `toon` con `moss:1` (base con musgo) y el contorno fino de escenario. Los árboles de `ORG.U` (`roble`, `pino`, `sauce`…) se sustituyen por la técnica de follaje de §4.5, con la misma silueta y paleta por especie (`SPECIES` sigue siendo la fuente de datos).

## 4. Receta técnica

### 4.1 Renderer y cámara
- `WebGLRenderer({antialias:false})` + compositor con `samples:4`; `setPixelRatio(min(dpr,2))`; `PCFSoftShadowMap`; **`NoToneMapping`** (con Neutral los colores se lavaban); salida sRGB vía `OutputPass`. Colores en hex sRGB.
- Cámara ortográfica en `tgt + [sin(az)·cos30°, sin30°, cos(az)·cos30°]·40`; arrastrar gira el acimut, rueda o pellizco hace zoom, la elevación no cambia. En el juego arranca en 45° (la vista 2D).
- **Capas:** 0 = opaco (sale en la refracción del agua); 1 = agua, cascada, partículas, halos, haces y nubes.

### 4.2 Material `toon(color, opciones)`
`MeshToonMaterial` + `onBeforeCompile`, con uniformes globales compartidos en `G` (`uTime, uNight, uSat, uLive, uRimCol, uFireP, uFireI, uTrail`).
- **Bandas suaves:** `0.24 + 0.40·smoothstep(.30,.52,l) + 0.36·smoothstep(.56,.82,l)`, con `l = N·L·.5+.5` y un poco de ruido de mundo (×0,07) en el borde.
- **Saturación** `uSat` y **verde vivo de día** `uLive`: realza solo los píxeles verdes, al 25 % en la pradera y al 40 % en el follaje para que no quede fosforito.
- **Opciones (datos por objeto):**

| Opción | Hace |
| --- | --- |
| `vc` | color por vértice |
| `rim` | rim de contraluz (personajes) |
| `ao` | oscurece la base por altura local |
| `moss` | musgo en la base (`vWP.y < .24`, con ruido) |
| `mossUp` | musgo en las caras que miran arriba (rocas, lápidas) |
| `wet` | franja mojada bajo la línea de flotación |
| `gv` | instancias con viento y empuje del jugador en espacio de mundo |
| `meadow` | sombreado de la pradera: normal forzada hacia arriba, degradado base→punta, ráfagas que aclaran |
| `fol` | follaje: vaivén de viento |
| `hero` | (en `mk`) contorno negro grueso en vez del de escenario |

### 4.3 Contornos (casco invertido irregular)
- `hull(geo, t, mat)`: normales promediadas por posición y grosor `t·(.55+.9·hash)`, material `BackSide`.
- **Jugables** (`hero:1`): negro (`INK`, color por hora).
- **Escenario:** `t×0.55` y color = el del objeto mezclado al 62 % con `#140c14`. Se multiplica por `inkK` de la hora (.55 de noche, 1 de día) para que no brille en la oscuridad.
- **Sin contorno:** pasto, follaje, agua, nubes, partículas.
- En el juego, los cascos de lo estático se fusionan por chunk junto a su geometría; lo instanciado usa un `InstancedMesh` paralelo con la geometría del casco.

### 4.4 Pradera (pasto)
- **Matas:** ~4600 matas instanciadas de 7 briznas finas y largas (4 tramos) que salen de un punto con inclinación y altura al azar por hash.
- **Mismo color que el suelo:** `GC(x,z)` es un fbm de baja frecuencia entre `#41582c` → `#5e7a38` → `#8c9a46`. Pinta la tapa de la isla (×0,82) y cada mata (`instanceColor`). `GH(x,z)` da la altura por zonas.
- **Sombreado suave:** normal forzada hacia arriba en el fragmento. Sin esto, la cara trasera de las briznas sale oscura y se ve moteado.
- **Degradado:** de .84 en la base a 1.1 en la punta, con la punta algo más cálida.
- **Peinado y viento:** todas se inclinan en la dirección del viento (`vec2(.9,.4)`) y las ráfagas (ruido + senos) aclaran la punta al pasar (`vGust`).
- **Jugador:** empuje y aplastamiento con un **rastro de 4 puntos** (`G.uTrail` = x, z, fuerza) que se recupera en ~1,6 s. En el juego, el jugador más los NPC o mobs cercanos.
- **Alrededor de los objetos:** pasto más bajo cerca de cada objeto (`FEAT`) y nada en agua, fogata o piedras.
- **Flores dispersas** con el mismo viento.
- **Otros biomas:** cambiar los 3 colores de `GCOL` (p. ej. hierba seca naranja para Volcán o un páramo, como la 2.ª referencia).
- **Calidad:** Alta 100 %, Media 50 %, Baja: solo el campo de color en el suelo.

### 4.5 Follaje (árboles y arbustos) — estilo *The Witness* (referencia del dueño)
- **Láminas, no bolas:** cada rama es una lámina plana (4 tramos) con la silueta recortada de un ramillete. La textura `leafTex('rama')` se genera por código (tallo + foliolos en elipse que se acortan hacia la punta); el material usa `map` + `alphaTest:.5`, a doble cara y con sombras recortadas.
- **Conífera** `conifer(altura, radio, paleta, semilla)`:
  - Tronco fino con musgo.
  - Verticilos cada 0,13 desde el 30 % de la altura.
  - 4–11 ramas por verticil, 2 láminas por rama con giro ±0,35–0,4.
  - Las ramas apuntan hacia fuera y algo abajo y **cuelgan** (curvatura `droop`). Se acortan hacia la copa (`R(y) ∝ ((y1−y)/(y1−y0))^0.85`).
  - 5 láminas cortas en la punta.
- **Arbusto** `shrub(radio, paleta, semilla)`: 42 láminas de la textura `mata` (hojitas en elipse) repartidas sobre 3 esferas desplazadas, para que la silueta sea irregular, mirando hacia fuera.
- **Luz de nube:** normales «esferizadas» desde el eje de la copa (`n = (v − centro)`, con y·0,8 + 0,35). La copa entera se ilumina como un volumen: oscura dentro y a la sombra, clara al sol.
- **Color por vértice:** oscuro dentro → medio → claro y amarillento en las puntas exteriores. Paletas: conífera `#132a24 #2f573a #86a845`, arbusto `#24401f #557f2e #b2c446`.
- **Remate:** vaivén de viento (`fol:1`) y sin contorno. Todas las láminas de un árbol son una sola malla (un draw call).
- **Árbol muerto (pendiente, pedido por el dueño):** es lo último que queda del estilo anterior. Sus ramas son cilindros rectos con contorno. Hay que conservar la silueta, pero afinar cada rama hacia la punta, curvarla (tubo sobre una curva con 3–4 puntos), añadir ramitas secundarias más finas y darle el mismo musgo y sombreado suave. Se hace en F2, junto con los árboles.
- **En el juego:** cada especie de `SPECIES` es una fila (tipo conífera, frondoso o arbusto; altura, radio, paleta). Un frondoso se hace con el mismo `cardMesh`, poniendo láminas `mata` sobre varias esferas en lo alto de un tronco con ramas (como el `roble`).

### 4.6 Agua de arroyo con refracción
> **ACTUALIZADO 19 oct 2026 (decisión del dueño):** el look del agua ya NO es el esmeralda con refracción real de abajo, sino el **estilo «D» (óleo híbrido)**, sin pase extra: ver `docs/PLAN_AGUA_D.md` y la demo `tools/r3d/agua_demo.html` (planeado, **no portado**). Estanques en calma; oleaje solo en el mar y la playa; ondas de pesca con física. **Con FÍSICA (19 oct, tarde): `tools/r3d/agua_fisica_demo.html` + `docs/PLAN_AGUA_D.md` §4.5** (simulación de ondas en CPU, peces que mueven el agua y pesca completa; también sin portar). Lo de abajo queda como contexto histórico y para la calidad «Máxima» si algún día se quiere refracción real.
- **Pase extra:** la escena de la capa 0 se renderiza a `refRT` (con `DepthTexture`).
- **Fragmento del agua:**
  - Desplaza la muestra con la normal (sin coger lo que está delante del agua) y calcula el espesor real = (profundidad del fondo − profundidad del agua) × rango de la cámara.
  - Absorción esmeralda `exp(−espesor·(4.2,1.1,1.5)·.5)` y tinte del color somero.
  - Cáusticas (dos capas de ruido cruzado) en la posición del lecho reconstruida con `uInvVP`.
  - Reflejo de Schlick suave, brillo de luna y glitter (normales de alta frecuencia, potencia 400).
  - Espuma fina en rocas, estela en la corriente, corriente y salto. Orilla con alfa corto.
- **Forma:** malla subdividida con oleaje en los vértices; forma y cuenca por una SDF compartida JS/GLSL (`wsdf`). En el juego, textura de distancia a la orilla y de profundidad desde la rejilla de agua de `TER` y `BIOMES.geo`.
- **Fondo:** tierra de la cuenca (`#5a4430`).
- **Rocas en el agua:** opcionales por estanque. Pocas, oscuras, aplastadas, con `wet` y `mossUp`, y sus posiciones también en el uniforme `uSt[]`.
- **Trampa:** la fórmula clásica de cáusticas `1/length` da infinitos y el bloom deja la pantalla negra.
- **Calidad baja:** sin pase de refracción (lecho analítico + absorción).
- **Cascada:** donde un río toca el borde, una lámina con volumen (sección elíptica que engorda al caer), estrías verticales, fresnel, gotas y bruma.

### 4.7 Isla, cielo y efectos
- **Isla:**
  - Tapa subdividida con el campo de color.
  - Costados por **estratos irregulares**: bordes de banda con ruido suave, 11 niveles, variación de brillo. Colores: labio verde `#3c5229`, tierra `#3b2b2e`, roca `#4f4a56`, base `#2a1f24`.
  - **Rocas incrustadas** con musgo, **raíces colgando** (tubos finos) y quilla de rocas bajo la isla.
- **Nubes:** sprites con textura generada por código (círculos difusos), **pegadas a la cámara y siempre detrás de la isla**, que derivan despacio. Color y opacidad por hora.
- **Fogata:** `PointLight` con `castShadow` (mapa 512, radio 3), parpadeo con 3 senos, halo aditivo y brasas. Solo una luz puntual con sombra por escena.
- **Ventanas:** emisivas HDR, `PointLight` corta y haces de luz (conos aditivos).
- **Linterna del héroe:** vidrio emisivo + `PointLight` 1,8 × `night`, con balanceo.
- **~~Niebla a ras de suelo (postproceso)~~ — ELIMINADA el 17 oct 2026 por pedido del dueño (Lote R3D-NONIEBLA en AGENTS.md; el pase `fogPass` y la `depthTexture` del compositor ya no existen). Descripción histórica:** tras el `RenderPass`, reconstruye la posición desde la profundidad del compositor (`readBuffer.depthTexture`), recorre una capa de 0,42 de alto con 6 muestras de fbm, máscara por zonas y teñido por la fogata. Sin bordes duros.
- **Partículas** (`Points` con shader): brasas, luciérnagas, humo de chimenea, gotas y bruma.
- **Postproceso:** `RenderPass` → `UnrealBloomPass` (½ resolución, umbral .85) → grado (sombras levantadas hacia el morado, viñeta) → `OutputPass`. Sin grano.

### 4.8 Horas del día (`TOD`, se interpolan en 1,5 s)
En el juego la mezcla sale de `sunS(t)`, `dayP(t)`, `LG/lgAt` y `WXD`.

| Clave | noche | atardecer | día |
| --- | --- | --- | --- |
| cielo (arriba/medio/abajo) | `#0b0912 #14111b #2a2038` | `#2a1630 #6a3048 #d8805a` | `#4f97d6 #93cbe8 #eaf5ee` |
| hemisférica cielo/suelo · int. | `#6a5a8a #2a1f2a` · 1.55 | `#9a7090 #3a2428` · 2.4 | `#d4e4ff #6a5a3a` · 3.4 |
| principal (con sombra) · int. · pos. | `#8aa0ff` · 2.5 · (−5,9,3) | `#ffa070` · 3.4 · (−8,4,−2) | `#fff2d4` · 4.8 · (−5,10,3) |
| saturación · verde vivo · `night` | .9 · 0 · 1 | .95 · .45 · .6 | 1.1 · 1 · 0 |
| contorno jugable · factor de escenario | `#0b0910` · .55 | `#1a0e14` · .75 | `#2a1c1a` · 1 |
| ~~niebla · cantidad~~ (eliminada, 17 oct 2026) | — | — | — |
| bloom · viñeta · sombras | .85 · .8 · `#06030c` | .6 · .65 · `#160a14` | .35 · .28 · negro |
| nubes · opacidad | `#3e3458` · .25 | `#e8a090` · .55 | `#ffffff` · .8 |
| agua hondo/somero/cielo arriba/horizonte | `#08262a #1a4a48 #120f20 #2e2648` | `#1a3a40 #4a7a70 #6a3048 #e8906a` | `#0a6670 #48c8b4 #6aaee0 #e6f4f6` |
| fuego · ventanas | 1 · 1 | .8 · .8 | .35 · 0 |

**Luces prácticas:** fogata 6 (alcance 7, caída 1,25), ventana 1,6 (3,2), linterna 1,8 (3). Máximo 4 `PointLight` activas (las más cercanas al jugador; una con sombra).

**Paleta por bioma:** una fila de modificadores en `BIOMES.list[k]`, con tinte de la hemisférica, niebla, partículas y `GCOL`. Puntos de partida:

| Bioma | Noche | Partículas | `GCOL` / nota |
| --- | --- | --- | --- |
| Pradera | la de la referencia | luciérnagas | la de la referencia |
| Bosque | niebla verde-azul, luna débil | luciérnagas, esporas | verdes más oscuros; más follaje |
| Pantano | niebla lila densa, agua verdosa | fuegos fatuos cian | verde enfermizo |
| Cumbres | luna fuerte y fría | nieve | pasto escarchado azul-gris |
| Oriental | cielo índigo | pétalos | linternas rojas emisivas |
| Volcán | cielo rojo-negro | ceniza, brasas | hierba seca naranja; la lava es la luz principal |

### 4.9 Estilo óleo oscuro «No Rest for the Wicked» (OBJETIVO) — receta exacta
Implementado en `docs/style-reference/r3d/demo-nrftw.html` (`nr()`, `setStyle()` y el shader `grade`). Solo grado de color, luz y postproceso. Las filas de §4.8 siguen siendo los **datos base**; el óleo se **deriva** de ellas con `nr(fila, hora)`, nunca se duplican a mano. **La demo está al 100 % de intensidad.**

**Receta, de más a menos importante (en el shader `grade`, `l` = luminancia):**
1. **Desaturar:** `sat` del material = base × **0,58**; en post `c = mix(vec3(l), c, 0.86)`.
2. **Tono dividido:** `c = mix(c*vec3(.84,1.0,1.04), c*vec3(1.14,1.0,.80), smoothstep(.08,.9,l))` → sombras frías, luces ámbar.
3. **Sombras levantadas verdeazules:** `uLift` = `#02080b` (día `#04080a`), solo en zonas oscuras: `c += uLift*(1-smoothstep(0,.45,l))`.
4. **Contraste y exposición:** `c = pow(max(c,0), vec3(1.06)) * 1.32`.
5. **Filtro óleo (Kuwahara de 4 sectores):** sectores de 3×3 lecturas, se elige el de menor varianza; `c = mix(original, kuwahara, .85)`; tamaño de pincel `s = max(1, alto_px/620)` (el trazo escala con la resolución). Coste 36 lecturas/píxel.
6. **Manchas de pigmento** suaves: `blot = noise(px*.012)*.6 + noise(px*.05)*.4`, `c *= 1 + (blot-.5)*.12`. **NADA de grano ni de trama de lienzo** (ambas producen «puntitos blancos»; el dueño las rechazó).
7. **Viñeta** = la de la hora + 0,30 (máx. 0,95), misma fórmula que §4.7. **Bloom** ×1,25 (solo emisivos). **Contorno de escenario** ×0,8 con `ink` mezclado 60 % a `#050707`.

**Intensidad (perilla `K` de 0 a 1; IMPLEMENTADA en el juego en F3d — `OIL.K`/`setOil()` en `materials3d.js`, slider 🎨 en ajustes; la demo sigue sin deslizador):** el dueño quiere poder bajar el óleo si estorba a la lectura. Un solo parámetro `K` (1 = demo; 0 = «NotScape actual») que interpola los valores de arriba. Orden en que se bajan las cosas, de lo que **más estorba** a lo que **menos**: (1) **Kuwahara** (`mix` .85 → ~.4; borra detalle fino y bordes de recursos/enemigos); (2) **viñeta** (+.30 → +.15) y **exposición** (1.32 → ~1.45 si oscurece demasiado); (3) **niebla** (`fogA` ×1.55+.08 → ×1.2); (4) **desaturación** (.58 → ~.75; ojo con los tiers pastel); (5) lo demás (tono dividido, `lift`, bloom) casi no afecta a la lectura y se puede dejar entero: es lo que da el «clima» NRftW con coste de lectura casi nulo. **Regla práctica:** si hay que renunciar a algo, se renuncia primero al pincel (Kuwahara), no al color ni a la luz. La demo debería ganar un deslizador «Óleo 0–100 %» para decidirlo a ojo (siguiente paso pequeño). Valor por defecto: **a decidir con el dueño en la planeación de F3d**; criterio de aceptación = el héroe, los enemigos, los recursos resaltables y los clics se leen igual de bien que en «NotScape actual» a zoom por defecto.

**Valores resultantes por hora** (salida de `nr()` sobre §4.8 al 100 %; las filas no listadas no cambian):

| Clave | noche | atardecer | día |
| --- | --- | --- | --- |
| cielo (arriba/medio/abajo) | `#090c11 #161f22 #50433a` | `#1b1121 #472a37 #9f6849` | `#69869d #7d9ba5 #a7b0a9` |
| hemisférica cielo/suelo · int. | `#656b88 #2a1e1f` · 1.55 | `#9a8e98 #31201e` · 2.4 | `#bac8d6 #4c3e28` · 2.72 |
| principal · int. | `#8da9dc` · 2.375 | `#ffb174` · 3.23 | `#ffd7aa` · 3.84 |
| saturación | .522 | .551 | .638 |
| contorno jugable · factor de escenario | `#07080b` · .44 | `#100a0d` · .60 | `#1a1211` · .80 |
| ~~niebla · cantidad~~ (eliminada, 17 oct 2026) | — | — | — |
| bloom · viñeta · sombras | 1.06 · .95 · `#02080b` | .75 · .95 · `#02080b` | .44 · .58 · `#04080a` |
| nubes · opacidad | `#4f5560` · .20 | `#ad857b` · .44 | `#bdc0bf` · .64 |
| arena | `#433930` | `#4c3d2f` | `#614932` |
| rim | `#b68ec0` | `#eb996a` | `#ebcdaa` |
| fuego · ventanas | 1.15 · 1.2 | .93 · .96 | .435 · 0 |
| agua hondo/somero/cielo arriba/horizonte | `#092123 #244a45 #161f25 #53514c` | `#132e31 #3d665d #4f2d3b #b77f5e` | `#0a4c53 #3c9a8a #4f82a7 #b6c0bc` |

**Reglas de arte para assets nuevos:** colores de superficie sucios (verde oliva/musgo, marrón de tierra húmeda, azul pizarra), nunca saturación pura; el único acento saturado de una escena es la luz cálida (`#ffa040`–`#ff8a3a`), y a lo sumo un detalle rojo (la capa o bufanda del héroe); cada fuente de luz = poza cálida bajo ella (`PointLight` o halo aditivo) sobre sombra fría general; texturas con manchas grandes y suaves, sin ruido fino. Los personajes siguen `GUIA_PERSONAJES_3D.md` (contorno negro, UN acento): el óleo no los reemplaza, convive con ellos.

**Cómo se integró (F3d, hecho):** (ver «Lote R3D-F3d» en AGENTS.md; lo que sigue es el plan original y lo que queda abierto: tiers pastel, interiores, rendimiento) mover `nr()` y el shader `grade` (con `uNR`/`K` y Kuwahara) a `src/r3d/r3d.js` (`todAt/light`) y `materials3d.js`; ajuste «Estilo / Óleo» en Opciones guardado en `localStorage` (no en `S`); **calidad Baja = sin Kuwahara** (solo pasos 1–4 y 7); resolver los tiers pastel (diferenciar por brillo/acento metálico o excluir el equipo del grado); revisar a ojo las 3 horas, los interiores y los personajes; medir el rendimiento. **No es** el arte pintado a mano ni la animación del original: es su *aspecto*. Para «más pictórico» se sube la mezcla del Kuwahara o el pincel, no se añade ruido.

## 5. Arquitectura del porteo

**Principio:** el mundo lógico sigue plano en px; no se toca combate, guardado, colisiones (`blk`, `TER.cliffNear`), pathfinding ni misiones.

- **Carga:** `importmap` con `"three": "vendor/three/build/three.module.min.js"` y `"three/addons/": "vendor/three/examples/jsm/"`. Sin build: Vercel lo sirve tal cual. El juego son *scripts* clásicos con globales, así que un módulo puente `src/r3d/boot.mjs` pone `window.THREE` (y los addons) y resuelve `window.R3D_READY`; `bootRun()` lo espera solo con `?r3d=1`. **[verificar]** que los `const` globales (`ORG`, `TER`, `PROPS`…) se ven desde el módulo; si no, `window.X = X`. Si hace falta otro addon de three, que lo descargue el dueño (desde la nube no hay acceso a npm ni a CDN).
- **Módulos nuevos en `src/r3d/`:**

| Archivo | Hace | Sustituye a |
| --- | --- | --- |
| `r3d.js` | renderer, cámara isométrica giratoria, capas, `render(state)`, calidad | la parte de mundo de `draw()` |
| `materials3d.js` | `toon()`, `hull()`, `inkFor()`, `G` (copiar de la referencia) | — |
| `org3d.js` | `ORG.capture` + `org3d_adapter.mjs` + caché + instancias | `PROPS.bake`, `BH`, cachés de sprites |
| `terrain3d.js` | chunks desde `TER.th`, campo de color, estratos, raíces, quilla | `TER.draw`, `PAINT` del terreno |
| `nature3d.js` | pradera, follaje, flores (por chunk) | árboles 2D, `scatter` |
| `water3d.js` | agua con refracción, cascadas, lava | `water-gl.js` |
| `light3d.js` | `TOD`, pool de luces, emisivos, linterna, haces | `light.js`, `lighting()` (reutiliza `lgAt`) |
| `particles3d.js` | **(HECHO, F3e)** flotantes (luciérnagas, polvo, hojas, pétalos, nieve, brasas, ceniza), lluvia y chapoteos en GPU; pesos por bioma en `BIOME_W` | `AMBI` (parte aérea) |
| `blood3d.js` | **(HECHO, Lote R3D-SANGRE 19 oct)** sangre: gotas con física + manchas de suelo (decals instanciados con shader, estilo óleo oscuro con contorno) que se adaptan al arma y a la animación (`HeroAnim.strike()`); 2 draw calls; `R3D.blood`, botón `#sgb`, `?sangre=N` | — (efecto nuevo) |
| `post3d.js` | niebla, bloom, grado, salida, nubes | `post()`, viñeta |
| `actors3d.js` | **(HECHO PARCIAL, Lote R3D-ACTORES 18 oct)** 33 criaturas de `MD` + Ru horneadas en `SkinnedMesh` (esqueleto propio, animación procedural, proxy de profundidad para ocluir al héroe). Pendiente: Guardia/Herrero/Anciano, sombra de contacto, rastro en el pasto | `dM` (ahora `dM`/`dMo`), `PROPS.mob`, `litSpr` |
| `fx3d.js` | partículas, estelas, proyectiles | `AMBI.draw`, `drawPJ`, `drawHFX` |
| `pick3d.js` | raycast clic → mundo, entidad bajo el puntero, `toScreen()` para el HUD | `ISO.toWorld`, `pickEnt`, `ISO.toCanvas` |

- **El canvas 2D `#c` se queda encima y transparente** (como hoy con `water-gl.js`): HUD, diálogos, minimapa, menús e iconos no se portan. Lo anclado al mundo usa `R3D.toScreen`. Las teclas en ejes de pantalla (`ISO.keyDir`) se rotan con el acimut. El minimapa gira con la cámara o muestra el norte **[decidir con el dueño en F1]**.
- **Equivalencias que hay que conservar:**
  - **Resalte (`hl`):** casco más grueso y claro solo en el objeto bajo el puntero.
  - **Oclusión al 50 %:** raycast cámara→jugador y *screen-door dithering* en lo que tapa.
  - **Orden de dibujo:** lo resuelve el depth buffer.
  - **Determinismo:** todo por `hash`, nunca `Math.random` en el mundo.
  - **«Modelos que no se cortan»:** `ORG.checks()` sigue valiendo.
  - **Borde del mundo:** sale de `TER`.
- **Seres vivos:** en F4 son **billboards** de sus sprites 2D actuales (la dirección del sprite se elige según el acimut), con sombra de contacto y el rastro en el pasto. En F6–F7 pasan a rigs 3D en el lenguaje del encapuchado de la referencia: low-poly, cabeza grande, ojos brillantes, contorno negro y rim.
  - **Héroe:** traduce `HERO.pose(state)` a ángulos y conserva `S.app` y `gearOpts()`.
  - **Bestiario:** `biped3D/quad3D` leen las **mismas configs** que `biped/quad` de `creatures.js` (`s, skin, cloth, wp…` / `col, belly, len, hr…`). Las armas `WP` pasan a mallas. Estados: reposo, caminar, ataque (anticipación ~30 %, golpe ~15 %, recuperación ~55 %), daño (flash claro + retroceso), muerte (se deshace en ceniza). Se validan con gallina, lobo, esqueleto y slime antes de hacer los ~35. El color de ojos codifica la amenaza: ámbar hogar, rojo hostil, cian magia/no-muertos, violeta corrupción, dorado botín.

## 6. Plan por fases

Cada fase en `r3d-fN`, con `?r3d=1` (el 2D sigue por defecto) y capturas 2D vs 3D del mismo punto.

| Fase | Contenido | Hecho cuando |
| --- | --- | --- |
| **F0 · Preparación** | `importmap`, `src/r3d/boot.mjs`, `?r3d=1`, `materials3d.js` copiado de la referencia, inventario de lo que el 2D dibuja en el mundo (`spr`, `TXS`, `hsDraw`…). | Sin `?r3d` nada cambia; con `?r3d=1` hay un canvas 3D vacío detrás del HUD sin errores. |
| **F1 · Mundo estático** | Terreno por chunks de la Pradera con campo de color, estratos y borde; cámara que sigue a `P` y gira; zoom por pasos; clic por raycast; teclas rotadas. | Clic y movimiento iguales al 2D a 45° (50 puntos, error < 2 px) y correctos girada; `cliff_check.py` sin cambios. |
| **F2 · Props y naturaleza** | `org3d` + cascos + instancias para `PROPS.list`, recursos, estaciones y guaridas; musgo en bases; follaje por especie; árbol muerto rehecho (§4.5); pradera y flores por chunk. Hoja de contacto 3D de los modelos. | Hoja aprobada; aldea reconocible; ≤ 150 draw calls por pase en la aldea. |
| **F3 · Luz y agua** | `TOD` ligado al reloj del juego, lluvia, luces prácticas desde las fuentes de `light.js`, emisivos, agua con refracción, niebla, nubes, post. **Fijar el look en la Pradera antes de seguir.** | Capturas de las 3 horas aprobadas por el dueño. |
| **F3d · Estilo óleo oscuro NRftW (decisión del dueño, 17 oct 2026) — ✅ HECHA el 17 oct (falta visto bueno del dueño: intensidad por defecto 0,7, día, tiers pastel, rendimiento)** | Llevar §4.9 al juego: `nr()` + grado Kuwahara en `r3d.js`/`materials3d.js`, perilla de intensidad `K` (el dueño quiere poder bajarla por legibilidad), ajuste «Estilo/Óleo» en Opciones, calidad Baja sin Kuwahara, tiers pastel resueltos, día óleo confirmado, revisar con personajes aprobados. **Empieza con una planeación con el dueño** (intensidad por defecto). Demo: `demo-nrftw.html`. | Capturas de las 3 horas en el juego aprobadas por el dueño con la intensidad elegida; sin grano/trama; héroe, enemigos y recursos igual de legibles que en el estilo actual; ≥ 50 fps en calidad Auto. |
| **F3f · Pulido visual del look 3D (APROBADA por el dueño, 18 oct 2026: «me gustaron todas tus sugerencias»; es la SIGUIENTE fase del porteo) — 🟡 EN CURSO: P1, P2 y P3A HECHOS (Lotes R3D-F3f-P1P2 y R3D-F3f-P3A, 18 oct); P4 (tilt-shift) DESCARTADO por el dueño; P6 (halo del santuario) HECHO (Lote R3D-F3f-P6, sin ver en pantalla); P5 y P7 van con F5** | Siete pasos, en este orden, cada uno entregable con capturas ANTES/DESPUÉS (`shot_at.py`, K=70 y K=40, día y noche; capturas base en `docs/style-reference/r3d/rev18oct_*.png`). **P1** óleo con intensidad según la hora: `K_efectivo = OIL.K·mix(0.55,1,night)` en `r3d.js` (día ≈ 40 %, noche 70 %; el slider 🎨 sigue siendo el máximo). **P2** sombras de nubes en el suelo: ruido de mundo de 2 octavas desplazado con `uTime` y el viento `vec2(.9,.4)`, máx. −18 % de luz, en `terrain3d.js`/`materials3d.js` (uniform en `G`); no es niebla. **P3** oclusión: primero 3A = sombra de contacto «blob» (quad con textura radial) bajo props, recursos y actores; solo si se queda corta, 3B = `GTAOPass` (reponer `depthTexture`/normales, solo calidad Alta). **P4** tilt-shift suave en el shader `grade` (5–7 lecturas verticales en el 18 % superior e inferior; centro intacto; perilla propia, 0 = off). **P5** (con F5) rayos de sol: 4–8 conos/cards aditivos entre copas con `dayP` en .15–.35 y .65–.85, un draw call instanciado, y poza de luz cálida bajo el héroe de día. **P6** atenuar el halo/haz del santuario cuando el héroe está a < 2 tiles (hoy lo sobreexpone). **P7** (con F5) luz y color por bioma (`GCOL`, hemisférica, partículas por fila de `BIOMES`). Reglas: sin grano, sin niebla, legibilidad primero; calidad Media/Baja sin P4 ni 3B. | Capturas aprobadas por el dueño; héroe, enemigos y recursos igual de legibles; `perf_check.py` sin subir draw calls más de un 5 % (P5 ≤ +1); ≥ 50 fps en calidad Auto. |
| **F2-C · Rediseño de props (decisión del dueño, 17 oct 2026)** | Las casas, farolas, puestos, vallas… se diseñaron para el juego pintado pastel; el 3D es más serio (dark fantasy). Rehacerlos como modelos 3D propios en el lenguaje de la referencia (piedra, madera oscura, tejados de pizarra/paja, musgo, faroles emisivos), manteniendo huella y colisión. Hoja de contacto 3D antes de sustituir. **[Q02 HECHA 18 oct 2026: hoja `docs/style-reference/r3d/props-oscuros.html` + `src/r3d/propsdark3d.js` (10 modelos); **APROBADA por el dueño (18 oct)**; decidió además props por civilización en todos los biomas y SUELO acorde (adoquines, camino de tierra, molino…): ver AGENTS.md «Lote R3D-F2C-DECISION». Q03 = sustituir en `props3d.js` con `darkGeo`; ver AGENTS.md «Lote R3D-F2C-Q02».]** | Hoja aprobada; aldea coherente con el héroe y la referencia. **[18 oct 2026, Lote R3D-F2C-PUERTAS en AGENTS.md: las fachadas 3D de las puertas (porche, medallón, anillo) se ELIMINARON por decisión del dueño; la entrada es solo la puerta del edificio con un brillo ámbar (`DoorGlow`; `DOOR_AT` en `propsdark3d.js`: cada casa nueva con puerta añade su fila). **[Lote R3D-F2C-Q00c + Q02b-2, 18 oct 2026: tejados de los props oscuros apoyados en el muro (`B.gable` con `sup`) y adoquín rehecho como lajas irregulares de cara plana con menos musgo (`gslab` en `materials3d.js`).]** Q02b parcial: adoquines y camino de tierra oscuros en `GROUND_COLOR`.]** |
| **F4 · Actores provisionales — ✅ HECHA el 18 oct 2026 (Lote R3D-F4 en AGENTS.md; falta la prueba a mano de la velocidad)** | Billboards (superados por los actores 3D de R3D-ACTORES), sombras de contacto (P3A), hover, oclusión, hitsplats, linterna automática (F3a), rastro del jugador en el pasto. **+ VELOCIDAD (decisión del dueño):** andar 70 px/s y correr ×1,9 (OSRS), constantes `WALK_V`/`RUN_MUL` en `game.js`; la Energía ya no se gasta al correr y `meas_progresion.py` no modela viaje, así que no cambian; comprobación `tools/r3d/speed_check.py`. | Juego completo jugable con `?r3d=1` en la Pradera; velocidad probada a mano por el dueño. |
| **F4b · Interfaz dark fantasy (decisión del dueño, 17 oct 2026)** | Rehacer el HUD y los menús (paneles, botones, orbes, minimapa, inventario, diálogos, tooltips, cartas del camino, pantalla de carga, editor de personaje) para que casen con el dark fantasy: piedra/hierro oscuro y cuero, bordes grabados, acentos dorados/ámbar apagados, tipografía con serifa legible, iconos coherentes; sigue siendo DOM + canvas del HUD (no se porta a 3D). Mantener legibilidad y móvil. Propuesta en capturas antes de aplicar. | Capturas aprobadas; sin pérdida de legibilidad. |
| **F5 · Biomas** | Los 6 biomas con su fila de luz y `GCOL`, agua y lava, cascadas en bordes, partículas, compuertas. | Recorrido por los 6 sin errores; capturas por bioma. |
| **F6 · Héroe 3D** | ✅ HECHO (lotes R3D-F0/F1, F1c, F2a): rig, `HERO.pose` pulido, `S.app`, equipo, ropa con física, andar/correr por distancia. | Hecho. |
| **F6b · Atuendos del héroe (decisión del dueño, 17 oct 2026) — ✅ HECHA el 17 oct (Lote R3D-F6b en AGENTS.md; falta decidir los desbloqueos: hoy TODOS disponibles, `OUTFIT_FREE`)** | Los 4 diseños APROBADOS (`src/r3d/outfits3d.js` `OUTFITS`: Errante = base, Penitente, Mercenario, Cazadora) como atuendos: `S.app.outfit`, selector 3D en el editor de personaje, equipo superpuesto (peto sustituye a la prenda, yelmo oculta pelo), desbloqueos a confirmar, color de bufanda. **Reglas de estilo: `docs/GUIA_PERSONAJES_3D.md`.** | El jugador elige atuendo en el editor y se ve igual que en `disenos_heroe.jpg`. |
| **F7a · PNJ y humanoides 3D (decisión del dueño, 17 oct 2026) — ✅ HECHA en lo de la aldea (20 oct, Lote R3D-F6): Ru, Guardia, Herrera y Anciano y todos los humanoides de `MD` son 3D; faltan los tenderos/cajeros de interiores (Fase 15)** | Diseños APROBADOS (`outfits3d.js` `NPCS`): Ru → Tendero; Guardia, Herrera y Anciano nuevos en la aldea (con diálogo); criatura Bandido y Rufo con el mismo modelo; resto de humanoides de `creatures.js` con la receta de `GUIA_PERSONAJES_3D.md` §4. | PNJ 3D en la aldea iguales a `disenos_pnj.jpg`; bandidos combatiendo en 3D. |
| **F7b · Bestiario 3D — ✅ HECHA en lo básico (18 oct, Lote R3D-ACTORES)** | Cuadrúpedos, ave, rana y humanoides en `actors3d.js`; visor `actores-3d.html`, hoja `actores_hoja_dia.jpg`, `actors_lint.py`. Falta: ataques especiales de jefes, estados alterados visibles, sonidos. | Hoja de turntables aprobada por el dueño. |
| **F8 · Interiores, fachadas, rendimiento** | `interior-art.js` capturado con sus opciones, ~~`facades.js` en malla~~ (CANCELADO 18 oct 2026: las fachadas se eliminaron, la puerta solo se ilumina; ver R3D-F2C-PUERTAS), medir en móvil y ajustar calidad. | ≥ 50 fps en el móvil del dueño en la aldea de noche (calidad Auto). |
| **Nota (19 oct 2026, Fase 43)** | **Mundo abierto decidido:** biomas ×2 lineal (288×188 tiles), frontera abierta con montañas de relieve, jefes = hito (no llave), muralla con guardias solo Pradera\|Volcán, aldea por barrios, capital en el Oriental, minimapa local alineado + mapa del mundo. Manda `docs/PLAN_MUNDO_ABIERTO.md` (§8–§9) sobre cualquier frase de esta guía sobre «diorama por bioma», bloqueos por jefe o «prototipo Pradera+Bosque». |
| **Nota (17 oct 2026, tarde)** | F6/F6b/F7a/F7b usan el modelo diorama (`mini3d.js`/`herom3d.js`), no el facetado. Escala: héroe ×.8 + zoom ×1,25. Open world = idea del dueño, prototipo propuesto (AGENTS.md, planificación punto 5). | — |
| **F9 · Corte** | `?2d=1` para el modo antiguo; retirar el 2D del mundo en un lote aparte. | Paridad confirmada por el dueño. |

## 7. Herramientas
- `node tools/r3d/org_capture.js salida.json [ids] [--compact]`: mallas de `ORG.U`.
- `tools/r3d/org3d_adapter.mjs`: mallas → geometría three.
- `python3 -I tools/r3d/shot_demo.py <página> <prefijo> noche,atardecer,dia` (con `python3 -m http.server 8811` en la raíz): capturas sin pantalla con SwiftShader y `RESULTADO: OK/FALLO`. Sus fps son de CPU y solo sirven para comparar.
- `python3 -I tools/r3d/oleo_check.py <prefijo> [horas] [K%]` (con el servidor en 8811): captura el JUEGO (`?r3d=1`) a cada hora e intensidad del óleo, con el tiempo congelado; lánzalo en segundo plano (~40 s por captura en SwiftShader).
- `python3 -I tools/r3d/perf_check.py [horas] [segundos]` (con el servidor en 8811): draw calls, triángulos y CPU de `R3D.frame()` por hora; **úsalo antes y después de cualquier cambio de rendimiento** (los fps de SwiftShader no valen, los triángulos y llamadas sí).
- `python3 -I tools/r3d/shot_at.py <png> <hora> <x> <y> [K] [rain|storm]`: captura el juego en un punto (px de mundo), hora y clima dados.
- `python3 -I tools/r3d/map_check.py <prefijo> [azimuts] [query]` (con el servidor en 8811): **Fase 47** — niebla, `S.fog`, alineación del minimapa con la cámara real a 6 acimutes y capturas del minimapa/mapa del mundo; `RESULTADO: OK/FALLO`.
- Medición: `renderer.info.render.calls` (con `autoReset=false` y `reset()` por fotograma, para sumar todos los pases) + panel F3 del juego.

> **Culturas (18 oct 2026):** todo el equipo de un tier es de la cultura de su bioma (`armorcult3d.js`, `weapons3d.js`; `GUIA_PERSONAJES_3D.md` §9).
> **Armaduras del jugador (18 oct 2026):** módulo `src/r3d/armor3d.js` + `armorInfo()` en `game.js` (`look.arm`); visor `docs/style-reference/r3d/armaduras-3d.html`. Detalle en `GUIA_PERSONAJES_3D.md` §8 y `AGENTS.md` «Lote R3D-ARMADURAS».

## 8. Rendimiento
- **Coste de la referencia:** ~1140 draw calls entre todos los pases (sombra de luna, sombra de la fogata con 6 caras, refracción y color). Casi todo son piezas sueltas con su casco; en el juego se fusiona lo estático por chunk y se instancia lo repetido.
- **Presupuesto de partida** **[medir en móvil]**: ≤ 150 draw calls por pase en la aldea, 4 luces puntuales (1 con sombra de 512), sombra principal de 2048 en escritorio y 1024 en móvil.
- **Calidad:**
  - **Alta:** todo.
  - **Media:** sin sombra de la fogata, pradera al 50 %, refracción a ½ resolución.
  - **Baja:** sin post, sin refracción, sin sombras (solo de contacto), pradera solo como color del suelo.
- `dpr ≤ 2`; congelar animaciones fuera de cámara.

- **Lecciones medidas (F3e):** (1) el pasto era el 74 % de los triángulos: un `InstancedMesh` con `frustumCulled=false` pinta TODO lo que tiene aunque no se vea → siempre dale `boundingSphere` y trocéalo (cuadrantes de ~8 tiles); (2) los LOD de instancias pueden COMPARTIR `instanceMatrix`/`instanceColor` entre dos mallas con geometría distinta; (3) llama a `dispose()` de las `InstancedMesh` al expulsar chunks (si no, los buffers de instancias se quedan en GPU); (4) construir chunks con presupuesto por TIEMPO (~5 ms) y no por número; (5) partículas = vertex shader + semilla fija + volumen envuelto (`mod`) alrededor del héroe: coste de CPU cero; (6) los shaders de post por píxel (niebla con fbm, Kuwahara) son lo primero que hay que bajar por calidad en móvil.

## 9. Riesgos
1. Lo caro son actores (F6–F7) e interiores y fachadas (F8). Con F1–F4 ya se juega en 3D: juzgar ahí.
2. Billboards con cámara giratoria: se ven aceptables, no perfectos, hasta F6–F7.
3. La pradera y la refracción son lo más pesado en móvil; la calidad Baja tiene que verse bien sola.
4. three r170 está fijo: si se actualiza, revisar las cadenas de `onBeforeCompile` (`#include <...>`).


## Agua D con física en el juego (Lote R3D-AGUA-IMPL, 19 oct 2026)
Implementada en `src/r3d/water3d.js` (ver AGENTS.md → «Lote R3D-AGUA-IMPL»). Estanques/lagos en calma, mar con oleaje Gerstner (`TER.seaAt`), ondas por simulación CPU leída en el fragmento, peces ambientales, flotador 3D y gotas. **Regla de sentido:** todo lo modelado se comprueba (escala frente al héroe, forma/orientación, física, estilo, captura real) — ver «Reglas» en AGENTS.md.

## Nota (19 oct 2026, Lote R3D-F44-0)
El mundo es ahora ×2 (`src/world-scale.js`). El terreno 3D admite cordilleras con relieve visual (`F.MTN`, malla suave `SM=3`, `matMtn`): la lógica solo ve alturas ≤2 (`HCLIFF`). Para capturas en cualquier punto: `tools/r3d/world_shot.py`. Ver `AGENTS.md` → «Lote R3D-F44-0».

## Nota (19 oct 2026, Lote R3D-F47 · Fase 47)
Minimapa y mapa del mundo rehechos: `src/worldmap.js` (`WMAP`) = un lienzo del mundo pintado por celdas de 16×16 tiles al revelarlas (niebla de guerra en `S.fog`), minimapa LOCAL circular girado con `R3D.az` (arriba del mapa = arriba de la pantalla, marca N) y mapa del mundo (tecla M). Para cualquier cosa anclada al mundo usa **`ISO.toCanvas(wx,wy,z)`** (gira con la cámara); `ISO.proj` no. Comprobación: `python3 -I tools/r3d/map_check.py <prefijo> [azimuts]` (en §7 de esta guía). Ver `AGENTS.md` → «Lote R3D-F47».

## Nota (19 oct 2026, Lote R3D-F49-PLAN)
**El mundo será un continente** con la Pradera de nexo (rejilla 3×3, costa irregular, fronteras que serpentean, cordilleras curvas con paso): `docs/PLAN_MUNDO_ABIERTO.md` §11 y boceto `docs/style-reference/continente_boceto.png`. Anula la «serpiente» 3×2 de las notas anteriores. Solo planificación; implementación = Fase 49.


## Nota (20 oct 2026, Lote R3D-F3-SUELO)
**Fase 3 · Suelo hecha en el terreno 3D:** playa con arena texturizada/orilla/lecho (`aSh` por vértice), pasto pisado junto a casas (`Terrain.bnear`, `Terrain.BLD`), roderas en caminos de tierra (`routeD`), pasarelas de madera (`deck`, necesita `TER.fields().DK`), y montañas con material de pared único sin acné de sombra. Detalle, perillas y huecos en el Lote R3D-F3-SUELO de AGENTS.md. `R3D.dbg.terr` expone el terreno.

## Nota (20 oct 2026, Lote R3D-F4-NATURALEZA)
**Fase 4 · Naturaleza oscura hecha:** `src/r3d/propsdark_nat3d.js` (módulo hermano de `propsdark3d.js`, mismo colector `B`) genera roca, piedra, arbusto, tocón, seta, tronco, huesos, charco y carpa con una fila de paleta/forma por bioma (`NAT[]`, 9 biomas, `o.bk`). La variedad por instancia (giro/escala) va en la matriz de instancia (`NAT_INST` en `props3d.js`): cero draw calls nuevos. Medición: `python3 -I tools/r3d/nat_sheet.py --medir`; hoja: `docs/style-reference/r3d/naturaleza-oscura.html`. `?nat=old` desactiva. Detalle y huecos en AGENTS.md.


---
## Nota Fase 5 (20 oct 2026) — Pradera/aldea en oscuro
Molino, iglesia (4 estilos) y 25 props de aldea/oficio/ruina viven en `src/r3d/propsdark_pradera3d.js` con el mismo lenguaje que `propsdark3d.js` (colector `B`, normales planas, color por vértice, `aEmit` 1 ventana / 2 fuego / 4 brasa de chimenea, volúmenes cerrados por el `toon` FrontSide). Variante por bioma con `o.bk` (tabla `ARQ`, 9 filas) y estilo de iglesia con `o.style`. Huellas dentro de ±22 % (`PR_FOOT`), puertas en `PR_DOOR`/`PR_DOORY` (leídas por `DoorGlow`). Hoja: `docs/style-reference/r3d/pradera-oscura.html`; `?pr=old` los quita. Detalle y huecos: AGENTS.md → «Lote R3D-F5».

## Nota (20 oct 2026, Lote R3D-MERGE-ESTETICA) — retoques estéticos fusionados
Día dorado (`goldDay()` en `materials3d.js`, `?gold=`), borde adoquín↔pasto fundido (`GROUND_COLOR`), tinte de grado por bioma (tabla `BT` en `r3d.js`, `?btint=`), minimapa al óleo (`muteMap()` en `worldmap.js`, `?mapmute=`) y rótulos «Lv» discretos (`game.js`). `?gold=0&btint=0&mapmute=0` reproduce lo anterior. Todo retoque de color del día debe pasar por `goldDay()`/`nr()`. Detalle y pendientes en AGENTS.md «Lote R3D-ESTETICA-1» y «Lote R3D-MERGE-ESTETICA».

> Nota (20 oct 2026): las estaciones de oficio (Fase 5b) están en `src/r3d/propsdark_estaciones3d.js`; los interiores 3D (Fase 15) deben pedirlas con `propGeo(n,{arch:k})`. Comprobar GLSL en plantillas JS sin acentos graves y `node --check` sobre copia `.mjs`.

## Nota (20 oct 2026, Lote R3D-F6) — PNJ de aldea
**Fase 6 hecha:** Guardia, Herrera y Anciano sabio (diseños aprobados de `outfits3d.js` `NPCS`) son actores 3D horneados en las 9 aldeas, con diálogo. Datos por fila en `src/npcs.js` (`VNPC`: ancla, distancia, texto), modelos en `NPC_DEF` de `src/r3d/actors3d.js`, colocación determinista sin colisión (`npcInit`). Visor: `docs/style-reference/r3d/actores-3d.html?grp=pnj`; capturas `pnj_fase6_*.jpg`. Estáticos, sin misiones; el diálogo es borrador y la túnica larga del Anciano (`Mini.DRESS_OK`) está por confirmar con el dueño. Detalle y pendientes: AGENTS.md → «Lote R3D-F6».
**Requisitos para generar muchos PNJ (20 oct 2026):** (1) el objeto en mano va con `F.hold` y, si el PNJ saluda, en la mano izquierda; yelmo cerrado ⇒ `hairFn(…,true)`; checklist y limitación abierta (lanza/bastón vistos de espalda) en AGENTS.md → «Lote R3D-F6». (2) **El dueño quiere que TODOS los PNJ de una aldea sean distintos en las aldeas de otros biomas** (modelo, nombre, cultura, diálogo; algunos solo en un bioma; Ru incluida) y varios por rol: hoy hay un modelo y una fila por rol; el diseño propuesto (`<rol>@<k>`, tabla de variantes por bioma, filas por bioma en `VNPC`) está en ese mismo lote.

