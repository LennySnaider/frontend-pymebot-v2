/**
 * frontend/src/services/SalesFunnelService.ts
 * Servicio para gestionar el embudo de ventas y progresión de leads
 * 
 * @version 1.0.0
 * @updated 2025-06-11
 */

import { supabase } from '@/services/supabase/SupabaseClient';
import ApiService from './ApiService';

export interface LeadStageChangeResponse {
  success: boolean;
  previousStage?: string;
  newStage?: string;
  error?: string;
}

export interface LeadAssignmentResponse {
  success: boolean;
  error?: string;
}

export interface FollowUpTaskResponse {
  success: boolean;
  task?: any;
  error?: string;
}

export interface AgentNotification {
  type: string;
  title: string;
  lead_id?: string;
  lead_name?: string;
  previous_stage?: string;
  new_stage?: string;
  task_id?: string;
  stage?: string;
  link?: string;
}

class SalesFunnelService {
  /**
   * Actualiza la etapa de un lead en el embudo de ventas
   */
  async updateLeadStage(
    tenantId: string,
    leadId: string,
    newStage: string,
    agentId?: string
  ): Promise<LeadStageChangeResponse> {
    try {
      // Verificar el lead y su etapa actual
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('stage, assigned_agent_id')
        .eq('tenant_id', tenantId)
        .eq('id', leadId)
        .single();
      
      if (leadError) {
        if (leadError.code === 'PGRST116') {
          return { success: false, error: 'Lead no encontrado' };
        }
        throw leadError;
      }
      
      if (!lead) return { success: false, error: 'Lead no encontrado' };
      
      const previousStage = lead.stage;
      
      // Si la etapa es la misma, no hacer nada
      if (previousStage === newStage) {
        return { success: true, previousStage, newStage };
      }
      
      // Usar el endpoint de actualización de etapa para garantizar consistencia
      try {
        // Primero intentar con el endpoint optimizado
        const response = await fetch('/api/leads/update-stage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            leadId,
            newStage,
            agentId: agentId || lead.assigned_agent_id,
          }),
        });
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Error al actualizar etapa del lead');
        }
        
        // Notificar a los agentes sobre el cambio de etapa
        await this.notifyAgentsOfStageChange(
          tenantId, 
          leadId, 
          previousStage, 
          newStage, 
          agentId || lead.assigned_agent_id
        );
        
        return { 
          success: true, 
          previousStage, 
          newStage 
        };
      } catch (apiError) {
        console.error('Error al llamar API update-stage:', apiError);
        
        // Fallback: Actualizar directamente con supabase
        try {
          const { error: updateError } = await supabase
            .from('leads')
            .update({
              stage: newStage,
              updated_at: new Date().toISOString(),
              last_stage_change: new Date().toISOString()
            })
            .eq('id', leadId)
            .eq('tenant_id', tenantId);
          
          if (updateError) throw updateError;
          
          // Registrar el cambio de etapa en el historial
          const { error: historyError } = await supabase
            .from('lead_stage_history')
            .insert({
              tenant_id: tenantId,
              lead_id: leadId,
              previous_stage: previousStage,
              new_stage: newStage,
              changed_by: agentId || lead.assigned_agent_id || 'system',
              created_at: new Date().toISOString()
            });
          
          if (historyError) throw historyError;
          
          // Notificar a los agentes sobre el cambio de etapa
          await this.notifyAgentsOfStageChange(
            tenantId, 
            leadId, 
            previousStage, 
            newStage, 
            agentId || lead.assigned_agent_id
          );
          
          return { 
            success: true, 
            previousStage, 
            newStage 
          };
        } catch (dbError) {
          console.error('Error en actualización directa:', dbError);
          return { 
            success: false, 
            error: 'Error al actualizar etapa del lead' 
          };
        }
      }
    } catch (error) {
      console.error('Error al actualizar etapa del lead:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }
  
  /**
   * Asigna un lead a un agente específico
   */
  async assignLeadToAgent(
    tenantId: string,
    leadId: string,
    agentId: string
  ): Promise<LeadAssignmentResponse> {
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          assigned_agent_id: agentId,
          assignment_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      
      // Notificar al agente sobre la asignación
      await this.notifyAgentOfAssignment(tenantId, leadId, agentId);
      
      return { success: true };
    } catch (error) {
      console.error('Error al asignar lead a agente:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al asignar lead' 
      };
    }
  }
  
  /**
   * Envía notificaciones a los agentes sobre cambios importantes en leads
   */
  async notifyAgentsOfStageChange(
    tenantId: string,
    leadId: string,
    previousStage: string,
    newStage: string,
    agentId?: string
  ): Promise<boolean> {
    try {
      // Obtener detalles del lead
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('id, full_name, email, phone, assigned_agent_id')
        .eq('id', leadId)
        .eq('tenant_id', tenantId)
        .single();

      if (leadError || !lead) {
        console.error('Error al obtener detalles del lead:', leadError);
        return false;
      }

      // Determinar a qué agentes notificar
      const targetAgentId = agentId || lead.assigned_agent_id;

      // Si hay un agente específico, notificar solo a ese
      if (targetAgentId) {
        await this.sendNotificationToAgent(tenantId, targetAgentId, {
          type: 'lead_stage_change',
          title: `Lead ${lead.full_name} cambió a etapa ${this.translateStage(newStage)}`,
          lead_id: leadId,
          lead_name: lead.full_name,
          previous_stage: previousStage,
          new_stage: newStage,
          link: `/leads/${leadId}`
        });
      } else {
        // Si es un cambio importante (a oportunidad o confirmado), notificar a todos los agentes
        if (newStage === 'opportunity' || newStage === 'confirmed') {
          const { data: agents, error: agentsError } = await supabase
            .from('agents')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('is_active', true);

          if (agentsError) {
            console.error('Error al obtener agentes:', agentsError);
            return false;
          }

          if (agents && agents.length > 0) {
            // Enviar notificación a cada agente
            for (const agent of agents) {
              await this.sendNotificationToAgent(tenantId, agent.id, {
                type: 'new_opportunity',
                title: `¡Nuevo lead en etapa ${this.translateStage(newStage)}!`,
                lead_id: leadId,
                lead_name: lead.full_name,
                stage: newStage,
                link: `/leads/${leadId}`
              });
            }
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error notificando a agentes:', error);
      return false;
    }
  }
  
  /**
   * Notifica a un agente sobre una nueva asignación de lead
   */
  async notifyAgentOfAssignment(
    tenantId: string,
    leadId: string,
    agentId: string
  ): Promise<boolean> {
    try {
      // Obtener detalles del lead
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('id, full_name, email, phone, stage')
        .eq('id', leadId)
        .eq('tenant_id', tenantId)
        .single();
      
      if (leadError || !lead) {
        console.error('Error al obtener detalles del lead:', leadError);
        return false;
      }
      
      // Enviar notificación
      await this.sendNotificationToAgent(tenantId, agentId, {
        type: 'lead_assignment',
        title: `Lead ${lead.full_name} asignado a ti`,
        lead_id: leadId,
        lead_name: lead.full_name,
        stage: lead.stage,
        link: `/leads/${leadId}`
      });
      
      return true;
    } catch (error) {
      console.error('Error notificando asignación:', error);
      return false;
    }
  }
  
  /**
   * Envía una notificación a un agente específico
   */
  async sendNotificationToAgent(
    tenantId: string, 
    agentId: string, 
    notification: AgentNotification
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('agent_notifications')
        .insert({
          tenant_id: tenantId,
          agent_id: agentId,
          title: notification.title,
          content: JSON.stringify(notification),
          is_read: false,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error enviando notificación:', error);
      return false;
    }
  }
  
  /**
   * Crea una tarea de seguimiento para un lead
   */
  async createFollowUpTask(
    tenantId: string,
    leadId: string,
    agentId: string,
    dueDate: Date,
    taskDescription: string
  ): Promise<FollowUpTaskResponse> {
    try {
      const { data, error } = await supabase
        .from('agent_tasks')
        .insert({
          tenant_id: tenantId,
          agent_id: agentId,
          lead_id: leadId,
          description: taskDescription,
          due_date: dueDate.toISOString(),
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (error) throw error;
      
      // Notificar al agente sobre la nueva tarea
      await this.sendNotificationToAgent(tenantId, agentId, {
        type: 'new_task',
        title: `Nueva tarea para lead`,
        task_id: data[0].id,
        lead_id: leadId,
        description: taskDescription,
        link: `/tasks/${data[0].id}`
      });
      
      return { success: true, task: data[0] };
    } catch (error) {
      console.error('Error al crear tarea de seguimiento:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al crear tarea' 
      };
    }
  }
  
  /**
   * Traduce el código de etapa a un nombre amigable en español
   */
  translateStage(stageCode: string): string {
    const stageNames: Record<string, string> = {
      'new': 'Nuevo',
      'prospecting': 'Prospectando',
      'qualification': 'Calificación',
      'opportunity': 'Oportunidad',
      'confirmed': 'Confirmado',
      'closed_won': 'Ganado',
      'closed_lost': 'Perdido'
    };

    return stageNames[stageCode] || stageCode;
  }
}

export default new SalesFunnelService();