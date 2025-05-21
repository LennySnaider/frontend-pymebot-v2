'use server'

import { createClient } from '@/utils/supabase/server'
import { ActionResponse } from '@/@types/action'

interface CreateAgentData {
    email: string
    password: string
    fullName: string
    phone?: string
    bio?: string
    specializations?: string[]
    languages?: string[]
}

export default async function createAgent(
    data: CreateAgentData
): Promise<ActionResponse<{ agentId: string }>> {
    try {
        const supabase = await createClient()
        
        // Verificar que el usuario actual tiene permisos de admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return {
                success: false,
                message: 'Usuario no autenticado'
            }
        }
        
        // Obtener información del usuario actual
        const { data: currentUser } = await supabase
            .from('users')
            .select('role, tenant_id')
            .eq('id', user.id)
            .single()
        
        if (!currentUser) {
            return {
                success: false,
                message: 'Usuario no encontrado'
            }
        }
        
        // Verificar que es admin
        if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
            return {
                success: false,
                message: 'No tienes permisos para crear agentes'
            }
        }
        
        // 1. Crear usuario en auth usando el SDK del servidor
        // Nota: En el servidor no podemos usar supabase.auth.admin
        // Necesitamos hacerlo a través de una función edge o API route
        
        // 2. Por ahora, vamos a crear el registro preparado para cuando se cree el usuario
        const { data: agent, error: agentError } = await supabase
            .from('agents')
            .insert({
                name: data.fullName,
                email: data.email,
                phone: data.phone,
                bio: data.bio,
                specializations: data.specializations,
                languages: data.languages,
                is_active: true,
                tenant_id: currentUser.tenant_id,
                // user_id se llenará después cuando se cree el usuario
            })
            .select()
            .single()
        
        if (agentError) {
            throw agentError
        }
        
        return {
            success: true,
            data: { agentId: agent.id },
            message: 'Agente pre-registrado exitosamente. El usuario se creará en el siguiente paso.'
        }
        
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Error creando agente'
        }
    }
}