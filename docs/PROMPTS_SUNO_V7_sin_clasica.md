# NotScape · prompts de música para Suno (v7 · sintético-orquestal de los 2000, encanto «old-school RPG»)

**Cómo (plan free / v6-mini):** Suno → *Custom* → *Instrumental* ON → *Create* (cada pista desde cero, sin Cover). Copia **Style** en «Style», **Exclude styles** en «Exclude styles» (si no existe, ignóralo) y **Lyrics** completa en la letra. El Style es corto a propósito (≈200 caracteres); el detalle va en `[Details: …]`. Pide 2–4 min.
**Estilo de todo el juego (v7, decisión del dueño 12 oct 2026):** **sintético-orquestal de los 2000 con timbres «MIDI bonitos»**, cálido y acogedor, con el encanto de la música de un RPG de navegador veterano (loops cortos y pegadizos, instrumentos de biblioteca de sonidos, un punto de rareza simpática, nada de clímax de película). Ni 16 bits ni orquesta realista. La versión 16 bits queda archivada en `docs/PROMPTS_SUNO_16BIT.md` por si se quiere volver.
**Cada bioma suena distinto (pedido del dueño: «el jugador se aburriría»).** Cada uno tiene su modo, su compás y su carácter rítmico, y **cada pista tiene su propia melodía**: aldea = tema propio (tranquilo, otro compás), mundo = tema principal del bioma, noche = el tema del mundo MUY lento, combate = riff propio corto, jefe = remix oscuro del tema del mundo. Reparto: Pradera marcha/vals en sol mayor · Bosque síncopa juguetona y nana en re lidio · Pantano swing arrastrado en la dórico · Cumbres 3/4 y balanceo de taberna en do menor · Oriental pentatónica con silencios (hirajoshi) · Volcán pulso de tresillos en mi frigio.
**Sin guiños a otros juegos:** se quitaron las referencias tipo Zelda y los esqueletos clásicos (distraían a Suno y bajaban la calidad); cada prompt pide una buena canción con su melodía clara y ya.
**Reglas que no cambian:** aldea relajada (para craftear sin cansarse); combate normal a tempo medio (~100–112 bpm); jefe arranca de inmediato; noche hecha a mano con *Create*; el jefe final del Volcán hace desfilar los temas de los otros biomas.
**Consejos de generación:** (1) cuando una pista salga bien, copia su Style exacto en las demás del mismo bioma; (2) si suena demasiado moderna/épica, quita adjetivos del Style y deja los instrumentos; (3) si pide voces, repite «instrumental, no vocals»; (4) pide ~2–3 min: las pistas largas de Suno derivan.
**Archivos:** `assets/music/<bioma>_<tipo>.mp3` (pradera, bosque, pantano, cumbres, oriental, volcan · aldea, mundo, combate, jefe, noche).

## 0 · Pradera — medieval · «hogar» (sol mayor)
**Aldea «Posada del Trigal»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, cozy village, lute, recorder, dulcimer, soft strings, waltz 3/4, G major, 72 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: lute, recorder, hammered dulcimer and soft strings over a warm pad, round bouncing bass, gentle 3/4 waltz, G major, 72 bpm, relaxing cozy medieval inn, easy to loop]
[Intro: soft solo recorder, 8 bars]
[Verse: lute alone, theme only hinted]
[Chorus: a tender melody that falls by step, climbs back and answers itself in a gentle sequence, like a round sung by two voices, lute and recorder trading phrases, warm and softly played]
[Verse 2: small calm variation]
[Chorus: a tender melody that falls by step, climbs back and answers itself in a gentle sequence, like a round sung by two voices, lute and recorder trading phrases, a little fuller]
[Outro: fades softly]
```
**Mundo «Senda de Hierba»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, adventure overworld, tin whistle, fiddle, lute, bodhran, horns, march 4/4, G major, 112 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: tin whistle and fiddle trading a bold rising theme, strummed lute, bodhran marching beat, horn swells and bouncy staccato strings, driving 4/4 march with hopeful forward motion, setting out at sunrise, G major, 112 bpm]
[Intro: long drone, then the lead enters]
[Verse: lead plays a quieter lead-in phrase]
[Chorus: a bold rising 6-note theme starting with a dotted rhythm, tin whistle and fiddle in unison, answered a fourth higher, ending on a hopeful held note with a horn swell, full instruments, big and catchy]
[Verse 2: variation with a playful countermelody]
[Chorus: a bold rising 6-note theme starting with a dotted rhythm, tin whistle and fiddle in unison, answered a fourth higher, ending on a hopeful held note with a horn swell, even bigger]
[Bridge: stripped back, harmony shifts]
[Final Chorus: a bold rising 6-note theme starting with a dotted rhythm, tin whistle and fiddle in unison, answered a fourth higher, ending on a hopeful held note with a horn swell, modulating up a whole step, everything at once]
```
**Combate «Escaramuza»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, battle theme, fiddle, tin whistle, lute, bodhran, punchy bass, 6/8 jig, E minor, 112 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: fiddle, tin whistle, bodhran and plucked lute with punchy synth bass and brass stabs, 6/8 marching jig, E minor, 112 bpm, brave action-adventure battle, steady mid-tempo]
[Intro: drum hit, immediate riff]
[Verse: tense rhythmic riff]
[Chorus: short 4-note fiddle motif with brass stabs, repeats]
[Verse 2: variation]
[Chorus: short 4-note fiddle motif with brass stabs, repeats]
[Final Chorus: short 4-note fiddle motif with brass stabs, repeats, doubled]
```
**Jefe «Machaca-Huesos (Gruk)»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, boss battle, dark, orc war march, crumhorn, fiddle, bagpipe drone, war drums, E minor, 120 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: dark heavy remix of the Pradera overworld theme in E minor, the same bold rising dotted 6-note melody now snarling and fierce, crumhorn and fiddle in unison, low bagpipe drone, chugging lute, war drums, timpani, rattling chains, brass stabs, brutish men's war-chant choir, driving 4/4 war march at 120 bpm, building intensity]
[Intro: immediate war-drum hit and brass blast, the groove starts in the first bar, no slow build]
[Verse: the overworld theme in E minor, crumhorn and fiddle snarling]
[Chorus: the bold rising dotted 6-note theme, all instruments and war-chant choir in unison, timpani on the last note]
[Verse 2: variation, drum fills, stabbing brass]
[Chorus: same theme, choir doubles]
[Phase 2: faster, chant shouts, climax building]
[Final Chorus: the theme in full power, up a half step, everything at once]
```
**Noche «Luciérnagas»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, night, slow, sleepy, tin whistle, lute, bells, crickets, G major, 58 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: the Pradera overworld theme at half tempo, very soft: tin whistle and lute with a warm pad, twinkling bells, light viola, crickets and a faint church bell, no drums, calm and sleepy, G major, 58 bpm]
[Intro: single held note, very quiet]
[Verse: sparse hint of the theme]
[Chorus: a bold rising 6-note theme starting with a dotted rhythm, tin whistle and fiddle in unison, answered a fourth higher, ending on a hopeful held note with a horn swell, played very slowly and softly]
[Verse 2: even sparser]
[Chorus: the same theme again, softer]
[Outro: fades to ambience]
```
## 1 · Bosque — élfica · «el bosque que canta» (re lidio)
**Aldea «Casas del Dosel»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, elven village, harp, flute, celesta, soft strings, 6/8 lullaby, D lydian, 60 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: harp, flute, celesta and soft strings over an airy pad, gentle 6/8 lullaby sway, D lydian, 60 bpm, treehouse lanterns at dusk, serene and luminous]
[Intro: solo harp arpeggio, 8 bars]
[Verse: flute hints at the theme over harp]
[Chorus: a floating lullaby melody that sways between two notes and then drifts down a scale like falling leaves, harp and flute, warm and softly played]
[Verse 2: small calm variation]
[Chorus: a floating lullaby melody that sways between two notes and then drifts down a scale like falling leaves, harp and flute, a little fuller]
[Outro: fades softly]
```
**Mundo «Claro Encantado»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, enchanted forest overworld, harp, marimba, flute, pizzicato strings, bells, syncopated 4/4, D lydian, 100 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: bouncy syncopated 3+3+2 harp and marimba ostinato, flute and violins trading the melody, pizzicato cellos, woodblocks, bell accents, mid-tempo 4/4, D lydian, 100 bpm, playful lost-woods mystery, call and response, a harp glissando ends each chorus]
[Intro: harp and marimba ostinato alone, woodblocks join after four bars]
[Verse: lead plays a quieter lead-in phrase]
[Chorus: the harp asks with three quick notes climbing a pentatonic scale, the flute and violins answer leaping up a sixth and sighing down to a shimmering raised fourth, a harp glissando at the end, full instruments, big and catchy]
[Verse 2: variation with a playful countermelody]
[Chorus: the harp asks with three quick notes climbing a pentatonic scale, the flute and violins answer leaping up a sixth and sighing down to a shimmering raised fourth, a harp glissando at the end, even bigger]
[Bridge: stripped back, harmony shifts]
[Final Chorus: the harp asks with three quick notes climbing a pentatonic scale, the flute and violins answer leaping up a sixth and sighing down to a shimmering raised fourth, a harp glissando at the end, modulating up a whole step, everything at once]
```
**Combate «Caza Élfica»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, elven hunt battle, pizzicato strings, harp ostinato, flute stabs, synth bass, 7/8, D dorian, 108 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: fast pizzicato violins and violas, plucked harp ostinato, staccato flute stabs, punchy synth bass and light timpani, mischievous and brave, bouncy 7/8, D dorian, 108 bpm]
[Intro: drum hit, immediate riff]
[Verse: tense rhythmic riff]
[Chorus: three quick staccato notes climbing, answered by a high leaping sixth, over the 7/8 pulse]
[Verse 2: variation]
[Chorus: three quick staccato notes climbing, answered by a high leaping sixth, over the 7/8 pulse]
[Final Chorus: three quick staccato notes climbing, answered by a high leaping sixth, over the 7/8 pulse, doubled]
```
**Jefe «Luna de Sangre (Fenrir)»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, boss battle, dark, feral wolf, low strings, harp, timpani, howling choir, D minor, 132 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: dark heavy remix of the Bosque overworld theme in D minor, the same three-quick-notes call and sixth-leap answer now feral and relentless, galloping 6/8 at 132 bpm, low harp ostinato, tremolo violins and cellos, deep timpani and frame drum, howling choir on a falling third, dark synth pad]
[Intro: immediate timpani hit and a howl, the groove starts in the first bar, no slow build]
[Verse: the call and response in D minor, low harp asks and strings answer, cellos galloping]
[Chorus: the theme in full power, strings and harp in unison, howling choir answers with a falling third]
[Verse 2: variation, drum fills, stabbing brass]
[Chorus: same theme, choir doubles]
[Phase 2: faster, howls, climax building]
[Final Chorus: the theme in full power, up a half step, everything at once]
```
**Noche «Rocío»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, night lullaby, very slow, harp, celesta, muted flute, soft strings, D lydian, 50 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: the Bosque overworld theme at half tempo, very sparse: one harp playing the syncopated pattern like a music box, celesta like dew drops, muted flute answering, soft cello pad, no drums, D lydian, 50 bpm]
[Intro: single held note, very quiet]
[Verse: sparse hint of the theme]
[Chorus: the harp asks with three quick notes climbing a pentatonic scale, the flute and violins answer leaping up a sixth and sighing down to a shimmering raised fourth, a harp glissando at the end, played very slowly and softly]
[Verse 2: even sparser]
[Chorus: the same theme again, softer]
[Outro: fades to ambience]
```
## 2 · Pantano — palafitos · «swing arrastrado» (la dórico)
**Aldea «Pasarela de Pilotes»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, swamp village, accordion, slide guitar, upright bass, brushed drums, slow swing 12/8, A dorian, 60 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: accordion, slide guitar and upright bass with a warm pad and soft electric piano, brushed snare, slow lazy 12/8 swing, A dorian, 60 bpm, stilt houses over still water, relaxed]
[Intro: solo accordion, 8 bars]
[Verse: slide guitar hints at the tune]
[Chorus: a lazy meandering tune that slides up into each note and sighs back down, slide guitar and accordion trading phrases, warm and softly played]
[Verse 2: small calm variation]
[Chorus: a lazy meandering tune that slides up into each note and sighs back down, slide guitar and accordion trading phrases, a little fuller]
[Outro: fades softly]
```
**Mundo «Niebla Verde»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, misty swamp overworld, bass clarinet, marimba, jaw harp, wobbly bass, swung 4/4, A dorian, 72 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: bass clarinet, marimba and jaw harp with wobbly synth bass and a bubbling arpeggio, frog-like percussion, swung 4/4, A dorian, 72 bpm, cheeky and mysterious]
[Intro: long drone with frogs, then the lead enters]
[Verse: lead plays a quieter lead-in phrase]
[Chorus: a sly swung 4-note wobble (up, up, down, slide) easy to sing along, bass clarinet and accordion in unison, marimba answering, full instruments, big and catchy]
[Verse 2: variation with a playful countermelody]
[Chorus: a sly swung 4-note wobble (up, up, down, slide) easy to sing along, bass clarinet and accordion in unison, marimba answering, even bigger]
[Bridge: stripped back, harmony shifts]
[Final Chorus: a sly swung 4-note wobble (up, up, down, slide) easy to sing along, bass clarinet and accordion in unison, marimba answering, modulating up a whole step, everything at once]
```
**Combate «Chapoteo»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, swamp battle, slide guitar, harmonica, washboard, fat bass, shuffle, A minor, 100 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: slide guitar, harmonica and washboard with fat synth bass and a gritty synth lead, foot stomps, medium shuffle, A minor, 100 bpm, playful menace]
[Intro: drum hit, immediate riff]
[Verse: tense rhythmic riff]
[Chorus: slide guitar and gritty synth growl a 2-bar riff]
[Verse 2: variation]
[Chorus: slide guitar and gritty synth growl a 2-bar riff]
[Final Chorus: slide guitar and gritty synth growl a 2-bar riff, doubled]
```
**Jefe «Burbuja Mayor (Rey Ciénaga)»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, boss battle, dark, bloated, tuba, bass clarinet, slide guitar, heavy toms, choir, A minor, 96 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: dark heavy remix of the Pantano overworld theme in A minor, the same swung 4-note wobble now huge and menacing, tuba and bass clarinet in unison, wheezing accordion, wailing slide guitar, marimba tolling like a funeral bell, heavy toms, gurgling synth sub-bass, mournful choir, heavy swung 4/4 at 96 bpm]
[Intro: immediate heavy tom hit and a tuba blast, the groove starts in the first bar, no slow build]
[Verse: the wobble theme in A minor, bass clarinet and accordion, toms thudding]
[Chorus: the 4-note wobble in full power, tuba, bass clarinet and slide guitar in unison, choir moans the answer]
[Verse 2: variation, drum fills, stabbing brass]
[Chorus: same theme, choir doubles]
[Phase 2: faster, bubbling swells, climax building]
[Final Chorus: the theme in full power, up a half step, everything at once]
```
**Noche «Ranas Dormidas»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, swamp night, very slow swing, bass clarinet, marimba, kalimba, frogs, A dorian, 55 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: the Pantano overworld theme at half tempo, very soft: bass clarinet, marimba and kalimba with a dreamy pad and gentle wobbly bass, frogs and crickets, no drums, slow lazy swing, A dorian, 55 bpm]
[Intro: single held note, very quiet]
[Verse: sparse hint of the theme]
[Chorus: a sly swung 4-note wobble (up, up, down, slide) easy to sing along, bass clarinet and accordion in unison, marimba answering, played very slowly and softly]
[Verse 2: even sparser]
[Chorus: the same theme again, softer]
[Outro: fades to ambience]
```
## 3 · Cumbres — nórdica · «heroico y de taberna» (do menor)
**Aldea «Salón de Hidromiel»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, nordic tavern village, hurdy-gurdy, nyckelharpa, flute, fire, folk lilt 6/8, C minor, 76 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: hurdy-gurdy drone, nyckelharpa, wooden flute and soft frame drum with a warm pad, crackling fire, cozy swaying 6/8 folk lilt, C minor, 76 bpm, mead hall warmth]
[Intro: solo nyckelharpa, 8 bars]
[Verse: hurdy-gurdy drone and flute hint at the tune]
[Chorus: a warm swaying folk tune made of stepwise falls and a cheerful turn at the end, a tavern singalong, hurdy-gurdy and flute with men humming along, warm and softly played]
[Verse 2: small calm variation]
[Chorus: a warm swaying folk tune made of stepwise falls and a cheerful turn at the end, a tavern singalong, hurdy-gurdy and flute with men humming along, a little fuller]
[Outro: fades softly]
```
**Mundo «Paso Nevado»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, snowy mountain overworld, kantele, horns, throat choir, icy pads, majestic 3/4, C minor, 88 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: kantele, drone fiddle, throat-singing choir and distant horn with wide icy pads, majestic 3/4, C minor, 88 bpm, building layer by layer to a heroic climax, a harp glissando chime]
[Intro: long drone and ambience, then the lead enters]
[Verse: lead plays a quieter lead-in phrase]
[Chorus: a heroic singable 7-note theme that leaps an octave on the fourth note then falls back stepwise, horns and nyckelharpa in octaves, soft men's humming echo, full instruments, big and catchy]
[Verse 2: variation with a playful countermelody]
[Chorus: a heroic singable 7-note theme that leaps an octave on the fourth note then falls back stepwise, horns and nyckelharpa in octaves, soft men's humming echo, even bigger]
[Bridge: stripped back, harmony shifts]
[Final Chorus: a heroic singable 7-note theme that leaps an octave on the fourth note then falls back stepwise, horns and nyckelharpa in octaves, soft men's humming echo, modulating up a whole step, everything at once]
```
**Combate «Furia del Norte»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, nordic battle, war horns, frame drums, nyckelharpa riff, male chant, brass, march 4/4, C minor, 112 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: war horns, frame drums and a nyckelharpa riff with male chant and punchy synth brass, steady heroic 4/4 march, C minor, 112 bpm]
[Intro: drum hit, immediate riff]
[Verse: tense rhythmic riff]
[Chorus: horns and synth brass blast a heroic 4-note call, drums march]
[Verse 2: variation]
[Chorus: horns and synth brass blast a heroic 4-note call, drums march]
[Final Chorus: horns and synth brass blast a heroic 4-note call, drums march, doubled]
```
**Jefe «Ventisca (Yeti Milenario)»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, boss battle, dark, glacial, colossal, low horns, throat singing, frame drums, 3/4, C minor, 100 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: dark heavy remix of the Cumbres overworld theme in C minor, the same heroic 7-note theme that leaps an octave now colossal and glacial, low horns and nyckelharpa in octaves, deep throat-singing choir, massive frame drums, growling drone fiddle, ice-crack hits and sub-bass, crushing 3/4 at 100 bpm]
[Intro: immediate frame-drum slam and a horn blast, the groove starts in the first bar, no slow build]
[Verse: the 7-note theme in C minor, horns and nyckelharpa, frame drums hammering]
[Chorus: the octave-leaping theme in full power, horns and strings in octaves, throat-singing choir answers]
[Verse 2: variation, drum fills, stabbing brass]
[Chorus: same theme, choir doubles]
[Phase 2: faster, ice cracks, climax building]
[Final Chorus: the theme in full power, up a half step, everything at once]
```
**Noche «Aurora»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, arctic night, aurora, very slow, kantele, distant horn, icy pad, wind, 3/4, C minor, 58 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: the Cumbres overworld theme at half tempo, very soft: kantele, drone fiddle and a distant horn with a wide icy pad and glassy bell tones, faint wind, no drums, 3/4, C minor, 58 bpm]
[Intro: single held note, very quiet]
[Verse: sparse hint of the theme]
[Chorus: a heroic singable 7-note theme that leaps an octave on the fourth note then falls back stepwise, horns and nyckelharpa in octaves, soft men's humming echo, played very slowly and softly]
[Verse 2: even sparser]
[Chorus: the same theme again, softer]
[Outro: fades to ambience]
```
## 4 · Oriental — japonesa · «elegancia con silencios» (hirajoshi)
**Aldea «Jardín del Cerezo»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, japanese village, koto, ryuteki flute, wind chimes, soft taiko, hirajoshi scale, 66 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: koto, ryuteki bamboo flute and tsuzumi with a warm pad and glassy pluck, wind chimes, slow spacious 4/4, hirajoshi scale, 66 bpm, cherry blossom garden]
[Intro: solo ryuteki, 8 bars]
[Verse: koto hints at the flowing melody]
[Chorus: a flowing koto melody of gentle arpeggios with grace notes and no pauses, like light rain on a pond, ryuteki flute floating above, warm and softly played]
[Verse 2: small calm variation]
[Chorus: a flowing koto melody of gentle arpeggios with grace notes and no pauses, like light rain on a pond, ryuteki flute floating above, a little fuller]
[Outro: fades softly]
```
**Mundo «Puente Rojo»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, japanese overworld, shakuhachi, biwa, shamisen, taiko, bell arpeggio, hirajoshi, 84 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: shakuhachi, biwa, soft shamisen and taiko with a shimmering pad and bell arpeggio, meditative 4/4, hirajoshi scale, 84 bpm, koto glissando discovery chime, quest-like calm]
[Intro: long drone, then the lead enters]
[Verse: lead plays a quieter lead-in phrase]
[Chorus: an elegant 5-note pentatonic phrase that rises, pauses (a bell on the silence), then falls in a quick run, shakuhachi and koto in unison, full instruments, big and catchy]
[Verse 2: variation with a playful countermelody]
[Chorus: an elegant 5-note pentatonic phrase that rises, pauses (a bell on the silence), then falls in a quick run, shakuhachi and koto in unison, even bigger]
[Bridge: stripped back, harmony shifts]
[Final Chorus: an elegant 5-note pentatonic phrase that rises, pauses (a bell on the silence), then falls in a quick run, shakuhachi and koto in unison, modulating up a whole step, everything at once]
```
**Combate «Filo y Viento»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, japanese battle, shamisen riff, taiko, shakuhachi, tight bass, syncopated 4/4, hirajoshi, 108 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: shamisen riff, taiko and shakuhachi with tight synth bass and a bright synth lead, syncopated 4/4, hirajoshi scale, 108 bpm, measured and tense]
[Intro: drum hit, immediate riff]
[Verse: tense rhythmic riff]
[Chorus: shamisen slashes a syncopated 4-note phrase, synth lead echoes]
[Verse 2: variation]
[Chorus: shamisen slashes a syncopated 4-note phrase, synth lead echoes]
[Final Chorus: shamisen slashes a syncopated 4-note phrase, synth lead echoes, doubled]
```
**Jefe «Trueno Rojo (Oni Gigante)»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, boss battle, dark, demonic, o-daiko, shamisen, biwa, monk chant, strings, hirajoshi, 124 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: dark heavy remix of the Oriental overworld theme in hirajoshi scale, the same 5-note pentatonic phrase that rises, pauses and falls now demonic, the pause hit by a thunderous o-daiko instead of a bell, shakuhachi, shamisen and biwa in unison, monk chanting choir, soaring strings, distorted synth lead, driving syncopated 4/4 at 124 bpm]
[Intro: immediate o-daiko thunder and a shamisen slash, the groove starts in the first bar, no slow build]
[Verse: the pentatonic theme, shamisen and biwa, taiko driving]
[Chorus: the rising 5-note phrase in full power, shakuhachi, shamisen and strings in unison, o-daiko on the pause, monks chant the answer]
[Verse 2: variation, drum fills, stabbing brass]
[Chorus: same theme, choir doubles]
[Phase 2: faster, taiko rolls, climax building]
[Final Chorus: the theme in full power, up a half step, everything at once]
```
**Noche «Jardín de Luna»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, japanese night, moon garden, very slow, koto, shakuhachi, temple bell, water drops, hirajoshi, 52 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: the Oriental overworld theme at half tempo, very soft: shakuhachi, koto and biwa with a glassy pad, temple bell, water drops, no drums, sparse 4/4, hirajoshi scale, 52 bpm]
[Intro: single held note, very quiet]
[Verse: sparse hint of the theme]
[Chorus: an elegant 5-note pentatonic phrase that rises, pauses (a bell on the silence), then falls in a quick run, shakuhachi and koto in unison, played very slowly and softly]
[Verse 2: even sparser]
[Chorus: the same theme again, softer]
[Outro: fades to ambience]
```
## 5 · Volcán — mesoamericana · «ritual amenazante» (mi frigio)
**Aldea «Plaza del Templo»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, tribal village, ocarina, marimba, soft hand drums, rattles, E phrygian, 78 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: clay ocarina, quiet marimba, muted huehuetl heartbeat and soft rattles with a warm pad, round bass, warm mountain-folk feel, slow, E phrygian, 78 bpm]
[Intro: soft solo ocarina, 8 bars]
[Verse: marimba pattern alone, tune only hinted]
[Chorus: a warm rolling marimba pattern with a soft ocarina tune that rises and falls gently like heat shimmering over stone, warm and softly played]
[Verse 2: small calm variation]
[Chorus: a warm rolling marimba pattern with a soft ocarina tune that rises and falls gently like heat shimmering over stone, a little fuller]
[Outro: fades softly]
```
**Mundo «Tierra de Brasas»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, volcanic ritual overworld, bone flute, conch, teponaztli, triplet bass, brooding pads, E phrygian, 100 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: bone flute, conch shell, teponaztli and low drone with brooding pads and a triplet synth-bass pulse, slow 4/4, E phrygian, 100 bpm, dungeon-temple tension, hints of a heroic motif]
[Intro: long drone, then the lead enters]
[Verse: lead plays a quieter lead-in phrase]
[Chorus: a hypnotic ritual 5-note chant-like phrase over a pounding triplet pulse, ocarina and bone flute in unison, conch punctuating, repeating and tightening, full instruments, big and catchy]
[Verse 2: variation with a playful countermelody]
[Chorus: a hypnotic ritual 5-note chant-like phrase over a pounding triplet pulse, ocarina and bone flute in unison, conch punctuating, repeating and tightening, even bigger]
[Bridge: stripped back, harmony shifts]
[Final Chorus: a hypnotic ritual 5-note chant-like phrase over a pounding triplet pulse, ocarina and bone flute in unison, conch punctuating, repeating and tightening, modulating up a whole step, everything at once]
```
**Combate «Guerra Florida»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, ritual temple battle, huehuetl drums, ocarina riff, conch calls, synth stabs, E phrygian, 112 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: huehuetl and teponaztli, ocarina riff and conch calls with driving synth bass and sharp synth stabs, 4/4, E phrygian, 112 bpm, obsessive four-note descending motif over a pounding pulse, ominous march]
[Intro: drum hit, immediate riff]
[Verse: tense rhythmic riff]
[Chorus: ocarina and synth stab a 4-note descending call, drums charge]
[Verse 2: variation]
[Chorus: ocarina and synth stab a 4-note descending call, drums charge]
[Final Chorus: ocarina and synth stab a 4-note descending call, drums charge, doubled]
```
**Jefe «Fuego Eterno (Señor del Fuego, final)»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, final boss, monumental, ocarina, war horns, huge choir, huehuetl, full synth orchestra, E phrygian, 125 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: dark epic remix of the Volcán overworld theme in E phrygian, the same hypnotic ritual 5-note phrase over a pounding triplet pulse, now monumental, ocarina, bone flute and conch in unison, huehuetl and teponaztli, war horns, massive choir, full synth orchestra, relentless 4/4 at 125 bpm, and in the later phases the main themes of the other biomes join one by one (the whistle march, the harp call-and-response, the wobbling tuba, the octave-leaping horns, the pentatonic shakuhachi)]
[Intro: immediate huehuetl hit and a conch blast, the groove starts in the first bar, no slow build]
[Verse: the ritual 5-note phrase in E phrygian, ocarina and bone flute, triplet pulse]
[Chorus: the phrase in full power, ocarina, horns and choir in unison, conch on the last note]
[Verse 2: variation, drum fills, stabbing brass]
[Chorus: same theme, choir doubles]
[Phase 2: the themes of the other biomes join one by one over the pulse, climax building]
[Final Chorus: all themes at once, key rises a step, full power]
```
**Noche «Estrellas sobre el Cráter»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, volcano night, stars, very slow, bone flute, ocarina, low drone, embers, E phrygian, 60 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: the Volcán overworld theme at half tempo, very soft: bone flute and clay ocarina over a low drone, quiet rattles, starry pad, crackling embers, no drums, sparse 4/4, E phrygian, 60 bpm]
[Intro: single held note, very quiet]
[Verse: sparse hint of the theme]
[Chorus: a hypnotic ritual 5-note chant-like phrase over a pounding triplet pulse, ocarina and bone flute in unison, conch punctuating, repeating and tightening, played very slowly and softly]
[Verse 2: even sparser]
[Chorus: the same theme again, softer]
[Outro: fades to ambience]
```
