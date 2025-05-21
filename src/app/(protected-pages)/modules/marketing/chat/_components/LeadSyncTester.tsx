'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import { forceSyncLeadName, forceRefreshChatList } from '@/utils/forceSyncLeadNames'

/**
 * Componente para probar la sincronización entre SalesFunnel y ChatList
 * SOLO PARA DESARROLLO - Remover en producción
 */
const LeadSyncTester = () => {
    const [lastEvent, setLastEvent] = useState<any>(null)
    const [log, setLog] = useState<string[]>([])
    
    useEffect(() => {
        const handleSalesFunnelUpdate = (e: any) => {
            const timestamp = new Date().toISOString().substring(11, 23)
            console.log(`[${timestamp}] LeadSyncTester: Evento de SalesFunnel detectado:`, e.detail)
            
            // Guardar el último evento
            setLastEvent(e.detail)
            
            // Añadir al log
            setLog(prev => [
                `[${timestamp}] Evento salesfunnel-lead-updated: leadId=${e.detail.leadId?.substring(0, 8)}, 
                 data=${JSON.stringify(e.detail.data).substring(0, 80)}...`,
                ...prev.slice(0, 9) // Mantener solo 10 entradas
            ])
        }
        
        // Escuchar eventos
        window.addEventListener('salesfunnel-lead-updated', handleSalesFunnelUpdate)
        
        return () => {
            window.removeEventListener('salesfunnel-lead-updated', handleSalesFunnelUpdate)
        }
    }, [])
    
    const [chats, setChats] = useState<any[]>([])
    
    // Obtener los chats existentes al cargar el componente
    useEffect(() => {
        // Acceder a los chats a través del store global
        try {
            // Importar de forma dinámica para evitar errores de SSR
            import('../_store/chatStore').then(({ useChatStore }) => {
                const chatList = useChatStore.getState().chats || []
                // Filtrar solo los leads
                const leads = chatList.filter(chat => 
                    chat.id.startsWith('lead_') && 
                    chat.chatType === 'leads'
                )
                setChats(leads)
                console.log('LeadSyncTester: Chats cargados:', leads.length)
            })
        } catch (error) {
            console.error('Error cargando chats:', error)
        }
    }, [])
    
    const testLeadEvent = () => {
        // Si hay chats existentes, usar uno real, de lo contrario usar uno de prueba
        const existingLead = chats.length > 0 ? chats[Math.floor(Math.random() * chats.length)] : null
        
        // ID de lead (usar uno existente o generar uno de prueba)
        const testLeadId = existingLead ? 
            existingLead.id.replace('lead_', '') : 
            `test-${Math.floor(Math.random() * 100000)}`
        
        // Nuevo nombre (para ver el cambio visualmente)
        const newName = existingLead ? 
            `${existingLead.name} [Actualizado ${new Date().toISOString().substring(14, 19)}]` :
            `Test Lead ${testLeadId}`
        
        // Crear un evento de prueba
        const eventData = {
            leadId: testLeadId, // Sin prefijo 'lead_'
            data: {
                full_name: newName,
                newStage: 'calificacion',
                email: 'test@example.com',
                phone: '5559876543',
                source: 'test',
                timestamp: Date.now()
            }
        }
        
        // Usar la nueva utilidad de sincronización forzada para mayor seguridad
        const timestamp = new Date().toISOString().substring(11, 23)
        console.log(`[${timestamp}] LeadSyncTester: Forzando sincronización con nuevo sistema:`, eventData)
        
        // Forzar sincronización de nombre
        forceSyncLeadName(eventData.leadId, eventData.data.full_name)
        
        // Programar un refresh adicional con retraso de 500ms para asegurar actualización
        setTimeout(forceRefreshChatList, 500)
        
        // Añadir al log
        setLog(prev => [
            `[${timestamp}] ENVÍO DE EVENTO: leadId=${testLeadId}, name=${newName}, stage=calificacion`,
            ...prev
        ])
    }
    
    return (
        <div className="p-3 border border-gray-300 bg-gray-50 rounded-lg mb-4 text-sm">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-primary-700">Depuración de Sync SalesFunnel ↔ Chat</h3>
                <div className="flex space-x-2">
                    <Button 
                        size="sm" 
                        variant="solid"
                        onClick={testLeadEvent}
                    >
                        {chats.length > 0 ? 'Actualizar lead existente' : 'Emitir evento de prueba'}
                    </Button>
                    <Button 
                        size="sm" 
                        variant="plain"
                        onClick={() => {
                            // Forzar un refresh de la lista de chats usando la nueva utilidad
                            try {
                                const timestamp = new Date().toISOString().substring(11, 23);
                                forceRefreshChatList();
                                setLog(prev => [
                                    `[${timestamp}] REFRESH FORZADO: Actualizando lista de chats...`,
                                    ...prev
                                ]);
                                
                                // Actualizar la lista local de chats después de un corto retraso
                                setTimeout(() => {
                                    import('../_store/chatStore').then(({ useChatStore }) => {
                                        // Actualizar lista local de chats
                                        const chatList = useChatStore.getState().chats || [];
                                        const leads = chatList.filter(chat => 
                                            chat.id.startsWith('lead_') && 
                                            chat.chatType === 'leads'
                                        );
                                        setChats(leads);
                                        
                                        // Añadir al log
                                        const timestamp = new Date().toISOString().substring(11, 23);
                                        setLog(prev => [
                                            `[${timestamp}] REFRESH COMPLETADO: ${leads.length} leads disponibles`,
                                            ...prev
                                        ]);
                                    });
                                }, 1000);
                            } catch (error) {
                                console.error('Error refrescando chats:', error);
                            }
                        }}
                    >
                        Refrescar
                    </Button>
                </div>
            </div>
            
            <div className="bg-white border rounded p-2 mb-2 max-h-40 overflow-y-auto">
                <div className="mb-1 font-medium">Log de eventos:</div>
                {log.length > 0 ? (
                    <ul className="text-xs space-y-1 font-mono">
                        {log.map((entry, i) => (
                            <li key={i} className={i === 0 ? "text-primary-700 font-semibold" : ""}>
                                {entry}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-gray-500 text-xs italic">
                        No se han detectado eventos aún...
                    </div>
                )}
            </div>
            
            <div className="text-xs space-y-1">
                <div>
                    <span className="font-semibold">Instrucciones:</span> Editar un lead en SalesFunnel debería 
                    generar eventos que aparezcan aquí y actualicen automáticamente el ChatList.
                </div>
                <div>
                    <span className="font-semibold">Leads disponibles:</span> {chats.length > 0 ? 
                        chats.map(chat => chat.name).join(', ').substring(0, 80) + (chats.map(chat => chat.name).join(', ').length > 80 ? '...' : '') : 
                        'Ninguno - use el botón Refrescar para buscar leads'}
                </div>
            </div>
        </div>
    )
}

export default LeadSyncTester