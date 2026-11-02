#!/bin/sh
# NotScape · N0-HABILIDADES-ANIM · tira de fotogramas de una habilidad del jugador: sh tools/r3d/skill_pose.sh <id> <arma> <dir> <fase> <fase> …   (arma = id de objeto: esp_sangre, bw_pino, st_pino, lw_0d1 daga, lw_0m1 mandoble, lw_0b1 ballesta, lw_0c1 cetro; '' = puños)
ID=$1;EQ=$2;OUT=$3;shift 3;mkdir -p "$OUT"
for ph in "$@"; do
 python tools/fast/ns.py eval "S.eq.w='$EQ'||null;$(cat tools/r3d/skill_pose.js)(['$ID',$ph])" >/dev/null 2>&1
 sleep 1.5; python tools/fast/ns.py shot "$OUT/${ID}_$ph.png" >/dev/null 2>&1
done
