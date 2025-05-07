import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest, verifyAdminOrManager } from '../../business/hours/tenant-middleware';
// Just a comment to force rebuild
import { supabase } from '@/services/supabase/SupabaseClient';
import { AppointmentSettingsRequest } from './types';

/**
 * GET /api/appointments/settings
 * Obtiene la configuración de citas para un tenant
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar tenant
    const tenantResult = await getTenantFromRequest(req);
    
    if (tenantResult.error) {
      return tenantResult.error;
    }
    
    const { tenant_id } = tenantResult;
    
    // Consultar configuración
    const { data, error } = await supabase
      .from('tenant_appointment_settings')
      .select('*')
      .eq('tenant_id', tenant_id)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no data found
      console.error('Error al obtener configuración de citas:', error);
      return NextResponse.json(
        { error: 'Error al obtener configuración de citas' },
        { status: 500 }
      );
    }
    
    if (!data) {
      // No hay configuración, retornar valores por defecto
      return NextResponse.json({
        tenant_id,
        appointment_duration: 30,
        buffer_time: 0,
        max_daily_appointments: null,
        min_notice_minutes: 60,
        max_future_days: 30,
        require_approval: false,
        reminder_time_hours: 24,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { status: 200 });
    }
    
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/appointments/settings:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/appointments/settings
 * Actualiza la configuración de citas para un tenant
 */
export async function PUT(req: NextRequest) {
  try {
    // Verificar permisos de administrador
    const adminResult = await verifyAdminOrManager(req);
    
    if (adminResult.error) {
      return adminResult.error;
    }
    
    const { tenant_id } = adminResult;
    
    // Parsear cuerpo de la solicitud
    const data: AppointmentSettingsRequest = await req.json();
    
    // Validar datos
    if (data.appointment_duration <= 0) {
      return NextResponse.json(
        { error: 'La duración de la cita debe ser mayor que cero' },
        { status: 400 }
      );
    }
    
    if (data.buffer_time < 0) {
      return NextResponse.json(
        { error: 'El tiempo de buffer no puede ser negativo' },
        { status: 400 }
      );
    }
    
    if (data.max_future_days <= 0) {
      return NextResponse.json(
        { error: 'Los días máximos en el futuro deben ser mayores que cero' },
        { status: 400 }
      );
    }
    
    // Verificar si ya existe configuración para este tenant
    const { data: existingSettings, error: checkError } = await supabase
      .from('tenant_appointment_settings')
      .select('id')
      .eq('tenant_id', tenant_id)
      .single();
    
    const settingsExists = !checkError || checkError.code !== 'PGRST116';
    const settingsId = existingSettings?.id;
    
    // Preparar datos para guardar
    const settingsData = {
      ...data,
      tenant_id,
      updated_at: new Date().toISOString()
    };
    
    let result;
    
    if (settingsExists && settingsId) {
      // Actualizar configuración existente
      const { data: updatedData, error: updateError } = await supabase
        .from('tenant_appointment_settings')
        .update(settingsData)
        .eq('id', settingsId)
        .select();
      
      if (updateError) {
        console.error('Error al actualizar configuración:', updateError);
        return NextResponse.json(
          { error: 'Error al actualizar configuración de citas' },
          { status: 500 }
        );
      }
      
      result = updatedData[0];
    } else {
      // Crear nueva configuración
      const { data: newData, error: insertError } = await supabase
        .from('tenant_appointment_settings')
        .insert({
          ...settingsData,
          created_at: new Date().toISOString()
        })
        .select();
      
      if (insertError) {
        console.error('Error al crear configuración:', insertError);
        return NextResponse.json(
          { error: 'Error al crear configuración de citas' },
          { status: 500 }
        );
      }
      
      result = newData[0];
    }
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error en PUT /api/appointments/settings:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}