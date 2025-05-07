/**
 * API route for updating leads
 * 
 * This endpoint is called when a lead is updated from the form
 * @version 1.0.0
 * @updated 2025-04-12
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateLead } from '@/server/actions/leads/updateLead'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the lead ID from the URL params
    const leadId = params.id
    
    // Extract the lead data from the request body
    const leadData = await request.json()

    // Validate the input
    if (!leadId || !leadData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Lead ID or data missing',
        },
        { status: 400 }
      )
    }

    console.log(`API update lead: Procesando actualización - leadId: ${leadId}`, leadData)

    // Procesar los datos para asegurar que tienen el formato correcto
    // Convertir features_needed a array si viene como string
    let featuresNeeded = leadData.features_needed;
    if (typeof featuresNeeded === 'string') {
      featuresNeeded = featuresNeeded.split(',').map(item => item.trim()).filter(item => item !== '');
    }

    // Convertir bathrooms_needed a entero si es necesario
    let bathroomsNeeded = undefined;
    if (leadData.bathrooms_needed !== undefined && leadData.bathrooms_needed !== null) {
      // Redondear al entero más cercano
      bathroomsNeeded = Math.round(Number(leadData.bathrooms_needed));
    }

    // Map the data to match the expected format for updateLead
    const updateData = {
      full_name: leadData.full_name,
      email: leadData.email,
      phone: leadData.phone,
      notes: leadData.notes,
      property_type: leadData.property_type,
      budget_min: leadData.budget_min ? Number(leadData.budget_min) : undefined,
      budget_max: leadData.budget_max ? Number(leadData.budget_max) : undefined,
      bedrooms_needed: leadData.bedrooms_needed ? Number(leadData.bedrooms_needed) : undefined,
      bathrooms_needed: bathroomsNeeded,
      features_needed: featuresNeeded,
      preferred_zones: leadData.preferred_zones,
      agent_id: leadData.agent_id,
      source: leadData.source,
      interest_level: leadData.interest_level,
      // Asegurarse de que next_contact_date sea una fecha ISO válida y no un timestamp
      next_contact_date: leadData.next_contact_date ? 
        (typeof leadData.next_contact_date === 'number' ? 
          new Date(leadData.next_contact_date).toISOString() : 
          leadData.next_contact_date) : 
        null,
      // Incluir cualquier otro campo que se necesite actualizar
    }

    console.log('Datos formateados para actualización:', updateData);

    // Call the server action to update the lead
    const updatedLead = await updateLead(leadId, updateData)

    return NextResponse.json(
      {
        success: true,
        data: updatedLead,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error updating lead:', error)
    
    // Proporcionar información más detallada sobre el error
    let errorMessage = error.message || 'Failed to update lead';
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
    )
  }
}
