/**
 * API route alternativa para actualizar stage con fallback
 * Si el lead no existe, lo crea con datos mínimos
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateLeadStageWithFallback } from '@/server/actions/leads/updateLeadStageWithFallback'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, newStage, leadData } = body;

    if (!leadId || !newStage) {
      return NextResponse.json(
        { error: 'Lead ID and new stage are required' },
        { status: 400 }
      );
    }

    console.log(`[API Fallback] Procesando: leadId=${leadId}, newStage=${newStage}`);

    const result = await updateLeadStageWithFallback(leadId, newStage, leadData);

    if (result.success) {
      console.log(`[API Fallback] Éxito:`, result);
      return NextResponse.json(result, { status: 200 });
    }
    
    console.error(`[API Fallback] Error:`, result.error);
    return NextResponse.json(
      { 
        success: false, 
        error: result.error 
      },
      { status: 500 }
    );
    
  } catch (error: any) {
    console.error('[API Fallback] Error general:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}