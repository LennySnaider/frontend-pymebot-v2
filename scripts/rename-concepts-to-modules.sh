#!/bin/bash

# Script para renombrar el directorio concepts a modules
# Uso: ./rename-concepts-to-modules.sh

# Colores para salida
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BACKUP_PATH="../v2-frontend-pymebot-backup-$(date +%Y%m%d%H%M%S)"

echo -e "${BLUE}=== SCRIPT PARA RENOMBRAR CONCEPTS A MODULES ===${NC}"
echo -e "${YELLOW}Este script renombrará el directorio concepts a modules y actualizará todas las referencias.${NC}"
echo -e "${YELLOW}Por favor asegúrate de tener una copia de seguridad antes de continuar.${NC}"
echo 

# Verificar que estamos en el directorio correcto
if [ ! -d "src/app/(protected-pages)/concepts" ]; then
  echo -e "${RED}Error: No se encuentra el directorio src/app/(protected-pages)/concepts${NC}"
  echo "Por favor ejecuta este script desde la raíz del proyecto."
  exit 1
fi

# Preguntar confirmación
read -p "¿Quieres crear una copia de seguridad automática? (y/n): " BACKUP
if [[ $BACKUP == "y" || $BACKUP == "Y" ]]; then
  echo -e "${BLUE}Creando copia de seguridad en $BACKUP_PATH...${NC}"
  cp -r . $BACKUP_PATH
  echo -e "${GREEN}Copia de seguridad creada exitosamente.${NC}"
fi

read -p "¿Proceder con el renombrado? Este cambio afectará todo el proyecto (y/n): " PROCEED
if [[ $PROCEED != "y" && $PROCEED != "Y" ]]; then
  echo -e "${YELLOW}Operación cancelada.${NC}"
  exit 0
fi

echo
echo -e "${BLUE}=== INICIANDO PROCESO DE RENOMBRADO ===${NC}"
echo

# 1. Crear directorio modules
echo -e "${BLUE}Paso 1: Crear directorio modules y copiar contenido...${NC}"
mkdir -p src/app/\(protected-pages\)/modules
cp -r src/app/\(protected-pages\)/concepts/* src/app/\(protected-pages\)/modules/
echo -e "${GREEN}Contenido copiado exitosamente.${NC}"

# 2. Verificar que la copia fue correcta
echo -e "${BLUE}Paso 2: Verificando la copia...${NC}"
DIFF_OUTPUT=$(diff -r src/app/\(protected-pages\)/concepts src/app/\(protected-pages\)/modules)
if [ -z "$DIFF_OUTPUT" ]; then
  echo -e "${GREEN}Verificación exitosa: Los directorios son idénticos.${NC}"
else
  echo -e "${RED}ADVERTENCIA: Se encontraron diferencias entre los directorios.${NC}"
  echo "Diferencias:"
  echo "$DIFF_OUTPUT"
  read -p "¿Continuar a pesar de las diferencias? (y/n): " CONTINUE
  if [[ $CONTINUE != "y" && $CONTINUE != "Y" ]]; then
    echo -e "${YELLOW}Operación cancelada.${NC}"
    exit 0
  fi
fi

# 3. Guardar referencias
echo -e "${BLUE}Paso 3: Guardando referencias actuales para verificación...${NC}"
mkdir -p tmp
grep -r "from.*concepts" src/ --include="*.tsx" --include="*.ts" > tmp/concept_imports.txt
grep -r "concepts/" src/ --include="*.tsx" --include="*.ts" > tmp/concept_paths.txt
echo -e "${GREEN}Referencias guardadas en tmp/concept_imports.txt y tmp/concept_paths.txt${NC}"

# 4. Actualizar importaciones
echo -e "${BLUE}Paso 4: Actualizando importaciones...${NC}"
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|app/(protected-pages)/concepts|app/(protected-pages)/modules|g'
echo -e "${GREEN}Importaciones actualizadas.${NC}"

# 5. Actualizar rutas
echo -e "${BLUE}Paso 5: Actualizando rutas...${NC}"
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|/concepts/|/modules/|g'
echo -e "${GREEN}Rutas actualizadas.${NC}"

# 6. Verificar otras referencias
echo -e "${BLUE}Paso 6: Verificando otras referencias...${NC}"
grep -r "concepts" ./ --include="*.js" --include="*.json" --include="*.mjs" > tmp/other_references.txt
echo -e "${YELLOW}Se guardaron otras referencias en tmp/other_references.txt${NC}"
echo -e "${YELLOW}Revisa este archivo y actualiza manualmente cualquier referencia restante.${NC}"

# No eliminar el directorio original por seguridad
echo
echo -e "${BLUE}=== PROCESO COMPLETADO ===${NC}"
echo -e "${YELLOW}El directorio original 'concepts' NO ha sido eliminado automáticamente.${NC}"
echo -e "${YELLOW}Una vez que hayas verificado que todo funciona correctamente, puedes eliminarlo con:${NC}"
echo -e "rm -rf src/app/\(protected-pages\)/concepts"
echo
echo -e "${BLUE}=== SIGUIENTES PASOS ===${NC}"
echo -e "1. Inicia la aplicación con 'npm run dev' y verifica que todo funcione correctamente."
echo -e "2. Revisa el archivo tmp/other_references.txt y actualiza manualmente cualquier referencia restante."
echo -e "3. Una vez verificado todo, elimina el directorio original."
echo -e "4. Haz commit de los cambios."
echo
echo -e "${GREEN}¡Listo! El proceso de renombrado ha sido completado.${NC}"