#!/bin/sh
# Baixa de novo as gravações do BigSoundBank listadas em LISTA.md (os .ogg não vão para o git).
# uso: sh baixar.sh   (dentro desta pasta)
cd "$(dirname "$0")"
for i in $(grep -oE '^\| *[0-9]{4}' LISTA.md | tr -d '| '); do
  [ -f "$i.ogg" ] || curl -s -f "https://bigsoundbank.com/UPLOAD/ogg/$i.ogg" -o "$i.ogg" || echo "falhou $i"
done
