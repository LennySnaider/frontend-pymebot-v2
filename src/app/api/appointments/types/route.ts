import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase } from '@/services/supabase/SupabaseClient';

/**
 * GET: Obtiene los tipos de citas configurados para el tenant
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
    
    // Obtener los tipos de cita para el tenant
    const { data: appointmentTypes, error } = await supabase
      .from('tenant_appointment_types')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      console.error('Error al obtener tipos de cita:', error);
      return NextResponse.json(
        { error: 'Error al obtener tipos de cita' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(appointmentTypes || []);
  } catch (error) {
    console.error('Error en GET /api/appointments/types:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST: Crea un nuevo tipo de cita
 */
export async function POST(req: NextRequest) {
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
    const appointmentType = await req.json();
    
    // Validar campos obligatorios
    if (!appointmentType.name || !appointmentType.duration_minutes) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: name, duration_minutes' },
        { status: 400 }
      );
    }
    
    // Agregar tenant_id al objeto
    const typeWithTenant = {
      ...appointmentType,
      tenant_id,
      is_active: appointmentType.is_active !== false, // Activo por defecto
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // Insertar nuevo tipo de cita
    const { data, error } = await supabase
      .from('tenant_appointment_types')
      .insert(typeWithTenant)
      .select()
      .single();
    
    if (error) {
      console.error('Error al crear tipo de cita:', error);
      return NextResponse.json(
        { error: 'Error al crear tipo de cita' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Tipo de cita creado correctamente',
      appointment_type: data
    });
  } catch (error) {
    console.error('Error en POST /api/appointments/types:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Actualiza un tipo de cita existente
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
    const { id, ...appointmentType } = await req.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Falta el ID del tipo de cita' },
        { status: 400 }
      );
    }
    
    // Actualizar tipo de cita con timestamp
    const typeToUpdate = {
      ...appointmentType,
      updated_at: new Date().toISOString(),
    };
    
    // Actualizar el tipo de cita
    const { data, error } = await supabase
      .from('tenant_appointment_types')
      .update(typeToUpdate)
      .eq('id', id)
      .eq('tenant_id', tenant_id) // Seguridad adicional
      .select()
      .single();
    
    if (error) {
      console.error('Error al actualizar tipo de cita:', error);
      return NextResponse.json(
        { error: 'Error al actualizar tipo de cita' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Tipo de cita actualizado correctamente',
      appointment_type: data
    });
  } catch (error) {
    console.error('Error en PUT /api/appointments/types:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Elimina un tipo de cita (o lo marca como inactivo)
 */
export async function DELETE(req: NextRequest) {
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
    
    // Obtener el ID del query param
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Falta el ID del tipo de cita' },
        { status: 400 }
      );
    }
    
    // Verificar si hay citas con este tipo
    const { count, error: countError } = await supabase
      .from('tenant_appointments')
      .select('id', { count: 'exact', head: true })
      .eq('appointment_type_id', id)
      .eq('tenant_id', tenant_id);
    
    if (countError) {
      console.error('Error al verificar citas existentes:', countError);
      return NextResponse.json(
        { error: 'Error al verificar citas existentes' },
        { status: 500 }
      );
    }
    
    // Si hay citas, marcar como inactivo en lugar de eliminar
    if (count && count > 0) {
      const { error: updateError } = await supabase
        .from('tenant_appointment_types')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', tenant_id);
      
      if (updateError) {
        console.error('Error al desactivar tipo de cita:', updateError);
        return NextResponse.json(
          { error: 'Error al desactivar tipo de cita' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Tipo de cita desactivado correctamente (no eliminado debido a citas existentes)',
      });
    }
    
    // Si no hay citas, eliminar el tipo
    const { error: deleteError } = await supabase
      .from('tenant_appointment_types')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenant_id);
    
    if (deleteError) {
      console.error('Error al eliminar tipo de cita:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar tipo de cita' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Tipo de cita eliminado correctamente',
    });
  } catch (error) {
    console.error('Error en DELETE /api/appointments/types:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}