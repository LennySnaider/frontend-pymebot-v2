#!/usr/bin/env node

/**
 * Script para corregir el problema de params.id en NextJS 15 de manera más segura
 * 
 * Este script busca todas las ocurrencias de patrones con params.id y Object.entries(params)
 * y los reemplaza con un patrón seguro para NextJS 15.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_DIR = path.join(__dirname, 'src', 'app', 'api');

// Función para encontrar archivos de forma recursiva
async function findFiles(dir, pattern) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  let results = [];

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      results = results.concat(await findFiles(fullPath, pattern));
    } else if (pattern.test(file.name)) {
      results.push(fullPath);
    }
  }

  return results;
}

// Buscar patrones problemáticos
const problemPatterns = [
  /Object\.entries\s*\(\s*params\s*\)/g,
  /Object\.fromEntries\s*\(\s*Object\.entries\s*\(\s*params\s*\)\s*\)/g,
  /const\s+(\w+)\s*=\s*params\.id/g,
  /const\s+(\w+)\s*=\s*params\?\.id/g,
  /const\s+(\w+)\s*=\s*params\["id"\]/g
];

// Función para corregir un archivo
async function fixFile(filePath) {
  try {
    console.log(`\nProcesando archivo: ${filePath}`);
    const content = await fs.readFile(filePath, 'utf8');
    
    let updatedContent = content;
    let fixes = 0;
    
    // Buscar los patrones problemáticos y reemplazarlos
    for (const pattern of problemPatterns) {
      const matches = updatedContent.match(pattern);
      if (matches) {
        fixes += matches.length;
        
        if (pattern.toString().includes('Object.entries')) {
          // Corregir patrones de Object.entries(params)
          updatedContent = updatedContent.replace(pattern, match => {
            console.log(`  - Reemplazando: ${match}`);
            return '/* Evitar acceso directo a params */';
          });
        } else if (pattern.toString().includes('Object.fromEntries')) {
          // Corregir patrones de Object.fromEntries(Object.entries(params))
          updatedContent = updatedContent.replace(pattern, match => {
            console.log(`  - Reemplazando: ${match}`);
            return '/* Evitar acceso directo a params */';
          });
        } else {
          // Corregir patrones de const xxx = params.id
          updatedContent = updatedContent.replace(pattern, (match, variableName) => {
            console.log(`  - Reemplazando: ${match}`);
            return `const ${variableName} = params?.id ? String(params.id) : ''`;
          });
        }
      }
    }
    
    // Buscar la declaración de función API Route y reemplazarla
    const apiRoutePattern = /export\s+async\s+function\s+(GET|PUT|POST|DELETE|PATCH)\s*\(\s*request\s*:\s*NextRequest\s*,\s*{\s*params\s*}.*?\)\s*{/g;
    const apiRouteMatches = updatedContent.match(apiRoutePattern);
    
    if (apiRouteMatches) {
      fixes += apiRouteMatches.length;
      
      for (const match of apiRouteMatches) {
        console.log(`  - Reemplazando API route: ${match.substring(0, 50)}...`);
        
        // Extraer el método HTTP
        const methodMatch = /function\s+(GET|PUT|POST|DELETE|PATCH)/.exec(match);
        if (methodMatch) {
          const method = methodMatch[1];
          
          // Crear un reemplazo seguro para NextJS 15
          const safeReplacement = `export async function ${method}(
  request: NextRequest,
  { params }: { params: { id?: string, [key: string]: string } }
) {`;
          
          updatedContent = updatedContent.replace(match, safeReplacement);
        }
      }
    }
    
    if (fixes > 0) {
      await fs.writeFile(filePath, updatedContent, 'utf8');
      console.log(`✅ Archivo corregido con ${fixes} cambios: ${filePath}`);
      return fixes;
    } else {
      console.log(`ℹ️ No se encontraron problemas en: ${filePath}`);
      return 0;
    }
  } catch (error) {
    console.error(`❌ Error al procesar archivo ${filePath}:`, error);
    return 0;
  }
}

// Función principal
async function main() {
  try {
    console.log('Buscando archivos de rutas API en:', API_DIR);
    
    // Encontrar todos los archivos route.ts/js
    const routeFiles = await findFiles(API_DIR, /route\.(ts|js)$/);
    console.log(`Encontrados ${routeFiles.length} archivos de rutas API`);
    
    let totalFixes = 0;
    
    // Procesar cada archivo
    for (const file of routeFiles) {
      const fixes = await fixFile(file);
      totalFixes += fixes;
    }
    
    console.log(`\n=== Resumen ===`);
    console.log(`Total de archivos procesados: ${routeFiles.length}`);
    console.log(`Total de correcciones: ${totalFixes}`);
    console.log('Proceso completado exitosamente.');
    
  } catch (error) {
    console.error('Error en el proceso principal:', error);
    process.exit(1);
  }
}

main();