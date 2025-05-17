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
            // Identificar si hay una plantilla de lead para establecerla como activa
            const leadTemplate = templates.find(t =>
                t.name && t.name.toLowerCase().includes('lead') &&
                t.name.toLowerCase().includes('flujo')
            );

            // Si hay una plantilla de lead o alguna ya marcada como activa, respetarla
            // De lo contrario, marcar la primera como activa
            const existingActive = templates.find(t => t.isActive === true);

            const updatedTemplates = templates.map((template) => ({
                ...template,
                isActive: existingActive ? template.id === existingActive.id :
                         (leadTemplate ? template.id === leadTemplate.id :
                         templates.indexOf(template) === 0)
            }));

            // Determinar qué templateId usar como activo
            const activeTemplate = updatedTemplates.find(t => t.isActive);
            const activeId = activeTemplate ? activeTemplate.id :
                        (updatedTemplates.length > 0 ? updatedTemplates[0].id : '');

            console.log(`Plantillas cargadas: ${updatedTemplates.length}. Plantilla activa ID: ${activeId}`);
            if (activeTemplate) {
                console.log(`Plantilla activa: ${activeTemplate.name}`);
            }

            return {
                templates: updatedTemplates,
                activeTemplateId: activeId,
            }
        }),
    setActiveTemplate: (templateId) =>
        set(() => {
            console.log(`Configurando nueva plantilla activa: ${templateId}`);

            // Marcar solo la plantilla seleccionada como activa
            const updatedTemplates = get().templates.map((template) => ({
                ...template,
                isActive: template.id === templateId,
            }));

            const activatedTemplate = updatedTemplates.find(t => t.id === templateId);
            if (activatedTemplate) {
                console.log(`Plantilla "${activatedTemplate.name}" activada correctamente`);
            }

            return {
                templates: updatedTemplates,
                activeTemplateId: templateId,
            }
        }),
    // Implementación de la acción fetchTemplates compatible con backend
    fetchTemplates: async () => {
        try {
            // Solo ejecutar fetch en el cliente, nunca en el servidor
            if (typeof window !== 'undefined') {
                console.log('Obteniendo plantillas desde API (cliente)...');

                try {
                    // Intentar obtener plantillas del backend
                    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3090';
                    
                    // Obtener tenant_id de las cookies o usar el default
                    const cookieStore = document.cookie.split('; ').find(row => row.startsWith('tenant_id='));
                    const tenantId = cookieStore ? cookieStore.split('=')[1] : process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'default';
                    
                    console.log('Frontend: Tenant ID obtenido:', tenantId);
                    console.log('Frontend: URL backend:', BACKEND_URL);
                    
                    const url = `${BACKEND_URL}/api/text/templates?tenant_id=${tenantId}`;
                    console.log('Frontend: Llamando a:', url);
                    
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const jsonData = await response.json();

                        if (jsonData && jsonData.success && Array.isArray(jsonData.templates)) {
                            const templates = jsonData.templates;
                            console.log('Plantillas obtenidas desde API:', templates);

                            if (templates.length > 0) {
                                // Formatear las plantillas para el frontend
                                const formattedTemplates = templates.map((template: any) => ({
                                    id: template.id,
                                    name: template.name,
                                    description: template.description || 'Sin descripción',
                                    isActive: template.isActive || false,
                                    isEnabled: true,
                                    avatarUrl: '/img/avatars/thumb-2.jpg',
                                    tokensEstimated: template.tokensEstimated || 500,
                                    category: template.category || 'general',
                                    flowId: template.flowId || null
                                }));

                                // Si ninguna está activa, activar la primera
                                if (!formattedTemplates.some((t: ChatTemplate) => t.isActive) && formattedTemplates.length > 0) {
                                    // Buscar primero el "Flujo basico lead"
                                    const leadTemplate = formattedTemplates.find((t: ChatTemplate) => 
                                        t.name.toLowerCase().includes('flujo') && 
                                        t.name.toLowerCase().includes('basico') && 
                                        t.name.toLowerCase().includes('lead')
                                    );
                                    
                                    if (leadTemplate) {
                                        leadTemplate.isActive = true;
                                    } else {
                                        formattedTemplates[0].isActive = true;
                                    }
                                }

                                get().setTemplates(formattedTemplates);

                                // También establecer activeTemplateId si hay alguna activa
                                const activeTemplate = formattedTemplates.find((t: ChatTemplate) => t.isActive);
                                if (activeTemplate) {
                                    get().setActiveTemplate(activeTemplate.id);
                                }

                                return;
                            }
                        }
                    } else {
                        console.warn('Error en la respuesta de la API:', response.status, response.statusText);
                    }
                } catch (fetchError) {
                    console.warn('Error al obtener plantillas de la API:', fetchError);
                }
            }

            // Si estamos en el servidor o hubo un error, devolver array vacío
            console.log('No se pudieron cargar plantillas del backend. Mostrando mensaje de error.');
            
            // No establecer plantillas predeterminadas, dejar el array vacío
            get().setTemplates([]);
            
            return;
        } catch (error) {
            console.error('Error general al configurar plantillas en store:', error)
            get().setTemplates([]);
            return;
        }
    },
}))
