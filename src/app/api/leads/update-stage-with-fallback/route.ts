/**
 * /app/api/leads/update-stage-with-fallback/route.ts
 * API endpoint que actualiza la etapa de un lead con fallback para crear si no existe
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST(request: NextRequest) {
  try {
    const { leadId, newStage, leadData } = await request.json()
    
    // Obtener sesión actual
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Crear cliente Supabase con service role para operaciones de admin
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Obtener tenant_id del usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const tenant_id = userData.tenant_id

    console.log('Intentando actualizar lead:', leadId, 'a etapa:', newStage)

    // Primero intentar actualizar el lead
    const { data: existingLead, error: updateError } = await supabase
      .from('leads')
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq('id', leadId)
      .eq('tenant_id', tenant_id)
      .select()
      .single()

    if (!updateError && existingLead) {
      console.log('Lead actualizado exitosamente')
      return NextResponse.json({ 
        success: true, 
        lead: existingLead,
        message: 'Lead actualizado exitosamente'
      })
    }

    // Si el lead no existe, intentar crearlo
    if (updateError?.code === 'PGRST116' || updateError?.message?.includes('No rows found')) {
      console.log('Lead no encontrado, intentando crear con datos del frontend...')
      
      if (!leadData) {
        return NextResponse.json(
          { success: false, error: 'Lead no encontrado y no se proporcionaron datos para crear' },
          { status: 404 }
        )
      }

      // Crear el lead con los datos proporcionados
      const newLeadData = {
        id: leadId,
        full_name: leadData.name || leadData.full_name || 'Sin nombre',
        email: leadData.email || null,
        phone: leadData.phone || null,
        stage: newStage,
        status: 'active',
        source: leadData.source || 'frontend',
        tenant_id: tenant_id,
        metadata: {
          ...(leadData.metadata || {}),
          created_from: 'sales_funnel_fallback',
          original_frontend_id: leadId,
          created_at: new Date().toISOString()
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: createdLead, error: createError } = await supabase
        .from('leads')
        .insert(newLeadData)
        .select()
        .single()

      if (createError) {
        console.error('Error al crear lead:', createError)
        return NextResponse.json(
          { 
            success: false, 
            error: 'No se pudo crear el lead',
            details: createError.message
          },
          { status: 500 }
        )
      }

      console.log('Lead creado exitosamente:', createdLead)
      return NextResponse.json({ 
        success: true, 
        lead: createdLead,
        message: 'Lead creado y actualizado exitosamente',
        created: true
      })
    }

    // Si hay otro tipo de error
    console.error('Error al actualizar lead:', updateError)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al actualizar lead',
        details: updateError?.message
      },
      { status: 500 }
    )

  } catch (error) {
    console.error('Error en update-stage-with-fallback:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}