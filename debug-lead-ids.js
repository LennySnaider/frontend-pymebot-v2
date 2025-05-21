/**
 * Script para debugear problemas con IDs de leads
 * Ejecutar en la consola del navegador mientras estás en el sales funnel
 */

// Función para inspeccionar todos los leads en el sales funnel
function debugLeadIds() {
    const salesFunnelStore = useSalesFunnelStore.getState();
    const { columns } = salesFunnelStore;
    
    console.log('=== DEBUG DE IDs DE LEADS ===');
    
    Object.entries(columns).forEach(([stageName, leads]) => {
        console.group(`📁 Etapa: ${stageName} (${leads.length} leads)`);
        
        leads.forEach((lead, index) => {
            console.group(`Lead ${index + 1}: ${lead.name || lead.full_name || 'Sin nombre'}`);
            console.log('ID principal:', lead.id);
            console.log('Stage:', lead.stage);
            console.log('Metadata:', lead.metadata);
            
            if (lead.metadata) {
                console.log('  - db_id:', lead.metadata.db_id);
                console.log('  - real_id:', lead.metadata.real_id);
                console.log('  - original_lead_id:', lead.metadata.original_lead_id);
            }
            
            console.groupEnd();
        });
        
        console.groupEnd();
    });
    
    console.log('=== FIN DEL DEBUG ===');
}

// También podemos buscar un lead específico
function findLeadById(searchId) {
    const salesFunnelStore = useSalesFunnelStore.getState();
    const { columns } = salesFunnelStore;
    
    console.log(`🔍 Buscando lead con ID: ${searchId}`);
    
    for (const [stageName, leads] of Object.entries(columns)) {
        for (const lead of leads) {
            // Buscar en todos los posibles campos de ID
            if (lead.id === searchId ||
                lead.metadata?.db_id === searchId ||
                lead.metadata?.real_id === searchId ||
                lead.metadata?.original_lead_id === searchId) {
                
                console.log(`✅ Lead encontrado en etapa: ${stageName}`);
                console.log('Datos completos:', lead);
                return lead;
            }
        }
    }
    
    console.log('❌ Lead no encontrado');
    return null;
}

// Función para verificar consistencia de IDs
function checkIdConsistency() {
    const salesFunnelStore = useSalesFunnelStore.getState();
    const { columns } = salesFunnelStore;
    
    let totalLeads = 0;
    let leadsWithMetadata = 0;
    let leadsWithDbId = 0;
    let leadsWithRealId = 0;
    let leadsWithOriginalId = 0;
    let problematicLeads = [];
    
    Object.entries(columns).forEach(([stageName, leads]) => {
        leads.forEach(lead => {
            totalLeads++;
            
            if (lead.metadata) {
                leadsWithMetadata++;
                
                if (lead.metadata.db_id) leadsWithDbId++;
                if (lead.metadata.real_id) leadsWithRealId++;
                if (lead.metadata.original_lead_id) leadsWithOriginalId++;
            }
            
            // Detectar leads problemáticos (ID no es UUID válido)
            if (!lead.id || lead.id.length !== 36 || !lead.id.includes('-')) {
                problematicLeads.push({
                    stage: stageName,
                    lead: lead
                });
            }
        });
    });
    
    console.log('📊 Análisis de consistencia de IDs:');
    console.log(`Total de leads: ${totalLeads}`);
    console.log(`Leads con metadata: ${leadsWithMetadata}`);
    console.log(`Leads con db_id: ${leadsWithDbId}`);
    console.log(`Leads con real_id: ${leadsWithRealId}`);
    console.log(`Leads con original_lead_id: ${leadsWithOriginalId}`);
    console.log(`Leads con IDs problemáticos: ${problematicLeads.length}`);
    
    if (problematicLeads.length > 0) {
        console.log('⚠️ Leads problemáticos:', problematicLeads);
    }
}

// Ejecutar automáticamente
console.log('📋 Script de debug cargado. Funciones disponibles:');
console.log('- debugLeadIds() : Ver todos los IDs de leads');
console.log('- findLeadById(id) : Buscar un lead específico');
console.log('- checkIdConsistency() : Analizar consistencia de IDs');

// Ejecutar análisis inicial
debugLeadIds();
checkIdConsistency();