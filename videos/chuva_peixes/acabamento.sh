#!/usr/bin/env bash
# Acabamento de um quadro solto (PNG): brilho nas luzes (bloom), cor mais viva, vinheta e grão. Uso: bash acabamento.sh entrada.png saida.png
set -euo pipefail
ffmpeg -y -loglevel error -i "$1" -filter_complex "[0:v]format=gbrp,split=3[a][b][c];[b]curves=all='0/0 0.62/0 0.9/0.8 1/1',gblur=sigma=14[bl];[c]curves=all='0/0 0.75/0 1/1',gblur=sigma=36[bl2];[a][bl]blend=all_mode=screen:all_opacity=0.5[x];[x][bl2]blend=all_mode=screen:all_opacity=0.32[y];[y]eq=contrast=1.05:saturation=1.12:gamma=1.05,vignette=PI/6,noise=alls=5:allf=t,format=rgb24[v]" -map "[v]" -frames:v 1 "$2"
