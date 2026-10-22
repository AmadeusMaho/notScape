# PLAN · Oficios restantes + rework de biomas (BORRADOR del 22 oct 2026)

> Pedido del dueño (22 oct 2026): «agregar los otros oficios para poder ir reworkeando la pradera, el bosque, etc. con los recolectables nuevos, las casas nuevas, etc.; planeemos». **Estado: PROPUESTA para decidir juntos; nada implementado.** Fuentes: `docs/HOJA_DE_RUTA.md` (Fase 3 · c y «Skills planeadas»), `docs/PLAN_POSTPORTEO.md` §1 y §6, `docs/BALANCE_OFICIOS.md`, `docs/REGLAS_CREACION.md`.

## 0 · Qué hay hoy (no rehacer)
- 12 skills (`SK`): Tala, Minería, Pesca, Cocina, Herrería, Artesanía, Escultor, Inscripción, Magia, Combate, Arquería, Oración.
- Recolección activa ya hecha: rueda (tala/minería), pesca simple, minijuego de **Herrería** (calor + ritmo). Pendientes: Artesanía, Escultor, Cocina (decisión del dueño: **un minijuego distinto por oficio, no la rueda**).
- Recetas entrelazadas v1 (`applyInterlock`), `craft_balance.py`, **mochilas ya soportadas** (`BAGS`: la Sastrería solo tiene que fabricarlas), **estados alterados ya hechos** (los antídotos de Alquimia pueden usarlos), banco/arrastre hechos.

## 1 · Oficios nuevos (propuesta de alcance y orden)
| Orden | Oficio | Tipo | Qué entrega | Minijuego propuesto | Depende de |
|---|---|---|---|---|---|
| **A** | **Herbolaria** (`he`) | recolección | hierbas por bioma (≥1 por tier, 11 tiers), hoz/guadaña (`TOOLS.he`, 11 tiers), props de nodos | «Arrancar con cuidado»: mantén LMB para tirar del tallo, suelta cuando la raíz agarra; entera = botín completo, rota = reducido; las raras agarran más | nada (primer paso) |
| **B** | **Alquimia** (`al`) | procesado | estación «Alambique» en la sala **Botica**; pociones (vida, maná, resistencias, buffs `POT`) y **antídotos de los estados alterados** (sangrado, veneno, quemadura, ralentización…) | estilo *Potion Craft* simplificado: añadir ingredientes y llevar la mezcla a la zona objetivo sin tediosos pasos | A |
| **C** | **Sastrería** (`ta`) | procesado | telar/mesa de sastre en el Taller; tela, lino, lana, vendas, túnicas y **MOCHILAS (`bag_*`)**; teñido con hierbas | cortar y coser siguiendo un patrón con el ratón (tarea ya pensada para Artesanía: se reparte: Artesanía = cuero/remaches, Sastrería = tela) | A (tintes) |
| **D** | **Encantamiento** (`en`, sustituye Inscripción) | procesado | Mesa de encantamiento (Taller arcano), polvo por desencantar, ranuras | trazar runas con el ratón | A, B (y Fase 8 Oriental) |
| E | **Joyería** (`jo`) | procesado | anillos, amuletos y coronas con gemas; llena las ranuras `r`, `r2`, `n` hoy sin fabricante | engastar: colocar la gema y pulir al ritmo | Minería (gemas, plata, oro), Encantamiento (engarces) |
| F | **Ingeniería** (`ing`, estilo WoW) | procesado | ver §6: artilugios con enfriamiento, explosivos, trampas, mecanismos, mascotas mecánicas | armar un mecanismo (encajar piezas en orden y cronometrar) | Herrería, Minería, Sastrería, Alquimia (pólvora) |
| G | **Domar** (`do`) | actividad | monturas y mascotas (Desierto, ver §6) | calmar a la criatura sin asustarla (barra de confianza) | fauna, estados alterados (ralentización) |
| H (la última, posible descarte) | **Agricultura y Apicultura** (`ag`) | recolección | cultivos, miel y cera | plantar, cuidar y cosechar a intervalos | **dónde se planta: sin decidir (§6)** |
| — | Caza/ganadería (sin skill) | fuente | cuero, lana, huesos como botín de fauna por bioma | — | — |
Decisión vigente (13 oct): el cuero lo sigue trabajando **Artesanía**; no hay skill de peletería.

### Pasos que cada skill nueva debe cumplir (checklist, de `PLAN_POSTPORTEO` C1b)
1. `SK`/`SKL` y `SKI` (icono de línea del panel Skills), `S.xp.<id>` con valor por defecto (sin migrar, guardados descartables).
2. `ACT.<id>` (recetas) con tope **5 componentes**; XP por receta; entrada en `tools/craft_balance.py` y `tools/meas_progresion.py` (objetivo 35–65 h a 99).
3. Estación + prop 3D (módulo `propsdark*`, regla de tejados, `props_sheet.py --medir`), sala por civilización (`interiors.js`), aviso `STD` de una línea.
4. Minijuego propio con `mgBegin/mgHintRows/mgUi` y `warmObjs` si crea materiales bajo demanda.
5. Tutorial corto (una pista, no párrafos), logros y entrada en la matriz de oficios entrelazados.
6. Lote documentado en `AGENTS.md` y fila en `HOJA_DE_RUTA.md`.

## 2 · Recolectables nuevos por bioma (BORRADOR de nombres, a aprobar ★)
Cada bioma estrena: **1 hierba por tier de su rango**, 1–2 setas/frutos de cocina, fauna con cuero/lana propio y un raro. (Las 11 maderas y 11 metales ya existen.)
| Bioma | Hierbas (propuesta) | Fauna / material | Civilización de sus casas |
|---|---|---|---|
| Pradera | manzanilla, trébol, lavanda | cordero (lana), vaca (cuero) | medieval |
| Bosque | salvia, helecho lunar, musgo dorado | ciervo (cuero), araña (seda) | élfica |
| Pantano | loto, nenúfar venenoso, hongo luminoso | rana, lagarto (escamas) | tribal |
| Cumbres | genciana, flor de escarcha, líquen | yak (lana), oso | nórdica |
| Oriental | crisantemo, té, jengibre | grulla (pluma), seda | samurái |
| Volcán | brasa-flor, ceniza viva | magma (hollín) | infernal |
Nombres, tiers y valores se fijan al hacer cada bioma; esto solo sirve para dimensionar.

## 3 · Rework de un bioma (plantilla, una por vez; ya definida en la hoja de ruta Fases 4, 5, 7–12)
Para cada bioma, en este orden y verificando con las herramientas existentes:
1. **Recolectables:** hierbas (nodos 3D con modelo propio), árboles/menas/peces/fauna del bioma; spawn por zona (`BIOMES`, `layouts.js`); respetar la **escala ×1,5** y las reglas de sentido (escala, orientación, estilo óleo oscuro).
2. **Casas y aldea nuevas** por civilización (`propsdark_<bioma>3d.js`, regla ANTICLIP, barrios `village-barrios.js`): casa, taberna/cocina, herrería, **Botica** (alambique), **Taller** (telar/sastre), iglesia/templo, banco, tienda.
3. **PNJ distintos por bioma** (no clones) y diálogos con el editor de diálogos.
4. **Enemigos y jefe** del bioma con los estados alterados (`STS.ONHIT`) y su botín.
5. **Música y luz** del bioma (`BL`, ambience).
6. **Verificación:** `props_sheet.py`, `roof_clip_check.py`, `village_check.py`, `coast_check.py`, `perf_check.py`, `rules_check.py`; capturas a zoom normal y máximo; medir en GPU y móvil del dueño.

## 4 · Orden propuesto de trabajo (lotes pequeños, un entregable por mensaje)
1. **L1 · Herbolaria base:** skill + hoz + nodos genéricos + minijuego «arrancar» + 3 hierbas de la Pradera. *(Ya puedes recolectar en la Pradera.)*
2. **L2 · Alquimia + Botica:** alambique, sala, pociones y antídotos de los estados. Rework **Pradera** parte 1 (hierbas, Botica, casas nuevas).
3. **L3 · Sastrería:** telar, tela/lino/lana, **mochilas**, vendas; completar Pradera (lana de cordero, teñidos).
4. **L4 · Minijuegos pendientes** de Artesanía, Escultor y Cocina; reequilibrio de XP y niveles cruzados (Fase 3).
5. **L5 · Rework Bosque** (plantilla §3) con Herbolaria de nivel medio y casas élficas.
6. Fases siguientes según `HOJA_DE_RUTA.md` (Pantano, Cumbres, Oriental+Encantamiento, Volcán, Desierto, Costa, Páramo).

## 5 · DECISIONES DEL DUEÑO (22 oct 2026; vigentes)
1. **Oficios, en este orden:** Herbolaria → Alquimia → Sastrería → **Encantamiento** (los cuatro; Encantamiento sustituye a Inscripción: `ins` se retira cuando entre `en`).
2. **Biomas:** **Pradera COMPLETA primero** (hierbas, casas, Botica, Taller, PNJ, fauna), tras cada oficio nuevo; luego el Bosque con la misma plantilla (§3).
3. **Hierbas:** cada bioma tiene **1 hierba exclusiva** + comunes compartidas. **Mochilas:** las fabrica la Sastrería; un PNJ vende una básica para no bloquear el tutorial.
4. Siguen abiertos ★: nombres definitivos de las hierbas (§2), minijuego final de Alquimia y Encantamiento, y el momento de retirar Inscripción.

**Siguiente paso concreto: L1 · Herbolaria base** (skill `he`, hoz, nodos, minijuego «arrancar con cuidado», 3 hierbas de la Pradera). Proponer al dueño el diseño del minijuego en 3–4 líneas antes de construirlo.

## 6 · Añadidos del 22 oct 2026 (decisión del dueño)
**Entran:** Joyería, Agricultura y Apicultura (**las ÚLTIMAS que se implementan**), Domar e Ingeniería. **Navegación por barco:** está planeada con la Costa, pero **no sería una skill** (el dueño no lo ve claro); se queda como mecánica/instalación opcional y se decide en la Fase 11.

### Ingeniería (como la de WoW)
Skill de procesado con **artilugios de uso activo y enfriamiento** más que equipo: **explosivos** (daño en área, solo con el estado alterado asociado), **trampas** (colocables: raíces, ralentización, congelación, veneno), **mecanismos** (cabeza/guantes con efecto activo, gafas), **mascotas mecánicas** (cosméticas o con pequeño bonus), **herramientas mecánicas** (mejoran Tala/Minería/Herbolaria), **dispositivos de viaje** (teletransporte corto/atajos con enfriamiento largo, ligado a las runas de viaje) y **munición especial** (flechas/virotes con estado). Usa Herrería (piezas), Minería (pólvora/azufre), Sastrería (correas, bolsas) y Alquimia (reactivos). **Reglas de diseño:** cada artilugio usa un slot de habilidad o un objeto consumible con enfriamiento (se conecta a la barra de 6 de la Fase 2); los estados salen de `STS` (status.js); sin ventaja en PvP/online (Fase 16). Minijuego: ensamblar (encajar piezas en el orden correcto y pulsar al compás).

### Joyería
Anillos, amuletos y coronas; gemas talladas por tier (Minería) con **engaste** que añade stats pequeños o activa estados/efectos; se coordina con Encantamiento (engarces). Sin minijuego de combate: pulir y engastar al ritmo.

### Domar
Monturas (Desierto, Fase 10) y mascotas de fauna; **barra de confianza** (acercarse sin correr, ofrecer comida, no asustarla; las criaturas hostiles se resisten con sus estados). Mascota = pequeño bonus de recolección o combate. Montura = velocidad (no combate) y consumo de energía propio. Pendiente: cuántas mascotas por bioma y si ocupan ranura.

### Agricultura y Apicultura (las últimas)
Cultivos (grano, verduras, lino para Sastrería), colmenas (miel, cera para velas e Ingeniería) y árboles frutales. **¿Dónde se planta? — ABIERTO ★.** Opciones: (1) **parcelas en cada aldea** (huerto junto a las casas nuevas, con cercado y ritmo de crecimiento en horas reales) — la más simple; (2) **terrenos cultivables en el mundo** (zonas de tierra labrada por bioma; la planta crece in situ y se expone a fauna); (3) **terreno propio del jugador** (vivienda; exige un sistema de casa que hoy no existe). Recomendación: parcelas por aldea (1) y decidir después. Requisitos ya anotados: **sin progreso offline** (regla vigente), el crecimiento solo avanza con el juego abierto; guardado en `S` sin migrar.

### Orden y dependencias actualizados
Herbolaria → Alquimia → Sastrería → **Domar (desde el Bosque)** → Encantamiento → Joyería → Ingeniería → (Agricultura/Apicultura, posible descarte). Ver «DECISIONES 2.ª tanda». Cada una cumple el checklist de §1.

### DECISIONES DEL DUEÑO (22 oct 2026, 2.ª tanda; vigentes)
- **Mascotas y monturas:** se puede llevar **una mascota y una montura a la vez (2 ranuras dedicadas)**; ambas son objetos que ocupan hueco de inventario cuando no están invocadas. *(Interpretación mía de «ocupan una ranura en el inventario… dos slots»: si se refería a otra cosa, corregir.)*
- **Domar entra desde el BOSQUE** (Fase 4), no en el Desierto: las **monturas llegan pronto para que viajar no sea tedioso**. Orden nuevo: Herbolaria → Alquimia → Sastrería → **Domar (con el Bosque)** → Encantamiento → Joyería → Ingeniería. Montura en el Bosque = ciervo/corcel domable (velocidad, consumo de energía propio, sin combate montado en la v1); el Desierto añade monturas propias (camello) sobre el mismo sistema.
- **Agricultura/Apicultura:** el dueño **no lo tiene claro y puede descartarse**; queda como «posible, decidir al final» (no bloquea nada). Si se hace, parcelas por aldea.
- Navegación por barco: no es una skill (sin cambios).
