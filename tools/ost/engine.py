"""NotScape · ost/engine: motor de composición por capas sobre tools/sf2render.py (soundfont GM).
Una canción = spec (dict) → WAV estéreo con BUCLE SIN COSTURA (la cola de reverb/liberación se pliega al inicio).
Notación de melodías: compases separados por '|'; cada compás = notas 'grado[^ _]:duración_en_pulsos' ('r' = silencio);
  '^' sube una octava, '_' baja una, prefijo 'b'/'#' = bemol/sostenido cromático. Grado 1 = tónica en `mel_root`.
Acordes: entero = tríada diatónica sobre ese grado (escalas de 7 notas) o ['x', semitono_bajo, [semitonos...]].
Ver tools/ost/build.py para el uso y los 30 temas del juego."""
import sys, os, re, numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from sf2render import SF2, SR, mix_into, reverb

# --- soundfonts: varios .sf2 en tools/soundfonts/ (NO van en el zip del juego: pesan ~400 MB). Cada instrumento GM sale del que diga tools/ost/sfmap.py ---
_SFS = {}
def sf_dir():
    here = os.path.dirname(os.path.abspath(__file__))
    for p in (os.environ.get('OST_SF_DIR'), os.path.join(here, '..', 'soundfonts')):
        if p and os.path.isdir(p): return p
    raise FileNotFoundError('Copia los .sf2 a tools/soundfonts/ o define OST_SF_DIR')
def sf_named(name):
    if name not in _SFS:
        path = os.path.join(sf_dir(), name + '.sf2')
        _SFS[name] = SF2(path) if os.path.exists(path) else None
    return _SFS[name]
def sf_for(prog, bank=0, spec=None):
    """Soundfont que suena para (programa, banco): spec['sf'][prog] → sfmap.PICK → sfmap.DEFAULT → los demás; el primero que tenga ese preset."""
    import sfmap
    order = []
    if spec and prog in spec.get('sf', {}): order.append(spec['sf'][prog])
    order += [sfmap.PICK_DRUMS if bank == 128 else sfmap.PICK.get(prog, sfmap.DEFAULT), sfmap.DEFAULT] + list(sfmap.ORDER)
    for n in order:
        f = sf_named(n)
        if f is not None and f.has(bank, prog if bank == 0 or f.has(bank, prog) else 0): return f, n
    raise KeyError('ningún soundfont tiene el preset %d:%d' % (bank, prog))

# --- normalización de volumen por instrumento (GM) y soundfont ---
_G = {}
def gain(prog, bank=0, spec=None):
    f, n = sf_for(prog, bank, spec); k = (prog, bank, n)
    if k not in _G:
        if bank == 128: _G[k] = 1.0
        else:
            y = np.concatenate([f.note(prog, kk, 90, 0.8) for kk in (60, 72)])[:int(1.6 * SR)]
            r = float(np.sqrt((y ** 2).mean())) + 1e-6
            _G[k] = float(np.clip(0.06 / r, 0.2, 40.0))
    return _G[k]
SCALES = {'major': [0, 2, 4, 5, 7, 9, 11], 'lydian': [0, 2, 4, 6, 7, 9, 11], 'dorian': [0, 2, 3, 5, 7, 9, 10],
          'minor': [0, 2, 3, 5, 7, 8, 10], 'phrygian': [0, 1, 3, 5, 7, 8, 10], 'mixo': [0, 2, 4, 5, 7, 9, 10],
          'harm': [0, 2, 3, 5, 7, 8, 11], 'hira': [0, 2, 3, 7, 8], 'pdom': [0, 1, 4, 5, 7, 8, 10], 'pent': [0, 2, 4, 7, 9]}
NN = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def midi(s):
    n = NN[s[0]]; i = 1
    while s[i] in '#b': n += 1 if s[i] == '#' else -1; i += 1
    return 12 * (int(s[i:]) + 1) + n
def doff(scale, i): return 12 * (i // len(scale)) + scale[i % len(scale)]

def parse_mel(s, scale, root, beats):
    bars = []
    for bi, b in enumerate(s.split('|')):
        notes = []; t = 0.0
        for tok in b.split():
            p, d = tok.split(':'); d = float(d)
            if p != 'r':
                m_ = re.match(r'^([b#]?)(\d)([\^_]*)$', p)
                acc, deg, ox = m_.group(1), int(m_.group(2)), m_.group(3)
                oct_ = ox.count('^') - ox.count('_')
                notes.append((t, deg, oct_, {'b': -1, '#': 1, '': 0}[acc], d))
            t += d
        assert abs(t - beats) < 1e-6, 'compás %d suma %.2f != %d: %s' % (bi + 1, t, beats, b)
        bars.append(notes)
    return bars

def render(spec, out_wav=None, verbose=False, check=True):
    rng = np.random.default_rng(spec.get('seed', 3))
    tonic = spec['tonic']; scale = SCALES[spec['scale']]; n7 = len(scale) == 7
    bpm = spec['bpm']; beats = spec.get('beats', 4); beat = 60.0 / bpm; bar = beats * beat
    nbars = spec.get('bars', 8); cycles = spec['cycles']; L = (cycles * nbars + spec.get('rest', 0)) * bar   # rest = compases de silencio al final (respiro del bucle)
    prog = spec['prog']; assert len(prog) == nbars
    troot = midi(tonic + str(spec.get('oct', 3)))      # octava de acordes
    mroot = midi(tonic + str(spec.get('mel_oct', 4)))  # grado 1 de la melodía
    broot = midi(tonic + str(spec.get('bass_oct', 2)))
    mels = {k: parse_mel(v, scale, mroot, beats) for k, v in spec['mel'].items()}
    tail_s = spec.get('tail', 4.0)
    buf = np.zeros((int((L + tail_s + 3) * SR), 2), np.float32)
    trs = spec.get('tr', {})

    palt = spec.get('prog_alt', {})
    def chord(bi, cy=0):
        c = palt.get(cy, prog)[bi]
        if isinstance(c, (list, tuple)): return troot + c[1], [troot + x for x in c[2]]
        d = c - 1
        tones = [troot + doff(scale, d + k) for k in (0, 2, 4)]
        return broot + doff(scale, d), tones
    def put(inst, t, key, vel, dur, tr=0, jit=0.010, bank=0):
        t += rng.uniform(-jit, jit) if jit else 0
        if t < 0: t = 0
        v = int(np.clip(vel + rng.integers(-5, 6), 15, 124))
        k = int(key + (tr if bank == 0 else 0))
        y = sf_for(inst, bank, spec)[0].note(inst, k, v, dur, bank=bank) * gain(inst, bank, spec) * spec.get('inst_gain', {}).get(inst, 1.0)
        mix_into(buf, y, t)
    for ly in spec['layers']:
        role = ly['role']; inst = ly.get('i', 0); vel = ly.get('vel', 60)
        for c in ly['cy']:
            tr = trs.get(c, 0)
            for bi in range(nbars):
                t0 = (c * nbars + bi) * bar
                if 'bars' in ly and bi not in ly['bars']: continue
                bs, tones = chord(bi, c)
                if role == 'bass':
                    pat = ly.get('pat', 'whole')
                    if pat == 'whole': put(inst, t0, bs + ly.get('o', 0), vel, bar * .97, tr, .004)
                    elif pat == 'walk':   # raíz, quinta, octava, quinta
                        for j, off in enumerate([0, 7, 12, 7][:beats]): put(inst, t0 + j * beat, bs + ly.get('o', 0) + off, vel - j % 2 * 6, beat * .9, tr, .004)
                    elif pat == 'eighth':
                        for j in range(beats * 2): put(inst, t0 + j * beat / 2, bs + ly.get('o', 0) + (12 if j % 2 else 0) * ly.get('alt', 0), vel - (j % 2) * 8, beat * .45, tr, .004)
                    elif pat == 'gallop':   # corchea, semicorchea x2 por pulso
                        for j in range(beats):
                            for q, dt in enumerate([0, .5, .75]): put(inst, t0 + (j + dt) * beat, bs + ly.get('o', 0), vel - q * 6, beat * .22, tr, .003)
                    elif pat == 'oct':
                        for j in range(beats): put(inst, t0 + j * beat, bs + ly.get('o', 0) + 12 * (j % 2), vel - j % 2 * 6, beat * .9, tr, .004)
                    elif pat == 'beats':   # lista explícita [(pulso, off, dur)]
                        for (b_, off, d_) in ly['seq']: put(inst, t0 + b_ * beat, bs + ly.get('o', 0) + off, vel, d_ * beat, tr, .004)
                elif role == 'arp':
                    for (b_, w, d_, dv) in ly['pat']:
                        if w == 'b': k = bs + ly.get('o', 0)
                        elif w == 'B': k = bs + 12 + ly.get('o', 0)
                        else: k = tones[w % 3] + 12 * (w // 3) + ly.get('o', 0)
                        put(inst, t0 + b_ * beat, k, vel + dv, d_ * beat, tr)
                elif role == 'pad':
                    for k in tones: put(inst, t0, k + ly.get('o', 0), vel, bar * ly.get('len', 1.02), tr, .02)
                elif role == 'stab':
                    for b_ in ly['beats']:
                        for k in tones: put(inst, t0 + b_ * beat, k + ly.get('o', 0), vel, ly.get('d', .4) * beat, tr, .006)
                elif role == 'drone':
                    if bi % ly.get('every', 4) == 0:
                        for off in ly.get('offs', [0, 7]): put(inst, t0, broot + off + ly.get('o', 0), vel, bar * ly.get('every', 4) * 1.0, tr, .02)
                elif role == 'drums':
                    pat = ly['pat']; fill = ly.get('fill')
                    items = pat
                    if fill and bi % 4 == 3 and (ly.get('fill_cycles') is None or c in ly['fill_cycles']): items = fill
                    for (b_, key, v_) in items: put(0, t0 + b_ * beat, key, v_ * vel / 70.0, .25, 0, .006, bank=ly.get('bank', 128) if False else 128)
            if role == 'mel':
                m_ = mels[ly['name']]; sh = ly.get('shift', 0)
                for bi in range(nbars):
                    if 'bars' in ly and bi not in ly['bars']: continue
                    for (t_, deg, oc, acc, d) in m_[bi]:
                        k = mroot + doff(scale, deg - 1 + sh) + 12 * oc + acc + ly.get('o', 0)
                        put(inst, (c * nbars + bi) * bar + t_ * beat, k, vel + (6 if t_ == 0 else 0), d * beat * ly.get('leg', .93), tr, ly.get('jit', .010))
                        if check and ly.get('check', 1) and ly['name'] and t_ == int(t_) and d >= 1 and not ly.get('shift'):
                            pc = lambda x: x % 12
                            _, tones_ = chord(bi, c)
                            if pc(k - ly.get('o', 0)) not in {pc(x) for x in tones_} and c == ly['cy'][0] and verbose:
                                print('  [aviso] compás %d pulso %g: nota %s no es del acorde' % (bi + 1, t_, midi_name(k)))
    # compresión de dinámica por ciclo (dB)
    db = spec.get('db')
    if db:
        tt = np.arange(len(buf)) / SR; at = [0.0]; ag = [db[0]]
        for ci in range(1, cycles):
            at += [ci * nbars * bar - 1.5, ci * nbars * bar + 1.5]; ag += [db[ci - 1], db[ci]]
        at += [L + tail_s + 3]; ag += [db[-1]]
        buf *= (10 ** (np.interp(tt, at, ag) / 20.0))[:, None].astype(np.float32)
    rv = spec.get('reverb', (1.9, .22))
    wet = reverb(buf, rv[0], rv[1])
    n = int(L * SR); out = wet[:n].copy(); tl = min(len(wet) - n, int((tail_s + 2) * SR)); out[:tl] += wet[n:n + tl]  # bucle sin costura
    out /= max(1e-6, float(np.abs(out).max())) / 0.89
    if out_wav:
        import wave
        w = wave.open(out_wav, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((out * 32767).astype('<i2').tobytes()); w.close()
    return out, L

_NM = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
def midi_name(k): return '%s%d' % (_NM[k % 12], k // 12 - 1)
