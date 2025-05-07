/**
 * frontend/src/components/core/verticals/VerticalLayout.tsx
 * Layout principal para verticales que proporciona estructura común
 * y maneja la carga dinámica de componentes específicos por vertical.
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client'

import { ReactNode, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X, AlertTriangle } from 'lucide-react'
import useVerticalRoutes from '@/hooks/core/useVerticalRoutes'
import VerticalBreadcrumb from './VerticalBreadcrumb'
import VerticalSidebar from './VerticalSidebar'

interface VerticalLayoutProps {
  children: ReactNode;
  verticalCode?: string;
}

/**
 * Layout principal para todas las páginas de verticales
 * Proporciona:
 * - Barra lateral de navegación con módulos
 * - Breadcrumb para navegación
 * - Diseño responsive con toggle de sidebar
 * - Manejo de errores y estados de carga
 */
export default function VerticalLayout({ 
  children,
  verticalCode: propVerticalCode
}: VerticalLayoutProps) {
  const pathname = usePathname()
  const { currentRoute, loading } = useVerticalRoutes()
  
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  
  // Determinar vertical actual (desde props o desde la ruta)
  const verticalCode = propVerticalCode || currentRoute?.vertical
  
  // Detectar si es móvil para controlar sidebar
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Cerrar sidebar en móvil cuando cambia la ruta
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [pathname, isMobile])
  
  // Manejar errores - verificar si la ruta es válida
  if (currentRoute && !currentRoute.isValid) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="container mx-auto p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center text-red-500 dark:text-red-400 mb-4">
              <AlertTriangle className="h-8 w-8 mr-3" />
              <h1 className="text-2xl font-bold">Vertical o módulo no válido</h1>
            </div>
            <p>
              La ruta solicitada no corresponde a una vertical o módulo válido. Por favor, verifica la URL y vuelve a intentarlo.
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  // Mostrar mensaje de carga mientras se determina la validez de la ruta
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">Cargando...</h2>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Botón de menú móvil (solo visible en móviles) */}
      <div className="lg:hidden p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
        <VerticalBreadcrumb className="hidden sm:flex" />
        
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
        >
          {sidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
            lg:translate-x-0
            transition-transform duration-300 ease-in-out
            lg:relative fixed top-0 bottom-0 left-0 z-40
            w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
            overflow-hidden
          `}
        >
          {verticalCode && (
            <VerticalSidebar 
              verticalCode={verticalCode}
              className="h-full"
            />
          )}
        </div>
        
        {/* Overlay para cerrar sidebar en móvil */}
        {sidebarOpen && isMobile && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Contenido principal */}
        <main className="flex-1 overflow-auto min-w-0">
          {/* Breadcrumb (visible solo en desktop) */}
          <div className="hidden lg:block p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <VerticalBreadcrumb />
          </div>
          
          {/* Contenido de la página */}
          <div className="p-4 md:p-6 h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
