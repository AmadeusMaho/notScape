# NotScape · Guía de PERSONAJES 3D (héroe, PNJ y humanoides)

> **🟥 REGLA DEL DUEÑO (18 oct 2026): NADA DE «VESTIDITO».** Ningún modelo (héroe, enemigo, jefe, animal humanoide) lleva el cono de túnica que cubría las caderas: **torso + piernas normales** (camisa/chaleco hasta la cintura, abdomen y cadera en color de pantalón, piernas visibles). El vestido/túnica larga existe SOLO para PNJ femeninos contados (**Ru, Aldeana**) y para los **MAGOS** (**Hechicera, bruja, b2, k2**: túnica larga), con `dress:true` Y el id en la lista blanca `Mini.DRESS_OK` (`mini3d.js`; `buildHuman` pasa el id). Receta vigente de modelos nuevos: **§7 (al final)**.


> **⚠ ACTUALIZACIÓN 17 oct 2026 (tarde): el MODELO descrito aquí (héroe facetado `hero3d.js`) fue SUSTITUIDO por el estilo «diorama» (`src/r3d/mini3d.js` + `herom3d.js`), por decisión del dueño (no le gustaba el facetado; quiere todo por código, sin assets externos). Lo que SIGUE vigente de esta guía: reglas de estilo (contorno oscuro, UN acento de color, legibilidad ARPG, color sin relieve en personajes), los datos de atuendos (`outfits3d.js`) y los nombres/roles de PNJ. Lo que ya NO: las proporciones, la construcción `loft` facetada, las capturas `disenos_*.jpg`. Lee el «Lote R3D-HEROE-DIORAMA» de AGENTS.md y el bloque «CAMBIO DE RUMBO EN PERSONAJES».**
>
> **Estado (histórico):** diseños APROBADOS por el dueño el 17 oct 2026 («me gustaron mucho los diseños y los vamos a usar»).
> **Manda sobre** cualquier referencia 2D de personajes (`style-organic.js` `BUILD`/`PEOPLE`, el «héroe galleta»). Para el escenario manda `GUIA_3D_PORTEO.md`.
> **Leer antes de tocar:** este archivo → `src/r3d/outfits3d.js` (datos) → `src/r3d/hero3d.js` (modelo) → la hoja `docs/style-reference/r3d/disenos-personaje.html`.
> **Capturas de referencia:** `docs/style-reference/r3d/disenos_heroe.jpg`, `disenos_pnj.jpg` (frente arriba, espalda abajo), `heroe3d_hoja.jpg` (16 poses), `heroe3d_ciclos.jpg` (andar/correr), `heroe3d_tela.jpg` (ropa con física).
> **Estilo de escena objetivo (17 oct 2026):** sobre todo esto irá el grado «óleo oscuro» NRftW (`GUIA_3D_PORTEO.md` §4.9). Los personajes **no cambian de diseño**; conservan contorno negro, rim y UN acento. Si el óleo resta legibilidad a un personaje, se baja la intensidad del grado, no se toca el personaje.

---

> **Lote R3D-HEROE-NR (17 oct 2026, pedido del dueño: «como No Rest for the Wicked», «que se vea más la cara», «con el filtro del escenario»):** cabeza ×1,15 (`HEADK`, se escala el hueso), manos ×1,2 y botas más pesadas; la cara se construye por **estructura de valores** (cuencas oscuras, arco de ceja y nariz que cogen luz, mentón claro) porque a zoom de juego mide ~12 px; material de personaje `toon(...,{chr:1,skin:1})` (pincel en las bandas, pies en sombra fría, relleno desde la cámara, piel cálida) + contraluz frío; el héroe recibe el grado óleo (`src/r3d/herograde3d.js`, al 85 %). El contorno negro y el acento único se conservan. Detalle y perillas: AGENTS.md «Lote R3D-HEROE-NR».

## 1. La idea en una frase

**Gente corriente de un mundo duro, contada por su ROPA.** Adultos de proporciones creíbles, low-poly facetado con contorno negro, colores de tela apagados (tierra, ceniza, musgo, vino, acero) y UN acento por personaje. El oficio o el papel se lee a 20 m solo por la silueta: el delantal, el tabardo, la capucha, la hombrera, la espalda encorvada. Nada «cute», nada de colores de caramelo, nada de cabezas gigantes.

## 2. Reglas de estilo (para replicar sin mirar el código)

### 2.1 Proporciones
- **~6,3 cabezas** de alto. Modelo en metros: adulto ≈ 1,78 m; en el mundo ×`HS=0.7` ⇒ **1,25 tiles** (una casa ≈ 2,2 héroes, como en un ARPG).
- Largos fijos para TODOS (las animaciones dependen de ellos): muslo `.44`, espinilla `.44`, brazo `.29`, antebrazo `.25`, tobillo `.078` (`L_TH`, `L_SH`, `L_UA`, `L_FA`, `ANK`). La complexión cambia **anchos**, nunca largos.
- Complexiones (`BODY`, medidas en m): `m` hombros .205 · `f` hombros .172 y caderas .162 (más anchas que el pecho) · `robusto` cintura casi como el pecho (.178/.2), cuello grueso · `anciano` ×.95, hombros caídos, **encorvado** (columna +.34 rad, cuello −.45, codos doblados). Una complexión nueva = una fila en `BODY`.
- Cabeza: `head` .97–1.02 por complexión × `HEADK=1.15` global (Lote R3D-HEROE-NR: antes era «ligeramente pequeña» y la cara no se leía en el juego). Sigue siendo adulta, no «galleta».

### 2.2 Construcción (geometría)
- Todo con **`loft()`**: anillos de **6–10 lados** apilados (`[y, rx, rz, ox, oz]`), sin índice ⇒ **caras planas** (facetado). Brazos/piernas 7 lados, torso 8, cabeza 8, cinturón 10. Nada de esferas suaves: si algo es redondo, `ico()` (icosaedro de 20 caras, con un poco de jitter).
- Piezas por capas, cada una **un poco más grande** que la de debajo (×1,05–1,16 en radio): piel → túnica → gambesón/brigantina → tabardo/delantal. Así no hay z-fighting y el contorno marca cada capa.
- **Detalles de 2–3 polígonos**: remaches = icos de 9 mm, costuras = anillos finos más oscuros (×.72), hebilla = caja dorada. Si un detalle no se ve a 30 px, sobra.
- Mano = loft de 6 lados + pulgar en caja. Pie = loft tumbado + suela oscura. Cara (R3D-HEROE-NR): cabeza con arista al frente; cada rasgo se apoya con `surf()/onF()` en su faceta. Manchas que se leen de lejos: cuenca oscura (`shade(skin,.58)`), arco de ceja y mentón claros, nariz sobre la arista, boca oscura; detalle de cerca: blanco del ojo, iris y brillo (sin luz).

### 2.3 Color
- **Tela del jugador/PNJ siempre pasa por `tone(c)`** (−18 % saturación, −10 % brillo). Los metales no.
- Paleta base (hex de partida, no obligatorios): tierra `#5a4632` `#7a6a4a` `#6a4a30` · ceniza `#5a5450` `#3e3a40` · musgo `#3a4a32` `#3a4436` · vino/sangre `#6a2a2a` `#5a2a26` · noche `#33335a` `#2a2a44` · cuero `#5a3e2c` `#4a3426` · metal `#9aa2b0` (mezclado ×.25–.3 con el tono del tier) · lino `#c8bca0` · oro viejo (acentos) `#d8b050` `#a08a60`.
- **Un acento por personaje** (la bufanda mostaza del Errante, el emblema dorado del Guardia, el pañuelo rojo de la Herrera, el amuleto de la Penitente). El resto, apagado.
- Valores: cada personaje debe tener **contraste claro-oscuro** entre torso y piernas o entre prenda y capa superior, para que la silueta no sea una mancha.

### 2.4 Material y acabado
- Material: `toon(color,{flat:1, rim:1.4, chr:1})` (+ `skin:1` en la piel; R3D-HEROE-NR) (bandas suaves + contraluz) + casco de contorno **negro** `hull(geo, .019)` (las piezas pequeñas .006–.013). Personajes = contorno negro; escenario = contorno del color del objeto oscurecido (no mezclar).
- **Textura de personajes: SOLO COLOR, NUNCA RELIEVE.** Con bandas toon, un bump pequeño salta de banda y se ve como camuflaje (probado y descartado). `hero3d.js` lo fuerza: `texS×.28`, `texA .6`, `texB 0`. Clases: `tela`, `cuero`, `metal`, `pelo` (tabla `TEXOF` + `o.mat.tex` en cada pieza).
- Brillo propio (sin luz): ojos de la capucha (`glow`), orbe del báculo. Úsalo con mucha moderación.

### 2.5 Ropa con física (`cloth3d.js`)
- Lo que cuelga y se mueve es **tela simulada**: bufanda (puntas 2×7), capa 7×10, faldones de túnica/delantal/tabardo 4×4 o 4×6, coletas (cuerda de 6). Lo que no se mueve (gambesón, capelina, cuello de piel) es rígido.
- La tela va como lámina **con grosor** para tener contorno. Colisiona con cápsulas del cuerpo.
- Añadir prenda colgante = entrada en `_buildCloth` (rejilla, reposo `rest(i,j)`, anclas en un hueso). Largo por datos (`skirt: corta .28 · rodilla .5 · larga .72`).

### 2.6 Silueta: la prueba
Antes de aprobar un diseño nuevo, míralo **en negro sobre gris a 40 px de alto** y **de espalda**: tiene que reconocerse el papel. Los aprobados lo cumplen: delantal (Tendero, Herrera), tabardo + lanza (Guardia), espalda curva + barba (Anciano), capucha en punta (Bandido), hombrera única (Mercenario), carcaj (Cazadora), falda larga + capelina (Penitente), bandolera + bufanda (Errante).

### 2.7 Qué NO hacer
Cabezas grandes, ojos enormes, mejillas sonrosadas, colores saturados de caramelo, contornos marrones en personajes, lisos sin capas, armadura completa brillante en PNJ corrientes, relieve en la textura del personaje, más de un acento de color, piezas que cambien los largos de los huesos.

## 3. Diseños aprobados (datos exactos en `src/r3d/outfits3d.js`)

### 3.1 Héroe — ATUENDOS (el jugador elige apariencia; el atuendo pone la ropa)
| id | Nombre | Piezas clave | Acento | Desbloqueo (propuesta, pendiente de confirmar) |
| --- | --- | --- | --- | --- |
| `errante` | **Errante** (BASE, inicial) | gambesón acolchado `#7a6a4a`, bandolera + bolsa, bolsas y cuchillo al cinto, túnica corta, bufanda | bufanda mostaza `#b8862e` | inicial |
| `penitente` | **Penitente de ceniza** | túnica larga acampanada `#5a5450`, capelina + capucha baja `#3e3a40`, vendas, cinturón de cuerda | amuleto dorado | Plegaria/Magia |
| `mercenario` | **Mercenario de frontera** | complexión robusta, brigantina remachada, hombrera izquierda, cuello de piel, arremangado, barba | remaches latón | Cuerpo a cuerpo |
| `cazadora` | **Cazadora del bosque** | chaleco de cuero `#5a4632`, pañuelo en la cara `#3a4436`, carcaj, vendas, cuchillo | (verde musgo) | A distancia |

La capa sigue siendo **objeto raro** (decisión anterior) y se puede llevar con cualquier atuendo; con capa la bufanda se oculta.

### 3.2 PNJ y humanoides
| id | Nombre | Piezas clave | Sustituye / se usa en |
| --- | --- | --- | --- |
| `tendero` | **Tendero** | robusto, delantal de lino `#c8bca0`, arremangado, barba corta, calvo | Ru (`PEOPLE.ru`) y tenderos de interiores |
| `guardia` | **Guardia de la aldea** | tabardo vino `#6a2a2a` con emblema dorado sobre placas, yelmo de hierro, lanza | NUEVO: puertas de aldea / compuertas de bioma |
| `herrera` | **Herrera** | delantal de cuero `#4a3426`, pañuelo rojo, arremangada, moño | NUEVO: junto al yunque/horno |
| `anciano` | **Anciano sabio** | encorvado, túnica larga noche `#33335a`, capelina, barba larga blanca, báculo de orbe | NUEVO: dador de misiones / altar |
| `bandido` | **Bandido** | capucha alta, pañuelo en la cara `#5a2a26`, chaleco, daga | criatura `bandido` (creatures.js); Rufo = misma base + capa |

**Variación de PNJ repetidos** (aldeanos, bandidos): misma ficha + `app` aleatoria determinista por id (pelo, piel, color de prenda dentro de la paleta) — nunca `Math.random`.

## 4. Cómo crear un personaje nuevo (receta)
1. Escribe su **papel en 3 palabras** y elige **1 pieza de silueta** que lo cuente (tabla §2.6).
2. Copia la entrada más parecida de `outfits3d.js`; cambia `outfit` (piezas) y colores dentro de la paleta §2.3; **un** acento.
3. Si falta una pieza: añádela en `hero3d.js` bloque «VESTUARIO» siguiendo §2.2 (loft facetado, capa ×1,05–1,16, color con `tone`, contorno, textura de solo color) y documenta la clave en la cabecera del bloque y aquí.
4. Míralo en la hoja (`disenos-personaje.html?set=heroe|pnj`, arrastrar para girar) de frente, de espalda y en silueta; captura y pide visto bueno al dueño.

## 5. Planificación (también en `GUIA_3D_PORTEO.md` §6 y `AGENTS.md`)
- **F6b · Atuendos del héroe** (siguiente para personajes): guardar el atuendo en `S.app.outfit` (id de `OUTFITS`); el editor de personaje (`creator.js`) muestra los atuendos con vista 3D (reusar `Hero` en un canvas propio); `heroState3D()` en game.js pasa `look.outfit` del atuendo; el equipo (`gearOpts`) se superpone: peto (`pl`) sustituye a gambesón/brigantina, yelmo oculta pelo/pañuelo. Desbloqueos: confirmar con el dueño (propuesta en §3.1). Bufanda: color elegible (`S.app.scarf`).
- **F7a · PNJ y humanoides 3D**: Ru → `tendero` en la escena 3D (como el héroe: renderer propio o directo en la escena cuando F2/F4 lo permitan), con su animación de saludo/respiración reciclada; colocar `guardia`, `herrera`, `anciano` en la aldea (datos en el layout de aldea, con diálogo); criatura `bandido` y Rufo con este modelo (combate con `HERO.pose` igual que el héroe). Bruja y otros humanoides de `creatures.js` siguiendo la receta §4.
- **F4b · Interfaz dark fantasy** debe usar la misma paleta §2.3 (cuero, ceniza, oro viejo) para casar con los personajes.

## 6. Mapa del código
- `src/r3d/outfits3d.js` — DISEÑOS (datos). Fuente única.
- `src/r3d/hero3d.js` — modelo: `BODY`, `HAIR`, `loft/ico/box`, `tone`, `setLook` (bloques TORSO, CUELLO/CABEZA, PELO/YELMO, BRAZOS, PIERNAS, EQUIPO, **VESTUARIO**, ROPA CON FÍSICA, BUFANDA), `_buildCloth`, animación (`_idle`, `_fromHero`, `_gait`, IK).
- `src/r3d/cloth3d.js` — física de tela. `src/r3d/materials3d.js` — `toon` (opciones `flat`, `rim`, `tex`…), `hull`, `inkMat`.
- `docs/style-reference/r3d/disenos-personaje.html` — hoja de diseños; `heroe-3d.html` — visor de poses/equipo.

## 7. RECETA VIGENTE: figuras `Mini` sin vestido, con complexión (Lote R3D-SINVESTIDO, 18 oct 2026) — LEER ESTO PARA CREAR MODELOS NUEVOS

**Qué cambió.** `Mini` (`src/r3d/mini3d.js`) ya NO dibuja la túnica-cono. El cuerpo base es: *camisa/chaleco* (lathe de la cintura a los hombros, color `robe`) + *abdomen y cadera* (color `pants`) + *esfera de cadera* en el hueso `pelvis` (une torso y piernas y no gira con el pecho) + piernas completas (muslo, rodilla, espinilla, bota). El cinturón (`belt`) va en la cintura. El vestido/túnica (`dress:true`, con `hem` bajo ≈ .06–.1 para túnica larga y `flare` 1,05–1,15) se conserva solo para la lista blanca (Ru, Aldeana, Hechicera y magos: bruja, b2, k2). Si un spec pide `dress` sin estar en `Mini.DRESS_OK`, el código lo ignora y avisa por consola (`[Mini] el vestido está prohibido…`), y `tools/r3d/actors_lint.py` falla si un actor lo lleva.

**Parámetros de complexión del spec** (todos opcionales; 1 = el humano medio del héroe):

| Parámetro | Efecto | Valores típicos |
|---|---|---|
| `w` | anchura general (torso, brazos, piernas hasta ×1,4) | goblin .8 · humano 1 · orco 1,25 · ogro 1,45 · gigante/golem 1,5–1,8 |
| `chestW` | pecho y hombros más anchos que la cintura (silueta en V) | 1,1–1,15 en guerreros |
| `waist` | cintura | .76–.88 para V marcada; .7 esqueleto |
| `belly` | barriga (se suma al radio de la cintura) | .06–.1 ogros/gigantes |
| `armW`, `legW` | grosor de brazos / piernas | goblin .85/.9 · orco 1,35/1,2 · golem 1,5/1,3 |
| `stance` | separación de piernas (postura firme) | 1,12–1,2 en brutos |
| `headK` | tamaño de cabeza | goblin 1,18 (cabezón) · ogro/gigante/golem .8–.88 (cabeza pequeña = mole) |
| `lean` | encorvado del torso en rad (la cabeza lo compensa al animar) | goblin .35 · ogro .14 · orco .08 |
| `pauld`, `spikes`, `spikeC` | hombreras (esferas en el hombro, siguen al brazo) y n.º de pinchos | orco gris ×3 · oni dorada ×3 · b0 placa ×3 |
| `strap` | bandolera/arnés cruzado en el pecho | cuero oscuro; evitar negro puro sobre piel clara |
| `plate` | peto sobre el pecho | jefes con armadura |

**Arquetipos (copiar y variar):**
- **Bruto (orco, oni, b0, b4):** `w 1.25–1.35, chestW 1.12–1.15, waist .8–.85, armW 1.3–1.4, legW 1.15–1.2, stance 1.15, pauld + spikes`. Torso al aire con la piel como `robe` y arnés (`strap`) = amenaza sin ropa de tela.
- **Mole (ogro, gigante, b3, k3, golem, k5):** `w 1.45–1.8, belly .06–.1, headK .8–.88, legW 1.25–1.3, lean .1–.15`. Cabeza pequeña sobre masa enorme.
- **Ágil/rastrero (goblin, shinobi, bandido):** `w .8–.95, armW .85, headK 1.1–1.2, lean .35 (goblin)`. Orejas y nariz grandes (`ears`, `nose` en `actors3d.js`).
- **Mago (Hechicera, bruja, b2, k2):** TÚNICA larga permitida (`dress:true, hem:.06–.1, flare:1.05–1.12`, ribete dorado en el bajo), sombrero/capucha y báculo. Un mago nuevo debe añadirse a `Mini.DRESS_OK`.
- **No muerto (esqueleto):** `robe` = hueso, `waist .7`, costillas con toros oscuros finos en `acc`.

**Cómo hacer un modelo nuevo (pasos):**
1. Elige arquetipo y copia una fila de `HUM` (`actors3d.js`) o una de `MINI` (`mini3d.js`, héroe/PNJ). **Altura** = `CRE.H`.
2. Ajusta SOLO con los parámetros de la tabla + `top` (cabeza: cuernos, orejas, casco, pelo) y `acc` (arma con `hold()`, capas cortas, alas, llamas). No toques la lathe base.
3. Silueta primero: debe distinguirse como mancha negra a 40 px (§2.6). Un acento de color, ojos que brillan (`eye`), ceño duro (`brow`).
4. Verificación: `python3 -I tools/r3d/actors_lint.py` (OK) y una hoja con `tools/r3d/actors_sheet.py out.png dia id1,id2,…` o el visor `actores-3d.html` (`actors_check.py`).
5. Si es un PNJ femenino con vestido o un MAGO nuevo (excepciones): añade su `id` a `Mini.DRESS_OK` y a la lista de `actors_lint.py`, y anótalo en AGENTS.md. Solo con permiso del dueño.

**Hecho en este lote:** héroe y todos los humanoides sin vestido; enemigos rediseñados (goblin cabezón y encorvado, orco ancho con hombreras de pinchos, ogro con barriga y cabeza pequeña, oni en V con hombreras doradas, demonio esbelto con pinchos, golem de bloques, jefes con peto/hombreras); **Ru = mujer** (vestido largo y delantal, moño con lazos dorados, mejillas rosadas, sonrisa; `RU` en `actors3d.js`). **Pendiente / ideas:** más variedad de rostro por criatura; ropa rota/vendajes por detalle; Guardia, Herrero y Anciano (F7a) usando estos arquetipos (Herrero = bruto humano con delantal corto SIN falda; Anciano = `w .95`, barba larga; Guardia = `MINI.guardia`).

## 8. ARMADURAS DEL JUGADOR (Lote R3D-ARMADURAS, 18 oct 2026)
- **Regla del dueño:** tras modelar algo, verlo SIEMPRE de cerca (visores y `*_sheet.py`/`actor_close.py`).
- Código: `src/r3d/armor3d.js` (`armorHooks`, `chestMetal/Leather/Robe`, `legs`, `gloves`, `boots`, `helm`, `cape`, `shield`). Entrada: `look.arm = {a,l,g,s:{f,t}, h,f,c:{k,q,leg}}` (familias m/cu/tu, 11 tiers; casco/botas/capa por bioma y calidad). `game.js` → `armorInfo()`.
- Receta para una pieza nueva: función en `armor3d.js` que usa `mkP(part)` (hornea rotaciones en la geometría), colores de `tierPal(t)`, brillo con `GLO()`; engancharla en `armorHooks` (`top` = cabeza, `acc` = cuerpo); revisarla con `python3 -I tools/r3d/armor_sheet.py out.png <set> 45 1500 700 <ids> <cols>` y de espaldas con `az=225`.
- Cuadrúpedos: escribe el cuerpo con `PB()` (largo en X como en creatures.js); si no, salen anchos.

## 9. CULTURAS: todo el equipo de un tier es de la cultura de su bioma (Lote R3D-CULTURAS, 18 oct 2026)
- Regla del dueño: Pradera (medieval) · Bosque (élfico) · Pantano (tribal) · Cumbres (nórdico) · Oriental (samurái) · Volcán (infernal). Tabla tier/madera → cultura en `armorcult3d.js` (`CULT_OF`) y `game.js`.
- Armaduras/escudos: `armorcult3d.js` (`chestC`, `legsC`, `glovesC`, `shieldC`, `robeC`). Armas: `weapons3d.js` (`cultWeapon`). Peto SIN pectorales: sigue el perfil del torso (`torsoR`).
- Receta de arma nueva por cultura: añade la rama `cu===N` en la función del tipo (mismo marco que `BUILD`), exponla con `?set=armas` y revisa de cerca. Capturas en `docs/style-reference/r3d/armaduras_culturas.jpg` y `armas_culturas_*.jpg`.
