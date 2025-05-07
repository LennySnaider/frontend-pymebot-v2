'use client';

/**
 * frontend/src/components/shared/safe-components/SafeDynamicContent.tsx
 * Componente seguro para contenido dinámico que podría causar errores de hidratación.
 * Útil para contenido que depende de fecha/hora, locale, o datos aleatorios.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import React, { ReactNode } from 'react';
import SafeHydration from './SafeHydration';

export interface SafeDynamicContentProps {
  /** El contenido dinámico a renderizar */
  children: ReactNode;
  
  /** Contenido estático alternativo para mostrar durante SSR */
  ssrFallback?: ReactNode;
  
  /** Clase CSS para el contenedor del fallback */
  fallbackClassName?: string;
  
  /** Si es true, espera que los datos estén cargados antes de mostrar el contenido */
  waitForData?: boolean;
  
  /** Función que verifica si los datos están listos */
  isDataReady?: () => boolean;
  
  /** Tiempo de espera antes de mostrar el contenido (ms) */
  delay?: number;
  
  /** Tamaño del placeholder (sm, md, lg) */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Componente para renderizar contenido que puede tener diferencias entre
 * el servidor y el cliente debido a fechas, aleatorización, o datos dinámicos.
 */
const SafeDynamicContent: React.FC<SafeDynamicContentProps> = ({
  children,
  ssrFallback,
  fallbackClassName = '',
  waitForData = false,
  isDataReady,
  delay = 0,
  size = 'md',
}) => {
  // Mapear tamaños a clases
  const sizeClasses = {
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-8',
  };
  
  // Crear clases para el placeholder
  const baseClass = `w-full ${sizeClasses[size]} bg-gray-100 dark:bg-gray-700 rounded animate-pulse ${fallbackClassName}`;
  
  // Crear placeholder por defecto si no se proporciona uno
  const defaultFallback = <div className={baseClass}></div>;
  
  // Función para verificar si los datos están listos
  const checkIfReady = waitForData && isDataReady ? isDataReady : () => true;
  
  return (
    <SafeHydration 
      fallback={ssrFallback || defaultFallback}
      delay={delay}
      isReady={checkIfReady}
    >
      {children}
    </SafeHydration>
  );
};

export default SafeDynamicContent;
