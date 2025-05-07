/**
 * frontend/src/app/(protected-pages)/modules/chatbot/activations/[id]/configure/page.tsx
 * Página para configurar una activación de chatbot existente
 * @version 1.1.0
 * @updated 2025-06-05
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { toastHelpers } from '@/utils/toast-helpers'
import HeaderBreadcrumbs from '@/components/shared/HeaderBreadcrumbs'
import { LuBot } from '../../icons'
import { useAuth } from '@/hooks/useAuth'
import ChatbotActivationConfig from '@/components/view/ChatbotBuilder/ChatbotActivationConfig'

// Inicialización de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface ActivationData {
    id: string
    tenant_id: string
    template_id: string
    is_active: boolean
    template_version: number
    template_name: string
    tenant_name: string
    config_id: string
    config_data: any
}

interface PageProps {
    params: {
        id: string
    }
}

const ConfigureActivationPage = ({ params }: PageProps) => {
    const router = useRouter()
    const { id: activationId } = params
    const { user } = useAuth()
    
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activationData, setActivationData] = useState<ActivationData | null>(null)
    const [configFields, setConfigFields] = useState<any[]>([])
    const [flowPreview, setFlowPreview] = useState<any>(null)
    
    // Cargar datos de la activación
    useEffect(() => {
        if (activationId) {
            fetchActivationData(activationId)
        }
    }, [activationId])
    
    // Cargar datos de la activación, su configuración y la estructura del flujo
    const fetchActivationData = async (id: string) => {
        try {
            setLoading(true)
            
            // 1. Obtener datos básicos de la activación junto con nombre de la plantilla y tenant
            const { data: activation, error: activationError } = await supabase
                .from('tenant_chatbot_activations')
                .select(`
                    *,
                    templates:template_id (id, name, react_flow_json),
                    tenants:tenant_id (id, name)
                `)
                .eq('id', id)
                .single()
            
            if (activationError) throw activationError
            
            // 2. Obtener configuración actual
            const { data: config, error: configError } = await supabase
                .from('tenant_chatbot_configurations')
                .select('*')
                .eq('activation_id', id)
                .single()
            
            if (configError && configError.code !== 'PGRST116') { // No data found is ok
                throw configError
            }
            
            // 3. Organizar los datos
            const activationInfo: ActivationData = {
                id: activation.id,
                tenant_id: activation.tenant_id,
                template_id: activation.template_id,
                is_active: activation.is_active,
                template_version: activation.template_version,
                template_name: activation.templates.name,
                tenant_name: activation.tenants.name,
                config_id: config?.id || '',
                config_data: config?.config_data || {}
            }
            
            setActivationData(activationInfo)
            
            // 4. Extraer campos configurables del flujo
            const flowJson = activation.templates.react_flow_json
            setFlowPreview(flowJson)
            
            // Analizar el flujo para encontrar campos configurables
            const configFields = extractConfigurableFields(flowJson)
            setConfigFields(configFields)
            
        } catch (error) {
            console.error('Error fetching activation data:', error)
            toastHelpers.error('Error al cargar los datos de la activación')
            router.push('/modules/chatbot/activations')
        } finally {
            setLoading(false)
        }
    }
    
    // Analizar la estructura del flujo para extraer campos configurables
    const extractConfigurableFields = (flowJson: any) => {
        if (!flowJson || !flowJson.nodes) return []
        
        const fields: any[] = []
        
        // Recorrer nodos buscando campos configurables
        flowJson.nodes.forEach((node: any) => {
            if (!node.data) return
            
            // Ejemplo: campos configurables en nodos de texto
            if (node.type === 'text' || node.type === 'message') {
                if (node.data.isConfigurable) {
                    fields.push({
                        id: `message_${node.id}`,
                        nodeId: node.id,
                        type: 'text',
                        label: node.data.label || 'Mensaje de texto',
                        description: node.data.description,
                        defaultValue: node.data.message,
                        fieldName: 'message',
                        section: 'Mensajes'
                    })
                }
            }
            
            // Variables globales del bot
            if (node.data.configurableVars && Array.isArray(node.data.configurableVars)) {
                node.data.configurableVars.forEach((varField: any) => {
                    fields.push({
                        id: `var_${varField.name}`,
                        type: varField.type || 'text',
                        label: varField.label || varField.name,
                        description: varField.description,
                        defaultValue: varField.defaultValue || '',
                        fieldName: varField.name,
                        section: varField.section || 'Variables globales'
                    })
                })
            }
        })
        
        // Añadir configuraciones generales
        fields.push({
            id: 'general_welcome_message',
            type: 'text',
            label: 'Mensaje de bienvenida',
            description: 'Mensaje que se muestra al iniciar una nueva conversación',
            defaultValue: '¡Hola! ¿En qué puedo ayudarte hoy?',
            fieldName: 'welcome_message',
            section: 'General'
        })
        
        fields.push({
            id: 'general_business_name',
            type: 'text',
            label: 'Nombre del negocio',
            description: 'Nombre que se usará en los mensajes',
            defaultValue: '',
            fieldName: 'business_name',
            section: 'General'
        })
        
        fields.push({
            id: 'general_business_hours',
            type: 'textarea',
            label: 'Horario de atención',
            description: 'Horario de atención del negocio',
            defaultValue: 'Lunes a Viernes: 9:00 AM - 6:00 PM\nSábados: 10:00 AM - 2:00 PM',
            fieldName: 'business_hours',
            section: 'General'
        })
        
        return fields
    }
    
    // Guardar la configuración
    const handleSaveConfig = async (configData: any) => {
        if (!activationData || !activationId) {
            toastHelpers.error('No hay datos de activación disponibles')
            return
        }
        
        try {
            setSaving(true)
            
            if (activationData.config_id) {
                // Actualizar configuración existente
                const { error } = await supabase
                    .from('tenant_chatbot_configurations')
                    .update({
                        config_data: configData,
                        updated_by: user.id,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', activationData.config_id)
                
                if (error) throw error
            } else {
                // Crear nueva configuración
                const { error } = await supabase
                    .from('tenant_chatbot_configurations')
                    .insert({
                        activation_id: activationId,
                        config_data: configData,
                        updated_by: user.id
                    })
                
                if (error) throw error
            }
            
            toastHelpers.success('Configuración guardada correctamente')
            
            // Actualizar los datos locales
            setActivationData({
                ...activationData,
                config_data: configData
            })
            
        } catch (error) {
            console.error('Error saving configuration:', error)
            toastHelpers.error('Error al guardar la configuración')
        } finally {
            setSaving(false)
        }
    }
    
    // Cancelar y volver a la lista de activaciones
    const handleCancel = () => {
        router.push('/modules/chatbot/activations')
    }
    
    return (
        <>
            <HeaderBreadcrumbs
                heading="Configurar chatbot"
                links={[
                    { name: 'Dashboard', href: '/home' },
                    { name: 'Chatbot', href: '/modules/chatbot' },
                    { name: 'Activaciones', href: '/modules/chatbot/activations' },
                    { name: 'Configurar' }
                ]}
            />
            
            <div className="mb-10">
                {loading ? (
                    <div className="flex justify-center items-center bg-white p-8 rounded-xl shadow-sm h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : activationData ? (
                    <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-12">
                            <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary/10 p-3 rounded-lg">
                                        <LuBot className="text-primary w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-medium text-gray-900 mb-1">
                                            Configurar: {activationData.template_name}
                                        </h2>
                                        <p className="text-sm text-gray-500 mb-1">
                                            Tenant: <span className="font-medium">{activationData.tenant_name}</span>
                                        </p>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                activationData.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {activationData.is_active ? 'Activo' : 'Inactivo'}
                                            </span>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                Versión {activationData.template_version}
                                            </span>
                                        </div>
                                        <p className="text-gray-500">
                                            Personaliza la configuración de esta plantilla de chatbot para adaptarla a las necesidades
                                            específicas de este tenant.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <ChatbotActivationConfig
                                configFields={configFields}
                                initialConfig={activationData.config_data}
                                flowPreview={flowPreview}
                                onSave={handleSaveConfig}
                                onCancel={handleCancel}
                                isSaving={saving}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-8 rounded-xl shadow-sm text-center">
                        <p className="text-gray-500">
                            No se encontró la activación especificada.
                        </p>
                    </div>
                )}
            </div>
        </>
    )
}

export default ConfigureActivationPage