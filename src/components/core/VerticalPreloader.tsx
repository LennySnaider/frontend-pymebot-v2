/**
 * frontend/src/components/core/VerticalPreloader.tsx
 * Componente para precargar módulos de una vertical.
 * Mejora rendimiento precargando componentes frecuentes.
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client';

import React, { useEffect } from 'react';
import useVerticalPreload from '@/hooks/core/useVerticalPreload';

interface VerticalPreloaderProps {
  verticalCode: string;
  components?: string[];
  showIndicator?: boolean;
  onComplete?: () => void;
  children?: React.ReactNode;
}

/**
 * Componente que precarga módulos de una vertical para mejorar tiempos de carga
 * Se puede usar en cualquier parte de la aplicación, típicamente en la página principal
 * de cada vertical para precargar componentes comunes.
 */
export default function VerticalPreloader({
  verticalCode,
  components,
  showIndicator = false,
  onComplete,
  children
}: VerticalPreloaderProps) {
  const { isLoading, isComplete, progress, error } = useVerticalPreload(
    verticalCode,
    components
  );
  
  // Notificar cuando se completa la precarga
  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);
  
  return (
    <>
      {/* Mostrar indicador de precarga si está habilitado */}
      {showIndicator && isLoading && (
        <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 shadow-md rounded-md px-3 py-2 text-sm flex items-center space-x-2">
          <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-500 transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-gray-600 dark:text-gray-300">
            Preparando módulos...
          </span>
        </div>
      )}
      
      {/* Propagar cualquier error a la consola */}
      {error && console.error('Error en precarga de vertical:', error)}
      
      {/* Renderizar hijos siempre, la precarga sucede en segundo plano */}
      {children}
    </>
  );
}