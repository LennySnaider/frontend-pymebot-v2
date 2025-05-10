import React, { useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { NodeProps } from '../types';
import { RescheduleAppointmentNodeData } from '@/modules/chatbot_business_nodes/types';
import { Card } from '@/components/ui/Card';
import { CardContent } from '@/components/ui/cards';
import Checkbox from '@/components/ui/Checkbox';
import { PiArrowsCounterClockwiseBold } from 'react-icons/pi';
import { FaWhatsapp } from 'react-icons/fa';
import { Tooltip } from '@/components/ui/Tooltip';
import Input from '@/components/ui/Input';
import * as appointmentService from '@/services/AppointmentService';
import * as salesFunnelService from '@/services/SalesFunnelService';
import * as qrCodeService from '@/services/QRCodeService';

/**
 * Nodo para reprogramar citas existentes desde el chatbot
 */
const RescheduleAppointmentNode: React.FC<NodeProps<RescheduleAppointmentNodeData>> = ({
  id,
  data,
  selected,
  isConnectable
}) => {
  const {
    update_lead_on_reschedule = true,
    require_reason = true,
    notify_agent = true,
    send_confirmation = true,
    send_whatsapp = false,
    max_reschedule_attempts = 3,
    success_message,
    failure_message,
    whatsapp_message,
    onUpdateNodeData
  } = data;

  // Manejadores para actualizar los datos del nodo
  const handleUpdateLeadChange = useCallback((checked: boolean) => {
    onUpdateNodeData?.(id, { ...data, update_lead_on_reschedule: checked });
  }, [id, data, onUpdateNodeData]);

  const handleRequireReasonChange = useCallback((checked: boolean) => {
    onUpdateNodeData?.(id, { ...data, require_reason: checked });
  }, [id, data, onUpdateNodeData]);

  const handleNotifyAgentChange = useCallback((checked: boolean) => {
    onUpdateNodeData?.(id, { ...data, notify_agent: checked });
  }, [id, data, onUpdateNodeData]);

  const handleSendConfirmationChange = useCallback((checked: boolean) => {
    onUpdateNodeData?.(id, { ...data, send_confirmation: checked });
  }, [id, data, onUpdateNodeData]);

  const handleSendWhatsAppChange = useCallback((checked: boolean) => {
    onUpdateNodeData?.(id, { ...data, send_whatsapp: checked });
  }, [id, data, onUpdateNodeData]);

  const handleMaxAttemptsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      onUpdateNodeData?.(id, { ...data, max_reschedule_attempts: value });
    }
  }, [id, data, onUpdateNodeData]);

  const handleSuccessMessageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateNodeData?.(id, { ...data, success_message: e.target.value });
  }, [id, data, onUpdateNodeData]);

  const handleFailureMessageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateNodeData?.(id, { ...data, failure_message: e.target.value });
  }, [id, data, onUpdateNodeData]);

  const handleWhatsAppMessageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateNodeData?.(id, { ...data, whatsapp_message: e.target.value });
  }, [id, data, onUpdateNodeData]);

  return (
    <div className={`rounded-md border-2 ${selected ? 'border-primary' : 'border-gray-200 dark:border-gray-600'} bg-white dark:bg-gray-800 p-3 shadow-md min-w-[260px] max-w-[360px]`}>
      {/* Título del nodo */}
      <div className="mb-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        <div className="flex items-center">
          <div className="h-6 w-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mr-2">
            <PiArrowsCounterClockwiseBold className="h-4 w-4 text-orange-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Reprogramar Cita
            </p>
          </div>
        </div>
      </div>

      {/* Contenido del nodo */}
      <div className="rounded-md bg-gray-50 dark:bg-gray-700 p-2 mb-2">
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <Checkbox 
              checked={update_lead_on_reschedule} 
              onChange={e => handleUpdateLeadChange(e.target.checked)}
            >
              <span className="ml-2 dark:text-gray-300">Actualizar etapa del lead</span>
            </Checkbox>
            <Tooltip content="Actualiza automáticamente la etapa del lead en el funnel de ventas al reprogramar una cita" className="ml-1">
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
            <Tooltip content="Pide al usuario que proporcione un motivo para la reprogramación" className="ml-1">
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
            <Tooltip content="Envía una notificación al agente asignado sobre la reprogramación" className="ml-1">
              <span className="text-gray-400 dark:text-gray-500 cursor-help">ⓘ</span>
            </Tooltip>
          </div>

          <div className="flex items-center">
            <Checkbox
              checked={send_confirmation}
              onChange={e => handleSendConfirmationChange(e.target.checked)}
            >
              <span className="ml-2 dark:text-gray-300">Enviar confirmación</span>
            </Checkbox>
            <Tooltip content="Envía un email de confirmación con los nuevos detalles de la cita" className="ml-1">
              <span className="text-gray-400 dark:text-gray-500 cursor-help">ⓘ</span>
            </Tooltip>
          </div>

          <div className="flex items-center">
            <Checkbox
              checked={send_whatsapp}
              onChange={e => handleSendWhatsAppChange(e.target.checked)}
            >
              <div className="ml-2 flex items-center">
                <FaWhatsapp className="text-green-500 mr-1" />
                <span className="dark:text-gray-300">Enviar por WhatsApp</span>
              </div>
            </Checkbox>
            <Tooltip content="Envía el código QR y detalles de la cita por WhatsApp" className="ml-1">
              <span className="text-gray-400 dark:text-gray-500 cursor-help">ⓘ</span>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm dark:text-gray-300">Intentos máximos:</label>
            <Input
              type="number"
              value={max_reschedule_attempts}
              onChange={handleMaxAttemptsChange}
              min={1}
              max={10}
              className="w-20 h-8 text-sm"
            />
            <Tooltip content="Número máximo de veces que un usuario puede reprogramar la misma cita" className="ml-1">
              <span className="text-gray-400 dark:text-gray-500 cursor-help">ⓘ</span>
            </Tooltip>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Mensaje de éxito:</label>
          <Input
            value={success_message || ''}
            onChange={handleSuccessMessageChange}
            placeholder="Tu cita ha sido reprogramada correctamente..."
            className="h-8 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Mensaje de error:</label>
          <Input
            value={failure_message || ''}
            onChange={handleFailureMessageChange}
            placeholder="Lo siento, no pudimos reprogramar tu cita..."
            className="h-8 text-sm"
          />
        </div>

        {send_whatsapp && (
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block flex items-center">
              <FaWhatsapp className="text-green-500 mr-1" />
              Mensaje de WhatsApp:
            </label>
            <Input
              value={whatsapp_message || ''}
              onChange={handleWhatsAppMessageChange}
              placeholder="¡Hola! Tu cita ha sido reprogramada. Aquí está tu código QR..."
              className="h-8 text-sm"
            />
          </div>
        )}
      </div>

      {/* Handles para conexiones horizontales */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
        isConnectable={isConnectable}
      />
      
      {/* Handles de salida */}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="success"
        className="w-3 h-3 bg-green-500 border-2 border-white"
        style={{ top: '30%' }}
        isConnectable={isConnectable}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="failure" 
        className="w-3 h-3 bg-red-500 border-2 border-white"
        style={{ top: '50%' }}
        isConnectable={isConnectable}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="needReason" 
        className="w-3 h-3 bg-yellow-500 border-2 border-white"
        style={{ top: '70%' }}
        isConnectable={isConnectable}
      />
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
    // Verificar si necesitamos un motivo pero no lo tenemos
    if (nodeData.require_reason && !conversationContext.rescheduleReason) {
      return {
        nextNodeId: 'needReason',
        outputs: {
          message: "¿Podrías indicarnos el motivo por el que deseas reprogramar tu cita? Esto nos ayuda a servirte mejor.",
          context: conversationContext
        }
      };
    }
    
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
    
    // Verificar límite de reprogramaciones
    if (nodeData.max_reschedule_attempts) {
      const rescheduleCount = conversationContext.rescheduleCount || 0;
      if (rescheduleCount >= nodeData.max_reschedule_attempts) {
        return {
          nextNodeId: 'failure',
          outputs: {
            message: `Has alcanzado el límite máximo de ${nodeData.max_reschedule_attempts} reprogramaciones permitidas. Por favor, contacta con nuestro equipo directamente para asistencia.`,
            context: conversationContext
          }
        };
      }
    }
    
    // Obtener detalles de la cita actual para preservar información relevante
    const currentAppointment = await appointmentService.getAppointment(
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
    
    // Preparar datos para la actualización
    const appointmentData = {
      date: conversationContext.selectedDate,
      start_time: conversationContext.selectedTimeSlot.start_time,
      end_time: conversationContext.selectedTimeSlot.end_time,
      appointment_type_id: conversationContext.appointmentTypeId || currentAppointment.appointment_type_id,
      location_id: conversationContext.locationId || currentAppointment.location_id,
      agent_id: conversationContext.agentId || currentAppointment.agent_id,
    };
    
    // Verificar si hay citas conflictivas en el nuevo horario
    // Esta función tendría que ser implementada en el servicio o el back-end
    const conflicts = []; // Placeholder - implementar la lógica real
    
    if (conflicts && conflicts.length > 0) {
      return {
        nextNodeId: 'failure',
        outputs: {
          message: nodeData.failure_message || "El horario seleccionado ya no está disponible. Por favor, selecciona otro horario.",
          context: conversationContext
        }
      };
    }
    
    // Actualizar la cita con los nuevos horarios
    const updateResult = await appointmentService.updateAppointment(
      conversationContext.appointmentId,
      {
        date: appointmentData.date,
        start_time: appointmentData.start_time,
        end_time: appointmentData.end_time,
        reason_for_change: conversationContext.rescheduleReason || "Reprogramado vía chatbot",
        status: 'confirmed'
      }
    );
    
    // Suponemos una respuesta exitosa para este ejemplo
    const success = true;
    
    if (!success) {
      return {
        nextNodeId: 'failure',
        outputs: {
          message: nodeData.failure_message || `No pudimos reprogramar tu cita.`,
          context: conversationContext
        }
      };
    }
    
    // Actualizar el lead si está habilitado y tenemos el salesFunnelService configurado
    if (nodeData.update_lead_on_reschedule && conversationContext.leadId && salesFunnelService.updateLeadStage) {
      await salesFunnelService.updateLeadStage(
        tenantId,
        conversationContext.leadId,
        'confirmed', // O podría ser otro estado, dependiendo de la lógica de negocio
        currentAppointment.agent_id
      );
    }
    
    // Generar nuevo QR code si corresponde y tenemos el servicio configurado
    let qrCodeUrl = '';
    let qrCodeToken = '';
    let qrSentByEmail = false;
    let qrSentByWhatsApp = false;

    // Si necesitamos enviar confirmación por email o WhatsApp, generamos el QR primero
    if ((nodeData.send_confirmation || nodeData.send_whatsapp) && qrCodeService.generateAppointmentQR) {
      try {
        const qrResult = await qrCodeService.generateAppointmentQR(
          tenantId,
          conversationContext.appointmentId
        );

        if (qrResult.success) {
          qrCodeUrl = qrResult.qrUrl || '';
          qrCodeToken = qrResult.token || '';

          // Preparar datos para enviar por los diferentes canales
          const appointmentData = {
            email: currentAppointment.customer_email,
            phoneNumber: currentAppointment.customer_phone,
            customerName: currentAppointment.customer_name || conversationContext.customerName || ''
          };

          // Opciones para enviar el QR
          const sendOptions = {
            isReschedule: true,
            appointmentDetails: {
              date: appointmentData.date,
              time: appointmentData.start_time,
              type: currentAppointment.appointment_type?.name || 'Cita',
              location: currentAppointment.location?.name || '',
              agent: currentAppointment.agent?.name || ''
            }
          };

          // Si tenemos el servicio de envío múltiple, lo usamos
          if (qrCodeService.sendQRByAllMethods) {
            const sendResults = await qrCodeService.sendQRByAllMethods(
              tenantId,
              conversationContext.appointmentId,
              appointmentData,
              sendOptions
            );

            qrSentByEmail = sendResults.emailSent;
            qrSentByWhatsApp = sendResults.whatsappSent;
          } else {
            // Enviar email de confirmación si tenemos email del cliente y está habilitado
            if (nodeData.send_confirmation && currentAppointment.customer_email && qrCodeService.sendQRByEmail) {
              qrSentByEmail = await qrCodeService.sendQRByEmail(
                tenantId,
                conversationContext.appointmentId,
                currentAppointment.customer_email,
                sendOptions
              );
            }

            // Enviar por WhatsApp si tenemos número de teléfono y está habilitado
            if (nodeData.send_whatsapp && currentAppointment.customer_phone && qrCodeService.sendQRByWhatsApp) {
              qrSentByWhatsApp = await qrCodeService.sendQRByWhatsApp(
                tenantId,
                conversationContext.appointmentId,
                currentAppointment.customer_phone,
                {
                  ...sendOptions,
                  customerName: appointmentData.customerName
                }
              );
            }
          }
        }
      } catch (qrError) {
        console.error('Error al generar/enviar QR para cita reprogramada:', qrError);
        // No interrumpir el flujo por un error en el QR
      }
    }
    
    // Incrementar contador de reprogramaciones
    const rescheduleCount = (conversationContext.rescheduleCount || 0) + 1;
    
    // Actualizar contexto con la información de la cita
    const updatedContext = {
      ...conversationContext,
      appointmentRescheduled: true,
      oldAppointmentDate: currentAppointment.date,
      oldAppointmentTime: currentAppointment.start_time,
      newAppointmentDate: appointmentData.date,
      newAppointmentTime: appointmentData.start_time,
      rescheduleCount,
      qrCodeUrl,
      qrCodeToken,
      qrSentByEmail,
      qrSentByWhatsApp,
      lastRescheduleDate: new Date().toISOString()
    };

    // Construir mensaje de confirmación
    let confirmationMessage = nodeData.success_message || `¡Perfecto! Tu cita ha sido reprogramada para el ${appointmentData.date} a las ${appointmentData.start_time}.`;

    // Añadir información sobre los envíos realizados
    if (qrSentByEmail && currentAppointment.customer_email) {
      confirmationMessage += ` Te hemos enviado los detalles actualizados por correo electrónico a ${currentAppointment.customer_email}.`;
    }

    if (qrSentByWhatsApp && currentAppointment.customer_phone) {
      const whatsappMessage = nodeData.whatsapp_message ||
                              "También te hemos enviado la información y el código QR por WhatsApp.";
      confirmationMessage += ` ${whatsappMessage}`;
    } else if (qrCodeUrl) {
      confirmationMessage += " También te hemos generado un nuevo código QR que puedes presentar al llegar a tu cita.";
    }

    confirmationMessage += " ¿Necesitas algo más?";

    return {
      nextNodeId: 'success',
      outputs: {
        message: confirmationMessage,
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