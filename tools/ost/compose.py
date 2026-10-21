"""NotScape · ost/compose (v10): composición por partitura sobre tools/sf2render.py + varios soundfonts (engine.sf_for).
Reemplaza al «motor de grados» de engine.py para los temas nuevos (las melodías se escriben con notas reales: más fácil de componer y de revisar).
Una pista = Track(bpm, compás, tonalidad) + secciones (progresión de acordes, un acorde por compás o dos con «.») + `play(sección, voces)` en orden.
Notación de melodía:  'D5:.5 G5:.5 B5:1 r:.5 ...'  (nota+octava:duración en negras; 'r' silencio; '|' opcional entre compases; el compás se valida: la suma debe ser exacta).
  Alteraciones: C#4, Bb3. Ligadura: duración con suma 'A4:1+2' (=3). Adorno: prefijo 'g' = apoyatura corta (gD5:1 → D5 con una nota previa de 1/8 de negra encima).
Voces:  mel(prog, 'notas', vel=..., leg=.96, o=0 octavas*12)   ·  third(notas, pasos=-2) = armonizar con terceras diatónicas de la tonalidad
        acc(tipo, prog, vel=..., lo=, hi=)  tipos: strum6 (jiga), waltz, arp, pad, bass, stab, drone  ·  drums(patrón, vel=..., fill=True)
Acordes: C, Am, F#m, D7, Gmaj7, Bdim, Asus4, C/E (bajo), E5 (potencia). Los acordes se dan por compás: 'G G C D' ; dos por compás: 'C.G'.
Render: Track.render(wav) → bucle sin costura (la cola se pliega al inicio; acaba en una cadencia abierta que vuelve a la entrada)."""
import re, os, sys, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import engine
from engine import sf_for, gain, SR, mix_into, reverb

NN = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
NAME = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
def midi(n):
    m = re.match(r'^([A-G])([#b]?)(-?\d)$', n); assert m, 'nota mal escrita: ' + n
    return 12 * (int(m.group(3)) + 1) + NN[m.group(1)] + {'#': 1, 'b': -1, '': 0}[m.group(2)]
def nname(k): return '%s%d' % (NAME[k % 12], k // 12 - 1)
MODES = {'major': [0, 2, 4, 5, 7, 9, 11], 'minor': [0, 2, 3, 5, 7, 8, 10], 'dorian': [0, 2, 3, 5, 7, 9, 10], 'phrygian': [0, 1, 3, 5, 7, 8, 10],
         'lydian': [0, 2, 4, 6, 7, 9, 11], 'mixo': [0, 2, 4, 5, 7, 9, 10], 'harm': [0, 2, 3, 5, 7, 8, 11], 'hira': [0, 2, 3, 7, 8], 'pent': [0, 2, 4, 7, 9],
         'minpent': [0, 3, 5, 7, 10], 'insen': [0, 1, 5, 7, 10], 'yo': [0, 2, 5, 7, 9]}
QUAL = {'': [0, 4, 7], 'm': [0, 3, 7], '7': [0, 4, 7, 10], 'm7': [0, 3, 7, 10], 'maj7': [0, 4, 7, 11], 'dim': [0, 3, 6], 'sus4': [0, 5, 7], 'sus2': [0, 2, 7],
        '5': [0, 7], 'aug': [0, 4, 8], '6': [0, 4, 7, 9], 'm6': [0, 3, 7, 9], 'add9': [0, 4, 7, 14], 'madd9': [0, 3, 7, 14], 'm7b5': [0, 3, 6, 10]}
def chord(name):
    """→ (raíz pc, [semitonos sobre la raíz], bajo pc)"""
    m = re.match(r'^([A-G][#b]?)([^/]*)(?:/([A-G][#b]?))?$', name); assert m, 'acorde mal escrito: ' + name
    r = midi(m.group(1) + '4') % 12; q = m.group(2)
    assert q in QUAL, 'calidad desconocida %r en %s' % (q, name)
    b = midi(m.group(3) + '4') % 12 if m.group(3) else r
    return r, QUAL[q], b

def voice_lead(prev, pcs, lo, hi, n=None):
    """Voicing de las notas pcs (clases de altura) dentro de [lo,hi] que menos se mueve respecto a `prev` (lista MIDI)."""
    import itertools
    pcs = list(dict.fromkeys(pcs)); cands = []
    opts = [[k for k in range(lo, hi + 1) if k % 12 == pc] for pc in pcs]
    if any(not o for o in opts): opts = [[k for k in range(lo - 12, hi + 13) if k % 12 == pc] for pc in pcs]
    for combo in itertools.product(*opts):
        if len(set(combo)) < len(combo): continue
        c = sorted(combo)
        if c[-1] - c[0] > 17: continue
        cands.append(c)
    if not cands: return [min(o, key=lambda k: abs(k - (lo + hi) // 2)) for o in opts]
    if not prev: return min(cands, key=lambda c: abs(sum(c) / len(c) - (lo + hi) / 2))
    return min(cands, key=lambda c: sum(abs(a - b) for a, b in zip(c, sorted(prev)[:len(c)])) + 0.3 * abs(sum(c) / len(c) - sum(prev) / len(prev)))

# ---------- notación de melodías ----------
def parse(s, bpb=None, label=''):
    """→ [(t, dur, midi|None, grace)] con t en negras desde el inicio; valida compases si hay '|' y bpb."""
    out = []; t = 0.0; bars = s.split('|') if bpb else [s]; bi = 0
    for b in bars:
        bt = 0.0
        for tok in b.split():
            nm, d = tok.rsplit(':', 1)
            d = sum(float(x) for x in d.split('+'))
            grace = nm.startswith('g') and nm[1:2] in 'ABCDEFG'
            if grace: nm = nm[1:]
            if nm == 'r': out.append((t, d, None, False))
            else: out.append((t, d, midi(nm), grace))
            if not grace:
                t += d; bt += d
            else: out[-1] = (t, 0.0, midi(nm), True)
        if bpb: assert abs(bt - bpb) < 1e-6, '%s compás %d suma %g (debería ser %g): %s' % (label, bi + 1, bt, bpb, b.strip())
        bi += 1
    return out
def shift_diatonic(s, scale_pcs, tonic_pc, steps):
    """Mueve cada nota `steps` grados de la escala (terceras: -2). Para armonizar."""
    sc = sorted({(p + tonic_pc) % 12 for p in scale_pcs}); up = sc + [x + 12 for x in sc]
    def sh(k):
        pcs = k % 12; base = k - pcs
        if pcs in sc: i = sc.index(pcs)
        else: i = min(range(len(sc)), key=lambda j: abs(sc[j] - pcs))
        j = i + steps; return base + sc[j % len(sc)] + 12 * (j // len(sc)) if True else k
    out = []
    for tok in s.split():
        if tok == '|': out.append(tok); continue
        nm, d = tok.rsplit(':', 1)
        if nm in ('r', '|'): out.append(tok); continue
        g = nm.startswith('g') and nm[1:2] in 'ABCDEFG'; core = nm[1:] if g else nm
        out.append(('g' if g else '') + nname(sh(midi(core))) + ':' + d)
    return ' '.join(out)

# ---------- percusión (GM kit) por compás ----------
K, S, HH, HP, HO, RD, CR, TL, TM, TH, CB, TB, SH_ = 36, 38, 42, 44, 46, 51, 49, 41, 45, 50, 56, 54, 70   # bombo, caja, hh, hh pedal, hh abierto, ride, crash, toms, cencerro, pandereta, maracas
DRUMS = {
 # 6/8 (3 negras): jiga con tom de bodhrán y pandereta
 'jig':     (3, [(0, TL, 80), (1.5, TL, 62), (.5, TB, 36), (1, TB, 40), (2, TB, 36), (2.5, TB, 40), (0, K, 56)]),
 'jig_hi':  (3, [(0, K, 84), (1.5, S, 70), (.5, TB, 46), (1, TB, 50), (2, TB, 46), (2.5, TB, 52), (0, TL, 70), (1.5, TM, 60), (0, HH, 40), (1, HH, 40), (2, HH, 40)]),
 'jig_fill': (3, [(0, K, 84), (.5, TM, 70), (1, TM, 76), (1.5, TH, 80), (2, TH, 86), (2.5, TH, 92), (0, CR, 60)]),
 # 3/4
 'waltz':   (3, [(0, K, 54), (1, HP, 34), (2, HP, 34)]),
 'waltz_br': (3, [(0, K, 50), (1, TB, 40), (2, TB, 40), (1.5, TB, 28), (2.5, TB, 28)]),
 # 4/4
 'march':   (4, [(0, K, 90), (1, S, 76), (2, K, 84), (3, S, 76), (1.5, S, 40), (3.5, S, 44)] + [(x / 2, HH, 38 + (x % 2) * 10) for x in range(8)]),
 'gallop':  (4, [(0, K, 92), (.5, K, 60), (1, S, 82), (2, K, 88), (2.5, K, 62), (3, S, 86), (3.5, S, 56)] + [(x / 2, HH, 40 + (x % 2) * 12) for x in range(8)]),
 'gallop_fill': (4, [(0, K, 92), (1, S, 82), (2, S, 74), (2.5, TH, 80), (3, TM, 84), (3.25, TM, 88), (3.5, TL, 92), (3.75, TL, 98), (0, CR, 70)]),
 'half':    (4, [(0, K, 96), (2, S, 92), (1, TL, 60), (3, TL, 60), (3.5, TL, 70), (0, CR, 50)] + [(x, RD, 40) for x in range(4)]),
 'half_fill': (4, [(0, K, 96), (1, TL, 80), (1.5, TL, 84), (2, S, 92), (2.5, TM, 84), (3, TM, 90), (3.5, TH, 96)]),
 'heart':   (4, [(0, TL, 70), (.5, TL, 40), (2, TL, 62)]),
 'tick':    (4, [(1, HP, 30), (3, HP, 30), (0, K, 40)]),
 'adv':     (4, [(0, K, 88), (1.5, K, 68), (3, K, 76), (2, S, 82), (1, TB, 54), (3.5, TB, 54)] + [(x / 2, HH, 34 + (x % 2) * 10) for x in range(8)]),
 'adv_fill': (4, [(0, K, 88), (1.5, TM, 76), (2, TM, 80), (2.5, TH, 86), (3, TH, 90), (3.25, TL, 94), (3.5, TL, 98), (3.75, TL, 100), (0, CR, 62)]),
 'stomp':   (4, [(0, K, 104), (0, TL, 98), (1.5, TL, 72), (2, S, 96), (2, TM, 82), (3, TL, 86), (3.5, TL, 70)]),
 'stomp_fill': (4, [(0, K, 104), (0, TL, 98), (1, TL, 86), (1.5, TL, 90), (2, TM, 94), (2.5, TM, 96), (3, TH, 100), (3.25, TH, 104), (3.5, TL, 108), (3.75, TL, 112), (0, CR, 80)]),
 'bolero':  (4, [(0, K, 70), (1.5, TB, 44), (2, TB, 40), (3, TM, 56), (3.5, TM, 48)]),
}

class Section:
    def __init__(self, tr, chords):
        self.tr = tr; self.chords = []
        for c in chords.replace('|', ' ').split():
            self.chords.append(c.split('.'))
        self.nbars = len(self.chords)

class Track:
    def __init__(self, bpm, bpb=4, tonic='C', mode='major', seed=1, rest=0, tail=4.0, reverb=(1.9, .22), sf=None, swing=0.0):
        self.bpm = bpm; self.bpb = bpb; self.tonic = midi(tonic + '4') % 12; self.scale = MODES[mode]; self.seed = seed; self.rest = rest
        self.tail = tail; self.rv = reverb; self.sfspec = {'sf': sf or {}}; self.plays = []; self.swing = swing
    def sec(self, chords): return Section(self, chords)
    def play(self, sec, voices): self.plays.append((sec, voices))
    def third(self, s, steps=-2): return shift_diatonic(s, self.scale, self.tonic, steps)

    # ---- generación de eventos ----
    def _events(self, verbose=False):
        rng = np.random.default_rng(self.seed); ev = []; bar0 = 0; bpb = self.bpb; warn = []
        for pi, (sec, voices) in enumerate(self.plays):
            n = sec.nbars; state = {}
            for vi, v in enumerate(voices):
                kind = v['k']; prog = v.get('i', 0); vel = v.get('vel', 64); g = v.get('g', 1.0); bank = 0
                def add(t, dur, key, vl, jit=.006):
                    tt = bar0 * bpb + t
                    ev.append((max(0.0, tt * 60 / self.bpm + rng.uniform(-jit, jit)), dur * 60 / self.bpm, int(key), int(np.clip(vl + rng.integers(-4, 5), 12, 125)), prog, bank, g))
                if kind == 'mel':
                    notes = parse(v['s'], bpb, 'pista %d voz %d' % (pi + 1, vi + 1)); assert abs(notes[-1][0] + notes[-1][1] - n * bpb) < 1e-6 or v.get('partial'), \
                        'pista %d voz %d: la melodía mide %g negras y la sección %g' % (pi + 1, vi + 1, notes[-1][0] + notes[-1][1], n * bpb)
                    d0 = v.get('dyn', (1.0, 1.0)); off = v.get('at', 0)
                    for (t, d, k, grace) in notes:
                        if k is None: continue
                        pos = (t + off) / (n * bpb); vl = vel * (d0[0] + (d0[1] - d0[0]) * pos)
                        if abs((t % bpb)) < 1e-6: vl += 5
                        elif abs(t % 1) < 1e-6: vl += 2
                        if grace: add(t + off - .12, .12, k + v.get('o', 0), vl * .8, .002)
                        else: add(t + off, d * v.get('leg', .96), k + v.get('o', 0), vl, .004)
                        # aviso: nota en tiempo fuerte que no es del acorde (solo con duración >= 1)
                        bi = int((t + off) // bpb)
                        if not grace and d >= 1 and abs(t % 1) < 1e-6 and bi < n and v.get('check', 1) and not v.get('o', 0):
                            cl = sec.chords[bi]; sub = min(len(cl) - 1, int(((t + off) % bpb) / (bpb / len(cl))))
                            r, q, b = chord(cl[sub])
                            if (k - r) % 12 not in {x % 12 for x in q}:
                                warn.append('c%d pista %d: %s en tiempo fuerte sobre %s' % (bi + 1, pi + 1, nname(k), cl[sub]))
                    continue
                if kind == 'drums':
                    pb, pat = DRUMS[v['p']]; fillp = DRUMS.get(v.get('fill_p', ''), (0, []))[1] if v.get('fill') else None
                    assert pb == bpb, 'patrón %s es de %g negras y el compás %g' % (v['p'], pb, bpb)
                    for b in range(n):
                        if v.get('bars') and b not in v['bars']: continue
                        use = fillp if (fillp and (b % v.get('fill_every', 4)) == v.get('fill_every', 4) - 1) else pat
                        for (t, key, vl) in use:
                            ev.append((max(0.0, (bar0 + b) * bpb * 60 / self.bpm + t * 60 / self.bpm + rng.uniform(-.004, .004)), .3, key, int(np.clip(vl * v.get('vel', 64) / 64 + rng.integers(-4, 5), 12, 125)), 0, 128, g))
                    continue
                # ---- acompañamientos por compás ----
                lo, hi = v.get('lo', 48), v.get('hi', 72); prev = None
                for b in range(n):
                    if v.get('bars') and b not in v['bars']: continue
                    cl = sec.chords[b]; per = bpb / len(cl)
                    for ci, cn in enumerate(cl):
                        r, q, bs = chord(cn); t0 = b * bpb + ci * per
                        pcs = [(r + x) % 12 for x in q]
                        vk = v.get('kind')
                        if kind == 'acc' and vk == 'strum6':
                            top = voice_lead(prev, pcs, lo, hi); prev = top
                            low = 12 * (v.get('bo', 2) + 1) + bs; fifth = low + 7
                            add(t0, 1.0, low, vel + 6, .004); add(t0 + 1.5, 1.0, fifth if (b % 2) else low, vel + 2, .004)
                            for tt, ac in ((.5, 0), (1.0, 0), (2.0, 0), (2.5, 0)):
                                for j, k in enumerate(top): add(t0 + tt + j * .012, .45, k, vel - 8 + ac - j, .003)
                        elif kind == 'acc' and vk == 'waltz':
                            top = voice_lead(prev, pcs, lo, hi); prev = top
                            low = 12 * (v.get('bo', 2) + 1) + bs; add(t0, 1.9, low, vel + 8, .004)
                            for tt in (1, 2):
                                for j, k in enumerate(top): add(t0 + tt + j * .01, .8, k, vel - 8 - j, .005)
                        elif kind == 'acc' and vk == 'arp':
                            sub = v.get('sub', .5); pat = v.get('pat', [0, 1, 2, 3, 2, 1])
                            top = voice_lead(prev, pcs, lo, hi); prev = top
                            seq = sorted(top) + [k + 12 for k in sorted(top)]
                            steps = int(round(per / sub))
                            for j in range(steps):
                                idx = pat[(j + (b * steps if v.get('cont') else 0)) % len(pat)] % len(seq)
                                add(t0 + j * sub, sub * v.get('leg', 1.8), seq[idx], vel - 6 + (4 if j % int(round(1 / sub)) == 0 else 0) + (j % 2) * -2, .005)
                        elif kind == 'acc' and vk == 'pad':
                            top = voice_lead(prev, pcs, lo, hi); prev = top
                            for j, k in enumerate(top): add(t0 + j * .03, per * v.get('len', 1.0) + .2, k, vel - j, .01)
                        elif kind == 'acc' and vk == 'stab':
                            top = voice_lead(prev, pcs, lo, hi); prev = top
                            for tt in v['at']:
                                if tt >= per: continue
                                for j, k in enumerate(top): add(t0 + tt + j * .008, v.get('d', .4), k, vel - j, .004)
                        elif kind == 'acc' and vk == 'drone':
                            if b % v.get('every', 4) == 0 and ci == 0:
                                for off in v.get('offs', [0, 7]): add(t0, v.get('every', 4) * bpb + .5, 12 * (v.get('bo', 2) + 1) + self.tonic + off, vel, .01)
                        elif kind == 'acc' and vk == 'roll':   # redoble de timbal sobre la raíz, con crescendo dentro del compás
                            k0 = 12 * (v.get('bo', 1) + 1) + bs; sub = v.get('sub', .25); cnt = int(per / sub)
                            for j in range(cnt): add(t0 + j * sub, sub * 1.4, k0, vel * (0.55 + 0.45 * j / max(1, cnt - 1)), .002)
                        elif kind == 'acc' and vk == 'sweep':  # barrido de arpa ascendente al principio del compás
                            ks = [k for k in range(lo, hi + 1) if k % 12 in pcs][:v.get('n', 9)]
                            for j, k in enumerate(ks): add(t0 + j * v.get('gap', .09), 2.5, k, vel - 8 + j * 1.5, .002)
                        elif kind == 'acc' and vk == 'bass':
                            low = 12 * (v.get('bo', 2) + 1) + bs; pat = v.get('pat', 'root'); nxt = None
                            fifth = low + 7; third = low + (3 if (q[1] if len(q) > 1 else 4) == 3 else 4)
                            if pat == 'root': add(t0, per * .97, low, vel, .004)
                            elif pat == 'half':
                                for h in range(int(per // 2) or 1): add(t0 + h * 2, 1.9, low if h % 2 == 0 else fifth, vel - 4 * (h % 2), .004)
                            elif pat == 'rf':
                                add(t0, per / 2 * .95, low, vel, .004); add(t0 + per / 2, per / 2 * .95, fifth, vel - 6, .004)
                            elif pat == 'walk':
                                nb = sec.chords[(b + 1) % n][0] if b + 1 < n else (self.plays[(pi + 1) % len(self.plays)][0].chords[0][0])
                                nr, _, nbs = chord(nb); nlow = 12 * (v.get('bo', 2) + 1) + nbs
                                walk = [low, third if per >= 4 else fifth, fifth, nlow + (-1 if nlow > low else 1)]
                                for j in range(int(per)): add(t0 + j, .95, walk[j % 4], vel - (4 if j % 2 else 0), .004)
                            elif pat == 'pulse':
                                for j in range(int(per * 2)): add(t0 + j * .5, .45, low + (12 if j % 2 else 0) * v.get('alt', 0), vel - (6 if j % 2 else 0), .003)
                            elif pat == 'gallop':
                                for j in range(int(per)):
                                    for dt, dd in ((0, .5), (.5, .25), (.75, .25)): add(t0 + j + dt, dd * .9, low, vel - (8 if dt else 0), .003)
                            elif pat == 'hammer':      # golpes largos en 1 y 3 + corchea de relleno
                                add(t0, 1.4, low, vel + 6, .004); add(t0 + 2, 1.4, low, vel + 2, .004); add(t0 + 3.5, .4, low, vel - 8, .004)
                            elif pat == 'jig':
                                add(t0, 1.4, low, vel + 4, .004); add(t0 + 1.5, 1.4, fifth if b % 2 else low, vel - 2, .004)
                            elif pat == 'waltz': add(t0, 1.9, low, vel + 6, .004)
                            elif pat == 'sync332':    # 3+3+2 semicorcheas: 0, 1.5, 3
                                add(t0, 1.4, low, vel + 6, .004); add(t0 + 1.5, 1.4, fifth, vel - 2, .004); add(t0 + 3, .9, low + 12 if v.get('hi8') else low, vel, .004)
                            elif pat == 'sync332b':   # variante con octava: raíz, quinta, octava
                                add(t0, 1.4, low, vel + 6, .004); add(t0 + 1.5, 1.4, low + 12, vel - 4, .004); add(t0 + 3, .9, fifth, vel, .004)
                            elif pat == 'slow':       # 12/8-6/8 lento: raíz al 1, quinta al 4
                                add(t0, 1.4, low, vel + 4, .004); add(t0 + 1.5, 1.4, fifth, vel - 4, .004)
                            elif pat == 'sync':        # 1, y-de-2, 3.5
                                add(t0, 1.0, low, vel + 4, .004); add(t0 + 1.5, .6, fifth, vel - 4, .004); add(t0 + 2.5, 1.2, low, vel, .004)
            bar0 += n
        self.warn = warn
        if verbose:
            for w in warn[:40]: print('  [aviso]', w)
        return ev
    @property
    def total_bars(self): return sum(s.nbars for s, _ in self.plays)

    def render(self, out_wav=None, verbose=False, tail_s=None):
        ev = self._events(verbose)
        L = (self.total_bars + self.rest) * self.bpb * 60 / self.bpm
        tail = self.tail if tail_s is None else tail_s
        buf = np.zeros((int((L + tail + 3) * SR), 2), np.float32)
        for (t, d, key, vel, prog, bank, g) in sorted(ev):
            f, nm = sf_for(prog, bank, self.sfspec)
            y = f.note(prog, key, vel, max(d, .04), bank=bank) * gain(prog, bank, self.sfspec) * g
            mix_into(buf, y, t)
        wet = reverb(buf, self.rv[0], self.rv[1])
        n = int(L * SR); out = wet[:n].copy(); tl = min(len(wet) - n, int((tail + 2) * SR)); out[:tl] += wet[n:n + tl]
        out /= max(1e-6, float(np.abs(out).max())) / 0.89
        if out_wav:
            import wave
            w = wave.open(out_wav, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype('<i2').tobytes()); w.close()
        return out, L

# ---------- atajos para escribir voces ----------
def mel(i, s, **kw): return dict(k='mel', i=i, s=s, **kw)
def acc(kind, i, **kw): return dict(k='acc', kind=kind, i=i, **kw)
def drums(p, **kw): return dict(k='drums', p=p, **kw)
