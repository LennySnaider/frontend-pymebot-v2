/**
 * server/actions/leads/updateLead.ts
 * Acción del servidor para actualizar un lead existente.
 *
 * @version 1.0.0
 * @updated 2025-06-25
 */

'use server'

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '../tenant/getTenantFromSession'
import type { LeadData } from './getLeads'

export interface UpdateLeadData {
    full_name?: string
    email?: string
    phone?: string
    status?: string
    stage?: string
    source?: string
    interest_level?: string
    budget_min?: number
    budget_max?: number
    property_type?: string
    preferred_zones?: string[]
    bedrooms_needed?: number
    bathrooms_needed?: number
    features_needed?: string[]
    notes?: string
    agent_id?: string
    next_contact_date?: string
    metadata?: Record<string, unknown> // Cambiado any a unknown
    property_ids?: string[] // Añadido para soportar IDs de propiedades de interés
    selected_property_id?: string // Añadido para soportar la propiedad seleccionada principal
}

export async function updateLead(leadId: string, updateData: UpdateLeadData) {
    try {
        const supabase = SupabaseClient.getInstance()

        // Obtener el tenant actual
        // getTenantFromSession() devuelve directamente el tenant_id como string
        const tenant_id = await getTenantFromSession()

        if (!tenant_id) {
            throw new Error('No se pudo obtener el tenant_id')
        }

        // Verificar si hay cambio de etapa para registrarlo en las actividades
        const { data: currentLead, error: checkError } = await supabase
            .from('leads')
            .select('stage, agent_id, contact_count')
            .eq('id', leadId)
            .eq('tenant_id', tenant_id)
            .single()

        if (checkError || !currentLead) {
            console.error('Error al verificar lead:', checkError)
            throw new Error(
                'El lead no existe o no tienes permiso para actualizarlo',
            )
        }

        // Preparar los datos de actualización, incluyendo property_ids y selected_property_id si existen
        const leadUpdateData = { ...updateData }

        // Si hay property_ids pero no hay selected_property_id, usar el primer ID como selected_property_id
        if (
            updateData.property_ids?.length &&
            !updateData.selected_property_id
        ) {
            leadUpdateData.selected_property_id = updateData.property_ids[0]
        }

        // Si hay metadata.property_ids pero no hay selected_property_id, usar el primer ID como selected_property_id
        if (
            !leadUpdateData.selected_property_id &&
            updateData.metadata?.property_ids
        ) {
            const metadataPropertyIds = Array.isArray(
                updateData.metadata.property_ids,
            )
                ? updateData.metadata.property_ids
                : [updateData.metadata.property_ids]

            if (metadataPropertyIds.length > 0) {
                leadUpdateData.selected_property_id = metadataPropertyIds[0]
            }
        }

        // Asegurarse de que property_ids no se envíe como campo directo si existe en metadata
        if (
            leadUpdateData.property_ids &&
            leadUpdateData.metadata?.property_ids
        ) {
            delete leadUpdateData.property_ids
        }

        // Asegurarse de que next_contact_date sea una fecha ISO válida y no un timestamp
        if (
            updateData.next_contact_date &&
            typeof updateData.next_contact_date === 'number'
        ) {
            leadUpdateData.next_contact_date = new Date(
                updateData.next_contact_date,
            ).toISOString()
        }

        // Comentado: last_contact_date no debe actualizarse directamente aquí
        // if (
        //     updateData.agent_id &&
        //     updateData.agent_id !== currentLead.agent_id
        // ) {
        //     const now = new Date().toISOString()
        //     // leadUpdateData.last_contact_date = now // Error: last_contact_date no está en UpdateLeadData
        // }

        // Actualizar el lead
        const { data, error } = await supabase
            .from('leads')
            .update(leadUpdateData)
            .eq('id', leadId)
            .eq('tenant_id', tenant_id)
            .select()
            .single()

        if (error) {
            console.error('Error al actualizar lead:', error)
            throw new Error(`Error al actualizar el lead: ${error.message}`)
        }

        // Registrar cambio de agente si es necesario
        if (
            updateData.agent_id &&
            updateData.agent_id !== currentLead.agent_id
        ) {
            const { error: activityError } = await supabase
                .from('lead_activities')
                .insert({
                    lead_id: leadId,
                    agent_id: updateData.agent_id,
                    activity_type: 'agent_assigned',
                    description: 'Agente asignado o modificado',
                    tenant_id,
                    metadata: {
                        previous_agent_id: currentLead.agent_id || null,
                        new_agent_id: updateData.agent_id,
                    },
                })

            if (activityError) {
                console.error(
                    'Error al registrar cambio de agente:',
                    activityError,
                )
                // Continuamos aunque haya error en el registro de actividad
            }
        }

        return data as LeadData
    } catch (error) {
        console.error('Error en updateLead:', error)
        throw error
    }
}

export default updateLead
