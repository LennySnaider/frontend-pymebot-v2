/**
 * Exportación de componentes visuales de los nodos de negocio para el chatbot
 * @version 1.3.0
 * @updated 2025-09-05
 */

// Importar directamente desde el archivo de componentes
import RescheduleAppointmentNode from '@/components/view/ChatbotBuilder/nodes/RescheduleAppointmentNode';
import { executeRescheduleAppointment } from '@/utils/nodeExecutors/rescheduleAppointmentExecutor';

import CheckAvailabilityNodeDark from '@/components/view/ChatbotBuilder/nodes/CheckAvailabilityNodeDark';
import { executeCheckAvailability } from '@/utils/nodeExecutors/checkAvailabilityExecutor';

import BookAppointmentNode from '@/components/view/ChatbotBuilder/nodes/BookAppointmentNode';
import LeadQualificationNode from '@/components/view/ChatbotBuilder/nodes/LeadQualificationNode';

import CancelAppointmentNode from '@/components/view/ChatbotBuilder/nodes/CancelAppointmentNode';
import { executeCancelAppointment } from '@/utils/nodeExecutors/cancelAppointmentExecutor';

import ServicesNode from '@/components/view/ChatbotBuilder/nodes/ServicesNode';
import { executeServicesNode } from '@/utils/nodeExecutors/servicesNodeExecutor';

import ProductNode from '@/components/view/ChatbotBuilder/nodes/ProductNode';
import { executeProductNode } from '@/utils/nodeExecutors/productNodeExecutor';

// Exportar los componentes
export {
  RescheduleAppointmentNode,
  executeRescheduleAppointment,
  CheckAvailabilityNodeDark as CheckAvailabilityNode,
  executeCheckAvailability,
  BookAppointmentNode,
  CancelAppointmentNode,
  executeCancelAppointment,
  LeadQualificationNode,
  ServicesNode,
  executeServicesNode,
  ProductNode,
  executeProductNode
};

// Mapeo de tipos de nodos con sus componentes
export const nodeComponentsMap = {
  // Nodos de citas
  'RescheduleAppointmentNode': RescheduleAppointmentNode,
  'reschedule-appointment': RescheduleAppointmentNode,
  'reschedule_appointment': RescheduleAppointmentNode,
  'CheckAvailabilityNode': CheckAvailabilityNodeDark,
  'check-availability': CheckAvailabilityNodeDark,
  'check_availability': CheckAvailabilityNodeDark,
  'BookAppointmentNode': BookAppointmentNode,
  'book-appointment': BookAppointmentNode,
  'book_appointment': BookAppointmentNode,
  'CancelAppointmentNode': CancelAppointmentNode,
  'cancel-appointment': CancelAppointmentNode,
  'cancel_appointment': CancelAppointmentNode,

  // Nodos de leads
  'LeadQualificationNode': LeadQualificationNode,
  'lead-qualification': LeadQualificationNode,
  'lead_qualification': LeadQualificationNode,

  // Nodos de productos y servicios
  'ServicesNode': ServicesNode,
  'services': ServicesNode,
  'services-list': ServicesNode,
  'services_list': ServicesNode,
  'ProductNode': ProductNode,
  'products': ProductNode,
  'products-list': ProductNode,
  'products_list': ProductNode
};