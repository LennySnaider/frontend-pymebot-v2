import { createClient as createServerClient, createServiceClient } from '@/services/supabase/server'
import { Member } from '@/app/(protected-pages)/modules/leads/leads-scrum/types'
import { getTenantFromSession } from './tenant/getTenantFromSession'

const getSrcumboardMembers = async () => {
    try {
        // En desarrollo usamos service role, en producción usamos el cliente con sesión
        const supabase = process.env.NODE_ENV === 'development' 
            ? createServiceClient()
            : createServerClient()

        // Obtener el tenant_id de la sesión
        const currentTenantId = await getTenantFromSession()
        console.log('Tenant ID en getSrcumboardMembers:', currentTenantId)

        let query = supabase
            .from('users') // Usamos la tabla 'users' con rol 'agent'
            .select(`
                id,
                full_name, 
                email,
                avatar_url,
                metadata,
                status
            `)
            .eq('role', 'agent')
            .eq('status', 'active') 

        // Filtrar por tenant si existe
        if (currentTenantId) {
            query = query.eq('tenant_id', currentTenantId)
        }

        const { data: agentsData, error } = await query
        console.log('Agentes encontrados:', agentsData?.length || 0)

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
            name: agent.full_name || agent.email || 'Agente Desconocido', // Usar full_name
            email: agent.email || '',
            img: agent.avatar_url || agent.metadata?.profile_image || '', // Usar avatar_url o metadata.profile_image
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
