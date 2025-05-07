/**
 * frontend/src/components/ui/CheckboxFallback.tsx
 * Archivo de fallback para resolver problemas de importación de Checkbox
 * Actúa como un puente para garantizar que las referencias a Checkbox sean válidas
 * @version 1.0.0
 * @updated 2025-04-30
 */

import React from 'react';
import Checkbox from './Checkbox/index';

// Importamos directamente desde la carpeta para evitar referencias circulares

// Este componente no hace nada más que re-exportar el componente Checkbox original
// para resolver problemas de importación o referencia
export default Checkbox;
