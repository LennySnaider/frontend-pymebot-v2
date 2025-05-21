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
        
        const body = await request.json()
        const { leads } = body // Esperamos un array de leads
        
        if (!leads || !Array.isArray(leads)) {
            return NextResponse.json(
                { error: 'Debe proporcionar un array de leads' },
                { status: 400 }
            )
        }
        
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
        
        // Insertar leads
        const { data, error } = await supabase
            .from('leads')
            .upsert(leads, { onConflict: 'id' })
            .select()
        
        if (error) {
            console.error('Error insertando leads:', error)
            return NextResponse.json(
                { error: 'Error insertando leads', details: error },
                { status: 400 }
            )
        }
        
        return NextResponse.json({
            success: true,
            message: `${data?.length || 0} leads importados exitosamente`,
            leads: data
        })
        
    } catch (error: any) {
        console.error('Error importando leads:', error)
        return NextResponse.json(
            { error: error.message || 'Error interno' },
            { status: 500 }
        )
    }
}