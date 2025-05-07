#!/bin/bash

# Script para construir en dos fases para reducir uso de memoria
echo "Iniciando construcción en dos fases para reducir memoria..."

# Limpiar completamente
rm -rf .next

# Fase 1: Compilación parcial para generar caché
echo "Fase 1: Compilación inicial sin optimización..."
export NODE_OPTIONS="--max-old-space-size=8192"
export NEXT_TELEMETRY_DISABLED=1
export NEXT_IGNORE_TYPE_ERRORS=true
export NEXT_IGNORE_ESLINT=true
export NEXT_DISABLE_SOURCEMAPS=true

# Primera fase: solo transpilación, sin optimización
npx next build --no-lint --no-mangling || true

# Limpiar algunas partes específicas de la caché
rm -rf .next/cache/webpack

echo "Esperando a que el sistema libere memoria..."
sleep 3

# Fase 2: Finalizar la compilación
echo "Fase 2: Compilación final con optimización limitada..."
export NODE_OPTIONS="--max-old-space-size=12288 --expose-gc"

# Construir de nuevo, esta vez con la caché parcial ya generada
npx next build --no-lint