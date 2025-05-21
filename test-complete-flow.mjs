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

async function testCompleteFlow() {
  console.log('=== TEST FLUJO COMPLETO DE ACTUALIZACIÓN DE ETAPA ===\n');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Variables de entorno no configuradas');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  const leadId = '08f89f3e-7441-4c99-96e4-745d813b9d09'; // Carolina López
  
  try {
    // Paso 1: Verificar estado actual del lead
    console.log('1. ESTADO ACTUAL DEL LEAD');
    const { data: currentLead, error: fetchError } = await supabase
      .from('leads')
      .select('id, full_name, stage, metadata')
      .eq('id', leadId)
      .single();
    
    if (fetchError) {
      console.error('Error al obtener lead:', fetchError);
      return;
    }
    
    console.log(`   Lead: ${currentLead.full_name}`);
    console.log(`   ID: ${currentLead.id}`);
    console.log(`   Stage actual: ${currentLead.stage}`);
    console.log(`   Metadata: ${JSON.stringify(currentLead.metadata)}\n`);
    
    // Paso 2: Simular respuesta del backend con salesStageId
    console.log('2. SIMULACIÓN DE RESPUESTA DEL BACKEND');
    const backendResponse = {
      text: "Perfecto Carolina, un placer conocerte. Para ayudarte mejor, ¿podrías compartirme tu teléfono o email?",
      data: {
        metadata: {
          salesStageId: "prospecting",
          currentLeadStage: "prospecting"
        }
      }
    };
    
    console.log(`   Respuesta simulada del backend:`);
    console.log(`   salesStageId: ${backendResponse.data.metadata.salesStageId}\n`);
    
    // Paso 3: Lo que debería hacer el frontend
    console.log('3. ACCIÓN DEL FRONTEND');
    const detectedSalesStageId = backendResponse.data?.metadata?.salesStageId;
    
    if (detectedSalesStageId) {
      console.log(`   ✓ Se detectó cambio de etapa: ${detectedSalesStageId}`);
      console.log(`   ✓ Frontend llama a updateLeadStage(${leadId}, ${detectedSalesStageId})\n`);
      
      // Paso 4: Simular actualización en la base de datos
      console.log('4. ACTUALIZACIÓN EN BASE DE DATOS');
      const { data: updated, error: updateError } = await supabase
        .from('leads')
        .update({
          stage: detectedSalesStageId,
          metadata: {
            ...currentLead.metadata,
            salesStageId: detectedSalesStageId,
            lastUpdatedFrom: 'chatbot'
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .select()
        .single();
      
      if (updateError) {
        console.error('   ✗ Error al actualizar:', updateError);
      } else {
        console.log(`   ✓ Lead actualizado exitosamente`);
        console.log(`   Nuevo stage: ${updated.stage}`);
        console.log(`   Metadata actualizada: ${JSON.stringify(updated.metadata)}\n`);
      }
      
      // Paso 5: Simular evento para el sales funnel
      console.log('5. EVENTO PARA SALES FUNNEL');
      console.log(`   ✓ Se emitiría evento 'lead-stage-updated' con:`);
      console.log(`     - leadId: ${leadId}`);
      console.log(`     - newStage: ${detectedSalesStageId}\n`);
      
      // Paso 6: Verificar el estado final
      console.log('6. ESTADO FINAL');
      const { data: finalLead, error: finalError } = await supabase
        .from('leads')
        .select('id, full_name, stage, metadata')
        .eq('id', leadId)
        .single();
      
      if (!finalError && finalLead) {
        console.log(`   Lead: ${finalLead.full_name}`);
        console.log(`   Stage: ${finalLead.stage}`);
        console.log(`   Cambio exitoso: ${currentLead.stage} → ${finalLead.stage}`);
      }
    } else {
      console.log('   ✗ No se detectó cambio de etapa en la respuesta');
    }
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

testCompleteFlow();