/**
 * API route alternativa para actualización de leads con fallback
 * Si el lead no existe, intenta encontrarlo por métodos alternativos o lo crea
 * 
 * @version 1.0.0
 * @updated 2025-05-19
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateLead } from '@/server/actions/leads/updateLead'

export async function PUT(request: NextRequest) {
  try {
    // Extraer datos del body
    const body = await request.json();
    const { leadId, leadData } = body;

    if (!leadId || !leadData) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Lead ID y datos del lead son requeridos' 
        },
        { status: 400 }
      );
    }

    console.log(`[API Lead Fallback] Procesando: leadId=${leadId}`);
    console.log('[API Lead Fallback] Datos recibidos:', leadData);

    // Llamar a la función updateLead que ya incorpora la lógica de fallback
    // La función buscará el lead por múltiples métodos y creará uno si es necesario
    const updatedLead = await updateLead(leadId, leadData);
    
    if (updatedLead) {
      console.log(`[API Lead Fallback] Actualización exitosa: ID=${updatedLead.id}`);
      
      return NextResponse.json(
        {
          success: true,
          data: updatedLead,
          // Incluir metadatos útiles para debug
          meta: {
            original_request_id: leadId,
            actual_lead_id: updatedLead.id,
            is_fallback: updatedLead.id !== leadId
          }
        },
        { status: 200 }
      );
    } else {
      console.error('[API Lead Fallback] Error: No se pudo actualizar el lead');
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'No se pudo actualizar el lead a pesar de los intentos de fallback' 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[API Lead Fallback] Error general:', error);
    
    // Proporcionar información más detallada sobre el error
    let errorMessage = error.message || 'Error interno del servidor';
    let errorDetails = null;
    
    if (error.code) {
      errorMessage = `Error de base de datos (${error.code}): ${error.message}`;
      errorDetails = {
        code: error.code,
        details: error.details,
        hint: error.hint
      };
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    );
  }
}