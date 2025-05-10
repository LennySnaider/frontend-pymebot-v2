/**
 * frontend/agentprop/src/app/(protected-pages)/modules/marketing/chat/_components/TemplateSelector.tsx
 * Componente selector de plantillas de chatbot
 * @version 1.0.0
 * @updated 2025-04-26
 */

'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useChatStore } from '../_store/chatStore'

// Importación dinámica del componente Select para evitar problemas de hidratación
const SelectWithAvatar = dynamic(() => import('./SelectWithAvatar'), {
    ssr: false, // Desactivamos SSR para evitar errores de hidratación
})

// Tipos para las plantillas
export interface ChatTemplate {
    id: string
    name: string
    description?: string
    avatarUrl?: string
    isActive: boolean
    isEnabled?: boolean
    tokenCost?: number
    flowId?: string | null // ID del flujo instanciado para este tenant
}

interface TemplateSelectorProps {
    onTemplateChange?: (templateId: string) => void
}

const TemplateSelector = ({ onTemplateChange }: TemplateSelectorProps) => {
    // Estado local para la plantilla seleccionada
    const [selectedTemplate, setSelectedTemplate] = useState<string>('')
    const [isClient, setIsClient] = useState(false)

    // Obtener las plantillas disponibles del store
    const templates = useChatStore((state) => state.templates || [])
    const setActiveTemplate = useChatStore((state) => state.setActiveTemplate)

    // Detectar cuando estamos en el cliente
    useEffect(() => {
        setIsClient(true)
    }, [])

    // Establecer la plantilla por defecto al iniciar
    // IMPORTANTE: Solo usamos las plantillas que vienen del servidor, sin preferencias arbitrarias
    useEffect(() => {
        if (isClient && templates.length > 0 && !selectedTemplate) {
            // Buscar plantilla activa según el servidor, o usar la primera
            const defaultTemplate = templates.find((t) => t.isActive) || templates[0];

            // Log para debugging
            console.log('Seleccionando EXACTAMENTE la plantilla que viene del servidor:',
                        defaultTemplate.name, 'ID:', defaultTemplate.id);

            // Actualizar la selección local
            setSelectedTemplate(defaultTemplate.id);

            // Activar la plantilla en el store global
            setActiveTemplate(defaultTemplate.id);
        }
    }, [templates, selectedTemplate, isClient, setActiveTemplate])

    // Manejar el cambio de plantilla
    const handleTemplateChange = (value: string) => {
        setSelectedTemplate(value)
        setActiveTemplate(value)

        if (onTemplateChange) {
            onTemplateChange(value)
        }
    }

    // Filtrar solo las plantillas habilitadas para el selector
    const enabledTemplates = templates.filter((t) => t.isEnabled !== false)

    // No renderizamos nada en el servidor para evitar errores de hidratación
    if (!isClient) {
        return (
            <div className="template-selector w-64 h-10 bg-gray-100 dark:bg-gray-700 rounded-md"></div>
        )
    }

    return (
        <div className="template-selector w-64">
            <SelectWithAvatar
                options={enabledTemplates.map((template) => ({
                    value: template.id,
                    label: template.name,
                    avatarUrl: template.avatarUrl || '/img/avatars/thumb-2.jpg',
                }))}
                value={selectedTemplate}
                onChange={handleTemplateChange}
                placeholder="Selecciona una plantilla"
            />
        </div>
    )
}

export default TemplateSelector
