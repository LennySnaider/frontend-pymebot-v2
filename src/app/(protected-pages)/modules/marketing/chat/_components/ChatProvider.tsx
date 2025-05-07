/**
 * frontend/agentprop/src/app/(protected-pages)/modules/marketing/chat/_components/ChatProvider.tsx
 * Proveedor de contexto para el chat, inicializa datos y plantillas
 * @version 2.0.0
 * @updated 2025-04-26
 */

'use client'
import { useEffect } from 'react'
import { useChatStore } from '../_store/chatStore'
// Importación directa del archivo específico
import apiGetChatTemplates from '@/services/ChatService/apiGetChatTemplates'
import type { CommonProps } from '@/@types/common'
import type { Chats } from '../types'

interface ChatProviderProviderProps extends CommonProps {
    chats: Chats
}

const ChatProvider = ({ children, chats }: ChatProviderProviderProps) => {
    const setChats = useChatStore((state) => state.setChats)
    const setChatsFetched = useChatStore((state) => state.setChatsFetched)
    const setTemplates = useChatStore((state) => state.setTemplates)

    // Inicializar chats
    useEffect(() => {
        setChats(chats)
        setChatsFetched(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chats])

    // Cargar plantillas de chatbot
    useEffect(() => {
        const loadTemplates = async () => {
            try {
                const templates = await apiGetChatTemplates()
                if (templates.length > 0) {
                    setTemplates(templates)
                }
            } catch (error) {
                console.error('Error al cargar plantillas de chatbot:', error)
            }
        }

        loadTemplates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return <>{children}</>
}

export default ChatProvider
