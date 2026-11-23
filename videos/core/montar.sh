#!/usr/bin/env bash
# Monta o MP4 final a partir dos quadros JPEG (f00000.jpg...) e do áudio.
# Uso:
#   bash montar.sh [--acabamento bloom|padrao|vivo] [--fps 30] [--crf 22] [--bitrate 2550k] [--maxrate 3400k] [--bufsize 8000k] [--audio 160k] <pasta_dos_quadros> <som> <saida.mp4>
#
# Perfis de acabamento:
#   bloom  (padrão): bloom em dois raios + cor viva + vinheta + grão (usado em chuva_peixes e vulcao_milharal)
#   padrao         : contraste/saturação leves + vinheta + grão (usado em sono_militar, todos_pulando, viagem_futuro, elevador, anurag)
#   vivo           : cores mais saturadas + vinheta + grão (usado em mestres_gravidade)
set -euo pipefail

ACABAMENTO="bloom"
FPS="30"
CRF="22"
BITRATE=""
MAXRATE="3400k"
BUFSIZE="8000k"
AUDIO="160k"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --acabamento) ACABAMENTO="$2"; shift 2 ;;
    --fps)        FPS="$2"; shift 2 ;;
    --crf)        CRF="$2"; shift 2 ;;
    --bitrate)    BITRATE="$2"; shift 2 ;;
    --maxrate)    MAXRATE="$2"; shift 2 ;;
    --bufsize)    BUFSIZE="$2"; shift 2 ;;
    --audio)      AUDIO="$2"; shift 2 ;;
    --)           shift; break ;;
    -*)           echo "Opção desconhecida: $1" >&2; exit 2 ;;
    *)            break ;;
  esac
done

Q=${1:?pasta dos quadros}
SOM=${2:?arquivo de som}
OUT=${3:?saida.mp4}

RATE_ARGS=(-maxrate "$MAXRATE" -bufsize "$BUFSIZE")
if [[ -n "$BITRATE" ]]; then
  RATE_ARGS=(-b:v "$BITRATE" "${RATE_ARGS[@]}")
else
  RATE_ARGS=(-crf "$CRF" "${RATE_ARGS[@]}")
fi

case "$ACABAMENTO" in
  bloom)
    ffmpeg -y -loglevel error -framerate "$FPS" -i "$Q/f%05d.jpg" -i "$SOM" \
      -filter_complex "[0:v]format=gbrp,split=3[a][b][c];[b]curves=all='0/0 0.62/0 0.9/0.8 1/1',gblur=sigma=14[bl];[c]curves=all='0/0 0.75/0 1/1',gblur=sigma=36[bl2];[a][bl]blend=all_mode=screen:all_opacity=0.5[x];[x][bl2]blend=all_mode=screen:all_opacity=0.32[y];[y]eq=contrast=1.05:saturation=1.12:gamma=1.05,vignette=PI/6,noise=alls=5:allf=t,format=yuv420p[v]" \
      -map "[v]" -map 1:a -c:v libx264 -preset slow "${RATE_ARGS[@]}" -profile:v high -movflags +faststart \
      -c:a aac -b:a "$AUDIO" -shortest "$OUT"
    ;;
  padrao)
    ffmpeg -y -loglevel error -framerate "$FPS" -i "$Q/f%05d.jpg" -i "$SOM" \
      -vf "eq=contrast=1.05:saturation=1.06,vignette=PI/6,noise=alls=5:allf=t,format=yuv420p" \
      -c:v libx264 -preset slow "${RATE_ARGS[@]}" -profile:v high -movflags +faststart \
      -c:a aac -b:a "$AUDIO" -shortest "$OUT"
    ;;
  vivo)
    ffmpeg -y -loglevel error -framerate "$FPS" -i "$Q/f%05d.jpg" -i "$SOM" \
      -vf "eq=contrast=1.06:saturation=1.18:gamma=0.97,vignette=PI/6,noise=alls=4:allf=t,format=yuv420p" \
      -c:v libx264 -preset slow "${RATE_ARGS[@]}" -profile:v high -movflags +faststart \
      -c:a aac -b:a "$AUDIO" -shortest "$OUT"
    ;;
  *)
    echo "Acabamento inválido: $ACABAMENTO (use bloom, padrao ou vivo)" >&2
    exit 2
    ;;
esac

ls -la "$OUT"
