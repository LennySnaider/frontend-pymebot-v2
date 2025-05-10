/**
 * frontend/agentprop/src/app/(protected-pages)/modules/marketing/chat/_components/ChatProvider.tsx
 * Proveedor de contexto para el chat, inicializa datos y plantillas
 * @version 2.2.0
 * @updated 2025-09-05
 */

'use client'
import { useEffect } from 'react'
import { useChatStore } from '../_store/chatStore'
// Importación dinámica con lazy-loading solo en cliente
import dynamic from 'next/dynamic'
import type { CommonProps } from '@/@types/common'
import type { Chats, Conversation } from '../types'

// IMPORTANTE: Evitamos problemas de SSR/Edge - dejamos que sea page.tsx el que controle el runtime
// Así evitamos conflictos de configuración entre componentes y página

interface ChatProviderProviderProps extends CommonProps {
    chats: Chats
}

const ChatProvider = ({ children, chats }: ChatProviderProviderProps) => {
    const setChats = useChatStore((state) => state.setChats)
    const setChatsFetched = useChatStore((state) => state.setChatsFetched)
    const setTemplates = useChatStore((state) => state.setTemplates)
    const pushConversationRecord = useChatStore((state) => state.pushConversationRecord)
    const conversationRecord = useChatStore((state) => state.conversationRecord)

    // Inicializar chats
    useEffect(() => {
        setChats(chats)
        setChatsFetched(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chats])

    // Inicializar la conversación por defecto
    useEffect(() => {
        // Verificar si ya existe una conversación predeterminada
        const defaultChatExists = conversationRecord.some(
            (record) => record.id === 'default-chat-id'
        )

        // Si no existe, crear una
        if (!defaultChatExists) {
            console.log('Inicializando conversación predeterminada');
            const defaultConversation: Conversation = {
                id: 'default-chat-id',
                conversation: [
                    {
                        id: 'welcome-message',
                        sender: {
                            id: 'system',
                            name: 'BuilderBot',
                            avatarImageUrl: '/img/avatars/thumb-2.jpg',
                        },
                        content: '¡Hola! Soy BuilderBot. ¿En qué puedo ayudarte hoy?',
                        timestamp: new Date(),
                        type: 'regular',
                        isMyMessage: false,
                    }
                ]
            }

            pushConversationRecord(defaultConversation)
        }
    }, [conversationRecord, pushConversationRecord])

    // Cargar plantillas de chatbot solo cuando estamos en el cliente
    // para evitar errores de hidratación y SSR
    useEffect(() => {
        const loadTemplates = async () => {
            try {
                // Usar la función fetchTemplates del store que maneja SSR/CSR adecuadamente
                const fetchTemplates = useChatStore.getState().fetchTemplates;
                await fetchTemplates();
                console.log('Plantillas cargadas completamente');
            } catch (error) {
                console.error('Error al cargar plantillas de chatbot:', error)
            }
        }

        // Solo ejecutamos en el cliente
        if (typeof window !== 'undefined') {
            // Pequeño retraso para asegurar que todo está hidratado
            setTimeout(() => {
                loadTemplates();
            }, 100);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return <>{children}</>
}

export default ChatProvider
