import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase } from '@/services/supabase/SupabaseClient';

/**
 * Endpoint para enviar el código QR de cita por WhatsApp
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener los datos del cuerpo de la solicitud
    const body = await req.json();
    const {
      phone_number,
      customer_name,
      tenant_id,
      qr_code_url,
      is_reschedule = false,
      appointment_details = {}
    } = body;

    // Validar los datos requeridos
    if (!phone_number || !qr_code_url || !tenant_id) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Obtener la configuración de WhatsApp del tenant
    const { data: tenantConfig, error: configError } = await supabase
      .from('tenant_whatsapp_config')
      .select('*')
      .eq('tenant_id', tenant_id)
      .single();

    if (configError || !tenantConfig) {
      return NextResponse.json(
        { error: 'No se encontró configuración de WhatsApp para este tenant' },
        { status: 404 }
      );
    }

    if (!tenantConfig.is_active) {
      return NextResponse.json(
        { error: 'El servicio de WhatsApp no está activo para este tenant' },
        { status: 403 }
      );
    }

    // Formatear el número de teléfono si es necesario (eliminar espacios, asegurar formato internacional)
    const formattedPhone = formatPhoneNumber(phone_number);

    // Construir el mensaje con la información de la cita
    const message = buildWhatsAppMessage(
      customer_name,
      qr_code_url,
      is_reschedule,
      appointment_details
    );

    // Enviar el mensaje a través del servicio de WhatsApp configurado
    let result;
    
    switch (tenantConfig.provider) {
      case 'twilio':
        result = await sendViaTwilio(
          formattedPhone,
          message,
          qr_code_url,
          tenantConfig
        );
        break;
      
      case 'messagebird':
        result = await sendViaMessageBird(
          formattedPhone,
          message,
          qr_code_url,
          tenantConfig
        );
        break;
      
      case 'business_cloud_api':
        result = await sendViaBusinessCloudAPI(
          formattedPhone,
          message,
          qr_code_url,
          tenantConfig
        );
        break;
      
      default:
        return NextResponse.json(
          { error: 'Proveedor de WhatsApp no soportado' },
          { status: 400 }
        );
    }

    // Registrar el envío en la base de datos
    await supabase.from('tenant_message_logs').insert({
      tenant_id,
      message_type: 'appointment_qr',
      channel: 'whatsapp',
      recipient: formattedPhone,
      status: result.success ? 'sent' : 'failed',
      error: result.success ? null : result.error,
      meta: {
        is_reschedule,
        appointment_details
      },
      created_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Mensaje enviado correctamente' : 'Error al enviar mensaje',
      error: result.error
    });
  } catch (error: any) {
    console.error('Error al enviar QR por WhatsApp:', error);
    return NextResponse.json(
      { error: error.message || 'Error al enviar mensaje de WhatsApp' },
      { status: 500 }
    );
  }
}

/**
 * Formatea el número de teléfono para asegurar formato internacional
 */
function formatPhoneNumber(phoneNumber: string): string {
  // Eliminar espacios, guiones y paréntesis
  let formatted = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // Asegurar que tenga el prefijo internacional
  if (!formatted.startsWith('+')) {
    // Si no tiene prefijo internacional, asumimos que es de México (+52)
    // Esto debería adaptarse según la configuración del tenant
    if (formatted.length === 10) {
      formatted = '+52' + formatted;
    } else if (formatted.startsWith('52')) {
      formatted = '+' + formatted;
    } else {
      formatted = '+' + formatted;
    }
  }
  
  return formatted;
}

/**
 * Construye el mensaje de WhatsApp con la información de la cita
 */
function buildWhatsAppMessage(
  customerName: string,
  qrCodeUrl: string,
  isReschedule: boolean,
  appointmentDetails: any
): string {
  const greeting = customerName ? `Hola ${customerName}` : 'Hola';
  
  let message = '';
  
  if (isReschedule) {
    message = `${greeting}, tu cita ha sido reprogramada exitosamente.`;
  } else {
    message = `${greeting}, confirmamos tu cita.`;
  }
  
  // Añadir detalles de la cita si están disponibles
  if (appointmentDetails) {
    if (appointmentDetails.date) {
      message += `\n\nFecha: ${appointmentDetails.date}`;
    }
    
    if (appointmentDetails.time) {
      message += `\nHora: ${appointmentDetails.time}`;
    }
    
    if (appointmentDetails.type) {
      message += `\nTipo: ${appointmentDetails.type}`;
    }
    
    if (appointmentDetails.location) {
      message += `\nLugar: ${appointmentDetails.location}`;
    }
    
    if (appointmentDetails.agent) {
      message += `\nCon: ${appointmentDetails.agent}`;
    }
  }
  
  message += '\n\nA continuación te enviamos un código QR que deberás presentar al llegar a tu cita.';
  
  return message;
}

/**
 * Envía el mensaje a través de Twilio
 */
async function sendViaTwilio(
  phoneNumber: string,
  textMessage: string,
  mediaUrl: string,
  config: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // Aquí se implementaría la integración con Twilio
    // Este es un ejemplo de implementación
    const accountSid = config.account_sid;
    const authToken = config.auth_token;
    const from = config.from_number;
    
    // Simular el envío para este ejemplo
    console.log(`[TWILIO] Enviando mensaje a ${phoneNumber} desde ${from}`);
    console.log(`[TWILIO] Mensaje: ${textMessage}`);
    console.log(`[TWILIO] Media URL: ${mediaUrl}`);
    
    // En una implementación real, se usaría la API de Twilio
    // const client = require('twilio')(accountSid, authToken);
    // const message = await client.messages.create({
    //   body: textMessage,
    //   from: `whatsapp:${from}`,
    //   to: `whatsapp:${phoneNumber}`,
    //   mediaUrl: [mediaUrl]
    // });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error en Twilio:', error);
    return { 
      success: false, 
      error: error.message || 'Error al enviar mensaje por Twilio' 
    };
  }
}

/**
 * Envía el mensaje a través de MessageBird
 */
async function sendViaMessageBird(
  phoneNumber: string,
  textMessage: string,
  mediaUrl: string,
  config: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // Aquí se implementaría la integración con MessageBird
    const apiKey = config.api_key;
    const channelId = config.channel_id;
    
    // Simular el envío para este ejemplo
    console.log(`[MESSAGEBIRD] Enviando mensaje a ${phoneNumber} desde canal ${channelId}`);
    console.log(`[MESSAGEBIRD] Mensaje: ${textMessage}`);
    console.log(`[MESSAGEBIRD] Media URL: ${mediaUrl}`);
    
    // En una implementación real, se usaría la API de MessageBird
    // const messagebird = require('messagebird')(apiKey);
    // const message = await messagebird.conversations.send({
    //   to: phoneNumber,
    //   channelId: channelId,
    //   type: 'image',
    //   content: {
    //     text: textMessage,
    //     mediaUrl: mediaUrl
    //   }
    // });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error en MessageBird:', error);
    return { 
      success: false, 
      error: error.message || 'Error al enviar mensaje por MessageBird' 
    };
  }
}

/**
 * Envía el mensaje a través de WhatsApp Business Cloud API
 */
async function sendViaBusinessCloudAPI(
  phoneNumber: string,
  textMessage: string,
  mediaUrl: string,
  config: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // Aquí se implementaría la integración con WhatsApp Business Cloud API
    const accessToken = config.access_token;
    const phoneNumberId = config.phone_number_id;
    
    // Simular el envío para este ejemplo
    console.log(`[BUSINESS_CLOUD_API] Enviando mensaje a ${phoneNumber} desde ${phoneNumberId}`);
    console.log(`[BUSINESS_CLOUD_API] Mensaje: ${textMessage}`);
    console.log(`[BUSINESS_CLOUD_API] Media URL: ${mediaUrl}`);
    
    // En una implementación real, se usaría la API de WhatsApp Business Cloud
    // const response = await fetch(
    //   `https://graph.facebook.com/v15.0/${phoneNumberId}/messages`,
    //   {
    //     method: 'POST',
    //     headers: {
    //       'Authorization': `Bearer ${accessToken}`,
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       messaging_product: 'whatsapp',
    //       recipient_type: 'individual',
    //       to: phoneNumber,
    //       type: 'template',
    //       template: {
    //         name: 'appointment_confirmation',
    //         language: { code: 'es' },
    //         components: [
    //           {
    //             type: 'body',
    //             parameters: [
    //               { type: 'text', text: textMessage }
    //             ]
    //           },
    //           {
    //             type: 'header',
    //             parameters: [
    //               { type: 'image', image: { link: mediaUrl } }
    //             ]
    //           }
    //         ]
    //       }
    //     }),
    //   }
    // );
    
    // const result = await response.json();
    
    return { success: true };
  } catch (error: any) {
    console.error('Error en WhatsApp Business Cloud API:', error);
    return { 
      success: false, 
      error: error.message || 'Error al enviar mensaje por WhatsApp Business Cloud API' 
    };
  }
}