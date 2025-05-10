/**
 * frontend/src/hooks/useVertical.ts
 * Hook para acceder y utilizar verticales de negocio.
 * Proporciona funcionalidades para cargar, inicializar y acceder a componentes de verticales.
 * @version 1.0.0
 * @updated 2025-05-07
 */

import { useState, useEffect, useCallback } from 'react';
import { useVerticalRegistry } from '@/lib/core/verticalRegistry';
import { VerticalModule } from '@/types/core/vertical';
import { verticalInitService } from '@/services/core/verticalInitService';
import verticalsService from '@/services/core/verticalsService';
import { useSession } from 'next-auth/react';

// Tipado para los valores de retorno del hook
interface UseVerticalResult {
  // Información básica de la vertical
  vertical: VerticalModule | null;
  // Estado de carga
  loading: boolean;
  // Error en caso de problemas
  error: Error | null;
  // Obtener un componente específico de la vertical
  getComponent: <T = any>(componentName: string) => React.ComponentType<T> | null;
  // Inicializar la vertical (útil para cargar bajo demanda)
  initialize: (options?: { forceRefresh?: boolean; typeCode?: string }) => Promise<boolean>;
  // Verificar si un módulo específico está disponible
  hasModule: (moduleCode: string) => boolean;
  // Verificar si una característica específica está habilitada
  hasFeature: (featureCode: string) => boolean;
}

/**
 * Hook para acceder y gestionar una vertical de negocio específica
 * @param verticalCode Código de la vertical a utilizar
 * @returns Objeto con información y utilidades para la vertical
 */
export function useVertical(verticalCode: string): UseVerticalResult {
  // Estado para el componente
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);
  
  // Acceder al registro de verticales
  const verticalRegistry = useVerticalRegistry();
  
  // Obtener información de sesión para acceso a tenant
  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId as string;
  
  // Obtener la vertical del registro
  const vertical = verticalRegistry.getVertical(verticalCode);
  
  /**
   * Inicializa la vertical si aún no está inicializada
   */
  const initialize = useCallback(async (options: { forceRefresh?: boolean; typeCode?: string } = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      // Inicializar la vertical con el servicio de inicialización
      const success = await verticalInitService.initializeVertical(verticalCode, {
        tenantId,
        forceRefresh: options.forceRefresh,
        typeCode: options.typeCode
      });
      
      if (!success) {
        throw new Error(`No se pudo inicializar la vertical ${verticalCode}`);
      }
      
      setInitialized(true);
      return true;
    } catch (err) {
      console.error(`Error inicializando vertical ${verticalCode}:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    } finally {
      setLoading(false);
    }
  }, [verticalCode, tenantId]);
  
  /**
   * Obtiene un componente específico de la vertical
   */
  const getComponent = useCallback(<T = any>(componentName: string): React.ComponentType<T> | null => {
    if (!vertical || !vertical.components) {
      return null;
    }
    
    return (vertical.components[componentName] as React.ComponentType<T>) || null;
  }, [vertical]);
  
  /**
   * Verifica si un módulo específico está disponible
   */
  const hasModule = useCallback((moduleCode: string): boolean => {
    // En una implementación real, verificaríamos usando permissionsService
    // si el tenant tiene acceso a este módulo específico
    
    // Por ahora, simplificamos a verificar si la vertical tiene esta característica
    return vertical?.features?.includes(moduleCode) || false;
  }, [vertical]);
  
  /**
   * Verifica si una característica específica está habilitada
   */
  const hasFeature = useCallback((featureCode: string): boolean => {
    // Similar a hasModule, pero para características más específicas
    return vertical?.features?.includes(featureCode) || false;
  }, [vertical]);
  
  // Inicializar la vertical al montar el componente
  useEffect(() => {
    if (!initialized && !loading && verticalCode) {
      initialize();
    }
  }, [verticalCode, initialized, loading, initialize]);
  
  return {
    vertical,
    loading,
    error,
    getComponent,
    initialize,
    hasModule,
    hasFeature
  };
}

/**
 * Hook para obtener un componente específico de una vertical
 * @param verticalCode Código de la vertical
 * @param componentName Nombre del componente a obtener
 * @returns Objeto con el componente y estado
 */
export function useVerticalComponent<T = any>(
  verticalCode: string,
  componentName: string
): {
  Component: React.ComponentType<T> | null;
  loading: boolean;
  error: Error | null;
} {
  const { loading, error, getComponent, initialize } = useVertical(verticalCode);
  const [component, setComponent] = useState<React.ComponentType<T> | null>(null);
  
  useEffect(() => {
    // Solo intentar obtener el componente si no estamos cargando
    if (!loading) {
      const comp = getComponent<T>(componentName);
      setComponent(comp);
      
      // Si no encontramos el componente pero la vertical está inicializada,
      // podría ser un problema de registro, intentar reinicializar
      if (!comp && !error) {
        initialize({ forceRefresh: true })
          .then(() => {
            // Intentar obtener el componente nuevamente
            setComponent(getComponent<T>(componentName));
          })
          .catch(err => {
            console.error(`Error al reinicializar vertical para obtener componente:`, err);
          });
      }
    }
  }, [loading, error, componentName, getComponent, initialize]);
  
  return {
    Component: component,
    loading,
    error
  };
}

export default useVertical;