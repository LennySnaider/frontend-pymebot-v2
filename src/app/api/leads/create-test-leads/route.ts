import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST(request: NextRequest) {
    try {
        // Verificar autenticación
        const session = await auth()
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            )
        }
        
        const tenantId = session.user.tenant_id
        
        // Crear cliente con service role para crear leads
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
        
        // Leads de prueba
        const testLeads = [
            {
                full_name: 'Juan Pérez',
                email: 'juan.perez@example.com',
                phone: '+52 555 123 4567',
                stage: 'new',
                status: 'active',
                tenant_id: tenantId,
                description: 'Cliente interesado en departamento en Polanco',
                source: 'web',
                interest_level: 'alto',
                budget_min: 3000000,
                budget_max: 5000000,
                property_type: 'Departamento',
                preferred_zones: ['Polanco', 'Condesa'],
                bedrooms_needed: 2,
                bathrooms_needed: 2,
                metadata: {
                    leadStatus: 'active',
                    source: 'web'
                }
            },
            {
                full_name: 'María García',
                email: 'maria.garcia@example.com',
                phone: '+52 555 234 5678',
                stage: 'prospecting',
                status: 'active',
                tenant_id: tenantId,
                description: 'Busca casa en zona sur de la ciudad',
                source: 'referral',
                interest_level: 'medio',
                budget_min: 5000000,
                budget_max: 7000000,
                property_type: 'Casa',
                preferred_zones: ['San Ángel', 'Coyoacán'],
                bedrooms_needed: 3,
                bathrooms_needed: 2,
                metadata: {
                    leadStatus: 'active',
                    source: 'referral'
                }
            },
            {
                full_name: 'Carlos Rodríguez',
                email: 'carlos.rodriguez@example.com',
                phone: '+52 555 345 6789',
                stage: 'qualification',
                status: 'active',
                tenant_id: tenantId,
                description: 'Inversionista buscando propiedades para rentar',
                source: 'phone',
                interest_level: 'alto',
                budget_min: 2000000,
                budget_max: 4000000,
                property_type: 'Estudio',
                preferred_zones: ['Roma Norte', 'Juárez'],
                bedrooms_needed: 1,
                bathrooms_needed: 1,
                metadata: {
                    leadStatus: 'active',
                    source: 'phone',
                    investor: true
                }
            },
            {
                full_name: 'Ana Martínez',
                email: 'ana.martinez@example.com',
                phone: '+52 555 456 7890',
                stage: 'opportunity',
                status: 'active',
                tenant_id: tenantId,
                description: 'Lista para comprar, pre-aprobada para crédito',
                source: 'event',
                interest_level: 'alto',
                budget_min: 4000000,
                budget_max: 6000000,
                property_type: 'Departamento',
                preferred_zones: ['Polanco', 'Anzures'],
                bedrooms_needed: 2,
                bathrooms_needed: 2,
                metadata: {
                    leadStatus: 'active',
                    source: 'event',
                    credit_approved: true
                }
            }
        ]
        
        // Insertar leads
        const { data, error } = await supabase
            .from('leads')
            .insert(testLeads)
            .select()
        
        if (error) {
            console.error('Error creating test leads:', error)
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            )
        }
        
        return NextResponse.json({
            success: true,
            leads: data,
            message: `${data.length} leads de prueba creados exitosamente`
        })
        
    } catch (error: any) {
        console.error('Error creating test leads:', error)
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        )
    }
}