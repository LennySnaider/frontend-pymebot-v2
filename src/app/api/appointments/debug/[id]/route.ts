import { NextRequest, NextResponse } from 'next/server'
import { getAppointmentById } from '@/server/actions/appointments/getAppointmentById'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('DEBUG API - Obteniendo cita con ID:', String(params?.id || ''));
    
    const appointment = await getAppointmentById(String(params?.id || ''));
    
    console.log('DEBUG API - Cita obtenida:', JSON.stringify(appointment, null, 2));
    
    return NextResponse.json({
      success: true,
      data: appointment,
      debug: {
        hasLead: !!appointment?.lead,
        hasAgent: !!appointment?.agent,
        hasProperties: !!(appointment?.properties && appointment.properties.length > 0),
        propertyCount: appointment?.properties?.length || 0
      }
    });
  } catch (error) {
    console.error('DEBUG API - Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}