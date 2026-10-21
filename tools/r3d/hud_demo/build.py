#!/usr/bin/env python3
"""Construye la demo del HUD «Susurro» a partir de su FUENTE.
Uso:  python3 -I tools/r3d/hud_demo/build.py [carpeta_salida_de_pruebas]
Escribe:
  docs/style-reference/r3d/hud-susurro.html   -> página AUTOCONTENIDA publicable (three r128 desde cdnjs, fondos en base64)
  <salida>/test.html (+ three.module.js)       -> misma página con el three LOCAL de vendor/ (sirve para pruebas sin red)
La fuente es docs/style-reference/r3d/hud-susurro.src.html (placeholders {{BG_DIA}}, {{BG_ATA}}, {{BG_NOC}}).
"""
import base64,os,shutil,sys
R=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..','..'))
D=os.path.join(R,'docs','style-reference','r3d')
out=sys.argv[1] if len(sys.argv)>1 else '/tmp/hud_demo_test'
os.makedirs(out,exist_ok=True)
s=open(os.path.join(D,'hud-susurro.src.html'),encoding='utf-8').read()
for k,f in (('DIA','bg_dia'),('ATA','bg_atardecer'),('NOC','bg_noche')):
    b=open(os.path.join(D,'hud_bg',f+'.jpg'),'rb').read()
    s=s.replace('{{BG_%s}}'%k,'data:image/jpeg;base64,'+base64.b64encode(b).decode())
open(os.path.join(D,'hud-susurro.html'),'w',encoding='utf-8').write(s)
CDN='<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
assert CDN in s
t=s.replace(CDN,'').replace('<script>\n(function(){','<script type="module">import * as THREE from "./three.module.js";window.THREE=THREE;\n(function(){',1)
t=t.replace('<title>','<meta charset="utf-8"><title>',1)
open(os.path.join(out,'test.html'),'w',encoding='utf-8').write(t)
shutil.copy(os.path.join(R,'vendor','three','build','three.module.js'),os.path.join(out,'three.module.js'))
print('ok ->',os.path.join(D,'hud-susurro.html'),'y',out)
