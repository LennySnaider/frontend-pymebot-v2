/**
 * Script para actualizar las referencias a claves de traducción
 * Cambia "nav.concepts*" a "nav.modules*" en navigation.config/index.ts
 */

const fs = require('fs');
const path = require('path');

// Ruta al archivo de configuración de navegación
const navConfigPath = path.join(__dirname, '../src/configs/navigation.config/index.ts');

// Función principal
function main() {
  console.log('Actualizando referencias a claves de traducción en navigation.config/index.ts...');
  
  try {
    // Leer el archivo
    let content = fs.readFileSync(navConfigPath, 'utf8');
    
    // Contador de cambios
    let translationKeyChanges = 0;
    
    // Reemplazar todas las ocurrencias de "nav.concepts*" con "nav.modules*" en las claves de traducción
    const updatedContent = content.replace(/translateKey: ['"]nav\.concepts([^'"]*)['"]/g, (match, p1) => {
      translationKeyChanges++;
      return `translateKey: 'nav.modules${p1}'`;
    });
    
    // Guardar el archivo actualizado
    fs.writeFileSync(navConfigPath, updatedContent);
    
    console.log(`✅ Actualización completada.`);
    console.log(`   - ${translationKeyChanges} claves de traducción "nav.concepts*" cambiadas a "nav.modules*"`);
    
  } catch (error) {
    console.error('❌ Error al actualizar el archivo:', error);
  }
}

// Ejecutar el script
main();