import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
// import { cookies, headers } from 'next/headers'; // No lo usamos por ahora
import { formatError } from '@/utils/api';

/**
 * Proxy para comunicación con el backend del chatbot
 * Este endpoint recibe mensajes del frontend y los envía al backend
 */
export async function POST(request: NextRequest) {
  const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3090';
  // Usando el único endpoint de texto como acordamos
  const CHATBOT_ENDPOINT = `${BACKEND_URL}/api/text/chatbot`;
  
  try {
    // Obtener datos del cuerpo de la petición
    const requestData = await request.json();
    
    // Usar tenant_id de la petición o el valor por defecto de las variables de entorno
    // No usamos cookies() porque requiere un enfoque asíncrono
    if (!requestData.tenant_id) {
      requestData.tenant_id = process.env.DEFAULT_TENANT_ID || 'afa60b0a-3046-4607-9c48-266af6e1d322';
      console.log(`Usando tenant_id por defecto: ${requestData.tenant_id}`);
    }
    
    // Verificar datos requeridos
    if (!requestData.text) {
      return NextResponse.json(
        { error: 'Datos incompletos', message: 'El campo text es requerido' }, 
        { status: 400 }
      );
    }
    
    // Si no hay tenant_id, usar uno por defecto para pruebas (esto debería cambiarse en producción)
    if (!requestData.tenant_id) {
      console.warn('No se pudo obtener el tenant_id del usuario');
      requestData.tenant_id = process.env.DEFAULT_TENANT_ID || 'afa60b0a-3046-4607-9c48-266af6e1d322';
    }
    
    // Si no hay user_id, generar uno
    if (!requestData.user_id) {
      requestData.user_id = `user-${Math.random().toString(36).substring(2, 11)}`;
    }
    
    // Agregar parámetros necesarios para el endpoint /api/text/chat
    // Usar modo auto-flow para garantizar mensaje de bienvenida y flujo automático
    requestData.mode = 'auto-flow';
    requestData.force_welcome = requestData.text?.toLowerCase() === 'hola' || !requestData.session_id;
    
    // Añadir flag de primer mensaje si es necesario
    if (!requestData.session_id || requestData.text?.toLowerCase() === 'hola') {
      requestData.is_first_message = true;
    }
    
    // Registrar petición para diagnósticos
    console.log(`Proxy chatbot: Enviando mensaje a backend para tenant ${requestData.tenant_id}, user ${requestData.user_id}`);
    console.log('Datos completos enviados al backend:', JSON.stringify(requestData, null, 2));
    
    // Configurar timeout extendido para evitar problemas
    const axiosConfig = {
      timeout: 5000, // 5 segundos para detectar rápidamente si el backend no responde
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    try {
      console.log(`Enviando petición al backend: ${CHATBOT_ENDPOINT}`);
      console.log('Configuración axios:', axiosConfig);
      
      // Intentar enviar petición al backend
      const backendResponse = await axios.post(CHATBOT_ENDPOINT, requestData, axiosConfig);
      
      console.log('Respuesta recibida del backend, status:', backendResponse.status);
      
      // La respuesta del backend ya viene en el formato correcto desde /api/text/chatbot
      // Simplemente la pasamos tal cual al frontend
      const responseData = backendResponse.data;
      
      // Log para debugging
      console.log('=== PROXY DEBUG ===');
      console.log('Status del backend:', backendResponse.status);
      console.log('Respuesta del backend completa:', JSON.stringify(responseData, null, 2));
      console.log('Tipo de responseData.data:', typeof responseData.data);
      console.log('Es array responseData.data?:', Array.isArray(responseData.data));
      console.log('==================');
      
      // Verificar y normalizar el formato de respuesta
      let normalizedResponse;
      
      // Manejar respuesta con múltiples mensajes (array de respuestas)
      if (responseData.success && responseData.data && Array.isArray(responseData.data)) {
        console.log('DEBUG: Respuesta con array de mensajes detectada:', responseData.data.length);
        
        // Concatenar todos los mensajes
        const allMessages = responseData.data.map(item => item.body || item.message || '').join('\n\n');
        
        // Recopilar todos los botones de todos los mensajes
        const allButtons = [];
        responseData.data.forEach(item => {
          if (item.buttons && Array.isArray(item.buttons)) {
            allButtons.push(...item.buttons);
          }
        });
        
        console.log('DEBUG: Mensajes concatenados:', allMessages.substring(0, 100) + '...');
        console.log('DEBUG: Botones recopilados:', allButtons);
        
        normalizedResponse = {
          success: true,
          response: allMessages,
          metadata: responseData.metadata || {},
          tokensUsed: responseData.metadata?.tokensUsed || 0,
          buttons: allButtons
        };
      }
      // Formato nuevo del backend: { success: true, data: { message: "...", metadata: {...} } }
      else if (responseData.success && responseData.data) {
        normalizedResponse = {
          success: true,
          response: responseData.data.message || responseData.data.response || '',
          metadata: responseData.data.metadata || {},
          tokensUsed: responseData.data.metadata?.tokensUsed || 0,
          // Incluir botones si existen
          buttons: responseData.data.metadata?.buttons || responseData.data.buttons || []
        };
      } else if (responseData.response) {
        // Formato antiguo ya tiene 'response'
        normalizedResponse = {
          ...responseData,
          buttons: responseData.buttons || responseData.metadata?.buttons || []
        };
      } else {
        // Fallback si no reconocemos el formato
        console.error('ADVERTENCIA: Formato de respuesta no reconocido:', responseData);
        normalizedResponse = {
          success: responseData.success || false,
          response: responseData.message || 'Sin respuesta del servidor',
          metadata: responseData.metadata || {},
          buttons: []
        };
      }
      
      // Si la respuesta es exitosa, enviarla al frontend
      console.log('Enviando respuesta normalizada al frontend...');
      return NextResponse.json(normalizedResponse);
    } catch (backendError: any) {
      console.error('Error comunicándose con el backend:', backendError.message);
      
      // Modo fallback: responder con un mensaje simple para continuar operando
      console.log('Modo fallback activado - respondiendo con mensaje temporal');
      
      return NextResponse.json({
        success: true,
        response: 'Hola! Actualmente estoy en modo de prueba. ¿En qué puedo ayudarte?',
        metadata: {
          buttons: [],
          mode: 'fallback',
          backend_available: false
        },
        debug: { 
          tenant_id: requestData.tenant_id,
          user_id: requestData.user_id,
          backend_status: 'offline',
          backend_url: `${BACKEND_URL}/api/text/chatbot`,
          error_message: backendError.message,
          status: backendError.response?.status || 'connection_error'
        }
      });
    }
  } catch (error: any) {
    console.error('Error en proxy de chatbot:', error);
    
    // Crear información de diagnóstico detallada
    const errorDetail = formatError(error);
    const backendUrl = BACKEND_URL.replace(/\/$/, '');
    
    // Si el error es de conexión al backend, activar modo fallback
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ECONNABORTED') {
      console.log('Backend no disponible - activando modo fallback');
      
      return NextResponse.json({
        success: true,
        response: 'Hola! Actualmente estoy en modo de prueba. ¿En qué puedo ayudarte?',
        metadata: {
          buttons: [],
          mode: 'fallback',
          backend_available: false
        },
        debug: {
          code: error.code,
          message: error.message,
          backend_url: backendUrl
        }
      });
    }
    
    // Si la respuesta del backend tiene un código de estado, usarlo (pero limitar a 200-599)
    const statusCode = error.response?.status > 199 && error.response?.status < 600 
      ? error.response.status 
      : 500;
    
    // Si el backend proporciona una respuesta estructurada, usarla
    if (error.response?.data) {
      return NextResponse.json({
        ...error.response.data,
        backend_error: true,
        debug: {
          status: error.response.status,
          statusText: error.response.statusText,
          backend_url: backendUrl
        }
      }, { status: statusCode });
    }
    
    // Respuesta genérica para otros tipos de errores
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      fallback_response: `Lo siento, estoy teniendo problemas para procesar tu mensaje (${errorDetail}). ¿Puedes intentarlo de nuevo?`,
      details: errorDetail
    }, { status: statusCode });
  }
}

/**
 * Manejador para método OPTIONS (CORS preflight)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}