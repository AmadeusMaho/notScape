# Editor de diálogos de PNJ (22 oct 2026)

Herramienta propia para cambiar lo que dicen los PNJ **sin tocar código ni pedírselo a un agente**, y que los cambios se **guarden**.

## Cómo se usa
1. Desde la raíz del repo:  `python tools/dialogos/server.py`  (puerto 8820; otro: `python tools/dialogos/server.py 9000`).
2. Abre **http://localhost:8820/tools/dialogos/editor.html** (la primera vez tarda unos segundos: lee los textos del propio juego).
3. Elige un PNJ o una misión en la lista (hay buscador y filtro «solo con cambios»), escribe, y se **guarda solo** (arriba a la derecha: «Guardado ✓ hora»).
4. Para verlo en el juego: abre **http://localhost:8820/index.html** (o recarga la página). El juego lee `data/dialogos.json` al arrancar.

## Qué se edita
- **PNJ** (≈ 90: los 3 de cada aldea — Ivo, Brenna, Orsen, comunes a las 9 aldeas —, los de cada aldea y los de la isla del Cielo).
  Cada PNJ tiene **conversaciones**; cada conversación son **páginas** (un recuadro = lo que se ve antes de pulsar para seguir).
  Si un PNJ tiene al menos una conversación tuya, el juego usa **solo las tuyas** para él y las **rota** al hablarle (1.ª vez la 1.ª, 2.ª vez la 2.ª…). Si no tiene ninguna, dice lo original.
  «Copiar como conversación mía» te deja partir de un original; «Restaurar los originales» borra tus conversaciones de ese PNJ.
- **Misiones del tutorial del Cielo** (5): nombre, saludo, descripción, recordatorio, al volver y al completar. Campo vacío = texto original.

## Dónde se guarda
- `data/dialogos.json` (formato: `{"npcs":{"<id>":{"conv":[["página","página"],…]}},"quests":{"<id del PNJ>":{"name","hi","desc","rem","turn","done"}}}`). Se puede editar a mano o versionar con git.
- Cada guardado hace una copia en `data/dialogos.backup/` (las últimas 30; no se versiona).
- El código del juego (`src/dialogos.js`, enganchado en `npcTalk` de `src/npcs.js`) solo **superpone** estos textos: los originales siguen en el código y nunca se pierden.

## Límites conocidos (a mejorar si hace falta)
- Los diálogos que el juego genera por oficio/cultura/noche se muestran como «variantes» de referencia (muestreadas con nivel 10); al editar **sustituyes todas** por tus conversaciones (no hay condiciones por noche o nivel).
- No edita los textos de objetos, tienda/banco, carteles del tablón (`quests.js`), cinemáticas ni los avisos del juego.
- Hay que recargar el juego para ver los cambios; el editor no tiene vista previa dentro del juego.
- Con la localización futura (Fase 17 de `docs/HOJA_DE_RUTA.md`) este archivo pasará a tener un bloque por idioma.
- Solo escucha en `127.0.0.1` (tu equipo).
