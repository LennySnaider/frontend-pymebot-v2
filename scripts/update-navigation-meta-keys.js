/**
 * Script para actualizar las referencias a claves de traducción en las descripciones
 * Cambia "nav.concepts*" a "nav.modules*" en los meta.description de navigation.config/index.ts
 */

const fs = require('fs');
const path = require('path');

// Ruta al archivo de configuración de navegación
const navConfigPath = path.join(__dirname, '../src/configs/navigation.config/index.ts');

// Función principal
function main() {
  console.log('Actualizando referencias a claves de descripción en navigation.config/index.ts...');
  
  try {
    // Leer el archivo
    let content = fs.readFileSync(navConfigPath, 'utf8');
    
    // Contador de cambios
    let descriptionKeyChanges = 0;
    
    // Reemplazar todas las ocurrencias de "nav.concepts*" con "nav.modules*" en las descripciones meta
    const updatedContent = content.replace(/translateKey: ['"]nav\.concepts([^'"]*)['"](,?\s*label:)/g, (match, p1, p2) => {
      descriptionKeyChanges++;
      return `translateKey: 'nav.modules${p1}'${p2}`;
    });
    
    // Guardar el archivo actualizado
    fs.writeFileSync(navConfigPath, updatedContent);
    
    console.log(`✅ Actualización completada.`);
    console.log(`   - ${descriptionKeyChanges} claves de descripción "nav.concepts*" cambiadas a "nav.modules*"`);
    
  } catch (error) {
    console.error('❌ Error al actualizar el archivo:', error);
  }
}

// Ejecutar el script
main();