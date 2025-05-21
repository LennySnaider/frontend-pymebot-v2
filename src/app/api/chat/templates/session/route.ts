/**
 * API para proporcionar datos de sesión del usuario para depuración
 * Este endpoint es útil para diagnosticar problemas de autenticación
 * 
 * @version 1.0.0
 * @updated 2025-05-21
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Recopilar información de la sesión actual
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    
    // Buscar cookies relacionadas con autenticación (sin exponer valores sensibles)
    const authCookies = allCookies
      .filter(cookie => 
        cookie.name.toLowerCase().includes('auth') ||
        cookie.name.toLowerCase().includes('session') ||
        cookie.name.toLowerCase().includes('token')
      )
      .map(cookie => ({
        name: cookie.name,
        exists: true,
        // No incluimos el valor completo por seguridad
        valuePreview: cookie.value ? `${cookie.value.substring(0, 5)}...` : null,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        path: cookie.path
      }));
    
    // Obtener headers de la solicitud relevantes para diagnóstico
    const relevantHeaders = [
      'authorization',
      'x-tenant-id',
      'x-user-id',
      'x-role',
      'x-auth-token',
      'referer',
      'origin'
    ];
    
    const requestHeaders = {};
    relevantHeaders.forEach(header => {
      const value = request.headers.get(header);
      if (value) {
        requestHeaders[header] = header.includes('token') || header.includes('auth') 
          ? `${value.substring(0, 10)}...` // Truncar valores sensibles
          : value;
      }
    });
    
    // Simular un objeto sesión para fines de desarrollo
    // En producción, esta información vendría de la autenticación real
    const sessionInfo = {
      id: '7849575a-92bf-4856-a735-b3b8ea398910', // UUID de ejemplo
      role: 'super_admin',
      tenant_id: 'afa60b0a-3046-4607-9c48-266af6e1d322', // ID del tenant por defecto
      authority: ['super_admin', 'tenant_admin', 'agent']
    };
    
    console.log('Datos de sesión actualizados:', sessionInfo);
    
    // Devolver información útil para diagnóstico
    return NextResponse.json({
      sessionInfo,
      authCookies,
      requestHeaders,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error al obtener datos de sesión:', error);
    
    return NextResponse.json({
      error: 'Error al obtener datos de sesión',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { 
      status: 500 
    });
  }
}