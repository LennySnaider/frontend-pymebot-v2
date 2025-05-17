'use client'

import React, { useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { NodeProps } from '../types';
import { CancelAppointmentNodeData } from '@/modules/chatbot_business_nodes/types';
import Checkbox from '@/components/ui/Checkbox';
import { PiCalendarXBold } from 'react-icons/pi';
import { Tooltip } from '@/components/ui/Tooltip';
import * as appointmentService from '@/services/AppointmentService';
import * as salesFunnelService from '@/services/SalesFunnelService';

/**
 * Nodo para cancelar citas existentes desde el chatbot
 */
const CancelAppointmentNode: React.FC<NodeProps<CancelAppointmentNodeData>> = ({
  id,
  data,
  selected,
  isConnectable,
  onUpdateNodeData
}) => {
  // Desestructurar las propiedades del nodo
  const {
    update_lead_on_cancel = true,
    require_reason = true,
    notify_agent = true,
    blacklist_time_slot = false,
    success_message,
    failure_message
  } = data;

  // Manejadores para actualizar los datos del nodo
  const handleUpdateLeadChange = useCallback((checked: boolean) => {
    onUpdateNodeData?.(id, { ...data, update_lead_on_cancel: checked });
  }, [id, data, onUpdateNodeData]);

  const handleRequireReasonChange = useCallback((checked: boolean) => {
    onUpdateNodeData?.(id, { ...data, require_reason: checked });
  }, [id, data, onUpdateNodeData]);

  const handleNotifyAgentChange = useCallback((checked: boolean) => {
    onUpdateNodeData?.(id, { ...data, notify_agent: checked });
  }, [id, data, onUpdateNodeData]);

  const handleBlacklistTimeSlotChange = useCallback((checked: boolean) => {
    onUpdateNodeData?.(id, { ...data, blacklist_time_slot: checked });
  }, [id, data, onUpdateNodeData]);

  return (
    <div className={`rounded-md border-2 ${selected ? 'border-primary' : 'border-gray-200 dark:border-gray-600'} bg-white dark:bg-gray-800 p-3 shadow-md min-w-[250px] max-w-[320px]`}>
      {/* Título del nodo */}
      <div className="mb-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        <div className="flex items-center">
          <div className="h-6 w-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-2">
            <PiCalendarXBold className="h-4 w-4 text-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Cancelar Cita
            </p>
          </div>
        </div>
      </div>

      {/* Contenido del nodo */}
      <div className="rounded-md bg-gray-50 dark:bg-gray-700 p-2 mb-2">
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <Checkbox
              checked={update_lead_on_cancel}
              onChange={e => handleUpdateLeadChange(e.target.checked)}
            >
              <span className="ml-2 dark:text-gray-300">Actualizar Lead</span>
            </Checkbox>
            <Tooltip content="Actualiza automáticamente la etapa del lead en el funnel de ventas al cancelar una cita" className="ml-1">
              <span className="text-gray-400 dark:text-gray-500 cursor-help">ⓘ</span>
            </Tooltip>
          </div>

          <div className="flex items-center">
            <Checkbox
              checked={require_reason}
              onChange={e => handleRequireReasonChange(e.target.checked)}
            >
              <span className="ml-2 dark:text-gray-300">Requerir motivo</span>
            </Checkbox>
            <Tooltip content="Pide al usuario que proporcione un motivo para la cancelación" className="ml-1">
              <span className="text-gray-400 dark:text-gray-500 cursor-help">ⓘ</span>
            </Tooltip>
          </div>

          <div className="flex items-center">
            <Checkbox
              checked={notify_agent}
              onChange={e => handleNotifyAgentChange(e.target.checked)}
            >
              <span className="ml-2 dark:text-gray-300">Notificar agente</span>
            </Checkbox>
            <Tooltip content="Envía una notificación al agente asignado sobre la cancelación" className="ml-1">
              <span className="text-gray-400 dark:text-gray-500 cursor-help">ⓘ</span>
            </Tooltip>
          </div>

          <div className="flex items-center">
            <Checkbox
              checked={blacklist_time_slot}
              onChange={e => handleBlacklistTimeSlotChange(e.target.checked)}
            >
              <span className="ml-2 dark:text-gray-300">Bloquear horario</span>
            </Checkbox>
            <Tooltip content="Bloquea este horario para futuras citas" className="ml-1">
              <span className="text-gray-400 dark:text-gray-500 cursor-help">ⓘ</span>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Handles para conexiones */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-white dark:border-gray-800"
        isConnectable={isConnectable}
      />

      {/* Handles de salida */}
      <Handle
        type="source"
        position={Position.Right}
        id="success"
        className="w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800"
        style={{ top: '40%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="failure"
        className="w-3 h-3 bg-red-500 border-2 border-white dark:border-gray-800"
        style={{ top: '60%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="needReason"
        className="w-3 h-3 bg-yellow-500 border-2 border-white dark:border-gray-800"
        style={{ top: '80%' }}
        isConnectable={isConnectable}
      />
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