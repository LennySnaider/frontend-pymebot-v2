/**
 * src/app/(protected-pages)/modules/marketing/chat/_components/ChatBody.tsx
 * Componente principal del cuerpo del chat. Maneja la visualización de mensajes
 * y la entrada de texto del usuario.
 * @version 2.0.0
 * @updated 2025-04-26
 */

'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Avatar from '@/components/ui/Avatar'
import Card from '@/components/ui/Card'
import ChatBox from '@/components/view/ChatBox'
import ChatAction from './ChatAction'
import StartConverstation from '@/assets/svg/StartConverstation'
import { useChatStore } from '../_store/chatStore'
import { apiGetConversation } from '@/services/ChatService'
// Importación directa del archivo específico
import apiSendChatMessage from '@/services/ChatService/apiSendChatMessage'
import classNames from '@/utils/classNames'
import useResponsive from '@/utils/hooks/useResponsive'
import dayjs from 'dayjs'
import uniqueId from 'lodash/uniqueId'
import { TbChevronLeft } from 'react-icons/tb'
import type {
    GetConversationResponse,
    Message,
    ChatType,
    SelectedChat,
} from '../types'
import type { ScrollBarRef } from '@/components/view/ChatBox'
import { v4 as uuidv4 } from 'uuid' // Import uuid

const ChatBody = () => {
    const scrollRef = useRef<ScrollBarRef>(null)
    const userIdRef = useRef(uuidv4()) // Generate and store user ID as UUID
    const tenantIdRef = useRef(uuidv4()) // Generate and store tenant ID as UUID
    const botIdRef = useRef(uuidv4()) // Generate and store bot ID as UUID

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, setIsFetchingConversation] = useState(false)
    // Local conversation state removed
    // const [conversation, setConversation] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false) // Estado para controlar la carga

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

    const handlePushMessage = (message: Message) => {
        console.log('Agregando mensaje a la conversación:', message)

        // Verificar que tenemos un ID de chat válido antes de enviar el mensaje
        if (selectedChat?.id) {
            pushConversationMessage(selectedChat.id, message)
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

        // Create new message object with user's input
        const userMessage: Message = {
            id: uniqueId('chat-conversation-'),
            sender: {
                id: userIdRef.current, // Use the generated user ID
                name: 'You', // Or the actual user's name
                avatarImageUrl: '/img/avatars/thumb-1.jpg', // User's avatar
            },
            content: value,
            timestamp: dayjs().toDate(),
            type: 'regular',
            isMyMessage: true,
        }

        // Display user's message immediately
        handlePushMessage(userMessage)

        try {
            // Get tenant ID
            const tenantId = selectedChat.tenantId || tenantIdRef.current // Use generated tenant ID
            const userId = userIdRef.current // Use generated user ID

            // No necesitamos obtener sessionId aquí porque se pasa directamente a apiSendChatMessage
            const botId = botIdRef.current // Use generated bot ID

            // Envío de mensaje (log adicional)
            console.log('=========== INICIO ENVÍO ===========')
            console.log('Enviando mensaje con template_id:', activeTemplateId)
            console.log('Datos envío:', {
                value,
                userId,
                tenantId,
                botId,
                activeTemplateId,
            })

            try {
                const response = await apiSendChatMessage(
                    value,
                    userId,
                    tenantId,
                    botId,
                    activeTemplateId, // Añadimos el activeTemplateId como parámetro
                )

                console.log('Respuesta recibida del servidor:', response)

                // Siempre mostramos una respuesta al usuario, aunque sea de error
                const botMessage: Message = {
                    id: uniqueId('chat-conversation-'),
                    sender: {
                        id: '2',
                        name: 'BuilderBot',
                        avatarImageUrl: '/img/avatars/thumb-2.jpg', // Use bot avatar
                    },
                    content:
                        response.response ||
                        'Lo siento, ha ocurrido un problema con mi conexión.',
                    timestamp: dayjs().toDate(),
                    type: 'regular',
                    isMyMessage: false,
                }

                console.log('Mensaje del bot que será mostrado:', botMessage)

                // Agregamos la respuesta del bot a la conversación
                handlePushMessage(botMessage)

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
                            <Avatar src={selectedChat.user?.avatarImageUrl} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex justify-between">
                                <div className="font-bold heading-text truncate">
                                    {selectedChat.user?.name}
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
            className: 'bg-gray-100 dark:bg-gray-600 h-[100px]',
        },
    }

    // Automatically select a default chat if none is selected
    useEffect(() => {
        if (!selectedChat.id) {
            // Create or select a default chat object
            const defaultChat: SelectedChat = {
                // Ensure type matches
                id: 'default-chat-id', // Use a consistent default ID
                user: {
                    id: userIdRef.current, // Use generated user ID
                    name: 'Default User',
                    avatarImageUrl: '/img/avatars/thumb-1.jpg',
                },
                tenantId: tenantIdRef.current, // Use generated tenant ID
                muted: false,
                chatType: 'personal' as ChatType, // Use correct ChatType
            }
            setSelectedChat(defaultChat)
        }
    }, [selectedChat.id, setSelectedChat, userIdRef, tenantIdRef])

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
        // Obtener la conversación actual del store global
        const currentConversation = conversationRecord.find(
            (record) => record.id === selectedChat.id,
        )?.conversation

        console.log(
            'Renderizando messageList, estado de conversationRecord para el chat seleccionado:',
            currentConversation,
        )

        // Verificar que currentConversation sea un array válido antes de intentar map
        if (!currentConversation || !Array.isArray(currentConversation)) {
            console.warn(
                'currentConversation no es un array válido:',
                currentConversation,
            )
            return []
        }

        return currentConversation.map((item: Message) => {
            // Añadir tipo explícito a item
            // Asegurarse de que hay una marca de tiempo válida
            const timestamp = item.timestamp
                ? typeof item.timestamp === 'number'
                    ? dayjs.unix(item.timestamp).toDate()
                    : item.timestamp
                : new Date()

            const processedItem = {
                ...item,
                timestamp: timestamp,
            }

            console.log('Procesando mensaje para mostrar:', processedItem)
            return processedItem
        })
        // Depender de conversationRecord y selectedChat.id para re-calcular
    }, [conversationRecord, selectedChat.id])

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
                    bodyClass="h-[calc(100%-100px)] relative"
                    {...cardHeaderProps}
                >
                    <ChatBox
                        ref={scrollRef}
                        messageList={messageList}
                        placeholder={
                            isLoading
                                ? 'Procesando...'
                                : 'Escribe tu mensaje aquí'
                        }
                        showAvatar={true}
                        avatarGap={true}
                        messageListClass="h-[calc(100%-100px)]"
                        bubbleClass="max-w-[300px] whitespace-pre-wrap"
                        onInputChange={handleInputChange}
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
