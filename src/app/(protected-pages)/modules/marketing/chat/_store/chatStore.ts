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
import apiGetChatTemplates from '@/services/ChatService/apiGetChatTemplates' // Importar el servicio

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
            const conversationRecord = structuredClone(
                previousConversationRecord,
            ).map((record) => {
                if (id === record.id) {
                    record.conversation.push(message)
                }
                return record
            })
            return {
                conversationRecord,
            }
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
    // Implementación de la nueva acción fetchTemplates
    fetchTemplates: async () => {
        try {
            const templatesData = await apiGetChatTemplates() // Llama al servicio API
            if (templatesData) {
                get().setTemplates(templatesData) // Usa la acción existente para actualizar el estado
            }
        } catch (error) {
            console.error('Error fetching templates in store:', error)
            // Opcionalmente, manejar el estado de error en el store
        }
    },
}))
