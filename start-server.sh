#!/usr/bin/env sh
# Script para iniciar servidor local na pasta docs
DIR="$(dirname "$0")"
cd "$DIR/docs"
URL="http://localhost:8000"
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL" 2>/dev/null &
elif command -v open >/dev/null 2>&1; then
  open "$URL" 2>/dev/null &
fi
npx http-server . -p 8000 -c-1

