/**
 * Header para la página de agentes
 * Incluye título y botón para crear nuevo agente
 */

'use client'

import { useTranslations } from 'next-intl'
import Button from '@/components/ui/Button'
import { HiOutlinePlus } from 'react-icons/hi'
import { useAgentContext } from './AgentProvider'

export default function AgentHeader() {
    const t = useTranslations()
    const { openCreateDialog } = useAgentContext()
    
    return (
        <div className="flex items-center justify-between">
            <div>
                <h3 className="text-lg font-semibold">Gestión de Agentes</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Administra los agentes inmobiliarios de tu empresa
                </p>
            </div>
            
            <Button
                variant="solid"
                size="sm"
                icon={<HiOutlinePlus />}
                onClick={openCreateDialog}
            >
                Nuevo Agente
            </Button>
        </div>
    )
}