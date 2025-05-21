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
  console.log('[TEST] Verificando estructura de la tabla leads');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('[TEST] Error: Variables de entorno no configuradas');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Primero obtener un lead existente para ver su estructura
    const { data: sampleLead, error: sampleError } = await supabase
      .from('leads')
      .select('*')
      .limit(1)
      .maybeSingle();
    
    if (sampleLead) {
      console.log('[TEST] Estructura de un lead existente:');
      console.log(JSON.stringify(sampleLead, null, 2));
    }
    
    // Verificar si Carolina ya existe
    const { data: existing, error: checkError } = await supabase
      .from('leads')
      .select('id, full_name')
      .eq('full_name', 'Carolina López')
      .maybeSingle();
    
    if (existing) {
      console.log('[TEST] Lead ya existe:', existing);
      return existing;
    }
    
    // Crear nuevo lead con campos básicos
    const newLead = {
      full_name: 'Carolina López',
      stage: 'nuevos',
      source: 'test',
      metadata: {
        original_lead_id: '605ff65b-0920-480c-aace-0a3ca33b53ca',
        created_from: 'test_script'
      }
    };
    
    console.log('[TEST] Intentando crear lead:', newLead);
    
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