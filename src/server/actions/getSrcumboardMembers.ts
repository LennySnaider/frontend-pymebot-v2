import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { Member } from '@/app/(protected-pages)/modules/leads/leads-scrum/types'

const getSrcumboardMembers = async () => {
    try {
        const supabase = SupabaseClient.getInstance()

        // Obtener todos los usuarios/agentes activos del tenant actual
        // Necesitamos obtener el tenant_id de la sesión
        const { data: sessionData } = await supabase.auth.getSession()
        // @ts-ignore - Ignoramos error de tipado temporal para app_metadata
        const currentTenantId = sessionData?.session?.user?.app_metadata?.tenant_id || null

        let query = supabase
            .from('agents') // Usamos la tabla 'agents'
            .select(`
                id,
                name, 
                email,
                profile_image 
            `)
            .eq('is_active', true) 

        // Filtrar por tenant si existe
        if (currentTenantId) {
            query = query.eq('tenant_id', currentTenantId)
        }

        const { data: agentsData, error } = await query

        if (error) {
            console.error('Error al obtener miembros/agentes desde Supabase:', error)
            // Devolver arrays vacíos en caso de error para no romper la UI
            return {
                participantMembers: [],
                allMembers: [],
            }
        }

        // Mapear los datos al formato Member esperado
        const allMembers: Member[] = agentsData?.map((agent: any) => ({
            id: agent.id,
            name: agent.name || agent.email || 'Agente Desconocido', // Usar name
            email: agent.email || '',
            img: agent.profile_image || '', // Usar profile_image
        })) || []

        // Por ahora, devolvemos todos los miembros como participantes y totales
        // Podrías añadir lógica para filtrar participantes si es necesario
        return {
            participantMembers: allMembers,
            allMembers: allMembers,
        }

    } catch (err) {
        console.error('Error inesperado en getSrcumboardMembers:', err)
        return {
            participantMembers: [],
            allMembers: [],
        }
    }
}

export default getSrcumboardMembers
