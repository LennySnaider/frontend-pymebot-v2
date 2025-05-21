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

async function findCarolinaLopez() {
  console.log('[TEST] Buscando Carolina López en la base de datos');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('[TEST] Error: Variables de entorno no configuradas');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Buscar por nombre
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, full_name, stage, metadata')
      .or(`full_name.ilike.%Carolina López%,full_name.ilike.%Carolina Lopez%`)
      .limit(10);
    
    if (error) {
      console.error('[TEST] Error al buscar leads:', error);
      return;
    }
    
    console.log('[TEST] Leads encontrados con nombre Carolina López:');
    if (leads && leads.length > 0) {
      leads.forEach(lead => {
        console.log(`  - ID: ${lead.id}`);
        console.log(`    Nombre: ${lead.full_name}`);
        console.log(`    Stage: ${lead.stage}`);
        if (lead.metadata) {
          console.log(`    Metadata:`, JSON.stringify(lead.metadata, null, 2));
        }
        console.log('---');
      });
    } else {
      console.log('[TEST] No se encontraron leads con ese nombre');
      
      // Buscar por metadata
      console.log('[TEST] Buscando en metadata por ID: 605ff65b-0920-480c-aace-0a3ca33b53ca');
      const { data: metadataLeads, error: metadataError } = await supabase
        .from('leads')
        .select('id, full_name, stage, metadata')
        .or(`metadata->original_lead_id.eq.605ff65b-0920-480c-aace-0a3ca33b53ca,metadata->db_id.eq.605ff65b-0920-480c-aace-0a3ca33b53ca`)
        .limit(10);
      
      if (metadataLeads && metadataLeads.length > 0) {
        console.log('[TEST] Leads encontrados por metadata:');
        metadataLeads.forEach(lead => {
          console.log(`  - ID: ${lead.id}`);
          console.log(`    Nombre: ${lead.full_name}`);
          console.log(`    Stage: ${lead.stage}`);
          console.log(`    Metadata:`, JSON.stringify(lead.metadata, null, 2));
          console.log('---');
        });
      } else {
        console.log('[TEST] No se encontraron leads con ese ID en metadata');
      }
    }
    
  } catch (error) {
    console.error('[TEST] Error general:', error);
  }
}

findCarolinaLopez();