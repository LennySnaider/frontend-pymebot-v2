import { NextRequest, NextResponse } from 'next/server';
import { initializeEmailService, AppointmentEmailService } from '@/services/email';
import { auth } from '@/auth';

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

    // Inicializar el servicio de email
    const initialized = initializeEmailService();
    if (!initialized) {
      return NextResponse.json(
        { error: 'La configuración de email no está completa' },
        { status: 500 }
      );
    }

    // Obtener los datos del cuerpo de la solicitud
    const body = await req.json();
    const {
      to,
      recipientName,
      appointmentDate,
      appointmentTime,
      qrCodeUrl,
      appointmentLocation,
      appointmentDetails,
      validationUrl,
      tenantName,
      subject,
      from,
      replyTo,
      cc,
      bcc
    } = body;

    // Validar los datos requeridos
    if (!to || !recipientName || !appointmentDate || !appointmentTime || !qrCodeUrl) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Enviar el email
    const emailService = AppointmentEmailService.getInstance();
    const result = await emailService.sendAppointmentQREmail({
      to,
      recipientName,
      appointmentDate,
      appointmentTime,
      qrCodeUrl,
      appointmentLocation,
      appointmentDetails,
      validationUrl,
      tenantName,
      subject,
      from,
      replyTo,
      cc,
      bcc
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error al enviar email QR:', error);
    return NextResponse.json(
      { error: error.message || 'Error al enviar email' },
      { status: 500 }
    );
  }
}