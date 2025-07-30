import { NextRequest, NextResponse } from 'next/server';
import getConversationForLead from '@/server/actions/getConversationForLead';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('GET /api/chat/conversation/[id] - ID:', id);
    
    // Si es un ID de lead, extraer el ID del lead
    let leadId = id;
    if (id.startsWith('lead_')) {
      leadId = id.replace('lead_', '');
    }
    
    try {
      // Obtener datos reales
      const conversation = await getConversationForLead(leadId);
      
      return NextResponse.json({
        success: true,
        ...conversation
      });
    } catch (error) {
      console.log('Error obteniendo conversación, retornando datos de demostración');
      
      // Si hay error, retornar una conversación vacía
      return NextResponse.json({
        success: true,
        id: `lead_${leadId}`,
        conversation: []
      });
    }
  } catch (error) {
    console.error('Error en GET /api/chat/conversation/[id]:', error);
    return NextResponse.json(
      { error: 'Error al obtener conversación' },
      { status: 500 }
    );
  }
}