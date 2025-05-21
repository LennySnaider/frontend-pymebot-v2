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
import { leadUpdateStore } from '@/stores/leadUpdateStore'
import { simpleLeadUpdateStore } from '@/stores/simpleLeadUpdateStore'
import { broadcastLeadUpdate } from '@/utils/broadcastLeadUpdate'
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
    // Estado del sales funnel
    currentLeadStage?: string
    // Estado de error para plantillas
    templatesError: string | null
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
    setTemplatesError: (error: string | null) => void // Nueva acción para gestionar errores
    // Acciones del sales funnel
    setCurrentLeadStage: (stageId: string | undefined) => void
    updateLeadStage: (leadId: string, stageId: string) => Promise<void>
    // Nueva acción para actualizar chats en tiempo real
    refreshChatList: () => Promise<void>
    // Nueva acción para actualizar nombres de chat/lead
    updateChatName: (chatId: string, newName: string) => void
    // Nueva acción para actualizar metadata de un chat
    updateChatMetadata: (chatId: string, metadata: Record<string, any>) => void
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
    // Estado inicial del sales funnel
    currentLeadStage: undefined,
    // Estado inicial de error para plantillas
    templatesError: null,
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
    
    // Gestión de errores de plantillas
    setTemplatesError: (error) => set(() => ({ templatesError: error })),
    
    // Nueva función para actualizar nombre de chat (especialmente útil para leads)
    updateChatName: (chatId, newName) => 
        set((state) => {
            console.log(`ChatStore: Actualizando nombre de chat ${chatId} a "${newName}"`);
            
            // Actualizar en la lista de chats
            const updatedChats = state.chats.map((chat) => {
                if (chat.id === chatId) {
                    console.log(`ChatStore: Encontrado chat ${chatId}, actualizando nombre de "${chat.name}" a "${newName}"`);
                    return {
                        ...chat,
                        name: newName
                    };
                }
                return chat;
            });
            
            // Actualizar en el chat seleccionado si coincide
            let updatedSelectedChat = state.selectedChat;
            if (state.selectedChat.id === chatId) {
                console.log(`ChatStore: Actualizando nombre en chat seleccionado a "${newName}"`);
                updatedSelectedChat = {
                    ...state.selectedChat,
                    name: newName,
                    user: state.selectedChat.user ? {
                        ...state.selectedChat.user,
                        name: newName
                    } : undefined
                };
            }
            
            return {
                chats: updatedChats,
                selectedChat: updatedSelectedChat
            };
        }),

    // Nueva función para actualizar metadata de un chat específico
    updateChatMetadata: (chatId, metadata) =>
        set((state) => {
            console.log(`ChatStore: Actualizando metadata de chat ${chatId}:`, metadata);
            
            // Verificar si el chat existe
            const chatExists = state.chats.some(chat => chat.id === chatId);
            if (!chatExists) {
                console.warn(`ChatStore: No se encontró chat con ID ${chatId} para actualizar metadata`);
                // Si no está en la lista pero es un lead, podría necesitar un refresh completo
                if (chatId.startsWith('lead_')) {
                    console.log(`ChatStore: Intentando refrescar lista para incluir ${chatId}`);
                    // Ejecutamos refreshChatList en el próximo ciclo para no interferir con este update
                    setTimeout(() => {
                        try {
                            const refreshFn = get().refreshChatList;
                            if (typeof refreshFn === 'function') {
                                refreshFn();
                            }
                        } catch (error) {
                            console.error('Error al refrescar lista:', error);
                        }
                    }, 0);
                }
                return state; // Mantener estado sin cambios
            }
            
            // Actualizar en la lista de chats
            const updatedChats = state.chats.map((chat) => {
                if (chat.id === chatId) {
                    // Combinar metadata existente con la nueva
                    const updatedMetadata = {
                        ...(chat.metadata || {}),
                        ...metadata
                    };
                    
                    // También actualizar lastActivity timestamp para que aparezca primero en la lista
                    if (!updatedMetadata.lastActivity) {
                        updatedMetadata.lastActivity = Date.now();
                    }
                    
                    return {
                        ...chat,
                        metadata: updatedMetadata
                    };
                }
                return chat;
            });
            
            // Actualizar en el chat seleccionado si coincide
            let updatedSelectedChat = state.selectedChat;
            if (state.selectedChat.id === chatId) {
                console.log(`ChatStore: Actualizando metadata en chat seleccionado:`, metadata);
                updatedSelectedChat = {
                    ...state.selectedChat,
                    ...Object.entries(metadata).reduce((acc, [key, value]) => {
                        // Solo actualizar propiedades directas que coincidan con nombres de metadata
                        if (key === 'stage') acc.stage = value;
                        return acc;
                    }, {} as Partial<SelectedChat>)
                };
            }
            
            return {
                chats: updatedChats,
                selectedChat: updatedSelectedChat
            };
        }),
    
    // Nueva función para actualizar lista de chats (prospectos) en tiempo real
    refreshChatList: async () => {
        try {
            console.log('ChatStore: Actualizando lista de chats...');
            
            // Solo ejecutar en el cliente
            if (typeof window === 'undefined') {
                console.log('ChatStore: No se puede actualizar en el servidor');
                return;
            }
            
            // Mantener la configuración actual
            const currentChatType = get().selectedChatType;
            const selectedChat = get().selectedChat;
            
            // Si está viendo prospectos/leads, actualizar específicamente esos
            if (currentChatType === 'prospects' || currentChatType === 'leads') {
                console.log('ChatStore: Actualizando lista de prospectos/leads');
                
                // Obtener el mejor servicio para obtener la lista
                let chatListService;
                
                try {
                    // Importación dinámica para evitar errores SSR
                    const { getChatListFromLeads } = await import('@/services/ChatService/getChatListClient');
                    chatListService = getChatListFromLeads;
                } catch (error) {
                    console.error('Error importando servicio de chat:', error);
                    return;
                }
                
                // Obtener lista actualizada
                const updatedChats = await chatListService();
                
                if (updatedChats && Array.isArray(updatedChats)) {
                    console.log('ChatStore: Lista actualizada:', updatedChats.length, 'chats');
                    
                    // Actualizar lista manteniendo chats no-lead existentes
                    const existingNonLeadChats = get().chats.filter(
                        chat => chat.chatType !== 'leads' && chat.chatType !== 'prospects'
                    );
                    
                    set({
                        chats: [...existingNonLeadChats, ...updatedChats],
                        chatsFetched: true
                    });
                    
                    // Verificar si el chat seleccionado sigue existiendo
                    const selectedChatStillExists = updatedChats.some(chat => chat.id === selectedChat.id);
                    
                    if (!selectedChatStillExists && selectedChat.id && selectedChat.id.startsWith('lead_')) {
                        console.log('ChatStore: El chat seleccionado ya no existe, seleccionando otro');
                        
                        // Seleccionar el primer chat disponible si el actual ya no existe
                        if (updatedChats.length > 0) {
                            const firstChat = updatedChats[0];
                            get().setSelectedChat({
                                id: firstChat.id,
                                user: {
                                    id: firstChat.userId || firstChat.groupId,
                                    avatarImageUrl: firstChat.avatar,
                                    name: firstChat.name,
                                },
                                muted: firstChat.muted,
                                chatType: firstChat.chatType,
                                stage: firstChat.metadata?.stage || 'new',
                                name: firstChat.name,
                                avatar: firstChat.avatar,
                                tenantId: firstChat.tenantId,
                            });
                        } else {
                            // No hay chats disponibles, limpiar selección
                            get().setSelectedChat({});
                        }
                    }
                }
            } else {
                console.log('ChatStore: Tipo de chat actual no es prospects/leads, no se actualiza');
            }
        } catch (error) {
            console.error('Error actualizando lista de chats:', error);
            throw error;
        }
    },
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
                templatesError: null // Limpiar cualquier error al cargar plantillas exitosamente
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
    
    // Acciones del sales funnel
    setCurrentLeadStage: (stageId) =>
        set(() => ({ currentLeadStage: stageId })),
    
    updateLeadStage: async (leadId, stageId) => {
        try {
            // Actualizamos el estado local inmediatamente para UI responsiva
            set(() => ({ currentLeadStage: stageId }));
            
            // Log para depuración
            console.log('ChatStore: Actualizando etapa de lead', { leadId, stageId });
            
            // Para etapas especiales, manejar de manera diferente
            const isSpecialStage = stageId === 'confirmado' || stageId === 'confirmed' || 
                                  stageId === 'cerrado' || stageId === 'closed';
            
            let response;
            
            if (isSpecialStage) {
                console.log('ChatStore: Manejando etapa especial:', stageId);
                
                // Usar el endpoint especial para etapas especiales
                response = await fetch('/api/leads/update-special-stage', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        leadId, 
                        specialStage: stageId
                    })
                });
            } else {
                // Llamar a la API regular para actualizar el lead en el sales funnel
                response = await fetch('/api/leads/update-stage', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        leadId, 
                        newStage: stageId,
                        fromChatbot: true // Indicamos que viene del chatbot
                    })
                });
            }
            
            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.error || 'Error al actualizar etapa';
                
                // Si es un error 404, el lead no existe
                if (response.status === 404) {
                    console.warn(`Lead ${leadId} no encontrado. Es posible que ya haya sido eliminado o procesado.`);
                    // Aún así, emitir el evento para que el UI se actualice
                    // ya que en el caso de etapas especiales, el lead desaparece del funnel
                    if (isSpecialStage) {
                        console.log('ChatStore: Emitiendo evento de etapa especial aunque el lead no se encontró');
                        // Continuar con la emisión del evento
                    } else {
                        throw new Error(errorMessage);
                    }
                } else {
                    throw new Error(errorMessage);
                }
            }
            
            let data = null;
            
            // Solo intentar parsear el JSON si no fue un error 404 con etapa especial
            if (response.ok || (response.status === 404 && isSpecialStage)) {
                try {
                    data = await response.json();
                } catch (e) {
                    console.log('ChatStore: No se pudo parsear el JSON de respuesta, continuando...');
                }
            }
            
            console.log(`Lead ${leadId} movido a etapa ${stageId}`, data || '(sin data)');
            
            // Emitir evento para actualizar el sales funnel en tiempo real
            if (typeof window !== 'undefined') {
                console.log('ChatStore: Disparando evento lead-stage-updated con:', { leadId, newStage: stageId });
                
                // Mapear los nombres de etapas del frontend al backend si es necesario
                let mappedStage = stageId;
                const stageMapping: Record<string, string> = {
                    'nuevos': 'new',
                    'prospectando': 'prospecting',
                    'calificación': 'qualification',
                    'calificacion': 'qualification',
                    'oportunidad': 'opportunity',
                    'confirmado': 'confirmed',
                    'cerrado': 'closed'
                };
                
                if (stageMapping[stageId]) {
                    mappedStage = stageMapping[stageId];
                }
                
                // Notificar a través de broadcast para actualizar UI
                try {
                    console.log('ChatStore: Llamando broadcastLeadUpdate con:', { type: 'update-stage', leadId, data: { newStage: mappedStage, rawStage: stageId } });
                    broadcastLeadUpdate('update-stage', leadId, {
                        newStage: mappedStage,
                        rawStage: stageId
                    });
                } catch (error) {
                    console.error('ChatStore: Error en broadcastLeadUpdate:', error);
                }
                
                // Usar también el store específico para leads disponible
                if (simpleLeadUpdateStore && typeof simpleLeadUpdateStore.getState === 'function') {
                    simpleLeadUpdateStore.getState().setChanged(true);
                } else {
                    console.warn('simpleLeadUpdateStore.getState no es una función');
                }
                
                // Usar el nuevo leadUpdateStore con API mejorada
                if (leadUpdateStore && typeof leadUpdateStore.addUpdate === 'function') {
                    leadUpdateStore.addUpdate({
                        type: 'update-stage',
                        leadId: leadId,
                        data: {
                            newStage: mappedStage,
                            rawStage: stageId
                        },
                        time: Date.now()
                    });
                } else {
                    console.warn('leadUpdateStore.addUpdate no es una función o no está disponible');
                }
                
                // Actualizar el lead en la lista de chats si está en el chat
                const leadChatId = `lead_${leadId}`;
                const leadInChats = get().chats.find(chat => chat.id === leadChatId);
                
                if (leadInChats) {
                    console.log(`ChatStore: Actualizando etapa de lead ${leadId} en lista de chats a ${mappedStage}`);
                    get().refreshChatList();
                }
            }
            
            // Actualizar el stage en el estado global
            set(() => ({ currentLeadStage: stageId }));
            
            return data;
        } catch (error) {
            console.error('Error al actualizar etapa de lead:', error);
            
            // Revertir el state local en caso de error
            set(() => ({ currentLeadStage: undefined }));
            
            throw error;
        }
    },
    
    // Cargar plantillas de chat desde el backend
    fetchTemplates: async () => {
        try {
            console.log('ChatStore: Cargando plantillas de chat...');
            
            // Solo ejecutar en el cliente
            if (typeof window === 'undefined') {
                console.log('ChatStore: No se pueden cargar plantillas en SSR');
                return;
            }
            
            // Limpiar cualquier error previo
            set(() => ({ templatesError: null }));
            
            // Intentar cargar desde la API principal
            try {
                // Primero intentar con la API principal del backend
                const mainApiUrl = '/api/chatbot/templates';
                console.log(`ChatStore: Intentando cargar desde API principal: ${mainApiUrl}`);
                
                const mainResponse = await fetch(mainApiUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache',
                        // Ya no enviamos token para evitar error de JWT
                    }
                });
                
                if (!mainResponse.ok) {
                    console.error(`Error del servidor: ${mainResponse.status} ${mainResponse.statusText}`);
                    
                    // Intentar obtener detalles del error
                    let errorDetails = '';
                    try {
                        const errorData = await mainResponse.json();
                        errorDetails = errorData.error || errorData.message || errorData.details || '';
                        console.error('Detalles del error:', errorDetails);
                    } catch (e) {
                        console.error('No se pudo obtener detalles del error');
                    }
                    
                    // Establecer mensaje de error específico
                    const errorMessage = `Error al cargar plantillas: ${mainResponse.status} ${mainResponse.statusText} ${errorDetails ? `- ${errorDetails}` : ''}`;
                    set(() => ({ templatesError: errorMessage }));
                    
                    throw new Error(errorMessage);
                }
                
                const mainData = await mainResponse.json();
                if (!Array.isArray(mainData)) {
                    const errorMessage = 'Formato de respuesta incorrecto. Se esperaba un array de plantillas.';
                    console.error(errorMessage, mainData);
                    set(() => ({ templatesError: errorMessage }));
                    throw new Error(errorMessage);
                }
                
                console.log('ChatStore: Plantillas cargadas exitosamente:', mainData.length);
                
                // Guardar en localStorage para uso futuro
                try {
                    localStorage.setItem('chatbot_templates', JSON.stringify(mainData));
                } catch (saveError) {
                    console.warn('ChatStore: No se pudieron guardar plantillas en localStorage:', saveError);
                }
                
                // Actualizar el store
                get().setTemplates(mainData);
                
                return;
            } catch (error) {
                // Si falla la API principal, intentamos recuperar de localStorage como último recurso
                console.error('Error al cargar plantillas desde API:', error);
                
                try {
                    const localTemplatesJSON = localStorage.getItem('chatbot_templates');
                    if (localTemplatesJSON) {
                        const localTemplates = JSON.parse(localTemplatesJSON);
                        if (Array.isArray(localTemplates) && localTemplates.length > 0) {
                            console.log('ChatStore: FALLBACK - Usando plantillas almacenadas en localStorage:', localTemplates.length);
                            
                            // Actualizar el store con las plantillas de localStorage
                            get().setTemplates(localTemplates);
                            
                            // Establecer un mensaje de advertencia en vez de error
                            set(() => ({ templatesError: 'Usando plantillas en caché. No se pudo conectar al servidor.' }));
                            return;
                        }
                    }
                } catch (localStorageError) {
                    console.warn('ChatStore: Error al leer plantillas de localStorage:', localStorageError);
                }
                
                // Si llegamos aquí, no pudimos obtener plantillas de ninguna fuente
                const finalError = error instanceof Error 
                    ? error.message 
                    : 'No se pudieron cargar plantillas de chatbot. Verifica la conexión con el backend.';
                
                set(() => ({ templatesError: finalError }));
                throw error;
            }
        } catch (error) {
            console.error('ChatStore: Error general en fetchTemplates:', error);
            
            // Asegurarse de que el error esté establecido
            const errorMessage = error instanceof Error 
                ? error.message 
                : 'Error desconocido al cargar plantillas';
            
            set(() => ({ templatesError: errorMessage }));
            
            // Propagamos el error para que pueda ser manejado apropiadamente
            throw error;
        }
    }
}))