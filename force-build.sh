#!/bin/bash

# Limpiar caché completamente
echo "Limpiando caché y archivos temporales..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf ~/.next

# Configurar opciones avanzadas para Next.js y Node
export NODE_OPTIONS="--max-old-space-size=16384 --no-warnings"
export NEXT_TELEMETRY_DISABLED=1
export NEXT_IGNORE_TYPE_ERRORS=true
export NEXT_IGNORE_ESLINT=true
export NEXT_EXPERIMENTAL_SKIP_CLIENT_VALIDATION=true
export NEXT_TURBO=false
export NEXT_SHARP_PATH=node_modules/sharp
export DISABLE_ERR_OVERLAY=true
export CI=false

# Ejecutar compilación forzada
echo "Iniciando compilación forzada..."
npx --no-install next build --no-lint