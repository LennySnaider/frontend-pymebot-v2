#!/usr/bin/env node

/**
 * Script para analizar la estructura de módulos actuales y generar un grafo de dependencias
 * Uso: node analyze-modules.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración
const CONCEPTS_DIR = path.resolve(__dirname, '../src/app/(protected-pages)/concepts');
const OUTPUT_DIR = path.resolve(__dirname, '../tmp');
const MODULE_MAPPING = {
  'properties': 'property_listings',
  'customers': 'customer_management',
  'leads': 'lead_management',
  'appointments': 'appointment_scheduler',
  'file-manager': 'file_management',
  'calendar': 'calendar',
  'chatbot': 'chatbot',
  'projects': 'project_management',
  'orders': 'order_management',
  'marketing': 'marketing',
  'ai': 'ai_features'
};

// Asegurar que existe el directorio de salida
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Leer la estructura de directorios
function readDirStructure(dir, prefix = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let result = [];
  
  entries.forEach(entry => {
    const name = entry.name;
    if (name.startsWith('.') || name === 'node_modules') return;
    
    const fullPath = path.join(dir, name);
    
    if (entry.isDirectory()) {
      result.push(`${prefix}${name}/`);
      const subEntries = readDirStructure(fullPath, `${prefix}  `);
      result = result.concat(subEntries);
    } else if (entry.isFile() && (name.endsWith('.tsx') || name.endsWith('.ts'))) {
      result.push(`${prefix}${name}`);
    }
  });
  
  return result;
}

// Analizar dependencias entre módulos
function analyzeModuleDependencies() {
  const modules = fs.readdirSync(CONCEPTS_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
  
  const dependencies = {};
  
  modules.forEach(module => {
    dependencies[module] = [];
    
    // Buscar importaciones en los archivos del módulo
    const moduleDir = path.join(CONCEPTS_DIR, module);
    const files = findTsxFiles(moduleDir);
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Buscar importaciones de otros módulos
      modules.forEach(otherModule => {
        if (module === otherModule) return;
        
        const importPattern = new RegExp(`from\\s+['"](\\.\\.?\\/)+concepts\\/${otherModule}\\/`, 'g');
        if (importPattern.test(content)) {
          if (!dependencies[module].includes(otherModule)) {
            dependencies[module].push(otherModule);
          }
        }
      });
    });
  });
  
  return { modules, dependencies };
}

// Encontrar archivos .tsx y .ts recursivamente
function findTsxFiles(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  entries.forEach(entry => {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      findTsxFiles(fullPath, results);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      results.push(fullPath);
    }
  });
  
  return results;
}

// Generar grafo de dependencias en formato DOT (Graphviz)
function generateDependencyGraph(dependencies) {
  let dot = 'digraph ModuleDependencies {\n';
  dot += '  rankdir=LR;\n';
  dot += '  node [shape=box, style=filled, fillcolor=lightblue, fontname="Arial"];\n';
  
  // Añadir nodos
  Object.keys(dependencies).forEach(module => {
    const mappedName = MODULE_MAPPING[module] || module;
    dot += `  "${module}" [label="${mappedName}"];\n`;
  });
  
  // Añadir aristas
  Object.keys(dependencies).forEach(module => {
    dependencies[module].forEach(dep => {
      dot += `  "${module}" -> "${dep}";\n`;
    });
  });
  
  dot += '}\n';
  
  return dot;
}

// Generar plan de migración basado en dependencias
function generateMigrationPlan(modules, dependencies) {
  // Calcular dependencias inversas (qué módulos dependen de cada uno)
  const inverseDeps = {};
  modules.forEach(module => {
    inverseDeps[module] = [];
  });
  
  Object.keys(dependencies).forEach(module => {
    dependencies[module].forEach(dep => {
      inverseDeps[dep].push(module);
    });
  });
  
  // Ordenar módulos por número de dependencias inversas
  // Primero migraremos los que menos otros módulos dependen de ellos
  const orderedModules = [...modules].sort((a, b) => {
    return inverseDeps[a].length - inverseDeps[b].length;
  });
  
  let plan = '# Plan de Migración por Fases\n\n';
  
  // Fase 1: Módulos independientes (nadie depende de ellos)
  const phase1 = orderedModules.filter(m => inverseDeps[m].length === 0);
  if (phase1.length > 0) {
    plan += '## Fase 1: Módulos Independientes\n\n';
    phase1.forEach(m => {
      plan += `- \`${MODULE_MAPPING[m] || m}\` (antes \`${m}\`)\n`;
    });
    plan += '\n';
  }
  
  // Fase 2: Módulos con pocas dependencias inversas
  const phase2 = orderedModules.filter(m => inverseDeps[m].length > 0 && inverseDeps[m].length <= 2);
  if (phase2.length > 0) {
    plan += '## Fase 2: Módulos con Pocas Dependencias\n\n';
    phase2.forEach(m => {
      plan += `- \`${MODULE_MAPPING[m] || m}\` (antes \`${m}\`)\n`;
      plan += `  - Módulos que dependen de éste: ${inverseDeps[m].map(d => `\`${d}\``).join(', ')}\n`;
    });
    plan += '\n';
  }
  
  // Fase 3: Módulos con muchas dependencias inversas
  const phase3 = orderedModules.filter(m => inverseDeps[m].length > 2);
  if (phase3.length > 0) {
    plan += '## Fase 3: Módulos Centrales\n\n';
    phase3.forEach(m => {
      plan += `- \`${MODULE_MAPPING[m] || m}\` (antes \`${m}\`)\n`;
      plan += `  - Módulos que dependen de éste: ${inverseDeps[m].map(d => `\`${d}\``).join(', ')}\n`;
    });
    plan += '\n';
  }
  
  return plan;
}

// Ejecutar análisis
console.log('Analizando estructura de módulos...');
const structure = readDirStructure(CONCEPTS_DIR);

// Guardar estructura en archivo
fs.writeFileSync(path.join(OUTPUT_DIR, 'module-structure.txt'), structure.join('\n'));
console.log(`Estructura guardada en ${path.join(OUTPUT_DIR, 'module-structure.txt')}`);

// Analizar dependencias
console.log('Analizando dependencias entre módulos...');
const { modules, dependencies } = analyzeModuleDependencies();

// Guardar dependencias en formato JSON
fs.writeFileSync(
  path.join(OUTPUT_DIR, 'module-dependencies.json'), 
  JSON.stringify({ modules, dependencies }, null, 2)
);
console.log(`Dependencias guardadas en ${path.join(OUTPUT_DIR, 'module-dependencies.json')}`);

// Generar grafo de dependencias
const dotGraph = generateDependencyGraph(dependencies);
fs.writeFileSync(path.join(OUTPUT_DIR, 'module-dependencies.dot'), dotGraph);
console.log(`Grafo de dependencias guardado en ${path.join(OUTPUT_DIR, 'module-dependencies.dot')}`);

// Generar plan de migración
const migrationPlan = generateMigrationPlan(modules, dependencies);
fs.writeFileSync(path.join(OUTPUT_DIR, 'migration-phases.md'), migrationPlan);
console.log(`Plan de migración guardado en ${path.join(OUTPUT_DIR, 'migration-phases.md')}`);

// Intentar generar imagen del grafo si graphviz está instalado
try {
  const dotPath = path.join(OUTPUT_DIR, 'module-dependencies.dot');
  const pngPath = path.join(OUTPUT_DIR, 'module-dependencies.png');
  
  console.log('Intentando generar imagen del grafo...');
  execSync(`dot -Tpng ${dotPath} -o ${pngPath}`);
  console.log(`Imagen del grafo generada en ${pngPath}`);
} catch (error) {
  console.warn('No se pudo generar la imagen del grafo. Asegúrate de tener Graphviz instalado.');
  console.warn('Puedes instalar Graphviz con: brew install graphviz (macOS) o apt-get install graphviz (Linux)');
}

console.log('Análisis completado.');