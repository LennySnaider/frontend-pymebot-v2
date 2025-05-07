#!/bin/bash

# Configuración para compilación incremental optimizada
echo "Configurando entorno para compilación incremental..."
export NODE_OPTIONS="--max-old-space-size=16384"
export NEXT_TELEMETRY_DISABLED=1
export NEXT_IGNORE_TYPE_ERRORS=true
export NEXT_IGNORE_ESLINT=true
export NEXT_SHARP_PATH=node_modules/sharp
export NEXT_EXPERIMENTAL_SKIP_CLIENT_VALIDATION=true

# NO limpiar la caché para mantener el build incremental
echo "Manteniendo caché para build incremental..."

# Ejecutar compilación incremental con más memoria
echo "Iniciando compilación incremental..."
npx next build

# Comprobar el resultado
if [ $? -eq 0 ]; then
  echo "✅ Compilación incremental completada con éxito."
else
  echo "❌ La compilación incremental falló."
  echo "Intentando compilación parcial sin optimizaciones..."
  
  # Reducir alcance de optimizaciones para intentar compilar
  NODE_OPTIONS="--max-old-space-size=16384" \
  NEXT_IGNORE_TYPE_ERRORS=true \
  NEXT_IGNORE_ESLINT=true \
  NEXT_EXPERIMENTAL_SKIP_VALIDATION=true \
  NEXT_EXPERIMENTAL_PPR=false \
  NEXT_EXPERIMENTAL_OPTIMISTIC_CLIENT_CACHE=false \
  NEXT_EXPERIMENTAL_TURBO=false \
  npx next build --no-lint
  
  if [ $? -eq 0 ]; then
    echo "✅ Compilación parcial completada con éxito."
  else
    echo "❌ La compilación parcial también falló."
    echo "Puedes intentar con 'build-with-timeout.sh' para una compilación completa."
  fi
fi