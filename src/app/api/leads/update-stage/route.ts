/**
 * API route for updating lead stage
 * This endpoint is called when a lead is moved between columns in the Kanban board
 * Mejora en el manejo de errores y respuestas para mejor diagnóstico
 * 
 * @version 1.4.0
 * @updated 2025-05-18
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateLeadStage } from '@/server/actions/leads/updateLeadStage'
import { createAuthClient, createAdminClient } from '@/services/supabase/serverWithAuth'

export async function POST(request: NextRequest) {
  try {
    // Extract the lead ID and new stage from the request body
    const { leadId, newStage, fromChatbot } = await request.json()

    // Validate the input
    if (!leadId || !newStage) {
      console.error('Error en API update-stage: Lead ID o nueva etapa faltantes', { leadId, newStage });
      return NextResponse.json(
        { error: 'Lead ID and new stage are required' },
        { status: 400 }
      )
    }

    console.log(`API update-stage: Procesando actualización - leadId: ${leadId}, newStage: ${newStage}, fromChatbot: ${fromChatbot || false}`);

    // Para operaciones desde el chatbot, usar el cliente administrativo
    // ya que el chatbot no tiene una sesión de usuario regular
    if (fromChatbot) {
        console.log(`API update-stage: Usando cliente administrativo para chatbot`);
        
        try {
            const supabase = createAdminClient();
            
            // Primero verificar si el lead existe
            const { data: existingLead, error: fetchError } = await supabase
                .from('leads')
                .select('id, stage')
                .eq('id', leadId)
                .single();
            
            if (fetchError || !existingLead) {
                console.error(`API update-stage: Lead no encontrado:`, fetchError);
                return NextResponse.json(
                    { 
                        success: false, 
                        error: `No se encontró el lead con ID: ${leadId}` 
                    },
                    { status: 404 }
                )
            }
            
            // Actualizar el lead
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
                console.error(`API update-stage: Error al actualizar:`, error);
                return NextResponse.json(
                    { 
                        success: false, 
                        error: error.message 
                    },
                    { status: 500 }
                )
            }
            
            console.log(`API update-stage: Actualización exitosa:`, data);
            
            return NextResponse.json(
                { 
                    success: true, 
                    message: `Lead stage updated successfully`,
                    stageChanged: true,
                    leadId: leadId,
                    newStage: newStage,
                    previousStage: existingLead.stage,
                    fromChatbot: true
                },
                { status: 200 }
            )
            
        } catch (error) {
            console.error(`API update-stage: Error general:`, error);
            return NextResponse.json(
                { 
                    success: false, 
                    error: error instanceof Error ? error.message : 'Error desconocido' 
                },
                { status: 500 }
            )
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
          previousStage: result.previousStage,
          fromChatbot: fromChatbot || false
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