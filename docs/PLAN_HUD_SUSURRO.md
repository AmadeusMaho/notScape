# Plan · HUD «Susurro estilo WoW» al juego real (Fases 12–14)

> **ACTUALIZACIÓN (20 oct 2026, Lote R3D-HUD-AJUSTES-2):** H10 (solo `#dlg`, con cabeza 3D del PNJ hablando), H3 parcial (mochila 7×4 + rareza; falta pipeline 3D y cobre/plata/oro), H9 parcial (zonas ≥44 px). El retrato del jugador (E1) ya es 3D vivo. **H3 pipeline de iconos 3D HECHO el 20 oct 2026 (lote R3D-HUD-H3; falta cobertura de comida/pescado/runas/botín y dinero cobre/plata/oro).** Pendientes reales: ~~H3 iconos 3D~~, ~~H8 degradado del minimapa~~ (HECHO 20 oct, lote R3D-HUD-H8), H9 pulsación larga, H10 resto, H12. Detalle en AGENTS.md.
> **ESTADO DE EJECUCIÓN (20 oct 2026, RONDA 22 de AGENTS.md): HECHAS H0, H1 (parcial), H2, H4 (ligera), H5, H6, H7; barras = versión FINAL `hud-barras-final.html` (no la A). Pendientes: H3, H8, H9, H10, H11, H12. ¡Ojo! la resistencia se guarda en `S.sta`/`S.exh` (no `S.st`) y los valores de gasto son 8/s (no 20/s). El objeto global del HUD es `HUDSU`.**
> Estado original: **diseño CERRADO por el dueño (20 oct 2026, tras 16 rondas).** La demo viva y aprobada es `docs/style-reference/r3d/hud-susurro.html` (abrirla en el navegador; selector HUD = «Susurro estilo WoW»). Este documento convierte esa demo en trabajo para el juego. Historial de decisiones: `AGENTS.md`, lotes R3D-HUD-SUSURRO-2 / -3 (rondas 1–16). **El juego aún NO usa este HUD.**

## 0. Reglas de oro (no negociables, salen de lo que el dueño rechazó/aprobó)
1. **Nada de «IA minimalista» ni de «jugo»**: animaciones suaves, sobrias, sin destellos blancos ni burbujas/rayas. Las partículas son pocas, pequeñas y con desvanecimiento largo.
2. **Cristal + trazos dorados finos** (panel translúcido, esquinas doradas); NO marcos dorados gruesos, NO medallones, NO aro dorado en retratos, NO contornos dorados en barras.
3. **Esquinas redondeadas** en barras y tarjetas (.55em); retratos cuadrados redondeados (.8em).
4. **Objetos**: estilo ÚNICO «Pintura suave pulida» con color vivo, metales planos (sin textura realista en hojas), rareza = contorno + halo (SIN esquinas). «Sprite 3D» descartado.
5. **Nada que cambie en hover puede entrar en el layout** de la rejilla (bug de la ronda 16).
6. **Guardar/Cargar archivo solo en Opciones**, nunca en otras pestañas.
7. Texto de UI en **español**; fuentes Cinzel (títulos/rótulos) + Spectral (texto).

## 1. Qué hay que construir (lista exacta, con la demo como especificación)
| # | Elemento | Qué muestra | Datos del juego | Notas de la demo |
|---|---|---|---|---|
| E1 | **Marco del jugador** (abajo-centro, ancho 14.8em) | retrato + insignia de **nivel total** + nombre + barra de vida + barra de maná (mismo tamaño) + fila de buffs | `maxHp()`, vida actual, `mnMax()`, maná actual, suma de `L(sk)` de las 12 skills | retrato = busto renderizado con el equipo REAL |
| E2 | **Marco del objetivo** (arriba-centro, misma columna) | retrato del enemigo + nombre + nivel + barra roja + % | enemigo fijado por `auto-objetivo`/clic | oculto sin objetivo; estela clara de daño reciente |
| E3 | **Avisos de XP** (columna del jugador, sobre el marco) | tarjetas: skill, `+N XP`, barra al siguiente nivel; máx. 3; 3,5 s | `gain(sk,xp)` | vidrio, sin filete dorado |
| E4 | **Banner «¡NIVEL N!»** | centrado en pantalla, 3 s, líneas doradas | subida de nivel en `gain()` | también +1 al nivel total |
| E5 | **Buffs/debuffs** | iconos cuadrados con arte 3D, temporizador, tooltip; debuff = borde rojo | `S.buf` (xp, dmg, spd…), estados (sangrado, quemadura…) | fondo claro/cálido translúcido |
| E6 | **Barras animadas** | vida = respiración + partículas lima; maná = energía arcana (nubes cian/violeta + 2 filamentos) + partículas; jefe = ámbar | — | un solo `requestAnimationFrame`, canvas por barra |
| E7 | **Rueda de resistencia** (junto al héroe) | aro que se vacía al correr | **NUEVA** (`S.st`, `S.exh`); hoy `S.run` es solo un interruptor | decisión D1 aprobada |
| E8 | **Minimapa** | el ORIGINAL de Susurro (círculo con máscara suave, «N» en texto) + etiqueta de zona/hora | `drawMap()` en `src/game.js` (`MM=1` minimapa local girado con la cámara; `MM=2` mapa del mundo) y `src/worldmap.js` | no el marco medieval; la «N» va en texto |
| E9 | **Misión** (arriba-izquierda) | objetivo principal, siguiente, jefes | `#goalp` / `quests.js` | |
| E10 | **Registro** (abajo-izquierda) | 2 líneas con filete dorado | `log()` | |
| E11 | **Menú lateral suelto** (derecha, iconos sueltos sin contorno) | Mochila · Personaje · Habilidades · Misiones · Logros · Colección · Magia · **Opciones** (engranaje, nueva) | `tab()` / `tabClick()` | sin Oración (decisión del dueño) |
| E12 | **Mochila** (cristal) | rejilla 7×4, objetos 3D con rareza, **monedas cobre/plata/oro**, cantidad | `S.inv`, `S.coins` | hover = modelo 3D vivo que crece y oscila |
| E13 | **Opciones** (panel nuevo) | Partida (guardar/cargar archivo, autoguardado) · Sonido · Interfaz (viñeta, guía del héroe, números de daño) · Gráficos (`tilt/cloud/wind`) · Reiniciar con confirmación | `exportSave/importSave`, `S.mute`, perillas R3D | |
| E14 | **Barra de 6 habilidades** | teclas 1–6, coste de maná, reutilización con barrido, GCD 1 s | **NO existe** (depende de R6·3) | OCULTA en la demo; el código está listo |

## 2. Contratos de datos (se hacen primero; el resto cuelga de ellos)
- **`ART` por objeto** (tabla, no `if`s): `{modelo, opciones, rareza}`; la rareza sale de un campo `rar` (`c/u/r/e/l`) del objeto, con colores comunes `#a39d8f`, poco común `#6fb35a`, raro `#4f92dd`, épico `#b074e8`, legendario `#f0a93c`.
- **Monedas**: `S.coins` pasa a ser SIEMPRE un entero en cobre; 100 cobre = 1 plata, 100 plata = 1 oro (`money(n)` → `{au,ag,cu}`; ver P0 en AGENTS.md). Toda tienda/venta usa `money()`.
- **Nivel total** = suma de `L(sk)` de las 12 skills (máx. 1188). Función única `totalLevel()`.
- **Eventos**: `emit('xp',{sk,amt,lvl,frac,up})`, `emit('hp'|'mp',v)`, `emit('buff',lista)`, `emit('target',mob|null)`, `emit('equip')`. El HUD se SUSCRIBE; la lógica de juego no toca el DOM del HUD.
- **Retratos**: `portrait(entidad)` reutiliza `hero3d.js` / `outfits3d.js` / `armor3d.js` / `weapons3d.js` y el pipeline `__icon` (ver §4-H3) con cámara de busto; se vuelve a renderizar solo en `emit('equip')` (no por fotograma).

## 2b. Ganchos REALES del código (verificados el 20 oct 2026; usar estos nombres)
`src/game.js`: `gain(sk,xp,sil)` (XP; aplica `S.buf.xp`), `L(sk)` (nivel de una skill), `maxHp()`, `mnMax()`, `S.buf` (buffs por clave con caducidad `Date.now()`), `tab(t)` / `tabClick(t)` / `panel()` (pestañas: `inv ch sk qm q col pr mg`), `exportSave()` / `importSave()`, `tgRun()` / `tgAuto()` y `#runb/#autob`, `log()`, `drawMap()` (minimapa), `S.mute`. UI actual: `index.html` (`#hud #topl #botl #side #pw #pn #tabs #dlg`) + `css/style.css`. 3D: `src/r3d/hero3d.js`, `outfits3d.js`, `armor3d.js`, `weapons3d.js`, `preview3d.js`. La pestaña `pr` (Oración) NO entra en el HUD nuevo.

## 2c. Barras de vida/maná/jefe: variante PENDIENTE (R3D-HUD-BARRAS, 20 oct 2026)
El dueño aprobó todo el HUD salvo el aspecto de las barras. La demo tiene el selector **«Barras»** con 3 propuestas (`0` actual · `a` Cristal líquido, recomendada · `b` Pintura · `c` Fina con icono); detalle en `AGENTS.md` (RONDA 17). **CERRADO (RONDA 20, 20 oct 2026): el dueño eligió la versión FINAL `docs/style-reference/r3d/hud-barras-final.html` (Biselada compacta + buffs en fichas con anillo de tiempo + transparencia de «Hilo»), que SUSTITUYE a la A en H2/H6; ver `AGENTS.md` RONDA 20.** (Historial: la A quedó descartada en la RONDA 18.) Hay 4 variantes nuevas en el selector (D Celdas · E Hilo · F Pincelada · G Vidrio teñido; ver `AGENTS.md` RONDA 18 y `hud_barras_comparativa2.png`). **H2 NO porta ninguna barra hasta que el dueño elija**; entonces porta solo esa y borra el selector y el resto de variantes.

## 3. Fases, en orden (cada una deja el juego jugable y se verifica con capturas)
**H0 · Base y tokens (S)** — `css/hud-susurro.css` con variables (cristal, dorado, rareza, radios, sombras), fuentes, escala por contenedor (`cqw`, como la demo) y utilidades. *Aceptación:* nada visible cambia aún; el CSS no rompe el HUD actual.
**H1 · Estructura y layout (M)** — contenedores fijos (jugador abajo-centro, objetivo arriba-centro, misión arriba-izq., minimapa arriba-der., registro abajo-izq., menú lateral der.), sin tocar la lógica; el canvas sigue a pantalla completa (ya hecho, pasos 1–2 del plan de pantalla completa). Retirar `#topl/#botl/#ctl` viejos SOLO cuando el nuevo esté completo (interruptor `?hud=old` para volver atrás durante la transición). *Aceptación:* capturas 1280×720, 1920×1080, 844×390.
**H2 · Marcos de jugador y objetivo + barras (M)** — E1, E2, E6. Barras con el `barFx` de la demo (canvas por barra, un solo rAF, pausa con pestaña oculta). Estela de daño. Vida <30 %: respiración más rápida. *Aceptación:* sin saltos de layout al cambiar el máximo; 60 fps con 3 barras en el equipo del dueño.
**H3 · Pipeline de iconos 3D + mochila (L)** — mover el pipeline de la demo (`prep/stylize/__icon`, entorno PMREM propio; solo estilo A) a `src/r3d/icons3d.js`, usando los modelos reales de `weapons3d.js/armor3d.js/props3d.js` en vez de los `MOD` de la demo (la demo tiene modelos de muestra). Caché de dataURL por `(modelo, opciones, rareza, tamaño)`; **un único `WebGLRenderer`** compartido; hover vivo que crea el modelo al entrar y libera geometrías/materiales al salir (`renderLists.dispose()`). *Aceptación:* 0 cambios de `getBoundingClientRect` en las celdas al hover (test automático de la demo `hov5.py`), memoria estable tras 200 hovers.
**H4 · Menú lateral, pestañas y Opciones (M)** — E11, E13; reorganizar el panel `#side` (`tab()` no cambia). Quitar Guardar/Cargar de TODAS las pestañas y del `#pw` actual. Atajos I/P/K/Q/L/C/Z + Esc.
**H5 · Avisos (S)** — E3, E4 conectados a `gain()`; pila de 3; accesibilidad: `aria-live="polite"`, sin depender del color.
**H6 · Buffs (S)** — E5 desde `S.buf` y estados; temporizadores reales (no simulados); tooltip con texto del juego.
**H7 · Resistencia (M, D1 aprobada)** — E7 + regla de juego (estado, guardado, bloqueo de correr, rueda, ajuste de viaje). Puede ir justo tras H2 porque la rueda comparte capa con el marco del jugador.
**H8 · Minimapa (S)** — el estilo original de Susurro (círculo con máscara suave, sin marco) aplicado a `drawMap()`/`worldmap.js` (`MM=1`); mantener `MM=2` (mapa grande) con el mismo lenguaje; etiqueta zona/hora debajo. (`src/r3d/mini3d.js` NO es el minimapa: es la librería de figuras pequeñas.)
**H9 · Móvil/táctil (M)** — zonas ≥44 px, el hover vivo se sustituye por mantener pulsado (o toque largo), paneles como hojas inferiores, `safe-area`. *Aceptación:* captura 844×390.
**H10 · Diálogos, cartas del camino, carga y editor (Fase 14, M)** — mismo lenguaje (cristal + trazo dorado); `#dlg` primero.
**H11 · Barra de 6 habilidades (L, BLOQUEADA)** — E14 espera a R6·3 (habilidades del combate nuevo). Reservar el espacio centrado inferior (la demo lo deja libre) y no mover el marco del jugador cuando entre.
**H12 · Cierre (S)** — retirar `?hud=old`, borrar CSS/JS muertos, actualizar `AGENTS.md`, `docs/HISTORIAL.md`, capturas finales.

## 4. Pruebas y herramientas
- **`tools/r3d/hud_demo/build.py`** construye la demo desde su fuente; **`tools/r3d/hud_demo/check.py`** la prueba (Chromium sin pantalla): rejilla estable al hover, 0 errores JS, capturas `main/wow/opt/eq_*.png`. Ver `docs/style-reference/r3d/README_HUD_DEMO.md`.
- Para el juego real faltan: captura por resolución (1280×720, 1920×1080, 844×390) y test de memoria de hover (200 hovers).
- Verificación visual obligatoria por fase (capturas) + `node --check` sobre COPIAS `.mjs` (el `--check` sobre `.js` da falsos «ok»).
- SwiftShader NO sirve para medir fps: el dueño debe medir en su GPU y en móvil.

## 5. Riesgos conocidos
- **Rendimiento**: canvas de barras + hover 3D + renderer compartido; mitigación: un rAF, pausa en pestaña oculta, caché de iconos, límite de partículas (≤11/barra).
- **Retratos**: dependen de que el equipo real tenga malla en `armor3d/outfits3d`; si falta alguna pieza, mostrar el busto base y registrar el hueco.
- **Versión de three**: la demo publicada usa r128 y se probó en r170 (`PI`-factor de luces, `envMap` por material); el juego usa `vendor/three` → verificar iluminación de iconos tras portar.
- **Gotcha de código**: `g.add(mesh(...)).rotation/scale` afecta al GRUPO, no al mesh (causó 2 bugs).
- **Clics que atraviesan paneles** y `#dlg` sobre el canvas (`pointer-events`).
- **Tilt-shift/`?tilt`** del 3D puede desenfocar el HUD si se dibuja dentro del canvas: el HUD vive en DOM, no en el pase `grade`.

## 6. Decisiones del dueño (20 oct 2026, cerradas)
- **D1 · Resistencia al correr: SÍ se añade.** Es mecánica nueva (hoy `S.run` es solo un interruptor): estado `S.st` (0–100) y `S.exh`; correr gasta 20/s, tras dejar de correr hay 0,9 s de pausa y regenera 28/s (14/s si está agotado, hasta recuperar el 40 %); agotado = no se puede correr. Valores de partida tomados de la demo (ajustables en balance). Tareas: añadir el estado al guardado (migración `ver`), bloquear `tgRun()` cuando `exh`, rueda junto al héroe (verde → amarillo <35 % → naranja <15 % → parpadeo rojo al agotarse), y revisar que viajar en mundo abierto (`PLAN_MUNDO_ABIERTO.md`) no sea frustrante: correr debe seguir siendo viable por tramos largos. Mejoras de skills/equipo podrán modificar gasto y regeneración (gancho `stMax()/stReg()`).
- **D2 · Habilidades: SÍ, los valores de la demo valen como punto de partida** (golpe poderoso 3 s; disparo 2 s; bola de fuego 6 s/12 maná; rayo arcano 4 s/8 maná; curación 10 s/10 maná; guardia 8 s; GCD 1 s). Se ajustan cuando se implemente el combate nuevo (R6·3); la barra sigue oculta hasta entonces (H11).
- **D3 · Estilo de objetos: solo «Pintura suave pulida».** «Sprite 3D» se DESCARTA: no portar `sprite()`, `ISTYLE='S'` ni el CSS `image-rendering:pixelated`; el selector de estilo desaparece.
- **D4 · Barra de vida SIEMPRE verde** (jugador); roja solo para el enemigo/jefe. No hay opción de barra roja del jugador: no portar `data-bar=red` ni su selector.
- **D5 · Fallo de `iso_test` (1/1955): anotado**, sin investigar todavía; revisar antes del cierre H12 (queda como tarea de H12).

## 7. Orden recomendado y esfuerzo
H0 → H1 → H2 → H3 → H4 (núcleo, ~2 sesiones largas) → H5/H6/H8 (rápidas) → H9 → H10 → H7/H11 cuando se decidan D1/R6·3 → H12. Primera entrega visible al dueño: **H0–H2 (marcos y barras en el juego real)** para validar el rendimiento cuanto antes.
