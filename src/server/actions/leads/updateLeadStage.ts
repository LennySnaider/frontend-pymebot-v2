/**
 * Server action para actualizar la etapa de un lead en la base de datos
 * Esta acción es llamada cuando se mueve un lead entre columnas en el tablero Kanban
 * Mejorada para mejor compatibilidad y manejo de IDs internos vs. externos.
 * 
 * @version 1.2.0
 * @updated 2025-04-14
 */

import { SupabaseClient } from '@/services/supabase/SupabaseClient'

type UpdateResult = {
  success: boolean
  stageChanged?: boolean
  error?: string
  leadId?: string
  newStage?: string
  previousStage?: string
}

export const updateLeadStage = async (
  leadId: string,
  newStage: string
): Promise<UpdateResult> => {
  try {
    console.log(`Iniciando updateLeadStage - leadId: ${leadId}, newStage: ${newStage}`);

    // Obtener el cliente Supabase
    const supabase = SupabaseClient.getInstance()
    
    if (!supabase) {
      console.error('Error: No se pudo obtener el cliente Supabase.');
      return {
        success: false,
        error: 'Error: No se pudo obtener el cliente Supabase.'
      };
    }

    // Prueba básica de conexión a Supabase
    try {
      await supabase.from('sys_config').select('id').limit(1)
      console.log('Prueba de conexión a Supabase exitosa');
    } catch (connError) {
      console.error('Error en prueba de conexión a Supabase:', connError);
    }

    // Primero verificamos si el lead existe y obtenemos su etapa actual
    console.log(`Buscando lead con ID: ${leadId}`);
    
    // Consulta para ver si el lead existe directamente en la tabla leads
    const { data: existingLead, error: fetchError } = await supabase
      .from('leads')
      .select('stage, id, full_name')
      .eq('id', leadId)
      .single()
    
    console.log('SQL ejecutado:', `SELECT stage, id, full_name FROM leads WHERE id = '${leadId}'`);

    if (fetchError) {
      // Si hay un error al buscar por ID principal, buscar si hay un lead con este ID en metadata
      console.log(`Error al buscar lead directo, buscando en metadata.original_lead_id: ${leadId}`);
      
      const { data: metadataLeads, error: metadataError } = await supabase
        .from('leads')
        .select('id, full_name, stage, metadata')
        .contains('metadata', { original_lead_id: leadId })
        .limit(10);
      
      if (metadataError || !metadataLeads || metadataLeads.length === 0) {
        console.error('Error al buscar lead en metadata:', metadataError || 'No se encontraron resultados');
        return {
          success: false,
          error: `Error al buscar el lead: ${fetchError.message}`,
          leadId
        }
      }
      
      // Usar el primer lead encontrado
      const mappedLead = metadataLeads[0];
      console.log(`Lead encontrado vía metadata - ID real: ${mappedLead.id}, ID original: ${leadId}`);
      
      // A partir de aquí usamos el ID real de la base de datos
      const realLeadId = mappedLead.id;
      
      // Continuar con el ID real
      return updateLeadWithRealId(supabase, realLeadId, newStage, mappedLead);
    }

    if (!existingLead) {
      console.error(`No se encontró el lead con ID: ${leadId}`);
      return {
        success: false,
        error: `No se encontró el lead con ID: ${leadId}`,
        leadId
      }
    }

    console.log(`Lead encontrado directamente - ID: ${existingLead.id}, Nombre: ${existingLead.full_name}, Etapa actual: ${existingLead.stage}`);
    
    // Continuar con el proceso normal
    return updateLeadWithRealId(supabase, leadId, newStage, existingLead);
    
  } catch (error: any) {
    console.error('Error en updateLeadStage:', error);
    return {
      success: false,
      error: error.message || 'Error interno del servidor',
      leadId
    }
  }
}

// Función auxiliar para actualizar el lead con su ID real en la base de datos
const updateLeadWithRealId = async (
  supabase: any, 
  realLeadId: string, 
  newStage: string,
  existingLead: any
): Promise<UpdateResult> => {
  // Validación especial para closed y confirmed: siempre permitirlos
  if (newStage === 'closed' || newStage === 'confirmed') {
    console.log(`Forzando etapa especial: ${newStage} para lead ${realLeadId}`);
    
    // Actualizar directamente sin validaciones adicionales
    const { error, data } = await supabase
      .from('leads')
      .update({
        stage: newStage,
        updated_at: new Date().toISOString()
      })
      .eq('id', realLeadId)
      .select('stage, id, full_name')
      .single();

    if (error) {
      console.error(`Error al forzar etapa ${newStage}:`, error);
      return {
        success: false,
        error: `Error al actualizar la etapa del lead a ${newStage}: ${error.message}`,
        leadId: realLeadId,
        previousStage: existingLead.stage
      }
    }

    console.log(`Etapa forzada exitosamente a ${newStage} - ID: ${realLeadId}`, data);

    return {
      success: true,
      stageChanged: true,
      leadId: realLeadId,
      newStage: newStage,
      previousStage: existingLead.stage
    }
  }
  
  // Para otras etapas, usar el proceso normal
  // Asegurarnos que estamos hablando de la misma columna/etapa
  // En algunos casos la columna podría llamarse "qualification" y el campo stage "qualified"
  // Hacemos un mapeo para asegurar consistencia
  const stageMap: Record<string, string> = {
    'new': 'first_contact', // Usamos first_contact como el valor real en la base de datos
    'first_contact': 'first_contact',
    'prospecting': 'prospecting',
    'qualification': 'qualification',
    'opportunity': 'opportunity',
    'confirmed': 'confirmed',
    'closed': 'closed'
  };
  
  console.log('[DEBUG] updateLeadWithRealId - Mapeando etapas:');
  console.log('  newStage (entrada):', newStage);
  console.log('  stageMap:', stageMap);
  
  // Obtener el valor de stage normalizado para la base de datos
  const normalizedStage = stageMap[newStage] || newStage;
  console.log('  normalizedStage (salida):', normalizedStage);

  // Si la etapa no ha cambiado, no hacemos nada
  if (existingLead.stage === normalizedStage) {
    console.log(`La etapa no ha cambiado (${existingLead.stage} -> ${normalizedStage}). No se realiza actualización.`);
    return {
      success: true,
      stageChanged: false,
      leadId: realLeadId,
      newStage: normalizedStage,
      previousStage: existingLead.stage
    }
  }

  console.log(`Actualizando etapa del lead - ID: ${realLeadId}, Etapa anterior: ${existingLead.stage}, Nueva etapa: ${normalizedStage}`);

  // Actualizar la etapa del lead en la base de datos
  console.log('SQL a ejecutar:', `UPDATE leads SET stage = '${normalizedStage}', updated_at = '${new Date().toISOString()}' WHERE id = '${realLeadId}'`);
  
  const { error, data } = await supabase
    .from('leads')
    .update({
      stage: normalizedStage,
      updated_at: new Date().toISOString()
    })
    .eq('id', realLeadId)
    .select('stage, id, full_name')
    .single();

  if (error) {
    console.error('Error al actualizar la etapa del lead:', error);
    return {
      success: false,
      error: `Error al actualizar la etapa del lead: ${error.message}`,
      leadId: realLeadId,
      previousStage: existingLead.stage
    }
  }

  console.log(`Etapa actualizada exitosamente - ID: ${realLeadId}, Nueva etapa: ${normalizedStage}, Lead actualizado:`, data);

  // Si llegamos aquí, la actualización fue exitosa
  return {
    success: true,
    stageChanged: true,
    leadId: realLeadId,
    newStage: normalizedStage,
    previousStage: existingLead.stage
  }
}
