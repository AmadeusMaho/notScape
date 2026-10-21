"""Renderiza los temas de uno o varios biomas: python3 -I tools/ost/build.py pradera [aldea mundo ...]  (sin tipos = los 5).
WAV en $OST_TMP (por defecto /tmp/ost) → mp3 en assets/music/<bioma>_<tipo>.mp3 vía tools/music_prep.py (96 kbps, sonoridad por tipo)."""
import sys, os, subprocess, time, importlib
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(os.path.dirname(here))
sys.path.insert(0, here)
import engine
tmp = os.environ.get('OST_TMP', '/tmp/ost'); os.makedirs(tmp, exist_ok=True)
biome = sys.argv[1]; kinds = sys.argv[2:] or ['aldea', 'mundo', 'combate', 'jefe', 'noche']
style = os.environ.get('OST_STYLE', '')   # '' = temas v9 (<bioma>.py → assets/music/) · 'v10' = temas nuevos (<bioma>_v10.py → assets/music/, o MUSIC_DIR)
mod = importlib.import_module(biome + ('_' + style if style else ''))
if style: os.environ.setdefault('MUSIC_DIR', os.path.join('assets', 'music'))
for k in kinds:
    t = time.time(); name = '%s_%s' % ({'volcan': 'volcan'}.get(biome, biome), k)
    print('--', name); wav = os.path.join(tmp, name + '.wav')
    spec = mod.TRACKS[k]
    out, L = spec.render(wav, verbose=True) if hasattr(spec, 'render') else engine.render(spec, wav, verbose=True)   # Track (compose.py) o spec dict (engine.py)
    env = dict(os.environ); env.setdefault('MP3K', '96k')
    subprocess.run([sys.executable, '-I', os.path.join(root, 'tools', 'music_prep.py'), wav, name], check=True, env=env)
    print('   render %.1f s de audio en %.1f s' % (L, time.time() - t))
