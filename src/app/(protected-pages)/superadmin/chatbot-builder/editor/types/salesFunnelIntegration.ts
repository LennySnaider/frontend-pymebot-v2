/**
 * Tipos para la integración entre el chatbot builder y el sales funnel
 * @version 1.0.0
 * @created 2025-05-17
 */

import { Node } from 'reactflow';

// Etapas del sales funnel existente
export interface SalesFunnelStage {
  id: string;
  name: string;
  color: string;
  order: number;
}

// Etapas predefinidas del sistema
export const SALES_FUNNEL_STAGES: SalesFunnelStage[] = [
  { id: 'nuevos', name: 'Nuevos', color: '#8B5CF6', order: 1 },
  { id: 'prospectando', name: 'Prospectando', color: '#3B82F6', order: 2 },
  { id: 'calificacion', name: 'Calificación', color: '#F59E0B', order: 3 },
  { id: 'oportunidad', name: 'Oportunidad', color: '#EF4444', order: 4 }
];

// Estados adicionales (también son etapas)
export const SALES_FUNNEL_STATES = {
  confirmado: { name: 'Confirmado', color: '#10B981', icon: 'check' },
  cerrado: { name: 'Cerrado', color: '#DC2626', icon: 'x' }
};

// Etapas completas incluyendo estados adicionales
export const ALL_SALES_FUNNEL_STAGES: SalesFunnelStage[] = [
  ...SALES_FUNNEL_STAGES,
  { id: 'confirmado', name: 'Confirmado', color: '#10B981', order: 5 },
  { id: 'cerrado', name: 'Cerrado', color: '#DC2626', order: 6 }
];

// Extensión de datos del nodo para incluir información del sales funnel
export interface SalesFunnelNodeData {
  salesStageId?: string; // Etapa actual del nodo
  movesToStage?: string; // Etapa a la que mueve el lead
  requiresStage?: string; // Etapa requerida para ejecutar el nodo
}

// Tipo de nodo extendido con datos del sales funnel
export interface SalesFunnelNode extends Node {
  data: Node['data'] & SalesFunnelNodeData;
}

// Mapeo de tipos de nodos a etapas sugeridas
export const nodeStageMapping: Record<string, string> = {
  'startNode': 'nuevos',
  'messageNode': 'nuevos',
  'inputNode': 'prospectando',
  'conditionNode': 'prospectando',
  'leadQualificationNode': 'prospectando',
  'checkAvailabilityNode': 'calificacion',
  'productsNode': 'calificacion',
  'servicesNode': 'calificacion',
  'bookAppointmentNode': 'oportunidad',
  'bookingNode': 'oportunidad',
  'rescheduleAppointmentNode': 'confirmado',
  'cancelAppointmentNode': 'cerrado',
  'endNode': 'cerrado'
};

// Transición de etapa
export interface StageTransition {
  fromStage: string;
  toStage: string;
  nodeId: string;
  timestamp: Date;
  reason?: string;
}

// Progreso del lead en el funnel
export interface LeadProgress {
  leadId: string;
  currentStage: string;
  stageHistory: StageTransition[];
  completedNodes: string[];
  lastActivity: Date;
}

// Configuración de integración
export interface SalesFunnelIntegrationConfig {
  enabled: boolean;
  autoMoveLeads: boolean;
  trackProgress: boolean;
  showStageInChat: boolean;
  requireStageValidation: boolean;
}

// Helpers
export const getStageById = (stageId: string): SalesFunnelStage | undefined => {
  return ALL_SALES_FUNNEL_STAGES.find(stage => stage.id === stageId);
};

export const getStageColor = (stageId: string): string => {
  const stage = getStageById(stageId);
  return stage?.color || '#9CA3AF';
};

export const getNextStage = (currentStageId: string): SalesFunnelStage | undefined => {
  const currentStage = getStageById(currentStageId);
  if (!currentStage) return undefined;
  
  return ALL_SALES_FUNNEL_STAGES.find(stage => stage.order === currentStage.order + 1);
};

export const canMoveToStage = (fromStageId: string, toStageId: string): boolean => {
  const fromStage = getStageById(fromStageId);
  const toStage = getStageById(toStageId);
  
  if (!fromStage || !toStage) return false;
  
  // Solo permitir avanzar (no retroceder)
  return toStage.order > fromStage.order;
};

// Nueva función helper para obtener todas las etapas
export const getAllStages = (): SalesFunnelStage[] => {
  return ALL_SALES_FUNNEL_STAGES;
};