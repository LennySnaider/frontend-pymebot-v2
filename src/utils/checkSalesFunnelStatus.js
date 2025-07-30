/**
 * Utilidad para verificar el estado del sales funnel y la integración con el chatbot
 */

export async function checkSalesFunnelStatus() {
  console.log('🔍 Verificando estado del Sales Funnel...\n');
  
  try {
    // 1. Verificar etapas disponibles
    const stagesResponse = await fetch('/api/sales-funnel/stages');
    const stages = await stagesResponse.json();
    
    console.log('📊 Etapas disponibles:');
    stages.forEach(stage => {
      console.log(`   - ${stage.name} (${stage.id}): ${stage.color || 'sin color'}`);
    });
    
    // 2. Verificar leads recientes
    console.log('\n👥 Leads recientes:');
    const leadsResponse = await fetch('/api/leads?limit=5&orderBy=updated_at');
    const leads = await leadsResponse.json();
    
    if (leads.data?.length > 0) {
      leads.data.forEach(lead => {
        console.log(`   - ${lead.name || 'Sin nombre'} (${lead.id})`);
        console.log(`     Etapa: ${lead.stage || 'no definida'}`);
        console.log(`     Última actualización: ${new Date(lead.updated_at).toLocaleString()}`);
      });
    } else {
      console.log('   No hay leads recientes');
    }
    
    // 3. Verificar templates con salesStageId
    console.log('\n📋 Templates con etapas configuradas:');
    const templatesResponse = await fetch('/api/templates');
    const templates = await templatesResponse.json();
    
    let templatesWithStages = 0;
    templates.data?.forEach(template => {
      let nodesWithStage = 0;
      template.flows?.forEach(flow => {
        if (flow.salesStageId) nodesWithStage++;
      });
      
      if (nodesWithStage > 0) {
        templatesWithStages++;
        console.log(`   - ${template.name}: ${nodesWithStage} nodos con etapa`);
      }
    });
    
    if (templatesWithStages === 0) {
      console.warn('   ⚠️ No hay templates con etapas configuradas');
    }
    
    // 4. Verificar configuración del backend
    console.log('\n⚙️ Configuración del backend:');
    const configResponse = await fetch('/api/config/sales-funnel');
    const config = await configResponse.json();
    
    console.log(`   - Integración activa: ${config.enabled ? '✅' : '❌'}`);
    console.log(`   - Actualización automática: ${config.autoUpdate ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('❌ Error al verificar estado:', error);
  }
  
  console.log('\n✅ Verificación completada');
}

// Función para monitorear cambios en tiempo real
export function monitorSalesFunnelChanges() {
  console.log('👁️ Monitoreando cambios en el Sales Funnel...');
  console.log('(Presiona Ctrl+C para detener)\n');
  
  let lastLeadCount = 0;
  let lastUpdate = new Date();
  
  const checkInterval = setInterval(async () => {
    try {
      const response = await fetch('/api/leads?limit=10&orderBy=updated_at');
      const leads = await response.json();
      
      if (leads.data) {
        // Verificar si hay nuevos leads o actualizaciones
        const currentCount = leads.data.length;
        const latestUpdate = new Date(leads.data[0]?.updated_at || 0);
        
        if (currentCount !== lastLeadCount || latestUpdate > lastUpdate) {
          console.log(`🔄 Cambio detectado a las ${new Date().toLocaleTimeString()}`);
          
          // Mostrar los cambios recientes
          leads.data.slice(0, 3).forEach(lead => {
            const updateTime = new Date(lead.updated_at);
            if (updateTime > lastUpdate) {
              console.log(`   - ${lead.name || 'Lead ' + lead.id}: ${lead.stage || 'sin etapa'}`);
            }
          });
          
          lastLeadCount = currentCount;
          lastUpdate = latestUpdate;
        }
      }
    } catch (error) {
      console.error('Error al monitorear:', error.message);
    }
  }, 3000); // Verificar cada 3 segundos
  
  // Cleanup en caso de error
  process.on('SIGINT', () => {
    clearInterval(checkInterval);
    console.log('\n\nMonitoreo detenido');
    process.exit(0);
  });
}

// Exportar para uso en consola del navegador
if (typeof window !== 'undefined') {
  window.checkSalesFunnelStatus = checkSalesFunnelStatus;
  window.monitorSalesFunnelChanges = monitorSalesFunnelChanges;
}