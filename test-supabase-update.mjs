import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testUpdateLeadStage() {
  console.log('[TEST] Iniciando prueba directa de actualización de lead');
  console.log('[TEST] URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NO CONFIGURADA');
  console.log('[TEST] Key:', supabaseKey ? 'Configurada' : 'NO CONFIGURADA');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('[TEST] Error: Variables de entorno no configuradas');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const leadId = '605ff65b-0920-480c-aace-0a3ca33b53ca';
  const newStage = 'prospecting';
  
  try {
    // Buscar lead
    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('id, full_name, stage')
      .eq('id', leadId)
      .maybeSingle();
    
    console.log('[TEST] Resultado búsqueda:', { lead, error: fetchError });
    
    if (fetchError) {
      console.error('[TEST] Error al buscar lead:', fetchError);
      return;
    }
    
    if (!lead) {
      console.log('[TEST] Lead no encontrado con ID:', leadId);
      
      // Intentar buscar por metadata
      const { data: metadataLeads, error: metadataError } = await supabase
        .from('leads')
        .select('id, full_name, stage, metadata')
        .limit(10);
      
      console.log('[TEST] Primeros 10 leads en la base de datos:');
      metadataLeads?.forEach(l => {
        console.log(`  - ID: ${l.id}, Nombre: ${l.full_name}, Stage: ${l.stage}`);
      });
      
      return;
    }
    
    console.log('[TEST] Lead encontrado:', lead);
    console.log('[TEST] Etapa actual:', lead.stage);
    
    // Si ya está en la etapa objetivo, cambiar a otra
    const targetStage = lead.stage === newStage ? 'qualification' : newStage;
    console.log('[TEST] Actualizando a etapa:', targetStage);
    
    // Actualizar
    const { data: updated, error: updateError } = await supabase
      .from('leads')
      .update({
        stage: targetStage,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId)
      .select()
      .single();
    
    console.log('[TEST] Resultado actualización:', { updated, error: updateError });
    
  } catch (error) {
    console.error('[TEST] Error general:', error);
  }
}

testUpdateLeadStage();