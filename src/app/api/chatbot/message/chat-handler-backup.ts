/**
 * Backup simple del chat handler para evitar errores de compilación
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DEFAULT_RESPONSES = [
  "¡Hola! Estoy aquí para ayudarte. ¿En qué puedo asistirte hoy?",
  "Bienvenido/a. Soy tu asistente virtual. ¿En qué puedo ayudarte?",
  "¡Hola! Gracias por escribir. ¿En qué te puedo ayudar?"
];

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

    // Registrar mensaje entrante
    await supabase
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

    // Generar respuesta simple
    const responseText = DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)];

    // Registrar respuesta
    await supabase
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

    // Actualizar sesión
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
        source: 'chat-handler-backup.ts'
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