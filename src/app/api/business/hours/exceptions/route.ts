import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest, verifyAdminOrManager } from '../tenant-middleware';
// Just a comment to force rebuild
import { supabase } from '@/services/supabase/SupabaseClient';
import { BusinessHourExceptionRequest } from '../types';

/**
 * GET /api/business/hours/exceptions
 * Obtiene todas las excepciones de horarios para un tenant
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
    const location_id = searchParams.get('location_id');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    
    // Construir consulta
    let query = supabase
      .from('tenant_business_hours_exceptions')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('exception_date');
    
    // Filtrar por ubicación si se especifica
    if (location_id) {
      query = query.eq('location_id', location_id);
    }
    
    // Filtrar por rango de fechas si se especifica
    if (start_date) {
      query = query.gte('exception_date', start_date);
    }
    
    if (end_date) {
      query = query.lte('exception_date', end_date);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error al obtener excepciones de horarios:', error);
      return NextResponse.json(
        { error: 'Error al obtener excepciones de horarios' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data || [], { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/business/hours/exceptions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/business/hours/exceptions
 * Crea una nueva excepción de horario
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
    const exceptionData: BusinessHourExceptionRequest = await req.json();
    
    // Validar datos requeridos
    if (!exceptionData.exception_date) {
      return NextResponse.json(
        { error: 'La fecha de excepción es obligatoria' },
        { status: 400 }
      );
    }
    
    // Si no está cerrado, debe tener horarios de apertura y cierre
    if (!exceptionData.is_closed && 
        (!exceptionData.open_time || !exceptionData.close_time)) {
      return NextResponse.json(
        { error: 'Si el negocio no está cerrado, debe especificar horarios de apertura y cierre' },
        { status: 400 }
      );
    }
    
    // Añadir tenant_id al objeto de datos
    const dataWithTenant = {
      ...exceptionData,
      tenant_id
    };
    
    // Insertar la excepción
    const { data, error } = await supabase
      .from('tenant_business_hours_exceptions')
      .insert(dataWithTenant)
      .select();
    
    if (error) {
      console.error('Error al crear excepción de horario:', error);
      
      // Si es un error de unicidad (ya existe una excepción para esa fecha)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ya existe una excepción para esta fecha y ubicación' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Error al crear excepción de horario' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/business/hours/exceptions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/business/hours/exceptions
 * Elimina una excepción de horario
 */
export async function DELETE(req: NextRequest) {
  try {
    // Verificar permisos de administrador
    const adminResult = await verifyAdminOrManager(req);
    
    if (adminResult.error) {
      return adminResult.error;
    }
    
    const { tenant_id } = adminResult;
    
    // Obtener ID de la excepción a eliminar
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere ID de excepción' },
        { status: 400 }
      );
    }
    
    // Eliminar la excepción (verificando que pertenezca al tenant)
    const { data, error } = await supabase
      .from('tenant_business_hours_exceptions')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .select();
    
    if (error) {
      console.error('Error al eliminar excepción de horario:', error);
      return NextResponse.json(
        { error: 'Error al eliminar excepción de horario' },
        { status: 500 }
      );
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Excepción no encontrada o sin permiso para eliminar' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: 'Excepción eliminada con éxito' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en DELETE /api/business/hours/exceptions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}