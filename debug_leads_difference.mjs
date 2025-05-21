/**
 * Script para depurar la diferencia entre los 12 leads del chat y los 9 del sales funnel
 * Este script se conecta directamente a Supabase y simula las consultas que hace cada componente
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno del archivo .env
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Las variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY deben estar configuradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugLeadsDifference() {
    console.log('=== DEBUGGING: Diferencia entre leads del chat y sales funnel ===\n');

    // 1. Contar todos los leads sin filtros (posiblemente lo que hace el chat)
    const { data: allLeads, error: allLeadsError } = await supabase
        .from('leads')
        .select('*');

    if (allLeadsError) {
        console.error('Error al obtener todos los leads:', allLeadsError);
        return;
    }

    console.log(`1. Total de leads SIN FILTROS (posible count del chat): ${allLeads.length}`);

    // 2. Simular la consulta del sales funnel (basada en getSalesFunnelData.ts)
    const { data: funnelLeads, error: funnelError } = await supabase
        .from('leads')
        .select(`
            id, 
            full_name, 
            stage, 
            status,
            metadata
        `)
        .not('status', 'eq', 'closed') // Filtrar los leads con status "closed"
        .order('created_at', { ascending: false });

    if (funnelError) {
        console.error('Error al obtener leads del funnel:', funnelError);
        return;
    }

    console.log(`\n2. Leads después del filtro SQL (status != 'closed'): ${funnelLeads.length}`);

    // 3. Aplicar filtros adicionales que hace el código del sales funnel
    const filteredFunnelLeads = funnelLeads.filter(lead => {
        // Si el lead tiene stage="closed", lo filtramos
        if (lead.stage === 'closed') {
            return false;
        }
        
        // Si el lead tiene metadata.removed_from_funnel = true, lo filtramos
        if (lead.metadata && lead.metadata.removed_from_funnel === true) {
            return false;
        }
        
        return true;
    });

    console.log(`\n3. Leads después de filtros adicionales (stage != 'closed' && !removed_from_funnel): ${filteredFunnelLeads.length}`);

    // 4. Filtrar solo las etapas que muestra el sales funnel
    const validStages = ['new', 'first_contact', 'prospecting', 'qualification', 'opportunity'];
    const displayStages = ['new', 'prospecting', 'qualification', 'opportunity'];
    
    // Mapeo de etapas para el frontend
    const stageDisplayMap = {
        'first_contact': 'new',
        'new': 'new',
        'prospecting': 'prospecting',
        'qualification': 'qualification',
        'opportunity': 'opportunity',
        'confirmed': 'confirmed',
        'closed': 'closed'
    };

    const finalFunnelLeads = filteredFunnelLeads.filter(lead => {
        const dbStage = lead.stage || 'first_contact';
        const displayStage = stageDisplayMap[dbStage] || dbStage;
        return displayStages.includes(displayStage);
    });

    console.log(`\n4. Leads en etapas visibles del funnel (${displayStages.join(', ')}): ${finalFunnelLeads.length}`);

    // 5. Analizar la diferencia
    console.log('\n=== ANÁLISIS DE LA DIFERENCIA ===');
    console.log(`Leads en el chat: ${allLeads.length}`);
    console.log(`Leads en el sales funnel: ${finalFunnelLeads.length}`);
    console.log(`Diferencia: ${allLeads.length - finalFunnelLeads.length}`);

    // 6. Identificar qué leads están siendo excluidos
    console.log('\n=== LEADS EXCLUIDOS DEL SALES FUNNEL ===');
    
    const excludedLeads = allLeads.filter(lead => {
        const isInFunnel = finalFunnelLeads.some(fl => fl.id === lead.id);
        return !isInFunnel;
    });

    console.log(`\nTotal de leads excluidos: ${excludedLeads.length}`);
    console.log('\nDetalle de leads excluidos:');
    
    excludedLeads.forEach((lead, index) => {
        console.log(`\n${index + 1}. Lead: ${lead.full_name} (ID: ${lead.id})`);
        console.log(`   - Stage: ${lead.stage || 'null'}`);
        console.log(`   - Status: ${lead.status || 'null'}`);
        console.log(`   - Removed from funnel: ${lead.metadata?.removed_from_funnel || 'false'}`);
        
        // Determinar razón de exclusión
        let razon = '';
        if (lead.status === 'closed') {
            razon += 'status=closed; ';
        }
        if (lead.stage === 'closed') {
            razon += 'stage=closed; ';
        }
        if (lead.metadata?.removed_from_funnel === true) {
            razon += 'removed_from_funnel=true; ';
        }
        if (!displayStages.includes(stageDisplayMap[lead.stage] || lead.stage)) {
            razon += `stage="${lead.stage}" no está en etapas visibles; `;
        }
        
        console.log(`   - Razón de exclusión: ${razon || 'No determinada'}`);
    });

    // 7. Verificar distribución de stages
    console.log('\n=== DISTRIBUCIÓN DE STAGES ===');
    const stageDistribution = {};
    
    allLeads.forEach(lead => {
        const stage = lead.stage || 'null';
        stageDistribution[stage] = (stageDistribution[stage] || 0) + 1;
    });
    
    Object.entries(stageDistribution).forEach(([stage, count]) => {
        const displayStage = stageDisplayMap[stage] || stage;
        const isVisible = displayStages.includes(displayStage);
        console.log(`Stage "${stage}" (display: "${displayStage}"): ${count} leads - ${isVisible ? 'VISIBLE' : 'NO VISIBLE'} en funnel`);
    });
}

// Ejecutar el debug
debugLeadsDifference().catch(console.error);