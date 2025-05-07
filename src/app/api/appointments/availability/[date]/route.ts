import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '../../../business/hours/tenant-middleware';
import { generateAvailability } from '../availability-generator';

/**
 * GET /api/appointments/availability/[date]
 * Obtiene los slots de disponibilidad para una fecha específica por parámetro
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    // Verificar tenant
    const tenantResult = await getTenantFromRequest(req);
    
    if (tenantResult.error) {
      return tenantResult.error;
    }
    
    const { tenant_id } = tenantResult;
    
    // Obtener parámetros
    const { date } = params;
    
    // Obtener parámetros de consulta
    const searchParams = req.nextUrl.searchParams;
    const appointment_type_id = searchParams.get('appointment_type_id');
    const location_id = searchParams.get('location_id');
    const agent_id = searchParams.get('agent_id');
    
    // Validar formato de fecha (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido, debe ser YYYY-MM-DD' },
        { status: 400 }
      );
    }
    
    // Generar disponibilidad
    const availabilityData = await generateAvailability({
      tenant_id,
      date,
      appointment_type_id: appointment_type_id || undefined,
      location_id: location_id || undefined,
      agent_id: agent_id || undefined
    });
    
    return NextResponse.json(availabilityData, { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/appointments/availability/[date]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}