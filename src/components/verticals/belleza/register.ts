/**
 * frontend/src/components/verticals/belleza/register.ts
 * Archivo para registrar la vertical de Belleza en el sistema.
 * Permite que el core cargue dinámicamente los componentes de esta vertical.
 * @version 1.0.0
 * @updated 2025-04-29
 */

import useVerticalRegistry from '@/lib/core/verticalRegistry';
import { bellezaVerticalInfo } from './index';
import Dashboard from './dashboard/Dashboard';

/**
 * Registra la vertical de Belleza con todos sus componentes
 */
export function registerBellezaVertical() {
  useVerticalRegistry.getState().register({
    ...bellezaVerticalInfo,
    components: {
      Dashboard,
      // Cuando se implementen los otros componentes, se agregarán aquí:
      // AppointmentCard,
      // Calendar,
      // ServicesList,
    }
  });
  
  console.log(`Vertical ${bellezaVerticalInfo.name} registrada correctamente`);
}

// Exportar información por defecto
export default bellezaVerticalInfo;