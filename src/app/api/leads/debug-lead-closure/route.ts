import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '@/server/actions/tenant/getTenantFromSession'

export async function POST(request: NextRequest) {
    try {
        const { leadId } = await request.json()
        
        if (!leadId) {
            return NextResponse.json({
                success: false,
                error: 'Lead ID es requerido'
            }, { status: 400 })
        }
        
        const tenant_id = await getTenantFromSession()
        const supabase = SupabaseClient.getInstance()
        
        console.log('debug-lead-closure: Verificando lead', { leadId, tenant_id })
        
        // Verificar todos los posibles problemas
        // 1. Verificar si el lead existe
        const { data: leadExists, error: existsError } = await supabase
            .from('leads')
            .select('id, tenant_id, status, stage')
            .eq('id', leadId)
            .single()
        
        if (existsError) {
            console.error('Error al buscar lead:', existsError)
            return NextResponse.json({
                success: false,
                error: 'Error al buscar lead',
                details: existsError
            })
        }
        
        if (!leadExists) {
            return NextResponse.json({
                success: false,
                error: 'Lead no encontrado'
            })
        }
        
        // 2. Verificar si el tenant coincide
        if (leadExists.tenant_id !== tenant_id) {
            return NextResponse.json({
                success: false,
                error: 'Tenant no coincide',
                lead_tenant: leadExists.tenant_id,
                user_tenant: tenant_id
            })
        }
        
        // 3. Intentar actualización directa
        const { data: updated, error: updateError } = await supabase
            .from('leads')
            .update({ 
                status: 'closed',
                stage: 'closed',
                updated_at: new Date().toISOString()
            })
            .eq('id', leadId)
            .eq('tenant_id', tenant_id)
            .select()
            .single()
        
        if (updateError) {
            return NextResponse.json({
                success: false,
                error: 'Error al actualizar',
                details: updateError
            })
        }
        
        return NextResponse.json({
            success: true,
            data: updated,
            message: 'Lead actualizado correctamente'
        })
        
    } catch (error) {
        console.error('Error en debug-lead-closure:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 })
    }
}