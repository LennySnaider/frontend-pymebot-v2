/**
 * API endpoint para depurar problemas con el cierre de leads
 * Esta API intenta cerrar un lead directamente en la base de datos
 * para identificar restricciones o problemas que impiden el cambio a 'closed'
 * 
 * @version 1.0.0
 * @updated 2025-04-28
 */

import { NextRequest, NextResponse } from 'next/server'
import { testCloseLeadDirectly } from '@/server/actions/leads/debugLeadStage'

export async function POST(request: NextRequest) {
  try {
    // Extraer el lead ID del cuerpo de la solicitud
    const { leadId } = await request.json()

    // Validar la entrada
    if (!leadId) {
      console.error('Error en API debug-close: Lead ID faltante');
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      )
    }

    console.log(`API debug-close: Probando cierre directo de lead - leadId: ${leadId}`);

    // Llamar a la función de depuración
    const result = await testCloseLeadDirectly(leadId)

    // Responder con los resultados de depuración
    return NextResponse.json(
      result,
      { status: result.success ? 200 : 500 }
    )
  } catch (error: any) {
    console.error('Error en debug-close:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
        stack: error.stack
      },
      { status: 500 }
    )
  }
}