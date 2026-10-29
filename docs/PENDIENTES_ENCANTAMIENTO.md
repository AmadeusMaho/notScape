# PENDIENTES DEL ENCANTAMIENTO — encargo para el siguiente agente (28 oct 2026)

> Estado de partida: lotes ENCANTAMIENTO v1 → ENCANT-VFX-2 → ENCANT-ICONO → ENCANT-NIVELES → ESTADOS-FINALES → ENCANT-T2 + ENCANT-IMPACTO (todos en `AGENTS.md`).
> **Lee antes:** `docs/GUIA_VFX_ENCANTAMIENTOS.md` (cómo están hechos los VFX), `docs/PLAN_ENCANTAMIENTOS.md` (diseño aprobado y recorte), `docs/REGLAS_CREACION.md` §P (rendimiento, PRIORIDAD 1).
> **Archivos clave:** `src/enchant.js` (ENCH: datos, recetas, procs, pasivos), `src/status.js` (STS: 34 estados, reacciones), `src/r3d/enchfx3d.js` (VFX en la mano + aura), `src/r3d/impact3d.js` (impactos, `R3D.impact`), `src/item-icons.js` (`ench()`: icono), `src/game.js` (`hitM`, `kill`, `stepAct`, `use`/`wReq`, `npDeb`).
> **Orden recomendado por el agente anterior y aceptado por el dueño:** TAREA 1 → TAREA 2 → que el dueño juegue → TAREA 3 (equilibrio con sus notas) → resto. Después, volver a la Fase 3·e (mundo) y a los oficios (ver `docs/HOJA_DE_RUTA.md`).
> Al terminar cada tarea: lote en `AGENTS.md`, línea en `docs/HOJA_DE_RUTA.md`, `PYTHONUTF8=1 python tools/rules_check.py` sin FALLO, `R3D.budget()` en Media y Alta, consola limpia, y tachar aquí lo hecho.

## Cómo probar (vale para todas las tareas)
- GPU real: `python tools/fast/ns.py start --gpu --w 1280 --h 800 --q 1` (ya lanza Chromium sin estrangular la ventana tapada). Comandos: `ns.py eval "…"`, `ns.py shot out.png [--sel '#side'] [--wait 0]`, `ns.py logs`, `ns.py reload`. Con acentos en la salida usa `PYTHONUTF8=1`.
- Escena de prueba (prado al este de Villa Pradera): `const b=BIOMES.list[0];NSTEST.tp(b.ox+4900,b.oy+3300);NSTEST.zoom(9);NSTEST.tab(null)`.
- **Trampas conocidas:** `NSTEST.hour()` congela el reloj (el héroe no desenfunda): no lo uses. El arma se queda en la mano con `setInterval(()=>{P.cbT=performance.now()},400)`. Las armas de hierro piden Combate 14: sube `S.xp.cb=2e6` (y `ra`/`mg`). No vacíes `S.inv` antes de que termine la carga. Las funciones globales de `game.js` (`ITEMICON`, `HUDSU`, `A`, `M`…) son `const/let`: en módulos usa `typeof X!=='undefined'`, nunca `window.X`. Un `//` dentro de una línea larga se come el resto: usa `/* */`.
- Dar y equipar un arma encantada: `const id=ENCH.idOf('sw_hierro~0','fuego',3);ENCH.ensure(id);CHEAT.give(id,1);use(S.inv.indexOf(id))`.
- Enemigo quieto para probar: `NSTEST.spawn('orco',-60,40);const m=M[M.length-1];m.hp=m.mh=9999;m.dm=0`; aplicar estados a mano con `STS.add(m,'burn')`; impactos con `R3D.impact.burst(m,'fuego',1)` y para capturar `setTimeout(()=>R3D.impact.ts=0,110)` (luego `R3D.impact.ts=1`). Posición en pantalla: `ISO.toCanvas(m.x,m.y,TER.standZ(m.x,m.y))`.

---

## TAREA 1 · ESTADOS VISIBLES EN EL ENEMIGO ✅ HECHA el 28 oct 2026 (lote ENCANT-ESTADOS-VISIBLES en AGENTS.md; `Aura` en `impact3d.js`). Queda solo: aura/funda en el jugador (el estallido al romperse la congelación se hizo en ENCANT-VFX-CUERPO). El texto de abajo es el encargo original.
**Problema:** un enemigo quemado, congelado o envenenado solo muestra el icono sobre su nombre (`npDeb` en game.js) y el texto al aplicarse. No se «ve» el estado mientras dura.
**Qué hacer:** un aspecto persistente por estado mientras esté activo, pensado para leerse a zoom normal sin tapar al enemigo:
| estado | aspecto propuesto |
|---|---|
| burn / incinerate | lenguas de llama pequeñas sobre el cuerpo y ascuas (Incinerar: más y casi blancas) |
| freeze | el enemigo «encapsulado»: tinte azul-blanco + 4–6 púas de hielo a su alrededor; al romperse (`STS.thaw`) estallido de esquirlas (reutiliza la receta `escarcha` de impact3d.js) |
| chill (cargas) | escarcha que sube por las piernas: tinte azulado que crece con `n` (1–5) + copos |
| poison / toxin | tinte verde que palpita + burbujas que suben (Toxina: más intenso y vapores) |
| bleed / hemorrhage | gotas que caen al suelo cada ~0,5 s (Hemorragia: más a menudo; más aún si se mueve) |
| shock / overload | 1–2 arcos eléctricos pequeños que saltan sobre el cuerpo |
| curse / doom | humo violeta que lo envuelve; Condena: un sello oscuro que late y se acelera antes de estallar |
| corrode / dissolve | burbujeo amarillo-verde; Disolución: tinte ácido fuerte |
| rend | tajos blancos tenues que aparecen y se desvanecen |
| fear | el enemigo tiembla + 2–3 motas violetas sobre la cabeza |
| silence | sello azul sobre la cabeza |
| mark | la retícula de la Cazadora pequeña y fija sobre él (le gustó al dueño) |
| judgement | aura dorada tenue en el suelo (NO un anillo que se expande: los anillos los descartó el dueño) |
| wet | gotas de agua cayendo + tinte húmedo (más oscuro y brillante) |
| root | raíces que lo sujetan (puede ser un prop instanciado pequeño o partículas verdes en los pies) |
| blind | sombra/velo sobre la cabeza |
**Cómo (técnica recomendada):**
1. **Partículas:** amplía `impact3d.js` con `aura(m, k)`: cada fotograma, para cada enemigo con `m.sts` y a la vista, emite partículas del estado con un ritmo bajo (≤ 2–4/s por estado, tope global ~60 partículas para estados). Recorre solo los actores visibles (`refs.actors.map`, no todo `M`). Reutiliza los tipos del shader (llama, burbuja, gota, chispa, glifo, humo) y añade los que falten (púa de hielo fija, arco eléctrico pequeño, sello).
2. **Tinte del cuerpo:** `actors3d.js` ya tiene `setFlash` (destello de daño); añade un tinte por estado con un uniform del material del actor (color + intensidad). **Ojo:** cambiar `o.material` sin volver a añadir el objeto NO pasa por `ShaderGate` → mete el material nuevo en `warmObjs` o usa un uniform del mismo programa (preferible: sin recompilar).
3. Lee los estados con `STS.list(m)` (devuelve `{k,d,n,rem,tot}`); el color de cada uno está en `STS.D[k].col`.
**Criterios de aceptación:** se distingue cada estado a zoom normal (captura a zoom mínimo y máximo); 10 enemigos con 2 estados cada uno no suben más de 2 llamadas de dibujo; `R3D.budget()` ok en Media y Alta; sin compilaciones de shader en juego (`[R3D] shaders compilados EN JUEGO` no debe aparecer).

## TAREA 2 · QUE LAS REACCIONES OCURRAN (prioridad 1)
**Problema:** las reacciones de `status.js` (`react`) necesitan dos elementos en el mismo enemigo, pero cada arma lleva un solo encantamiento y **Empapado no tiene ninguna fuente** (Marea quedó fuera del recorte). Hoy Electrocutado y la congelación instantánea no pueden pasar en partida.
**Qué hacer (propuesta; confirma con el dueño las que cambien el diseño):**
1. **Lluvia y agua empapan:** con lluvia/tormenta (`WX`/clima en `ambient.js` o donde se guarde) y al pisar agua poco profunda o salir de ella, `STS.add(P,'wet')` y a los enemigos al aire libre; con lluvia los estados de fuego duran menos (Empapado apaga el fuego ya en `react`).
2. **Enemigos con estados elementales:** añadir a `STS.ONHIT` (golpes de criaturas) o a las habilidades por datos `MD[id].sk` estados nuevos: p. ej. ranas/cosas del Pantano → `wet`; demonios → `burn`; yetis/criaturas de Cumbres → `chill`; brujas/chamanes → `curse` o `silence` contra el jugador; algún élite → `fear`. Recuerda que el jugador también sufre reacciones (el fuego + el hielo = Vapor y ceguera).
3. **Segunda fuente para el jugador:** la magia (bola de fuego ya aplica `burn`) puede añadir el segundo elemento: un hechizo de agua/hielo básico encajaría (va con la Fase 14 «Magia/escuelas», o adelanta uno si el dueño quiere).
4. ✅ HECHO el 28 oct 2026 (lote ENCANT-VFX-CUERPO: `REACT` en impact3d.js + funda `bodyfx3d.js`; también el estallido al romperse la congelación). Texto original: Que la reacción se VEA: hoy solo sale texto + `sp()`; añade una receta en `impact3d.js` por reacción (Electrocutado, Vapor, Nube tóxica, Purga, Congelado) llamándola desde `react` (`window.R3D&&R3D.impact`).
**Criterios:** en una partida normal con lluvia y un arma Tormentosa se ve un Electrocutado; prueba automática en `ns.py` de cada reacción (ver la batería del lote ESTADOS-FINALES en AGENTS.md).

## TAREA 3 · EQUILIBRIO (después de que juegue el dueño)
Todas las cifras son propuesta del agente, sin jugar. Dónde están:
- Probabilidad, enfriamiento, duración por encantamiento: `ENCH.D[e].p/cd/dur` (enchant.js); escalado por nivel `LVP`, `LVD`, `LVB`; por tier del arma `chance()` (+18 % por escalón).
- Pasivos: `dmg` (Afilada/Implacable), `ls` (Vampírica), `und`, `dmgR`, `dmgM`; armadura (6 % espinas, +3 PV, 6 s de regeneración, 4 % de velocidad, 12 %/15 % de resguardo/purificación); herramientas (17 %, 25 %, 10 %, ×1,5, 10 %).
- Estados: `STS.C` y cada fila de `STS.D` (daño por tick = 4 % de la vida del enemigo × `vm`, cargas, duraciones).
- Esencias: `ENCH.drop` (4 % + 0,15 %/nivel; ×3 élites/jefes; puras 25 % jefes / 8 % élites), refinar 5→1, desarmar 1/2/4.
- Botín encantado: `lootRoll` (15/25/35 %).
- XP y niveles de Encantamiento: `needLv`, `pxp` en `rebuild`; mide con `tools/meas_progresion.py` (sin `-I`).
- Requisito de las armas (`wReq` en game.js).
**Cómo:** pide al dueño 2–3 sesiones de juego y sus notas; ajusta en lotes pequeños. Útil: añadir al panel F4 o a un `NSTEST` un contador de procs/min por efecto.

## TAREA 4 · INTERFAZ
1. **Mesa de encantamiento:** `ACT.en` se regenera en `ENCH.rebuild()` (al abrir la mesa, `openIW` con `e.id==='altar'`) con TODAS las combinaciones (objeto × efecto) + Potenciar + Ascender + Refinar + Desarmar: con mochila llena son cientos de filas. Hace falta: agrupar por objeto (elige primero el objeto, luego el efecto), pestañas Encantar / Mejorar / Esencias / Desarmar, y mostrar el efecto (`ENCH.desc`) y el VFX (icono con `ITEMICON.ench`) antes de confirmar. Es la hoja de trabajo FF14 (`WKUI`, skin `arcane` en forge.js): mira cómo otros oficios eligen receta.
2. **La Mesa debería estar en un Templo arcano** (diseño de oficios), hoy es el `altar` del Taller (`interiors.js`). Cuando exista el edificio, moverla (y su `IWI`/`ROOMOF`).
3. **Iconos de estados y esencias:** hoy son emojis (`STS.D[k].ic`, `I['es_*']`, `I['esp_*']`). El HUD usa iconos de línea en SVG (ver `SKI` en game.js) y las reglas del HUD piden sin emojis: dibuja un SVG por estado (en `npDeb` y en la barra de buffs del jugador) y un icono 3D/2D de esencia (frasco con el color del efecto; pura = cristal) en `itemgen3d.js`/`item-icons.js`.
4. **Brillo de la armadura en el retrato y el muñeco** (`HeroPreview`/`preview3d.js`, `portrait3d.js`, `HUDSU.doll`): usan `MiniHero` pero no `EnchFx.aura`; decidir con el dueño si lo llevan (es barato: mismas partículas).

## TAREA 5 · CONTENIDO A MEDIAS
1. **Estados positivos con fuente:** Regeneración, Celeridad, Espinas e Inquebrantable (`STS.D.regen/haste/thorns/unbreak`) solo los dan hoy los pasivos de armadura (que no usan el estado). Darles fuente: pociones (Alquimia, `ALQ`), comida (Cocina, `COC`), o un proc de armadura «Represalia» si el dueño lo recupera de la reserva.
2. **Enemigos que usan los estados nuevos contra el jugador** (Miedo, Silencio, Toxina, Maldición, Electrizado…): por datos en `STS.ONHIT` y `MD[id].sk`; el jugador con Silencio no debería poder lanzar hechizos (`cast()` en game.js) y con Miedo… decidir con el dueño (¿pierde el control 1 s?).
3. **Sonido por elemento:** no hay ninguno. Al aplicarse el encantamiento (`ENCH.proc`) y en cada impacto (`R3D.impact.burst`): un sonido corto por elemento. Sigue la regla de licencias (CC0, `docs/CREDITOS.md`) o síntesis con `tone()/noise()` como el resto del juego.
4. **Anillos y amuletos (Joyería):** decidir con el dueño si se encantan; si sí, `kindOf` en enchant.js debe aceptar las ranuras `r`, `r2`, `n` y hace falta una categoría de encantamientos de joya.
5. **Aplastante** vale hoy en cualquier arma cuerpo a cuerpo porque no hay mazas/hachas de combate fabricables; si se añaden, limitar `only` a ellas.
6. **Reserva del plan** (`docs/PLAN_ENCANTAMIENTOS.md`): Corrosiva, del Viento, del Terror, Marea, Ejecutora, de Ecos, Fortuna (armas); Represalia, Destreza, Inquebrantable, Lucidez y los 5 Resguardos elementales (armadura); Ligereza, Concentración, Conservación, Prospección (herramientas). Solo si el dueño los pide.

## TAREA 6 · COMPROBACIONES PENDIENTES
1. **Requisito de nivel de las armas** (`wReq`/`wOk` en game.js): jugar el tutorial de la isla de punta a punta (`python tools/isla_playthrough.py`) y comprobar que nada se rompe (las armas de inicio son de cobre/pino = nivel 1; las prestadas por Miguel también); revisar `autoEq` (no debe equipar un arma que no puedes usar) y el botín que el jugador aún no puede usar (que el tooltip lo marque en rojo: ya lo hace).
2. **Móvil y gráfica integrada:** medir con el panel F4 y `R3D.stats()` en el PC/móvil del dueño con un arma encantada superior + armadura encantada + 5 enemigos con estados e impactos seguidos. Límite: el presupuesto de §P.
3. **Héroe con armadura de placas = ~560 llamadas de dibujo** (medido el 28 oct, NO es de los encantamientos; sin armadura ~280): investigar por qué la armadura metálica dobla las llamadas del héroe (muchas piezas con contorno). Afecta a todas las calidades.
