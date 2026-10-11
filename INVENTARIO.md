# INVENTARIO — estado real de NotScape (11 oct 2026)

Entregable de **F0**. Describe el juego tal como está en el código, antes de tocar la vista isométrica. Cuando el dueño confirme que refleja su versión, F0 queda cerrada. Lo marcado **[confirmar]** es una duda que debe resolver el dueño; lo marcado **[aprox.]** salió de una lectura rápida del código y puede variar en unidades.

## 1. Canvas, mundo y cámara

| Dato | Valor actual |
| --- | --- |
| Canvas lógico | `640×400` (`W`, `H` en `game.js`), atributos fijos en `index.html` |
| Escalado en pantalla | CSS: `#cw{width:min(100%,calc(78vh*1.6))}`, canvas `width:100%` con `image-rendering:pixelated`. Es **fijo en resolución, escalado por CSS**; no usa `devicePixelRatio` |
| Mundo | `WW=11500` × `WH=1500` px, una **tira horizontal** de 5 biomas |
| Bioma | `BW=2300` px de ancho cada uno, `x0 = k·BW`, alto completo 1500 |
| Unidad de coordenadas | **píxeles del mundo**, no tiles. No hay cuadrícula de colisión: la colisión son rectángulos (ver §6) |
| Cámara | `cx=P.x-W/2`, `cy=P.y-H/2`, recortada a `[0,WW-W]×[0,WH-H]`, redondeada a entero. Sin suavizado |
| Oclusión / orden | Entidades ordenadas por `y` (NPC `N`, estaciones `ST`, monstruos `M`, jugador `P`) |

**Escala propuesta para isométrico (a confirmar en F1):** `ISO.TILE = 32` px de mundo por tile. Un bioma serían ~72×47 tiles; el jugador (≈12×20 px) ocuparía menos de medio tile, igual que ahora. El valor se deja en **una sola constante** para poder cambiarlo. **[confirmar]**

**Problema de resolución a decidir:** con tile isométrico de 56×28 px lógicos, un canvas de 640×400 muestra solo ~11 tiles de ancho. Hoy se ven ~20 tiles de 32 px. O se agranda el canvas (responsivo, 2× con `devicePixelRatio`) o se reduce el tile. Ver preguntas del §9.

## 2. Orden de dibujo actual (`draw(now)`, ~línea 695)

Suelo (`GR`) → `bgc` (escenario estático de 11500×1500, pintado una vez) → aguas animadas `PD` → `dGates` → `dDecor` → entidades por `y` → partículas/proyectiles → `lighting` → `dAmb` → `post` → HUD (barras, minimapa, texto).

`bgc` se pinta en una IIFE (~513) con desplazamientos `OX/OY` distintos por sección (rancho, zona hostil, guarida, aldea, agua, rocas). Pasto → caminos → aldea → agua → decoración → cartel → acantilados.

## 3. Biomas (5, todos se conservan salvo que el dueño diga lo contrario)

| k | Bioma | Nivel rec. | Jefe (`b{k}`) | Monstruos normales | Animales de zona |
| --- | --- | --- | --- | --- | --- |
| 0 | Pradera | 1 | Gruk, Jefe Orco (lv 14) | Goblin, Orco | Vaca, Gallina |
| 1 | Bosque | 15 | Fenrir, Lobo Alfa (lv 26) | Lobo | Jabalí |
| 2 | Pantano | 30 | Rey Ciénaga (lv 40) | Esqueleto | Rana gigante |
| 3 | Cumbres | 45 | Yeti Milenario (lv 54) | Ogro | Yak |
| 4 | Volcán | 60 | Señor del Fuego (lv 74) | Demonio | Lagarto de lava |

**Diferencia con la guía:** en el juego real el jefe de las Cumbres es el **Yeti Milenario** (no el lobo de hielo) y el del Bosque es **Fenrir, Lobo Alfa**; la tabla de bloqueos de la guía §12 hay que corregirla con estos nombres. **[confirmar]**

Cada bioma repite el mismo **layout interno** (offsets relativos a `x0`): plaza/aldea (~y 700–900), zona de tala (`WR`), veta de minería (x 430–1600, y 60–190), estanque (x 480–980, y 1180–1370), río (y 1238–1302), lago solo en Pradera (x 1304–1630), guarida de monstruos (~x 1430–1700, y ~610) y jefe en `x0+2130, y 740`.

**Paso entre biomas:** compuerta en `x = k·BW`, abierta en `y 712–826` (el resto es acantilado, `cliff()`). Se abre con `S.boss[k-1]=1`.

## 4. Estaciones (7 por bioma, mismas posiciones relativas a `x0`)

Banco (90,710) · Tienda «Ru» (300,710) · Fogata (195,795, skill `co`) · Horno (90,875, `sm`) · Yunque (170,878, `sm`) · Taller (300,875, `cr`,`es`) · Escritorio/altar (340,778, `ins`). Interacción por cercanía (`nearS`, radio 80).

## 5. Entidades, ítems y sistemas

- **Skills (11):** Tala, Minería, Pesca, Cocina, Herrería, Artesanía, Escultor, Inscripción, Magia, Agilidad, Combate.
- **Árboles talables (5 tipos en `ACT.wc`):** árbol, roble, sauce, arce, tejo. **Menas (6 en `ACT.mi`):** cobre, estaño, hierro, carbón, mitril, adamantita. **Pesca (5 en `ACT.fi`)**: camarones, trucha, … Cocina 16 recetas, Herrería 10, Artesanía 7 **[aprox.]**.
- **Entidades de recurso (`N`):** tipos `wc`, `mi`, `fi` con índice `i`. Las `i<7` de árboles y `i<4` de rocas están horneadas en `sprites.js`; árbol 7, rocas 4–6 y puntos de pesca siguen animados por `t`.
- **Monstruos:** 11 normales + 5 jefes (`MD`, tamaño en `w,h` de 10×10 a 34×44 px). Nivel por `LVR`. Dibujo en `dSpr`/`dM`.
- **NPC:** Ru (tendero) con cuerpo propio; el resto de `N` son recursos y animales **[confirmar si hay más NPC con diálogo: banquero, herrero, guía]**.
- **Equipo:** armadura `AR` (cuero, bronce, hierro, acero, mitril, adamantita), espada `SW`, arcos `BOW` (5), bastones `STF`, herramientas por tier (madera, bronce, hierro, acero, mitril, adamantita). Colores en `TCOL`. Hay **calidades** (`~q`) y botín raro (`LOOT`).
- **Ítems base:** ~36 en `I` más derivados (equipo por tier, comida cocinada, runas) **[aprox.]**.
- **Magia:** 10 hechizos (`SPL`: chispa, curación, piedra, …) con runas.
- **Misiones:** ~25 en `Q`. **Colección** (`S.disc`), **Banco**, **Tienda**, **Fabricación**.
- **Clima y luz:** ciclo día/noche (`DAYLEN=360`, `sunS`), lluvia/tormenta en Pradera–Pantano, luciérnagas (`ambient`), `lighting()` con canvas de oscuridad, `post()` con filtro CSS, sombras con `Sd`/`SHD`.

## 6. Colisiones, movimiento y entrada

- `blk(x,y)`: bordes del mundo, `x>=BW` si el jefe anterior vive, `cliff()` (franja ±14 px en cada compuerta salvo y 712–826) y la lista `BLK` de rectángulos (agua). Todo en **px de mundo**, sin tiles.
- Movimiento **analógico** en píxeles: teclas `WASD/flechas` combinan `dx,dy` (8 direcciones), normalizado; velocidad base 95 px/s (×1,3 corriendo). Clic en el canvas: si hay entidad cerca (<26 px) la ataca/interactúa, si no `P.mv={x,y}` (ir al punto). Hay `bridgeWp` para cruzar el puente.
- **Consecuencia para isométrico:** la entrada por teclado hoy es en ejes de mundo. En isométrico hay que decidir si «arriba» va hacia arriba de la pantalla (mezcla de ejes) o a lo largo del eje del mundo. **[confirmar]**

## 7. Guardado

`localStorage` clave `tdo2`, versión `S.ver=10`, con migraciones (`migOld`). **No se toca** en ninguna fase.

## 8. Qué es HTML y qué es canvas

- **HTML:** cabecera `#hd`, panel de objetivos `#goalp`, botones de correr/auto-objetivo/volumen, `#log`, panel lateral con pestañas (Inv, Skills, Misiones, Colección, Magia, Banco…), tienda, diálogos `#dlg`, `toast`, botón Reiniciar.
- **Canvas:** barras de vida/maná/energía, números flotantes, banners, minimapa (`mmk`, dibujado desde `bgc` recortado), etiquetas con fuente VT323. Los iconos de ítems son canvas de 16×16 (`mkIcon`).
- Fuentes de Google (VT323, Pixelify Sans) por CDN.

## 9. Módulos del repo y su destino

| Módulo | Qué es hoy | Destino en el plan isométrico |
| --- | --- | --- |
| `ground.js` (`GR`) | suelo por tiles, cenital | se sustituye en F2 |
| `roads.js` (`RD`) | caminos por píxel, cenital | se sustituye en F2 |
| `water.js` (`WT`) | agua por píxel, cenital | se sustituye en F2 |
| `village.js` (`VG`) | aldea cenital | se sustituye en F3 |
| `stations.js` (`SX`) | estaciones animadas cenitales | se sustituye en F3 |
| `characters.js` (`CH`) | cuerpo de jugador/Ru cenital | se sustituye en F4 |
| `sprites.js` (`SP`) | caché de sprites horneados | se revisa en F4/F8 |
| `phaser-world.js` | descartado, no se carga | borrar en F8 |
| `game.js` | lógica + dibujo mezclados (822 líneas, 140 KB) | la lógica no se toca; el dibujo se aísla detrás de un módulo `ISO` |

**Actualización 11 oct 2026:** el dueño descartó el diseño antiguo y el modo `?old`; los módulos cenitales se borran en F1-B (ver `AGENTS.md`).

## 10. Preguntas para el dueño — RESUELTAS el 11 oct 2026 (respuestas en `AGENTS.md`, «Decisiones ya tomadas»)

1. **Canvas:** ¿pasa a ser responsivo y con `devicePixelRatio` (máx. 2), como pide la guía, o se queda en 640×400 y se escala por CSS?
2. **Escala:** ¿vale `ISO.TILE = 32` px de mundo por tile?
3. **Movimiento:** hoy es analógico (8 direcciones, sin cuadrícula). ¿Se mantiene así, con las teclas en ejes de pantalla, o prefieres teclas en ejes de mundo?
4. **Biomas:** ¿se conservan los 5 y se mantiene su orden y su layout interno repetido?
5. **Jefes:** ¿confirmas Yeti (Cumbres), Fenrir (Bosque), Rey Ciénaga (Pantano) y Señor del Fuego (Volcán) para la tabla de barreras?
6. **Tiers de equipo:** los reales son cuero, bronce, hierro, acero, mitril y adamantita (la guía añadía «runa» como propuesta). ¿Se queda en esos seis?
7. **Minimapa:** ¿se mantiene cenital como dice la guía?
8. **`?old`:** ¿se conserva el modo antiguo cenital mientras se construye el isométrico, o prefieres un solo modo con rama de Git?
