/**
 * Test para verificar qué respuesta está recibiendo el frontend
 */

import axios from 'axios';

async function testFrontendResponse() {
  const BACKEND_URL = 'http://localhost:3090';
  const sessionId = 'test-frontend-' + Date.now();
  const userId = '08f89f3e-7441-4c99-96e4-745d813b9d09'; // El mismo ID del lead
  const tenantId = 'afa60b0a-3046-4607-9c48-266af6e1d322';
  const templateId = '0654268d-a65a-4e59-83a2-e99d4d393273';
  
  console.log('\n=== TEST DE RESPUESTA FRONTEND ===\n');
  
  try {
    // 1. Mensaje inicial
    console.log('1. Enviando mensaje inicial...');
    const response1 = await axios.post(`${BACKEND_URL}/api/text/chatbot`, {
      text: "hola",
      user_id: userId,
      session_id: sessionId,
      tenant_id: tenantId,
      template_id: templateId,
      mode: "auto-flow",
      force_welcome: true,
      is_first_message: true,
      lead_id: userId // Agregamos explícitamente el lead_id
    });
    
    console.log('\nRespuesta 1 completa:');
    console.log(JSON.stringify(response1.data, null, 2));
    
    // 2. Responder con nombre
    console.log('\n2. Enviando nombre...');
    const response2 = await axios.post(`${BACKEND_URL}/api/text/chatbot`, {
      text: "Carolina",
      user_id: userId,
      session_id: sessionId,
      tenant_id: tenantId,
      template_id: templateId,
      mode: "auto-flow",
      force_welcome: false,
      lead_id: userId
    });
    
    console.log('\nRespuesta 2 completa:');
    console.log(JSON.stringify(response2.data, null, 2));
    
    // Análisis específico
    console.log('\n=== ANÁLISIS DE SALESTAGEID ===');
    
    const metadata1 = response1.data?.data?.metadata;
    const metadata2 = response2.data?.data?.metadata;
    
    console.log('\nMetadata respuesta 1:', JSON.stringify(metadata1, null, 2));
    console.log('salesStageId en respuesta 1:', metadata1?.salesStageId || 'NO ENCONTRADO');
    
    console.log('\nMetadata respuesta 2:', JSON.stringify(metadata2, null, 2));
    console.log('salesStageId en respuesta 2:', metadata2?.salesStageId || 'NO ENCONTRADO');
    
    // Verificar si hay algún campo de contexto
    console.log('\n=== VERIFICACIÓN DE CONTEXTO ===');
    console.log('Context en respuesta 1:', response1.data?.data?.context);
    console.log('Context en respuesta 2:', response2.data?.data?.context);
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Respuesta de error:', error.response.data);
    }
  }
}

testFrontendResponse();