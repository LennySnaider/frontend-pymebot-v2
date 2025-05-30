/**
 * Componente temporal para debug del chat
 */

'use client'

import { useEffect, useState } from 'react'
import { useChatStore } from '../_store/chatStore'
import Card from '@/components/ui/Card'

const ChatDebugInfo = () => {
    const templates = useChatStore((state) => state.templates)
    const activeTemplateId = useChatStore((state) => state.activeTemplateId)
    const selectedChat = useChatStore((state) => state.selectedChat)
    const [backendStatus, setBackendStatus] = useState<string>('Verificando...')
    
    useEffect(() => {
        // Health check deshabilitado para evitar spam en logs
        // El componente está desactivado (return null)
        setBackendStatus('Deshabilitado')
    }, [])
    
    // Desactivado completamente
    return null
    
    return (
        <Card className="p-4 mb-4 bg-yellow-50 dark:bg-yellow-900/20">
            <h3 className="font-bold mb-2">🔧 Debug Info</h3>
            <div className="text-sm space-y-1">
                <div>
                    <strong>Backend:</strong> {backendStatus}
                </div>
                <div>
                    <strong>Plantillas cargadas:</strong> {templates.length}
                </div>
                <div>
                    <strong>Plantilla activa:</strong> {activeTemplateId || 'Ninguna'}
                </div>
                <div>
                    <strong>Chat seleccionado:</strong> {selectedChat?.id || 'Ninguno'}
                </div>
                <div>
                    <strong>Tenant ID:</strong> {localStorage.getItem('tenantId') || 'No definido'}
                </div>
            </div>
            
            {templates.length > 0 && (
                <div className="mt-2">
                    <strong className="text-xs">Plantillas disponibles:</strong>
                    <ul className="text-xs mt-1">
                        {templates.map(t => (
                            <li key={t.id} className={t.id === activeTemplateId ? 'text-green-600 font-bold' : ''}>
                                {t.name} ({t.id}) {t.isActive ? '✓' : '✗'}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </Card>
    )
}

export default ChatDebugInfo