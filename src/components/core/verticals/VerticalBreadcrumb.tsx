/**
 * frontend/src/components/core/verticals/VerticalBreadcrumb.tsx
 * Componente de breadcrumb para mostrar la ruta actual dentro de una vertical.
 * Proporciona navegación intuitiva entre módulos de una vertical.
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import useVerticalRoutes from '@/hooks/core/useVerticalRoutes'

interface VerticalBreadcrumbProps {
  showHome?: boolean;
  className?: string;
}

/**
 * Componente para mostrar una ruta de navegación (breadcrumb) para verticales
 * Analiza la ruta actual y muestra enlaces para cada nivel de navegación
 */
export default function VerticalBreadcrumb({ 
  showHome = true,
  className = '' 
}: VerticalBreadcrumbProps) {
  const pathname = usePathname()
  const { parseVerticalRoute, currentRoute } = useVerticalRoutes()
  
  // Construir items del breadcrumb basado en la ruta actual
  const breadcrumbItems = useMemo(() => {
    const items = []
    
    // Agregar Home si está habilitado
    if (showHome) {
      items.push({
        label: 'Inicio',
        href: '/home',
        icon: <Home className="w-4 h-4" />
      })
    }
    
    if (!pathname || !currentRoute) return items
    
    const { vertical, verticalName, module, moduleName } = currentRoute
    
    if (vertical) {
      // Agregar la vertical
      items.push({
        label: verticalName || `Vertical ${vertical}`,
        href: `/vertical-${vertical}`,
        icon: null
      })
      
      // Agregar el módulo si existe
      if (module) {
        items.push({
          label: moduleName || module,
          href: `/vertical-${vertical}/${module}`,
          icon: null
        })
        
        // Analizar ruta adicional si existe
        const { rest } = parseVerticalRoute(pathname)
        
        if (rest) {
          // Dividir en partes y agregar cada nivel
          const parts = rest.split('/')
          let currentPath = `/vertical-${vertical}/${module}`
          
          parts.forEach((part, index) => {
            // Agregar solo si no es vacío
            if (part) {
              currentPath += `/${part}`
              
              // Convertir a formato más legible (camelCase o snake_case a palabras)
              const label = part
                .replace(/_/g, ' ')
                .replace(/([A-Z])/g, ' $1')
                .replace(/^\w/, c => c.toUpperCase())
              
              items.push({
                label,
                href: currentPath,
                icon: null
              })
            }
          })
        }
      }
    }
    
    return items
  }, [pathname, currentRoute, showHome, parseVerticalRoute])
  
  // No mostrar nada si no hay items
  if (breadcrumbItems.length <= 1) return null
  
  return (
    <nav className={`flex items-center text-sm text-gray-500 dark:text-gray-400 ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center flex-wrap">
        {breadcrumbItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
            )}
            
            {index === breadcrumbItems.length - 1 ? (
              // Último item (actual) - no es un enlace
              <span className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                {item.icon && <span className="mr-1">{item.icon}</span>}
                {item.label}
              </span>
            ) : (
              // Item con enlace
              <Link 
                href={item.href}
                className="hover:text-primary-600 dark:hover:text-primary-400 flex items-center"
              >
                {item.icon && <span className="mr-1">{item.icon}</span>}
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
