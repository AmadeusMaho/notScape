# NotScape · NÚCLEO v4: semi-MMO cooperativo «conectado» — 2 nov 2026

> **Estado: DIRECCIÓN ELEGIDA y §13 CERRADA por el dueño el 2 nov 2026. Manda sobre los planes anteriores donde choquen; el orden vive ya en `docs/HOJA_DE_RUTA.md` (fases N0–N13).** Las marcas son: ✅ = decidido por el dueño · 🟡 = propuesta del agente pendiente de confirmar · ⏸ = aplazado. **La hoja de ruta ya está reorganizada con este documento (2 nov 2026).**
> Historia de versiones (mismo día): v1 colgaba del lore (descartada: diseñar sin lore) · v2 granja tipo Fields of Mistria (descartada: demasiado cozy) · v3 «MMO de un mundo» (base de esta) · **v4 = v3 + respuestas del dueño**. Reglas de creación, estilo gráfico y combate actual: no cambian.

## 1. La frase de venta ✅
**Un semi-MMO cooperativo en el que juegas a tu ritmo en tu propio mundo, mientras otros jugadores te ayudan como en Death Stranding o te invaden como en Dark Souls, según tu facción y tus actos. Tono: MMO chill, no cozy.**

- Cada jugador tiene **su mundo** (mismo mapa para todos, single player o co-op 2–4).
- Una **capa conectada asíncrona** lo une con los demás: estructuras de otros, ecos, clasificación, casa de subastas, guerra de facciones.
- **Hubs en tiempo real** solo en sitios concretos (capitales de facción), al estilo *Where Winds Meet*.
- **Sin conexión**, todo lo «de otros jugadores» lo hacen PNJ (§10).

## 2. Lo que se coge de cada MMO
| Juego | Qué entra | Estado |
|---|---|---|
| OSRS | skills a 99, Hiscores, registro de colección, diarios por zona, Slayer (maestros), modo Hierro | ✅ todo |
| WoW | logros ✅, monturas (ya existen) ✅, Senda/facción ✅ · mazmorras Mítica+ ⏸ (exigen diseñar mazmorras completas: mucho después) · transfiguración ⏸ (a pensar) | parcial |
| New World | **recolección con barra que se llena sola** ✅ (sustituye a la rueda interactiva), proyectos que hacen crecer tu base ✅, jefes de mundo con horario ✅ | ✅ |
| FF14 / Animal Crossing | aldea propia que mejoras con PNJ residentes ✅ | ✅ |
| BDO | doma y cría con genes (ya existe) ✅ | ✅ |
| Dofus | dos facciones enfrentadas (Bonta/Brakmar) = **Cielo e Infierno** ✅ | ✅ |
| Death Stranding / Dark Souls | ayudas y estructuras de otros, ecos, invasiones | ✅ |
| Where Winds Meet | mundo propio + co-op + hubs donde se reúne la gente | ✅ |

## 3. Recolección estilo New World ✅ (cambia una decisión antigua)
- **Decisión del dueño (2 nov):** la rueda actual (pulsar en el arco) se **sustituye** por una **barra de progreso que se llena sola** con mucha dopamina: sonido por golpe que sube de tono, partículas, el recurso tiembla y se rompe por fases, **golpe dorado** aleatorio (+botín), contador de botín que salta. Anula la regla antigua «nada automático, si no pulsas no pasa nada» **solo para la recolección**.
- **Consecuencia:** reequilibrar los tiempos de `tools/meas_progresion.py` (ya no hay acierto/fallo).
- Se mantiene: el árbol cae, la mena se rompe, botín 3D que vuela a la mano, sin progreso offline.

## 4. Tu aldea: la progresión «desde las ruinas» ✅ (línea principal; decidido el 2 nov)
**Idea clave:** las etapas de tu aldea son la **línea principal** de la progresión, pero **NO bloquean los tiers** (decisión del dueño): puedes fabricar cualquier tier en las estaciones de las aldeas de PNJ si tienes el nivel. Lo que da tu aldea es **comodidad y ventaja** (estaciones cerca, mejores rendimientos y calidad, residentes, almacén, viaje, mercader) y **acceso a sistemas** (asedios, subasta, facción, plano). La columna «tiers» de la tabla es solo la época aproximada en la que llegas a cada etapa.

| Etapa de tu aldea | Cuándo (aprox.) | Qué construyes (proyectos) | Qué desbloquea | Biomas que tocan |
|---|---|---|---|---|
| **0 · Ruinas** | tras el tutorial | limpiar escombros, hoguera, tienda de campaña | **refugio = punto de reaparición**, cofre, banco de trabajo básico (tier 1–2: cobre, bronce) | Pradera |
| **1 · Campamento** | nivel total ~60 | horno y yunque propios, huerto, cerca | tier 3–4 (hierro, acero), 1.er residente (herrero) | Pradera |
| **2 · Puesto** | ~150 | establo, curtiduría, cocina, almacén | monturas propias y cría, tier 5–6, 3 residentes, **1.er asedio** (ver §7) | Pradera → Bosque |
| **3 · Aldea** | ~300 | muro y torre, botica, mesa de encantamiento, muelle | tier 7–8, **mercader residente** (rota objetos interesantes cada semana), diario de bioma, viaje rápido entre tus refugios | Pantano, Cumbres |
| **4 · Villa** | ~500 | taller de ingeniería, joyero, puesto de comercio | tier 9–10, **casa de subastas** (§9), **elegir Senda** (facción) | Oriental, Volcán, Desierto |
| **5 · Ciudad** | ~800 | monumento de tu facción, portal | tier 11–12, **acceso al plano de tu facción (Cielo o Infierno) y a su hub** | Páramo, Costa, endgame |

- **Residentes:** los encuentras por el mundo (POI, cuevas, tras jefes, en otras aldeas) y se mudan a tu aldea si cumples algo. Cada uno da un servicio que **facilita la vida**: el herrero mejora la calidad de las barras, la cazadora trae pieles, el cartógrafo revela el mapa, el mercader vende rarezas, el guardia defiende en los asedios. Coleccionarlos también cuenta para el Renombre.
- **Mismo mapa para todos** (el mapa A): tu aldea va en un **sitio FIJO junto a la playa** donde despiertas tras el tutorial ✅ (todos la tienen en el mismo sitio: más fácil de diseñar, equilibrar y compartir estructuras).
- **Construcción libre** ✅: al ser tu mundo, puedes construir **refugios, puentes, escaleras, carteles y almacenes por todo el mapa** (no en aldeas de PNJ ni arenas de jefe; límite de piezas por sector por el presupuesto de rendimiento).
- **Encaje con lo que hay:** las recetas por tier, `GATE`, las estaciones 3D (`propsdark_estaciones3d.js`), el motor de barrios (`village-barrios.js`), el Establo, los PNJ por bioma. El tutorial del Cielo no cambia; termina dejándote en la playa junto a tus ruinas.

## 5. Progresión de cuenta ✅
- **Renombre**: cifra de cuenta (nivel total + colección + logros + aldea + residentes). Recompensas visibles por tramos (títulos, auras, monturas, marcos).
- **Registro de colección**, **logros**, **diarios por bioma** (cada nivel = mejora permanente en ese bioma), **hitos de skill** cada 10 niveles.
- **Temporadas** ✅ con **clasificación global por temporada** ✅.

## 6. Facciones: Cielo e Infierno (estilo Bonta/Brakmar) ✅
**Al llegar a la Villa eliges Ascender (Cielo) o Descender (Infierno).** Árbol propio, transformación de combate, aspecto (alas/cuernos), residentes y tiendas afines, y tu plano del endgame.

Cómo se hace interesante **sin ver a los demás en el mapa**:
1. **Guerra de territorio por temporada (asíncrona):** cada región del mapa tiene un medidor Cielo/Infierno que es la **suma global** de lo que hacen los jugadores de cada facción en ella (jefes, eventos, estructuras, PvP). En TU mundo se ve: estandartes, patrullas y tiendas de la facción que domina esa región; precios y bonos cambian. El servidor solo suma números.
2. **Hub de facción en tiempo real:** el Cielo y el Infierno son las **capitales-hub** (§8): ahí sí ves a los demás, comercias, aceptas retos.
3. **PvP por invasión (Dark Souls):** con un objeto, invades el mundo de alguien de la facción contraria (o te invaden). Es una sesión 1v1 o 1v2 entre navegadores (§11). ✅ **Solo te pueden invadir si llevas activado el «estandarte de guerra» o eres proscrito**; si no, nadie entra en tu mundo.
4. **Arena por instancias:** duelos 1v1/2v2 desde el hub, con clasificación de temporada.
5. **Proscritos («piratas») ✅:** matar PNJ inocentes, saquear caravanas o traicionar a tu facción sube tu **Infamia**. Con Infamia alta: recompensa por tu cabeza, cazadores PNJ te persiguen y **otros jugadores pueden invadirte** para cobrarla. Se limpia pagando o con una misión. Da un estilo de juego entero (tiendas negras, botín de saqueo).

## 7. Supervivencia «MMO chill» ✅ (lo que eligió el dueño)
| Mecánica | Estado |
|---|---|
| **Comida = PV y aguante máximos** (3 platos activos; sin comer no mueres, solo eres más débil) | ✅ |
| **Exposición por bioma** (frío/calor/veneno), **solo hasta cierto punto**: suave, avisada, reversible, se combate con ropa/comida/pociones | ✅ moderada |
| **Refugios**: descansar en uno **fija tu punto de reaparición** y da bonus de descanso | ✅ |
| **Noche más peligrosa** (más enemigos y élites) | ✅ |
| **Asedios a TU aldea**: poco frecuentes y **solo desde la etapa 2 (Puesto)**, con aviso; si pierdes se daña, no se borra | ✅ |
| **Lápida al morir** (parte de la mochila, recuperable) | ✅ |
| Durabilidad del equipo | ❌ descartada |
| Modos de dificultad | ⏸ no ahora: se diseña el juego primero |

**Nota de reglas:** la regla «NO survival» de `REGLAS_CREACION.md` §1 queda sustituida por esta tabla (cambiada el 2 nov 2026).

## 8. Hubs en tiempo real (estilo Where Winds Meet) y su coste
**Qué es:** el Cielo y el Infierno (y quizá la capital Oriental) son **escenas pequeñas compartidas** de hasta ~50 jugadores por instancia. Ahí: ver a otros, chat, emotes, casa de subastas, arena, tablón de grupos para co-op. Fuera del hub, cada uno en su mundo.

**Coste estimado (orden de magnitud, a verificar con precios actuales al contratar):**
- Un hub solo reenvía posición, animación y equipo (~25 bytes por jugador, 10 veces/s). Con 50 jugadores: cada cliente recibe ≈ 12 KB/s y el servidor envía ≈ 600 KB/s por instancia llena. 24 h llena todo el mes ≈ 1,5 TB.
- La CPU de un reenvío así es casi nula. **Un VPS pequeño (del orden de 5–10 €/mes, con varios TB de tráfico incluidos) aguanta varias instancias llenas.** Con cientos de jugadores a la vez, unos pocos VPS. Es **muchísimo más barato** que un mundo abierto compartido (que obliga a simular enemigos, recursos y combate en el servidor).
- **El coste real no es el dinero, es el mantenimiento**: tener el servidor vivo, moderar el chat, y que el cliente manda (alguien puede mover su personaje con trucos dentro del hub; en un hub social importa poco).

## 9. Casa de subastas estilo WoW, por temporada y con objetos verificados ✅ (decidido el 2 nov; lo técnico lo decide el agente)
**Cómo se juega (como la de WoW):** se publica en la casa de subastas del hub (y, en la etapa Villa, desde el puesto de comercio de tu aldea) con **puja y compra inmediata**, duración 12/24/48 h, **depósito** al publicar (se pierde si no se vende: evita llenar la subasta de basura) y **comisión del 5 %** al vender (sumidero de dinero). Búsqueda por nombre, categoría, tier y rareza; historial de precios. **La economía se reinicia cada temporada** (objetos y oro de la subasta van a un «personaje de temporada»; al acabar, pasan a tu personaje permanente).

**«Comprobar que el objeto es real al publicarlo» — cómo se hace (decisión técnica del agente):**
Como el juego corre en el navegador, el servidor no puede ver cómo conseguiste algo. La forma realista es que **el servidor lleve la cuenta de lo que es «comerciable»**:
1. **Libro de cuentas del personaje de temporada.** Al conectarte, el juego manda al servicio un **diario firmado de eventos** (recolectaste 40 menas de hierro, fabricaste 10 barras, mataste a Gruk y cayó X…) en bloques pequeños, con hora de juego y semilla. El servicio comprueba que cada bloque es **posible**: XP y recursos por hora dentro del máximo del juego, que la receta existe y tenías el nivel, que la tirada de botín cuadra con la semilla y la tabla (`CLOOT`, `MD`), que no hay saltos de tiempo.
2. **Solo lo que está en el libro se puede publicar.** Al publicar, el servicio descuenta del libro (no de tu guardado): si el objeto no consta, se rechaza. Un objeto comprado entra en el libro del comprador. Así **no se puede vender lo inventado**, aunque se pueda trampear la partida local.
3. **Topes de temporada** por objeto y día (lo producible por un jugador muy activo) y **partidas marcadas por el menú de trucos** = sin acceso.
4. **Revisión** de los que más venden (lista para el dueño).
- **Coste:** el diario son pocos KB por hora de juego; las comprobaciones son sumas y tablas. Cabe en un servicio sin servidor propio (Cloudflare Workers + D1 o Supabase) con coste muy bajo.
- **Límite honesto:** un tramposo muy decidido podría fabricar un diario falso «plausible» (simular que jugó). Por eso los topes son lo que una persona real produce: como mucho vendería lo que un jugador muy dedicado, no millones. Es suficiente para una economía de temporada.
- **Sin conexión:** la subasta simulada que ya existe (`shop.js`).

## 10. Mundo vivo y «ayuda de otros» (Death Stranding) ✅
**Es posible:** como **todos jugáis el mismo mapa**, una estructura de otro jugador en (x, y) tiene sentido en tu mundo.
- **Estructuras compartidas:** puentes, escaleras, refugios, carteles con consejo, cofres de donación. Las tuyas se suben; en tu mundo aparecen unas pocas de otros por sector (elegidas por «me gusta», amigos y facción). Dar «me gusta» a las de otros da Renombre a los dos.
- **Ecos:** lápidas de otros (cómo murieron frente a ese jefe), récords grabados.
- **Aventureros PNJ con nombres reales** ✅: PNJ que talan, pescan, pelean en grupo y comercian; nombre, nivel, facción y equipo sacados de la clasificación.
- **El mundo hace cosas sin ti** ✅: caravanas, patrullas de facción, eventos en el mapa, jefes de mundo con horario, residentes que salen a por recursos.
- **100 % sin conexión** ✅: todo lo anterior lo generan PNJ y estructuras de autor.

## 11. ¿Es posible técnicamente el «mundo solitario conectado»? ✅ sí, por piezas
| Pieza | Cómo | Coste |
|---|---|---|
| Clasificación, temporadas, guerra de facción | el juego manda un resumen al guardar; el servicio suma | casi gratis |
| Estructuras, ecos, «me gusta» | base de datos por sector del mapa | casi gratis (almacenamiento pequeño) |
| Casa de subastas | base de datos | casi gratis (el riesgo son las trampas, §9) |
| Co-op 2–4 e invasiones PvP | conexión directa entre navegadores (WebRTC); el servidor solo los presenta; ~10–20 % de conexiones necesitan un relé | bajo |
| Hubs de facción | servidor de reenvío en tiempo real (§8) | bajo en dinero, medio en mantenimiento |
| Mundo abierto compartido para todos | ❌ no se hace | — |

**Lo que hay que preparar en el código desde ya** (sin implementar nada de red): PRNG con semilla en lógica nueva, estado del jugador en un objeto, IA de enemigos que elige objetivo de una LISTA de jugadores, y **contadores de estadísticas** guardados (para la clasificación).

## 12. Otros cambios decididos
- **Reducir el mapa** ✅: a K=6 es demasiado grande para la densidad que podemos llenar. ✅ **K=4 fijado temporalmente el 2 nov** tras medir (lote N0-MEDIR-MAPA; monturas ajustadas en K4-MONTURAS). Antes: **Medir K=3 y K=4** (tiempo caminando entre cosas, objetivo algo cada 30–60 s; rendimiento y memoria en la GPU del dueño) y el dueño elige con los datos. Es cambiar un número.
- **Duración del día** ✅: se queda en 6 min (`DAYLEN=360`). Mecánicas para que el día importe:
  - **recursos y criaturas de noche** (hierbas y peces nocturnos, élites nocturnos);
  - ✅ **ciclo de 7 días de juego** (≈ 42 min) con un día especial por ciclo (luna roja = más élites y mejor botín; mercado ambulante; jefe de mundo);
  - **descansar en un refugio** pasa la noche y da el bonus de descanso.
- **Mazmorras completas, Mítica+ y transfiguración** ⏸ para más adelante.
- **Presencia en tiempo real fuera de los hubs** ⏸ para el final.

## 13. Decisiones del dueño (2 nov 2026) — CERRADO
1. Etapas de la aldea = **línea principal, pero NO bloquean tiers** (§4).
2. Aldea en **sitio fijo junto a la playa** (§4).
3. **Casa de subastas estilo WoW**, economía por temporada y verificación del objeto al publicar (§9; lo técnico lo decidió el agente).
4. Invasiones **solo si las activas** (estandarte de guerra) o eres proscrito (§6).
5. Mapa: **medir K=3 y K=4** y elegir con datos (§12).
6. **Ciclo de 7 días** con día especial: sí (§12).

## 14. Orden (pasado a `docs/HOJA_DE_RUTA.md` como fases N0–N13 el 2 nov 2026)
| # | Fase | Contenido |
|---|---|---|
| A | Cerrar Pradera técnica | lo en curso; **reducir el mapa** |
| B | **Recolección New World** + **comida/refugio/lápida/noche** | barra automática con dopamina; supervivencia base |
| C | **Tu aldea etapas 0–2** + residentes | progresión desde las ruinas en la Pradera |
| D | **Progresión de cuenta** | Renombre, colección, logros, diarios, contadores |
| E | **Mundo vivo sin conexión** | aventureros PNJ, caravanas, eventos, jefes de mundo, construcción libre |
| F | **Capa conectada v1** | clasificación por temporada, estructuras y ecos compartidos |
| G | **Biomas uno por uno** (Bosque…) | cada uno sube la aldea una etapa, con su cultura, residentes y diario |
| H | **Facciones** (etapa 4) | Senda, guerra de territorio, Infamia/proscritos |
| I | **Co-op 2–4 + invasiones** | WebRTC |
| J | **Hubs Cielo/Infierno** + casa de subastas + arena | servidor de reenvío |
| K | Mazmorras completas / Mítica+, transfiguración, presencia fuera de hubs | ⏸ |
| Z | Rebalanceo, localización | como ya está |

**La demo es la Pradera con A–F.**
