#!/usr/bin/env bash

# Script para subir un archivo local a R2 usando el endpoint /api/assets
# Requiere que el Worker esté en ejecución localmente con wrangler dev en http://127.0.0.1:8787

if [ "$#" -ne 2 ]; then
  echo "Uso: $0 <ruta-al-archivo> <clave-en-r2>"
  exit 1
fi

FILE_PATH="$1"
R2_KEY="$2"

if [ ! -f "$FILE_PATH" ]; then
  echo "Error: el archivo '$FILE_PATH' no existe."
  exit 1
fi

BASE64_CONTENT=$(base64 < "$FILE_PATH" | tr -d '\n')

curl -X POST http://127.0.0.1:8787/api/assets \
  -H "Content-Type: application/json" \
  -d "{\"key\": \"$R2_KEY\", \"content\": \"$BASE64_CONTENT\"}"

echo
