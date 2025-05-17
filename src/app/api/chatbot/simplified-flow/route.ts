import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
// import { cookies, headers } from 'next/headers'; // No lo usamos por ahora
import { formatError } from '@/utils/api';

/**
 * Proxy para comunicación con el backend del chatbot (versión simplificada)
 * Este endpoint es un fallback para cuando el endpoint principal falla
 */
export async function POST(request: NextRequest) {
  const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3090';
  // La ruta correcta en el backend es /api/text/chat-direct (añadimos prefix /api/)
  const CHATBOT_ENDPOINT = `${BACKEND_URL}/api/text/chat-direct`;
  
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
    
    // Si no hay tenant_id, usar uno por defecto para pruebas
    if (!requestData.tenant_id) {
      console.warn('No se pudo obtener el tenant_id del usuario');
      requestData.tenant_id = process.env.DEFAULT_TENANT_ID || 'afa60b0a-3046-4607-9c48-266af6e1d322';
    }
    
    // Si no hay user_id, generar uno
    if (!requestData.user_id) {
      requestData.user_id = `user-${Math.random().toString(36).substring(2, 11)}`;
    }
    
    // Registrar petición
    console.log(`Proxy chatbot simplificado: Enviando mensaje a backend para tenant ${requestData.tenant_id}`);
    
    // Configurar timeout más corto para este endpoint simplificado
    const axiosConfig = {
      timeout: 10000, // 10 segundos para el endpoint simplificado
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    try {
      // Intentar enviar petición al backend
      const backendResponse = await axios.post(CHATBOT_ENDPOINT, requestData, axiosConfig);
      
      // Si la respuesta es exitosa, enviarla al frontend
      return NextResponse.json(backendResponse.data);
    } catch (backendError: any) {
      console.error('Error en endpoint simplificado:', backendError.message);
      
      // Mensaje de error claro sin respuestas hardcodeadas
      return NextResponse.json({
        success: false,
        error: 'Error de comunicación con el servidor (modo simplificado)',
        fallback_response: `ERROR: No se pudo conectar con el servidor de chatbot en modo simplificado. Verifica la conexión con el backend.`,
        debug: { 
          tenant_id: requestData.tenant_id,
          user_id: requestData.user_id,
          backend_status: 'offline',
          error_type: 'simplified_endpoint_failure',
          error_message: backendError.message
        }
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error en proxy simplificado de chatbot:', error);
    
    // Información de diagnóstico
    const errorDetail = formatError(error);
    
    // Respuesta para errores de conexión
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return NextResponse.json({
        success: false,
        error: 'Error de conexión con el backend',
        fallback_response: 'No se pudo conectar con el servidor de chatbot. ¿Quieres intentar con el modo de respuestas simples?',
        should_use_fallback: true
      }, { status: 502 });
    }
    
    // Para otros errores, devolver una respuesta genérica
    return NextResponse.json({
      success: false,
      error: 'Error de procesamiento',
      fallback_response: `Lo siento, no pude procesar tu mensaje. ${errorDetail}`,
      error_detail: errorDetail
    }, { status: 500 });
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