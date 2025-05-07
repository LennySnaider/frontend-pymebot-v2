const fs = require('fs');
const path = require('path');

// Ruta al archivo de configuración
const filePath = path.join(__dirname, 'src/configs/navigation.config/index.ts');

// Leer el archivo
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error al leer el archivo:', err);
    return;
  }

  // Reemplazar todas las apariciones de key: 'concepts. por key: 'modules.
  // Utiliza una expresión regular con lookbehind para asegurarse de que solo cambia las claves
  const updatedContent = data.replace(/(\bkey\s*:\s*['"])concepts\./g, '$1modules.');

  // También actualizar las rutas que utilizan CONCEPTS_PREFIX_PATH
  const updatedPaths = updatedContent.replace(/(\bpath\s*:\s*`?)\${CONCEPTS_PREFIX_PATH}/g, '$1${MODULES_PREFIX_PATH}');

  // Escribir el archivo actualizado
  fs.writeFile(filePath, updatedPaths, 'utf8', (err) => {
    if (err) {
      console.error('Error al escribir el archivo:', err);
      return;
    }
    console.log('Actualización completada con éxito.');
    
    // Contar cuántas sustituciones se realizaron
    const conceptsCount = (data.match(/(\bkey\s*:\s*['"])concepts\./g) || []).length;
    const pathsCount = (data.match(/(\bpath\s*:\s*`?)\${CONCEPTS_PREFIX_PATH}/g) || []).length;
    
    console.log(`Se actualizaron ${conceptsCount} claves 'concepts.' a 'modules.'`);
    console.log(`Se actualizaron ${pathsCount} rutas que usaban CONCEPTS_PREFIX_PATH a MODULES_PREFIX_PATH`);
  });
});