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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function findAllCarolinas() {
  console.log('[SEARCH] Buscando todos los leads con nombre Carolina\n');
  
  // Intentar con ambas keys
  const keys = [
    { type: 'Service Role', key: supabaseServiceKey },
    { type: 'Anon', key: supabaseKey }
  ];
  
  for (const { type, key } of keys) {
    if (!key) continue;
    
    console.log(`=== Intentando con ${type} Key ===`);
    const supabase = createClient(supabaseUrl, key);
    
    try {
      // Búsqueda amplia
      const queries = [
        { method: 'ilike', pattern: '%carolina%' },
        { method: 'ilike', pattern: '%Carolina%' },
        { method: 'ilike', pattern: '%CAROLINA%' }
      ];
      
      for (const query of queries) {
        const { data: leads, error } = await supabase
          .from('leads')
          .select('id, full_name, stage, tenant_id, metadata')
          .ilike('full_name', query.pattern);
        
        if (error) {
          console.error(`Error con patrón "${query.pattern}":`, error.message);
        } else if (leads && leads.length > 0) {
          console.log(`\nLeads encontrados con patrón "${query.pattern}":`);
          leads.forEach(lead => {
            console.log(`\nID: ${lead.id}`);
            console.log(`Nombre: ${lead.full_name}`);
            console.log(`Stage: ${lead.stage}`);
            console.log(`Tenant: ${lead.tenant_id}`);
            if (lead.metadata) {
              console.log(`Metadata:`, JSON.stringify(lead.metadata, null, 2));
            }
          });
        } else {
          console.log(`No se encontraron leads con patrón "${query.pattern}"`);
        }
      }
      
      // Búsqueda por ID específico
      console.log('\n--- Buscando por ID específico ---');
      const specificId = '08f89f3e-7441-4c99-96e4-745d813b9d09';
      const { data: specificLead, error: specificError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', specificId)
        .maybeSingle();
      
      if (specificError) {
        console.error(`Error buscando ID ${specificId}:`, specificError.message);
      } else if (specificLead) {
        console.log(`\nLead encontrado con ID ${specificId}:`);
        console.log(JSON.stringify(specificLead, null, 2));
      } else {
        console.log(`No se encontró lead con ID ${specificId}`);
      }
      
    } catch (error) {
      console.error(`Error general con ${type} key:`, error);
    }
    
    console.log('\n' + '='.repeat(40) + '\n');
  }
}

findAllCarolinas();