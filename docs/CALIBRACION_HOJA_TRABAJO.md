# Calibración de la Hoja de trabajo (Herrería) — 22 oct 2026

Salida de `node tools/work_sim.js sm 10` con las constantes de `WK.K` (src/work.js): `PO0 120, PO1 5, PROG0 2.6, PROG1 .5, PCAP 10.5, QUAL0 5, QUAL1 .6, QUAL2 .8, QCAP 150`, durabilidad 60/70/80.
Columnas: éxito % · calidad superior media % (solo piezas hechas) · pasos por pieza. «Spam» = solo Síntesis básica; «torpe» = tres toques y luego Síntesis básica; «experto» = planificador `WK.suggest`.

```
oficio sm · 10 piezas por celda · formato: éxito% hq% pasos
receta | jugador=receta: spam | torpe | experto || jugador=receta+20: spam | torpe | experto
nv 1    | 100% hq  0 p 3.0 | 100% hq  0 p 3.0 | 100% hq  0 p 3.0 || 100% hq  0 p 3.0 | 100% hq 90 p 6.0 | 100% hq100 p 5.4
nv 3    | 100% hq  0 p 4.0 | 100% hq  0 p 4.0 | 100% hq  0 p 4.0 || 100% hq  0 p 3.0 | 100% hq 79 p 6.0 | 100% hq100 p 5.4
nv 5    | 100% hq  0 p 5.0 |   0% hq  - p 6.0 | 100% hq 17 p 6.0 || 100% hq  0 p 4.0 |   0% hq  - p 6.0 | 100% hq100 p 8.3
nv 8    | 100% hq  0 p 6.0 |   0% hq  - p 6.0 | 100% hq 49 p10.0 || 100% hq  0 p 5.0 |   0% hq  - p 6.0 | 100% hq100 p 9.9
nv10    |   0% hq  - p 6.0 |   0% hq  - p 6.0 | 100% hq 24 p10.0 || 100% hq  0 p 6.0 |   0% hq  - p 6.0 | 100% hq 99 p 9.3
nv15    |   0% hq  - p 6.0 |   0% hq  - p 6.0 | 100% hq 23 p 8.8 ||   0% hq  - p 6.0 |   0% hq  - p 6.0 | 100% hq 97 p10.5
nv20    |   0% hq  - p 6.0 |   0% hq  - p 6.0 | 100% hq 27 p 9.1 ||   0% hq  - p 6.1 |   0% hq  - p 6.1 | 100% hq 91 p12.0
nv30    |   0% hq  - p 7.0 |   0% hq  - p 7.0 | 100% hq 38 p11.1 ||  10% hq  0 p 7.0 |   0% hq  - p 7.1 | 100% hq 99 p12.8
nv40    |   0% hq  - p 7.1 |   0% hq  - p 7.1 | 100% hq 48 p12.7 ||  10% hq  0 p 7.0 |   0% hq  - p 7.0 | 100% hq100 p13.3
nv50    |   0% hq  - p 7.2 |   0% hq  - p 7.2 | 100% hq 57 p13.2 ||  10% hq  0 p 7.1 |   0% hq  - p 7.1 | 100% hq 99 p15.0
nv60    |   0% hq  - p 8.0 |   0% hq  - p 8.0 | 100% hq 68 p16.5 || 100% hq  0 p 8.0 |   0% hq  - p 8.1 | 100% hq 96 p17.1
nv70    |  40% hq  0 p 8.4 |   0% hq  - p 8.4 | 100% hq 57 p18.5 || 100% hq  0 p 8.0 |   0% hq  - p 8.0 | 100% hq 73 p21.4
nv80    |  40% hq  0 p 8.4 |   0% hq  - p 8.4 | 100% hq 58 p17.9 || 100% hq  0 p 8.0 |   0% hq  - p 8.1 | 100% hq 71 p23.8
nv90    |  20% hq  0 p 8.2 |   0% hq  - p 8.2 | 100% hq 55 p21.2 ||  30% hq  0 p 8.3 |   0% hq  - p 8.3 | 100% hq 64 p24.0
nv99    |   0% hq  - p 8.0 |   0% hq  - p 8.0 | 100% hq 53 p23.9 ||   0% hq  - p 8.0 |   0% hq  - p 8.0 | 100% hq 53 p23.9
```

**Lectura:** spam falla desde recetas de nivel ≥ 10 (solo valen las de nivel ≤ 8, que garantizan el tutorial); el planificador completa el 100 % con 6–25 pasos; la calidad media del experto sube de 17 a ≈ 55–70 % al nivel de la receta y llega a 90–100 % con +20 niveles (a nivel alto 55–73 %: techo duro, mejora con equipo y estados). Un jugador humano estará por debajo del planificador. **Para otro oficio:** `node tools/work_sim.js <oficio> [N] '{"PCAP":10}' 1,10,40,99` y ajustar `WK.K`.
