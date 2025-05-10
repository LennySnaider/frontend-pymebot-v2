import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { initializeEmailService, AppointmentEmailService } from '@/services/email';
import { supabase } from '@/services/supabase/SupabaseClient';

/**
 * Endpoint para enviar el código QR de cita por múltiples canales (email y WhatsApp)
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
      tenant_id,
      appointment_id,
      email,
      phone_number,
      customer_name,
      appointment_details = {},
      channels = {
        email: true,
        whatsapp: false
      },
      is_reschedule = false
    } = body;

    // Validar datos mínimos requeridos
    if (!tenant_id || !appointment_id) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos (tenant_id, appointment_id)' },
        { status: 400 }
      );
    }

    // Validar que al menos un canal esté habilitado
    if (!channels.email && !channels.whatsapp) {
      return NextResponse.json(
        { error: 'Debe seleccionar al menos un canal de envío' },
        { status: 400 }
      );
    }

    // Verificar que tenemos la información de contacto requerida
    if (channels.email && !email) {
      return NextResponse.json(
        { error: 'Se requiere email para enviar por ese canal' },
        { status: 400 }
      );
    }

    if (channels.whatsapp && !phone_number) {
      return NextResponse.json(
        { error: 'Se requiere número de teléfono para enviar por WhatsApp' },
        { status: 400 }
      );
    }

    // Obtener el código QR para la cita
    const { data: qrCode, error: qrError } = await supabase
      .from('tenant_appointment_qrcodes')
      .select('token, qr_code_url')
      .eq('appointment_id', appointment_id)
      .eq('tenant_id', tenant_id)
      .eq('is_valid', true)
      .maybeSingle();

    if (qrError || !qrCode) {
      // Si no existe el QR, generarlo
      // Aquí debería estar la lógica para generar el QR, pero como
      // es compleja, asumiremos que ya debe existir para este ejemplo
      return NextResponse.json(
        { 
          error: 'No se encontró un código QR válido para esta cita',
          details: qrError?.message || 'QR no encontrado'
        },
        { status: 404 }
      );
    }

    const results = {
      emailSent: false,
      whatsappSent: false,
      errors: {}
    };

    // Enviar por email si está habilitado
    if (channels.email && email) {
      try {
        // Inicializar servicio de email
        const initialized = initializeEmailService();
        if (!initialized) {
          results.errors = {
            ...results.errors,
            email: 'Configuración de email incompleta'
          };
        } else {
          // Enviar el email
          const emailService = AppointmentEmailService.getInstance();
          const emailResult = await emailService.sendAppointmentQREmail({
            to: email,
            recipientName: customer_name || 'Estimado cliente',
            appointmentDate: appointment_details.date || '',
            appointmentTime: appointment_details.time || '',
            qrCodeUrl: qrCode.qr_code_url,
            appointmentLocation: appointment_details.location || '',
            appointmentDetails: {
              type: appointment_details.type || 'Cita',
              agent: appointment_details.agent || '',
              ...appointment_details
            },
            validationUrl: '',
            tenantName: appointment_details.tenant_name || '',
            subject: is_reschedule 
              ? '¡Tu cita ha sido reprogramada! Aquí está tu nuevo código QR'
              : '¡Tu cita ha sido confirmada! Aquí está tu código QR'
          });

          results.emailSent = emailResult.success;
          if (!emailResult.success) {
            results.errors = {
              ...results.errors,
              email: emailResult.error || 'Error al enviar email'
            };
          }
        }
      } catch (emailError: any) {
        console.error('Error al enviar email:', emailError);
        results.errors = {
          ...results.errors,
          email: emailError.message || 'Error al enviar email'
        };
      }
    }

    // Enviar por WhatsApp si está habilitado
    if (channels.whatsapp && phone_number) {
      try {
        // Obtener la configuración de WhatsApp
        const { data: whatsappConfig, error: configError } = await supabase
          .from('tenant_whatsapp_config')
          .select('*')
          .eq('tenant_id', tenant_id)
          .eq('is_active', true)
          .single();

        if (configError || !whatsappConfig) {
          results.errors = {
            ...results.errors,
            whatsapp: 'Configuración de WhatsApp no disponible o inactiva'
          };
        } else {
          // Enviar usando el endpoint de WhatsApp
          const whatsappResponse = await fetch(
            '/api/appointments/qr-whatsapp',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                tenant_id,
                phone_number,
                customer_name: customer_name || '',
                qr_code_url: qrCode.qr_code_url,
                is_reschedule,
                appointment_details
              })
            }
          );

          const whatsappResult = await whatsappResponse.json();
          results.whatsappSent = whatsappResult.success;
          if (!whatsappResult.success) {
            results.errors = {
              ...results.errors,
              whatsapp: whatsappResult.error || 'Error al enviar por WhatsApp'
            };
          }
        }
      } catch (whatsappError: any) {
        console.error('Error al enviar WhatsApp:', whatsappError);
        results.errors = {
          ...results.errors,
          whatsapp: whatsappError.message || 'Error al enviar por WhatsApp'
        };
      }
    }

    // Registrar los resultados de envío
    await supabase.from('tenant_message_logs').insert({
      tenant_id,
      appointment_id,
      message_type: 'appointment_qr',
      channel: channels.email && channels.whatsapp ? 'multiple' : (channels.email ? 'email' : 'whatsapp'),
      recipient: channels.email && channels.whatsapp 
        ? `email:${email};whatsapp:${phone_number}`
        : (channels.email ? email : phone_number),
      status: (results.emailSent || results.whatsappSent) ? 'partial_success' : 'failed',
      error: Object.keys(results.errors).length > 0 ? JSON.stringify(results.errors) : null,
      meta: {
        is_reschedule,
        channels_attempted: channels,
        channels_succeeded: {
          email: results.emailSent,
          whatsapp: results.whatsappSent
        },
        appointment_details
      },
      created_at: new Date().toISOString()
    });

    // Determinar el éxito general de la operación
    const anySuccess = results.emailSent || results.whatsappSent;
    const allFailed = (!results.emailSent && channels.email) && (!results.whatsappSent && channels.whatsapp);
    
    return NextResponse.json({
      success: anySuccess,
      status: allFailed ? 'failed' : (anySuccess ? 'success' : 'partial_success'),
      emailSent: results.emailSent,
      whatsappSent: results.whatsappSent,
      errors: Object.keys(results.errors).length > 0 ? results.errors : undefined
    });
  } catch (error: any) {
    console.error('Error al enviar notificaciones de cita:', error);
    return NextResponse.json(
      { error: error.message || 'Error al enviar notificaciones de cita' },
      { status: 500 }
    );
  }
}