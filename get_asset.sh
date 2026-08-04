#!/usr/bin/env bash

# Script para descargar un asset de R2 usando el endpoint /api/assets/:key
# Requiere que el Worker esté en ejecución localmente con wrangler dev en http://127.0.0.1:8787

if [ "$#" -ne 2 ]; then
  echo "Uso: $0 <clave-en-r2> <archivo-destino>"
  echo "Ejemplo: $0 documento.txt descarga.txt"
  exit 1
fi

R2_KEY="$1"
OUTPUT_FILE="$2"

curl -sS http://127.0.0.1:8787/api/assets/$R2_KEY -o "$OUTPUT_FILE"

echo "Descargado en $OUTPUT_FILE"
