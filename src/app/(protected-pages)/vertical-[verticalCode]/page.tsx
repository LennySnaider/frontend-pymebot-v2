/**
 * frontend/src/app/(protected-pages)/vertical-[verticalCode]/page.tsx
 * Página de inicio genérica para todas las verticales.
 * Muestra un dashboard con los módulos disponibles y accesos rápidos.
 * @version 2.0.0
 * @updated 2025-04-30
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { 
  LayoutGrid, 
  Users, 
  Calendar, 
  ShoppingBag,
  FileText,
  BarChart,
  Settings,
  Clock,
  ExternalLink
} from 'lucide-react'
import useVerticalRoutes from '@/hooks/core/useVerticalRoutes'
import { VerticalModule } from '@/services/core/verticalsService'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/cards'

/**
 * Página principal de una vertical - Dashboard
 * Muestra:
 * - Resumen de la vertical
 * - Módulos disponibles como cards
 * - Accesos rápidos a funciones principales
 * - Estadísticas resumen (si están disponibles)
 */
export default function VerticalDashboardPage() {
  const params = useParams()
  const verticalCode = params.verticalCode as string
  const { verticalsService, modules, loadModules } = useVerticalRoutes()
  
  const [vertical, setVertical] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [featuredModules, setFeaturedModules] = useState<VerticalModule[]>([])
  
  // Cargar información de la vertical
  useEffect(() => {
    const loadVerticalData = async () => {
      setLoading(true)
      try {
        // Cargar datos de la vertical
        const verticalData = await verticalsService.getVertical(verticalCode)
        setVertical(verticalData)
        
        // Cargar módulos si no están en caché
        if (!modules[verticalCode]) {
          await loadModules(verticalCode)
        }
        
        // Seleccionar módulos destacados para mostrar en el dashboard
        // En producción, esto podría basarse en uso frecuente, configuración, etc.
        const modulesList = modules[verticalCode] || []
        
        // Filtrar solo los principales y ordenar por prioridad
        const main = modulesList
          .filter(m => !m.parentId && m.enabled)
          .sort((a, b) => (a.order || 100) - (b.order || 100))
          .slice(0, 6) // Tomar los primeros 6
        
        setFeaturedModules(main)
      } catch (error) {
        console.error(`Error cargando información de vertical ${verticalCode}:`, error)
      } finally {
        setLoading(false)
      }
    }
    
    if (verticalCode) {
      loadVerticalData()
    }
  }, [verticalCode, verticalsService, modules, loadModules])
  
  // Obtener icono para un módulo
  const getModuleIcon = (moduleCode: string) => {
    // En producción, esto podría ser más avanzado, con iconos específicos por módulo
    const iconMap: Record<string, React.ReactNode> = {
      'patients': <Users className="h-6 w-6" />,
      'pacientes': <Users className="h-6 w-6" />,
      'clientes': <Users className="h-6 w-6" />,
      'clients': <Users className="h-6 w-6" />,
      'appointments': <Calendar className="h-6 w-6" />,
      'citas': <Calendar className="h-6 w-6" />,
      'products': <ShoppingBag className="h-6 w-6" />,
      'productos': <ShoppingBag className="h-6 w-6" />,
      'servicios': <Clock className="h-6 w-6" />,
      'services': <Clock className="h-6 w-6" />,
      'documents': <FileText className="h-6 w-6" />,
      'documentos': <FileText className="h-6 w-6" />,
      'reports': <BarChart className="h-6 w-6" />,
      'reportes': <BarChart className="h-6 w-6" />,
      'settings': <Settings className="h-6 w-6" />,
      'configuracion': <Settings className="h-6 w-6" />
    }
    
    return iconMap[moduleCode] || <LayoutGrid className="h-6 w-6" />
  }
  
  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Cargando información de la vertical...</p>
        </div>
      </div>
    )
  }
  
  // Mostrar error si no se encuentra la vertical
  if (!vertical) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center max-w-md">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full inline-flex mb-4">
            <ExternalLink className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Vertical no encontrada</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No se pudo encontrar información para la vertical <span className="font-medium">{verticalCode}</span>.
          </p>
          <Link 
            href="/home" 
            className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <header className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-2">{vertical.name}</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {vertical.description || `Dashboard de gestión para ${vertical.name}`}
        </p>
      </header>
      
      {/* Módulos principales */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium px-1">Módulos disponibles</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredModules.length > 0 ? (
            featuredModules.map(module => (
              <Link key={module.id} href={`/vertical-${verticalCode}/${module.code}`}>
                <Card className="cursor-pointer h-full transition-all hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{module.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {module.description || `Gestión de ${module.name.toLowerCase()}`}
                        </CardDescription>
                      </div>
                      <div className="bg-primary-50 dark:bg-primary-900/20 p-2 rounded-lg text-primary-500 dark:text-primary-400">
                        {getModuleIcon(module.code)}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <LayoutGrid className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="mb-1">No hay módulos disponibles para esta vertical</p>
              <p className="text-sm">Contacta con el administrador para más información</p>
            </div>
          )}
        </div>
      </section>
      
      {/* Información adicional */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Accesos rápidos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>
                <Link href={`/vertical-${verticalCode}/settings`} className="flex items-center text-primary-500 hover:underline">
                  <Settings className="h-4 w-4 mr-2" />
                  <span>Configuración</span>
                </Link>
              </li>
              <li>
                <Link href="/app/help" className="flex items-center text-primary-500 hover:underline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  <span>Ayuda y soporte</span>
                </Link>
              </li>
            </ul>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Información de la vertical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Nombre:</span>
                <span className="font-medium">{vertical.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Código:</span>
                <span className="font-medium">{vertical.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Categoría:</span>
                <span className="font-medium">{vertical.category || 'General'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Número de módulos:</span>
                <span className="font-medium">{modules[verticalCode]?.length || '0'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
