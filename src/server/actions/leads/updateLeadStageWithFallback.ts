/**
 * Versión alternativa de updateLeadStage con fallback
 * Si el lead no existe, lo crea con datos mínimos
 */

import { SupabaseClient } from '@/services/supabase/SupabaseClient'

export const updateLeadStageWithFallback = async (
  leadId: string,
  newStage: string,
  leadData?: any // Datos opcionales del lead para crearlo si no existe
): Promise<any> => {
  try {
    console.log(`[Fallback] Iniciando actualización - leadId: ${leadId}, newStage: ${newStage}`);
    
    const supabase = SupabaseClient.getInstance();
    
    if (!supabase) {
      return {
        success: false,
        error: 'No se pudo obtener el cliente Supabase'
      };
    }
    
    // Primero intentar actualizar directamente
    console.log('[Fallback] Intentando actualización directa...');
    const { data: updateData, error: updateError } = await supabase
      .from('leads')
      .update({
        stage: newStage,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId)
      .select();
    
    if (!updateError && updateData && updateData.length > 0) {
      console.log('[Fallback] Actualización directa exitosa');
      return {
        success: true,
        stageChanged: true,
        leadId: leadId,
        newStage: newStage
      };
    }
    
    // Si falla, buscar en metadata
    console.log('[Fallback] Buscando en metadata...');
    const { data: metadataLeads } = await supabase
      .from('leads')
      .select('*')
      .or(`metadata->original_lead_id.eq.${leadId},metadata->db_id.eq.${leadId},metadata->real_id.eq.${leadId}`)
      .limit(1);
    
    if (metadataLeads && metadataLeads.length > 0) {
      const realLead = metadataLeads[0];
      console.log(`[Fallback] Lead encontrado por metadata, ID real: ${realLead.id}`);
      
      // Actualizar con el ID real
      const { error: realUpdateError } = await supabase
        .from('leads')
        .update({
          stage: newStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', realLead.id);
      
      if (!realUpdateError) {
        return {
          success: true,
          stageChanged: true,
          leadId: realLead.id,
          newStage: newStage,
          previousStage: realLead.stage
        };
      }
    }
    
    // Si aún no encontramos el lead, crearlo como fallback
    if (leadData) {
      console.log('[Fallback] Lead no encontrado, creando nuevo...');
      
      const newLead = {
        id: leadId,
        stage: newStage,
        full_name: leadData.name || leadData.full_name || 'Lead sin nombre',
        tenant_id: leadData.tenant_id || process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID,
        metadata: {
          ...leadData.metadata,
          original_lead_id: leadId,
          created_from_fallback: true,
          created_at: new Date().toISOString()
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: insertedLead, error: insertError } = await supabase
        .from('leads')
        .insert(newLead)
        .select()
        .single();
      
      if (!insertError && insertedLead) {
        console.log('[Fallback] Lead creado exitosamente');
        return {
          success: true,
          stageChanged: true,
          leadId: insertedLead.id,
          newStage: newStage,
          created: true
        };
      } else {
        console.error('[Fallback] Error al crear lead:', insertError);
      }
    }
    
    // Si todo falla, retornar error
    return {
      success: false,
      error: `No se pudo actualizar ni crear el lead con ID: ${leadId}`
    };
    
  } catch (error: any) {
    console.error('[Fallback] Error general:', error);
    return {
      success: false,
      error: error.message || 'Error interno del servidor'
    };
  }
}