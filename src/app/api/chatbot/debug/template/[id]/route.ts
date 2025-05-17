/**
 * v2-frontend-pymebot/src/app/api/chatbot/debug/template/[id]/route.ts
 * Endpoint de depuración para descargar plantillas JSON específicas
 * 
 * IMPORTANTE: Este endpoint es solo para depuración y debe desactivarse en producción
 * 
 * @version 1.0.0
 * @updated 2025-05-14
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicialización de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const templateId = params.id;
    
    if (!templateId) {
      return NextResponse.json({ error: 'El parámetro id es requerido' }, { status: 400 });
    }
    
    // Obtener la plantilla
    const { data: template, error } = await supabase
      .from('chatbot_templates')
      .select('*')
      .eq('id', templateId)
      .single();
    
    if (error) {
      return NextResponse.json({ error: `Error al obtener la plantilla: ${error.message}` }, { status: 500 });
    }
    
    if (!template) {
      return NextResponse.json({ error: 'No se encontró la plantilla' }, { status: 404 });
    }
    
    // Devolver la plantilla completa como un archivo JSON para descarga
    const response = NextResponse.json(template);
    
    // Configurar headers para descarga
    response.headers.set('Content-Disposition', `attachment; filename="${template.name || 'template'}_${new Date().toISOString().split('T')[0]}.json"`);
    
    return response;
  } catch (error) {
    console.error('Error en endpoint de depuración:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}