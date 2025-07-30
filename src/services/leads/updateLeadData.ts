/**
 * Servicio básico para actualizar datos de leads
 */

import { supabase } from '@/services/supabase/SupabaseClient'

/**
 * Actualiza los datos básicos de un lead
 */
export async function updateLeadData(leadId: string, data: Record<string, any>) {
    if (!leadId) {
        const error = new Error('leadId es requerido para updateLeadData')
        console.error('updateLeadData: leadId faltante', { leadId, data })
        throw error
    }
    
    if (!data || typeof data !== 'object') {
        const error = new Error('data debe ser un objeto válido para updateLeadData')
        console.error('updateLeadData: data inválido', { leadId, data, dataType: typeof data })
        throw error
    }

    try {
        // Agregar timestamp de actualización
        const updateData = {
            ...data,
            updated_at: new Date().toISOString()
        }

        const { data: result, error } = await supabase
            .from('leads')
            .update(updateData)
            .eq('id', leadId)
            .select()
            .single()

        if (error) {
            console.error('Error actualizando lead:', error)
            throw new Error(error.message)
        }

        console.log(`Lead ${leadId} actualizado:`, result)
        return result

    } catch (error) {
        console.error('Error en updateLeadData:', error)
        throw error
    }
}

/**
 * Verifica si un string es un UUID válido
 */
function isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
}

/**
 * Actualiza el contador de mensajes de un lead
 * Maneja errores de forma silenciosa para no interrumpir el flujo del chat
 */
export async function updateLeadMessageCount(
    leadId: string, 
    messageCount: number, 
    lastMessage?: string
): Promise<boolean> {
    try {
        // Verificación básica de parámetros
        if (!leadId) {
            console.warn('updateLeadMessageCount: leadId requerido')
            return false
        }
        
        if (typeof messageCount !== 'number' || messageCount < 0) {
            console.warn('updateLeadMessageCount: messageCount inválido')
            return false
        }

        // Verificar si el leadId es un UUID válido (chat de prueba vs real)
        if (!isValidUUID(leadId)) {
            console.log('updateLeadMessageCount: Chat de prueba detectado, omitiendo actualización')
            return true // Simular éxito para chats de prueba
        }

        // Verificar que Supabase esté configurado
        if (!supabase) {
            console.warn('updateLeadMessageCount: Cliente Supabase no disponible')
            return true // Simular éxito
        }

        // Verificar si el lead existe antes de actualizar
        const { data: existingLead, error: checkError } = await supabase
            .from('leads')
            .select('id')
            .eq('id', leadId)
            .maybeSingle()

        if (checkError || !existingLead) {
            console.log('updateLeadMessageCount: Lead no encontrado, posiblemente chat de prueba')
            return true // Simular éxito para chats de prueba
        }

        // Preparar datos básicos para actualización
        const updateData: Record<string, any> = {
            updated_at: new Date().toISOString()
        }

        // Añadir campos opcionales solo si es posible
        try {
            updateData.message_count = messageCount
            updateData.last_contact_date = new Date().toISOString()
            
            if (lastMessage) {
                updateData.last_message = lastMessage.substring(0, 500)
            }
        } catch (e) {
            // Campos opcionales, continuar sin ellos
        }

        // Intentar actualizar
        const { data: result, error } = await supabase
            .from('leads')
            .update(updateData)
            .eq('id', leadId)
            .select('id')

        if (error) {
            console.warn('updateLeadMessageCount: Error silenciado de Supabase (no crítico):', {
                leadId: leadId.substring(0, 8) + '...',
                errorCode: error.code || 'unknown',
                errorMessage: error.message || 'empty'
            })
            return true // Simular éxito para no interrumpir el chat
        }

        if (result && result.length > 0) {
            console.log('updateLeadMessageCount: Actualización exitosa')
            return true
        }

        return false

    } catch (error) {
        // Manejo silencioso de errores para no interrumpir el chat
        console.warn('updateLeadMessageCount: Error manejado silenciosamente:', {
            type: error instanceof Error ? error.name : typeof error,
            message: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // NO lanzar error - devolver false para indicar falla pero continuar
        return false
    }
}
