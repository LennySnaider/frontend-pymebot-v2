/**
 * Script para corregir las referencias restantes a "nav.concepts*" 
 * en el archivo de configuración de navegación
 */

const fs = require('fs');
const path = require('path');

// Ruta al archivo de configuración de navegación
const navConfigPath = path.join(__dirname, '../src/configs/navigation.config/index.ts');

// Función principal
function main() {
  console.log('Corrigiendo referencias restantes a "nav.concepts" en navigation.config/index.ts...');
  
  try {
    // Leer el archivo
    let content = fs.readFileSync(navConfigPath, 'utf8');
    
    // Buscar todas las ocurrencias de 'nav.concepts' en el archivo
    const regex = /'nav\.concepts([^']*)'/g;
    let match;
    const references = [];
    
    while ((match = regex.exec(content)) !== null) {
      references.push({
        full: match[0],
        suffix: match[1]
      });
    }
    
    console.log(`Se encontraron ${references.length} referencias a 'nav.concepts':`);
    references.forEach(ref => console.log(`  - ${ref.full}`));
    
    // Reemplazar todas las referencias
    let updatedContent = content;
    let replacements = 0;
    
    references.forEach(ref => {
      const newRef = `'nav.modules${ref.suffix}'`;
      updatedContent = updatedContent.replace(ref.full, newRef);
      replacements++;
      console.log(`    * Reemplazado ${ref.full} → ${newRef}`);
    });
    
    // Guardar el archivo actualizado
    fs.writeFileSync(navConfigPath, updatedContent);
    
    console.log(`✅ Corrección completada.`);
    console.log(`   - ${replacements} referencias a "nav.concepts*" actualizadas a "nav.modules*"`);
    
  } catch (error) {
    console.error('❌ Error al actualizar el archivo:', error);
  }
}

// Ejecutar el script
main();