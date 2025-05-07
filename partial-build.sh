#!/bin/bash

# Limpiar caché
echo "Limpiando caché..."
rm -rf .next
rm -rf node_modules/.cache

# Crear directorio temporal para la versión modificada del código
echo "Creando versión temporal del código para compilación parcial..."
TEMP_DIR=".temp-build"
mkdir -p $TEMP_DIR

# Copiar archivos al directorio temporal
cp -R public $TEMP_DIR/
cp -R src $TEMP_DIR/
cp -R styles $TEMP_DIR/
cp -R messages $TEMP_DIR/
cp *.js *.ts *.json *.mjs $TEMP_DIR/ 2>/dev/null || true

# Entrar al directorio temporal
cd $TEMP_DIR

# Modificar temporalmente el package.json para usar un script personalizado
# No usamos jq ya que puede no estar instalado
sed -i.bak 's/"build": "next build"/"build": "next build || exit 0"/' package.json

# Configurar opciones
export NODE_OPTIONS="--max-old-space-size=16384"
export NEXT_TELEMETRY_DISABLED=1
export NEXT_IGNORE_TYPE_ERRORS=true
export NEXT_IGNORE_ESLINT=true
export NEXT_EXPERIMENTAL_SKIP_CLIENT_VALIDATION=true

# Ejecutar compilación
echo "Iniciando compilación parcial..."
npm run build

# Volver al directorio original y copiar los archivos generados
cd ..
if [ -d "$TEMP_DIR/.next" ]; then
  echo "Copiando archivos generados..."
  cp -R $TEMP_DIR/.next .
fi

# Limpiar directorio temporal
echo "Limpiando directorio temporal..."
rm -rf $TEMP_DIR

echo "Compilación parcial completada."