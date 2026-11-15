#!/usr/bin/env bash
# Encaixa a música no edit: bash com_musica.sh <musica.mp3> <edit_mudo.mp4> <saida.mp4> <segundo_do_drop_na_musica> [volume_efeitos=0.45]
# A queda do vídeo é em 6,713 s (batida 17, 143 BPM). Passe o segundo da música em que a queda dela acontece; o script corta o início da música (ou atrasa, se faltar)
# para as duas quedas coincidirem, faz fade de saída no final e mistura os efeitos curtos (sfx_edit.wav) por cima.
set -euo pipefail
MUS=${1:?musica.mp3}; VID=${2:?edit_mudo.mp4}; OUT=${3:?saida.mp4}; DROP=${4:?segundo do drop na musica}; VOL=${5:-0.45}
AQUI=$(cd "$(dirname "$0")" && pwd); QUEDA=6.713; DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VID")
INI=$(python3 -c "print(round($DROP - $QUEDA, 3))")
if python3 -c "import sys; sys.exit(0 if $INI >= 0 else 1)"; then ENT="-ss $INI -i $MUS"; ATR=""; else ENT="-i $MUS"; ATR=",adelay=$(python3 -c "print(int(-$INI*1000))")|$(python3 -c "print(int(-$INI*1000))")"; fi
FADE=$(python3 -c "print(round($DUR - 1.2, 3))")
SFX=$(mktemp --suffix=.wav); python3 -I "$AQUI/sfx_edit.py" "$SFX" >/dev/null
ffmpeg -y -loglevel error -i "$VID" $ENT -i "$SFX" -filter_complex "[1:a]atrim=0:$DUR,asetpts=PTS-STARTPTS${ATR},afade=t=out:st=$FADE:d=1.2[m];[2:a]volume=$VOL[s];[m][s]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$OUT"
ls -la "$OUT"
