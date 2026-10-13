# NotScape · prompts de música para Suno (v6 · JRPG de 16 bits mejorado, TODOS los biomas)

**Cómo (v6.1):** Suno → *Custom* → *Instrumental* ON → *Create* (cada pista desde cero, sin Cover). Copia **Style** en «Style», **Exclude styles** en «Exclude styles» (si tu versión de Suno lo tiene; si no, ignóralo) y **Lyrics** en la letra completa. El Style es **corto a propósito** (Suno hace más caso a las etiquetas de género del principio, `16-bit SNES JRPG soundtrack`, que a frases largas); el detalle de instrumentos va en la letra, dentro de `[Details: …]`. Pide 2–4 min.
**Si aun así no suena a 16 bits:** (1) usa un modelo de Suno reciente y deja el Style tal cual; (2) en «Style» pon SOLO `16-bit SNES JRPG soundtrack, chiptune, retro video game music` y deja los instrumentos para la letra (Suno mezcla timbres reales cuando ve nombres como flauta o violín sin «16-bit» delante: por eso v6.2 escribe «16-bit flute», «16-bit harp»…); (3) sube «Weirdness»/baja «Style influence» según lo que falle (si suena orquestal, súbele el *Style influence*); (4) una vez que una pista salga bien, genera las demás copiando su Style inicial exacto para mantener el sonido.
**Estilo de todo el juego (v6, decisión del dueño 12 oct 2026):** banda sonora de **JRPG de 16 bits mejorado** (referencia: la OST de Chrono Trigger, solo descrita, nunca nombrada en un prompt). Es música «de videojuego», no realista: instrumentos de **muestra** (sampled) con reverb estéreo cálida y más cuerpo que un SNES, **fidelidad de PlayStation temprana**, ni orquesta real ni chiptune de onda cuadrada pura. Rasgos que se repiten en todos los prompts: bajo saltarín/sincopado, batería de 16 bits ligera, arpegios de muestra, melodía clara y cantable, contramelodías juguetonas, modulación de tono en el último estribillo, coros «aah» sampleados. Cada bioma conserva **sus instrumentos de civilización** (ahora como muestras de sintetizador) y **su propio motivo de estribillo**, compartido por aldea, mundo y noche.
**Reglas que no cambian:** aldea relajada (para craftear sin cansarse) · combate normal a tempo medio (~100–112 bpm) · jefe = remix oscuro del overworld de su bioma, arranca de inmediato, sin intro lenta · noche = el mismo tema del mundo, mucho más lento y suave, hecho a mano con *Create* (sin Cover) · el jefe final (Volcán) hace desfilar los temas de los demás biomas.
**Estructura:** *verso → estribillo → verso → estribillo → …*; el estribillo se repite 2–3 veces. Las etiquetas `[Verse]`/`[Chorus]` guían a Suno: no las borres.
**Si el resultado se desvía:** demasiado chiptune → añade «sampled, richer samples, SNES-style, reverb»; demasiado orquestal/realista → repite «not realistic orchestra, 16-bit sampled synth»; si cuela un instrumento prohibido, regenera con *Create*.
**Archivos:** `assets/music/<bioma>_<tipo>.mp3` (pradera, bosque, pantano, cumbres, oriental, volcan · aldea, mundo, combate, jefe, noche). La Pradera del juego usa hoy las pistas anteriores (synth-orquestales); al entregar las nuevas se reemplazan con los mismos nombres (`tools/music_prep.py`), sin tocar código.

## 0 · Pradera — medieval · «hogar» (sol mayor)
**Aldea «Posada del Trigal»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, relaxing village, 16-bit tin whistle, 16-bit lute pluck, 16-bit music box, waltz, G major, 74 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG village theme, enhanced 16-bit synth with richer samples and warm stereo reverb, early-PlayStation-era fidelity, relaxing but catchy memorable melody, instrumental, loopable, 16-bit lute pluck, recorder and hammered-dulcimer music box with a warm pad and soft arpeggio, round bouncing bass, light brushed 16-bit drums, gentle 3/4 waltz, G major, 74 bpm, baroque canon-like melody over a descending ground bass, chord progression I V vi iii IV I IV V in G major, melody enters in staggered layers, cozy adventure village feel, clear verse-chorus structure, a gentle singable chorus repeated twice]
[Intro: soft solo recorder sample, 8 bars]
[Verse: gentle, theme only hinted]
[Chorus: a bold rising 6-note theme starting with a dotted rhythm, sampled tin whistle and bright bell lead in unison, answered a fourth higher, ending on a hopeful held note with a brass-sample swell, warm and softly played]
[Verse 2: small calm variation, bouncy bass joins]
[Chorus: a bold rising 6-note theme starting with a dotted rhythm, sampled tin whistle and bright bell lead in unison, answered a fourth higher, ending on a hopeful held note with a brass-sample swell, a little fuller]
[Outro: fades softly]
```
**Mundo «Senda de Hierba»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, adventure overworld, 16-bit whistle, 16-bit fiddle, 16-bit march drums, 16-bit brass swells, G major, 112 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG overworld theme, enhanced 16-bit synth with richer samples and warm stereo reverb, early-PlayStation-era fidelity, very catchy memorable lead melody, instrumental, loopable, 16-bit tin whistle and fiddle trading a bold rising theme, strummed lute pluck, marching 16-bit snare with rim taps, brass-sample swells and bouncy staccato string samples, driving 4/4 march with hopeful forward motion, setting out on an adventure at sunrise, G major, 112 bpm, heroic overworld feel, brave brass countermelody, clear verse-chorus structure with a big catchy singable chorus repeated three times]
[Intro: drone and ambience, then the lead enters]
[Verse: lead plays a quieter lead-in phrase]
[Chorus: a bold rising 6-note theme starting with a dotted rhythm, sampled tin whistle and bright bell lead in unison, answered a fourth higher, ending on a hopeful held note with a brass-sample swell, full instruments, big and catchy]
[Verse 2: variation with a playful countermelody]
[Chorus: a bold rising 6-note theme starting with a dotted rhythm, sampled tin whistle and bright bell lead in unison, answered a fourth higher, ending on a hopeful held note with a brass-sample swell, doubled with bells, even bigger]
[Bridge: stripped back, harmony shifts]
[Final Chorus: a bold rising 6-note theme starting with a dotted rhythm, sampled tin whistle and bright bell lead in unison, answered a fourth higher, ending on a hopeful held note with a brass-sample swell, modulating up a whole step, everything at once]
```
**Combate «Escaramuza»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, battle theme, 16-bit fiddle jig, 16-bit lute, 16-bit punchy bass, E minor, 112 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG battle theme, enhanced 16-bit synth, early-PlayStation-era fidelity, catchy memorable lead melody, steady mid-tempo, instrumental, loopable, 16-bit fiddle, tin whistle and plucked lute with punchy synth bass and sharp saw-lead stabs, snappy 16-bit drums with snare fills, 6/8 marching jig, E minor, 112 bpm, brave brass stabs, action-adventure battle feel, clear verse-chorus structure with a big catchy riff chorus repeated three times]
[Intro: snare roll and one bass hit, immediate riff]
[Verse: tense rhythmic bass riff]
[Chorus: short 4-note fiddle motif with synth stabs, repeats]
[Verse 2: variation]
[Chorus: short 4-note fiddle motif with synth stabs, repeats]
[Final Chorus: short 4-note fiddle motif with synth stabs, repeats, doubled]
```
**Jefe «Machaca-Huesos (Gruk)»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, boss battle, dark, 16-bit crumhorn, bagpipe drone, 16-bit war drums, chains, E minor, 120 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG boss battle theme, enhanced 16-bit synth, early-PlayStation-era fidelity, epic dark-fantasy, dark heavy remix of the Pradera overworld theme in E minor, same bold rising dotted 6-note melody now snarling and fierce, starts immediately with no slow intro, driving 4/4 war march at 120 bpm, 16-bit crumhorn and fiddle in unison on the melody, low bagpipe-sample drone, chugging lute, heavy war drums and timpani samples with rim-tap march beat, rattling iron chains, synth brass stabs and a dark bass, brutish men's war-chant choir sample, building intensity, clear verse-chorus structure, a huge memorable chorus repeated three times]
[Intro: immediate war-drum hit and brass blast, the groove starts in the first bar, no slow build]
[Verse: the overworld theme in E minor, crumhorn and fiddle snarling, march beat driving]
[Chorus: the bold rising dotted 6-note theme, all samples and war-chant choir in unison, answered a fourth higher, timpani hit on the last note]
[Verse 2: variation, drum fills, stabbing samples]
[Chorus: same theme, choir doubles]
[Phase 2: faster, chant shouts, climax building]
[Final Chorus: the theme in full power, modulating up a half step, everything at once]
```
**Noche «Luciérnagas»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, night, slow, sleepy, 16-bit tin whistle, 16-bit bells, crickets, G major, 58 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG night theme, enhanced 16-bit synth, early-PlayStation-era fidelity, slow gentle night version of the overworld theme, same melody and chords as the daytime track at half tempo, sparse, instrumental, loopable, soft 16-bit tin whistle and lute pluck with a warm pad and twinkling bells, light viola sample, crickets and a faint church bell, calm and sleepy, no drums, 4/4, G major, 58 bpm, clear verse-chorus structure, a soft singable chorus repeated twice]
[Intro: single held note, very quiet]
[Verse: sparse hint of the theme]
[Chorus: a bold rising 6-note theme starting with a dotted rhythm, sampled tin whistle and bright bell lead in unison, answered a fourth higher, ending on a hopeful held note with a brass-sample swell, played very slowly and softly]
[Verse 2: even sparser]
[Chorus: the same theme again, softer]
[Outro: fades to ambience]
```
## 1 · Bosque — élfica · «el bosque que canta» (re lidio)
**Identidad:** gancho sincopado 3+3+2 y estribillo de llamada y respuesta (3 notas rápidas por la pentatónica + salto de sexta con suspiro a la cuarta aumentada). Timbres élficos de muestra: arpa, caja de música/kalimba, marimba, glockenspiel, flauta de pan sintética, pizzicato, coro «aah». **Tonalidad y tempos:** re lidio (combate re dórico, jefe re menor); aldea 70, noche 50, mundo 100 bpm.

**Aldea «Casas del Dosel»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, elven village, 16-bit harp, 16-bit music box, 16-bit pan flute, 16-bit marimba, D lydian, 70 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG village theme, enhanced 16-bit synth with richer samples and warm stereo reverb, early-PlayStation-era fidelity, relaxing but catchy memorable melody, instrumental, loopable, cozy elven treehouse village at dusk, 16-bit harp and music-box arpeggio in a gentle syncopated 3+3+2 pattern, soft marimba and glockenspiel, pan-flute synth lead singing the melody, pizzicato string samples, round bouncy sub bass, light soft 16-bit drum kit with brushed snare, slow mid-tempo 4/4, D lydian, 70 bpm, call and response between harp and flute, no whistle, no fiddle, clear verse-chorus structure, a gentle singable chorus repeated twice]
[Intro: music-box harp pattern alone, 8 bars]
[Verse: pan-flute synth hints at the theme over soft marimba]
[Chorus: the harp asks with three quick notes climbing a pentatonic scale, the flute answers leaping up a sixth and sighing down to a shimmering raised fourth, sampled choir aah pad holds the long note, small harp glissando at the end, warm and softly played]
[Verse 2: small calm variation, bouncy bass joins]
[Chorus: the same call and response, a little fuller with glockenspiel on top]
[Outro: music box fades softly]
```
**Mundo «Claro Encantado»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, enchanted forest overworld, 16-bit harp, 16-bit marimba, 16-bit pan flute, 16-bit bells, D lydian, 100 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG overworld theme, enhanced 16-bit synth with richer samples and stereo reverb, early-PlayStation-era fidelity, very catchy memorable lead melody, instrumental, loopable, playful enchanted forest adventure, bouncy syncopated 16-bit harp and marimba ostinato in 3+3+2, pan-flute synth and bright bell lead trading the melody, pizzicato strings, funky rounded bass line, light 16-bit drum kit with hi-hat groove and rim clicks, mid-tempo 4/4 forward motion, D lydian, 100 bpm, mischievous wonder, call and response, harp glissando at the end of each chorus, 16-bit choir aah on the long notes, key change up a whole step in the final chorus, no whistle, no fiddle, clear verse-chorus structure with a big catchy singable chorus repeated three times]
[Intro: harp and marimba ostinato alone, the bass joins after four bars]
[Verse: flute synth plays a quieter lead-in phrase over the ostinato]
[Chorus: the harp asks with three quick notes climbing a pentatonic scale, the bright lead answers leaping up a sixth and sighing down to a shimmering raised fourth, choir aah on the long note, harp glissando at the end, full and bouncy]
[Verse 2: variation with a playful pizzicato countermelody]
[Chorus: the same call and response, doubled with bells, even bigger]
[Bridge: stripped back to harp and bass, harmony shifts]
[Final Chorus: the same call and response, modulating up a whole step, everything at once, ending on the glissando]
```
**Combate «Caza Élfica»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, elven hunt battle, 16-bit funky bass, 16-bit harp arpeggio, 16-bit pizzicato, D dorian, 112 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG battle theme, enhanced 16-bit synth, early-PlayStation-era fidelity, catchy memorable lead melody, steady mid-tempo, instrumental, loopable, elven hunt, driving funky slap-style synth bass, fast 16-bit harp arpeggio ostinato, staccato pizzicato strings, bright synth-flute stabs, punchy 16-bit drums with snare fills, mischievous and brave, 4/4 with a syncopated 3+3+2 groove, D dorian, 112 bpm, no horn, clear verse-chorus structure with a big catchy riff chorus repeated three times]
[Intro: snare roll and one bass hit, immediate riff]
[Verse: tense rhythmic bass riff, harp ostinato on top]
[Chorus: the three-quick-notes call from the harp and the sixth-leap answer from the synth flute, sharp and staccato over the groove]
[Verse 2: variation, strings answer]
[Chorus: same call and response]
[Final Chorus: doubled, harp glissando rising into the last bar]
```
**Jefe «Luna de Sangre (Fenrir)»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, boss battle, dark, feral, 16-bit pipe organ, 16-bit timbales, howls, D minor, 132 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG boss battle theme, enhanced 16-bit synth, early-PlayStation-era fidelity, epic dark-fantasy, dark heavy remix of the Bosque overworld theme in D minor, the same three-quick-notes call and sixth-leap answer now feral and relentless, starts immediately with no slow intro, galloping 6/8 at 132 bpm, pounding 16-bit drums and timbales, distorted rock-organ and dark pipe-organ samples, growling synth bass, stabbing pizzicato strings and harp ostinato in the low register, howling choir sample on a falling third, sweeping synth sirens, building intensity, clear verse-chorus structure, a huge memorable chorus repeated three times]
[Intro: immediate drum hit and a howl, the gallop starts in the first bar, no slow build]
[Verse: the call and response in D minor, low harp asks and organ answers, bass galloping underneath]
[Chorus: the theme in full power, lead synths and organ in unison, howling choir answers with a falling third]
[Verse 2: variation, stabbing strings, drum fills]
[Chorus: same theme, choir doubles]
[Phase 2: faster, howls, climax building]
[Final Chorus: the theme in full power, modulating up a half step, everything at once]
```
**Noche «Rocío»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, night lullaby, slow, 16-bit music box harp, 16-bit celesta, D lydian, 50 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG night theme, enhanced 16-bit synth, early-PlayStation-era fidelity, slow gentle night version of the overworld theme, same melody and chords as the daytime track at half tempo, sparse, instrumental, loopable, a single 16-bit harp playing the syncopated pattern very slowly like a music box, soft celesta like dew drops, muted pan-flute synth answering, warm sine-like sub pad, 16-bit choir humming the hook, no drums, slow lullaby 4/4, D lydian, 50 bpm, no whistle, no fiddle, clear verse-chorus structure, a soft singable chorus repeated twice]
[Intro: single harp note, very quiet]
[Verse: sparse hint of the theme on harp]
[Chorus: the harp asks with three slow notes climbing, the muted flute answers leaping up a sixth and sighing down, choir hums the hook, played very slowly and softly]
[Verse 2: even sparser]
[Chorus: the same call and response again, softer]
[Outro: fades to ambience]
```
## 2 · Pantano — palafitos · «swing arrastrado» (la dórico)
**Aldea «Pasarela de Pilotes»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, swamp village, 16-bit accordion, 16-bit slide dobro, 16-bit upright bass, slow swing 12/8, A dorian, 62 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG village theme, enhanced 16-bit synth with richer samples and warm stereo reverb, early-PlayStation-era fidelity, relaxing but catchy memorable melody, instrumental, loopable, 16-bit accordion, slide dobro and upright bass with a warm pad and soft FM electric piano, brushed 16-bit snare, 12/8 slow swing, A dorian, 62 bpm, lazy sarabande-like stress on the second beat, round wobbly bass, clear verse-chorus structure, a gentle singable chorus repeated twice]
[Intro: soft solo accordion sample, 8 bars]
[Verse: gentle, theme only hinted]
[Chorus: a sly swung 4-note wobble (up, up, down, slide) easy to sing along, sampled bass clarinet and accordion in unison, kalimba answering, warm and softly played]
[Verse 2: small calm variation, bouncy bass joins]
[Chorus: a sly swung 4-note wobble (up, up, down, slide) easy to sing along, sampled bass clarinet and accordion in unison, kalimba answering, a little fuller]
[Outro: fades softly]
```
**Mundo «Niebla Verde»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, misty swamp overworld, 16-bit bass clarinet, 16-bit marimba, 16-bit jaw harp, swing, A dorian, 72 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG overworld theme, enhanced 16-bit synth with richer samples and warm stereo reverb, early-PlayStation-era fidelity, very catchy memorable lead melody, instrumental, loopable, 16-bit bass clarinet, marimba and jaw harp with wobbly synth bass and a bubbling arpeggio, frog-like percussion samples, swung 4/4, A dorian, 72 bpm, cheeky rising motif, storm-waltz hint, bell accents, clear verse-chorus structure with a big catchy singable chorus repeated three times]
[Intro: drone and ambience, then the lead enters]
[Verse: lead plays a quieter lead-in phrase]
[Chorus: a sly swung 4-note wobble (up, up, down, slide) easy to sing along, sampled bass clarinet and accordion in unison, kalimba answering, full instruments, big and catchy]
[Verse 2: variation with a playful countermelody]
[Chorus: a sly swung 4-note wobble (up, up, down, slide) easy to sing along, sampled bass clarinet and accordion in unison, kalimba answering, doubled with bells, even bigger]
[Bridge: stripped back, harmony shifts]
[Final Chorus: a sly swung 4-note wobble (up, up, down, slide) easy to sing along, sampled bass clarinet and accordion in unison, kalimba answering, modulating up a whole step, everything at once]
```
**Combate «Chapoteo»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, swamp battle, 16-bit slide guitar, 16-bit harmonica, shuffle, A minor, 100 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG battle theme, enhanced 16-bit synth, early-PlayStation-era fidelity, catchy memorable lead melody, steady mid-tempo, instrumental, loopable, 16-bit resonator slide guitar, harmonica and washboard with fat synth bass and a gritty synth lead, foot stomps and 16-bit shuffle drums, medium shuffle, A minor, 100 bpm, playful menace, clear verse-chorus structure with a big catchy riff chorus repeated three times]
[Intro: snare roll and one bass hit, immediate riff]
[Verse: tense rhythmic bass riff]
[Chorus: slide guitar and gritty synth growl a 2-bar riff]
[Verse 2: variation]
[Chorus: slide guitar and gritty synth growl a 2-bar riff]
[Final Chorus: slide guitar and gritty synth growl a 2-bar riff, doubled]
```
**Jefe «Burbuja Mayor (Rey Ciénaga)»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, boss battle, dark, 16-bit tuba, 16-bit accordion, 16-bit funeral marimba, 16-bit heavy toms, A minor, 96 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG boss battle theme, enhanced 16-bit synth, early-PlayStation-era fidelity, epic dark-fantasy, dark heavy remix of the Pantano overworld theme in A minor, the same sly swung 4-note wobble (up, up, down, slide) now huge, bloated and menacing, starts immediately with no slow intro, heavy swung 4/4 groove at 96 bpm, 16-bit tuba and bass clarinet in unison on the wobble, wheezing accordion, wailing slide dobro, marimba tolling like a funeral bell, heavy tom samples, gurgling synth sub-bass, mournful choir sample, building intensity, clear verse-chorus structure, a huge memorable chorus repeated three times]
[Intro: immediate heavy tom hit and a tuba blast, the groove starts in the first bar, no slow build]
[Verse: the wobble theme in A minor, bass clarinet and accordion, toms thudding]
[Chorus: the 4-note wobble in full power, tuba, bass clarinet and slide dobro in unison, choir moans the answer]
[Verse 2: variation, drum fills, stabbing samples]
[Chorus: same theme, choir doubles]
[Phase 2: faster, bubbling swells, climax building]
[Final Chorus: the theme in full power, modulating up a half step, everything at once]
```
**Noche «Ranas Dormidas»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, swamp night, slow swing, 16-bit bass clarinet, 16-bit marimba, frogs, A dorian, 55 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG night theme, enhanced 16-bit synth, early-PlayStation-era fidelity, slow gentle night version of the overworld theme, same melody and chords as the daytime track at half tempo, sparse, instrumental, loopable, soft 16-bit bass clarinet, marimba and kalimba with a dreamy pad, gentle wobbly bass, frogs and crickets, no drums, slow lazy swing, 4/4, A dorian, 55 bpm, clear verse-chorus structure, a soft singable chorus repeated twice]
[Intro: single held note, very quiet]
[Verse: sparse hint of the theme]
[Chorus: a sly swung 4-note wobble (up, up, down, slide) easy to sing along, sampled bass clarinet and accordion in unison, kalimba answering, played very slowly and softly]
[Verse 2: even sparser]
[Chorus: the same theme again, softer]
[Outro: fades to ambience]
```
## 3 · Cumbres — nórdica · «heroico y de taberna» (do menor)
**Aldea «Salón de Hidromiel»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, nordic tavern village, 16-bit nyckelharpa, 16-bit hurdy-gurdy, 16-bit flute, fire, C minor, 72 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG village theme, enhanced 16-bit synth with richer samples and warm stereo reverb, early-PlayStation-era fidelity, relaxing but catchy memorable melody, instrumental, loopable, 16-bit nyckelharpa, hurdy-gurdy drone, wooden flute and soft frame drum with a warm pad and gentle arpeggio, round bass, crackling fire, slow 4/4, C minor, 72 bpm, cozy tavern warmth, clear verse-chorus structure, a gentle singable chorus repeated twice]
[Intro: soft solo nyckelharpa sample, 8 bars]
[Verse: gentle, theme only hinted]
[Chorus: a heroic singable 7-note theme that leaps an octave on the fourth note then falls back stepwise, sampled horns and nyckelharpa in octaves, soft men's humming choir echo, warm and softly played]
[Verse 2: small calm variation, bouncy bass joins]
[Chorus: a heroic singable 7-note theme that leaps an octave on the fourth note then falls back stepwise, sampled horns and nyckelharpa in octaves, soft men's humming choir echo, a little fuller]
[Outro: fades softly]
```
**Mundo «Paso Nevado»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, snowy mountain overworld, 16-bit kantele, 16-bit horns, 16-bit throat choir, icy, 3/4, C minor, 88 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG overworld theme, enhanced 16-bit synth with richer samples and warm stereo reverb, early-PlayStation-era fidelity, very catchy memorable lead melody, instrumental, loopable, 16-bit kantele, tagelharpa drone, throat-singing choir and distant horn with wide pads and an icy arpeggio, light 16-bit frame-drum groove, 3/4 majestic, C minor, 88 bpm, baroque lament over a descending minor ground bass, passacaglia, building layer by layer to a heroic climax, epic overworld march feel, harp glissando chime, clear verse-chorus structure with a big catchy singable chorus repeated three times]
[Intro: drone and ambience, then the lead enters]
[Verse: lead plays a quieter lead-in phrase]
[Chorus: a heroic singable 7-note theme that leaps an octave on the fourth note then falls back stepwise, sampled horns and nyckelharpa in octaves, soft men's humming choir echo, full instruments, big and catchy]
[Verse 2: variation with a playful countermelody]
[Chorus: a heroic singable 7-note theme that leaps an octave on the fourth note then falls back stepwise, sampled horns and nyckelharpa in octaves, soft men's humming choir echo, doubled with bells, even bigger]
[Bridge: stripped back, harmony shifts]
[Final Chorus: a heroic singable 7-note theme that leaps an octave on the fourth note then falls back stepwise, sampled horns and nyckelharpa in octaves, soft men's humming choir echo, modulating up a whole step, everything at once]
```
**Combate «Furia del Norte»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, nordic battle, 16-bit war horns, 16-bit frame drums, 16-bit nyckelharpa riff, march, C minor, 112 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG battle theme, enhanced 16-bit synth, early-PlayStation-era fidelity, catchy memorable lead melody, steady mid-tempo, instrumental, loopable, 16-bit war horns, frame drums and a nyckelharpa riff with male chant sample and punchy synth brass, snappy 16-bit drums, steady heroic 4/4 march, C minor, 112 bpm, clear verse-chorus structure with a big catchy riff chorus repeated three times]
[Intro: snare roll and one bass hit, immediate riff]
[Verse: tense rhythmic bass riff]
[Chorus: horns and synth brass blast a heroic 4-note call, drums march]
[Verse 2: variation]
[Chorus: horns and synth brass blast a heroic 4-note call, drums march]
[Final Chorus: horns and synth brass blast a heroic 4-note call, drums march, doubled]
```
**Jefe «Ventisca (Yeti Milenario)»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, boss battle, glacial, colossal, 16-bit low horns, 16-bit throat singing, 16-bit frame drums, 3/4, C minor, 100 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG boss battle theme, enhanced 16-bit synth, early-PlayStation-era fidelity, epic dark-fantasy, dark heavy remix of the Cumbres overworld theme in C minor, the same heroic 7-note theme that leaps an octave on the fourth note, now colossal and glacial, starts immediately with no slow intro, crushing 3/4 at 100 bpm, low horn samples and nyckelharpa in octaves on the melody, deep throat-singing choir sample, massive frame drums, growling tagelharpa, kantele tolling, ice-crack synth hits and sub-bass, building intensity, clear verse-chorus structure, a huge memorable chorus repeated three times]
[Intro: immediate frame-drum slam and a horn blast, the groove starts in the first bar, no slow build]
[Verse: the 7-note theme in C minor, horns and nyckelharpa, frame drums hammering]
[Chorus: the octave-leaping theme in full power, horns and strings in octaves, throat-singing choir answers]
[Verse 2: variation, drum fills, stabbing samples]
[Chorus: same theme, choir doubles]
[Phase 2: faster, ice cracks, climax building]
[Final Chorus: the theme in full power, modulating up a half step, everything at once]
```
**Noche «Aurora»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, arctic night, aurora, 16-bit kantele, wind, slow, 3/4, C minor, 58 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG night theme, enhanced 16-bit synth, early-PlayStation-era fidelity, slow gentle night version of the overworld theme, same melody and chords as the daytime track at half tempo, sparse, instrumental, loopable, soft 16-bit kantele, tagelharpa drone and a distant horn with a wide icy pad and glassy bell tones, faint wind, no drums, 3/4, C minor, 58 bpm, clear verse-chorus structure, a soft singable chorus repeated twice]
[Intro: single held note, very quiet]
[Verse: sparse hint of the theme]
[Chorus: a heroic singable 7-note theme that leaps an octave on the fourth note then falls back stepwise, sampled horns and nyckelharpa in octaves, soft men's humming choir echo, played very slowly and softly]
[Verse 2: even sparser]
[Chorus: the same theme again, softer]
[Outro: fades to ambience]
```
## 4 · Oriental — japonesa · «elegancia con silencios» (hirajoshi)
**Aldea «Jardín del Cerezo»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, japanese village, 16-bit ryuteki flute, 16-bit koto, 16-bit wind chimes, hirajoshi, 66 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG village theme, enhanced 16-bit synth with richer samples and warm stereo reverb, early-PlayStation-era fidelity, relaxing but catchy memorable melody, instrumental, loopable, 16-bit ryuteki bamboo flute, soft koto and tsuzumi with a warm pad and glassy pluck, wind chimes, light 16-bit percussion, slow spacious 4/4, hirajoshi scale, 66 bpm, clear verse-chorus structure, a gentle singable chorus repeated twice]
[Intro: soft solo ryuteki sample, 8 bars]
[Verse: gentle, theme only hinted]
[Chorus: an elegant 5-note pentatonic phrase that rises, pauses (a bell on the silence), then falls in a quick run, sampled shakuhachi and koto in unison, warm and softly played]
[Verse 2: small calm variation, bouncy bass joins]
[Chorus: an elegant 5-note pentatonic phrase that rises, pauses (a bell on the silence), then falls in a quick run, sampled shakuhachi and koto in unison, a little fuller]
[Outro: fades softly]
```
**Mundo «Puente Rojo»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, japanese overworld, 16-bit shakuhachi, 16-bit biwa, 16-bit shamisen, 16-bit taiko, hirajoshi, 84 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG overworld theme, enhanced 16-bit synth with richer samples and warm stereo reverb, early-PlayStation-era fidelity, very catchy memorable lead melody, instrumental, loopable, 16-bit shakuhachi, biwa, soft shamisen and taiko with a shimmering pad and bell arpeggio, bouncy bass, light 16-bit groove, 4/4 meditative, hirajoshi scale, 84 bpm, koto glissando discovery chime, quest-like calm, clear verse-chorus structure with a big catchy singable chorus repeated three times]
[Intro: drone and ambience, then the lead enters]
[Verse: lead plays a quieter lead-in phrase]
[Chorus: an elegant 5-note pentatonic phrase that rises, pauses (a bell on the silence), then falls in a quick run, sampled shakuhachi and koto in unison, full instruments, big and catchy]
[Verse 2: variation with a playful countermelody]
[Chorus: an elegant 5-note pentatonic phrase that rises, pauses (a bell on the silence), then falls in a quick run, sampled shakuhachi and koto in unison, doubled with bells, even bigger]
[Bridge: stripped back, harmony shifts]
[Final Chorus: an elegant 5-note pentatonic phrase that rises, pauses (a bell on the silence), then falls in a quick run, sampled shakuhachi and koto in unison, modulating up a whole step, everything at once]
```
**Combate «Filo y Viento»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, japanese battle, 16-bit shamisen riff, 16-bit taiko, syncopated, hirajoshi, 108 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG battle theme, enhanced 16-bit synth, early-PlayStation-era fidelity, catchy memorable lead melody, steady mid-tempo, instrumental, loopable, 16-bit shamisen riff, taiko and shakuhachi with tight synth bass and a bright synth lead, crisp 16-bit drums, syncopated 4/4, hirajoshi scale, 108 bpm, measured and tense, clear verse-chorus structure with a big catchy riff chorus repeated three times]
[Intro: snare roll and one bass hit, immediate riff]
[Verse: tense rhythmic bass riff]
[Chorus: shamisen slashes a syncopated 4-note phrase, synth lead echoes]
[Verse 2: variation]
[Chorus: shamisen slashes a syncopated 4-note phrase, synth lead echoes]
[Final Chorus: shamisen slashes a syncopated 4-note phrase, synth lead echoes, doubled]
```
**Jefe «Trueno Rojo (Oni Gigante)»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, boss battle, demonic, 16-bit o-daiko, 16-bit shamisen, 16-bit monk chant, hirajoshi, 124 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG boss battle theme, enhanced 16-bit synth, early-PlayStation-era fidelity, epic dark-fantasy, dark heavy remix of the Oriental overworld theme in hirajoshi scale, the same elegant 5-note pentatonic phrase that rises, pauses and falls in a quick run, now demonic, the pause hit by a thunderous o-daiko sample instead of a bell, starts immediately with no slow intro, driving syncopated 4/4 at 124 bpm, shakuhachi, shamisen and biwa samples in unison, monk chanting choir sample, soaring string samples, distorted synth lead, building intensity, clear verse-chorus structure, a huge memorable chorus repeated three times]
[Intro: immediate o-daiko thunder and a shamisen slash, the groove starts in the first bar, no slow build]
[Verse: the pentatonic theme, shamisen and biwa, taiko driving]
[Chorus: the rising 5-note phrase in full power, shakuhachi, shamisen and strings in unison, o-daiko on the pause, monks chant the answer]
[Verse 2: variation, drum fills, stabbing samples]
[Chorus: same theme, choir doubles]
[Phase 2: faster, taiko rolls, climax building]
[Final Chorus: the theme in full power, modulating up a half step, everything at once]
```
**Noche «Jardín de Luna»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, japanese night, moon garden, 16-bit koto, 16-bit temple bell, slow, hirajoshi, 52 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG night theme, enhanced 16-bit synth, early-PlayStation-era fidelity, slow gentle night version of the overworld theme, same melody and chords as the daytime track at half tempo, sparse, instrumental, loopable, soft 16-bit shakuhachi, koto and biwa with a glassy pad, temple bell, water drops, no drums, sparse 4/4, hirajoshi scale, 52 bpm, clear verse-chorus structure, a soft singable chorus repeated twice]
[Intro: single held note, very quiet]
[Verse: sparse hint of the theme]
[Chorus: an elegant 5-note pentatonic phrase that rises, pauses (a bell on the silence), then falls in a quick run, sampled shakuhachi and koto in unison, played very slowly and softly]
[Verse 2: even sparser]
[Chorus: the same theme again, softer]
[Outro: fades to ambience]
```
## 5 · Volcán — mesoamericana · «ritual amenazante» (mi frigio)
**Aldea «Plaza del Templo»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, aztec village, 16-bit ocarina, 16-bit marimba, 16-bit soft drums, 16-bit rattles, E phrygian, 78 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG village theme, enhanced 16-bit synth with richer samples and warm stereo reverb, early-PlayStation-era fidelity, relaxing but catchy memorable melody, instrumental, loopable, 16-bit clay ocarina, quiet marimba, muted huehuetl heartbeat and soft rattles with a warm pad and soft pluck, round bass, warm mountain-folk feel, slow, E phrygian, 78 bpm, clear verse-chorus structure, a gentle singable chorus repeated twice]
[Intro: soft solo ocarina sample, 8 bars]
[Verse: gentle, theme only hinted]
[Chorus: a hypnotic ritual 5-note chant-like phrase over a pounding triplet pulse, sampled ocarina and bone flute in unison, conch punctuating, repeating and tightening, warm and softly played]
[Verse 2: small calm variation, bouncy bass joins]
[Chorus: a hypnotic ritual 5-note chant-like phrase over a pounding triplet pulse, sampled ocarina and bone flute in unison, conch punctuating, repeating and tightening, a little fuller]
[Outro: fades softly]
```
**Mundo «Tierra de Brasas»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, volcanic ritual overworld, 16-bit bone flute, 16-bit conch, 16-bit triplet bass, E phrygian, 100 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG overworld theme, enhanced 16-bit synth with richer samples and warm stereo reverb, early-PlayStation-era fidelity, very catchy memorable lead melody, instrumental, loopable, 16-bit bone flute, conch shell, teponaztli and low drone with brooding pads and a triplet synth-bass pulse, light 16-bit percussion, slow 4/4, E phrygian, 100 bpm, dungeon-temple tension, hints of a heroic motif, clear verse-chorus structure with a big catchy singable chorus repeated three times]
[Intro: drone and ambience, then the lead enters]
[Verse: lead plays a quieter lead-in phrase]
[Chorus: a hypnotic ritual 5-note chant-like phrase over a pounding triplet pulse, sampled ocarina and bone flute in unison, conch punctuating, repeating and tightening, full instruments, big and catchy]
[Verse 2: variation with a playful countermelody]
[Chorus: a hypnotic ritual 5-note chant-like phrase over a pounding triplet pulse, sampled ocarina and bone flute in unison, conch punctuating, repeating and tightening, doubled with bells, even bigger]
[Bridge: stripped back, harmony shifts]
[Final Chorus: a hypnotic ritual 5-note chant-like phrase over a pounding triplet pulse, sampled ocarina and bone flute in unison, conch punctuating, repeating and tightening, modulating up a whole step, everything at once]
```
**Combate «Guerra Florida»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, ritual temple battle, 16-bit huehuetl drums, 16-bit ocarina riff, 16-bit conch, E phrygian, 112 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG battle theme, enhanced 16-bit synth, early-PlayStation-era fidelity, catchy memorable lead melody, steady mid-tempo, instrumental, loopable, 16-bit huehuetl and teponaztli, ocarina riff and conch calls with driving synth bass and sharp synth stabs, punchy 16-bit drums, temple-dungeon feel, 4/4, E phrygian, 112 bpm, obsessive four-note descending motif over a pounding pulse, ominous march, clear verse-chorus structure with a big catchy riff chorus repeated three times]
[Intro: snare roll and one bass hit, immediate riff]
[Verse: tense rhythmic bass riff]
[Chorus: ocarina and synth stab a 4-note descending call, drums charge]
[Verse 2: variation]
[Chorus: ocarina and synth stab a 4-note descending call, drums charge]
[Final Chorus: ocarina and synth stab a 4-note descending call, drums charge, doubled]
```
**Jefe «Fuego Eterno (Señor del Fuego, final)»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, final boss, monumental, 16-bit ocarina, 16-bit war horns, 16-bit huge choir, 16-bit drums, E phrygian, 125 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG boss battle theme, enhanced 16-bit synth, early-PlayStation-era fidelity, epic dark-fantasy, dark heavy remix of the Volcán overworld theme in E phrygian, the same hypnotic ritual 5-note phrase over a pounding triplet pulse, now monumental, starts immediately with no slow intro, relentless 4/4 at 125 bpm, ocarina, bone flute and conch samples in unison, huehuetl and teponaztli, war horn samples, massive choir sample, full 16-bit synth ensemble, and in the later phases the main themes of the other biomes join one by one (the 16-bit tin whistle march, the harp call-and-response, the wobbling tuba, the octave-leaping horns, the pentatonic shakuhachi) over the descending canon progression, building intensity, clear verse-chorus structure, a huge memorable chorus repeated three times]
[Intro: immediate huehuetl hit and a conch blast, the groove starts in the first bar, no slow build]
[Verse: the ritual 5-note phrase in E phrygian, ocarina and bone flute, triplet pulse]
[Chorus: the phrase in full power, ocarina, horns and choir in unison, conch on the last note]
[Verse 2: variation, drum fills, stabbing samples]
[Chorus: same theme, choir doubles]
[Phase 2: the themes of the other biomes join one by one over the pulse, climax building]
[Final Chorus: all themes at once, key rises a step, full power]
```
**Noche «Estrellas sobre el Cráter»**
```
Style: 16-bit SNES JRPG soundtrack, chiptune-like sampled synth, retro video game music, volcano night, stars, 16-bit bone flute, drone, embers, slow, E phrygian, 60 bpm
Exclude styles: orchestra, realistic strings, cinematic, live instruments, modern pop
Lyrics: [Instrumental]
[Genre: 16-bit SNES JRPG video game music, sampled synth]
[Details: 16-bit JRPG night theme, enhanced 16-bit synth, early-PlayStation-era fidelity, slow gentle night version of the overworld theme, same melody and chords as the daytime track at half tempo, sparse, instrumental, loopable, soft 16-bit bone flute and clay ocarina over a low drone, quiet rattles, starry pad, crackling embers, no drums, sparse 4/4, E phrygian, 60 bpm, clear verse-chorus structure, a soft singable chorus repeated twice]
[Intro: single held note, very quiet]
[Verse: sparse hint of the theme]
[Chorus: a hypnotic ritual 5-note chant-like phrase over a pounding triplet pulse, sampled ocarina and bone flute in unison, conch punctuating, repeating and tightening, played very slowly and softly]
[Verse 2: even sparser]
[Chorus: the same theme again, softer]
[Outro: fades to ambience]
```
