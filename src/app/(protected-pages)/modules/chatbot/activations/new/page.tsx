/**
 * frontend/src/app/(protected-pages)/modules/chatbot/activations/new/page.tsx
 * Página para activar una nueva plantilla de chatbot
 * @version 1.1.0
 * @updated 2025-06-05
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { toastHelpers } from '@/utils/toast-helpers'
import HeaderBreadcrumbs from '@/components/shared/HeaderBreadcrumbs'
import { LuBot, LuInfo, LuSearch, LuCheck } from '../icons'
import { useAuth } from '@/hooks/useAuth'

// Inicialización de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Template {
    id: string
    name: string
    description: string
    status: string
    vertical_id?: string
    vertical_name?: string
    created_at: string
}

const NewActivationPage = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user } = useAuth()
    
    const [tenantId, setTenantId] = useState<string | null>(null)
    const [tenantName, setTenantName] = useState<string>('')
    const [templates, setTemplates] = useState<Template[]>([])
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [activating, setActivating] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [verticalFilter, setVerticalFilter] = useState<string>('all')
    const [verticals, setVerticals] = useState<Array<{ id: string, name: string }>>([])
    
    // Obtener el tenant_id de los parámetros de búsqueda
    useEffect(() => {
        const tenant = searchParams.get('tenant')
        if (tenant) {
            setTenantId(tenant)
            fetchTenantDetails(tenant)
        }
    }, [searchParams])
    
    // Cargar datos iniciales
    useEffect(() => {
        if (tenantId) {
            fetchAvailableTemplates()
            fetchVerticals()
        }
    }, [tenantId])
    
    // Obtener detalles del tenant
    const fetchTenantDetails = async (id: string) => {
        try {
            const { data, error } = await supabase
                .from('tenants')
                .select('name')
                .eq('id', id)
                .single()
            
            if (error) throw error
            
            setTenantName(data.name || 'Tenant sin nombre')
        } catch (error) {
            console.error('Error fetching tenant details:', error)
            toastHelpers.error('Error al cargar información del tenant')
        }
    }
    
    // Cargar plantillas disponibles
    const fetchAvailableTemplates = async () => {
        try {
            setLoading(true)
            
            // Primero obtenemos los IDs de plantillas ya activadas por este tenant
            const { data: activations, error: activationsError } = await supabase
                .from('tenant_chatbot_activations')
                .select('template_id')
                .eq('tenant_id', tenantId)
                .eq('is_active', true)
            
            if (activationsError) throw activationsError
            
            const activatedTemplateIds = (activations || []).map(act => act.template_id)
            
            // Ahora obtenemos todas las plantillas publicadas que NO estén ya activadas
            let query = supabase
                .from('chatbot_templates')
                .select(`
                    *,
                    verticals:vertical_id (id, name)
                `)
                .eq('status', 'published')
                .eq('is_deleted', false)
            
            // Excluir plantillas ya activadas si hay alguna
            if (activatedTemplateIds.length > 0) {
                query = query.not('id', 'in', `(${activatedTemplateIds.join(',')})`)
            }
            
            const { data: templates, error: templatesError } = await query
            
            if (templatesError) throw templatesError
            
            // Procesar datos para un formato más fácil de usar
            const processedTemplates = (templates || []).map(template => ({
                ...template,
                vertical_name: template.verticals?.name
            }))
            
            setTemplates(processedTemplates)
        } catch (error) {
            console.error('Error fetching available templates:', error)
            toastHelpers.error('Error al cargar plantillas disponibles')
        } finally {
            setLoading(false)
        }
    }
    
    // Cargar verticales
    const fetchVerticals = async () => {
        try {
            const { data, error } = await supabase
                .from('verticals')
                .select('id, name')
                .order('name', { ascending: true })
            
            if (error) throw error
            
            setVerticals(data || [])
        } catch (error) {
            console.error('Error fetching verticals:', error)
            // No mostramos toast para esto ya que es menos crítico
        }
    }
    
    // Activar la plantilla seleccionada
    const handleActivateTemplate = async () => {
        if (!selectedTemplateId || !tenantId) {
            toastHelpers.error('Selecciona una plantilla para activar')
            return
        }
        
        try {
            setActivating(true)
            
            // 1. Obtener información sobre la versión de la plantilla
            const { data: template, error: templateError } = await supabase
                .from('chatbot_templates')
                .select('id, version')
                .eq('id', selectedTemplateId)
                .single()
            
            if (templateError) throw templateError
            
            const templateVersion = template?.version || 1
            
            // 2. Crear registro de activación
            const { data: activation, error: activationError } = await supabase
                .from('tenant_chatbot_activations')
                .insert({
                    tenant_id: tenantId,
                    template_id: selectedTemplateId,
                    is_active: true,
                    activated_by: user.id,
                    template_version: templateVersion,
                    activated_at: new Date().toISOString()
                })
                .select()
                .single()
            
            if (activationError) throw activationError
            
            // 3. Crear configuración inicial vacía
            const { error: configError } = await supabase
                .from('tenant_chatbot_configurations')
                .insert({
                    activation_id: activation.id,
                    config_data: {},
                    updated_by: user.id
                })
            
            if (configError) throw configError
            
            toastHelpers.success('Plantilla activada correctamente')
            
            // Redirigir a la página de configuración
            router.push(`/modules/chatbot/activations/${activation.id}/configure`)
        } catch (error) {
            console.error('Error activating template:', error)
            toastHelpers.error('Error al activar la plantilla')
            setActivating(false)
        }
    }
    
    // Cancelar y volver a la lista de activaciones
    const handleCancel = () => {
        router.push('/modules/chatbot/activations')
    }
    
    // Filtrar plantillas según los criterios
    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            template.description.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesVertical = verticalFilter === 'all' || template.vertical_id === verticalFilter

        return matchesSearch && matchesVertical
    })

    // Verificar si hay plantillas para cada categoría para determinar si mostrar la sección
    const hasVentasTemplates = filteredTemplates.some(template => template.vertical_name === 'Ventas')
    const hasServicioTemplates = filteredTemplates.some(template => template.vertical_name === 'Servicio al cliente')
    const hasMarketingTemplates = filteredTemplates.some(template => template.vertical_name === 'Marketing')
    const hasOtherTemplates = filteredTemplates.some(template => !template.vertical_name || !['Ventas', 'Servicio al cliente', 'Marketing'].includes(template.vertical_name))
    
    return (
        <>
            <HeaderBreadcrumbs
                heading="Activar nueva plantilla"
                links={[
                    { name: 'Dashboard', href: '/home' },
                    { name: 'Chatbot', href: '/modules/chatbot' },
                    { name: 'Activaciones', href: '/modules/chatbot/activations' },
                    { name: 'Activar plantilla' }
                ]}
            />
            
            <div className="mb-10">
                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12">
                        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                            <div className="flex items-start gap-4">
                                <div className="bg-primary/10 p-3 rounded-lg">
                                    <LuBot className="text-primary w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-medium text-gray-900 mb-1">
                                        Activar plantilla para {tenantName}
                                    </h2>
                                    <p className="text-gray-500 mb-3">
                                        Selecciona una plantilla de chatbot para activar en tu negocio. Una vez activada, 
                                        podrás personalizarla según tus necesidades específicas.
                                    </p>
                                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                                        <h3 className="font-medium text-amber-800 mb-1 flex items-center">
                                            <LuInfo className="w-5 h-5 mr-1 text-amber-500" />
                                            Información importante
                                        </h3>
                                        <ul className="text-sm text-amber-700 space-y-1 pl-6 list-disc">
                                            <li>Solo puedes activar plantillas que no estén ya activadas en tu cuenta.</li>
                                            <li>Después de activar una plantilla, deberás configurarla antes de utilizarla.</li>
                                            <li>Puedes activar múltiples plantillas para diferentes propósitos.</li>
                                            <li>Las plantillas activadas permanecerán disponibles incluso si se crean nuevas versiones.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-xl shadow-sm max-w-7xl mx-auto">
                            <div className="mb-6">
                                <h3 className="text-lg font-medium text-gray-800 mb-3">Plantillas disponibles</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                    {/* Búsqueda */}
                                    <div className="col-span-1">
                                        <label htmlFor="search" className="sr-only">Buscar</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <LuSearch className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                id="search"
                                                className="block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                placeholder="Buscar por nombre o descripción"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Filtro de vertical */}
                                    <div className="col-span-1">
                                        <label htmlFor="vertical-filter" className="sr-only">Filtrar por vertical</label>
                                        <select
                                            id="vertical-filter"
                                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            value={verticalFilter}
                                            onChange={(e) => setVerticalFilter(e.target.value)}
                                        >
                                            <option value="all">Todas las verticales</option>
                                            {verticals.map(vertical => (
                                                <option key={vertical.id} value={vertical.id}>
                                                    {vertical.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                        <p className="mt-2 text-sm text-gray-500">Cargando plantillas disponibles...</p>
                                    </div>
                                ) : filteredTemplates.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-md">
                                        <LuBot className="h-12 w-12 text-gray-400 mx-auto" />
                                        <p className="mt-2 text-sm text-gray-500">
                                            No hay plantillas disponibles para activar
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Todas las plantillas disponibles ya están activadas o no hay plantillas publicadas.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {/* Categoría: Ventas */}
                                        {hasVentasTemplates && (
                                            <div>
                                                <h4 className="text-base font-medium text-gray-700 mb-3 border-b pb-2 border-gray-200">Ventas</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {filteredTemplates
                                                    .filter(template => template.vertical_name === 'Ventas')
                                                    .map((template) => (
                                                        <div
                                                            key={template.id}
                                                            className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                                                                selectedTemplateId === template.id
                                                                    ? 'border-primary shadow-md ring-2 ring-primary ring-opacity-20'
                                                                    : 'border-gray-200 hover:border-primary/50'
                                                            }`}
                                                            onClick={() => setSelectedTemplateId(template.id)}
                                                        >
                                                            <div className="p-4">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <h4 className="font-medium text-gray-800">
                                                                        {template.name}
                                                                    </h4>
                                                                    {selectedTemplateId === template.id && (
                                                                        <div className="bg-primary text-white rounded-full p-1">
                                                                            <LuCheck className="h-4 w-4" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                                                                    {template.description}
                                                                </p>
                                                                <div className="flex items-center justify-between">
                                                                    {template.vertical_name && (
                                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                            {template.vertical_name}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-xs text-gray-400">
                                                                        {new Date(template.created_at).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                            </div>
                                        )}

                                        {/* Categoría: Servicio al cliente */}
                                        {hasServicioTemplates && (
                                            <div>
                                                <h4 className="text-base font-medium text-gray-700 mb-3 border-b pb-2 border-gray-200">Servicio al cliente</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {filteredTemplates
                                                    .filter(template => template.vertical_name === 'Servicio al cliente')
                                                    .map((template) => (
                                                        <div
                                                            key={template.id}
                                                            className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                                                                selectedTemplateId === template.id
                                                                    ? 'border-primary shadow-md ring-2 ring-primary ring-opacity-20'
                                                                    : 'border-gray-200 hover:border-primary/50'
                                                            }`}
                                                            onClick={() => setSelectedTemplateId(template.id)}
                                                        >
                                                            <div className="p-4">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <h4 className="font-medium text-gray-800">
                                                                        {template.name}
                                                                    </h4>
                                                                    {selectedTemplateId === template.id && (
                                                                        <div className="bg-primary text-white rounded-full p-1">
                                                                            <LuCheck className="h-4 w-4" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                                                                    {template.description}
                                                                </p>
                                                                <div className="flex items-center justify-between">
                                                                    {template.vertical_name && (
                                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                            {template.vertical_name}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-xs text-gray-400">
                                                                        {new Date(template.created_at).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                            </div>
                                        )}

                                        {/* Categoría: Marketing */}
                                        {hasMarketingTemplates && (
                                            <div>
                                                <h4 className="text-base font-medium text-gray-700 mb-3 border-b pb-2 border-gray-200">Marketing</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {filteredTemplates
                                                    .filter(template => template.vertical_name === 'Marketing')
                                                    .map((template) => (
                                                        <div
                                                            key={template.id}
                                                            className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                                                                selectedTemplateId === template.id
                                                                    ? 'border-primary shadow-md ring-2 ring-primary ring-opacity-20'
                                                                    : 'border-gray-200 hover:border-primary/50'
                                                            }`}
                                                            onClick={() => setSelectedTemplateId(template.id)}
                                                        >
                                                            <div className="p-4">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <h4 className="font-medium text-gray-800">
                                                                        {template.name}
                                                                    </h4>
                                                                    {selectedTemplateId === template.id && (
                                                                        <div className="bg-primary text-white rounded-full p-1">
                                                                            <LuCheck className="h-4 w-4" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                                                                    {template.description}
                                                                </p>
                                                                <div className="flex items-center justify-between">
                                                                    {template.vertical_name && (
                                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                            {template.vertical_name}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-xs text-gray-400">
                                                                        {new Date(template.created_at).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                            </div>
                                        )}

                                        {/* Categoría: Otros */}
                                        {hasOtherTemplates && (
                                            <div>
                                                <h4 className="text-base font-medium text-gray-700 mb-3 border-b pb-2 border-gray-200">Otros</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {filteredTemplates
                                                    .filter(template => !template.vertical_name || !['Ventas', 'Servicio al cliente', 'Marketing'].includes(template.vertical_name))
                                                    .map((template) => (
                                                        <div
                                                            key={template.id}
                                                            className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                                                                selectedTemplateId === template.id
                                                                    ? 'border-primary shadow-md ring-2 ring-primary ring-opacity-20'
                                                                    : 'border-gray-200 hover:border-primary/50'
                                                            }`}
                                                            onClick={() => setSelectedTemplateId(template.id)}
                                                        >
                                                            <div className="p-4">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <h4 className="font-medium text-gray-800">
                                                                        {template.name}
                                                                    </h4>
                                                                    {selectedTemplateId === template.id && (
                                                                        <div className="bg-primary text-white rounded-full p-1">
                                                                            <LuCheck className="h-4 w-4" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                                                                    {template.description}
                                                                </p>
                                                                <div className="flex items-center justify-between">
                                                                    {template.vertical_name && (
                                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                            {template.vertical_name}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-xs text-gray-400">
                                                                        {new Date(template.created_at).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                            </div>
                                        )}

                                        {/* Mensaje cuando no hay resultados en ninguna categoría tras filtrar */}
                                        {!hasVentasTemplates && !hasServicioTemplates && !hasMarketingTemplates && !hasOtherTemplates && filteredTemplates.length > 0 && (
                                            <div className="text-center py-6 bg-gray-50 rounded-md">
                                                <p className="text-sm text-gray-500">
                                                    No se encontraron plantillas que coincidan con los criterios de búsqueda.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                                <button
                                    onClick={handleCancel}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleActivateTemplate}
                                    disabled={!selectedTemplateId || activating}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {activating ? (
                                        <span className="flex items-center">
                                            <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                                            Activando...
                                        </span>
                                    ) : (
                                        'Activar plantilla'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default NewActivationPage