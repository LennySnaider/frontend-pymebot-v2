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
import { TbVolumeOff, TbSearch, TbX, TbRefresh, TbUser } from 'react-icons/tb'

// Función helper para obtener el color del indicador según la etapa
const getStageIndicatorColor = (stage: string) => {
    switch (stage) {
        case 'new':
        case 'nuevo':
        case 'nuevos':
            return 'bg-purple-500'
        case 'prospecting':
        case 'prospectando':
        case 'prospeccion':
            return 'bg-blue-500'
        case 'qualification':
        case 'calificacion':
        case 'calificación':
            return 'bg-yellow-500'
        case 'opportunity':
        case 'oportunidad':
            return 'bg-orange-500'
        default:
            return 'bg-gray-400'
    }
}
import dayjs from 'dayjs'
import type { ChatType } from '../types'
import type { ChangeEvent } from 'react'
import {
    useLeadRealTimeStore,
    startLeadRealTimeListener,
    stopLeadRealTimeListener,
} from '@/stores/leadRealTimeStore'

// Importar sistema de sincronización global
import globalLeadCache from '@/stores/globalLeadCache'
import useGlobalLeadSync from '@/hooks/useGlobalLeadSync'
import { registerSyncListener } from '@/utils/globalSyncEvent'
// NUEVO: Importar hook de sincronización en tiempo real con Supabase (versión robusta)
// TEMPORALMENTE DESACTIVADO debido a errores de conexión
// import { useRealtimeLeadSyncRobust } from '@/hooks/useRealtimeLeadSyncRobust'
// import { forceRefreshChatList, forceSyncLead } from '@/utils/forceRefreshData' // Comentado - archivo no existe
// import useLeadNameSync from './useLeadNameSync' // Comentado - archivo deshabilitado

// Importar el componente de prueba solo en desarrollo
// Comentado para eliminar la herramienta de depuración
// const LeadSyncTester = process.env.NODE_ENV === 'development' 
//     ? require('./LeadSyncTester').default 
//     : () => null

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
    const updateChatName = useChatStore((state) => state.updateChatName)
    const refreshChatList = useChatStore((state) => state.refreshChatList)
    const triggerUpdate = useChatStore((state) => state.triggerUpdate)
    
    // NUEVO: Activar sincronización en tiempo real con Supabase (versión robusta)
    // TEMPORALMENTE DESACTIVADO debido a errores de conexión
    // const { forceSync, connectionStatus, isRealtime, isFallback } = useRealtimeLeadSyncRobust();
    const connectionStatus = 'disabled';
    const forceSync = () => {};
    const isRealtime = false;
    const isFallback = false;
    
    // Usar el hook de sincronización de nombres
    // useLeadNameSync() // Comentado - archivo deshabilitado
    
    // Hook personalizado para forzar re-renders cuando hay cambios
    const [updateCounter, setUpdateCounter] = useState(0);
    
    // Escuchar cambios en el caché global
    useEffect(() => {
        const unsubscribe = globalLeadCache.subscribe((leadId, data) => {
            console.log(`ChatList: Cambio detectado en caché global para ${leadId}:`, data);
            // Forzar re-render
            setUpdateCounter(prev => prev + 1);
        });
        
        return () => {
            unsubscribe();
        };
    }, []);
    
    // Usar el hook de sincronización global para leads
    const globalLeadSync = useGlobalLeadSync({
        componentName: 'ChatList',
        onUpdate: (leadId, name, stage) => {
            console.log(`ChatList: GlobalLeadSync actualizó lead ${leadId} con nombre "${name}" y etapa ${stage || 'N/A'}`);
            
            // Actualizar directamente en la UI con los datos del caché global
            const chatId = `lead_${leadId}`;
            
            // 1. Actualizar el nombre
            if (name) {
                console.log(`ChatList: Actualizando nombre inmediatamente para ${chatId}: "${name}"`);
                updateChatName(chatId, name);
                
                // COMENTADO TEMPORALMENTE PARA EVITAR LOOPS
                // Intentar forzar una actualización del store y del UI
                /*setTimeout(() => {
                    console.log(`ChatList: Segunda actualización para ${chatId}`);
                    const store = useChatStore.getState();
                    if (store && typeof store.updateChatName === 'function') {
                        store.updateChatName(chatId, name);
                        // Forzar re-render
                        store.setTriggerUpdate(Date.now());
                    }
                }, 100);*/
            }
            
            // 2. Actualizar etapa si está disponible
            if (stage && typeof useChatStore.getState().updateChatMetadata === 'function') {
                useChatStore.getState().updateChatMetadata(chatId, { 
                    stage,
                    lastUpdate: Date.now() // Añadir timestamp para forzar actualización
                });
            }
            
            // COMENTADO TEMPORALMENTE PARA EVITAR LOOPS
            // Forzar refresh de toda la lista para asegurar actualización completa
            /*if (selectedChatType === 'leads' || selectedChatType === 'prospects') {
                console.log('ChatList: Refrescando lista tras actualización de lead en caché global');
                // Usar setTimeout para asegurar que el refresh se ejecuta después de otras actualizaciones
                setTimeout(() => {
                    handleRefreshChatList(true); // Forzar refresh aunque hay uno en curso
                }, 200);
            }*/
        }
    });

    const inputRef = useRef<HTMLInputElement>(null)

    const [showSearchBar, setShowSearchBar] = useState(false)
    const [queryText, setQueryText] = useState('')
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Obtener eventos de leads para reacción en tiempo real
    const lastLeadEvent = useLeadRealTimeStore((state) => state.lastEvent)

    // Efecto para iniciar escucha de eventos de leads
    useEffect(() => {
        console.log('ChatList: Iniciando escucha de eventos de leads')
        startLeadRealTimeListener()
        
        // DEBUG: Verificar estado del caché global al iniciar
        console.log('ChatList: Estado inicial del caché global:');
        if (typeof window !== 'undefined' && (window as any).__globalLeadCache) {
            (window as any).__globalLeadCache.debug();
        }
        
        // Establecer un intervalo para refrescar la lista de chats periódicamente
        // Esto asegura que aunque fallen los eventos, eventualmente se sincroniza
        const autoRefreshInterval = setInterval(() => {
            if (selectedChatType === 'leads' || selectedChatType === 'prospects') {
                console.log('ChatList: Auto-refresh programado ejecutándose');
                handleRefreshChatList();
            }
        }, 15000); // 15 segundos - más frecuente para mejor sincronización
        
        // Escuchar evento especial de forzar refresh
        const handleForceRefresh = (e: any) => {
            console.log('ChatList: Evento force-chat-refresh recibido');
            if (selectedChatType === 'leads' || selectedChatType === 'prospects') {
                handleRefreshChatList();
            }
        };
        
        // Registrar listener para sistema de sincronización global
        const unregisterGlobalSync = registerSyncListener('lead-names', (data) => {
            console.log('ChatList: Evento global-sync recibido:', data);
            if (data && data.leadId && data.name) {
                // Actualizar directamente el nombre
                const chatId = `lead_${data.leadId}`;
                console.log(`ChatList: Actualizando nombre directo desde sync global: ${chatId} -> "${data.name}"`);
                updateChatName(chatId, data.name);
                
                // También actualizar la lista completa
                if (selectedChatType === 'leads' || selectedChatType === 'prospects') {
                    console.log('ChatList: Refrescando lista tras sync global');
                    handleRefreshChatList();
                }
            }
        });
        
        // Registrar listener para forzar refresh
        window.addEventListener('force-chat-refresh', handleForceRefresh);
        
        // También escuchamos eventos del SalesFunnel
        const handleSalesFunnelUpdate = (e: any) => {
            if (e.detail && e.detail.leadId) {
                console.log('ChatList: Evento de SalesFunnel detectado:', e.detail);
                
                // Extraer el ID real del lead (sin prefijo si lo tiene)
                const leadId = e.detail.leadId.startsWith('lead_') 
                    ? e.detail.leadId.substring(5) 
                    : e.detail.leadId;
                    
                const chatId = leadId.startsWith('lead_') ? leadId : `lead_${leadId}`;
                
                console.log(`ChatList: Processing SalesFunnel event for lead ${leadId}, chatId ${chatId}`);
                
                // Si hay datos de etapa en el evento, actualizar la etapa localmente
                if (e.detail.data?.newStage || e.detail.data?.stage) {
                    const stage = e.detail.data.newStage || e.detail.data.stage;
                    console.log(`ChatList: Actualizando etapa de ${chatId} a ${stage}`);
                    
                    // Actualizar metadatos del chat en el store
                    const updateChatMetadata = useChatStore.getState().updateChatMetadata;
                    if (typeof updateChatMetadata === 'function') {
                        updateChatMetadata(chatId, { stage });
                    }
                }
                
                // Si hay un nombre completo, actualizarlo
                if (e.detail.data?.full_name) {
                    console.log(`ChatList: Actualizando nombre de ${chatId} a "${e.detail.data.full_name}"`);
                    updateChatName(chatId, e.detail.data.full_name);
                }
                
                // Refrescar la lista cuando hay un cambio en salesfunnel
                if (selectedChatType === 'leads' || selectedChatType === 'prospects') {
                    handleRefreshChatList();
                }
            }
        };
        
        // Escuchar eventos del SalesFunnel 
        window.addEventListener('salesfunnel-lead-updated', handleSalesFunnelUpdate);
        
        // Escuchamos eventos específicos de sincronización de nombres
        const handleNameSync = (e: any) => {
            if (e.detail && e.detail.leadId && e.detail.data) {
                console.log('ChatList: Evento de sincronización de nombres detectado:', e.detail);
                
                // Extraer el ID real del lead (asegurar formato correcto y quitar prefijo si existe)
                const leadId = e.detail.leadId.startsWith('lead_') ? e.detail.leadId.substring(5) : e.detail.leadId;
                const chatId = `lead_${leadId}`;
                
                console.log(`ChatList: ID normalizado para sincronización: de ${e.detail.leadId} a ${chatId}`);
                
                // Si tenemos el nombre completo en los datos, actualizar
                if (e.detail.data.full_name) {
                    console.log(`ChatList: Actualizando nombre del lead ${leadId} a "${e.detail.data.full_name}"`);
                    updateChatName(chatId, e.detail.data.full_name);
                }
            }
        };
        
        // Escuchar eventos de sincronización de nombres
        window.addEventListener('syncLeadNames', handleNameSync);
        
        // Escuchar evento seguro de sincronización
        const handleSafeNameSync = (e: any) => {
            if (e.detail && e.detail.leadId && e.detail.name) {
                console.log('ChatList: Evento seguro de sincronización detectado:', e.detail);
                const chatId = `lead_${e.detail.leadId}`;
                updateChatName(chatId, e.detail.name);
                // Forzar actualización inmediata
                setUpdateCounter(prev => prev + 1);
            }
        };
        
        window.addEventListener('lead-name-sync', handleSafeNameSync);
        
        return () => {
            console.log('ChatList: Deteniendo escucha de eventos de leads')
            stopLeadRealTimeListener();
            window.removeEventListener('salesfunnel-lead-updated', handleSalesFunnelUpdate);
            window.removeEventListener('syncLeadNames', handleNameSync);
            window.removeEventListener('lead-name-sync', handleSafeNameSync);
            window.removeEventListener('force-chat-refresh', handleForceRefresh);
            window.removeEventListener('lead-update', handleSalesFunnelUpdate);
            
            // Limpiar listeners del sistema de sincronización global
            if (unregisterGlobalSync) {
                unregisterGlobalSync();
            }
            
            // Limpiar el intervalo de auto-refresh al desmontar
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval);
            }
        }
    }, [selectedChatType, updateChatName, setUpdateCounter])

    // Efecto para reaccionar a eventos de leads
    useEffect(() => {
        if (lastLeadEvent) {
            console.log('ChatList: Detectado evento de lead:', lastLeadEvent)

            // Refrescar la lista de chats si es un evento relevante
            if (
                selectedChatType === 'leads' ||
                selectedChatType === 'prospects'
            ) {
                console.log('ChatList: Procesando evento de lead para actualizar UI')
                
                // Extraer el ID del lead (sin prefijo si lo tiene)
                const leadId = lastLeadEvent.leadId.startsWith('lead_') 
                    ? lastLeadEvent.leadId.substring(5) 
                    : lastLeadEvent.leadId;
                    
                const chatId = leadId.startsWith('lead_') ? leadId : `lead_${leadId}`;
                
                // SOLUCIÓN MAS DIRECTA: Forzar siempre un refresh completo para todo evento de lead
                // Esto garantiza que todo esté sincronizado, incluso si es menos eficiente
                console.log(`ChatList: Forzando refresh completo para actualizar chat ${chatId}`);
                handleRefreshChatList();

                // Aplicar actualizaciones directas cuando sea posible para mayor rapidez
                
                // Si el evento contiene el nombre completo, actualizar directamente
                if (lastLeadEvent.data?.full_name) {
                    console.log(`ChatList: Actualizando nombre del lead ${leadId} a "${lastLeadEvent.data.full_name}"`);
                    updateChatName(chatId, lastLeadEvent.data.full_name);
                    // NO disparar más eventos desde aquí para evitar loops
                }
                
                // Si hay datos de etapa en el evento, actualizar la etapa localmente
                if (lastLeadEvent.data?.stage || lastLeadEvent.data?.newStage) {
                    const stage = lastLeadEvent.data.stage || lastLeadEvent.data.newStage;
                    console.log(`ChatList: Actualizando etapa de ${chatId} a ${stage}`);
                    
                    // Actualizar metadatos del chat en el store
                    const updateChatMetadata = useChatStore.getState().updateChatMetadata;
                    if (typeof updateChatMetadata === 'function') {
                        updateChatMetadata(chatId, { 
                            stage,
                            // Añadir timestamp para forzar actualización
                            updateTimestamp: Date.now() 
                        });
                    }
                }
            }
        }
    }, [lastLeadEvent])

    // Función para refrescar manualmente la lista de chats
    const handleRefreshChatList = async (force = false) => {
        // Si está forzado, permitir refresh aunque ya haya uno en curso
        if (isRefreshing && !force) {
            console.log('ChatList: Omitiendo refresh porque ya hay uno en curso');
            return;
        }

        setIsRefreshing(true);
        try {
            console.log('ChatList: Iniciando refresh de lista de chats...');
            
            // SOLUCIÓN ROBUSTA: Refrescar la lista de chats
            // Llamar al método refresh del store
            await refreshChatList();
            
            // Despues del refresh agresivo, aplicar una capa adicional de sincronización
            setTimeout(() => {
                console.log('ChatList: Aplicando capa adicional de sincronización...');
                
                // 1. Verificar los datos en el caché global y sincronizarlos con la lista actual
                const chatStoreChats = useChatStore.getState().chats || [];
                chatStoreChats.forEach(chat => {
                    if (chat.id.startsWith('lead_')) {
                        const leadId = chat.id.substring(5);
                        const cachedName = globalLeadSync.getLeadName(leadId);
                        const cachedStage = globalLeadSync.getLeadStage(leadId);
                        
                        // Si hay un nombre en el caché global, forzar sincronización
                        if (cachedName && cachedName !== chat.name) {
                            console.log(`ChatList: Resincronizando lead ${leadId}: "${cachedName}" (era "${chat.name}")`);
                            // Actualizar directamente el nombre en el store
                            updateChatName(chat.id, cachedName);
                            
                            // Actualizar metadata si hay etapa
                            if (cachedStage && typeof useChatStore.getState().updateChatMetadata === 'function') {
                                useChatStore.getState().updateChatMetadata(chat.id, { stage: cachedStage });
                            }
                        }
                    }
                });
                
                // 2. Forzar una re-renderización del componente
                setQueryText(queryText + ' ');
                setTimeout(() => setQueryText(queryText.trim()), 10);
            }, 500);
        } catch (error) {
            console.error('Error al refrescar lista de chats:', error);
            // En caso de error, intentar un último método desesperado
            try {
                // Como último recurso, forzar recarga completa de la página
                if (typeof window !== 'undefined' && confirm('Error al actualizar datos. ¿Desea recargar la página?')) {
                    window.location.reload();
                    return;
                }
            } catch (reloadError) {
                console.error('Error al intentar recargar página:', reloadError);
            }
        } finally {
            setIsRefreshing(false);
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
        
        // Comprobar si es un lead y si hay datos en el caché global
        let userName = user.name;
        let leadStage = chatItem?.metadata?.stage || (id.startsWith('lead_') ? 'new' : undefined);
        
        if (id.startsWith('lead_')) {
            const leadId = id.substring(5);
            const cachedName = globalLeadSync.getLeadName(leadId);
            const cachedStage = globalLeadSync.getLeadStage(leadId);
            
            // Priorizar datos del caché si están disponibles
            if (cachedName) {
                userName = cachedName;
                console.log(`ChatList: Usando nombre en caché para chat seleccionado: "${cachedName}"`);
            }
            
            if (cachedStage) {
                leadStage = cachedStage;
                console.log(`ChatList: Usando etapa en caché para chat seleccionado: "${cachedStage}"`);
            }
        }

        // Configurar el chat seleccionado con información adicional
        setSelectedChat({
            id,
            user: {
                ...user,
                name: userName // Usar el nombre del caché si está disponible
            },
            muted,
            chatType,
            // Añadir información de etapa y otros datos útiles
            stage: leadStage,
            name: userName, // También actualizar aquí
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
            setSelectedChatType('leads')
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
            {/* Componente de prueba para sincronización - ELIMINADO */}
            {/* El componente LeadSyncTester ha sido eliminado */}
            
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
                        {/* Indicador de estado de sincronización */}
                        <div className="flex items-center">
                            {connectionStatus === 'connected' && (
                                <div 
                                    className="w-2 h-2 bg-green-500 rounded-full animate-pulse" 
                                    title="Realtime conectado"
                                />
                            )}
                            {connectionStatus === 'fallback' && (
                                <div 
                                    className="w-2 h-2 bg-yellow-500 rounded-full" 
                                    title="Modo polling (fallback)"
                                />
                            )}
                            {connectionStatus === 'error' && (
                                <div 
                                    className="w-2 h-2 bg-red-500 rounded-full" 
                                    title="Error de conexión"
                                />
                            )}
                            {connectionStatus === 'connecting' && (
                                <div 
                                    className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" 
                                    title="Conectando..."
                                />
                            )}
                        </div>
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
                                            <div className="relative">
                                                <Avatar icon={<TbUser />} />
                                                {/* Indicador de etapa para leads */}
                                                {item.id.startsWith('lead_') && item.metadata?.stage && (
                                                    <div 
                                                        className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getStageIndicatorColor(item.metadata.stage)}`}
                                                        title={item.metadata.stage}
                                                    />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex justify-between">
                                                    <div className="font-bold heading-text truncate flex gap-2 items-center">
                                                        <span>
                                                        {(() => {
                                                            // Comprobar si es un lead (el ID comienza con lead_)
                                                            if (item.id.startsWith('lead_')) {
                                                                // Extraer ID del lead, eliminando el prefijo lead_
                                                                const leadId = item.id.substring(5);
                                                                // Intentar obtener el nombre del caché global
                                                                const cachedName = globalLeadSync.getLeadName(leadId);
                                                                if (cachedName) {
                                                                    console.log(`ChatList: Usando nombre de caché global para ${item.id}: "${cachedName}" en lugar de "${item.name}"`); 
                                                                    // Si hay un nombre en caché, usarlo y también actualizar el store
                                                                    if (cachedName !== item.name) {
                                                                        // Actualizar el store solo si el nombre es diferente
                                                                        setTimeout(() => updateChatName(item.id, cachedName), 10);
                                                                    }
                                                                    return cachedName;
                                                                }
                                                            }
                                                            // Si no es un lead o no hay datos en caché, usar el nombre almacenado
                                                            return item.name;
                                                        })()}
                                                        </span>
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