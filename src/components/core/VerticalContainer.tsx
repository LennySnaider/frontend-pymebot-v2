/**
 * frontend/src/components/core/VerticalContainer.tsx
 * Componente contenedor para verticales de negocio.
 * Proporciona el contexto necesario para renderizar componentes de una vertical específica.
 * @version 1.0.0
 * @updated 2025-05-07
 */

'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useVertical } from '@/hooks/useVertical';
import { VerticalContainerProps } from '@/types/core/vertical';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

/**
 * VerticalContainer - Componente que proporciona el contexto y la lógica para
 * renderizar componentes de una vertical específica.
 */
export default function VerticalContainer({
  verticalCode,
  children,
  className,
  style,
  fallback,
  noFallback = false,
  onLoad,
  onError
}: VerticalContainerProps & {
  fallback?: ReactNode;
  noFallback?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}) {
  // Usar el hook useVertical para obtener la información de la vertical
  const { vertical, loading, error, initialize } = useVertical(verticalCode);
  
  // Estado para controlar si el contenedor está listo para renderizar
  const [isReady, setIsReady] = useState(false);
  
  // Efectos para manejar eventos
  useEffect(() => {
    if (vertical && !loading && !error) {
      setIsReady(true);
      onLoad?.();
    }
  }, [vertical, loading, error, onLoad]);
  
  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);
  
  // Si todavía estamos cargando y no se especificó noFallback, mostrar un placeholder
  if (loading && !noFallback) {
    return fallback || (
      <div className={cn("p-6 space-y-4", className)} style={style}>
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }
  
  // Si hubo un error y no se especificó noFallback, mostrar mensaje de error
  if (error && !noFallback) {
    return (
      <div className={cn("p-6", className)} style={style}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error al cargar la vertical {verticalCode}: {error.message}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
            onClick={() => initialize({ forceRefresh: true })}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }
  
  // Si no se encontró la vertical y no se especificó noFallback, mostrar mensaje
  if (!vertical && !loading && !noFallback) {
    return (
      <div className={cn("p-6", className)} style={style}>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Vertical no encontrada: {verticalCode}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Si todo está bien, renderizar los children dentro del contexto de la vertical
  return (
    <div 
      className={cn("vertical-container", `vertical-${verticalCode}`, className)} 
      style={{
        ...style,
        // Aplicar colores personalizados de la vertical si existen
        ...(vertical?.colors ? {
          '--vertical-primary': vertical.colors.primary,
          '--vertical-secondary': vertical.colors.secondary,
          '--vertical-accent': vertical.colors.accent || vertical.colors.primary,
          '--vertical-background': vertical.colors.background || 'transparent'
        } : {})
      } as React.CSSProperties}
      data-vertical={verticalCode}
      data-vertical-ready={isReady}
    >
      {children}
    </div>
  );
}

/**
 * VerticalComponent - Componente para renderizar un componente específico de una vertical
 */
export function VerticalComponent<T = any>({
  verticalCode,
  componentName,
  props = {},
  fallback,
  noFallback = false
}: {
  verticalCode: string;
  componentName: string;
  props?: T;
  fallback?: ReactNode;
  noFallback?: boolean;
}) {
  // Usar el hook para obtener un componente específico de la vertical
  const { Component, loading, error } = useVerticalComponent<T>(verticalCode, componentName);
  
  // Si estamos cargando y no se especificó noFallback, mostrar un placeholder
  if (loading && !noFallback) {
    return fallback || <Skeleton className="h-32 w-full" />;
  }
  
  // Si hubo un error y no se especificó noFallback, mostrar mensaje de error
  if (error && !noFallback) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error al cargar el componente {componentName}: {error.message}
        </AlertDescription>
      </Alert>
    );
  }
  
  // Si no se encontró el componente y no se especificó noFallback, mostrar mensaje
  if (!Component && !noFallback) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Componente no encontrado: {componentName} en vertical {verticalCode}
        </AlertDescription>
      </Alert>
    );
  }
  
  // Si el componente existe, renderizarlo con las props
  return Component ? <Component {...props} /> : null;
}

/**
 * Hook para utilizar un componente específico de una vertical
 */
export function useVerticalComponent<T = any>(
  verticalCode: string,
  componentName: string
) {
  // Usar el hook useVertical para obtener la información de la vertical
  const { vertical, loading, error, getComponent } = useVertical(verticalCode);
  
  // Obtener el componente usando getComponent
  const Component = !loading && !error ? getComponent<T>(componentName) : null;
  
  return {
    Component,
    loading,
    error,
    vertical
  };
}
