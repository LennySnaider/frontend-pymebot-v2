'use client'

/**
 * frontend/src/components/view/ChatbotBuilder/nodes/CheckAvailabilityNodeDark.tsx
 * Nodo de chatbot para verificar disponibilidad de citas - Versión optimizada para modo oscuro
 * 
 * @version 1.0.1
 * @updated 2025-09-05
 */

import React, { useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import BusinessHoursService from '@/services/BusinessHoursService';
import { Select, Option } from '@/components/ui/Select';
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
 * Versión optimizada del nodo de verificación de disponibilidad para modo oscuro
 */
const CheckAvailabilityNodeDark: React.FC<NodeProps<CheckAvailabilityNodeData>> = ({ 
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
  
  // Estilos en línea para forzar la apariencia en modo oscuro
  const containerStyles = {
    backgroundColor: '#1a1a1a',
    borderColor: selected ? 'var(--color-primary-500)' : '#333333',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderRadius: '0.375rem',
    padding: '0.75rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    minWidth: '250px',
    maxWidth: '320px',
    color: '#e5e7eb'
  };
  
  const headerStyles = {
    marginBottom: '0.5rem',
    paddingBottom: '0.5rem',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#333333'
  };
  
  const contentStyles = {
    backgroundColor: '#282828',
    padding: '0.5rem',
    borderRadius: '0.375rem',
    marginBottom: '0.25rem'
  };
  
  const formStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem'
  };
  
  const labelStyles = {
    fontSize: '0.75rem',
    color: '#9ca3af',
    marginBottom: '0.25rem',
    display: 'block'
  };
  
  const statusContainerStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '0.5rem',
    fontSize: '0.75rem',
    color: '#9ca3af'
  };
  
  const statusItemStyles = {
    display: 'flex',
    alignItems: 'center'
  };
  
  const statusDotStyles = (color: string) => ({
    width: '0.75rem',
    height: '0.75rem',
    borderRadius: '50%',
    backgroundColor: color,
    marginRight: '0.25rem'
  });

  // Componente optimizado para modo oscuro
  return (
    <div style={containerStyles} data-node-dark="true" data-testid="check-availability-dark">
      {/* Título del nodo */}
      <div style={headerStyles}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            width: '1.5rem', 
            height: '1.5rem', 
            borderRadius: '50%', 
            backgroundColor: 'rgba(59, 130, 246, 0.2)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginRight: '0.5rem' 
          }}>
            <PiCalendarBold style={{ width: '1rem', height: '1rem', color: '#3b82f6' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#e5e7eb' }}>
              {label || 'Verificar Disponibilidad'}
            </p>
          </div>
        </div>
      </div>

      {/* Contenido del nodo */}
      <div style={contentStyles}>
        <div style={formStyles}>
          <div>
            <label style={labelStyles}>Tipo de Cita:</label>
            <Select
              onChange={handleAppointmentTypeChange}
              value={appointment_type_id || ''}
              size="sm"
              className="dark-mode-select"
            >
              <Option value="">Cualquier tipo</Option>
              <Option value="1">Consulta Inicial</Option>
              <Option value="2">Seguimiento</Option>
              <Option value="3">Tratamiento</Option>
            </Select>
          </div>
          
          <div>
            <label style={labelStyles}>Ubicación:</label>
            <Select
              onChange={handleLocationChange}
              value={location_id || ''}
              size="sm"
              className="dark-mode-select"
            >
              <Option value="">Cualquier ubicación</Option>
              <Option value="1">Oficina Central</Option>
              <Option value="2">Sucursal Norte</Option>
              <Option value="3">Sucursal Sur</Option>
            </Select>
          </div>
          
          <div>
            <label style={labelStyles}>Agente:</label>
            <Select
              onChange={handleAgentChange}
              value={agent_id || ''}
              size="sm"
              className="dark-mode-select"
            >
              <Option value="">Cualquier agente</Option>
              <Option value="1">Carlos Rodríguez</Option>
              <Option value="2">Ana Martínez</Option>
              <Option value="3">Miguel Sánchez</Option>
            </Select>
          </div>
        </div>
      </div>
      
      <div style={statusContainerStyles}>
        <div style={statusItemStyles}>
          <div style={statusDotStyles('#10b981')}></div>
          <span>Disponible</span>
        </div>
        <div style={statusItemStyles}>
          <div style={statusDotStyles('#ef4444')}></div>
          <span>No disponible</span>
        </div>
      </div>

      {/* Handles para conexiones horizontales */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ 
          width: '0.75rem', 
          height: '0.75rem', 
          backgroundColor: '#3b82f6', 
          border: '2px solid #1f2937'
        }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="available"
        style={{ 
          width: '0.75rem', 
          height: '0.75rem', 
          backgroundColor: '#10b981', 
          border: '2px solid #1f2937'
        }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="unavailable"
        style={{ 
          width: '0.75rem', 
          height: '0.75rem', 
          backgroundColor: '#ef4444', 
          border: '2px solid #1f2937', 
          top: '70%'
        }}
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

export default CheckAvailabilityNodeDark;