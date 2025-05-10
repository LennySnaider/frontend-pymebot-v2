/**
 * Tipos para los nodos de negocio específicos para el chatbot
 */

/**
 * Datos para el nodo de verificación de disponibilidad
 */
export interface CheckAvailabilityNodeData {
  location_id?: string;
  appointment_type_id?: string;
  agent_id?: string;
  max_days_ahead?: number;
  start_date_message?: string;
  no_availability_message?: string;
  onUpdateNodeData?: (nodeId: string, data: any) => void;
}

/**
 * Datos para el nodo de creación de citas
 */
export interface BookAppointmentNodeData {
  update_lead_on_book?: boolean;
  new_lead_stage?: string;
  send_confirmation?: boolean;
  success_message?: string;
  failure_message?: string;
  onUpdateNodeData?: (nodeId: string, data: any) => void;
}

/**
 * Datos para el nodo de calificación de leads
 */
export interface LeadQualificationNodeData {
  score_threshold?: number;
  high_score_stage?: string;
  low_score_stage?: string;
  notify_agent?: boolean;
  onUpdateNodeData?: (nodeId: string, data: any) => void;
}

/**
 * Datos para el nodo de reprogramación de citas
 */
export interface RescheduleAppointmentNodeData {
  update_lead_on_reschedule?: boolean;
  require_reason?: boolean;
  notify_agent?: boolean;
  send_confirmation?: boolean;
  send_whatsapp?: boolean;
  max_reschedule_attempts?: number;
  success_message?: string;
  failure_message?: string;
  whatsapp_message?: string;
  onUpdateNodeData?: (nodeId: string, data: any) => void;
}

/**
 * Datos para el nodo de verificación de QR de citas
 */
export interface VerifyAppointmentQRNodeData {
  update_appointment_status?: boolean;
  notify_agent?: boolean;
  success_message?: string;
  failure_message?: string;
  invalid_qr_message?: string;
  onUpdateNodeData?: (nodeId: string, data: any) => void;
}