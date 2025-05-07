/**
 * Script para eliminar las claves de traducción antiguas (concepts*)
 * después de completar la migración a modules
 * 
 * ADVERTENCIA: Solo ejecutar este script después de verificar que
 * todas las referencias a nav.concepts* ya han sido actualizadas
 * a nav.modules* en el código.
 */

const fs = require('fs');
const path = require('path');

// Rutas a los archivos de mensajes
const esMessagesPath = path.join(__dirname, '../messages/es/navigation.json');
const enMessagesPath = path.join(__dirname, '../messages/en/navigation.json');

// Función para eliminar claves antiguas
function cleanupOldKeys(filePath, language) {
  console.log(`\nLimpiando claves antiguas en ${language}...`);
  
  try {
    // Leer el archivo
    const content = fs.readFileSync(filePath, 'utf8');
    const messages = JSON.parse(content);
    
    // Crear un nuevo objeto sin las claves 'concepts*'
    const newNav = {};
    let removedCount = 0;
    
    for (const key in messages.nav) {
      if (!key.startsWith('concepts')) {
        newNav[key] = messages.nav[key];
      } else {
        removedCount++;
        console.log(`  - Eliminando clave: ${key}`);
      }
    }
    
    // Crear el nuevo objeto completo
    const newMessages = {
      ...messages,
      nav: newNav
    };
    
    // Crear backup del archivo original
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync(filePath, `${filePath}.${timestamp}.bak`);
    
    // Escribir el archivo actualizado
    fs.writeFileSync(filePath, JSON.stringify(newMessages, null, 4));
    
    console.log(`✅ Se eliminaron ${removedCount} claves antiguas.`);
    
    return removedCount;
  } catch (error) {
    console.error(`❌ Error al limpiar el archivo ${filePath}:`, error);
    return 0;
  }
}

// Función principal
function main() {
  console.log('Limpiando claves de traducción antiguas (concepts*)...');
  console.log('\nADVERTENCIA: Este script eliminará todas las claves de traducción');
  console.log('con prefijo "concepts". Asegúrate de que todas las referencias en el');
  console.log('código ya hayan sido actualizadas para usar las claves "modules".');
  
  // Pedir confirmación
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('\n¿Estás seguro de que deseas continuar? (y/N): ', answer => {
    if (answer.toLowerCase() !== 'y') {
      console.log('❌ Operación cancelada.');
      readline.close();
      return;
    }
    
    // Crear backups de los archivos originales
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const esBackupPath = `${esMessagesPath}.${timestamp}.bak`;
    const enBackupPath = `${enMessagesPath}.${timestamp}.bak`;
    
    fs.copyFileSync(esMessagesPath, esBackupPath);
    fs.copyFileSync(enMessagesPath, enBackupPath);
    console.log(`✅ Backups creados en:`);
    console.log(`   - ${esBackupPath}`);
    console.log(`   - ${enBackupPath}`);
    
    const esCount = cleanupOldKeys(esMessagesPath, 'español');
    const enCount = cleanupOldKeys(enMessagesPath, 'inglés');
    
    console.log('\n=== RESUMEN DE LIMPIEZA ===');
    console.log(`Total de claves eliminadas:`);
    console.log(`- Español: ${esCount}`);
    console.log(`- Inglés: ${enCount}`);
    console.log('\nSe recomienda verificar que la aplicación funciona correctamente');
    console.log('después de esta operación. Si encuentras algún problema, puedes');
    console.log('restaurar los archivos de backup creados antes de la limpieza.');
    
    readline.close();
  });
}

// Ejecutar solo si se ejecuta directamente (no importado)
if (require.main === module) {
  main();
}

module.exports = {
  cleanupOldKeys
};