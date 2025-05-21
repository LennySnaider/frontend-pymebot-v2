#!/usr/bin/env node

/**
 * Script para corregir el problema de params.id en NextJS 15
 * 
 * Este script busca todas las ocurrencias de "params.id" en rutas API de NextJS
 * y las reemplaza con "String(params?.id || '')" para evitar errores.
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

// Función para corregir un archivo
async function fixFile(filePath) {
  try {
    console.log(`\nProcesando archivo: ${filePath}`);
    const content = await fs.readFile(filePath, 'utf8');
    
    // Patrones problemáticos a buscar
    const problemPatterns = [
      // Patrón 1: Asignación directa de params.id
      {
        regex: /const\s+(\w+)\s+=\s+params\.id/g,
        replace: (match, varName) => `const ${varName} = params?.id ? String(params.id) : ''`
      },
      // Patrón 2: Sintaxis incorrecta con Object.fromEntries
      {
        regex: /const\s+\w+\s+=\s+(?:params\s+\?\s+)?Object\.fromEntries\s*\(\s*const\s+\d+\s+=.+\)\s*:/g,
        replace: () => `// Corregido: Sintaxis incorrecta
    const leadId = params?.id ? String(params.id) : ''`
      },
      // Patrón 3: Acceso directo a params.id sin validación
      {
        regex: /(?<![.?]\s*|['"])params\.id(?!\?|['"])/g,
        replace: () => `params?.id ? String(params.id) : ''`
      },
      // Patrón 4: Destructuring incorrecto
      {
        regex: /\{\s*params\s*\}:\s*\{\s*params:\s*\{\s*id:\s*string\s*\}\s*\}/g,
        replace: () => `{ params }: { params: { id?: string, [key: string]: string | string[] } }`
      }
    ];
    
    let fixes = 0;
    let updatedContent = content;
    
    // Aplicar todos los patrones de corrección
    for (const pattern of problemPatterns) {
      let match;
      const { regex, replace } = pattern;
      
      // Usar una copia para preservar lastIndex durante las iteraciones
      const regexCopy = new RegExp(regex);
      
      while ((match = regexCopy.exec(content)) !== null) {
        const fullMatch = match[0];
        let replacement;
        
        if (typeof replace === 'function') {
          // Extraer grupos capturados
          const groups = match.slice(1);
          replacement = replace(fullMatch, ...groups);
        } else {
          replacement = replace;
        }
        
        // Aplicar el reemplazo solo si hay cambio
        if (fullMatch !== replacement) {
          updatedContent = updatedContent.replace(fullMatch, replacement);
          fixes++;
          
          console.log(`  - Reemplazado: ${fullMatch}`);
          console.log(`  - Por: ${replacement}`);
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