# PLAN DE HABILIDADES DE COMBATE (Fase 2 · cierre) — 29 oct 2026

> Decidido con el dueño el 29 oct 2026. **Manda sobre la Ronda 6 de `PLAN_POSTPORTEO.md` en lo de «sin habilidades de arma»** (el dueño cambió de opinión: ahora SÍ hay kit por arma). Del plan anterior se conserva: subclases/Caminos, estados alterados como base de las mutaciones, nada de barras nuevas en el HUD, poco texto.
> Estado: **motor + los 8 kits (espada, daga, mandoble, puños, arco, ballesta, báculo, cetro) implementados** (`src/combatskills.js`, global `CSK`). **Las 10 especializaciones también (29 oct, lote HABILIDADES-3).** Quedan FX/animaciones, mutaciones y equilibrio (§6 pasos 5–6).

## 1. Idea en una frase
Cada **familia de arma** da un **kit de 6 habilidades** que se aprenden **solos al subir el nivel de la skill** (Combate, Arquería, Magia) y mejoran de **rango USÁNDOLAS**. La **especialización** (subclase, se elige a nivel 30) añade habilidades y una regla propia encima del kit. Cambiar de arma cambia la barra.

Sin puntos de talento (decisión del dueño): la elección del jugador está en **qué arma lleva**, **qué especialización toma** y **qué 6 de sus habilidades equipa** cuando haya más de 6.

## 2. Cómo funciona una habilidad
| Regla | Valor |
|---|---|
| Teclas | **1–6** (casillas de la barra bajo la vida, `#hs-sk`). LMB sigue siendo el ataque básico, RMB bloquear |
| Recurso | **Energía** (Combate y Arquería, 100 máx., regenera **1,5/s** = `CSK.ENR`) y **Maná** (Magia, costes como fracción del máximo; con un kit de magia regenera además el **1,5 % del máximo por s** = `CSK.MR`) |
| Enfriamiento | propio de cada habilidad + **0,7 s global** |
| Daño | siempre **× el golpe máximo del arma** (`maxHit()`): el tier del arma ya escala todo |
| Desbloqueo | por **nivel de la skill** del arma (1 · 8 · 18 · 30 · 45 · 65). Un letrero (`RECN.unlock`) lo anuncia |
| Rango (dominio) | I–IV por usos (20 / 80 / 240 / 600): **+8 % de efecto y −4 % de enfriamiento por rango** |
| Requisitos | enemigo a la vista (`spellTarget()`); cuerpo a cuerpo hasta ~90 px, distancia ~260 px; no vale en interiores ni durante el tutorial de la isla (la tecla 1 sigue siendo la bola de fuego) |
| Familia | la da `wKind()` (sin arma = puños; las armas de botín `lw_*d/m/b/c` dan daga/mandoble/ballesta/cetro). Alcance cuerpo a cuerpo: daga 78 px, puños 72, espada 90, mandoble 106 |

**Arquetipos** (campos de datos, ya soportados por el motor): golpe (`coef`), varios golpes (`n2`), área (`aoe`, centrada en ti con `self`), estado al objetivo (`sts`), aturdir (`stun`), ejecutar (`exec`), robar vida (`drain`), mejora propia (`buf` → estados `fury`, `shield`, `haste`, `regen`…). Un arquetipo nuevo = una rama en `CSK.use`; una habilidad nueva = **una fila de datos**.

## 3. Kits por arma (6 habilidades cada uno)
Niveles de desbloqueo: **1 · 8 · 18 · 30 · 45 · 65**. ✔ = implementado; todas las filas de las tablas lo están.

### Combate (Energía)
| Arma | Identidad | Kit |
|---|---|---|
| **Espada** ✔ | equilibrio, control del ritmo | Tajo · Corte sangrante (Sangrado) · Torbellino (área) · Grito de guerra (+30 % daño) · Golpe aturdidor (interrumpe) · Ejecución |
| Daga | rapidez, sangrado, espalda | Puñalada doble · Veneno de hoja · Paso sombrío (se coloca a la espalda) · Danza de dagas (5 golpes) · Hemorragia · Estocada letal |
| Mandoble | lento y brutal | Golpe pesado · Quebrar armadura (Vulnerable) · Barrido · Furia · Embestida (aturde) · Decapitar |
| Puños | combos, ritmo | Jab · Patada baja (Ralentiza) · Ráfaga (4 golpes) · Meditar (Regeneración) · Palma (aturde) · Golpe del dragón |
| Escudo (modificador) | con escudo equipado las habilidades de espada defensivas ganan bloqueo | Guardia (reduce el golpe pesado) · Embestida de escudo |

### Arquería (Energía)
| Arma | Identidad | Kit |
|---|---|---|
| **Arco** ✔ | movilidad, presión constante | Disparo certero · Flecha envenenada · Lluvia de flechas (área) · Ojo de halcón (+30 % daño) · Flecha de escarcha (Ralentiza) · Tiro mortal |
| Ballesta | daño alto, lento | Virote certero · Virote perforante (Expuesto) · Anclaje (Raíces) · Carga rápida · Salva · Disparo del francotirador |

### Magia (Maná)
| Arma | Identidad | Kit |
|---|---|---|
| **Báculo** ✔ | control y área | Orbe arcano · Escarcha (Ralentiza) · Nova (área) · Barrera de maná (Escudo) · Rayo (Electrizado) · Meteoro |
| Cetro | sustain y daño oscuro | Drenar vida · Marchitar (Maldición) · Muro de sombras · Nube tóxica · Cadena de almas · Condena |

> Nota Magia: el sistema antiguo de hechizos (`SPL`, runas, `MAGIC_ON=false`) sigue **apagado**. Las habilidades del báculo van por el motor nuevo y son la base de la futura magia (escuelas, Fase 14). Los bastones golpean cuerpo a cuerpo como hasta ahora.

## 4. Especializaciones («Caminos» / subclases)
Se eligen **una vez por skill a nivel 30** (re-especialización de pago: monedas, y más adelante el «Tomo del olvido»). Cada una **no sustituye** el kit del arma: añade **3 habilidades propias** (niveles 30 / 50 / 75), **1 regla de identidad** (siempre activa) y **1 piedra clave** (a nivel 60, se elige 1 de 2) que cambia una regla en vez de dar %.

| Skill | Camino | Arma | Regla de identidad | Habilidades propias |
|---|---|---|---|---|
| Combate | **Guardián** | espada + escudo | el bloqueo perfecto contraataca; −25 % al golpe pesado telegrafado | Embestida de escudo (aturde) · Provocar · Muro inamovible |
| Combate | **Asesino** | daga | crítico garantizado sobre enemigos que no te han visto; bonus por la espalda | Paso sombrío · Marca de muerte · Danza de dagas |
| Combate | **Verdugo** | mandoble | +daño contra <30 % de vida; Furia al bajar tu vida | Decapitar · Quebrar armadura · Rugido |
| Combate | **Monje** | puños | cada golpe sin recibir daño sube una racha (máx. 5) que potencia el siguiente | Ráfaga · Palma de trueno · Postura del tigre |
| Arquería | **Cazador** | arco | cada flecha sobre la misma presa suma +5 % (máx. 5) | Marca de presa · Trampa · Lluvia mortal |
| Arquería | **Francotirador** | ballesta | los disparos lejanos perforan defensa; el primer tiro tras quedarte quieto es crítico | Anclaje · Bala de gracia · Ojo de águila |
| Magia | **Piromante** | báculo | los conjuros de fuego dejan Quemadura | Bola de fuego · Muro de llamas · Incinerar |
| Magia | **Criomante** | báculo | el frío acumula Escarcha; los congelados reciben crítico | Lanza de hielo · Ventisca · Prisión de hielo |
| Magia | **Tempestad** | báculo | los rayos saltan a un enemigo cercano | Relámpago encadenado · Descarga · Tormenta |
| Magia | **Oscura** | cetro | daño oscuro, sin coste de vida | Marchitar · Cadena de almas · Abismo |

Piedras clave (ejemplos): Guardián «Contragolpe» (el parry devuelve el 100 %) o «Fortaleza» (+escudo); Asesino «Hemorragia en cadena» o «Sombra» (ventana de crítico tras Paso). **Mutaciones** (D3-style) quedan para cuando exista la barra de mejoras.

Los **estados** (sangrado, quemadura, escarcha, electrizado…) y sus **reacciones** (Empapado + rayo = Electrocutado, fuego + hielo = Vapor…) ya existen en `status.js`: las especializaciones solo los eligen.

## 5. Progresión y equilibrio
- Daño de habilidad: coef **0,35–3,1** del golpe máximo (tras el equilibrado del 29 oct, ×0,6 respecto al primer diseño); las caras (coef ≥ 1,5) tienen enfriamiento ≥ 25 s. **Medido con `python tools/csk_dps.py`**: con rotación perfecta (energía/maná siempre gastados) las habilidades suman **+55 % de DPS** sobre el ataque básico (familias entre +50 % y +59 %), sin contar buffs, estados ni área. Ojo: el XP de combate sube con el daño, así que un jugador que use la rotación a fondo llega a nivel 99 en ~35–40 h en vez de las ~55 h de `meas_progresion.py` (que solo modela el ataque básico).
- Energía: regenera 1,5/s (67 s de 0 a 100); las habilidades cuestan 8–40. Los jefes con golpe pesado obligan a gastar Energía también en esquivar (Espacio), así que hay que decidir.
- Magia: el coste es una fracción del maná (10–25 %), no un número fijo: escala con el nivel, y la regeneración extra del kit (1,5 %/s del máximo) hace que escale igual.
- Ninguna habilidad bloquea equipo: el tier del arma depende solo del nivel de la skill madre.

## 6. Orden de implementación
1. ✅ **Motor `CSK` + barra 1–6 + kits de espada, arco y báculo** (este lote).
2. ✅ Kits de daga, mandoble, puños, ballesta y cetro (solo datos).
3. ✅ Especializaciones: pestaña **Habilidades (Z)** (o clic derecho sobre la barra) para elegir Camino a nivel 30; reglas de identidad como ganchos `CSK.out/inMul/onHit`.
4. ✅ Asignación libre de la barra (elige habilidad y luego casilla) y re-especialización de pago (500 + 50 × nivel de monedas de cobre).
5. FX 3D por habilidad (estelas, marcas) y animaciones del héroe (`heroanim3d.js`); sonidos propios.
6. Mutaciones/piedras clave, Bestiario, Tomos (Fase 14).

## 7. Preguntas abiertas
- Nombre definitivo de las especializaciones y de las dos oscuras.
- ¿Las habilidades se pueden usar con el cursor oculto / táctil? (botones táctiles en la Fase 33).
- ¿Cuánto debe costar re-especializar?

## 8. Implementación de las especializaciones (HABILIDADES-3)
- `SP` en `combatskills.js` = datos de los 10 Caminos (`sk, fam, n, em, idn, key[2], kit[3]`). Una por skill (`S.csk.spec[sk]`); solo vale con las armas de `fam` (si cambias de arma sin Camino compatible, solo queda el kit).
- Identidad = `CSK.out(m,sk,wt,now)` (multiplica el daño que haces; enganchado en `hitM`), `CSK.inMul()` (daño que recibes; `monHit`) y `CSK.onHit(...)` (efectos al golpear; `hitM`). Valen para el ataque básico Y para las habilidades. Los golpes de espinas/cadena (`mxv===99`) no disparan `onHit` (sin recursión).
- Piedra clave: nivel 60, 1 de 2 (`S.csk.key[sk]` = 1|2; pulsar de nuevo la quita; cambiarla es gratis). Habilidades propias a nivel 30/50/75 (letrero `RECN.unlock`).
- Barra: la barra por familia (`S.csk.bar[familia]`) guarda 6 ids; lo que falta se rellena solo por nivel. Con Camino hay más de 6 candidatas: se reordenan en el panel.
- Pendiente de diseño: reglas del Guardián (parry real, hoy solo reduce daño), reducción del golpe pesado telegrafado, ambush del Asesino por la espalda.

## 9. Pestaña «Habilidades» y equilibrio de enemigos (HABILIDADES-5)
- **UI:** pestaña Z. Orden fijo: selector de ARMA → barra de 6 casillas → árbol (kit por nivel + ramas de Camino con piedra clave) → detalle con «poner en la casilla 1–6». Todo por clic; se puede explorar cualquier arma aunque no la lleves.
- **Enemigos:** `HPK=1,3` (game.js) sube la vida de todos los enemigos ×1,3 para compensar `CSK.UPLIFT=+30 %` de DPS con uso medio de las habilidades. `tools/meas_progresion.py` usa ese uplift: los niveles necesarios para capitanes y jefes (`needCap`/`needBoss`) no cambian respecto a antes de las habilidades. Rotación perfecta = +55 % (≈ 20 % más rápido que antes); sin habilidades = 30 % más lento. Si el equilibrio jugado dice otra cosa, se ajusta `HPK` y/o `UPLIFT` juntos.
