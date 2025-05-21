/**
 * API route for updating lead to special stages (confirmed/closed)
 * This endpoint handles the special drop zones in the sales funnel
 * 
 * @version 1.0.0
 * @created 2025-05-18
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/services/supabase/serverWithAuth'

export async function POST(request: NextRequest) {
    try {
        const { leadId, specialStage } = await request.json()

        // Validate the input
        if (!leadId || !specialStage) {
            return NextResponse.json(
                { error: 'Lead ID and special stage are required' },
                { status: 400 }
            )
        }

        // Validate special stage values
        const validSpecialStages = ['confirmado', 'cerrado', 'confirmed', 'closed']
        if (!validSpecialStages.includes(specialStage)) {
            return NextResponse.json(
                { error: 'Invalid special stage. Must be confirmado/cerrado or confirmed/closed' },
                { status: 400 }
            )
        }

        console.log(`API update-special-stage: Procesando etapa especial - leadId: ${leadId}, specialStage: ${specialStage}`);

        // Normalize stage names to Spanish
        const normalizedStage = specialStage === 'confirmed' ? 'confirmado' : 
                               specialStage === 'closed' ? 'cerrado' : 
                               specialStage;

        const supabase = createAdminClient();

        // First verify if the lead exists
        const { data: existingLead, error: fetchError } = await supabase
            .from('leads')
            .select('id, stage, name, metadata')
            .eq('id', leadId)
            .single();

        if (fetchError || !existingLead) {
            console.error(`API update-special-stage: Lead no encontrado:`, fetchError);
            return NextResponse.json(
                { 
                    success: false, 
                    error: `No se encontró el lead con ID: ${leadId}` 
                },
                { status: 404 }
            )
        }

        // Update the lead with special stage
        const updateData: any = {
            stage: normalizedStage,
            updated_at: new Date().toISOString()
        }

        // Si es confirmado, actualizar metadata para indicar que tiene cita
        if (normalizedStage === 'confirmado') {
            updateData.metadata = {
                ...(existingLead as any).metadata,
                has_appointment: true
            }
        }

        // Si es cerrado, actualizar metadata para indicar que está inactivo
        if (normalizedStage === 'cerrado') {
            updateData.metadata = {
                ...(existingLead as any).metadata,
                is_active: false
            }
        }

        const { error, data } = await supabase
            .from('leads')
            .update(updateData)
            .eq('id', leadId)
            .select('*')
            .single();

        if (error) {
            console.error(`API update-special-stage: Error al actualizar:`, error);
            return NextResponse.json(
                { 
                    success: false, 
                    error: error.message 
                },
                { status: 500 }
            )
        }

        console.log(`API update-special-stage: Lead ${leadId} actualizado a ${normalizedStage}`);

        // If the lead was confirmed, we might need to trigger appointment creation
        if (normalizedStage === 'confirmado') {
            // TODO: Trigger appointment creation flow if needed
            console.log(`API update-special-stage: Lead confirmado, considerar crear cita`);
        }

        return NextResponse.json(
            { 
                success: true, 
                message: `Lead movido a etapa especial: ${normalizedStage}`,
                leadId: leadId,
                specialStage: normalizedStage,
                previousStage: existingLead.stage,
                leadName: existingLead.name,
                isSpecialStage: true
            },
            { status: 200 }
        )

    } catch (error: any) {
        console.error('Error updating lead to special stage:', error);
        
        return NextResponse.json(
            { 
                success: false, 
                error: error.message || 'Internal server error' 
            },
            { status: 500 }
        )
    }
}