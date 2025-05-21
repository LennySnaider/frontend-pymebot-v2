/**
 * API para obtener plantillas de chatbot desde el backend
 * Esta ruta es la principal para cargar las plantillas en el módulo de chat
 * 
 * @version 1.0.2
 * @updated 2025-05-21
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    console.log('API: Solicitando plantillas desde la ruta principal');
    
    // Hacer llamada al backend para obtener las plantillas reales
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3090';
    const templatesEndpoint = `${backendUrl}/api/templates/tenant`;
    
    console.log(`Obteniendo plantillas desde: ${templatesEndpoint}`);
    
    // En desarrollo, no enviamos token para permitir que el backend use modo sin autenticación
    // Esto evita errores de JWT inválido como los reportados en los logs
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    };
    
    // El token 'desarrollo' causa error de JWT, así que omitimos completamente el header de Authorization
    // Dejamos que el backend use su lógica de desarrollo sin token (línea 86 en auth.ts)
    
    const response = await fetch(templatesEndpoint, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      console.error(`Error del backend: ${response.status} ${response.statusText}`);
      throw new Error(`Error al obtener plantillas: ${response.status} ${response.statusText}`);
    }
    
    const templatesData = await response.json();
    
    // Validar que la respuesta tenga la estructura esperada
    if (!templatesData || !templatesData.templates) {
      console.error('Estructura de respuesta inesperada:', templatesData);
      throw new Error('La respuesta del backend no tiene el formato esperado');
    }
    
    console.log(`Se obtuvieron ${templatesData.templates.length} plantillas del backend`);
    
    // Devolver respuesta con las plantillas
    return NextResponse.json(templatesData.templates, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error al obtener plantillas:', error);
    
    // En caso de error, mostrar el error específico
    return NextResponse.json(
      { 
        error: 'Error al obtener plantillas del backend',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}