/**
 * src/app/(protected-pages)/modules/marketing/chat/_components/ChatBody.tsx
 * Componente principal del cuerpo del chat. Maneja la visualización de mensajes
 * y la entrada de texto del usuario.
 * @version 2.0.0
 * @updated 2025-04-26
 */

'use client'

// IMPORTANTE: Evitamos configuraciones de SSR en el componente
// La configuración la maneja page.tsx para todo el módulo

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Avatar from '@/components/ui/Avatar'
import Card from '@/components/ui/Card'
import ChatBox from '@/components/view/ChatBox'
import ChatAction from './ChatAction'
import StartConverstation from '@/assets/svg/StartConverstation'
import { useChatStore } from '../_store/chatStore'
import { toast } from '@/components/ui'
// Importamos de forma dinámica para evitar problemas de SSR
import dynamic from 'next/dynamic'

// Función helper para obtener clases de color según la etapa
const getStageColorClasses = (stage: string) => {
    switch (stage) {
        case 'new':
        case 'nuevo':
        case 'nuevos':
            return 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
        case 'prospecting':
        case 'prospectando':
        case 'prospeccion':
            return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
        case 'qualification':
        case 'calificacion':
        case 'calificación':
            return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
        case 'opportunity':
        case 'oportunidad':
            return 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
        default:
            return 'bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
    }
}

// Función para obtener el nombre de la etapa en español
const getStageName = (stage: string) => {
    switch (stage) {
        case 'new':
        case 'nuevo':
        case 'nuevos':
            return 'Nuevo'
        case 'prospecting':
        case 'prospectando':
        case 'prospeccion':
            return 'Prospección'
        case 'qualification':
        case 'calificacion':
        case 'calificación':
            return 'Calificación'
        case 'opportunity':
        case 'oportunidad':
            return 'Oportunidad'
        default:
            return stage
    }
}

// Cargamos los servicios solo en el cliente - Variables inicializadas con null
let apiGetConversation: any = null
let apiSendChatMessage: any = null

// Técnica más segura: usar useEffect para cargar servicios
// Esta aproximación evita código fuera de componentes que podría ejecutarse en el servidor
// En caso de error durante la carga, no bloqueará el renderizado inicial
import classNames from '@/utils/classNames'
import useResponsive from '@/utils/hooks/useResponsive'
import dayjs from 'dayjs'
import uniqueId from 'lodash/uniqueId'
import { TbChevronLeft, TbUser, TbRobot } from 'react-icons/tb'
import type {
    GetConversationResponse,
    Message,
    ChatType,
    SelectedChat,
} from '../types'
import type { ScrollBarRef } from '@/components/view/ChatBox'
import { v4 as uuidv4 } from 'uuid' // Import uuid
import { useChatPersistence } from '../_hooks/useChatPersistence'

const ChatBody = () => {
    const scrollRef = useRef<ScrollBarRef>(null)
    // Generar id's con formatos que funcionen correctamente en el backend
    const userIdRef = useRef('525591234567') // Usar formato de teléfono para crear lead
    const tenantIdRef = useRef('afa60b0a-3046-4607-9c48-266af6e1d322') // Tenant ID fijo
    const botIdRef = useRef(uuidv4()) // ID de bot

    // Estado para el modo de prueba que permite enviar mensajes como si fuéramos el lead
    // Inicializado desde localStorage para mantener sincronizado con el header
    const [testAsLead, setTestAsLead] = useState(() => {
        // Verificar si estamos en el cliente y leer de localStorage
        if (typeof window !== 'undefined') {
            const savedMode = window.localStorage.getItem('chatTestMode')
            return savedMode === 'lead'
        }
        return false
    })

    const selectedChat = useChatStore((state) => state.selectedChat)
    const conversationRecord = useChatStore((state) => state.conversationRecord)
    const pushConversationRecord = useChatStore(
        (state) => state.pushConversationRecord,
    )
    const setSelectedChat = useChatStore((state) => state.setSelectedChat)
    const pushConversationMessage = useChatStore(
        (state) => state.pushConversationMessage,
    )
    const setContactInfoDrawer = useChatStore(
        (state) => state.setContactInfoDrawer,
    )
    const activeTemplateId = useChatStore((state) => state.activeTemplateId) // Añadimos el activeTemplateId
    const templates = useChatStore((state) => state.templates) // Obtener las templates para debug
    const updateLeadStage = useChatStore((state) => state.updateLeadStage) // Función para actualizar etapa del lead
    const triggerUpdate = useChatStore((state) => state.triggerUpdate) // Escuchar cambios en triggerUpdate
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, setIsFetchingConversation] = useState(false)
    // Local conversation state removed
    // const [conversation, setConversation] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false) // Estado para controlar la carga

    // Hook para persistencia de conversaciones
    const { persistMessage, processAndPersistBotResponse } =
        useChatPersistence()

    // Efecto para escuchar cambios de nombre del lead
    useEffect(() => {
        const handleLeadNameUpdate = (e: any) => {
            if (e.detail && e.detail.leadId) {
                const chatId = `lead_${e.detail.leadId}`

                // Si el lead actualizado es el chat seleccionado actualmente
                if (selectedChat.id === chatId && e.detail.name) {
                    console.log(
                        `ChatBody: Actualizando nombre del header instantáneamente: "${e.detail.name}"`,
                    )

                    // Actualizar el selectedChat para reflejar el nuevo nombre inmediatamente
                    setSelectedChat({
                        ...selectedChat,
                        name: e.detail.name,
                        user: selectedChat.user
                            ? {
                                  ...selectedChat.user,
                                  name: e.detail.name,
                              }
                            : undefined,
                    })
                }
            }
        }

        // Escuchar eventos de actualización de nombre
        window.addEventListener('lead-name-sync', handleLeadNameUpdate)
        window.addEventListener('force-chat-refresh', handleLeadNameUpdate)

        return () => {
            window.removeEventListener('lead-name-sync', handleLeadNameUpdate)
            window.removeEventListener(
                'force-chat-refresh',
                handleLeadNameUpdate,
            )
        }
    }, [selectedChat, setSelectedChat])

    // Efecto para escuchar cambios en el modo desde otros componentes
    useEffect(() => {
        const handleModeChange = (e: any) => {
            const { testAsLead: newMode } = e.detail
            setTestAsLead(newMode)
            console.log(
                'ChatBody: Modo cambiado a',
                newMode ? 'Lead' : 'Agente',
            )
        }

        // Escuchar cambio de plantilla
        const handleTemplateChange = (e: any) => {
            console.log('ChatBody: Plantilla cambiada', e.detail)
            const { templateId, templateName } = e.detail

            // Mostrar notificación al usuario
            toast.push(
                <div className="flex items-center gap-2">
                    <span>
                        Plantilla activa: <strong>{templateName}</strong>
                    </span>
                </div>,
                {
                    duration: 3000,
                    placement: 'top',
                },
            )

            // Forzar actualización del activeTemplateId si es necesario
            if (templateId && templateId !== activeTemplateId) {
                console.log(
                    'ChatBody: Actualizando activeTemplateId en el store',
                )
                const { setActiveTemplate } = useChatStore.getState()
                setActiveTemplate(templateId)
            }
        }

        // Escuchar eventos de cambio de modo
        window.addEventListener('chatModeChanged', handleModeChange)
        window.addEventListener('template-changed', handleTemplateChange)

        return () => {
            window.removeEventListener('chatModeChanged', handleModeChange)
            window.removeEventListener('template-changed', handleTemplateChange)
        }
    }, [activeTemplateId, triggerUpdate]) // Agregar triggerUpdate como dependencia

    const { smaller } = useResponsive()

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }

    const handleProfileClick = () => {
        setContactInfoDrawer({
            userId: selectedChat.user?.id as string,
            chatId: selectedChat.id as string,
            chatType: selectedChat.chatType as ChatType,
            open: true,
        })
    }

    // Precargar los servicios de API al montar el componente
    useEffect(() => {
        // Precargar la función apiGetConversation
        async function preloadAPIs() {
            try {
                console.log('Precargando servicios API...')

                if (!apiGetConversation) {
                    const chatService = await import('@/services/ChatService')
                    apiGetConversation = chatService.apiGetConversation
                    console.log('Servicio de chat cargado correctamente')
                }

                if (!apiSendChatMessage) {
                    const messageSender = await import(
                        '@/services/ChatService/apiSendChatMessage'
                    )
                    apiSendChatMessage = messageSender.default
                    console.log(
                        'Servicio de envío de mensajes cargado correctamente',
                    )
                }

                console.log('APIs precargadas correctamente')
            } catch (error) {
                console.error('Error al precargar APIs:', error)
            }
        }

        preloadAPIs()
    }, [])

    const handlePushMessage = (message: Message, nodeId?: string) => {
        console.log('Agregando mensaje a la conversación:', message)

        // Verificar que tenemos un ID de chat válido antes de enviar el mensaje
        if (selectedChat?.id) {
            pushConversationMessage(selectedChat.id, message)

            // Persistir el mensaje si es de un lead
            if (selectedChat.id.startsWith('lead_')) {
                persistMessage(message, nodeId)

                // Actualizar contador de mensajes en la base de datos
                const leadId = selectedChat.id.replace('lead_', '')
                const conversation = conversationRecord.find(
                    (r) => r.id === selectedChat.id,
                )
                const messageCount =
                    (conversation?.conversation?.length || 0) + 1

                // Validar datos antes de intentar actualizar
                if (!leadId || leadId === selectedChat.id) {
                    console.warn('ChatBody: leadId inválido o no se pudo extraer del selectedChat.id', {
                        originalId: selectedChat.id,
                        extractedLeadId: leadId,
                        selectedChat
                    })
                } else if (typeof messageCount !== 'number' || messageCount < 0) {
                    console.warn('ChatBody: messageCount inválido', {
                        messageCount,
                        conversationLength: conversation?.conversation?.length,
                        leadId
                    })
                } else {
                    // Importar dinámicamente para evitar problemas SSR
                    import('@/services/leads/updateLeadData').then(
                        (module) => {
                            console.log('ChatBody: Módulo updateLeadData importado exitosamente', {
                                module,
                                hasUpdateLeadMessageCount: typeof module.updateLeadMessageCount === 'function',
                                moduleKeys: Object.keys(module)
                            })
                            
                            const { updateLeadMessageCount } = module
                            
                            if (typeof updateLeadMessageCount !== 'function') {
                                throw new Error(`updateLeadMessageCount no es una función. Tipo: ${typeof updateLeadMessageCount}`)
                            }
                            
                            console.log('ChatBody: Intentando actualizar contador de mensajes', {
                                leadId,
                                messageCount,
                                messageContent: message.content?.substring(0, 50)
                            })
                            
                            updateLeadMessageCount(
                                leadId,
                                messageCount,
                                message.content,
                            ).catch((err) => {
                                console.warn(
                                    'ChatBody: Error actualizando contador de mensajes (no crítico):', {
                                        leadId,
                                        messageCount,
                                        messageContent: message.content?.substring(0, 50),
                                        error: err instanceof Error ? {
                                            name: err.name,
                                            message: err.message,
                                            stack: err.stack
                                        } : err,
                                        errorType: typeof err,
                                        fullError: err,
                                        timestamp: new Date().toISOString()
                                    }
                                )
                                // No lanzar el error hacia arriba para evitar que interrumpa el flujo del chat
                            })
                        },
                    ).catch((importErr) => {
                        console.error('ChatBody: Error importando updateLeadData:', {
                            error: importErr instanceof Error ? {
                                name: importErr.name,
                                message: importErr.message,
                                stack: importErr.stack
                            } : importErr,
                            leadId,
                            messageCount,
                            timestamp: new Date().toISOString()
                        })
                    })
                }
            }
        } else {
            console.warn(
                'No se pudo agregar el mensaje al store: selectedChat.id es inválido',
            )
        }

        // Local state update removed
    }

    const handleInputChange = async ({ value }: { value: string }) => {
        // Prevenir envío si está vacío o si está cargando
        if (!value.trim() || isLoading) {
            return
        }

        setIsLoading(true) // Activar estado de carga

        // Determinar el ID a usar basado en el modo de prueba
        // En modo normal (como agente), usamos el ID generado
        // En modo prueba (como lead), usamos el ID del chat completo (con prefijo lead_)
        const effectiveUserId = testAsLead
            ? selectedChat.id || userIdRef.current
            : userIdRef.current

        // Crear mensaje personalizado según el modo
        let senderName = 'You'
        let senderAvatar = '/img/avatars/thumb-1.jpg'
        // IMPORTANTE: En el modo lead, visualmente queremos que el mensaje SIEMPRE se muestre como "mío"
        // para que aparezca a la derecha y con el estilo correcto
        let isMyMsg = true // Siempre true visualmente para fines de UI

        // Si estamos en modo lead, configurar los datos del remitente como el lead
        if (testAsLead) {
            senderName = selectedChat.name || 'Lead'
            senderAvatar = selectedChat.avatar || '/img/avatars/thumb-2.jpg'
            // No cambiamos isMyMsg a false, porque queremos que visualmente aparezca como "mi mensaje"
            console.log(
                'Modo Lead activado - Usando nombre:',
                senderName,
                'avatar:',
                senderAvatar,
                'pero manteniendo visual como mensaje propio',
            )
        }

        // Create new message object with user's input
        const userMessage: Message = {
            id: uniqueId('chat-conversation-'),
            sender: {
                id: effectiveUserId,
                name: senderName,
                avatarImageUrl: senderAvatar,
            },
            content: value,
            timestamp: dayjs().toDate(),
            type: 'regular',
            isMyMessage: isMyMsg, // Siempre true para que visualmente aparezca a la derecha
        }

        // Display user's message immediately
        handlePushMessage(userMessage)

        try {
            // Get tenant ID
            const tenantId = selectedChat.tenantId || tenantIdRef.current

            // Usar el ID apropiado según el modo
            const userId = effectiveUserId

            // No necesitamos obtener sessionId aquí porque se pasa directamente a apiSendChatMessage
            const botId = botIdRef.current

            // Envío de mensaje (log adicional)
            console.log('=========== INICIO ENVÍO ===========')
            console.log('Enviando mensaje con template_id:', activeTemplateId)
            console.log('templates disponibles:', templates)
            console.log('selectedChat:', selectedChat)
            console.log('Datos envío:', {
                value,
                userId,
                tenantId,
                botId,
                activeTemplateId,
            })

            // Asegurarnos de que tenemos las funciones API cargadas
            if (!apiSendChatMessage) {
                console.log('Cargando apiSendChatMessage...')
                const sendModule = await import(
                    '@/services/ChatService/apiSendChatMessage'
                )
                apiSendChatMessage = sendModule.default
            }

            try {
                // Ahora sí usamos la función
                const response = await apiSendChatMessage(
                    value,
                    userId,
                    tenantId,
                    botId,
                    activeTemplateId, // Añadimos el activeTemplateId como parámetro
                )

                console.log('Respuesta recibida del servidor:', response)
                console.log('Metadata en respuesta:', response?.metadata)
                console.log('Data en respuesta:', response?.data)
                console.log(
                    'Data.metadata en respuesta:',
                    response?.data?.metadata,
                )

                // Manejo mejorado de la respuesta del servidor
                console.log('Analizando respuesta del servidor:', response)

                // Obtener el contenido del mensaje con mejor manejo de múltiples formatos
                let messageContent =
                    'Lo siento, ha ocurrido un problema con mi conexión.'

                // Verificar si tenemos una respuesta válida del servidor
                if (response && typeof response === 'object') {
                    // Caso 1: Respuesta directa con campo 'response'
                    if (
                        response.response &&
                        typeof response.response === 'string'
                    ) {
                        messageContent = response.response
                        console.log(
                            'Usando respuesta directa del servidor:',
                            messageContent,
                        )
                    }
                    // Caso 2: Respuesta con múltiples mensajes
                    else if (
                        response.is_multi_message &&
                        Array.isArray(response.messages) &&
                        response.messages.length > 0
                    ) {
                        messageContent = response.messages[0]
                        console.log(
                            'Usando primer mensaje de array:',
                            messageContent,
                        )

                        // Mostrar mensajes adicionales si existen
                        if (response.messages.length > 1) {
                            console.log(
                                'Procesando mensajes adicionales:',
                                response.messages.slice(1),
                            )

                            // Crear y programar los mensajes adicionales
                            const additionalMessages = response.messages
                                .slice(1)
                                .map((msg: string, idx: number) => {
                                    // Crear un objeto de mensaje para cada mensaje adicional
                                    return {
                                        id: uniqueId(
                                            `chat-conversation-additional-${idx}-`,
                                        ),
                                        sender: {
                                            id: '2',
                                            name: 'BuilderBot',
                                            avatarImageUrl:
                                                '/img/avatars/thumb-2.jpg',
                                        },
                                        content: msg,
                                        timestamp: new Date(
                                            Date.now() + (idx + 1) * 200,
                                        ), // Agregar un pequeño retraso
                                        type: 'regular',
                                        isMyMessage: false,
                                    }
                                })

                            // Programar la adición de mensajes adicionales con un ligero retraso
                            additionalMessages.forEach(
                                (msg: Message, idx: number) => {
                                    setTimeout(
                                        () => {
                                            console.log(
                                                `Agregando mensaje adicional #${idx + 1}:`,
                                                msg.content,
                                            )
                                            handlePushMessage(msg, nodeId) // Agregar nodeId aquí

                                            // Scroll al fondo después del último mensaje
                                            if (
                                                idx ===
                                                additionalMessages.length - 1
                                            ) {
                                                setTimeout(scrollToBottom, 100)
                                            }
                                        },
                                        (idx + 1) * 500,
                                    ) // 500ms de retraso entre mensajes
                                },
                            )
                        }
                    }
                    // Caso 3: Respuesta con campo 'text' (formato alternativo)
                    else if (
                        response.text &&
                        typeof response.text === 'string'
                    ) {
                        messageContent = response.text
                        console.log('Usando campo text:', messageContent)
                    }
                    // Log de diagnóstico si no encontramos una respuesta válida
                    else {
                        console.error(
                            'No se encontró un campo de respuesta válido en el objeto:',
                            response,
                        )
                    }
                }

                // Extraer botones de la respuesta si existen
                let messageButtons = undefined

                // Verificar diferentes formatos de respuesta
                if (response) {
                    // Formato directo: response.buttons
                    if (response.buttons && Array.isArray(response.buttons)) {
                        messageButtons = response.buttons
                        console.log(
                            'Botones encontrados en response.buttons:',
                            messageButtons,
                        )
                    }
                    // Formato con metadata: response.metadata.buttons
                    else if (
                        response.metadata?.buttons &&
                        Array.isArray(response.metadata.buttons)
                    ) {
                        messageButtons = response.metadata.buttons
                        console.log(
                            'Botones encontrados en response.metadata.buttons:',
                            messageButtons,
                        )
                    }
                    // Formato con data.metadata: response.data.metadata.buttons
                    else if (
                        response.data?.metadata?.buttons &&
                        Array.isArray(response.data.metadata.buttons)
                    ) {
                        messageButtons = response.data.metadata.buttons
                        console.log(
                            'Botones encontrados en response.data.metadata.buttons:',
                            messageButtons,
                        )
                    }
                }

                // Extraer listItems de la respuesta si existen
                let messageListItems = undefined
                let messageListTitle = undefined

                if (response) {
                    // Formato directo: response.listItems
                    if (
                        response.listItems &&
                        Array.isArray(response.listItems)
                    ) {
                        messageListItems = response.listItems
                        messageListTitle = response.listTitle
                        console.log(
                            'Lista encontrada en response.listItems:',
                            messageListItems,
                        )
                    }
                    // Formato con metadata: response.metadata.listItems
                    else if (
                        response.metadata?.listItems &&
                        Array.isArray(response.metadata.listItems)
                    ) {
                        messageListItems = response.metadata.listItems
                        messageListTitle = response.metadata.listTitle
                        console.log(
                            'Lista encontrada en response.metadata.listItems:',
                            messageListItems,
                        )
                    }
                    // Formato con data.metadata: response.data.metadata.listItems
                    else if (
                        response.data?.metadata?.listItems &&
                        Array.isArray(response.data.metadata.listItems)
                    ) {
                        messageListItems = response.data.metadata.listItems
                        messageListTitle = response.data.metadata.listTitle
                        console.log(
                            'Lista encontrada en response.data.metadata.listItems:',
                            messageListItems,
                        )
                    }
                }

                // Verificar si hay cambio de etapa del sales funnel
                // Los logs muestran que salesStageId viene en response.metadata, no en response.data.metadata
                if (
                    response?.metadata?.salesStageId ||
                    response?.data?.metadata?.salesStageId ||
                    response?.salesStageId
                ) {
                    const newStageId =
                        response.metadata?.salesStageId ||
                        response.data?.metadata?.salesStageId ||
                        response.salesStageId
                    console.log(
                        'Detectado cambio de etapa en sales funnel:',
                        newStageId,
                    )

                    // Actualizar la etapa del lead en el store
                    if (selectedChat?.id) {
                        // Remover el prefijo 'lead_' si existe
                        const leadId = selectedChat.id.startsWith('lead_')
                            ? selectedChat.id.substring(5)
                            : selectedChat.id
                        console.log(
                            'Actualizando lead',
                            leadId,
                            'a etapa',
                            newStageId,
                        )
                        updateLeadStage(leadId, newStageId).catch(
                            (error: any) => {
                                console.error(
                                    'Error al actualizar etapa del lead:',
                                    error,
                                )
                                // Si es un error de etapa especial, no mostrarlo como error crítico
                                if (
                                    newStageId === 'confirmado' ||
                                    newStageId === 'confirmed' ||
                                    newStageId === 'cerrado' ||
                                    newStageId === 'closed'
                                ) {
                                    console.log(
                                        'Error ignorado para etapa especial:',
                                        newStageId,
                                    )
                                } else {
                                    toast.error(
                                        `Error al actualizar etapa: ${error.message}`,
                                    )
                                }
                            },
                        )
                    }
                }

                // NUEVA FUNCIONALIDAD: Detectar y actualizar datos del lead
                // Extraer información del cliente que podría venir en la respuesta
                const leadData: Record<string, any> = {}
                let shouldUpdateLead = false

                // Analizar campos en la respuesta que podrían contener datos del lead
                const dataToCheck = [
                    response?.extracted_data,
                    response?.metadata?.lead_data,
                    response?.data?.metadata?.lead_data,
                    response?.lead_data,
                    response?.metadata?.client_data,
                    response?.user_data,
                ]

                // Buscar en diferentes objetos por datos del lead
                for (const dataObj of dataToCheck) {
                    if (dataObj && typeof dataObj === 'object') {
                        // Revisar datos importantes: nombre, email, teléfono
                        if (
                            dataObj.name ||
                            dataObj.full_name ||
                            dataObj.nombre
                        ) {
                            leadData.full_name =
                                dataObj.name ||
                                dataObj.full_name ||
                                dataObj.nombre
                            shouldUpdateLead = true
                        }

                        if (dataObj.email || dataObj.correo || dataObj.mail) {
                            leadData.email =
                                dataObj.email || dataObj.correo || dataObj.mail
                            shouldUpdateLead = true
                        }

                        if (
                            dataObj.phone ||
                            dataObj.telefono ||
                            dataObj.phone_number
                        ) {
                            leadData.phone =
                                dataObj.phone ||
                                dataObj.telefono ||
                                dataObj.phone_number
                            shouldUpdateLead = true
                        }

                        // Datos adicionales relevantes
                        if (dataObj.notes || dataObj.notas) {
                            leadData.notes = dataObj.notes || dataObj.notas
                            shouldUpdateLead = true
                        }

                        if (dataObj.budget || dataObj.presupuesto) {
                            if (typeof dataObj.budget === 'object') {
                                leadData.budget_min = dataObj.budget.min
                                leadData.budget_max = dataObj.budget.max
                            } else {
                                leadData.budget_max =
                                    dataObj.budget || dataObj.presupuesto
                            }
                            shouldUpdateLead = true
                        }
                    }
                }

                // Buscar datos en texto/contenido del mensaje directamente mediante expresiones regulares
                // Solo si no se encontraron en los objetos anteriores
                if (!leadData.email && messageContent) {
                    const emailMatch = messageContent.match(
                        /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/,
                    )
                    if (emailMatch) {
                        leadData.email = emailMatch[0]
                        shouldUpdateLead = true
                        console.log(
                            'Email extraído del mensaje:',
                            leadData.email,
                        )
                    }
                }

                if (!leadData.phone && messageContent) {
                    // Buscar números telefónicos (varios formatos)
                    const phoneMatches = messageContent.match(
                        /(\+?[0-9]{1,3}[-\s]?)?(\(?[0-9]{3}\)?[-\s]?[0-9]{3}[-\s]?[0-9]{4})/,
                    )
                    if (phoneMatches) {
                        leadData.phone = phoneMatches[0].replace(
                            /[-\s\(\)]/g,
                            '',
                        )
                        shouldUpdateLead = true
                        console.log(
                            'Teléfono extraído del mensaje:',
                            leadData.phone,
                        )
                    }
                }

                // Si tenemos datos a actualizar y un ID de lead válido, realizar la actualización
                if (shouldUpdateLead && selectedChat?.id) {
                    try {
                        // Remover el prefijo 'lead_' si existe
                        const leadId = selectedChat.id.startsWith('lead_')
                            ? selectedChat.id.substring(5)
                            : selectedChat.id

                        console.log(
                            'Actualizando lead con nuevos datos:',
                            leadId,
                            leadData,
                        )

                        // Actualizar en memoria primero para UI responsiva
                        // (importaremos y usaremos la función en runtime para evitar problemas de SSR)
                        import('@/services/leads/updateLeadData').then(
                            (module) => {
                                const { updateLeadData } = module
                                updateLeadData(leadId, leadData)
                                    .then((result) => {
                                        console.log(
                                            'Lead actualizado correctamente:',
                                            result,
                                        )

                                        // Disparar evento para que otros componentes se actualicen
                                        if (typeof window !== 'undefined') {
                                            window.dispatchEvent(
                                                new CustomEvent(
                                                    'lead-data-updated',
                                                    {
                                                        detail: {
                                                            leadId,
                                                            data: leadData,
                                                        },
                                                    },
                                                ),
                                            )
                                        }
                                    })
                                    .catch((err) => {
                                        console.error(
                                            'Error al actualizar lead:',
                                            err,
                                        )
                                        // No mostrar toast de error para no interrumpir la conversación
                                    })
                            },
                        )
                    } catch (updateError) {
                        console.error(
                            'Error actualizando datos del lead:',
                            updateError,
                        )
                    }
                } else if (Object.keys(leadData).length > 0) {
                    console.log(
                        'Datos de lead detectados pero no aplicados:',
                        leadData,
                    )
                }

                // Extraer nodeId si viene en la respuesta para tracking del flujo
                const nodeId =
                    response?.metadata?.nodeId ||
                    response?.data?.metadata?.nodeId ||
                    response?.nodeId

                // Siempre mostramos una respuesta al usuario
                const botMessage: Message = {
                    id: uniqueId('chat-conversation-'),
                    sender: {
                        id: '2',
                        name: 'BuilderBot',
                        avatarImageUrl: '/img/avatars/thumb-2.jpg', // Use bot avatar
                    },
                    content: messageContent,
                    timestamp: dayjs().toDate(),
                    type: 'regular',
                    isMyMessage: false,
                    buttons: messageButtons, // Agregar botones al mensaje
                    listItems: messageListItems, // Agregar elementos de lista al mensaje
                    listTitle: messageListTitle, // Agregar título de lista al mensaje
                }

                console.log('Mensaje del bot que será mostrado:', botMessage)

                // Agregamos la respuesta del bot a la conversación con nodeId
                handlePushMessage(botMessage, nodeId)

                // Procesar la respuesta del bot (sin persistir el mensaje porque ya se hace en handlePushMessage)
                if (selectedChat.id?.startsWith('lead_')) {
                    // Extraer y guardar datos recolectados sin duplicar el mensaje
                    const dataToExtract = [
                        response?.extracted_data,
                        response?.metadata?.collected_data,
                        response?.data?.metadata?.collected_data,
                        response?.collected_data,
                        response?.flow_data,
                    ]

                    for (const dataObj of dataToExtract) {
                        if (dataObj && typeof dataObj === 'object') {
                            Object.entries(dataObj).forEach(([key, value]) => {
                                if (value !== undefined && value !== null) {
                                    // Guardar datos recolectados
                                    import(
                                        '@/utils/conversationPersistence'
                                    ).then(({ saveConversationData }) => {
                                        const leadId = selectedChat.id?.replace(
                                            'lead_',
                                            '',
                                        )
                                        if (leadId && activeTemplateId) {
                                            saveConversationData(
                                                leadId,
                                                activeTemplateId,
                                                key,
                                                value,
                                            )
                                        }
                                    })
                                }
                            })
                        }
                    }
                }

                // Log post manejo de respuesta - Actualizado para usar el store
                const currentConversation =
                    conversationRecord.find((c) => c.id === selectedChat.id)
                        ?.conversation || []
                console.log(
                    'Estado actual de conversación (store) después de agregar respuesta:',
                    [...currentConversation, botMessage],
                )

                // Desplazamos al fondo para mostrar el mensaje más reciente
                setTimeout(() => {
                    console.log('Ejecutando scrollToBottom')
                    scrollToBottom()
                }, 100)

                console.log('=========== FIN ENVÍO ===========')
            } catch (innerError) {
                console.error('Error en apiSendChatMessage:', innerError)

                // Mensaje de error detallado
                const errorMessage: Message = {
                    id: uniqueId('chat-conversation-error-'),
                    sender: {
                        id: '2',
                        name: 'BuilderBot',
                        avatarImageUrl: '/img/avatars/thumb-2.jpg',
                    },
                    content:
                        'Error en la comunicación con el servidor. Por favor, inténtalo de nuevo.',
                    timestamp: dayjs().toDate(),
                    type: 'regular',
                    isMyMessage: false,
                }

                handlePushMessage(errorMessage)
                setTimeout(scrollToBottom, 100)
            }
        } catch (error: unknown) {
            console.error('Error sending message:', (error as Error).message)

            // Mensaje de error como respuesta del bot
            const errorMessage: Message = {
                id: uniqueId('chat-conversation-'),
                sender: {
                    id: '2',
                    name: 'BuilderBot',
                    avatarImageUrl: '/img/avatars/thumb-2.jpg',
                },
                content:
                    'Lo siento, no pude procesar tu mensaje en este momento.',
                timestamp: dayjs().toDate(),
                type: 'regular',
                isMyMessage: false,
            }

            handlePushMessage(errorMessage)
        } finally {
            setIsLoading(false) // Desactivar estado de carga
        }
    }

    const cardHeaderProps = {
        header: {
            content: (
                <div className="flex items-center gap-2">
                    {smaller.md && (
                        <button
                            className="text-xl hover:text-primary"
                            onClick={() => setSelectedChat({})}
                        >
                            <TbChevronLeft />
                        </button>
                    )}
                    <button
                        className="flex items-center gap-2"
                        role="button"
                        onClick={handleProfileClick}
                    >
                        <div>
                            {/* Mostrar ícono de WhatsApp para leads */}
                            {selectedChat.id?.startsWith('lead_') ? (
                                <Avatar
                                    src="/img/icons/whatsIcon.png"
                                    alt="WhatsApp"
                                    size="md"
                                />
                            ) : (
                                <Avatar icon={<TbUser />} />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex justify-between">
                                <div className="font-bold heading-text truncate flex items-center gap-2">
                                    <span>{selectedChat.user?.name}</span>
                                    {/* Mostrar etapa del lead con colores que coinciden con SalesFunnel */}
                                    {selectedChat.id &&
                                        selectedChat.id.startsWith('lead_') &&
                                        selectedChat.stage && (
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStageColorClasses(selectedChat.stage)}`}
                                            >
                                                {getStageName(
                                                    selectedChat.stage,
                                                )}
                                            </span>
                                        )}
                                </div>
                            </div>
                            <div>
                                {selectedChat?.chatType === 'groups'
                                    ? 'click here for group info'
                                    : 'last seen recently'}
                            </div>
                        </div>
                    </button>
                </div>
            ),
            extra: <ChatAction muted={selectedChat.muted} />,
            className: 'bg-gray-100 dark:bg-gray-600 h-[80px]', // Reducir altura del header
        },
    }

    // No seleccionar chat por defecto - eliminar completamente este useEffect ya que no es necesario

    useEffect(() => {
        const fetchConversation = async () => {
            setIsFetchingConversation(true)

            try {
                // Verificar que conversationRecord sea un array válido
                const record =
                    conversationRecord && Array.isArray(conversationRecord)
                        ? conversationRecord.find(
                              (item) => item.id === selectedChat.id,
                          )
                        : null

                if (
                    record &&
                    record.conversation &&
                    Array.isArray(record.conversation)
                ) {
                    // Si encontramos un registro válido en cache, lo utilizamos
                    // setConversation(record.conversation) // Removed local state update
                    console.log(
                        'Usando conversación en cache para:',
                        selectedChat.id,
                    )
                } else {
                    // Si no se encuentra un registro válido o no tiene una propiedad conversation válida
                    console.log(
                        'No se encontró un registro de conversación válido para:',
                        selectedChat.id,
                    )

                    // Avoid fetching conversation for the default chat ID
                    if (selectedChat.id !== 'default-chat-id') {
                        try {
                            // Verificar si tenemos la función apiGetConversation cargada
                            if (!apiGetConversation) {
                                console.log(
                                    'Cargando apiGetConversation bajo demanda...',
                                )
                                const chatService = await import(
                                    '@/services/ChatService'
                                )
                                apiGetConversation =
                                    chatService.apiGetConversation
                            }

                            const axiosResp =
                                await apiGetConversation<GetConversationResponse>(
                                    {
                                        id: selectedChat.id as string,
                                    },
                                )
                            const resp = axiosResp.data

                            // Verificar que la respuesta contiene una conversación válida
                            if (
                                resp &&
                                resp.conversation &&
                                Array.isArray(resp.conversation)
                            ) {
                                // setConversation(resp.conversation) // Removed local state update
                                pushConversationRecord(resp)
                            } else {
                                console.warn(
                                    'La respuesta de la API no contiene una conversación válida:',
                                    resp,
                                )
                                // setConversation([]) // Removed local state update
                            }
                        } catch (error) {
                            console.error(
                                'Error al obtener la conversación:',
                                error,
                            )
                            // setConversation([]) // Removed local state update
                        }
                    } else {
                        // setConversation([]) // Removed local state update
                    }
                }
            } catch (error) {
                console.error('Error general en fetchConversation:', error)
                // setConversation([]) // Removed local state update
            } finally {
                setIsFetchingConversation(false)
                scrollToBottom()
            }
        }

        if (selectedChat && selectedChat.id) {
            fetchConversation()
        } else {
            // Si no hay un chat seleccionado, no hacemos nada con el estado local
            // setConversation([]) // Removed local state update
        }
    }, [selectedChat.id, conversationRecord, pushConversationRecord]) // Added dependencies back

    const messageList = useMemo(() => {
        // Validar que conversationRecord sea un array
        if (!Array.isArray(conversationRecord)) {
            console.warn('conversationRecord no es un array')
            return []
        }

        // Obtener la conversación actual del store global
        const conversation = conversationRecord.find(
            (record) => record && record.id === selectedChat.id,
        )

        const currentConversation = conversation?.conversation || []

        console.log(
            'Renderizando messageList, estado de conversationRecord para el chat seleccionado:',
            selectedChat.id,
            'Encontrada:',
            !!conversation,
            'Mensajes:',
            currentConversation.length,
        )

        // Verificar que currentConversation sea un array válido antes de intentar map
        if (!Array.isArray(currentConversation)) {
            console.warn(
                'currentConversation no es un array:',
                currentConversation,
            )
            return []
        }

        return currentConversation
            .map((item: Message) => {
                // Asegurarse de que item no sea null o undefined
                if (!item) {
                    console.warn('Item de mensaje null o undefined encontrado')
                    return null
                }

                // Asegurarse de que hay una marca de tiempo válida
                const timestamp = item.timestamp
                    ? typeof item.timestamp === 'number'
                        ? dayjs.unix(item.timestamp).toDate()
                        : item.timestamp
                    : new Date()

                // ¡IMPORTANTE! Siempre mostrar los mensajes del modo "Lead" como si fueran míos
                // para que aparezcan correctamente en la UI como mensajes salientes (a la derecha)
                let isMyMessage = item.isMyMessage

                // Si el mensaje fue enviado mientras estaba activo el modo Lead
                // (comprobamos esto por el remitente, que tendrá el nombre del Lead)
                if (
                    testAsLead &&
                    item.sender &&
                    item.sender.name === (selectedChat.name || 'Lead')
                ) {
                    console.log(
                        'Forzando isMyMessage=true para mensaje en modo Lead',
                    )
                    isMyMessage = true
                }

                const processedItem = {
                    ...item,
                    timestamp: timestamp,
                    isMyMessage: isMyMessage, // Usar valor actualizado
                }

                return processedItem
            })
            .filter(Boolean) // Filtrar cualquier null/undefined

        // Depender de conversationRecord, selectedChat.id y testAsLead para re-calcular
    }, [conversationRecord, selectedChat.id, testAsLead, selectedChat.name])

    return (
        <div
            className={classNames(
                'w-full md:block',
                !selectedChat.id && 'hidden',
            )}
        >
            {selectedChat.id ? (
                <Card
                    className="flex-1 h-full max-h-full dark:border-gray-700"
                    bodyClass="h-[calc(100%-80px)] relative bg-repeat bg-[url('/img/chat/fondoLightchat.png')] dark:bg-[url('/img/chat/fondodarkchat.png')]" // Fondo repetido manteniendo proporciones originales
                    {...cardHeaderProps}
                >
                    {/* Overlay con transparencia */}
                    <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/95 pointer-events-none"></div>

                    <ChatBox
                        ref={scrollRef}
                        messageList={messageList}
                        placeholder={
                            isLoading
                                ? 'Procesando...'
                                : testAsLead
                                  ? `💬 Escribiendo como CLIENTE (${selectedChat.name || 'Lead'})...`
                                  : '🤖 Escribiendo como AGENTE...'
                        }
                        showAvatar={true}
                        avatarGap={true}
                        messageListClass="h-[calc(100%-80px)] bg-transparent relative z-10" // Hacer transparente y con z-index
                        bubbleClass="max-w-[300px] whitespace-pre-wrap backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border border-gray-200/50 dark:border-gray-700/50 shadow-sm"
                        containerClass="relative z-10 [&>div:last-child]:bg-white [&>div:last-child]:dark:bg-gray-800" // Solo fondo sólido para el input, no para todo el container
                        onInputChange={handleInputChange}
                        onButtonClick={(buttonText) => {
                            console.log(
                                'Botón clickeado desde ChatBody:',
                                buttonText,
                            )
                            // Simular el envío del texto del botón como si fuera escrito por el usuario
                            handleInputChange({ value: buttonText })
                        }}
                        onListItemClick={(value, text) => {
                            console.log(
                                'Item de lista clickeado desde ChatBody:',
                                { value, text },
                            )
                            // Enviar el valor del item seleccionado como respuesta del usuario
                            handleInputChange({ value: text })
                        }}
                        typing={
                            isLoading
                                ? {
                                      id: '2',
                                      name: 'ChatBot',
                                      avatarImageUrl:
                                          '/img/avatars/thumb-2.jpg',
                                  }
                                : false
                        } // Indicador de "escribiendo..." mientras carga
                    />
                    {/* Depuración */}
                    <div className="hidden">
                        <h4>Estado de mensajes:</h4>
                        <pre>{JSON.stringify(messageList, null, 2)}</pre>
                    </div>
                </Card>
            ) : (
                <div className="flex-1 h-full max-h-full flex flex-col items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-800">
                    <StartConverstation height={250} width={250} />
                    <div className="mt-10 text-center">
                        <h3>¡Comienza una conversación!</h3>
                        <p className="mt-2 text-base">
                            Selecciona una conversación o inicia una nueva
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ChatBody
