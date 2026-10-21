"""NotScape · midi_render: lector de MIDI (SMF 0/1) + renderizador con tools/sf2render.py. Sin dependencias (numpy/scipy).
Uso:  python3 -I tools/midi_render.py info  archivo.mid                 → tempo, compases, tonalidad probable, instrumentos y notas por canal
      python3 -I tools/midi_render.py wav   archivo.mid salida.wav soundfont.sf2 [segundos_max]
Sirve para probar un .sf2 con cualquier MIDI o analizar un MIDI. Herramienta de desarrollo (no la usa el juego)."""
import sys, os, struct, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sf2render import SF2, SR, mix_into, reverb

def vlq(d, i):
    v = 0
    while True:
        b = d[i]; i += 1; v = (v << 7) | (b & 127)
        if not b & 128: return v, i

def parse(path):
    d = open(path, 'rb').read(); assert d[:4] == b'MThd'
    fmt, ntr, div = struct.unpack('>HHH', d[8:14]); i = 8 + struct.unpack('>I', d[4:8])[0]
    tempos = [(0, 500000)]; notes = []; progs = {}; ccs = []; ts = (4, 4); name = ''
    for _ in range(ntr):
        assert d[i:i+4] == b'MTrk'; n = struct.unpack('>I', d[i+4:i+8])[0]; j = i + 8; end = j + n; i = end
        t = 0; run = 0; on = {}
        while j < end:
            dt, j = vlq(d, j); t += dt; b = d[j]
            if b == 0xFF:
                ty = d[j+1]; ln, j2 = vlq(d, j+2); data = d[j2:j2+ln]; j = j2 + ln
                if ty == 0x51: tempos.append((t, int.from_bytes(data, 'big')))
                elif ty == 0x58: ts = (data[0], 2 ** data[1])
                elif ty == 0x03 and not name: name = data.decode('latin1')
                continue
            if b in (0xF0, 0xF7):
                ln, j = vlq(d, j+1); j += ln; continue
            if b & 128: run = b; j += 1
            st = run; ch = st & 15; ty = st >> 4
            if ty in (8, 9):
                k, v = d[j], d[j+1]; j += 2
                if ty == 9 and v: on[(ch, k)] = (t, v)
                elif (ch, k) in on:
                    t0, v0 = on.pop((ch, k)); notes.append((t0, t - t0, ch, k, v0))
            elif ty == 0xC: progs.setdefault(ch, []).append((t, d[j])); j += 1
            elif ty == 0xB: ccs.append((t, ch, d[j], d[j+1])); j += 2
            elif ty == 0xD: j += 1
            else: j += 2
    tempos.sort(key=lambda x: x[0]); notes.sort()   # estable: ante dos tempos en el mismo tick gana el último del archivo
    ded = []
    for tk, tm in tempos:
        if ded and ded[-1][0] == tk: ded[-1] = (tk, tm)
        else: ded.append((tk, tm))
    tempos = ded
    return dict(div=div, tempos=tempos, notes=notes, progs=progs, ccs=ccs, ts=ts, name=name)

def tick2s(m):
    div = m['div']; tp = m['tempos']; ts_ = [0.0]
    for a in range(1, len(tp)): ts_.append(ts_[-1] + (tp[a][0] - tp[a-1][0]) * tp[a-1][1] / 1e6 / div)
    def f(tk):
        a = max(x for x in range(len(tp)) if tp[x][0] <= tk)
        return ts_[a] + (tk - tp[a][0]) * tp[a][1] / 1e6 / div
    return f

GM = ['Piano', 'Bright Piano', 'E.Grand', 'Honky', 'EP1', 'EP2', 'Harpsichord', 'Clavi', 'Celesta', 'Glock', 'MusicBox', 'Vibes', 'Marimba', 'Xylo', 'TubBells', 'Dulcimer', 'DrawOrgan', 'PercOrgan', 'RockOrgan', 'ChurchOrgan', 'ReedOrgan', 'Accordion', 'Harmonica', 'Tango Acc', 'NylonGtr', 'SteelGtr', 'JazzGtr', 'CleanGtr', 'MutedGtr', 'OverdrGtr', 'DistGtr', 'GtrHarm', 'AcBass', 'FingBass', 'PickBass', 'Fretless', 'SlapBass1', 'SlapBass2', 'SynBass1', 'SynBass2', 'Violin', 'Viola', 'Cello', 'Contrabass', 'Tremolo', 'Pizzicato', 'Harp', 'Timpani', 'Strings', 'SlowStrings', 'SynStr1', 'SynStr2', 'Choir', 'VoiceOohs', 'SynVoice', 'Orch Hit', 'Trumpet', 'Trombone', 'Tuba', 'MutedTpt', 'FrHorn', 'Brass', 'SynBrass1', 'SynBrass2', 'SopSax', 'AltoSax', 'TenSax', 'BariSax', 'Oboe', 'EnglHorn', 'Bassoon', 'Clarinet', 'Piccolo', 'Flute', 'Recorder', 'PanFlute', 'Bottle', 'Shakuhachi', 'Whistle', 'Ocarina', 'Square', 'Saw', 'Calliope', 'Chiff', 'Charang', 'Voice', 'Fifths', 'BassLead', 'NewAge', 'Warm', 'Polysyn', 'SpaceVox', 'Bowed', 'Metallic', 'Halo', 'Sweep', 'Rain', 'Soundtrk', 'Crystal', 'Atmos', 'Bright', 'Goblins', 'Echoes', 'SciFi', 'Sitar', 'Banjo', 'Shamisen', 'Koto', 'Kalimba', 'Bagpipe', 'Fiddle', 'Shanai', 'TinkleBell', 'Agogo', 'SteelDrum', 'Woodblock', 'Taiko', 'MelTom', 'SynDrum', 'RevCymbal', 'FretNoise', 'BreathNoise', 'Seashore', 'Bird', 'Phone', 'Helicopter', 'Applause', 'Gunshot']

def info(path):
    m = parse(path); f = tick2s(m); n = m['notes']; end = max(f(t + d) for t, d, *_ in n)
    bpm = 6e7 / m['tempos'][0][1]; bar = m['ts'][0] * 4 / m['ts'][1] * 60 / bpm
    print('%s · %s · %d notas · %.1f s · tempo %.0f bpm (%d cambios) · compás %d/%d ≈ %.0f compases' % (os.path.basename(path), m['name'], len(n), end, bpm, len(m['tempos']), m['ts'][0], m['ts'][1], end / bar))
    pc = np.zeros(12)
    for t, d, ch, k, v in n:
        if ch != 9: pc[k % 12] += d
    maj = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]); mi = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]); best = (-9, '')
    for r in range(12):
        for nm, pr in (('mayor', maj), ('menor', mi)):
            c = np.corrcoef(np.roll(pc, -r), pr)[0, 1]
            if c > best[0]: best = (c, '%s %s' % (['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'][r], nm))
    print('   tonalidad probable: %s (r=%.2f)' % (best[1], best[0]))
    for ch in sorted({x[2] for x in n}):
        ns = [x for x in n if x[2] == ch]; pr = sorted({p for _, p in m['progs'].get(ch, [])})
        nm = 'PERCUSIÓN' if ch == 9 else ', '.join('%d %s' % (p, GM[p]) for p in pr) or 'prog 0'
        ks = [x[3] for x in ns]
        print('   canal %2d: %-34s %4d notas, rango %3d-%3d, vel media %3.0f' % (ch + 1, nm, len(ns), min(ks), max(ks), np.mean([x[4] for x in ns])))

def render(path, sf, maxs=None):
    m = parse(path); f = tick2s(m); n = [(f(t), f(t + d) - f(t), ch, k, v) for t, d, ch, k, v in m['notes']]
    n = [x for x in n if maxs is None or x[0] < maxs]
    prog_at = {}
    for ch, l in m['progs'].items(): prog_at[ch] = sorted(l)
    vol = {}
    for t, ch, c, v in m['ccs']:
        if c in (7, 11): vol.setdefault((ch, c), []).append((f(t), v))
    def cc(ch, c, ts, default):
        l = vol.get((ch, c));
        if not l: return default
        r = default
        for t_, v in l:
            if t_ <= ts + 1e-6: r = v
            else: break
        return r
    end = max(a + b for a, b, *_ in n)
    buf = np.zeros((int((end + 6) * SR), 2), np.float32)
    for ts, dur, ch, k, v in n:
        p = 0
        for tk, pg in prog_at.get(ch, []):
            if f(tk) <= ts + 1e-6: p = pg
        bank = 128 if ch == 9 else 0
        y = sf.note(0 if bank == 128 else p, k, v, max(dur, .03), bank=bank, tail_max=3.0)
        g = (cc(ch, 7, ts, 100) / 127.0) ** 1.0 * (cc(ch, 11, ts, 127) / 127.0)
        mix_into(buf, y * g * .5, ts)
    return buf, end

if __name__ == '__main__':
    if sys.argv[1] == 'info': info(sys.argv[2])
    else:
        sf = SF2(sys.argv[4])
        buf, end = render(sys.argv[2], sf, float(sys.argv[5]) if len(sys.argv) > 5 else None)
        buf = reverb(buf, 1.6, .15); buf /= max(1e-6, np.abs(buf).max()) / .89
        import wave
        w = wave.open(sys.argv[3], 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((buf * 32767).astype('<i2').tobytes()); w.close()
        print('ok %.1f s' % end)
