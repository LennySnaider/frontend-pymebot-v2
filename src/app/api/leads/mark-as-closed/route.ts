import { NextRequest, NextResponse } from 'next/server'
import { closeLead } from '@/server/actions/leads/closeLead'
import { getTenantFromSession } from '@/server/actions/tenant/getTenantFromSession'
import { SupabaseClient } from '@/services/supabase/SupabaseClient'

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
        
        console.log('mark-as-closed: Marcando lead como cerrado', { leadId, tenant_id })
        
        // Primero verificar si el lead existe (sin tenant filter)
        const { data: leadCheck, error: checkError } = await supabase
            .from('leads')
            .select('id, tenant_id')
            .eq('id', leadId)
        
        console.log('Lead check result:', { leadCheck, checkError })
        
        if (checkError || !leadCheck || leadCheck.length === 0) {
            console.error('Lead no encontrado:', checkError)
            return NextResponse.json({
                success: false,
                error: 'Lead no encontrado',
                details: checkError?.message || 'No rows returned'
            }, { status: 404 })
        }
        
        // Verificar si el tenant coincide
        const lead = leadCheck.find(l => l.tenant_id === tenant_id)
        if (!lead) {
            console.error('Lead encontrado pero tenant no coincide', {
                found_tenants: leadCheck.map(l => l.tenant_id),
                expected_tenant: tenant_id
            })
            return NextResponse.json({
                success: false,
                error: 'Sin permisos para este lead'
            }, { status: 403 })
        }
        
        // Actualizar el estado del lead a "cerrado" usando la nueva función
        const updatedLead = await closeLead(leadId)
        
        return NextResponse.json({
            success: true,
            data: updatedLead
        })
        
    } catch (error) {
        console.error('Error al marcar lead como cerrado:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 })
    }
}