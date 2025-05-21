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

async function createCarolinaWithTenant() {
  console.log('[TEST] Creando Carolina López con tenant_id correcto');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[TEST] Error: Variables de entorno no configuradas');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // Primero obtener un tenant_id válido de un lead existente
    const { data: existingLead, error: fetchError } = await supabase
      .from('leads')
      .select('tenant_id')
      .limit(1)
      .single();
    
    if (fetchError || !existingLead) {
      console.error('[TEST] Error al obtener tenant_id:', fetchError);
      return;
    }
    
    const tenantId = existingLead.tenant_id;
    console.log('[TEST] Usando tenant_id:', tenantId);
    
    // Verificar si Carolina ya existe
    const { data: existing, error: checkError } = await supabase
      .from('leads')
      .select('id, full_name, stage')
      .eq('full_name', 'Carolina López')
      .eq('tenant_id', tenantId)
      .maybeSingle();
    
    if (existing) {
      console.log('[TEST] Lead ya existe:', existing);
      
      // Actualizar el stage
      console.log('[TEST] Actualizando stage a "prospecting"');
      const { data: updated, error: updateError } = await supabase
        .from('leads')
        .update({ 
          stage: 'prospecting',
          metadata: {
            ...existing.metadata,
            salesStageId: 'prospecting',
            updated_via: 'test_script'
          }
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('[TEST] Error al actualizar:', updateError);
      } else {
        console.log('[TEST] Lead actualizado:', updated);
      }
      
      return existing;
    }
    
    // Crear nuevo lead
    const newLead = {
      full_name: 'Carolina López',
      stage: 'new',
      source: 'chatbot',
      tenant_id: tenantId,
      metadata: {
        original_lead_id: '605ff65b-0920-480c-aace-0a3ca33b53ca',
        created_from: 'test_script',
        salesStageId: 'nuevos'
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
    
    // Ahora probar actualización
    console.log('[TEST] Actualizando stage a "prospecting"');
    const { data: updated, error: updateError } = await supabase
      .from('leads')
      .update({ 
        stage: 'prospecting',
        metadata: {
          ...created.metadata,
          salesStageId: 'prospecting',
          updated_via: 'test_script'
        }
      })
      .eq('id', created.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('[TEST] Error al actualizar:', updateError);
    } else {
      console.log('[TEST] Lead actualizado exitosamente:');
      console.log('  - ID:', updated.id);
      console.log('  - Stage:', updated.stage);
      console.log('  - Metadata:', JSON.stringify(updated.metadata, null, 2));
    }
    
  } catch (error) {
    console.error('[TEST] Error general:', error);
  }
}

createCarolinaWithTenant();