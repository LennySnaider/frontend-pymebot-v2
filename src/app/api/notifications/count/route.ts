import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/auth'

export async function GET() {
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
        
        // Por ahora, como no tenemos tabla de notificaciones, retornamos 0
        // TODO: Implementar tabla de notificaciones en Supabase
        // const { count, error } = await supabase
        //     .from('notifications')
        //     .select('*', { count: 'exact', head: true })
        //     .eq('user_id', session.user.id)
        //     .eq('read', false)
        
        // if (error) {
        //     throw error
        // }
        
        return NextResponse.json({ count: 0 })
    } catch (error) {
        console.error('Error fetching notification count:', error)
        return NextResponse.json({ error: 'Error al obtener notificaciones' }, { status: 500 })
    }
}