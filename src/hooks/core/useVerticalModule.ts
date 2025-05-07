/**
 * frontend/src/hooks/core/useVerticalModule.ts
 * Hook principal para la carga dinámica de módulos y componentes por vertical.
 * Permite cargar componentes bajo demanda según la vertical seleccionada con gestión de caché y errores.
 * @version 2.0.0
 * @updated 2025-04-30
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useVerticalRegistry } from '@/lib/core/verticalRegistry';
import { useTenantStore } from '@/stores/core/tenantStore';

// Tipos para los estados de carga del módulo
export type ModuleLoadingState = 'idle' | 'loading' | 'loaded' | 'error';

// Opciones para la carga de módulos
export interface VerticalModuleOptions {
  // Número máximo de reintentos en caso de error
  maxRetries?: number;
  
  // Tiempo de espera en ms para cada intento
  retryTimeout?: number;
  
  // Si se debe precalientar el módulo (precarga)
  warm?: boolean;
  
  // Callback a ejecutar cuando el componente se carga
  onLoad?: () => void;
  
  // Callback a ejecutar en caso de error
  onError?: (error: Error) => void;
  
  // Versión específica del módulo (para control de versiones)
  version?: string;
  
  // Si el comportamiento es estricto (error si no existe el módulo)
  strict?: boolean;
  
  // Nuevo: Código del tipo específico de vertical a usar
  typeCode?: string;
}

// Mapeo de módulos en caché
const moduleCache = new Map<string, {
  Component: React.ComponentType<any>;
  loadedAt: Date;
  version?: string;
  typeCode?: string; // Nuevo: Guardar tipo de vertical en caché
}>();

/**
 * Hook para cargar módulos específicos de una vertical de forma dinámica
 * @param verticalCode - Código de la vertical (ej: 'medicina', 'restaurante')
 * @param moduleName - Nombre del módulo o componente a cargar
 * @param options - Opciones de configuración para la carga
 * @returns Estado de carga, componente, error y funciones de utilidad
 */
export function useVerticalModule<T = any>(
  verticalCode: string,
  moduleName: string,
  options: VerticalModuleOptions = {}
) {
  // Extraer opciones con valores por defecto
  const {
    maxRetries = 3,
    retryTimeout = 1000,
    warm = false,
    onLoad,
    onError,
    version,
    strict = false,
    typeCode, // Nuevo: código del tipo de vertical
  } = options;
  
  // Estado del componente cargado
  const [Component, setComponent] = useState<React.ComponentType<T> | null>(null);
  
  // Estado de carga
  const [loadingState, setLoadingState] = useState<ModuleLoadingState>('idle');
  
  // Error en caso de fallo
  const [error, setError] = useState<Error | null>(null);
  
  // Contador de intentos
  const retryCount = useRef(0);
  
  // Referencia al temporizador para limpiar
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Acceso al registro de verticales
  const verticalRegistry = useVerticalRegistry();
  
  // Acceso al tenant actual
  const { currentTenant } = useTenantStore();
  
  // Clave única para este módulo (para caché)
  const cacheKey = `${verticalCode}:${moduleName}${version ? `:${version}` : ''}${typeCode ? `:${typeCode}` : ''}`;
  
  // Verificar si el tenant actual tiene acceso a esta vertical
  const hasAccess = useRef(false);
  
  // Función para verificar si el tenant tiene acceso a la vertical
  const checkAccess = () => {
    if (!currentTenant) return false;
    
    // En una implementación real, se verificaría contra los permisos del tenant
    // Por ahora devolvemos true para desarrollo
    return true;
  };
  
  // Cargar componente con manejo de caché y errores
  const loadComponent = async () => {
    try {
      // Verificar si ya está en caché
      if (moduleCache.has(cacheKey)) {
        const cached = moduleCache.get(cacheKey);
        setComponent(cached?.Component as React.ComponentType<T>);
        setLoadingState('loaded');
        onLoad?.();
        return;
      }
      
      // Verificar acceso
      hasAccess.current = checkAccess();
      if (!hasAccess.current) {
        throw new Error(`No tienes acceso a la vertical ${verticalCode}`);
      }
      
      // Cambiar estado a cargando
      setLoadingState('loading');
      
      // Intentar obtener desde el registro (para componentes registrados en memoria)
      const vertical = verticalRegistry.getVertical(verticalCode);
      
      if (vertical) {
        let componentToUse: React.ComponentType<any> | undefined;
        
        // Si se especifica un tipo, intentar obtener componente específico
        if (typeCode) {
          componentToUse = verticalRegistry.getTypeComponent(verticalCode, typeCode, moduleName);
        } else {
          // Usar componente base de la vertical
          componentToUse = vertical.components?.[moduleName];
        }
        
        if (componentToUse) {
          // Componente encontrado en registro
          
          // Guardar en caché
          moduleCache.set(cacheKey, {
            Component: componentToUse,
            loadedAt: new Date(),
            version,
            typeCode
          });
          
          // Actualizar estado
          setComponent(componentToUse as React.ComponentType<T>);
          setLoadingState('loaded');
          onLoad?.();
          return;
        }
      }
      
      // No está en registro, intentar cargar dinámicamente
      // Esta parte variará según la estructura real de directorios y la configuración de importación dinámica
      try {
        let importedComponent;
        
        // Intentar cargar desde la carpeta de tipos si se especifica un tipo
        if (typeCode) {
          try {
            // Primero intentamos cargar desde la carpeta del tipo
            const importedTypeModule = await import(`@/components/verticals/${verticalCode}/types/${typeCode}/${moduleName}`);
            importedComponent = importedTypeModule.default;
          } catch (typeError) {
            // Si falla, intentar cargar desde la carpeta base (componente compartido)
            const importedBaseModule = await import(`@/components/verticals/${verticalCode}/${moduleName}`);
            importedComponent = importedBaseModule.default;
          }
        } else {
          // Sin tipo específico, cargar desde la carpeta base
          const importedModule = await import(`@/components/verticals/${verticalCode}/${moduleName}`);
          importedComponent = importedModule.default;
        }
        
        if (!importedComponent && strict) {
          throw new Error(`Componente ${moduleName} no encontrado en vertical ${verticalCode}${typeCode ? ` (tipo ${typeCode})` : ''}`);
        }
        
        // Guardar en caché
        moduleCache.set(cacheKey, {
          Component: importedComponent,
          loadedAt: new Date(),
          version,
          typeCode
        });
        
        // Actualizar estado
        setComponent(importedComponent as React.ComponentType<T>);
        setLoadingState('loaded');
        onLoad?.();
      } catch (dynamicError) {
        console.error('Error cargando componente dinámicamente:', dynamicError);
        
        // Si llegamos al máximo de reintentos, reportar error
        if (retryCount.current >= maxRetries) {
          throw new Error(`Error cargando ${moduleName} después de ${maxRetries} intentos: ${dynamicError}`);
        }
        
        // Incrementar contador de reintentos
        retryCount.current += 1;
        
        // Programar reintento
        timerRef.current = setTimeout(loadComponent, retryTimeout);
      }
    } catch (err) {
      console.error('Error en useVerticalModule:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoadingState('error');
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  };
  
  // Recargar componente manualmente (útil tras errores)
  const reload = () => {
    retryCount.current = 0;
    setError(null);
    setLoadingState('idle');
    loadComponent();
  };
  
  // Limpiar caché del módulo
  const clearCache = () => {
    moduleCache.delete(cacheKey);
    reload();
  };
  
  // Efecto principal para cargar el componente
  useEffect(() => {
    // Salir temprano si no hay código de vertical o nombre de módulo
    if (!verticalCode || !moduleName) {
      setError(new Error('Se requiere código de vertical y nombre de módulo'));
      setLoadingState('error');
      return;
    }
    
    // Precalentar sólo realiza la carga, no actualiza estado
    if (warm) {
      // Verificar si ya está en caché
      if (!moduleCache.has(cacheKey)) {
        loadComponent().catch(console.error);
      }
      return;
    }
    
    // Carga normal
    loadComponent();
    
    // Limpieza de timers
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [verticalCode, moduleName, version, warm, strict]);
  
  // Utilidades adicionales
  const utils = {
    // Verificar si el componente está en caché
    isCached: () => moduleCache.has(cacheKey),
    
    // Obtener fecha de última carga
    getLastLoadedAt: () => moduleCache.get(cacheKey)?.loadedAt,
    
    // Recargar forzando ignorar caché
    forceReload: () => {
      clearCache();
    },
    
    // Verificar acceso a la vertical/módulo
    hasAccess: () => hasAccess.current,
  };
  
  return {
    Component,
    loading: loadingState === 'loading',
    loaded: loadingState === 'loaded',
    error,
    loadingState,
    reload,
    clearCache,
    ...utils
  };
}

/**
 * Hook para precargar varios módulos de una vertical
 * @param verticalCode Código de la vertical
 * @param moduleNames Lista de nombres de módulos a precargar
 */
export function usePreloadVerticalModules(
  verticalCode: string,
  moduleNames: string[]
) {
  useEffect(() => {
    moduleNames.forEach(moduleName => {
      // Para cada módulo, usamos el hook principal con opción de precalentamiento
      useVerticalModule(verticalCode, moduleName, { warm: true });
    });
  }, [verticalCode, moduleNames]);
}

/**
 * Función utilitaria para limpiar toda la caché de módulos
 * útil para pruebas o reinicio de aplicación
 */
export function clearModuleCache() {
  moduleCache.clear();
}

export function useVerticalComponentWithType<T = any>(
  verticalCode: string,
  typeCode: string | undefined,
  moduleName: string,
  options: Omit<VerticalModuleOptions, 'typeCode'> = {}
) {
  // Fusionar opciones con el tipo
  const fullOptions: VerticalModuleOptions = {
    ...options,
    typeCode
  };
  
  // Usar el hook principal con el tipo incluido
  return useVerticalModule<T>(verticalCode, moduleName, fullOptions);
}

export default useVerticalModule;