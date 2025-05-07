/**
 * server/actions/leads/createLead.ts
 * Acción del servidor para crear un nuevo lead inmobiliario.
 * Actualizada para usar etapas consistentes con el funnel de ventas.
 * 
 * @version 1.1.0
 * @updated 2025-04-14
 */

'use server'

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '../tenant/getTenantFromSession'
import type { LeadData } from './getLeads'

export interface CreateLeadData {
    full_name: string
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
    metadata?: Record<string, any>
    tenant_id?: string // Permitir pasar tenant_id explícitamente
}

export async function createLead(leadData: CreateLeadData) {
    try {
        console.log('Iniciando createLead con datos:', JSON.stringify(leadData, null, 2));
        const supabase = SupabaseClient.getInstance()
        
        if (!supabase) {
            throw new Error('No se pudo obtener instancia de Supabase')
        }
        
        // Obtener el tenant actual - primero intentar usar el proporcionado, luego de la sesión
        let tenant_id = leadData.tenant_id
        
        if (!tenant_id) {
            try {
                // getTenantFromSession() devuelve directamente el tenant_id como string
                const sessionTenant = await getTenantFromSession()
                tenant_id = sessionTenant?.tenant_id || sessionTenant
                console.log('Tenant ID obtenido de la sesión:', tenant_id)
            } catch (tenantError) {
                console.warn('Error al obtener tenant_id de la sesión:', tenantError)
                // Usar tenant_id por defecto
                tenant_id = 'afa60b0a-3046-4607-9c48-266af6e1d322' // ID del Default Tenant
                console.log('Usando tenant_id por defecto:', tenant_id)
            }
        }
        
        // Verificar que tengamos un tenant_id válido
        if (!tenant_id) {
            console.error('No se pudo obtener el tenant_id y no hay tenant por defecto')
            throw new Error('No se pudo obtener el tenant_id')
        }
        
        // Establecer valores por defecto si no se proporcionan
        const now = new Date().toISOString()
        
        // IMPORTANTE: Usar 'new' como etapa por defecto para ser consistente con el funnel
        const stage = leadData.stage || 'new'
        
        const newLeadData = {
            ...leadData,
            status: leadData.status || 'active',
            stage: stage, // Usar la etapa normalizada
            contact_count: 0,
            created_at: now,
            updated_at: now,
            last_contact_date: now,
            next_contact_date: leadData.next_contact_date || null,
            tenant_id
        }
        
        console.log('Creando lead con datos:', JSON.stringify(newLeadData, null, 2));
        
        // Crear el nuevo lead
        const { data, error } = await supabase
            .from('leads')
            .insert(newLeadData)
            .select()
            .single()
        
        if (error) {
            console.error('Error al crear lead:', error)
            throw new Error(`Error al crear el lead: ${error.message}`)
        }
        
        console.log('Lead creado exitosamente:', JSON.stringify(data, null, 2));
        
        // Registrar la actividad de creación
        const { error: activityError } = await supabase
            .from('lead_activities')
            .insert({
                lead_id: data.id,
                agent_id: leadData.agent_id,
                activity_type: 'lead_created',
                description: 'Lead creado en el sistema',
                tenant_id,
                metadata: {
                    source: leadData.source,
                    initial_stage: stage
                }
            })
        
        if (activityError) {
            console.error('Error al registrar actividad de lead:', activityError)
            // Continuamos aunque haya error en el registro de actividad
        }
        
        return data as LeadData
    } catch (error) {
        console.error('Error en createLead:', error)
        throw error
    }
}

export default createLead
