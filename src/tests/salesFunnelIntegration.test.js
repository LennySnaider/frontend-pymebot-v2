/**
 * Test para verificar la integración completa del sales funnel con el chatbot
 * Este test verifica que los leads se muevan correctamente a través de las etapas
 * del sales funnel basándose en la progresión del chat
 */

export async function testSalesFunnelIntegration() {
  console.log('\n====== Iniciando Test de Integración Sales Funnel ======\n');
  
  // 1. Verificar configuración del template
  const templateId = 'test-template'; // Reemplazar con un ID real
  
  console.log('1. Verificando configuración del template...');
  try {
    const response = await fetch(`/api/chatbot/get-template?id=${templateId}`);
    const template = await response.json();
    
    if (!template.success) {
      console.error('❌ Error al cargar el template:', template.error);
      return;
    }
    
    console.log('✅ Template cargado correctamente');
    console.log('   Flujos encontrados:', template.data.flows?.length || 0);
    
    // Verificar que los nodos tengan salesStageId
    let nodesWithStage = 0;
    template.data.flows?.forEach(flow => {
      if (flow.salesStageId) {
        nodesWithStage++;
        console.log(`   - Nodo "${flow.pattern}" → Etapa: ${flow.salesStageId}`);
      }
    });
    
    if (nodesWithStage === 0) {
      console.warn('⚠️ Ningún nodo tiene salesStageId configurado');
    }
    
  } catch (error) {
    console.error('❌ Error al verificar template:', error);
    return;
  }
  
  // 2. Simular interacción de chat
  console.log('\n2. Simulando interacción de chat...');
  const testLeadId = 'lead_' + Date.now(); // ID único para el test
  const testMessages = [
    { text: 'Hola', expectedStage: 'nuevo' },
    { text: 'Me interesa su producto', expectedStage: 'interesado' },
    { text: 'Quiero agendar una cita', expectedStage: 'oportunidad' }
  ];
  
  for (const testMessage of testMessages) {
    try {
      console.log(`\n   Enviando: "${testMessage.text}"`);
      
      const response = await fetch('/api/chatbot/integrated-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: testMessage.text,
          user_id: 'test-user',
          tenant_id: 'test-tenant',
          session_id: 'test-session',
          template_id: templateId,
          bot_id: 'test-bot',
          lead_id: testLeadId.replace('lead_', '') // Enviar sin el prefijo
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        console.error(`❌ Error al enviar mensaje:`, result.error);
        continue;
      }
      
      console.log(`✅ Mensaje procesado`);
      console.log(`   Respuesta: "${result.response}"`);
      
      // Verificar si se actualizó la etapa
      const stageInfo = result.debug?.stageUpdate;
      if (stageInfo) {
        console.log(`   ✅ Etapa actualizada: ${stageInfo.oldStage} → ${stageInfo.newStage}`);
      } else {
        console.log(`   ℹ️ No se actualizó la etapa`);
      }
      
      // Pequeña pausa entre mensajes
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error al procesar mensaje:`, error);
    }
  }
  
  // 3. Verificar estado final del lead en el sales funnel
  console.log('\n3. Verificando estado final del lead...');
  try {
    const response = await fetch(`/api/leads/${testLeadId.replace('lead_', '')}`);
    const lead = await response.json();
    
    if (lead) {
      console.log(`✅ Lead encontrado en el sales funnel`);
      console.log(`   Etapa actual: ${lead.stage || 'no definida'}`);
      console.log(`   Progresión: ${lead.stageHistory?.join(' → ') || 'no disponible'}`);
    } else {
      console.warn('⚠️ Lead no encontrado en el sales funnel');
    }
    
  } catch (error) {
    console.error('❌ Error al verificar lead:', error);
  }
  
  console.log('\n====== Test Completado ======\n');
}

// Función helper para ejecutar el test
export function runSalesFunnelTest() {
  testSalesFunnelIntegration().catch(error => {
    console.error('Error fatal en el test:', error);
  });
}

// Exportar para poder usar en consola del navegador
if (typeof window !== 'undefined') {
  window.runSalesFunnelTest = runSalesFunnelTest;
}