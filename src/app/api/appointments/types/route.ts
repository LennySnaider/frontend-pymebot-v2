import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createServiceClient } from '@/services/supabase/server';

/**
 * GET: Obtiene los tipos de citas configurados para el tenant
 */
export async function GET(req: NextRequest) {
  try {
    console.log('GET /api/appointments/types - Iniciando...');
    
    // Obtener la sesión usando NextAuth
    const session = await auth();
    console.log('Session:', session ? 'Existe' : 'No existe');
    
    if (!session) {
      console.log('Sin sesión, devolviendo 401');
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    const tenant_id = session.user.tenant_id;
    console.log('Tenant ID:', tenant_id);
    
    if (!tenant_id) {
      console.log('Sin tenant_id, devolviendo 403');
      return NextResponse.json(
        { error: 'Usuario no asociado a ningún tenant' },
        { status: 403 }
      );
    }
    
    // Crear cliente de Supabase con permisos de servicio
    const supabase = createServiceClient();
    
    // Obtener los tipos de cita para el tenant, incluyendo inactivos
    console.log('Consultando tipos de cita para tenant:', tenant_id);
    const { data: appointmentTypes, error } = await supabase
      .from('tenant_appointment_types')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('name');
    
    console.log('Resultado query - data:', appointmentTypes);
    console.log('Resultado query - error:', error);
    
    if (error) {
      console.error('Error al obtener tipos de cita:', error);
      return NextResponse.json(
        { error: 'Error al obtener tipos de cita' },
        { status: 500 }
      );
    }
    
    console.log('Devolviendo datos:', appointmentTypes || []);
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
    
    // Obtener los datos del body - usar req.json() directamente
    let appointmentType;
    try {
      appointmentType = await req.json();
      console.log('Parsed appointment type:', appointmentType);
    } catch (parseError) {
      console.error('Error parsing JSON body:', parseError);
      return NextResponse.json(
        { error: 'El body debe ser un JSON válido' },
        { status: 400 }
      );
    }
    
    // Validar campos obligatorios - verificar que coincidan con el frontend
    if (!appointmentType.name || !appointmentType.duration) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: name, duration' },
        { status: 400 }
      );
    }
    
    // Agregar tenant_id al objeto y asegurar que los campos coincidan con la BD
    const typeWithTenant = {
      name: appointmentType.name,
      description: appointmentType.description || null,
      duration: appointmentType.duration, // El frontend envía "duration", no "duration_minutes"
      color: appointmentType.color || null,
      buffer_time: appointmentType.buffer_time || 0,
      is_active: appointmentType.is_active !== false, // Activo por defecto
      booking_url_suffix: appointmentType.booking_url_suffix || null,
      max_daily_appointments: appointmentType.max_daily_appointments || null,
      requires_payment: appointmentType.requires_payment || false,
      payment_amount: appointmentType.payment_amount || null,
      tenant_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // Crear cliente de Supabase con permisos de servicio
    const supabase = createServiceClient();
    
    // Insertar nuevo tipo de cita
    const { data, error } = await supabase
      .from('tenant_appointment_types')
      .insert(typeWithTenant)
      .select()
      .single();
    
    if (error) {
      console.error('Error al crear tipo de cita:', error);
      
      // Verificar si es un error de duplicado
      if (error.code === '23505' && error.message?.includes('tenant_appointment_types_tenant_id_name_key')) {
        return NextResponse.json(
          { error: 'Ya existe un tipo de cita con este nombre' },
          { status: 409 }
        );
      }
      
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