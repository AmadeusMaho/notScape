# NotScape · guía de música por bioma (13 oct 2026, para generar en Suno)

> ### ⚠ ESTADO (revisado el 17 oct 2026): **DOCUMENTO SUPERADO — no generes música con los prompts de este archivo**
> - **Prompts vigentes:** `docs/PROMPTS_SUNO.md` (v9). El «Banco de pistas v2» y los prompts de la primera tabla de aquí son anteriores (v1–v2) y **contradicen** a la v9 (tonalidades, uso de *Cover*, leitmotiv).
> - **Obsoleto en la primera parte (v1):** la técnica de *Cover* con la pista de la Pradera y el leitmotiv obligatorio en todos los biomas (el banco v2 ya lo descartaba), y la frase «hoy síntesis simple; F6 lo cambiará»: el juego ya reproduce archivos `assets/music/<bioma>_<tipo>.mp3` desde `src/music.js` (`MUSIC.DIRS`).
> - **Sigue valiendo como contexto de diseño:** la columna «Arquitectura / civilización» de la primera tabla (Pradera medieval, Bosque silvano, Pantano palafitos, Cumbres nórdica, Oriental japonesa, Volcán mesoamericana) y la convención de archivos y tipos de pista (aldea, mundo, combate, jefe, noche).
> - **Estado real de las pistas y créditos:** `docs/CREDITOS.md` (varias son placeholders; las 5 de la Pradera tienen copyright y son temporales) y `AGENTS.md` (registro de música).

**Leitmotiv único** (el tema de «casa», nace en la Pradera y se «remasteriza» en cada bioma con los instrumentos de esa civilización).
Motivo propuesto: 4 compases, 5 notas, cantable: **1 – 5 – 6 – 5 – 3 – 2 – 1** (do–sol–la–sol–mi–re–do) en negras/corcheas, ~80–100 BPM. Mantener **la misma tónica (re/D)** y cambiar el modo por bioma.
Truco en Suno: genera primero la Pradera; para los demás usa *Upload audio → Cover* (o *Remaster/Cover*) con esa pista y un prompt de estilo nuevo, con la influencia de audio alta, para conservar la melodía. Añade a TODOS los prompts: `same main melody, memorable 4-bar leitmotif, instrumental, loopable, no vocals` y en la letra `[Instrumental]`.

| Bioma | Arquitectura / civilización | Modo y tempo | Prompt de estilo (Suno) |
|---|---|---|---|
| 0 Pradera | **Medieval europea** (casas de piedra y paja, aldea de campesinos, campamento orco) | D mayor, ~90 BPM | `cozy medieval folk RPG theme, acoustic guitar, lute, tin whistle, light strings, soft hand drum, warm hopeful pastoral, D major, 90 bpm` |
| 1 Bosque | **Silvana** (cabañas de madera, casas-árbol, plataformas; gente del bosque/élfica) | D dórico, ~80 BPM | `mystical elven forest, harp, wooden flute, glockenspiel, soft airy choir oohs, cello pads, light wooden percussion, enchanted serene, D dorian, 80 bpm` |
| 2 Pantano | **Palafitos** (casas sobre pilotes y pasarelas; culturas ribereñas) | D menor/dórico, ~70 BPM, algo de swing | `murky swamp folk, slide dobro, upright bass, marimba, kalimba, bass clarinet, jaw harp, frog-like percussion, slow swung groove, eerie but cozy, D dorian, 70 bpm` |
| 3 Cumbres | **Nórdica** (casas de piedra y tablillas con nieve, dragones en los tejados) | D menor (eólico), ~100 BPM | `nordic folk fantasy, nyckelharpa, tagelharpa, kantele, frame drum, war horns, deep humming male choir, cold heroic yet warm, D minor, 100 bpm` |
| 4 Oriental | **Japonesa** (pagodas, torii, linternas de piedra, puentes rojos, cerezos) | pentatónica japonesa (D in/hirajoshi), ~88 BPM | `japanese fantasy theme, koto, shamisen, shakuhachi, taiko, biwa, soft bells, cherry blossom serenity building to a martial swell, pentatonic, 88 bpm` |
| 5 Volcán | **Mesoamericana** (templos escalonados de basalto, estelas, braseros) | D frigio, ~110 BPM | `mesoamerican ritual fantasy, clay ocarina, huehuetl and teponaztli drums, conch shell trumpet, bone flute, rattles, low brass drone, ominous fiery, D phrygian, 110 bpm` |

**Cómo evoluciona el motivo:** Pradera = enunciado simple y luminoso («hogar») → Bosque = misma melodía, arpa y coro etéreo → Pantano = más lenta y arrastrada, en menor → Cumbres = en octavas con cuernos, heroica → Oriental = la melodía ajustada a la pentatónica, con silencios (ma) → Volcán = fragmentada sobre un bordón grave y tambores; para el jefe final se puede hacer una versión con **todos** los instrumentos a la vez.
**Variantes opcionales por bioma** (cuando se quiera): *combate/jefe* (mismo estilo, `intense, faster tempo, driving percussion`), *noche* (`sparse, gentle, solo instrument`) y *aldea/taberna* (`cozy tavern version`). Ya existen en `assets/music`: `amber.mp3`, `tavern.mp3`, `dragon.mp3`; el código de música por bioma está en `BIOMES.list[k].music` (hoy síntesis simple; F6 lo cambiará por estos mp3).

---

# Banco de pistas v2 · «con personalidad» (5 por bioma = 30) · 12 oct 2026

**Idea:** cada pista = un **gancho** (melodía corta, repetida, que se te queda) + un **compás/ritmo con carácter** + 1–2 instrumentos protagonistas de la civilización. Sonido objetivo: banda sonora de MMORPG clásico (instrumentos tipo soundfont/orquesta de los 2000, melodía al frente, bucles de 1–2 min).
**⚠ No uses Cover entre pistas** (Suno conserva la intro, la estructura y la melodía de la pista base, por eso salen casi iguales). Genera **cada pista desde cero con *Create***. Si ya usas Cover, baja *Audio Influence* a ≤ 25 %. Para que no se parezcan: (a) **cada bioma tiene su propia tonalidad** (Pradera sol mayor, Bosque mi dórico, Pantano la dórico, Cumbres do menor, Oriental pentatónica, Volcán mi frigio; solo el jefe final vuelve a re menor con el leitmotiv), (b) **cada tipo de pista abre distinto**: añade en la letra la etiqueta de intro de la tabla de abajo, (c) los compases y tempos ya son distintos.
**Intro por tipo (ponla como primera línea de Lyrics):** aldea `[Intro: soft solo instrument, 8 bars]` · mundo `[Intro: long drone and ambience, then the lead enters]` · combate `[Intro: drum hit, immediate riff]` · jefe `[Intro: low rumble, then a heavy stinger]` · noche `[Intro: single held note, very quiet]`.
**Cómo usarlo:**
1. Suno → *Custom*, *Instrumental* ON.
2. **Style** = `retro MMORPG soundtrack, catchy lead melody, loopable, instrumental,` + el prompt de la tabla.
3. **Lyrics** = `[Instrumental]` y, debajo, la línea «gancho» de la tabla entre corchetes (ayuda a que repita la melodía).
4. Si una sale genérica, repítela cambiando solo el instrumento protagonista. Cada bioma tiene **su propio gancho**, no hace falta Cover; el leitmotiv (1–5–6–5–3–2–1) queda como hilo opcional solo en las aldeas.
**Excepción — aldeas:** son pistas de DESCANSO (pelear/craftear tranquilo): lentas (62–78 bpm), suaves, sin gancho machacón, con melodía que va cambiando para que no cansen. Pide 3–4 min y no las recortes en bucle corto.
**Carácter por bioma:** Pradera = alegre y saltarina · Bosque = misterioso y juguetón · Pantano = swing arrastrado y raro · Cumbres = heroico y de taberna · Oriental = elegante, con silencios · Volcán = ritual y amenazante.
**Archivos:** `assets/music/<bioma>_<tipo>.mp3` (bioma: pradera, bosque, pantano, cumbres, oriental, volcan; tipo: aldea, mundo, combate, jefe, noche).

## 0 · Pradera — medieval · «hogar»
| Pista | Style | Gancho (Lyrics) |
|---|---|---|
| aldea «Posada del Trigal» | `relaxed medieval village, gentle 3/4 pastoral waltz, fingerpicked lute and nylon guitar, soft tin whistle, warm cello pad, light brushed percussion, slowly evolving, never loud, G major, 72 bpm` | `[Gentle melody that wanders and changes each phrase, no repeated hook, long and calm]` |
| mundo «Senda de Hierba» | `sunny pastoral adventure, 4/4, wooden flute lead skipping over fingerpicked guitar, light strings, hand drum, carefree, G major, 100 bpm` | `[Main melody: flute hops up a major arpeggio and rolls back down, repeats]` |
| combate «Escaramuza» | `galloping medieval skirmish, 6/8, fiddle sawing fast, bodhran, pounding lute, whistle stabs, E minor, 150 bpm` | `[Main melody: short fiddle riff of 4 notes repeated, drum fills]` |
| jefe Gruk «Machaca-Huesos» | `heavy orc warlord stomp, half-time 4/4, war drums, low brass, anvil hits, detuned lute riff, men grunt chant, E minor, 90 bpm` | `[Main riff: 3-note brass hammer blow, pause, repeat]` |
| noche «Luciérnagas» | `night lullaby, 3/4, music box lead, soft lute, gentle strings, distant owl-like flute, G major, 60 bpm` | `[Main melody: music box plays a slow lullaby, very simple]` |

## 1 · Bosque — silvana · «misterio juguetón»
| Pista | Style | Gancho (Lyrics) |
|---|---|---|
| aldea «Casas del Dosel» | `calm elven treetop village, floating 5/4, soft harp arpeggios, wooden flute, glockenspiel, airy pad, distant birdsong, slow and spacious, E dorian, 66 bpm` | `[Harp phrases drift and vary, flute enters and leaves, no strong repeating hook]` |
| mundo «Claro Encantado» | `enchanted forest walk, 6/8 flowing, pan flute lead, celesta sparkles, harp arpeggios, airy choir, E dorian, 85 bpm` | `[Main melody: pan flute sways between two notes then leaps up]` |
| combate «Caza Élfica» | `elven hunt, 7/8 skipping rhythm, pizzicato strings, flute ostinato, wood blocks, hunting horn, E dorian, 145 bpm` | `[Main melody: pizzicato figure in 7, horn call on top]` |
| jefe Fenrir «Luna de Sangre» | `giant wolf boss, fast 4/4 sixteenth-note cello ostinato, howling choir, tribal drums, frantic strings, E minor, 155 bpm` | `[Main riff: cello gallops, choir howls a falling 3-note call]` |
| noche «Rocío» | `moonlit forest lullaby, 3/4, solo harp, whispered choir, crystal bells, E dorian, 55 bpm` | `[Main melody: harp plays the lullaby, bells answer]` |

## 2 · Pantano — palafitos · «swing arrastrado»
| Pista | Style | Gancho (Lyrics) |
|---|---|---|
| aldea «Pasarela de Pilotes» | `lazy swamp village evening, 12/8 slow swing, mellow kalimba, soft slide dobro, upright bass, brushed drums, gentle frog ambience, easy and sleepy, A dorian, 62 bpm` | `[Kalimba noodles lazily, new little phrase each time, dobro sighs now and then]` |
| mundo «Niebla Verde» | `murky bayou stroll, swung 4/4, bass clarinet lead, marimba, jaw harp, frog-like percussion, A dorian, 70 bpm` | `[Main melody: bass clarinet croons a sneaky chromatic phrase]` |
| combate «Chapoteo» | `swamp stomp battle, driving shuffle, resonator slide guitar riff, harmonica, foot stomps, washboard, A minor, 130 bpm` | `[Main riff: slide guitar growls a 2-bar blues riff]` |
| jefe Rey Ciénaga «Burbuja Mayor» | `swamp king boss, slow slimy groove, bubbling tuba, distorted slide guitar, gurgling sub bass, heavy toms, A phrygian, 85 bpm` | `[Main riff: tuba burbles a heavy 3-note line, drums slap]` |
| noche «Ranas Dormidas» | `foggy swamp night, 6/8 sleepy, solo kalimba, soft upright bass, distant bass clarinet, crickets, A dorian, 55 bpm` | `[Main melody: kalimba rocks gently]` |

## 3 · Cumbres — nórdica · «heroico y de taberna»
| Pista | Style | Gancho (Lyrics) |
|---|---|---|
| aldea «Salón de Hidromiel» | `cozy nordic hearth, slow 4/4, soft kantele and nyckelharpa, warm cello, low male humming pads, crackling fire, soft frame drum, peaceful, C minor, 70 bpm` | `[Kantele melody unfolds slowly, humming pads breathe, no climax, no loud drums]` |
| mundo «Paso Nevado» | `epic snowy trek, 3/4 majestic, tagelharpa drone, kantele lead, throat-singing choir, distant horn, C minor, 85 bpm` | `[Main melody: kantele rises in slow steps, horn answers far away]` |
| combate «Furia del Norte» | `viking battle charge, galloping 4/4, war horns, frame drums, fast nyckelharpa, male shout chant, C minor, 155 bpm` | `[Main riff: horns blast a heroic 4-note call, drums gallop]` |
| jefe Yeti Milenario «Ventisca» | `ancient yeti boss, crushing slow 4/4, deep throat singing, massive frame drums, ice-crack percussion, low horns, C minor, 75 bpm` | `[Main riff: drums slam, throat voice drops a slow 2-note growl]` |
| noche «Aurora» | `northern lights night, 4/4 floating, solo kantele, soft nyckelharpa, glassy bells, faint wind, C minor, 60 bpm` | `[Main melody: kantele tells a slow story, bells shimmer]` |

## 4 · Oriental — japonesa · «elegancia con silencios»
| Pista | Style | Gancho (Lyrics) |
|---|---|---|
| aldea «Jardín del Cerezo» | `peaceful japanese village, slow and spacious 4/4, soft koto, gentle shakuhachi, light wind chimes, quiet temple bell, flowing water, many silences, hirajoshi scale, 66 bpm` | `[Koto and shakuhachi trade slow phrases, never the same twice, lots of space]` |
| mundo «Puente Rojo» | `feudal japan stroll, 4/4 meditative with silences, shakuhachi lead, koto arpeggios, biwa, water drip, hirajoshi scale, 80 bpm` | `[Main melody: shakuhachi sighs two long notes then a quick falling run]` |
| combate «Filo y Viento» | `samurai duel, tense syncopated 4/4, fast shamisen riff, taiko hits, sharp shakuhachi, hirajoshi scale, 145 bpm` | `[Main riff: shamisen slashes a syncopated 4-note phrase, taiko punctuates]` |
| jefe Oni Gigante «Trueno Rojo» | `giant oni demon boss, 6/8 thunderous, o-daiko, biwa tremolo, distorted shamisen, sho cluster chords, monk chanting, 110 bpm` | `[Main riff: o-daiko booms, biwa strikes a menacing 3-note motif]` |
| noche «Jardín de Luna» | `zen garden night, 4/4 sparse, solo koto, soft shakuhachi, temple bell, water drops, 55 bpm` | `[Main melody: koto drops single notes like raindrops]` |

## 5 · Volcán — mesoamericana · «ritual amenazante»
| Pista | Style | Gancho (Lyrics) |
|---|---|---|
| aldea «Plaza del Templo» | `warm mesoamerican temple village at dusk, gentle slow rhythm, soft clay ocarina, quiet marimba, muted huehuetl heartbeat, soft rattles, low warm drone, relaxed and earthy, E phrygian, 78 bpm` | `[Ocarina melody floats over a soft pulse, shifts gradually, calm not ominous]` |
| mundo «Tierra de Brasas» | `volcanic wasteland, slow 4/4, bone flute lead, conch shell calls, low drone, teponaztli, rattles, E phrygian, 100 bpm` | `[Main melody: bone flute wails a falling minor-second motif over the drone]` |
| combate «Guerra Florida» | `aztec war, relentless 4/4, fast huehuetl and teponaztli, shrieking ocarina riff, conch calls, rattles, E phrygian, 155 bpm` | `[Main riff: ocarina shrieks a 3-note rising call, drums charge]` |
| jefe Señor del Fuego (final) «Fuego Eterno» | `final boss, epic, all instruments from every civilization at once (lute, harp, nyckelharpa, koto, taiko, huehuetl), war horns, brass, choir, D minor, 125 bpm` | `[Main melody: the leitmotif 1-5-6-5-3-2-1 in full power, brass and choir]` |
| noche «Estrellas sobre el Cráter» | `starlit ember temple night, 4/4 sparse, solo clay ocarina, low drone, soft rattles, crackling embers, E phrygian, 60 bpm` | `[Main melody: ocarina sings two slow phrases over the drone]` |

**Notas:** (1) Pide 1:30–2:00; recorta en un compás limpio para el bucle (Audacity). (2) El «gancho» es lo más importante: si Suno lo ignora, quítale instrumentos secundarios al Style. (3) Los jefes pueden salirse de su civilización; el final reúne todas y cita el leitmotiv.

---

# Leitmotiv «a lo clásico» (idea del dueño, 12 oct 2026) — melodías inspiradas, no copiadas

**Concepto:** como en Genshin con el Canon en re: se toma el *esqueleto* de una obra clásica de dominio público (progresión de acordes + contorno melódico + textura) y se le pide a Suno una melodía **nueva** con ese esqueleto. Así suena «familiar y elegante» sin ser la obra. **No nombres la obra ni al compositor en el prompt** (Suno puede rechazarlo o calcar la melodía): describe el esqueleto con palabras y números romanos. Funciona razonablemente, no está garantizado; genera 3–4 variantes y quédate con la mejor.
**Leitmotiv único propuesto:** la **cadena descendente barroca** (I–V–vi–iii–IV–I–IV–V), con una melodía que baja por grados conjuntos y vuelve a subir. Es el «hogar» de NotScape; cada bioma la viste distinto (misma progresión, otra tonalidad/instrumentos/ritmo).

| Bioma | Esqueleto clásico en el que se inspira | Fragmento de prompt (añádelo al Style de la **aldea** y del **mundo**) |
|---|---|---|
| Pradera (sol M) | Barroco: canon a varias voces sobre bajo descendente | `baroque canon-like melody over a descending ground bass, chord progression I V vi iii IV I IV V in G major, melody enters in staggered layers, simple and singable` |
| Bosque (mi dórico) | Pavana renacentista, lenta y noble | `renaissance pavane feel, slow stately 4/4, graceful stepwise melody over the same descending progression in E dorian, harp and flute in imitation` |
| Pantano (la dórico) | Sarabanda lenta con acento en el 2.º tiempo, en versión swing | `slow sarabande-like 3/4 stress on beat two, lazy swung feel, descending bass in A dorian, melody in thirds on bass clarinet and kalimba` |
| Cumbres (do menor) | Lamento barroco (bajo de pasacalle descendente en menor) | `baroque lament over a descending minor ground bass, passacaglia, building layer by layer to a heroic climax in C minor, nyckelharpa and horns` |
| Oriental (pentatónica) | Gymnopédie / Clair de Lune: arpegios suaves y armonía de colores | `impressionist soft arpeggios, floating chords, spacious and tender, melody on pentatonic notes with silences, koto and shakuhachi` |
| Volcán (mi frigio) | «Dies irae» / marcha de ogros: motivo de 4 notas obsesivo | `obsessive four-note descending motif over a pounding pulse, ominous march in E phrygian, rising tension, drums and brass` |
| Jefe final | El leitmotiv completo con todas las texturas | `the descending-progression theme in full orchestral power, brass and choir, all earlier instruments joining one by one, D minor` |

**Cómo usarlo:** en cada bioma pega el fragmento en el Style de **aldea** y **mundo** (las pistas donde manda el leitmotiv); combate, jefe y noche mantienen sus prompts de carácter. En *Lyrics*, `[Instrumental]` y, si quieres refuerzo, `[Main melody: stepwise descending line, repeats an octave higher]`.
**Para probar primero:** Pradera-aldea. Si te gusta cómo queda el «aire de canon», lo replico en las otras.
