/**
 * Servicio para actualizar datos de leads
 * @version 1.0.0
 */

import { supabase } from '@/services/supabase/SupabaseClient'

export interface LeadUpdateData {
    full_name?: string
    email?: string
    phone?: string
    notes?: string
    budget_min?: number
    budget_max?: number
    property_type?: string
    source?: string
    interest_level?: string
    metadata?: Record<string, any>
}

/**
 * Actualiza los datos de un lead en la base de datos
 * @param leadId ID del lead a actualizar
 * @param data Datos a actualizar
 * @returns Promesa con el resultado de la actualización
 */
export async function updateLeadData(leadId: string, data: LeadUpdateData) {
    try {
        console.log(`Actualizando lead ${leadId} con datos:`, data)
        
        // Filtrar solo los campos que tienen valor
        const updateData: Record<string, any> = {}
        
        if (data.full_name) updateData.full_name = data.full_name
        if (data.email) updateData.email = data.email
        if (data.phone) updateData.phone = data.phone
        if (data.notes) updateData.notes = data.notes
        if (data.budget_min !== undefined) updateData.budget_min = data.budget_min
        if (data.budget_max !== undefined) updateData.budget_max = data.budget_max
        if (data.property_type) updateData.property_type = data.property_type
        if (data.source) updateData.source = data.source
        if (data.interest_level) updateData.interest_level = data.interest_level
        
        // Combinar metadata existente con nueva
        if (data.metadata) {
            const { data: existingLead, error: fetchError } = await supabase
                .from('leads')
                .select('metadata')
                .eq('id', leadId)
                .single()
            
            if (fetchError) {
                console.error('Error obteniendo lead existente:', fetchError)
            } else {
                updateData.metadata = {
                    ...(existingLead?.metadata || {}),
                    ...data.metadata
                }
            }
        }
        
        // Actualizar en la base de datos
        const { data: updatedLead, error } = await supabase
            .from('leads')
            .update(updateData)
            .eq('id', leadId)
            .select()
            .single()
        
        if (error) {
            throw error
        }
        
        console.log('Lead actualizado exitosamente:', updatedLead)
        
        // Actualizar caché global si está disponible
        if (typeof window !== 'undefined' && (window as any).__globalLeadCache) {
            const cache = (window as any).__globalLeadCache
            if (data.full_name) {
                cache.updateLeadData(leadId, { name: data.full_name })
            }
        }
        
        // Emitir evento de actualización
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('lead-updated', {
                detail: { leadId, data: updateData },
                bubbles: true
            }))
        }
        
        return { success: true, data: updatedLead }
    } catch (error) {
        console.error('Error actualizando lead:', error)
        return { success: false, error }
    }
}

/**
 * Extrae datos del lead desde el contenido del mensaje
 * @param messageContent Contenido del mensaje a analizar
 * @returns Datos extraídos del lead
 */
export function extractLeadDataFromMessage(messageContent: string): LeadUpdateData {
    const leadData: LeadUpdateData = {}
    
    // Extraer email
    const emailMatch = messageContent.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/)
    if (emailMatch) {
        leadData.email = emailMatch[0]
    }
    
    // Extraer teléfono (varios formatos)
    const phoneMatch = messageContent.match(/(\+?[0-9]{1,3}[-\s]?)?(\(?[0-9]{3}\)?[-\s]?[0-9]{3}[-\s]?[0-9]{4})/)
    if (phoneMatch) {
        leadData.phone = phoneMatch[0].replace(/[-\s\(\)]/g, '')
    }
    
    // Extraer nombre (más complejo, buscar patrones comunes)
    const namePatterns = [
        /mi nombre es ([A-Za-zÀ-ÿ\s]+)/i,
        /me llamo ([A-Za-zÀ-ÿ\s]+)/i,
        /soy ([A-Za-zÀ-ÿ\s]+)/i,
        /nombre:\s*([A-Za-zÀ-ÿ\s]+)/i
    ]
    
    for (const pattern of namePatterns) {
        const nameMatch = messageContent.match(pattern)
        if (nameMatch && nameMatch[1]) {
            leadData.full_name = nameMatch[1].trim()
            break
        }
    }
    
    return leadData
}

/**
 * Actualiza el contador de mensajes de un lead
 * @param leadId ID del lead
 * @param messageCount Nuevo contador de mensajes
 * @param lastMessage Último mensaje (opcional)
 */
export async function updateLeadMessageCount(leadId: string, messageCount: number, lastMessage?: string) {
    try {
        console.log(`Actualizando contador de mensajes para lead ${leadId}: ${messageCount} mensajes`)
        
        // Obtener metadata existente
        const { data: existingLead, error: fetchError } = await supabase
            .from('leads')
            .select('metadata')
            .eq('id', leadId)
            .single()
        
        if (fetchError) {
            console.error('Error obteniendo lead existente:', fetchError)
            return { success: false, error: fetchError }
        }
        
        // Preparar metadata actualizada
        const updatedMetadata = {
            ...(existingLead?.metadata || {}),
            message_count: messageCount,
            last_activity: new Date().toISOString()
        }
        
        // Si hay último mensaje, agregarlo
        if (lastMessage) {
            updatedMetadata.last_message = lastMessage.length > 100 
                ? lastMessage.substring(0, 97) + '...' 
                : lastMessage
        }
        
        // Actualizar en la base de datos
        const { data: updatedLead, error } = await supabase
            .from('leads')
            .update({ 
                metadata: updatedMetadata,
                last_contact_date: new Date().toISOString()
            })
            .eq('id', leadId)
            .select()
            .single()
        
        if (error) {
            throw error
        }
        
        console.log('Contador de mensajes actualizado exitosamente')
        
        // Emitir evento de actualización
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('lead-message-count-updated', {
                detail: { leadId, messageCount, lastMessage },
                bubbles: true
            }))
        }
        
        return { success: true, data: updatedLead }
    } catch (error) {
        console.error('Error actualizando contador de mensajes:', error)
        return { success: false, error }
    }
}
