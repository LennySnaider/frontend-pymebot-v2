import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Resend } from 'resend';

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

    // Verificar rol de administrador
    const userRole = session.user?.role;
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    // Obtener los datos del cuerpo de la solicitud
    const body = await req.json();
    const { apiKey, from, to, subject, text, html } = body;

    // Validar los datos requeridos
    if (!apiKey || !from || !to) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos (apiKey, from, to)' },
        { status: 400 }
      );
    }

    // Inicializar Resend con la API key proporcionada
    const resend = new Resend(apiKey);

    // Enviar el email
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: subject || 'Prueba de configuración de email',
      text: text || 'Este es un email de prueba para verificar la configuración de Resend.',
      html: html || `<div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h1 style="color: #4f46e5;">Prueba de Configuración de Email</h1>
        <p>Este es un email de prueba para verificar que la configuración de Resend funciona correctamente.</p>
        <p>Si estás viendo este email, significa que la configuración es correcta y puedes comenzar a utilizar el servicio de email en tu aplicación.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
          <p>Este es un email automático, por favor no respondas a este mensaje.</p>
        </div>
      </div>`,
    });

    if (error) {
      console.error('Error enviando email de prueba:', error);
      return NextResponse.json(
        { error: error.message || 'Error al enviar email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Email enviado correctamente',
      id: data?.id,
    });
  } catch (error: any) {
    console.error('Error en test-email:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}