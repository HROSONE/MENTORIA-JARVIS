#!/usr/bin/env bash
# Monta o MP4 final usando videos/core/montar.sh com o acabamento deste vídeo.
set -euo pipefail
exec bash "$(dirname "$0")/../core/montar.sh" --acabamento padrao --bitrate 2550k --maxrate 3200k --bufsize 6400k --audio 128k "$@"
