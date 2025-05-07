/**
 * frontend/src/components/view/ChatbotBuilder/nodes/BookAppointmentNode.tsx
 * Nodo de chatbot para reservar citas
 * 
 * @version 1.0.0
 * @updated 2025-06-11
 */

import React, { useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import Checkbox from '@/components/ui/Checkbox';
import Select from '@/components/ui/Select';
import { PiCalendarCheckBold } from 'react-icons/pi';
import QRCodeService from '@/services/QRCodeService';
import SalesFunnelService from '@/services/SalesFunnelService';

interface BookAppointmentNodeProps {
  id: string;
  data: {
    tenant_id: string;
    update_lead_stage?: boolean;
    new_lead_stage?: string;
    send_confirmation?: boolean;
    create_follow_up_task?: boolean;
    onUpdateNodeData: (nodeId: string, data: any) => void;
  };
  selected: boolean;
}

/**
 * Componente para el nodo de reserva de cita
 */
const BookAppointmentNode: React.FC<BookAppointmentNodeProps> = ({ id, data, selected }) => {
  const { 
    update_lead_stage = true, 
    new_lead_stage = 'confirmed', 
    send_confirmation = true, 
    create_follow_up_task = true,
    onUpdateNodeData 
  } = data;
  
  // Manejadores para actualizar los datos del nodo
  const handleUpdateLeadStageChange = useCallback((checked: boolean) => {
    onUpdateNodeData(id, { ...data, update_lead_stage: checked });
  }, [id, data, onUpdateNodeData]);
  
  const handleNewLeadStageChange = useCallback((value: string) => {
    onUpdateNodeData(id, { ...data, new_lead_stage: value });
  }, [id, data, onUpdateNodeData]);
  
  const handleSendConfirmationChange = useCallback((checked: boolean) => {
    onUpdateNodeData(id, { ...data, send_confirmation: checked });
  }, [id, data, onUpdateNodeData]);
  
  const handleCreateFollowUpTaskChange = useCallback((checked: boolean) => {
    onUpdateNodeData(id, { ...data, create_follow_up_task: checked });
  }, [id, data, onUpdateNodeData]);
  
  return (
    <div className={`node-wrapper ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      
      <div className="node-container">
        <div className="node-header bg-green-500">
          <PiCalendarCheckBold className="node-icon" />
          <div className="node-title">Agendar Cita</div>
        </div>
        
        <div className="node-content">
          <div className="node-form">
            <div className="form-group">
              <Checkbox
                checked={update_lead_stage}
                onChange={e => handleUpdateLeadStageChange(e.target.checked)}
              >
                Actualizar Etapa del Lead
              </Checkbox>
            </div>
            
            {update_lead_stage && (
              <div className="form-group ml-6">
                <label>Nueva Etapa:</label>
                <Select
                  value={new_lead_stage}
                  onChange={handleNewLeadStageChange}
                >
                  <Select.Option value="qualification">Calificación</Select.Option>
                  <Select.Option value="opportunity">Oportunidad</Select.Option>
                  <Select.Option value="confirmed">Confirmado</Select.Option>
                </Select>
              </div>
            )}
            
            <div className="form-group">
              <Checkbox
                checked={send_confirmation}
                onChange={e => handleSendConfirmationChange(e.target.checked)}
              >
                Enviar Confirmación
              </Checkbox>
            </div>
            
            <div className="form-group">
              <Checkbox
                checked={create_follow_up_task}
                onChange={e => handleCreateFollowUpTaskChange(e.target.checked)}
              >
                Crear Tarea de Seguimiento
              </Checkbox>
            </div>
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} id="success" />
      <Handle type="source" position={Position.Bottom} id="failure" style={{ left: '75%' }} />
    </div>
  );
};

/**
 * Función para ejecutar el nodo en tiempo de ejecución del chatbot
 */
export async function executeBookAppointment(
  tenantId: string,
  conversationContext: any,
  nodeData: {
    update_lead_stage?: boolean;
    new_lead_stage?: string;
    send_confirmation?: boolean;
    create_follow_up_task?: boolean;
  }
): Promise<{ nextNodeId: string; outputs: any; }> {
  try {
    // Verificar que tenemos toda la información necesaria
    if (!conversationContext.selectedDate || 
        !conversationContext.selectedTimeSlot ||
        !conversationContext.availableSlots) {
      return {
        nextNodeId: 'failure',
        outputs: {
          message: "No tengo toda la información necesaria para agendar tu cita. Por favor, selecciona fecha y hora primero.",
          context: conversationContext
        }
      };
    }
    
    // Encontrar el slot seleccionado en los slots disponibles
    const selectedSlot = conversationContext.availableSlots.find(
      (slot: any) => slot.start_time === conversationContext.selectedTimeSlot
    );
    
    if (!selectedSlot) {
      return {
        nextNodeId: 'failure',
        outputs: {
          message: "El horario seleccionado ya no está disponible. Por favor, elige otro horario.",
          context: conversationContext
        }
      };
    }
    
    // Preparar datos para la cita
    const appointmentData = {
      tenant_id: tenantId,
      customer_name: conversationContext.customerName || conversationContext.userName || 'Cliente chatbot',
      customer_email: conversationContext.customerEmail || conversationContext.userEmail,
      customer_phone: conversationContext.customerPhone || conversationContext.userPhone,
      date: conversationContext.selectedDate,
      start_time: selectedSlot.start_time,
      end_time: selectedSlot.end_time,
      appointment_type_id: conversationContext.appointment_type_id,
      notes: conversationContext.appointmentNotes || 'Cita programada a través del chatbot',
      location_id: conversationContext.location_id,
      agent_id: conversationContext.agent_id,
      lead_id: conversationContext.leadId
    };
    
    // Crear la cita usando API
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });
      
      if (!response.ok) {
        throw new Error(`Error al crear cita: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error al crear cita');
      }
      
      const appointmentId = data.appointment?.id;
      
      // Actualizar el lead si es necesario
      if (nodeData.update_lead_stage && conversationContext.leadId) {
        await SalesFunnelService.updateLeadStage(
          tenantId,
          conversationContext.leadId,
          nodeData.new_lead_stage || 'confirmed',
          conversationContext.agent_id
        );
      }
      
      // Crear tarea de seguimiento si está habilitado
      if (nodeData.create_follow_up_task && conversationContext.leadId && conversationContext.agent_id) {
        const appointmentDate = new Date(conversationContext.selectedDate);
        const followUpDate = new Date(appointmentDate);
        followUpDate.setDate(followUpDate.getDate() + 1); // Día siguiente a la cita
        
        await SalesFunnelService.createFollowUpTask(
          tenantId,
          conversationContext.leadId,
          conversationContext.agent_id,
          followUpDate,
          `Seguimiento después de cita el ${conversationContext.selectedDate}`
        );
      }
      
      // Generar código QR para la cita
      let qrCodeUrl = '';
      let qrCodeToken = '';
      
      try {
        if (appointmentId) {
          const qrResponse = await QRCodeService.generateAppointmentQR(tenantId, appointmentId);
          if (qrResponse.success) {
            qrCodeUrl = qrResponse.qrUrl || '';
            qrCodeToken = qrResponse.token || '';
            
            // Enviar QR por email si se solicitó
            if (nodeData.send_confirmation && appointmentData.customer_email) {
              await QRCodeService.sendQRByEmail(
                tenantId, 
                appointmentId, 
                appointmentData.customer_email
              );
            }
          }
        }
      } catch (qrError) {
        console.error('Error al generar código QR:', qrError);
        // No interrumpir el flujo por un error en el QR
      }
      
      // Actualizar contexto con la información de la cita
      const updatedContext = {
        ...conversationContext,
        appointmentCreated: true,
        appointmentId: appointmentId,
        appointmentDetails: data.appointment,
        qrCodeUrl,
        qrCodeToken
      };
      
      // Construir mensaje de confirmación
      let confirmationMessage = `¡Perfecto! Tu cita ha sido agendada para el ${conversationContext.selectedDate} a las ${selectedSlot.start_time}.`;
      
      if (nodeData.send_confirmation && appointmentData.customer_email) {
        confirmationMessage += ` Te hemos enviado los detalles por correo electrónico a ${appointmentData.customer_email}.`;
      }
      
      if (qrCodeUrl) {
        confirmationMessage += " También te hemos generado un código QR que puedes presentar al llegar a tu cita.";
      }
      
      confirmationMessage += " ¿Necesitas algo más?";
      
      return {
        nextNodeId: 'success',
        outputs: {
          message: confirmationMessage,
          context: updatedContext
        }
      };
    } catch (apiError) {
      console.error('Error al llamar a API para crear cita:', apiError);
      
      // Intentar fallback con supabase directo
      try {
        const { data: appointment, error: insertError } = await supabase
          .from('tenant_appointments')
          .insert({
            tenant_id: tenantId,
            customer_name: appointmentData.customer_name,
            customer_email: appointmentData.customer_email,
            customer_phone: appointmentData.customer_phone,
            date: appointmentData.date,
            start_time: appointmentData.start_time,
            end_time: appointmentData.end_time,
            appointment_type_id: appointmentData.appointment_type_id,
            notes: appointmentData.notes,
            location_id: appointmentData.location_id,
            agent_id: appointmentData.agent_id,
            lead_id: appointmentData.lead_id,
            status: 'confirmed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();
        
        if (insertError) throw insertError;
        
        // Actualizar el lead si es necesario
        if (nodeData.update_lead_stage && conversationContext.leadId) {
          await SalesFunnelService.updateLeadStage(
            tenantId,
            conversationContext.leadId,
            nodeData.new_lead_stage || 'confirmed',
            conversationContext.agent_id
          );
        }
        
        // Actualizar contexto con la información de la cita
        const updatedContext = {
          ...conversationContext,
          appointmentCreated: true,
          appointmentId: appointment[0].id,
          appointmentDetails: appointment[0]
        };
        
        // Mensaje simplificado (sin QR en el fallback)
        return {
          nextNodeId: 'success',
          outputs: {
            message: `¡Perfecto! Tu cita ha sido agendada para el ${conversationContext.selectedDate} a las ${selectedSlot.start_time}. ¿Necesitas algo más?`,
            context: updatedContext
          }
        };
      } catch (fallbackError) {
        console.error('Error en fallback de creación de cita:', fallbackError);
        return {
          nextNodeId: 'failure',
          outputs: {
            message: "Lo siento, hubo un problema al agendar tu cita. Por favor, intenta de nuevo más tarde o contáctanos directamente por teléfono.",
            context: conversationContext
          }
        };
      }
    }
  } catch (error) {
    console.error('Error en nodo BookAppointment:', error);
    return {
      nextNodeId: 'failure',
      outputs: {
        message: "Lo siento, hubo un problema al agendar tu cita. Por favor, intenta de nuevo más tarde o contáctanos directamente por teléfono.",
        context: conversationContext
      }
    };
  }
}

export default BookAppointmentNode;