# PLAN · Oficios estilo FF14 (PROPUESTA del 22 oct 2026; nada implementado)

> Pedido del dueño (22 oct 2026): «reworkear los oficios como en FF14. Los de recolección me gustan como están (el circulito); hacerlos más interesantes con habilidades. Sugerencias para TODAS las profesiones actuales + las que vamos a agregar.»
> **Estado: borrador para decidir.** Engancha con `docs/PLAN_OFICIOS_Y_BIOMAS.md` (orden Herbolaria → Alquimia → Sastrería → Encantamiento), `docs/HOJA_DE_RUTA.md` Fase 3·c y la barra de 6 habilidades. **Decisión del dueño (22 oct): el crafteo de TODOS los oficios usa la fórmula FF14 (Avance/Calidad/Resistencia/PO, rotación de acciones); los minijuegos propios planeados antes quedan CANCELADOS.** Los oficios solo se diferencian por sus acciones exclusivas (datos).

## 0 · Principios (para no romper nada)
1. **Recolección = la rueda actual, intacta.** Solo se le añaden *habilidades* que la modifican (§2). Pesca y Herbolaria usan su propio minijuego (ya decidido), pero con las mismas reglas de recursos de habilidad.
2. **Crafteo = «Hoja de trabajo»**: un panel DOM pequeño junto a la estación (cristal + trazo dorado, regla de HUD «Susurro»; poco texto) con dos barras y una fila de habilidades en las teclas 1–6 (+ Q/E). Sin pantallas pesadas; feedback por partículas `R3D.fx` y sonido sintético.
3. **Azar:** condiciones y «procs» usan azar normal (`Math.random` vale aquí, aclaración del dueño 22 oct); el núcleo acepta semilla opcional solo para pruebas repetibles.
4. **Nunca se pierde material** (decisión vigente): fallar = peor calidad, no destrucción. La durabilidad que llega a 0 *termina* la pieza con lo que lleve.
5. **Sin idle ni offline**, pero con **Síntesis rápida** para recetas de nivel ≤ (tu nivel − 10): una sola pulsación, calidad normal, mismo tiempo que 1 pieza. Evita el tedio de repetir sin romper «activo».
6. **Esfuerzo máximo por pieza ≈ 10 min** (límite de `craft_balance.py`); una rotación típica = 6–12 acciones ≈ 40–90 s.
7. Rendimiento (§P de `REGLAS_CREACION.md`): todo es DOM + el 3D que ya existe; sin renderers ni luces nuevas.

## 1 · Esqueleto común de crafteo (lo que copiamos de FF14)
| Concepto FF14 | Aquí | Detalle |
|---|---|---|
| Progress | **Avance** | Llega al 100 % de `prog` de la receta → pieza hecha. |
| Quality / HQ% | **Calidad** | Sube la probabilidad de calidad superior (`qv` / `QBON`, ya existentes); 100 % ⇒ calidad máxima asegurada. |
| Durability | **Resistencia de la pieza** | 60/40/20 según la receta; cada acción gasta 10 (o 5 con *Sin desperdicio*). 0 = termina. |
| CP | **Puntos de Oficio (PO)** | Reserva por oficio: `PO = 100 + nivel·2 + bonos de herramienta/equipo/comida`. Regenera en la estación entre piezas. |
| Craftsmanship / Control | **Maña** (avance) y **Pulso** (calidad) | Salen de la **herramienta del oficio** (ya hay 11 tiers) y de la ropa de oficio; así el tier de la herramienta importa. |
| Condición (Normal/Bueno/Excelente/Malo) | **Estado de la pieza** | Cambia cada acción (PRNG): *Bueno* ×1,5 calidad, *Excelente* ×4 (y la siguiente es *Malo* ×0,5). En la Hoja de trabajo es el color de la pieza. Cada oficio la interpreta a su manera (§3). |
| Inner Quiet | **Concentración** | Se apila con cada acción de calidad (hasta 10) y multiplica la calidad. |
| Buffs (Veneration, Innovation, Great Strides, Waste Not…) | **Estados de trabajo** | Duran N acciones; son datos en una tabla (`WK.D`), una fila por estado, igual que `STS.D`. |
| Observe / Master's Mend / Final Appraisal | **Observar / Reparar / Tasación** | Genéricas, desbloqueadas por nivel. |
| Cross-class actions | **Acciones cruzadas** | Un oficio enseña 1–2 acciones a otros al llegar a nivel X → cierra la tarea «niveles cruzados entre oficios» de la Fase 3·c. |
| Collectables | **Piezas de maestro** | Receta que exige Calidad ≥ umbral; da más XP y Marcas de Maestro (moneda de los Maestros B4/ID3). |
| Crafting food/potions | **Comida y pociones de trabajo** | Cocina y Alquimia fabrican +PO / +Maña / +Pulso (12 h → aquí 30 min reales): *entrelaza los oficios de forma natural*. |

### Habilidades de crafteo: lista COMPLETA (paridad con FF14)
En FF14 los 8 oficios de crafteo comparten **la misma lista de ≈ 34 acciones de crafteo** (más ≈ 6 de especialista y alguna de rol); lo que distingue a un oficio son sus recetas y su equipo, **no** acciones propias. Hacemos lo mismo: **34 acciones comunes con los niveles y efectos de FF14** (tope de nivel 99 en vez de 100; porcentajes y costes aproximados, a calibrar con `craft_balance.py`) **y además 4–6 acciones exclusivas por oficio** (§3.2), que es nuestro añadido de sabor. Cifras: «Av» = % de eficiencia de Avance, «Ca» = % de Calidad.
| # | Acción (equivalente FF14) | Nv | PO | Efecto |
|---|---|---|---|---|
| 1 | **Síntesis básica** (Basic Synthesis) | 1 | 0 | Av 120 % |
| 2 | **Toque básico** (Basic Touch) | 5 | 18 | Ca 100 %, +1 Concentración |
| 3 | **Reparación del maestro** (Master's Mend) | 7 | 88 | +30 Resistencia |
| 4 | **Toque apresurado** (Hasty Touch) | 9 | 0 | Ca 100 %, 60 % de éxito |
| 5 | **Síntesis rápida** (Rapid Synthesis) | 9 | 0 | Av 500 %, 50 % de éxito |
| 6 | **Observar** (Observe) | 13 | 7 | Sin efecto; enlaza *Observación atenta* y *Toque cuidadoso* |
| 7 | **Trucos del oficio** (Tricks of the Trade) | 13 | 0 | Solo con pieza *Buena/Excelente*: +20 PO |
| 8 | **Sin desperdicio** (Waste Not) | 15 | 56 | 4 acciones con la mitad de gasto de Resistencia |
| 9 | **Veneración** (Veneration) | 15 | 18 | +50 % Avance 4 acciones |
| 10 | **Toque estándar** (Standard Touch) | 18 | 32 | Ca 125 %, combo tras Toque básico (PO 18) |
| 11 | **Gran avance** (Great Strides) | 21 | 32 | Siguiente toque +100 % Calidad (3 acciones) |
| 12 | **Innovación** (Innovation) | 26 | 18 | +50 % Calidad 4 acciones |
| 13 | **Tasación final** (Final Appraisal) | 42 | 1 | El Avance se queda en 99 % durante 5 acciones |
| 14 | **Sin desperdicio II** (Waste Not II) | 47 | 98 | 8 acciones a mitad de gasto |
| 15 | **Bendición de Byregot** (Byregot's Blessing) | 50 | 24 | Ca 100 % + 20 % por Concentración; consume toda; solo con Conc. > 0 |
| 16 | **Toque preciso** (Precise Touch) | 53 | 18 | Ca 150 %, solo *Bueno/Excelente*, +2 Concentración |
| 17 | **Memoria muscular** (Muscle Memory) | 54 | 6 | Av 300 %, solo 1.ª acción; +Avance 5 acciones |
| 18 | **Observación atenta** (Careful Observation) | 55 | 0 | Cambia la condición (3 usos por pieza; especialista) |
| 19 | **Síntesis cuidadosa** (Careful Synthesis) | 62 | 7 | Av 180 % |
| 20 | **Manipulación** (Manipulation) | 65 | 96 | +5 Resistencia por acción, 8 acciones |
| 21 | **Toque prudente** (Prudent Touch) | 66 | 25 | Ca 100 %, ½ gasto; no se mezcla con *Sin desperdicio* |
| 22 | **Reflejo** (Reflect) | 69 | 6 | Solo 1.ª acción: Ca 100 %, +2 Concentración |
| 23 | **Toque preparatorio** (Preparatory Touch) | 71 | 40 | Ca 200 %, doble gasto, +2 Concentración |
| 24 | **Cimientos** (Groundwork) | 72 | 18 | Av 360 %; la mitad si queda poca Resistencia |
| 25 | **Síntesis delicada** (Delicate Synthesis) | 76 | 32 | Av 100 % y Ca 100 % |
| 26 | **Síntesis intensiva** (Intensive Synthesis) | 78 | 6 | Av 400 %, solo *Bueno/Excelente* |
| 27 | **Toque avanzado** (Advanced Touch) | 84 | 46 | Ca 150 %; 18 PO tras *Toque estándar* |
| 28 | **Síntesis prudente** (Prudent Synthesis) | 88 | 18 | Av 180 %, ½ gasto |
| 29 | **Ojo entrenado** (Trained Eye) | 90 | 250 | Solo 1.ª acción, solo recetas muy por debajo de tu nivel: Calidad al 100 % |
| 30 | **Maestría entrenada** (Trained Finesse) | 90 | 32 | Ca 100 % sin gasto; solo con Concentración 10 |
| 31 | **Toque refinado** (Refined Touch) | 92 | 24 | Ca 100 % tras *Toque básico*; +1 Concentración extra |
| 32 | **Innovación rápida** (Quick Innovation) | 96 | 0 | Innovación al instante (1 vez por pieza) |
| 33 | **Reparación inmaculada** (Immaculate Mend) | 98 | 112 | Restaura toda la Resistencia |
| 34 | **Perfección entrenada** (Trained Perfection) | 99 | 0 | La siguiente acción no gasta Resistencia (1 vez) |
Extras de **especialista** (libros de Maestro): *Corazón y alma* (Heart and Soul: una acción con condición *Excelente* forzada) y *Observación atenta* (#18, que en FF14 es de especialista). Las **condiciones** son las de FF14 (*Normal, Buena, Excelente, Mala, Centrada, Sólida, Pliante, Eficiente, Expectante, Estelar*), cada una con su efecto; las avanzadas se activan al subir de nivel o con el libro del Maestro.

### Cantidad por familia (para igualar a FF14)
| Familia | FF14 (aprox.) | Aquí |
|---|---|---|
| Cada oficio de crafteo | ≈ 34 acciones comunes + ≈ 2–3 de especialista (idénticas en los 8) | **34 comunes + 4–6 exclusivas + 2 de especialista** ≈ 40–42 |
| Cada recolector terrestre (Minero/Botánico) | ≈ 25 acciones propias (rendimiento, golpe, Visión nítida I–V, Cosecha, Rey/Gran cosecha, Bendición…) | **≈ 24 por oficio** (Tala/Minería/Herbolaria), reflejadas sobre la rueda (§2) |
| Pesca | ≈ 25 acciones (cebos, Paciencia I–II, Mooch I–II, Ojos de pez, Presa premiada, Mano preciso/poderoso, Doble/Triple anzuelo…) | **≈ 25** (§2.1) |

## 2 · Recolección: la rueda con habilidades (el «circulito» se queda)
Nuevo recurso: **Puntos de Recolección (PR, como GP)**: `PR = 100 + nivel + herramienta`; se regeneran despacio (1 por 3 s) y al tomar una pieza. Las habilidades se lanzan **entre golpes** (teclas 1–6) y modifican la rueda actual, no la sustituyen.
| Habilidad (Tala / Minería) | Lv | Efecto sobre la rueda y el nodo |
|---|---|---|
| **Golpe certero** | 10 | El arco de acierto se ensancha ×1,6 durante el siguiente golpe. |
| **Ojo de veta / Ojo de madera** | 14 | Revela en el nodo si lleva **raro** (brillo) y cuántos golpes de más da. |
| **Cosecha abundante** | 20 | +1 unidad por golpe perfecto (3 golpes). |
| **Ritmo** | 26 | El marcador va un 25 % más lento 6 s (para novatos o clase alta). |
| **Golpe de gracia** | 32 | El siguiente golpe bueno cuenta como perfecto. |
| **Segundo viento** | 38 | Devuelve 30 PR; enfriamiento largo. |
| **Visión de oro** | 50 | Aumenta ×3 la probabilidad de raro del nodo (0,4 % → y aún más en los «dorados»). |
**Nodos especiales** (copiados de FF14, hechos con lo que ya hay): *nodo efímero* (aparece en una franja horaria del juego y desaparece, con tier superior al de la zona), *nodo dorado* (ya existe, 0,4 %), y un *nodo de leyenda* por bioma (1 por día de juego) que exige ≥ 2 habilidades encadenadas.
**Coleccionables de recolección:** el recurso tiene «Pureza» (0–100) que sube con golpes perfectos; solo las piezas con Pureza alta sirven para recetas de Maestro. Da razón al minijuego sin tocar la rueda.
Reutilizamos `whInit/whPress/whTick` y `WHEEL_SK`; las habilidades solo escriben sobre sus parámetros (`arc`, `rev`, `hits`) — **cero código nuevo en el render de la rueda**.

### 2.1 Lista completa de habilidades de recolección (≈ 24 por oficio; paridad con FF14)
Mismo reparto de niveles para Tala, Minería y Herbolaria (cambian los nombres: *Hachazo*, *Pico fino*, *Mano suave*…). «Integridad» = golpes que aguanta el nodo; «PR» = Puntos de Recolección. Efectos de FF14 adaptados a la rueda (arco, marcador, golpes por nodo); cifras a calibrar.
| Nv | Habilidad (equivalente FF14) | PR | Efecto |
|---|---|---|---|
| 1 | **Golpe base** (Mine/Harvest) | 0 | Golpe normal de la rueda |
| 15 | **Prospección** (Prospect/Triangulate) | 50 | Revela el raro del nodo |
| 15 | **Visión nítida I** (Sharp Vision) | 100 | +10 % Prob. de raro/gema (II–V a 30, 45, 60, 75; +dobles) |
| 25 | **Cosecha abundante I** (Bountiful Yield) | 100 | +1 unidad en el siguiente golpe bueno/perfecto (II a nv 40) |
| 30 | **Don del recolector I** (Gatherer's Boon) | 50 | +10 % de que el nodo conserve Integridad (II a nv 45) |
| 35 | **Rey de la cosecha I** (King's Yield) | 400 | +1 unidad en TODOS los golpes buenos 5 golpes (II a nv 60) |
| 40 | **Razón sólida** (Solid Reason) | 300 | +Integridad al nodo |
| 50 | **Palabras sin edad** (Ageless Words) | 130 | Si el golpe falla, no consume Integridad |
| 55 | **Sabio del mundo** (Wise to the World) | 0 | Tras un golpe perfecto, 50 % de recuperar 1 PR |
| 60 | **Don del montañero/leñador** (Pioneer's Gift) | 0 | +PR al romper el nodo |
| 65 | **Ojo certero I** (Scrutiny) | 200 | Arco ×1,5 (II a nv 80) |
| 70 | **Verdad del bosque/monte** (Truth of Mountains) | 200 | +Prob. de pieza de maestro |
| 80 | **Coleccionista** (Collector's Standard) | 0 | Pureza ×2 en las piezas que cosechas |
| 90 | **Golpe del prospector** (Meticulous/Brazen) | 400 | El siguiente golpe perfecto suma 2 unidades y Pureza |
| 99 | **Maestría del nodo** | 600 | El nodo da 1 unidad extra por golpe 5 golpes |
(Con las variantes I–V/II quedan ≈ 24 habilidades por oficio.)

#### Pesca (≈ 25), equivalente a FF14
Cebos (*Cebo de lombriz, escarabajo, grillo, gamba, vivo…*) y **lanzar → esperar → picar → recoger**. Habilidades: **Lanzar**, **Recoger**, **Paciencia I/II** (más prob. de pez grande), **Cebo vivo (Mooch I/II)** (usar un pez para pescar otro), **Ojos de pez** (ve más peces), **Presa premiada** (el pez que cuenta), **Cebo seco/cebo flotante**, **Imán de cebo (Chum)**, **Anzuelo preciso / poderoso** (según el tipo de picada), **Doble/Triple anzuelo**, **Lanzamiento idéntico**, **Favor de Thaliak** (relación de peces), **Bendición de la naturaleza**, **Liberar**, **Descansar**, **Cebo improvisado**, **Golpe de pesca**, **Superficie**, **Ojos del cielo**. Se desbloquean por niveles de Pesca igual que la recolección. Esto reactiva el minijuego `FISH_MG` guardado como la fase de «picada con tipo».

## 3 · Propuesta por oficio

### 3.1 Recolección
| Oficio | Mecánica propia (sobre §2) | Ejemplo de habilidad exclusiva |
|---|---|---|
| **Tala** (`wc`) | **Dirección de caída**: antes del golpe final eliges hacia dónde cae el árbol (flecha); si cae sobre otro nodo, lo daña y suelta *troncos huecos* (extra). | *Hachazo en cuña* (cae sin tocar vecinos, +calidad de madera); *Aserrar fino* (+1 tablón al procesar). |
| **Minería** (`mi`) | **Veta en capas**: la mena tiene 2–3 «capas» con color; al romper una capa expuesta con arco estrecho aparece una gema. | *Prospección* (muestra si hay gema detrás); *Fisura* (convierte 3 golpes buenos en 1 perfecto). |
| **Pesca** (`fi`) | Estilo FF14: **cebo + espera + picada con tipo** (corta/larga/«doble») → respuesta distinta (*Anzuelo preciso* vs *Anzuelo potente*). El minijuego de lucha guardado (`FISH_MG`) se reactiva para peces grandes. | *Paciencia* (+probabilidad de pez grande, gasta PR), *Cebo vivo* (encadenar un 2.º pez del mismo banco: «mooch»), *Intuición* (ve la picada por el flotador antes). |
| **Herbolaria** (`he`) | «Arrancar con cuidado» (mantén LMB; suelta cuando la raíz agarra). Pureza = raíz entera. Hierbas **estacionales/horarias** (florecen de noche, con lluvia). | *Manos suaves* (la zona de «agarra» ×1,5), *Rocío* (calidad extra a la mañana), *Raíz profunda* (raras). |
| **Agricultura / Apicultura** (`ag`, las últimas) | Parcelas por aldea (recomendado): plantar → regar/polinizar → cosechar a intervalos reales, con mejora de calidad por *Cuidado* (acción cada visita). Sin minijuego pesado. | *Injerto*, *Polinizar*, *Ahumar la colmena*. |
| **Domar** (`do`) | Barra de **Confianza** vs **Susto**: acercarse despacio, ofrecer comida, calmar; usa ralentización/estados que ya existen. | *Voz tranquila*, *Ofrecer bayas*, *Mirada firme*. Monturas y mascotas (una ranura de cada). |

### 3.2 Crafteo: TODOS usan la MISMA fórmula FF14 (decisión del dueño, 22 oct)
**No hay minijuegos propios.** Los minijuegos planeados antes (calor/ritmo de Herrería, patrón de Artesanía, tallar de Escultor, punto de cocción, mezcla de Alquimia, telar, runas, engastar, ensamblar) **quedan CANCELADOS** y se sustituyen por el bucle de FF14: elegir una acción por turno (teclas 1–6) para llenar **Avance** antes de que la **Resistencia** llegue a 0, subiendo **Calidad** con los PO y los estados de trabajo. Lo único que cambia entre oficios son **datos**: su lista de acciones exclusivas (con nombre y sabor propios), cómo se reparte la *Condición* y qué estados dan. Una fila nueva en las tablas `WK.A`/`WK.D`, nunca código por oficio.
| Oficio | Sabor de sus acciones exclusivas (solo datos) | Condición favorecida | Entrelaza con |
|---|---|---|---|
| **Herrería** (`sm`) (≈ Herrero/Armero) | *Golpe doble* (2 de Avance, gasta 2× Resistencia), *Templar* (+Resistencia final), *Forja en caliente* (Veneración + Concentración), *Estirar*, *Remachar* | *Bueno* sale más a menudo tras *Forja en caliente* | Minería (lingotes), Tala (mangos), Artesanía (agarres), Joyería (engarces) |
| **Artesanía** (`cr`, cuero) (≈ Peletero) | *Curtir* (+Resistencia), *Costura fina* (Calidad barata), *Grabar*, *Remojar* (restablece la Condición) | Cuero «húmedo» = *Bueno* más probable | Caza, Herbolaria (tintes), Herrería (remaches) |
| **Escultor** (`es`, madera/piedra) (≈ Carpintero) | *Desbastar* (Avance grande), *Pulir* (Calidad fina), *Ensamblar* (suma de 2 piezas), *Veta favorable* | *Excelente* más probable tras *Observar* | Tala (tablones), Herrería (herrajes), Herbolaria (barnices) |
| **Cocina** (`co`) | *Sofreír*, *Hervir lento* (Avance barato y lento), *Salsa* (Innovación), *Plato firma* (receta única del bioma) | Ingredientes frescos = *Bueno* | Pesca, Granja, Herbolaria; **su comida da +PO/Maña/Pulso a TODOS los oficios** |
| **Alquimia** (`al`) (≈ Alquimista) | *Destilar* (Concentración), *Reflujo* (repite la última acción de Calidad sin coste), *Filtro*, *Antídoto* (elige el estado de `STS` a curar) | *Excelente* tras *Destilar* | Herbolaria, Caza, Cocina; **pociones de PR/PO y antídotos** |
| **Sastrería** (`ta`) (≈ Tejedor) | *Tejer doble*, *Teñir* (color + resistencia elemental), *Bordado*, *Acolchar* | Hilo tenso = *Bueno* | Lana/lino/seda, Herbolaria (tintes). **Mochilas `bag_*`** |
| **Encantamiento** (`en`, sustituye Inscripción) (≈ Grabado/Materia) | *Encantar* (añade ranura), *Desencantar* (objeto → **polvo**), *Fusionar runas*, *Sobrecarga* | *Excelente* con luna llena / bioma afín | Joyería (engarzar), Alquimia (tinta), Herrería (vaciar) |
| **Joyería** (`jo`) (≈ Orfebre) | *Tallar facetas*, *Engarce firme*, *Fundir oro/plata*, *Pulir espejo* | *Excelente* tras *Pulir espejo* | Minería (gemas, plata, oro), Encantamiento. Llena `r`, `r2`, `n` |
| **Ingeniería** (`ing`) | *Calibrar*, *Soldar*, *Lubricar* (Innovación), *Prototipo* (receta nueva determinista) | *Bueno* tras *Calibrar* | Herrería, Minería, Sastrería, Alquimia (pólvora). Artilugios, trampas, mascotas mecánicas |
| *Inscripción* | Se retira cuando entre Encantamiento (decisión vigente). | — | — |
**Código existente:** el minijuego de forja (`fmInit/fmPress/fmReheat/fmTick/fmDraw`, game.js) y el patrón `mgBegin/mgHintRows/mgUi` para crafteo se retiran/ reciclan al implementar L0 (los pasos del tutorial de la isla que piden forjar deben seguir funcionando: recetas lv ≤ 3 con síntesis rápida o rotación guiada de 3 acciones).


### 3.3 Combate / magia (no son oficios, solo notas)
Magia, Combate, Arquería y Oración **no entran en este rework**; Oración puede ganar una versión «ritual» (ofrendas que dan PO a los demás oficios) como idea futura; no se hace sin pedirlo.

## 4 · Sistemas que se pueden sumar (opcionales, de menos a más trabajo)
1. **Maestros** (B4/ID3): enseñan acciones cruzadas, venden *Libros de Maestro* (recetas que exigen Calidad ≥ X) y compran *Piezas de maestro* por Marcas.
2. **Encargos diarios de oficio** (tablón `quests.js`): «trae 3 espadas de calidad ≥ 70 %» → Marcas + XP.
3. **Equipo de oficio**: herramienta + ropa (gorro/delantal/guantes) que dan Maña/Pulso/PO/PR; las fabrican los propios oficios (loop de progresión estilo FF14).
4. **Tabla de Conjuntos de Rotación**: una macro simple (guardar 6 acciones en una tecla) para quien quiera automatizar sin ser idle.
5. **Maestría semanal** (opcional, online futuro): ranking de piezas con mayor calidad.

## 5 · Plan de entrega (lotes cortos, un entregable por mensaje; ver `PLAN_OFICIOS_Y_BIOMAS.md` §4)
1. **L0 · Núcleo de Hoja de trabajo (`src/work.js`, global `WK`)**: tablas `WK.D` (estados), `WK.A` (acciones genéricas), PO/Maña/Pulso desde la herramienta, panel DOM, síntesis rápida, PRNG propio. Un oficio piloto: **Herrería** (se retira su minijuego de calor/ritmo y pasa a la rotación).
2. **L1 · PR + habilidades de recolección** (§2) sobre la rueda; barra de 6 compartida con el combate (cambia con el contexto). Pesca con cebo/picada.
3. **L2 · Resto de crafteo existente** (Artesanía, Escultor, Cocina), cada uno con sus acciones exclusivas.
4. **L3 · Herbolaria + Alquimia** (con la Pradera completa), luego **Sastrería** y **Encantamiento** según el orden del dueño.
5. **L4 · Joyería, Ingeniería, Domar, Agricultura** (las últimas).
6. **Acciones cruzadas, Maestros y piezas de maestro** cuando existan 2+ oficios sobre el esqueleto.
Cada lote: `craft_balance.py`, `meas_progresion.py` (35–65 h a 99), `rules_check.py`, `R3D.budget()` (§P), `warmObjs` si crea materiales, y documentación en `AGENTS.md` + `HOJA_DE_RUTA.md`.

## 5b · Barra de habilidades (propuesta)
**No se expande la barra de combate (H11, 6 casillas).** Con ≈ 40 habilidades por oficio, FF14 usa un *libro de acciones* + varias barras; aquí:
1. **Barra contextual:** al empezar a craftear o recolectar, el HUD cambia a la barra del oficio (misma posición, bajo el marco del jugador, absoluta como `#hs-sk` para no mover el marco); al terminar vuelve la de combate. Nunca conviven.
2. **Libro de acciones** (`Hoja de trabajo`/`Libro del oficio`): panel de cristal con **todas** las acciones del oficio en cuadrícula, agrupadas por función (**Avance · Calidad · Estados · Reparación · Utilidad**), las no aprendidas atenuadas con su nivel. Clic = usar; **arrastrar** (reusa `dragdrop.js`) a una casilla de la barra = asignarla. Pasar el ratón muestra PO, efecto y condición requerida (tooltip del juego).
3. **Barra de oficio de 10 casillas** (teclas 1–0) + **segunda fila con Mayús+1–0** = 20 asignables, guardadas por oficio (`S.bar.<oficio>`). Recolección usa solo ≈ 8 activas a la vez; el crafteo usa 12–16 en una rotación real.
4. **Macros de rotación** (nv 30+): hasta 6 acciones en secuencia con la animación de cada una (≈ 1,5 s, como FF14). Siguen siendo una pulsación del jugador por pieza (no es idle: tú decides y vigilas la condición; si aparece una *Excelente* inesperada, la macro se detiene). Se editan en el libro.
5. **Rotaciones sugeridas** (botón «Sugerir» por receta, nivel ≤ 40) para quien no conozca FF14: pocos textos, solo resalta la siguiente acción recomendada. Muy útil en el tutorial.
Táctil: la barra se vuelve una hoja inferior con scroll; el libro es pantalla completa.

## 5c · Herramientas que se fabrican y mejoran (propuesta; paridad FF14)
Hoy: `S.tool={wc,mi,fi}` con 6 niveles `TN` y mejoras compradas. Pasa a:
- **Cada oficio tiene su herramienta (y una secundaria)**: Tala/Minería/Pesca/Herbolaria (hacha, pico, caña, hoz) y crafteo (martillo de forja, cuchillo de peletero, formón, olla, alambique, telar de mano/agujas, vara de runas, lima de joyero, llave inglesa). 11 tiers (los de metal/madera del juego) en vez de 6, para que el tier de la herramienta importe por igual en todo.
- **Se fabrican entre oficios (interconexión):** p. ej. hacha = cabeza (Herrería) + mango (Escultor) + agarre (Artesanía); formón = hoja (Herrería) + mango (Escultor); alambique = vidrio/cobre (Herrería) + soporte (Escultor) + engaste (Joyería); agujas de sastre = acero (Herrería) + marfil (Joyería). Así cada oficio *necesita* a otro para progresar.
- **Dos ranuras de oficio** (principal + secundaria, como FF14) más **ropa de oficio** opcional (gorro, delantal, guantes; la fabrican Sastrería y Artesanía). Dan **Maña/Pulso/PO** (crafteo) o **Percepción/Alcance/PR** (recolección).
- **Engastes:** las herramientas tienen 1–5 ranuras para **gemas de oficio** (cortadas por Joyería, imbuidas por Encantamiento): más Maña, Pulso, PO o PR. Más ranuras = tier más alto; sin riesgo de perder la herramienta (decisión: castigo suave, fallar un engaste solo gasta la gema).
- **Mejorar herramienta (tier-up):** además de fabricar una nueva, el **Maestro** del oficio ofrece una **mejora de herramienta** a cambio de Marcas de Maestro + materiales de otros oficios (la «herramienta de relic» de FF14, en pequeño); mantiene los engastes.
- **Desbloqueo del tutorial:** la isla y la Pradera dan la de tier 1; no bloquea nada.
- **Coste de contenido:** ~10 oficios × 2 herramientas × 11 tiers = ~220 objetos. Se generan **por datos** (tabla de tiers + plantilla por herramienta), iconos 3D desde `ICON3D/BUILD`; sin modelos a mano.
- **Riesgos:** tabla enorme de recetas → ejecutar `craft_balance.py` (tope 5 componentes); migrar `S.tool` (guardados descartables, se puede resetear); equilibrio de gemas con `meas_progresion.py`.

## 5d · Herramientas por CULTURA / bioma (decisión del dueño, 22 oct)
Cada bioma tiene cultura (`CULT_OF`: 0 Pradera medieval · 1 Bosque élfico · 2 Pantano tribal · 3 Cumbres nórdico · 4 Oriental samurái · 5 Volcán infernal; **hay 9 biomas**: Desierto, Costa y Páramo, y el Cielo, tendrán la suya al implementarse). **El aspecto de la herramienta cambia con el tier según la cultura del bioma donde ese tier se obtiene/fabrica**:
- La **tabla de tiers** lleva `cult` por rango (p. ej. cobre–bronce = Pradera; hierro–acero = Bosque/Pantano; plata–mitril = Cumbres; adamantita–runita = Oriental; oricalco–celestita = Volcán/Cielo; ajustar al reparto real de `BIOMES`). Es DATO: una columna, nunca un `if` por bioma.
- Cada herramienta tiene una **plantilla por cultura (solo aspecto, sin bonos)** (silueta y motivos: martillo medieval de cabeza cuadrada, hacha élfica de hoja curva con madera clara, mazo tribal con huesos, hacha de barba nórdica con runas, kanabo/hachuela japonesa laqueada, pico infernal con hierro negro y brasas). Modelos con `ICON3D/BUILD` + colores del tier (`TI`); regla de sentido (escala ×1,5, mano con `F.hold`, sin clipping).
- **Receta cultural:** la herramienta de una cultura pide un componente propio de ese bioma (hierba, fibra, madera, hueso, cuero…) → empuja a viajar y entrelaza con la recolección regional. Se puede fabricar en cualquier sitio una vez conseguido el material.
- Coste: ~220 objetos pero **~10 plantillas × hasta 9 culturas** (una por bioma; 6 ya existen, Desierto/Costa/Páramo al llegar) de modelo y el resto es color/datos. Empezar solo con Pradera (2 tiers) para validar el flujo.

## 5e · Interfaz: «Hoja de trabajo» y «Libro de oficio» (diseño, 22 oct)
Maqueta interactiva mostrada en la conversación (misma estructura que FF14: Avance, Calidad, Resistencia, PO, Condición, Concentración, estados, rejilla de acciones por grupo, barra inferior, «Sugerir»). Lista de lo que la UI debe cubrir (revisión de detalles):
1. **Entrada:** acercarse a la estación (E) → panel de recetas del oficio (lista con buscador, filtro «puedo fabricar», nivel, estrellas de dificultad) → elegir receta → **Hoja de trabajo** (ventana flotante junto a la estación, cristal + trazo dorado `#e8cf94`, Cinzel/Spectral; no tapa al héroe; el yunque/telar sigue visible en el mundo y reacciona: chispas, vapor, hilo).
2. **Cabecera:** icono 3D de la pieza (`ICON3D`), nombre, nivel de oficio/receta, herramienta equipada y sus Maña/Pulso/PO.
3. **Barras:** Avance (dorada), Calidad (azul) con el % de calidad superior, **Resistencia** (número que baja), **PO**, **Concentración** (puntos), **paso**, **Condición** (chip de color: Normal/Buena/Excelente/Mala + 6 avanzadas con icono y tooltip).
4. **Estados activos** como fichas con contador de turnos (tooltip del juego con el efecto).
5. **Rejilla de acciones** agrupada (Avance · Calidad · Estados y reparación · Utilidad); coste en PO; atenuada si falta PO/nivel/condición con el motivo en el tooltip; la recomendada del botón «Sugerir» late; acciones de uso limitado muestran usos restantes.
6. **Barra inferior** (20 asignables, teclas 1–0 y Mayús+1–0), macros (nv 30+), «Sugerir», «Reiniciar» (con confirmación; gasta los materiales solo al terminar o cancelar tarde) y «Síntesis rápida» cuando aplica.
7. **Feedback en el mundo:** partículas `R3D.fx` por acción (Avance = golpe/chispa; Calidad = brillo; Excelente = destello dorado), sonido sintético por oficio, animación del héroe por acción (`armPose`), **parada breve** al cerrar la pieza.
8. **Resultado:** pantalla corta con la pieza, calidad, XP, «Fabricar otra» (repite hasta N unidades; la tanda no es idle: cada pieza se juega o se hace síntesis rápida).
9. **Accesibilidad/táctil:** botones ≥ 44 px, hoja inferior en móvil, sin depender solo del color (la condición tiene icono y texto), teclado completo, sin temporizadores de reflejos (por turnos).
10. **Reglas:** `.hs-*`, DOM ligero (sin canvas), no mueve el marco del jugador, entra en la cola de ayudas `ctxHint` solo las primeras N veces, textos mínimos (regla del dueño) y sin Math.random.
11. **Recolección:** misma estética; el libro de acciones y la barra de oficio sustituyen la de combate mientras recolectas.

## 5f · El personaje HACE cada acción (animación + efectos por habilidad; lo que hace adictivo a FF14)
**Regla:** cada acción de la barra dispara una *animación del héroe + efecto en el mundo + sonido*, con el impacto sincronizado con el resultado (patrón `armPose/armP0`, `forceFade` del lote IK-LATENCIA; el efecto sale al impacto, no al clic). Todo se define por DATOS en una columna de `WK.A` (`fx:{clip,imp,vfx,snd,cam}`), nunca código por acción.
- **Clips base por oficio** (ya existen en `heroanim3d.js`: `WORK` chop/mine/smith y `LOOPS` co/fu/cr…; faltan es, ta, al, en, jo, ing): se reutilizan como pose de espera del oficio (martillo en alto, cuchillo en la mano…), y cada acción elige **variante**: golpe corto (Síntesis básica), golpe fuerte a dos manos (Cimientos, Síntesis intensiva), toque fino/lento (Toques de calidad), pausa mirando la pieza (Observar), brazos abiertos con aura (Veneración/Innovación), giro de remate (Bendición de Byregot), reparación (Reparación del maestro: mano en la pieza y destello).
- **Grupos visuales** para no animar 35 cosas a mano: **Avance** = golpe (3 variantes por intensidad, según la eficiencia %), **Calidad** = toque (3 variantes), **Estado** = pose de concentración + aura del color del estado (dorada Veneración, azul Innovación, verde Sin desperdicio, blanca Gran avance), **Reparación** = pase de mano, **Utilidad** = mirada/pausa. Las acciones especiales (Byregot, Memoria muscular, Perfección entrenada) tienen un clip propio corto.
- **La estación reacciona** (props existentes, `GLOW`/`R3D.fx`): yunque con chispas y calor (color según la Condición: Excelente = blanco dorado), telar con hilo, alambique que burbujea, mesa de runas que brilla, horno que avanza de intensidad con el Avance. La pieza sobre la mesa **cambia de aspecto con el progreso** (de bruto a pulido), usando el icono 3D (`ICON3D`) o un modelo de tres fases.
- **Sonido por acción** (síntesis `whSnd` ampliada: golpe, toque, burbujeo, chasquido de runa…) con un *tono ascendente* en la racha de Concentración; campana distinta al terminar según la calidad superior (como el «¡ding!» de FF14). Grabaciones CC0 cuando existan (créditos en `docs/CREDITOS.md`).
- **Cámara:** reutilizar el enfoque de minijuegos (`MG_ZOOM`/`MG_PULL`), con un leve empuje al **Byregot** y a las piezas de maestro; nada de cines largos.
- **Barra:** al pulsar, la casilla se ilumina con **barrido de animación/bloqueo** (como un «gcd» de ≈ 1,5 s que coincide con el clip), y las condiciones *Excelente/Buena* hacen latir las acciones que las aprovechan (Toque preciso, Síntesis intensiva, Trucos del oficio).
- **Recolección:** igual; cada habilidad de la rueda tiene su gesto (Golpe certero = pose de apuntar, Cosecha abundante = barrido amplio, Visión nítida = destello en los ojos y en el nodo), con las partículas ya existentes (`R3D.fx`).
- **Resultado:** al terminar la pieza el héroe la levanta y la mira (pose corta) con el destello del color de la calidad (verde/azul/dorado) — es el «momento adictivo».
- **Coste y límites:** ≈ 12 clips nuevos (5 por oficio nuevo + ~7 compartidos), VFX con `R3D.fx` (cero renderers/luces nuevos → §P); cada material nuevo con `warmObjs`. Orden: primero Herrería (martillo, ya hay `smith`), luego el resto de oficios al llegar.

## 5g · Hoja de personaje: equipo de oficio + qué hace la CALIDAD (propuesta, 22 oct)
Hoy (`game.js`): ranuras `EQK=['h','f','r','r2','n','w','c','s','l','g','m']` (+`a` armadura), herramientas aparte en `S.tool` (3 oficios, 6 tiers), calidad como sufijo `id~1..3` (`qv`, `rr()` la usa como rareza; ver también RAREZA-POR-GRADO). No se revisó aún el HTML de la pestaña Personaje (`paintDoll`, `HUDSU.doll`, `bagGridHTML`); L0c empieza por leerlo.

### A · Equipar TODAS las herramientas
1. **Pestaña nueva «Oficios» dentro de Personaje** (junto a Combate; el muñeco 3D se queda y muestra la herramienta en la mano). Columna izquierda: lista de los 12 oficios con icono de línea (`SKI`), nivel y barra de XP; al elegir uno, la derecha muestra **sus ranuras**: *Principal*, *Secundaria*, *Gorro*, *Delantal/Chaqueta*, *Guantes* y las **gemas engastadas** (1–5) de la herramienta.
2. **Conjuntos por oficio (como FF14):** cada oficio guarda su set (`S.eqt.<oficio>={m,s,g,d,k,gems}`); al empezar una tarea (estación, nodo, pesca) el juego **cambia solo** el modelo en mano y aplica sus stats, y al terminar vuelve el equipo de combate. Así las ranuras de combate no se llenan ni hay que andar cambiando de objeto. Opción «equipar la mejor herramienta de la mochila» si la ranura está vacía (aviso de una línea).
3. **Stats de oficio** (sumas del set; panel de «Atributos» con delta verde/rojo al pasar un objeto, como el equipo normal): Crafteo = **Maña** (avance), **Pulso** (calidad), **PO**. Recolección = **Percepción** (probabilidad de raro/gema), **Alcance** (anchura del arco de la rueda), **PR**. Pesca/Herbolaria/Domar usan las suyas (Olfato, Delicadeza, Empatía) con la misma lógica de tabla.
4. **Arrastrar y soltar:** extiende `data-eq` con `t.<oficio>.<ranura>` (reutiliza `dragdrop.js`/`#bw`); ranura equivocada → vuelve. La mochila flotante `#bw` también aparece en esta pestaña.
5. **Datos:** `S.tool` se migra a `S.eqt` (guardados descartables, sin migrar); `TOOLT` pasa a la tabla por oficio×tier×cultura (§5c–5d). Las herramientas dejan de ocupar la ranura de arma (`w`).
6. **Táctil/móvil:** lista de oficios arriba (scroll horizontal), ranuras abajo, ≥ 44 px.

### B · Qué hace la CALIDAD (propuesta; hoy solo da rareza y algo de estadísticas)
Niveles de calidad: **Normal (0), Superior (~1), Excelente (~2), Maestra (~3)**, el mismo sufijo ya existente (no hay que migrar ids). **Cómo se obtiene:** `hq% = Calidad/CalidadMáx` al terminar la hoja de trabajo; el nivel se saca con el PRNG de la pieza: ≥ Superior con prob. `hq%`; ≥ Excelente con `(hq%−40)/60` si hq% > 40; Maestra solo con hq% = 100 y nivel de oficio ≥ 60 (pequeña probabilidad, 25 %).
| Tipo de objeto | Efecto de la calidad |
|---|---|
| **Armas y armaduras** | +6 % / +12 % / +20 % a **todos sus stats** (daño, defensa, bonos); Maestra además +1 ranura de gema. Siempre menor que el salto al siguiente tier (la progresión por tier manda). |
| **Herramientas** | Igual sobre Maña/Pulso/PO o Percepción/Alcance/PR, y +1 ranura de gema en Excelente y Maestra. |
| **Comida y pociones** | Más potencia (×1,25 / ×1,5 / ×2) y duración (+25 % / +50 % / +100 %). |
| **Materiales intermedios** (barras, tablones, tela, cuero) | **Calidad inicial de la siguiente pieza:** cada ingrediente de calidad aporta Calidad de partida a la hoja de trabajo (como los materiales HQ de FF14). Aquí está la interconexión: Pureza al recolectar → material de calidad → mejor pieza. |
| **Piezas de maestro** | Exigen un umbral de **puntuación de Calidad** (no solo nivel); dan Marcas de Maestro, XP extra y las pide el tablón. |
| **Valor / venta** | ×1,5 / ×2 / ×3. |
| **Visual** | Marco y aura por rareza ya existentes (`data-g`, `slotfx`), brillo del icono 3D; el nombre lleva el calificativo (*Superior*, *Excelente*, *Maestra*). |
**Reglas de equilibrio:** el techo total de bonos de calidad (+20 %) queda por debajo de la diferencia entre tiers vecinos; la calidad **nunca** aparece en objetos de misión (`QITEM`); las probabilidades usan PRNG (no `Math.random`, hoy `qv` sí lo usa: se sustituye al integrar). `craft_balance.py` y `meas_progresion.py` deben medir el efecto.

### C · Cambios de código previstos (L0c, tras leer la pestaña Personaje)
`eqKey`/`EQK` + nueva zona `eqt` en `dragdrop.js`; HTML de la pestaña «Oficios» y CSS (`hud-susurro.css`); `gs(k)` suma stats de oficio; `qv` → calidad por `WK`; migración de `S.tool`; aviso de línea única al cambiar de set.

## 5h · Conjuntos de oficio y bucle ADICTIVO de progresión (22 oct)
**Qué hacen los conjuntos (como FF14: cambio de equipo y nada más):**
1. **Cambio automático** de herramienta y ropa al trabajar (§5g-A): lo cómodo.
2. **SIN pasivas ni bonos por cultura (decisión del dueño, 22 oct):** como en FF14, el conjunto no da bonos; el poder sale solo del tier, el grado, la calidad y las gemas. La **cultura es solo ASPECTO** (modelo/colores) y de qué material pide la receta (§5d).
3. **Conjuntos de maestro** (relic ligero): al terminar la cadena de Maestro de un oficio, el set se mejora por etapas visibles (brillo y aura); es la meta larga.
**Qué hace adictivo subir (lo que repite FF14):**
- **Cadencia de desbloqueos:** una acción nueva cada 3–6 niveles del oficio (tabla §1), con un **aviso de nivel** que muestra el gesto nuevo (vista previa de 2 s de la animación) y la ilumina en la barra. Nunca más de 5 niveles sin algo nuevo.
- **Recetas por nivel con «Libro de recetas»:** lista por nivel con estrellas de dificultad, marcas de lo ya fabricado y un destello en la siguiente receta alcanzable; **bono de XP la PRIMERA vez** que fabricas una receta (grande) y XP creciente por dificultad relativa.
- **Cada pieza es un mini-reto:** la hoja de trabajo es un puzle de rotación con resultado graduado (Normal → Maestra) y un remate sonoro/visual del color de la calidad (§5f). «Una más» sale solo.
- **Meta de equipo cada 5 niveles:** un objeto nuevo útil (herramienta/ropa) que puedes fabricar a ese nivel, como la «herramienta de 5 en 5» de FF14.
- **Maestros y encargos** (cadena corta cada 10 niveles: «trae una pieza Excelente»), **recolección con Pureza** y **piezas de maestro** como objetivo, y **recetas de cultura** que piden viajar.
- **Curva:** subidas rápidas al principio (nivel 1–20 en pocas horas, objetivo de `meas_progresion.py`), más largas después sin muros: nunca más de ≈ 10 min por pieza.
- **Registro visible:** el panel «Oficios» muestra nivel, XP, siguiente desbloqueo y una racha diaria suave (sin castigos).

## 5i · Mejora de equipo de oficio cada X niveles, estilo FF14 (DECIDIDO, 22 oct; la cultura solo cambia el ASPECTO; números a calibrar)
**Concepto:** el equipo de oficio sube de tier **por nivel del oficio** (como FF14) y el **aspecto** de cada tier depende de la cultura del bioma donde se consigue su material (§5d), sin bonos. Tu equipo se queda atrás cada pocos niveles y siempre hay algo nuevo que fabricar.
### Cadencia: X = 9 niveles por tier + «grado reforzado» a mitad
Hay 11 tiers (los metales/maderas del juego) en 99 niveles: un tier nuevo cada 9 niveles, y entre dos tiers un **grado Reforzado** (+4–5 niveles) que se consigue **mejorando** la pieza. Resultado: algo nuevo cada ≈ 4–5 niveles, igual que FF14.
Hay **9 biomas** en el continente (Pradera, Bosque, Pantano, Cumbres, Oriental, Volcán + Desierto, Costa, Páramo; los tres últimos aún sin implementar) y la isla del Cielo. El reparto tier→bioma es un DATO que se rellena al implementar cada bioma; propuesta inicial de aspecto (se ajusta con el rango de niveles real de `BIOMES`):
| Tier (nv de oficio requerido) | Bioma / cultura del aspecto |
|---|---|
| Cobre 1 · Estaño 10 | Pradera (medieval) |
| Bronce 19 | Bosque (élfica) |
| Hierro 28 | Pantano (tribal) |
| Acero 37 | Cumbres (nórdica) |
| Plata 46 | Oriental (samurái) |
| Mitril 55 | Volcán (infernal) |
| Adamantita 64 · Runita 73 | Desierto · Costa (culturas por definir) |
| Oricalco 82 | Páramo (por definir) |
| Celestita 91 | Cielo / endgame |
Mientras un bioma no exista, sus tiers usan el aspecto de la cultura anterior (nada se bloquea).
### Cómo se consigue cada paso
1. **Pieza del tier (fabricar):** la pieza nueva se fabrica entre oficios (§5c) con un material propio de la cultura (hierba/fibra/madera/hueso del bioma). Requiere **nivel de oficio ≥ nivel del tier** para equiparla (como FF14).
2. **Mejora a Reforzada (+1 grado):** en la estación del oficio o con su Maestro se gasta un material cultural + Marcas de Maestro; conserva calidad y gemas. Si no quieres mejorar, igual puedes fabricar la siguiente.
3. **Primera pieza gratis (hallazgo):** al alcanzar el nivel de un tier, el Maestro del oficio da una misión corta y regala la primera herramienta del tier (para que nunca bloquee).
4. **Aviso de nivel:** al subir al nivel de un tier sale el aviso dorado con el icono de la pieza nueva y qué cultura/material necesita (una línea).
### Stats y pasivas
- **Curva:** `stat(slot,tier,grado,calidad) = base[oficio] · peso[slot] · (1 + 0,18·tier) · (1 + 0,06·grado) · (1 + bono de calidad)`; pesos: principal 40 %, secundaria 20 %, gorro 13 %, delantal 15 %, guantes 12 %. Cada tier es un salto claro; grado y calidad suman menos que el siguiente tier (§5g).
- **Sin pasiva de conjunto.** Solo cuentan los atributos de cada pieza; la cultura únicamente cambia el modelo y los colores.
- **Engastes:** 1 ranura por tier par hasta 5; las gemas se conservan al mejorar.
### Implementación (por datos, sin código por objeto)
- Tablas: `TIERS_OFICIO` (tier, nv, cultura, material principal, material cultural) y `GEAR_SLOTS` (peso por ranura); un **generador al arrancar** (como `applyInterlock`) crea los ids `og_<oficio>_<ranura>_<tier>_<grado>` en `I`, la tabla de herramientas, las recetas en `ACT` y sus iconos (`ICON3D/BUILD`, plantilla × cultura × color de tier).
- `gs()`/`ws(oficio)` suma los stats de oficio del conjunto activo; la pestaña «Oficios» (§5g) los muestra con el delta de cada objeto.
- Requisito de nivel en `eqKey`/`use()`; migración `S.tool` → `S.eqt`; mejora = receta especial con `keep gems`.
- **Orden:** (1) tablas + generador + Herrería y Pradera (cobre/estaño, aspecto medieval), (2) pestaña «Oficios» con conjuntos y cambio automático, (3) mejora/Reforzada y misión de hallazgo, (4) resto de oficios y culturas al llegar sus biomas.

## 5j · Diseño de «dopamina» (checklist de recompensas; 22 oct, aprobado el enfoque)
Principios de diseño de juegos usados (refuerzo variable, gradiente hacia la meta, bucles de retroalimentación cortos, victorias pequeñas frecuentes). No hay una cifra «óptima» universal: se **prueba y se ajusta** midiendo cuánto tarda cada recompensa.
1. **Retroalimentación inmediata (< 0,3 s):** cada acción responde con gesto, partícula y sonido (§5f). Es la base de «una más».
2. **Victorias pequeñas cada pieza:** el resultado es graduado (Normal → Maestra) con remate sonoro/visual propio; nunca un simple «hecho».
3. **Recompensa VARIABLE:** la calidad superior (tirada), la condición *Excelente* que aparece sin avisar, los nodos dorados/de leyenda, el raro con *Ojo de veta* y las piezas de maestro. Lo impredecible engancha más que lo fijo; cuidar que sea **frecuente** (≈ 1 de cada 4–5 piezas da algo notable) y que nunca castigue.
4. **Gradiente hacia la meta:** barras de XP y «siguiente desbloqueo» siempre visibles en el panel de Oficios; avisar al 80 % («Casi tienes *Bendición de Byregot*»).
5. **Cadencia de novedad:** acción nueva cada 3–6 niveles + tier cada 9 + Reforzada a mitad = algo nuevo cada 4–5 niveles (§5i). Los primeros niveles (1–20) suben rápido: la primera hora debe regalar 4–5 desbloqueos.
6. **Primera vez = premio grande:** bono de XP por cada receta nueva, y por primera pieza Excelente/Maestra, primer nodo dorado, etc. (logros cortos con medalla).
7. **Fluidez, no fricción:** cola de «fabricar N» con macros, atajos de teclado y «Sugerir» para que la maestría sea divertida, no tediosa; la síntesis rápida cubre lo trivial.
8. **Sin castigos duros:** fallar = peor calidad, nunca perder material (decisión vigente); los topes de tiempo por pieza siguen ≤ 10 min.
9. **Meta larga visible:** herramientas de maestro y conjunto de maestro con etapas (§5h); racha diaria suave.
10. **Medir:** tras L0 calibrar con `meas_progresion.py` (tiempo hasta cada desbloqueo) y probar con el dueño: si pasan > 5 niveles o > 20 min sin algo nuevo, se acorta.

## 5k · Estado de implementación
- **L0a** `src/work.js` (núcleo) y **L0b** `src/workui.js` (panel + Herrería) HECHOS el 22 oct (ver lote en AGENTS.md). **L0c** (22 oct): zoom al craftear, más efectos por acción y ventanas arrastrables (`winmove.js`). Pendiente: calibrar cifras, libro de acciones con arrastrar/asignar, macros, meta cercana en el panel de oficio, animaciones propias por acción, resto de oficios.

## 5l · Móvil
La hoja de trabajo, la barra de oficio y el libro de acciones deben nacer con variante táctil (hoja inferior, casillas grandes, pulsación larga para ver la ficha de la acción, sin arrastrar ventanas): ver `docs/PLAN_MOVIL.md` §1 y M2.

## 6 · Decisiones que necesita el dueño ★
1. ~~¿Esqueleto común?~~ **DECIDIDO (22 oct): sí, fórmula FF14 pura para todo el crafteo; minijuegos propios cancelados.**
2. ¿**PR (GP)** para recolección, con habilidades entre golpes? ¿O prefieres que la rueda siga sin recurso y las habilidades sean solo enfriamientos?
3. **Síntesis rápida** (recetas muy por debajo de tu nivel): ¿sí o rompe «sin idle»?
4. **Comida y pociones de oficio**: ¿sí (entrelazan oficios) o demasiado FF14?
5. Dónde se **plantan** Agricultura/Apicultura (propuesta: parcelas por aldea).
6. Orden de implementación: ¿empezamos por el **núcleo + Herrería** (L0)?

7. Barra contextual + libro de acciones + macros (§5b) y herramientas fabricadas entre oficios con engastes y mejora por Maestro (§5c): ¿sí? ¿cuántas ranuras de herramienta (principal + secundaria)?

8. ~~Herramientas por cultura~~ **DECIDIDO (22 oct): sí**, el aspecto cambia por cultura del bioma al subir de tier (§5d). Pendiente: reparto de tiers por bioma.

9. ~~Animaciones y efectos por habilidad~~ **DECIDIDO: sí** (§5f). El héroe y la estación reaccionan a cada acción de la barra.

10. ¿Conjuntos por oficio con cambio automático (recomendado) o ranuras de oficio siempre visibles en la hoja de combate? ¿Niveles de calidad Normal/Superior/Excelente/Maestra y los porcentajes de §5g-B?

11. ~~Pasiva por cultura~~ **DESCARTADA (22 oct): la cultura es solo aspecto.** Mejora por niveles estilo FF14 (§5i); **X = 9 CONFIRMADO (22 oct)**; el reparto tier→bioma se rellena al implementar cada bioma (9 biomas).
