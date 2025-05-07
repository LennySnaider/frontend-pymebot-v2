import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { cookies } from 'next/headers';

/**
 * Middleware para verificar y obtener el tenant_id de la sesión
 * @param req - NextRequest
 * @returns Object containing tenant_id or error response
 */
export async function getTenantFromRequest(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return {
        error: NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      };
    }

    // Obtener tenant_id desde la sesión del usuario
    const tenant_id = session.user?.app_metadata?.tenant_id;
    
    if (!tenant_id) {
      return {
        error: NextResponse.json({ error: 'Usuario no asociado a un tenant' }, { status: 403 })
      };
    }

    return { tenant_id };
  } catch (error) {
    console.error('Error en middleware de tenant:', error);
    return {
      error: NextResponse.json({ error: 'Error de servidor' }, { status: 500 })
    };
  }
}

/**
 * Verifica si el usuario tiene permisos de administrador o gestor en el tenant
 * @param req - NextRequest
 * @returns Object containing tenant_id, isAdmin or error response
 */
export async function verifyAdminOrManager(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return {
        error: NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      };
    }

    const tenant_id = session.user?.app_metadata?.tenant_id;
    const role = session.user?.app_metadata?.role;
    
    if (!tenant_id) {
      return {
        error: NextResponse.json({ error: 'Usuario no asociado a un tenant' }, { status: 403 })
      };
    }
    
    const isAdmin = role === 'admin' || role === 'manager';
    
    if (!isAdmin) {
      return {
        error: NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
      };
    }

    return { tenant_id, isAdmin };
  } catch (error) {
    console.error('Error verificando permisos de admin:', error);
    return {
      error: NextResponse.json({ error: 'Error de servidor' }, { status: 500 })
    };
  }
}