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
    // Acciones del sales funnel
    setCurrentLeadStage: (stageId: string | undefined) => void
    updateLeadStage: (leadId: string, stageId: string) => Promise<void>
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
                    'confirmar': 'confirmado',
                    'confirmed': 'confirmado',
                    'cerrado': 'cerrado',
                    'closed': 'cerrado',
                    'nuevos': 'nuevos',
                    'new': 'nuevos',
                    'prospectando': 'prospectando',
                    'prospecting': 'prospectando',
                    'calificacion': 'calificacion',
                    'qualification': 'calificacion',
                    'oportunidad': 'oportunidad',
                    'opportunity': 'oportunidad'
                };
                
                if (stageMapping[stageId]) {
                    mappedStage = stageMapping[stageId];
                    console.log('ChatStore: Etapa mapeada de', stageId, 'a', mappedStage);
                }
                
                window.dispatchEvent(new CustomEvent('lead-stage-updated', {
                    detail: { leadId, newStage: mappedStage },
                    bubbles: true,
                    composed: true
                }));
                
                // Usar BroadcastChannel para comunicación instantánea entre pestañas
                broadcastLeadUpdate(leadId, mappedStage);
                
                // También guardar en localStorage como fallback
                simpleLeadUpdateStore.saveUpdate(leadId, mappedStage);
                
                // También notificar a través del store global (para la misma pestaña)
                leadUpdateStore.notifyUpdate(leadId, mappedStage);
            }
        } catch (error: any) {
            console.error('Error actualizando etapa del lead:', error);
            
            // Si es un error de lead no encontrado y es una etapa especial, no es crítico
            if (error.message && error.message.includes('No se encontró el lead') && 
                (stageId === 'confirmado' || stageId === 'confirmed' || 
                 stageId === 'cerrado' || stageId === 'closed')) {
                console.warn('El lead no se encontró, pero como es una etapa especial, no es un error crítico');
                // No lanzar el error hacia arriba, permitir que continúe el flujo
                return;
            }
            
            // Para otros errores, lanzar hacia arriba
            throw error;
        }
    },
    
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
                    let tenantId = cookieStore ? cookieStore.split('=')[1] : process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'default';
                    
                    // Si el tenant_id está vacío o es 'undefined', usar el default
                    if (!tenantId || tenantId === 'undefined' || tenantId === 'null' || tenantId === '') {
                        tenantId = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'afa60b0a-3046-4607-9c48-266af6e1d322';
                    }
                    
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

            // Si estamos en el servidor o hubo un error, crear plantillas de demostración
            console.log('No se pudieron cargar plantillas del backend. Creando plantillas de demostración.');
            
            // Plantillas de demostración para desarrollo
            const mockTemplates: ChatTemplate[] = [
                {
                    id: 'demo-basic-lead',
                    name: 'Flujo básico de lead',
                    description: 'Plantilla de demostración para captura de leads',
                    isActive: true,
                    isEnabled: true,
                    avatarUrl: '/img/avatars/thumb-2.jpg',
                    tokensEstimated: 500,
                    category: 'lead',
                    flowId: null
                },
                {
                    id: 'demo-appointment',
                    name: 'Agendar citas',
                    description: 'Plantilla para agendar citas con clientes',
                    isActive: false,
                    isEnabled: true,
                    avatarUrl: '/img/avatars/thumb-3.jpg',
                    tokensEstimated: 750,
                    category: 'appointment',
                    flowId: null
                },
                {
                    id: 'demo-support',
                    name: 'Soporte al cliente',
                    description: 'Plantilla de atención al cliente',
                    isActive: false,
                    isEnabled: true,
                    avatarUrl: '/img/avatars/thumb-4.jpg',
                    tokensEstimated: 600,
                    category: 'support',
                    flowId: null
                }
            ];
            
            get().setTemplates(mockTemplates);
            
            return;
        } catch (error) {
            console.error('Error general al configurar plantillas en store:', error)
            get().setTemplates([]);
            return;
        }
    },
}))
