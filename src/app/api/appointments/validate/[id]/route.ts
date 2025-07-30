import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { SupabaseClient } from '@/services/supabase/SupabaseClient';

// Obtener detalles de la cita
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    if (!id) {
      return NextResponse.json(
        { error: 'ID de cita requerido' },
        { status: 400 }
      );
    }

    // Obtener la cita de la base de datos
    const supabase = SupabaseClient.getInstance();
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        id,
        date,
        time,
        location,
        notes,
        status,
        customers:customer_id (
          id,
          name,
          email,
          phone
        )
      `)
      .eq('id', id)
      .single();

    if (error || !appointment) {
      console.error('Error obteniendo cita:', error);
      return NextResponse.json(
        { error: 'Cita no encontrada' },
        { status: 404 }
      );
    }

    // Formatear los datos para la respuesta
    const formattedAppointment = {
      id: appointment.id,
      date: new Date(appointment.date).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: appointment.time,
      customerName: appointment.customers?.name || 'Cliente',
      location: appointment.location,
      status: appointment.status,
      notes: appointment.notes,
    };

    return NextResponse.json(formattedAppointment);
  } catch (error: any) {
    console.error('Error obteniendo cita:', error);
    return NextResponse.json(
      { error: error.message || 'Error obteniendo cita' },
      { status: 500 }
    );
  }
}

// Validar la cita (marcar como confirmada)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    if (!id) {
      return NextResponse.json(
        { error: 'ID de cita requerido' },
        { status: 400 }
      );
    }

    // Actualizar el estado de la cita a confirmada
    const supabase = SupabaseClient.getInstance();
    const { data, error } = await supabase
      .from('appointments')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error validando cita:', error);
      return NextResponse.json(
        { error: 'Error al validar la cita' },
        { status: 500 }
      );
    }

    // Si hay un lead_id asociado, actualizar también el estado del lead
    if (data.lead_id) {
      const { error: leadError } = await supabase
        .from('leads')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.lead_id);

      if (leadError) {
        console.error('Error actualizando lead:', leadError);
      }
    }

    return NextResponse.json({
      message: 'Cita validada exitosamente',
      appointmentId: id,
    });
  } catch (error: any) {
    console.error('Error validando cita:', error);
    return NextResponse.json(
      { error: error.message || 'Error validando cita' },
      { status: 500 }
    );
  }
}