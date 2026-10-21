# Demo del HUD «Susurro» — guía para el agente

**Qué es:** la referencia visual APROBADA del HUD (HTML autocontenido, interactivo). **No es código del juego**: es la especificación viva. El plan de ejecución está en `docs/PLAN_HUD_SUSURRO.md`.

## Archivos
| Archivo | Para qué |
|---|---|
| `hud-susurro.html` | Demo lista para abrir (three r128 desde cdnjs + fondos en base64). Se GENERA; no editar a mano. |
| `hud-susurro.src.html` | **FUENTE editable** (placeholders `{{BG_DIA}}`, `{{BG_ATA}}`, `{{BG_NOC}}`). |
| `hud_bg/` | 3 capturas reales del juego (día, atardecer, noche) usadas de fondo. |
| `hud-opciones.html` | Primera demo con las 5 direcciones (A–E). SOLO histórico: D = Susurro fue la elegida. |
| `tools/r3d/hud_demo/build.py` | Genera `hud-susurro.html` y una copia de pruebas con el three local (r170). |
| `tools/r3d/hud_demo/check.py` | Prueba: rejilla estable al hover, 0 errores JS, capturas en `/tmp/hud_demo_test`. |

Flujo: editar `hud-susurro.src.html` → `python3 -I tools/r3d/hud_demo/check.py` → mirar las capturas.

## Cómo está organizado `hud-susurro.src.html`
- **CSS** (comentado con un índice al inicio): 1 base/escenario · 2 misión, minimapa, registro · 3 viñeta · 4 rueda de resistencia · 5 menú lateral · 6 panel de cristal (mochila, opciones) · 7 marcos jugador/objetivo + barras · 8 buffs · 9 avisos de XP · 10 barra de 6 habilidades (RESERVADA, oculta) · 11 página de la demo (no se porta).
- **Todo en `em`**: `.hud{font-size:1.25cqw}` escala la interfaz con el ancho del escenario (contenedor `container-type:inline-size`). En el juego real hay que decidir la unidad base equivalente.
- **JS** (secciones con banner `// ═════`): minimapa de muestra · OBJETOS (modelos 3D de muestra `MOD` → `window.__icon(modelo, opciones, colorRareza, px)` → PNG; hover vivo con `__hover/__unhover`) · ESTADO Y BARRAS (`S` simula vida/maná/resistencia; `paint()` lo vuelca al DOM con `data-b` y `data-n`) · RETRATOS y BARRA DE HABILIDADES (reservada) · BUFFS, XP, OPCIONES · ANIMACIÓN DE BARRAS (`barFx`, canvas `.fxc`, un solo rAF) · notas.
- **Atributos de datos**: `data-b="hp|hpg|mp|mpg|th|thg"` + `data-m="w"` = relleno (ancho en %); `data-n="hp|hpm|mp"` = texto; `data-r="c|u|r|e|l"` = rareza de la celda (define `--rc`); `data-time` y `data-guide` del escenario.

## Qué se porta y qué NO
- **Se porta:** todo lo de las secciones 2–9 del CSS y su comportamiento.
- **Es de muestra (sustituir):** los modelos `MOD` (en el juego salen de `weapons3d/armor3d/props3d`), el minimapa dibujado a mano, los datos `IT` de la mochila, `BF` (buffs), `SK` (skills del aviso de XP), el simulador de la barra «Probar».
- **No se porta:** el selector «Equipo/Hora», los botones «Probar», las notas y la hoja de la página (sección 11).
- **Reservado:** barra de 6 habilidades (`.ab`, `AB`, `useAb`, `buildSlots`): oculta hasta que exista el combate nuevo (fase H11).

## Reglas de diseño (no negociables)
Cristal + trazos dorados finos · barras redondeadas, vida SIEMPRE verde, enemigo rojo, maná azul arcano · animación suave, sin destellos blancos ni burbujas · objetos en «pintura suave pulida» (rareza = contorno + halo; metales planos) · nada que cambie en hover puede mover la rejilla · Guardar/Cargar solo en Opciones · texto en español · fuentes Cinzel + Spectral.

## Trampas conocidas
- `g.add(mesh(...)).rotation/scale` afecta al GRUPO, no al mesh: usa una variable intermedia.
- `envMapIntensity` solo se respeta con `material.envMap` explícito (three r170); la demo lo asigna por material.
- Las luces necesitan el factor `PI` en r155+ (`(REVISION>=155?Math.PI:1)`) para igualar r128.
- Un icono con `width:104%` DEBE ir `position:absolute` o altera las columnas de la rejilla al hover.
- SwiftShader sirve para capturas, NO para fps.

## Historial
Las 16 rondas de decisiones están en `AGENTS.md` (lotes R3D-HUD-SUSURRO-2/-3). Si dos rondas se contradicen, **gana la última** y, sobre todo, gana este README + el plan. Lo descartado: HUD «Largo vivo» medieval, medallones, marco de hierro/oro, aro dorado en retratos, «Sprite 3D», barra roja del jugador, barra de habilidades visible, micro-menú redondo, destellos/burbujas en barras.
