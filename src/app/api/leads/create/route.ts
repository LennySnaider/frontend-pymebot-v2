/**
 * API route for creating new leads
 * This endpoint is called when a new lead is created from the form
 */

import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@/services/supabase/SupabaseClient'

export async function POST(request: NextRequest) {
  try {
    // Extract the lead data from the request body
    const leadData = await request.json()

    // Validate the input
    if (!leadData) {
      return NextResponse.json(
        { error: 'Lead data is required' },
        { status: 400 }
      )
    }

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

    // Obtener el tenant_id de la sesión del usuario
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    // ID del tenant actual
    let currentTenantId = null;
    
    if (sessionData?.session?.user) {
      const userData = sessionData.session.user;
      // Intenta obtener el tenant_id del metadata del usuario
      currentTenantId = userData.app_metadata?.tenant_id || null;
      console.log('Current tenant ID from session:', currentTenantId);
    }
    
    if (sessionError) {
      console.warn('Error getting session:', sessionError);
    }
    
    // Preparar los datos para la inserción, mapeando desde leadData recibido
    const insertData = {
      // No incluimos 'id' para que Supabase lo genere automáticamente
      full_name: leadData.full_name, // Corregido: usar full_name
      email: leadData.email,
      phone: leadData.phone,
      notes: leadData.notes, // Usar 'notes' como en el frontend
      property_type: leadData.property_type,
      budget_min: leadData.budget_min,
      budget_max: leadData.budget_max,
      bedrooms_needed: leadData.bedrooms_needed,
      // Redondear bathrooms_needed a entero
      bathrooms_needed: leadData.bathrooms_needed ? Math.round(Number(leadData.bathrooms_needed)) : 0,
      // Formatear features_needed como array de PostgreSQL si no está vacío
      features_needed: Array.isArray(leadData.features_needed) && leadData.features_needed.length > 0
        ? `{${leadData.features_needed.map((f: string) => `"${f.replace(/"/g, '\\"')}"`).join(',')}}`
        : (typeof leadData.features_needed === 'string' && leadData.features_needed.trim() !== ''
            ? `{${leadData.features_needed.split(',').map((f: string) => `"${f.trim().replace(/"/g, '\\"')}"`).join(',')}}`
            : null), // O '{}' si prefieres un array vacío
      // Formatear preferred_zones como array de PostgreSQL si no está vacío
      preferred_zones: Array.isArray(leadData.preferred_zones) && leadData.preferred_zones.length > 0
        ? `{${leadData.preferred_zones.map((z: string) => `"${z.replace(/"/g, '\\"')}"`).join(',')}}`
        : null, // O '{}' si prefieres un array vacío
      agent_notes: leadData.agent_notes,
      source: leadData.source,
      interest_level: leadData.interest_level,
      // Asegurarse de que next_contact_date sea una fecha ISO válida y no un timestamp
      next_contact_date: leadData.next_contact_date ? (typeof leadData.next_contact_date === 'number' ? new Date(leadData.next_contact_date).toISOString() : leadData.next_contact_date) : null,
      contact_count: leadData.contact_count,
      description: leadData.description, // Campo 'description' también existe
      // selected_property_id: leadData.selected_property_id, // Columna no existe según error PGRST204
      stage: 'new', // Etapa predeterminada
      status: 'active', // Estado predeterminado (o el que corresponda)
      metadata: leadData.metadata || {}, // Incluir metadatos completos
      agent_id: leadData.agent_id || leadData.members?.[0]?.id || null, // Usar agent_id si existe
      tenant_id: leadData.tenant_id || currentTenantId, // Usar tenant_id del formulario o de la sesión
      // created_at y updated_at son manejados por Supabase por defecto
    };

    // Insert the lead into the database using the prepared data
    const { data, error } = await supabase
      .from('leads')
      .insert(insertData) // Usar el objeto insertData preparado
      .select()
      .single();

    if (error) {
      console.warn('Error controlado al crear lead en base de datos:', 
        typeof error === 'object' && Object.keys(error).length === 0 ? 'Objeto vacío {}' : error
      );
      return NextResponse.json(
        { 
          success: false, 
          error: error.message || 'Failed to create lead' 
        },
        { status: 500 }
      );
    }

    // Si hay miembros asignados, insertarlos en la tabla de relación
    if (leadData.members && leadData.members.length > 0) {
      const membersData = leadData.members.map((member: any) => ({
        lead_id: data.id,
        user_id: member.id,
        created_at: new Date().toISOString(),
      }))

      const { error: membersError } = await supabase
        .from('lead_members')
        .insert(membersData)

      if (membersError) {
        console.warn('Error controlado al asignar miembros al lead:', 
          typeof membersError === 'object' && Object.keys(membersError).length === 0 ? 'Objeto vacío {}' : membersError
        )
        // No retornamos error ya que el lead se creó correctamente
      }
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Lead created successfully',
        data: data
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.warn('Error controlado al crear lead:', 
      typeof error === 'object' && Object.keys(error).length === 0 ? 'Objeto vacío {}' : error
    )
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    )
  }
}
