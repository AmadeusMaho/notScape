# NotScape — HOJA DE RUTA REORDENADA (21 oct 2026) · FUENTE ÚNICA DEL ORDEN

> Sustituye a las tablas «HOJA DE RUTA v2» y «HOJA DE RUTA: lo que FALTA» de `AGENTS.md` (que ahora solo apuntan aquí). Los números «Fase N» / alias Qnn son los de siempre: el detalle de cada fase sigue en `docs/PLAN_POSTPORTEO.md` (`grep -n "Fase N"`). **Lo marcado ★ lo decide el dueño**; las decisiones ya tomadas (v2, 20 oct) se respetan y se citan donde aplican.
> Criterio de orden (las fases se numeran 1→16; los «Fase N» antiguos —8 Pantano, 22 Herbolaria…— se citan entre paréntesis): **(1) nada se hace dos veces** (se construye en 3D y con la mecánica de su bioma); **(2) cada tramo deja el juego jugable**; **(3) cimientos antes de lo que los usa**; **(4) un bioma por vez, completo**; **(5) el rebalanceo global y los precios, al final**, con todo el contenido ya puesto.

> **REGLA DEL DUEÑO (22 oct 2026): CADA ENTREGA ACTUALIZA ESTE ARCHIVO** (sección «Registro de avance» de abajo + la fila de la fase que toques) **y además su lote en `AGENTS.md`**, para que cualquier agente sepa en segundos qué se hizo y qué falta. Una entrega que no actualiza la hoja de ruta no está terminada.

## REGISTRO DE AVANCE (lo último hecho primero; una línea por entrega, con el lote de AGENTS.md)
- **22 oct 2026 · ARRASTRAR-2 (Fase 2/UI):** equipo arrastrable (mochila flotante junto a Personaje), fantasma = solo el objeto, banco apila donde va, objetos de misión intirables/invendibles (`QITEM`), base de 16 ranuras. Pendiente: probar a mano y en táctil; `#bw` en pantallas pequeñas; añadir a `QITEM` los objetos de misión futuros.
- **22 oct 2026 · BANCO/BOLSAS/ARRASTRAR + PANEL SKILLS + PUNTERÍA EN COMBATE · lote ARRASTRAR-BANCO-BOLSAS:** `src/dragdrop.js` (`DRAG`, fantasma suave), banco en cuadrícula sin «Depositar todo» (arrastrar o Mayús+clic), tirar al suelo arrastrando fuera, inventario base 12 + 4 ranuras de mochila (`BAGS`, `S.bags`), panel de Habilidades nuevo sin emojis, línea de puntería solo en combate. **Pendiente:** la Sastrería (Fase 7) debe fabricar las mochilas (`bag_*`); equilibrar los tamaños; arrastrar también desde/hacia el equipo; táctil sin probar.
- **22 oct 2026 · ESTADOS ALTERADOS v1 + OPCIONES LIMPIAS (Fase 2) · lote ESTADOS-ALTERADOS-1:** motor único `src/status.js` (`STS`) para jugador y enemigos con 11 estados (sangrado, veneno, quemadura, ralentización, congelación, vulnerable, debilitar, raíces, ceguera, escudo, furia), iconos en el HUD y fuentes iniciales (`ONHIT`, bola de fuego, procs). Opciones: sin deslizadores de óleo/viento/nubes/inclinación, sin emojis, ordenadas. **Siguiente:** estados ELEMENTALES (rayo, ácido, sombra, luz…), más fuentes (armas, pociones, hechizos, habilidades) y mostrar estados en el nameplate del enemigo.
- **22 oct 2026 · CIERRE DE LO ABIERTO (Fase 1) · lote CIERRE-ABIERTO-1:** tirón de los rayos (llamaradas/brasas precompiladas + rayos sin `filter` por trazo), botones del 2D fuera de Opciones (Correr, Cursor), aviso de Mayús por la cola de ayudas, anti-solape de ayudas (`ctxAvoid`), móvil arranca en calidad Baja. Falta medir en el móvil real; estados alterados propuestos al dueño (Fase 2), sin implementar.
- **22 oct 2026 · Fix de la playa:** chunks precargados, la pluma a Orsen avanza (el `then` de la tienda ya no lo pisa), animación de levantarse, fundido final más temprano y largo. Lote FIX-PLAYA.
- **22 oct 2026 · Campamentos:** guardias y capitán reaparecen a los 4 min (y nunca delante de ti); abrir el cofre = casteo de 5 s. Nota en AGENTS.md.
- **22 oct 2026 · Música de escena + rayos + fuego del cielo:** `wakeup` en la playa con Ru, `all_i_had_to_do` (desde 0:25) durante el cielo en llamas; rayos del cielo con ramas y parpadeo; anillo de llamaradas alrededor de la isla. Lote MUSICA-DE-ESCENA. Sin oír/probar a mano.
- **22 oct 2026 · Orden corregido:** el «Cien años.» va tras HUIR (fundido a negro → texto → playa), no al matar a Gabriel. Nota en AGENTS.md.
- **22 oct 2026 · La playa: despertar tras Gabriel (Fase 1.2):** cinemática dormido/Ru, ropa interior, cabaña+baúl, cadena nueva «Cien años» (6 pasos) que sustituye al arranque de troncos/menas; traspaso provisional a `GOALS[4]`. **El dueño rehará TODAS las misiones de progresión** (pendiente de Fase 3). Lote PLAYA-DESPERTAR.
- **22 oct 2026 · Números de daño más satisfactorios:** pop con rebote, arco, tamaño según daño; críticos con temblor, bamboleo y destellos. Nota en AGENTS.md.
- **22 oct 2026 · Editor de diálogos de PNJ** (`tools/dialogos/`, guarda en `data/dialogos.json`; ~90 PNJ + 5 misiones del tutorial). Lote EDITOR-DE-DIALOGOS.
- **22 oct 2026 · Arcos y bastones a dos manos:** no admiten escudo (equiparlos lo guarda; el escudo se rechaza con ellos). Incluye mandobles y ballestas. Nota en AGENTS.md.
- **22 oct 2026 · Localización planeada para el final (Fase 17):** ver abajo; los textos siguen en español.
- **22 oct 2026 · “Fallo / Esquiva / Absorbido” en vez de 0** (estilo WoW, con nuestra UI). Nota en AGENTS.md.
- **22 oct 2026 · Ruedita de CD en el cursor real** (sin mirilla; distancia de rango también con el cursor normal). Nota en AGENTS.md.
- **22 oct 2026 · Sensación de golpe (Fase 2·a):** el enemigo se empuja/inclina al recibir golpes (más fuerte en pesados/críticos) y se tambalea aturdido; partículas por material; sonido por capas; puñetazo de cámara y retroceso del héroe. Sin estela. Lote SENSACION-DE-GOLPE.
- **22 oct 2026 · Ruedita de enfriamiento en la mira** (todas las armas; destello al estar lista; naranja al cargar). Nota en AGENTS.md.
- **22 oct 2026 · Puntería de rango:** el tiro de arco/bola va al enemigo que hay bajo el cursor (selección en pantalla); si no, hacia el cursor con imán. Nota en AGENTS.md.
- **22 oct 2026 · Imán de proyectiles** (flechas/bola de fuego): rayo más ancho con la distancia y vuelo hacia el centro del enemigo. Nota en AGENTS.md.
- **22 oct 2026 · Tiempos entre golpes más cortos** (daga .7, espada 1, puños 1,1, arco/bastón 1,4, mandoble 2; bola de fuego 1,2 s) con el DPS conservado vía `SWDMG`. Nota en AGENTS.md. Sin probar a mano.
- **22 oct 2026 · Combate fluido (Fase 2·a):** barra de **stagger** + aturdimiento (×1,5, primer golpe seguro) · **contraataque** tras parada perfecta (×2) · **imán** de dirección del golpe · **paso atrás** de la esquiva · **retícula de distancia** para arco/magia · textos flotantes (parada/esquiva perfecta, **mitigado**, aturdido) y reembolso visible de resistencia · parada perfecta con estallido dorado y campanilla · arreglo de las chispas de golpe (volvían azules). Lote STAGGER-CONTRAATAQUE-IMAN-RETICULA. Sin probar a mano.
- **22 oct 2026 · Ajuste de combate:** spamear clic con el ataque en enfriamiento ya no ralentiza al héroe (el clic se ignora hasta que está listo). Nota en AGENTS.md.
- **22 oct 2026 · Combate y tutorial del Cielo (Fases 1.2 y 2):** Gabriel jefe completo (arena de mármol FUERA de la isla sobre camino de rocas, intro cinemática estilo Dark Souls, espada celestial, casco, 30 de vida, ataques con brazo alzado y combo, barra de jefe, música desde la intro, punto de guardado) · **bloqueo** (clic derecho/Q; parada perfecta) y **esquiva perfecta** con fantasma · **objetivo único** de ataque (solo mandoble cargado en área) y **ataques cargados gastan resistencia** · **apuntado libre** con arco y magia · **barra de habilidades** (bajo la vida; 1 = seleccionar) con **bola de fuego CELESTE** · tutorial de la Palestra con arco, bastón y escudo prestados y **corderos de nube** neutrales · bordes del terreno redondeados · controles de ratón nuevos (derecho bloquea, medio gira). Lotes: GABRIEL-ARENA-DARKSOULS, BLOQUEO-PERFECT-DODGE-ESPADA-CELESTIAL, CONTROLES-RATON, GABRIEL-AJUSTES-TUTORIAL, TUTORIAL-ARMAS-CORDEROS-BARRA-HABILIDADES, SELECCION-HABILIDAD, FIX-TOOLTIP-HABILIDADES. **Lecciones y decisiones: `docs/REGLAS_CREACION.md` §11.** Sin probar a mano (ver §11 «Pendientes»).
- **21 oct 2026 · Oficios (Fase 3·c, adelantada):** rueda de tala/minería, botín 3D, forja con minijuego de ritmo, pesca simple, recetas entrelazadas v1, sin offline (ver «Hecho» en la Fase 3).

## 0 · Dónde estamos (verificado en la auditoría del 21 oct, ver `docs/AUDITORIA_2026-10-21.md`)
✅ **HECHO:** porteo 3D (F0–F4, F3d/F3f), Pradera y Bosque oscuros, mundo ×2 continente 3×3 + frontera abierta + barrios, mapa con niebla (47), agua D con física, sangre, **HUD Susurro** (marco, menús, mochila, personaje, tienda/banco, tablón por bioma, nameplates, vida con estado), iconos 3D (H3 pipeline), drops 3D, **Fase 17–18 (3D por defecto, 2D retirado)**, interiores 3D (A2, primera versión), luces dinámicas, moneda cobre/plata/oro (28), PNJ por bioma ×9 (25 etapa 1), tiendas y mercado simulado, motor de bioma (B3), cinemáticas (CINE-0..4), **isla del Cielo + tutorial de 35 pasos + Gabriel (pelea completa en su arena)**, combate activo (clic/E, carga, combo, dash quickstep, avisos por ojos, decals 3D, laboratorio `FEEL`), ambiente y pisadas por superficie.
🟡 **HECHO SIN VERIFICAR a mano / en GPU:** todo lo de combate (tacto), tutorial de la isla jugando de verdad, fps en la GPU y el móvil del dueño, audio (oído), táctil real.
⏳ **EN CURSO:** tutorial de la isla (lista en Fase 1), B5 combate base.

## ÍNDICE: LAS FASES EN ORDEN (1 → 16)
| Fase | Nombre | Qué contiene (fases antiguas entre paréntesis) | Sale de la fase cuando… |
|---|---|---|---|
| **SIEMPRE** | Higiene | `rules_check.py`, lotes cortos, medir en GPU/móvil | — |
| **1** | Cerrar lo abierto | probar combate, completar isla, cinemática, deuda visual, HUD, rendimiento | el dueño juega isla + combate sin sorpresas |
| **2** | Combate base | B5: estamina, estados (23), interrupciones (35), curación (34), táctil (33) · recursos (21a) · motor de habilidades + barra de 6 (38/H11) · jefes (26) | pelear contra un jefe es completo y legible |
| **3** | Maestros, economía y **OFICIOS** (⏳ ADELANTADA PARCIALMENTE el 21 oct: rueda de tala/minería, botín 3D, caída/rotura de recursos, dorados, pesca simple, recetas entrelazadas v1, sin offline, `craft_balance.py`; falta: minijuegos de crafteo, cocina, XP, maestros, economía) | B4 maestros (ID3) · moneda de muerte y compra/venta (29) · `econ_model` v0 · **rework de oficios: recetas entrelazadas + recolección ACTIVA (sin auto-picar) + sin progreso offline** | la reputación vieja ya no existe; hay sumideros de dinero; todo oficio pide y da algo a otros; ya no se pica solo |
| **4** | **Bosque** (1.er bioma completo) | plantilla de bioma + Herbolaria (22) | cobertura de bioma completa |
| **5** | **Pantano** (Fase 8 antigua) | plantilla + Alquimia, Botica (20) | idem |
| **6** | **PUERTA del prototipo ★** | menú de Especialización (37) · Asesino (39–41) · prueba del dueño (42) | el dueño decide si se escalan las subclases |
| **7** | **Cumbres** (9) | plantilla + Sastrería (19) | idem |
| **8** | **Oriental + capital** (10, 10b) | plantilla + Encantamiento (24) + carreteras (49c/d) | idem |
| **9** | **Volcán** (11) | plantilla + Taller arcano (20) + muralla (49c) | idem |
| **10** | **Desierto** (50a) | plantilla (arena) + estatuas de viaje y monturas (45) | idem |
| **11** | **Costa** (50c/51) | plantilla (+ barco opcional) | idem |
| **12** | **Páramo** (50b) | plantilla | idem |
| **13** | Endgame | Infierno (52) · Cielo endgame (53) · tiers A–B (50d) | los 9 biomas + 2 planos jugables |
| **14** | Subclases | Magia: escuelas y árbol (21b) · S1–S12 una por prompt | cada subclase pasa su hoja de verificación |
| **15** | Rebalanceo y precios ★ | rebalanceo global (36) · precios S13 | `meas_progresion.py` y `econ_model.py` en rango |
| **16** | **Online** | **16a prueba de 2–4 jugadores (presencia)** · 16b co-op con anfitrión autoritativo · 16c mercado online (S14 local → S15 servidor) | proyecto aparte; 16a se puede adelantar tras la Fase 3 (ver nota) |
| **17** | **Localización (i18n) — al FINAL, tras todo el contenido** (decisión del dueño, 22 oct 2026) | extraer los textos del juego a tablas por idioma (hoy van sueltos en español dentro del código) · inglés primero: palabras de combate estilo WoW **Miss / Dodge / Parry / Absorb** en vez de Fallo / Esquiva / Parada / Absorbido · luego más idiomas | todos los textos salen de tablas y se puede cambiar de idioma sin tocar código |

> Los **sistemas de fondo (Bloque D)** se estrenan en el bioma indicado (propuesta ★; por defecto «a demanda», como decidió el dueño). Si el dueño cambia el primer bioma, se intercambian las fases 4–5 con sus sistemas.

## SIEMPRE · HIGIENE PERMANENTE (cada entrega)
`python tools/rules_check.py` + las herramientas de tu área (`docs/REGLAS_CREACION.md` §10); lote corto en `AGENTS.md`; lotes viejos → `docs/HISTORIAL.md`. Medir fps/memoria en la GPU y el móvil del dueño al cerrar cada fase (F4).

## FASE 1 · CERRAR LO ABIERTO
| # | Qué | Origen | Notas |
|---|---|---|---|
| 1.1 | **Probar a mano el combate nuevo** (clic/carga/combo/dash/avisos por ojos/decal/nameplate/vida con estado) y ajustar `FEEL`, `bigFoe` (umbral nivel 40 provisional), alcance y velocidad | COMBATE-ACTIVO, FEEL-1/2 | Tacto = solo el dueño. Probar el decal con el reflejo del agua activo (no verificado) |
| 1.2 | **Isla del Cielo — lo que falta del plan** (`PLAN_ISLA_CIELO.md` §6): kit del exiliado y re-entrega anti-atasco; recursos que se reponen en 5 s; bancos de nubes (compuertas) + paneos de cámara; carrera «Escapa» con peligros; pistas visuales de los exiliados (`secret`); cangrejos de nube/maniquíes; arranque con el editor de personaje y «saltar tutorial»; icono del menú que late; revisar música y nivel del audio | ISLA-5/9/10 | Se juega de principio a fin en simulación; falta jugarla de verdad |
| 1.3 | **Cinemática:** visión de Nul'ru (líneas ★ por aprobar), objeto «Fragmento del tiempo», oír el audio | CINE-3/4 | Canon: `docs/LORE.md` §1b |
| 1.4 | **Deuda visual/técnica heredada:** minimapa del Cielo en negro; montañas de la isla color arena; mena estilo roca sin ver en pantalla; props del Cielo sin hoja de contacto; iglesias troncos/palafito/stave PEND en `roof_clip`; `props_check` (herencia 2D) | ISLA-2g/3, MINERIA-SUAVE | Hecho en la auditoría: `NAT_FOOT.mena`, arboledas dentro de la elipse, solape Bosque |
| 1.5 | **HUD restante:** H9 táctil completo (hojas inferiores, 844×390), Fase 13 menús restantes (habilidades, misiones, magia → solo aviso mientras `MAGIC_ON=false`), Fase 14 resto (editor/carga ya tienen pasada), H3-b cobertura 3D de lo que sigue en 2D + H3-c monedas | R3D-HUD-* | H11 (barra de 6) sigue BLOQUEADA hasta Fase 2 |
| 1.6 | **Rendimiento:** medir en la GPU/móvil del dueño (F4); si falta: fusionar/LOD de recursos y props (53 %/21 % de los triángulos), LOD del adoquín, reflejo a menor resolución; verificar `warmShaders` y los +10 chunks | R3D-OPT-1, FREEZE-SHADERS, CHUNKS | SwiftShader no sirve |

## FASES 2 y 3 · CIMIENTOS DE JUEGO
| # | Fase | Qué | Dep. |
|---|---|---|---|
| Fase 2 · a | **B5 · Combate base** (✅ 22 oct: bloqueo, parada/esquiva perfectas, objetivo único, cargados con coste, stagger/aturdimiento y contraataque; faltan estados, interrupciones, curación, táctil): 31 estamina/Energía unificada + barra (hoy `S.sta`) · **23 estados alterados** (motor + iconos; hoy solo `P.dot`) · **35 interrupciones/reacciones** · **34 curación** (pociones con CD 30 s compartido, vendas, comida/banquete) · **33 táctil de combate** | 1.1 | 23 antes que 34 |
| Fase 2 · b | (🟡 22 oct: barra de habilidades con 1 casilla y bola celeste ya existe; faltan teclas 2–6 y el motor) **21a · Recursos** (Energía como stat; Maná queda con la magia) y **38 · motor de habilidades + H11 barra de 6** (solo lo que pida el primer bioma) | Fase 2 · a | PLAN F0 stats a escala pequeña |
| Fase 3 · a | **B4 · ID3 Maestros estilo Slayer** (sustituyen la reputación de `quests.js`; guardados sin migrar) + «habilidad del maestro» (nombre TBD ★) | — | Reutiliza el motor de pasos de `isla.js` |
| Fase 3 · b | **29 · Moneda de muerte + compra/venta** y `tools/econ_model.py` v0 (P0b); los PRECIOS definitivos esperan a la Fase 15 | 28 ✅ | |
| Fase 2 · c | (🟡 22 oct: formato de jefe Dark Souls definido y hecho en Gabriel; falta aplicarlo a b0–b5) **26 · Jefes: ataques especiales y sonidos** (sobre las telegrafías y el decal 3D) | Fase 2 · a | |

### FASE 3 · c — REWORK DE OFICIOS (pedido del dueño, 21 oct 2026) · hay que hacerlo ANTES de los biomas (sus recetas dependen de esto)
**Estado:** NO hecho (la «regla general de crafteo» existe como regla, pero las recetas siguen siendo de un solo oficio). Tres cambios:
1. **Recetas entrelazadas.** Cada oficio pide materiales de OTROS oficios (y de sus skills) donde tenga sentido; a más tier, más categorías (+1–2 raros de monstruos/fauna), **tope 4–5 componentes distintos**. Oficios actuales (`SK`): Tala (wc) · Minería (mi) · Pesca (fi) · Cocina (co) · Herrería (sm) · Artesanía (cr) · Escultor (es) · Inscripción (ins) + combate/magia/oración. **Propuesta de matriz (a validar con el dueño ★):**
   | Oficio | Pide de… | Ejemplo |
   |---|---|---|
   | Herrería | Minería (mena, carbón) + Tala (mango/carbón vegetal) + Artesanía (cuero para empuñaduras/correas) + raro de monstruo a alto tier | espada de acero = barras + mango de madera + correa de cuero |
   | Artesanía | Caza/ganadería (cuero, lana) + Minería (remaches) + Herbolaria (tintes) | armadura de cuero tintada |
   | Escultor | Tala (madera) + Minería (piedra/gemas) + Herrería (herramientas) | arco, báculo, escudo de madera con herraje |
   | Cocina | Pesca + ganadería/caza + Herbolaria (especias) + Tala (leña) | banquete = pescado + carne + hierba + leña |
   | Inscripción/Magia | Artesanía (papel/tela) + Alquimia (tinta) + Minería (polvo de gema) | pergamino/runa |
   | Herbolaria/Alquimia (nuevas) | Tala/campo (plantas) + Pesca (sal/escamas) + Minería (minerales) | pociones |
   | Tala/Minería/Pesca | herramienta de Herrería/Escultor de su tier (ya existe) + **cebo/arma/sello de otros oficios** a tier alto | caña con anzuelo forjado |
   Las skills también se entrelazan: el nivel de un oficio **desbloquea o mejora** recetas de otro (p. ej. calidad de cuero según Artesanía; Herrería exige Minería ≥ N para ciertas aleaciones). Hoja de cálculo de recetas en `tools/` (como `meas_progresion.py`) para comprobar que ningún objeto pide >5 componentes y que no hay ciclos imposibles.
2. **Recolección ACTIVA: RUEDA solo para Tala y Minería (decidido 21 oct; ya en el juego) + MINIJUEGOS DISTINTOS por oficio:** Pesca = **YA HECHO** (visual: pez 3D que tira, retrocedes en dirección contraria, lo cansas y lo recoges). **Crafteo: pendiente, un minijuego distinto por oficio** (propuestas: Herrería = ritmo de martillo sobre el yunque con el metal al rojo (calor), Artesanía = coser/cortar siguiendo un patrón con el ratón, Escultor = tallar quitando trozos de un bloque, Inscripción = trazar runas, Cocina = punto de cocción con el fuego). Antes: «RUEDA estilo New World (Tala, Minería, Pesca y crafteo)» (aro pequeño, sin racha, golpes por herramienta rebalanceados, el árbol cae y la mena se rompe: lote PARTICULAS-3D…) (lote RUEDA-RECOLECCION-PROTO en `AGENTS.md`; falta afinar el tacto y extenderlo a Pesca/Cocina/Herrería/resto)** (sustituye a la barra de progreso actual y al bucle automático `A.ty==='g'`). Diseño propuesto a partir de lo que pidió («se sentía satisfactorio sacar recursos»):
   - **La rueda:** un anillo fino dorado sobre el recurso (o sobre el héroe, como la rueda de resistencia `S.sta` del HUD). Un marcador gira por el anillo y hay uno o dos **arcos de acierto** (más estrecho = crítico). **Cada golpe = una pulsación** (clic izquierdo o `E`) cuando el marcador está en el arco; en el arco → golpe bueno, en el centro → perfecto; fuera → golpe flojo (no castiga, solo rinde menos). Cada recurso pide N golpes buenos para agotarse (más a más tier).
   - **Lo adictivo (feedback):** el anillo «late» y se ilumina al acertar, **racha de perfectos** sube el tono del sonido y el tamaño del destello, astillas/chispas/escamas saltan del recurso (partículas 3D ya existentes), el recurso tiembla y se deshace por fases, al agotarlo **estalla el botín** que sale volando y cae (drops 3D). Sin texto: todo se lee por luz, sonido y movimiento.
   - **Por oficio:** Tala = golpe de hacha (arco más ancho, ritmo medio) · Minería = golpe más seco, arco más estrecho, veta que brilla · Pesca = tirón cuando pica (el flotador 3D ya existe) · Cocina = la rueda sobre el fuego (ya existe el minijuego `CK`: unificar) · Herrería = golpes rítmicos sobre el yunque. El nivel del oficio **ensancha el arco** y acelera el ritmo (la skill se siente); la herramienta de tier mayor da más golpes buenos por recurso.
   - **Reutiliza:** `swing/SWG` y la barra de swing del combate para el ritmo, `hud.js` `fx()` para dibujar el anillo (mismo lenguaje cristal+dorado), `spellfx3d.js`/`particles3d.js` para las partículas, `drops3d.js` para el botín, `FOOT.sfx` para el sonido.
   - **Reglas:** nada automático (si no pulsas, no pasa nada), nada que castigue, accesible en táctil (toque), y el modo «mantener» no existe. **Consecuencia:** los tiempos de progresión de `tools/meas_progresion.py` se calcularon con automatización → reequilibrar XP/recursos (primer ajuste aquí, pase fino en la Fase 15).
3. **Sin progreso offline** — ✅ **HECHO el 21 oct 2026:** retirados `offline()`, el hook de `visibilitychange` y la simulación al cargar (`game.js`). Al volver a la pestaña o recargar no se simula nada.

## FASES 4, 5, 7–12 · BIOMAS (UNO por vez, completo)
Orden: **1.º Bosque → 2.º Pantano (8) → 3.º Cumbres (9) → 4.º Oriental (10) + capital (10b) → 5.º Volcán (11) → 6.º Desierto (50a) → 7.º Costa (50c/51) → 8.º Páramo (50b)** ★ (el dueño puede cambiar el primero).
**Plantilla por bioma (todo en una pasada; prompts separados):**
1. Suelo y props oscuros de su civilización (`propsdark_<bioma>3d.js`, ANTICLIP, hoja de contacto, contrato de `REGLAS_CREACION.md` §3) + **su interior 3D** pulido + arreglo de los fallos del repaso A3 de ESE bioma.
2. **Mundo vivo:** clima/evento propio (`BIOME_RULES`), fauna con rutinas que SE CAZA y da materiales, noche propia, árboles `TREEPAL`, ambiente/música.
3. **Mecánicas únicas:** maestro (2.3), viaje, estilo de combate/animaciones.
4. **Oficios entrecruzados** (recetas del tier del bioma; tope 4–5 componentes) — aquí entran los sistemas de la tabla de abajo, **cada uno en el primer bioma que lo pide**.
5. **Fase 25 etapas 2–3** (casas repartidas con PNJ con misiones/questlines; carretas y viajeros) y **27 música** + jefe + capturas con el dueño.
6. Tabla de cobertura (`REGLAS_CREACION.md` §6) completa para ese bioma.

**Sistemas de fondo (Bloque D) asignados al bioma que los estrena — PROPUESTA ★ (por defecto «a demanda», como decidió el dueño):**
| Sistema | Primer bioma sugerido | Motivo |
|---|---|---|
| 22 Herbolaria y Alquimia | Bosque (plantas) → Pantano (alquimia) | materiales del bioma |
| 19 Sastrería (telar, vendas) | Cumbres (pieles/lana) | cuero/lana/tela |
| 20 Iglesia, Botica, Taller arcano | Pantano/Oriental | edificios por civilización |
| 24 Encantamiento | Oriental | necesita 22 y 23 hechos |
| 21b Magia: escuelas y árbol (hoy desactivada) | tras 2 biomas, con S2 | rework acordado: puntos de magia desbloquean nodos |
| 49c/49d cordilleras curvas, muralla, carreteras | Volcán / Oriental | las necesita su frontera |
| 45 Estatuas de viaje + monturas (camello) | Desierto | ancla de región |

## FASE 6 · HITO JUGABLE — PUERTA DEL PROTOTIPO ★ (tras 2 biomas: Bosque + Pantano)
**37** menú de Especialización (★ qué son los puntos de skill) → **39–41 Asesino** (10 habilidades + 2 mutaciones, cadena de misiones, animaciones/FX 3D; surge de una cultura) → **42 PUERTA:** el dueño juega; si engancha, T6. Si no, se replantea antes de gastar en subclases.

## FASE 13 · ENDGAME Y ABIERTO
**52 Infierno · 53 Cielo endgame** (reutiliza la isla en ruinas: ya hay motor de zona, mármol, montañas, Árbol del Mundo azul) · **50d + tiers A–B** · **51 Navegación naval = opcional**.

## FASE 14 · ESCALAR (subclases, una por prompt, casi todo datos)
S1 Arquero · S2 Piromántico (estrena Maná/escuelas) · S3 Reacciones e infusión elemental (Encantamiento) · S4 Ballestero · S5 Criomántico · S6 Tempestad · S7 Parry/Guardián · S8 Monje · S9 Verdugo · **S10–S12 las 3 oscuras ★ (nombres)**.

## FASE 15 · CIERRE ECONÓMICO Y DE BALANCE
**36 REBALANCEO GLOBAL** (`?balance=1`, `meas_progresion.py`: se hace UNA vez con todo el contenido) → **S13 precios de todos los objetos ★** (`econ_model.py`, tabla por rareza y utilidad; conversión a oficios entrecruzados).

## FASE 16 · ONLINE (16a presencia · 16b co-op · 16c servidor y mercado)
S14 mercado local simulado (ya hay una simulación en `shop.js`; la interfaz no cambia) → S15 servidor autoritativo (ver «ADVERTENCIA GRANDE» de P7).

### FASE 16 · ONLINE — ¿qué tan difícil sería una PRUEBA de 2–4 jugadores? (análisis del 21 oct 2026)
El juego es hoy **100 % cliente**: un héroe global (`P`), estado en `S` (localStorage), mundo y enemigos con `Math.random` (41 usos en `game.js`) y ~cientos de lugares que asumen «un solo jugador» (actores, IA de enemigos que persiguen a `P`, drops, XP, cinemáticas, tutorial de la isla, trucos). Tres niveles de ambición:
| Nivel | Qué es | Dificultad | Qué hace falta |
|---|---|---|---|
| **16a · Presencia** (recomendada como prueba) | Ver a los otros 2–4 héroes andar, su equipo, nombre y chat; cada uno juega su propio mundo (enemigos y recursos NO compartidos) | **Baja–media (≈ 2–4 días)** | Servidor relé mínimo (Node + `ws`, ~150 líneas: salas, difundir `x,y,dir,anim,look,nombre` a 10–15 Hz) · en el cliente: `Peers` que crea `MiniHero` por jugador remoto con interpolación (reutiliza `HeroAnim`/`herom3d.js`) y nameplate DOM · panel «Sala» (crear/unirse con código) · desactivarlo en la isla del tutorial. Hosting gratis (Render/Fly/Cloudflare Workers) o LAN |
| **16b · Co-op real** (anfitrión autoritativo) | Mismo mundo: enemigos, recursos, drops y jefes compartidos; uno de los jugadores es el «anfitrión» que simula | **Alta (semanas)** | Semilla de mundo compartida y **todo azar determinista** (`Math.random` → PRNG sembrado en mundo, enemigos, drops, reubicación de recursos) · sustituir `P` global por una lista de jugadores (IA de enemigos que elige objetivo, aggro/reparto de XP y drops, colisiones) · sincronizar instantáneas de `M`, `N`, `GD`, hitsplats y eventos de combate · reloj del mundo y clima compartidos · reconciliación de la mochila/guardado por jugador · modo sin trucos en sala. Los **decals 3D, sangre y partículas** se disparan por evento (ya están desacoplados) |
| **16c · Servidor autoritativo + mercado** | Servidor que simula el juego (anti-trampas, cuentas, mercado) | **Muy alta (proyecto aparte)** | Reescribir la lógica de `game.js` en módulos aislables (sin DOM/three), servidor Node, persistencia, cuentas; ver «ADVERTENCIA GRANDE» de P7 en `PLAN_POSTPORTEO.md` |
**Cuándo:** 16a es barata y **se puede adelantar justo después de la Fase 3** (antes de los biomas) para tener algo que enseñar y para ir descubriendo qué estado hay que hacer serializable; 16b conviene DESPUÉS de la Fase 2 (combate estable) y de que el mundo sea reproducible por semilla. Regla de arquitectura desde ya (para no hacerlo dos veces): **nada de `Math.random` en lógica nueva (usar un PRNG con semilla), y el estado de un jugador en un objeto (no en globales sueltas)**.

**En espera (sin fila, el dueño no lo ha decidido):** glifos de habilidad, «ligado al equiparse», «Elixir del olvido» en vez de «Tomo». **Reglas del dueño que valen para todo** (NO survival, Pradera casi virgen, lo ambiental nunca castiga, guardados sin migrar, oficios entrecruzados con tope 4–5): `docs/REGLAS_CREACION.md` §1. **Texto anterior de esta hoja** (tamaños S/M/L/XL y notas por fase): `docs/HISTORIAL.md`, «HOJA DE RUTA ANTERIOR».

## FASE 17 · LOCALIZACIÓN (PLANEADA, se hace al final; decisión del dueño 22 oct 2026)
- **Hoy** todo el texto del juego está en español, suelto en el código (`game.js`, `isla.js`, `villagers.js`, `hud.js`, `quests.js`, `combat.js`, datos de objetos `I`, diálogos…). **No traducir ni crear tablas todavía**: se hace cuando el contenido esté cerrado.
- **Plan:** (1) inventario con `grep` de literales visibles (`toast(`, `log(`, `fText(`, `banner(`, `txt:`, `lines:`, `desc:`, nombres en `I`/`MD`/`QUESTS`); (2) tabla `LANG.<idioma>.<clave>` + función `t('clave',{vars})`; (3) migrar por módulos, empezando por el combate; (4) inglés primero; (5) fuentes con soporte de caracteres (Cinzel/Spectral); (6) comprobar que las palabras de combate caben (hoy `fText` y los hitsplats).
- **Combate (22 oct 2026):** el dueño quiere en inglés las palabras estilo WoW **Miss / Dodge / Parry**; hoy son «Fallo / Esquiva / Absorbido» y «¡PARADA PERFECTA!» / «MITIGADO −N» (literales en game.js `hitM`/`monHit`/`windHit`/`guardHit`/`pdCheck`, combat.js `telUpd`).
- **Mientras tanto (regla):** escribe los textos nuevos en español como siempre, en frases cortas y sin concatenar a trozos (así se migran fácil); no repartas el mismo texto en varios sitios.

## SKILLS PLANEADAS (solo PLANIFICADAS, NO implementadas; recordatorio del dueño, 21 oct 2026)
Hoy `SK` tiene: Tala, Minería, Pesca, Cocina, Herrería, Artesanía, Escultor, Inscripción, Magia, Combate, Arquería, Oración. **Faltan dos skills ya diseñadas** (detalle completo en `docs/PLAN_POSTPORTEO.md` §1 «Agilidad → Alquimia y Herbolaria» y Fase 22/Q20; Agilidad ya se retiró):
- **Herbolaria (`he`, recolección):** nodos de hierbas en el mundo, **distintas por bioma** (≥1 hierba nueva por tier), herramienta propia (hoz/guadaña, 11 tiers, `TOOLS.he`) y props propios. **Por decisión del 21 oct su recolección NO usa la rueda (la rueda es solo tala/minería): lleva un minijuego propio** (propuesta: arrancar la hierba con cuidado — tirar despacio del tallo siguiendo su resistencia/raíz sin romperla; las raras exigen paciencia). Primer bioma que la estrena: Bosque (Fase 4).
- **Alquimia (`al`, procesado):** estación nueva «alambique/mesa de alquimia» (sala **Botica**), convierte hierbas (+ frascos de Artesanía) en **pociones** (vida, maná, energía, buffs `POT`, antídotos para estados alterados, resistencias). **Su crafteo también lleva un minijuego propio, no la rueda** (propuesta: destilar/mezclar vigilando temperatura y proporciones de los ingredientes). Estrena en Pantano (Fase 5); depende de Estados alterados (Fase 2) para los antídotos y de Curación (Fase 2) para el CD compartido de pociones.
- **Entrelazado con los demás oficios (regla de crafteo):** Cocina usa hierbas (especias), Inscripción usa tinta de Alquimia, Encantamiento usa polvo/esencias, Artesanía tiñe con hierbas, la Botica vende/compra pociones. Ambas entran en la matriz de oficios de la Fase 3·c cuando existan. Hacerlas «a 99 con la misma progresión que las demás» (medir con `meas_progresion.py` + `craft_balance.py`).
- Antes de implementarlas hay que decidir con el dueño: nombres definitivos de las hierbas por bioma, y los minijuegos de Herbolaria y Alquimia (propuestas arriba).

## Decisiones ★ abiertas (consolidadas)
Primer bioma · minijuegos de Herbolaria/Alquimia y de cada crafteo · ¿Bloque D a demanda (por defecto) o antes? · qué son los puntos de skill · nombre de la habilidad del maestro · nombres de las 3 subclases oscuras · tabla de precios · desbloqueo de atuendos (`OUTFIT_FREE`) · intensidad de óleo por defecto · líneas de la visión de Nul'ru · el «porqué» del giro de los arcángeles (`PLAN_ISLA_CIELO.md` §7) · umbral `bigFoe` (nivel) · si se quitan las chispas de impacto.

## Pendientes por sistema (rescatados de los lotes archivados; cada uno cita su lote en `docs/HISTORIAL.md`)
- **Combate:** sin sonidos propios de golpe/cast/aviso; sin indicador de enfriamiento del dash en el HUD ni botón táctil; arco/báculo sin estela; cuadrúpedos sin pose de aviso propia (solo ojos); jefes y Gabriel con animaciones genéricas; equilibrio (50 PV Gabriel, daños) provisional; golpes de área sin indicador especial; `knock` = 0 por decisión.
- **Magia:** `MAGIC_ON=false`; `SPL/autoSpell/fireSpell` inertes; el camino del Mago del tutorial de la Pradera puede pedir lanzar hechizos.
- **Isla/Cielo:** ver Fase 1.2; el aviso «Nivel recomendado 80+» aún sale; sin noche (a propósito); `CULT_OF.mundo=5`; olivos oscuros en sombra.
- **Rendimiento:** ver Fase 1.6; shaders del cielo (fbm 8 octavas ×40 000 vértices) por medir.
- **Audio:** pisadas y ambiente sin oír; deslizador de ambiente; `cave.*`, `block.water.*`, `speedwind` sin usar; música del resto de biomas (6–8 sin fila en `DEF`).
- **Interiores:** biomas 6–8 con paleta prestada (`IKB`); una sala por oficio y cultura.
- **Datos:** aldeas 6–8 sin spec de barrios; `abilities.js` (prototipo de oct 2026) NO está cargado en `index.html` — decidir en 2.2 si se reutiliza o se borra.
- **Herramientas:** `speed_check.py` falla en SwiftShader por fps (dt acotado); `iso_test.js` falla ~1/3 por 2 puntos aleatorios; `world_snapshot.py`, `walk_seam.py` obsoletas; candidatas a `tools/_obsoletas_2d/`: `iso_check, cliff_check, heavy_check, splat_check, props_check, creator_check`.
