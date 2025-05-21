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
        
        // Por ahora retornamos un array vacío ya que no tenemos tabla de notificaciones
        // TODO: Implementar tabla de notificaciones en Supabase
        // const { data: notifications, error } = await supabase
        //     .from('notifications')
        //     .select('*')
        //     .eq('user_id', session.user.id)
        //     .order('created_at', { ascending: false })
        
        // if (error) {
        //     throw error
        // }
        
        return NextResponse.json([])
    } catch (error) {
        console.error('Error fetching notifications:', error)
        return NextResponse.json({ error: 'Error al obtener notificaciones' }, { status: 500 })
    }
}