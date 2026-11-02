#!/bin/sh
# NotScape · N0-ESQUELETOS · tira de fotogramas de un enemigo: sh tools/r3d/enemy_strip.sh <id> <salida_dir> <fase> <fase> ...   (fase -1 = sin ataque; .17 = anticipación; .18 = golpe)
# Requiere `python tools/fast/ns.py start --gpu` y el héroe en un claro de la Pradera (NSTEST.tp). Un PNG por fase.
ID=$1;OUT=$2;shift 2;mkdir -p "$OUT"
for u in "$@"; do
 python tools/fast/ns.py eval "document.querySelectorAll('.np,#nps').forEach(e=>e.style.display='none');$(cat tools/r3d/enemy_strip.js)(['$ID',[$u]])" >/dev/null 2>&1
 sleep 2; python tools/fast/ns.py shot "$OUT/${ID}_$u.png" >/dev/null 2>&1
done
