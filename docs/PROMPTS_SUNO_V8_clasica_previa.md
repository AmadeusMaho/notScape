# NotScape · prompts de música para Suno (v8 · sintético-orquestal de los 2000 sobre esqueletos de música clásica)

**Cómo (plan free / v6-mini):** Suno → *Custom* → *Instrumental* ON → *Create* (cada pista desde cero, sin Cover). Copia **Style** en «Style», **Exclude styles** en «Exclude styles» (si no existe, ignóralo) y **Lyrics** completa en la letra. El Style es corto a propósito (≈200 caracteres); el detalle va en `[Details: …]`. Pide 2–4 min.
**Estilo de todo el juego:** **sintético-orquestal de los 2000 con timbres «MIDI bonitos»**, cálido y acogedor, con encanto de RPG veterano (loops pegadizos, instrumentos de biblioteca de sonidos, nada de clímax de película). Ni 16 bits ni orquesta realista. Versión 16 bits archivada en `docs/PROMPTS_SUNO_16BIT.md`; la v7 (sin esqueletos clásicos) en `docs/PROMPTS_SUNO_V7_sin_clasica.md`.
**Esqueletos de música clásica (v8, pedido del dueño: «la música de IA siempre suena parecida»).** Cada pista toma la ESTRUCTURA de una obra clásica muy conocida (progresión de acordes, bajo, ritmo, forma) pero con **melodía original** y el instrumental de su civilización; el **estribillo es la parte donde el esqueleto se reconoce de golpe, con todos los instrumentos**. Dentro de los prompts nunca se nombra la obra ni el compositor (solo se describe): los nombres aquí son para ti.

| Bioma | Aldea | Mundo (y su noche, lenta) | Combate | Jefe (remix del mundo) |
|---|---|---|---|---|
| 0 Pradera | Canon de Pachelbel | final de Guillermo Tell (galope de fanfarria) | Marcha turca de Mozart (rondó) | Quinta de Beethoven (golpe 3 cortas + 1 larga) |
| 1 Bosque | Aire de la cuerda de sol | La primavera de Vivaldi (tríada y trinos) | Danza del hada de azúcar | Una noche en el monte pelado |
| 2 Pantano | Gymnopédie de Satie | Marcha fúnebre de una marioneta | Danza macabra | Marcha fúnebre de Chopin |
| 3 Cumbres | Oda a la alegría (taberna) | Finlandia de Sibelius (coral de metales) | En la gruta del rey de la montaña | El invierno de Vivaldi |
| 4 Oriental | Arabesque de Debussy | Largo de la «Nuevo Mundo» (pentatónica) | Danza de los caballeros (Prokofiev) | Marte, de Holst (5/4) |
| 5 Volcán | Preludio en do de Bach (arpegios) | Bolero de Ravel (hipnótico, entra uno a uno) | Dies irae | O Fortuna (Carmina Burana) |
Noches (acompañamiento sobre el tema del mundo muy lento): Pradera nana tipo Brahms · Bosque arpegios tipo Claro de luna · Pantano tresillos tipo Claro de luna/Sonata Lunar · Cumbres coral lento · Oriental rubato tipo Satie · Volcán Adagio de cuerdas con suspensiones.
**Cada pista tiene su propia melodía y cada bioma su carácter** (Pradera marcha/vals, Bosque síncopa y nana, Pantano swing arrastrado, Cumbres 3/4 y taberna, Oriental pentatónica, Volcán tresillos). Reglas fijas: aldea relajada; combate normal a tempo medio (~100–112 bpm); jefe arranca de inmediato y es un remix oscuro del mundo; noche = tema del mundo muy lento, hecho a mano con *Create*; el jefe final del Volcán hace desfilar los temas de los otros biomas.
**Consejos de generación:** (1) cuando una pista salga bien, copia su Style exacto en las demás del bioma; (2) si Suno copia demasiado la obra original, añade «original melody» al principio de la letra o cambia la tonalidad un tono; (3) si pide voces, repite «instrumental, no vocals»; (4) pide ~2–3 min.
**Archivos:** `assets/music/<bioma>_<tipo>.mp3` (pradera, bosque, pantano, cumbres, oriental, volcan · aldea, mundo, combate, jefe, noche).

## 0 · Pradera — medieval · «hogar» (sol mayor)
**Aldea «Posada del Trigal»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, cozy village, baroque canon, ground bass, lute, recorder, strings, waltz 3/4, G major, 72 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: a looping eight-chord descending ground bass (I V vi iii IV I IV V) under a gentle melody that enters in staggered layers like a round; lute, recorder, hammered dulcimer and soft strings with a warm pad, round bass, 3/4 waltz, G major, 72 bpm, relaxing cozy medieval inn]
[Intro: lute plays the looping bass alone, 8 bars]
[Verse: the first melody layer enters quietly]
[Chorus: the sweet melody enters alone on lute, is imitated two bars later by recorder and again by soft strings, all piling up over the same looping descending bass, the chorus is where all three layers sound together, warm and softly played]
[Verse 2: small calm variation]
[Chorus: the sweet melody enters alone on lute, is imitated two bars later by recorder and again by soft strings, all piling up over the same looping descending bass, the chorus is where all three layers sound together, a little fuller]
[Outro: fades softly]
```
**Mundo «Senda de Hierba»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, adventure overworld, galloping fanfare march, tin whistle, fiddle, horns, bodhran, G major, 112 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: a galloping fanfare march with short repeated phrases that climb to a triumphant cadence; tin whistle and fiddle trading the theme, strummed lute, bodhran gallop beat, horn swells, bouncy staccato strings, hopeful sunrise, G major, 112 bpm]
[Intro: long drone, then the lead enters]
[Verse: lead plays a quieter lead-in phrase]
[Chorus: a galloping fanfare theme: three quick same-pitch notes then a rising leap, repeated and climbing, then a triumphant held note, tin whistle and horns in unison over a driving gallop, each strain clearly repeated, full instruments, big and catchy]
[Verse 2: variation with a playful countermelody]
[Chorus: a galloping fanfare theme: three quick same-pitch notes then a rising leap, repeated and climbing, then a triumphant held note, tin whistle and horns in unison over a driving gallop, each strain clearly repeated, even bigger]
[Bridge: stripped back, harmony shifts]
[Final Chorus: a galloping fanfare theme: three quick same-pitch notes then a rising leap, repeated and climbing, then a triumphant held note, tin whistle and horns in unison over a driving gallop, each strain clearly repeated, modulating up a whole step, everything at once]
```
**Combate «Escaramuza»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, battle theme, bouncy staccato rondo, fiddle, tin whistle, lute, snare, E minor, 112 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: a bouncy staccato rondo refrain decorated with quick grace-note turns that keeps returning between contrasting episodes; fiddle and tin whistle in unison, plucked lute, march snare, punchy synth bass, brass stabs, steady mid-tempo, E minor, 112 bpm]
[Intro: drum hit, immediate riff]
[Verse: tense rhythmic riff]
[Chorus: the bouncy grace-note refrain returns, fiddle and whistle in unison with brass stabs]
[Verse 2: variation]
[Chorus: the bouncy grace-note refrain returns, fiddle and whistle in unison with brass stabs]
[Final Chorus: the bouncy grace-note refrain returns, fiddle and whistle in unison with brass stabs, doubled]
```
**Jefe «Machaca-Huesos (Gruk)»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, boss battle, dark orc war march, hammering motif, crumhorn, war drums, brass, E minor, 120 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: a dark heavy remix of the Pradera overworld galloping fanfare in E minor, each phrase punched by a short-short-short-long hammering motif; crumhorn and fiddle in unison, low bagpipe drone, war drums, timpani, rattling chains, brass stabs, brutish men's war-chant choir, driving 4/4 war march at 120 bpm]
[Intro: immediate war-drum hit and the hammering motif, the groove starts in the first bar, no slow build]
[Verse: the galloping fanfare in E minor, crumhorn and fiddle snarling]
[Chorus: the galloping theme in full power, every phrase punched by the short-short-short-long hammer blow, war-chant choir]
[Verse 2: variation, drum fills, stabbing brass]
[Chorus: same theme, choir doubles]
[Phase 2: faster, chant shouts, climax building]
[Final Chorus: the theme in full power, up a half step, everything at once]
```
**Noche «Luciérnagas»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, night lullaby, very slow, tin whistle, lute, bells, crickets, G major, 58 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: the Pradera overworld galloping fanfare theme slowed to a sleepy lullaby sway at 58 bpm over a gentle rocking three-beat pattern; tin whistle and lute with a warm pad, twinkling bells, crickets, faint church bell, no drums]
[Intro: single held note, very quiet]
[Verse: sparse hint of the theme]
[Chorus: a galloping fanfare theme: three quick same-pitch notes then a rising leap, repeated and climbing, then a triumphant held note, tin whistle and horns in unison over a driving gallop, each strain clearly repeated, played very slowly and softly]
[Verse 2: even sparser]
[Chorus: the same theme again, softer]
[Outro: fades to ambience]
```
## 1 · Bosque — élfica · «el bosque que canta» (re lidio)
**Aldea «Casas del Dosel»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, elven village, slow baroque air, violin, harp, flute, walking bass, D lydian, 60 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: a slow baroque air for strings: one long singing violin line with suspensions over a steady walking bass in octaves; violin, harp, flute and celesta over an airy pad, very slow 4/4, D lydian, 60 bpm, treehouse lanterns at dusk]
[Intro: walking bass and harp alone, 8 bars]
[Verse: violin enters on a long note]
[Chorus: one long sustained singing melody with gentle suspensions, slowly stepping up and sighing back down, violin lead with harp arpeggios over a steady walking bass in octaves, the chorus is the long line at full warmth, warm and softly played]
[Verse 2: small calm variation]
[Chorus: one long sustained singing melody with gentle suspensions, slowly stepping up and sighing back down, violin lead with harp arpeggios over a steady walking bass in octaves, the chorus is the long line at full warmth, a little fuller]
[Outro: fades softly]
```
**Mundo «Claro Encantado»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, enchanted forest overworld, spring birdsong, rising triad fanfare, violins, flute, harp, D lydian, 100 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: a bright rising-triad spring fanfare answered by trilling birdsong figures, quick lively call and response; violins, flute, harp, marimba, pizzicato cellos, bell accents, mid-tempo 4/4, D lydian, 100 bpm, playful lost-woods mystery]
[Intro: harp and birdsong flute trills alone]
[Verse: lead plays a quieter lead-in phrase]
[Chorus: a bright rising triad fanfare in the violins answered by a trilling birdsong figure on flute and harp, repeated and varied, clear call and response, harp glissando at the end, full instruments, big and catchy]
[Verse 2: variation with a playful countermelody]
[Chorus: a bright rising triad fanfare in the violins answered by a trilling birdsong figure on flute and harp, repeated and varied, clear call and response, harp glissando at the end, even bigger]
[Bridge: stripped back, harmony shifts]
[Final Chorus: a bright rising triad fanfare in the violins answered by a trilling birdsong figure on flute and harp, repeated and varied, clear call and response, harp glissando at the end, modulating up a whole step, everything at once]
```
**Combate «Caza Élfica»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, elven hunt battle, staccato celesta melody, pizzicato strings, flute, bass, D dorian, 108 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: a staccato descending-scale melody on celesta and flute over a bouncing pizzicato bass, playful but tense; harp ostinato, punchy synth bass, light timpani, 4/4, D dorian, 108 bpm]
[Intro: drum hit, immediate riff]
[Verse: tense rhythmic riff]
[Chorus: the staccato descending scale on celesta and flute, pizzicato bass bouncing, harp glissando at the end]
[Verse 2: variation]
[Chorus: the staccato descending scale on celesta and flute, pizzicato bass bouncing, harp glissando at the end]
[Final Chorus: the staccato descending scale on celesta and flute, pizzicato bass bouncing, harp glissando at the end, doubled]
```
**Jefe «Luna de Sangre (Fenrir)»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, boss battle, dark, swirling tremolo strings, howling choir, timpani, D minor, 132 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: a dark remix of the Bosque spring fanfare in D minor with swirling tremolo violin runs and descending chromatic figures like a witches' gathering; low harp ostinato, cellos galloping, deep timpani, howling choir on a falling third, dark synth pad, 6/8 at 132 bpm]
[Intro: immediate timpani hit and a howl, the groove starts in the first bar, no slow build]
[Verse: the rising triad fanfare in D minor, swirling violin runs under it]
[Chorus: the fanfare in full power, swirling runs and howling choir on a falling third]
[Verse 2: variation, drum fills, stabbing brass]
[Chorus: same theme, choir doubles]
[Phase 2: faster, howls, climax building]
[Final Chorus: the theme in full power, up a half step, everything at once]
```
**Noche «Rocío»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, night lullaby, very slow, harp arpeggios, celesta, muted flute, strings, D lydian, 50 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: the Bosque spring fanfare theme at half tempo, very sparse, over flowing broken-chord harp arpeggios like moonlight; harp, celesta like dew drops, muted flute, soft cello pad, no drums]
[Intro: single held note, very quiet]
[Verse: sparse hint of the theme]
[Chorus: a bright rising triad fanfare in the violins answered by a trilling birdsong figure on flute and harp, repeated and varied, clear call and response, harp glissando at the end, played very slowly and softly]
[Verse 2: even sparser]
[Chorus: the same theme again, softer]
[Outro: fades to ambience]
```
## 2 · Pantano — palafitos · «swing arrastrado» (la dórico)
**Aldea «Pasarela de Pilotes»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, swamp village, slow sway, accordion, slide guitar, upright bass, soft piano, A dorian, 60 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: a slow three-beat sway of a low bass note followed by a soft offbeat chord, with a dreamy melody floating above; accordion, slide guitar, upright bass and soft electric piano, lazy swing feel, A dorian, 60 bpm, stilt houses over still water]
[Intro: bass-then-chord sway alone, 8 bars]
[Verse: accordion hints at the melody]
[Chorus: a dreamy meandering melody floating over a slow bass-note-then-soft-chord sway, accordion and slide guitar trading long phrases, very spacious, warm and softly played]
[Verse 2: small calm variation]
[Chorus: a dreamy meandering melody floating over a slow bass-note-then-soft-chord sway, accordion and slide guitar trading long phrases, very spacious, a little fuller]
[Outro: fades softly]
```
**Mundo «Niebla Verde»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, misty swamp overworld, comic sinister march, bass clarinet, marimba, tuba, A dorian, 72 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: a comic-sinister staccato march with a wobbling theme in a low reed voice; bass clarinet, tuba, marimba, jaw harp, wobbly synth bass, frog-like percussion, swung 4/4, A dorian, 72 bpm]
[Intro: long drone with frogs, then the lead enters]
[Verse: lead plays a quieter lead-in phrase]
[Chorus: a wobbling staccato march tune on bass clarinet and tuba, sly and mischievous (up, up, down, slide), answered by marimba, comic and slightly sinister, full instruments, big and catchy]
[Verse 2: variation with a playful countermelody]
[Chorus: a wobbling staccato march tune on bass clarinet and tuba, sly and mischievous (up, up, down, slide), answered by marimba, comic and slightly sinister, even bigger]
[Bridge: stripped back, harmony shifts]
[Final Chorus: a wobbling staccato march tune on bass clarinet and tuba, sly and mischievous (up, up, down, slide), answered by marimba, comic and slightly sinister, modulating up a whole step, everything at once]
```
**Combate «Chapoteo»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, swamp battle, ghostly minor dance, marimba bones, slide guitar, shuffle, A minor, 100 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: a ghostly minor dance with a descending tritone call, marimba and bone-rattle percussion, a lurching rhythm; slide guitar, harmonica, washboard, fat synth bass, A minor, 100 bpm, playful menace]
[Intro: drum hit, immediate riff]
[Verse: tense rhythmic riff]
[Chorus: the descending call on marimba and slide guitar over the lurching dance]
[Verse 2: variation]
[Chorus: the descending call on marimba and slide guitar over the lurching dance]
[Final Chorus: the descending call on marimba and slide guitar over the lurching dance, doubled]
```
**Jefe «Burbuja Mayor (Rey Ciénaga)»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, boss battle, dark, slow funeral dirge march, tuba, tolling bells, choir, A minor, 96 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: a heavy funeral dirge march: the Pantano wobbling theme slowed into a crushing dirge, tolling marimba bell on every bar, tuba and bass clarinet in unison, wheezing accordion, heavy toms, gurgling sub-bass, mournful choir, 4/4 at 96 bpm]
[Intro: immediate heavy tom hit and a tolling bell, the groove starts in the first bar, no slow build]
[Verse: the wobbling theme as a dirge, tuba and bass clarinet in unison]
[Chorus: the dirge theme in full power, tuba, slide guitar and choir moaning, bell tolling on every bar]
[Verse 2: variation, drum fills, stabbing brass]
[Chorus: same theme, choir doubles]
[Phase 2: faster, bubbling swells, climax building]
[Final Chorus: the theme in full power, up a half step, everything at once]
```
**Noche «Ranas Dormidas»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, night lullaby, very slow, moonlight triplets, bass clarinet, marimba, kalimba, frogs, A dorian, 55 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: the Pantano comic march theme slowed to a lazy lullaby at 55 bpm over steady rolling triplet arpeggios like moonlight; bass clarinet, marimba and kalimba, dreamy pad, frogs and crickets, no drums]
[Intro: single held note, very quiet]
[Verse: sparse hint of the theme]
[Chorus: a wobbling staccato march tune on bass clarinet and tuba, sly and mischievous (up, up, down, slide), answered by marimba, comic and slightly sinister, played very slowly and softly]
[Verse 2: even sparser]
[Chorus: the same theme again, softer]
[Outro: fades to ambience]
```
## 3 · Cumbres — nórdica · «heroico y de taberna» (do menor)
**Aldea «Salón de Hidromiel»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, nordic tavern village, singalong hymn tune, hurdy-gurdy, nyckelharpa, flute, C minor, 76 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: a joyful stepwise singalong hymn tune in four balanced phrases; hurdy-gurdy drone, nyckelharpa, wooden flute and soft frame drum with a warm pad and crackling fire, cozy swaying 6/8, C minor, 76 bpm, mead hall warmth]
[Intro: solo nyckelharpa, 8 bars]
[Verse: hurdy-gurdy and flute hint at the tune]
[Chorus: a warm stepwise tune that rises and falls in a simple four-phrase hymn shape, hurdy-gurdy and flute with men humming along like a tavern singalong, the chorus is the whole hall joining in, warm and softly played]
[Verse 2: small calm variation]
[Chorus: a warm stepwise tune that rises and falls in a simple four-phrase hymn shape, hurdy-gurdy and flute with men humming along like a tavern singalong, the chorus is the whole hall joining in, a little fuller]
[Outro: fades softly]
```
**Mundo «Paso Nevado»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, snowy mountain overworld, brooding brass chorale into broad hymn, horns, kantele, strings, C minor, 88 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: slow brooding brass chords that blossom into a broad patriotic hymn; horns, kantele, drone fiddle, throat-singing choir pad, wide icy pads, majestic 3/4, C minor, 88 bpm, a harp glissando chime]
[Intro: low brass chords and ambience, then the hymn enters]
[Verse: lead plays a quieter lead-in phrase]
[Chorus: a broad hymn-like melody on horns and strings that blossoms from low brooding brass chords, with a noble octave leap and a long held note, building to a heroic climax, full instruments, big and catchy]
[Verse 2: variation with a playful countermelody]
[Chorus: a broad hymn-like melody on horns and strings that blossoms from low brooding brass chords, with a noble octave leap and a long held note, building to a heroic climax, even bigger]
[Bridge: stripped back, harmony shifts]
[Final Chorus: a broad hymn-like melody on horns and strings that blossoms from low brooding brass chords, with a noble octave leap and a long held note, building to a heroic climax, modulating up a whole step, everything at once]
```
**Combate «Furia del Norte»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, nordic battle, creeping stepwise ostinato, low strings, brass stabs, frame drums, C minor, 112 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: a creeping stepwise ostinato in low strings that repeats and grows louder, then brass stabs and stomping drums; nyckelharpa, war horns, male chant, punchy synth brass, steady 4/4, C minor, 112 bpm]
[Intro: drum hit, immediate riff]
[Verse: tense rhythmic riff]
[Chorus: the creeping ostinato grows, then horns and brass stabs blast over stomping drums]
[Verse 2: variation]
[Chorus: the creeping ostinato grows, then horns and brass stabs blast over stomping drums]
[Final Chorus: the creeping ostinato grows, then horns and brass stabs blast over stomping drums, doubled]
```
**Jefe «Ventisca (Yeti Milenario)»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, boss battle, dark, icy stabbing chords, fast violin runs, horns, frame drums, 3/4, C minor, 100 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: a dark remix of the Cumbres brass-chorale hymn in C minor with icy stabbing repeated chords and fast driving violin runs; low horns, deep throat-singing choir, massive frame drums, ice-crack hits and sub-bass, crushing 3/4 at 100 bpm]
[Intro: immediate frame-drum slam and a horn blast, the groove starts in the first bar, no slow build]
[Verse: the brooding chorale theme in C minor, stabbing chords and violin runs]
[Chorus: the hymn in full power, horns and strings in octaves, throat-singing choir answers]
[Verse 2: variation, drum fills, stabbing brass]
[Chorus: same theme, choir doubles]
[Phase 2: faster, ice cracks, climax building]
[Final Chorus: the theme in full power, up a half step, everything at once]
```
**Noche «Aurora»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, arctic night, aurora, very slow chorale, kantele, distant horn, icy pad, wind, C minor, 58 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: the Cumbres broad hymn theme at half tempo, very soft, over a slow chorale of sustained chords; kantele, drone fiddle, distant horn, wide icy pad, glassy bells, faint wind, no drums, 3/4]
[Intro: single held note, very quiet]
[Verse: sparse hint of the theme]
[Chorus: a broad hymn-like melody on horns and strings that blossoms from low brooding brass chords, with a noble octave leap and a long held note, building to a heroic climax, played very slowly and softly]
[Verse 2: even sparser]
[Chorus: the same theme again, softer]
[Outro: fades to ambience]
```
## 4 · Oriental — japonesa · «elegancia con silencios» (hirajoshi)
**Aldea «Jardín del Cerezo»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, japanese village, flowing arpeggios, koto, ryuteki flute, wind chimes, hirajoshi, 66 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: an impressionist piece of continuously flowing broken-chord arpeggios; koto, ryuteki bamboo flute and tsuzumi with a warm pad and glassy pluck, wind chimes, slow spacious 4/4, hirajoshi scale, 66 bpm, cherry blossom garden]
[Intro: solo ryuteki, 8 bars]
[Verse: koto hints at the flowing arpeggio]
[Chorus: flowing arpeggio figures with grace notes and no pauses, koto rippling like light rain on a pond, ryuteki flute floating above, the chorus is the arpeggios at their fullest, warm and softly played]
[Verse 2: small calm variation]
[Chorus: flowing arpeggio figures with grace notes and no pauses, koto rippling like light rain on a pond, ryuteki flute floating above, the chorus is the arpeggios at their fullest, a little fuller]
[Outro: fades softly]
```
**Mundo «Puente Rojo»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, japanese overworld, calm pentatonic homecoming tune, shakuhachi, biwa, koto, taiko, hirajoshi, 84 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: a slow largo built on a calm pentatonic homecoming melody; shakuhachi, biwa, soft shamisen and taiko with a shimmering pad and bell arpeggio, meditative 4/4, hirajoshi scale, 84 bpm, koto glissando discovery chime]
[Intro: long drone, then the lead enters]
[Verse: lead plays a quieter lead-in phrase]
[Chorus: a calm pentatonic homecoming melody on shakuhachi that rises, pauses (a bell on the silence), then falls in a quick run, koto answering, full instruments, big and catchy]
[Verse 2: variation with a playful countermelody]
[Chorus: a calm pentatonic homecoming melody on shakuhachi that rises, pauses (a bell on the silence), then falls in a quick run, koto answering, even bigger]
[Bridge: stripped back, harmony shifts]
[Final Chorus: a calm pentatonic homecoming melody on shakuhachi that rises, pauses (a bell on the silence), then falls in a quick run, koto answering, modulating up a whole step, everything at once]
```
**Combate «Filo y Viento»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, japanese battle, heavy stomping syncopated march, shamisen, taiko, brass, bass, hirajoshi, 108 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: a heavy stomping syncopated march with a menacing low bass and sharp brass-like stabs, measured and tense; shamisen riff, taiko, shakuhachi, tight synth bass, bright synth lead, 4/4, hirajoshi scale, 108 bpm]
[Intro: drum hit, immediate riff]
[Verse: tense rhythmic riff]
[Chorus: shamisen and synth stabs slash a stomping syncopated phrase over the low menacing bass]
[Verse 2: variation]
[Chorus: shamisen and synth stabs slash a stomping syncopated phrase over the low menacing bass]
[Final Chorus: shamisen and synth stabs slash a stomping syncopated phrase over the low menacing bass, doubled]
```
**Jefe «Trueno Rojo (Oni Gigante)»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, boss battle, dark, demonic, relentless 5/4 ostinato, o-daiko, shamisen, strings, hirajoshi, 124 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: a dark remix of the Oriental pentatonic theme over a relentless pounding 5/4 ostinato like a war march, the pause hit by a thunderous o-daiko; shakuhachi, shamisen and biwa in unison, monk chanting choir, soaring strings, distorted synth lead, 5/4 at 124 bpm]
[Intro: immediate o-daiko thunder and a shamisen slash, the groove starts in the first bar, no slow build]
[Verse: the pentatonic theme over the 5/4 ostinato, shamisen and biwa]
[Chorus: the rising phrase in full power, shakuhachi, shamisen and strings in unison, o-daiko on the pause, monks chant the answer]
[Verse 2: variation, drum fills, stabbing brass]
[Chorus: same theme, choir doubles]
[Phase 2: faster, taiko rolls, climax building]
[Final Chorus: the theme in full power, up a half step, everything at once]
```
**Noche «Jardín de Luna»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, japanese night, moon garden, very slow rubato, shakuhachi, koto, temple bell, hirajoshi, 52 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: the Oriental pentatonic homecoming theme at half tempo, very sparse and free in rubato like a slow minimalist piano piece; shakuhachi, koto and biwa, glassy pad, temple bell, water drops, no drums]
[Intro: single held note, very quiet]
[Verse: sparse hint of the theme]
[Chorus: a calm pentatonic homecoming melody on shakuhachi that rises, pauses (a bell on the silence), then falls in a quick run, koto answering, played very slowly and softly]
[Verse 2: even sparser]
[Chorus: the same theme again, softer]
[Outro: fades to ambience]
```
## 5 · Volcán — mesoamericana · «ritual amenazante» (mi frigio)
**Aldea «Plaza del Templo»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, tribal village, rolling broken-chord marimba, ocarina, soft hand drums, rattles, E phrygian, 78 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: a prelude of unchanging rolling broken-chord arpeggios under a slowly shifting harmony; clay ocarina, marimba, muted huehuetl heartbeat and soft rattles with a warm pad, round bass, E phrygian, 78 bpm, warm mountain-folk feel]
[Intro: marimba rolling pattern alone, 8 bars]
[Verse: ocarina tune only hinted]
[Chorus: a warm rolling pattern of broken chords on marimba that never changes, with a soft ocarina tune floating above like heat shimmering over stone, the chorus is the ocarina tune at full warmth, warm and softly played]
[Verse 2: small calm variation]
[Chorus: a warm rolling pattern of broken chords on marimba that never changes, with a soft ocarina tune floating above like heat shimmering over stone, the chorus is the ocarina tune at full warmth, a little fuller]
[Outro: fades softly]
```
**Mundo «Tierra de Brasas»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, volcanic ritual overworld, hypnotic repeating theme builds, bone flute, conch, teponaztli, E phrygian, 100 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: a hypnotic ostinato rhythm with one repeating melody where instruments enter one by one and the same theme keeps growing; bone flute, conch shell, teponaztli, low drone, brooding pads, triplet synth-bass pulse, 4/4, E phrygian, 100 bpm]
[Intro: long drone, then the lead enters]
[Verse: lead plays a quieter lead-in phrase]
[Chorus: a hypnotic ritual 5-note chant-like phrase on ocarina and bone flute that repeats while more instruments join one by one over a relentless pounding triplet pulse, conch punctuating, growing every time, full instruments, big and catchy]
[Verse 2: variation with a playful countermelody]
[Chorus: a hypnotic ritual 5-note chant-like phrase on ocarina and bone flute that repeats while more instruments join one by one over a relentless pounding triplet pulse, conch punctuating, growing every time, even bigger]
[Bridge: stripped back, harmony shifts]
[Final Chorus: a hypnotic ritual 5-note chant-like phrase on ocarina and bone flute that repeats while more instruments join one by one over a relentless pounding triplet pulse, conch punctuating, growing every time, modulating up a whole step, everything at once]
```
**Combate «Guerra Florida»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, ritual temple battle, descending four-note chant, huehuetl drums, ocarina, brass stabs, E phrygian, 112 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: a doom-laden descending four-note chant motif over a pounding pulse; huehuetl and teponaztli, ocarina riff, conch calls, driving synth bass, sharp synth stabs, ominous march, 4/4, E phrygian, 112 bpm]
[Intro: drum hit, immediate riff]
[Verse: tense rhythmic riff]
[Chorus: the descending four-note chant on ocarina and brass stabs, drums charge]
[Verse 2: variation]
[Chorus: the descending four-note chant on ocarina and brass stabs, drums charge]
[Final Chorus: the descending four-note chant on ocarina and brass stabs, drums charge, doubled]
```
**Jefe «Fuego Eterno (Señor del Fuego, final)»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, final boss, monumental choral ostinato, huge choir, ocarina, war horns, huehuetl, E phrygian, 125 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: a dark epic remix of the Volcán ritual theme as a monumental choral ostinato with pounding drums, the same hypnotic 5-note phrase in unison with massive wordless choir; ocarina, bone flute, conch, war horns, huehuetl, full synth orchestra, relentless 4/4 at 125 bpm, and in the later phases the main themes of the other biomes join one by one (the galloping fanfare, the spring fanfare, the wobbling march, the brass hymn, the pentatonic homecoming tune)]
[Intro: immediate huehuetl hit and a massive choir blast, the groove starts in the first bar, no slow build]
[Verse: the ritual 5-note phrase in E phrygian, ocarina and bone flute, triplet pulse]
[Chorus: the choral ostinato in full power, ocarina, horns and choir in unison, conch on the last note]
[Verse 2: variation, drum fills, stabbing brass]
[Chorus: same theme, choir doubles]
[Phase 2: the themes of the other biomes join one by one over the pulse, climax building]
[Final Chorus: all themes at once, key rises a step, full power]
```
**Noche «Estrellas sobre el Cráter»**
```
Style: old-school fantasy RPG soundtrack, early-2000s MIDI-style synth orchestra, warm and cozy, volcano night, stars, very slow, bone flute, ocarina, sustained strings, drone, E phrygian, 60 bpm
Exclude styles: modern pop, EDM, vocals, lyrics, 8-bit chiptune, cinematic trailer, realistic orchestra
Lyrics: [Instrumental]
[Genre: old-school fantasy RPG video game music, early-2000s synth orchestra with MIDI-style instruments, loopable]
[Details: Structure borrowed from a famous classical piece, original melody, not a copy: the Volcán ritual theme at half tempo, very soft, over sustained string chords with slowly resolving suspensions like a slow adagio; bone flute and clay ocarina over a low drone, quiet rattles, starry pad, crackling embers, no drums]
[Intro: single held note, very quiet]
[Verse: sparse hint of the theme]
[Chorus: a hypnotic ritual 5-note chant-like phrase on ocarina and bone flute that repeats while more instruments join one by one over a relentless pounding triplet pulse, conch punctuating, growing every time, played very slowly and softly]
[Verse 2: even sparser]
[Chorus: the same theme again, softer]
[Outro: fades to ambience]
```
