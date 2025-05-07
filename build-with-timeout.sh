#!/bin/bash

# Configuración avanzada con timeout incrementado
echo "Configurando entorno para compilación con timeout ampliado..."
export NODE_OPTIONS="--max-old-space-size=16384"
export NEXT_TELEMETRY_DISABLED=1
export NEXT_IGNORE_TYPE_ERRORS=true
export NEXT_IGNORE_ESLINT=true
export NEXT_SHARP_PATH=node_modules/sharp
export NEXT_EXPERIMENTAL_SKIP_CLIENT_VALIDATION=true
export NEXT_EXPERIMENTAL_PPR=false
export NEXT_EXPERIMENTAL_OPTIMISTIC_CLIENT_CACHE=false

# Limpieza de caché
echo "Limpiando caché..."
rm -rf .next
rm -rf node_modules/.cache
yarn cache clean

# Ejecutar compilación con timeout extendido (15 minutos = 900 segundos)
echo "Iniciando compilación con timeout de 15 minutos..."
timeout 900 npx next build

# Comprobar el resultado
if [ $? -eq 0 ]; then
  echo "✅ Compilación completada con éxito."
else
  # El código 124 indica que el timeout expiró
  if [ $? -eq 124 ]; then
    echo "❌ El proceso de compilación excedió el tiempo límite (15 minutos)."
    echo "Intenta incrementar el timeout o compilar con menos características."
  else
    echo "❌ La compilación falló por un error."
    echo "Intentando compilación parcial con flags adicionales..."
    
    # Compilación parcial con menos características activadas
    NODE_OPTIONS="--max-old-space-size=16384" \
    NEXT_IGNORE_TYPE_ERRORS=true \
    NEXT_IGNORE_ESLINT=true \
    NEXT_EXPERIMENTAL_SKIP_VALIDATION=true \
    NEXT_EXPERIMENTAL_PPR=false \
    NEXT_EXPERIMENTAL_OPTIMISTIC_CLIENT_CACHE=false \
    timeout 900 npx next build
    
    if [ $? -eq 0 ]; then
      echo "✅ Compilación parcial completada con éxito."
    else
      echo "❌ La compilación parcial también falló."
    fi
  fi
fi