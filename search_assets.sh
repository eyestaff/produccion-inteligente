#!/usr/bin/env bash

# Script para buscar assets R2 usando el endpoint /api/assets
# Requiere que el Worker esté en ejecución localmente con wrangler dev en http://127.0.0.1:8787

if [ "$#" -lt 1 ]; then
  echo "Uso: $0 <consulta> [pagina] [limite]"
  echo "Ejemplo: $0 documento 1 10"
  exit 1
fi

QUERY="$1"
PAGE="${2:-1}"
LIMIT="${3:-10}"

curl -G http://127.0.0.1:8787/api/assets \
  --data-urlencode "q=$QUERY" \
  --data-urlencode "page=$PAGE" \
  --data-urlencode "limit=$LIMIT"

echo
