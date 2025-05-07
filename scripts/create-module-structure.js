#!/usr/bin/env node

/**
 * Script para crear la estructura básica de un nuevo módulo
 * Uso: node create-module-structure.js module_name [source_concept]
 * Ejemplo: node create-module-structure.js property_listings properties
 */

const fs = require('fs');
const path = require('path');

// Verificar argumentos
if (process.argv.length < 3) {
  console.error('Error: Se requiere al menos el nombre del módulo');
  console.error('Uso: node create-module-structure.js module_name [source_concept]');
  process.exit(1);
}

// Configuración
const MODULE_NAME = process.argv[2];
const SOURCE_CONCEPT = process.argv[3] || null;
const MODULES_DIR = path.resolve(__dirname, '../src/modules');
const CONCEPTS_DIR = path.resolve(__dirname, '../src/app/(protected-pages)/concepts');

// Validar que el nombre del módulo sea válido
if (!/^[a-z_]+$/.test(MODULE_NAME)) {
  console.error('Error: El nombre del módulo debe estar en formato snake_case (solo letras minúsculas y guiones bajos)');
  process.exit(1);
}

// Crear directorio base del módulo
const moduleDir = path.join(MODULES_DIR, MODULE_NAME);
if (fs.existsSync(moduleDir)) {
  console.error(`Error: El módulo '${MODULE_NAME}' ya existe`);
  process.exit(1);
}

// Estructura de directorios para el módulo
const directories = [
  '',
  'components',
  'hooks',
  'services',
  'store',
  'types',
  'utils',
  'views',
  'views/list',
  'views/detail',
  'views/create',
  'views/edit'
];

// Crear estructura de directorios
console.log(`Creando estructura para el módulo '${MODULE_NAME}'...`);
directories.forEach(dir => {
  const fullPath = path.join(moduleDir, dir);
  fs.mkdirSync(fullPath, { recursive: true });
  console.log(`- Creado directorio: ${fullPath.replace(process.cwd(), '')}`);
});

// Crear archivos base

// 1. index.ts
const indexContent = `/**
 * Módulo: ${MODULE_NAME}
 * 
 * Este archivo exporta la API pública del módulo.
 */

// Exportar componentes principales
export * from './components';

// Exportar hooks públicos
export * from './hooks';

// Exportar tipos
export * from './types';

// Exportar vistas
export * from './views/list';
export * from './views/detail';
export * from './views/create';
export * from './views/edit';

// Exportar configuración
export { default as config } from './config';
`;

// 2. config.ts
const configContent = `/**
 * Configuración del módulo ${MODULE_NAME}
 */

const config = {
  // Metadata del módulo
  name: '${MODULE_NAME.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}',
  code: '${MODULE_NAME}',
  description: 'Descripción del módulo',
  
  // Dependencias
  dependencies: [],
  
  // Configuración por defecto
  defaultConfig: {
    // Configuración específica del módulo
  }
};

export default config;
`;

// 3. components/index.ts
const componentsIndexContent = `/**
 * Exporta todos los componentes públicos del módulo
 */

// Ejemplo: export { default as ComponentName } from './ComponentName';
`;

// 4. hooks/index.ts
const hooksIndexContent = `/**
 * Exporta todos los hooks públicos del módulo
 */

// Ejemplo: export { useFeature } from './useFeature';
`;

// 5. types/index.ts
const typesIndexContent = `/**
 * Tipos e interfaces del módulo
 */

export interface ${MODULE_NAME.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Config {
  // Propiedades de configuración
}

// Añadir otros tipos específicos del módulo
`;

// 6. README.md
const readmeContent = `# Módulo: ${MODULE_NAME.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}

## Descripción
Breve descripción de la funcionalidad del módulo.

## Dependencias
Lista de módulos de los que depende este módulo:
- Ejemplo: \`user_management\`

## Componentes Principales
- Componente 1: Descripción
- Componente 2: Descripción

## Vistas
- Lista: \`/views/list\`
- Detalle: \`/views/detail\`
- Creación: \`/views/create\`
- Edición: \`/views/edit\`

## Configuración
Describe las opciones de configuración disponibles para este módulo.

## Integración
Instrucciones sobre cómo integrar este módulo en una aplicación.

## Migración
${SOURCE_CONCEPT ? `Este módulo fue migrado desde el concepto original \`${SOURCE_CONCEPT}\`` : 'N/A'}
`;

// Escribir archivos
fs.writeFileSync(path.join(moduleDir, 'index.ts'), indexContent);
fs.writeFileSync(path.join(moduleDir, 'config.ts'), configContent);
fs.writeFileSync(path.join(moduleDir, 'components', 'index.ts'), componentsIndexContent);
fs.writeFileSync(path.join(moduleDir, 'hooks', 'index.ts'), hooksIndexContent);
fs.writeFileSync(path.join(moduleDir, 'types', 'index.ts'), typesIndexContent);
fs.writeFileSync(path.join(moduleDir, 'README.md'), readmeContent);

console.log('Archivos base creados.');

// Si se especificó un concepto de origen, analizar su estructura
if (SOURCE_CONCEPT) {
  const conceptDir = path.join(CONCEPTS_DIR, SOURCE_CONCEPT);
  
  if (!fs.existsSync(conceptDir)) {
    console.warn(`Advertencia: El concepto de origen '${SOURCE_CONCEPT}' no existe.`);
  } else {
    console.log(`\nAnalizando estructura del concepto '${SOURCE_CONCEPT}'...`);
    
    // Analizar estructura del concepto (solo primer nivel para simplicidad)
    const subfolders = fs.readdirSync(conceptDir, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
    
    console.log(`Subcarpetas detectadas: ${subfolders.join(', ')}`);
    
    // Crear carpetas correspondientes en views/
    subfolders.forEach(subfolder => {
      // Convertir guiones a camelCase para nombres de componentes
      const viewName = subfolder.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
      
      // Mapeo de nombres de carpetas a nombres de vistas
      const folderToViewMapping = {
        'property-list': 'list',
        'property-details': 'detail',
        'property-create': 'create',
        'property-edit': 'edit',
        'customer-list': 'list',
        'customer-details': 'detail',
        'customer-create': 'create',
        'customer-edit': 'edit',
        'leads-list': 'list',
        'leads-details': 'detail',
        'leads-create': 'create',
        'leads-edit': 'edit',
      };
      
      // Obtener el nombre de vista más adecuado o usar el original
      const viewFolder = folderToViewMapping[subfolder] || subfolder.replace(/^.*?-/, '');
      
      // Comprobar si esta carpeta ya tiene una vista correspondiente
      if (!fs.existsSync(path.join(moduleDir, 'views', viewFolder))) {
        // Crear la carpeta si es necesario
        fs.mkdirSync(path.join(moduleDir, 'views', viewFolder), { recursive: true });
        console.log(`- Creada carpeta de vista: views/${viewFolder} (para ${subfolder})`);
      }
      
      // Crear componente principal de la vista
      const componentName = viewName.charAt(0).toUpperCase() + viewName.slice(1) + 'View';
      const viewComponentContent = `/**
 * Vista: ${componentName}
 * Migrado desde: ${SOURCE_CONCEPT}/${subfolder}
 */

import React from 'react';

// TODO: Importar componentes necesarios
// import { ComponentName } from '../../components/ComponentName';

const ${componentName}: React.FC = () => {
  return (
    <div>
      <h1>${componentName}</h1>
      {/* TODO: Implementar contenido migrado desde ${SOURCE_CONCEPT}/${subfolder} */}
    </div>
  );
};

export default ${componentName};
`;
      
      // Crear archivo de índice para la vista
      const viewIndexContent = `/**
 * Exportaciones para vista ${viewFolder}
 */

export { default as ${componentName} } from './${componentName}';
// Exportar otros componentes específicos de esta vista si es necesario
`;
      
      // Escribir archivos de la vista
      fs.writeFileSync(path.join(moduleDir, 'views', viewFolder, `${componentName}.tsx`), viewComponentContent);
      fs.writeFileSync(path.join(moduleDir, 'views', viewFolder, 'index.ts'), viewIndexContent);
      
      // Crear componente proxy para Next.js
      const proxyDir = path.join(CONCEPTS_DIR, SOURCE_CONCEPT, subfolder);
      if (fs.existsSync(proxyDir)) {
        // Crear directorio _proxies en el módulo para guardar ejemplos de proxies
        const proxiesDir = path.join(moduleDir, '_proxies');
        if (!fs.existsSync(proxiesDir)) {
          fs.mkdirSync(proxiesDir);
        }
        
        // Crear ejemplo de archivo proxy
        const proxyContent = `/**
 * ARCHIVO PROXY - Ejemplo para ${SOURCE_CONCEPT}/${subfolder}/page.tsx
 * 
 * Este archivo es un ejemplo de cómo debería verse el archivo page.tsx
 * después de la migración. El archivo real debe permanecer en su ubicación
 * original e importar el componente desde la nueva estructura de módulos.
 */

import { ${componentName} } from '@/modules/${MODULE_NAME}/views/${viewFolder}';

export default function Page() {
  return <${componentName} />;
}
`;
        
        fs.writeFileSync(path.join(proxiesDir, `${subfolder}-page.tsx`), proxyContent);
        console.log(`- Creado ejemplo de proxy para: ${subfolder}/page.tsx`);
      }
    });
    
    // Crear archivo de migración con notas y pasos
    const migrationNotesContent = `# Notas de Migración: ${SOURCE_CONCEPT} → ${MODULE_NAME}

## Estructura Original
${subfolders.map(folder => `- ${folder}/`).join('\n')}

## Plan de Migración
1. [ ] Revisar cada subcarpeta y decidir cómo mapearla a la nueva estructura
2. [ ] Copiar componentes y lógica manteniendo la funcionalidad
3. [ ] Actualizar importaciones para reflejar la nueva ubicación
4. [ ] Implementar archivos proxy en las ubicaciones originales de page.tsx
5. [ ] Probar extensivamente que nada se haya roto

## Mapeo de Carpetas
${subfolders.map(folder => {
  const viewName = folder.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
  const folderToViewMapping = {
    'property-list': 'list',
    'property-details': 'detail',
    'property-create': 'create',
    'property-edit': 'edit',
    'customer-list': 'list',
    'customer-details': 'detail',
    'customer-create': 'create',
    'customer-edit': 'edit',
    'leads-list': 'list',
    'leads-details': 'detail',
    'leads-create': 'create',
    'leads-edit': 'edit',
  };
  const viewFolder = folderToViewMapping[folder] || folder.replace(/^.*?-/, '');
  return `- ${folder}/ → views/${viewFolder}/ (${viewName}View)`;
}).join('\n')}

## Notas sobre Archivos Proxy

Es importante mantener los archivos \`page.tsx\` en sus ubicaciones originales en la estructura de Next.js. 
Estos archivos actuarán como "proxies" que simplemente importan y utilizan los componentes desde la nueva estructura.

Ejemplo:

\`\`\`tsx
// app/(protected-pages)/concepts/${SOURCE_CONCEPT}/${subfolders[0] || 'subfolder'}/page.tsx

import { ${(subfolders[0] || 'Subfolder').replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())}View } from '@/modules/${MODULE_NAME}/views/${subfolders[0]?.replace(/^.*?-/, '') || 'view'}';

export default function Page() {
  return <${(subfolders[0] || 'Subfolder').replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())}View />;
}
\`\`\`

Se han creado ejemplos de estos archivos proxy en la carpeta \`_proxies/\` para referencia.

## Notas Adicionales
- Añadir aquí cualquier consideración importante
- Asegurarse de actualizar las importaciones en todos los archivos
- Mantener consistencia en la convención de nombres

## Estado
- [ ] Migración iniciada
- [ ] Carpetas y archivos básicos migrados
- [ ] Importaciones actualizadas
- [ ] Archivos proxy implementados
- [ ] Pruebas completadas
- [ ] Migración completada
`;
    
    fs.writeFileSync(path.join(moduleDir, 'MIGRATION.md'), migrationNotesContent);
    console.log(`\nSe ha creado el archivo MIGRATION.md con información y pasos para la migración.`);
  }
}

console.log(`\n✅ Módulo '${MODULE_NAME}' creado exitosamente en: ${moduleDir.replace(process.cwd(), '')}`);