#!/bin/bash

# Limpiar caché
echo "Limpiando caché de Next.js..."
rm -rf .next
rm -rf node_modules/.cache

# Aumentar memoria para Node.js
export NODE_OPTIONS="--max-old-space-size=16384"

# Configurar opciones de Next.js para compilación
export NEXT_TELEMETRY_DISABLED=1
export NEXT_IGNORE_TYPE_ERRORS=true
export NEXT_IGNORE_ESLINT=true
export NEXT_EXPERIMENTAL_SKIP_CLIENT_VALIDATION=true

# Ejecutar compilación con opciones optimizadas
echo "Iniciando compilación con memoria aumentada y validación reducida..."
npx next build