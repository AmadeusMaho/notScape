# PLAN DE ENCANTAMIENTOS Y ESTADOS ALTERADOS — PROPUESTA (28 oct 2026)

> **RECORTE ACEPTADO por el dueño (28 oct 2026) y HECHO (lote ENCANT-T2):** armas nuevas solo Vampírica, Sagrada, Cazadora, Arcana y Aplastante; armadura Espinas, Resguardo (uno, no cinco), Vitalidad, Regeneración, Celeridad y Purificación; herramientas Eficiente, Afortunada, Buscadora, Precisa, Fundidora y de Brasa. El resto de §2–§4 queda como reserva.
> **Estado anterior: APROBADA ENTERA por el dueño (28 oct 2026).** Hecho: §1 estados y reacciones, 7 superiores de §2, esencias (§5.4), requisito de nivel. Falta: 12 armas nuevas de §2, §3 armaduras, §4 herramientas (tandas 2–4, ver lote ESTADOS-FINALES en AGENTS.md). Nada de esta lista está en el juego salvo lo marcado ✅.
> Hoy existen (lote ENCANTAMIENTO v1 + ENCANT-VFX-2): 7 encantamientos de arma (Sangrienta, Ígnea, Gélida, Venenosa, Afilada, Tormentosa, del Vacío) y 11 estados en `STS.D` (src/status.js).
> Cuando el dueño apruebe: cada estado = una fila en `STS.D`; cada encantamiento = una fila en `ENCH.D` (src/enchant.js) + su aspecto en `FX` (src/r3d/enchfx3d.js) y `EM` (src/item-icons.js).

## 0. Reglas que propongo
- **Escalones por elemento:** cada encantamiento elemental tiene versión BASE (nivel bajo, estado suave) y SUPERIOR (nivel alto, estado fuerte), p. ej. Venenosa → **Tóxica**. La superior pide esencia «pura» (drop de élites/jefes) y aspecto más intenso (misma familia visual, más grande y con un detalle extra).
- **Un encantamiento por objeto**, también en legendarios (decidido). Encantar uno nuevo sustituye al anterior.
- **Los estados fuertes NO se apilan con su versión débil:** Toxina sustituye a Veneno, Hemorragia a Sangrado, etc.
- Jefes y élites: control duro (congelar, aturdir, miedo, raíces) dura ×0,4 (ya es así) y tienen inmunidad corta tras sufrirlo.

## 1. ESTADOS ALTERADOS FINALES
### 1a. Negativos (enemigos y jugador)
| Estado | Familia | Qué hace | Versión fuerte |
|---|---|---|---|
| ✅ Veneno | toxina | daño por segundo, ×3 | **Toxina**: más daño, ×5, y −30 % curación recibida |
| ✅ Sangrado | sangre | daño por segundo, ×3 | **Hemorragia**: daño mayor que crece si el objetivo se mueve |
| ✅ Quemadura | fuego | daño rápido | **Incinerar**: si el objetivo muere ardiendo, el fuego salta a los cercanos |
| ✅ Ralentización | hielo | −35 % velocidad | **Escarcha** (acumulable): a ×5 → Congelación |
| ✅ Congelación | hielo | inmóvil 5 s; el golpe la rompe con crítico | — |
| **Electrizado** | rayo | el siguiente golpe salta a un enemigo cercano (50 %) | **Sobrecarga**: salta a 3 y aturde 0,4 s |
| ✅ Aturdido | rayo / contundente | no actúa | — |
| ✅ Debilitar | vacío | −25 % daño que hace | **Agotamiento**: además −30 % velocidad de ataque |
| **Maldición** | vacío | −50 % curación, daño de sombra lento | **Condena**: al terminar, estalla con el daño que recibió durante ella × 0,25 |
| ✅ Vulnerable | físico | +15 % daño recibido | **Expuesto**: +30 % y anula escudos |
| **Desgarro** | físico | −defensa por acumulación (×5) | — |
| **Corrosión** | ácido | −defensa y −daño de su armadura de espinas, ×5 | **Disolución**: a ×5 rompe la armadura (defensa 0, 4 s) |
| ✅ Raíces | naturaleza | no se mueve, sí ataca | — |
| ✅ Ceguera | sombra / luz | falla más (enemigo) / visión cerrada (jugador) | — |
| **Miedo** | terror | huye 1,5 s | — |
| **Silencio** | arcano | no lanza hechizos (chamanes, brujas, magos) | — |
| **Marcado** | caza | +20 % daño de proyectiles contra él | — |
| **Quemadura de maná** | arcano | pierde maná / el jugador no regenera maná | — |
| **Juicio** | luz | el próximo golpe recibido es crítico; ×2 a no-muertos y demonios | — |
| **Empapado** | agua | apaga quemaduras; el rayo hace ×1,5; con frío → Congelación inmediata | — |

### 1b. Positivos (jugador, y algunos enemigos)
✅ Escudo · ✅ Furia · **Regeneración** · **Celeridad** · **Espinas** (devuelve daño) · **Resguardo** (de un elemento: −50 % daño y duración) · **Robo de vida** · **Inquebrantable** (inmune a control 3 s) · **Vigor** (+daño) · **Sigilo** (para el Asesino de la Fase 6).

### 1c. Reacciones (las de la idea S3 del plan, para que haya combos)
Empapado + Rayo → Electrocutado (×1,5 y salta) · Empapado + Frío → Congelación · Quemadura + Hielo → Vapor (se anulan y ciega 1 s) · Veneno + Fuego → **Nube tóxica** (área) · Corrosión + golpe pesado → Disolución inmediata · Maldición + Sagrado → Purga (daño grande).

## 2. ENCANTAMIENTOS DE ARMA (≈ 22)
**Elementales, con base → superior:**
| Base (nv) | Superior (nv) | Estado | Aspecto |
|---|---|---|---|
| ✅ Ígnea (12) | **Infernal** (64) | Quemadura → Incinerar | llamas → llamas blancas con ceniza negra |
| ✅ Gélida (22) | **Glacial** (70) | Ralentiza/Escarcha → Congelación | vaho → cristales que crecen en la hoja |
| ✅ Venenosa (4) | **Tóxica** (52) | Veneno → Toxina | baba → baba más espesa con vapores verdes |
| ✅ Sangrienta (30) | **Hemorrágica** (66) | Sangrado → Hemorragia + robo de vida | aura roja → venas más gruesas y goteo |
| ✅ Tormentosa (58) | **Tempestad** (86) | Electrizado → Sobrecarga | arcos → arcos que saltan al aire |
| ✅ del Vacío (72) | **Abisal** (90) | Debilitar → Maldición/Condena | humo → humo con ojos/estrellas oscuras |
| ✅ Afilada (44) | **Implacable** (78) | +8 % → +15 % daño físico y Desgarro | destello → destello doble y filo blanco |

**Nuevos:**
| Encantamiento | Para | Efecto | Aspecto |
|---|---|---|---|
| **Vampírica** | cualquier arma | 4 % del daño como vida | hoja oscura con brillo granate que «absorbe» |
| **Sagrada** | cualquier arma | ×1,5 a no-muertos/demonios, Juicio | luz dorada y motas |
| **Corrosiva** | cuerpo a cuerpo | Corrosión | ácido amarillo verdoso que humea |
| **Aplastante** | mazas, hachas, mandobles | aturde a veces + empuje | ondas de choque en la cabeza del arma |
| **del Viento** | dagas, espadas, arcos | +10 % velocidad de ataque, empuja | estelas de aire blancas |
| **del Terror** | cualquier arma | Miedo (rara vez) | sombras con caras que se deshacen |
| **Cazadora** | arcos, ballestas | Marcado + más alcance | brillo verde en la cuerda, plumas |
| **Arcana** | bastones, cetros | +daño mágico, −coste de maná, Quemadura de maná | runas que orbitan el orbe |
| **Marea** | cualquier arma | Empapado (para las reacciones) | agua que corre por la hoja |
| **Ejecutora** | cualquier arma | +30 % daño a enemigos con < 25 % de vida | filo rojo que se intensifica |
| **de Ecos** | cualquier arma | 6 % de golpe doble | imagen fantasma que repite el golpe |
| **Fortuna** | cualquier arma | más botín y esencias | monedas/destellos dorados |

## 3. ENCANTAMIENTOS DE ARMADURA (≈ 14; por ranura)
| Encantamiento | Ranuras | Efecto |
|---|---|---|
| **Espinas** | peto, escudo | devuelve 10 % del daño cuerpo a cuerpo |
| **Resguardo de fuego / hielo / rayo / veneno / sombra** (5) | cualquiera | −20 % daño de ese elemento y −40 % duración de su estado (se suma por piezas, tope 60 %) |
| **Vitalidad** | peto, piernas | +PV máximos |
| **Regeneración** | peto, casco | cura 1 PV cada 4 s en combate |
| **Aguante** | piernas, botas | esquivar/correr cuesta −20 % resistencia |
| **Celeridad** | botas | +6 % velocidad de movimiento |
| **Destreza** | guantes | +5 % velocidad de ataque y precisión |
| **Represalia** | escudo, peto | al recibir golpe, 10 % de quemar/congelar/electrizar al atacante (según esencia) |
| **Purificación** | casco, capa | −30 % duración de TODOS los estados malos |
| **Inquebrantable** | escudo, botas | tras un aturdimiento, inmune al control 4 s |
| **Lucidez** | casco | inmune a Ceguera y Miedo, +regeneración de maná |
| **Sigilo** | capa, botas | (Fase 6, Asesino) |

Aspecto: brillo suave del color en los bordes de la pieza y alguna partícula en la ranura (no tan vistoso como el arma, para que el héroe no parezca un árbol de Navidad).

## 4. ENCANTAMIENTOS DE HERRAMIENTAS DE OFICIO (≈ 10)
| Encantamiento | Herramientas | Efecto |
|---|---|---|
| **Eficiencia** | hacha, pico, tijeras, caña | la rueda/minijuego avanza más rápido |
| **Fortuna** | todas las de recolección | +15 % de recurso doble |
| **Hallazgo** | pico, tijeras, cuchillo de desollar | más gemas, nidos y objetos raros |
| **Precisión** | todas | zona de «perfecto» de la rueda y minijuegos más ancha |
| **Ligereza** | todas | la recolección no gasta resistencia |
| **Autofundido** | pico | 10 % de dar la barra en vez de la mena |
| **Brasa** | caña | 10 % de sacar el pez ya asado |
| **Concentración** | herramientas de crafteo (martillo, aguja, cincel…) | +Concentración en la hoja de trabajo |
| **Conservación** | herramientas de crafteo | 15 % de no gastar material en un fallo |
| **Prospección** | pico, tijeras | marca en el minimapa vetas/hierbas cercanas |

## 4b. NIVELES (decidido por el dueño, 28 oct 2026; HECHO en el lote ENCANT-NIVELES)
Cada encantamiento tiene **nivel I, II y III** (más fuerza y más VFX al subir; se potencia en la mesa con más esencias) y su **versión superior** (Hemorragia, Toxina…) tiene a su vez I–III con un VFX **mucho mayor** que la base (potencia 1,4–2 y extras propios). Sustituye a la regla «base → superior» de §0.

## 5. PREGUNTAS PARA EL DUEÑO (★)
1. **RESPONDIDA:** uno por objeto, también en legendarios (que no se mezclen elementos).
2. ~~¿Base → superior o I/II/III?~~ **RESPONDIDA:** I/II/III en cada uno + versión superior (también I–III) con VFX mucho mayor.
3. **RESPONDIDA:** un poco de VFX en la pieza, a criterio del agente.
4. **RESPONDIDA:** entra TODO.
5. **RESPONDIDA:** ambas; además DESARMAR un arma encantada devuelve parte de la esencia (pide nivel de Encantamiento según el arma) y el botín puede caer ya encantado. **Y las armas piden nivel de su habilidad de combate.**
