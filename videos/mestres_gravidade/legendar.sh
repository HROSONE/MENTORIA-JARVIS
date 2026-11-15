#!/usr/bin/env bash
# Versão com as quatro falas na tela (opcional do roteiro): bash legendar.sh mestres_da_gravidade.mp4 mestres_da_gravidade_legendas.mp4
set -euo pipefail
IN=${1:?video}; OUT=${2:?saida}; F=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf; D=$(dirname "$0")/legendas
dt() { echo "drawtext=fontfile=$F:textfile=$D/$1.txt:fontsize=58:fontcolor=white:borderw=4:bordercolor=black@0.85:box=1:boxcolor=black@0.25:boxborderw=18:line_spacing=10:x=(w-text_w)/2:y=h*0.16:enable='between(t,$2,$3)':alpha='if(lt(t,$2+0.25),(t-$2)/0.25,if(gt(t,$3-0.25),($3-t)/0.25,1))'"; }
ffmpeg -y -loglevel error -i "$IN" -vf "$(dt 1 1.0 4.2),$(dt 2 14.0 17.6),$(dt 3 21.0 24.6),$(dt 4 27.0 29.6)" -c:v libx264 -preset slow -b:v 3200k -pix_fmt yuv420p -c:a copy -movflags +faststart "$OUT"
ls -la "$OUT"
