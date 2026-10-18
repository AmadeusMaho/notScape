# Referencias visuales de NotScape (`docs/style-reference/`)

Actualizado el 17 oct 2026. **Qué manda:** 2D → `docs/GUIA_ESTILO_ISOMETRICO.md`; 3D → `docs/GUIA_3D_PORTEO.md` y `docs/GUIA_PERSONAJES_3D.md`. Estos archivos son solo referencia visual; ábrelos con un servidor local (`python3 -m http.server` desde la raíz del repo), los HTML 3D usan `vendor/three` por ruta relativa.

## 3D (vigente)
- `r3d/referencia-3d.html` — escena de referencia del estilo «diorama pintado» (noche/atardecer/día: `?t=noche|atardecer|dia`, `?still`). **Manda en el 3D.** Capturas `r3d/ref3d_*.jpg`.
- `r3d/demo-diorama.html` — **VIGENTE (17 oct 2026, aprobada):** el reparto de 8 personajes diorama por código (`src/r3d/mini3d.js`), bajo el óleo del juego. Parámetros `?t= ?z= ?solo= ?noink ?still`. Es lo que usa el juego para el héroe.
- `r3d/demo-figuras.html` — DESCARTADA: figuras adultas facetadas por código (`figure3d.js`).
- `r3d/demo-modelos.html` — (RECHAZADA, solo histórico) **PROPUESTA (17 oct 2026, pendiente del dueño):** personajes glTF hechos a mano y modulares (KayKit, CC0) bajo el grado óleo del juego, junto al héroe actual por código. Controles de hora, óleo, material, contorno, animaciones y piezas/variantes de color (skins). `?t=`, `?still`, `?anim=`, `?zoom=juego`, `?mat=kaykit`, `?oil=`.
- `demo-nrftw.html` — **ESTILO OBJETIVO**: la misma escena con el grado «óleo oscuro» tipo *No Rest for the Wicked* (botón para compararlo con el estilo actual). Receta en `GUIA_3D_PORTEO.md` §4.9. Su intensidad se puede bajar por legibilidad (por decidir con el dueño).
- `r3d/heroe-3d.html` — visor del héroe (poses, equipo, ropa con física). `r3d/disenos-personaje.html` — hoja de diseños de personaje aprobados (`?set=heroe|pnj`).
- `r3d/*.jpg` — capturas de cada lote R3D (terreno, props, árboles, luz, personajes).

## 2D (vigente mientras exista el modo 2D)
- `notscape-diorama.html` — demo isométrica: referencia de **colores y técnica de pincel** (sus formas **no** están aprobadas).
- `notscape-cenital.html` — demo cenital: referencia de **composición, proporciones y pincel**; sus formas redondeadas **ya no son el objetivo** (el dueño prefiere poligonales).
- `demo_diorama.png`, `demo_cenital.png` — capturas de ambas demos (1100×760).
- `prueba_formas_v3.png` / `.html` — **formas APROBADAS** (12 oct 2026, noche): rígidos facetados + orgánicos triangulados, 8 especies de árbol como datos, personaje esbelto en 8 tiers, goblin. (`?smooth=0.6` para probar degradado.) Las pruebas v1 y v2 ya no están en el repo; no las busques.
- `paleta_pastel.png` — tiers y árboles con su paleta pastel (aprobada el 11 oct 2026). **Es la paleta del 2D**: en 3D el óleo la modifica (ver nota en `GUIA_ESTILO_ISOMETRICO.md` §3 y `GUIA_3D_PORTEO.md` §4.9).

## Cómo usarlo
Mira primero las capturas. No hay «primer entregable `INVENTARIO.md`» (se eliminó en oct 2026): el estado real está en `docs/CONTEXTO.md` y `AGENTS.md`.
