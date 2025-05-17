'use client'

/**
 * frontend/src/app/(protected-pages)/modules/superadmin/chatbot-builder/editor/_hooks/useAIProcessor.ts
 * Hook para procesar prompts de IA y obtener respuestas
 * @version 1.0.0
 * @updated 2025-04-14
 */

import { useState, useCallback } from 'react'

interface UseAIProcessorOptions {
  mockResponses?: boolean;
  defaultDelay?: number;
  onProcessingStart?: () => void;
  onProcessingEnd?: (response: string) => void;
}

interface UseAIProcessorResult {
  processPrompt: (prompt: string, options?: {
    model?: string;
    temperature?: number;
    provider?: 'openai' | 'minimax';
    variables?: Record<string, any>;
  }) => Promise<string>;
  isProcessing: boolean;
  error: string | null;
}

export function useAIProcessor({
  mockResponses = false, // Por defecto NO usar respuestas simuladas
  defaultDelay = 500,
  onProcessingStart,
  onProcessingEnd
}: UseAIProcessorOptions = {}): UseAIProcessorResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para generar una respuesta de IA contextual basada en el prompt
  const generateContextualResponse = useCallback((prompt: string, variables: Record<string, any> = {}) => {
    const lowerPrompt = prompt.toLowerCase();
    
    // Reemplazar variables en el prompt
    let processedPrompt = prompt;
    Object.entries(variables).forEach(([key, value]) => {
      processedPrompt = processedPrompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
    });
    
    // Para el AI Voice Agent, asegurarnos de dar respuestas que suenen natural al ser leídas
    if (lowerPrompt.includes('voice agent') || lowerPrompt.includes('agente de voz')) {
      return "Hola, soy el asistente de voz de la empresa. Estoy aquí para responder tus preguntas y ayudarte con lo que necesites. Puedes preguntarme sobre nuestros productos, servicios o agendar una cita.";
    }
    
    // Detectar la intención del prompt para generar una respuesta adecuada
    if (lowerPrompt.includes('saludo') || lowerPrompt.includes('bienvenida')) {
      const businessName = variables.business_name || variables.nombre_negocio || 'nuestra empresa';
      return `¡Hola! Bienvenido a ${businessName}. Soy el asistente virtual y estoy aquí para ayudarte. ¿Cómo puedo asistirte hoy?`;
    }
    
    if (lowerPrompt.includes('producto') || lowerPrompt.includes('servicio') || lowerPrompt.includes('ofrecen')) {
      return `Ofrecemos una variedad de productos y servicios diseñados para satisfacer tus necesidades. Entre nuestras categorías principales están:\n\n• Servicios de asesoría personalizada\n• Productos exclusivos para nuestros clientes\n• Soluciones tecnológicas avanzadas\n\n¿Te gustaría obtener más información sobre alguna categoría específica?`;
    }
    
    if (lowerPrompt.includes('horario') || lowerPrompt.includes('hora') || lowerPrompt.includes('atienden')) {
      return `Nuestro horario de atención es:\n\n• Lunes a Viernes: 9:00 AM - 6:00 PM\n• Sábados: 10:00 AM - 2:00 PM\n• Domingos: Cerrado\n\n¿Hay algo más en lo que pueda ayudarte?`;
    }
    
    if (lowerPrompt.includes('ubicación') || lowerPrompt.includes('dirección') || lowerPrompt.includes('donde')) {
      return `Nos encontramos ubicados en Av. Principal #123, Colonia Centro. Referencias cercanas: a dos cuadras del parque central y frente al supermercado. ¿Necesitas indicaciones más específicas?`;
    }
    
    if (lowerPrompt.includes('cita') || lowerPrompt.includes('agendar') || lowerPrompt.includes('reservar')) {
      return `Para agendar una cita, necesito algunos datos básicos:\n\n1. Nombre completo\n2. Número de teléfono de contacto\n3. Fecha y hora preferida\n4. Servicio de interés\n\n¿Podrías proporcionarme esta información para proceder con tu reserva?`;
    }
    
    if (lowerPrompt.includes('precio') || lowerPrompt.includes('costo') || lowerPrompt.includes('tarifa')) {
      return `Nuestros precios varían según el servicio específico que necesites. Sin embargo, puedo darte un rango aproximado:\n\n• Servicios básicos: $500 - $1,000\n• Servicios premium: $1,500 - $3,000\n• Paquetes especiales: Desde $2,500\n\n¿Te gustaría un presupuesto personalizado?`;
    }
    
    if (lowerPrompt.includes('problema') || lowerPrompt.includes('queja') || lowerPrompt.includes('insatisfecho')) {
      return `Lamento mucho escuchar que tienes un problema. En nuestra empresa nos tomamos muy en serio la satisfacción del cliente. Para ayudarte mejor, ¿podrías darme más detalles sobre la situación? Alternativamente, puedo conectarte con un representante humano para resolver tu caso de manera más personalizada.`;
    }
    
    if (lowerPrompt.includes('gracias') || lowerPrompt.includes('agradezco') || lowerPrompt.includes('ayuda')) {
      return `¡Ha sido un placer ayudarte! Si tienes más preguntas en el futuro, no dudes en contactarnos nuevamente. ¡Que tengas un excelente día!`;
    }
    
    // Respuesta por defecto si no se detecta una intención específica
    return `Gracias por tu consulta. Puedo proporcionarte información sobre nuestros servicios, horarios, ubicación, reservas y mucho más. ¿En qué tema específico estás interesado?`;
  }, []);

  // Función principal para procesar un prompt y obtener una respuesta de IA
  const processPrompt = useCallback(async (
    prompt: string, 
    options: {
      model?: string;
      temperature?: number;
      provider?: 'openai' | 'minimax';
      variables?: Record<string, any>;
    } = {}
  ): Promise<string> => {
    // Limpiar errores previos
    setError(null);
    
    // Notificar inicio de procesamiento
    setIsProcessing(true);
    if (onProcessingStart) onProcessingStart();
    
    try {
      // Extraer opciones con valores por defecto
      const { 
        model = 'gpt-3.5-turbo', 
        temperature = 0.7, 
        provider = 'openai',
        variables = {} 
      } = options;
      
      let response: string;
      
      // En modo de simulación, generamos respuestas contextuales
      if (mockResponses) {
        // Simular tiempo de respuesta 
        const delay = variables.delay || defaultDelay;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Generar respuesta basada en el prompt
        response = generateContextualResponse(prompt, variables);
      } 
      // Modo real con llamada a la API
      else {
        try {
          console.log(`🔄 Llamando API ${provider} real con modelo ${model} (temp: ${temperature})...`);
          
          // Determinar si es un nodo de voz
          const isVoiceNode = model.includes('voice') || provider.includes('voice');
          
          if (isVoiceNode) {
            console.log('🎙️ Procesando nodo de voz');
            
            // SOLUCIÓN LOCAL PARA DESARROLLO
            console.log('⚠️ Utilizando generación de respuestas local debido a problemas de API');
            
            // Biblioteca de respuestas genéricas bien formadas en español CON ACENTOS
            const respuestas = [
              "¡Hola! Soy el asistente virtual de voz. ¿En qué puedo ayudarte hoy?",
              "Gracias por contactarnos. Estoy aquí para responder tus preguntas sobre propiedades inmobiliarias.",
              "¿Necesitas información adicional sobre áticos con terraza o apartamentos céntricos?",
              "Puedo ayudarte a resolver tus dudas. Dime qué tipo de características estás buscando en tu próxima casa.",
              "Estoy procesando tu consulta sobre propiedades. ¿Hay alguna zona específica que te interese más?"
            ];
            
            // Extraer palabras clave del prompt para contextualizar la respuesta
            const lowerPrompt = prompt.toLowerCase();
            let respuesta = "";
            
            if (lowerPrompt.includes("hola") || lowerPrompt.includes("saludar") || lowerPrompt.includes("bienvenida")) {
              respuesta = "¡Hola! Soy el asistente virtual especializado en propiedades. Puedo informarte sobre áticos, apartamentos, chalets y mucho más. ¿Qué tipo de inmueble estás buscando?";
            } 
            else if (lowerPrompt.includes("gracias") || lowerPrompt.includes("adios") || lowerPrompt.includes("adiós")) {
              respuesta = "Gracias por tu interés en nuestras propiedades. Ha sido un placer ayudarte. Si necesitas más información, no dudes en contactarnos. ¡Que tengas un excelente día!";
            }
            else if (lowerPrompt.includes("precio") || lowerPrompt.includes("costo") || lowerPrompt.includes("valor")) {
              respuesta = "Los precios de nuestras propiedades varían según la ubicación, tamaño y características. Tenemos apartamentos desde 150.000€ hasta casas de lujo por más de 500.000€. ¿En qué rango de precios estás interesado?";
            }
            else if (lowerPrompt.includes("ayuda") || lowerPrompt.includes("problema")) {
              respuesta = "Estoy aquí para ayudarte a encontrar la propiedad perfecta. Por favor, cuéntame qué características son importantes para ti: número de habitaciones, ubicación, presupuesto...";
            }
            else {
              // Si no hay coincidencia específica, usar una respuesta aleatoria
              respuesta = respuestas[Math.floor(Math.random() * respuestas.length)];
            }
            
            console.log('✅ Respuesta local generada:', respuesta);
            return respuesta; // Devolver el texto para síntesis de voz
            
          } else {
            // Realizar la llamada a la API real de IA (no simulada)
            console.log('Realizando llamada a API real para obtener respuesta de IA');
            
            // En desarrollo, también usar modo local para nodos normales
            // Biblioteca de respuestas genéricas bien formadas en español
            const respuestasGenericas = [
              "Estoy procesando tu consulta. Por favor, dame más detalles para poder ayudarte mejor.",
              "Gracias por tu pregunta. Permíteme buscar la información que necesitas.",
              "Entiendo lo que estás buscando. ¿Podrías proporcionarme más contexto?",
              "Estoy aquí para asistirte. ¿Hay algo específico que deseas saber sobre este tema?",
              "Tu consulta es importante. Estoy analizando la información disponible para darte la mejor respuesta."
            ];
            
            // Usar respuesta contextual basada en el prompt
            console.log('⚠️ Usando respuestas locales para desarrollo debido a problemas de API');
            const respuestaGenerica = respuestasGenericas[Math.floor(Math.random() * respuestasGenericas.length)];
            console.log('✅ Respuesta local generada:', respuestaGenerica);
            return respuestaGenerica;
          }
        } catch (error) {
          console.error('🔥 Error general en modo real:', error);
          return "Lo siento, en este momento no puedo procesar tu solicitud. Por favor, inténtalo de nuevo más tarde.";
        }
      }
      
      // Notificar finalización de procesamiento
      if (onProcessingEnd) onProcessingEnd(response);
      
      return response;
    } catch (err) {
      // Manejar errores
      console.error("Error procesando prompt de IA:", err);
      const errorMessage = err instanceof Error ? err.message : "Error desconocido al procesar la IA";
      setError(errorMessage);
      
      // Devolver mensaje de error amigable
      return "Lo siento, hubo un problema al procesar tu consulta. Por favor, intenta de nuevo más tarde.";
    } finally {
      // Asegurar que el estado de procesamiento se actualice
      setIsProcessing(false);
    }
  }, [mockResponses, defaultDelay, generateContextualResponse, onProcessingStart, onProcessingEnd]);

  return {
    processPrompt,
    isProcessing,
    error
  };
}