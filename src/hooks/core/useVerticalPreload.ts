/**
 * frontend/src/hooks/core/useVerticalPreload.ts
 * Hook para precargar componentes de verticales.
 * Mejora la experiencia de usuario precargando componentes frecuentes.
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client';

import { useEffect, useState } from 'react';
import { useVerticalModule } from './useVerticalModule';
import { useVerticalRegistry } from '@/lib/core/verticalRegistry';
import verticalInitService from '@/services/core/verticalInitService';

/**
 * Mapa de componentes a precargar por vertical
 * Cada vertical puede definir qué componentes precargar
 */
const PRELOAD_CONFIGS: Record<string, string[]> = {
  // Medicina
  medicina: [
    'Dashboard',
    'PatientCard',
    'AppointmentScheduler'
  ],
  // Salón de belleza
  salon: [
    'Dashboard',
    'ClientCard',
    'ServiceList'
  ],
  // Bienes raíces
  bienes_raices: [
    'Dashboard',
    'PropertyCard',
    'PropertyFinder'
  ],
};

/**
 * Hook para precargar componentes frecuentes de una vertical
 * @param verticalCode Código de la vertical a precargar
 * @param customComponents Componentes específicos a precargar (opcionales)
 */
export function useVerticalPreload(
  verticalCode: string, 
  customComponents?: string[]
) {
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  
  // Determinar componentes a precargar
  useEffect(() => {
    async function preloadComponents() {
      if (!verticalCode || isComplete || isLoading) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Verificar si la vertical ya está inicializada
        if (!verticalInitService.isInitialized(verticalCode)) {
          // Inicializar vertical primero
          await verticalInitService.initializeVertical(verticalCode);
        }
        
        // Componentes a precargar (default o personalizados)
        const componentList = customComponents || PRELOAD_CONFIGS[verticalCode] || [];
        
        if (componentList.length === 0) {
          setIsComplete(true);
          setProgress(100);
          return;
        }
        
        let loaded = 0;
        
        // Precargar todos los componentes en paralelo
        await Promise.all(
          componentList.map(async (componentName) => {
            try {
              // Usar hook de carga con warm=true para solo cachear sin renderizar
              useVerticalModule(verticalCode, componentName, { warm: true });
              
              // Actualizar progreso
              loaded++;
              setProgress(Math.round((loaded / componentList.length) * 100));
            } catch (err) {
              // Error en un componente no detiene el proceso
              console.warn(`Error precargando ${componentName}:`, err);
            }
          })
        );
        
        setIsComplete(true);
      } catch (err) {
        console.error('Error en precarga de componentes:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }
    
    // Iniciar precarga
    preloadComponents();
    
    // Limpiar al desmontar
    return () => {
      if (isLoading) {
        // No hay forma real de cancelar las cargas, pero marcamos como no en progreso
        setIsLoading(false);
      }
    };
  }, [verticalCode, customComponents, isComplete, isLoading]);
  
  return {
    isLoading,
    isComplete,
    progress,
    error
  };
}

export default useVerticalPreload;