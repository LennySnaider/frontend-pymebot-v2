/**
 * API route for deleting leads
 * 
 * This endpoint is called when a lead is deleted from the UI
 * @version 1.0.0
 * @updated 2025-06-14
 */

import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@/services/supabase/SupabaseClient'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the lead ID from the URL params
    const leadId = String(params?.id || '')
    
    // Validate the ID
    if (!leadId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Lead ID is required',
        },
        { status: 400 }
      )
    }

    console.log(`API delete lead: Procesando eliminación - leadId: ${leadId}`)

    // Get the Supabase client
    let supabase;
    try {
      supabase = SupabaseClient.getInstance();
      if (!supabase) {
        throw new Error("No se pudo obtener una instancia válida del cliente Supabase");
      }
    } catch (clientError) {
      console.warn("Error controlado al obtener cliente Supabase:", 
        typeof clientError === 'object' && Object.keys(clientError).length === 0 ? 'Objeto vacío {}' : clientError
      );
      return NextResponse.json(
        { 
          success: false, 
          error: "Error de conexión con la base de datos. Por favor, inténtelo de nuevo." 
        },
        { status: 500 }
      );
    }

    // Primero eliminar posibles registros relacionados en lead_members
    const { error: membersError } = await supabase
      .from('lead_members')
      .delete()
      .eq('lead_id', leadId);

    if (membersError) {
      console.warn('Error al eliminar registros relacionados en lead_members:', membersError);
      // Continuamos aunque haya error en la eliminación de relaciones
    }

    // Eliminar el lead
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId);

    if (error) {
      console.error('Error al eliminar lead:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Failed to delete lead',
        },
        { status: 500 }
      );
    }

    // En el lado del servidor no podemos disparar eventos al navegador directamente
    // En su lugar, incluiremos información en el response para que el cliente
    // pueda disparar el evento usando nuestro sistema de leads en tiempo real

    return NextResponse.json(
      {
        success: true,
        message: 'Lead eliminado correctamente',
        // Incluir información para que el cliente pueda disparar evento
        event: {
          type: 'delete',
          leadId: leadId
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error al eliminar lead:', error);
    
    // Proporcionar información más detallada sobre el error
    let errorMessage = error.message || 'Failed to delete lead';
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
