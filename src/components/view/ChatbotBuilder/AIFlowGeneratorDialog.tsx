'use client'

import React, { useState } from 'react'
import { Button, Dialog, Input, Select, Checkbox, Tag } from '@/components/ui'
import { notifications } from '@/utils/notifications'
import { ChatbotGenerationOptions } from '@/services/AiService'
import useTranslation from '@/utils/hooks/useTranslation'

// Opciones predefinidas para selects
const INDUSTRY_OPTIONS = [
    { value: 'inmobiliaria', label: 'Inmobiliaria' },
    { value: 'salud', label: 'Salud' },
    { value: 'restaurante', label: 'Restaurante' },
    { value: 'gimnasio', label: 'Gimnasio' },
    { value: 'belleza', label: 'Belleza y Estética' },
    { value: 'educacion', label: 'Educación' },
    { value: 'legal', label: 'Servicios Legales' },
    { value: 'automotriz', label: 'Automotriz' },
    { value: 'retail', label: 'Comercio/Retail' },
    { value: 'otros', label: 'Otros' }
]

const VERTICAL_OPTIONS = [
    { value: 'bienes_raices', label: 'Bienes Raíces (AgentProp)' },
    { value: 'medicina', label: 'Medicina (AgentMedic)' },
    { value: 'fitness', label: 'Fitness (AgentFit)' },
    { value: 'belleza', label: 'Belleza y Estética (AgentEstetic)' },
    { value: 'general', label: 'General' }
]

const COMPLEXITY_OPTIONS = [
    { value: 'simple', label: 'Simple - Flujo básico lineal' },
    { value: 'medium', label: 'Medio - Varias opciones y ramificaciones' },
    { value: 'complex', label: 'Complejo - Múltiples nodos y validaciones' }
]

const LANGUAGE_OPTIONS = [
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'Inglés' }
]

const FEATURES_OPTIONS = [
    { value: 'appointments', label: 'Citas y reservas' },
    { value: 'services', label: 'Catálogo de servicios' },
    { value: 'products', label: 'Catálogo de productos' },
    { value: 'faq', label: 'Preguntas frecuentes' },
    { value: 'voice', label: 'Asistente de voz' },
    { value: 'contact', label: 'Formulario de contacto' },
    { value: 'surveys', label: 'Encuestas de satisfacción' }
]

interface AIFlowGeneratorDialogProps {
    isOpen: boolean
    onClose: () => void
    onGenerate: (options: ChatbotGenerationOptions) => void
    tenantId?: string
}

const AIFlowGeneratorDialog: React.FC<AIFlowGeneratorDialogProps> = ({
    isOpen,
    onClose,
    onGenerate,
    tenantId = ''
}) => {
    const { t } = useTranslation()
    // Estado para las opciones de generación
    const [options, setOptions] = useState<ChatbotGenerationOptions>({
        vertical: 'general',
        industry: 'inmobiliaria',
        description: '',
        features: ['appointments'],
        complexity: 'medium',
        language: 'es',
        includeAI: true,
        tenant_id: tenantId
    })
    
    // Estado de carga
    const [isLoading, setIsLoading] = useState(false)
    
    // Manejador para cambios en los inputs
    const handleChange = (name: keyof ChatbotGenerationOptions, value: any) => {
        setOptions(prev => ({
            ...prev,
            [name]: value
        }))
    }
    
    // Manejador para cambios en el checkbox de includeAI
    const handleIncludeAIChange = (checked: boolean) => {
        handleChange('includeAI', checked)
    }
    
    // Manejador para selección de características
    const handleFeatureSelect = (value: string) => {
        setOptions(prev => {
            const features = [...(prev.features || [])]
            
            // Verificar si ya está incluido
            if (features.includes(value)) {
                return {
                    ...prev,
                    features: features.filter(f => f !== value)
                }
            } else {
                return {
                    ...prev,
                    features: [...features, value]
                }
            }
        })
    }
    
    // Manejador para enviar el formulario
    const handleSubmit = () => {
        // Validar opciones mínimas
        if (!options.vertical || !options.industry || !options.complexity) {
            notifications.error('Por favor completa los campos requeridos')
            return
        }
        
        setIsLoading(true)
        
        try {
            // Asegurarse de que el tenant_id esté incluido
            const finalOptions = {
                ...options,
                tenant_id: tenantId
            }
            
            // Llamar al callback de generación
            onGenerate(finalOptions)
            
            // Cerrar el diálogo y resetear estados
            setTimeout(() => {
                setIsLoading(false)
                onClose()
            }, 500)
        } catch (error) {
            setIsLoading(false)
            notifications.error('Error al generar el flujo')
            console.error('Error al generar flujo:', error)
        }
    }
    
    return (
        <Dialog
            isOpen={isOpen}
            title="Generar Flujo de Chatbot con IA"
            onClose={onClose}
            onRequestClose={onClose}
            contentClassName="max-w-2xl"
        >
            <div className="space-y-5 my-4">
                <p className="text-gray-600 dark:text-gray-400">
                    Configura los parámetros para generar automáticamente un flujo de chatbot adaptado a tus necesidades.
                </p>
                
                {/* Vertical y tipo de negocio */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block font-medium text-sm mb-1">
                            Vertical
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <Select
                            options={VERTICAL_OPTIONS}
                            value={options.vertical}
                            onChange={value => handleChange('vertical', value)}
                            size="sm"
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block font-medium text-sm mb-1">
                            Tipo de Negocio
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <Select
                            options={INDUSTRY_OPTIONS}
                            value={options.industry}
                            onChange={value => handleChange('industry', value)}
                            size="sm"
                            className="w-full"
                        />
                    </div>
                </div>
                
                {/* Descripción del chatbot */}
                <div>
                    <label className="block font-medium text-sm mb-1">
                        Descripción del Chatbot
                    </label>
                    <Input
                        textArea
                        value={options.description || ''}
                        onChange={e => handleChange('description', e.target.value)}
                        placeholder="Describe brevemente la función de este chatbot..."
                        className="w-full"
                        rows={3}
                    />
                </div>
                
                {/* Complejidad y Lenguaje */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block font-medium text-sm mb-1">
                            Complejidad
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <Select
                            options={COMPLEXITY_OPTIONS}
                            value={options.complexity}
                            onChange={value => handleChange('complexity', value)}
                            size="sm"
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block font-medium text-sm mb-1">
                            Idioma
                        </label>
                        <Select
                            options={LANGUAGE_OPTIONS}
                            value={options.language}
                            onChange={value => handleChange('language', value)}
                            size="sm"
                            className="w-full"
                        />
                    </div>
                </div>
                
                {/* Características a incluir */}
                <div>
                    <label className="block font-medium text-sm mb-1">
                        Características a incluir
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {FEATURES_OPTIONS.map(feature => (
                            <Tag
                                key={feature.value}
                                className="cursor-pointer"
                                prefix={
                                    options.features?.includes(feature.value) ?
                                        <span className="text-blue-500">✓</span> :
                                        null
                                }
                                onClick={() => handleFeatureSelect(feature.value)}
                                color={
                                    options.features?.includes(feature.value) ?
                                        "blue" : "gray"
                                }
                            >
                                {feature.label}
                            </Tag>
                        ))}
                    </div>
                </div>
                
                {/* Opciones adicionales */}
                <div>
                    <Checkbox
                        checked={options.includeAI}
                        onChange={e => handleIncludeAIChange(e.target.checked)}
                    >
                        Incluir nodos de IA para respuestas inteligentes
                    </Checkbox>
                    <p className="text-xs text-gray-500 mt-1 ml-6">
                        Los nodos de IA permiten respuestas más naturales y adaptables.
                    </p>
                </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex justify-end gap-2 mt-6">
                <Button
                    variant="default"
                    onClick={onClose}
                    disabled={isLoading}
                >
                    Cancelar
                </Button>
                <Button
                    variant="solid"
                    color="blue"
                    onClick={handleSubmit}
                    loading={isLoading}
                >
                    Generar Flujo
                </Button>
            </div>
        </Dialog>
    )
}

export default AIFlowGeneratorDialog