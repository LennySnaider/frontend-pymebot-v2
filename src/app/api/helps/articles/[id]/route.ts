import { NextRequest, NextResponse } from 'next/server';
import { mockArticleData } from '@/mock/data/helpCenterData';
import { auth } from '@/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return new NextResponse(
        JSON.stringify({
          message: 'No estás autorizado para acceder a este recurso'
        }),
        { status: 401 }
      );
    }

    const id = params.id;
    const article = mockArticleData.find((item) => item.id === id);

    if (!article) {
      return new NextResponse(
        JSON.stringify({
          message: 'Artículo no encontrado'
        }),
        { status: 404 }
      );
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error('Error al obtener artículo:', error);
    return new NextResponse(
      JSON.stringify({
        message: 'Error al procesar la solicitud'
      }),
      { status: 500 }
    );
  }
}

// API para marcar un artículo como favorito
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return new NextResponse(
        JSON.stringify({
          message: 'No estás autorizado para acceder a este recurso'
        }),
        { status: 401 }
      );
    }

    const id = params.id;
    const body = await req.json();
    
    // En un entorno real, aquí actualizaríamos la base de datos
    // Por ahora, solo simulamos una respuesta exitosa
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar artículo:', error);
    return new NextResponse(
      JSON.stringify({
        message: 'Error al procesar la solicitud'
      }),
      { status: 500 }
    );
  }
}