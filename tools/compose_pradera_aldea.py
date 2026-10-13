"""NotScape · demo de música compuesta en código: aldea de la Pradera (esqueleto tipo canon, 3/4, sol mayor, 72 bpm).
Melodía ORIGINAL sobre la progresión G D Em Bm C G C D; capas que entran escalonadas; estribillo = todo junto.
Usa tools/sf2render.py + el soundfont GM del sistema. Salida: WAV en la ruta dada (luego mp3 con ffmpeg).
Uso: python3 -I tools/compose_pradera_aldea.py salida.wav
"""
import sys, numpy as np
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from sf2render import SF2, SR, mix_into, reverb

BPM = 72; BEAT = 60.0 / BPM; BAR = 3 * BEAT
NN = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def m(s):  # 'F#4' -> midi
    n = NN[s[0]]; i = 1
    while s[i] in '#b': n += 1 if s[i] == '#' else -1; i += 1
    return 12 * (int(s[i:]) + 1) + n
G_MAJ = [0, 2, 4, 5, 7, 9, 11]
def shift_diatonic(p, steps):  # mueve p por 'steps' grados dentro de sol mayor
    pcs = [(7 + x) % 12 for x in G_MAJ]; scale = []
    for o in range(0, 11):
        for pc in sorted(pcs): scale.append(12 * o + pc)
    scale = sorted(set(scale)); i = scale.index(p)
    return scale[i + steps]

BASS = ['G3', 'D3', 'E3', 'B2', 'C3', 'G2', 'C3', 'D3']
TRI = [['G3', 'B3', 'D4'], ['F#3', 'A3', 'D4'], ['G3', 'B3', 'E4'], ['F#3', 'B3', 'D4'],
       ['G3', 'C4', 'E4'], ['G3', 'B3', 'D4'], ['G3', 'C4', 'E4'], ['F#3', 'A3', 'D4']]
# melodía A (estribillo): (compás, pulso, nota, duración en pulsos)
A = [(0, 0, 'B4', 1.5), (0, 1.5, 'A4', .5), (0, 2, 'G4', 1),
     (1, 0, 'F#4', 1), (1, 1, 'A4', 1), (1, 2, 'D5', 1),
     (2, 0, 'E5', 1.5), (2, 1.5, 'D5', .5), (2, 2, 'B4', 1),
     (3, 0, 'F#4', 1), (3, 1, 'B4', 1), (3, 2, 'D5', 1),
     (4, 0, 'E5', 1.5), (4, 1.5, 'D5', .5), (4, 2, 'C5', 1),
     (5, 0, 'B4', 1), (5, 1, 'D5', 1), (5, 2, 'G5', 1),
     (6, 0, 'G5', 1), (6, 1, 'E5', 1), (6, 2, 'C5', 1),
     (7, 0, 'B4', 1), (7, 1, 'A4', 1), (7, 2, 'F#4', 1)]
# melodía V (verso 2)
V = [(0, 0, 'D5', 1), (0, 1, 'B4', .5), (0, 1.5, 'D5', .5), (0, 2, 'G5', 1),
     (1, 0, 'F#5', 1), (1, 1, 'D5', 1), (1, 2, 'A4', 1),
     (2, 0, 'G5', 1.5), (2, 1.5, 'F#5', .5), (2, 2, 'E5', 1),
     (3, 0, 'F#5', 1), (3, 1, 'D5', 1), (3, 2, 'B4', 1),
     (4, 0, 'C5', 1), (4, 1, 'E5', 1), (4, 2, 'G5', 1),
     (5, 0, 'D5', 1.5), (5, 1.5, 'B4', .5), (5, 2, 'G4', 1),
     (6, 0, 'E5', 1), (6, 1, 'G5', 1), (6, 2, 'E5', 1),
     (7, 0, 'F#5', 2), (7, 2, 'A4', 1)]

rng = np.random.default_rng(11)
sf = SF2('/usr/share/sounds/sf2/TimGM6mb.sf2')
PROG = dict(lute=24, recorder=74, dulc=15, strings=48, cello=42, harp=46, violin=40, flute=73)
GAIN = dict(lute=1.5, recorder=2.2, dulc=3.2, strings=1.3, cello=1.4, harp=0.9, violin=1.6, flute=1.8)
CYC = 6; L = CYC * 8 * BAR
buf = np.zeros((int((L + 4) * SR), 2), np.float32)

def put(inst, t, key, vel, dur, jit=0.010):
    if isinstance(key, str): key = m(key)
    t = max(0.0, t + (rng.uniform(-jit, jit) if jit else 0))
    v = int(np.clip(vel + rng.integers(-5, 6), 20, 120))
    y = sf.note(PROG[inst], key, v, dur) * GAIN[inst]
    mix_into(buf, y, t)

def lute(c, bar, vel):
    t0 = (c * 8 + bar) * BAR; tr = TRI[bar]
    put('lute', t0, BASS[bar], vel + 5, BEAT * 0.9)
    for off, ci in [(0.5, 0), (1, 1), (1.5, 2), (2, 1), (2.5, 0)]:
        put('lute', t0 + off * BEAT, tr[ci], vel - 8 + (6 if ci == 2 else 0), BEAT * 0.55)

def cello(c, bar, vel):
    k = m(BASS[bar]); put('cello', (c * 8 + bar) * BAR, k - 12 if k > 45 else k, vel, BAR * 0.97, 0.004)

def pad(c, bar, vel, inst='strings'):
    t0 = (c * 8 + bar) * BAR
    for p in TRI[bar]: put(inst, t0, m(p), vel, BAR * 1.02, 0.02)

def melody(inst, c, mel, vel, shift=0, octave=0, bars=range(8), legato=0.93):
    for (b, bt, n, d) in mel:
        if b not in bars: continue
        k = m(n)
        if shift: k = shift_diatonic(k, shift)
        put(inst, (c * 8 + b) * BAR + bt * BEAT, k + octave, vel, d * BEAT * legato)

def sparkle(c, bar, vel, inst='harp'):
    t0 = (c * 8 + bar) * BAR; tr = [m(x) + 12 for x in TRI[bar]]
    seq = [tr[0], tr[1], tr[2], tr[1], tr[2], tr[1]]
    for i, k in enumerate(seq): put(inst, t0 + (0.5 + i * 0.5) * BEAT, k, vel - (i % 2) * 8, BEAT * 0.8)

for c in range(CYC):
    for bar in range(8):
        fade = 1.0
        if c == 0:
            lute(c, bar, 56 + bar)
        elif c == 1:   # verso: laúd + violonchelo + sugerencia de la melodía (notas largas)
            lute(c, bar, 60); cello(c, bar, 55)
            n0 = [x for x in A if x[0] == bar][0]
            put('recorder', (c * 8 + bar) * BAR, n0[2], 52, BAR * 0.95)
            if bar >= 4: pad(c, bar, 38)
        elif c == 2:   # ESTRIBILLO 1
            lute(c, bar, 62); cello(c, bar, 62); pad(c, bar, 50)
            sparkle(c, bar, 48)
        elif c == 3:   # verso 2: melodía V en dulcimer, flauta dulce eco
            lute(c, bar, 60); cello(c, bar, 58); pad(c, bar, 42)
        elif c == 4:   # ESTRIBILLO 2 (todo)
            lute(c, bar, 66); cello(c, bar, 66); pad(c, bar, 56)
            sparkle(c, bar, 56)
        else:          # cierre: se vacía para enlazar con el inicio
            if bar < 4: lute(c, bar, 60); cello(c, bar, 48); pad(c, bar, 34)
            else: lute(c, bar, 58 - (bar - 4) * 1.5)
melody('recorder', 2, A, 82)
melody('violin', 2, A, 44, shift=-2, octave=0)
melody('dulc', 3, V, 66)
melody('recorder', 3, V, 40, octave=12)
melody('recorder', 4, A, 90)
melody('violin', 4, A, 62, shift=-2)
melody('harp', 4, A, 64, octave=12)
melody('flute', 4, A, 36, octave=12)
melody('recorder', 5, A, 52, bars=range(0, 4))
melody('dulc', 5, A, 46, bars=range(0, 4), octave=12)

# compresión de dinámica por ciclo (aldea relajada: que la diferencia intro↔estribillo sea de ~6 dB, no de 13)
DB = [5.0, 2.0, 0.0, 3.0, -1.0, 4.0]
tt = np.arange(len(buf)) / SR
anchors_t = [0.0]; anchors_g = [DB[0]]
for ci in range(1, CYC):
    anchors_t += [ci * 8 * BAR - 2.0, ci * 8 * BAR + 2.0]; anchors_g += [DB[ci - 1], DB[ci]]
anchors_t += [L + 4.0]; anchors_g += [DB[-1]]
buf *= (10 ** (np.interp(tt, anchors_t, anchors_g) / 20.0))[:, None].astype(np.float32)
wet = reverb(buf, 1.9, 0.22)
tail = int(4 * SR)
out = wet[:int(L * SR)].copy(); n = min(tail, len(wet) - len(out)); out[:n] += wet[len(out):len(out) + n]  # bucle sin corte
out /= max(1e-6, float(np.abs(out).max())) / 0.89
import wave
w = wave.open(sys.argv[1], 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((out * 32767).astype('<i2').tobytes()); w.close()
print('ok', round(L, 1), 's')
