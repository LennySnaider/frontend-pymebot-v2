/**
 * API route for updating lead stage
 * This endpoint is called when a lead is moved between columns in the Kanban board
 * Mejora en el manejo de errores y respuestas para mejor diagnóstico
 * 
 * @version 1.2.0
 * @updated 2025-04-28
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateLeadStage } from '@/server/actions/leads/updateLeadStage'

export async function POST(request: NextRequest) {
  try {
    // Extract the lead ID and new stage from the request body
    const { leadId, newStage } = await request.json()

    // Validate the input
    if (!leadId || !newStage) {
      console.error('Error en API update-stage: Lead ID o nueva etapa faltantes', { leadId, newStage });
      return NextResponse.json(
        { error: 'Lead ID and new stage are required' },
        { status: 400 }
      )
    }

    console.log(`API update-stage: Procesando actualización - leadId: ${leadId}, newStage: ${newStage}`);

    // Corrección especial para closed y confirmed
    if (newStage === 'closed' || newStage === 'confirmed') {
        console.log(`API update-stage: Aplicando corrección especial para etapa: ${newStage}`);
        
        // Directo a través de cliente supabase para estos casos especiales
        // Importar manualmente solo en este caso de uso
        const { SupabaseClient } = await import('@/services/supabase/SupabaseClient');
        const supabase = SupabaseClient.getInstance();
        
        if (supabase) {
            try {
                // Usar la API de Supabase directamente
                const { error, data } = await supabase
                    .from('leads')
                    .update({
                        stage: newStage,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', leadId)
                    .select('stage, id')
                    .single();
                
                if (error) {
                    console.error(`API update-stage: Error directo Supabase al actualizar a ${newStage}:`, error);
                    // Continuar con updateLeadStage como fallback
                } else {
                    console.log(`API update-stage: Actualización directa exitosa a ${newStage}:`, data);
                    
                    // Devolver éxito inmediatamente
                    return NextResponse.json(
                        { 
                            success: true, 
                            message: `Lead stage updated successfully to ${newStage} (direct)`,
                            stageChanged: true,
                            leadId: leadId,
                            newStage: newStage,
                            method: 'direct'
                        },
                        { status: 200 }
                    )
                }
            } catch (directError) {
                console.error(`API update-stage: Error al intentar actualización directa a ${newStage}:`, directError);
                // Continuar con updateLeadStage como fallback
            }
        }
    }

    // Call the server action to update the lead stage
    const result = await updateLeadStage(leadId, newStage)

    // Si el update fue exitoso
    if (result.success) {
      console.log(`API update-stage: Actualización exitosa - leadId: ${leadId}, newStage: ${newStage}, stageChanged: ${result.stageChanged}`);
      return NextResponse.json(
        { 
          success: true, 
          message: 'Lead stage updated successfully',
          stageChanged: result.stageChanged,
          leadId: result.leadId,
          newStage: result.newStage,
          previousStage: result.previousStage
        },
        { status: 200 }
      )
    } 
    
    // Si el update falló
    console.error(`API update-stage: Error en actualización - leadId: ${leadId}, error: ${result.error}`);
    return NextResponse.json(
      { 
        success: false, 
        error: result.error || 'Failed to update lead stage',
        leadId: result.leadId
      },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('Error updating lead stage:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    )
  }
}