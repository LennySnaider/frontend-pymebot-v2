import { create } from 'zustand'
import type {
    Chats,
    ChatType,
    Conversation,
    Conversations,
    Message,
    SelectedChat,
} from '../types'
import { ChatTemplate } from '../_components/TemplateSelector'
// Evitar importar cualquier API o módulo que dependa de apis con este comentario
// Las importaciones deben hacerse dinámicamente en runtime (cliente)

type ContactInfoDrawer = {
    userId: string
    chatId: string
    chatType: ChatType | ''
    open: boolean
}

export type ChatState = {
    conversationRecord: Conversations
    selectedChat: SelectedChat
    selectedChatType: ChatType | ''
    mobileSideBarExpand: boolean
    chats: Chats
    chatsFetched: boolean
    contactListDialog: boolean
    contactInfoDrawer: ContactInfoDrawer
    // Nuevos estados para las plantillas
    templates: ChatTemplate[]
    activeTemplateId: string
}

type ChatAction = {
    setChats: (payload: Chats) => void
    setChatsFetched: (payload: boolean) => void
    setSelectedChat: (payload: SelectedChat) => void
    setContactInfoDrawer: (payload: ContactInfoDrawer) => void
    setChatMute: (payload: { id: string; muted: boolean }) => void
    setSelectedChatType: (payload: ChatType | '') => void
    setChatRead: (payload: string) => void
    setContactListDialog: (payload: boolean) => void
    setMobileSidebar: (payload: boolean) => void
    pushConversationRecord: (payload: Conversation) => void
    pushConversationMessage: (id: string, conversation: Message) => void
    deleteConversationRecord: (payload: string) => void
    // Nuevas acciones para las plantillas
    setTemplates: (payload: ChatTemplate[]) => void
    setActiveTemplate: (templateId: string) => void
    fetchTemplates: () => Promise<void> // Nueva acción para cargar plantillas
}

const initialState: ChatState = {
    conversationRecord: [],
    selectedChat: {},
    mobileSideBarExpand: false,
    chats: [],
    selectedChatType: 'personal',
    chatsFetched: false,
    contactListDialog: false,
    contactInfoDrawer: {
        userId: '',
        chatId: '',
        chatType: '',
        open: false,
    },
    // Estado inicial para plantillas
    templates: [],
    activeTemplateId: '',
}

export const useChatStore = create<ChatState & ChatAction>((set, get) => ({
    ...initialState,
    setChats: (payload) => set(() => ({ chats: payload })),
    setChatsFetched: (payload) => set(() => ({ chatsFetched: payload })),
    setSelectedChat: (payload) => set(() => ({ selectedChat: payload })),
    setContactInfoDrawer: (payload) =>
        set(() => ({ contactInfoDrawer: payload })),
    setChatMute: ({ id, muted }) =>
        set(() => {
            const chats = get().chats.map((chat) => {
                if (chat.id === id) {
                    chat.muted = muted
                }
                return chat
            })
            return { chats }
        }),
    setSelectedChatType: (payload) =>
        set(() => ({ selectedChatType: payload })),
    setChatRead: (id) =>
        set(() => {
            const chats = get().chats.map((chat) => {
                if (chat.id === id) {
                    chat.unread = 0
                }
                return chat
            })
            return { chats }
        }),
    setContactListDialog: (payload) =>
        set(() => ({ contactListDialog: payload })),
    setMobileSidebar: (payload) =>
        set(() => ({ mobileSideBarExpand: payload })),
    pushConversationRecord: (payload) =>
        set(() => {
            const previousConversationRecord = get().conversationRecord
            return {
                conversationRecord: [
                    ...previousConversationRecord,
                    ...[payload],
                ],
            }
        }),
    pushConversationMessage: (id, message) =>
        set(() => {
            const previousConversationRecord = get().conversationRecord

            // Verificar si la conversación existe
            const existingRecord = previousConversationRecord.find(record => record.id === id);

            let conversationRecord;

            if (existingRecord) {
                // Si la conversación existe, añadir el mensaje
                conversationRecord = structuredClone(previousConversationRecord).map((record) => {
                    if (id === record.id) {
                        // Registrar debug para revisar el mensaje
                        console.log('Añadiendo mensaje a conversación existente:', id, message);
                        record.conversation.push(message);
                    }
                    return record;
                });
            } else {
                // Si la conversación no existe, crearla con el mensaje
                console.log('Creando nueva conversación para:', id);
                const newRecord = {
                    id,
                    conversation: [message]
                };
                conversationRecord = [...previousConversationRecord, newRecord];
            }

            return {
                conversationRecord,
            };
        }),
    deleteConversationRecord: (payload) =>
        set(() => {
            const previousConversationRecord = get().conversationRecord
            const previousChats = get().chats
            return {
                conversationRecord: previousConversationRecord.filter(
                    (record) => record.id !== payload,
                ),
                chats: previousChats.filter((chat) => chat.id !== payload),
            }
        }),
    // Nuevas acciones para las plantillas
    setTemplates: (templates) =>
        set(() => {
            // Aseguramos que solo una plantilla está activa
            const updatedTemplates = templates.map((template, index) => ({
                ...template,
                isActive: index === 0 ? true : false,
            }))

            return {
                templates: updatedTemplates,
                activeTemplateId:
                    updatedTemplates.length > 0 ? updatedTemplates[0].id : '',
            }
        }),
    setActiveTemplate: (templateId) =>
        set(() => {
            const updatedTemplates = get().templates.map((template) => ({
                ...template,
                isActive: template.id === templateId,
            }))

            return {
                templates: updatedTemplates,
                activeTemplateId: templateId,
            }
        }),
    // Implementación de la acción fetchTemplates compatible con SSR
    fetchTemplates: async () => {
        try {
            // Solo ejecutar fetch en el cliente, nunca en el servidor
            if (typeof window !== 'undefined') {
                console.log('Obteniendo plantillas desde API (cliente)...');

                try {
                    // Primer intento: obtener plantillas reales del backend
                    const response = await fetch('/api/chatbot/public-templates', {
                        method: 'GET',
                        headers: {
                            'Cache-Control': 'no-cache',
                            'Pragma': 'no-cache'
                        },
                        credentials: 'include' // Incluir cookies para el tenant_id
                    });

                    if (response.ok) {
                        const jsonData = await response.json();

                        if (jsonData && jsonData.success && Array.isArray(jsonData.templates)) {
                            const templates = jsonData.templates;
                            console.log('Plantillas obtenidas desde API:', templates);

                            if (templates.length > 0) {
                                // NO agregamos ninguna plantilla personalizada
                                // SOLO usamos exactamente lo que viene del servidor
                                console.log('Usando SOLO las plantillas obtenidas del servidor:', templates.map(t => t.name).join(', '));

                                get().setTemplates(templates);
                                return templates;
                            }
                        }
                    } else {
                        console.warn('Error en la respuesta de la API:', response.status, response.statusText);
                    }
                } catch (fetchError) {
                    console.warn('Error al obtener plantillas de la API:', fetchError);
                }
            }

            // Si estamos en el servidor o hubo un error, no mostrar ninguna plantilla
            // IMPORTANTE: NO usar plantillas predeterminadas
            console.log('No se pudieron obtener plantillas del servidor. No se usará ninguna plantilla predeterminada.');

            // Devolvemos array vacío para forzar error explícito
            get().setTemplates([]);
            return [];
        } catch (error) {
            console.error('Error general al configurar plantillas en store:', error)
            return [];
        }
    },
}))
