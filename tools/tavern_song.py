#!/usr/bin/env python3
"""NotScape · canción única de la TABERNA (jiga en Re dórico, 6/8, laúd + violín + bajo + pandero). Sintetizada con numpy, sin samples ni derechos.
Uso: python3 tools/tavern_song.py [salida.mp3]  → assets/music/taberna.mp3 (bucle de ~70 s)."""
import sys, os, subprocess, numpy as np
SR = 32000; BPM = 124            # negra con puntillo = 124 → corchea = 60/(124*3)
E8 = 60.0 / (BPM * 3)
rng = np.random.default_rng(7)
def mid(n): return 440.0 * 2 ** ((n - 69) / 12)
N = {'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}
def note(s):
    if s in ('-', '.'): return None
    k = N[s[0]]; o = int(s[-1]); a = 0
    if len(s) == 3: a = 1 if s[1] == '#' else -1
    return 12 * (o + 1) + k + a
def pluck(f, dur, gain=1.0, bright=.5):
    n = int(SR * dur); p = max(2, int(SR / f)); b = rng.uniform(-1, 1, p) * (1 - bright) + np.sin(np.arange(p) / p * 6.283) * bright
    out = np.zeros(n); buf = b.copy(); idx = 0
    for i in range(n):
        out[i] = buf[idx]; nx = (idx + 1) % p; buf[idx] = .4985 * (buf[idx] + buf[nx]); idx = nx
    env = np.exp(-np.arange(n) / (SR * dur * .55)); return out * env * gain
def fiddle(f, dur, gain=1.0):
    n = int(SR * dur); t = np.arange(n) / SR; vib = 1 + .006 * np.sin(2 * np.pi * 5.2 * t) * np.minimum(1, t * 4)
    ph = np.cumsum(2 * np.pi * f * vib / SR); w = np.zeros(n)
    for h in range(1, 9): w += np.sin(h * ph) / h * (.9 ** h)
    a = np.minimum(1, t / .03); r = np.minimum(1, (dur - t) / .06); return w * a * np.clip(r, 0, 1) * gain * .5
def drum(kind):
    n = int(SR * (.16 if kind == 'k' else .09)); t = np.arange(n) / SR
    if kind == 'k': return np.sin(2 * np.pi * (90 - 40 * t / .16) * t) * np.exp(-t / .05) * .9
    return rng.uniform(-1, 1, n) * np.exp(-t / .025) * .35
# progresión por compás (acordes: raíz grave, quinta)
CH = {'Dm': ('D2', 'A2', 'F3'), 'C': ('C2', 'G2', 'E3'), 'Gm': ('G2', 'D3', 'Bb3'), 'A': ('A2', 'E3', 'C#3'), 'Bb': ('Bb2', 'F3', 'D3'), 'F': ('F2', 'C3', 'A3')}
A = [('Dm', 'A4 D5 F5 A5 F5 D5'), ('C', 'G4 C5 E5 G5 E5 C5'), ('Dm', 'A4 D5 F5 A5 G5 F5'), ('C', 'E5 G5 C6 B5 A5 G5'),
     ('Dm', 'F5 A5 D6 A5 F5 D5'), ('C', 'E5 G5 C6 G5 E5 C5'), ('Gm', 'D5 G5 Bb5 A5 G5 F5'), ('A', 'E5 - A5 - - -')]
B = [('Dm', 'D6 C6 A5 C6 A5 F5'), ('C', 'C6 B5 G5 B5 G5 E5'), ('Bb', 'D6 C6 Bb5 C6 Bb5 F5'), ('A', 'E6 D6 C#6 D6 C#6 A5'),
     ('Dm', 'D6 F6 A6 F6 D6 A5'), ('C', 'C6 E6 G6 E6 C6 G5'), ('Gm', 'Bb5 D6 G6 F6 D6 Bb5'), ('A', 'A5 - - E5 - -')]
Bs = [(c, m) for c, m in B]
song = [('A', A), ('A', A), ('B', B), ('A', A), ('B', B), ('A', A)]
bars = [(sec, b) for sec, blocks in song for b in blocks]
total = len(bars) * 6 * E8 + 2.5; L = int(SR * total); mel = np.zeros(L); fid = np.zeros(L); bass = np.zeros(L); perc = np.zeros(L)
def put(a, x, pos): i = int(pos * SR); e = min(L, i + len(x)); a[i:e] += x[:e - i]
t0 = 0.0
for bi, (sec, (ch, ms)) in enumerate(bars):
    notes = ms.split()
    for k, s in enumerate(notes):
        m = note(s) if s not in ('-', '.') else None
        if m is None: continue
        d = E8 * (1 + sum(1 for q in notes[k + 1:k + 3] if q == '-' ) if True else 1)
        put(mel, pluck(mid(m), min(1.3, d * 3.2), .9, .55), t0 + k * E8)
        if sec == 'B': put(fid, fiddle(mid(m - 12), E8 * .95, .55), t0 + k * E8)   # el violín dobla grave en la parte B
    r, f5, th = [note(x) for x in CH[ch]]
    put(bass, pluck(mid(r), .5, .9, .2), t0); put(bass, pluck(mid(f5), .4, .55, .2), t0 + 3 * E8)
    for q in (1, 2, 4, 5): put(bass, pluck(mid(th), .22, .22, .3), t0 + q * E8)    # acorde rasgueado flojito
    put(perc, drum('k'), t0); put(perc, drum('s'), t0 + 3 * E8)
    for q in (1, 2, 4, 5): put(perc, drum('s') * .45, t0 + q * E8)
    t0 += 6 * E8
mix = mel * .8 + fid * .7 + bass * .85 + perc * .55
# reverb corto de taberna (ecos con filtro) y normalización
for dly, g in ((.045, .28), (.087, .2), (.139, .14)):
    d = int(dly * SR); mix[d:] += mix[:-d] * g
mix /= np.max(np.abs(mix)) * 1.15
# fundido final para que el bucle del juego (cruce de 3,5 s) quede limpio
f = int(SR * 2.2); mix[-f:] *= np.linspace(1, 0, f)
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets/music/taberna.mp3')
raw = (mix * 32767).astype('<i2').tobytes()
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-b:a', '112k', out], input=raw, check=True)
print('guardado', out, round(total, 1), 's')
