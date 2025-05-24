/**
 * Exportación de funciones de ejecución para los nodos de negocio
 * @version 1.3.0
 * @updated 2025-09-05
 */

// Importar las funciones de ejecución desde los nuevos ejecutores migrados
import { executeRescheduleAppointment } from '@/utils/nodeExecutors/rescheduleAppointmentExecutor';
import { executeCheckAvailability } from '@/utils/nodeExecutors/checkAvailabilityExecutor';
import { executeCancelAppointment } from '@/utils/nodeExecutors/cancelAppointmentExecutor';
import { executeServicesNode } from '@/utils/nodeExecutors/servicesNodeExecutor';
import { executeProductNode } from '@/utils/nodeExecutors/productNodeExecutor';

// Exportar las funciones
export {
  executeRescheduleAppointment,
  executeCheckAvailability,
  executeCancelAppointment,
  executeServicesNode,
  executeProductNode
};

// Mapeo de tipos de nodos a funciones de ejecución
export const nodeExecutorsMap = {
  // Nodos de citas
  'RescheduleAppointmentNode': executeRescheduleAppointment,
  'reschedule-appointment': executeRescheduleAppointment,
  'reschedule_appointment': executeRescheduleAppointment,
  'CheckAvailabilityNode': executeCheckAvailability,
  'check-availability': executeCheckAvailability,
  'check_availability': executeCheckAvailability,
  'CancelAppointmentNode': executeCancelAppointment,
  'cancel-appointment': executeCancelAppointment,
  'cancel_appointment': executeCancelAppointment,

  // Nodos de productos y servicios
  'ServicesNode': executeServicesNode,
  'services': executeServicesNode,
  'services-list': executeServicesNode,
  'services_list': executeServicesNode,
  'ProductNode': executeProductNode,
  'products': executeProductNode,
  'products-list': executeProductNode,
  'products_list': executeProductNode
};