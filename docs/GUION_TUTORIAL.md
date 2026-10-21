# NotScape · GUION DEL TUTORIAL NUEVO — «La Isla del Principio» (BORRADOR para que lo revise el dueño)

> **Estado:** guion en papel, NADA implementado. Todo lo marcado **[PROPUESTA]** lo inventó el agente y el dueño lo aprueba o lo cambia; **[★]** = pregunta abierta. Debe ser coherente con `docs/LORE.md` (si el dueño amplía la historia, se actualiza ese archivo primero).
> **Decisiones del dueño que ya entran:** isla tutorial aparte (estilo OSRS) · dentro se enseña todo y se elige el camino actual (guerrero/arquero/mago) · el final es un JEFE: un **ángel caído invocable** que nos ha **elegido** («para liberar el mundo») · tras la cadena **el cielo arde**, objetivo **«Escapa»** (correr hasta el final mientras todo se quema, iluminación única) · despertamos **un siglo después en la playa de la Pradera** con una mini-introducción · **niveles:** empezamos en 0 y cada tarea sube hasta 1 (bloqueado a nivel 1 en la isla, sin farmeo) y **al llegar al mundo real se pierden todos los objetos**.

> **⚑ v2 (20 oct 2026): el dueño respondió las preguntas. MANDA la sección «DECISIONES v2» del FINAL de este archivo; donde el texto de arriba choque (Pluma del Vigía, «El Vigía», Ru nieta/o, 100 años), vale v2.**


---
## 0 · Premisa en una frase
*Eres un exiliado varado en la isla donde los ángeles dejan a los que dudaron. Un ángel caído, el último que vigila la isla, te pone a prueba, te elige y, justo cuando el cielo arde, te envía lejos de su ruina; despiertas cien años después, en una playa que ya no recuerda a nadie.*

**Tono:** poco texto en pantalla, frases cortas y orales (voz de `LORE.md §3`), lo épico lo hacen la luz, el sonido y el ritmo, no los discursos. **Ambigüedad intencionada (LORE §2):** nunca se dice «eres un exiliado» ni «no lo eres»; la isla puede ser *solo* un sitio donde dejan a los que dudan. El ángel dice «te elegí para liberar el mundo» con las MISMAS palabras que usa Nul'ru en el canon: el jugador no sabrá si fue una bendición o un error.

---
## 1 · ¿Cómo explicar los 100 años de «hibernación»? (el dueño pidió ideas) ★
**No hace falta que el jugador «lo hiciera»: se lo HICIERON.** Eso evita explicar una técnica. Cuatro opciones (se pueden combinar); mi recomendación es **A + C**.

| | Idea | A favor | En contra |
|---|---|---|---|
| **A** | **La isla está FUERA del tiempo mortal** (limbo en la frontera de los tres reinos: cielo, infierno y mortal). El ángel, al morir, te empuja de vuelta al reino mortal: el cruce «cuesta» un siglo. | No necesita magia nueva: es «el limbo no cuenta los años». Encaja con el exilio («vagan sin rumbo, con el acceso al paraíso negado»). | Obliga a que el cruce sea un momento de juego (la barca/pluma). |
| **B** | **Lo hizo el fragmento del TIEMPO** (canon: sangre, tiempo, vida, cuerpo). | Muy potente. | **Responde la pregunta abierta del dueño** (quién tiene los otros 3 fragmentos) → no se hace sin su aprobación explícita; se puede dejar SOLO como insinuación (un reloj de arena que gotea cuando te despiertas). |
| **C** | **El capullo de plumas:** el ángel, moribundo, te envuelve en su última ala; la «ceniza de ala» detiene lo que toca. Te encuentran (te encuentras) enterrado en la arena de la playa, con musgo y una pluma que no se apaga. | Imagen potente y barata (modelo 3D de capullo/pluma), da el objeto «Pluma del Vigía». | Hay que justificar por qué la arena no te cubrió: «el ala lo apartó». |
| **D** | **El exilio ya te había «dormido»:** los exiliados no envejecen mientras vagan (maldición). | Coherente con LORE («transforma y maldice por dentro»). | Contradice que los mortales sí envejezcan; el exilio no dice nada sobre el tiempo. |

**Recomendado (A + C):** *«La isla vive fuera del tiempo. Cuando el cielo arde, el Vigía te envuelve en su última ala y te empuja a través: allí no pasan los años; aquí han pasado cien.»* Al despertar, el jugador solo ve: la pluma, la arena, el cielo teñido y un mundo que ya no cuenta su historia. **El jugador descubre los cien años por el mundo** (el tendero Ru es la nieta/el nieto del Ru que conoció «la historia de un viajero»; en el diálogo antiguo de Ru ya existe «mi padre atiende la tienda»), no por un cartel.

---
## 2 · Reglas de juego de la isla
1. **Niveles: empezar en 0 y «despertar» a 1.** Todos los oficios y el combate empiezan en **nivel 0** (en el HUD «bloqueado/dormido»). La primera tarea completa de cada oficio lo **despierta a nivel 1** y lo deja ahí: **no hay más XP en la isla** (la XP se recorta justo por debajo del nivel 2). Así se enseña sin farmeo y el jugador sale del tutorial con **todos los niveles en 1** (nivel total = número de oficios). Mientras avanzas, una barra «Despertar n/N» en la ficha de personaje muestra el progreso lineal (coincide con «subimos hasta nivel 1 con cada tarea»). *(Implementación: `S.awk[sk]`; `lvlOf` devuelve 0 si no está despierto; `gain()` no pasa del umbral del nivel 2 mientras `S.isla`.)*
2. **Los objetos se pierden al salir.** Todo lo de la isla (mochila, equipo, banco) desaparece al llegar a la Pradera, **salvo la Pluma del Vigía** (objeto de misión, sin uso de combate: sale en el escaparate de logros) y el **camino elegido**, que se conserva como etiqueta (`S.path`). La Pradera entrega, a través de Ru, el primer equipo de su camino.
3. **Sin muerte real:** si caes en el combate de la isla, el Vigía «detiene el golpe» (como una pausa de entrenamiento) y reinicias la fase con la vida llena. Lo ambiental (fuego de la huida) **nunca daña**: si te alcanza, vuelves al último punto de control con un fundido (regla del dueño: nada de survival ni castigo ambiental).
4. **Duración objetivo:** 25–35 min la primera vez, repartidos en 7 actos (≈ 28 objetivos cortos). Hoy son ≈ 35 objetivos hasta Rufo; los de «bronce, hierro, bandidos, orco, Rufo» pasan a la misión principal de la Pradera (§8).
5. **Una sola vez:** al terminar, la isla deja de ser accesible (se hunde); no se puede farmear ni volver.

---
## 3 · La isla (mapa propio, ≈ 1 bioma pequeño)
Tratada como una **zona** (10.º rectángulo de `BIOMES` con `zone:true`, aislada por mar, fila propia en `BIOME_RULES` sin clima). Cinco áreas pequeñas unidas por UN camino, de modo que el recorrido es casi lineal pero se puede mirar alrededor:
1. **El Varadero** (llegada): barca encallada, hoguera apagada, Anselm.
2. **El Claro** (tala) y **la Veta** (minería): árboles de la isla y dos rocas de cobre y estaño.
3. **El Fogón** (forja, pesca y cocina): un horno, un yunque, un hogar y un estanque.
4. **La Explanada** (elegir camino + entrenamiento): tres braseros (espada, arco, báculo), maniquíes, dianas y un círculo de piedras.
5. **El Altar Quebrado** (ritual y jefe): un altar de ángel con la cara borrada (LORE §4.3), cuatro pilas para las ofrendas y una arena redonda de piedra clara.
6. **La Senda de Ceniza** (escapada): el camino del altar al embarcadero, con tramos que arden y se derrumban.

---
> **⚑ 21 oct 2026: MANDA `docs/PLAN_ISLA_CIELO.md`** en nombres (arcángeles: Raguel, Sariel, Uriel, Rafael, Miguel, Remiel + Gabriel), geografía (isla griega, pasto azul, nubes), **estructura de capítulos tipo Tutorial Island (§6)** y plot twist (§7). La tabla de abajo queda como borrador histórico.

## 4 · Personajes de la isla (todos exiliados; nombres **[PROPUESTA]**)
Son los últimos de la isla. El jugador no sabe cuánto llevan allí. No dan su historia entera (LORE §2). **Cada uno enseña UN oficio** y es el *vendedor único de su profesión* en la isla solo en ficción (no hay tienda en la isla: todo se da).
| PNJ | Voz | Enseña | Detalle |
|---|---|---|---|
| **Anselm**, el contador de mareas | viejo, manso, cuenta cosas que no vuelven | recibimiento, correr, mochila | Es quien explica el ritual y se queda al final. |
| **Tilda**, la que corta | seca, práctica, no pregunta nombres | **tala** | Hacha en la mano; «los árboles no se disculpan, tú tampoco». |
| **Bruno**, el minero sordo | grita, no oye, se ríe solo | **minería** | Habla con gestos: la frase sale en un solo bocadillo. |
| **Kessa**, la de la fragua | orgullosa, quemada, mal genio | **fundir y forjar** | Una espada rota sobre el yunque que NO se arregla («la dejo para que me recuerde por qué no rezo»). |
| **Olo**, el del estanque | tranquilo, goteante, pesca con la boca abierta | **pesca y cocina** | Cocina mal; el jugador cocina mejor, y él lo admite con un gruñido. |
| **Grix**, el sargento sin ejército | ladra órdenes a maniquíes | **combate** (comer, retroceder, golpe pesado) | Entrena sin cobrar: «las bestias de la costa no te darán tutorial». |
| **Wren**, la barquera | callada, mira el mar | **la huida** | Espera en el embarcadero con la barca; es quien lleva la pluma al final. |

---
## 5 · Guion por actos (objetivo corto · qué enseña · qué «despierta»)
*(Los textos entre «» son el diálogo; máx. 2 frases por página, voz de aldeano.)*

### ACTO 0 · Llegada
Pantalla negra · sonido de oleaje · fundido de entrada en el Varadero: despiertas en la arena con la barca partida detrás. **Todo en nivel 0.**
1. **Levántate y habla con Anselm.** *(mover, clic, F)* — «Otro. Los mares ya no traen ni gaviotas, solo gente.» «Ven. Hay trabajo y no hay tiempo, aunque aquí nunca falta tiempo.»
2. **Recoge la leña de la orilla.** *(recoger objetos del suelo, mochila)*.
3. **Corre hasta el Claro** *(tecla R; correr 40 casillas)*.

### ACTO 1 · Manos (oficios) — cada oficio se «despierta» al primer éxito
4. **Tala 3 troncos** → *despierta **Tala** (nivel 1)* — Tilda: «Más con la espalda que con el brazo.»
5. **Mina cobre y estaño (2+2)** → *despierta **Minería*** — Bruno (gesto + «¡¿QUÉ?!»).
6. **Funde una barra de cobre** → *despierta **Herrería*** — Kessa.
7. **Forja una hoja de cobre** *(pieza del ritual: «la hoja»)*.
8. **Pesca 2 camarones** → *despierta **Pesca*** — Olo.
9. **Cocínalos en el hogar** → *despierta **Cocina*** *(pieza del ritual: «la ofrenda»)*.
10. **Guarda tus piezas** *(mochila → «Depositar todo» solo como enseñanza; el banco de la isla es un cofre)*.

### ACTO 2 · Tu camino
11. **Elige un brasero** (espada · arco · báculo): cada brasero abre una **prueba corta** (golpea un maniquí con la espada / dispara 3 flechas a la diana / lanza un hechizo al círculo). Completar la prueba **despierta ese estilo (nivel 1)** y fija `S.path`. *(Se puede probar los tres: el último que completes es el camino; «puedes cambiar cuando quieras» sigue en el mundo real.)*

### ACTO 3 · Entrenamiento (Grix)
12. **Derrota 3 cangrejos de la orilla** *(clic para atacar, barra de vida del objetivo)*.
13. **Come cuando te hieran** *(Grix te hiere a propósito, ligeramente; usar comida cocinada)*.
14. **Esquiva el golpe pesado** *(aviso rojo del `combat.js`: primer golpe pesado telegrafado contra un maniquí «de pega»)*.

### ACTO 4 · El Ritual
15. **Habla con Anselm: «el Altar»** — «Antes venía un vigía a mirar quién llegaba. Hace mucho que no viene. Pídele que mire.» [LORE: ángeles que vigilaban]
16. **Reúne las cuatro ofrendas** *(leña · mena fundida · la hoja forjada · la ofrenda cocinada)* — cada una es el resultado de un oficio de los actos 1–2.
17. **Colócalas en las cuatro pilas del Altar Quebrado.** Cada pila **se enciende** (luz, sonido) y el altar «recuerda» su cara (la estatua del ángel recupera un rasgo por ofrenda: ojos, boca, alas, nombre).
18. **Habla al altar** *(F)*: el cielo oscurece, el mar se queda quieto, **aparece el Vigía** (fundido de luz + temblor suave).

### ACTO 5 · El Vigía (jefe) — nombre y diseño por decidir ★
**Diseño [PROPUESTA]:** un ángel con las alas **ennegrecidas y rotas**, medio dorado medio ceniza, sin rostro (como la estatua del altar), una lanza de luz. Provisionalmente **«El Vigía»** (el que vigilaba la isla).
- **Fase 1 · La prueba (100 → 66 %):** golpes lentos y claros con **aviso rojo** (el telegrafiado de `combat.js`); enseña esquivar y atacar tras el golpe. Frase al empezar: «Mírame. Hace tiempo que nadie me mira.»
- **Fase 2 · La caída (66 → 33 %):** vuela y deja caer **plumas** en el suelo (zonas marcadas, sin daño de ambiente: avisan dónde cae el golpe pesado); invoca dos «ecos» pequeños. Enseña **comer a tiempo** y el estilo del camino (guerrero: parar; arquero: mantener distancia; mago: romper el escudo con el elemento).
- **Fase 3 · La elección (33 → 0 %):** arrodillado, ya no ataca con odio; su luz **se apaga por oleadas**: último ataque, ahora lento y largo, que el jugador debe soportar y devolver. Al caer: 
  > **El Vigía:** «Bien. Esperaba… que fueras tú.» «Te elegí para liberar el mundo.» «No me preguntes de qué. Yo tampoco lo sé ya.»
- **Recompensa:** *Pluma del Vigía* (objeto de misión) y la **runa del jefe** (la primera; los jefes dan runa y es un hito, LORE).

### ACTO 6 · «Escapa»
19. **EL CIELO ARDE.** En el instante en que el Vigía cae, el cielo se **abre en llamas** a lo lejos (eco del primer sacrificio, LORE §1): la luz pasa de dorada a **naranja-rojo con negros de ceniza**, el sol se vuelve una mancha, caen **brasas y ceniza** (partículas 3D ya existentes: brasas/ceniza), el sonido se apaga y entra un zumbido grave. *(Una sola iluminación para toda la isla: fila `TOD` propia y `BR` sin eventos; ver §9.)* Grande, claro, un rótulo: **ESCAPA.**
20. **Corre hasta el embarcadero.** La Senda de Ceniza (≈ 120 s corriendo): 3 tramos:
    - *Tramo 1:* el bosque arde a los lados (humo, llamas como decorado), la senda es recta.
    - *Tramo 2:* un **puente de cuerdas** se rompe tras de ti (se cae por tramos, avisado por crujidos); hay que cruzar corriendo.
    - *Tramo 3:* el **frente de fuego** avanza desde atrás (un muro de luz y calor que empuja la cámara, **sin daño**: si te alcanza, fundido al punto de control con una frase de Wren: «Otra vez. No hay prisa. Sí la hay.»).
    A mitad de camino pasan **Tilda, Bruno, Kessa, Olo y Grix**, cada uno sin hablar, mirándote y apartándose del camino (no te ayudan, te dejan pasar). *(Emoción sin diálogo.)*
21. **Sube a la barca.** Wren la empuja. Anselm se queda en el muelle y levanta la mano. Cámara larga: la isla **se hunde en luz**.

### ACTO 7 · Cien años después (mini-introducción en la Pradera)
22. **Fundido a negro · tarjeta de texto:** *«…»* (silencio) → *«Cien años.»* (una sola línea; sin explicación).
23. **Despiertas** en la playa de la Pradera, cubierto de arena y musgo, con **la pluma encendida** en la mano; la barca no está; el **cielo conserva una cicatriz roja** (iluminación única de esta escena: aurora violeta-ceniza que se va aclarando en 60 s hasta el día normal). Sonido: mar, gaviotas lejos, un metal que resuena.
24. **Levántate.** *(el control vuelve; de nuevo todos los oficios dormidos hasta que se despierten en el mundo real… ver nota)* El jugador **ha perdido todos sus objetos** (mensaje corto: «Se quedó todo. Lo que no se quedó, lo guardas tú.»; solo conserva la pluma).
25. **Sigue el camino hasta la aldea** (flecha amarilla). Se ve: casas más viejas, una **muralla de la aldea medio caída**, una **estatua de ángel rota** a la entrada (iconografía, LORE §4.3).
26. **Habla con Ru**, la **nieta/el nieto del tendero que conoció el tutorial antiguo** (quien conserva en la tienda un cuaderno con la historia de «el viajero de los cien años» como rumor): «¿Tú? Mi abuelo hablaba de alguien con esa pluma. Decía que volvería. Creí que era cuento.» → **empieza la misión principal** (§8).
> **Nota de diseño:** al terminar la isla el jugador tiene nivel total = número de oficios (todos en 1). No «reaparece dormido»: los oficios ya están despiertos; lo único que se resetea son los objetos.

---
## 6 · Piezas técnicas que implica este guion (resumen; se detallará al implementar)
1. **Zona «Isla del Principio»** (`zone:true` en `BIOMES`, rectángulo aparte, mar alrededor, fila en `BIOME_RULES` y en las tablas por bioma con valores neutros) + **arco de llegada** y **arco de partida** (teletransporte con fundido; al salir se vacía la mochila/equipo/banco y se oculta la isla).
2. **Motor de misiones por pasos** (el que se necesita también para las questlines de cada bioma; se aplazó al Bloque C): pasos hablar/matar/traer/colocar/visitar, objetos de misión, marcador «!» y flecha. **Hoy `GOALS`** (lista plana) se reescribe como DATOS de este nuevo motor.
3. **Niveles despiertos** (`S.awk`, recorte de XP en la isla, barra «Despertar»).
4. **Jefe «El Vigía»:** modelo 3D por código (alas rotas, lanza de luz, halo), 3 fases, plumas-aviso, ecos; reutiliza actores/animaciones y `combat.js` (golpes pesados). Altar con 4 pilas y la estatua que recupera rasgos.
5. **Escena de huida:** `TOD` propio (cielo en llamas), partículas de brasa/ceniza más densas, decorado de fuego (mallas emisivas), puente que se derrumba (animación por tramos), frente de fuego (cámara/vignette), puntos de control, música propia.
6. **Escena de despertar:** iluminación única (cicatriz roja que se aclara), la **Pluma del Vigía** (objeto brillante), el cambio de la aldea ya envejecida (muralla caída, estatua rota) y Ru como descendiente.
7. **Orden de trabajo sugerido:** (1) zona + motor de pasos + niveles despiertos; (2) actos 0–4 con PNJ (sin jefe); (3) altar + jefe; (4) escapa; (5) despertar y empalme con la Pradera; (6) música y pulido. Cada uno es un lote probable de S/M.

---
## 7 · Lo que NO cambia
- Elección de camino guerrero/arquero/mago y «puedes cambiar cuando quieras» (se mantiene, ahora enseñada con pruebas).
- «Los jefes dejan runa; es un hito, no una llave.» «No subir niveles automáticamente» (aquí tampoco: se despierta, no se regala).
- Pocas líneas en pantalla: lo que se enseña va como UNA línea al empezar la tarea y los diálogos son de 1–2 frases.

---
## 8 · Qué pasa con la cadena de objetivos actual (`GOALS`)
La isla sustituye, en este orden, a: *habla con Ru · tala · mina cobre · mina estaño · funde · forja espada · pesca · cocina · vuelve con Ru · vaca · manteca · camarones fritos · banco · tienda · camino · correr · caña.* Eso queda dicho por los maestros de la isla (los de banco/tienda/economía los enseñará Ru en la Pradera con un mini-tutorial opcional de tienda y mercado).
**La misión principal de la Pradera arranca con Ru y conserva:** *bronce → peto de bronce → hierro → espada de hierro → bandidos → orco → Rufo (Sello de Gruk)*, ahora como **«Los Sellos»** (primera cadena de la misión principal), con las recompensas actuales. **[★]** ¿se mantiene el nombre de Rufo/Gruk o se aprovecha para renovarlos con el lore?

---
## 9 · Decisiones abiertas para el dueño ★
1. **Los 100 años:** ¿opción **A+C** (limbo fuera del tiempo + capullo de plumas), otra, o una mezcla? (¿y se permite la insinuación del Tiempo —opción B— sin afirmarla?)
2. **¿Quién es el Vigía?** ¿un ángel caído a secas (jefe «sin nombre»), un exiliado que fue ángel, o algo más raro? ¿cómo se llama? (provisional: «El Vigía»).
3. **«Te elegí para liberar el mundo»:** ¿lo dice él con esas palabras (idénticas a Nul'ru) o más ambiguo?
4. **Las cinco personas de la isla:** ¿mueren/arden o se salvan? (mi guion los deja apartarse del camino; el destino queda abierto).
5. **¿Se puede SALTAR el tutorial** (para una segunda partida)? Propongo un interruptor «ya conozco el juego» en el editor de personaje que lo reduce a: despertar → elegir camino → Pradera.
6. **Ru como nieta/nieto del tendero antiguo:** ¿OK, o Ru es la MISMA persona (y entonces hay que explicar su edad)?
7. **¿La Pradera conserva sus tres PNJ aprobados (Ivo, Brenna, Orsen)?** Con el salto de cien años serían descendientes (mismos nombres de linaje) o los mismos «viejos»: por decidir.
8. **Duración y dificultad del jefe:** ¿primero fácil y accesible (todos lo pasan) o con un pico de dificultad?


---
## ▶ DECISIONES v2 (respuestas del dueño, 20 oct 2026) — MANDA sobre lo anterior
1. **Cien años = el FRAGMENTO DEL TIEMPO** (sustituye a la Pluma del Vigía y a las opciones A/C/D). El jugador **no sabe qué es**: al recibirlo hay una animación corta en la que el tiempo se detiene alrededor (partículas congeladas, sonido que se apaga, luz inmóvil). Es el 2.º fragmento del canon que sale a escena (sangre, **tiempo**, vida, cuerpo): queda anotado como canon NUEVO del dueño y debe ir a `docs/LORE.md`. Objeto de misión «Fragmento del tiempo» (descripción ambigua; no se pierde al entrar al mundo).
2. **La isla está en el CIELO** (nubes alrededor, mar de nubes, sol bajo). Más tarde se REUTILIZA como el bioma de verdad del endgame (**Fase 53 · Cielo**): ciclo completo. Consecuencias: (a) diseñar la isla como zona reutilizable (mismo rectángulo, terreno y props; en el tutorial rota/quemada-por-etapas, en el endgame restaurada o en ruinas); (b) «Escapa» no es un embarcadero: **la isla se quiebra y cae**; la huida termina saltando al fragmento de isla/plataforma de nubes que nos baja (Wren, la barquera, pasa a ser quien pilota una **barca de viento/vela de nube** hasta la última plataforma) y el fragmento del tiempo nos arrastra a la playa; (c) la Costa y el mar de la Pradera aparecen como lo primero que se ve al despertar.
3. **Jefe: «Gabriel»** (ángel; ya no «el Vigía»). Antes de morir, en voz baja: **«Ahora también estarás maldito. Ve a liberar el mundo.»** y nos entrega el fragmento del tiempo. Se mantiene «te elegí» implícito en esa frase. El «ahora también» insinúa que ya había una maldición previa (ambiguo a propósito: ¿el exilio? ¿Nul'ru?). Dificultad: **relativamente fácil, no trivial; requiere al menos esquivar** (golpes pesados telegrafados obligatorios de esquivar; no se puede ganar solo trasteando).
4. **Destino de los cinco exiliados:** queda ABIERTO (en la huida se apartan y miran; nada más).
5. **Saltar el tutorial:** SÍ (opción en el editor de personaje: despertar → camino → Pradera con todos los oficios en 1).
6. **Ru es la reencarnación de Nul'ru.** Ru está desde el principio y **nos saca de la hibernación** (despertar: Ru está junto al cuerpo en la playa o llega justo después), y acompaña TODO el viaje. **Cuidados de lore:** (a) el jugador NO lo sabe y los aldeanos tampoco (LORE: «los aldeanos no revelan canon»); solo se insinúa muy tarde (Ru conoce cosas que no debería, reconoce el fragmento sin preguntar, el enmascarado aparece en sueños/menciones); (b) Ru ya NO es nieta/o del tendero: **es el mismo Ru de siempre** y el hecho de que no envejezca/sea el mismo tras un siglo es una pista (la gente de la Pradera cree que «Ru» es un cargo/apellido de la tienda; frase: «Ru atiende la tienda desde antes que mi abuelo»). Pendiente ★: si Ru también aparece EN la isla (cielo) antes de la caída (p. ej. como voz/figura enmascarada vista de lejos) o solo desde la playa.
7. **Los PNJ de la Pradera (Ivo, Brenna, Orsen):** de origen ambiguo: «vienen del cielo, pero como el cielo ardió ya no se sabe». No se explica con diálogo; **se refleja en las DESCRIPCIONES de objetos** (p. ej. «Forjado con metal que cayó del cielo. Nadie recuerda de dónde.»). Se aplica a objetos de las aldeas y a reliquias; ver cuidado de no definir canon (ambiguo siempre).
8. **Niveles:** como ya se propuso (empezar en 0, cada tarea «despierta» el oficio a 1, bloqueado a 1 en la isla, objetos perdidos al llegar al mundo). Se mantiene.

### Reescritura de los actos afectados (sustituye a los actos 5–7 de arriba)
- **Acto 5 · Gabriel (jefe):** misma estructura de 3 fases (la prueba / la caída con plumas-aviso / la elección). Fase 3: arrodillado, ataque lento y largo. Al caer: **«Ahora también estarás maldito. Ve a liberar el mundo.»** → el fragmento del tiempo flota hacia el jugador; animación de tiempo detenido (2–3 s, cámara fija, partículas suspendidas).
- **Acto 6 · «Escapa»:** el fragmento del tiempo deja de latir y el cielo arde; la isla se resquebraja y empieza a caer por trozos. Mismos 3 tramos (bosque en llamas, puente que se rompe, frente de fuego) pero ahora **las nubes se abren bajo los pies** (trozos de isla que se desprenden hacia el vacío; nunca hay daño: caer = punto de control). Final: salto a la barca de viento de Wren. Cámara larga: la isla arde y cae/se aleja.
- **Acto 7 · Cien años después:** negro → una sola línea («Cien años.»). Despiertas en la playa de la Pradera, **Ru a tu lado** (el primero en verte). El fragmento sigue en tu mano o en tu pecho (silueta tenue). Iluminación única (cicatriz roja que se aclara en 60 s). Ru: poca palabra, algo sabe y no lo dice. Marca el comienzo de la misión principal.

---
## ▶ MISIÓN PRINCIPAL DE LA PRADERA (REDISEÑO — «se siente débil solo ir por bosses»)
**Idea del dueño:** **questlines principales cada X niveles totales, entregadas por Ru**, que nos acompaña todo el viaje.
**Propuesta [PROPUESTA] — «Capítulos de Ru»:**
- Ru entrega un **capítulo** cada vez que el *nivel total* cruza un umbral. El umbral lo dan los oficios (hoy ≈ 14 oficios → empiezas con total 14 al salir de la isla; cada oficio/combate llega a 99): propongo **umbrales por tramos creciente** (más corto al principio, más espaciado al final): 25 · 60 · 110 · 180 · 270 · 380 · 520 · 700 · 900 · 1100 (≈ 10 capítulos; ★ ajustar con `tools/meas_progresion.py`). Un capítulo = 4–7 pasos de 3–6 min que MEZCLAN actividades (no solo bosses): hablar/viajar, recolectar, fabricar un objeto para alguien, cazar, resolver un pequeño misterio, y un clímax (a veces jefe, a veces escolta, evento o mazmorra).
- **Cada capítulo coincide con un bioma/civilización** (empujando a explorar): 1 Pradera (los Sellos: bronce/hierro/bandidos/orco/Rufo reutilizados como pasos, no como lo único) · 2 Bosque · 3 Pantano · 4 Cumbres · 5 Oriental · 6 Volcán · 7 Páramo · 8 Desierto · 9 Costa · 10 **Cielo (la isla restaurada, endgame)**. Cada uno desbloquea el *tier* siguiente y da una recompensa de historia (objeto con descripción ambigua) más una runa de jefe como hito (no llave).
- **Ru como hilo:** aparece al final de cada capítulo (o en una ciudad por capítulo: nos espera en el siguiente bioma de forma distinta: a veces como mercader, a veces como viajero); sus diálogos revelan pistas muy poco a poco (LORE: ambigüedad). Nunca explica; **lo que sabe depende de qué fragmento tengamos** (el del tiempo desbloquea escenas «congeladas»: recuerdos de la caída, visiones del enmascarado).
- **Motor:** el mismo motor de misiones por pasos (aplazado al Bloque C): `QUESTLINES` por datos (`id, req:{total}, giver:'ru', pasos[]`), marcador «!» sobre Ru y flecha de objetivo, registro en el panel Misiones («Principal»). Hasta que exista el motor, la cadena actual `GOALS` hace de capítulo 1.

### Preguntas abiertas v2 ★
1. ¿Umbrales de nivel total? (propuesta arriba; cuántos capítulos).
2. ¿Ru aparece también en la isla del cielo antes de la caída, o solo desde la playa?
3. ¿El capítulo final (Cielo) se juega SIEMPRE en la misma isla del tutorial restaurada, o es una isla/plano nuevo?
4. ¿Gabriel tiene voz/mención posterior (reliquias, estatuas, el eco en el Cielo)?
5. ¿Pasar a LORE.md ahora el canon nuevo (fragmento del tiempo = hibernación; «ahora también estarás maldito»)?

### Respuestas finales del dueño a las preguntas v2 (20 oct 2026)
1. Umbrales de nivel total: se aceptan las propuestos; se irán ajustando sobre la marcha.
2. Ru NO aparece en la isla del cielo, pero **se muestra un diálogo de Nul'ru matando a dios** (escena, sin vincularlo a Ru).
3. El Cielo vuelve como bioma endgame en **RUINAS** y con una **zona mucho más grande** (la isla del tutorial es solo una parte).
4. Gabriel tiene eco posterior con lore al estilo Dark Souls (fragmentario, en objetos/reliquias/estatuas).
5. Todo el canon nuevo ya está pasado a `docs/LORE.md` (sección 1b).

---
## ▶ PLAN IN-GAME DE LA CINEMÁTICA «La caída de Gabriel» (20 oct 2026; el dueño descartó InVideo por coste: se hace en el motor, por código) — SOLO PLAN, nada implementado
**Referencia de dirección:** `docs/PROMPT_INVIDEO_CINEMATICA_GABRIEL.md` (planos, ritmo, audio, negativos). Se traduce a una **cinemática en tiempo real** con el héroe del jugador (su personaje real, de espaldas/silueta), sin vídeo ni assets externos.

### Principio: un motor de cinemáticas por DATOS (reutilizable)
NUEVO `src/cine.js` (global `CINE`) + `src/r3d/cine3d.js`. Una escena = lista de **planos** `{t0, dur, cam, fx[], audio[], txt, act[]}`; el reloj de la escena es propio (no depende de `P`/`dt` del juego). Reutilizable para Nul'ru, jefes, llegada a biomas, la Fase 53.
- **Cámara dirigida:** `R3D` hoy es cámara giratoria que sigue al héroe (`R3D.az`, zoom). Añadir `R3D.camOverride={pos,target,fov}` con interpolación suave (easeInOut), empujones lentos y temblor (`shake`); al terminar se devuelve a la cámara normal sin salto (fundido o lerp ≤0,6 s).
- **Control:** `body.cine` oculta el HUD Susurro, muestra **bandas de cine** (DOM, 2,35:1) y bloquea entrada y combate; **saltable** (mantener Esc/clic 1 s o tecla del menú); un solo texto: subtítulo corto abajo (Spectral dorado `#e8cf94`) y la tarjeta final.
- **Estado seguro:** al empezar, `S` queda con vida llena, jefe/amenazas pausados; al terminar o saltar, SIEMPRE se llega al mismo estado final (el fragmento en la mochila, flag `S.cine.gabriel=1`) para que saltarla no rompa el tutorial.
- **Pruebas:** `CHEAT.cine('gabriel')` desde el menú F3 y escena de prueba en la plaza de la Pradera, **sin esperar a que exista la isla** (permite iterar el cine de forma aislada).

### Piezas visuales de ESTA escena (cada una una función chica y verificable)
1. **Gabriel (modelo + animaciones):** `Mini` humanoide alto (≈1,25× héroe) con alas ROTAS por código (plumas faltantes, quemadas), halo agrietado (anillo emisivo), túnica blanca-gris rasgada; poses: arrodillado/herido, alza la cara, susurro, **disolución** (uniforme `uDissolve` en el material toon con ruido de umbral + partículas de polvo dorado/plumas; plan B si el shader da problemas: encoger+fundir alpha con partículas). Es también el modelo del JEFE (misma malla), así que se hace UNA vez.
2. **Fragmento del Tiempo:** cristal facetado ámbar/oro pálido, emisivo, pulso de corazón (≈1 Hz), luz puntual real o lámpara del `DynLight` (`R3D.lm`), estela de partículas; objeto de misión «Fragmento del tiempo» (descripción ambigua).
3. **TIEMPO DETENIDO (el momento clave, 2–3 s):** `R3D.tscale` (multiplicador del reloj de animación, partículas y nubes → 0) con rampa de 0,25 s; partículas existentes (`particles3d.js`) congeladas y densificadas; el sonido baja con `AMASTER.gain` a ~0 salvo un tono agudo sostenido; grado de color desaturado con un único acento oro (uniforme de grado, ya hay `uSat/uLive`); luz inmóvil (se congela `TOD`); cámara fija. Al soltar: golpe grave seco y todo vuelve de golpe.
4. **El cielo arde:** fila `TOD` propia («cielo_ardiendo»: naranja-rojo, negros de ceniza, sol como mancha) con transición de 4–6 s; **grieta emisiva en el horizonte** (malla de cielo con gradiente + fisura brillante); lluvia de brasas/plumas ardiendo (preset denso de `particles3d.js`: brasas+ceniza); mar de nubes inferior teñido por la luz.
5. **La isla se desmorona:** arcos de piedra y trozos de terreno como **escombros instanciados** que se desprenden y caen por trayectorias precalculadas (determinista por hash), polvo, temblor de cámara; **solo visual en la cinemática** (el derrumbe jugable es el Acto 6 «Escapa» con sus tramos).
6. **Audio:** todo sintetizado (`tone()/noise()`), sin archivos: viento y zumbido de coro (acordes de tonos largos), silencio al parar el tiempo, golpe grave, subida de metales con ruido filtrado, campana lejana. Se prevé sustituir por pistas reales cuando las entregue el dueño (Fase 27).
7. **Tarjeta final:** negro y «Cien años.» (Cinzel dorado fino), con silencio; enlaza al Acto 7.

### Escena de Nul'ru (respuesta 2 del dueño: «un diálogo de Nul'ru matando a dios», sin vincularlo a Ru) ✅ DECIDIDO (21 oct 2026): VA DENTRO DEL TIEMPO DETENIDO, como visión al coger el fragmento
(Las líneas del diálogo siguen sin escribirse: son canon y las aprueba el dueño.) Propuesta original: **dentro del tiempo detenido** o como visión al coger el fragmento: la escena se congela y se superpone una silueta enmascarada frente a una figura enorme de luz; 3–4 líneas sueltas (voz hueca, sin subtítulo de nombre «Nul'ru»: solo «El Enmascarado»), estilo Dark Souls. Alternativa: escena propia tras el Acto 6 o en el Cielo del endgame. Esto es **canon**: no escribir las líneas sin el visto bueno del dueño.

### Orden de implementación sugerido (lotes S/M, uno por mensaje; cada uno termina con captura y «qué probar a mano»)
1. **CINE-0 · motor:** `CINE` + cámara dirigida + bandas + saltar + `CHEAT.cine` con una escena de prueba (cámara paseando por la plaza). Verificar que devuelve la cámara y el HUD sin salto.
2. **CINE-1 · tiempo detenido** (`R3D.tscale`, congelar partículas/nubes/TOD, audio, grado). Probado con cualquier escena.
3. **CINE-2 · Gabriel:** modelo, poses y disolución (en hoja de personajes `actores-3d.html`; pasar `actors_lint.py` y `body_lint.js`; regla de sentido: escala, orientación, nada flotando).
4. **CINE-3 · fragmento + cielo ardiendo + escombros** (TOD, brasas, emisivos).
5. **CINE-4 · montaje completo** de los 7 planos con audio y tarjeta; ajustar tiempos con el dueño en su GPU.
6. Luego, ya con la isla (§6 de arriba): jefe Gabriel (3 fases) que al llegar a 0 PV dispara la cinemática y entra al Acto 6.
**Rendimiento:** la cinemática debe correr ≥ 50 fps en GPU media; se reutilizan partículas e instancias existentes (sin lienzos 2D nuevos, sin `ctx.filter`). **No medido** (SwiftShader no sirve): el dueño mide en su GPU.
