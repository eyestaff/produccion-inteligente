#!/usr/bin/env bash

# Script para eliminar un asset de R2 usando el endpoint /api/assets/:key
# Requiere que el Worker esté en ejecución localmente con wrangler dev en http://127.0.0.1:8787

if [ "$#" -ne 1 ]; then
  echo "Uso: $0 <clave-en-r2>"
  exit 1
fi

R2_KEY="$1"

curl -X DELETE http://127.0.0.1:8787/api/assets/$R2_KEY \
  -H "Content-Type: application/json"

echo
