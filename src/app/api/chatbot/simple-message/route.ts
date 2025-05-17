/**
 * Endpoint simplificado para procesar mensajes del chatbot
 * Este endpoint implementa una solución directa para seguir el flujo correcto de conversación
 */
import { NextResponse } from 'next/server';
import { supabase } from '@/services/supabase/SupabaseClient';
import { v4 as uuidv4 } from 'uuid';

// Reemplazo de variables simplificado
function replaceVariables(text: string, variables: Record<string, string>) {
  if (!text) return '';
  
  return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    return variables[trimmedKey] || 'Usuario';
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('⭐ SOLICITUD DE CHAT SIMPLIFICADA ⭐', body);
    
    const {
      text,
      user_id = uuidv4(),
      session_id = uuidv4(),
      tenant_id,
      template_id = null
    } = body;
    
    // Comprobar si esta es una nueva conversación
    const isNewConversation = session_id.startsWith('new_') || !session_id.includes('-');
    console.log(`¿Es nueva conversación? ${isNewConversation ? 'SÍ' : 'NO'}`);
    
    // Cargar variables básicas
    const variables = {
      'nombre_usuario': 'Usuario',
      'user_name': 'Usuario',
      'company_name': 'PymeBot',
      'tenant_name': 'Empresa'
    };
    
    // Obtener la plantilla actual
    let template = null;
    let error = null;
    
    if (template_id) {
      const result = await supabase
        .from('chatbot_templates')
        .select('id, name, react_flow_json')
        .eq('id', template_id)
        .single();
      
      template = result.data;
      error = result.error;
    }
    
    if (error || !template) {
      console.error(`Error al obtener plantilla:`, error || 'Plantilla no encontrada');
      // Respuesta genérica si no hay plantilla
      return NextResponse.json({
        success: true,
        response: '👋 Hola, soy el asistente virtual. ¿En qué puedo ayudarte hoy?',
        messages: ['👋 Hola, soy el asistente virtual. ¿En qué puedo ayudarte hoy?'],
        is_multi_message: false
      });
    }
    
    // Extraer nodos de la plantilla
    const flowJson = template.react_flow_json;
    const nodes = flowJson?.nodes || [];
    const edges = flowJson?.edges || [];
    
    // Las respuestas que devolveremos
    let responses: string[] = [];
    
    // CASO 1: NUEVA CONVERSACIÓN
    if (isNewConversation) {
      console.log('Procesando nueva conversación: Buscando mensajes iniciales');
      
      // Buscar el nodo de bienvenida (welcome)
      const welcomeNode = nodes.find(n => 
        n.id === 'messageNode-welcome' || 
        n.id.toLowerCase().includes('welcome') || 
        (n.data?.label && (
          n.data.label.toLowerCase().includes('bienvenida') || 
          n.data.label.toLowerCase().includes('welcome')
        ))
      );
      
      // Si encontramos el nodo de bienvenida, usarlo
      if (welcomeNode && welcomeNode.data) {
        const welcomeMessage = welcomeNode.data.message || welcomeNode.data.messageText;
        
        if (welcomeMessage) {
          responses.push(replaceVariables(welcomeMessage, variables));
          console.log(`Usando mensaje de bienvenida: ${welcomeMessage}`);
        }
      }
      
      // Si no hay respuestas, usar un mensaje predeterminado
      if (responses.length === 0) {
        responses.push('👋 Hola, soy el asistente virtual de PymeBot. ¿En qué puedo ayudarte hoy?');
      }
    }
    // CASO 2: CONVERSACIÓN EXISTENTE - PROCESAMOS EL MENSAJE DEL USUARIO
    else {
      console.log(`Procesando mensaje en conversación existente: "${text}"`);
      
      // Extraer palabras clave del mensaje
      const messageWords = text.toLowerCase().split(/\s+/);
      
      if (messageWords.includes('hola') || messageWords.includes('saludos') || messageWords.includes('buenos') || messageWords.includes('buenas')) {
        // Si el usuario está saludando, responder con el nodo de bienvenida
        const welcomeNode = nodes.find(n => 
          n.id === 'messageNode-welcome' || 
          n.id.toLowerCase().includes('welcome') || 
          (n.data?.label && n.data.label.toLowerCase().includes('bienvenida'))
        );
        
        if (welcomeNode && welcomeNode.data) {
          const welcomeMessage = welcomeNode.data.message || welcomeNode.data.messageText;
          
          if (welcomeMessage) {
            responses.push(replaceVariables(welcomeMessage, variables));
          }
        }
      }
      
      if (responses.length === 0) {
        // Si no hay respuestas específicas, buscar cualquier nodo de entrada
        const inputNode = nodes.find(n => n.type === 'inputNode' || n.type === 'input');
        
        if (inputNode && inputNode.data) {
          const question = inputNode.data.question || inputNode.data.prompt;
          
          if (question) {
            responses.push(replaceVariables(question, variables));
          }
        }
      }
      
      // Si aún no hay respuestas, dar una respuesta genérica
      if (responses.length === 0) {
        responses.push('Disculpa, ¿podrías decirme en qué estás interesado o cómo puedo ayudarte?');
      }
    }
    
    console.log('⭐ RESPUESTAS SIMPLIFICADAS ⭐', responses);
    
    return NextResponse.json({
      success: true,
      response: responses.join('\n\n'),
      messages: responses,
      is_multi_message: responses.length > 1,
      metadata: {
        source: 'simplified_processing',
        isNewConversation
      }
    });
  } catch (error) {
    console.error('Error en procesamiento simplificado:', error);
    
    return NextResponse.json({
      success: false,
      error: true,
      response: 'Lo siento, ha ocurrido un error. Por favor, intenta de nuevo.',
      metadata: {
        source: 'error'
      }
    });
  }
}