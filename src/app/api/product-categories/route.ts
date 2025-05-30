/**
 * frontend/src/app/api/product-categories/route.ts
 * API routes para categorías de productos - proxy al backend
 * @version 1.0.0
 * @created 2025-05-29
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3090';

/**
 * GET /api/product-categories
 * Obtiene todas las categorías del tenant
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/product-categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': session.user.tenantId,
        'x-user-id': session.user.id || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in GET /api/product-categories:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/product-categories
 * Crea una nueva categoría
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/product-categories`, {
      method: 'POST',
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
    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/product-categories:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}