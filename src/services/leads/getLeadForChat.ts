import { createClient } from '@/services/supabase/server'

/**
 * Servicio para obtener información del lead asociado a un chat
 * Maneja casos donde el chat ID no corresponde directamente al lead ID
 */
export async function getLeadForChat(chatId: string) {
  try {
    const supabase = await createClient()
    
    // Si el chatId tiene el prefijo 'lead_', intentar buscar directamente
    if (chatId.startsWith('lead_')) {
      const leadId = chatId.substring(5)
      
      const { data, error } = await supabase
        .from('leads')
        .select('id, full_name, stage, metadata')
        .eq('id', leadId)
        .single()
      
      if (!error && data) {
        return { success: true, lead: data }
      }
    }
    
    // Si no se encuentra directamente, buscar en metadata o por otros criterios
    // Por ejemplo, buscar si el chatId está almacenado en metadata
    const { data: metadataLeads, error: metadataError } = await supabase
      .from('leads')
      .select('id, full_name, stage, metadata')
      .filter('metadata->chat_id', 'eq', chatId)
      .single()
    
    if (!metadataError && metadataLeads) {
      return { success: true, lead: metadataLeads }
    }
    
    // Si aún no se encuentra, podría ser un ID de usuario o agente
    // Aquí podrías implementar lógica adicional según tu estructura de datos
    
    return {
      success: false,
      error: `No se encontró lead asociado al chat ${chatId}`
    }
    
  } catch (error) {
    console.error('Error en getLeadForChat:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}