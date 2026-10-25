#!/usr/bin/env sh
cd "$(dirname "$0")"
echo "LEGO Dimensions Toy Pad - painel PS4 | criado por RafaZin77"
[ -d node_modules ] || npm install --omit=dev
exec node server.js
