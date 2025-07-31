'use client'

/**
 * frontend/src/app/(protected-pages)/modules/marketing/chat/_components/MessageTester.tsx
 * Componente para probar el envío de mensajes al chatbot y diagnosticar problemas
 * @version 1.1.0
 * @updated 2025-05-11
 */

import React, { useState } from 'react'
import { Button } from '@/components/ui'
import Dialog from '@/components/ui/Dialog'
import { useChatStore } from '../_store/chatStore'

const MessageTester = () => {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [inputText, setInputText] = useState("Hola")
  const [testResult, setTestResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  const activeTemplateId = useChatStore((state) => state.activeTemplateId)
  const templates = useChatStore((state) => state.templates)
  
  // Obtener la plantilla activa actual
  const activeTemplate = templates.find(t => t.id === activeTemplateId)
  
  const handleTest = async () => {
    if (!activeTemplateId) {
      setError("No hay plantilla activa seleccionada")
      return
    }

    setIsLoading(true)
    setError(null)
    setTestResult(null) // Limpiar resultado anterior
    
    // Primero intentamos con la API local que luego se comunica con el backend
    try {
      console.log('Enviando solicitud a API local primero...');
      
      // Siempre usar la API local primero (que funciona como proxy al backend)
      const localResponse = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          user_id: `test-user-${Date.now()}`,
          session_id: `test-session-${Date.now()}`,
          tenant_id: 'default',
          bot_id: 'default',
          template_id: activeTemplateId,
          is_internal_test: true
        }),
      });

      // Incluso si el status es ok (ej. 200), aún podría contener un error en el cuerpo
      // Así que no lanzamos error por el código de estado, sino que procesamos
      // el cuerpo de la respuesta para determinar si hay un error lógico
      if (!localResponse.ok) {
        console.warn(`API local respondió con código HTTP: ${localResponse.status} ${localResponse.statusText}`);
        // Continuamos para procesar el cuerpo aunque el código no sea 2xx
      }

      // Verificar tipo de contenido para detectar HTML
      const localContentType = localResponse.headers.get('content-type') || '';
      console.log(`API LOCAL Content-Type: ${localContentType}`);

      // Si el tipo de contenido parece HTML, vamos directamente al fallback sin intentar parsear
      if (localContentType.includes('text/html')) {
        console.warn('⚠️ DETECTADO HTML EN RESPUESTA LOCAL ⚠️ Saltando al fallback directo');
        // Lanzar un error específico que será capturado en el catch
        throw new Error('La API local devolvió HTML en lugar de JSON');
      }

      // Intentar parsear con manejo de errores
      let localResult;
      try {
        localResult = await localResponse.json();
      } catch (jsonError) {
        // Si falla el parseo JSON, verificar si es HTML
        console.log('⚠️ ERROR DE PARSEO JSON ⚠️ Obteniendo contenido como texto...');
        const textResponse = await localResponse.text().catch(() => "No se pudo obtener respuesta como texto");

        if (textResponse.trim().startsWith('<!DOCTYPE') || textResponse.trim().startsWith('<html')) {
          console.error('❌ CONTENIDO HTML DETECTADO ❌', textResponse.substring(0, 200));
          console.warn('⚠️ SALTANDO A CONEXIÓN DIRECTA CON BACKEND ⚠️');
          // No lanzamos error aquí, simplemente pasamos al catch para intentar el fallback
          throw new Error(`La API local devolvió HTML en lugar de JSON. Probando conexión directa al backend...`);
        }

        console.error('❌ ERROR AL PARSEAR JSON DE API LOCAL ❌', {
          error: jsonError.message,
          respuestaPreview: textResponse.substring(0, 100)
        });

        // Lanzamos el error para que se maneje en el catch y se intente la conexión directa
        throw new Error(`Error al parsear respuesta JSON: ${jsonError.message}`);
      }
      
      console.log('Respuesta recibida de API local:', localResult);

      // Verificar si hay un error en la respuesta - basado en flags o contenido
      const isBackendError = localResult.error === true || // Flag explícito de error
        (localResult.success === false) || // Flag explícito de fallo
        (localResult.response && typeof localResult.response === 'string' && (
          localResult.response.toLowerCase().includes("error") ||
          localResult.response.toLowerCase().includes("ocurrió un error") ||
          localResult.response.toLowerCase().includes("lo siento") ||
          localResult.response.toLowerCase().includes("no pude")
        ));

      // Formatear el resultado para la UI
      const formattedResult = {
        response: localResult.response || localResult.message || 'Sin respuesta',
        welcomeMessage: null,
        metadata: localResult.metadata || {},
        requestData: {
          text: inputText,
          template_id: activeTemplateId
        },
        backend_status: isBackendError ? 'error' : 'success',
        backend_error_details: isBackendError
          ? (localResult.details || "Error en el procesamiento del mensaje. Revisa los logs para más detalles.")
          : null
      };

      setTestResult(formattedResult);
      
    } catch (err) {
      console.error('❌ ERROR API LOCAL ❌', err);

      // Información de diagnóstico detallada para consola
      if (err instanceof Error) {
        console.error('❌ DETALLES DEL ERROR ❌', {
          name: err.name,
          message: err.message,
          stack: err.stack,
          isFetchError: err.name === 'TypeError' && err.message.includes('fetch'),
          isSyntaxError: err.name === 'SyntaxError',
          isNetworkError: err.message.includes('network') || err.message.includes('Failed to fetch')
        });
      }

      // Datos que intentamos enviar (para diagnóstico)
      console.log('❌ DATOS DE SOLICITUD ❌', {
        text: inputText,
        user_id: `test-user-${Date.now()}`,
        session_id: `test-session-${Date.now()}`,
        tenant_id: 'default',
        template_id: activeTemplateId,
        is_internal_test: true
      });

      // Como fallback, intentamos directamente con el backend
      const backendUrl = 'http://localhost:3090/api/text/chatbot';
      try {
        console.log('↪️ FALLBACK ↪️ Intentando conexión directa con backend...');

        const response = await fetch(backendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': window.location.origin
          },
          body: JSON.stringify({
            text: inputText,
            user_id: `test-user-${Date.now()}`,
            session_id: `test-session-${Date.now()}`,
            tenant_id: 'default',
            bot_id: 'default',
            template_id: activeTemplateId,
            is_internal_test: true
          }),
        });

        // Similar a la API local, procesamos la respuesta independientemente del código de estado
        if (!response.ok) {
          console.warn(`↪️ BACKEND DIRECTO ↪️ Respondió con código: ${response.status} ${response.statusText}`);
          // Continuamos con el procesamiento
        }

        // Obtener y verificar el tipo de contenido para detectar respuestas HTML
        const contentType = response.headers.get('content-type') || '';
        console.log(`↪️ BACKEND DIRECTO ↪️ Content-Type: ${contentType}`);

        // Intentar parsear como JSON con manejo de errores
        let result;
        try {
          result = await response.json();
        } catch (jsonError) {
          // Cuando falla el parseo, es probable que sea HTML
          const textResponse = await response.text().catch(() => "No se pudo obtener respuesta como texto");

          // Verificar si es HTML
          if (textResponse.trim().startsWith('<!DOCTYPE') || textResponse.trim().startsWith('<html')) {
            console.error('↪️ ERROR: RESPUESTA HTML ↪️', textResponse.substring(0, 200));
            throw new Error(`Recibida página HTML en lugar de JSON. Esto ocurre cuando el backend está devolviendo un error 500 o una redirección.`);
          }

          console.error('↪️ ERROR AL PARSEAR JSON ↪️', {
            error: jsonError.message,
            respuestaInicio: textResponse.substring(0, 100)
          });

          throw new Error(`Error al parsear JSON: ${jsonError.message}. Verifica que el backend esté devolviendo JSON válido.`);
        }
        console.log('↪️ RESPUESTA BACKEND DIRECTO ↪️', result);

        // Verificar si hay un error en la respuesta del backend directo
        const isBackendError = result.error === true ||
          (result.success === false) ||
          (result.response && typeof result.response === 'string' && (
            result.response.toLowerCase().includes("error") ||
            result.response.toLowerCase().includes("ocurrió un error")
          ));

        // Formatear resultado
        const formattedResult = {
          response: result.response || result.message || 'Sin respuesta',
          welcomeMessage: null,
          metadata: {
            ...(result.metadata || {}),
            response_code: response.status,
            headers: Object.fromEntries(response.headers.entries())
          },
          requestData: {
            text: inputText,
            template_id: activeTemplateId
          },
          backend_status: isBackendError ? 'error' : 'success',
          backend_error_details: isBackendError ? (result.details || "Error en el backend") : null,
          source: 'backend_directo'
        };

        setTestResult(formattedResult);

      } catch (directErr) {
        console.error('❌ ERROR BACKEND DIRECTO ❌', directErr);

        // Información detallada para diagnóstico
        if (directErr instanceof Error) {
          console.error('❌ DETALLES ERROR BACKEND ❌', {
            name: directErr.name,
            message: directErr.message,
            stack: directErr.stack,
            isCorsError: directErr.message.includes('CORS') || directErr.message.includes('cross-origin')
          });
        }

        // Preparar mensaje de error para el usuario con instrucciones detalladas
        let errorMessage;

        if (err instanceof Error && directErr instanceof Error) {
          const isCorsIssue = directErr.message.includes('CORS') ||
                             directErr.message.includes('cross-origin');

          const isNetworkIssue = err.message.includes('Failed to fetch') ||
                                err.message.includes('network');

          const isSyntaxIssue = err.name === 'SyntaxError' ||
                               directErr.name === 'SyntaxError';

          const isHtmlResponse =
            (directErr.message && directErr.message.includes('<!DOCTYPE')) ||
            (directErr.message && directErr.message.includes('Unexpected token')) ||
            (err.message && err.message.includes('<!DOCTYPE')) ||
            (err.message && err.message.includes('Unexpected token')) ||
            (directErr.message && directErr.message.includes('HTML')) ||
            (err.message && err.message.includes('HTML'));

          // Detectar error específico de "Cannot GET" (típico de Express cuando un endpoint solo acepta POST)
          const isCannotGetError =
            (directErr.message && directErr.message.includes('Cannot GET')) ||
            (err.message && err.message.includes('Cannot GET'));

          // Mostrar información adicional para diagnóstico si es un problema HTML
          if (isHtmlResponse) {
            console.error('⚠️ PROBLEMA DE RESPUESTA HTML DETECTADO ⚠️', {
              errorLocal: err.message,
              errorDirecto: directErr.message
            });
          }

          errorMessage = `
Error con API local: ${err.message}

Error con backend directo: ${directErr.message}

Diagnóstico:
${isCorsIssue ? '- Problema de CORS detectado. El backend no permite solicitudes desde este origen.' : ''}
${isNetworkIssue ? '- Problema de red detectado. Es posible que el backend no esté en funcionamiento.' : ''}
${isSyntaxIssue ? '- Error de sintaxis detectado. La respuesta no es JSON válido.' : ''}
${isHtmlResponse ? '- Se recibió HTML en lugar de JSON. Esto suele indicar que el backend está devolviendo una página de error 500 o una redirección.' : ''}
${isCannotGetError ? '- Error "Cannot GET". Esto significa que el endpoint existe pero sólo acepta solicitudes POST, no GET. Este es un comportamiento normal y la solución es usar POST (que ya estamos haciendo).' : ''}

Posibles soluciones:
1. Verifica que el servidor del chatbot esté funcionando en el puerto 3090
   Comando para iniciar backend: cd ../v2-backend-pymebot && npm start

2. Verifica que la configuración CORS del backend permita conexiones desde localhost:3000
   Busca configuración CORS en: v2-backend-pymebot/src/app.ts o app.js

3. Reinicia ambos servidores y borra la caché del navegador

4. Verifica los logs del servidor backend para más detalles

${isHtmlResponse ? `5. Si ves "SyntaxError: Unexpected token '<', '<!DOCTYPE'", es que el backend está devolviendo una página HTML en lugar de JSON.
   - Esto puede deberse a que estás recibiendo una redirección a una página de error
   - Verifica que la URL del backend sea correcta: ${backendUrl}
   - Asegúrate que el endpoint devuelva JSON y no HTML (inspecciona las respuestas del servidor)` : ''}

${isCannotGetError ? `6. Si ves "Cannot GET /api/text/chat", es normal porque este endpoint solo acepta POST, no GET.
   - Prueba usar un endpoint de diagnóstico que sí acepte GET: http://localhost:3090/health o http://localhost:3090/api/text/ping
   - El mensaje de error actual solo significa que estás usando el método HTTP correcto (POST)` : ''}
          `;
        } else {
          errorMessage = "Múltiples errores de conexión. Verifica que ambos servidores estén funcionando correctamente.";
        }

        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <Button
        variant="plain"
        size="sm"
        className="bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-300 h-8"
        onClick={() => {
          setOpen(true);
          // Limpiar estado anterior
          setTestResult(null);
          setError(null);
          setIsLoading(false);
        }}
      >
        Test Mensaje
      </Button>
      
      <Dialog
        isOpen={open}
        onClose={() => setOpen(false)}
        width={800}
        contentClassName="max-h-[90vh] overflow-y-auto"
      >
        <h4 className="font-bold text-lg mb-4">Prueba de Mensajes de Chatbot</h4>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Esta herramienta te permite probar el envío de mensajes al chatbot con la plantilla seleccionada
            para diagnosticar problemas con las respuestas.
          </p>
        </div>
        
        <div className="flex flex-col space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Plantilla Activa:</label>
            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
              {activeTemplate ? (
                <div>
                  <span className="font-medium">{activeTemplate.name}</span>
                  <span className="text-xs ml-2 text-gray-500">({activeTemplateId})</span>
                </div>
              ) : (
                <span className="text-red-500">No hay plantilla activa seleccionada</span>
              )}
            </div>
          </div>
          
          <div>
            <label htmlFor="test-message" className="block text-sm font-medium mb-1">
              Mensaje a Enviar:
            </label>
            <input
              id="test-message"
              className="w-full p-2 border rounded"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ingresa un mensaje para probar"
            />
          </div>
          
          <Button
            onClick={handleTest}
            loading={isLoading}
            disabled={!activeTemplateId || isLoading}
          >
            Probar Mensaje
          </Button>
          
          {error && (
            <div className="p-3 bg-red-100 text-red-800 rounded">
              <p className="font-medium">Error:</p>
              <pre className="whitespace-pre-wrap text-sm">{error}</pre>

              <div className="mt-2 text-xs text-gray-700">
                <p className="font-medium mb-1">Información de diagnóstico:</p>
                <p>• API Local: /api/chatbot/message (proxy hacia backend)</p>
                <p>• API Backend directo: http://localhost:3090/api/text/chatbot</p>
                <p>• Plantilla activa ID: {activeTemplateId}</p>
              </div>

              <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="font-medium text-sm mb-1">Enlaces rápidos para diagnóstico:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <a
                    href="http://localhost:3090/health"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200"
                  >
                    Verificar Backend (health)
                  </a>
                  <a
                    href="http://localhost:3090/api/text/ping"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200"
                  >
                    Verificar API Texto (ping)
                  </a>
                  <a
                    href="http://localhost:3090/cors-test"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200"
                  >
                    Verificar CORS
                  </a>
                </div>
                <p className="text-xs mt-2 text-gray-600">Estos enlaces se abren en nuevas pestañas para diagnóstico rápido.</p>
              </div>
            </div>
          )}
          
          {testResult && (
            <div className="mt-4 space-y-4">
              <div className={`p-3 ${testResult.backend_status === 'error' ? 'bg-red-50' : 'bg-gray-100'} rounded`}>
                <div className="flex justify-between items-center mb-2">
                  <h5 className="font-medium">Respuesta del Bot:</h5>

                  <span className={`px-2 py-1 text-xs rounded ${
                    testResult.backend_status === 'error'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {testResult.backend_status === 'error' ? 'Error en Backend' : 'Backend OK'}
                  </span>
                </div>

                <div className="p-2 bg-white border rounded">
                  {testResult.response}
                </div>

                {testResult.backend_status === 'error' && testResult.backend_error_details && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                    <p className="font-medium">Diagnóstico:</p>
                    <p>{testResult.backend_error_details}</p>
                    <p className="mt-2">La solicitud llegó al backend pero hay un error en el procesamiento.</p>
                    <p>Revisar logs del backend para más detalles.</p>
                  </div>
                )}

                <h5 className="font-medium mt-4 mb-2">Información de Conexión:</h5>
                <div className="p-2 bg-white border rounded text-sm">
                  <div className="mb-1">
                    <span className="font-semibold">Fuente:</span> {testResult.metadata?.source || 'Desconocido'}
                  </div>
                  <div className="mb-1">
                    <span className="font-semibold">Estado Conexión:</span>
                    <span className="text-green-600"> Conectado ✓</span>
                  </div>
                  <div className="mb-1">
                    <span className="font-semibold">Template ID:</span> {testResult.requestData.template_id}
                  </div>
                </div>

                <h5 className="font-medium mt-4 mb-2">Metadata:</h5>
                <div className="p-2 bg-white border rounded text-sm">
                  {testResult.metadata && Object.keys(testResult.metadata).length > 0
                    ? Object.entries(testResult.metadata).map(([key, value]) => (
                        <div key={key} className="mb-1">
                          <span className="font-semibold">{key}:</span> {JSON.stringify(value)}
                        </div>
                      ))
                    : <span className="text-gray-500">Sin metadata</span>
                  }
                </div>
                
                <div className="mt-4">
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                      Detalles técnicos
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto max-h-48">
                      {JSON.stringify(testResult, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
              
              <div className="flex justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Cerrar
                </Button>

                <Button
                  onClick={handleTest}
                  size="sm"
                >
                  Probar Nuevamente
                </Button>
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </>
  )
}

export default MessageTester