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
 * Actualiza el contador de mensajes de un lead
 */
export async function updateLeadMessageCount(
    leadId: string, 
    messageCount: number, 
    lastMessage?: string
) {
    if (!leadId) {
        const error = new Error('leadId es requerido')
        console.error('updateLeadMessageCount: leadId faltante', { leadId, messageCount, lastMessage })
        throw error
    }
    
    if (typeof messageCount !== 'number' || messageCount < 0) {
        const error = new Error('messageCount debe ser un número positivo')
        console.error('updateLeadMessageCount: messageCount inválido', { leadId, messageCount, lastMessage })
        throw error
    }

    console.log('updateLeadMessageCount: Iniciando actualización', { 
        leadId, 
        messageCount, 
        lastMessage: lastMessage?.substring(0, 50) 
    })

    // Verificar que Supabase esté inicializado
    if (!supabase) {
        const error = new Error('Cliente Supabase no está inicializado')
        console.error('updateLeadMessageCount: Supabase no inicializado')
        throw error
    }

    try {
        const updateData: Record<string, any> = {
            message_count: messageCount,
            last_contact: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        if (lastMessage) {
            updateData.last_message = lastMessage.substring(0, 200)
        }

        console.log('updateLeadMessageCount: Ejecutando query Supabase', {
            leadId,
            updateData,
            table: 'leads'
        })

        const { data: result, error } = await supabase
            .from('leads')
            .update(updateData)
            .eq('id', leadId)

        console.log('updateLeadMessageCount: Respuesta de Supabase', {
            leadId,
            result,
            error,
            hasError: !!error,
            hasResult: !!result
        })

        if (error) {
            console.error('Error actualizando contador de mensajes en Supabase:', {
                leadId,
                messageCount,
                lastMessage: lastMessage?.substring(0, 50),
                updateData,
                error: {
                    message: error.message || 'No hay mensaje de error',
                    details: error.details || 'No hay detalles',
                    hint: error.hint || 'No hay hint',
                    code: error.code || 'No hay código',
                    errorString: error.toString(),
                    fullError: error
                }
            })
            throw new Error(`Error de Supabase actualizando lead: ${error.message || 'Error desconocido'}`)
        }

        console.log('updateLeadMessageCount: Actualización exitosa', { leadId, messageCount })
        return true

    } catch (error) {
        const errorInfo = {
            leadId,
            messageCount,
            lastMessage: lastMessage?.substring(0, 50),
            error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : {
                type: typeof error,
                value: error,
                string: String(error),
                json: JSON.stringify(error)
            },
            timestamp: new Date().toISOString()
        }
        
        console.error('Error en updateLeadMessageCount:', errorInfo)
        
        // Re-lanzar el error con más información para que sea capturado arriba
        throw new Error(`updateLeadMessageCount falló: ${error instanceof Error ? error.message : String(error)}`)
    }
}
