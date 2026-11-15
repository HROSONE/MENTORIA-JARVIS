#!/usr/bin/env bash
# Monta o MP4 final: bash montar.sh <pasta_dos_quadros> <som.mp3> <saida.mp4>   (acabamento: cor mais viva, leve vinheta e grão)
set -euo pipefail
Q=${1:?pasta dos quadros}; SOM=${2:?som}; OUT=${3:?saida.mp4}
ffmpeg -y -loglevel error -framerate 30 -i "$Q/f%05d.jpg" -i "$SOM" \
  -vf "eq=contrast=1.06:saturation=1.18:gamma=0.97,vignette=PI/6,noise=alls=4:allf=t,format=yuv420p" \
  -c:v libx264 -preset slow -b:v 3200k -maxrate 4000k -bufsize 8000k -profile:v high -movflags +faststart -c:a aac -b:a 160k -shortest "$OUT"
ls -la "$OUT"
