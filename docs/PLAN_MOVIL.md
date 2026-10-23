# PLAN · Que todo funcione y se vea bien en MÓVIL (PLANIFICADO el 22 oct 2026; nada implementado)

> Pedido del dueño (22 oct 2026): «deja planificado modificar los sistemas para que funcionen y se vean bien en móvil». Parte de lo que ya existe (H9 táctil parcial, `touch.js`, `MOBQ` = calidad Baja en `pointer:coarse`, arrastre táctil por pulsación en `dragdrop.js`) y de los sistemas nuevos de oficios (`workui.js`, `winmove.js`). **La prioridad 1 sigue siendo el rendimiento (`REGLAS_CREACION.md` §P): nada de esto puede empeorarlo.**

## 0 · Objetivos y criterios de aceptación
- **Pantallas objetivo:** horizontal **844×390** (principal), **390×844** vertical (secundaria, solo menús y oficios sin prisa), tablet 1024×768. Probar también 667×375 (móvil pequeño).
- **Jugable sin teclado ni ratón:** toda acción que hoy va en tecla (1–0, Esc, Q bloquear, V saltar, Tab, E interactuar…) tiene botón o gesto.
- **Blancos táctiles ≥ 44 px**, texto ≥ 14 px efectivos, nada tapado por el notch o las barras (`safe-area-inset-*`), nada que dependa de hover.
- **Rendimiento:** ≥ 30 fps sostenidos en un móvil de gama media en calidad Baja (el vigilante `R3D.budget()` no salta); la UI DOM no provoca tirones.
- **Aceptación:** la lista de comprobación del §5 pasada en el dispositivo real del dueño y en emulación (`resize_window` móvil, 844×390 y 390×844).

## 1 · Inventario de sistemas a adaptar y solución propuesta
| Sistema | Problema en móvil | Solución |
|---|---|---|
| **Hoja de trabajo** (`#wk`, 34 acciones) | Ocupa ~⅓ de la pantalla; no hay teclas 1–0; rejilla pequeña; tapa al personaje. | **Hoja inferior** (bottom sheet) en horizontal: barras Avance/Calidad arriba y **barra de 10 casillas grandes** abajo; la rejilla completa en un «libro» que se despliega deslizando hacia arriba; modo compacto con grupos plegados; el personaje y el yunque quedan visibles en la mitad superior (el zoom `MG_ZOOM_WK` se recalcula para centrar la estación en el área libre). Botones «Sugerir» y «Salir» grandes. |
| **Ventanas arrastrables** (`winmove.js`) | Arrastrar con el dedo choca con el scroll y es incómodo. | En táctil **no se arrastran**: todas pasan a hojas con asa para cerrar (deslizar abajo) y botón ✕ ≥ 44 px. `WINMOVE` se desactiva con `body.touch` (o solo permite arrastrar desde la barra de título). |
| **Menú lateral y paneles** (`#side`, `#pw`, `#sw`, `#bw`, banco, tienda) | Los paneles anchos se salen; `#bw` (mochila flotante) puede quedar fuera. | Componente **«hoja»** común: con `body.touch`, `#pw/#sw/#bw` ocupan ancho completo o la mitad en horizontal, con scroll interno; la mochila va como pestaña dentro de Personaje (sin ventana flotante); iconos del menú ≥ 44 px. |
| **Arrastrar y soltar** (`dragdrop.js`) | Ya hay pulsación de 220 ms, pero el fantasma tapa el dedo y las zonas son pequeñas. | Fantasma desplazado hacia arriba del dedo, zonas de soltar ampliadas; alternativa de **dos toques** («tocar objeto → tocar destino») y botón «equipar/guardar» en la ficha del objeto. |
| **Tooltips** (hover) | No existe hover. | Pulsación larga (`touch.js`) → ficha fija con botones; ya en H9, extender a las acciones de oficio (nombre, coste y efecto). |
| **Combate** | Sin bloquear (clic derecho), sin Tab, sin esquiva/salto por teclado, retícula de arco con ratón. | Joystick virtual (izquierda) o toque para moverse; botones de **atacar (mantener = cargar), bloquear (mantener), esquivar, saltar** (derecha, ≥ 56 px); **fijar objetivo** tocando al enemigo; apuntar con arrastre del dedo en armas a distancia; habilidades de la barra como botones. Coincide con la Fase 2·a «33 táctil de combate». |
| **Recolección** (rueda, pesca) | Clic/E; la rueda es pequeña. | Un toque cualquiera golpea; rueda ×1,3 en táctil; pesca: toque para clavar y toques/arrastre para recoger. Habilidades de recolección como botones (≤ 8). |
| **Cámara** | Botón central del ratón para girar; rueda para el zoom. | **Dos dedos**: girar y pellizcar para zoom; el enfoque de minijuegos (`mgK`) respeta el área libre de la hoja. |
| **HUD y marcos** | El marco del jugador y el minimapa tapan la acción; `ctxHint` habla de teclas. | Escala del HUD en táctil (`--hu` menor), minimapa más pequeño que se amplía al tocar; **las ayudas dicen «Toca»** en vez de teclas (`ctxHint` con variante táctil). |
| **Diálogos y misiones** | Opciones por teclas 1/2. | Botones grandes; panel de misión casi a pantalla completa con scroll. |
| **Cinemáticas y avisos** | Letras y barras de aspecto cinematográfico. | Revisar `#cine`, banners y rótulos a 844×390 para que no se salga ningún texto. |
| **Zoom y mundo** | El zoom mínimo por defecto queda lejos. | Zoom inicial más cercano en móvil y límites propios. |
| **Rendimiento** | Gama media. | `MOBQ` (Baja + resolución ×,55) ya existe; valorar FSR activado por defecto en móvil si mide bien (en escritorio está apagado por decisión del dueño); vigilar `R3D.budget()`, no crear contextos WebGL nuevos, tope de partículas más bajo en táctil (`R3D.fx`). |
| **Háptica y orientación** | — | `navigator.vibrate` breve en golpe perfecto/pieza terminada (opcional, ajustable); sugerir horizontal y pantalla completa sin bloquearla. |

## 2 · Infraestructura común (hacer primero)
1. **Detección:** `body.touch` por `pointer:coarse` (+ `any-pointer`), `body.land/port` por orientación; una sola función `isTouch()`.
2. **Unidades y áreas seguras:** `dvh/svh`, `env(safe-area-inset-*)` en todos los `position:fixed`; `--hu` por ancho de pantalla.
3. **Componente «hoja» (`.sheet`)** reutilizable (borde dorado fino, asa, ✕, scroll interno) con reglas de posición por orientación; todas las ventanas nuevas lo usan.
4. **Capa de gestos** (un solo `touch.js` ampliado): toque, pulsación larga, arrastre y dos dedos (girar/zoom) sin chocar con `dragdrop.js` ni `winmove.js`.
5. **Variante táctil de las ayudas** (`K_()` → «Toca»).

## 3 · Regla para TODO sistema nuevo (añadir a `REGLAS_CREACION.md` al empezar)
Cada interfaz o control nuevo declara su **comportamiento táctil** desde el diseño: botón ≥ 44 px, sin hover obligatorio, sin tecla exclusiva, probado a 844×390 con `resize_window` móvil, sin ventana arrastrable en táctil y con la variante «Toca» en sus ayudas. `rules_check.py` podría vigilar `:hover` sin `@media (hover:hover)` y los blancos pequeños (revisión estática).

## 4 · Fases de trabajo (lotes cortos; un entregable por mensaje)
- **M0 · Auditoría en emulación:** capturas de cada pantalla (juego, inventario, personaje, oficios, banco, tienda, misiones, diálogo, hoja de trabajo, minijuegos, cinemáticas) a 844×390 y 390×844 con el navegador integrado; lista priorizada de roturas. Sin cambios de código.
- **M1 · Infraestructura** (§2) + HUD y menú en hojas. Comprobar que escritorio no cambia.
- **M2 · Oficios en móvil:** hoja de trabajo como hoja inferior, barra de 10 casillas grandes, libro de acciones, ficha con pulsación larga, zoom compensado.
- **M3 · Controles de juego:** joystick/toque, botones de combate (Fase 2·a «33»), cámara a dos dedos, recolección y pesca por toque.
- **M4 · Resto de ventanas** (banco, tienda, misiones, diálogos, opciones) y `winmove` desactivado en táctil.
- **M5 · Rendimiento móvil:** medir en el dispositivo real (`R3D.stats()`, F4), ajustar `MOBQ`, FSR, partículas y carga.
- **M6 · Pulido y cierre:** háptica, textos «Toca», comprobación del §0 en el dispositivo del dueño; actualizar `AGENTS.md` y `HOJA_DE_RUTA.md`.
**Orden con el resto:** M0–M1 se pueden hacer ya (no dependen de nada); M2 sigue a cada oficio nuevo (cada uno nace con su variante táctil); M3 coincide con la Fase 2·a; M5 necesita el móvil real.

## 5 · Lista de comprobación (cada pantalla)
Cabe sin scroll horizontal · blancos ≥ 44 px · sin hover obligatorio · se cierra con ✕ o deslizando · no tapa al personaje · legible a plena luz (contraste) · textos «Toca» · 30 fps · sin tirones al abrir paneles · funciona al girar el móvil.

## 6 · Decisiones abiertas ★
1. ¿Móvil **solo horizontal** o también jugable en vertical? (propuesta: horizontal jugable, vertical solo menús).
2. ¿Joystick virtual o **toque para moverse**, o ambos a elegir en Opciones?
3. ¿FSR **activado por defecto en móvil**? (hoy apagado en escritorio por decisión del dueño).
4. ¿Se incluye la háptica?
5. ¿Distribución como web normal o **PWA instalable** (pantalla completa, sin barra del navegador)?
