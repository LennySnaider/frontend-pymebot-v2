import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { cookies } from 'next/headers';

// Logging helper para depuración
const logSession = (session: any, context: string) => {
  console.log(`[${context}] Datos de sesión:`, {
    id: session?.user?.id,
    role: session?.user?.role,
    tenant_id: session?.user?.tenant_id,
    authority: session?.user?.authority,
  });
};

/**
 * Middleware para verificar y obtener el tenant_id de la sesión
 * @param req - NextRequest
 * @returns Object containing tenant_id or error response
 */
export async function getTenantFromRequest(req: NextRequest) {
  try {
    const session = await auth();
    logSession(session, 'getTenantFromRequest');
    
    if (!session) {
      return {
        error: NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      };
    }

    // Obtener tenant_id directamente desde la sesión del usuario
    const tenant_id = session.user?.tenant_id;
    
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
    logSession(session, 'verifyAdminOrManager');
    
    if (!session) {
      return {
        error: NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      };
    }

    // Obtener datos directamente
    const tenant_id = session.user?.tenant_id;
    const role = session.user?.role;
    
    if (!tenant_id) {
      return {
        error: NextResponse.json({ error: 'Usuario no asociado a un tenant' }, { status: 403 })
      };
    }
    
    // Comprobar si tiene rol de administrador (super_admin, tenant_admin o manager)
    const isAdmin = role === 'super_admin' || role === 'tenant_admin' || role === 'admin' || role === 'manager';
    
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