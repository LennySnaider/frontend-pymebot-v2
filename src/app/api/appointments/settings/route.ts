import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase } from '@/services/supabase/SupabaseClient';

/**
 * GET: Obtiene la configuración de citas para el tenant
 */
export async function GET(req: NextRequest) {
  try {
    // Obtener la sesión usando NextAuth
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    const tenant_id = session.user.tenant_id;
    
    if (!tenant_id) {
      return NextResponse.json(
        { error: 'Usuario no asociado a ningún tenant' },
        { status: 403 }
      );
    }
    
    // Obtener la configuración de citas para el tenant
    const { data: appointmentSettings, error } = await supabase
      .from('tenant_appointment_settings')
      .select('*')
      .eq('tenant_id', tenant_id)
      .maybeSingle();
    
    if (error) {
      console.error('Error al obtener configuración de citas:', error);
      return NextResponse.json(
        { error: 'Error al obtener configuración de citas' },
        { status: 500 }
      );
    }
    
    // Si no hay configuración, crear una configuración predeterminada
    if (!appointmentSettings) {
      // Valores predeterminados
      const defaultSettings = {
        tenant_id,
        appointment_duration: 30, // 30 minutos por defecto
        buffer_time: 0, // Sin tiempo de buffer por defecto
        max_daily_appointments: null, // Sin límite diario por defecto
        min_notice_minutes: 60, // 1 hora de antelación mínima
        max_future_days: 30, // Reservas hasta 30 días en el futuro
        require_approval: false, // No requiere aprobación manual
        reminder_time_hours: 24, // Recordatorio 24h antes
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Insertar configuración predeterminada
      const { data: newSettings, error: insertError } = await supabase
        .from('tenant_appointment_settings')
        .insert(defaultSettings)
        .select()
        .single();
      
      if (insertError) {
        console.error('Error al crear configuración predeterminada:', insertError);
        // Devolver configuración predeterminada aunque no se pueda insertar
        return NextResponse.json(defaultSettings);
      }
      
      return NextResponse.json(newSettings);
    }
    
    return NextResponse.json(appointmentSettings);
  } catch (error) {
    console.error('Error en GET /api/appointments/settings:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Actualiza la configuración de citas
 */
export async function PUT(req: NextRequest) {
  try {
    // Obtener la sesión usando NextAuth
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    const tenant_id = session.user.tenant_id;
    const userRole = session.user.role;
    
    if (!tenant_id) {
      return NextResponse.json(
        { error: 'Usuario no asociado a ningún tenant' },
        { status: 403 }
      );
    }
    
    // Verificar si el usuario tiene permisos de administrador
    if (userRole !== 'super_admin' && userRole !== 'tenant_admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }
    
    // Obtener los datos del body
    const settings = await req.json();
    
    // Validar campos obligatorios
    if (settings.appointment_duration === undefined || 
        settings.buffer_time === undefined) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: appointment_duration, buffer_time' },
        { status: 400 }
      );
    }
    
    // Preparar los datos para actualizar
    const updateData = {
      ...settings,
      tenant_id, // Asegurar que el tenant_id sea correcto
      updated_at: new Date().toISOString()
    };
    
    // Verificar si ya existe configuración para este tenant
    const { data: existingSettings, error: checkError } = await supabase
      .from('tenant_appointment_settings')
      .select('id')
      .eq('tenant_id', tenant_id)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error al verificar configuración existente:', checkError);
      return NextResponse.json(
        { error: 'Error al verificar configuración existente' },
        { status: 500 }
      );
    }
    
    // Actualizar o insertar según corresponda
    let result;
    
    if (existingSettings) {
      // Actualizar configuración existente
      const { data, error } = await supabase
        .from('tenant_appointment_settings')
        .update(updateData)
        .eq('id', existingSettings.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error al actualizar configuración:', error);
        return NextResponse.json(
          { error: 'Error al actualizar configuración' },
          { status: 500 }
        );
      }
      
      result = data;
    } else {
      // Insertar nueva configuración
      const { data, error } = await supabase
        .from('tenant_appointment_settings')
        .insert({
          ...updateData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error al crear configuración:', error);
        return NextResponse.json(
          { error: 'Error al crear configuración' },
          { status: 500 }
        );
      }
      
      result = data;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Configuración de citas actualizada correctamente',
      settings: result
    });
  } catch (error) {
    console.error('Error en PUT /api/appointments/settings:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}