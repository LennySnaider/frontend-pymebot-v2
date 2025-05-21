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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function createLeadWithServiceKey() {
  console.log('[TEST] Intentando crear lead con service key');
  
  // Intentar con service key primero
  const supabaseKey = supabaseServiceKey || supabaseAnonKey;
  console.log('[TEST] Usando key tipo:', supabaseServiceKey ? 'Service Role' : 'Anon');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('[TEST] Error: Variables de entorno no configuradas');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // Crear lead de prueba
    const newLead = {
      full_name: 'Carolina López',
      stage: 'nuevos',
      source: 'chatbot',
      metadata: {
        original_lead_id: '605ff65b-0920-480c-aace-0a3ca33b53ca',
        created_from: 'test_script'
      }
    };
    
    console.log('[TEST] Creando lead:', newLead);
    
    const { data: created, error: createError } = await supabase
      .from('leads')
      .insert([newLead])
      .select()
      .single();
    
    if (createError) {
      console.error('[TEST] Error al crear lead:', createError);
      
      // Si falla, intentar listar leads existentes
      console.log('[TEST] Intentando listar leads existentes:');
      const { data: existingLeads, error: listError } = await supabase
        .from('leads')
        .select('id, full_name, stage')
        .limit(5);
      
      if (listError) {
        console.error('[TEST] Error al listar leads:', listError);
      } else {
        console.log('[TEST] Leads existentes:', existingLeads);
      }
      
      return;
    }
    
    console.log('[TEST] Lead creado exitosamente:');
    console.log('  - ID:', created.id);
    console.log('  - Nombre:', created.full_name);
    console.log('  - Stage:', created.stage);
    
    // Ahora intentar actualizarlo
    console.log('[TEST] Actualizando stage a "prospecting"');
    const { data: updated, error: updateError } = await supabase
      .from('leads')
      .update({ stage: 'prospecting' })
      .eq('id', created.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('[TEST] Error al actualizar:', updateError);
    } else {
      console.log('[TEST] Lead actualizado:', updated);
    }
    
  } catch (error) {
    console.error('[TEST] Error general:', error);
  }
}

createLeadWithServiceKey();