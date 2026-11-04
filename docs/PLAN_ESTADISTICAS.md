# PLAN · Atributos del personaje (itemización) — DISEÑO, sin implementar

> **IMPLEMENTADO EL MOTOR (3 nov 2026, lote N0.9-ATRIBUTOS):** ver AGENTS.md. Desviaciones respecto a este texto: (1) crítico base **5 % / ×1,5** (decidido) y el crítico es REAL en `hitM` (1 sola tirada para todo daño directo: golpes, habilidades, proyectiles); la antigua marca de «golpe máximo» (estrella dorada, número amarillo, hit-stop, temblor) ahora significa CRÍTICO; (2) CON NO da aguante máximo (está fijo en 100 en ~15 sitios): solo PV; (3) los atributos del equipo son IMPLÍCITOS (`attrOf` en game.js, sin tocar las tablas de objetos); `S.fzr`, `S.vig`, vitalidad encantada y comida NO se han migrado a atributos (siguen como antes); (4) sin atributos de gemas/joyas ni únicos todavía.
> Estado original: **propuesta de diseño del 3 nov 2026** (pedida por el dueño: «diseña Fuerza, Constitución, Agilidad, Inteligencia y los stats que consideres necesarios, para que los objetos sean fáciles de diseñar»). **Nada de esto está en el código.** Las cifras son punto de partida: se calibran con `ttk_check.py`, `csk_dps.py`, `sets_balance.py` y `meas_progresion.py` (ver §9).
> Respeta las decisiones vigentes: escala de daño PEQUEÑA (no ×10, escalones de +1/+2), comida y buffs esenciales, rareza fija por objeto, los tiers no dan rareza, Combate = un nivel único + maestría por arma.

## 1. Situación actual (medida en `game.js`)
`gs(k)` solo conoce 6 claves de equipo: `hp`, `def`, `str`, `acc`, `mana`, `mreg` (+ `MSET.stat` y `CST`). Las pasivas (`PS`, 20) dan el resto (crítico, robo de vida, etc.). No existe crítico, esquiva ni resistencia como número. Las armas llevan sus tablas (`SW/BOW/STF`, `SB`, `WSP`, `WB`).

## 2. Idea central
**5 atributos primarios** que dan los objetos, la comida, los encantamientos y los bonos de cuenta. Cada atributo se convierte en estadísticas derivadas con una fórmula lineal y pocos topes. El diseñador de objetos solo escribe `st:{fue:3,con:2}`; el motor hace el resto. Los atributos NO se reparten al subir de nivel (el dueño quiere que la progresión venga de equipo, maestría y comida).

| Atributo | Clave | Rol |
|---|---|---|
| Fuerza | `fue` | daño físico pesado |
| Constitución | `con` | vida y aguante |
| Agilidad | `agi` | críticos y ritmo |
| Inteligencia | `int` | daño y reserva mágica |
| Espíritu | `esp` | regeneración, curación, resistencia a estados |

Espíritu es el atributo añadido: separa «pegar con magia» (INT) de «aguantar y sostener» (ESP), y le da a la comida y a la curación un atributo propio.

## 3. Conversión a estadísticas derivadas (por punto)
| Atributo | Por punto | Tope |
|---|---|---|
| **FUE** | +0,25 al golpe máximo del arma (entra en `potS`, igual que `str` hoy; el redondeo final se mantiene) | — |
| **CON** | +1 PV plano **y** +0,5 % PV máximos · +0,5 de aguante máximo | aguante +25 |
| **AGI** | **+0,4 % prob. de crítico** · **+0,6 % daño crítico** · −0,5 % coste de aguante de esquiva/bloqueo | crítico 60 % (el tramo > 30 % cuenta mitad); daño crítico +100 %; coste −30 % |
| **INT** | +0,25 al golpe máximo mágico · +1 maná máximo | — |
| **ESP** | +3 % regeneración de maná · +0,5 % curación recibida (pociones, comida, regeneración) · −1 % duración de estados negativos | regen +150 %; estados −50 % |

- **Críticos (respuesta a «¿más críticos por punto?»): sí, AGI es el atributo del crítico.** Base del juego: 5 % de probabilidad y ×1,5 (**comprobar con `grep -n crit src/game.js` qué crítico existe hoy y partir de él**). Con 30 AGI: 17 % y ×1,68. La pasiva `crit` (Golpe devastador) se suma a esto, no lo sustituye.
- **Familia de arma → qué atributo escala su daño** (coeficiente sobre el golpe máximo; todas cobran el crítico de AGI):

| Familia | FUE | AGI | INT | ESP |
|---|---|---|---|---|
| Espada | .25 | .05 | — | — |
| Daga | .05 | .25 | — | — |
| Mandoble | .30 | — | — | — |
| Puños | .15 | .15 | — | — |
| Arco | — | .25 | — | — |
| Ballesta | .10 | .20 | — | — |
| Báculo | — | — | .25 | — |
| Cetro | — | — | .20 | .10 |

  `daño de atributos = Σ coef · atributo`. Un objeto «equivocado» no es inútil: la AGI de un peto de cuero sirve a todos por el crítico y la CON sirve a todos.
- **Se queda fuera a propósito:** Suerte (ya existe `S.luck` y las pasivas `lucky`/`prosp`), Resistencias elementales (candidato a un 6.º atributo más adelante, junto con los sets de bioma), esquiva pasiva (el combate es activo), velocidad de ataque como estadística (rompe el equilibrio `SWDMG/SPDREF`; sigue en la pasiva `haste`).

## 4. Qué conserva el sistema actual
`def` (armadura), `hp`, `mana`, `mreg`, `acc` **siguen existiendo como estadísticas planas** (para armaduras de base, sets, tallas de bioma). Migración: `str` legacy = alias de `fue` solo para los objetos ya hechos (pasa por `sbBonus` como hoy) hasta que se reescriban; los objetos nuevos usan `fue`.

## 5. Presupuesto por objeto (cómo llenar `st` sin pensar)
**Puntos de atributo de una pieza** = `round( peso_ranura × (1 + 0,2 × tier) )`, tier 0 (cobre) … 11 (celestita).

| Ranura | Peso |
|---|---|
| Peto | 1,5 |
| Piernas | 1,2 |
| Casco | 1,0 |
| Escudo | 1,0 |
| Guantes | 0,7 |
| Botas | 0,7 |
| Amuleto | 0,7 |
| Capa | 0,6 |
| Anillo | 0,5 |
| Arma | 0 (sus atributos van en su tabla de fuerza; solo las armas de botín y únicas llevan 1–2 líneas) |

Un conjunto completo de un tier da ≈ 8 puntos en cobre y ≈ 25 en celestita (el set de 8 del plan de sets ≈ ×1,3). Con el reparto de abajo eso es ≈ **+6–12 % de daño o vida frente al mismo equipo sin atributos**: pensado para que un escalón de tier lo note el jugador (+1 de golpe máx. cada 4 FUE) sin romper `ttk_check`.

**Reparto por familia de armadura** (el diseñador solo elige la plantilla; el motor reparte 60 % / 40 %):
| Familia | Principal | Secundario |
|---|---|---|
| Metal (placas) | CON | FUE |
| Cuero | AGI | CON |
| Tela / túnica | INT | ESP |
| Cota / mixta | FUE | AGI |
| Joyería (anillo/amuleto) | según la gema: rubí FUE · esmeralda AGI · zafiro INT · amatista ESP · diamante CON | — |

**Rareza** (solo botín `lt_/lw_`, sets, únicos, monturas y legendarios; los tiers fabricables son blancos): multiplica el presupuesto ×1,0 / 1,15 / 1,3 / 1,5 / 1,75 / 2,0 (común…Mítico) y reparte los puntos en 1 / 2 / 2 / 3 / 3 / 4 atributos. **Calidad de fabricación `~1/~2/~3`:** interpola hacia el presupuesto del tier siguiente con `FR=[0,.3,.55,.85]` (la misma curva que ya usa `bump`), sin tocar la rareza.
**Sets de monstruo:** cada tramo del set da puntos de atributos (no solo `hp/def`): p. ej. 2 piezas +2 del principal, 4 piezas +3 al secundario; la identidad del set (Cazador = AGI, Orco = FUE/CON, Gelatinoso = CON/ESP…) se lee en los números.

## 6. Otras fuentes de atributos
- **Comida y pociones** (esenciales): buffs temporales de atributos (guiso de carne +FUE, estofado +CON, infusión +ESP…), ≈ +15–25 % de un set completo del tier. Sustituyen a los buffs planos `S.buf.*` actuales poco a poco.
- **Bonos de cuenta ya existentes:** `S.fzr` (fuerza) → +1 FUE por rango; `S.vig` → +1 CON por rango; `S.dfs` sigue en `def`; `S.mana2` → INT; `S.mreg2` → ESP.
- **Encantamientos** (`ENCH.arm`): «vitalidad» ya da PV → pasa a CON; «celeridad» → AGI.
- **Maestría:** las pasivas de los árboles NW (`dmgS`, `dmgB`, …) no cambian. Una pasiva futura de «+2 al atributo de tu arma» es opcional.
- **Nada** sale del nivel de Combate (sin puntos que repartir).

## 7. Interfaz
- Pestaña Personaje: bloque «Atributos» (FUE CON AGI INT ESP con su valor total y, al pasar el ratón, de dónde vienen) y bloque «Derivadas» (golpe máx., PV, aguante, crítico %, daño crítico %, maná, regen, defensa).
- `desc()`: líneas «+3 Fuerza» en el color del atributo (rojo FUE, verde CON, amarillo AGI, azul INT, violeta ESP: tintes ensuciados al estilo Susurro), y al comparar con lo equipado, «(+1)» verde / «(−2)» rojo.
- Texto del juego en español; atributos siempre abreviados a 3 letras en iconos, nombre completo en el tooltip.

## 8. Cómo se implementa (orden recomendado, un lote por paso)
1. **Motor:** `ATTR=['fue','con','agi','int','esp']`; `gs()` ya suma cualquier clave de `st`, así que basta añadir `at(k)` = `gs(k)` + comida + cuenta + encantamiento; funciones derivadas (`critCh()`, `critMul()`, `hpMul`, `staMax`, `regMul`, `healMul`, `stsMul`) y engancharlas en `maxHp`, `potS`, `mnMax`, `mreg`, cobro de aguante, curación y duración de estados (`status.js`). Con todos los atributos a 0 el juego debe dar EXACTAMENTE los mismos números de hoy (comprobar con `ttk_check` y `meas_progresion`).
2. **Datos:** generador `attrFor(slot, tier, fam, rar, q)` (una función, §5) y migrar `AR/SHL/LGL/GLL`, joyas, `LOOT` y sets. Los objetos ya hechos reciben atributos por la función; los únicos (`UQ`) se escriben a mano.
3. **UI y tooltips** (§7), después comida/buffs.
4. **Calibrar** (§9) y apuntar las cifras finales en este archivo.

## 9. Comprobaciones antes de dar el lote por bueno
`ttk_check.py` (los tiempos por rol no se mueven con equipo del tier; con el equipo del tier siguiente mejoran +10–25 %), `csk_dps.py`, `sets_balance.py` (añadir la columna de atributos), `meas_progresion.py` (Combate 99 ≈ 55 h; needBoss/needCap sin comida solo informativos), `craft_balance.py`, `ids_check.py`, `NSTEST.killAll()` 400/0, `rules_check.py` (añadir regla: toda clave de `st` está en `ATTR` o en la lista plana), consola sin `[loop …]`.

## 10. Decisiones abiertas para el dueño
1. ✅ **DECIDIDO (3 nov 2026, dueño): Espíritu es el 5.º atributo.**
2. ¿Crítico base **5 % / ×1,5**, o partir de cero para que AGI sea la única fuente?
3. ¿Resistencias elementales como 6.º atributo ya, o cuando lleguen los sets de bioma?
4. ¿Comida con buffs de atributos desde el primer lote o después del motor?
