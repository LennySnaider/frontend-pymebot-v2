import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            )
        }
        
        const tenantId = session.user.tenant_id || 'afa60b0a-3046-4607-9c48-266af6e1d322'
        
        // Crear cliente con service role
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )
        
        // Leads de muestra
        const sampleLeads = [
            {
                tenant_id: tenantId,
                full_name: 'Juan Pérez',
                email: 'juan.perez@example.com',
                phone: '+52 555 123 4567',
                stage: 'new',
                status: 'active',
                source: 'web',
                interest_level: 'alto',
                property_type: 'Departamento',
                budget_min: 3000000,
                budget_max: 5000000,
                bedrooms_needed: 2,
                bathrooms_needed: 2,
                description: 'Interesado en departamento en Polanco',
                metadata: {
                    source: 'web',
                    campaign: 'google_ads'
                }
            },
            {
                tenant_id: tenantId,
                full_name: 'María García',
                email: 'maria.garcia@example.com',
                phone: '+52 555 234 5678',
                stage: 'prospecting',
                status: 'active',
                source: 'telefono',
                interest_level: 'medio',
                property_type: 'Casa',
                budget_min: 5000000,
                budget_max: 7000000,
                bedrooms_needed: 3,
                bathrooms_needed: 2,
                description: 'Busca casa en zona sur',
                metadata: {
                    source: 'phone',
                    agent_notes: 'Llamó preguntando por casas en Coyoacán'
                }
            },
            {
                tenant_id: tenantId,
                full_name: 'Carlos Rodríguez',
                email: 'carlos.rodriguez@example.com',
                phone: '+52 555 345 6789',
                stage: 'qualification',
                status: 'active',
                source: 'referido',
                interest_level: 'alto',
                property_type: 'Departamento',
                budget_min: 2000000,
                budget_max: 3500000,
                bedrooms_needed: 1,
                bathrooms_needed: 1,
                description: 'Inversionista buscando departamento para rentar',
                metadata: {
                    source: 'referral',
                    investor: true
                }
            },
            {
                tenant_id: tenantId,
                full_name: 'Ana López',
                email: 'ana.lopez@example.com',
                phone: '+52 555 456 7890',
                stage: 'opportunity',
                status: 'active',
                source: 'evento',
                interest_level: 'alto',
                property_type: 'Casa',
                budget_min: 4000000,
                budget_max: 6000000,
                bedrooms_needed: 3,
                bathrooms_needed: 3,
                description: 'Pre-aprobada para crédito, lista para comprar',
                metadata: {
                    source: 'event',
                    credit_approved: true,
                    bank: 'BBVA'
                }
            }
        ]
        
        // Insertar leads
        const { data, error } = await supabase
            .from('leads')
            .insert(sampleLeads)
            .select()
        
        if (error) {
            console.error('Error creando leads de muestra:', error)
            return NextResponse.json(
                { error: 'Error creando leads', details: error },
                { status: 400 }
            )
        }
        
        return NextResponse.json({
            success: true,
            message: `${data.length} leads de muestra creados`,
            leads: data
        })
        
    } catch (error: any) {
        console.error('Error:', error)
        return NextResponse.json(
            { error: error.message || 'Error interno' },
            { status: 500 }
        )
    }
}