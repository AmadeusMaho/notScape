#!/usr/bin/env python3
"""Junta el proyecto en UN solo HTML (CSS, JS y música incrustados) para publicarlo como artefacto.
Uso: python3 tools/build_single.py [salida.html]"""
import re, base64, sys, os
r = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rd = lambda p, m='r': open(os.path.join(r, p), m, **({'encoding': 'utf-8'} if m == 'r' else {})).read()
html, css, js = rd('index.html'), rd('css/style.css'), rd('src/game.js')
js = re.sub(r"(\w+):'assets/music/(\w+)\.mp3'",
            lambda m: f"{m.group(1)}:'data:audio/mpeg;base64," + base64.b64encode(rd(f'assets/music/{m.group(2)}.mp3', 'rb')).decode() + "'", js)
html = html.replace('<link rel="stylesheet" href="css/style.css">', '<style>' + css + '</style>')
html = re.sub(r'<script src="src/(?!game\.js)(\w+)\.js"></script>', lambda m: '<script>' + rd('src/' + m.group(1) + '.js') + '</script>', html)  # módulos auxiliares (ground, roads, ...)
html = html.replace('<script src="src/game.js"></script>', '<script>' + js + '</script>')
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(r, 'dist', 'notscape.html')
os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
open(out, 'w', encoding='utf-8').write(html)
print('OK', out, len(html), 'bytes')
