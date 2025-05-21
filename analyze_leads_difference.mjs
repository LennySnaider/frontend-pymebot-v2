import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gyslfajscteoqhxefudu.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Error: Las variables de entorno no están configuradas correctamente');
    process.exit(1);
}

// Usar service role key para bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function analyzeDifference() {
    console.log('=== ANÁLISIS: DIFERENCIA ENTRE CHAT Y SALES FUNNEL ===\n');

    try {
        // 1. Total de leads sin filtros (lo que vería el chat)
        console.log('1. SIMULANDO EL CHAT (todos los leads):');
        const { data: allLeads, error: allError } = await supabase
            .from('leads')
            .select('*');

        if (allError) {
            console.error('Error:', allError);
            return;
        }

        console.log(`   Total de leads: ${allLeads.length}`);

        // Mostrar algunos ejemplos
        console.log('   Primeros 5 leads:');
        allLeads.slice(0, 5).forEach((lead, i) => {
            console.log(`     ${i + 1}. ${lead.full_name} - stage: ${lead.stage}, status: ${lead.status}`);
        });

        // 2. Simular la consulta del sales funnel
        console.log('\n2. SIMULANDO EL SALES FUNNEL:');
        
        // Paso 1: Filtro SQL (status != 'closed')
        const { data: funnelStep1, error: funnelError } = await supabase
            .from('leads')
            .select('*')
            .not('status', 'eq', 'closed');

        if (funnelError) {
            console.error('Error:', funnelError);
            return;
        }

        console.log(`   Después de filtro SQL (status != 'closed'): ${funnelStep1.length} leads`);

        // Paso 2: Filtros adicionales en JavaScript
        const funnelStep2 = funnelStep1.filter(lead => {
            // Filtrar stage = 'closed'
            if (lead.stage === 'closed') {
                return false;
            }
            
            // Filtrar metadata.removed_from_funnel = true
            if (lead.metadata && lead.metadata.removed_from_funnel === true) {
                return false;
            }
            
            return true;
        });

        console.log(`   Después de filtros JS (stage != 'closed' && !removed_from_funnel): ${funnelStep2.length} leads`);

        // Paso 3: Solo etapas visibles
        const validStages = ['new', 'first_contact', 'prospecting', 'qualification', 'opportunity'];
        const displayStages = ['new', 'prospecting', 'qualification', 'opportunity'];
        
        const stageDisplayMap = {
            'first_contact': 'new',
            'new': 'new',
            'prospecting': 'prospecting',
            'qualification': 'qualification',
            'opportunity': 'opportunity',
            'confirmed': 'confirmed',
            'closed': 'closed'
        };

        const funnelStep3 = funnelStep2.filter(lead => {
            const dbStage = lead.stage || 'first_contact';
            const displayStage = stageDisplayMap[dbStage] || dbStage;
            return displayStages.includes(displayStage);
        });

        console.log(`   Solo etapas visibles (${displayStages.join(', ')}): ${funnelStep3.length} leads`);

        // 3. Análisis de la diferencia
        console.log('\n3. ANÁLISIS DE LA DIFERENCIA:');
        console.log(`   Leads en el chat: ${allLeads.length}`);
        console.log(`   Leads en el sales funnel: ${funnelStep3.length}`);
        console.log(`   Diferencia: ${allLeads.length - funnelStep3.length} leads`);

        // 4. Identificar leads excluidos
        console.log('\n4. LEADS EXCLUIDOS DEL SALES FUNNEL:');
        
        const excludedLeads = allLeads.filter(lead => {
            const isInFunnel = funnelStep3.some(fl => fl.id === lead.id);
            return !isInFunnel;
        });

        excludedLeads.forEach((lead, i) => {
            console.log(`\n   ${i + 1}. ${lead.full_name} (ID: ${lead.id})`);
            console.log(`      - Stage: ${lead.stage}`);
            console.log(`      - Status: ${lead.status}`);
            console.log(`      - Removed from funnel: ${lead.metadata?.removed_from_funnel || false}`);
            
            // Determinar razón
            let reasons = [];
            if (lead.status === 'closed') reasons.push('status=closed');
            if (lead.stage === 'closed') reasons.push('stage=closed');
            if (lead.metadata?.removed_from_funnel === true) reasons.push('removed_from_funnel=true');
            
            const dbStage = lead.stage || 'first_contact';
            const displayStage = stageDisplayMap[dbStage] || dbStage;
            if (!displayStages.includes(displayStage)) {
                reasons.push(`stage "${lead.stage}" no visible (mapea a "${displayStage}")`);
            }
            
            console.log(`      - Razón de exclusión: ${reasons.join('; ')}`);
        });

        // 5. Verificar distribución de stages
        console.log('\n5. DISTRIBUCIÓN DE STAGES:');
        const stageCount = {};
        
        allLeads.forEach(lead => {
            const stage = lead.stage || 'null';
            stageCount[stage] = (stageCount[stage] || 0) + 1;
        });
        
        Object.entries(stageCount).forEach(([stage, count]) => {
            const displayStage = stageDisplayMap[stage] || stage;
            const isVisible = displayStages.includes(displayStage);
            console.log(`   ${stage} → ${displayStage}: ${count} leads ${isVisible ? '(VISIBLE)' : '(NO VISIBLE)'}`);
        });

        // 6. Resumen final
        console.log('\n6. RESUMEN:');
        console.log(`   Total de leads en base de datos: ${allLeads.length}`);
        console.log(`   Leads con status='closed': ${allLeads.filter(l => l.status === 'closed').length}`);
        console.log(`   Leads con stage='closed': ${allLeads.filter(l => l.stage === 'closed').length}`);
        console.log(`   Leads con removed_from_funnel=true: ${allLeads.filter(l => l.metadata?.removed_from_funnel === true).length}`);
        console.log(`   Leads en stages no visibles: ${allLeads.filter(l => {
            const dbStage = l.stage || 'first_contact';
            const displayStage = stageDisplayMap[dbStage] || dbStage;
            return !displayStages.includes(displayStage);
        }).length}`);

    } catch (error) {
        console.error('Error general:', error);
    }
}

analyzeDifference();