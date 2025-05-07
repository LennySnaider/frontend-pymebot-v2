import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest, verifyAdminOrManager } from '../../business/hours/tenant-middleware';
// Just a comment to force rebuild
import { supabase } from '@/services/supabase/SupabaseClient';
import { AppointmentTypeRequest } from '../settings/types';

/**
 * GET /api/appointments/types
 * Obtiene los tipos de cita para un tenant
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar tenant
    const tenantResult = await getTenantFromRequest(req);
    
    if (tenantResult.error) {
      return tenantResult.error;
    }
    
    const { tenant_id } = tenantResult;
    
    // Obtener parámetros de consulta
    const searchParams = req.nextUrl.searchParams;
    const includeInactive = searchParams.get('include_inactive') === 'true';
    
    // Consultar tipos de cita
    let query = supabase
      .from('tenant_appointment_types')
      .select('*')
      .eq('tenant_id', tenant_id);
    
    // Filtrar por activos si no se solicitan inactivos
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    
    // Ordenar por nombre
    query = query.order('name');
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error al obtener tipos de cita:', error);
      return NextResponse.json(
        { error: 'Error al obtener tipos de cita' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data || [], { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/appointments/types:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/appointments/types
 * Crea un nuevo tipo de cita
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar permisos de administrador
    const adminResult = await verifyAdminOrManager(req);
    
    if (adminResult.error) {
      return adminResult.error;
    }
    
    const { tenant_id } = adminResult;
    
    // Parsear cuerpo de la solicitud
    const typeData: AppointmentTypeRequest = await req.json();
    
    // Validar datos requeridos
    if (!typeData.name) {
      return NextResponse.json(
        { error: 'El nombre del tipo de cita es obligatorio' },
        { status: 400 }
      );
    }
    
    if (typeData.duration <= 0) {
      return NextResponse.json(
        { error: 'La duración debe ser mayor que cero' },
        { status: 400 }
      );
    }
    
    // Preparar datos para inserción
    const dataWithTenant = {
      ...typeData,
      tenant_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Insertar el tipo de cita
    const { data, error } = await supabase
      .from('tenant_appointment_types')
      .insert(dataWithTenant)
      .select();
    
    if (error) {
      console.error('Error al crear tipo de cita:', error);
      
      // Si es un error de unicidad (nombre ya existe)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ya existe un tipo de cita con ese nombre' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Error al crear tipo de cita' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/appointments/types:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/appointments/types/[id]
 * Obtiene un tipo de cita específico
 */
export async function GET_ID(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar tenant
    const tenantResult = await getTenantFromRequest(req);
    
    if (tenantResult.error) {
      return tenantResult.error;
    }
    
    const { tenant_id } = tenantResult;
    const { id } = params;
    
    // Consultar el tipo de cita
    const { data, error } = await supabase
      .from('tenant_appointment_types')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenant_id) // Asegurar que pertenece al tenant
      .single();
    
    if (error) {
      console.error('Error al obtener tipo de cita:', error);
      
      if (error.code === 'PGRST116') { // No data found
        return NextResponse.json(
          { error: 'Tipo de cita no encontrado' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Error al obtener tipo de cita' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/appointments/types/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/appointments/types/[id]
 * Actualiza un tipo de cita existente
 */
export async function PUT_ID(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permisos de administrador
    const adminResult = await verifyAdminOrManager(req);
    
    if (adminResult.error) {
      return adminResult.error;
    }
    
    const { tenant_id } = adminResult;
    const { id } = params;
    
    // Parsear cuerpo de la solicitud
    const typeData: AppointmentTypeRequest = await req.json();
    
    // Validar datos requeridos
    if (!typeData.name) {
      return NextResponse.json(
        { error: 'El nombre del tipo de cita es obligatorio' },
        { status: 400 }
      );
    }
    
    if (typeData.duration <= 0) {
      return NextResponse.json(
        { error: 'La duración debe ser mayor que cero' },
        { status: 400 }
      );
    }
    
    // Verificar si el tipo de cita existe y pertenece al tenant
    const { data: existingType, error: checkError } = await supabase
      .from('tenant_appointment_types')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .single();
    
    if (checkError || !existingType) {
      return NextResponse.json(
        { error: 'Tipo de cita no encontrado o sin permiso para editar' },
        { status: 404 }
      );
    }
    
    // Preparar datos para actualización
    const updateData = {
      ...typeData,
      updated_at: new Date().toISOString()
    };
    
    // Actualizar el tipo de cita
    const { data, error } = await supabase
      .from('tenant_appointment_types')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenant_id) // Verificar que pertenece al tenant
      .select();
    
    if (error) {
      console.error('Error al actualizar tipo de cita:', error);
      
      // Si es un error de unicidad (nombre ya existe)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ya existe un tipo de cita con ese nombre' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Error al actualizar tipo de cita' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data[0], { status: 200 });
  } catch (error) {
    console.error('Error en PUT /api/appointments/types/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/appointments/types/[id]
 * Elimina un tipo de cita
 */
export async function DELETE_ID(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permisos de administrador
    const adminResult = await verifyAdminOrManager(req);
    
    if (adminResult.error) {
      return adminResult.error;
    }
    
    const { tenant_id } = adminResult;
    const { id } = params;
    
    // Verificar si hay citas asociadas a este tipo
    const { count, error: countError } = await supabase
      .from('tenant_appointments')
      .select('*', { count: 'exact', head: true })
      .eq('appointment_type_id', id)
      .eq('tenant_id', tenant_id);
    
    if (countError) {
      console.error('Error al verificar citas existentes:', countError);
      return NextResponse.json(
        { error: 'Error al verificar citas existentes' },
        { status: 500 }
      );
    }
    
    // Si hay citas, no permitir eliminar
    if (count && count > 0) {
      return NextResponse.json(
        { 
          error: 'No se puede eliminar este tipo de cita porque tiene citas asociadas',
          count 
        },
        { status: 409 }
      );
    }
    
    // Eliminar el tipo de cita
    const { data, error } = await supabase
      .from('tenant_appointment_types')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenant_id) // Verificar que pertenece al tenant
      .select();
    
    if (error) {
      console.error('Error al eliminar tipo de cita:', error);
      return NextResponse.json(
        { error: 'Error al eliminar tipo de cita' },
        { status: 500 }
      );
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Tipo de cita no encontrado o sin permiso para eliminar' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: 'Tipo de cita eliminado con éxito' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en DELETE /api/appointments/types/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}