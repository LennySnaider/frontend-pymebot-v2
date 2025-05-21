/**
 * API route para simular la actualización de etapa de un lead
 * Este endpoint permite simular el cambio de etapa sin modificar realmente la base de datos
 * Útil para pruebas y debug del sales funnel y chatbot
 * 
 * @version 1.0.0
 * @created 2025-05-19
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/services/supabase/serverWithAuth'

export async function POST(request: NextRequest) {
  try {
    // Extraer ID del lead y nueva etapa del body de la petición
    const { leadId, newStage, fromChatbot, returnDelay = 0 } = await request.json()

    // Validar que se proporcionaron los campos requeridos
    if (!leadId || !newStage) {
      console.error('Error en API simulate-stage-update: Lead ID o nueva etapa faltantes', { leadId, newStage });
      return NextResponse.json(
        { error: 'Lead ID and new stage are required' },
        { status: 400 }
      )
    }

    console.log(`API simulate-stage-update: Simulando actualización - leadId: ${leadId}, newStage: ${newStage}, fromChatbot: ${fromChatbot || false}`);

    // Crear cliente de Supabase para verificar que el lead existe
    const supabase = createAdminClient();
    
    // Verificar si el lead existe para dar una respuesta realista
    const { data: existingLead, error: fetchError } = await supabase
      .from('leads')
      .select('id, stage, full_name')
      .eq('id', leadId)
      .single();
    
    // Si no se encuentra el lead, probar buscar por metadata
    let leadData = existingLead;
    
    if (fetchError || !existingLead) {
      console.log(`Lead no encontrado directamente, buscando en metadata - leadId: ${leadId}`);
      
      // Buscar en metadata.original_lead_id
      const { data: metadataLeads } = await supabase
        .from('leads')
        .select('id, stage, full_name, metadata')
        .contains('metadata', { original_lead_id: leadId })
        .limit(1);
        
      if (metadataLeads && metadataLeads.length > 0) {
        leadData = metadataLeads[0];
        console.log(`Lead encontrado en metadata - ID real: ${leadData.id}, ID original: ${leadId}`);
      }
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
    
    // Si el lead no existe en absoluto, usar un lead conocido
    if (!leadData) {
      // Si el ID está entre los leads conocidos por valor, usarlo
      const knownLeadIds = Object.values(knownLeads);
      if (knownLeadIds.includes(leadId)) {
        console.log(`El ID ${leadId} está entre los leads conocidos, simulando con este ID`);
        leadData = {
          id: leadId,
          full_name: Object.keys(knownLeads).find(key => knownLeads[key] === leadId) || 'Lead conocido',
          stage: 'prospecting'
        };
      } else {
        // Si no, usar Daniela Herrera por defecto
        console.log(`API simulate-stage-update: Lead no encontrado - usando Lead de Daniela Herrera por defecto`);
        leadData = {
          id: '21e9eabf-8252-4401-b530-5ccf47006d85',
          full_name: 'Daniela Herrera Quintero',
          stage: 'prospecting'
        };
      }
    }
    
    // Mapeo de etapas (nombres en español a inglés)
    const stageMap: Record<string, string> = {
      'nuevos': 'new',
      'prospectando': 'prospecting',
      'calificacion': 'qualification',
      'oportunidad': 'opportunity',
      'confirmado': 'confirmed',
      'cerrado': 'closed',
      // También incluir los nombres en inglés por si vienen así
      'new': 'new',
      'prospecting': 'prospecting',
      'qualification': 'qualification',
      'opportunity': 'opportunity',
      'confirmed': 'confirmed',
      'closed': 'closed'
    };
    
    // Normalizar la etapa
    const normalizedStage = stageMap[newStage] || newStage;
    
    // Si se especificó un delay, esperar ese tiempo para simular latencia de red
    if (returnDelay > 0) {
      console.log(`Simulando delay de ${returnDelay}ms antes de responder`);
      await new Promise(resolve => setTimeout(resolve, returnDelay));
    }
    
    // Simular respuesta exitosa con los datos del lead
    return NextResponse.json(
      { 
        success: true, 
        message: 'Lead stage updated successfully (simulated)',
        stageChanged: leadData.stage !== normalizedStage,
        leadId: leadId,
        newStage: normalizedStage,
        previousStage: leadData.stage,
        leadName: leadData.full_name,
        fromChatbot: fromChatbot || false,
        simulated: true
      },
      { status: 200 }
    )
    
  } catch (error: any) {
    console.error('Error en simulate-stage-update:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
        simulated: true
      },
      { status: 500 }
    )
  }
}