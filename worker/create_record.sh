#!/usr/bin/env bash

# Script para crear un registro en D1 usando el endpoint /api/records
# Requiere que el Worker esté en ejecución localmente con wrangler dev en http://127.0.0.1:8787

if [ "$#" -ne 1 ]; then
  echo "Uso: $0 <archivo-json>"
  echo "Ejemplo: $0 registro.json"
  exit 1
fi

JSON_FILE="$1"

if [ ! -f "$JSON_FILE" ]; then
  echo "Error: el archivo '$JSON_FILE' no existe."
  exit 1
fi

curl -X POST http://127.0.0.1:8787/api/records \
  -H "Content-Type: application/json" \
  -d @"$JSON_FILE"

echo
