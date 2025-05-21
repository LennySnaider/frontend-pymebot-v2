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
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function verifyLeadAccess() {
  console.log('=== VERIFICACIÓN DE ACCESO A LEADS ===\n');
  
  // IDs de leads problemáticos según los logs
  const testLeadIds = [
    { id: '08f89f3e-7441-4c99-96e4-745d813b9d09', name: 'Carolina López' },
    { id: 'b2bc68dc-9c96-4872-9218-17bfe02b443b', name: 'Diego Vargas' },
    { id: '605ff65b-0920-480c-aace-0a3ca33b53ca', name: 'Lead a160b432...' }
  ];
  
  // Probar con ambas keys
  const keys = [
    { type: 'Anon Key (con RLS)', key: supabaseAnonKey },
    { type: 'Service Role Key (sin RLS)', key: supabaseServiceKey }
  ];
  
  for (const keyConfig of keys) {
    if (!keyConfig.key) continue;
    
    console.log(`\n=== Probando con ${keyConfig.type} ===`);
    const supabase = createClient(supabaseUrl, keyConfig.key);
    
    for (const lead of testLeadIds) {
      try {
        // Intento 1: Búsqueda directa
        const { data: direct, error: directError } = await supabase
          .from('leads')
          .select('id, full_name, stage, tenant_id')
          .eq('id', lead.id)
          .single();
        
        if (directError) {
          console.log(`❌ ${lead.name} (${lead.id}): ${directError.message}`);
        } else if (direct) {
          console.log(`✅ ${lead.name} encontrado:`, {
            id: direct.id,
            stage: direct.stage,
            tenant_id: direct.tenant_id
          });
        } else {
          console.log(`⚠️ ${lead.name}: No se encontró`);
        }
        
        // Intento 2: Si es Service Role, verificar RLS
        if (keyConfig.type.includes('Service Role') && direct) {
          const { data: policies, error: policyError } = await supabase
            .from('pg_policies')
            .select('policyname, permissive, cmd')
            .eq('tablename', 'leads');
          
          if (!policyError && policies) {
            console.log(`   Políticas RLS activas: ${policies.length}`);
          }
        }
        
      } catch (error) {
        console.error(`Error general con ${lead.name}:`, error);
      }
    }
  }
  
  console.log('\n=== ANÁLISIS ===');
  console.log('Si los leads se ven con Service Role pero no con Anon Key,');
  console.log('el problema es de RLS y necesitas autenticación adecuada.');
}

verifyLeadAccess();