/**
 * server/actions/leads/debugLeadStage.ts
 * Script para depurar problemas con las etapas de leads.
 * Marca un lead como cerrado usando el campo status en lugar de stage.
 * 
 * @version 1.0.0
 * @updated 2025-04-28
 */

'use server'

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '../tenant/getTenantFromSession'

type DebugResult = {
    success: boolean;
    message: string;
    details?: any;
}

export async function testCloseLeadDirectly(leadId: string): Promise<DebugResult> {
    try {
        const supabase = SupabaseClient.getInstance()

        // Obtener el tenant actual
        const tenant_id = await getTenantFromSession()

        if (!tenant_id) {
            return {
                success: false,
                message: 'No se pudo obtener el tenant_id'
            }
        }

        // Verificar si el lead existe
        const { data: existingLead, error: checkError } = await supabase
            .from('leads')
            .select('id, full_name, stage, status, tenant_id')
            .eq('id', leadId)
            .single()

        if (checkError || !existingLead) {
            return {
                success: false,
                message: `Error al verificar lead: ${checkError?.message || 'No se encontró el lead'}`,
                details: checkError
            }
        }

        // Validar que el lead pertenece al tenant correcto
        if (existingLead.tenant_id !== tenant_id) {
            return {
                success: false,
                message: 'El lead no pertenece al tenant actual'
            }
        }

        console.log(`Debug: Lead actual - ID: ${existingLead.id}, Nombre: ${existingLead.full_name}, Etapa: ${existingLead.stage}, Estado: ${existingLead.status}`);

        // No intentamos actualizar la etapa, solo actualizamos el campo status
        const { data: updatedLead, error: updateError } = await supabase
            .from('leads')
            .update({ 
                status: 'closed', // Solo cambiamos el status
                updated_at: new Date().toISOString(),
                // Añadimos un flag en metadata para indicar que está cerrado
                metadata: {
                    ...existingLead.metadata,
                    is_closed: true,
                    closed_at: new Date().toISOString()
                }
            })
            .eq('id', leadId)
            .eq('tenant_id', tenant_id)
            .select('id, full_name, stage, status, metadata')
            .single()

        if (updateError) {
            return {
                success: false,
                message: `Error al actualizar status del lead a 'closed': ${updateError.message}`,
                details: updateError
            }
        }

        // Verificar el cambio
        const { data: verifyLead, error: verifyError } = await supabase
            .from('leads')
            .select('id, full_name, stage, status, metadata')
            .eq('id', leadId)
            .single()

        if (verifyError || !verifyLead) {
            return {
                success: false,
                message: `Error al verificar cambio: ${verifyError?.message || 'No se encontró el lead'}`,
                details: verifyError
            }
        }

        return {
            success: true,
            message: `Lead marcado como cerrado correctamente utilizando el campo status. Status original: ${existingLead.status}, Status actual: ${verifyLead.status}`,
            details: {
                before: existingLead,
                after: verifyLead
            }
        }
    } catch (error: any) {
        return {
            success: false,
            message: `Error inesperado: ${error.message || 'Error desconocido'}`,
            details: error
        }
    }
}

export default testCloseLeadDirectly;
