/**
 * frontend/src/contexts/VerticalContext.tsx
 * Contexto para compartir estado entre componentes de una vertical.
 * Permite compartir datos, configuraciones y estado específico de cada vertical.
 * @version 2.0.0
 * @updated 2025-04-30
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useVerticalRegistry } from '@/lib/core/verticalRegistry';
import { useTenantStore } from '@/stores/core/tenantStore';
import verticalsService from '@/services/core/verticalsService';

// Tipos de datos para el contexto
export interface VerticalContextData {
  // Información básica de la vertical
  verticalCode: string;
  verticalName: string;
  verticalIcon: string;
  
  // Nuevo: Información de tipo de vertical
  typeCode?: string;
  typeName?: string;
  typeIcon?: string;
  
  // Estado de carga
  isLoading: boolean;
  error: Error | null;
  
  // Funciones de utilidad
  setContextValue: <T>(key: string, value: T) => void;
  getContextValue: <T>(key: string) => T | undefined;
  clearContextValues: () => void;
  
  // Verificación de permisos y acceso
  hasModuleAccess: (moduleCode: string) => boolean;
  
  // Para guardar estado compartido entre componentes
  contextValues: Record<string, any>;
}

// Interfaz para el proveedor
interface VerticalProviderProps {
  children: React.ReactNode;
  verticalCode: string;
  typeCode?: string; // Nuevo: código del tipo de vertical (opcional)
}

// Contexto con valores por defecto
const VerticalContext = createContext<VerticalContextData>({
  verticalCode: '',
  verticalName: '',
  verticalIcon: '',
  typeCode: undefined,
  typeName: undefined,
  typeIcon: undefined,
  isLoading: true,
  error: null,
  setContextValue: () => {},
  getContextValue: () => undefined,
  clearContextValues: () => {},
  hasModuleAccess: () => false,
  contextValues: {}
});

/**
 * Proveedor del contexto para una vertical específica
 */
export function VerticalProvider({ children, verticalCode, typeCode }: VerticalProviderProps) {
  // Acceso al registro de verticales
  const verticalRegistry = useVerticalRegistry();
  
  // Acceso al tenant actual
  const { currentTenant } = useTenantStore();
  
  // Estado interno del contexto
  const [verticalName, setVerticalName] = useState<string>('');
  const [verticalIcon, setVerticalIcon] = useState<string>('');
  const [typeName, setTypeName] = useState<string | undefined>(undefined);
  const [typeIcon, setTypeIcon] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [contextValues, setContextValues] = useState<Record<string, any>>({});
  const [moduleAccess, setModuleAccess] = useState<Record<string, boolean>>({});
  
  // Cargar información de la vertical
  useEffect(() => {
    async function loadVerticalInfo() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Intentar obtener del registro primero
        const registeredVertical = verticalRegistry.getVertical(verticalCode);
        
        if (registeredVertical) {
          setVerticalName(registeredVertical.name);
          setVerticalIcon(registeredVertical.icon);
          
          // Si se especifica un tipo, cargar también su información
          if (typeCode && registeredVertical.types) {
            const verticalType = registeredVertical.types.find(t => t.code === typeCode);
            if (verticalType) {
              setTypeName(verticalType.name);
              setTypeIcon(verticalType.icon);
            } else {
              console.warn(`Tipo ${typeCode} no encontrado en la vertical ${verticalCode}`);
            }
          }
          
          setIsLoading(false);
          return;
        }
        
        // Si no está en el registro, obtener desde el servicio
        const vertical = await verticalsService.getVertical(verticalCode);
        
        if (vertical) {
          setVerticalName(vertical.name);
          setVerticalIcon(vertical.icon);
          
          // Si se especifica un tipo, intentar obtenerlo
          if (typeCode) {
            try {
              // Aquí debería haber una llamada al servicio para obtener el tipo
              // Por ahora simulamos con valores predeterminados
              const typeInfo = {
                name: `${vertical.name} - ${typeCode}`,
                icon: vertical.icon
              };
              
              setTypeName(typeInfo.name);
              setTypeIcon(typeInfo.icon);
            } catch (typeError) {
              console.warn(`Error cargando información del tipo ${typeCode}:`, typeError);
            }
          }
          
          // Registrar en el registro para futuras consultas
          verticalRegistry.register({
            id: vertical.id,
            name: vertical.name,
            code: vertical.code,
            description: vertical.description,
            icon: vertical.icon,
            enabled: vertical.enabled,
            category: vertical.category,
            order: vertical.order,
            features: vertical.features,
            components: {}
          });
        } else {
          throw new Error(`Vertical no encontrada: ${verticalCode}`);
        }
        
      } catch (error) {
        console.error(`Error cargando información de vertical ${verticalCode}:`, error);
        setError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        setIsLoading(false);
      }
    }
    
    if (verticalCode) {
      loadVerticalInfo();
    }
  }, [verticalCode, verticalRegistry]);
  
  // Cargar permisos de módulos
  useEffect(() => {
    async function loadModuleAccess() {
      if (!currentTenant?.id || !verticalCode) return;
      
      try {
        const { data: modules } = await verticalsService.getModules(verticalCode);
        
        // Crear mapa de acceso a módulos
        const moduleAccessMap: Record<string, boolean> = {};
        
        // Verificar qué módulos están disponibles en el plan
        for (const module of modules) {
          // En una implementación real, esto se conectaría con el servicio de permisos
          // para verificar si el tenant tiene acceso al módulo según su plan
          
          // Por ahora, todos se consideran accesibles para desarrollo
          moduleAccessMap[module.code] = true;
        }
        
        setModuleAccess(moduleAccessMap);
      } catch (error) {
        console.error(`Error cargando acceso a módulos para ${verticalCode}:`, error);
      }
    }
    
    loadModuleAccess();
  }, [verticalCode, currentTenant?.id]);
  
  // Función para establecer valor en el contexto
  const setContextValue = useCallback(<T,>(key: string, value: T) => {
    setContextValues(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);
  
  // Función para obtener valor del contexto
  const getContextValue = useCallback(<T,>(key: string): T | undefined => {
    return contextValues[key] as T | undefined;
  }, [contextValues]);
  
  // Función para limpiar valores del contexto
  const clearContextValues = useCallback(() => {
    setContextValues({});
  }, []);
  
  // Verificar acceso a un módulo
  const hasModuleAccess = useCallback((moduleCode: string): boolean => {
    return moduleAccess[moduleCode] || false;
  }, [moduleAccess]);
  
  // Limpiar contexto al cambiar de vertical
  useEffect(() => {
    return () => {
      clearContextValues();
    };
  }, [verticalCode, clearContextValues]);
  
  // Objeto de contexto con valores y funciones
  const contextValue: VerticalContextData = {
    verticalCode,
    verticalName,
    verticalIcon,
    typeCode,
    typeName,
    typeIcon,
    isLoading,
    error,
    setContextValue,
    getContextValue,
    clearContextValues,
    hasModuleAccess,
    contextValues
  };
  
  return (
    <VerticalContext.Provider value={contextValue}>
      {children}
    </VerticalContext.Provider>
  );
}

/**
 * Hook para usar el contexto de vertical en componentes
 */
export function useVerticalContext() {
  const context = useContext(VerticalContext);
  
  if (!context) {
    throw new Error('useVerticalContext debe usarse dentro de un VerticalProvider');
  }
  
  return context;
}

export default VerticalContext;