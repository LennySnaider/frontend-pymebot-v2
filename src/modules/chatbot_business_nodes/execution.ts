/**
 * Exportación de funciones de ejecución para los nodos de negocio
 * @version 1.2.0
 * @updated 2025-07-05
 */

// Importar las funciones de ejecución
import { executeRescheduleAppointment } from '@/components/view/ChatbotBuilder/nodes/RescheduleAppointmentNode';
import { executeCheckAvailability } from '@/components/view/ChatbotBuilder/nodes/CheckAvailabilityNode';
import { executeServicesNode } from '@/components/view/ChatbotBuilder/nodes/ServicesNode';
import { executeProductNode } from '@/components/view/ChatbotBuilder/nodes/ProductNode';

// Exportar las funciones
export {
  executeRescheduleAppointment,
  executeCheckAvailability,
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