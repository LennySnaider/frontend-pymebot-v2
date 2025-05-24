'use client'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTenantStore } from '@/stores/core/tenantStore'

/**
 * Componente que inicializa el tenantStore con la información del tenant del usuario autenticado
 */
export default function TenantInitializer({ children }: { children: React.ReactNode }) {
  const { user, tenantId, isAuthenticated } = useAuth()
  const { currentTenant, setCurrentTenant } = useTenantStore()

  useEffect(() => {
    if (isAuthenticated && tenantId && (!currentTenant || currentTenant.id !== tenantId)) {
      console.log('TenantInitializer: Inicializando tenant con ID:', tenantId)
      
      // Actualizar el tenant actual con la información básica
      setCurrentTenant({
        id: tenantId,
        name: 'Tenant', // Esto se puede obtener de la BD más adelante
        slug: 'tenant',
        plan: {
          id: 'default',
          name: 'Default',
          level: 'professional',
          features: ['all'],
          verticals: ['all']
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {},
        status: 'active'
      })
      
      // También guardar en localStorage para acceso rápido
      if (typeof window !== 'undefined') {
        localStorage.setItem('current_tenant_id', tenantId)
      }
    }
  }, [isAuthenticated, tenantId, currentTenant, setCurrentTenant])

  return <>{children}</>
}
