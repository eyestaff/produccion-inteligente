#!/usr/bin/env bash

# Script para actualizar un registro D1 usando el endpoint /api/records/:id
# Requiere que el Worker esté en ejecución localmente con wrangler dev en http://127.0.0.1:8787

if [ "$#" -ne 3 ]; then
  echo "Uso: $0 <id-del-registro> <nombre> <valor>"
  echo "Ejemplo: $0 1 sensor-1 80"
  exit 1
fi

RECORD_ID="$1"
NAME="$2"
VALUE="$3"

curl -X PUT http://127.0.0.1:8787/api/records/$RECORD_ID \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$NAME\", \"value\": \"$VALUE\"}"

echo
