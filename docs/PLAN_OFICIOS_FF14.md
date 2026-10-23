# PLAN · Oficios estilo FF14 (PROPUESTA del 22 oct 2026; nada implementado)

> Pedido del dueño (22 oct 2026): «reworkear los oficios como en FF14. Los de recolección me gustan como están (el circulito); hacerlos más interesantes con habilidades. Sugerencias para TODAS las profesiones actuales + las que vamos a agregar.»
> **Estado: borrador para decidir.** Engancha con `docs/PLAN_OFICIOS_Y_BIOMAS.md` (orden Herbolaria → Alquimia → Sastrería → Encantamiento), `docs/HOJA_DE_RUTA.md` Fase 3·c y la barra de 6 habilidades. **Decisión del dueño (22 oct): el crafteo de TODOS los oficios usa la fórmula FF14 (Avance/Calidad/Resistencia/PO, rotación de acciones); los minijuegos propios planeados antes quedan CANCELADOS.** Los oficios solo se diferencian por sus acciones exclusivas (datos).

## RESUMEN EJECUTIVO (22 oct 2026, para el siguiente agente) — lo que hay y lo decidido
**HECHO (código):** núcleo `src/work.js` (40 acciones, planificador, calibración `tools/work_sim.js`, ver `docs/CALIBRACION_HOJA_TRABAJO.md`); panel `src/workui.js` (barra de 20 casillas, libro con arrastrar, 3 macros, meta cercana, síntesis rápida, zoom, efectos); animaciones del herrero (`smithV`); equipo de oficio por tier (`src/oficios.js`, solo Herrería); ventanas arrastrables (`src/winmove.js`). Solo la HERRERÍA usa el sistema.
**DECIDIDO (sin implementar):** crafteo FF14 puro para todos los oficios (sin minijuegos propios); recolección = la rueda actual + Puntos de Recolección y habilidades (§2); sin pasivas por cultura (la cultura solo cambia el aspecto); tier de equipo cada 9 niveles + grado Reforzado (§5i); calidad Normal/Superior/Excelente/Maestra (§5g); `Math.random` permitido en azar de crafteo; móvil al final (`docs/PLAN_MOVIL.md`).
**SIGUIENTE (orden acordado):** (1) piezas intermedias e interconexión de herramientas (mangos de Escultor, agarres de Peletería, hojas de Herrería); (2) portar Peletería y Artesanía a la hoja de trabajo (`WKUI` hoy fijo a Herrería: parametrizar); (3) Desollar + Sastrería nivel 1; (4) casa de la Pradera con muebles de Artesanía y parcelas fijas. Después: Cocina, Alquimia, Herbolaria, Encantamiento, Joyería, Ingeniería, Domar, Agricultura/Apicultura; luego los biomas.
**Reparto de oficios (CORREGIDO por §5r):** Artesanía = madera (arcos, flechas, madera lisa, mangos, muebles), Escultor = piedra y tallas; 11 biomas (9 + Cielo e Infierno al final). Recolección = Tala, Minería, Pesca, Herbolaria, Desollar (habilidad aparte, sin pasivas, cuchillo comprado una vez), Agricultura, Apicultura, Domar. Fabricación = Herrería, Peletería (cuero: curtir piel cruda), Sastrería (fibra → madeja → tela), Escultor (piezas intermedias y tallas), Artesanía (muebles por ensamblaje), Cocina, Alquimia, Encantamiento (sustituye Inscripción), Joyería, Ingeniería.
**Lana/fibras:** lana al desollar ovejas/cabras/yaks; fibras vegetales de Agricultura (y de nodos silvestres de Herbolaria mientras tanto); seda de bichos. Mucha más fauna por bioma (§5q).
**Decisiones ★ abiertas:** PR en recolección (§6.2), comida/pociones de oficio, cuántas anclas por habitación y si cofre/descanso van en todas las casas, reparto exacto tier→bioma al implementar cada bioma.

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
- **L0a** `src/work.js` (núcleo) y **L0b** `src/workui.js` (panel + Herrería) HECHOS el 22 oct (ver lote en AGENTS.md). **L1** (22 oct): Herrería completa (exclusivas, calibración con `tools/work_sim.js`, meta cercana, libro/barra de 20 con macros, animaciones por acción y equipo de oficio por tier con ventana `#ofw`): ver lote L1 en AGENTS.md. Siguiente: resto de oficios (Artesanía, Escultor, Cocina), recolección con PR y migración de las herramientas de recolección. **L0c** (22 oct): zoom al craftear, más efectos por acción y ventanas arrastrables (`winmove.js`). Pendiente: calibrar cifras, libro de acciones con arrastrar/asignar, macros, meta cercana en el panel de oficio, animaciones propias por acción, resto de oficios.

## 5l · Móvil
La hoja de trabajo, la barra de oficio y el libro de acciones deben nacer con variante táctil (hoja inferior, casillas grandes, pulsación larga para ver la ficha de la acción, sin arrastrar ventanas): ver `docs/PLAN_MOVIL.md` §1 y M2.

## 5m · Agricultura y Apicultura estilo «granjitas» (propuesta del 22 oct; el dueño propone el modelo BDO)
Parcelas pequeñas por aldea (3–6, ampliables con el Maestro) que dan rendimiento **por tiempo**. Para no chocar con «sin idle/offline»: temporizadores de tiempo real (5 min–2 h por cultivo) con **tareas activas** (regar acelera, abonar sube la Calidad, quitar plagas evita pérdidas) y **tope de almacenamiento** (12–24 h); cosechar es una acción del jugador; **sin trabajadores en segundo plano**. Semillas de Herbolaria, abono de Alquimia, rendimiento por nivel, calidad heredada (Pureza), variedades raras/doradas (dopamina). Apicultura = colmenas con el mismo esquema (miel, cera). Riesgos: inflación (limitar por parcela/nivel), reloj (`Date.now()` con tope; servidor en la fase online), coste de modelos 3D (3 etapas por cultivo). **Va después de Herbolaria, Cocina y Alquimia.** Duda abierta ★: temporizadores+tareas (recomendado) o producción pasiva pura tipo BDO.

## 5n · Parcelas fijas + casa del jugador por bioma (propuesta del dueño, 22 oct; sustituye la idea de parcelas por jugador de §5m)
- **Parcelas fijas:** props estáticos del mundo junto a la casa (mismas posiciones para todos); solo el ESTADO de cada cultivo va en el guardado (`S.granja[bioma][parcela]`). Nada se carga por jugador.
- **Casa por bioma:** se obtiene al terminar la cadena principal de ese bioma; una de las casas de la aldea pasa a ser «la tuya» (sala interior de su cultura, `interiors3d`). **Repararla** en etapas (ruina → arreglada) gasta materiales de varios oficios; **amueblarla** con piezas fabricadas por los oficios (Escultor: mesas/camas; Sastrería: alfombras/cortinas; Herrería: candelabros/herrajes; Joyería: adornos; Ingeniería: artilugios).
- **Anclas, no colocación libre:** cada habitación define 6–8 anclas (cama, mesa, estantería…) y se elige qué mueble va en cada una; se guarda `S.casa[bioma]={etapa,anclas:{ancla:mueble}}`. Muebles = modelos instanciados dentro del presupuesto de rendimiento (§P).
- **Utilidad:** descanso, cofre, estaciones propias y las parcelas junto a la puerta (punto base útil, no solo decorativo).
- **Plantilla de bioma:** se añade un paso al rework de cada bioma (casa del jugador + parcelas + muebles de su cultura). Empezar por la Pradera para validar el flujo; el resto por datos. Va DESPUÉS de portar Escultor, Artesanía, Herbolaria y Cocina.
- Dudas ★: ¿la casa siempre exige terminar la cadena del bioma?, ¿6–8 anclas por habitación?, ¿cofre y descanso en todas las casas?

## 5o · Peletería, Artesanía-mobiliario y Desollar (propuesta del dueño, 22 oct; refina §3 y §5n)
- **Reparto de oficios:** **Peletería** (antes `cr`): armaduras/ropa/mochilas de cuero, y sube también DESOLLANDO animales. **Artesanía** (nuevo `cr`): muebles y decoración por ENSAMBLAJE (combina partes de varios oficios: tablones/tallas de Escultor, tela de Sastrería, herrajes de Herrería, cuero de Peletería). **Escultor** pasa a piezas intermedias de madera/piedra (tablones, mangos) y tallas decorativas (corrige «Escultor hace mesas y camas» de §5n). Las recetas de cuero actuales (armadura, carcaj…) pasan a Peletería; `OFD` del oficio de ropa de Herrería usa Peletería. Guardados descartables: sin migración.
- **Desollar (skinning):** los animales (no humanoides) dejan CADÁVER 1–2 min; F sobre él = casteo de 3 s (`castStart`, pose agachada `se` + gesto de cuchillo; se interrumpe al moverte/ser herido). Da **piel cruda**, carne (Cocina), hueso y grasa según el animal; XP pequeña a Peletería; el nivel de Peletería limita qué animales se pueden desollar. **Sin pasivas/habilidades FF14** (decisión del dueño: es el único recolector sin ellas); solo un bono por desollar pronto y probabilidad pequeña de piel de calidad según el nivel. Sin minijuego.
- **Curtir:** la piel cruda se curte en Peletería (receta corta de la hoja de trabajo) → **cuero** por tier. Da contenido a Peletería desde el nivel 1 y calidad al cuero que usan todos los oficios.
- **Riesgos:** doble fuente de XP (equilibrar con `meas_progresion.py`), cadáveres persistentes (tope de actores muertos, presupuesto §P), tutorial de la isla (corderos de nube) y vacas de la Pradera, que hoy sueltan cuero directo.
- **Orden:** (1) piezas intermedias e interconexión de herramientas, (2) portar Peletería y Artesanía a la hoja de trabajo, (3) desollar, (4) casa de la Pradera con muebles de Artesanía.

## 5p · Desollar como habilidad propia + procesado de cuero y tela (decisión del dueño, 22 oct; corrige §5o)
- **Desollar (`ds`) es una HABILIDAD APARTE (estilo WoW):** se sube desollando animales (3 s sobre el cadáver), sin habilidades activas ni pasivas; el nivel limita qué animales se pueden desollar y da una probabilidad pequeña de piel de calidad. Herramienta: **cuchillo de desollar** por tier (hoja Herrería + mango Escultor + agarre Peletería; el tier del cuchillo puede limitar el animal). Peletería ya NO sube desollando (se quita la doble fuente de XP de §5o).
- **Peletería** = transformación: curte la **piel cruda → cuero** por tier (receta corta de la hoja de trabajo, contenido desde nivel 1) y con él hace armaduras, ropa de oficio y mochilas de cuero.
- **Sastrería** = transformación: hila **fibras → madejas → tela** por tier (contenido desde nivel 1) y hace túnicas, ropa de oficio, mochilas de lino y teñidos.
- **Tiers:** cuero y tela usan los mismos 11 tiers que el equipo de oficio (§5i), de modo que cada tier de equipo tiene su cuero y su tela. Orígenes de ejemplo (se fijan al hacer cada bioma): Pradera vaca/cordero y lino/lana; Bosque ciervo/lobo y lino fino/seda de araña; Pantano lagarto y fibra de junco; Cumbres yak/oso y lana de yak; Oriental animales de montaña y seda; Volcán bestia ígnea y fibra ígnea.
- **Lana:** propuesta = ESQUILAR ovejas vivas con la habilidad Desollar (sin matarlas, con enfriamiento); lino de Herbolaria/Agricultura; seda de arañas. Duda abierta ★.
- **Listado de habilidades resultante:** Recolección = Tala, Minería, Pesca, Herbolaria, Desollar, Agricultura, Apicultura (+ Domar). Oficios = Herrería, Peletería, Sastrería, Escultor, Artesanía (muebles), Cocina, Alquimia, Encantamiento, Joyería, Ingeniería.

## 5q · Ajustes del dueño a Desollar y la lana (22 oct; corrige §5p)
- **Cuchillo de desollar:** SE COMPRA UNA VEZ (tienda), sin crafteo ni tiers; con él se puede desollar siempre. Lo que limita qué animal se puede desollar es el NIVEL de Desollar, no el cuchillo. «Agobiar con demasiadas cosas crafteables» = evitar. La pelea es parte del oficio (matar → desollar). Se quita la fila del cuchillo de la matriz de herramientas de §5c.
- **Más fauna:** muchos animales por bioma, varios repitiendo el tier de piel (variedad y vida del mundo, no solo progresión). Cada animal: piel cruda del tier, carne propia (Cocina), hueso, grasa y algún objeto suyo (plumas, colmillos…). Ejemplos: Pradera (vaca, oveja, cabra, cerdo, conejo, zorro), Bosque (ciervo, lobo, jabalí, oso pardo, tejón, búho), Pantano (lagarto, cocodrilo, rana gigante, serpiente, garza), Cumbres (yak, cabra montés, oso polar, lobo ártico, águila). Tope de actores por zona (presupuesto §P); pacíficos de ambiente y agresivos.
- **Lana y fibras (propuesta, estilo Dofus):** (1) animales con lana (oveja, cabra, yak) dan **lana al desollarlos** (se descarta ESQUILAR vivos); (2) **fibras vegetales** (lino, cáñamo, algodón, ramio…) las cosecha Agricultura (parcelas) y, mientras no exista, **nodos silvestres de Herbolaria**; (3) **seda** de arañas/bichos como botín. Cada bioma aporta su fibra, siguiendo los 11 tiers de tela (§5p).

## 5r · Fauna en 11 biomas, Artesanía = madera, intermedio por oficio, buffs, reparto de nodos (decisiones del dueño, 22 oct; CORRIGE §5o–§5q donde choque)
**Biomas:** son **11** = 9 del continente (Pradera, Bosque, Pantano, Cumbres, Oriental, Volcán, Desierto, Costa, Páramo) + **Cielo e Infierno** (los dos últimos, al final). La fauna, las fibras, los nodos y la casa del jugador se diseñan para todos, no solo para los 6 primeros.
- **Fauna (provisional, por bioma; repite tiers de piel):** Pradera vaca/oveja/cabra/cerdo/conejo/zorro/gallina · Bosque ciervo/lobo/jabalí/oso pardo/tejón/búho/ardilla · Pantano lagarto/cocodrilo/rana gigante/serpiente/garza/rata de pantano · Cumbres yak/cabra montés/oso polar/lobo ártico/águila/zorro ártico · Oriental tigre/ciervo sika/tanuki/macaco/grulla/jabalí de bambú · Volcán salamandra de lava/lagarto ígneo/jabalí de ceniza/murciélago de fuego/escorpión volcánico · Desierto camello/chacal/gacela/escorpión/serpiente de cascabel/buitre · Costa foca/tortuga/cangrejo gigante/gaviota/lobo marino · Páramo huargo/hiena/cuervo gigante/jabalí huesudo/ciervo demacrado/araña de páramo · Cielo corderos y cabras de nube/aves de luz · Infierno murciélagos y cabras infernales/cachorros de cerbero. Cada animal: piel cruda del tier, carne propia (Cocina), hueso, grasa y objeto propio; tope de actores por zona (§P).
- **Artesanía = MADERA:** hace **arcos y flechas** (y bastones), muebles y la **madera lisa** (troncos → tablones por tier de madera, los 11 de `WO`) que necesitan los demás oficios; también los mangos de las herramientas (corrige §5o–§5q, donde los hacía Escultor). **Escultor** pasa a piedra (losas, ladrillos), tallas y adornos.
- **REGLA: cada oficio de fabricación se SUBE produciendo un intermedio que otro oficio necesita y que se puede vender en el mercado** (Fase 16c; mientras tanto a PNJ): Herrería barras/hojas/herrajes · Peletería cuero curtido · Sastrería madejas/tela · Artesanía madera lisa/mangos · Escultor piedra/ladrillos/tallas · Cocina ingredientes procesados · Alquimia reactivos/tinturas · Joyería gemas talladas/engarces · Encantamiento polvos/tintas · Ingeniería engranajes/piezas · Agricultura semillas/cultivos/miel.
- **Comida y pociones = buffs DISTINTOS que ayudan al minijuego:** comida = bono largo (~30 min, uno activo) a Maña, Pulso o PO según el plato; pociones = efectos tácticos de un uso (Concentración inicial, +Resistencia al empezar, más probabilidad de condición Buena, recuperar PO); equivalentes para recolección (Percepción, Alcance, PR). La calidad de la comida/poción aumenta el bono (§5g-B).
- **Nodos de recolección REPARTIDOS:** nada de un punto lleno de cobre o estaño; cada tipo de recurso tiene un conjunto de puntos candidatos en la zona del bioma y, al agotar un nodo, **reaparece en OTRO punto** tras un retraso (hoy `relocate` recoloca al cargar; pasa a hacerlo al agotar). **Minas y cuevas** (y arboledas/claros especiales): zonas con veta rica y enemigos que fomentan explorar; reutilizar el sistema de campamentos (`poi`, guardias, cofre) en vez de una zona cargada aparte. Topes de nodos y enemigos por zona dentro del presupuesto §P; datos por bioma en `biomes.js` (`zones`) y `layouts.js`.

## 5s · Reaparición de nodos y límite de los buffs (decisiones del dueño, 22 oct; refina §5r)
- **Reaparición estilo WoW:** al agotar un nodo reaparece tras un temporizador fijo por tipo y tier (minutos; los recursos raros tardan más) en **otro punto de su zona** (§5r). Los jugadores dispersos no «roban» un mismo punto de forma permanente.
- **Dónde:** **menas cerca de las montañas** de cada bioma (cordilleras, riscos, minas/cuevas con veta rica y enemigos); **árboles: se quedan como están**; **hierbas (Alquimia/Herbolaria): repartidas por el bioma con mayor concentración en la zona que tenga sentido** (humedad en el Pantano, claros en el Bosque, laderas en Cumbres, etc.); pesca en los cuerpos de agua del bioma. La densidad es dato por zona (`biomes.js`, `layouts.js`).
- **Buffs combinables pero SUAVES:** comida y pociones se pueden combinar (uno de cada tipo activo), pero ningún bono es lo bastante fuerte como para volverlos obligatorios en ningún oficio. Como mucho UNO fuerte excepcional, de utilidad en vez de poder bruto (ejemplo del dueño: una poción que baja el desollado de 3 s a 2 s). Regla de equilibrio: los buffs suman unos pocos % de Maña/Pulso/PO/PR; los efectos de utilidad acortan tiempos o ahorran pasos, nunca sustituyen la rotación.

## 5t · Orden de los cimientos (aprobado el 23 oct 2026)
D0 convenciones de ids/datos → D1 retirar `fm*` → D2 generalizar `WKUI`/`OFD` → D3 lista de comprobación de skill nueva + `rules_check` → D4 **iconos 3D paramétricos por categoría y tier (clave)** → D5 prueba de humo `tools/oficios_smoke.py` → D6 portar Artesanía (madera) y Peletería (curtir) → D7 medir horas a 99. Detalle y criterios de «hecho» en `docs/HOJA_DE_RUTA.md` (FASE 3 · d). El resto de fases sigue igual.

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

## Apéndice A · Registro técnico de implementación (movido de AGENTS.md el 23 oct 2026, textual)
### Lote PLAN-OFICIOS-FF14 (22 oct 2026; el dueño: «reworkear los oficios como FF14; recolección se queda con el circulito; sugerencias para todos los oficios actuales y futuros»)
- **Solo PROPUESTA, nada implementado:** `docs/PLAN_OFICIOS_FF14.md`. Esqueleto común de crafteo «Hoja de trabajo» (Avance, Calidad, Resistencia, Puntos de Oficio, Maña/Pulso por herramienta, condición de la pieza, Concentración, estados de trabajo, acciones cruzadas, piezas de maestro, comida/pociones de oficio, síntesis rápida) para TODOS los oficios de crafteo. **DECIDIDO por el dueño (22 oct): los minijuegos propios planeados (calor/ritmo de Herrería, patrón, tallar, punto de cocción, mezcla, telar, runas, engastar, ensamblar) quedan CANCELADOS**; los oficios solo se distinguen por sus acciones exclusivas (datos en `WK.A`/`WK.D`). Al implementar, el minijuego de forja `fm*` de game.js se retira/recicla (cuidar el tutorial de la isla). Recolección: la rueda no cambia; se añaden Puntos de Recolección y habilidades entre golpes, nodos efímeros/leyenda y Pureza. Cubre Tala, Minería, Pesca, Herbolaria, Agricultura/Apicultura, Domar y todos los de crafteo, actuales y planeados.
- **Paridad con FF14 (22 oct):** lista completa de **34 acciones comunes de crafteo** (niveles y efectos de FF14, tope 99) + 4–6 exclusivas por oficio + 2 de especialista; recolección ≈ 24 habilidades por oficio y Pesca ≈ 25 (`PLAN_OFICIOS_FF14.md` §1 y §2.1). Cifras aproximadas: calibrar con `craft_balance.py`.
- **Barra y herramientas (propuesta 22 oct):** barra contextual de oficio (10 + 10 con Mayús, la de combate de 6 NO se amplía), libro de acciones con arrastrar, macros de 6 pasos; herramientas por oficio de 11 tiers, fabricadas entre oficios, con engastes y mejora por Maestro (`PLAN_OFICIOS_FF14.md` §5b–5c). `S.tool` actual = 3 oficios × 6 tiers (`TOOLS`, `TN`).
- **L0a HECHO (22 oct):** `src/work.js` (global `WK`, cargado tras status.js) = núcleo puro de crafteo: 34 acciones comunes + Corazón y alma, condiciones (10), estados, Concentración, combos, PRNG con semilla, `WK.start/use/can/cost/suggest/hq/quick`; prueba `node tools/work_test.js` → OK. **SIN conectar** a game.js ni UI todavía; las cifras (`progMax`, eficiencia base `10+Maña·0.1`) NO están calibradas: con recetas de ejemplo la rotación sugerida no llega a acabar (faltan datos reales de receta). UI diseñada en `PLAN_OFICIOS_FF14.md` §5e (maqueta mostrada en el chat); herramientas por cultura en §5d.
- **Animación por habilidad (22 oct, propuesta aprobada en el chat):** `PLAN_OFICIOS_FF14.md` §5f — cada acción de `WK.A` llevará `fx:{clip,imp,vfx,snd,cam}` (animación del héroe con `armPose`, reacción de la estación, sonido, enfoque de cámara); clips base ya existentes `WORK`/`LOOPS` en `heroanim3d.js`.
- **Equipo de oficio y calidad (propuesta 22 oct):** `PLAN_OFICIOS_FF14.md` §5g — pestaña «Oficios» en Personaje con conjuntos por oficio (`S.eqt`, cambio automático al trabajar), stats Maña/Pulso/PO y Percepción/Alcance/PR; calidad Normal/Superior/Excelente/Maestra (sufijo `~0..3` existente) que sube stats ≤ +20 %, potencia de consumibles, **calidad inicial de las piezas siguientes** y exigencias de piezas de maestro. Pendiente de visto bueno; no implementado.
- **Azar (aclaración del dueño, 22 oct):** `Math.random` SÍ está permitido para tiradas de crafteo/calidad/botín (la regla «sin Math.random» de REGLAS_CREACION §6 queda para posición/combate/online); `qv` puede seguir usándolo. `WK.start` usa azar normal si no recibe semilla. Conjuntos de oficio (solo cambio de equipo) y bucle de progresión: `PLAN_OFICIOS_FF14.md` §5h.
- **Mejora de equipo por niveles estilo FF14 (22 oct, DECIDIDO):** `PLAN_OFICIOS_FF14.md` §5i — tier nuevo cada 9 niveles de oficio (11 tiers) + grado Reforzado a mitad, requisito de nivel para equipar, primera pieza gratis del Maestro, generador por datos (`TIERS_OFICIO`, `GEAR_SLOTS`). **SIN pasivas ni bonos de conjunto por cultura (descartados por el dueño):** la cultura solo cambia el ASPECTO y el material de la receta. Son **9 biomas** (6 hechos + Desierto, Costa, Páramo sin implementar) + Cielo; el reparto tier→bioma es un dato. X = 9 confirmado por el dueño; checklist de recompensas en `PLAN_OFICIOS_FF14.md` §5j. No implementado.
- **L0b HECHO (22 oct) — Herrería con Hoja de trabajo FF14:** `src/workui.js` (global `WKUI`, tras dragdrop.js; panel DOM `#wk`, estilos al final de `css/hud-susurro.css`) conectado a `WK` (work.js). En yunque/armero (`startC` → `WKUI.start`; el horno sigue automático) sale el panel con Avance, Calidad, Resistencia, PO, Concentración, condición, estados, rejilla de acciones aprendidas por grupo y barra de 10 casillas (teclas 1–0, capturadas antes que `selSkill`; Esc/Salir/alejarse cancelan). Acciones de golpe: pose `sm` con `armPose` y sonido/partículas (`whSnd/whFx`) al impacto; bloqueo de acción 640 ms (380 en estados). Al acabar: `stepAct` con `QBON=1+1.4·calidad` (la calidad superior sigue saliendo de `qv`), XP y pieza; si la resistencia se agota NO se pierden materiales. Ganchos en game.js: `stopA`, loop (`WKUI.tick`), swing timer (`!A.wk`), `actState` (`WKUI.pose`), `atkKey` (LMB inerte), hud.js (sin barra de acción). El minijuego `fm*` queda sin uso (código legado). Receta→hoja: `recipe()` en workui.js, valores PROVISIONALES (a calibrar con `craft_balance.py`). **Verificado en el arnés** (`ns.py --no3d`): sesión arranca, Síntesis básica ×3 completa una Espada de cobre (+32 XP), tecla 1 dispara, captura del panel, consola limpia. **NO verificado:** efectos 3D y animación del martillo a ojo (el arnés va sin 3D), el tutorial de la isla con la forja, a nivel alto (recetas largas), táctil, interiores. Meta cercana (siguiente desbloqueo) NO hecha todavía: irá solo dentro del panel de cada oficio y en el aviso de nivel.
- **L0c HECHO (22 oct) — zoom, efectos y ventanas arrastrables:** (1) `mgKey()` devuelve `'wk'` con la hoja de trabajo → la cámara se acerca `MG_ZOOM_WK`=.85 (el resto de minijuegos .42) hacia la estación (`mgZf` recuerda el factor para el fundido de salida; sin aviso de controles en `wk`). (2) Efectos extra en `workui.js` (`fxAct/fxEnd`, `R3D.fx.spark/smoke`): chispas por eficiencia del golpe, destello de calidad, aura de color por estado (Veneración dorada, Innovación azul, Sin desperdicio verde, Gran avance blanca), pase verde al reparar, brasas ambientales mientras la pieza está Buena/Excelente, estallido final del color de la calidad (+`whPulse` con ≥ 80 %) y humo si la pieza se agota. (3) **`src/winmove.js` (global `WINMOVE`, tras workui.js): TODAS las ventanas se arrastran desde cualquier zona vacía** (`#wk #sw #pw #bw #qpn #ctl #goalp`; no desde botones/casillas/campos/`data-dg`); usa la propiedad CSS `translate` (no choca con `transform`), guarda posición en `localStorage ns_win`, la limita a la pantalla y **doble clic en zona vacía la restablece**. **Ventana nueva = añadir su selector a `SEL` de winmove.js.** Verificado en el arnés (`--no3d`): zoom ×1,85 al craftear, arrastre con ratón real (+400,+120 px, guardado), efectos llamados sin errores con un `R3D.fx` simulado. **NO verificado a ojo:** los efectos reales en 3D, el zoom con la ventana a un lado, arrastrar `#pw`/`#bw`/`#qpn` en el juego (solo `#wk` probado), móvil/táctil.
- **PLAN MÓVIL (22 oct, solo planificado):** `docs/PLAN_MOVIL.md` — objetivos 844×390 y 390×844, inventario de sistemas (hoja de trabajo como hoja inferior, `winmove` desactivado en táctil, paneles como hojas, combate táctil, cámara a dos dedos, textos «Toca»), infraestructura común (`body.touch`, `.sheet`, `safe-area`, capa de gestos) y fases M0–M6. **Regla a vigilar: toda UI nueva declara su comportamiento táctil desde el diseño.** Nada implementado.
- **L1 HECHO (22 oct) — Herrería completa, libro/barra, animaciones y equipo de oficio:**
  - **Núcleo** (`src/work.js`): 40 acciones (34 comunes + Corazón y alma + 5 exclusivas de Herrería con `of:'sm'`: Golpe doble nv 11, Estirar 23, Forja en caliente 30, Templar 36, Remachar 45); `WK.list(of,lvl)`, `WK.nextUnlock`, `WK.mkStats(lvl,gear)`, `WK.mkRecipe(rl)` (constantes `PROG0/PROG1/QUAL0/QUAL1`); `suggest()` reescrito (calidad primero mientras sobra Resistencia, avance al final, repara si no llega). **Calibración:** `node tools/work_sim.js [of]` simula la rotación sugerida por nivel de receta/jugador (éxito 100 % con el bot, calidad media 15–70 % al nivel de la receta y 60–99 % con +20 niveles; 5–10 pasos por pieza ≈ 4–7 s). Humanos fallarán algo; la calidad sube con el nivel. `node tools/work_test.js` → OK.
  - **UI** (`src/workui.js`): meta cercana en el panel (barra de XP, «Siguiente: X · nv N», «Casi tienes X» al 80 %), aviso de nivel con la acción nueva (`WKUI.onLevel` desde `gain()`), bono de XP ×1,5 la **primera vez** que fabricas cada receta (`S.wkf`), **barra de 20 casillas** (teclas 1–0 y Mayús+1–0, por `ev.code`) asignable arrastrando desde el libro (arrastrar casilla fuera = quitar, entre casillas = intercambiar), barrido de bloqueo en las casillas, **3 macros de hasta 6 acciones** (nv ≥ 30; ✎ editar, clic = ejecutar; se detienen si la pieza sale Excelente), ventana con scroll interno (`max-height`). Guardado en `S.wkb.sm` (`bar`, `mac`, `seen`; las acciones nuevas entran solas en la primera casilla libre, una vez).
  - **Animaciones** (`heroanim3d.js`, `smithV(v)`): golpe fuerte (H), remate Byregot (B, más alto y más inclinación), toque fino (t), concentración (c), reparación (m), observar (o) y alzar la pieza al terminar (f); `a.v` desde workui (`VAR`/`GEST`, gestos con línea de tiempo propia). Revisadas en hojas de fotogramas con `python tools/r3d/anim_check.py <carpeta> "smv=smv.H,smv.B,smv.t,smv.c,smv.m,smv.o,smv.f:7@45"` (escenarios `smv.*` añadidos a `tools/r3d/anim_states.mjs`; **no uses `-I`**, no encuentra playwright). Verificado en el juego 3D que cada acción elige su clip.
  - **Equipo de oficio** (`src/oficios.js`, global `OFGEAR`, tras workui.js): Herrería con 5 ranuras (martillo, tenazas, gorro, delantal, guantes) × 11 tiers (nivel 1, 10, 19 … 91; X = 9) generadas por datos (`OFD`, `TLV`, `CULT` = cultura del aspecto, aún sin modelos propios: icono emoji). Martillo/tenazas se fabrican en **Herrería** (barra ×2 + madera del tier), gorro/delantal/guantes en **Artesanía** (cuero + barra); recetas añadidas a `ACT.sm/ACT.cr` al arrancar (22 + 33). Equipar = clic en la mochila (`use()` → `OFGEAR.equipFrom`; exige nivel de oficio ≥ nivel del tier); desequipar = clic en la ranura de la ventana **«Equipo de oficio»** (`#ofw`, arrastrable, botón en la hoja de Personaje). Atributos Maña/Pulso/PO (`stats()`, `unit(t)=10+8t`, reparto `W`, bono de calidad `QB` 0/6/12/20 %) que `workui.gear()` suma a `WK.mkStats`. `S.eqt[oficio][ranura]`. La calidad `~q` sale de `qv` (ya incluye `OFGEAR`).
  - **Verificado en el arnés:** libro y barra (arrastre con ratón real asigna/quita), macro, meta cercana, `ns.py` con 3D (variantes de animación en vivo), equipar/refusar por nivel, bonos en la hoja, fabricar un Martillo de cobre (calidad Superior, +18 Maña), `rules_check` OK, `craft_balance` OK (esfuerzo máx. 628 s). **NO hecho / pendiente:** las herramientas de recolección (hacha, pico, caña) siguen en `S.tool` (migrar con el rework de Puntos de Recolección); modelos 3D propios por cultura (hoy emoji); el cambio visual de la herramienta en la mano; equipar arrastrando a las ranuras de `#ofw`; pasivas por cultura DESCARTADAS; el tutorial de la isla con la forja nueva no se jugó de punta a punta; `ISLA.lock()` recorta la XP de Herrería a nivel 1 durante el tutorial (para probar: `ISLA.lock=()=>false`); calibrar `unit(t)` y las cifras con juego real.
- **CALIBRACIÓN DE LA HOJA DE TRABAJO + BASE PARA LOS DEMÁS OFICIOS (22 oct, tras la revisión de dificultad):** spamear Síntesis básica ya NO completa piezas desde nivel ≥ 10 (antes: 100 % siempre). Cambios en `src/work.js`: **PO = 120 + 5·nivel** (antes 100 + 2·nivel; FF14 ≈ 600 al máximo con costes parecidos), receta `mkRecipe(rl)` con constantes en **`WK.K`** (`PROG0 2.6, PROG1 .5, PCAP 10.5` unidades de «100 %» de avance; `QUAL0 5, QUAL1 .6, QUAL2 .8` con quiebro en nv 45, `QCAP 150`) y durabilidad 60/70/80; **planificador `WK.plan(s)`** (búsqueda en haz sin conocer condiciones futuras, ≈ 30 ms) = jugador experto del simulador y del botón **Sugerir**; `suggestSimple` queda de respaldo. `tools/work_sim.js [oficio] [N] [JSON de K] [niveles]` mide spam / torpe / experto: **experto completa el 100 %**, con calidad media 17–68 % al nivel de la receta (mejor a mitad de rango; ≈ 55–70 % al final) y 90–100 % con +20 niveles, en 6–25 pasos (≈ 4–16 s). **Síntesis rápida** (`WKUI` botón «Rápida», recetas ≥ 15 niveles por debajo, calidad normal, una pulsación). **XP por segundo constante:** las piezas largas dan XP extra (`WK.stepsEst(rl)=5+0,2·rl`, tope ×3,5) en `finish()`. Tutorial seguro: recetas de nivel ≤ 8 se completan con solo Síntesis básica. **Para añadir un oficio nuevo al sistema:** (1) fila en `OFD` de `oficios.js` y sus acciones exclusivas en `WK.A` con `of:'<id>'` (4–6, huecos de la cadencia de desbloqueos), (2) `WKUI` hoy es de Herrería (`OF='sm'`): parametrizar por oficio al portar el siguiente, (3) correr `node tools/work_sim.js <oficio>` y ajustar `WK.K`, (4) `craft_balance.py`. **No verificado:** el tacto de las piezas largas con juego real (¿demasiado largas a nivel alto?), `meas_progresion.py` completo (solo se igualó la XP por segundo), humanos peores que el planificador (esperable que fallen más).
- **Agricultura/Apicultura estilo granjitas (propuesta 22 oct):** `PLAN_OFICIOS_FF14.md` §5m — parcelas por aldea con temporizadores de tiempo real + tareas activas + tope de almacenamiento (sin trabajadores en segundo plano, por la decisión «sin idle/offline»). Pendiente de respuesta del dueño; no implementado.
- **Casa del jugador por bioma + parcelas FIJAS (propuesta del dueño, 22 oct):** `PLAN_OFICIOS_FF14.md` §5n — parcelas estáticas del mundo (solo el estado en el guardado), casa que se consigue al terminar la cadena del bioma, reparable por etapas y amueblable con muebles de los oficios por ANCLAS (no colocación libre); sustituye las parcelas por jugador de §5m. Pendiente de 3 decisiones; no implementado.
- **Peletería / Artesanía-mobiliario / Desollar (propuesta del dueño, 22 oct):** `PLAN_OFICIOS_FF14.md` §5o — `cr` pasa a Peletería (cuero + desollar animales con casteo de 3 s sobre su cadáver, sin pasivas), Artesanía nueva = muebles por ensamblaje, Escultor = piezas intermedias y tallas; piel cruda → curtir → cuero. No implementado.
- **Desollar como habilidad propia + procesado de cuero/tela (decisión del dueño, 22 oct):** `PLAN_OFICIOS_FF14.md` §5p — `ds` se sube desollando (3 s, sin pasivas, cuchillo por tier); Peletería curte piel cruda → cuero y Sastrería hila fibra → madeja → tela, ambas con contenido desde nivel 1 y los 11 tiers del equipo; lana por esquila (propuesta). Corrige §5o. No implementado.
- **Ajustes a Desollar y lana (dueño, 22 oct):** `PLAN_OFICIOS_FF14.md` §5q — cuchillo de desollar comprado una vez (sin crafteo ni tiers), mucha más fauna por bioma (repite tiers de piel, da carne/hueso/grasa/objetos), lana al desollar + fibras vegetales (Agricultura, y nodos silvestres de Herbolaria mientras tanto) + seda de bichos; se descarta esquilar. No implementado.
- **Fauna en 11 biomas, Artesanía = madera, intermedio por oficio, buffs y nodos repartidos (dueño, 22 oct):** `PLAN_OFICIOS_FF14.md` §5r — son 11 biomas (9 + Cielo e Infierno al final); Artesanía hace arcos/flechas/madera lisa/mangos/muebles y Escultor piedra/tallas; todo oficio se sube produciendo un intermedio vendible que otro necesita; comida y pociones dan buffs distintos al minijuego; los nodos reaparecen en OTRO punto del bioma al agotarse, con minas/cuevas de veta rica y enemigos (reutilizar campamentos). Corrige §5o–§5q. No implementado.
- **Nodos estilo WoW y buffs suaves (dueño, 22 oct):** `PLAN_OFICIOS_FF14.md` §5s — reaparición con temporizador por tipo/tier en otro punto de su zona; menas cerca de las montañas, árboles igual, hierbas repartidas con concentración donde tenga sentido; comida y pociones combinables pero débiles (solo uno fuerte de utilidad, p. ej. desollar 3 s → 2 s). No implementado.
- **ORDEN DE LOS CIMIENTOS DE OFICIOS (dueño, 23 oct):** nueva sub-fase **«FASE 3 · d»** en `docs/HOJA_DE_RUTA.md` (D0–D7: convenciones de ids → retirar `fm*` → generalizar `WKUI`/`OFD` → checklist de skill + `rules_check` → iconos 3D paramétricos por tier (CLAVE) → `tools/oficios_smoke.py` → portar Artesanía y Peletería → medir horas a 99). Se hace ANTES de seguir con el resto de la Fase 3 y de los biomas; **todas las demás fases siguen en pie**. El dueño sube el código a git por su cuenta (no hacer commits). Pendiente de empezar.
- **Decisiones ★ abiertas** (al final del doc): PR en recolección, síntesis rápida, comida de oficio, parcelas de cultivo, empezar por L0 (núcleo + Herrería). No empieces a programar hasta que el dueño responda. **El punto 1 del encargo de Fase 3·c («minijuego de crafteo por oficio») queda SUSTITUIDO por este plan (L0 = núcleo `WK` + Herrería).**

