# AUDITORÍA del 21 oct 2026 — estado real vs. reglas

**Pedido del dueño:** reordenar las fases en un orden lógico, auditar lo hecho y comprobar que todas las reglas de creación se mantienen o están en su archivo. **Método:** (1) leer `AGENTS.md` entero y los lotes; (2) ejecutar TODAS las herramientas de verificación que se pueden correr en este PC (Playwright + Chromium con SwiftShader); (3) escribir `tools/rules_check.py` (comprobación estática de reglas); (4) consolidar las reglas en `docs/REGLAS_CREACION.md` y el orden en `docs/HOJA_DE_RUTA.md`; (5) archivar los lotes viejos.

## 1 · Resultado de las verificaciones
| Comprobación | Resultado |
|---|---|
| Sintaxis de `src/*.js` y `src/r3d/*.js` (copias `.mjs`) | ✅ sin errores |
| `tools/rules_check.py` (nuevo) | ✅ 0 fallos; avisos revisables (ver §3) |
| `roof_clip_check.py` (ANTICLIP, todos los biomas) | ✅ TODO OK |
| `props_sheet.py`, `pradera_sheet.py`, `bosque_sheet.py --medir` | ✅ OK |
| `nat_sheet.py --medir` | ❌→✅ **fallaba (crash)**: `mena` sin huella en `NAT_FOOT`. Corregido (162 mallas OK) |
| `cielo_check.py` (arquitectura de mármol) | ✅ OK, 48 k tris |
| `body_lint.js` (sin vigas) · `actors_lint.py` | ✅ OK |
| `biome_rules_check.py` | ✅ OK (10 filas, aviso siempre antes del efecto) |
| `node tools/iso_test.js` | ✅ OK (intermitente conocido ~1/3) |
| `village_check.py` k=0,3,4,5,6,7,8 | ✅ OK |
| `village_check.py 1` (Bosque) | ❌→✅ **solape taberna–casa de troncos 4 px**. Corregido en `village-barrios.js` |
| `village_check.py 2` (Pantano) | ⚠ 9 edificios pisan calle/plaza (aldea heredada, sin spec de barrios) → Fase del Pantano |
| `coast_check.py` | ❌→✅ **3 árboles de las arboledas del Cielo caían al agua/acantilado** (esquinas fuera de la elipse); corregido en `sky-biome.js`. El umbral «≥85 % tierra» estaba obsoleto con 4 columnas (ajustado ×.75) |
| `continent_check.py` · `hud_game_check.py` | ✅ OK |
| `speed_check.py` | ⚠ andar/correr bajos (60/122 px/s vs 70/133) por fps de SwiftShader (dt acotado a 0,1 s); borde del mundo **no cruzado** ✅ |
| `map_check.py` | ⏭ requiere argumentos (no se ejecutó) |

## 2 · Correcciones aplicadas en esta auditoría
1. `src/r3d/propsdark_nat3d.js`: `NAT_FOOT.mena=[.79,.36,.59]` y `tools/r3d/nat_sheet.py` con las 3 variantes (normal / cristal .70×.72×.55 / escombro .67×.21×.51).
2. `src/sky-biome.js`: arboledas `GR` encogidas para quedar dentro de la elipse de la isla.
3. `src/village-barrios.js`: casa de troncos del Bosque desplazada (−150,410 → −150,428).
4. `tools/r3d/coast_check.py`: umbral de tierra acorde al mundo de 4 columnas.
5. **Documentación:** `AGENTS.md` pasó de **335 KB a ~81 KB** (93 lotes → 6; el resto archivado en `docs/HISTORIAL.md`); hoja de ruta reescrita en `docs/HOJA_DE_RUTA.md`; reglas consolidadas en `docs/REGLAS_CREACION.md`; nueva herramienta `tools/rules_check.py`.

## 3 · Hallazgos abiertos (NO corregidos; con dueño de la tarea)
| Hallazgo | Dónde se resuelve |
|---|---|
| Decals 3D de combate (`ShaderMaterial`) sin probar con el reflejo del agua activo (antecedente: un `ShaderMaterial` rompió esa pasada en DROPS-3D) | `HOJA_DE_RUTA` T1.1 |
| `src/abilities.js` (prototipo de talentos) existe pero **no se carga** en `index.html` | T2.2 (reutilizar o borrar) |
| Cobertura por bioma: música `DEF` 7/10 (faltan Páramo, Desierto, Costa), cultura de aldeanos 9/10 (el Cielo usa `EXILES`), interiores `PALS` 6/10 (6–8 usan `IKB`) | Fases de esos biomas (T3) |
| Pantano: 9 edificios sobre calle/plaza | Fase 8 |
| `pow()` sin acotar en shaders (lista de `rules_check`): revisados a mano, todos con base ≥ 0 (pesos normalizados, colores, `max()` previo) | — (sin acción) |
| `Math.random` solo queda en `blood3d.js` (efectos efímeros, a propósito) y 1 comentario en `style*.js/paint.js` | — |
| Rutas citadas en `AGENTS.md` que ya no existen: `facades.js, ground.js, interior-art.js, light.js, water-gl.js, tools/build_single.py, creature_sheet.py, mobs_check.py, perf_ablation.py, terrain_check.py` (marcadas BORRADO/OBSOLETO en su contexto); `tools/econ_model.py` aún NO existe (Fase 29) | informativo |
| Herramientas 2D heredadas candidatas a `tools/_obsoletas_2d/`: `iso_check, cliff_check, heavy_check, splat_check, props_check, creator_check` | T1.4 |
| Nada de lo reciente (combate, tutorial) está verificado a mano ni en la GPU/móvil del dueño | T1.1–T1.2, T1.6 |

## 4 · Dónde vive cada regla (resumen)
| Tipo de regla | Archivo |
|---|---|
| Producto / decisiones del dueño | `docs/REGLAS_CREACION.md` §1 (+ `AGENTS.md` «Decisiones ya tomadas») |
| Modelado (sentido, props, personajes, shaders) | `REGLAS_CREACION.md` §2–5 · guías `GUIA_3D_PORTEO.md`, `GUIA_PERSONAJES_3D.md` |
| Mundo y datos por bioma | `REGLAS_CREACION.md` §6 · `PLAN_MUNDO_ABIERTO.md`, `PLAN_POSTPORTEO.md` |
| HUD | `REGLAS_CREACION.md` §7 · `PLAN_HUD_SUSURRO.md` §0 |
| Combate | `REGLAS_CREACION.md` §8 · `combatlab.js` (`FEEL`) |
| Lore y voz | `docs/LORE.md`, `GUION_TUTORIAL.md`, `PLAN_ISLA_CIELO.md` |
| Orden y pendientes | `docs/HOJA_DE_RUTA.md` |
| Historia de cambios | `docs/HISTORIAL.md` |
| Comprobación automática | `tools/rules_check.py` + `tools/r3d/*` (tabla en `REGLAS_CREACION.md` §10) |

**Conclusión:** las reglas de creación se mantienen y ahora están en UN sitio; el código las cumple salvo los 4 fallos ya corregidos y los hallazgos abiertos de §3. Lo no verificable aquí (tacto de combate, fps en GPU/móvil, audio, táctil) sigue pendiente del dueño.
