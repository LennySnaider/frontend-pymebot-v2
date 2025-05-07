/**
 * Script para migrar claves de traducción de "concepts" a "modules"
 * Actualiza todas las claves en los archivos de mensajes
 */

const fs = require('fs');
const path = require('path');

// Rutas a los archivos de mensajes
const esMessagesPath = path.join(__dirname, '../messages/es/navigation.json');
const enMessagesPath = path.join(__dirname, '../messages/en/navigation.json');

// Función para realizar la migración de claves
function migrateTranslationKeys(filePath, language) {
  console.log(`\nMigrando claves de traducción en ${language}...`);
  
  try {
    // Leer el archivo
    const content = fs.readFileSync(filePath, 'utf8');
    const messages = JSON.parse(content);
    
    // Crear una copia modificada del objeto
    const newMessages = { ...messages };
    
    // Crear la nueva estructura
    if (!newMessages.nav.modules) {
      newMessages.nav.modules = "Módulos";
    }
    
    // Migrar las claves 'conceptsXYZ' a 'modulesXYZ'
    for (const key in messages.nav) {
      if (key.startsWith('concepts') && key !== 'concepts') {
        const newKey = key.replace('concepts', 'modules');
        newMessages.nav[newKey] = { ...messages.nav[key] };
      }
    }
    
    // Escribir el archivo actualizado
    const updatedContent = JSON.stringify(newMessages, null, 4);
    fs.writeFileSync(filePath, updatedContent);
    
    console.log(`✅ Migración completada para ${language}`);
    
    return Object.keys(newMessages.nav).filter(k => k.startsWith('modules')).length;
  } catch (error) {
    console.error(`❌ Error al migrar el archivo ${filePath}:`, error);
    return 0;
  }
}

// Función principal
function main() {
  console.log('Migrando claves de traducción de "concepts" a "modules"...');
  
  // Realizar backup de los archivos originales
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync(esMessagesPath, `${esMessagesPath}.${timestamp}.bak`);
    fs.copyFileSync(enMessagesPath, `${enMessagesPath}.${timestamp}.bak`);
    console.log('✅ Backup creado de los archivos originales');
  } catch (error) {
    console.error('❌ Error al crear backup:', error);
    return;
  }
  
  const esKeysCount = migrateTranslationKeys(esMessagesPath, 'español');
  const enKeysCount = migrateTranslationKeys(enMessagesPath, 'inglés');
  
  console.log('\n=== RESUMEN DE MIGRACIÓN ===');
  console.log(`Claves migradas en español: ${esKeysCount}`);
  console.log(`Claves migradas en inglés: ${enKeysCount}`);
  console.log('\nIMPORTANTE: Las claves originales "concepts*" se han mantenido');
  console.log('junto con las nuevas claves "modules*" para garantizar compatibilidad.');
  console.log('\nPara finalizar la migración, actualiza todas las referencias');
  console.log('a "nav.concepts*" en el código a "nav.modules*" y luego elimina');
  console.log('las claves antiguas "concepts*" de los archivos de traducción.');
}

// Ejecutar el script
main();