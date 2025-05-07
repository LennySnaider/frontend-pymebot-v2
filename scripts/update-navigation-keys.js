/**
 * Script para actualizar claves "concepts.*" a "modules.*" en navigation.config/index.ts
 * Mantiene las claves de traducción (translateKey) sin cambios por compatibilidad
 */

const fs = require('fs');
const path = require('path');

// Ruta al archivo de configuración de navegación
const navConfigPath = path.join(__dirname, '../src/configs/navigation.config/index.ts');

// Función principal
function main() {
  console.log('Actualizando claves en navigation.config/index.ts...');
  
  try {
    // Leer el archivo
    let content = fs.readFileSync(navConfigPath, 'utf8');
    
    // Contador de cambios
    let keyChanges = 0;
    let pathChanges = 0;
    
    // Reemplazar claves "concepts.*" con "modules.*"
    const updatedKeys = content.replace(/key: ['"]concepts\.(.*?)['"]/g, (match, p1) => {
      keyChanges++;
      return `key: 'modules.${p1}'`;
    });
    
    // Reemplazar CONCEPTS_PREFIX_PATH con MODULES_PREFIX_PATH para mayor claridad semántica
    const updatedPaths = updatedKeys.replace(/\${CONCEPTS_PREFIX_PATH}/g, (match) => {
      pathChanges++;
      return '${MODULES_PREFIX_PATH}';
    });
    
    // Guardar el archivo actualizado
    fs.writeFileSync(navConfigPath, updatedPaths);
    
    console.log(`✅ Actualización completada.`);
    console.log(`   - ${keyChanges} claves "concepts.*" cambiadas a "modules.*"`);
    console.log(`   - ${pathChanges} rutas CONCEPTS_PREFIX_PATH actualizadas`);
    
  } catch (error) {
    console.error('❌ Error al actualizar el archivo:', error);
  }
}

// Ejecutar el script
main();