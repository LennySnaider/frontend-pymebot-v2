/**
 * frontend/src/utils/nodeExecutors/index.ts
 * Exporta todas las funciones de ejecución de nodos
 * @version 1.0.0
 * @migrated 2025-05-22 - Extraídas desde components/view/ChatbotBuilder/nodes/
 */

// Productos y Servicios
export { executeProductNode, type ProductNodeData } from './productNodeExecutor';
export { executeServicesNode, type ServicesNodeData } from './servicesNodeExecutor';

// Citas y Agenda
export { executeCheckAvailability } from './checkAvailabilityExecutor';
export { executeBookAppointment } from './bookAppointmentExecutor';
export { executeRescheduleAppointment } from './rescheduleAppointmentExecutor';
export { executeCancelAppointment } from './cancelAppointmentExecutor';

// Lead Qualification
export { executeLeadQualification } from './leadQualificationExecutor';