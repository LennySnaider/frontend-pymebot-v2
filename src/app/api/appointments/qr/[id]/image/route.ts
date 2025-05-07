import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { auth } from '@/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: 'ID de cita requerido' },
        { status: 400 }
      );
    }

    // Generar URL de validación
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const validationUrl = `${baseUrl}/appointments/validate/${id}`;

    // Generar QR
    const qrBuffer = await QRCode.toBuffer(validationUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    // Devolver la imagen como respuesta
    return new NextResponse(qrBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error: any) {
    console.error('Error generando QR:', error);
    return NextResponse.json(
      { error: error.message || 'Error generando QR' },
      { status: 500 }
    );
  }
}