/**
 * server/actions/agents/updateAgentAvailability.ts
 * Acción del servidor para actualizar la disponibilidad de un agente.
 * 
 * @version 1.0.0
 * @updated 2025-06-25
 */

'use server'

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '../tenant/getTenantFromSession'

export interface TimeSlot {
    start: string; // Formato "HH:MM"
    end: string;   // Formato "HH:MM"
}

export type DailyAvailability = {
    enabled: boolean;
    slots: TimeSlot[];
}

export interface AgentAvailabilityUpdate {
    monday?: DailyAvailability;
    tuesday?: DailyAvailability;
    wednesday?: DailyAvailability;
    thursday?: DailyAvailability;
    friday?: DailyAvailability;
    saturday?: DailyAvailability;
    sunday?: DailyAvailability;
    exceptions?: {
        [date: string]: {
            available: boolean;
            slots?: TimeSlot[];
        };
    };
}

export async function updateAgentAvailability(agentId: string, availability: AgentAvailabilityUpdate) {
    try {
        const supabase = SupabaseClient.getInstance()
        
        // Obtener el tenant actual
        const tenant_id = await getTenantFromSession()
        
        if (!tenant_id) {
            throw new Error('No se pudo obtener el tenant_id')
        }
        
        // Verificar que el usuario existe, tiene rol agent y pertenece al tenant actual
        const { data: user, error: checkError } = await supabase
            .from('users')
            .select('id, metadata')
            .eq('id', agentId)
            .eq('role', 'agent')
            .eq('tenant_id', tenant_id)
            .single()
        
        if (checkError || !user) {
            console.error('Error al verificar agente:', checkError)
            throw new Error('El agente no existe o no tienes permiso para actualizarlo')
        }
        
        // Combinar la metadata existente con la nueva disponibilidad
        const currentMetadata = user.metadata || {}
        const updatedMetadata = {
            ...currentMetadata,
            availability: {
                ...(currentMetadata.availability || {}),
                ...availability
            }
        }
        
        // Actualizar la metadata del usuario con la disponibilidad
        const { data, error } = await supabase
            .from('users')
            .update({
                metadata: updatedMetadata
            })
            .eq('id', agentId)
            .eq('tenant_id', tenant_id)
            .select('id, metadata')
            .single()
        
        if (error) {
            console.error('Error al actualizar disponibilidad del agente:', error)
            throw new Error(`Error al actualizar la disponibilidad: ${error.message}`)
        }
        
        return {
            id: data.id,
            availability: data.metadata?.availability || {}
        }
    } catch (error) {
        console.error('Error en updateAgentAvailability:', error)
        throw error
    }
}

export default updateAgentAvailability
