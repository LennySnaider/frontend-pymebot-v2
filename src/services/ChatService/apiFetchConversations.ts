/**
 * frontend/src/services/ChatService/apiFetchConversations.ts
 * Servicio para obtener la lista de conversaciones del usuario
 * @version 1.0.0
 * @updated 2025-04-26
 */

export interface Conversation {
    id: string
    contactName: string
    lastMessage: string
    lastMessageTime: string
    unreadCount?: number
    avatarUrl?: string
    isOnline?: boolean
    lastSeen?: string
}

/**
 * Recupera o genera conversaciones de muestra
 * @param userId ID del usuario (opcional, utilizado para filtrar conversaciones en implementación real)
 * @returns Lista de conversaciones
 */
const apiFetchConversations = async (
    userId?: string,
): Promise<Conversation[]> => {
    // En una implementación real, usaríamos userId para filtrar las conversaciones
    if (userId) {
        console.log(`Obteniendo conversaciones para usuario: ${userId}`)
    } else {
        console.log(
            'Obteniendo todas las conversaciones (usuario no especificado)',
        )
    }

    // Aquí podrías hacer una llamada a la API para obtener conversaciones reales
    // Por ahora retornamos datos de ejemplo
    const demoConversations: Conversation[] = [
        {
            id: 'chat-1',
            contactName: 'Cliente Demo',
            lastMessage:
                '¿Puedes ayudarme con información sobre sus servicios?',
            lastMessageTime: '01:06 PM',
            unreadCount: 0,
            avatarUrl: '/img/avatars/thumb-2.jpg',
            isOnline: true,
            lastSeen: 'recently',
        },
        {
            id: 'chat-2',
            contactName: 'María García',
            lastMessage: 'Gracias por la información proporcionada',
            lastMessageTime: '12:11 PM',
            unreadCount: 0,
            avatarUrl: '/img/avatars/thumb-3.jpg',
            isOnline: false,
            lastSeen: '2 hours ago',
        },
        {
            id: 'chat-3',
            contactName: 'Pedro Sánchez',
            lastMessage: 'Me interesa la propuesta comercial',
            lastMessageTime: '08:11 AM',
            unreadCount: 1,
            avatarUrl: '/img/avatars/thumb-4.jpg',
            isOnline: false,
            lastSeen: '1 day ago',
        },
        {
            id: 'chat-4',
            contactName: 'Laura Martínez',
            lastMessage: '¿Podemos agendar una llamada?',
            lastMessageTime: '01:11 PM',
            unreadCount: 2,
            avatarUrl: '/img/avatars/thumb-5.jpg',
            isOnline: true,
            lastSeen: 'just now',
        },
        {
            id: 'chat-5',
            contactName: 'Carlos Rodríguez',
            lastMessage: 'Confirmado para el viernes',
            lastMessageTime: '01:11 PM',
            unreadCount: 0,
            avatarUrl: '/img/avatars/thumb-6.jpg',
            isOnline: false,
            lastSeen: '3 days ago',
        },
    ]

    return demoConversations
}

export default apiFetchConversations
