#!/usr/bin/env bash
# Monta o MP4 final usando videos/core/montar.sh com o acabamento deste vídeo.
set -euo pipefail
exec bash "$(dirname "$0")/../core/montar.sh" --acabamento padrao --bitrate 2800k --maxrate 3500k --bufsize 7000k --audio 128k "$@"
