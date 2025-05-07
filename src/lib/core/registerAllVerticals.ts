/**
 * frontend/src/lib/core/registerAllVerticals.ts
 * Punto centralizado para registrar todas las verticales disponibles.
 * Este archivo se encarga de cargar las verticales en el sistema core.
 * @version 1.0.0
 * @updated 2025-04-29
 */

import { registerBellezaVertical } from '@/components/verticals/belleza/register';
import { registerBienesRaicesVertical } from '@/components/verticals/bienes_raices/register';
// Importar registros de otras verticales conforme se vayan implementando

/**
 * Registra todas las verticales disponibles en el sistema
 */
export function registerAllVerticals() {
  // Vertical de Belleza
  registerBellezaVertical();
  
  // Vertical de Bienes Raíces
  registerBienesRaicesVertical();
  
  // Agregar registro de otras verticales aquí conforme se vayan implementando
  
  console.log('Todas las verticales han sido registradas correctamente');
}

export default registerAllVerticals;