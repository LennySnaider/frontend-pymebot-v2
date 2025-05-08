/**
 * frontend/src/components/view/ChatbotBuilder/nodes/CheckAvailabilityNode.tsx
 * Nodo de chatbot para verificar disponibilidad de citas
 * 
 * @version 1.0.1
 * @updated 2025-07-05
 */

import React, { useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import BusinessHoursService from '@/services/BusinessHoursService';
import Select from '@/components/ui/Select';
import { PiCalendarBold } from 'react-icons/pi';

export interface CheckAvailabilityNodeData {
  tenant_id: string;
  appointment_type_id?: string;
  location_id?: string;
  agent_id?: string;
  label?: string;
  onUpdateNodeData?: (nodeId: string, data: any) => void;
}

/**
 * Componente para el nodo de verificación de disponibilidad
 */
const CheckAvailabilityNode: React.FC<NodeProps<CheckAvailabilityNodeData>> = ({ 
  id, 
  data, 
  selected,
  isConnectable 
}) => {
  const { tenant_id, appointment_type_id, location_id, agent_id, onUpdateNodeData, label } = data;
  
  // Manejadores para actualizar los datos del nodo
  const handleAppointmentTypeChange = useCallback((value: string) => {
    if (onUpdateNodeData) {
      onUpdateNodeData(id, { ...data, appointment_type_id: value });
    }
  }, [id, data, onUpdateNodeData]);
  
  const handleLocationChange = useCallback((value: string) => {
    if (onUpdateNodeData) {
      onUpdateNodeData(id, { ...data, location_id: value });
    }
  }, [id, data, onUpdateNodeData]);
  
  const handleAgentChange = useCallback((value: string) => {
    if (onUpdateNodeData) {
      onUpdateNodeData(id, { ...data, agent_id: value });
    }
  }, [id, data, onUpdateNodeData]);
  
  return (
    <div className={`rounded-md border-2 ${selected ? 'border-primary' : 'border-gray-200'} bg-white p-3 shadow-md min-w-[250px] max-w-[320px]`}>
      {/* Título del nodo */}
      <div className="mb-2 border-b border-gray-200 pb-2">
        <div className="flex items-center">
          <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
            <PiCalendarBold className="h-4 w-4 text-blue-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">
              {label || 'Verificar Disponibilidad'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Contenido del nodo */}
      <div className="bg-gray-50 p-2 rounded-md mb-1">
        <div className="space-y-2">
          <div className="form-group">
            <label className="text-xs text-gray-600 mb-1 block">Tipo de Cita:</label>
            <Select 
              onChange={handleAppointmentTypeChange}
              value={appointment_type_id || ''}
              size="sm"
            >
              <Select.Option value="">Cualquier tipo</Select.Option>
              <Select.Option value="1">Consulta Inicial</Select.Option>
              <Select.Option value="2">Seguimiento</Select.Option>
              <Select.Option value="3">Tratamiento</Select.Option>
            </Select>
          </div>
          
          <div className="form-group">
            <label className="text-xs text-gray-600 mb-1 block">Ubicación:</label>
            <Select 
              onChange={handleLocationChange}
              value={location_id || ''}
              size="sm"
            >
              <Select.Option value="">Cualquier ubicación</Select.Option>
              <Select.Option value="1">Oficina Central</Select.Option>
              <Select.Option value="2">Sucursal Norte</Select.Option>
              <Select.Option value="3">Sucursal Sur</Select.Option>
            </Select>
          </div>
          
          <div className="form-group">
            <label className="text-xs text-gray-600 mb-1 block">Agente:</label>
            <Select 
              onChange={handleAgentChange}
              value={agent_id || ''}
              size="sm"
            >
              <Select.Option value="">Cualquier agente</Select.Option>
              <Select.Option value="1">Carlos Rodríguez</Select.Option>
              <Select.Option value="2">Ana Martínez</Select.Option>
              <Select.Option value="3">Miguel Sánchez</Select.Option>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
          <span>Disponible</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
          <span>No disponible</span>
        </div>
      </div>
      
      {/* Handles para conexiones horizontales */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="available"
        className="w-3 h-3 bg-green-500 border-2 border-white"
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="unavailable"
        className="w-3 h-3 bg-red-500 border-2 border-white"
        style={{ top: '70%' }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

/**
 * Función para ejecutar el nodo en tiempo de ejecución del chatbot
 */
export async function executeCheckAvailability(
  tenantId: string,
  conversationContext: any,
  nodeData: {
    appointment_type_id?: string;
    location_id?: string;
    agent_id?: string;
  }
): Promise<{ nextNodeId: string; outputs: any; }> {
  try {
    // Obtener fecha de la conversación o usar la fecha actual
    const dateToCheck = conversationContext.selectedDate || new Date().toISOString().split('T')[0];
    
    // Consultar disponibilidad
    const availability = await BusinessHoursService.getAvailabilityForDate(
      tenantId,
      dateToCheck,
      nodeData.appointment_type_id || conversationContext.appointment_type_id,
      nodeData.location_id || conversationContext.location_id,
      nodeData.agent_id || conversationContext.agent_id
    );
    
    // Guardar los resultados en el contexto
    const hasAvailability = availability.available_slots.length > 0;
    const updatedContext = {
      ...conversationContext,
      availableSlots: availability.available_slots,
      hasAvailability,
      checkedDate: dateToCheck,
      businessHours: availability.business_hours
    };
    
    if (hasAvailability) {
      // Sugerir los slots disponibles
      const slotsText = availability.available_slots
        .slice(0, 3) // Mostrar solo los primeros 3 slots
        .map(slot => `${slot.start_time}`)
        .join(', ');
      
      const message = `Tenemos disponibilidad para el ${dateToCheck}. Los horarios disponibles son: ${slotsText}${availability.available_slots.length > 3 ? ', entre otros' : ''}. ¿Te gustaría agendar una cita?`;
      
      return {
        nextNodeId: 'available',
        outputs: {
          message,
          context: updatedContext
        }
      };
    } else {
      // Si es un día cerrado, explicar la razón
      if (availability.business_hours.is_closed) {
        let message = `Lo siento, no tenemos disponibilidad para el ${dateToCheck} ya que estamos cerrados ese día.`;
        
        // Obtener el siguiente día disponible
        const tomorrow = new Date(dateToCheck);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        // Sugerir el siguiente día
        message += ` ¿Te gustaría verificar disponibilidad para el ${tomorrowStr}?`;
        
        return {
          nextNodeId: 'unavailable',
          outputs: {
            message,
            context: updatedContext
          }
        };
      }
      
      // Si no hay disponibilidad pero estamos abiertos
      let message = `Lo siento, no tenemos horarios disponibles para el ${dateToCheck}.`;
      
      // Sugerir alternativas
      const nextAvailable = await BusinessHoursService.getNextAvailableTime(
        tenantId,
        new Date(dateToCheck),
        30, // duración por defecto
        nodeData.location_id || conversationContext.location_id,
        nodeData.appointment_type_id || conversationContext.appointment_type_id,
        nodeData.agent_id || conversationContext.agent_id
      );
      
      if (nextAvailable) {
        const nextDate = nextAvailable.toISOString().split('T')[0];
        const nextTime = nextAvailable.toTimeString().substring(0, 5);
        
        message += ` El próximo horario disponible es el ${nextDate} a las ${nextTime}. ¿Te gustaría agendar para esa fecha?`;
      } else {
        message += ` ¿Te gustaría que un agente te contacte para encontrar un horario que funcione para ti?`;
      }
      
      return {
        nextNodeId: 'unavailable',
        outputs: {
          message,
          context: updatedContext
        }
      };
    }
  } catch (error) {
    console.error('Error en nodo CheckAvailability:', error);
    return {
      nextNodeId: 'error',
      outputs: {
        message: "Lo siento, hubo un problema al verificar la disponibilidad. Por favor, intenta de nuevo más tarde.",
        context: conversationContext
      }
    };
  }
}

export default CheckAvailabilityNode;