'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/services/supabase/SupabaseClient'
import { useAuthContext } from '@/components/providers/AuthProvider'

interface Module {
    id: string
    code: string
    name: string
    description: string
    vertical_id: string
    required: boolean
    created_at: string
    updated_at: string
}

interface TenantModule {
    id: string
    tenant_id: string
    module_id: string
    is_active: boolean
    module: Module
}

export function useTenantModules() {
    const { tenantId } = useAuthContext()
    const [modules, setModules] = useState<TenantModule[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchTenantModules() {
            if (!tenantId) {
                setLoading(false)
                return
            }

            try {
                // Obtener módulos activos del tenant con información completa del módulo
                const { data, error } = await supabase
                    .from('tenant_modules')
                    .select(`
                        *,
                        module:modules (*)
                    `)
                    .eq('tenant_id', tenantId)
                    .eq('is_active', true)

                if (error) {
                    throw error
                }

                setModules(data || [])
            } catch (err) {
                console.error('Error fetching tenant modules:', err)
                setError(err instanceof Error ? err.message : 'Unknown error')
            } finally {
                setLoading(false)
            }
        }

        fetchTenantModules()
    }, [tenantId])

    return { modules, loading, error }
}

// Hook para verificar si un módulo específico está activo
export function useIsModuleActive(moduleCode: string): boolean {
    const { modules } = useTenantModules()
    return modules.some(tm => tm.module.code === moduleCode && tm.is_active)
}

export default useTenantModules