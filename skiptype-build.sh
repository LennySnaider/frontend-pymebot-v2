#!/bin/bash
# Script para construir el proyecto sin verificación de tipos
export NODE_OPTIONS="--max-old-space-size=16384"
export NEXT_SKIP_TYPECHECK=true
export DISABLE_TYPE_CHECKING=true
npx next build --no-lint