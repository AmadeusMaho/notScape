# PLAN · SETS DE MONSTRUO (estilo Dofus) — 3 nov 2026

> Pedido del dueño (3 nov 2026): «sets de equipamiento con partes de monstruos (armaduras y armas), así los materiales de monstruos también sirven para equipo y agrega variedad, como en Dofus; minerales de X tier representan el tier del objeto; el equipo antiguo puede servir para craftear equipo de más tier, así los materiales antiguos siempre son relevantes».
> Aclaraciones y decisiones del dueño (mismo día): **no hay «ascensión»**: hay sets de nivel superior cuya receta puede (o no) pedir piezas de un set anterior, como en Dofus · bonus **por piezas equipadas**, como en Dofus · también el **equipo base de cada tier** tiene bonus de set (parecidos entre sí, ligados a su cultura) · **cada set es TODO nuevo** (modelos y colores propios: el Gelatinoso es verde slime) · **las capas SÍ se fabrican desde el inicio en Sastrería**, y siguen existiendo capas exclusivas más bonitas por logros · sets de **4, 6 u 8 piezas** (el de 8 incluye capa) · el equilibrio lo decide el agente · **los sets de la Pradera se cierran en N0** y luego cada bioma trae los suyos.
> **Estado (3 nov 2026): EN CURSO.** Hecho S1 parcial (sistema `MSET`), S2 (Gelatinoso) y S3–S6 (los otros 6 sets) en los lotes N0.9-SETS-S1S2 y S3S6; S1 completo (sets base por cultura y capas fabricables), armas de set con modelo propio y objetos únicos por monstruo (`UQ`, fuera del plan original) en el lote N0.9-SETS-CIERRE; S7: `tools/sets_balance.py` (los % del plan no se cumplen a niveles bajos por la escala pequeña; ver el lote).

## 1 · Viabilidad: sí
| Hace falta | Ya existe | Falta |
|---|---|---|
| Materiales de monstruo | cada criatura suelta los suyos (`MD[id].dr`) y un raro (`MD[id].rare`): gelatina, paja embrujada, plumas, colmillo de orco, antifaz, pañuelo carmesí, colmillo de campeón, cuernos, cola de zorro… | 1–2 materiales nuevos donde solo hay piel y hueso, y un **trofeo** de capitán (Rufo) y de jefe (Gruk) |
| Tier | 12 tiers de barras (cobre → celestita) y de cuero/tela, rareza por grado | nada: el tier del set lo marca su barra/cuero/tela |
| Fabricación | hoja de trabajo FF14 en Herrería, Peletería, Sastrería, Artesanía y Joyería, con diorama 3D, calidad ~1–3 y recetas por datos (patrón `OFGEAR.gen`) | recetas de set y de capa |
| Estadísticas | `def, str, acc, hp, mana, mreg` (piezas de botín `LOOT[].st`) + 20 pasivas `PS` (crit, double, bleed, stun, life, thorns, haste, swift, exec, frenzy, precise, lucky…) + estados `STS` | contador de piezas por set + suma de bonus por tramos (en `gs()`/`pv()`) |
| 3D | armaduras por cultura (`armorcult3d.js`), cascos (`helmets3d.js`), capas (`armor3d.js cape`), armas (`weapons2_3d.js`), iconos 3D automáticos con `armorHooks` | **un generador de modelos por set** (todas sus piezas nuevas) |

**Coste real = el arte:** cada set trae entre 4 y 8 modelos nuevos. Lo demás (datos, recetas, bonus, tooltip) es un lote. Rendimiento: cada set junta sus piezas por hueso y color en pocas mallas (patrón `kitWear`), con un tope de llamadas por héroe vigilado por `R3D.budget()`.

## 2 · Qué es un set
- **Nivel fijo:** cada set es de UN tier (lo dicen su barra y su nivel requerido) y de un grupo de monstruos. **Piezas** según el set:
  - **4 piezas:** casco, peto, botas y joya (amuleto o anillo).
  - **6 piezas:** casco, peto, pantalón, guantes, botas y arma (o escudo).
  - **8 piezas:** casco, peto, pantalón, guantes, botas, **capa**, arma y joya.
- **Oficio por material:** placas y armas de metal → **Herrería**; cuero → **Peletería**; tela y **capas** → **Sastrería**; arcos, ballestas y báculos → **Artesanía**; joyas → **Joyería**. Cada pieza lleva la **barra/cuero/tela del tier**, los **materiales del monstruo** y, en las piezas clave, su **raro** o el **trofeo** del capitán o jefe.
- **Recetas encadenadas (como Dofus):** algunas piezas de un set de nivel superior piden **una pieza de un set anterior** como ingrediente (máx. 1 por pieza, de la misma ranura o temática): p. ej. el *Casco de Gruk* pide el *Casco orco*, y en el Bosque el *Peto del jabalí sombrío* pide el *Peto del Cazador* de la Pradera. Así lo viejo (piezas y materiales) sigue sirviendo. **No hay ascensión** de una misma pieza.
- **Todo nuevo:** cada set tiene modelo y paleta propios por pieza (el Gelatinoso, verde translúcido con gotas; el Espantapájaros, paja y arpillera cosida…). Respeta la cultura del bioma (Pradera = medieval) y la regla de sentido. **Ninguna pieza recolorea otra**.

## 3 · Bonus por piezas equipadas (como Dofus)
- **Tramos:** cada pieza equipada del mismo set suma su tramo: 2, 3, 4… hasta 4/6/8. Las estadísticas de cada tramo son **acumuladas** (el tramo 4 incluye lo del 3).
- **Qué dan:** estadísticas existentes (`acc, str, def, hp, mana, mreg`), pasivas `PS` (crit, double, bleed, stun, life, thorns, haste…) y, en el **tramo completo**, una **pasiva única** del monstruo hecha con estados que ya existen:
  - **Gelatinoso:** quien te golpea queda pegajoso (`slow`).
  - **Espantapájaros:** Miedo al golpear.
  - **Bandido:** daño por la espalda y sangrado con daga.
  - **Orco:** el mandoble gasta menos aguante y su golpe cargado aturde.
  - **Goblin:** las flechas envenenan.
  - **Gruk:** onda de choque al cargar un golpe.
- **Sets BASE de cada tier** (el equipo normal de metal, cuero o tela, que ya existe): también tienen bonus por piezas, más pequeños y **parecidos entre sí**, con el sabor de su **cultura** (`cultOf` del tier):
  - Pradera medieval: «Disciplina», +defensa.
  - Bosque élfico: «Puntería», +precisión.
  - Pantano tribal: resistencia al veneno.
  - Cumbres nórdicas: +vida y frío.
  - Oriental samurái: +crítico.
  - Volcán infernal: +fuerza y fuego.
  - Páramo arcano: +maná.
  - Desierto: +celeridad.
  - Costa pirata: robo de vida.
  - Cielo: regeneración.
  - Infierno: espinas.

  Escalan con el tier y nunca llevan pasiva única: el set de monstruo siempre aporta más carácter.

## 4 · Equilibrio (lo decide el agente; cifras de partida, se miden con `ttk_check`)
- **Pieza de set ≈ pieza normal del mismo tier (100 %)**, pero especializada: más de una estadística y menos de otra (el Bandido, más crítico y menos defensa).
- **Peso de los tramos (frente al equipo normal del tier):**
  - **set base completo:** +4–6 %;
  - **set de 4 completo:** +8 % + pasiva única pequeña;
  - **set de 6 completo:** +12 % + pasiva;
  - **set de 8 completo:** +16 % + pasiva fuerte.

  «%» = tiempo para matar o supervivencia en `ttk_check`. Mezclar 2 + 2 + 2 de sets distintos debe rendir algo menos que un set completo, pero ser viable (la gracia de Dofus).
- **La comida y los buffs siguen siendo esenciales** (decisión del dueño): los sets suben poder, no sustituyen a la comida.
- **Tiempo en un bioma:** no se sabe cuánto estará el jugador, así que cada bioma reparte sus sets entre sus tiers (de 2 a 3 tiers por bioma) y siempre hay uno nuevo a mano al subir de tier. Fabricar un set completo debe costar unas **1–2 h de farmeo** del monstruo a su nivel (se medirá con `meas_progresion` + `craft_balance`).
- **Herramientas nuevas:** `ttk_check.py --sets` (con y sin cada set; objetivo: cada set completo dentro de su % ±3) y `craft_balance` con las recetas encadenadas.

## 5 · Sets de la Pradera (cierre de N0): 7 sets, 40 piezas
| Set | Monstruos | Tier (nv) | Piezas | Familia y oficios | Pasiva del set completo |
|---|---|---|---|---|---|
| **Gelatinoso** | slime | cobre (1–7) | 4: casco, peto, botas, amuleto | tela untada: Sastrería + Joyería | quien te golpea queda pegajoso (lento) |
| **Cazador de la Pradera** | conejo, cabra, zorro rojo, jabalí, toro (fauna) | cobre (1–7) | 4: gorro, chaleco, guantes, botas | cuero: Peletería | más desuello y más daño a la fauna; pata de conejo = joya de suerte opcional |
| **Goblin** | goblin, goblin arquero, chamán | bronce (8–13) | 6: casco, peto, pantalón, guantes, botas, **arco goblin** | cuero y hueso: Peletería + Artesanía | las flechas envenenan; + precisión a distancia |
| **Espantapájaros** | espantapájaros embrujado | bronce (8–13) | 6: sombrero, túnica, pantalón, guantes, botas, **hoz** (daga) | arpillera y paja: Sastrería + Herrería | probabilidad de Miedo al golpear |
| **Bandido** | bandido, bandido asesino + **Rufo** (trofeo) | bronce/hierro (10–15) | 6: pañuelo, jubón, pantalón, guantes, botas, **daga** | cuero oscuro: Peletería + Herrería | por la espalda y sangrado con daga |
| **Orco** | orco, orco campeón | hierro (14–17) | 6: yelmo, peto, grebas, guanteletes, botas, **mandoble** | placas toscas: Herrería | el mandoble gasta menos aguante; carga aturdidora |
| **Gruk** (jefe) | Gruk (trofeo) | hierro (15–17) | **8:** yelmo, peto, grebas, guanteletes, botas, **capa**, **maza de guerra**, amuleto | placas + pieles: Herrería + Sastrería + Joyería | onda de choque al cargar un golpe; **4 piezas piden la pieza Orco equivalente** |

- **Materiales nuevos necesarios:** trofeo de Rufo («Sello del Cabecilla»), trofeo de Gruk («Colmillo de Gruk»), «Núcleo de gelatina» (raro del slime), «Botón de hueso» (goblin), «Arpillera embrujada» (espantapájaros). Todos con icono 3D y en `QITEM` si son de misión (no lo son).
- **Encadenadas en la Pradera:** las 4 piezas Gruk de la tabla, y el amuleto de Gruk, que puede pedir el amuleto Gelatinoso (opcional). El Bosque (N6) pedirá piezas Cazador y Orco en algunos de sus sets.

## 6 · Capas (cambio de decisión, 3 nov 2026)
- **Se fabrican desde el inicio en Sastrería:** una capa normal por tier (tela del tier + tinte), con el modelo de capa por cultura que ya existe, y estadísticas pequeñas (vida/defensa); entran en los sets base de su tier. **Todas las capas deben verse bien** (aclaración del dueño, 3 nov 2026): la fabricable no es «la fea»; tela con caída y física (`cape` de armor3d.js), ribete, broche y detalle por cultura y tier, revisada en captura quieta y en movimiento.
- **Capas de set:** solo en los sets de 8 piezas, con modelo propio y el acabado de su set (tan cuidadas como el resto de piezas).
- **Capas exclusivas por logros:** se mantienen (catálogo «capas legendarias» pendiente). Lo que las distingue es la **exclusividad**, no que las demás sean peores de aspecto: diseño propio llamativo y **efectos únicos** (estela, partículas, una pasiva propia) que ninguna capa fabricable tiene. No se fabrican.

## 7 · Interfaz
- **Tooltip:** nombre del set, «3/6 piezas», lista de tramos (activos resaltados) y pasiva única; si la receta pide una pieza anterior, se indica («Pide: Casco orco»).
- **Personaje:** «Set Orco 4/6» bajo el muñeco; el Libro de recetas tiene una sección «Sets» por bioma con qué monstruo da cada material.
- **Avisos:** `RECN.unlock` al descubrir la primera receta de un set (al conseguir su primer material) y letrero al completar un set por primera vez. Se suma al **Registro de colección** de N3.

## 8 · Datos y código (cuando se implemente)
- **`src/monstersets.js` (NUEVO, global `MSET`, después de `oficios.js`):**
  - Tabla `SETS[id]={n, bioma, tier, mobs, piezas:{slot:{fam, oficio, mats, pide?}}, tramos:{2:{…},3:{…},…}, pasiva, look}`.
  - `BASESET[cultura]` con los bonus de los sets base.
  - `gen()` genera ids, `I`, estadísticas y recetas (`ACT[oficio]`).
  - `count()`/`bonus()` cuentan las piezas equipadas por set y suman los tramos en `gs()`/`pv()`; las pasivas únicas van por `STS`/`hitM`.
  - Las ids siguen la regla del id del tier: `ms_<set>_<ranura>_<tier>` (p. ej. `ms_gel_a_cobre`).
- **3D:** `src/r3d/monstersets3d.js` (NUEVO): un generador por set y ranura (`setWear(set, slot, F, g, part, C)`), enganchado a `armorHooks` y al icono 3D; armas del set en `weapons2_3d.js`; las piezas se juntan por hueso y color.
- **Capas fabricables:** receta en Sastrería por tier + ranura `c` en el equipo; quitar la regla «las capas NO se fabrican» de `AGENTS.md` y `REGLAS_CREACION.md` al implementarlo.
- **Guardado:** sin cambios de formato (piezas normales en `S.eq`).

## 9 · Orden (un lote por mensaje)
1. **S1 · base del sistema:** `MSET` (datos, recetas, contador, tramos, tooltip) + **sets base por cultura** + **capas fabricables** + `ttk_check --sets`.
2. **S2 · primer set completo:** el **Gelatinoso** (4 piezas, modelos nuevos), medido y en captura.
3. **S3–S6 · el resto de la Pradera:** Cazador, Goblin, Espantapájaros, Bandido, Orco, Gruk (con materiales y trofeos nuevos y las recetas encadenadas).
4. **S7 · equilibrio y cierre:** `ttk_check --sets`, `meas_progresion`, `craft_balance` y capturas de los 7 sets puestos.
5. **Desde N6:** cada bioma nuevo trae sus sets (≈ 6–8, de 4/6/8 piezas, repartidos en sus tiers, con recetas que piden piezas de sets anteriores) como parte de la plantilla de bioma.
