/**
 * frontend/src/app/(protected-pages)/vertical-[verticalCode]/layout.tsx
 * Layout dinámico para todas las verticales basado en parámetro de ruta.
 * Implementa resolución dinámica de rutas y estructura común para todas las verticales.
 * @version 2.0.0
 * @updated 2025-04-30
 */

'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Toaster } from '@/components/ui/toaster'
import useVerticalRoutes from '@/hooks/core/useVerticalRoutes'
import VerticalLayout from '@/components/core/verticals/VerticalLayout'

interface VerticalLayoutWrapperProps {
  children: React.ReactNode;
  params: { verticalCode: string };
}

/**
 * Layout dinámico para cualquier vertical basado en el parámetro de ruta
 * Utiliza el sistema de resolución dinámica para:
 * - Validar la vertical y módulo
 * - Cargar componentes específicos de la vertical
 * - Proporcionar estructura de navegación común
 */
export default function VerticalLayoutWrapper({ 
  children,
  params
}: VerticalLayoutWrapperProps) {
  const { verticalCode } = params
  const pathname = usePathname()
  const { currentRoute, parseVerticalRoute } = useVerticalRoutes()
  
  // Configurar título de la página basado en la ruta
  useEffect(() => {
    if (!currentRoute) return
    
    const { verticalName, moduleName } = currentRoute
    let pageTitle = verticalName
    
    if (moduleName) {
      pageTitle = `${moduleName} | ${verticalName}`
    }
    
    document.title = `${pageTitle} | PymeBot`
  }, [currentRoute, pathname])
  
  return (
    <VerticalLayout verticalCode={verticalCode}>
      {/* Contenido específico de la vertical */}
      <div className="h-full">
        {children}
      </div>
      
      {/* Toaster para notificaciones */}
      <Toaster />
    </VerticalLayout>
  )
}
