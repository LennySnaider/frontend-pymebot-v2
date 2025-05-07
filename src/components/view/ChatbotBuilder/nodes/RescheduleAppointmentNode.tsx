import React from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { NodeProps } from '../types';
import { RescheduleAppointmentNodeData } from '@/modules/chatbot_business_nodes/types';
import appointmentService from '@/services/AppointmentService';
import salesFunnelService from '@/services/SalesFunnelService';
import qrCodeService from '@/services/QRCodeService';

/**
 * Nodo para reprogramar citas existentes desde el chatbot
 */
const RescheduleAppointmentNode: React.FC<NodeProps<RescheduleAppointmentNodeData>> = ({ data, selected }) => {
  return (
    <div className={`node node-reschedule-appointment ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="node-header">
        <h4>Reprogramar Cita</h4>
      </div>
      <div className="node-content">
        <div className="node-form">
          <div className="form-group">
            <label>Actualizar Lead al Reprogramar:</label>
            <input type="checkbox" checked={data.update_lead_on_reschedule} />
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
            <label>Enviar Confirmación:</label>
            <input type="checkbox" checked={data.send_confirmation} />
          </div>
          <div className="form-group">
            <label>Intentos Máximos:</label>
            <input type="number" value={data.max_reschedule_attempts || 3} />
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
export async function executeRescheduleAppointment(
  tenantId: string,
  conversationContext: any,
  nodeData: RescheduleAppointmentNodeData
): Promise<{ nextNodeId: string; outputs: any; }> {
  try {
    // Verificar que tenemos toda la información necesaria
    if (!conversationContext.appointmentId || 
        !conversationContext.selectedDate || 
        !conversationContext.selectedTimeSlot) {
      return {
        nextNodeId: 'failure',
        outputs: {
          message: nodeData.failure_message || "No tengo toda la información necesaria para reprogramar tu cita. Por favor, selecciona fecha y hora primero.",
          context: conversationContext
        }
      };
    }
    
    // Verificar disponibilidad del nuevo horario
    const appointmentData = {
      date: conversationContext.selectedDate,
      start_time: conversationContext.selectedTimeSlot.start_time,
      end_time: conversationContext.selectedTimeSlot.end_time,
      appointment_type_id: conversationContext.appointmentTypeId,
      location_id: conversationContext.locationId,
      agent_id: conversationContext.agentId,
    };
    
    // Verificar si hay citas conflictivas
    const conflicts = await appointmentService.checkConflictingAppointments(
      tenantId,
      appointmentData.date,
      appointmentData.start_time,
      appointmentData.end_time,
      appointmentData.location_id,
      appointmentData.agent_id
    );
    
    if (conflicts && conflicts.length > 0) {
      return {
        nextNodeId: 'failure',
        outputs: {
          message: nodeData.failure_message || "El horario seleccionado ya no está disponible. Por favor, selecciona otro horario.",
          context: conversationContext
        }
      };
    }
    
    // Obtener detalles de la cita actual para preservar información relevante
    const currentAppointment = await appointmentService.getAppointmentDetails(
      tenantId,
      conversationContext.appointmentId
    );
    
    if (!currentAppointment) {
      return {
        nextNodeId: 'failure',
        outputs: {
          message: nodeData.failure_message || "No pude encontrar tu cita actual. Por favor, contacta directamente con nosotros.",
          context: conversationContext
        }
      };
    }
    
    // Actualizar la cita con los nuevos horarios
    const updateResult = await appointmentService.updateAppointment(
      tenantId,
      conversationContext.appointmentId,
      {
        date: appointmentData.date,
        start_time: appointmentData.start_time,
        end_time: appointmentData.end_time,
        reason_for_change: conversationContext.rescheduleReason,
        status: 'confirmed'
      }
    );
    
    if (!updateResult.success) {
      return {
        nextNodeId: 'failure',
        outputs: {
          message: nodeData.failure_message || `No pudimos reprogramar tu cita: ${updateResult.error}`,
          context: conversationContext
        }
      };
    }
    
    // Actualizar el lead si está habilitado
    if (nodeData.update_lead_on_reschedule && conversationContext.leadId) {
      await salesFunnelService.updateLeadStage(
        tenantId,
        conversationContext.leadId,
        'confirmed'  // O podría ser otro estado, dependiendo de la lógica de negocio
      );
    }
    
    // Generar nuevo QR code si corresponde
    if (nodeData.send_confirmation) {
      const qrResult = await qrCodeService.generateAppointmentQR(
        tenantId,
        conversationContext.appointmentId
      );
      
      // Aquí iría la lógica para enviar la confirmación con el QR
    }
    
    // Notificar al agente si está habilitado
    if (nodeData.notify_agent && currentAppointment.agent_id) {
      await salesFunnelService.notifyAgentOfReschedule(
        tenantId,
        conversationContext.appointmentId,
        currentAppointment.agent_id,
        {
          oldDate: currentAppointment.date,
          oldTime: currentAppointment.start_time,
          newDate: appointmentData.date,
          newTime: appointmentData.start_time,
          reason: conversationContext.rescheduleReason || 'No especificado'
        }
      );
    }
    
    // Actualizar contexto con la información de la cita
    const updatedContext = {
      ...conversationContext,
      appointmentRescheduled: true,
      oldAppointmentDate: currentAppointment.date,
      oldAppointmentTime: currentAppointment.start_time,
      newAppointmentDate: appointmentData.date,
      newAppointmentTime: appointmentData.start_time
    };
    
    return {
      nextNodeId: 'success',
      outputs: {
        message: nodeData.success_message || `¡Perfecto! Tu cita ha sido reprogramada para el ${appointmentData.date} a las ${appointmentData.start_time}. Te hemos enviado los detalles actualizados.`,
        context: updatedContext
      }
    };
  } catch (error) {
    console.error('Error en nodo RescheduleAppointment:', error);
    return {
      nextNodeId: 'failure',
      outputs: {
        message: nodeData.failure_message || "Lo siento, hubo un problema al reprogramar tu cita. Por favor, intenta de nuevo más tarde o contáctanos directamente.",
        context: conversationContext
      }
    };
  }
}

export default RescheduleAppointmentNode;