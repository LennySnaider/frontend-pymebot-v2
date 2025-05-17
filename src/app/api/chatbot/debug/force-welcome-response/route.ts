/**
 * Endpoint de emergencia para forzar un mensaje de bienvenida
 */
import { NextResponse } from 'next/server';
import { supabase } from '@/services/supabase/SupabaseClient';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const templateId = url.searchParams.get('templateId') || 'default-lead-flow-id';
  
  try {
    // Obtener la plantilla
    const { data: template, error } = await supabase
      .from('chatbot_templates')
      .select('id, name, react_flow_json')
      .eq('id', templateId)
      .single();
    
    if (error || !template) {
      return NextResponse.json({ 
        status: 'error',
        message: error ? error.message : 'Plantilla no encontrada'
      });
    }

    const flowJson = template.react_flow_json;
    const nodes = flowJson?.nodes || [];
    
    // Buscar el nodo de bienvenida
    const welcomeNode = nodes.find(n => 
      n.id === 'messageNode-welcome' || 
      n.id.toLowerCase().includes('welcome') || 
      (n.data?.label && n.data.label.toLowerCase().includes('bienvenida'))
    );
    
    // Extraer el mensaje de bienvenida
    let welcomeMessage = '👋 Hola, soy el asistente virtual. ¿En qué puedo ayudarte hoy?';
    
    if (welcomeNode && welcomeNode.data) {
      welcomeMessage = welcomeNode.data.message || welcomeNode.data.messageText || welcomeMessage;
    }
    
    return NextResponse.json({
      status: 'success',
      welcomeMessage,
      template: {
        id: template.id,
        name: template.name
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      status: 'error',
      message: error instanceof Error ? error.message : 'Error desconocido' 
    });
  }
}