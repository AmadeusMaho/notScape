#!/bin/sh
# NotScape · hojas de contacto del héroe (atuendos o peinados) con la GPU real. Requiere `python tools/fast/ns.py start --gpu` en marcha.
# uso: sh tools/r3d/look_sheet.sh outfit|hair "<js de preparación>" salida.jpg
cd "$(dirname "$0")/../.."
JS=tools/r3d/outfit_sheet.js; [ "$1" = hair ] && JS=tools/r3d/hair_sheet.js
TMP=$(mktemp)
python tools/fast/ns.py eval "$2;$(cat $JS)" > "$TMP"
python - "$TMP" "$3" <<'P'
import sys,json,base64
s=open(sys.argv[1],encoding='utf-8',errors='ignore').read().strip()
try: s=json.loads(s)
except Exception: pass
if not isinstance(s,str) or ',' not in s: print('ERR',str(s)[:600]); sys.exit(1)
open(sys.argv[2],'wb').write(base64.b64decode(s.split(',',1)[1])); print('ok',sys.argv[2])
P
rm -f "$TMP"
