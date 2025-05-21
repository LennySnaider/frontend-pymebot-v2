/**
 * API route for simulating full lead updates
 * 
 * Este endpoint simula la actualización completa de un lead sin usar params dinámicos
 * Útil para evitar problemas con NextJS 15 y Edge Runtime
 * 
 * @version 1.0.0
 * @created 2025-05-19
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateLeadData } from '@/utils/validateLeadPhone'
import { getTenantFromSession } from '@/server/actions/tenant/getTenantFromSession'
import { SupabaseClient } from '@/services/supabase/SupabaseClient'

// Constante para activar la opción de runtime
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Extraer los datos del lead y su ID del cuerpo de la petición
    const data = await request.json()
    const leadId = data.id
    const leadData = data
    
    // Validar los datos de entrada
    if (!leadId || !leadData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Lead ID o datos faltantes',
        },
        { status: 400 }
      )
    }

    console.log(`API simulate-update-full: Simulando actualización - leadId: ${leadId}`, leadData)

    // Obtener el tenant actual
    const tenant_id = await getTenantFromSession()
    if (!tenant_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se pudo obtener el tenant_id',
        },
        { status: 401 }
      )
    }

    // Instanciar Supabase para verificar si el lead existe realmente
    const supabase = SupabaseClient.getInstance()
    
    // Intentar obtener datos reales del lead para la simulación
    let actualLead = null
    
    try {
      const { data: leadResult } = await supabase
        .from('leads')
        .select('id, stage, agent_id, full_name, email, phone')
        .eq('id', leadId)
        .limit(1)
      
      if (leadResult && leadResult.length > 0) {
        actualLead = leadResult[0]
        console.log('Lead encontrado en base de datos:', actualLead)
      }
    } catch (error) {
      console.log('Error al buscar lead en base de datos:', error)
      // Continuar con la simulación aunque no se encuentre el lead
    }
    
    // Lista de IDs de leads conocidos
    const knownLeads = {
      'Daniela Herrera': '21e9eabf-8252-4401-b530-5ccf47006d85',
      'Daniela Herrera Quintero': '21e9eabf-8252-4401-b530-5ccf47006d85',
      'Fernando Martínez': 'c7bbe5e0-4c8a-453f-9b04-588ab23b0098',
      'Juan Pérez': 'd9b881cf-6095-4008-a83d-e158f9fe2f1e',
      'Roberto Sánchez': '7a54506e-f326-4716-89ae-711941a97a01',
      'Carolina López': '08f89f3e-7441-4c99-96e4-745d813b9d09',
      'María González': '1c73e0d4-c225-411a-bccf-f021913870f6',
      'Elena Castro': '58e1cc38-5080-4396-8d48-10ee28597e3b',
      'Carlos Ruiz': '98812580-49ae-445c-951b-0b649d33edef',
      'Diego Vargas': 'b2bc68dc-9c96-4872-9218-17bfe02b443b',
      'Sofia Mendez': 'eb842513-0268-4e0e-b9c9-e2d643b10714'
    }
    
    // Verificar si el nombre del lead está en nuestro mapa
    const leadName = leadData.full_name || ''
    const knownLeadId = knownLeads[leadName]
    
    // Si el lead está en nuestra lista o es Daniela por ID
    if (knownLeadId || leadId === '21e9eabf-8252-4401-b530-5ccf47006d85') {
      console.log(`Lead conocido encontrado: ${leadName || 'Daniela Herrera'} - usando datos mapeados`)
    }

    // Procesar los datos para asegurar que tienen el formato correcto
    // Convertir features_needed a array si viene como string
    let featuresNeeded = leadData.features_needed
    if (typeof featuresNeeded === 'string') {
      featuresNeeded = featuresNeeded.split(',').map(item => item.trim()).filter(item => item !== '')
    }

    // Convertir bathrooms_needed a entero si es necesario
    let bathroomsNeeded = undefined
    if (leadData.bathrooms_needed !== undefined && leadData.bathrooms_needed !== null) {
      // Redondear al entero más cercano
      bathroomsNeeded = Math.round(Number(leadData.bathrooms_needed))
    }

    // Mapear los datos para que coincidan con el formato esperado
    const updateData = {
      full_name: leadData.full_name || (actualLead?.full_name || 'Daniela Herrera'),
      email: leadData.email || (actualLead?.email || 'daniela.herrera@email.mx'),
      phone: leadData.phone || (actualLead?.phone || '+52 55 8901 2345'),
      notes: leadData.notes || 'Simulación de actualización exitosa',
      property_type: leadData.property_type || 'Casa',
      budget_min: leadData.budget_min ? Number(leadData.budget_min) : 2500000,
      budget_max: leadData.budget_max ? Number(leadData.budget_max) : 5000000,
      bedrooms_needed: leadData.bedrooms_needed ? Number(leadData.bedrooms_needed) : 3,
      bathrooms_needed: bathroomsNeeded || 2,
      features_needed: featuresNeeded || ['Alberca', 'Jardín', 'Terraza'],
      preferred_zones: leadData.preferred_zones || ['Polanco', 'Condesa', 'Roma'],
      agent_id: leadData.agent_id || (actualLead?.agent_id || '71835822-9d1d-409e-914d-70ffa9503693'),
      source: leadData.source || 'website',
      interest_level: leadData.interest_level || 'alto',
      // Asegurar que next_contact_date sea una fecha ISO válida
      next_contact_date: leadData.next_contact_date ? 
        (typeof leadData.next_contact_date === 'number' ? 
          new Date(leadData.next_contact_date).toISOString() : 
          leadData.next_contact_date) : 
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días en el futuro
      selected_property_id: leadData.selected_property_id || '9dd01c94-8f92-4114-8a19-3404cb3ff1a9',
      stage: leadData.stage || (actualLead?.stage || 'opportunity')
    }

    console.log('Datos simulados para respuesta:', updateData)

    // Crear la respuesta simulada
    const simulatedLead = {
      ...updateData,
      id: leadId,
      tenant_id: tenant_id,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        ...(leadData.metadata || {}),
        simulation_notice: 'Datos simulados debido a restricciones RLS',
        original_lead_id: leadId
      }
    }

    // Devolver respuesta simulada exitosa
    return NextResponse.json(
      {
        success: true,
        data: simulatedLead,
        simulated: true,
        message: 'Actualización simulada exitosa. Nota: No se modificó la base de datos.'
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error en simulate-update-full:', error)
    
    // Proporcionar información detallada sobre el error
    let errorMessage = error.message || 'Error al simular actualización'
    let errorDetails = null
    
    if (error.code) {
      errorMessage = `Error (${error.code}): ${error.message}`
      errorDetails = {
        code: error.code,
        details: error.details,
        hint: error.hint
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: errorDetails,
        simulated: true
      },
      { status: 500 }
    )
  }
}