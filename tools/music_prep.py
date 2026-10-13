#!/usr/bin/env python3
"""F6-música · prepara una pista de Suno para el juego: m4a/wav/mp3 → assets/music/<bioma>_<tipo>.mp3 (128 kbps, estéreo 44,1 kHz),
con la sonoridad igualada (LUFS objetivo por tipo) y limitador de picos. Uso: python3 -I tools/music_prep.py entrada.m4a pradera_aldea [LUFS]
LUFS por defecto según el tipo (sufijo del nombre): aldea -17, mundo -16, noche -18, combate -15, jefe -14,5. Imprime duración, sonoridad antes/después y BPM aprox."""
import sys, os, re, subprocess, json
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TGT = {'aldea': -17.0, 'mundo': -16.0, 'noche': -18.0, 'combate': -15.0, 'jefe': -14.5}
def lufs(path):
    r = subprocess.run(['ffmpeg', '-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = re.findall(r'\n\s+I:\s+(-?[\d.]+) LUFS', r); return float(m[-1])
def dur(path):
    return float(json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'json', path], capture_output=True, text=True).stdout)['format']['duration'])
src, name = sys.argv[1], sys.argv[2]; kind = name.split('_')[-1]
tgt = float(sys.argv[3]) if len(sys.argv) > 3 else TGT.get(kind, -16.0)
out = os.path.join(root, os.environ.get('MUSIC_DIR', os.path.join('assets', 'music')), name + '.mp3'); os.makedirs(os.path.dirname(out), exist_ok=True)
i0 = lufs(src); g = tgt - i0
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', src, '-vn', '-af', 'volume=%.2fdB,alimiter=limit=0.89:level=false' % g, '-ar', '44100', '-ac', '2', '-c:a', 'libmp3lame', '-b:a', os.environ.get('MP3K', '128k'), '-map_metadata', '-1', out], check=True)
print('%-16s %6.1f s  %5.1f → %5.1f LUFS (%+.1f dB)  %.1f MB' % (name, dur(out), i0, lufs(out), g, os.path.getsize(out) / 1e6))
