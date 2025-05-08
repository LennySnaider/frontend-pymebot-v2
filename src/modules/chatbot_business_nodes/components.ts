/**
 * Exportación de componentes visuales de los nodos de negocio para el chatbot
 * @version 1.2.0
 * @updated 2025-07-05
 */

// Importar los nodos
import RescheduleAppointmentNode, { executeRescheduleAppointment } from '@/components/view/ChatbotBuilder/nodes/RescheduleAppointmentNode';
import CheckAvailabilityNode, { executeCheckAvailability } from '@/components/view/ChatbotBuilder/nodes/CheckAvailabilityNode';
import BookAppointmentNode from '@/components/view/ChatbotBuilder/nodes/BookAppointmentNode';
import LeadQualificationNode from '@/components/view/ChatbotBuilder/nodes/LeadQualificationNode';
import ServicesNode, { executeServicesNode } from '@/components/view/ChatbotBuilder/nodes/ServicesNode';
import ProductNode, { executeProductNode } from '@/components/view/ChatbotBuilder/nodes/ProductNode';

// Exportar los componentes
export {
  RescheduleAppointmentNode,
  executeRescheduleAppointment,
  CheckAvailabilityNode,
  executeCheckAvailability,
  BookAppointmentNode,
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
  'CheckAvailabilityNode': CheckAvailabilityNode,
  'check-availability': CheckAvailabilityNode,
  'check_availability': CheckAvailabilityNode,
  'BookAppointmentNode': BookAppointmentNode,
  'book-appointment': BookAppointmentNode,
  'book_appointment': BookAppointmentNode,
  
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