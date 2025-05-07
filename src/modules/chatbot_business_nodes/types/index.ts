/**
 * Tipos para los nodos de negocio del chatbot
 */

export interface QualificationQuestion {
  id: string;
  text: string;
  weight: number;
}

export interface CheckAvailabilityNodeData {
  tenant_id: string;
  appointment_type_id?: string;
  location_id?: string;
  agent_id?: string;
  availableMessage?: string;
  unavailableMessage?: string;
}

export interface BookAppointmentNodeData {
  tenant_id: string;
  update_lead_stage?: boolean;
  new_lead_stage?: string;
  send_confirmation?: boolean;
  create_follow_up_task?: boolean;
  successMessage?: string;
  failureMessage?: string;
}

export interface LeadQualificationNodeData {
  tenant_id: string;
  questions: QualificationQuestion[];
  high_score_threshold: number;
  medium_score_threshold: number;
  update_lead_stage: boolean;
  high_score_stage?: string;
  medium_score_stage?: string;
  low_score_stage?: string;
}

export interface RescheduleAppointmentNodeData {
  tenant_id: string;
  update_lead_on_reschedule?: boolean;
  require_reason?: boolean;
  notify_agent?: boolean;
  send_confirmation?: boolean;
  success_message?: string;
  failure_message?: string;
  max_reschedule_attempts?: number;
}

export interface CancelAppointmentNodeData {
  tenant_id: string;
  update_lead_on_cancel?: boolean;
  require_reason?: boolean;
  notify_agent?: boolean;
  blacklist_time_slot?: boolean;
  success_message?: string;
  failure_message?: string;
}

export interface ConversationState {
  conversationId: string;
  startedAt: string;
  currentNodeId: string;
  visitedNodes: string[];
  userInputs: Record<string, any>;
  leadData: any;
  leadId: string | null;
  currentStage: string | null;
}

export interface BusinessNodeResult {
  nextNodeId: string;
  outputs: {
    message: string;
    context: any;
  };
}