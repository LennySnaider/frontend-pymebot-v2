import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase } from '@/services/supabase/SupabaseClient';
import { Database } from '@/types/supabase';

/**
 * GET: Obtiene los horarios regulares de negocio para el tenant actual
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
    
    // Verifica si se solicitan excepciones
    const url = new URL(req.url);
    const includeExceptions = url.searchParams.get('include_exceptions') === 'true';
    const locationId = url.searchParams.get('location_id') || null;
    
    // Obtener los horarios para el tenant
    let query = supabase
      .from('tenant_business_hours')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('day_of_week');
    
    if (locationId) {
      query = query.eq('location_id', locationId);
    }
    
    const { data: regularHours, error: hoursError } = await query;
    
    if (hoursError) {
      console.error('Error al obtener horarios:', hoursError);
      return NextResponse.json(
        { error: 'Error al obtener horarios' },
        { status: 500 }
      );
    }
    
    // Si se solicitan excepciones, obtenerlas también
    let exceptions = [];
    if (includeExceptions) {
      let exceptionsQuery = supabase
        .from('tenant_business_hours_exceptions')
        .select('*')
        .eq('tenant_id', tenant_id)
        .order('exception_date');
      
      if (locationId) {
        exceptionsQuery = exceptionsQuery.eq('location_id', locationId);
      }
      
      const { data: exceptionsData, error: exceptionsError } = await exceptionsQuery;
      
      if (exceptionsError) {
        console.error('Error al obtener excepciones:', exceptionsError);
      } else {
        exceptions = exceptionsData || [];
      }
    }
    
    return NextResponse.json({
      regular_hours: regularHours || [],
      exceptions: includeExceptions ? exceptions : undefined
    });
  } catch (error) {
    console.error('Error en GET /api/business/hours:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Actualiza completamente los horarios de negocio
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
    const hours = await req.json();
    
    if (!Array.isArray(hours)) {
      return NextResponse.json(
        { error: 'Formato inválido' },
        { status: 400 }
      );
    }
    
    // Eliminar horarios existentes
    const { error: deleteError } = await supabase
      .from('tenant_business_hours')
      .delete()
      .eq('tenant_id', tenant_id);
    
    if (deleteError) {
      console.error('Error al eliminar horarios existentes:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar horarios existentes' },
        { status: 500 }
      );
    }
    
    // Insertar nuevos horarios
    const hoursWithTenant = hours.map(hour => ({
      ...hour,
      tenant_id,
    }));
    
    const { error: insertError } = await supabase
      .from('tenant_business_hours')
      .insert(hoursWithTenant);
    
    if (insertError) {
      console.error('Error al guardar horarios:', insertError);
      return NextResponse.json(
        { error: 'Error al guardar horarios' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Horarios actualizados correctamente',
    });
  } catch (error) {
    console.error('Error en PUT /api/business/hours:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Actualiza parcialmente los horarios de negocio
 */
export async function PATCH(req: NextRequest) {
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
    const updates = await req.json();
    
    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Formato inválido' },
        { status: 400 }
      );
    }
    
    // Actualizar cada registro individualmente
    const updatePromises = updates.map(async (update) => {
      if (update.id) {
        // Actualizar registro existente
        const { day_of_week, is_closed, open_time, close_time } = update;
        const { error } = await supabase
          .from('tenant_business_hours')
          .update({ is_closed, open_time, close_time })
          .eq('id', update.id)
          .eq('tenant_id', tenant_id); // Seguridad adicional
        
        if (error) {
          throw error;
        }
      } else {
        // Insertar nuevo registro
        const { day_of_week, is_closed, open_time, close_time } = update;
        const { error } = await supabase
          .from('tenant_business_hours')
          .insert({
            tenant_id,
            day_of_week,
            is_closed,
            open_time,
            close_time,
          });
        
        if (error) {
          throw error;
        }
      }
    });
    
    await Promise.all(updatePromises);
    
    return NextResponse.json({
      success: true,
      message: 'Horarios actualizados correctamente',
    });
  } catch (error) {
    console.error('Error en PATCH /api/business/hours:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}