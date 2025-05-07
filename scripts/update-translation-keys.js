/**
 * Script para actualizar claves de traducción de "concepts" a "modules"
 * Este script NO actualiza las claves por ahora, pero proporciona un recuento
 * y podría ser modificado en el futuro para realizar la migración
 */

const fs = require('fs');
const path = require('path');

// Rutas a los archivos de mensajes
const esMessagesPath = path.join(__dirname, '../messages/es/navigation.json');
const enMessagesPath = path.join(__dirname, '../messages/en/navigation.json');

// Función para analizar claves de traducción
function analyzeTranslationKeys(filePath, language) {
  console.log(`\nAnalizando claves de traducción en ${language}...`);
  
  try {
    // Leer el archivo
    const content = fs.readFileSync(filePath, 'utf8');
    const messages = JSON.parse(content);
    
    // Contar claves que contienen "concepts"
    let conceptsKeys = [];
    
    // Función recursiva para encontrar claves
    function findConceptsKeys(obj, prefix = '') {
      for (const key in obj) {
        const currentPath = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          findConceptsKeys(obj[key], currentPath);
        } else if (key.includes('concepts') || currentPath.includes('concepts')) {
          conceptsKeys.push(currentPath);
        }
      }
    }
    
    findConceptsKeys(messages);
    
    console.log(`Se encontraron ${conceptsKeys.length} claves relacionadas con "concepts":`);
    conceptsKeys.forEach(key => console.log(`  - ${key}`));
    
    return conceptsKeys;
  } catch (error) {
    console.error(`❌ Error al analizar el archivo ${filePath}:`, error);
    return [];
  }
}

// Función principal
function main() {
  console.log('Analizando claves de traducción para el cambio de "concepts" a "modules"...');
  
  const esKeys = analyzeTranslationKeys(esMessagesPath, 'español');
  const enKeys = analyzeTranslationKeys(enMessagesPath, 'inglés');
  
  console.log('\n=== RESUMEN ===');
  console.log(`Claves a migrar en español: ${esKeys.length}`);
  console.log(`Claves a migrar en inglés: ${enKeys.length}`);
  console.log('\nPara realizar la migración completa en el futuro, actualiza este script');
  console.log('para reemplazar "concepts" por "modules" en estas claves.');
  console.log('\nNOTA: Por ahora no se realizaron cambios para mantener compatibilidad');
  console.log('con el código existente que aún usa las claves de traducción originales.');
}

// Ejecutar el script
main();