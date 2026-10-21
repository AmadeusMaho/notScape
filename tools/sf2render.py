"""NotScape · sf2render v2: sintetizador SoundFont (SF2) en Python puro (numpy/scipy), pensado para soundfonts modernos.
Existe porque en el entorno del agente no hay fluidsynth ni acceso a pip/npm. Lee un .sf2 y renderiza notas sueltas.
Implementa (v2, oct 2026): suma de generadores preset+instrumento, TODAS las zonas que coinciden con tecla/velocidad (capas y pares estéreo),
sobreescritura de raíz/keynum, desplazamientos de dirección (fine+coarse), bucles (modos 1 y 3), envolvente de volumen completa (delay/attack/hold/decay/
sustain/release + keynum→hold/decay), envolvente de modulación, 2 LFO (vibrato y modulación: tono, filtro, volumen), filtro paso-bajo resonante (biquad por bloques),
curva de velocidad (v/127)², velocidad→cutoff (−2400 cents, modulador por defecto), afinación (coarse/fine/scaleTuning/corrección de la muestra), panorama con potencia constante,
interpolación cúbica (Catmull-Rom) y caché de voces. NO implementa: moduladores propios del archivo (solo los por defecto de arriba), envíos de reverb/chorus
(la reverb se añade fuera con `reverb`), clases exclusivas, 24 bits (sm24) ni SF3/SFZ.
API (compatible con la v1):  sf = SF2(ruta); y = sf.note(programa, tecla, velocidad, duracion_s, bank=0, tail_max=2.5) → array estéreo (n,2) float32 a 44100 Hz.
También: sf.has(bank, prog), sf.name(bank, prog), sf.presets() → [(bank, prog, nombre)]."""
import struct, numpy as np
from scipy.signal import lfilter
SR = 44100

# generadores (SF2 §8.1.2)
G_START, G_END, G_SLOOP, G_ELOOP, G_START_C = 0, 1, 2, 3, 4
G_MODLFO_PITCH, G_VIBLFO_PITCH, G_MODENV_PITCH, G_FC, G_Q, G_MODLFO_FC, G_MODENV_FC, G_MODLFO_VOL = 5, 6, 7, 8, 9, 10, 11, 13
G_PAN = 17
G_DMODLFO, G_FMODLFO, G_DVIBLFO, G_FVIBLFO = 21, 22, 23, 24
G_DMENV, G_AMENV, G_HMENV, G_DEMENV, G_SMENV, G_RMENV, G_K2MH, G_K2MD = 25, 26, 27, 28, 29, 30, 31, 32
G_DVENV, G_AVENV, G_HVENV, G_DEVENV, G_SVENV, G_RVENV, G_K2VH, G_K2VD = 33, 34, 35, 36, 37, 38, 39, 40
G_INST, G_KEYR, G_VELR, G_SLOOP_C, G_KEYNUM, G_VEL, G_ATT, G_ELOOP_C, G_COARSE, G_FINE, G_SAMPLE, G_MODE, G_SCALE, G_EXCL, G_ROOT = 41, 43, 44, 45, 46, 47, 48, 50, 51, 52, 53, 54, 56, 57, 58
G_END_C = 12
DEFAULTS = {G_FC: 13500, G_DMODLFO: -12000, G_DVIBLFO: -12000, G_DMENV: -12000, G_AMENV: -12000, G_HMENV: -12000, G_DEMENV: -12000, G_RMENV: -12000,
            G_DVENV: -12000, G_AVENV: -12000, G_HVENV: -12000, G_DEVENV: -12000, G_RVENV: -12000, G_SCALE: 100, G_KEYNUM: -1, G_VEL: -1, G_ROOT: -1}
NO_SUM = {G_START, G_END, G_SLOOP, G_ELOOP, G_START_C, G_END_C, G_SLOOP_C, G_ELOOP_C, G_INST, G_KEYR, G_VELR, G_KEYNUM, G_VEL, G_SAMPLE, G_MODE, G_EXCL, G_ROOT}

def tc(v): return 2.0 ** (v / 1200.0)          # timecents → segundos

class SF2:
    def __init__(self, path):
        d = open(path, 'rb').read()
        assert d[:4] == b'RIFF' and d[8:12] == b'sfbk', 'no es un .sf2'
        ch = {}
        def walk(o, end, pre=''):
            while o < end:
                t = d[o:o+4]; n = struct.unpack('<I', d[o+4:o+8])[0]
                if t == b'LIST': walk(o+12, o+8+n, pre + d[o+8:o+12].decode() + '/')
                else: ch[pre + t.decode('latin1')] = (o+8, n)
                o += 8 + n + (n & 1)
        walk(12, len(d))
        o, n = ch['sdta/smpl']
        self.smpl = np.frombuffer(d, dtype='<i2', count=n // 2, offset=o)     # int16 (se convierte por nota)
        def recs(key, size):
            o, n = ch['pdta/' + key]
            return [d[o+i*size:o+(i+1)*size] for i in range(n // size)]
        self.phdr = [struct.unpack('<20sHHHIII', r) for r in recs('phdr', 38)]
        self.pbag = [struct.unpack('<HH', r) for r in recs('pbag', 4)]
        self.pgen = recs('pgen', 4)
        self.inst = [struct.unpack('<20sH', r) for r in recs('inst', 22)]
        self.ibag = [struct.unpack('<HH', r) for r in recs('ibag', 4)]
        self.igen = recs('igen', 4)
        self.shdr = [struct.unpack('<20sIIIIIBbHH', r) for r in recs('shdr', 46)]
        self.cache = {}; self.vcache = {}; self._vbytes = 0
        self.path = path

    @staticmethod
    def _gens(raw, a, b):
        g = {}
        for i in range(a, b):
            op = struct.unpack('<H', raw[i][:2])[0]
            g[op] = (raw[i][2], raw[i][3]) if op in (43, 44) else struct.unpack('<h', raw[i][2:])[0]
        return g

    def presets(self):
        return [(p[2], p[1], p[0].split(b'\0')[0].decode('latin1')) for p in self.phdr[:-1]]
    def _pi(self, bank, prog):
        for i, p in enumerate(self.phdr[:-1]):
            if p[1] == prog and p[2] == bank: return i
        return None
    def has(self, bank, prog): return self._pi(bank, prog) is not None
    def name(self, bank, prog):
        i = self._pi(bank, prog); return self.phdr[i][0].split(b'\0')[0].decode('latin1') if i is not None else None

    def _zones(self, bank, prog):
        """Lista plana de zonas {gens fusionados + '_kr','_vr'}: generadores = (valor del instrumento, o el defecto) + desplazamiento del preset."""
        pi = self._pi(bank, prog)
        if pi is None: return []
        b0, b1 = self.phdr[pi][3], self.phdr[pi+1][3]
        out = []; pglob = {}
        for bi in range(b0, b1):
            g = self._gens(self.pgen, self.pbag[bi][0], self.pbag[bi+1][0])
            if G_INST not in g:
                if bi == b0: pglob = g
                continue
            pz = dict(pglob); pz.update(g)
            pkr = pz.get(G_KEYR, (0, 127)); pvr = pz.get(G_VELR, (0, 127))
            ii = pz[G_INST]; i0, i1 = self.inst[ii][1], self.inst[ii+1][1]
            iglob = {}
            for bj in range(i0, i1):
                ig = self._gens(self.igen, self.ibag[bj][0], self.ibag[bj+1][0])
                if G_SAMPLE not in ig:
                    if bj == i0: iglob = ig
                    continue
                z = dict(iglob); z.update(ig)
                kr = z.get(G_KEYR, (0, 127)); vr = z.get(G_VELR, (0, 127))
                kr = (max(kr[0], pkr[0]), min(kr[1], pkr[1])); vr = (max(vr[0], pvr[0]), min(vr[1], pvr[1]))
                if kr[0] > kr[1] or vr[0] > vr[1]: continue
                f = {}
                for op in set(z) | set(pz) | set(DEFAULTS):
                    if op in NO_SUM: f[op] = z.get(op, DEFAULTS.get(op, 0))
                    elif op in (G_KEYR, G_VELR, G_INST): continue
                    else: f[op] = z.get(op, DEFAULTS.get(op, 0)) + pz.get(op, 0)   # instrumento = valor absoluto; preset = desplazamiento
                f['_kr'] = kr; f['_vr'] = vr
                out.append(f)
        return out

    def zones_for(self, prog, key, vel, bank=0):
        k = (bank, prog)
        if k not in self.cache: self.cache[k] = self._zones(bank, prog)
        zs = [z for z in self.cache[k] if z['_kr'][0] <= key <= z['_kr'][1] and z['_vr'][0] <= vel <= z['_vr'][1]]
        if not zs and self.cache[k]:       # tecla/velocidad fuera de rango: la zona más cercana
            zs = [min(self.cache[k], key=lambda z: min(abs(key - z['_kr'][0]), abs(key - z['_kr'][1])) + 0.01 * min(abs(vel - z['_vr'][0]), abs(vel - z['_vr'][1])))]
        return zs

    # ---------------- síntesis de una voz ----------------
    @staticmethod
    def _env(t, delay, att, hold, dec, susv, kind):
        """Envolvente de subida/mantenimiento/caída para el tiempo t (s). kind 'vol': amplitud lineal en ataque, decaimiento en dB (susv = atenuación dB);
        kind 'mod': valores 0..1 lineales (susv = nivel 0..1)."""
        e = np.zeros_like(t)
        a0 = delay; a1 = a0 + att; h1 = a1 + hold
        m = (t >= a0) & (t < a1); e[m] = (t[m] - a0) / max(att, 1e-6)
        m = (t >= a1) & (t < h1); e[m] = 1.0
        m = t >= h1
        if kind == 'vol':
            db = np.minimum(100.0 * (t[m] - h1) / max(dec, 1e-6), susv); e[m] = 10 ** (-db / 20.0)
        else:
            e[m] = np.maximum(1.0 - (1.0 - susv) * (t[m] - h1) / max(dec, 1e-6), susv)
        return e

    def _voice(self, z, key, vel, dur, tail_max, drum):
        s = self.shdr[z[G_SAMPLE]]
        sstart, send, sl, el, rate, root, corr = s[1], s[2], s[3], s[4], s[5], s[6], s[7]
        st = sstart + z.get(G_START, 0) + 32768 * z.get(G_START_C, 0)
        en = send + z.get(G_END, 0) + 32768 * z.get(G_END_C, 0)
        ls = sl + z.get(G_SLOOP, 0) + 32768 * z.get(G_SLOOP_C, 0)
        le = el + z.get(G_ELOOP, 0) + 32768 * z.get(G_ELOOP_C, 0)
        st = max(0, min(st, len(self.smpl) - 2)); en = max(st + 2, min(en, len(self.smpl)))
        mode = z.get(G_MODE, 0) & 3
        loop = mode in (1, 3) and (le - ls) >= 8 and st <= ls < le <= en
        rls, rle = ls - st, le - st
        n_seg = en - st
        keyp = z[G_KEYNUM] if z.get(G_KEYNUM, -1) >= 0 else key
        rt = z[G_ROOT] if z.get(G_ROOT, -1) >= 0 else root
        base_cents = (keyp - rt) * z.get(G_SCALE, 100) + 100 * z.get(G_COARSE, 0) + z.get(G_FINE, 0) + corr
        # tiempos
        k60 = 60 - keyp
        delay = tc(z[G_DVENV]); att = tc(z[G_AVENV])
        hold = tc(z[G_HVENV] + z.get(G_K2VH, 0) * k60); dec = tc(z[G_DEVENV] + z.get(G_K2VD, 0) * k60)
        rel = min(tc(z[G_RVENV]), tail_max)
        susdb = float(np.clip(z.get(G_SVENV, 0) / 10.0, 0, 144))
        if drum and not loop: dur = max(dur, min(n_seg / max(rate, 1) * 1.02, 4.0))
        rel = max(rel, 0.004)
        n = int((dur + rel) * SR) + 8
        t = np.arange(n) / SR
        venv = self._env(t, delay, att, hold, dec, susdb, 'vol')
        toff = dur
        i_off = min(int(toff * SR), n - 1)
        if i_off < n:
            lvl = venv[i_off]; tr = t[i_off:] - toff
            venv[i_off:] = lvl * 10 ** (-100.0 * tr / max(rel, 1e-4) / 20.0)
        # corte: si aún suena al final, abrir un fundido corto
        fade = min(int(0.004 * SR), n)
        venv[n - fade:] *= np.linspace(1, 0, fade)
        # modulación
        menv = None
        dyn_pitch = abs(z.get(G_MODENV_PITCH, 0)) > 0 or abs(z.get(G_VIBLFO_PITCH, 0)) > 0 or abs(z.get(G_MODLFO_PITCH, 0)) > 0
        dyn_fc = abs(z.get(G_MODENV_FC, 0)) > 0 or abs(z.get(G_MODLFO_FC, 0)) > 0
        if abs(z.get(G_MODENV_PITCH, 0)) > 0 or abs(z.get(G_MODENV_FC, 0)) > 0:
            mh = tc(z[G_HMENV] + z.get(G_K2MH, 0) * k60); md = tc(z[G_DEMENV] + z.get(G_K2MD, 0) * k60)
            sus = float(np.clip(1.0 - z.get(G_SMENV, 0) / 1000.0, 0, 1)); mr = max(tc(z[G_RMENV]), 0.004)
            menv = self._env(t, tc(z[G_DMENV]), tc(z[G_AMENV]), mh, md, sus, 'mod')
            lvl = menv[i_off]; menv[i_off:] = np.maximum(lvl * (1.0 - (t[i_off:] - toff) / mr), 0)
        def lfo(fg, dg):
            f = 8.176 * 2.0 ** (z.get(fg, 0) / 1200.0); d = tc(z[dg])
            ph = np.maximum(t - d, 0) * f
            w = 4.0 * np.abs(ph - np.floor(ph + 0.75) + 0.25) - 1.0       # triangular, empieza en 0 subiendo
            w[t < d] = 0.0
            return w
        mlfo = lfo(G_FMODLFO, G_DMODLFO) if (abs(z.get(G_MODLFO_PITCH, 0)) or abs(z.get(G_MODLFO_FC, 0)) or abs(z.get(G_MODLFO_VOL, 0))) else None
        vlfo = lfo(G_FVIBLFO, G_DVIBLFO) if abs(z.get(G_VIBLFO_PITCH, 0)) else None
        # posición de lectura
        if dyn_pitch:
            cents = np.full(n, float(base_cents))
            if vlfo is not None: cents += z[G_VIBLFO_PITCH] * vlfo
            if mlfo is not None: cents += z.get(G_MODLFO_PITCH, 0) * mlfo
            if menv is not None: cents += z.get(G_MODENV_PITCH, 0) * menv
            pos = np.cumsum((2.0 ** (cents / 1200.0)) * rate / SR) - 0.0
        else:
            pos = np.arange(n) * ((2.0 ** (base_cents / 1200.0)) * rate / SR)
        if not loop:
            live = pos < n_seg - 3
            last = n if live.all() else max(1, int(np.argmin(live)))
        else:
            last = n
        pos = pos[:last]
        seg = self.smpl[st:en]
        if loop:
            Lp = rle - rls
            def wrap(ix): return np.where(ix >= rle, rls + (ix - rls) % Lp, ix)
        else:
            def wrap(ix): return np.clip(ix, 0, n_seg - 1)
        i1 = np.floor(pos).astype(np.int64); fr = (pos - i1).astype(np.float32)
        p0 = seg[wrap(np.maximum(i1 - 1, 0))].astype(np.float32); p1 = seg[wrap(i1)].astype(np.float32)
        p2 = seg[wrap(i1 + 1)].astype(np.float32); p3 = seg[wrap(i1 + 2)].astype(np.float32)
        y = p1 + 0.5 * fr * (p2 - p0 + fr * (2 * p0 - 5 * p1 + 4 * p2 - p3 + fr * (3 * (p1 - p2) + p3 - p0)))
        y /= 32768.0
        if last < n: y = np.concatenate([y, np.zeros(n - last, np.float32)])
        # filtro paso-bajo
        fc0 = z[G_FC] - 2400.0 * (1.0 - vel / 127.0); q_db = float(np.clip(z.get(G_Q, 0) / 10.0, 0, 96))
        if dyn_fc or fc0 < 12800:
            qlin = 0.7071 * 10 ** (q_db / 20.0)
            if dyn_fc:
                fcc = np.full(n, fc0)
                if menv is not None: fcc = fcc + z.get(G_MODENV_FC, 0) * menv
                if mlfo is not None: fcc = fcc + z.get(G_MODLFO_FC, 0) * mlfo
                B = 512; zi = np.zeros(2); out = np.empty_like(y)
                for b0 in range(0, n, B):
                    fc = 8.176 * 2.0 ** (min(fcc[b0:b0+B].mean(), 13500) / 1200.0); out[b0:b0+B], zi = self._lp(y[b0:b0+B], fc, qlin, zi)
                y = out
            else:
                fc = 8.176 * 2.0 ** (fc0 / 1200.0); y, _ = self._lp(y, fc, qlin, np.zeros(2))
            y = y * 10 ** (-0.5 * q_db / 20.0)
        # ganancia
        att_db = max(0.0, z.get(G_ATT, 0) / 10.0)
        g = 10 ** (-att_db / 20.0) * (vel / 127.0) ** 2
        env = venv[:n]
        if mlfo is not None and abs(z.get(G_MODLFO_VOL, 0)) > 0: env = env * 10 ** (z[G_MODLFO_VOL] / 10.0 * mlfo / 20.0)
        y = y[:n] * env * g
        pan = float(np.clip(z.get(G_PAN, 0) / 1000.0, -0.5, 0.5)); th = (pan + 0.5) * np.pi / 2
        return np.stack([y * np.cos(th), y * np.sin(th)], 1).astype(np.float32)

    @staticmethod
    def _lp(x, fc, qlin, zi):
        fc = min(max(fc, 20.0), 0.45 * SR); w0 = 2 * np.pi * fc / SR; al = np.sin(w0) / (2 * qlin); c = np.cos(w0)
        b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al
        y, zf = lfilter([b0 / a0, b1 / a0, b2 / a0], [1, a1 / a0, a2 / a0], x, zi=zi)
        return y.astype(np.float32), zf

    def note(self, prog, key, vel, dur, bank=0, tail_max=2.5):
        drum = bank == 128
        if not self.has(bank, prog):
            if drum and self.has(128, 0): prog = 0
            elif not drum and bank != 0 and self.has(0, prog): bank = 0
        vq = int(min(127, max(1, (int(vel) + 2) // 4 * 4))); dq = round(max(dur, 0.03) / 0.02) * 0.02 if not drum else 0.25
        ck = (bank, prog, int(key), vq, round(dq, 3), round(tail_max, 2))
        r = self.vcache.get(ck)
        if r is not None: return r
        zs = self.zones_for(prog, int(key), vq, bank)
        if not zs: return np.zeros((int(0.05 * SR), 2), np.float32)
        ys = [self._voice(z, int(key), vq, dq, tail_max, drum) for z in zs]
        L = max(len(y) for y in ys); out = np.zeros((L, 2), np.float32)
        for y in ys: out[:len(y)] += y
        if self._vbytes < 600e6:
            self.vcache[ck] = out; self._vbytes += out.nbytes
        return out

def mix_into(buf, y, t0):
    i = int(t0 * SR)
    if i >= len(buf): return
    e = min(len(buf), i + len(y))
    buf[i:e] += y[:e - i]

def reverb(x, seconds=1.8, wet=0.2, seed=7):
    """Reverb por convolución con respuesta sintética: pre-retardo 18 ms, reflexiones tempranas dispersas y cola de ruido estéreo decorrelacionado
    cuyos agudos se apagan el doble de rápido que los graves (sala cálida, no «ruido blanco que se desvanece»)."""
    from scipy.signal import fftconvolve, butter, sosfilt
    rng = np.random.default_rng(seed)
    n = int(seconds * SR); t = np.arange(n) / SR
    pre = int(.018 * SR)
    lo = butter(2, 2500, 'low', fs=SR, output='sos'); hi = butter(2, 2500, 'high', fs=SR, output='sos')
    ir = np.zeros((n + pre, 2), np.float32)
    for c in range(2):
        w = rng.standard_normal(n)
        tail = sosfilt(lo, w) * np.exp(-t * 6.9 / seconds) + 0.6 * sosfilt(hi, w) * np.exp(-t * 6.9 / (seconds * .5))   # −60 dB en `seconds` (graves) / mitad (agudos)
        tail[:int(0.010 * SR)] *= np.linspace(0, 1, int(0.010 * SR))
        ir[pre:, c] = tail
        for d_ms, a_ in ((11, .5), (23, .4), (37, .35), (52, .3), (71, .25)):          # reflexiones tempranas, distintas en cada canal
            k = pre + int((d_ms + rng.uniform(-3, 3) + 2 * c) * SR / 1000); ir[k, c] += a_ * (1 if rng.random() > .5 else -1) * 3
    ir /= np.sqrt((ir ** 2).sum(0, keepdims=True)).mean()
    out = x.copy()
    for c in range(2):
        out[:, c] = (1 - wet) * x[:, c] + wet * fftconvolve(x[:, c], ir[:, c])[:len(x)] * 1.5
    return out
