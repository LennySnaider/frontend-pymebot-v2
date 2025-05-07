/**
 * frontend/src/components/core/verticals/VerticalSidebar.tsx
 * Sidebar de navegación para verticales que muestra módulos disponibles
 * para la vertical actual y facilita la navegación entre ellos.
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  ChevronDown, 
  ChevronRight,
  BookOpen,
  Settings,
  Search,
  LogOut
} from 'lucide-react'
import useVerticalRoutes from '@/hooks/core/useVerticalRoutes'
import { VerticalModule } from '@/services/core/verticalsService'
import useTenantStore from '@/stores/core/tenantStore'

interface VerticalSidebarProps {
  className?: string;
  verticalCode?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

/**
 * Barra lateral de navegación para módulos de una vertical
 * - Muestra todos los módulos disponibles para la vertical actual
 * - Resalta el módulo activo
 * - Permite expandir/colapsar secciones
 * - Soporta jerarquía de módulos (con submenús)
 */
export default function VerticalSidebar({
  className = '',
  verticalCode: propVerticalCode,
  collapsed = false,
  onToggleCollapse
}: VerticalSidebarProps) {
  const pathname = usePathname()
  const { parseVerticalRoute, currentRoute, modules, loadModules } = useVerticalRoutes()
  const { hasAccess } = useTenantStore()
  
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({})
  const [modulesList, setModulesList] = useState<VerticalModule[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredModules, setFilteredModules] = useState<VerticalModule[]>([])
  
  // Determinar vertical actual (desde props o desde la ruta)
  const verticalCode = propVerticalCode || currentRoute?.vertical
  
  // Cargar módulos cuando cambia la vertical
  useEffect(() => {
    const fetchModules = async () => {
      if (!verticalCode) return
      
      try {
        // Usar caché si ya tenemos los módulos
        if (modules[verticalCode]) {
          setModulesList(modules[verticalCode])
        } else {
          // Cargar desde API
          const moduleData = await loadModules(verticalCode)
          setModulesList(moduleData)
        }
      } catch (error) {
        console.error('Error cargando módulos para sidebar:', error)
      }
    }
    
    fetchModules()
  }, [verticalCode, modules, loadModules])
  
  // Filtrar módulos cuando cambia la búsqueda
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredModules(modulesList)
      return
    }
    
    const normalizedQuery = searchQuery.toLowerCase().trim()
    
    const filtered = modulesList.filter(module => {
      const nameMatch = module.name.toLowerCase().includes(normalizedQuery)
      const codeMatch = module.code.toLowerCase().includes(normalizedQuery)
      const descMatch = module.description?.toLowerCase().includes(normalizedQuery)
      
      return nameMatch || codeMatch || descMatch
    })
    
    setFilteredModules(filtered)
  }, [searchQuery, modulesList])
  
  // Expandir el módulo actual automáticamente
  useEffect(() => {
    if (!pathname || !verticalCode) return
    
    const { module } = parseVerticalRoute(pathname)
    
    if (module) {
      // Buscar el módulo padre si existe
      const moduleInfo = modulesList.find(m => m.code === module)
      
      if (moduleInfo?.parentId) {
        setExpandedModules(prev => ({
          ...prev,
          [moduleInfo.parentId]: true
        }))
      }
      
      // Expandir el propio módulo si tiene hijos
      const hasChildren = modulesList.some(m => m.parentId === module)
      
      if (hasChildren) {
        setExpandedModules(prev => ({
          ...prev,
          [module]: true
        }))
      }
    }
  }, [pathname, verticalCode, modulesList, parseVerticalRoute])
  
  // Manejar expansión/colapso de módulos
  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }))
  }
  
  // Verificar si un módulo está activo
  const isModuleActive = (moduleCode: string) => {
    if (!pathname || !verticalCode) return false
    
    const { module } = parseVerticalRoute(pathname)
    return module === moduleCode
  }
  
  // Obtener la ruta para un módulo
  const getModuleUrl = (moduleCode: string) => {
    if (!verticalCode) return '#'
    return `/vertical-${verticalCode}/${moduleCode}`
  }
  
  // Renderizar un módulo (y sus hijos si tiene)
  const renderModule = (module: VerticalModule) => {
    // Verificar si tiene acceso al módulo
    const moduleAccessKey = `${verticalCode}_${module.code}`
    const canAccess = hasAccess(moduleAccessKey)
    
    if (!canAccess || !module.enabled) return null
    
    // Buscar hijos
    const children = modulesList.filter(m => m.parentId === module.id)
    const hasChildren = children.length > 0
    const isExpanded = !!expandedModules[module.id]
    const isActive = isModuleActive(module.code)
    
    return (
      <li key={module.id} className="mb-1">
        {/* Módulo principal */}
        <div className="flex flex-col">
          <div className="flex items-center">
            {hasChildren && (
              <button
                onClick={() => toggleModule(module.id)}
                className="p-1 mr-1 text-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
            
            <Link
              href={getModuleUrl(module.code)}
              className={`flex items-center py-2 px-3 rounded-md ${
                isActive
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              } flex-grow transition-colors`}
            >
              {module.icon ? (
                <span className="mr-2">{module.icon}</span>
              ) : (
                <BookOpen className="h-4 w-4 mr-2" />
              )}
              <span>{module.name}</span>
            </Link>
          </div>
          
          {/* Submenú de hijos */}
          {hasChildren && isExpanded && (
            <ul className="pl-8 mt-1 space-y-1">
              {children.map(child => {
                // Verificar si tiene acceso al hijo
                const childAccessKey = `${verticalCode}_${child.code}`
                const canAccessChild = hasAccess(childAccessKey)
                
                if (!canAccessChild || !child.enabled) return null
                
                const isChildActive = isModuleActive(child.code)
                
                return (
                  <li key={child.id}>
                    <Link
                      href={getModuleUrl(child.code)}
                      className={`flex items-center py-2 px-3 rounded-md ${
                        isChildActive
                          ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      } transition-colors`}
                    >
                      <span className="text-sm">{child.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </li>
    )
  }
  
  // Agrupar módulos por categoría
  const groupedModules = filteredModules.reduce<Record<string, VerticalModule[]>>(
    (acc, module) => {
      // Solo incluir módulos de nivel superior (sin padre)
      if (!module.parentId) {
        const category = module.category || 'Sin categoría'
        if (!acc[category]) {
          acc[category] = []
        }
        acc[category].push(module)
      }
      return acc
    },
    {}
  )
  
  // Ordenar categorías y módulos
  const sortedCategories = Object.keys(groupedModules).sort((a, b) => {
    // Poner "Sin categoría" al final
    if (a === 'Sin categoría') return 1
    if (b === 'Sin categoría') return -1
    return a.localeCompare(b)
  })
  
  // Si no hay vertical seleccionada o no hay módulos, mostrar mensaje
  if (!verticalCode || modulesList.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No hay módulos disponibles</p>
        </div>
      </div>
    )
  }
  
  return (
    <aside className={`${className} overflow-hidden flex flex-col h-full`}>
      {/* Barra de búsqueda */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar módulos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent"
          />
        </div>
      </div>
      
      {/* Lista de módulos */}
      <div className="flex-1 overflow-y-auto p-3">
        {sortedCategories.map(category => (
          <div key={category} className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 px-3">
              {category}
            </h3>
            
            <ul className="space-y-1">
              {groupedModules[category]
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map(module => renderModule(module))}
            </ul>
          </div>
        ))}
      </div>
      
      {/* Enlaces útiles fijos al final */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <ul className="space-y-1">
          <li>
            <Link
              href={`/vertical-${verticalCode}/settings`}
              className="flex items-center py-2 px-3 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Settings className="h-4 w-4 mr-2" />
              <span>Configuración</span>
            </Link>
          </li>
          <li>
            <Link
              href="/home"
              className="flex items-center py-2 px-3 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Salir de la vertical</span>
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  )
}
