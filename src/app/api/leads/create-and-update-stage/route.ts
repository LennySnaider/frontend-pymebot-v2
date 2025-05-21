/**
 * /app/api/leads/create-and-update-stage/route.ts
 * API endpoint que intenta crear un lead si no existe y luego actualizar su etapa
 * Útil para manejar casos donde los IDs en frontend no coinciden con la base de datos
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { leadData, newStage } = await request.json()
    const supabase = createRouteHandlerClient({ cookies })
    
    // Obtener usuario actual y su tenant_id
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Error de autenticación:', authError)
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener tenant_id del usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('Error al obtener datos del usuario:', userError)
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const tenant_id = userData.tenant_id

    console.log('Datos recibidos:', { leadData, newStage, tenant_id })

    // Primero intentar buscar el lead por su ID o metadata
    const leadId = leadData.id
    
    // Intentar actualizar directamente
    const { data: updateData, error: updateError } = await supabase
      .from('leads')
      .update({ stage: newStage })
      .eq('id', leadId)
      .eq('tenant_id', tenant_id)
      .select()
      .single()

    if (!updateError && updateData) {
      console.log('Lead actualizado exitosamente:', updateData)
      return NextResponse.json({ 
        success: true, 
        lead: updateData,
        message: 'Lead actualizado exitosamente'
      })
    }

    console.log('El lead no existe, intentando crearlo...')

    // Si no existe, crearlo con los datos proporcionados
    const newLeadData = {
      id: leadId, // Usar el ID proporcionado
      full_name: leadData.name || leadData.full_name || 'Sin nombre',
      email: leadData.email || null,
      phone: leadData.phone || null,
      stage: newStage,
      tenant_id: tenant_id,
      metadata: {
        ...(leadData.metadata || {}),
        created_from: 'sales_funnel',
        original_id: leadId,
        created_at: new Date().toISOString()
      },
      is_deleted: false,
      source: 'web',
      status: 'active'
    }

    const { data: createData, error: createError } = await supabase
      .from('leads')
      .insert(newLeadData)
      .select()
      .single()

    if (createError) {
      console.error('Error al crear lead:', createError)
      
      // Si el error es porque el ID ya existe, intentar actualizar con una búsqueda más flexible
      if (createError.code === '23505') { // Duplicate key error
        console.log('El lead ya existe, intentando actualización flexible...')
        
        // Buscar por email o phone si están disponibles
        let query = supabase
          .from('leads')
          .update({ stage: newStage })
          .eq('tenant_id', tenant_id)
          
        if (leadData.email) {
          query = query.eq('email', leadData.email)
        } else if (leadData.phone) {
          query = query.eq('phone', leadData.phone)
        } else {
          query = query.eq('full_name', leadData.name || leadData.full_name)
        }
        
        const { data: flexUpdate, error: flexError } = await query
          .select()
          .single()
          
        if (!flexError && flexUpdate) {
          return NextResponse.json({ 
            success: true, 
            lead: flexUpdate,
            message: 'Lead actualizado con búsqueda flexible'
          })
        }
      }
      
      return NextResponse.json(
        { success: false, error: 'No se pudo crear o actualizar el lead' },
        { status: 500 }
      )
    }

    console.log('Lead creado exitosamente:', createData)
    
    return NextResponse.json({ 
      success: true, 
      lead: createData,
      message: 'Lead creado y actualizado exitosamente'
    })

  } catch (error) {
    console.error('Error en create-and-update-stage:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}