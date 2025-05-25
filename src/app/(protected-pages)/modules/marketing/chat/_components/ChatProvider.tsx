/**
 * frontend/agentprop/src/app/(protected-pages)/modules/marketing/chat/_components/ChatProvider.tsx
 * Proveedor de contexto para el chat, inicializa datos y plantillas
 * @version 2.4.0
 * @updated 2025-05-18
 */

'use client'
import { useEffect, useState } from 'react'
import { useChatStore } from '../_store/chatStore'
import { useChatLeadSync } from '@/hooks/useChatLeadSync'
import dynamic from 'next/dynamic'
import type { CommonProps } from '@/@types/common'
import type { Chats, Conversation } from '../types'

// Importamos componentes de seguridad que evitan errores de renderizado
import ErrorBoundary from './ErrorBoundary'
import StoreInitializer from './StoreInitializer'

// Comentado - Componentes de debug no existen
// const ChatSyncDebugPanel = dynamic(() => import('./ChatSyncDebugPanel'), {
//     ssr: false,
//     loading: () => null
// })

// const ChatSyncDebugger = dynamic(() => import('./debug/ChatSyncDebugger'), {
//     ssr: false,
//     loading: () => null
// })
// QuickFix ya no es necesario - usamos sincronización inteligente
// import QuickFix from './QuickFix'

// Comentado - chatSyncDiagnostics no existe
// if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
//     import('@/utils/chatSyncDiagnostics').then(() => {
//         console.log('[ChatProvider] Herramientas de diagnóstico cargadas')
//     }).catch((error) => {
//         console.warn('[ChatProvider] No se pudieron cargar las herramientas de diagnóstico:', error)
//     })
// }

interface ChatProviderProviderProps extends CommonProps {
    chats: Chats
}

const ChatProvider = ({ children, chats }: ChatProviderProviderProps) => {
    const [isClient, setIsClient] = useState(false)
    const setChats = useChatStore((state) => state.setChats)
    const setChatsFetched = useChatStore((state) => state.setChatsFetched)
    const pushConversationRecord = useChatStore((state) => state.pushConversationRecord)
    const conversationRecord = useChatStore((state) => state.conversationRecord)
    
    // Hook de sincronización con Sales Funnel
    // Activamos la sincronización automática sin intervalo periódico
    const { forceRefresh, pendingUpdates } = useChatLeadSync(true, 0)

    // Detectar si estamos en el cliente
    useEffect(() => {
        setIsClient(true)
    }, [])

    // Inicializar chats
    useEffect(() => {
        if (chats && Array.isArray(chats)) {
            console.log(`Inicializando ${chats.length} chats en el store...`)
            setChats(chats)
            setChatsFetched(true)
        } else {
            console.warn('Los chats proporcionados no son válidos:', chats)
            setChats([])
            setChatsFetched(true)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chats])

    // Inicializar la conversación por defecto
    useEffect(() => {
        if (!isClient) return

        try {
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
        } catch (error) {
            console.error('Error al inicializar conversación predeterminada:', error)
        }
    }, [isClient, conversationRecord, pushConversationRecord])

    // Log cuando hay actualizaciones pendientes
    useEffect(() => {
        if (pendingUpdates > 0) {
            console.log(`ChatProvider: ${pendingUpdates} actualizaciones de leads pendientes`)
        }
    }, [pendingUpdates])

    // Si estamos en el servidor, renderizamos un placeholder
    if (!isClient) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="animate-pulse w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
        )
    }

    // En el cliente, envolvemos todo en ErrorBoundary y StoreInitializer
    return (
        <ErrorBoundary>
            <StoreInitializer>
                {/* QuickFix comentado - Ahora usamos sincronización inteligente con useChatLeadSync
                <QuickFix /> */}
                {children}
                
                {/* Indicador opcional de sincronización (solo visible en desarrollo) */}
                {process.env.NODE_ENV === 'development' && pendingUpdates > 0 && (
                    <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs z-50 animate-pulse">
                        Sincronizando {pendingUpdates} leads...
                    </div>
                )}
                
                {/* Panel de debug comentado - archivos no existen
                {process.env.NODE_ENV === 'development' && (
                    <>
                        <ChatSyncDebugPanel />
                        <ChatSyncDebugger />
                    </>
                )} */}
            </StoreInitializer>
        </ErrorBoundary>
    )
}

export default ChatProvider