#!/usr/bin/env bash

# Script para listar assets R2 usando el endpoint /api/assets
# Requiere que el Worker esté en ejecución localmente con wrangler dev en http://127.0.0.1:8787

curl http://127.0.0.1:8787/api/assets

echo
