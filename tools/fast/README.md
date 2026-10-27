# tools/fast — verificar rápido sin GPU (para TODO agente)

Problema: en el sandbox no hay GPU (SwiftShader) y cada prueba recargaba el juego entero (minutos). Solución: **una sesión de navegador persistente** con el juego ya cargado + ganchos de prueba. Úsala siempre que cambies algo visible o de lógica; no lances un script nuevo de Playwright por cada comprobación.

## Flujo (copiar y pegar, desde la raíz del repo)
```
python3 tools/fast/ns.py start --no3d          # 1 vez (~20-60 s). Arranca servidor 8811 + navegador. --no3d = solo HUD/DOM, cero coste 3D
python3 tools/fast/ns.py eval "NSTEST.target('goblin')"   # JS en la página, <1 s
python3 tools/fast/ns.py shot /tmp/a.png --sel '#hs'      # captura SOLO del HUD (o sin --sel: pantalla completa). Luego `Read` de la imagen
python3 tools/fast/ns.py css                    # tras editar css/*.css: recarga las hojas sin recargar el juego (instantáneo)
python3 tools/fast/ns.py logs                   # errores de consola/página acumulados (míralos SIEMPRE)
python3 tools/fast/ns.py reload                 # tras editar .js (vuelve a cargar; con --no3d ~20 s)
python3 tools/fast/ns.py stop                   # al terminar
```
**`--gpu`**: usa la GPU REAL del PC (ventana visible) en lugar de SwiftShader (software): carga rápida y mediciones de fps/ms válidas. Úsala en un PC con GPU.
Opciones de `start`: `--url '?r3d=1&test=1&noedit&at=4600,15152'` · `--w 800 --h 500` (menos píxeles = más rápido; el HUD escala) · `--q 4` (calidad 0 máxima … 4 mínima; por defecto 4 = más rápido).

## Qué usar según lo que compruebes
| Compruebas | Cómo | Tiempo |
|---|---|---|
| HUD / paneles / texto / CSS | `--no3d`, `NSTEST.*` para poner estado, `shot --sel '#hs'` , `css` | segundos |
| Lógica (combate, XP, inventario) | `eval` con las globales del juego (`S,P,A,M,gain,…`), sin captura | <1 s |
| Aspecto 3D (luz, props, terreno) | `eval "NSTEST.no3d(false)"`, `NSTEST.tp(x,y)`, `NSTEST.hour('noche')`, `shot --wait 12` | ~25 s por captura |
| Errores JS tras un cambio | `logs` (y `reload` si tocaste JS) | — |

## Ganchos `NSTEST` (src/testhooks.js, solo con `?test=1`; **añade aquí los que necesites** y documéntalos)
`tp(x,y)` · `hour('dia'|'atardecer'|'noche'|'amanecer'|segundos)` / `time(s|null)` (congela el reloj de juego; el reloj del HUD no cambia) · `hp(n)` `mana(n)` `xp(sk,n)` · `banner(t,s)` · `tab('inv'|…)` · `zoom(i)` · `quality(0..4|'a')` · `spawn(id,dx,dy)` `mobs(r)` `target(id,dmg)` `untarget()` · `no3d(true|false)` · `frames(n)` · `info()` · `ready()`.
También por URL: `?test=1&hour=noche&at=x,y&hp=5&spawn=goblin&target=goblin&no3d=1`.

## Trampas
- Un solo comando a la vez; el demonio los encola. La captura 3D en SwiftShader tarda ~25 s: no lo repitas sin necesidad.
- `pkill -f "texto"` dentro de un comando que contiene ese texto mata tu propia shell; para parar usa `ns.py stop`.
- Tras `NSTEST.hour(...)` el reloj del juego queda congelado; `NSTEST.time(null)` lo suelta.
- SwiftShader NO sirve para medir fps; el aspecto final lo juzga el dueño en su GPU.


## Ratón real (22 oct 2026)
`ns.py mouse '[{"t":"move","x":100,"y":100},{"t":"down"},{"t":"move","x":300,"y":200,"steps":8},{"t":"wait","ms":500},{"t":"up"}]'` usa el ratón de Playwright (no eventos sintéticos): necesario para probar hover, arrastres y cualquier cosa que dependa de `:hover`/iconos 3D.
