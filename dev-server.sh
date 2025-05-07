#!/bin/bash

# Script para ejecutar el servidor de desarrollo
echo "Iniciando servidor de desarrollo con configuración optimizada..."

# Configurar variables de entorno para desarrollo
export NODE_OPTIONS="--max-old-space-size=8192"
export NEXT_TELEMETRY_DISABLED=1
export NEXT_IGNORE_TYPE_ERRORS=true
export NEXT_IGNORE_ESLINT=true

# Ejecutar servidor de desarrollo con Turbopack desactivado para mayor estabilidad
echo "Iniciando Next.js en modo desarrollo..."
npx next dev