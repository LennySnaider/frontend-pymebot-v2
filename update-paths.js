/**
 * Script para actualizar rutas en archivos
 * Mueve referencias de "/concepts/superadmin/" a "/superadmin/"
 */

const fs = require('fs');
const path = require('path');

// Directorios a copiar de (protected-pages)/concepts/superadmin/ a (protected-pages)/superadmin/
const directoriesToCopy = [
  'chatbot-builder',
  'ia-config',
  'notification-builder',
  'variable-builder'
];

// Ruta base
const basePath = '/Users/masi/Documents/chatbot-builderbot-supabase/v2-frontend-pymebot/src/app/(protected-pages)';
const sourceBasePath = path.join(basePath, 'concepts/superadmin');
const destBasePath = path.join(basePath, 'superadmin');

// Función para crear directorios de forma recursiva
function createDirRecursive(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Directorio creado: ${dirPath}`);
  }
}

// Función para copiar un archivo actualizando las rutas
function copyFileWithPathUpdate(sourcePath, destPath) {
  try {
    // Leer el contenido original
    const content = fs.readFileSync(sourcePath, 'utf8');
    
    // Actualizar todas las referencias a rutas
    const updatedContent = content.replace(
      /\/concepts\/superadmin\//g, 
      '/superadmin/'
    );
    
    // Actualizar rutas en frontmatter y comentarios
    const updatedFrontmatter = updatedContent.replace(
      /frontend\/src\/app\/\(protected-pages\)\/concepts\/superadmin\//g, 
      'frontend/src/app/(protected-pages)/superadmin/'
    );
    
    // Crear directorio destino si no existe
    const destDir = path.dirname(destPath);
    createDirRecursive(destDir);
    
    // Escribir el archivo actualizado
    fs.writeFileSync(destPath, updatedFrontmatter);
    console.log(`Archivo copiado y actualizado: ${destPath}`);
  } catch (error) {
    console.error(`Error al copiar/actualizar el archivo ${sourcePath}:`, error);
  }
}

// Función para copiar un directorio de forma recursiva
function copyDirRecursive(source, destination) {
  // Crear el directorio destino
  createDirRecursive(destination);
  
  // Obtener todos los archivos/directorios en el directorio actual
  const items = fs.readdirSync(source);
  
  // Procesar cada archivo/directorio
  items.forEach(item => {
    const sourcePath = path.join(source, item);
    const destPath = path.join(destination, item);
    
    // Verificar si es un directorio o archivo
    const stats = fs.statSync(sourcePath);
    
    if (stats.isDirectory()) {
      // Si es un directorio, copiar recursivamente
      copyDirRecursive(sourcePath, destPath);
    } else {
      // Si es un archivo, copiar con actualización de rutas
      copyFileWithPathUpdate(sourcePath, destPath);
    }
  });
}

// Función principal
function main() {
  // Copiar cada directorio
  directoriesToCopy.forEach(dir => {
    const sourceDir = path.join(sourceBasePath, dir);
    const destDir = path.join(destBasePath, dir);
    
    console.log(`Copiando directorio ${dir} a la nueva ubicación...`);
    copyDirRecursive(sourceDir, destDir);
  });
  
  console.log("Proceso completado.");
}

// Ejecutar la función principal
main();
