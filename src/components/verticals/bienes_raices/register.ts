/**
 * frontend/src/components/verticals/bienes_raices/register.ts
 * Archivo para registrar la vertical de Bienes Raíces en el sistema.
 * Permite que el core cargue dinámicamente los componentes de esta vertical.
 * @version 1.0.0
 * @updated 2025-04-29
 */

import { registerVertical } from '@/lib/core/verticalRegistry';
import { bienesRaicesVerticalInfo } from './index';
import Dashboard from './dashboard/Dashboard';
import PropertyCard from './features/PropertyCard';
import PropertiesList from './features/PropertiesList';

/**
 * Registra la vertical de Bienes Raíces con todos sus componentes
 */
export function registerBienesRaicesVertical() {
  registerVertical({
    ...bienesRaicesVerticalInfo,
    components: {
      Dashboard,
      PropertyCard,
      PropertiesList,
      // Agregar aquí más componentes a medida que se implementen
    }
  });
  
  console.log(`Vertical ${bienesRaicesVerticalInfo.name} registrada correctamente`);
}

// Exportar información por defecto
export default bienesRaicesVerticalInfo;