/**
 * frontend/src/components/view/ChatbotBuilder/nodes/CheckAvailabilityNode.tsx
 * Nodo de chatbot para verificar disponibilidad de citas
 * 
 * @version 1.0.0
 * @updated 2025-06-11
 */

import React, { useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import BusinessHoursService from '@/services/BusinessHoursService';
import Select from '@/components/ui/Select';
import { PiCalendarBold } from 'react-icons/pi';

interface CheckAvailabilityNodeProps {
  id: string;
  data: {
    tenant_id: string;
    appointment_type_id?: string;
    location_id?: string;
    agent_id?: string;
    onUpdateNodeData: (nodeId: string, data: any) => void;
  };
  selected: boolean;
}

/**
 * Componente para el nodo de verificación de disponibilidad
 */
const CheckAvailabilityNode: React.FC<CheckAvailabilityNodeProps> = ({ id, data, selected }) => {
  const { tenant_id, appointment_type_id, location_id, agent_id, onUpdateNodeData } = data;
  
  // Manejadores para actualizar los datos del nodo
  const handleAppointmentTypeChange = useCallback((value: string) => {
    onUpdateNodeData(id, { ...data, appointment_type_id: value });
  }, [id, data, onUpdateNodeData]);
  
  const handleLocationChange = useCallback((value: string) => {
    onUpdateNodeData(id, { ...data, location_id: value });
  }, [id, data, onUpdateNodeData]);
  
  const handleAgentChange = useCallback((value: string) => {
    onUpdateNodeData(id, { ...data, agent_id: value });
  }, [id, data, onUpdateNodeData]);
  
  return (
    <div className={`node-wrapper ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      
      <div className="node-container">
        <div className="node-header bg-blue-500">
          <PiCalendarBold className="node-icon" />
          <div className="node-title">Verificar Disponibilidad</div>
        </div>
        
        <div className="node-content">
          <div className="node-form">
            <div className="form-group">
              <label>Tipo de Cita:</label>
              <Select 
                onChange={handleAppointmentTypeChange}
                value={appointment_type_id || ''}
              >
                <Select.Option value="">Cualquier tipo</Select.Option>
                <Select.Option value="1">Consulta Inicial</Select.Option>
                <Select.Option value="2">Seguimiento</Select.Option>
                <Select.Option value="3">Tratamiento</Select.Option>
              </Select>
            </div>
            
            <div className="form-group">
              <label>Ubicación:</label>
              <Select 
                onChange={handleLocationChange}
                value={location_id || ''}
              >
                <Select.Option value="">Cualquier ubicación</Select.Option>
                <Select.Option value="1">Oficina Central</Select.Option>
                <Select.Option value="2">Sucursal Norte</Select.Option>
                <Select.Option value="3">Sucursal Sur</Select.Option>
              </Select>
            </div>
            
            <div className="form-group">
              <label>Agente:</label>
              <Select 
                onChange={handleAgentChange}
                value={agent_id || ''}
              >
                <Select.Option value="">Cualquier agente</Select.Option>
                <Select.Option value="1">Carlos Rodríguez</Select.Option>
                <Select.Option value="2">Ana Martínez</Select.Option>
                <Select.Option value="3">Miguel Sánchez</Select.Option>
              </Select>
            </div>
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} id="available" />
      <Handle type="source" position={Position.Bottom} id="unavailable" style={{ left: '75%' }} />
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