import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createServiceClient } from '@/services/supabase/server';

/**
 * PUT: Actualiza un tipo de cita existente
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const { id } = params;
    
    // Obtener los datos del body
    let appointmentType;
    try {
      const text = await req.text();
      console.log('PUT Body raw text:', text);
      
      if (!text) {
        return NextResponse.json(
          { error: 'El body de la petición está vacío' },
          { status: 400 }
        );
      }
      
      appointmentType = JSON.parse(text);
    } catch (parseError) {
      console.error('Error parsing body:', parseError);
      return NextResponse.json(
        { error: 'El body debe ser un JSON válido' },
        { status: 400 }
      );
    }
    
    // Preparar datos para actualizar, excluyendo campos de sistema
    const typeToUpdate = {
      name: appointmentType.name,
      description: appointmentType.description || null,
      duration: appointmentType.duration,
      color: appointmentType.color || null,
      buffer_time: appointmentType.buffer_time || 0,
      is_active: appointmentType.is_active !== false,
      booking_url_suffix: appointmentType.booking_url_suffix || null,
      max_daily_appointments: appointmentType.max_daily_appointments || null,
      requires_payment: appointmentType.requires_payment || false,
      payment_amount: appointmentType.payment_amount || null,
      updated_at: new Date().toISOString(),
    };
    
    // Crear cliente de Supabase con permisos de servicio
    const supabase = createServiceClient();
    
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
    console.error('Error en PUT /api/appointments/types/:id:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Elimina un tipo de cita
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const { id } = params;
    
    // Crear cliente de Supabase con permisos de servicio
    const supabase = createServiceClient();
    
    // Verificar si hay citas con este tipo
    const { data: appointments, error: countError } = await supabase
      .from('tenant_appointments')
      .select('id', { count: 'exact' })
      .eq('appointment_type_id', id)
      .eq('tenant_id', tenant_id)
      .limit(1);
    
    if (countError) {
      console.error('Error al verificar citas existentes:', countError);
      return NextResponse.json(
        { error: 'Error al verificar citas existentes' },
        { status: 500 }
      );
    }
    
    if (appointments && appointments.length > 0) {
      return NextResponse.json(
        { 
          error: 'No se puede eliminar este tipo de cita porque tiene citas asociadas',
          count: appointments.length
        },
        { status: 409 }
      );
    }
    
    // Eliminar el tipo de cita
    const { error } = await supabase
      .from('tenant_appointment_types')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenant_id);
    
    if (error) {
      console.error('Error al eliminar tipo de cita:', error);
      return NextResponse.json(
        { error: 'Error al eliminar tipo de cita' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Tipo de cita eliminado correctamente'
    });
  } catch (error) {
    console.error('Error en DELETE /api/appointments/types/:id:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}