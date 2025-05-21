/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query') as string

    try {
        // Obtener sesión del usuario
        const session = await auth()
        
        if (!session || !session.user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }
        
        // Crear cliente de Supabase
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        // Por ahora retornamos resultados vacíos
        // TODO: Implementar búsqueda real en las tablas de Supabase
        // Podríamos buscar en leads, properties, agents, etc.
        
        if (!query || query.trim() === '') {
            return NextResponse.json([])
        }
        
        // Ejemplo de estructura de datos esperada por el frontend
        const mockResults = [
            {
                title: 'Leads',
                data: []
            },
            {
                title: 'Properties',
                data: []
            },
            {
                title: 'Agents',
                data: []
            }
        ]
        
        return NextResponse.json(mockResults)
    } catch (error) {
        console.error('Error en búsqueda:', error)
        return NextResponse.json({ error: 'Error al realizar búsqueda' }, { status: 500 })
    }
}