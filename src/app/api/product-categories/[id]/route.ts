/**
 * frontend/src/app/api/product-categories/[id]/route.ts
 * API routes para categorías específicas - proxy al backend
 * @version 1.0.0
 * @created 2025-05-29
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3090';

/**
 * GET /api/product-categories/[id]
 * Obtiene una categoría específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/product-categories/${params.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': session.user.tenantId,
        'x-user-id': session.user.id || '',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Error en el servidor' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error(`Error in GET /api/product-categories/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/product-categories/[id]
 * Actualiza una categoría específica
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/product-categories/${params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': session.user.tenantId,
        'x-user-id': session.user.id || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Error en el servidor' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error(`Error in PUT /api/product-categories/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/product-categories/[id]
 * Elimina una categoría específica
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/product-categories/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': session.user.tenantId,
        'x-user-id': session.user.id || '',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Error en el servidor' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error(`Error in DELETE /api/product-categories/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}