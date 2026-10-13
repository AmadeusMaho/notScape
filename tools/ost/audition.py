"""NotScape · ost/audition: renderiza la MISMA frase con cada soundfont de tools/soundfonts/ para cada instrumento que usa la música y arma una página HTML
con reproductores (mp3 incrustados) para elegir a oído cuál suena mejor; la elección sale como `PICK = {...}` para pegar en tools/ost/sfmap.py.
Uso:  python3 -I tools/ost/audition.py salida_dir      → salida_dir/clips/*.mp3 + salida_dir/clips.json (la página la monta el agente con esos datos)"""
import sys, os, json, subprocess, numpy as np
here = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, here); sys.path.insert(0, os.path.join(here, '..'))
import engine
from sf2render import SR, mix_into, reverb

SFS = ['MuseScore_General', 'GeneralUser-GS', 'FluidR3_GM']
# (programa, nombre, raíz MIDI de la frase, 'm' melodía | 'c' acorde sostenido, dónde se usa)
FAM = [
 ('Cuerdas pulsadas y teclas', [
  (24, 'Guitarra/laúd de nailon', 60, 'm', 'Pradera aldea y mundo'), (25, 'Guitarra de acero', 60, 'm', ''), (46, 'Arpa', 60, 'm', 'Bosque, Cumbres'),
  (6, 'Clavecín', 60, 'm', 'Pradera'), (15, 'Dulcimer', 60, 'm', 'Pradera'), (105, 'Banjo', 60, 'm', 'Pantano'), (45, 'Pizzicato de cuerdas', 60, 'm', 'Bosque combate')]),
 ('Arcos', [
  (40, 'Violín', 67, 'm', 'Pradera, Bosque'), (110, 'Fiddle', 67, 'm', 'Pradera combate'), (41, 'Viola', 55, 'm', 'Cumbres'), (42, 'Violonchelo', 48, 'm', 'Cumbres, Bosque'),
  (43, 'Contrabajo', 36, 'm', 'bajos'), (48, 'Cuerdas (conjunto)', 60, 'c', 'pads de todos'), (49, 'Cuerdas lentas', 60, 'c', 'pads')]),
 ('Vientos madera', [
  (73, 'Flauta', 72, 'm', 'Bosque, Cumbres'), (74, 'Flauta dulce', 72, 'm', 'Pradera'), (78, 'Silbato', 72, 'm', 'Pradera'), (75, 'Flauta de pan', 67, 'm', 'Volcán'),
  (79, 'Ocarina', 67, 'm', 'Volcán'), (77, 'Shakuhachi', 67, 'm', 'Oriental'), (71, 'Clarinete', 60, 'm', 'Pantano'), (68, 'Oboe', 67, 'm', 'Pradera, Cumbres'),
  (70, 'Fagot', 48, 'm', 'Pantano'), (109, 'Gaita', 57, 'm', 'Pradera jefe'), (21, 'Acordeón', 60, 'm', 'Pantano')]),
 ('Metales', [
  (56, 'Trompeta', 64, 'm', 'Pradera'), (57, 'Trombón', 48, 'm', 'Pradera jefe'), (60, 'Trompa', 55, 'm', 'Cumbres, Volcán'), (58, 'Tuba', 36, 'm', 'Pantano'), (61, 'Sección de metales', 55, 'm', 'jefes')]),
 ('Voces y colchones', [
  (52, 'Coro "aah"', 60, 'c', 'Cumbres, jefes'), (53, 'Coro "ooh"', 60, 'c', ''), (89, 'Pad cálido', 60, 'c', 'Volcán'), (94, 'Pad halo', 60, 'c', 'Bosque, noches')]),
 ('Percusión melódica', [
  (8, 'Celesta', 72, 'm', 'Bosque, noches'), (9, 'Glockenspiel', 72, 'm', ''), (10, 'Caja de música', 72, 'm', 'Pradera noche'), (11, 'Vibráfono', 60, 'm', 'Pantano'),
  (12, 'Marimba', 60, 'm', 'Pantano, Volcán'), (13, 'Xilófono', 72, 'm', 'Pantano'), (14, 'Campanas tubulares', 60, 'm', 'Oriental'), (112, 'Campanilla', 72, 'm', 'Oriental'),
  (47, 'Timbal', 48, 'm', 'Cumbres, Volcán')]),
 ('Instrumentos étnicos', [
  (107, 'Koto', 60, 'm', 'Oriental'), (106, 'Shamisen', 60, 'm', 'Oriental'), (108, 'Kalimba', 67, 'm', 'Pantano'), (104, 'Sitar', 60, 'm', 'probar'),
  (116, 'Taiko', 48, 'm', 'Oriental, Cumbres'), (117, 'Tom melódico', 48, 'm', 'Volcán')]),
 ('Bajos', [(32, 'Bajo acústico', 36, 'm', 'Pradera, Pantano'), (33, 'Bajo eléctrico (dedos)', 36, 'm', 'combates'), (35, 'Bajo sin trastes', 36, 'm', 'Pantano')]),
]
MEL = [(0, .4), (2, .4), (4, .4), (7, .6), (4, .4), (2, .4), (0, 1.2)]       # grados semitonales sobre la raíz, duraciones en s
CH = [(0, 4, 7)]

def clip(sf, prog, root, kind):
    buf = np.zeros((int(5.2 * SR), 2), np.float32)
    if kind == 'm':
        t = 0.1
        for off, d in MEL:
            y = sf.note(prog, root + off, 88, d * .95); mix_into(buf, y, t); t += d
    else:
        for i, off in enumerate((0, 4, 7)):
            y = sf.note(prog, root + off, 78, 2.6); mix_into(buf, y, 0.1 + i * 0.05)
    buf = reverb(buf, 1.9, .22)
    # el mismo nivel para todos (para que no gane el más fuerte)
    n = int(4.6 * SR); buf = buf[:n]
    pk = np.abs(buf).max(); r = float(np.sqrt((buf ** 2).mean())) + 1e-9
    buf *= min(0.10 / r, 0.9 / max(pk, 1e-9)) if pk > 0 else 1
    f = np.linspace(1, 0, int(.25 * SR)); buf[-len(f):] *= f[:, None]
    return buf

def drums(sf):
    buf = np.zeros((int(5.2 * SR), 2), np.float32); beat = .5
    pat = [(0, 36), (0, 42), (.5, 42), (1, 38), (1, 42), (1.5, 42), (2, 36), (2, 42), (2.5, 36), (2.5, 42), (3, 38), (3, 42), (3.5, 42)]
    for bar in range(2):
        for b, k in pat: mix_into(buf, sf.note(0, k, 100, .2, bank=128), 0.1 + (bar * 4 + b) * beat)
    buf = reverb(buf, 1.2, .15)[:int(4.6 * SR)]; r = float(np.sqrt((buf ** 2).mean())) + 1e-9; buf *= min(0.10 / r, .9 / np.abs(buf).max())
    return buf

def enc(buf, path):
    p = subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'libmp3lame', '-b:a', '56k', path],
                       input=(np.clip(buf, -1, 1) * 32767).astype('<i2').tobytes(), capture_output=True)
    assert p.returncode == 0, p.stderr.decode()

if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(os.path.join(out, 'clips'), exist_ok=True)
    fonts = {n: engine.sf_named(n) for n in SFS}
    meta = []
    for fam, items in FAM + [('Batería', [(0, 'Batería estándar', 0, 'd', 'todos los combates')])]:
        for prog, nm, root, kind, use in items:
            row = dict(fam=fam, prog=prog, name=nm, use=use, clips={})
            for n, sf in fonts.items():
                bank = 128 if kind == 'd' else 0
                if sf is None or not sf.has(bank, prog): continue
                path = os.path.join(out, 'clips', '%s_%d.mp3' % (n, prog + (1000 if kind == 'd' else 0)))
                enc(drums(sf) if kind == 'd' else clip(sf, prog, root, kind), path); row['clips'][n] = os.path.basename(path)
            meta.append(row); print(prog, nm, list(row['clips']))
    json.dump(dict(sfs=SFS, rows=meta), open(os.path.join(out, 'clips.json'), 'w'), ensure_ascii=False)
