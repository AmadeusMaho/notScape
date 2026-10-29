# PLAN DE DOMAR (`dm`) — ESTADO 29 oct 2026: D1–D5 + cierres HECHOS; D5b (Corcel y ascensión) APLAZADO por el dueño a una fase posterior.
# (título original) PLAN DE DOMAR (`dm`) — PROPUESTA del 29 oct 2026 (nada implementado; pendiente de visto bueno del dueño)

> Referencias que pidió el dueño: **BDO** (captura activa de caballos salvajes, tiers, estable, cría) y **Dofus** (capturar dragopavos y CRUZARLOS para sacar variantes con efectos). Decisiones previas que mandan: Domar entra con el Bosque; **una montura + una mascota a la vez** (2 ranuras dedicadas); una criatura domable por bioma (★9 de `docs/MATRIZ_OFICIOS_MUNDO.md`); el viaje rápido «se diseña mejor» más adelante (las monturas son parte de la respuesta); **sin progreso offline**; **cada modelo es único** (no se reutilizan assets); el crafteo usa la hoja de trabajo FF14, **pero Domar NO la usa (decisión del dueño, 29 oct: no encaja con una criatura viva)**.

## 1. ¿Tiene sentido copiar Dofus tal cual? Veredicto
**No tal cual; sí en versión reducida.** Lo que hace funcionar los dragopavos en Dofus es (a) medidores que suben con el TIEMPO REAL (días) y (b) una economía de jugadores que compra colores y capacidades raras. Aquí:
- **Sin offline** → los medidores por horas reales no valen. Se sustituyen por **tiempo de juego activo** (minutos) y un coste en materiales.
- **Un solo jugador por ahora** (mercado = Fase 16c) → sin mercado, la rareza no se vende; hay que dar otro motivo para criar: **coleccionar variantes, rasgos que resuelven problemas del mundo (lava, ciénaga, desierto, agua)** y un tope de calidad que solo se alcanza criando.
- **«No reutilizar assets»** → los híbridos entre especies (caballo × ciervo) exigirían un modelo nuevo por cruce. **Descartado**: se cruza DENTRO de la especie (variantes de pelaje y de genes, mismo modelo con otra paleta/accesorios); los híbridos entre especies, si se quieren, serán 3–4 casos con modelo propio (futuro).
- Lo que sí aprovechamos de Dofus: **genes heredables, generaciones que suben el techo, rasgos que se transmiten y mutan, pelaje por herencia**, y un **Establo** como sitio central.
- De BDO: la **captura activa** (no es «pulsa y listo»), el **tier por especie y nivel**, el **establo por aldea** y las **habilidades de montura** que se desbloquean al usarla.

## 2. El sistema (v1)
### 2.1 Captura en el mundo (estilo BDO; REVISADA 29 oct: sin hoja de trabajo ni ventana)
- Skill `dm` (Domar). Cada criatura domable tiene `nivel`, `temperamento` (dócil · recelosa · feroz) y un **cebo favorito** (comida de Cocina). Se necesita el nivel de Domar de la criatura.
- **Fase 1 · Acechar:** acércate SIN correr y sin combate reciente. La criatura tiene tres estados de alerta (calma → alerta → huida; las presas `fl` ya huyen así). El cebo en la mano reduce la distancia a la que se alerta.
- **Fase 2 · Lazo:** con el **lazo** equipado (lo fabrica Ingeniería) y la criatura en rango y en el cono delante de ti, LMB lanza el lazo con **timing** (aro que se cierra, como el aviso de golpe). Fallar la aleja o, si es feroz, la hace embestir. Las ferales (huargo, tigre, salamandra) hay que **debilitarlas (< 30 % PV)** antes.
- **Fase 3 · Doma (la criatura corcovea):** te agarras y se sacude. **Reutiliza el golpe telegrafado y la esquiva con ESPACIO del combate** (`m.wind`/`pdCheck`): cada sacudida avisa y la contrarrestas a tiempo. 3 aciertos = domada; 2 fallos = te tira y recibes daño (y la criatura huye o ataca según su temperamento). Ninguna mecánica nueva que mantener.
- **Oficios que aportan:** Ingeniería = lazo · Peletería = brida y silla · Herrería = herraduras · Cocina = cebo y pienso.
- **Domar XP:** al capturar (según el nivel de la criatura) y un poco por usar monturas y por criar.
- Resultado: un **animal doméstico** `{especie, nivel de montura, genes, rasgos, generación G1, pelaje, nombre, xp}` que va al Establo.

### 2.2 Animal doméstico (datos)
- **Genes (0–100, techo por generación):** `vel` velocidad · `agu` aguante (estamina) · `car` carga (ranuras de mochila extra) · `tem` temple (resistencia al frío/calor/veneno). Techo = 55 en G1, +10 por generación hasta G5.
- **Rasgos (0–2 por animal):** pool por especie y bioma (p. ej. *Pezuña de lava* = cruza lava, *Paso de ciénaga* = sin ralentización en pantano, *Pelaje de nieve* = inmune a frío, *Odre* = −50 % consumo en desierto, *Sigiloso* = los enemigos te detectan a menos distancia, *Nadador* = cruza agua baja). Son el motivo para criar y para capturar especies de otros biomas.
- **Pelaje:** paleta heredable (2 genes de color → mezcla), con variantes raras (3 %).
- **Montura vs mascota:** la ranura de montura da velocidad (×1,35 – ×2,2 según `vel` y el tier de la silla), carga y rasgos; la de mascota da un bono pasivo menor (recoge botín cercano, +suerte al recolectar, aviso de peligro) y no se monta. Una especie es de uno de los dos tipos (caballo/camello/yak montura; zorro/grulla/halcón mascota…), nunca los dos.
- **Fatiga:** barra de **Aguante** propia (como la resistencia del héroe): al galopar baja; se rellena parada o con pienso. Sin reloj real.
- **Desmontar:** al recibir daño o iniciar combate; no entra en casas ni cuevas (se queda fuera). Montado no se puede talar/minar.

### 2.2b Progreso por USO y HABILIDADES ALEATORIAS (estilo BDO; REVISADO 29 oct)
- **Nivel de la montura** (1–30; el tope lo marca su generación: G1 hasta 12, +4 por generación): gana XP por **distancia recorrida** y por **tiempo al galope** (rendimiento decreciente si das vueltas en el sitio); cada nivel suma un poco a velocidad, aguante o carga.
- **Habilidades ALEATORIAS (como BDO; el jugador no las elige):** cada especie tiene un **pool de ~10 habilidades** con rareza **común / rara / épica** (galope, giro brusco, salto, frenada, estampida, paso firme, vigía, rastro…; tablas por especie en datos). Al subir de nivel en los hitos (3, 6, 9… 30) hay un **35 % de aprender una** (sube con el Domar y con el afecto): sale al azar entre las que aún no sabe, ponderada por rareza (60/30/10 %). Si sale una que ya tiene, **sube de rango (I→III)**. Máximo **4 + 1 por generación** de habilidades por animal.
- **Reiniciar:** *Pergamino del olvido* (Encantamiento) olvida UNA habilidad a elección y deja la ranura para otra tirada; cuesta esencia. Es el sumidero que evita «no me salió la que quería» eterno.
- **Herencia de la cría:** cada habilidad de un padre tiene un 20 % de pasar a la cría (a rango I). Crías de dos con la misma habilidad la heredan a rango II al 35 %.
- **Dos ejes que no se pisan:** el **individuo** progresa USÁNDOLO (nivel y habilidades); el **linaje** progresa CRIANDO (genes, rasgos, generación y por tanto el tope).
- **Domar nivel:** sube con capturas, uso y crías; abre especies más difíciles y más animales en el Establo.

### 2.2c EL CORCEL (animal perfecto) y la ASCENSIÓN a especies únicas
- **Corcel** = título de un animal **perfecto** (nombre propio: «Corcel de las llanuras», «Corcel de las cumbres»…, uno por especie). Se obtiene cuando cumple a la vez: **generación 5 · nivel 30 · los 4 genes ≥ 90 · 2 rasgos · ≥ 4 habilidades con al menos una épica**. El panel del animal muestra esa lista de «Perfección» con marcas; al cumplirla se le nombra Corcel (aspecto propio: aura sutil y silla de gala; mismo modelo de su especie con paleta y adornos propios, no modelo nuevo).
- **ASCENSIÓN (evolución):** un Corcel puede **ascender**, de forma irreversible, a una **especie única de su FAMILIA** (equinos, cérvidos, bóvidos, reptiles, camélidos, felinos, cánidos, marinos…). Cada ascensión es una fila de datos `ASC[familia] = [{resultado, rasgo exigido, material, nivel de Domar, ritual}]`:
  - ejemplo equinos: caballo + rasgo *Pezuña de lava* + **esencia pura de fuego** (Encantamiento) → **Corcel infernal**; + *Pelaje de nieve* + esencia pura de escarcha → **Unicornio de escarcha**; + rasgo *Sagrado* + material del Cielo → **Pegaso** (planea).
  - El rasgo exigido y el material empujan a explorar biomas y a cruzar con Encantamiento, Alquimia y Herrería (el ritual se hace en el Establo con un *Altar de ascensión*).
- **La especie única** tiene **modelo propio** (regla: no se reutilizan assets), una **habilidad de firma** que no existe en ningún pool, techo de genes +10 % y no se puede criar (es un trofeo de final de camino); sus crías… no existen, pero el linaje sigue con los hermanos.
- **Coste de arte:** una ascensión = un modelo nuevo (y su animación de monta). **Plan: 3 ascensiones para equinos (las primeras) y 1–2 por cada otra familia**, hechas conforme se hagan los biomas. Sin modelo todavía, la ascensión de esa familia está bloqueada (se enseña como «próximamente»).

### 2.3 Establo y cría (Dofus reducido)
- **Establo** (edificio compartido por aldea, ya previsto en ★13): guarda hasta N animales (N = 4 + 2 por mejora), los alimenta y los pone a **cruzar**.
- **Cruce (panel del Establo, sin minijuego):** eliges dos animales de la MISMA especie, adultos y descansados; el panel muestra la **previsión** (rango de cada gen y rasgos posibles). Coste: **Pienso de cría** (Cocina/Agricultura) + oro. **Gestación = 12 min de tiempo de juego activo** (a la mitad con un *Tónico de cría* de Alquimia); se avisa al terminar. Cuidados opcionales (alimentar, herrar) mantienen aguante y afecto.
- **Herencia de la cría:** cada gen = media de los padres + ruido (−6…+10) con sesgo hacia el mejor, topado por el techo de su generación (= máx. generación de los padres + 1); cada rasgo se hereda al 45 %; **8 % de mutación** a un rasgo raro del pool; pelaje mezclado con 3 % de variante rara. Cada animal puede criar **3 veces** y luego se «retira» al establo (cosmético): evita farmear sin fin.
- **Pity:** tras 3 crías sin rasgo, la 4.ª garantiza uno.
- **Meta de largo plazo:** G5 con 2 rasgos y los 4 genes ≥ 90 por especie (coleccionable por bioma; logro).

## 3·b HECHO (lotes DOMAR-D3-MODELOS y D3b, 29 oct 2026): 36 domables + 18 raras
Datos: `src/mountdata.js` (`MTD.L`: bioma, nivel de Domar, XP, velocidad, aguante, rareza). Modelos: `src/r3d/mountmodels3d.js` (`SPEC`, uno por especie, silla por cultura).
Pradera: caballo · poni pinto · asno · uro — Bosque: ciervo real · alce · oso de las hayas · lince boreal — Pantano: varano · sapo buey · raptor de los juncos · búfalo de agua —
Cumbres: yak de carga · íbice · mamut lanudo · oso de las nieves — Oriental: tigre · grulla de monta · panda · león guardián — Volcán: salamandra de lava · rinoceronte de ceniza · escarabajo de brasa · sabueso infernal —
Páramo: huargo · ave del terror · ciervo rúnico · tejón gigante — Desierto: camello · órix · avestruz · lagarto de gola — Costa: tortuga · cangrejo · iguana marina · gaviotón.
**Únicas raras (2 por bioma, lote DOMAR-D3b):** unicornio, pegaso · ciervo lunar, oso de musgo · cocodrilo ancestral, sapo de jade · íbice de cristal, grifo · qilin, tigre blanco · corcel infernal, minidragón · cuervo de la ceniza, lobo espectral · escarabajo del sol, esfinge · tortuga dragón, cangrejo rey. Un ejemplar cada una; aparece con un 4 % y reintenta cada 10–20 min; domada vuelve en 40 min.
La tabla de abajo (★9) queda superada por esta lista; todo es montura (sin mascotas todavía).

## 3. Datos propuestos por especie (★9, a confirmar con el dueño)
| Bioma | Animal | Tipo | Rol principal | Rasgos propios |
|---|---|---|---|---|
| Pradera | Caballo / poni | montura | velocidad | Galope, Estampida (dash corto) |
| Bosque | Ciervo (montura) · Lobo (mascota) | ambos | sigilo / rastreo | Sigiloso, Olfato (resalta fauna) |
| Pantano | Lagarto gigante | montura | cruza ciénaga | Paso de ciénaga, Piel anfibia |
| Cumbres | Yak | montura | carga + frío | Pelaje de nieve, Carga pesada (+ranuras) |
| Oriental | Tigre · Grulla | montura/mascota | salto largo / vigía | Salto, Vigía |
| Volcán | Salamandra | montura | cruza lava | Pezuña de lava, Aliento |
| Desierto | Camello | montura | aguante | Odre, Paso de arena |
| Costa | Tortuga marina · Foca | montura/mascota | cruza agua baja | Nadador |
| Páramo | Huargo | montura | velocidad nocturna | Visión nocturna |
Cada animal salvaje es una criatura NUEVA con su modelo (regla de no reutilizar). Montura = el modelo del salvaje + silla (accesorio por tier); NO se hace un segundo modelo.

## 4. Por qué encaja con lo que ya hay
- **Combate telegrafado** (`m.wind`, `pdCheck`, ESPACIO) → la fase de doma reutiliza ese aviso: no hay minijuego nuevo.
- **Estados `STS`** → calmar/ralentizar/asustar usan Silencio, Ralentización, Miedo ya existentes.
- **Fauna `an:1`/`fl:1` y `hunt`** → las presas ya huyen; las ferales ya persiguen.
- **Cocina/Alquimia/Ingeniería/Peletería/Herrería** aportan cebo, pienso, lazo, silla y herraduras: Domar es el oficio que MÁS cruza con los demás.
- **Mochila y ranuras:** reutiliza el patrón de ranuras dedicadas (ammo `u`, lentes `x`, mira `z`).

## 5. Riesgos y qué cuesta
1. **El mayor coste es el 3D del jinete:** el héroe sentado en la montura (pose `ride` en `heroanim3d.js`, animaciones de galope por especie, 9 modelos de montura con silla). Es trabajo de arte, no de lógica; plan: caballo primero.
2. **Colisión y terreno:** una montura grande necesita su huella (`CM`), no entra en interiores, y las rutas de cruce (lava, ciénaga, agua) tocan `TER`/`blk()`: los rasgos de terreno son la parte delicada (una sola fuente de verdad: lo dibujado decide).
3. **Equilibrio:** las monturas no deben invalidar el viaje a pie ni el viaje rápido (diseñar juntos): tope de velocidad ×2,2 y el aguante limita el galope continuo.
4. **Presupuesto 3D (§P):** una montura + héroe sumaría llamadas de dibujo (el héroe de placas ya ronda 560): medir con `R3D.budget()` en Media y Alta antes de aceptar.
5. **Contenido de cría** crece como especies × rasgos: se genera por TABLAS (como `ING`/`ENCH`), nunca a mano.

## 6. Orden propuesto de implementación (revisado 29 oct)
1. ✅ **HECHO el 29 oct 2026 (lote DOMAR-D1 en AGENTS.md) · D1 · Montura y jinete (prototipo):** caballo comprable provisionalmente, pose `ride` del héroe, multiplicador de velocidad, aguante propio, desmontar al combatir/entrar en interiores. Medir `R3D.budget()` con héroe + caballo y ver la pose a los dos zooms ANTES de seguir.
2. ✅ **HECHO el 29 oct 2026 (lote DOMAR-D2 en AGENTS.md) · D2 · Captura (BDO):** skill `dm`, lazo (Ingeniería), alerta de la criatura, fase de doma con el aviso de golpe; Domar XP.
3. ✅ **HECHO el 29 oct 2026 (lote DOMAR-D3 en AGENTS.md; por especie, hasta D4) · D3 · Progreso por uso:** nivel de la montura, **habilidades aleatorias** (pool, rareza, rangos, olvido), XP por distancia/galope.
4. ✅ **HECHO el 29 oct 2026 (lote DOMAR-D4 en AGENTS.md; faltan silla/brida, herraduras y pienso como cruces de oficio) · D4 · Establo:** guardar/sacar, genes y rasgos, silla y brida (Peletería), cebo/pienso (Cocina).
5. ✅ **HECHO el 29 oct 2026 (lote DOMAR-D5 en AGENTS.md; sin pelaje ni Tónico de cría) · D5 · Cría:** panel de cruce, gestación, herencia (genes, rasgos, habilidades), mutación, pity, retiro.
5b. **D5b · Corcel y ascensión:** lista de perfección, título, altar, `ASC` por familia y las primeras especies únicas (equinos).
6. **D6 · Más especies** (Bosque: ciervo y lobo-mascota; Cumbres: yak…) y rasgos de terreno, conforme se hagan los biomas.

## 7. Preguntas ★ para el dueño
0. Nombre: escribiste «córcel»; uso **Corcel** (ortografía correcta de «corcel»). ¿Vale?
0b. ¿Una ascensión por Corcel (irreversible, no cría) o quieres que el ascendido pueda criar?
0c. ¿Cuántas ascensiones por familia en la primera tanda (propuesta: 3 equinos, 1–2 el resto)?
1. ¿Montura y mascota a la vez como ya decidiste (2 ranuras) y una especie es de un tipo u otro?
2. ¿Cría solo dentro de la especie (propuesto) o quieres 3–4 híbridos con modelo propio más adelante?
3. ¿Gestación por tiempo de juego activo (12 min) o por **eventos** (p. ej. «cruza al dormir en la posada»)?
7. Fallo de captura: ¿la criatura huye y se reintenta (dóciles) y embiste (ferales), como se propone?
8. ¿Quieres que la fase de doma use el aviso/ESPACIO del combate o prefieres otra mecánica (p. ej. mantener la dirección contraria)?
4. ¿Límite de 3 crías por animal y de G5, o sin tope?
5. ¿Se pueden domar criaturas hostiles débiles (lobo, tigre) o solo dóciles + las ferales debilitadas con lazo?
6. ¿La montura entra en combate (embestida, escudo) o solo transporta (como OSRS)? Propuesta: solo transporta.
