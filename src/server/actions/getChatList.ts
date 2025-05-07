/**
 * backend/src/server/actions/getChatList.ts
 * Acción del servidor para obtener la lista de chats del usuario actual
 * @version 1.2.0
 * @updated 2025-06-05
 */

import { mockData } from '@/services/ChatService/mockChatData'
import { auth } from '@/auth'

/**
 * Obtiene la lista de chats para el usuario actual
 * En producción, esta función consultaría a la base de datos
 */
const getChatList = async () => {
    try {
        // Obtener la sesión del usuario actual (auth.js next-auth)
        const session = await auth()
        
        // Si queremos filtrar por tenant o usuario, aquí podríamos hacerlo
        // const tenantId = session?.user?.tenant_id
        
        // Nota: En implementación real, consultaríamos Supabase u otra base de datos
        // const { data, error } = await supabase
        //     .from('chats')
        //     .select('*')
        //     .eq('tenant_id', tenantId)
        //     .order('time', { ascending: false })
        
        // if (error) throw error
        // return data
        
        // Por ahora, retornamos datos simulados
        console.log('Usando datos simulados para chats')
        return mockData
    } catch (error) {
        console.error('Error obteniendo lista de chats:', error)
        return []
    }
}

export default getChatList
