import React from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { NodeProps } from '../types';
import { CancelAppointmentNodeData } from '@/modules/chatbot_business_nodes/types';
import appointmentService from '@/services/AppointmentService';
import salesFunnelService from '@/services/SalesFunnelService';

/**
 * Nodo para cancelar citas existentes desde el chatbot
 */
const CancelAppointmentNode: React.FC<NodeProps<CancelAppointmentNodeData>> = ({ data, selected }) => {
  return (
    <div className={`node node-cancel-appointment ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="node-header">
        <h4>Cancelar Cita</h4>
      </div>
      <div className="node-content">
        <div className="node-form">
          <div className="form-group">
            <label>Actualizar Lead al Cancelar:</label>
            <input type="checkbox" checked={data.update_lead_on_cancel} />
          </div>
          <div className="form-group">
            <label>Requerir Motivo:</label>
            <input type="checkbox" checked={data.require_reason} />
          </div>
          <div className="form-group">
            <label>Notificar Agente:</label>
            <input type="checkbox" checked={data.notify_agent} />
          </div>
          <div className="form-group">
            <label>Bloquear Horario:</label>
            <input type="checkbox" checked={data.blacklist_time_slot} />
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} id="success" />
      <Handle type="source" position={Position.Bottom} id="failure" style={{ left: '75%' }} />
    </div>
  );
};

/**
 * Función de ejecución del nodo durante el flujo del chatbot
 */
export async function executeCancelAppointment(
  tenantId: string,
  conversationContext: any,
  nodeData: CancelAppointmentNodeData
): Promise<{ nextNodeId: string; outputs: any; }> {
  try {
    // Verificar que tenemos toda la información necesaria
    if (!conversationContext.appointmentId) {
      return {
        nextNodeId: 'failure',
        outputs: {
          message: nodeData.failure_message || "No tengo la información de la cita que quieres cancelar. Por favor, proporciona el identificador de la cita.",
          context: conversationContext
        }
      };
    }
    
    // Verificar si necesitamos un motivo pero no lo tenemos
    if (nodeData.require_reason && !conversationContext.cancellationReason) {
      return {
        nextNodeId: 'needReason',
        outputs: {
          message: "¿Podrías indicarnos el motivo por el que deseas cancelar la cita? Esto nos ayudará a mejorar nuestro servicio.",
          context: conversationContext
        }
      };
    }
    
    // Obtener detalles de la cita antes de cancelarla
    const appointment = await appointmentService.getAppointmentDetails(
      tenantId,
      conversationContext.appointmentId
    );
    
    if (!appointment) {
      return {
        nextNodeId: 'failure',
        outputs: {
          message: nodeData.failure_message || "No pude encontrar tu cita. Por favor, contacta directamente con nosotros.",
          context: conversationContext
        }
      };
    }
    
    // Cancelar la cita
    const cancelResult = await appointmentService.cancelAppointment(
      tenantId,
      conversationContext.appointmentId,
      conversationContext.cancellationReason || 'No especificado'
    );
    
    if (!cancelResult.success) {
      return {
        nextNodeId: 'failure',
        outputs: {
          message: nodeData.failure_message || `No pudimos cancelar tu cita: ${cancelResult.error}`,
          context: conversationContext
        }
      };
    }
    
    // Actualizar el lead si está habilitado
    if (nodeData.update_lead_on_cancel && conversationContext.leadId) {
      // Determinar a qué etapa mover el lead después de cancelar
      // Podría ser "lost", "prospecting", etc. dependiendo de la lógica de negocio
      await salesFunnelService.updateLeadStage(
        tenantId,
        conversationContext.leadId,
        'prospecting' // O la etapa que corresponda según el negocio
      );
    }
    
    // Bloquear el horario para futuras citas si está habilitado
    if (nodeData.blacklist_time_slot) {
      await appointmentService.blacklistTimeSlot(
        tenantId,
        appointment.date,
        appointment.start_time,
        appointment.end_time,
        appointment.location_id,
        appointment.agent_id
      );
    }
    
    // Notificar al agente si está habilitado
    if (nodeData.notify_agent && appointment.agent_id) {
      await salesFunnelService.notifyAgentOfCancellation(
        tenantId,
        conversationContext.appointmentId,
        appointment.agent_id,
        {
          date: appointment.date,
          time: appointment.start_time,
          reason: conversationContext.cancellationReason || 'No especificado'
        }
      );
    }
    
    // Actualizar contexto con la información de la cancelación
    const updatedContext = {
      ...conversationContext,
      appointmentCancelled: true,
      cancelledAppointmentDate: appointment.date,
      cancelledAppointmentTime: appointment.start_time,
      cancellationDate: new Date().toISOString()
    };
    
    return {
      nextNodeId: 'success',
      outputs: {
        message: nodeData.success_message || `Tu cita para el ${appointment.date} a las ${appointment.start_time} ha sido cancelada correctamente. ${nodeData.notify_agent ? "Hemos notificado a tu asesor." : ""}`,
        context: updatedContext
      }
    };
  } catch (error) {
    console.error('Error en nodo CancelAppointment:', error);
    return {
      nextNodeId: 'failure',
      outputs: {
        message: nodeData.failure_message || "Lo siento, hubo un problema al cancelar tu cita. Por favor, intenta de nuevo más tarde o contáctanos directamente.",
        context: conversationContext
      }
    };
  }
}

export default CancelAppointmentNode;