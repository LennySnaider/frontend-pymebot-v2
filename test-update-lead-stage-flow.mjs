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

async function testUpdateLeadStageFlow() {
  console.log('=== TEST FLUJO COMPLETO DE ACTUALIZACIÓN DE ETAPA ===\n');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const leadId = '08f89f3e-7441-4c99-96e4-745d813b9d09'; // Carolina López
  
  try {
    // Paso 1: Verificar estado actual
    console.log('1. ESTADO ACTUAL');
    const { data: currentLead, error: fetchError } = await supabase
      .from('leads')
      .select('id, full_name, stage')
      .eq('id', leadId)
      .single();
    
    if (fetchError || !currentLead) {
      console.error('Error al obtener lead:', fetchError);
      return;
    }
    
    console.log(`   Lead: ${currentLead.full_name}`);
    console.log(`   ID: ${currentLead.id}`);
    console.log(`   Stage actual: ${currentLead.stage}\n`);
    
    // Paso 2: Simular flujo de conversación
    console.log('2. SIMULACIÓN DE FLUJO DE CONVERSACIÓN');
    
    const stages = [
      { name: 'nuevos', trigger: 'Inicio de conversación' },
      { name: 'prospecting', trigger: 'Usuario da su nombre' },
      { name: 'qualification', trigger: 'Usuario da contacto' }
    ];
    
    for (const stage of stages) {
      if (currentLead.stage === stage.name) {
        console.log(`   ⚠️ Lead ya está en etapa ${stage.name}`);
        continue;
      }
      
      console.log(`\n   Evento: ${stage.trigger}`);
      console.log(`   Nueva etapa: ${stage.name}`);
      
      // Actualizar en la base de datos
      const { data: updated, error: updateError } = await supabase
        .from('leads')
        .update({
          stage: stage.name,
          metadata: {
            ...currentLead.metadata,
            salesStageId: stage.name,
            updatedFrom: 'test_flow'
          }
        })
        .eq('id', leadId)
        .select('stage')
        .single();
      
      if (updateError) {
        console.error(`   ✗ Error al actualizar: ${updateError.message}`);
      } else {
        console.log(`   ✓ Actualizado exitosamente a: ${updated.stage}`);
      }
      
      // Simular delay entre actualizaciones
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Paso 3: Verificar estado final
    console.log('\n3. ESTADO FINAL');
    const { data: finalLead, error: finalError } = await supabase
      .from('leads')
      .select('id, full_name, stage, metadata')
      .eq('id', leadId)
      .single();
    
    if (!finalError && finalLead) {
      console.log(`   Lead: ${finalLead.full_name}`);
      console.log(`   Stage: ${finalLead.stage}`);
      console.log(`   Metadata:`, JSON.stringify(finalLead.metadata, null, 2));
    }
    
    // Resetear a estado original si se cambió
    if (finalLead && finalLead.stage !== 'new') {
      console.log('\n4. RESETEANDO A ESTADO ORIGINAL');
      await supabase
        .from('leads')
        .update({
          stage: 'new',
          metadata: {
            ...finalLead.metadata,
            salesStageId: 'nuevos'
          }
        })
        .eq('id', leadId);
      console.log('   ✓ Lead reseteado a stage "new"');
    }
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

testUpdateLeadStageFlow();