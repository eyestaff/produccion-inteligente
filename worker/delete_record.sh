#!/usr/bin/env bash

# Script para eliminar un registro D1 usando el endpoint /api/records/:id
# Requiere que el Worker esté en ejecución localmente con wrangler dev en http://127.0.0.1:8787

if [ "$#" -ne 1 ]; then
  echo "Uso: $0 <id-del-registro>"
  echo "Ejemplo: $0 1"
  exit 1
fi

RECORD_ID="$1"

curl -X DELETE http://127.0.0.1:8787/api/records/$RECORD_ID \
  -H "Content-Type: application/json"

echo
