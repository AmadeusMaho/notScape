# NotScape — guía para modelos y colaboradores (estilo isométrico pintado «cozy»)

RPG idle estilo OSRS, en español, juego de navegador. Autor: un solo dev que alterna entre varios modelos; **este archivo es la memoria compartida**. Léelo entero antes de tocar nada y actualiza «Estado» al terminar tu parte.

> Este archivo **reemplaza por completo** la guía anterior (migración a pixel art cenital con Phaser). Ese plan queda cancelado. El nuevo rumbo es el de `docs/GUIA_ESTILO_ISOMETRICO.md`.

## Orden de lectura
1. `docs/GUIA_ESTILO_ISOMETRICO.md` — **manda en lo visual** (proyección 2:1, paleta, formas, técnica de pincel, catálogo, fases, diorama, jefes).
2. `INVENTARIO.md` — estado real del juego (canvas, mundo, biomas, entidades, preguntas abiertas).
3. `docs/style-reference/notscape-diorama.html` — referencia de **colores y técnica de pincel** (sus formas NO están aprobadas).
4. `docs/style-reference/notscape-cenital.html` — referencia de la **forma de los objetos** (`blobz`/`bp`), no de la vista.
5. Este archivo — **manda en lo técnico**.

## Decisiones ya tomadas por el dueño
- 2D con proyección isométrica 2:1. Nada de 3D ni Three.js, **nada de Phaser**.
- La lógica no cambia: el mundo sigue plano (rectángulos en px de mundo); la isometría solo se aplica al dibujar y, a la inversa, al convertir clics.
- Formato **diorama por bioma** (bloques flotantes con corte de tierra) con pasarelas y transición suave entre biomas. Bloqueos visuales por jefe (guía §12).
- Todo el arte se genera por código; sin arte pintado a mano.
- **Respuestas del dueño a las preguntas de `INVENTARIO.md` §10 (11 oct 2026):**
  1. *Canvas:* a criterio del agente, priorizando que se vea atractivo → **responsivo con `devicePixelRatio` máx. 2** (`ISO.resize`). El canvas deja de ser 640×400 fijo.
  2. *Escala:* `ISO.TILE = 32` px de mundo por tile, y el dueño quiere **una escala visual mayor que la del cenital** → `ISO.V.zoom` (hoy 1,6; un solo número para ajustarlo).
  3. *Movimiento:* **8 direcciones**, teclas en ejes de pantalla (`ISO.keyDir`). Sigue siendo analógico en px de mundo.
  4. *Biomas:* se conservan los 5 actuales y se **seguirán añadiendo biomas**. **No hay layout repetido**: cada bioma tendrá su propia aldea con **arquitectura propia de su región**. Esto reemplaza la plantilla `x0 + offset` repetida de hoy (ver «Diseño por bioma» abajo).
  5. *Jefes:* los actuales (Gruk, Fenrir, Rey Ciénaga, Yeti Milenario, Señor del Fuego) son **placeholders**; el dueño inventará la historia después. Los nombres de la guía §12 no mandan.
  6. *Tiers:* se conservan los 6 actuales (cuero, bronce, hierro, acero, mitril, adamantita) pero el dueño quiere **muchos más**: el sistema de tiers debe ser **datos extensibles** (tabla de colores principal/luz, sombra calculada), nunca `if` por tier.
  7. *Minimapa:* a criterio del agente → **cenital** (plano, se lee mejor y es barato).
  8. *Modo antiguo:* **se descarta**. No hay `?old` ni `?iso`; solo existe el diseño isométrico. **No hay que mantener partidas guardadas** (se puede subir `S.ver` y reiniciar sin migrar).
- **Las formas poligonales/«raras» de la guía están pendientes de revisión con el dueño.** Hasta entonces, no inventes formas finales: usa rombos de color plano (F1) y deja la forma tras un único helper `soft` fácil de cambiar.

## Estructura del repo
- `index.html`, `css/style.css` — shell HTML y paneles (no se tocan salvo el canvas).
- `src/game.js` — lógica, guardado, audio y dibujo mezclados (822 líneas). Globales: `S` estado, `P` jugador, `N/M/ST` entidades, `cx/cy` cámara, `curB` bioma, `BI` biomas, `BW=2300`, `WW=11500`, `WH=1500`, `W=640`, `H=400`.
- `src/ground.js`, `roads.js`, `water.js`, `village.js`, `stations.js`, `characters.js`, `sprites.js`, `phaser-world.js` — **BORRADOS en F1-B** (plan cenital descartado). Ya no existen `GR/RD/WT/VG/SX/CH/SP`; ver «Código provisional».
- `src/iso.js` — **(nuevo, F1-A, HECHO)** módulo `ISO`: solo matemáticas, sin DOM ni dibujo. API: `proj/unproj` (mundo↔pantalla lógica con altura z), `resize` (vista responsiva + dpr), `follow/snap` (cámara suavizada y redondeada al píxel real), `toCanvas/toWorld` (mundo↔px del canvas; `toWorld` resuelve la altura con `hz(x,y)` y elige el candidato más cercano a la cámara junto a acantilados), `tileAt`, `depth/tileOrder/sortDepth` (orden de dibujo), `keyDir` (8 direcciones en ejes de pantalla), `occludes`, `diamond`. Constantes: `TILE=32`, rombo 56×28 (`HW=28`, `HH=14`), `LV=22` px por nivel, zoom `V.zoom=1.6`.
- `src/world-iso.js` — **(nuevo, F1-B)** `TER`: terreno **provisional** de rombos planos con 3 alturas (agua .75, suelo 1, acantilado 2) y compuertas de jefe. API: `heightAt(x,y)`, `tileH`, `draw(ctx,t)`, `gate(ctx,k,abierta,t)`, `PAL` (paleta por bioma de la guía §3, datos), `PAPER`. La altura sale de `BLK` (agua), de la frontera de biomas y del borde del mundo; **no afecta a la colisión** (`blk()` sigue igual).
- `tools/iso_test.js` — prueba sin navegador de `iso.js` (`node tools/iso_test.js` debe acabar en `RESULTADO: OK`).
- `tools/iso_check.py` — **(nuevo, F1-B)** Playwright: errores de consola, colisiones (`blk`), ida y vuelta de clics, tecla arriba, ms por `draw()` y 5 capturas en `capturas/` (o la carpeta que le pases). Debe acabar en `RESULTADO: OK`.
- `tools/build_single.py` — junta todo en un HTML único (`dist/notscape.html`); actualizado para módulos con guion (`world-iso.js`).

## Reglas
- **No cambiar lógica de juego, guardado (`localStorage` `tdo2`, `S.ver=10`) ni colisiones.** Las colisiones siguen en px de mundo (`blk`, `BLK`, `PD`, `ZS`, `cliff`).
- **Trabaja en segmentos pequeños** (petición del dueño: se queda sin tokens en prompts largos). Un entregable por mensaje; cierra con qué probar a mano.
- Una rama por fase (`iso-f1-nucleo`, …) y PR a `main`; el dueño prueba en el navegador y mezcla.
- Un cambio por vez; tras cada uno comprobar que el guardado carga (con y sin partida).
- Textos del juego en español. Contorno `#5b3a29` (nunca negro puro), papel `#fdf9e3`.
- Si dudas entre dos aspectos, entrega ambos en capturas; **el gusto lo decide el dueño**.
- Cada fase termina con capturas y visto bueno del dueño antes de pasar a la siguiente.
- Preguntas que se plantean al dueño, no se resuelven solas: canvas fijo o responsivo, movimiento y teclas, biomas, tiers, minimapa (ver `INVENTARIO.md` §10).

## Trampas técnicas heredadas (siguen vigentes)
- No uses `rnd()` ni `R()` del juego para arte: `rnd` está sembrado (`seed=7`) y el layout depende de su secuencia; `R` usa `Math.random`. El arte usa **hash por tile** (x, y, bioma, capa).
- `ctx` en `game.js` es `let`: no guardes referencias a `ctx` entre frames. Al final de `draw()` el contexto queda con la transformación del HUD (`cv.width/W`); el HUD se dibuja en unidades de 640×400.
- Los sprites cenitales antiguos se dibujan con `spr(x,y,lift,fn)`: transforma `ctx` para que los pies queden en la posición isométrica (escala `SPR=1.5`). El texto dentro de `spr` usa `TXS=.5` para no salir gigante. **No añadas lógica nueva que dependa de `bk`/`BAKE`** (la panadería de sprites ya no existe).
- `S.boss` es un **objeto**: `S.boss[i]=1` abre la puerta del bioma `i+1`; mientras no esté abierta `blk()` bloquea `x>=BW`. Un test de colisiones en biomas 1–4 sale «mal» sin que haya bug.
- `panel()` reconstruye el `innerHTML` completo con `dirty=1`; no añadas `dirty=1` en eventos frecuentes (usar `skLive`).
- Nada de filtros por frame (`ctx.filter`, copiar el canvas sobre sí mismo). No crear canvases de 11500 px.

## Pruebas (lo que sí se puede verificar desde un chat)
- Sintaxis: `for f in src/*.js; do node --check $f; done`.
- Matemáticas isométricas: `node tools/iso_test.js` → `RESULTADO: OK`.
- Navegador sin pantalla: `python3 tools/iso_check.py` (Playwright + Chromium disponibles en el sandbox) → `RESULTADO: OK`; mira siempre las capturas que guarda.
- Aspecto y fluidez **no se verifican desde el chat**: dile siempre al dueño qué probar a mano.
- No uses `pkill -f http.server`; cierra el servidor por PID.

## Diseño por bioma (decisión del dueño, aplica desde F2/F3)
Cada bioma es **único**: aldea propia con arquitectura de su región, distribución propia de zonas de tala/minería/pesca, guarida y estaciones. Hoy `game.js` genera los 5 con la misma plantilla (`x0 + dx`); eso se sustituye por **datos por bioma** (un objeto `BIOME[k]` con aldea, zonas, estaciones y recursos). Nuevos biomas = nuevo objeto de datos, sin tocar código de dibujo. La arquitectura de cada aldea la propondrá el agente en capturas y la decide el dueño.

## Plan (resumen; detalle en la guía §7, §11, §12)
- [x] **F0 · Inventario** — `INVENTARIO.md` entregado y respondido por el dueño (ver «Decisiones»).
- [~] **F1 · Núcleo isométrico** — en segmentos pequeños:
  - [x] **F1-A** — `src/iso.js` + `tools/iso_test.js` (matemáticas, probadas).
  - [x] **F1-B** — HECHO: módulos cenitales y `?old` borrados; canvas responsivo (`fitCv` + `ISO.resize`); terreno de rombos planos con 3 alturas (`TER`); entidades antiguas como marcadores en su posición isométrica (`spr`); teclas con `ISO.keyDir`; clics con `ISO.toWorld`; `tools/iso_check.py`. *Pendiente de que el dueño lo pruebe a mano.*
  - [~] **F1-C** — en micro-pasos (un entregable por mensaje):
    - [x] **F1-C1** — cursor de tile (rombo suave bajo el puntero, rojo si `blk()` bloquea ese tile). HECHO; *pendiente de que el dueño lo pruebe a mano.*
    - [ ] **F1-C2** — oclusión al 50 % de objetos altos sobre el jugador (`ISO.occludes`).
    - [ ] **F1-C3** — comprobar a mano escenas junto a un acantilado (clics y altura).
    - [ ] **F1-C4** — afinar cámara y zoom (`ISO.V.zoom`, `SPR`) con el dueño.
  *Hecho cuando:* el jugador camina por el mapa de prueba, los clics caen en el tile correcto a cualquier altura y las colisiones se comportan igual.
- [ ] **F2 · Estilo y terreno** — `STYLE`, `soft`, `paint`, `ink`, grano, tinte; bloque diorama de la Pradera con borde, sombra y pasarela; transiciones, caminos y agua. Puerta de aprobación con 3 capturas.
- [ ] **F3 · Decoración, recursos, estructuras y barreras de jefe** (primero solo el portón del orco).
- [ ] **F4 · Personaje y equipo** (capas + paleta-swap por tier).
- [ ] **F5 · NPC, monstruos y efectos.**
- [ ] **F6 · Luz, clima y post** (incluye mezcla de luz por bioma).
- [ ] **F7 · Interfaz e iconos de ítems** (minimapa cenital).
- [ ] **F8 · Pulido, rendimiento y limpieza** (borrar módulos cenitales y `phaser-world.js`).

## Código provisional (se borra o rehace en la fase indicada)
- `const GR=null,RD=null,WT=null,VG=null,SX=null,CH=null,SP=null` en `game.js`: **shim** que mantiene vivas las ramas antiguas de dibujo de entidades (`dN`, `dS`, `dSpr`, `dPerson`, `bk`, `TC`, `LDISC`…). Se elimina junto con cada sprite: estaciones y aldea F3, personaje F4, monstruos y NPC F5.
- Sprites de entidades: siguen siendo los **cenitales de rectángulos** (`Rc`), solo colocados en isométrico. Se rehacen en F3–F5.
- **Desactivado hasta F6:** clima y ambiente (`weather`, `ambient` siguen actualizando estado pero **no se dibujan**: lluvia, tormenta, luciérnagas, hojas, nieve). La iluminación `lighting()` sí funciona (noche, fogatas) con coordenadas convertidas a pantalla; incluye luces de farolas del layout antiguo en posiciones fijas (`x0+120/270`, etc.) que ya no tienen farola: se limpian en F3.
- **Desactivado hasta F3:** decoración de zonas, aldea, caminos, agua animada, cartel, banderas y antorchas (se borraron `dDecor`, `dGates` y la IIFE del escenario `bgc`). El «estanque/río» hoy es solo la altura .75 de `TER`.
- `post()` ya **no aplica filtro de color** (contraste/saturación): los colores de la guía se usan tal cual. Se mantiene el destello rojo al recibir daño.
- Minimapa: `mmk(k)` pinta un plano simple (suelo, agua, bordes) desde datos; sigue cenital. El recuadro de la vista usa `cx,cy` del cálculo antiguo (aproximado) hasta F7.
- Altura de un tile por su **centro**: junto al agua el jugador puede quedar 0,25 niveles más bajo hasta 16 px antes de la orilla real. Aceptado como provisional.

## Registro de cambios (más reciente arriba; el dueño pidió que todo quede aquí)
- **11 oct 2026 · F1-C1.** `game.js`: nuevo cursor de tile (`CUR`, `dCur`, helper `soft` para las esquinas suavizadas; es el único sitio donde cambiar la forma). Se dibuja justo después de `TER.draw`, bajo las entidades; solo con ratón (no en táctil); rojo si `blk()` bloquea el centro del tile. No toca lógica, guardado ni colisiones. `tools/iso_check.py`: comprueba que el tile resaltado es el que hay bajo el puntero (3 posiciones), que desaparece al salir del canvas y guarda `06_cursor.png` y `07_cursor_agua.png`. **Verificado sin pantalla:** 0 errores de consola, `RESULTADO: OK`. **No verificado:** el aspecto del tinte rojo sobre tile bloqueado (la captura 07 no cae sobre agua) ni la fluidez.
- **11 oct 2026 · F1-B.** (1) Borrados `ground/roads/water/village/sprites/stations/characters/phaser-world.js` y las herramientas `headless_check.py`/`sprites_check.py`. (2) `game.js`: eliminada la IIFE `bgc` (escenario cenital de 11500×1500, ~69 MB), `dDecor`, `dGates` y el dibujo antiguo del mundo; `draw()` ahora limpia con el papel `#fdf9e3`, sigue al jugador con `ISO.follow`, dibuja `TER.draw`, y entidades/proyectiles/partículas ordenados por `ISO.depth` con `spr()`; luego el HUD en unidades 640×400 con `setTransform(cv.width/W,…)`. (3) Canvas responsivo: `fitCv()` (CSS + `ResizeObserver`, dpr máx. 2), el atributo `width/height` ya no es fijo; CSS `image-rendering:auto`. (4) Entrada: teclas con `ISO.keyDir` (8 direcciones en ejes de pantalla); `P.f` (izquierda/derecha) ahora sale de la dirección en pantalla; clic con `ISO.toWorld(…, TER.heightAt)` y selección de entidades en espacio de pantalla. (5) `lighting()` convierte posiciones de luz a pantalla (`lp`, `LR`). (6) Flecha de objetivo con el ángulo de pantalla. (7) `mmk` y `post` simplificados. (8) Nuevo `src/world-iso.js` y `tools/iso_check.py`; `build_single.py` acepta guiones. **Verificado sin pantalla:** 0 errores de consola; `blk()` bloquea agua, acantilado y compuerta cerrada, deja libres puente, pasto y paso abierto; 200 clics aleatorios vuelven a su punto; la tecla arriba sube en pantalla; `draw()` ≈ 1 ms (headless, software). **No verificable desde el chat:** fluidez real y aspecto en tu pantalla. Colisiones y guardado **no se tocaron** (sin migración de partidas, por decisión del dueño).
- **11 oct 2026 · F1-A.** Creado `src/iso.js` (núcleo isométrico) y `tools/iso_test.js`. Decisiones técnicas: tile 56×28 con 22 px por nivel; zoom 1,6 sobre tamaño CSS; dpr máx. 2; cámara con suavizado exponencial y redondeo al píxel real; `toWorld` prueba cada nivel de altura y elige el candidato más cercano a la cámara (resuelve clics junto a acantilados); `keyDir` mapea arriba de pantalla a (-1,-1) de mundo y normaliza en mundo (por la proyección 2:1, moverse en horizontal de pantalla se ve el doble de rápido que en vertical; es lo correcto en isométrico). Limitación conocida: un clic a <1 px de mundo del borde exacto de un escalón puede caer en el nivel contiguo. `game.js` **no se ha tocado** todavía.
- **11 oct 2026 · F0.** Cancelado el plan de pixel art cenital con Phaser. Reescrito este `AGENTS.md`. Creado `INVENTARIO.md`. Copiados a `docs/` la guía isométrica y las dos demos de estilo.

## Estado
- Siguiente: **F1-C2** (oclusión al 50 %). F1-C1 hecho, pendiente de prueba a mano. No empezar F2 sin visto bueno del dueño a las capturas de F1.
