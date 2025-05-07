/**
 * frontend/src/hooks/core/useVerticalRoutes.ts
 * Hook para manejo y resolución de rutas dinámicas para verticales.
 * Proporciona utilidades para la navegación entre verticales y módulos,
 * validación de rutas y gestión de permisos.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import { useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState, useEffect, useCallback } from 'react'
import useTenantStore from '@/stores/core/tenantStore'
import { verticalsService, type Vertical, type VerticalModule } from '@/services/core/verticalsService'

interface VerticalModuleRoute {
  vertical: string;
  verticalName: string;
  module?: string;
  moduleName?: string;
  path: string;
  isValid: boolean;
  hasAccess: boolean;
  isEnabled: boolean;
}

/**
 * Hook para manejar rutas y navegación entre verticales/módulos
 * Proporciona utilidades para:
 * - Analizar rutas actuales
 * - Verificar acceso a verticales/módulos
 * - Generar URLs para navegación
 * - Validar rutas
 */
export function useVerticalRoutes() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const { currentTenant, hasAccess } = useTenantStore()
  
  const [currentRoute, setCurrentRoute] = useState<VerticalModuleRoute | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [verticals, setVerticals] = useState<Vertical[]>([])
  const [modules, setModules] = useState<Record<string, VerticalModule[]>>({})
  
  // Expresión regular para analizar rutas de verticales
  const verticalPathPattern = /^\/(?:app\/)?(?:\(protected-pages\)\/)?vertical-([a-z0-9_]+)(?:\/(.*))?$/i
  
  /**
   * Analiza una ruta y extrae información de vertical/módulo
   */
  const parseVerticalRoute = useCallback((path: string): { vertical?: string; module?: string; rest?: string } => {
    const match = path.match(verticalPathPattern)
    if (!match) return {}
    
    const [, vertical, rest] = match
    const parts = rest ? rest.split('/') : []
    const module = parts.length > 0 ? parts[0] : undefined
    const restPath = parts.length > 1 ? parts.slice(1).join('/') : undefined
    
    return { vertical, module, rest: restPath }
  }, [verticalPathPattern])
  
  /**
   * Verifica si una ruta de vertical/módulo es válida y accesible
   */
  const validateRoute = useCallback(async (
    verticalCode: string, 
    moduleCode?: string
  ): Promise<{
    isValid: boolean;
    hasAccess: boolean;
    isEnabled: boolean;
    verticalName: string;
    moduleName?: string;
  }> => {
    try {
      // Verificar si la vertical existe
      let verticalExists = false
      let verticalName = ''
      let moduleName = ''
      
      try {
        // Intentar obtener información de la vertical
        const vertical = await verticalsService.getVertical(verticalCode)
        verticalExists = true
        verticalName = vertical.name
      } catch (error) {
        console.error(`Vertical ${verticalCode} no encontrada:`, error)
        verticalExists = false
      }
      
      // Si no existe la vertical, no es válida
      if (!verticalExists) {
        return {
          isValid: false,
          hasAccess: false,
          isEnabled: false,
          verticalName: verticalCode // Nombre por defecto si no se encuentra
        }
      }
      
      // Verificar si tiene acceso a la vertical
      const hasVerticalAccess = hasAccess(verticalCode, true)
      
      // Si no tiene módulo específico, solo validar la vertical
      if (!moduleCode) {
        return {
          isValid: verticalExists,
          hasAccess: hasVerticalAccess,
          isEnabled: true, // Asumimos que si existe está habilitada
          verticalName
        }
      }
      
      // Verificar si el módulo existe y tiene acceso
      let moduleExists = false
      let isModuleEnabled = false
      let hasModuleAccess = false
      
      try {
        // Obtener módulos de la vertical
        const { data: modulesList } = await verticalsService.getModules(verticalCode)
        
        // Buscar el módulo específico
        const moduleInfo = modulesList.find(m => m.code === moduleCode)
        
        if (moduleInfo) {
          moduleExists = true
          moduleName = moduleInfo.name
          isModuleEnabled = moduleInfo.enabled
          
          // Verificar acceso al módulo (usar la función hasAccess del tenant store)
          // Esto requiere saber el formato correcto de verificación de acceso a módulos
          const moduleAccessKey = `${verticalCode}_${moduleCode}`
          hasModuleAccess = hasAccess(moduleAccessKey)
        }
      } catch (error) {
        console.error(`Error al verificar módulo ${moduleCode} en vertical ${verticalCode}:`, error)
        moduleExists = false
      }
      
      return {
        isValid: verticalExists && moduleExists,
        hasAccess: hasVerticalAccess && hasModuleAccess,
        isEnabled: isModuleEnabled,
        verticalName,
        moduleName
      }
    } catch (error) {
      console.error('Error validando ruta:', error)
      return {
        isValid: false,
        hasAccess: false,
        isEnabled: false,
        verticalName: verticalCode
      }
    }
  }, [hasAccess])
  
  /**
   * Construye una URL para una vertical y módulo específicos
   */
  const buildVerticalUrl = useCallback((vertical: string, module?: string, path?: string): string => {
    let url = `/vertical-${vertical}`
    
    if (module) {
      url += `/${module}`
    }
    
    if (path) {
      // Asegurarse de que la ruta no comience con '/'
      const normalizedPath = path.startsWith('/') ? path.substring(1) : path
      url += `/${normalizedPath}`
    }
    
    return url
  }, [])
  
  /**
   * Navega a una vertical y módulo específicos
   */
  const navigateToVertical = useCallback((
    vertical: string, 
    module?: string, 
    path?: string,
    options?: { replace?: boolean }
  ): void => {
    const url = buildVerticalUrl(vertical, module, path)
    
    if (options?.replace) {
      router.replace(url)
    } else {
      router.push(url)
    }
  }, [router, buildVerticalUrl])
  
  /**
   * Carga las verticales disponibles
   */
  const loadVerticals = useCallback(async () => {
    try {
      const { data } = await verticalsService.getVerticals({ enabled: true })
      setVerticals(data)
    } catch (error) {
      console.error('Error cargando verticales:', error)
    }
  }, [])
  
  /**
   * Carga los módulos de una vertical específica
   */
  const loadModules = useCallback(async (verticalCode: string) => {
    try {
      const { data } = await verticalsService.getModules(verticalCode)
      setModules(prev => ({
        ...prev,
        [verticalCode]: data
      }))
      return data
    } catch (error) {
      console.error(`Error cargando módulos para vertical ${verticalCode}:`, error)
      return []
    }
  }, [])
  
  // Cargar verticales y módulos al iniciar
  useEffect(() => {
    if (status === 'authenticated') {
      loadVerticals()
    }
  }, [status, loadVerticals])
  
  // Analizar ruta actual cuando cambia
  useEffect(() => {
    const analyzeCurrentRoute = async () => {
      if (!pathname) return
      
      setLoading(true)
      
      const { vertical, module } = parseVerticalRoute(pathname)
      
      if (!vertical) {
        setCurrentRoute(null)
        setLoading(false)
        return
      }
      
      // Validar la ruta
      const validation = await validateRoute(vertical, module)
      
      setCurrentRoute({
        vertical,
        verticalName: validation.verticalName,
        module,
        moduleName: validation.moduleName,
        path: pathname,
        isValid: validation.isValid,
        hasAccess: validation.hasAccess,
        isEnabled: validation.isEnabled
      })
      
      // Cargar módulos si es necesario
      if (!modules[vertical]) {
        await loadModules(vertical)
      }
      
      setLoading(false)
    }
    
    analyzeCurrentRoute()
  }, [pathname, parseVerticalRoute, validateRoute, modules, loadModules])
  
  return {
    // Estado
    currentRoute,
    loading,
    verticals,
    modules,
    
    // Funciones para análisis de rutas
    parseVerticalRoute,
    validateRoute,
    
    // Funciones para construcción de rutas
    buildVerticalUrl,
    navigateToVertical,
    
    // Funciones para carga de datos
    loadVerticals,
    loadModules,
    
    // Acceso directo a servicios subyacentes
    verticalsService
  }
}

export default useVerticalRoutes