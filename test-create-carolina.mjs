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

async function createCarolinaLopez() {
  console.log('[TEST] Creando lead Carolina López');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('[TEST] Error: Variables de entorno no configuradas');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Primero verificar si existe
    const { data: existing, error: checkError } = await supabase
      .from('leads')
      .select('id, full_name')
      .eq('full_name', 'Carolina López')
      .maybeSingle();
    
    if (checkError) {
      console.error('[TEST] Error al verificar existencia:', checkError);
      return;
    }
    
    if (existing) {
      console.log('[TEST] Lead ya existe:', existing);
      return existing;
    }
    
    // Crear nuevo lead
    const newLead = {
      full_name: 'Carolina López',
      stage: 'nuevos',
      source: 'test',
      contact_info: {
        phone: '1234567890',
        email: 'carolina@test.com'
      },
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
      return;
    }
    
    console.log('[TEST] Lead creado exitosamente:');
    console.log('  - ID:', created.id);
    console.log('  - Nombre:', created.full_name);
    console.log('  - Stage:', created.stage);
    console.log('  - Metadata:', JSON.stringify(created.metadata, null, 2));
    
  } catch (error) {
    console.error('[TEST] Error general:', error);
  }
}

createCarolinaLopez();