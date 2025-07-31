/**
 * frontend/src/app/(protected-pages)/vertical-[verticalCode]/[moduleCode]/not-found.tsx
 * Página de error cuando no se encuentra un módulo dentro de una vertical.
 * Se muestra cuando se intenta acceder a un módulo que no existe o no está disponible.
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { 
  AlertCircle, 
  ArrowLeft,
  PackageSearch
} from 'lucide-react'
import useVerticalRoutes from '@/hooks/core/useVerticalRoutes'
import { Button } from '@/components/ui/button'

/**
 * Página de error cuando un módulo no existe o no está disponible
 * Muestra:
 * - Mensaje de error claro
 * - Opciones de navegación alternativas
 * - Enlaces a módulos disponibles en la vertical
 */
export default function ModuleNotFound() {
  const params = useParams()
  const { verticalCode, moduleCode } = params
  const { verticalsService, modules, loadModules } = useVerticalRoutes()
  
  const [verticalName, setVerticalName] = useState('')
  const [availableModules, setAvailableModules] = useState<any[]>([])
  
  // Cargar información de la vertical y módulos disponibles
  useEffect(() => {
    const loadVerticalInfo = async () => {
      if (!verticalCode) return
      
      try {
        // Obtener información de la vertical
        const vertical = await verticalsService.getVertical(verticalCode as string)
        setVerticalName(vertical.name)
        
        // Cargar módulos disponibles
        if (!modules[verticalCode as string]) {
          await loadModules(verticalCode as string)
        }
        
        // Filtrar módulos habilitados de nivel superior
        const enabledModules = modules[verticalCode as string]?.filter(m => 
          m.enabled && !m.parentId
        ) || []
        
        setAvailableModules(enabledModules)
      } catch (error) {
        console.error('Error cargando información de la vertical:', error)
      }
    }
    
    loadVerticalInfo()
  }, [verticalCode, moduleCode, verticalsService, modules, loadModules])
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
            <h1 className="text-2xl font-bold text-red-700 dark:text-red-300">
              Módulo no encontrado
            </h1>
          </div>
          <p className="text-red-600 dark:text-red-300">
            El módulo <span className="font-semibold">{moduleCode as string}</span> no existe o no está disponible
            en la vertical <span className="font-semibold">{verticalName || verticalCode as string}</span>.
          </p>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2">Módulos disponibles en esta vertical</h2>
            
            {availableModules.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                {availableModules.map(module => (
                  <Link 
                    key={module.id}
                    href={`/vertical-${verticalCode}/${module.code}`}
                    className="p-3 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="font-medium">{module.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {module.description?.substring(0, 30)}
                      {module.description?.length > 30 ? '...' : ''}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                <PackageSearch className="h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No hay módulos disponibles en esta vertical</p>
              </div>
            )}
          </div>
          
          <div className="flex gap-4 mt-8">
            <Button
              asChild
              variant="plain"
            >
              <Link href={`/vertical-${verticalCode}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a la vertical
              </Link>
            </Button>
            
            <Button
              asChild
            >
              <Link href="/home">
                Ir al Inicio
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
