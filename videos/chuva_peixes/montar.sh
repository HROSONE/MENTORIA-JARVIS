#!/usr/bin/env bash
# Monta o MP4 final: bash montar.sh <pasta_dos_quadros> <som.mp3> <saida.mp4>
# Acabamento: brilho nas luzes (bloom em dois raios), cor mais viva, vinheta leve e grão (o mesmo de acabamento.sh).
set -euo pipefail
Q=${1:?pasta dos quadros}; SOM=${2:?som}; OUT=${3:?saida.mp4}
ffmpeg -y -loglevel error -framerate 30 -i "$Q/f%05d.jpg" -i "$SOM" -filter_complex "[0:v]format=gbrp,split=3[a][b][c];[b]curves=all='0/0 0.62/0 0.9/0.8 1/1',gblur=sigma=14[bl];[c]curves=all='0/0 0.75/0 1/1',gblur=sigma=36[bl2];[a][bl]blend=all_mode=screen:all_opacity=0.5[x];[x][bl2]blend=all_mode=screen:all_opacity=0.32[y];[y]eq=contrast=1.05:saturation=1.12:gamma=1.05,vignette=PI/6,noise=alls=5:allf=t,format=yuv420p[v]" \
  -map "[v]" -map 1:a -c:v libx264 -preset slow -crf 22 -maxrate 3400k -bufsize 8000k -profile:v high -movflags +faststart -c:a aac -b:a 160k -shortest "$OUT"
ls -la "$OUT"
