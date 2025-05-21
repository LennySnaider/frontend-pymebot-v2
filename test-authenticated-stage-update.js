import { createClient } from './src/services/supabase/server.ts';

async function testAuthenticatedUpdateLeadStage() {
  console.log('[TEST] Probando actualización de etapa con cliente autenticado del servidor');
  
  try {
    // Test lead ID
    const leadId = '605ff65b-0920-480c-aace-0a3ca33b53ca';
    const newStage = 'prospecting';
    
    // Crear cliente autenticado
    const supabase = createClient();
    
    // Primero verificar si el lead existe
    console.log('[TEST] Verificando si existe el lead:', leadId);
    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('id, full_name, stage')
      .eq('id', leadId)
      .single();
    
    if (fetchError) {
      console.error('[TEST] Error al buscar lead:', fetchError);
      return;
    }
    
    if (!lead) {
      console.log('[TEST] Lead no encontrado');
      return;
    }
    
    console.log('[TEST] Lead encontrado:', lead);
    console.log('[TEST] Etapa actual:', lead.stage);
    
    // Actualizar etapa
    console.log('[TEST] Actualizando etapa a:', newStage);
    const { data: updated, error: updateError } = await supabase
      .from('leads')
      .update({
        stage: newStage,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId)
      .select('id, full_name, stage')
      .single();
    
    if (updateError) {
      console.error('[TEST] Error al actualizar:', updateError);
      return;
    }
    
    console.log('[TEST] Actualización exitosa:', updated);
    console.log('[TEST] Nueva etapa:', updated.stage);
    
  } catch (error) {
    console.error('[TEST] Error general:', error);
  }
}

// Ejecutar test
testAuthenticatedUpdateLeadStage();