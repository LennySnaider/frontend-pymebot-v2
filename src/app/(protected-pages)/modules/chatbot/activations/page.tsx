/**
 * frontend/src/app/(protected-pages)/modules/chatbot/activations/page.tsx
 * Página para gestionar activaciones de chatbot por tenant
 * @version 1.1.0
 * @updated 2025-06-05
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { toastHelpers } from '@/utils/toast-helpers'
import HeaderBreadcrumbs from '@/components/shared/HeaderBreadcrumbs'
import { LuBot } from './icons'
import { useAuth } from '@/hooks/useAuth'
import ChatbotActivationsList from '@/components/view/ChatbotBuilder/ChatbotActivationsList'

// Inicialización de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const ChatbotActivationsPage = () => {
    const router = useRouter()
    const { user, session } = useAuth()
    const [tenantId, setTenantId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [isSuperAdmin, setIsSuperAdmin] = useState(false)
    const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)
    const [tenants, setTenants] = useState<Array<{ id: string, name: string }>>([])

    // Cargar datos iniciales
    useEffect(() => {
        if (session) {
            const init = async () => {
                try {
                    setLoading(true)
                    
                    // Verificar si el usuario es superadmin
                    const isSuperAdmin = user?.role === 'super_admin'
                    setIsSuperAdmin(isSuperAdmin)
                    
                    if (isSuperAdmin) {
                        // Cargar lista de tenants para superadmin
                        await fetchTenants()
                    } else {
                        // Para usuarios normales, usar su tenantId
                        const tenantId = user?.tenantId || null
                        setTenantId(tenantId)
                        setSelectedTenantId(tenantId)
                    }
                } catch (error) {
                    console.error('Error initialization:', error)
                    toastHelpers.error('Error al cargar datos iniciales')
                } finally {
                    setLoading(false)
                }
            }
            
            init()
        }
    }, [session, user])
    
    // Cargar tenants para superadmin
    const fetchTenants = async () => {
        try {
            const { data, error } = await supabase
                .from('tenants')
                .select('id, name')
                .eq('is_active', true)
                .order('name', { ascending: true })
            
            if (error) throw error
            
            setTenants(data || [])
            
            // Seleccionar primer tenant por defecto si hay alguno
            if (data && data.length > 0) {
                setSelectedTenantId(data[0].id)
            }
        } catch (error) {
            console.error('Error fetching tenants:', error)
            toastHelpers.error('Error al cargar lista de tenants')
        }
    }
    
    // Crear nueva activación
    const handleNewActivation = () => {
        if (!selectedTenantId) {
            toastHelpers.error('Selecciona un tenant para activar una plantilla')
            return
        }
        
        router.push(`/modules/chatbot/activations/new?tenant=${selectedTenantId}`)
    }
    
    // Manejar cambio de tenant seleccionado (para superadmin)
    const handleTenantChange = (tenantId: string) => {
        setSelectedTenantId(tenantId)
    }
    
    // Desactivar/reactivar una plantilla
    const handleToggleActivation = async (activationId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('tenant_chatbot_activations')
                .update({
                    is_active: !currentStatus,
                    updated_by: user.id,
                    updated_at: new Date().toISOString()
                })
                .eq('id', activationId)
            
            if (error) throw error
            
            toastHelpers.success(
                currentStatus 
                    ? 'Plantilla desactivada correctamente' 
                    : 'Plantilla reactivada correctamente'
            )
            
            // Forzar recarga del componente hijo
            setLoading(true)
            setTimeout(() => setLoading(false), 500)
        } catch (error) {
            console.error('Error toggling activation:', error)
            toastHelpers.error('Error al cambiar estado de la plantilla')
        }
    }
    
    // Configurar una activación
    const handleConfigureActivation = (activationId: string) => {
        router.push(`/modules/chatbot/activations/${activationId}/configure`)
    }
    
    return (
        <>
            <HeaderBreadcrumbs
                heading="Activaciones de Chatbot"
                links={[
                    { name: 'Dashboard', href: '/home' },
                    { name: 'Chatbot', href: '/modules/chatbot' },
                    { name: 'Activaciones' }
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
                                        Gestión de Plantillas de Chatbot
                                    </h2>
                                    <p className="text-gray-500 mb-2">
                                        Activa, configura y gestiona plantillas de chatbot para tus clientes. Las plantillas activadas 
                                        pueden ser personalizadas según las necesidades específicas de cada tenant.
                                    </p>
                                    
                                    {isSuperAdmin && (
                                        <div className="flex flex-col md:flex-row md:items-center gap-3 mt-3 pt-3 border-t border-gray-200">
                                            <label htmlFor="tenant-selector" className="text-sm font-medium text-gray-700">
                                                Seleccionar Tenant:
                                            </label>
                                            <select
                                                id="tenant-selector"
                                                className="min-w-[250px] border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                value={selectedTenantId || ''}
                                                onChange={(e) => handleTenantChange(e.target.value)}
                                            >
                                                <option value="" disabled>Seleccionar tenant</option>
                                                {tenants.map(tenant => (
                                                    <option key={tenant.id} value={tenant.id}>
                                                        {tenant.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-medium text-gray-800">
                                    Plantillas Activadas
                                </h3>
                                <button
                                    onClick={handleNewActivation}
                                    disabled={!selectedTenantId}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Activar Nueva Plantilla
                                </button>
                            </div>
                            
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                    <p className="mt-2 text-sm text-gray-500">Cargando activaciones...</p>
                                </div>
                            ) : (
                                <ChatbotActivationsList
                                    tenantId={selectedTenantId || ''}
                                    onToggleActivation={handleToggleActivation}
                                    onConfigureActivation={handleConfigureActivation}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ChatbotActivationsPage