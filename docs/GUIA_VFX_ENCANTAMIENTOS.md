# GUÍA DE VFX DE ENCANTAMIENTOS — cómo están hechos y cómo replicarlos (28 oct 2026)

> Escrita para que otro agente pueda **añadir o rehacer un efecto** sin adivinar. Código: `src/r3d/enchfx3d.js` (3D en la mano), `src/item-icons.js` → `ench()` (icono), `src/enchant.js` (datos y lógica), `src/status.js` (estados).
> El dueño aprobó este aspecto el 28 oct 2026 («me fascinan»): **no cambies la técnica sin preguntarle**; añade efectos con ella.

## 0. Idea en una frase
Cada arma encantada lleva **una sola malla de 4 vértices** (la «funda») que el *vertex shader* coloca envolviendo la hoja y orientada a cámara, y cuyo *fragment shader* **pinta el efecto entero con ruido procedural** (sin texturas); encima, **un único `THREE.Points`** con partículas simuladas en la CPU en coordenadas de mundo. **2 llamadas de dibujo por héroe, en total, se vea lo que se vea.**

## 1. Dónde vive y quién lo llama
- `HeroAnim.update()` (heroanim3d.js) crea `this.ench = new EnchFx(this)` y llama `update()` cada fotograma.
- `EnchFx.update()` lee `ENCH.cur()` (encantamiento del arma equipada), `FX[efecto]` (o `FX[ENCH.D[e].fx]` para las versiones superiores) y `ENCH.vk(id)` (potencia por nivel).
- Las mallas cuelgan del objeto raíz del héroe (`root`, hijo directo de la escena del héroe) con `matrixAutoUpdate=false` y **matriz = inversa de `root.matrixWorld`**: así sus posiciones van en **coordenadas de mundo** aunque el héroe se mueva (las partículas se quedan atrás de forma natural). Hay que colgar de `root` porque los pases 2 y 3 del héroe en r3d.js ocultan el resto de hijos de la escena.
- Al rehacer el héroe (`MiniHero.setLook`, herom3d.js) se llama `anim.ench.dispose()`: **sin esto los efectos del arma anterior se quedan pegados**.

## 2. El EJE del efecto (`axis(M,A,B)`)
Del objeto del arma (`it.main`, con `tip` o `tipA/tipB`) se sacan, en coordenadas del arma, el arranque `A`, la punta `B` y el medio ancho de la hoja `bw`:
- espada/daga/mandoble: de la guarda (`y .09–.13`) a `tip`; `bw` .021–.042;
- bastón/cetro: el orbe (`tip − .12` → `tip + .05`), `bw` .045–.06;
- maza: `tip×.72` → `tip`; hachas: de `(0,tip.y)` a `tip` (cruza la cabeza);
- arco/ballesta: entre las palas `tipB → tipA`.
Luego `localToWorld` y `bw × escala del arma en mundo`. **Si el eje queda casi paralelo a la vista** (`|eje·vista| > .8`, el arco en reposo), se sustituye por un **eje vertical** centrado en el arma: si no, el efecto desaparece.

## 3. La FUNDA (vertex shader `SHELL_VS`)
Un quad con atributo `aQ` (x: 0 arranque → 1 punta; y: −1 abajo / +1 arriba). En el shader:
1. `fw` = eje Z de la cámara en mundo (`viewMatrix[i][2]`): hacia el espectador.
2. `s = normalize(cross(dirHoja, fw))`, con `s.y ≥ 0` (siempre «hacia arriba del mundo»).
3. `k = s.y/.866` (1 = hoja tumbada, 0 = hoja vertical). Alto de la funda: **arriba** `mix(sym, up, k)·R`, **abajo** `mix(sym, dn, k)·R`. Así el fuego (up 3, dn .95) crece hacia arriba aunque la hoja esté tumbada, y el vaho frío (dn 1.9) hacia abajo.
4. Largo: de `−e0` a `L+e1`, con `e = tip·R` más `rise·R` en el extremo que apunta arriba (las llamas suben sobre la punta de una espada alzada).
5. Se adelanta **4 cm hacia la cámara** (`+fw·.04`): se ve encima de la hoja pero sigue tapándose con el cuerpo (prueba de profundidad activa, `depthWrite` falso).
6. Varyings para el fragmento: `vAl` (distancia a lo largo de la hoja, en mundo), `vOff` (distancia con signo a través), `vOv` (vector de desplazamiento 3D) y `vQ` (coordenadas del quad).

## 4. El DIBUJO (fragment shader `SHELL_FS`)
Variables que usan todos los modos (todo en unidades de mundo):
- `ov = vOv + dir·(x − clamp(x,0,L))` → vector desde el punto MÁS CERCANO del eje (redondea solo las puntas); `r = |ov|`; `rise = ov.y` (altura sobre la hoja); `hz` = distancia horizontal.
- `gw = max(bw·estrechamiento, .022)`: radio mínimo del brillo (a zoom normal la hoja mide ~3 px).
- `ki = .22+.78·min(uK,1)` (intensidad por nivel) y `ux = clamp(uK−1,0,1)` (extras de las versiones superiores).
- Ruido: `h21` (hash), `vn` (value noise), `fbm` (4 octavas), `ss` (= smoothstep que admite bordes invertidos; **en GLSL `smoothstep` con borde0 > borde1 es indefinido**), `star` (estrella de 4 puntas).
- Dos salidas: `add` (luz, color sumado) y `mc/ma` (materia opaca: baba, sangre, humo). Al final se apaga antes del borde del quad (`ef`, nunca se ve el rectángulo) y se escribe **premultiplicado**: `rgb = add + mc·ma`, `alpha = 1 − (1−ma)(1−max(add))`.

Recetas por modo (`uM`):
| modo | técnica |
|---|---|
| 0 fuego | métrica estirada hacia arriba `length(hz·1.2, rise>0 ? rise·.4 : rise·1.9)`; `f = 1 − m/R + (fbm(x·10, rise·6 − t·4.2) − .52)·(.7 + 1.1·altura)`: abajo es sólido y arriba se rompe en lenguas; rampa de 4 colores (`uC3 → uC1 → uC2 → blanco`); el cuerpo de la hoja se atenúa para que el metal «al rojo» se vea |
| 1 escarcha | núcleo `exp(−r²/gw²·1.6)` + aura `exp(−r/2.4gw)` + vaho `fbm` que BAJA (`rise·7 + t·.6`) con métrica estirada hacia abajo + filamentos `|fbm−.5|` + destellos por celdas (`star·pow(sin)·step(hash)`) + escarcha cristalina sobre el metal |
| 2 sangre | aura `exp(−r/2.6gw)` modulada por un LATIDO doble (`exp(−(b−1)²·7)+.6·exp(−(b−1.75)²·7)`) + venas `|fbm−.5| < .06` dentro de la hoja |
| 3 veneno | capa OPACA (`ma`) que cubre la parte de la punta (`ss(.36,.66,u+ruido)`), más gruesa abajo (cuelga), con brillos por ruido y burbujas que crecen y revientan por celdas; poco brillo aditivo (**baba espesa, no neón**) |
| 4 físico | destello que recorre el filo cada 2,1 s (`exp(−((x + vOff·1.4 − pos)/.045)²)`, diagonal) + estrellitas en los filos que titilan |
| 5 rayo | 4 arcos: semilla nueva `floor(t·11)`; cada arco cubre un tramo al azar y su trayectoria `vn(x·11)·9gw + vn(x·38)·3gw`; línea `exp(−d/.006) + .4·exp(−d/.028)` |
| 6 vacío | humo con *domain warping* (`fbm(p + fbm(p·.7)·1.6)`) que sube; parte oscura opaca (`ma`) + hebras brillantes `|n−.56|` + filo violeta |
| 7 vampírica | velo oscuro opaco + regueros por «carriles» (`floor(vOff/.7gw)`) que corren HACIA LA EMPUÑADURA (`fract(x·2.2 + t·…)`) |
| 8 sagrada | núcleo + halo dorado + rayos `pow(|sin(ángulo·6 + t·.5)|,14)` desde el centro de la hoja + destellos |
| 9 cazadora | brillo esmeralda + 2 cintas de viento `vOff = ±gw(1.6+.6sin) + sin(x·14 − t·7)·.6gw` que viajan a lo largo |
| 10 arcana | coordenadas polares en la PUNTA: anillo con segmentos y anillo de marcas que giran en sentidos opuestos + orbe + flujo por el astil |
| 11 aplastante | 2 ondas de choque `exp(−((d − r(t))/.016)²)` que nacen en la cabeza y se apagan al crecer |

**Versiones superiores** (`ux > 0`): cada modo añade algo propio dentro de su rama (`if(ux>0.){…}`): llamas blancas + humo negro; púas de hielo; la hoja chorrea sangre; baba en toda la hoja + vapores; filo blanco fijo y doble destello; arcos el doble de lejos; humo con estrellas.

## 5. Las PARTÍCULAS (`PT_VS`/`PT_FS`, `spawn`, `sim`)
- Un `Points` de **96** (ranuras 0–3 reservadas a las gotas colgantes). Atributos: `position` (mundo), `aCol`, `aP` = (tamaño en mundo, alfa, estiramiento), `aTy` (tipo). `gl_PointSize = tamaño·uPpu`; **`uPpu` (píxeles por unidad) se mide en `onBeforeRender`** con el viewport y `projectionMatrix[5]` de la cámara ortográfica del héroe.
- Formas procedurales en el fragmento: 0 ascua/mota · 1 chispa/destello · 2 gota colgante (cuello + gota según `aK`) · 3 copo de 6 brazos · 4 vaho · 5 humo (opaco) · 6 gota que cae · 7 burbuja.
- Emisores por datos `FX[e].em = [[tipo, por segundo, {v, l, s, g, edge}]]`: nacen en un punto al azar de la hoja; velocidad + 18 % de la velocidad de la punta (al blandir salen despedidas); `g` = gravedad (negativa = sube).
- **Gotas** (`FX[e].drip`): colgadores con tiempo de crecimiento, tamaño y espera AL AZAR (nunca un ciclo repetido); crecen en el borde de abajo de la hoja, se sueltan con gravedad (9,5) y la inercia del arma, se sueltan antes si blandes rápido y al tocar el suelo se rompen en 2–3 gotitas.
- **Armadura y herramienta (aura sutil):** `auraList()` = piezas puestas con encantamiento de armadura (+ la herramienta mientras recolectas). `aura()` emite 1,6 motas/s por pieza a la altura de su ranura (`AUY`: casco .95, peto .58, guantes .45, piernas .28, botas .05…) o 4/s en la punta de la herramienta en la mano, del color del encantamiento aclarado un 25 %. Sin arma encantada, `auraOnly()` oculta la funda y solo simula partículas.

## 6. Nivel y potencia
`ENCH.vk(id)`: nivel I .35 · II .65 · III 1 · superiores 1,4 / 1,7 / 2 (`ENCH.vkOver = x` lo fuerza para PRUEBAS). En la CPU escala: tamaño de la funda (`kR`), ritmo y tamaño de partículas, nº y ritmo de gotas. En el shader: `ki` y `ux`.

## 7. Mezcla y color (trampas)
- Todo con `CustomBlending ONE, ONE_MINUS_SRC_ALPHA` y el color YA premultiplicado. **Lo luminoso debe escribir alfa** (= su brillo): el grado del héroe (`herograde3d.js`) divide por alfa y desecha alfa < 0,002, así que un aditivo puro con alfa 0 NO SE VE.
- Colores con `THREE.Color(hex)` → lineal. `#include <colorspace_fragment>` al final de los dos shaders.
- Esfera de recorte enorme (`boundingSphere` 1e5) en vez de `frustumCulled=false` (trinquete de `rules_check`).
- Un solo programa para todos los modos (rama por `uniform int uM`): cambiar de efecto no compila nada.
- Sin `//` dentro de líneas largas de JS (se comen el resto de la línea): usa `/* */`.

## 8. El ICONO (`ITEMICON.ench(lienzo, id, t)`, item-icons.js)
Sobre el icono ya hecho (2D o el render 3D antes de `toDataURL`): máscara de alfa → puntos de BORDE de la silueta (arriba, abajo, todos; barajados con hash) → halo del color detrás (`shadowBlur` ×nivel) → tinte `source-atop` → motivo del efecto (`MOT`: flame, frost, drip, star, bolt, smoke, vein, rays, leaf, rune, ring; tabla `EM`) en `lighter` (luz) o `source-over` (materia) → número romano del nivel. Animado en el hover vivo con `t`. La casilla (`sfx` en game.js) lleva `data-en` y su aura toma el color del efecto (CSS «ENCANT-ICONO»).

## 9. AÑADIR UN EFECTO NUEVO (lista de pasos)
1. `src/enchant.js`: fila en `ENCH.D` (nombre, `adj`, `col/col2`, `ic`, `lv`, probabilidad `p`, estado `sts` o pasivo, `only`/`cat`/`slots`/`tools` si se limita, `ess` o `essId`) y, si suelta esencia, su criatura en `DROP`.
2. `src/r3d/enchfx3d.js`: fila en `FX` con un `m` nuevo (colores, `R`, `up/dn/sym/tip/rise`, `em`, `drip`) y su rama `else if(uM==n)` en `SHELL_FS` usando `r`, `rise`, `hz`, `vOff`, `gw`, `R`, `t` y escribiendo `add` (y `mc/ma` si es materia). Añade un `if(ux>0.)` si tendrá versión superior.
3. `src/item-icons.js`: entrada en `EM` (y un motivo en `MOT` si hace falta).
4. Probar con GPU (`python tools/fast/ns.py start --gpu`, ver AGENTS «ENCANT-VFX-2»): `ENCH.ensure(id); CHEAT.give(id,1); use(...)` con nivel de combate suficiente (`S.xp.cb=2e6`), mantener el arma en la mano con `setInterval(()=>{P.cbT=performance.now()},400)` (no uses `NSTEST.hour`: congela el reloj), capturas a zoom máximo (`NSTEST.zoom(9)`) quieto y golpeando (`swing(performance.now())`), en I, III y superior (`ENCH.vkOver`).
5. `R3D.stats().heroe` debe subir como mucho 2–4 llamadas; `R3D.budget()` en Alta y Media; `tools/rules_check.py`.

## 10. IMPACTOS en el enemigo (`src/r3d/impact3d.js`, `R3D.impact`)
- **Una sola llamada**: un `THREE.Points` (≤ 260) en la escena PRINCIPAL (r3d.js lo crea junto a `FX` y lo actualiza tras `fx.update`); `depthTest:false`, `renderOrder` 40, premultiplicado como la funda.
- **Formas procedurales por tipo** en el fragment shader (`aP.z`): ascua, chispa en estrella, esquirla (rombo orientado por `aux`), gota, bocanada, humo oscuro, COLUMNA DE LUZ, RAYO (zigzag lineal con semilla; se apaga antes del borde del sprite), retícula, glifo rúnico (4 trazos entre puntos de una rejilla 3×3 elegidos por semilla), LENGUA DE LLAMA (gota invertida que ondula), burbuja, TAJO en media luna, GRIETAS en el suelo (7 líneas radiales que serpentean, en elipse 2:1 = suelo visto a 30°). Los anillos (`gring`/`ring`) siguen en el shader pero **el dueño los descartó (28 oct): no los uses**; la retícula de la Cazadora sí le gustó.
- **API**: `burst(m, efecto, k)` cuando el encantamiento SE APLICA (lo llama `ENCH.proc`); `touch(m, efecto, k)` 3–5 chispas del color en CADA golpe con arma encantada; `drain(m)` motas que vuelan al héroe (Vampírica; atracción por `tg`).
- **Recetas (`RECIPE`)**; la posición del enemigo sale de `where(m)` (centro, pies, radio y alto del actor 3D, como blood3d.js): fuego = lenguas de llama alrededor del cuerpo + ascuas · escarcha = púas de hielo que BROTAN del suelo en corona + esquirlas + vaho · sangre = salpicadura con gravedad · veneno = gotas + burbujas que suben + nube · físico = dos TAJOS en media luna + chispas · rayo = rayo desde el cielo + destello + chispas · vacío = IMPLOSIÓN (motas en espiral hacia el enemigo) + humo · vampírica = gotas + drenaje · sagrada = columna de luz + destellos · cazadora = retícula · arcana = glifos que flotan alrededor · aplastante = GRIETAS en el suelo + cascotes + polvo. Las superiores llaman a su base con más potencia y añaden su detalle.
- **Probar**: `R3D.impact.burst(m,'fuego',1)`; para capturar, `setTimeout(()=>R3D.impact.ts=0,110)` congela el tiempo de los impactos (vuelve a `1` después). Encuadre: `ISO.toCanvas(m.x,m.y,TER.standZ(m.x,m.y))` da la posición del enemigo en pantalla.
- **Impacto nuevo** = una función en `RECIPE` (+ un tipo en el shader si hace falta) y su color en `TOUCH`.

## 11. FUNDA DEL CUERPO del enemigo (`src/r3d/bodyfx3d.js`, `R3D.body`) — lote ENCANT-VFX-CUERPO
El dueño pidió que el impacto y los estados usen **el mismo estilo que la funda de las armas** (quemado = el fuego del arma; incinerado = el mismo, más rojo). Así está hecho:
- **Una llamada**: `InstancedBufferGeometry` de un quad, ≤ 64 instancias, rellenadas cada fotograma (`put`). Mismo lenguaje que `SHELL_FS`: `fbm`/`vn`/`h21`, `ramp(f)` (c3 oscuro → c1 → c2 → blanco), materia que tapa (`mc/ma`) + luz que suma (`add`), premultiplicado, y `ef` apaga el quad antes del borde.
- **Eje por instancia** (`iA` arranque, `iD` dirección + largo): cuerpo = vertical (pies → cabeza: las llamas SUBEN); arco = de un enemigo a otro. El quad se adelanta hacia la cámara **a lo largo de la vista** (`iB.z`): en ortográfica no cambia la imagen, solo la profundidad → se pinta sobre el enemigo y se oculta tras muros/árboles (`depthTest:true`).
- **Cuerpo = cápsula** de radio `rb` (caja real del modelo, `where()`; el jugador usa la posición del héroe): `sd` < 0 dentro, `o` = distancia fuera, `ins` = máscara de dentro. **Nunca dibujes la línea limpia de la cápsula**: usa `rimN()` (borde roto por ruido) o un brillo hacia fuera; un contorno continuo se lee como «cápsula de cristal».
- **Modos** (`iW.w`): 0 fuego · 1 costra de hielo (Voronoi; `u` la hace crecer de pies a cabeza) · 2 escarcha que sube (nivel = cargas) · 3 veneno · 4 electricidad · 5 humo del vacío (Condena late más rápido con `u`) · 6 ácido · 7 luz sagrada · 8 mojado · 9 sangre · 10 vapor · 11 nube tóxica · 12 columna de luz · 13 ARCO entre dos puntos · 14 estallido del vacío · 15 destello de impacto. `hi` (iP.w) = versión fuerte.
- **Estados** (`ST`, clave = clave de `STS.D`): `scan()` pinta como mucho 2 fundas por enemigo (1 en Baja/Mínima), aparece en 0,22 s y se apaga en los últimos 0,38 s. Las partículas del `Aura` (impact3d.js) solo acompañan (ascuas, púas, gotas…): el tinte y las llamas ya los pinta la funda.
- **Destellos de un uso** (`SHOT`, `shot(m,tipo,k)`, `arc(a,b,tipo)`): los piden las `RECIPE` (impactos de encantamiento) y las `REACT` (reacciones) de impact3d.js. Envolvente: sube en 8 % de la vida y cae con `(1-u)^1.2`.
- **REACCIONES** (`R3D.impact.react(nombre, e, objetivos)`, llamadas desde `status.js` con `V()`): apagado (vaho + humo gris) · electrocutado (rayo + arcos a los cercanos) · cadena · congelado (costra que crece + púas) · deshielo (la congelación estalla en esquirlas) · vapor (nube que se hincha) · nube (nube tóxica rasante + arcos verdes a los contagiados) · purga (columna dorada + humo violeta expulsado) · juicio · disolución · condena (implosión → estallido) · incinerar (arcos de fuego rojo a los que prende).
- **Lecciones de afinado**: la escena principal pasa por el BLOOM → intensidades ~½ de las de la funda del arma (que pasa por el grado del héroe); las partículas aditivas grandes (`T.puff`) con colores claros se convierten en bolas blancas: para vapor/humo usa `T.smoke` (materia) con `al` ≈ .5; el fuego necesita huecos de baja frecuencia (`gap`) o dibuja un marco alrededor del cuerpo.
- **Probar**: `R3D.body.ts=0` / `R3D.impact.ts=0` congelan (vuelve a 1). `STS.add(m,'burn',{dur:60000,v:1})` (con `v:1` el DOT no mata al enemigo de prueba: es el 4 % de su vida máx. por tick). Reacción a mano: `R3D.impact.react('vapor',m)`.
- **Coste medido** (RTX 4070, 10 orcos × 2 estados = 20 fundas, zoom máx.): +2 llamadas, +80 triángulos, ≈ +0,2 ms de GPU; `R3D.budget()` ok en Alta (1,54 M / 399) y Media (0,75 M / 324).

## 12. Gotas, números y letreros (lote DAÑO-LEGIBLE)
- **Todo lo que CAE lleva suelo**: las partículas de impact3d.js no usan profundidad, así que una gota que nace en el centro del cuerpo se ve atravesarlo y hundirse en el terreno. Las gotas nacen en el borde (`edge()` para estados, `spray(...,{out:W.rad})` para impactos) y paran en `fl` (pies del enemigo) con una salpicadura pequeña.
- **Números de daño de enemigos**: siempre `splat(x,y,d,col,h,crit,sk,m)` con el enemigo `m`: nacen JUSTO ENCIMA de su placa e iconos (alto medido en `m._nph`) se quedan quietos ~0,55 s y luego suben (lote DAÑO-PAUSA), cada uno en un carril libre para no solaparse; `sk` < 1 para el daño por tiempo. Su color = `STC[clave del estado]` (añade la clave al crear un estado con daño nuevo; el oro `#c9a24a` es solo del golpe máximo).
- **Letreros**: `say(e,texto,color,dy,'sts'|'react')` en status.js; la pila por enemigo y las reglas anti-repetición ya están ahí: un estado o reacción nuevo solo necesita llamar a `say` con su clase.
