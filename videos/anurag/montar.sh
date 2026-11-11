#!/usr/bin/env bash
# Monta o MP4 final a partir dos quadros renderizados (render.js) e do som (sfx_anurag.py).
# Uso:  bash montar.sh <pasta_dos_quadros> <som.wav> <saida.mp4>
# Acabamento: leve vinheta, grão fino e contraste; H.264 ~3 Mbps (+ AAC 128 kbps) para caber em ~20 MB.
set -euo pipefail
Q=${1:?pasta dos quadros}; WAV=${2:?som.wav}; OUT=${3:?saida.mp4}
ffmpeg -y -loglevel error -framerate 30 -i "$Q/f%05d.jpg" -i "$WAV" \
  -vf "eq=contrast=1.05:saturation=1.06,vignette=PI/6,noise=alls=5:allf=t,format=yuv420p" \
  -c:v libx264 -preset slow -b:v 3000k -maxrate 3800k -bufsize 7600k -profile:v high -movflags +faststart \
  -c:a aac -b:a 128k -shortest "$OUT"
ls -la "$OUT"
