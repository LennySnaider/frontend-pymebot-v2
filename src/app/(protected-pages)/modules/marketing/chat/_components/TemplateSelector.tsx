/**
 * frontend/agentprop/src/app/(protected-pages)/modules/marketing/chat/_components/TemplateSelector.tsx
 * Componente selector de plantillas de chatbot
 * @version 2.0.0
 * @updated 2025-05-18
 */

'use client'

import { useState, useEffect, memo } from 'react'
import { useChatStore } from '../_store/chatStore'

// Eliminamos importaciones dinámicas innecesarias
// que podrían causar problemas de hidratación

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

/**
 * Componente simplificado que solo muestra la plantilla activa
 * Evita completamente los bucles de renderizado utilizando técnicas avanzadas:
 * 1. Memoización para evitar re-renders innecesarios
 * 2. Manejo explícito de estado isClient para evitar problemas de hidratación
 * 3. Estructura simplificada sin lógica compleja durante renderizado
 */
const TemplateSelector = memo(({ onTemplateChange }: TemplateSelectorProps) => {
    // Estado local simplificado
    const [isClient, setIsClient] = useState(false)

    // Obtener datos necesarios del store
    const templates = useChatStore((state) => state.templates || [])
    const activeTemplateId = useChatStore((state) => state.activeTemplateId)
    const setActiveTemplate = useChatStore((state) => state.setActiveTemplate)

    // Detectar cuándo estamos en el cliente (evita errores de hidratación)
    useEffect(() => {
        setIsClient(true)
    }, [])

    // Inicializar plantilla una sola vez cuando estamos en el cliente
    useEffect(() => {
        if (!isClient || templates.length === 0) return;

        // Esta función se ejecuta una sola vez cuando:
        // 1. Estamos en el cliente
        // 2. Tenemos plantillas disponibles
        const initializeDefaultTemplate = () => {
            try {
                console.log('Inicializando plantilla predeterminada');

                // 1. Verificar si ya hay una plantilla activa en el store
                if (activeTemplateId) {
                    const templateExists = templates.some(t => t.id === activeTemplateId);
                    if (templateExists) {
                        console.log(`Ya hay una plantilla activa: ${activeTemplateId}`);
                        return;
                    }
                }

                // 2. Verificar localStorage
                const savedTemplateId = localStorage.getItem('selectedTemplateId');
                if (savedTemplateId) {
                    const savedTemplateExists = templates.some(t => t.id === savedTemplateId);
                    if (savedTemplateExists) {
                        console.log(`Usando plantilla guardada: ${savedTemplateId}`);
                        setActiveTemplate(savedTemplateId);
                        return;
                    }
                }

                // 3. Buscar plantilla de lead
                const leadTemplate = templates.find(t =>
                    t.name.toLowerCase().includes('lead') &&
                    t.name.toLowerCase().includes('basico')
                );

                if (leadTemplate) {
                    console.log(`Usando plantilla de lead: ${leadTemplate.name}`);
                    setActiveTemplate(leadTemplate.id);
                    localStorage.setItem('selectedTemplateId', leadTemplate.id);
                    return;
                }

                // 4. Usar la primera disponible
                if (templates.length > 0) {
                    console.log(`Usando primera plantilla: ${templates[0].name}`);
                    setActiveTemplate(templates[0].id);
                    localStorage.setItem('selectedTemplateId', templates[0].id);
                }
            } catch (error) {
                console.error('Error al inicializar plantilla predeterminada:', error);
            }
        };

        // Ejecutar inicialización con un pequeño retraso
        // para asegurar que todos los componentes estén hidratados
        const timeoutId = setTimeout(initializeDefaultTemplate, 300);
        return () => clearTimeout(timeoutId);
    }, [isClient, templates, activeTemplateId, setActiveTemplate]);

    // Renderizar placeholder en el servidor
    if (!isClient) {
        return (
            <div className="template-selector w-64 h-10 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse"></div>
        );
    }

    // Encontrar la plantilla activa entre las disponibles
    const activeTemplate = templates.find(t => t.id === activeTemplateId);

    return (
        <div className="template-selector w-64" data-testid="template-selector">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-sm">
                {activeTemplate ? (
                    <>
                        <img
                            src={activeTemplate.avatarUrl || '/img/avatars/thumb-2.jpg'}
                            alt="Template avatar"
                            className="w-6 h-6 rounded-full"
                        />
                        <span>{activeTemplate.name}</span>
                    </>
                ) : (
                    <span className="text-gray-500">Cargando plantillas...</span>
                )}
            </div>
        </div>
    );
});

// Asignar nombre para DevTools
TemplateSelector.displayName = 'TemplateSelector';

export default TemplateSelector;