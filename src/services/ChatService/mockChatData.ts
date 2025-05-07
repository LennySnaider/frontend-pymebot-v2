/**
 * frontend/src/services/ChatService/mockChatData.ts
 * Datos simulados para el componente de chat (desarrollo)
 * @version 1.0.0
 * @updated 2025-04-16
 */

import dayjs from 'dayjs'

// Datos simulados para desarrollo y pruebas
export const mockData = [
    {
        id: 'chat_1',
        name: 'Cliente Demo',
        userId: 'user_1',
        avatar: '/img/avatars/thumb-1.jpg',
        unread: 2,
        time: dayjs().subtract(5, 'minute').unix(),
        lastConversation: '¿Puedes ayudarme con una propiedad?',
        muted: false,
        chatType: 'personal',
        groupId: ''
    },
    {
        id: 'chat_2',
        name: 'María García',
        userId: 'user_2',
        avatar: '/img/avatars/thumb-2.jpg',
        unread: 0,
        time: dayjs().subtract(1, 'hour').unix(),
        lastConversation: 'Gracias por la información',
        muted: false,
        chatType: 'personal',
        groupId: ''
    },
    {
        id: 'chat_3',
        name: 'Pedro Sánchez',
        userId: 'user_3',
        avatar: '/img/avatars/thumb-3.jpg',
        unread: 0,
        time: dayjs().subtract(5, 'hour').unix(),
        lastConversation: 'Me interesa la propiedad que me mostraste',
        muted: true,
        chatType: 'personal',
        groupId: ''
    },
    {
        id: 'chat_4',
        name: 'Laura Martínez',
        userId: 'user_4',
        avatar: '/img/avatars/thumb-4.jpg',
        unread: 1,
        time: dayjs().subtract(1, 'day').unix(),
        lastConversation: '¿Podemos agendar una visita?',
        muted: false,
        chatType: 'personal',
        groupId: ''
    },
    {
        id: 'chat_5',
        name: 'Carlos Rodríguez',
        userId: 'user_5',
        avatar: '/img/avatars/thumb-5.jpg',
        unread: 0,
        time: dayjs().subtract(2, 'day').unix(),
        lastConversation: 'Confirmado para el jueves',
        muted: false,
        chatType: 'personal',
        groupId: ''
    },
    {
        id: 'chat_6',
        name: 'Soporte Técnico',
        userId: 'group_1',
        avatar: '/img/avatars/group-1.jpg',
        unread: 3,
        time: dayjs().subtract(6, 'hour').unix(),
        lastConversation: 'Miguel: Revisaremos el problema de conexión',
        muted: false,
        chatType: 'groups',
        groupId: 'group_1'
    },
    {
        id: 'chat_7',
        name: 'Equipo de Ventas',
        userId: 'group_2',
        avatar: '/img/avatars/group-2.jpg',
        unread: 0,
        time: dayjs().subtract(4, 'day').unix(),
        lastConversation: 'Ana: Actualizaré el inventario mañana',
        muted: true,
        chatType: 'groups',
        groupId: 'group_2'
    }
]

// Datos simulados de conversaciones
export const mockConversationData = {
    chat_1: {
        id: 'chat_1',
        conversation: [
            {
                id: 'msg_1_1',
                sender: {
                    id: 'user_1',
                    name: 'Cliente Demo',
                    avatarImageUrl: '/img/avatars/thumb-1.jpg',
                },
                content: 'Hola, me interesa una propiedad que vi en su sitio web',
                timestamp: dayjs().subtract(1, 'day').toDate(),
                type: 'regular',
                isMyMessage: false,
            },
            {
                id: 'msg_1_2',
                sender: {
                    id: '1',
                    name: 'Yo',
                    avatarImageUrl: '/img/avatars/thumb-8.jpg',
                },
                content: 'Claro, estaré encantado de ayudarte. ¿Puedes especificar qué propiedad te interesó?',
                timestamp: dayjs().subtract(1, 'day').add(5, 'minute').toDate(),
                type: 'regular',
                isMyMessage: true,
            },
            {
                id: 'msg_1_3',
                sender: {
                    id: 'user_1',
                    name: 'Cliente Demo',
                    avatarImageUrl: '/img/avatars/thumb-1.jpg',
                },
                content: 'Es la casa en Avenida Principal #123, con 3 habitaciones',
                timestamp: dayjs().subtract(1, 'day').add(10, 'minute').toDate(),
                type: 'regular',
                isMyMessage: false,
            },
            {
                id: 'msg_1_4',
                sender: {
                    id: '1',
                    name: 'Yo',
                    avatarImageUrl: '/img/avatars/thumb-8.jpg',
                },
                content: 'Perfecto, tengo la información de esa propiedad. ¿Te gustaría agendar una visita para verla en persona?',
                timestamp: dayjs().subtract(1, 'day').add(15, 'minute').toDate(),
                type: 'regular',
                isMyMessage: true,
            },
            {
                id: 'msg_1_5',
                sender: {
                    id: 'user_1',
                    name: 'Cliente Demo',
                    avatarImageUrl: '/img/avatars/thumb-1.jpg',
                },
                content: 'Sí, me gustaría. ¿Qué días están disponibles?',
                timestamp: dayjs().subtract(5, 'minute').toDate(),
                type: 'regular',
                isMyMessage: false,
            },
        ]
    },
    chat_2: {
        id: 'chat_2',
        conversation: [
            {
                id: 'msg_2_1',
                sender: {
                    id: '1',
                    name: 'Yo',
                    avatarImageUrl: '/img/avatars/thumb-8.jpg',
                },
                content: 'Hola María, adjunto la información que solicitaste sobre el apartamento en venta',
                timestamp: dayjs().subtract(2, 'day').toDate(),
                type: 'regular',
                isMyMessage: true,
            },
            {
                id: 'msg_2_2',
                sender: {
                    id: 'user_2',
                    name: 'María García',
                    avatarImageUrl: '/img/avatars/thumb-2.jpg',
                },
                content: 'Muchas gracias, lo revisaré',
                timestamp: dayjs().subtract(2, 'day').add(30, 'minute').toDate(),
                type: 'regular',
                isMyMessage: false,
            },
            {
                id: 'msg_2_3',
                sender: {
                    id: 'user_2',
                    name: 'María García',
                    avatarImageUrl: '/img/avatars/thumb-2.jpg',
                },
                content: 'Una consulta, ¿el precio incluye los impuestos de transferencia?',
                timestamp: dayjs().subtract(1, 'day').toDate(),
                type: 'regular',
                isMyMessage: false,
            },
            {
                id: 'msg_2_4',
                sender: {
                    id: '1',
                    name: 'Yo',
                    avatarImageUrl: '/img/avatars/thumb-8.jpg',
                },
                content: 'No, los impuestos de transferencia son adicionales y representan aproximadamente el 2% del valor de la propiedad',
                timestamp: dayjs().subtract(1, 'day').add(15, 'minute').toDate(),
                type: 'regular',
                isMyMessage: true,
            },
            {
                id: 'msg_2_5',
                sender: {
                    id: 'user_2',
                    name: 'María García',
                    avatarImageUrl: '/img/avatars/thumb-2.jpg',
                },
                content: 'Gracias por la información',
                timestamp: dayjs().subtract(1, 'hour').toDate(),
                type: 'regular',
                isMyMessage: false,
            },
        ]
    },
}

// Función para simular la obtención de una conversación
export const getMockConversation = (id: string) => {
    if (mockConversationData[id as keyof typeof mockConversationData]) {
        return mockConversationData[id as keyof typeof mockConversationData];
    }
    
    // Si no existe la conversación específica, generar una conversación aleatoria
    return {
        id,
        conversation: [
            {
                id: `msg_${id}_1`,
                sender: {
                    id: id.replace('chat_', 'user_'),
                    name: 'Usuario',
                    avatarImageUrl: '/img/avatars/thumb-1.jpg',
                },
                content: 'Hola, ¿cómo puedo obtener más información?',
                timestamp: dayjs().subtract(1, 'day').toDate(),
                type: 'regular',
                isMyMessage: false,
            },
            {
                id: `msg_${id}_2`,
                sender: {
                    id: '1',
                    name: 'Yo',
                    avatarImageUrl: '/img/avatars/thumb-8.jpg',
                },
                content: 'Claro, estaré encantado de ayudarte. ¿Qué tipo de información necesitas?',
                timestamp: dayjs().subtract(1, 'day').add(5, 'minute').toDate(),
                type: 'regular',
                isMyMessage: true,
            },
        ]
    };
}