> **ESTADO (19 oct 2026, noche): IMPLEMENTADO en el juego 3D** → `src/r3d/water3d.js` (Lote R3D-AGUA-IMPL en AGENTS.md). Este plan queda como referencia de diseño.

# PLAN · Agua «D» (óleo híbrido) para el 3D — estanques en calma, oleaje solo en el mar y ondas de pesca con física

> **Estado: SOLO PLAN (19 oct 2026). Nada de esto está portado al juego.** El dueño pidió explícitamente no portarlo todavía.
> **Referencia ejecutable (aprobada por el dueño): `tools/r3d/agua_demo.html`** (abrir en el navegador; three r128 desde CDN). Panel **D · Híbrido**. Los otros tres (A pintado, B óleo, C cristalino) se descartaron, salvo las cáusticas sobre el lecho de C, que D ya usa.
> Decisión del dueño sobre el oleaje: **los estanques y lagos NO tienen oleaje** (agua en calma). El oleaje con volumen es **del mar y de la playa**. Cuando el jugador **pesca**, el agua del estanque se perturba con ondas que se propagan, interfieren y se apagan (física).

> ### ▶ ACTUALIZACIÓN 19 oct 2026 (tarde) — FÍSICA REAL DEMOSTRADA: `tools/r3d/agua_fisica_demo.html` (Lote R3D-AGUA-FISICA)
> El dueño pidió que el agua tenga **físicas de verdad**: que un pez al moverse mueva el agua, y que al pescar también. Se hizo una **segunda demo** (la original `agua_demo.html` no se toca) con el estilo D aprobado + una **simulación de ondas** + peces + pesca completa. **Sigue sin portarse al juego.** Cambios de decisión respecto a lo que dice el resto de este plan:
> 1. **La simulación (W2) pasa a ser la RECOMENDADA y va en la CPU, no en la GPU** (§4.5 nuevo). Motivos medidos: ventana 128×128 = 0,6 ms/fotograma incluso en un navegador sin GPU; funciona en cualquier dispositivo (sin `HalfFloat` renderizable); y, sobre todo, **la CPU conserva la altura real**: el flotador, los peces y las gotas LEEN y ESCRIBEN en la misma simulación (la versión GPU del plan no podía leerla). W1 (analítica) queda solo como plan B de calidad Baja.
> 2. **Estela de los peces** = la simulación recibe un dipolo por pez (cabeza empuja, cola alterna con el batir) proporcional a su velocidad y a lo cerca de la superficie que nade; los saltos hacen chapuzón al salir y al entrar.
> 3. **Ondas que viajan con velocidad dependiente de la profundidad** (`c² ∝ profundidad`): refractan hacia lo hondo y se amortiguan en la orilla (sin rebote «de plástico»), como pedía el §4.3.
> 4. **Las gotas de los chapuzones vuelven a caer y crean ondas pequeñas** (acoplamiento aire→agua).
> 5. La tabla de eventos `cast / tug / catch / wade` del §4.1 se conserva y se amplía con `jump` (pez que salta) y `stone` (piedra, solo demo). Tabla de amplitudes real usada en la demo en §4.5.

## 1. Qué es «D» (lo aprobado)
Estructura del agua pintada (bandas por profundidad, cáusticas, espuma, chispas) con el tratamiento del óleo oscuro (pincelada larga, paleta apagada, reflejo cálido del cielo, posterizado suave). Es una **superficie translúcida sin pase extra** (no hay refracción real; la guía §4.6 la reserva para «Máxima» y no hace falta).

Elementos que hay que conservar tal cual están en la demo (`FS_D` y `VS_D`):
1. Bandas por profundidad con el borde roto por la pincelada (`e = d + (br-.5)*.18 + (wr-.5)*.08`).
2. Manchas grandes de color (más verdes en lo somero), cáusticas finas e irregulares de poco contraste (`*.16`).
3. **Orilla translúcida:** alfa `mix(.46,.96,smoothstep(0,.5,d))` para ver el lecho y las rocas por el borde.
4. Espuma de orilla en pinceladas con **swash** (la línea avanza y retrocede: `+.028*sin(t*1.2+p.x*.9+p.y*.7)`), coloreada por la luz (`uFoam*mix(1,uSunCol,.6)`).
5. Sombreado de ola por normal (cara al sol más clara, valle más oscuro, cresta que deja pasar luz), brillo del sol en dos lóbulos (`pow(nh,36)*.3 + pow(nh,220)*.9`) y reflejo del cielo según la inclinación.
6. Posterizado suave (`floor(c*6+.5+(br-.5)*.8)/6` mezclado al 30 %).
7. Chispas con el color de la luz (solo calidad Alta).
8. **Lo que se quitó a propósito:** las franjas blancas que avanzan en diagonal («crestas») y los anillos blancos; no calzan con el óleo.

Textura compartida **generada al arrancar** (sin archivos): `makeTextures()` de la demo → 256² RGBA (R ruido, G red de cáusticas Voronoi, B ruido 2, A chispas) y otra 256² de normales. Costó ~100 ms en el navegador de pruebas; pasarla a `src/r3d/water3d.js`.

## 2. Tipos de agua del juego y qué oleaje lleva cada uno
Datos reales del código (no inventados): `layouts.js` define `lay.lakes` (estanque, lago, río de óvalos encadenados) y `lay.sea` (mar al sur con playa de arena, solo en biomas sin espejo en Y). `BIOMES.geo.seaY(S,lx)` da la costa y `BIOMES.geo.sand` la arena. `TER.sandAt(tx,ty)` ya existe y el terreno 3D lo usa para el color.

| Agua | Oleaje ambiental | Ondas de pesca/jugador | Notas |
|---|---|---|---|
| Estanque, lago | **Ninguno** (plano). Solo micro-normales (1 lectura) y pincelada | **Sí, con física** | Es el caso principal de este plan |
| Río (óvalos) | Ninguno | Sí | Opcional futuro: arrastrar la pincelada en la dirección de la corriente |
| Mar | **Sí**: 2–3 olas tipo Gerstner que viajan hacia la costa | Sí | Dirección = hacia la tierra (el mar está al sur: aprox. -Z); la amplitud crece y rompe al acercarse |
| Playa (arena junto al mar) | — | — | **Swash**: franja de arena que se oscurece y se retira con el oleaje (shader del suelo) |
| Lava (Volcán) | No aplica | — | Shader aparte (en `water-gl.js` hoy: `uLava`); fuera de este plan |

**Cómo se sabe qué es mar:** atributo por vértice `aSwell` (0 = calma, 1 = oleaje pleno) que se escribe al construir el chunk junto a `WP`/`WD` en `terrain3d.js` (arriba, línea `if(h===.75||this.near(...)) ... WP.push/WD.push`). Para eso hace falta un helper **nuevo** en `world-iso.js`: `TER.seaAt(tx,tz)` (usa `BIOMES.geo.seaY` del bioma de ese tile; 0 si el bioma no tiene `lay.sea`). `aSwell` sube de 0 a 1 en ~4 tiles hacia mar adentro (así no hay salto) y también escala la amplitud de la ola en el vértice.

## 3. Ajustes de escala (LO MÁS FÁCIL DE ROMPER AL PORTAR)
La demo usa unidades propias. El juego: **1 tile = 32 px = 1 unidad de mundo** (`iso.js` `TILE=32`; `terrain3d.js` «1 tile (32 px) = 1 unidad»). Diferencias medidas leyendo el código:
- **Profundidad:** en el juego `WD = WY − campo.y` con `BED=-.44`, `WY=(.75-1)*.6415=-.16` → profundidad **máxima ≈ 0,28**. La demo llega a ≈ 0,9. En el shader multiplicar `vD` por **`uDepthK ≈ 3.2`** (= 0,9/0,28) antes de usar las bandas (`.1/.24/.34/.52`, alfa y absorción), o sus umbrales quedan fuera de rango y el agua se vería toda «somera».
- **Tamaño del mundo:** los radios de `layouts.js` están en px de mundo (32 px = 1 tile): el estanque del sur, r=[200,125] px ≈ 6×4 tiles de radio (≈ 12×8 tiles de lado a lado); el lago grande, r=[330,240] px ≈ 10×7,5 tiles de radio. La demo tiene un estanque de ~8–9 unidades de lado. Aproximación: **1 unidad de la demo ≈ 1,5–2 tiles** (el tamaño en pantalla depende además del zoom de la cámara del juego, que no medí). Todas las frecuencias espaciales de la demo (`p*.045`, `q*.34`, `p*.15`, etc.) se multiplican por un uniforme **`uWS`** (empezar en 0,6) para que la pincelada y las cáusticas conserven su tamaño en pantalla.
- **Amplitud de ola y de ondas:** en unidades de mundo (1 tile = 1). Los valores de la demo (`.07/.04/.022` y ondas `.05`) producen sombreado visible; empezar iguales y ajustar con capturas desde la cámara del juego. **Estos números NO están validados en el juego**: la demo solo se vio en una cámara fija a ~24 unidades.
- **Color:** el juego usa `colorspace_fragment` en el agua actual; las paletas de la demo son «colores de pantalla» (se probaron con `ColorManagement` desactivado). Al pasarlas con `new THREE.Color('#hex')` en r170 se convierten a lineal y el shader ya devuelve sRGB: **comprobar que el verde no sale más oscuro** (si pasa, es cuestión de no mezclar `uTone`/posterizado en espacio lineal).

## 4. Ondas de pesca con física (el pedido central)
### 4.1 Eventos (ganchos que ya existen o faltan)
Hoy: `game.js:746` llama `TER.ripple(e.x,e.y)` en cada golpe de pesca (`k==='fi'`, cuando `imp`), y `TER.env()` (`world-iso.js` ~294) crea una onda cada 0,45 s cuando el jugador camina junto al agua. El 3D **aún no usa ninguna** (`terrain3d.js` no tiene `uRip`); `water-gl.js` (2D) sí (8 ondas, `uRip[8]`).
Ciclo de pesca en el código (`game.js` ~856 y ~881): lanza UNA vez al empezar (el flotador vuela en arco durante `ph<.26`), espera, y en cada «picada» (`tug`) la caña da un tirón. El flotador y el sedal se dibujan **en el 2D** (un cuadrado rojo de 3 px con `sin` de balanceo).

API nueva propuesta (en `world-iso.js`, junto a `ripple`): **`TER.splash(x, y, kind)`** con `kind` ∈ `cast | tug | catch | wade`; `ripple(x,y)` queda como alias de `tug`. Mapa evento → kind:
| Momento | Dónde engancha | kind | Amplitud relativa | Extras |
|---|---|---|---|---|
| El flotador cae al agua (fin del arco, `ph≈.26`) | `game.js` ~856/881 | `cast` | 1,0 (grande, 2 anillos + corona) | 8–10 gotas |
| Picada / tirón (`tug`) | `game.js` ~856 | `tug` | 0,35 | 2–3 gotas |
| Captura / fin (`fin(now)`) | `game.js` 746 (`A.pr>=1`) | `catch` | 0,7 | 6 gotas |
| Jugador entra o camina junto al agua | `TER.env` | `wade` | 0,15 (cada 0,45 s, ya existe) | nada |
| Fallo / el pez se escapa | (hoy no existe evento) | `tug` | 0,25 | — |
`splash` guarda `{x,y(en tiles),t,amp,kind}`; `R3D` lo lee por un getter nuevo `TER.ripples()` (en tiles, no en px) en vez de reimplementar el estado.

### 4.2 Fase W1 — analítico (RECOMENDADO primero; ya está demostrado en la demo)
- Uniforme `uRip[8]` (vec3: x, z, edad) + `uRipA[8]` (amplitud/kind). Vida 2,4 s; radio `r = edad*1.7` tiles/s; altura de cada onda: `am*(1-edad/2.4)*exp(-u²*12)*cos(u*9)`, `u = dist - r`. Gradiente analítico para la normal (ver `VS_D` de la demo).
- **En los estanques se aplica como NORMAL en el fragmento** (sin desplazar vértices): la malla del agua hoy es **un quad por tile** (6 vértices; ver `WP.push` por tile), insuficiente para desplazar un anillo de 0,3 tiles de ancho, y desde la cámara isométrica el relieve se lee por el sombreado, no por la silueta. Coste: 8 iteraciones en el fragmento solo si hay ondas activas (`if(uRipN>0)`).
- Opcional (si se quiere silueta): subdividir **solo** los tiles de agua con onda activa a 4×4 (`SUB=4` ya existe) — pendiente de medir; no es necesario para el primer lote.
- **Flotador en 3D:** mallita (esfera blanca/roja de 0,1 tiles) en `R3D` en `A.e`; su altura = `WY + suma de las ondas analíticas en ese punto` (misma función que el shader, calculada en CPU; con W1 es exacto). El sedal puede seguir en 2D al principio. El flotador se «hunde» en cada `tug` (muesca de 0,05 tiles, 120 ms). **Es solo visual; no cambia la lógica de pesca** (ver preguntas).
- **Gotas:** reutilizar `particles3d.js` (partículas en GPU, ya hay 3 draw calls para el clima): un emisor puntual con 6–10 gotas balísticas por evento. No añade draw calls.
- Sonido: no hay `snd('splash')` hoy; dejar el gancho y pedir un sonido nuevo al dueño si lo quiere.

### 4.3 Fase W2 — simulación física real en GPU (SUPERADO por §4.5: se hace en la CPU; se conserva como alternativa)
Lo que pidió el dueño («físicas»): que las ondas interfieran, reboten en la orilla y «desestabilicen» el agua un rato. Se hace con la **ecuación de onda amortiguada en una ventana local** que sigue al punto de pesca (solo hay uno activo: el del jugador).
- **Ventana:** 12×12 tiles alrededor del flotador; textura `WebGLRenderTarget` 96×96 (8 celdas/tile), `HalfFloatType`, ping-pong de 2 buffers guardando `(h, h_prev)` en R y G (patrón estándar: `h_next = 2h − h_prev + c²·Δt²·∇²h`, luego `*damp`).
- **Estabilidad (CFL):** `c·Δt/Δx < 0,7`. Con celdas de 1/8 tile y Δt = 1/60 s, `c` máximo ≈ 5 tiles/s; usar **`c ≈ 1,8 tiles/s`** (igual que el radio analítico) y `damp ≈ 0,985` por paso (≈ 2,4 s de vida). Paso fijo, máximo 2 pasos por fotograma (si hay lag, se descartan pasos, nunca se acumulan).
- **Impulsos:** un quad gaussiano aditivo (radio ~0,35 tiles) en `splash`; la altura inicial depende de `kind` (tabla 4.1).
- **Orillas:** textura de máscara con el `aDepth` de la ventana: donde `d<ε` se amortigua fuerte (la onda muere en la orilla; **sin rebote duro**, que se vería de plástico). Opción de rebote suave para el borde de rocas.
- **Dormir:** si no hay impulsos en los últimos ~3,5 s se limpia el buffer y **no se ejecuta nada** (coste cero cuando no se pesca). No se hacen lecturas de GPU a CPU.
- **Muestreo:** en el fragmento, 3 lecturas (h y dos vecinos) para altura y normal; se desvanece hacia el borde de la ventana. El flotador en CPU **no** lee la simulación (usar las ondas analíticas W1 solo para su balanceo; la simulación es visual).
- **Fallback:** sin WebGL2/`HalfFloat` renderizable → W1. En calidad Media o inferior → W1.
- Estimación: 96×96 = 9 216 píxeles × 1–2 pasos; despreciable frente al terreno. Aun así **medir** con `tools/r3d/perf_check.py`, no asumir.

### 4.4 Presupuesto y calidad (mapa `QL` del juego → `uQ` de la demo)
`QL` = `[Máxima, Alta, Media, Baja, Mínima]` (`r3d.js`). Propuesta: `QL 0–1 → uQ 2`, `QL 2 → uQ 1`, `QL 3–4 → uQ 0`.
| uQ | Lecturas de textura / píxel de agua | Oleaje del mar (vértice) | Ondas de pesca | Cáusticas del lecho |
|---|---|---|---|---|
| 2 (Máx/Alta) | 5 (+W2: 3 si hay sim) | 3 olas | W2 si hay half-float, si no W1 | 2 capas |
| 1 (Media) | 3 | 2 olas | W1 | 1 capa |
| 0 (Baja/Mín) | 1 | ninguna (plano) | W1 solo como color (sin normal) | no |
(Esas cuentas de lecturas salen de la demo; el chip de cada panel las muestra.)

### 4.5 Simulación en CPU (VIGENTE desde el 19 oct; sustituye a §4.3 como recomendación)
Código de referencia ejecutable: clase `Sim` y `splash()` de `tools/r3d/agua_fisica_demo.html` (≈ 40 líneas, copiar tal cual a `src/r3d/water3d.js`).
- **Ecuación:** `v += c(x)²·∇²h·dt ; v *= amort(x) ; h += v·dt`, paso fijo `DT=1/120`, máx. 4 pasos por fotograma (si hay lag se descartan, nunca se acumulan), celdas de `1/8` de unidad. Estabilidad (CFL) = `c·DT/dx ≈ 0,18`, muy lejos del límite 0,7.
- **Mapas por celda** (se calculan una vez al construir la ventana desde la profundidad `d`): `c² = C0²·clamp(d/.5, .12, 1)` (0 en tierra: pared, `h=v=0`), `amort = .9935·(1-.018·somero)` con `somero = 1-smoothstep(.03,.25,d)` (la orilla se come la onda). `C0 = 2,2` unidades/s en la demo.
- **Textura (RGBA8, `LinearFilter`, sin `HalfFloat` ni extensiones):** R,G = pendiente `gx,gz` (×`GK=1.2`), B = altura (×`HK=4`), A = `|v|` (energía → espuma de cresta). Se sube 1 vez por fotograma solo si hay actividad. **El fragmento** la lee 1 vez (normal exagerada ×8 para que se lea en óleo; cáusticas y reflejo se deforman con ella); **el vértice** la lee 1 vez para desplazar `y`. En calidad Baja: solo color (sin desplazar).
- **Dormir:** si `act` (máx. |v|) < `2e-4` y no hubo impulsos, no se ejecuta nada (coste cero). En el juego la ventana solo existe cuando hay pesca o un pez cerca.
- **Impulsos:** `sim.dent(x,z,amt,rad)` = depresión gaussiana (amt>0 hunde, <0 levanta). `splash(x,z,kind)` = `dent` + gotas. Tabla usada (unidades de la demo): `cast` .14 / r .34 / 9 gotas · `tug` .05 / .22 / 3 · `catch` .10 / .30 / 6 · `wade` .02 / .20 / 0 · `jump` .10 / .30 / 8 · `stone` .12 / .30 / 6. **Al portar, escalar `amp`, `rad`, `C0` y los coeficientes de los peces con la misma constante «1 unidad de demo ≈ 1,5–2 tiles» del §3 y volver a ajustar con capturas desde la cámara del juego.**
- **Peces (ambientales, solo cerca del jugador):** estela = `dent(cabeza, −.0048·f·k, r .11)` + `dent(cola ± batido, sen(fase)·.008·f·k, r .10)` con `f = rise²·min(1, vel/.5)` y `k = dt·60`; `rise` (0–1) = lo cerca de la superficie que nada (sube y baja solo y sube a 1 cuando persigue el cebo). Salto cada 6–24 s: arco balístico `H=.5` con cabeceo según la pendiente; `jump` al salir y al entrar. **Los peces NO existen hoy en el juego:** en el 3D serían actores ambientales (sombras/siluetas translúcidas sobre el lecho, máx. ~4–6 a la vez, solo en una ventana de ±8 tiles del jugador) y el pez de la pesca sería uno de ellos (es lo que hace la demo).
- **Pesca (máquina de estados de la demo, mapeable a `A.ty==='c'`/`'fi'` de `game.js`):** `cast` (flotador en arco, `splash cast` al caer) → `wait` (2,6–5 s, el flotador se mueve con la pendiente real) → `bite` (el pez MÁS CERCANO nada hacia el flotador; 2–4 picadas = `tug` + hundimiento del flotador) → `hook` (forcejeo 1,7 s: `tug`×1,4 cada .2 s y el pez zigzaguea) → `reel` (flotador a 1,35 u/s con estela: cresta delante, seno detrás) → `land` (`catch` al sacar el pez) → `idle`. Duración total medida: 12,3 s de tiempo de juego. **Es solo visual: no cambia la lógica ni la probabilidad de pesca del juego** (decisión abierta §10.1 sigue en pie).
- **Qué NO está en la demo:** vadear (el `wade` existe en la tabla, sin demo), corriente de río, sonido de chapoteo (`snd('splash')` no existe), el flotador y el sedal en 3D dentro del juego (hoy son 2D encima del 3D, ver §4.2) y pez real en el juego.
- **Riesgos de la simulación:** (a) la ventana es plana: en pendientes fuertes la orilla de la ventana debe fundirse a 0; (b) con `uPK>2` el desplazamiento de vértice puede cruzar la orilla translúcida; (c) 6 peces nadando a la vez mantienen la simulación siempre «despierta» (0,6 ms): limitar el nº de peces o dormirlos si están lejos; (d) todo medido sin GPU real.

## 5. Mar y playa (el oleaje)
- **Vértice (`VS_D`):** olas Gerstner con `m = smoothstep(0,.4,aDepth)*aSwell*step(.5,uQ)`; dirección = hacia la costa. Longitudes de onda **mucho mayores que en la demo** (el mar es grande): 6–10 tiles; amplitud ~0,06–0,12 tiles. El mar necesita malla más fina que 1 quad/tile: **2×2 por tile solo en tiles con `aSwell>0`** (el cambio es local al build del chunk; los lagos no cambian).
- **Rompiente:** cuando `d*uDepthK < ~.15` la cresta se aclara y aparece espuma en **pinceladas con el color de la luz** (la misma receta del borde de orilla), nunca franjas blancas.
- **Swash en la arena (suelo):** en el shader del suelo (`GROUND_COLOR`, `materials3d.js`) la franja húmeda junto al agua oscurece la arena y se mueve con `sin(t*...)` solo donde `aSwell>0`/`sandAt>0`. Hoy el terreno 3D no tiene nada de esto (el lecho es color de tierra `#5a4430`/`#4e3a2a` desde `terrain3d.js`).
- **Sin calma/estanque:** `aSwell=0` → plano. **Atención:** la demo logra gran parte de su carácter con el sombreado del oleaje; los estanques quedarán **más planos que la demo**. Compensar con micro-normales (1 lectura), pincelada y cáusticas; hacerlo con capturas antes/después y que el dueño apruebe.

## 6. Cambios en el suelo (necesarios para que la orilla translúcida se vea bien)
El agua de D deja ver el lecho; el lecho del juego solo se pinta como color. En el shader del suelo (`GROUND_*` en `materials3d.js`) añadir (como `GFS` de la demo): `exp(-d*uAbsV)` bajo el nivel del agua, cáusticas del lecho (`uCaus≈.28`, 1–2 lecturas de `uTex`) y el oscurecimiento de la franja mojada (`1-.28*smoothstep(-.1,0,d)`). Coordinar con la regla de `uWet`/`uMoss` ya existente. **Solo se aplica a píxeles bajo `WY`.**

## 7. Paletas por bioma
La demo solo define la **Pradera**: `uShal #4f8c7e · uDeep #164a4b · uLight #8fc4b2 · uFoam #c3cdc2 · uGlint #ffd7a8`, cielo/horas de la demo (`TOD` de la demo = 3 filas). Para los otros 5 biomas **hay que definir filas** (guía §4.9 y tablas de «agua hondo/somero/cielo» líneas ~181 y ~226 de `GUIA_3D_PORTEO.md`) y pasarlas por `BIOMES`/`GCOL` como el resto. **Decisión pendiente del dueño en F5** (lo mismo que dice la guía para «luz por bioma»).
Mapa de `TOD` del juego → uniformes del agua: `uTone`, `uSun`, `uSunCol`, `uSunI`, `uHor`, `uZen`. En el juego ya hay `G.uNight` y una fila de luz por hora; **derivar de ahí**, no duplicar la tabla.

## 8. Archivos a tocar cuando se porte (nada tocado hoy)
- **Nuevo `src/r3d/water3d.js`** (ya figura en la tabla de módulos de la guía §6): `makeTextures`, materiales D (`waterMatD`), uniformes compartidos, getter de ondas, sim W2 opcional. `terrain3d.js` deja de definir `waterMat/WU`.
- `src/r3d/terrain3d.js`: atributo `aSwell` y subdivisión 2×2 en el mar; llamar al nuevo material; `lodR` para apagar la animación lejos.
- `src/r3d/materials3d.js`: lecho bajo el agua y swash en el suelo.
- `src/r3d/r3d.js`: alimentar `uSun…` desde `TOD`, `uQ` desde `QL`, ondas desde `TER.ripples()`.
- `src/world-iso.js`: `TER.seaAt`, `TER.splash`, `TER.ripples`.
- `src/game.js`: ganchos de la tabla 4.1 (`cast`, `tug`, `catch`).
- `tools/r3d/`: `water_check.py` (nuevo; copiar el patrón de `terrain_check.py`/`shot_at.py`): capturas del estanque de la aldea (2850,1985) y del mar (y≈2720) × 3 horas × 3 calidades.
- **No tocar:** `water-gl.js` (queda como plan B 2D, sin cambios).

## 9. Orden de trabajo sugerido (un lote = una captura aprobada por el dueño)
1. **W-A · Paridad estática:** D sin oleaje en estanques/lagos (bandas, cáusticas, orilla translúcida, lecho, swash de espuma). Verifica escala (§3).
2. **W-B · Pesca W1:** `TER.splash`, ondas por normal, flotador 3D, gotas. Prueba: pescar en el estanque del sur (misión «Pescador», `N:fi:0`).
3. **W-C · Mar y playa:** `aSwell`, Gerstner, rompiente, swash. Solo biomas con `sea` (Pradera y Oriental hoy).
4. **W-D · (opcional) Simulación W2.**
En cada lote: capturas en 3 horas, `perf_check.py` antes/después, y anotar en el Registro de AGENTS.md.

## 10. Decisiones abiertas (con propuesta por defecto)
1. **¿El flotador y la ola afectan al juego (p. ej. la picada se ve como un pulso)?** Propuesta: **solo visual**, sin cambiar la lógica. Pregunta al dueño si quiere una pista visual de «picó» más marcada.
2. **¿Simulación real (W2) o basta analítica (W1)?** **RESUELTA el 19 oct: simulación real en CPU (§4.5)**, pedida por el dueño («físicas»); W1 solo como plan B de calidad Baja.
3. **¿El río lleva corriente visible?** Propuesta: no ahora.
4. **Sonido de chapoteo:** ¿se añade a `snd`?
5. **Paletas de los otros 5 biomas** (ver §7).

## 11. Riesgos conocidos
- Los números de la demo no están validados en la cámara del juego (§3). La demo solo se miró en **Chromium sin GPU real y con three r170 + `ColorManagement` apagado**; en un navegador real con r128 los colores pueden variar un poco.
- Estanques planos (§5) pueden verse más sosos que la demo.
- Agua translúcida + lecho de tierra oscura: si el lecho es muy oscuro, la orilla translúcida se verá turbia. Ajustar `uAbsV` y el alfa.
- El agua es transparente con `depthWrite:false`: respetar `renderOrder=2` y no mezclar con otros transparentes sin probar.
