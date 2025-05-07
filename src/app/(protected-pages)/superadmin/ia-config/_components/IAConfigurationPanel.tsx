/**
 * frontend/src/app/(protected-pages)/superadmin/ia-config/_components/IAConfigurationPanel.tsx
 * Panel de configuración de APIs para modelos de IA
 * @version 1.0.0
 * @created 2025-04-10
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui/Input'
import { Form, FormItem } from '@/components/ui/Form'
import { notifications } from '@/utils/notifications'
import { supabase } from '@/services/supabase/SupabaseClient'
import Tabs from '@/components/ui/Tabs'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'

const { TabNav, TabList, TabContent } = Tabs

// Interfaz para las configuraciones de API
interface APIConfig {
    model: string
    apiKey: string
    endpoint: string
    description: string
}

const IAConfigurationPanel: React.FC = () => {
    // Estado para las configuraciones
    const [configs, setConfigs] = useState<APIConfig[]>([
        {
            model: 'gpt-4o',
            apiKey: '',
            endpoint: 'https://api.openai.com/v1',
            description:
                'Modelo de lenguaje avanzado de OpenAI. Requiere una clave API de OpenAI.',
        },
        {
            model: 'claude-3',
            apiKey: '',
            endpoint: 'https://api.anthropic.com',
            description:
                'Modelo de IA conversacional de Anthropic. Requiere una clave API de Anthropic.',
        },
        {
            model: 'gemini',
            apiKey: '',
            endpoint: 'https://generativelanguage.googleapis.com',
            description:
                'Modelo de IA de Google. Requiere una clave API de Google AI.',
        },
        {
            model: 'deepseek',
            apiKey: '',
            endpoint: 'https://api.deepseek.com',
            description:
                'Modelo especializado para búsquedas profundas. Requiere una clave API de Deepseek.',
        },
        {
            model: 'minimax',
            apiKey: '',
            endpoint: 'https://api.minimax.chat',
            description:
                'Modelo de IA con optimización para recursos mínimos. Requiere una clave API de Minimax.',
        },
    ])

    const [isSaving, setIsSaving] = useState(false)
    const [currentTab, setCurrentTab] = useState('gpt-4o')
    const [isLoading, setIsLoading] = useState(false)
    const [loadError, setLoadError] = useState('')

    // Cargar configuraciones existentes
    useEffect(() => {
        const loadConfigs = async () => {
            setIsLoading(true)
            setLoadError('')

            try {
                // Verificar si la tabla existe primero
                const { data: tableExists, error: tableError } = await supabase
                    .from('ai_api_configs')
                    .select('count')
                    .limit(1)
                    .single()

                // Si hay un error, la tabla probablemente no existe
                if (tableError) {
                    console.log(
                        'La tabla ai_api_configs no existe o no es accesible',
                    )
                    setLoadError(
                        'La tabla de configuraciones no existe. Por favor, contacte al administrador.',
                    )
                    setIsLoading(false)
                    return
                }

                const { data, error } = await supabase
                    .from('ai_api_configs')
                    .select('*')

                if (error) {
                    console.error('Error al cargar configuraciones:', error)
                    setLoadError(
                        `Error al cargar configuraciones: ${error.message}`,
                    )
                    return
                }

                if (data && data.length > 0) {
                    // Crear una copia segura del estado inicial
                    const baseConfigs = [...configs]

                    // Combinar las configuraciones existentes con las predeterminadas
                    const newConfigs = [...baseConfigs]

                    data.forEach((config) => {
                        const index = newConfigs.findIndex(
                            (c) => c.model === config.model,
                        )
                        if (index >= 0) {
                            newConfigs[index] = {
                                ...newConfigs[index],
                                apiKey: config.api_key || '',
                                endpoint:
                                    config.endpoint ||
                                    newConfigs[index].endpoint,
                            }
                        }
                    })

                    setConfigs(newConfigs)
                }
            } catch (error) {
                console.error(
                    'Error inesperado al cargar configuraciones:',
                    error,
                )
                let errorMessage = 'Error inesperado al cargar configuraciones'

                // Convertir el error a string de forma segura
                if (error instanceof Error) {
                    errorMessage += `: ${error.message}`
                } else if (typeof error === 'string') {
                    errorMessage += `: ${error}`
                } else {
                    errorMessage += '. Revise la consola para más detalles.'
                }

                setLoadError(errorMessage)
            } finally {
                setIsLoading(false)
            }
        }

        loadConfigs()
    }, []) // Se ejecuta solo al montar el componente

    // Manejar cambios en los campos
    const handleChange = (
        model: string,
        field: keyof APIConfig,
        value: string,
    ) => {
        const newConfigs = [...configs]
        const index = newConfigs.findIndex((c) => c.model === model)

        if (index >= 0) {
            newConfigs[index] = {
                ...newConfigs[index],
                [field]: value,
            }
            setConfigs(newConfigs)
        }
    }

    // Guardar configuraciones
    const handleSave = async () => {
        setIsSaving(true)

        try {
            // Preparar datos para guardar
            const configsToSave = configs.map((config) => ({
                model: config.model,
                api_key: config.apiKey,
                endpoint: config.endpoint,
            }))

            // Guardar en la base de datos
            const { error } = await supabase
                .from('ai_api_configs')
                .upsert(configsToSave, { onConflict: 'model' })

            if (error) {
                throw error
            }

            notifications.success('Configuraciones guardadas correctamente')
        } catch (error) {
            console.error('Error al guardar configuraciones:', error)
            notifications.error('Error al guardar las configuraciones')
        } finally {
            setIsSaving(false)
        }
    }

    // Buscar la configuración actual basada en la pestaña
    const getCurrentConfig = () => {
        return (
            configs.find((config) => config.model === currentTab) || configs[0]
        )
    }

    if (isLoading) {
        return (
            <div className="py-4 text-center">
                <Spinner size={24} className="mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Cargando configuraciones...</p>
            </div>
        )
    }

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">
                    Configuración de API para modelos de IA
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configura las claves API globales para los diferentes
                    modelos de IA. Estas claves se utilizarán por defecto en
                    todos los nodos de IA del chatbot y otras integraciones.
                </p>
            </div>

            {loadError && (
                <Alert type="danger" className="mb-6">
                    {loadError}
                </Alert>
            )}

            <Form className="space-y-6">
                <Tabs value={currentTab} onChange={(val) => setCurrentTab(val)}>
                    <TabList className="mb-5">
                        {configs.map((config) => (
                            <TabNav
                                key={config.model}
                                value={config.model}
                                className="capitalize"
                            >
                                {config.model}
                            </TabNav>
                        ))}
                    </TabList>

                    <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-md">
                        {configs.map((config) => (
                            <TabContent key={config.model} value={config.model}>
                                <h3 className="font-medium mb-2 text-base capitalize">
                                    {config.model}
                                </h3>

                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    {config.description}
                                </p>

                                <FormItem label="API Key" className="mb-4">
                                    <Input
                                        type="password"
                                        value={config.apiKey}
                                        onChange={(e) =>
                                            handleChange(
                                                config.model,
                                                'apiKey',
                                                e.target.value,
                                            )
                                        }
                                        placeholder={`Clave API para ${config.model}`}
                                    />
                                </FormItem>

                                <FormItem label="Endpoint">
                                    <Input
                                        value={config.endpoint}
                                        onChange={(e) =>
                                            handleChange(
                                                config.model,
                                                'endpoint',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="URL del endpoint"
                                    />
                                </FormItem>
                            </TabContent>
                        ))}
                    </div>
                </Tabs>

                <div className="flex justify-end gap-2 mt-8 pt-4">
                    <Button
                        variant="solid"
                        color="blue"
                        onClick={handleSave}
                        loading={isSaving}
                    >
                        Guardar configuraciones
                    </Button>
                </div>
            </Form>
        </div>
    )
}

export default IAConfigurationPanel
