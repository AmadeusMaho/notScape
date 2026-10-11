# NotScape — guía para modelos y colaboradores

RPG idle estilo OSRS, en español, juego de navegador. Autor: un solo dev que alterna entre varios modelos; **este archivo es la memoria compartida**. Léelo entero antes de tocar nada y actualiza la sección "Estado de la migración" al terminar.

## Estructura
- `index.html` — shell HTML (paneles, tienda, inventario, HUD). 
- `css/style.css` — estilos de los paneles.
- `src/ground.js` — suelo por tiles (Fase 1). Define `const GR` (null con `?old`).
- `src/roads.js` — caminos por píxel (Fase 2, paso 1). Define `const RD` (null con `?old`). Usa los helpers compartidos `GR.H = {hash,vnoise,mix,hex}`; los módulos nuevos deben cargarse en `index.html` después de `ground.js` y antes de `game.js` (`build_single.py` inlinea automáticamente todos los `src/*.js` salvo `game.js`).
- `src/game.js` — todo lo demás: datos, lógica, guardado, audio y dibujo 2D. Globales: `S` estado, `P` jugador, `N/M/ST` entidades, `cx/cy` cámara, `curB` bioma actual, `BI` biomas, `BW=2300` ancho de bioma, `WW=11500`, `WH=1500`.
- `assets/music/*.mp3` — música.
- `tools/build_single.py` — junta todo en un HTML único (`dist/notscape.html`) para publicar como artefacto (inlinea CSS, JS y música).

## Cómo correrlo
`python3 -m http.server 8000` en esta carpeta → `http://localhost:8000`. No hay bundler ni npm. Comprobación rápida: `node --check src/game.js && node --check src/ground.js`.

## Objetivo de la migración
Pixel art más rico y, cuando aporte (entidades animadas y luces), **Phaser 3**; tiles de 16 px, contorno oscuro 1 px, luz desde arriba-izquierda (referencia visual: la demo `notscape-demo.html` publicada en el chat de origen; si no la tienes, el dueño puede compartirla). **Estrategia: cambiar solo la capa de dibujo.** Lógica, guardado y paneles HTML NO se tocan.

## Cómo funciona el suelo (Fase 1) — leer antes de continuar
- `src/ground.js` define `const GR`. Genera por código un tileset de 16 variantes (16×16) por bioma desde `BI[k].g`: pasto tono A/B, flores, guijarros, matas. Ruido de valor elige el tono (manchas orgánicas) y un hash elige la decoración.
- Cada bioma (144×94 tiles) se **pre-renderiza una vez** a un canvas 2D de 2300×1500 y `draw()` copia la porción visible, igual que hacía el antiguo `bgc`. Se precargan los 5 (uno por frame tras ~45 frames) para no crear uno de golpe al cruzar un borde.
- `game.js` llama `GR.draw(ctx,cx,cy)` en `draw()` justo ANTES de pintar el overlay `bgc`, y salta el pasto/matas/flores antiguos con `if(!GR)` dentro de la IIFE de `bgc` (~499–572). El overlay `bgc` es ahora transparente donde antes estaba el pasto.
- **Con `?old` en la URL, `GR` es null y se ve el suelo antiguo**: sirve para comparar rendimiento y como fallback. Mantén ese fallback hasta el final de la migración.
- **Por qué NO hay Phaser todavía:** una primera versión renderizaba el suelo con un Tilemap de Phaser (WebGL) y copiaba su canvas al canvas 2D en cada frame; en la práctica daba tirones durante el juego (copia GPU→2D por frame). El suelo es estático, así que se descartó. Phaser entra cuando aporta algo: sprites con animación y luces (Fases 3–4), y entonces **su canvas se muestra directamente** (no se copia al 2D). Para eso: añadir `<script src="https://cdnjs.cloudflare.com/ajax/libs/phaser/3.80.1/phaser.min.js">`, y apilar el canvas de Phaser debajo/encima del `#c`, o migrar también la iluminación (`lighting`/`post` usan composición sobre el canvas 2D, por eso no se pueden apilar sin migrarlas a la vez).

## Trampas conocidas
- No uses `rnd()` ni `R()` del juego para generar arte nuevo: `rnd` está sembrado (`seed=7`) y el layout depende de su secuencia; `R` usa `Math.random`. `ground.js` tiene su propio RNG (`hash`/`vnoise`/LCG).
- Colisiones y zonas (`blk`, `BLK`, `PD`, `ZS`, `cliff`) están en datos aparte: si cambias lo visual, **el layout visual debe seguir coincidiendo con esos datos**.
- Evita copiar canvases WebGL al canvas 2D en cada frame, y no crees texturas WebGL de 11500 px de ancho.
- La Fase 1 y el arreglo del panel (`skLive`) fueron probados por el dueño en el navegador y funcionan. Lo que añadas tú probablemente NO se pueda probar desde el chat: dile al dueño qué comprobar (usa el checklist de abajo).

## Rendimiento (ya corregido, no reintroducir)
- `panel()` reconstruye TODO el `innerHTML` del panel lateral cuando `dirty=1` (como mucho cada 250 ms). Correr daba `gain('ag')` cada ~130 unidades de camino → un rebuild completo del DOM cada ~1 s → micro-tirones. Ahora `gain()` no reconstruye el panel: si la pestaña activa es `sk` (Habilidades) llama `skLive(sk)`, que solo actualiza el texto de XP y la barra de esa skill (los divs llevan `data-sk`); al subir de nivel sí marca `dirty` (rebuild completo, es raro). Antes de añadir más `dirty=1` en eventos frecuentes, comprueba qué pestaña lo necesita. Este defecto venía del juego original, no de la migración.

## Contexto técnico del dibujo actual (necesario para las fases 2–4)
- Todo se dibuja en `draw(now)` (~657) sobre un canvas 2D de 640×400 con coordenadas de mundo (`ctx.translate(-cx,-cy)`; temblor de pantalla `SHK`). Orden: suelo (`GR`) → `bgc` (escenario estático) → aguas animadas `PD` → `dGates` → `dDecor` → entidades ordenadas por `y` (NPCs `N`, estaciones `ST`, monstruos `M`, jugador `P`) → partículas/proyectiles → `lighting` → luz ambiental `dAmb` → `post` → HUD (barras, minimapa, texto).
- Las entidades son **procedurales por frame**, con rectángulos `Rc(color,x,y,w,h)`; dependen del estado: `dPerson(x,y,camisa,pelo,dir,fase,andando,armadura)`, `dP` usa `S.eq` (colores por tier `TCOL`/`tierOf`), arma por `wtype()`, acción actual `A`. Los monstruos pasan por `dSpr(m,d,x,y,c,w,h,lk,t,now)`; `m.fl` (parpadeo al ser golpeado), `m.f` (dirección), `m.hunt`.
- Sombras: `Sd(x,y,w,h)` con `SHD` (dirección según el sol). Texto flotante y de HUD: `T(texto,x,y,color)` con fuente VT323.
- `lighting()` usa un canvas de oscuridad (`lc`/`lx`) y `destination-out` para abrir luces (fogatas, horno, tienda, antorchas por bioma). `dAmb` usa `lighter` para luciérnagas. **`post()` copia el canvas sobre sí mismo con `ctx.filter` cada frame** (contraste/saturación) → caro; en la Fase 4 sustituirlo (filtro CSS sobre el canvas o post-efecto de Phaser) en vez de portarlo tal cual.
- La IIFE de `bgc` (~499–572) usa desplazamientos `OX/OY` que **cambian por sección**: rancho `OX=250,OY=300`; zona hostil `OX=500,OY=300`; guarida `OX=800,OY=300`; aldea `OY=300`; agua `OY=500` (lago del bioma 0 con `OX=300`); roca/tumbas `OX=100,OY=350`. Las coordenadas de cada sección son relativas a esos offsets: al migrar una pieza, calcula la posición final (`x0+x+OX`, `y+OY`) antes de moverla.

## Estado de la migración (actualiza esto al terminar tu parte)
- [x] **Fase 0** — proyecto en carpetas, música fuera del código.
- [x] **Fase 1** — suelo base por tiles (`src/ground.js`). Verificado por el dueño: funciona y sin tirones.
- [ ] **Fase 2 — escenario estático** (sin Phaser: seguir la técnica de `ground.js`: tileset/sprites generados por código con paleta fija y contorno `#14100a`, pre-renderizados por bioma a canvas 2D y copiados por frame; no crear canvases de 11500 px, usar uno por bioma). Un archivo nuevo por bloque (p. ej. `src/roads.js`, `src/water.js`, `src/village.js`), cada uno con su interruptor `?old` o guarda `if(!X)` en la IIFE. Pasos, de menor a mayor riesgo:
  1. ✅ **Caminos — HECHO (`src/roads.js`).** Se unen los 6 rectángulos del bioma en una máscara con bordes irregulares (±1 px) y se pinta por píxel en un `ImageData` (contorno oscuro, borde claro arriba-izquierda / oscuro abajo-derecha, interior moteado con guijarros, roderas en la calle principal, halo suave sobre el pasto). `game.js` (~543) llama `RD.draw(g,k,RR,rc,ed,b.g)` o, con `?old`, la función `road()` original. Geometría = la original ±1 px (colisiones intactas). Coste: ~70 ms por bioma al cargar (una vez). Previsualizado solo en un test con mocks (T-junction y biomas 0 y 3 se ven limpios); **pendiente de verificar por el dueño en el juego** (aspecto en los 5 biomas, que NPCs/estaciones queden bien sobre el camino, tiempo de carga). Ajustes de gusto: colores `SOFT/DK/LG/PB` y densidad de guijarros en `roads.js`. **Técnica reutilizable para agua y acantilados:** máscara `Uint8Array` + paso por píxel que mira vecinos a 1–2 px + `createImageData` → canvas temporal → `g.drawImage` (nunca `putImageData` directo sobre `bgc`, borraría lo dibujado debajo).

  2. **← SIGUIENTE:** Agua (`// ---- agua`, ~552) + `PD` en `draw()`: orilla de arena, juncos y piedras; animación actual de ondas en `draw()`. Las zonas vienen de `PD`/`BLK` (colisión): el dibujo debe coincidir con `blk()` (~362). *Hecho cuando:* no se puede caminar por agua ni se ve tierra caminable pintada de agua, y el puente (`x0+232,728,76,80`) sigue cruzable.
  3. Aldea (~544), rancho (~515), zona hostil (~523), guarida (~531), decoración de zonas (~561), cartel (~567): convertir a sprites con contorno y sombreado; mantener posiciones (las estaciones `ST` se dibujan en `dS`, no aquí). Cada bioma `k` tiene su variante (`if(k===0)…else if(k===1)…`).
  4. Acantilados y franja superior (~569): hueco en el camino `y 702–826`; debe coincidir con `cliff()` (~362).
  *Hecho cuando (toda la fase):* la IIFE de `bgc` queda vacía o eliminada y `?old` sigue funcionando hasta ese punto.
- [ ] **Fase 3 — entidades** (aquí entra Phaser si aporta animación real). Decisión recomendada: «panadería de sprites»: conservar las funciones procedurales (`dPerson`, `dN`, `dS`, `dM`, `dSpr`, `dP`) pero renderizar cada combinación (tipo + dirección + frame + equipo) UNA vez a un canvas/atlas cacheado y dibujar el sprite cacheado (o un sprite de Phaser); invalidar la caché solo cuando cambie `S.eq`. Mantener intactos los datos `P`, `N`, `M`, `ST` y el orden por `y`. Antes de usar Phaser, definir cómo apilar canvases: el canvas de Phaser iría debajo de un canvas 2D transparente solo para HUD/texto, **lo que obliga a migrar `lighting` y `post` en la misma tarea** (hoy componen sobre el canvas 2D). *Hecho cuando:* a 60 fps con ~100 entidades en pantalla no hay tirones, y el combate (golpe, parpadeo, barras de vida, texto flotante) se ve igual o mejor.
- [ ] **Fase 4 — luz, clima y post-proceso**: `ambient`(~410), `weather`(~434), `dRain`(~447), `dAmb`(~418), `lighting`(~641), `post`(~636). Enfoque de la demo: capa multiplicada para el día/noche + luces aditivas; lluvia/tormenta como partículas; sustituir `ctx.filter` de `post`. Solo entonces quitar el canvas 2D del mundo (paneles y HUD de texto pueden quedarse en DOM/canvas 2D). *Hecho cuando:* ciclo día/noche, lluvia, tormenta, luciérnagas y luces de fogata/horno se ven igual o mejor y no cuestan más CPU que antes.

## Checklist manual (no hay tests automáticos): ejecútalo tras cada cambio
1. Cargar con partida guardada existente y sin ella (`localStorage` limpio) → sin errores en consola.
2. Recorrer los 5 biomas cruzando cada borde (puertas desbloqueadas por jefes), de día y de noche.
3. Correr (R), talar, minar, pescar, cocinar (minijuego), combatir un monstruo y un jefe; subir de nivel (banner).
4. Lluvia/tormenta en biomas 0–2; minimapa; pestaña Habilidades abierta mientras se gana XP.
5. Comparar fluidez y tiempo de carga con `?old` (mientras exista el fallback).
6. Caminos: en cada bioma, cruces limpios, sin huecos entre tramos, y las puertas/estaciones (`ST`) sobre el camino se ven bien.

## Reglas
- No cambiar la lógica de juego mientras se migra el dibujo.
- Un cambio por vez; tras cada uno, comprobar que el guardado (`localStorage`) sigue cargando.
- Textos del juego en español. Paleta y estilo: contorno `#14100a`, luz arriba-izquierda, 3–4 tonos por material.
- Al terminar tu parte, actualiza "Estado de la migración" y las líneas aproximadas.
