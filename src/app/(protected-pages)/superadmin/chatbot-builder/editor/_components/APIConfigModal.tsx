/**
 * frontend/src/app/(protected-pages)/modules/superadmin/chatbot-builder/editor/_components/APIConfigModal.tsx
 * Modal para configurar claves API globales para los modelos de IA
 * @version 1.2.0
 * @updated 2025-04-10 - Agregado enlace a la página completa de configuración
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Dialog } from '@/components/ui'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui/Input'
import { Form, FormItem } from '@/components/ui/Form'
import { notifications } from '@/utils/notifications'
import { supabase } from '@/services/supabase/SupabaseClient'
import Tabs from '@/components/ui/tabs'
import { useRouter } from 'next/navigation'

const { TabNav, TabList, TabContent } = Tabs

// Interfaz para las configuraciones de API
interface APIConfig {
    model: string
    apiKey: string
    endpoint: string
}

interface APIConfigModalProps {
    isOpen: boolean
    onClose: () => void
}

const APIConfigModal: React.FC<APIConfigModalProps> = ({ isOpen, onClose }) => {
    const router = useRouter()
    // Estado para las configuraciones
    const [configs, setConfigs] = useState<APIConfig[]>([
        { model: 'gpt-4o', apiKey: '', endpoint: 'https://api.openai.com/v1' },
        {
            model: 'claude-3',
            apiKey: '',
            endpoint: 'https://api.anthropic.com',
        },
        {
            model: 'gemini',
            apiKey: '',
            endpoint: 'https://generativelanguage.googleapis.com',
        },
        { model: 'deepseek', apiKey: '', endpoint: 'https://api.deepseek.com' },
        { model: 'minimax', apiKey: '', endpoint: 'https://api.minimax.chat' },
    ])

    const [isSaving, setIsSaving] = useState(false)
    const [currentTab, setCurrentTab] = useState('gpt-4o')
    const [isLoading, setIsLoading] = useState(false)
    const [loadError, setLoadError] = useState('')

    // Cargar configuraciones existentes
    useEffect(() => {
        const loadConfigs = async () => {
            if (!isOpen) return
            
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
                    console.log('La tabla ai_api_configs no existe o no es accesible')
                    setLoadError('La tabla de configuraciones no existe. Por favor, contacte al administrador.')
                    setIsLoading(false)
                    return
                }
                
                const { data, error } = await supabase
                    .from('ai_api_configs')
                    .select('*')

                if (error) {
                    console.error('Error al cargar configuraciones:', error)
                    setLoadError(`Error al cargar configuraciones: ${error.message}`)
                    return
                }

                if (data && data.length > 0) {
                    // Crear una copia segura del estado inicial
                    const baseConfigs = [
                        { model: 'gpt-4o', apiKey: '', endpoint: 'https://api.openai.com/v1' },
                        { model: 'claude-3', apiKey: '', endpoint: 'https://api.anthropic.com' },
                        { model: 'gemini', apiKey: '', endpoint: 'https://generativelanguage.googleapis.com' },
                        { model: 'deepseek', apiKey: '', endpoint: 'https://api.deepseek.com' },
                        { model: 'minimax', apiKey: '', endpoint: 'https://api.minimax.chat' },
                    ];
                    
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
                console.error('Error inesperado al cargar configuraciones:', error)
                let errorMessage = 'Error inesperado al cargar configuraciones';
                
                // Convertir el error a string de forma segura
                if (error instanceof Error) {
                    errorMessage += `: ${error.message}`;
                } else if (typeof error === 'string') {
                    errorMessage += `: ${error}`;
                } else {
                    errorMessage += '. Revise la consola para más detalles.';
                }
                
                setLoadError(errorMessage)
            } finally {
                setIsLoading(false)
            }
        }

        if (isOpen) {
            loadConfigs()
        }
        
        // Limpieza al desmontar
        return () => {
            setIsLoading(false)
            setLoadError('')
        }
    }, [isOpen]) // Eliminada la dependencia circular configs

    // Manejar cambios en los campos
    const handleChange = (
        model: string,
        field: keyof APIConfig,
        value: string,
    ) => {
        const newConfigs = [...configs]
        const index = newConfigs.findIndex(c => c.model === model)
        
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
            onClose()
        } catch (error) {
            console.error('Error al guardar configuraciones:', error)
            notifications.error('Error al guardar las configuraciones')
        } finally {
            setIsSaving(false)
        }
    }

    // Buscar la configuración actual basada en la pestaña
    const getCurrentConfig = () => {
        return configs.find(config => config.model === currentTab) || configs[0];
    }

    return (
        <Dialog isOpen={isOpen} onClose={onClose} width={600}>
            <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">
                        Configuración de API para modelos de IA
                    </h2>
                    <Button 
                        variant="plain" 
                        color="blue"
                        onClick={() => {
                            onClose();
                            // Redireccionar a la página de configuración completa
                            router.push('/modules/superadmin/ia-config');
                        }}
                    >
                        Ir a configuración completa
                    </Button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Configura las claves API globales para los diferentes
                    modelos de IA. Estas claves se utilizarán por defecto en
                    todos los nodos de IA.
                </p>

                {loadError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-500 rounded-md">
                        {loadError}
                    </div>
                )}

                {isLoading ? (
                    <div className="py-8 text-center">
                        <div className="w-8 h-8 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-500">Cargando configuraciones...</p>
                    </div>
                ) : (
                    <Form className="space-y-6">
                        <Tabs value={currentTab} onChange={(val) => setCurrentTab(val)}>
                            <TabList className="mb-5">
                                {configs.map(config => (
                                    <TabNav 
                                        key={config.model} 
                                        value={config.model}
                                        className="capitalize"
                                    >
                                        {config.model}
                                    </TabNav>
                                ))}
                            </TabList>
                            
                            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                                {configs.map((config) => (
                                    <TabContent key={config.model} value={config.model}>
                                        <h3 className="font-medium mb-3 text-base capitalize">
                                            {config.model}
                                        </h3>

                                        <FormItem label="API Key">
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

                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="plain" onClick={onClose}>
                                Cancelar
                            </Button>
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
                )}
            </div>
        </Dialog>
    )
}

export default APIConfigModal
