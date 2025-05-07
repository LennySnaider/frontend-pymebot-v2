#!/bin/bash

# Script para construir el proyecto incrementalmente con límites de memoria
echo "Iniciando construcción incremental con técnicas de ahorro de memoria..."

# Limpiar caché parcialmente (mantener algunas cosas puede ayudar)
rm -rf .next/cache/webpack

# Configuración de entorno para reducir uso de memoria
export NODE_OPTIONS="--max-old-space-size=8192"
export NEXT_TELEMETRY_DISABLED=1
export NEXT_IGNORE_TYPE_ERRORS=true
export NEXT_IGNORE_ESLINT=true
export NEXT_DISABLE_SOURCEMAPS=true   # Deshabilitar sourcemaps reduce memoria
export NEXT_MINIMAL_CACHE=true        # Minimizar caché
export COMPRESS_CHECK=false           # Desactivar compresión durante la compilación

# Ejecutar construcción con opciones para reducir uso de memoria
echo "Construcción principal (puede tardar varios minutos)..."
npx next build --no-lint --no-mangling