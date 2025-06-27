/**
 * frontend/src/app/api/chatbot/message/chat-handler.ts
 * Manejador para procesar solicitudes del chatbot y generar respuestas
 * @version 1.2.0
 * @updated 2025-05-11
 */

import { createClient } from '@supabase/supabase-js'
import { findInitialMessage, extractWelcomeMessage } from './message-extractor'

// Inicialización de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Configuración base para generación de respuestas
const DEFAULT_RESPONSES = [
  "¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?",
  "Claro, puedo ayudarte con esa consulta. Dime más detalles para brindarte la mejor información.",
  "Entiendo lo que necesitas. Vamos a resolver eso juntos.",
  "Gracias por tu mensaje. Estoy procesando tu solicitud.",
  "Estoy aquí para asistirte. ¿Qué más te gustaría saber?"
]

/**
 * Procesa un mensaje del usuario y genera una respuesta adecuada
 * @param text Texto del mensaje
 * @param userId ID del usuario
 * @param sessionId ID de la sesión
 * @param tenantId ID del tenant
 * @param botId ID del bot
 * @param templateId ID de la plantilla de chat (opcional)
 * @returns Objeto con la respuesta generada
 */
export async function processChatMessage(
  text: string,
  userId: string,
  sessionId: string,
  tenantId: string,
  botId: string,
  templateId?: string
): Promise<{ response: string, metadata?: any }> {
  try {
    console.log(`Procesando mensaje en el servidor: ${text}`)
    console.log(`Datos: userId=${userId}, sessionId=${sessionId}, tenantId=${tenantId}, botId=${botId}`)
    
    // Registrar el mensaje entrante en la base de datos
    const { error: messageError } = await supabase
      .from('conversation_messages')
      .insert({
        session_id: sessionId,
        content: text,
        is_from_user: true,
        content_type: 'text',
        metadata: {
          user_id: userId,
          tenant_id: tenantId,
          bot_id: botId,
          template_id: templateId
        }
      })
    
    if (messageError) {
      console.error('Error al registrar mensaje:', messageError)
    }
    
    // Si se proporciona un template_id válido, intentar buscar la plantilla
    let templateInfo = null
    if (templateId && templateId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      try {
        const { data: template, error: templateError } = await supabase
          .from('chatbot_templates')
          .select('name, description')
          .eq('id', templateId)
          .single()
        
        if (!templateError && template) {
          templateInfo = template
          console.log(`Plantilla encontrada: ${template.name}`)
        }
      } catch (error) {
        console.error('Error al obtener información de plantilla:', error)
      }
    }
    
    // Incrementar el uso del servicio en tenant_usage_quotas
    // Esto debería usar la función RPC increment_usage de Supabase
    try {
      // Asegurarse de que tenantId sea un UUID válido
      if (tenantId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const today = new Date().toISOString().split('T')[0]
        const { error: rpcError } = await supabase.rpc('increment_usage', {
          p_tenant_id: tenantId,
          p_date: today,
          p_api_calls_increment: 1,
          p_tokens_increment: text.length // Estimación simple de tokens usados
        })
        
        if (rpcError) {
          console.warn('Error al incrementar uso:', rpcError)
        } else {
          console.log(`Uso incrementado para tenant ${tenantId}`)
        }
      }
    } catch (error) {
      console.error('Error general al incrementar uso:', error)
    }
    
    // Intentar cargar y ejecutar dinámicamente el flujo desde la base de datos
    let responseText = '';
    let useFlowExecutor = false;

    try {
      // Primero intentamos cargar el flujo completo de la base de datos si hay un templateId
      if (templateId) {
        console.log(`⭐ DIAGNÓSTICO CHATBOT ⭐ Intentando cargar la plantilla con ID: ${templateId} de la base de datos`);

        try {
          // Buscar primero la plantilla directamente
          const { data: templateData, error: templateError } = await supabase
            .from('chatbot_templates')
            .select('id, name, react_flow_json')
            .eq('id', templateId)
            .single();

          if (templateError) {
            console.error('⭐ ERROR DE PLANTILLA ⭐ Error al obtener la plantilla:', templateError);
            throw new Error(`No se pudo cargar la plantilla: ${templateError.message}`);
          }

          if (!templateData || !templateData.react_flow_json) {
            console.error('⭐ ERROR DE PLANTILLA ⭐ Plantilla no encontrada o sin datos de flujo');
            throw new Error('La plantilla existe pero no tiene datos de flujo');
          }

          console.log(`⭐ PLANTILLA ENCONTRADA ⭐ Nombre: ${templateData.name}, ID: ${templateData.id}`);

          // Tenemos el flujo, utilizar el extractor de mensajes mejorado
          let flowJson = templateData.react_flow_json;

          // Verificar la estructura del flujo JSON y convertirla si es necesario
          if (typeof flowJson === 'string') {
            try {
              flowJson = JSON.parse(flowJson);
              console.log('⭐ FLUJO PARSEADO ⭐ Estructura convertida de string a objeto');
            } catch (parseError) {
              console.error('⭐ ERROR DE PARSEO ⭐ No se pudo parsear react_flow_json:', parseError);
            }
          }

          if (!flowJson || typeof flowJson !== 'object') {
            console.error('⭐ ERROR DE FLUJO ⭐ react_flow_json no es un objeto válido:', typeof flowJson);
          } else {
            // Utilizar el extractor avanzado de mensajes
            console.log('⭐ UTILIZANDO EXTRACTOR AVANZADO ⭐ Analizando estructura del flujo...');

            const { message, diagnostics } = findInitialMessage(flowJson);

            // Mostrar diagnóstico detallado
            console.log('⭐ DIAGNÓSTICO EXTRACTOR ⭐', JSON.stringify(diagnostics, null, 2));

            if (message) {
              responseText = message;
              console.log(`⭐ MENSAJE EXTRAÍDO CON ÉXITO ⭐ "${responseText.substring(0, 50)}..."`);
              console.log(`⭐ FUENTE DEL MENSAJE ⭐ ${diagnostics.messageSource}`);
              useFlowExecutor = true;
            } else {
              console.error('⭐ NO SE ENCONTRÓ MENSAJE ⭐ Error:', diagnostics.error);

              // Verificar si hay nodos en general
              if (flowJson.nodes && Array.isArray(flowJson.nodes)) {
                console.log(`⭐ NODOS EN EL FLUJO ⭐ Total: ${flowJson.nodes.length}`);
                // Mostrar los primeros 5 nodos para depuración
                const firstNodes = flowJson.nodes.slice(0, 5);
                console.log('⭐ EJEMPLO DE NODOS ⭐', firstNodes.map(n => ({
                  id: n.id,
                  type: n.type || 'sin tipo',
                  dataKeys: n.data ? Object.keys(n.data) : []
                })));
              } else {
                console.error('⭐ ESTRUCTURA INVÁLIDA ⭐ No hay nodos o no es un array');
              }
            }
          }
        } catch (dbError) {
          console.error('⭐ ERROR DE BASE DE DATOS ⭐ Error al cargar la plantilla:', dbError);
        }

        // Si no pudimos cargar desde la BD, verificamos si es el flujo básico lead y usamos el archivo local
        if (!useFlowExecutor) {
          console.log('⭐ INTENTO FALLBACK ⭐ Verificando si es un flujo básico lead');

          const isBasicFlowId = templateId === 'flujo-basico-lead' ||
            (templateId && ((typeof templateId === 'string') &&
              templateId.toLowerCase().includes('basico') &&
              templateId.toLowerCase().includes('lead')));

          // Intento dinámico usando nuestro extractor avanzado
          console.log('⭐ USANDO EXTRACTOR AVANZADO ⭐ Buscando mensaje de bienvenida para plantilla');

          // Extraer mensaje de bienvenida dinámicamente
          const welcomeResult = await extractWelcomeMessage(templateId, tenantId, supabase);

          if (welcomeResult.message) {
            // ¡Éxito! Usamos el mensaje extraído de la plantilla
            responseText = welcomeResult.message;
            console.log(`⭐ MENSAJE EXTRAÍDO CON ÉXITO ⭐ "${responseText.substring(0, 50)}..."`);
            console.log(`⭐ FUENTE DEL MENSAJE ⭐ ${welcomeResult.diagnostics.source}, ${welcomeResult.diagnostics.messageSource}`);
            useFlowExecutor = true;
          } else {
            // Fallbacks para cuando no podemos extraer un mensaje
            if (isBasicFlowId) {
              console.log('⭐ FALLBACK PLANTILLA BÁSICA LEAD ⭐ Usando mensaje genérico');

              // Usar una respuesta genérica sin marca específica
              const genericResponses = [
                "👋 Hola, soy un asistente virtual. ¿En qué puedo ayudarte hoy?",
                "¡Hola! Estoy aquí para ayudarte con cualquier duda o consulta que tengas.",
                "Bienvenido/a. Soy tu asistente virtual. ¿En qué puedo asistirte hoy?"
              ];

              responseText = genericResponses[Math.floor(Math.random() * genericResponses.length)];
              useFlowExecutor = true;
            } else {
              // Seguimos intentando con búsqueda alternativa
              try {
                console.log('⭐ BÚSQUEDA ALTERNATIVA ⭐ Intentando encontrar plantilla por nombre similar');
                const { data: similarTemplates } = await supabase
                  .from('chatbot_templates')
                  .select('id, name, react_flow_json')
                  .ilike('name', '%basico%')
                  .ilike('name', '%lead%')
                  .limit(1);

                if (similarTemplates && similarTemplates.length > 0) {
                  console.log(`⭐ PLANTILLA SIMILAR ENCONTRADA ⭐ ${similarTemplates[0].name}`);

                  // Extraer mensaje de esta plantilla
                  const similarResult = await extractWelcomeMessage(similarTemplates[0].id, tenantId, supabase);
                  if (similarResult.message) {
                    responseText = similarResult.message;
                    console.log(`⭐ MENSAJE DE PLANTILLA SIMILAR ⭐ "${responseText.substring(0, 50)}..."`);
                  } else {
                    // Si falló la extracción, usar un mensaje predeterminado genérico
                    responseText = "¡Hola! Estoy aquí para ayudarte con tus consultas. ¿En qué puedo asistirte hoy?";
                  }

                  useFlowExecutor = true;
                }
              } catch (searchError) {
                console.error('⭐ ERROR EN BÚSQUEDA ALTERNATIVA ⭐', searchError);
              }
            }
          }
        }
      }
    } catch (flowError) {
      console.error('⭐ ERROR GENERAL ⭐ Error al procesar flujo:', flowError);
    }

    // Si no pudimos cargar/ejecutar el flujo, usamos la respuesta por defecto
    if (!useFlowExecutor) {
      console.log('No se pudo cargar ningún flujo, usando respuesta por defecto');
      responseText = DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)];

      // Personalizar la respuesta si tenemos información de la plantilla
      if (templateInfo) {
        responseText = `[${templateInfo.name}] ${responseText}`;
      }
    }
    
    // Registrar la respuesta saliente
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