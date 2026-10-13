#!/usr/bin/env python3
"""Comprueba que ningún prop de aldea (PROPS.LAY) cae en acantilado/agua, ni sobre una estación, en ninguno de los 5 biomas.
Mira el pie del prop (colisión) y el ancho visual aproximado del sprite. Uso: python3 tools/props_check.py"""
import sys, os, subprocess, time
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8775', '--bind', '127.0.0.1'], cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1); bad = []
JS = '''()=>{const out=[],T=32;for(const e of PROPS.list){if(e.n==='asador')continue;const fx=(e.fp?e.fp[0]:6)+(e.fp&&e.fp[0]>12?14:6),fy=(e.fp?e.fp[1]:6)+(e.fp&&e.fp[0]>12?14:6);
 for(let dx=-fx;dx<=fx;dx+=8)for(let dy=-fy;dy<=fy;dy+=8){const h=TER.heightAt(e.x+dx,e.y+dy);if(!TER.isLand(h)){out.push(e.n+' k'+e.k+' ('+Math.round(e.x)+','+Math.round(e.y)+') sobre altura '+h);dx=fx+1;break}}
 const SZ={bank:[42,26],shop:[38,22],furnace:[24,20],fire:[26,18],anvil:[20,14],bench:[26,16],altar:[22,14]};
 for(const s of ST){const z=SZ[s.id]||[20,14];if(Math.abs(s.x-e.x)<(e.fp?e.fp[0]:6)+z[0]&&Math.abs(s.y-e.y)<(e.fp?e.fp[1]:6)+z[1])out.push(e.n+' k'+e.k+' solapa estación '+s.id)}}
 const LIN=new Set(['verja','valla','muroRuina','columna']),L=PROPS.list;for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){const a=L[i],b=L[j];if(a.k!==b.k||!a.fp||!b.fp||(a.fp[0]<=14&&b.fp[0]<=14))continue;if(LIN.has(a.n)&&LIN.has(b.n))continue;if(Math.abs(a.x-b.x)<a.fp[0]+b.fp[0]+4&&Math.abs(a.y-b.y)<a.fp[1]+b.fp[1]+4)out.push(a.n+' y '+b.n+' se solapan en k'+a.k+' ('+Math.round(a.x)+','+Math.round(a.y)+') ↔ ('+Math.round(b.x)+','+Math.round(b.y)+') fp '+a.fp+' | '+b.fp)}
 return out}'''
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page()
        pg.on('pageerror', lambda e: bad.append(str(e)))
        pg.goto('http://127.0.0.1:8775/index.html?noedit', wait_until='commit'); pg.wait_for_timeout(2000)
        bad += pg.evaluate(JS)
finally:
    srv.kill()
print('\n'.join(bad) if bad else 'props: todos sobre suelo y sin solapes')
print('RESULTADO:', 'FALLO' if bad else 'OK'); sys.exit(1 if bad else 0)
