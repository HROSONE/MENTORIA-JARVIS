#!/usr/bin/env bash
# Monta o MP4 do edit: bash montar.sh <pasta_quadros_1080> <saida.mp4> [sfx_edit.wav]
# Gera <saida>_mudo.mp4 (só imagem, para encaixar a música com o com_musica.sh) e <saida>.mp4 (imagem + efeitos sonoros curtos).
set -euo pipefail
Q=${1:?pasta dos quadros}; OUT=${2:?saida.mp4}; SFX=${3:-}
MUDO="${OUT%.mp4}_mudo.mp4"
ffmpeg -y -loglevel error -framerate 30 -i "$Q/f%05d.jpg" -c:v libx264 -preset slow -crf 19 -maxrate 5000k -bufsize 10000k -profile:v high -pix_fmt yuv420p -movflags +faststart "$MUDO"
if [ -n "$SFX" ]; then ffmpeg -y -loglevel error -i "$MUDO" -i "$SFX" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 160k -shortest -movflags +faststart "$OUT"; ls -la "$MUDO" "$OUT"; else ls -la "$MUDO"; fi
