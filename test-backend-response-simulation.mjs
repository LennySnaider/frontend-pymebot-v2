import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simulación de respuesta del backend
async function simulateBackendResponse() {
  console.log('=== SIMULACIÓN DE RESPUESTA DEL BACKEND ===\n');
  
  // Respuestas del backend para diferentes etapas del flujo
  const responses = [
    {
      step: 'Saludo inicial',
      message: {
        from: 'backend',
        text: 'Hola, ¿cómo estás? Soy un asistente virtual. ¿Me puedes compartir tu nombre?',
        metadata: {
          salesStageId: 'nuevos',
          currentLeadStage: 'nuevos'
        }
      }
    },
    {
      step: 'Recibe nombre',
      userInput: 'Carolina López',
      message: {
        from: 'backend',
        text: 'Perfecto Carolina, un placer conocerte. Para ayudarte mejor, ¿podrías compartirme tu teléfono o email?',
        metadata: {
          salesStageId: 'prospecting',
          currentLeadStage: 'prospecting'
        }
      }
    },
    {
      step: 'Recibe contacto',
      userInput: 'carolina@example.com',
      message: {
        from: 'backend',
        text: 'Gracias Carolina. Ahora, ¿qué tipo de propiedad estás buscando?',
        metadata: {
          salesStageId: 'qualification',
          currentLeadStage: 'qualification'
        }
      }
    }
  ];
  
  // Simular el flujo
  for (const response of responses) {
    console.log(`\n--- ${response.step} ---`);
    
    if (response.userInput) {
      console.log(`Usuario dice: "${response.userInput}"`);
    }
    
    console.log(`Backend responde: "${response.message.text}"`);
    console.log(`Metadata enviada:`);
    console.log(JSON.stringify(response.message.metadata, null, 2));
    
    // Simular lo que haría el frontend
    const stageChange = response.message.metadata.salesStageId;
    if (stageChange) {
      console.log(`\nFRONTEND DETECTA cambio de etapa: ${stageChange}`);
      console.log(`Frontend llamaría: updateLeadStage(leadId, "${stageChange}")`);
    }
  }
  
  console.log('\n\n=== RESUMEN DEL FLUJO ===');
  console.log('1. Usuario inicia chat -> Stage: nuevos');
  console.log('2. Usuario da su nombre -> Stage: prospecting');
  console.log('3. Usuario da contacto -> Stage: qualification');
  
  console.log('\n=== VERIFICACIÓN EN EL FRONTEND ===');
  console.log(`
// En ChatBody.tsx, líneas 340-348:
if (response?.data?.metadata?.salesStageId || response?.salesStageId) {
    const newStageId = response.data?.metadata?.salesStageId || response.salesStageId;
    console.log('Detectado cambio de etapa en sales funnel:', newStageId);
    
    if (selectedChat?.id) {
        const leadId = selectedChat.id;
        console.log('Actualizando lead', leadId, 'a etapa', newStageId);
        updateLeadStage(leadId, newStageId);
    }
}
  `);
}

simulateBackendResponse();