/**
 * Script avanzado para debug de estructura de leads
 * Ejecutar en la consola del navegador en el sales funnel
 */

// Función para analizar lead específico que falla
function debugSpecificLead(leadId = '605ff65b-0920-480c-aace-0a3ca33b53ca') {
    console.log(`\n🔍 Buscando lead con ID: ${leadId}\n`);
    
    const store = useSalesFunnelStore.getState();
    const { columns } = store;
    
    // Buscar en todas las columnas
    for (const [stage, leads] of Object.entries(columns)) {
        for (const lead of leads) {
            if (lead.id === leadId) {
                console.log(`✅ LEAD ENCONTRADO en etapa: ${stage}`);
                console.log('Estructura completa del lead:');
                console.log(JSON.stringify(lead, null, 2));
                
                console.log('\n📊 Análisis de IDs:');
                console.log('- ID principal:', lead.id);
                console.log('- Tipo de ID:', typeof lead.id);
                console.log('- Longitud ID:', lead.id.length);
                console.log('- Es UUID válido:', isValidUUID(lead.id));
                
                if (lead.metadata) {
                    console.log('\n📋 Metadata:');
                    console.log(JSON.stringify(lead.metadata, null, 2));
                }
                
                // Verificar qué ID se está usando para la API
                const realId = getRealLeadId(lead);
                console.log('\n🎯 ID que se usaría para la API:', realId);
                
                return lead;
            }
        }
    }
    
    console.log('❌ Lead no encontrado en ninguna columna');
    return null;
}

// Función para ver el estado actual del dragging
function debugCurrentDrag() {
    const store = useSalesFunnelStore.getState();
    console.log('\n🎯 Estado actual del drag:');
    console.log('Columns:', Object.keys(store.columns));
    
    // Intentar capturar el siguiente drag
    console.log('\n⚡ Monitoreando el próximo drag...');
    console.log('Por favor, arrastra un lead ahora.');
}

// Función para analizar todos los IDs en el sistema
function analyzeAllIds() {
    const store = useSalesFunnelStore.getState();
    const { columns } = store;
    const idMap = new Map();
    
    console.log('\n📊 Análisis completo de IDs en el sistema:\n');
    
    Object.entries(columns).forEach(([stage, leads]) => {
        console.log(`\n📁 Etapa: ${stage}`);
        leads.forEach((lead, index) => {
            const idInfo = {
                frontendId: lead.id,
                dbId: lead.metadata?.db_id,
                realId: lead.metadata?.real_id,
                originalId: lead.metadata?.original_lead_id,
                computedRealId: getRealLeadId(lead),
                name: lead.name || lead.full_name || 'Sin nombre'
            };
            
            console.log(`${index + 1}. ${idInfo.name}`);
            console.log(`   Frontend ID: ${idInfo.frontendId}`);
            console.log(`   DB ID: ${idInfo.dbId || 'N/A'}`);
            console.log(`   Real ID: ${idInfo.realId || 'N/A'}`);
            console.log(`   Original ID: ${idInfo.originalId || 'N/A'}`);
            console.log(`   Computed Real ID: ${idInfo.computedRealId}`);
            console.log('');
            
            idMap.set(idInfo.frontendId, idInfo);
        });
    });
    
    return idMap;
}

// Función para interceptar la próxima llamada a la API
function interceptNextApiCall() {
    console.log('\n🎣 Interceptando próxima llamada a la API...');
    
    // Sobrescribir temporalmente fetch
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const [url, options] = args;
        
        if (url.includes('/api/leads/update-stage')) {
            console.log('\n🔥 INTERCEPTADO: Llamada a update-stage');
            console.log('URL:', url);
            console.log('Options:', options);
            
            if (options && options.body) {
                const body = JSON.parse(options.body);
                console.log('Body parseado:', body);
                
                // Buscar el lead que se está intentando actualizar
                debugSpecificLead(body.leadId);
            }
        }
        
        // Llamar al fetch original
        return originalFetch.apply(this, args);
    };
    
    console.log('Interceptor instalado. Arrastra un lead ahora.');
}

// Función helper para verificar UUID
function isValidUUID(id) {
    if (!id || typeof id !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
}

// Función para obtener el ID real (replica de getRealLeadId)
function getRealLeadId(lead) {
    if (lead.metadata?.db_id) return lead.metadata.db_id;
    if (lead.metadata?.real_id) return lead.metadata.real_id;
    if (lead.metadata?.original_lead_id) return lead.metadata.original_lead_id;
    if (isValidUUID(lead.id)) return lead.id;
    return lead.id;
}

// Función para generar reporte completo
function generateFullReport() {
    console.log('\n📊 REPORTE COMPLETO DEL SISTEMA\n');
    console.log('='.repeat(50));
    
    const store = useSalesFunnelStore.getState();
    const { columns } = store;
    
    let totalLeads = 0;
    let leadsWithMetadata = 0;
    let leadsWithValidIds = 0;
    let problematicLeads = [];
    
    Object.entries(columns).forEach(([stage, leads]) => {
        totalLeads += leads.length;
        
        leads.forEach(lead => {
            if (lead.metadata) leadsWithMetadata++;
            if (isValidUUID(lead.id)) leadsWithValidIds++;
            
            const realId = getRealLeadId(lead);
            if (realId !== lead.id) {
                problematicLeads.push({
                    stage,
                    name: lead.name || lead.full_name,
                    frontendId: lead.id,
                    realId: realId,
                    metadata: lead.metadata
                });
            }
        });
    });
    
    console.log(`Total de leads: ${totalLeads}`);
    console.log(`Leads con metadata: ${leadsWithMetadata}`);
    console.log(`Leads con IDs válidos: ${leadsWithValidIds}`);
    console.log(`Leads problemáticos: ${problematicLeads.length}`);
    
    if (problematicLeads.length > 0) {
        console.log('\n⚠️ Leads problemáticos:');
        problematicLeads.forEach((lead, index) => {
            console.log(`\n${index + 1}. ${lead.name} (${lead.stage})`);
            console.log(`   Frontend ID: ${lead.frontendId}`);
            console.log(`   Real ID: ${lead.realId}`);
            console.log(`   Metadata:`, lead.metadata);
        });
    }
    
    console.log('\n='.repeat(50));
}

// Auto-ejecutar análisis inicial
console.log('🛠️ Script de debug avanzado cargado');
console.log('\nFunciones disponibles:');
console.log('- debugSpecificLead(id) : Buscar un lead específico');
console.log('- analyzeAllIds() : Analizar todos los IDs');
console.log('- interceptNextApiCall() : Interceptar próxima llamada API');
console.log('- generateFullReport() : Generar reporte completo');
console.log('\n🔍 Analizando lead problemático...');

// Buscar automáticamente el lead problemático
debugSpecificLead('605ff65b-0920-480c-aace-0a3ca33b53ca');

// Generar reporte
generateFullReport();