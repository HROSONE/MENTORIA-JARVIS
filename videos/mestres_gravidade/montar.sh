#!/usr/bin/env bash
# Monta o MP4 final usando videos/core/montar.sh com o acabamento deste vídeo.
set -euo pipefail
exec bash "$(dirname "$0")/../core/montar.sh" --acabamento vivo --bitrate 3200k --maxrate 4000k --bufsize 8000k --audio 160k "$@"
