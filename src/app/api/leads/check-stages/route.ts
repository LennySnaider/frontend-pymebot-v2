import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/services/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const { leadIds } = await request.json();
        
        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            return NextResponse.json({ updates: [] });
        }
        
        const supabase = createServerClient();
        
        // Obtener las etapas actuales de los leads
        const { data: leads, error } = await supabase
            .from('leads')
            .select('id, stage')
            .in('id', leadIds);
        
        if (error) {
            console.error('Error al obtener etapas de leads:', error);
            return NextResponse.json({ error: 'Error al verificar etapas' }, { status: 500 });
        }
        
        // Mapeo de etapas en español a inglés
        const stageMapping: Record<string, string> = {
            'nuevos': 'new',
            'prospectando': 'prospecting',
            'calificacion': 'qualification',
            'oportunidad': 'opportunity',
            'confirmado': 'confirmed',
            'cerrado': 'closed'
        };
        
        // Encontrar discrepancias
        const updates = leads.map(lead => {
            const expectedStage = stageMapping[lead.stage] || lead.stage;
            return {
                leadId: lead.id,
                currentStage: lead.stage,
                expectedStage
            };
        }).filter(update => update.currentStage !== update.expectedStage);
        
        return NextResponse.json({ updates });
    } catch (error) {
        console.error('Error en check-stages:', error);
        return NextResponse.json(
            { error: 'Error al procesar solicitud' },
            { status: 500 }
        );
    }
}