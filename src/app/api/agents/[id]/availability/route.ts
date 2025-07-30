/**
 * API Route para gestionar la disponibilidad de los agentes
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import updateAgentAvailability from '@/server/actions/agents/updateAgentAvailability'
import { createClient } from '@/services/supabase/server'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const resolvedParams = await params
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            )
        }

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('users')
            .select('id, full_name, metadata')
            .eq('id', resolvedParams.id)
            .eq('role', 'agent')
            .single()

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            id: data.id,
            name: data.full_name,
            availability: data.metadata?.availability || {}
        })
    } catch (error) {
        console.error('Error al obtener disponibilidad:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const resolvedParams = await params
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { availability } = body

        const result = await updateAgentAvailability(resolvedParams.id, availability)

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error al actualizar disponibilidad:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}