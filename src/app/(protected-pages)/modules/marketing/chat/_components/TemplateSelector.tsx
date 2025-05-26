/**
 * frontend/agentprop/src/app/(protected-pages)/modules/marketing/chat/_components/TemplateSelector.tsx
 * Componente selector de plantillas de chatbot
 * @version 2.0.0
 * @updated 2025-05-18
 */

'use client'

import { useState, useEffect, memo } from 'react'
import { useChatStore } from '../_store/chatStore'
import Select from '@/components/ui/Select'
import { 
    TbSpeakerphone,     // Marketing
    TbUserCheck,        // Leads/Ventas
    TbHeartHandshake,   // Servicio al cliente
    TbSchool,           // Educación
    TbCalendarEvent,    // Citas/Agenda
    TbInfoCircle,       // Información
    TbTemplate,         // Plantilla genérica
    TbRobot            // Bot genérico
} from 'react-icons/tb'

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

// Función para obtener el icono según el tipo de plantilla
const getTemplateIcon = (templateName: string) => {
    const name = templateName.toLowerCase()
    
    if (name.includes('marketing')) return <TbSpeakerphone className="w-4 h-4" />
    if (name.includes('lead') || name.includes('venta')) return <TbUserCheck className="w-4 h-4" />
    if (name.includes('servicio') || name.includes('soporte')) return <TbHeartHandshake className="w-4 h-4" />
    if (name.includes('educacion') || name.includes('educativo')) return <TbSchool className="w-4 h-4" />
    if (name.includes('cita') || name.includes('agenda')) return <TbCalendarEvent className="w-4 h-4" />
    if (name.includes('info') || name.includes('informacion')) return <TbInfoCircle className="w-4 h-4" />
    
    return <TbTemplate className="w-4 h-4" /> // Icono por defecto
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

    // Cargar plantillas eliminadas de localStorage
    const [deletedTemplateIds, setDeletedTemplateIds] = useState<Set<string>>(new Set())
    
    useEffect(() => {
        if (isClient) {
            const savedDeletedIds = localStorage.getItem('deletedTemplateIds')
            if (savedDeletedIds) {
                try {
                    const ids = JSON.parse(savedDeletedIds)
                    setDeletedTemplateIds(new Set(ids))
                } catch (e) {
                    console.error('Error al cargar plantillas eliminadas:', e)
                }
            }
        }
    }, [isClient])
    
    // Filtrar plantillas eliminadas localmente
    const visibleTemplates = templates.filter(template => !deletedTemplateIds.has(template.id))
    
    // Inicializar plantilla una sola vez cuando estamos en el cliente
    useEffect(() => {
        if (!isClient || visibleTemplates.length === 0) return;

        // Esta función se ejecuta una sola vez cuando:
        // 1. Estamos en el cliente
        // 2. Tenemos plantillas disponibles
        const initializeDefaultTemplate = () => {
            try {
                console.log('Inicializando plantilla predeterminada');

                // 1. Verificar si ya hay una plantilla activa en el store
                if (activeTemplateId) {
                    const templateExists = visibleTemplates.some(t => t.id === activeTemplateId);
                    if (templateExists) {
                        console.log(`Ya hay una plantilla activa: ${activeTemplateId}`);
                        return;
                    }
                }

                // 2. Verificar localStorage
                const savedTemplateId = localStorage.getItem('selectedTemplateId');
                if (savedTemplateId) {
                    const savedTemplateExists = visibleTemplates.some(t => t.id === savedTemplateId);
                    if (savedTemplateExists) {
                        console.log(`Usando plantilla guardada: ${savedTemplateId}`);
                        setActiveTemplate(savedTemplateId);
                        return;
                    }
                }

                // 3. Buscar plantilla de lead
                const leadTemplate = visibleTemplates.find(t =>
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
                if (visibleTemplates.length > 0) {
                    console.log(`Usando primera plantilla: ${visibleTemplates[0].name}`);
                    setActiveTemplate(visibleTemplates[0].id);
                    localStorage.setItem('selectedTemplateId', visibleTemplates[0].id);
                }
            } catch (error) {
                console.error('Error al inicializar plantilla predeterminada:', error);
            }
        };

        // Ejecutar inicialización con un pequeño retraso
        // para asegurar que todos los componentes estén hidratados
        const timeoutId = setTimeout(initializeDefaultTemplate, 300);
        return () => clearTimeout(timeoutId);
    }, [isClient, visibleTemplates, activeTemplateId, setActiveTemplate]);

    // Renderizar placeholder en el servidor
    if (!isClient) {
        return (
            <div className="template-selector w-64 h-10 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse"></div>
        );
    }
    
    // Encontrar la plantilla activa entre las disponibles
    const activeTemplate = visibleTemplates.find(t => t.id === activeTemplateId);

    // Manejar cambio de plantilla
    const handleTemplateChange = (selectedOption: any) => {
        const templateId = selectedOption?.value;
        if (templateId && templateId !== activeTemplateId) {
            console.log('Cambiando plantilla a:', templateId);
            setActiveTemplate(templateId);
            localStorage.setItem('selectedTemplateId', templateId);
            
            // Notificar el cambio
            if (onTemplateChange) {
                onTemplateChange(templateId);
            }
            
            // Disparar evento para otros componentes
            const selectedTemplate = visibleTemplates.find(t => t.id === templateId);
            if (selectedTemplate) {
                const event = new CustomEvent('template-changed', { 
                    detail: { 
                        templateId, 
                        templateName: selectedTemplate.name 
                    } 
                });
                window.dispatchEvent(event);
            }
        }
    };

    // Preparar opciones para el Select
    const templateOptions = visibleTemplates.map(template => ({
        value: template.id,
        label: template.name,
        icon: getTemplateIcon(template.name),
        description: template.description
    }));

    const selectedOption = activeTemplateId 
        ? templateOptions.find(opt => opt.value === activeTemplateId)
        : null;

    return (
        <div className="template-selector w-64" data-testid="template-selector">
            <Select
                value={selectedOption}
                options={templateOptions}
                onChange={handleTemplateChange}
                placeholder="Seleccionar plantilla..."
                size="sm"
                formatOptionLabel={(option: any) => (
                    <div className="flex items-center gap-2">
                        {option.icon}
                        <span>{option.label}</span>
                    </div>
                )}
                isSearchable={false}
                className="template-select"
                classNamePrefix="template-select"
                styles={{
                    control: (base: any) => ({
                        ...base,
                        minHeight: '36px',
                        height: '36px'
                    }),
                    valueContainer: (base: any) => ({
                        ...base,
                        height: '36px',
                        padding: '0 8px'
                    }),
                    input: (base: any) => ({
                        ...base,
                        margin: '0px',
                    }),
                    indicatorSeparator: () => ({
                        display: 'none'
                    }),
                    indicatorsContainer: (base: any) => ({
                        ...base,
                        height: '36px'
                    })
                }}
            />
        </div>
    );
});

// Asignar nombre para DevTools
TemplateSelector.displayName = 'TemplateSelector';

export default TemplateSelector;