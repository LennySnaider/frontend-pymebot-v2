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
    
    // Filtrar solo plantillas marcadas como eliminadas o sin datos básicos
    const filteredTemplates = templatesData.templates.filter((template: any) => {
      // Validar que la plantilla tenga datos básicos
      if (!template || !template.name || !template.id) {
        console.log('Excluyendo plantilla sin datos básicos:', template);
        return false;
      }
      
      // Excluir plantillas marcadas como borradas o archivadas
      const isDeleted = template.deleted === true || 
                       template.archived === true ||
                       template.status === 'deleted' ||
                       template.status === 'archived';
      
      // Incluir todas las plantillas que no estén eliminadas
      // Incluso las de prueba o deshabilitadas, para que el usuario pueda activarlas si quiere
      const shouldInclude = !isDeleted;
      
      if (!shouldInclude) {
        console.log(`Excluyendo plantilla eliminada: "${template.name}"`);
      }
      
      return shouldInclude;
    });
    
    console.log(`Devolviendo ${filteredTemplates.length} plantillas filtradas (de ${templatesData.templates.length} totales)`);
    
    // Devolver respuesta con las plantillas filtradas
    return NextResponse.json(filteredTemplates, {
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