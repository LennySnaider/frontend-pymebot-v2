'use client';

/**
 * frontend/src/components/shared/safe-components/SafeHydration.tsx
 * Componente base para prevenir errores de hidratación con renderizado exclusivo del lado del cliente.
 * Este componente soluciona problemas de inconsistencias entre el renderizado del servidor y el cliente.
 * @version 2.0.0
 * @updated 2025-04-30
 */

import { useState, useEffect, ReactNode, ElementType } from 'react';

export type FallbackType = 'skeleton' | 'empty' | 'custom';

export interface SafeHydrationProps {
  /** El contenido que será renderizado solo del lado del cliente */
  children: ReactNode;
  
  /** Contenido a mostrar mientras se espera la hidratación */
  fallback?: ReactNode;
  
  /** Tipo de fallback a mostrar (skeleton, empty, custom) */
  fallbackType?: FallbackType;
  
  /** Componente skeleton a usar (si fallbackType es 'skeleton') */
  SkeletonComponent?: ElementType;
  
  /** Props para pasar al componente skeleton */
  skeletonProps?: Record<string, any>;
  
  /** Clase CSS para el contenedor del fallback */
  fallbackClassName?: string;
  
  /** Si es true, no muestra nada hasta que esté hidratado (útil para componentes pequeños) */
  silent?: boolean;
  
  /** Si es true, espera un tiempo adicional después de la hidratación (útil para data async) */
  delay?: number;
  
  /** Función a ejecutar cuando el componente esté hidratado */
  onHydrated?: () => void;
  
  /** Función para controlar cuándo se considera que la hidratación está completa */
  isReady?: () => boolean;
}

/**
 * Componente que renderiza su contenido solo del lado del cliente para evitar errores
 * de hidratación con componentes que tienen inconsistencias entre servidor y cliente.
 * Soporta diferentes tipos de placeholders durante la carga.
 */
const SafeHydration = ({
  children,
  fallback,
  fallbackType = 'empty',
  SkeletonComponent,
  skeletonProps = {},
  fallbackClassName = '',
  silent = false,
  delay = 0,
  onHydrated,
  isReady,
}: SafeHydrationProps) => {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    // Si hay una condición personalizada para considerar "listo"
    if (isReady && !isReady()) {
      return;
    }
    
    // Simular un pequeño retraso si es necesario (útil para algunos componentes)
    if (delay > 0) {
      const timer = setTimeout(() => {
        setIsMounted(true);
        if (onHydrated) onHydrated();
      }, delay);
      
      return () => clearTimeout(timer);
    } else {
      setIsMounted(true);
      if (onHydrated) onHydrated();
    }
  }, [delay, onHydrated, isReady]);
  
  // Si no está montado, mostrar el fallback apropiado
  if (!isMounted) {
    // Si es silencioso, no mostrar nada
    if (silent) {
      return null;
    }
    
    // Si hay un fallback personalizado
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Si es de tipo skeleton y se proporciona un componente
    if (fallbackType === 'skeleton' && SkeletonComponent) {
      return <SkeletonComponent {...skeletonProps} className={fallbackClassName} />;
    }
    
    // Si es empty o cualquier otro caso no manejado
    if (fallbackType === 'empty' || !fallbackType) {
      if (fallbackClassName) {
        return <div className={fallbackClassName} />;
      }
      return null;
    }
    
    // Fallback por defecto para cualquier otro caso
    return null;
  }
  
  // Renderizar los children cuando el componente está hidratado
  return <>{children}</>;
};

export default SafeHydration;
