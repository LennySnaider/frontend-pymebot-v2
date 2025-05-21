'use client'

import { useRef, useState, useEffect } from 'react'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import ScrollBar from '@/components/ui/ScrollBar'
import Skeleton from '@/components/ui/Skeleton'
import ChatSegment from './ChatSegment'
import NewChat from './NewChat'
import { useChatStore } from '../_store/chatStore'
import classNames from '@/utils/classNames'
import useDebounce from '@/utils/hooks/useDebounce'
import { TbVolumeOff, TbSearch, TbX, TbRefresh } from 'react-icons/tb'
import dayjs from 'dayjs'
import type { ChatType } from '../types'
import type { ChangeEvent } from 'react'
import {
    useLeadRealTimeStore,
    startLeadRealTimeListener,
    stopLeadRealTimeListener,
} from '@/stores/leadRealTimeStore'

const ChatList = () => {
    const chats = useChatStore((state) => state.chats)
    const chatFetched = useChatStore((state) => state.chatsFetched)
    const selectedChat = useChatStore((state) => state.selectedChat)
    const setSelectedChat = useChatStore((state) => state.setSelectedChat)
    const setMobileSidebar = useChatStore((state) => state.setMobileSidebar)
    const selectedChatType = useChatStore((state) => state.selectedChatType)
    const setSelectedChatType = useChatStore(
        (state) => state.setSelectedChatType,
    )
    const setChatRead = useChatStore((state) => state.setChatRead)

    const inputRef = useRef<HTMLInputElement>(null)
    const refreshChatList = useChatStore((state) => state.refreshChatList)

    const [showSearchBar, setShowSearchBar] = useState(false)
    const [queryText, setQueryText] = useState('')
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Obtener eventos de leads para reacción en tiempo real
    const lastLeadEvent = useLeadRealTimeStore((state) => state.lastEvent)

    // Efecto para iniciar escucha de eventos de leads
    useEffect(() => {
        console.log('ChatList: Iniciando escucha de eventos de leads')
        startLeadRealTimeListener()
        
        // También escuchamos eventos del SalesFunnel
        const handleSalesFunnelUpdate = (e: any) => {
            if (e.detail && e.detail.leadId) {
                console.log('ChatList: Evento de SalesFunnel detectado:', e.detail);
                // Refrescar la lista cuando hay un cambio en salesfunnel
                if (selectedChatType === 'leads' || selectedChatType === 'prospects') {
                    handleRefreshChatList();
                }
            }
        };
        
        // Escuchar eventos del SalesFunnel 
        window.addEventListener('salesfunnel-lead-updated', handleSalesFunnelUpdate);
        
        return () => {
            console.log('ChatList: Deteniendo escucha de eventos de leads')
            stopLeadRealTimeListener();
            window.removeEventListener('salesfunnel-lead-updated', handleSalesFunnelUpdate);
        }
    }, [selectedChatType])

    // Efecto para reaccionar a eventos de leads
    useEffect(() => {
        if (lastLeadEvent) {
            console.log('ChatList: Detectado evento de lead:', lastLeadEvent)

            // Refrescar la lista de chats si es un evento relevante
            if (
                selectedChatType === 'leads' ||
                selectedChatType === 'prospects'
            ) {
                console.log('ChatList: Refrescando lista tras evento de lead')
                handleRefreshChatList()
            }
        }
    }, [lastLeadEvent])

    // Función para refrescar manualmente la lista de chats
    const handleRefreshChatList = async () => {
        if (isRefreshing) return

        setIsRefreshing(true)
        try {
            await refreshChatList()
            console.log('ChatList: Lista refrescada exitosamente')
        } catch (error) {
            console.error('Error al refrescar lista de chats:', error)
        } finally {
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        if (showSearchBar) {
            inputRef.current?.focus()
        } else {
            inputRef.current?.blur()
        }
    }, [showSearchBar])

    const handleChatClick = ({
        id,
        user,
        muted,
        chatType,
        unread,
    }: {
        id: string
        user: { id: string; avatarImageUrl: string; name: string }
        muted: boolean
        chatType: ChatType
        unread: number
    }) => {
        if (unread > 0) {
            setChatRead(id)
        }

        // Buscar datos adicionales del chat/lead
        const chatItem = chats.find((chat) => chat.id === id)
        const stage =
            chatItem?.metadata?.stage ||
            (id.startsWith('lead_') ? 'new' : undefined)

        // Configurar el chat seleccionado con información adicional
        setSelectedChat({
            id,
            user,
            muted,
            chatType,
            // Añadir información de etapa y otros datos útiles
            stage,
            name: chatItem?.name,
            avatar: chatItem?.avatar,
            tenantId: chatItem?.tenantId,
        })
        setMobileSidebar(false)
    }

    function handleDebounceFn(e: ChangeEvent<HTMLInputElement>) {
        if (e.target.value.length > 0) {
            setSelectedChatType('')
        }

        if (e.target.value.length === 0) {
            setSelectedChatType('personal')
        }

        setQueryText(e.target.value)
    }

    const debounceFn = useDebounce(handleDebounceFn, 500)

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        debounceFn(e)
    }

    const handleSearchToggleClick = () => {
        setShowSearchBar(!showSearchBar)
        setQueryText('')
    }

    return (
        <div className="flex flex-col justify-between h-full">
            <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                    {showSearchBar ? (
                        <input
                            ref={inputRef}
                            className="flex-1 h-full placeholder:text-gray-400 placeholder:text-base placeholder:font-normal bg-transparent focus:outline-hidden heading-text font-bold"
                            placeholder="Search chat"
                            onChange={handleInputChange}
                        />
                    ) : (
                        <p>Buscar</p>
                    )}
                    <div className="flex items-center gap-2">
                        <button
                            className={`text-lg ${isRefreshing ? 'animate-spin text-primary' : ''}`}
                            type="button"
                            onClick={handleRefreshChatList}
                            disabled={isRefreshing}
                            title="Actualizar lista"
                        >
                            <TbRefresh />
                        </button>
                        <button
                            className="close-button text-lg"
                            type="button"
                            onClick={handleSearchToggleClick}
                        >
                            {showSearchBar ? <TbX /> : <TbSearch />}
                        </button>
                    </div>
                </div>
                <ChatSegment />
            </div>
            <ScrollBar className="h-[calc(100vh-440px)] overflow-y-auto">
                <div className="flex flex-col gap-2">
                    {chatFetched ? (
                        <>
                            {chats
                                .filter((item) => {
                                    if (queryText) {
                                        return item.name
                                            .toLowerCase()
                                            .includes(queryText)
                                    }

                                    return selectedChatType === item.chatType
                                })
                                // Ordenar los leads: primero por tiempo (más recientes primero), 
                                // luego por última interacción
                                .sort((a, b) => {
                                    // 1. Si ambos tienen lastActivity (timestamp de última interacción)
                                    if (a.metadata?.lastActivity && b.metadata?.lastActivity) {
                                        return b.metadata.lastActivity - a.metadata.lastActivity;
                                    }
                                    
                                    // 2. Si solo uno tiene lastActivity, ese va primero
                                    if (a.metadata?.lastActivity) return -1;
                                    if (b.metadata?.lastActivity) return 1;
                                    
                                    // 3. Fallback al timestamp principal
                                    return b.time - a.time;
                                })
                                .map((item) => (
                                    <div
                                        key={item.id}
                                        className={classNames(
                                            'py-3 px-2 flex items-center gap-2 justify-between rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 relative cursor-pointer select-none',
                                            selectedChat.id === item.id &&
                                                'bg-gray-100 dark:bg-gray-700',
                                        )}
                                        role="button"
                                        onClick={() =>
                                            handleChatClick({
                                                id: item.id,
                                                user: {
                                                    id:
                                                        item.userId ||
                                                        item.groupId,
                                                    avatarImageUrl: item.avatar,
                                                    name: item.name,
                                                },
                                                muted: item.muted,
                                                chatType: item.chatType,
                                                unread: item.unread,
                                            })
                                        }
                                    >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <div>
                                                <Avatar src={item.avatar} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex justify-between">
                                                    <div className="font-bold heading-text truncate flex gap-2 items-center">
                                                        <span>{item.name}</span>
                                                        {item.muted && (
                                                            <TbVolumeOff className="opacity-60" />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="truncate">
                                                    {item.lastConversation}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 items-center">
                                            <small className="font-semibold">
                                                {dayjs
                                                    .unix(item.time)
                                                    .format('hh:mm A')}
                                            </small>
                                            {item.unread > 0 && (
                                                <Badge className="bg-primary" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </>
                    ) : (
                        <div className="flex flex-col gap-8 mt-6">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div
                                    className="flex flex-auto items-center gap-2"
                                    key={'skeleton' + index}
                                >
                                    <div>
                                        <Skeleton
                                            variant="circle"
                                            height={40}
                                            width={40}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-4 w-full">
                                        <Skeleton height={10} />
                                        <Skeleton height={10} width="60%" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </ScrollBar>
            <NewChat />
        </div>
    )
}

export default ChatList
