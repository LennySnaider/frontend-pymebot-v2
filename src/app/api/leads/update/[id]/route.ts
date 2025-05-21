/**
 * API route for updating leads
 * 
 * This endpoint is called when a lead is updated from the form
 * @version 1.0.3
 * @updated 2025-05-19
 * 
 * NOTA: Se corrigió la sintaxis para manejar params.id en NextJS 15.
 * En NextJS 15, los params deben ser accedidos de forma segura con validación
 * ya que el comportamiento cambió respecto a versiones anteriores.
 */

// Forzar runtime de Node.js para evitar problemas con Edge Runtime
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server'
import { updateLead } from '@/server/actions/leads/updateLead'
import { validateLeadData } from '@/utils/validateLeadPhone'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id?: string, [key: string]: string | string[] }> }
) {
  try {
    // En NextJS 15, los params deben ser esperados (awaited) primero
    const resolvedParams = await params;
    
    // Ahora extraer el ID de forma segura
    const leadId = resolvedParams?.id ? String(resolvedParams.id) : '';
    
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

    // Validar los datos antes de actualizar, incluyendo el ID
    const dataWithId = { ...updateData, id: leadId };
    const validatedData = validateLeadData(dataWithId);
    
    // Remover el ID del objeto validado ya que no debe ser actualizado
    const { id, ...updateDataValidated } = validatedData;

    // Call the server action to update the lead
    const updatedLead = await updateLead(leadId, updateDataValidated)

    // En el lado del servidor no podemos disparar eventos al navegador directamente
    // En su lugar, incluiremos información en el response para que el cliente
    // pueda disparar el evento usando nuestro sistema de leads en tiempo real

    return NextResponse.json(
      {
        success: true,
        data: updatedLead,
        // Incluir información para que el cliente pueda disparar evento
        event: {
          type: 'update',
          leadId: leadId
        }
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