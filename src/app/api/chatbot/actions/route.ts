/**
 * frontend/src/app/api/chatbot/actions/route.ts
 * API para ejecutar acciones específicas del chatbot (verificar disponibilidad, crear citas, etc.)
 * @version 1.0.0
 * @updated 2025-04-08
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/services/supabase/SupabaseClient'

// Verificar API key
const verifyApiKey = (apiKey: string | null) => {
  if (!apiKey || apiKey !== process.env.CHATBOT_API_KEY) {
    return false
  }
  return true
}

/**
 * POST - Ejecutar una acción del chatbot
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      action_type, 
      params = {}, 
      tenant_id, 
      session_id,
      api_key
    } = body
    
    // Verificar API key
    if (!verifyApiKey(api_key)) {
      return NextResponse.json(
        { error: 'API key no válida' },
        { status: 401 }
      )
    }
    
    // Verificar parámetros requeridos
    if (!action_type || !tenant_id) {
      return NextResponse.json(
        { error: 'Se requieren action_type y tenant_id' },
        { status: 400 }
      )
    }
    
    // Asegurar que el tenant_id siempre está en los parámetros
    const actionParams = {
      ...params,
      tenant_id
    }
    
    // Ejecutar la acción correspondiente
    let result
    
    switch (action_type) {
      case 'check_availability':
        result = await checkAgentAvailability(actionParams)
        break
        
      case 'create_appointment':
        result = await createAppointment(actionParams)
        break
        
      case 'update_lead':
        result = await updateLeadStage(actionParams)
        break
        
      case 'get_properties':
        result = await getProperties(actionParams)
        break
        
      case 'save_feedback':
        result = await saveFeedback(actionParams)
        break
        
      default:
        return NextResponse.json(
          { error: `Acción no soportada: ${action_type}` },
          { status: 400 }
        )
    }
    
    // Registrar la acción en la sesión si se proporciona session_id
    if (session_id) {
      await logActionToSession(session_id, action_type, actionParams, result)
    }
    
    return NextResponse.json({
      action: action_type,
      result,
      success: true
    })
    
  } catch (error) {
    console.error('Error en API de acciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * Verificar disponibilidad de agentes
 */
async function checkAgentAvailability(params: any) {
  try {
    const { tenant_id, agent_id, date, service_id } = params
    
    // Validar parámetros requeridos
    if (!tenant_id) {
      throw new Error('tenant_id es requerido')
    }
    
    // Formatear la fecha si es necesario
    let formattedDate = date
    if (date && !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Intentar convertir otros formatos a YYYY-MM-DD
      const dateObj = new Date(date)
      if (!isNaN(dateObj.getTime())) {
        formattedDate = dateObj.toISOString().split('T')[0]
      } else {
        throw new Error('Formato de fecha inválido')
      }
    }
    
    // Consultar disponibilidad
    let query = supabase
      .from('agents')
      .select('id, name, availability')
      .eq('tenant_id', tenant_id)
      .eq('is_active', true)
    
    // Filtrar por agente específico si se proporciona
    if (agent_id) {
      query = query.eq('id', agent_id)
    }
    
    const { data: agents, error } = await query
    
    if (error) {
      throw error
    }
    
    if (!agents || agents.length === 0) {
      return {
        available: false,
        message: 'No hay agentes disponibles',
        slots: []
      }
    }
    
    // Consultar citas existentes para la fecha
    const { data: appointments, error: appError } = await supabase
      .from('appointments')
      .select('appointment_time, agent_id')
      .eq('tenant_id', tenant_id)
      .eq('appointment_date', formattedDate)
      .in('status', ['scheduled', 'confirmed'])
      .order('appointment_time')
    
    if (appError) {
      throw appError
    }
    
    // Procesar disponibilidad
    // En un caso real, se implementaría lógica más compleja
    const availableSlots = []
    const takenSlots = appointments?.map(a => a.appointment_time) || []
    
    // Horario de trabajo estándar (9:00 - 18:00)
    const workHours = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00']
    
    for (const timeSlot of workHours) {
      if (!takenSlots.includes(timeSlot)) {
        availableSlots.push(timeSlot)
      }
    }
    
    return {
      available: availableSlots.length > 0,
      agents: agents.map(a => ({ id: a.id, name: a.name })),
      date: formattedDate,
      slots: availableSlots
    }
    
  } catch (error: any) {
    console.error('Error checking agent availability:', error)
    return {
      available: false,
      error: error.message,
      slots: []
    }
  }
}

/**
 * Crear una nueva cita
 */
async function createAppointment(params: any) {
  try {
    const { 
      tenant_id, 
      lead_id, 
      agent_id, 
      appointment_date, 
      appointment_time, 
      location,
      property_type,
      notes,
      user_name,
      user_contact
    } = params
    
    // Validar parámetros requeridos
    if (!tenant_id || !appointment_date || !appointment_time) {
      throw new Error('Faltan parámetros requeridos')
    }
    
    // Buscar o crear lead si no existe
    let leadIdToUse = lead_id
    
    if (!leadIdToUse && user_contact) {
      // Buscar lead por contacto
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('tenant_id', tenant_id)
        .or(`phone.eq.${user_contact},email.eq.${user_contact}`)
        .single()
      
      if (existingLead) {
        leadIdToUse = existingLead.id
      } else if (user_name) {
        // Crear un nuevo lead
        const { data: newLead, error: leadError } = await supabase
          .from('leads')
          .insert({
            tenant_id,
            full_name: user_name,
            [user_contact.includes('@') ? 'email' : 'phone']: user_contact,
            source: 'chatbot',
            stage: 'first_contact',
            created_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (leadError) {
          throw leadError
        }
        
        leadIdToUse = newLead.id
      }
    }
    
    if (!leadIdToUse) {
      throw new Error('No se proporcionó lead_id y no se pudo crear uno')
    }
    
    // Crear la cita
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        tenant_id,
        lead_id: leadIdToUse,
        agent_id,
        appointment_date,
        appointment_time,
        location: location || 'Virtual',
        property_type,
        notes,
        status: 'scheduled',
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    // Registrar actividad del lead
    await supabase
      .from('lead_activities')
      .insert({
        tenant_id,
        lead_id: leadIdToUse,
        agent_id,
        activity_type: 'appointment_created',
        description: `Cita programada para ${appointment_date} a las ${appointment_time}`,
        created_at: new Date().toISOString()
      })
    
    return {
      success: true,
      appointment_id: appointment.id,
      lead_id: leadIdToUse,
      appointment_date,
      appointment_time
    }
    
  } catch (error: any) {
    console.error('Error creating appointment:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Actualizar la etapa de un lead
 */
async function updateLeadStage(params: any) {
  try {
    const { tenant_id, lead_id, stage, previous_stage, notes } = params
    
    // Validar parámetros requeridos
    if (!tenant_id || !lead_id || !stage) {
      throw new Error('Faltan parámetros requeridos')
    }
    
    // Actualizar el lead
    const { data: updatedLead, error } = await supabase
      .from('leads')
      .update({
        stage,
        updated_at: new Date().toISOString()
      })
      .eq('id', lead_id)
      .eq('tenant_id', tenant_id)
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    // La actividad se registrará automáticamente mediante el trigger de base de datos
    
    return {
      success: true,
      lead_id,
      previous_stage,
      new_stage: stage
    }
    
  } catch (error: any) {
    console.error('Error updating lead stage:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Obtener propiedades según criterios de búsqueda
 */
async function getProperties(params: any) {
  try {
    const { 
      tenant_id, 
      property_type, 
      min_price, 
      max_price,
      bedrooms,
      bathrooms,
      zone,
      limit = 5
    } = params
    
    // Validar parámetros requeridos
    if (!tenant_id) {
      throw new Error('tenant_id es requerido')
    }
    
    // Construir la consulta
    let query = supabase
      .from('properties') // Asumiendo que existe una tabla de propiedades
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('is_active', true)
    
    // Aplicar filtros
    if (property_type) {
      query = query.eq('property_type', property_type)
    }
    
    if (min_price) {
      query = query.gte('price', min_price)
    }
    
    if (max_price) {
      query = query.lte('price', max_price)
    }
    
    if (bedrooms) {
      query = query.eq('bedrooms', bedrooms)
    }
    
    if (bathrooms) {
      query = query.eq('bathrooms', bathrooms)
    }
    
    if (zone) {
      query = query.eq('zone', zone)
    }
    
    // Limitar resultados y ordenar
    query = query.order('created_at', { ascending: false }).limit(limit)
    
    // Ejecutar la consulta
    const { data: properties, error } = await query
    
    if (error) {
      throw error
    }
    
    // Si no hay propiedades, simular datos 
    // (esto es solo para desarrollo, eliminar en producción)
    if (!properties || properties.length === 0) {
      return {
        count: 2,
        properties: [
          {
            id: 'prop1',
            title: 'Casa con jardín',
            property_type: 'house',
            price: 1500000,
            bedrooms: 3,
            bathrooms: 2,
            zone: 'Centro',
            images: ['https://example.com/house1.jpg']
          },
          {
            id: 'prop2',
            title: 'Apartamento moderno',
            property_type: 'apartment',
            price: 950000,
            bedrooms: 2,
            bathrooms: 1,
            zone: 'Norte',
            images: ['https://example.com/apartment1.jpg']
          }
        ]
      }
    }
    
    return {
      count: properties.length,
      properties
    }
    
  } catch (error: any) {
    console.error('Error getting properties:', error)
    return {
      count: 0,
      properties: [],
      error: error.message
    }
  }
}

/**
 * Registrar feedback del cliente
 */
async function saveFeedback(params: any) {
  try {
    const { tenant_id, lead_id, rating, comments, channel } = params
    
    // Validar parámetros requeridos
    if (!tenant_id || !rating) {
      throw new Error('Faltan parámetros requeridos')
    }
    
    // Guardar el feedback
    const { data: feedback, error } = await supabase
      .from('customer_feedback') // Asumiendo que existe una tabla para feedback
      .insert({
        tenant_id,
        lead_id,
        rating,
        comments,
        channel: channel || 'chatbot',
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    return {
      success: true,
      feedback_id: feedback.id
    }
    
  } catch (error: any) {
    console.error('Error saving feedback:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Registrar la acción en los metadatos de la sesión
 */
async function logActionToSession(sessionId: string, actionType: string, params: any, result: any) {
  try {
    // Obtener la sesión actual
    const { data: session, error: sessionError } = await supabase
      .from('conversation_sessions')
      .select('metadata')
      .eq('id', sessionId)
      .single()
    
    if (sessionError) {
      console.error('Error obteniendo sesión para log:', sessionError)
      return
    }
    
    // Preparar los metadatos actualizados
    const currentMetadata = session.metadata || {}
    const actions = currentMetadata.actions || []
    
    // Añadir esta acción al historial
    actions.push({
      type: actionType,
      timestamp: new Date().toISOString(),
      success: result.success !== false,
      params: { ...params, tenant_id: '[REDACTED]' }, // No exponer el tenant_id completo en logs
      result_summary: result.success ? 'success' : 'error'
    })
    
    // Limitar a las últimas 10 acciones
    const updatedActions = actions.slice(-10)
    
    // Actualizar la sesión
    await supabase
      .from('conversation_sessions')
      .update({
        metadata: {
          ...currentMetadata,
          actions: updatedActions,
          last_action: {
            type: actionType,
            timestamp: new Date().toISOString(),
            success: result.success !== false
          }
        }
      })
      .eq('id', sessionId)
    
  } catch (error) {
    console.error('Error logging action to session:', error)
    // No propagamos el error para no interrumpir la funcionalidad principal
  }
}
