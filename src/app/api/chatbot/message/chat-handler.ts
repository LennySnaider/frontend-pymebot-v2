/**
 * frontend/src/app/api/chatbot/message/chat-handler.ts
 * Manejador principal para procesar mensajes de chatbot
 * Versión simplificada para resolver errores de compilación
 * @version 1.0.0
 * @updated 2025-06-27
 */

import { createClient } from '@supabase/supabase-js';

// Inicialización de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Respuestas por defecto
const DEFAULT_RESPONSES = [
  "¡Hola! Estoy aquí para ayudarte. ¿En qué puedo asistirte hoy?",
  "Bienvenido/a. Soy tu asistente virtual. ¿En qué puedo ayudarte?",
  "¡Hola! Gracias por escribir. ¿En qué te puedo ayudar?",
  "Hola, soy tu asistente virtual. ¿Cómo te puedo ayudar?"
];

/**
 * Función principal para manejar mensajes de chat
 */
export async function handleChatMessage(
  message: string,
  userId: string,
  sessionId: string,
  tenantId: string,
  templateId?: string,
  botId?: string
) {
  try {
    console.log('⭐ CHAT HANDLER ⭐ Procesando mensaje:', message.substring(0, 50));

    // Registrar mensaje entrante en la base de datos
    const { error: messageError } = await supabase
      .from('conversation_messages')
      .insert({
        session_id: sessionId,
        content: message,
        is_from_user: true,
        content_type: 'text',
        metadata: {
          user_id: userId,
          tenant_id: tenantId,
          bot_id: botId,
          template_id: templateId
        }
      });

    if (messageError) {
      console.error('Error al registrar mensaje:', messageError);
    }

    // Generar respuesta (versión simplificada)
    let responseText = DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)];

    // Intentar cargar template si existe
    if (templateId) {
      try {
        const { data: templateData } = await supabase
          .from('chatbot_templates')
          .select('id, name, react_flow_json')
          .eq('id', templateId)
          .single();

        if (templateData && templateData.name) {
          responseText = `[${templateData.name}] ${responseText}`;
        }
      } catch (templateError) {
        console.log('Template no encontrado, usando respuesta por defecto');
      }
    }

    // Registrar respuesta saliente
    const { error: responseError } = await supabase
      .from('conversation_messages')
      .insert({
        session_id: sessionId,
        content: responseText,
        is_from_user: false,
        content_type: 'text',
        metadata: {
          user_id: userId,
          tenant_id: tenantId,
          bot_id: botId,
          template_id: templateId
        }
      });

    if (responseError) {
      console.error('Error al registrar respuesta:', responseError);
    }

    // Actualizar el timestamp de la sesión
    await supabase
      .from('conversation_sessions')
      .update({
        last_interaction_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    return {
      response: responseText,
      metadata: {
        processedAt: new Date().toISOString(),
        source: 'chat-handler.ts'
      }
    };
  } catch (error) {
    console.error('Error en procesamiento de mensaje:', error);
    return {
      response: "Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta nuevamente.",
      metadata: { error: true }
    };
  }
}

// Alias para compatibilidad con imports existentes
export const processChatMessage = handleChatMessage;